"""Layer 2 stand-off character-span annotations (`<doc_id>.annotations.json`, Schema v1.3)."""

from __future__ import annotations

import re
from typing import Any

from bylaws.schema_validator import validate_payload

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

    payload: dict[str, Any] = {
        "schema_version": "1.3",
        "doc_id": doc_id,
        "jurisdiction": jurisdiction,
        "annotations": annotations,
    }
    validate_annotations_against_tree(payload, tree_payload)
    return payload
