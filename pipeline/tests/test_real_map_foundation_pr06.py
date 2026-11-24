"""Falsifiable tests for PR 06 — Real Map Foundation and Official Boundaries."""

from __future__ import annotations

import hashlib
import json

from shapely.geometry import shape

from bylaws.config import load_jurisdiction_config
from bylaws.geo.boundaries import _parse_kml_placemarks
from bylaws.provenance import check_repository_provenance, validate_retrieval_record
from bylaws.root import resolve_repo_root
from bylaws.schema_validator import validate_file

REPO_ROOT = resolve_repo_root()
RELEASE_DIR = REPO_ROOT / "public" / "data" / "in-ka-bengaluru-south" / "2.1.0"
PM_TILES_PATH = REPO_ROOT / "public" / "data" / "in-ka-bengaluru-south" / "basemap.pmtiles"


def test_official_gba_boundaries_acquired_with_retrieval_records_and_valid_geometries() -> None:
    """Corporation, GBA zones, and wards boundaries are configured with R15 retrieval records and published with valid geometries matching source coordinates."""
    check_repository_provenance(REPO_ROOT)

    config = load_jurisdiction_config("in-ka-bengaluru-south")
    assert len(config.maps.boundaries) >= 3, (
        f"Expected >= 3 boundary layers (corporation, gba_zones, wards), got {len(config.maps.boundaries)}"
    )

    for b_cfg in config.maps.boundaries:
        assert b_cfg.source_url.startswith(("http://", "https://"))
        assert b_cfg.retrieval is not None
        validate_retrieval_record(
            b_cfg.retrieval.model_dump(mode="json"),
            f"in-ka-bengaluru-south:maps.boundaries.{b_cfg.id}",
        )

    corp_fc = json.loads((RELEASE_DIR / "boundary.geojson").read_text(encoding="utf-8"))
    zones_fc = json.loads((RELEASE_DIR / "gba-zones.geojson").read_text(encoding="utf-8"))
    wards_fc = json.loads((RELEASE_DIR / "wards.geojson").read_text(encoding="utf-8"))

    assert len(corp_fc["features"]) == 1, "Expected 1 Bengaluru South City Corporation boundary polygon"
    assert len(zones_fc["features"]) == 2, "Expected 2 GBA zones for Bengaluru South City Corporation"
    assert len(wards_fc["features"]) >= 60, (
        f"Expected >= 60 wards in Bengaluru South City Corporation, got {len(wards_fc['features'])}"
    )

    for layer_name, fc in [
        ("boundary.geojson", corp_fc),
        ("gba-zones.geojson", zones_fc),
        ("wards.geojson", wards_fc),
    ]:
        for feat in fc["features"]:
            geom = shape(feat["geometry"])
            assert geom.is_valid, f"Invalid geometry in {layer_name}: {feat.get('properties')}"
            assert not geom.is_empty
            minx, miny, maxx, maxy = geom.bounds
            assert 77.3 <= minx <= maxx <= 77.85
            assert 12.7 <= miny <= maxy <= 13.2

    # Verify published ward polygon coordinates match the raw KML coordinates
    raw_wards_kml = REPO_ROOT / "data" / "raw" / "in-ka-bengaluru-south" / "boundary_wards.kml"
    if raw_wards_kml.is_file():
        kml_feats = _parse_kml_placemarks(raw_wards_kml)
        kml_by_wid = {
            str(f["properties"].get("ward_id")): f["geometry"]
            for f in kml_feats
            if f["properties"].get("Corporation") == "South"
        }
        matched_exact = 0
        for pub_feat in wards_fc["features"]:
            props = pub_feat["properties"]
            wid = str(props.get("ward_id"))
            if not props.get("geometry_repaired") and wid in kml_by_wid:
                assert pub_feat["geometry"] == kml_by_wid[wid], (
                    f"Ward {wid} coordinates do not match source KML"
                )
                matched_exact += 1
        assert matched_exact >= 60


def test_geo_layers_and_map_verification_report_published() -> None:
    """`geo-layers.json` publishes `corporation`, `gba_zones`, and `wards` (`kind: official_boundary`), and `map-verification.md` + `docs/map.md` exist."""
    geo_layers = validate_file(RELEASE_DIR / "geo-layers.json", "geo-layers")
    by_id = {lyr["layer_id"]: lyr for lyr in geo_layers["layers"]}
    for req_layer in ("corporation", "gba_zones", "wards"):
        assert req_layer in by_id, f"Missing layer '{req_layer}' in geo-layers.json"
        assert by_id[req_layer]["kind"] == "official_boundary"
        assert by_id[req_layer]["derived"] is False

    map_ver_path = REPO_ROOT / "data" / "reports" / "in-ka-bengaluru-south" / "map-verification.md"
    assert map_ver_path.is_file()
    ver_text = map_ver_path.read_text(encoding="utf-8")
    assert "Bengaluru South" in ver_text
    assert "Ward" in ver_text

    docs_map_path = REPO_ROOT / "docs" / "map.md"
    assert docs_map_path.is_file()
    docs_map_text = docs_map_path.read_text(encoding="utf-8")
    assert "PMTiles" in docs_map_text
    assert "Range" in docs_map_text
    pmtiles_sha = hashlib.sha256(PM_TILES_PATH.read_bytes()).hexdigest()
    assert pmtiles_sha in docs_map_text


def test_pmtiles_basemap_and_maplibre_replace_leaflet_and_remove_svg_schematic() -> None:
    """`basemap.pmtiles` has a valid PMTiles v3 magic header, `package.json` uses `maplibre-gl` + `pmtiles`, and `ZoneMap.tsx` has zero SVG schematic code."""
    assert PM_TILES_PATH.is_file(), f"Missing {PM_TILES_PATH}"
    raw_header = PM_TILES_PATH.read_bytes()[:512]
    assert raw_header[:7] == b"PMTiles", "Invalid PMTiles v3 magic bytes"
    assert raw_header[7] == 3, "Expected PMTiles version 3"

    pkg_json = json.loads((REPO_ROOT / "package.json").read_text(encoding="utf-8"))
    deps = pkg_json.get("dependencies", {})
    assert "maplibre-gl" in deps
    assert "pmtiles" in deps
    assert "leaflet" not in deps
    assert "react-leaflet" not in deps

    zone_map_tsx = (REPO_ROOT / "components" / "ZoneMap.tsx").read_text(encoding="utf-8")
    assert "maplibre-gl" in zone_map_tsx
    assert "pmtiles" in zone_map_tsx
    assert "OpenStreetMap contributors" in zone_map_tsx
    assert "Protomaps" in zone_map_tsx
    assert "Schematic" not in zone_map_tsx
    assert "react-leaflet" not in zone_map_tsx
