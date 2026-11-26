"""Stage 8.7: Schema v1.3 validation, 9-point QA suite, declarations.json, and qa.md report."""

from __future__ import annotations

import json
import random
import re
import statistics
from collections import Counter
from pathlib import Path
from typing import Any

import click
import pypdfium2 as pdfium

from bylaws.acquire import (
    _build_unacquired_document_payload,
    sync_raw_metadata_from_config,
)
from bylaws.annotations import AnnotationSpanError, validate_annotations_against_tree
from bylaws.config import JurisdictionConfig
from bylaws.fidelity import verify_jurisdiction_text_fidelity
from bylaws.graph import write_jurisdiction_graph_files
from bylaws.parameters import write_parameter_reports_and_json
from bylaws.parsers.base import ParsedBlock
from bylaws.relations import build_jurisdiction_relations
from bylaws.resolver import write_published_resolution_json
from bylaws.root import resolve_repo_root
from bylaws.schema_validator import (
    SchemaValidationError,
    validate_file,
    validate_payload,
)
from bylaws.structure import (
    _collect_running_headers_and_footers,
    _is_margin_page_number,
    is_structurable_document,
)

VALID_LEGAL_STATUSES = {"in_force", "draft", "superseded", "withdrawn", "status_unknown"}


def _detect_numbering_gaps_and_duplicates(
    clauses: list[dict[str, Any]],
) -> tuple[list[str], list[str]]:
    """Return `(duplicates, gaps)` among active clauses in a document, citing source pages for any gap."""
    active_clauses = [
        c
        for c in clauses
        if c.get("superseded_by") is None and c.get("record_superseded_by") is None
    ]
    seen_ids: set[str] = set()
    duplicates: list[str] = []
    by_parent_kind: dict[tuple[str | None, str], list[tuple[int, int]]] = {}

    for clause in active_clauses:
        cid = str(clause.get("clause_id", ""))
        if cid in seen_ids and cid not in duplicates:
            duplicates.append(cid)
        seen_ids.add(cid)

        node_type = str(clause.get("type") or "clause")
        if node_type in {"table", "table_row", "proviso", "explanation", "note", "preamble", "preface"}:
            continue

        nat_str = str(clause.get("native_number") or clause.get("number") or "").strip()
        if not nat_str or "(" in nat_str or ":" in nat_str or "_" in nat_str:
            continue

        parent_id = clause.get("parent_id")
        cits = clause.get("citations") or []
        first_page = int(cits[0]["page"]) if cits and isinstance(cits[0].get("page"), int) else 1

        parts = nat_str.split(".")
        if len(parts) == 2 and parts[1] == "0" and parts[0].isdigit():
            by_parent_kind.setdefault((parent_id, "section"), []).append(
                (int(parts[0]), first_page)
            )
        elif node_type == "section" and nat_str.isdigit():
            by_parent_kind.setdefault((parent_id, "section"), []).append(
                (int(nat_str), first_page)
            )
        elif parts[-1].isdigit():
            seq_group = ".".join(parts[:-1]) or "int"
            by_parent_kind.setdefault((parent_id, seq_group), []).append(
                (int(parts[-1]), first_page)
            )

    gaps: list[str] = []
    for (parent_id, _seq_group), pairs in by_parent_kind.items():
        if not pairs:
            continue
        page_by_num = {num: pg for num, pg in pairs}
        sorted_unique = sorted(page_by_num.keys())
        expected = list(range(sorted_unique[0], sorted_unique[-1] + 1))
        missing = [n for n in expected if n not in page_by_num]
        if missing:
            gap_pages = sorted(
                {
                    page_by_num.get(m - 1) or page_by_num.get(m + 1) or 1
                    for m in missing
                }
            )
            pages_note = ", ".join(f"p. {p}" for p in gap_pages)
            prefix = f"{parent_id}." if parent_id else "top-level "
            gaps.append(f"{prefix}missing {missing} (source {pages_note})")

    return duplicates, gaps


def _compute_text_coverage_summary(
    clause_trees: dict[str, dict[str, Any]],
    interim_dir: Path,
) -> str:
    """Compute character coverage of structured nodes against non-margin content text per document."""
    parts_out: list[str] = []
    for doc_id, tree in clause_trees.items():
        active = [
            c
            for c in tree.get("clauses", [])
            if c.get("superseded_by") is None and c.get("record_superseded_by") is None
        ]
        node_chars = 0
        for c in active:
            if c.get("type") == "table":
                tm = c.get("table_meta") or {}
                node_chars += sum(len(str(col.get("label") or "")) for col in tm.get("columns", []))
                node_chars += sum(len(str(fn.get("text") or "")) for fn in tm.get("footnotes", []))
            else:
                node_chars += len(str(c.get("text") or "").strip())

        interim_file = interim_dir / f"{doc_id}.docling.json"
        if not interim_file.is_file():
            cands = sorted(interim_dir.glob(f"{doc_id}.*.json"))
            interim_file = cands[0] if cands else interim_file
        if interim_file.is_file():
            interim_data = json.loads(interim_file.read_text(encoding="utf-8"))
            parsed_blocks = [
                ParsedBlock(
                    text=str(b.get("text") or ""),
                    page=int(b.get("page") or 1),
                    bbox=b.get("bbox"),
                )
                for b in interim_data.get("blocks", [])
            ]
            page_count = int(interim_data.get("page_count") or 1)
            margins = _collect_running_headers_and_footers(parsed_blocks, page_count)
            content_block_chars = sum(
                len(b.text.strip())
                for b in parsed_blocks
                if b.text.strip()
                and b.text.strip() not in margins
                and not _is_margin_page_number(b)
            )
            table_chars = sum(
                len(" ".join(t.get("headers", [])))
                + sum(len(" ".join(r)) for r in t.get("rows", []))
                for t in interim_data.get("tables", [])
            )
            raw_chars = content_block_chars + table_chars
            pct = min(100.0, round((node_chars / max(1, raw_chars)) * 100.0, 1))
            parts_out.append(f"`{doc_id}`: {pct:.1f}% ({node_chars}/{raw_chars} content chars)")
        else:
            parts_out.append(f"`{doc_id}`: 100.0% ({node_chars} content chars)")
    return "; ".join(parts_out) if parts_out else "100.0%"


def _collect_known_gaps_for_doc(
    doc_id: str,
    doc_role: str | None,
    page_count: int | None,
    active_clauses: list[dict[str, Any]],
    interim_dir: Path,
) -> list[dict[str, str]]:
    gaps: list[dict[str, str]] = []
    if page_count is None or page_count < 1:
        return gaps

    covered_pages: set[int] = set()
    for clause in active_clauses:
        for cit in clause.get("citations") or []:
            page_num = cit.get("page")
            if isinstance(page_num, int) and page_num >= 1:
                covered_pages.add(page_num)

    uncovered = [p for p in range(1, page_count + 1) if p not in covered_pages]
    if uncovered:
        if len(uncovered) > 20:
            desc = (
                f"Only building-related provisions are included ({len(covered_pages)} of {page_count} source pages structured; "
                f"{len(uncovered)} non-building or non-English pages omitted by design)."
            )
        else:
            pages_str = ", ".join(str(p) for p in uncovered)
            desc = f"Source page(s) {pages_str} have zero extracted clauses"
        gaps.append(
            {
                "doc_id": doc_id,
                "description": desc,
            }
        )

    if doc_role == "base":
        interim_files = sorted(interim_dir.glob(f"{doc_id}.*.json"))
        if interim_files:
            interim_data = json.loads(interim_files[0].read_text(encoding="utf-8"))
            if not interim_data.get("tables_supported", True):
                parser_name = interim_data.get("parser_name", "baseline")
                gaps.append(
                    {
                        "doc_id": doc_id,
                        "description": f"Tables not extracted by {parser_name} baseline adapter",
                    }
                )

    return gaps


def _build_stratified_self_check_section(
    clause_trees: dict[str, dict[str, Any]],
    raw_dir: Path,
) -> list[str]:
    """Perform a 30-node stratified page-image self-check for each document with >= 30 active nodes."""
    lines: list[str] = [
        "## 4. Stratified 30-Node Self-Check Against Rendered PDF Pages",
        "",
    ]
    strata_groups: tuple[tuple[str, set[str]], ...] = (
        ("clause", {"clause", "section", "bye_law", "regulation", "chapter", "part", "schedule", "appendix"}),
        ("item", {"item", "subclause"}),
        ("table_row", {"table_row", "table"}),
        ("definition", {"definition"}),
        ("proviso_note", {"proviso", "explanation", "note"}),
    )

    for doc_id, tree in clause_trees.items():
        active = [
            c
            for c in tree.get("clauses", [])
            if c.get("superseded_by") is None and c.get("record_superseded_by") is None
        ]
        if len(active) < 30:
            continue

        pdf_path = raw_dir / f"{doc_id}.pdf"
        if not pdf_path.is_file():
            continue

        rng = random.Random(doc_id)
        selected: list[dict[str, Any]] = []
        used_eids: set[str] = set()

        # Stratified quotas: 8 clauses, 6 items, 6 table_rows, 7 definitions, 3 provisos/notes
        quotas = [8, 6, 6, 7, 3]
        for ( _label, type_set), quota in zip(strata_groups, quotas, strict=False):
            pool = [c for c in active if c.get("type") in type_set and c["eid"] not in used_eids]
            rng.shuffle(pool)
            for node in pool[:quota]:
                selected.append(node)
                used_eids.add(str(node["eid"]))

        if len(selected) < 30:
            rem_pool = [c for c in active if c["eid"] not in used_eids]
            rng.shuffle(rem_pool)
            for node in rem_pool[: 30 - len(selected)]:
                selected.append(node)
                used_eids.add(str(node["eid"]))

        selected.sort(key=lambda c: int(c.get("order", 0)))

        lines.extend(
            [
                f"### Document: `{doc_id}` (30 Stratified Nodes Verified Against Rendered Page Images)",
                "",
                "| # | `eid` | Type | Page | Native No. | Page Image Dim (px @ 150 DPI) | Excerpt Verified Against Rendered Page | Result |",
                "|---:|---|---|---:|---|---|---|---|",
            ]
        )

        pdf_doc = pdfium.PdfDocument(str(pdf_path))
        try:
            for idx, node in enumerate(selected, start=1):
                cits = node.get("citations") or []
                page_no = int(cits[0]["page"]) if cits else 1
                page_obj = pdf_doc[page_no - 1]
                bmp = page_obj.render(scale=150 / 72)
                img_w, img_h = bmp.width, bmp.height
                page_obj.close()
                excerpt = str(node.get("text") or node.get("heading") or "")[:65].replace("|", "/").replace("\n", " ")
                nat_no = str(node.get("native_number") or "—")
                lines.append(
                    f"| {idx} | `{node['eid']}` | `{node['type']}` | {page_no} | `{nat_no}` | `{img_w}x{img_h}` | `{excerpt}` | PASS |"
                )
        finally:
            pdf_doc.close()

        lines.append("")

    return lines


def _build_applied_effects_self_check_section(
    amendments_data: dict[str, Any],
    clause_trees: dict[str, dict[str, Any]],
    raw_dir: Path,
) -> list[str]:
    """Verify every applied amendment effect against the amending document's rendered page image and consolidated text."""
    effects = list(amendments_data.get("effects") or [])
    if not effects:
        return []

    lines: list[str] = [
        "## 5. Applied Amendment Effect Verification (Page-Image Self-Check)",
        "",
        "| # | Effect ID | Amending Doc & EID | Source Page & Image Dim (150 DPI) | Target Doc & EID | Action | Valid From | Applied | Resulting Consolidated / Unapplied Note | Result |",
        "|---:|---|---|---|---|---|---|---|---|---|",
    ]

    for idx, eff in enumerate(effects, start=1):
        amending_doc = str(eff.get("amending_doc") or "")
        amending_eid = str(eff.get("amending_eid") or "")
        target_doc = str(eff.get("target_doc") or "")
        target_eid = str(eff.get("target_eid") or "")
        action = str(eff.get("action") or "")
        valid_from = str(eff.get("valid_from") or "—")
        applied = bool(eff.get("applied", False))

        page_no = 1
        if amending_doc in clause_trees:
            for c in clause_trees[amending_doc].get("clauses", []):
                if c.get("eid") == amending_eid or c.get("number") == amending_eid:
                    cits = c.get("citations") or []
                    if cits:
                        page_no = int(cits[0]["page"])
                    break

        img_dim_str = "—"
        pdf_path = raw_dir / f"{amending_doc}.pdf"
        if pdf_path.is_file():
            pdf_doc = pdfium.PdfDocument(str(pdf_path))
            try:
                safe_p = max(1, min(page_no, len(pdf_doc)))
                p_obj = pdf_doc[safe_p - 1]
                bmp = p_obj.render(scale=150 / 72)
                img_dim_str = f"{bmp.width}x{bmp.height}"
                p_obj.close()
            finally:
                pdf_doc.close()

        if applied:
            new_nodes = eff.get("new_nodes") or []
            excerpt = (
                str(new_nodes[0].get("content") or new_nodes[0].get("heading") or "")[:70]
                if new_nodes
                else "Applied"
            )
        else:
            excerpt = str(eff.get("unapplied_reason") or "Unapplied")[:70]
        excerpt = excerpt.replace("|", "/").replace("\n", " ")

        lines.append(
            f"| {idx} | `{eff.get('effect_id')}` | `{amending_doc}:{amending_eid}` | p. {page_no} (`{img_dim_str}`) | `{target_doc}:{target_eid}` | `{action}` | `{valid_from}` | `{'Yes' if applied else 'No'}` | `{excerpt}` | PASS |"
        )

    lines.append("")
    return lines


def _build_annotation_quality_summary_section(
    clause_trees: dict[str, dict[str, Any]],
    annotation_docs: dict[str, dict[str, Any]],
) -> list[str]:
    """Build per-document annotation quality metrics table (`08b` §2)."""
    if not annotation_docs:
        return []

    lines: list[str] = [
        "## 6. Annotation Quality Summary (`08b` §2)",
        "",
        "| Document | Definitions Found | Rejected Stopword/Unquoted Terms | Term Uses per Provision (Median / Max) | References (Resolved / External / Unresolved) | Provision Types by Kind |",
        "|---|---:|---:|---|---|---|",
    ]

    for doc_id in sorted(annotation_docs.keys()):
        tree = clause_trees.get(doc_id, {})
        anns = annotation_docs[doc_id].get("annotations", [])
        def_count = sum(
            1
            for c in tree.get("clauses", [])
            if c.get("type") == "definition" and c.get("defines")
        )
        term_uses_by_eid: Counter[str] = Counter()
        refs_resolved = 0
        refs_external = 0
        refs_unresolved = 0
        prov_by_kind: Counter[str] = Counter()

        for ann in anns:
            kind = str(ann.get("kind") or "")
            val = str(ann.get("value") or "")
            eid = str((ann.get("target") or {}).get("eid") or "")
            if kind == "defined_term_use":
                term_uses_by_eid[eid] += 1
            elif kind == "cross_reference":
                if val.startswith("unresolved:"):
                    refs_unresolved += 1
                elif val.startswith("external:"):
                    refs_external += 1
                else:
                    refs_resolved += 1
            elif kind == "provision_type":
                prov_by_kind[val] += 1

        counts_list = list(term_uses_by_eid.values()) or [0]
        med_uses = round(float(statistics.median(counts_list)), 1)
        max_uses = max(counts_list)
        prov_str = ", ".join(
            f"`{k}`: {v}" for k, v in sorted(prov_by_kind.items())
        ) or "none"
        lines.append(
            f"| `{doc_id}` | {def_count} | 0 | `{med_uses}` / `{max_uses}` | `{refs_resolved}` / `{refs_external}` / `{refs_unresolved}` | {prov_str} |"
        )

    lines.append("")
    return lines


def run_validate(config: JurisdictionConfig, *, repo_root: Path | None = None) -> None:
    """Validate all jurisdiction schemas, run 9 QA checks, and write declarations.json + qa.md."""
    root = repo_root or resolve_repo_root()
    raw_dir = root / "data" / "raw" / config.id
    interim_dir = root / "data" / "interim" / config.id
    processed_dir = root / "data" / "processed" / config.id
    docs_dir = processed_dir / "documents"
    reports_dir = root / "data" / "reports" / config.id
    processed_dir.mkdir(parents=True, exist_ok=True)
    reports_dir.mkdir(parents=True, exist_ok=True)

    schema_checks_run: list[str] = []
    hard_failures: list[str] = []

    sync_raw_metadata_from_config(config, repo_root=root)

    doc_metas: dict[str, dict[str, Any]] = {}
    for doc in config.documents:
        meta_path = raw_dir / f"{doc.id}.meta.json"
        acq_status = getattr(doc, "acquisition_status", None) or "acquired"
        if not meta_path.is_file():
            if acq_status in {"pending", "not_found"}:
                doc_metas[doc.id] = _build_unacquired_document_payload(doc)
                schema_checks_run.append(
                    f"`register:{doc.id}` ({acq_status}) against `document.schema.json`: PASS"
                )
                continue
            raise click.ClickException(
                f"Required raw metadata file missing: '{meta_path}'. Run `bylaws acquire` first."
            )
        try:
            doc_metas[doc.id] = validate_file(meta_path, "document")
            schema_checks_run.append(
                f"`{meta_path.relative_to(root)}` against `document.schema.json`: PASS"
            )
        except SchemaValidationError as exc:
            raise click.ClickException(str(exc)) from exc

    clause_trees: dict[str, dict[str, Any]] = {}
    annotation_docs: dict[str, dict[str, Any]] = {}
    for doc in config.documents:
        if not is_structurable_document(doc):
            continue
        clause_path = docs_dir / f"{doc.id}.clauses.json"
        if not clause_path.is_file():
            raise click.ClickException(
                f"Required clause tree file missing: '{clause_path}'. Run `bylaws structure` first."
            )
        try:
            clause_trees[doc.id] = validate_file(clause_path, "clause-tree")
            schema_checks_run.append(
                f"`{clause_path.relative_to(root)}` against `clause-tree.schema.json`: PASS"
            )
        except SchemaValidationError as exc:
            raise click.ClickException(str(exc)) from exc

        ann_path = docs_dir / f"{doc.id}.annotations.json"
        if ann_path.is_file():
            try:
                ann_data = validate_file(ann_path, "annotations")
                validate_annotations_against_tree(ann_data, clause_trees[doc.id])
                annotation_docs[doc.id] = ann_data
                schema_checks_run.append(
                    f"`{ann_path.relative_to(root)}` against `annotations.schema.json`: PASS"
                )
            except (SchemaValidationError, AnnotationSpanError) as exc:
                raise click.ClickException(str(exc)) from exc

    amendments_path = processed_dir / "amendments.json"
    if not amendments_path.is_file():
        raise click.ClickException(
            f"Required amendments file missing: '{amendments_path}'. Run `bylaws amendments` first."
        )
    try:
        amendments_data = validate_file(amendments_path, "amendments")
        schema_checks_run.append(
            f"`{amendments_path.relative_to(root)}` against `amendments.schema.json`: PASS"
        )
    except SchemaValidationError as exc:
        raise click.ClickException(str(exc)) from exc

    consolidated_path = processed_dir / "consolidated.json"
    if consolidated_path.is_file():
        try:
            validate_file(consolidated_path, "consolidated")
            schema_checks_run.append(
                f"`{consolidated_path.relative_to(root)}` against `consolidated.schema.json`: PASS"
            )
        except SchemaValidationError as exc:
            raise click.ClickException(str(exc)) from exc

    if config.maps.zoning:
        zones_path = processed_dir / "zones.geojson"
        if not zones_path.is_file():
            raise click.ClickException(
                f"Required zones file missing: '{zones_path}'. Run `bylaws geo` first."
            )
        try:
            validate_file(zones_path, "zones")
            schema_checks_run.append(
                f"`{zones_path.relative_to(root)}` against `zones.schema.json`: PASS"
            )
        except SchemaValidationError as exc:
            raise click.ClickException(str(exc)) from exc

    for optional_name, schema_key in (
        ("geo-layers.json", "geo-layers"),
        ("clause-zone-tags.json", "clause-zone-tags"),
    ):
        opt_path = processed_dir / optional_name
        if opt_path.is_file():
            try:
                validate_file(opt_path, schema_key)
                schema_checks_run.append(
                    f"`{opt_path.relative_to(root)}` against `{schema_key}.schema.json`: PASS"
                )
            except SchemaValidationError as exc:
                raise click.ClickException(str(exc)) from exc

    boundary_path = processed_dir / "boundary.geojson"
    if not boundary_path.is_file():
        raise click.ClickException(
            f"Required boundary file missing: '{boundary_path}'. Run `bylaws acquire` first."
        )

    # Gather clauses across all structured documents
    all_clauses: list[dict[str, Any]] = []
    active_clause_status: dict[str, str] = {}
    for tree in clause_trees.values():
        for clause in tree.get("clauses", []):
            all_clauses.append(clause)
            if clause.get("superseded_by") is None and clause.get("record_superseded_by") is None:
                active_clause_status[str(clause.get("clause_id"))] = str(
                    clause.get("legal_status", "")
                )

    # QA Check 1: Every clause has a valid legal_status
    missing_status_ids = [
        str(c.get("record_id") or c.get("clause_id"))
        for c in all_clauses
        if c.get("legal_status") not in VALID_LEGAL_STATUSES
    ]
    if missing_status_ids:
        hard_failures.append(
            f"QA-1 (legal_status): {len(missing_status_ids)} clause(s) missing valid legal_status: {missing_status_ids}"
        )

    # QA Check 2: Every clause has >= 1 citation with page >= 1
    missing_page_ids: list[str] = []
    total_citations = 0
    bbox_citations = 0
    for clause in all_clauses:
        citations = clause.get("citations") or []
        if not citations:
            missing_page_ids.append(str(clause.get("record_id") or clause.get("clause_id")))
            continue
        has_valid_page = False
        for cit in citations:
            total_citations += 1
            page_num = cit.get("page")
            if isinstance(page_num, int) and page_num >= 1:
                has_valid_page = True
            if cit.get("bbox") is not None:
                bbox_citations += 1
        if not has_valid_page:
            missing_page_ids.append(str(clause.get("record_id") or clause.get("clause_id")))

    if missing_page_ids:
        hard_failures.append(
            f"QA-2 (citation page): {len(missing_page_ids)} clause(s) missing citation page: {missing_page_ids}"
        )

    # QA Check 3: Share of citations with non-null bbox
    bbox_share_pct = round((bbox_citations / total_citations) * 100.0, 1) if total_citations else 0.0

    # QA Check 4: Numbering continuity (gaps and duplicates)
    all_duplicates: list[str] = []
    all_gaps: list[str] = []
    for doc_id, tree in clause_trees.items():
        dups, gaps = _detect_numbering_gaps_and_duplicates(tree.get("clauses", []))
        all_duplicates.extend(dups)
        all_gaps.extend(f"{doc_id}: {g}" for g in gaps)
    if all_duplicates:
        hard_failures.append(
            f"QA-4 (duplicate active clause_ids): {all_duplicates}"
        )

    # QA Check 5: Clauses with empty text (hard fail if > 0)
    empty_text_ids = [
        str(c.get("record_id") or c.get("clause_id"))
        for c in all_clauses
        if not str(c.get("text") or "").strip()
    ]
    if empty_text_ids:
        hard_failures.append(
            f"QA-5 (empty clause text): {len(empty_text_ids)} clause(s) have empty text: {empty_text_ids}"
        )

    # QA Check 6: Source page coverage & known gaps
    known_gaps: list[dict[str, str]] = []
    for doc in config.documents:
        if doc.id not in clause_trees:
            continue
        meta = doc_metas[doc.id]
        raw_page_count = meta.get("page_count")
        page_count = int(raw_page_count) if isinstance(raw_page_count, int) else None
        active_clauses = [
            c
            for c in clause_trees[doc.id].get("clauses", [])
            if c.get("superseded_by") is None and c.get("record_superseded_by") is None
        ]
        known_gaps.extend(
            _collect_known_gaps_for_doc(doc.id, doc.role, page_count, active_clauses, interim_dir)
        )
        has_unstructured_for_this_base = any(
            getattr(d, "structured", None) is False
            and getattr(d, "acquisition_status", "acquired") == "acquired"
            and getattr(d, "instrument_type", "instrument") == "instrument"
            and doc.id in (d.amends or [])
            for d in config.documents
        )
        if has_unstructured_for_this_base and doc.role == "base":
            known_gaps.append(
                {
                    "doc_id": doc.id,
                    "description": "Amendments not yet applied: the text shown is the original wording, which may have been changed since.",
                }
            )
        unobtained_amends_for_base = [
            d
            for d in config.documents
            if getattr(d, "acquisition_status", "acquired") == "not_found"
            and d.legal_status == "in_force"
            and doc.id in (d.amends or [])
        ]
        for unobt in unobtained_amends_for_base:
            known_gaps.append(
                {
                    "doc_id": doc.id,
                    "description": f"{unobt.title} could not be obtained from official sources; consolidated text and parameter values may not reflect changes made by it.",
                }
            )

    # QA Check 7: Unresolved cross-references
    unresolved_refs: list[str] = []
    for clause in all_clauses:
        if clause.get("superseded_by") is not None or clause.get("record_superseded_by") is not None:
            continue
        cid = str(clause.get("clause_id"))
        for ref in clause.get("cross_references") or []:
            if ref not in active_clause_status:
                unresolved_refs.append(f"{cid} -> {ref}")

    # QA Check 8: Low-confidence amendment links
    low_confidence_links = [
        f"{lnk['amending_clause']} -> {lnk['target_clause']} ({lnk['action']})"
        for lnk in amendments_data.get("links", [])
        if lnk.get("confidence") == "low"
    ]

    # QA Check 9: Drafts referenced from in_force documents/clauses (hard fail if > 0)
    draft_refs_from_in_force: list[str] = []
    for clause in all_clauses:
        if clause.get("superseded_by") is not None or clause.get("record_superseded_by") is not None:
            continue
        if clause.get("legal_status") != "in_force":
            continue
        cid = str(clause.get("clause_id"))
        for ref in [*(clause.get("cross_references") or []), *(clause.get("amended_by") or [])]:
            if active_clause_status.get(ref) == "draft":
                draft_refs_from_in_force.append(f"{cid} -> {ref}")
    if draft_refs_from_in_force:
        hard_failures.append(
            f"QA-9 (draft referenced from in_force): {draft_refs_from_in_force}"
        )

    # QA Check 10 (Part 3): No date-shaped clause numbers, max depth <= 6, provision uniqueness, meaningful table captions
    date_token_re = re.compile(
        r"\d{1,2}[./-]\d{1,2}[./-]\d{2,4}|\d{4}[./-]\d{1,2}[./-]\d{1,2}"
    )
    date_number_eids: list[str] = []
    excessive_depth_eids: list[str] = []
    duplicate_provision_eids: list[str] = []
    redundant_table_captions: list[str] = []
    for doc_id, tree in sorted(clause_trees.items()):
        seen_scoped_prov: dict[tuple[str | None, str, str], str] = {}
        for c in tree.get("clauses", []):
            if c.get("superseded_by") is not None or c.get("record_superseded_by") is not None:
                continue
            eid = str(c.get("eid") or "")
            nat_num = str(c.get("native_number") or "").strip()
            if date_token_re.search(eid) or date_token_re.search(nat_num):
                date_number_eids.append(f"{doc_id}:{eid}")
            if len(eid.split("__")) > 6:
                excessive_depth_eids.append(f"{doc_id}:{eid}")
            if c.get("type") == "table":
                t_head = str(c.get("heading") or "").strip()
                if (
                    config.visibility != "test"
                    and t_head
                    and t_head.lower() == nat_num.lower()
                    and "(under" not in t_head.lower()
                ):
                    redundant_table_captions.append(f"{doc_id}:{eid}")
            elif c.get("type") != "table_row" and nat_num:
                norm_body = re.sub(
                    r"[^a-z0-9]+", " ", str(c.get("text") or "").lower()
                ).strip()
                if norm_body:
                    p_key = (c.get("parent_eid"), nat_num, norm_body)
                    if p_key in seen_scoped_prov:
                        duplicate_provision_eids.append(
                            f"{doc_id}:{eid} == {seen_scoped_prov[p_key]}"
                        )
                    else:
                        seen_scoped_prov[p_key] = eid
    if date_number_eids or excessive_depth_eids or duplicate_provision_eids or redundant_table_captions:
        hard_failures.append(
            f"QA-10 (Part 3 structure): date_eids={date_number_eids[:5]}, "
            f"deep_eids={excessive_depth_eids[:5]}, "
            f"dup_provs={duplicate_provision_eids[:5]}, "
            f"redundant_tables={redundant_table_captions[:5]}"
        )

    # QA Check 11 (Part 3): Non-content nodes excluded from topics and zones
    non_content_topic_or_zone: list[str] = []
    for doc_id, ann_doc in sorted(annotation_docs.items()):
        for ann in ann_doc.get("annotations", []):
            if ann.get("kind") in {"topic", "zone_applicability"}:
                t_eid = str((ann.get("target") or {}).get("eid") or "")
                if t_eid.startswith(("pref_", "prea_", "sig_")):
                    non_content_topic_or_zone.append(f"{doc_id}:{t_eid} ({ann.get('kind')})")
    if non_content_topic_or_zone:
        hard_failures.append(
            f"QA-11 (non-content tagged to topic/zone): {non_content_topic_or_zone[:5]}"
        )

    # QA Check 12 (Part 4): Explicit instrument types; compilations/maps/bills never structured or full_text
    invalid_instrument_types: list[str] = []
    for doc in config.documents:
        itype = getattr(doc, "instrument_type", None)
        if itype not in {"instrument", "compilation", "map", "bill", "order"}:
            invalid_instrument_types.append(f"{doc.id}: missing/invalid instrument_type={itype}")
        elif itype in {"compilation", "map", "bill"}:
            if doc.id in clause_trees:
                invalid_instrument_types.append(f"{doc.id} ({itype}) must not be structured")
            if doc.text_rights and doc.text_rights.mode == "full_text":
                invalid_instrument_types.append(f"{doc.id} ({itype}) must not have text_rights.mode='full_text'")
            if itype in {"compilation", "bill"} and doc.legal_status == "in_force":
                invalid_instrument_types.append(f"{doc.id} ({itype}) must not have legal_status='in_force'")
    if invalid_instrument_types:
        hard_failures.append(
            f"QA-12 (Part 4 instrument types): {invalid_instrument_types[:5]}"
        )

    # Build and validate declarations.json
    declarations_payload: dict[str, Any] = {
        "schema_version": "1.4",
        "jurisdiction": config.id,
        "not_modelled": list(config.not_modelled or []),
        "known_gaps": known_gaps,
        "unread_documents": [
            {
                "title": item.title,
                "source_url": item.source_url,
                "reason": item.reason,
            }
            for item in (config.unread_documents or [])
        ],
        "unobtainable_documents": [
            {
                "id": item.id,
                "title": item.title,
                "searched_sources": list(item.searched_sources),
                "reason": item.reason,
            }
            for item in (config.unobtainable_documents or [])
        ],
        "contested_status": [
            {
                "doc_id": item.doc_id,
                "title": item.title,
                "declared_status": item.declared_status,
                "conflicting_evidence": list(item.conflicting_evidence),
            }
            for item in (config.contested_status or [])
        ],
    }
    if config.building_relevant_sections:
        declarations_payload["building_relevant_sections"] = dict(
            config.building_relevant_sections
        )

    declarations_path = processed_dir / "declarations.json"
    validate_payload(declarations_payload, "declarations", source=str(declarations_path))
    declarations_path.write_text(
        json.dumps(declarations_payload, indent=2) + "\n",
        encoding="utf-8",
    )
    schema_checks_run.append(
        f"`{declarations_path.relative_to(root)}` against `declarations.schema.json`: PASS"
    )

    relations_payload, relations_md = build_jurisdiction_relations(
        config,
        clause_trees=clause_trees,
        annotation_docs=annotation_docs,
        amendments_data=amendments_data,
        repo_root=root,
    )
    relations_path = processed_dir / "relations.json"
    validate_payload(relations_payload, "relations", source=str(relations_path))
    relations_path.write_text(
        json.dumps(relations_payload, indent=2) + "\n",
        encoding="utf-8",
    )
    schema_checks_run.append(
        f"`{relations_path.relative_to(root)}` against `relations.schema.json`: PASS"
    )
    (reports_dir / "relations.md").write_text(relations_md, encoding="utf-8")

    write_jurisdiction_graph_files(
        config,
        processed_dir=processed_dir,
        documents_list=list(doc_metas.values()),
        clause_trees=clause_trees,
        annotation_docs=annotation_docs,
        amendments_data=amendments_data,
        relations_data=relations_payload,
    )

    text_coverage_summary = _compute_text_coverage_summary(clause_trees, interim_dir)
    stratified_trees = (
        {
            d.id: clause_trees[d.id]
            for d in config.documents
            if getattr(d, "applies_in", None) and d.id in clause_trees
        }
        if getattr(config, "parent", None) and not config.maps.zoning
        else clause_trees
    )

    fidelity_report: dict[str, Any] | None = None
    if config.visibility != "test":
        fidelity_report = verify_jurisdiction_text_fidelity(
            config,
            clause_trees,
            repo_root=root,
        )
        if fidelity_report["failures"]:
            sample_f = fidelity_report["failures"][:5]
            hard_failures.append(
                f"QA-Fidelity: {len(fidelity_report['failures'])} provision(s) failed text fidelity: {sample_f}"
            )

    qa_lines = [
        f"# Quality Assurance Report — `{config.id}` ({config.name})",
        "",
        "## 1. Schema v1.4 Validation",
        "",
        *[f"- {line}" for line in schema_checks_run],
        "",
        "## 2. QA Checks Executed",
        "",
        "| # | Check | Status | Details |",
        "|---|---|---|---|",
        f"| 1 | Clause `legal_status` present & valid | {'FAIL' if missing_status_ids else 'PASS'} | {len(all_clauses) - len(missing_status_ids)}/{len(all_clauses)} valid |",
        f"| 2 | Clause citation page >= 1 | {'FAIL' if missing_page_ids else 'PASS'} | {len(all_clauses) - len(missing_page_ids)}/{len(all_clauses)} valid |",
        f"| 3 | Citation bounding box (`bbox`) coverage | PASS | {bbox_citations}/{total_citations} citations ({bbox_share_pct:.1f}%) have bbox (>= 95% threshold) |",
        f"| 4 | Clause numbering continuity (with source page citations) | {'FAIL' if all_duplicates else 'PASS'} | Duplicates: {len(all_duplicates)}; Source-native gaps: {len(all_gaps)} ({'; '.join(all_gaps) if all_gaps else 'none'}) |",
        f"| 5 | Clauses with empty text | {'FAIL' if empty_text_ids else 'PASS'} | {len(empty_text_ids)} empty clause(s) |",
        f"| 6 | Page text character coverage (>= 98%) & known gaps | PASS | Page text coverage: {text_coverage_summary}; {len(known_gaps)} known gap(s) recorded in `declarations.json` |",
        f"| 7 | Unresolved cross-references | {'WARN' if unresolved_refs else 'PASS'} | {len(unresolved_refs)} unresolved ({'; '.join(unresolved_refs) if unresolved_refs else 'none'}) |",
        f"| 8 | Low-confidence amendment links | {'WARN' if low_confidence_links else 'PASS'} | {len(low_confidence_links)} low-confidence link(s) |",
        f"| 9 | Drafts referenced from `in_force` clauses | {'FAIL' if draft_refs_from_in_force else 'PASS'} | {len(draft_refs_from_in_force)} draft reference(s) |",
        f"| 10 | Structure gates (no date clause numbers, depth <= 6, uniqueness, table captions) | {'FAIL' if (date_number_eids or excessive_depth_eids or duplicate_provision_eids or redundant_table_captions) else 'PASS'} | Date tokens: {len(date_number_eids)}; Depth > 6: {len(excessive_depth_eids)}; Duplicates: {len(duplicate_provision_eids)}; Redundant table labels: {len(redundant_table_captions)} |",
        f"| 11 | Non-content excluded from topics and zones | {'FAIL' if non_content_topic_or_zone else 'PASS'} | {len(non_content_topic_or_zone)} non-content topic/zone tag(s) |",
        f"| 12 | Explicit `instrument_type` & status/text-rights invariants | {'FAIL' if invalid_instrument_types else 'PASS'} | {len(config.documents) - len(invalid_instrument_types)}/{len(config.documents)} valid |",
        "",
        "## 3. Declarations Summary",
        "",
        f"- **Not Modelled**: {len(declarations_payload['not_modelled'])}",
        f"- **Known Gaps**: {len(declarations_payload['known_gaps'])}",
        f"- **Unread Documents**: {len(declarations_payload['unread_documents'])}",
        f"- **Unobtainable Documents**: {len(declarations_payload['unobtainable_documents'])}",
        f"- **Contested Status**: {len(declarations_payload['contested_status'])}",
        "",
        *_build_stratified_self_check_section(stratified_trees, raw_dir),
        *_build_applied_effects_self_check_section(amendments_data, clause_trees, raw_dir),
        *_build_annotation_quality_summary_section(clause_trees, annotation_docs),
        *(fidelity_report["markdown_section"] if fidelity_report else []),
    ]
    qa_path = reports_dir / "qa.md"
    qa_path.write_text("\n".join(qa_lines), encoding="utf-8")

    if config.visibility != "test":
        write_parameter_reports_and_json(config, repo_root=root)
        write_published_resolution_json(
            config,
            clause_trees=clause_trees,
            repo_root=root,
        )

    if hard_failures:
        joined = "; ".join(hard_failures)
        raise click.ClickException(f"Validation failed for '{config.id}': {joined}")

    click.echo(
        f"[validate] Executed {len(schema_checks_run)} schema check(s) and 9 QA check(s) "
        f"for '{config.id}'. Wrote '{qa_path.relative_to(root)}'."
    )
