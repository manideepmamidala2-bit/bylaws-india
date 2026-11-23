"""PDF parser adapters package."""

from __future__ import annotations

import json
from pathlib import Path

import click

from bylaws.config import JurisdictionConfig
from bylaws.parsers.base import ParsedBlock, ParsedTable, ParserAdapter, ParseResult
from bylaws.parsers.layout_table_adapter import (
    DoclingLayoutAdapter,
    TesseractOcrAdapter,
)
from bylaws.parsers.pypdfium2_adapter import Pypdfium2Adapter
from bylaws.root import resolve_repo_root

__all__ = [
    "DoclingLayoutAdapter",
    "ParseResult",
    "ParsedBlock",
    "ParsedTable",
    "ParserAdapter",
    "Pypdfium2Adapter",
    "TesseractOcrAdapter",
    "get_parser_adapter",
    "run_parse_stage",
]


def get_parser_adapter(parser_name: str) -> ParserAdapter:
    """Return an initialized `ParserAdapter` or fail loudly if not implemented."""
    normalized = parser_name.strip().lower()
    if normalized == "pypdfium2":
        return Pypdfium2Adapter()
    if normalized == "docling":
        return DoclingLayoutAdapter()
    if normalized == "tesseract":
        return TesseractOcrAdapter()
    raise click.ClickException(f"not implemented: parse ({parser_name})")


def run_parse_stage(
    config: JurisdictionConfig,
    *,
    parser_name: str = "pypdfium2",
    repo_root: Path | None = None,
) -> None:
    """Run the parse stage for all PDF documents in the given jurisdiction."""
    adapter = get_parser_adapter(parser_name)
    root = repo_root or resolve_repo_root()
    raw_dir = root / "data" / "raw" / config.id
    interim_dir = root / "data" / "interim" / config.id
    interim_dir.mkdir(parents=True, exist_ok=True)

    parsed_count = 0
    for doc in config.documents:
        if doc.role in {"boundary", "reference"} or doc.doc_type in {"map", "standard_reference"}:
            continue
        if doc.text_rights is not None and doc.text_rights.mode == "reference_only":
            continue
        pdf_path = raw_dir / f"{doc.id}.pdf"
        if not pdf_path.is_file():
            raise click.ClickException(
                f"Raw PDF not found for document '{doc.id}': {pdf_path}. "
                "Run `bylaws acquire` first."
            )
        result = adapter.parse(pdf_path)
        json_out = interim_dir / f"{doc.id}.{adapter.name}.json"
        md_out = interim_dir / f"{doc.id}.{adapter.name}.md"
        json_out.write_text(
            json.dumps(result.model_dump(mode="json"), indent=2) + "\n",
            encoding="utf-8",
        )
        md_out.write_text(result.markdown, encoding="utf-8")
        parsed_count += 1

    click.echo(
        f"[parse] Parsed {parsed_count} document(s) for '{config.id}' "
        f"with adapter '{adapter.name}'."
    )
