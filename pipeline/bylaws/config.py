"""Jurisdiction configuration loader and validator (Plan v1.1 §S1b)."""

from __future__ import annotations

import tomllib
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
    "load_site_config",
    "validate_jurisdiction_dict",
]


def load_site_config(repo_root: Path | None = None) -> dict[str, str]:
    """Load site-wide contact and organisation settings from `bylaws.toml`."""
    effective_root = repo_root or resolve_repo_root()
    toml_path = effective_root / "bylaws.toml"
    raw = tomllib.loads(toml_path.read_text(encoding="utf-8")) if toml_path.is_file() else {}
    contact = raw.get("contact") if isinstance(raw.get("contact"), dict) else {}
    organisation = raw.get("organisation") if isinstance(raw.get("organisation"), dict) else {}
    return {
        "contact_email": str(contact.get("email") or "contact@example.org").strip(),
        "organisation_name": str(organisation.get("name") or "[Owner's Organisation]").strip(),
        "github_repo": str(
            organisation.get("github_repo") or "https://github.com/manideepmamidala2-bit/bylaws-india"
        ).strip(),
        "site_url": str(organisation.get("site_url") or "https://bylaws-india.vercel.app").strip(),
    }


def validate_jurisdiction_dict(
    raw_config: Any,
    *,
    expected_id: str | None = None,
    source: str | None = None,
    schemas_dir: Path | None = None,
    extra_doc_ids: set[str] | None = None,
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

    doc_ids = {doc.id for doc in config.documents} | (extra_doc_ids or set())
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
    repo_root: Path | None = None,
    inherit_parent: bool = True,
) -> JurisdictionConfig:
    """Load and validate `jurisdictions/<jurisdiction_id>.yaml`, optionally inheriting from `parent`."""
    if not jurisdiction_id or not jurisdiction_id.strip():
        raise ConfigValidationError("Jurisdiction ID must be a non-empty string.")

    effective_root = repo_root or resolve_repo_root()
    base_dir = jurisdictions_dir or (effective_root / "jurisdictions")
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

    parent_cfg: JurisdictionConfig | None = None
    parent_doc_ids: set[str] = set()
    raw_parent = None
    if isinstance(raw_data, dict):
        raw_parent = raw_data.get("parent") or (
            raw_data.get("parents")[0]
            if isinstance(raw_data.get("parents"), list) and raw_data.get("parents")
            else None
        )
    if raw_parent:
        parent_id = str(raw_parent).strip()
        if parent_id and (base_dir / f"{parent_id}.yaml").is_file():
            parent_cfg = load_jurisdiction_config(
                parent_id,
                jurisdictions_dir=base_dir,
                schemas_dir=schemas_dir,
                inherit_parent=False,
            )
            parent_doc_ids = {d.id for d in parent_cfg.documents}

    config = validate_jurisdiction_dict(
        raw_data,
        expected_id=jurisdiction_id,
        source=str(config_path),
        schemas_dir=schemas_dir,
        extra_doc_ids=parent_doc_ids,
    )

    if inherit_parent and parent_cfg is not None:
        parent_doc_by_id = {d.id: d for d in parent_cfg.documents}
        for child_doc in config.documents:
            pdoc = parent_doc_by_id.get(child_doc.id)
            if pdoc is None:
                continue
            if (
                getattr(child_doc, "instrument_type", "instrument") == "instrument"
                and getattr(pdoc, "instrument_type", "instrument") != "instrument"
            ):
                child_doc.instrument_type = pdoc.instrument_type
            if getattr(child_doc, "summary_by_site", None) is None and getattr(
                pdoc, "summary_by_site", None
            ):
                child_doc.summary_by_site = pdoc.summary_by_site
            if not getattr(child_doc, "notes_by_site", None) and getattr(
                pdoc, "notes_by_site", None
            ):
                child_doc.notes_by_site = list(pdoc.notes_by_site or [])
            if getattr(child_doc, "applies_to_jurisdiction", None) is None and getattr(
                pdoc, "applies_to_jurisdiction", None
            ):
                child_doc.applies_to_jurisdiction = pdoc.applies_to_jurisdiction
            if getattr(pdoc, "structured", None) is False:
                child_doc.structured = False

        child_doc_ids = {d.id for d in config.documents}
        inherited_docs = [
            d
            for d in parent_cfg.documents
            if d.id not in child_doc_ids
            and (not d.applies_in or config.id in d.applies_in)
        ]
        config.documents = [*inherited_docs, *config.documents]

        existing_links = {
            (lnk.amending_clause, lnk.target_clause, lnk.action)
            for lnk in (config.amendment_links or [])
        }
        inherited_links = [
            lnk
            for lnk in (parent_cfg.amendment_links or [])
            if (lnk.amending_clause, lnk.target_clause, lnk.action) not in existing_links
            and (not lnk.applies_in or config.id in lnk.applies_in)
        ]
        config.amendment_links = [*inherited_links, *(config.amendment_links or [])]

        existing_unobt = {u.id for u in (config.unobtainable_documents or [])}
        inherited_unobt = [
            u
            for u in (parent_cfg.unobtainable_documents or [])
            if u.id not in existing_unobt
        ]
        config.unobtainable_documents = [
            *inherited_unobt,
            *(config.unobtainable_documents or []),
        ]

        existing_unread = {u.title for u in (config.unread_documents or [])}
        inherited_unread = [
            u
            for u in (parent_cfg.unread_documents or [])
            if u.title not in existing_unread
        ]
        config.unread_documents = [
            *inherited_unread,
            *(config.unread_documents or []),
        ]

    return config
