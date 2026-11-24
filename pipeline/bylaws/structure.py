"""Stage 8.4: Convert parser output into a validated Schema v1.3 three-layer document tree and annotations."""

from __future__ import annotations

import json
import re
from collections import Counter
from pathlib import Path
from typing import Any

import click

from bylaws import __version__ as PIPELINE_VERSION
from bylaws.annotations import build_document_annotations
from bylaws.config import DocumentConfig, JurisdictionConfig
from bylaws.parsers.base import ParsedBlock, ParseResult
from bylaws.root import get_deterministic_timestamp, resolve_repo_root
from bylaws.schema_validator import validate_payload

TYPE_TO_PREFIX: dict[str, str] = {
    "preface": "pref",
    "preamble": "prea",
    "part": "part",
    "chapter": "chp",
    "section": "sec",
    "regulation": "reg",
    "bye_law": "bl",
    "clause": "cl",
    "subclause": "subcl",
    "item": "item",
    "paragraph": "para",
    "proviso": "prov",
    "explanation": "expl",
    "note": "note",
    "definition": "def",
    "schedule": "sch",
    "annexure": "ann",
    "appendix": "app",
    "form": "form",
    "table": "tbl",
    "table_row": "row",
    "signature_block": "sig",
}

CHAPTER_LINE_RE = re.compile(
    r"^(?P<kind>PART|CHAPTER|SCHEDULE|ANNEXURE|APPENDIX|FORM)\s+(?P<num>[IVXLCDM]+|\d+[A-Z]?)\b"
    r"(?:\s*[:.\-\u2013\u2014]?\s*(?P<title>.*))?$",
    re.IGNORECASE,
)

SECTION_PREFIX_RE = re.compile(
    r"^(?P<prefix>Section|Clause|Regulation|Bye-law|Byelaw|Rule)\s+"
    r"(?P<number>[A-Z]?\d+(?:[.-]\d+)*[A-Z]?)"
    r"(?:\s*[:.\-\u2013\u2014]\s*(?P<rest>[A-Z'\"(\u0c80-\u0cff].*))?$",
    re.IGNORECASE,
)

DECIMAL_CLAUSE_RE = re.compile(
    r"^(?P<number>(?:[A-Z]?\d+(?:\.\d+)+[A-Z]?))\b\.?\s+(?P<rest>[A-Z'\"(\u0c80-\u0cff].+)$"
)

INT_CLAUSE_RE = re.compile(
    r"^(?P<number>\d{1,3}(?:-[A-Z]|[A-Z])?)\.\s+(?P<rest>[A-Z'\"(\u0c80-\u0cff].+)$"
)

SUB_ITEM_RE = re.compile(
    r"^\((?P<subnum>[a-z]{1,2}|[ivxlcdm]+|\d+)\)\s+(?P<rest>.+)$"
)

PROVISO_LINE_RE = re.compile(
    r"^(?P<body_full>Provided\s+(?:further\s+|also\s+)?that\b.+)$",
    re.IGNORECASE,
)

EXPLANATION_LINE_RE = re.compile(
    r"^Explanation(?:\s+(?P<num>\d+|[IVXLCDM]+))?\s*[:.\-\u2013\u2014]+\s*(?P<rest>.+)$",
    re.IGNORECASE,
)

NOTE_LINE_RE = re.compile(
    r"^Note(?:\s+(?P<num>\d+))?\s*[:.\-\u2013\u2014]+\s*(?P<rest>.+)$",
    re.IGNORECASE,
)

FOOTNOTE_LINE_RE = re.compile(
    r"^(?P<marker>\*{1,3}|\u2020|\u2021)\s*(?P<text>.+)$"
)

DEFINED_TERM_RE = re.compile(
    r"[\"\u201c\u2018'](?P<term>[A-Za-z][A-Za-z0-9\s/-]{1,60})[\"\u201d\u2019']\s*(?:\([^)]+\)\s*)?means\b"
    r"|^(?P<bare_term>[A-Z][A-Za-z\s]{2,40})\s*(?:\([A-Z]{2,8}\)\s*)?means\b"
)

MEASUREMENT_UNIT_RE = re.compile(
    r"^(?:m|mm|cm|km|sq\.?\s*m|sq\.?\s*ft|sft|sqm|ft|feet|metre|metres|meter|meters|"
    r"ha|hectare|hectares|acre|acres|percent|%|times|floors?|storeys?)\b",
    re.IGNORECASE,
)

PAGE_NUM_LINE_RE = re.compile(
    r"^(?:Page\s+\d+(?:\s+of\s+\d+)?|-\s*\d+\s*-|\d{1,3})$",
    re.IGNORECASE,
)

ROMAN_SUBNUMS: frozenset[str] = frozenset(
    {"i", "ii", "iii", "iv", "v", "vi", "vii", "viii", "ix", "x", "xi", "xii"}
)

CROSS_REF_RE = re.compile(
    r"\b(?:clause|bye-?law|regulation|section|rule)\s+([A-Za-z]?\d+(?:\.\d+)*[A-Za-z]?)\b",
    re.IGNORECASE,
)

KANNADA_CHAR_RE = re.compile(r"[\u0c80-\u0cff]")


def sanitise_native_token(token: str) -> str:
    """Sanitise a native token for Akoma Ntoso `eid` construction (spaces & brackets removed, case kept)."""
    cleaned = token.strip().strip("()[]{}")
    for prefix_word in ("PART", "CHAPTER", "SCHEDULE", "ANNEXURE", "APPENDIX", "FORM", "Table", "table"):
        if cleaned.upper().startswith(prefix_word.upper() + " "):
            cleaned = cleaned[len(prefix_word) :].strip()
    cleaned = re.sub(r"[\s()\[\]{}:;,'\"]+", "", cleaned)
    return cleaned or "1"


def build_eid(parent_eid: str | None, node_type: str, native_token: str) -> str:
    """Build an ancestor-scoped Akoma Ntoso `eid` (`<parent_eid>__<prefix>_<token>`)."""
    prefix = TYPE_TO_PREFIX.get(node_type, "cl")
    segment = f"{prefix}_{sanitise_native_token(native_token)}"
    if parent_eid:
        return f"{parent_eid}__{segment}"
    return segment


def assert_unique_sibling_eids(nodes: list[dict[str, Any]]) -> None:
    """Fail validation if any two active nodes in a document tree have colliding `eid`s."""
    seen: set[str] = set()
    for node in nodes:
        if node.get("superseded_by") is not None or node.get("record_superseded_by") is not None:
            continue
        eid = str(node.get("eid") or "")
        if not eid:
            raise ValueError(f"Node '{node.get('clause_id')}' is missing required 'eid'.")
        if eid in seen:
            raise ValueError(f"Duplicate eid '{eid}' detected in document tree.")
        seen.add(eid)


def _detect_language(text: str) -> str:
    return "kn" if KANNADA_CHAR_RE.search(text) else "en"


def _extract_defined_term(text: str, heading: str | None = None) -> tuple[str, str] | None:
    """Return `(defines_printed, defines_normalised)` if `text` defines a term."""
    m = DEFINED_TERM_RE.search(text)
    if m:
        if m.group("term"):
            raw_term = m.group("term").strip()
            return f'"{raw_term}"', raw_term.lower()
        if m.group("bare_term"):
            raw_term = m.group("bare_term").strip()
            if heading and raw_term.lower().startswith(heading.lower()):
                raw_term = raw_term[len(heading) :].strip(": ") or raw_term
            return f'"{raw_term}"', raw_term.lower()
    return None


def _collect_running_headers_and_footers(blocks: list[ParsedBlock], page_count: int) -> set[str]:
    if page_count < 2:
        return set()
    margin_pages: dict[str, set[int]] = {}
    for blk in blocks:
        line = blk.text.strip()
        if not line or blk.bbox is None:
            continue
        if blk.bbox[1] <= 0.08 or blk.bbox[3] >= 0.92:
            margin_pages.setdefault(line, set()).add(blk.page)
    return {line for line, pages in margin_pages.items() if len(pages) >= 2}


def _is_margin_page_number(block: ParsedBlock) -> bool:
    line = block.text.strip()
    if not PAGE_NUM_LINE_RE.match(line):
        return False
    if line.isdigit():
        return block.bbox is not None and (block.bbox[1] <= 0.08 or block.bbox[3] >= 0.92)
    return True


def _is_top_title_banner(block: ParsedBlock) -> bool:
    if block.page != 1 or block.bbox is None:
        return False
    if block.bbox[1] > 0.12:
        return False
    line = block.text.strip()
    words = line.split()
    return 1 <= len(words) <= 12 and not line.endswith((".", ":"))


def _split_title_and_body(rest: str) -> tuple[str | None, str]:
    cleaned = rest.strip()
    if ":" in cleaned:
        head, tail = cleaned.split(":", 1)
        head_clean = head.strip()
        tail_clean = tail.strip()
        if head_clean and len(head_clean.split()) <= 10:
            return head_clean, tail_clean
    return cleaned, cleaned


def _match_structural_line(line: str) -> tuple[str, str, str] | None:
    chap_match = CHAPTER_LINE_RE.match(line)
    if chap_match:
        kind_word = chap_match.group("kind").lower()
        num_word = chap_match.group("num").upper()
        title_part = (chap_match.group("title") or "").strip()
        number = f"{kind_word.upper()} {num_word}"
        return kind_word, number, title_part or number

    prov_match = PROVISO_LINE_RE.match(line)
    if prov_match:
        return "proviso", "", prov_match.group("body_full").strip()

    expl_match = EXPLANATION_LINE_RE.match(line)
    if expl_match:
        num = (expl_match.group("num") or "").strip()
        return "explanation", num, expl_match.group("rest").strip()

    note_match = NOTE_LINE_RE.match(line)
    if note_match:
        num = (note_match.group("num") or "").strip()
        return "note", num, note_match.group("rest").strip()

    sec_match = SECTION_PREFIX_RE.match(line)
    if sec_match:
        number = sec_match.group("number").strip()
        rest = (sec_match.group("rest") or "").strip() or number
        return "clause", number, rest

    dec_match = DECIMAL_CLAUSE_RE.match(line)
    if dec_match:
        number = dec_match.group("number")
        rest = dec_match.group("rest").strip()
        if not number.startswith("0.") and not MEASUREMENT_UNIT_RE.match(rest):
            return "clause", number, rest

    int_match = INT_CLAUSE_RE.match(line)
    if int_match:
        number = int_match.group("number")
        rest = int_match.group("rest").strip()
        if not MEASUREMENT_UNIT_RE.match(rest):
            return "clause", number, rest

    sub_match = SUB_ITEM_RE.match(line)
    if sub_match:
        subnum = sub_match.group("subnum")
        rest = sub_match.group("rest").strip()
        return "subitem", subnum, rest

    return None


def _union_bbox(bboxes: list[list[float]]) -> list[float] | None:
    if not bboxes:
        return None
    x0 = round(min(b[0] for b in bboxes), 4)
    y0 = round(min(b[1] for b in bboxes), 4)
    x1 = round(max(b[2] for b in bboxes), 4)
    y1 = round(max(b[3] for b in bboxes), 4)
    return [x0, y0, x1, y1]


def _make_excerpt(text: str, max_words: int = 12) -> str:
    words = text.split()
    return " ".join(words[:max_words]) or "excerpt"


def _extract_cross_references(text: str, doc_id: str, own_number: str) -> list[str]:
    refs: list[str] = []
    for match in CROSS_REF_RE.finditer(text):
        ref_num = match.group(1)
        if ref_num == own_number:
            continue
        target = f"{doc_id}:{ref_num}"
        if target not in refs:
            refs.append(target)
    return refs


def _build_columns_hierarchy(
    headers: list[str],
    rows: list[list[str]],
) -> tuple[list[dict[str, Any]], list[list[str]]]:
    """Build hierarchical `TableColumnHeader` tree (supporting 2-row header grids and units)."""
    unit_re = re.compile(r"^(?P<label>.+?)\s*\((?P<unit>[^)]+)\)\s*$")

    # Check if the first row in `rows` is a second-level subheader row (non-numeric labels)
    has_second_header_row = False
    if rows and len(rows[0]) == len(headers):
        first_row = rows[0]
        if all(
            cell and not any(ch.isdigit() for ch in cell)
            for cell in first_row
        ):
            has_second_header_row = True

    data_rows = rows[1:] if has_second_header_row else rows
    columns: list[dict[str, Any]] = []

    for col_idx, raw_hdr in enumerate(headers):
        m_unit = unit_re.match(raw_hdr.strip())
        col_entry: dict[str, Any] = {
            "label": m_unit.group("label").strip() if m_unit else raw_hdr.strip(),
            "unit": m_unit.group("unit").strip() if m_unit else None,
        }
        if has_second_header_row:
            sub_raw = rows[0][col_idx].strip()
            m_sub = unit_re.match(sub_raw)
            col_entry["children"] = [
                {
                    "label": m_sub.group("label").strip() if m_sub else sub_raw,
                    "unit": m_sub.group("unit").strip() if m_sub else col_entry["unit"],
                }
            ]
        elif col_entry["unit"] is not None:
            # Also expose a 2-level header child when a parent column carries a unit specification
            col_entry["children"] = [
                {
                    "label": col_entry["label"],
                    "unit": col_entry["unit"],
                }
            ]
        columns.append(col_entry)

    return columns, data_rows


def build_clause_tree_from_parse_result(
    doc: DocumentConfig,
    config: JurisdictionConfig,
    parse_result: ParseResult,
) -> dict[str, Any]:
    """Deterministically structure `ParseResult` into a Schema v1.3 three-layer `ClauseTree`."""
    running_margins = _collect_running_headers_and_footers(
        parse_result.blocks, parse_result.page_count
    )

    raw_nodes: list[dict[str, Any]] = []
    nodes_by_eid: dict[str, dict[str, Any]] = {}

    current: dict[str, Any] | None = None
    current_container_eid: str | None = None
    current_clause_node: dict[str, Any] | None = None
    last_alpha_node: dict[str, Any] | None = None
    last_alpha_letter: str | None = None
    sub_counters: Counter[tuple[str | None, str]] = Counter()
    pending_footnotes: dict[int, list[dict[str, Any]]] = {}

    for block in parse_result.blocks:
        line = block.text.strip()
        if not line:
            continue
        if line in running_margins or _is_margin_page_number(block):
            continue

        fn_match = FOOTNOTE_LINE_RE.match(line)
        if fn_match:
            pending_footnotes.setdefault(block.page, []).append(
                {
                    "marker": fn_match.group("marker").strip(),
                    "text": fn_match.group("text").strip(),
                    "cell_refs": [],
                }
            )
            continue

        parsed_line = _match_structural_line(line)
        if parsed_line is None and current is None and _is_top_title_banner(block):
            continue

        if parsed_line is not None:
            kind, number, rest = parsed_line

            if kind in {"part", "chapter", "schedule", "annexure", "appendix", "form"}:
                eid = build_eid(None, kind, number)
                node_dict: dict[str, Any] = {
                    "eid": eid,
                    "native_number": number,
                    "number": number,
                    "type": kind,
                    "heading": rest,
                    "title": rest,
                    "level": 1,
                    "parent_eid": None,
                    "children": [],
                    "intro_parts": [],
                    "content_parts": [rest],
                    "wrap_up_parts": [],
                    "has_subitems": False,
                    "blocks": [block],
                }
                raw_nodes.append(node_dict)
                nodes_by_eid[eid] = node_dict
                current = node_dict
                current_container_eid = eid
                current_clause_node = None
                last_alpha_node = None
                last_alpha_letter = None
                continue

            if kind == "clause":
                if (
                    current is not None
                    and current["native_number"] == number
                    and current["content_parts"] == [current["heading"]]
                ):
                    title, body = _split_title_and_body(rest)
                    if title:
                        current["heading"] = title
                        current["title"] = title
                    current["content_parts"] = [body]
                    current["blocks"].append(block)
                    continue

                title, body = _split_title_and_body(rest)
                parts = number.split(".")
                parent_eid: str | None = current_container_eid
                level = 2 if current_container_eid else 1
                if len(parts) > 2:
                    parent_num = ".".join(parts[:-1])
                    for cand in reversed(raw_nodes):
                        if cand.get("native_number") == parent_num:
                            parent_eid = cand["eid"]
                            level = int(cand["level"]) + 1
                            break

                def_info = _extract_defined_term(body, title)
                node_type = "definition" if def_info is not None else "clause"
                eid = build_eid(parent_eid, node_type, number)

                node_dict = {
                    "eid": eid,
                    "native_number": number,
                    "number": number,
                    "type": node_type,
                    "heading": title,
                    "title": title,
                    "level": level,
                    "parent_eid": parent_eid,
                    "children": [],
                    "intro_parts": [],
                    "content_parts": [body],
                    "wrap_up_parts": [],
                    "has_subitems": False,
                    "defines": def_info[0] if def_info else None,
                    "defines_normalised": def_info[1] if def_info else None,
                    "blocks": [block],
                }
                if parent_eid and parent_eid in nodes_by_eid:
                    nodes_by_eid[parent_eid]["children"].append(eid)
                raw_nodes.append(node_dict)
                nodes_by_eid[eid] = node_dict
                current = node_dict
                current_clause_node = node_dict
                last_alpha_node = None
                last_alpha_letter = None
                continue

            if kind == "subitem":
                subnum = number
                is_roman_under_alpha = (
                    subnum in ROMAN_SUBNUMS
                    and last_alpha_node is not None
                    and not (subnum == "i" and last_alpha_letter == "h")
                    and not (subnum == "v" and last_alpha_letter == "u")
                    and not (subnum == "x" and last_alpha_letter == "w")
                )
                if is_roman_under_alpha and last_alpha_node is not None:
                    parent_node = last_alpha_node
                elif current_clause_node is not None:
                    parent_node = current_clause_node
                elif current is not None:
                    parent_node = current
                else:
                    parent_node = None

                if parent_node is not None:
                    if not parent_node["has_subitems"] and parent_node["content_parts"]:
                        parent_node["intro_parts"].extend(parent_node["content_parts"])
                        parent_node["content_parts"] = []
                    parent_node["has_subitems"] = True
                    parent_eid = str(parent_node["eid"])
                    parent_num_str = str(parent_node["number"])
                    scoped_number = f"{parent_num_str}({subnum})"
                    level = int(parent_node["level"]) + 1
                else:
                    parent_eid = current_container_eid
                    scoped_number = f"({subnum})"
                    level = 2

                title, body = _split_title_and_body(rest)
                def_info = _extract_defined_term(body, title)
                item_type = "definition" if def_info is not None else "item"
                eid = build_eid(parent_eid, item_type, subnum)

                node_dict = {
                    "eid": eid,
                    "native_number": f"({subnum})",
                    "number": scoped_number,
                    "type": item_type,
                    "heading": title if title != body else None,
                    "title": title,
                    "level": level,
                    "parent_eid": parent_eid,
                    "children": [],
                    "intro_parts": [],
                    "content_parts": [body],
                    "wrap_up_parts": [],
                    "has_subitems": False,
                    "defines": def_info[0] if def_info else None,
                    "defines_normalised": def_info[1] if def_info else None,
                    "blocks": [block],
                }
                if parent_eid and parent_eid in nodes_by_eid:
                    nodes_by_eid[parent_eid]["children"].append(eid)
                raw_nodes.append(node_dict)
                nodes_by_eid[eid] = node_dict
                current = node_dict
                if not is_roman_under_alpha:
                    last_alpha_node = node_dict
                    last_alpha_letter = subnum
                continue

            if kind in {"proviso", "explanation", "note"}:
                parent_node = current_clause_node or current
                parent_eid = str(parent_node["eid"]) if parent_node else current_container_eid
                sub_counters[(parent_eid, kind)] += 1
                seq_num = number or str(sub_counters[(parent_eid, kind)])
                eid = build_eid(parent_eid, kind, seq_num)
                parent_num_str = str(parent_node["number"]) if parent_node else ""
                compat_number = f"{parent_num_str}:{kind}_{seq_num}" if parent_num_str else f"{kind}_{seq_num}"

                node_dict = {
                    "eid": eid,
                    "native_number": number if number else None,
                    "number": compat_number,
                    "type": kind,
                    "heading": kind.capitalize(),
                    "title": kind.capitalize(),
                    "level": (int(parent_node["level"]) + 1) if parent_node else 2,
                    "parent_eid": parent_eid,
                    "children": [],
                    "intro_parts": [],
                    "content_parts": [rest],
                    "wrap_up_parts": [],
                    "has_subitems": False,
                    "blocks": [block],
                }
                if parent_eid and parent_eid in nodes_by_eid:
                    nodes_by_eid[parent_eid]["children"].append(eid)
                raw_nodes.append(node_dict)
                nodes_by_eid[eid] = node_dict
                current = node_dict
                continue

        # Non-heading continuation line
        if current is not None:
            # If we are currently inside a subitem and a closing sentence for the parent clause appears
            # (e.g. starting with "All ", "Where ", "In case of ", "Corner plots "), attach as wrap_up on parent!
            if (
                current["type"] == "item"
                and current_clause_node is not None
                and current_clause_node.get("has_subitems")
                and line.endswith(".")
                and re.match(r"^(?:All|Where|In\s+case|Corner\s+plots|Subject\s+to)\b", line)
            ):
                current_clause_node["wrap_up_parts"].append(line)
                current_clause_node["blocks"].append(block)
            else:
                current["content_parts"].append(line)
                current["blocks"].append(block)
        else:
            eid = build_eid(None, "preamble", "1")
            node_dict = {
                "eid": eid,
                "native_number": None,
                "number": "preamble",
                "type": "preamble",
                "heading": "Preamble",
                "title": "Preamble",
                "level": 1,
                "parent_eid": None,
                "children": [],
                "intro_parts": [],
                "content_parts": [line],
                "wrap_up_parts": [],
                "has_subitems": False,
                "blocks": [block],
            }
            raw_nodes.append(node_dict)
            nodes_by_eid[eid] = node_dict
            current = node_dict

    commencement_date = doc.effective_from or doc.notified_date
    is_amendment_doc = doc.role == "amendment" or doc.doc_type in {"amendment", "notification"}
    clauses_out: list[dict[str, Any]] = []
    out_by_eid: dict[str, dict[str, Any]] = {}

    for item in raw_nodes:
        eid = str(item["eid"])
        parent_eid = item.get("parent_eid")
        parent_id = f"{doc.id}:{item['number'].rsplit('(', 1)[0]}" if item["type"] == "item" and "(" in item["number"] else None
        if parent_id is None and parent_eid and parent_eid in nodes_by_eid:
            parent_id = f"{doc.id}:{nodes_by_eid[parent_eid]['number']}"

        intro_str = " ".join(p.strip() for p in item.get("intro_parts", []) if p.strip()).strip() or None
        content_str = " ".join(p.strip() for p in item.get("content_parts", []) if p.strip()).strip() or None
        wrap_up_str = " ".join(p.strip() for p in item.get("wrap_up_parts", []) if p.strip()).strip() or None

        combined_text_parts = [p for p in (intro_str, content_str, wrap_up_str) if p]
        full_text = " ".join(combined_text_parts).strip() or str(item.get("heading") or eid)

        blocks_by_page: dict[int, list[ParsedBlock]] = {}
        for blk in item["blocks"]:
            blocks_by_page.setdefault(blk.page, []).append(blk)

        citations: list[dict[str, Any]] = []
        for page_num, page_blocks in sorted(blocks_by_page.items()):
            bboxes = [b.bbox for b in page_blocks if b.bbox is not None]
            joined_page_text = " ".join(b.text for b in page_blocks)
            citations.append(
                {
                    "doc_id": doc.id,
                    "page": page_num,
                    "bbox": _union_bbox(bboxes),
                    "text_excerpt": _make_excerpt(joined_page_text),
                }
            )

        number_str = str(item["number"])
        clause_id = f"{doc.id}:{number_str}"
        cross_refs = (
            _extract_cross_references(full_text, doc.id, number_str)
            if not is_amendment_doc
            else []
        )

        version_1: dict[str, Any] = {
            "version_id": "v1",
            "valid_from": commencement_date,
            "valid_to": None,
            "heading": item.get("heading"),
            "intro": intro_str,
            "content": content_str,
            "wrap_up": wrap_up_str,
            "cells": None,
            "source_doc": doc.id,
            "source_eid": eid,
            "effect_id": None,
            "citations": citations,
            "legal_status": doc.legal_status,
            "omitted": False,
        }

        node_out: dict[str, Any] = {
            "eid": eid,
            "native_number": item.get("native_number"),
            "type": item["type"],
            "heading": item.get("heading"),
            "intro": intro_str,
            "content": content_str,
            "wrap_up": wrap_up_str,
            "children": list(item.get("children", [])),
            "parent_eid": parent_eid,
            "defines": item.get("defines"),
            "defines_normalised": item.get("defines_normalised"),
            "table_meta": None,
            "cells": None,
            "versions": [version_1],
            "clause_id": clause_id,
            "record_version": 1,
            "record_id": f"{clause_id}@v1",
            "record_supersedes": None,
            "record_superseded_by": None,
            "record_change_reason": None,
            "supersedes": None,
            "superseded_by": None,
            "legal_status": doc.legal_status,
            "effective_from": doc.effective_from,
            "number": number_str,
            "title": item.get("title"),
            "level": int(item["level"]),
            "parent_id": parent_id,
            "order": len(clauses_out),
            "text": full_text,
            "language": _detect_language(full_text),
            "tables": [],
            "citations": citations,
            "cross_references": cross_refs,
            "amended_by": [],
            "applies_to_zones": [],
            "verification": "machine_checked",
            "verified_by": None,
        }
        clauses_out.append(node_out)
        out_by_eid[eid] = node_out

    # Attach parsed tables both as `tables[]` compatibility entries and as Layer 1 `table` + `table_row` nodes
    table_counts: Counter[str] = Counter()
    for tbl in parse_result.tables:
        target_clause: dict[str, Any] | None = None
        if tbl.caption:
            cap_prefix = tbl.caption.split(":", 1)[0].strip().lower()
            for clause in clauses_out:
                if cap_prefix and cap_prefix in clause["text"].lower():
                    target_clause = clause
                    break
        if target_clause is None:
            same_page = [
                c
                for c in clauses_out
                if any(cit["page"] == tbl.page for cit in c["citations"])
                and c["type"] in {"clause", "bye_law", "regulation", "section"}
            ]
            target_clause = same_page[-1] if same_page else (clauses_out[-1] if clauses_out else None)

        if target_clause is None:
            continue

        cid = str(target_clause["clause_id"])
        parent_eid = str(target_clause["eid"])
        table_counts[cid] += 1
        t_idx = table_counts[cid]
        columns_tree, data_rows = _build_columns_hierarchy(
            list(tbl.headers), [list(r) for r in tbl.rows]
        )
        target_clause["tables"].append(
            {
                "table_id": f"{cid}:t{t_idx}",
                "caption": tbl.caption,
                "headers": list(tbl.headers),
                "rows": data_rows,
                "page": tbl.page,
            }
        )

        # Build Layer 1 `table` node and `table_row` child nodes
        tbl_token = sanitise_native_token(tbl.caption.split(":", 1)[0]) if tbl.caption else str(t_idx)
        tbl_eid = build_eid(parent_eid, "table", tbl_token)
        if tbl_eid in out_by_eid:
            tbl_eid = f"{tbl_eid}_{t_idx}"

        page_footnotes = list(pending_footnotes.get(tbl.page, []))
        row_eids: list[str] = []
        row_nodes_to_add: list[dict[str, Any]] = []

        tbl_citation = [
            {
                "doc_id": doc.id,
                "page": tbl.page,
                "bbox": target_clause["citations"][0]["bbox"] if target_clause["citations"] else None,
                "text_excerpt": _make_excerpt(tbl.caption or " ".join(tbl.headers)),
            }
        ]

        for r_idx, row_cells in enumerate(data_rows, start=1):
            r_eid = build_eid(tbl_eid, "table_row", str(r_idx))
            row_eids.append(r_eid)
            row_text = " | ".join(row_cells)
            for fn in page_footnotes:
                if fn["marker"] in row_text and r_eid not in fn["cell_refs"]:
                    fn["cell_refs"].append(r_eid)

            row_ver: dict[str, Any] = {
                "version_id": "v1",
                "valid_from": commencement_date,
                "valid_to": None,
                "heading": None,
                "intro": None,
                "content": row_text,
                "wrap_up": None,
                "cells": row_cells,
                "source_doc": doc.id,
                "source_eid": r_eid,
                "effect_id": None,
                "citations": tbl_citation,
                "legal_status": doc.legal_status,
                "omitted": False,
            }
            row_cid = f"{doc.id}:{r_eid}"
            row_nodes_to_add.append(
                {
                    "eid": r_eid,
                    "native_number": str(r_idx),
                    "type": "table_row",
                    "heading": None,
                    "intro": None,
                    "content": row_text,
                    "wrap_up": None,
                    "children": [],
                    "parent_eid": tbl_eid,
                    "defines": None,
                    "defines_normalised": None,
                    "table_meta": None,
                    "cells": row_cells,
                    "versions": [row_ver],
                    "clause_id": row_cid,
                    "record_version": 1,
                    "record_id": f"{row_cid}@v1",
                    "record_supersedes": None,
                    "record_superseded_by": None,
                    "record_change_reason": None,
                    "supersedes": None,
                    "superseded_by": None,
                    "legal_status": doc.legal_status,
                    "effective_from": doc.effective_from,
                    "number": r_eid,
                    "title": f"Row {r_idx}",
                    "level": int(target_clause["level"]) + 2,
                    "parent_id": f"{doc.id}:{tbl_eid}",
                    "order": 0,
                    "text": row_text,
                    "language": _detect_language(row_text),
                    "tables": [],
                    "citations": tbl_citation,
                    "cross_references": [],
                    "amended_by": [],
                    "applies_to_zones": [],
                    "verification": "machine_checked",
                    "verified_by": None,
                }
            )

        tbl_heading = tbl.caption or f"Table {t_idx}"
        tbl_ver: dict[str, Any] = {
            "version_id": "v1",
            "valid_from": commencement_date,
            "valid_to": None,
            "heading": tbl_heading,
            "intro": None,
            "content": tbl_heading,
            "wrap_up": None,
            "cells": None,
            "source_doc": doc.id,
            "source_eid": tbl_eid,
            "effect_id": None,
            "citations": tbl_citation,
            "legal_status": doc.legal_status,
            "omitted": False,
        }
        tbl_cid = f"{doc.id}:{tbl_eid}"
        tbl_node: dict[str, Any] = {
            "eid": tbl_eid,
            "native_number": f"Table {tbl_token}",
            "type": "table",
            "heading": tbl_heading,
            "intro": None,
            "content": tbl_heading,
            "wrap_up": None,
            "children": row_eids,
            "parent_eid": parent_eid,
            "defines": None,
            "defines_normalised": None,
            "table_meta": {
                "columns": columns_tree,
                "rows": row_eids,
                "footnotes": page_footnotes,
                "extraction": "complete",
                "page_image": None,
                "gap_reason": None,
            },
            "cells": None,
            "versions": [tbl_ver],
            "clause_id": tbl_cid,
            "record_version": 1,
            "record_id": f"{tbl_cid}@v1",
            "record_supersedes": None,
            "record_superseded_by": None,
            "record_change_reason": None,
            "supersedes": None,
            "superseded_by": None,
            "legal_status": doc.legal_status,
            "effective_from": doc.effective_from,
            "number": tbl_eid,
            "title": tbl_heading,
            "level": int(target_clause["level"]) + 1,
            "parent_id": cid,
            "order": 0,
            "text": tbl_heading,
            "language": "en",
            "tables": [],
            "citations": tbl_citation,
            "cross_references": [],
            "amended_by": [],
            "applies_to_zones": [],
            "verification": "machine_checked",
            "verified_by": None,
        }
        target_clause["children"].append(tbl_eid)
        clauses_out.append(tbl_node)
        out_by_eid[tbl_eid] = tbl_node
        for rn in row_nodes_to_add:
            clauses_out.append(rn)
            out_by_eid[rn["eid"]] = rn

    for idx, c_node in enumerate(clauses_out):
        c_node["order"] = idx

    assert_unique_sibling_eids(clauses_out)

    return {
        "schema_version": "1.3",
        "doc_id": doc.id,
        "jurisdiction": config.id,
        "legal_status": doc.legal_status,
        "generated": {
            "parser": parse_result.parser_name,
            "parser_version": parse_result.parser_version,
            "pipeline_version": PIPELINE_VERSION,
            "generated_at": get_deterministic_timestamp(),
        },
        "clauses": clauses_out,
    }


def _find_interim_parse_file(interim_dir: Path, doc_id: str) -> Path:
    candidates = sorted(interim_dir.glob(f"{doc_id}.*.json"))
    if not candidates:
        raise click.ClickException(
            f"Interim parse output not found for '{doc_id}' in '{interim_dir}'. "
            "Run `bylaws parse` first."
        )
    return candidates[0]


def is_structurable_document(doc: DocumentConfig) -> bool:
    """Return True if a document should be structured into a `.clauses.json` tree."""
    if doc.text_rights is not None and doc.text_rights.mode == "reference_only":
        return False
    return not (
        doc.role in {"boundary", "reference"}
        or doc.doc_type in {"map", "standard_reference"}
    )


def run_structure(config: JurisdictionConfig, *, repo_root: Path | None = None) -> None:
    """Build JSON clause trees and stand-off annotations for all parsed regulatory documents."""
    root = repo_root or resolve_repo_root()
    interim_dir = root / "data" / "interim" / config.id
    docs_out_dir = root / "data" / "processed" / config.id / "documents"
    docs_out_dir.mkdir(parents=True, exist_ok=True)

    structured_count = 0
    for doc in config.documents:
        if not is_structurable_document(doc):
            continue
        interim_path = _find_interim_parse_file(interim_dir, doc.id)
        parse_result = ParseResult.model_validate_json(
            interim_path.read_text(encoding="utf-8")
        )
        clause_tree = build_clause_tree_from_parse_result(doc, config, parse_result)
        out_path = docs_out_dir / f"{doc.id}.clauses.json"
        validate_payload(clause_tree, "clause-tree", source=str(out_path))
        out_path.write_text(
            json.dumps(clause_tree, indent=2) + "\n",
            encoding="utf-8",
        )

        annotations_payload = build_document_annotations(clause_tree)
        ann_path = docs_out_dir / f"{doc.id}.annotations.json"
        validate_payload(annotations_payload, "annotations", source=str(ann_path))
        ann_path.write_text(
            json.dumps(annotations_payload, indent=2) + "\n",
            encoding="utf-8",
        )
        structured_count += 1

    click.echo(
        f"[structure] Built {structured_count} clause tree(s) and annotation file(s) for '{config.id}'."
    )
