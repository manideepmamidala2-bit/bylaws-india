# ADR 001: PDF Parsers, Geospatial Stack, and Licensing Hygiene (Rule R4)

- **Date**: 2026-11-23
- **Status**: Accepted
- **Context**: Phase 1 Plan §2 (Rule R4 — Licensing hygiene), §8.2 (`parse`), §9 (`geo`)

## Context

The pipeline converts municipal bylaw PDFs (both digital-born and scanned gazette notifications) into structured clause trees and tables, and converts scanned PDF planning-district land-use maps into georeferenced GeoJSON zone polygons. Rule R4 mandates:

1. No code copied from AGPL-licensed projects (specifically excluding `Unstract` and `PyMuPDF` / `fitz`).
2. Preference for permissively licensed dependencies (`MIT`, `Apache-2.0`, `BSD`).
3. Any dependency with GPL, AGPL, or non-commercial model-weight restrictions (`Marker`, `MinerU`) must be explicitly evaluated and recorded before adoption.

## Decisions

### 1. PDF Parsing & Page Rendering Stack

| Component | Package | Licence | Role |
|-----------|---------|---------|------|
| Primary PDF Parser | `docling` | MIT | Default `ParserAdapter` implementation (`docling_adapter.py`) with built-in OCR and table structure recognition |
| Comparison PDF Parser | `pdfplumber` + `pypdfium2` | MIT / Apache-2.0 | Secondary `ParserAdapter` implementation (`pdfplumber_adapter.py`) for deterministic text/table extraction and side-by-side parser comparison (`bylaws compare`) without external API keys |
| Optional Hosted Comparison Adapter | `llmwhisperer` (HTTP API) | MIT client / Proprietary API | Optional comparison adapter when `LLMWHISPERER_API_KEY` is provided in `.env` |
| PDF Page Rasterizer | `pypdfium2` + `Pillow` | Apache-2.0 / BSD-3-Clause / MIT-CMU | Renders PDF pages to PNG images for parser comparison and map rasterization (`geo/rasterize.py`) |
| Synthetic Test PDF Generator | `fpdf2` | LGPL-3.0 (pure Python library import, no copied code) / `Pillow` | Generates deterministic synthetic PDFs for `_fixture-test` |

### 2. Prohibited / Excluded Packages

- **`PyMuPDF` (`fitz`)**: **Excluded** (AGPL-3.0). Replaced completely by `pypdfium2` (PDFium, Apache-2.0 / BSD-3-Clause).
- **`Unstract`**: **Excluded** (AGPL-3.0). Used only as a high-level conceptual reference for adapter separation.
- **`MinerU`**: **Excluded** due to AGPL licensing in upstream dependencies.
- **`Marker`**: **Deferred / Not adopted** in default dependencies because `surya` / model weights carry non-commercial restrictions in certain versions; `Docling` (MIT) + `pdfplumber`/`pypdfium2` (MIT/Apache-2.0) satisfy the two-parser comparison requirement under purely permissive licences.

### 3. Geospatial & Image Processing Stack

All map georeferencing and colour segmentation modules (`pipeline/bylaws/geo/`) use permissive open-source libraries:

- **`rasterio`** (BSD-3-Clause): GeoTIFF creation, affine/polynomial GCP transforms, and raster-to-polygon feature extraction.
- **`shapely`** (BSD-3-Clause) & **`geopandas`** (BSD-3-Clause) & **`pyogrio`** (MIT): KML/GeoJSON vector I/O, polygon clipping, containment checks, and area calculations.
- **`opencv-python-headless`** (Apache-2.0) & **`scikit-image`** (BSD-3-Clause) & **`numpy`** (BSD-3-Clause): CIELAB perceptual colour space conversion, morphological text/road noise removal, and pixel classification.

## Consequences

- Every dependency in `pipeline/pyproject.toml` and `web/package.json` is compatible with permissive open-source and commercial distribution.
- The entire pipeline and test suite can run offline in CI without requiring proprietary API keys.
