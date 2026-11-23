---
type: memory
description: "Two-half local Python pipeline and read-only Next.js web application architecture, repository layout, mandatory --jurisdiction CLI contract, and Rules R1–R6."
---
# System Architecture & Core Invariants

**Domain**: architecture

## Overview
`bylaws-india` is a curated, versioned, machine-readable dataset and web viewer for Indian building and municipal bylaws. The repository is split into an offline Python data pipeline (`pipeline/`) and a read-only Next.js web application at the repository root (`app/`, `components/`, `lib/`, `public/`, with `.vercelignore` excluding `pipeline/` so Vercel deploys a single `bylaws-india` project), connected strictly through versioned JSON and GeoJSON data contracts defined in [data-contracts](/schemas/data-contracts.md) (a5ou).

## Requirements

### Requirement: Two-Half Architecture and Repository Layout
The repository MUST maintain a strict boundary between the local Python processing pipeline (`pipeline/`) and the read-only Next.js web viewer at the repository root (`app/`, `components/`, `lib/`), sharing declarative jurisdiction configurations in `jurisdictions/` and JSON Schemas in `schemas/` (a5ou). Working directories `data/raw/`, `data/interim/`, and `data/processed/` MUST be gitignored, whereas manual curation files in `data/overrides/<jurisdiction>/` and verification reports in `data/reports/<jurisdiction>/` MUST be tracked in version control (a5ou).

#### Scenario: Clean Repository Inspection
- **GIVEN** a clean checkout of the repository
- **WHEN** the directory structure and `.gitignore` rules are inspected
- **THEN** `pipeline/`, `app/`, `components/`, `lib/`, `schemas/`, `jurisdictions/`, `data/overrides/`, `data/reports/`, and `docs/` are present and tracked
- **AND** `data/raw/`, `data/interim/`, and `data/processed/` are ignored by git

### Requirement: Mandatory CLI Jurisdiction Parameter (Rule R1)
The `bylaws` CLI (`pipeline/bylaws/cli.py`) MUST expose subcommands for all pipeline stages (`acquire`, `parse`, `compare`, `structure`, `amendments`, `apply-overrides`, `validate`, `geo`, `publish`) (a5ou). Every subcommand MUST require `--jurisdiction <id>` with no default value (a5ou). Neither `pipeline/` nor the root Next.js source files (`app/`, `components/`, `lib/`) SHALL contain hard-coded jurisdiction IDs, city names, planning district numbers, zone code lists, or bounding coordinates (a5ou).

#### Scenario: CLI Invocation Without Jurisdiction
- **GIVEN** the installed `bylaws` CLI in `pipeline/`
- **WHEN** any subcommand is invoked without `--jurisdiction`
- **THEN** the CLI exits with a non-zero status code and reports `--jurisdiction` as a required option

#### Scenario: Static R1 Hard-Coding Audit
- **GIVEN** all source files in `pipeline/bylaws/`, `app/`, `components/`, and `lib/`
- **WHEN** `pipeline/tests/test_r1_no_hardcoding.py` executes
- **THEN** zero strings from non-fixture `jurisdictions/*.yaml` files or prohibited jurisdiction sentinel terms appear in application code, and no CLI `--jurisdiction` option defines a default value

### Requirement: Core Engineering Rules (Rules R1–R6)
All pipeline stages and web components MUST uphold the six non-negotiable engineering invariants (a5ou):
- **R1 (Zero Jurisdiction Hard-Coding)**: Jurisdiction-specific metadata resides exclusively in `jurisdictions/<id>.yaml` and `data/overrides/<jurisdiction>/`.
- **R2 (Mandatory Provenance)**: Every clause carries `doc_id`, `pages`, and `verification`; every zone feature carries `source_map`, `georef_run`, `extraction_method`, and `verification`.
- **R3 (Explicit Legal Status)**: Documents and clause trees carry an explicit `legal_status`, and `draft` artifacts are published separately from `in_force` regulations and badged in the UI.
- **R4 (Permissive Licensing)**: Dependencies are restricted to permissive licences (`MIT`, `Apache-2.0`, `BSD`, `LGPL` library imports without copied code); `AGPL` packages (`PyMuPDF`, `Unstract`, `MinerU`) are prohibited.
- **R5 (Immutable Raw Sources)**: Downloaded files in `data/raw/` are never modified in place and are verified via SHA-256 checksums in `<doc_id>.meta.json`.
- **R6 (Deterministic Reproducibility)**: Generated files in `data/processed/` are never hand-edited; all manual corrections, zone tags, and map curations are committed under `data/overrides/<jurisdiction>/*.yaml`.

#### Scenario: Offline Synthetic Fixture Execution
- **GIVEN** the synthetic fixture configuration `jurisdictions/_fixture-test.yaml` and assets in `pipeline/tests/fixtures/`
- **WHEN** the pipeline and web test suites run in CI without external network access
- **THEN** configuration loading, schema validation, R1 static checks, and web component tests execute deterministically

### Requirement: Read-Only Web Application and Centralized Data Client
The Next.js App Router application at the repository root (`app/`, `components/`, `lib/`) MUST read published datasets exclusively through `lib/data.ts`, resolving `process.env.NEXT_PUBLIC_MANIFEST_URL` with a fallback to `/data/manifest.json` (a5ou). The application MUST expose routes for the jurisdiction picker (`/`), map and clause explorer (`/j/[id]`), clause browser (`/j/[id]/clauses`), and map review viewer (`/j/[id]/review`), rendering a persistent prototype disclaimer banner and an opt-in draft regulations toggle (off by default) on `/j/[id]` (a5ou).

#### Scenario: Dynamic Jurisdiction Picker Rendering
- **GIVEN** a release manifest containing multiple jurisdictions
- **WHEN** the root picker page (`/`) renders
- **THEN** every jurisdiction entry from the manifest is listed dynamically without preselecting or hard-coding any city

## Design Decisions

### Permissive PDF and Geospatial Stack (R4 Licensing Hygiene)
**Decision**: Use `Docling` (MIT) as the primary PDF parser and `pdfplumber` (MIT) + `pypdfium2` (Apache-2.0/BSD) as the comparison parser and page rasterizer, paired with `rasterio`, `pyogrio`, `shapely`, `geopandas`, `opencv-python-headless`, and `scikit-image` for geospatial processing (`docs/decisions/001-parsers-and-licences.md`).
**Why**: Complies with Rule R4 by avoiding AGPL-3.0 libraries, executes locally without mandatory proprietary API keys, and supports side-by-side parser comparison.
**Rejected**: `PyMuPDF` (`fitz`), `Unstract`, and `MinerU` due to AGPL-3.0 licensing restrictions; `LLMWhisperer` as a required dependency due to proprietary API key requirements.
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
