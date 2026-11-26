"""Falsifiable tests for Part 4: `resolution.yaml`, `bylaws resolve` CLI, Jayanagar 600 m² / 15 m road worked target, and rebuilt relations."""

from __future__ import annotations

import copy
import json
from pathlib import Path

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


def test_part4_relations_labelling_sheet_has_60_items(tmp_path: Path) -> None:
    """`docs/review/relations-labelling.md` contains 60 unfilled items with provision page numbers, non-structural kinds are marked `not_yet_reviewed`, public relations carry `'Checked by rule, not yet by a person'`, and the >= 0.8 precision promotion rule works."""
    from bylaws.relations import (
        MIN_PUBLIC_PRECISION,
        STRUCTURALLY_CONFIRMED_KINDS,
        compute_labelled_precision_by_kind,
        is_relation_kind_public,
    )

    sheet_path = REPO_ROOT / "docs" / "review" / "relations-labelling.md"
    assert sheet_path.is_file()
    text = sheet_path.read_text(encoding="utf-8")
    assert "0.8" in text
    assert "| From (`doc:eid`) | From Page | To (`doc:eid`) | To Page |" in text
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
    # Sheet is unfilled (all 60 table rows have unfilled verdict checkboxes)
    assert text.count("| `[ ] Correct / [ ] FP` |") == 60
    unfilled_prec = compute_labelled_precision_by_kind(sheet_path)
    for k in ("cross_document_reference", "definition_differs", "precedence"):
        assert unfilled_prec.get(k) is None
        assert is_relation_kind_public(k, unfilled_prec.get(k)) is False
    for k in STRUCTURALLY_CONFIRMED_KINDS:
        assert is_relation_kind_public(k, unfilled_prec.get(k)) is True

    # Verify synthetic filled sheet: 8/10 (0.8) becomes public, 7/10 (0.7) stays hidden
    assert MIN_PUBLIC_PRECISION == 0.80
    synth_sheet = tmp_path / "relations-labelling.md"
    synth_lines = [
        "| # | Relation ID | Kind | From (`doc:eid`) | From Page | To (`doc:eid`) | To Page | Parameter / Subject | From Excerpt | To Excerpt | Owner Verdict |",
        "|---:|---|---|---|---:|---|---:|---|---|---|---|",
    ]
    for i in range(1, 11):
        verdict = "[x] Correct / [ ] FP" if i <= 8 else "[ ] Correct / [x] FP"
        synth_lines.append(
            f"| {i} | `rel_{i}` | `definition_differs` | `bbl-2003:1` | p. 2 | `rmp2015-zr:1` | p. 3 | `term` | a | b | `{verdict}` |"
        )
    for i in range(11, 21):
        verdict = "[x] Correct / [ ] FP" if i <= 17 else "[ ] Correct / [x] FP"
        synth_lines.append(
            f"| {i} | `rel_{i}` | `precedence` | `gbga-2024:1` | p. 245 | `bbl-2003:1` | p. 1 | `prec` | a | b | `{verdict}` |"
        )
    synth_sheet.write_text("\n".join(synth_lines), encoding="utf-8")
    synth_prec = compute_labelled_precision_by_kind(synth_sheet)
    assert synth_prec["definition_differs"] == 0.8
    assert is_relation_kind_public("definition_differs", synth_prec["definition_differs"]) is True
    assert synth_prec["precedence"] == 0.7
    assert is_relation_kind_public("precedence", synth_prec["precedence"]) is False

    # Verify published relations.json
    cfg = load_jurisdiction_config("in-ka-bengaluru-south")
    rel_json = validate_file(
        REPO_ROOT / "public" / "data" / "in-ka-bengaluru-south" / str(cfg.release_version) / "relations.json",
        "relations",
    )
    assert "0.8" in str(rel_json.get("public_visibility_rule") or "")
    for rel_item in rel_json["relations"]:
        assert rel_item.get("from_page") >= 1
        assert rel_item.get("to_page") >= 1
        if rel_item["kind"] in STRUCTURALLY_CONFIRMED_KINDS:
            assert rel_item["public_visible"] is True
            assert rel_item["status"] == "confirmed"
            assert rel_item["review_note"] == "Checked by rule, not yet by a person"
        else:
            assert rel_item["public_visible"] is False
            assert rel_item["status"] == "not_yet_reviewed"
            assert rel_item["review_note"] == "Not yet reviewed"


def test_part5_resolver_honesty_across_four_review_plots() -> None:
    """Trust and Accuracy Part 5: Resolver returns `needs depth`/`needs width`/`needs height` instead of assuming 3:2 plot or 11.5 m building, and distinguishes `'No limit in the law for this case'` (with citation) from `'Not covered by our data yet'` across the four review plots."""
    cfg = load_jurisdiction_config("in-ka-bengaluru-south")
    ver = str(cfg.release_version)
    south_dir = REPO_ROOT / "public" / "data" / "in-ka-bengaluru-south" / ver
    params_payload = json.loads((south_dir / "parameters.json").read_text(encoding="utf-8"))
    res_config = json.loads((south_dir / "resolution.json").read_text(encoding="utf-8"))

    # Review Plot 1: 600 m² on a 15 m road in Residential (Main) (`R-MAIN`)
    p1_no_dims = resolve_plot_parameters(
        parameters_payload=params_payload,
        resolution_config=res_config,
        corporation_id="in-ka-bengaluru-south",
        zone_code="R-MAIN",
        plot_area_m2=600.0,
        road_width_m=15.0,
        use="residential",
    )
    assert p1_no_dims["inputs"]["plot_depth_m"] is None
    assert p1_no_dims["inputs"]["plot_width_m"] is None
    assert p1_no_dims["inputs"]["building_height_m"] is None
    assert p1_no_dims["parameters"]["setback_front_min_m"]["status"] == "needs_depth"
    assert "needs depth" in p1_no_dims["parameters"]["setback_front_min_m"]["display_value"]
    assert p1_no_dims["parameters"]["setback_rear_min_m"]["status"] == "needs_depth"
    assert "needs depth" in p1_no_dims["parameters"]["setback_rear_min_m"]["display_value"]
    assert p1_no_dims["parameters"]["setback_side_min_m"]["status"] == "needs_width"
    assert "needs width" in p1_no_dims["parameters"]["setback_side_min_m"]["display_value"]
    assert p1_no_dims["parameters"]["building_height_max_m"]["status"] == "no_limit_in_law"
    assert p1_no_dims["parameters"]["building_height_max_m"]["display_value"] == "No limit in the law for this case"
    assert p1_no_dims["parameters"]["building_height_max_m"]["no_limit_authority"]["doc_id"] == "rmp2015-zr-amend-2026-01"
    assert p1_no_dims["parameters"]["building_height_max_m"]["no_limit_authority"]["page"] == 5
    assert p1_no_dims["parameters"]["floors_max"]["status"] == "no_limit_in_law"

    # With height=10.0 m provided but depth/width still omitted -> returns exact "needs depth" / "needs width"
    p1_with_height = resolve_plot_parameters(
        parameters_payload=params_payload,
        resolution_config=res_config,
        corporation_id="in-ka-bengaluru-south",
        zone_code="R-MAIN",
        plot_area_m2=600.0,
        road_width_m=15.0,
        building_height_m=10.0,
        use="residential",
    )
    assert p1_with_height["parameters"]["setback_front_min_m"]["display_value"] == "needs depth"
    assert p1_with_height["parameters"]["setback_rear_min_m"]["display_value"] == "needs depth"
    assert p1_with_height["parameters"]["setback_side_min_m"]["display_value"] == "needs width"

    # Review Plot 2: 150 m² on a 9 m road in Residential (Main) (`R-MAIN`)
    p2_no_dims = resolve_plot_parameters(
        parameters_payload=params_payload,
        resolution_config=res_config,
        corporation_id="in-ka-bengaluru-south",
        zone_code="R-MAIN",
        plot_area_m2=150.0,
        road_width_m=9.0,
        use="residential",
    )
    assert p2_no_dims["parameters"]["ground_coverage_max_pct"]["value"] == 75.0
    assert p2_no_dims["parameters"]["far_base_max"]["value"] == 1.75
    assert p2_no_dims["parameters"]["far_premium_additional_max"]["status"] == "no_limit_in_law"
    assert p2_no_dims["parameters"]["far_premium_additional_max"]["display_value"] == "No limit in the law for this case"
    assert p2_no_dims["parameters"]["far_premium_additional_max"]["no_limit_authority"]["doc_id"] == "rmp2015-zr-amend-2025-04"
    assert p2_no_dims["parameters"]["tdr_receivable_max"]["status"] == "no_limit_in_law"
    assert p2_no_dims["parameters"]["building_height_max_m"]["status"] == "resolved"
    assert p2_no_dims["parameters"]["building_height_max_m"]["value"] == 12.0
    assert p2_no_dims["parameters"]["floors_max"]["status"] == "no_limit_in_law"
    assert p2_no_dims["parameters"]["setback_front_min_m"]["status"] == "needs_height"
    assert p2_no_dims["parameters"]["setback_front_min_m"]["display_value"] == "needs height"

    p2_with_height = resolve_plot_parameters(
        parameters_payload=params_payload,
        resolution_config=res_config,
        corporation_id="in-ka-bengaluru-south",
        zone_code="R-MAIN",
        plot_area_m2=150.0,
        road_width_m=9.0,
        building_height_m=10.0,
        use="residential",
    )
    assert p2_with_height["parameters"]["setback_front_min_m"]["value"] == 0.9
    assert p2_with_height["parameters"]["setback_rear_min_m"]["value"] == 0.7
    assert p2_with_height["parameters"]["setback_side_min_m"]["value"] == 0.7

    # Review Plot 3: 3,000 m² commercial (`C-BIZ`) on a 24 m road
    p3_no_dims = resolve_plot_parameters(
        parameters_payload=params_payload,
        resolution_config=res_config,
        corporation_id="in-ka-bengaluru-south",
        zone_code="C-BIZ",
        plot_area_m2=3000.0,
        road_width_m=24.0,
        use="commercial",
    )
    assert p3_no_dims["parameters"]["ground_coverage_max_pct"]["value"] == 45.0
    assert p3_no_dims["parameters"]["far_base_max"]["value"] == 2.5
    assert p3_no_dims["parameters"]["far_premium_additional_max"]["value"] == 0.4
    assert p3_no_dims["parameters"]["tdr_receivable_max"]["value"] == 0.2
    assert p3_no_dims["parameters"]["setback_front_min_m"]["status"] == "needs_depth"
    assert "needs depth" in p3_no_dims["parameters"]["setback_front_min_m"]["display_value"]
    assert p3_no_dims["parameters"]["building_height_max_m"]["status"] == "no_limit_in_law"
    assert p3_no_dims["parameters"]["building_height_max_m"]["no_limit_authority"]["doc_id"] == "rmp2015-zr"
    assert p3_no_dims["parameters"]["building_height_max_m"]["no_limit_authority"]["page"] == 32
    assert p3_no_dims["parameters"]["floors_max"]["status"] == "no_limit_in_law"

    # Review Plot 4: 6,000 m² industrial (`I-GEN`) on an 18 m road
    p4 = resolve_plot_parameters(
        parameters_payload=params_payload,
        resolution_config=res_config,
        corporation_id="in-ka-bengaluru-south",
        zone_code="I-GEN",
        plot_area_m2=6000.0,
        road_width_m=18.0,
        use="industrial",
    )
    assert p4["parameters"]["ground_coverage_max_pct"]["value"] == 45.0
    assert p4["parameters"]["far_base_max"]["value"] == 1.0
    assert p4["parameters"]["setback_front_min_m"]["value"] == 10.0
    assert p4["parameters"]["setback_rear_min_m"]["value"] == 8.0
    assert p4["parameters"]["setback_side_min_m"]["value"] == 8.0
    assert p4["parameters"]["building_height_max_m"]["status"] == "no_limit_in_law"
    assert p4["parameters"]["building_height_max_m"]["no_limit_authority"]["doc_id"] == "rmp2015-zr-amend-2026-01"
    assert p4["parameters"]["building_height_max_m"]["no_limit_authority"]["page"] == 6
    assert p4["parameters"]["floors_max"]["status"] == "no_limit_in_law"

    # Unknown zone -> returns "not_covered_by_data" ("Not covered by our data yet")
    p_unknown = resolve_plot_parameters(
        parameters_payload=params_payload,
        resolution_config=res_config,
        corporation_id="in-ka-bengaluru-south",
        zone_code="unknown",
        plot_area_m2=600.0,
        road_width_m=15.0,
        use="residential",
    )
    assert p_unknown["parameters"]["ground_coverage_max_pct"]["status"] == "not_covered_by_data"
    assert p_unknown["parameters"]["ground_coverage_max_pct"]["display_value"] == "Not covered by our data yet"
    assert p_unknown["parameters"]["far_base_max"]["status"] == "not_covered_by_data"
    assert p_unknown["parameters"]["far_base_max"]["display_value"] == "Not covered by our data yet"
