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
    provenance as provenance_mod,
)
from bylaws import (
    publish as publish_mod,
)
from bylaws import (
    resolver as resolver_mod,
)
from bylaws import (
    structure as structure_mod,
)
from bylaws import (
    tasks as tasks_mod,
)
from bylaws import (
    validate as validate_mod,
)
from bylaws import (
    verify_records as verify_records_mod,
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
    "resolve",
    "run-all",
    "verify-sources",
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


@main.command("verify-sources")
@require_jurisdiction_option
def verify_sources_cmd(jurisdiction: str) -> None:
    """Refetch each acquired source for a jurisdiction and verify SHA-256 checksums."""
    config = _load_or_abort(jurisdiction)
    results = provenance_mod.verify_jurisdiction_sources(config)
    click.echo(
        f"[verify-sources] Checked {len(results)} source(s) for '{config.id}'."
    )


@main.command("check-provenance")
def check_provenance_cmd() -> None:
    """Run the R15/R16 provenance gate across all repository jurisdictions and files."""
    provenance_mod.check_repository_provenance()
    click.echo("[check-provenance] All non-test jurisdictions and files passed R15/R16 provenance checks.")


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


@main.command("resolve")
@require_jurisdiction_option
@click.option("--lat", type=float, default=None, help="Plot latitude (WGS 84).")
@click.option("--lon", type=float, default=None, help="Plot longitude (WGS 84).")
@click.option("--zone", "zone_code", type=str, default=None, help="Explicit land-use zone code.")
@click.option("--plot-area", "plot_area_m2", type=float, default=600.0, show_default=True, help="Plot area in m².")
@click.option("--road-width", "road_width_m", type=float, default=15.0, show_default=True, help="Abutting road width in m.")
@click.option("--depth", "plot_depth_m", type=float, default=None, help="Optional plot depth in m.")
@click.option("--width", "plot_width_m", type=float, default=None, help="Optional plot width in m.")
@click.option("--height", "building_height_m", type=float, default=None, help="Optional proposed building height in m.")
@click.option("--use", "use", type=str, default="residential", show_default=True, help="Building use category.")
@click.option("--date", "as_of_date", type=str, default="2026-11-25", show_default=True, help="Evaluation date (YYYY-MM-DD).")
def resolve_cmd(
    jurisdiction: str,
    lat: float | None,
    lon: float | None,
    zone_code: str | None,
    plot_area_m2: float,
    road_width_m: float,
    plot_depth_m: float | None,
    plot_width_m: float | None,
    building_height_m: float | None,
    use: str,
    as_of_date: str,
) -> None:
    """Deterministically resolve building parameters for a plot using the 6 statutory steps."""
    import json

    from bylaws.root import resolve_repo_root

    config = _load_or_abort(jurisdiction)
    root = resolve_repo_root()
    ver = str(config.release_version or "4.0.0")
    rel_dir = root / "public" / "data" / config.id / ver
    if not rel_dir.is_dir():
        rel_dir = root / "data" / "processed" / config.id

    def _read_opt_json(fname: str):
        p = rel_dir / fname
        return json.loads(p.read_text(encoding="utf-8")) if p.is_file() else None

    params_payload = _read_opt_json("parameters.json")
    if params_payload is None:
        raise click.ClickException(f"Missing parameters.json for '{config.id}'.")
    res_config = _read_opt_json("resolution.json") or resolver_mod.load_and_verify_resolution_config(
        config, repo_root=root
    )
    geo_info = resolver_mod.lookup_plot_geography(
        lat=lat,
        lon=lon,
        explicit_corporation_id=config.id,
        explicit_zone_code=zone_code,
        boundary_fc=_read_opt_json("boundary.geojson"),
        wards_fc=_read_opt_json("wards.geojson"),
        planning_districts_fc=_read_opt_json("planning-districts.geojson"),
        zones_fc=_read_opt_json("zones.geojson"),
        overlays_fc=_read_opt_json("overlays.geojson"),
    )
    resolved_zone = str(geo_info.get("zone_code") or zone_code or "unknown")
    result = resolver_mod.resolve_plot_parameters(
        parameters_payload=params_payload,
        resolution_config=res_config,
        corporation_id=config.id,
        zone_code=resolved_zone,
        plot_area_m2=plot_area_m2,
        road_width_m=road_width_m,
        plot_depth_m=plot_depth_m,
        plot_width_m=plot_width_m,
        building_height_m=building_height_m,
        use=use,
        as_of_date=as_of_date,
        consolidated_payload=_read_opt_json("consolidated.json"),
        geography=geo_info,
    )
    click.echo(json.dumps(result, indent=2))


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
    default=None,
    help="Optional semantic version override (defaults to release_version in jurisdiction YAML).",
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
    release_version: str | None,
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
    default=None,
    help="Optional semantic version override (defaults to release_version in jurisdiction YAML).",
)
def run_all_cmd(
    jurisdiction: str,
    parser_name: str,
    target: str | None,
    release_version: str | None,
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


@main.group("tasks")
def tasks_group() -> None:
    """Create and manage workshop verification task sets."""


@tasks_group.command("create")
@require_jurisdiction_option
@click.option(
    "--count",
    "count",
    type=int,
    required=True,
    help="Number of verification tasks to select.",
)
@click.option(
    "--subject",
    "subject",
    type=str,
    required=True,
    help="Subject slug or topic ID (e.g. far, setbacks, ground-coverage).",
)
@click.option(
    "--seed",
    "seed",
    type=int,
    required=True,
    help="Deterministic random seed for task sampling.",
)
@click.option(
    "--task-set-id",
    "task_set_id",
    type=str,
    default=None,
    help="Optional custom task-set identifier.",
)
@click.option(
    "--output-dir",
    "output_dir",
    type=click.Path(file_okay=False, dir_okay=True, path_type=str),
    default=None,
    help="Optional output directory for .html, .csv, and .json artifacts.",
)
def tasks_create_cmd(
    jurisdiction: str,
    count: int,
    subject: str,
    seed: int,
    task_set_id: str | None,
    output_dir: str | None,
) -> None:
    """Create a printable HTML task sheet, CSV, and JSON manifest for a workshop."""
    from pathlib import Path

    config = _load_or_abort(jurisdiction)
    out_path = Path(output_dir).resolve() if output_dir else None
    res = tasks_mod.create_verification_task_set(
        config,
        count=count,
        subject=subject,
        seed=seed,
        task_set_id=task_set_id,
        output_dir=out_path,
    )
    click.echo(
        f"[tasks:create] Created task set '{res['task_set_id']}' ({res['count']} tasks) -> "
        f"HTML: {res['html_path']}, CSV: {res['csv_path']}, JSON: {res['json_path']}"
    )


@main.group("verify")
def verify_group() -> None:
    """Import and inspect workshop verification responses."""


@verify_group.command("import")
@click.argument(
    "csv_file",
    type=click.Path(exists=True, file_okay=True, dir_okay=False, path_type=str),
)
@require_jurisdiction_option
def verify_import_cmd(csv_file: str, jurisdiction: str) -> None:
    """Import a completed workshop verification CSV into overrides (two-Match threshold)."""
    from pathlib import Path

    config = _load_or_abort(jurisdiction)
    res = verify_records_mod.import_verifications_csv(
        config,
        Path(csv_file).resolve(),
    )
    click.echo(
        f"[verify:import] Imported {res['imported_count']} verification(s) for '{config.id}' "
        f"(promoted to human_verified: {res['promoted_count']}, open review items: {res['mismatch_count']})."
    )


if __name__ == "__main__":
    main()
