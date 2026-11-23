"""Repository root discovery via `--root`, `BYLAWS_ROOT`, or upward `bylaws.toml` search."""

from __future__ import annotations

import os
import urllib.parse
from pathlib import Path

import click

ROOT_MARKER = "bylaws.toml"
PACKAGE_REPO_ROOT = Path(__file__).resolve().parents[2]

_CLI_ROOT: Path | None = None


def set_cli_root(root: Path | str | None) -> None:
    """Record the `--root` CLI option for the active command invocation."""
    global _CLI_ROOT
    _CLI_ROOT = Path(root).resolve() if root is not None else None


def get_cli_root() -> Path | None:
    """Return the active `--root` CLI override, if any."""
    return _CLI_ROOT


def _validate_marker(candidate: Path) -> Path:
    resolved = candidate.expanduser().resolve()
    marker = resolved / ROOT_MARKER
    if not marker.is_file():
        raise click.ClickException(
            f"Could not locate repository root ({ROOT_MARKER}) in '{resolved}'. "
            "Pass --root or set BYLAWS_ROOT."
        )
    return resolved


def resolve_repo_root(
    explicit_root: Path | str | None = None,
    *,
    start_dir: Path | None = None,
) -> Path:
    """Resolve the repository root directory containing `bylaws.toml`.

    Resolution order:
    1. `explicit_root` argument (if passed directly)
    2. `--root` CLI option stored via `set_cli_root`
    3. `BYLAWS_ROOT` environment variable
    4. Upward directory walk from `start_dir` (defaults to `Path.cwd()`) for `bylaws.toml`
    """
    if explicit_root is not None:
        return _validate_marker(Path(explicit_root))

    if _CLI_ROOT is not None:
        return _validate_marker(_CLI_ROOT)

    env_root = os.environ.get("BYLAWS_ROOT", "").strip()
    if env_root:
        return _validate_marker(Path(env_root))

    current = (start_dir or Path.cwd()).expanduser().resolve()
    for directory in (current, *current.parents):
        if (directory / ROOT_MARKER).is_file():
            return directory

    raise click.ClickException(
        f"Could not locate repository root ({ROOT_MARKER}). Pass --root or set BYLAWS_ROOT."
    )


def resolve_local_source_path(source_url: str, repo_root: Path | None = None) -> Path:
    """Resolve a local path or `file://` URI for vector/map/document inputs."""
    root = repo_root or resolve_repo_root()
    if source_url.startswith("file://"):
        parsed = urllib.parse.urlparse(source_url)
        path = Path(urllib.parse.unquote(parsed.path))
        if path.is_file():
            return path
        raise click.ClickException(f"Source file not found: {path}")

    candidate = (root / source_url).resolve()
    if candidate.is_file():
        return candidate

    fallback = (PACKAGE_REPO_ROOT / source_url).resolve()
    if fallback.is_file():
        return fallback

    raise click.ClickException(
        f"Local source file '{source_url}' not found under '{root}'."
    )
