"""Stage 9: Geospatial boundary processing, map georeferencing, and zone extraction."""

from __future__ import annotations

import click

from bylaws.config import JurisdictionConfig


def run_geo_pipeline(config: JurisdictionConfig) -> None:
    """Execute the geospatial zoning map workflow for a jurisdiction."""
    click.echo(
        f"[geo] Configured for jurisdiction '{config.id}' "
        f"({len(config.maps.zoning)} zoning maps)."
    )
