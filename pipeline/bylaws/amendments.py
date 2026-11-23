"""Stage 8.5: Detect amendment instructions and link amending clauses to targets."""

from __future__ import annotations

import click

from bylaws.config import JurisdictionConfig


def run_amendments(config: JurisdictionConfig) -> None:
    """Detect and link amendment clauses for a jurisdiction."""
    click.echo(f"[amendments] Configured for jurisdiction '{config.id}'.")
