"""Jurisdiction configuration loader and validator (Plan §7.1)."""

from __future__ import annotations

from pathlib import Path
from typing import Any, Literal

import yaml
from pydantic import BaseModel, ConfigDict, Field

from bylaws.schema_validator import (
    REPO_ROOT,
    SchemaValidationError,
    validate_payload,
)

JURISDICTIONS_DIR = REPO_ROOT / "jurisdictions"

LayerType = Literal["national", "state", "planning", "municipal"]
LegalStatusType = Literal["in_force", "draft", "superseded", "withdrawn"]
DocumentRoleType = Literal["base", "amendment", "regulation", "boundary", "reference"]


class ConfigValidationError(ValueError):
    """Raised when a jurisdiction YAML config is missing or fails validation."""


class DocumentConfig(BaseModel):
    """Configuration entry for a single regulatory document or map source."""

    model_config = ConfigDict(extra="forbid")

    id: str
    title: str
    issuing_authority: str
    layer: LayerType
    legal_status: LegalStatusType
    role: DocumentRoleType
    source_url: str
    notified_date: str | None = None
    effective_from: str | None = None
    amends: list[str] = Field(default_factory=list)
    supersedes: list[str] = Field(default_factory=list)


class BoundarySelectRule(BaseModel):
    """Feature property filter for selecting a boundary polygon."""

    model_config = ConfigDict(extra="forbid")

    property: str
    equals: str


class BoundaryMapConfig(BaseModel):
    """Configuration entry for a jurisdiction boundary layer."""

    model_config = ConfigDict(extra="forbid")

    id: str
    source_url: str
    select: BoundarySelectRule


class ZoningMapConfig(BaseModel):
    """Configuration entry for a planning district zoning map page."""

    model_config = ConfigDict(extra="forbid")

    id: str
    document: str
    page: int
    planning_district: int | str
    legend_page: int | None = None


class MapsConfig(BaseModel):
    """Boundaries and zoning maps declared for a jurisdiction."""

    model_config = ConfigDict(extra="forbid")

    boundaries: list[BoundaryMapConfig]
    zoning: list[ZoningMapConfig]


class JurisdictionConfig(BaseModel):
    """Validated representation of `jurisdictions/<id>.yaml`."""

    model_config = ConfigDict(extra="forbid")

    id: str
    name: str
    country: str
    state: str
    building_types: list[str]
    parents: list[str]
    documents: list[DocumentConfig]
    maps: MapsConfig


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
        if zoning.document not in doc_ids:
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

    base_dir = jurisdictions_dir or JURISDICTIONS_DIR
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
