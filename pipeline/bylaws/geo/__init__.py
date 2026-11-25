"""Stage 9: Geospatial boundary processing, planning districts, zones, overlays, and geo-layers registry."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import click
from pyproj import Transformer
from shapely import make_valid
from shapely.geometry import shape
from shapely.ops import transform as shapely_transform
from shapely.ops import unary_union

from bylaws.config import (
    ImportedZoningMapConfig,
    JurisdictionConfig,
    TracedZoningMapConfig,
)
from bylaws.geo.boundaries import inspect_and_reproject_geojson_features
from bylaws.geo.verify import write_jurisdiction_map_verification_report
from bylaws.geo.zones import (
    _extract_polygonal,
    _geometry_to_geojson_dict,
    extract_planning_district_from_pdf,
    extract_traced_zones_from_pdf,
    import_zones_from_geojson,
)
from bylaws.root import resolve_local_source_path, resolve_repo_root
from bylaws.schema_validator import validate_payload


def _clip_features_to_boundary(
    features: list[dict[str, Any]],
    boundary_geojson: dict[str, Any],
) -> list[dict[str, Any]]:
    boundary_shapes = [
        shape(f["geometry"])
        for f in boundary_geojson.get("features", [])
        if isinstance(f, dict) and f.get("geometry")
    ]
    if not boundary_shapes:
        return features
    boundary_union = unary_union(boundary_shapes)
    clipped_out: list[dict[str, Any]] = []
    for feat in features:
        if not isinstance(feat, dict) or not feat.get("geometry"):
            continue
        geom = shape(feat["geometry"])
        if not geom.is_valid:
            geom = make_valid(geom)
        clipped = _extract_polygonal(geom.intersection(boundary_union))
        if clipped is None:
            continue
        new_feat = dict(feat)
        new_feat["geometry"] = _geometry_to_geojson_dict(clipped)
        clipped_out.append(new_feat)
    return clipped_out


def run_geo_pipeline(config: JurisdictionConfig, *, repo_root: Path | None = None) -> None:
    """Execute the geospatial workflow and write `zones.geojson`, `planning-districts.geojson`, `overlays.geojson`, `geo-layers.json`, and `map-verification.md`."""
    root = repo_root or resolve_repo_root()
    processed_dir = root / "data" / "processed" / config.id
    reports_dir = root / "data" / "reports" / config.id
    processed_dir.mkdir(parents=True, exist_ok=True)
    reports_dir.mkdir(parents=True, exist_ok=True)

    boundary_path = processed_dir / "boundary.geojson"
    if not boundary_path.is_file():
        raise click.ClickException(
            f"Boundary GeoJSON not found at '{boundary_path}'. Run `bylaws acquire` first."
        )
    boundary_geojson: dict[str, Any] = json.loads(boundary_path.read_text(encoding="utf-8"))

    # 1. Planning districts (if configured)
    planning_district_features: list[dict[str, Any]] = []
    for pd_cfg in config.maps.planning_districts or []:
        if getattr(pd_cfg, "document", None):
            extracted_pd = extract_planning_district_from_pdf(
                pd_cfg, boundary_geojson, root, config.id
            )
            planning_district_features.extend(extracted_pd)
        else:
            pd_source = resolve_local_source_path(pd_cfg.source_url, root)
            raw_pd = json.loads(pd_source.read_text(encoding="utf-8"))
            reproj_pd = inspect_and_reproject_geojson_features(raw_pd, str(pd_source))
            clipped_pd = _clip_features_to_boundary(reproj_pd, boundary_geojson)
            planning_district_features.extend(clipped_pd)

    if planning_district_features:
        pd_out_path = processed_dir / "planning-districts.geojson"
        pd_out_path.write_text(
            json.dumps(
                {"type": "FeatureCollection", "features": planning_district_features},
                indent=2,
            )
            + "\n",
            encoding="utf-8",
        )

    # 2. Master plan land-use zones
    all_features: list[dict[str, Any]] = []
    traced_runs: list[dict[str, Any]] = []
    for zoning_cfg in config.maps.zoning:
        kind_val = getattr(zoning_cfg.kind, "value", getattr(zoning_cfg, "kind", None))
        if isinstance(zoning_cfg, TracedZoningMapConfig) or kind_val in {
            "traced",
            "vector_pdf",
            "grid_georeferenced_raster",
            "osm_gcp_raster",
        }:
            if kind_val == "traced" and not getattr(zoning_cfg, "grid_eastings", None):
                raise click.ClickException("not implemented: geo (traced)")
            features, georef_res, indep_checks = extract_traced_zones_from_pdf(
                zoning_cfg, boundary_geojson, root, config.id
            )
            all_features.extend(features)
            traced_runs.append(
                {
                    "config": zoning_cfg,
                    "georef": georef_res,
                    "checks": indep_checks,
                    "feature_count": len(features),
                }
            )
        elif isinstance(zoning_cfg, ImportedZoningMapConfig):
            features = import_zones_from_geojson(zoning_cfg, boundary_geojson, root)
            all_features.extend(features)
        else:
            raise click.ClickException(
                f"Unsupported zoning map configuration kind: {getattr(zoning_cfg, 'kind', None)!r}"
            )

    zones_payload: dict[str, Any] = {
        "type": "FeatureCollection",
        "schema_version": "1.4",
        "features": all_features,
    }
    zones_path = processed_dir / "zones.geojson"
    validate_payload(zones_payload, "zones", source=str(zones_path))
    zones_path.write_text(json.dumps(zones_payload, indent=2) + "\n", encoding="utf-8")

    # 3. Derived overlays (Rule R14)
    overlay_features: list[dict[str, Any]] = []
    for ov_cfg in config.maps.overlays or []:
        if ov_cfg.kind == "derived_overlay" and ov_cfg.source_url:
            ov_source = resolve_local_source_path(ov_cfg.source_url, root)
            raw_ov = json.loads(ov_source.read_text(encoding="utf-8"))
            reproj_ov = inspect_and_reproject_geojson_features(raw_ov, str(ov_source))
            clipped_ov = _clip_features_to_boundary(reproj_ov, boundary_geojson)
            for feat in clipped_ov:
                props = dict(feat.get("properties") or {})
                props["overlay_id"] = ov_cfg.id
                props["title"] = ov_cfg.title
                props["derived"] = True
                props["approximate"] = True
                props["method"] = ov_cfg.method
                props["accuracy_m"] = ov_cfg.accuracy_m
                feat["properties"] = props
                overlay_features.append(feat)
        elif ov_cfg.kind == "derived_overlay" and ov_cfg.buffer_m:
            buf_m = float(ov_cfg.buffer_m)
            to_utm = Transformer.from_crs("EPSG:4326", "EPSG:32643", always_xy=True)
            to_wgs = Transformer.from_crs("EPSG:32643", "EPSG:4326", always_xy=True)
            lake_feats = [
                f
                for f in all_features
                if f.get("properties", {}).get("zone_code") == "G-LAKE"
            ]
            for idx_l, lf in enumerate(lake_feats, start=1):
                g_wgs = shape(lf["geometry"])
                g_utm = shapely_transform(to_utm.transform, g_wgs)
                ring_utm = g_utm.buffer(buf_m).difference(g_utm)
                ring_wgs = _extract_polygonal(
                    shapely_transform(to_wgs.transform, ring_utm)
                )
                if ring_wgs is None:
                    continue
                overlay_features.append(
                    {
                        "type": "Feature",
                        "geometry": _geometry_to_geojson_dict(ring_wgs),
                        "properties": {
                            "overlay_id": ov_cfg.id,
                            "feature_id": f"{ov_cfg.id}:{idx_l}",
                            "title": ov_cfg.title,
                            "derived": True,
                            "approximate": True,
                            "buffer_m": buf_m,
                            "method": ov_cfg.method,
                            "accuracy_m": ov_cfg.accuracy_m,
                            "rule_doc_id": ov_cfg.rule_doc_id,
                            "rule_clause": ov_cfg.rule_clause,
                        },
                    }
                )

    if config.maps.overlays is not None:
        overlays_path = processed_dir / "overlays.geojson"
        overlays_path.write_text(
            json.dumps({"type": "FeatureCollection", "features": overlay_features}, indent=2)
            + "\n",
            encoding="utf-8",
        )

    # 4. Build geo-layers.json registry
    layers: list[dict[str, Any]] = []
    for b_cfg in config.maps.boundaries:
        out_file = b_cfg.output_file or "boundary.geojson"
        b_file_path = processed_dir / out_file
        feat_count = 0
        if b_file_path.is_file():
            b_data = json.loads(b_file_path.read_text(encoding="utf-8"))
            feat_count = len(b_data.get("features") or [])
        src_display = getattr(b_cfg, "source_label", None) or b_cfg.source_url
        ret_date = getattr(b_cfg, "retrieved_date", None)
        layers.append(
            {
                "layer_id": b_cfg.id,
                "title": b_cfg.title or f"{config.name} Official Boundary ({b_cfg.id})",
                "kind": "official_boundary",
                "source": str(src_display),
                "method": "Official boundary polygon extraction (EPSG:4326)",
                "accuracy_m": 1.0,
                "derived": False,
                "file": out_file,
                "external_url": b_cfg.source_url,
                "feature_count": feat_count,
                "notes": f"Retrieved {ret_date}" if ret_date else None,
            }
        )

    for pd_cfg in config.maps.planning_districts or []:
        layers.append(
            {
                "layer_id": pd_cfg.id,
                "title": pd_cfg.title or f"{config.name} Planning Districts",
                "kind": "official_boundary",
                "source": pd_cfg.source_url,
                "method": "RMP 2015 planning district boundary index clipped to corporation boundary (EPSG:4326)",
                "accuracy_m": 5.0,
                "derived": False,
                "file": "planning-districts.geojson",
                "external_url": None,
                "feature_count": len(planning_district_features),
                "notes": pd_cfg.source_attribution,
            }
        )

    if config.maps.zoning:
        active_zone_count = sum(
            1
            for f in all_features
            if f.get("properties", {}).get("superseded_by") is None
            and f.get("properties", {}).get("record_superseded_by") is None
        )
        first_zoning = config.maps.zoning[0]
        if traced_runs:
            run0 = traced_runs[0]
            georef0 = run0["georef"]
            checks0 = run0["checks"]
            cfg0 = run0["config"]
            sheet_name = str(cfg0.sheet or cfg0.id)
            rmse_val = round(float(georef0["rmse_m"]), 4)
            layers.append(
                {
                    "layer_id": "landuse_zones",
                    "title": f"{config.name} Master Plan Land Use Zones ({sheet_name})",
                    "kind": "master_plan_zone",
                    "source": str(cfg0.source_url or cfg0.document),
                    "method": f"Zones traced from the RMP 2015 Proposed Land Use sheet {sheet_name}, placed using the sheet's printed grid (UTM 43N EPSG:32643 -> EPSG:4326)",
                    "accuracy_m": rmse_val,
                    "derived": True,
                    "file": "zones.geojson",
                    "external_url": cfg0.source_url,
                    "feature_count": active_zone_count,
                    "notes": f"Zones traced from the RMP 2015 Proposed Land Use sheet {sheet_name}, placed using the sheet's printed grid; measured grid placement RMSE {rmse_val:.2f} m (independent OpenStreetMap road median offset {checks0.get('road_median_offset_m') or 0.0:.1f} m).",
                    "sheet_overlay": {
                        "image_url": str(georef0["image_url"]),
                        "bounds_wgs84": georef0["bounds_wgs84"],
                        "sheet": sheet_name,
                        "planning_district": str(cfg0.planning_district),
                        "rmse_m": rmse_val,
                        "loo_rmse_m": round(float(georef0["loo_rmse_m"]), 4),
                        "max_residual_m": round(float(georef0["max_residual_m"]), 4),
                        "road_median_offset_m": checks0.get("road_median_offset_m"),
                        "road_p90_offset_m": checks0.get("road_p90_offset_m"),
                    },
                }
            )
        else:
            z_source = (
                first_zoning.source_url
                if isinstance(first_zoning, ImportedZoningMapConfig)
                else first_zoning.document
            )
            layers.append(
                {
                    "layer_id": "master-plan-zones",
                    "title": f"{config.name} Master Plan Land Use Zones",
                    "kind": "master_plan_zone",
                    "source": str(z_source),
                    "method": "Master plan land-use zone extraction reprojected from UTM 43N (EPSG:32643) and clipped to corporation boundary (EPSG:4326)",
                    "accuracy_m": 5.0,
                    "derived": True,
                    "file": "zones.geojson",
                    "external_url": None,
                    "feature_count": active_zone_count,
                    "notes": "Derived by this project from official master plan sheets/layers.",
                }
            )

    for ov_cfg in config.maps.overlays or []:
        ov_count = (
            sum(
                1
                for f in overlay_features
                if f.get("properties", {}).get("overlay_id") == ov_cfg.id
            )
            if ov_cfg.kind == "derived_overlay"
            else None
        )
        layers.append(
            {
                "layer_id": ov_cfg.id,
                "title": ov_cfg.title,
                "kind": ov_cfg.kind,
                "source": ov_cfg.source,
                "method": ov_cfg.method,
                "accuracy_m": ov_cfg.accuracy_m,
                "derived": bool(ov_cfg.derived if ov_cfg.derived is not None else True),
                "file": "overlays.geojson" if ov_cfg.kind == "derived_overlay" else None,
                "external_url": ov_cfg.external_url,
                "feature_count": ov_count,
                "notes": "Derived by this project, not an official publication (approximate)."
                if ov_cfg.kind == "derived_overlay"
                else "External reference portal only; height surfaces not redistributed.",
            }
        )

    geo_layers_payload: dict[str, Any] = {
        "schema_version": "1.4",
        "jurisdiction": config.id,
        "layers": layers,
    }
    geo_layers_path = processed_dir / "geo-layers.json"
    validate_payload(geo_layers_payload, "geo-layers", source=str(geo_layers_path))
    geo_layers_path.write_text(
        json.dumps(geo_layers_payload, indent=2) + "\n",
        encoding="utf-8",
    )

    write_jurisdiction_map_verification_report(
        config=config,
        boundary_geojson=boundary_geojson,
        zone_features=all_features,
        planning_district_features=planning_district_features,
        overlay_features=overlay_features,
        output_path=reports_dir / "map-verification.md",
        traced_runs=traced_runs,
    )

    click.echo(
        f"[geo] Processed {len(all_features)} zone polygon(s), "
        f"{len(planning_district_features)} planning district(s), and "
        f"{len(layers)} geo layer(s) for '{config.id}'."
    )
