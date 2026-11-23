# Project Context

## Overview

`bylaws-india` is a curated, versioned, machine-readable dataset and web viewer for Indian building and municipal bylaws. It follows a strict two-half architecture (see `docs/plan.md`):

1. **Local Pipeline (`pipeline/`)**: A `uv`-managed Python CLI (`bylaws <command> --jurisdiction <id>`) that acquires source PDFs/maps, parses documents via swappable adapters, structures hierarchical clause trees, links amendments, georeferences zoning maps, applies committed YAML overrides, validates outputs against versioned JSON Schemas, and publishes releases.
2. **Read-Only Web Application (`web/`)**: A Next.js (App Router, TypeScript, Tailwind CSS, Leaflet / `react-leaflet`) frontend that reads published JSON/GeoJSON datasets from `manifest.json` (via `NEXT_PUBLIC_MANIFEST_URL` or local `/data/manifest.json` fallback) with zero server-side processing or hard-coded jurisdictions.

## Repository Layout

- `schemas/` — Versioned JSON Schema (Draft 2020-12) contracts (`jurisdiction`, `document`, `clause-tree`, `zones`, `overrides`, `manifest`).
- `jurisdictions/` — Per-jurisdiction declarative YAML configs (`_fixture-test.yaml` for tests; real jurisdictions such as `in-ka-bengaluru-south.yaml` added as data configs).
- `pipeline/` — Python package (`bylaws`) managed with `uv` (`pyproject.toml`, `uv.lock`) and tested with `pytest`.
- `web/` — Next.js TypeScript web app tested with `vitest`, ESLint, and `tsc --noEmit`.
- `data/overrides/<jurisdiction>/` — Committed YAML corrections, zone tags, and map curations (R6).
- `data/reports/<jurisdiction>/` — Committed parser comparison, QA, and map verification reports.
- `data/raw/`, `data/interim/`, `data/processed/` — Gitignored local pipeline working directories.

## Non-Negotiable Conventions (Rules R1–R6)

- **R1 (Zero Jurisdiction Hard-Coding)**: Never put a city name, URL, planning district number, zone code list, bounding box, or coordinate in `pipeline/` or `web/` code. Every `bylaws` CLI subcommand requires `--jurisdiction <id>` with NO default. Enforced by `pipeline/tests/test_r1_no_hardcoding.py`.
- **R2 (Mandatory Provenance)**: Every clause must carry `doc_id`, `pages`, and `verification`; every zone feature must carry `source_map`, `georef_run`, and `verification`.
- **R3 (Explicit Legal Status)**: Drafts (`legal_status: draft`) are stored and published separately from `in_force` documents and visibly badged in the UI.
- **R4 (Permissive Licensing)**: Use MIT / Apache-2.0 / BSD libraries (`docling`, `pdfplumber`, `pypdfium2`, `rasterio`, `shapely`, `geopandas`, `opencv-python-headless`, `scikit-image`). Never use AGPL packages (`PyMuPDF`, `Unstract`, `MinerU`).
- **R5 (Immutable Raw Sources)**: Never modify downloaded files in `data/raw/`; verify SHA-256 checksums in `.meta.json`.
- **R6 (Reproducibility)**: Never hand-edit generated files in `data/processed/`; store all manual fixes in `data/overrides/<jurisdiction>/*.yaml`.
