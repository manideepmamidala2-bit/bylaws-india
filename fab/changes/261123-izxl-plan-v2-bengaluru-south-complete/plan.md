# Plan: Plan v2.0 — Bengaluru South, Complete

**Change**: 261123-izxl-plan-v2-bengaluru-south-complete
**Intake**: `intake.md`

## Requirements

### Schemas: Schema v1.2 Data Contracts & Single-Source Codegen

#### R1: Schema v1.2 Upgrade and Generated Models (Rules R2, R3, R9, R12, R13, R14)
All JSON Schema (Draft 2020-12) files in `schemas/` MUST be upgraded to `schema_version: "1.2"` (`jurisdiction.schema.json`, `document.schema.json`, `clause-tree.schema.json`, `zones.schema.json`, `overrides.schema.json`, `declarations.schema.json`, `amendments.schema.json`, `manifest.schema.json`, plus `consolidated.schema.json`, `geo-layers.schema.json`, and `clause-zone-tags.schema.json` registered in `pipeline/bylaws/schema_validator.py`), and `scripts/generate_models.py` (`make generate`) MUST regenerate `pipeline/bylaws/models/_generated.py` and `lib/types/generated.ts` with zero drift.
Specifically, Schema v1.2 MUST define:
- **Document types (`doc_type`)**: `act | rules | regulations | bye_laws | amendment | notification | government_order | circular | map | standard_reference` (with backward-compatible alias/support for `role`).
- **Layers (`layer`)**: `statute | state_rules | planning | municipal | orders | overlay | national_reference | boundary`.
- **Jurisdiction fields**: `visibility` (`"public" | "test"`), `licence` (e.g. `"CC BY 4.0"`), `documents[]`, `maps`, and declaration fields.
- **Document fields**: `issuing_authority`, `notification_number`, `gazette_reference`, `notified_date`, `effective_from`, `legal_status` (`in_force | draft | superseded | withdrawn | status_unknown`), `status_evidence` (`{ url, quoted_line, description? }`), `superseded_by_document`, `amends[]`, `text_rights` (`{ mode: "full_text" | "reference_only", reason: string }`), `languages[]` (`en | kn`), `official_url`, `mirror_urls[]`, `copies[]` (`{ url, path, sha256, retrieved_at }`), and `cited_provisions[]` (for `reference_only` standards).
- **Clause fields (R12)**: `record_version` (integer >= 1), `record_id` (`<doc_id>:<number>@v<N>`), `record_supersedes`, `record_superseded_by`, `record_change_reason` (maintaining compatibility with `supersedes` / `superseded_by`), `legal_status` (`in_force | draft | superseded | withdrawn | status_unknown`), `effective_from`, `citations[]` (`{ doc_id, page, bbox, text_excerpt }`), `verification` (`unverified | machine_checked | human_verified`), `verified_by`, `language` (`en | kn`).
- **Amendment links**: `amending_clause`, `target_clause`, `action` (`substitute | insert_after | insert_before | omit | modify | renumber`), `effective_date`, `confidence` (`high | medium | low`), `verification`.
- **Consolidated text (`consolidated.schema.json`, R14)**: per target clause per date (`as_of_date`, `clause_id`, `doc_id`, `number`, `title`, `text`, `tables[]`, `amendments_applied[]`, `derived: true`, `method`, `confidence: "high"`), plus `unconsolidated[]` reasons where consolidation was not performed.
- **Geo layers (`geo-layers.schema.json`) & Zone features (`zones.schema.json`)**: `layer_id`, `title`, `kind` (`official_boundary | master_plan_zone | derived_overlay | reference`), `source`, `method`, `accuracy_m`, `derived`, `file`, `external_url`; zone features with `zone_code`, `zone_label`, `planning_district`, `sheet`, `extraction_method` (`vector_pdf | grid_georeferenced_raster | osm_gcp_raster | imported | colour_segmentation | road_outline_fallback | manual`), `verification`, `verified_by`, `record_version`, `record_supersedes`, `record_superseded_by`, `record_change_reason`.
- **Clause–zone tags (`clause-zone-tags.schema.json`)**: `tags[]` with `{ clause_id, doc_id, zone_code, reason, verification }`.
- **Declarations (`declarations.schema.json`)**: `not_modelled[]`, `known_gaps[]`, `unread_documents[]`, `unobtainable_documents[]`, `contested_status[]`, `building_relevant_sections[]`.

- **GIVEN** the Schema v1.2 definitions in `schemas/*.schema.json`
- **WHEN** `make generate` and `pytest pipeline/tests/test_schemas.py` execute
- **THEN** `pipeline/bylaws/models/_generated.py` and `lib/types/generated.ts` regenerate cleanly with zero `git diff`
- **AND** all Schema v1.2 payloads validate via `Draft202012Validator` while invalid payloads fail with field-level `SchemaValidationError`

---

### Architecture: Part A Foundations (Audit 2 Integrity Fixes & Data Wiring)

#### R2: Idempotent Overrides and Mandatory Map Curations (Rules R6, R7, R9, R11, R12)
`pipeline/bylaws/overrides.py` (`bylaws apply-overrides`) MUST be strictly idempotent, preserve YAML key and list order, apply `zone_fixes` and `map_curations` (or reject unapplicable/unknown `map_id` curations loudly with `ClickException`), and never create a new `@v<N+1>` record version when a `clause_fix` or `zone_fix` is a no-op (i.e. the current latest version of the target record already matches the override's field values). When an override modifies a verified record (`human_verified` or `machine_checked` when creating a version history), it MUST increment `record_version`, set `record_superseded_by` on the prior record, and set `record_supersedes` and `record_change_reason` on the new `@v<N+1>` record without mutating `legal_status`.

- **GIVEN** a processed jurisdiction with `overrides.yaml` containing `clause_fixes`, `zone_fixes`, and `map_curations`
- **WHEN** `bylaws apply-overrides --jurisdiction <id>` is executed multiple times in succession
- **THEN** the first run applies actual changes (creating `@v2` where values changed) and subsequent runs produce byte-identical files without creating `@v3`..`@v5` chains
- **AND** any `map_curation` referencing an unknown `map_id` raises `ClickException`

#### R3: Multi-Jurisdiction, Multi-Release `publish` Without Hard-Coded Literals (Rules R1, R6, R7)
`pipeline/bylaws/publish.py` (`bylaws publish`) MUST fail loudly (`ClickException`) if an existing `public/data/manifest.json` is unreadable or invalid JSON, MUST preserve all other jurisdictions in `manifest.json` and all prior releases in `releases[]` for the target jurisdiction, MUST read the release `licence` from the jurisdiction config (`config.licence`), and MUST contain zero fixture literals (`_fixture-test`, `xx-test-fixture`) or hard-coded fallback licence strings. It MUST also export `sources.json` and `sources.csv` (the machine-readable source register) alongside the release bundle.

- **GIVEN** an existing `public/data/manifest.json` containing jurisdiction `A` with release `0.1.0`
- **WHEN** `bylaws publish` runs for jurisdiction `B` (`1.0.0`) or for jurisdiction `A` (`0.2.0`), or runs against a corrupted `manifest.json`
- **THEN** valid runs preserve both jurisdictions `A` and `B` and retain release `0.1.0` alongside `0.2.0`, while a corrupted `manifest.json` exits non-zero with `ClickException`

#### R4: Deterministic `SOURCE_DATE_EPOCH`, Real Parser Versions, and Removal of `country == "XX"` Branches (Rules R1, R6)
All pipeline modules (`acquire.py`, `parsers/`, `structure.py`, `publish.py`) MUST contain zero `country == "XX"` branches. All generated timestamps (`retrieved_at`, `generated`, `released_at`, ZIP member timestamps) MUST derive deterministically from `SOURCE_DATE_EPOCH` (falling back to a single deterministic constant ISO timestamp when `SOURCE_DATE_EPOCH` is unset so repeated runs of any jurisdiction are byte-identical). Parser adapters MUST record the real installed package version (`importlib.metadata.version(...)`) rather than hard-coded `"5.0.0"`.

- **GIVEN** any jurisdiction (synthetic fixture or `in-ka-bengaluru-south`)
- **WHEN** `bylaws run-all --jurisdiction <id>` executes twice in succession
- **THEN** all output files, `.zip` archives, and `SHA256SUMS` are byte-identical across runs, zero `country == "XX"` branches exist in `pipeline/bylaws/`, and parsed page files record the actual installed parser version

#### R5: CRS Validation and Reprojection in `geo` (Rules R2, R7)
`pipeline/bylaws/geo/` (`boundaries.py`, `zones.py`, `georef.py`) MUST inspect the declared Coordinate Reference System (CRS) of every vector/raster geospatial input. Sources with a declared projected CRS (such as `EPSG:32643` UTM Zone 43N) MUST be reprojected to `EPSG:4326` (WGS 84) for GeoJSON output while computing `area_sq_m` in a metric UTM projection (`EPSG:32643`). Any geospatial source lacking a declared CRS (or valid RFC 7946 WGS 84 declaration) MUST be rejected with a `ClickException` or `ValueError`.

- **GIVEN** a boundary or zone vector file in `EPSG:32643` (UTM Zone 43N) and another file with no CRS metadata
- **WHEN** `bylaws geo` processes each source
- **THEN** the `EPSG:32643` features are accurately reprojected to `EPSG:4326` longitude/latitude coordinates and clip cleanly against the boundary, whereas the CRS-less source raises an explicit error

#### R6: Strict Permissive Licence Allowlist Including Transitive npm Packages (Rule R4)
`pipeline/tests/test_r4_licences.py` MUST enforce an explicit permissive licence allowlist (`MIT`, `Apache-2.0`, `BSD-2-Clause`, `BSD-3-Clause`, `BSD`, `ISC`, `PSF-2.0`, `0BSD`, `CC0-1.0`, `Unlicense`, `OFL-1.1`, `MPL-2.0`, plus `LGPL` runtime library imports explicitly documented with a written exception in `docs/dependencies.md`) across all installed Python distributions AND all direct and transitive npm packages in `package-lock.json` / `node_modules`. It MUST reject `GPL`, `GPLv3`, `AGPL`, `UNKNOWN`, or empty licences.

- **GIVEN** installed Python distributions and `package-lock.json` / `node_modules` packages
- **WHEN** `pytest pipeline/tests/test_r4_licences.py` runs (including unit tests with planted `GPLv3`, `UNKNOWN`, and transitive npm violations)
- **THEN** the test suite catches every planted violation and passes on the repository's actual dependency tree

#### R7: Hand-Written Fixture Expectations and General Structure Rules (Rules R1, R11)
`pipeline/bylaws/structure.py` and `pipeline/bylaws/parsers/pypdfium2_adapter.py` MUST remove all fixture-only branches (the `"DRAFT"` banner skip and repeated-heading merge hack) and use general layout rules: column-aware line grouping (not merging across columns separated horizontally), running header/footer stripping across pages, strict hierarchical clause/chapter/part/sub-item recognition (`CHAPTER I`, `1.0`, `1.1`, scoped `(a)`/`(i)` under parent clause IDs like `fixture-base-2020:2.1(a)`), and structured table extraction that attaches tables to their parent clause's `tables[]` array while removing flattened table rows from prose `text`. Golden files in `pipeline/tests/golden/xx-test-fixture/` MUST reflect hand-verified expectations.

- **GIVEN** a multi-column synthetic bylaw page containing `"3.5 m front setback"`, `"2020 amendments shall apply"`, `"CHAPTER III"`, sub-items `(a)` and `(b)`, and `Table 2.1`
- **WHEN** `parse` and `structure` execute
- **THEN** `"3.5 m"` and `"2020"` inside prose are NOT split into false clauses, `"CHAPTER III"` is recognized as a chapter heading, sub-items are scoped to their parent (`<doc_id>:<clause>(a)`), right-column text is not glued onto left-column lines, and `Table 2.1` is populated in `tables[]` and removed from prose `text`

---

### Sources: Part B Bengaluru South Source Register, Acquisition, Parsing, Structuring, Amendments & Consolidation

#### R8: Complete Bengaluru South Source Register and Acquisition (Plan v2.0 §3, §5.B1–B2, Rules R2, R3, R5, R13)
`jurisdictions/in-ka-bengaluru-south.yaml`, `docs/sources/in-ka-bengaluru-south.md`, and `data/reports/in-ka-bengaluru-south/source-discovery.md` MUST catalogue every regulatory source governing construction in Bengaluru South City Corporation across all 7 layers (§3.1 Municipal bye-laws, §3.2 Master plan zoning RMP 2015 + 2014–2026 amendment chain, §3.3 Master plan maps, §3.4 GBA 2025 corporation/zone/ward boundaries, §3.5 State Acts and rules, §3.6 OC/CC government orders and NOC procedures, §3.7 National references `nbc-2016`, `aai-cczm`, `model-bbl-2017`) plus §3.8 reference datasets. Every obtainable document and boundary/map file MUST be acquired with SHA-256 checksums and `.meta.json` provenance; any unobtainable document or contested status (such as `ktcda-act` 2025 amendment) MUST be recorded with `unobtainable_documents` or `legal_status: "status_unknown"` and conflicting evidence in `declarations.json`.

- **GIVEN** `jurisdictions/in-ka-bengaluru-south.yaml`
- **WHEN** `bylaws acquire --jurisdiction in-ka-bengaluru-south` and `bylaws validate --jurisdiction in-ka-bengaluru-south` execute
- **THEN** every source in the register has either a checksum-verified raw copy and `.meta.json` or an explicit entry in `declarations.json` (`unobtainable_documents`), `nbc-2016` and `aai-cczm` are marked `text_rights.mode == "reference_only"`, and `docs/sources/in-ka-bengaluru-south.md` and `data/reports/in-ka-bengaluru-south/source-discovery.md` are complete

#### R9: Reconnaissance, Multi-Adapter Parsing, Complete Document Structuring, and QA (Plan v2.0 §5.B3–B5, Rules R2, R10, R13)
The pipeline MUST support `pypdfium2`, `pdfplumber` / `docling` layout & table extraction, and `tesseract` (`eng` + `kan`) OCR adapters (`pipeline/bylaws/parsers/`), generate `data/reports/in-ka-bengaluru-south/recon.md` and `data/reports/in-ka-bengaluru-south/parser-comparison.md`, and structure every `full_text` document in `in-ka-bengaluru-south` into `<doc_id>.clauses.json` (preserving Kannada clauses verbatim with `language: "kn"` and zero machine translation). `bylaws validate` MUST produce `data/reports/in-ka-bengaluru-south/qa.md` verifying: 100% of clauses have `legal_status`, `effective_from`, and page `citations`; ≥95% have `bbox`; ≥98% content coverage; structured tables or declared gaps; and `machine_checked` verification after the 30-clause self-check.

- **GIVEN** the acquired documents for `in-ka-bengaluru-south`
- **WHEN** `bylaws parse`, `bylaws compare`, `bylaws structure`, `bylaws apply-overrides`, and `bylaws validate` run for `in-ka-bengaluru-south`
- **THEN** `recon.md`, `parser-comparison.md`, and `qa.md` are generated in `data/reports/in-ka-bengaluru-south/`
- **AND** every `full_text` document has a valid `.clauses.json` meeting the QA thresholds (or declaring specific unreadable table/scan gaps in `declarations.json`) with zero records marked `human_verified`

#### R10: Amendment Chains and Consolidated "As Amended" View (Plan v2.0 §5.B6–B7, Rule R14)
`pipeline/bylaws/amendments.py` and `pipeline/bylaws/consolidate.py` MUST link every amending instruction in the `bbl-2003` (including `bscc-bbl-amend-2026` Table 2B and omitted bye-laws 3.8–3.10) and `rmp2015-zr` (2014–2026 amendments, Chapter 11 Premium FAR, setback/parking/stilt/SWD buffer notifications) chains to its target clause with `action`, `effective_date`, and `confidence`, and generate `consolidated.json` containing consolidated clause records (`derived: true`, `method`, `amendments_applied[]`, `as_of_date`) wherever all applicable amendment links are high-confidence, recording unconsolidated clauses with reasons when any link is not high-confidence.

- **GIVEN** base documents (`bbl-2003`, `rmp2015-zr`, `kfs-act-1964`) and their amending instruments
- **WHEN** `bylaws amendments --jurisdiction in-ka-bengaluru-south` runs
- **THEN** `amendments.json` and `consolidated.json` are generated and schema-valid, every consolidated record carries `derived: true` and `amendments_applied`, and chapter insertions / clause omissions / table substitutions are reflected accurately

---

### Maps: Part C Boundaries, Planning Districts, Master Plan Zones, Overlays & Clause–Zone Tags

#### R11: Official Boundaries, Intersecting Planning Districts, Master Plan Zones, and Overlays (Plan v2.0 §5.C1–C4, Rules R2, R5, R10, R14)
`pipeline/bylaws/geo/` MUST produce for `in-ka-bengaluru-south`:
1. **Official boundaries (`kind: "official_boundary"`)**: Bengaluru South City Corporation boundary (`boundary.geojson`), its two GBA zones (`gba-zones.geojson`), and its wards from the 369-ward delimitation (`wards.geojson`).
2. **Planning districts**: Every RMP 2015 planning district intersecting Bengaluru South (`planning-districts.geojson`) identified from the RMP 2015 index map and PLU sheets.
3. **Master plan zones (`kind: "master_plan_zone"`, `zones.geojson`)**: Extracted per sheet (via vector PDF paths `vector_pdf`, UTM 43N grid georeferencing `grid_georeferenced_raster`, OSM GCP raster `osm_gcp_raster`, or authoritative imported layer, with district-outline fallback + declared gap in `declarations.json` if a sheet fails quality thresholds), clipped to the corporation boundary, cross-checked against KSRSAC existing land use, and documented in `data/reports/in-ka-bengaluru-south/map-verification.md`.
4. **Derived overlays (`kind: "derived_overlay"`, `overlays.geojson`, Rule R14)**: Approximate 11 m Namma Metro underground influence zone (`metro-influence-2020`) and any verified buffer overlays, each marked `derived: true` with method and `accuracy_m`, plus `aai-cczm` recorded as a `kind: "reference"` layer in `geo-layers.json` linking to NOCAS without drawing height surfaces.

- **GIVEN** the boundary KMLs, RMP 2015 map sheets, and overlay inputs for `in-ka-bengaluru-south`
- **WHEN** `bylaws geo --jurisdiction in-ka-bengaluru-south` executes
- **THEN** `boundary.geojson`, `gba-zones.geojson`, `wards.geojson`, `planning-districts.geojson`, `zones.geojson`, `overlays.geojson`, `geo-layers.json`, and `data/reports/in-ka-bengaluru-south/map-verification.md` are produced and schema-valid

#### R12: Clause–Zone Tagging with Quoted Reasons (Plan v2.0 §5.C5, Rules R2, R10)
Every zone code present in `zones.geojson`, every overlay in `overlays.geojson`, and universal rules (`ALL`) MUST be linked to their applicable clauses in `clause-zone-tags.json` (and populated onto each clause's `applies_to_zones`), with each tag carrying a quoted `reason` from the clause text and `verification: "machine_checked"`.

- **GIVEN** the structured clauses and zone codes for `xx-test-fixture` and `in-ka-bengaluru-south`
- **WHEN** `bylaws apply-overrides` / `bylaws publish` generates `clause-zone-tags.json`
- **THEN** every zone code has applicable clauses from the zoning regulations, building bye-laws, enabling statutes, and orders, and every tag includes a non-empty quoted `reason` and `verification: "machine_checked"`

---

### Web Application & Release: Part D dg2n Website, Data Wiring, Accessibility & Release 1.0.0

#### R13: Data Wiring, dg2n Visual System, and Eight Routes (Plan v2.0 §5.A2, §5.D, Rules R1, R3, R8, R12, R13, R14)
`lib/data.ts` MUST provide typed loaders for all published release artifacts in `public/data/`. The Next.js application MUST implement the **dg2n visual idiom** (`--paper: #f5f3ed`, `--panel: #efeee8`, `--ink: #080909`, `--muted: #5b5e56`, `--hairline: #c8ccc0`, `--accent: #ff6b52` used **only** for selection border/fill/dot and **never** for text; `Inter Tight`, `Source Serif 4`, `JetBrains Mono` via `next/font/google`; square corners, hairline borders, no cards, no shadows), hide `visibility: "test"` jurisdictions in production while showing them in preview/dev/test, separate record version history (`v2 · corrected from v1`) from legal status (`R12`), and render real data across all routes:
1. **Home (`/`)**: Bengaluru South overview, dataset counts (sources, clauses, tables, zones), latest release, links to Map, Sources, Documents, Timeline, Data, and jurisdiction list.
2. **Map (`/j/[id]`)**: Client-side `react-leaflet` map (`ZoneMap.tsx`) with layer toggles (corporation, GBA zones, wards, planning districts, master plan zones, overlays), zone codes inside polygons, legend from source sheets, accuracy note from layer `method` & `accuracy_m`, coverage note from `declarations.json`, and right-hand clause panel grouped by layer and document with status tag, verification tag, inline amendments, version history expansion, and `"View source p. N"` linking to the official/mirror PDF `#page=N`.
3. **Sources (`/j/[id]/sources`)**: Full source register with layer & status filters, text search, metadata, status evidence quote & link, official/mirror links, SHA-256 checksums, `text_rights` badge, and link to our structured document page.
4. **Document (`/j/[id]/documents/[doc]` and `/j/[id]/clauses`)**: Complete structured document tree, ruled tables, page links, text filter, **Original / As amended (derived)** toggle with R14 derived notice, and `reference_only` view (`nbc-2016`, `aai-cczm`) showing metadata, where to obtain, and citing clauses.
5. **Timeline (`/j/[id]/timeline`)**: Chronological instrument-by-instrument timeline showing what changed and linking to affected clauses.
6. **Data (`/data`)**: Releases, changelog, downloadable `.zip`, `SHA256SUMS`, CC BY 4.0 licence, citation instructions, declarations, and CSV/JSON source register downloads.
7. **About (`/about`)**: Methodology, verification levels, R14 derived explanation, limitations, Apache-2.0 & CC BY 4.0 licences, and attribution.
8. **Review (`/j/[id]/review`)**: Source sheet beside traced zones with overlay opacity slider.

- **GIVEN** the published releases for `xx-test-fixture` (`0.1.0`) and `in-ka-bengaluru-south` (`1.0.0`) in `public/data/`
- **WHEN** the Next.js app builds (`npm run build`) and renders all 8 routes
- **THEN** every route renders real data from `public/data/` with zero empty-array placeholders, `ZoneMap` renders real GeoJSON polygons with Leaflet, record versions (`v2 · corrected from v1`) are never badged as `SUPERSEDED` legal status, and coral `#ff6b52` is never used as a text color

#### R14: Blocking `axe-core` Accessibility Check and Release `1.0.0` Publication (Plan v2.0 §5.D, §9)
Automated `axe-core` WCAG AA checks MUST run in `npm test` (and CI) across rendered pages/components so any WCAG AA violation fails the build. `bylaws run-all --jurisdiction in-ka-bengaluru-south` MUST publish release `1.0.0` into `public/data/` alongside `xx-test-fixture` `0.1.0`, and `docs/plan-v2.md`, `docs/progress.md`, and `docs/decisions/` MUST be up to date.

- **GIVEN** the completed `in-ka-bengaluru-south` release `1.0.0` and web pages
- **WHEN** `pytest`, `npm test` (including `axe-core`), `npm run lint`, `npm run typecheck`, and `npm run build` execute
- **THEN** all checks pass with zero errors and zero WCAG AA violations, and `public/data/manifest.json` serves both `in-ka-bengaluru-south` (`1.0.0`, `visibility: "public"`) and `xx-test-fixture` (`0.1.0`, `visibility: "test"`)

### Non-Goals

- Computable FAR or setback calculators (deferred to next phase, designed for Indicodes Rules compatibility).
- Other GBA corporations beyond Bengaluru South City Corporation (`in-ka-bengaluru-south`).
- Machine translation of Kannada text into English.
- Reproducing copyrighted BIS NBC 2016 text or redistributing AAI CCZM height surfaces.

### Design Decisions

#### Separate Record Version Chain from Legal Status (Rule R12)
**Decision**: Represent record correction history on clauses and zones with `record_version` (integer), `record_supersedes`, `record_superseded_by`, and `record_change_reason`, while reserving `legal_status` (`in_force | draft | superseded | withdrawn | status_unknown`) strictly for regulatory enactment status. Filter superseded record versions (`record_superseded_by != null`) out of default lists and display a compact `"v2 · corrected from v1"` disclosure on the current record.
**Why**: Audit 2 identified a semantic error where the v1.1 UI mapped `superseded_by` on a corrected clause (`1.1@v1`) onto the `SUPERSEDED` legal status badge used for repealed law, displaying `1.1` twice and implying it was repealed.
**Rejected**: Using a single `SUPERSEDED` badge for both repealed legislation and corrected data records.
*Introduced by*: 261123-izxl-plan-v2-bengaluru-south-complete

#### Explicit Text Rights and Derived Work Provenance (Rules R13 & R14)
**Decision**: Add `text_rights: { mode: "full_text" | "reference_only", reason }` to every document and `derived: boolean` + `method: string` to consolidated clause records and geospatial layers. Render `reference_only` documents (`nbc-2016`, `aai-cczm`) as structured citation/metadata hubs without full text, and badge all consolidated clauses and buffered overlays as `"Derived by this project, not an official publication"`.
**Why**: Government statutes, rules, regulations, bye-laws, and gazette notifications may be republished in full under Indian copyright law (Section 52(1)(q) Copyright Act, 1957), whereas BIS standards (NBC 2016) are copyrighted commercial publications and consolidated "as amended" text / buffer polygons are editorial derivations rather than official gazettes.
**Rejected**: Publishing scraped NBC 2016 text (copyright violation) or presenting consolidated text without an explicit derived disclaimer (regulatory traceability violation).
*Introduced by*: 261123-izxl-plan-v2-bengaluru-south-complete

---

## Tasks

### Phase 1: Setup & Canonical Plan v2.0 Spec

- [x] T001 Commit `/home/manideep/Downloads/bylaws-plan-v2-south-bengaluru.md` as `docs/plan-v2.md`, register it in `docs/specs/index.md`, and write ADR `docs/decisions/003-plan-v2-schema-1-2-and-text-rights.md` <!-- R1 -->
- [x] T002 Upgrade all JSON Schemas in `schemas/` (`jurisdiction.schema.json`, `document.schema.json`, `clause-tree.schema.json`, `zones.schema.json`, `overrides.schema.json`, `declarations.schema.json`, `amendments.schema.json`, `manifest.schema.json`, plus `consolidated.schema.json`, `geo-layers.schema.json`, `clause-zone-tags.schema.json`) to `schema_version: "1.2"`, update `pipeline/bylaws/schema_validator.py` and `docs/schema.md`, and run `scripts/generate_models.py` to regenerate `pipeline/bylaws/models/_generated.py` and `lib/types/generated.ts` <!-- R1 -->

### Phase 2: Part A — Foundations (Audit 2 Integrity Fixes & Data Wiring)

- [x] T003 Write failing tests first (R11) in `pipeline/tests/` for idempotent overrides, mandatory `map_curations` application/rejection, multi-jurisdiction/multi-release `publish`, unreadable manifest failure, `SOURCE_DATE_EPOCH` determinism, CRS reprojection/rejection in `geo`, transitive npm & strict licence allowlist in `test_r4_licences.py`, and realistic two-column/table/sub-item structuring in `test_structure.py` <!-- R2 -->
- [x] T004 Fix `pipeline/bylaws/overrides.py` to skip no-op fixes (idempotent across repeated runs), preserve YAML order, apply `zone_fixes` and `map_curations` (or fail loudly on unknown `map_id`), and populate R12 `record_version`, `record_supersedes`, `record_superseded_by`, and `record_change_reason` <!-- R2 -->
- [x] T005 Fix `pipeline/bylaws/publish.py` to fail loudly on unreadable `manifest.json`, preserve all existing jurisdictions and prior releases in `releases[]`, read `licence` from jurisdiction config, export `sources.json` and `sources.csv`, and remove all fixture literals <!-- R3 -->
- [x] T006 Remove all `country == "XX"` branches across `pipeline/bylaws/acquire.py`, `pipeline/bylaws/parsers/pypdfium2_adapter.py`, `pipeline/bylaws/structure.py`, and `pipeline/bylaws/publish.py`; implement deterministic `SOURCE_DATE_EPOCH` timestamp resolution and record real installed parser versions <!-- R4 -->
- [x] T007 Upgrade `pipeline/bylaws/geo/` (`boundaries.py`, `zones.py`, `georef.py`, `rasterize.py`, `gcp.py`, `verify.py`) to inspect CRS, reproject declared CRS (e.g. `EPSG:32643` UTM 43N) to `EPSG:4326`, compute metric `area_sq_m` in UTM, and reject CRS-less geospatial sources <!-- R5 -->
- [x] T008 Upgrade `pipeline/tests/test_r4_licences.py` and `docs/dependencies.md` to enforce the strict permissive licence allowlist across all Python packages and all direct + transitive npm packages in `package-lock.json`, rejecting `GPLv3` and `UNKNOWN` <!-- R6 -->
- [x] T009 Upgrade `pipeline/bylaws/parsers/pypdfium2_adapter.py`, `pipeline/bylaws/structure.py`, and `pipeline/bylaws/consolidate.py` to remove fixture-only branches, handle two-column layouts, strip running headers/footers, parse Roman-numeral chapters and scoped sub-items (`2.1(a)`), extract structured tables into `tables[]` while removing flattened rows from prose, and update hand-written golden files in `pipeline/tests/golden/xx-test-fixture/` <!-- R7 -->

### Phase 3: Part B — Bengaluru South Sources to Structured Data (`in-ka-bengaluru-south`)

- [x] T010 Complete B1 source discovery and author `jurisdictions/in-ka-bengaluru-south.yaml`, `docs/sources/in-ka-bengaluru-south.md`, and `data/reports/in-ka-bengaluru-south/source-discovery.md` covering all layers in Plan v2.0 §3.1–3.8 with official/mirror URLs, notification numbers, dates, quoted status evidence, amendment chains (`bbl-2003` and `rmp2015-zr`), and `text_rights` (`full_text` vs `reference_only`) <!-- R8 -->
- [x] T011 Execute B2 acquisition (`bylaws acquire --jurisdiction in-ka-bengaluru-south`) to download/stage obtainable PDFs, KMLs, and GeoJSONs into `data/raw/in-ka-bengaluru-south/` with SHA-256 `.meta.json` records and extract GBA Bengaluru South corporation, GBA zones, and 369-ward delimitation GeoJSONs <!-- R8 -->
- [x] T012 Execute B3 reconnaissance and B4 parsing/comparison (`pypdfium2`, `pdfplumber`/`docling` table & layout adapter, `tesseract` OCR with `kan`) across all `in-ka-bengaluru-south` documents and map sheets, generating `data/reports/in-ka-bengaluru-south/recon.md`, `data/reports/in-ka-bengaluru-south/parser-comparison.md`, and `docs/decisions/004-bengaluru-south-parser-and-map-decisions.md` <!-- R9 -->
- [x] T013 Execute B5 document structuring (`bylaws structure --jurisdiction in-ka-bengaluru-south`), B6 amendment linking (`bylaws amendments`), B7 consolidated "as amended" generation (`consolidated.json`), overrides (`data/overrides/in-ka-bengaluru-south/overrides.yaml`), and QA validation (`data/reports/in-ka-bengaluru-south/qa.md`) across all Bengaluru South sources <!-- R10 -->

### Phase 4: Part C — Bengaluru South Maps, Zones, Overlays & Clause–Zone Tags

- [x] T014 Execute C1–C4 geospatial pipeline (`bylaws geo --jurisdiction in-ka-bengaluru-south`) to publish official boundaries (`boundary.geojson`, `gba-zones.geojson`, `wards.geojson`), intersecting RMP 2015 planning districts (`planning-districts.geojson`), master plan land-use zones (`zones.geojson` with `data/reports/in-ka-bengaluru-south/map-verification.md`), derived overlays (`overlays.geojson` including Namma Metro 11 m influence zone and verified buffer rules or declared gaps), and `geo-layers.json` <!-- R11 -->
- [x] T015 Execute C5 clause–zone tagging in `data/overrides/in-ka-bengaluru-south/overrides.yaml` and `pipeline/bylaws/` to populate `clause-zone-tags.json` and `applies_to_zones` across all Bengaluru South zone codes, overlays, and `ALL` provisions with quoted clause reasons and `verification: "machine_checked"` <!-- R12 -->

### Phase 5: Part D — Website (dg2n Idiom, 8 Routes, Leaflet, Axe CI) & Release `1.0.0`

- [x] T016 Upgrade `lib/data.ts` with typed loaders for all Schema v1.2 files (`manifest.json`, `documents.json`, `<doc>.clauses.json`, `amendments.json`, `consolidated.json`, `zones.geojson`, `boundary.geojson`, `gba-zones.geojson`, `wards.geojson`, `planning-districts.geojson`, `overlays.geojson`, `geo-layers.json`, `clause-zone-tags.json`, `declarations.json`, `sources.json`) and production `visibility: "test"` filtering <!-- R13 -->
- [x] T017 Rebuild the design system (`app/globals.css`, `app/layout.tsx`) in the dg2n idiom (`Inter Tight`, `Source Serif 4`, `JetBrains Mono` via `next/font/google`; `--paper: #f5f3ed`, `--panel: #efeee8`, `--ink: #080909`, `--muted: #5b5e56`, `--hairline: #c8ccc0`, `--accent: #ff6b52` for selection only) and upgrade components (`components/ZoneMap.tsx` with stable `react-leaflet`, `components/ClausePanel.tsx`, `components/ClauseTree.tsx`, `components/StatusBadge.tsx`, `components/ReviewPanel.tsx`, `components/TopNav.tsx`) enforcing R12 record version separation and R14 derived labels <!-- R13 -->
- [x] T018 Implement all 8 web routes with static generation (`generateStaticParams`) and real data: Home (`app/page.tsx`), Map (`app/j/[id]/page.tsx`), Sources (`app/j/[id]/sources/page.tsx`), Document (`app/j/[id]/documents/[doc]/page.tsx` and `app/j/[id]/clauses/page.tsx`), Timeline (`app/j/[id]/timeline/page.tsx`), Review (`app/j/[id]/review/page.tsx`), Data (`app/data/page.tsx`), and About (`app/about/page.tsx`) <!-- R13 -->
- [x] T019 Add blocking `axe-core` WCAG AA accessibility tests and comprehensive component/route tests in `__tests__/` (`vitest`), and run `bylaws run-all --jurisdiction xx-test-fixture` and `bylaws run-all --jurisdiction in-ka-bengaluru-south` to publish release `1.0.0` into `public/data/` <!-- R14 -->
- [x] T020 Verify byte-identical reproducibility across repeated `run-all` and `apply-overrides` runs, update `docs/progress.md`, and run full CI verification (`pytest`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`) <!-- R14 -->

## Execution Order

- T001–T002 (Schema 1.2 + codegen) block T003–T019
- T003–T009 (Part A Foundations) block T010–T015 (Parts B & C) and T016–T019 (Part D)
- T010–T015 (Bengaluru South dataset) and T016–T018 (Web routes) converge at T019–T020 (Release `1.0.0` publication and full verification)

## Acceptance

### Functional Completeness

- [x] A-001 R1: All schemas in `schemas/` are at `schema_version: "1.2"` covering all Plan v2.0 §4 fields, and `make generate` produces `pipeline/bylaws/models/_generated.py` and `lib/types/generated.ts` with zero drift.
- [x] A-002 R2: `bylaws apply-overrides` is idempotent across repeated runs, preserves YAML order, applies `zone_fixes` and `map_curations` (or rejects unknown `map_id` curations loudly), and maintains R12 record version fields without mutating `legal_status`.
- [x] A-003 R3: `bylaws publish` fails on an unreadable `manifest.json`, preserves all existing jurisdictions and prior releases in `releases[]`, reads `licence` from config, exports `sources.json` and `sources.csv`, and contains no fixture literals.
- [x] A-004 R4: Zero `country == "XX"` branches exist in `pipeline/bylaws/`, timestamps derive deterministically from `SOURCE_DATE_EPOCH`, and parsed page artifacts record real installed parser package versions.
- [x] A-005 R5: `bylaws geo` reprojects geospatial sources with a declared CRS (such as `EPSG:32643`) to `EPSG:4326`, computes `area_sq_m` in UTM, and rejects sources without a declared CRS.
- [x] A-006 R6: `pipeline/tests/test_r4_licences.py` enforces an explicit permissive licence allowlist across Python and direct + transitive npm packages and rejects `GPLv3` and `UNKNOWN`.
- [x] A-007 R7: `structure.py` contains no fixture-only branches, accurately structures two-column pages, Roman-numeral chapters, scoped sub-items (`2.1(a)`), and tables (removed from prose), and matches hand-written golden files for `xx-test-fixture`.
- [x] A-008 R8: `jurisdictions/in-ka-bengaluru-south.yaml`, `docs/sources/in-ka-bengaluru-south.md`, and `data/reports/in-ka-bengaluru-south/source-discovery.md` cover the complete Bengaluru South source register across all 7 regulatory layers + reference data, with checksummed raw files or honest `unobtainable_documents` declarations.
- [x] A-009 R9: `recon.md`, `parser-comparison.md`, and `qa.md` exist in `data/reports/in-ka-bengaluru-south/`, every full-text source is structured with citations/bboxes, Kannada text is preserved verbatim (`language: "kn"`), and `nbc-2016` / `aai-cczm` are recorded as `reference_only`.
- [x] A-010 R10: `amendments.json` and `consolidated.json` link the `bbl-2003` and `rmp2015-zr` amendment chains and provide consolidated "as amended" clause records marked `derived: true` with applied amendment lists.
- [x] A-011 R11: `boundary.geojson`, `gba-zones.geojson`, `wards.geojson`, `planning-districts.geojson`, `zones.geojson`, `overlays.geojson`, `geo-layers.json`, and `map-verification.md` are published for `in-ka-bengaluru-south` with derived overlays labelled approximate.
- [x] A-012 R12: `clause-zone-tags.json` and clause `applies_to_zones` link every zone code, overlay, and `ALL` rule to applicable clauses with quoted reasons and `verification: "machine_checked"`.
- [x] A-013 R13: All 8 web routes (`/`, `/j/[id]`, `/j/[id]/sources`, `/j/[id]/documents/[doc]`, `/j/[id]/timeline`, `/j/[id]/review`, `/data`, `/about`, plus `/j/[id]/clauses`) render real data in the dg2n visual idiom with Leaflet polygons, R12 version disclosures, and R14 derived labels.
- [x] A-014 R14: Release `1.0.0` for `in-ka-bengaluru-south` is published in `public/data/`, production hides `visibility: "test"` jurisdictions while previews show them, and `axe-core` WCAG AA checks pass in CI.

### Behavioral Correctness

- [x] A-015 R2: Running `bylaws apply-overrides` twice in a row on `xx-test-fixture` and `in-ka-bengaluru-south` leaves all output files byte-identical (no `@v1` -> `@v5` version inflation).
- [x] A-016 R4: Running `bylaws run-all` twice in a row produces identical SHA-256 checksums for every file including `.zip` bundles.
- [x] A-017 R13: Clauses with a newer `@v2` record version display only the current `@v2` record with `"v2 · corrected from v1"` expandable history and are never tagged with the `SUPERSEDED` legal status badge unless the clause itself was legally repealed.

### Scenario Coverage

- [x] A-018 R6: Unit tests in `pipeline/tests/test_r4_licences.py` verify that planted `GPLv3`, `UNKNOWN`, and disallowed transitive npm licences fail the check.
- [x] A-019 R7: Unit tests in `pipeline/tests/test_structure.py` verify that mid-sentence measurements (`"3.5 m front setback"`) and years (`"2020 amendments"`) do not create false clauses, two-column text is read column-by-column, and tables are extracted out of prose.
- [x] A-020 R14: Frontend tests in `__tests__/` verify data rendering across the pages and run `axe-core` accessibility audits with zero violations.

### Edge Cases & Error Handling

- [x] A-021 R3: `bylaws publish` raises `ClickException` when `manifest.json` contains malformed JSON instead of silently overwriting it.
- [x] A-022 R5: `bylaws geo` raises `ClickException` or `ValueError` when a geospatial input file has no CRS metadata.
- [x] A-023 R2: `bylaws apply-overrides` raises `ClickException` when a `map_curation` references a `map_id` not present in the jurisdiction config.

### Code Quality

- [x] A-024 Pattern consistency: New code follows naming and structural patterns of surrounding code
- [x] A-025 No unnecessary duplication: Existing utilities reused where applicable
- [x] A-026 Readability and maintainability: Code prioritizes clarity over cleverness and prefers composition over inheritance (`fab/project/code-quality.md` § Principles)
- [x] A-027 No god functions or magic literals: Functions remain focused and modular, and no jurisdiction/fixture magic literals leak into pipeline or web code (`fab/project/code-quality.md` § Anti-Patterns)

## Notes

- Check items as you review: `- [x]`
- All acceptance items must pass before `/fab-continue` (hydrate)
- If an item is not applicable, mark checked and prefix with **N/A**: `- [x] A-NNN **N/A**: {reason}`

## Deletion Candidates

- `pipeline/bylaws/geo/verify.py:16` (`generate_map_verification_report`) — Legacy M0/M1.5 stub superseded by `write_jurisdiction_map_verification_report` in the same module (currently retained only for the legacy stub assertion in `pipeline/tests/test_cli.py:106`).
- `docs/plan.md` and `docs/plan-v1.1.md` — Superseded earlier planning specifications now replaced by `docs/plan-v2.md` (marked under `## Superseded Specifications` in `docs/specs/index.md`).

## Assumptions

| # | Grade | Decision | Rationale | Scores |
|---|-------|----------|-----------|--------|
| 1 | Certain | Execute all four parts of Plan v2.0 (Part A Foundations, Part B Sources, Part C Maps, Part D Website & release 1.0.0) in a single Fab change and single PR with step-scoped work | User explicitly instructed `lets do everything in this fab` after `/fab-discuss` on Plan v2.0 | S:95 R:85 A:95 D:95 |
| 2 | Certain | Publish datasets to `public/data/` at the repository root (the Next.js `public/` directory) while keeping `lib/data.ts` and `publish.py` aligned | Repo root hosts the Next.js app (`app/`, `public/`), as established in ADR and `architecture/overview.md` | S:90 R:95 A:95 D:95 |
| 3 | Certain | Link `"View source p. N"` to the document's official/mirror PDF URL with `#page=N` fragment rather than committing hundreds of MBs of raw PDFs into `public/data/` | Preserves repo/Vercel bundle size limits while satisfying R2/R13 provenance and Plan v2.0 §D.2 | S:85 R:90 A:90 D:90 |
| 4 | Certain | Follow Plan v2.0 "Never invent, never stop" rule for unobtainable sources, scanned/unreliable tables, or map sheets failing RMSE/coverage thresholds by publishing the honest best output and declaring every gap in `declarations.json` and `data/reports/` | Explicitly mandated by Plan v2.0 §1, §5.B1, §5.B5, §5.C3, and §5.C4 | S:95 R:90 A:95 D:95 |
| 5 | Confident | Keep `/j/[id]/clauses` route functional alongside the new `/j/[id]/documents/[doc]` and `/j/[id]/sources` routes so existing links and navigation patterns continue to work seamlessly | Backward-compatible route preservation is low-cost and prevents broken internal links | S:80 R:90 A:90 D:85 |

5 assumptions (4 certain, 1 confident, 0 tentative).
