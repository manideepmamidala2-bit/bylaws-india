"""Stage 8.8: Package release artifacts (.zip, SHA256SUMS, manifest.json) and publish to local or Blob."""

from __future__ import annotations

import hashlib
import io
import json
import os
import urllib.request
import zipfile
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

import click

from bylaws.config import JurisdictionConfig
from bylaws.root import resolve_repo_root
from bylaws.schema_validator import validate_payload

SYNTHETIC_TIMESTAMP = "2026-11-23T00:00:00Z"
FIXED_ZIP_DATE_TIME = (2026, 1, 1, 0, 0, 0)


def _sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def _build_deterministic_zip(files_map: dict[str, bytes]) -> bytes:
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, mode="w", compression=zipfile.ZIP_DEFLATED) as zf:
        for filename in sorted(files_map):
            info = zipfile.ZipInfo(filename=filename, date_time=FIXED_ZIP_DATE_TIME)
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o644 << 16
            zf.writestr(info, files_map[filename])
    return buffer.getvalue()


def _collect_release_artifacts(
    config: JurisdictionConfig,
    root: Path,
) -> tuple[dict[str, bytes], list[str], list[str]]:
    """Collect release file bytes and return `(artifact_bytes, in_force_clause_files, draft_clause_files)`."""
    raw_dir = root / "data" / "raw" / config.id
    processed_dir = root / "data" / "processed" / config.id
    docs_dir = processed_dir / "documents"

    documents_list: list[dict[str, Any]] = []
    for doc in config.documents:
        meta_path = raw_dir / f"{doc.id}.meta.json"
        if not meta_path.is_file():
            raise click.ClickException(
                f"Cannot publish '{config.id}': missing '{meta_path}'."
            )
        documents_list.append(json.loads(meta_path.read_text(encoding="utf-8")))

    artifacts: dict[str, bytes] = {
        "documents.json": (json.dumps(documents_list, indent=2) + "\n").encode("utf-8"),
    }

    in_force_clause_files: list[str] = []
    draft_clause_files: list[str] = []

    for doc in config.documents:
        if doc.role not in {"base", "amendment", "regulation"}:
            continue
        clause_filename = f"{doc.id}.clauses.json"
        clause_path = docs_dir / clause_filename
        if not clause_path.is_file():
            raise click.ClickException(
                f"Cannot publish '{config.id}': missing '{clause_path}'."
            )
        artifacts[clause_filename] = clause_path.read_bytes()
        if doc.legal_status == "draft":
            draft_clause_files.append(clause_filename)
        else:
            in_force_clause_files.append(clause_filename)

    for required_name in ("amendments.json", "zones.geojson", "boundary.geojson", "declarations.json"):
        src_path = processed_dir / required_name
        if not src_path.is_file():
            raise click.ClickException(
                f"Cannot publish '{config.id}': missing required processed file '{src_path}'."
            )
        artifacts[required_name] = src_path.read_bytes()

    return artifacts, in_force_clause_files, draft_clause_files


def _upload_to_vercel_blob(pathname: str, content: bytes, token: str) -> str:
    url = f"https://blob.vercel-storage.com/{pathname.lstrip('/')}"
    req = urllib.request.Request(
        url,
        data=content,
        method="PUT",
        headers={
            "Authorization": f"Bearer {token}",
            "x-api-version": "7",
            "x-add-random-suffix": "0",
            "Content-Type": "application/octet-stream",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            payload: dict[str, Any] = json.loads(resp.read().decode("utf-8"))
            return str(payload.get("url") or url)
    except Exception as exc:
        raise click.ClickException(f"Vercel Blob upload failed for '{pathname}': {exc}") from exc


def _trigger_deploy_hook(hook_url: str) -> None:
    req = urllib.request.Request(hook_url, data=b"", method="POST")
    try:
        with urllib.request.urlopen(req, timeout=30):
            pass
    except Exception as exc:
        raise click.ClickException(f"Failed to trigger VERCEL_DEPLOY_HOOK_URL: {exc}") from exc


def run_publish(
    config: JurisdictionConfig,
    *,
    dry_run: bool = False,
    target: str | None = None,
    release_version: str = "0.1.0",
    repo_root: Path | None = None,
) -> None:
    """Publish processed jurisdiction datasets and update manifest.json."""
    root = repo_root or resolve_repo_root()
    resolved_target = (target or os.environ.get("DATA_TARGET") or "local").strip().lower()
    if resolved_target not in {"local", "blob"}:
        raise click.ClickException(
            f"Unsupported publish target '{resolved_target}'. Expected 'local' or 'blob'."
        )

    artifacts, in_force_clauses, draft_clauses = _collect_release_artifacts(config, root)

    zip_filename = f"{config.id}-{release_version}.zip"
    zip_bytes = _build_deterministic_zip(artifacts)
    all_release_files: dict[str, bytes] = {
        **artifacts,
        zip_filename: zip_bytes,
    }

    sha_lines = [
        f"{_sha256_bytes(all_release_files[fname])}  {fname}"
        for fname in sorted(all_release_files)
    ]
    all_release_files["SHA256SUMS"] = ("\n".join(sha_lines) + "\n").encode("utf-8")

    url_prefix = f"/data/{config.id}/{release_version}"
    released_at = (
        SYNTHETIC_TIMESTAMP
        if config.country == "XX"
        else datetime.now(UTC).strftime("%Y-%m-%dT%H:%M:%SZ")
    )
    changelog = (
        "Initial synthetic test dataset release."
        if config.country == "XX"
        else f"Release {release_version} for {config.name}."
    )

    release_entry: dict[str, Any] = {
        "version": release_version,
        "released_at": released_at,
        "licence": "CC-BY-4.0",
        "download_zip": f"{url_prefix}/{zip_filename}",
        "sha256sums": f"{url_prefix}/SHA256SUMS",
        "declarations": f"{url_prefix}/declarations.json",
        "files": {
            "documents": f"{url_prefix}/documents.json",
            "clauses": [f"{url_prefix}/{fname}" for fname in in_force_clauses],
            "amendments": f"{url_prefix}/amendments.json",
            "zones": f"{url_prefix}/zones.geojson",
            "boundary": f"{url_prefix}/boundary.geojson",
            "review_images": [],
        },
        "drafts": {
            "clauses": [f"{url_prefix}/{fname}" for fname in draft_clauses],
        },
        "changelog": changelog,
    }

    public_data_dir = root / "public" / "data"
    manifest_path = public_data_dir / "manifest.json"

    existing_jurisdictions: list[dict[str, Any]] = []
    if manifest_path.is_file():
        try:
            raw_manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
            if isinstance(raw_manifest, dict) and raw_manifest.get("schema_version") == "1.1":
                for entry in raw_manifest.get("jurisdictions", []):
                    if (
                        isinstance(entry, dict)
                        and entry.get("id") not in {config.id, "_fixture-test"}
                    ):
                        existing_jurisdictions.append(entry)
        except (OSError, json.JSONDecodeError):
            existing_jurisdictions = []

    jurisdiction_manifest_entry: dict[str, Any] = {
        "id": config.id,
        "name": config.name,
        "aliases": list(config.aliases or []),
        "latest_release": release_version,
        "releases": [release_entry],
    }

    manifest_payload: dict[str, Any] = {
        "schema_version": "1.1",
        "jurisdictions": [*existing_jurisdictions, jurisdiction_manifest_entry],
    }
    validate_payload(manifest_payload, "manifest", source=str(manifest_path))

    if dry_run:
        for fname in sorted(all_release_files):
            click.echo(f"[publish:dry-run] Would write {url_prefix}/{fname}")
        click.echo("[publish:dry-run] Would update /data/manifest.json")
        return

    if resolved_target == "local":
        release_dir = public_data_dir / config.id / release_version
        release_dir.mkdir(parents=True, exist_ok=True)
        for fname, content in sorted(all_release_files.items()):
            (release_dir / fname).write_bytes(content)
        manifest_path.parent.mkdir(parents=True, exist_ok=True)
        manifest_path.write_text(
            json.dumps(manifest_payload, indent=2) + "\n",
            encoding="utf-8",
        )
        click.echo(
            f"[publish:local] Published {len(all_release_files)} file(s) to "
            f"'{release_dir.relative_to(root)}' and updated '{manifest_path.relative_to(root)}'."
        )
        return

    blob_token = os.environ.get("BLOB_READ_WRITE_TOKEN", "").strip()
    if not blob_token:
        raise click.ClickException(
            "BLOB_READ_WRITE_TOKEN is required when publishing with --target blob."
        )

    for fname, content in sorted(all_release_files.items()):
        _upload_to_vercel_blob(f"data/{config.id}/{release_version}/{fname}", content, blob_token)

    manifest_bytes = (json.dumps(manifest_payload, indent=2) + "\n").encode("utf-8")
    _upload_to_vercel_blob("data/manifest.json", manifest_bytes, blob_token)

    deploy_hook = os.environ.get("VERCEL_DEPLOY_HOOK_URL", "").strip()
    if deploy_hook:
        _trigger_deploy_hook(deploy_hook)

    click.echo(
        f"[publish:blob] Uploaded {len(all_release_files)} file(s) and manifest.json for '{config.id}'."
    )
