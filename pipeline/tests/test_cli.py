"""Tests for `bylaws` CLI entry point, `--root` discovery, and Rule R7 fail-loudly behavior."""

from __future__ import annotations

from pathlib import Path

import click
import pytest
import yaml
from click.testing import CliRunner

from bylaws.cli import SUBCOMMANDS, main
from bylaws.config import validate_jurisdiction_dict
from bylaws.geo import run_geo_pipeline
from bylaws.geo.gcp import load_or_resolve_gcps
from bylaws.geo.georef import compute_loo_rmse
from bylaws.geo.rasterize import rasterize_pdf_page
from bylaws.geo.verify import generate_map_verification_report
from bylaws.geo.zones import extract_zone_polygons
from bylaws.root import resolve_repo_root, set_cli_root

REPO_ROOT = resolve_repo_root()


def test_cli_help_lists_all_subcommands() -> None:
    runner = CliRunner()
    result = runner.invoke(main, ["--help"])
    assert result.exit_code == 0, result.output
    assert "run-all" in SUBCOMMANDS
    for subcommand in SUBCOMMANDS:
        assert subcommand in result.output


@pytest.mark.parametrize("subcommand", SUBCOMMANDS)
def test_subcommand_without_jurisdiction_fails_with_clear_error(subcommand: str) -> None:
    runner = CliRunner()
    result = runner.invoke(main, [subcommand])
    assert result.exit_code != 0
    assert "Missing option '--jurisdiction'" in result.output


@pytest.mark.parametrize("subcommand", SUBCOMMANDS)
def test_subcommand_has_no_default_for_jurisdiction(subcommand: str) -> None:
    cmd = main.commands[subcommand]
    jurisdiction_params = [param for param in cmd.params if param.name == "jurisdiction"]
    assert len(jurisdiction_params) == 1
    param = jurisdiction_params[0]
    assert param.required is True
    assert not isinstance(param.default, str)
    assert param.default is None or "UNSET" in repr(param.default)


def test_unimplemented_compare_exits_nonzero_with_not_implemented() -> None:
    runner = CliRunner()
    result = runner.invoke(main, ["compare", "--jurisdiction", "xx-test-fixture"])
    assert result.exit_code != 0
    assert "not implemented: compare" in result.output


def test_unimplemented_docling_parser_exits_nonzero_with_not_implemented() -> None:
    runner = CliRunner()
    result = runner.invoke(
        main,
        ["parse", "--jurisdiction", "xx-test-fixture", "--parser", "docling"],
    )
    assert result.exit_code != 0
    assert "not implemented: parse (docling)" in result.output


def test_unimplemented_traced_geo_exits_nonzero_with_not_implemented(tmp_path: Path) -> None:
    raw = yaml.safe_load(
        (REPO_ROOT / "jurisdictions" / "xx-test-fixture.yaml").read_text(encoding="utf-8")
    )
    raw["maps"]["zoning"] = [
        {
            "id": "fixture-pd-01-traced",
            "kind": "traced",
            "document": "fixture-map-atlas",
            "page": 1,
            "planning_district": "PD-01",
            "legend_page": 1,
        }
    ]
    config = validate_jurisdiction_dict(raw)

    processed_dir = tmp_path / "data" / "processed" / "xx-test-fixture"
    processed_dir.mkdir(parents=True, exist_ok=True)
    (processed_dir / "boundary.geojson").write_text(
        '{"type": "FeatureCollection", "features": []}',
        encoding="utf-8",
    )

    with pytest.raises(click.ClickException, match=r"not implemented: geo \(traced\)"):
        run_geo_pipeline(config, repo_root=tmp_path)


def test_unimplemented_geo_submodules_raise_not_implemented_error(tmp_path: Path) -> None:
    with pytest.raises(NotImplementedError, match="not implemented: geo.rasterize"):
        rasterize_pdf_page(tmp_path / "map.pdf", 1)
    with pytest.raises(NotImplementedError, match="not implemented: geo.gcp"):
        load_or_resolve_gcps("map-1", tmp_path)
    with pytest.raises(NotImplementedError, match="not implemented: geo.georef"):
        compute_loo_rmse([])
    with pytest.raises(NotImplementedError, match="not implemented: geo.verify"):
        generate_map_verification_report("xx-test-fixture", tmp_path / "out.md")
    with pytest.raises(NotImplementedError, match="not implemented: geo.zones"):
        extract_zone_polygons(tmp_path / "map.tif", [])


def test_resolve_repo_root_via_explicit_env_and_upward_walk(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    set_cli_root(None)
    monkeypatch.delenv("BYLAWS_ROOT", raising=False)

    fake_root = tmp_path / "repo"
    nested = fake_root / "a" / "b" / "c"
    nested.mkdir(parents=True)
    (fake_root / "bylaws.toml").write_text('[project]\nname = "bylaws-india"\n', encoding="utf-8")

    # 1. Upward directory walk
    assert resolve_repo_root(start_dir=nested) == fake_root.resolve()

    # 2. BYLAWS_ROOT env var
    monkeypatch.setenv("BYLAWS_ROOT", str(fake_root))
    assert resolve_repo_root(start_dir=tmp_path) == fake_root.resolve()
    monkeypatch.delenv("BYLAWS_ROOT")

    # 3. --root CLI override
    set_cli_root(fake_root)
    try:
        assert resolve_repo_root(start_dir=tmp_path) == fake_root.resolve()
    finally:
        set_cli_root(None)


def test_resolve_repo_root_raises_click_exception_when_marker_missing(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    set_cli_root(None)
    monkeypatch.delenv("BYLAWS_ROOT", raising=False)
    empty_dir = tmp_path / "outside"
    empty_dir.mkdir(parents=True)

    with pytest.raises(click.ClickException, match=r"Could not locate repository root \(bylaws\.toml\)"):
        resolve_repo_root(start_dir=empty_dir)


def test_subcommand_with_nonexistent_jurisdiction_exits_nonzero() -> None:
    runner = CliRunner()
    result = runner.invoke(main, ["validate", "--jurisdiction", "missing-jurisdiction"])
    assert result.exit_code != 0
    assert "Jurisdiction config file not found" in result.output
