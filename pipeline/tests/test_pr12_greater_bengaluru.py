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
