# Plan: Bylaw One: One City, One Truth

**Change**: 261126-jqph-one-city-one-truth
**Intake**: `intake.md`

## Requirements

### Architecture & Pipeline: City-Level Truth ("What applies today")

#### R1: Table & Provision Supersession, Duplicate Collapsing, Overlap & Band Continuity Checks, and Accurate "Replaced" Labels (Part 1)
The pipeline (`pipeline/bylaws/parameters.py`, `pipeline/bylaws/amendments.py`, `pipeline/bylaws/consolidate.py`, `pipeline/bylaws/validate.py`) and web subject pages (`app/j/[id]/topics/[topic]/page.tsx`, `lib/plain-language.ts`) MUST ensure that **"What applies today"** at the city level (`in-ka-bengaluru`) shows only current in-force rules and current consolidated wording:
1. **Table Supersession**: Whenever an in-force amendment substitutes, omits, or replaces a table or row (including `rmp2015-zr-amend-2026-01` substituting `Table 8` low-rise setbacks up to `12.0 m` and substituting the `Industrial (General)` plot-size, setback, ground coverage, and FAR rows from `rmp2015-zr` `Table 20`), only the replacing version SHALL remain `legal_status: "in_force"` (`valid_to: null`) and appear under **"What applies today"**. The replaced version MUST move to **"Older or replaced rules"**, ordered newest first, with the label `"Replaced by [plain name], [date]"`.
2. **Provision Supersession**: **"Governing provisions in force"** under **"What applies today"** MUST display the **consolidated current wording** after applying in-force amendments (specifically `rmp2015-zr` clauses `3.1(ii)` and `3.1(iii)` showing their January 2026 substituted text rather than their 2007 wording, without listing the 2007 base clause and the standalone amending clause as duplicate entries), accompanied by a small tag `"Changed [month year]"` (e.g., `"Changed January 2026"`), the amending notification citation and page link (`p. N`), and the previous wording one tap away inside `"Details"`.
3. **Duplicate Removal**: Where a later amendment restates a rule with identical values and conditions (specifically the 2009 Traffic and Transportation table in `rmp2015-zr-amend-2009-03` restating the 2007 `rmp2015-zr` Table 22 values), it MUST be shown **once** under **"What applies today"**, citing the latest source in the primary table and listing earlier sources inside `"Details"`.
4. **CI Overlap Check & Band Continuity Check**: For each subject, no two rows under **"What applies today"** MAY cover the same parameter/rule, zone or use, and overlapping numeric conditions (`plot_area_m2`, `road_width_m`, `building_height_m`, `plot_width_m`, `plot_depth_m`) with different values unless resolved by supersession or explicitly surfaced as `"Not settled: two rules apply"` with both sources. Where a subject's rules use numeric ranges, the pipeline MUST report band gaps and overlaps between current tables (specifically the `11.5 m` to `12.0 m` overlap between the January 2026 setback table covering buildings up to `12 m` and the 2007 taller-building Table 9 starting above `11.5 m`) and display the overlap plainly to the reader (`"The current tables overlap between 11.5 m and 12 m"`) with both sources without adjusting any number. Any unexplained overlap MUST fail `bylaws validate` and CI tests.
5. **Correct "Replaced" Labels & Clean Governing Lists**: Only rules actually replaced by a later rule SHALL carry `"Replaced"`. `bbl-2003` Bye-law `1.4` (`part_I__sec_1.0__cl_1.4`) MUST NEVER appear in **"Older or replaced rules"** or be labelled replaced. Definitions MUST be labelled replaced only if a later instrument replaces that definition. `bbl-2003` rules displaced on zoning-governed subjects by Bye-law `1.4` MUST be labelled `"Master plan rules apply instead (bye-law 1.4)"`, never `"Replaced"`. Definitions (except on the `Definitions` subject), tables of contents, prefaces/preambles/signature blocks, and bare headings MUST be excluded from **"Governing provisions in force"**.

- **GIVEN** the published Greater Bengaluru (`in-ka-bengaluru`) dataset and the `Setbacks` and `FAR` subject pages
- **WHEN** `bylaws parameters`, `bylaws amendments`, `bylaws validate`, and `/j/in-ka-bengaluru/topics/{setbacks,far}` are inspected
- **THEN** Industrial (General) plots up to `500 m²` appear once under governing Setbacks (`12%` / `8%` / `8%` from the January 2026 notification) and once under governing FAR (`rmp2015-zr-amend-2026-01`), with the 2007 `4.5 m` setback and 2007 FAR rows under `"Older or replaced rules"` labelled `"Replaced by …"`
- **AND** Setbacks governing provisions `3.1(ii)` and `3.1(iii)` show their January 2026 substituted wording with `"Changed January 2026"`, amending citation/page, and 2007 wording in `"Details"`
- **AND** Traffic and Transportation FAR appears once citing the 2009 amendment with the 2007 source in `"Details"`, the `11.5 m`–`12 m` setback height-band overlap is shown plainly with both sources, and Bye-law `1.4` is never labelled replaced

### Architecture, Pipeline & Web: One City Code, Corporations as a Thin Layer

#### R2: Single-Source Greater Bengaluru Code, Thin Corporation Layers, 5-Corporation Fidelity/Structure, and CI Parity Check (Part 2)
The pipeline (`pipeline/bylaws/publish.py`, `pipeline/bylaws/consolidate.py`, `pipeline/bylaws/fidelity.py`, `pipeline/bylaws/validate.py`) and web viewer (`lib/data.ts`, `app/j/[id]/topics/[topic]/page.tsx`, `app/j/[id]/documents/[doc]/page.tsx`, `components/ClauseTree.tsx`) MUST build shared rules once at the Greater Bengaluru (`in-ka-bengaluru`) level and treat each of the five City Corporations (`in-ka-bengaluru-central`, `-north`, `-south`, `-east`, `-west`) as a thin layer containing only its own in-force differences:
1. **Single Source & Corporation Layer**: Shared documents, parameters, and provisions MUST be built once at the Greater Bengaluru level and referenced by corporation views without copying unchanged shared data. Each corporation layer SHALL contain only what its own in-force instruments introduce (its May 2026 Building (Amendment) Bye-laws, its boundary and wards, and any provision whose text limits it to that corporation).
2. **Subject Pages with a Corporation Selected**: Viewing `/j/[id]/topics/[topic]` for a City Corporation MUST render the city page plus: (a) a short line under the heading `"Showing Greater Bengaluru rules, with differences for [corporation]."`, (b) any row or provision that differs marked `"In [corporation]: …"` with its source, and (c) when nothing differs on that subject, `"No differences for [corporation] on this subject."`
3. **Document Pages with a Corporation Selected**: Viewing `bbl-2003` with a City Corporation selected MUST show the corporation's consolidated wording where its 2026 amendment applies, marked `"Changed for [corporation], [date]"`.
4. **Equal Treatment & CI Parity Check**: All five corporations' 2026 amendments MUST pass the text fidelity check (`verify_jurisdiction_text_fidelity` — every provision's text found on its cited page or covered by a recorded correction, zero editorial insertions inside legal text) and structure rules (no dates as clause numbers, no duplicates, depth `<= 6`, plain title). A CI parity check (`pipeline/tests/test_pr12_greater_bengaluru.py`) MUST verify that for any two corporations, the set of pages, subjects, and documents is identical and every content difference traces to a corporation-specific instrument.

- **GIVEN** `in-ka-bengaluru` and all five child City Corporations (`central`, `north`, `south`, `east`, `west`)
- **WHEN** `pytest pipeline/tests/test_text_fidelity.py pipeline/tests/test_pr12_greater_bengaluru.py` executes and corporation subject/document pages render
- **THEN** all five corporations pass 100% text fidelity and structure checks, the CI parity check passes with every inter-corporation content difference traced to a corporation-scoped instrument, subject pages show `"Showing Greater Bengaluru rules, with differences for [corporation]"` plus `"In [corporation]: …"` or `"No differences for [corporation] on this subject."`, and `bbl-2003` shows `"Changed for [corporation], [date]"`

### Web Application & CI: One Site, One Design, and Plain Map/Land-Use Gap Notice

#### R3: Removal of Old-Design Pages, Corporation Page Rebuild, Redirects, and CI Old-Design Check (Part 3)
The web application (`app/`, `components/`, `next.config.ts`) MUST remove every remaining route and component in the old design, rebuild all corporation views from the Bylaw One templates, redirect all old addresses while preserving corporation selection, and enforce an old-design check in CI:
1. **Remove Old Pages**: Delete `app/j/[id]/documents/[doc]/[eid]/page.tsx`, `app/j/[id]/review/page.tsx`, `components/ReviewPanel.tsx`, `app/structure/page.tsx`, and any legacy multi-document dump view (`app/j/[id]/clauses/page.tsx`, `app/j/[id]/documents/page.tsx`), ensuring every city and corporation route uses the Bylaw One templates.
2. **Redirect Old Addresses**: Configure `redirects()` in `next.config.ts` so `/structure` and `/j/:id/structure` redirect to `/about#how-this-is-built`, `/j/:id/review` redirects to `/j/:id`, `/j/:id/documents/:doc/:eid` redirects to `/j/:id/documents/:doc#node-:eid`, `/j/:id/clauses` and `/j/:id/documents` redirect to `/j/:id/sources` (or the clean Bylaw One code/sources view), and legacy underscore topic IDs (`/j/:id/topics/building_height`, `ground_coverage`, `land_use`, `basements_stilts`, `projections_open_spaces`, `approvals_certificates`, `fire_safety`, `plot_size_frontage`, `road_width`, `deviations_regularisation`) redirect to their canonical hyphenated subject slugs while preserving `:id`.
3. **CI Old-Design Check**: Built HTML pages across city and all five corporations MUST fail CI (`pipeline/tests/test_release_and_copy_consistency.py` and `scripts/check_page_budgets.mjs`) if they contain old site titles, navigation labels, or component names (`"Structured Building Bylaws"`, `"Statutory Resolution Cards"`, `"Local Graph"`, `"topic:"`).

- **GIVEN** the built Next.js application and `next.config.ts`
- **WHEN** `npm run build`, `scripts/check_page_budgets.mjs`, and `pytest pipeline/tests/test_release_and_copy_consistency.py` execute
- **THEN** zero built HTML pages contain `"Structured Building Bylaws"`, `"Statutory Resolution Cards"`, `"Local Graph"`, or `"topic:"`, every old route redirects to its Bylaw One equivalent preserving the selected corporation, and all city and corporation pages pass fidelity, structure, and language checks

#### R4: Plain Land-Use Zone Gap Notice on Map and Land Use Pages (Part 4)
The Map page (`app/j/[id]/page.tsx`, `components/AreaExplorerClient.tsx`) and the `Land use` subject page (`app/j/[id]/topics/[topic]/page.tsx`, `lib/plain-language.ts`) MUST state the land-use zone coverage gap in one plain sentence and restrict gap notices to pages where a gap can change what is shown:
1. The Map MUST show official boundaries and wards for all five City Corporations and land-use zones where processed (parts of Bengaluru South).
2. Both the Map page (`/j/[id]`) and the `Land use` subject page (`/j/[id]/topics/land-use`) MUST display the plain line:
   `"Land-use zones are available for parts of Bengaluru South only. Elsewhere the map shows boundaries and wards."`
3. Gap notices MUST appear only where a gap can change what a page shows.

- **GIVEN** the Map page (`/j/[id]`) and the `Land use` subject page (`/j/[id]/topics/land-use`) across `in-ka-bengaluru` and the five City Corporations
- **WHEN** the pages are rendered and inspected in unit and browser tests
- **THEN** both pages display `"Land-use zones are available for parts of Bengaluru South only. Elsewhere the map shows boundaries and wards."`, all five corporations' boundaries and wards are available on the map, and unaffected subject/document pages omit irrelevant gap notices

### Non-Goals

- Acquiring new PDFs, new map sheets, or new georeferenced land-use polygons beyond existing repository data (`docs/plans/one-city-one-truth-plan.md` §3 Decisions 6–7).
- Inventing, paraphrasing, or adjusting legal numbers or statutory wording to resolve overlaps in the official instruments (`docs/plans/one-city-one-truth-plan.md` §4).

### Design Decisions

#### Parameter Supersession, Duplicate Collapsing, and Band Continuity Reporting in `parameters.py`
**Decision**: Compute parameter supersession and duplicate collapsing deterministically in `pipeline/bylaws/parameters.py` before writing `parameters.json` (recording `replaced_by_doc`, `replaced_by_date`, and `also_in_sources` metadata and emitting a structured `band_continuity` and `overlaps` summary in `parameters.json` / `parameter-mismatches.md`), and render current-text band overlaps (such as the `11.5 m`–`12.0 m` setback table overlap) explicitly on subject pages.
**Why**: Keeps the web application read-only and deterministic while ensuring that `parameters.json` consumers, CI checks, and subject tables all see the exact same governing vs. superseded state and unadjusted statutory band overlaps.
**Rejected**: Filtering superseded or duplicate rows ad-hoc only in React components or silently altering `11.5 m` to `12.0 m` in Table 9.
*Introduced by*: 261126-jqph-one-city-one-truth

#### Single-Source Parent Dataset with Corporation Diff Marking
**Decision**: Store shared documents, consolidated planning snapshots, and shared parameter records once in `in-ka-bengaluru`, resolve shared parent records in `lib/data.ts`, and compute per-corporation subject and document differences strictly from instruments carrying `applies_in` for that corporation.
**Why**: Eliminates 5-way duplication of city-wide rules, guarantees by construction that corporation pages match Greater Bengaluru on shared rules, and enables a strict CI parity check across all five City Corporations.
**Rejected**: Maintaining independent copies of shared planning parameters or uncleaned clause trees per corporation.
*Introduced by*: 261126-jqph-one-city-one-truth

### Deprecated Requirements

#### Standalone Provision Neighborhood Graph Page (`/j/[id]/documents/[doc]/[eid]`), Map Review Page (`/j/[id]/review`), and `/structure` Page
**Reason**: Replaced by the unified Bylaw One templates (`docs/plans/one-city-one-truth-plan.md` §5 Part 3.1–3.3): provision details open inline on `/j/[id]/documents/[doc]#node-[eid]`, sheet overlay inspection lives on `/j/[id]`, and dataset architecture lives at `/about#how-this-is-built`.
**Migration**: Redirected via `next.config.ts` (`redirects()`), preserving the corporation identifier `:id`.

## Tasks

### Phase 1: Part 1 — City-Level Truth ("What applies today")

- [x] T001 Implement Part 1 city-level table and provision supersession, duplicate collapsing (2009 vs 2007 Traffic and Transportation FAR/coverage; 2026 vs 2007 Industrial General setbacks/FAR/coverage), `rmp2015-zr` `3.1(ii)`–`(iii)` consolidated governing text with `"Changed [month year]"` tag and previous wording in Details, CI overlap and height/area/road band continuity checks (surfacing the `11.5 m`–`12 m` setback table overlap plainly), accurate `"Replaced by [plain name], [date]"` vs `"Master plan rules apply instead (bye-law 1.4)"` labels (never placing Bye-law `1.4` in replaced rules), governing provision list filtering, and Part 1 tests in `pipeline/bylaws/parameters.py`, `pipeline/bylaws/amendments.py`, `pipeline/bylaws/consolidate.py`, `pipeline/bylaws/validate.py`, `data/overrides/in-ka-bengaluru/overrides.yaml`, `lib/plain-language.ts`, `app/j/[id]/topics/[topic]/page.tsx`, `pipeline/tests/test_parameters.py`, and `__tests__/plain-language.test.ts`, then commit, push, open the draft PR, and update `docs/progress.md` <!-- R1 -->

### Phase 2: Part 2 — One City Code & Thin Corporation Layers

- [x] T002 Implement Part 2 single-source Greater Bengaluru shared rules and thin City Corporation layers across all five corporations (`central`, `north`, `south`, `east`, `west`), verify and clean all five corporations' 2026 amendments to pass 100% text fidelity (`pipeline/bylaws/fidelity.py`, `data/overrides/in-ka-bengaluru-*/overrides.yaml`) and structure checks, add corporation subject diff UI (`"Showing Greater Bengaluru rules, with differences for [corporation]"`, `"In [corporation]: …"`, `"No differences for [corporation] on this subject."`) in `app/j/[id]/topics/[topic]/page.tsx`, add `"Changed for [corporation], [date]"` marks on corporation document pages (`pipeline/bylaws/consolidate.py`, `components/ClauseTree.tsx`), and add the 5-corporation CI parity check in `pipeline/tests/test_pr12_greater_bengaluru.py`, then commit, push, and update `docs/progress.md` and the PR description <!-- R2 -->

### Phase 3: Part 3 — One Site, One Design & Redirects

- [x] T003 Implement Part 3 removal of old-design routes (`app/j/[id]/documents/[doc]/[eid]/page.tsx`, `app/j/[id]/review/page.tsx`, `components/ReviewPanel.tsx`, `app/structure/page.tsx`, and legacy `/j/[id]/clauses` / `/j/[id]/documents` dumps), configure corporation-preserving redirects for all old addresses and legacy topic slugs in `next.config.ts`, remove any remaining `"Structured Building Bylaws"`, `"Statutory Resolution Cards"`, `"Local Graph"`, and `"topic:"` strings from UI components/pages, and add the CI old-design and redirect checks in `pipeline/tests/test_release_and_copy_consistency.py`, `scripts/check_page_budgets.mjs`, and `__tests__/`, then commit, push, and update `docs/progress.md` and the PR description <!-- R3 -->

### Phase 4: Part 4 — Plain Map/Land-Use Gap Notice, Screenshots & Final Verification

- [x] T004 Implement Part 4 plain land-use zone gap notice (`"Land-use zones are available for parts of Bengaluru South only. Elsewhere the map shows boundaries and wards."`) on the Map page (`app/j/[id]/page.tsx`, `components/AreaExplorerClient.tsx`) and `Land use` subject page (`app/j/[id]/topics/[topic]/page.tsx`, `lib/plain-language.ts`), ensure gap notices appear only where relevant, capture `390 px` and `1280 px` screenshots of Setbacks and FAR at city level and for Bengaluru South, run full `pytest`, `vitest`, `npm run build`, `scripts/check_page_budgets.mjs`, and Playwright `e2e/` browser tests, and commit, push, and update `docs/progress.md` and the PR description <!-- R4 -->

## Execution Order

- T001 (Part 1) → T002 (Part 2) → T003 (Part 3) → T004 (Part 4), committing and pushing after each part per `docs/plans/one-city-one-truth-plan.md` §4 and §6.

## Acceptance

### Functional Completeness

- [ ] A-001 R1: "What applies today" on every subject page shows only current in-force parameter table rows and current consolidated provision wording, while superseded rows and provisions appear under "Older or replaced rules" ordered newest first with "Replaced by [plain name], [date]"
- [ ] A-002 R1: Duplicate parameter rows (such as the 2009 Traffic and Transportation table restating the 2007 table) appear once under "What applies today" citing the latest source with earlier sources in Details, and CI overlap and band continuity checks pass while surfacing the `11.5 m`–`12 m` setback height-band overlap plainly with both sources
- [ ] A-003 R2: Shared documents, parameters, and provisions are built once for Greater Bengaluru (`in-ka-bengaluru`), corporation subject pages display "Showing Greater Bengaluru rules, with differences for [corporation]" with differing items marked "In [corporation]: …" or "No differences for [corporation] on this subject.", and corporation document pages mark corporation-amended clauses "Changed for [corporation], [date]"
- [ ] A-004 R2: All five City Corporations' 2026 amendments pass `verify_jurisdiction_text_fidelity` and structure checks (`depth <= 6`, no date-shaped clause numbers, no duplicates, zero editorial insertions in legal text), and the 5-corporation CI parity check passes
- [ ] A-005 R3: All old-design routes are removed and redirected in `next.config.ts` preserving corporation selection, and the CI old-design check verifies zero occurrences of "Structured Building Bylaws", "Statutory Resolution Cards", "Local Graph", or "topic:" in built pages
- [ ] A-006 R4: Both the Map page (`/j/[id]`) and the Land use subject page (`/j/[id]/topics/land-use`) display "Land-use zones are available for parts of Bengaluru South only. Elsewhere the map shows boundaries and wards.", and gap notices appear only where a gap can affect what a page shows

### Behavioral Correctness

- [ ] A-007 R1: On Setbacks and FAR, Industrial (General) plots up to `500 m²` show only the January 2026 rule under "What applies today" (`12%` / `8%` / `8%` setbacks and 2026 FAR) with the 2007 `4.5 m` setback and 2007 FAR rows moved to "Older or replaced rules", and Setbacks clauses `3.1(ii)` and `3.1(iii)` display their January 2026 substituted wording with "Changed January 2026" and 2007 wording in Details
- [ ] A-008 R1: Bye-law `1.4` is never placed in "Older or replaced rules" or labelled "Replaced"; `bbl-2003` rules displaced by Bye-law `1.4` are labelled "Master plan rules apply instead (bye-law 1.4)"; and definitions, tables of contents, and bare headings do not appear in "Governing provisions in force"

### Removal Verification

- [ ] A-009 R3: `app/j/[id]/documents/[doc]/[eid]/page.tsx`, `app/j/[id]/review/page.tsx`, `components/ReviewPanel.tsx`, and `app/structure/page.tsx` are removed and replaced by clean redirects in `next.config.ts`

### Scenario Coverage

- [ ] A-010 R1: Falsifiable unit tests in `pipeline/tests/test_parameters.py` and `__tests__/` verify Industrial (General) setbacks and FAR supersession, `3.1(ii)`–`(iii)` consolidated wording, Traffic and Transportation FAR deduplication, the `11.5 m`–`12 m` band continuity overlap, and the Bye-law `1.4` label invariants against source pages
- [ ] A-011 R2: Falsifiable tests in `pipeline/tests/test_text_fidelity.py` and `pipeline/tests/test_pr12_greater_bengaluru.py` verify 5-corporation 2026 amendment text fidelity, structure invariants, and inter-corporation parity
- [ ] A-012 R4: Playwright browser tests (`e2e/`), Vitest + `axe-core` WCAG AA checks, and `scripts/check_page_budgets.mjs` (`HTML <= 300 KB`, `initial JS + data <= 1.5 MB`) pass at `390 px` and `1280 px`

### Edge Cases & Error Handling

- [ ] A-013 R1: Any unexplained parameter overlap among governing in-force rows for the same parameter, zone/use, and overlapping numeric intervals causes `bylaws validate` and CI tests to fail loudly

### Code Quality

- [ ] A-014 Pattern consistency: New code follows naming and structural patterns of surrounding pipeline and Next.js modules
- [ ] A-015 No unnecessary duplication: Existing utilities in `pipeline/bylaws/` and `lib/plain-language.ts` are reused where applicable
- [ ] A-016 Readability and maintainability: Functions remain focused and modular (`<= 50` lines where practical) with named constants instead of magic strings or numbers
- [ ] A-017 Rule R1 compliance: Zero jurisdiction IDs, city names, or regulatory constants are hard-coded in `pipeline/` or `app/`/`components/`/`lib/` (`pipeline/tests/test_r1_no_hardcoding.py` passes)

## Notes

- Check items as you review: `- [x]`
- All acceptance items must pass before `/fab-continue` (hydrate)
- If an item is not applicable, mark checked and prefix with **N/A**: `- [x] A-NNN **N/A**: {reason}`

## Assumptions

| # | Grade | Decision | Rationale | Scores |
|---|-------|----------|-----------|--------|
| 1 | Certain | Structure the implementation in 4 sequential tasks (`T001`–`T004`) matching Parts 1–4 of `docs/plans/one-city-one-truth-plan.md`, committing and pushing after each part and keeping `docs/progress.md` and the draft PR updated | Matches the explicit 4-part execution order and incremental commit/push requirement in `docs/plans/one-city-one-truth-plan.md` §5–§6 | S:100 R:95 A:95 D:100 |
| 2 | Certain | Redirect legacy `/j/:id/documents/:doc/:eid`, `/j/:id/review`, `/j/:id/clauses`, `/j/:id/documents`, `/structure`, and underscore topic slugs via `next.config.ts` `redirects()` while preserving `:id` | Ensures zero old-design pages remain while keeping every previous URL functional and corporation-scoped (`docs/plans/one-city-one-truth-plan.md` §5 Part 3.1–3.3) | S:95 R:90 A:95 D:95 |

2 assumptions (2 certain, 0 confident, 0 tentative).
