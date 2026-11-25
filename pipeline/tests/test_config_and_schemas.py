"""Tests for `config.py`, `schema_validator.py`, and all 8 Schema v1.1 contracts (M1 / S1b)."""

from __future__ import annotations

import copy
import json
from pathlib import Path

import pypdfium2 as pdfium
import pytest
import yaml

from bylaws.config import (
    ConfigValidationError,
    ImportedZoningMapConfig,
    load_jurisdiction_config,
    validate_jurisdiction_dict,
)
from bylaws.schema_validator import (
    REPO_ROOT,
    SCHEMA_NAMES,
    SchemaValidationError,
    load_schema,
    validate_file,
    validate_payload,
)

FIXTURES_DIR = Path(__file__).resolve().parent / "fixtures"


@pytest.mark.parametrize("schema_name", SCHEMA_NAMES)
def test_all_eleven_schemas_exist_and_are_valid_draft_2020_12(schema_name: str) -> None:
    assert len(SCHEMA_NAMES) == 15
    schema = load_schema(schema_name)
    assert schema["$schema"] == "https://json-schema.org/draft/2020-12/schema"
    assert schema["type"] == "object"
    assert schema["properties"]["schema_version"]["const"] == "1.4"
    schema_text = json.dumps(schema)
    assert "_fixture-test" not in schema_text
    assert "xx-test-fixture" not in schema_text


def test_legacy_fixture_test_yaml_is_removed() -> None:
    assert not (REPO_ROOT / "jurisdictions" / "_fixture-test.yaml").exists()
    assert (REPO_ROOT / "jurisdictions" / "xx-test-fixture.yaml").is_file()


def test_load_fixture_jurisdiction_config_succeeds() -> None:
    config = load_jurisdiction_config("xx-test-fixture")
    assert config.id == "xx-test-fixture"
    assert config.country == "XX"
    assert config.state == "YY"
    assert config.aliases == ["Synthetic Fixture", "Test City"]
    assert config.building_types == ["residential"]
    assert len(config.documents) == 4
    assert len(config.maps.boundaries) == 1
    assert len(config.maps.zoning) == 1
    assert isinstance(config.maps.zoning[0], ImportedZoningMapConfig)
    assert config.maps.zoning[0].kind == "imported"


def test_fixture_files_exist_and_pdfs_are_readable() -> None:
    expected_pdfs = {
        "fixture-base.pdf": 2,
        "fixture-amend.pdf": 1,
        "fixture-draft.pdf": 1,
        "fixture-map.pdf": 1,
    }
    for filename, expected_pages in expected_pdfs.items():
        pdf_path = FIXTURES_DIR / filename
        assert pdf_path.is_file(), f"Missing fixture PDF: {pdf_path}"
        doc = pdfium.PdfDocument(str(pdf_path))
        assert len(doc) == expected_pages
        doc.close()

    kml_path = FIXTURES_DIR / "fixture-boundary.kml"
    assert kml_path.is_file()
    assert "FIX-01" in kml_path.read_text(encoding="utf-8")

    imported_geojson = FIXTURES_DIR / "fixture-imported-zones.geojson"
    assert imported_geojson.is_file()


@pytest.mark.parametrize(
    ("field_to_remove", "expected_fragment"),
    [
        ("country", "country"),
        ("state", "state"),
        ("building_types", "building_types"),
        ("documents", "documents"),
        ("maps", "maps"),
    ],
)
def test_invalid_jurisdiction_config_missing_required_field_fails_loudly(
    field_to_remove: str, expected_fragment: str
) -> None:
    raw = yaml.safe_load(
        (REPO_ROOT / "jurisdictions" / "xx-test-fixture.yaml").read_text(encoding="utf-8")
    )
    del raw[field_to_remove]
    with pytest.raises(ConfigValidationError) as exc_info:
        validate_jurisdiction_dict(raw)
    assert expected_fragment in str(exc_info.value)


def test_invalid_jurisdiction_config_unknown_traced_zoning_document_fails() -> None:
    raw = yaml.safe_load(
        (REPO_ROOT / "jurisdictions" / "xx-test-fixture.yaml").read_text(encoding="utf-8")
    )
    raw["maps"]["zoning"] = [
        {
            "id": "fixture-pd-01",
            "kind": "traced",
            "document": "non-existent-doc",
            "page": 1,
            "planning_district": "PD-01",
            "legend_page": 1,
        }
    ]
    with pytest.raises(ConfigValidationError, match="references unknown document"):
        validate_jurisdiction_dict(raw)


def test_invalid_jurisdiction_config_id_mismatch_fails() -> None:
    raw = yaml.safe_load(
        (REPO_ROOT / "jurisdictions" / "xx-test-fixture.yaml").read_text(encoding="utf-8")
    )
    with pytest.raises(ConfigValidationError, match="ID mismatch"):
        validate_jurisdiction_dict(raw, expected_id="other-id")


@pytest.mark.parametrize(
    ("fixture_file", "schema_name"),
    [
        (REPO_ROOT / "jurisdictions" / "xx-test-fixture.yaml", "jurisdiction"),
        (FIXTURES_DIR / "sample-document.meta.json", "document"),
        (FIXTURES_DIR / "sample-clause-tree.json", "clause-tree"),
        (FIXTURES_DIR / "sample-zones.geojson", "zones"),
        (FIXTURES_DIR / "sample-overrides.yaml", "overrides"),
        (FIXTURES_DIR / "sample-manifest.json", "manifest"),
        (FIXTURES_DIR / "sample-declarations.json", "declarations"),
        (FIXTURES_DIR / "sample-amendments.json", "amendments"),
        (FIXTURES_DIR / "sample-consolidated.json", "consolidated"),
        (FIXTURES_DIR / "sample-geo-layers.json", "geo-layers"),
        (FIXTURES_DIR / "sample-clause-zone-tags.json", "clause-zone-tags"),
    ],
)
def test_sample_payload_files_validate_against_schemas(
    fixture_file: Path, schema_name: str
) -> None:
    data = validate_file(fixture_file, schema_name)
    assert isinstance(data, dict)


def test_document_schema_rejects_bad_sha256_or_missing_status_evidence() -> None:
    valid_doc = json.loads(
        (FIXTURES_DIR / "sample-document.meta.json").read_text(encoding="utf-8")
    )
    bad_sha = copy.deepcopy(valid_doc)
    bad_sha["sha256"] = "not-a-valid-sha256"
    with pytest.raises(SchemaValidationError, match="sha256"):
        validate_payload(bad_sha, "document")

    missing_evidence = copy.deepcopy(valid_doc)
    del missing_evidence["status_evidence"]
    with pytest.raises(SchemaValidationError, match="status_evidence"):
        validate_payload(missing_evidence, "document")


def test_clause_tree_schema_rejects_missing_citations_or_record_id() -> None:
    valid_tree = json.loads(
        (FIXTURES_DIR / "sample-clause-tree.json").read_text(encoding="utf-8")
    )
    bad_tree = copy.deepcopy(valid_tree)
    bad_tree["clauses"][0]["citations"] = []
    with pytest.raises(SchemaValidationError, match="citations"):
        validate_payload(bad_tree, "clause-tree")

    no_record = copy.deepcopy(valid_tree)
    del no_record["clauses"][0]["record_id"]
    with pytest.raises(SchemaValidationError, match="record_id"):
        validate_payload(no_record, "clause-tree")


def test_zones_schema_requires_source_attribution_when_imported() -> None:
    valid_zones = json.loads(
        (FIXTURES_DIR / "sample-zones.geojson").read_text(encoding="utf-8")
    )
    bad_zones = copy.deepcopy(valid_zones)
    bad_zones["features"][0]["properties"]["source_attribution"] = None
    with pytest.raises(SchemaValidationError, match="source_attribution"):
        validate_payload(bad_zones, "zones")


def test_overrides_schema_rejects_unknown_top_level_key() -> None:
    valid_overrides = yaml.safe_load(
        (FIXTURES_DIR / "sample-overrides.yaml").read_text(encoding="utf-8")
    )
    bad_overrides = copy.deepcopy(valid_overrides)
    bad_overrides["unexpected_field"] = []
    with pytest.raises(SchemaValidationError, match="unexpected_field"):
        validate_payload(bad_overrides, "overrides")


def test_declarations_and_amendments_schemas_reject_invalid_payloads() -> None:
    valid_decl = json.loads(
        (FIXTURES_DIR / "sample-declarations.json").read_text(encoding="utf-8")
    )
    bad_decl = copy.deepcopy(valid_decl)
    del bad_decl["known_gaps"]
    with pytest.raises(SchemaValidationError, match="known_gaps"):
        validate_payload(bad_decl, "declarations")

    valid_amend = json.loads(
        (FIXTURES_DIR / "sample-amendments.json").read_text(encoding="utf-8")
    )
    bad_amend = copy.deepcopy(valid_amend)
    bad_amend["links"][0]["action"] = "invalid_action"
    with pytest.raises(SchemaValidationError, match="action"):
        validate_payload(bad_amend, "amendments")


def test_manifest_schema_rejects_missing_drafts_or_download_zip() -> None:
    valid_manifest = json.loads(
        (FIXTURES_DIR / "sample-manifest.json").read_text(encoding="utf-8")
    )
    bad_manifest = copy.deepcopy(valid_manifest)
    del bad_manifest["jurisdictions"][0]["releases"][0]["download_zip"]
    with pytest.raises(SchemaValidationError, match="download_zip"):
        validate_payload(bad_manifest, "manifest")
