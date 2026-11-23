"""Baseline `pypdfium2` text and bounding-box parser adapter (Plan v1.1 §S2)."""

from __future__ import annotations

from importlib.metadata import PackageNotFoundError, version
from pathlib import Path

import pypdfium2 as pdfium

from bylaws.parsers.base import ParsedBlock, ParserAdapter, ParseResult


def _clamp(value: float, low: float = 0.0, high: float = 1.0) -> float:
    return round(max(low, min(high, value)), 4)


def _pdf_rect_to_top_left_bbox(
    left: float,
    bottom: float,
    right: float,
    top: float,
    page_width: float,
    page_height: float,
) -> list[float]:
    """Convert PDF bottom-left `(left, bottom, right, top)` to `[x0, y0, x1, y1]` in `[0, 1]`."""
    if page_width <= 0 or page_height <= 0:
        return [0.0, 0.0, 1.0, 1.0]
    x0 = _clamp(min(left, right) / page_width)
    x1 = _clamp(max(left, right) / page_width)
    y0 = _clamp((page_height - max(top, bottom)) / page_height)
    y1 = _clamp((page_height - min(top, bottom)) / page_height)
    return [x0, y0, x1, y1]


def _get_pypdfium2_version() -> str:
    try:
        return version("pypdfium2")
    except PackageNotFoundError:
        return "unknown"


class Pypdfium2Adapter(ParserAdapter):
    """Fast local PDF text adapter using `pypdfium2` with normalized bounding boxes.

    Does not perform OCR or table extraction; records `"tables not supported by this adapter"`.
    """

    name = "pypdfium2"

    def parse(self, pdf_path: Path) -> ParseResult:
        if not pdf_path.is_file():
            raise FileNotFoundError(f"PDF file not found: {pdf_path}")

        doc = pdfium.PdfDocument(str(pdf_path))
        blocks: list[ParsedBlock] = []
        md_pages: list[str] = []
        total_chars = 0

        try:
            page_count = len(doc)
            for page_idx in range(page_count):
                page_number = page_idx + 1
                page = doc[page_idx]
                width, height = page.get_size()
                textpage = page.get_textpage()

                raw_rects: list[tuple[float, float, float, float, str]] = []
                rect_count = textpage.count_rects()
                for r_idx in range(rect_count):
                    left, bottom, right, top = textpage.get_rect(r_idx)
                    segment = textpage.get_text_bounded(left, bottom, right, top)
                    cleaned = " ".join(segment.replace("\r", " ").replace("\n", " ").split())
                    if cleaned:
                        raw_rects.append((left, bottom, right, top, cleaned))
                        total_chars += len(cleaned)

                # Group rects that lie on the same horizontal line (within 4pt vertical tolerance)
                merged_lines: list[tuple[float, float, float, float, list[str]]] = []
                for left, bottom, right, top, text_seg in raw_rects:
                    if merged_lines and abs(merged_lines[-1][3] - top) <= 4.0:
                        prev_l, prev_b, prev_r, prev_t, prev_parts = merged_lines[-1]
                        merged_lines[-1] = (
                            min(prev_l, left),
                            min(prev_b, bottom),
                            max(prev_r, right),
                            max(prev_t, top),
                            [*prev_parts, text_seg],
                        )
                    else:
                        merged_lines.append((left, bottom, right, top, [text_seg]))

                page_lines: list[str] = []
                for left, bottom, right, top, parts in merged_lines:
                    line_text = " ".join(parts).strip()
                    if not line_text:
                        continue
                    bbox = _pdf_rect_to_top_left_bbox(left, bottom, right, top, width, height)
                    blocks.append(
                        ParsedBlock(
                            text=line_text,
                            page=page_number,
                            bbox=bbox,
                        )
                    )
                    page_lines.append(line_text)

                md_pages.append(f"<!-- page {page_number} -->\n" + "\n".join(page_lines))
                textpage.close()
                page.close()
        finally:
            doc.close()

        return ParseResult(
            parser_name=self.name,
            parser_version=_get_pypdfium2_version(),
            markdown="\n\n".join(md_pages).strip() + "\n",
            blocks=blocks,
            tables=[],
            tables_supported=False,
            notes=["tables not supported by this adapter"],
            page_count=page_count,
            is_scanned=(total_chars == 0),
        )
