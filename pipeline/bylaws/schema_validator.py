"""Reusable JSON Schema (Draft 2020-12) validation utilities."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import yaml
from jsonschema import Draft202012Validator

from bylaws.root import resolve_repo_root

REPO_ROOT = resolve_repo_root()
SCHEMAS_DIR = REPO_ROOT / "schemas"

SCHEMA_NAMES: tuple[str, ...] = (
    "jurisdiction",
    "document",
    "clause-tree",
    "zones",
    "overrides",
    "manifest",
    "declarations",
    "amendments",
    "consolidated",
    "geo-layers",
    "clause-zone-tags",
)


class SchemaValidationError(ValueError):
    """Raised when a payload fails JSON Schema validation."""

    def __init__(self, schema_name: str, errors: list[str], source: str | None = None) -> None:
        self.schema_name = schema_name
        self.errors = errors
        self.source = source
        location = f" in '{source}'" if source else ""
        joined = "; ".join(errors)
        super().__init__(f"Schema '{schema_name}' validation failed{location}: {joined}")


def load_schema(schema_name: str, schemas_dir: Path | None = None) -> dict[str, Any]:
    """Load a JSON schema dictionary by short name (e.g. 'jurisdiction')."""
    base_dir = schemas_dir or (resolve_repo_root() / "schemas")
    filename = (
        schema_name if schema_name.endswith(".schema.json") else f"{schema_name}.schema.json"
    )
    schema_path = base_dir / filename
    if not schema_path.is_file():
        raise FileNotFoundError(f"Schema file not found: {schema_path}")
    with schema_path.open("r", encoding="utf-8") as handle:
        schema: dict[str, Any] = json.load(handle)
    Draft202012Validator.check_schema(schema)
    return schema


def validate_payload(
    payload: Any,
    schema_name: str,
    *,
    source: str | None = None,
    schemas_dir: Path | None = None,
) -> None:
    """Validate an in-memory dictionary/object against a named Draft 2020-12 schema."""
    if not isinstance(payload, dict):
        raise SchemaValidationError(
            schema_name,
            [f"<root>: expected object/mapping, got {type(payload).__name__}"],
            source=source,
        )
    schema = load_schema(schema_name, schemas_dir=schemas_dir)
    validator = Draft202012Validator(schema)
    validation_errors = sorted(
        validator.iter_errors(payload),
        key=lambda err: [str(part) for part in err.absolute_path],
    )
    if validation_errors:
        formatted: list[str] = []
        for err in validation_errors:
            path_str = ".".join(str(p) for p in err.absolute_path) or "<root>"
            formatted.append(f"{path_str}: {err.message}")
        raise SchemaValidationError(schema_name, formatted, source=source)


def validate_file(
    file_path: str | Path,
    schema_name: str,
    *,
    schemas_dir: Path | None = None,
) -> dict[str, Any]:
    """Load a JSON, GeoJSON, or YAML file and validate it against a named schema."""
    path = Path(file_path)
    if not path.is_file():
        raise FileNotFoundError(f"File to validate not found: {path}")
    with path.open("r", encoding="utf-8") as handle:
        if path.suffix.lower() in {".yaml", ".yml"}:
            data = yaml.safe_load(handle)
        else:
            data = json.load(handle)
    validate_payload(data, schema_name, source=str(path), schemas_dir=schemas_dir)
    return data
