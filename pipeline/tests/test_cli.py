"""Tests for `bylaws` CLI entry point and mandatory `--jurisdiction` enforcement (R1 / M0)."""

from __future__ import annotations

import pytest
from click.testing import CliRunner

from bylaws.cli import SUBCOMMANDS, main


def test_cli_help_lists_all_subcommands() -> None:
    runner = CliRunner()
    result = runner.invoke(main, ["--help"])
    assert result.exit_code == 0, result.output
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


@pytest.mark.parametrize("subcommand", SUBCOMMANDS)
def test_subcommand_accepts_fixture_jurisdiction(subcommand: str) -> None:
    runner = CliRunner()
    result = runner.invoke(main, [subcommand, "--jurisdiction", "_fixture-test"])
    assert result.exit_code == 0, result.output
    assert "_fixture-test" in result.output


def test_subcommand_with_nonexistent_jurisdiction_exits_nonzero() -> None:
    runner = CliRunner()
    result = runner.invoke(main, ["validate", "--jurisdiction", "missing-jurisdiction"])
    assert result.exit_code != 0
    assert "Jurisdiction config file not found" in result.output
