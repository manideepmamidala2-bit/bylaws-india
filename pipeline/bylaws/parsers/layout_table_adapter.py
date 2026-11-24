"""Real Docling layout/table adapter (`docling`) and Tesseract OCR adapter (`tesseract`)."""

from __future__ import annotations

import shutil
import subprocess
import tempfile
from importlib.metadata import PackageNotFoundError, version
from pathlib import Path
from typing import Any

import click
import pypdfium2 as pdfium

from bylaws.parsers.base import ParsedBlock, ParsedTable, ParserAdapter, ParseResult


def _resolve_adapter_version(pkg_name: str) -> str:
    """Return the installed package version or fail loudly (Rule R7)."""
    try:
        return version(pkg_name)
    except PackageNotFoundError as exc:
        raise click.ClickException(
            f"Required parser package '{pkg_name}' is not installed."
        ) from exc


def _clamp(val: float, low: float = 0.0, high: float = 1.0) -> float:
    return round(max(low, min(high, val)), 4)


def _normalize_docling_bbox(
    bbox_obj: Any, page_width: float, page_height: float
) -> list[float] | None:
    if bbox_obj is None or page_width <= 0 or page_height <= 0:
        return None
    try:
        tl_bbox = (
            bbox_obj.to_top_left_origin(page_height=page_height)
            if hasattr(bbox_obj, "to_top_left_origin")
            else bbox_obj
        )
        left = float(getattr(tl_bbox, "l", 0.0))
        top = float(getattr(tl_bbox, "t", 0.0))
        right = float(getattr(tl_bbox, "r", 0.0))
        bottom = float(getattr(tl_bbox, "b", 0.0))
        x0 = _clamp(min(left, right) / page_width)
        x1 = _clamp(max(left, right) / page_width)
        y0 = _clamp(min(top, bottom) / page_height)
        y1 = _clamp(max(top, bottom) / page_height)
        return [x0, y0, x1, y1]
    except (AttributeError, TypeError, ValueError, ZeroDivisionError):
        return None


class DoclingLayoutAdapter(ParserAdapter):
    """Layout and table-structure parser adapter backed by real `docling`."""

    name = "docling"

    def parse(self, pdf_path: Path) -> ParseResult:
        if not pdf_path.is_file():
            raise FileNotFoundError(f"PDF file not found: {pdf_path}")

        docling_ver = _resolve_adapter_version("docling")
        try:
            from docling.datamodel.base_models import InputFormat
            from docling.datamodel.pipeline_options import PdfPipelineOptions
            from docling.document_converter import DocumentConverter, PdfFormatOption
        except ImportError as exc:
            raise click.ClickException(
                f"Failed to import docling: {exc}"
            ) from exc

        pdf_doc = pdfium.PdfDocument(str(pdf_path))
        try:
            page_count = len(pdf_doc)
            total_chars = 0
            page_sizes: dict[int, tuple[float, float]] = {}
            for idx in range(page_count):
                page = pdf_doc[idx]
                page_sizes[idx + 1] = page.get_size()
                tp = page.get_textpage()
                total_chars += len(tp.get_text_range().strip())
                tp.close()
                page.close()
            is_scanned = total_chars == 0
        finally:
            pdf_doc.close()

        pipeline_options = PdfPipelineOptions(
            do_ocr=is_scanned,
            do_table_structure=True,
        )
        converter = DocumentConverter(
            format_options={
                InputFormat.PDF: PdfFormatOption(pipeline_options=pipeline_options)
            }
        )
        conv_res = converter.convert(str(pdf_path))
        dl_doc = conv_res.document

        blocks: list[ParsedBlock] = []
        for text_item in getattr(dl_doc, "texts", []) or []:
            raw_text = str(getattr(text_item, "text", "") or "").strip()
            if not raw_text:
                continue
            prov_list = getattr(text_item, "prov", None) or []
            if prov_list:
                first_prov = prov_list[0]
                page_no = int(getattr(first_prov, "page_no", 1) or 1)
                pw, ph = page_sizes.get(page_no, (0.0, 0.0))
                norm_bbox = _normalize_docling_bbox(
                    getattr(first_prov, "bbox", None), pw, ph
                )
            else:
                page_no = 1
                norm_bbox = None

            blocks.append(
                ParsedBlock(
                    text=" ".join(raw_text.split()),
                    page=page_no,
                    bbox=norm_bbox,
                )
            )

        tables: list[ParsedTable] = []
        for tbl_idx, tbl_item in enumerate(getattr(dl_doc, "tables", []) or [], start=1):
            prov_list = getattr(tbl_item, "prov", None) or []
            page_no = (
                int(getattr(prov_list[0], "page_no", 1) or 1) if prov_list else 1
            )
            headers: list[str] = []
            rows: list[list[str]] = []
            data_obj = getattr(tbl_item, "data", None)
            grid = getattr(data_obj, "grid", None) if data_obj is not None else None
            if grid and len(grid) > 0:
                matrix = [
                    [" ".join(str(getattr(cell, "text", "") or "").split()) for cell in r]
                    for r in grid
                ]
                headers = matrix[0]
                rows = matrix[1:]
            tables.append(
                ParsedTable(
                    table_id=f"p{page_no}_t{tbl_idx}",
                    caption=None,
                    headers=headers,
                    rows=rows,
                    page=page_no,
                )
            )

        exported_md = dl_doc.export_to_markdown().strip()
        return ParseResult(
            parser_name=self.name,
            parser_version=docling_ver,
            markdown=(exported_md + "\n") if exported_md else "",
            blocks=blocks,
            tables=tables,
            tables_supported=True,
            notes=["docling-standard-pipeline"],
            page_count=page_count,
            is_scanned=is_scanned,
        )


class TesseractOcrAdapter(ParserAdapter):
    """Tesseract OCR adapter with English data; sets `bbox: null` when word positions are absent (Rule R8)."""

    name = "tesseract"

    def parse(self, pdf_path: Path) -> ParseResult:
        if not pdf_path.is_file():
            raise FileNotFoundError(f"PDF file not found: {pdf_path}")

        tess_pkg_version = _resolve_adapter_version("pytesseract")
        tesseract_bin = shutil.which("tesseract")
        if not tesseract_bin:
            raise click.ClickException(
                "Required system binary 'tesseract' is not installed on PATH."
            )

        doc = pdfium.PdfDocument(str(pdf_path))
        ocr_blocks: list[ParsedBlock] = []
        md_pages: list[str] = []
        total_digital_chars = 0
        try:
            page_count = len(doc)
            with tempfile.TemporaryDirectory() as tmp_dir:
                for idx in range(page_count):
                    page_num = idx + 1
                    page = doc[idx]
                    tp = page.get_textpage()
                    total_digital_chars += len(tp.get_text_range().strip())
                    tp.close()

                    bitmap = page.render(scale=300 / 72)
                    pil_img = bitmap.to_pil()
                    img_path = Path(tmp_dir) / f"page_{page_num}.png"
                    pil_img.save(img_path)
                    page.close()

                    proc = subprocess.run(
                        [tesseract_bin, str(img_path), "stdout", "-l", "eng"],
                        capture_output=True,
                        text=True,
                        check=False,
                    )
                    if proc.returncode != 0:
                        raise click.ClickException(
                            f"Tesseract OCR failed on page {page_num}: {proc.stderr.strip()}"
                        )
                    lines = [
                        ln.strip() for ln in proc.stdout.splitlines() if ln.strip()
                    ]
                    for ln in lines:
                        ocr_blocks.append(
                            ParsedBlock(
                                text=ln,
                                page=page_num,
                                bbox=None,
                            )
                        )
                    md_pages.append(f"<!-- page {page_num} -->\n" + "\n".join(lines))
        finally:
            doc.close()

        return ParseResult(
            parser_name=self.name,
            parser_version=tess_pkg_version,
            markdown="\n\n".join(md_pages).strip() + "\n",
            blocks=ocr_blocks,
            tables=[],
            tables_supported=False,
            notes=["OCR executed via tesseract (eng); bbox is null when word positions are absent"],
            page_count=page_count,
            is_scanned=(total_digital_chars == 0),
        )
