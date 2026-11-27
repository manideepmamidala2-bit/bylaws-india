"""Stage 8.6: Apply committed manual corrections, zone tags, and map curations (Rules R6, R9, R12)."""

from __future__ import annotations

import copy
import json
import re
from pathlib import Path
from typing import Any

import click

from bylaws.annotations import validate_annotations_against_tree
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
                (
                    clause.get("clause_id") == clause_id
                    or clause.get("eid") == clause_id
                    or f"{doc_id}:{clause.get('eid')}" == clause_id
                )
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


def _find_annotation_entry(
    annotation_docs: dict[str, dict[str, Any]],
    annotation_id: str,
) -> tuple[str, dict[str, Any]]:
    for doc_id, ann_doc in annotation_docs.items():
        for ann in ann_doc.get("annotations", []):
            if ann.get("annotation_id") == annotation_id:
                return doc_id, ann
    raise click.ClickException(
        f"Override target annotation_id '{annotation_id}' not found in any document annotations."
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
    sync_updates = dict(updates)
    if "title" in sync_updates and "heading" not in sync_updates:
        sync_updates["heading"] = sync_updates["title"]
    elif "heading" in sync_updates and "title" not in sync_updates:
        sync_updates["title"] = sync_updates["heading"]
    if "text" in sync_updates and "content" not in sync_updates and not active_clause.get("children"):
        sync_updates["content"] = sync_updates["text"]
    elif "content" in sync_updates and "text" not in sync_updates and not active_clause.get("children"):
        sync_updates["text"] = sync_updates["content"]

    if all(active_clause.get(k) == v for k, v in sync_updates.items()):
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
        for key, val in sync_updates.items():
            new_clause[key] = val
        if new_clause.get("versions"):
            if "heading" in sync_updates:
                new_clause["versions"][0]["heading"] = sync_updates["heading"]
            if "content" in sync_updates:
                new_clause["versions"][0]["content"] = sync_updates["content"]
        clauses_list.append(new_clause)
    else:
        for key, val in sync_updates.items():
            active_clause[key] = val
        if active_clause.get("versions"):
            if "heading" in sync_updates:
                active_clause["versions"][0]["heading"] = sync_updates["heading"]
            if "content" in sync_updates:
                active_clause["versions"][0]["content"] = sync_updates["content"]
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
    annotation_docs: dict[str, dict[str, Any]] = {}
    if docs_dir.is_dir():
        for clause_file in sorted(docs_dir.glob("*.clauses.json")):
            tree_data: dict[str, Any] = json.loads(clause_file.read_text(encoding="utf-8"))
            clause_trees[str(tree_data["doc_id"])] = tree_data
        for ann_file in sorted(docs_dir.glob("*.annotations.json")):
            ann_data: dict[str, Any] = json.loads(ann_file.read_text(encoding="utf-8"))
            annotation_docs[str(ann_data["doc_id"])] = ann_data

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
    modified_ann_docs: set[str] = set()
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

        # 5. Apply annotation_fixes in YAML order (idempotent)
        for afix in override_data.get("annotation_fixes") or []:
            ann_id = str(afix["annotation_id"])
            field_name = str(afix["field"])
            field_val = afix["value"]
            doc_id, ann_entry = _find_annotation_entry(annotation_docs, ann_id)
            if ann_entry.get(field_name) != field_val:
                ann_entry[field_name] = field_val
                modified_ann_docs.add(doc_id)
                applied_count += 1

    # 6. Apply human_verifications (two-Match threshold & mismatch review items, Part 4.3)
    all_human_verifs: list[dict[str, Any]] = []
    for _, override_data in parsed_override_files:
        for hv in override_data.get("human_verifications") or []:
            all_human_verifs.append(dict(hv))
    if all_human_verifs:
        from bylaws.verify_records import apply_human_verifications_to_records

        params_path = processed_dir / "parameters.json"
        params_payload = (
            json.loads(params_path.read_text(encoding="utf-8"))
            if params_path.is_file()
            else None
        )
        hv_res = apply_human_verifications_to_records(
            config,
            all_human_verifs,
            clause_trees=clause_trees,
            parameters_payload=params_payload,
            zones_payload=zones_payload,
            repo_root=root,
        )
        modified_docs.update(hv_res["modified_docs"])
        if hv_res["zones_modified"]:
            zones_modified = True
        if hv_res["params_modified"] and params_payload is not None:
            validate_payload(params_payload, "parameters", source=str(params_path))
            params_path.write_text(
                json.dumps(params_payload, indent=2) + "\n", encoding="utf-8"
            )
        applied_count += int(hv_res["promoted_count"])

    # 7. Populate `applies_to_zones` and `clause-zone-tags.json` from `zone_applicability` annotations (PR 11 §2)
    if config.visibility != "test":
        seen_tagged_pairs = {
            (str(t["clause_id"]), str(t.get("zone_code") or ""))
            for t in zone_tag_entries
        }
        for doc_id, ann_doc in sorted(annotation_docs.items()):
            if doc_id not in clause_trees:
                continue
            tree = clause_trees[doc_id]
            node_by_eid = {
                str(c.get("eid")): c
                for c in tree.get("clauses", [])
                if c.get("superseded_by") is None and c.get("record_superseded_by") is None
            }
            zones_by_eid: dict[str, list[tuple[str, str]]] = {}
            for ann in ann_doc.get("annotations", []):
                if ann.get("kind") == "zone_applicability":
                    target = ann.get("target") or {}
                    t_eid = str(target.get("eid") or "")
                    z_val = str(ann.get("value") or "")
                    s_txt = str(target.get("span_text") or "")
                    if t_eid and z_val:
                        zones_by_eid.setdefault(t_eid, []).append((z_val, s_txt))
            for t_eid, z_pairs in sorted(zones_by_eid.items()):
                node = node_by_eid.get(t_eid)
                if node is None:
                    continue
                if node.get("type") in {
                    "preface",
                    "preamble",
                    "signature_block",
                    "definition",
                    "part",
                    "chapter",
                    "schedule",
                    "annexure",
                    "appendix",
                    "form",
                } or str(node.get("eid") or "").startswith(("pref_", "prea_", "sig_")):
                    continue
                cid = str(node["clause_id"])
                z_codes = list(dict.fromkeys(zp[0] for zp in z_pairs))
                existing_z = list(node.get("applies_to_zones") or [])
                merged_z = list(dict.fromkeys([*existing_z, *z_codes]))
                if merged_z != existing_z:
                    node["applies_to_zones"] = merged_z
                    modified_docs.add(doc_id)
                for z_code, span_txt in z_pairs:
                    if (cid, z_code) not in seen_tagged_pairs:
                        seen_tagged_pairs.add((cid, z_code))
                        zone_tag_entries.append(
                            {
                                "clause_id": cid,
                                "doc_id": doc_id,
                                "zone_code": z_code,
                                "reason": f"Matched zone_applicability evidence: '{span_txt[:150]}'",
                                "verification": "machine_checked",
                            }
                        )

    for doc_id in sorted(modified_docs):
        tree_payload = clause_trees[doc_id]
        out_path = docs_dir / f"{doc_id}.clauses.json"
        validate_payload(tree_payload, "clause-tree", source=str(out_path))
        out_path.write_text(json.dumps(tree_payload, indent=2) + "\n", encoding="utf-8")

    for doc_id in sorted(modified_ann_docs):
        ann_payload = annotation_docs[doc_id]
        ann_out_path = docs_dir / f"{doc_id}.annotations.json"
        validate_payload(ann_payload, "annotations", source=str(ann_out_path))
        if doc_id in clause_trees:
            validate_annotations_against_tree(ann_payload, clause_trees[doc_id])
        ann_out_path.write_text(json.dumps(ann_payload, indent=2) + "\n", encoding="utf-8")

    if zones_modified and zones_payload is not None:
        validate_payload(zones_payload, "zones", source=str(zones_path))
        zones_path.write_text(json.dumps(zones_payload, indent=2) + "\n", encoding="utf-8")

    tags_payload: dict[str, Any] = {
        "schema_version": "1.4",
        "jurisdiction": config.id,
        "tags": zone_tag_entries,
    }
    validate_payload(tags_payload, "clause-zone-tags", source=str(tags_path))
    tags_path.write_text(json.dumps(tags_payload, indent=2) + "\n", encoding="utf-8")

    click.echo(
        f"[apply-overrides] Applied {applied_count} override operation(s) and wrote "
        f"{len(zone_tag_entries)} clause-zone tag(s) for '{config.id}'."
    )
