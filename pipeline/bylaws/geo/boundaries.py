"""Stage 8.1 / 9: Boundary KML/GeoJSON conversion and polygon selection."""

from __future__ import annotations

import json
import xml.etree.ElementTree as ET
from pathlib import Path
from typing import Any

import click


def _strip_tag(tag: str) -> str:
    return tag.split("}", 1)[-1] if "}" in tag else tag


def _parse_kml_coordinates(coord_text: str) -> list[list[float]]:
    ring: list[list[float]] = []
    for token in coord_text.strip().split():
        parts = [p for p in token.split(",") if p != ""]
        if len(parts) >= 2:
            lon = round(float(parts[0]), 6)
            lat = round(float(parts[1]), 6)
            ring.append([lon, lat])
    if ring and ring[0] != ring[-1]:
        ring.append(list(ring[0]))
    return ring


def _extract_polygon_rings(polygon_elem: ET.Element) -> list[list[list[float]]]:
    rings: list[list[list[float]]] = []
    for child in polygon_elem.iter():
        tag = _strip_tag(child.tag)
        if tag in {"outerBoundaryIs", "innerBoundaryIs"}:
            for sub in child.iter():
                if _strip_tag(sub.tag) == "coordinates" and sub.text:
                    parsed = _parse_kml_coordinates(sub.text)
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
                rings = _extract_polygon_rings(child)
                if rings:
                    polygons.append(rings)
            elif ctag == "MultiGeometry":
                for sub in child.iter():
                    if _strip_tag(sub.tag) == "Polygon":
                        rings = _extract_polygon_rings(sub)
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
    """Select a boundary polygon matching `property_name == equals_value` from KML or GeoJSON."""
    if not source_path.is_file():
        raise click.ClickException(f"Boundary source file not found: {source_path}")

    suffix = source_path.suffix.lower()
    if suffix == ".kml":
        features = _parse_kml_placemarks(source_path)
    elif suffix in {".geojson", ".json"}:
        raw = json.loads(source_path.read_text(encoding="utf-8"))
        features = raw.get("features", []) if isinstance(raw, dict) else []
    else:
        raise click.ClickException(
            f"Unsupported boundary format '{suffix}' for '{source_path}'."
        )

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
