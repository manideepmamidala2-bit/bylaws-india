"""Layer 2 stand-off character-span annotations (`<doc_id>.annotations.json`, Schema v1.3)."""

from __future__ import annotations

import re
from typing import Any

import yaml

from bylaws.root import resolve_repo_root
from bylaws.schema_validator import validate_payload

QUANTITY_SPAN_RE = re.compile(
    r"\b(?P<num>\d+(?:,\d+)*(?:\.\d+)?)\s*(?P<unit>sq\s*\.?\s*m(?:trs?|etres?|eters?)?|m2|sq\s*\.?\s*ft|m(?:trs?|etres?|eters?)|ft|feet|%|percent|floors?|storeys?)\b",
    re.IGNORECASE,
)

ZONE_APPLICABILITY_RULES: tuple[tuple[str, re.Pattern[str]], ...] = (
    ("R-MAIN", re.compile(r"\bresidential\s*\(\s*main\s*\)|\bresidential\s+main\b", re.IGNORECASE)),
    ("R-MIX", re.compile(r"\bresidential\s*\(\s*mixed\s*\)|\bresidential\s+mixed\b", re.IGNORECASE)),
    ("C-BIZ", re.compile(r"\bcommercial\s*\(\s*(?:business|central)\s*\)|\bcommercial\s+business\b", re.IGNORECASE)),
    ("C-AXES", re.compile(r"\bcommercial\s+axes\b|\bmutation\s+corridors?\b", re.IGNORECASE)),
    ("I-GEN", re.compile(r"\bindustrial\s*(?:\[\s*i\s*\(\s*general\s*\)\s*\]|\(\s*i-general\s*\)|i\s*\(\s*general\s*\))", re.IGNORECASE)),
    ("I-HITECH", re.compile(r"\bindustrial\s*\(\s*hi-?tech\s*\)|\bhigh\s+tech\b", re.IGNORECASE)),
    ("PSP", re.compile(r"\bpublic\s+and\s+semi-?public\b|\bP\s*&\s*SP\b", re.IGNORECASE)),
    ("T-TRANS", re.compile(r"\btraffic\s+and\s+transportation\b|\bT\s*&\s*T\b", re.IGNORECASE)),
    ("G-PARK", re.compile(r"\bpark\s+and\s+open\s+space\b|\bparks?\s+and\s+open\s+spaces?\b", re.IGNORECASE)),
    ("G-LAKE", re.compile(r"\bwater\s+bodies\b|\blake\s+buffer\b|\bvalley\s*/\s*drain\b|\bnalas?\b", re.IGNORECASE)),
    ("ALL", re.compile(r"\bapplicable\s+to\s+all\s+zones\b|\bin\s+all\s+zones\b|\ball\s+types\s+of\s+buildings\b|\bevery\s+building\b", re.IGNORECASE)),
)

EID_ZONE_PREFIX_MAP: tuple[tuple[str, str], ...] = (
    ("chp_4__cl_4.12__cl_4.12.2", "G-LAKE"),
    ("chp_4__cl_4.12", "G-PARK"),
    ("chp_4__cl_4.10", "T-TRANS"),
    ("chp_4__cl_4.9", "PSP"),
    ("chp_4__cl_4.8", "I-HITECH"),
    ("chp_4__cl_4.7", "I-GEN"),
    ("chp_4__cl_4.6", "C-AXES"),
    ("chp_4__cl_4.5", "C-AXES"),
    ("chp_4__cl_4.4", "C-BIZ"),
    ("chp_4__cl_4.3", "C-BIZ"),
    ("chp_4__cl_4.2", "R-MIX"),
    ("chp_4__cl_4.1", "R-MAIN"),
    ("chp_3__cl_3.1", "ALL"),
    ("chp_3__cl_3.4", "ALL"),
    ("chp_3__cl_3.9", "ALL"),
    ("chp_3__cl_3.10", "ALL"),
    ("chp_8", "ALL"),
    ("chp_9", "ALL"),
    ("chp_10", "ALL"),
    ("chp_11", "ALL"),
)


def _load_compiled_topics() -> list[tuple[str, list[re.Pattern[str]]]]:
    topics_path = resolve_repo_root() / "topics.yaml"
    if not topics_path.is_file():
        return []
    raw = yaml.safe_load(topics_path.read_text(encoding="utf-8")) or {}
    out: list[tuple[str, list[re.Pattern[str]]]] = []
    for t in raw.get("topics") or []:
        tid = str(t["id"])
        pats = [
            re.compile(rf"\b{re.escape(str(p).strip())}\b", re.IGNORECASE)
            for p in (t.get("seed_phrases") or [])
            if str(p).strip()
        ]
        out.append((tid, pats))
    return out


def _normalise_quantity(num_str: str, unit_str: str) -> str:
    val = float(num_str.replace(",", ""))
    u = re.sub(r"[\s.]+", "", unit_str.lower())
    if u in {"sqm", "sqmt", "sqmtr", "sqmtrs", "sqmetre", "sqmetres", "sqmeter", "sqmeters", "m2"}:
        return f"{val:g} sq_m"
    if u in {"sqft"}:
        return f"{round(val * 0.092903, 2):g} sq_m ({val:g} sq_ft)"
    if u in {"m", "mt", "mtr", "mtrs", "metre", "metres", "meter", "meters"}:
        return f"{val:g} m"
    if u in {"ft", "feet"}:
        return f"{round(val * 0.3048, 2):g} m ({val:g} ft)"
    if u in {"%", "percent"}:
        return f"{val:g} percent"
    if u.startswith(("floor", "storey")):
        return f"{int(val)} floors"
    return f"{val:g} {u}"

CROSS_REF_SPAN_RE = re.compile(
    r"\b(?P<kind>clause|sub-?clause|bye-?law|regulation|section|rule|table|schedule|appendix|annexure|chapter)\s*[-–.]?\s*"
    r"(?P<num>(?:\([a-z0-9]+\)|[IVXLCDM]+|\d+)(?:\s*-\s*[A-Za-z0-9]+|(?:\.\d+)*[A-Za-z]?(?:\([a-z0-9]+\))?)?)"
    r"(?:\s+of\s+(?:the\s+)?(?P<ext>Act|Karnataka\s+[A-Za-z\s]+Act(?:,\s*\d{4})?|National\s+Building\s+Code|Zoning\s+Regulations))?\b",
    re.IGNORECASE,
)

PROVISION_RULES: tuple[tuple[str, re.Pattern[str]], ...] = (
    ("commencement", re.compile(r"\b(?:come\s+into\s+(?:force|operation)|commencement)\b", re.IGNORECASE)),
    ("scope", re.compile(r"\b(?:short\s+title|shall\s+be\s+called|apply\s+to|applicable\s+(?:to|within))\b", re.IGNORECASE)),
    ("exception", re.compile(r"\bProvided\s+(?:further\s+|also\s+)?that\b", re.IGNORECASE)),
    ("prohibition", re.compile(r"\b(?:shall\s+not|no\s+person\s+shall|no\s+[a-z]+\s+building\s+shall|prohibited)\b", re.IGNORECASE)),
    ("permission", re.compile(r"\b(?:(?:Authority|Commissioner|Corporation|Government)\s+may|may\s+be\s+permitted|is\s+permissible)\b", re.IGNORECASE)),
    ("obligation", re.compile(r"\b(?:shall|must)\b", re.IGNORECASE)),
    ("fee", re.compile(r"\b(?:licence\s+fee|scrutiny\s+fee|security\s+deposit|ground\s+rent|cess|Rs\.\s*\d+)\b", re.IGNORECASE)),
)


class AnnotationSpanError(ValueError):
    """Raised when a stand-off annotation span is out of bounds or does not match the target text."""


def _get_node_field_text(
    node: dict[str, Any],
    field: str,
    cell_index: int | None = None,
) -> str | None:
    if field == "cell":
        cells = node.get("cells") or []
        if cell_index is None or cell_index < 0 or cell_index >= len(cells):
            return None
        return str(cells[cell_index])
    val = node.get(field)
    if isinstance(val, str):
        return val
    if field == "content":
        fallback = node.get("text")
        if isinstance(fallback, str):
            return fallback
    return None


def validate_annotations_against_tree(
    annotations_payload: dict[str, Any],
    tree_payload: dict[str, Any],
) -> None:
    """Validate `annotations_payload` against `annotations.schema.json` and check every character span."""
    validate_payload(annotations_payload, "annotations")

    by_eid: dict[str, dict[str, Any]] = {}
    for node in tree_payload.get("clauses", []):
        if node.get("superseded_by") is None and node.get("record_superseded_by") is None:
            eid = str(node.get("eid") or node.get("number") or "")
            if eid:
                by_eid[eid] = node

    for ann in annotations_payload.get("annotations", []):
        ann_id = str(ann.get("annotation_id", "<unknown>"))
        target = ann.get("target") or {}
        eid = str(target.get("eid", ""))
        field = str(target.get("field", ""))
        cell_index = target.get("cell_index")
        span = target.get("span") or []
        span_text = str(target.get("span_text", ""))

        node = by_eid.get(eid)
        if node is None:
            raise AnnotationSpanError(
                f"Annotation '{ann_id}' targets unknown node eid '{eid}'."
            )

        field_text = _get_node_field_text(node, field, cell_index)
        if field_text is None:
            raise AnnotationSpanError(
                f"Annotation '{ann_id}' targets missing field '{field}' on node '{eid}'."
            )

        if len(span) != 2:
            raise AnnotationSpanError(
                f"Annotation '{ann_id}' has invalid span {span!r}."
            )
        start, end = int(span[0]), int(span[1])
        if start < 0 or end <= start or end > len(field_text):
            raise AnnotationSpanError(
                f"Annotation '{ann_id}' span [{start}, {end}] is out of bounds for "
                f"'{eid}.{field}' (length {len(field_text)})."
            )
        actual_slice = field_text[start:end]
        if actual_slice != span_text:
            raise AnnotationSpanError(
                f"Annotation '{ann_id}' span_text mismatch on '{eid}.{field}[{start}:{end}]': "
                f"expected {span_text!r}, got {actual_slice!r}."
            )


def build_document_annotations(tree_payload: dict[str, Any]) -> dict[str, Any]:
    """Generate stand-off Layer 2 annotations (`cross_reference`, `defined_term_use`, `provision_type`)."""
    doc_id = str(tree_payload["doc_id"])
    jurisdiction = str(tree_payload["jurisdiction"])

    active_nodes = [
        n
        for n in tree_payload.get("clauses", [])
        if n.get("superseded_by") is None and n.get("record_superseded_by") is None
    ]

    eid_by_native: dict[str, str] = {}
    compiled_defined_terms: list[tuple[str, str, re.Pattern[str]]] = []
    seen_norm_terms: set[str] = set()
    stopword_terms = {
        "a",
        "an",
        "the",
        "in",
        "of",
        "to",
        "for",
        "and",
        "or",
        "by",
        "on",
        "at",
        "as",
        "is",
        "be",
        "it",
        "that",
        "this",
        "with",
        "from",
        "all",
        "any",
        "no",
        "not",
        "such",
        "every",
        "each",
        "other",
        "under",
        "within",
        "where",
        "when",
        "which",
        "who",
    }
    for node in active_nodes:
        eid = str(node.get("eid") or "")
        native = str(node.get("native_number") or node.get("number") or "").strip()
        if native and eid:
            eid_by_native[native.lower()] = eid
            eid_by_native[re.sub(r"\s+", " ", native.lower())] = eid
        if node.get("type") == "definition":
            norm_term = str(node.get("defines_normalised") or "").strip().lower()
            if (
                norm_term
                and len(norm_term) >= 3
                and norm_term not in stopword_terms
                and norm_term not in seen_norm_terms
                and eid
            ):
                seen_norm_terms.add(norm_term)
                compiled_defined_terms.append(
                    (
                        norm_term,
                        eid,
                        re.compile(rf"\b{re.escape(norm_term)}\b", re.IGNORECASE),
                    )
                )

    annotations: list[dict[str, Any]] = []
    seq = 0

    node_by_eid: dict[str, dict[str, Any]] = {}
    for node in active_nodes:
        eid = str(node.get("eid") or "")
        if eid:
            node_by_eid[eid] = node

    def _has_definition_ancestor(node: dict[str, Any]) -> bool:
        curr_p = node.get("parent_eid")
        visited: set[str] = set()
        while curr_p and curr_p in node_by_eid and curr_p not in visited:
            visited.add(curr_p)
            p_node = node_by_eid[curr_p]
            if p_node.get("type") == "definition":
                return True
            curr_p = p_node.get("parent_eid")
        return False

    compiled_topics = _load_compiled_topics()

    for node in active_nodes:
        eid = str(node.get("eid") or "")
        node_type = str(node.get("type") or "clause")
        versions = node.get("versions") or []
        version_id = str(versions[-1]["version_id"]) if versions else "v1"

        # Inspect body text fields present on the node (never annotate heading field)
        candidate_fields: list[tuple[str, str]] = []
        for field_name in ("intro", "content", "wrap_up"):
            f_val = node.get(field_name)
            if isinstance(f_val, str) and f_val.strip():
                candidate_fields.append((field_name, f_val))

        is_def_or_child = node_type == "definition" or _has_definition_ancestor(node)

        # 1. Provision type annotation (explicit rule order from 08b §2)
        prov_recorded = False
        for field_name, f_text in candidate_fields:
            for p_val, p_re in PROVISION_RULES:
                if p_val in {"commencement", "scope"}:
                    m_prov = p_re.search(f_text)
                    if m_prov:
                        s, e = m_prov.start(), m_prov.end()
                        seq += 1
                        annotations.append(
                            {
                                "annotation_id": f"{doc_id}:ann_{seq}",
                                "target": {
                                    "eid": eid,
                                    "version_id": version_id,
                                    "field": field_name,
                                    "span": [s, e],
                                    "span_text": f_text[s:e],
                                },
                                "kind": "provision_type",
                                "value": p_val,
                                "method": "rule",
                                "confidence": 0.95,
                                "verification": "machine_checked",
                            }
                        )
                        prov_recorded = True
                        break
            if prov_recorded:
                break

        if not prov_recorded and is_def_or_child:
            # Nodes inside a definition inherit `definition` unless they state an explicit exception or prohibition
            for field_name, f_text in candidate_fields:
                for p_val, p_re in PROVISION_RULES:
                    if p_val not in {"exception", "prohibition"}:
                        continue
                    m_prov = p_re.search(f_text)
                    if m_prov:
                        s, e = m_prov.start(), m_prov.end()
                        seq += 1
                        annotations.append(
                            {
                                "annotation_id": f"{doc_id}:ann_{seq}",
                                "target": {
                                    "eid": eid,
                                    "version_id": version_id,
                                    "field": field_name,
                                    "span": [s, e],
                                    "span_text": f_text[s:e],
                                },
                                "kind": "provision_type",
                                "value": p_val,
                                "method": "rule",
                                "confidence": 0.95,
                                "verification": "machine_checked",
                            }
                        )
                        prov_recorded = True
                        break
                if prov_recorded:
                    break
            if not prov_recorded and candidate_fields:
                field_name, f_text = candidate_fields[0]
                m_means = re.search(r"\b(?:means|includes)\b", f_text, re.IGNORECASE)
                span_pair = (
                    [m_means.start(), m_means.end()]
                    if m_means
                    else [0, min(len(f_text), len(f_text.split()[0]))]
                )
                seq += 1
                annotations.append(
                    {
                        "annotation_id": f"{doc_id}:ann_{seq}",
                        "target": {
                            "eid": eid,
                            "version_id": version_id,
                            "field": field_name,
                            "span": span_pair,
                            "span_text": f_text[span_pair[0] : span_pair[1]],
                        },
                        "kind": "provision_type",
                        "value": "definition",
                        "method": "rule",
                        "confidence": 1.0,
                        "verification": "machine_checked",
                    }
                )
                prov_recorded = True

        if not prov_recorded:
            for field_name, f_text in candidate_fields:
                for p_val, p_re in PROVISION_RULES:
                    m_prov = p_re.search(f_text)
                    if m_prov:
                        s, e = m_prov.start(), m_prov.end()
                        seq += 1
                        annotations.append(
                            {
                                "annotation_id": f"{doc_id}:ann_{seq}",
                                "target": {
                                    "eid": eid,
                                    "version_id": version_id,
                                    "field": field_name,
                                    "span": [s, e],
                                    "span_text": f_text[s:e],
                                },
                                "kind": "provision_type",
                                "value": p_val,
                                "method": "rule",
                                "confidence": 0.95,
                                "verification": "machine_checked",
                            }
                        )
                        prov_recorded = True
                        break
                if prov_recorded:
                    break

        # 2. Cross-reference annotations (only in body fields, never in headings)
        own_native = str(node.get("native_number") or "").lower()
        for field_name, f_text in candidate_fields:
            for m_ref in CROSS_REF_SPAN_RE.finditer(f_text):
                ref_kind = m_ref.group("kind").lower()
                ref_num = re.sub(r"\s+", "", m_ref.group("num")).lower()
                ext_inst = (m_ref.group("ext") or "").strip()
                if ext_inst:
                    val_str = f"external:{ext_inst}:{ref_kind}_{ref_num}"
                    resolved_eid = None
                else:
                    if ref_num == own_native and ref_kind not in {"table", "schedule", "appendix", "annexure", "chapter"}:
                        continue
                    if ref_kind in {"table", "schedule", "appendix", "annexure", "chapter"}:
                        lookup_keys = [f"{ref_kind} {ref_num}", ref_num]
                    elif "." not in ref_num and ref_num.isdigit():
                        lookup_keys = [ref_num, f"{ref_num}.0"]
                    else:
                        lookup_keys = [ref_num]
                    resolved_eid = None
                    for lk in lookup_keys:
                        if lk in eid_by_native:
                            resolved_eid = eid_by_native[lk]
                            break
                    if resolved_eid == eid:
                        continue
                    val_str = (
                        resolved_eid
                        if resolved_eid
                        else f"unresolved:{m_ref.group(0)}"
                    )
                s, e = m_ref.start(), m_ref.end()
                seq += 1
                annotations.append(
                    {
                        "annotation_id": f"{doc_id}:ann_{seq}",
                        "target": {
                            "eid": eid,
                            "version_id": version_id,
                            "field": field_name,
                            "span": [s, e],
                            "span_text": f_text[s:e],
                        },
                        "kind": "cross_reference",
                        "value": val_str,
                        "method": "rule",
                        "confidence": 0.95 if (resolved_eid or ext_inst) else 0.6,
                        "verification": "machine_checked",
                    }
                )

        # 3. Defined-term use annotations (within-document; at most 1 per term per provision, never in headings or definitions)
        if not is_def_or_child and compiled_defined_terms:
            matched_defs_in_node: set[str] = set()
            for field_name, f_text in candidate_fields:
                for _norm_term, def_eid, term_re in compiled_defined_terms:
                    if def_eid in matched_defs_in_node:
                        continue
                    m_term = term_re.search(f_text)
                    if m_term:
                        matched_defs_in_node.add(def_eid)
                        s, e = m_term.start(), m_term.end()
                        seq += 1
                        annotations.append(
                            {
                                "annotation_id": f"{doc_id}:ann_{seq}",
                                "target": {
                                    "eid": eid,
                                    "version_id": version_id,
                                    "field": field_name,
                                    "span": [s, e],
                                    "span_text": f_text[s:e],
                                },
                                "kind": "defined_term_use",
                                "value": def_eid,
                                "method": "rule",
                                "confidence": 0.95,
                                "verification": "machine_checked",
                            }
                        )

        # 4. Topic & Quantity annotations (Schema 1.4 / 09b)
        node_heading_str = str(node.get("heading") or "")
        if compiled_topics and len(active_nodes) <= 2500 and candidate_fields:
            first_field_name, first_field_text = candidate_fields[0]
            matched_topics: set[str] = set()
            if node_type == "definition" or node.get("defines_normalised"):
                matched_topics.add("definitions")
                span_end = min(len(first_field_text), 25)
                seq += 1
                annotations.append(
                    {
                        "annotation_id": f"{doc_id}:ann_{seq}",
                        "target": {
                            "eid": eid,
                            "version_id": version_id,
                            "field": first_field_name,
                            "span": [0, span_end],
                            "span_text": first_field_text[:span_end],
                        },
                        "kind": "topic",
                        "value": "definitions",
                        "method": "rule",
                        "confidence": 0.95,
                        "verification": "machine_checked",
                    }
                )

            for topic_id, topic_patterns in compiled_topics:
                if topic_id in matched_topics:
                    continue
                found_in_body = False
                for field_name, f_text in candidate_fields:
                    for t_pat in topic_patterns:
                        mt = t_pat.search(f_text)
                        if mt:
                            matched_topics.add(topic_id)
                            seq += 1
                            annotations.append(
                                {
                                    "annotation_id": f"{doc_id}:ann_{seq}",
                                    "target": {
                                        "eid": eid,
                                        "version_id": version_id,
                                        "field": field_name,
                                        "span": [mt.start(), mt.end()],
                                        "span_text": f_text[mt.start() : mt.end()],
                                    },
                                    "kind": "topic",
                                    "value": topic_id,
                                    "method": "rule",
                                    "confidence": 0.90,
                                    "verification": "machine_checked",
                                }
                            )
                            found_in_body = True
                            break
                    if found_in_body:
                        break
                if not found_in_body and node_heading_str:
                    for t_pat in topic_patterns:
                        if t_pat.search(node_heading_str):
                            matched_topics.add(topic_id)
                            span_end = min(len(first_field_text), 25)
                            seq += 1
                            annotations.append(
                                {
                                    "annotation_id": f"{doc_id}:ann_{seq}",
                                    "target": {
                                        "eid": eid,
                                        "version_id": version_id,
                                        "field": first_field_name,
                                        "span": [0, span_end],
                                        "span_text": first_field_text[:span_end],
                                    },
                                    "kind": "topic",
                                    "value": topic_id,
                                    "method": "rule",
                                    "confidence": 0.95,
                                    "verification": "machine_checked",
                                }
                            )
                            break

            if matched_topics:
                qty_count = 0
                for field_name, f_text in candidate_fields:
                    for mq in QUANTITY_SPAN_RE.finditer(f_text):
                        if qty_count >= 4:
                            break
                        norm_qty = _normalise_quantity(mq.group("num"), mq.group("unit"))
                        seq += 1
                        qty_count += 1
                        annotations.append(
                            {
                                "annotation_id": f"{doc_id}:ann_{seq}",
                                "target": {
                                    "eid": eid,
                                    "version_id": version_id,
                                    "field": field_name,
                                    "span": [mq.start(), mq.end()],
                                    "span_text": f_text[mq.start() : mq.end()],
                                },
                                "kind": "quantity",
                                "value": norm_qty,
                                "method": "rule",
                                "confidence": 0.92,
                                "verification": "machine_checked",
                            }
                        )

            # 5. Zone applicability annotations (PR 11 §2: never on preamble, title/scope, definition, or commencement)
            node_prov_types = {
                a["value"]
                for a in annotations
                if a.get("kind") == "provision_type" and (a.get("target") or {}).get("eid") == eid
            }
            is_excluded_from_zones = (
                is_def_or_child
                or node_type in {"preamble", "definition"}
                or bool(node.get("defines"))
                or bool(node.get("defines_normalised"))
                or bool(node_prov_types & {"commencement", "scope", "definition"})
                or eid.startswith(("prea_", "part_I__sec_1.0", "part_I__sec_2.0", "sec_DEFINITIONS", "chp_1"))
            )
            if not is_excluded_from_zones:
                matched_zones: set[str] = set()
                for z_code, z_pat in ZONE_APPLICABILITY_RULES:
                    if z_code in matched_zones:
                        continue
                    for field_name, f_text in candidate_fields:
                        mz = z_pat.search(f_text)
                        if mz:
                            matched_zones.add(z_code)
                            seq += 1
                            annotations.append(
                                {
                                    "annotation_id": f"{doc_id}:ann_{seq}",
                                    "target": {
                                        "eid": eid,
                                        "version_id": version_id,
                                        "field": field_name,
                                        "span": [mz.start(), mz.end()],
                                        "span_text": f_text[mz.start() : mz.end()],
                                    },
                                    "kind": "zone_applicability",
                                    "value": z_code,
                                    "method": "rule",
                                    "confidence": 0.94,
                                    "verification": "machine_checked",
                                }
                            )
                            break
                    if z_code not in matched_zones and node_heading_str and z_pat.search(node_heading_str):
                        matched_zones.add(z_code)
                        span_end = min(len(first_field_text), 30)
                        seq += 1
                        annotations.append(
                            {
                                "annotation_id": f"{doc_id}:ann_{seq}",
                                "target": {
                                    "eid": eid,
                                    "version_id": version_id,
                                    "field": first_field_name,
                                    "span": [0, span_end],
                                    "span_text": first_field_text[:span_end],
                                },
                                "kind": "zone_applicability",
                                "value": z_code,
                                "method": "rule",
                                "confidence": 0.92,
                                "verification": "machine_checked",
                            }
                        )
                if not matched_zones:
                    for pref_eid, z_code in EID_ZONE_PREFIX_MAP:
                        if eid == pref_eid or eid.startswith(f"{pref_eid}__"):
                            matched_zones.add(z_code)
                            span_end = min(len(first_field_text), 30)
                            seq += 1
                            annotations.append(
                                {
                                    "annotation_id": f"{doc_id}:ann_{seq}",
                                    "target": {
                                        "eid": eid,
                                        "version_id": version_id,
                                        "field": first_field_name,
                                        "span": [0, span_end],
                                        "span_text": first_field_text[:span_end],
                                    },
                                    "kind": "zone_applicability",
                                    "value": z_code,
                                    "method": "rule",
                                    "confidence": 0.90,
                                    "verification": "machine_checked",
                                }
                            )
                            break

    payload: dict[str, Any] = {
        "schema_version": "1.4",
        "doc_id": doc_id,
        "jurisdiction": jurisdiction,
        "annotations": annotations,
    }
    validate_annotations_against_tree(payload, tree_payload)
    return payload
