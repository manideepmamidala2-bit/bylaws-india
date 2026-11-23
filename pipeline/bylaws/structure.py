"""Stage 8.4: Convert parser output into a validated clause tree."""

from __future__ import annotations

import click

from bylaws.config import JurisdictionConfig


def run_structure(config: JurisdictionConfig) -> None:
    """Build JSON clause trees for all parsed documents in a jurisdiction."""
    click.echo(f"[structure] Configured for jurisdiction '{config.id}'.")
