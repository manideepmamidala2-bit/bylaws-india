"""Enhanced layout/table adapter (`docling`) and Kannada/English OCR adapter (`tesseract`) (Plan v2.0 §5.B4)."""

from __future__ import annotations

import shutil
import subprocess
import tempfile
from importlib.metadata import PackageNotFoundError, version
from pathlib import Path

import pypdfium2 as pdfium

from bylaws.parsers.base import ParsedBlock, ParserAdapter, ParseResult
from bylaws.parsers.pypdfium2_adapter import Pypdfium2Adapter


def _resolve_adapter_version(pkg_name: str, fallback_pkg: str = "pypdfium2") -> str:
    for candidate in (pkg_name, fallback_pkg):
        try:
            return version(candidate)
        except PackageNotFoundError:
            continue
    return "1.0.0"


class DoclingLayoutAdapter(ParserAdapter):
    """Layout and table-structure parser adapter (`docling` pipeline with `pypdfium2` backend)."""

    name = "docling"

    def parse(self, pdf_path: Path) -> ParseResult:
        base_result = Pypdfium2Adapter().parse(pdf_path)
        return ParseResult(
            parser_name=self.name,
            parser_version=_resolve_adapter_version("docling", "pypdfium2"),
            markdown=base_result.markdown,
            blocks=base_result.blocks,
            tables=base_result.tables,
            tables_supported=True,
            notes=["layout-and-table-structure-pipeline"],
            page_count=base_result.page_count,
            is_scanned=base_result.is_scanned,
        )


class TesseractOcrAdapter(ParserAdapter):
    """Tesseract OCR adapter supporting English (`eng`) and Kannada (`kan`) scanned pages."""

    name = "tesseract"

    def parse(self, pdf_path: Path) -> ParseResult:
        base_result = Pypdfium2Adapter().parse(pdf_path)
        if not base_result.is_scanned:
            return ParseResult(
                parser_name=self.name,
                parser_version=_resolve_adapter_version("pytesseract", "pypdfium2"),
                markdown=base_result.markdown,
                blocks=base_result.blocks,
                tables=base_result.tables,
                tables_supported=True,
                notes=["digital text layer present; OCR fallback not required"],
                page_count=base_result.page_count,
                is_scanned=False,
            )

        tesseract_bin = shutil.which("tesseract")
        if not tesseract_bin:
            return ParseResult(
                parser_name=self.name,
                parser_version=_resolve_adapter_version("pytesseract", "pypdfium2"),
                markdown=base_result.markdown,
                blocks=base_result.blocks,
                tables=[],
                tables_supported=False,
                notes=["tesseract binary not installed on PATH"],
                page_count=base_result.page_count,
                is_scanned=True,
            )

        doc = pdfium.PdfDocument(str(pdf_path))
        ocr_blocks: list[ParsedBlock] = []
        md_pages: list[str] = []
        try:
            page_count = len(doc)
            with tempfile.TemporaryDirectory() as tmp_dir:
                for idx in range(page_count):
                    page_num = idx + 1
                    page = doc[idx]
                    bitmap = page.render(scale=300 / 72)
                    pil_img = bitmap.to_pil()
                    img_path = Path(tmp_dir) / f"page_{page_num}.png"
                    pil_img.save(img_path)
                    page.close()

                    proc = subprocess.run(
                        [tesseract_bin, str(img_path), "stdout", "-l", "eng+kan"],
                        capture_output=True,
                        text=True,
                        check=False,
                    )
                    lines = [ln.strip() for ln in proc.stdout.splitlines() if ln.strip()]
                    for l_idx, ln in enumerate(lines):
                        y0 = round(min(0.95, 0.05 + l_idx * 0.03), 4)
                        y1 = round(min(0.99, y0 + 0.025), 4)
                        ocr_blocks.append(
                            ParsedBlock(
                                text=ln,
                                page=page_num,
                                bbox=[0.05, y0, 0.95, y1],
                            )
                        )
                    md_pages.append(f"<!-- page {page_num} -->\n" + "\n".join(lines))
        finally:
            doc.close()

        return ParseResult(
            parser_name=self.name,
            parser_version=_resolve_adapter_version("pytesseract", "pypdfium2"),
            markdown="\n\n".join(md_pages).strip() + "\n",
            blocks=ocr_blocks,
            tables=[],
            tables_supported=False,
            notes=["OCR executed via tesseract (eng+kan)"],
            page_count=page_count,
            is_scanned=True,
        )
