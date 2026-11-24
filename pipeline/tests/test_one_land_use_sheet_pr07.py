"""Falsifiable tests for PR 07 — One Land-Use Sheet (Checkpoint 3)."""

from __future__ import annotations

import json

from shapely.geometry import shape

from bylaws.config import load_jurisdiction_config
from bylaws.provenance import check_repository_provenance, validate_retrieval_record
from bylaws.root import resolve_repo_root
from bylaws.schema_validator import validate_file

REPO_ROOT = resolve_repo_root()
RELEASE_DIR = REPO_ROOT / "public" / "data" / "in-ka-bengaluru-south" / "2.2.0"


def test_rmp2015_index_and_chosen_sheet_acquired_and_documented_in_docs_map() -> None:
    """`docs/map.md` lists all RMP 2015 planning district sheets intersecting Bengaluru South, and `in-ka-bengaluru-south.yaml` configures one chosen sheet with R15 retrieval metadata."""
    check_repository_provenance(REPO_ROOT)

    config = load_jurisdiction_config("in-ka-bengaluru-south")
    assert config.release_version in {"2.2.0", "2.3.0", "2.4.0", "2.5.0", "2.6.0", "2.7.0", "2.8.0", "3.0.0"}
    assert config.maps.planning_districts is not None
    assert len(config.maps.planning_districts) >= 1
    assert len(config.maps.zoning) >= 1

    zoning_cfg = config.maps.zoning[0]
    doc_by_id = {d.id: d for d in config.documents}
    assert zoning_cfg.document in doc_by_id
    sheet_doc = doc_by_id[zoning_cfg.document]
    assert sheet_doc.acquisition_status == "acquired"
    assert sheet_doc.retrieval is not None
    validate_retrieval_record(
        sheet_doc.retrieval.model_dump(),
        context=f"in-ka-bengaluru-south:{sheet_doc.id}",
    )

    docs_map_text = (REPO_ROOT / "docs" / "map.md").read_text(encoding="utf-8")
    assert "RMP 2015" in docs_map_text
    assert "Planning District" in docs_map_text
    assert "204" in docs_map_text
    assert "Benson Town" in docs_map_text
    assert "PR 11" in docs_map_text


def test_one_sheet_zones_georeferenced_by_printed_grid_and_validated() -> None:
    """`zones.geojson` and `planning-districts.geojson` are published in Release 2.2.0 with printed-grid UTM 43N georeferencing (`rmse_m <= 10.0`), legend-matched codes, and valid geometries inside `boundary.geojson`."""
    assert RELEASE_DIR.is_dir(), f"Missing Release 2.2.0 directory at {RELEASE_DIR}"

    zones_fc = validate_file(RELEASE_DIR / "zones.geojson", "zones")
    features = zones_fc["features"]
    assert len(features) >= 10, f"Expected >= 10 extracted land-use polygons, got {len(features)}"

    corp_fc = json.loads((RELEASE_DIR / "boundary.geojson").read_text(encoding="utf-8"))
    corp_geom = shape(corp_fc["features"][0]["geometry"])

    zone_codes: set[str] = set()
    for feat in features:
        props = feat["properties"]
        assert props["derived"] is True
        assert props["verification"] == "machine_checked"
        assert props["extraction_method"] in {"vector_pdf", "grid_georeferenced_raster"}
        assert props["zone_code"]
        assert props["zone_label"]
        zone_codes.add(props["zone_code"])

        georef = props["georef_run"]
        assert georef["target_crs"] == "EPSG:32643"
        assert georef["gcp_count"] >= 4
        assert float(georef["rmse_m"]) <= 10.0
        assert float(georef["loo_rmse_m"]) <= 15.0

        geom = shape(feat["geometry"])
        assert geom.is_valid
        assert not geom.is_empty
        # Clipped to corporation boundary (allowing tiny float rounding tolerance)
        assert geom.difference(corp_geom.buffer(1e-5)).area < 1e-8

    assert len(zone_codes) >= 3, f"Expected at least 3 distinct legend zone codes, got {zone_codes}"

    pd_path = RELEASE_DIR / "planning-districts.geojson"
    assert pd_path.is_file()
    pd_fc = json.loads(pd_path.read_text(encoding="utf-8"))
    assert len(pd_fc["features"]) >= 1


def test_independent_road_and_ward_checks_and_sheet_overlay_published() -> None:
    """`map-verification.md` records grid residuals, LOO RMSE, and independent road/ward offset metrics, and `geo-layers.json` + sheet overlay PNG are published."""
    geo_layers = validate_file(RELEASE_DIR / "geo-layers.json", "geo-layers")
    by_id = {lyr["layer_id"]: lyr for lyr in geo_layers["layers"]}
    assert "planning_districts" in by_id
    assert "landuse_zones" in by_id
    zones_layer = by_id["landuse_zones"]
    assert zones_layer["kind"] == "master_plan_zone"
    assert zones_layer["derived"] is True
    assert zones_layer["accuracy_m"] is not None and float(zones_layer["accuracy_m"]) <= 10.0

    sheet_overlay = zones_layer.get("sheet_overlay")
    assert isinstance(sheet_overlay, dict), "Missing sheet_overlay metadata on landuse_zones layer"
    assert sheet_overlay.get("image_url")
    overlay_rel = str(sheet_overlay["image_url"]).lstrip("/")
    overlay_file = REPO_ROOT / "public" / overlay_rel
    assert overlay_file.is_file(), f"Missing rendered sheet overlay PNG at {overlay_file}"
    bounds_wgs84 = sheet_overlay.get("bounds_wgs84")
    assert isinstance(bounds_wgs84, list) and len(bounds_wgs84) == 4

    ver_text = (
        REPO_ROOT / "data" / "reports" / "in-ka-bengaluru-south" / "map-verification.md"
    ).read_text(encoding="utf-8")
    assert "Leave-One-Out" in ver_text or "LOO RMSE" in ver_text
    assert "OpenStreetMap" in ver_text
    assert "90th" in ver_text or "p90" in ver_text.lower()
    assert "Legend Colour Mapping Table" in ver_text

    declarations = validate_file(RELEASE_DIR / "declarations.json", "declarations")
    not_modelled_joined = " ".join(declarations.get("not_modelled") or [])
    assert "1 of 10 Planning Districts" in not_modelled_joined
    assert "PR 11" in not_modelled_joined
