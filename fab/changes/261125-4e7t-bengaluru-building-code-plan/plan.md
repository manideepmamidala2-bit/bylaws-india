# Plan: Bengaluru Building Code: From Structured Library to Usable Code (Parts 1–6)

**Change**: 261125-4e7t-bengaluru-building-code-plan
**Intake**: `intake.md`

## Requirements

### Schemas & Storage Foundation: Unified Schema 1.4, Content-Addressed Shared Documents, Out-of-Git Data & Per-Chapter Splitting (Part 1)

#### R1: Baseline Tracking, Single Schema Version (`1.4`), and Shared Document Deduplication
The repository MUST record the starting baseline (`Release 3.0.0`, commit `e7e033e`) in `docs/progress.md` and maintain resumable part-by-part progress, counts, decisions made, owner review items, and known gaps across `docs/progress.md` and the draft PR description. Every JSON Schema in `schemas/*.schema.json` (including new `parameters.schema.json` and `resolution.schema.json`), jurisdiction configuration (`jurisdictions/*.yaml`), override file (`data/overrides/**/*.yaml`), and published JSON/GeoJSON dataset MUST use `schema_version: "1.4"`, with `pipeline/bylaws/models/_generated.py` and `lib/types/generated.ts` regenerated via `scripts/generate_models.py` and verified by a blocking CI/pytest check. Shared base documents and shared amendments MUST be stored once (content-addressed / deduplicated under the shared parent store and referenced by digest/URL in child corporation manifests) so each City Corporation stores only what differs (corporation amendments, consolidated differences, boundaries, wards, zones, and corporation-specific parameter/resolution outputs).

- **GIVEN** all `schemas/*.schema.json`, `jurisdictions/*.yaml`, `data/overrides/**/*.yaml`, and published release artifacts
- **WHEN** `make generate` and `pytest pipeline/tests/` execute
- **THEN** every schema, config, override, and published artifact carries `schema_version: "1.4"` with zero schema-version mismatches and zero unshared duplicate base `.clauses.json` copies across the five City Corporations

#### R2: Out-of-Git Published Data & PMTiles, Range-Request Verification, Per-Chapter Loading, Page Budgets, Pagefind Search, and CI Browser Tests
Published Bengaluru release payloads (`~248 MB`) and `basemap.pmtiles` (`33 MB`) MUST be removed from git tracking (`.gitignore` excluding `public/data/in-ka-bengaluru*` while retaining `public/data/xx-test-fixture/` and `public/data/manifest.json`) and served from HTTP range-request (`206 Partial Content`) and CORS-enabled storage (or a local build/range server during CI and local builds), verified by an automated range/CORS test. Structured and consolidated documents MUST be split into `<doc_id>.outline.json` plus per-chapter `<doc_id>/chapters/<chapter_eid>.json` payloads loaded on demand so every rendered route meets the page budgets (HTML per page `<= 300 KB`, initial JS + data per page `<= 1.5 MB` uncompressed). Cross-document static search MUST be provided via Pagefind (`public/pagefind/`), `declarations.json` MUST be regenerated accurately from actual dataset state without stale notices, and `.github/workflows/ci.yml` MUST run Playwright browser tests verifying map tile `206` responses + non-blank canvas, a document page within budgets, and the Part 5 plot card flow.

- **GIVEN** the built Next.js application and local/remote range-capable data store
- **WHEN** the page-weight check, range-request test, Pagefind search index generation, and Playwright CI suite run
- **THEN** `git status` tracks zero large `public/data/in-ka-bengaluru*` payloads or `.pmtiles` files, range requests return `HTTP 206` with CORS headers, every page has HTML `<= 300 KB` and initial JS+data `<= 1.5 MB`, Pagefind indexes active provisions, and Playwright E2E tests pass in CI

### Consolidated Code & Incorporation Modelling (Part 2)

#### R3: Full Consolidated Documents per Corporation and Date, Quiet Change Marks, and Bye-law 1.4 Incorporation
`pipeline/bylaws/consolidate.py` MUST generate full consolidated versions of every base document (`bbl-2003`, `rmp2015-zr`) — including every provision, sub-item, and table, not only changed clauses — as of today and as of each amendment effective date, per corporation where the 2026 corporation bye-laws differ, published per chapter as JSON (`outline.json` + `chapters/<chapter_eid>.json`), rendered as a readable consolidated document view in the web UI, and exported as Akoma Ntoso XML (`.akn.xml`). Each amended provision MUST display a quiet inline change mark (e.g., `"Changed 2026, South City Corporation"`) linking to the amending provision and original wording. Synthetic `"substitute"` effects authored by `rmp2015-zr` against `bbl-2003` MUST be removed and replaced with an explicit `incorporates` relation from `bbl-2003` bye-law `1.4` to `rmp2015-zr` covering `use`, `coverage`, `far`, `setbacks`, `height`, `floors`, `dwelling_units`, and `parking`, keeping both texts live and declaring unobtained amendments (such as the July 2025 zoning amendment).

- **GIVEN** `bbl-2003`, `rmp2015-zr`, and their structured 2004–2026 amendments across `in-ka-bengaluru` and the 5 City Corporations
- **WHEN** `bylaws amendments` and `bylaws publish` execute
- **THEN** full per-chapter consolidated JSON and Akoma Ntoso XML exist for every base document per corporation and effective date, changed provisions carry quiet change notes, zero `substitute` effects from `rmp2015-zr` target `bbl-2003`, and an `incorporates` relation from `bbl-2003` bye-law `1.4` to `rmp2015-zr` is published

### Building Parameters & Table Range Parsing (Part 3)

#### R4: Structured Building Parameters (`parameters.json`), Range Parser, and 40-Record Page-Image Self-Check
`pipeline/bylaws/parameters.py` MUST extract dated, condition-qualified parameter records (`parameters.json` validated against `schemas/parameters.schema.json`) for `ground_coverage_max_pct`, `far_base_max`, `far_premium_additional_max`, `tdr_receivable_max`, `setback_front_min_m`, `setback_rear_min_m`, `setback_side_min_m`, `building_height_max_m`, `floors_max`, and `parking_requirement` from existing structured tables and provisions (`rmp2015-zr` development control tables, January 2026 setback tables, 2026 corporation bye-law tables, April 2025 premium FAR chapter, TDR rules, and parking tables). Multi-row table headers, footnotes, numeric intervals (`plot_area_m2`, `plot_depth_m`, `plot_width_m`, `road_width_m`, `building_height_m` with inclusive/exclusive bounds), categorical conditions (`zone`, `area_class`/`ring`, `use`, `jurisdiction`), unexpressible conditions (`dependent: true`), and known table OCR misreads (`"10,000 sq. mtrs"` read as `"0"`) MUST be accurately parsed and cross-checked against `cell_text` (listing any mismatches for owner review), with a 40-record page-image self-check recorded in `data/reports/<jurisdiction>/qa.md`.

- **GIVEN** the structured tables in `rmp2015-zr`, its 2009–2026 amendments, and `bbl-2003` + 2026 corporation amendments
- **WHEN** parameter extraction and validation execute
- **THEN** `parameters.json` validates against `schemas/parameters.schema.json`, every record carries `value`, `unit`, `value_text`, `conditions`, `valid_from`, `valid_to`, `legal_status`, cell-level `source`, `derived: true`, `method`, `confidence`, and `verification: "machine_checked"`, and `qa.md` includes a 40-record page-image self-check table

### Statutory Resolution, Plot Resolver & Rebuilt Relations (Part 4)

#### R5: Six-Step Statutory Resolution (`resolution.yaml`), Deterministic Pipeline/Browser Resolver, and Jayanagar Worked Target
`jurisdictions/resolution.yaml` (validated against `schemas/resolution.schema.json`) MUST encode the six statutory resolution steps in order (1. Drafts never apply; 2. Corporation amendment applies only inside that corporation; 3. GBGA 2024 `"notwithstanding"` prevails; 4. Zoning regulations govern `use`, `coverage`, `far`, `setbacks`, `height`, `floors`, `dwelling_units`, and `parking` via bye-law `1.4`; 5. Later in-force provision within the same instrument family wins; 6. Otherwise `"not_settled"` showing both), each with its verbatim quote from structured text. Both `pipeline/bylaws/resolver.py` (`bylaws resolve`) and `lib/resolver.ts` MUST implement identical deterministic point-in-polygon and condition-matching resolution logic, and MUST pass the worked target acceptance test for a `600 m²` plot on a `15 m` road in a `Residential (Main)` zone of Jayanagar (`in-ka-bengaluru-south`) after confirming every expected value against rendered PDF page images.

- **GIVEN** a `600 m²` plot on a `15 m` road in a `Residential (Main)` zone of Jayanagar (`in-ka-bengaluru-south`) today
- **WHEN** both `bylaws resolve` (Python) and `resolvePlotParameters` (`lib/resolver.ts`) evaluate the plot
- **THEN** both return identical deterministic results matching the PDF page-image-confirmed values for coverage, base FAR, January 2026 setbacks, premium FAR, TDR, height, parking, lake buffer overlay, and South City Corporation 2026 bye-law notes, each citing its source cell/page and resolution step

#### R6: Rebuilt Legal Relations, Public Precision Gate, and 60-Item Owner Labelling Sheet
`pipeline/bylaws/relations.py` MUST rebuild `relations.json` to emit only the six legal relation kinds (`amends`, `incorporates`, `corporation_differs`, `cross_document_reference`, `definition_differs` restricted to applicable documents, and inter-instrument `precedence`), removing word-matching `same_topic` and raw number-matching `numeric_differs` relations. Only structurally confirmed kinds (`amends`, `incorporates`, `corporation_differs`) SHALL be shown publicly (`public_visible: true`), while a 60-item labelling sheet (`10` per kind across the 6 kinds) MUST be generated in `docs/review/relations-labelling.md` for owner review.

- **GIVEN** the structured corpus with `ka-model-bbl-2017` excluded from active applicability
- **WHEN** `relations.json` and `docs/review/relations-labelling.md` are generated
- **THEN** `relations.json` contains zero `same_topic` or `numeric_differs` records, only `amends`, `incorporates`, and `corporation_differs` have `public_visible: true`, and `docs/review/relations-labelling.md` contains 60 sampled items (10 per kind) for owner precision review

### Readable, Plot-First Web Application & Register Hygiene (Parts 5 & 6)

#### R7: Map-First Home, Protomaps Light Style, Official RMP 2015 Colours, Place/Ward Search, and Plot Card
The home route (`/`) MUST render the interactive map full-width above the fold on desktop and mobile with one line of introduction. The map (`lib/map-style.ts`, `components/ZoneMap.tsx`) MUST use the Protomaps light base style from `basemap.pmtiles`, draw semi-transparent land-use zone polygons coloured per the official RMP 2015 land-use legend **beneath** street and place name labels (`beforeId` below symbol layers), show zone codes inside polygons only when zoomed in, expose Zoom, Scale bar, Full screen, My location, and Layer switch (`Streets`, `Land-use zones`, `Wards`, `Corporations`, `Original sheet overlay`), and support client-side search by place name (from `basemap.pmtiles`) and ward name/number without external geocoding. Clicking a location MUST open the Plot Card (`components/PlotCard.tsx`) displaying Corporation, Ward, Planning District, Land-Use Zone (or `"Zone data not yet available here"` with manual zone picker), plot inputs, resolved parameter answers with one-line reasons and PDF page links, `"Not settled"` dual rules, the mandatory derived-work confirmation notice, and a shareable URL.

- **GIVEN** the home page (`/`) in desktop and mobile viewports
- **WHEN** a user searches for a place/ward or clicks a Jayanagar plot on the map and enters `600 m²` area and `15 m` road width
- **THEN** the Protomaps light map renders above the fold with street names legible above RMP-coloured zones, the Plot Card displays the resolved parameters with one-line reasons, provision links, PDF page links, and mandatory notice, and the browser URL encodes the shareable plot parameters

#### R8: Less Verbose Reading, Resolution Cards, `ka-model-bbl-2017` Exclusion, and Plain-Language Gap Declarations
The web interface MUST replace verbose conflict cards with concise Resolution cards, group zone panels by regulatory topic (`Uses`, `Coverage`, `FAR`, `Setbacks`, `Height`, `Parking`), show status/verification/dates once per document (and on a provision only when different), hide internal IDs/codes inside a `"Details"` toggle, and limit page introductions to at most two sentences. `ka-model-bbl-2017` MUST be marked `"Not applicable here (likely)"` under `"In force elsewhere, not applicable here"` with quoted statutory evidence from the *Karnataka Municipalities Act, 1964*, keeping its text browsable from the register while excluding it from definitions, relations, parameters, and plot answers. All coverage gaps (July 2025 zoning amendment, 2024 Kannada compilation, supporting instruments not in dataset, land-use zones outside the 4 processed sheets) MUST be declared in plain words in `declarations.json` and on `/data`.

- **GIVEN** the Sources, Document, Map, and Data pages
- **WHEN** inspected and audited with `vitest`, Playwright, and `axe-core`
- **THEN** `ka-model-bbl-2017` appears under `"In force elsewhere, not applicable here"` and never feeds plot answers or active relations, internal IDs are hidden inside `"Details"`, page introductions are at most two sentences, `/data` lists Release `4.0.0` artifacts and checksums, zero records are marked `human_verified`, and all WCAG AA accessibility checks pass

### Non-Goals
- Acquiring new external PDFs or scraping new websites — strictly use data already in the repository (`docs/plans/building-code-plan.md` §3 Decision 6).
- Kannada UI translation or structuring the 2024 Kannada-only compilation — English only (`docs/plans/building-code-plan.md` §3 Decisions 3 & 7).

### Design Decisions

#### Unified Schema 1.4 and Per-Chapter Content-Addressed Storage
**Decision**: Unify all JSON Schemas (`schemas/*.schema.json`) to `schema_version: "1.4"`, add `parameters.schema.json` and `resolution.schema.json`, store shared base/amendment documents once in the parent `in-ka-bengaluru` store, and split large clause trees and consolidated documents into `<doc_id>.outline.json` + per-chapter `<doc_id>/chapters/<chapter_eid>.json` files.
**Why**: Eliminates schema version drift (`1.2` vs `1.3` vs `1.4`), avoids 6-way corporation duplication of base documents, and cuts document page HTML payloads from ~12 MB to `< 300 KB` (`<= 1.5 MB` initial JS + data).
**Rejected**: Shipping monolithic multi-megabyte `.clauses.json` payloads into SSR HTML or maintaining per-corporation copies of unchanged base documents.
*Introduced by*: 261125-4e7t-bengaluru-building-code-plan

#### Statutory Incorporation (`incorporates`) and Declarative 6-Step Resolution (`resolution.yaml`)
**Decision**: Model `bbl-2003` Bye-law `1.4` (inserted 2017) as an `incorporates` relation to `rmp2015-zr` for use, coverage, FAR, setbacks, height, floors, dwelling units, and parking, and resolve multi-instrument parameters deterministically through the 6 cited steps in `jurisdictions/resolution.yaml` shared between `pipeline/bylaws/resolver.py` and `lib/resolver.ts`.
**Why**: Accurately reflects Indian municipal law (incorporation by reference rather than textual repeal/substitution of `bbl-2003`), preserves both consolidated texts, and ensures every plot parameter answer cites a deterministic statutory priority step or honestly reports `"Not settled: two rules apply"`.
**Rejected**: Treating `rmp2015-zr` as textually substituting `bbl-2003` clauses or using heuristic word/number matching to flag unresolved conflicts.
*Introduced by*: 261125-4e7t-bengaluru-building-code-plan

## Tasks

### Phase 1: Setup, Baseline & Draft PR

- [x] T001 Record baseline Release `3.0.0` and commit `e7e033e` in `docs/progress.md`, open the initial draft PR on GitHub with the preview URL at the top and structured sections (`Progress`, `For owner review`, `Decisions made`, `Known gaps`, `Counts`) <!-- R1 -->

### Phase 2: Part 1 — Clean Foundation and Speed

- [x] T002 Unify all `schemas/*.schema.json` (including new `schemas/parameters.schema.json` and `schemas/resolution.schema.json`), `jurisdictions/*.yaml`, and `data/overrides/**/*.yaml` to `schema_version: "1.4"`, update `scripts/generate_models.py` and `pipeline/bylaws/schema_validator.py`, regenerate `pipeline/bylaws/models/_generated.py` and `lib/types/generated.ts`, and add `pipeline/tests/test_schema_version_uniformity.py` <!-- R1 -->
- [x] T003 Update `pipeline/bylaws/publish.py`, `pipeline/bylaws/storage.py`, `scripts/sync_storage.py`, `.gitignore`, and `lib/data.ts` to store shared documents once (content-addressed / deduplicated), split structured documents into `<doc_id>.outline.json` + per-chapter `<doc_id>/chapters/<chapter_eid>.json`, move `public/data/in-ka-bengaluru*` and `basemap.pmtiles` out of git tracking while verifying HTTP `206` range requests and CORS in `pipeline/tests/test_range_storage.py`, regenerate accurate `declarations.json`, add Pagefind cross-document search (`scripts/build_search.mjs`, `components/SearchBar.tsx`), and enforce page budgets (`<= 300 KB` HTML, `<= 1.5 MB` JS+data) and Playwright CI tests in `.github/workflows/ci.yml` — then commit, push, and update `docs/progress.md` and the PR body for Part 1 <!-- R2 -->

### Phase 3: Part 2 — The Consolidated Code

- [x] T004 Upgrade `pipeline/bylaws/amendments.py`, `pipeline/bylaws/consolidate.py`, and `pipeline/bylaws/relations.py` to remove synthetic `substitute` effects from `rmp2015-zr` against `bbl-2003`, add the `incorporates` relation from `bbl-2003` bye-law `1.4` to `rmp2015-zr` for the 8 parameters, generate full per-chapter consolidated documents (`bbl-2003`, `rmp2015-zr`) as of today and each amendment date per corporation with quiet change marks and Akoma Ntoso XML (`.akn.xml`) export, and declare unobtained amendments in `declarations.json` — then commit, push, and update `docs/progress.md` and the PR body for Part 2 <!-- R3 -->

### Phase 4: Part 3 — Parameters: The Numbers as Data

- [x] T005 Implement `pipeline/bylaws/parameters.py` and wire into `pipeline/bylaws/cli.py` / `publish.py` / `validate.py` to fix multi-row headers, footnotes, and numeric misreads (`"10,000 sq. mtrs"`), parse numeric intervals and categorical conditions for all 10 building parameter types into `parameters.json`, cross-check every parsed value against `cell_text` (`data/reports/in-ka-bengaluru-south/parameter-mismatches.md`), and generate the 40-record PDF page-image self-check in `data/reports/in-ka-bengaluru-south/qa.md` with unit tests in `pipeline/tests/test_parameters.py` — then commit, push, and update `docs/progress.md` and the PR body for Part 3 <!-- R4 -->

### Phase 5: Part 4 — Resolution, Plot Resolver & Rebuilt Relations

- [x] T006 Author `jurisdictions/resolution.yaml` with the 6 cited statutory steps and verbatim quotes from structured text, implement the deterministic resolver in `pipeline/bylaws/resolver.py` (`bylaws resolve` CLI) and `lib/resolver.ts` (using `shapely` and `@turf/boolean-point-in-polygon`), confirm the Jayanagar `600 m²` / `15 m` road `Residential (Main)` worked target against rendered PDF page images, and add falsifiable tests in `pipeline/tests/test_resolver.py` and `__tests__/resolver.test.ts` <!-- R5 -->
- [x] T007 Rebuild `pipeline/bylaws/relations.py` to keep only the 6 legal relation kinds (`amends`, `incorporates`, `corporation_differs`, `cross_document_reference`, `definition_differs`, `precedence`), gate public visibility to `amends`, `incorporates`, and `corporation_differs`, and generate the 60-item owner labelling sheet in `docs/review/relations-labelling.md` — then commit, push, and update `docs/progress.md` and the PR body for Part 4 <!-- R6 -->

### Phase 6: Part 5 — Readable, Plot-First Site

- [x] T008 Redesign `app/page.tsx`, `lib/map-style.ts`, `components/ZoneMap.tsx`, `components/PlotCard.tsx`, `components/ClausePanel.tsx`, and `components/ClauseTree.tsx` to make Home (`/`) the full-width above-the-fold map with Protomaps light style, labels above official RMP 2015 legend-coloured zones, zoom-gated zone codes, local place-name (from PMTiles) and ward search, interactive Plot Card with answers/reasons/page links/`"Not settled"` dual display/shareable URL, Resolution cards, topic-grouped zone panel, document-level status header, `"Details"` toggle for internal IDs, and `<= 2`-sentence introductions — then commit, push, and update `docs/progress.md` and the PR body for Part 5 <!-- R7 -->

### Phase 7: Part 6 — Register, Gaps & Final Verification

- [ ] T009 Update `jurisdictions/in-ka-bengaluru*.yaml`, `pipeline/`, and `app/j/[id]/sources/page.tsx` + `app/data/page.tsx` to mark `ka-model-bbl-2017` as `"Not applicable here (likely)"` under `"In force elsewhere, not applicable here"` (excluding it from definitions, relations, parameters, and plot answers), declare all coverage gaps in plain words, publish Release `4.0.0` metadata and counts on `/data`, and verify all unit, Playwright E2E, page-budget, R1–R16, and `axe-core` tests pass — then commit, push, and update `docs/progress.md` and the PR body for Part 6 <!-- R8 -->

## Execution Order

- T001 runs first to record baseline and open the single draft PR
- T002 and T003 complete Part 1 and push
- T004 completes Part 2 and pushes
- T005 completes Part 3 and pushes
- T006 and T007 complete Part 4 and push
- T008 completes Part 5 and pushes
- T009 completes Part 6, runs full verification, and pushes

## Acceptance

### Functional Completeness

- [ ] A-001 R1: `docs/progress.md` records the baseline release (`3.0.0`) and commit (`e7e033e`), and all schemas, configs, overrides, and published outputs use `schema_version: "1.4"` with CI failing on mismatch
- [ ] A-002 R1: Shared base documents and amendments are stored once and referenced across corporations without duplicating unchanged `.clauses.json` payloads
- [ ] A-003 R2: Published Bengaluru data and `basemap.pmtiles` are removed from git tracking, HTTP `206` range requests and CORS are verified by tests, documents load per chapter within page budgets (`<= 300 KB` HTML, `<= 1.5 MB` initial JS+data), Pagefind cross-document search works statically, `declarations.json` is regenerated accurately, and Playwright browser tests run in CI
- [ ] A-004 R3: Full consolidated text is published per chapter (plus Akoma Ntoso XML) for every base document as of today and each amendment date per corporation, changed provisions show quiet change marks, and `bbl-2003` bye-law `1.4` is modelled as `incorporates` rather than `substitute`
- [ ] A-005 R4: `parameters.json` contains dated records for coverage, FAR (base, premium, TDR), setbacks, height, floors, and parking with numeric intervals, categorical conditions (`dependent: true` when unexpressible), and cell-level sources, backed by cell-text checks and a 40-record page-image self-check in `qa.md`
- [ ] A-006 R5: `jurisdictions/resolution.yaml` defines the 6 cited statutory steps with verbatim quotes, and both Python (`bylaws resolve`) and TypeScript (`lib/resolver.ts`) resolvers deterministically pass the Jayanagar `600 m²` / `15 m` road `Residential (Main)` worked target confirmed against PDF page images
- [ ] A-007 R6: `relations.json` contains only the 6 legal relation kinds, shows only `amends`, `incorporates`, and `corporation_differs` publicly, and `docs/review/relations-labelling.md` provides a 60-item (10 per kind) owner labelling sheet
- [ ] A-008 R7: Home (`/`) renders a full-width above-the-fold map in the Protomaps light style with labels above official RMP 2015 legend-coloured zones, local place/ward search, and a Plot Card with answers, one-line reasons, PDF page links, `"Not settled"` cases, mandatory disclaimer, and shareable URL
- [ ] A-009 R8: `ka-model-bbl-2017` is listed under `"In force elsewhere, not applicable here"` and excluded from definitions, relations, parameters, and plot answers; Resolution cards replace conflict cards; internal IDs live inside `"Details"`; page introductions are `<= 2` sentences; all gaps are declared in plain words; and `/data` lists Release `4.0.0`

### Behavioral Correctness

- [ ] A-010 R3: Removing `rmp2015-zr` synthetic `substitute` effects leaves both `bbl-2003` and `rmp2015-zr` provisions intact in their respective consolidated documents while Step 4 of `resolution.yaml` selects `rmp2015-zr` via `bbl-2003` bye-law `1.4`
- [ ] A-011 R4: Known table misreads (such as `"10,000 sq. mtrs"` previously parsed as `"0"`) and multi-row headers (`"Max"` / `"Min"`) are accurately parsed into numeric interval bounds

### Scenario Coverage

- [ ] A-012 R5: Both `pytest pipeline/tests/test_resolver.py` and `npx vitest run __tests__/resolver.test.ts` verify the Jayanagar `600 m²` / `15 m` road `Residential (Main)` worked target and edge cases (draft exclusion, corporation-specific bye-law, GBGA notwithstanding, unknown zone outside processed sheets, and `"not_settled"` ties)
- [ ] A-013 R2: Playwright E2E tests verify map rendering (`206` tile responses and non-blank canvas), per-chapter document rendering within weight budgets, and interactive plot card resolution

### Edge Cases & Error Handling

- [ ] A-014 R5: Clicking a map location outside the 4 processed RMP 2015 land-use sheets reports `"Zone data not yet available here"` and allows the user to manually choose a zone (clearly marked as user-selected)
- [ ] A-015 R8: Zero source content is invented and zero records carry `verification: "human_verified"`

### Code Quality

- [ ] A-016 Pattern consistency: New Python and TypeScript modules follow existing repository conventions, strict typing, and R1 zero-hardcoding rules
- [ ] A-017 No unnecessary duplication: Shared resolution and range-parsing structures follow single-source JSON Schema contracts (`schemas/*.schema.json`)
- [ ] A-018 Readability and maintainability: Functions remain focused, avoid magic strings/numbers, and keep pure bylaw computation separated from UI components

## Notes

- Check items as you review: `- [x]`
- All acceptance items must pass before `/fab-continue` (hydrate)
- If an item is not applicable, mark checked and prefix with **N/A**: `- [x] A-NNN **N/A**: {reason}`

## Assumptions

| # | Grade | Decision | Rationale | Scores |
|---|-------|----------|-----------|--------|
| 1 | Certain | Unify all schemas, configs, overrides, and published outputs to `schema_version: "1.4"` and publish as Release `4.0.0` | Directly required by `docs/plans/building-code-plan.md` Part 1 item 2 and Part 6 | S:95 R:85 A:95 D:95 |
| 2 | Certain | Store shared documents once under `/data/in-ka-bengaluru/4.0.0/` (content-addressed/deduplicated) and generate local build artifacts during `prebuild`/`build` while excluding `public/data/in-ka-bengaluru*` and `*.pmtiles` from git | Directly required by `docs/plans/building-code-plan.md` Part 1 items 3 and 4 | S:90 R:80 A:85 D:85 |
| 3 | Certain | Use Pagefind static indexing (`public/pagefind/`) and extracted PMTiles place names (`places.json`) for offline/static cross-document and place/ward search | Directly required by `docs/plans/building-code-plan.md` Part 1 item 6 and Part 5 | S:95 R:85 A:90 D:90 |

3 assumptions (3 certain, 0 confident, 0 tentative).
