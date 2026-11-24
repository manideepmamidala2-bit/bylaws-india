"""Part A Foundations tests (Plan v2.0 §5.A1, Rules R1, R2, R4, R6, R7, R9, R11, R12)."""

from __future__ import annotations

import importlib.metadata
import json
import shutil
from pathlib import Path

import click
import pytest
import yaml
from click.testing import CliRunner
from pyproj import Transformer

from bylaws.cli import main
from bylaws.config import load_jurisdiction_config, validate_jurisdiction_dict
from bylaws.geo.boundaries import extract_boundary_feature
from bylaws.geo.zones import import_zones_from_geojson
from bylaws.overrides import run_apply_overrides
from bylaws.publish import run_publish
from bylaws.root import resolve_repo_root, set_cli_root

REPO_ROOT = resolve_repo_root()


def _prepare_isolated_root(tmp_path: Path) -> Path:
    isolated = tmp_path / "workspace"
    isolated.mkdir(parents=True, exist_ok=True)
    shutil.copy2(REPO_ROOT / "bylaws.toml", isolated / "bylaws.toml")
    shutil.copytree(REPO_ROOT / "schemas", isolated / "schemas")
    shutil.copytree(REPO_ROOT / "jurisdictions", isolated / "jurisdictions")
    shutil.copytree(
        REPO_ROOT / "data" / "overrides" / "xx-test-fixture",
        isolated / "data" / "overrides" / "xx-test-fixture",
    )
    shutil.copytree(
        REPO_ROOT / "pipeline" / "tests" / "fixtures",
        isolated / "pipeline" / "tests" / "fixtures",
    )
    return isolated


def test_apply_overrides_is_idempotent_and_populates_r12_fields(tmp_path: Path) -> None:
    """Running `apply-overrides` multiple times in a row is byte-identical and populates R12 fields."""
    isolated = _prepare_isolated_root(tmp_path)
    runner = CliRunner()
    try:
        for stage in ("acquire", "parse", "structure", "amendments", "geo"):
            res = runner.invoke(
                main,
                ["--root", str(isolated), stage, "--jurisdiction", "xx-test-fixture"],
            )
            assert res.exit_code == 0, f"{stage} failed: {res.output}"

        res1 = runner.invoke(
            main,
            ["--root", str(isolated), "apply-overrides", "--jurisdiction", "xx-test-fixture"],
        )
        assert res1.exit_code == 0, res1.output
    finally:
        set_cli_root(None)

    base_clauses_path = (
        isolated
        / "data"
        / "processed"
        / "xx-test-fixture"
        / "documents"
        / "fixture-base-2020.clauses.json"
    )
    zones_path = isolated / "data" / "processed" / "xx-test-fixture" / "zones.geojson"
    tags_path = isolated / "data" / "processed" / "xx-test-fixture" / "clause-zone-tags.json"

    assert tags_path.is_file(), "Expected clause-zone-tags.json to be written by apply-overrides"

    first_clauses_bytes = base_clauses_path.read_bytes()
    first_zones_bytes = zones_path.read_bytes()
    first_tags_bytes = tags_path.read_bytes()

    # Run apply-overrides a 2nd and 3rd time
    try:
        for _ in range(2):
            res_repeat = runner.invoke(
                main,
                ["--root", str(isolated), "apply-overrides", "--jurisdiction", "xx-test-fixture"],
            )
            assert res_repeat.exit_code == 0, res_repeat.output
    finally:
        set_cli_root(None)

    assert base_clauses_path.read_bytes() == first_clauses_bytes
    assert zones_path.read_bytes() == first_zones_bytes
    assert tags_path.read_bytes() == first_tags_bytes

    clauses = json.loads(base_clauses_path.read_text(encoding="utf-8"))["clauses"]
    c11_versions = [c for c in clauses if c["clause_id"] == "fixture-base-2020:1.1"]
    assert len(c11_versions) == 2
    v1, v2 = c11_versions[0], c11_versions[1]
    assert v1["record_version"] == 1
    assert v1["record_superseded_by"] == "fixture-base-2020:1.1@v2"
    assert v1["legal_status"] == "in_force"
    assert v2["record_version"] == 2
    assert v2["record_supersedes"] == "fixture-base-2020:1.1@v1"
    assert v2["record_superseded_by"] is None
    assert v2["record_change_reason"] == "Refine heading on human_verified clause (triggers R9 supersede @v2)"
    assert v2["legal_status"] == "in_force"


def test_apply_overrides_rejects_unknown_map_id_in_map_curations(tmp_path: Path) -> None:
    """`apply-overrides` raises ClickException when `map_curations` references an unknown `map_id` (A-023)."""
    isolated = _prepare_isolated_root(tmp_path)
    runner = CliRunner()
    try:
        for stage in ("acquire", "parse", "structure", "geo"):
            runner.invoke(
                main,
                ["--root", str(isolated), stage, "--jurisdiction", "xx-test-fixture"],
            )
    finally:
        set_cli_root(None)

    bad_curation = isolated / "data" / "overrides" / "xx-test-fixture" / "99-bad-map.yaml"
    bad_curation.write_text(
        'schema_version: "1.3"\n'
        "map_curations:\n"
        "  - map_id: unknown-map-id-999\n"
        "    legend_entries:\n"
        "      - zone_code: Z1\n"
        "        zone_label: Residential\n"
        "        rgb: [250, 215, 100]\n",
        encoding="utf-8",
    )

    config = load_jurisdiction_config(
        "xx-test-fixture",
        jurisdictions_dir=isolated / "jurisdictions",
        schemas_dir=isolated / "schemas",
    )
    with pytest.raises(click.ClickException, match="unknown-map-id-999"):
        run_apply_overrides(config, repo_root=isolated)


def test_publish_fails_on_unreadable_manifest_and_preserves_multi_jurisdiction_releases(
    tmp_path: Path,
) -> None:
    """`publish` fails on malformed manifest.json (A-021) and preserves other jurisdictions & prior releases (R3)."""
    isolated = _prepare_isolated_root(tmp_path)
    runner = CliRunner()
    try:
        for stage in ("acquire", "parse", "structure", "amendments", "geo", "apply-overrides", "validate"):
            res = runner.invoke(
                main,
                ["--root", str(isolated), stage, "--jurisdiction", "xx-test-fixture"],
            )
            assert res.exit_code == 0, res.output
    finally:
        set_cli_root(None)

    config = load_jurisdiction_config(
        "xx-test-fixture",
        jurisdictions_dir=isolated / "jurisdictions",
        schemas_dir=isolated / "schemas",
    )

    manifest_path = isolated / "public" / "data" / "manifest.json"
    manifest_path.parent.mkdir(parents=True, exist_ok=True)
    manifest_path.write_text("{corrupted-json-manifest", encoding="utf-8")

    with pytest.raises(click.ClickException, match="manifest"):
        run_publish(config, repo_root=isolated, release_version="0.1.0")

    # Seed valid manifest with another jurisdiction + prior release 0.0.9 for xx-test-fixture
    seeded_manifest = {
        "schema_version": "1.3",
        "jurisdictions": [
            {
                "id": "in-mh-other-city",
                "name": "Other City Corporation",
                "visibility": "public",
                "latest_release": "1.0.0",
                "releases": [
                    {
                        "version": "1.0.0",
                        "released_at": "2026-11-23T00:00:00Z",
                        "licence": "CC BY 4.0",
                        "download_zip": "/data/in-mh-other-city/1.0.0/in-mh-other-city-1.0.0.zip",
                        "sha256sums": "/data/in-mh-other-city/1.0.0/SHA256SUMS",
                        "declarations": "/data/in-mh-other-city/1.0.0/declarations.json",
                        "files": {
                            "documents": "/data/in-mh-other-city/1.0.0/documents.json",
                            "clauses": [],
                            "amendments": "/data/in-mh-other-city/1.0.0/amendments.json",
                            "zones": "/data/in-mh-other-city/1.0.0/zones.geojson",
                            "boundary": "/data/in-mh-other-city/1.0.0/boundary.geojson",
                            "review_images": [],
                        },
                        "drafts": {"clauses": []},
                        "changelog": "Release 1.0.0",
                    }
                ],
            }
        ],
    }
    manifest_path.write_text(json.dumps(seeded_manifest, indent=2) + "\n", encoding="utf-8")

    run_publish(config, repo_root=isolated, release_version="0.1.0")
    run_publish(config, repo_root=isolated, release_version="0.2.0")

    updated = json.loads(manifest_path.read_text(encoding="utf-8"))
    j_ids = [j["id"] for j in updated["jurisdictions"]]
    assert "in-mh-other-city" in j_ids
    assert "xx-test-fixture" in j_ids

    fixture_j = next(j for j in updated["jurisdictions"] if j["id"] == "xx-test-fixture")
    assert fixture_j["visibility"] == "test"
    assert fixture_j["latest_release"] == "0.2.0"
    versions = [r["version"] for r in fixture_j["releases"]]
    assert "0.1.0" in versions
    assert "0.2.0" in versions
    assert fixture_j["releases"][-1]["licence"] == "CC BY 4.0"

    # Verify sources.json and sources.csv are exported
    rel_dir = isolated / "public" / "data" / "xx-test-fixture" / "0.2.0"
    assert (rel_dir / "sources.json").is_file()
    assert (rel_dir / "sources.csv").is_file()


def test_zero_country_xx_branches_and_real_parser_version() -> None:
    """No pipeline module branches on `country == 'XX'`, and parser version is real (R4)."""
    for py_path in sorted((REPO_ROOT / "pipeline" / "bylaws").rglob("*.py")):
        if py_path.name == "_generated.py":
            continue
        text = py_path.read_text(encoding="utf-8")
        assert 'country == "XX"' not in text, f"Found country == 'XX' branch in {py_path}"
        assert "country == 'XX'" not in text, f"Found country == 'XX' branch in {py_path}"
        assert "_fixture-test" not in text, f"Found _fixture-test literal in {py_path}"
        assert "xx-test-fixture" not in text, f"Found xx-test-fixture literal in {py_path}"

    from bylaws.parsers.pypdfium2_adapter import Pypdfium2Adapter

    adapter = Pypdfium2Adapter()
    parsed = adapter.parse(REPO_ROOT / "pipeline" / "tests" / "fixtures" / "fixture-base.pdf")
    expected_ver = importlib.metadata.version("pypdfium2")
    assert parsed.parser_version == expected_ver


def test_geo_reprojects_declared_crs_and_rejects_missing_crs(tmp_path: Path) -> None:
    """`geo` reprojects EPSG:32643 UTM 43N to EPSG:4326 and rejects CRS-less projected files (R5, A-022)."""
    transformer = Transformer.from_crs("EPSG:4326", "EPSG:32643", always_xy=True)
    ring_lonlat = [
        (77.5800, 12.9200),
        (77.5900, 12.9200),
        (77.5900, 12.9300),
        (77.5800, 12.9300),
        (77.5800, 12.9200),
    ]
    ring_utm = [list(transformer.transform(lon, lat)) for lon, lat in ring_lonlat]

    utm_boundary_path = tmp_path / "utm-boundary.geojson"
    utm_boundary_path.write_text(
        json.dumps(
            {
                "type": "FeatureCollection",
                "crs": {"type": "name", "properties": {"name": "EPSG:32643"}},
                "features": [
                    {
                        "type": "Feature",
                        "properties": {"district_code": "BSCC"},
                        "geometry": {"type": "Polygon", "coordinates": [ring_utm]},
                    }
                ],
            }
        ),
        encoding="utf-8",
    )

    reprojected_fc = extract_boundary_feature(utm_boundary_path, "district_code", "BSCC")
    coords = reprojected_fc["features"][0]["geometry"]["coordinates"][0]
    assert coords[0][0] == pytest.approx(77.5800, abs=1e-4)
    assert coords[0][1] == pytest.approx(12.9200, abs=1e-4)

    # CRS-less file with projected coordinates must fail loudly
    no_crs_path = tmp_path / "no-crs.geojson"
    no_crs_path.write_text(
        json.dumps(
            {
                "type": "FeatureCollection",
                "crs": None,
                "features": [
                    {
                        "type": "Feature",
                        "properties": {"district_code": "BSCC"},
                        "geometry": {"type": "Polygon", "coordinates": [ring_utm]},
                    }
                ],
            }
        ),
        encoding="utf-8",
    )
    with pytest.raises(click.ClickException, match="CRS"):
        extract_boundary_feature(no_crs_path, "district_code", "BSCC")

    # Also test zoning GeoJSON reprojection from EPSG:32643
    utm_zones_path = tmp_path / "utm-zones.geojson"
    utm_zones_path.write_text(
        json.dumps(
            {
                "type": "FeatureCollection",
                "crs": {"type": "name", "properties": {"name": "EPSG:32643"}},
                "features": [
                    {
                        "type": "Feature",
                        "properties": {"ZONE_CD": "R-Main", "ZONE_NAME": "Residential Main"},
                        "geometry": {"type": "Polygon", "coordinates": [ring_utm]},
                    }
                ],
            }
        ),
        encoding="utf-8",
    )
    raw_cfg = yaml.safe_load(
        (REPO_ROOT / "jurisdictions" / "xx-test-fixture.yaml").read_text(encoding="utf-8")
    )
    raw_cfg["maps"]["zoning"][0]["source_url"] = f"file://{utm_zones_path}"
    cfg = validate_jurisdiction_dict(raw_cfg)
    z_feats = import_zones_from_geojson(cfg.maps.zoning[0], reprojected_fc, tmp_path)
    assert len(z_feats) == 1
    z_ring = z_feats[0]["geometry"]["coordinates"][0]
    assert z_ring[0][0] == pytest.approx(77.58, abs=1e-2)
    assert z_feats[0]["properties"]["area_sq_m"] > 1_000_000.0
