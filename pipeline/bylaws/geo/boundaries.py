"""Stage 8.1 / 9: Boundary KML/GeoJSON conversion, CRS validation/reprojection, and polygon selection."""

from __future__ import annotations

import json
import xml.etree.ElementTree as ET
from pathlib import Path
from typing import Any

import click
from pyproj import Transformer
from pyproj.exceptions import CRSError

WGS84_CRS_NAMES: frozenset[str] = frozenset(
    {
        "EPSG:4326",
        "CRS84",
        "URN:OGC:DEF:CRS:OGC:1.3:CRS84",
        "URN:OGC:DEF:CRS:EPSG::4326",
    }
)


def _strip_tag(tag: str) -> str:
    return tag.split("}", 1)[-1] if "}" in tag else tag


def _iter_coords_from_geometry(geom: dict[str, Any]) -> list[list[float]]:
    gtype = geom.get("type")
    coords = geom.get("coordinates") or []
    pts: list[list[float]] = []
    if gtype == "Polygon":
        for ring in coords:
            pts.extend(ring)
    elif gtype == "MultiPolygon":
        for poly in coords:
            for ring in poly:
                pts.extend(ring)
    return pts


def _transform_ring(ring: list[list[float]], transformer: Transformer) -> list[list[float]]:
    out: list[list[float]] = []
    for pt in ring:
        lon, lat = transformer.transform(float(pt[0]), float(pt[1]))
        out.append([round(float(lon), 6), round(float(lat), 6)])
    if out and out[0] != out[-1]:
        out.append(list(out[0]))
    return out


def _reproject_geometry_to_wgs84(geom: dict[str, Any], transformer: Transformer) -> dict[str, Any]:
    gtype = geom.get("type")
    coords = geom.get("coordinates") or []
    if gtype == "Polygon":
        return {
            "type": "Polygon",
            "coordinates": [_transform_ring(ring, transformer) for ring in coords],
        }
    if gtype == "MultiPolygon":
        return {
            "type": "MultiPolygon",
            "coordinates": [
                [_transform_ring(ring, transformer) for ring in poly]
                for poly in coords
            ],
        }
    return geom


def inspect_and_reproject_geojson_features(
    raw_geojson: Any,
    source_label: str,
) -> list[dict[str, Any]]:
    """Validate GeoJSON CRS metadata and reproject features to EPSG:4326 (WGS 84) if needed (Rule R5/R7)."""
    if not isinstance(raw_geojson, dict):
        raise click.ClickException(
            f"Invalid GeoJSON object in '{source_label}': expected FeatureCollection dict."
        )

    features: list[dict[str, Any]] = list(raw_geojson.get("features") or [])

    has_crs_key = "crs" in raw_geojson
    crs_obj = raw_geojson.get("crs")
    declared_crs: str | None = None

    if has_crs_key:
        if crs_obj is None:
            raise click.ClickException(
                f"Geospatial source '{source_label}' lacks a declared CRS (explicit crs: null)."
            )
        if isinstance(crs_obj, dict):
            props = crs_obj.get("properties")
            if isinstance(props, dict) and isinstance(props.get("name"), str) and props["name"].strip():
                declared_crs = props["name"].strip()
            elif isinstance(crs_obj.get("name"), str) and crs_obj["name"].strip():
                declared_crs = crs_obj["name"].strip()
        if not declared_crs:
            raise click.ClickException(
                f"Geospatial source '{source_label}' has an invalid or empty CRS declaration."
            )

    if declared_crs and declared_crs.upper() not in WGS84_CRS_NAMES:
        try:
            transformer = Transformer.from_crs(declared_crs, "EPSG:4326", always_xy=True)
        except CRSError as exc:
            raise click.ClickException(
                f"Unsupported CRS '{declared_crs}' in '{source_label}': {exc}"
            ) from exc

        reprojected: list[dict[str, Any]] = []
        for feat in features:
            if not isinstance(feat, dict) or not feat.get("geometry"):
                continue
            new_feat = dict(feat)
            new_feat["geometry"] = _reproject_geometry_to_wgs84(feat["geometry"], transformer)
            reprojected.append(new_feat)
        return reprojected

    # When no non-4326 CRS is declared, verify coordinates lie within valid WGS 84 bounds
    for feat in features:
        if not isinstance(feat, dict) or not feat.get("geometry"):
            continue
        for pt in _iter_coords_from_geometry(feat["geometry"]):
            if len(pt) >= 2 and (abs(float(pt[0])) > 180.0 or abs(float(pt[1])) > 90.0):
                raise click.ClickException(
                    f"Geospatial source '{source_label}' lacks a declared CRS and contains "
                    f"out-of-range coordinates ({pt[0]}, {pt[1]})."
                )

    return features


def _parse_kml_coordinates(coord_text: str, source_label: str = "KML") -> list[list[float]]:
    ring: list[list[float]] = []
    for token in coord_text.strip().split():
        parts = [p for p in token.split(",") if p != ""]
        if len(parts) >= 2:
            lon = round(float(parts[0]), 6)
            lat = round(float(parts[1]), 6)
            if abs(lon) > 180.0 or abs(lat) > 90.0:
                raise click.ClickException(
                    f"Geospatial KML source '{source_label}' contains non-WGS84 coordinates ({lon}, {lat})."
                )
            ring.append([lon, lat])
    if ring and ring[0] != ring[-1]:
        ring.append(list(ring[0]))
    return ring


def _extract_polygon_rings(polygon_elem: ET.Element, source_label: str) -> list[list[list[float]]]:
    rings: list[list[list[float]]] = []
    for child in polygon_elem.iter():
        tag = _strip_tag(child.tag)
        if tag in {"outerBoundaryIs", "innerBoundaryIs"}:
            for sub in child.iter():
                if _strip_tag(sub.tag) == "coordinates" and sub.text:
                    parsed = _parse_kml_coordinates(sub.text, source_label)
                    if len(parsed) >= 4:
                        rings.append(parsed)
    return rings


def _parse_kml_placemarks(source_path: Path) -> list[dict[str, Any]]:
    try:
        tree = ET.parse(source_path)
    except ET.ParseError as exc:
        raise click.ClickException(f"Invalid KML XML in '{source_path}': {exc}") from exc

    root = tree.getroot()
    features: list[dict[str, Any]] = []
    label = str(source_path)

    for elem in root.iter():
        if _strip_tag(elem.tag) != "Placemark":
            continue

        props: dict[str, Any] = {}
        polygons: list[list[list[list[float]]]] = []

        for child in elem:
            ctag = _strip_tag(child.tag)
            if ctag == "name" and child.text:
                props["name"] = child.text.strip()
            elif ctag == "ExtendedData":
                for data_elem in child.iter():
                    dtag = _strip_tag(data_elem.tag)
                    if dtag == "Data":
                        key = data_elem.attrib.get("name")
                        val_text = None
                        for sub in data_elem:
                            if _strip_tag(sub.tag) == "value" and sub.text is not None:
                                val_text = sub.text.strip()
                        if key and val_text is not None:
                            props[key] = val_text
                    elif dtag == "SimpleData":
                        key = data_elem.attrib.get("name")
                        if key and data_elem.text is not None:
                            props[key] = data_elem.text.strip()
            elif ctag == "Polygon":
                rings = _extract_polygon_rings(child, label)
                if rings:
                    polygons.append(rings)
            elif ctag == "MultiGeometry":
                for sub in child.iter():
                    if _strip_tag(sub.tag) == "Polygon":
                        rings = _extract_polygon_rings(sub, label)
                        if rings:
                            polygons.append(rings)

        if not polygons:
            continue

        geometry: dict[str, Any]
        if len(polygons) == 1:
            geometry = {"type": "Polygon", "coordinates": polygons[0]}
        else:
            geometry = {"type": "MultiPolygon", "coordinates": polygons}

        features.append(
            {
                "type": "Feature",
                "properties": props,
                "geometry": geometry,
            }
        )

    return features


def extract_boundary_feature(
    source_path: Path,
    property_name: str,
    equals_value: str,
) -> dict[str, Any]:
    """Select boundary polygon(s) matching `property_name == equals_value` from KML or GeoJSON."""
    if not source_path.is_file():
        raise click.ClickException(f"Boundary source file not found: {source_path}")

    suffix = source_path.suffix.lower()
    if suffix == ".kml":
        features = _parse_kml_placemarks(source_path)
    elif suffix in {".geojson", ".json"}:
        raw = json.loads(source_path.read_text(encoding="utf-8"))
        features = inspect_and_reproject_geojson_features(raw, str(source_path))
    else:
        raise click.ClickException(
            f"Unsupported boundary format '{suffix}' for '{source_path}'."
        )

    if equals_value == "*":
        matched = list(features)
    else:
        matched = [
            feat
            for feat in features
            if str(feat.get("properties", {}).get(property_name, "")) == str(equals_value)
        ]
    if not matched:
        raise click.ClickException(
            f"No boundary feature in '{source_path}' matched "
            f"{property_name}={equals_value!r}."
        )

    return {
        "type": "FeatureCollection",
        "features": matched,
    }
