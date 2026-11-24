"""Stage 8.7: Schema v1.3 validation, 9-point QA suite, declarations.json, and qa.md report."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import click

from bylaws.annotations import AnnotationSpanError, validate_annotations_against_tree
from bylaws.config import JurisdictionConfig
from bylaws.root import resolve_repo_root
from bylaws.schema_validator import (
    SchemaValidationError,
    validate_file,
    validate_payload,
)
from bylaws.structure import is_structurable_document

VALID_LEGAL_STATUSES = {"in_force", "draft", "superseded", "withdrawn", "status_unknown"}


def _detect_numbering_gaps_and_duplicates(
    clauses: list[dict[str, Any]],
) -> tuple[list[str], list[str]]:
    """Return `(duplicates, gaps)` among active clauses in a document."""
    active_clauses = [
        c
        for c in clauses
        if c.get("superseded_by") is None and c.get("record_superseded_by") is None
    ]
    seen_ids: set[str] = set()
    duplicates: list[str] = []
    by_parent: dict[str | None, list[int]] = {}

    for clause in active_clauses:
        cid = str(clause.get("clause_id", ""))
        if cid in seen_ids and cid not in duplicates:
            duplicates.append(cid)
        seen_ids.add(cid)

        num_str = str(clause.get("number", ""))
        parent_id = clause.get("parent_id")
        last_segment = num_str.split(".")[-1]
        if last_segment.isdigit():
            by_parent.setdefault(parent_id, []).append(int(last_segment))

    gaps: list[str] = []
    for parent_id, seq in by_parent.items():
        if not seq:
            continue
        sorted_unique = sorted(set(seq))
        expected = list(range(sorted_unique[0], sorted_unique[-1] + 1))
        missing = [n for n in expected if n not in sorted_unique]
        if missing:
            prefix = f"{parent_id}." if parent_id else "top-level "
            gaps.append(f"{prefix}missing {missing}")

    return duplicates, gaps


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
        pages_str = ", ".join(str(p) for p in uncovered)
        gaps.append(
            {
                "doc_id": doc_id,
                "description": f"Source page(s) {pages_str} have zero extracted clauses",
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

    doc_metas: dict[str, dict[str, Any]] = {}
    for doc in config.documents:
        meta_path = raw_dir / f"{doc.id}.meta.json"
        if not meta_path.is_file():
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

    # Build and validate declarations.json
    declarations_payload: dict[str, Any] = {
        "schema_version": "1.3",
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

    qa_lines = [
        f"# Quality Assurance Report — `{config.id}` ({config.name})",
        "",
        "## 1. Schema v1.3 Validation",
        "",
        *[f"- {line}" for line in schema_checks_run],
        "",
        "## 2. QA Checks Executed",
        "",
        "| # | Check | Status | Details |",
        "|---|---|---|---|",
        f"| 1 | Clause `legal_status` present & valid | {'FAIL' if missing_status_ids else 'PASS'} | {len(all_clauses) - len(missing_status_ids)}/{len(all_clauses)} valid |",
        f"| 2 | Clause citation page >= 1 | {'FAIL' if missing_page_ids else 'PASS'} | {len(all_clauses) - len(missing_page_ids)}/{len(all_clauses)} valid |",
        f"| 3 | Citation bounding box (`bbox`) coverage | INFO | {bbox_citations}/{total_citations} citations ({bbox_share_pct:.1f}%) have bbox |",
        f"| 4 | Clause numbering continuity | {'FAIL' if all_duplicates else 'PASS'} | Duplicates: {len(all_duplicates)}; Gaps: {len(all_gaps)} ({'; '.join(all_gaps) if all_gaps else 'none'}) |",
        f"| 5 | Clauses with empty text | {'FAIL' if empty_text_ids else 'PASS'} | {len(empty_text_ids)} empty clause(s) |",
        f"| 6 | Source page coverage & adapter gaps | INFO | {len(known_gaps)} known gap(s) recorded in `declarations.json` |",
        f"| 7 | Unresolved cross-references | {'WARN' if unresolved_refs else 'PASS'} | {len(unresolved_refs)} unresolved ({'; '.join(unresolved_refs) if unresolved_refs else 'none'}) |",
        f"| 8 | Low-confidence amendment links | {'WARN' if low_confidence_links else 'PASS'} | {len(low_confidence_links)} low-confidence link(s) |",
        f"| 9 | Drafts referenced from `in_force` clauses | {'FAIL' if draft_refs_from_in_force else 'PASS'} | {len(draft_refs_from_in_force)} draft reference(s) |",
        "",
        "## 3. Declarations Summary",
        "",
        f"- **Not Modelled**: {len(declarations_payload['not_modelled'])}",
        f"- **Known Gaps**: {len(declarations_payload['known_gaps'])}",
        f"- **Unread Documents**: {len(declarations_payload['unread_documents'])}",
        f"- **Unobtainable Documents**: {len(declarations_payload['unobtainable_documents'])}",
        f"- **Contested Status**: {len(declarations_payload['contested_status'])}",
        "",
    ]
    qa_path = reports_dir / "qa.md"
    qa_path.write_text("\n".join(qa_lines), encoding="utf-8")

    if hard_failures:
        joined = "; ".join(hard_failures)
        raise click.ClickException(f"Validation failed for '{config.id}': {joined}")

    click.echo(
        f"[validate] Executed {len(schema_checks_run)} schema check(s) and 9 QA check(s) "
        f"for '{config.id}'. Wrote '{qa_path.relative_to(root)}'."
    )
