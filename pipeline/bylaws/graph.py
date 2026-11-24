"""Stage 8.8: Build Graphology `graph.json` and Gephi `graph.graphml` knowledge graph exports (`08b` §4.1)."""

from __future__ import annotations

import json
from html import escape
from pathlib import Path
from typing import Any

from bylaws.config import JurisdictionConfig

DISPLAY_CONFIDENCE_THRESHOLD = 0.8


def build_jurisdiction_graph(
    config: JurisdictionConfig,
    *,
    documents_list: list[dict[str, Any]],
    clause_trees: dict[str, dict[str, Any]],
    annotation_docs: dict[str, dict[str, Any]],
    amendments_data: dict[str, Any],
) -> tuple[dict[str, Any], str]:
    """Build Graphology JSON (`graph.json`) and XML GraphML (`graph.graphml`) for a jurisdiction release."""
    parent_jurisdiction = (
        config.parents[0] if config.parents else getattr(config, "parent", None)
    )
    nodes: list[dict[str, Any]] = []
    edges: list[dict[str, Any]] = []
    seen_nodes: set[str] = set()
    edge_seq = 0

    def _add_node(key: str, attrs: dict[str, Any]) -> None:
        if key in seen_nodes:
            return
        seen_nodes.add(key)
        nodes.append({"key": key, "attributes": attrs})

    def _add_edge(
        source: str,
        target: str,
        edge_type: str,
        *,
        evidence: str,
        method: str = "rule",
        confidence: float = 1.0,
    ) -> None:
        nonlocal edge_seq
        if confidence < DISPLAY_CONFIDENCE_THRESHOLD:
            return
        edge_seq += 1
        edges.append(
            {
                "key": f"e_{edge_seq}",
                "source": source,
                "target": target,
                "attributes": {
                    "type": edge_type,
                    "evidence": evidence,
                    "method": method,
                    "confidence": round(float(confidence), 3),
                },
            }
        )

    # 1. Register & Document nodes (`in_register`)
    reg_root_key = f"register:{config.id}"
    _add_node(
        reg_root_key,
        {
            "label": f"{config.name} Source Register",
            "kind": "register",
            "jurisdiction": config.id,
            "parent_jurisdiction": parent_jurisdiction,
        },
    )

    for doc_meta in documents_list:
        doc_id = str(doc_meta["doc_id"])
        doc_key = f"doc:{doc_id}"
        _add_node(
            doc_key,
            {
                "label": str(doc_meta.get("title") or doc_id),
                "kind": "document",
                "doc_id": doc_id,
                "layer": str(doc_meta.get("layer") or ""),
                "legal_status": str(doc_meta.get("legal_status") or "in_force"),
                "jurisdiction": config.id,
                "parent_jurisdiction": parent_jurisdiction,
            },
        )
        _add_edge(
            doc_key,
            reg_root_key,
            "in_register",
            evidence=f"register:{doc_id}",
            method="rule",
            confidence=1.0,
        )

    # 2. Structural nodes, definitions, table_rows, and `contains` + `defines` edges
    for doc_id, tree in sorted(clause_trees.items()):
        doc_key = f"doc:{doc_id}"
        if doc_key not in seen_nodes:
            _add_node(
                doc_key,
                {
                    "label": doc_id,
                    "kind": "document",
                    "doc_id": doc_id,
                    "jurisdiction": config.id,
                    "parent_jurisdiction": parent_jurisdiction,
                },
            )
        for clause in tree.get("clauses", []):
            if (
                clause.get("superseded_by") is not None
                or clause.get("record_superseded_by") is not None
            ):
                continue
            eid = str(clause.get("eid") or clause.get("number") or "")
            if not eid:
                continue
            node_key = f"{doc_id}:{eid}"
            node_type = str(clause.get("type") or "clause")
            label = str(
                clause.get("heading")
                or clause.get("native_number")
                or clause.get("number")
                or eid
            )[:120]
            _add_node(
                node_key,
                {
                    "label": label,
                    "kind": node_type,
                    "doc_id": doc_id,
                    "eid": eid,
                    "native_number": clause.get("native_number"),
                    "legal_status": str(clause.get("legal_status") or "in_force"),
                    "jurisdiction": config.id,
                    "parent_jurisdiction": parent_jurisdiction,
                },
            )
            parent_eid = clause.get("parent_eid")
            parent_key = f"{doc_id}:{parent_eid}" if parent_eid else doc_key
            _add_edge(
                parent_key,
                node_key,
                "contains",
                evidence=node_key,
                method="rule",
                confidence=1.0,
            )

            if node_type == "definition" and clause.get("defines_normalised"):
                term_norm = str(clause["defines_normalised"]).strip().lower()
                term_key = f"term:{doc_id}:{term_norm}"
                _add_node(
                    term_key,
                    {
                        "label": str(clause.get("defines") or term_norm),
                        "kind": "defined_term",
                        "doc_id": doc_id,
                        "term": term_norm,
                        "jurisdiction": config.id,
                        "parent_jurisdiction": parent_jurisdiction,
                    },
                )
                _add_edge(
                    node_key,
                    term_key,
                    "defines",
                    evidence=node_key,
                    method="rule",
                    confidence=1.0,
                )

    # 3. Annotation edges (`uses_term`, `refers_to`) above display threshold
    for doc_id, ann_doc in sorted(annotation_docs.items()):
        for ann in ann_doc.get("annotations", []):
            conf = float(ann.get("confidence", 1.0))
            if conf < DISPLAY_CONFIDENCE_THRESHOLD:
                continue
            ann_id = str(ann["annotation_id"])
            kind = str(ann["kind"])
            target_info = ann.get("target") or {}
            src_eid = str(target_info.get("eid") or "")
            src_key = f"{doc_id}:{src_eid}"
            val = str(ann.get("value") or "")
            method = str(ann.get("method") or "rule")

            if kind == "defined_term_use" and val:
                target_def_key = f"{doc_id}:{val}" if ":" not in val else val
                _add_edge(
                    src_key,
                    target_def_key,
                    "uses_term",
                    evidence=ann_id,
                    method=method,
                    confidence=conf,
                )
            elif kind == "cross_reference" and val and not val.startswith("unresolved:"):
                if val.startswith("external:"):
                    ext_key = val
                    _add_node(
                        ext_key,
                        {
                            "label": val.replace("external:", ""),
                            "kind": "external_instrument",
                            "jurisdiction": config.id,
                            "parent_jurisdiction": parent_jurisdiction,
                        },
                    )
                    target_ref_key = ext_key
                else:
                    target_ref_key = f"{doc_id}:{val}" if ":" not in val else val
                _add_edge(
                    src_key,
                    target_ref_key,
                    "refers_to",
                    evidence=ann_id,
                    method=method,
                    confidence=conf,
                )

    # 4. Amendment effects (`amends` / `amended_by`)
    for eff in amendments_data.get("effects") or []:
        conf = float(eff.get("confidence", 1.0))
        if conf < DISPLAY_CONFIDENCE_THRESHOLD:
            continue
        eff_id = str(eff["effect_id"])
        amending_key = f"{eff['amending_doc']}:{eff['amending_eid']}"
        target_key = f"{eff['target_doc']}:{eff['target_eid']}"
        _add_edge(
            amending_key,
            target_key,
            "amends",
            evidence=eff_id,
            method="rule",
            confidence=conf,
        )
        _add_edge(
            target_key,
            amending_key,
            "amended_by",
            evidence=eff_id,
            method="rule",
            confidence=conf,
        )

    graphology_payload: dict[str, Any] = {
        "attributes": {
            "name": f"{config.name} Regulatory Knowledge Graph",
            "jurisdiction": config.id,
            "parent_jurisdiction": parent_jurisdiction,
            "display_confidence_threshold": DISPLAY_CONFIDENCE_THRESHOLD,
        },
        "options": {
            "type": "directed",
            "multi": True,
            "allowSelfLoops": False,
        },
        "nodes": nodes,
        "edges": edges,
    }

    # Build GraphML export for Gephi / NetworkX
    graphml_lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<graphml xmlns="http://graphml.graphdrawing.org/xmlns">',
        '  <key id="label" for="node" attr.name="label" attr.type="string"/>',
        '  <key id="kind" for="node" attr.name="kind" attr.type="string"/>',
        '  <key id="doc_id" for="node" attr.name="doc_id" attr.type="string"/>',
        '  <key id="jurisdiction" for="node" attr.name="jurisdiction" attr.type="string"/>',
        '  <key id="type" for="edge" attr.name="type" attr.type="string"/>',
        '  <key id="evidence" for="edge" attr.name="evidence" attr.type="string"/>',
        '  <key id="confidence" for="edge" attr.name="confidence" attr.type="double"/>',
        f'  <graph id="{escape(config.id)}" edgedefault="directed">',
    ]
    for n in nodes:
        nk = escape(str(n["key"]))
        na = n["attributes"]
        graphml_lines.append(f'    <node id="{nk}">')
        graphml_lines.append(f'      <data key="label">{escape(str(na.get("label") or ""))}</data>')
        graphml_lines.append(f'      <data key="kind">{escape(str(na.get("kind") or ""))}</data>')
        if na.get("doc_id"):
            graphml_lines.append(f'      <data key="doc_id">{escape(str(na["doc_id"]))}</data>')
        graphml_lines.append(
            f'      <data key="jurisdiction">{escape(str(na.get("jurisdiction") or config.id))}</data>'
        )
        graphml_lines.append("    </node>")
    for e in edges:
        ek = escape(str(e["key"]))
        es = escape(str(e["source"]))
        et = escape(str(e["target"]))
        ea = e["attributes"]
        graphml_lines.append(f'    <edge id="{ek}" source="{es}" target="{et}">')
        graphml_lines.append(f'      <data key="type">{escape(str(ea["type"]))}</data>')
        graphml_lines.append(f'      <data key="evidence">{escape(str(ea["evidence"]))}</data>')
        graphml_lines.append(f'      <data key="confidence">{ea["confidence"]}</data>')
        graphml_lines.append("    </edge>")
    graphml_lines.append("  </graph>")
    graphml_lines.append("</graphml>")

    return graphology_payload, "\n".join(graphml_lines) + "\n"


def write_jurisdiction_graph_files(
    config: JurisdictionConfig,
    *,
    processed_dir: Path,
    documents_list: list[dict[str, Any]],
    clause_trees: dict[str, dict[str, Any]],
    annotation_docs: dict[str, dict[str, Any]],
    amendments_data: dict[str, Any],
) -> None:
    """Write `graph.json` and `graph.graphml` into `processed_dir`."""
    graph_json, graphml_str = build_jurisdiction_graph(
        config,
        documents_list=documents_list,
        clause_trees=clause_trees,
        annotation_docs=annotation_docs,
        amendments_data=amendments_data,
    )
    (processed_dir / "graph.json").write_text(
        json.dumps(graph_json, indent=2) + "\n", encoding="utf-8"
    )
    (processed_dir / "graph.graphml").write_text(graphml_str, encoding="utf-8")
