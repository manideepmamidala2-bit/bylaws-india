"""Stage 9.5: Zoning polygon import, clipping, area computation, and vectorization."""

from __future__ import annotations

import json
import math
from pathlib import Path
from typing import Any

import click
from shapely import make_valid
from shapely.affinity import scale
from shapely.geometry import MultiPolygon, Polygon, mapping, shape
from shapely.geometry.base import BaseGeometry
from shapely.ops import unary_union

from bylaws.config import ImportedZoningMapConfig
from bylaws.root import resolve_local_source_path

METRES_PER_DEGREE_LAT = 111_319.49


def extract_zone_polygons(geotiff_path: Path, legend_entries: list[dict[str, Any]]) -> dict[str, Any]:
    """Placeholder interface for extracting GeoJSON zone polygons from a georeferenced map (M6)."""
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


def compute_geodesic_area_sq_m(geom: BaseGeometry) -> float:
    """Compute approximate area in square metres for a WGS84 polygon using local equirectangular scaling."""
    if geom.is_empty:
        return 0.0
    centroid = geom.centroid
    lat_rad = math.radians(centroid.y)
    m_per_deg_lon = METRES_PER_DEGREE_LAT * math.cos(lat_rad)
    m_per_deg_lat = METRES_PER_DEGREE_LAT
    projected = scale(geom, xfact=m_per_deg_lon, yfact=m_per_deg_lat, origin=(0.0, 0.0))
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


def import_zones_from_geojson(
    zoning_cfg: ImportedZoningMapConfig,
    boundary_geojson: dict[str, Any],
    repo_root: Path,
) -> list[dict[str, Any]]:
    """Read an imported zoning GeoJSON file, clip to `boundary_geojson`, and build Schema v1.1 features."""
    source_path = resolve_local_source_path(zoning_cfg.source_url, repo_root)
    raw_fc = json.loads(source_path.read_text(encoding="utf-8"))
    raw_features = raw_fc.get("features", []) if isinstance(raw_fc, dict) else []

    boundary_shapes = [
        shape(feat["geometry"])
        for feat in boundary_geojson.get("features", [])
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
                    "record_id": f"{zone_id}@v1",
                    "supersedes": None,
                    "superseded_by": None,
                    "zone_code": zone_code,
                    "zone_label": zone_label,
                    "source_map": zoning_cfg.id,
                    "georef_run": "imported-v1",
                    "extraction_method": "imported",
                    "source_attribution": zoning_cfg.source_attribution,
                    "area_sq_m": area_sq_m,
                    "verification": "machine_checked",
                    "notes": None,
                },
            }
        )

    return zone_features
