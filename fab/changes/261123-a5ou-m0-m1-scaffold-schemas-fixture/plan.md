# Plan: M0 & M1 — Repository Scaffold, JSON Schemas, Config Loader, Fixture Jurisdiction, and R1 Check

**Change**: 261123-a5ou-m0-m1-scaffold-schemas-fixture
**Intake**: `intake.md`

## Requirements

### Architecture & Project Scaffold: Repository Layout and Documentation

#### R1: Repository Layout, Documentation, and Git Hygiene
The repository MUST conform to the two-half architecture (local Python `pipeline/` + read-only Next.js `web/` app, shared `schemas/` and `jurisdictions/`) defined in the Phase 1 Plan. The canonical Phase 1 plan MUST be stored at `docs/plan.md` and indexed in `docs/specs/index.md`. Architecture documentation (`docs/schema.md`, `docs/decisions/001-parsers-and-licences.md`, `docs/progress.md`), project metadata (`fab/project/config.yaml`, `fab/project/context.md`), `.env.example`, and `.gitignore` (ignoring `data/raw/`, `data/interim/`, `data/processed/`, `.env`, `.venv/`, `node_modules/`, `.next/` while tracking `data/overrides/` and `data/reports/`) MUST be present and accurate.

- **GIVEN** a clean checkout of the repository
- **WHEN** a developer inspects `docs/`, `fab/project/`, `.gitignore`, `.env.example`, `data/overrides/`, and `data/reports/`
- **THEN** `docs/plan.md`, `docs/schema.md`, `docs/decisions/001-parsers-and-licences.md`, and `docs/progress.md` exist and document Milestones M0 and M1
- **AND** `data/raw/`, `data/interim/`, and `data/processed/` are gitignored while `data/overrides/.gitkeep` and `data/reports/.gitkeep` are tracked

### Data Contracts: Versioned JSON Schemas

#### R2: Six Versioned Draft 2020-12 JSON Schemas
The repository MUST define 6 JSON Schema (Draft 2020-12) files in `schemas/`: `jurisdiction.schema.json`, `document.schema.json`, `clause-tree.schema.json`, `zones.schema.json`, `overrides.schema.json`, and `manifest.schema.json`. Every data artifact schema (`document`, `clause-tree`, `overrides`, `manifest`) MUST require `schema_version: "1.0"`, enforce explicit provenance fields (Plan R2), enforce explicit `legal_status` enums (`in_force | draft | superseded | withdrawn`, Plan R3), and reject unknown or malformed structures.

- **GIVEN** the 6 JSON schema files in `schemas/`
- **WHEN** sample valid payloads for each schema are validated via `Draft202012Validator`
- **THEN** all valid payloads pass validation without errors
- **AND** payloads missing required provenance, `schema_version`, or `legal_status` fields fail validation with descriptive schema errors

### Pipeline CLI & Config Loader: Jurisdiction Isolation and Validation

#### R3: Pipeline CLI Entry Point with Mandatory `--jurisdiction` Flag
The Python `pipeline/` package (`bylaws`) MUST expose a `bylaws` CLI entry point (`pipeline/bylaws/cli.py`) registering subcommands for all pipeline stages (`acquire`, `parse`, `compare`, `structure`, `amendments`, `apply-overrides`, `validate`, `geo`, `publish`) and module interfaces matching Plan §6. Every subcommand MUST require `--jurisdiction <id>` with NO default value (Plan R1).

- **GIVEN** the installed `bylaws` CLI in `pipeline/`
- **WHEN** `bylaws --help` is executed
- **THEN** it exits with code 0 and lists all pipeline subcommands
- **AND** when any subcommand (e.g. `bylaws acquire` or `bylaws validate`) is executed without `--jurisdiction`, it exits non-zero with a clear error message stating `--jurisdiction` is required

#### R4: Validated Jurisdiction Config Loader and Schema Validator
`pipeline/bylaws/config.py` MUST load `jurisdictions/<id>.yaml`, validate it against `schemas/jurisdiction.schema.json` via `pipeline/bylaws/schema_validator.py`, and return a typed `JurisdictionConfig` object. Missing files or schema violations MUST raise a descriptive `ConfigValidationError` naming the offending field or path.

- **GIVEN** `jurisdictions/_fixture-test.yaml` and `schemas/jurisdiction.schema.json`
- **WHEN** `load_jurisdiction_config("_fixture-test")` is called
- **THEN** it returns a validated `JurisdictionConfig` instance with all documents and maps populated
- **AND** when a config dictionary missing required fields (such as `country`, `documents`, or `maps.zoning[0].page`) is validated, `ConfigValidationError` is raised with a clear message

### Testing & Quality: Synthetic Fixture and R1 Static Check

#### R5: Synthetic Fixture Jurisdiction and Deterministic Test Fixtures
`jurisdictions/_fixture-test.yaml` and `pipeline/tests/fixtures/` MUST provide a self-contained, offline synthetic test jurisdiction (`_fixture-test`, country `XX`, state `YY`) with deterministic synthetic PDFs (`fixture-base.pdf`, `fixture-amend.pdf`, `fixture-draft.pdf`, `fixture-map.pdf`), a synthetic KML boundary (`fixture-boundary.kml`), and sample valid payloads for all 6 schemas.

- **GIVEN** `jurisdictions/_fixture-test.yaml` and `pipeline/tests/fixtures/`
- **WHEN** the test suite runs offline without network access
- **THEN** all fixture PDFs, KML files, and sample JSON/YAML payloads exist, are valid, and pass schema validation

#### R6: Automated R1 Static Check Against Jurisdiction Hard-Coding
`pipeline/tests/test_r1_no_hardcoding.py` MUST scan all source files in `pipeline/bylaws/` and `web/` (excluding `node_modules`, `.next`, test files, and lockfiles) for prohibited strings extracted from any non-fixture `jurisdictions/*.yaml` config as well as a baseline sentinel list of jurisdiction-specific terms (`bengaluru`, `bangalore`, `jayanagar`, `benson town`, `bbmp`, `opencity`, `in-ka-bengaluru-south`, `bscc`, `rmp2015`, `ksrsac`). It MUST also verify that no CLI `--jurisdiction` option defines a default value.

- **GIVEN** the source files in `pipeline/bylaws/` and `web/`
- **WHEN** `pytest pipeline/tests/test_r1_no_hardcoding.py` runs
- **THEN** zero jurisdiction-specific constants or default `--jurisdiction` values are found in `pipeline/bylaws/` or `web/`
- **AND** running the R1 scanner helper against a synthetic snippet containing a forbidden sentinel raises a violation

### Web Application: Read-Only Next.js Skeleton

#### R7: Next.js App Router Skeleton, Centralized Data Client, and Smoke Test
The `web/` directory MUST contain a Next.js (App Router, TypeScript, Tailwind CSS) application with centralized data fetching in `web/lib/data.ts` (reading from `NEXT_PUBLIC_MANIFEST_URL` with `/data/manifest.json` fallback and zero hard-coded jurisdiction IDs), route skeletons for `/`, `/j/[id]`, `/j/[id]/clauses`, and `/j/[id]/review`, component skeletons (`ZoneMap.tsx`, `ClausePanel.tsx`, `ClauseTree.tsx`, `StatusBadge.tsx`, `ReviewPanel.tsx`), the persistent prototype disclaimer banner on `/j/[id]`, and a Vitest smoke test verifying dynamic rendering of jurisdictions from a fixture manifest.

- **GIVEN** the `web/` application and a fixture `manifest.json`
- **WHEN** `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` are executed in `web/`
- **THEN** all four checks exit 0 and the picker smoke test confirms jurisdictions render dynamically from the manifest with no preselected or hard-coded city

### Continuous Integration: GitHub Actions Workflow

#### R8: GitHub Actions CI Workflow for Pipeline and Web
`.github/workflows/ci.yml` MUST define automated jobs triggered on `push` and `pull_request` that run the Python test suite (`uv sync` + `uv run pytest`) and Web quality gates (`npm ci`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`).

- **GIVEN** `.github/workflows/ci.yml`
- **WHEN** inspected and validated as YAML
- **THEN** it defines both `pipeline` and `web` jobs running all required checks on push and pull_request events

### Non-Goals

- Network acquisition of real Bengaluru South documents (`in-ka-bengaluru-south.yaml`) — deferred to Milestone M2.
- Full Docling / pdfplumber PDF parsing and clause-tree regex extraction — deferred to Milestones M3 and M4 (M0/M1 establishes the CLI subcommands, adapter interfaces, and schemas).
- Real GDAL georeferencing and CIELAB colour segmentation implementation — deferred to Milestones M5 and M6.

### Design Decisions

#### Permissive PDF & Geospatial Stack (R4 Licensing Hygiene)
**Decision**: Use `Docling` (MIT) as the primary parser and `pdfplumber` (MIT) + `pypdfium2` (Apache-2.0/BSD) as the comparison parser and page renderer, along with permissive geospatial libraries (`rasterio`, `pyogrio`, `shapely`, `geopandas`, `opencv-python-headless`, `scikit-image`), documented in `docs/decisions/001-parsers-and-licences.md`.
**Why**: Satisfies Plan R4 (no AGPL code or dependencies such as `PyMuPDF` or `Unstract`), runs 100% locally without external API keys, and provides structured table extraction for comparison.
**Rejected**: `PyMuPDF` (`fitz`) and `MinerU` due to AGPL-3.0 licensing restrictions; `LLMWhisperer` as a required dependency due to proprietary API key requirements.
*Introduced by*: 261123-a5ou-m0-m1-scaffold-schemas-fixture

#### Committed Map Curations in Overrides Schema
**Decision**: Include an optional `map_curations` array in `schemas/overrides.schema.json` to store agent-curated legend swatches/codes and pixel Ground Control Points (GCPs) per `map_id`.
**Why**: Preserves Plan R6 (100% deterministic reproducibility from raw sources + config/overrides) while allowing the agent in M6 to inspect rasterized map pages and commit exact pixel control points and legend entries.
**Rejected**: Ad-hoc uncommitted interim files in `data/interim/` that cannot be reproduced on a clean checkout.
*Introduced by*: 261123-a5ou-m0-m1-scaffold-schemas-fixture

#### Dual-Mode Data Fetching (`web/lib/data.ts`)
**Decision**: Centralize all manifest and dataset reads in `web/lib/data.ts`, resolving `process.env.NEXT_PUBLIC_MANIFEST_URL` (for Vercel Blob deployments) with a fallback to `/data/manifest.json` (for local static verification and offline CI testing).
**Why**: Enables full offline end-to-end verification and local development while supporting zero-code-change deployment to Vercel with Vercel Blob in M8.
**Rejected**: Hard-coding Vercel Blob URLs in components or requiring live network access during unit/smoke tests.
*Introduced by*: 261123-a5ou-m0-m1-scaffold-schemas-fixture

## Tasks

### Phase 1: Setup

- [x] T001 Copy `/home/manideep/Downloads/bylaws-phase1-plan.md` to `docs/plan.md`, link it in `docs/specs/index.md`, and update `README.md` with project overview and quickstart commands <!-- R1 -->
- [x] T002 [P] Create `docs/schema.md`, `docs/decisions/001-parsers-and-licences.md`, and `docs/progress.md` documenting Milestones M0 and M1 <!-- R1 -->
- [x] T003 [P] Update `fab/project/config.yaml`, `fab/project/context.md`, `.gitignore`, `.env.example`, `data/overrides/.gitkeep`, and `data/reports/.gitkeep` <!-- R1 -->

### Phase 2: Core Implementation

- [x] T004 Create the 6 Draft 2020-12 JSON Schemas in `schemas/jurisdiction.schema.json`, `schemas/document.schema.json`, `schemas/clause-tree.schema.json`, `schemas/zones.schema.json`, `schemas/overrides.schema.json`, and `schemas/manifest.schema.json` <!-- R2 -->
- [x] T005 Initialize `pipeline/pyproject.toml` with `uv`, generate `pipeline/uv.lock`, and implement `pipeline/bylaws/__init__.py`, `pipeline/bylaws/schema_validator.py`, and `pipeline/bylaws/config.py` <!-- R4 -->
- [x] T006 Implement `pipeline/bylaws/cli.py` with mandatory `--jurisdiction` (no default) across all 9 pipeline subcommands and create module skeletons in `pipeline/bylaws/` (`acquire.py`, `parsers/__init__.py`, `parsers/base.py`, `compare.py`, `structure.py`, `amendments.py`, `overrides.py`, `validate.py`, `geo/__init__.py`, `geo/boundaries.py`, `geo/rasterize.py`, `geo/gcp.py`, `geo/georef.py`, `geo/zones.py`, `geo/verify.py`, `publish.py`) <!-- R3 -->
- [x] T007 Create `jurisdictions/_fixture-test.yaml` and deterministic synthetic fixture files (`fixture-base.pdf`, `fixture-amend.pdf`, `fixture-draft.pdf`, `fixture-map.pdf`, `fixture-boundary.kml`, and sample valid JSON/YAML payloads for all 6 schemas) in `pipeline/tests/fixtures/` <!-- R5 -->
- [x] T008 Scaffold the Next.js TypeScript + Tailwind application in `web/` (`package.json`, `tsconfig.json`, `next.config.ts`, `vitest.config.ts`, `web/lib/data.ts`, `web/public/data/manifest.json`) <!-- R7 -->
- [x] T009 Implement `web/` route skeletons (`web/app/layout.tsx`, `web/app/page.tsx`, `web/app/j/[id]/page.tsx`, `web/app/j/[id]/clauses/page.tsx`, `web/app/j/[id]/review/page.tsx`) and components (`web/components/ZoneMap.tsx`, `web/components/ClausePanel.tsx`, `web/components/ClauseTree.tsx`, `web/components/StatusBadge.tsx`, `web/components/ReviewPanel.tsx`) <!-- R7 -->

### Phase 3: Integration & Edge Cases

- [x] T010 Write `pipeline/tests/test_cli.py` and `pipeline/tests/test_config_and_schemas.py` testing `--help`, missing `--jurisdiction` rejection on all subcommands, `_fixture-test.yaml` loading, invalid config error reporting, and positive/negative validation for all 6 JSON schemas <!-- R2 -->
- [x] T011 Write `pipeline/tests/test_r1_no_hardcoding.py` scanning `pipeline/bylaws/` and `web/` for non-fixture jurisdiction values, sentinel strings, and CLI default values, plus self-tests proving the scanner catches violations <!-- R6 -->
- [x] T012 Write `web/__tests__/picker.test.tsx` verifying dynamic rendering of jurisdictions from a fixture manifest with zero hard-coded jurisdictions, and run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` in `web/` <!-- R7 -->

### Phase 4: Polish

- [x] T013 Create `.github/workflows/ci.yml` running Python (`uv sync`, `uv run pytest`) and Web (`npm ci`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`) jobs on every push and pull_request, and run the full test suite end-to-end <!-- R8 -->

## Acceptance

### Functional Completeness

- [x] A-001 R1: `docs/plan.md`, `docs/schema.md`, `docs/decisions/001-parsers-and-licences.md`, `docs/progress.md`, `.env.example`, and `.gitignore` exist and match the Phase 1 Plan specifications
- [x] A-002 R2: All 6 Draft 2020-12 JSON Schemas (`jurisdiction`, `document`, `clause-tree`, `zones`, `overrides`, `manifest`) exist in `schemas/` and validate their corresponding data models
- [x] A-003 R3: `bylaws --help` succeeds and all 9 subcommands (`acquire`, `parse`, `compare`, `structure`, `amendments`, `apply-overrides`, `validate`, `geo`, `publish`) require `--jurisdiction` with no default value
- [x] A-004 R4: `pipeline/bylaws/config.py` loads `jurisdictions/_fixture-test.yaml`, validates it against `schemas/jurisdiction.schema.json`, and returns a typed `JurisdictionConfig`
- [x] A-005 R5: `jurisdictions/_fixture-test.yaml` and `pipeline/tests/fixtures/` contain synthetic PDFs, KML boundary, and sample payloads for offline testing
- [x] A-006 R6: `pipeline/tests/test_r1_no_hardcoding.py` passes and verifies zero jurisdiction-specific constants in `pipeline/bylaws/` and `web/`
- [x] A-007 R7: `web/` contains the Next.js App Router skeleton, `web/lib/data.ts`, all 4 page routes, all 5 components, and passes `lint`, `typecheck`, `test`, and `build`
- [x] A-008 R8: `.github/workflows/ci.yml` defines Python and Web CI jobs running on `push` and `pull_request`

### Behavioral Correctness

- [x] A-009 R3: Invoking any `bylaws <subcommand>` without `--jurisdiction` exits non-zero and prints a missing-option error message
- [x] A-010 R7: `/j/[id]` displays the persistent prototype disclaimer banner ("Prototype. Zone boundaries are approximate and traced from scanned maps. Confirm with the planning authority.") and draft toggle (off by default)

### Scenario Coverage

- [x] A-011 R2: `pipeline/tests/test_config_and_schemas.py` exercises both valid sample payloads and invalid/malformed payloads for all 6 JSON schemas
- [x] A-012 R6: `pipeline/tests/test_r1_no_hardcoding.py` tests both the live codebase and a synthetic violation snippet to prove detection works
- [x] A-013 R7: `web/__tests__/picker.test.tsx` verifies that the jurisdiction picker renders multiple synthetic jurisdictions dynamically from a fixture manifest

### Edge Cases & Error Handling

- [x] A-014 R4: `load_jurisdiction_config` raises `ConfigValidationError` with field-level details when required fields are missing or invalid, and when a jurisdiction YAML file does not exist

### Code Quality

- [x] A-015 Pattern consistency: Python and TypeScript modules follow consistent naming, typing, and module boundary conventions across `pipeline/` and `web/`
- [x] A-016 No unnecessary duplication: Schema validation is centralized in `pipeline/bylaws/schema_validator.py` and web data fetching is centralized in `web/lib/data.ts`
- [x] A-017 Readability and maintainability: Functions are concise (<50 lines where practical), clearly typed, and free of magic strings

## Notes

- Check items as you review: `- [x]`
- All acceptance items must pass before `/fab-continue` (hydrate)
- If an item is not applicable, mark checked and prefix with **N/A**: `- [x] A-NNN **N/A**: {reason}`

## Deletion Candidates

- None — this change adds new functionality without making existing code redundant

## Assumptions

| # | Grade | Decision | Rationale | Scores |
|---|-------|----------|-----------|--------|
| 1 | Certain | Group M0 and M1 into the first Fab change (`m0-m1-scaffold-schemas-fixture`) | Discussed — user explicitly selected checkpoint-aligned grouping in `/fab-discuss` | S:95 R:90 A:95 D:95 |
| 2 | Certain | Use `Docling` (MIT) and `pdfplumber` + `pypdfium2` (MIT/Apache-2.0) as the parser architecture in `docs/decisions/001-parsers-and-licences.md` | Discussed — user explicitly selected permissive local parsers in `/fab-discuss` | S:95 R:90 A:95 D:95 |
| 3 | Certain | Support committed legend/GCP curations in `schemas/overrides.schema.json` | Discussed — user explicitly selected committed overrides for map curations in `/fab-discuss` | S:95 R:90 A:95 D:95 |
| 4 | Certain | Support both local static data (`/data/manifest.json`) and Vercel Blob (`NEXT_PUBLIC_MANIFEST_URL`) in `web/lib/data.ts` | Discussed — user explicitly selected dual-mode publishing and fetching in `/fab-discuss` | S:95 R:90 A:95 D:95 |
| 5 | Confident | Use JSON Schema Draft 2020-12 validated via `jsonschema.Draft202012Validator` | Standard modern JSON Schema draft supported natively by Python `jsonschema` v4+ | S:80 R:85 A:90 D:85 |
| 6 | Confident | Use Vitest + React Testing Library (`jsdom`) for the `web/` smoke test | Fast, zero-browser-binary unit/smoke test runner for Next.js App Router components in CI | S:80 R:90 A:90 D:85 |

6 assumptions (4 certain, 2 confident, 0 tentative).
