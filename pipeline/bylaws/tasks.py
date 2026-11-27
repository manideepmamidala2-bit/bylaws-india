"""Workshop verification task-set generator (`bylaws tasks create`)."""

from __future__ import annotations

import csv
import html
import io
import json
import random
import re
from pathlib import Path
from typing import Any

import click

from bylaws.config import JurisdictionConfig
from bylaws.root import get_deterministic_timestamp, resolve_repo_root

SUBJECT_PARAMETER_MAP: dict[str, tuple[str, ...]] = {
    "ground-coverage": ("ground_coverage_max_pct",),
    "ground_coverage": ("ground_coverage_max_pct",),
    "far": (
        "far_base_max",
        "far_premium_additional_max",
        "tdr_receivable_max",
    ),
    "setbacks": (
        "setback_front_min_m",
        "setback_rear_min_m",
        "setback_side_min_m",
    ),
    "height": ("building_height_max_m", "floors_max"),
    "building_height": ("building_height_max_m", "floors_max"),
    "parking": ("parking_requirement",),
}

PARAMETER_PLAIN_LABELS: dict[str, str] = {
    "ground_coverage_max_pct": "Maximum ground coverage",
    "far_base_max": "Base FAR",
    "far_premium_additional_max": "Premium FAR (additional)",
    "tdr_receivable_max": "Transferable development rights (TDR)",
    "setback_front_min_m": "Front setback",
    "setback_rear_min_m": "Rear setback",
    "setback_side_min_m": "Side setback",
    "building_height_max_m": "Maximum building height",
    "floors_max": "Maximum floors",
    "parking_requirement": "Parking requirement",
}

SUBJECT_TOPIC_ID_MAP: dict[str, str] = {
    "land-use": "land_use",
    "land_use": "land_use",
    "ground-coverage": "ground_coverage",
    "ground_coverage": "ground_coverage",
    "far": "far",
    "setbacks": "setbacks",
    "height": "building_height",
    "building_height": "building_height",
    "parking": "parking",
    "basements-and-stilts": "basements_stilts",
    "basements_stilts": "basements_stilts",
    "projections-and-open-spaces": "projections_open_spaces",
    "projections_open_spaces": "projections_open_spaces",
    "approvals-and-certificates": "approvals_certificates",
    "approvals_certificates": "approvals_certificates",
    "fire-safety": "fire_safety",
    "fire_safety": "fire_safety",
    "definitions": "definitions",
}


def _slugify(value: str) -> str:
    cleaned = re.sub(r"[^a-z0-9]+", "-", value.strip().lower()).strip("-")
    return cleaned or "tasks"


def _resolve_data_dir(config: JurisdictionConfig, root: Path) -> Path:
    ver = str(config.release_version or "4.0.0")
    pub_dir = root / "public" / "data" / config.id / ver
    if (pub_dir / "documents.json").is_file():
        return pub_dir
    proc_dir = root / "data" / "processed" / config.id
    if proc_dir.is_dir():
        return proc_dir
    raise click.ClickException(
        f"No published or processed dataset found for '{config.id}'."
    )


def _load_clauses_and_annotations(
    config: JurisdictionConfig,
    data_dir: Path,
    root: Path,
) -> tuple[dict[str, list[dict[str, Any]]], dict[str, list[dict[str, Any]]]]:
    clauses_by_doc: dict[str, list[dict[str, Any]]] = {}
    anns_by_doc: dict[str, list[dict[str, Any]]] = {}
    ver = str(config.release_version or "4.0.0")

    candidate_dirs = [
        data_dir,
        data_dir / "documents",
    ]
    if config.parent:
        candidate_dirs.append(root / "public" / "data" / config.parent / ver)
        candidate_dirs.append(root / "data" / "processed" / config.parent / "documents")

    for c_dir in candidate_dirs:
        if not c_dir.is_dir():
            continue
        for c_file in sorted(c_dir.glob("*.clauses.json")):
            tree = json.loads(c_file.read_text(encoding="utf-8"))
            doc_id = str(tree.get("doc_id") or "")
            if doc_id and doc_id not in clauses_by_doc:
                clauses_by_doc[doc_id] = list(tree.get("clauses") or [])
        for a_file in sorted(c_dir.glob("*.annotations.json")):
            ann_doc = json.loads(a_file.read_text(encoding="utf-8"))
            doc_id = str(ann_doc.get("doc_id") or "")
            if doc_id and doc_id not in anns_by_doc:
                anns_by_doc[doc_id] = list(ann_doc.get("annotations") or [])

    return clauses_by_doc, anns_by_doc


def _render_printable_html(payload: dict[str, Any]) -> str:
    tasks = payload.get("tasks") or []
    rows_html: list[str] = []
    for t in tasks:
        archive_part = (
            f' · <a href="{html.escape(str(t["archive_page_url"]))}">Archive p. {int(t["page"])}</a>'
            if t.get("archive_page_url")
            else ""
        )
        rows_html.append(
            f"""      <tr>
        <td><code>{html.escape(str(t["task_id"]))}</code></td>
        <td>{html.escape(str(t["record_kind"]))}<br/><small><code>{html.escape(str(t["record_id"]))}</code></small></td>
        <td><strong>{html.escape(str(t["document_title"]))}</strong><br/>{html.escape(str(t["number_or_label"]))}</td>
        <td>{html.escape(str(t["text_or_value"]))}</td>
        <td><a href="{html.escape(str(t["official_page_url"]))}">Official PDF p. {int(t["page"])}</a>{archive_part}</td>
        <td>[ ] Match<br/>[ ] Mismatch<br/>[ ] Can't tell</td>
        <td></td>
      </tr>"""
        )

    body_rows = "\n".join(rows_html)
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Bylaw One Workshop Verification Sheet — {html.escape(str(payload["task_set_id"]))}</title>
  <style>
    body {{ font-family: system-ui, -apple-system, sans-serif; color: #080909; margin: 24px; line-height: 1.45; }}
    h1 {{ font-size: 20px; margin-bottom: 4px; }}
    .meta {{ font-family: monospace; font-size: 12px; color: #5b5e56; margin-bottom: 16px; }}
    table {{ width: 100%; border-collapse: collapse; font-size: 12px; }}
    th, td {{ border: 1px solid #080909; padding: 8px; vertical-align: top; text-align: left; }}
    th {{ background: #efeee8; font-family: monospace; text-transform: uppercase; font-size: 11px; }}
  </style>
</head>
<body>
  <h1>Bylaw One — Workshop Verification Task Sheet</h1>
  <div class="meta">
    Task Set: {html.escape(str(payload["task_set_id"]))} · Jurisdiction: {html.escape(str(payload["jurisdiction_name"]))} · Subject: {html.escape(str(payload["subject"]))} · Seed: {int(payload["seed"])} · Tasks: {len(tasks)}
  </div>
  <p><strong>Verifier Name:</strong> ___________________________ &nbsp;&nbsp; <strong>Institution:</strong> ___________________________ &nbsp;&nbsp; <strong>Date:</strong> _____________</p>
  <table>
    <thead>
      <tr>
        <th>Task</th>
        <th>Record</th>
        <th>Instrument &amp; Provision / Rule</th>
        <th>Text or Value on Site</th>
        <th>Official Gazette / PDF Page</th>
        <th>Verdict</th>
        <th>Notes</th>
      </tr>
    </thead>
    <tbody>
{body_rows}
    </tbody>
  </table>
</body>
</html>
"""


def _render_tasks_csv(tasks: list[dict[str, Any]]) -> str:
    buf = io.StringIO()
    fieldnames = [
        "task_id",
        "record_id",
        "record_kind",
        "subject",
        "document_title",
        "number_or_label",
        "text_or_value",
        "page",
        "official_page_url",
        "archive_page_url",
        "verdict",
        "note",
        "verifier_name",
        "institution",
        "verified_at",
    ]
    writer = csv.DictWriter(buf, fieldnames=fieldnames, lineterminator="\n")
    writer.writeheader()
    for t in tasks:
        writer.writerow(
            {
                "task_id": t["task_id"],
                "record_id": t["record_id"],
                "record_kind": t["record_kind"],
                "subject": t["subject"],
                "document_title": t["document_title"],
                "number_or_label": t["number_or_label"],
                "text_or_value": t["text_or_value"],
                "page": t["page"],
                "official_page_url": t["official_page_url"],
                "archive_page_url": t.get("archive_page_url") or "",
                "verdict": "",
                "note": "",
                "verifier_name": "",
                "institution": "",
                "verified_at": "",
            }
        )
    return buf.getvalue()


def create_verification_task_set(
    config: JurisdictionConfig,
    *,
    count: int,
    subject: str,
    seed: int,
    task_set_id: str | None = None,
    output_dir: Path | None = None,
    repo_root: Path | None = None,
) -> dict[str, Any]:
    """Create a deterministic workshop verification task set (.json, .html, .csv)."""
    if count <= 0:
        raise click.ClickException("--count must be a positive integer.")

    root = repo_root or resolve_repo_root()
    data_dir = _resolve_data_dir(config, root)
    ver = str(config.release_version or "4.0.0")

    docs_path = data_dir / "documents.json"
    documents: list[dict[str, Any]] = []
    if docs_path.is_file():
        documents = json.loads(docs_path.read_text(encoding="utf-8"))
    else:
        for d in config.documents:
            documents.append(
                {
                    "doc_id": d.id,
                    "title": d.title,
                    "plain_title": getattr(d, "plain_title", None) or d.title,
                    "official_url": getattr(d, "official_url", None) or d.source_url,
                    "source_url": d.source_url,
                    "legal_status": d.legal_status,
                }
            )
    doc_by_id = {str(d["doc_id"]): d for d in documents if d.get("doc_id")}

    clauses_by_doc, anns_by_doc = _load_clauses_and_annotations(config, data_dir, root)

    params_path = data_dir / "parameters.json"
    if not params_path.is_file() and config.parent:
        parent_params = root / "public" / "data" / config.parent / ver / "parameters.json"
        if parent_params.is_file():
            params_path = parent_params
    params_payload = (
        json.loads(params_path.read_text(encoding="utf-8"))
        if params_path.is_file()
        else {"records": []}
    )

    norm_subject = subject.strip().lower()
    param_kinds = set(SUBJECT_PARAMETER_MAP.get(norm_subject, ()))
    topic_id = SUBJECT_TOPIC_ID_MAP.get(norm_subject, norm_subject.replace("-", "_"))

    candidates: list[dict[str, Any]] = []

    # 1. Collect matching parameter records
    for rec in params_payload.get("records") or []:
        if rec.get("legal_status") != "in_force" or rec.get("valid_to"):
            continue
        if param_kinds and rec.get("parameter") not in param_kinds:
            continue
        if not param_kinds and norm_subject not in {"all", "*"}:
            continue
        src = rec.get("source") or {}
        doc_id = str(src.get("doc_id") or "")
        doc = doc_by_id.get(doc_id, {})
        doc_title = str(doc.get("plain_title") or doc.get("title") or doc_id)
        page = int(src.get("page") or 1)
        pdf_url = str(src.get("official_url") or doc.get("official_url") or doc.get("source_url") or "")
        page_link = str(src.get("page_link") or (f"{pdf_url}#page={page}" if pdf_url else f"#page={page}"))
        arch_base = str(src.get("archive_url") or (doc.get("retrieval") or {}).get("archive_url") or "")
        arch_link = f"{arch_base}#page={page}" if arch_base and "#page=" not in arch_base else (arch_base or None)
        row_hdr = str(src.get("row_header") or "").strip()
        col_hdr = str(src.get("column_header") or "").strip()
        param_plain = PARAMETER_PLAIN_LABELS.get(
            str(rec.get("parameter") or ""), str(rec.get("parameter") or "Rule")
        )
        label = f"{param_plain} · {row_hdr}" if row_hdr else param_plain
        if col_hdr:
            label = f"{label} ({col_hdr})"
        raw_unit = str(rec.get("unit") or "").replace("sq_m", "m²").replace("pct_of_plot_depth", "% of plot depth").replace("pct_of_plot_width", "% of plot width").replace("m2_per_car_space", "m² per car space")
        val_str = f"{rec.get('value_text')} (value: {rec.get('value')} {raw_unit})".strip()
        candidates.append(
            {
                "record_id": str(rec["parameter_id"]),
                "record_kind": "parameter",
                "subject": norm_subject,
                "document_id": doc_id,
                "document_title": doc_title,
                "number_or_label": label,
                "text_or_value": val_str,
                "page": page,
                "official_page_url": page_link,
                "archive_page_url": arch_link,
            }
        )

    # 2. Collect matching provision records
    topic_eids_by_doc: dict[str, set[str]] = {}
    for doc_id, anns in anns_by_doc.items():
        for ann in anns:
            if ann.get("kind") == "topic" and (
                ann.get("value") == topic_id or norm_subject in {"all", "*"}
            ):
                target_eid = str((ann.get("target") or {}).get("eid") or "")
                if target_eid:
                    topic_eids_by_doc.setdefault(doc_id, set()).add(target_eid)

    for doc_id, clauses in sorted(clauses_by_doc.items()):
        doc = doc_by_id.get(doc_id, {})
        if doc.get("legal_status") and doc.get("legal_status") != "in_force":
            continue
        matched_eids = topic_eids_by_doc.get(doc_id, set())
        for c in clauses:
            if c.get("type") == "table_row" or c.get("omitted"):
                continue
            if c.get("superseded_by") or c.get("record_superseded_by"):
                continue
            eid = str(c.get("eid") or "")
            if matched_eids and eid not in matched_eids and len(candidates) >= count:
                continue
            text = str(c.get("text") or "").strip()
            if len(text) < 20:
                continue
            cits = c.get("citations") or []
            page = int(cits[0].get("page") or 1) if cits else 1
            pdf_url = str(doc.get("official_url") or doc.get("source_url") or "")
            arch_base = str((doc.get("retrieval") or {}).get("archive_url") or "")
            doc_title = str(doc.get("plain_title") or doc.get("title") or doc_id)
            num_str = str(c.get("number") or eid)
            heading = str(c.get("heading") or c.get("title") or "").strip()
            label = f"{num_str} · {heading}" if heading and heading != num_str else num_str
            candidates.append(
                {
                    "record_id": str(c.get("clause_id") or f"{doc_id}:{eid}"),
                    "record_kind": "provision",
                    "subject": norm_subject,
                    "document_id": doc_id,
                    "document_title": doc_title,
                    "number_or_label": label,
                    "text_or_value": text[:600],
                    "page": page,
                    "official_page_url": f"{pdf_url}#page={page}" if pdf_url else f"#page={page}",
                    "archive_page_url": f"{arch_base}#page={page}" if arch_base else None,
                }
            )

    if not candidates:
        raise click.ClickException(
            f"No candidate records found for jurisdiction '{config.id}' and subject '{subject}'."
        )

    candidates.sort(key=lambda item: (item["record_kind"], item["record_id"]))
    rng = random.Random(seed)
    sample_size = min(count, len(candidates))
    selected = rng.sample(candidates, sample_size)

    tasks_list: list[dict[str, Any]] = []
    for idx, item in enumerate(selected, start=1):
        tasks_list.append(
            {
                "task_id": f"task-{idx:03d}",
                **item,
            }
        )

    resolved_set_id = task_set_id or _slugify(f"{config.id}-{norm_subject}-s{seed}-n{sample_size}")
    payload: dict[str, Any] = {
        "schema_version": "1.4",
        "task_set_id": resolved_set_id,
        "jurisdiction": config.id,
        "jurisdiction_name": config.name,
        "subject": norm_subject,
        "seed": seed,
        "count": len(tasks_list),
        "created_at": get_deterministic_timestamp(),
        "tasks": tasks_list,
    }

    public_tasks_dir = root / "public" / "data" / "tasks"
    public_tasks_dir.mkdir(parents=True, exist_ok=True)
    target_out_dir = output_dir or public_tasks_dir
    target_out_dir.mkdir(parents=True, exist_ok=True)

    json_text = json.dumps(payload, indent=2) + "\n"
    html_text = _render_printable_html(payload)
    csv_text = _render_tasks_csv(tasks_list)

    (public_tasks_dir / f"{resolved_set_id}.json").write_text(json_text, encoding="utf-8")
    (target_out_dir / f"{resolved_set_id}.json").write_text(json_text, encoding="utf-8")
    (target_out_dir / f"{resolved_set_id}.html").write_text(html_text, encoding="utf-8")
    (target_out_dir / f"{resolved_set_id}.csv").write_text(csv_text, encoding="utf-8")

    return {
        "task_set_id": resolved_set_id,
        "json_path": str(target_out_dir / f"{resolved_set_id}.json"),
        "html_path": str(target_out_dir / f"{resolved_set_id}.html"),
        "csv_path": str(target_out_dir / f"{resolved_set_id}.csv"),
        "count": len(tasks_list),
        "payload": payload,
    }
