"""Automated tests for Bylaw One: Bengaluru Pilot, Launch-Ready Website (`docs/plans/bengaluru-pilot-launch-plan.md`)."""

from __future__ import annotations

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
