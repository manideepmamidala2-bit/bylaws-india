"""Parser adapter interface and structured parse result models (Plan v1.1 §S2 / §8)."""

from __future__ import annotations

from abc import ABC, abstractmethod
from pathlib import Path

from pydantic import BaseModel, ConfigDict, Field


class ParsedTable(BaseModel):
    """Structured table extracted from a document page."""

    model_config = ConfigDict(extra="forbid")

    table_id: str
    caption: str | None = None
    headers: list[str] = Field(default_factory=list)
    rows: list[list[str]] = Field(default_factory=list)
    page: int


class ParsedBlock(BaseModel):
    """A contiguous line/block of extracted text with page and normalized bbox provenance."""

    model_config = ConfigDict(extra="forbid")

    text: str
    page: int
    bbox: list[float] | None = None


class ParseResult(BaseModel):
    """Standardized output of any `ParserAdapter` implementation."""

    model_config = ConfigDict(extra="forbid")

    parser_name: str
    parser_version: str
    markdown: str
    blocks: list[ParsedBlock] = Field(default_factory=list)
    tables: list[ParsedTable] = Field(default_factory=list)
    tables_supported: bool = True
    notes: list[str] = Field(default_factory=list)
    page_count: int
    is_scanned: bool = False


class ParserAdapter(ABC):
    """Replaceable PDF parser adapter contract."""

    name: str

    @abstractmethod
    def parse(self, pdf_path: Path) -> ParseResult:
        """Parse a PDF file into Markdown, structured blocks with bbox, and page numbers."""
