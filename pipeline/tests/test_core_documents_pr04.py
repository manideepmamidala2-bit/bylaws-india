"""Falsifiable tests for PR 04 Core Document Acquisition and Reconnaissance (Rules R15, R16, R17)."""

from __future__ import annotations

import json

from bylaws.config import load_jurisdiction_config
from bylaws.provenance import check_repository_provenance, validate_retrieval_record
from bylaws.root import resolve_repo_root
from bylaws.schema_validator import validate_file, validate_payload

REPO_ROOT = resolve_repo_root()
REPORTS_DIR = REPO_ROOT / "data" / "reports" / "in-ka-bengaluru-south"
REGISTER_JSON_PATH = (
    REPO_ROOT
    / "public"
    / "data"
    / "in-ka-bengaluru-south"
    / "register"
    / "documents.json"
)


def test_core_documents_acquired_with_retrieval_records_and_quoted_evidence() -> None:
    """Every core document in `in-ka-bengaluru-south.yaml` is either `acquired` with a complete R15 `retrieval` record and R17 quoted evidence, or `not_found` with search log evidence."""
    check_repository_provenance(REPO_ROOT)

    config = load_jurisdiction_config("in-ka-bengaluru-south")
    assert config.visibility == "public"

    acquired_docs = [
        d for d in config.documents if d.acquisition_status == "acquired"
    ]
    pending_docs = [
        d for d in config.documents if d.acquisition_status == "pending"
    ]
    assert len(pending_docs) == 0, (
        f"PR 04 must resolve all pending core documents; still pending: {[d.id for d in pending_docs]}"
    )
    assert len(acquired_docs) >= 8, (
        f"Expected at least 8 acquired core PDFs, got {len(acquired_docs)}"
    )

    by_id = {d.id: d for d in config.documents}
    for required_anchor in (
        "bbl-2003",
        "ka-model-bbl-2017",
        "rmp2015-zr",
        "rmp2015-zr-amend-2009-03",
        "rmp2015-zr-amend-2015-03",
        "rmp2015-zr-amend-2018-09",
        "rmp2015-zr-amend-2019-06",
        "rmp2015-zr-comp-2024-10-kn",
        "rmp2015-zr-amend-2025-02",
        "rmp2015-zr-amend-2026-01",
    ):
        assert required_anchor in by_id, f"Missing anchor document '{required_anchor}'"
        doc = by_id[required_anchor]
        assert doc.acquisition_status == "acquired"
        assert doc.retrieval is not None
        validate_retrieval_record(
            doc.retrieval.model_dump(mode="json"),
            f"in-ka-bengaluru-south:{doc.id}",
        )
        assert doc.status_evidence.quoted_line is not None
        assert len(doc.status_evidence.quoted_line.strip()) >= 15

    for unobtainable_id in ("rmp2015-zr-amend-2025-07", "bscc-bbl-amend-2026"):
        assert unobtainable_id in by_id
        assert by_id[unobtainable_id].acquisition_status == "not_found"

    for doc in acquired_docs:
        assert doc.retrieval is not None
        validate_retrieval_record(
            doc.retrieval.model_dump(mode="json"),
            f"in-ka-bengaluru-south:{doc.id}",
        )
        assert doc.status_evidence.quoted_line is not None
        assert doc.status_evidence.quoted_line.strip()


def test_source_discovery_recon_and_human_register_exist_with_structuring_rules() -> None:
    """`source-discovery.md`, `recon.md` (with structuring rules for PR 05), and `docs/sources/in-ka-bengaluru-south.md` exist and are complete."""
    discovery_path = REPORTS_DIR / "source-discovery.md"
    recon_path = REPORTS_DIR / "recon.md"
    sources_md_path = REPO_ROOT / "docs" / "sources" / "in-ka-bengaluru-south.md"

    assert discovery_path.is_file()
    discovery_text = discovery_path.read_text(encoding="utf-8")
    assert "Building Bye-laws" in discovery_text
    assert "Zoning Regulations" in discovery_text
    assert "http" in discovery_text

    assert recon_path.is_file()
    recon_text = recon_path.read_text(encoding="utf-8")
    assert "bbl-2003" in recon_text
    assert "rmp2015-zr" in recon_text
    assert "Structuring Rules" in recon_text

    assert sources_md_path.is_file()
    sources_md = sources_md_path.read_text(encoding="utf-8")
    assert "bbl-2003" in sources_md
    assert "rmp2015-zr" in sources_md


def test_published_register_documents_json_validates_against_document_schema() -> None:
    """`public/data/in-ka-bengaluru-south/register/documents.json` exists, is referenced in `manifest.json`, and every entry validates against `document.schema.json`."""
    manifest = validate_file(REPO_ROOT / "public" / "data" / "manifest.json", "manifest")
    bscc = next(j for j in manifest["jurisdictions"] if j["id"] == "in-ka-bengaluru-south")
    assert bscc.get("register_documents") == "/data/in-ka-bengaluru-south/register/documents.json"

    assert REGISTER_JSON_PATH.is_file()
    docs_list = json.loads(REGISTER_JSON_PATH.read_text(encoding="utf-8"))
    assert isinstance(docs_list, list)
    assert len(docs_list) >= 8
    for entry in docs_list:
        validate_payload(entry, "document")
