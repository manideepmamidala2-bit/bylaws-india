# Plan: M1.5 Pipeline Vertical Slice, Schema v1.1 & Open Data Setup

**Change**: 261123-8ay2-m1-5-pipeline-vertical-slice
**Intake**: `intake.md`

## Requirements

### Open Data Governance & Plan v1.1 Specification

#### R1: Open Data Governance Files and Plan v1.1 Specification
The repository MUST include `docs/plan-v1.1.md` (copied from `/home/manideep/Downloads/bylaws-plan-v1.1-next-phase.md` and indexed in `docs/specs/index.md`) and the root open-data governance files required by Plan v1.1 Section 4: `LICENSE` (Apache-2.0), `LICENSE-DATA.md` (CC BY 4.0 with required attribution `"Structured Building Bylaws"` and a note that underlying regulatory texts are Indian government publications), `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `CITATION.cff` (valid Citation File Format 1.2.0 metadata), `docs/dependencies.md` (complete dependency and SPDX licence inventory), `docs/data-sources.md` (open-data source attribution registry), and `docs/decisions/002-open-data-and-indicodes-practices.md` (recording D1, D2, D5, D6/R9, and D7). `pipeline/pyproject.toml` MUST declare `license = { text = "Apache-2.0" }`.

- **GIVEN** a checkout of the repository
- **WHEN** open-data governance and specification files are inspected
- **THEN** `docs/plan-v1.1.md`, `LICENSE`, `LICENSE-DATA.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `CITATION.cff`, `docs/dependencies.md`, `docs/data-sources.md`, and `docs/decisions/002-open-data-and-indicodes-practices.md` exist and contain complete, valid metadata

### Fail Loudly (R7) & Remove Provenance Fallbacks (R8)

#### R2: Fail Loudly in Unbuilt Pipeline Stages and Remove UI Fallbacks
Any pipeline stage, parser adapter, or geospatial path that is not yet implemented MUST fail loudly with a non-zero exit code and a clear `not implemented: <component>` message (`bylaws compare`, `bylaws parse --parser docling`, `bylaws geo` for `kind: "traced"`, and unimplemented `geo` submodules `rasterize.py`, `gcp.py`, `georef.py`, `verify.py`) per Rule R7. In the web application (`components/ClausePanel.tsx`, `components/ClauseTree.tsx`, `components/StatusBadge.tsx`), the fallback defaults `clause.legal_status ?? "in_force"` and `clause.pages[0] ?? 1` MUST be removed per Rule R8: missing `legal_status` MUST render `STATUS UNKNOWN`, and a clause without a citation page MUST render `"No source page recorded"` without a link.

- **GIVEN** the `bylaws` CLI and web components
- **WHEN** an unbuilt stage (`bylaws compare --jurisdiction xx-test-fixture` or `bylaws parse --jurisdiction xx-test-fixture --parser docling`) is invoked, or a `ClauseNode` without `legal_status` or citation page is rendered in `ClausePanel` / `ClauseTree`
- **THEN** the CLI exits non-zero with `not implemented:` in output, and the UI renders `STATUS UNKNOWN` and `"No source page recorded"` with no `<a>` link

### Structural Fixes, Root Discovery & Fixture Rename (`S1b`)

#### R3: Repository Root Discovery (`bylaws.toml`), Python 3.12 Pin, and `xx-test-fixture` Rename
The repository MUST contain a `bylaws.toml` root marker file and `pipeline/bylaws/root.py` implementing `resolve_repo_root()` (resolving `--root` CLI option on `bylaws`, then `BYLAWS_ROOT` environment variable, then upward search from `Path.cwd()` for `bylaws.toml`, raising `click.ClickException` if not found). Python MUST be pinned to `3.12` in `.python-version`, `pipeline/.python-version`, and `pipeline/pyproject.toml` (`requires-python = ">=3.12"`), with `fpdf2` moved to `[project.optional-dependencies].dev`, `shapely>=2.0.4` added to runtime dependencies, and `datamodel-code-generator>=0.25.0` added to `dev`. `.env.example` MUST list all Plan v1.1 Section 11 variables (`BYLAWS_ROOT`, `DATA_TARGET`, `BLOB_READ_WRITE_TOKEN`, `VERCEL_DEPLOY_HOOK_URL`, `NEXT_PUBLIC_DATA_BASE_URL`, `LLMWHISPERER_API_KEY`). `jurisdictions/_fixture-test.yaml` MUST be renamed to `jurisdictions/xx-test-fixture.yaml` (`id: xx-test-fixture`, `country: XX`, `state: YY`, `aliases: ["Synthetic Fixture", "Test City"]`), `_fixture-test|` MUST be removed from all JSON Schema regexes, and `pipeline/tests/test_r1_no_hardcoding.py` MUST skip `country == "XX"` fixtures while enforcing that `"prototype"` (case-insensitive) and `"(example)"` do not appear in `app/`, `components/`, `lib/`, or jurisdiction display names.

- **GIVEN** `bylaws.toml`, `pipeline/bylaws/root.py`, and `jurisdictions/xx-test-fixture.yaml`
- **WHEN** `resolve_repo_root()` is called from a subdirectory, via `BYLAWS_ROOT`, or via `--root`, and `test_r1_no_hardcoding.py` runs
- **THEN** the repository root is resolved deterministically (or raises `ClickException` when no marker exists), `xx-test-fixture` validates against standard ID regexes, and zero `"prototype"` or `"(example)"` strings appear in web source or jurisdiction names

### Schema v1.1 & Single-Source Codegen (`S1b`)

#### R4: Schema v1.1 Contracts (`schemas/*.schema.json` and `docs/schema.md`)
All JSON Schemas in `schemas/` MUST be updated to `schema_version: "1.1"` and expanded to 8 Draft 2020-12 contracts (`jurisdiction`, `document`, `clause-tree`, `zones`, `overrides`, `manifest`, `declarations`, `amendments`):
- `jurisdiction.schema.json`: add optional `aliases`, `not_modelled`, `unread_documents`; require `status_evidence` and `licence_or_terms` on `documentConfig`; support `kind: "traced"` and `kind: "imported"` on `zoningMapConfig`.
- `document.schema.json`: `schema_version: "1.1"`, require `status_evidence` and `licence_or_terms`.
- `clause-tree.schema.json`: `schema_version: "1.1"`, require `record_id`, `supersedes`, `superseded_by`, `legal_status`, and non-empty `citations` (`{ doc_id, page, bbox, text_excerpt }`) replacing `pages`.
- `zones.schema.json`: require `schema_version: "1.1"`, add `record_id`, `supersedes`, `superseded_by`, `source_attribution`, allow `extraction_method: "imported"`, and require non-empty `source_attribution` when `extraction_method == "imported"`.
- `overrides.schema.json`: `schema_version: "1.1"`.
- `declarations.schema.json` & `amendments.schema.json`: new Schema v1.1 contracts.
- `manifest.schema.json`: `schema_version: "1.1"`, optional `aliases` on `jurisdictionManifest`, required `licence`, `download_zip`, `sha256sums`, `declarations`, and `changelog` on `releaseEntry`.
`docs/schema.md` and `pipeline/bylaws/schema_validator.py` (`SCHEMA_NAMES`) MUST be updated to reflect all 8 v1.1 schemas.

- **GIVEN** the 8 Schema v1.1 files in `schemas/`
- **WHEN** `test_config_and_schemas.py` validates sample v1.1 payloads and malformed payloads
- **THEN** all 8 v1.1 schemas pass meta-validation and payload validation, and reject missing v1.1 provenance/immutability fields

#### R5: Single-Source Model Codegen and Automated License Check (Rule R4)
`scripts/generate_models.py` (invoked via `make generate` and `npm run generate`) MUST deterministically generate `pipeline/bylaws/models/_generated.py` (Pydantic v2 models with `extra="forbid"`) and `lib/types/generated.ts` (TypeScript interfaces via `json-schema-to-typescript`) from `schemas/*.schema.json`. `pipeline/bylaws/config.py` and `lib/data.ts` MUST consume/re-export the generated types. `pipeline/tests/test_r4_licences.py` MUST verify that all installed Python distributions and npm packages have permissive licences (failing on GPL, AGPL, or non-commercial licences) and that every direct dependency in `pipeline/pyproject.toml` and `package.json` is listed in `docs/dependencies.md`. `.github/workflows/ci.yml` MUST enforce codegen freshness (`git diff --exit-code`) and run the R4 licence test.

- **GIVEN** `schemas/*.schema.json`, `scripts/generate_models.py`, and `pipeline/tests/test_r4_licences.py`
- **WHEN** `make generate` (or `npm run generate`) and `uv run pytest pipeline/tests/test_r4_licences.py` are executed
- **THEN** `pipeline/bylaws/models/_generated.py` and `lib/types/generated.ts` are regenerated with zero `git diff`, and all Python/npm dependencies pass the permissive licence and `docs/dependencies.md` completeness checks

### Pipeline Vertical Slice (`S2`)

#### R6: Pipeline Stages `acquire`, `parse` (`pypdfium2`), `structure`, and `amendments`
The pipeline MUST implement:
1. `acquire` (`pipeline/bylaws/acquire.py`, `pipeline/bylaws/geo/boundaries.py`): copy/download each configured document from `source_url` (repo-relative path, `file://`, or `http(s)://`) to `data/raw/<jurisdiction>/<doc_id>.pdf`, verify SHA-256 immutability if already present (Rule R5), inspect `page_count` and `is_scanned` using `pypdfium2`, write `data/raw/<jurisdiction>/<doc_id>.meta.json` validated against `document.schema.json`, and extract the matching boundary polygon from KML/GeoJSON into `data/processed/<jurisdiction>/boundary.geojson`.
2. `parse` (`pipeline/bylaws/parsers/pypdfium2_adapter.py`, `pipeline/bylaws/parsers/__init__.py`): default `--parser` to `pypdfium2`; extract text blocks per page with normalized `[x0, y0, x1, y1]` top-left bounding boxes (`0.0`–`1.0`); write `data/interim/<jurisdiction>/<doc_id>.pypdfium2.json` and `.pypdfium2.md`.
3. `structure` (`pipeline/bylaws/structure.py`): build hierarchical clause trees from interim parse outputs for `base`, `amendment`, and `regulation` documents, detecting numbered clauses (`1`, `1.1`, `2.1`, `D1.1`, `(a)`, `(i)`), assigning `clause_id` (`<doc_id>:<number>`), `record_id` (`<doc_id>:<number>@v1`), `supersedes: null`, `superseded_by: null`, `legal_status`, `citations` (with `doc_id`, `page`, `bbox`, `text_excerpt`), and `cross_references`, and writing `data/processed/<jurisdiction>/documents/<doc_id>.clauses.json` validated against `clause-tree.schema.json`.
4. `amendments` (`pipeline/bylaws/amendments.py`): scan `role == "amendment"` clause trees for `substitute`, `insert_after`, `insert_before`, `omit`, and `modify` instructions, update `amended_by` on target clauses in base documents, and write `data/processed/<jurisdiction>/amendments.json` validated against `amendments.schema.json`.

- **GIVEN** `jurisdictions/xx-test-fixture.yaml` and synthetic PDFs/KML in `pipeline/tests/fixtures/`
- **WHEN** `acquire`, `parse`, `structure`, and `amendments` run sequentially for `xx-test-fixture`
- **THEN** raw `.meta.json` files, `boundary.geojson`, interim `.pypdfium2.json`/`.md` files, structured `.clauses.json` files (with bbox citations), and `amendments.json` are written and validate against their v1.1 schemas

#### R7: Pipeline Stages `geo` (`imported` Path) and `apply-overrides` with Rule R9 Immutability
The pipeline MUST implement:
1. `geo` (`pipeline/bylaws/geo/__init__.py`, `pipeline/bylaws/geo/zones.py`): for zoning maps with `kind == "imported"`, load the source GeoJSON, map `zone_code_field` and `zone_label_field`, clip features to `boundary.geojson` using `shapely`, compute `area_sq_m`, populate `zone_id` (`<map_id>:z0001`), `record_id` (`<map_id>:z0001@v1`), `supersedes: null`, `superseded_by: null`, `extraction_method: "imported"`, `source_attribution`, and write `data/processed/<jurisdiction>/zones.geojson` validated against `zones.schema.json`. For `kind == "traced"`, raise `click.ClickException("not implemented: geo (traced)")`.
2. `apply-overrides` (`pipeline/bylaws/overrides.py`): load and validate `data/overrides/<jurisdiction>/*.yaml` against `overrides.schema.json`, apply `zone_tags`, `clause_fixes`, and `zone_fixes`, fail with `click.ClickException` if any target `clause_id` or `zone_id` does not exist, and enforce Rule R9: when a fix targets a record whose current `verification == "human_verified"`, keep the existing record untouched except setting `superseded_by = "<id>@v<N+1>"`, and append a new record with `record_id = "<id>@v<N+1>"` and `supersedes = "<id>@v<N>"` carrying the updated field values.

- **GIVEN** `fixture-imported-zones.geojson` and `data/overrides/xx-test-fixture/overrides.yaml` containing fixes on both `machine_checked` and `human_verified` clauses and zones
- **WHEN** `bylaws geo --jurisdiction xx-test-fixture` and `bylaws apply-overrides --jurisdiction xx-test-fixture` execute
- **THEN** `zones.geojson` and `.clauses.json` contain updated `machine_checked` records in-place and paired superseded/superseding `@v1` and `@v2` records for `human_verified` targets

#### R8: Pipeline Stage `validate`, `declarations.json`, and `qa.md` Report
`pipeline/bylaws/validate.py` MUST validate all raw `.meta.json` files and processed JSON/GeoJSON artifacts against their v1.1 schemas, execute all 9 QA checks (missing `legal_status`, missing citation page, non-null `bbox` share, numbering continuity, empty clause text, source page coverage, unresolved cross-references, low-confidence amendments, draft references from `in_force` data), fail with `click.ClickException` if expected artifacts are missing or hard checks fail, write `data/processed/<jurisdiction>/declarations.json` validated against `declarations.schema.json` (combining config `not_modelled` and `unread_documents` with QA-derived `known_gaps`), and write `data/reports/<jurisdiction>/qa.md` enumerating every check executed.

- **GIVEN** processed artifacts for `xx-test-fixture`
- **WHEN** `bylaws validate --jurisdiction xx-test-fixture` executes
- **THEN** all schema and QA checks run and are listed in `data/reports/xx-test-fixture/qa.md`, and `data/processed/xx-test-fixture/declarations.json` is written and valid

#### R9: Pipeline Stage `publish`, `run-all` Command, and End-to-End Golden Tests
`pipeline/bylaws/publish.py` MUST support `--target local|blob` (or `DATA_TARGET` env var, default `local`), `--version <semver>` (default `0.1.0`), and `--dry-run`. For `local`, it MUST write `documents.json`, in-force `.clauses.json`, draft `.clauses.json`, `amendments.json`, `zones.geojson`, `boundary.geojson`, `declarations.json`, `<jurisdiction>-<version>.zip`, and `SHA256SUMS` to `public/data/<jurisdiction>/<version>/`, and update `public/data/manifest.json` validated against `manifest.schema.json`. `pipeline/bylaws/cli.py` MUST provide `bylaws run-all --jurisdiction <id>` running `acquire → parse → structure → amendments → geo → apply-overrides → validate → publish` in sequence and halting with the stage name on failure. `pipeline/tests/test_golden_fixture.py` MUST run `run-all` on `xx-test-fixture` offline, verify every file in `manifest.json` plus `.zip` and `SHA256SUMS` exists, and compare generated outputs against committed golden snapshots in `pipeline/tests/golden/xx-test-fixture/`.

- **GIVEN** a clean workspace or temporary root directory with `xx-test-fixture`
- **WHEN** `bylaws run-all --jurisdiction xx-test-fixture` and `pytest pipeline/tests/test_golden_fixture.py` run
- **THEN** all 8 pipeline stages succeed in order, all published files in `public/data/xx-test-fixture/0.1.0/` and `public/data/manifest.json` exist and match the committed golden snapshots

### Non-Goals

- S0 real-document reconnaissance on Bengaluru South PDFs (`recon.md`) and M2 network acquisition — covered in Change 3.
- S3 full server-component data wiring, Leaflet polygon rendering, and S4 dg2n UI rebuild — covered in Change 2.
- M3 Docling and LLMWhisperer parser adapter implementation and comparison reports — covered in Change 4.
- M6 traced zoning map georeferencing, Allmaps IIIF tiles, and colour segmentation — deferred to M6.

### Design Decisions

#### Immutable Verified Records via Supersede Chain in Same Array (Rule R9 / D6)
**Decision**: When an override modifies a record (`clauseNode` or `zoneFeature`) whose `verification == "human_verified"`, retain the original record in the output list with `superseded_by` set to `<id>@v<N+1>` and append a new record with `record_id = "<id>@v<N+1>"` and `supersedes = "<id>@v<N>"`.
**Why**: Preserves an auditable, immutable provenance trail directly inside the published dataset so the web UI can display superseded clause versions and filter superseded zone polygons without losing historical human verification records.
**Rejected**: Mutating `human_verified` records in place (violates Rule R9/D6) or moving superseded records to a separate sidecar file that breaks self-contained clause/zone arrays.
*Introduced by*: 261123-8ay2-m1-5-pipeline-vertical-slice

#### Single-Source Codegen from Draft 2020-12 JSON Schemas
**Decision**: Keep `schemas/*.schema.json` as the sole authority and generate `pipeline/bylaws/models/_generated.py` (via `datamodel-code-generator` targeting Pydantic v2 `extra="forbid"`) and `lib/types/generated.ts` (via `json-schema-to-typescript`), verified in CI with `git diff --exit-code`.
**Why**: Prevents schema drift between Python pipeline stages, JSON Schema validators, and Next.js TypeScript components as Schema v1.1 adds citations, supersede chains, declarations, and amendment links.
**Rejected**: Hand-maintaining duplicate Pydantic classes in `config.py` and TypeScript interfaces in `lib/data.ts`.
*Introduced by*: 261123-8ay2-m1-5-pipeline-vertical-slice

## Tasks

### Phase 1: Setup & Open Data Governance

- [x] T001 Copy `/home/manideep/Downloads/bylaws-plan-v1.1-next-phase.md` to `docs/plan-v1.1.md`, add it to `docs/specs/index.md`, and create root open-data files `LICENSE`, `LICENSE-DATA.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `CITATION.cff`, `docs/dependencies.md`, `docs/data-sources.md`, and `docs/decisions/002-open-data-and-indicodes-practices.md` <!-- R1 -->
- [x] T002 Create `bylaws.toml`, `.python-version`, `pipeline/.python-version`, and `.env.example`, and update `pipeline/pyproject.toml` (`license = { text = "Apache-2.0" }`, `requires-python = ">=3.12"`, move `fpdf2` to `dev`, add `shapely` to runtime and `datamodel-code-generator` to `dev`) and `package.json` (add `json-schema-to-typescript` to `devDependencies` and `generate` script) <!-- R3 -->
- [x] T003 Implement repository root discovery in `pipeline/bylaws/root.py` (`resolve_repo_root`, `set_cli_root`) and wire `--root` option in `pipeline/bylaws/cli.py`, `pipeline/bylaws/schema_validator.py`, and `pipeline/bylaws/config.py` <!-- R3 -->

### Phase 2: Schema v1.1, Codegen, Fixture Rename & S1 Fail-Loudly / R8 Fixes

- [x] T004 Upgrade all 6 existing schemas in `schemas/` (`jurisdiction`, `document`, `clause-tree`, `zones`, `overrides`, `manifest`) to Schema v1.1, create `schemas/declarations.schema.json` and `schemas/amendments.schema.json`, and update `docs/schema.md` and `pipeline/bylaws/schema_validator.py` <!-- R4 -->
- [x] T005 Create `scripts/generate_models.py` and `Makefile` (`make generate`), run codegen to produce `pipeline/bylaws/models/_generated.py` and `lib/types/generated.ts`, and refactor `pipeline/bylaws/config.py` and `lib/data.ts` to use the generated models and types <!-- R5 -->
- [x] T006 Rename `jurisdictions/_fixture-test.yaml` to `jurisdictions/xx-test-fixture.yaml` with Schema v1.1 fields (`aliases`, `not_modelled`, `unread_documents`, `status_evidence`, `licence_or_terms`, and `kind: "imported"` zoning map), and update `pipeline/tests/fixtures/generate_fixtures.py` and `data/overrides/xx-test-fixture/overrides.yaml` <!-- R3 -->
- [x] T007 Implement S1 fail-loudly (`Rule R7`) across unimplemented stages/adapters (`pipeline/bylaws/compare.py`, `pipeline/bylaws/parsers/__init__.py`, `pipeline/bylaws/geo/rasterize.py`, `pipeline/bylaws/geo/gcp.py`, `pipeline/bylaws/geo/georef.py`, `pipeline/bylaws/geo/verify.py`) and remove R8 UI fallbacks in `components/StatusBadge.tsx`, `components/ClausePanel.tsx`, `components/ClauseTree.tsx`, and `app/j/[id]/page.tsx` <!-- R2 -->

### Phase 3: S2 Pipeline Vertical Slice Implementation

- [x] T008 Implement `acquire` stage in `pipeline/bylaws/acquire.py` and KML/GeoJSON boundary extraction in `pipeline/bylaws/geo/boundaries.py` <!-- R6 -->
- [x] T009 Implement `Pypdfium2Adapter` with normalized page bounding boxes in `pipeline/bylaws/parsers/base.py`, `pipeline/bylaws/parsers/pypdfium2_adapter.py`, and `pipeline/bylaws/parsers/__init__.py` <!-- R6 -->
- [x] T010 Implement `structure` stage in `pipeline/bylaws/structure.py` producing Schema v1.1 clause trees with `record_id`, `legal_status`, `citations` (with `bbox` and `text_excerpt`), and `cross_references` <!-- R6 -->
- [x] T011 Implement `amendments` stage in `pipeline/bylaws/amendments.py` detecting amendment instructions, updating base clause `amended_by`, and writing `amendments.json` <!-- R6 -->
- [x] T012 Implement `geo` stage (`imported` zoning path with `shapely` boundary clipping and area computation; `traced` raising `not implemented: geo (traced)`) in `pipeline/bylaws/geo/__init__.py` and `pipeline/bylaws/geo/zones.py` <!-- R7 -->
- [x] T013 Implement `apply-overrides` stage in `pipeline/bylaws/overrides.py` enforcing Rule R9 immutability (`supersedes` / `superseded_by` versioned record creation on `human_verified` clauses and zones) <!-- R7 -->
- [x] T014 Implement `validate` stage in `pipeline/bylaws/validate.py` running Schema v1.1 validation and all 9 QA checks, generating `declarations.json`, and writing `data/reports/<jurisdiction>/qa.md` <!-- R8 -->
- [x] T015 Implement `publish` stage (`local` and `blob` targets, `.zip` archive, `SHA256SUMS`, `manifest.json`) in `pipeline/bylaws/publish.py` and `run-all` command in `pipeline/bylaws/cli.py` <!-- R9 -->

### Phase 4: Integration, Golden Snapshots, Tests & CI

- [x] T016 Run `bylaws run-all --jurisdiction xx-test-fixture` to populate `public/data/`, `data/reports/xx-test-fixture/qa.md`, and `pipeline/tests/golden/xx-test-fixture/`, and write `pipeline/tests/test_golden_fixture.py` <!-- R9 -->
- [x] T017 Update `pipeline/tests/test_cli.py`, `pipeline/tests/test_config_and_schemas.py`, `pipeline/tests/test_r1_no_hardcoding.py`, and add `pipeline/tests/test_r4_licences.py` <!-- R5 -->
- [x] T018 Update `__tests__/picker.test.tsx` for Schema v1.1 and add R8 component fallback unit tests in `__tests__/clause-fallbacks.test.tsx` <!-- R2 -->
- [x] T019 Update `.github/workflows/ci.yml` to run codegen drift check, R4 licence check, and full pipeline/web test suites, and verify all Python and Next.js checks pass <!-- R5 -->

## Execution Order

- T002 and T003 block T004–T005 (dependencies and root resolution).
- T004 and T005 block T006–T015 (Schema v1.1 and generated models/types).
- T008–T015 execute in pipeline stage sequence (`acquire → parse → structure → amendments → geo → apply-overrides → validate → publish → run-all`) and block T016.

## Acceptance

### Functional Completeness

- [ ] A-001 R1: `docs/plan-v1.1.md`, `LICENSE`, `LICENSE-DATA.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `CITATION.cff`, `docs/dependencies.md`, `docs/data-sources.md`, and `docs/decisions/002-open-data-and-indicodes-practices.md` exist and are complete
- [ ] A-002 R2: Unimplemented CLI commands (`compare`, `parse --parser docling`, `geo` with `kind: "traced"`) exit non-zero with `not implemented:`, and `ClausePanel` / `ClauseTree` / `StatusBadge` have no `"in_force"` or page `1` fallbacks
- [ ] A-003 R3: `bylaws.toml` and `pipeline/bylaws/root.py` resolve the repository root via `--root`, `BYLAWS_ROOT`, or upward walk; Python is pinned to `3.12`; and `jurisdictions/xx-test-fixture.yaml` replaces `_fixture-test.yaml`
- [ ] A-004 R4: All 8 JSON Schemas (`jurisdiction`, `document`, `clause-tree`, `zones`, `overrides`, `manifest`, `declarations`, `amendments`) are at `schema_version: "1.1"` and documented in `docs/schema.md`
- [ ] A-005 R5: `make generate` / `npm run generate` deterministically produces `pipeline/bylaws/models/_generated.py` and `lib/types/generated.ts` with zero `git diff`, and `pipeline/tests/test_r4_licences.py` passes
- [ ] A-006 R6: `acquire`, `parse` (`pypdfium2`), `structure`, and `amendments` stages produce schema-valid outputs with normalized bbox citations and amendment links for `xx-test-fixture`
- [ ] A-007 R7: `geo` (`imported` path) clips zones to `boundary.geojson` and computes `area_sq_m`, and `apply-overrides` enforces Rule R9 immutability by creating `@v2` superseding records for `human_verified` targets
- [ ] A-008 R8: `validate` runs schema and QA checks, writes `data/processed/xx-test-fixture/declarations.json`, and commits `data/reports/xx-test-fixture/qa.md`
- [ ] A-009 R9: `bylaws run-all --jurisdiction xx-test-fixture` executes all stages offline, populates `public/data/xx-test-fixture/0.1.0/` (including `.zip` and `SHA256SUMS`) and `public/data/manifest.json`, and passes `pipeline/tests/test_golden_fixture.py`

### Behavioral Correctness

- [ ] A-010 R2: Rendering `ClausePanel` or `ClauseTree` with a clause lacking `legal_status` displays `STATUS UNKNOWN`, and a clause with empty `citations` displays `"No source page recorded"` without an `<a>` element
- [ ] A-011 R3: `pipeline/tests/test_r1_no_hardcoding.py` skips fixtures by `country == "XX"` (with no `_fixture-test` special case in schemas) and verifies zero occurrences of `"prototype"` or `"(example)"` in web source and jurisdiction names
- [ ] A-012 R7: Applying a `clause_fix` or `zone_fix` to a `human_verified` record preserves the `@v1` record with `superseded_by` populated and appends a `@v2` record with `supersedes` populated

### Removal Verification

- [ ] A-013 R3: `jurisdictions/_fixture-test.yaml` is removed and `_fixture-test` no longer appears in `schemas/*.schema.json`

### Scenario Coverage

- [ ] A-014 R4: `pipeline/tests/test_config_and_schemas.py` tests positive and negative validation across all 8 v1.1 schemas
- [ ] A-015 R9: `pipeline/tests/test_golden_fixture.py` runs `run-all` in an isolated root and compares `clauses.json`, `amendments.json`, `zones.geojson`, and `declarations.json` against golden snapshots using `pytest.approx` for floating-point values

### Edge Cases & Error Handling

- [ ] A-016 R3: `resolve_repo_root` raises a clear `ClickException` when invoked outside a directory tree containing `bylaws.toml` and without `--root` or `BYLAWS_ROOT`
- [ ] A-017 R7: `apply-overrides` fails with `ClickException` when an override references a non-existent `clause_id` or `zone_id`
- [ ] A-018 R8: `validate` fails with `ClickException` when required processed files are missing or when a clause has empty text or references a draft from an `in_force` document

### Code Quality

- [ ] A-019 Pattern consistency: New Python and TypeScript modules follow existing project naming, typing, and error-handling conventions
- [ ] A-020 No unnecessary duplication: Shared schema validation, root resolution, and generated models are reused across stages without duplicate definitions
- [ ] A-021 Readability and maintainability: Pipeline stage functions are decomposed into focused helper functions with clear type annotations and no magic constants

## Notes

- Check items as you review: `- [x]`
- All acceptance items must pass before `/fab-continue` (hydrate)
- If an item is not applicable, mark checked and prefix with **N/A**: `- [x] A-NNN **N/A**: {reason}`

## Assumptions

| # | Grade | Decision | Rationale | Scores |
|---|-------|----------|-----------|--------|
| 1 | Certain | Keep superseded `human_verified` records in the output `clauses` / `features` arrays with `superseded_by` set, and append the new `@v<N+1>` record with `supersedes` set | Confirmed with user during `/fab-discuss` and recorded in `intake.md` | S:95 R:85 A:95 D:95 |
| 2 | Certain | Output generated TypeScript types to `lib/types/generated.ts` and published local data to `public/data/` | Matches the repository's root Next.js layout (`app/`, `components/`, `lib/`, `public/`) | S:95 R:95 A:100 D:95 |
| 3 | Certain | Include `schemas/amendments.schema.json` alongside `schemas/declarations.schema.json` in Schema v1.1 | Ensures every published JSON artifact is validated by JSON Schema and covered by single-source codegen | S:90 R:90 A:95 D:90 |
| 4 | Confident | Compute geodesic/planar polygon area in `geo` (`imported` path) using `shapely` with local equirectangular (`cos(lat)`) degree-to-metre projection | Provides accurate `area_sq_m` in WGS84 without requiring heavy system GDAL/PROJ binary data in CI | S:85 R:90 A:90 D:85 |
| 5 | Confident | Generate `pipeline/bylaws/models/_generated.py` by running `datamodel-code-generator` per schema into a unified module with deterministic formatting | Avoids duplicate class name collisions across schema files while producing a single importable `_generated.py` module | S:85 R:90 A:90 D:85 |

5 assumptions (3 certain, 2 confident, 0 tentative).
