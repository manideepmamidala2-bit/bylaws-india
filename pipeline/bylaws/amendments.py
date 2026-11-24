"""Stage 8.5: Detect amendment instructions, link amending clauses to targets, and consolidate."""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any

import click

from bylaws.config import JurisdictionConfig
from bylaws.consolidate import run_consolidate
from bylaws.root import resolve_repo_root
from bylaws.schema_validator import validate_payload

CLAUSE_NUM_PATTERN = r"([A-Za-z]?\d+(?:\.\d+)*)"

AMENDMENT_PATTERNS: tuple[tuple[str, str, re.Pattern[str]], ...] = (
    (
        "substitute",
        "high",
        re.compile(
            rf"\bfor\s+(?:clause|bye-?law|regulation|section)\s+{CLAUSE_NUM_PATTERN}\b[^.]*?\bsubstituted\b"
            rf"|\bsubstitute(?:d)?\s+for\s+(?:clause|bye-?law|regulation|section)\s+{CLAUSE_NUM_PATTERN}\b",
            re.IGNORECASE,
        ),
    ),
    (
        "insert_after",
        "high",
        re.compile(
            rf"\bafter\s+(?:clause|bye-?law|regulation|section|chapter)\s+{CLAUSE_NUM_PATTERN}\b[^.]*?\binsert(?:ed)?\b"
            rf"|\binsert(?:ed)?\s+after\s+(?:clause|bye-?law|regulation|section|chapter)\s+{CLAUSE_NUM_PATTERN}\b",
            re.IGNORECASE,
        ),
    ),
    (
        "insert_before",
        "high",
        re.compile(
            rf"\bbefore\s+(?:clause|bye-?law|regulation|section|chapter)\s+{CLAUSE_NUM_PATTERN}\b[^.]*?\binsert(?:ed)?\b"
            rf"|\binsert(?:ed)?\s+before\s+(?:clause|bye-?law|regulation|section|chapter)\s+{CLAUSE_NUM_PATTERN}\b",
            re.IGNORECASE,
        ),
    ),
    (
        "omit",
        "high",
        re.compile(
            rf"\b(?:clause|bye-?law|regulation|section)\s+{CLAUSE_NUM_PATTERN}\s+shall\s+be\s+(?:omitted|deleted)\b"
            rf"|\b(?:omit|delete)(?:ted|d)?\s+(?:clause|bye-?law|regulation|section)\s+{CLAUSE_NUM_PATTERN}\b",
            re.IGNORECASE,
        ),
    ),
    (
        "modify",
        "medium",
        re.compile(
            rf"\b(?:amendment\s+of|in)\s+(?:clause|bye-?law|regulation|section)\s+{CLAUSE_NUM_PATTERN}\b",
            re.IGNORECASE,
        ),
    ),
)


def detect_amendment_instruction(text: str, title: str | None = None) -> tuple[str, str, str] | None:
    """Detect `(target_clause_number, action, confidence)` from clause text/title."""
    combined = f"{title or ''}. {text}".strip()
    for action, confidence, pattern in AMENDMENT_PATTERNS:
        match = pattern.search(combined)
        if match:
            for group_val in match.groups():
                if group_val:
                    return group_val, action, confidence
    return None


def _load_clause_tree(docs_dir: Path, doc_id: str) -> dict[str, Any]:
    path = docs_dir / f"{doc_id}.clauses.json"
    if not path.is_file():
        raise click.ClickException(
            f"Clause tree file not found for document '{doc_id}': {path}. "
            "Run `bylaws structure` first."
        )
    data: dict[str, Any] = json.loads(path.read_text(encoding="utf-8"))
    return data


def run_amendments(config: JurisdictionConfig, *, repo_root: Path | None = None) -> None:
    """Detect and link amendment clauses for a jurisdiction and write `amendments.json` + `consolidated.json`."""
    root = repo_root or resolve_repo_root()
    processed_dir = root / "data" / "processed" / config.id
    docs_dir = processed_dir / "documents"
    processed_dir.mkdir(parents=True, exist_ok=True)

    loaded_trees: dict[str, dict[str, Any]] = {}
    modified_doc_ids: set[str] = set()
    links: list[dict[str, Any]] = []

    for doc in config.documents:
        is_amend = doc.role == "amendment" or doc.doc_type in {"amendment", "notification"}
        if not is_amend or not doc.amends:
            continue
        if doc.text_rights is not None and doc.text_rights.mode == "reference_only":
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

            target_number, action, confidence = detection
            amending_clause_id = str(clause["clause_id"])

            matched_target_clause_id: str | None = None
            matched_target_doc_id: str = target_doc_ids[0]
            for target_doc_id in target_doc_ids:
                candidate_id = f"{target_doc_id}:{target_number}"
                target_tree = loaded_trees[target_doc_id]
                for target_clause in target_tree.get("clauses", []):
                    if (
                        target_clause.get("clause_id") == candidate_id
                        and target_clause.get("superseded_by") is None
                        and target_clause.get("record_superseded_by") is None
                    ):
                        matched_target_clause_id = candidate_id
                        matched_target_doc_id = target_doc_id
                        amended_by: list[str] = list(target_clause.get("amended_by", []))
                        if amending_clause_id not in amended_by:
                            amended_by.append(amending_clause_id)
                            target_clause["amended_by"] = amended_by
                            modified_doc_ids.add(target_doc_id)
                        break
                if matched_target_clause_id is not None:
                    break

            if matched_target_clause_id is None:
                matched_target_clause_id = f"{target_doc_ids[0]}:{target_number}"
                confidence = "low"

            links.append(
                {
                    "amending_clause": amending_clause_id,
                    "target_clause": matched_target_clause_id,
                    "amending_doc_id": doc.id,
                    "target_doc_id": matched_target_doc_id,
                    "action": action,
                    "effective_date": doc.effective_from or doc.notified_date,
                    "confidence": confidence,
                    "verification": "unverified",
                }
            )

    for doc_id in sorted(modified_doc_ids):
        tree_payload = loaded_trees[doc_id]
        tree_path = docs_dir / f"{doc_id}.clauses.json"
        validate_payload(tree_payload, "clause-tree", source=str(tree_path))
        tree_path.write_text(json.dumps(tree_payload, indent=2) + "\n", encoding="utf-8")

    amendments_payload: dict[str, Any] = {
        "schema_version": "1.2",
        "jurisdiction": config.id,
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
        f"[amendments] Linked {len(links)} amendment instruction(s) and consolidated "
        f"{len(consolidated_payload['records'])} clause(s) for '{config.id}'."
    )
