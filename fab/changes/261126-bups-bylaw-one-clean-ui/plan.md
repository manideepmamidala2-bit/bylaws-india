# Plan: Bylaw One: Clean Interface and New Home Page

**Change**: 261126-bups-bylaw-one-clean-ui
**Intake**: `intake.md`

## Requirements

### Pipeline & Data Quality: Minimum Parameter Data Fixes

#### R1: Plausibility Bounds, Hectare Conversion, Non-FAR Reclassification, and Sentence Parking Values
`pipeline/bylaws/parameters.py` (and the TypeScript display layer in `lib/plain-language.ts`) MUST enforce parameter plausibility bounds per parameter kind (`far_base_max`: `0.25` to `5.0`; `far_premium_additional_max`: `0.05` to `2.0`; `tdr_receivable_max`: `0.05` to `2.0`; `ground_coverage_max_pct`: `5.0` to `100.0`; `setback_front_min_m`, `setback_rear_min_m`, `setback_side_min_m`: `0.0` to `30.0` m or `1.0` to `50.0`%; `building_height_max_m`: `3.0` to `250.0` m; `floors_max`: `1` to `60` floors), convert hectare plot-size intervals (`"Hectare"`, `"Hectares"`, `"Ha"`) to `m²` (`1 hectare = 10,000 m²`, so `"Upto 0.40 Hectares"` becomes `max: 4000.0`), exclude or reclassify non-FAR rows (deviation tolerances, compounding-fee rates, and premium FAR price/fee rows) so they are never recorded as `far_base_max` or `far_premium_additional_max`, and preserve sentence-valued parking requirements as prose text (`value: null`, `value_text` containing the sentence) rather than bare numbers. Any numeric value outside plausibility bounds MUST be excluded from display and listed in `data/reports/<jurisdiction>/parameter-mismatches.md` for owner review.

- **GIVEN** source tables in `rmp2015-zr`, `rmp2015-zr-amend-2025-04`, `rmp2015-zr-amend-2026-01`, `bbl-2003`, and the 2026 City Corporation bye-laws
- **WHEN** `bylaws parameters --jurisdiction <id>` and `pipeline/tests/test_parameters_and_relations.py` execute
- **THEN** `"Upto 0.40 Hectares"` parses as `max: 4000.0` (`m²`), zero deviation/compounding-fee/price-schedule rows appear as `far_base_max` or `far_premium_additional_max`, sentence parking requirements carry `value: null` with full `value_text`, zero out-of-bounds parameter values are emitted as displayable governing numbers, and any excluded out-of-bounds candidates are listed in `data/reports/<jurisdiction>/parameter-mismatches.md`

### Brand, Style & Language Rules: Bylaw One and dg2n Visual Idiom

#### R2: Rename to Bylaw One and Apply dg2n Design Tokens
The web application (`app/layout.tsx`, `app/globals.css`, `app/icon.svg`, `components/TopNav.tsx`, `components/Footer.tsx`, and all route metadata) MUST name the site **Bylaw One** with the descriptor `"Bengaluru's building rules. One code."` in metadata and Open Graph tags, provide a clean ink-on-paper favicon (`app/icon.svg`), note in `docs/` that a domain and trademark check is pending, and enforce the `dg2n.com` visual tokens (`#f5f3ed` paper, `#efeee8` panel, `#080909` ink, `#5b5e56` muted, `#c8ccc0` hairline, and `#ff6b52` coral accent used strictly for active step/selection indicators and **never for text color**), square corners, hairline section dividers, no cards or drop shadows, `Inter Tight` / `Source Serif 4` (65–75ch reading measure) / `JetBrains Mono` typography via `next/font/local`, and honest labels (`"In short, by this site"`, `"Derived by this site"`, `"From the official text"`).

- **GIVEN** any rendered page of the Next.js application
- **WHEN** the document title, metadata, Open Graph tags, computed styles, and DOM elements are inspected
- **THEN** the site title is `"Bylaw One"`, the descriptor is `"Bengaluru's building rules. One code."`, `#ff6b52` is never applied as CSS `color` on text, all text meets WCAG AA contrast, and site-authored summaries/derivations/quotes carry `"In short, by this site"`, `"Derived by this site"`, or `"From the official text"`

#### R3: Plain-Language Primary Layer and CI Language Gate
Every rendered page MUST keep its primary layer (all content outside closed `<details>` expanders) free of internal IDs (`bbl-2003`, `rmp2015-zr`, `sec_1.0`, `in-ka-bengaluru-south`), enum names (`in_force`, `state_rules`, `far_base_max`), schema or release internals (`Schema 1.4`, `PR 11`), internal file paths, and raw unit tokens (`sq_m`, `pct`, `m2`). Units MUST be written normally (`m`, `m²`, `%`), statuses MUST be written in plain words (`"In force since 14 May 2026"`, `"Draft, not in force"`, `"Replaced in January 2026"`), page introductions MUST be at most two sentences, and technical details (`eid` addresses, retrieval records, SHA-256 checksums, Wayback archive links, verification states) MUST appear only inside closed-by-default `"Details"` expanders. A CI check MUST fail if built HTML pages contain forbidden internal patterns outside `<details>`.

- **GIVEN** the production Next.js build output and rendered pages
- **WHEN** `pipeline/tests/test_release_and_copy_consistency.py` and the CI language check scan built HTML outside `<details>` elements
- **THEN** zero internal IDs, enum tokens, schema/PR references, or raw unit tokens (`sq_m`) appear outside `<details>` expanders

### Navigation & Site Structure: Header, Footer, and Corporation Selector

#### R4: Three-Item Header, Comprehensive Footer, Phone-First Menu, and Quiet Corporation Selector
`components/TopNav.tsx` MUST display only the `"Bylaw One"` wordmark (in `Inter Tight`), three primary navigation items (**The code**, **What changed**, **About**), and a search icon/trigger opening Pagefind search (`components/SearchBar.tsx`), collapsing at `390 px` mobile width to the wordmark, search icon, and a menu button with `>= 44 px` tap targets. `components/Footer.tsx` MUST render on every page with links to **Sources**, **Map**, **Data and downloads**, **Licence**, and **How this is built**, plus the line `"Worked out from the official documents. Not an official publication."` Subject and document pages MUST display a quiet corporation selector (`"Showing: <Corporation Name> · Change"`), defaulting to Greater Bengaluru (`in-ka-bengaluru`) for shared rules.

- **GIVEN** any page at `390 px` mobile and `1280 px` desktop viewports
- **WHEN** the header and footer are rendered
- **THEN** the header contains `"Bylaw One"`, `The code`, `What changed`, `About`, and the search trigger (collapsing behind a `>= 44 px` menu button on mobile), and the footer links to `Sources`, `Map`, `Data and downloads`, `Licence`, and `How this is built`

### Home Page: Single-Scroll Story and Five-Step Verbatim FAR Explainer

#### R5: Narrative Home Page with Five-Step Verbatim FAR Story and Zero Map/Plot Inputs
`app/page.tsx` MUST render the project's story in one scroll with **no map and no plot inputs**:
1. **Hero**: Heading **`Bengaluru's building rules. One code.`**, dynamic subline `"[N] official documents from [M] bodies, joined into one readable code. Every rule traced to its page."` computed from dataset state, and buttons **Read the code** and **What changed recently**.
2. **`01 / The problem`**: Heading **`Many sources. One building.`**, at most two sentences explaining the overlapping sources, and a quiet convergence illustration of the official documents (newest first) labelled `"Illustration"`.
3. **`02 / Follow one rule: FAR`**: A five-step interactive and no-JS-compatible (`<ol>`) explainer (`Step 1 / 5` through `Step 5 / 5`: `2004. The bye-laws set FAR.`, `2007. The master plan sets FAR by zone.`, `2017. The bye-laws hand FAR to the master plan.`, `2025. Premium FAR is added.`, `Today. What applies.`) with previous/next controls, keyboard navigation, reduced-motion support, vertically stacked steps on phones, one plain sentence per step labelled `"In short, by this site"`, a verbatim excerpt labelled `"From the official text"` with document name, date, and working `"View page"` link verified by `pipeline/tests/test_text_fidelity.py`, and clean parameter tables where applicable with zero implausible values.
4. **`03 / The code, by subject`**: Clean hairline-divided list (not cards) of the 11 subjects (`Land use`, `Ground coverage`, `FAR`, `Setbacks`, `Height`, `Parking`, `Basements and stilts`, `Projections and open spaces`, `Approvals and certificates`, `Fire safety`, `Definitions`), each with one plain line and link.
5. **`04 / Recently changed`**: The newest 3 to 5 in-force instruments with date, plain title, one-line `"what changed"` summary (`"In short, by this site"`), link, and `"All changes"` link.
6. **`Questions people ask`**: Expandable FAQ (`Is this official?`, `Where does the text come from?`, `What happens when rules disagree?`, `What is missing?` generated from `declarations.json`).
7. **Closing**: **`Read. Trace. Compare.`** and a **Read the code** button.

- **GIVEN** the home page `/` rendered at `390 px` and `1280 px`
- **WHEN** inspected in Playwright and checked by `pipeline/tests/test_text_fidelity.py`
- **THEN** all sections (`Hero`, `01`, `02` with 5 steps, `03` with 11 subjects, `04`, FAQ, and `"Read. Trace. Compare."`) render with zero map canvas and zero plot inputs, every quoted FAR excerpt matches its cited source page verbatim in `test_text_fidelity.py`, and every `"View page"` link points to the cited PDF page

### Subject Pages, Document Pages, Secondary Pages, and Plot Removal

#### R6: Subject Pages ("The code") Opening with Clean "What Applies Today" Tables
`/j/[id]/topics` MUST display the 11-subject index (`The code, by subject.`), and `/j/[id]/topics/[topic]` MUST render in strict order: (1) heading and one plain sentence on what the subject covers, (2) **What applies today** showing governing provisions and clean deduplicated parameter tables with conditions in plain words (`"Plots above 360 up to 1,000 m², roads above 12 up to 18 m"`), values with normal units (`m`, `m²`, `%`), and source + `"p. N"` page link on each row (keeping any raw row text like `"2 | Above 15 mup to 18.0m"` strictly inside `"Details"`), (3) **Why this rule applies** in one plain line expandable to the quoted statutory authority, (4) collapsed **Older or replaced rules** (newest first), (5) collapsed **Related provisions** (excluding definitions, tables of contents, and bare headings above the fold), and (6) a **Gap note** only when a known gap in `declarations.json` can change that subject. Subject pages MUST NOT display plot inputs or filters.

- **GIVEN** `/j/in-ka-bengaluru/topics/far` or `/j/in-ka-bengaluru-south/topics/setbacks`
- **WHEN** the page is rendered
- **THEN** `"What applies today"` appears first with a clean table containing plain-word conditions, unit-formatted values within plausibility bounds, and `"p. N"` source page links, `"Why this rule applies"` expands to the quoted authority, `"Older or replaced rules"` and `"Related provisions"` are collapsed by default, and no plot inputs or raw pipe-delimited row text appear outside `"Details"`

#### R7: Clean Document Pages, What Changed, Sources, Map (Without Plot Answers), and About
1. **Document page (`/j/[id]/documents/[doc]` and `/j/[id]/clauses`)**: Header shows plain title, issuing body, date, one status line, official PDF link, and archive link inside Details; body renders provisions in the law's own order showing provision number and verbatim text only, with `"Changed in 2026"` tags and tap-to-open `"Details"` (page link, archive link, newest-first version history, site notes, references, address); chapters load on demand from the outline; notices appear **only** for gaps affecting this document's in-force text (removing the 4 March 2026 South draft notice from in-force documents); and instruments whose text is not held never show a `"Read provisions"` link.
2. **What changed (`/j/[id]/timeline`)**: Newest first with date, plain title, type in words, one-line `"what changed"` summary, document link, and filters by type (`amendment`, `notification`, `order`) and by corporation.
3. **Sources (`/j/[id]/sources`)**: Newest first with plain names and statuses in the primary layer and technical fields inside `"Details"`.
4. **Map (`/j/[id]`)**: Standalone page titled `"Map"` with a link back to the code; plot inputs and plot answers are removed from the map panel so clicking a location shows **area, ward, corporation, and zone only**.
5. **About (`/about`)**: Explains what Bylaw One is, how it is built (`#how-this-is-built`, incorporating the former `/structure` content), how disagreements are handled, machine-only verification, licences (`#licence`), and the full FAQ.
6. **Plot Removal from View**: Remove plot cards, plot inputs,plot answers, and any copy promising plot answers from all pages while keeping `pipeline/bylaws/resolver.py`, `lib/resolver.ts`, `parameters.json`, and their unit tests in the repository.

- **GIVEN** the Document, What changed, Sources, Map, and About pages
- **WHEN** rendered and inspected in unit and Playwright browser tests
- **THEN** in-force document pages do not show the 4 March 2026 South draft notice, unstructured documents show no `"Read provisions"` link, What changed and Sources list entries newest first, the Map page shows area/ward/corporation/zone without plot inputs or plot answers, and `pytest pipeline/tests/test_resolver.py` and `vitest` resolver tests continue to pass

### Quality Gates & CI Verification

#### R8: Phone-First Layout, Accessibility, Page Budgets, and Browser Tests in CI
All pages MUST be designed for `390 px` phone viewports first (then `1280 px` desktop) with `>= 44 px` tap targets, pass `axe-core` WCAG AA accessibility checks, stay within page budgets (`HTML <= 300 KB`, initial `JS + data <= 1.5 MB` uncompressed), pass the CI language and excerpt fidelity checks, and pass Playwright browser tests verifying the 5-step FAR story on Home, clean subject tables, document provision expansion, and complete absence of plot inputs across the UI.

- **GIVEN** the production build of Bylaw One
- **WHEN** `pytest`, `npm test`, `npm run build`, `node scripts/check_page_budgets.mjs`, and `npx playwright test` run
- **THEN** all checks and browser tests pass at `390 px` and `1280 px` with zero accessibility, budget, fidelity, or language violations

### Non-Goals

- Changing the repository name or domain name in this round (a note in `docs/` records that the domain and trademark check for "Bylaw One" is pending).
- Deleting `pipeline/bylaws/resolver.py`, `lib/resolver.ts`, or their unit tests — the statutory plot resolver remains in the repository and tested, only hidden from the UI.
- Acquiring new external PDFs or inventing/paraphrasing legal text.

### Design Decisions

#### Narrative Home Page with Five-Step Verbatim FAR Story Instead of Map-First Home
**Decision**: Replace the map-first home page and plot calculator on `/` with a single-scroll editorial page in the `dg2n.com` idiom anchored by a 5-step FAR chronology (`2004`, `2007`, `2017`, `2025`, `Today`) quoting verbatim official text with page links, while moving the interactive map to `/j/[id]` (linked from the footer and the `Land use` subject) and removing plot inputs from all views.
**Why**: Explains the project's core value—how scattered bye-laws, master plan zoning rules, 2017 incorporation (bye-law 1.4), and 2025 premium FAR combine into one traceable code—before asking readers to navigate tables or maps, and avoids presenting plot-level answers while parameter tables are being reviewed as clean subject tables first.
**Rejected**: Keeping the full-viewport MapLibre map and Plot Card calculator on the home page, which obscured the statutory structure and surfaced raw parameter rows before table cleanup.
*Introduced by*: 261126-bups-bylaw-one-clean-ui

#### Parameter Plausibility Bounds, Hectare Normalization, and Non-FAR Row Exclusion
**Decision**: Enforce per-parameter numeric plausibility bounds (`far_base_max` `0.25–5.0`, `far_premium_additional_max` `0.05–2.0`, `ground_coverage_max_pct` `5–100%`, `setback_*_min_m` `0–30 m`, `building_height_max_m` `3–250 m`, `floors_max` `1–60`), multiply hectare plot-area intervals by `10,000` to normalize to `m²`, and exclude deviation tolerance, compounding-fee, and premium FAR price rows from FAR parameter records, logging any out-of-bounds candidates to `data/reports/<jurisdiction>/parameter-mismatches.md`.
**Why**: Prevents unit misreads (`0.40 Hectares` read as `0.4 m²`) and fee/tolerance percentages (`10%`, `20%`, `50%`) from appearing as implausible FAR or plot-size values in subject tables.
**Rejected**: Displaying unfiltered regex-extracted numbers in subject tables or silently dropping out-of-bounds rows without an owner review report.
*Introduced by*: 261126-bups-bylaw-one-clean-ui

### Deprecated Requirements

#### Map-First Home Page and Visible Plot Card Calculator
**Reason**: Superseded by `docs/plans/bylaw-one-clean-ui-plan.md` Decisions 2, 3, and 4: the home page now tells the story of the code without a map or plot calculator, the map lives on its own page showing area/ward/corporation/zone only, and plot inputs/answers are removed from the UI for now while keeping the resolver in the repository.
**Migration**: Home (`/`) renders the Bylaw One narrative and 5-step FAR story; Map remains at `/j/[id]` without `<PlotCard />` plot inputs/answers; subject pages (`/j/[id]/topics/[topic]`) display governing parameter tables directly.

## Tasks

### Phase 1: Setup & Minimum Data Fixes

- [x] T001 Fix hectare-to-`m²` interval conversion (`"Upto 0.40 Hectares"` → `4000.0 m²`), non-FAR row reclassification/exclusion (deviation tolerances, compounding fees, premium FAR price rates), sentence parking values, and per-parameter plausibility bounds in `pipeline/bylaws/parameters.py`, regenerate `public/data/in-ka-bengaluru*/4.0.0/parameters.json` and `data/reports/in-ka-bengaluru*/parameter-mismatches.md`, and add unit tests in `pipeline/tests/test_parameters_and_relations.py` <!-- R1 -->
- [x] T002 Update `lib/plain-language.ts` with parameter plausibility bounds, plain-English condition interval formatting (`formatParameterConditionsPlain`), clean subject metadata for the 11 subjects (`Land use`, `Ground coverage`, `FAR`, `Setbacks`, `Height`, `Parking`, `Basements and stilts`, `Projections and open spaces`, `Approvals and certificates`, `Fire safety`, `Definitions`), and subject-specific gap filtering, with unit tests in `__tests__/plain-language.test.ts` <!-- R1 -->

### Phase 2: Core Implementation — Rename, dg2n Style, Chrome, and Home Page

- [x] T003 Apply the **Bylaw One** rename (`"Bengaluru's building rules. One code."`), ink-on-paper favicon (`app/icon.svg`), dg2n design tokens (`#f5f3ed`, `#efeee8`, `#080909`, `#5b5e56`, `#c8ccc0`, `#ff6b52` never used as text color), 3-item responsive header (`components/TopNav.tsx` with `The code`, `What changed`, `About`, search trigger, and `390 px` mobile menu with `>= 44 px` tap targets), footer (`components/Footer.tsx`), and quiet corporation selector (`components/CorporationSelector.tsx`), and record the pending domain/trademark check in `docs/progress.md` <!-- R2 -->
- [x] T004 Rebuild the home page (`app/page.tsx`) and five-step FAR story component (`components/FarStoryStepper.tsx`) with Hero (dynamic document and issuing-body counts), `01 / The problem` (with convergence illustration), `02 / Follow one rule: FAR` (5 steps: 2004, 2007, 2017, 2025, Today with verbatim excerpts from structured data, `"View page"` links, clean tables, keyboard navigation, and `<ol>` no-JS layout), `03 / The code, by subject` (11 subjects), `04 / Recently changed`, expandable FAQ, and `"Read. Trace. Compare."` closing, plus excerpt fidelity verification in `pipeline/tests/test_text_fidelity.py` <!-- R5 -->

### Phase 3: Integration — Subject Pages, Document Pages, Secondary Pages & Plot Removal

- [x] T005 Rebuild `/j/[id]/topics/page.tsx` (11-subject index) and `/j/[id]/topics/[topic]/page.tsx` (Subject page) so each subject opens with heading + 1 sentence, **What applies today** (clean deduplicated parameter tables with units, conditions in words, and `"p. N"` links; raw row text only inside `"Details"`), **Why this rule applies** (expandable to quoted authority), collapsed **Older or replaced rules** (newest first), collapsed **Related provisions** (no definitions/ToC/headings above the fold), and subject-relevant gap notes only <!-- R6 -->
- [x] T006 Update Document pages (`app/j/[id]/documents/[doc]/page.tsx`, `app/j/[id]/clauses/page.tsx`, `components/ClauseTree.tsx`, `components/ClausePanel.tsx`), What changed (`app/j/[id]/timeline/page.tsx` with type and corporation filters), Sources (`app/j/[id]/sources/page.tsx`), standalone Map (`app/j/[id]/page.tsx` and `components/AreaExplorerClient.tsx` showing area/ward/corporation/zone only without plot inputs or plot answers), and About (`app/about/page.tsx` with `#how-this-is-built`, `#licence`, verification, and full FAQ), removing all plot inputs and plot answers from view across the app <!-- R7 -->

### Phase 4: Polish, CI Gates, Browser Verification & Progress Tracking

- [ ] T007 Update CI language and copy checks (`pipeline/tests/test_release_and_copy_consistency.py`), component tests (`__tests__/`), page budget check (`scripts/check_page_budgets.mjs`), Playwright browser tests (`e2e/`), and `docs/progress.md` so all unit tests, fidelity checks, language gates (outside `<details>`), `axe-core` accessibility checks, page budgets, and `390 px` / `1280 px` browser tests pass <!-- R8 -->

## Execution Order

- T001 and T002 establish the cleaned parameter dataset and formatting helpers before T004 and T005 render FAR story and subject tables.
- T003 establishes the Bylaw One layout, header, footer, and corporation selector used across T004, T005, and T006.
- T007 runs after T001–T006 to verify the full build, language gate, page budgets, and Playwright E2E suite.

## Acceptance

### Functional Completeness

- [ ] A-001 R1: `pipeline/bylaws/parameters.py` enforces plausibility bounds per parameter kind, converts hectare intervals (`"Upto 0.40 Hectares"` → `4,000 m²`), reclassifies/excludes non-FAR rows (deviation tolerances, compounding fees, premium FAR price rows), and keeps sentence parking values as text, with tests in `pipeline/tests/test_parameters_and_relations.py`
- [ ] A-002 R2: The site is named **Bylaw One** throughout (`app/layout.tsx`, wordmark, Open Graph metadata, favicon `app/icon.svg`, page titles) with descriptor `"Bengaluru's building rules. One code."` and dg2n tokens (`#f5f3ed`, `#efeee8`, `#080909`, `#5b5e56`, `#c8ccc0`, `#ff6b52` never used for text)
- [ ] A-003 R3: Primary-layer copy outside `<details>` contains zero internal IDs, enum names, schema/release internals, or raw unit tokens (`sq_m`), enforced by CI in `pipeline/tests/test_release_and_copy_consistency.py`
- [ ] A-004 R4: Header displays `"Bylaw One"`, three items (**The code**, **What changed**, **About**), and search trigger (collapsing on `390 px` phones with `>= 44 px` tap targets), and footer links to `Sources`, `Map`, `Data and downloads`, `Licence`, and `How this is built`
- [ ] A-005 R5: Home page (`/`) renders Hero (with computed document/body counts), `01 / The problem` (with convergence illustration), `02 / Follow one rule: FAR` (5 steps: 2004, 2007, 2017, 2025, Today with verbatim excerpts verified by `test_text_fidelity.py` and working page links), `03 / The code, by subject` (11 subjects), `04 / Recently changed`, FAQ, and `"Read. Trace. Compare."` closing, with no map and no plot inputs
- [ ] A-006 R6: Subject pages (`/j/[id]/topics/[topic]`) open with **What applies today** as clean deduplicated tables with units (`m`, `m²`, `%`), conditions in words, and `"p. N"` page links (raw row text only inside Details), followed by **Why this rule applies**, collapsed **Older or replaced rules**, collapsed **Related provisions**, and relevant-only gap notes
- [ ] A-007 R7: Document pages render in law order with number + verbatim text first, Details on tap, no `"Read provisions"` link for unstructured documents, and no 4 March 2026 South draft notice on in-force documents; What changed and Sources are ordered newest first; Map shows area/ward/corporation/zone only; About includes `#how-this-is-built`, `#licence`, and full FAQ
- [ ] A-008 R8: Phone-first (`390 px` and `1280 px`) layout, `axe-core` WCAG AA checks, page budgets (`<= 300 KB` HTML, `<= 1.5 MB` JS+data), CI language check, excerpt fidelity check, and Playwright browser tests pass

### Behavioral Correctness

- [ ] A-009 R1: No out-of-bounds parameter value or `0.4 m²` hectare misread is displayed in any subject table or home FAR table, and any excluded out-of-bounds values are documented for owner review
- [ ] A-010 R5: Every quoted legal excerpt in the 5-step FAR story on the home page is verified verbatim against its cited source page by `pipeline/tests/test_text_fidelity.py`

### Removal Verification

- [ ] A-011 R7: Plot calculator cards, plot area/road width inputs, and plot answers are removed from Home, Map, Subject, and Document pages while `pipeline/bylaws/resolver.py` and `lib/resolver.ts` and their unit tests remain in the repository and pass

### Scenario Coverage

- [ ] A-012 R5: Playwright browser tests verify the home page 5-step FAR story (steps 1–5, verbatim excerpts, working page links), a subject page clean table with units, a document page provision expansion, and the absence of plot inputs across pages
- [ ] A-013 R1: `pytest pipeline/tests/test_parameters_and_relations.py` verifies hectare conversion, plausibility bounds, non-FAR row exclusion, and sentence parking values against source tables

### Edge Cases & Error Handling

- [ ] A-014 R5: The 5-step FAR story works without JavaScript as a semantic ordered list (`<ol>`) and stacks vertically on `390 px` phones while supporting keyboard navigation and reduced motion
- [ ] A-015 R7: Instruments whose text is not held (`structured: false` or `reference_only`) never show a `"Read provisions"` link, and draft notices never appear on in-force documents

### Code Quality

- [ ] A-016 Pattern consistency: New code follows naming and structural patterns of surrounding code
- [ ] A-017 No unnecessary duplication: Existing utilities in `lib/plain-language.ts`, `lib/data.ts`, and `pipeline/bylaws/` are reused where applicable
- [ ] A-018 Readability and maintainability: Components and parser helpers remain focused and readable without god functions (`>50 lines` without clear reason) or magic numbers without named constants (`fab/project/code-quality.md`)

## Notes

- Check items as you review: `- [x]`
- All acceptance items must pass before `/fab-continue` (hydrate)
- If an item is not applicable, mark checked and prefix with **N/A**: `- [x] A-NNN **N/A**: {reason}`

## Assumptions

| # | Grade | Decision | Rationale | Scores |
|---|-------|----------|-----------|--------|
| 1 | Certain | Default `/j/in-ka-bengaluru/topics` and `/j/in-ka-bengaluru/timeline` for "The code" and "What changed" links from the global header when on `/` or `/about`, while preserving the active corporation `/j/[id]/...` when viewing a specific corporation | Explicitly matches `docs/plans/bylaw-one-clean-ui-plan.md` §4 ("defaulting to Greater Bengaluru for shared rules") | S:95 R:95 A:95 D:95 |
| 2 | Certain | Keep `/structure` route working (redirecting or rendering the "How this is built" explanation) in addition to `/about#how-this-is-built` so existing bookmarks/links do not 404 | Standard Next.js route hygiene while moving "Structure" out of the header to "How this is built" in the footer and About page (`docs/plans/bylaw-one-clean-ui-plan.md` §4 & §7) | S:90 R:95 A:95 D:95 |

2 assumptions (2 certain, 0 confident, 0 tentative).
