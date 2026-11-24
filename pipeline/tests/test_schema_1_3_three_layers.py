"""Falsifiable tests for Schema 1.3 Three Layers (PR 03, Rule R11)."""

from __future__ import annotations

import copy

import pytest

from bylaws.annotations import (
    AnnotationSpanError,
    validate_annotations_against_tree,
)
from bylaws.consolidate import compute_consolidated_view_as_of
from bylaws.root import resolve_repo_root
from bylaws.schema_validator import load_schema, validate_file
from bylaws.structure import assert_unique_sibling_eids

REPO_ROOT = resolve_repo_root()
GOLDEN_DIR = REPO_ROOT / "pipeline" / "tests" / "golden" / "xx-test-fixture"


def test_schemas_are_at_version_1_3_and_include_annotations_schema() -> None:
    """All schemas are at `schema_version: '1.3'` and `annotations.schema.json` is registered."""
    tree_schema = load_schema("clause-tree")
    assert tree_schema["properties"]["schema_version"]["const"] == "1.3"
    ann_schema = load_schema("annotations")
    assert ann_schema["properties"]["schema_version"]["const"] == "1.3"


def test_layer_1_faithful_tree_eid_types_intro_wrapup_tables_definitions_and_no_collisions() -> None:
    """Fixture base tree has Akoma Ntoso `eid`s, repeated `(a)` without collision, `intro`/`wrap_up`, `proviso`, `explanation`, `definition`, and `table` + `table_row` nodes."""
    base_tree = validate_file(GOLDEN_DIR / "fixture-base-2020.clauses.json", "clause-tree")
    assert base_tree["schema_version"] == "1.3"

    by_eid = {
        node["eid"]: node
        for node in base_tree["clauses"]
        if node.get("record_superseded_by") is None
    }

    # 1. Repeated (a) under different parents never collide
    assert "chp_I__cl_1.1__item_a" in by_eid
    assert "chp_II__cl_2.1__item_a" in by_eid
    assert by_eid["chp_I__cl_1.1__item_a"]["native_number"] == "(a)"
    assert by_eid["chp_II__cl_2.1__item_a"]["native_number"] == "(a)"

    # 2. Lead-in (`intro`) and closing (`wrap_up`) stay on the parent
    cl_2_1 = by_eid["chp_II__cl_2.1"]
    assert cl_2_1["intro"] is not None and "minimum setbacks" in cl_2_1["intro"].lower()
    assert cl_2_1["wrap_up"] is not None and "corner plots" in cl_2_1["wrap_up"].lower()
    assert "chp_II__cl_2.1__item_a" in cl_2_1["children"]
    assert "chp_II__cl_2.1__item_b" in cl_2_1["children"]

    # 3. Proviso and Explanation nodes
    assert "chp_II__cl_2.1__prov_1" in by_eid
    assert by_eid["chp_II__cl_2.1__prov_1"]["type"] == "proviso"
    assert "chp_II__cl_2.1__expl_1" in by_eid
    assert by_eid["chp_II__cl_2.1__expl_1"]["type"] == "explanation"

    # 4. Definitions with `defines` and `defines_normalised`
    def_nodes = [n for n in by_eid.values() if n["type"] == "definition"]
    assert len(def_nodes) >= 1
    far_def = next(n for n in def_nodes if n.get("defines_normalised") == "floor area ratio")
    assert far_def["defines"] == '"Floor Area Ratio"'

    # 5. Table node with 2-row header hierarchy, footnotes, and `table_row` children
    tbl_nodes = [n for n in by_eid.values() if n["type"] == "table"]
    assert len(tbl_nodes) >= 1
    tbl = tbl_nodes[0]
    assert tbl["table_meta"] is not None
    assert tbl["table_meta"]["extraction"] == "complete"
    assert len(tbl["table_meta"]["columns"]) >= 2
    assert any(col.get("children") for col in tbl["table_meta"]["columns"])
    assert len(tbl["table_meta"]["footnotes"]) >= 1
    row_eids = tbl["table_meta"]["rows"]
    assert len(row_eids) >= 3
    for r_eid in row_eids:
        assert r_eid in by_eid
        assert by_eid[r_eid]["type"] == "table_row"
        assert len(by_eid[r_eid]["cells"]) >= 3

    # 6. Duplicate sibling eid fails validation
    bad_nodes = copy.deepcopy(list(by_eid.values()))
    bad_nodes.append(copy.deepcopy(by_eid["chp_I__cl_1.1__item_a"]))
    with pytest.raises(ValueError, match="Duplicate eid"):
        assert_unique_sibling_eids(bad_nodes)


def test_layer_2_standoff_annotations_validate_spans_and_reject_mismatches() -> None:
    """Stand-off annotations (`cross_reference`, `defined_term_use`, `provision_type`) validate spans against node text."""
    base_tree = validate_file(GOLDEN_DIR / "fixture-base-2020.clauses.json", "clause-tree")
    ann_payload = validate_file(
        GOLDEN_DIR / "fixture-base-2020.annotations.json",
        "annotations",
    )
    validate_annotations_against_tree(ann_payload, base_tree)

    kinds = {a["kind"] for a in ann_payload["annotations"]}
    assert {"cross_reference", "defined_term_use", "provision_type"}.issubset(kinds)

    # Planted out-of-bounds or mismatched span must fail validation
    bad_ann = copy.deepcopy(ann_payload)
    bad_ann["annotations"][0]["target"]["span"] = [0, 9999]
    with pytest.raises(AnnotationSpanError):
        validate_annotations_against_tree(bad_ann, base_tree)


def test_layer_3_effects_versions_and_consolidated_view_by_date() -> None:
    """Consolidated view before the fixture amendment shows original text; after it, shows substituted, inserted, and omitted text."""
    base_tree = validate_file(GOLDEN_DIR / "fixture-base-2020.clauses.json", "clause-tree")
    amendments = validate_file(GOLDEN_DIR / "amendments.json", "amendments")

    effects = amendments["effects"]
    actions = {e["action"] for e in effects}
    assert {"substitute", "insert_after", "omit"}.issubset(actions)

    # Before amendment (2023-01-01): original text, no inserted clause, omitted clause still present
    before_view = compute_consolidated_view_as_of(
        base_tree,
        effects,
        as_of_date="2023-01-01",
    )
    assert before_view["derived"] is True
    assert before_view["applied_effects"] == []
    before_by_eid = {n["eid"]: n for n in before_view["nodes"]}
    assert "11.5 metres" in (before_by_eid["chp_II__cl_2.2"]["content"] or "")
    assert "chp_II__cl_2.2A" not in before_by_eid
    assert "chp_II__cl_2.3" in before_by_eid
    assert not before_by_eid["chp_II__cl_2.3"].get("omitted", False)

    # After amendment (2025-01-01): substituted text on 2.2, inserted 2.2A present, 2.3 omitted
    after_view = compute_consolidated_view_as_of(
        base_tree,
        effects,
        as_of_date="2025-01-01",
    )
    assert after_view["derived"] is True
    assert len(after_view["applied_effects"]) == 3
    after_by_eid = {n["eid"]: n for n in after_view["nodes"]}
    assert "15.0 metres" in (after_by_eid["chp_II__cl_2.2"]["content"] or "")
    assert "chp_II__cl_2.2A" in after_by_eid
    assert "solar" in (after_by_eid["chp_II__cl_2.2A"]["content"] or "").lower()
    assert after_by_eid["chp_II__cl_2.3"]["omitted"] is True


def test_docs_schema_md_documents_three_layers_and_akoma_ntoso_mapping() -> None:
    """`docs/schema.md` documents Layer 1, Layer 2, Layer 3, prefixes, and the Akoma Ntoso mapping table."""
    schema_doc = (REPO_ROOT / "docs" / "schema.md").read_text(encoding="utf-8")
    assert "Layer 1" in schema_doc
    assert "Layer 2" in schema_doc
    assert "Layer 3" in schema_doc
    assert "Akoma Ntoso" in schema_doc
    assert "subcl_" in schema_doc
    assert "prov_" in schema_doc
