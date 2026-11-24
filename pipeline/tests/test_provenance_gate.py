"""Falsifiable tests for the R15/R16 Provenance Gate, synthetic fixture isolation, and real parser tools (PR 02)."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path

import click
import pytest
import yaml
from fpdf import FPDF

from bylaws.config import load_jurisdiction_config
from bylaws.parsers.layout_table_adapter import (
    DoclingLayoutAdapter,
    TesseractOcrAdapter,
    _resolve_adapter_version,
)
from bylaws.provenance import (
    ProvenanceGateError,
    check_repository_provenance,
    inspect_pdf_creator_producer,
)
from bylaws.publish import run_publish
from bylaws.root import resolve_repo_root

REPO_ROOT = resolve_repo_root()


def _make_clean_pdf_bytes(text: str = "Official Gazette Notification") -> bytes:
    """Create a minimal PDF whose Creator/Producer does not match any repository generator tool."""
    pdf = FPDF()
    pdf.set_creator("Mozilla/5.0 Chromium")
    pdf.set_producer("Skia/PDF m120")
    pdf.add_page()
    pdf.set_font("Helvetica", size=11)
    pdf.cell(0, 10, text=text)
    raw = bytes(pdf.output())
    # Scrub default PyFPDF producer string so only our explicit producer remains
    return raw.replace(b"PyFPDF", b" PdfLib").replace(b"fpdf2", b"pdflb")


def _make_fpdf_generated_pdf_bytes() -> bytes:
    """Create a PDF whose Creator/Producer names `fpdf` / `StructuredBuildingBylaws`."""
    pdf = FPDF()
    pdf.set_creator("StructuredBuildingBylaws")
    pdf.add_page()
    pdf.set_font("Helvetica", size=11)
    pdf.cell(0, 10, text="Synthetic generated clause")
    return bytes(pdf.output())


def _setup_minimal_workspace(tmp_path: Path) -> Path:
    workspace = tmp_path / "repo"
    workspace.mkdir(parents=True, exist_ok=True)
    (workspace / "bylaws.toml").write_text(
        (REPO_ROOT / "bylaws.toml").read_text(encoding="utf-8"),
        encoding="utf-8",
    )
    (workspace / "jurisdictions").mkdir(parents=True, exist_ok=True)
    return workspace


def test_repository_passes_provenance_gate_and_has_no_generated_bengaluru_south_files() -> None:
    """Repository passes `check_repository_provenance` and has zero generated Bengaluru South files in `data/` or `public/data/`."""
    check_repository_provenance(REPO_ROOT)

    assert not (REPO_ROOT / "scripts" / "build_bengaluru_south_sources.py").exists()
    assert not (REPO_ROOT / "data" / "sources" / "in-ka-bengaluru-south").exists()
    assert not (REPO_ROOT / "data" / "overrides" / "in-ka-bengaluru-south").exists()
    assert not (REPO_ROOT / "data" / "reports" / "in-ka-bengaluru-south").exists()
    assert not (REPO_ROOT / "public" / "data" / "in-ka-bengaluru-south").exists()
    assert not (REPO_ROOT / "docs" / "sources" / "in-ka-bengaluru-south.md").exists()

    synth_script = (
        REPO_ROOT / "pipeline" / "tests" / "fixtures" / "build_synthetic_jurisdiction.py"
    )
    assert synth_script.is_file()
    synth_text = synth_script.read_text(encoding="utf-8").lower()
    for forbidden in ("bengaluru", "bangalore", "bbmp", "opencity", "indiacode", "karnataka"):
        assert forbidden not in synth_text, (
            f"Synthetic fixture generator must not reference real place/authority '{forbidden}'"
        )

    config = load_jurisdiction_config("in-ka-bengaluru-south")
    assert config.visibility == "public"
    assert len(config.documents) >= 10
    for doc in config.documents:
        assert doc.source_url.startswith(("http://", "https://"))
        assert doc.acquisition_status == "pending"


def test_planted_local_source_in_non_test_jurisdiction_fails_gate(tmp_path: Path) -> None:
    """A planted local or `file://` `source_url` in a non-test jurisdiction fails the provenance gate."""
    workspace = _setup_minimal_workspace(tmp_path)
    (workspace / "jurisdictions" / "in-ka-planted.yaml").write_text(
        yaml.safe_dump(
            {
                "schema_version": "1.2",
                "id": "in-ka-planted",
                "name": "Planted Public Jurisdiction",
                "visibility": "public",
                "country": "IN",
                "state": "KA",
                "building_types": ["residential"],
                "parents": [],
                "documents": [
                    {
                        "id": "planted-local-doc",
                        "title": "Planted Local Document",
                        "issuing_authority": "Authority",
                        "layer": "municipal",
                        "legal_status": "in_force",
                        "status_evidence": {"url": "https://example.gov.in/order.pdf"},
                        "licence_or_terms": "Public publication",
                        "source_url": "data/sources/in-ka-planted/planted.pdf",
                    }
                ],
                "maps": {"boundaries": [], "zoning": []},
            }
        ),
        encoding="utf-8",
    )

    with pytest.raises(ProvenanceGateError, match="local or non-http"):
        check_repository_provenance(workspace)


def test_planted_missing_retrieval_block_in_non_test_jurisdiction_fails_gate(
    tmp_path: Path,
) -> None:
    """An acquired non-test document without a complete `retrieval` block fails the provenance gate."""
    workspace = _setup_minimal_workspace(tmp_path)
    (workspace / "jurisdictions" / "in-ka-no-retrieval.yaml").write_text(
        yaml.safe_dump(
            {
                "schema_version": "1.2",
                "id": "in-ka-no-retrieval",
                "name": "Missing Retrieval Jurisdiction",
                "visibility": "public",
                "country": "IN",
                "state": "KA",
                "building_types": ["residential"],
                "parents": [],
                "documents": [
                    {
                        "id": "acquired-without-retrieval",
                        "title": "Acquired Document Missing Retrieval",
                        "issuing_authority": "Authority",
                        "layer": "municipal",
                        "legal_status": "in_force",
                        "acquisition_status": "acquired",
                        "status_evidence": {"url": "https://example.gov.in/order.pdf"},
                        "licence_or_terms": "Public publication",
                        "source_url": "https://example.gov.in/order.pdf",
                    }
                ],
                "maps": {"boundaries": [], "zoning": []},
            }
        ),
        encoding="utf-8",
    )

    with pytest.raises(ProvenanceGateError, match="missing a complete retrieval record"):
        check_repository_provenance(workspace)


def test_planted_fpdf_generated_pdf_in_non_test_jurisdiction_fails_gate(
    tmp_path: Path,
) -> None:
    """A planted `fpdf`-generated PDF in a non-test jurisdiction fails the provenance gate."""
    workspace = _setup_minimal_workspace(tmp_path)
    pdf_bytes = _make_fpdf_generated_pdf_bytes()
    sha256_hex = hashlib.sha256(pdf_bytes).hexdigest()

    raw_dir = workspace / "data" / "raw" / "in-ka-fpdf"
    raw_dir.mkdir(parents=True, exist_ok=True)
    pdf_path = raw_dir / "planted-fpdf.pdf"
    pdf_path.write_bytes(pdf_bytes)

    creator, producer = inspect_pdf_creator_producer(pdf_path)
    assert "structuredbuildingbylaws" in creator.lower() or "fpdf" in producer.lower()

    retrieval = {
        "fetched_at": "2026-11-24T00:00:00Z",
        "requested_url": "https://example.gov.in/planted-fpdf.pdf",
        "final_url": "https://example.gov.in/planted-fpdf.pdf",
        "http_status": 200,
        "content_type": "application/pdf",
        "content_length": len(pdf_bytes),
        "response_headers": {"server": "nginx"},
        "sha256": sha256_hex,
        "archive_url": "https://web.archive.org/web/20261124000000/https://example.gov.in/planted-fpdf.pdf",
        "archive_failure_reason": None,
        "fetched_by": "agent",
    }

    (workspace / "jurisdictions" / "in-ka-fpdf.yaml").write_text(
        yaml.safe_dump(
            {
                "schema_version": "1.2",
                "id": "in-ka-fpdf",
                "name": "Planted FPDF Jurisdiction",
                "visibility": "public",
                "country": "IN",
                "state": "KA",
                "building_types": ["residential"],
                "parents": [],
                "documents": [
                    {
                        "id": "planted-fpdf",
                        "title": "Planted FPDF Document",
                        "issuing_authority": "Authority",
                        "layer": "municipal",
                        "legal_status": "in_force",
                        "acquisition_status": "acquired",
                        "status_evidence": {"url": "https://example.gov.in/planted-fpdf.pdf"},
                        "licence_or_terms": "Public publication",
                        "source_url": "https://example.gov.in/planted-fpdf.pdf",
                        "retrieval": retrieval,
                    }
                ],
                "maps": {"boundaries": [], "zoning": []},
            }
        ),
        encoding="utf-8",
    )

    with pytest.raises(ProvenanceGateError, match="denylisted PDF creator/producer"):
        check_repository_provenance(workspace)


def test_valid_retrieval_record_and_clean_pdf_pass_gate(tmp_path: Path) -> None:
    """A non-test jurisdiction with a valid `retrieval` record and non-denylisted PDF passes the provenance gate."""
    workspace = _setup_minimal_workspace(tmp_path)
    pdf_bytes = _make_clean_pdf_bytes()
    sha256_hex = hashlib.sha256(pdf_bytes).hexdigest()

    raw_dir = workspace / "data" / "raw" / "in-ka-valid"
    raw_dir.mkdir(parents=True, exist_ok=True)
    pdf_path = raw_dir / "valid-doc.pdf"
    pdf_path.write_bytes(pdf_bytes)

    retrieval = {
        "fetched_at": "2026-11-24T00:00:00Z",
        "requested_url": "https://example.gov.in/valid-doc.pdf",
        "final_url": "https://example.gov.in/valid-doc.pdf",
        "http_status": 200,
        "content_type": "application/pdf",
        "content_length": len(pdf_bytes),
        "response_headers": {
            "etag": '"abc123"',
            "last_modified": "Mon, 23 Nov 2026 10:00:00 GMT",
            "server": "Apache",
            "date": "Tue, 24 Nov 2026 00:00:00 GMT",
        },
        "sha256": sha256_hex,
        "archive_url": "https://web.archive.org/web/20261124000000/https://example.gov.in/valid-doc.pdf",
        "archive_failure_reason": None,
        "fetched_by": "agent",
    }

    (raw_dir / "valid-doc.meta.json").write_text(
        json.dumps(
            {
                "schema_version": "1.2",
                "doc_id": "valid-doc",
                "title": "Valid Official Notification",
                "issuing_authority": "Authority",
                "layer": "municipal",
                "role": "base",
                "legal_status": "in_force",
                "acquisition_status": "acquired",
                "status_evidence": {"url": "https://example.gov.in/valid-doc.pdf"},
                "licence_or_terms": "Public publication",
                "notified_date": "2026-01-01",
                "effective_from": "2026-01-01",
                "amends": [],
                "supersedes": [],
                "source_url": "https://example.gov.in/valid-doc.pdf",
                "retrieved_at": "2026-11-24T00:00:00Z",
                "sha256": sha256_hex,
                "bytes": len(pdf_bytes),
                "page_count": 1,
                "is_scanned": False,
                "retrieval": retrieval,
            },
            indent=2,
        ),
        encoding="utf-8",
    )

    (workspace / "jurisdictions" / "in-ka-valid.yaml").write_text(
        yaml.safe_dump(
            {
                "schema_version": "1.2",
                "id": "in-ka-valid",
                "name": "Valid Public Jurisdiction",
                "visibility": "public",
                "release_version": "2.0.0",
                "country": "IN",
                "state": "KA",
                "building_types": ["residential"],
                "parents": [],
                "documents": [
                    {
                        "id": "valid-doc",
                        "title": "Valid Official Notification",
                        "issuing_authority": "Authority",
                        "layer": "municipal",
                        "legal_status": "in_force",
                        "acquisition_status": "acquired",
                        "status_evidence": {"url": "https://example.gov.in/valid-doc.pdf"},
                        "licence_or_terms": "Public publication",
                        "source_url": "https://example.gov.in/valid-doc.pdf",
                        "retrieval": retrieval,
                    }
                ],
                "maps": {"boundaries": [], "zoning": []},
            }
        ),
        encoding="utf-8",
    )

    check_repository_provenance(workspace)


def test_real_docling_adapter_and_strict_versions_and_release_version_check(
    tmp_path: Path,
) -> None:
    """Docling adapter runs real Docling (no pypdfium2 alias), missing packages fail loudly, and publish requires config.release_version."""
    with pytest.raises(click.ClickException, match="Required parser package"):
        _resolve_adapter_version("nonexistent-package-xyz-999")

    fixture_pdf = REPO_ROOT / "pipeline" / "tests" / "fixtures" / "fixture-base.pdf"
    docling_res = DoclingLayoutAdapter().parse(fixture_pdf)
    assert docling_res.parser_name == "docling"
    assert docling_res.parser_version != "1.0.0"
    assert docling_res.page_count == 2
    assert len(docling_res.blocks) > 0
    assert any("Short Title" in b.text for b in docling_res.blocks)
    assert len(docling_res.tables) == 1
    assert "Table 2.1" in docling_res.markdown

    # Scanned PDF via TesseractOcrAdapter must set bbox: None when word boxes are not used
    scanned_pdf = tmp_path / "scanned.pdf"
    pdf = FPDF()
    pdf.add_page()
    scanned_pdf.write_bytes(bytes(pdf.output()))
    tess_res = TesseractOcrAdapter().parse(scanned_pdf)
    assert tess_res.is_scanned is True
    for blk in tess_res.blocks:
        assert blk.bbox is None

    # Publish without release_version on config must fail loudly
    config = load_jurisdiction_config("in-ka-bengaluru-south")
    assert config.release_version is None
    with pytest.raises(click.ClickException, match="release_version"):
        run_publish(config, repo_root=tmp_path)
