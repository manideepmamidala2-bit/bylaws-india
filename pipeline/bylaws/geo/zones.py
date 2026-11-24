"""Stage 9.5: Zoning polygon extraction (printed-grid PDF & imported GeoJSON), CRS reprojection, clipping, and UTM metric area computation."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import click
import numpy as np
import pdfplumber
import pyogrio
import rasterio.features
from affine import Affine
from pyproj import Transformer
from scipy.ndimage import binary_closing, binary_opening
from shapely import make_valid
from shapely import transform as shapely_transform
from shapely.geometry import (
    LineString,
    MultiPolygon,
    Point,
    Polygon,
    box,
    mapping,
    shape,
)
from shapely.geometry.base import BaseGeometry
from shapely.ops import polygonize, unary_union

from bylaws.config import ImportedZoningMapConfig, TracedZoningMapConfig
from bylaws.geo.boundaries import inspect_and_reproject_geojson_features
from bylaws.geo.georef import (
    fit_printed_grid_transform,
    pdf_xy_to_utm,
    render_sheet_overlay_png,
)
from bylaws.root import resolve_local_source_path


def extract_zone_polygons(geotiff_path: Path, legend_entries: list[dict[str, Any]]) -> dict[str, Any]:
    """Legacy GeoTIFF stub interface tested for fail-loudly behavior when invoked without dataset context."""
    _ = (geotiff_path, legend_entries)
    raise NotImplementedError("not implemented: geo.zones (traced)")


def _extract_polygonal(geom: BaseGeometry) -> BaseGeometry | None:
    if geom.is_empty:
        return None
    valid_geom = make_valid(geom) if not geom.is_valid else geom
    if isinstance(valid_geom, (Polygon, MultiPolygon)):
        return valid_geom if not valid_geom.is_empty else None
    if hasattr(valid_geom, "geoms"):
        polys: list[Polygon] = []
        for sub in valid_geom.geoms:
            if isinstance(sub, Polygon) and not sub.is_empty:
                polys.append(sub)
            elif isinstance(sub, MultiPolygon) and not sub.is_empty:
                polys.extend(p for p in sub.geoms if not p.is_empty)
        if not polys:
            return None
        return polys[0] if len(polys) == 1 else MultiPolygon(polys)
    return None


def _resolve_utm_epsg_for_lonlat(lon: float, lat: float) -> str:
    zone_number = max(1, min(60, int((lon + 180.0) // 6.0) + 1))
    base = 32600 if lat >= 0.0 else 32700
    return f"EPSG:{base + zone_number}"


def compute_geodesic_area_sq_m(geom: BaseGeometry) -> float:
    """Compute area in square metres for a WGS84 polygon by projecting to its local UTM zone via `pyproj`."""
    if geom.is_empty:
        return 0.0
    centroid = geom.centroid
    utm_epsg = _resolve_utm_epsg_for_lonlat(float(centroid.x), float(centroid.y))
    transformer = Transformer.from_crs("EPSG:4326", utm_epsg, always_xy=True)
    projected = shapely_transform(
        geom,
        lambda coords: np.column_stack(transformer.transform(coords[:, 0], coords[:, 1])),
    )
    return round(float(projected.area), 2)


def _normalize_ring(ring: Any) -> list[list[float]]:
    coords = [[round(float(pt[0]), 6), round(float(pt[1]), 6)] for pt in ring]
    if coords and coords[0] != coords[-1]:
        coords.append(list(coords[0]))
    return coords


def _geometry_to_geojson_dict(geom: BaseGeometry) -> dict[str, Any]:
    raw_map = mapping(geom)
    gtype = raw_map["type"]
    if gtype == "Polygon":
        return {
            "type": "Polygon",
            "coordinates": [_normalize_ring(ring) for ring in raw_map["coordinates"]],
        }
    if gtype == "MultiPolygon":
        return {
            "type": "MultiPolygon",
            "coordinates": [
                [_normalize_ring(ring) for ring in poly]
                for poly in raw_map["coordinates"]
            ],
        }
    raise ValueError(f"Unsupported geometry type for zone feature: {gtype}")


def extract_planning_district_from_pdf(
    pd_cfg: Any,
    boundary_geojson: dict[str, Any],
    repo_root: Path,
    jurisdiction_id: str,
) -> list[dict[str, Any]]:
    """Extract a planning district outline polygon from a vector PDF index map, calibrate to UTM, reproject to EPSG:4326, and clip to `boundary_geojson`."""
    pdf_path = repo_root / "data" / "raw" / jurisdiction_id / f"{pd_cfg.document}.pdf"
    if not pdf_path.is_file():
        raise click.ClickException(
            f"Planning district index PDF not found at '{pdf_path}'. Run `bylaws acquire` first."
        )

    page_num = int(getattr(pd_cfg, "page", None) or 1)
    target_code = str(getattr(pd_cfg, "district_code", None) or pd_cfg.id).replace(".", "")
    raw_scale_m = getattr(pd_cfg, "scale_m_per_pt", None)
    raw_anchor_pdf = getattr(pd_cfg, "anchor_pdf_pt", None)
    raw_anchor_utm = getattr(pd_cfg, "anchor_utm_pt", None)
    if raw_scale_m is None or raw_anchor_pdf is None or raw_anchor_utm is None:
        raise click.ClickException(
            f"Planning district PDF config '{pd_cfg.id}' must specify scale_m_per_pt, anchor_pdf_pt, and anchor_utm_pt."
        )
    scale_m = float(raw_scale_m)
    anchor_pdf = list(getattr(raw_anchor_pdf, "root", raw_anchor_pdf))
    anchor_utm = list(getattr(raw_anchor_utm, "root", raw_anchor_utm))
    e0 = float(anchor_utm[0]) - float(anchor_pdf[0]) * scale_m
    n0 = float(anchor_utm[1]) + float(anchor_pdf[1]) * scale_m

    with pdfplumber.open(pdf_path) as pdf:
        page = pdf.pages[page_num - 1]
        lines = [
            LineString(c["pts"])
            for c in page.curves[4:68]
            if len(c.get("pts") or []) >= 2
        ]
        polys = list(polygonize(unary_union(lines)))
        words = [
            w
            for w in page.extract_words()
            if float(w["x0"]) < float(page.width) * 0.6 and str(w["text"]).strip() == target_code
        ]
        if not words:
            raise click.ClickException(
                f"Planning district code '{target_code}' not found in '{pdf_path}'."
            )
        w0 = words[0]
        label_pt = Point(
            0.5 * (float(w0["x0"]) + float(w0["x1"])),
            0.5 * (float(w0["top"]) + float(w0["bottom"])),
        )
        matched_poly: Polygon | None = None
        for poly in polys:
            if poly.contains(label_pt):
                matched_poly = poly
                break
        if matched_poly is None:
            raise click.ClickException(
                f"No enclosing polygon found for planning district '{target_code}' in '{pdf_path}'."
            )

    to_wgs84 = Transformer.from_crs("EPSG:32643", "EPSG:4326", always_xy=True)

    def _index_pt_to_wgs84(coords: np.ndarray) -> np.ndarray:
        utm_e = e0 + coords[:, 0] * scale_m
        utm_n = n0 - coords[:, 1] * scale_m
        lon, lat = to_wgs84.transform(utm_e, utm_n)
        return np.column_stack([lon, lat])

    poly_wgs84 = shapely_transform(matched_poly, _index_pt_to_wgs84)
    boundary_shapes = [
        shape(f["geometry"])
        for f in boundary_geojson.get("features", [])
        if isinstance(f, dict) and f.get("geometry")
    ]
    if boundary_shapes:
        boundary_union = unary_union(boundary_shapes)
        clipped = _extract_polygonal(poly_wgs84.intersection(boundary_union))
    else:
        clipped = _extract_polygonal(poly_wgs84)

    if clipped is None:
        return []

    area_sq_m = compute_geodesic_area_sq_m(clipped)
    return [
        {
            "type": "Feature",
            "geometry": _geometry_to_geojson_dict(clipped),
            "properties": {
                "district_id": pd_cfg.id,
                "district_code": str(getattr(pd_cfg, "district_code", None) or pd_cfg.id),
                "district_name": str(getattr(pd_cfg, "district_name", None) or pd_cfg.title or pd_cfg.id),
                "area_sq_m": area_sq_m,
                "source_attribution": getattr(pd_cfg, "source_attribution", None),
                "verification": "machine_checked",
            },
        }
    ]


def _run_independent_sheet_checks(
    pdf_path: Path,
    page_number: int,
    georef_result: dict[str, Any],
    repo_root: Path,
    jurisdiction_id: str,
) -> dict[str, Any]:
    """Run independent placement checks against OpenStreetMap roads (`basemap.pmtiles`) and official ward boundaries (`wards.geojson`)."""
    target_crs = str(georef_result.get("target_crs") or "EPSG:32643")

    def _pts_to_utm(coords: np.ndarray) -> np.ndarray:
        ue, un = pdf_xy_to_utm(coords[:, 0], coords[:, 1], georef_result)
        return np.column_stack([ue, un])

    road_median_m: float | None = None
    road_p90_m: float | None = None
    road_mean_m: float | None = None
    road_segment_count = 0

    pmtiles_path = repo_root / "public" / "data" / jurisdiction_id / "basemap.pmtiles"
    if pmtiles_path.is_file():
        gdf_roads = pyogrio.read_dataframe(pmtiles_path, layer="roads")
        gdf_roads_utm = gdf_roads.to_crs(target_crs)
        gcps = georef_result.get("gcps") or []
        min_e = min(float(g["utm_e"]) for g in gcps) - 1000.0
        max_e = max(float(g["utm_e"]) for g in gcps) + 1000.0
        min_n = min(float(g["utm_n"]) for g in gcps) - 1000.0
        max_n = max(float(g["utm_n"]) for g in gcps) + 1000.0
        sheet_box_utm = box(min_e, min_n, max_e, max_n)
        osm_in_sheet = gdf_roads_utm[gdf_roads_utm.intersects(sheet_box_utm)]
        if len(osm_in_sheet) > 0:
            osm_union = unary_union(list(osm_in_sheet.geometry))
            road_dists: list[float] = []
            with pdfplumber.open(pdf_path) as pdf:
                page = pdf.pages[page_number - 1]
                for c in page.curves + page.lines:
                    if (
                        float(c["x0"]) < 80.0
                        or float(c["x1"]) > 2750.0
                        or float(c["top"]) < 80.0
                        or float(c["bottom"]) > 2280.0
                    ):
                        continue
                    pts = c.get("pts")
                    if not pts:
                        pts = [(c["x0"], c["top"]), (c["x1"], c["bottom"])]
                    if len(pts) < 2:
                        continue
                    ls = LineString(pts)
                    if ls.length < 80.0:
                        continue
                    ls_utm = shapely_transform(ls, _pts_to_utm)
                    mid = ls_utm.interpolate(0.5, normalized=True)
                    d = float(mid.distance(osm_union))
                    if d < 50.0:
                        road_dists.append(d)
            if road_dists:
                arr_r = np.array(road_dists, dtype=float)
                road_segment_count = len(road_dists)
                road_median_m = round(float(np.median(arr_r)), 2)
                road_p90_m = round(float(np.percentile(arr_r, 90)), 2)
                road_mean_m = round(float(np.mean(arr_r)), 2)

    ward_median_m: float | None = None
    ward_p90_m: float | None = None
    ward_sample_count = 0
    wards_path = repo_root / "data" / "processed" / jurisdiction_id / "wards.geojson"
    if wards_path.is_file():
        wards_fc = json.loads(wards_path.read_text(encoding="utf-8"))
        to_utm = Transformer.from_crs("EPSG:4326", target_crs, always_xy=True)
        ward_lines = []
        for f in wards_fc.get("features", []):
            g = shape(f["geometry"])
            g_utm = shapely_transform(
                g, lambda c: np.column_stack(to_utm.transform(c[:, 0], c[:, 1]))
            )
            ward_lines.append(g_utm.boundary)
        if ward_lines:
            wards_boundary_union = unary_union(ward_lines)
            b_dists: list[float] = []
            with pdfplumber.open(pdf_path) as pdf:
                page = pdf.pages[page_number - 1]
                for c in page.curves:
                    if (
                        float(c["x0"]) < 80.0
                        or float(c["x1"]) > 2750.0
                        or float(c["top"]) < 80.0
                        or float(c["bottom"]) > 2280.0
                    ):
                        continue
                    sc = c.get("stroking_color")
                    if sc in {
                        (0.698, 0.698, 0.698),
                        (0.431, 0.431, 0.431),
                        (0.0, 0.0, 0.0, 0.5),
                    }:
                        pts = c.get("pts") or []
                        if len(pts) >= 2:
                            ls = LineString(pts)
                            if ls.length >= 40.0:
                                ls_utm = shapely_transform(ls, _pts_to_utm)
                                for frac in np.linspace(0.1, 0.9, 5):
                                    pt = ls_utm.interpolate(float(frac), normalized=True)
                                    d = float(pt.distance(wards_boundary_union))
                                    if d < 60.0:
                                        b_dists.append(d)
            if b_dists:
                arr_b = np.array(b_dists, dtype=float)
                ward_sample_count = len(b_dists)
                ward_median_m = round(float(np.median(arr_b)), 2)
                ward_p90_m = round(float(np.percentile(arr_b, 90)), 2)

    return {
        "road_segment_count": road_segment_count,
        "road_median_offset_m": road_median_m,
        "road_p90_offset_m": road_p90_m,
        "road_mean_offset_m": road_mean_m,
        "ward_sample_count": ward_sample_count,
        "ward_median_offset_m": ward_median_m,
        "ward_p90_offset_m": ward_p90_m,
    }


def extract_traced_zones_from_pdf(
    zoning_cfg: TracedZoningMapConfig,
    boundary_geojson: dict[str, Any],
    repo_root: Path,
    jurisdiction_id: str,
) -> tuple[list[dict[str, Any]], dict[str, Any], dict[str, Any]]:
    """Extract land-use zone polygons from a BDA RMP 2015 PDF sheet using printed-grid UTM georeferencing and legend palette mapping."""
    pdf_path = repo_root / "data" / "raw" / jurisdiction_id / f"{zoning_cfg.document}.pdf"
    if not pdf_path.is_file():
        raise click.ClickException(
            f"Zoning map PDF not found at '{pdf_path}'. Run `bylaws acquire` first."
        )

    grid_eastings = [float(x) for x in (zoning_cfg.grid_eastings or [])]
    grid_northings = [float(y) for y in (zoning_cfg.grid_northings or [])]
    if not grid_eastings or not grid_northings:
        raise click.ClickException(
            f"Traced zoning map '{zoning_cfg.id}' must configure grid_eastings and grid_northings."
        )

    target_crs = str(zoning_cfg.target_crs or "EPSG:32643")
    georef_result = fit_printed_grid_transform(
        pdf_path,
        int(zoning_cfg.page),
        grid_eastings,
        grid_northings,
        target_crs=target_crs,
    )

    overlay_rel_url = f"/data/{jurisdiction_id}/sheets/{zoning_cfg.id}.png"
    overlay_png_path = repo_root / "public" / overlay_rel_url.lstrip("/")
    bounds_wgs84 = render_sheet_overlay_png(
        pdf_path,
        int(zoning_cfg.page),
        georef_result,
        overlay_png_path,
    )
    georef_result["image_url"] = overlay_rel_url
    georef_result["bounds_wgs84"] = bounds_wgs84

    palette_entries = list(zoning_cfg.legend_palette or [])
    if not palette_entries:
        raise click.ClickException(
            f"Traced zoning map '{zoning_cfg.id}' must configure legend_palette entries."
        )

    rgb_to_cls: dict[tuple[int, int, int], int] = {}
    for cls_idx, entry in enumerate(palette_entries, 1):
        for rgb_triplet in entry.rgbs:
            rgb_vals = getattr(rgb_triplet, "root", rgb_triplet)
            rgb_to_cls[(int(rgb_vals[0]), int(rgb_vals[1]), int(rgb_vals[2]))] = cls_idx

    with pdfplumber.open(pdf_path) as pdf:
        page = pdf.pages[int(zoning_cfg.page) - 1]
        strips = [im for im in page.images if float(im["width"]) > 1500.0]
        strips.sort(key=lambda im: float(im["top"]))
        x0_map = float(strips[0]["x0"])
        y0_map = float(strips[0]["top"])
        x1_map = float(strips[0]["x1"])
        y1_map = float(strips[-1]["bottom"])
        width_px = int(strips[0]["srcsize"][0])
        pt_per_px_x = (x1_map - x0_map) / width_px
        height_px = round((y1_map - y0_map) / pt_per_px_x) + 2
        pt_per_px_y = (y1_map - y0_map) / (height_px - 2)
        canvas = np.zeros((height_px, width_px), dtype=np.uint8)

        for im in strips:
            sw, sh = int(im["srcsize"][0]), int(im["srcsize"][1])
            raw = np.frombuffer(im["stream"].get_data(), dtype=np.uint8)
            bits = int(im.get("bits", 8))
            if bits == 4:
                row_bytes = (sw + 1) // 2
                raw_2d = raw.reshape(sh, row_bytes)
                unpacked = np.empty((sh, row_bytes * 2), dtype=np.uint8)
                unpacked[:, 0::2] = raw_2d >> 4
                unpacked[:, 1::2] = raw_2d & 0x0F
                idx_2d = unpacked[:, :sw]
            else:
                idx_2d = raw.reshape(sh, sw)

            pal_bytes = im["colorspace"][0][3]
            if hasattr(pal_bytes, "get_data"):
                pal_bytes = pal_bytes.get_data()
            pal = np.frombuffer(pal_bytes, dtype=np.uint8).reshape(-1, 3)
            lut = np.zeros(256, dtype=np.uint8)
            for idx_val in range(len(pal)):
                rgb_key = (int(pal[idx_val][0]), int(pal[idx_val][1]), int(pal[idx_val][2]))
                lut[idx_val] = rgb_to_cls.get(rgb_key, 0)
            strip_cls = lut[idx_2d]
            r0 = round((float(im["top"]) - y0_map) / pt_per_px_y)
            r1 = min(height_px, r0 + sh)
            sub_s = strip_cls[: r1 - r0, :width_px]
            mask = sub_s > 0
            canvas[r0:r1, :width_px][mask] = sub_s[mask]

    e0, n0 = pdf_xy_to_utm(x0_map, y0_map, georef_result)
    e1, n1 = pdf_xy_to_utm(x0_map + pt_per_px_x, y0_map + pt_per_px_y, georef_result)
    transform_utm = Affine(
        float(e1) - float(e0),
        0.0,
        float(e0),
        0.0,
        float(n1) - float(n0),
        float(n0),
    )

    to_utm = Transformer.from_crs("EPSG:4326", target_crs, always_xy=True)
    to_wgs84 = Transformer.from_crs(target_crs, "EPSG:4326", always_xy=True)

    boundary_shapes = [
        shape(f["geometry"])
        for f in boundary_geojson.get("features", [])
        if isinstance(f, dict) and f.get("geometry")
    ]
    if not boundary_shapes:
        raise click.ClickException("Boundary GeoJSON contains no valid polygon geometries.")
    boundary_union_wgs84 = unary_union(boundary_shapes)
    boundary_union_utm = shapely_transform(
        boundary_union_wgs84,
        lambda c: np.column_stack(to_utm.transform(c[:, 0], c[:, 1])),
    )

    struct3 = np.ones((3, 3), dtype=bool)
    zone_features: list[dict[str, Any]] = []
    seq = 0
    georef_summary = {
        "target_crs": target_crs,
        "gcp_count": int(georef_result["gcp_count"]),
        "rmse_m": float(georef_result["rmse_m"]),
        "loo_rmse_m": float(georef_result["loo_rmse_m"]),
        "max_residual_m": float(georef_result["max_residual_m"]),
    }
    extraction_method = (
        str(getattr(zoning_cfg.kind, "value", zoning_cfg.kind))
        if getattr(zoning_cfg, "kind", None) != "traced"
        else "grid_georeferenced_raster"
    )

    for cls_idx, entry in enumerate(palette_entries, 1):
        mask = canvas == cls_idx
        if not np.any(mask):
            continue
        open_px = int(getattr(entry, "morph_open_px", None) or 0)
        if open_px > 0:
            processed_mask = binary_opening(
                mask, structure=np.ones((open_px, open_px), dtype=bool)
            )
        else:
            processed_mask = binary_closing(mask, structure=struct3)
        if not np.any(processed_mask):
            continue

        min_area = float(getattr(entry, "min_area_sq_m", None) or 1500.0)
        raw_polys: list[BaseGeometry] = []
        for geom_dict, val in rasterio.features.shapes(
            processed_mask.astype(np.uint8),
            mask=processed_mask,
            transform=transform_utm,
        ):
            if val != 1:
                continue
            g = shape(geom_dict).simplify(1.5, preserve_topology=True)
            if not g.is_valid:
                g = make_valid(g)
            g_clip = g.intersection(boundary_union_utm)
            if g_clip.area >= min_area:
                raw_polys.append(g_clip)

        if not raw_polys:
            continue
        merged = unary_union(raw_polys)
        sub_polys = (
            [merged]
            if isinstance(merged, Polygon)
            else list(getattr(merged, "geoms", []))
        )
        sub_polys = [
            p for p in sub_polys if isinstance(p, Polygon) and p.area >= min_area
        ]
        sub_polys.sort(
            key=lambda p: (round(p.centroid.y, 1), round(p.centroid.x, 1))
        )

        for poly_utm in sub_polys:
            poly_wgs84 = _extract_polygonal(
                shapely_transform(
                    poly_utm,
                    lambda c: np.column_stack(to_wgs84.transform(c[:, 0], c[:, 1])),
                )
            )
            if poly_wgs84 is None:
                continue
            seq += 1
            zone_id = f"{zoning_cfg.id}:z{seq:04d}"
            area_sq_m = round(float(poly_utm.area), 2)
            zone_features.append(
                {
                    "type": "Feature",
                    "geometry": _geometry_to_geojson_dict(poly_wgs84),
                    "properties": {
                        "zone_id": zone_id,
                        "record_version": 1,
                        "record_id": f"{zone_id}@v1",
                        "record_supersedes": None,
                        "record_superseded_by": None,
                        "record_change_reason": None,
                        "supersedes": None,
                        "superseded_by": None,
                        "zone_code": entry.zone_code,
                        "zone_label": entry.zone_label,
                        "planning_district": str(zoning_cfg.planning_district),
                        "sheet": str(zoning_cfg.sheet or zoning_cfg.id),
                        "source_map": zoning_cfg.id,
                        "georef_run": georef_summary,
                        "extraction_method": extraction_method,
                        "source_attribution": zoning_cfg.source_attribution,
                        "area_sq_m": area_sq_m,
                        "accuracy_m": float(georef_result["rmse_m"]),
                        "derived": True,
                        "verification": "machine_checked",
                        "verified_by": None,
                        "notes": f"Extracted from {zoning_cfg.sheet or zoning_cfg.id} lossless indexed palette strips; georeferenced via {georef_result['gcp_count']} printed UTM 43N grid crosshairs (RMSE={georef_result['rmse_m']:.4f} m).",
                    },
                }
            )

    independent_checks = _run_independent_sheet_checks(
        pdf_path,
        int(zoning_cfg.page),
        georef_result,
        repo_root,
        jurisdiction_id,
    )
    return zone_features, georef_result, independent_checks


def import_zones_from_geojson(
    zoning_cfg: ImportedZoningMapConfig,
    boundary_geojson: dict[str, Any],
    repo_root: Path,
) -> list[dict[str, Any]]:
    """Read an imported zoning GeoJSON file, reproject to EPSG:4326, clip to `boundary_geojson`, and build Schema v1.3 features."""
    source_path = resolve_local_source_path(zoning_cfg.source_url, repo_root)
    raw_fc = json.loads(source_path.read_text(encoding="utf-8"))
    raw_features = inspect_and_reproject_geojson_features(raw_fc, str(source_path))

    boundary_features = inspect_and_reproject_geojson_features(
        boundary_geojson, "boundary.geojson"
    )
    boundary_shapes = [
        shape(feat["geometry"])
        for feat in boundary_features
        if isinstance(feat, dict) and feat.get("geometry")
    ]
    if not boundary_shapes:
        raise click.ClickException("Boundary GeoJSON contains no valid polygon geometries.")
    boundary_union = unary_union(boundary_shapes)

    zone_features: list[dict[str, Any]] = []
    seq = 0

    for raw_feat in raw_features:
        if not isinstance(raw_feat, dict) or not raw_feat.get("geometry"):
            continue
        props = raw_feat.get("properties") or {}
        raw_code = props.get(zoning_cfg.zone_code_field)
        if raw_code is None or str(raw_code).strip() == "":
            raise click.ClickException(
                f"Feature in '{source_path}' is missing zone_code_field "
                f"'{zoning_cfg.zone_code_field}'."
            )
        zone_code = str(raw_code).strip()

        if zoning_cfg.zone_label_field and props.get(zoning_cfg.zone_label_field):
            zone_label = str(props[zoning_cfg.zone_label_field]).strip()
        else:
            zone_label = zone_code

        planning_district = (
            str(props.get("planning_district") or zoning_cfg.planning_district)
            if (props.get("planning_district") or zoning_cfg.planning_district)
            else None
        )
        sheet = (
            str(props.get("sheet") or zoning_cfg.sheet)
            if (props.get("sheet") or zoning_cfg.sheet)
            else None
        )

        geom = shape(raw_feat["geometry"])
        if not geom.is_valid:
            geom = make_valid(geom)

        clipped = _extract_polygonal(geom.intersection(boundary_union))
        if clipped is None:
            continue

        seq += 1
        zone_id = f"{zoning_cfg.id}:z{seq:04d}"
        area_sq_m = compute_geodesic_area_sq_m(clipped)

        zone_features.append(
            {
                "type": "Feature",
                "geometry": _geometry_to_geojson_dict(clipped),
                "properties": {
                    "zone_id": zone_id,
                    "record_version": 1,
                    "record_id": f"{zone_id}@v1",
                    "record_supersedes": None,
                    "record_superseded_by": None,
                    "record_change_reason": None,
                    "supersedes": None,
                    "superseded_by": None,
                    "zone_code": zone_code,
                    "zone_label": zone_label,
                    "planning_district": planning_district,
                    "sheet": sheet,
                    "source_map": zoning_cfg.id,
                    "georef_run": "imported-v1",
                    "extraction_method": "imported",
                    "source_attribution": zoning_cfg.source_attribution,
                    "area_sq_m": area_sq_m,
                    "verification": "machine_checked",
                    "verified_by": None,
                    "notes": None,
                },
            }
        )

    return zone_features
