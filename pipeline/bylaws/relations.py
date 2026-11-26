"""Stage 8.6b: Build rebuilt Schema 1.4 `relations.json`, `relations.md`, and 60-item owner labelling sheet (Part 4)."""

from __future__ import annotations

import re
from collections import Counter
from pathlib import Path
from typing import Any

import yaml

from bylaws.config import JurisdictionConfig, load_jurisdiction_config
from bylaws.root import resolve_repo_root
from bylaws.schema_validator import validate_payload

INTER_INSTRUMENT_PRECEDENCE_RE = re.compile(
    r"\b(?:notwithstanding\s+anything(?:\s+contained\s+in)?|in\s+supersession\s+of|shall\s+prevail|apply\s+mutatis\s+mutandis\s+as\s+part\s+of|in\s+conformity\s+with\s+the\s+(?:provisions?\s+of\s+the\s+[A-Z][A-Za-z\s]+Act|Act,\s+the\s+master\s+plan)|in\s+accordance\s+with\s+the\s+(?:Act,\s+the\s+)?master\s+plan|not\s+inconsistent\s+with\s+(?:this\s+|the\s+)?Act|over\s+and\s+above\s+the\s+ordinarily\s+permissible)[^.;\n]{0,160}",
    re.IGNORECASE,
)

TERM_CANONICAL_ALIASES: dict[str, str] = {
    "corner site": "corner plot",
    "drains": "drain",
    "dwelling unit/tenement": "dwelling unit",
    "high rise building or multi-storeyed building": "high-rise building",
    "set back line": "building setback",
}

INCORPORATED_PARAMETER_SPECS: tuple[tuple[str, str, tuple[str, ...]], ...] = (
    ("use, coverage, far, setbacks, height, floors, dwelling_units, parking", "hierarchy_applicability", ("chp_1", "sec_DEFINITIONS")),
    ("use", "land_use", ("chp_2", "chp_4__cl_4.1")),
    ("coverage", "ground_coverage", ("chp_4__cl_4.1__cl_4.1.3__tbl_10", "chp_4__cl_4.2__cl_4.2.2__tbl_12", "chp_4__cl_4.1__cl_4.1.3__tbl_1", "chp_4__cl_4.2__cl_4.2.2__tbl_2")),
    ("far", "far", ("chp_4__cl_4.1__cl_4.1.3__tbl_10", "chp_7__cl_7.1__cl_5__tbl_20", "chp_4__cl_4.1__cl_4.1.3__tbl_1", "chp_7__cl_7.1__cl_5__tbl_1")),
    ("setbacks", "setbacks", ("chp_3__cl_3.1", "chp_3__cl_3.1__tbl_8", "chp_3__cl_3.4__tbl_9", "chp_3__cl_3.1__tbl_1", "chp_3__cl_3.4__tbl_1")),
    ("height", "building_height", ("chp_3__cl_3.4__tbl_9", "chp_3__cl_3.4__tbl_1", "chp_4__cl_4.1__cl_4.1.2__item_b")),
    ("floors", "building_height", ("chp_4__cl_4.1__cl_4.1.2__item_b",)),
    ("dwelling_units", "plot_size_frontage", ("chp_4__cl_4.1__cl_4.1.2__item_c",)),
    ("parking", "parking", ("chp_8", "chp_8__tbl_23", "chp_8__tbl_1")),
    ("tdr", "tdr_premium_far", ("chp_10", "chp_11_2", "chp_11.0")),
)


def _active_node_text(node: dict[str, Any]) -> str:
    versions = list(node.get("versions") or [])
    src = versions[-1] if versions else node
    raw_parts = [
        str(src.get(k) or "").strip()
        for k in ("heading", "intro", "content", "wrap_up")
        if src.get(k)
    ]
    deduped: list[str] = []
    for p in raw_parts:
        if not p:
            continue
        if any(p.lower() in existing.lower() for existing in deduped):
            continue
        deduped = [ex for ex in deduped if ex.lower() not in p.lower()]
        deduped.append(p)
    if deduped:
        return " — ".join(deduped)
    return str(node.get("text") or node.get("eid") or "")


def _is_applicable_in_jurisdiction(doc: Any) -> bool:
    """Return True if `doc` is an active non-draft instrument applicable in this jurisdiction."""
    if getattr(doc, "legal_status", None) == "draft":
        return False
    if getattr(doc, "role", None) == "reference":
        return False
    app = getattr(doc, "applies_to_jurisdiction", None)
    if app is not None and getattr(app, "status", None) in {"no", "unknown"}:
        return False
    return "model" not in str(getattr(doc, "id", "")).lower()


def build_jurisdiction_relations(
    config: JurisdictionConfig,
    *,
    clause_trees: dict[str, dict[str, Any]],
    annotation_docs: dict[str, dict[str, Any]],
    amendments_data: dict[str, Any],
    repo_root: Path | None = None,
) -> tuple[dict[str, Any], str]:
    """Build rebuilt Schema 1.4 `relations.json` payload and `relations.md` QA report for `config`."""
    root = repo_root or resolve_repo_root()
    topics_path = root / "topics.yaml"
    raw_topics = (
        yaml.safe_load(topics_path.read_text(encoding="utf-8"))
        if topics_path.is_file()
        else {}
    ) or {}
    topics_list: list[dict[str, Any]] = list(raw_topics.get("topics") or [])

    succ_path = root / "succession.yaml"
    raw_succ = (
        yaml.safe_load(succ_path.read_text(encoding="utf-8"))
        if succ_path.is_file()
        else {}
    ) or {}
    succession_list: list[dict[str, Any]] = []
    for item in raw_succ.get("succession") or []:
        by_jur = item.get("by_jurisdiction") or {}
        resolved_new = str(by_jur.get(config.id) or item.get("new_body") or "")
        succession_list.append(
            {
                "id": str(item["id"]),
                "old_body": str(item["old_body"]),
                "aliases": list(item.get("aliases") or []),
                "new_body": resolved_new,
                "effective_date": str(item["effective_date"]),
                "instrument_id": str(item["instrument_id"]),
                "instrument_title": str(item["instrument_title"]),
                "quoted_evidence": str(item["quoted_evidence"]),
                "source_url": str(item["source_url"]),
            }
        )

    doc_role_by_id = {d.id: d.role for d in config.documents}
    doc_layer_by_id = {d.id: d.layer for d in config.documents}
    applicable_doc_ids = {d.id for d in config.documents if _is_applicable_in_jurisdiction(d)}

    # Index nodes and annotations from applicable documents only
    node_by_doc_eid: dict[tuple[str, str], dict[str, Any]] = {}
    defs_by_term: dict[str, list[tuple[str, dict[str, Any]]]] = {}
    topics_by_node: dict[tuple[str, str], set[str]] = {}

    for doc_id, tree in sorted(clause_trees.items()):
        if doc_id not in applicable_doc_ids:
            continue
        for node in tree.get("clauses", []):
            if node.get("superseded_by") is not None or node.get("record_superseded_by") is not None:
                continue
            eid = str(node["eid"])
            node_by_doc_eid[(doc_id, eid)] = node
            norm_def = node.get("defines_normalised")
            if norm_def:
                raw_term = str(norm_def).strip().lower()
                canonical_term = TERM_CANONICAL_ALIASES.get(raw_term, raw_term)
                defs_by_term.setdefault(canonical_term, []).append((doc_id, node))

    for doc_id, ann_doc in sorted(annotation_docs.items()):
        if doc_id not in applicable_doc_ids:
            continue
        for ann in ann_doc.get("annotations", []):
            kind = str(ann.get("kind"))
            target = ann.get("target") or {}
            eid = str(target.get("eid") or "")
            val = str(ann.get("value") or "")
            if not eid or (doc_id, eid) not in node_by_doc_eid:
                continue
            if kind == "topic":
                topics_by_node.setdefault((doc_id, eid), set()).add(val)

    relations: list[dict[str, Any]] = []
    rel_seq = 0

    def _add_rel(
        *,
        kind: str,
        from_doc: str,
        from_eid: str,
        to_doc: str,
        to_eid: str,
        topic: str | None,
        parameter: str | None,
        from_span: str,
        to_span: str,
        precedence_span: str | None = None,
        applies_in: list[str] | None = None,
        method: str = "rule",
        confidence: float = 0.95,
        status: str = "confirmed",
        note: str | None = None,
        public_visible: bool | None = None,
        measured_precision: float | None = None,
        parameters_incorporated: list[str] | None = None,
    ) -> None:
        nonlocal rel_seq
        rel_seq += 1
        structurally_public = kind in {"amends", "incorporates", "corporation_differs"}
        entry: dict[str, Any] = {
            "id": f"rel_{rel_seq}",
            "kind": kind,
            "from_doc": from_doc,
            "from_eid": from_eid,
            "to_doc": to_doc,
            "to_eid": to_eid,
            "topic": topic,
            "parameter": parameter,
            "from_span": from_span[:280],
            "to_span": to_span[:280],
            "precedence_span": precedence_span[:280] if precedence_span else None,
            "method": method,
            "confidence": round(float(confidence), 3),
            "status": status,
            "note": note,
            "public_visible": (
                public_visible if public_visible is not None else structurally_public
            ),
            "measured_precision": (
                measured_precision
                if measured_precision is not None
                else (1.0 if structurally_public else None)
            ),
        }
        if parameters_incorporated:
            entry["parameters_incorporated"] = parameters_incorporated
        if applies_in:
            entry["applies_in"] = applies_in
        relations.append(entry)

    # 1. `incorporates` (public_visible: True): statutory incorporation by reference (Bye-law 1.4 -> Master Plan Zoning Regulations)
    planning_base_docs = [
        d_id
        for d_id in sorted(clause_trees)
        if d_id in applicable_doc_ids
        and doc_role_by_id.get(d_id) == "base"
        and doc_layer_by_id.get(d_id) == "planning"
    ]
    for (doc_id, eid), node in sorted(node_by_doc_eid.items()):
        if doc_role_by_id.get(doc_id) != "base" or doc_layer_by_id.get(doc_id) != "municipal":
            continue
        txt = _active_node_text(node)
        if "mutatis mutandis" in txt.lower() and "master plan" in txt.lower():
            for plan_doc_id in planning_base_docs:
                for param_key, topic_key, target_eids in INCORPORATED_PARAMETER_SPECS:
                    for cand_eid in target_eids:
                        if (plan_doc_id, cand_eid) not in node_by_doc_eid:
                            continue
                        target_node = node_by_doc_eid[(plan_doc_id, cand_eid)]
                        _add_rel(
                            kind="incorporates",
                            from_doc=doc_id,
                            from_eid=eid,
                            to_doc=plan_doc_id,
                            to_eid=cand_eid,
                            topic=topic_key,
                            parameter=param_key,
                            from_span=txt,
                            to_span=_active_node_text(target_node),
                            precedence_span=txt,
                            confidence=1.0,
                            status="confirmed",
                            public_visible=True,
                            measured_precision=1.0,
                            parameters_incorporated=[
                                "use",
                                "coverage",
                                "far",
                                "setbacks",
                                "height",
                                "floors",
                                "dwelling_units",
                                "parking",
                            ],
                            note=(
                                f"Bye-law {node.get('native_number') or node.get('number') or eid} of {doc_id} "
                                f"incorporates {plan_doc_id}:{cand_eid} mutatis mutandis for {param_key}."
                            ),
                        )

    # 2. `amends` (public_visible: True): applied statutory amendment effects
    for eff in amendments_data.get("effects") or []:
        if not eff.get("applied"):
            continue
        a_doc = str(eff.get("amending_doc") or "")
        a_eid = str(eff.get("amending_eid") or "")
        t_doc = str(eff.get("target_doc") or "")
        t_eid = str(eff.get("target_eid") or "")
        na = node_by_doc_eid.get((a_doc, a_eid))
        nt = node_by_doc_eid.get((t_doc, t_eid))
        if na is not None and nt is not None:
            t_topics = sorted(topics_by_node.get((t_doc, t_eid)) or [])
            _add_rel(
                kind="amends",
                from_doc=a_doc,
                from_eid=a_eid,
                to_doc=t_doc,
                to_eid=t_eid,
                topic=t_topics[0] if t_topics else "hierarchy_applicability",
                parameter=str(eff.get("action") or "substitute"),
                from_span=_active_node_text(na),
                to_span=_active_node_text(nt),
                applies_in=list(eff.get("applies_in") or []) or None,
                confidence=float(eff.get("confidence", 0.95)),
                status="confirmed",
                public_visible=True,
                measured_precision=1.0,
                note=f"Amending provision {a_doc}:{a_eid} ({eff.get('action')}, effective {eff.get('valid_from')}) amends {t_doc}:{t_eid}.",
            )

    # 3. `corporation_differs` (public_visible: True): provisions where 2026 City Corporation bye-laws differ
    parent_id = getattr(config, "parent", None) or (
        config.id
        if any(
            yp.stem.startswith(f"{config.id}-")
            for yp in (root / "jurisdictions").glob("*.yaml")
            if yp.stem != "resolution"
        )
        else None
    )
    if parent_id:
        parent_cfg = load_jurisdiction_config(parent_id, inherit_parent=False)
        links_by_target_corp: dict[str, list[tuple[str, dict[str, Any]]]] = {}
        for lnk in parent_cfg.amendment_links or []:
            app_in = list(getattr(lnk, "applies_in", None) or [])
            if app_in:
                t_clause = str(lnk.target_clause)
                links_by_target_corp.setdefault(t_clause, []).append(
                    (app_in[0], lnk.model_dump() if hasattr(lnk, "model_dump") else dict(lnk))
                )
        for target_ref, corp_items in sorted(links_by_target_corp.items()):
            if len(corp_items) < 2:
                continue
            t_doc, t_eid = target_ref.split(":", 1)
            if (t_doc, t_eid) not in node_by_doc_eid:
                continue
            c1_jur, lnk1 = corp_items[0]
            for c2_jur, lnk2 in corp_items[1:]:
                span1 = str(lnk1.get("replacement_text") or lnk1.get("note") or "")
                span2 = str(lnk2.get("replacement_text") or lnk2.get("note") or "")
                t_topics = sorted(topics_by_node.get((t_doc, t_eid)) or ["deviations_regularisation"])
                _add_rel(
                    kind="corporation_differs",
                    from_doc=t_doc,
                    from_eid=t_eid,
                    to_doc=t_doc,
                    to_eid=t_eid,
                    topic=t_topics[0] if t_topics else "deviations_regularisation",
                    parameter=f"{c1_jur} vs {c2_jur}",
                    from_span=f"[{c1_jur}] {span1}",
                    to_span=f"[{c2_jur}] {span2}",
                    applies_in=[c1_jur, c2_jur],
                    confidence=0.98,
                    status="confirmed",
                    public_visible=True,
                    measured_precision=1.0,
                    note=f"This rule ({target_ref}) is enacted by separate 2026 City Corporation Building (Amendment) Bye-laws in {c1_jur} ({lnk1['amending_clause']}) and {c2_jur} ({lnk2['amending_clause']}).",
                )

    # 4. `cross_document_reference` (public_visible: False until owner precision >= 0.8)
    for eff in amendments_data.get("effects") or []:
        a_doc = str(eff.get("amending_doc") or "")
        a_eid = str(eff.get("amending_eid") or "")
        t_doc = str(eff.get("target_doc") or "")
        t_eid = str(eff.get("target_eid") or "")
        if a_doc not in applicable_doc_ids or t_doc not in applicable_doc_ids:
            continue
        if (a_doc, a_eid) in node_by_doc_eid and (t_doc, t_eid) in node_by_doc_eid:
            na = node_by_doc_eid[(a_doc, a_eid)]
            nt = node_by_doc_eid[(t_doc, t_eid)]
            t_topics = sorted(topics_by_node.get((t_doc, t_eid)) or [])
            _add_rel(
                kind="cross_document_reference",
                from_doc=a_doc,
                from_eid=a_eid,
                to_doc=t_doc,
                to_eid=t_eid,
                topic=t_topics[0] if t_topics else "hierarchy_applicability",
                parameter=str(eff.get("action") or "reference"),
                from_span=_active_node_text(na),
                to_span=_active_node_text(nt),
                applies_in=list(eff.get("applies_in") or []) or None,
                confidence=0.95,
                status="confirmed",
                public_visible=False,
                measured_precision=None,
                note=f"Cross-document reference from {a_doc}:{a_eid} to {t_doc}:{t_eid}.",
            )

    # 5. `definition_differs` (public_visible: False until owner precision >= 0.8): only between applicable documents
    for norm_term, items in sorted(defs_by_term.items()):
        if len(items) < 2:
            continue
        items_sorted = sorted(
            items,
            key=lambda x: (0 if doc_role_by_id.get(x[0]) == "base" else 1, x[0]),
        )
        d1_id, n1 = items_sorted[0]
        t1 = _active_node_text(n1)
        for d2_id, n2 in items_sorted[1:]:
            if d1_id == d2_id:
                continue
            t2 = _active_node_text(n2)
            if t1.strip().lower() != t2.strip().lower():
                _add_rel(
                    kind="definition_differs",
                    from_doc=d1_id,
                    from_eid=str(n1["eid"]),
                    to_doc=d2_id,
                    to_eid=str(n2["eid"]),
                    topic="definitions",
                    parameter=norm_term,
                    from_span=t1,
                    to_span=t2,
                    confidence=0.95,
                    status="confirmed",
                    public_visible=False,
                    measured_precision=None,
                    note=f"Term '{norm_term}' is defined with different wording in applicable documents {d1_id} and {d2_id}.",
                )

    # 6. `precedence` (public_visible: False until owner precision >= 0.8): ONLY inter-instrument precedence (`from_doc != to_doc`)
    base_docs = [
        d_id
        for d_id in sorted(clause_trees)
        if d_id in applicable_doc_ids and doc_role_by_id.get(d_id) == "base"
    ]
    for (doc_id, eid), node in sorted(node_by_doc_eid.items()):
        txt = _active_node_text(node)
        m_prec = INTER_INSTRUMENT_PRECEDENCE_RE.search(txt)
        if not m_prec:
            continue
        prec_quote = m_prec.group(0).strip()
        other_doc = next((b for b in base_docs if b != doc_id), None)
        if not other_doc or other_doc == doc_id:
            continue
        node_topics = sorted(topics_by_node.get((doc_id, eid)) or [])
        topic_val = node_topics[0] if node_topics else "hierarchy_applicability"
        other_eid = "part_I__sec_1.0" if (other_doc, "part_I__sec_1.0") in node_by_doc_eid else (
            "chp_1" if (other_doc, "chp_1") in node_by_doc_eid else eid
        )
        if topic_val:
            cand_other = next(
                (
                    oeid
                    for (od, oeid), otset in sorted(topics_by_node.items())
                    if od == other_doc and topic_val in otset
                ),
                None,
            )
            if cand_other:
                other_eid = cand_other
        if (other_doc, other_eid) not in node_by_doc_eid:
            other_eid = next(oeid for (od, oeid) in sorted(node_by_doc_eid) if od == other_doc)
        other_node = node_by_doc_eid[(other_doc, other_eid)]
        _add_rel(
            kind="precedence",
            from_doc=doc_id,
            from_eid=eid,
            to_doc=other_doc,
            to_eid=other_eid,
            topic=topic_val,
            parameter="statutory_precedence",
            from_span=txt,
            to_span=_active_node_text(other_node),
            precedence_span=prec_quote,
            confidence=0.95,
            status="confirmed",
            public_visible=False,
            measured_precision=None,
            note=f"Inter-instrument statutory precedence in {doc_id}:{eid} over {other_doc}:{other_eid}: \"{prec_quote}\"",
        )

    payload: dict[str, Any] = {
        "schema_version": "1.4",
        "jurisdiction": config.id,
        "topics": topics_list,
        "succession": succession_list,
        "relations": relations,
    }
    validate_payload(payload, "relations")

    # Build relations.md QA report
    by_kind = Counter(r["kind"] for r in relations)
    by_status = Counter(r["status"] for r in relations)
    md_lines: list[str] = [
        f"# Relations, Topics, Precedence & Succession QA Report (`{config.id}`)",
        "",
        "## 1. Summary Counts by Relation Kind and Visibility",
        "",
        "| Relation Kind | Total Count | Public Visible | Confirmed |",
        "|---|---:|---|---:|",
    ]
    for k in (
        "amends",
        "incorporates",
        "corporation_differs",
        "cross_document_reference",
        "definition_differs",
        "precedence",
    ):
        tot_k = by_kind.get(k, 0)
        pub_k = "Yes (`measured_precision = 1.0`)" if k in {"amends", "incorporates", "corporation_differs"} else "Hidden (`pending owner precision >= 0.8`)"
        conf_k = sum(1 for r in relations if r["kind"] == k and r["status"] == "confirmed")
        md_lines.append(f"| `{k}` | {tot_k} | {pub_k} | {conf_k} |")
    md_lines.append(
        f"| **Total** | **{len(relations)}** | — | **{by_status.get('confirmed', 0)}** |"
    )
    md_lines.append("")

    md_lines.extend(
        [
            "## 2. Statutory Precedence Relations (Quoted Law Spans)",
            "",
            "| ID | From Provision | To Provision | Topic | Quoted Statutory Precedence Span |",
            "|---|---|---|---|---|",
        ]
    )
    for r in relations:
        if r["kind"] == "precedence":
            q_span = str(r.get("precedence_span") or "").replace("|", "\\|").replace("\n", " ")
            md_lines.append(
                f"| `{r['id']}` | `{r['from_doc']}:{r['from_eid']}` | `{r['to_doc']}:{r['to_eid']}` | `{r.get('topic') or 'general'}` | {q_span} |"
            )
    md_lines.append("")

    # Also write the 60-item owner labelling sheet (`docs/review/relations-labelling.md`) when running on a public jurisdiction with all 6 kinds
    if config.visibility != "test" and all(
        by_kind.get(k, 0) >= 10
        for k in (
            "amends",
            "incorporates",
            "corporation_differs",
            "cross_document_reference",
            "definition_differs",
            "precedence",
        )
    ):
        _write_relations_labelling_sheet(root / "docs" / "review" / "relations-labelling.md", relations)

    return payload, "\n".join(md_lines) + "\n"


def _write_relations_labelling_sheet(out_path: Path, relations: list[dict[str, Any]]) -> None:
    """Write a 60-item owner precision labelling sheet (10 sampled items per relation kind across the 6 legal kinds)."""
    out_path.parent.mkdir(parents=True, exist_ok=True)
    kinds_order = (
        "amends",
        "incorporates",
        "corporation_differs",
        "cross_document_reference",
        "definition_differs",
        "precedence",
    )
    lines: list[str] = [
        "# Relations Precision Labelling Sheet (60 Items — 10 per Kind)",
        "",
        "Prepared for owner review (`docs/plans/building-code-plan.md` Part 4). Structurally confirmed kinds (`amends`, `incorporates`, `corporation_differs`) are shown publicly (`public_visible: true`). Heuristic/extracted kinds (`cross_document_reference`, `definition_differs`, `precedence`) remain hidden in the public interface until owner precision measurement reaches at least `0.80` (`8/10` per kind).",
        "",
        "## Instructions for Owner Review",
        "",
        "Mark each sampled relation row with `[x] Correct` or `[ ] False Positive` in the **Owner Verdict** column.",
        "",
    ]

    item_num = 0
    for kind in kinds_order:
        kind_items = [r for r in relations if r["kind"] == kind][:10]
        vis_badge = "Public (`public_visible: true`)" if kind in {"amends", "incorporates", "corporation_differs"} else "Hidden (`public_visible: false` until precision >= 0.8)"
        lines.extend(
            [
                f"## Kind: `{kind}` ({len(kind_items)} sampled · {vis_badge})",
                "",
                "| # | Relation ID | Kind | From (`doc:eid`) | To (`doc:eid`) | Parameter / Subject | From Excerpt | To Excerpt | Owner Verdict |",
                "|---:|---|---|---|---|---|---|---|---|",
            ]
        )
        for r in kind_items:
            item_num += 1
            f_span = str(r.get("from_span") or "").replace("|", "\\|").replace("\n", " ")[:90]
            t_span = str(r.get("to_span") or "").replace("|", "\\|").replace("\n", " ")[:90]
            param = str(r.get("parameter") or r.get("topic") or "").replace("|", "\\|")
            lines.append(
                f"| {item_num} | `{r['id']}` | `{kind}` | `{r['from_doc']}:{r['from_eid']}` | `{r['to_doc']}:{r['to_eid']}` | `{param}` | {f_span} | {t_span} | `[ ] Correct / [ ] FP` |"
            )
        lines.append("")

    out_path.write_text("\n".join(lines), encoding="utf-8")
