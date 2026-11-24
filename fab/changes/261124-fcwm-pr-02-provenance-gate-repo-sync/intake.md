# Intake: PR 02 — Provenance Gate and Repository Sync

**Change**: 261124-fcwm-pr-02-provenance-gate-repo-sync
**Created**: 2026-11-24

## Origin

> Implement PR 02 (Provenance Gate and Repository Sync) per docs/plans/pr-series/00-overview.md and docs/plans/pr-series/02-provenance-gate-and-repo-sync.md: add retrieval block to schemas and bylaws acquire with Wayback snapshot archiving, add CI provenance gate (R15/R16) and weekly bylaws verify-sources workflow, move scripts/build_bengaluru_south_sources.py to pipeline/tests/fixtures/build_synthetic_jurisdiction.py (xx-synthetic-city), delete all generated Bengaluru South files from data/ and public/data/, reset jurisdictions/in-ka-bengaluru-south.yaml to pending real URLs, wire real Docling and Tesseract adapters without aliases or invented bboxes, sync Python/Web dependencies with make setup, and rewrite README.md and docs/ (provenance.md, architecture.md, scope.md, decisions/2026-11-24-audit-3.md, progress.md).

Second PR in the 11-PR remediation series (`docs/plans/pr-series/00-overview.md` and `docs/plans/pr-series/02-provenance-gate-and-repo-sync.md`), following PR 01 (`261124-tuou-pr-01-contain-production`, merged in PR #6).

## Why

1. **Problem**: Even after PR 01 withdrew synthetic release `1.0.0` from `public/data/`, the repository still contains:
   - `scripts/build_bengaluru_south_sources.py` and generated files under `data/sources/in-ka-bengaluru-south/`, `data/overrides/in-ka-bengaluru-south/`, `data/reports/in-ka-bengaluru-south/`, and `docs/sources/in-ka-bengaluru-south.md` that present synthetic PDFs and KMLs under real authority names;
   - `jurisdictions/in-ka-bengaluru-south.yaml` pointing to local `data/sources/in-ka-bengaluru-south/*` paths;
   - `DoclingLayoutAdapter` aliasing `Pypdfium2Adapter().parse()` with a `"1.0.0"` version fallback and `TesseractOcrAdapter` inventing synthetic `[0.05, y0, 0.95, y1]` bounding boxes;
   - no structural CI provenance gate (Rules R15 & R16) to block local `source_url`s, missing HTTP retrieval records, or tool-generated PDFs (`fpdf`, `StructuredBuildingBylaws`) in non-test jurisdictions;
   - outdated documentation (`README.md`, `docs/`) that still describes synthetic data as real.
2. **Consequence of inaction**: Without a structural provenance gate, real parser wiring, and clean separation of test fixtures from public jurisdictions, subsequent acquisition and structuring PRs (PRs 04–05) cannot verify authentic provenance or run real Docling layout/table extraction.
3. **Why this approach**: Implementing the R15/R16 provenance gate, moving synthetic generation strictly to `pipeline/tests/fixtures/build_synthetic_jurisdiction.py` (`xx-synthetic-city`), installing and wiring real Docling and Tesseract adapters, syncing all Python/system/web dependencies behind `make setup`, and rewriting the documentation establishes an honest, reproducible foundation before Schema 1.3 (PR 03) and real document acquisition (PR 04).

## What Changes

### 1. Provenance Gate (Rules R15 & R16) and `bylaws verify-sources`

- **Schema updates (`schemas/document.schema.json`, `schemas/jurisdiction.schema.json`)**:
  - Define `$defs/retrievalRecord` (`RetrievalRecord`) with:
    - `fetched_at` (`string`, minLength 10)
    - `requested_url` (`string`, `^https?://`)
    - `final_url` (`string`, `^https?://`)
    - `http_status` (`integer`, minimum 100, maximum 599)
    - `content_type` (`["string", "null"]`)
    - `content_length` (`["integer", "null"]`, minimum 0)
    - `response_headers` (`object` with optional `etag`, `last_modified`, `server`, `date`)
    - `sha256` (`string`, `^[a-f0-9]{64}$`)
    - `archive_url` (`["string", "null"]`)
    - `archive_failure_reason` (`["string", "null"]`)
    - `fetched_by` (`string`, minLength 1 — `"agent"` or a named person)
  - Add `retrieval` (`RetrievalRecord | null`) to `document.schema.json` and to `documentConfig` / map source configs in `jurisdiction.schema.json`.
  - Add `acquisition_status` (`enum: ["acquired", "pending", "not_found", "reference_only"]`, default `"acquired"`) to `documentConfig` in `jurisdiction.schema.json` and `document.schema.json`.
  - Add `release_version` (`["string", "null"]`, pattern `^\d+\.\d+\.\d+$`) to `jurisdiction.schema.json`.
  - Run `make generate` to regenerate `pipeline/bylaws/models/_generated.py` and `lib/types/generated.ts`.
- **`bylaws acquire` (`pipeline/bylaws/acquire.py`)**:
  - Use `httpx` with descriptive `User-Agent`, polite retries, and redirect following (`follow_redirects=True`).
  - After every HTTP(S) download, request a Wayback Machine snapshot (`https://web.archive.org/save/<final_url>`) and record the snapshot URL in `retrieval.archive_url`; if the archive request fails or times out, record why in `retrieval.archive_failure_reason`.
  - Populate the full `retrieval` block in `<doc_id>.meta.json`.
  - Skip documents with `acquisition_status: "pending"` or `"not_found"`.
- **Provenance gate (`pipeline/bylaws/provenance.py` and `bylaws check-provenance`, plus pytest in CI)**:
  - Fail the build if:
    1. Any non-test jurisdiction (`visibility != "test"`) has a `file://`, relative, or local `source_url` on any document or map entry.
    2. Any non-test acquired source (`acquisition_status == "acquired"` and `text_rights.mode != "reference_only"`) in `jurisdictions/<id>.yaml`, `data/raw/<id>/*.meta.json`, or `public/data/<id>/**/documents.json` lacks a complete `retrieval` block (including `archive_url` or `archive_failure_reason`).
    3. Any PDF in a non-test jurisdiction (or anywhere outside `pipeline/tests/fixtures/` and `data/raw/xx-*`) has PDF metadata `Creator` or `Producer` matching a configurable denylist in `bylaws.toml` (`["fpdf", "pypdf", "reportlab", "structuredbuildingbylaws"]`).
- **`bylaws verify-sources --jurisdiction <id>` (`pipeline/bylaws/cli.py`, `pipeline/bylaws/provenance.py`) & `.github/workflows/verify-sources.yml`**:
  - Refetches each acquired HTTP(S) source for `<id>` and compares the SHA-256 with the recorded `sha256` (exiting non-zero on mismatch or dead link).
  - Add `.github/workflows/verify-sources.yml` running weekly (`cron: "0 4 * * 1"`) and via `workflow_dispatch`, opening a GitHub issue on failure.

### 2. Move Generated Data to Fixtures and Clean `data/`

- Move `scripts/build_bengaluru_south_sources.py` to `pipeline/tests/fixtures/build_synthetic_jurisdiction.py` and scrub all real authority names, city names, place names, notification numbers, and URLs so it generates only a synthetic test jurisdiction `xx-synthetic-city` (`visibility: "test"`, `name: "Synthetic Demonstration City"`).
- Delete `scripts/build_bengaluru_south_sources.py`.
- Delete all generated Bengaluru South files from `data/` and `docs/`:
  - `data/sources/in-ka-bengaluru-south/` (and remove `data/sources/` entirely)
  - `data/overrides/in-ka-bengaluru-south/`
  - `data/reports/in-ka-bengaluru-south/`
  - `docs/sources/in-ka-bengaluru-south.md`
  - `docs/decisions/004-bengaluru-south-parser-and-map-decisions.md`
- Reset `jurisdictions/in-ka-bengaluru-south.yaml`:
  - `visibility: public`, `release_version: null`
  - List the core documents from the PR 04 starting list with real `http(s)` URLs and `acquisition_status: pending`, and empty `maps: { boundaries: [], zoning: [] }`. Zero local paths.

### 3. Real Parsing Tools (`Docling`, `Tesseract`, `pdfplumber`) and Strict Version/Release Rules (Rules R7 & R8)

- Install `docling`, `pdfplumber`, and `pytesseract` in `pipeline/pyproject.toml` and `pipeline/uv.lock`.
- Update `DoclingLayoutAdapter` (`pipeline/bylaws/parsers/layout_table_adapter.py`):
  - Remove the alias that called `Pypdfium2Adapter().parse(pdf_path)`.
  - Call real `docling.document_converter.DocumentConverter` to parse the PDF into Markdown, blocks (with normalized `[x0, y0, x1, y1]` page bounding boxes where available, or `bbox: null` when unavailable), and structured `ParsedTable` objects.
- Update `TesseractOcrAdapter` (`pipeline/bylaws/parsers/layout_table_adapter.py`):
  - Never invent bounding boxes (`bbox: null` when word positions are not extracted, Rule R8).
  - Read version from `importlib.metadata.version("pytesseract")` and fail loudly (`click.ClickException`, Rule R7) if `pytesseract` or the `tesseract` binary is missing when OCR is invoked.
- Update `_resolve_adapter_version(pkg_name)` across all parser adapters:
  - Read strictly from `importlib.metadata.version(pkg_name)` with no fallback to `"pypdfium2"` or `"1.0.0"`; raise `click.ClickException` if the package is not installed (Rule R7).
- Update `bylaws publish` (`pipeline/bylaws/publish.py`, `pipeline/bylaws/cli.py`):
  - Read release version from `config.release_version`; fail loudly (`click.ClickException`) if `config.release_version` is absent/null and no explicit version is configured. Set `release_version: "0.1.0"` in `jurisdictions/xx-test-fixture.yaml`.
- Update `docs/dependencies.md` and `pipeline/tests/test_r4_licences.py` to verify all new Python packages and Docling models against the R4 permissive licence allowlist.

### 4. Full Dependency Sync and `make setup`

- Update `pipeline/pyproject.toml` and `pipeline/uv.lock` with: `docling`, `pypdfium2`, `pdfplumber`, `pyproj`, `shapely`, `geopandas`, `rasterio`, `opencv-python-headless`, `scikit-image`, `httpx`, `pytesseract`.
- Update `.github/workflows/ci.yml`:
  - Install system packages `tesseract-ocr`, `tesseract-ocr-eng`, `gdal-bin`, `libgdal-dev`.
  - Cache Docling models (`~/.cache/huggingface` and `~/.cache/docling`).
  - Run `uv run bylaws parse --jurisdiction xx-test-fixture --parser docling` and `uv run bylaws check-provenance` in CI.
- Update `Makefile` with `make setup`, `make test`, `make check-provenance`, and `make generate`.

### 5. README and Documentation Sync

- Rewrite `README.md`: what the project is; current status in plain words (synthetic release withdrawn; real acquisition under way; what is published); scope (the three tiers and inclusion test); how to install and run (`make setup`); how provenance works; licences; how to contribute corrections.
- Create `docs/provenance.md`: how every source enters the dataset, the retrieval record, archive links, the CI gate, `verify-sources`, and how anyone can check a clause against its source.
- Create `docs/architecture.md`: pipeline stages, data layout, web app, hosting.
- Create `docs/scope.md`: the three tiers and the inclusion test from `00-overview.md`.
- Create `docs/decisions/2026-11-24-audit-3.md`: what happened in Audit 3, why, and the structural fixes.
- Update `docs/progress.md` to mark PR 02 complete, and update `docs/data-sources.md` and `docs/specs/index.md` so no document describes generated data as real.

## Affected Memory

- `architecture/overview`: (modify) Document R15/R16 provenance gate (`bylaws check-provenance`, `bylaws verify-sources`), real Docling and Tesseract adapters, config-driven `release_version`, `make setup`, and removal of synthetic Bengaluru South files.
- `schemas/data-contracts`: (modify) Document `RetrievalRecord` (`retrieval`), `acquisition_status`, and `release_version` in `document.schema.json` and `jurisdiction.schema.json`.

## Impact

- **Schemas & Codegen**: `schemas/document.schema.json`, `schemas/jurisdiction.schema.json`, `pipeline/bylaws/models/_generated.py`, `lib/types/generated.ts`.
- **Pipeline**: `pipeline/pyproject.toml`, `pipeline/uv.lock`, `pipeline/bylaws/acquire.py`, `pipeline/bylaws/provenance.py` (new), `pipeline/bylaws/cli.py`, `pipeline/bylaws/publish.py`, `pipeline/bylaws/validate.py`, `pipeline/bylaws/parsers/layout_table_adapter.py`, `pipeline/bylaws/parsers/pypdfium2_adapter.py`.
- **Fixtures & Data**: `pipeline/tests/fixtures/build_synthetic_jurisdiction.py` (moved/scrubbed from `scripts/build_bengaluru_south_sources.py`), `jurisdictions/in-ka-bengaluru-south.yaml`, `jurisdictions/xx-test-fixture.yaml`, deletion of `data/sources/in-ka-bengaluru-south/`, `data/overrides/in-ka-bengaluru-south/`, `data/reports/in-ka-bengaluru-south/`, `docs/sources/in-ka-bengaluru-south.md`.
- **CI & Build**: `.github/workflows/ci.yml`, `.github/workflows/verify-sources.yml` (new), `Makefile`, `bylaws.toml`.
- **Docs**: `README.md`, `docs/provenance.md`, `docs/architecture.md`, `docs/scope.md`, `docs/decisions/2026-11-24-audit-3.md`, `docs/dependencies.md`, `docs/data-sources.md`, `docs/progress.md`, `docs/specs/index.md`.

## Open Questions

None — all requirements are specified in `docs/plans/pr-series/00-overview.md` and `docs/plans/pr-series/02-provenance-gate-and-repo-sync.md`.

## Assumptions

| # | Grade | Decision | Rationale | Scores |
|---|-------|----------|-----------|--------|
| 1 | Certain | Add `acquisition_status: "pending"` to `in-ka-bengaluru-south.yaml` core documents so `bylaws check-provenance` validates URLs are remote `http(s)` while `bylaws acquire` waits for PR 04 to fetch them | Explicitly specified in `02-provenance-gate-and-repo-sync.md` §2 | S:95 R:90 A:95 D:95 |
| 2 | Certain | Configure PDF creator/producer denylist in `bylaws.toml` (`fpdf`, `pypdf`, `reportlab`, `StructuredBuildingBylaws`) enforced by `bylaws check-provenance` | Explicitly specified in `02-provenance-gate-and-repo-sync.md` §1 | S:95 R:95 A:95 D:95 |
| 3 | Certain | Require `release_version` in jurisdiction YAML for `bylaws publish` and fail loudly when absent | Explicitly specified in `02-provenance-gate-and-repo-sync.md` §3 | S:95 R:90 A:95 D:95 |
| 4 | Certain | Use `bbox: null` in `TesseractOcrAdapter` when real word boxes are not present rather than synthetic line coordinates | Explicitly specified in `02-provenance-gate-and-repo-sync.md` §3 (Rule R8) | S:95 R:95 A:95 D:100 |

4 assumptions (4 certain, 0 confident, 0 tentative, 0 unresolved).
