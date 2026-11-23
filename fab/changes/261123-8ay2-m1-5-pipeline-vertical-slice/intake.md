# Intake: M1.5 Pipeline Vertical Slice, Schema v1.1 & Open Data Setup

**Change**: 261123-8ay2-m1-5-pipeline-vertical-slice
**Created**: 2026-11-23

## Origin

> `/fab-discuss` on `/home/manideep/Downloads/bylaws-plan-v1.1-next-phase.md` followed by `/fab-new` to implement Change 1 of 4 (`m1-5-pipeline-vertical-slice`).
>
> Key decisions confirmed with the user during discussion:
> 1. **Delivery Slicing**: Plan v1.1 is split into 4 milestone-aligned Fab changes: (1) M1.5 Pipeline & Schema 1.1 (`S1 + S1b + S2 + Open Data Setup`), (2) M1.5 Web & dg2n UI (`S3 + S4`), (3) S0 Recon + M2 Acquisition, and (4) M3 Parser Comparison.
> 2. **R9 Superseded Records (D6)**: When an override modifies a `human_verified` clause or zone, keep both records in the published output array; the prior record has `superseded_by` set to the new `record_id` (rendered with a `SUPERSEDED` tag in clauses and hidden on the map), and the new record has `supersedes` set to the prior `record_id`.
> 3. **Path Mapping**: Plan v1.1 references `web/lib/...` and `web/public/data/...`; because the Next.js app lives at the repository root (`app/`, `components/`, `lib/`, `public/`), generated TypeScript types go to `lib/types/generated.ts` and local published datasets go to `public/data/`.

## Why

1. **Problem**: M0 and M1 established the repository scaffold, 6 v1.0 JSON Schemas, config loader, and synthetic fixture files, but all pipeline stages (`acquire`, `parse`, `compare`, `structure`, `amendments`, `apply-overrides`, `validate`, `geo`, `publish`) are currently no-op stubs that exit `0` without producing output. Additionally, two UI fallbacks (`clause.legal_status ?? "in_force"` and `clause.pages[0] ?? 1`) violate regulatory accuracy by fabricating provenance when data is missing, and Pydantic/TypeScript models are hand-maintained separately from `schemas/*.schema.json`.
2. **Consequence of not fixing**: Unimplemented stages silently pass CI (violating Rule R7), missing provenance is masked as `"in_force"` or `"page 1"` (violating Rule R8), hand-written Python and TypeScript types drift from the JSON Schemas as Schema v1.1 fields are added, and downstream web work (S3/S4) has no real pipeline-generated dataset to render.
3. **Why this approach**: Implementing S1 (fail loudly + remove fallbacks), S1b (Schema v1.1, single-source codegen, `xx-test-fixture` rename, `bylaws.toml` root discovery, license CI, `run-all`), Open Data licensing/governance files, and S2 (end-to-end offline vertical slice on `xx-test-fixture` with `pypdfium2` + imported GeoJSON zones + golden tests) makes the entire pipeline concrete and verifiable in CI before rebuilding the web UI in Change 2.

## What Changes

### 1. Open Data Repository Setup & Plan v1.1 Spec (`Section 4`)

- Copy `/home/manideep/Downloads/bylaws-plan-v1.1-next-phase.md` into `docs/plan-v1.1.md` and add it to `docs/specs/index.md`.
- Create root open-data governance files:
  - `LICENSE`: Full Apache License 2.0 text for all source code. Update `pipeline/pyproject.toml` `license = { text = "Apache-2.0" }`.
  - `LICENSE-DATA.md`: CC BY 4.0 license terms for published datasets, specifying required attribution (`"Structured Building Bylaws"`) and noting that underlying regulatory texts are Indian government publications.
  - `CONTRIBUTING.md`: Instructions for reporting errors, proposing clause/zone overrides in `data/overrides/<jurisdiction>/`, and running validation/tests.
  - `CODE_OF_CONDUCT.md`: Contributor Covenant code of conduct.
  - `CITATION.cff`: Valid Citation File Format 1.2.0 metadata (`title: "Structured Building Bylaws"`, `license: Apache-2.0`, `repository-code: "https://github.com/manideepmamidala2-bit/bylaws-india"`).
  - `docs/dependencies.md`: Documented inventory of all runtime and dev dependencies across `pipeline/pyproject.toml` and `package.json` with their SPDX license identifiers.
  - `docs/data-sources.md`: Initial open-data sources registry documenting attribution requirements for OpenStreetMap (ODbL), OpenCity, and municipal/planning authorities.
  - `docs/decisions/002-open-data-and-indicodes-practices.md`: ADR recording D1 (Apache-2.0 code / CC BY 4.0 data), D2 (strict permissive-only dependency policy; removal of Marker and MinerU from parser comparison), and credit to Indicodes Rules (`github.com/indicodes-in/rules`) for citation-with-bbox (`D5`), immutable `human_verified` records (`D6`/`R9`), and self-declared jurisdiction gaps (`D7`).

### 2. S1 — Fail Loudly (`R7`) and Remove Provenance Fallbacks (`R8`)

- **Fail loudly in unbuilt pipeline stages (`R7`)**:
  - Any stage or code path not yet implemented MUST raise `click.ClickException("not implemented: <stage>")` (exiting non-zero):
    - `bylaws compare` → `not implemented: compare` (until M3).
    - `bylaws geo` when a zoning map has `kind: "traced"` → `not implemented: geo (traced)` (until M6).
    - Unimplemented geo submodules (`rasterize.py`, `gcp.py`, `georef.py`, `verify.py`) and unimplemented parser adapters (`docling` until M3) raise `NotImplementedError("not implemented: <component>")` / `click.ClickException`.
  - Update `pipeline/tests/test_cli.py` to assert that unbuilt stages (`compare`, `parse --parser docling`) exit non-zero with `not implemented:`.
  - Update `validate` so it never prints `"valid"` for checks it has not run; it must enumerate every check executed and fail if expected processed artifacts are missing.
- **Remove UI fallbacks (`R8`) in `components/ClausePanel.tsx`, `components/ClauseTree.tsx`, and `components/StatusBadge.tsx`**:
  - Remove `const status = clause.legal_status ?? "in_force"` and `clause.legal_status ?? "in_force"`. Support `"status_unknown"` in `StatusBadge` rendering `STATUS UNKNOWN`.
  - Remove `const firstPage = clause.pages[0] ?? 1`. Update `ClausePanel` and `ClauseTree` to read `clause.citations` (falling back gracefully only if `citations` is empty by showing `"No source page recorded"` and rendering no `<a>` link).
  - Add unit tests in `__tests__/` verifying that a clause without `legal_status` renders `STATUS UNKNOWN` and a clause without a citation page renders `"No source page recorded"` with no link.

### 3. S1b — Structural Fixes, Schema v1.1 & Single-Source Codegen

- **Repository Root Discovery (`bylaws.toml` + `pipeline/bylaws/root.py`)**:
  - Create `bylaws.toml` at the repository root as the project root marker.
  - Create `pipeline/bylaws/root.py` with `resolve_repo_root(explicit_root: Path | str | None = None) -> Path`:
    1. `--root <path>` CLI option on the top-level `bylaws` Click group (stored in context / module state).
    2. `BYLAWS_ROOT` environment variable.
    3. Upward directory walk from `Path.cwd()` looking for `bylaws.toml`.
    4. If none found, raise `click.ClickException("Could not locate repository root (bylaws.toml). Pass --root or set BYLAWS_ROOT.")`.
  - Replace `Path(__file__).resolve().parents[2]` in `schema_validator.py` and `config.py` with `resolve_repo_root()`.
- **Pin Python 3.12 & Clean Dependencies**:
  - Add `.python-version` containing `3.12` at the repository root and `pipeline/.python-version`.
  - Update `pipeline/pyproject.toml`: set `requires-python = ">=3.12"`, move `fpdf2>=2.7.9` from runtime `dependencies` to `[project.optional-dependencies].dev`, add `shapely>=2.0.4` to runtime `dependencies` (for GeoJSON clipping/area calculation in `geo`), and add `datamodel-code-generator>=0.25.0` to `dev` dependencies.
  - Update `.env.example` to list all environment variables from Plan v1.1 Section 11 (`BYLAWS_ROOT`, `DATA_TARGET`, `BLOB_READ_WRITE_TOKEN`, `VERCEL_DEPLOY_HOOK_URL`, `NEXT_PUBLIC_DATA_BASE_URL`, `LLMWHISPERER_API_KEY`).
- **Remove `_fixture-test` Literal & Rename Fixture to `xx-test-fixture`**:
  - Rename `jurisdictions/_fixture-test.yaml` → `jurisdictions/xx-test-fixture.yaml` with `id: xx-test-fixture`, `name: Synthetic Test Jurisdiction`, `country: XX`, `state: YY`, `aliases: ["Synthetic Fixture", "Test City"]`.
  - Remove `_fixture-test|` from all JSON Schema regex patterns; standard jurisdiction ID pattern is `^[a-z0-9]+(-[a-z0-9]+)*$`.
  - Update `pipeline/tests/test_r1_no_hardcoding.py`:
    - Skip fixture configs where `raw.get("country") == "XX"` instead of `yaml_path.name.startswith("_fixture")`.
    - Enforce S4 static rule: scan `app/`, `components/`, `lib/`, and `jurisdictions/*.yaml` `name` fields to ensure `"prototype"` (case-insensitive) and `"(example)"` do not appear. (Update `app/j/[id]/page.tsx` banner text so existing code passes the new check immediately.)
- **Schema v1.1 Upgrades (`schemas/*.schema.json` + `docs/schema.md`)**:
  - Bump `schema_version` const to `"1.1"` across all schemas (`document`, `clause-tree`, `zones`, `overrides`, `manifest`, plus new `declarations` and `amendments`).
  - **`schemas/jurisdiction.schema.json`**:
    - Add optional `aliases` (`array` of `string`), `not_modelled` (`array` of `string`), and `unread_documents` (`array` of `{ title, source_url, reason }`).
    - On `documentConfig`: add `status_evidence` (`{ url: string | null, description: string }`) and `licence_or_terms` (`string`).
    - On `zoningMapConfig`: support `kind: "traced"` (`id`, `kind`, `document`, `page`, `planning_district`, `legend_page`) and `kind: "imported"` (`id`, `kind`, `source_url`, `zone_code_field`, `zone_label_field`, `source_attribution`).
  - **`schemas/document.schema.json`**:
    - `schema_version: "1.1"`, add required `status_evidence` (`{ url: string | null, description: string }`) and `licence_or_terms` (`string`).
    - Also allow validating `documents.json` (or define `documents` envelope / validate each entry).
  - **`schemas/clause-tree.schema.json`**:
    - `schema_version: "1.1"`.
    - On `clauseNode`:
      - Add required `record_id` (`string`, e.g., `fixture-base-2020:1.1@v1`), `supersedes` (`string | null`), `superseded_by` (`string | null`), and `legal_status` (`in_force | draft | superseded | withdrawn`).
      - Replace `pages` with `citations` (non-empty array of `citation` objects: `{ doc_id: string, page: integer >= 1, bbox: [number, number, number, number] | null, text_excerpt: string }`).
  - **`schemas/zones.schema.json`**:
    - `schema_version: "1.1"` (required).
    - On `zoneFeature.properties`:
      - Add required `record_id` (`string`), `supersedes` (`string | null`), `superseded_by` (`string | null`), and `source_attribution` (`string | null`).
      - Add `"imported"` to `extraction_method` enum (`colour_segmentation | road_outline_fallback | manual | imported`).
      - Enforce via JSON Schema `if/then` (or validator check) that when `extraction_method == "imported"`, `source_attribution` is a non-empty string.
  - **`schemas/overrides.schema.json`**:
    - `schema_version: "1.1"`.
    - `clauseFix`, `zoneTag`, `zoneFix` remain clean declarative instructions; `apply-overrides` enforces Rule R9 when the target record in the dataset has `verification == "human_verified"`.
  - **`schemas/declarations.schema.json` (new)**:
    ```json
    {
      "schema_version": "1.1",
      "jurisdiction": "xx-test-fixture",
      "not_modelled": ["Fire safety requirements of the National Building Code"],
      "known_gaps": [{ "doc_id": "fixture-base-2020", "description": "Tables not extracted by pypdfium2 baseline adapter" }],
      "unread_documents": [{ "title": "Draft Circular 2026", "source_url": "https://example.org/circular.pdf", "reason": "Published after this release" }]
    }
    ```
  - **`schemas/amendments.schema.json` (new)**:
    ```json
    {
      "schema_version": "1.1",
      "jurisdiction": "xx-test-fixture",
      "links": [
        {
          "amending_clause": "fixture-amend-2024:2",
          "target_clause": "fixture-base-2020:1.2",
          "action": "substitute",
          "confidence": "high",
          "verification": "unverified"
        }
      ]
    }
    ```
  - **`schemas/manifest.schema.json`**:
    - `schema_version: "1.1"`.
    - Add optional `aliases: string[]` to `jurisdictionManifest`.
    - Add required `licence` (`string`), `download_zip` (`string`), `sha256sums` (`string`), `declarations` (`string`), and `changelog` (`string`) to `releaseEntry` (and keep `files` + `drafts`).
- **Single-Source Codegen (`scripts/generate_models.py` + `Makefile` + `package.json`)**:
  - Add `json-schema-to-typescript` to `package.json` `devDependencies`.
  - Create a deterministic codegen script (`scripts/generate_models.py` and `Makefile` target `make generate` / `npm run generate`) that generates:
    - `pipeline/bylaws/models/_generated.py` (using `datamodel-code-generator` with Pydantic v2 `extra="forbid"`)
    - `lib/types/generated.ts` (using `json-schema-to-typescript`)
  - Refactor `pipeline/bylaws/config.py` and `lib/data.ts` to import/re-export the generated models/types instead of hand-defining schema structures.
  - Add a CI step in `.github/workflows/ci.yml` that runs codegen and fails if `git diff --exit-code` is non-empty.
- **Automated License Check in CI (`R4`)**:
  - Add `pipeline/tests/test_r4_licences.py` (and CI step) inspecting installed Python distributions (`importlib.metadata`) and `package-lock.json` / `node_modules` packages to fail if any dependency has a GPL, AGPL, or non-commercial license, and verify that every direct dependency in `pipeline/pyproject.toml` and `package.json` is listed in `docs/dependencies.md`.

### 4. S2 — Fixture Vertical Slice (`xx-test-fixture`), `run-all`, and Golden Tests

- **Synthetic Fixture Assets (`pipeline/tests/fixtures/` & `data/overrides/xx-test-fixture/`)**:
  - Update `pipeline/tests/fixtures/generate_fixtures.py` for `xx-test-fixture` and Schema v1.1:
    - Include `fixture-imported-zones.geojson` (two synthetic polygons `Z1` and `Z2` inside `FIX-01` boundary `[10.0, 10.0, 10.02, 10.02]`).
    - Commit `data/overrides/xx-test-fixture/overrides.yaml` containing:
      - a `clause_fixes` entry on a `machine_checked` clause (updates in place),
      - a `clause_fixes` entry on a `human_verified` clause (triggers R9 supersede creation),
      - `zone_tags` tagging clauses to `Z1` and `Z2`,
      - a `zone_fixes` entry marking `Z2` as `human_verified` and a subsequent override testing R9 zone supersede behavior.
- **Stage Implementations**:
  1. **`acquire` (`pipeline/bylaws/acquire.py`, `pipeline/bylaws/geo/boundaries.py`)**:
     - Resolve each document's `source_url` (supporting repo-relative paths, `file://`, and `http(s)://`), copy/download to `data/raw/<jurisdiction>/<doc_id>.pdf` (verifying existing SHA-256 if already present per R5), inspect page count and text presence with `pypdfium2`, and write `data/raw/<jurisdiction>/<doc_id>.meta.json` validated against `document.schema.json`.
     - Parse boundary KML (`fixture-boundary.kml`), select the Placemark matching `select.property == select.equals` (`district_code == FIX-01`), convert to WGS84 GeoJSON `FeatureCollection`, and write `data/processed/<jurisdiction>/boundary.geojson`.
  2. **`parse` (`pipeline/bylaws/parsers/pypdfium2_adapter.py`, `pipeline/bylaws/parsers/__init__.py`)**:
     - Change default `--parser` on `bylaws parse` (or config-driven parser) to `pypdfium2` for M1.5 (`docling` raises `not implemented: parse (docling)` until M3).
     - `Pypdfium2Adapter`: extracts text blocks per page using `pypdfium2`, computes normalized `[x0, y0, x1, y1]` top-left origin fractions (`0.0` to `1.0`) from character/text bounding boxes, and writes `data/interim/<jurisdiction>/<doc_id>.pypdfium2.json` and `data/interim/<jurisdiction>/<doc_id>.pypdfium2.md`. Records that tables are not supported by `pypdfium2`.
  3. **`structure` (`pipeline/bylaws/structure.py`)**:
     - Reads interim parse results for all regulation/base/amendment documents (`role in {"base", "amendment", "regulation"}`).
     - Detects numbered clauses (`1`, `1.1`, `2.1`, `D1.1`, `(a)`, `(i)`), computes hierarchy (`level`, `parent_id`, `order`), assigns `clause_id` (`<doc_id>:<number>`) and `record_id` (`<doc_id>:<number>@v1`), sets `legal_status` from document config, builds `citations` with `doc_id`, `page`, normalized `bbox`, and `text_excerpt` (first ~12 words), and detects `cross_references` (`clause X.Y`).
     - Writes `data/processed/<jurisdiction>/documents/<doc_id>.clauses.json` validated against `clause-tree.schema.json`.
  4. **`amendments` (`pipeline/bylaws/amendments.py`)**:
     - Scans clause trees of documents with `role == "amendment"` and `amends: [...]`.
     - Detects `substitute`, `insert_after`, `insert_before`, `omit`, and `modify` instructions with regex patterns, links `amending_clause` to `target_clause`, updates `amended_by` on target clauses in base documents, and writes `data/processed/<jurisdiction>/amendments.json` validated against `amendments.schema.json`.
  5. **`geo` (`pipeline/bylaws/geo/__init__.py`, `pipeline/bylaws/geo/zones.py`)**:
     - Processes `config.maps.zoning`:
       - For `kind == "imported"`: reads the source GeoJSON file, maps `zone_code_field` and `zone_label_field`, clips polygons to `boundary.geojson` using `shapely`, computes geodesic/planar `area_sq_m`, sets `record_id` (`<map_id>:z0001@v1`), `supersedes: null`, `superseded_by: null`, `extraction_method: "imported"`, `source_attribution`, and writes `data/processed/<jurisdiction>/zones.geojson` validated against `zones.schema.json`.
       - For `kind == "traced"`: raises `click.ClickException("not implemented: geo (traced)")`.
  6. **`apply-overrides` (`pipeline/bylaws/overrides.py`)**:
     - Loads `data/overrides/<jurisdiction>/*.yaml`, validates each file against `overrides.schema.json`, and applies `zone_tags`, `clause_fixes`, and `zone_fixes`.
     - Fails with `click.ClickException` if any target `clause_id` or `zone_id` is not found in the active records.
     - **Enforces Rule R9**: if a `clause_fix` or `zone_fix` targets a record whose current `verification == "human_verified"`, the original record is NOT mutated in place; instead, its `superseded_by` is set to `<id>@v<N+1>`, and a new record with `record_id = <id>@v<N+1>` and `supersedes = <id>@v<N>` is appended with the updated field value.
  7. **`validate` (`pipeline/bylaws/validate.py`)**:
     - Validates all raw `.meta.json` and processed JSON/GeoJSON files against their v1.1 schemas.
     - Runs QA checks:
       1. Every clause has a valid `legal_status` (hard fail if missing).
       2. Every clause has ≥1 citation with `page >= 1` (hard fail if missing).
       3. Share of citations with non-null `bbox` reported.
       4. Numbering continuity (gaps/duplicates).
       5. Clauses with empty text (hard fail if > 0).
       6. Source page coverage (pages with zero clauses recorded as `known_gaps`).
       7. Unresolved cross-references.
       8. Low-confidence amendment links.
       9. Drafts referenced from `in_force` documents/clauses (hard fail if > 0).
     - Generates `data/processed/<jurisdiction>/declarations.json` (validated against `declarations.schema.json`) and writes `data/reports/<jurisdiction>/qa.md`.
  8. **`publish` (`pipeline/bylaws/publish.py`)**:
     - Accepts `--target local|blob` (or `DATA_TARGET` env var, defaulting to `local`) and `--version <semver>` (defaulting to `0.1.0`).
     - Copies/writes release artifacts (`documents.json`, in-force `<doc_id>.clauses.json`, draft `<doc_id>.clauses.json`, `amendments.json`, `zones.geojson`, `boundary.geojson`, `declarations.json`), builds `<jurisdiction>-<version>.zip` and `SHA256SUMS`, and updates `public/data/manifest.json` (validated against `manifest.schema.json`).
     - Supports `--dry-run`. For `blob` target, uploads to Vercel Blob (`BLOB_READ_WRITE_TOKEN`) and triggers `VERCEL_DEPLOY_HOOK_URL` if configured.
  9. **`run-all` (`pipeline/bylaws/cli.py`)**:
     - New CLI subcommand `bylaws run-all --jurisdiction <id>` executing `acquire → parse → structure → amendments → geo → apply-overrides → validate → publish` in order, halting immediately and reporting the stage name if any stage fails.
- **Golden Tests (`pipeline/tests/test_golden_fixture.py`)**:
  - Run `bylaws run-all --jurisdiction xx-test-fixture` into a temporary root/output directory, verify every file referenced in `manifest.json` plus the release `.zip` and `SHA256SUMS` exists on disk, and compare generated `clauses.json`, `amendments.json`, `zones.geojson`, and `declarations.json` against committed golden snapshots in `pipeline/tests/golden/xx-test-fixture/` (using `pytest.approx` for floating-point bbox and geometry/area fields).

## Affected Memory

- `architecture/overview`: (modify) Update CLI subcommands (`run-all`, `--root` / `BYLAWS_ROOT` / `bylaws.toml`), Rules R4/R7/R8/R9, open-data repository files, and `xx-test-fixture` end-to-end execution.
- `schemas/data-contracts`: (modify) Document Schema v1.1 contracts (8 schemas including `declarations.schema.json` and `amendments.schema.json`), bbox citations, `record_id`/`supersedes`/`superseded_by` immutability fields, `imported` zoning maps, and single-source Pydantic/TypeScript codegen.

## Impact

- **Schemas (`schemas/`)**: Updates all 6 existing schemas to v1.1 and adds `declarations.schema.json` and `amendments.schema.json`.
- **Codegen (`scripts/`, `Makefile`, `pipeline/bylaws/models/_generated.py`, `lib/types/generated.ts`)**: Single-source model generation with CI drift check.
- **Python Pipeline (`pipeline/`)**: Implements `root.py`, `acquire.py`, `parsers/pypdfium2_adapter.py`, `structure.py`, `amendments.py`, `geo/boundaries.py`, `geo/zones.py`, `overrides.py`, `validate.py`, `publish.py`, and `cli.py` (`run-all`).
- **Web App (`components/`, `lib/`, `app/`, `public/data/`)**: Removes R8 fallbacks, updates types to Schema v1.1, and populates `public/data/` with real published `xx-test-fixture` release files.
- **CI (`.github/workflows/ci.yml`)**: Adds codegen freshness check, R4 license check, and end-to-end fixture golden test run.

## Open Questions

None — all architectural, schema, and workflow questions were resolved during `/fab-discuss`.

## Assumptions

| # | Grade | Decision | Rationale | Scores |
|---|-------|----------|-----------|--------|
| 1 | Certain | Slice Plan v1.1 into 4 milestone-aligned changes starting with M1.5 pipeline vertical slice (`S1 + S1b + S2 + Open Data`) | Discussed — user selected the 4 milestone-aligned changes option | S:95 R:90 A:95 D:95 |
| 2 | Certain | Keep superseded `human_verified` records in output arrays with `superseded_by` set and append new record with `supersedes` set (R9) | Discussed — user confirmed keeping both records in output and filtering superseded zones on the map | S:95 R:85 A:95 D:95 |
| 3 | Certain | Map `web/lib/...` and `web/public/data/...` references in Plan v1.1 to root `lib/...` and `public/data/...` | Determined by existing repo layout (ADR in `docs/memory/architecture/overview.md`) | S:90 R:95 A:100 D:95 |
| 4 | Certain | Add `amendments.schema.json` alongside `declarations.schema.json` so all published JSON files are covered by Schema v1.1 validation and codegen | Directly implied by S1b ("One source for the data model. JSON Schemas in `schemas/` are the single source") and S2 (`amendments` stage validation) | S:85 R:90 A:95 D:90 |
| 5 | Certain | Use `shapely` for GeoJSON boundary clipping and area computation in `geo` (`imported` path) instead of heavy GDAL/fiona system binaries in M1.5 | `shapely` is BSD-3-Clause, installs cleanly as a manylinux wheel without system GDAL issues in CI, and handles GeoJSON polygon clipping and area calculation deterministically | S:80 R:85 A:90 D:80 |

5 assumptions (5 certain, 0 confident, 0 tentative, 0 unresolved).
