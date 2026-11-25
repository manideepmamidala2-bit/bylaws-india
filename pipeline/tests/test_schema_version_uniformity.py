"""Falsifiable tests enforcing uniform `schema_version: '1.4'` across all schemas, configs, overrides, and published files (Part 1 §2)."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import pytest
import yaml

from bylaws.root import resolve_repo_root
from bylaws.schema_validator import (
    SCHEMA_NAMES,
    SCHEMA_VERSION,
    SchemaValidationError,
    load_schema,
    validate_payload,
)

REPO_ROOT = resolve_repo_root()


def find_schema_version_mismatches(root: Path, expected_version: str = SCHEMA_VERSION) -> list[str]:
    """Scan all schemas, jurisdiction configs, overrides, and published JSON/GeoJSON files for `schema_version` mismatches."""
    mismatches: list[str] = []

    # 1. Check all JSON Schemas
    schemas_dir = root / "schemas"
    for schema_path in sorted(schemas_dir.glob("*.schema.json")):
        raw: dict[str, Any] = json.loads(schema_path.read_text(encoding="utf-8"))
        sv_prop = (raw.get("properties") or {}).get("schema_version") or {}
        const_val = sv_prop.get("const")
        if const_val != expected_version:
            mismatches.append(
                f"{schema_path.relative_to(root)}: schema_version const is {const_val!r}, expected {expected_version!r}"
            )

    # 2. Check all jurisdiction configs and resolution files
    jurisdictions_dir = root / "jurisdictions"
    if jurisdictions_dir.is_dir():
        for yaml_path in sorted(jurisdictions_dir.glob("*.yaml")):
            data = yaml.safe_load(yaml_path.read_text(encoding="utf-8"))
            if isinstance(data, dict):
                sv = str(data.get("schema_version") or "")
                if sv != expected_version:
                    mismatches.append(
                        f"{yaml_path.relative_to(root)}: schema_version is {sv!r}, expected {expected_version!r}"
                    )

    # 3. Check all override YAML files
    overrides_dir = root / "data" / "overrides"
    if overrides_dir.is_dir():
        for yaml_path in sorted(overrides_dir.rglob("*.yaml")):
            data = yaml.safe_load(yaml_path.read_text(encoding="utf-8"))
            if isinstance(data, dict):
                sv = str(data.get("schema_version") or "")
                if sv != expected_version:
                    mismatches.append(
                        f"{yaml_path.relative_to(root)}: schema_version is {sv!r}, expected {expected_version!r}"
                    )

    # 4. Check all published JSON / GeoJSON files that carry `schema_version`
    public_data_dir = root / "public" / "data"
    if public_data_dir.is_dir():
        for file_path in sorted(public_data_dir.rglob("*")):
            if not file_path.is_file() or file_path.suffix not in {".json", ".geojson"}:
                continue
            try:
                payload = json.loads(file_path.read_text(encoding="utf-8"))
            except json.JSONDecodeError:
                mismatches.append(f"{file_path.relative_to(root)}: invalid JSON")
                continue
            if isinstance(payload, dict) and "schema_version" in payload:
                sv = str(payload.get("schema_version") or "")
                if sv != expected_version:
                    mismatches.append(
                        f"{file_path.relative_to(root)}: schema_version is {sv!r}, expected {expected_version!r}"
                    )
            elif isinstance(payload, list):
                for idx, item in enumerate(payload):
                    if isinstance(item, dict) and "schema_version" in item:
                        sv = str(item.get("schema_version") or "")
                        if sv != expected_version:
                            mismatches.append(
                                f"{file_path.relative_to(root)}[{idx}]: schema_version is {sv!r}, expected {expected_version!r}"
                            )

    return mismatches


def test_all_schemas_configs_overrides_and_published_files_use_schema_version_1_4() -> None:
    """Every schema, config, override, and published file in the repository carries `schema_version: '1.4'`."""
    assert SCHEMA_VERSION == "1.4"
    assert "parameters" in SCHEMA_NAMES
    assert "resolution" in SCHEMA_NAMES
    for name in SCHEMA_NAMES:
        schema = load_schema(name)
        assert schema["properties"]["schema_version"]["const"] == "1.4"

    mismatches = find_schema_version_mismatches(REPO_ROOT, expected_version="1.4")
    assert not mismatches, "Schema version mismatches found:\n" + "\n".join(mismatches)


def test_schema_version_uniformity_scanner_and_validator_reject_mismatch(tmp_path: Path) -> None:
    """Scanner and schema validator fail when a file has a mismatched `schema_version` (e.g., `'1.3'`)."""
    schemas_dir = tmp_path / "schemas"
    schemas_dir.mkdir(parents=True)
    (schemas_dir / "bad.schema.json").write_text(
        json.dumps({"properties": {"schema_version": {"const": "1.3"}}}),
        encoding="utf-8",
    )
    jur_dir = tmp_path / "jurisdictions"
    jur_dir.mkdir(parents=True)
    (jur_dir / "bad.yaml").write_text('schema_version: "1.2"\n', encoding="utf-8")

    mismatches = find_schema_version_mismatches(tmp_path, expected_version="1.4")
    assert len(mismatches) == 2

    with pytest.raises(SchemaValidationError, match="1.4"):
        validate_payload(
            {"schema_version": "1.3", "jurisdictions": []},
            "manifest",
        )
