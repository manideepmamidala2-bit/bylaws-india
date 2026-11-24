"""Stage 8.1: Acquire raw documents and boundary layers with SHA-256 verification and R15 retrieval records."""

from __future__ import annotations

import hashlib
import json
import urllib.parse
from pathlib import Path
from typing import Any

import click
import pypdfium2 as pdfium

from bylaws.config import DocumentConfig, JurisdictionConfig
from bylaws.geo.boundaries import extract_boundary_feature
from bylaws.provenance import (
    ProvenanceGateError,
    assert_pdf_not_denylisted,
    fetch_remote_with_retrieval,
    is_remote_http_url,
    load_pdf_denylist,
)
from bylaws.root import (
    PACKAGE_REPO_ROOT,
    get_deterministic_timestamp,
    resolve_local_source_path,
    resolve_repo_root,
)
from bylaws.schema_validator import validate_payload

DOC_TYPE_TO_ROLE: dict[str, str] = {
    "act": "base",
    "rules": "regulation",
    "regulations": "base",
    "bye_laws": "base",
    "amendment": "amendment",
    "notification": "amendment",
    "government_order": "regulation",
    "circular": "regulation",
    "map": "reference",
    "standard_reference": "reference",
}


def resolve_local_or_remote_bytes(
    source_url: str,
    repo_root: Path,
    *,
    allow_local: bool = True,
) -> tuple[bytes, dict[str, Any] | None]:
    """Read bytes from a local path (when `allow_local=True`) or `http(s)://` URL with R15 retrieval metadata."""
    if source_url.startswith(("http://", "https://")):
        return fetch_remote_with_retrieval(source_url)

    if not allow_local:
        raise ProvenanceGateError(
            f"Rule R15 violation: non-test jurisdiction cannot acquire from local source_url {source_url!r}."
        )

    if source_url.startswith("file://"):
        parsed = urllib.parse.urlparse(source_url)
        file_path = Path(urllib.parse.unquote(parsed.path))
        if not file_path.is_file():
            raise click.ClickException(f"Source file not found: {file_path}")
        return file_path.read_bytes(), None

    candidate = (repo_root / source_url).resolve()
    if candidate.is_file():
        return candidate.read_bytes(), None

    fallback = (PACKAGE_REPO_ROOT / source_url).resolve()
    if fallback.is_file():
        return fallback.read_bytes(), None

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


def _resolve_doc_role(doc: DocumentConfig) -> str:
    if doc.role:
        return doc.role
    if doc.doc_type and doc.doc_type in DOC_TYPE_TO_ROLE:
        if doc.amends:
            return "amendment"
        return DOC_TYPE_TO_ROLE[doc.doc_type]
    return "regulation"


def _acquire_single_document(
    doc: DocumentConfig,
    raw_dir: Path,
    repo_root: Path,
    *,
    is_test_jurisdiction: bool = False,
) -> dict[str, Any] | None:
    acq_status = getattr(doc, "acquisition_status", None) or "acquired"
    if acq_status in {"pending", "not_found"}:
        return None

    meta_path = raw_dir / f"{doc.id}.meta.json"
    retrieved_at = get_deterministic_timestamp()
    is_ref_only = doc.text_rights is not None and doc.text_rights.mode == "reference_only"

    if not is_test_jurisdiction and not is_remote_http_url(doc.source_url):
        raise ProvenanceGateError(
            f"Rule R15 violation ({doc.id}): non-test source_url must be http(s), got {doc.source_url!r}."
        )

    sha256_hex: str | None = None
    byte_count: int | None = None
    page_count: int | None = None
    is_scanned: bool | None = None
    copies: list[dict[str, Any]] = []
    retrieval_record: dict[str, Any] | None = (
        doc.retrieval.model_dump(mode="json")
        if getattr(doc, "retrieval", None) is not None and doc.retrieval is not None
        else None
    )

    if not is_ref_only:
        raw_bytes, fetched_retrieval = resolve_local_or_remote_bytes(
            doc.source_url,
            repo_root,
            allow_local=is_test_jurisdiction,
        )
        if fetched_retrieval is not None:
            retrieval_record = fetched_retrieval
            retrieved_at = str(fetched_retrieval["fetched_at"])

        sha256_hex = hashlib.sha256(raw_bytes).hexdigest()
        byte_count = len(raw_bytes)
        pdf_path = raw_dir / f"{doc.id}.pdf"

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

        if not is_test_jurisdiction:
            assert_pdf_not_denylisted(pdf_path, load_pdf_denylist(repo_root))

        page_count, is_scanned = _inspect_pdf(pdf_path)
        rel_pdf_path = str(pdf_path.relative_to(repo_root))
        copy_entry: dict[str, Any] = {
            "url": doc.source_url,
            "path": rel_pdf_path,
            "sha256": sha256_hex,
            "retrieved_at": retrieved_at,
        }
        if retrieval_record is not None:
            copy_entry["retrieval"] = retrieval_record
        copies.append(copy_entry)

    evidence_payload: dict[str, Any] = {
        "url": doc.status_evidence.url,
    }
    if doc.status_evidence.quoted_line is not None:
        evidence_payload["quoted_line"] = doc.status_evidence.quoted_line
    if doc.status_evidence.description is not None:
        evidence_payload["description"] = doc.status_evidence.description

    meta_payload: dict[str, Any] = {
        "schema_version": "1.3",
        "doc_id": doc.id,
        "title": doc.title,
        "issuing_authority": doc.issuing_authority,
        "layer": doc.layer,
        "role": _resolve_doc_role(doc),
        "legal_status": doc.legal_status,
        "acquisition_status": "reference_only" if is_ref_only else acq_status,
        "status_evidence": evidence_payload,
        "licence_or_terms": doc.licence_or_terms,
        "notified_date": doc.notified_date,
        "effective_from": doc.effective_from,
        "amends": list(doc.amends or []),
        "supersedes": list(doc.supersedes or []),
        "source_url": doc.source_url,
        "retrieved_at": retrieved_at,
        "sha256": sha256_hex,
        "bytes": byte_count,
        "page_count": page_count,
        "is_scanned": is_scanned,
    }
    if retrieval_record is not None:
        meta_payload["retrieval"] = retrieval_record
    if doc.doc_type is not None:
        meta_payload["doc_type"] = doc.doc_type
    if doc.notification_number is not None:
        meta_payload["notification_number"] = doc.notification_number
    if doc.gazette_reference is not None:
        meta_payload["gazette_reference"] = doc.gazette_reference
    if doc.superseded_by_document is not None:
        meta_payload["superseded_by_document"] = doc.superseded_by_document
    if doc.text_rights is not None:
        meta_payload["text_rights"] = {
            "mode": doc.text_rights.mode,
            "reason": doc.text_rights.reason,
        }
    if doc.languages is not None:
        meta_payload["languages"] = list(doc.languages)
    if doc.official_url is not None:
        meta_payload["official_url"] = doc.official_url
    if doc.mirror_urls is not None:
        meta_payload["mirror_urls"] = list(doc.mirror_urls)
    if copies:
        meta_payload["copies"] = copies
    if doc.cited_provisions is not None:
        meta_payload["cited_provisions"] = [
            cp.model_dump(exclude_none=True) for cp in doc.cited_provisions
        ]

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

    is_test_jur = config.visibility == "test"
    acquired_count = 0
    for doc in config.documents:
        res = _acquire_single_document(
            doc,
            raw_dir,
            root,
            is_test_jurisdiction=is_test_jur,
        )
        if res is not None:
            acquired_count += 1

    all_boundary_features: list[dict[str, Any]] = []
    for boundary_cfg in config.maps.boundaries:
        b_status = getattr(boundary_cfg, "acquisition_status", None) or "acquired"
        if b_status in {"pending", "not_found"}:
            continue
        source_path = resolve_local_source_path(boundary_cfg.source_url, root)
        fc = extract_boundary_feature(
            source_path,
            boundary_cfg.select.property,
            boundary_cfg.select.equals,
        )
        out_name = boundary_cfg.output_file or "boundary.geojson"
        if out_name == "boundary.geojson":
            all_boundary_features.extend(fc["features"])
        else:
            extra_path = processed_dir / out_name
            extra_path.write_text(
                json.dumps(fc, indent=2) + "\n",
                encoding="utf-8",
            )

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
        f"[acquire] Acquired {acquired_count} document(s) and "
        f"{len(all_boundary_features)} boundary feature(s) for '{config.id}'."
    )
