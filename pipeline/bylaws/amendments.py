"""Stage 8.5: Detect amendment instructions, build Layer 3 effects and node versions, and consolidate."""

from __future__ import annotations

import copy
import json
import re
from pathlib import Path
from typing import Any

import click
import yaml

from bylaws.annotations import build_document_annotations
from bylaws.config import JurisdictionConfig, load_jurisdiction_config
from bylaws.consolidate import format_change_mark_label, run_consolidate
from bylaws.root import resolve_repo_root
from bylaws.schema_validator import validate_file, validate_payload
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
        cleaned_head = head_part.lstrip("“\"'‘ ")
        if (
            len(head_part.split()) <= 10
            and tail_part.strip()
            and not cleaned_head.startswith("(")
        ):
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


def _reset_clause_tree_versions(tree: dict[str, Any]) -> None:
    """Reset any applied Layer 3 versions on `tree` so `run_amendments` is idempotent."""
    clauses = list(tree.get("clauses") or [])
    base_clauses: list[dict[str, Any]] = []
    inserted_eids: set[str] = set()
    for c in clauses:
        vers = list(c.get("versions") or [])
        if vers and vers[0].get("effect_id") is not None:
            inserted_eids.add(str(c.get("eid")))
            continue
        if vers:
            v0 = dict(vers[0])
            v0["valid_to"] = None
            c["versions"] = [v0]
        c["amended_by"] = []
        c.pop("change_mark", None)
        c.pop("omitted", None)
        c.pop("notes_by_site", None)
        base_clauses.append(c)
    if inserted_eids:
        for idx, c in enumerate(base_clauses):
            c["order"] = idx
            if c.get("children"):
                c["children"] = [ch for ch in c["children"] if ch not in inserted_eids]
    tree["clauses"] = base_clauses


def _load_clause_tree(docs_dir: Path, doc_id: str, parent_docs_dir: Path | None = None) -> dict[str, Any]:
    path = docs_dir / f"{doc_id}.clauses.json"
    if not path.is_file() and parent_docs_dir is not None:
        parent_cand = parent_docs_dir / f"{doc_id}.clauses.json"
        if parent_cand.is_file():
            path = parent_cand
    if not path.is_file():
        raise click.ClickException(
            f"Clause tree file not found for document '{doc_id}': {path}. "
            "Run `bylaws structure` first."
        )
    data: dict[str, Any] = json.loads(path.read_text(encoding="utf-8"))
    _reset_clause_tree_versions(data)
    return data


def _refine_amending_citations_for_content(
    amending_doc: str,
    amending_citations: list[dict[str, Any]],
    content_text: str,
    *,
    jurisdiction_id: str,
    parent_id: str | None,
    repo_root: Path,
) -> list[dict[str, Any]]:
    """When an amending node spans multiple pages, narrow or order `amending_citations` so `citations[0]` is the exact page where `content_text` appears."""
    if len(amending_citations) <= 1 or not content_text.strip():
        return amending_citations
    try:
        from bylaws.fidelity import _load_doc_page_token_sets, extract_word_tokens

        page_map = _load_doc_page_token_sets(
            amending_doc,
            jurisdiction_id,
            parent_id=parent_id,
            repo_root=repo_root,
        )
        words = [w for w in extract_word_tokens(content_text) if len(w) >= 2]
        if not words:
            return amending_citations
        exact_single_pages = [
            cit
            for cit in amending_citations
            if isinstance(cit.get("page"), int)
            and all(w in page_map.get(int(cit["page"]), set()) for w in words)
        ]
        if exact_single_pages:
            return exact_single_pages
        scored = sorted(
            amending_citations,
            key=lambda cit: sum(
                1
                for w in words
                if isinstance(cit.get("page"), int)
                and w in page_map.get(int(cit["page"]), set())
            ),
            reverse=True,
        )
        return scored
    except Exception:
        return amending_citations


def _apply_effect_to_target_tree(
    target_tree: dict[str, Any],
    target_node: dict[str, Any],
    effect: dict[str, Any],
    amending_node: dict[str, Any],
    *,
    jurisdiction_name: str = "",
    amending_doc_title: str = "",
    jurisdiction_id: str = "",
    parent_id: str | None = None,
    repo_root: Path | None = None,
) -> None:
    """Apply a high-confidence `effect` to `target_tree` by updating or inserting node `versions`."""
    action = str(effect["action"])
    valid_from = effect.get("valid_from")
    effect_id = str(effect["effect_id"])
    amending_doc = str(effect["amending_doc"])
    amending_eid = str(effect["amending_eid"])
    amending_citations = copy.deepcopy(amending_node.get("citations") or [])
    mark_label = format_change_mark_label(
        amending_doc,
        str(valid_from or ""),
        jurisdiction_name=jurisdiction_name,
        amending_doc_title=amending_doc_title,
    )

    site_note: str | None = effect.get("site_note")
    if action in {"substitute", "modify_text", "renumber"}:
        versions: list[dict[str, Any]] = list(target_node.get("versions") or [])
        orig_ver = versions[0] if versions else {}
        if versions:
            versions[-1]["valid_to"] = valid_from
        new_node_info = (effect.get("new_nodes") or [{}])[0]
        new_content = new_node_info.get("content") or target_node.get("content")
        refined_cits = (
            _refine_amending_citations_for_content(
                amending_doc,
                amending_citations,
                str(new_content or ""),
                jurisdiction_id=jurisdiction_id or str(target_tree.get("jurisdiction") or ""),
                parent_id=parent_id,
                repo_root=repo_root or resolve_repo_root(),
            )
            if amending_citations
            else copy.deepcopy(target_node.get("citations") or [])
        )
        new_ver: dict[str, Any] = {
            "version_id": f"v{len(versions) + 1}",
            "valid_from": valid_from,
            "valid_to": None,
            "heading": new_node_info.get("heading") or target_node.get("heading"),
            "intro": new_node_info.get("intro"),
            "content": new_content,
            "wrap_up": new_node_info.get("wrap_up"),
            "cells": target_node.get("cells"),
            "source_doc": amending_doc,
            "source_eid": amending_eid,
            "effect_id": effect_id,
            "citations": refined_cits,
            "legal_status": "in_force",
            "omitted": False,
            **({"notes_by_site": [site_note]} if site_note else {}),
        }
        versions.append(new_ver)
        target_node["versions"] = versions
        if site_note:
            existing_notes = list(target_node.get("notes_by_site") or [])
            if site_note not in existing_notes:
                existing_notes.append(site_note)
            target_node["notes_by_site"] = existing_notes
        if jurisdiction_name:
            target_node["change_mark"] = {
                "label": mark_label,
                "amending_doc": amending_doc,
                "amending_eid": amending_eid,
                "amending_clause_id": f"{amending_doc}:{amending_eid}",
                "effective_date": str(valid_from or ""),
                "action": action,
                "original_text": orig_ver.get("content") or target_node.get("text"),
                "original_heading": orig_ver.get("heading") or target_node.get("heading"),
                "original_cells": orig_ver.get("cells") or target_node.get("cells"),
            }
        return

    if action == "omit":
        versions = list(target_node.get("versions") or [])
        orig_ver = versions[0] if versions else {}
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
        if jurisdiction_name:
            target_node["omitted"] = True
            target_node["change_mark"] = {
                "label": mark_label,
                "amending_doc": amending_doc,
                "amending_eid": amending_eid,
                "amending_clause_id": f"{amending_doc}:{amending_eid}",
                "effective_date": str(valid_from or ""),
                "action": "omit",
                "original_text": orig_ver.get("content") or target_node.get("text"),
                "original_heading": orig_ver.get("heading") or target_node.get("heading"),
                "original_cells": orig_ver.get("cells") or target_node.get("cells"),
            }
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
            **({"notes_by_site": [site_note]} if site_note else {}),
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
            **({"notes_by_site": [site_note]} if site_note else {}),
            **(
                {
                    "omitted": False,
                    "change_mark": {
                        "label": mark_label,
                        "amending_doc": amending_doc,
                        "amending_eid": amending_eid,
                        "amending_clause_id": f"{amending_doc}:{amending_eid}",
                        "effective_date": str(valid_from or ""),
                        "action": action,
                        "original_text": None,
                        "original_heading": None,
                        "original_cells": None,
                    },
                }
                if jurisdiction_name
                else {}
            ),
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


def run_amendments(
    config: JurisdictionConfig,
    *,
    repo_root: Path | None = None,
    _cascade_children: bool = True,
) -> None:
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

    parent_id = getattr(config, "parent", None)
    parent_docs_dir = (
        root / "data" / "processed" / str(parent_id) / "documents"
        if parent_id
        else None
    )

    effective_cfg_links: list[dict[str, Any]] = []
    seen_cfg_link_keys: set[tuple[str, str]] = set()
    for cfg_lnk in getattr(config, "amendment_links", None) or []:
        d_lnk = cfg_lnk.model_dump() if hasattr(cfg_lnk, "model_dump") else dict(cfg_lnk)
        k_lnk = (str(d_lnk.get("amending_clause") or ""), str(d_lnk.get("target_clause") or ""))
        if k_lnk not in seen_cfg_link_keys:
            seen_cfg_link_keys.add(k_lnk)
            effective_cfg_links.append(d_lnk)

    if parent_id and (root / "jurisdictions" / f"{parent_id}.yaml").exists():
        parent_cfg = load_jurisdiction_config(str(parent_id), repo_root=root)
        for p_lnk in getattr(parent_cfg, "amendment_links", None) or []:
            d_lnk = p_lnk.model_dump() if hasattr(p_lnk, "model_dump") else dict(p_lnk)
            app_in = d_lnk.get("applies_in") or []
            if app_in and config.id not in app_in:
                continue
            k_lnk = (str(d_lnk.get("amending_clause") or ""), str(d_lnk.get("target_clause") or ""))
            if k_lnk not in seen_cfg_link_keys:
                seen_cfg_link_keys.add(k_lnk)
                effective_cfg_links.append(d_lnk)

    declarative_doc_ids = {
        str(lnk.get("amending_clause") or "").split(":", 1)[0]
        for lnk in effective_cfg_links
    }

    for doc in config.documents:
        is_amend = doc.role == "amendment" or doc.doc_type in {"amendment", "notification"}
        if (
            not is_amend
            or not doc.amends
            or doc.id in declarative_doc_ids
            or getattr(doc, "superseded_by_document", None) in declarative_doc_ids
        ):
            continue
        if doc.text_rights is not None and doc.text_rights.mode == "reference_only":
            continue
        if getattr(doc, "acquisition_status", None) in {"pending", "not_found"}:
            continue
        if getattr(doc, "structured", None) is False:
            continue

        if doc.id not in loaded_trees:
            loaded_trees[doc.id] = _load_clause_tree(docs_dir, doc.id, parent_docs_dir)
        amend_tree = loaded_trees[doc.id]

        target_doc_ids = list(doc.amends)
        for target_doc_id in target_doc_ids:
            if target_doc_id not in loaded_trees:
                loaded_trees[target_doc_id] = _load_clause_tree(docs_dir, target_doc_id, parent_docs_dir)

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
                        if doc.legal_status == "in_force":
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

    # Also process declarative amendment_links from config.amendment_links and data/overrides/<jurisdiction>/*.yaml
    overrides_dir = root / "data" / "overrides" / config.id
    doc_by_id = {d.id: d for d in config.documents}
    declarative_links: list[dict[str, Any]] = list(effective_cfg_links)
    if overrides_dir.is_dir():
        override_files = sorted(overrides_dir.glob("*.yaml")) + sorted(overrides_dir.glob("*.yml"))
        for ov_path in override_files:
            raw_ov = yaml.safe_load(ov_path.read_text(encoding="utf-8"))
            if not raw_ov:
                continue
            validate_file(ov_path, "overrides")
            declarative_links.extend(raw_ov.get("amendment_links") or [])

    if declarative_links:
        for ov_link in declarative_links:
                amending_ref = str(ov_link.get("amending_clause") or ov_link.get("clause_id") or "")
                target_ref = str(ov_link["target_clause"])
                if ":" not in amending_ref or ":" not in target_ref:
                    raise click.ClickException(
                        "amendment_links must use '<doc_id>:<clause_or_eid>' format."
                    )
                amending_doc_id, amending_token = amending_ref.split(":", 1)
                target_doc_id, target_token = target_ref.split(":", 1)
                if amending_doc_id not in loaded_trees:
                    loaded_trees[amending_doc_id] = _load_clause_tree(docs_dir, amending_doc_id, parent_docs_dir)
                if target_doc_id not in loaded_trees:
                    loaded_trees[target_doc_id] = _load_clause_tree(docs_dir, target_doc_id, parent_docs_dir)

                amend_tree_ov = loaded_trees[amending_doc_id]
                target_tree_ov = loaded_trees[target_doc_id]

                amending_node_ov = next(
                    (
                        c
                        for c in amend_tree_ov.get("clauses", [])
                        if (
                            c.get("clause_id") == amending_ref
                            or c.get("eid") == amending_token
                            or c.get("native_number") == amending_token
                            or c.get("number") == amending_token
                        )
                        and c.get("superseded_by") is None
                        and c.get("record_superseded_by") is None
                    ),
                    None,
                )
                if amending_node_ov is None:
                    amending_node_ov = next(
                        (
                            c
                            for c in amend_tree_ov.get("clauses", [])
                            if (
                                str(c.get("eid") or "").endswith(f"__{amending_token}")
                                or (
                                    "__" in amending_token
                                    and (
                                        c.get("eid") == amending_token.split("__")[-1]
                                        or str(c.get("eid") or "").endswith(
                                            f"__{amending_token.split('__')[-1]}"
                                        )
                                    )
                                )
                            )
                            and c.get("superseded_by") is None
                            and c.get("record_superseded_by") is None
                        ),
                        None,
                    )
                if amending_node_ov is None:
                    raise click.ClickException(
                        f"Amending clause '{amending_ref}' not found in '{amending_doc_id}'."
                    )

                target_node_ov = next(
                    (
                        c
                        for c in target_tree_ov.get("clauses", [])
                        if (
                            c.get("clause_id") == target_ref
                            or c.get("eid") == target_token
                            or c.get("native_number") == target_token
                            or c.get("number") == target_token
                        )
                        and c.get("superseded_by") is None
                        and c.get("record_superseded_by") is None
                    ),
                    None,
                )

                raw_action = str(ov_link["action"])
                eff_action = "modify_text" if raw_action == "modify" else raw_action
                lbl_conf_ov = str(ov_link["confidence"])
                num_conf_ov = (
                    0.95
                    if lbl_conf_ov == "high"
                    else (0.65 if lbl_conf_ov == "medium" else 0.40)
                )
                amending_doc_cfg = doc_by_id.get(amending_doc_id)
                amending_status = (
                    str(amending_doc_cfg.legal_status)
                    if amending_doc_cfg is not None
                    else "in_force"
                )
                valid_from_ov = (
                    ov_link.get("effective_date")
                    or (amending_doc_cfg.effective_from if amending_doc_cfg else None)
                    or (amending_doc_cfg.notified_date if amending_doc_cfg else None)
                )
                amending_cid_ov = str(amending_node_ov["clause_id"])
                amending_eid_ov = str(amending_node_ov.get("eid") or amending_token)

                raw_applies_in = (
                    ov_link.get("applies_in")
                    or (getattr(amending_doc_cfg, "applies_in", None) if amending_doc_cfg else None)
                )
                applies_in_list: list[str] = (
                    [str(x) for x in raw_applies_in if x]
                    if isinstance(raw_applies_in, list)
                    else []
                )
                applies_here = (
                    not applies_in_list or config.id in applies_in_list
                )

                if target_node_ov is None:
                    matched_target_cid_ov = target_ref
                    matched_target_eid_ov = build_eid(None, "clause", target_token)
                    should_apply_ov = False
                    unapplied_reason_ov: str | None = (
                        f"Target provision '{target_token}' not found in '{target_doc_id}'."
                    )
                else:
                    matched_target_cid_ov = str(target_node_ov["clause_id"])
                    matched_target_eid_ov = str(target_node_ov.get("eid") or target_token)
                    should_apply_ov = (
                        num_conf_ov >= 0.8
                        and amending_status == "in_force"
                        and applies_here
                    )
                    if should_apply_ov:
                        unapplied_reason_ov = None
                        amended_by_ov: list[str] = list(target_node_ov.get("amended_by", []))
                        if amending_cid_ov not in amended_by_ov:
                            amended_by_ov.append(amending_cid_ov)
                            target_node_ov["amended_by"] = amended_by_ov
                            modified_doc_ids.add(target_doc_id)
                    elif not applies_here:
                        unapplied_reason_ov = (
                            f"Applies only in {', '.join(applies_in_list)}."
                        )
                    elif amending_status != "in_force":
                        unapplied_reason_ov = (
                            f"Amending instrument '{amending_doc_id}' has status '{amending_status}'."
                        )
                    else:
                        unapplied_reason_ov = (
                            str(ov_link.get("note"))
                            if ov_link.get("note")
                            else f"Effect confidence ({lbl_conf_ov}) is below high threshold."
                        )

                effect_seq += 1
                effect_id_ov = f"{amending_doc_id}:eff_{effect_seq}"
                replacement_txt = str(
                    ov_link.get("replacement_text")
                    or amending_node_ov.get("content")
                    or amending_node_ov.get("text")
                    or ""
                )
                site_note_ov = str(ov_link.get("note") or "").strip() or None
                new_nodes_ov: list[dict[str, Any]] = []
                if eff_action in {"substitute", "insert_after", "insert_before", "modify_text"}:
                    new_nodes_ov.append(
                        _parse_quoted_node_payload(
                            replacement_txt,
                            action=eff_action,
                            target_node=target_node_ov,
                        )
                    )

                effect_entry_ov: dict[str, Any] = {
                    "effect_id": effect_id_ov,
                    "amending_doc": amending_doc_id,
                    "amending_eid": amending_eid_ov,
                    "target_doc": target_doc_id,
                    "target_eid": matched_target_eid_ov,
                    "action": eff_action,
                    "new_nodes": new_nodes_ov,
                    "valid_from": valid_from_ov,
                    "confidence": num_conf_ov,
                    "applied": should_apply_ov,
                    "unapplied_reason": unapplied_reason_ov,
                    "verification": str(ov_link.get("verification") or ("machine_checked" if should_apply_ov else "unverified")),
                }
                if applies_in_list:
                    effect_entry_ov["applies_in"] = applies_in_list
                if should_apply_ov and target_node_ov is not None:
                    effect_entry_ov["site_note"] = site_note_ov
                    _apply_effect_to_target_tree(
                        target_tree_ov,
                        target_node_ov,
                        effect_entry_ov,
                        amending_node_ov,
                        jurisdiction_name=config.name,
                        amending_doc_title=(amending_doc_cfg.title if amending_doc_cfg else ""),
                        jurisdiction_id=config.id,
                        parent_id=str(parent_id) if parent_id else None,
                        repo_root=root,
                    )
                    effect_entry_ov.pop("site_note", None)
                    modified_doc_ids.add(target_doc_id)
                effects.append(effect_entry_ov)

                compat_action_ov = "modify" if eff_action == "modify_text" else eff_action
                link_entry_ov: dict[str, Any] = {
                    "amending_clause": amending_cid_ov,
                    "target_clause": matched_target_cid_ov,
                    "amending_doc_id": amending_doc_id,
                    "target_doc_id": target_doc_id,
                    "action": compat_action_ov,
                    "effective_date": valid_from_ov,
                    "confidence": lbl_conf_ov,
                    "verification": str(ov_link.get("verification") or ("machine_checked" if should_apply_ov else "unverified")),
                    "note": ov_link.get("replacement_text") or ov_link.get("note"),
                    "summary": ov_link.get("note"),
                }
                if applies_in_list:
                    link_entry_ov["applies_in"] = applies_in_list
                links.append(link_entry_ov)

    for doc_id in sorted(modified_doc_ids):
        tree_payload = loaded_trees[doc_id]
        tree_path = docs_dir / f"{doc_id}.clauses.json"
        validate_payload(tree_payload, "clause-tree", source=str(tree_path))
        tree_path.write_text(json.dumps(tree_payload, indent=2) + "\n", encoding="utf-8")
        ann_payload = build_document_annotations(tree_payload)
        ann_path = docs_dir / f"{doc_id}.annotations.json"
        validate_payload(ann_payload, "annotations", source=str(ann_path))
        ann_path.write_text(json.dumps(ann_payload, indent=2) + "\n", encoding="utf-8")

    amendments_payload: dict[str, Any] = {
        "schema_version": "1.4",
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
    if _cascade_children and not getattr(config, "parent", None) and config.visibility != "test":
        jurs_dir = root / "jurisdictions"
        if jurs_dir.is_dir():
            for child_yaml in sorted(jurs_dir.glob("*.yaml")):
                if child_yaml.stem in {config.id, "resolution", "_fixture-test", "xx-test-fixture"}:
                    continue
                try:
                    child_cfg = load_jurisdiction_config(child_yaml.stem, repo_root=root)
                except Exception:
                    continue
                if getattr(child_cfg, "parent", None) == config.id:
                    run_amendments(
                        child_cfg,
                        repo_root=root,
                        _cascade_children=False,
                    )
