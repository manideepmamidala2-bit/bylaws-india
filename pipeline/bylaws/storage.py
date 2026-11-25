"""Content-addressed storage, HTTP 206 Range + CORS verification, and object-storage sync (Part 1 §3–§4)."""

from __future__ import annotations

import hashlib
import http.server
import os
import re
import socketserver
import tarfile
import threading
import urllib.error
import urllib.request
from collections.abc import Iterator
from contextlib import contextmanager
from pathlib import Path
from typing import Any

RANGE_HEADER_RE = re.compile(r"^bytes=(\d+)-(\d*)$")
PMTILES_V3_MAGIC = b"PMTiles\x03"

CORS_HEADERS: dict[str, str] = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
    "Access-Control-Allow-Headers": "Range, If-None-Match, Content-Type",
    "Access-Control-Expose-Headers": "Content-Range, Content-Length, Accept-Ranges, ETag",
    "Accept-Ranges": "bytes",
}


def compute_sha256_bytes(data: bytes) -> str:
    """Return the hex SHA-256 digest of `data`."""
    return hashlib.sha256(data).hexdigest()


def compute_sha256_file(path: Path) -> str:
    """Return the hex SHA-256 digest of a file on disk."""
    hasher = hashlib.sha256()
    with path.open("rb") as handle:
        while chunk := handle.read(65536):
            hasher.update(chunk)
    return hasher.hexdigest()


class RangeCORSRequestHandler(http.server.SimpleHTTPRequestHandler):
    """Static HTTP handler supporting RFC 9110 `Range: bytes=...` (`206 Partial Content`) and CORS."""

    def __init__(self, *args: Any, directory: str | None = None, **kwargs: Any) -> None:
        super().__init__(*args, directory=directory, **kwargs)

    def log_message(self, format: str, *args: Any) -> None:
        return

    def _send_cors_headers(self) -> None:
        for key, value in CORS_HEADERS.items():
            self.send_header(key, value)

    def do_OPTIONS(self) -> None:
        self.send_response(204)
        self._send_cors_headers()
        self.end_headers()

    def do_HEAD(self) -> None:
        self._handle_request(send_body=False)

    def do_GET(self) -> None:
        self._handle_request(send_body=True)

    def _handle_request(self, *, send_body: bool) -> None:
        fs_path = Path(self.translate_path(self.path))
        if not fs_path.is_file():
            self.send_response(404)
            self._send_cors_headers()
            self.end_headers()
            return

        file_size = fs_path.stat().st_size
        ctype = self.guess_type(str(fs_path))
        if fs_path.suffix == ".pmtiles":
            ctype = "application/vnd.pmtiles"
        elif fs_path.suffix == ".geojson":
            ctype = "application/geo+json"

        range_header = self.headers.get("Range")
        if range_header:
            match = RANGE_HEADER_RE.match(range_header.strip())
            if not match:
                self.send_response(416)
                self._send_cors_headers()
                self.send_header("Content-Range", f"bytes */{file_size}")
                self.end_headers()
                return

            start = int(match.group(1))
            end_str = match.group(2)
            end = int(end_str) if end_str else file_size - 1
            if start >= file_size or end < start:
                self.send_response(416)
                self._send_cors_headers()
                self.send_header("Content-Range", f"bytes */{file_size}")
                self.end_headers()
                return

            end = min(end, file_size - 1)
            length = end - start + 1

            self.send_response(206, "Partial Content")
            self._send_cors_headers()
            self.send_header("Content-Type", ctype)
            self.send_header("Content-Range", f"bytes {start}-{end}/{file_size}")
            self.send_header("Content-Length", str(length))
            self.end_headers()

            if send_body:
                with fs_path.open("rb") as handle:
                    handle.seek(start)
                    self.wfile.write(handle.read(length))
            return

        self.send_response(200)
        self._send_cors_headers()
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(file_size))
        self.end_headers()
        if send_body:
            with fs_path.open("rb") as handle:
                while chunk := handle.read(65536):
                    self.wfile.write(chunk)


class _ThreadedTCPServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
    allow_reuse_address = True
    daemon_threads = True


@contextmanager
def serve_directory_with_range_and_cors(directory: Path) -> Iterator[str]:
    """Start an ephemeral background HTTP server with Range (`206`) and CORS support and yield its base URL."""
    dir_str = str(directory.resolve())

    def handler_factory(*args: Any, **kwargs: Any) -> RangeCORSRequestHandler:
        return RangeCORSRequestHandler(*args, directory=dir_str, **kwargs)

    server = _ThreadedTCPServer(("127.0.0.1", 0), handler_factory)
    host, port = server.server_address[:2]
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        yield f"http://{host}:{port}"
    finally:
        server.shutdown()
        server.server_close()
        thread.join(timeout=2.0)


def verify_range_and_cors(
    url: str,
    *,
    byte_start: int = 0,
    byte_end: int = 511,
    expected_magic: bytes | None = None,
    origin: str = "https://bylaws-india.vercel.app",
) -> dict[str, Any]:
    """Verify that `url` supports HTTP 206 Range requests and CORS headers."""
    expected_length = byte_end - byte_start + 1

    # 1. Verify OPTIONS preflight
    opt_req = urllib.request.Request(
        url,
        method="OPTIONS",
        headers={
            "Origin": origin,
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "Range",
        },
    )
    try:
        with urllib.request.urlopen(opt_req, timeout=15) as opt_resp:
            opt_status = opt_resp.status
            opt_acao = opt_resp.headers.get("Access-Control-Allow-Origin")
    except urllib.error.HTTPError as exc:
        opt_status = exc.code
        opt_acao = exc.headers.get("Access-Control-Allow-Origin") if exc.headers else None

    # 2. Verify GET with Range header
    get_req = urllib.request.Request(
        url,
        method="GET",
        headers={
            "Range": f"bytes={byte_start}-{byte_end}",
            "Origin": origin,
        },
    )
    with urllib.request.urlopen(get_req, timeout=30) as resp:
        status = resp.status
        body = resp.read()
        headers = {k.lower(): v for k, v in resp.headers.items()}

    if status != 206:
        raise ValueError(f"Expected HTTP 206 Partial Content from {url}, got {status}")

    content_range = headers.get("content-range", "")
    expected_prefix = f"bytes {byte_start}-{byte_end}/"
    if not content_range.startswith(expected_prefix):
        raise ValueError(
            f"Expected Content-Range starting with {expected_prefix!r}, got {content_range!r}"
        )

    accept_ranges = headers.get("accept-ranges", "")
    if "bytes" not in accept_ranges.lower():
        raise ValueError(f"Expected Accept-Ranges: bytes, got {accept_ranges!r}")

    if len(body) != expected_length:
        raise ValueError(f"Expected {expected_length} bytes in range response, got {len(body)}")

    acao = headers.get("access-control-allow-origin") or opt_acao
    if not acao:
        raise ValueError(f"Missing Access-Control-Allow-Origin header on {url}")

    expose = headers.get("access-control-expose-headers", "").lower()
    for required_exposed in ("content-range", "content-length", "accept-ranges"):
        if required_exposed not in expose:
            raise ValueError(
                f"Access-Control-Expose-Headers missing '{required_exposed}': {expose!r}"
            )

    if expected_magic is not None and not body.startswith(expected_magic):
        raise ValueError(
            f"Range payload from {url} did not start with expected magic {expected_magic!r}"
        )

    return {
        "url": url,
        "status": status,
        "options_status": opt_status,
        "content_range": content_range,
        "content_length": len(body),
        "access_control_allow_origin": acao,
        "access_control_expose_headers": headers.get("access-control-expose-headers", ""),
        "sha256_slice": compute_sha256_bytes(body),
    }


def build_storage_bundle_tar_gz(public_data_dir: Path, output_tar_gz: Path) -> dict[str, Any]:
    """Create a deterministic compressed archive of non-test published data and PMTiles for object storage."""
    import json

    output_tar_gz.parent.mkdir(parents=True, exist_ok=True)
    test_ids: set[str] = set()
    manifest_file = public_data_dir / "manifest.json"
    if manifest_file.is_file():
        manifest_data = json.loads(manifest_file.read_text(encoding="utf-8"))
        for jur in manifest_data.get("jurisdictions") or []:
            if isinstance(jur, dict) and jur.get("visibility") == "test":
                test_ids.add(str(jur.get("id") or ""))

    file_count = 0
    total_bytes = 0
    with tarfile.open(output_tar_gz, "w:gz") as tf:
        for path in sorted(public_data_dir.rglob("*")):
            if not path.is_file():
                continue
            rel = path.relative_to(public_data_dir)
            if rel.parts[0] in test_ids or rel.name == "manifest.json":
                continue
            tf.add(path, arcname=str(rel))
            file_count += 1
            total_bytes += path.stat().st_size
    archive_bytes = output_tar_gz.stat().st_size
    return {
        "archive_path": str(output_tar_gz),
        "file_count": file_count,
        "uncompressed_bytes": total_bytes,
        "compressed_bytes": archive_bytes,
        "sha256": compute_sha256_file(output_tar_gz),
    }


def extract_storage_bundle_tar_gz(archive_path: Path, public_data_dir: Path) -> int:
    """Extract a storage bundle archive into `public/data/` safely."""
    public_data_dir.mkdir(parents=True, exist_ok=True)
    extracted = 0
    with tarfile.open(archive_path, "r:gz") as tf:
        for member in tf.getmembers():
            if member.name.startswith("/") or ".." in Path(member.name).parts:
                raise ValueError(f"Unsafe tar member path: {member.name}")
            tf.extract(member, path=public_data_dir, filter="data")
            if member.isfile():
                extracted += 1
    return extracted


def resolve_storage_provider() -> str:
    """Return the active object storage provider based on environment variables."""
    if os.environ.get("VERCEL_BLOB_READ_WRITE_TOKEN"):
        return "vercel_blob"
    if os.environ.get("R2_ENDPOINT_URL") or os.environ.get("S3_ENDPOINT_URL"):
        return "cloudflare_r2"
    return "github_release"


def get_repo_root() -> Path:
    return Path(__file__).resolve().parents[2]
