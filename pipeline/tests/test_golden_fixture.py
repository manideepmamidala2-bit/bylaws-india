"""End-to-end offline vertical slice & golden snapshot tests for `xx-test-fixture` (Plan v1.1 §S2)."""

from __future__ import annotations

import hashlib
import json
import shutil
import zipfile
from pathlib import Path
from typing import Any

import click
import pytest
from click.testing import CliRunner

from bylaws.cli import main
from bylaws.config import load_jurisdiction_config
from bylaws.overrides import run_apply_overrides
from bylaws.root import resolve_repo_root, set_cli_root
from bylaws.validate import run_validate

REPO_ROOT = resolve_repo_root()
GOLDEN_DIR = REPO_ROOT / "pipeline" / "tests" / "golden" / "xx-test-fixture"


def _assert_json_approx_equal(actual: Any, expected: Any, path: str = "$") -> None:
    """Recursively compare JSON structures using `pytest.approx` for floating-point values."""
    if isinstance(expected, float) or isinstance(actual, float):
        assert actual == pytest.approx(expected, rel=1e-3, abs=1e-3), f"Float mismatch at {path}"
        return
    if isinstance(expected, dict):
        assert isinstance(actual, dict), f"Expected dict at {path}, got {type(actual).__name__}"
        assert set(actual.keys()) == set(expected.keys()), f"Key mismatch at {path}"
        for key in expected:
            _assert_json_approx_equal(actual[key], expected[key], f"{path}.{key}")
        return
    if isinstance(expected, list):
        assert isinstance(actual, list), f"Expected list at {path}, got {type(actual).__name__}"
        assert len(actual) == len(expected), f"Length mismatch at {path}: {len(actual)} != {len(expected)}"
        for idx, (act_item, exp_item) in enumerate(zip(actual, expected, strict=True)):
            _assert_json_approx_equal(act_item, exp_item, f"{path}[{idx}]")
        return
    assert actual == expected, f"Value mismatch at {path}: {actual!r} != {expected!r}"


def _prepare_isolated_root(tmp_path: Path) -> Path:
    """Create an isolated repo root with `bylaws.toml`, schemas, fixture config, and overrides."""
    isolated = tmp_path / "workspace"
    isolated.mkdir(parents=True, exist_ok=True)
    shutil.copy2(REPO_ROOT / "bylaws.toml", isolated / "bylaws.toml")
    shutil.copytree(REPO_ROOT / "schemas", isolated / "schemas")
    shutil.copytree(REPO_ROOT / "jurisdictions", isolated / "jurisdictions")
    shutil.copytree(
        REPO_ROOT / "data" / "overrides" / "xx-test-fixture",
        isolated / "data" / "overrides" / "xx-test-fixture",
    )
    shutil.copytree(
        REPO_ROOT / "pipeline" / "tests" / "fixtures",
        isolated / "pipeline" / "tests" / "fixtures",
    )
    return isolated


def test_run_all_xx_test_fixture_matches_golden_snapshots(tmp_path: Path) -> None:
    """`bylaws run-all --jurisdiction xx-test-fixture` succeeds offline and matches golden snapshots."""
    isolated_root = _prepare_isolated_root(tmp_path)
    runner = CliRunner()
    try:
        result = runner.invoke(
            main,
            ["--root", str(isolated_root), "run-all", "--jurisdiction", "xx-test-fixture"],
        )
    finally:
        set_cli_root(None)

    assert result.exit_code == 0, f"run-all failed:\n{result.output}"
    assert "[run-all] Completed all 8 stages for 'xx-test-fixture'." in result.output

    manifest_path = isolated_root / "public" / "data" / "manifest.json"
    assert manifest_path.is_file()
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    assert manifest["schema_version"] == "1.2"

    j_entry = next(j for j in manifest["jurisdictions"] if j["id"] == "xx-test-fixture")
    assert j_entry["aliases"] == ["Synthetic Fixture", "Test City"]
    rel = j_entry["releases"][0]

    # Every file referenced in manifest.json must exist under public/
    referenced_paths = [
        rel["download_zip"],
        rel["sha256sums"],
        rel["declarations"],
        rel["files"]["documents"],
        *rel["files"]["clauses"],
        rel["files"]["amendments"],
        rel["files"]["zones"],
        rel["files"]["boundary"],
        *rel["drafts"]["clauses"],
    ]
    for web_path in referenced_paths:
        disk_path = isolated_root / "public" / web_path.lstrip("/")
        assert disk_path.is_file(), f"Published file listed in manifest missing: {disk_path}"

    release_dir = isolated_root / "public" / "data" / "xx-test-fixture" / "0.1.0"

    # Verify SHA256SUMS matches actual files
    sha_lines = (release_dir / "SHA256SUMS").read_text(encoding="utf-8").strip().splitlines()
    assert len(sha_lines) >= 8
    for line in sha_lines:
        expected_sha, fname = line.split("  ", 1)
        actual_sha = hashlib.sha256((release_dir / fname).read_bytes()).hexdigest()
        assert actual_sha == expected_sha, f"SHA-256 mismatch for {fname}"

    # Verify zip contents
    zip_path = release_dir / "xx-test-fixture-0.1.0.zip"
    with zipfile.ZipFile(zip_path, "r") as zf:
        zip_names = set(zf.namelist())
        assert {
            "documents.json",
            "fixture-base-2020.clauses.json",
            "fixture-amend-2024.clauses.json",
            "fixture-draft-2026.clauses.json",
            "amendments.json",
            "zones.geojson",
            "boundary.geojson",
            "declarations.json",
        }.issubset(zip_names)

    # Compare against committed golden snapshots
    golden_files = (
        "fixture-base-2020.clauses.json",
        "fixture-amend-2024.clauses.json",
        "fixture-draft-2026.clauses.json",
        "amendments.json",
        "zones.geojson",
        "declarations.json",
    )
    for fname in golden_files:
        actual_data = json.loads((release_dir / fname).read_text(encoding="utf-8"))
        expected_data = json.loads((GOLDEN_DIR / fname).read_text(encoding="utf-8"))
        _assert_json_approx_equal(actual_data, expected_data, path=fname)

    # Verify Rule R9 immutability chain on clause 1.1 and zone z0002
    base_clauses = json.loads(
        (release_dir / "fixture-base-2020.clauses.json").read_text(encoding="utf-8")
    )["clauses"]
    c11_records = [c for c in base_clauses if c["clause_id"] == "fixture-base-2020:1.1"]
    assert len(c11_records) == 2
    v1_clause = next(c for c in c11_records if c["record_id"] == "fixture-base-2020:1.1@v1")
    v2_clause = next(c for c in c11_records if c["record_id"] == "fixture-base-2020:1.1@v2")
    assert v1_clause["title"] == "Short Title and Commencement"
    assert v1_clause["superseded_by"] == "fixture-base-2020:1.1@v2"
    assert v2_clause["supersedes"] == "fixture-base-2020:1.1@v1"
    assert v2_clause["superseded_by"] is None
    assert v2_clause["title"] == "Short Title, Extent and Commencement"

    zone_features = json.loads((release_dir / "zones.geojson").read_text(encoding="utf-8"))[
        "features"
    ]
    z2_records = [
        f for f in zone_features if f["properties"]["zone_id"] == "fixture-pd-01:z0002"
    ]
    assert len(z2_records) == 2
    v1_zone = next(
        f for f in z2_records if f["properties"]["record_id"] == "fixture-pd-01:z0002@v1"
    )
    v2_zone = next(
        f for f in z2_records if f["properties"]["record_id"] == "fixture-pd-01:z0002@v2"
    )
    assert v1_zone["properties"]["zone_label"] == "Mixed Use"
    assert v1_zone["properties"]["superseded_by"] == "fixture-pd-01:z0002@v2"
    assert v2_zone["properties"]["supersedes"] == "fixture-pd-01:z0002@v1"
    assert v2_zone["properties"]["superseded_by"] is None
    assert v2_zone["properties"]["zone_label"] == "Commercial and Mixed Use"


def test_apply_overrides_fails_on_missing_target_id(tmp_path: Path) -> None:
    """`apply-overrides` raises ClickException when an override references a missing ID (A-017)."""
    isolated_root = _prepare_isolated_root(tmp_path)
    runner = CliRunner()
    try:
        runner.invoke(
            main,
            ["--root", str(isolated_root), "acquire", "--jurisdiction", "xx-test-fixture"],
        )
        runner.invoke(
            main,
            ["--root", str(isolated_root), "parse", "--jurisdiction", "xx-test-fixture"],
        )
        runner.invoke(
            main,
            ["--root", str(isolated_root), "structure", "--jurisdiction", "xx-test-fixture"],
        )
        runner.invoke(
            main,
            ["--root", str(isolated_root), "geo", "--jurisdiction", "xx-test-fixture"],
        )
    finally:
        set_cli_root(None)

    bad_override = isolated_root / "data" / "overrides" / "xx-test-fixture" / "99-bad.yaml"
    bad_override.write_text(
        'schema_version: "1.2"\n'
        "clause_fixes:\n"
        "  - clause_id: fixture-base-2020:999.999\n"
        "    field: title\n"
        "    value: Missing\n"
        "    reason: Test missing target\n",
        encoding="utf-8",
    )

    config = load_jurisdiction_config(
        "xx-test-fixture",
        jurisdictions_dir=isolated_root / "jurisdictions",
        schemas_dir=isolated_root / "schemas",
    )
    with pytest.raises(click.ClickException, match="999.999"):
        run_apply_overrides(config, repo_root=isolated_root)


def test_validate_fails_on_draft_reference_from_in_force(tmp_path: Path) -> None:
    """`validate` fails with ClickException when an in-force clause references a draft clause (A-018)."""
    isolated_root = _prepare_isolated_root(tmp_path)
    runner = CliRunner()
    try:
        runner.invoke(
            main,
            ["--root", str(isolated_root), "run-all", "--jurisdiction", "xx-test-fixture"],
        )
    finally:
        set_cli_root(None)

    base_clauses_path = (
        isolated_root
        / "data"
        / "processed"
        / "xx-test-fixture"
        / "documents"
        / "fixture-base-2020.clauses.json"
    )
    tree = json.loads(base_clauses_path.read_text(encoding="utf-8"))
    tree["clauses"][0]["cross_references"] = ["fixture-draft-2026:D1.1"]
    base_clauses_path.write_text(json.dumps(tree, indent=2) + "\n", encoding="utf-8")

    config = load_jurisdiction_config(
        "xx-test-fixture",
        jurisdictions_dir=isolated_root / "jurisdictions",
        schemas_dir=isolated_root / "schemas",
    )
    with pytest.raises(click.ClickException, match="QA-9"):
        run_validate(config, repo_root=isolated_root)
