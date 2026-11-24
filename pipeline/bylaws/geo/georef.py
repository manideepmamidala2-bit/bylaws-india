"""Stage 9.4: Printed-grid UTM 43N affine georeferencing, leave-one-out RMSE, and sheet overlay rendering."""

from __future__ import annotations

from pathlib import Path
from typing import Any

import click
import numpy as np
import pdfplumber
import pypdfium2 as pdfium
from pyproj import Transformer


def extract_pdf_grid_crosshairs(pdf_path: Path, page_number: int) -> list[tuple[float, float]]:
    """Extract exact vector `+` UTM grid crosshair coordinates `(pdf_x, pdf_y)` from a BDA RMP 2015 PDF sheet."""
    with pdfplumber.open(pdf_path) as pdf:
        if page_number < 1 or page_number > len(pdf.pages):
            raise click.ClickException(
                f"Page {page_number} out of range for '{pdf_path}' ({len(pdf.pages)} pages)."
            )
        page = pdf.pages[page_number - 1]
        v_lines = [
            ln for ln in page.lines if ln["width"] < 0.15 and 7.0 < ln["height"] < 10.0
        ]
        h_lines = [
            ln for ln in page.lines if ln["height"] < 0.15 and 3.2 < ln["width"] < 5.5
        ]
        crosses: list[tuple[float, float]] = []
        for v_ln in v_lines:
            vx = 0.5 * (float(v_ln["x0"]) + float(v_ln["x1"]))
            vy = 0.5 * (float(v_ln["top"]) + float(v_ln["bottom"]))
            matching_h = [
                h_ln
                for h_ln in h_lines
                if abs(0.5 * (float(h_ln["top"]) + float(h_ln["bottom"])) - vy) < 0.5
                and (abs(float(h_ln["x0"]) - vx) < 0.5 or abs(float(h_ln["x1"]) - vx) < 0.5)
            ]
            if len(matching_h) >= 2:
                hy = sum(
                    0.5 * (float(h_ln["top"]) + float(h_ln["bottom"]))
                    for h_ln in matching_h
                ) / len(matching_h)
                crosses.append((round(vx, 4), round(hy, 4)))

    unique_crosses = sorted(
        set(crosses),
        key=lambda pt: (round(pt[1], 1), round(pt[0], 1)),
    )
    return unique_crosses


def compute_loo_rmse(gcps: list[dict[str, Any]]) -> dict[str, Any]:
    """Fit a 6-parameter affine transform and compute residuals, overall RMSE, max residual, and leave-one-out RMSE."""
    if not gcps:
        raise NotImplementedError("not implemented: geo.georef")
    if len(gcps) < 4:
        raise ValueError(f"At least 4 GCPs are required for LOO affine evaluation; got {len(gcps)}.")

    mat_a = np.array([[float(g["pdf_x"]), float(g["pdf_y"]), 1.0] for g in gcps], dtype=float)
    e_obs = np.array([float(g["utm_e"]) for g in gcps], dtype=float)
    n_obs = np.array([float(g["utm_n"]) for g in gcps], dtype=float)

    coef_e, _, _, _ = np.linalg.lstsq(mat_a, e_obs, rcond=None)
    coef_n, _, _, _ = np.linalg.lstsq(mat_a, n_obs, rcond=None)

    e_pred = mat_a @ coef_e
    n_pred = mat_a @ coef_n
    residuals = np.hypot(e_pred - e_obs, n_pred - n_obs)
    rmse_m = float(np.sqrt(np.mean(residuals**2)))
    max_residual_m = float(np.max(residuals))

    loo_errors: list[float] = []
    enriched_gcps: list[dict[str, Any]] = []
    for i, g in enumerate(gcps):
        mask = np.ones(len(gcps), dtype=bool)
        mask[i] = False
        ce_i, _, _, _ = np.linalg.lstsq(mat_a[mask], e_obs[mask], rcond=None)
        cn_i, _, _, _ = np.linalg.lstsq(mat_a[mask], n_obs[mask], rcond=None)
        ei = float(mat_a[i] @ ce_i)
        ni = float(mat_a[i] @ cn_i)
        loo_err = float(np.hypot(ei - e_obs[i], ni - n_obs[i]))
        loo_errors.append(loo_err)
        enriched_gcps.append(
            {
                **g,
                "pred_e": round(float(e_pred[i]), 3),
                "pred_n": round(float(n_pred[i]), 3),
                "residual_m": round(float(residuals[i]), 4),
                "loo_error_m": round(loo_err, 4),
            }
        )

    loo_rmse_m = float(np.sqrt(np.mean(np.array(loo_errors, dtype=float) ** 2)))
    return {
        "gcp_count": len(gcps),
        "rmse_m": round(rmse_m, 4),
        "loo_rmse_m": round(loo_rmse_m, 4),
        "max_residual_m": round(max_residual_m, 4),
        "coef_e": [float(x) for x in coef_e],
        "coef_n": [float(x) for x in coef_n],
        "gcps": enriched_gcps,
    }


def fit_printed_grid_transform(
    pdf_path: Path,
    page_number: int,
    grid_eastings: list[float],
    grid_northings: list[float],
    *,
    target_crs: str = "EPSG:32643",
) -> dict[str, Any]:
    """Extract printed-grid crosshairs from `pdf_path` and fit an affine transform to `target_crs`."""
    crosses = extract_pdf_grid_crosshairs(pdf_path, page_number)
    expected_count = len(grid_eastings) * len(grid_northings)
    if len(crosses) != expected_count:
        raise click.ClickException(
            f"Expected {expected_count} grid crosshairs ({len(grid_eastings)}x{len(grid_northings)}) on page {page_number} of '{pdf_path}', found {len(crosses)}."
        )

    gcps: list[dict[str, Any]] = []
    idx = 0
    for n_val in grid_northings:
        for e_val in grid_eastings:
            px, py = crosses[idx]
            gcps.append(
                {
                    "id": f"grid_{round(e_val)}_{round(n_val)}",
                    "pdf_x": px,
                    "pdf_y": py,
                    "utm_e": float(e_val),
                    "utm_n": float(n_val),
                }
            )
            idx += 1

    fit = compute_loo_rmse(gcps)
    fit["target_crs"] = target_crs
    return fit


def pdf_xy_to_utm(
    pdf_x: float | np.ndarray,
    pdf_y: float | np.ndarray,
    georef_result: dict[str, Any],
) -> tuple[float | np.ndarray, float | np.ndarray]:
    """Apply the fitted 6-parameter affine transform to convert PDF `(x, y)` coordinates to UTM `(E, N)`."""
    ce = georef_result["coef_e"]
    cn = georef_result["coef_n"]
    utm_e = ce[0] * pdf_x + ce[1] * pdf_y + ce[2]
    utm_n = cn[0] * pdf_x + cn[1] * pdf_y + cn[2]
    return utm_e, utm_n


def render_sheet_overlay_png(
    pdf_path: Path,
    page_number: int,
    georef_result: dict[str, Any],
    output_png_path: Path,
    *,
    scale: float = 0.75,
) -> list[list[float]]:
    """Render the map frame of the PDF sheet to `output_png_path` and return its 4 WGS 84 corners `[tl, tr, br, bl]`."""
    with pdfplumber.open(pdf_path) as pdf:
        page = pdf.pages[page_number - 1]
        strips = [im for im in page.images if float(im["width"]) > 1500.0]
        if not strips:
            raise click.ClickException(
                f"No map raster strips found on page {page_number} of '{pdf_path}'."
            )
        strips.sort(key=lambda im: float(im["top"]))
        x0_frame = float(strips[0]["x0"])
        y0_frame = float(strips[0]["top"])
        x1_frame = float(strips[0]["x1"])
        y1_frame = float(strips[-1]["bottom"])

    doc = pdfium.PdfDocument(str(pdf_path))
    pdf_page = doc[page_number - 1]
    bitmap = pdf_page.render(scale=scale)
    pil_img = bitmap.to_pil()

    crop_box = (
        round(x0_frame * scale),
        round(y0_frame * scale),
        round(x1_frame * scale),
        round(y1_frame * scale),
    )
    cropped = pil_img.crop(crop_box).quantize(colors=128)
    output_png_path.parent.mkdir(parents=True, exist_ok=True)
    cropped.save(output_png_path, optimize=True)

    target_crs = str(georef_result.get("target_crs") or "EPSG:32643")
    to_wgs84 = Transformer.from_crs(target_crs, "EPSG:4326", always_xy=True)

    corners_pdf = [
        (x0_frame, y0_frame),  # top-left
        (x1_frame, y0_frame),  # top-right
        (x1_frame, y1_frame),  # bottom-right
        (x0_frame, y1_frame),  # bottom-left
    ]
    bounds_wgs84: list[list[float]] = []
    for px, py in corners_pdf:
        ue, un = pdf_xy_to_utm(px, py, georef_result)
        lon, lat = to_wgs84.transform(float(ue), float(un))
        bounds_wgs84.append([round(float(lon), 6), round(float(lat), 6)])

    return bounds_wgs84
