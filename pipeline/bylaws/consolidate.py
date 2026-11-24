"""Stage 8.5b: Compute derived consolidated views per document and date (Schema v1.3, Layer 3, Rule R14)."""

from __future__ import annotations

import copy
import json
import re
from pathlib import Path
from typing import Any

import click

from bylaws import __version__ as PIPELINE_VERSION
from bylaws.config import JurisdictionConfig
from bylaws.root import get_deterministic_timestamp, resolve_repo_root
from bylaws.schema_validator import validate_payload

SUBSTITUTED_QUOTE_RE = re.compile(
    r"(?:substituted|inserted)\s*:\s*['\"\u2018\u201c](?P<quoted>.+)['\"\u2019\u201d]\s*\.?$",
    re.IGNORECASE | re.DOTALL,
)


def compute_consolidated_view_as_of(
    tree_payload: dict[str, Any],
    effects: list[dict[str, Any]] | None = None,
    *,
    as_of_date: str,
) -> dict[str, Any]:
    """Compute a derived consolidated view of `tree_payload` on `as_of_date` (`YYYY-MM-DD`) from node `versions`."""
    _ = effects  # effects are reflected in each node's `versions` list
    doc_id = str(tree_payload["doc_id"])
    consolidated_nodes: list[dict[str, Any]] = []
    applied_effects: list[str] = []

    for node in tree_payload.get("clauses", []):
        if node.get("superseded_by") is not None or node.get("record_superseded_by") is not None:
            continue
        versions: list[dict[str, Any]] = list(node.get("versions") or [])
        if not versions:
            consolidated_nodes.append(copy.deepcopy(node))
            continue

        selected_ver: dict[str, Any] | None = None
        for ver in versions:
            v_from = ver.get("valid_from")
            v_to = ver.get("valid_to")
            if (v_from is None or str(v_from) <= as_of_date) and (
                v_to is None or as_of_date < str(v_to)
            ):
                selected_ver = ver

        if selected_ver is None:
            # Node did not exist yet on `as_of_date` (e.g. inserted by a later amendment)
            continue

        eff_id = selected_ver.get("effect_id")
        if eff_id and str(eff_id) not in applied_effects:
            applied_effects.append(str(eff_id))

        node_copy = copy.deepcopy(node)
        node_copy["heading"] = selected_ver.get("heading")
        node_copy["title"] = selected_ver.get("heading") or node_copy.get("title")
        node_copy["intro"] = selected_ver.get("intro")
        node_copy["content"] = selected_ver.get("content")
        node_copy["wrap_up"] = selected_ver.get("wrap_up")
        if selected_ver.get("cells") is not None:
            node_copy["cells"] = list(selected_ver["cells"])
        node_copy["legal_status"] = selected_ver.get("legal_status", node_copy["legal_status"])
        node_copy["omitted"] = bool(selected_ver.get("omitted", False))
        node_copy["active_version_id"] = selected_ver.get("version_id", "v1")
        node_copy["active_effect_id"] = eff_id
        text_parts = [
            p
            for p in (node_copy["intro"], node_copy["content"], node_copy["wrap_up"])
            if p
        ]
        if text_parts:
            node_copy["text"] = " ".join(text_parts)
        consolidated_nodes.append(node_copy)

    return {
        "doc_id": doc_id,
        "as_of_date": as_of_date,
        "derived": True,
        "applied_effects": applied_effects,
        "nodes": consolidated_nodes,
    }


def _extract_substituted_text(
    amending_text: str,
    target_number: str,
    target_title: str | None,
) -> tuple[str | None, str]:
    match = SUBSTITUTED_QUOTE_RE.search(amending_text.strip())
    raw_replacement = match.group("quoted").strip() if match else amending_text.strip()

    prefix_re = re.compile(rf"^{re.escape(target_number)}\b\.?\s*(?P<rest>.+)$", re.DOTALL)
    pref_match = prefix_re.match(raw_replacement)
    if pref_match:
        rest = pref_match.group("rest").strip()
        if ":" in rest:
            head, tail = rest.split(":", 1)
            if len(head.split()) <= 10 and tail.strip():
                return head.strip(), tail.strip()
        return target_title, rest

    return target_title, raw_replacement


def run_consolidate(config: JurisdictionConfig, *, repo_root: Path | None = None) -> dict[str, Any]:
    """Build `consolidated.json` from base clause trees and high-confidence `amendments.json` links/effects."""
    root = repo_root or resolve_repo_root()
    processed_dir = root / "data" / "processed" / config.id
    docs_dir = processed_dir / "documents"
    amendments_path = processed_dir / "amendments.json"

    if not amendments_path.is_file():
        raise click.ClickException(
            f"Cannot consolidate '{config.id}': '{amendments_path}' not found."
        )

    amendments_data: dict[str, Any] = json.loads(amendments_path.read_text(encoding="utf-8"))
    links: list[dict[str, Any]] = amendments_data.get("links", [])

    clause_lookup: dict[str, dict[str, Any]] = {}
    doc_effective_dates: dict[str, str] = {}
    for doc in config.documents:
        doc_effective_dates[doc.id] = (
            doc.effective_from or doc.notified_date or get_deterministic_timestamp()[:10]
        )
        tree_path = docs_dir / f"{doc.id}.clauses.json"
        if tree_path.is_file():
            tree_data: dict[str, Any] = json.loads(tree_path.read_text(encoding="utf-8"))
            for clause in tree_data.get("clauses", []):
                if clause.get("superseded_by") is None and clause.get("record_superseded_by") is None:
                    clause_lookup[str(clause["clause_id"])] = clause

    links_by_target: dict[str, list[dict[str, Any]]] = {}
    for link in links:
        target_cid = str(link["target_clause"])
        links_by_target.setdefault(target_cid, []).append(link)

    records: list[dict[str, Any]] = []
    unconsolidated: list[dict[str, Any]] = []

    for target_cid, target_links in sorted(links_by_target.items()):
        target_doc_id = target_cid.split(":", 1)[0]
        target_clause = clause_lookup.get(target_cid)
        if target_clause is None:
            unconsolidated.append(
                {
                    "clause_id": target_cid,
                    "doc_id": target_doc_id,
                    "reason": f"Target clause '{target_cid}' not found in active clause tree.",
                }
            )
            continue

        non_high = [lnk for lnk in target_links if lnk.get("confidence") != "high"]
        if non_high:
            unconsolidated.append(
                {
                    "clause_id": target_cid,
                    "doc_id": target_doc_id,
                    "reason": (
                        f"{len(non_high)} of {len(target_links)} applicable amendment link(s) "
                        "have confidence below 'high'; showing original plus amendments side by side."
                    ),
                }
            )
            continue

        def _link_date(lnk: dict[str, Any]) -> str:
            if lnk.get("effective_date"):
                return str(lnk["effective_date"])
            amending_doc = str(lnk["amending_clause"]).split(":", 1)[0]
            return doc_effective_dates.get(amending_doc, "9999-12-31")

        ordered_links = sorted(target_links, key=_link_date)
        current_title: str | None = target_clause.get("title")
        current_text: str = str(target_clause.get("text", ""))
        current_tables: list[dict[str, Any]] = copy.deepcopy(target_clause.get("tables") or [])
        applied_ids: list[str] = []
        as_of_date = doc_effective_dates.get(target_doc_id, get_deterministic_timestamp()[:10])
        omitted = False

        for lnk in ordered_links:
            amending_cid = str(lnk["amending_clause"])
            amending_clause = clause_lookup.get(amending_cid)
            amending_text = (
                str(amending_clause.get("text", ""))
                if amending_clause is not None
                else str(lnk.get("note") or "")
            )
            action = str(lnk["action"])
            as_of_date = _link_date(lnk)
            applied_ids.append(amending_cid)

            if action == "substitute":
                current_title, current_text = _extract_substituted_text(
                    amending_text,
                    str(target_clause["number"]),
                    current_title,
                )
                if amending_clause and amending_clause.get("tables"):
                    current_tables = copy.deepcopy(amending_clause["tables"])
            elif action == "insert_after":
                current_text = f"{current_text} [Amended ({as_of_date}, {amending_cid}): {amending_text}]".strip()
                if amending_clause and amending_clause.get("tables"):
                    current_tables.extend(copy.deepcopy(amending_clause["tables"]))
            elif action == "insert_before":
                current_text = f"[Amended ({as_of_date}, {amending_cid}): {amending_text}] {current_text}".strip()
            elif action == "omit":
                omitted = True
                current_text = f"[Omitted by {amending_cid} with effect from {as_of_date}.]"
                current_tables = []
            elif action in {"modify", "modify_text", "renumber"}:
                current_text = f"{current_text} [Modified ({as_of_date}, {amending_cid}): {amending_text}]".strip()

        records.append(
            {
                "clause_id": target_cid,
                "doc_id": target_doc_id,
                "number": str(target_clause["number"]),
                "title": current_title,
                "text": current_text,
                "tables": current_tables,
                "as_of_date": as_of_date,
                "amendments_applied": applied_ids,
                "derived": True,
                "method": (
                    "Derived by this project via deterministic chronological application "
                    "of high-confidence amendment effects (Rule R14)."
                ),
                "confidence": "high",
                "omitted": omitted,
            }
        )

    consolidated_payload: dict[str, Any] = {
        "schema_version": "1.3",
        "jurisdiction": config.id,
        "generated": {
            "pipeline_version": PIPELINE_VERSION,
            "generated_at": get_deterministic_timestamp(),
        },
        "records": records,
        "unconsolidated": unconsolidated,
    }
    consolidated_path = processed_dir / "consolidated.json"
    validate_payload(consolidated_payload, "consolidated", source=str(consolidated_path))
    consolidated_path.write_text(
        json.dumps(consolidated_payload, indent=2) + "\n",
        encoding="utf-8",
    )
    return consolidated_payload
