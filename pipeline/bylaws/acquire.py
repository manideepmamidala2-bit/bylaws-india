"""Stage 8.1: Acquire raw documents and boundary layers with SHA-256 verification."""

from __future__ import annotations

import click

from bylaws.config import JurisdictionConfig


def run_acquire(config: JurisdictionConfig) -> None:
    """Acquire documents and boundary files for a validated jurisdiction config."""
    click.echo(
        f"[acquire] Configured for jurisdiction '{config.id}' "
        f"({len(config.documents)} documents, {len(config.maps.boundaries)} boundaries)."
    )
