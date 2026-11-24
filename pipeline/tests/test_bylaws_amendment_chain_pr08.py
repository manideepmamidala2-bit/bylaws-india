"""Falsifiable tests for PR 08 — Building Bye-laws Amendment Chain."""

from __future__ import annotations

from bylaws.config import load_jurisdiction_config
from bylaws.consolidate import compute_consolidated_view_as_of
from bylaws.provenance import check_repository_provenance
from bylaws.root import resolve_repo_root
from bylaws.schema_validator import validate_file

REPO_ROOT = resolve_repo_root()
RELEASE_DIR = REPO_ROOT / "public" / "data" / "in-ka-bengaluru-south" / "2.3.0"


def test_bylaws_chain_documents_structured_with_annotations_and_provenance() -> None:
    """Every acquired English instrument in the Building Bye-laws chain is structured in Release 2.3.0 with valid Schema 1.3 Layer 1 + Layer 2 files, and drafts are separated."""
    check_repository_provenance(REPO_ROOT)

    config = load_jurisdiction_config("in-ka-bengaluru-south")
    assert config.release_version == "2.3.0"
    assert RELEASE_DIR.is_dir(), f"Missing Release 2.3.0 directory at {RELEASE_DIR}"

    by_id = {d.id: d for d in config.documents}
    assert by_id["bbl-2003"].structured is not False
    assert by_id["ka-model-bbl-2017"].structured is True
    assert by_id["udd-1107-mnu-2018-draft"].structured is True
    assert by_id["udd-1107-mnu-2018-draft"].legal_status == "draft"

    for doc_id, min_clauses in (
        ("bbl-2003", 1000),
        ("ka-model-bbl-2017", 3000),
        ("udd-1107-mnu-2018-draft", 15),
    ):
        clauses_payload = validate_file(RELEASE_DIR / f"{doc_id}.clauses.json", "clause-tree")
        ann_payload = validate_file(RELEASE_DIR / f"{doc_id}.annotations.json", "annotations")
        assert len(clauses_payload["clauses"]) >= min_clauses
        assert len(ann_payload["annotations"]) >= 10
        if doc_id in {"bbl-2003", "ka-model-bbl-2017"}:
            kinds = {a["kind"] for a in ann_payload["annotations"]}
            assert kinds == {"cross_reference", "defined_term_use", "provision_type"}

    # Verify manifest separates draft clause trees under releases[].drafts.clauses
    manifest = validate_file(REPO_ROOT / "public" / "data" / "manifest.json", "manifest")
    bscc = next(j for j in manifest["jurisdictions"] if j["id"] == "in-ka-bengaluru-south")
    rel_230 = next(r for r in bscc["releases"] if r["version"] == "2.3.0")
    draft_clauses = (rel_230.get("drafts") or {}).get("clauses") or []
    in_force_clauses = (rel_230.get("files") or {}).get("clauses") or []
    assert any("udd-1107-mnu-2018-draft.clauses.json" in p for p in draft_clauses)
    assert not any("udd-1107-mnu-2018-draft.clauses.json" in p for p in in_force_clauses)


def test_bylaws_layer3_effects_versions_and_consolidated_views() -> None:
    """`amendments.json` and `consolidated.json` contain Layer 3 effects on `bbl-2003`, update target node `versions[]`, and compute derived consolidated views per date and today."""
    amendments_payload = validate_file(RELEASE_DIR / "amendments.json", "amendments")
    effects = amendments_payload.get("effects") or []
    links = amendments_payload.get("links") or []
    assert len(effects) >= 6
    assert len(links) >= 6

    bbl_effects = [e for e in effects if e.get("target_doc") == "bbl-2003"]
    assert len(bbl_effects) >= 6, "Expected Layer 3 effects targeting bbl-2003"
    applied_effects = [e for e in bbl_effects if e.get("applied") is True]
    unapplied_effects = [e for e in bbl_effects if e.get("applied") is False]
    assert len(applied_effects) == 6
    assert len(unapplied_effects) == 2

    # Draft documents and low-confidence instructions must never produce applied effects on in_force text
    config = load_jurisdiction_config("in-ka-bengaluru-south")
    draft_doc_ids = {d.id for d in config.documents if d.legal_status == "draft"}
    for eff in applied_effects:
        assert eff.get("amending_doc") not in draft_doc_ids
        assert float(eff.get("confidence", 0.0)) >= 0.8
    for u_eff in unapplied_effects:
        assert u_eff.get("unapplied_reason")

    # Check target nodes in bbl-2003.clauses.json have >= 2 versions with valid_from / valid_to
    bbl_tree = validate_file(RELEASE_DIR / "bbl-2003.clauses.json", "clause-tree")
    by_eid = {c["eid"]: c for c in bbl_tree["clauses"]}
    for modified_eid in (
        "part_III__sec_9.0__cl_9.2",
        "part_III__sec_9.0__cl_9.3__cl_9.3.1",
        "part_III__sec_9.0__cl_9.10__cl_9.10.1",
        "part_III__sec_16.0",
        "part_IV__sec_30.0",
    ):
        node = by_eid[modified_eid]
        versions = node["versions"]
        assert len(versions) == 2
        assert versions[0]["valid_from"] == "2004-06-05"
        assert versions[0]["valid_to"] == "2007-06-25"
        assert versions[1]["valid_from"] == "2007-06-25"
        assert versions[1]["valid_to"] is None
        assert versions[1]["effect_id"] is not None

    # Check inserted node 1.4 (`part_I__sec_1.0__cl_1.4`) introduced by ka-model-bbl-2017 (2017-10-28)
    assert "part_I__sec_1.0__cl_1.4" in by_eid
    ins_node = by_eid["part_I__sec_1.0__cl_1.4"]
    assert ins_node["versions"][0]["valid_from"] == "2017-10-28"
    assert "mutatis mutandis" in (ins_node.get("content") or "")

    # Hand-written expectations on consolidated views across 3 dates:
    # 1. Original date (2004-06-05): 1.4 does not exist yet; 9.2 has v1 text ("Tables 4, 5 and 6")
    view_2004 = compute_consolidated_view_as_of(bbl_tree, effects, as_of_date="2004-06-05")
    eids_2004 = {n["eid"]: n for n in view_2004["nodes"]}
    assert "part_I__sec_1.0__cl_1.4" not in eids_2004
    assert eids_2004["part_III__sec_9.0__cl_9.2"]["active_version_id"] == "v1"
    assert len(view_2004["applied_effects"]) == 0

    # 2. First amendment date (2007-06-25): 9.2 has v2 text ("Table 8" & "Table 9"); 1.4 still does not exist
    view_2007 = compute_consolidated_view_as_of(bbl_tree, effects, as_of_date="2007-06-25")
    eids_2007 = {n["eid"]: n for n in view_2007["nodes"]}
    assert "part_I__sec_1.0__cl_1.4" not in eids_2007
    assert eids_2007["part_III__sec_9.0__cl_9.2"]["active_version_id"] == "v2"
    assert "Table 8" in (eids_2007["part_III__sec_9.0__cl_9.2"].get("content") or "")
    assert len(view_2007["applied_effects"]) == 5

    # 3. Second amendment date (2017-10-28) and today (2026-11-24): 1.4 exists and all 6 effects are applied
    for dt in ("2017-10-28", "2026-11-24"):
        view_dt = compute_consolidated_view_as_of(bbl_tree, effects, as_of_date=dt)
        eids_dt = {n["eid"]: n for n in view_dt["nodes"]}
        assert "part_I__sec_1.0__cl_1.4" in eids_dt
        assert eids_dt["part_III__sec_9.0__cl_9.2"]["active_version_id"] == "v2"
        assert len(view_dt["applied_effects"]) == 6

    # Check consolidated.json
    consolidated_payload = validate_file(RELEASE_DIR / "consolidated.json", "consolidated")
    cons_records = [
        r for r in consolidated_payload["records"] if r["doc_id"] == "bbl-2003"
    ]
    assert len(cons_records) == 6
    for cr in cons_records:
        assert cr["derived"] is True
        assert len(cr["amendments_applied"]) >= 1
    uncons = [
        u for u in consolidated_payload["unconsolidated"] if u["doc_id"] == "bbl-2003"
    ]
    assert len(uncons) == 2


def test_qa_report_records_applied_effect_page_image_verification() -> None:
    """`data/reports/in-ka-bengaluru-south/qa.md` records the page-image self-check of applied Building Bye-laws effects and `source-discovery.md` logs the PR 08 search."""
    qa_text = (REPO_ROOT / "data" / "reports" / "in-ka-bengaluru-south" / "qa.md").read_text(
        encoding="utf-8"
    )
    assert "Applied Amendment Effect Verification" in qa_text
    assert "bbl-2003" in qa_text

    disc_text = (
        REPO_ROOT / "data" / "reports" / "in-ka-bengaluru-south" / "source-discovery.md"
    ).read_text(encoding="utf-8")
    assert "PR 08" in disc_text
    assert "udd-1107-mnu-2018-draft" in disc_text

    # Verify bbl-2003 no longer has the "Amendments not yet applied" gap, while rmp2015-zr still does
    declarations = validate_file(RELEASE_DIR / "declarations.json", "declarations")
    gaps_by_doc = {
        g["doc_id"]: [
            x["description"]
            for x in declarations.get("known_gaps", [])
            if x["doc_id"] == g["doc_id"]
        ]
        for g in declarations.get("known_gaps", [])
    }
    bbl_gaps = " ".join(gaps_by_doc.get("bbl-2003", []))
    zr_gaps = " ".join(gaps_by_doc.get("rmp2015-zr", []))
    assert "Amendments not yet applied" not in bbl_gaps
    assert "Amendments not yet applied" in zr_gaps
