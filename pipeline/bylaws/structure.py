"""Stage 8.4: Convert parser output into a validated Schema v1.2 clause tree."""

from __future__ import annotations

import json
import re
from collections import Counter
from pathlib import Path
from typing import Any

import click

from bylaws import __version__ as PIPELINE_VERSION
from bylaws.config import DocumentConfig, JurisdictionConfig
from bylaws.parsers.base import ParsedBlock, ParsedTable, ParseResult
from bylaws.root import get_deterministic_timestamp, resolve_repo_root
from bylaws.schema_validator import validate_payload

CHAPTER_LINE_RE = re.compile(
    r"^(?P<kind>PART|CHAPTER|SCHEDULE|ANNEXURE|APPENDIX)\s+(?P<num>[IVXLCDM]+|\d+[A-Z]?)\b"
    r"(?:\s*[:.\-\u2013\u2014]?\s*(?P<title>.*))?$",
    re.IGNORECASE,
)

SECTION_PREFIX_RE = re.compile(
    r"^(?:Section|Clause|Regulation|Bye-law|Byelaw|Rule)\s+"
    r"(?P<number>[A-Z]?\d+(?:[.-]\d+)*[A-Z]?)"
    r"(?:\s*[:.\-\u2013\u2014]\s*(?P<rest>[A-Z'\"(\u0c80-\u0cff].*))?$"
)

DECIMAL_CLAUSE_RE = re.compile(
    r"^(?P<number>(?:[A-Z]?\d+(?:\.\d+)+))\b\.?\s+(?P<rest>[A-Z'\"(\u0c80-\u0cff].+)$"
)

INT_CLAUSE_RE = re.compile(
    r"^(?P<number>\d{1,3}(?:-[A-Z])?)\.\s+(?P<rest>[A-Z'\"(\u0c80-\u0cff].+)$"
)

SUB_ITEM_RE = re.compile(
    r"^\((?P<subnum>[a-z]|[ivxlcdm]+)\)\s+(?P<rest>.+)$"
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
    r"\b(?:clause|bye-?law|regulation|section|rule)\s+([A-Za-z]?\d+(?:\.\d+)*)\b",
    re.IGNORECASE,
)

KANNADA_CHAR_RE = re.compile(r"[\u0c80-\u0cff]")


def _detect_language(text: str) -> str:
    return "kn" if KANNADA_CHAR_RE.search(text) else "en"


def _collect_running_headers_and_footers(blocks: list[ParsedBlock], page_count: int) -> set[str]:
    """Identify lines that repeat in the top/bottom 8% margin across >= 2 pages."""
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
    """Detect single-line document title banners at the top of page 1 before the first clause."""
    if block.page != 1 or block.bbox is None:
        return False
    if block.bbox[1] > 0.12:
        return False
    line = block.text.strip()
    words = line.split()
    return 1 <= len(words) <= 12 and not line.endswith((".", ":"))


def _split_title_and_body(rest: str) -> tuple[str | None, str]:
    """Split `'Short Title: Body text'` into `('Short Title', 'Body text')`."""
    cleaned = rest.strip()
    if ":" in cleaned:
        head, tail = cleaned.split(":", 1)
        head_clean = head.strip()
        tail_clean = tail.strip()
        if head_clean and len(head_clean.split()) <= 10:
            return head_clean, tail_clean
    return cleaned, cleaned


def _compute_numbered_level_and_parent(
    number: str,
    doc_id: str,
    current_chapter_id: str | None,
) -> tuple[int, str | None]:
    parts = number.split(".")
    level = len(parts)
    if level <= 1:
        if current_chapter_id is not None:
            return 2, current_chapter_id
        return 1, None
    parent_num = ".".join(parts[:-1])
    return level, f"{doc_id}:{parent_num}"


def _match_heading_or_clause(line: str) -> tuple[str, str, str] | None:
    """Return `(kind, number, rest)` where kind in `{'chapter', 'clause', 'subitem'}` or `None`."""
    chap_match = CHAPTER_LINE_RE.match(line)
    if chap_match:
        kind_word = chap_match.group("kind").upper()
        num_word = chap_match.group("num").upper()
        title_part = (chap_match.group("title") or "").strip()
        number = f"{kind_word} {num_word}"
        return "chapter", number, title_part or number

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
    return " ".join(words[:max_words])


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


def _attach_parsed_tables_to_clauses(
    tables: list[ParsedTable],
    clauses_out: list[dict[str, Any]],
) -> None:
    """Attach extracted `ParsedTable` objects to their parent clause on the matching page."""
    if not tables or not clauses_out:
        return

    table_counts: Counter[str] = Counter()
    for tbl in tables:
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
            ]
            if same_page:
                target_clause = same_page[-1]
            else:
                target_clause = clauses_out[-1]

        cid = str(target_clause["clause_id"])
        table_counts[cid] += 1
        t_idx = table_counts[cid]
        target_clause["tables"].append(
            {
                "table_id": f"{cid}:t{t_idx}",
                "caption": tbl.caption,
                "headers": list(tbl.headers),
                "rows": [list(r) for r in tbl.rows],
                "page": tbl.page,
            }
        )


def build_clause_tree_from_parse_result(
    doc: DocumentConfig,
    config: JurisdictionConfig,
    parse_result: ParseResult,
) -> dict[str, Any]:
    """Deterministically structure `ParseResult` blocks and tables into a Schema v1.2 `ClauseTree`."""
    running_margins = _collect_running_headers_and_footers(
        parse_result.blocks, parse_result.page_count
    )

    raw_clauses: list[dict[str, Any]] = []
    current: dict[str, Any] | None = None
    current_chapter_id: str | None = None
    last_numbered_num: str | None = None
    last_numbered_level: int = 1
    last_alpha_num: str | None = None
    last_alpha_letter: str | None = None
    last_alpha_level: int = 2

    for block in parse_result.blocks:
        line = block.text.strip()
        if not line:
            continue
        if line in running_margins or _is_margin_page_number(block):
            continue

        parsed_line = _match_heading_or_clause(line)
        if parsed_line is None and current is None and _is_top_title_banner(block):
            continue
        if parsed_line is not None:
            kind, number, rest = parsed_line

            if kind == "chapter":
                clause_id = f"{doc.id}:{number}"
                current_chapter_id = clause_id
                last_numbered_num = number
                last_numbered_level = 1
                last_alpha_num = None
                last_alpha_letter = None
                current = {
                    "clause_id": clause_id,
                    "number": number,
                    "title": rest,
                    "level": 1,
                    "candidate_parent": None,
                    "fallback_parent": None,
                    "body_parts": [rest],
                    "blocks": [block],
                }
                raw_clauses.append(current)
                continue

            if kind == "clause":
                # If a standalone heading line ("2.2 Maximum Building Height") is immediately
                # followed by its body paragraph that repeats the same clause number
                # ("2.2 Maximum Building Height: No residential building..."), attach body to it.
                if (
                    current is not None
                    and current["number"] == number
                    and current["body_parts"] == [current["title"]]
                ):
                    title, body = _split_title_and_body(rest)
                    if title:
                        current["title"] = title
                    current["body_parts"] = [body]
                    current["blocks"].append(block)
                    continue

                title, body = _split_title_and_body(rest)
                level, candidate_parent = _compute_numbered_level_and_parent(
                    number, doc.id, current_chapter_id
                )
                clause_id = f"{doc.id}:{number}"
                last_numbered_num = number
                last_numbered_level = level
                last_alpha_num = None
                last_alpha_letter = None

                current = {
                    "clause_id": clause_id,
                    "number": number,
                    "title": title,
                    "level": level,
                    "candidate_parent": candidate_parent,
                    "fallback_parent": current_chapter_id,
                    "body_parts": [body],
                    "blocks": [block],
                }
                raw_clauses.append(current)
                continue

            if kind == "subitem":
                subnum = number
                is_roman_under_alpha = (
                    subnum in ROMAN_SUBNUMS
                    and last_alpha_num is not None
                    and not (subnum == "i" and last_alpha_letter == "h")
                    and not (subnum == "v" and last_alpha_letter == "u")
                    and not (subnum == "x" and last_alpha_letter == "w")
                )
                if is_roman_under_alpha and last_alpha_num is not None:
                    scoped_number = f"{last_alpha_num}({subnum})"
                    candidate_parent = f"{doc.id}:{last_alpha_num}"
                    level = last_alpha_level + 1
                elif last_numbered_num is not None:
                    scoped_number = f"{last_numbered_num}({subnum})"
                    candidate_parent = f"{doc.id}:{last_numbered_num}"
                    level = last_numbered_level + 1
                    last_alpha_num = scoped_number
                    last_alpha_letter = subnum
                    last_alpha_level = level
                else:
                    scoped_number = f"({subnum})"
                    candidate_parent = current_chapter_id
                    level = 2

                title, body = _split_title_and_body(rest)
                current = {
                    "clause_id": f"{doc.id}:{scoped_number}",
                    "number": scoped_number,
                    "title": title,
                    "level": level,
                    "candidate_parent": candidate_parent,
                    "fallback_parent": current_chapter_id,
                    "body_parts": [body],
                    "blocks": [block],
                }
                raw_clauses.append(current)
                continue

        if current is not None:
            current["body_parts"].append(line)
            current["blocks"].append(block)
        else:
            # Substantive preamble / enacting text before the first numbered clause
            preamble_id = f"{doc.id}:preamble"
            current = {
                "clause_id": preamble_id,
                "number": "preamble",
                "title": "Preamble",
                "level": 1,
                "candidate_parent": None,
                "fallback_parent": None,
                "body_parts": [line],
                "blocks": [block],
            }
            raw_clauses.append(current)

    known_clause_ids = {item["clause_id"] for item in raw_clauses}
    clauses_out: list[dict[str, Any]] = []
    is_amendment_doc = doc.role == "amendment" or doc.doc_type in {"amendment", "notification"}

    for order_idx, item in enumerate(raw_clauses):
        clause_id = item["clause_id"]
        number = item["number"]
        text = " ".join(part.strip() for part in item["body_parts"] if part.strip()).strip()
        if item["candidate_parent"] in known_clause_ids:
            parent_id = item["candidate_parent"]
        elif item.get("fallback_parent") in known_clause_ids and item.get("fallback_parent") != clause_id:
            parent_id = item["fallback_parent"]
        else:
            parent_id = None

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

        cross_refs = (
            _extract_cross_references(text, doc.id, number)
            if not is_amendment_doc
            else []
        )

        clauses_out.append(
            {
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
                "number": number,
                "title": item["title"],
                "level": item["level"],
                "parent_id": parent_id,
                "order": order_idx,
                "text": text,
                "language": _detect_language(text),
                "tables": [],
                "citations": citations,
                "cross_references": cross_refs,
                "amended_by": [],
                "applies_to_zones": [],
                "verification": "machine_checked",
                "verified_by": None,
            }
        )

    _attach_parsed_tables_to_clauses(parse_result.tables, clauses_out)

    return {
        "schema_version": "1.2",
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
    """Build JSON clause trees for all parsed regulatory documents in a jurisdiction."""
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
        structured_count += 1

    click.echo(
        f"[structure] Built {structured_count} clause tree(s) for '{config.id}'."
    )
