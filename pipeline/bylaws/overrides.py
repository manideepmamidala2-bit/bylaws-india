"""Stage 8.6: Apply committed manual corrections and zone tags from data/overrides/."""

from __future__ import annotations

import click

from bylaws.config import JurisdictionConfig


def run_apply_overrides(config: JurisdictionConfig) -> None:
    """Apply YAML override files for a jurisdiction."""
    click.echo(f"[apply-overrides] Configured for jurisdiction '{config.id}'.")
