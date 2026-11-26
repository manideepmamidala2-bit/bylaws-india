"""Part 2 tests: Machine-enforced provision text fidelity, notes_by_site, real tables, OCR corrections, and page furniture."""

from __future__ import annotations

import copy
import json
from pathlib import Path

from bylaws.config import load_jurisdiction_config
from bylaws.fidelity import (
    _load_doc_page_token_sets,
    extract_word_tokens,
    verify_jurisdiction_text_fidelity,
)
from bylaws.root import resolve_repo_root


def _load_clause_trees(jurisdiction_id: str, repo_root: Path) -> dict[str, dict]:
    cfg = load_jurisdiction_config(jurisdiction_id)
    docs_dir = repo_root / "data" / "processed" / jurisdiction_id / "documents"
    trees: dict[str, dict] = {}
    if docs_dir.is_dir():
        for p in sorted(docs_dir.glob("*.clauses.json")):
            doc_id = p.name.removesuffix(".clauses.json")
            trees[doc_id] = json.loads(p.read_text(encoding="utf-8"))
    if trees:
        return trees

    # Fallback in CI where `public/data/` is pulled from storage and `data/processed/` is gitignored
    ver = str(cfg.release_version or "4.0.0")
    cand_dirs = [repo_root / "public" / "data" / jurisdiction_id / ver]
    if cfg.parent:
        cand_dirs.append(repo_root / "public" / "data" / cfg.parent / ver)
    for d in cand_dirs:
        if not d.is_dir():
            continue
        for p in sorted(d.glob("*.clauses.json")):
            doc_id = p.name.removesuffix(".clauses.json")
            if doc_id not in trees:
                trees[doc_id] = json.loads(p.read_text(encoding="utf-8"))
    return trees


def test_all_bengaluru_provisions_pass_page_text_fidelity() -> None:
    """Every structured provision across Greater Bengaluru and all 5 City Corporations traces to its cited page(s) or a recorded correction, and all 5 corporations' 2026 amendments pass structure gates."""
    import re

    repo_root = resolve_repo_root()
    date_token_re = re.compile(
        r"\d{1,2}[./-]\d{1,2}[./-]\d{2,4}|\d{4}[./-]\d{1,2}[./-]\d{1,2}"
    )

    for jid, amend_doc_id in (
        ("in-ka-bengaluru", None),
        ("in-ka-bengaluru-central", "bccc-bbl-amend-2026-05"),
        ("in-ka-bengaluru-north", "bncc-bbl-amend-2026-05"),
        ("in-ka-bengaluru-south", "bscc-bbl-amend-2026-05"),
        ("in-ka-bengaluru-east", "becc-bbl-amend-2026-05"),
        ("in-ka-bengaluru-west", "bwcc-bbl-amend-2026-05"),
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

        # Verify equal treatment of each corporation's 2026 amendment (Part 2.5)
        if amend_doc_id is not None:
            assert amend_doc_id in trees, f"Missing {amend_doc_id} in {jid}"
            am_tree = trees[amend_doc_id]
            active_nodes = [
                c
                for c in am_tree["clauses"]
                if not c.get("superseded_by") and not c.get("record_superseded_by")
            ]
            assert len(active_nodes) == 45, (
                f"{amend_doc_id} should have 45 active nodes, got {len(active_nodes)}"
            )
            seen_eids: set[str] = set()
            for node in active_nodes:
                eid = str(node["eid"])
                nat_num = str(node.get("native_number") or "")
                assert eid not in seen_eids, f"Duplicate eid {eid} in {amend_doc_id}"
                seen_eids.add(eid)
                assert not date_token_re.search(eid), f"Date-shaped eid {eid} in {amend_doc_id}"
                assert not date_token_re.search(nat_num), (
                    f"Date-shaped native_number {nat_num} in {amend_doc_id}"
                )
                assert len(eid.split("__")) <= 6, (
                    f"Excessive depth on {amend_doc_id}:{eid}"
                )


def test_fidelity_verifier_is_falsifiable_on_editorial_or_invented_words() -> None:
    """Planted-fault test (a): altering one word in a published provision fails `verify_jurisdiction_text_fidelity` against stored page text."""
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


def test_planted_fault_changed_cited_page_number_fails_ci() -> None:
    """Planted-fault test (b): changing one cited page number on a published provision makes `verify_jurisdiction_text_fidelity` fail in CI."""
    repo_root = resolve_repo_root()
    cfg = load_jurisdiction_config("in-ka-bengaluru-south")
    trees = _load_clause_trees("in-ka-bengaluru-south", repo_root)
    mutated_trees = {"rmp2015-zr": copy.deepcopy(trees["rmp2015-zr"])}
    target = next(
        c
        for c in mutated_trees["rmp2015-zr"]["clauses"]
        if c["eid"] == "chp_4__cl_4.1__cl_4.1.1"
    )
    # Shift cited page from p. 28 to p. 29 (adjacent page)
    target["citations"][0]["page"] = 29
    target["versions"][0]["citations"][0]["page"] = 29
    report = verify_jurisdiction_text_fidelity(cfg, mutated_trees, repo_root=repo_root)
    assert len(report["failures"]) >= 1
    assert any(
        f["eid"] == "chp_4__cl_4.1__cl_4.1.1" and f["pages"] == [29]
        for f in report["failures"]
    )


def test_planted_fault_missing_page_text_and_checksum_mismatch_fail_not_skip(
    tmp_path: Path,
) -> None:
    """Planted-fault test (c): missing stored page text for a cited page and PDF SHA-256 checksum mismatches fail `verify_jurisdiction_text_fidelity` (never skip)."""
    import gzip
    import shutil

    repo_root = resolve_repo_root()
    cfg = load_jurisdiction_config("in-ka-bengaluru-south")
    trees = _load_clause_trees("in-ka-bengaluru-south", repo_root)

    # 1. Missing stored page text for a cited page (e.g. page 999)
    mutated_trees = {"rmp2015-zr": copy.deepcopy(trees["rmp2015-zr"])}
    target = next(
        c
        for c in mutated_trees["rmp2015-zr"]["clauses"]
        if c["eid"] == "chp_4__cl_4.1__cl_4.1.1"
    )
    target["citations"][0]["page"] = 999
    target["versions"][0]["citations"][0]["page"] = 999
    report_missing_page = verify_jurisdiction_text_fidelity(
        cfg, mutated_trees, repo_root=repo_root
    )
    assert any(
        f["eid"] == "chp_4__cl_4.1__cl_4.1.1"
        and "Missing stored page text" in f["reason"]
        for f in report_missing_page["failures"]
    )

    # 2. Corrupted PDF SHA-256 checksum in `data/page_text/` in an isolated root without `data/interim/` or `data/raw/`
    iso_root = tmp_path / "ci_no_interim"
    shutil.copytree(repo_root / "data" / "page_text", iso_root / "data" / "page_text")
    shutil.copytree(repo_root / "data" / "overrides", iso_root / "data" / "overrides")
    shutil.copytree(repo_root / "jurisdictions", iso_root / "jurisdictions")
    pt_file = iso_root / "data" / "page_text" / "rmp2015-zr.pages.json.gz"
    with gzip.open(pt_file, "rt", encoding="utf-8") as gz:
        pt_payload = json.loads(gz.read())
    pt_payload["sha256"] = "0" * 64
    pt_file.write_bytes(
        gzip.compress(json.dumps(pt_payload).encode("utf-8"), compresslevel=9, mtime=0)
    )
    report_bad_sha = verify_jurisdiction_text_fidelity(
        cfg, {"rmp2015-zr": trees["rmp2015-zr"]}, repo_root=iso_root
    )
    assert any(
        f["doc_id"] == "rmp2015-zr"
        and f["eid"] == "<document_checksum>"
        and "SHA-256 mismatch" in f["reason"]
        for f in report_bad_sha["failures"]
    )


def test_editorial_insertions_moved_to_notes_by_site_and_table_3_1_restored() -> None:
    """`bbl-2003` bye-laws `6.0(i)` and `1.4` contain only verbatim text with notes in `notes_by_site`, and `rmp2015-zr` 3.1 has a real table node."""
    repo_root = resolve_repo_root()
    south_trees = _load_clause_trees("in-ka-bengaluru-south", repo_root)
    bbl_south = south_trees["bbl-2003"]
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
    south_cfg = load_jurisdiction_config("in-ka-bengaluru-south")
    south_ver = str(south_cfg.release_version or "4.0.0")
    cons_south = json.loads(
        (
            repo_root
            / "public"
            / "data"
            / "in-ka-bengaluru-south"
            / south_ver
            / "consolidated.json"
        ).read_text(encoding="utf-8")
    )
    cons_6_0_i = next(
        r for r in cons_south["records"] if r["clause_id"] == "bbl-2003:6.0(i)"
    )
    assert "up to 15% setback and coverage deviation" not in cons_6_0_i["text"]
    assert cl_6_0_i.get("notes_by_site") or cons_6_0_i.get("notes_by_site"), (
        "Expected notes_by_site on bbl-2003 6.0(i)"
    )

    rmp = south_trees["rmp2015-zr"]
    by_eid_rmp = {c["eid"]: c for c in rmp["clauses"]}
    cl_3_1 = by_eid_rmp["chp_3__cl_3.1"]
    assert "Plot up to 60 sq.m (All uses): Front 0.75 m" not in cl_3_1["text"]
    assert "chp_3__cl_3.1__tbl_8" in by_eid_rmp
    tbl_8 = by_eid_rmp["chp_3__cl_3.1__tbl_8"]
    assert tbl_8["type"] == "table"
    assert tbl_8["table_meta"] is not None
    assert len(tbl_8["children"]) >= 3

    amend_2026 = south_trees["rmp2015-zr-amend-2026-01"]
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


def test_home_page_far_story_excerpts_pass_verbatim_fidelity() -> None:
    """Every quoted legal excerpt in the 5-step FAR story on the home page matches its cited structured provision and source page verbatim."""
    repo_root = resolve_repo_root()
    cfg = load_jurisdiction_config("in-ka-bengaluru")
    trees = _load_clause_trees("in-ka-bengaluru", repo_root)

    def _slice_span(full_txt: str, start_anchor: str, end_anchor: str | None = None) -> str:
        norm = " ".join(full_txt.split())
        s_idx = norm.find(start_anchor)
        assert s_idx != -1, f"Missing start anchor {start_anchor!r}"
        if not end_anchor:
            return norm[s_idx:].strip()
        e_idx = norm.find(end_anchor, s_idx)
        assert e_idx != -1, f"Missing end anchor {end_anchor!r}"
        return norm[s_idx : e_idx + len(end_anchor)].strip()

    expected_steps = [
        (
            "Step 1 (2004 BBL 2003 9.2)",
            "bbl-2003",
            "part_III__sec_9.0__cl_9.2",
            "bbl-2003",
            21,
            "The set backs required on all the sides of building/s",
            "given below.",
        ),
        (
            "Step 2 (2007 RMP 2015 Table 10)",
            "rmp2015-zr",
            "chp_4__cl_4.1__cl_4.1.3__tbl_10",
            "rmp2015-zr",
            28,
            "Table 10: FAR and Ground Coverage in Residential (Main)",
            None,
        ),
        (
            "Step 3 (2017 Bye-law 1.4)",
            "bbl-2003",
            "part_I__sec_1.0__cl_1.4",
            "ka-model-bbl-2017",
            2,
            "All mandatory Master Plan or Zonal Regulations",
            None,
        ),
        (
            "Step 4 (2025 Chapter 11 Premium FAR)",
            "rmp2015-zr-amend-2025-04",
            "chp_11_2",
            "rmp2015-zr-amend-2025-04",
            2,
            "The Premium F.A.R by levy of premium charges is the additional F.A.R granted",
            "regulation 2 below.",
        ),
        (
            "Step 5 (Today Note 2 Combined FAR Cap)",
            "rmp2015-zr-amend-2025-04",
            "chp_11_2__note_2",
            "rmp2015-zr-amend-2025-04",
            3,
            "The maximum additional FAR allowed for a given building site",
            None,
        ),
    ]

    built_index_html = repo_root / ".next" / "server" / "app" / "index.html"
    built_html_txt = (
        built_index_html.read_text(encoding="utf-8")
        if built_index_html.is_file()
        else None
    )

    for step_label, tree_doc_id, eid, page_doc_id, page_num, s_anchor, e_anchor in expected_steps:
        tree = trees[tree_doc_id]
        node = next(
            (c for c in tree["clauses"] if c["eid"] == eid),
            None,
        )
        assert node is not None, f"Missing node {tree_doc_id}:{eid}"
        excerpt = _slice_span(str(node.get("text") or ""), s_anchor, e_anchor)
        assert len(excerpt) > 40

        if built_html_txt is not None:
            assert s_anchor in built_html_txt, (
                f"{step_label} anchor {s_anchor!r} missing from built index.html"
            )

        page_sets = _load_doc_page_token_sets(
            page_doc_id,
            cfg.id,
            parent_id=cfg.parent,
            repo_root=repo_root,
        )
        assert page_num in page_sets, f"Missing stored page {page_num} for {page_doc_id}"
        valid_tokens = page_sets[page_num]
        missing = [
            w for w in extract_word_tokens(excerpt) if w not in valid_tokens
        ]
        assert not missing, (
            f"{step_label} ({page_doc_id} p.{page_num}) has words not on source page: {missing}"
        )

    if built_html_txt is not None:
        # Part 3.3 & 3.4: verify 2017 and 2007 attributions and notes on built home page
        assert (
            "Building Bye-laws 2003, bye-law 1.4 (inserted by notification UDD 14 TTP 2017, 28 October 2017)"
            in built_html_txt
        )
        assert (
            "This notification also issued the Model Building Bye-laws, which do not otherwise apply in Bengaluru."
            in built_html_txt
        )
        assert "/j/in-ka-bengaluru/documents/bbl-2003#node-part_I__sec_1.0__cl_1.4" in built_html_txt
        assert "/j/in-ka-bengaluru/documents/ka-model-bbl-2017#node-chp_1__item_3" in built_html_txt
        assert (
            "Shown from Table 10&#x27;s own caption and column headings on p. 28"
            in built_html_txt
            or "Shown from Table 10's own caption and column headings on p. 28"
            in built_html_txt
        )


def test_part2_amended_provisions_cite_amending_instrument_page_and_preserve_previous_wording_citation() -> None:
    """One Build, Correct Citations Part 2: 3.1(ii), 3.1(iii), 3.10(i), 4.1.2(b), 4.1.2(c), 4.5, and 4.7 cite `rmp2015-zr-amend-2026-01` at the exact page where their wording appears (`p. 2`, `p. 2`, `p. 5`, `p. 5`, `p. 6`, `p. 6`, `p. 6`), while previous wording keeps its original `rmp2015-zr` citation (`p. 20`, `p. 24`, etc.), and every parameter table row is verified on its cited page."""
    import re

    repo_root = resolve_repo_root()
    cfg = load_jurisdiction_config("in-ka-bengaluru")
    trees = _load_clause_trees("in-ka-bengaluru", repo_root)
    report = verify_jurisdiction_text_fidelity(cfg, trees, repo_root=repo_root)
    assert report["parameter_rows_checked"] >= 300
    assert report["failures"] == []

    rmp_by_eid = {c["eid"]: c for c in trees["rmp2015-zr"]["clauses"]}

    expected_amended_pages = [
        ("chp_3__cl_3.1__item_ii", "rmp2015-zr-amend-2026-01", 2, 20, "12.0m"),
        ("chp_3__cl_3.1__item_iii", "rmp2015-zr-amend-2026-01", 2, 20, "Table 9 shall be referred"),
        ("chp_3__cl_3.9__item_iii", "rmp2015-zr-amend-2026-01", 3, 23, "minimum setback for the basement"),
        ("chp_3__cl_3.10__item_i", "rmp2015-zr-amend-2026-01", 5, 24, "2.0 m or setback whichever is less"),
        ("chp_4__cl_4.1__cl_4.1.2__item_b", "rmp2015-zr-amend-2026-01", 5, 28, "less than 9.0 m"),
        ("chp_4__cl_4.1__cl_4.1.2__item_c", "rmp2015-zr-amend-2026-01", 6, 28, "Ring III"),
        ("chp_4__cl_4.5", "rmp2015-zr-amend-2026-01", 6, 33, "10000 sq.m"),
        ("chp_4__cl_4.7", "rmp2015-zr-amend-2026-01", 6, 35, "INDUSTRIAL I (GENERAL)"),
    ]

    for eid, exp_am_doc, exp_am_page, exp_orig_page, exp_phrase in expected_amended_pages:
        node = rmp_by_eid[eid]
        vers = node["versions"]
        assert len(vers) >= 2, f"Expected >=2 versions on rmp2015-zr:{eid}"
        v_orig = vers[0]
        v_curr = vers[-1]
        assert v_orig["source_doc"] == "rmp2015-zr"
        assert v_orig["citations"][0]["page"] == exp_orig_page, (
            f"Expected original citation page {exp_orig_page} on rmp2015-zr:{eid}, got {v_orig['citations']}"
        )
        assert v_curr["source_doc"] == exp_am_doc
        assert v_curr["citations"][0]["page"] == exp_am_page, (
            f"Expected amending citation page {exp_am_page} on rmp2015-zr:{eid}, got {v_curr['citations']}"
        )
        assert exp_phrase.lower() in str(v_curr["content"]).lower()

    # Also verify built HTML for both city and North Setbacks pages
    for jur_id in ("in-ka-bengaluru", "in-ka-bengaluru-north"):
        setbacks_html_path = (
            repo_root / ".next" / "server" / "app" / "j" / jur_id / "topics" / "setbacks.html"
        )
        if setbacks_html_path.is_file():
            raw_html = setbacks_html_path.read_text(encoding="utf-8")
            clean_html = re.sub(r"<!--[\s\S]*?-->", "", raw_html)
            for target_eid, exp_page, exp_orig in (
                ("chp_3__cl_3.1__item_ii", 2, 20),
                ("chp_3__cl_3.1__item_iii", 2, 20),
                ("chp_3__cl_3.10__item_i", 5, 24),
            ):
                m = re.search(
                    rf"#node-{re.escape(target_eid)}(?:(?!<li\b)[\s\S])*?Technical address:\s*<code[^>]*>rmp2015-zr:{re.escape(target_eid)}</code>",
                    clean_html,
                )
                assert m is not None, f"Missing {target_eid} on {jur_id} Setbacks HTML"
                block = m.group(0)
                assert f"#page={exp_page}" in block, (
                    f"Expected #page={exp_page} on {target_eid} in {jur_id} Setbacks HTML"
                )
                assert f"p. {exp_orig}):" in block, (
                    f"Expected previous wording p. {exp_orig} on {target_eid} in {jur_id} Setbacks HTML"
                )

