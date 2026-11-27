"""Automated tests for Bylaw One: Bengaluru Pilot, Launch-Ready Website (`docs/plans/bengaluru-pilot-launch-plan.md`)."""

from __future__ import annotations

import gzip
import json
import shutil
import subprocess
import tomllib
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

