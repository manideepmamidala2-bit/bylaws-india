"""Stage 9.1: Rasterize PDF map pages to high-resolution PNG images."""

from __future__ import annotations

from pathlib import Path


def rasterize_pdf_page(pdf_path: Path, page_number: int, dpi: int = 300) -> Path:
    """Placeholder interface for rendering a PDF map page to PNG (Milestone M5/M6)."""
    _ = (pdf_path, page_number, dpi)
    raise NotImplementedError("not implemented: geo.rasterize")
