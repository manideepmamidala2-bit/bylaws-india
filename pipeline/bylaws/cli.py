"""CLI entry point for the building bylaws pipeline (`bylaws <command> --jurisdiction <id>`)."""

from __future__ import annotations

from collections.abc import Callable
from typing import ParamSpec, TypeVar

import click

from bylaws import (
    acquire as acquire_mod,
)
from bylaws import (
    amendments as amendments_mod,
)
from bylaws import (
    compare as compare_mod,
)
from bylaws import (
    geo as geo_mod,
)
from bylaws import (
    overrides as overrides_mod,
)
from bylaws import (
    publish as publish_mod,
)
from bylaws import (
    structure as structure_mod,
)
from bylaws import (
    validate as validate_mod,
)
from bylaws.config import (
    ConfigValidationError,
    JurisdictionConfig,
    load_jurisdiction_config,
)
from bylaws.parsers import run_parse_stage

P = ParamSpec("P")
R = TypeVar("R")

SUBCOMMANDS: tuple[str, ...] = (
    "acquire",
    "parse",
    "compare",
    "structure",
    "amendments",
    "apply-overrides",
    "validate",
    "geo",
    "publish",
)


def require_jurisdiction_option(func: Callable[P, R]) -> Callable[P, R]:
    """Attach the mandatory `--jurisdiction` option (Rule R1: required, no default)."""
    return click.option(
        "--jurisdiction",
        required=True,
        type=str,
        help="Target jurisdiction ID matching jurisdictions/<id>.yaml (required; no default).",
    )(func)


def _load_or_abort(jurisdiction: str) -> JurisdictionConfig:
    """Load the jurisdiction configuration or raise a ClickException on validation errors."""
    try:
        return load_jurisdiction_config(jurisdiction)
    except ConfigValidationError as exc:
        raise click.ClickException(str(exc)) from exc


@click.group(context_settings={"help_option_names": ["-h", "--help"]})
@click.version_option(package_name="bylaws")
def main() -> None:
    """Curated, versioned, machine-readable building bylaws pipeline."""


@main.command("acquire")
@require_jurisdiction_option
def acquire_cmd(jurisdiction: str) -> None:
    """Download raw documents and boundary layers with SHA-256 verification."""
    config = _load_or_abort(jurisdiction)
    acquire_mod.run_acquire(config)


@main.command("parse")
@require_jurisdiction_option
@click.option(
    "--parser",
    "parser_name",
    default="docling",
    show_default=True,
    help="Parser adapter name to execute.",
)
def parse_cmd(jurisdiction: str, parser_name: str) -> None:
    """Parse raw PDF documents into structured Markdown and tables."""
    config = _load_or_abort(jurisdiction)
    run_parse_stage(config, parser_name=parser_name)


@main.command("compare")
@require_jurisdiction_option
def compare_cmd(jurisdiction: str) -> None:
    """Generate a side-by-side parser comparison report for the jurisdiction."""
    config = _load_or_abort(jurisdiction)
    compare_mod.run_compare(config)


@main.command("structure")
@require_jurisdiction_option
def structure_cmd(jurisdiction: str) -> None:
    """Convert parsed Markdown and tables into a validated JSON clause tree."""
    config = _load_or_abort(jurisdiction)
    structure_mod.run_structure(config)


@main.command("amendments")
@require_jurisdiction_option
def amendments_cmd(jurisdiction: str) -> None:
    """Link amendment clauses to their target clauses in base documents."""
    config = _load_or_abort(jurisdiction)
    amendments_mod.run_amendments(config)


@main.command("apply-overrides")
@require_jurisdiction_option
def apply_overrides_cmd(jurisdiction: str) -> None:
    """Apply committed manual overrides and zone tags from data/overrides/<jurisdiction>/."""
    config = _load_or_abort(jurisdiction)
    overrides_mod.run_apply_overrides(config)


@main.command("validate")
@require_jurisdiction_option
def validate_cmd(jurisdiction: str) -> None:
    """Validate all jurisdiction schemas and generate the QA report."""
    config = _load_or_abort(jurisdiction)
    validate_mod.run_validate(config)


@main.command("geo")
@require_jurisdiction_option
def geo_cmd(jurisdiction: str) -> None:
    """Run boundary extraction, map rasterization, georeferencing, and zone extraction."""
    config = _load_or_abort(jurisdiction)
    geo_mod.run_geo_pipeline(config)


@main.command("publish")
@require_jurisdiction_option
@click.option(
    "--dry-run",
    is_flag=True,
    default=False,
    help="List files that would be published without uploading.",
)
def publish_cmd(jurisdiction: str, dry_run: bool) -> None:
    """Build release manifest and publish processed dataset to storage."""
    config = _load_or_abort(jurisdiction)
    publish_mod.run_publish(config, dry_run=dry_run)


if __name__ == "__main__":
    main()
