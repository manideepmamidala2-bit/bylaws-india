"""Stage 9: Geospatial boundary processing, map georeferencing, zone extraction, and geo-layers registry."""

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
    """Execute the geospatial zoning map workflow and write `zones.geojson` + `geo-layers.json`."""
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
        if isinstance(zoning_cfg, TracedZoningMapConfig) or getattr(zoning_cfg, "kind", None) in {
            "traced",
            "vector_pdf",
            "grid_georeferenced_raster",
            "osm_gcp_raster",
        }:
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
        "schema_version": "1.2",
        "features": all_features,
    }
    zones_path = processed_dir / "zones.geojson"
    validate_payload(zones_payload, "zones", source=str(zones_path))
    zones_path.write_text(json.dumps(zones_payload, indent=2) + "\n", encoding="utf-8")

    # Build geo-layers.json registry
    layers: list[dict[str, Any]] = []
    for b_cfg in config.maps.boundaries:
        out_file = b_cfg.output_file or "boundary.geojson"
        b_file_path = processed_dir / out_file
        feat_count = 0
        if b_file_path.is_file():
            b_data = json.loads(b_file_path.read_text(encoding="utf-8"))
            feat_count = len(b_data.get("features") or [])
        layers.append(
            {
                "layer_id": b_cfg.id,
                "title": b_cfg.title or f"{config.name} Official Boundary ({b_cfg.id})",
                "kind": "official_boundary",
                "source": b_cfg.source_url,
                "method": "Official boundary polygon extraction (EPSG:4326)",
                "accuracy_m": 1.0,
                "derived": False,
                "file": out_file,
                "external_url": None,
                "feature_count": feat_count,
                "notes": None,
            }
        )

    if config.maps.zoning:
        active_zone_count = sum(
            1
            for f in all_features
            if f.get("properties", {}).get("superseded_by") is None
            and f.get("properties", {}).get("record_superseded_by") is None
        )
        first_zoning = config.maps.zoning[0]
        z_source = (
            first_zoning.source_url
            if isinstance(first_zoning, ImportedZoningMapConfig)
            else first_zoning.document
        )
        layers.append(
            {
                "layer_id": "master-plan-zones",
                "title": f"{config.name} Master Plan Land Use Zones",
                "kind": "master_plan_zone",
                "source": str(z_source),
                "method": "Master plan land-use zone extraction clipped to corporation boundary (EPSG:4326)",
                "accuracy_m": 5.0,
                "derived": True,
                "file": "zones.geojson",
                "external_url": None,
                "feature_count": active_zone_count,
                "notes": "Derived by this project from official master plan sheets/layers.",
            }
        )

    for ov_cfg in config.maps.overlays or []:
        layers.append(
            {
                "layer_id": ov_cfg.id,
                "title": ov_cfg.title,
                "kind": ov_cfg.kind,
                "source": ov_cfg.source,
                "method": ov_cfg.method,
                "accuracy_m": ov_cfg.accuracy_m,
                "derived": bool(ov_cfg.derived if ov_cfg.derived is not None else True),
                "file": "overlays.geojson" if ov_cfg.kind == "derived_overlay" else None,
                "external_url": ov_cfg.external_url,
                "feature_count": None,
                "notes": None,
            }
        )

    geo_layers_payload: dict[str, Any] = {
        "schema_version": "1.2",
        "jurisdiction": config.id,
        "layers": layers,
    }
    geo_layers_path = processed_dir / "geo-layers.json"
    validate_payload(geo_layers_payload, "geo-layers", source=str(geo_layers_path))
    geo_layers_path.write_text(
        json.dumps(geo_layers_payload, indent=2) + "\n",
        encoding="utf-8",
    )

    click.echo(
        f"[geo] Processed {len(all_features)} zone polygon(s) and {len(layers)} geo layer(s) for '{config.id}'."
    )
