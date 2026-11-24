# Architecture

Structured Building Bylaws uses a strict two-half architecture connecting an offline Python data pipeline (`pipeline/`) to a read-only Next.js web application at the repository root (`app/`, `components/`, `lib/`).

## 1. Pipeline Stages (`pipeline/bylaws/`)

All CLI commands require `--jurisdiction <id>` with no default (`Rule R1`):

| Stage / Command | Module | Purpose |
|-----------------|--------|---------|
| `bylaws acquire` | `pipeline/bylaws/acquire.py` | Downloads remote `http(s)` PDFs and KML/GeoJSON files into `data/raw/<id>/`, records HTTP retrieval metadata and Wayback snapshots, and writes `<doc_id>.meta.json`. |
| `bylaws check-provenance` | `pipeline/bylaws/provenance.py` | Enforces Rules R15 & R16 across all non-test jurisdictions and PDFs (blocking local URLs, missing retrieval blocks, and denylisted PDF creators/producers). |
| `bylaws verify-sources` | `pipeline/bylaws/provenance.py` | Refetches acquired sources over HTTP(S) and verifies live SHA-256 digests against recorded checksums. |
| `bylaws parse` | `pipeline/bylaws/parsers/` | Runs PDF parser adapters (`pypdfium2`, `docling`, `tesseract`) and writes interim Markdown and block/table JSON to `data/interim/<id>/`. |
| `bylaws compare` | `pipeline/bylaws/compare.py` | Benchmarks parser adapters across documents and writes `recon.md` and `parser-comparison.md` to `data/reports/<id>/`. |
| `bylaws structure` | `pipeline/bylaws/structure.py` | Converts parsed blocks and tables into schema-validated structured document trees in `data/processed/<id>/documents/`. |
| `bylaws amendments` | `pipeline/bylaws/amendments.py` | Extracts amending effects and computes derived consolidated views (`Derived by this project, not an official publication`, `Rule R14`). |
| `bylaws geo` | `pipeline/bylaws/geo/` | Processes official boundaries, georeferences master plan land-use sheets, extracts zone polygons, and writes `map-verification.md`. |
| `bylaws apply-overrides` | `pipeline/bylaws/overrides.py` | Idempotently applies committed YAML overrides from `data/overrides/<id>/` while maintaining immutable `@v<N>` record version chains (`Rules R6, R9, R12`). |
| `bylaws validate` | `pipeline/bylaws/validate.py` | Validates all processed artifacts against JSON Schemas (`schemas/`) and QA thresholds, writing `data/reports/<id>/qa.md`. |
| `bylaws publish` | `pipeline/bylaws/publish.py` | Packages release files, `.zip` bundle, `SHA256SUMS`, `sources.json`, `sources.csv`, and updates `public/data/manifest.json` (or uploads to Vercel Blob). Requires `release_version` in jurisdiction config. |

## 2. Data Layout

- `schemas/` — Versioned Draft 2020-12 JSON Schemas; single source of truth for generated Pydantic (`pipeline/bylaws/models/_generated.py`) and TypeScript (`lib/types/generated.ts`) types via `make generate`.
- `jurisdictions/` — Per-jurisdiction declarative YAML configs (`in-ka-bengaluru-south.yaml`, `xx-test-fixture.yaml`).
- `data/raw/` — Gitignored local cache of downloaded source files and `<doc_id>.meta.json` retrieval records.
- `data/interim/` — Gitignored intermediate parser outputs.
- `data/processed/` — Gitignored pre-publish structured outputs.
- `data/overrides/<id>/` — Committed YAML overrides and curations (`Rule R6`).
- `data/reports/<id>/` — Committed discovery logs, recon, parser comparisons, QA reports, and map verification reports.
- `public/data/` — Published static release bundles and `manifest.json` consumed by the Next.js web app.

## 3. Web Application & Hosting

- **Next.js App Router (`app/`, `components/`, `lib/`)**: Located at the repository root (with `.vercelignore` excluding `pipeline/` so Vercel deploys a single project).
- **Server-Side Test Filtering**: `lib/data.ts` filters out `visibility: "test"` jurisdictions on the server at build/render time unless the server-only `SHOW_TEST_JURISDICTIONS` environment variable is explicitly set.
- **Routes**:
  - `/` — Home (overview, status, and jurisdiction picker)
  - `/j/[id]` — Map & zone explorer
  - `/j/[id]/sources` — Legal source register
  - `/j/[id]/clauses` & `/j/[id]/documents/[doc]` — Structured document and clause viewer
  - `/j/[id]/timeline` — Chronological regulatory timeline
  - `/j/[id]/review` — Georeferenced sheet and zone overlay inspector
  - `/data` — Dataset releases, checksums, and declarations
  - `/about` — Methodology, provenance, and open licences
