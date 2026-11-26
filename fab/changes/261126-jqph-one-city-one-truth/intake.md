# Intake: Bylaw One: One City, One Truth

**Change**: 261126-jqph-one-city-one-truth
**Created**: 2026-11-26

## Origin

> Implement docs/plans/one-city-one-truth-plan.md using existing data only: open one draft PR with the preview URL at the top; Part 1 make "What applies today" true at city level (apply amendments to tables and provisions so only current rules and current wording show as governing, replaced rules move to "Older or replaced rules", duplicates shown once, overlap and band continuity checks in CI with current-text overlaps shown plainly as not settled, "Replaced" labels only on real replacements and never on bye-law 1.4, governing lists free of definitions and tables of contents); Part 2 build shared rules once for Greater Bengaluru and make each City Corporation a thin layer that marks only its own differences, with all five corporations' 2026 amendments passing the fidelity and structure checks and a parity check in CI; Part 3 remove every page in the old design, rebuild corporation pages from the Bylaw One templates, redirect all old addresses, and add an old-design check in CI; Part 4 state the land-use zone gap plainly on the map and Land use page; commit and push after each part, keep docs/progress.md current and the PR's "For owner review", "Decisions made" and "Known gaps" sections up to date; never invent or rewrite legal text.

One-shot invocation referencing the self-contained specification in `docs/plans/one-city-one-truth-plan.md` (dated 26 November 2026), based on the live-site review of `https://bylaws-india.vercel.app` on 26 November 2026 using existing repository data and the existing **Bylaw One** (`dg2n`) design only.

## Why

1. **Problem**: Although **Bylaw One** (`"Bengaluru's building rules. One code."`) introduced a clean narrative home page, 11 subject pages, and law-order document views in Release `4.0.0`, the live review of 26 November 2026 identified three structural truth and consistency gaps across the city and corporation views:
   - **"What applies today" mixes current and replaced rules**:
     - On **Setbacks**, Industrial (General) plots up to `500 m²` appear twice under governing rules: `4.5 m` on all sides from the 2007 RMP 2015 Zoning Regulations (`rmp2015-zr` Table 20) and `12%` / `8%` / `8%` of plot depth and width from the January 2026 notification (`rmp2015-zr-amend-2026-01`), both shown as governing.
     - Under **Governing provisions in force** on Setbacks, clauses `3.1(ii)` and `3.1(iii)` display their original 2007 wording (`11.5 m` threshold and Table 8 in `rmp2015-zr`), even though the site's own note states that the January 2026 notification substituted them (`12.0 m` threshold and substituted Table 8).
     - **Height bands overlap**: the January 2026 setback table covers buildings up to `12.0 m`, whereas the 2007 taller-building table (`Table 9`), still in force and governing for taller buildings, starts above `11.5 m`—creating an unflagged `11.5 m` to `12.0 m` overlap in the current texts.
     - On **FAR**, Traffic and Transportation appears twice with identical values (`rmp2015-zr` 2007 Table 22 and the 2009 amendment `rmp2015-zr-amend-2009-03`), and Industrial (General) appears twice (2007 Table 20 and January 2026 notification `rmp2015-zr-amend-2026-01`).
     - In **Older or replaced rules**, `bbl-2003` Bye-law `1.4` itself and several definitions are erroneously labelled `"Replaced for this subject by the Master Plan Zoning Regulations under Bye-law 1.4"`, and `bbl-2003` rules displaced via Bye-law `1.4` carry `"Replaced"` instead of `"Master plan rules apply instead (bye-law 1.4)"`.
   - **Two websites in one & uneven corporation data**:
     - Legacy routes (`/j/[id]/documents/[doc]/[eid]`, `/j/[id]/review`, `/structure`) and any stale corporation bundles still expose previous-site layouts or labels (`"Structured Building Bylaws"`, `"Statutory Resolution Cards"`, `"Local Graph"`, `"topic:"`) or uncleaned corporation-level override/fidelity gaps across the five City Corporations (`central`, `north`, `south`, `east`, `west`).
     - Shared rules (`rmp2015-zr` and its amendments, `bbl-2003`, Chapter 11 premium FAR, `gbga-2024`, `udd-200-mnu-2025-khata`) are identical across Greater Bengaluru, while corporations differ only in their May 2026 Building (Amendment) Bye-laws, boundaries, and wards; selecting a corporation on a subject page does not yet clearly highlight *only* what differs in that corporation.
   - **Land-use zone coverage gap not stated plainly**:
     - Processed land-use zone polygons exist only for four map sheets in parts of Bengaluru South (`rmp2015-pd-210-a`, `rmp2015-pd-210-b`, `rmp2015-pd-211-a`, `rmp2015-pd-211-b`), while elsewhere the map shows boundaries and wards; this needs a single plain-language line on the Map and Land use pages.
2. **Consequence of not fixing**: Architects and citizens reading `"What applies today"` see superseded 2007 numbers alongside 2026 numbers, read 2007 unamended clause text for amended regulations, encounter unflagged height-band overlaps (`11.5 m`–`12.0 m`), see Bye-law `1.4` mislabelled as replaced by itself, and cannot immediately tell whether selecting a City Corporation changes a subject's rules or not.
3. **Why this approach**: Implementing `docs/plans/one-city-one-truth-plan.md` in four sequential parts (1) applies amendment supersession to both parameter tables and governing provisions at the city level with automated CI overlap and band-continuity checks, (2) builds shared rules once for Greater Bengaluru (`in-ka-bengaluru`) and makes each of the five City Corporations a thin diff layer verified by text fidelity, structure, and CI parity checks, (3) removes all remaining old-design routes, redirects old addresses while preserving corporation selection, and enforces an old-design check in CI, and (4) states the land-use zone coverage gap plainly on the Map and Land use pages.

## What Changes

### Part 1 — "What applies today" Made True (City Level)

1. **Apply Supersession to Parameter Tables (`pipeline/bylaws/parameters.py`, `lib/plain-language.ts`, `app/j/[id]/topics/[topic]/page.tsx`)**:
   - In `pipeline/bylaws/parameters.py`, evaluate chronological supersession across in-force planning and municipal instruments so that whenever an in-force amendment substitutes, omits, or replaces a table or row (e.g., `rmp2015-zr-amend-2026-01` substituting Table 8 low-rise setbacks up to `12.0 m` and substituting the `Industrial (General)` plot-size/setback/coverage/FAR rows up to `500 m²` / `500–1000 m²` / `> 1000 m²` from `rmp2015-zr` Table 20):
     - Only the replacing record remains `legal_status: "in_force"` with `valid_to: null` and appears under **"What applies today"**.
     - The replaced record is marked `legal_status: "superseded"` with `valid_to` set to the replacing instrument's effective date (e.g. `"2026-01-20"`) and records its replacement provenance (`replaced_by_doc`, `replaced_by_title`, `replaced_by_date`, `replaced_by_parameter_id` in `notes` / `unexpressed_conditions` or schema-supported fields) so it moves to **"Older or replaced rules"**, ordered newest first, with the label:
       `"Replaced by [plain name], [date]"` (e.g., `"Replaced by Zoning Regulations Amendment (Setbacks, Basements and Industrial Norms), 20 January 2026"`).
2. **Apply Supersession to Governing Provisions (`pipeline/bylaws/amendments.py`, `pipeline/bylaws/consolidate.py`, `data/overrides/`, `app/j/[id]/topics/[topic]/page.tsx`)**:
   - Ensure all in-force zoning regulation amendments—specifically `rmp2015-zr-amend-2026-01` substituting `rmp2015-zr` Regulation `3.1(ii)`, `3.1(iii)`, `Table 8`, `Table 10 Note (b)` & `Note (c)`, and `Table 20` Industrial (General)—are linked and applied to `rmp2015-zr` node `versions` and `consolidated.json`.
   - On subject pages (`/j/[id]/topics/[topic]`), **"Governing provisions in force"** under **"What applies today"** MUST render the **consolidated current wording** (after applying in-force amendments) rather than the unamended 2007 base text, nor both the 2007 base node and the standalone amending clause as separate competing entries:
     - Display a small tag `"Changed [month year]"` (e.g., `"Changed January 2026"`).
     - Put the previous wording one tap away inside a `<details>` expander (`"Previous wording"` / `"Details"`).
     - Cite the amending notification and its page (`p. N` linking to the amending PDF page) when the current wording comes from an amendment.
3. **Remove Duplicate Rules (`pipeline/bylaws/parameters.py`, `app/j/[id]/topics/[topic]/page.tsx`)**:
   - Where a later amendment restates a rule with identical parameter values and conditions (specifically the 2009 Traffic and Transportation table in `rmp2015-zr-amend-2009-03` restating `rmp2015-zr` 2007 Table 22 FAR and ground coverage values `1.0` / `20%`, `1.25` / `25%`, `1.50` / `30%`), collapse/deduplicate so the rule appears **once** under **"What applies today"**, citing the **latest source** (`rmp2015-zr-amend-2009-03`) in the primary table and listing the earlier source(s) (`rmp2015-zr`, 25 June 2007, p. N) inside the row's `"Details"` expander.
4. **Overlap Check in CI (`pipeline/bylaws/parameters.py`, `pipeline/bylaws/validate.py`, `pipeline/tests/test_parameters.py`)**:
   - Implement a deterministic parameter overlap analyzer for each subject:
     - No two rows under **"What applies today"** may cover the same parameter/rule, zone/use, and overlapping numeric intervals (`plot_area_m2`, `road_width_m`, `building_height_m`, `plot_width_m`, `plot_depth_m`) with different values unless either:
       1. Resolved by statutory supersession (moving the older row to **"Older or replaced rules"**), OR
       2. Explicitly marked and rendered to the reader as `"Not settled: two rules apply"` showing both sources and values side by side.
     - Any unexplained overlap among governing in-force rows fails `bylaws validate` and CI (`pytest`).
5. **Band Continuity Check (`pipeline/bylaws/parameters.py`, `pipeline/bylaws/validate.py`, `app/j/[id]/topics/[topic]/page.tsx`)**:
   - Where a subject's governing rules use numeric ranges (`building_height_m`, `plot_area_m2`, `road_width_m`), compute and report gaps and overlaps between current in-force tables.
   - Specifically for **Setbacks** and **Height**: the January 2026 setback table (`Table 8`, `rmp2015-zr-amend-2026-01` p. 1) covers buildings up to `12.0 m` (`<= 12.0 m`), while the 2007 taller-building setback table (`Table 9`, `rmp2015-zr` p. 23) covers buildings `"Above 11.5 mtrs"` (`> 11.5 m`).
   - Never adjust a legal number; instead, record this current-text band overlap in the dataset/report and render a plain-language notice on the Setbacks (and Height) subject page under **"What applies today"**:
     `"Not settled: two rules apply — The current tables overlap between 11.5 m and 12 m"` citing both sources (`Zoning Regulations Amendment, 20 January 2026, p. 1` covering up to `12 m` and `Revised Master Plan 2015 Zoning Regulations, 25 June 2007, p. 23` Table 9 starting above `11.5 m`).
6. **Correct "Replaced" Labels (`app/j/[id]/topics/[topic]/page.tsx`, `lib/plain-language.ts`)**:
   - Enforce strict labelling rules in **"Older or replaced rules"**:
     - Only rules actually replaced by a later rule carry `"Replaced by [plain name], [date]"`.
     - **Bye-law `1.4` (`bbl-2003:part_I__sec_1.0__cl_1.4`) is NEVER placed in "Older or replaced rules" and NEVER labelled replaced**—it is the active governing incorporation rule in force since 28 October 2017.
     - **Definitions** (`type === "definition"` or clauses in definition sections `sec_2.0`, `chp_1__cl_1.2`) are NEVER labelled `"Replaced"` unless a later instrument specifically replaces that definition.
     - `bbl-2003` building parameter rules displaced on zoning-governed subjects via Bye-law `1.4` MUST be labelled:
       `"Master plan rules apply instead (bye-law 1.4)"` — never `"Replaced"`.
7. **Governing Provisions List Holds Only Governing Provisions (`app/j/[id]/topics/[topic]/page.tsx`, `pipeline/bylaws/annotations.py`)**:
   - Exclude definitions (`type === "definition"`, `sec_2.0`, `chp_1__cl_1.2`, except on the `Definitions` subject itself), tables of contents (`pref_TOC`, `toc`), prefaces/preambles/signature blocks, bare headings without substantive normative text, and unrelated provisions from **"Governing provisions in force"** (moving related non-governing provisions to **"Related provisions"** or excluding non-content nodes).
8. **Falsifiable Tests for Part 1 (`pipeline/tests/test_parameters.py`, `__tests__/`)**:
   - Write falsifiable tests verifying each review finding with expected values taken directly from the source pages:
     - Industrial (General) setbacks up to `500 m²` (`12%` front / `8%` rear / `8%` sides from `rmp2015-zr-amend-2026-01`, with `4.5 m` from 2007 moved to Older or replaced rules).
     - Setbacks clauses `3.1(ii)` and `3.1(iii)` showing their January 2026 substituted wording (`12.0 m` height threshold) under Governing provisions with `"Changed January 2026"` tag and 2007 wording in Details.
     - Height band continuity check detecting the `11.5 m` to `12.0 m` overlap between 2026 Table 8 and 2007 Table 9 and surfacing it plainly.
     - Traffic and Transportation FAR shown once under governing rules citing the 2009 amendment (`1.0`, `1.25`, `1.50`), with the 2007 source in Details.
     - Industrial (General) FAR shown only once per band under governing rules from the January 2026 notification, with 2007 rows moved to Older or replaced rules.
     - Bye-law `1.4` never labelled `"Replaced"`; `bbl-2003` displaced provisions labelled `"Master plan rules apply instead (bye-law 1.4)"`.

### Part 2 — One City Code, Corporations as a Thin Layer

1. **Single Source for Shared Rules (`pipeline/bylaws/publish.py`, `lib/data.ts`, `jurisdictions/`)**:
   - Build shared documents, parameters (`parameters.json`), consolidated snapshots of shared planning documents (`rmp2015-zr`), and shared provisions once at the Greater Bengaluru (`in-ka-bengaluru`) level.
   - Corporation datasets (`in-ka-bengaluru-central`, `-north`, `-south`, `-east`, `-west`) reference the shared Greater Bengaluru parent artifacts and store/layer only corporation-specific data (their own 2026 Building (Amendment) Bye-laws, corporation-scoped `bbl-2003` consolidation diffs, corporation-specific parameter records with `applies_in` / `jurisdiction`, and their official corporation boundary and wards).
2. **All Five Corporations' 2026 Amendments Verified to Equal Standard (`pipeline/bylaws/structure.py`, `pipeline/bylaws/fidelity.py`, `data/overrides/`, `jurisdictions/`)**:
   - Audit and clean all five corporations' May 2026 Building (Amendment) Bye-laws (`central`, `north`, `south`, `east`, `west` — Karnataka Gazette Part-III Nos. 371–375, effective `2026-05-14`) and draft notifications (`Nos. 253–257`, `2026-04-01`):
     - Every provision's text passes `verify_jurisdiction_text_fidelity` (`pipeline/bylaws/fidelity.py`) against its cited PDF page or a recorded page-image-verified `ocr_correction` / `unreadable_fragment`.
     - Zero editorial insertions inside legal text (all site explanations in `notes_by_site` / `summary_by_site`).
     - Structure rules enforced across all 5 corporations: no dates as clause numbers, no duplicate provisions, no runaway nesting (`depth <= 6`), clean plain titles.
3. **Subject Pages with a Corporation Selected (`app/j/[id]/topics/[topic]/page.tsx`)**:
   - When viewing `/j/[id]/topics/[topic]` for one of the five City Corporations (`jurisdiction.parent === "in-ka-bengaluru"`):
     - Render the exact same governing rules as the Greater Bengaluru city page, plus:
     - Directly under the page heading/summary: a clear plain line:
       `"Showing Greater Bengaluru rules, with differences for [corporation]."` (e.g., `"Showing Greater Bengaluru rules, with differences for Bengaluru South City Corporation."`).
     - Any parameter row or governing provision that differs in that corporation (sourced from an instrument whose scope is limited to that corporation, such as the May 2026 Corporation Building (Amendment) Bye-laws) is explicitly badged:
       `"In [corporation]: …"` with its source document and page link.
     - If nothing differs for that corporation on that subject (e.g., `FAR`, `Ground coverage`, `Setbacks`, `Height`, `Parking`, which are governed city-wide by the Master Plan Zoning Regulations): display a quiet, plain notice:
       `"No differences for [corporation] on this subject."`
4. **Document Pages with a Corporation Selected (`app/j/[id]/documents/[doc]/page.tsx`, `components/ClauseTree.tsx`, `pipeline/bylaws/consolidate.py`)**:
   - When viewing `bbl-2003` (or any document amended per corporation) with a City Corporation selected, display the corporation's consolidated wording where its 2026 amendment applies, marked `"Changed for [corporation], [date]"` (e.g., `"Changed for Bengaluru South City Corporation, 14 May 2026"`), with the original wording and amending gazette page link inside `"Details"`.
5. **Corporation Parity Check in CI (`pipeline/tests/test_pr12_greater_bengaluru.py`, `pipeline/bylaws/validate.py`)**:
   - Add an automated CI parity test across all five City Corporations (`in-ka-bengaluru-central`, `-north`, `-south`, `-east`, `-west`):
     - For any two corporations, the set of built pages/routes, subjects (`CODE_SUBJECTS` + extra topics), and shared documents MUST be identical.
     - Every difference in structured clauses, consolidated provisions, or parameter records between any two corporations MUST trace to an instrument whose `applies_in` / corporation scope applies only to one of them (or the documented Bengaluru South georeferenced land-use sheets). Any unexplained difference fails the build.

### Part 3 — One Site, One Design

1. **Remove Old Pages & Rebuild Corporation Views from Bylaw One Templates (`app/`, `components/`)**:
   - Remove legacy routes that still render previous-site layouts or components:
     - Delete `app/j/[id]/documents/[doc]/[eid]/page.tsx` (the old standalone provision page with `"1 · Version History"`, `"2 · Local Knowledge Graph & Accessible Connections"`, `"One-Hop Neighborhood Around"`, and `"topic:"` badges).
     - Delete `app/j/[id]/review/page.tsx` and `components/ReviewPanel.tsx` (the old `"Zoning Map & Layer Verification"` review page).
     - Delete `app/structure/page.tsx` (whose content now lives at `/about#how-this-is-built`).
     - Replace `app/j/[id]/clauses/page.tsx` and `app/j/[id]/documents/page.tsx` (or redirect them cleanly) so document browsing uses the Bylaw One templates (`/j/[id]/topics`, `/j/[id]/documents/[doc]`, `/j/[id]/sources`, `/j/[id]/timeline`) and never renders the old multi-document `ClauseTree` dump or `"Structured Documents"` header.
     - Ensure `components/ClausePanel.tsx` and `components/PlotCard.tsx` (if unused) cannot leak old labels (`"Statutory Resolution Cards"`, `"Local Graph →"`, `"topic:"`) into any built route.
   - Verify that every route under `/j/in-ka-bengaluru` and `/j/in-ka-bengaluru-{central,north,south,east,west}` renders from the exact same Bylaw One templates.
2. **Redirect Every Old Address (`next.config.ts`)**:
   - Configure permanent/clean redirects in `next.config.ts` (`redirects()`) so every old address resolves to its new Bylaw One equivalent while **preserving the corporation (`:id`)**:
     - `/structure` → `/about#how-this-is-built`
     - `/j/:id/structure` → `/about#how-this-is-built`
     - `/j/:id/review` → `/j/:id` (the corporation's Map page, which includes the sheet overlay control)
     - `/j/:id/documents/:doc/:eid` → `/j/:id/documents/:doc#node-:eid` (the provision anchor inside the Bylaw One document page)
     - `/j/:id/clauses` → `/j/:id/sources` (or clean Bylaw One documents index if linked, ensuring no old design renders)
     - Legacy topic slugs (e.g. `/j/:id/topics/building_height` → `/j/:id/topics/height`, `/j/:id/topics/ground_coverage` → `/j/:id/topics/ground-coverage`, `/j/:id/topics/land_use` → `/j/:id/topics/land-use`, `/j/:id/topics/basements_stilts` → `/j/:id/topics/basements-and-stilts`, `/j/:id/topics/projections_open_spaces` → `/j/:id/topics/projections-and-open-spaces`, `/j/:id/topics/approvals_certificates` → `/j/:id/topics/approvals-and-certificates`, `/j/:id/topics/fire_safety` → `/j/:id/topics/fire-safety`, `/j/:id/topics/plot_size_frontage` → `/j/:id/topics/plot-size-and-frontage`, `/j/:id/topics/road_width` → `/j/:id/topics/road-width`, `/j/:id/topics/deviations_regularisation` → `/j/:id/topics/deviations-and-compounding`) so bookmarks to underscore topic IDs redirect to canonical hyphenated subject slugs.
3. **Old-Design Check in CI (`pipeline/tests/test_release_and_copy_consistency.py`, `scripts/check_page_budgets.mjs`)**:
   - Scan every built HTML file under `.next/server/app/` across city and all five corporations and fail CI if any built page contains old-design markers:
     - `"Structured Building Bylaws"` (outside licence attribution on `/about` or `/data` if needed—or use `"Bylaw One"` everywhere in UI titles/headers)
     - `"Statutory Resolution Cards"`
     - `"Local Graph"` / `"Local Knowledge Graph"` / `"One-Hop Neighborhood"`
     - `"Zoning Map Review"` / `"Zoning Map & Layer Verification"`
     - `"topic:"`
   - Run text fidelity, structure, and primary-layer language checks over **every** built page and **every** jurisdiction (`in-ka-bengaluru` and all 5 City Corporations).

### Part 4 — Map and Gaps Stated Plainly

1. **Map and Land Use Plain Zone-Gap Notice (`app/j/[id]/page.tsx`, `components/AreaExplorerClient.tsx`, `app/j/[id]/topics/[topic]/page.tsx`, `lib/plain-language.ts`)**:
   - Ensure the Map (`/j/[id]`) displays boundaries and wards for all five City Corporations and land-use zones where processed (the four sheets in parts of Bengaluru South).
   - Display the exact plain sentence on both the **Map** page (`/j/[id]`) and the **Land use** subject page (`/j/[id]/topics/land-use`):
     `"Land-use zones are available for parts of Bengaluru South only. Elsewhere the map shows boundaries and wards."`
   - Ensure gap notices appear **only** where a gap can change what a page shows (omitting irrelevant notices from unaffected subjects and documents).

### Pull Request, Progress Tracking & Visual Verification

- Open/maintain one draft PR with the preview URL at the top.
- Commit and push after each part (Part 1, Part 2, Part 3, Part 4); keep `docs/progress.md` current after each part.
- Keep the PR description updated with:
  - Progress per part
  - **For owner review**: any `"Not settled"` overlaps and band gaps found in the current texts (e.g., `11.5 m`–`12.0 m` setback table height band overlap); any corporation difference flagged by the parity check; any redirects that could not map one-to-one
  - **Decisions made**
  - **Known gaps**
  - **Counts**: rows moved to replaced, duplicates removed, overlaps resolved or shown as not settled, old routes removed, redirects added
  - **Screenshots**: Setbacks and FAR at city level (`/j/in-ka-bengaluru/topics/setbacks`, `/j/in-ka-bengaluru/topics/far`) and for one corporation (`/j/in-ka-bengaluru-south/topics/setbacks`, `/j/in-ka-bengaluru-south/topics/far`) at `390 px` and `1280 px`.

## Affected Memory

- `architecture/overview`: (modify) Document city-level table and provision supersession, duplicate collapsing, CI parameter overlap and band continuity checks, correct `"Replaced"` vs `"Master plan rules apply instead (bye-law 1.4)"` labels, single-source Greater Bengaluru code with thin City Corporation diff layers, 5-corporation 2026 amendment fidelity/structure/parity checks, removal and redirection of legacy routes, CI old-design check, and plain land-use zone gap notice on Map and Land use.
- `schemas/data-contracts`: (modify) Document parameter supersession metadata, band continuity/overlap reporting, and parent-shared vs corporation-diff artifact contracts across `in-ka-bengaluru` and the five child City Corporations.

## Impact

- **Python Pipeline (`pipeline/bylaws/`)**:
  - `pipeline/bylaws/parameters.py`: Table and row supersession between base regulations (`rmp2015-zr`) and in-force amendments (`rmp2015-zr-amend-2009-03`, `rmp2015-zr-amend-2026-01`, etc.), duplicate collapsing for identical restated rows (Traffic and Transportation 2009 vs 2007), parameter overlap detector, and numeric band continuity checker (`building_height_m`, `plot_area_m2`, `road_width_m`).
  - `pipeline/bylaws/amendments.py` & `pipeline/bylaws/consolidate.py`: Complete amendment links/effects for `rmp2015-zr` (`3.1(ii)`, `3.1(iii)`, `Table 8`, `Table 20`, etc.) and all 5 corporations' 2026 `bbl-2003` amendments; change marks formatted as `"Changed [month year]"` at city level and `"Changed for [corporation], [date]"` on corporation document views.
  - `pipeline/bylaws/fidelity.py`, `pipeline/bylaws/structure.py`, `pipeline/bylaws/validate.py`, `pipeline/bylaws/publish.py`: Run text fidelity, structure checks, parameter overlap/band checks, and corporation parity checks across `in-ka-bengaluru` and all 5 City Corporations; publish single-source shared artifacts in `in-ka-bengaluru` with thin corporation layers.
- **Data Configurations & Overrides (`jurisdictions/`, `data/overrides/`)**:
  - `jurisdictions/in-ka-bengaluru*.yaml` and `data/overrides/in-ka-bengaluru*/overrides.yaml`: Ensure `rmp2015-zr` amendment links (`3.1(ii)`, `3.1(iii)`, etc.) and any OCR/table fixes for the 5 corporations' 2026 amendments are declaratively recorded and pass 100% text fidelity.
- **Next.js Web Application (`app/`, `components/`, `lib/`, `next.config.ts`)**:
  - `app/j/[id]/topics/[topic]/page.tsx`: Render consolidated current wording for governing provisions with `"Changed [month year]"` and previous wording in Details; display only current parameter rows in `"What applies today"` and move superseded rows to `"Older or replaced rules"` with `"Replaced by [plain name], [date]"`; surface current-text band overlaps (`11.5 m` to `12 m`) plainly; fix `"Replaced"` vs `"Master plan rules apply instead (bye-law 1.4)"` labels and never place Bye-law `1.4` in replaced rules; exclude definitions/TOCs/headings from governing lists; add corporation diff banner (`"Showing Greater Bengaluru rules, with differences for [corporation]"` / `"No differences for [corporation] on this subject"`) and `"In [corporation]: …"` badges; show the plain land-use zone gap line on `Land use`.
  - `app/j/[id]/documents/[doc]/page.tsx` & `components/ClauseTree.tsx`: Show consolidated corporation wording with `"Changed for [corporation], [date]"` when a corporation is selected.
  - `app/j/[id]/page.tsx` & `components/AreaExplorerClient.tsx`: State `"Land-use zones are available for parts of Bengaluru South only. Elsewhere the map shows boundaries and wards."` plainly on the Map page.
  - `next.config.ts` & route cleanup: Remove `app/j/[id]/documents/[doc]/[eid]/page.tsx`, `app/j/[id]/review/page.tsx`, `components/ReviewPanel.tsx`, and `app/structure/page.tsx`; configure redirects for all old addresses preserving corporation selection.
- **CI & Test Suites (`pipeline/tests/`, `__tests__/`, `e2e/`, `scripts/check_page_budgets.mjs`)**:
  - `pipeline/tests/test_parameters.py`, `pipeline/tests/test_text_fidelity.py`, `pipeline/tests/test_pr12_greater_bengaluru.py`, `pipeline/tests/test_release_and_copy_consistency.py`, `__tests__/`, `e2e/`: Falsifiable tests for all Part 1–4 cases, CI overlap check, band continuity check, 5-corporation fidelity/structure/parity checks, redirect checks, and old-design HTML check.

## Open Questions

None — `docs/plans/one-city-one-truth-plan.md` is self-contained and specifies all product, legal-traceability, architectural, and verification requirements.

## Assumptions

| # | Grade | Decision | Rationale | Scores |
|---|-------|----------|-----------|--------|
| 1 | Certain | Apply supersession to parameter tables and governing provisions at city level so `"What applies today"` shows only current in-force table rows and consolidated provision wording (with `"Changed [month year]"` tag, amending citation/page, and previous wording in Details), while superseded rows and provisions move to `"Older or replaced rules"` (newest first) labelled `"Replaced by [plain name], [date]"` | Explicitly specified in `docs/plans/one-city-one-truth-plan.md` §5 Part 1.1–1.2 and §7 | S:100 R:90 A:95 D:100 |
| 2 | Certain | Collapse duplicate parameter rows where a later amendment restates identical values (such as the 2009 Traffic and Transportation table restating the 2007 table) into a single row under `"What applies today"` citing the latest source and listing earlier sources in Details | Explicitly specified in `docs/plans/one-city-one-truth-plan.md` §2, §5 Part 1.3, and §7 | S:100 R:95 A:95 D:100 |
| 3 | Certain | Enforce parameter overlap and band continuity checks in CI; where the current official texts themselves overlap (specifically the 2026 setback table up to 12 m vs the 2007 taller-building Table 9 starting above 11.5 m), never adjust any number and display the overlap plainly to the reader with both sources | Explicitly specified in `docs/plans/one-city-one-truth-plan.md` §2, §4, §5 Part 1.4–1.5, and §7 | S:100 R:90 A:95 D:100 |
| 4 | Certain | Never place Bye-law 1.4 in `"Older or replaced rules"` or label it `"Replaced"`; label `bbl-2003` rules displaced by Bye-law 1.4 as `"Master plan rules apply instead (bye-law 1.4)"`; label definitions as replaced only when a later instrument replaces that definition; and exclude definitions, tables of contents, and bare headings from governing provision lists | Explicitly specified in `docs/plans/one-city-one-truth-plan.md` §2, §5 Part 1.6–1.7, and §7 | S:100 R:95 A:95 D:100 |
| 5 | Certain | Build shared rules once at the Greater Bengaluru (`in-ka-bengaluru`) level and make each of the five City Corporations a thin layer containing only its own in-force differences (its 2026 bye-law amendment, boundary, and wards), displaying `"Showing Greater Bengaluru rules, with differences for [corporation]"`, `"In [corporation]: …"` on differing rows/provisions, `"No differences for [corporation] on this subject."` when identical, and `"Changed for [corporation], [date]"` on consolidated corporation document views | Explicitly specified in `docs/plans/one-city-one-truth-plan.md` §3 Decisions 1–3, §5 Part 2.1–2.4, and §7 | S:100 R:90 A:95 D:100 |
| 6 | Certain | Check all five corporations' 2026 amendments to the same text-fidelity and structure standard and enforce a CI parity check ensuring identical page/subject/shared-document sets across all five corporations with every content difference traced to a corporation-specific instrument | Explicitly specified in `docs/plans/one-city-one-truth-plan.md` §3 Decision 5, §5 Part 2.5–2.6, and §7 | S:100 R:90 A:95 D:100 |
| 7 | Certain | Delete all remaining old-design routes (`/j/[id]/documents/[doc]/[eid]`, `/j/[id]/review`, `/structure`, and legacy multi-document clause dumps), rebuild all corporation views from the Bylaw One templates, redirect all old addresses in `next.config.ts` preserving corporation choice, and enforce a CI old-design check rejecting `"Structured Building Bylaws"`, `"Statutory Resolution Cards"`, `"Local Graph"`, and `"topic:"` | Explicitly specified in `docs/plans/one-city-one-truth-plan.md` §2, §3 Decision 4, §5 Part 3.1–3.5, and §7 | S:100 R:90 A:95 D:100 |
| 8 | Certain | Display the exact plain line `"Land-use zones are available for parts of Bengaluru South only. Elsewhere the map shows boundaries and wards."` on the Map and Land use subject pages, and show gap notices only where a gap can affect what a page shows | Explicitly specified in `docs/plans/one-city-one-truth-plan.md` §3 Decision 6, §5 Part 4, and §7 | S:100 R:95 A:95 D:100 |

8 assumptions (8 certain, 0 confident, 0 tentative, 0 unresolved).
