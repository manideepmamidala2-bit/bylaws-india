# Intake: Bylaw One: Trust and Accuracy

**Change**: 261126-3t3i-trust-and-accuracy
**Created**: 2026-11-26

## Origin

> Implement docs/plans/trust-and-accuracy-plan.md using existing data only and adding no new features: open one draft PR with the preview URL at the top; Part 1 store each instrument's page text with its PDF checksum, make the citation and fidelity checks in CI read only that stored text, remove the fallback that rebuilds page text from published clauses, fail on missing page text, and prove it with planted-fault tests; Part 2 replace the map's 0.0032 m claim with the measured accuracy generated from the verification report, rebuild the map page in the Bylaw One design, and link it from the footer and the Land use page; Part 3 use plain register names in every source cell and label with a CI check, and fix the home page's 2017 and 2007 attributions so their quotes pass the citation check; Part 4 show only structurally confirmed relation kinds publicly, keep the labelling sheet ready, and record the 0.8 precision rule; Part 5 make the resolver return "needs depth/width/height" instead of assuming dimensions and distinguish "no limit in the law" from "not covered by our data", tested on the four review plots, without showing it on the site; commit and push after each part, keep docs/progress.md current and the PR's "For owner review", "Decisions made" and "Known gaps" sections up to date; never invent or rewrite legal text.

One-shot invocation of `/fab-new` backed by the self-contained specification in `docs/plans/trust-and-accuracy-plan.md` (dated 26 November 2026, grounded in the status review *"Where the Project Meets Its Intent, and Where It Does Not"*).

## Why

1. **Problem**:
   - **Citation & fidelity check is self-referential in CI**: Locally, `pipeline/bylaws/fidelity.py` (`_load_doc_page_token_sets`) compares provision text against `data/interim/<jurisdiction>/<doc_id>.<parser>.json`. In CI, where `data/interim/` is gitignored and absent, it falls back to rebuilding `synth_blocks` from the published `public/data/<jur>/<ver>/<doc_id>.clauses.json` file itself — meaning a published provision is compared against its own text and the check cannot fail in CI.
   - **Map overstates positional accuracy**: `app/j/[id]/page.tsx` displays `"Zone boundaries are within about 0.0032 m of street centre-lines"`, which is the affine grid-fit RMSE on the scanned sheet (`rmse_m = 0.0032 m`), whereas the map verification report (`data/reports/in-ka-bengaluru-south/map-verification.md`) measures an OpenStreetMap street centre-line median offset of `8.02 m` and a 90th-percentile (`p90`) offset of `21.11 m`.
   - **Map page is in the old design**: `/j/[id]` (`app/j/[id]/page.tsx`, `components/AreaExplorerClient.tsx`, `components/ClausePanel.tsx`) still carries old explorer layout chrome rather than the clean **Bylaw One** design (tokens, typography, header, footer, plain language, details on tap).
   - **Source labels lag behind the register**: Subject pages and replaced-rule notices repeat full all-caps gazette titles (`"GOVERNMENT OF KARNATAKA No. UDD 235 MNJ 2025(E) date: 05.01.2026 NOTIFICATION (Amendment to Zonal Regulations...)"` or mechanical title-casing of it) on every row instead of each instrument's concise plain register name (`plain_title`, e.g., `"Zoning amendment, 5 Jan 2026"` / `"Zoning Regulations Amendment, 5 January 2026"`), while full official titles belong only inside `Details` and on the document page header.
   - **Two home-page FAR story attributions confuse**:
     - The **2017 step** (`Step 3 / 5`) quotes bye-law `1.4` under the title of `Karnataka Municipalities Model Building Bye-Laws, 2017`, which the site itself marks `"not applicable here"`; it must instead attribute the quote to `"Building Bye-laws 2003, bye-law 1.4 (inserted by notification UDD 14 TTP 2017, 28 October 2017)"`, link to both bye-law `1.4` and the notification's page, and explain in one plain line: `"This notification also issued the Model Building Bye-laws, which do not otherwise apply in Bengaluru."`
     - The **2007 step** (`Step 2 / 5`) quotes clause `4.1.1` describing which areas are Residential (Main), rather than words from `rmp2015-zr` that actually introduce FAR by zone, plot size, and road width (or the FAR table's own caption if no such sentence exists).
   - **Relations lack explicit review status and page numbers in the labelling sheet**: All 134 relations are rule-confirmed only (`63` public across `amends`, `incorporates`, `corporation_differs`; `71` hidden across `cross_document_reference`, `definition_differs`, `precedence`). Non-structural kinds must be explicitly marked `"not yet reviewed"`, public relations must show `"Checked by rule, not yet by a person"` inside `Details`, `docs/review/relations-labelling.md` must show both provisions, their pages, and an unfilled verdict column, and the `>= 0.8` labelled precision promotion rule must be recorded and enforced.
   - **Resolver silently assumes dimensions and conflates two kinds of "no rule"**: `pipeline/bylaws/resolver.py` and `lib/resolver.ts` assume a `3:2` plot (`inferred_depth`, `inferred_width`) and an `11.5 m` building (`eff_height = 11.5`) when `plot_depth_m`, `plot_width_m`, or `building_height_m` are omitted, and return a single `"no_applicable_rule"` (`"No rule matched plot inputs"`) without distinguishing between `"No limit in the law for this case"` (with quoted statutory text/table citation) and `"Not covered by our data yet"`.
2. **Consequence**: Without these fixes, Bylaw One's central promise — *"Every rule traced to its page"* — is not falsifiable in CI, the map makes a physically impossible `3.2 mm` street-alignment claim, subject tables are cluttered with full gazette headers, the home page FAR story misattributes its 2007 and 2017 quotes, and the retained resolver fabricates missing plot dimensions.
3. **Approach**: Execute the five parts of `docs/plans/trust-and-accuracy-plan.md` in order using existing repository data only and adding no new features, committing and pushing after each part, maintaining `docs/progress.md`, and keeping one draft PR updated with the preview URL at the top and `"For owner review"`, `"Decisions made"`, and `"Known gaps"` sections.

## What Changes

### Part 1 — A Citation Check That Can Fail (`pipeline/bylaws/fidelity.py`, stored page text, `pipeline/tests/test_text_fidelity.py`)

1. **Versioned Stored Page Text with PDF Checksum**:
   - For every acquired instrument across `in-ka-bengaluru`, the 5 child City Corporations (`in-ka-bengaluru-central`, `-north`, `-south`, `-east`, `-west`), and `xx-test-fixture`, store the extracted page-by-page text from the original PDF (from the parser's page text in `data/interim/` or extracted directly from the verified `data/raw/` PDF via `pypdfium2` / `tesseract` parser output) together with the PDF's `sha256` checksum from the source register (`jurisdictions/<id>.yaml` / `<doc_id>.meta.json`) in a versioned, committed store alongside the source register (e.g., compressed JSON `data/page_text/<jurisdiction>/<doc_id>.pages.json.gz` or `data/page_text/<doc_id>.pages.json.gz` indexed by `doc_id` and `sha256`, never derived from published `.clauses.json` files).
   - Each stored instrument page-text file records:
     ```json
     {
       "schema_version": "1.4",
       "doc_id": "rmp2015-zr",
       "sha256": "db0d125f4da8abcb2e80319f6fd324baa59f63a3037dd0c687f18150a20eafe3",
       "page_count": 69,
       "pages": {
         "1": "...",
         "2": "..."
       }
     }
     ```
2. **CI Reads Stored Page Text Only — Fallback Removed**:
   - Update `_load_doc_page_token_sets` and `verify_jurisdiction_text_fidelity` in `pipeline/bylaws/fidelity.py` so fidelity and citation checks read page text **only** from this committed page-text store (plus recorded `ocr_corrections`, `unreadable_fragments`, and `table_overrides` in `data/overrides/<jurisdiction>/overrides.yaml`).
   - Completely remove the fallback in `pipeline/bylaws/fidelity.py` (lines 59–84) that rebuilds `synth_blocks` from `public/data/<jur>/<ver>/<doc_id>.clauses.json`.
   - If the stored page-text file for an instrument is missing, or if a cited page number is absent from the stored `pages` map, or if its recorded `sha256` does not match the instrument's `retrieval.sha256` / `.meta.json` `sha256` in the source register, the check **MUST fail** (never skip).
3. **Audit & Fix Existing Citations Against Real Stored Page Text**:
   - Run `verify_jurisdiction_text_fidelity` across all provisions, versions, parameter `cell_text` citations, applicability quotes, resolution quotes, and home-page excerpts against the stored PDF page text.
   - Record in `docs/progress.md` and the PR description: total pages stored, total provisions and parameter rows checked, every citation that failed against stored page text, and the exact fixes made (using only existing PDF page text, page number corrections, or page-image-verified `ocr_corrections` — never inventing or rewriting legal text).
4. **Planted-Fault Tests (`pipeline/tests/test_text_fidelity.py`)**:
   - Add falsifiable planted-fault tests that:
     - (a) alter one word in a published provision (`versions[-1].content` / `text`) and assert `verify_jurisdiction_text_fidelity` fails;
     - (b) change one cited page number on a provision or parameter record to a page where those words do not appear and assert `verify_jurisdiction_text_fidelity` fails;
     - (c) remove a cited page's stored text or corrupt the stored `sha256` checksum and assert the check fails (does not skip).

### Part 2 — Correct the Map (`pipeline/bylaws/geo/verify.py`, `app/j/[id]/page.tsx`, `components/AreaExplorerClient.tsx`, `components/Footer.tsx`, `app/j/[id]/topics/[topic]/page.tsx`)

1. **Measured Accuracy Statement Generated from Verification Report**:
   - Replace the `0.0032 m` banner claim with the measured street centre-line offset figures from the verification report in plain words:
     `"Zone boundaries are approximate: typically about 8 m from street centre-lines, and within about 21 m in 9 out of 10 places."`
   - Store the measured street centre-line median (`road_median_offset_m`, e.g., `8.02 m` → rounded to `8 m`) and 90th-percentile (`road_p90_offset_m`, e.g., `21.11 m` → rounded to `21 m`) alongside the sheet-fitting error (`grid_fit_rmse_m: 0.0032 m`) in the published geospatial metadata (`geo-layers.json` / verification report data) so the web page generates the accuracy statement dynamically from those report values rather than hard-coding numbers.
   - Move the `0.0032 m` grid-fit figure inside `Details`, explicitly labelled as the **sheet-fitting error** (how closely the printed `+` grid crosshairs on the scanned PDF fit the UTM coordinate grid), not positional street accuracy.
2. **Accuracy Check in CI (`scripts/check_page_budgets.mjs` & `pipeline/tests/test_release_and_copy_consistency.py`)**:
   - Verify in CI that the accuracy text rendered on `/j/[id]` is derived from the map verification report's median and 90th-percentile values (`about 8 m` and `about 21 m`), that `"0.0032 m"` never appears outside `<details>`, and that hard-coded accuracy literals in `.tsx` source files fail the check.
3. **Rebuild the Map Page in the Bylaw One Design (`app/j/[id]/page.tsx`, `components/AreaExplorerClient.tsx`)**:
   - Rebuild `/j/[id]` in the clean **Bylaw One** design (`#f5f3ed` warm paper, `#efeee8` tonal panel, `#080909` ink, `#5b5e56` muted slate, `#c8ccc0` hairline rules, `Inter Tight` / `Source Serif 4` / `JetBrains Mono`, `TopNav`, `Footer`, quiet `CorporationSelector`, plain language, `Details` on tap).
   - Keep all map functionality intact: official corporation boundaries, wards, land-use zones where available, layer switch (`Streets`, `Land-use zones`, `Wards`, `Corporations`, `Original sheet overlay`), place/ward search, click/select for **area, ward, corporation, and zone** (with a direct link to the land-use rules and the code), and `"About this map"` / `"Details"` on tap.
   - Remove legacy `ClausePanel` clutter from the map view so the page stays focused, clean, and within the `300 KB` HTML budget.
   - State plainly: `"Land-use zones are available for parts of Bengaluru South only."` (or `"Land-use zones are available for parts of Bengaluru South only. Elsewhere the map shows boundaries and wards."`).
4. **Reachability**:
   - Ensure `"Map"` is linked from `components/Footer.tsx` on every page (resolving to `/j/<active-or-default-jurId>`, never falling back to `/data` on the home or about pages) and from the `Land use` subject page (`/j/[id]/topics/land-use` and the home page `Land use` row). Leave `TopNav` main navigation at three items (`The code`, `What changed`, `About`).

### Part 3 — Plain Names and Correct Attributions (`jurisdictions/*.yaml`, `lib/plain-language.ts`, `app/page.tsx`, `components/FarStoryStepper.tsx`, `app/j/[id]/topics/[topic]/page.tsx`, `scripts/check_page_budgets.mjs`)

1. **Plain Register Names Everywhere Outside Details and Document Headers**:
   - Ensure every instrument in the source register (`jurisdictions/in-ka-bengaluru.yaml`, `jurisdictions/in-ka-bengaluru-*.yaml`, and exported `documents.json` / `sources.json`) carries a concise, human-readable plain register name (e.g., via `plain_title` or canonical register mapping in `documents.json` / `formatPlainDocumentTitle`), such as:
     - `bbl-2003` → `"Building Bye-laws 2003"`
     - `rmp2015-zr` → `"Master Plan Zoning Regulations 2007"` (or `"RMP 2015 Zoning Regulations"`)
     - `rmp2015-zr-amend-2009-03` → `"Zoning amendment (Traffic and Transportation), 2 March 2009"`
     - `rmp2015-zr-amend-2015-03` → `"Zoning amendment (Residential commercial uses), 20 March 2015"`
     - `ka-model-bbl-2017` → `"Notification UDD 14 TTP 2017 (Model Building Bye-laws)"`
     - `rmp2015-zr-amend-2018-09` → `"Zoning amendment (Impact Zone FAR), 29 September 2018"`
     - `rmp2015-zr-amend-2019-06` → `"Zoning amendment (Development Plan and Parking), 19 June 2019"`
     - `rmp2015-zr-amend-2025-02` → `"Zoning amendment (Premium FAR), 21 February 2025"`
     - `rmp2015-zr-amend-2025-04` → `"Zoning amendment (Premium FAR), 2 April 2025"`
     - `rmp2015-zr-amend-2025-10` → `"Zoning amendment (Buffer zones), 16 October 2025"`
     - `rmp2015-zr-amend-2026-01` → `"Zoning amendment, 5 January 2026"`
     - `bccc/bncc/bscc/becc/bwcc-bbl-amend-2026-05` → `"<Corporation> Building (Amendment) Bye-laws, 14 May 2026"`
     - `gbga-2024` → `"Greater Bengaluru Governance Act 2024"`
   - Use the instrument's plain register name and date in every subject-page source cell, replaced-rule label (`"Replaced by <plain name>, <date>"`), `"Changed"` tag, and timeline/sources item.
   - Full official gazette titles (`doc.title`, e.g. `"GOVERNMENT OF KARNATAKA No. UDD 235 MNJ 2025(E)..."`) appear **only** inside `<details>` (`Details`) and on the document page header (`/j/[id]/documents/[doc]`).
2. **Name Check in CI (`scripts/check_page_budgets.mjs`, `pipeline/tests/test_release_and_copy_consistency.py`)**:
   - Fail the build if any full official gazette title (`GOVERNMENT OF KARNATAKA`, `No. UDD 235 MNJ`, `BANGALORE MAHANAGARA PALIKE BUILDING BYE-LAWS 2003`, `Revised Master Plan 2015 BANGALORE 2007 Volume – III`, etc.) appears outside `<details>` or document page headers.
3. **Fix Home Page 2017 Step (`Step 3 / 5` in `app/page.tsx` & `components/FarStoryStepper.tsx`)**:
   - Attribute the quote to `"Building Bye-laws 2003, bye-law 1.4 (inserted by notification UDD 14 TTP 2017, 28 October 2017)"`.
   - Link both to bye-law `1.4` in the Building Bye-laws (`/j/<id>/documents/bbl-2003#node-part_I__sec_1.0__cl_1.4`) and to the notification's PDF page (`ka-model-bbl-2017` p. 2) and document page (`/j/<id>/documents/ka-model-bbl-2017`).
   - Include the one plain explanation line: `"This notification also issued the Model Building Bye-laws, which do not otherwise apply in Bengaluru."`
4. **Fix Home Page 2007 Step (`Step 2 / 5` in `app/page.tsx`)**:
   - Replace the `4.1.1` quote (which describes which areas are Residential (Main)) with verbatim words from `rmp2015-zr` that actually introduce FAR and ground coverage by zone, plot size, and road width (`4.1.3` / `Table 10: FAR and Ground Coverage in Residential (Main)` on p. 28, or the introductory text/caption of `Table 10` on p. 28). If no sentence introducing FAR by zone, plot size, and road width exists in `4.1.3`, show the table's own caption (`"4.1.3 FAR and Ground Coverage in Residential (Main) — Table 10: FAR and Ground Coverage in Residential (Main)"`) and state plainly that the regulation introduces FAR through the table caption and columns.
   - Verify that the replacement quote passes Part 1's stored-page-text citation check and record it under **For owner review** in the PR description.
5. **Attribution Check in CI (`pipeline/tests/test_text_fidelity.py`)**:
   - Verify in CI that every home-page quote's cited document and page in stored page text contains the quoted words.

### Part 4 — Relations Shown Honestly (`pipeline/bylaws/relations.py`, `docs/review/relations-labelling.md`, `app/j/[id]/topics/[topic]/page.tsx`, `components/ClauseTree.tsx`)

1. **Public vs. Unreviewed Relation Kinds**:
   - Show publicly (`public_visible: true`) only relation kinds confirmed by structure: `amends`, `incorporates` (bye-law 1.4), and `corporation_differs`.
   - Keep all other kinds (`cross_document_reference`, `definition_differs`, `precedence`) in `relations.json` with `status: "not_yet_reviewed"` (or marked `"not yet reviewed"` in their status/note and `public_visible: false`) and hide them from the public web interface.
2. **60-Item Labelling Sheet Ready in `docs/review/relations-labelling.md`**:
   - Update `_write_relations_labelling_sheet` in `pipeline/bylaws/relations.py` so `docs/review/relations-labelling.md` lists all 60 items (10 per kind) showing **both provisions (`doc:eid`), their cited page numbers (`p. N`), their text excerpts, and an unfilled `Owner Verdict` column**. Do not fill in verdicts.
3. **0.8 Precision Rule Recorded and Enforced**:
   - Record and enforce the rule in `pipeline/bylaws/relations.py` (and `docs/review/relations-labelling.md`): a non-structural relation kind becomes `public_visible: true` only when its labelled precision computed from `docs/review/relations-labelling.md` verdicts is at least `0.8` (`>= 0.80`).
4. **Honest Rule-Check Disclosure inside Details**:
   - Wherever a public relation is surfaced in the web UI (on subject pages or document provision Details), display `"Checked by rule, not yet by a person"` inside its `Details` disclosure.

### Part 5 — Resolver Honesty, Hidden from Website (`pipeline/bylaws/resolver.py`, `lib/resolver.ts`, `schemas/resolution.schema.json`, `pipeline/tests/test_resolver.py`, `__tests__/resolver.test.ts`)

1. **No Assumed Plot Dimensions or Building Height**:
   - Remove the `inferred_depth` (`(plot_area_m2 * 1.5) ** 0.5`), `inferred_width` (`plot_area_m2 / inferred_depth`), and `eff_height = 11.5` defaults from both `pipeline/bylaws/resolver.py` and `lib/resolver.ts`.
   - When a parameter rule depends on `plot_depth_m` (`unit == "pct_of_plot_depth"` or `conditions.plot_depth_m` interval), `plot_width_m` (`unit == "pct_of_plot_width"` or `conditions.plot_width_m` interval), or `building_height_m` (`conditions.building_height_m` interval, e.g., Table 8 `<= 12 m` vs. Table 9 `> 11.5 m`) and the caller did not supply that dimension (`None` / `null`), return status `"needs_input"` (or `"needs_depth"` / `"needs_width"` / `"needs_height"`) with display value `"needs depth"`, `"needs width"`, or `"needs height"` (or `"needs depth and height"` / `"needs width and height"` when both are needed to pick and compute the rule) instead of guessing a 3:2 plot or an 11.5 m building.
   - Preserve `inputs.plot_depth_m`, `inputs.plot_width_m`, and `inputs.building_height_m` as `None` / `null` when not provided.
2. **Distinguish Two Kinds of "No Rule"**:
   - Replace the ambiguous `"no_applicable_rule"` (`"No rule matched plot inputs"`) with two distinct, cited outcomes:
     - **`no_limit_in_law`** (`display_value: "No limit in the law for this case"`): when the governing regulatory table or clause in our dataset covers the zone/use and sets a cap only for other cases (for example, `building_height_max_m` or `floors_max` where `rmp2015-zr-amend-2026-01` clause `4.1.2(b)` / `Table 10` caps building height at `9 m` / `12 m` only on roads `< 9 m` or plots `<= 250 m²`, leaving plots on wider roads in `R-MAIN`, `C-BIZ`, or `I-GEN` subject only to FAR, setback/Table 9, and aviation norms rather than a fixed metre height or floor cap; or `tdr_receivable_max` / `far_premium_additional_max` where the law sets no allowance or limit). Include the quoted text or table citation (`doc_id`, `eid`, `page`, `quote`) proving why the law sets no separate cap for this case.
     - **`not_covered_by_data`** (`display_value: "Not covered by our data yet"`): when the parameter/zone/use combination is genuinely not yet extracted or modelled in `parameters.json`.
3. **Tests on the Four Review Plots (`pipeline/tests/test_resolver.py` & `__tests__/resolver.test.ts`)**:
   - Test both Python and TypeScript resolvers against the source tables on the four review plots:
     1. **`600 m²` on a `15 m` road in `Residential (Main)` (`R-MAIN`)**:
        - Without depth/width/height → setbacks return `"needs depth"` / `"needs width"` / `"needs height"`;
        - With depth (`30 m`), width (`20 m`), height (`11.5 m`) → coverage `65%`, base FAR `2.25`, setbacks `12%` depth (`3.6 m`), `8%` depth (`2.4 m`), `8%` width (`1.6 m`), and `building_height_max_m` / `floors_max` return `"No limit in the law for this case"` with citation (since `4.1.2(b)` height caps apply only to roads `< 9 m` / plots `<= 250 m²`).
     2. **`150 m²` on a `9 m` road in `Residential (Main)` (`R-MAIN`)**:
        - Checked with and without depth/width/height for `"needs depth"` / `"needs width"` / `"needs height"`, Table 8 fixed/percentage setbacks, coverage `75%`, FAR `1.75`, and `"No limit in the law for this case"` vs. capped parameters.
     3. **`3,000 m²` commercial (`C-BIZ` / `commercial`) on a `24 m` road**:
        - Checked with and without depth/width/height for `"needs height"` on setbacks (Table 8 vs. Table 9), coverage, FAR, and `"No limit in the law for this case"` vs. `"Not covered by our data yet"`.
     4. **`6,000 m²` industrial (`I-GEN` / `industrial`) on an `18 m` road**:
        - Checked against `Table 16` (`rmp2015-zr-amend-2026-01` p. 6 / `rmp2015-zr` p. 35) for coverage, FAR, setbacks, and `"No limit in the law for this case"` vs. `"Not covered by our data yet"`.
4. **Keep Resolver Hidden from Website**:
   - Do not render any plot resolver inputs or plot answer cards on any web page.

## Affected Memory

- `architecture/overview`: (modify) Document committed per-instrument stored page text with SHA-256 checksum verification (`data/page_text/`), removal of the CI `.clauses.json` fidelity fallback, planted-fault citation tests, verification-report-driven map accuracy statement (`about 8 m` median, `about 21 m` p90, grid-fit RMSE inside Details), rebuilt Bylaw One map page, plain register names with CI full-title guard, corrected 2007/2017 home-page FAR story attributions, `"Checked by rule, not yet by a person"` relation disclosure and 0.8 precision rule, and honest resolver outcomes (`needs depth/width/height`, `No limit in the law for this case`, `Not covered by our data yet`).
- `schemas/data-contracts`: (modify) Document any schema additions for `plain_title` on `document.schema.json` / `jurisdiction.schema.json`, measured street offset metrics (`road_median_offset_m`, `road_p90_offset_m`, `grid_fit_rmse_m`) on `geo-layers.schema.json`, `"not_yet_reviewed"` status on `relations.schema.json`, and honest resolver outcome statuses (`needs_depth`, `needs_width`, `needs_height`, `no_limit_in_law`, `not_covered_by_data`) in `lib/resolver.ts` and `pipeline/bylaws/resolver.py`.

## Impact

- **Python Pipeline (`pipeline/bylaws/`)**:
  - `pipeline/bylaws/fidelity.py` (stored page-text loader, SHA-256 checksum check, removal of `.clauses.json` fallback, home-page quote and parameter citation checks)
  - `pipeline/bylaws/geo/verify.py` & `pipeline/bylaws/cli.py` (exporting measured `road_median_offset_m`, `road_p90_offset_m`, and `grid_fit_rmse_m` into `geo-layers.json`)
  - `pipeline/bylaws/relations.py` (`not_yet_reviewed` status on non-structural kinds, page numbers in `docs/review/relations-labelling.md`, `>= 0.8` precision promotion rule)
  - `pipeline/bylaws/resolver.py` (removing assumed 3:2 plot dimensions and 11.5 m height; returning `needs depth/width/height`, `No limit in the law for this case` with citation, and `Not covered by our data yet`)
  - `pipeline/bylaws/parameters.py`, `pipeline/bylaws/consolidate.py`, `pipeline/bylaws/publish.py` (plain register names and dataset rebuild)
- **Stored Page Text & Configs (`data/`, `jurisdictions/`, `schemas/`)**:
  - `data/page_text/` (compressed per-instrument page text with PDF SHA-256 checksums for all acquired instruments)
  - `jurisdictions/in-ka-bengaluru*.yaml`, `schemas/*.schema.json`, `pipeline/bylaws/models/_generated.py`, `lib/types/generated.ts`
- **Next.js Web Application (`app/`, `components/`, `lib/`)**:
  - `app/j/[id]/page.tsx`, `components/AreaExplorerClient.tsx` (measured accuracy statement from report data, grid-fit RMSE in Details, clean Bylaw One map page design)
  - `components/Footer.tsx`, `app/j/[id]/topics/[topic]/page.tsx` (consistent Map link in footer on every page and on Land use; plain register names in source cells; `"Checked by rule, not yet by a person"` in relation Details)
  - `app/page.tsx`, `components/FarStoryStepper.tsx` (2017 step attribution to `Building Bye-laws 2003, bye-law 1.4 (inserted by notification UDD 14 TTP 2017, 28 October 2017)` + Model Bye-laws note; 2007 step quote introducing FAR / Table 10 caption)
  - `lib/plain-language.ts`, `lib/resolver.ts`
- **CI & Test Suites (`pipeline/tests/`, `__tests__/`, `e2e/`, `scripts/check_page_budgets.mjs`)**:
  - `pipeline/tests/test_text_fidelity.py` (planted-fault word & page tests, missing-page-text failure test, home-page attribution check)
  - `pipeline/tests/test_release_and_copy_consistency.py` & `scripts/check_page_budgets.mjs` (map accuracy report-derivation check, full-official-title outside Details/header check)
  - `pipeline/tests/test_resolver.py` & `__tests__/resolver.test.ts` (four review plots tested for `needs depth/width/height` and `No limit in the law for this case` vs. `Not covered by our data yet`)
- **Documentation & PR Tracking**:
  - `docs/review/relations-labelling.md`, `docs/progress.md`, and one draft GitHub PR updated after each part.

## Open Questions

None — `docs/plans/trust-and-accuracy-plan.md` specifies every requirement, wording, test case, and delivery rule.

## Assumptions

| # | Grade | Decision | Rationale | Scores |
|---|-------|----------|-----------|--------|
| 1 | Certain | Store per-instrument extracted PDF page text together with the PDF SHA-256 checksum in a versioned, committed store (`data/page_text/`), remove the `.clauses.json` fallback from `pipeline/bylaws/fidelity.py`, fail on missing page text or checksum mismatch, and add planted-fault tests altering a word and a page number | Explicitly specified in `docs/plans/trust-and-accuracy-plan.md` §4 Part 1.1–1.5 and §6 | S:100 R:95 A:95 D:100 |
| 2 | Certain | Replace the `0.0032 m` map banner claim with `"Zone boundaries are approximate: typically about 8 m from street centre-lines, and within about 21 m in 9 out of 10 places."` generated from the verification report's median and p90 values, move the `0.0032 m` grid-fit error into `Details`, rebuild `/j/[id]` in the Bylaw One design, and link `Map` from the footer on every page and from `Land use` | Explicitly specified in `docs/plans/trust-and-accuracy-plan.md` §4 Part 2.1–2.4 and §6 | S:100 R:95 A:95 D:100 |
| 3 | Certain | Use concise plain register names (`plain_title` / register-mapped plain names) and dates in every source cell, replaced-rule label, `"Changed"` tag, and timeline item, restrict full official gazette titles to `Details` and document page headers with a CI check, and fix the home page 2017 (`Step 3`) and 2007 (`Step 2`) attributions and quotes so they pass the stored-page-text citation check | Explicitly specified in `docs/plans/trust-and-accuracy-plan.md` §4 Part 3.1–3.5 and §6 | S:100 R:95 A:95 D:100 |
| 4 | Certain | Show publicly only structurally confirmed relation kinds (`amends`, `incorporates`, `corporation_differs`) with `"Checked by rule, not yet by a person"` inside `Details`, mark non-structural kinds `"not yet reviewed"` and keep them hidden until labelled precision reaches `>= 0.8`, and include provision page numbers in the 60-item `docs/review/relations-labelling.md` sheet | Explicitly specified in `docs/plans/trust-and-accuracy-plan.md` §4 Part 4.1–4.4 and §6 | S:100 R:95 A:95 D:100 |
| 5 | Certain | Remove assumed 3:2 plot dimensions and 11.5 m building height from `pipeline/bylaws/resolver.py` and `lib/resolver.ts`, return `"needs depth"` / `"needs width"` / `"needs height"` when missing, distinguish `"No limit in the law for this case"` (with citation) from `"Not covered by our data yet"`, test on the four review plots (`600 m²` R-MAIN on `15 m` road, `150 m²` R-MAIN on `9 m` road, `3,000 m²` commercial on `24 m` road, `6,000 m²` industrial on `18 m` road), and keep the resolver hidden from the website | Explicitly specified in `docs/plans/trust-and-accuracy-plan.md` §4 Part 5.1–5.4 and §6 | S:100 R:95 A:95 D:100 |
| 6 | Certain | Commit and push after each part, keep `docs/progress.md` current, and maintain one draft PR with the preview URL at the top and `"For owner review"`, `"Decisions made"`, and `"Known gaps"` sections | Explicitly specified in `docs/plans/trust-and-accuracy-plan.md` §3, §5, and user prompt | S:100 R:95 A:95 D:100 |

6 assumptions (6 certain, 0 confident, 0 tentative, 0 unresolved).
