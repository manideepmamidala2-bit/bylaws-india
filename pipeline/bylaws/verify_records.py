"""Human verification import and two-Match promotion rule (`bylaws verify import`)."""

from __future__ import annotations

import csv
import json
from pathlib import Path
from typing import Any

import click
import yaml

from bylaws.config import JurisdictionConfig
from bylaws.root import resolve_repo_root
from bylaws.schema_validator import validate_payload


def _normalize_verdict(raw: str) -> str:
    cleaned = raw.strip().lower().replace("'", "").replace(" ", "_")
    if cleaned in {"match", "matched", "yes"}:
        return "match"
    if cleaned in {"mismatch", "mismatched", "no"}:
        return "mismatch"
    if cleaned in {"cant_tell", "cannot_tell", "unsure", "unknown"}:
        return "cant_tell"
    raise click.ClickException(
        f"Invalid verification verdict '{raw}'. Expected Match, Mismatch, or Can't tell."
    )


def evaluate_record_verifications(
    entries: list[dict[str, Any]],
) -> dict[str, Any]:
    """Evaluate all verification entries for a single `record_id`.

    A record becomes `human_verified` ONLY when:
    - At least 2 independent `match` verdicts (distinct `(verifier_name, institution)` pairs) exist, AND
    - Zero `mismatch` verdicts exist.
    """
    distinct_match_verifiers: dict[tuple[str, str], dict[str, Any]] = {}
    mismatch_entries: list[dict[str, Any]] = []
    normalized_entries: list[dict[str, Any]] = []

    for e in entries:
        v_name = str(e.get("verifier_name") or "").strip()
        inst = str(e.get("institution") or "").strip()
        v_date = str(e.get("verified_at") or "").strip()
        verdict = _normalize_verdict(str(e.get("verdict") or ""))
        note = str(e.get("note") or "").strip() or None
        if not v_name or not inst or not v_date:
            continue

        norm_item = {
            "verifier_name": v_name,
            "institution": inst,
            "verified_at": v_date,
            "verdict": verdict,
            "note": note,
        }
        normalized_entries.append(norm_item)

        key = (v_name.lower(), inst.lower())
        if verdict == "match":
            if key not in distinct_match_verifiers:
                distinct_match_verifiers[key] = norm_item
        elif verdict == "mismatch":
            mismatch_entries.append(norm_item)

    has_mismatch = len(mismatch_entries) > 0
    independent_match_count = len(distinct_match_verifiers)
    promoted = independent_match_count >= 2 and not has_mismatch

    if promoted:
        credit_parts = [
            f"{v['verifier_name']}, {v['institution']}, {v['verified_at']}"
            for v in distinct_match_verifiers.values()
        ]
        verified_by_str: str | None = f"Verified by {'; '.join(credit_parts)}"
    else:
        verified_by_str = None

    return {
        "verification": "human_verified" if promoted else "machine_checked",
        "verified_by": verified_by_str,
        "verifications": normalized_entries,
        "independent_match_count": independent_match_count,
        "has_mismatch": has_mismatch,
        "mismatch_entries": mismatch_entries,
    }


def load_all_human_verifications(
    config: JurisdictionConfig,
    *,
    repo_root: Path | None = None,
) -> list[dict[str, Any]]:
    """Load `human_verifications` across `data/overrides/<id>/*.yaml` (and parent if applicable)."""
    root = repo_root or resolve_repo_root()
    cand_ids = [config.id]
    if config.parent and config.parent not in cand_ids:
        cand_ids.insert(0, config.parent)

    all_entries: list[dict[str, Any]] = []
    for cid in cand_ids:
        ov_dir = root / "data" / "overrides" / cid
        if not ov_dir.is_dir():
            continue
        for yml in sorted([*ov_dir.glob("*.yaml"), *ov_dir.glob("*.yml")]):
            raw = yaml.safe_load(yml.read_text(encoding="utf-8"))
            if isinstance(raw, dict) and isinstance(raw.get("human_verifications"), list):
                all_entries.extend(raw["human_verifications"])
    return all_entries


def collect_verified_contributors_for_jurisdiction(
    config: JurisdictionConfig,
    *,
    repo_root: Path | None = None,
) -> list[dict[str, Any]]:
    """Return deduplicated verifier credits (`verifier_name`, `institution`, `verified_count`) for promoted records."""
    entries = load_all_human_verifications(config, repo_root=repo_root)
    by_record: dict[str, list[dict[str, Any]]] = {}
    for e in entries:
        rid = str(e.get("record_id") or "").strip()
        if rid:
            by_record.setdefault(rid, []).append(e)

    counts_by_verifier: dict[tuple[str, str], dict[str, Any]] = {}
    for _, rec_entries in sorted(by_record.items()):
        ev = evaluate_record_verifications(rec_entries)
        if ev["verification"] != "human_verified":
            continue
        seen_in_record: set[tuple[str, str]] = set()
        for v in ev["verifications"]:
            if v["verdict"] != "match":
                continue
            key = (v["verifier_name"].lower(), v["institution"].lower())
            if key in seen_in_record:
                continue
            seen_in_record.add(key)
            if key not in counts_by_verifier:
                counts_by_verifier[key] = {
                    "verifier_name": v["verifier_name"],
                    "institution": v["institution"],
                    "verified_count": 1,
                }
            else:
                counts_by_verifier[key]["verified_count"] += 1

    return list(counts_by_verifier.values())


def write_verification_review_report(
    config: JurisdictionConfig,
    by_record_evaluations: dict[str, dict[str, Any]],
    *,
    repo_root: Path | None = None,
) -> Path:
    """Write open review items from any `Mismatch` verdicts to `data/reports/<id>/verification-review.md`."""
    root = repo_root or resolve_repo_root()
    report_dir = root / "data" / "reports" / config.id
    report_dir.mkdir(parents=True, exist_ok=True)
    report_path = report_dir / "verification-review.md"

    mismatched_records = [
        (rid, ev)
        for rid, ev in sorted(by_record_evaluations.items())
        if ev["has_mismatch"]
    ]
    promoted_records = [
        (rid, ev)
        for rid, ev in sorted(by_record_evaluations.items())
        if ev["verification"] == "human_verified"
    ]

    lines = [
        f"# Human Verification Review Report — `{config.id}` ({config.name})",
        "",
        f"- **Records with human verification entries**: `{len(by_record_evaluations)}`",
        f"- **Records promoted to `human_verified` (>= 2 independent Match, 0 Mismatch)**: `{len(promoted_records)}`",
        f"- **Open review items (`Mismatch` reported)**: `{len(mismatched_records)}`",
        "",
        "## Open Review Items (Mismatches)",
        "",
    ]

    if not mismatched_records:
        lines.append("No open mismatch review items.")
    else:
        lines.extend(
            [
                "| Record ID | Verifier | Institution | Date | Note | Status |",
                "|---|---|---|---|---|---|",
            ]
        )
        for rid, ev in mismatched_records:
            for m in ev["mismatch_entries"]:
                lines.append(
                    f"| `{rid}` | {m['verifier_name']} | {m['institution']} | {m['verified_at']} | {m.get('note') or '—'} | **OPEN REVIEW ITEM** |"
                )

    lines.extend(["", "## Promoted Person-Verified Records", ""])
    if not promoted_records:
        lines.append("No records promoted to `human_verified` yet.")
    else:
        for rid, ev in promoted_records:
            lines.append(f"- `{rid}` — {ev['verified_by']}")

    report_path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return report_path


def apply_human_verifications_to_records(
    config: JurisdictionConfig,
    human_verifications: list[dict[str, Any]],
    *,
    clause_trees: dict[str, dict[str, Any]] | None = None,
    parameters_payload: dict[str, Any] | None = None,
    zones_payload: dict[str, Any] | None = None,
    repo_root: Path | None = None,
) -> dict[str, Any]:
    """Apply the two-Match threshold to clauses, parameters, and zones."""
    by_record: dict[str, list[dict[str, Any]]] = {}
    for entry in human_verifications:
        rid = str(entry.get("record_id") or "").strip()
        if rid:
            by_record.setdefault(rid, []).append(entry)

    evaluations: dict[str, dict[str, Any]] = {
        rid: evaluate_record_verifications(items)
        for rid, items in by_record.items()
    }

    promoted_count = 0
    mismatch_count = 0
    modified_docs: set[str] = set()
    params_modified = False
    zones_modified = False

    for rid, ev in evaluations.items():
        if ev["verification"] == "human_verified":
            promoted_count += 1
        if ev["has_mismatch"]:
            mismatch_count += 1

        if clause_trees:
            for doc_id, tree in clause_trees.items():
                for clause in tree.get("clauses") or []:
                    if (
                        clause.get("superseded_by") is not None
                        or clause.get("record_superseded_by") is not None
                    ):
                        continue
                    cid = str(clause.get("clause_id") or "")
                    eid = str(clause.get("eid") or "")
                    if rid in {cid, eid, f"{doc_id}:{eid}"} and (
                        clause.get("verification") != ev["verification"]
                        or clause.get("verified_by") != ev["verified_by"]
                        or clause.get("verifications") != ev["verifications"]
                    ):
                        clause["verification"] = ev["verification"]
                        clause["verified_by"] = ev["verified_by"]
                        clause["verifications"] = ev["verifications"]
                        modified_docs.add(doc_id)

        if parameters_payload and isinstance(parameters_payload.get("records"), list):
            for rec in parameters_payload["records"]:
                if str(rec.get("parameter_id") or "") == rid and (
                    rec.get("verification") != ev["verification"]
                    or rec.get("verified_by") != ev["verified_by"]
                    or rec.get("verifications") != ev["verifications"]
                ):
                    rec["verification"] = ev["verification"]
                    rec["verified_by"] = ev["verified_by"]
                    rec["verifications"] = ev["verifications"]
                    params_modified = True

        if zones_payload and isinstance(zones_payload.get("features"), list):
            for feat in zones_payload["features"]:
                props = feat.get("properties") or {}
                if str(props.get("zone_id") or "") == rid and (
                    props.get("verification") != ev["verification"]
                    or props.get("verified_by") != ev["verified_by"]
                ):
                    props["verification"] = ev["verification"]
                    props["verified_by"] = ev["verified_by"]
                    zones_modified = True

    report_path = None
    if evaluations:
        report_path = write_verification_review_report(
            config, evaluations, repo_root=repo_root
        )

    return {
        "evaluations": evaluations,
        "promoted_count": promoted_count,
        "mismatch_count": mismatch_count,
        "modified_docs": modified_docs,
        "params_modified": params_modified,
        "zones_modified": zones_modified,
        "report_path": str(report_path) if report_path else None,
    }


def import_verifications_csv(
    config: JurisdictionConfig,
    csv_path: Path,
    *,
    repo_root: Path | None = None,
) -> dict[str, Any]:
    """Import a workshop verification CSV into `data/overrides/<id>/verifications.yaml` and evaluate two-Match threshold."""
    if not csv_path.is_file():
        raise click.ClickException(f"Verification CSV file not found: {csv_path}")

    root = repo_root or resolve_repo_root()
    overrides_dir = root / "data" / "overrides" / config.id
    overrides_dir.mkdir(parents=True, exist_ok=True)
    verif_yaml_path = overrides_dir / "verifications.yaml"

    existing_payload: dict[str, Any] = {"schema_version": "1.4", "human_verifications": []}
    if verif_yaml_path.is_file():
        loaded = yaml.safe_load(verif_yaml_path.read_text(encoding="utf-8"))
        if isinstance(loaded, dict):
            existing_payload = {
                "schema_version": "1.4",
                **loaded,
                "human_verifications": list(loaded.get("human_verifications") or []),
            }

    current_list: list[dict[str, Any]] = list(existing_payload["human_verifications"])
    seen_keys = {
        (
            str(item.get("record_id") or "").strip(),
            str(item.get("verifier_name") or "").strip().lower(),
            str(item.get("institution") or "").strip().lower(),
            str(item.get("verdict") or "").strip().lower(),
        )
        for item in current_list
    }

    imported_count = 0
    with csv_path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        for row in reader:
            record_id = str(row.get("record_id") or "").strip()
            raw_verdict = str(row.get("verdict") or "").strip()
            verifier_name = str(row.get("verifier_name") or "").strip()
            institution = str(row.get("institution") or "").strip()
            verified_at = str(row.get("verified_at") or "2026-11-26").strip()
            if not record_id or not raw_verdict or not verifier_name or not institution:
                continue
            verdict = _normalize_verdict(raw_verdict)
            raw_kind = str(row.get("record_kind") or "provision").strip().lower()
            record_kind = (
                raw_kind
                if raw_kind in {"provision", "parameter", "zone"}
                else ("parameter" if ":param_" in record_id else "provision")
            )
            task_id = str(row.get("task_id") or "").strip() or None
            note = str(row.get("note") or "").strip() or None

            dedup_key = (
                record_id,
                verifier_name.lower(),
                institution.lower(),
                verdict,
            )
            if dedup_key in seen_keys:
                continue
            seen_keys.add(dedup_key)
            current_list.append(
                {
                    "task_id": task_id,
                    "record_id": record_id,
                    "record_kind": record_kind,
                    "verifier_name": verifier_name,
                    "institution": institution,
                    "verified_at": verified_at,
                    "verdict": verdict,
                    "note": note,
                }
            )
            imported_count += 1

    existing_payload["human_verifications"] = current_list
    validate_payload(existing_payload, "overrides", source=str(verif_yaml_path))
    verif_yaml_path.write_text(
        yaml.safe_dump(existing_payload, sort_keys=False, allow_unicode=True),
        encoding="utf-8",
    )

    # Also apply to processed / published files if present
    ver = str(config.release_version or "4.0.0")
    clause_trees: dict[str, dict[str, Any]] = {}
    clause_paths: dict[str, list[Path]] = {}
    for base_dir in (
        root / "data" / "processed" / config.id / "documents",
        root / "public" / "data" / config.id / ver,
    ):
        if not base_dir.is_dir():
            continue
        for c_file in sorted(base_dir.glob("*.clauses.json")):
            tree = json.loads(c_file.read_text(encoding="utf-8"))
            doc_id = str(tree.get("doc_id") or "")
            if doc_id:
                clause_trees.setdefault(doc_id, tree)
                clause_paths.setdefault(doc_id, []).append(c_file)

    params_payload = None
    params_paths: list[Path] = []
    for p_cand in (
        root / "data" / "processed" / config.id / "parameters.json",
        root / "public" / "data" / config.id / ver / "parameters.json",
    ):
        if p_cand.is_file():
            if params_payload is None:
                params_payload = json.loads(p_cand.read_text(encoding="utf-8"))
            params_paths.append(p_cand)

    summary = apply_human_verifications_to_records(
        config,
        current_list,
        clause_trees=clause_trees,
        parameters_payload=params_payload,
        repo_root=root,
    )

    for doc_id in summary["modified_docs"]:
        tree_bytes = json.dumps(clause_trees[doc_id], indent=2) + "\n"
        for p in clause_paths.get(doc_id, []):
            p.write_text(tree_bytes, encoding="utf-8")

    if summary["params_modified"] and params_payload is not None:
        param_bytes = json.dumps(params_payload, indent=2) + "\n"
        for p in params_paths:
            p.write_text(param_bytes, encoding="utf-8")

    return {
        "imported_count": imported_count,
        "total_verifications": len(current_list),
        "verifications_yaml": str(verif_yaml_path),
        **summary,
    }
