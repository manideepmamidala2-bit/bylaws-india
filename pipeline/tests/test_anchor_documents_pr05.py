"""Falsifiable tests for PR 05 — Structure the Two Anchor Documents and Publish Release 2.0.0."""

from __future__ import annotations

import json

from bylaws.root import resolve_repo_root
from bylaws.schema_validator import validate_file

REPO_ROOT = resolve_repo_root()
REPORTS_DIR = REPO_ROOT / "data" / "reports" / "in-ka-bengaluru-south"
RELEASE_2_DIR = REPO_ROOT / "public" / "data" / "in-ka-bengaluru-south" / "2.0.0"


def test_parser_comparison_and_qa_reports_exist_with_60_node_self_check() -> None:
    """`parser-comparison.md` and `qa.md` exist for `in-ka-bengaluru-south` and include Docling benchmarking and the 30-node-per-document self-check."""
    parser_comp_path = REPORTS_DIR / "parser-comparison.md"
    qa_path = REPORTS_DIR / "qa.md"
    decision_path = (
        REPO_ROOT
        / "docs"
        / "decisions"
        / "004-bengaluru-south-parser-and-map-decisions.md"
    )

    assert parser_comp_path.is_file()
    parser_text = parser_comp_path.read_text(encoding="utf-8")
    assert "bbl-2003" in parser_text
    assert "rmp2015-zr" in parser_text
    assert "docling" in parser_text.lower()
    assert "pypdfium2" in parser_text.lower()

    assert decision_path.is_file()
    decision_text = decision_path.read_text(encoding="utf-8")
    assert "Docling" in decision_text

    assert qa_path.is_file()
    qa_text = qa_path.read_text(encoding="utf-8")
    assert "bbl-2003" in qa_text
    assert "rmp2015-zr" in qa_text
    assert "Stratified 30-Node Self-Check" in qa_text
    assert qa_text.count("| PASS |") >= 60


def test_anchor_documents_structured_to_schema_1_3_layer1_and_layer2() -> None:
    """Both `bbl-2003` and `rmp2015-zr` are structured to Schema 1.3 Layer 1 + Layer 2 with `v1` versions only, definitions, provisos/notes, tables, and 100% page citation coverage."""
    for doc_id, expected_min_pages, expected_min_tables, expected_min_defs in [
        ("bbl-2003", 83, 15, 50),
        ("rmp2015-zr", 68, 20, 40),
    ]:
        clauses_path = RELEASE_2_DIR / f"{doc_id}.clauses.json"
        ann_path = RELEASE_2_DIR / f"{doc_id}.annotations.json"
        assert clauses_path.is_file(), f"Missing {clauses_path}"
        assert ann_path.is_file(), f"Missing {ann_path}"

        tree = validate_file(clauses_path, "clause-tree")
        ann_doc = validate_file(ann_path, "annotations")

        clauses = tree["clauses"]
        assert len(clauses) >= 150, f"{doc_id}: expected >= 150 nodes, got {len(clauses)}"

        cited_pages: set[int] = set()
        with_bbox = 0
        total_citations = 0
        node_types: set[str] = set()
        table_nodes = 0
        def_nodes = 0

        for node in clauses:
            node_types.add(node["type"])
            if node["type"] == "table":
                table_nodes += 1
            if node["type"] == "definition":
                def_nodes += 1
                assert node.get("defines"), f"{doc_id}:{node['eid']} missing defines"
            # PR 05 requires version 1 only (amendments not yet applied)
            versions = node.get("versions") or []
            assert len(versions) == 1, f"{doc_id}:{node['eid']} must have v1 only in PR 05"
            assert versions[0]["version_id"] == "v1"

            cits = node.get("citations") or []
            assert len(cits) >= 1, f"{doc_id}:{node['eid']} missing citations"
            for cit in cits:
                cited_pages.add(int(cit["page"]))
                total_citations += 1
                if cit.get("bbox") is not None:
                    with_bbox += 1

        assert len(cited_pages) >= expected_min_pages, (
            f"{doc_id}: expected >= {expected_min_pages} cited pages, got {len(cited_pages)}"
        )
        assert total_citations > 0 and (with_bbox / total_citations) >= 0.95
        assert table_nodes >= expected_min_tables, (
            f"{doc_id}: expected >= {expected_min_tables} table nodes, got {table_nodes}"
        )
        assert def_nodes >= expected_min_defs, (
            f"{doc_id}: expected >= {expected_min_defs} definition nodes, got {def_nodes}"
        )
        assert "table_row" in node_types

        annotations = ann_doc["annotations"]
        kinds = {a["kind"] for a in annotations}
        assert {"cross_reference", "defined_term_use", "provision_type"}.issubset(kinds)


def test_release_2_0_0_published_with_amendments_not_yet_applied_notice() -> None:
    """Release `2.0.0` is published in `manifest.json` (with `1.0.0` still `withdrawn`), and `declarations.json` includes the required notice."""
    manifest = validate_file(REPO_ROOT / "public" / "data" / "manifest.json", "manifest")
    bscc = next(j for j in manifest["jurisdictions"] if j["id"] == "in-ka-bengaluru-south")
    assert bscc["latest_release"] in {"2.0.0", "2.1.0", "2.2.0"}

    by_ver = {r["version"]: r for r in bscc["releases"]}
    assert "1.0.0" in by_ver and by_ver["1.0.0"]["status"] == "withdrawn"
    assert "2.0.0" in by_ver and by_ver["2.0.0"]["status"] == "published"

    rel2 = by_ver["2.0.0"]
    assert rel2["files"]["clauses"] == [
        "/data/in-ka-bengaluru-south/2.0.0/bbl-2003.clauses.json",
        "/data/in-ka-bengaluru-south/2.0.0/rmp2015-zr.clauses.json",
    ]
    assert rel2["files"]["annotations"] == [
        "/data/in-ka-bengaluru-south/2.0.0/bbl-2003.annotations.json",
        "/data/in-ka-bengaluru-south/2.0.0/rmp2015-zr.annotations.json",
    ]

    decl = validate_file(RELEASE_2_DIR / "declarations.json", "declarations")
    gap_texts = " ".join(g["description"] for g in decl.get("known_gaps", []))
    assert (
        "Two base documents published. Amendments not yet applied: the text shown is the original wording, which may have been changed since."
        in gap_texts
    )
    docs_json = json.loads((RELEASE_2_DIR / "documents.json").read_text(encoding="utf-8"))
    assert len(docs_json) == 12
