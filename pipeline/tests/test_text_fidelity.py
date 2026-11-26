"""Part 2 tests: Machine-enforced provision text fidelity, notes_by_site, real tables, OCR corrections, and page furniture."""

from __future__ import annotations

import copy
import json
from pathlib import Path

from bylaws.config import load_jurisdiction_config
from bylaws.fidelity import verify_jurisdiction_text_fidelity
from bylaws.root import resolve_repo_root


def _load_clause_trees(jurisdiction_id: str, repo_root: Path) -> dict[str, dict]:
    docs_dir = repo_root / "data" / "processed" / jurisdiction_id / "documents"
    trees: dict[str, dict] = {}
    for p in sorted(docs_dir.glob("*.clauses.json")):
        doc_id = p.name.removesuffix(".clauses.json")
        trees[doc_id] = json.loads(p.read_text(encoding="utf-8"))
    return trees


def test_all_bengaluru_provisions_pass_page_text_fidelity() -> None:
    """Every structured provision across Greater Bengaluru and the 5 City Corporations traces to its cited page(s) or a recorded correction."""
    repo_root = resolve_repo_root()
    for jid in (
        "in-ka-bengaluru",
        "in-ka-bengaluru-south",
    ):
        cfg = load_jurisdiction_config(jid)
        trees = _load_clause_trees(jid, repo_root)
        assert trees, f"Expected structured clause trees for {jid}"
        report = verify_jurisdiction_text_fidelity(cfg, trees, repo_root=repo_root)
        assert report["provisions_checked"] > 1000
        assert report["editorial_insertions_removed"] >= 1
        assert report["site_notes_created"] >= 1
        assert report["ocr_corrections_applied"] >= 10
        assert report["unreadable_fragments_marked"] >= 3
        assert report["failures"] == [], (
            f"Text fidelity failures in {jid}: {report['failures'][:5]}"
        )


def test_fidelity_verifier_is_falsifiable_on_editorial_or_invented_words() -> None:
    """Falsifiability check: injecting non-source words into a provision fails `verify_jurisdiction_text_fidelity` and reports differing words."""
    repo_root = resolve_repo_root()
    cfg = load_jurisdiction_config("in-ka-bengaluru-south")
    trees = _load_clause_trees("in-ka-bengaluru-south", repo_root)
    mutated_trees = {"rmp2015-zr": copy.deepcopy(trees["rmp2015-zr"])}
    target = mutated_trees["rmp2015-zr"]["clauses"][5]
    target["versions"][0]["content"] = (
        str(target["versions"][0].get("content") or "")
        + " syntheticinventedwordxyz"
    )
    report = verify_jurisdiction_text_fidelity(cfg, mutated_trees, repo_root=repo_root)
    assert len(report["failures"]) >= 1
    assert any(
        "syntheticinventedwordxyz" in f["differing_words"]
        for f in report["failures"]
    )


def test_editorial_insertions_moved_to_notes_by_site_and_table_3_1_restored() -> None:
    """`bbl-2003` bye-laws `6.0(i)` and `1.4` contain only verbatim text with notes in `notes_by_site`, and `rmp2015-zr` 3.1 has a real table node."""
    repo_root = resolve_repo_root()
    bbl_south = json.loads(
        (
            repo_root
            / "data/processed/in-ka-bengaluru-south/documents/bbl-2003.clauses.json"
        ).read_text(encoding="utf-8")
    )
    by_eid_bbl = {c["eid"]: c for c in bbl_south["clauses"]}

    cl_1_4 = by_eid_bbl["part_I__sec_1.0__cl_1.4"]
    assert "published on the official GBA/BBMP" not in (cl_1_4.get("content") or "")
    assert "Inserted by UDD 14 TTP 2017" not in (cl_1_4.get("content") or "")
    assert cl_1_4.get("notes_by_site"), "Expected notes_by_site on bbl-2003 1.4"
    assert any("UDD 14 TTP 2017" in n for n in cl_1_4["notes_by_site"])

    cl_6_0_i = by_eid_bbl["part_II__sec_6.0__item_i"]
    for ver in cl_6_0_i.get("versions", []):
        v_txt = str(ver.get("content") or "")
        assert "up to 15% setback and coverage deviation" not in v_txt
        assert "Notification No: BSCC/Com/PR" not in v_txt
    assert cl_6_0_i.get("notes_by_site"), "Expected notes_by_site on bbl-2003 6.0(i)"

    rmp = json.loads(
        (
            repo_root
            / "data/processed/in-ka-bengaluru-south/documents/rmp2015-zr.clauses.json"
        ).read_text(encoding="utf-8")
    )
    by_eid_rmp = {c["eid"]: c for c in rmp["clauses"]}
    cl_3_1 = by_eid_rmp["chp_3__cl_3.1"]
    assert "Plot up to 60 sq.m (All uses): Front 0.75 m" not in cl_3_1["text"]
    assert "chp_3__cl_3.1__tbl_8" in by_eid_rmp
    tbl_8 = by_eid_rmp["chp_3__cl_3.1__tbl_8"]
    assert tbl_8["type"] == "table"
    assert tbl_8["table_meta"] is not None
    assert len(tbl_8["children"]) >= 3

    amend_2026 = json.loads(
        (
            repo_root
            / "data/processed/in-ka-bengaluru-south/documents/rmp2015-zr-amend-2026-01.clauses.json"
        ).read_text(encoding="utf-8")
    )
    by_eid_a26 = {c["eid"]: c for c in amend_2026["clauses"]}
    assert "item_2_2__item_b__tbl_8" in by_eid_a26
    a26_tbl8 = by_eid_a26["item_2_2__item_b__tbl_8"]
    assert a26_tbl8["type"] == "table"
    assert len(a26_tbl8["children"]) == 4


def test_ocr_corrections_unreadable_markers_and_gazette_headers_stripped() -> None:
    """OCR noise ('LL Dhl', 'M inimum') and gazette mailing headers are stripped or corrected with recorded provenance, and qa.md reports all counts."""
    repo_root = resolve_repo_root()
    trees = _load_clause_trees("in-ka-bengaluru", repo_root)

    corrected_nodes = []
    unreadable_nodes = []
    for doc_id, tree in trees.items():
        for c in tree["clauses"]:
            txt = str(c.get("text") or "")
            assert "LL Dhl" not in txt, f"Unstripped OCR noise 'LL Dhl' in {doc_id}:{c['eid']}"
            assert "M inimum" not in txt, f"Uncorrected 'M inimum' in {doc_id}:{c['eid']}"
            assert "To The Compiler, Karnataka Gazette" not in txt, (
                f"Unstripped gazette mailing header in {doc_id}:{c['eid']}"
            )
            if c.get("ocr_status") == "corrected":
                corrected_nodes.append(c)
                assert c.get("ocr_corrections"), f"Expected ocr_corrections list on {doc_id}:{c['eid']}"
                for oc in c["ocr_corrections"]:
                    assert oc.get("original_text")
                    assert oc.get("corrected_text")
                    assert oc.get("page") >= 1
                    assert oc.get("reason")
            elif c.get("ocr_status") == "unreadable_fragments":
                unreadable_nodes.append(c)
                assert "[unreadable in source]" in txt

    assert len(corrected_nodes) >= 10
    assert len(unreadable_nodes) >= 3

    qa_md = (repo_root / "data/reports/in-ka-bengaluru/qa.md").read_text(encoding="utf-8")
    assert "## 7. Text Fidelity & OCR Audit (Part 2)" in qa_md
    assert "| Provisions checked |" in qa_md
    assert "| Editorial insertions removed to `notes_by_site` |" in qa_md
    assert "| Separate site notes (`notes_by_site`) created |" in qa_md
    assert "| OCR corrections applied (`ocr_status: corrected`) |" in qa_md
    assert "| Unreadable source fragments marked (`[unreadable in source]`) |" in qa_md
    assert "| Untraceable provision text failures | 0 | PASS |" in qa_md
