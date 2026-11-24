"""Baseline `pypdfium2` text, layout, and table parser adapter (Plan v2.0 §5.A1 / §5.B4)."""

from __future__ import annotations

import re
from importlib.metadata import PackageNotFoundError, version
from pathlib import Path

import pypdfium2 as pdfium

from bylaws.parsers.base import ParsedBlock, ParsedTable, ParserAdapter, ParseResult

TABLE_CAPTION_RE = re.compile(
    r"^Table\s+(?P<num>[0-9A-Za-z.-]+)(?:\s*[:.\-\u2013\u2014]\s*(?P<title>.*))?$",
    re.IGNORECASE,
)


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
    except PackageNotFoundError as exc:
        raise RuntimeError("Required parser package 'pypdfium2' is not installed.") from exc


def _group_rects_into_rows(
    raw_rects: list[tuple[float, float, float, float, str]],
    y_tolerance: float = 4.0,
    cell_gap_pt: float = 12.0,
) -> list[list[tuple[float, float, float, float, str]]]:
    """Group PDF rects into horizontal rows (top-to-bottom), merging only nearby words (`<= cell_gap_pt`)."""
    if not raw_rects:
        return []

    # Sort top-to-bottom (higher PDF `top` is higher on the page), then left-to-right
    sorted_rects = sorted(raw_rects, key=lambda r: (-round(r[3], 1), r[0]))
    raw_rows: list[list[tuple[float, float, float, float, str]]] = []

    for rect in sorted_rects:
        if raw_rows and abs(raw_rows[-1][0][3] - rect[3]) <= y_tolerance:
            raw_rows[-1].append(rect)
        else:
            raw_rows.append([rect])

    merged_rows: list[list[tuple[float, float, float, float, str]]] = []
    for row in raw_rows:
        row_sorted = sorted(row, key=lambda r: r[0])
        cells: list[tuple[float, float, float, float, str]] = []
        for left, bottom, right, top, text in row_sorted:
            if cells and (left - cells[-1][2]) <= cell_gap_pt:
                prev_l, prev_b, prev_r, prev_t, prev_txt = cells[-1]
                cells[-1] = (
                    min(prev_l, left),
                    min(prev_b, bottom),
                    max(prev_r, right),
                    max(prev_t, top),
                    f"{prev_txt} {text}".strip(),
                )
            else:
                cells.append((left, bottom, right, top, text.strip()))
        if cells:
            merged_rows.append(cells)

    return merged_rows


def _extract_tables_and_prose_rows(
    rows: list[list[tuple[float, float, float, float, str]]],
    page_number: int,
) -> tuple[list[ParsedTable], list[list[tuple[float, float, float, float, str]]]]:
    """Separate structured tables from prose rows on a page."""
    tables: list[ParsedTable] = []
    prose_rows: list[list[tuple[float, float, float, float, str]]] = []
    idx = 0
    table_seq = 0

    while idx < len(rows):
        row = rows[idx]
        # Case 1: Explicit "Table X..." caption line followed by multi-cell rows
        if len(row) == 1:
            caption_text = row[0][4].strip()
            cap_match = TABLE_CAPTION_RE.match(caption_text)
            if cap_match and (idx + 1) < len(rows) and len(rows[idx + 1]) >= 2:
                table_cells_rows: list[list[str]] = []
                j = idx + 1
                while j < len(rows) and len(rows[j]) >= 2:
                    table_cells_rows.append([c[4] for c in rows[j]])
                    j += 1
                if table_cells_rows:
                    table_seq += 1
                    headers = table_cells_rows[0]
                    data_rows = table_cells_rows[1:]
                    tables.append(
                        ParsedTable(
                            table_id=f"p{page_number}_t{table_seq}",
                            caption=caption_text,
                            headers=headers,
                            rows=data_rows,
                            page=page_number,
                        )
                    )
                    idx = j
                    continue

        # Case 2: Uncaptioned grid of >= 2 consecutive rows each with >= 3 columns
        if len(row) >= 3 and (idx + 1) < len(rows) and len(rows[idx + 1]) == len(row):
            table_cells_rows = []
            col_count = len(row)
            j = idx
            while j < len(rows) and len(rows[j]) == col_count:
                table_cells_rows.append([c[4] for c in rows[j]])
                j += 1
            table_seq += 1
            tables.append(
                ParsedTable(
                    table_id=f"p{page_number}_t{table_seq}",
                    caption=None,
                    headers=table_cells_rows[0],
                    rows=table_cells_rows[1:],
                    page=page_number,
                )
            )
            idx = j
            continue

        prose_rows.append(row)
        idx += 1

    return tables, prose_rows


def _order_prose_cells_column_aware(
    prose_rows: list[list[tuple[float, float, float, float, str]]],
    page_width: float,
) -> list[tuple[float, float, float, float, str]]:
    """Order prose cells in reading order, handling two-column pages without gluing columns."""
    if not prose_rows or page_width <= 0:
        return []

    mid_x = page_width * 0.5
    two_col_row_count = sum(
        1
        for row in prose_rows
        if len(row) == 2 and row[0][2] <= page_width * 0.54 and row[1][0] >= page_width * 0.46
    )

    if two_col_row_count == 0:
        ordered: list[tuple[float, float, float, float, str]] = []
        for row in prose_rows:
            ordered.extend(row)
        return ordered

    top_spanning: list[tuple[float, float, float, float, str]] = []
    left_col: list[tuple[float, float, float, float, str]] = []
    right_col: list[tuple[float, float, float, float, str]] = []
    bottom_spanning: list[tuple[float, float, float, float, str]] = []
    seen_columns = False

    for row in prose_rows:
        if len(row) == 1 and (row[0][2] - row[0][0]) > page_width * 0.55:
            if not seen_columns:
                top_spanning.append(row[0])
            else:
                bottom_spanning.append(row[0])
            continue

        seen_columns = True
        for cell in row:
            center_x = (cell[0] + cell[2]) * 0.5
            if center_x < mid_x and cell[2] <= page_width * 0.56:
                left_col.append(cell)
            else:
                right_col.append(cell)

    return [*top_spanning, *left_col, *right_col, *bottom_spanning]


class Pypdfium2Adapter(ParserAdapter):
    """Local PDF text, column-aware block, and table adapter using `pypdfium2`."""

    name = "pypdfium2"

    def parse(self, pdf_path: Path) -> ParseResult:
        if not pdf_path.is_file():
            raise FileNotFoundError(f"PDF file not found: {pdf_path}")

        doc = pdfium.PdfDocument(str(pdf_path))
        blocks: list[ParsedBlock] = []
        tables: list[ParsedTable] = []
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

                rows = _group_rects_into_rows(raw_rects)
                page_tables, prose_rows = _extract_tables_and_prose_rows(rows, page_number)
                tables.extend(page_tables)

                ordered_cells = _order_prose_cells_column_aware(prose_rows, width)
                page_lines: list[str] = []
                for left, bottom, right, top, line_text in ordered_cells:
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
            tables=tables,
            tables_supported=True,
            notes=[],
            page_count=page_count,
            is_scanned=(total_chars == 0),
        )
