"""Stage 9.3: Ground control point (GCP) resolution and geocoding."""

from __future__ import annotations

from pathlib import Path


def load_or_resolve_gcps(map_id: str, overrides_dir: Path) -> list[dict]:
    """Placeholder interface for loading curated GCPs and resolving coordinates (Milestone M6)."""
    _ = (map_id, overrides_dir)
    raise NotImplementedError("not implemented: geo.gcp")
