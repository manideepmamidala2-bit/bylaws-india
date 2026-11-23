"""Jurisdiction configuration loader and validator (Plan v1.1 §S1b)."""

from __future__ import annotations

from pathlib import Path
from typing import Any

import yaml

from bylaws.models import (
    BoundaryMapConfig,
    BoundarySelectRule,
    DocumentConfig,
    ImportedZoningMapConfig,
    JurisdictionConfig,
    MapsConfig,
    StatusEvidenceConfig,
    TracedZoningMapConfig,
    UnreadDocumentConfig,
    ZoningMapConfig,
)
from bylaws.root import resolve_repo_root
from bylaws.schema_validator import (
    REPO_ROOT,
    SchemaValidationError,
    validate_payload,
)

JURISDICTIONS_DIR = REPO_ROOT / "jurisdictions"


class ConfigValidationError(ValueError):
    """Raised when a jurisdiction YAML config is missing or fails validation."""


__all__ = [
    "JURISDICTIONS_DIR",
    "BoundaryMapConfig",
    "BoundarySelectRule",
    "ConfigValidationError",
    "DocumentConfig",
    "ImportedZoningMapConfig",
    "JurisdictionConfig",
    "MapsConfig",
    "StatusEvidenceConfig",
    "TracedZoningMapConfig",
    "UnreadDocumentConfig",
    "ZoningMapConfig",
    "load_jurisdiction_config",
    "validate_jurisdiction_dict",
]


def validate_jurisdiction_dict(
    raw_config: Any,
    *,
    expected_id: str | None = None,
    source: str | None = None,
    schemas_dir: Path | None = None,
) -> JurisdictionConfig:
    """Validate a raw jurisdiction dictionary against `jurisdiction.schema.json`."""
    try:
        validate_payload(
            raw_config,
            "jurisdiction",
            source=source,
            schemas_dir=schemas_dir,
        )
    except SchemaValidationError as exc:
        raise ConfigValidationError(str(exc)) from exc

    config = JurisdictionConfig.model_validate(raw_config)
    if expected_id is not None and config.id != expected_id:
        raise ConfigValidationError(
            f"Jurisdiction config ID mismatch in '{source or expected_id}': "
            f"expected '{expected_id}', got '{config.id}'"
        )

    doc_ids = {doc.id for doc in config.documents}
    for zoning in config.maps.zoning:
        if isinstance(zoning, TracedZoningMapConfig) and zoning.document not in doc_ids:
            raise ConfigValidationError(
                f"Zoning map '{zoning.id}' references unknown document '{zoning.document}' "
                f"(known documents: {sorted(doc_ids)})"
            )

    return config


def load_jurisdiction_config(
    jurisdiction_id: str,
    *,
    jurisdictions_dir: Path | None = None,
    schemas_dir: Path | None = None,
) -> JurisdictionConfig:
    """Load and validate `jurisdictions/<jurisdiction_id>.yaml`."""
    if not jurisdiction_id or not jurisdiction_id.strip():
        raise ConfigValidationError("Jurisdiction ID must be a non-empty string.")

    base_dir = jurisdictions_dir or (resolve_repo_root() / "jurisdictions")
    config_path = base_dir / f"{jurisdiction_id}.yaml"
    if not config_path.is_file():
        raise ConfigValidationError(
            f"Jurisdiction config file not found for '{jurisdiction_id}': {config_path}"
        )

    try:
        with config_path.open("r", encoding="utf-8") as handle:
            raw_data = yaml.safe_load(handle)
    except yaml.YAMLError as exc:
        raise ConfigValidationError(
            f"Invalid YAML syntax in '{config_path}': {exc}"
        ) from exc

    return validate_jurisdiction_dict(
        raw_data,
        expected_id=jurisdiction_id,
        source=str(config_path),
        schemas_dir=schemas_dir,
    )
