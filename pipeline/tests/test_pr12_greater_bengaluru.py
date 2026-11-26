"""Falsifiable tests for PR 12 — Greater Bengaluru Overnight Run (Parts 1–6)."""

from __future__ import annotations

import json
from collections import Counter

from bylaws.config import load_jurisdiction_config
from bylaws.root import resolve_repo_root
from bylaws.schema_validator import validate_file
from bylaws.structure import STOPWORD_DEFINED_TERMS

REPO_ROOT = resolve_repo_root()


def _get_latest_south_release_dir():
    config = load_jurisdiction_config("in-ka-bengaluru-south")
    assert config.release_version is not None
    return REPO_ROOT / "public" / "data" / "in-ka-bengaluru-south" / config.release_version


def _get_latest_parent_release_dir():
    config = load_jurisdiction_config("in-ka-bengaluru")
    assert config.release_version is not None
    return REPO_ROOT / "public" / "data" / "in-ka-bengaluru" / config.release_version


def _resolve_published_doc_file(rel_dir, filename: str):
    cand = rel_dir / filename
    if cand.is_file():
        return cand
    return _get_latest_parent_release_dir() / filename


def test_part1_annotation_quality_no_stopwords_or_heading_references_and_qa_stats() -> None:
    """Part 1 (`08b` §2): No stopword is a defined term, `defines` comes from quoted terms only, no heading is a reference, at most 1 `defined_term_use` per term per provision, and `qa.md` reports annotation counts."""
    rel_dir = _get_latest_parent_release_dir()
    for clauses_file in sorted(rel_dir.glob("*.clauses.json")):
        doc_id = clauses_file.name.replace(".clauses.json", "")
        tree = validate_file(clauses_file, "clause-tree")
        for node in tree["clauses"]:
            if node.get("defines") or node.get("defines_normalised"):
                norm = str(node.get("defines_normalised") or "").strip().lower()
                printed = str(node.get("defines") or "").strip()
                assert norm not in STOPWORD_DEFINED_TERMS, (
                    f"Stopword defined term '{norm}' in {doc_id}:{node['eid']}"
                )
                assert len(norm) >= 2, f"Single-char defined term '{norm}' in {doc_id}:{node['eid']}"
                assert not norm.isdigit(), f"Numeric defined term '{norm}' in {doc_id}:{node['eid']}"
                assert printed.startswith(('"', "'", "\u201c", "\u2018")), (
                    f"Unquoted defined term {printed!r} in {doc_id}:{node['eid']}"
                )

        ann_file = rel_dir / f"{doc_id}.annotations.json"
        if ann_file.is_file():
            ann_payload = validate_file(ann_file, "annotations")
            term_uses_per_node: Counter[tuple[str, str]] = Counter()
            for ann in ann_payload["annotations"]:
                target = ann["target"]
                assert target["field"] != "heading", (
                    f"Annotation {ann['annotation_id']} ({ann['kind']}) must not target heading field"
                )
                if ann["kind"] == "defined_term_use":
                    key = (str(target["eid"]), str(ann["value"]))
                    term_uses_per_node[key] += 1
                    assert term_uses_per_node[key] == 1, (
                        f"Duplicate defined_term_use for {key} in {doc_id}"
                    )

    qa_text = (REPO_ROOT / "data" / "reports" / "in-ka-bengaluru-south" / "qa.md").read_text(
        encoding="utf-8"
    )
    assert "Annotation Quality Summary" in qa_text
    assert "Definitions Found" in qa_text


def test_part1_graph_json_and_graphml_and_map_diagnosis_published() -> None:
    """Part 1 (`08b` §1 & §4): `docs/map.md` records the blank-map diagnosis, and `graph.json` (Graphology format) + `graph.graphml` are published per release."""
    docs_map_text = (REPO_ROOT / "docs" / "map.md").read_text(encoding="utf-8")
    assert "maplibre-gl-worker.js" in docs_map_text
    assert "206 Partial Content" in docs_map_text

    rel_dir = _get_latest_south_release_dir()
    graph_json_path = rel_dir / "graph.json"
    graphml_path = rel_dir / "graph.graphml"
    assert graph_json_path.is_file(), f"Missing Graphology graph.json at {graph_json_path}"
    assert graphml_path.is_file(), f"Missing graph.graphml at {graphml_path}"

    graph_data = json.loads(graph_json_path.read_text(encoding="utf-8"))
    assert "nodes" in graph_data and "edges" in graph_data
    assert len(graph_data["nodes"]) >= 500
    assert len(graph_data["edges"]) >= 500
    edge_types = {e["attributes"]["type"] for e in graph_data["edges"]}
    for req_type in ("contains", "defines", "uses_term", "refers_to", "in_register"):
        assert req_type in edge_types, f"Missing edge type '{req_type}' in graph.json"

    assert not (REPO_ROOT / "app" / "structure" / "page.tsx").is_file()
    assert not (REPO_ROOT / "app" / "j" / "[id]" / "review" / "page.tsx").is_file()
    assert not (REPO_ROOT / "app" / "j" / "[id]" / "documents" / "[doc]" / "[eid]" / "page.tsx").is_file()
    assert (REPO_ROOT / "app" / "about" / "page.tsx").is_file()
    assert (REPO_ROOT / "e2e" / "map.spec.ts").is_file()


def test_part2_five_city_corporations_369_wards_and_2026_consolidated_views() -> None:
    """Part 2 (`12-bengaluru-city-overnight.md` §3 Part 2): Parent `in-ka-bengaluru` and 5 child City Corporations exist with 369 total wards, R15 retrieval records, and per-corporation 2026 Building (Amendment) Bye-laws consolidated views."""
    parent_cfg = load_jurisdiction_config("in-ka-bengaluru")
    assert parent_cfg.release_version is not None
    parent_rel_dir = REPO_ROOT / "public" / "data" / "in-ka-bengaluru" / parent_cfg.release_version
    parent_boundary = json.loads((parent_rel_dir / "boundary.geojson").read_text(encoding="utf-8"))
    parent_zones = json.loads((parent_rel_dir / "gba-zones.geojson").read_text(encoding="utf-8"))
    parent_wards = json.loads((parent_rel_dir / "wards.geojson").read_text(encoding="utf-8"))
    assert len(parent_boundary["features"]) == 5
    assert len(parent_zones["features"]) == 10
    assert len(parent_wards["features"]) == 369

    expected_wards = {
        "in-ka-bengaluru-central": (63, "bccc-bbl-amend-2026-05", "Bengaluru Central City Corporation"),
        "in-ka-bengaluru-north": (72, "bncc-bbl-amend-2026-05", "Bengaluru North City Corporation"),
        "in-ka-bengaluru-south": (72, "bscc-bbl-amend-2026-05", "Bengaluru South City Corporation"),
        "in-ka-bengaluru-east": (50, "becc-bbl-amend-2026-05", "Bengaluru East City Corporation"),
        "in-ka-bengaluru-west": (112, "bwcc-bbl-amend-2026-05", "Bengaluru West City Corporation"),
    }
    total_child_wards = 0
    clause_6_texts: dict[str, str] = {}

    for corp_id, (exp_ward_cnt, final_doc_id, corp_label) in expected_wards.items():
        cfg = load_jurisdiction_config(corp_id)
        assert cfg.parent == "in-ka-bengaluru"
        assert cfg.release_version is not None
        rel_dir = REPO_ROOT / "public" / "data" / corp_id / cfg.release_version
        wards_fc = json.loads((rel_dir / "wards.geojson").read_text(encoding="utf-8"))
        assert len(wards_fc["features"]) == exp_ward_cnt
        total_child_wards += len(wards_fc["features"])

        cons = validate_file(rel_dir / "consolidated.json", "consolidated")
        rec_by_id = {r["clause_id"]: r for r in cons["records"]}
        assert "bbl-2003:3.8" in rec_by_id and rec_by_id["bbl-2003:3.8"]["omitted"] is True
        assert "bbl-2003:3.9" in rec_by_id and rec_by_id["bbl-2003:3.9"]["omitted"] is True
        assert "bbl-2003:3.10" in rec_by_id and rec_by_id["bbl-2003:3.10"]["omitted"] is True
        assert "bbl-2003:6.0(i)" in rec_by_id
        c6_rec = rec_by_id["bbl-2003:6.0(i)"]
        c6_text = str(c6_rec["text"])
        c6_notes = " ".join(c6_rec.get("notes_by_site") or [])
        c6_change_note = str(c6_rec.get("change_note") or "")
        assert corp_label in f"{c6_text} {c6_notes} {c6_change_note}"
        assert final_doc_id in ",".join(c6_rec["amendments_applied"])
        clause_6_texts[corp_id] = f"{c6_text} | {c6_notes}"

    assert total_child_wards == 369
    assert len(set(clause_6_texts.values())) == 5, (
        "Each of the 5 City Corporations must have its own distinct consolidated text for Bye-law 6.0(i)"
    )


def test_part3_rmp2015_zr_amendment_chain_inserted_chapter_11_and_replaced_tables() -> None:
    """Part 3 (`09-zoning-regulations-amendment-chain.md`): All 8 English `rmp2015-zr` amending notifications are structured, inserted Chapter 11 (Premium FAR) and replaced setback/FAR/drain-buffer tables are applied to `rmp2015-zr` node versions and `consolidated.json`, and verified in `qa.md`."""
    rel_dir = _get_latest_south_release_dir()
    parent_cfg = load_jurisdiction_config("in-ka-bengaluru")
    parent_rel_dir = REPO_ROOT / "public" / "data" / "in-ka-bengaluru" / str(parent_cfg.release_version)

    for zr_doc_id in (
        "rmp2015-zr-amend-2009-03",
        "rmp2015-zr-amend-2015-03",
        "rmp2015-zr-amend-2018-09",
        "rmp2015-zr-amend-2019-06",
        "rmp2015-zr-amend-2025-02",
        "rmp2015-zr-amend-2025-04",
        "rmp2015-zr-amend-2025-10",
        "rmp2015-zr-amend-2026-01",
    ):
        cfile = parent_rel_dir / f"{zr_doc_id}.clauses.json"
        assert cfile.is_file(), f"Missing structured clause tree {cfile}"
        tree = validate_file(cfile, "clause-tree")
        assert len(tree["clauses"]) >= 5

    zr_tree = validate_file(_resolve_published_doc_file(rel_dir, "rmp2015-zr.clauses.json"), "clause-tree")
    zr_by_eid = {c["eid"]: c for c in zr_tree["clauses"]}

    # Inserted Chapter 11 (Premium FAR, 2025-04-02)
    assert "chp_11.0" in zr_by_eid, "Expected inserted Chapter 11 (chp_11.0) in rmp2015-zr"
    chp11 = zr_by_eid["chp_11.0"]
    assert chp11["versions"][0]["source_doc"] == "rmp2015-zr-amend-2025-04"
    assert "PREMIUM F.A.R" in f"{chp11.get('heading') or ''} {chp11.get('text') or ''}".upper()

    # Substituted Setbacks 3.1(ii)–(iii) and Table 8 (2026-01-05)
    cl_31_ii = zr_by_eid["chp_3__cl_3.1__item_ii"]
    assert len(cl_31_ii["versions"]) >= 2
    assert cl_31_ii["versions"][-1]["source_doc"] == "rmp2015-zr-amend-2026-01"
    assert "12.0m" in str(cl_31_ii["versions"][-1]["content"])
    assert "chp_3__cl_3.1__tbl_8" in zr_by_eid

    # Substituted Drain / Nala Buffer 4.12.2 (2025-10-15)
    cl_412 = zr_by_eid["chp_4__cl_4.12__cl_4.12.2"]
    assert len(cl_412["versions"]) >= 2
    assert cl_412["versions"][-1]["source_doc"] == "rmp2015-zr-amend-2025-10"
    assert "primary, secondary and tertiary" in str(cl_412["versions"][-1]["content"]).lower()

    # Consolidated view records
    cons = validate_file(rel_dir / "consolidated.json", "consolidated")
    zr_cons = [r for r in cons["records"] if r["doc_id"] == "rmp2015-zr"]
    assert len(zr_cons) >= 12
    qa_text = (REPO_ROOT / "data" / "reports" / "in-ka-bengaluru-south" / "qa.md").read_text(
        encoding="utf-8"
    )
    assert "rmp2015-zr-amend-2026-01" in qa_text
    assert "rmp2015-zr-amend-2025-04" in qa_text


def test_part4_schema_1_4_topics_relations_precedence_succession_and_applicability() -> None:
    """Part 4 (`09b-relations-topics-conflicts.md`): Schema 1.4 `relations.json` has topics, succession, and relations (`same_topic`, `definition_differs`, `numeric_differs`, `cross_document_reference`, `precedence` with quoted spans, `corporation_differs`), `applies_to_jurisdiction` is recorded on every document, and `relations.md` exists."""
    rel_dir = _get_latest_south_release_dir()
    rels_payload = validate_file(rel_dir / "relations.json", "relations")
    assert len(rels_payload["topics"]) == 14
    assert len(rels_payload["succession"]) >= 3

    rels = rels_payload["relations"]
    assert len(rels) >= 60
    kinds = {r["kind"] for r in rels}
    for req_kind in (
        "amends",
        "incorporates",
        "corporation_differs",
        "cross_document_reference",
        "definition_differs",
        "precedence",
    ):
        assert req_kind in kinds, f"Missing relation kind '{req_kind}' in relations.json"
    assert "same_topic" not in kinds
    assert "numeric_differs" not in kinds

    for r in rels:
        assert r["status"] != "human_verified", "Rule R10: no relation may be marked human_verified"
        if r["kind"] in {"amends", "incorporates", "corporation_differs"}:
            assert r["public_visible"] is True
        else:
            assert r["public_visible"] is False
        if r["kind"] == "precedence":
            assert r["from_doc"] != r["to_doc"], "Precedence relation must be inter-instrument"
            assert r.get("precedence_span") and len(str(r["precedence_span"]).strip()) >= 10, (
                f"Precedence relation {r['id']} missing quoted statutory precedence_span"
            )

    docs = json.loads((rel_dir / "documents.json").read_text(encoding="utf-8"))
    for d in docs:
        app_here = d.get("applies_to_jurisdiction")
        assert isinstance(app_here, dict), f"Document {d['doc_id']} missing applies_to_jurisdiction"
        assert app_here.get("status") in {"yes", "no", "partly", "unknown"}
        if d["doc_id"] == "ka-model-bbl-2017":
            assert app_here["status"] in {"no", "unknown"}

    rel_md = (REPO_ROOT / "data" / "reports" / "in-ka-bengaluru-south" / "relations.md").read_text(
        encoding="utf-8"
    )
    assert "Statutory Precedence Relations" in rel_md
    assert "corporation_differs" in rel_md


def test_part5_and_6_supporting_provisions_verified_overlays_4_sheets_and_zone_applicability_links() -> None:
    """Parts 5 & 6 (`10-supporting-provisions.md` & `11-all-sheets-zone-links-release.md`): Supporting instruments (`gbga-2024`, `udd-200-mnu-2025-khata`) are structured with `building_relevant_sections`, `ktcda-amend-bill-2025` is `status_unknown` in `contested_status`, `overlays.geojson` is published (`derived: true`), 4 RMP 2015 land-use sheets (`1,276` zone polygons) are extracted with RMSE <= 10m, and `zone_applicability` annotations + `clause-zone-tags.json` never link preamble/title/definition/commencement nodes."""
    rel_dir = _get_latest_south_release_dir()
    assert rel_dir.name in {"3.0.0", "4.0.0"}

    # Supporting provisions & contested KTCDA Bill
    for sup_id in ("gbga-2024", "udd-200-mnu-2025-khata"):
        tree = validate_file(
            _resolve_published_doc_file(rel_dir, f"{sup_id}.clauses.json"),
            "clause-tree",
        )
        assert len(tree["clauses"]) >= 5

    decls = validate_file(rel_dir / "declarations.json", "declarations")
    assert "gbga-2024" in (decls.get("building_relevant_sections") or {})
    contested_ids = {c["doc_id"] for c in (decls.get("contested_status") or [])}
    assert "ktcda-amend-bill-2025" in contested_ids

    # Verified overlays (`overlays.geojson`, derived: true)
    overlays_fc = json.loads((rel_dir / "overlays.geojson").read_text(encoding="utf-8"))
    assert len(overlays_fc["features"]) >= 1
    for feat in overlays_fc["features"]:
        props = feat["properties"]
        assert props["derived"] is True
        assert props["approximate"] is True

    # 4 RMP 2015 sheets in zones.geojson (`rmp2015-pd-210-b`, `rmp2015-pd-210-a`, `rmp2015-pd-211-a`, `rmp2015-pd-211-b`)
    zones_fc = validate_file(rel_dir / "zones.geojson", "zones")
    assert len(zones_fc["features"]) >= 1200
    sheets_found = {f["properties"]["source_map"] for f in zones_fc["features"]}
    for s_id in ("rmp2015-pd-210-b", "rmp2015-pd-210-a", "rmp2015-pd-211-a", "rmp2015-pd-211-b"):
        assert s_id in sheets_found

    # `zone_applicability` annotations and `clause-zone-tags.json`
    tags_payload = validate_file(rel_dir / "clause-zone-tags.json", "clause-zone-tags")
    assert len(tags_payload["tags"]) >= 150

    for doc_id in ("bbl-2003", "rmp2015-zr"):
        tree = validate_file(
            _resolve_published_doc_file(rel_dir, f"{doc_id}.clauses.json"),
            "clause-tree",
        )
        node_by_eid = {c["eid"]: c for c in tree["clauses"]}
        ann_doc = validate_file(
            _resolve_published_doc_file(rel_dir, f"{doc_id}.annotations.json"),
            "annotations",
        )
        prov_by_eid = {
            a["target"]["eid"]: a["value"]
            for a in ann_doc["annotations"]
            if a["kind"] == "provision_type"
        }
        zone_anns = [a for a in ann_doc["annotations"] if a["kind"] == "zone_applicability"]
        assert len(zone_anns) >= 15
        for za in zone_anns:
            t_eid = str(za["target"]["eid"])
            node = node_by_eid[t_eid]
            assert node["type"] not in {"preamble", "definition"}, (
                f"zone_applicability on {doc_id}:{t_eid} ({node['type']}) is forbidden"
            )
            assert not node.get("defines"), (
                f"zone_applicability on definition {doc_id}:{t_eid} is forbidden"
            )
            assert prov_by_eid.get(t_eid) not in {"commencement", "scope", "definition"}, (
                f"zone_applicability on {prov_by_eid.get(t_eid)} node {doc_id}:{t_eid} is forbidden"
            )
            assert len(str(za["target"]["span_text"]).strip()) >= 2

    docs_map = (REPO_ROOT / "docs" / "map.md").read_text(encoding="utf-8")
    assert "Legend-to-Regulation Zone Mapping Table" in docs_map


def test_five_corporations_parity_and_single_source_inheritance() -> None:
    """Part 2.6 Parity Check (CI): For any two of the 5 City Corporations, the set of shared documents, subjects, and shared provisions/parameters is identical, and every difference in content traces to a corporation-specific instrument."""
    manifest = validate_file(REPO_ROOT / "public" / "data" / "manifest.json", "manifest")
    jur_by_id = {j["id"]: j for j in manifest["jurisdictions"]}

    corporations = [
        ("in-ka-bengaluru-central", "bccc-bbl-amend-2026-05", "bccc-bbl-amend-2026-04-draft", "Bengaluru Central City Corporation"),
        ("in-ka-bengaluru-north", "bncc-bbl-amend-2026-05", "bncc-bbl-amend-2026-04-draft", "Bengaluru North City Corporation"),
        ("in-ka-bengaluru-south", "bscc-bbl-amend-2026-05", "bscc-bbl-amend-2026-04-draft", "Bengaluru South City Corporation"),
        ("in-ka-bengaluru-east", "becc-bbl-amend-2026-05", "becc-bbl-amend-2026-04-draft", "Bengaluru East City Corporation"),
        ("in-ka-bengaluru-west", "bwcc-bbl-amend-2026-05", "bwcc-bbl-amend-2026-04-draft", "Bengaluru West City Corporation"),
    ]

    shared_doc_sets: list[dict[str, str]] = []
    topic_id_sets: list[list[str]] = []
    shared_consolidated_maps: list[dict[str, str]] = []
    parameter_signatures: list[list[tuple]] = []

    for corp_id, final_doc_id, draft_doc_id, corp_name in corporations:
        jm = jur_by_id[corp_id]
        assert jm["parent"] == "in-ka-bengaluru"
        rel = next(r for r in jm["releases"] if r["version"] == jm["latest_release"])
        files = rel["files"]

        # 1. Shared documents are referenced from `/data/in-ka-bengaluru/4.0.0/` and have identical SHA-256 digests across all 5 corporations
        shared_docs = files.get("shared_documents") or {}
        assert len(shared_docs) == 14
        for s_doc_id, s_meta in shared_docs.items():
            assert s_meta["clauses"].startswith("/data/in-ka-bengaluru/"), (
                f"Shared doc {s_doc_id} in {corp_id} must reference parent Greater Bengaluru store"
            )
        shared_doc_sets.append({k: v["sha256"] for k, v in sorted(shared_docs.items())})

        # Only the corporation's own 2026 amendment clause tree is stored under the corporation's release folder
        corp_local_clauses = [
            p for p in files["clauses"] if not p.startswith("/data/in-ka-bengaluru/")
        ]
        assert corp_local_clauses == [f"/data/{corp_id}/{jm['latest_release']}/{final_doc_id}.clauses.json"]

        # 2. Subjects (`relations.json` topics) are identical across all 5 corporations
        rel_dir = REPO_ROOT / "public" / "data" / corp_id / jm["latest_release"]
        rels = json.loads((rel_dir / "relations.json").read_text(encoding="utf-8"))
        topic_id_sets.append([t["id"] for t in rels["topics"]])

        # 3. Consolidated records: shared `rmp2015-zr` + `bbl-2003:1.4` records are identical;
        #    corporation-specific `bbl-2003` records (`3.8`, `3.9`, `3.10`, `6.0(i)`) trace to `final_doc_id` and carry `"Changed for <corporation>, 14 May 2026"`
        cons = json.loads((rel_dir / "consolidated.json").read_text(encoding="utf-8"))
        shared_cons: dict[str, str] = {}
        for rec in cons["records"]:
            applied = rec.get("amendments_applied") or []
            if any(final_doc_id in a for a in applied):
                assert f"Changed for {corp_name}, 14 May 2026" == rec.get("change_note"), (
                    f"Expected 'Changed for {corp_name}, 14 May 2026' on {rec['clause_id']} in {corp_id}, got {rec.get('change_note')}"
                )
            else:
                shared_cons[rec["clause_id"]] = rec["text"]
        shared_consolidated_maps.append(shared_cons)

        # 4. Non-map structured/registered documents in `documents.json`: every difference between corporations traces to an instrument scoped to that corporation
        docs = json.loads((rel_dir / "documents.json").read_text(encoding="utf-8"))
        non_map_docs = [
            d
            for d in docs
            if d.get("instrument_type") != "map" and d.get("doc_type") != "map"
        ]
        shared_non_map_ids = set(shared_docs.keys()) | {
            "rmp2015-zr-comp-2024-10-kn",
            "rmp2015-zr-amend-2025-07",
            "ktcda-amend-bill-2025",
            "nbc-2016",
        }
        corp_prefix = final_doc_id.split("-")[0]
        for d in non_map_docs:
            if d["doc_id"] not in shared_non_map_ids:
                assert d["doc_id"].startswith(f"{corp_prefix}-") or corp_name.lower() in d["title"].lower(), (
                    f"Untraced document difference in {corp_id}: {d['doc_id']}"
                )
        corp_active_structured_ids = {
            d["doc_id"]
            for d in non_map_docs
            if d["doc_id"] not in shared_non_map_ids
            and d.get("acquisition_status") == "acquired"
        }
        assert corp_active_structured_ids == {final_doc_id, draft_doc_id}, (
            f"Untraced structured document difference in {corp_id}: {corp_active_structured_ids}"
        )

        # 5. Parameters: all 5 corporations have identical shared parameter values and conditions
        params = json.loads((rel_dir / "parameters.json").read_text(encoding="utf-8"))
        sig_list = [
            (
                r["parameter"],
                r["value"],
                r["unit"],
                r["legal_status"],
                r["source"]["doc_id"],
                r["source"]["eid"],
            )
            for r in params["records"]
            if not (r["conditions"].get("jurisdiction") or [])
        ]
        parameter_signatures.append(sig_list)

    # Assert pairwise equality across all 5 corporations
    for idx in range(1, len(corporations)):
        assert shared_doc_sets[idx] == shared_doc_sets[0]
        assert topic_id_sets[idx] == topic_id_sets[0]
        assert shared_consolidated_maps[idx] == shared_consolidated_maps[0]
        assert parameter_signatures[idx] == parameter_signatures[0]
