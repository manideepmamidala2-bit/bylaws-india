"""Falsifiable tests for Part 3: Building Parameters (`parameters.json`), range parser, comma-number fix, and 40-record page-image self-check."""

from __future__ import annotations

from bylaws.annotations import QUANTITY_SPAN_RE, _normalise_quantity
from bylaws.config import load_jurisdiction_config
from bylaws.parameters import (
    PLAUSIBILITY_BOUNDS,
    check_band_continuity,
    check_parameter_overlaps,
    check_parameter_plausibility,
    classify_non_envelope_row,
    parse_cell_value_and_unit,
    parse_numeric_interval,
)
from bylaws.root import resolve_repo_root
from bylaws.schema_validator import validate_file

REPO_ROOT = resolve_repo_root()


def test_range_parser_and_comma_number_parsing() -> None:
    """Range parser accurately handles all table phrasing, hectare conversion (`1 ha = 10,000 m²`), and comma-separated numbers like `'10,000 sq. mtrs'`."""
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
    # Hectare conversion: 0.40 Hectares -> 4000.0 m², 0.80 Hectares -> 8000.0 m²
    assert parse_numeric_interval("Upto 0.40 Hectares") == {
        "min": None,
        "max": 4000.0,
        "min_inclusive": True,
        "max_inclusive": True,
    }
    assert parse_numeric_interval("Between 0.40 & 0.80 Hectares") == {
        "min": 4000.0,
        "max": 8000.0,
        "min_inclusive": False,
        "max_inclusive": True,
    }
    assert parse_numeric_interval("Above 0.80 Hectares") == {
        "min": 8000.0,
        "max": None,
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

    # Parking: pure floor-area ratio vs. sentence rule
    p_val, p_unit, p_dep = parse_cell_value_and_unit("50 sq. mtr. of floor area", "parking_requirement")
    assert p_val == 50.0
    assert p_unit == "m2_per_car_space"
    assert p_dep is False

    s_val, s_unit, s_dep = parse_cell_value_and_unit(
        "a) Dwelling Unit measuring 100 to 150 Sq.Mtrs b) 100 Sq.Mtrs and Part thereof beyond 150 Sq.Mtrs",
        "parking_requirement",
    )
    assert isinstance(s_val, str)
    assert s_unit == "rule_text"
    assert s_dep is True


def test_plausibility_bounds_and_non_far_reclassification() -> None:
    """Plausibility bounds reject out-of-range values and non-FAR rows (deviations, compounding fees, premium FAR prices) are excluded."""
    assert PLAUSIBILITY_BOUNDS["far_base_max"] == (0.25, 5.0)
    assert check_parameter_plausibility("far_base_max", 2.25, "ratio") == (True, None)
    assert check_parameter_plausibility("far_base_max", 15.0, "ratio")[0] is False
    assert check_parameter_plausibility("far_base_max", 50.0, "ratio")[0] is False
    assert check_parameter_plausibility("far_base_max", 10000.0, "ratio")[0] is False
    assert check_parameter_plausibility(
        "far_base_max",
        2.0,
        "ratio",
        {"plot_area_m2": {"min": None, "max": 0.4, "min_inclusive": True, "max_inclusive": True}},
    )[0] is False

    assert (
        classify_non_envelope_row(
            table_eid="cl_4__tbl_2B",
            table_heading="Table 2B",
            column_header="Maximum Deviation allowed in FAR",
            row_header="1. | All buildings of height below 15 m",
            cell_text="15 %",
        )
        == "deviation_tolerance"
    )
    assert (
        classify_non_envelope_row(
            table_eid="cl_4__tbl_2C",
            table_heading="Table 2C",
            column_header="Rate of Compounding fee for Condoning Deviation of FAR",
            row_header="1 | Residential",
            cell_text="3%",
        )
        == "compounding_fee_rate"
    )
    assert (
        classify_non_envelope_row(
            table_eid="chp_11_2__cl_11__tbl_1",
            table_heading="Table 1",
            column_header="Value of the Notional Land for additional 10000 sq.m to be constructed using Premium FAR = 4000 x GV of Developed Land",
            row_header="Premium F.A.R charges = 50% of GV of the Notional Land",
            cell_text="Premium F.A.R charges = 50% of GV of the Notional Land (4000 sq.m)",
        )
        == "premium_far_price_schedule"
    )


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
        ok, err = check_parameter_plausibility(
            rec["parameter"],
            rec["value"],
            rec["unit"],
            rec["conditions"],
        )
        assert ok is True, f"{rec['parameter_id']} failed plausibility check: {err}"
        assert rec["source"]["table_eid"] not in {
            "cl_4__tbl_2B",
            "cl_4__tbl_2C",
            "chp_11_2__cl_11__tbl_1",
            "chp_11_2__item_ii__tbl_1",
        }

    # Confirm Hectare-to-m² conversion in bbl-2003 Table 9 (Group Housing)
    tbl9_recs = [
        r
        for r in records
        if r["source"]["doc_id"] == "bbl-2003"
        and r["source"]["table_eid"] == "part_III__sec_12.0__cl_12.2__tbl_9"
        and r["parameter"] == "far_base_max"
    ]
    assert len(tbl9_recs) == 3
    assert tbl9_recs[0]["conditions"]["plot_area_m2"]["max"] == 4000.0
    assert tbl9_recs[1]["conditions"]["plot_area_m2"] == {
        "min": 4000.0,
        "max": 8000.0,
        "min_inclusive": False,
        "max_inclusive": True,
    }
    assert tbl9_recs[2]["conditions"]["plot_area_m2"]["min"] == 8000.0

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


def test_part1_table_and_provision_supersession_dedup_and_band_continuity() -> None:
    """Part 1: Industrial (General) setbacks/FAR supersession, Traffic & Transportation FAR deduplication, 3.1(ii)-(iii) consolidated wording, and 11.5m-12m band continuity check."""
    import copy
    import json

    city_cfg = load_jurisdiction_config("in-ka-bengaluru")
    ver = str(city_cfg.release_version)
    city_dir = REPO_ROOT / "public" / "data" / "in-ka-bengaluru" / ver
    params_payload = validate_file(city_dir / "parameters.json", "parameters")
    records = params_payload["records"]
    doc_layers = {d.id: str(d.layer) for d in city_cfg.documents}

    # 1. Industrial (General) setbacks up to 500 m²:
    #    - Only the Jan 2026 notification (12% depth front, 8% depth rear, 8% width side, p. 6) is in_force
    #    - The 2007 rmp2015-zr 4.5 m rule (p. 35) is superseded with "Replaced by ..."
    igen_500_front_in_force = [
        r
        for r in records
        if r["parameter"] == "setback_front_min_m"
        and r["legal_status"] == "in_force"
        and not r.get("valid_to")
        and r["conditions"].get("zone") == ["I-GEN"]
        and (r["conditions"].get("plot_area_m2") or {}).get("max") == 500.0
    ]
    assert len(igen_500_front_in_force) == 1
    assert igen_500_front_in_force[0]["source"]["doc_id"] == "rmp2015-zr-amend-2026-01"
    assert igen_500_front_in_force[0]["source"]["page"] == 6
    assert igen_500_front_in_force[0]["value"] == 12.0
    assert igen_500_front_in_force[0]["unit"] == "pct_of_plot_depth"

    igen_500_front_superseded = [
        r
        for r in records
        if r["parameter"] == "setback_front_min_m"
        and r["legal_status"] == "superseded"
        and r["conditions"].get("zone") == ["I-GEN"]
        and (r["conditions"].get("plot_area_m2") or {}).get("max") == 500.0
    ]
    assert len(igen_500_front_superseded) == 1
    assert igen_500_front_superseded[0]["source"]["doc_id"] == "rmp2015-zr"
    assert igen_500_front_superseded[0]["value"] == 4.5
    assert str(igen_500_front_superseded[0].get("note") or "").startswith("Replaced by ")

    # 2. Industrial (General) FAR: shown once per plot-area band under governing rules, citing Jan 2026 (p. 6) with 2007 source in note
    igen_far_in_force = [
        r
        for r in records
        if r["parameter"] == "far_base_max"
        and r["legal_status"] == "in_force"
        and not r.get("valid_to")
        and r["conditions"].get("zone") == ["I-GEN"]
    ]
    assert len(igen_far_in_force) == 4
    assert [r["value"] for r in igen_far_in_force] == [1.5, 1.25, 1.0, 1.0]
    for r in igen_far_in_force:
        assert r["source"]["doc_id"] == "rmp2015-zr-amend-2026-01"
        assert r["source"]["page"] == 6
        assert "Earlier source with identical value" in str(r.get("note") or "")
        assert "p. 35" in str(r.get("note") or "")

    # 3. Traffic and Transportation FAR: shown once per plot-area band under governing rules, citing March 2009 (p. 3) with 2007 source in note
    ttrans_far_in_force = [
        r
        for r in records
        if r["parameter"] == "far_base_max"
        and r["legal_status"] == "in_force"
        and not r.get("valid_to")
        and r["conditions"].get("zone") == ["T-TRANS"]
    ]
    assert len(ttrans_far_in_force) == 4
    assert [r["value"] for r in ttrans_far_in_force] == [1.0, 1.25, 1.5, 1.5]
    for r in ttrans_far_in_force:
        assert r["source"]["doc_id"] == "rmp2015-zr-amend-2009-03"
        assert r["source"]["page"] == 3
        assert "Earlier source with identical value" in str(r.get("note") or "")
        assert "p. 38" in str(r.get("note") or "")

    # 4. Setbacks clauses 3.1(ii) and 3.1(iii) in rmp2015-zr have consolidated 2026 wording in versions[-1] citing rmp2015-zr-amend-2026-01 p. 2
    zr_tree = json.loads((city_dir / "rmp2015-zr.clauses.json").read_text(encoding="utf-8"))
    by_eid = {c["eid"]: c for c in zr_tree["clauses"]}
    cl_31_ii = by_eid["chp_3__cl_3.1__item_ii"]
    cl_31_iii = by_eid["chp_3__cl_3.1__item_iii"]

    assert len(cl_31_ii["versions"]) == 2
    assert "total height up to 12.0m" in cl_31_ii["versions"][-1]["content"]
    assert cl_31_ii["versions"][-1]["source_doc"] == "rmp2015-zr-amend-2026-01"
    assert cl_31_ii["versions"][-1]["citations"][0]["page"] == 2
    assert "Up to 11.5 m height" in cl_31_ii["versions"][0]["content"]

    assert len(cl_31_iii["versions"]) == 2
    assert "more than 12.0 m in total height" in cl_31_iii["versions"][-1]["content"]
    assert cl_31_iii["versions"][-1]["source_doc"] == "rmp2015-zr-amend-2026-01"
    assert cl_31_iii["versions"][-1]["citations"][0]["page"] == 2
    assert "more than 11.5 m in height" in cl_31_iii["versions"][0]["content"]

    # 5. Applicability rules (Part 4): 3.1(ii) and 3.1(iii) settle the 11.5 m to 12 m setback height band,
    #    so `not_settled_overlaps` is empty when applicability_rules are present, whereas a constructed overlap
    #    with no applicability rule (`applicability_rules=[]`) is still reported as `not_settled`.
    app_rules = params_payload.get("applicability_rules") or []
    assert len(app_rules) == 1
    assert app_rules[0]["rule_id"] == "setback-height-table8-vs-table9"
    assert app_rules[0]["plain_explanation"] == (
        "Buildings up to 12 m use Table 8; taller buildings use Table 9 (clauses 3.1(ii) and (iii), January 2026)."
    )
    assert len(app_rules[0]["authorities"]) == 2
    assert app_rules[0]["authorities"][0]["clause_number"] == "3.1(ii)"
    assert app_rules[0]["authorities"][0]["page"] == 2
    assert app_rules[0]["authorities"][1]["clause_number"] == "3.1(iii)"
    assert app_rules[0]["authorities"][1]["page"] == 2

    ov_settled = check_parameter_overlaps(records, doc_layers, applicability_rules=app_rules)
    assert len(ov_settled["unexplained_overlaps"]) == 0
    assert len(ov_settled["not_settled_overlaps"]) == 0
    assert len(ov_settled["settled_by_applicability"]) >= 1

    bands_settled = check_band_continuity(records, doc_layers, applicability_rules=app_rules)
    assert not any(
        b["kind"] == "overlap" and b["subject"] == "setbacks"
        for b in bands_settled
    )

    # Constructed overlap with NO applicability clause is still flagged as "not settled"
    ov_unsettled = check_parameter_overlaps(records, doc_layers, applicability_rules=[])
    assert len(ov_unsettled["not_settled_overlaps"]) >= 1
    assert any("11.5 m and 12 m" in item["reason"] for item in ov_unsettled["not_settled_overlaps"])

    bands_unsettled = check_band_continuity(records, doc_layers, applicability_rules=[])
    assert any(
        b["kind"] == "overlap"
        and b["subject"] == "setbacks"
        and b["range"] == "11.5 m to 12 m"
        and "The current tables overlap between 11.5 m and 12 m." in b["summary"]
        for b in bands_unsettled
    )

    # Falsifiability check: planting an unexplained conflicting in_force record must fail check_parameter_overlaps
    planted = copy.deepcopy(records)
    clone = copy.deepcopy(ttrans_far_in_force[0])
    clone["parameter_id"] = "planted:conflict"
    clone["value"] = 2.75
    planted.append(clone)
    ov_bad = check_parameter_overlaps(planted, doc_layers)
    assert len(ov_bad["unexplained_overlaps"]) == 1
