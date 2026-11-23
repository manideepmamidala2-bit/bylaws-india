"""Stage 8.8: Build manifest.json and publish processed datasets."""

from __future__ import annotations

import click

from bylaws.config import JurisdictionConfig


def run_publish(config: JurisdictionConfig, *, dry_run: bool = False) -> None:
    """Publish processed jurisdiction datasets and update manifest.json."""
    mode = "dry-run" if dry_run else "publish"
    click.echo(f"[publish:{mode}] Configured for jurisdiction '{config.id}'.")
