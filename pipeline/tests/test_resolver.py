"""Falsifiable tests for Part 4: `resolution.yaml`, `bylaws resolve` CLI, Jayanagar 600 m² / 15 m road worked target, and rebuilt relations."""

from __future__ import annotations

import copy
import json

from click.testing import CliRunner

from bylaws.cli import main
from bylaws.config import load_jurisdiction_config
from bylaws.resolver import (
    load_and_verify_resolution_config,
    lookup_plot_geography,
    resolve_plot_parameters,
)
from bylaws.root import resolve_repo_root
from bylaws.schema_validator import validate_file

REPO_ROOT = resolve_repo_root()


def test_resolution_yaml_validates_and_disables_step_if_quote_missing() -> None:
    """`jurisdictions/resolution.yaml` validates against `resolution.schema.json`, all 6 quotes match structured text, and a missing quote disables its step."""
    cfg = load_jurisdiction_config("in-ka-bengaluru-south")
    ver = str(cfg.release_version)
    south_dir = REPO_ROOT / "public" / "data" / "in-ka-bengaluru-south" / ver
    res_json = validate_file(south_dir / "resolution.json", "resolution")
    assert len(res_json["steps"]) == 6
    for step in res_json["steps"]:
        assert step["enabled"] is True
        assert step["verification"] == "machine_checked"

    # If a quote is absent from structured text, the step is automatically disabled with reason
    res_with_empty_trees = load_and_verify_resolution_config(cfg, clause_trees={})
    assert res_with_empty_trees["steps"][0]["enabled"] is False
    assert res_with_empty_trees["steps"][0]["disabled_reason"] is not None


def test_jayanagar_600m2_15m_road_residential_main_worked_target() -> None:
    """Worked target: 600 m² plot on a 15 m road in Residential (Main) of Jayanagar (`in-ka-bengaluru-south`) today matches PDF page-image values."""
    cfg = load_jurisdiction_config("in-ka-bengaluru-south")
    ver = str(cfg.release_version)
    south_dir = REPO_ROOT / "public" / "data" / "in-ka-bengaluru-south" / ver

    params_payload = json.loads((south_dir / "parameters.json").read_text(encoding="utf-8"))
    res_config = json.loads((south_dir / "resolution.json").read_text(encoding="utf-8"))
    cons_payload = json.loads((south_dir / "consolidated.json").read_text(encoding="utf-8"))
    boundary_fc = json.loads((south_dir / "boundary.geojson").read_text(encoding="utf-8"))
    wards_fc = json.loads((south_dir / "wards.geojson").read_text(encoding="utf-8"))
    pd_fc = json.loads((south_dir / "planning-districts.geojson").read_text(encoding="utf-8"))
    zones_fc = json.loads((south_dir / "zones.geojson").read_text(encoding="utf-8"))
    overlays_fc = json.loads((south_dir / "overlays.geojson").read_text(encoding="utf-8"))

    # Point inside Jayanagar East (Ward 11) R-MAIN polygon (rmp2015-pd-210-b:z0104)
    geo = lookup_plot_geography(
        lat=12.918125,
        lon=77.603191,
        explicit_corporation_id="in-ka-bengaluru-south",
        boundary_fc=boundary_fc,
        wards_fc=wards_fc,
        planning_districts_fc=pd_fc,
        zones_fc=zones_fc,
        overlays_fc=overlays_fc,
    )
    assert geo["corporation_id"] == "in-ka-bengaluru-south"
    assert geo["ward_id"] == "11"
    assert "Jayanagar" in str(geo["ward_name"])
    assert geo["zone_code"] == "R-MAIN"
    assert geo["zone_source"] == "polygon_lookup"

    result = resolve_plot_parameters(
        parameters_payload=params_payload,
        resolution_config=res_config,
        corporation_id="in-ka-bengaluru-south",
        zone_code=geo["zone_code"],
        plot_area_m2=600.0,
        road_width_m=15.0,
        plot_depth_m=30.0,
        plot_width_m=20.0,
        building_height_m=11.5,
        use="residential",
        as_of_date="2026-11-25",
        consolidated_payload=cons_payload,
        geography=geo,
    )
    assert result["derived"] is True
    params = result["parameters"]

    # 1. Ground coverage: 65% (390 m²) from rmp2015-zr p. 28 via Step 4 (bye-law 1.4)
    cov = params["ground_coverage_max_pct"]
    assert cov["status"] == "resolved"
    assert cov["value"] == 65.0
    assert cov["unit"] == "%"
    assert cov["computed_value"] == 390.0
    assert cov["governing_record"]["source"]["doc_id"] == "rmp2015-zr"
    assert cov["governing_record"]["source"]["page"] == 28
    assert cov["resolution_step"]["step_id"] == "zoning_governs_via_byelaw_1_4"
    assert len(cov["other_applicable_records"]) >= 1

    # 2. Base FAR: 2.25 (1350 m²) from rmp2015-zr p. 28 via Step 4 (bye-law 1.4)
    far = params["far_base_max"]
    assert far["status"] == "resolved"
    assert far["value"] == 2.25
    assert far["computed_value"] == 1350.0
    assert far["governing_record"]["source"]["doc_id"] == "rmp2015-zr"
    assert far["governing_record"]["source"]["page"] == 28
    assert far["resolution_step"]["step_id"] == "zoning_governs_via_byelaw_1_4"

    # 3. Setbacks from January 2026 Table 8 (p. 2): Front 12% of depth (3.6 m), Rear 8% of depth (2.4 m), Side 8% of width (1.6 m) via Step 5
    s_front = params["setback_front_min_m"]
    assert s_front["status"] == "resolved"
    assert s_front["value"] == 12.0
    assert s_front["unit"] == "pct_of_plot_depth"
    assert s_front["computed_value"] == 3.6
    assert s_front["governing_record"]["source"]["doc_id"] == "rmp2015-zr-amend-2026-01"
    assert s_front["governing_record"]["source"]["page"] == 2
    assert s_front["resolution_step"]["step_id"] == "lex_posterior_within_family"

    s_rear = params["setback_rear_min_m"]
    assert s_rear["value"] == 8.0
    assert s_rear["computed_value"] == 2.4
    assert s_rear["governing_record"]["source"]["doc_id"] == "rmp2015-zr-amend-2026-01"

    s_side = params["setback_side_min_m"]
    assert s_side["value"] == 8.0
    assert s_side["computed_value"] == 1.6
    assert s_side["governing_record"]["source"]["doc_id"] == "rmp2015-zr-amend-2026-01"

    # 4. Premium FAR (0.3 * 2.25 = +0.675 FAR) and TDR (0.1 * 2.25 = +0.225 FAR) from Apr 2025 Ch 11 Table No.27 (p. 2)
    pfar = params["far_premium_additional_max"]
    assert pfar["status"] == "resolved"
    assert pfar["value"] == 0.3
    assert pfar["computed_value"] == 0.675
    assert pfar["governing_record"]["source"]["doc_id"] == "rmp2015-zr-amend-2025-04"
    assert pfar["governing_record"]["source"]["page"] == 2

    tdr = params["tdr_receivable_max"]
    assert tdr["status"] == "resolved"
    assert tdr["value"] == 0.1
    assert tdr["computed_value"] == 0.225
    assert tdr["governing_record"]["source"]["doc_id"] == "rmp2015-zr-amend-2025-04"

    # 5. Parking from rmp2015-zr Table 23 (p. 49)
    park = params["parking_requirement"]
    assert park["status"] == "resolved"
    assert park["governing_record"]["source"]["doc_id"] == "rmp2015-zr"
    assert park["governing_record"]["source"]["page"] == 49

    # 6. South City Corporation 2026 changes present
    assert len(result["corporation_changes"]) >= 4
    assert any("South City Corporation" in str(c.get("change_note")) for c in result["corporation_changes"])

    # Also verify CLI `bylaws resolve` returns identical output
    runner = CliRunner()
    cli_res = runner.invoke(
        main,
        [
            "resolve",
            "--jurisdiction",
            "in-ka-bengaluru-south",
            "--lat",
            "12.918125",
            "--lon",
            "77.603191",
            "--plot-area",
            "600",
            "--road-width",
            "15",
            "--depth",
            "30",
            "--width",
            "20",
        ],
    )
    assert cli_res.exit_code == 0, cli_res.output
    cli_json = json.loads(cli_res.output)
    assert cli_json["parameters"]["ground_coverage_max_pct"]["value"] == 65.0
    assert cli_json["parameters"]["far_base_max"]["value"] == 2.25


def test_resolver_unknown_zone_outside_sheets_and_unresolved_ties() -> None:
    """Outside processed land-use sheets zone is 'unknown' unless user-selected; tied provisions return 'not_settled'."""
    cfg = load_jurisdiction_config("in-ka-bengaluru-south")
    ver = str(cfg.release_version)
    south_dir = REPO_ROOT / "public" / "data" / "in-ka-bengaluru-south" / ver
    params_payload = json.loads((south_dir / "parameters.json").read_text(encoding="utf-8"))
    res_config = json.loads((south_dir / "resolution.json").read_text(encoding="utf-8"))

    # Point outside processed sheets (e.g. northern Bengaluru)
    geo_unknown = lookup_plot_geography(
        lat=13.05,
        lon=77.59,
        explicit_corporation_id="in-ka-bengaluru-north",
        zones_fc={"type": "FeatureCollection", "features": []},
    )
    assert geo_unknown["zone_code"] == "unknown"
    assert geo_unknown["zone_label"] == "Zone data not yet available here"

    geo_selected = lookup_plot_geography(
        lat=13.05,
        lon=77.59,
        explicit_corporation_id="in-ka-bengaluru-north",
        explicit_zone_code="R-MAIN",
        zones_fc={"type": "FeatureCollection", "features": []},
    )
    assert geo_selected["zone_code"] == "R-MAIN"
    assert geo_selected["zone_source"] == "user_selected"

    # Plant two tied records in the same family and date with different values -> status == "not_settled"
    tied_params = copy.deepcopy(params_payload)
    base_rec = next(
        r
        for r in tied_params["records"]
        if r["parameter"] == "far_base_max" and r["source"]["doc_id"] == "rmp2015-zr" and r["value"] == 2.25
    )
    conflict_clone = copy.deepcopy(base_rec)
    conflict_clone["parameter_id"] = "planted:tie_1"
    conflict_clone["value"] = 2.40
    conflict_clone["value_text"] = "2.40"
    tied_params["records"].append(conflict_clone)

    res_tied = resolve_plot_parameters(
        parameters_payload=tied_params,
        resolution_config=res_config,
        corporation_id="in-ka-bengaluru-south",
        zone_code="R-MAIN",
        plot_area_m2=600.0,
        road_width_m=15.0,
    )
    assert res_tied["parameters"]["far_base_max"]["status"] == "not_settled"
    assert len(res_tied["parameters"]["far_base_max"]["tied_records"]) == 2
    assert "Not settled: two rules apply" in res_tied["parameters"]["far_base_max"]["display_value"]


def test_part4_relations_labelling_sheet_has_60_items() -> None:
    """`docs/review/relations-labelling.md` exists and contains 60 sampled items (10 per kind across the 6 legal kinds)."""
    sheet_path = REPO_ROOT / "docs" / "review" / "relations-labelling.md"
    assert sheet_path.is_file()
    text = sheet_path.read_text(encoding="utf-8")
    for kind in (
        "amends",
        "incorporates",
        "corporation_differs",
        "cross_document_reference",
        "definition_differs",
        "precedence",
    ):
        assert f"## Kind: `{kind}` (10 sampled" in text
    assert "| 60 |" in text
