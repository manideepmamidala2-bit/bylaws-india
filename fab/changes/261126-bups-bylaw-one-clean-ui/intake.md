# Intake: Bylaw One: Clean Interface and New Home Page

**Change**: 261126-bups-bylaw-one-clean-ui
**Created**: 2026-11-26

## Origin

> Implement docs/plans/bylaw-one-clean-ui-plan.md: open one draft PR with the preview URL at the top; rename the site to Bylaw One with the descriptor "Bengaluru's building rules. One code."; apply the dg2n style (tokens, two-part headlines, numbered sections, honest labels, one coral accent never used for text); rebuild the home page with no map and no plot inputs: hero, 01 the problem, 02 a five-step FAR story (2004, 2007, 2017, 2025, today) with verbatim excerpts and page links that pass the fidelity check, 03 the code by subject, 04 recent changes, FAQ and closing line; cut the header to The code, What changed and About with everything else in the footer; make subject pages open with what applies today as clean tables with units and conditions in words, older and related rules collapsed; clean document pages with details on tap and only relevant gap notices; newest first on What changed and Sources; remove plot features from view while keeping the resolver in the repository; add plausibility bounds, the hectare fix and reclassification of non-FAR rows so no implausible value is displayed; design for phones first; keep accessibility, page budgets, language and browser checks in CI; commit and push as you go, keep docs/progress.md current and the PR's "For owner review", "Decisions made" and "Known gaps" sections up to date; never invent or rewrite legal text.

One-shot invocation referencing the self-contained specification in `docs/plans/bylaw-one-clean-ui-plan.md` (dated 26 November 2026), based on the status review of 26 November 2026 and the owner's design decisions.

## Why

1. **Problem**: While the underlying dataset and statutory resolution engine consolidate Bengaluru's building bye-laws, master plan zoning regulations, amendments, corporation notices, and state statutes, the current web interface leads with an interactive map and plot calculator that obscure the core value of the project—joining scattered instruments into **one readable, traceable code**—and surface several parameter table misreads in the UI:
   - **Identity and focus**: The site is still titled `"Structured Building Bylaws"` rather than **Bylaw One** (`"Bengaluru's building rules. One code."`), and the home page opens with a full-bleed map and plot input form instead of explaining *why* one consolidated code matters through a concrete statutory story.
   - **Navigation clutter**: The top header exposes up to 9 links (`Map`, `Sources`, `Documents`, `Rules by subject`, `Timeline`, `Review`, `Structure`, `Data`, `About`), competing for attention on mobile and desktop.
   - **Parameter table presentation & implausible values**: Subject pages and tables can surface raw row strings (`"2 | Above 15 mup to 18.0m"`), unit conversion errors (`"Upto 0.40 Hectares"` parsed as `0.4 m²` instead of `4,000 m²`), non-FAR numbers misclassified as `far_base_max` / `far_premium_additional_max` (deviation tolerances, compounding-fee percentages/rates, and premium FAR price/rate rows), and out-of-range values without plausibility bounds.
   - **Irrelevant gap notices and plot UI noise**: In-force document pages still display notices about the unobtained 4 March 2026 South draft notification even though drafts never apply; plot calculator cards and inputs appear across pages where they were decided to be removed from view for this round.
2. **Consequence of not fixing**: Readers landing on the site do not immediately grasp how Bengaluru's overlapping instruments fit together, encounter implausible numbers or raw OCR row headers in parameter tables, and face a crowded navigation bar on phones.
3. **Why this approach**: Implementing `docs/plans/bylaw-one-clean-ui-plan.md` renames the product to **Bylaw One**, applies the calm `dg2n.com` editorial idiom (two-part headlines, numbered sections `01`–`04`, step-by-step storytelling, honest attribution labels, and a single `#ff6b52` coral accent never used as text color), replaces the map-first home page with a single-scroll narrative anchored by a five-step verbatim FAR story (`2004`, `2007`, `2017`, `2025`, `Today`), simplifies the header to three items (`The code`, `What changed`, `About`) with secondary links in the footer, removes plot inputs/cards from the UI while retaining `resolver.py` and `lib/resolver.ts` and their tests in the repository, and enforces parameter plausibility bounds, hectare-to-`m²` conversion, and non-FAR row reclassification in `pipeline/bylaws/parameters.py` before any table value reaches the UI.

## What Changes

### 1. Minimum Data Fixes (`pipeline/bylaws/parameters.py`, `schemas/parameters.schema.json`, `data/reports/`)

Before subject pages and the home FAR story display table values, update parameter extraction and validation so nothing wrong or implausible is displayed:
1. **Plausibility Bounds per Parameter Kind**:
   - Define explicit plausibility bounds per parameter kind in `pipeline/bylaws/parameters.py` (and shared TypeScript helper in `lib/plain-language.ts` as defense-in-depth):
     - `far_base_max`: `0.25` to `5.0`
     - `far_premium_additional_max`: `0.05` to `2.0` (or fraction/percentage converted to FAR delta / bounded `<= 5.0`)
     - `tdr_receivable_max`: `0.05` to `2.0`
     - `ground_coverage_max_pct`: `5.0` to `100.0` (`%`)
     - `setback_front_min_m`, `setback_rear_min_m`, `setback_side_min_m`: `0.0` to `30.0` (`m`) or `1.0` to `50.0` (`%` when expressed as percentage of plot depth/width)
     - `building_height_max_m`: `3.0` to `250.0` (`m`)
     - `floors_max`: `1` to `60` (`floors`)
   - Any extracted numeric record falling outside its parameter plausibility bounds is flagged (`plausibility_excluded` / omitted from displayed governing tables) and written to a machine-generated owner review report (`data/reports/<jurisdiction>/parameter-mismatches.md` and surfaced in the PR's **For owner review** section) so no out-of-bounds value is ever displayed.
2. **Hectare Conversion Fix**:
   - In `pipeline/bylaws/parameters.py` (`parse_numeric_interval` and plot area extraction), detect `"hectare"` / `"hectares"` / `"ha"` unit tokens on interval bounds (such as `"Upto 0.40 Hectares"`, `"Above 0.40 Hectares up to 1.0 Hectare"`) and multiply numeric bounds by `10,000` to normalize to `m²` (`0.40 Hectares` → `4000.0 m²`).
3. **Reclassify Non-FAR Rows**:
   - In `pipeline/bylaws/parameters.py`, prevent deviation tolerance rows, compounding-fee rate rows, and premium FAR price/fee rate rows (e.g., guidance value percentages or rupee/rate schedules) from being classified as `far_base_max` or `far_premium_additional_max`. Either exclude them from building envelope FAR parameters or classify them accurately so they never pollute FAR tables.
4. **Parking Values as Text When Sentences**:
   - Ensure `parking_requirement` records whose cells contain prose sentences or multi-condition ratios (e.g., `"1 car park per 100 sq.m of floor area..."`) store `value: null` (or sentence in `value_text`) and are rendered as clean prose text rather than misleading bare numbers.
5. **Falsifiable Unit Tests**:
   - Add unit tests in `pipeline/tests/test_parameters_and_relations.py` and `__tests__/` verifying the plausibility bounds, hectare-to-`m²` conversion (`0.40 Hectares` → `4000 m²`), non-FAR row exclusion/reclassification, and sentence parking values against source tables, and re-publish affected `parameters.json` artifacts.

### 2. Rename to Bylaw One & dg2n Visual Style (`app/layout.tsx`, `app/globals.css`, `public/`, `docs/`)

1. **Site Rename ("Bylaw One")**:
   - Update `app/layout.tsx` metadata (`title: "Bylaw One"`, `description: "Bengaluru's building rules. One code."`, Open Graph `title` and `description`), header wordmark (`Bylaw One` in `Inter Tight`), page titles across routes, and add a clean SVG/ICO favicon (`app/icon.svg` / `public/favicon.svg` — a simple mark in `#080909` ink on `#f5f3ed` paper).
   - Keep the current repository and domain name; record in `docs/` (`docs/progress.md` / `docs/decisions/`) that a domain and trademark check for "Bylaw One" is pending.
2. **dg2n Design Tokens & Typography (`app/globals.css`, `app/layout.tsx`)**:
   - Enforce exact tokens:
     - Paper / panel: `#f5f3ed` / `#efeee8`
     - Ink / muted: `#080909` / `#5b5e56`
     - Hairline: `#c8ccc0`
     - Accent: `#ff6b52` (used only for the current selection or active step indicator — **never for text color**)
   - Fonts loaded via `next/font/local`: `Inter Tight` (display, tight letter-spacing), `Source Serif 4` (reading legal text, 65–75ch measure), `JetBrains Mono` (small-capitals labels).
   - No cards, no drop shadows, square corners (`border-radius: 0`), hairline rules (`1px solid #c8ccc0`) between sections, generous vertical spacing, and three clear typographic scales on any page (`display`, `body`, `label`). All text meets WCAG AA contrast.
3. **Strict Language Rules & CI Language Gate**:
   - Primary layer contains zero internal IDs (`bbl-2003`, `rmp2015-zr`, `sec_1.0`, `in-ka-bengaluru-south`), zero enum names (`in_force`, `state_rules`, `far_base_max`), zero schema/release internals (`Schema 1.4`, `PR 11`), and zero raw unit tokens (`sq_m`, `pct`, `m2`).
   - Units formatted as `m`, `m²`, `%`.
   - Statuses in plain words: `"In force since 14 May 2026"`, `"Draft, not in force"`, `"Replaced in January 2026"`.
   - Page introductions at most two sentences.
   - Technical details (addresses/`eid`s, retrieval records, SHA-256 checksums, Wayback archive links, verification states) strictly inside `<details>` (`"Details"`) expanders, closed by default.
   - Update CI language check (`pipeline/tests/test_release_and_copy_consistency.py` / `scripts/`) to parse built HTML and fail if any text outside `<details>` contains internal ID patterns, enum names, or raw unit tokens like `sq_m`.

### 3. Site Structure: Header, Footer, Corporation Selector, and Route Map (`components/TopNav.tsx`, `components/Footer.tsx`, `app/`)

1. **Header (`components/TopNav.tsx`)**:
   - Wordmark `"Bylaw One"` (in `Inter Tight`) on the left.
   - Exactly three navigation items:
     - **The code** (`/j/[id]/topics`)
     - **What changed** (`/j/[id]/timeline`)
     - **About** (`/about`)
   - A search icon/trigger opening cross-document Pagefind search (`components/SearchBar.tsx`).
   - Phone-first (`390 px`): header collapses cleanly to the `"Bylaw One"` wordmark, a search icon button (`>= 44 px` tap target), and a menu button (`>= 44 px` tap target) toggling the three nav links.
2. **Footer (`components/Footer.tsx`)**:
   - Links to: **Sources** (`/j/[id]/sources`), **Map** (`/j/[id]`), **Data and downloads** (`/data`), **Licence** (`/about#licence`), **How this is built** (`/about#how-this-is-built`).
   - Short disclaimer line: `"Worked out from the official documents. Not an official publication."`
3. **Quiet Corporation Selector**:
   - On subject and document pages, show a small, quiet selector (`"Showing: Greater Bengaluru · Change"` or `"Showing: Bengaluru South City Corporation · Change"`), defaulting to Greater Bengaluru (`in-ka-bengaluru`) for shared rules and allowing switching to any of the five City Corporations.
4. **Removed / Relocated Navigation Items**:
   - Remove `Review`, `Structure`, and `Data` from the top header; fold `"Structure"` content into `/about#how-this-is-built` (keep `/structure` redirecting or rendering cleanly with the new chrome), and link `Sources`, `Map`, and `Data and downloads` from the footer.

### 4. Rebuilt Home Page (`app/page.tsx`, `components/FarStoryStepper.tsx`)

Rebuild `app/page.tsx` as a calm, phone-first single-scroll narrative with **no map and no plot inputs**:
1. **Hero**:
   - Two-part display heading: **`Bengaluru's building rules. One code.`**
   - Subline computed dynamically from dataset state (never hardcoded): `"[N] official documents from [M] bodies, joined into one readable code. Every rule traced to its page."` (where `N` = count of in-force official instruments and `M` = count of distinct issuing bodies).
   - Buttons: **Read the code** (primary, links to `/j/in-ka-bengaluru/topics`), **What changed recently** (secondary, links to `/j/in-ka-bengaluru/timeline`).
   - No map, no extra stat counters, no release number badge.
2. **`01 / The problem`**:
   - Heading: **`Many sources. One building.`**
   - At most two short sentences: the rules for one building sit in bye-laws, master plan regulations, amendments, corporation notices and state law; they overlap and sometimes disagree.
   - A quiet SVG/HTML illustration showing the official documents (as titled lines, newest first) converging into one code, explicitly labelled `"Illustration"`.
3. **`02 / Follow one rule: FAR`**:
   - A five-step explainer (`Step 1 / 5` through `Step 5 / 5`) with step counter, previous/next controls, active step indicator using the `#ff6b52` coral accent (as a bar/dot/border, never text color), keyboard navigation, and reduced-motion support:
     - **Step 1 — `2004. The bye-laws set FAR.`**: The Building Bye-laws 2003 (in operation from 5 June 2004) set FAR in their own tables (bye-law 9.2, Tables 4 to 6).
     - **Step 2 — `2007. The master plan sets FAR by zone.`**: The RMP 2015 Zoning Regulations set FAR by zone, plot size and road width (Chapter 4, Table 1 / Table 10 residential/commercial FAR).
     - **Step 3 — `2017. The bye-laws hand FAR to the master plan.`**: Bye-law 1.4, from notification UDD 14 TTP 2017, makes the master plan rules govern use, coverage, FAR, setbacks, height, floors, dwelling units and parking.
     - **Step 4 — `2025. Premium FAR is added.`**: The premium FAR chapter (Chapter 11, notified 2 April 2025) allows extra FAR on payment, by road width.
     - **Step 5 — `Today. What applies.`**: Base FAR from the zoning table, with premium FAR and TDR on top, each from its own source.
   - Each step displays:
     - One plain sentence labelled `"In short, by this site"`.
     - A short excerpt quoted **verbatim** from the structured data, labelled `"From the official text"`, with plain document name, date, and a working `"View page"` PDF page link (or if any step's source text cannot be found verbatim in the held data, states so plainly instead of paraphrasing as a quote). Every quoted excerpt is verified by `pipeline/tests/test_text_fidelity.py`.
     - Where useful (Steps 1, 2, 4, 5), a small clean table from the existing structured/parameter table data (values with units, conditions in words, zero implausible values).
   - Works without JavaScript as a semantic `<ol>` of all five steps; on phones (`390 px`), steps stack vertically with clear step numbers.
4. **`03 / The code, by subject`**:
   - Heading: **`The code, by subject.`**
   - A clean hairline-divided list (not cards) of the 11 subjects:
     1. Land use (includes a link to the Map alongside the subject page)
     2. Ground coverage
     3. FAR
     4. Setbacks
     5. Height
     6. Parking
     7. Basements and stilts
     8. Projections and open spaces
     9. Approvals and certificates
     10. Fire safety
     11. Definitions
   - Each row has the subject title, one plain sentence explaining what it covers, and a link to its subject page.
5. **`04 / Recently changed`**:
   - Heading: **`What changed recently.`**
   - The newest 3 to 5 in-force instruments: date, plain title, one-line `"what changed"` summary labelled `"In short, by this site"`, and link to the document. Any draft shown is explicitly badged `"Draft, not in force"`.
   - Link: `"All changes"` → What changed page.
6. **`Questions people ask` (FAQ)**:
   - Four expandable `<details>` items:
     - *Is this official?* (No; it is worked out from official documents, each linked.)
     - *Where does the text come from?* (Official PDFs and gazettes; archived copies kept.)
     - *What happens when rules disagree?* (The site applies a stated order and shows both rules; one line on bye-law 1.4.)
     - *What is missing?* (Generated from `declarations.json` in plain words, only gaps that matter.)
7. **Closing**:
   - Line: **`Read. Trace. Compare.`**
   - Button: **Read the code**.

### 5. The Code: Subject Index and Subject Pages (`app/j/[id]/topics/page.tsx`, `app/j/[id]/topics/[topic]/page.tsx`)

1. **Subject Index (`/j/[id]/topics`)**:
   - Heading **`The code, by subject.`** with at most two sentences of introduction and the quiet corporation selector.
   - Clean list of the 11 subjects (`Land use`, `Ground coverage`, `FAR`, `Setbacks`, `Height`, `Parking`, `Basements and stilts`, `Projections and open spaces`, `Approvals and certificates`, `Fire safety`, `Definitions`) with one plain line each; `Land use` also links to the Map page.
2. **Subject Page (`/j/[id]/topics/[topic]`)**:
   - Ordered strictly as:
     1. **Heading and one plain sentence** on what the subject covers, plus the quiet corporation selector.
     2. **What applies today**: the governing in-force provisions and, where `parameters.json` / structured tables hold them, their values as a clean table:
        - One row per distinct rule (deduplicated; no duplicate tiles).
        - Conditions written in plain words (`"Plots above 360 up to 1,000 m², roads above 12 up to 18 m"`), formatted by a dedicated helper in `lib/plain-language.ts`.
        - Values formatted with normal units (`m`, `m²`, `%`), filtered by plausibility bounds.
        - Source document name and small `"p. 12"` page link on each row.
        - No raw row text (`"2 | Above 15 mup to 18.0m"`) in the primary table—raw source cell/row text is placed inside a per-row or section `"Details"` expander.
     3. **Why this rule applies**: one plain line (e.g. `"Bye-law 1.4 hands FAR to the master plan regulations"`), expandable via `<details>` to show the quoted statutory authority and resolution step.
     4. **Older or replaced rules**: collapsed `<details>` (`data-testid="older-or-replaced-rules"`), ordered newest first.
     5. **Related provisions**: collapsed `<details>` (`data-testid="related-provisions"`). Definitions, tables of contents, and bare headings never appear above the fold.
     6. **Gap note**: shown **only** if a known gap in `declarations.json` can affect that specific subject (e.g. the July 2025 zoning amendment that was not obtained); omitted otherwise.
   - Zero plot inputs or plot calculators on subject pages.

### 6. Document Page, What Changed, Sources, Map, and About (`app/j/[id]/documents/`, `app/j/[id]/clauses/`, `app/j/[id]/timeline/`, `app/j/[id]/sources/`, `app/j/[id]/page.tsx`, `app/about/page.tsx`)

1. **Document Page (`/j/[id]/documents/[doc]` and `/j/[id]/clauses`)**:
   - Header: plain title, issuing body, date, one plain-word status line (`"In force since 14 May 2026"`), direct link to the official PDF, and archive link inside `"Details"`.
   - Body: provisions in the law's own order (`1.0, 1.1, 1.2…`), showing provision number and verbatim text only in the primary view. Changes shown as a small tag (`"Changed in 2026"`) opening the amendment details.
   - Tap a provision (`<details>`): reveals `"Details"` with PDF page link, archive link, version history (newest first), site notes (`"In short, by this site"` / `"Note by this site"`), OCR correction info, cross-references, and technical address (`eid`).
   - Chapter outline for navigation; chapters load on demand (`ClauseTree.tsx`).
   - Gap notices: show **only** gaps that affect this document's in-force text. Remove the notice about the 4 March 2026 South draft notification from in-force documents, since drafts never apply.
   - Instruments whose full text is not held (`structured: false` or `reference_only` or `not_found`) never render a `"Read provisions"` link.
2. **What Changed (`/j/[id]/timeline`)**:
   - Heading: **`What changed`**, at most two sentences of introduction.
   - Ordered newest first: date, plain title, instrument type in words (`"Amendment"`, `"Notification"`, `"Order"`, `"Act"`), one line on what changed (labelled `"In short, by this site"`), and link to the document.
   - Interactive client filter by type (`All`, `Amendment`, `Notification`, `Order`, `Act`) and by corporation.
3. **Sources (`/j/[id]/sources`)**:
   - Ordered newest first; plain names and plain-word statuses in the primary layer; all technical fields (SHA-256, retrieval timestamps, Wayback URLs, byte counts, internal doc IDs) inside `"Details"`.
4. **Map (`/j/[id]`)**:
   - Standalone page titled **`Map`**, linked from the footer and from the `Land use` subject page, with a clear link back to **The code**.
   - Preserves the Protomaps light map and layer controls (`ZoneMap.tsx`, `AreaExplorerClient.tsx`), but **removes plot inputs and plot answers** from the map's panel: clicking a location or selecting a place/ward shows **area, ward, corporation, and zone only**.
5. **About (`/about`)**:
   - Explains what Bylaw One is, how it is built (incorporating the former `/structure` explanation under `#how-this-is-built`), how disagreements between instruments are handled (with bye-law 1.4 and the resolution order), verification (stating plainly that all checks are machine checks, never human-verified), licences (`#licence` — Apache-2.0 for code, CC BY 4.0 for data), and the full FAQ.

### 7. Removing Plot Features from View While Keeping Resolver in Repo

1. Remove `<PlotCard />`, plot area/road width inputs, and resolved plot parameter cards from Home (`/`), Map (`/j/[id]`), Subject pages, and any other UI views, and remove any copy promising plot-specific answers.
2. Keep `pipeline/bylaws/resolver.py`, `lib/resolver.ts`, `jurisdictions/resolution.yaml`, `parameters.json`, `pipeline/tests/test_resolver.py`, and `__tests__/resolver.test.ts` intact and passing in the repository.

### 8. Phone-First Layout, Quality Gates, Browser Tests, and Draft PR Workflow

1. **Phone-First (`390 px` first, then `1280 px`)**:
   - Responsive layout designed for `390 px` viewport width first: collapsible header menu, vertically stacked FAR story steps, clean horizontally scrollable or stacked parameter tables, and tap targets `>= 44 px × 44 px`.
2. **Quality & CI Gates**:
   - `axe-core` WCAG AA accessibility checks pass on every page; keyboard navigation works for the FAR story stepper and all `<details>` expanders.
   - Page budgets enforced (`scripts/check_page_budgets.mjs`): HTML per page `<= 300 KB`; initial JS + data `<= 1.5 MB` uncompressed.
   - Language check in CI (`pipeline/tests/test_release_and_copy_consistency.py`): built pages fail if they contain internal ID patterns, enum names, or raw unit tokens (`sq_m`) outside `<details>` expanders.
   - Fidelity check (`pipeline/tests/test_text_fidelity.py`): covers every quoted excerpt in the 5-step FAR story on the home page in addition to all structured and consolidated provisions.
   - Playwright browser tests in CI (`e2e/`):
     - Home renders the 5 FAR steps with verbatim excerpts and working page links, with no map and no plot inputs.
     - A subject page (e.g. FAR or Setbacks) shows a clean `"What applies today"` table with units and conditions in words.
     - A document page expands a provision on tap to reveal Details.
     - No plot inputs appear anywhere on Home, Map, Subject, or Document pages.
3. **Incremental Git & PR Workflow**:
   - Open one draft PR with the preview URL at the top.
   - Commit and push after each logical section of work; keep `docs/progress.md` current and update the PR description's **For owner review**, **Decisions made**, and **Known gaps** sections continuously.

## Affected Memory

- `architecture/overview`: (modify) Update system overview and web application architecture from map-first/plot-card UI to the **Bylaw One** clean interface (`dg2n` style, narrative home page with 5-step verbatim FAR story, 3-item header + footer navigation, subject pages opening with clean `"What applies today"` tables, map moved off home with plot inputs hidden from view while retaining the resolver in repo, and parameter plausibility bounds / hectare fix / non-FAR reclassification).
- `schemas/data-contracts`: (modify) Document parameter plausibility bounds, hectare normalization, non-FAR row reclassification, and home FAR excerpt fidelity verification.

## Impact

- **Python Pipeline (`pipeline/bylaws/parameters.py`, `pipeline/bylaws/validate.py`, `pipeline/tests/`)**:
  - `parameters.py`: Plausibility bounds filter per parameter type, hectare-to-`m²` unit conversion in `parse_numeric_interval`, exclusion/reclassification of deviation tolerance / compounding fee / premium FAR rate rows from FAR parameter records, and prose handling for sentence-valued parking rows.
  - `pipeline/tests/test_parameters_and_relations.py`, `pipeline/tests/test_text_fidelity.py`, `pipeline/tests/test_release_and_copy_consistency.py`: Tests for parameter fixes, home page FAR story verbatim excerpt fidelity, and strict primary-layer language checks outside `<details>`.
- **Published Parameter & Report Data (`public/data/in-ka-bengaluru*/4.0.0/parameters.json`, `data/reports/`)**:
  - Regenerated `parameters.json` and `data/reports/<jurisdiction>/parameter-mismatches.md` / `qa.md` listing any values excluded by plausibility bounds for owner review.
- **Next.js Web Application (`app/`, `components/`, `lib/`)**:
  - `app/layout.tsx`, `app/globals.css`, `app/icon.svg`: Rename to `"Bylaw One"` (`"Bengaluru's building rules. One code."`), dg2n tokens, square corners, hairline rules, and `#ff6b52` accent restricted to non-text active indicators.
  - `components/TopNav.tsx`, `components/Footer.tsx`, `components/CorporationSelector.tsx`: 3-item header (`The code`, `What changed`, `About`) + search icon + mobile menu (`>= 44 px` tap targets); footer with `Sources`, `Map`, `Data and downloads`, `Licence`, `How this is built`, and disclaimer; quiet corporation selector on subject and document pages.
  - `app/page.tsx`, `components/FarStoryStepper.tsx`: New narrative home page (Hero with dynamic counts, `01 / The problem` with convergence illustration, `02 / Follow one rule: FAR` 5-step interactive + no-JS stepper with verbatim quotes and `"View page"` links, `03 / The code, by subject` 11-subject list, `04 / Recently changed`, FAQ, and `"Read. Trace. Compare."` closing).
  - `app/j/[id]/topics/page.tsx`, `app/j/[id]/topics/[topic]/page.tsx`: 11-subject index and redesigned subject pages (`What applies today` clean tables with conditions in words and units, `Why this rule applies`, collapsed `Older or replaced rules` and `Related provisions`, and subject-specific gap notes).
  - `app/j/[id]/documents/[doc]/page.tsx`, `app/j/[id]/clauses/page.tsx`, `components/ClauseTree.tsx`, `components/ClausePanel.tsx`: Clean law-order provisions, details on tap, no `"Read provisions"` link for unstructured/reference-only documents, and removal of irrelevant 4 March 2026 South draft notice from in-force documents.
  - `app/j/[id]/timeline/page.tsx`, `app/j/[id]/sources/page.tsx`, `app/j/[id]/page.tsx`, `app/about/page.tsx`, `components/AreaExplorerClient.tsx`: What changed page with type & corporation filters, Sources page with technical fields in Details, standalone Map page showing area/ward/corporation/zone only (no plot card/inputs), and comprehensive About page including `#how-this-is-built` and `#licence`.
- **Playwright & Unit Tests (`__tests__/`, `e2e/`)**:
  - Updated Vitest and Playwright E2E suites verifying the new Home page, 5-step FAR story, Subject tables, Document expander, absence of plot inputs across all pages, axe-core WCAG AA compliance, and page weight budgets.

## Open Questions

None — `docs/plans/bylaw-one-clean-ui-plan.md` is self-contained and explicitly specifies all product, visual, data, and verification decisions.

## Assumptions

| # | Grade | Decision | Rationale | Scores |
|---|-------|----------|-----------|--------|
| 1 | Certain | Rename the site throughout to **Bylaw One** with metadata descriptor `"Bengaluru's building rules. One code."`, keeping the current repository and domain name while noting in `docs/` that a domain and trademark check is pending | Explicitly specified in `docs/plans/bylaw-one-clean-ui-plan.md` §2 Decision 1 and §10 | S:100 R:95 A:95 D:100 |
| 2 | Certain | Apply the `dg2n.com` visual style (`#f5f3ed` paper, `#efeee8` panel, `#080909` ink, `#5b5e56` muted, `#c8ccc0` hairline, `#ff6b52` coral accent never used for text, `Inter Tight` / `Source Serif 4` / `JetBrains Mono`, no cards/shadows, square corners, two-part headlines, numbered sections, and honest labels `"In short, by this site"`, `"Derived by this site"`, `"From the official text"`) | Explicitly specified in `docs/plans/bylaw-one-clean-ui-plan.md` §2 Decision 5 and §3.1–3.2 | S:100 R:90 A:95 D:100 |
| 3 | Certain | Rebuild the home page (`/`) with no map and no plot inputs: Hero with dynamically computed instrument/body counts, `01 / The problem`, `02 / Follow one rule: FAR` (5 steps: 2004, 2007, 2017, 2025, Today with verbatim excerpts verified by the fidelity check and working page links), `03 / The code, by subject` (11 subjects), `04 / Recently changed`, expandable FAQ, and `"Read. Trace. Compare."` closing | Explicitly specified in `docs/plans/bylaw-one-clean-ui-plan.md` §2 Decisions 2–4 and §5 | S:100 R:90 A:95 D:100 |
| 4 | Certain | Cut the top header to the `"Bylaw One"` wordmark, three items (`The code`, `What changed`, `About`), and a search trigger (collapsing on 390 px phones to wordmark, search icon, and menu button with >= 44 px tap targets), moving `Sources`, `Map`, `Data and downloads`, `Licence`, and `How this is built` to the footer | Explicitly specified in `docs/plans/bylaw-one-clean-ui-plan.md` §4 and §11 | S:100 R:90 A:95 D:100 |
| 5 | Certain | Remove the plot card, plot inputs, and plot answers from all pages (including the standalone Map page, which shows area, ward, corporation, and zone only) while keeping `pipeline/bylaws/resolver.py`, `lib/resolver.ts`, `parameters.json`, and their unit tests intact in the repository | Explicitly specified in `docs/plans/bylaw-one-clean-ui-plan.md` §2 Decision 3, §7, and §8 | S:100 R:95 A:95 D:100 |
| 6 | Certain | Implement parameter plausibility bounds per parameter kind, fix `"Hectares"` to `m²` conversion (`0.40 Hectares` → `4,000 m²`), reclassify/exclude non-FAR rows (deviation tolerances, compounding fees, premium FAR price rates), and render sentence parking values as text, listing any excluded values for owner review | Explicitly specified in `docs/plans/bylaw-one-clean-ui-plan.md` §9 and §13 | S:100 R:90 A:95 D:100 |
| 7 | Certain | Default shared subject and document views to Greater Bengaluru (`in-ka-bengaluru`) with a quiet corporation selector (`"Showing: … · Change"`), show only relevant gap notices (removing the 4 March 2026 South draft notice from in-force documents), and omit `"Read provisions"` links for instruments whose text is not held | Explicitly specified in `docs/plans/bylaw-one-clean-ui-plan.md` §4, §6, and §7 | S:95 R:90 A:95 D:95 |
| 8 | Certain | Enforce CI checks for primary-layer language cleanliness (no internal IDs, enum names, or raw unit tokens like `sq_m` outside `<details>`), home page excerpt text fidelity, WCAG AA accessibility (`axe-core`), page budgets (`<= 300 KB` HTML, `<= 1.5 MB` JS+data), and Playwright browser tests | Explicitly specified in `docs/plans/bylaw-one-clean-ui-plan.md` §3.3 and §12 | S:100 R:90 A:95 D:100 |

8 assumptions (8 certain, 0 confident, 0 tentative, 0 unresolved).
