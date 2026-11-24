"""Stage 8.5: Detect amendment instructions, build Layer 3 effects and node versions, and consolidate."""

from __future__ import annotations

import copy
import json
import re
from pathlib import Path
from typing import Any

import click

from bylaws.config import JurisdictionConfig
from bylaws.consolidate import run_consolidate
from bylaws.root import resolve_repo_root
from bylaws.schema_validator import validate_payload
from bylaws.structure import build_eid, sanitise_native_token

CLAUSE_NUM_PATTERN = r"([A-Za-z]?\d+(?:\.\d+)*[A-Za-z]?)"

AMENDMENT_PATTERNS: tuple[tuple[str, float, str, re.Pattern[str]], ...] = (
    (
        "substitute",
        0.95,
        "high",
        re.compile(
            rf"\bfor\s+(?:clause|bye-?law|regulation|section)\s+{CLAUSE_NUM_PATTERN}\b[^.]*?\bsubstituted\b"
            rf"|\bsubstitute(?:d)?\s+for\s+(?:clause|bye-?law|regulation|section)\s+{CLAUSE_NUM_PATTERN}\b",
            re.IGNORECASE,
        ),
    ),
    (
        "insert_after",
        0.95,
        "high",
        re.compile(
            rf"\bafter\s+(?:clause|bye-?law|regulation|section|chapter)\s+{CLAUSE_NUM_PATTERN}\b[^.]*?\binsert(?:ed)?\b"
            rf"|\binsert(?:ed)?\s+after\s+(?:clause|bye-?law|regulation|section|chapter)\s+{CLAUSE_NUM_PATTERN}\b",
            re.IGNORECASE,
        ),
    ),
    (
        "insert_before",
        0.95,
        "high",
        re.compile(
            rf"\bbefore\s+(?:clause|bye-?law|regulation|section|chapter)\s+{CLAUSE_NUM_PATTERN}\b[^.]*?\binsert(?:ed)?\b"
            rf"|\binsert(?:ed)?\s+before\s+(?:clause|bye-?law|regulation|section|chapter)\s+{CLAUSE_NUM_PATTERN}\b",
            re.IGNORECASE,
        ),
    ),
    (
        "omit",
        0.95,
        "high",
        re.compile(
            rf"\b(?:clause|bye-?law|regulation|section)\s+{CLAUSE_NUM_PATTERN}\s+shall\s+be\s+(?:omitted|deleted)\b"
            rf"|\b(?:omit|delete)(?:ted|d)?\s+(?:clause|bye-?law|regulation|section)\s+{CLAUSE_NUM_PATTERN}\b",
            re.IGNORECASE,
        ),
    ),
    (
        "modify_text",
        0.65,
        "medium",
        re.compile(
            rf"\b(?:amendment\s+of|in)\s+(?:clause|bye-?law|regulation|section)\s+{CLAUSE_NUM_PATTERN}\b",
            re.IGNORECASE,
        ),
    ),
)

QUOTED_TEXT_RE = re.compile(
    r"(?:substituted|inserted)\s*:\s*['\"\u2018\u201c](?P<quoted>.+)['\"\u2019\u201d]\s*\.?$",
    re.IGNORECASE | re.DOTALL,
)

LEADING_CLAUSE_RE = re.compile(
    r"^(?P<num>[A-Za-z]?\d+(?:\.\d+)*[A-Za-z]?)\b\.?\s+(?P<rest>.+)$",
    re.DOTALL,
)


def detect_amendment_instruction(
    text: str, title: str | None = None
) -> tuple[str, str, float, str] | None:
    """Detect `(target_clause_number, action, numeric_confidence, label_confidence)` from clause text/title."""
    combined = f"{title or ''}. {text}".strip()
    for action, num_conf, lbl_conf, pattern in AMENDMENT_PATTERNS:
        match = pattern.search(combined)
        if match:
            for group_val in match.groups():
                if group_val:
                    return group_val, action, num_conf, lbl_conf
    return None


def _parse_quoted_node_payload(
    amending_text: str,
    *,
    action: str,
    target_node: dict[str, Any] | None,
) -> dict[str, Any]:
    """Extract quoted text from an amending instruction and structure it as an `EffectNodePayload`."""
    q_match = QUOTED_TEXT_RE.search(amending_text.strip())
    raw_quoted = q_match.group("quoted").strip() if q_match else amending_text.strip()

    parent_eid = target_node.get("parent_eid") if target_node else None
    target_type = str(target_node.get("type") or "clause") if target_node else "clause"
    target_num = str(target_node.get("native_number") or target_node.get("number") or "1") if target_node else "1"
    target_heading = target_node.get("heading") if target_node else None

    lead_match = LEADING_CLAUSE_RE.match(raw_quoted)
    if lead_match:
        native_num = lead_match.group("num").strip()
        rest = lead_match.group("rest").strip()
    else:
        native_num = f"{target_num}A" if action in {"insert_after", "insert_before"} else target_num
        rest = raw_quoted

    heading = target_heading
    content = rest
    if ":" in rest:
        head_part, tail_part = rest.split(":", 1)
        if len(head_part.split()) <= 10 and tail_part.strip():
            heading = head_part.strip()
            content = tail_part.strip()

    if action == "substitute" and target_node is not None:
        eid = str(target_node["eid"])
    else:
        eid = build_eid(parent_eid, target_type, native_num)

    return {
        "eid": eid,
        "native_number": native_num,
        "type": target_type,
        "heading": heading,
        "intro": None,
        "content": content,
        "wrap_up": None,
        "parent_eid": parent_eid,
    }


def _load_clause_tree(docs_dir: Path, doc_id: str) -> dict[str, Any]:
    path = docs_dir / f"{doc_id}.clauses.json"
    if not path.is_file():
        raise click.ClickException(
            f"Clause tree file not found for document '{doc_id}': {path}. "
            "Run `bylaws structure` first."
        )
    data: dict[str, Any] = json.loads(path.read_text(encoding="utf-8"))
    return data


def _apply_effect_to_target_tree(
    target_tree: dict[str, Any],
    target_node: dict[str, Any],
    effect: dict[str, Any],
    amending_node: dict[str, Any],
) -> None:
    """Apply a high-confidence `effect` to `target_tree` by updating or inserting node `versions`."""
    action = str(effect["action"])
    valid_from = effect.get("valid_from")
    effect_id = str(effect["effect_id"])
    amending_doc = str(effect["amending_doc"])
    amending_eid = str(effect["amending_eid"])
    amending_citations = copy.deepcopy(amending_node.get("citations") or [])

    if action in {"substitute", "modify_text", "renumber"}:
        versions: list[dict[str, Any]] = list(target_node.get("versions") or [])
        if versions:
            versions[-1]["valid_to"] = valid_from
        new_node_info = (effect.get("new_nodes") or [{}])[0]
        new_ver: dict[str, Any] = {
            "version_id": f"v{len(versions) + 1}",
            "valid_from": valid_from,
            "valid_to": None,
            "heading": new_node_info.get("heading") or target_node.get("heading"),
            "intro": new_node_info.get("intro"),
            "content": new_node_info.get("content") or target_node.get("content"),
            "wrap_up": new_node_info.get("wrap_up"),
            "cells": target_node.get("cells"),
            "source_doc": amending_doc,
            "source_eid": amending_eid,
            "effect_id": effect_id,
            "citations": amending_citations or copy.deepcopy(target_node.get("citations") or []),
            "legal_status": "in_force",
            "omitted": False,
        }
        versions.append(new_ver)
        target_node["versions"] = versions
        return

    if action == "omit":
        versions = list(target_node.get("versions") or [])
        if versions:
            versions[-1]["valid_to"] = valid_from
        omitted_ver: dict[str, Any] = {
            "version_id": f"v{len(versions) + 1}",
            "valid_from": valid_from,
            "valid_to": None,
            "heading": target_node.get("heading"),
            "intro": None,
            "content": f"[Omitted by {amending_doc}:{amending_eid} with effect from {valid_from}.]",
            "wrap_up": None,
            "cells": None,
            "source_doc": amending_doc,
            "source_eid": amending_eid,
            "effect_id": effect_id,
            "citations": amending_citations or copy.deepcopy(target_node.get("citations") or []),
            "legal_status": "superseded",
            "omitted": True,
        }
        versions.append(omitted_ver)
        target_node["versions"] = versions
        return

    if action in {"insert_after", "insert_before"} and effect.get("new_nodes"):
        new_info = effect["new_nodes"][0]
        new_eid = str(new_info["eid"])
        target_doc = str(target_tree["doc_id"])
        clauses_list: list[dict[str, Any]] = target_tree.get("clauses", [])
        if any(c.get("eid") == new_eid for c in clauses_list):
            return

        native_num = str(new_info.get("native_number") or sanitise_native_token(new_eid))
        clause_id = f"{target_doc}:{native_num}"
        parent_eid = new_info.get("parent_eid")
        heading = new_info.get("heading")
        content = new_info.get("content") or ""

        ver_1: dict[str, Any] = {
            "version_id": "v1",
            "valid_from": valid_from,
            "valid_to": None,
            "heading": heading,
            "intro": new_info.get("intro"),
            "content": content,
            "wrap_up": new_info.get("wrap_up"),
            "cells": None,
            "source_doc": amending_doc,
            "source_eid": amending_eid,
            "effect_id": effect_id,
            "citations": amending_citations,
            "legal_status": "in_force",
            "omitted": False,
        }
        inserted_node: dict[str, Any] = {
            "eid": new_eid,
            "native_number": native_num,
            "type": str(new_info.get("type") or "clause"),
            "heading": heading,
            "intro": new_info.get("intro"),
            "content": content,
            "wrap_up": new_info.get("wrap_up"),
            "children": [],
            "parent_eid": parent_eid,
            "defines": None,
            "defines_normalised": None,
            "table_meta": None,
            "cells": None,
            "versions": [ver_1],
            "clause_id": clause_id,
            "record_version": 1,
            "record_id": f"{clause_id}@v1",
            "record_supersedes": None,
            "record_superseded_by": None,
            "record_change_reason": None,
            "supersedes": None,
            "superseded_by": None,
            "legal_status": "in_force",
            "effective_from": valid_from,
            "number": native_num,
            "title": heading,
            "level": int(target_node.get("level") or 2),
            "parent_id": target_node.get("parent_id"),
            "order": 0,
            "text": content,
            "language": "en",
            "tables": [],
            "citations": amending_citations,
            "cross_references": [],
            "amended_by": [f"{amending_doc}:{amending_node.get('number', amending_eid)}"],
            "applies_to_zones": list(target_node.get("applies_to_zones") or []),
            "verification": "machine_checked",
            "verified_by": None,
        }

        target_idx = next(
            (i for i, c in enumerate(clauses_list) if c.get("eid") == target_node.get("eid")),
            len(clauses_list) - 1,
        )
        insert_pos = target_idx if action == "insert_before" else target_idx + 1
        clauses_list.insert(insert_pos, inserted_node)
        for idx, c in enumerate(clauses_list):
            c["order"] = idx

        if parent_eid:
            for c in clauses_list:
                if c.get("eid") == parent_eid:
                    children = list(c.get("children") or [])
                    if new_eid not in children:
                        if target_node.get("eid") in children:
                            t_pos = children.index(str(target_node["eid"]))
                            children.insert(
                                t_pos if action == "insert_before" else t_pos + 1,
                                new_eid,
                            )
                        else:
                            children.append(new_eid)
                        c["children"] = children
                    break


def run_amendments(config: JurisdictionConfig, *, repo_root: Path | None = None) -> None:
    """Detect and link amendment instructions, build Layer 3 `effects` and node `versions`, and consolidate."""
    root = repo_root or resolve_repo_root()
    processed_dir = root / "data" / "processed" / config.id
    docs_dir = processed_dir / "documents"
    processed_dir.mkdir(parents=True, exist_ok=True)

    loaded_trees: dict[str, dict[str, Any]] = {}
    modified_doc_ids: set[str] = set()
    links: list[dict[str, Any]] = []
    effects: list[dict[str, Any]] = []
    effect_seq = 0

    for doc in config.documents:
        is_amend = doc.role == "amendment" or doc.doc_type in {"amendment", "notification"}
        if not is_amend or not doc.amends:
            continue
        if doc.text_rights is not None and doc.text_rights.mode == "reference_only":
            continue
        if getattr(doc, "acquisition_status", None) in {"pending", "not_found"}:
            continue
        if getattr(doc, "structured", None) is False:
            continue

        if doc.id not in loaded_trees:
            loaded_trees[doc.id] = _load_clause_tree(docs_dir, doc.id)
        amend_tree = loaded_trees[doc.id]

        target_doc_ids = list(doc.amends)
        for target_doc_id in target_doc_ids:
            if target_doc_id not in loaded_trees:
                loaded_trees[target_doc_id] = _load_clause_tree(docs_dir, target_doc_id)

        for clause in amend_tree.get("clauses", []):
            if clause.get("superseded_by") is not None or clause.get("record_superseded_by") is not None:
                continue
            detection = detect_amendment_instruction(
                str(clause.get("text", "")),
                clause.get("title"),
            )
            if detection is None:
                continue

            target_number, action, num_conf, lbl_conf = detection
            amending_clause_id = str(clause["clause_id"])
            amending_eid = str(clause.get("eid") or clause.get("number") or "")
            valid_from = doc.effective_from or doc.notified_date

            matched_target_node: dict[str, Any] | None = None
            matched_target_doc_id: str = target_doc_ids[0]
            for target_doc_id in target_doc_ids:
                candidate_id = f"{target_doc_id}:{target_number}"
                target_tree = loaded_trees[target_doc_id]
                for target_clause in target_tree.get("clauses", []):
                    if (
                        (
                            target_clause.get("clause_id") == candidate_id
                            or target_clause.get("native_number") == target_number
                            or target_clause.get("number") == target_number
                        )
                        and target_clause.get("superseded_by") is None
                        and target_clause.get("record_superseded_by") is None
                    ):
                        matched_target_node = target_clause
                        matched_target_doc_id = target_doc_id
                        amended_by: list[str] = list(target_clause.get("amended_by", []))
                        if amending_clause_id not in amended_by:
                            amended_by.append(amending_clause_id)
                            target_clause["amended_by"] = amended_by
                            modified_doc_ids.add(target_doc_id)
                        break
                if matched_target_node is not None:
                    break

            if matched_target_node is None:
                matched_target_clause_id = f"{target_doc_ids[0]}:{target_number}"
                matched_target_eid = build_eid(None, "clause", target_number)
                num_conf = 0.4
                lbl_conf = "low"
                unapplied_reason: str | None = (
                    f"Target provision '{target_number}' not found in '{matched_target_doc_id}'."
                )
            else:
                matched_target_clause_id = str(matched_target_node["clause_id"])
                matched_target_eid = str(matched_target_node.get("eid") or target_number)
                unapplied_reason = None

            effect_seq += 1
            effect_id = f"{doc.id}:eff_{effect_seq}"

            new_nodes: list[dict[str, Any]] = []
            if action in {"substitute", "insert_after", "insert_before", "modify_text"}:
                new_nodes.append(
                    _parse_quoted_node_payload(
                        str(clause.get("text", "")),
                        action=action,
                        target_node=matched_target_node,
                    )
                )

            should_apply = (
                matched_target_node is not None
                and num_conf >= 0.8
                and doc.legal_status == "in_force"
            )
            if not should_apply and unapplied_reason is None:
                if doc.legal_status != "in_force":
                    unapplied_reason = f"Amending instrument has status '{doc.legal_status}'."
                else:
                    unapplied_reason = f"Effect confidence ({num_conf}) is below 0.8 threshold."

            effect_entry: dict[str, Any] = {
                "effect_id": effect_id,
                "amending_doc": doc.id,
                "amending_eid": amending_eid,
                "target_doc": matched_target_doc_id,
                "target_eid": matched_target_eid,
                "action": action,
                "new_nodes": new_nodes,
                "valid_from": valid_from,
                "confidence": num_conf,
                "applied": should_apply,
                "unapplied_reason": unapplied_reason,
                "verification": "machine_checked" if should_apply else "unverified",
            }
            effects.append(effect_entry)

            if should_apply and matched_target_node is not None:
                _apply_effect_to_target_tree(
                    loaded_trees[matched_target_doc_id],
                    matched_target_node,
                    effect_entry,
                    clause,
                )
                modified_doc_ids.add(matched_target_doc_id)

            compat_action = "modify" if action == "modify_text" else action
            links.append(
                {
                    "amending_clause": amending_clause_id,
                    "target_clause": matched_target_clause_id,
                    "amending_doc_id": doc.id,
                    "target_doc_id": matched_target_doc_id,
                    "action": compat_action,
                    "effective_date": valid_from,
                    "confidence": lbl_conf,
                    "verification": "machine_checked" if should_apply else "unverified",
                }
            )

    for doc_id in sorted(modified_doc_ids):
        tree_payload = loaded_trees[doc_id]
        tree_path = docs_dir / f"{doc_id}.clauses.json"
        validate_payload(tree_payload, "clause-tree", source=str(tree_path))
        tree_path.write_text(json.dumps(tree_payload, indent=2) + "\n", encoding="utf-8")

    amendments_payload: dict[str, Any] = {
        "schema_version": "1.3",
        "jurisdiction": config.id,
        "effects": effects,
        "links": links,
    }
    amendments_path = processed_dir / "amendments.json"
    validate_payload(amendments_payload, "amendments", source=str(amendments_path))
    amendments_path.write_text(
        json.dumps(amendments_payload, indent=2) + "\n",
        encoding="utf-8",
    )

    consolidated_payload = run_consolidate(config, repo_root=root)
    click.echo(
        f"[amendments] Linked {len(links)} amendment instruction(s) ({len(effects)} effect(s)) "
        f"and consolidated {len(consolidated_payload['records'])} clause(s) for '{config.id}'."
    )
