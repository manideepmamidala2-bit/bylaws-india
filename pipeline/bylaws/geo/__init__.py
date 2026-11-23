"""Stage 9: Geospatial boundary processing, map georeferencing, and zone extraction."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import click

from bylaws.config import (
    ImportedZoningMapConfig,
    JurisdictionConfig,
    TracedZoningMapConfig,
)
from bylaws.geo.zones import import_zones_from_geojson
from bylaws.root import resolve_repo_root
from bylaws.schema_validator import validate_payload


def run_geo_pipeline(config: JurisdictionConfig, *, repo_root: Path | None = None) -> None:
    """Execute the geospatial zoning map workflow for a jurisdiction."""
    root = repo_root or resolve_repo_root()
    processed_dir = root / "data" / "processed" / config.id
    processed_dir.mkdir(parents=True, exist_ok=True)

    boundary_path = processed_dir / "boundary.geojson"
    if not boundary_path.is_file():
        raise click.ClickException(
            f"Boundary GeoJSON not found at '{boundary_path}'. Run `bylaws acquire` first."
        )
    boundary_geojson: dict[str, Any] = json.loads(boundary_path.read_text(encoding="utf-8"))

    all_features: list[dict[str, Any]] = []
    for zoning_cfg in config.maps.zoning:
        if isinstance(zoning_cfg, TracedZoningMapConfig) or getattr(zoning_cfg, "kind", None) == "traced":
            raise click.ClickException("not implemented: geo (traced)")
        if isinstance(zoning_cfg, ImportedZoningMapConfig):
            features = import_zones_from_geojson(zoning_cfg, boundary_geojson, root)
            all_features.extend(features)
        else:
            raise click.ClickException(
                f"Unsupported zoning map configuration kind: {getattr(zoning_cfg, 'kind', None)!r}"
            )

    zones_payload: dict[str, Any] = {
        "type": "FeatureCollection",
        "schema_version": "1.1",
        "features": all_features,
    }
    zones_path = processed_dir / "zones.geojson"
    validate_payload(zones_payload, "zones", source=str(zones_path))
    zones_path.write_text(json.dumps(zones_payload, indent=2) + "\n", encoding="utf-8")
    click.echo(
        f"[geo] Processed {len(all_features)} zone polygon(s) for '{config.id}'."
    )
