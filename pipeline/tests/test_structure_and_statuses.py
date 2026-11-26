"""Parts 3 & 4 tests: Structure repair (dates, duplicates, sibling list items, depth<=6, table captions, topic exclusion) and Statuses & Relationships."""

from __future__ import annotations

import json
import re

from bylaws.config import load_jurisdiction_config
from bylaws.root import resolve_repo_root
from bylaws.structure import _match_structural_line

DATE_TOKEN_RE = re.compile(
    r"\d{1,2}[./-]\d{1,2}[./-]\d{2,4}|\d{4}[./-]\d{1,2}[./-]\d{1,2}"
)


def _resolve_docs_dir_or_published(jurisdiction_id: str):
    repo_root = resolve_repo_root()
    proc_docs = repo_root / "data" / "processed" / jurisdiction_id / "documents"
    if proc_docs.is_dir() and any(proc_docs.glob("*.clauses.json")):
        return proc_docs, repo_root / "data" / "processed" / jurisdiction_id
    cfg = load_jurisdiction_config(jurisdiction_id)
    ver = str(cfg.release_version or "4.0.0")
    pub_dir = repo_root / "public" / "data" / jurisdiction_id / ver
    return pub_dir, pub_dir


def test_dates_never_parsed_as_clause_numbers_and_clause_17_not_duplicated() -> None:
    """Date-shaped tokens never match as clause numbers, and `rmp2015-zr-amend-2025-04` has zero date nodes and one Clause 17."""
    assert _match_structural_line("11.11.2025 Whereas the draft notification") is None
    assert _match_structural_line("12.12.2025 In exercise of the powers") is None
    assert _match_structural_line("28.10.2017 Notification No. UDD 14 TTP 2017") is None
    assert _match_structural_line("Clause 11.11.2025: Some text") is None

    docs_dir, _ = _resolve_docs_dir_or_published("in-ka-bengaluru")
    for p in sorted(docs_dir.glob("*.clauses.json")):
        doc_id = p.name.removesuffix(".clauses.json")
        tree = json.loads(p.read_text(encoding="utf-8"))
        for c in tree["clauses"]:
            if c.get("superseded_by") or c.get("record_superseded_by"):
                continue
            eid = str(c["eid"])
            nat = str(c.get("native_number") or "")
            assert not DATE_TOKEN_RE.search(eid), f"Date token in eid {doc_id}:{eid}"
            assert not DATE_TOKEN_RE.search(nat), f"Date token in native_number {doc_id}:{nat}"

    p_far = json.loads((docs_dir / "rmp2015-zr-amend-2025-04.clauses.json").read_text(encoding="utf-8"))
    active_pfar = [
        c for c in p_far["clauses"] if not c.get("superseded_by") and not c.get("record_superseded_by")
    ]
    eids_pfar = {c["eid"] for c in active_pfar}
    assert "cl_11.11.2025" not in eids_pfar
    assert "cl_12.12.2025" not in eids_pfar
    cl17_nodes = [
        c
        for c in active_pfar
        if c.get("type") == "clause" and str(c.get("native_number") or "") == "17"
    ]
    assert len(cl17_nodes) == 1, f"Expected exactly 1 Clause 17 in rmp2015-zr-amend-2025-04, got {[c['eid'] for c in cl17_nodes]}"
    assert cl17_nodes[0].get("citations"), "Clause 17 must carry page citations"


def test_sibling_list_items_max_depth_6_and_provision_uniqueness() -> None:
    """Same-level list items attach as siblings, no provision `eid` exceeds depth 6, and no duplicate provisions exist."""
    docs_dir, _ = _resolve_docs_dir_or_published("in-ka-bengaluru")

    for p in sorted(docs_dir.glob("*.clauses.json")):
        doc_id = p.name.removesuffix(".clauses.json")
        tree = json.loads(p.read_text(encoding="utf-8"))
        seen_scoped: dict[tuple[str | None, str, str], str] = {}
        for c in tree["clauses"]:
            if c.get("superseded_by") or c.get("record_superseded_by"):
                continue
            eid = str(c["eid"])
            depth = len(eid.split("__"))
            assert depth <= 6, f"Node {doc_id}:{eid} exceeds max depth 6 (depth={depth})"
            assert "__item_a__item_b" not in eid, f"Runaway sibling nesting in {doc_id}:{eid}"
            assert "__item_i__item_ii" not in eid, f"Runaway sibling nesting in {doc_id}:{eid}"

            if c.get("type") not in {"table", "table_row"}:
                nat = str(c.get("native_number") or "").strip()
                norm_txt = re.sub(r"[^a-z0-9]+", " ", str(c.get("text") or "").lower()).strip()
                if nat and norm_txt:
                    key = (c.get("parent_eid"), nat, norm_txt)
                    assert key not in seen_scoped, (
                        f"Duplicate provision in {doc_id}: {eid} duplicates {seen_scoped[key]}"
                    )
                    seen_scoped[key] = eid


def test_meaningful_table_captions_and_non_content_excluded_from_topics_and_zones() -> None:
    """Tables carry printed captions or 'Table (under <provision>)', and non-content nodes are excluded from topics and zones."""
    docs_dir, south_dir = _resolve_docs_dir_or_published("in-ka-bengaluru-south")

    for p in sorted(docs_dir.glob("*.clauses.json")):
        doc_id = p.name.removesuffix(".clauses.json")
        tree = json.loads(p.read_text(encoding="utf-8"))
        for c in tree["clauses"]:
            if c.get("type") == "table":
                nat = str(c.get("native_number") or "").strip()
                hd = str(c.get("heading") or "").strip()
                title = str(c.get("title") or "").strip()
                assert nat, f"Table {doc_id}:{c['eid']} missing native_number"
                assert f"{nat} — {nat}" not in title, f"Redundant table label in {doc_id}:{c['eid']}: {title}"
                if hd:
                    assert hd.lower() != nat.lower() or "(under" in hd.lower(), (
                        f"Redundant table heading in {doc_id}:{c['eid']}: nat={nat!r}, heading={hd!r}"
                    )

    for p in sorted(docs_dir.glob("*.annotations.json")):
        doc_id = p.name.removesuffix(".annotations.json")
        ann_doc = json.loads(p.read_text(encoding="utf-8"))
        for ann in ann_doc.get("annotations", []):
            if ann.get("kind") in {"topic", "zone_applicability"}:
                t_eid = str((ann.get("target") or {}).get("eid") or "")
                assert not t_eid.startswith(("pref_", "prea_", "sig_")), (
                    f"Non-content node {doc_id}:{t_eid} tagged with {ann['kind']}={ann.get('value')}"
                )

    tags_doc = json.loads((south_dir / "clause-zone-tags.json").read_text(encoding="utf-8"))
    for tag in tags_doc.get("tags", []):
        cid = str(tag.get("clause_id") or "")
        local_id = cid.split(":", 1)[-1]
        assert not local_id.startswith(("pref_", "prea_", "sig_", "TOC")), (
            f"Non-content clause_id {cid} present in clause-zone-tags.json"
        )


def test_part4_instrument_types_model_bbl_2017_quotes_and_succession_evidence() -> None:
    """Every register entry has an explicit instrument_type, ka-model-bbl-2017 explains bye-law 1.4 with quotes, and succession.yaml rows are backed by statutory quotes."""
    cfg = load_jurisdiction_config("in-ka-bengaluru-south")
    by_id = {d.id: d for d in cfg.documents}

    for doc in cfg.documents:
        assert doc.instrument_type in {"instrument", "compilation", "map", "bill", "order"}
        assert doc.summary_by_site or doc.acquisition_status == "not_found", (
            f"Document {doc.id} should carry a plain summary_by_site"
        )
        if doc.instrument_type in {"compilation", "map", "bill"}:
            assert doc.structured is False
            assert doc.text_rights is not None and doc.text_rights.mode == "reference_only"
        if doc.instrument_type in {"compilation", "bill"}:
            assert doc.legal_status != "in_force"

    # Kannada compilation is unstructured compilation
    kan = by_id["rmp2015-zr-comp-2024-10-kn"]
    assert kan.instrument_type == "compilation"
    assert kan.structured is False

    # Model Building Bye-laws 2017 relationship to bye-law 1.4 explained with quotes
    ka_2017 = by_id["ka-model-bbl-2017"]
    assert ka_2017.applies_to_jurisdiction is not None
    assert ka_2017.applies_to_jurisdiction.status == "no"
    reason = ka_2017.applies_to_jurisdiction.reason or ""
    quote = getattr(ka_2017.applies_to_jurisdiction, "quoted_evidence", None) or reason
    assert "where the rule that master plan regulations govern setbacks, FAR and coverage comes from" in reason
    assert "Karnataka Municipalities Act, 1964" in quote
    assert "Karnataka Municipal Corporations Act, 1976" in quote
    assert "mutatis mutandis" in quote
    assert ka_2017.notes_by_site and len(ka_2017.notes_by_site) >= 3

    # Succession rows backed by real statutory succession quotes and matching dates
    _, south_dir = _resolve_docs_dir_or_published("in-ka-bengaluru-south")
    relations = json.loads((south_dir / "relations.json").read_text(encoding="utf-8"))
    succ_rows = relations.get("succession") or []
    assert len(succ_rows) >= 3
    for row in succ_rows:
        q = str(row.get("quoted_evidence") or "")
        assert "Table-2B" not in q, f"Succession row {row['id']} must not quote deviation Table-2B"
        assert len(q) >= 80
        inst_doc = by_id.get(str(row["instrument_id"]))
        assert inst_doc is not None
        assert row["effective_date"] in {inst_doc.effective_from, inst_doc.notified_date}, (
            f"Succession row {row['id']} effective_date {row['effective_date']} does not match {inst_doc.id}"
        )
