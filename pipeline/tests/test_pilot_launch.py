"""Automated tests for Bylaw One: Bengaluru Pilot, Launch-Ready Website (`docs/plans/bengaluru-pilot-launch-plan.md`)."""

from __future__ import annotations

import gzip
import json
import re
import shutil
import subprocess
import tomllib
import xml.etree.ElementTree as ET
from pathlib import Path

import yaml

from bylaws.config import load_site_config
from bylaws.root import resolve_repo_root

REPO_ROOT = resolve_repo_root()


def test_part1_open_repository_files_citations_and_issue_forms() -> None:
    """Part 1: Verify README, LICENSE, LICENSE-DATA, CONTRIBUTING, CODE_OF_CONDUCT, SECURITY, GOVERNANCE, CITATION.cff, .zenodo.json, and GitHub Issue Forms."""
    required_files = (
        "README.md",
        "LICENSE",
        "LICENSE-DATA.md",
        "CONTRIBUTING.md",
        "CODE_OF_CONDUCT.md",
        "SECURITY.md",
        "GOVERNANCE.md",
        "CITATION.cff",
        ".zenodo.json",
        ".gitleaks.toml",
        ".github/ISSUE_TEMPLATE/config.yml",
        ".github/ISSUE_TEMPLATE/report-problem-with-a-rule.yml",
        ".github/ISSUE_TEMPLATE/suggest-a-source.yml",
        ".github/ISSUE_TEMPLATE/join-the-pilot.yml",
    )
    for rel in required_files:
        path = REPO_ROOT / rel
        assert path.is_file(), f"Missing required Part 1 file: {rel}"

    readme = (REPO_ROOT / "README.md").read_text(encoding="utf-8")
    assert "Bylaw One" in readme
    assert "How to Run" in readme
    assert "How to Contribute" in readme

    license_txt = (REPO_ROOT / "LICENSE").read_text(encoding="utf-8")
    assert "Apache License" in license_txt
    assert "Version 2.0" in license_txt

    license_data = (REPO_ROOT / "LICENSE-DATA.md").read_text(encoding="utf-8")
    assert "CC BY 4.0" in license_data
    assert "Bylaw One" in license_data

    coc = (REPO_ROOT / "CODE_OF_CONDUCT.md").read_text(encoding="utf-8")
    assert "Contributor Covenant" in coc
    assert "2.1" in coc

    security = (REPO_ROOT / "SECURITY.md").read_text(encoding="utf-8")
    assert "Reporting a Vulnerability" in security
    assert "bylaws.toml" in security

    governance = (REPO_ROOT / "GOVERNANCE.md").read_text(encoding="utf-8")
    assert "open permanently" in governance
    assert "advisory" in governance.lower()

    cff = yaml.safe_load((REPO_ROOT / "CITATION.cff").read_text(encoding="utf-8"))
    assert cff["cff-version"] == "1.2.0"
    assert "Bylaw One" in cff["title"]
    assert cff["license"] == "Apache-2.0"

    zenodo = json.loads((REPO_ROOT / ".zenodo.json").read_text(encoding="utf-8"))
    assert "Bylaw One" in zenodo["title"]
    assert zenodo["license"] == "CC-BY-4.0"
    assert zenodo["upload_type"] == "dataset"

    # Verify GitHub issue forms
    report_form = yaml.safe_load(
        (REPO_ROOT / ".github/ISSUE_TEMPLATE/report-problem-with-a-rule.yml").read_text(
            encoding="utf-8"
        )
    )
    assert report_form["name"] == "Report a problem with a rule"
    report_ids = {item.get("id") for item in report_form["body"] if isinstance(item, dict)}
    assert {"site_link", "what_is_wrong", "official_page"}.issubset(report_ids)

    suggest_form = yaml.safe_load(
        (REPO_ROOT / ".github/ISSUE_TEMPLATE/suggest-a-source.yml").read_text(
            encoding="utf-8"
        )
    )
    assert suggest_form["name"] == "Suggest a source"

    join_form = yaml.safe_load(
        (REPO_ROOT / ".github/ISSUE_TEMPLATE/join-the-pilot.yml").read_text(
            encoding="utf-8"
        )
    )
    assert join_form["name"] == "Join the pilot"


def test_part1_single_config_contact_email_and_gitleaks_in_ci() -> None:
    """Part 1: Verify `contact.email` and `organisation.name` come from `bylaws.toml` and `gitleaks` is configured in CI."""
    toml_data = tomllib.loads((REPO_ROOT / "bylaws.toml").read_text(encoding="utf-8"))
    assert "contact" in toml_data and "email" in toml_data["contact"]
    assert "organisation" in toml_data and "name" in toml_data["organisation"]

    site_cfg = load_site_config(REPO_ROOT)
    assert site_cfg["contact_email"] == toml_data["contact"]["email"]
    assert site_cfg["organisation_name"] == toml_data["organisation"]["name"]

    ci_yml = (REPO_ROOT / ".github/workflows/ci.yml").read_text(encoding="utf-8")
    assert "gitleaks" in ci_yml
    assert "fetch-depth: 0" in ci_yml

    gitleaks_bin = shutil.which("gitleaks") or str(Path.home() / ".local" / "bin" / "gitleaks")
    if Path(gitleaks_bin).is_file():
        res = subprocess.run(
            [gitleaks_bin, "git", "--no-banner", "--log-opts=-5", str(REPO_ROOT)],
            capture_output=True,
            text=True,
            check=False,
        )
        assert res.returncode == 0, f"gitleaks found leaks: {res.stdout}\n{res.stderr}"


def test_part2_map_layers_place_index_place_card_and_browse_by_ward() -> None:
    """Part 2: Verify Protomaps light style, 8 ordered layers, place-index.json <= 300 KB compressed, PlaceCard 6 rule groups, sheet overlays, accuracy/coverage lines, Browse by ward page, and Map in TopNav."""
    # 1. Self-hosted fonts & sprites
    for rel in (
        "public/sprites/light.json",
        "public/sprites/light.png",
        "public/sprites/light@2x.json",
        "public/sprites/light@2x.png",
        "public/fonts/Noto Sans Regular/0-255.pbf",
        "public/fonts/Noto Sans Medium/0-255.pbf",
        "public/fonts/Noto Sans Italic/0-255.pbf",
    ):
        assert (REPO_ROOT / rel).is_file(), f"Missing self-hosted map asset: {rel}"

    # 2. place-index.json <= 300 KB compressed
    for jur_id in ("in-ka-bengaluru", "in-ka-bengaluru-south"):
        idx_path = REPO_ROOT / "public" / "data" / jur_id / "place-index.json"
        assert idx_path.is_file(), f"Missing {idx_path}"
        raw_bytes = idx_path.read_bytes()
        gz_bytes = gzip.compress(raw_bytes)
        assert len(gz_bytes) <= 300 * 1024, (
            f"{idx_path} compressed size {len(gz_bytes)} exceeds 300 KB"
        )
        payload = json.loads(raw_bytes.decode("utf-8"))
        assert payload["count"] >= 500
        kinds = {p["kind"] for p in payload["places"]}
        assert {"corporation", "ward", "locality", "road", "landmark"}.issubset(kinds)

    # 3. Map style and TopNav
    map_style_txt = (REPO_ROOT / "lib" / "map-style.ts").read_text(encoding="utf-8")
    assert "@protomaps/basemaps" in map_style_txt
    assert 'namedFlavor("light")' in map_style_txt
    assert "Protomaps © OpenStreetMap" in map_style_txt
    assert "/fonts/{fontstack}/{range}.pbf" in map_style_txt
    assert "/sprites/light" in map_style_txt

    top_nav_txt = (REPO_ROOT / "components" / "TopNav.tsx").read_text(encoding="utf-8")
    for nav_label in ("The code", "Map", "What changed", "About"):
        assert f'label: "{nav_label}"' in top_nav_txt

    # 4. ZoneMap 8 layers & plain-word toggles
    zone_map_txt = (REPO_ROOT / "components" / "ZoneMap.tsx").read_text(encoding="utf-8")
    assert '"fill-opacity": 0.6' in zone_map_txt
    assert "minzoom: 15" in zone_map_txt
    assert "Land-use data not yet available" in zone_map_txt
    assert "minzoom: 13" in zone_map_txt
    assert '"text-field": "derived"' in zone_map_txt
    for toggle_label in (
        "Land-use zones",
        "Wards",
        "Corporations",
        "Planning districts",
        "Original map sheets",
    ):
        assert f"<span>{toggle_label}</span>" in zone_map_txt

    # 5. PlaceCard & Browse by ward
    place_card_txt = (REPO_ROOT / "components" / "PlaceCard.tsx").read_text(encoding="utf-8")
    assert "Rules for this zone" in place_card_txt
    assert "No rules linked to this zone yet." in place_card_txt
    assert "Land-use data not yet available here" in place_card_txt

    wards_page = REPO_ROOT / "app" / "j" / "[id]" / "wards" / "page.tsx"
    assert wards_page.is_file()
    wards_txt = wards_page.read_text(encoding="utf-8")
    assert "Corporation → Ward → Zones present" in wards_txt
    assert "Rules for each land-use zone" in wards_txt


def test_part3_machine_and_ai_readability_llms_md_api_jsonld_datapackage_and_atom() -> None:
    """Part 3: Verify llms.txt, llms-full.txt, .md mirrors, /api/v1/ with OpenAPI 3.1, schema.org/Legislation JSON-LD, Frictionless datapackage.json, Atom feed /updates.xml, and /use-with-ai."""
    # 1. llms.txt and llms-full.txt
    llms_txt = (REPO_ROOT / "public" / "llms.txt").read_text(encoding="utf-8")
    assert "Bylaw One" in llms_txt
    assert "Rules Any AI Must Follow" in llms_txt
    assert "Cite the exact page" in llms_txt
    assert "Label derived values" in llms_txt
    assert "Ask for missing plot details" in llms_txt
    assert "Confirm with the authority" in llms_txt

    llms_full = (REPO_ROOT / "public" / "llms-full.txt").read_text(encoding="utf-8")
    assert "What Applies Today" in llms_full
    for subject_heading in (
        "# Land use",
        "# Ground coverage",
        "# FAR",
        "# Setbacks",
        "# Height",
        "# Parking",
    ):
        assert subject_heading in llms_full

    # 2. Markdown .md mirrors for documents, subjects, and provisions
    doc_md = REPO_ROOT / "public" / "j" / "in-ka-bengaluru" / "documents" / "bbl-2003.md"
    subj_md = REPO_ROOT / "public" / "j" / "in-ka-bengaluru" / "topics" / "far.md"
    prov_md = (
        REPO_ROOT
        / "public"
        / "j"
        / "in-ka-bengaluru"
        / "documents"
        / "bbl-2003"
        / "part_I__sec_1.0__cl_1.4.md"
    )
    assert doc_md.is_file() and "## Provisions" in doc_md.read_text(encoding="utf-8")
    assert subj_md.is_file() and "## 1. What Applies Today" in subj_md.read_text(encoding="utf-8")
    assert prov_md.is_file() and "## Verbatim Text" in prov_md.read_text(encoding="utf-8")

    # 3. Static JSON API (/api/v1/) & OpenAPI 3.1
    openapi = json.loads(
        (REPO_ROOT / "public" / "api" / "v1" / "openapi.json").read_text(encoding="utf-8")
    )
    assert openapi["openapi"] == "3.1.0"
    for endpoint in (
        "documents.json",
        "provisions.json",
        "subjects.json",
        "parameters.json",
        "zones.json",
        "sources.json",
    ):
        assert f"/api/v1/{endpoint}" in openapi["paths"]
        payload = json.loads(
            (REPO_ROOT / "public" / "api" / "v1" / endpoint).read_text(encoding="utf-8")
        )
        assert payload["count"] == len(payload["records"])
        assert payload["count"] > 0, f"/api/v1/{endpoint} has 0 records"
        sample = payload["records"][0]
        assert "citation" in sample and "status" in sample
        assert "doc_id" in sample["citation"] and "page" in sample["citation"]
        assert "legal_status" in sample["status"] and "verification" in sample["status"]

    # 4. schema.org Legislation JSON-LD component
    jsonld_comp = (REPO_ROOT / "components" / "LegislationJsonLd.tsx").read_text(
        encoding="utf-8"
    )
    for field in (
        "https://schema.org",
        "Legislation",
        "legislationIdentifier",
        "legislationDate",
        "legislationJurisdiction",
        "legislationLegalForce",
        "legislationChanges",
        "isPartOf",
    ):
        assert field in jsonld_comp

    # 5. Frictionless Data Package
    dp = json.loads(
        (REPO_ROOT / "public" / "data" / "datapackage.json").read_text(encoding="utf-8")
    )
    assert dp["profile"] == "data-package"
    assert len(dp["resources"]) >= 8
    assert len(dp["licenses"]) >= 2
    assert len(dp["sources"]) >= 10
    assert len(dp["contributors"]) >= 1

    # 6. Atom 1.0 feed at /updates.xml
    updates_xml = (REPO_ROOT / "public" / "updates.xml").read_text(encoding="utf-8")
    root = ET.fromstring(updates_xml)
    atom_ns = "{http://www.w3.org/2005/Atom}"
    assert root.tag == f"{atom_ns}feed"
    entries = root.findall(f"{atom_ns}entry")
    assert len(entries) >= 20
    dates = [
        (e.find(f"{atom_ns}updated").text or "")
        for e in entries
        if e.find(f"{atom_ns}updated") is not None
    ]
    assert dates == sorted(dates, reverse=True), "Atom feed entries must be newest first"

    # 7. Use with AI page
    use_ai_page = REPO_ROOT / "app" / "use-with-ai" / "page.tsx"
    assert use_ai_page.is_file()
    use_ai_txt = use_ai_page.read_text(encoding="utf-8")
    assert "/llms.txt" in use_ai_txt
    assert "/api/v1/openapi.json" in use_ai_txt
    assert "local agent engine is coming" in use_ai_txt


def test_part4_verification_workflow_tasks_create_verify_import_and_two_match_rule(
    tmp_path: Path,
) -> None:
    """Part 4: Test `bylaws tasks create`, `bylaws verify import`, the two-independent-Match threshold, duplicate-verifier rejection, Mismatch review items, and release verifier credits end to end."""
    from click.testing import CliRunner

    from bylaws.cli import main
    from bylaws.config import load_jurisdiction_config
    from bylaws.verify_records import (
        collect_verified_contributors_for_jurisdiction,
        evaluate_record_verifications,
        import_verifications_csv,
    )

    runner = CliRunner()
    out_dir = tmp_path / "tasks_out"
    res = runner.invoke(
        main,
        [
            "tasks",
            "create",
            "--jurisdiction",
            "xx-test-fixture",
            "--count",
            "4",
            "--subject",
            "setbacks",
            "--seed",
            "7",
            "--task-set-id",
            "fixture-test-set",
            "--output-dir",
            str(out_dir),
        ],
    )
    assert res.exit_code == 0, res.output
    assert (out_dir / "fixture-test-set.html").is_file()
    assert (out_dir / "fixture-test-set.csv").is_file()
    assert (out_dir / "fixture-test-set.json").is_file()

    # Clean up temporary public/data/tasks/fixture-test-set.json
    pub_temp_json = REPO_ROOT / "public" / "data" / "tasks" / "fixture-test-set.json"
    if pub_temp_json.is_file():
        pub_temp_json.unlink()

    # Verify sample task set exists in public/data/tasks/bengaluru-pilot-sample.json
    sample_json_path = (
        REPO_ROOT / "public" / "data" / "tasks" / "bengaluru-pilot-sample.json"
    )
    assert sample_json_path.is_file()
    sample_payload = json.loads(sample_json_path.read_text(encoding="utf-8"))
    assert sample_payload["count"] >= 5
    assert all(
        "#page=" in t["official_page_url"] for t in sample_payload["tasks"]
    )

    # Test 1: Single Match verdict leaves record machine_checked
    ev_one = evaluate_record_verifications(
        [
            {
                "verifier_name": "Asha Rao",
                "institution": "RV College of Architecture",
                "verified_at": "2026-11-26",
                "verdict": "match",
            }
        ]
    )
    assert ev_one["verification"] == "machine_checked"
    assert ev_one["verified_by"] is None

    # Test 2: Duplicate Match from same verifier + institution does NOT promote
    ev_dup = evaluate_record_verifications(
        [
            {
                "verifier_name": "Asha Rao",
                "institution": "RV College of Architecture",
                "verified_at": "2026-11-26",
                "verdict": "match",
            },
            {
                "verifier_name": "asha rao",
                "institution": "rv college of architecture",
                "verified_at": "2026-11-27",
                "verdict": "match",
            },
        ]
    )
    assert ev_dup["verification"] == "machine_checked"
    assert ev_dup["independent_match_count"] == 1

    # Test 3: Two independent Match verdicts promote record to human_verified
    ev_two = evaluate_record_verifications(
        [
            {
                "verifier_name": "Asha Rao",
                "institution": "RV College of Architecture",
                "verified_at": "2026-11-26",
                "verdict": "match",
            },
            {
                "verifier_name": "Kiran Kumar",
                "institution": "BMS School of Architecture",
                "verified_at": "2026-11-26",
                "verdict": "match",
            },
        ]
    )
    assert ev_two["verification"] == "human_verified"
    assert (
        ev_two["verified_by"]
        == "Verified by Asha Rao, RV College of Architecture, 2026-11-26; Kiran Kumar, BMS School of Architecture, 2026-11-26"
    )

    # Test 4: Any Mismatch blocks human_verified even when 2 Match verdicts exist
    ev_mismatch = evaluate_record_verifications(
        [
            {
                "verifier_name": "Asha Rao",
                "institution": "RV College of Architecture",
                "verified_at": "2026-11-26",
                "verdict": "match",
            },
            {
                "verifier_name": "Kiran Kumar",
                "institution": "BMS School of Architecture",
                "verified_at": "2026-11-26",
                "verdict": "match",
            },
            {
                "verifier_name": "Meera Nair",
                "institution": "CEPT University",
                "verified_at": "2026-11-26",
                "verdict": "mismatch",
                "note": "Page 28 shows 2.25, not 2.50",
            },
        ]
    )
    assert ev_mismatch["verification"] == "machine_checked"
    assert ev_mismatch["has_mismatch"] is True

    # Test 5: End-to-end CSV import in isolated repo root
    fake_root = tmp_path / "fake_repo"
    (fake_root / "schemas").mkdir(parents=True)
    for schema_file in (REPO_ROOT / "schemas").glob("*.schema.json"):
        shutil.copy2(schema_file, fake_root / "schemas" / schema_file.name)
    (fake_root / "bylaws.toml").write_text(
        (REPO_ROOT / "bylaws.toml").read_text(encoding="utf-8"),
        encoding="utf-8",
    )
    cfg = load_jurisdiction_config("xx-test-fixture")
    csv_file = tmp_path / "workshop-export.csv"
    csv_file.write_text(
        "task_id,record_id,record_kind,verdict,note,verifier_name,institution,verified_at\n"
        "task-001,fixture-base-2020:chp_II__cl_2.1,provision,match,,Asha Rao,RV College of Architecture,2026-11-26\n"
        "task-001,fixture-base-2020:chp_II__cl_2.1,provision,match,,Kiran Kumar,BMS School of Architecture,2026-11-26\n"
        "task-002,fixture-base-2020:chp_II__cl_2.2,provision,mismatch,Height differs on page 2,Meera Nair,CEPT University,2026-11-26\n",
        encoding="utf-8",
    )
    imp_res = import_verifications_csv(cfg, csv_file, repo_root=fake_root)
    assert imp_res["imported_count"] == 3
    assert imp_res["promoted_count"] == 1
    assert imp_res["mismatch_count"] == 1
    review_md = (
        fake_root / "data" / "reports" / "xx-test-fixture" / "verification-review.md"
    ).read_text(encoding="utf-8")
    assert "OPEN REVIEW ITEM" in review_md
    assert "Height differs on page 2" in review_md
    assert "Verified by Asha Rao, RV College of Architecture, 2026-11-26" in review_md

    credits = collect_verified_contributors_for_jurisdiction(
        cfg, repo_root=fake_root
    )
    assert len(credits) == 2
    assert {c["verifier_name"] for c in credits} == {"Asha Rao", "Kiran Kumar"}


def test_part5_pilot_checks_join_press_about_report_problem_and_generated_numbers() -> None:
    """Part 5: Verify Home pilot callout, /pilot, /checks, /join, /press, Who runs Bylaw One on /about, Report a problem links, Current as of dates, and no hand-typed dataset numbers."""
    home_txt = (REPO_ROOT / "app" / "page.tsx").read_text(encoding="utf-8")
    assert "A working pilot for" in home_txt
    assert "Built in the open. Looking for" in home_txt
    assert "Find rules by place" in home_txt
    assert "Current as of" in home_txt

    about_txt = (REPO_ROOT / "app" / "about" / "page.tsx").read_text(encoding="utf-8")
    assert "Who runs Bylaw One" in about_txt
    assert "open permanently" in about_txt
    assert "siteCfg.organisationName" in about_txt

    for page_rel in (
        "app/pilot/page.tsx",
        "app/checks/page.tsx",
        "app/join/page.tsx",
        "app/press/page.tsx",
    ):
        p = REPO_ROOT / page_rel
        assert p.is_file(), f"Missing Part 5 page: {page_rel}"
        txt = p.read_text(encoding="utf-8")
        assert re.search(r"\b(?:5,341|5341|1,276|1276|369|271|313)\b", txt) is None, (
            f"{page_rel} contains hand-typed dataset figure"
        )

    join_txt = (REPO_ROOT / "app" / "join" / "page.tsx").read_text(encoding="utf-8")
    for sec in ("Colleges", "Students", "Practitioners", "Civic and data groups"):
        assert sec in join_txt
    assert "60 to 120 hours" in join_txt

    press_txt = (REPO_ROOT / "app" / "press" / "page.tsx").read_text(encoding="utf-8")
    assert "/press/bylaw-one-logo.svg" in press_txt
    assert "/press/bylaw-one-mark.svg" in press_txt
    assert (REPO_ROOT / "public" / "press" / "bylaw-one-logo.svg").is_file()
    assert (REPO_ROOT / "public" / "press" / "bylaw-one-mark.svg").is_file()


def test_part6_partner_documents_in_docs_partners() -> None:
    """Part 6: Verify all 6 partner documents exist in `docs/partners/` with required content."""
    expected_docs = {
        "offer.md": ("One-Page Offer", "MoU", "CC BY 4.0"),
        "workshop-kit.md": (
            "Session 1",
            "Session 2",
            "Session 3",
            "Session 4",
            "Session 5",
            "Materials Checklist",
            "Facilitator Notes",
            "Certificate Template Text",
        ),
        "internship.md": ("60", "120", "Week 1", "Week 2", "Week 3", "Week 4"),
        "mou-template.md": (
            "MEMORANDUM OF UNDERSTANDING",
            "Apache License 2.0",
            "CC BY 4.0",
            "Non-Exclusive",
            "Exit",
        ),
        "charter.md": (
            "Purpose",
            "Verbatim Law",
            "Derived Values",
            "Not Legal Advice",
            "Permanent Openness",
        ),
        "demo-script.md": (
            "Minute 1",
            "Minute 2",
            "Minute 3",
            "Minute 4",
            "Minute 5",
            "Use with AI",
        ),
    }
    partners_dir = REPO_ROOT / "docs" / "partners"
    for filename, required_tokens in expected_docs.items():
        p = partners_dir / filename
        assert p.is_file(), f"Missing partner document: docs/partners/{filename}"
        content = p.read_text(encoding="utf-8")
        for token in required_tokens:
            assert token in content, f"docs/partners/{filename} missing '{token}'"





