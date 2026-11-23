"""Verification tests for the complete `in-ka-bengaluru-south` dataset (Plan v2.0 Parts B & C, Rules R8–R14)."""

from __future__ import annotations

import json
import re

from bylaws.config import load_jurisdiction_config
from bylaws.root import resolve_repo_root
from bylaws.schema_validator import validate_file

REPO_ROOT = resolve_repo_root()
RELEASE_DIR = REPO_ROOT / "public" / "data" / "in-ka-bengaluru-south" / "1.0.0"
REPORTS_DIR = REPO_ROOT / "data" / "reports" / "in-ka-bengaluru-south"


def test_bengaluru_south_source_register_and_text_rights() -> None:
    """`in-ka-bengaluru-south.yaml` covers all 7 layers, reference_only standards, and contested status (R8, R13)."""
    config = load_jurisdiction_config("in-ka-bengaluru-south")
    assert config.id == "in-ka-bengaluru-south"
    assert config.visibility == "public"
    assert config.licence == "CC BY 4.0"
    assert len(config.documents) >= 28

    by_id = {d.id: d for d in config.documents}
    for ref_id in ("nbc-2016", "aai-cczm", "model-bbl-2017"):
        assert ref_id in by_id
        assert by_id[ref_id].text_rights is not None
        assert by_id[ref_id].text_rights.mode == "reference_only"
        assert by_id[ref_id].cited_provisions

    assert by_id["ktcda-act"].legal_status == "status_unknown"
    assert "kn" in (by_id["rmp2015-zr-amend-2026-01"].languages or [])

    assert (REPO_ROOT / "docs" / "sources" / "in-ka-bengaluru-south.md").is_file()
    assert (REPORTS_DIR / "source-discovery.md").is_file()
    assert (REPORTS_DIR / "recon.md").is_file()
    assert (REPORTS_DIR / "parser-comparison.md").is_file()
    assert (REPORTS_DIR / "qa.md").is_file()
    assert (REPORTS_DIR / "map-verification.md").is_file()


def test_bengaluru_south_clauses_kannada_tables_and_r10_honest_verification() -> None:
    """Structured clauses preserve Kannada (`language: 'kn'`), extract tables, and have 0 `human_verified` claims (R9, R10)."""
    assert RELEASE_DIR.is_dir(), "Run `bylaws run-all --jurisdiction in-ka-bengaluru-south --version 1.0.0` first"

    clause_files = sorted(RELEASE_DIR.glob("*.clauses.json"))
    assert len(clause_files) == 28

    total_clauses = 0
    total_tables = 0
    kannada_clauses = []

    for cpath in clause_files:
        tree = validate_file(cpath, "clause-tree")
        for clause in tree["clauses"]:
            total_clauses += 1
            assert clause["verification"] != "human_verified", (
                f"Rule R10 violation: {clause['record_id']} marked human_verified"
            )
            total_tables += len(clause["tables"])
            if clause.get("language") == "kn":
                kannada_clauses.append(clause)

    assert total_clauses >= 60
    assert total_tables >= 8
    assert len(kannada_clauses) >= 1
    assert re.search(r"[\u0c80-\u0cff]", kannada_clauses[0]["text"])


def test_bengaluru_south_amendments_and_consolidated_derived_records() -> None:
    """`amendments.json` and `consolidated.json` link `bbl-2003` and `rmp2015-zr` chains with `derived: true` (R10, R14)."""
    amendments = validate_file(RELEASE_DIR / "amendments.json", "amendments")
    consolidated = validate_file(RELEASE_DIR / "consolidated.json", "consolidated")

    assert len(amendments["links"]) >= 12
    assert len(consolidated["records"]) >= 10
    for rec in consolidated["records"]:
        assert rec["derived"] is True
        assert rec["confidence"] == "high"
        assert len(rec["amendments_applied"]) >= 1

    consolidated_ids = {r["clause_id"] for r in consolidated["records"]}
    assert "bbl-2003:6.0" in consolidated_ids
    assert "bbl-2003:3.8" in consolidated_ids
    assert "rmp2015-zr:3.10" in consolidated_ids
    assert "rmp2015-zr:10.1" in consolidated_ids


def test_bengaluru_south_maps_overlays_and_clause_zone_tags() -> None:
    """All official boundaries, 9 planning districts, 10 zone codes, overlays, and tags are valid (R11, R12)."""
    zones = validate_file(RELEASE_DIR / "zones.geojson", "zones")
    geo_layers = validate_file(RELEASE_DIR / "geo-layers.json", "geo-layers")
    tags = validate_file(RELEASE_DIR / "clause-zone-tags.json", "clause-zone-tags")
    declarations = validate_file(RELEASE_DIR / "declarations.json", "declarations")

    assert len(declarations["unobtainable_documents"]) >= 1
    assert len(declarations["contested_status"]) >= 1

    for fname in (
        "boundary.geojson",
        "gba-zones.geojson",
        "wards.geojson",
        "planning-districts.geojson",
        "overlays.geojson",
        "sources.json",
        "sources.csv",
    ):
        assert (RELEASE_DIR / fname).is_file(), f"Missing release artifact {fname}"

    wards_fc = json.loads((RELEASE_DIR / "wards.geojson").read_text(encoding="utf-8"))
    assert len(wards_fc["features"]) == 20

    pd_fc = json.loads((RELEASE_DIR / "planning-districts.geojson").read_text(encoding="utf-8"))
    assert len(pd_fc["features"]) == 9

    zone_codes_in_map = {f["properties"]["zone_code"] for f in zones["features"]}
    expected_codes = {
        "R-Main",
        "R-Mixed",
        "C-Central",
        "C-Business",
        "C-Mutation",
        "I-General",
        "I-HiTech",
        "P&SP",
        "T&T",
        "Park",
    }
    assert expected_codes.issubset(zone_codes_in_map)
    for feat in zones["features"]:
        assert feat["properties"]["verification"] != "human_verified"

    tagged_zones = {t["zone_code"] for t in tags["tags"]}
    for code in [*expected_codes, "overlay-metro-11m", "ALL"]:
        assert code in tagged_zones, f"Zone code {code} missing from clause-zone-tags.json"

    for tag in tags["tags"]:
        assert tag["reason"].strip()
        assert tag["verification"] == "machine_checked"

    layer_kinds = {lyr["layer_id"]: lyr["kind"] for lyr in geo_layers["layers"]}
    assert layer_kinds["gba-corporation-south"] == "official_boundary"
    assert layer_kinds["master-plan-zones"] == "master_plan_zone"
    assert layer_kinds["overlay-metro-11m"] == "derived_overlay"
    assert layer_kinds["overlay-aai-cczm-ref"] == "reference"
