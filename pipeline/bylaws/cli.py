"""CLI entry point for the building bylaws pipeline (`bylaws <command> --jurisdiction <id>`)."""

from __future__ import annotations

from collections.abc import Callable

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
from bylaws.root import set_cli_root

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
    "run-all",
)


def require_jurisdiction_option[**P, R](func: Callable[P, R]) -> Callable[P, R]:
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
@click.option(
    "--root",
    "root_dir",
    type=click.Path(file_okay=False, dir_okay=True, path_type=str),
    default=None,
    help="Repository root directory containing bylaws.toml (overrides BYLAWS_ROOT).",
)
def main(root_dir: str | None = None) -> None:
    """Curated, versioned, machine-readable building bylaws pipeline."""
    set_cli_root(root_dir)


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
    default="pypdfium2",
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
    "--target",
    "target",
    type=click.Choice(["local", "blob"], case_sensitive=False),
    default=None,
    help="Publish destination ('local' or 'blob'; defaults to DATA_TARGET or 'local').",
)
@click.option(
    "--version",
    "release_version",
    default="0.1.0",
    show_default=True,
    help="Semantic version for the published release.",
)
@click.option(
    "--dry-run",
    is_flag=True,
    default=False,
    help="List files that would be published without uploading.",
)
def publish_cmd(
    jurisdiction: str,
    target: str | None,
    release_version: str,
    dry_run: bool,
) -> None:
    """Build release manifest and publish processed dataset to storage."""
    config = _load_or_abort(jurisdiction)
    publish_mod.run_publish(
        config,
        dry_run=dry_run,
        target=target,
        release_version=release_version,
    )


@main.command("run-all")
@require_jurisdiction_option
@click.option(
    "--parser",
    "parser_name",
    default="pypdfium2",
    show_default=True,
    help="Parser adapter name to execute during the parse stage.",
)
@click.option(
    "--target",
    "target",
    type=click.Choice(["local", "blob"], case_sensitive=False),
    default=None,
    help="Publish destination ('local' or 'blob'; defaults to DATA_TARGET or 'local').",
)
@click.option(
    "--version",
    "release_version",
    default="0.1.0",
    show_default=True,
    help="Semantic version for the published release.",
)
def run_all_cmd(
    jurisdiction: str,
    parser_name: str,
    target: str | None,
    release_version: str,
) -> None:
    """Run all pipeline stages in sequence (acquire -> parse -> structure -> amendments -> geo -> apply-overrides -> validate -> publish)."""
    config = _load_or_abort(jurisdiction)
    stages: list[tuple[str, Callable[[], None]]] = [
        ("acquire", lambda: acquire_mod.run_acquire(config)),
        ("parse", lambda: run_parse_stage(config, parser_name=parser_name)),
        ("structure", lambda: structure_mod.run_structure(config)),
        ("amendments", lambda: amendments_mod.run_amendments(config)),
        ("geo", lambda: geo_mod.run_geo_pipeline(config)),
        ("apply-overrides", lambda: overrides_mod.run_apply_overrides(config)),
        ("validate", lambda: validate_mod.run_validate(config)),
        (
            "publish",
            lambda: publish_mod.run_publish(
                config,
                target=target,
                release_version=release_version,
            ),
        ),
    ]
    for stage_name, fn in stages:
        try:
            fn()
        except click.ClickException as exc:
            raise click.ClickException(
                f"[run-all] Stage '{stage_name}' failed: {exc.format_message()}"
            ) from exc
        except Exception as exc:
            raise click.ClickException(
                f"[run-all] Stage '{stage_name}' failed: {exc}"
            ) from exc

    click.echo(f"[run-all] Completed all 8 stages for '{config.id}'.")


if __name__ == "__main__":
    main()
