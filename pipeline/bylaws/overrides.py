"""Stage 8.6: Apply committed manual corrections, zone tags, and map curations (Rules R6, R9, R12)."""

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


def _next_record_id_and_version(current_record_id: str, fallback_base_id: str) -> tuple[str, int]:
    match = RECORD_VERSION_RE.match(current_record_id)
    if match:
        base = match.group("base")
        version_num = int(match.group("version")) + 1
        return f"{base}@v{version_num}", version_num
    return f"{fallback_base_id}@v2", 2


def _find_active_clause(
    clause_trees: dict[str, dict[str, Any]],
    clause_id: str,
) -> tuple[str, list[dict[str, Any]], dict[str, Any]]:
    for doc_id, tree in clause_trees.items():
        clauses = tree.get("clauses", [])
        for clause in clauses:
            if (
                clause.get("clause_id") == clause_id
                and clause.get("superseded_by") is None
                and clause.get("record_superseded_by") is None
            ):
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
        if (
            props.get("zone_id") == zone_id
            and props.get("superseded_by") is None
            and props.get("record_superseded_by") is None
        ):
            return feat
    raise click.ClickException(
        f"Override target zone_id '{zone_id}' not found in active zones.geojson features."
    )


def _apply_clause_mutation(
    clauses_list: list[dict[str, Any]],
    active_clause: dict[str, Any],
    updates: dict[str, Any],
    reason: str | None = None,
) -> bool:
    """Apply `updates` to `active_clause`, enforcing Rule R9 & R12 if `verification == 'human_verified'`.

    Returns True if a mutation was applied, or False if `updates` was a no-op.
    """
    if all(active_clause.get(k) == v for k, v in updates.items()):
        return False

    clause_id = str(active_clause["clause_id"])
    if active_clause.get("verification") == "human_verified":
        prior_record_id = str(active_clause["record_id"])
        new_record_id, new_version = _next_record_id_and_version(prior_record_id, clause_id)
        new_clause = copy.deepcopy(active_clause)
        active_clause["superseded_by"] = new_record_id
        active_clause["record_superseded_by"] = new_record_id
        new_clause["record_version"] = new_version
        new_clause["record_id"] = new_record_id
        new_clause["supersedes"] = prior_record_id
        new_clause["record_supersedes"] = prior_record_id
        new_clause["superseded_by"] = None
        new_clause["record_superseded_by"] = None
        new_clause["record_change_reason"] = reason
        for key, val in updates.items():
            new_clause[key] = val
        clauses_list.append(new_clause)
    else:
        for key, val in updates.items():
            active_clause[key] = val
    return True


def _apply_zone_mutation(
    features_list: list[dict[str, Any]],
    active_feature: dict[str, Any],
    updates: dict[str, Any],
    reason: str | None = None,
) -> bool:
    """Apply `updates` to `active_feature['properties']`, enforcing Rule R9 & R12 if `human_verified`."""
    props = active_feature["properties"]
    if all(props.get(k) == v for k, v in updates.items()):
        return False

    zone_id = str(props["zone_id"])
    if props.get("verification") == "human_verified":
        prior_record_id = str(props["record_id"])
        new_record_id, new_version = _next_record_id_and_version(prior_record_id, zone_id)
        new_feature = copy.deepcopy(active_feature)
        props["superseded_by"] = new_record_id
        props["record_superseded_by"] = new_record_id
        new_props = new_feature["properties"]
        new_props["record_version"] = new_version
        new_props["record_id"] = new_record_id
        new_props["supersedes"] = prior_record_id
        new_props["record_supersedes"] = prior_record_id
        new_props["superseded_by"] = None
        new_props["record_superseded_by"] = None
        new_props["record_change_reason"] = reason
        for key, val in updates.items():
            new_props[key] = val
        features_list.append(new_feature)
    else:
        for key, val in updates.items():
            props[key] = val
    return True


def run_apply_overrides(config: JurisdictionConfig, *, repo_root: Path | None = None) -> None:
    """Load and apply YAML override files for a jurisdiction with idempotence and Rule R9/R12 immutability."""
    root = repo_root or resolve_repo_root()
    processed_dir = root / "data" / "processed" / config.id
    processed_dir.mkdir(parents=True, exist_ok=True)
    docs_dir = processed_dir / "documents"
    zones_path = processed_dir / "zones.geojson"
    tags_path = processed_dir / "clause-zone-tags.json"

    overrides_dir = root / "data" / "overrides" / config.id
    override_files = (
        sorted([*overrides_dir.glob("*.yaml"), *overrides_dir.glob("*.yml")])
        if overrides_dir.is_dir()
        else []
    )

    clause_trees: dict[str, dict[str, Any]] = {}
    if docs_dir.is_dir():
        for clause_file in sorted(docs_dir.glob("*.clauses.json")):
            tree_data: dict[str, Any] = json.loads(clause_file.read_text(encoding="utf-8"))
            clause_trees[str(tree_data["doc_id"])] = tree_data

    zones_payload: dict[str, Any] | None = None
    if zones_path.is_file():
        zones_payload = json.loads(zones_path.read_text(encoding="utf-8"))

    known_map_ids = {m.id for m in config.maps.zoning} | {b.id for b in config.maps.boundaries}
    if config.maps.planning_districts:
        known_map_ids |= {pd.id for pd in config.maps.planning_districts}
    if config.maps.overlays:
        known_map_ids |= {ov.id for ov in config.maps.overlays}

    parsed_override_files: list[tuple[Path, dict[str, Any]]] = []
    for yaml_path in override_files:
        try:
            override_data = validate_file(yaml_path, "overrides")
        except SchemaValidationError as exc:
            raise click.ClickException(str(exc)) from exc
        parsed_override_files.append((yaml_path, override_data))

    # Pre-compute cumulative target field states per clause_id and zone_id for multi-fix idempotence
    cumulative_clause_fields: dict[str, dict[str, Any]] = {}
    cumulative_zone_fields: dict[str, dict[str, Any]] = {}
    for _, override_data in parsed_override_files:
        for fix in override_data.get("clause_fixes") or []:
            cid = str(fix["clause_id"])
            cumulative_clause_fields.setdefault(cid, {})[str(fix["field"])] = fix["value"]
        for zfix in override_data.get("zone_fixes") or []:
            zid = str(zfix["zone_id"])
            cumulative_zone_fields.setdefault(zid, {}).update(dict(zfix["set"]))

    # Determine which clause_ids and zone_ids already match their final cumulative state
    clauses_already_converged: set[str] = set()
    for cid, target_fields in cumulative_clause_fields.items():
        _, _, active_clause = _find_active_clause(clause_trees, cid)
        if all(active_clause.get(k) == v for k, v in target_fields.items()):
            clauses_already_converged.add(cid)

    zones_already_converged: set[str] = set()
    if zones_payload is not None:
        features_list_check: list[dict[str, Any]] = zones_payload.get("features", [])
        for zid, target_fields in cumulative_zone_fields.items():
            active_feat = _find_active_zone_feature(features_list_check, zid)
            props = active_feat.get("properties", {})
            if all(props.get(k) == v for k, v in target_fields.items()):
                zones_already_converged.add(zid)

    modified_docs: set[str] = set()
    zones_modified = False
    applied_count = 0
    zone_tag_entries: list[dict[str, Any]] = []
    seen_tag_keys: set[tuple[str, str]] = set()

    for yaml_path, override_data in parsed_override_files:
        # 1. Validate and apply map_curations (never silently ignore)
        for mc in override_data.get("map_curations") or []:
            map_id = str(mc["map_id"])
            if map_id not in known_map_ids:
                raise click.ClickException(
                    f"Unknown map_id '{map_id}' in map_curations of '{yaml_path}' "
                    f"(known maps: {sorted(known_map_ids)})."
                )
            if zones_payload is not None:
                legend_map = {
                    str(le["zone_code"]): str(le["zone_label"])
                    for le in (mc.get("legend_entries") or [])
                }
                for feat in zones_payload.get("features", []):
                    props = feat.get("properties", {})
                    if (
                        props.get("source_map") == map_id
                        and props.get("superseded_by") is None
                        and props.get("record_superseded_by") is None
                    ):
                        zcode = str(props.get("zone_code", ""))
                        if (
                            zcode in legend_map
                            and props.get("verification") != "human_verified"
                            and props.get("zone_label") != legend_map[zcode]
                        ):
                            props["zone_label"] = legend_map[zcode]
                            zones_modified = True
                            applied_count += 1

        # 2. Apply zone_tags in YAML order
        for tag in override_data.get("zone_tags") or []:
            clause_id = str(tag["clause_id"])
            reason = str(tag["reason"])
            tag_verification = str(tag.get("verification") or "machine_checked")
            doc_id, clauses_list, active_clause = _find_active_clause(clause_trees, clause_id)

            existing_zones: list[str] = list(active_clause.get("applies_to_zones") or [])
            merged_zones = list(existing_zones)
            for z_code in tag["zones"]:
                z_str = str(z_code)
                if z_str not in merged_zones:
                    merged_zones.append(z_str)
                key = (clause_id, z_str)
                if key not in seen_tag_keys:
                    seen_tag_keys.add(key)
                    zone_tag_entries.append(
                        {
                            "clause_id": clause_id,
                            "doc_id": doc_id,
                            "zone_code": z_str,
                            "reason": reason,
                            "verification": tag_verification,
                        }
                    )

            if merged_zones != existing_zones:
                changed = _apply_clause_mutation(
                    clauses_list,
                    active_clause,
                    {"applies_to_zones": merged_zones},
                    reason=reason,
                )
                if changed:
                    modified_docs.add(doc_id)
                    applied_count += 1

        # 3. Apply clause_fixes in YAML order
        for fix in override_data.get("clause_fixes") or []:
            clause_id = str(fix["clause_id"])
            if clause_id in clauses_already_converged:
                continue
            field_name = str(fix["field"])
            field_val = fix["value"]
            reason = str(fix["reason"])
            doc_id, clauses_list, active_clause = _find_active_clause(clause_trees, clause_id)
            changed = _apply_clause_mutation(
                clauses_list,
                active_clause,
                {field_name: field_val},
                reason=reason,
            )
            if changed:
                modified_docs.add(doc_id)
                applied_count += 1

        # 4. Apply zone_fixes in YAML order
        for zfix in override_data.get("zone_fixes") or []:
            if zones_payload is None:
                raise click.ClickException(
                    f"Cannot apply zone_fixes from '{yaml_path}': '{zones_path}' does not exist."
                )
            zone_id = str(zfix["zone_id"])
            if zone_id in zones_already_converged:
                continue
            reason = str(zfix.get("reason") or "Manual zone override")
            features_list: list[dict[str, Any]] = zones_payload.get("features", [])
            active_feature = _find_active_zone_feature(features_list, zone_id)
            changed = _apply_zone_mutation(
                features_list,
                active_feature,
                dict(zfix["set"]),
                reason=reason,
            )
            if changed:
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

    tags_payload: dict[str, Any] = {
        "schema_version": "1.2",
        "jurisdiction": config.id,
        "tags": zone_tag_entries,
    }
    validate_payload(tags_payload, "clause-zone-tags", source=str(tags_path))
    tags_path.write_text(json.dumps(tags_payload, indent=2) + "\n", encoding="utf-8")

    click.echo(
        f"[apply-overrides] Applied {applied_count} override operation(s) and wrote "
        f"{len(zone_tag_entries)} clause-zone tag(s) for '{config.id}'."
    )
