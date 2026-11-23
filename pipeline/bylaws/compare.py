"""Stage 8.3: Parser comparison report generator."""

from __future__ import annotations

import click

from bylaws.config import JurisdictionConfig


def run_compare(config: JurisdictionConfig) -> None:
    """Generate a side-by-side parser comparison report for a jurisdiction."""
    _ = config
    raise click.ClickException("not implemented: compare")
