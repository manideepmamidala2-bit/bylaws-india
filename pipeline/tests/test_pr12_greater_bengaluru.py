"""Falsifiable tests for PR 12 — Greater Bengaluru Overnight Run (Parts 1–6)."""

from __future__ import annotations

import json
from collections import Counter

from bylaws.config import load_jurisdiction_config
from bylaws.root import resolve_repo_root
from bylaws.schema_validator import validate_file
from bylaws.structure import STOPWORD_DEFINED_TERMS

REPO_ROOT = resolve_repo_root()


def _get_latest_south_release_dir():
    config = load_jurisdiction_config("in-ka-bengaluru-south")
    assert config.release_version is not None
    return REPO_ROOT / "public" / "data" / "in-ka-bengaluru-south" / config.release_version


def test_part1_annotation_quality_no_stopwords_or_heading_references_and_qa_stats() -> None:
    """Part 1 (`08b` §2): No stopword is a defined term, `defines` comes from quoted terms only, no heading is a reference, at most 1 `defined_term_use` per term per provision, and `qa.md` reports annotation counts."""
    rel_dir = _get_latest_south_release_dir()
    for clauses_file in sorted(rel_dir.glob("*.clauses.json")):
        doc_id = clauses_file.name.replace(".clauses.json", "")
        tree = validate_file(clauses_file, "clause-tree")
        for node in tree["clauses"]:
            if node.get("defines") or node.get("defines_normalised"):
                norm = str(node.get("defines_normalised") or "").strip().lower()
                printed = str(node.get("defines") or "").strip()
                assert norm not in STOPWORD_DEFINED_TERMS, (
                    f"Stopword defined term '{norm}' in {doc_id}:{node['eid']}"
                )
                assert len(norm) >= 2, f"Single-char defined term '{norm}' in {doc_id}:{node['eid']}"
                assert not norm.isdigit(), f"Numeric defined term '{norm}' in {doc_id}:{node['eid']}"
                assert printed.startswith(('"', "'", "\u201c", "\u2018")), (
                    f"Unquoted defined term {printed!r} in {doc_id}:{node['eid']}"
                )

        ann_file = rel_dir / f"{doc_id}.annotations.json"
        if ann_file.is_file():
            ann_payload = validate_file(ann_file, "annotations")
            term_uses_per_node: Counter[tuple[str, str]] = Counter()
            for ann in ann_payload["annotations"]:
                target = ann["target"]
                assert target["field"] != "heading", (
                    f"Annotation {ann['annotation_id']} ({ann['kind']}) must not target heading field"
                )
                if ann["kind"] == "defined_term_use":
                    key = (str(target["eid"]), str(ann["value"]))
                    term_uses_per_node[key] += 1
                    assert term_uses_per_node[key] == 1, (
                        f"Duplicate defined_term_use for {key} in {doc_id}"
                    )

    qa_text = (REPO_ROOT / "data" / "reports" / "in-ka-bengaluru-south" / "qa.md").read_text(
        encoding="utf-8"
    )
    assert "Annotation Quality Summary" in qa_text
    assert "Definitions Found" in qa_text


def test_part1_graph_json_and_graphml_and_map_diagnosis_published() -> None:
    """Part 1 (`08b` §1 & §4): `docs/map.md` records the blank-map diagnosis, and `graph.json` (Graphology format) + `graph.graphml` are published per release."""
    docs_map_text = (REPO_ROOT / "docs" / "map.md").read_text(encoding="utf-8")
    assert "maplibre-gl-worker.js" in docs_map_text
    assert "206 Partial Content" in docs_map_text

    rel_dir = _get_latest_south_release_dir()
    graph_json_path = rel_dir / "graph.json"
    graphml_path = rel_dir / "graph.graphml"
    assert graph_json_path.is_file(), f"Missing Graphology graph.json at {graph_json_path}"
    assert graphml_path.is_file(), f"Missing graph.graphml at {graphml_path}"

    graph_data = json.loads(graph_json_path.read_text(encoding="utf-8"))
    assert "nodes" in graph_data and "edges" in graph_data
    assert len(graph_data["nodes"]) >= 500
    assert len(graph_data["edges"]) >= 500
    edge_types = {e["attributes"]["type"] for e in graph_data["edges"]}
    for req_type in ("contains", "defines", "uses_term", "refers_to", "in_register"):
        assert req_type in edge_types, f"Missing edge type '{req_type}' in graph.json"

    assert (REPO_ROOT / "app" / "structure" / "page.tsx").is_file()
    assert (REPO_ROOT / "e2e" / "map.spec.ts").is_file()


def test_part2_five_city_corporations_369_wards_and_2026_consolidated_views() -> None:
    """Part 2 (`12-bengaluru-city-overnight.md` §3 Part 2): Parent `in-ka-bengaluru` and 5 child City Corporations exist with 369 total wards, R15 retrieval records, and per-corporation 2026 Building (Amendment) Bye-laws consolidated views."""
    parent_cfg = load_jurisdiction_config("in-ka-bengaluru")
    assert parent_cfg.release_version is not None
    parent_rel_dir = REPO_ROOT / "public" / "data" / "in-ka-bengaluru" / parent_cfg.release_version
    parent_boundary = json.loads((parent_rel_dir / "boundary.geojson").read_text(encoding="utf-8"))
    parent_zones = json.loads((parent_rel_dir / "gba-zones.geojson").read_text(encoding="utf-8"))
    parent_wards = json.loads((parent_rel_dir / "wards.geojson").read_text(encoding="utf-8"))
    assert len(parent_boundary["features"]) == 5
    assert len(parent_zones["features"]) == 10
    assert len(parent_wards["features"]) == 369

    expected_wards = {
        "in-ka-bengaluru-central": (63, "bccc-bbl-amend-2026-05", "Bengaluru Central City Corporation"),
        "in-ka-bengaluru-north": (72, "bncc-bbl-amend-2026-05", "Bengaluru North City Corporation"),
        "in-ka-bengaluru-south": (72, "bscc-bbl-amend-2026-05", "Bengaluru South City Corporation"),
        "in-ka-bengaluru-east": (50, "becc-bbl-amend-2026-05", "Bengaluru East City Corporation"),
        "in-ka-bengaluru-west": (112, "bwcc-bbl-amend-2026-05", "Bengaluru West City Corporation"),
    }
    total_child_wards = 0
    clause_6_texts: dict[str, str] = {}

    for corp_id, (exp_ward_cnt, final_doc_id, corp_label) in expected_wards.items():
        cfg = load_jurisdiction_config(corp_id)
        assert cfg.parent == "in-ka-bengaluru"
        assert cfg.release_version is not None
        rel_dir = REPO_ROOT / "public" / "data" / corp_id / cfg.release_version
        wards_fc = json.loads((rel_dir / "wards.geojson").read_text(encoding="utf-8"))
        assert len(wards_fc["features"]) == exp_ward_cnt
        total_child_wards += len(wards_fc["features"])

        cons = validate_file(rel_dir / "consolidated.json", "consolidated")
        rec_by_id = {r["clause_id"]: r for r in cons["records"]}
        assert "bbl-2003:3.8" in rec_by_id and rec_by_id["bbl-2003:3.8"]["omitted"] is True
        assert "bbl-2003:3.9" in rec_by_id and rec_by_id["bbl-2003:3.9"]["omitted"] is True
        assert "bbl-2003:3.10" in rec_by_id and rec_by_id["bbl-2003:3.10"]["omitted"] is True
        assert "bbl-2003:6.0(i)" in rec_by_id
        c6_text = str(rec_by_id["bbl-2003:6.0(i)"]["text"])
        assert corp_label in c6_text
        assert final_doc_id in ",".join(rec_by_id["bbl-2003:6.0(i)"]["amendments_applied"])
        clause_6_texts[corp_id] = c6_text

    assert total_child_wards == 369
    assert len(set(clause_6_texts.values())) == 5, (
        "Each of the 5 City Corporations must have its own distinct consolidated text for Bye-law 6.0(i)"
    )
