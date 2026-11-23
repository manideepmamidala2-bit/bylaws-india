# Intake: M0 & M1 — Repository Scaffold, JSON Schemas, Config Loader, Fixture Jurisdiction, and R1 Check

**Change**: 261123-a5ou-m0-m1-scaffold-schemas-fixture
**Created**: 2026-11-23

## Origin

> User invoked `/fab-discuss` with `/home/manideep/Downloads/bylaws-phase1-plan.md` ("lets discuss this plan and ask me if you have any questions aso we can start working on a concrete plan"), answered 4 architectural questions via the interactive question tool, and then invoked `/fab-new create a plan` to begin executing Change 1 (`m0-m1-scaffold-schemas-fixture`, covering Milestones M0 and M1 of the Phase 1 Plan).

Key decisions confirmed with the user during `/fab-discuss`:
1. **Execution Cadence**: Group Phase 1 milestones into 6 checkpoint-aligned Fab changes:
   - Change 1: `m0-m1-scaffold-schemas-fixture` (M0 & M1)
   - Change 2: `m2-m3-acquire-and-parse` (M2 & M3)
   - Change 3: `m4-structure-amendments-validate` (M4)
   - Change 4: `m5-m6-zoning-map-pipeline` (M5 & M6)
   - Change 5: `m7-m8-tagging-publish-webapp` (M7 & M8)
   - Change 6: `m9-review-release-0-1-0` (M9)
2. **Parser Selection (for M3 & architecture)**: Default parser is `Docling` (MIT); comparison parser is `pdfplumber` + `pypdfium2` (permissive MIT/Apache-2.0, zero AGPL risk, zero external API keys required).
3. **Agent-Driven Map Workflow (for M6 & schema design)**: The agent curates legend swatches/codes and pixel Ground Control Points (GCPs) into committed files under `data/overrides/<jurisdiction>/`, while the Python pipeline executes geocoding, GDAL transforms, and CIELAB segmentation deterministically (satisfying R6 Reproducibility).
4. **Dual-Mode Publishing & Web Data Fetching**: Both `bylaws publish` and `web/lib/data.ts` support local static mode (`web/public/data/`) and Vercel Blob mode (`BLOB_READ_WRITE_TOKEN`).

## Why

1. **Problem**: The repository currently contains only the empty `fab/` and `docs/` initialization scaffolding. Before we can acquire, parse, or structure building bylaws or zoning maps, we need the foundational repository layout, strict JSON Schemas (the data contract), a validated jurisdiction configuration loader, a synthetic fixture jurisdiction (`_fixture-test`) for offline deterministic testing, and an automated enforcement test for **Non-Negotiable Rule R1** (zero jurisdiction-specific constants in code).
2. **Consequence of not doing this first**: Without versioned JSON Schemas and an R1 static check in place from Milestone M0/M1, downstream pipeline and web modules risk coupling to Bengaluru-specific field shapes, zone codes, or URLs, violating Constitution Principles I–III and Plan Rules R1–R6.
3. **Why this approach**: Combining M0 (Scaffold) and M1 (Schemas, config loader, fixture, R1 check) into the first self-contained vertical slice establishes the entire project skeleton (`pipeline/`, `web/`, `schemas/`, `jurisdictions/`, `docs/`, `.github/workflows/ci.yml`) and verifies it end-to-end with unit tests, schema validation, and CI checks before touching external network resources in M2.

## What Changes

### 1. Project Context, Documentation, and Specs (`docs/`, `fab/project/`)

- Copy `/home/manideep/Downloads/bylaws-phase1-plan.md` into `docs/plan.md` as the canonical Phase 1 plan and index it in `docs/specs/index.md`.
- Create `docs/schema.md` documenting all 6 JSON Schemas, their `schema_version` (`"1.0"`), provenance requirements (R2), legal status rules (R3), and override semantics (R6).
- Create `docs/decisions/001-parsers-and-licences.md` recording the R4 licensing hygiene rules, the selection of permissive geospatial/PDF libraries (`docling`, `pdfplumber`, `pypdfium2`, `rasterio`, `pyogrio`, `shapely`, `geopandas`, `opencv-python-headless`, `scikit-image`), and explicit exclusion of AGPL dependencies (`PyMuPDF`, `Unstract`).
- Create `docs/progress.md` recording completion of Milestones M0 and M1 with their acceptance criteria.
- Update `fab/project/config.yaml` (`source_paths: [pipeline/, web/, schemas/, jurisdictions/]`, `test_paths: [pipeline/tests/, web/]`) and populate `fab/project/context.md` with the Python + Next.js monorepo architecture and conventions.
- Update `.gitignore` (ignoring `data/raw/`, `data/interim/`, `data/processed/`, `.env`, `.venv/`, `node_modules/`, `.next/`, etc. while keeping `data/overrides/` and `data/reports/` tracked) and create `.env.example` listing `BLOB_READ_WRITE_TOKEN`, `LLMWHISPERER_API_KEY`, and `LLM_API_KEY`.

### 2. Versioned JSON Schemas (`schemas/`)

Create all 6 JSON Schema (Draft 2020-12) files in `schemas/`:

1. **`schemas/jurisdiction.schema.json`**:
   - Validates `jurisdictions/<id>.yaml`.
   - Required fields: `id` (pattern `^[a-z0-9]+(-[a-z0-9]+)*$`), `name`, `country` (ISO 2-letter uppercase), `state`, `building_types` (non-empty array of strings), `parents` (array of strings), `documents` (non-empty array), `maps` (object with `boundaries` and `zoning` arrays).
   - Each document entry requires: `id`, `title`, `issuing_authority`, `layer` (`national | state | planning | municipal`), `legal_status` (`in_force | draft | superseded | withdrawn`), `role` (`base | amendment | regulation | boundary | reference`), `source_url` (URI or local fixture path). Optional: `amends` (array of doc IDs), `supersedes` (array of doc IDs), `notified_date`, `effective_from`.
   - `maps.boundaries[]` requires: `id`, `source_url`, `select` (`{ property: string, equals: string }`).
   - `maps.zoning[]` requires: `id`, `document`, `page` (integer ≥ 1), `planning_district` (integer or string), `legend_page` (integer ≥ 1 or `null`).

2. **`schemas/document.schema.json`**:
   - Validates `data/raw/<jurisdiction>/<doc_id>.meta.json`.
   - Required fields: `schema_version` (`"1.0"`), `doc_id`, `title`, `issuing_authority`, `layer`, `role`, `legal_status` (`in_force | draft | superseded | withdrawn`), `notified_date` (string or `null`), `effective_from` (string or `null`), `amends` (array), `supersedes` (array), `source_url`, `retrieved_at` (ISO 8601 timestamp), `sha256` (64-char hex), `bytes` (integer ≥ 0), `page_count` (integer ≥ 1 or `null` for non-PDFs), `is_scanned` (boolean).

3. **`schemas/clause-tree.schema.json`**:
   - Validates `data/processed/<jurisdiction>/documents/<doc_id>.clauses.json`.
   - Required top-level fields: `schema_version` (`"1.0"`), `doc_id`, `jurisdiction`, `legal_status`, `generated` (`{ parser, parser_version, pipeline_version, generated_at }`), `clauses` (array).
   - Each clause requires: `clause_id` (`<doc_id>:<number>`), `number`, `title` (string or `null`), `level` (integer ≥ 1), `parent_id` (string or `null`), `order` (integer ≥ 0), `text` (string), `tables` (array of `{ table_id, caption, headers, rows, page }`), `pages` (non-empty array of integers ≥ 1), `cross_references` (array of strings), `amended_by` (array of strings), `applies_to_zones` (array of strings), `verification` (`unverified | machine_checked | human_verified`).

4. **`schemas/zones.schema.json`**:
   - Validates `data/processed/<jurisdiction>/zones.geojson` as a GeoJSON `FeatureCollection`.
   - Each feature requires `type: "Feature"`, valid `geometry` (`Polygon` or `MultiPolygon`), and `properties`:
     - `zone_id` (string, e.g. `<map_id>:z0042`)
     - `zone_code` (string)
     - `zone_label` (string)
     - `source_map` (string)
     - `georef_run` (string)
     - `extraction_method` (`colour_segmentation | road_outline_fallback | manual`)
     - `area_sq_m` (number ≥ 0)
     - `verification` (`unverified | machine_checked | human_verified | rejected`)
     - `notes` (string or `null`)

5. **`schemas/overrides.schema.json`**:
   - Validates `data/overrides/<jurisdiction>/*.yaml`.
   - Required: `schema_version` (`"1.0"`).
   - Optional arrays/objects:
     - `clause_fixes`: array of `{ clause_id, field, value, reason }`
     - `zone_tags`: array of `{ clause_id, zones: string[], reason }`
     - `zone_fixes`: array of `{ zone_id, set: { zone_code?, zone_label?, verification?, notes? }, reason? }`
     - `map_curations`: optional structured legend swatches and pixel GCP definitions for reproducible georeferencing (`{ map_id, legend_entries?, gcps? }`)

6. **`schemas/manifest.schema.json`**:
   - Validates `manifest.json` at Blob/static root.
   - Required: `schema_version` (`"1.0"`), `jurisdictions` (array of `{ id, name, latest_release, releases: [{ version, released_at, files: { documents, clauses, amendments, zones, boundary, review_images }, drafts: { clauses }, changelog }] }`).

### 3. Python Pipeline Package (`pipeline/`)

- Managed via `uv` (`pipeline/pyproject.toml` with committed `pipeline/uv.lock`).
- Core dependencies for M0/M1: `click` (or `typer`), `pyyaml`, `jsonschema`, `pydantic`, `pypdfium2`, `reportlab` or `fpdf2` + `pillow` (for deterministic synthetic PDF/PNG fixture generation), `pytest`.
- Module layout under `pipeline/bylaws/`:
  - `__init__.py`
  - `cli.py`: Entry point `bylaws <command> --jurisdiction <id>`.
    - Registers subcommands for all pipeline stages: `acquire`, `parse`, `compare`, `structure`, `amendments`, `apply-overrides`, `validate`, `geo`, `publish`.
    - **Strict R1 rule**: `--jurisdiction <id>` is required on every command with **no default value**. Invoking `bylaws <cmd>` without `--jurisdiction` exits non-zero with a clear error message.
  - `config.py`: Loads `jurisdictions/<id>.yaml`, validates it against `schemas/jurisdiction.schema.json` using `jsonschema` (Draft202012Validator), and returns a strongly typed config object. Raises a descriptive `ConfigValidationError` on missing or invalid fields.
  - `schema_validator.py`: Reusable helper to validate any JSON/YAML dictionary against `schemas/<name>.schema.json`.
  - Stubs/interfaces for `acquire.py`, `parsers/base.py`, `compare.py`, `structure.py`, `amendments.py`, `overrides.py`, `validate.py`, `geo/__init__.py`, `publish.py` so the CLI structure matches Plan §6.

### 4. Synthetic Fixture Jurisdiction (`jurisdictions/_fixture-test.yaml` & `pipeline/tests/fixtures/`)

- Create `jurisdictions/_fixture-test.yaml` using synthetic ID `_fixture-test` (`country: XX`, `state: YY`, `name: Synthetic Test Jurisdiction`).
- Create a deterministic fixture generator / test fixture builder in `pipeline/tests/fixtures/` (plus committed lightweight fixture files in `pipeline/tests/fixtures/`):
  - `fixture-base.pdf`: A small synthetic multi-page PDF with numbered clauses (`1`, `1.1`, `1.2`, `2`, `2.1`), a table (setbacks/height table), and cross-references (`as per clause 1.1`).
  - `fixture-amend.pdf`: A small synthetic amendment PDF containing explicit substitution instructions (`For clause 1.2, the following shall be substituted...`).
  - `fixture-draft.pdf`: A synthetic draft regulation PDF (`legal_status: draft`).
  - `fixture-map.pdf`: A synthetic coloured zoning map PDF with a distinct legend (`Z1` residential, `Z2` commercial) and known synthetic control points.
  - `fixture-boundary.kml`: A simple KML polygon boundary with a selectable feature property (`district_code: FIX-01`).
  - Sample valid JSON/GeoJSON/YAML payloads for every schema (`document.meta.json`, `clause-tree.json`, `zones.geojson`, `overrides.yaml`, `manifest.json`) verified in unit tests.

### 5. R1 Static Check (`pipeline/tests/test_r1_no_hardcoding.py`)

- Implement the automated static check required by Plan §2 (R1) and §11:
  - Scans all non-fixture jurisdiction configs in `jurisdictions/*.yaml` (excluding `_fixture-test.yaml`), plus a baseline sentinel list of prohibited jurisdiction-specific terms (e.g., `bengaluru`, `bangalore`, `jayanagar`, `benson town`, `bbmp`, `opencity`, `in-ka-bengaluru-south`) and extracts all config values (names, URLs, document IDs, district numbers, property values).
  - Scans every source file in `pipeline/bylaws/` and `web/` (`.py`, `.ts`, `.tsx`, `.js`, `.json` excluding lockfiles/node_modules/.next).
  - Fails if any jurisdiction-specific string or default `--jurisdiction` value appears in `pipeline/` or `web/` source code.

### 6. Next.js Web Application Skeleton (`web/`)

- Initialize `web/` with Next.js (App Router, TypeScript, Tailwind CSS, ESLint) and Leaflet types/dependencies (`leaflet`, `react-leaflet`, `@types/leaflet`).
- Create route skeletons matching Plan §6 and §10:
  - `web/app/page.tsx`: Jurisdiction picker reading from `lib/data.ts` (`fetchManifest()`) with zero preselected or hard-coded jurisdictions.
  - `web/app/j/[id]/page.tsx`: Map + clause panel route skeleton with the mandatory persistent prototype disclaimer banner.
  - `web/app/j/[id]/clauses/page.tsx`: Clause browser route skeleton.
  - `web/app/j/[id]/review/page.tsx`: Map review route skeleton.
  - `web/components/`: `ZoneMap.tsx`, `ClausePanel.tsx`, `ClauseTree.tsx`, `StatusBadge.tsx`, `ReviewPanel.tsx`.
  - `web/lib/data.ts`: Centralized data client reading `manifest.json` from `NEXT_PUBLIC_MANIFEST_URL` (supporting both Vercel Blob URLs and local `/data/manifest.json` fallback).
  - Smoke test (`web/__tests__/picker.test.tsx` or Vitest/Playwright unit test) verifying that the jurisdiction picker renders jurisdictions dynamically from a fixture manifest.

### 7. Continuous Integration (`.github/workflows/ci.yml`)

- Configure GitHub Actions workflow `.github/workflows/ci.yml` running on push and pull_request:
  - Python job: `uv sync`, `uv run pytest` (including schema validation, config loader tests, CLI tests, and R1 static check).
  - Web job: `npm ci`, `npm run lint`, `npm run typecheck` (`tsc --noEmit`), `npm test`, and `npm run build`.

## Affected Memory

- `architecture/overview`: (new) Document the two-half local Python pipeline + read-only Next.js web app architecture, repository layout, and R1–R6 invariants.
- `schemas/data-contracts`: (new) Document the 6 versioned JSON schemas (`jurisdiction`, `document`, `clause-tree`, `zones`, `overrides`, `manifest`), provenance fields, and legal status separation.

## Impact

- **New directories**: `schemas/`, `jurisdictions/`, `pipeline/`, `web/`, `data/overrides/`, `data/reports/`, `docs/decisions/`, `.github/workflows/`.
- **Tooling**: Installs `uv` locally (if not present) to manage `pipeline/pyproject.toml` and `pipeline/uv.lock`; uses `npm` in `web/` to manage `web/package.json` and `web/package-lock.json`.
- **No breaking changes**: Fresh repository initialization.

## Open Questions

None — all scope and architectural questions were resolved in `/fab-discuss`.

## Assumptions

| # | Grade | Decision | Rationale | Scores |
|---|-------|----------|-----------|--------|
| 1 | Certain | Group M0 and M1 into the first Fab change (`m0-m1-scaffold-schemas-fixture`) | Discussed — user explicitly selected "Grouped by checkpoints (Recommended)" in `/fab-discuss` | S:95 R:90 A:95 D:95 |
| 2 | Certain | Use `Docling` (MIT) and `pdfplumber` + `pypdfium2` (MIT/Apache-2.0) as the parser architecture and record in `docs/decisions/001-parsers-and-licences.md` | Discussed — user explicitly selected "Docling vs pdfplumber/pypdfium2 (Recommended)" in `/fab-discuss` | S:95 R:90 A:95 D:95 |
| 3 | Certain | Support committed legend/GCP curations in `schemas/overrides.schema.json` for deterministic map processing | Discussed — user explicitly selected "Agent curates to committed files (Recommended)" in `/fab-discuss` | S:95 R:90 A:95 D:95 |
| 4 | Certain | Support both local static data (`/data/manifest.json`) and Vercel Blob (`NEXT_PUBLIC_MANIFEST_URL` / `BLOB_READ_WRITE_TOKEN`) in `web/lib/data.ts` and `publish.py` | Discussed — user explicitly selected "Dual mode: Local + Vercel Blob (Recommended)" in `/fab-discuss` | S:95 R:90 A:95 D:95 |
| 5 | Confident | Use JSON Schema Draft 2020-12 (`https://json-schema.org/draft/2020-12/schema`) validated via Python `jsonschema` (`Draft202012Validator`) | Standard modern JSON Schema draft supported natively by Python `jsonschema` v4+ | S:80 R:85 A:90 D:85 |
| 6 | Confident | Include a baseline sentinel list in `test_r1_no_hardcoding.py` in addition to scanning `jurisdictions/*.yaml` (excluding `_fixture-test.yaml`) | Ensures R1 static check actively catches Bengaluru/city-specific strings even during M1 before `in-ka-bengaluru-south.yaml` is populated in M2 | S:80 R:90 A:90 D:85 |

6 assumptions (4 certain, 2 confident, 0 tentative, 0 unresolved).
