# Intake: Plan v2.0 — Bengaluru South, Complete

**Change**: 261123-izxl-plan-v2-bengaluru-south-complete
**Created**: 2026-11-23

## Origin

> `/fab-discuss` on `/home/manideep/Downloads/bylaws-plan-v2-south-bengaluru.md` followed by `/fab-new lets do everything in this fab`

Initiated from a discussion of **Structured Building Bylaws — Plan v2.0: Bengaluru South, Complete** (`/home/manideep/Downloads/bylaws-plan-v2-south-bengaluru.md`) and **Audit 2** (`docs/reports/2026-11-23-audit-m1-5.pdf`, at commit `7e0273c`). The user requested executing the entire Plan v2.0 in this single Fab change (`lets do everything in this fab`), matching Plan v2.0 §1 ("One fresh agent session, one pull request. Commit per step, each commit message starting with the step ID (`A1:`, `B3:` …)").

## Why

1. **Problem / Pain Point**:
   - **Audit 2 integrity and realism findings**: While the M1.5 pipeline vertical slice (`7e0273c`) established single-source JSON Schema v1.1 codegen and an 8-stage synthetic fixture run, Audit 2 identified critical backend integrity defects (`apply-overrides` is not idempotent and ignores `map_curations`; `publish` clobbers other jurisdictions/releases, swallows unreadable manifests, and hard-codes license/fixture strings; `country == "XX"` branches fake timestamps and parser versions instead of `SOURCE_DATE_EPOCH`; `geo` performs no CRS reprojection; `test_r4_licences.py` misses transitive npm packages and lets `GPLv3` / unknown licenses through; `structure.py` is tuned to the synthetic fixture and misreads real multi-column/Roman-numeral/table Indian bylaw layouts; golden snapshots were self-generated rather than hand-written).
   - **Unwired frontend & R12 semantic error**: All web routes still receive empty arrays, `lib/data.ts` has no loaders beyond the manifest, `ZoneMap.tsx` does not render Leaflet polygons, the UI conflates record version supersede chains (`@v1` -> `@v2`) with repealed legal status (`SUPERSEDED`), the dg2n visual system (`#f5f3ed` paper, `#ff6b52` coral selection-only, typography, primitives) is not yet built, and `/data`, `/about`, `/j/[id]/sources`, `/j/[id]/documents/[doc]`, and `/j/[id]/timeline` do not exist.
   - **No real jurisdiction published**: Bengaluru South City Corporation (`in-ka-bengaluru-south`) has not yet been discovered, acquired, parsed, structured, linked across amendment chains, consolidated, mapped across its planning districts and overlays, or published as release `1.0.0`.
2. **Consequence of Not Fixing**:
   - Without Part A hardening, running the pipeline on real Bengaluru South documents and maps will corrupt manifests, duplicate override versions on re-runs, drop projected UTM 43N geometries, and misparse real clauses/tables. Without Parts B, C, and D, the platform remains an empty shell over a synthetic fixture rather than a complete, citable public dataset and web viewer for Bengaluru South.
3. **Why This Approach**:
   - Plan v2.0 replaces Plans v1.1 and v1.2 with a unified four-part execution sequence (**Part A: Foundations**, **Part B: Sources to structured data**, **Part C: Maps**, **Part D: Website & release**) governed by strict engineering and legal rules (**R1–R14**), explicit QA thresholds, and honest gap declarations (`declarations.json`) under the principle *"Never invent, never stop"*.

## What Changes

### 0. Canonical Plan v2.0 Specification (`docs/plan-v2.md`)

Commit `/home/manideep/Downloads/bylaws-plan-v2-south-bengaluru.md` into the repository as `docs/plan-v2.md` and register it in `docs/specs/index.md` as the governing specification replacing Plans v1.1 and v1.2. Keep `docs/progress.md` and `docs/decisions/` updated throughout execution.

### 1. Core Rules (R1–R14)

All pipeline modules, schemas, tests, and web components must enforce:
- **R1**: No jurisdiction-specific code. No branching on jurisdiction IDs, country codes (`XX`), or fixture names. Bengaluru South lives entirely in config (`jurisdictions/in-ka-bengaluru-south.yaml`) and data (`data/overrides/in-ka-bengaluru-south/`).
- **R2**: Provenance on everything: source, page, position (`bbox`), version, retrieval date, checksum.
- **R3**: Legal status explicit: `in_force`, `draft`, `superseded`, `withdrawn`, `status_unknown`. Drafts never shown as law.
- **R4**: Open licences: code Apache-2.0, data CC BY 4.0. Dependencies on the allowlist only (`MIT`, `Apache-2.0`, `BSD-2-Clause`, `BSD-3-Clause`, `BSD`, `ISC`, `PSF-2.0`, `0BSD`, `CC0-1.0`, `Unlicense`, `OFL-1.1`, `MPL-2.0`; `LGPL` only with a written exception in `docs/dependencies.md`), checked in CI including transitive npm packages (`node_modules` / `package-lock.json`) and rejecting `GPLv3` or `UNKNOWN`.
- **R5**: Raw sources immutable, checksummed.
- **R6**: Reproducible: outputs regenerate byte-identically from sources + config + overrides. Timestamps derived deterministically from `SOURCE_DATE_EPOCH` (or a deterministic default epoch when unset in reproducible builds).
- **R7**: Fail loudly. Nothing reports success it did not earn.
- **R8**: No defaults that strengthen a claim (no `in_force` for missing status, no page 1 for missing page).
- **R9**: Verified records (`human_verified` or `machine_checked` when immutable versioned) are never edited in place; corrections create new record versions (`record_version`, `record_supersedes`, `record_superseded_by`, `record_change_reason`).
- **R10**: Verification is honest. Nothing is marked `human_verified` by the agent. Agent-checked records are `machine_checked` (or `unverified` before check).
- **R11**: Tests must be able to fail: each new test shown failing first; fixture expectations in `pipeline/tests/golden/` hand-written and audited.
- **R12**: Legal status (`legal_status`) and record version (`record_version`, `record_supersedes`, `record_superseded_by`, `record_change_reason`) are separate fields and never shown as each other. Only current record versions are shown by default; `"v2 · corrected from v1"` expands to version history and is never badged as `SUPERSEDED` legal status.
- **R13 (Text rights)**: Only publish full text of documents that may be republished (`text_rights: { mode: "full_text" | "reference_only", reason: "..." }`). Government Acts, rules, regulations, bye-laws, notifications, and orders are `full_text`. Copyrighted standards (e.g., BIS National Building Code of India 2016 `nbc-2016`) and non-redistributable maps (AAI CCZM `aai-cczm`) are recorded as `reference_only`: title, edition, part and clause numbers cited by other sources, and where to obtain them. Never reproduce their text or draw AAI height surfaces.
- **R14 (Our work is labelled as ours)**: Anything derived by this project (consolidated "as amended" text, buffer zones drawn from a rule, georeferenced map zones) carries `derived: true` and a method description, is labelled `"derived by this project, not an official publication"` in the UI, and links back to the originals.

### 2. Schema 1.2 (`schemas/*.schema.json`) & Codegen

Upgrade all JSON Schemas in `schemas/` to `schema_version: "1.2"` (preserving all v1.1 capabilities) and add `schemas/consolidated.schema.json` / `schemas/geo-layers.schema.json` (or extend existing schemas cleanly) to cover all Section 4 requirements:
- **Document types (`doc_type` / `role`)**: `act`, `rules`, `regulations`, `bye_laws`, `amendment`, `notification`, `government_order`, `circular`, `map`, `standard_reference`.
- **Layers (`layer`)**: `statute`, `state_rules`, `planning`, `municipal`, `orders`, `overlay`, `national_reference`, `boundary`.
- **Jurisdiction fields**: Add `visibility?: "public" | "test"` (default `"public"`, `"test"` for `xx-test-fixture` so production hides `visibility: test` jurisdictions while previews/dev show them), `licence?: string` (e.g., `"CC BY 4.0"`), `building_relevant_sections?: Record<string, string[]>`.
- **Document fields**: `issuing_authority`, `notification_number`, `gazette_reference`, `notified_date`, `effective_from`, `legal_status` (`in_force | draft | superseded | withdrawn | status_unknown`), `status_evidence` (`url` + `quoted_line` / `description`), `superseded_by_document`, `amends` (list of doc IDs), `text_rights` (`{ status: "full_text" | "reference_only", reason: string }`), `languages` (e.g. `["en"]`, `["en", "kn"]`), `official_url`, `mirror_urls`, `copies` (each with `url`, `path`, `sha256`, `retrieved_at`), `cited_provisions` (for `reference_only` standards: part, clause, cited_by_clauses, where_to_obtain).
- **Clause records (R12)**: `record_version` (integer >= 1, e.g., `1`, `2`), `record_id` (`<doc_id>:<number>@v<N>`), `record_supersedes`, `record_superseded_by`, `record_change_reason`; `legal_status` (`in_force | draft | superseded | withdrawn | status_unknown`); `effective_from`; `citations` (`doc_id`, `page`, `bbox`, `text_excerpt`); `verification` (`unverified | machine_checked | human_verified`) and `verified_by`; `language` (`en | kn`); `applies_to_zones` (structured clause-zone tags or zone codes + `clause_zone_tags` with `{ clause_id, zone_code, reason, verification }`).
- **Amendment links (`amendments.schema.json`)**: `amending_clause`, `target_clause`, `action` (`substitute`, `insert_after`, `insert_before`, `omit`, `modify`, `renumber`), `effective_date`, `confidence` (`high | medium | low`), `verification`, `target_doc_id`, `amending_doc_id`, `summary`.
- **Consolidated text (`consolidated.schema.json`, R14)**: `consolidated` records per target clause per effective date (`as_of_date`, `clause_id`, `doc_id`, `number`, `title`, `text`, `tables`, `amendments_applied[]`, `derived: true`, `method`, `confidence: "high"`). Produced only when every applicable amendment link is high-confidence; otherwise omitted with `unconsolidated_reasons[]` recorded so the site shows original plus amendments side by side.
- **Geo layers & boundaries (`geo-layers.schema.json` / `zones.schema.json`)**:
  - Each geo layer has `layer_id`, `title`, `kind` (`official_boundary`, `master_plan_zone`, `derived_overlay`, `reference`), `source`, `method`, `accuracy_m` (estimated numeric or null), `derived` (boolean), `file` (relative GeoJSON path or null for reference layers like NOCAS), `external_url`.
  - Zone features (`zones.schema.json`): `zone_id`, `record_id`, `record_version`, `record_supersedes`, `record_superseded_by`, `record_change_reason`, `zone_code` and `zone_label` from the map legend, `planning_district`, `sheet`, `extraction_method` (`vector_pdf`, `grid_georeferenced_raster`, `osm_gcp_raster`, `imported`, `colour_segmentation`, `road_outline_fallback`, `manual`), `verification`, `verified_by`, `source_map`, `georef_run`, `source_attribution`, `area_sq_m`, `notes`.
- **Clause–zone tags**: `clause_id`, `zone_code` (specific code, overlay ID, or `ALL`), `reason` (quoted clause words), `verification`.
- **Declarations (`declarations.schema.json`)**: `not_modelled[]`, `known_gaps[]`, `unread_documents[]`, `unobtainable_documents[]` (`id`, `title`, `searched_sources[]`, `reason`), `contested_status[]` (`doc_id`, `title`, `conflicting_evidence[]`, `declared_status: "status_unknown"`), `building_relevant_highlights[]`.
- Regenerate Python (`pipeline/bylaws/models/_generated.py`) and TypeScript (`lib/types/generated.ts`) models via `scripts/generate_models.py`; CI fails on drift.

### 3. Part A — Foundations (Audit 2 Integrity Fixes + Data Wiring)

- **A1. Integrity fixes** (each with a failing test first, R11):
  1. **Idempotent overrides (`pipeline/bylaws/overrides.py`)**:
     - Compare effective field changes before applying `clause_fixes` or `zone_fixes`. If a fix is a no-op (target already has the exact values, or the override was already applied to produce the latest `@v<N>` record), do not create a new version or mutate the record.
     - Preserve YAML key and list order deterministically (never sort override operations out of order).
     - `zone_fixes` and `map_curations`: apply `zone_fixes` to `zones.geojson` (creating `@v<N+1>` on verified records per R9 or updating unverified records) and apply `map_curations` (legend entries / GCPs) to the geo/zone pipeline, or reject with a loud error (`ClickException` / `ValueError`) if a curation references an unknown `map_id` or cannot be applied — never silently ignore.
  2. **Safe, multi-jurisdiction, multi-release `publish` (`pipeline/bylaws/publish.py`)**:
     - Fail loudly (`ClickException`) if an existing `manifest.json` is unreadable or malformed JSON (never swallow exceptions).
     - Preserve all other jurisdictions in `manifest.json` and preserve all prior releases in `releases[]` for the target jurisdiction (updating or appending the target release version cleanly and setting `latest_release`).
     - Read the data licence from config (`config.licence`, defaulting only if specified in config/schema, never hard-coding `"CC BY 4.0"` as a magic string when config provides it).
     - Remove all fixture literals (`_fixture-test`, `xx-test-fixture`) from `publish.py` and all pipeline modules.
  3. **Remove all `XX` branches; `SOURCE_DATE_EPOCH`; real parser names and versions**:
     - Remove every `if config.country == "XX"` branch across `acquire.py`, `parse`, `structure.py`, `publish.py`, etc.
     - Derive timestamps deterministically from `os.environ.get("SOURCE_DATE_EPOCH")` (with a deterministic fallback from the config/document metadata or epoch when running reproducible builds, identical for all jurisdictions).
     - Record the real `importlib.metadata.version("pypdfium2")` / `docling` version in parsed page JSONs instead of fake `"5.0.0"`.
  4. **CRS reprojection in `geo` (`pipeline/bylaws/geo/`)**:
     - Inspect source CRS on KML/GeoJSON/GPKG boundary and zoning inputs (`pyogrio` / `geopandas` / `pyproj`).
     - Reproject sources with a declared CRS (e.g., `EPSG:32643` UTM Zone 43N) to `EPSG:4326` (WGS 84) before clipping and area calculation; compute `area_sq_m` in a metric projection (`EPSG:32643` / local UTM).
     - Refuse (`ClickException` / `ValueError`) any geospatial source that lacks a declared CRS (and is not explicitly standard RFC 7946 GeoJSON with verified WGS 84 bounds).
  5. **Strict licence allowlist including transitive npm packages (`pipeline/tests/test_r4_licences.py`)**:
     - Replace regex blocklist with an explicit strict allowlist (`MIT`, `Apache-2.0`, `BSD-2-Clause`, `BSD-3-Clause`, `BSD`, `ISC`, `PSF-2.0`, `0BSD`, `CC0-1.0`, `Unlicense`, `OFL-1.1`, `MPL-2.0`, plus documented `LGPL` runtime library exceptions in `docs/dependencies.md`).
     - Reject `UNKNOWN`, empty licences, and `GPLv3` / `AGPL`.
     - Inspect all transitive npm packages in `package-lock.json` / `node_modules` as well as all installed Python distributions.
  6. **Remove fixture-only branches in `structure.py`**:
     - Remove the fixture-specific `"DRAFT"` banner skip and repeated-heading merge hack; replace with general document layout analysis (running header/footer detection across pages, two-column reading order, strict clause heading grammar, table extraction).
  7. **Hand-written fixture expectations**:
     - Audit and hand-author the golden expectations in `pipeline/tests/golden/xx-test-fixture/` (including `record_version`, R12 fields, extracted `Table 2.1` structured rows removed from prose, scoped sub-items `2.1(a)`, etc.).
- **A2. Data wiring**:
  - Serve published datasets from `public/data` (with compatibility symlink or config if `web/public/data` is referenced).
  - Add typed loaders in `lib/data.ts` for every file type in Schema 1.2 (`manifest.json`, `documents.json`, `<doc_id>.clauses.json`, `amendments.json`, `consolidated.json`, `zones.geojson`, `boundary.geojson`, `geo-layers.json`, `clause-zone-tags.json`, `declarations.json`).
  - Convert Next.js routes to Server Components with static generation (`generateStaticParams`) per jurisdiction/document; keep only the Leaflet map (`ZoneMap.tsx`) and interactive filter/selection panels on the client (`"use client"`).
  - Use a stable `react-leaflet` release (`^5.0.0` stable or compatible stable release supporting React 19, removing `-rc.2` pin) loaded client-side via `next/dynamic(..., { ssr: false })`.
  - Hide `visibility: "test"` jurisdictions (`xx-test-fixture`) in production (`NODE_ENV === "production"` and `VERCEL_ENV === "production"`), while showing them in development, tests, and preview deployments.

### 4. Part B — Sources to Structured Data (`in-ka-bengaluru-south`)

- **B1. Discover and complete the source register**:
  - Verify every entry in Plan v2.0 §3.1–3.8 and discover any missing amendments between 2004–2026 (`bbl-2003` chain) and 2007–2026 (`rmp2015-zr` chain) from official origins (Karnataka Gazette, India Code, GBA `gba.karnataka.gov.in`, BBMP town planning & BPAS circulars pages, OpenCity `data.opencity.in`, PRS India, web archive).
  - Record full metadata for every document in `jurisdictions/in-ka-bengaluru-south.yaml`, `docs/sources/in-ka-bengaluru-south.md` (human-readable register), and `data/reports/in-ka-bengaluru-south/source-discovery.md`:
    - **Layer 3.1 Municipal bye-laws**: `bbl-2003`, `bscc-bbl-amend-2026`, `bscc-bbl-amend-2026-draft`, plus discovered intermediate circulars/amendments.
    - **Layer 3.2 Master plan zoning (RMP 2015)**: `rmp2015-zr`, `rmp2015-zr-amend-2014`, `rmp2015-zr-amend-2015-03`, `rmp2015-zr-amend-2018`, `rmp2015-zr-amend-2018-impact`, `rmp2015-zr-amend-tt`, `rmp2015-zr-premium-far-2025-02`, `rmp2015-zr-premium-far-2025-04`, `rmp2015-zr-premium-far-2026-02`, `rmp2015-zr-amend-2025-07`, `rmp2015-zr-stilt-draft-2025`, `rmp2015-zr-swd-buffer-2025`, `rmp2015-zr-amend-2026-01`, `rmp2015-zr-amend-2025-11-draft`, `rmp2015-zr-highrise-24m-draft`, plus discovered RMP 2015 amendment notifications.
    - **Layer 3.3 Master plan maps**: `rmp2015-plu-sheets`, `rmp2015-index`, `rmp2015-plu-analysis`.
    - **Layer 3.4 Jurisdiction boundaries**: `gba-corporations-2025` (Bengaluru South City Corporation + its two GBA zones), `gba-wards-2025` (final 369-ward delimitation filtered to Bengaluru South).
    - **Layer 3.5 State Acts and rules**: `gbg-act-2024`, `ktcp-act-1961`, `tdr-rules-2016`, `kfs-act-1964` (with 2023 and 2025 amendments), `ktcda-act` (with 2025 lake buffer status verification), `metro-influence-2020`.
    - **Layer 3.6 Government orders and procedures**: `oc-exemption-2025-09`, `oc-exemption-2026-06`, `gba-oc-cc-rules-2025`, `bbmp-noc-details`, plus discovered Nambike Nakshe / e-Khata circulars.
    - **Layer 3.7 National references**: `nbc-2016` (`reference_only`), `aai-cczm` (`reference_only` map link to NOCAS + gazette rule citations), `model-bbl-2017`.
    - **Layer 3.8 Reference data**: `ksrsac-elu`, `road-width`, `osm`.
- **B2. Acquire**:
  - Download all obtainable PDFs, KMLs, and GeoJSONs into `data/raw/in-ka-bengaluru-south/` with SHA-256 verification and `<doc_id>.meta.json` using polite retries and descriptive `User-Agent`. Record any unobtainable documents honestly in `declarations.json` (`unobtainable_documents`) and `source-discovery.md`.
  - Convert boundary KMLs (`gba-corporations-2025`, `gba-wards-2025`) to GeoJSON, extracting Bengaluru South City Corporation boundary, its two GBA zones, and its wards.
- **B3. Reconnaissance**:
  - Analyze every acquired PDF and map sheet (page count, text layer vs. scanned, English/Kannada languages, column layout, numbering patterns, running heads, tables, vector vs. raster map sheets, UTM 43N coordinate grids, legends).
  - Write `data/reports/in-ka-bengaluru-south/recon.md` with page examples and the structure rules list for B5.
- **B4. Parse**:
  - Implement and run permissive parser adapters (`pypdfium2`, `docling` / `pdfplumber` table & layout extraction, `tesseract` OCR with `kan` / `eng` for scanned pages).
  - Compare parsers and record per-document parser selection in `data/reports/in-ka-bengaluru-south/parser-comparison.md` and `docs/decisions/`.
- **B5. Structure every document completely**:
  - Upgrade `pipeline/bylaws/structure.py` to support full hierarchy: parts, chapters (including Roman numerals `CHAPTER I`, `CHAPTER II`), numbered clauses (`1.0`, `1.1`, `1.1.1`), scoped sub-items (`bbl-2003:6.1(a)(ii)`), schedules, annexures, appendices, structured tables attached to their parent clause and removed from prose, notes, provisos, explanations, preambles, and enacting text.
  - Eliminate false-positive clause matches on mid-sentence measurements (`3.5 m`) or years (`2020`).
  - Handle two-column reading order, strip running heads and page footers, preserve verbatim text (whitespace normalization only), preserve Kannada text with `language: "kn"`, resolve cross-references, and attach page + normalized `bbox` citations.
  - Run automated QA (`data/reports/in-ka-bengaluru-south/qa.md`) checking the Plan v2.0 thresholds (100% status/date/page citation, ≥95% bbox, ≥98% text coverage, table extraction, 30-clause self-check) and apply fixes via `data/overrides/in-ka-bengaluru-south/` to mark verified clauses `machine_checked`.
- **B6. Amendments (`pipeline/bylaws/amendments.py`)**:
  - Extract and curate structured amendment links across the `bbl-2003` and `rmp2015-zr` amendment chains (`substitute`, `insert_after`, `insert_before`, `omit`, `modify`, `renumber`), including whole-chapter insertions (Chapter 11 Premium FAR) and table replacements (Table 2B deviation limits, setback tables, road-width FAR tables).
- **B7. Consolidated "as amended" view (R14)**:
  - Implement `pipeline/bylaws/consolidate.py` (invoked during `amendments` / `run-all`) to produce `consolidated.json` per base document as of today and as of each amendment date where all applicable links have `confidence: "high"`, tagged `derived: true` with `amendments_applied[]` and links to the original wording.

### 5. Part C — Maps (`pipeline/bylaws/geo/`)

- **C1. Official Boundaries**:
  - Publish corporation boundary (`boundary.geojson`), GBA zones (`gba-zones.geojson`), and Bengaluru South wards (`wards.geojson`) as `kind: "official_boundary"` layers in `geo-layers.json`.
- **C2. Planning districts in Bengaluru South**:
  - Identify every RMP 2015 planning district intersecting the Bengaluru South City Corporation boundary from the RMP 2015 index map and PLU sheets, and publish `planning-districts.geojson`.
- **C3. Master plan zones**:
  - Implement vector PDF polygon extraction (`vector_pdf` via `pypdfium2` / `pdfplumber` drawing paths mapped to legend colors and UTM 43N grid coordinates) and grid-georeferenced raster segmentation (`grid_georeferenced_raster` using UTM 43N grid intersections + colour segmentation, with OSM GCP fallback `osm_gcp_raster`).
  - Extract master plan land-use zones for the intersecting planning districts, clip to the Bengaluru South boundary, cross-check against KSRSAC existing land use (`ksrsac-elu`), and publish `zones.geojson` (or district outline + declared gap in `declarations.json` for any sheet that fails RMSE/coverage thresholds).
  - Generate `data/reports/in-ka-bengaluru-south/map-verification.md`.
- **C4. Derived overlays (R14)**:
  - Generate `overlays.geojson` (or individual overlay GeoJSON layers registered in `geo-layers.json`) for verified rules (e.g., Namma Metro 11 m Influence Zone around underground metro alignment in Bengaluru South, labelled `derived: true` and approximate; lake buffers / SWD buffers if rule status and official geometry are verified, or declared in `declarations.json`; AAI CCZM recorded as a `reference` layer linking to NOCAS).
- **C5. Clause–zone tagging**:
  - Tag applicable clauses from `rmp2015-zr` (and amendments), `bbl-2003` (and 2026 amendment), enabling Acts, and OC/CC orders to each zone code (`R-Main`, `R-Mixed`, `C-Central`, `C-Business`, `I-General`, `I-HiTech`, `T&T`, `P&SP`, `Park`, etc.), overlay ID, or `ALL`, with quoted clause reasons and `verification: "machine_checked"`.

### 6. Part D — Website and Release `1.0.0`

- **Visual System (dg2n idiom)**:
  - Update `app/globals.css` and `app/layout.tsx` with `next/font/google` (`Inter_Tight`, `Source_Serif_4`, `JetBrains_Mono`) and CSS custom properties: `--paper: #f5f3ed`, `--panel: #efeee8`, `--ink: #080909`, `--muted: #5b5e56`, `--hairline: #c8ccc0`, `--accent: #ff6b52` (coral used **only** for current selection border/fill-tint/dot, **never** for text). Square corners (`border-radius: 0` except pill toggles), hairline borders, no cards, no shadows.
- **Eight Web Routes**:
  1. **Home (`/`)**: Bengaluru South overview, dataset coverage summary, counts (sources, clauses, tables, zones), latest release metadata, entry points to Map, Sources, Documents, Timeline, Data, and jurisdiction list (hiding `visibility: test` in production).
  2. **Map (`/j/[id]`)**: Interactive Leaflet map (`ZoneMap.tsx`) with layer toggles (corporation, GBA zones, wards, planning districts, master plan zones, overlays), zone codes printed inside polygons, legend from source sheets, accuracy note generated from layer `method` and `accuracy_m`, coverage note from `declarations.json`, and right-hand clause inspector grouped by layer and document with status tag, verification tag, inline amendments, record version history toggle (`v2 · corrected from v1`, R12), and `"View source p. N"` linking to the official/mirror PDF `#page=N`.
  3. **Sources (`/j/[id]/sources`)**: Full source register table/list with layer & status filters, text search, issuing authority, notification number, dates, legal status with quoted evidence link, official link, mirrors, SHA-256 checksums, text rights badge (`FULL TEXT` vs `REFERENCE ONLY`), and link to the structured document page.
  4. **Document (`/j/[id]/documents/[doc]`)**: Complete structured document viewer with collapsible hierarchy tree, ruled tables, page citation links, text search filter, **Original / As amended (derived)** toggle (with R14 derived notice and amendment provenance), and dedicated reference view for `reference_only` documents (`nbc-2016`, `aai-cczm`) showing metadata, where to obtain, and citing clauses across Bengaluru South law. Also keep `/j/[id]/clauses` working or redirecting cleanly into the document/clauses view.
  5. **Timeline (`/j/[id]/timeline`)**: Chronological instrument-by-instrument timeline (1961 to 2026) showing what each Act, regulation, bye-law, amendment, or order changed, with direct links to affected documents and clauses.
  6. **Data (`/data`)**: Releases with changelog, downloadable `.zip`, `SHA256SUMS`, CC BY 4.0 licence, how to cite (`CITATION.cff` / BibTeX), declarations (`not_modelled`, `known_gaps`, `unobtainable_documents`, `contested_status`), and downloadable source register in CSV and JSON.
  7. **About (`/about`)**: Methodology, verification levels (`unverified`, `machine_checked`, `human_verified`), what `"derived by this project"` means (R14), limitations, Apache-2.0 & CC BY 4.0 licences, and attribution (OpenCity, OpenStreetMap ODbL, GBA, BBMP, BDA, India Code, Karnataka Gazette).
  8. **Review (`/j/[id]/review`)**: Source sheet beside traced zones with an opacity overlay slider for human verification.
- **Accessibility & CI**:
  - Integrate `axe-core` (`vitest-axe` / `@axe-core/playwright` or `axe-core` JSDOM/browser audit in `npm test`) so WCAG AA violations block CI merges.
- **Release `1.0.0`**:
  - Run `bylaws run-all --jurisdiction xx-test-fixture` and `bylaws run-all --jurisdiction in-ka-bengaluru-south` to publish release `1.0.0` into `public/data` with zip, `SHA256SUMS`, changelog, declarations, and source register exports (`sources.json`, `sources.csv`).

## Affected Memory

- `architecture/overview`: (modify) Update architecture invariants to Rules R1–R14, add `consolidate` stage and `SOURCE_DATE_EPOCH` reproducibility, document multi-layer geospatial pipeline (`official_boundary`, `master_plan_zone`, `derived_overlay`, `reference`), and document the 8-route dg2n Next.js static/client architecture with production `visibility: test` filtering and blocking `axe-core` accessibility checks.
- `schemas/data-contracts`: (modify) Upgrade data contract documentation from Schema v1.1 to Schema v1.2, covering R12 record version separation (`record_version`, `record_supersedes`, `record_superseded_by`, `record_change_reason`), R13 `text_rights` (`full_text | reference_only`), R14 `derived` consolidated clauses and geo layers, clause-zone tags, and expanded `declarations.json` schemas.

## Impact

- **Schemas & Codegen (`schemas/`, `scripts/generate_models.py`, `pipeline/bylaws/models/_generated.py`, `lib/types/generated.ts`)**: All 8 existing schemas updated to v1.2 plus new/extended definitions for consolidated clauses, geo layers, and clause-zone tags.
- **Python Pipeline (`pipeline/bylaws/`, `pipeline/tests/`)**: `acquire.py`, `parsers/`, `compare.py`, `structure.py`, `amendments.py`, `consolidate.py` (new), `overrides.py`, `validate.py`, `publish.py`, and `geo/` (`boundaries.py`, `zones.py`, `rasterize.py`, `gcp.py`, `georef.py`, `verify.py`).
- **Jurisdiction Config, Overrides & Reports (`jurisdictions/in-ka-bengaluru-south.yaml`, `data/overrides/in-ka-bengaluru-south/`, `data/reports/in-ka-bengaluru-south/`, `docs/sources/in-ka-bengaluru-south.md`, `docs/decisions/`)**: Complete Bengaluru South source register, overrides, recon/parser/QA/map verification reports, and decision records.
- **Next.js Web App (`app/`, `components/`, `lib/`, `public/data/`, `__tests__/`)**: Complete dg2n UI across `/`, `/j/[id]`, `/j/[id]/sources`, `/j/[id]/documents/[doc]`, `/j/[id]/timeline`, `/j/[id]/review`, `/data`, `/about`, Leaflet map integration, and `axe-core` CI suite.

## Open Questions

None — Plan v2.0 (`/home/manideep/Downloads/bylaws-plan-v2-south-bengaluru.md`) explicitly specifies the scope, rules R1–R14, source register, schema v1.2 fields, fallback/gap declaration rules ("No human checkpoints... Never invent, never stop"), and acceptance checklist.

## Assumptions

| # | Grade | Decision | Rationale | Scores |
|---|-------|----------|-----------|--------|
| 1 | Certain | Execute all four parts of Plan v2.0 (Part A Foundations, Part B Sources, Part C Maps, Part D Website & release 1.0.0) in a single Fab change and single PR with step-scoped work | User explicitly instructed `lets do everything in this fab` after `/fab-discuss` on Plan v2.0, matching Plan v2.0 §1 ("One fresh agent session, one pull request") | S:95 R:85 A:95 D:95 |
| 2 | Certain | Publish datasets to `public/data/` at the repository root (the Next.js `public/` directory) while keeping `lib/data.ts` and `publish.py` aligned | Repo root hosts the Next.js app (`app/`, `public/`), as established in ADR and `architecture/overview.md` | S:90 R:95 A:95 D:95 |
| 3 | Certain | Link `"View source p. N"` to the document's official/mirror PDF URL with `#page=N` fragment rather than committing hundreds of MBs of raw PDFs into `public/data/` | Preserves repo/Vercel bundle size limits while satisfying R2/R13 provenance and Plan v2.0 §D.2 ("linking to the original PDF page") | S:85 R:90 A:90 D:90 |
| 4 | Certain | Follow Plan v2.0 "Never invent, never stop" rule for unobtainable sources, scanned/unreliable tables, or map sheets failing RMSE/coverage thresholds by publishing the honest best output (e.g. planning district outlines, reference metadata) and declaring every gap in `declarations.json` and `data/reports/` | Explicitly mandated by Plan v2.0 §1, §5.B1, §5.B5, §5.C3, and §5.C4 | S:95 R:90 A:95 D:95 |
| 5 | Confident | Keep `/j/[id]/clauses` route functional alongside the new `/j/[id]/documents/[doc]` and `/j/[id]/sources` routes so existing links and navigation patterns continue to work seamlessly | Backward-compatible route preservation is low-cost and prevents broken internal links | S:80 R:90 A:90 D:85 |

5 assumptions (4 certain, 1 confident, 0 tentative, 0 unresolved).
