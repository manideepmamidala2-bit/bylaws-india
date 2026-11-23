"""Stage 8.6: Apply committed manual corrections and zone tags from data/overrides/ (Rule R6 & R9)."""

from __future__ import annotations

import copy
import json
import re
from pathlib import Path
from typing import Any

import click

from bylaws.config import JurisdictionConfig
from bylaws.root import resolve_repo_root
from bylaws.schema_validator import (
    SchemaValidationError,
    validate_file,
    validate_payload,
)

RECORD_VERSION_RE = re.compile(r"^(?P<base>.+)@v(?P<version>\d+)$")


def _next_record_id(current_record_id: str, fallback_base_id: str) -> str:
    match = RECORD_VERSION_RE.match(current_record_id)
    if match:
        base = match.group("base")
        version_num = int(match.group("version"))
        return f"{base}@v{version_num + 1}"
    return f"{fallback_base_id}@v2"


def _find_active_clause(
    clause_trees: dict[str, dict[str, Any]],
    clause_id: str,
) -> tuple[str, list[dict[str, Any]], dict[str, Any]]:
    for doc_id, tree in clause_trees.items():
        clauses = tree.get("clauses", [])
        for clause in clauses:
            if clause.get("clause_id") == clause_id and clause.get("superseded_by") is None:
                return doc_id, clauses, clause
    raise click.ClickException(
        f"Override target clause_id '{clause_id}' not found in any active clause tree."
    )


def _find_active_zone_feature(
    features: list[dict[str, Any]],
    zone_id: str,
) -> dict[str, Any]:
    for feat in features:
        props = feat.get("properties", {})
        if props.get("zone_id") == zone_id and props.get("superseded_by") is None:
            return feat
    raise click.ClickException(
        f"Override target zone_id '{zone_id}' not found in active zones.geojson features."
    )


def _apply_clause_mutation(
    clauses_list: list[dict[str, Any]],
    active_clause: dict[str, Any],
    updates: dict[str, Any],
) -> None:
    """Apply `updates` to `active_clause`, enforcing Rule R9 if `verification == 'human_verified'`."""
    clause_id = str(active_clause["clause_id"])
    if active_clause.get("verification") == "human_verified":
        prior_record_id = str(active_clause["record_id"])
        new_record_id = _next_record_id(prior_record_id, clause_id)
        new_clause = copy.deepcopy(active_clause)
        active_clause["superseded_by"] = new_record_id
        new_clause["record_id"] = new_record_id
        new_clause["supersedes"] = prior_record_id
        new_clause["superseded_by"] = None
        for key, val in updates.items():
            new_clause[key] = val
        clauses_list.append(new_clause)
    else:
        for key, val in updates.items():
            active_clause[key] = val


def _apply_zone_mutation(
    features_list: list[dict[str, Any]],
    active_feature: dict[str, Any],
    updates: dict[str, Any],
) -> None:
    """Apply `updates` to `active_feature['properties']`, enforcing Rule R9 if `human_verified`."""
    props = active_feature["properties"]
    zone_id = str(props["zone_id"])
    if props.get("verification") == "human_verified":
        prior_record_id = str(props["record_id"])
        new_record_id = _next_record_id(prior_record_id, zone_id)
        new_feature = copy.deepcopy(active_feature)
        props["superseded_by"] = new_record_id
        new_props = new_feature["properties"]
        new_props["record_id"] = new_record_id
        new_props["supersedes"] = prior_record_id
        new_props["superseded_by"] = None
        for key, val in updates.items():
            new_props[key] = val
        features_list.append(new_feature)
    else:
        for key, val in updates.items():
            props[key] = val


def run_apply_overrides(config: JurisdictionConfig, *, repo_root: Path | None = None) -> None:
    """Load and apply YAML override files for a jurisdiction with Rule R9 immutability."""
    root = repo_root or resolve_repo_root()
    overrides_dir = root / "data" / "overrides" / config.id
    if not overrides_dir.is_dir():
        click.echo(f"[apply-overrides] No overrides directory for '{config.id}'.")
        return

    override_files = sorted(
        [*overrides_dir.glob("*.yaml"), *overrides_dir.glob("*.yml")]
    )
    if not override_files:
        click.echo(f"[apply-overrides] No override YAML files for '{config.id}'.")
        return

    processed_dir = root / "data" / "processed" / config.id
    docs_dir = processed_dir / "documents"
    zones_path = processed_dir / "zones.geojson"

    clause_trees: dict[str, dict[str, Any]] = {}
    if docs_dir.is_dir():
        for clause_file in sorted(docs_dir.glob("*.clauses.json")):
            tree_data: dict[str, Any] = json.loads(clause_file.read_text(encoding="utf-8"))
            clause_trees[str(tree_data["doc_id"])] = tree_data

    zones_payload: dict[str, Any] | None = None
    if zones_path.is_file():
        zones_payload = json.loads(zones_path.read_text(encoding="utf-8"))

    modified_docs: set[str] = set()
    zones_modified = False
    applied_count = 0

    for yaml_path in override_files:
        try:
            override_data = validate_file(yaml_path, "overrides")
        except SchemaValidationError as exc:
            raise click.ClickException(str(exc)) from exc

        for tag in override_data.get("zone_tags") or []:
            clause_id = str(tag["clause_id"])
            doc_id, clauses_list, active_clause = _find_active_clause(clause_trees, clause_id)
            existing_zones: list[str] = list(active_clause.get("applies_to_zones") or [])
            merged_zones = list(existing_zones)
            for z_code in tag["zones"]:
                if z_code not in merged_zones:
                    merged_zones.append(z_code)
            _apply_clause_mutation(
                clauses_list,
                active_clause,
                {"applies_to_zones": merged_zones},
            )
            modified_docs.add(doc_id)
            applied_count += 1

        for fix in override_data.get("clause_fixes") or []:
            clause_id = str(fix["clause_id"])
            field_name = str(fix["field"])
            field_val = fix["value"]
            doc_id, clauses_list, active_clause = _find_active_clause(clause_trees, clause_id)
            _apply_clause_mutation(
                clauses_list,
                active_clause,
                {field_name: field_val},
            )
            modified_docs.add(doc_id)
            applied_count += 1

        for zfix in override_data.get("zone_fixes") or []:
            if zones_payload is None:
                raise click.ClickException(
                    f"Cannot apply zone_fixes from '{yaml_path}': '{zones_path}' does not exist."
                )
            zone_id = str(zfix["zone_id"])
            features_list: list[dict[str, Any]] = zones_payload.get("features", [])
            active_feature = _find_active_zone_feature(features_list, zone_id)
            _apply_zone_mutation(features_list, active_feature, dict(zfix["set"]))
            zones_modified = True
            applied_count += 1

    for doc_id in sorted(modified_docs):
        tree_payload = clause_trees[doc_id]
        out_path = docs_dir / f"{doc_id}.clauses.json"
        validate_payload(tree_payload, "clause-tree", source=str(out_path))
        out_path.write_text(json.dumps(tree_payload, indent=2) + "\n", encoding="utf-8")

    if zones_modified and zones_payload is not None:
        validate_payload(zones_payload, "zones", source=str(zones_path))
        zones_path.write_text(json.dumps(zones_payload, indent=2) + "\n", encoding="utf-8")

    click.echo(
        f"[apply-overrides] Applied {applied_count} override operation(s) for '{config.id}'."
    )
