# Intake: Bengaluru Building Code: From Structured Library to Usable Code (Parts 1–6)

**Change**: 261125-4e7t-bengaluru-building-code-plan
**Created**: 2026-11-25

## Origin

> Implement docs/plans/building-code-plan.md using only data already in the repository (no new acquisition): record the baseline release and commit; open one draft PR with the preview URL at the top; Part 1 one schema version, shared documents stored once, data and map tiles out of git with range requests verified, per-chapter loading within the page budgets, cross-document search, accurate declarations, browser tests in CI; Part 2 full consolidated documents per corporation and date, with bye-law 1.4 modelled as incorporation instead of substitution; Part 3 parameter records for coverage, FAR (base, premium, TDR), setbacks, height and parking parsed from the existing tables with numeric intervals, conditions and cell-level sources, plus a 40-record page-image self-check; Part 4 resolution.yaml with the six cited steps, a deterministic resolver in pipeline and browser, the Jayanagar 600 m² / 15 m road worked target confirmed against page images, relations rebuilt with only amends, incorporates and corporation_differs public and a 60-item labelling sheet; Part 5 map-first home with the Protomaps light style, labels above zones, official RMP legend colours, place and ward search, plot card with answers, reasons, page links and "not settled" cases, resolution cards and short plain copy; Part 6 Model Building Bye-laws 2017 marked not applicable here and all gaps declared in plain words; commit and push after each part, keep docs/progress.md resumable and the PR's "For owner review", "Decisions made" and "Known gaps" sections current; never invent source content, never mark anything as verified by a person.

One-shot invocation referencing the self-contained specification in `docs/plans/building-code-plan.md` (dated 25 November 2026), starting from baseline Release `3.0.0` at commit `e7e033e`.

## Why

1. **Problem**: While `bylaws-india` Release `3.0.0` holds verified raw sources, ~6,000 structured provisions across 66 tables, dated amendment effects, and 1,276 georeferenced land-use polygons across 4 RMP 2015 sheets, it functions as a document library rather than a consolidated, queryable building code:
   - Only ~25 amended clauses have consolidated views; users must mentally assemble the current law across documents.
   - Regulatory tables (`rmp2015-zr` Tables 1–10, January 2026 setback tables, 2026 corporation bye-law tables, premium FAR, TDR, parking) store numeric rules as raw text strings (`"Above 360 up to 1000"`, `"Up to 65%"`) with some multi-row header and number misreads (e.g., `"10,000 sq. mtrs"` parsed as `"0"`).
   - Bye-law `1.4` (inserted 2017) is mis-modelled as `rmp2015-zr` "substituting" `bbl-2003` clauses rather than statutory incorporation (`incorporates`).
   - `ka-model-bbl-2017` (enacted under the Karnataka Municipalities Act 1964 for municipalities, not city corporations) is treated as active in-force law, polluting definitions and relation conflicts.
   - Word- and number-matching relations produce noisy false-positive conflicts, and there is no deterministic plot resolver to answer "what may I build on this plot?".
   - Every corporation duplicates base document files (`~248 MB` of JSON plus a `33 MB` PMTiles archive tracked in git), document pages ship up to `12 MB` of HTML, schema versions vary (`1.2`, `1.3`, `1.4`), and the map starts below the fold with zone polygons obscuring street labels.
2. **Consequence of not fixing**: Architects, engineers, and residents cannot determine applicable coverage, FAR, setbacks, height, or parking for a plot without manually cross-referencing PDFs; page load sizes remain excessive (`12 MB` HTML); git repository bloat continues; and unverified relation heuristics obscure genuine statutory incorporation and corporation-level differences.
3. **Why this approach**: Executing the 6-part plan in `docs/plans/building-code-plan.md` using strictly existing repository data (no new acquisition) establishes a clean, single-schema (`1.4`), per-chapter content-addressed storage foundation (Part 1), builds full consolidated documents with proper `incorporates` modelling (Part 2), extracts typed numeric parameter intervals with cell-level provenance and a 40-record page-image self-check (Part 3), applies a 6-step cited statutory resolution engine in both Python and TypeScript verified against the Jayanagar 600 m² / 15 m road target (Part 4), delivers a Protomaps light map-first UI with a plot resolver card (Part 5), and isolates `ka-model-bbl-2017` while declaring all coverage gaps in plain English (Part 6).

## What Changes

### Part 1 — Clean Foundation and Speed

1. **Baseline & Progress Tracking (`docs/progress.md`)**:
   - Record baseline Release `3.0.0` and commit `e7e033e` in `docs/progress.md`.
   - Maintain resumable part-by-part progress, counts, decisions made, owner review items, and known gaps in `docs/progress.md` and the draft PR description.
2. **Single Schema Version (`1.4`) Across All Contracts**:
   - Unify all JSON Schemas in `schemas/*.schema.json` (including `document.schema.json`, `clause-zone-tags.schema.json`, `clause-tree.schema.json`, `annotations.schema.json`, `zones.schema.json`, `overrides.schema.json`, `declarations.schema.json`, `amendments.schema.json`, `consolidated.schema.json`, `geo-layers.schema.json`, `manifest.schema.json`, `relations.schema.json`, plus new `parameters.schema.json` and `resolution.schema.json`), jurisdiction configs, overrides, and published outputs to `schema_version: "1.4"`.
   - Regenerate `pipeline/bylaws/models/_generated.py` and `lib/types/generated.ts` via `scripts/generate_models.py` (`make generate`).
   - Add a CI check (and pytest test) that fails if any schema, config, override, or published JSON/GeoJSON file has a mismatched `schema_version`.
3. **Content-Addressed Shared Document Storage**:
   - Store shared base documents and amendments once under a shared content-addressed / common store (`/data/shared/documents/<doc_id>-<sha256_prefix>/...` or `/data/in-ka-bengaluru/<version>/documents/<doc_id>/...` referenced by content digest in `manifest.json`).
   - Each child City Corporation (`in-ka-bengaluru-central`, `-north`, `-south`, `-east`, `-west`) references shared documents and stores only what differs: its corporation-specific amendments, its consolidated differences, its parameters/resolutions delta, and its boundaries, wards, and zones.
4. **Data and Map Tiles Out of Git with Range-Request & CORS Verification**:
   - Remove the ~248 MB of generated `public/data/in-ka-bengaluru*` release payloads and the 33 MB `basemap.pmtiles` from git tracking (update `.gitignore` so only `public/data/xx-test-fixture/` and `public/data/manifest.json` or pointer manifest remain tracked in git, while keeping raw/processed/blob sync scripts reproducible).
   - Provide an object-storage upload & verification module (`scripts/sync_storage.py` / `pipeline/bylaws/storage.py`) supporting HTTP range requests (`206 Partial Content`) and CORS (`Access-Control-Allow-Origin`, `Access-Control-Expose-Headers: Content-Range, Content-Length, Accept-Ranges`) targeting Vercel Blob (if range/CORS test passes) or Cloudflare R2 / configurable `NEXT_PUBLIC_DATA_BASE_URL`, plus a local HTTP range-supporting static server / prebuild hook for CI and local preview builds.
   - Verify HTTP `206` range requests and CORS headers with an automated test.
5. **Per-Chapter Splitting & Page Weight Budgets**:
   - Split structured documents and consolidated documents into a lightweight document outline (`<doc_id>.outline.json` with chapter/part headings, hierarchy metadata, table list, and chapter file pointers) plus per-chapter payload files (`<doc_id>/chapters/<chapter_eid>.json`).
   - Update `/j/[id]/documents/[doc]` and `ClauseTree.tsx` to render the outline immediately and fetch chapters on demand (initial chapter + lazy load / expand on navigation or deep link).
   - Enforce page weight budgets in CI (`pipeline/tests/` / Playwright / build audit):
     - HTML per page ≤ `300 KB` uncompressed.
     - Initial JavaScript + data per page ≤ `1.5 MB` uncompressed.
6. **Cross-Document Static Search with Pagefind**:
   - Integrate Pagefind (`npx pagefind`) into the build pipeline to index all structured/consolidated provisions across documents (excluding non-applicable `ka-model-bbl-2017` from active law search or clearly filtering it) with static client-side search UI (`SearchModal` / search bar on Home and Documents pages) requiring zero server runtime.
7. **Regenerate Accurate Declarations**:
   - Regenerate `declarations.json` directly from the actual structured/consolidated/parameter dataset state, removing stale notices (such as outdated "Two base documents published" or stale amendment notices where amendments are now applied).
8. **Browser Tests in CI (Playwright)**:
   - Configure `.github/workflows/ci.yml` to run Playwright browser tests verifying:
     1. Map renders (`basemap.pmtiles` tile requests return HTTP `206`, WebGL canvas is not blank).
     2. One document page renders with per-chapter loading within the page budget.
     3. The plot resolver flow (from Part 5) renders answers, citations, and page links.

### Part 2 — The Consolidated Code

1. **Full Consolidated Text per Corporation and Date**:
   - Upgrade `pipeline/bylaws/consolidate.py` and `schemas/consolidated.schema.json` so `consolidated` outputs contain the **full consolidated text of every base document** (`bbl-2003`, `rmp2015-zr`) — every provision, table, and sub-item, not only the ~25 changed clauses — as of today (`latest`) and as of each historical amendment effective date (`2004-06-05`, `2007-06-25`, `2009-03-03`, `2015-03-05`, `2017-10-28`, `2018-09-04`, `2019-06-20`, `2025-04-01`, `2025-10-16`, `2026-01-20`, `2026-05-14`), per corporation where the 2026 corporation bye-laws differ.
   - Publish consolidated documents per chapter as JSON (`consolidated/<doc_id>/<as_of_date>/outline.json` and `chapters/<chapter_eid>.json`) and as a readable consolidated view in the web UI, plus an Akoma Ntoso XML (`.akn.xml`) export per consolidated document.
2. **Quiet Change Marks**:
   - On each provision modified by an amendment, display a quiet inline change note (e.g., `"Changed 2026, South City Corporation"`) linking to the amending provision and toggling/showing the original wording.
3. **Model Bye-law 1.4 as Statutory Incorporation (`incorporates`)**:
   - Remove any synthetic `"substitute"` amendment effects authored by `rmp2015-zr` against `bbl-2003`.
   - Record an explicit `incorporates` relation from `bbl-2003` bye-law `1.4` (inserted 28-10-2017) to `rmp2015-zr` for the eight listed building parameters (`use`, `coverage`, `far`, `setbacks`, `height`, `floors`, `dwelling_units`, `parking`), citing bye-law `1.4` verbatim. Both `bbl-2003` and `rmp2015-zr` remain live consolidated texts.
4. **Consolidation Scope Declarations**:
   - Explicitly declare what the consolidation cannot include (e.g., the July 2025 zoning amendment `UDD 85 MNJ 2025`, which was never obtained).

### Part 3 — Parameters: The Numbers as Data

1. **Parameter Schema (`schemas/parameters.schema.json`) and Output (`parameters.json`)**:
   - Define `ParameterRecord` in `schemas/parameters.schema.json` (`schema_version: "1.4"`):
     - `parameter_id`: stable deterministic ID.
     - `parameter`: enum of `"ground_coverage_max_pct" | "far_base_max" | "far_premium_additional_max" | "tdr_receivable_max" | "setback_front_min_m" | "setback_rear_min_m" | "setback_side_min_m" | "building_height_max_m" | "floors_max" | "parking_requirement"`.
     - `value`: `number | string | null` (numeric value where expressible), `unit`: `string` (`"%"`, `"ratio"`, `"m"`, `"floors"`, `"spaces_per_m2"`, `"spaces_per_dwelling"`, etc.), `value_text`: exact cell string as printed in the source table/provision.
     - `conditions`: structured object with:
       - Numeric intervals (`{ min: number | null, max: number | null, min_inclusive: boolean, max_inclusive: boolean }`) for `plot_area_m2`, `plot_depth_m`, `plot_width_m`, `road_width_m`, `building_height_m`.
       - Categorical filters for `zone` (e.g. `R-Main`, `R-Mixed`, `C-Central`, `I-General`, `T&U`, etc.), `area_class` / `ring` (e.g. `ring_i`, `ring_ii`, `ring_iii`, `intensely_developed`, `moderately_developed`, `sparsely_developed`), `use` (`residential`, `commercial`, `industrial`, `public_semi_public`, `traffic_transportation`, etc.), `jurisdiction` (`in-ka-bengaluru` or specific corporation ID).
       - `unexpressed_conditions`: `string[]` and `dependent: boolean` (`true` when a footnote or prose condition cannot be fully expressed as intervals/categories).
     - `valid_from`: ISO date, `valid_to`: ISO date or `null`, `legal_status`: `"in_force" | "draft" | "superseded" | "withdrawn" | "status_unknown"`.
     - `source`: `{ doc_id, eid, table_eid, row_index, col_index, column_header, row_header, cell_text, page, bbox, official_url, archive_url }`.
     - `derived: true`, `method`: `"table_rule_parser" | "clause_rule_parser" | "override_curated"`, `confidence`: `0.0`–`1.0`, `verification`: `"machine_checked" | "unverified"`.
2. **Table Header Normalization & Range Parser (`pipeline/bylaws/parameters.py`)**:
   - Fix multi-row table header merging in `structure.py` / `parameters.py` (preventing words like `"Max"` or `"Min"` from being misread as units).
   - Attach table footnotes that qualify or alter numeric values to the resulting parameter records.
   - Implement a deterministic range parser handling all phrasing in `rmp2015-zr`, its 2009–2026 amendments, and `bbl-2003` + 2026 corporation amendments: `"Up to X"`, `"Above X up to Y"`, `"Above X and up to Y"`, `"X to Y"`, `"Less than X"`, `"Below X"`, `"X and above"`, `"More than X"`, `"Exceeding X"`, across `m`, `mtrs`, `m²`, `sq. mtrs`, `sq.m`, `sq ft`, `ha`, and `%`.
   - Fix known table OCR/extraction misreads (such as `"10,000 sq. mtrs"` misread as `"0"` in `rmp2015-zr` tables) via parser improvements and/or reproducible `data/overrides/` entries backed by PDF page-image inspection.
   - Cross-check every parsed numeric `value` and interval bound against its `cell_text` and `row_header`/`column_header`; emit any mismatches in `data/reports/<jurisdiction>/parameter-mismatches.md` and list them for owner review.
3. **40-Record Page-Image Self-Check**:
   - Sample 40 parameter records stratified across parameters and source tables (`rmp2015-zr` Table 1–10, Jan 2026 Table 8 setbacks, Apr 2025 Ch 11 Premium FAR, TDR rules, parking tables, 2026 Corporation bye-law tables), render their source PDF pages at 150 DPI via `pypdfium2`, verify each against the printed table cell, and record the 40-record verification table in `data/reports/<jurisdiction>/qa.md`.

### Part 4 — Resolution and the Plot Resolver

1. **Declarative Resolution Order (`jurisdictions/resolution.yaml` & `schemas/resolution.schema.json`)**:
   - Encode the 6-step statutory resolution rules in data (`resolution.yaml`), evaluated top to bottom:
     1. `draft_excluded`: Drafts never apply (`legal_status == "draft"`).
     2. `corporation_scope`: A corporation's amendment applies only inside that corporation (`applies_in`).
     3. `gbga_notwithstanding`: Where the Greater Bengaluru Governance Act 2024 (`gbga-2024`) says `"notwithstanding"`, it prevails.
     4. `zoning_governs_via_byelaw_1_4`: For `use`, `coverage`, `far`, `setbacks`, `height`, `floors`, `dwelling_units`, and `parking`, the Master Plan Zoning Regulations (`rmp2015-zr` as amended) govern pursuant to Building Bye-laws 2003 Bye-law `1.4` (inserted 2017).
     5. `lex_posterior_within_family`: Within one instrument family, the later in-force provision (`valid_from`) wins.
     6. `unresolved_tie`: Otherwise, `"not_settled"` ("Not settled: two rules apply") — keep and display both provisions.
   - Every step carries its quoted statutory authority (`doc_id`, `eid`, `page`, exact `quote` verified against structured text); if a step's quote is absent from structured text, the step is automatically disabled and declared.
2. **Deterministic Plot Resolver (`pipeline/bylaws/resolver.py` & `lib/resolver.ts`)**:
   - Implement identical pure, deterministic resolution logic in Python (`bylaws resolve --jurisdiction <id> ...`) and TypeScript (`lib/resolver.ts`):
     - Inputs: `lat`/`lon` (or explicit `corporation_id` and `zone_code`), `plot_area_m2`, `road_width_m`; optional `plot_depth_m`, `plot_width_m`, `building_height_m`, `use` (default `"residential"`), `as_of_date` (default today).
     - Geospatial lookup: Point-in-polygon lookup (`shapely` in Python, `@turf/boolean-point-in-polygon` in browser) resolving `lat, lon` to Corporation (`boundary.geojson`), Ward (`wards.geojson`), Planning District (`planning-districts.geojson`), Land-Use Zone (`zones.geojson`), and Buffer Overlays (`overlays.geojson`). Outside processed land-use sheets, `zone` is returned as `unknown` and the user can manually pick a zone (marked as user-selected).
     - Output per parameter: governing `value`, `unit`, `value_text`, `source` (document, provision, table, row, col, cell, page link, official URL), `resolution_step` (step ID, plain-English explanation, quoted statutory authority), `other_applicable_records` (with plain-English reason why each was superseded/not chosen), or `status: "not_settled"` with all tied records.
3. **Worked Target Acceptance Test (Jayanagar 600 m² / 15 m Road)**:
   - Before writing test assertions, inspect the rendered PDF page images for `rmp2015-zr` Residential (Main) Table 10 / Table 1 (coverage, FAR), `rmp2015-zr-amend-2026-01` Table 8 (setbacks), `rmp2015-zr-amend-2025-04` Chapter 11 (premium FAR), TDR provisions, parking table, `overlays.geojson` lake buffer, and `bscc-bbl-amend-2026-05` (South City Corporation 2026 changes).
   - Confirm exact source values from the page images (noting any difference between the review's informal expectation and the printed gazette table, e.g. Ring I vs Ring II/III or exact table numbering, for owner review).
   - Lock the confirmed values in both `pipeline/tests/test_resolver.py` and `__tests__/resolver.test.ts`.
4. **Rebuilt Relations & 60-Item Owner Labelling Sheet**:
   - Rebuild `pipeline/bylaws/relations.py` and `relations.json` to keep only legally meaningful relation kinds:
     1. `amends`
     2. `incorporates` (e.g. `bbl-2003` bye-law 1.4 → `rmp2015-zr`)
     3. `corporation_differs`
     4. `cross_document_reference`
     5. `definition_differs` (restricted strictly to documents that both apply in the jurisdiction — excluding `ka-model-bbl-2017`)
     6. `precedence` (restricted strictly to inter-instrument statutory precedence, never internal clause conditions)
   - Remove word-matching `same_topic` relations (topics remain as grouping tags) and raw number-matching `numeric_differs` conflict relations (superseded by the parameter resolver's conditional comparison).
   - Mark only structurally confirmed kinds (`amends`, `incorporates`, `corporation_differs`) as `public_visible: true` (`measured_precision >= 0.8`); keep `cross_document_reference`, `definition_differs`, and `precedence` hidden in the public UI (`public_visible: false`) until owner precision measurement ≥ 0.8.
   - Generate a 60-item labelling sheet (10 sampled items per relation kind across the 6 kinds) in `docs/review/relations-labelling.md` for owner review.

### Part 5 — A Readable, Plot-First Site

1. **Map-First Home (`/`)**:
   - Make `/` the full-width, above-the-fold interactive map on both desktop and mobile, preceded by at most one concise sentence of introduction.
   - Navigation header exposes direct access to Map (`/`), Documents, Sources, Timeline, and Data, plus global Pagefind search.
2. **Protomaps Light Map Style & Official RMP 2015 Zone Colours (`lib/map-style.ts`, `components/ZoneMap.tsx`)**:
   - Switch the base map to the **Protomaps light style** (clear road hierarchy, street and neighbourhood names, parks, water bodies, metro lines/stations) from `basemap.pmtiles`. Keep the site's `dg2n` paper/ink aesthetic on surrounding chrome, not washing out the map.
   - Insert project GeoJSON layers (`zones.geojson`, `wards.geojson`, `boundary.geojson`, `overlays.geojson`) **beneath** MapLibre symbol/label layers (`beforeId` set to the first label/symbol layer) so street and place names remain crisp above semi-transparent zone fills and outlines; render zone codes inside polygons only at high zoom (`zoom >= 15`).
   - Colour land-use zones using the official **RMP 2015 Land-Use Legend colours** (Residential yellow, Commercial blue, Industrial purple, Public & Semi-Public red, Park & Open Space green, Traffic & Transportation grey, Utilities, etc.) with a plain-English legend.
   - Map controls: Zoom, Scale bar, Full screen, My location, Layer switch (`Streets`, `Land-use zones`, `Wards`, `Corporations`, `Original sheet overlay` + opacity).
   - Integrated local search by **place name** (extracted from `basemap.pmtiles` place/neighbourhood features into a static search index) and by **ward name or ward number** (`wards.geojson`), with zero external geocoding calls and no satellite layer.
3. **Click a Place → Plot Card (`components/PlotCard.tsx`)**:
   - Clicking any location on the map (or selecting a search result) opens the Plot Card showing:
     - Corporation, Ward, Planning District, and Land-Use Zone (or `"Zone data not yet available here"` with a zone selector dropdown when outside the 4 processed sheets).
     - Inputs: Plot area (`m²` / `sq ft` converter), Road width (`m`); expandable optional inputs: Plot depth (`m`), Plot width (`m`), Building height (`m`), Use (`Residential`, `Commercial`, etc.).
     - Resolved Building Code Answers: Ground coverage, FAR (base, premium, TDR), Setbacks (front, rear, sides), Maximum height, Parking. Each displays the resolved number/value, one plain-English line explaining why it governs, a clickable link to the consolidated provision, and a direct PDF page link (`p. N`). Items that are `"Not settled"` display `"Not settled: two rules apply"` and show both rules side by side.
     - Mandatory disclaimer notice: `"Derived from the official documents by this project. Confirm with the planning authority or a qualified professional before relying on it."`
     - Shareable URL state (`?lat=...&lon=...&area=...&road=...&zone=...&corp=...`) that restores the exact plot card on load.
4. **Less Verbose Reading & Resolution Cards**:
   - Clicking any parameter answer opens its provision in the consolidated document reader with quiet change marks and original wording toggle.
   - Replace verbose conflict cards with concise **Resolution cards**: what governs, why in one plain line, the other provision, and links.
   - Group the Zone panel by regulatory topic (`Uses`, `Coverage`, `FAR`, `Setbacks`, `Height`, `Parking`) showing governing provisions rather than flat unranked lists.
   - Show document status, verification, and dates once at the document header; repeat on individual provisions only when different from the document default.
   - Hide internal IDs, `eid`s, enum codes, and schema fields behind a collapsed `"Details"` toggle.
   - Keep all page introductions to at most two sentences.

### Part 6 — Register and Gaps

1. **Model Building Bye-laws 2017 (`ka-model-bbl-2017`) Marked Not Applicable Here**:
   - Update `jurisdictions/in-ka-bengaluru.yaml` (and child configs) so `ka-model-bbl-2017` has `applies_to_jurisdiction: "no"` (rendered in UI as `"Not applicable here (likely)"` under a dedicated register group `"In force elsewhere, not applicable here"`), with quoted evidence from its title and enabling statute (*Karnataka Municipalities Act, 1964*, which governs municipal councils/town municipalities rather than City Corporations under the *KMC Act 1976* / *GBGA 2024*).
   - Keep `ka-model-bbl-2017`'s structured text browsable from the register, but exclude it from active definitions, cross-document relations, extracted building parameters, and plot resolver answers.
2. **Plain-Language Gap Declarations (`declarations.json` & UI)**:
   - Ensure every known gap is declared in plain words with its practical meaning for users:
     - July 2025 zoning amendment (`UDD 85 MNJ 2025`): not obtained; some zoning values may not reflect it.
     - 2024 Kannada compilation of `rmp2015-zr`: not structured; English original + structured amendments used instead.
     - Supporting instruments not in the dataset: Fire & Emergency Services NOC rules, standalone Karnataka TDR rules, Occupancy Certificate exemption orders, detailed BMRCL metro transit-oriented influence zone regulations.
     - Land-use zone polygons: available only where master plan sheets are processed (4 sheets in Planning Districts 2.10 and 2.11 covering Jayanagar / JP Nagar / Banashankari); elsewhere on the map the user can pick a zone manually.
3. **Updated Data Page (`/data`)**:
   - List the new release (`4.0.0`) with links and counts for consolidated documents, parameters (`parameters.json`), resolution rules (`resolution.yaml`), resolver test cases, relations (clearly marked measured vs. unmeasured), corporation/ward/zone boundaries, declarations, and SHA-256 checksums.

## Affected Memory

- `architecture/overview`: (modify) Update pipeline stages, storage/range-request architecture, content-addressed shared documents, per-chapter splitting, Pagefind search, full document consolidation, parameter extraction (`parameters.py`), deterministic plot resolver (`resolver.py` & `lib/resolver.ts`), map-first Protomaps light UI, and Release `4.0.0`.
- `schemas/data-contracts`: (modify) Update unified Schema `1.4` across all contracts, add `parameters.schema.json` and `resolution.schema.json`, per-chapter document/consolidated outline schemas, `incorporates` relation kind, `public_visible` relation gating, and `ka-model-bbl-2017` applicability exclusion.

## Impact

- **Schemas & Codegen (`schemas/`, `scripts/generate_models.py`, `pipeline/bylaws/models/_generated.py`, `lib/types/generated.ts`)**: All schemas unified to `schema_version: "1.4"`; new `parameters.schema.json` and `resolution.schema.json`; updated `consolidated.schema.json`, `relations.schema.json`, and `manifest.schema.json`.
- **Python Pipeline (`pipeline/bylaws/`)**:
  - `consolidate.py`: Full-tree consolidated documents per corporation and date, Akoma Ntoso XML export, quiet change metadata.
  - `parameters.py` (new): Table header fixer, numeric interval/range parser, footnote linker, cell-text consistency verifier, and 40-record page-image self-check generator.
  - `resolver.py` (new) & `cli.py`: `bylaws resolve` CLI command and deterministic 6-step resolution engine over `parameters.json`, `resolution.yaml`, and geospatial layers.
  - `relations.py`: Incorporation of bye-law `1.4`, removal of `same_topic` and noisy `numeric_differs`, exclusion of `ka-model-bbl-2017`, `public_visible` gating, and 60-item labelling sheet generator (`docs/review/relations-labelling.md`).
  - `publish.py`, `validate.py`, `storage.py`: Content-addressed shared document deduplication, per-chapter splitting, accurate `declarations.json` generation, and object-storage / range-request verification.
- **Web Application (`app/`, `components/`, `lib/`, `e2e/`)**:
  - `app/page.tsx`: Full-width above-the-fold map-first home with Plot Card and place/ward search.
  - `lib/map-style.ts` & `components/ZoneMap.tsx`: Protomaps light style, labels ordered above semi-transparent RMP-coloured zone polygons, zoom-gated zone codes, place & ward search.
  - `lib/resolver.ts` & `components/PlotCard.tsx`: Browser plot resolver using `@turf/boolean-point-in-polygon`, parameter interval matching, 6-step `resolution.yaml` evaluation, URL state synchronization, and page links.
  - `components/ClauseTree.tsx`, `components/ClausePanel.tsx`, `app/j/[id]/documents/[doc]/page.tsx`: Per-chapter on-demand loading, quiet change marks, Resolution cards, topic-grouped zone panels, collapsed `"Details"` toggle for internal IDs, Pagefind static search.
  - `e2e/` & `.github/workflows/ci.yml`: Playwright browser tests in CI (map HTTP 206 + non-blank canvas, per-chapter document page within budget, plot card flow) and page-weight budget assertions.
- **Git & Release Hygiene (`.gitignore`, `docs/progress.md`, `docs/review/relations-labelling.md`)**: Remove ~280 MB of generated data/PMTiles from git tracking while keeping reproducible object storage / local build artifacts and `xx-test-fixture`.

## Open Questions

None — `docs/plans/building-code-plan.md` specifies all decisions, parameter schemas, resolution steps, UI layout, page budgets, and acceptance criteria.

## Assumptions

| # | Grade | Decision | Rationale | Scores |
|---|-------|----------|-----------|--------|
| 1 | Certain | Unify all JSON Schemas, jurisdiction configs, overrides, and published files to `schema_version: "1.4"` and bump published release version to `4.0.0` | Explicitly required by Part 1 item 2 ("One schema version across all schemas, config and published files; regenerate types; CI fails on mismatch") and Part 6 ("Data page lists the new release") | S:95 R:85 A:95 D:95 |
| 2 | Certain | Move `public/data/in-ka-bengaluru*` (~248 MB) and `basemap.pmtiles` (33 MB) out of git, keeping `xx-test-fixture` in git and serving Bengaluru data/tiles via HTTP range-capable storage (`NEXT_PUBLIC_DATA_BASE_URL` / Vercel Blob / R2 with local range-server fallback in CI) | Explicitly specified in Part 1 item 4 ("Published data and the map tile file move to object storage that supports HTTP range requests and CORS... Git keeps code, configuration, corrections, reports and a small test fixture") | S:90 R:80 A:85 D:85 |
| 3 | Certain | Split documents and consolidated views into `<doc_id>.outline.json` plus per-chapter `<doc_id>/chapters/<chapter_eid>.json` files loaded on demand to stay within ≤300 KB HTML and ≤1.5 MB initial JS+data budgets | Explicitly specified in Part 1 item 5 ("Documents are split into per-chapter files plus an outline; pages fetch chapters on demand. Budgets enforced in CI: HTML per page ≤ 300 KB; initial JavaScript plus data per page ≤ 1.5 MB uncompressed") | S:95 R:85 A:90 D:90 |
| 4 | Certain | Model Bye-law 1.4 (inserted 2017) as an `incorporates` relation from `bbl-2003` to `rmp2015-zr` for use, coverage, FAR, setbacks, height, floors, dwelling units, and parking, removing synthetic `substitute` effects from `rmp2015-zr` | Explicitly specified in Part 2 item 3 and Part 4 Step 4 | S:100 R:90 A:95 D:100 |
| 5 | Certain | Parse building parameters into `parameters.json` with numeric intervals, categorical conditions, cell-level citations, and a 40-record page-image self-check in `qa.md` | Explicitly specified in Part 3 | S:95 R:85 A:90 D:95 |
| 6 | Certain | Implement the 6-step deterministic resolver driven by `resolution.yaml` in both Python CLI and browser TypeScript, verified against PDF page images for the Jayanagar 600 m² / 15 m road Residential (Main) plot | Explicitly specified in Part 4 | S:95 R:85 A:95 D:95 |
| 7 | Certain | Rebuild relations to keep only 6 legal kinds, show only `amends`, `incorporates`, and `corporation_differs` publicly, and output a 60-item labelling sheet in `docs/review/relations-labelling.md` | Explicitly specified in Part 4 ("Relations, rebuilt") | S:95 R:90 A:95 D:95 |
| 8 | Certain | Mark `ka-model-bbl-2017` as not applicable in Bengaluru City Corporations (`applies_to_jurisdiction: "no"`), keeping its text browsable in the register while excluding it from definitions, relations, parameters, and plot answers | Explicitly specified in Section 3 Decision 2 and Part 6 | S:100 R:90 A:95 D:100 |

8 assumptions (8 certain, 0 confident, 0 tentative, 0 unresolved).
