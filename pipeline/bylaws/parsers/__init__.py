"""PDF parser adapters package."""

from __future__ import annotations

import click

from bylaws.config import JurisdictionConfig
from bylaws.parsers.base import ParsedBlock, ParsedTable, ParserAdapter, ParseResult

__all__ = [
    "ParseResult",
    "ParsedBlock",
    "ParsedTable",
    "ParserAdapter",
    "run_parse_stage",
]


def run_parse_stage(config: JurisdictionConfig, *, parser_name: str = "docling") -> None:
    """Run the parse stage for all documents in the given jurisdiction."""
    click.echo(
        f"[parse] Configured for jurisdiction '{config.id}' with adapter '{parser_name}'."
    )
