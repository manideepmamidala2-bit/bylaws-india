"""Unit tests for general PDF layout parsing and document structuring (Plan v2.0 §5.A1 / §5.B5, Rule R7/R11)."""

from __future__ import annotations

from datetime import UTC, datetime
from pathlib import Path

from fpdf import FPDF

from bylaws.config import load_jurisdiction_config
from bylaws.parsers.pypdfium2_adapter import Pypdfium2Adapter
from bylaws.root import resolve_repo_root
from bylaws.structure import build_clause_tree_from_parse_result

REPO_ROOT = resolve_repo_root()


def test_two_column_pdf_reading_order_not_glued_horizontally(tmp_path: Path) -> None:
    """Two-column pages are ordered left-column top-to-bottom then right-column top-to-bottom."""
    pdf = FPDF(orientation="P", unit="mm", format="A4")
    pdf.set_creation_date(datetime(2026, 1, 1, 0, 0, 0, tzinfo=UTC))
    pdf.add_page()
    pdf.set_font("Helvetica", "", 10)

    # Emit row-interleaved across columns (as PDF layout engines do)
    pdf.set_xy(15, 30)
    pdf.cell(80, 6, "1.1 Left Column First Clause: Minimum plot size.")
    pdf.set_xy(115, 30)
    pdf.cell(80, 6, "2.1 Right Column First Clause: Parking norms.")
    pdf.set_xy(15, 42)
    pdf.cell(80, 6, "1.2 Left Column Second Clause: Ground coverage.")
    pdf.set_xy(115, 42)
    pdf.cell(80, 6, "2.2 Right Column Second Clause: Fire setbacks.")

    pdf_path = tmp_path / "two-col.pdf"
    pdf.output(str(pdf_path))

    adapter = Pypdfium2Adapter()
    result = adapter.parse(pdf_path)
    texts = [b.text for b in result.blocks]

    assert any("1.1 Left Column First Clause" in t and "2.1 Right Column" not in t for t in texts)
    idx_11 = next(i for i, t in enumerate(texts) if "1.1 Left Column" in t)
    idx_12 = next(i for i, t in enumerate(texts) if "1.2 Left Column" in t)
    idx_21 = next(i for i, t in enumerate(texts) if "2.1 Right Column" in t)
    idx_22 = next(i for i, t in enumerate(texts) if "2.2 Right Column" in t)
    assert idx_11 < idx_12 < idx_21 < idx_22


def test_measurements_and_years_never_create_false_clauses(tmp_path: Path) -> None:
    """Mid-sentence measurements ('3.5 m') and years ('2020') at line start do not create false clauses (A-019)."""
    pdf = FPDF(orientation="P", unit="mm", format="A4")
    pdf.set_creation_date(datetime(2026, 1, 1, 0, 0, 0, tzinfo=UTC))
    pdf.add_page()
    pdf.set_font("Helvetica", "B", 12)
    pdf.cell(0, 8, "CHAPTER III", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 11)
    pdf.cell(0, 6, "3.1 Setback Rules: Every residential building shall maintain:", new_x="LMARGIN", new_y="NEXT")
    pdf.cell(0, 6, "3.5 m front setback from the street boundary line.", new_x="LMARGIN", new_y="NEXT")
    pdf.cell(0, 6, "2020 amendments shall apply to all corner plots.", new_x="LMARGIN", new_y="NEXT")
    pdf.cell(0, 6, "(a) Front setback shall be clear of projections.", new_x="LMARGIN", new_y="NEXT")
    pdf.cell(0, 6, "(i) Sunshades up to 0.75 m are permitted.", new_x="LMARGIN", new_y="NEXT")
    pdf.cell(0, 6, "(b) Rear setback shall be at least 1.5 m.", new_x="LMARGIN", new_y="NEXT")

    pdf_path = tmp_path / "measurements.pdf"
    pdf.output(str(pdf_path))

    config = load_jurisdiction_config("xx-test-fixture")
    doc_cfg = config.documents[0]
    parsed = Pypdfium2Adapter().parse(pdf_path)
    tree = build_clause_tree_from_parse_result(doc_cfg, config, parsed)

    clause_numbers = [c["number"] for c in tree["clauses"]]
    assert "3.5" not in clause_numbers, f"Measurement '3.5 m' falsely parsed as clause: {clause_numbers}"
    assert "2020" not in clause_numbers, f"Year '2020' falsely parsed as clause: {clause_numbers}"
    assert "CHAPTER III" in clause_numbers
    assert "3.1" in clause_numbers
    assert "3.1(a)" in clause_numbers
    assert "3.1(a)(i)" in clause_numbers
    assert "3.1(b)" in clause_numbers

    c_31 = next(c for c in tree["clauses"] if c["number"] == "3.1")
    assert "3.5 m front setback" in c_31["text"]
    assert "2020 amendments shall apply" in c_31["text"]
    assert c_31["parent_id"] == f"{doc_cfg.id}:CHAPTER III"

    c_31a = next(c for c in tree["clauses"] if c["number"] == "3.1(a)")
    assert c_31a["parent_id"] == f"{doc_cfg.id}:3.1"
    c_31ai = next(c for c in tree["clauses"] if c["number"] == "3.1(a)(i)")
    assert c_31ai["parent_id"] == f"{doc_cfg.id}:3.1(a)"


def test_tables_extracted_to_tables_array_and_removed_from_prose() -> None:
    """`Table 2.1` in `fixture-base.pdf` is extracted into `tables[]` and removed from clause `text` (A-019)."""
    config = load_jurisdiction_config("xx-test-fixture")
    doc_cfg = config.documents[0]
    pdf_path = REPO_ROOT / "pipeline" / "tests" / "fixtures" / "fixture-base.pdf"

    parsed = Pypdfium2Adapter().parse(pdf_path)
    assert parsed.tables_supported is True
    assert len(parsed.tables) >= 1

    tree = build_clause_tree_from_parse_result(doc_cfg, config, parsed)
    c_21 = next(c for c in tree["clauses"] if c["number"] == "2.1")
    assert len(c_21["tables"]) == 1
    tbl = c_21["tables"][0]
    assert tbl["caption"] == "Table 2.1: Minimum Setbacks by Plot Size"
    assert tbl["headers"] == ["Zone Code", "Plot Area (sq.m)", "Front Setback (m)", "Max FAR"]
    assert tbl["rows"] == [
        ["Z1", "Up to 240", "1.5", "1.75"],
        ["Z1", "Above 240", "3.0", "2.25"],
        ["Z2", "All plots", "3.0", "2.50"],
    ]
    assert "Up to 240" not in c_21["text"]
