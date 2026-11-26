"""Falsifiable tests for Part 3: Building Parameters (`parameters.json`), range parser, comma-number fix, and 40-record page-image self-check."""

from __future__ import annotations

from bylaws.annotations import QUANTITY_SPAN_RE, _normalise_quantity
from bylaws.config import load_jurisdiction_config
from bylaws.parameters import parse_cell_value_and_unit, parse_numeric_interval
from bylaws.root import resolve_repo_root
from bylaws.schema_validator import validate_file

REPO_ROOT = resolve_repo_root()


def test_range_parser_and_comma_number_parsing() -> None:
    """Range parser accurately handles all table phrasing and comma-separated numbers like `'10,000 sq. mtrs'`."""
    assert parse_numeric_interval("Up to 360") == {
        "min": None,
        "max": 360.0,
        "min_inclusive": True,
        "max_inclusive": True,
    }
    assert parse_numeric_interval("Above 360 up to 1000") == {
        "min": 360.0,
        "max": 1000.0,
        "min_inclusive": False,
        "max_inclusive": True,
    }
    assert parse_numeric_interval("Above 18m < 24m") == {
        "min": 18.0,
        "max": 24.0,
        "min_inclusive": False,
        "max_inclusive": False,
    }
    assert parse_numeric_interval(">12, <=18") == {
        "min": 12.0,
        "max": 18.0,
        "min_inclusive": False,
        "max_inclusive": True,
    }
    assert parse_numeric_interval("Less than 9") == {
        "min": None,
        "max": 9.0,
        "min_inclusive": True,
        "max_inclusive": False,
    }
    assert parse_numeric_interval("Above 10,000 sq. mtrs up to 20,000 sq. mtrs") == {
        "min": 10000.0,
        "max": 20000.0,
        "min_inclusive": False,
        "max_inclusive": True,
    }

    # Verify QUANTITY_SPAN_RE + _normalise_quantity never misreads "10,000 sq. mtrs" as "0"
    m = QUANTITY_SPAN_RE.search("Plots measuring 10,000 sq. mtrs and above")
    assert m is not None
    assert m.group("num") == "10,000"
    assert _normalise_quantity(m.group("num"), m.group("unit")) == "10000 sq_m"

    val, unit, dep = parse_cell_value_and_unit("Up to 65%", "ground_coverage_max_pct", "Max")
    assert val == 65.0
    assert unit == "%"
    assert dep is False


def test_published_parameters_json_validates_and_matches_page_images() -> None:
    """`parameters.json` validates against `parameters.schema.json`, covers all 10 parameter kinds, matches PDF page-image values, and has a 40-record self-check in `qa.md`."""
    south_cfg = load_jurisdiction_config("in-ka-bengaluru-south")
    ver = str(south_cfg.release_version)
    south_dir = REPO_ROOT / "public" / "data" / "in-ka-bengaluru-south" / ver

    params_payload = validate_file(south_dir / "parameters.json", "parameters")
    records = params_payload["records"]
    assert len(records) >= 250

    kinds_present = {r["parameter"] for r in records}
    expected_kinds = {
        "ground_coverage_max_pct",
        "far_base_max",
        "far_premium_additional_max",
        "tdr_receivable_max",
        "setback_front_min_m",
        "setback_rear_min_m",
        "setback_side_min_m",
        "building_height_max_m",
        "floors_max",
        "parking_requirement",
    }
    assert expected_kinds.issubset(kinds_present)

    for rec in records:
        assert rec["derived"] is True
        assert rec["verification"] != "human_verified"
        assert rec["source"]["doc_id"] != "ka-model-bbl-2017"
        assert rec["unit"] not in {"Max", "Min"}

    # Confirm exact PDF page-image values from rmp2015-zr p. 28 (Table 10 Row 2: 360-1000 sq.m, 12-18 m road)
    r_main_cov = [
        r
        for r in records
        if r["parameter"] == "ground_coverage_max_pct"
        and r["source"]["doc_id"] == "rmp2015-zr"
        and r["source"]["eid"] in {
            "chp_4__cl_4.1__cl_4.1.3__tbl_10__row_2",
            "chp_4__cl_4.1__cl_4.1.3__tbl_1__row_2",
        }
    ]
    assert len(r_main_cov) == 1
    assert r_main_cov[0]["value"] == 65.0
    assert r_main_cov[0]["unit"] == "%"
    assert r_main_cov[0]["source"]["page"] == 28
    assert r_main_cov[0]["conditions"]["plot_area_m2"] == {
        "min": 360.0,
        "max": 1000.0,
        "min_inclusive": False,
        "max_inclusive": True,
    }

    r_main_far = [
        r
        for r in records
        if r["parameter"] == "far_base_max"
        and r["source"]["doc_id"] == "rmp2015-zr"
        and r["source"]["eid"] in {
            "chp_4__cl_4.1__cl_4.1.3__tbl_10__row_2",
            "chp_4__cl_4.1__cl_4.1.3__tbl_1__row_2",
        }
    ]
    assert len(r_main_far) == 1
    assert r_main_far[0]["value"] == 2.25
    assert r_main_far[0]["source"]["page"] == 28

    # Confirm January 2026 Table 8 Row 4 setbacks (Above 250 upto 4000 sq.m, p. 2): 12% depth front, 8% depth rear, 8% width sides
    jan2026_front = [
        r
        for r in records
        if r["parameter"] == "setback_front_min_m"
        and r["source"]["doc_id"] == "rmp2015-zr-amend-2026-01"
        and r["source"]["row_header"] == "Above 250 upto 4000"
    ]
    assert len(jan2026_front) == 1
    assert jan2026_front[0]["value"] == 12.0
    assert jan2026_front[0]["unit"] == "pct_of_plot_depth"
    assert jan2026_front[0]["source"]["page"] == 2

    # Confirm April 2025 Chapter 11 Table No.27 Premium FAR (>12, <=18 m road, p. 2): 0.3 Premium FAR + 0.1 TDR
    pfar_12_18 = [
        r
        for r in records
        if r["parameter"] == "far_premium_additional_max"
        and r["source"]["doc_id"] == "rmp2015-zr-amend-2025-04"
        and r["source"]["row_header"] == ">12, <=18"
    ]
    assert len(pfar_12_18) == 1
    assert pfar_12_18[0]["value"] == 0.3
    assert pfar_12_18[0]["unit"] == "multiple_of_base_far"
    assert pfar_12_18[0]["source"]["page"] == 2

    # Confirm parameter-mismatches.md and 40-record self-check in qa.md
    mm_path = REPO_ROOT / "data" / "reports" / "in-ka-bengaluru-south" / "parameter-mismatches.md"
    assert mm_path.is_file()
    assert "Table 10: FAR and Ground Coverage in Residential (Main)" in mm_path.read_text(
        encoding="utf-8"
    )

    qa_text = (REPO_ROOT / "data" / "reports" / "in-ka-bengaluru-south" / "qa.md").read_text(
        encoding="utf-8"
    )
    assert "Parameter Records 40-Item Page-Image Self-Check (Part 3)" in qa_text
    assert "| 40 |" in qa_text
