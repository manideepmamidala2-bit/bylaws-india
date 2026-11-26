"""Stage 8.5b: Compute full derived consolidated documents per date and corporation, change marks, and Akoma Ntoso XML (Schema v1.4, Part 2)."""

from __future__ import annotations

import copy
import json
import re
import xml.etree.ElementTree as ET
from pathlib import Path
from typing import Any

import click

from bylaws import __version__ as PIPELINE_VERSION
from bylaws.config import JurisdictionConfig
from bylaws.publish import split_clause_tree_into_chapters
from bylaws.root import get_deterministic_timestamp, resolve_repo_root
from bylaws.schema_validator import validate_payload

SUBSTITUTED_QUOTE_RE = re.compile(
    r"(?:substituted|inserted)\s*:\s*['\"\u2018\u201c](?P<quoted>.+)['\"\u2019\u201d]\s*\.?$",
    re.IGNORECASE | re.DOTALL,
)


MONTH_NAMES_MARK = (
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
)


def _format_human_date_mark(iso_date: str | None) -> str:
    if not iso_date:
        return "2026"
    m = re.match(r"^(\d{4})-(\d{2})-(\d{2})$", iso_date.strip())
    if not m:
        return iso_date[:4] or iso_date
    year, month_idx, day = int(m.group(1)), int(m.group(2)) - 1, int(m.group(3))
    if 0 <= month_idx < 12:
        return f"{day} {MONTH_NAMES_MARK[month_idx]} {year}"
    return str(year)


def format_change_mark_label(
    amending_doc_id: str,
    valid_from: str | None,
    jurisdiction_name: str = "",
    amending_doc_title: str = "",
) -> str:
    """Build a quiet change mark label such as `'Changed for <Corporation>, 14 May 2026'`."""
    year = (valid_from or "")[:4] or "Amended"
    human_date = _format_human_date_mark(valid_from)
    title_lower = f"{amending_doc_title} {jurisdiction_name}".lower()
    for direction in ("South", "North", "Central", "East", "West"):
        if f"{direction.lower()} city corporation" in title_lower and "bbl-amend" in amending_doc_id:
            corp_label = (
                jurisdiction_name.strip()
                if "city corporation" in jurisdiction_name.lower()
                else f"{direction} City Corporation"
            )
            return f"Changed for {corp_label}, {human_date}"
    if "zr-amend" in amending_doc_id:
        return f"Changed {year}, Zoning Regulations Amendment"
    if amending_doc_title:
        short_title = amending_doc_title.split("—")[0].split("(")[0].strip()[:48]
        return f"Changed {year}, {short_title}"
    return f"Changed {year}, {amending_doc_id}"


def compute_consolidated_view_as_of(
    tree_payload: dict[str, Any],
    effects: list[dict[str, Any]] | None = None,
    *,
    as_of_date: str,
    jurisdiction_name: str = "",
    doc_titles: dict[str, str] | None = None,
) -> dict[str, Any]:
    """Compute a derived consolidated view of `tree_payload` on `as_of_date` (`YYYY-MM-DD`) from node `versions`."""
    effects_by_id = {
        str(e.get("effect_id")): e
        for e in (effects or [])
        if isinstance(e, dict) and e.get("effect_id")
    }
    titles_map = doc_titles or {}
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
        if selected_ver.get("notes_by_site"):
            node_copy["notes_by_site"] = list(selected_ver["notes_by_site"])
        text_parts = [
            p
            for p in (node_copy["intro"], node_copy["content"], node_copy["wrap_up"])
            if p
        ]
        if text_parts:
            node_copy["text"] = " ".join(text_parts)

        if eff_id:
            eff_obj = effects_by_id.get(str(eff_id), {})
            amending_doc = str(selected_ver.get("source_doc") or eff_obj.get("amending_doc") or "")
            amending_eid = str(selected_ver.get("source_eid") or eff_obj.get("amending_eid") or "")
            v_from_str = str(selected_ver.get("valid_from") or eff_obj.get("valid_from") or as_of_date)
            action_str = str(eff_obj.get("action") or ("omit" if node_copy["omitted"] else "substitute"))
            orig_ver = versions[0] if len(versions) > 1 else None
            node_copy["change_mark"] = {
                "label": format_change_mark_label(
                    amending_doc,
                    v_from_str,
                    jurisdiction_name=jurisdiction_name,
                    amending_doc_title=titles_map.get(amending_doc, ""),
                ),
                "amending_doc": amending_doc,
                "amending_eid": amending_eid or "cl_1",
                "amending_clause_id": f"{amending_doc}:{amending_eid}" if amending_eid else amending_doc,
                "effective_date": v_from_str,
                "action": action_str,
                "original_text": orig_ver.get("content") if orig_ver else None,
                "original_heading": orig_ver.get("heading") if orig_ver else None,
                "original_cells": orig_ver.get("cells") if orig_ver else None,
            }
        else:
            node_copy["change_mark"] = None

        consolidated_nodes.append(node_copy)

    return {
        "doc_id": doc_id,
        "as_of_date": as_of_date,
        "derived": True,
        "applied_effects": applied_effects,
        "nodes": consolidated_nodes,
    }


def build_akoma_ntoso_xml(
    *,
    doc_id: str,
    doc_title: str,
    jurisdiction_id: str,
    as_of_date: str,
    nodes: list[dict[str, Any]],
) -> str:
    """Export a consolidated document view as Akoma Ntoso 3.0 XML (`.akn.xml`)."""
    akn_ns = "http://docs.oasis-open.org/legaldocml/ns/akn/3.0"
    ET.register_namespace("", akn_ns)
    root = ET.Element(f"{{{akn_ns}}}akomaNtoso")
    act = ET.SubElement(root, f"{{{akn_ns}}}act", {"name": doc_id})

    meta = ET.SubElement(act, f"{{{akn_ns}}}meta")
    ident = ET.SubElement(meta, f"{{{akn_ns}}}identification", {"source": "#bylaws-india"})
    work = ET.SubElement(ident, f"{{{akn_ns}}}FRBRWork")
    ET.SubElement(work, f"{{{akn_ns}}}FRBRthis", {"value": f"/akn/in/{jurisdiction_id}/act/{doc_id}/!main"})
    expr = ET.SubElement(ident, f"{{{akn_ns}}}FRBRExpression")
    ET.SubElement(
        expr,
        f"{{{akn_ns}}}FRBRthis",
        {"value": f"/akn/in/{jurisdiction_id}/act/{doc_id}/eng@{as_of_date}/!main"},
    )

    preface = ET.SubElement(act, f"{{{akn_ns}}}preface")
    p_title = ET.SubElement(preface, f"{{{akn_ns}}}p")
    doc_title_el = ET.SubElement(p_title, f"{{{akn_ns}}}docTitle")
    doc_title_el.text = f"{doc_title} (Consolidated as of {as_of_date} — Derived by bylaws-india)"

    body = ET.SubElement(act, f"{{{akn_ns}}}body")
    for node in nodes:
        if node.get("type") == "table_row":
            continue
        eid = str(node.get("eid") or node.get("number") or "sec")
        sec = ET.SubElement(body, f"{{{akn_ns}}}section", {"eId": eid})
        num_el = ET.SubElement(sec, f"{{{akn_ns}}}num")
        num_el.text = str(node.get("native_number") or node.get("number") or "")
        if node.get("heading") or node.get("title"):
            hd_el = ET.SubElement(sec, f"{{{akn_ns}}}heading")
            hd_el.text = str(node.get("heading") or node.get("title") or "")
        content_el = ET.SubElement(sec, f"{{{akn_ns}}}content")
        p_el = ET.SubElement(content_el, f"{{{akn_ns}}}p")
        p_el.text = str(node.get("text") or node.get("content") or "")
        cm = node.get("change_mark")
        if isinstance(cm, dict) and cm.get("label"):
            note_el = ET.SubElement(
                content_el,
                f"{{{akn_ns}}}authorialNote",
                {
                    "marker": str(cm["label"]),
                    "placement": "inline",
                },
            )
            note_p = ET.SubElement(note_el, f"{{{akn_ns}}}p")
            note_p.text = (
                f"{cm['label']} via {cm.get('amending_clause_id')} "
                f"(effective {cm.get('effective_date')})"
            )

    ET.indent(root, space="  ")
    xml_body = ET.tostring(root, encoding="unicode")
    return '<?xml version="1.0" encoding="UTF-8"?>\n' + xml_body + "\n"


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
    """Build `consolidated.json`, full per-chapter consolidated snapshots per date, and Akoma Ntoso XML."""
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
    effects: list[dict[str, Any]] = amendments_data.get("effects", [])

    clause_lookup: dict[str, dict[str, Any]] = {}
    doc_effective_dates: dict[str, str] = {}
    doc_legal_status: dict[str, str] = {}
    doc_titles: dict[str, str] = {}
    base_trees: dict[str, dict[str, Any]] = {}

    for doc in config.documents:
        doc_effective_dates[doc.id] = (
            doc.effective_from or doc.notified_date or get_deterministic_timestamp()[:10]
        )
        doc_legal_status[doc.id] = str(doc.legal_status)
        doc_titles[doc.id] = str(doc.title)
        tree_path = docs_dir / f"{doc.id}.clauses.json"
        if tree_path.is_file():
            tree_data: dict[str, Any] = json.loads(tree_path.read_text(encoding="utf-8"))
            if doc.role == "base":
                base_trees[doc.id] = tree_data
            for clause in tree_data.get("clauses", []):
                if clause.get("superseded_by") is None and clause.get("record_superseded_by") is None:
                    clause_lookup[str(clause["clause_id"])] = clause

    links_by_target: dict[str, list[dict[str, Any]]] = {}
    for link in links:
        link_applies_in = link.get("applies_in")
        if isinstance(link_applies_in, list) and link_applies_in and config.id not in link_applies_in:
            continue
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

        draft_links = [
            lnk
            for lnk in target_links
            if doc_legal_status.get(
                str(lnk.get("amending_doc_id") or str(lnk["amending_clause"]).split(":", 1)[0])
            )
            == "draft"
        ]
        in_force_links = [lnk for lnk in target_links if lnk not in draft_links]
        if not in_force_links:
            unconsolidated.append(
                {
                    "clause_id": target_cid,
                    "doc_id": target_doc_id,
                    "reason": "Applicable amendment link(s) originate from a 'draft' instrument; draft instruments never produce effects on in-force text.",
                }
            )
            continue

        non_high = [lnk for lnk in in_force_links if lnk.get("confidence") != "high"]
        if non_high:
            unconsolidated.append(
                {
                    "clause_id": target_cid,
                    "doc_id": target_doc_id,
                    "reason": (
                        f"{len(non_high)} of {len(in_force_links)} applicable amendment link(s) "
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

        ordered_links = sorted(in_force_links, key=_link_date)
        current_title: str | None = target_clause.get("title")
        original_text: str = str(target_clause.get("text", ""))
        current_text: str = original_text
        current_tables: list[dict[str, Any]] = copy.deepcopy(target_clause.get("tables") or [])
        applied_ids: list[str] = []
        as_of_date = doc_effective_dates.get(target_doc_id, get_deterministic_timestamp()[:10])
        omitted = False

        site_notes: list[str] = list(target_clause.get("notes_by_site") or [])
        for lnk in ordered_links:
            amending_cid = str(lnk["amending_clause"])
            amending_clause = clause_lookup.get(amending_cid)
            amending_text = (
                str(lnk["note"])
                if lnk.get("note")
                else (
                    str(amending_clause.get("text", ""))
                    if amending_clause is not None
                    else ""
                )
            )
            if lnk.get("summary") and str(lnk["summary"]) not in site_notes:
                site_notes.append(str(lnk["summary"]))
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
                if config.visibility == "test":
                    current_text = f"{current_text} [Amended ({as_of_date}, {amending_cid}): {amending_text}]".strip()
                else:
                    _, current_text = _extract_substituted_text(
                        amending_text,
                        str(target_clause["number"]),
                        current_title,
                    )
                if amending_clause and amending_clause.get("tables"):
                    current_tables.extend(copy.deepcopy(amending_clause["tables"]))
            elif action == "insert_before":
                if config.visibility == "test":
                    current_text = f"[Amended ({as_of_date}, {amending_cid}): {amending_text}] {current_text}".strip()
                else:
                    _, current_text = _extract_substituted_text(
                        amending_text,
                        str(target_clause["number"]),
                        current_title,
                    )
            elif action == "omit":
                omitted = True
                current_text = f"[Omitted by {amending_cid} with effect from {as_of_date}.]"
                current_tables = []
            elif action in {"modify", "modify_text", "renumber"}:
                if config.visibility == "test":
                    current_text = f"{current_text} [Modified ({as_of_date}, {amending_cid}): {amending_text}]".strip()
                else:
                    current_title, current_text = _extract_substituted_text(
                        amending_text,
                        str(target_clause["number"]),
                        current_title,
                    )

        last_amending_cid = applied_ids[-1]
        last_amending_doc = last_amending_cid.split(":", 1)[0]
        change_note = format_change_mark_label(
            last_amending_doc,
            as_of_date,
            jurisdiction_name=config.name,
            amending_doc_title=doc_titles.get(last_amending_doc, ""),
        )

        records.append(
            {
                "clause_id": target_cid,
                "doc_id": target_doc_id,
                "eid": target_clause.get("eid"),
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
                "change_note": change_note,
                "original_text": original_text,
                "amending_clause_id": last_amending_cid,
                "notes_by_site": site_notes,
            }
        )

    # Full consolidated documents per base document, as of each amendment date and today (Part 2 §1)
    consolidated_docs_manifest: list[dict[str, Any]] = []
    if config.visibility != "test":
        ver_str = str(getattr(config, "release_version", None) or "4.0.0")
        parent_id = getattr(config, "parent", None)
        url_prefix = f"/data/{config.id}/{ver_str}"
        parent_prefix = f"/data/{parent_id}/{ver_str}" if parent_id else url_prefix
        cons_out_root = processed_dir / "consolidated"
        cons_out_root.mkdir(parents=True, exist_ok=True)

        for base_doc_id, base_tree in sorted(base_trees.items()):
            base_eff_date = doc_effective_dates.get(base_doc_id, "2004-06-05")
            doc_effects = [
                e
                for e in effects
                if e.get("target_doc") == base_doc_id and e.get("applied") is True
            ]
            has_corp_diff = any(bool(e.get("applies_in")) for e in doc_effects)
            effective_doc_prefix = (
                parent_prefix if (parent_id and not has_corp_diff) else url_prefix
            )
            write_files_locally = not (parent_id and not has_corp_diff)

            amend_dates = sorted(
                {
                    str(e["valid_from"])
                    for e in doc_effects
                    if e.get("valid_from")
                }
            )
            snapshot_dates = [base_eff_date, *[d for d in amend_dates if d != base_eff_date], "latest"]
            snapshots_meta: list[dict[str, Any]] = []

            for snap_key in snapshot_dates:
                eval_date = "2026-11-25" if snap_key == "latest" else snap_key
                snap_label = (
                    "As of Today (Latest Consolidated)"
                    if snap_key == "latest"
                    else (
                        f"Original Enactment ({snap_key})"
                        if snap_key == base_eff_date
                        else f"As Amended on {snap_key}"
                    )
                )
                view = compute_consolidated_view_as_of(
                    base_tree,
                    doc_effects,
                    as_of_date=eval_date,
                    jurisdiction_name=config.name,
                    doc_titles=doc_titles,
                )
                full_cons_tree: dict[str, Any] = {
                    "schema_version": "1.4",
                    "doc_id": base_doc_id,
                    "jurisdiction": config.id,
                    "legal_status": "in_force",
                    "as_of_date": eval_date,
                    "derived": True,
                    "generated": base_tree["generated"],
                    "clauses": view["nodes"],
                }
                snap_url_prefix = f"{effective_doc_prefix}/consolidated/{base_doc_id}/{snap_key}"
                outline_dict, chapter_map = split_clause_tree_into_chapters(
                    full_cons_tree, snap_url_prefix
                )
                outline_rel = f"consolidated/{base_doc_id}/{snap_key}/outline.json"
                if write_files_locally:
                    snap_disk_dir = cons_out_root / base_doc_id / snap_key
                    snap_disk_dir.mkdir(parents=True, exist_ok=True)
                    (processed_dir / outline_rel).write_text(
                        json.dumps(outline_dict, indent=2) + "\n", encoding="utf-8"
                    )
                chapter_urls: list[str] = []
                for ch_rel, ch_payload in sorted(chapter_map.items()):
                    if write_files_locally:
                        ch_disk = cons_out_root / base_doc_id / snap_key / ch_rel
                        ch_disk.parent.mkdir(parents=True, exist_ok=True)
                        ch_disk.write_text(
                            json.dumps(ch_payload, indent=2) + "\n", encoding="utf-8"
                        )
                    chapter_urls.append(f"{snap_url_prefix}/{ch_rel}")

                akn_url: str | None = None
                if snap_key == "latest":
                    akn_rel = f"consolidated/{base_doc_id}.akn.xml"
                    if write_files_locally:
                        akn_xml = build_akoma_ntoso_xml(
                            doc_id=base_doc_id,
                            doc_title=doc_titles.get(base_doc_id, base_doc_id),
                            jurisdiction_id=config.id,
                            as_of_date=eval_date,
                            nodes=view["nodes"],
                        )
                        (processed_dir / akn_rel).write_text(akn_xml, encoding="utf-8")
                    akn_url = f"{effective_doc_prefix}/{akn_rel}"

                non_row_nodes = [
                    n for n in view["nodes"] if n.get("type") != "table_row"
                ]
                changed_cnt = sum(
                    1 for n in non_row_nodes if n.get("change_mark") is not None
                )
                snapshots_meta.append(
                    {
                        "as_of_date": snap_key,
                        "label": snap_label,
                        "outline_file": f"{effective_doc_prefix}/{outline_rel}",
                        "chapters": chapter_urls,
                        "akn_xml_file": akn_url,
                        "total_clauses": len(non_row_nodes),
                        "changed_clauses": changed_cnt,
                    }
                )

            consolidated_docs_manifest.append(
                {
                    "doc_id": base_doc_id,
                    "title": doc_titles.get(base_doc_id, base_doc_id),
                    "snapshots": snapshots_meta,
                }
            )

    consolidated_payload: dict[str, Any] = {
        "schema_version": "1.4",
        "jurisdiction": config.id,
        "generated": {
            "pipeline_version": PIPELINE_VERSION,
            "generated_at": get_deterministic_timestamp(),
        },
        "records": records,
        "unconsolidated": unconsolidated,
    }
    if consolidated_docs_manifest:
        consolidated_payload["documents"] = consolidated_docs_manifest

    consolidated_path = processed_dir / "consolidated.json"
    validate_payload(consolidated_payload, "consolidated", source=str(consolidated_path))
    consolidated_path.write_text(
        json.dumps(consolidated_payload, indent=2) + "\n",
        encoding="utf-8",
    )
    return consolidated_payload
