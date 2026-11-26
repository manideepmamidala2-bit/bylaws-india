# Plan: Bylaw One: Trust and Accuracy

**Change**: 261126-3t3i-trust-and-accuracy
**Intake**: `intake.md`

## Requirements

### Non-Goals

- Bringing back a plot answer card or plot dimension inputs in the web user interface — the resolver remains hidden from the website.
- Processing additional RMP 2015 land-use map sheets for other City Corporations beyond the existing 4 sheets in Bengaluru South.
- Extracting numeric parking minimums from prose parking cells.
- Acquiring the unobtainable July 2025 zoning amendment (`rmp2015-zr-amend-2025-07`).

### Design Decisions

#### Committed Compressed Page-Text Store with SHA-256 Checksum Integrity (`data/page_text/`)
**Decision**: Store the extracted per-page text of every acquired PDF instrument alongside its 64-character lowercase hex `sha256` checksum in versioned gzipped JSON files (`data/page_text/<doc_id>.pages.json.gz`, plus `data/page_text/xx-test-fixture/<doc_id>.pages.json.gz`), remove the `.clauses.json` fallback from `pipeline/bylaws/fidelity.py`, and fail `verify_jurisdiction_text_fidelity` whenever a cited document's page-text store is missing, a cited page number is absent, or the stored `sha256` disagrees with the source register's `retrieval.sha256` / `.meta.json` `sha256`.
**Why**: Previously, in CI where gitignored `data/interim/` was absent, `fidelity.py` rebuilt each page's word token set from the published `.clauses.json` file itself, making the citation check self-referential and unable to fail in CI. Committing compressed per-page text tied to the PDF's cryptographic checksum makes the citation check independent, fast, and falsifiable in CI.
**Rejected**: Rebuilding page tokens from `.clauses.json` in CI (tautological check that cannot catch invented words or wrong page numbers) or committing multi-hundred-megabyte uncompressed `data/raw/` PDFs into git.
*Introduced by*: 261126-3t3i-trust-and-accuracy

#### Verification-Report-Driven Map Positional Accuracy and Sheet-Fitting Error Separation
**Decision**: Export the measured street centre-line offset metrics (`road_median_offset_m` and `road_p90_offset_m`) alongside the affine grid-fit RMSE (`grid_fit_rmse_m`) from the map verification report into `geo-layers.json`, generate the map page's primary accuracy statement dynamically from the median and 90th-percentile street offsets (`"Zone boundaries are approximate: typically about 8 m from street centre-lines, and within about 21 m in 9 out of 10 places."`), and move the `0.0032 m` grid-fit RMSE inside `Details` explicitly labelled as the sheet-fitting error.
**Why**: `0.0032 m` (`3.2 mm`) measures how closely the 20 printed `+` UTM grid crosshairs fit an affine transform on the vector PDF sheet, whereas the independent OpenStreetMap street centre-line check in `map-verification.md` measures a median offset of `8.02 m` and a 90th-percentile offset of `21.11 m`.
**Rejected**: Displaying `accuracy_m: 0.0032` as street centre-line accuracy or hard-coding `8 m` and `21 m` as literals in JSX without generating them from the verification report data.
*Introduced by*: 261126-3t3i-trust-and-accuracy

#### Register-Backed `plain_title` vs. Full Official Gazette `title`
**Decision**: Add an explicit `plain_title` field to each document in `jurisdictions/*.yaml` and `documents.json` (`schemas/jurisdiction.schema.json`, `schemas/document.schema.json`), use `plain_title` and the instrument's date in every subject-page source cell, replaced-rule label, `"Changed"` tag, and timeline item (`e.g. "Zoning amendment, 5 January 2026, p. 6"`), and restrict full official gazette titles (`doc.title`) to `<details>` expanders and document page headers (`/j/[id]/documents/[doc]`), enforced by a CI check on built HTML.
**Why**: Mechanical title-casing of all-caps gazette headers (`"GOVERNMENT OF KARNATAKA No. UDD 235 MNJ 2025(E) date: 05.01.2026 NOTIFICATION..."`) produces noisy multi-line source cells on subject pages while obscuring which instrument is cited.
**Rejected**: Repeating full official gazette titles in table cells or hard-coding ad-hoc display names in React components outside the source register.
*Introduced by*: 261126-3t3i-trust-and-accuracy

#### Honest Statutory Plot Resolver Outcomes Without Assumed Dimensions
**Decision**: Remove the `3:2` plot ratio (`inferred_depth`, `inferred_width`) and `11.5 m` building height defaults from `pipeline/bylaws/resolver.py` and `lib/resolver.ts`, return `"needs depth"` / `"needs width"` / `"needs height"` (`status: "needs_depth" | "needs_width" | "needs_height"`) whenever a rule depends on an omitted dimension, and split `"no_applicable_rule"` into `"No limit in the law for this case"` (`status: "no_limit_in_law"`, carrying the governing citation and quote showing why the cap applies only elsewhere) and `"Not covered by our data yet"` (`status: "not_covered_by_data"`).
**Why**: Fabrication of plot depth, plot width, or building height violates Constitution Principle I and Rule R8, and returning a single `"No rule matched"` conflates statutory absence of a cap (such as height/floor caps in `R-MAIN`, `C-BIZ`, or `I-GEN` on roads `>= 9 m` where `4.1.2(b)` caps height only on roads `< 9 m` or plots `<= 250 m²`) with unmodelled data gaps.
**Rejected**: Defaulting missing dimensions to a `3:2` aspect ratio and `11.5 m` height or returning an undifferentiated `"No rule matched plot inputs"` string.
*Introduced by*: 261126-3t3i-trust-and-accuracy

### Deprecated Requirements

#### CI `.clauses.json` Page-Token Synthesis Fallback in `pipeline/bylaws/fidelity.py`
**Reason**: Rebuilding page word tokens from published `.clauses.json` files when `data/interim/` is absent causes the fidelity check to compare published provision text against itself, preventing CI from detecting altered words or wrong page citations.
**Migration**: Replaced by committed compressed per-instrument page-text files in `data/page_text/` verified against each PDF's SHA-256 checksum.

#### Assumed 3:2 Plot Dimensions and 11.5 m Building Height Defaults in `resolver.py` and `lib/resolver.ts`
**Reason**: Guessing `plot_depth_m = sqrt(1.5 * area)`, `plot_width_m = area / depth`, and `building_height_m = 11.5` silently fabricates plot inputs when the caller omits them.
**Migration**: Replaced by explicit `"needs depth"`, `"needs width"`, and `"needs height"` outcomes when a parameter depends on an omitted dimension.

### Pipeline & CI: Stored Page Text & Falsifiable Citation Check (Part 1)

#### R1: Stored Per-Page PDF Text with Checksum Integrity and Falsifiable CI Citation Check
For every acquired instrument, the pipeline MUST store the extracted text of each page from the original PDF together with the PDF's SHA-256 checksum in a versioned, committed store (`data/page_text/`), and `verify_jurisdiction_text_fidelity` (`pipeline/bylaws/fidelity.py`) MUST read page text exclusively from this store (plus recorded `ocr_corrections`, `unreadable_fragments`, and `table_overrides`), remove the fallback that rebuilds page text from published `.clauses.json` files, fail if stored page text or a cited page is missing or if the stored checksum mismatches the source register, and be verified by planted-fault tests in CI.

- **GIVEN** the committed page-text store in `data/page_text/` and `pipeline/bylaws/fidelity.py` running in CI without `data/interim/` or `data/raw/`
- **WHEN** `verify_jurisdiction_text_fidelity` runs on all structured provisions, consolidated versions, parameter rows, applicability quotes, and home-page excerpts, and planted-fault tests (a) alter one word in a published provision, (b) change one cited page number, and (c) omit a cited page or corrupt a PDF SHA-256 checksum
- **THEN** the unaltered dataset passes with zero failures and matching SHA-256 checksums, while all planted-fault tests fail `verify_jurisdiction_text_fidelity` deterministically

### Geospatial & Web UI: Measured Map Accuracy & Bylaw One Map Page (Part 2)

#### R2: Verification-Report-Generated Map Accuracy Statement, Bylaw One Map Page Design, and Map Navigation Links
The map page (`/j/[id]`) MUST replace the `0.0032 m` banner claim with `"Zone boundaries are approximate: typically about 8 m from street centre-lines, and within about 21 m in 9 out of 10 places."` generated dynamically from the verification report's median and 90th-percentile street centre-line offset values, move the `0.0032 m` grid-fit RMSE into `Details` labelled as the sheet-fitting error, fail the CI build if a hard-coded figure or primary-layer `0.0032 m` claim appears, render in the clean **Bylaw One** design stating plainly `"Land-use zones are available for parts of Bengaluru South only."`, and be linked from `Footer` on every page and from the `Land use` subject page while leaving `TopNav` at three items.

- **GIVEN** the built Next.js application and `data/reports/in-ka-bengaluru-south/map-verification.md` (`road_median_offset_m = 8.02`, `road_p90_offset_m = 21.11`, `rmse_m = 0.0032`)
- **WHEN** `/j/[id]` is rendered and inspected by CI (`scripts/check_page_budgets.mjs`, `pipeline/tests/test_release_and_copy_consistency.py`, and Playwright tests)
- **THEN** the page displays `"Zone boundaries are approximate: typically about 8 m from street centre-lines, and within about 21 m in 9 out of 10 places."` derived from the verification report metrics, places the `0.0032 m` sheet-fitting error inside `<details>`, uses the Bylaw One layout with header/footer/plain language/details-on-tap, states `"Land-use zones are available for parts of Bengaluru South only."`, and is reachable from the footer on every page and from `/j/[id]/topics/land-use`

### Register & Web UI: Plain Register Names & Home Page Attributions (Part 3)

#### R3: Plain Register Names Outside Details/Headers and Verified 2007 & 2017 Home-Page Attributions
Every source cell, replaced-rule label, `"Changed"` tag, and timeline item MUST use the instrument's plain register name (`plain_title`) and date (with full official gazette titles restricted to `<details>` and document page headers, enforced by CI), the home page **2017 step** (`Step 3 / 5`) MUST attribute its quote to `"Building Bye-laws 2003, bye-law 1.4 (inserted by notification UDD 14 TTP 2017, 28 October 2017)"` linking to both bye-law `1.4` and the notification's page and stating `"This notification also issued the Model Building Bye-laws, which do not otherwise apply in Bengaluru"`, the **2007 step** (`Step 2 / 5`) MUST replace the `4.1.1` quote with verbatim words from `rmp2015-zr` introducing FAR / Table 10's caption on p. 28, and a CI attribution check MUST verify that every home-page quote's cited document and page contains the quoted words in stored page text.

- **GIVEN** all built HTML pages in `.next/server/app/` and the home page (`/`)
- **WHEN** the CI name check (`scripts/check_page_budgets.mjs`, `pipeline/tests/test_release_and_copy_consistency.py`) and CI attribution check (`pipeline/tests/test_text_fidelity.py`) run
- **THEN** zero full official gazette titles appear outside `<details>` or document page headers, every source cell and replaced-rule label uses the plain register name and date, Step 3 attributes bye-law 1.4 to `Building Bye-laws 2003, bye-law 1.4 (inserted by notification UDD 14 TTP 2017, 28 October 2017)` with both links and the Model Building Bye-laws note, Step 2 quotes the verbatim Table 10 heading/caption from `rmp2015-zr` p. 28, and all 5 home-page quotes pass the stored-page-text citation check

### Relations & Review Sheet: Honest Relation Visibility & Precision Rule (Part 4)

#### R4: Structurally Confirmed Public Relations, Unreviewed Status, 60-Item Labelling Sheet with Pages, and Rule-Check Disclosure
The pipeline and web application MUST show publicly (`public_visible: true`) only structurally confirmed relation kinds (`amends`, `incorporates`, `corporation_differs`), keep all other kinds (`cross_document_reference`, `definition_differs`, `precedence`) in `relations.json` marked `"not_yet_reviewed"` (`"not yet reviewed"`) and hidden from the interface, keep the 60-item labelling sheet ready in `docs/review/relations-labelling.md` with each item showing both provisions, their page numbers, and an unfilled verdict column, enforce the rule that a relation kind becomes public only when its labelled precision is at least `0.8`, and show `"Checked by rule, not yet by a person"` inside `Details` for every public relation.

- **GIVEN** `relations.json`, `docs/review/relations-labelling.md`, and built subject/document pages
- **WHEN** `bylaws relations` and web builds execute
- **THEN** only `amends`, `incorporates`, and `corporation_differs` have `public_visible: true`, non-structural relations are marked `not_yet_reviewed` and hidden from the UI until labelled precision from `docs/review/relations-labelling.md` is `>= 0.8`, `docs/review/relations-labelling.md` contains 60 unfilled items with both provisions and their page numbers, and every public relation displays `"Checked by rule, not yet by a person"` inside `Details`

### Statutory Resolver: Missing-Dimension Honesty & Two Kinds of "No Rule" (Part 5)

#### R5: No Assumed Plot Dimensions and Distinction Between "No Limit in the Law" and "Not Covered by Our Data"
Both `pipeline/bylaws/resolver.py` and `lib/resolver.ts` MUST remove the `3:2` plot ratio and `11.5 m` building height defaults, return `"needs depth"`, `"needs width"`, or `"needs height"` when a rule depends on an omitted dimension, distinguish `"No limit in the law for this case"` (with the quoted text or table citation showing that the limit applies only elsewhere) from `"Not covered by our data yet"`, pass tests from the source tables on the four review plots (`600 m²` on a `15 m` road in `Residential (Main)`; `150 m²` on a `9 m` road; `3,000 m²` commercial on a `24 m` road; `6,000 m²` industrial on an `18 m` road), and remain hidden from the website.

- **GIVEN** `pipeline/bylaws/resolver.py`, `lib/resolver.ts`, and the four review plots
- **WHEN** `resolve_plot_parameters` / `resolvePlotParameters` is called without `plot_depth_m`, `plot_width_m`, or `building_height_m`, and with explicit dimensions across the four review plots
- **THEN** parameters that depend on missing depth, width, or height return `"needs depth"`, `"needs width"`, or `"needs height"` with zero assumed dimensions, parameters where the law sets no cap for that case return `"No limit in the law for this case"` with the source citation and quote, parameters genuinely absent from the dataset return `"Not covered by our data yet"`, and zero plot resolver UI elements appear on the website

## Tasks

### Phase 1: Part 1 — Stored Page Text & Falsifiable Citation Check

- [x] T001 Build committed compressed per-instrument page-text store (`data/page_text/`) with PDF SHA-256 checksums, update `pipeline/bylaws/fidelity.py` to read only stored page text, remove the `.clauses.json` fallback, fail on missing page text or checksum mismatch, fix any citation mismatches against stored text, add planted-fault tests in `pipeline/tests/test_text_fidelity.py`, update `docs/progress.md`, and commit + push + open/update the draft PR <!-- R1 -->

### Phase 2: Part 2 — Measured Map Accuracy & Bylaw One Map Page

- [x] T002 Export measured street centre-line offset metrics (`road_median_offset_m`, `road_p90_offset_m`) and `grid_fit_rmse_m` from `pipeline/bylaws/geo/verify.py` / `pipeline/bylaws/cli.py` into `geo-layers.json` (`schemas/geo-layers.schema.json`), replace the `0.0032 m` banner claim in `app/j/[id]/page.tsx` with the report-generated `"Zone boundaries are approximate: typically about 8 m from street centre-lines, and within about 21 m in 9 out of 10 places."` while moving the grid-fit error into `Details`, rebuild `/j/[id]` (`app/j/[id]/page.tsx`, `components/AreaExplorerClient.tsx`) in the Bylaw One design, ensure `Map` is linked from `components/Footer.tsx` on every page and from `/j/[id]/topics/land-use`, add the CI accuracy check in `scripts/check_page_budgets.mjs` and `pipeline/tests/test_release_and_copy_consistency.py`, update `docs/progress.md`, and commit + push <!-- R2 -->

### Phase 3: Part 3 — Plain Register Names & Home Page Attributions

- [x] T003 Add concise `plain_title` register names in `schemas/jurisdiction.schema.json`, `schemas/document.schema.json`, `jurisdictions/in-ka-bengaluru*.yaml`, `pipeline/bylaws/parameters.py`, and `lib/plain-language.ts`, use plain register names and dates across all source cells, replaced-rule labels, `"Changed"` tags, and timeline items while keeping full official titles only in `Details` and document headers, enforce the CI full-title check in `scripts/check_page_budgets.mjs` and `pipeline/tests/test_release_and_copy_consistency.py`, fix the 2017 (`Step 3`) and 2007 (`Step 2`) home-page attributions and quotes in `app/page.tsx` and `components/FarStoryStepper.tsx` with CI verification in `pipeline/tests/test_text_fidelity.py`, update `docs/progress.md`, and commit + push <!-- R3 -->

### Phase 4: Part 4 — Honest Relations, Labelling Sheet & Precision Rule

- [x] T004 Update `pipeline/bylaws/relations.py` and `schemas/relations.schema.json` to mark non-structural relation kinds (`cross_document_reference`, `definition_differs`, `precedence`) as `"not_yet_reviewed"` (`"not yet reviewed"`), enforce the `>= 0.8` labelled-precision rule from `docs/review/relations-labelling.md`, regenerate `docs/review/relations-labelling.md` with both provisions, their page numbers, and an unfilled verdict column, show `"Checked by rule, not yet by a person"` inside `Details` for public relations in `app/j/[id]/topics/[topic]/page.tsx` and `components/ClauseTree.tsx`, update `docs/progress.md`, and commit + push <!-- R4 -->

### Phase 5: Part 5 — Honest Resolver Without Assumed Dimensions & Final Verification

- [x] T005 Update `pipeline/bylaws/resolver.py` and `lib/resolver.ts` to remove assumed `3:2` plot dimensions and `11.5 m` height defaults, return `"needs depth"`, `"needs width"`, or `"needs height"` when missing, distinguish `"No limit in the law for this case"` (with citation and quote) from `"Not covered by our data yet"`, add tests for the four review plots in `pipeline/tests/test_resolver.py` and `__tests__/resolver.test.ts`, capture 390 px and 1280 px screenshots, run full pytest/vitest/build/budget/Playwright suites, update `docs/progress.md` and the PR description, and commit + push <!-- R5 -->

## Execution Order

- T001 establishes the committed `data/page_text/` store and falsifiable `verify_jurisdiction_text_fidelity` check used by T002–T005.
- T002, T003, T004, and T005 execute sequentially in order (Parts 1 → 2 → 3 → 4 → 5), committing and pushing after each part.

## Acceptance

### Functional Completeness

- [x] A-001 R1: Stored page text with PDF SHA-256 checksum exists in `data/page_text/` for every acquired instrument, and `verify_jurisdiction_text_fidelity` in `pipeline/bylaws/fidelity.py` reads only from that stored page text (plus recorded overrides) and verifies checksums against the source register.
- [x] A-002 R2: The map page (`/j/[id]`) displays `"Zone boundaries are approximate: typically about 8 m from street centre-lines, and within about 21 m in 9 out of 10 places."` generated from the verification report's median and 90th-percentile values, places the `0.0032 m` grid-fit error inside `Details` as the sheet-fitting error, is rebuilt in the Bylaw One design stating `"Land-use zones are available for parts of Bengaluru South only."`, and is linked from the footer on every page and from the `Land use` subject page.
- [x] A-003 R3: Every source cell, replaced-rule label, `"Changed"` tag, and timeline item uses the instrument's plain register name and date, full official titles appear only in `Details` and on document page headers, the 2017 home-page step attributes its quote to `"Building Bye-laws 2003, bye-law 1.4 (inserted by notification UDD 14 TTP 2017, 28 October 2017)"` with links to both and the one-line Model Building Bye-laws note, and the 2007 home-page step quotes verbatim words introducing FAR / Table 10's caption from `rmp2015-zr` p. 28.
- [x] A-004 R4: Only structurally confirmed relation kinds (`amends`, `incorporates`, `corporation_differs`) are shown publicly (`public_visible: true`), all other kinds are marked `"not_yet_reviewed"` and hidden until their labelled precision in `docs/review/relations-labelling.md` reaches at least `0.8`, the 60-item labelling sheet in `docs/review/relations-labelling.md` shows both provisions, their pages, and an unfilled verdict column, and every public relation shows `"Checked by rule, not yet by a person"` inside `Details`.
- [x] A-005 R5: `pipeline/bylaws/resolver.py` and `lib/resolver.ts` return `"needs depth"`, `"needs width"`, or `"needs height"` when a rule depends on an omitted dimension, distinguish `"No limit in the law for this case"` (with citation) from `"Not covered by our data yet"`, and remain hidden from the website.

### Behavioral Correctness

- [x] A-006 R1: Planted-fault tests that (a) alter one word in a published provision and (b) change one cited page number both fail `verify_jurisdiction_text_fidelity` in CI, and missing stored page text or a mismatched PDF checksum fails rather than skips.
- [x] A-007 R2: CI (`scripts/check_page_budgets.mjs` and `pipeline/tests/test_release_and_copy_consistency.py`) verifies that the map accuracy text is derived from the verification report's median and 90th-percentile values and fails if `"0.0032 m"` appears in the primary layer or if accuracy numbers are hard-coded in UI components.
- [x] A-008 R3: CI (`scripts/check_page_budgets.mjs` and `pipeline/tests/test_release_and_copy_consistency.py`) fails if any full official gazette title appears outside `<details>` or document page headers, and `pipeline/tests/test_text_fidelity.py` verifies every home-page quote against stored page text.

### Removal Verification

- [x] A-009 R1: The `.clauses.json` page-token synthesis fallback in `pipeline/bylaws/fidelity.py` is completely removed.
- [x] A-010 R5: The `inferred_depth`, `inferred_width` (`3:2` plot ratio), and `eff_height = 11.5` defaults in `pipeline/bylaws/resolver.py` and `lib/resolver.ts` are completely removed.

### Scenario Coverage

- [x] A-011 R5: Unit tests in `pipeline/tests/test_resolver.py` and `__tests__/resolver.test.ts` verify the four review plots (`600 m²` on a `15 m` road in `Residential (Main)`; `150 m²` on a `9 m` road; `3,000 m²` commercial on a `24 m` road; `6,000 m²` industrial on an `18 m` road) both with and without depth/width/height for `"needs depth/width/height"` and for `"No limit in the law for this case"` vs. `"Not covered by our data yet"`.
- [x] A-012 R2: Playwright browser tests, WCAG AA accessibility checks at `390 px` and `1280 px`, and page weight budgets (`HTML <= 300 KB`, `initial JS + data <= 1.5 MB`) pass across all routes including `/`, `/j/in-ka-bengaluru`, `/j/in-ka-bengaluru-south`, and `/j/in-ka-bengaluru/topics/land-use`.

### Edge Cases & Error Handling

- [x] A-013 R1: Calling `verify_jurisdiction_text_fidelity` when a cited page number is out of range or absent from `data/page_text/<doc_id>.pages.json.gz` records a failure (`"Missing stored page text"`) rather than skipping the provision or parameter row.
- [x] A-014 R4: Computing labelled precision from `docs/review/relations-labelling.md` when verdicts are unfilled returns `None` (`< 0.8`) and keeps non-structural relation kinds (`cross_document_reference`, `definition_differs`, `precedence`) hidden (`public_visible: false`).

### Code Quality

- [x] A-015 Pattern consistency: New code follows naming and structural patterns of surrounding Python (`pipeline/bylaws/`) and TypeScript (`app/`, `components/`, `lib/`) code, including Rule R1 (zero jurisdiction hard-coding in code).
- [x] A-016 No unnecessary duplication: Existing utilities in `lib/plain-language.ts`, `pipeline/bylaws/fidelity.py`, and `pipeline/bylaws/parameters.py` are reused where applicable.
- [x] A-017 Readability and maintainability: Functions remain focused (`<= 50` lines where practical) with named constants instead of magic numbers or strings (`fab/project/code-quality.md`).
- [x] A-018 Single-source codegen: `scripts/generate_models.py --check` (`pipeline/bylaws/models/_generated.py` and `lib/types/generated.ts`) produces zero git diff against `schemas/*.schema.json`.

## Notes

- Check items as you review: `- [x]`
- All acceptance items must pass before `/fab-continue` (hydrate)
- If an item is not applicable, mark checked and prefix with **N/A**: `- [x] A-NNN **N/A**: {reason}`

## Deletion Candidates

- `components/ClausePanel.tsx` — Legacy zone-clause sidebar component no longer rendered by `components/AreaExplorerClient.tsx` or any `app/` route after the Part 2 map page rebuild (referenced only in `__tests__/clause-fallbacks.test.tsx`).
- `components/AreaExplorerClient.tsx:24-26,33-35` (`AreaExplorerClientProps` optional fields `clauses`, `amendmentLinks`, `clauseZoneTags`, `parametersPayload`, `resolutionConfig`, `consolidatedPayload`) — Unused optional props retained on `AreaExplorerClientProps` after removing `ClausePanel` and plot resolver cards from the map view.
- `lib/resolver.ts:59` (`"no_applicable_rule"` in `ResolvedParameterStatus`) — Superseded status literal retained in the TypeScript union after `resolvePlotParameters` replaced `"no_applicable_rule"` with `"no_limit_in_law"` and `"not_covered_by_data"`.

## Assumptions

| # | Grade | Decision | Rationale | Scores |
|---|-------|----------|-----------|--------|
| 1 | Certain | Store per-instrument page text in gzipped JSON files (`data/page_text/<doc_id>.pages.json.gz`) keyed by 1-based page number with the instrument's 64-char SHA-256 digest and page count | Keeps committed repo size compact (~400 KB total across all 19 acquired PDFs) while giving CI fast, self-contained access to every page's parser text and checksum | S:100 R:95 A:95 D:100 |
| 2 | Certain | Export `road_median_offset_m`, `road_p90_offset_m`, and `grid_fit_rmse_m` on `master_plan_zone` entries in `geo-layers.json` (and child/parent map metadata) so `/j/[id]` formats `"typically about 8 m from street centre-lines, and within about 21 m in 9 out of 10 places"` directly from the verification report figures | Satisfies Part 2.1–2.2 and Rule R1 without hard-coding accuracy numbers in UI code | S:100 R:95 A:95 D:100 |
| 3 | Certain | Add `plain_title` to document entries in `jurisdictions/*.yaml` and `documents.json` and use it in `formatPlainDocumentTitle` / `_format_short_doc_label` while preserving `title` for official gazette titles inside `Details` and document headers | Satisfies Part 3.1–3.2 cleanly from the source register | S:100 R:95 A:95 D:100 |

3 assumptions (3 certain, 0 confident, 0 tentative).
