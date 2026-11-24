# PR 02 — Provenance Gate and Repository Sync

**Read first:** `00-overview.md` · **Depends on:** PR 01 · **Estimate:** 1.5–2 days · **Checkpoint:** owner reviews and merges

## Goal

Make it structurally impossible for generated data to be published as real, install the real tools, and bring the README and docs in line with reality.

## Work

### 1. Provenance gate (R15, R16)
- Add a `retrieval` block to the document and source-file schema: `fetched_at`, `requested_url`, `final_url`, `http_status`, `content_type`, `content_length`, `response_headers` (ETag, Last-Modified, Server, Date), `sha256`, `archive_url` or `archive_failure_reason`, `fetched_by` (`agent` or a named person).
- `bylaws acquire` fills this block for every download. Use a descriptive User-Agent, polite retries, and follow redirects.
- **Archive:** after a successful fetch, request a Wayback Machine snapshot (Save Page Now) and record the snapshot URL; if it fails, record why.
- **CI checks** (fail the build):
  - any non-test jurisdiction with a `file://`, relative or local `source_url`;
  - any non-test source without a complete `retrieval` block;
  - any PDF (in fixtures or data) whose metadata Creator or Producer matches a repository tool (`fpdf`, `StructuredBuildingBylaws`, or any name in a configurable denylist) in a non-test jurisdiction.
- **`bylaws verify-sources --jurisdiction <id>`:** refetches each source and compares the SHA-256 with the recorded one. Run it in a scheduled GitHub Actions workflow (weekly) that opens an issue on mismatch or dead link. Not run on every push (network).
- Raw files are **not committed** (owner decision). They are cached locally under `data/raw/` (gitignored) and refetched as needed.
- Tests: a planted local source fails CI; a planted fpdf-generated PDF in a non-test jurisdiction fails CI; a valid retrieval record passes.

### 2. Move generated data to fixtures
- Move `scripts/build_bengaluru_south_sources.py` to `pipeline/tests/fixtures/` and rename it for what it is (e.g. `build_synthetic_jurisdiction.py`).
- Its output becomes a test jurisdiction `xx-synthetic-city` with `visibility: test`, a name that contains "Synthetic", and no reference to any real authority, place or URL.
- Remove every generated Bengaluru South file from `data/` and `web/public/data/`.
- Reset `jurisdictions/in-ka-bengaluru-south.yaml`: list the core documents with real `http(s)` URLs from the register (see PR 04 starting list) and `acquisition_status: pending`. No local paths.

### 3. Real parsing tools
- Install **Docling** (pinned version) and make the `docling` adapter call Docling. Remove the alias that renamed pypdfium2 output.
- Install Tesseract (system package in CI) with English data. OCR output without real word positions gets `bbox: null`, never invented coordinates (R8).
- Parser versions read from installed package metadata; if a package is missing, the adapter fails loudly (R7), never reports "1.0.0".
- Release version read from jurisdiction config; `publish` fails if absent.
- Check every new dependency and model against the R4 allowlist; record in `docs/dependencies.md`.

### 4. Full dependency sync
- Python: update `pyproject.toml` and the uv lockfile with all pipeline dependencies (Docling, pypdfium2, pdfplumber, pyproj, shapely, geopandas, rasterio, opencv-python-headless, scikit-image, httpx or requests). System packages (GDAL, Tesseract) listed in the README and installed in CI.
- Web: update `package.json` and lockfile; remove unused packages.
- CI caches Docling models to keep runs fast.
- A `make setup` (or equivalent script) installs everything from a clean checkout; document it.

### 5. README and docs
- **README.md:** what the project is; current status in plain words (synthetic release withdrawn; real acquisition under way; what is published); scope (the inclusion test); how to install and run; how provenance works; licences; how to contribute corrections.
- **docs/provenance.md:** how every source enters the dataset, the retrieval record, archive links, the CI gate, `verify-sources`, and how anyone can check a clause against its source.
- **docs/architecture.md:** pipeline stages, data layout, web app, hosting.
- **docs/scope.md:** the three tiers and the inclusion test from `00-overview.md`.
- **docs/decisions/2026-11-24-audit-3.md:** what happened, why, and the structural fixes.
- **docs/progress.md:** reset to this PR series.
- Remove or correct any doc that describes generated data as real.

## Acceptance

- [ ] Planted local source and planted generated PDF both fail CI (tests shown failing first).
- [ ] No generated Bengaluru South file anywhere in `data/` or `web/public/data/`.
- [ ] Synthetic fixture renamed, `visibility: test`, no real names or URLs.
- [ ] Docling actually runs in CI on the fixture; no adapter alias; no invented OCR boxes.
- [ ] Clean-checkout setup works from the README instructions.
- [ ] README and docs describe the project truthfully.
- [ ] CI green.
