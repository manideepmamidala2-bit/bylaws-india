"""Provenance gate and source verification (Rules R15 & R16)."""

from __future__ import annotations

import hashlib
import json
import re
import time
import tomllib
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any

import click
import yaml

from bylaws.config import JurisdictionConfig
from bylaws.root import get_deterministic_timestamp, resolve_repo_root

USER_AGENT = (
    "StructuredBuildingBylaws-Pipeline/1.2 "
    "(+https://bylaws-india.vercel.app; CC-BY-4.0)"
)

DEFAULT_PDF_CREATOR_PRODUCER_DENYLIST: tuple[str, ...] = (
    "fpdf",
    "pypdf",
    "reportlab",
    "structuredbuildingbylaws",
)

HEX64_RE = re.compile(r"^[a-f0-9]{64}$")
CREATOR_RE = re.compile(rb"/Creator\s*\(([^)]*)\)")
PRODUCER_RE = re.compile(rb"/Producer\s*\(([^)]*)\)")


class ProvenanceGateError(click.ClickException):
    """Raised when a repository or source file violates the R15/R16 provenance gate."""


def load_pdf_denylist(repo_root: Path | None = None) -> tuple[str, ...]:
    """Load the configurable PDF Creator/Producer denylist from `bylaws.toml`."""
    root = repo_root or resolve_repo_root()
    toml_path = root / "bylaws.toml"
    if not toml_path.is_file():
        return DEFAULT_PDF_CREATOR_PRODUCER_DENYLIST
    try:
        parsed = tomllib.loads(toml_path.read_text(encoding="utf-8"))
    except (OSError, tomllib.TOMLDecodeError):
        return DEFAULT_PDF_CREATOR_PRODUCER_DENYLIST
    prov = parsed.get("provenance")
    if isinstance(prov, dict):
        raw_list = prov.get("pdf_creator_producer_denylist")
        if isinstance(raw_list, list) and all(isinstance(x, str) for x in raw_list):
            return tuple(x.strip().lower() for x in raw_list if x.strip())
    return DEFAULT_PDF_CREATOR_PRODUCER_DENYLIST


def inspect_pdf_creator_producer(pdf_path: Path) -> tuple[str, str]:
    """Extract `(creator, producer)` metadata strings from a PDF file."""
    creator_parts: list[str] = []
    producer_parts: list[str] = []

    raw_bytes = pdf_path.read_bytes()
    for match in CREATOR_RE.finditer(raw_bytes):
        creator_parts.append(match.group(1).decode("latin-1", errors="ignore"))
    for match in PRODUCER_RE.finditer(raw_bytes):
        producer_parts.append(match.group(1).decode("latin-1", errors="ignore"))

    if raw_bytes.startswith(b"%PDF"):
        import pypdfium2 as pdfium

        try:
            doc = pdfium.PdfDocument(str(pdf_path))
            try:
                pdf_creator = doc.get_metadata_value("Creator") or ""
                pdf_producer = doc.get_metadata_value("Producer") or ""
                if pdf_creator and pdf_creator not in creator_parts:
                    creator_parts.append(pdf_creator)
                if pdf_producer and pdf_producer not in producer_parts:
                    producer_parts.append(pdf_producer)
            finally:
                doc.close()
        except (OSError, RuntimeError, ValueError, pdfium.PdfiumError) as exc:
            _ = exc

    return " ".join(creator_parts).strip(), " ".join(producer_parts).strip()


def assert_pdf_not_denylisted(
    pdf_path: Path, denylist: tuple[str, ...]
) -> None:
    """Raise `ProvenanceGateError` if `pdf_path` has a denylisted Creator or Producer."""
    creator, producer = inspect_pdf_creator_producer(pdf_path)
    combined = f"{creator} {producer}".lower()
    for token in denylist:
        if token.lower() in combined:
            raise ProvenanceGateError(
                f"Rule R15/R16 violation in '{pdf_path}': denylisted PDF creator/producer "
                f"matching {token!r} (Creator={creator!r}, Producer={producer!r})."
            )


def is_remote_http_url(url: str | None) -> bool:
    """Return True if and only if `url` is a valid `http://` or `https://` URL."""
    if not isinstance(url, str):
        return False
    cleaned = url.strip()
    if not cleaned.startswith(("http://", "https://")):
        return False
    parsed = urllib.parse.urlparse(cleaned)
    return bool(parsed.scheme in {"http", "https"} and parsed.netloc)


def validate_retrieval_record(retrieval: Any, context: str) -> None:
    """Validate that a `retrieval` dictionary meets all Rule R15 requirements."""
    if not isinstance(retrieval, dict):
        raise ProvenanceGateError(
            f"Rule R15 violation ({context}): missing a complete retrieval record."
        )

    for req_key in (
        "fetched_at",
        "requested_url",
        "final_url",
        "http_status",
        "response_headers",
        "sha256",
        "fetched_by",
    ):
        if req_key not in retrieval or retrieval[req_key] is None:
            raise ProvenanceGateError(
                f"Rule R15 violation ({context}): missing a complete retrieval record "
                f"(field '{req_key}' is missing or null)."
            )

    if not is_remote_http_url(retrieval.get("requested_url")):
        raise ProvenanceGateError(
            f"Rule R15 violation ({context}): retrieval.requested_url must be http(s)."
        )
    if not is_remote_http_url(retrieval.get("final_url")):
        raise ProvenanceGateError(
            f"Rule R15 violation ({context}): retrieval.final_url must be http(s)."
        )

    http_status = retrieval.get("http_status")
    if not isinstance(http_status, int) or http_status < 200 or http_status >= 400:
        raise ProvenanceGateError(
            f"Rule R15 violation ({context}): retrieval.http_status must be a 2xx/3xx integer, got {http_status!r}."
        )

    if not isinstance(retrieval.get("response_headers"), dict):
        raise ProvenanceGateError(
            f"Rule R15 violation ({context}): retrieval.response_headers must be an object."
        )

    sha256_val = str(retrieval.get("sha256") or "")
    if not HEX64_RE.match(sha256_val):
        raise ProvenanceGateError(
            f"Rule R15 violation ({context}): retrieval.sha256 is not a valid 64-char hex digest."
        )

    fetched_by = str(retrieval.get("fetched_by") or "").strip()
    if not fetched_by:
        raise ProvenanceGateError(
            f"Rule R15 violation ({context}): retrieval.fetched_by must be non-empty."
        )

    archive_url = str(retrieval.get("archive_url") or "").strip()
    archive_failure = str(retrieval.get("archive_failure_reason") or "").strip()
    if not archive_url and not archive_failure:
        raise ProvenanceGateError(
            f"Rule R15 violation ({context}): retrieval must record either archive_url or archive_failure_reason."
        )


def request_wayback_snapshot(target_url: str, timeout: int = 20) -> tuple[str | None, str | None]:
    """Resolve or request a Wayback Machine snapshot and return `(archive_url, archive_failure_reason)`."""
    if target_url.startswith(("https://web.archive.org/web/", "http://web.archive.org/web/")):
        return target_url, None

    avail_url = f"https://archive.org/wayback/available?url={urllib.parse.quote(target_url, safe='')}"
    avail_req = urllib.request.Request(avail_url, headers={"User-Agent": USER_AGENT}, method="GET")
    try:
        with urllib.request.urlopen(avail_req, timeout=timeout) as avail_resp:
            avail_data = json.loads(avail_resp.read().decode("utf-8", errors="ignore"))
            closest = (avail_data.get("archived_snapshots") or {}).get("closest") or {}
            if closest.get("available") and closest.get("url"):
                return str(closest["url"]), None
    except (OSError, urllib.error.URLError, ValueError, json.JSONDecodeError):
        pass

    save_url = f"https://web.archive.org/save/{target_url}"
    req = urllib.request.Request(
        save_url,
        headers={"User-Agent": USER_AGENT},
        method="GET",
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            content_loc = resp.headers.get("Content-Location") or resp.headers.get("Location")
            if content_loc:
                if content_loc.startswith("http"):
                    return content_loc, None
                return f"https://web.archive.org{content_loc}", None
            final = resp.geturl()
            if final and "web.archive.org" in final:
                return final, None
            return None, "Wayback response did not include a snapshot URL header"
    except (OSError, urllib.error.URLError, ValueError) as exc:
        return None, f"Wayback Machine Save Page Now failed: {exc}"


def fetch_remote_with_retrieval(
    url: str,
    *,
    fetched_by: str = "agent",
    request_wayback: bool = True,
    max_retries: int = 3,
    timeout: int = 60,
) -> tuple[bytes, dict[str, Any]]:
    """Fetch an `http(s)` URL with polite retries and build a complete R15 `retrieval` record."""
    if not is_remote_http_url(url):
        raise ProvenanceGateError(f"Cannot fetch non-http(s) URL: {url!r}")

    last_exc: Exception | None = None
    for attempt in range(1, max_retries + 1):
        req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
        try:
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                data: bytes = resp.read()
                final_url = resp.geturl() or url
                status_code = int(getattr(resp, "status", 200))
                headers = resp.headers
                content_type = headers.get("Content-Type")
                raw_len = headers.get("Content-Length")
                content_length = (
                    int(raw_len)
                    if raw_len and raw_len.isdigit()
                    else len(data)
                )
                response_headers: dict[str, str | None] = {
                    "etag": headers.get("ETag"),
                    "last_modified": headers.get("Last-Modified"),
                    "server": headers.get("Server"),
                    "date": headers.get("Date"),
                }
                sha256_hex = hashlib.sha256(data).hexdigest()
                if request_wayback:
                    archive_url, archive_failure_reason = request_wayback_snapshot(final_url)
                else:
                    archive_url = None
                    archive_failure_reason = "Wayback archival skipped in offline mode"

                retrieval: dict[str, Any] = {
                    "fetched_at": get_deterministic_timestamp(),
                    "requested_url": url,
                    "final_url": final_url,
                    "http_status": status_code,
                    "content_type": content_type,
                    "content_length": content_length,
                    "response_headers": response_headers,
                    "sha256": sha256_hex,
                    "archive_url": archive_url,
                    "archive_failure_reason": archive_failure_reason,
                    "fetched_by": fetched_by,
                }
                return data, retrieval
        except urllib.error.HTTPError as exc:
            last_exc = exc
            if exc.code < 500 or attempt == max_retries:
                break
            time.sleep(0.5 * attempt)
        except (OSError, urllib.error.URLError, ValueError) as exc:
            last_exc = exc
            if attempt == max_retries:
                break
            time.sleep(0.5 * attempt)

    raise click.ClickException(f"Failed to download '{url}': {last_exc}") from last_exc


def check_repository_provenance(repo_root: Path | None = None) -> None:
    """Enforce Rules R15 and R16 across all non-test jurisdictions, raw/data PDFs, and published manifests."""
    root = repo_root or resolve_repo_root()
    denylist = load_pdf_denylist(root)
    jurisdictions_dir = root / "jurisdictions"
    if not jurisdictions_dir.is_dir():
        return

    test_jurisdiction_ids: set[str] = set()
    public_jurisdiction_ids: set[str] = set()

    for yaml_path in sorted(jurisdictions_dir.glob("*.yaml")):
        raw = yaml.safe_load(yaml_path.read_text(encoding="utf-8"))
        if not isinstance(raw, dict):
            continue
        jur_id = str(raw.get("id") or yaml_path.stem)
        visibility = str(raw.get("visibility") or "public")
        if visibility == "test":
            test_jurisdiction_ids.add(jur_id)
            continue

        public_jurisdiction_ids.add(jur_id)
        raw_jur_dir = root / "data" / "raw" / jur_id

        for doc in raw.get("documents") or []:
            if not isinstance(doc, dict):
                continue
            doc_id = str(doc.get("id") or "<unknown>")
            src_url = str(doc.get("source_url") or "").strip()
            if not is_remote_http_url(src_url):
                raise ProvenanceGateError(
                    f"Rule R15 violation ({jur_id}:{doc_id}): non-test jurisdiction has "
                    f"local or non-http(s) source_url {src_url!r}."
                )

            tr = doc.get("text_rights")
            is_ref_only = isinstance(tr, dict) and tr.get("mode") == "reference_only"
            acq_status = str(doc.get("acquisition_status") or "acquired")
            if acq_status == "acquired" and not is_ref_only:
                retrieval = doc.get("retrieval")
                if retrieval is None:
                    meta_file = raw_jur_dir / f"{doc_id}.meta.json"
                    if meta_file.is_file():
                        meta_data = json.loads(meta_file.read_text(encoding="utf-8"))
                        retrieval = meta_data.get("retrieval")
                validate_retrieval_record(retrieval, f"{jur_id}:{doc_id}")

        maps = raw.get("maps")
        if isinstance(maps, dict):
            for group_name in ("boundaries", "planning_districts", "zoning", "overlays"):
                for m_entry in maps.get(group_name) or []:
                    if not isinstance(m_entry, dict):
                        continue
                    m_id = str(m_entry.get("id") or "<unknown>")
                    m_url = m_entry.get("source_url")
                    if m_url is not None and not is_remote_http_url(str(m_url)):
                        raise ProvenanceGateError(
                            f"Rule R15 violation ({jur_id}:maps.{group_name}.{m_id}): "
                            f"non-test map source has local or non-http(s) source_url {m_url!r}."
                        )

        if raw_jur_dir.is_dir():
            for pdf_path in sorted(raw_jur_dir.rglob("*.pdf")):
                assert_pdf_not_denylisted(pdf_path, denylist)

    # Also scan data/sources/ and public/data/ for any PDF in a non-test jurisdiction
    for scan_dir in (root / "data" / "sources", root / "public" / "data"):
        if not scan_dir.is_dir():
            continue
        for pdf_path in sorted(scan_dir.rglob("*.pdf")):
            if any(part in test_jurisdiction_ids for part in pdf_path.parts):
                continue
            assert_pdf_not_denylisted(pdf_path, denylist)


def verify_jurisdiction_sources(
    config: JurisdictionConfig,
    *,
    repo_root: Path | None = None,
) -> list[dict[str, Any]]:
    """Refetch each acquired HTTP(S) source for `config` and compare SHA-256 with the recorded digest."""
    root = repo_root or resolve_repo_root()
    raw_dir = root / "data" / "raw" / config.id
    results: list[dict[str, Any]] = []
    failures: list[str] = []

    for doc in config.documents:
        if doc.text_rights is not None and doc.text_rights.mode == "reference_only":
            continue
        acq_status = getattr(doc, "acquisition_status", None) or "acquired"
        if acq_status in {"pending", "not_found"}:
            results.append(
                {
                    "doc_id": doc.id,
                    "source_url": doc.source_url,
                    "status": f"skipped ({acq_status})",
                }
            )
            continue

        expected_sha: str | None = None
        if getattr(doc, "retrieval", None) is not None and doc.retrieval is not None:
            expected_sha = doc.retrieval.sha256
        meta_path = raw_dir / f"{doc.id}.meta.json"
        if not expected_sha and meta_path.is_file():
            meta_json = json.loads(meta_path.read_text(encoding="utf-8"))
            expected_sha = meta_json.get("sha256") or (
                (meta_json.get("retrieval") or {}).get("sha256")
            )

        if not expected_sha:
            failures.append(
                f"{doc.id}: no recorded SHA-256 found in config retrieval or {meta_path}"
            )
            continue

        try:
            live_bytes, _ = fetch_remote_with_retrieval(
                doc.source_url,
                request_wayback=False,
            )
        except click.ClickException as exc:
            failures.append(f"{doc.id} ({doc.source_url}): fetch failed: {exc}")
            continue

        live_sha = hashlib.sha256(live_bytes).hexdigest()
        if live_sha != expected_sha:
            failures.append(
                f"{doc.id} ({doc.source_url}): SHA-256 mismatch "
                f"(recorded={expected_sha}, live={live_sha})"
            )
        else:
            results.append(
                {
                    "doc_id": doc.id,
                    "source_url": doc.source_url,
                    "sha256": live_sha,
                    "status": "verified",
                }
            )

    if failures:
        raise ProvenanceGateError(
            f"Source verification failed for '{config.id}':\n- " + "\n- ".join(failures)
        )
    return results
