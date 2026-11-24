# Plan: PR 02 — Provenance Gate and Repository Sync

**Change**: 261124-fcwm-pr-02-provenance-gate-repo-sync
**Intake**: `intake.md`

## Requirements

### Provenance Gate & Source Verification (Rules R15 & R16)

#### R1: Provenance Schema, `bylaws acquire` Wayback Archiving, `check-provenance` CI Gate, and `verify-sources`
The document and jurisdiction schemas (`schemas/document.schema.json`, `schemas/jurisdiction.schema.json`) MUST define a `retrieval` block (`RetrievalRecord`) containing `fetched_at`, `requested_url`, `final_url`, `http_status`, `content_type`, `content_length`, `response_headers` (`etag`, `last_modified`, `server`, `date`), `sha256`, `archive_url` or `archive_failure_reason` (at least one non-empty), and `fetched_by` (`"agent"` or a named person), plus `acquisition_status` (`"acquired" | "pending" | "not_found" | "reference_only"`) and `release_version` on `jurisdiction.schema.json`.
- `bylaws acquire` MUST fill `retrieval` for every HTTP(S) download using a descriptive `User-Agent`, polite retries, and redirect following, and MUST request a Wayback Machine Save Page Now snapshot (`archive_url` or `archive_failure_reason`), while skipping documents marked `acquisition_status: "pending"` or `"not_found"`.
- `bylaws check-provenance` (and CI tests) MUST fail the build on: (a) any non-test jurisdiction (`visibility != "test"`) with a `file://`, relative, or local `source_url`; (b) any non-test acquired source without a complete `retrieval` block; or (c) any PDF in a non-test jurisdiction (or in `data/` / `public/data/`) whose PDF metadata `Creator` or `Producer` matches a configurable denylist in `bylaws.toml` (`fpdf`, `pypdf`, `reportlab`, `StructuredBuildingBylaws`).
- `bylaws verify-sources --jurisdiction <id>` MUST refetch each acquired source and compare its SHA-256 against the recorded `sha256`, and `.github/workflows/verify-sources.yml` MUST run weekly (`schedule`) and open a GitHub issue on mismatch or dead link.

- **GIVEN** a non-test jurisdiction configuration and source files
- **WHEN** `bylaws check-provenance` and the provenance pytest suite execute
- **THEN** a planted local `source_url`, a missing `retrieval` block on an acquired non-test source, or a planted `fpdf`-generated PDF in a non-test jurisdiction fails validation immediately, whereas a valid `retrieval` record passes

### Fixture Isolation & Removal of Generated Bengaluru South Data

#### R2: Move Synthetic Generator to `xx-synthetic-city` Fixture and Reset `in-ka-bengaluru-south.yaml`
`scripts/build_bengaluru_south_sources.py` MUST be moved to `pipeline/tests/fixtures/build_synthetic_jurisdiction.py` and scrubbed so its output is a test jurisdiction `xx-synthetic-city` with `visibility: "test"`, a name containing `"Synthetic"` (`"Synthetic Demonstration City"`), and zero references to any real authority, place, or URL. Every generated Bengaluru South file under `data/` (`data/sources/in-ka-bengaluru-south/`, `data/overrides/in-ka-bengaluru-south/`, `data/reports/in-ka-bengaluru-south/`) and `docs/sources/in-ka-bengaluru-south.md` MUST be removed. `jurisdictions/in-ka-bengaluru-south.yaml` MUST list only the core documents with real `http(s)` URLs and `acquisition_status: "pending"` and zero local paths.

- **GIVEN** the repository tree after moving the generator script and resetting `jurisdictions/in-ka-bengaluru-south.yaml`
- **WHEN** `pipeline/tests/test_provenance_gate.py` inspects `data/`, `public/data/`, `scripts/`, `pipeline/tests/fixtures/build_synthetic_jurisdiction.py`, and `jurisdictions/in-ka-bengaluru-south.yaml`
- **THEN** no generated Bengaluru South file exists in `data/` or `public/data/`, `build_synthetic_jurisdiction.py` contains no real city/authority names or URLs and produces `xx-synthetic-city` (`visibility: "test"`), and `in-ka-bengaluru-south.yaml` contains only `http(s)` URLs with `acquisition_status: "pending"`

### Real Parsing Tools & Config-Driven Release Version (Rules R7 & R8)

#### R3: Real Docling & Tesseract Adapters, Strict Package Version Lookup, and Config Release Version
`DoclingLayoutAdapter` (`pipeline/bylaws/parsers/layout_table_adapter.py`) MUST invoke the installed `docling` package (`DocumentConverter`) rather than aliasing `pypdfium2` output. `TesseractOcrAdapter` MUST set `bbox: null` when real word bounding boxes are absent (never inventing synthetic coordinates, Rule R8). Parser versions MUST be read strictly from `importlib.metadata.version(pkg_name)` and fail loudly (`click.ClickException`, Rule R7) if a required package or binary is missing (never falling back to `"pypdfium2"` or `"1.0.0"`). `bylaws publish` MUST read the release version from `config.release_version` and fail loudly (`click.ClickException`) if `release_version` is absent on the jurisdiction config.

- **GIVEN** `xx-test-fixture` with `release_version: "0.1.0"` and installed `docling` and `tesseract`
- **WHEN** `bylaws parse --jurisdiction xx-test-fixture --parser docling` and `bylaws publish --jurisdiction <id>` execute
- **THEN** `DoclingLayoutAdapter` runs real Docling conversion and records the installed `docling` package version, `TesseractOcrAdapter` outputs `bbox: null` when word boxes are absent, missing packages raise `ClickException`, and `publish` raises `ClickException` when `config.release_version` is `None`

### Full Dependency Sync & Clean-Checkout Setup

#### R4: Python, System, and Web Dependency Sync with `make setup`
`pipeline/pyproject.toml` and `pipeline/uv.lock` MUST include all pipeline dependencies (`docling`, `pypdfium2`, `pdfplumber`, `pyproj`, `shapely`, `geopandas`, `rasterio`, `opencv-python-headless`, `scikit-image`, `httpx`, `pytesseract`), all verified against the R4 permissive licence allowlist and recorded in `docs/dependencies.md`. `.github/workflows/ci.yml` MUST install `tesseract-ocr`, `tesseract-ocr-eng`, `gdal-bin`, and `libgdal-dev`, cache Docling models, run Docling on the fixture, and run the provenance gate. `Makefile` MUST provide a `make setup` target that installs all Python and web dependencies from a clean checkout.

- **GIVEN** a clean checkout of the repository
- **WHEN** `make setup`, `uv run pytest`, and `npm test` run
- **THEN** all Python and npm dependencies install cleanly, `test_r4_licences.py` passes on all installed packages and `docs/dependencies.md`, and Docling parses `xx-test-fixture` in CI

### Truthful Documentation & Audit 3 Decision Record

#### R5: Rewrite `README.md` and Synchronize `docs/`
`README.md`, `docs/provenance.md`, `docs/architecture.md`, `docs/scope.md`, `docs/decisions/2026-11-24-audit-3.md`, `docs/data-sources.md`, `docs/specs/index.md`, and `docs/progress.md` MUST describe the project truthfully: what the project is, that synthetic release `1.0.0` was withdrawn and real acquisition is under way, the three scope tiers and inclusion test, clean-checkout setup (`make setup`), provenance gate and `verify-sources`, and the Audit 3 root-cause analysis and structural fixes. Any doc that describes generated Bengaluru South data as real MUST be removed or corrected.

- **GIVEN** `README.md` and all markdown files in `docs/`
- **WHEN** inspected by automated tests
- **THEN** `README.md`, `docs/provenance.md`, `docs/architecture.md`, `docs/scope.md`, `docs/decisions/2026-11-24-audit-3.md`, and `docs/progress.md` exist and contain zero claims presenting synthetic Bengaluru South data as real

### Design Decisions

#### Config-Driven Denylist and Provenance Gate via `bylaws check-provenance`
**Decision**: Store the PDF creator/producer denylist (`["fpdf", "pypdf", "reportlab", "structuredbuildingbylaws"]`) in `bylaws.toml` under `[provenance]` and expose `bylaws check-provenance` in `pipeline/bylaws/cli.py` (backed by `pipeline/bylaws/provenance.py`), executed both as a CLI step in `.github/workflows/ci.yml` and via falsifiable unit tests in `pipeline/tests/test_provenance_gate.py`.
**Why**: Keeps the provenance gate configurable without hard-coding tool names in multiple places while failing CI deterministically on any local `source_url`, missing `retrieval` block, or synthetic PDF metadata in non-test jurisdictions.
**Rejected**: Checking provenance only inside `bylaws acquire`, which would not catch hand-committed files or config edits in CI.
*Introduced by*: 261124-fcwm-pr-02-provenance-gate-repo-sync

## Tasks

### Phase 1: Schemas, Provenance Gate & Fixture Migration

- [x] T001 Update `schemas/document.schema.json`, `schemas/jurisdiction.schema.json`, and `bylaws.toml` to add `RetrievalRecord` (`retrieval`), `acquisition_status`, `release_version`, and the PDF producer denylist; run `make generate`; implement `pipeline/bylaws/provenance.py`, update `pipeline/bylaws/acquire.py` (with `httpx`, redirects, retries, and Wayback Save Page Now archiving), and add `bylaws check-provenance` and `bylaws verify-sources --jurisdiction <id>` to `pipeline/bylaws/cli.py` plus `.github/workflows/verify-sources.yml` <!-- R1 -->
- [x] T002 Move `scripts/build_bengaluru_south_sources.py` to `pipeline/tests/fixtures/build_synthetic_jurisdiction.py` (`xx-synthetic-city`, `visibility: "test"`, scrubbed of all real names/places/URLs); delete `data/sources/`, `data/overrides/in-ka-bengaluru-south/`, `data/reports/in-ka-bengaluru-south/`, `docs/sources/in-ka-bengaluru-south.md`, and `docs/decisions/004-bengaluru-south-parser-and-map-decisions.md`; reset `jurisdictions/in-ka-bengaluru-south.yaml` to core documents with real `http(s)` URLs and `acquisition_status: "pending"` <!-- R2 -->

### Phase 2: Real Parsing Tools & Dependency Sync

- [x] T003 Update `pipeline/pyproject.toml` and `pipeline/uv.lock` with `docling`, `pdfplumber`, `pytesseract`, `httpx`, `geopandas`, `rasterio`, `opencv-python-headless`, and `scikit-image`; wire `DoclingLayoutAdapter` to real Docling (`DocumentConverter`) and `TesseractOcrAdapter` to real Tesseract with `bbox: null` when word boxes are absent; enforce strict `importlib.metadata.version` lookup (Rule R7) and config-driven `release_version` in `pipeline/bylaws/publish.py` and `jurisdictions/xx-test-fixture.yaml` <!-- R3, R4 -->
- [x] T004 Update `Makefile` (`make setup`, `make test`, `make check-provenance`, `make generate`), `.github/workflows/ci.yml` (system packages `tesseract-ocr`, `tesseract-ocr-eng`, `gdal-bin`, `libgdal-dev`, Docling model caching, `bylaws parse --parser docling`, and `bylaws check-provenance`), and `docs/dependencies.md` <!-- R4 -->

### Phase 3: Documentation Sync & Falsifiable Tests (R11)

- [x] T005 Rewrite `README.md`, create `docs/provenance.md`, `docs/architecture.md`, `docs/scope.md`, and `docs/decisions/2026-11-24-audit-3.md`, update `docs/data-sources.md`, `docs/specs/index.md`, and `docs/progress.md`, and write falsifiable tests in `pipeline/tests/test_provenance_gate.py` (shown failing first before the gate/fixes are active, covering planted local `source_url`, planted `fpdf` PDF in non-test jurisdiction, valid retrieval record, real Docling adapter execution, and `xx-synthetic-city` fixture hygiene) <!-- R1, R2, R3, R4, R5 -->

## Acceptance

### Functional Completeness

- [x] A-001 R1: `schemas/document.schema.json` and `schemas/jurisdiction.schema.json` include `retrieval` (`RetrievalRecord`), `acquisition_status`, and `release_version`, and `make generate` produces zero git diff
- [x] A-002 R1: `bylaws acquire` populates `retrieval` with HTTP metadata, SHA-256, and Wayback Machine snapshot URL (`archive_url` or `archive_failure_reason`), and `bylaws verify-sources --jurisdiction <id>` + `.github/workflows/verify-sources.yml` exist and work
- [x] A-003 R1: `bylaws check-provenance` fails on planted local `source_url`s, missing `retrieval` records, and planted `fpdf`-generated PDFs in non-test jurisdictions, and passes on the repository
- [x] A-004 R2: No generated Bengaluru South file exists anywhere in `data/` or `public/data/`, `scripts/build_bengaluru_south_sources.py` is replaced by `pipeline/tests/fixtures/build_synthetic_jurisdiction.py` (`xx-synthetic-city`, `visibility: "test"`, no real names or URLs), and `jurisdictions/in-ka-bengaluru-south.yaml` lists only real `http(s)` URLs with `acquisition_status: "pending"`
- [x] A-005 R3: `DoclingLayoutAdapter` calls real Docling (`DocumentConverter`) on `xx-test-fixture` with no `pypdfium2` alias, `TesseractOcrAdapter` uses `bbox: null` when word coordinates are absent, missing parser packages fail loudly (`ClickException`), and `bylaws publish` requires `config.release_version`
- [x] A-006 R4: `pipeline/pyproject.toml`, `pipeline/uv.lock`, `docs/dependencies.md`, `Makefile` (`make setup`), and `.github/workflows/ci.yml` include all required Python and system packages and pass `test_r4_licences.py`
- [x] A-007 R5: `README.md`, `docs/provenance.md`, `docs/architecture.md`, `docs/scope.md`, `docs/decisions/2026-11-24-audit-3.md`, and `docs/progress.md` are written and truthful

### Behavioral Correctness

- [x] A-008 R1: Planted local source and planted `fpdf`-generated PDF tests are demonstrated failing before the gate/check passes (R11)
- [x] A-009 R3: `bylaws publish` without `release_version` in the jurisdiction config raises `ClickException`

### Scenario Coverage

- [x] A-010 R3: `uv run bylaws parse --jurisdiction xx-test-fixture --parser docling` and `uv run bylaws run-all --jurisdiction xx-test-fixture` succeed end-to-end

### Code Quality

- [x] A-011 Pattern consistency: New code follows existing CLI, schema validation, and error-handling conventions
- [x] A-012 No unnecessary duplication: Shared provenance and HTTP utilities are reused across `acquire`, `check-provenance`, and `verify-sources`

## Notes

- Check items as you review: `- [x]`
- All acceptance items must pass before `/fab-continue` (hydrate)
- If an item is not applicable, mark checked and prefix with **N/A**: `- [x] A-NNN **N/A**: {reason}`

## Deletion Candidates

- `pipeline/bylaws/parsers/pypdfium2_adapter.py:19-20` (`_clamp`) and `pipeline/bylaws/parsers/pypdfium2_adapter.py:41-45` (`_get_pypdfium2_version`) — duplicated by `_clamp` and `_resolve_adapter_version` in `pipeline/bylaws/parsers/layout_table_adapter.py:18-30`; can be consolidated into `pipeline/bylaws/parsers/base.py`.
- `pipeline/tests/test_bengaluru_south_dataset.py:61-66` (ad-hoc URL prefix checks inside `assert_published_manifest_has_no_local_sources`) — superseded by `is_remote_http_url` in `pipeline/bylaws/provenance.py:89-97`.

## Assumptions

| # | Grade | Decision | Rationale | Scores |
|---|-------|----------|-----------|--------|
| 1 | Certain | Add `acquisition_status: "pending"` to `in-ka-bengaluru-south.yaml` core documents so `bylaws check-provenance` validates URLs are remote `http(s)` while `bylaws acquire` waits for PR 04 to fetch them | Explicitly specified in `02-provenance-gate-and-repo-sync.md` §2 | S:95 R:90 A:95 D:95 |
| 2 | Certain | Configure PDF creator/producer denylist in `bylaws.toml` (`fpdf`, `pypdf`, `reportlab`, `StructuredBuildingBylaws`) enforced by `bylaws check-provenance` | Explicitly specified in `02-provenance-gate-and-repo-sync.md` §1 | S:95 R:95 A:95 D:95 |
| 3 | Certain | Require `release_version` in jurisdiction YAML for `bylaws publish` and fail loudly when absent | Explicitly specified in `02-provenance-gate-and-repo-sync.md` §3 | S:95 R:90 A:95 D:95 |
| 4 | Certain | Use `bbox: null` in `TesseractOcrAdapter` when real word boxes are not present rather than synthetic line coordinates | Explicitly specified in `02-provenance-gate-and-repo-sync.md` §3 (Rule R8) | S:95 R:95 A:95 D:100 |

4 assumptions (4 certain, 0 confident, 0 tentative).
