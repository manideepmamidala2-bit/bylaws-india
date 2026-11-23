"""Stage 9.4: Affine/polynomial georeferencing and leave-one-out RMSE calculation."""

from __future__ import annotations


def compute_loo_rmse(gcps: list[dict]) -> dict[str, float]:
    """Placeholder interface for leave-one-out georeferencing error metrics (Milestone M6)."""
    _ = gcps
    raise NotImplementedError("not implemented: geo.georef")
