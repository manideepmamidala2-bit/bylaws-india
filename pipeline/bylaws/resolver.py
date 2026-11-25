"""Deterministic 6-step statutory building code resolver (`bylaws resolve`, Part 4)."""

from __future__ import annotations

import copy
import json
from pathlib import Path
from typing import Any

import yaml
from shapely.geometry import Point, shape

from bylaws.config import JurisdictionConfig
from bylaws.root import resolve_repo_root
from bylaws.schema_validator import validate_payload

PARAMETER_ORDER: tuple[str, ...] = (
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
)


def interval_matches(interval: dict[str, Any] | None, value: float | None) -> bool:
    """Return True if `value` falls within `interval` (`NumericInterval`), or if either is None."""
    if interval is None or value is None:
        return True
    lo = interval.get("min")
    hi = interval.get("max")
    lo_inc = bool(interval.get("min_inclusive", True))
    hi_inc = bool(interval.get("max_inclusive", True))
    if lo is not None:
        lo_f = float(lo)
        if lo_inc and value < lo_f:
            return False
        if not lo_inc and value <= lo_f:
            return False
    if hi is not None:
        hi_f = float(hi)
        if hi_inc and value > hi_f:
            return False
        if not hi_inc and value >= hi_f:
            return False
    return True


def load_and_verify_resolution_config(
    config: JurisdictionConfig,
    *,
    clause_trees: dict[str, dict[str, Any]] | None = None,
    repo_root: Path | None = None,
) -> dict[str, Any]:
    """Load `jurisdictions/resolution.yaml` and verify each step's quoted authority against structured text."""
    root = repo_root or resolve_repo_root()
    res_path = root / "jurisdictions" / "resolution.yaml"
    if not res_path.is_file():
        raise FileNotFoundError(f"Resolution rules file not found: {res_path}")
    raw: dict[str, Any] = yaml.safe_load(res_path.read_text(encoding="utf-8"))
    raw["jurisdiction"] = config.id

    if clause_trees is not None:
        for step in raw.get("steps") or []:
            auth = step.get("authority") or {}
            doc_id = auth.get("doc_id")
            eid = auth.get("eid")
            quote = auth.get("quote")
            if not doc_id or not quote:
                continue
            tree = clause_trees.get(str(doc_id))
            if tree is None:
                step["enabled"] = False
                step["disabled_reason"] = f"Authority document '{doc_id}' not found in structured corpus."
                continue
            matched_node = next(
                (
                    c
                    for c in tree.get("clauses", [])
                    if c.get("eid") == eid or c.get("number") == eid
                ),
                None,
            )
            full_doc_text = json.dumps( matched_node if matched_node else tree )
            if str(quote) not in full_doc_text:
                step["enabled"] = False
                step["disabled_reason"] = (
                    f"Quoted authority from {doc_id}:{eid} not found verbatim in structured text."
                )

    validate_payload(raw, "resolution", source=str(res_path))
    return raw


def write_published_resolution_json(
    config: JurisdictionConfig,
    *,
    clause_trees: dict[str, dict[str, Any]],
    repo_root: Path | None = None,
) -> dict[str, Any]:
    """Verify `resolution.yaml` quotes and write `data/processed/<id>/resolution.json`."""
    root = repo_root or resolve_repo_root()
    processed_dir = root / "data" / "processed" / config.id
    processed_dir.mkdir(parents=True, exist_ok=True)
    res_payload = load_and_verify_resolution_config(
        config,
        clause_trees=clause_trees,
        repo_root=root,
    )
    out_path = processed_dir / "resolution.json"
    out_path.write_text(json.dumps(res_payload, indent=2) + "\n", encoding="utf-8")
    return res_payload


def lookup_plot_geography(
    *,
    lat: float | None,
    lon: float | None,
    explicit_corporation_id: str | None = None,
    explicit_zone_code: str | None = None,
    boundary_fc: dict[str, Any] | None = None,
    wards_fc: dict[str, Any] | None = None,
    planning_districts_fc: dict[str, Any] | None = None,
    zones_fc: dict[str, Any] | None = None,
    overlays_fc: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Resolve `(lat, lon)` via point-in-polygon against Corporation, Ward, Planning District, Zone, and Overlays."""
    corporation_id = explicit_corporation_id
    corporation_name: str | None = None
    ward_id: str | None = None
    ward_name: str | None = None
    planning_district: str | None = None
    zone_code: str | None = None
    zone_label: str | None = None
    zone_source: str = "unknown"
    matched_overlays: list[dict[str, Any]] = []

    if lat is not None and lon is not None:
        pt = Point(float(lon), float(lat))

        for feat in (boundary_fc or {}).get("features") or []:
            geom = feat.get("geometry")
            if geom and geom.get("coordinates") and shape(geom).contains(pt):
                props = feat.get("properties") or {}
                corporation_name = str(
                    props.get("Corporation") or props.get("name") or corporation_id or ""
                )
                break

        for feat in (wards_fc or {}).get("features") or []:
            geom = feat.get("geometry")
            if geom and geom.get("coordinates") and shape(geom).contains(pt):
                props = feat.get("properties") or {}
                ward_id = str(props.get("ward_id") or props.get("ward_no") or "")
                ward_name = str(props.get("ward_name") or props.get("Ward_Name") or "")
                if not corporation_name and props.get("Corporation"):
                    corporation_name = str(props.get("Corporation"))
                break

        for feat in (planning_districts_fc or {}).get("features") or []:
            geom = feat.get("geometry")
            if geom and geom.get("coordinates") and shape(geom).contains(pt):
                props = feat.get("properties") or {}
                planning_district = str(
                    props.get("district_code")
                    or props.get("planning_district")
                    or props.get("district_name")
                    or ""
                )
                break

        for feat in (zones_fc or {}).get("features") or []:
            props = feat.get("properties") or {}
            if props.get("superseded_by") or props.get("record_superseded_by"):
                continue
            geom = feat.get("geometry")
            if geom and geom.get("coordinates") and shape(geom).contains(pt):
                zone_code = str(props.get("zone_code") or "")
                zone_label = str(props.get("zone_label") or zone_code)
                zone_source = "polygon_lookup"
                if not planning_district and props.get("planning_district"):
                    planning_district = str(props.get("planning_district"))
                break

        for feat in (overlays_fc or {}).get("features") or []:
            geom = feat.get("geometry")
            if geom and geom.get("coordinates") and shape(geom).contains(pt):
                props = feat.get("properties") or {}
                matched_overlays.append(dict(props))

    if zone_code is None and explicit_zone_code:
        zone_code = explicit_zone_code
        zone_label = explicit_zone_code
        zone_source = "user_selected"

    return {
        "lat": lat,
        "lon": lon,
        "corporation_id": corporation_id,
        "corporation_name": corporation_name,
        "ward_id": ward_id,
        "ward_name": ward_name,
        "planning_district": planning_district,
        "zone_code": zone_code or "unknown",
        "zone_label": zone_label or ("Zone data not yet available here" if not zone_code else zone_code),
        "zone_source": zone_source,
        "overlays": matched_overlays,
    }


def _find_instrument_family(doc_id: str, families: dict[str, list[str]]) -> str:
    for fam_name, doc_list in families.items():
        if doc_id in doc_list:
            return fam_name
    return "other"


def resolve_plot_parameters(
    *,
    parameters_payload: dict[str, Any],
    resolution_config: dict[str, Any],
    corporation_id: str,
    zone_code: str,
    plot_area_m2: float,
    road_width_m: float,
    plot_depth_m: float | None = None,
    plot_width_m: float | None = None,
    building_height_m: float | None = None,
    use: str = "residential",
    as_of_date: str = "2026-11-25",
    consolidated_payload: dict[str, Any] | None = None,
    geography: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Deterministically resolve building parameters for a plot using the 6 steps in `resolution.yaml`."""
    all_records: list[dict[str, Any]] = list(parameters_payload.get("records") or [])
    steps_by_id = {
        str(s["step_id"]): s
        for s in (resolution_config.get("steps") or [])
        if s.get("enabled", True)
    }
    families: dict[str, list[str]] = dict(resolution_config.get("instrument_families") or {})
    zoning_governed_params = set(
        (steps_by_id.get("zoning_governs_via_byelaw_1_4") or {}).get("parameters_governed") or []
    )

    inferred_depth = plot_depth_m if plot_depth_m is not None else round((plot_area_m2 * 1.5) ** 0.5, 2)
    inferred_width = plot_width_m if plot_width_m is not None else round(plot_area_m2 / max(1.0, inferred_depth), 2)
    eff_height = building_height_m if building_height_m is not None else 11.5

    resolved_by_param: dict[str, dict[str, Any]] = {}
    base_far_numeric: float | None = None

    for param_name in PARAMETER_ORDER:
        # 1. Gather records for `param_name` whose numeric intervals and zone/use match
        matching: list[dict[str, Any]] = []
        for rec in all_records:
            if rec.get("parameter") != param_name:
                continue
            v_from = rec.get("valid_from")
            if v_from and str(v_from) > as_of_date:
                continue

            conds = rec.get("conditions") or {}
            # Zone filter: match explicit zone_code or global (zone is None)
            rec_zones = conds.get("zone")
            if rec_zones and zone_code != "unknown" and zone_code not in rec_zones:
                continue
            if rec_zones and zone_code == "unknown":
                continue

            # Use filter
            rec_uses = conds.get("use")
            if rec_uses and use.lower() not in [u.lower() for u in rec_uses]:
                continue

            # Numeric interval checks
            if not interval_matches(conds.get("plot_area_m2"), plot_area_m2):
                continue
            if not interval_matches(conds.get("road_width_m"), road_width_m):
                continue
            if not interval_matches(conds.get("building_height_m"), eff_height):
                continue
            if not interval_matches(conds.get("plot_depth_m"), inferred_depth):
                continue
            if not interval_matches(conds.get("plot_width_m"), inferred_width):
                continue

            matching.append(rec)

        other_records: list[dict[str, Any]] = []
        active_pool: list[dict[str, Any]] = []
        deciding_step_id = "lex_posterior_within_family"

        # Step 1: Drafts never apply (`draft_excluded`)
        step1 = steps_by_id.get("draft_excluded")
        for r in matching:
            if step1 and r.get("legal_status") == "draft":
                other_records.append(
                    {
                        "record": r,
                        "reason_not_chosen": f"Step 1 ({step1['title']}): {step1['plain_rule']}",
                        "excluded_at_step": 1,
                    }
                )
            else:
                active_pool.append(r)

        # Step 2: Corporation scope (`corporation_scope`)
        step2 = steps_by_id.get("corporation_scope")
        after_step2: list[dict[str, Any]] = []
        for r in active_pool:
            rec_jurs = (r.get("conditions") or {}).get("jurisdiction")
            if step2 and rec_jurs and corporation_id not in rec_jurs:
                other_records.append(
                    {
                        "record": r,
                        "reason_not_chosen": f"Step 2 ({step2['title']}): {step2['plain_rule']}",
                        "excluded_at_step": 2,
                    }
                )
            else:
                after_step2.append(r)
        active_pool = after_step2

        # Step 3: GBGA 2024 notwithstanding (`gbga_notwithstanding`)
        step3 = steps_by_id.get("gbga_notwithstanding")
        if step3:
            statute_recs = [
                r
                for r in active_pool
                if _find_instrument_family(str(r["source"]["doc_id"]), families) == "statute"
            ]
            if statute_recs:
                non_statute = [r for r in active_pool if r not in statute_recs]
                for r in non_statute:
                    other_records.append(
                        {
                            "record": r,
                            "reason_not_chosen": f"Step 3 ({step3['title']}): {step3['plain_rule']}",
                            "excluded_at_step": 3,
                        }
                    )
                active_pool = statute_recs
                deciding_step_id = "gbga_notwithstanding"

        # Step 4: Zoning regulations govern use, coverage, FAR, setbacks, height, floors, dwelling units, parking (`zoning_governs_via_byelaw_1_4`)
        step4 = steps_by_id.get("zoning_governs_via_byelaw_1_4")
        if step4 and param_name in zoning_governed_params:
            zr_recs = [
                r
                for r in active_pool
                if _find_instrument_family(str(r["source"]["doc_id"]), families) == "zoning_regulations"
            ]
            non_zr_recs = [r for r in active_pool if r not in zr_recs]
            if zr_recs and non_zr_recs:
                for r in non_zr_recs:
                    other_records.append(
                        {
                            "record": r,
                            "reason_not_chosen": f"Step 4 ({step4['title']}): {step4['plain_rule']}",
                            "excluded_at_step": 4,
                        }
                    )
                active_pool = zr_recs
                deciding_step_id = "zoning_governs_via_byelaw_1_4"
            elif zr_recs:
                deciding_step_id = "zoning_governs_via_byelaw_1_4"

        # Step 5: Within one instrument family, the later in-force provision wins (`lex_posterior_within_family`)
        step5 = steps_by_id.get("lex_posterior_within_family")
        if step5 and len(active_pool) > 1:
            # Filter out explicitly superseded records (`valid_to <= as_of_date` or `legal_status == "superseded"`)
            in_force_now = [
                r
                for r in active_pool
                if r.get("legal_status") == "in_force"
                and (not r.get("valid_to") or str(r["valid_to"]) > as_of_date)
            ]
            if in_force_now and len(in_force_now) < len(active_pool):
                for r in active_pool:
                    if r not in in_force_now:
                        other_records.append(
                            {
                                "record": r,
                                "reason_not_chosen": f"Step 5 ({step5['title']}): Superseded on {r.get('valid_to')} by later amendment.",
                                "excluded_at_step": 5,
                            }
                        )
                active_pool = in_force_now
                deciding_step_id = "lex_posterior_within_family"

            # Prefer zone-specific table over general fallback table within the same family
            zone_specific = [
                r
                for r in active_pool
                if (r.get("conditions") or {}).get("zone")
                and zone_code in ((r.get("conditions") or {}).get("zone") or [])
            ]
            if zone_specific and len(zone_specific) < len(active_pool):
                for r in active_pool:
                    if r not in zone_specific:
                        other_records.append(
                            {
                                "record": r,
                                "reason_not_chosen": "General provision superseded by zone-specific development control table in Chapter 4.",
                                "excluded_at_step": 5,
                            }
                        )
                active_pool = zone_specific

            # Prefer latest `valid_from` within the same instrument family
            if len(active_pool) > 1:
                families_in_pool = {
                    _find_instrument_family(str(r["source"]["doc_id"]), families)
                    for r in active_pool
                }
                if len(families_in_pool) == 1:
                    max_date = max(str(r.get("valid_from") or "") for r in active_pool)
                    latest_recs = [
                        r for r in active_pool if str(r.get("valid_from") or "") == max_date
                    ]
                    if len(latest_recs) < len(active_pool):
                        for r in active_pool:
                            if r not in latest_recs:
                                other_records.append(
                                    {
                                        "record": r,
                                        "reason_not_chosen": f"Step 5 ({step5['title']}): Earlier provision ({r.get('valid_from')}) superseded by later provision ({max_date}).",
                                        "excluded_at_step": 5,
                                    }
                                )
                        active_pool = latest_recs
                        deciding_step_id = "lex_posterior_within_family"

                    # Prefer non-dependent numeric record over prose reference ("Refer Table 8 or Table 9")
                    non_ref_recs = [
                        r for r in active_pool if r.get("unit") != "reference"
                    ]
                    if non_ref_recs and len(non_ref_recs) < len(active_pool):
                        for r in active_pool:
                            if r not in non_ref_recs:
                                other_records.append(
                                    {
                                        "record": r,
                                        "reason_not_chosen": "Cross-reference pointer resolved to the target setback table.",
                                        "excluded_at_step": 5,
                                    }
                                )
                        active_pool = non_ref_recs

        # Deduplicate identical values from the same provision/row (e.g. Left Side & Right Side both 8%)
        unique_by_val: list[dict[str, Any]] = []
        seen_val_keys: set[tuple[Any, Any, str]] = set()
        for r in active_pool:
            vk = (r.get("value"), r.get("unit"), str(r["source"]["doc_id"]))
            if vk not in seen_val_keys:
                seen_val_keys.add(vk)
                unique_by_val.append(r)

        if not unique_by_val:
            resolved_by_param[param_name] = {
                "parameter": param_name,
                "status": "no_applicable_rule",
                "value": None,
                "unit": None,
                "computed_value": None,
                "computed_unit": None,
                "display_value": "No rule matched plot inputs",
                "governing_record": None,
                "resolution_step": None,
                "plain_reason": "No matching rule found for the given zone, plot area, and road width.",
                "other_applicable_records": other_records,
                "tied_records": [],
            }
            continue

        if len(unique_by_val) == 1:
            gov = copy.deepcopy(unique_by_val[0])
            step_obj = steps_by_id.get(deciding_step_id) or steps_by_id.get("zoning_governs_via_byelaw_1_4")
            raw_val = gov.get("value")
            raw_unit = gov.get("unit")
            comp_val: float | None = None
            comp_unit: str | None = None
            display_val = f"{raw_val} {raw_unit or ''}".strip()

            if isinstance(raw_val, (int, float)):
                num_v = float(raw_val)
                if param_name == "far_base_max":
                    base_far_numeric = num_v
                    comp_val = round(num_v * plot_area_m2, 2)
                    comp_unit = "m2_max_builtup"
                    display_val = f"{num_v:g} (up to {comp_val:g} m² floor area)"
                elif param_name == "ground_coverage_max_pct":
                    comp_val = round((num_v / 100.0) * plot_area_m2, 2)
                    comp_unit = "m2_max_footprint"
                    display_val = f"{num_v:g}% (up to {comp_val:g} m² footprint)"
                elif raw_unit == "pct_of_plot_depth":
                    comp_val = round((num_v / 100.0) * inferred_depth, 2)
                    comp_unit = "m"
                    display_val = f"{comp_val:g} m ({num_v:g}% of {inferred_depth:g} m plot depth)"
                elif raw_unit == "pct_of_plot_width":
                    comp_val = round((num_v / 100.0) * inferred_width, 2)
                    comp_unit = "m"
                    display_val = f"{comp_val:g} m ({num_v:g}% of {inferred_width:g} m plot width)"
                elif raw_unit == "multiple_of_base_far":
                    if base_far_numeric is not None:
                        comp_val = round(num_v * base_far_numeric, 3)
                        comp_unit = "far_ratio"
                        display_val = f"+{comp_val:g} FAR ({round(num_v * 100)}% of {base_far_numeric:g} base FAR)"
                    else:
                        display_val = f"{round(num_v * 100)}% of base FAR"
                elif raw_unit == "m":
                    comp_val = num_v
                    comp_unit = "m"
                    display_val = f"{num_v:g} m"
            else:
                display_val = str(gov.get("value_text") or raw_val)

            src = gov["source"]
            plain_why = (
                f"{src.get('table_id') or src['eid']} ({src['doc_id']}, p. {src['page']}) — "
                f"{step_obj['plain_rule'] if step_obj else 'Governing in-force provision.'}"
            )
            resolved_by_param[param_name] = {
                "parameter": param_name,
                "status": "resolved",
                "value": raw_val,
                "unit": raw_unit,
                "value_text": gov.get("value_text"),
                "computed_value": comp_val,
                "computed_unit": comp_unit,
                "display_value": display_val,
                "governing_record": gov,
                "resolution_step": step_obj,
                "plain_reason": plain_why,
                "other_applicable_records": other_records,
                "tied_records": [],
            }
        else:
            step6 = steps_by_id.get("unresolved_tie")
            resolved_by_param[param_name] = {
                "parameter": param_name,
                "status": "not_settled",
                "value": None,
                "unit": None,
                "value_text": "Not settled: two rules apply",
                "computed_value": None,
                "computed_unit": None,
                "display_value": "Not settled: two rules apply",
                "governing_record": None,
                "resolution_step": step6,
                "plain_reason": step6["plain_rule"] if step6 else "Not settled: two rules apply",
                "other_applicable_records": other_records,
                "tied_records": copy.deepcopy(unique_by_val),
            }

    # Corporation-specific 2026 changes from `consolidated.json`
    corp_changes: list[dict[str, Any]] = []
    for rec in (consolidated_payload or {}).get("records") or []:
        applied = rec.get("amendments_applied") or []
        if any("bbl-amend-2026" in str(a) for a in applied):
            corp_changes.append(
                {
                    "clause_id": rec.get("clause_id"),
                    "number": rec.get("number"),
                    "title": rec.get("title"),
                    "change_note": rec.get("change_note"),
                    "as_of_date": rec.get("as_of_date"),
                    "amending_clause_id": rec.get("amending_clause_id"),
                    "omitted": bool(rec.get("omitted", False)),
                    "summary": str(rec.get("text") or "")[:240],
                }
            )

    return {
        "derived": True,
        "notice": str(resolution_config.get("notice") or ""),
        "inputs": {
            "corporation_id": corporation_id,
            "zone_code": zone_code,
            "plot_area_m2": plot_area_m2,
            "road_width_m": road_width_m,
            "plot_depth_m": inferred_depth,
            "plot_width_m": inferred_width,
            "building_height_m": eff_height,
            "use": use,
            "as_of_date": as_of_date,
        },
        "geography": geography,
        "parameters": resolved_by_param,
        "corporation_changes": corp_changes,
    }
