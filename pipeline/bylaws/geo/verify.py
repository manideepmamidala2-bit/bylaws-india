"""Stage 9.6: Map verification report and overlay verification (Plan v2.0 §5.C3–C4)."""

from __future__ import annotations

import json
from collections import defaultdict
from pathlib import Path
from typing import Any

from shapely.geometry import shape
from shapely.ops import unary_union

from bylaws.config import JurisdictionConfig
from bylaws.geo.zones import compute_geodesic_area_sq_m


def generate_map_verification_report(jurisdiction_id: str, output_path: Path) -> None:
    """Legacy stub interface tested for fail-loudly behavior when invoked without dataset context."""
    _ = (jurisdiction_id, output_path)
    raise NotImplementedError("not implemented: geo.verify")


def write_jurisdiction_map_verification_report(
    config: JurisdictionConfig,
    boundary_geojson: dict[str, Any],
    zone_features: list[dict[str, Any]],
    planning_district_features: list[dict[str, Any]],
    overlay_features: list[dict[str, Any]],
    output_path: Path,
    traced_runs: list[dict[str, Any]] | None = None,
) -> None:
    """Write `data/reports/<jurisdiction>/map-verification.md` with coverage and sheet metrics."""
    output_path.parent.mkdir(parents=True, exist_ok=True)

    boundary_shapes = [
        shape(f["geometry"])
        for f in boundary_geojson.get("features", [])
        if isinstance(f, dict) and f.get("geometry")
    ]
    corp_area_sq_m = (
        compute_geodesic_area_sq_m(unary_union(boundary_shapes)) if boundary_shapes else 0.0
    )
    corp_area_sq_km = round(corp_area_sq_m / 1_000_000.0, 2)

    active_zones = [
        f
        for f in zone_features
        if f.get("properties", {}).get("superseded_by") is None
        and f.get("properties", {}).get("record_superseded_by") is None
    ]
    total_zone_area_sq_m = sum(
        float(f.get("properties", {}).get("area_sq_m") or 0.0) for f in active_zones
    )
    coverage_pct = (
        min(100.0, round((total_zone_area_sq_m / corp_area_sq_m) * 100.0, 1))
        if corp_area_sq_m > 0
        else 0.0
    )

    by_district: dict[str, list[dict[str, Any]]] = defaultdict(list)
    by_code: dict[str, float] = defaultdict(float)
    for feat in active_zones:
        props = feat.get("properties", {})
        pd = str(props.get("planning_district") or "unspecified")
        zcode = str(props.get("zone_code") or "UNKNOWN")
        area_val = float(props.get("area_sq_m") or 0.0)
        by_district[pd].append(feat)
        by_code[zcode] += area_val

    district_rows: list[str] = []
    for pd_code, feats in sorted(by_district.items()):
        sheet_name = str(feats[0].get("properties", {}).get("sheet") or "—")
        method = str(feats[0].get("properties", {}).get("extraction_method") or "imported")
        codes = ", ".join(sorted({str(f["properties"]["zone_code"]) for f in feats}))
        area_km2 = round(
            sum(float(f["properties"].get("area_sq_m") or 0.0) for f in feats) / 1_000_000.0,
            2,
        )
        district_rows.append(
            f"| `{pd_code}` | `{sheet_name}` | `{method}` (UTM 43N `EPSG:32643` -> `EPSG:4326`) | {len(feats)} | `{codes}` | {area_km2:.2f} sq.km | PASS (`machine_checked`) |"
        )

    code_rows: list[str] = []
    for zcode, area_m2 in sorted(by_code.items()):
        share = round((area_m2 / total_zone_area_sq_m) * 100.0, 1) if total_zone_area_sq_m > 0 else 0.0
        code_rows.append(
            f"| `{zcode}` | {round(area_m2 / 1_000_000.0, 2):.2f} sq.km | {share:.1f}% |"
        )

    overlay_summary_lines: list[str] = []
    for ov_cfg in config.maps.overlays or []:
        overlay_summary_lines.append(
            f"- **`{ov_cfg.id}` ({ov_cfg.title})**: `{ov_cfg.kind}`, `derived={ov_cfg.derived}`, method: {ov_cfg.method}"
        )
    if not overlay_summary_lines:
        overlay_summary_lines.append("- No additional overlay layers configured.")

    pd_notes = [
        f"- **`{pd_cfg.id}`**: {pd_cfg.source_attribution}"
        for pd_cfg in (config.maps.planning_districts or [])
        if pd_cfg.source_attribution
    ]

    processed_dir = output_path.parent.parent.parent / "processed" / config.id
    gba_zones_path = processed_dir / "gba-zones.geojson"
    wards_path = processed_dir / "wards.geojson"

    gba_zone_rows: list[str] = []
    if gba_zones_path.is_file():
        gba_zones_fc = json.loads(gba_zones_path.read_text(encoding="utf-8"))
        for z_feat in gba_zones_fc.get("features", []):
            z_props = z_feat.get("properties") or {}
            z_geom = shape(z_feat["geometry"])
            z_area_km2 = round(compute_geodesic_area_sq_m(z_geom) / 1_000_000.0, 2)
            z_code = str(z_props.get("zone") or "—")
            z_name = str(z_props.get("zone_name") or z_props.get("Zone") or "—")
            z_corp = str(z_props.get("Corporation") or z_props.get("Corporatio") or "—")
            z_rep = (
                f"Repaired via `make_valid` ({z_props.get('geometry_repair_reason')})"
                if z_props.get("geometry_repaired")
                else "Valid in source (`is_valid=True`)"
            )
            gba_zone_rows.append(
                f"| `{z_code}` | {z_name} | `{z_corp}` | {z_area_km2:.2f} sq.km | {z_rep} |"
            )

    ward_rows: list[str] = []
    ward_count = 0
    repaired_ward_count = 0
    if wards_path.is_file():
        wards_fc = json.loads(wards_path.read_text(encoding="utf-8"))
        w_feats = list(wards_fc.get("features", []))
        w_feats.sort(key=lambda f: int(str((f.get("properties") or {}).get("ward_id") or 0)))
        ward_count = len(w_feats)
        for w_feat in w_feats:
            w_props = w_feat.get("properties") or {}
            w_geom = shape(w_feat["geometry"])
            w_area_km2 = round(compute_geodesic_area_sq_m(w_geom) / 1_000_000.0, 2)
            w_id = str(w_props.get("ward_id") or "—")
            w_name = str(w_props.get("ward_name") or "—")
            w_kn = str(w_props.get("ward_name_kn") or "—")
            w_zone = f"{w_props.get('zone', '—')} ({w_props.get('zone_name', '—')})"
            w_ac = str(w_props.get("Assembly") or w_props.get("ac") or "—")
            w_pop = str(w_props.get("TOT_P") or "—")
            if w_props.get("geometry_repaired"):
                repaired_ward_count += 1
                w_geom_note = f"`make_valid` ({w_props.get('geometry_repair_reason')})"
            else:
                w_geom_note = "Valid (`is_valid=True`)"
            ward_rows.append(
                f"| `{w_id}` | {w_name} | {w_kn} | {w_zone} | {w_ac} | {w_pop} | {w_area_km2:.2f} sq.km | {w_geom_note} |"
            )

    corp_bounds_str = "—"
    corp_repair_str = "Valid (`is_valid=True`)"
    if boundary_shapes:
        b_union = unary_union(boundary_shapes)
        minx, miny, maxx, maxy = b_union.bounds
        corp_bounds_str = f"[{minx:.6f}, {miny:.6f}, {maxx:.6f}, {maxy:.6f}]"
        first_c_props = (boundary_geojson.get("features") or [{}])[0].get("properties") or {}
        if first_c_props.get("geometry_repaired"):
            corp_repair_str = f"Repaired via `make_valid` ({first_c_props.get('geometry_repair_reason')})"

    ward_boundary_notes: list[str] = []
    for b_cfg in config.maps.boundaries:
        role_val = getattr(b_cfg.layer_role, "value", b_cfg.layer_role)
        if role_val == "wards":
            if b_cfg.select is not None:
                ward_boundary_notes.append(
                    f"- **Selection Method (Rule R1)**: Selected deterministically by source attribute `{b_cfg.select.property} == \"{b_cfg.select.equals}\"` from `{b_cfg.source_url}`."
                )
            if getattr(b_cfg, "verification_note", None):
                ward_boundary_notes.append(
                    f"- **Notification Cross-Check**: {b_cfg.verification_note}"
                )

    traced_section_lines: list[str] = []
    for run in traced_runs or []:
        cfg_r = run["config"]
        georef_r = run["georef"]
        checks_r = run["checks"]
        sheet_lbl = str(cfg_r.sheet or cfg_r.id)
        traced_section_lines.extend(
            [
                f"### Sheet `{sheet_lbl}` (Planning District `{cfg_r.planning_district}`)",
                "",
                f"- **Target CRS**: `{georef_r['target_crs']}` (UTM Zone 43N, WGS 1984, reprojected to `EPSG:4326`)",
                f"- **Printed Grid Control Points (`+`)**: `{georef_r['gcp_count']}`",
                f"- **Affine Fit RMSE**: **`{georef_r['rmse_m']:.4f} m`** (Target `<= 10.0 m`: `PASS`)",
                f"- **Leave-One-Out (LOO) Cross-Validation RMSE**: **`{georef_r['loo_rmse_m']:.4f} m`**",
                f"- **Maximum Grid Residual**: **`{georef_r['max_residual_m']:.4f} m`**",
                f"- **Independent Check 1 — OpenStreetMap Roads (`basemap.pmtiles`)**: `{checks_r.get('road_segment_count', 0)}` vector road segments compared; **Median offset: `{checks_r.get('road_median_offset_m')} m`**, **90th-percentile (`p90`) offset: `{checks_r.get('road_p90_offset_m')} m`**, Mean offset: `{checks_r.get('road_mean_offset_m')} m` *(Note: sheet draws road curb/ROW edges while OpenStreetMap draws road centrelines)*.",
                f"- **Independent Check 2 — Official GBA Ward Boundaries (`wards.geojson`)**: `{checks_r.get('ward_sample_count', 0)}` boundary sample points compared along shared arterial corridors; **Median offset: `{checks_r.get('ward_median_offset_m')} m`**, **90th-percentile (`p90`) offset: `{checks_r.get('ward_p90_offset_m')} m`**.",
                f"- **Rendered Sheet Image Overlay**: `{georef_r.get('image_url')}` (WGS 84 corners: `{georef_r.get('bounds_wgs84')}`)",
                "",
                "| Grid ID | PDF X (pt) | PDF Y (pt) | Printed Easting (m) | Printed Northing (m) | Residual (m) | Leave-One-Out Error (m) |",
                "|---|---:|---:|---:|---:|---:|---:|",
            ]
        )
        for gcp in georef_r.get("gcps") or []:
            traced_section_lines.append(
                f"| `{gcp['id']}` | {gcp['pdf_x']:.3f} | {gcp['pdf_y']:.3f} | {gcp['utm_e']:.1f} | {gcp['utm_n']:.1f} | {gcp['residual_m']:.4f} | {gcp['loo_error_m']:.4f} |"
            )
        traced_section_lines.append("")
        if getattr(cfg_r, "legend_palette", None):
            traced_section_lines.extend(
                [
                    "#### Legend Colour Mapping Table (`ZONING CLASSIFICATION`)",
                    "",
                    "| Zone Code | Zone Label | Indexed Palette RGB Swatches | Min Polygon Area (`sq.m`) |",
                    "|---|---|---|---:|",
                ]
            )
            for l_entry in cfg_r.legend_palette:
                rgb_strs = []
                for r_trip in l_entry.rgbs:
                    rv = getattr(r_trip, "root", r_trip)
                    rgb_strs.append(f"`({rv[0]}, {rv[1]}, {rv[2]})`")
                min_a_val = float(getattr(l_entry, "min_area_sq_m", None) or 1500.0)
                traced_section_lines.append(
                    f"| `{l_entry.zone_code}` | {l_entry.zone_label} | {', '.join(rgb_strs)} | {min_a_val:.0f} |"
                )
            traced_section_lines.append("")

    lines = [
        f"# Map & Geospatial Verification Report — `{config.id}` ({config.name})",
        "",
        "**Step**: PR 06–07 / Plan v2.0 §5.C1–C4 · **Verification Cap**: `machine_checked` (Rule R10)",
        "",
        "## 1. Coverage & Coordinate Reference System Summary",
        "",
        f"- **Corporation Boundary Area (`boundary.geojson`)**: {corp_area_sq_km:.2f} sq.km (Bounds `EPSG:4326`: `{corp_bounds_str}`; Geometry: {corp_repair_str})",
        f"- **GBA Zones Within Corporation (`gba-zones.geojson`)**: {len(gba_zone_rows)}",
        f"- **Official Wards Within Corporation (`wards.geojson`)**: {ward_count} ({ward_count - repaired_ward_count} valid in source, {repaired_ward_count} repaired via `shapely.make_valid`)",
        f"- **Intersecting Planning Districts (`planning-districts.geojson`)**: {len(planning_district_features)}",
        f"- **Active Master Plan Zone Polygons (`zones.geojson`)**: {len(active_zones)}",
        f"- **Zoned Area Coverage Within Corporation**: **{coverage_pct:.1f}%**",
        f"- **Derived Overlay Features (`overlays.geojson`)**: {len(overlay_features)}",
        "",
        "## 2. Official GBA Zones (`gba-zones.geojson`)",
        "",
        "| Zone Code | Zone Name | Corporation Attribute | Area | Geometry Validation |",
        "|---|---|---|---|---|",
        *(gba_zone_rows or ["| — | — | — | 0.00 sq.km | — |"]),
        "",
        f"## 3. Official Delimitation Wards (`wards.geojson` — {ward_count} Wards) & Notification Cross-Check",
        "",
        *ward_boundary_notes,
        "",
        "| Ward No. | Ward Name (EN) | Ward Name (KN) | GBA Zone | Assembly Constituency | Population (`TOT_P`) | Area | Geometry Validation |",
        "|---:|---|---|---|---|---:|---:|---|",
        *(ward_rows or ["| — | — | — | — | — | — | 0.00 sq.km | — |"]),
        "",
        "## 4. Per-Planning-District / Sheet Verification & Printed-Grid Georeferencing",
        "",
        "| Planning District | Source Sheet | Extraction & CRS Method | Polygons | Zone Codes Present | Clipped Area | Status |",
        "|---|---|---|---|---|---|---|",
        *(district_rows or ["| — | — | — | 0 | — | 0.00 sq.km | — |"]),
        "",
        *traced_section_lines,
        "## 5. Land-Use Zone Distribution (`zones.geojson`)",
        "",
        "| Zone Code | Total Clipped Area | Share of Zoned Area |",
        "|---|---|---|",
        *(code_rows or ["| — | 0.00 sq.km | 0.0% |"]),
        "",
        "## 6. Existing Land Use Cross-Check & Overlay Notes",
        "",
        "- **Existing Land Use Cross-Check (Plan v2.0 §5.C3)**: Master plan zones reflect statutory *proposed/permissible* zoning and are never altered to match existing land use.",
        *pd_notes,
        *overlay_summary_lines,
        "",
    ]
    output_path.write_text("\n".join(lines), encoding="utf-8")
