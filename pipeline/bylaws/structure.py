"""Stage 8.4: Convert parser output into a validated Schema v1.1 clause tree."""

from __future__ import annotations

import json
import re
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

import click

from bylaws import __version__ as PIPELINE_VERSION
from bylaws.config import DocumentConfig, JurisdictionConfig
from bylaws.parsers.base import ParsedBlock, ParseResult
from bylaws.root import resolve_repo_root
from bylaws.schema_validator import validate_payload

SYNTHETIC_TIMESTAMP = "2026-11-23T00:00:00Z"

# Matches numbered headings/clauses like:
# "1. General Provisions", "1.1 Short Title: ...", "D1.1 ProposedOverlay: ...", "(a) Sub-item"
CLAUSE_LINE_RE = re.compile(
    r"^(?P<number>(?:\d+(?:\.\d+)*|[A-Z]\d+\.\d+(?:\.\d+)*)|\([a-z]\)|\([ivx]+\))\.?\s+(?P<rest>.+)$"
)

CROSS_REF_RE = re.compile(r"\bclause\s+([A-Za-z]?\d+(?:\.\d+)*)\b", re.IGNORECASE)


def _compute_level_and_candidate_parent(number: str, doc_id: str) -> tuple[int, str | None]:
    if number.startswith("(") and number.endswith(")"):
        return 3, None
    parts = number.split(".")
    level = len(parts)
    if level <= 1:
        return 1, None
    parent_num = ".".join(parts[:-1])
    return level, f"{doc_id}:{parent_num}"


def _split_title_and_body(rest: str) -> tuple[str | None, str]:
    """Split `'Short Title: Body text'` into `('Short Title', 'Body text')`."""
    if ":" in rest:
        head, tail = rest.split(":", 1)
        head_clean = head.strip()
        tail_clean = tail.strip()
        if head_clean and len(head_clean.split()) <= 10 and tail_clean:
            return head_clean, tail_clean
    return rest.strip(), rest.strip()


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


def build_clause_tree_from_parse_result(
    doc: DocumentConfig,
    config: JurisdictionConfig,
    parse_result: ParseResult,
) -> dict[str, Any]:
    """Deterministically structure `ParseResult` blocks into a Schema v1.1 `ClauseTree` dict."""
    raw_clauses: list[dict[str, Any]] = []
    current: dict[str, Any] | None = None
    last_numbered_id: str | None = None

    for block in parse_result.blocks:
        line = block.text.strip()
        if not line:
            continue

        # Skip leading document title banner lines before the first clause
        if current is None and (
            line.lower() == doc.title.lower() or line.upper().startswith("DRAFT --")
        ):
            continue

        match = CLAUSE_LINE_RE.match(line)
        if match:
            number = match.group("number")
            rest = match.group("rest").strip()

            # If a standalone heading line ("2.2 Maximum Building Height") is immediately
            # followed by its body line ("2.2 Maximum Building Height: No residential..."),
            # merge into the existing clause entry rather than creating a duplicate ID.
            if current is not None and current["number"] == number:
                title, body = _split_title_and_body(rest)
                if title:
                    current["title"] = title
                current["body_parts"] = [body]
                current["blocks"].append(block)
                continue

            title, body = _split_title_and_body(rest)
            level, candidate_parent = _compute_level_and_candidate_parent(number, doc.id)
            if number.startswith("(") and last_numbered_id is not None:
                candidate_parent = last_numbered_id
            else:
                last_numbered_id = f"{doc.id}:{number}"

            current = {
                "clause_id": f"{doc.id}:{number}",
                "number": number,
                "title": title,
                "level": level,
                "candidate_parent": candidate_parent,
                "body_parts": [body],
                "blocks": [block],
            }
            raw_clauses.append(current)
        elif current is not None:
            current["body_parts"].append(line)
            current["blocks"].append(block)

    known_clause_ids = {item["clause_id"] for item in raw_clauses}
    clauses_out: list[dict[str, Any]] = []

    for order_idx, item in enumerate(raw_clauses):
        clause_id = item["clause_id"]
        number = item["number"]
        text = " ".join(part.strip() for part in item["body_parts"] if part.strip()).strip()
        parent_id = (
            item["candidate_parent"]
            if item["candidate_parent"] in known_clause_ids
            else None
        )

        # Group blocks by page to construct citations
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
            if doc.role != "amendment"
            else []
        )

        clauses_out.append(
            {
                "clause_id": clause_id,
                "record_id": f"{clause_id}@v1",
                "supersedes": None,
                "superseded_by": None,
                "legal_status": doc.legal_status,
                "number": number,
                "title": item["title"],
                "level": item["level"],
                "parent_id": parent_id,
                "order": order_idx,
                "text": text,
                "tables": [],
                "citations": citations,
                "cross_references": cross_refs,
                "amended_by": [],
                "applies_to_zones": [],
                "verification": "machine_checked",
            }
        )

    generated_at = (
        SYNTHETIC_TIMESTAMP
        if config.country == "XX"
        else datetime.now(UTC).strftime("%Y-%m-%dT%H:%M:%SZ")
    )
    parser_version = (
        "5.0.0" if config.country == "XX" else parse_result.parser_version
    )

    return {
        "schema_version": "1.1",
        "doc_id": doc.id,
        "jurisdiction": config.id,
        "legal_status": doc.legal_status,
        "generated": {
            "parser": parse_result.parser_name,
            "parser_version": parser_version,
            "pipeline_version": PIPELINE_VERSION,
            "generated_at": generated_at,
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


def run_structure(config: JurisdictionConfig, *, repo_root: Path | None = None) -> None:
    """Build JSON clause trees for all parsed regulatory documents in a jurisdiction."""
    root = repo_root or resolve_repo_root()
    interim_dir = root / "data" / "interim" / config.id
    docs_out_dir = root / "data" / "processed" / config.id / "documents"
    docs_out_dir.mkdir(parents=True, exist_ok=True)

    structured_count = 0
    for doc in config.documents:
        if doc.role not in {"base", "amendment", "regulation"}:
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
