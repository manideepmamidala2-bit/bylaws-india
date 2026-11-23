# Structured Building Bylaws (`bylaws-india`)

A curated, versioned, machine-readable dataset and web viewer for Indian building and municipal bylaws. Every clause is structured into a hierarchical clause tree with tables, traced to its exact source PDF and page, explicitly tagged with its legal status (`in_force`, `draft`, `superseded`, `withdrawn`), and linked to geographic zone polygons.

## Architecture

The project is split into two strictly separated halves:

1. **Local Pipeline (`pipeline/`)**: A `uv`-managed Python CLI (`bylaws <command> --jurisdiction <id>`) that acquires source documents, parses PDFs through swappable adapters, structures clause trees, detects amendments, extracts georeferenced zoning polygons, validates outputs against versioned JSON Schemas (`schemas/`), and publishes releases.
2. **Read-Only Web App (`web/`)**: A Next.js (App Router, TypeScript, Tailwind CSS, Leaflet) application that reads published datasets via `manifest.json` (from Vercel Blob or local `/data/` static assets) with zero jurisdiction-specific constants in code.

## Non-Negotiable Rules (R1–R6)

- **R1 — No jurisdiction is hard-coded**: Every jurisdiction lives in `jurisdictions/<id>.yaml`. Every CLI command requires `--jurisdiction <id>` with no default.
- **R2 — Provenance on everything**: Every clause and zone polygon records its source document/map, page/run ID, and verification status.
- **R3 — Explicit legal status**: Drafts (`legal_status: draft`) are stored and published separately from in-force regulations.
- **R4 — Licensing hygiene**: Permissive dependencies only (MIT / Apache-2.0 / BSD); no AGPL code (`PyMuPDF`, `Unstract`).
- **R5 — Immutable raw sources**: Raw files in `data/raw/` are never modified and are verified by SHA-256 checksums.
- **R6 — Reproducibility**: All manual corrections and zone tags live in committed override files (`data/overrides/<jurisdiction>/*.yaml`).

## Quickstart

### Python Pipeline (`pipeline/`)

```bash
cd pipeline
uv sync
uv run bylaws --help
uv run pytest
```

### Web Application (`web/`)

```bash
cd web
npm install
npm run lint
npm run typecheck
npm test
npm run build
```

## Documentation

- [`docs/plan.md`](docs/plan.md) — Phase 1 Plan (architecture, data model, milestones M0–M9)
- [`docs/schema.md`](docs/schema.md) — Human-readable guide to the 6 JSON Schemas in `schemas/`
- [`docs/decisions/001-parsers-and-licences.md`](docs/decisions/001-parsers-and-licences.md) — Parser and geospatial licensing decision record
- [`docs/progress.md`](docs/progress.md) — Milestone progress tracker
