"""Stage 8.1: Acquire raw documents and boundary layers with SHA-256 verification."""

from __future__ import annotations

import hashlib
import json
import urllib.parse
import urllib.request
from datetime import UTC, datetime
from pathlib import Path

import click
import pypdfium2 as pdfium

from bylaws.config import DocumentConfig, JurisdictionConfig
from bylaws.geo.boundaries import extract_boundary_feature
from bylaws.root import PACKAGE_REPO_ROOT, resolve_local_source_path, resolve_repo_root
from bylaws.schema_validator import validate_payload

SYNTHETIC_TIMESTAMP = "2026-11-23T00:00:00Z"


def resolve_local_or_remote_bytes(source_url: str, repo_root: Path) -> bytes:
    """Read bytes from a repo-relative path, `file://` URL, or `http(s)://` URL."""
    if source_url.startswith("file://"):
        parsed = urllib.parse.urlparse(source_url)
        file_path = Path(urllib.parse.unquote(parsed.path))
        if not file_path.is_file():
            raise click.ClickException(f"Source file not found: {file_path}")
        return file_path.read_bytes()

    if source_url.startswith(("http://", "https://")):
        try:
            with urllib.request.urlopen(source_url, timeout=60) as response:
                data: bytes = response.read()
                return data
        except Exception as exc:
            raise click.ClickException(
                f"Failed to download '{source_url}': {exc}"
            ) from exc

    candidate = (repo_root / source_url).resolve()
    if candidate.is_file():
        return candidate.read_bytes()

    fallback = (PACKAGE_REPO_ROOT / source_url).resolve()
    if fallback.is_file():
        return fallback.read_bytes()

    raise click.ClickException(
        f"Source file '{source_url}' not found under '{repo_root}'."
    )


def _inspect_pdf(pdf_path: Path) -> tuple[int, bool]:
    """Return `(page_count, is_scanned)` for a PDF using `pypdfium2`."""
    doc = pdfium.PdfDocument(str(pdf_path))
    try:
        page_count = len(doc)
        total_chars = 0
        for idx in range(page_count):
            page = doc[idx]
            textpage = page.get_textpage()
            total_chars += len(textpage.get_text_range().strip())
            textpage.close()
            page.close()
        is_scanned = total_chars == 0
        return page_count, is_scanned
    finally:
        doc.close()


def _acquire_single_document(
    doc: DocumentConfig,
    config: JurisdictionConfig,
    raw_dir: Path,
    repo_root: Path,
) -> dict[str, object]:
    raw_bytes = resolve_local_or_remote_bytes(doc.source_url, repo_root)
    sha256_hex = hashlib.sha256(raw_bytes).hexdigest()

    pdf_path = raw_dir / f"{doc.id}.pdf"
    meta_path = raw_dir / f"{doc.id}.meta.json"

    retrieved_at = (
        SYNTHETIC_TIMESTAMP
        if config.country == "XX"
        else datetime.now(UTC).strftime("%Y-%m-%dT%H:%M:%SZ")
    )

    if pdf_path.is_file():
        existing_sha = hashlib.sha256(pdf_path.read_bytes()).hexdigest()
        if existing_sha != sha256_hex:
            raise click.ClickException(
                f"Rule R5 violation: existing raw file '{pdf_path}' SHA-256 "
                f"({existing_sha}) does not match source ({sha256_hex})."
            )
        if meta_path.is_file():
            existing_meta = json.loads(meta_path.read_text(encoding="utf-8"))
            if existing_meta.get("sha256") != existing_sha:
                raise click.ClickException(
                    f"Rule R5 violation: '{meta_path}' sha256 does not match '{pdf_path}'."
                )
            if isinstance(existing_meta.get("retrieved_at"), str):
                retrieved_at = existing_meta["retrieved_at"]
    else:
        pdf_path.write_bytes(raw_bytes)

    page_count, is_scanned = _inspect_pdf(pdf_path)

    meta_payload: dict[str, object] = {
        "schema_version": "1.1",
        "doc_id": doc.id,
        "title": doc.title,
        "issuing_authority": doc.issuing_authority,
        "layer": doc.layer,
        "role": doc.role,
        "legal_status": doc.legal_status,
        "status_evidence": {
            "url": doc.status_evidence.url,
            "description": doc.status_evidence.description,
        },
        "licence_or_terms": doc.licence_or_terms,
        "notified_date": doc.notified_date,
        "effective_from": doc.effective_from,
        "amends": list(doc.amends or []),
        "supersedes": list(doc.supersedes or []),
        "source_url": doc.source_url,
        "retrieved_at": retrieved_at,
        "sha256": sha256_hex,
        "bytes": len(raw_bytes),
        "page_count": page_count,
        "is_scanned": is_scanned,
    }

    validate_payload(meta_payload, "document", source=str(meta_path))
    meta_path.write_text(json.dumps(meta_payload, indent=2) + "\n", encoding="utf-8")
    return meta_payload


def run_acquire(config: JurisdictionConfig, *, repo_root: Path | None = None) -> None:
    """Acquire documents and boundary files for a validated jurisdiction config."""
    root = repo_root or resolve_repo_root()
    raw_dir = root / "data" / "raw" / config.id
    processed_dir = root / "data" / "processed" / config.id
    raw_dir.mkdir(parents=True, exist_ok=True)
    processed_dir.mkdir(parents=True, exist_ok=True)

    for doc in config.documents:
        _acquire_single_document(doc, config, raw_dir, root)

    all_boundary_features: list[dict[str, object]] = []
    for boundary_cfg in config.maps.boundaries:
        source_path = resolve_local_source_path(boundary_cfg.source_url, root)
        fc = extract_boundary_feature(
            source_path,
            boundary_cfg.select.property,
            boundary_cfg.select.equals,
        )
        all_boundary_features.extend(fc["features"])

    boundary_path = processed_dir / "boundary.geojson"
    boundary_payload = {
        "type": "FeatureCollection",
        "features": all_boundary_features,
    }
    boundary_path.write_text(
        json.dumps(boundary_payload, indent=2) + "\n",
        encoding="utf-8",
    )
    click.echo(
        f"[acquire] Acquired {len(config.documents)} document(s) and "
        f"{len(all_boundary_features)} boundary feature(s) for '{config.id}'."
    )
