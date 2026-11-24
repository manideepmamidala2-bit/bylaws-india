"""Stage 8.8: Package release artifacts (.zip, SHA256SUMS, sources.json/csv, manifest.json) and publish."""

from __future__ import annotations

import csv
import hashlib
import io
import json
import os
import urllib.request
import zipfile
from pathlib import Path
from typing import Any

import click

from bylaws.acquire import _build_unacquired_document_payload
from bylaws.config import JurisdictionConfig
from bylaws.root import (
    get_deterministic_timestamp,
    get_deterministic_zip_date_time,
    resolve_repo_root,
)
from bylaws.schema_validator import validate_payload
from bylaws.structure import is_structurable_document


def _sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def _build_deterministic_zip(files_map: dict[str, bytes]) -> bytes:
    zip_dt = get_deterministic_zip_date_time()
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, mode="w", compression=zipfile.ZIP_DEFLATED) as zf:
        for filename in sorted(files_map):
            info = zipfile.ZipInfo(filename=filename, date_time=zip_dt)
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o644 << 16
            zf.writestr(info, files_map[filename])
    return buffer.getvalue()


def _build_sources_exports(documents_list: list[dict[str, Any]]) -> tuple[bytes, bytes]:
    """Generate `sources.json` and `sources.csv` bytes from the document metadata list."""
    sources_json_bytes = (json.dumps(documents_list, indent=2) + "\n").encode("utf-8")

    csv_buf = io.StringIO()
    fieldnames = [
        "doc_id",
        "title",
        "layer",
        "doc_type",
        "issuing_authority",
        "notification_number",
        "notified_date",
        "effective_from",
        "legal_status",
        "text_rights_mode",
        "official_url",
        "source_url",
        "sha256",
    ]
    writer = csv.DictWriter(csv_buf, fieldnames=fieldnames, lineterminator="\n")
    writer.writeheader()
    for doc in documents_list:
        tr = doc.get("text_rights") or {}
        writer.writerow(
            {
                "doc_id": doc.get("doc_id") or "",
                "title": doc.get("title") or "",
                "layer": doc.get("layer") or "",
                "doc_type": doc.get("doc_type") or doc.get("role") or "",
                "issuing_authority": doc.get("issuing_authority") or "",
                "notification_number": doc.get("notification_number") or "",
                "notified_date": doc.get("notified_date") or "",
                "effective_from": doc.get("effective_from") or "",
                "legal_status": doc.get("legal_status") or "",
                "text_rights_mode": tr.get("mode") if isinstance(tr, dict) else "full_text",
                "official_url": doc.get("official_url") or "",
                "source_url": doc.get("source_url") or "",
                "sha256": doc.get("sha256") or "",
            }
        )
    sources_csv_bytes = csv_buf.getvalue().encode("utf-8")
    return sources_json_bytes, sources_csv_bytes


def _collect_release_artifacts(
    config: JurisdictionConfig,
    root: Path,
) -> tuple[dict[str, bytes], list[str], list[str], list[str]]:
    """Collect release file bytes and return `(artifact_bytes, in_force_clause_files, in_force_annotation_files, draft_clause_files)`."""
    raw_dir = root / "data" / "raw" / config.id
    processed_dir = root / "data" / "processed" / config.id
    docs_dir = processed_dir / "documents"

    documents_list: list[dict[str, Any]] = []
    for doc in config.documents:
        meta_path = raw_dir / f"{doc.id}.meta.json"
        acq_status = getattr(doc, "acquisition_status", None) or "acquired"
        if not meta_path.is_file():
            if acq_status in {"pending", "not_found"}:
                documents_list.append(_build_unacquired_document_payload(doc))
                continue
            raise click.ClickException(
                f"Cannot publish '{config.id}': missing '{meta_path}'."
            )
        documents_list.append(json.loads(meta_path.read_text(encoding="utf-8")))

    sources_json_bytes, sources_csv_bytes = _build_sources_exports(documents_list)

    artifacts: dict[str, bytes] = {
        "documents.json": (json.dumps(documents_list, indent=2) + "\n").encode("utf-8"),
        "sources.json": sources_json_bytes,
        "sources.csv": sources_csv_bytes,
    }

    in_force_clause_files: list[str] = []
    in_force_annotation_files: list[str] = []
    draft_clause_files: list[str] = []

    for doc in config.documents:
        if not is_structurable_document(doc):
            continue
        clause_filename = f"{doc.id}.clauses.json"
        clause_path = docs_dir / clause_filename
        if not clause_path.is_file():
            raise click.ClickException(
                f"Cannot publish '{config.id}': missing '{clause_path}'."
            )
        artifacts[clause_filename] = clause_path.read_bytes()
        ann_filename = f"{doc.id}.annotations.json"
        ann_path = docs_dir / ann_filename
        if ann_path.is_file():
            artifacts[ann_filename] = ann_path.read_bytes()
            if doc.legal_status != "draft":
                in_force_annotation_files.append(ann_filename)
        if doc.legal_status == "draft":
            draft_clause_files.append(clause_filename)
        else:
            in_force_clause_files.append(clause_filename)

    for required_name in (
        "amendments.json",
        "zones.geojson",
        "boundary.geojson",
        "declarations.json",
    ):
        src_path = processed_dir / required_name
        if not src_path.is_file():
            raise click.ClickException(
                f"Cannot publish '{config.id}': missing required processed file '{src_path}'."
            )
        artifacts[required_name] = src_path.read_bytes()

    for optional_name in (
        "consolidated.json",
        "geo-layers.json",
        "clause-zone-tags.json",
        "gba-zones.geojson",
        "wards.geojson",
        "planning-districts.geojson",
        "overlays.geojson",
    ):
        opt_path = processed_dir / optional_name
        if opt_path.is_file():
            artifacts[optional_name] = opt_path.read_bytes()

    return (
        artifacts,
        in_force_clause_files,
        in_force_annotation_files,
        draft_clause_files,
    )


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
    release_version: str | None = None,
    repo_root: Path | None = None,
) -> None:
    """Publish processed jurisdiction datasets and update manifest.json safely."""
    resolved_version = (
        release_version
        or getattr(config, "release_version", None)
        or ""
    ).strip()
    if not resolved_version:
        raise click.ClickException(
            f"Cannot publish '{config.id}': 'release_version' is absent in jurisdiction configuration."
        )
    release_version = resolved_version
    root = repo_root or resolve_repo_root()
    resolved_target = (target or os.environ.get("DATA_TARGET") or "local").strip().lower()
    if resolved_target not in {"local", "blob"}:
        raise click.ClickException(
            f"Unsupported publish target '{resolved_target}'. Expected 'local' or 'blob'."
        )

    artifacts, in_force_clauses, in_force_annotations, draft_clauses = (
        _collect_release_artifacts(config, root)
    )

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
    released_at = get_deterministic_timestamp()
    changelog = f"Release {release_version} for {config.name}."

    files_entry: dict[str, Any] = {
        "documents": f"{url_prefix}/documents.json",
        "clauses": [f"{url_prefix}/{fname}" for fname in in_force_clauses],
        "annotations": [f"{url_prefix}/{fname}" for fname in in_force_annotations],
        "amendments": f"{url_prefix}/amendments.json",
        "zones": f"{url_prefix}/zones.geojson",
        "boundary": f"{url_prefix}/boundary.geojson",
        "sources_json": f"{url_prefix}/sources.json",
        "sources_csv": f"{url_prefix}/sources.csv",
        "review_images": [],
    }
    optional_file_keys = (
        ("consolidated", "consolidated.json"),
        ("geo_layers", "geo-layers.json"),
        ("clause_zone_tags", "clause-zone-tags.json"),
        ("gba_zones", "gba-zones.geojson"),
        ("wards", "wards.geojson"),
        ("planning_districts", "planning-districts.geojson"),
        ("overlays", "overlays.geojson"),
    )
    for manifest_key, filename in optional_file_keys:
        if filename in artifacts:
            files_entry[manifest_key] = f"{url_prefix}/{filename}"

    release_entry: dict[str, Any] = {
        "version": release_version,
        "status": "published",
        "released_at": released_at,
        "licence": str(config.licence or "CC BY 4.0"),
        "download_zip": f"{url_prefix}/{zip_filename}",
        "sha256sums": f"{url_prefix}/SHA256SUMS",
        "declarations": f"{url_prefix}/declarations.json",
        "files": files_entry,
        "drafts": {
            "clauses": [f"{url_prefix}/{fname}" for fname in draft_clauses],
        },
        "changelog": changelog,
    }

    public_data_dir = root / "public" / "data"
    manifest_path = public_data_dir / "manifest.json"

    other_jurisdictions: list[dict[str, Any]] = []
    existing_releases_for_current: list[dict[str, Any]] = []
    existing_register_docs: str | None = None

    if manifest_path.exists():
        try:
            raw_manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as exc:
            raise click.ClickException(
                f"Failed to read or parse existing manifest at '{manifest_path}': {exc}"
            ) from exc

        if not isinstance(raw_manifest, dict) or not isinstance(
            raw_manifest.get("jurisdictions"), list
        ):
            raise click.ClickException(
                f"Existing manifest at '{manifest_path}' is malformed: expected object with 'jurisdictions' list."
            )

        for entry in raw_manifest["jurisdictions"]:
            if not isinstance(entry, dict) or not entry.get("id"):
                raise click.ClickException(
                    f"Existing manifest at '{manifest_path}' contains malformed jurisdiction entry."
                )
            if entry["id"] == config.id:
                if isinstance(entry.get("register_documents"), str):
                    existing_register_docs = str(entry["register_documents"])
                for rel in entry.get("releases") or []:
                    if isinstance(rel, dict) and rel.get("version") != release_version:
                        existing_releases_for_current.append(rel)
            else:
                other_jurisdictions.append(entry)

    if not existing_register_docs and (public_data_dir / config.id / "register" / "documents.json").is_file():
        existing_register_docs = f"/data/{config.id}/register/documents.json"

    jurisdiction_manifest_entry: dict[str, Any] = {
        "id": config.id,
        "name": config.name,
        "aliases": list(config.aliases or []),
        "visibility": str(config.visibility or "public"),
        "latest_release": release_version,
        "releases": [*existing_releases_for_current, release_entry],
    }
    if existing_register_docs:
        jurisdiction_manifest_entry["register_documents"] = existing_register_docs

    manifest_payload: dict[str, Any] = {
        "schema_version": "1.3",
        "jurisdictions": [*other_jurisdictions, jurisdiction_manifest_entry],
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
