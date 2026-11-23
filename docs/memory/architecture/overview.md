---
type: memory
description: "Two-half local Python pipeline and read-only Next.js web application architecture, repository layout, open-data governance, CLI contract, and Rules R1–R9."
---
# System Architecture & Core Invariants

**Domain**: architecture

## Overview
`bylaws-india` is an open-code (Apache-2.0) and open-data (CC BY 4.0) machine-readable dataset and web viewer for Indian building and municipal bylaws (a5ou, 8ay2). The repository is split into an offline Python 3.12+ data pipeline (`pipeline/`) and a read-only Next.js web application at the repository root (`app/`, `components/`, `lib/`, `public/`, with `.vercelignore` excluding `pipeline/` so Vercel deploys a single `bylaws-india` project), connected strictly through versioned JSON and GeoJSON data contracts defined in [data-contracts](/schemas/data-contracts.md) (a5ou, 8ay2).

## Requirements

### Requirement: Two-Half Architecture, Repository Root Discovery, and Open-Data Governance
The repository MUST maintain a strict boundary between the local Python processing pipeline (`pipeline/`, pinned to Python `3.12` via `.python-version` and `pipeline/.python-version`) and the read-only Next.js web viewer at the repository root (`app/`, `components/`, `lib/`, `public/`), sharing declarative jurisdiction configurations in `jurisdictions/` and JSON Schemas in `schemas/` (a5ou, 8ay2). Repository root discovery (`resolve_repo_root()` in `pipeline/bylaws/root.py`) MUST resolve the repository root deterministically in priority order: `--root <path>` CLI option on `bylaws`, `BYLAWS_ROOT` environment variable, or an upward directory walk from `Path.cwd()` for the `bylaws.toml` root marker file, raising `click.ClickException` if none is found (8ay2). Working directories `data/raw/`, `data/interim/`, and `data/processed/` MUST be gitignored, whereas manual curation files in `data/overrides/<jurisdiction>/`, verification reports in `data/reports/<jurisdiction>/`, and open-data governance files (`LICENSE` under Apache-2.0, `LICENSE-DATA.md` under CC BY 4.0 with attribution to `"Structured Building Bylaws"`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `CITATION.cff`, `docs/dependencies.md`, and `docs/data-sources.md`) MUST be tracked in version control (a5ou, 8ay2).

#### Scenario: Clean Repository and Root Discovery Inspection
- **GIVEN** a clean checkout of the repository
- **WHEN** the directory structure, open-data governance files, and `resolve_repo_root()` are inspected
- **THEN** `bylaws.toml`, `LICENSE`, `LICENSE-DATA.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `CITATION.cff`, `docs/dependencies.md`, `docs/data-sources.md`, `pipeline/`, `app/`, `components/`, `lib/`, `schemas/`, `jurisdictions/`, `data/overrides/`, and `data/reports/` are present and tracked
- **AND** `resolve_repo_root()` resolves the root via `--root`, `BYLAWS_ROOT`, or upward walk for `bylaws.toml` and raises `click.ClickException` outside a valid tree

### Requirement: Mandatory CLI Jurisdiction Parameter and Pipeline Subcommands (Rule R1)
The `bylaws` CLI (`pipeline/bylaws/cli.py`) MUST expose subcommands for all pipeline stages (`acquire`, `parse`, `compare`, `structure`, `amendments`, `apply-overrides`, `validate`, `geo`, `publish`) and the end-to-end orchestrator `run-all` (`acquire → parse → structure → amendments → geo → apply-overrides → validate → publish`, halting immediately and reporting the stage name on failure) (a5ou, 8ay2). Every subcommand MUST require `--jurisdiction <id>` with no default value (a5ou). Neither `pipeline/` nor the root Next.js source files (`app/`, `components/`, `lib/`) SHALL contain hard-coded jurisdiction IDs, city names, planning district numbers, zone code lists, or bounding coordinates, nor the strings `"prototype"` (case-insensitive) or `"(example)"` in web source or jurisdiction display names (a5ou, 8ay2).

#### Scenario: CLI Invocation Without Jurisdiction
- **GIVEN** the installed `bylaws` CLI in `pipeline/`
- **WHEN** any subcommand is invoked without `--jurisdiction`
- **THEN** the CLI exits with a non-zero status code and reports `--jurisdiction` as a required option

#### Scenario: Static R1 Hard-Coding Audit
- **GIVEN** all source files in `pipeline/bylaws/`, `app/`, `components/`, `lib/`, and `jurisdictions/*.yaml`
- **WHEN** `pipeline/tests/test_r1_no_hardcoding.py` executes
- **THEN** zero strings from non-fixture `jurisdictions/*.yaml` files (skipping only synthetic fixtures with `country == "XX"`) or prohibited jurisdiction sentinel terms appear in application code, zero `"prototype"` or `"(example)"` strings appear in web source or jurisdiction names, and no CLI `--jurisdiction` option defines a default value

### Requirement: Core Engineering Rules (Rules R1–R9)
All pipeline stages and web components MUST uphold the nine non-negotiable engineering invariants (a5ou, 8ay2):
- **R1 (Zero Jurisdiction Hard-Coding)**: Jurisdiction-specific metadata resides exclusively in `jurisdictions/<id>.yaml` and `data/overrides/<jurisdiction>/`; synthetic test fixtures use `country: XX` (such as `jurisdictions/xx-test-fixture.yaml`) and standard lowercase hyphenated IDs (a5ou, 8ay2).
- **R2 (Mandatory Provenance)**: Every clause carries `doc_id`, `citations` (with 1-based `page`, normalized `[x0, y0, x1, y1]` `bbox`, and `text_excerpt`), and `verification`; every zone feature carries `source_map`, `georef_run`, `extraction_method`, `source_attribution`, and `verification` (a5ou, 8ay2).
- **R3 (Explicit Legal Status)**: Documents, clause trees, and clauses carry an explicit `legal_status`, and `draft` artifacts are published separately from `in_force` regulations and badged in the UI (a5ou, 8ay2).
- **R4 (Strict Permissive-Only Licensing)**: All Python distributions and npm packages are restricted to permissive licences (`MIT`, `Apache-2.0`, `BSD`, `ISC`, `PSF-2.0`, `LGPL` library imports without copied code); `GPL`, `AGPL` (`PyMuPDF`, `Unstract`, `MinerU`, `Marker`), and non-commercial licences are prohibited and enforced by `pipeline/tests/test_r4_licences.py` in CI, which also verifies that every direct dependency in `pipeline/pyproject.toml` and `package.json` is listed in `docs/dependencies.md` (a5ou, 8ay2).
- **R5 (Immutable Raw Sources)**: Downloaded files in `data/raw/` are never modified in place and are verified via SHA-256 checksums in `<doc_id>.meta.json` (a5ou, 8ay2).
- **R6 (Deterministic Reproducibility)**: Generated files in `data/processed/` are never hand-edited; all manual corrections, zone tags, and map curations are committed under `data/overrides/<jurisdiction>/*.yaml` (a5ou).
- **R7 (Fail Loudly on Unbuilt Stages and Paths)**: Unimplemented CLI commands, parser adapters, or geospatial paths (`bylaws compare`, `bylaws parse --parser docling`, `bylaws geo` for `kind: "traced"`, and unbuilt `geo` submodules `rasterize.py`, `gcp.py`, `georef.py`, `verify.py`) raise `click.ClickException` or `NotImplementedError` with `"not implemented: <component>"` and exit non-zero; `validate` enumerates every check executed in `data/reports/<jurisdiction>/qa.md` and fails if expected processed artifacts are missing (8ay2).
- **R8 (No Defaults That Strengthen a Claim)**: Neither the pipeline nor the web UI supplies fallback defaults for missing regulatory status or source pages; missing `legal_status` renders `STATUS UNKNOWN` in `StatusBadge`, and a clause without a citation page renders `"No source page recorded"` without an anchor link in `ClausePanel` and `ClauseTree` (8ay2).
- **R9 (Immutable Human-Verified Records)**: Records with `verification: "human_verified"` are never mutated in place by `apply-overrides`; when an override targets a `human_verified` clause or zone, the existing `<id>@v<N>` record is retained with `superseded_by` set to `<id>@v<N+1>` and a new `<id>@v<N+1>` record is appended with `supersedes` set to `<id>@v<N>` (8ay2).

#### Scenario: Offline Synthetic Fixture End-to-End Execution and Golden Snapshot Verification
- **GIVEN** the synthetic fixture configuration `jurisdictions/xx-test-fixture.yaml` (`country: XX`), synthetic PDF/KML/GeoJSON assets in `pipeline/tests/fixtures/`, and overrides in `data/overrides/xx-test-fixture/overrides.yaml`
- **WHEN** `bylaws run-all --jurisdiction xx-test-fixture` and `pipeline/tests/test_golden_fixture.py` run offline in CI
- **THEN** all eight pipeline stages (`acquire`, `parse`, `structure`, `amendments`, `geo`, `apply-overrides`, `validate`, `publish`) succeed in sequence, publishing `documents.json`, `.clauses.json`, `amendments.json`, `zones.geojson`, `boundary.geojson`, `declarations.json`, `xx-test-fixture-0.1.0.zip`, `SHA256SUMS`, and `public/data/manifest.json` matching the committed golden snapshots in `pipeline/tests/golden/xx-test-fixture/`

### Requirement: Read-Only Web Application and Centralized Data Client
The Next.js App Router application at the repository root (`app/`, `components/`, `lib/`) MUST read published datasets exclusively through `lib/data.ts`, resolving `process.env.NEXT_PUBLIC_MANIFEST_URL` with a fallback to `/data/manifest.json` (a5ou). The application MUST expose routes for the jurisdiction picker (`/`), map and clause explorer (`/j/[id]`), clause browser (`/j/[id]/clauses`), and map review viewer (`/j/[id]/review`), rendering a persistent informational legal disclaimer banner and an opt-in draft regulations toggle (off by default) on `/j/[id]` (a5ou, 8ay2).

#### Scenario: Dynamic Jurisdiction Picker Rendering
- **GIVEN** a release manifest containing multiple jurisdictions
- **WHEN** the root picker page (`/`) renders
- **THEN** every jurisdiction entry from the manifest is listed dynamically without preselecting or hard-coding any city

## Design Decisions

### Permissive PDF and Geospatial Stack (R4 Licensing Hygiene)
**Decision**: Use `pypdfium2` (Apache-2.0/BSD-3-Clause) and `Docling` (MIT) with `pdfplumber` (MIT) for PDF parsing and page rasterization, paired with `shapely`, `rasterio`, `pyogrio`, `geopandas`, `opencv-python-headless`, and `scikit-image` for geospatial processing (`docs/decisions/001-parsers-and-licences.md`, `docs/decisions/002-open-data-and-indicodes-practices.md`).
**Why**: Complies with Rule R4 by avoiding GPL/AGPL-3.0 and non-commercial libraries or model weights, executes locally without mandatory proprietary API keys, and supports side-by-side parser comparison.
**Rejected**: `PyMuPDF` (`fitz`), `Unstract`, `MinerU`, and `Marker` due to GPL/AGPL-3.0 or non-commercial model weight restrictions; `LLMWhisperer` as a required dependency due to proprietary API key requirements.
*Introduced by*: 261123-a5ou-m0-m1-scaffold-schemas-fixture

### Dual-Mode Manifest Fetching in Web Data Client
**Decision**: Centralize all dataset reads in `lib/data.ts`, resolving `NEXT_PUBLIC_MANIFEST_URL` for Vercel Blob deployments and falling back to `/data/manifest.json` for local static assets and CI tests.
**Why**: Enables offline development and deterministic CI verification while supporting zero-code-change cloud deployment against Vercel Blob storage.
**Rejected**: Hard-coding remote storage URLs in React components or requiring live network requests during unit tests.
*Introduced by*: 261123-a5ou-m0-m1-scaffold-schemas-fixture

### Root Next.js App Layout with `.vercelignore`
**Decision**: Place the Next.js application (`package.json`, `app/`, `components/`, `lib/`, `public/`) directly at the repository root and exclude `pipeline/` via `.vercelignore`.
**Why**: Prevents Vercel's monorepo detector from splitting the repository into separate `web` and `pipeline` deployments or failing with `[PYTHON_ENTRYPOINT_NOT_FOUND]` on `pipeline/pyproject.toml`, ensuring a single `bylaws-india` Vercel deployment.
**Rejected**: Keeping `web/` as a nested subdirectory without root `package.json`, which triggered Vercel's dual `web` + `pipeline` monorepo auto-detection.
*Introduced by*: 261123-a5ou-m0-m1-scaffold-schemas-fixture

### Open-Code (Apache-2.0) and Open-Data (CC BY 4.0) Dual Licensing with Indicodes Rules Practices
**Decision**: License source code under Apache-2.0 (`LICENSE`) and published datasets under CC BY 4.0 (`LICENSE-DATA.md`), and adopt page-bbox citations, `@v<N>` supersede chains for `human_verified` records, and `declarations.json` coverage gap declarations (`docs/decisions/002-open-data-and-indicodes-practices.md`).
**Why**: Permits unrestricted commercial and civic reuse of both code and structured regulatory data while maintaining verifiable page-level provenance, auditability of human review, and explicit disclosure of unmodelled rules.
**Rejected**: Copyleft (`GPL`/`AGPL`) or non-commercial data licences that block downstream civic/commercial integration, or silent omission of unmodelled regulatory documents.
*Introduced by*: 261123-8ay2-m1-5-pipeline-vertical-slice

### Deterministic Repository Root Discovery via Marker File
**Decision**: Resolve the repository root in `pipeline/bylaws/root.py` using explicit `--root <path>`, `BYLAWS_ROOT`, or an upward filesystem walk for `bylaws.toml`.
**Why**: Allows `bylaws` CLI commands and isolated golden tests to execute reliably from any working directory or temporary test root without fragile `__file__` parent-index assumptions.
**Rejected**: Computing the repository root via `Path(__file__).resolve().parents[N]`, which breaks when packages are installed into virtual environments or tested against isolated fixture roots.
*Introduced by*: 261123-8ay2-m1-5-pipeline-vertical-slice

### Immutable Verified Records via In-Array Supersede Chains (Rule R9)
**Decision**: Retain superseded `human_verified` records in the published `clauses` and `features` arrays with `superseded_by` set to `<id>@v<N+1>` and append the updated record with `record_id = "<id>@v<N+1>"` and `supersedes = "<id>@v<N>"`.
**Why**: Preserves an auditable history of human-verified clauses and zones directly inside self-contained release files so the web UI can badge superseded clauses and filter superseded map polygons.
**Rejected**: Mutating `human_verified` records in place or splitting superseded records into separate sidecar files.
*Introduced by*: 261123-8ay2-m1-5-pipeline-vertical-slice
