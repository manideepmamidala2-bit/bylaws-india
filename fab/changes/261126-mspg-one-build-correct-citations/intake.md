# Intake: Bylaw One: One Build, Correct Citations

**Change**: 261126-mspg-one-build-correct-citations
**Created**: 2026-11-26

## Origin

> Implement docs/plans/one-build-correct-citations-plan.md using existing data only: open one draft PR with the preview URL at the top; Part 1 find why the Greater Bengaluru view is stale, build the city and all corporation views in one step from one dataset, add shared-content and same-build checks in CI, and verify the Greater Bengaluru Setbacks page after deploy; Part 2 make every amended provision cite the amending instrument's page where its wording appears, with a CI check that every quote and table row is found on its cited page; Part 3 take every instrument's name and date from the source register, resolve the "20 January 2026" label, and add a name check in CI; Part 4 record applicability clauses such as 3.1(ii) and 3.1(iii) and show "not settled" only when no in-force clause decides, explaining the setbacks height case in one line; Part 5 show each corporation's current wording for bye-law 6.0(i) and allow the "Master plan rules apply instead" label only on bye-law 1.4 subjects, with a CI check; commit and push after each part, keep docs/progress.md current and the PR's "For owner review", "Decisions made" and "Known gaps" sections up to date; never invent or rewrite legal text.

One-shot invocation referencing the self-contained specification in `docs/plans/one-build-correct-citations-plan.md` (dated 26 November 2026), based on a live-site review of `https://bylaws-india.vercel.app` on 26 November 2026 using existing repository data and the existing **Bylaw One** (`dg2n`) design only.

## Why

1. **Problem**: A review of the live site (`https://bylaws-india.vercel.app`) on 26 November 2026 surfaced five defects where the reader's view or the cited page diverges from the source documents:
   - **The default Greater Bengaluru view is stale (most pressing)**:
     - Corporation views (e.g. Bengaluru North, Setbacks) show the corrected content from `261126-jqph-one-city-one-truth`: the 2007 industrial setback row moved to replaced rules; clauses `3.1(ii)` and `3.1(iii)` in their January 2026 wording with previous wording on tap; old bye-law rules labelled `"Master plan rules apply instead (bye-law 1.4)"`; and `"No differences for Bengaluru North City Corporation on this subject"`.
     - The Greater Bengaluru view (`/j/in-ka-bengaluru/topics/setbacks`), which every home-page subject link opens, still shows uncorrected content on the live deployment: the 2007 industrial row (`4.5 m`) beside the 2026 row (`12% of plot depth`) for the same plots; `3.1(ii)` in its 2007 wording as in force; and Bye-law `1.4` labelled `"Replaced for this subject by the Master Plan Zoning Regulations under Bye-law 1.4"`.
     - The two views came from different builds/datasets (`param_0132` in the city view vs `param_0127` in the North view, caused by out-of-git storage bundle `data-v4.0.0` not being re-pushed or partial `public/data/` / build artifacts between `in-ka-bengaluru` and the child corporations).
   - **Wrong page citations for amended provisions**:
     - In the corrected view, the current wording of `3.1(ii)` and `3.1(iii)` cites the January 2026 notification (`rmp2015-zr-amend-2026-01`) at `p. 20`, and `3.10(i)` at `p. 24`, while the same notification's tables are cited at `p. 2` and `p. 6`. Pages `20` and `24` are the original 2007 `rmp2015-zr` document's page numbers carried over when `lib/data.ts` (`fetchJurisdictionDataset` setting `citations: c.citations ?? []` on hydrated `missingEffects`) or `amendments.py` failed to propagate the amending clause's page citation from `rmp2015-zr-amend-2026-01`.
   - **One instrument, two names and dates**:
     - Some replaced rows say `"Replaced by Zoning Regulations Amendment (Setbacks, Basements and Industrial Norms), 20 January 2026"`, while others name the same change as the `5 January 2026` notification (`No. UDD 235 MNJ 2025(E)`). Every reference to an instrument must take its single plain name and date from the source register.
   - **A false "not settled" warning on Setbacks**:
     - The page warns `"The current tables overlap between 11.5 m and 12 m"`, but the amended clauses settle it: `3.1(ii)` sends buildings with total height up to `12.0 m` (excluding stilt floor) to `Table 8`, and `3.1(iii)` sends buildings more than `12.0 m` in total height to `Table 9` (with `Table 8` also applying to plots up to `250 m²` and height up to `15 m` including stilt floor). The `11.5 m` to `12.0 m` start of `Table 9` is unreachable by virtue of `3.1(ii)` and `3.1(iii)`, not an unsettled conflict.
   - **Corporation wording and label for bye-law `6.0(i)`**:
     - In the North view, `6.0(i)` is tagged `"In Bengaluru North City Corporation"` but shows the 2003 wording (`"within 5% of…"`) and the label `"Master plan rules apply instead (bye-law 1.4)"`. Deviation limits are not among the subjects Bye-law `1.4` hands to the master plan (`use`, `land use`, `coverage`, `FAR`, `setback or open space`, `height`, `number of storeys`, `number of dwelling units`, `parking`), and each corporation's May 2026 amendment (`*-bbl-amend-2026-05`) substituted `6.0(i)`.
2. **Consequence of not fixing**: Readers clicking from the home page into Greater Bengaluru Setbacks see stale, pre-remediation rules that contradict the corporation views; clicking `"p. 20"` or `"p. 24"` on an amended January 2026 provision opens a 7-page PDF at a non-existent page; readers see two different names and dates (`5 January 2026` vs `20 January 2026`) for the same notification; architects are told `11.5 m`–`12 m` is `"not settled"` when clauses `3.1(ii)` and `3.1(iii)` explicitly settle it; and readers inspecting `6.0(i)` in a City Corporation see the repealed 2003 5% deviation text instead of the May 2026 corporation wording.
3. **Why this approach**: Executing `docs/plans/one-build-correct-citations-plan.md` in five sequential, CI-enforced parts guarantees that (1) city and corporation views are generated in one build step from one dataset with identical shared content and dataset build IDs, (2) every amended provision, quote, and table row is machine-verified against the exact cited page of the citing document, (3) every instrument has one register-backed plain name and date, (4) applicability clauses (`3.1(ii)` and `3.1(iii)`) are recorded in the dataset so settled table transitions are explained in one line under `"Why this rule applies"` rather than flagged as `"not settled"`, and (5) each corporation's May 2026 wording for `6.0(i)` is shown accurately with `"Master plan rules apply instead (bye-law 1.4)"` restricted strictly to Bye-law `1.4` subjects.

## What Changes

### Part 1 — One Build for Every View

1. **Diagnose and Record the Cause of the Stale Greater Bengaluru View (`docs/progress.md`, `scripts/sync_storage.py`, `scripts/ensure_data.mjs`, `pipeline/bylaws/publish.py`, `lib/data.ts`)**:
   - Inspect why `/j/in-ka-bengaluru/topics/setbacks` on the live deployment served older data (`param_0132` vs `param_0127`, unamended `3.1(ii)`, and `"Replaced for this subject..."` on Bye-law `1.4`) while corporation views served newer data:
     - Trace how `in-ka-bengaluru` vs `in-ka-bengaluru-{central,north,south,east,west}` datasets are built, published, bundled into `data-v4.0.0` (`scripts/sync_storage.py`), pulled by `scripts/ensure_data.mjs` during Vercel builds, and loaded by `lib/data.ts`.
     - Record the exact root cause in `docs/progress.md` and the PR description.
2. **Generate City View and All Corporation Views in One Build Step from One Dataset (`pipeline/bylaws/cli.py`, `pipeline/bylaws/publish.py`, `pipeline/bylaws/parameters.py`, `pipeline/bylaws/amendments.py`, `lib/data.ts`, `scripts/sync_storage.py`, `scripts/ensure_data.mjs`)**:
   - Ensure that building/publishing `in-ka-bengaluru` and the five child City Corporations (`in-ka-bengaluru-central`, `-north`, `-south`, `-east`, `-west`) produces a single unified dataset with one shared `build_id` / `dataset_id` (e.g. content digest / deterministic build identifier stamped in `manifest.json` and rendered into every built page's metadata / `data-dataset-id` attribute) and that `lib/data.ts` reads shared parameters, documents, clauses, and amendments for both Greater Bengaluru and child corporations from the same canonical source without any separate or stale cached path.
   - Ensure `scripts/sync_storage.py --push` updates the remote storage bundle and `scripts/ensure_data.mjs` verifies the dataset digest so Vercel never builds from a stale `data-v4.0.0` archive.
3. **Shared-Content Check in CI (`pipeline/tests/test_pr12_greater_bengaluru.py`, `scripts/check_page_budgets.mjs`)**:
   - For every subject (`/j/[id]/topics/[topic]`) and every shared rule or provision (one not introduced or amended by a corporation's own instrument), verify in CI that the content shown in the Greater Bengaluru city view (`/j/in-ka-bengaluru/topics/[topic]`) and in each of the five corporation views (`/j/in-ka-bengaluru-{central,north,south,east,west}/topics/[topic]`) is identical:
     - Parameter row value, conditions, source document name, date, page (`p. N`), and status label.
     - Governing provision wording, `"Changed [month year]"` tag, source document name, date, page (`p. N`), and older/replaced status label.
   - Any difference on a shared rule or provision fails the build.
4. **Same-Build Check in CI (`scripts/check_page_budgets.mjs`, `pipeline/tests/test_release_and_copy_consistency.py`, `app/layout.tsx` / `app/j/[id]/`)**:
   - Stamp every built page with the single dataset identifier (`data-dataset-id` / meta tag derived from the unified release manifest digest).
   - Verify in CI across all built HTML files under `.next/server/app/` that every page carries the dataset identifier and that all pages match the exact same identifier.
5. **Verify After Deploy (`e2e/`, Playwright / browser check)**:
   - Verify that `/j/in-ka-bengaluru/topics/setbacks` shows the 2007 industrial row (`4.5 m`) under **Older or replaced rules**, `3.1(ii)` in its January 2026 wording (`12.0 m` threshold), and no `"Replaced"` label on Bye-law `1.4`.

### Part 2 — Correct Page Citations

1. **Cite the Amending Instrument's Exact Page for Amended Provisions (`pipeline/bylaws/amendments.py`, `pipeline/bylaws/consolidate.py`, `lib/data.ts`, `jurisdictions/in-ka-bengaluru*.yaml`, `data/overrides/in-ka-bengaluru*/overrides.yaml`)**:
   - In `pipeline/bylaws/amendments.py`:
     - When building `effects` from declarative `config.amendment_links` (and inline detections), attach the **amending clause's citations** (`amending_node["citations"]` from `amending_tree`, or the exact page of `amending_doc` where the replacement wording appears) onto `effect["new_nodes"][0]["citations"]` and `new_ver["citations"]`, never falling back to `target_node["citations"]` (which hold the original base document's page number).
     - Ensure `amendment_links` in `jurisdictions/in-ka-bengaluru.yaml` (and `in-ka-bengaluru-south.yaml` / child configs) reference the exact `amending_clause` EID in `rmp2015-zr-amend-2026-01` (and all other amending notifications: `2009-03`, `2015-03`, `2018-09`, `2019-06`, `2025-04`, `2025-10`, and the five May 2026 corporation amendments `*-bbl-amend-2026-05`) whose `citations[0].page` is the PDF page of the amending instrument where that wording actually appears.
   - In `lib/data.ts` (`fetchJurisdictionDataset`):
     - When hydrating `missingEffects` onto `c.versions`, set `citations` on the new version from the amending clause node in `amending_doc` (or `mEff.new_nodes?.[0]?.citations`), NEVER `citations: c.citations ?? []` (which copied `rmp2015-zr`'s page 20 / page 24 onto the 2026 version!).
   - Verify that `origVer` (`versions[0]`) keeps its own citation pointing to the original base document and its original page (e.g. `rmp2015-zr` p. 20 for `3.1(ii)` and `3.1(iii)`, p. 24 for `3.10(i)`).
2. **Citation Check in CI (`pipeline/bylaws/fidelity.py`, `pipeline/tests/test_text_fidelity.py`)**:
   - Extend `verify_jurisdiction_text_fidelity` and `pipeline/tests/test_text_fidelity.py` so that for **every**:
     1. Quoted provision wording (base `v1` and every amended `v2+` version, checking `ver["content"]` strictly against `ver["source_doc"]` at the exact page(s) in `ver["citations"]` without cross-document fallback and without `±1` page slop unless the clause spans multiple cited pages),
     2. Extracted parameter table row (`parameters.json` `source.cell_text` and `source.row_header` checked against `source.doc_id` at `source.page`),
     3. Statutory resolution / applicability quote (`resolution.yaml` and applicability rules), and
     4. Home-page FAR story excerpt (`components/FarStoryStepper.tsx`),
     the text MUST be found on the **exact cited page** of the **cited document** using the stored page text (`data/interim/` parser blocks/tables + recorded `ocr_corrections` / `table_overrides`). Any mismatch fails the build.
   - Record and report the exact count of citations corrected in `docs/progress.md` and the PR description.
3. **Falsifiable Citation Tests (`pipeline/tests/test_text_fidelity.py`, `__tests__/`)**:
   - Assert specifically that `3.1(ii)`, `3.1(iii)`, and `3.10(i)` cite `rmp2015-zr-amend-2026-01` at the exact pages where their text appears in `udd-235-mnj-2025e-05.01.2026.pdf` (e.g. p. 1 / p. 2 for `3.1(ii)` and `3.1(iii)`, p. 3 for `3.10(i)`), while their previous wording in Details cites `rmp2015-zr` at p. 20 and p. 24.

### Part 3 — One Name and Date per Instrument

1. **Single Register-Backed Plain Name and Date per Instrument (`jurisdictions/in-ka-bengaluru*.yaml`, `pipeline/bylaws/parameters.py`, `pipeline/bylaws/consolidate.py`, `lib/plain-language.ts`, `lib/data.ts`)**:
   - Audit every `title`, `notified_date`, and `effective_from` in `jurisdictions/in-ka-bengaluru.yaml` and `jurisdictions/in-ka-bengaluru-{central,north,south,east,west}.yaml` and every place in pipeline and web code where instrument names or dates are formatted (`Replaced by …`, Sources, `"Changed …"` tags, What changed timeline, Why this rule applies, precedence/resolution steps, `consolidated.json` snapshot dates/labels).
   - Resolve the `"Zoning Regulations Amendment (Setbacks, Basements and Industrial Norms), 20 January 2026"` / `"2026-01-20"` discrepancy:
     - Confirm from existing repository data (`data/raw/in-ka-bengaluru/rmp2015-zr-amend-2026-01.pdf` / `.meta.json` and `jurisdictions/in-ka-bengaluru.yaml`): `rmp2015-zr-amend-2026-01` is `Notification No. UDD 235 MNJ 2025(E), dated 05.01.2026` (`notified_date: '2026-01-05'`, `effective_from: '2026-01-05'`); `"20 January 2026"` (`2026-01-20`) was a leftover date/label in `consolidate.py` (`HISTORICAL_SNAPSHOT_DATES`), `parameters.py`, or overrides referring to the same `5 January 2026` notification.
     - Replace all `"20 January 2026"` / `"2026-01-20"` references and free-text titles with the single canonical plain name and date (`5 January 2026`) derived from the source register entry for `rmp2015-zr-amend-2026-01`.
   - Ensure every instrument in the source register has one clean, plain title (or `formatPlainDocumentTitle(doc)` derived deterministically from the register entry) and one canonical date (`effective_from || notified_date`), and that `_format_short_doc_label` in `pipeline/bylaws/parameters.py` uses the exact same plain title logic as `formatPlainDocumentTitle` in `lib/plain-language.ts` — zero free-text or hard-coded instrument names anywhere in `pipeline/` or `app/`/`components/`/`lib/`.
2. **Name Check in CI (`pipeline/tests/test_release_and_copy_consistency.py`, `scripts/check_page_budgets.mjs`)**:
   - Add an automated CI check that extracts all instrument references (`Replaced by <name>, <date>`, source citations, `"Changed …"` tags, timeline entries, and precedence citations) across `parameters.json`, `consolidated.json`, `relations.json`, `resolution.yaml`, and built HTML pages, and verifies that **every** instrument name and date matches a registered entry in `documents.json`. Any unregistered name or date (such as `"20 January 2026"`) fails the build.

### Part 4 — "Not Settled" Only When It Is

1. **Record Applicability Clauses in the Dataset (`schemas/parameters.schema.json` / `schemas/relations.schema.json` / `schemas/resolution.schema.json`, `pipeline/bylaws/parameters.py`, `lib/plain-language.ts`)**:
   - Before reporting an overlap between current in-force parameter rules (`check_parameter_overlaps` and `check_band_continuity` in `pipeline/bylaws/parameters.py`, and `computeSubjectBandContinuityNotices` in `lib/plain-language.ts`), check whether an in-force clause states which table or rule applies to which case.
   - Record such clauses as **applicability rules** (`applicability_rules` in `parameters.json` or `resolution.yaml`, with schema validation in `schemas/parameters.schema.json`), carrying:
     - `rule_id`, `subject` (`"setbacks"`), `dimension` (`"building_height_m"`), `range_settled` (`"11.5 m to 12 m"`),
     - `plain_explanation`: `"Buildings up to 12 m use Table 8; taller buildings use Table 9 (clauses 3.1(ii) and (iii), January 2026)."` (and noting that plots up to `250 m²` with height up to `15 m` including stilt floor also use `Table 8`),
     - `unreachable_table_note`: small note attached to rows made unreachable over that sub-band (specifically `Table 9` Row 1 `"Above 11.5 mtrs up to 15.0 mtrs"`: `"Applies above 12 m (clauses 3.1(ii)–(iii) send buildings up to 12 m, and plots up to 250 m² up to 15 m, to Table 8)"`),
     - `authorities[]`: verbatim quoted text, `doc_id` (`rmp2015-zr-amend-2026-01`), `eid` (`item_2_2__item_a__item_ii` and `item_2_2__item_a__item_iii`), `clause_number` (`3.1(ii)` and `3.1(iii)`), `page`, and `page_link` verified against the cited page by the Part 2 citation check.
2. **Explain Settled Cases Under "Why this rule applies" Instead of Showing "Not settled" (`app/j/[id]/topics/[topic]/page.tsx`, `lib/plain-language.ts`)**:
   - When an applicability rule decides an apparent table range overlap (specifically the `11.5 m` to `12.0 m` band between 2026 `Table 8` and 2007 `Table 9` on **Setbacks** and **Height**):
     - Do **NOT** render a `"Not settled: two rules apply"` warning banner.
     - Instead, under **"Why this rule applies"**, display the one plain line:
       `"Buildings up to 12 m use Table 8; taller buildings use Table 9 (clauses 3.1(ii) and (iii), January 2026)."`
       with the verbatim quotes of `3.1(ii)` and `3.1(iii)` and their PDF page links one tap away inside the `<details>` disclosure.
     - Mark the `Table 9` `above 11.5 to 15 m` row in the Setbacks table with the small note explaining that `11.5 m` to `12 m` is governed by `Table 8` under `3.1(ii)`–`(iii)`, not as a conflict.
   - Keep `"Not settled: two rules apply"` strictly for genuine overlaps where **no** in-force applicability clause decides which rule applies.
3. **Falsifiable Tests for Applicability Rules (`pipeline/tests/test_parameters.py`, `__tests__/`)**:
   - Verify that the Setbacks `11.5 m` to `12 m` band is **not** shown as `"Not settled"` and is instead explained under `"Why this rule applies"` with the quoted text of `3.1(ii)` and `3.1(iii)`.
   - Verify that a constructed overlap between two in-force rows with **no** applicability clause still triggers `"Not settled"` / fails unexplained overlap checks as appropriate.

### Part 5 — Corporation Wording for Bye-law `6.0(i)` and Strict Bye-law `1.4` Subject Labelling

1. **Show Each Corporation's Current May 2026 Wording for Bye-law `6.0(i)` (`jurisdictions/in-ka-bengaluru-*.yaml`, `data/overrides/in-ka-bengaluru-*/overrides.yaml`, `pipeline/bylaws/amendments.py`, `pipeline/bylaws/consolidate.py`, `app/j/[id]/topics/[topic]/page.tsx`, `app/j/[id]/documents/[doc]/page.tsx`)**:
   - Verify and ensure that in all five City Corporations (`central`, `north`, `south`, `east`, `west`), the May 2026 Building (Amendment) Bye-laws (`{bcc,bncc,bscc,becc,bwcc}-bbl-amend-2026-05`, Clause 3 substituting Bye-law `6.0(i)` / `part_II__sec_6.0__cl_6.0__item_i` or `part_II__sec_6.0__cl_6.0`) are linked and applied to `bbl-2003` with the exact verbatim wording from each corporation's May 2026 gazette PDF, citing the exact page of that corporation's May 2026 PDF where `6.0(i)` appears.
   - In each corporation view (`/j/in-ka-bengaluru-{central,north,south,east,west}/topics/...` and `/j/in-ka-bengaluru-{...}/documents/bbl-2003`):
     - Bye-law `6.0(i)` shows that corporation's current wording from its May 2026 amendment, tagged `"Changed May 2026, [corporation]"` (e.g. `"Changed May 2026, Bengaluru North City Corporation"`), with the 2003 previous wording (`"within 5% of…"`) on tap inside `"Details & previous wording"` and the citation (`p. N`) pointing to the May 2026 amendment's page.
2. **Plain Note on `6.0(i)` in the Greater Bengaluru View (`app/j/[id]/topics/[topic]/page.tsx`, `components/ClauseTree.tsx`, `data/overrides/in-ka-bengaluru/overrides.yaml`)**:
   - On the Greater Bengaluru view (`/j/in-ka-bengaluru/...`), Bye-law `6.0(i)` shows the 2003 wording with the plain note:
     `"Each City Corporation changed this rule in May 2026. Choose a corporation to see its wording."`
3. **Restrict `"Master plan rules apply instead (bye-law 1.4)"` Strictly to Bye-law `1.4` Subjects (`app/j/[id]/topics/[topic]/page.tsx`, `lib/plain-language.ts`, `pipeline/bylaws/annotations.py`)**:
   - Bye-law `1.4` (`Clause 1(3)` of the 2017 notification) hands only specific subjects to the Master Plan Zoning Regulations:
     `use`, `land use`, `coverage`, `FAR`, `setback or open space`, `height`, `number of storeys`, `number of dwelling units`, and `parking`.
   - Remove the `"Master plan rules apply instead (bye-law 1.4)"` label from `6.0(i)` (which governs condonable construction deviation limits and compounding, not a Bye-law `1.4` subject), ensure `6.0(i)` is not miscategorized as a displaced zoning rule on any subject page, and remove `"Master plan rules apply instead (bye-law 1.4)"` from any other provision outside the subjects Bye-law `1.4` lists.
4. **Label Check in CI (`pipeline/tests/test_release_and_copy_consistency.py`, `scripts/check_page_budgets.mjs`)**:
   - Add an automated CI check verifying that `"Master plan rules apply instead (bye-law 1.4)"` appears **only** on provisions/rows belonging to the subjects listed in Bye-law `1.4` (`land-use`, `ground-coverage`, `far`, `setbacks`, `height`, `parking`, `plot-size-and-frontage`, `road-width`, `basements-and-stilts`, `projections-and-open-spaces` — never on `6.0(i)` or non-Bye-law-1.4 provisions such as deviations/compounding, plan sanction, occupancy certificates, fire safety, or definitions).

### Pull Request, Progress Tracking & Visual Verification

- Open one draft pull request with the preview URL at the top.
- Commit and push after each part (Part 1, Part 2, Part 3, Part 4, Part 5); keep `docs/progress.md` current after each part.
- Keep the PR description updated with:
  - Cause of the stale city view
  - Counts: shared-content differences found and fixed, citations corrected, instrument names unified, `"not settled"` warnings removed or kept
  - **For owner review**: any instrument name that could not be matched to the register; any overlap still `"not settled"`
  - **Decisions made**
  - **Known gaps**
  - **Screenshots**: Setbacks in Greater Bengaluru (`/j/in-ka-bengaluru/topics/setbacks`) and North (`/j/in-ka-bengaluru-north/topics/setbacks`) views at `390 px` and `1280 px`.

## Affected Memory

- `architecture/overview`: (modify) Document unified one-step dataset build across Greater Bengaluru and the 5 City Corporations with shared-content and same-build dataset ID CI gates, amending-page citation propagation and strict page-level quote/table-row fidelity checks, register-driven single instrument name/date enforcement, applicability clauses (`3.1(ii)` and `3.1(iii)`) settling the `11.5 m`–`12 m` setback height band under `"Why this rule applies"`, and corporation-specific May 2026 wording for Bye-law `6.0(i)` with `"Master plan rules apply instead (bye-law 1.4)"` restricted strictly to Bye-law `1.4` subjects.
- `schemas/data-contracts`: (modify) Document `applicability_rules` schema contract on `parameters.schema.json` (recording statutory clauses that settle apparent table range overlaps and mark unreachable sub-bands) and dataset build identifier metadata on `manifest.schema.json`.

## Impact

- **Python Pipeline (`pipeline/bylaws/`)**:
  - `pipeline/bylaws/amendments.py` & `pipeline/bylaws/consolidate.py`: Propagate amending clause citations (`page`, `bbox`, `text_excerpt` from `amending_doc`) to `new_nodes` and node `versions`; link all 5 City Corporations' May 2026 `6.0(i)` substitutions (`{bcc,bncc,bscc,becc,bwcc}-bbl-amend-2026-05`); format change marks as `"Changed May 2026, [corporation]"` for corporation amendments; unify `2026-01-05` snapshot date with the register.
  - `pipeline/bylaws/parameters.py`: Use canonical register plain title and date (`5 January 2026`) for all `Replaced by …` notes; record `applicability_rules` (clauses `3.1(ii)` and `3.1(iii)` settling the `11.5 m`–`12.0 m` setback table transition and marking `Table 9`'s `11.5`–`12 m` sub-band with an applicability note); update `check_parameter_overlaps` and `check_band_continuity` so overlaps settled by an in-force applicability clause are reported as settled rather than `"not settled"`.
  - `pipeline/bylaws/fidelity.py`: Enforce strict page-level citation verification for every provision version (`v1` and `v2+`), every parameter table row (`cell_text` / `row_header` on `source.page`), every applicability/resolution quote, and home-page FAR story excerpts against the exact cited page of the cited document.
  - `pipeline/bylaws/publish.py` & `scripts/sync_storage.py` & `scripts/ensure_data.mjs`: Build and publish city and corporation views in one step with a shared `dataset_id`, push the updated bundle to storage, and verify dataset digest integrity on pull/build.
- **Schemas & Codegen (`schemas/`, `pipeline/bylaws/models/_generated.py`, `lib/types/generated.ts`)**:
  - `schemas/parameters.schema.json` & `schemas/manifest.schema.json`: Add optional `applicability_rules` and `dataset_id` fields and run `make generate`.
- **Data Configurations & Overrides (`jurisdictions/`, `data/overrides/`)**:
  - `jurisdictions/in-ka-bengaluru*.yaml` & `data/overrides/in-ka-bengaluru*/overrides.yaml`: Verify exact `amending_clause` EIDs and citation pages for `3.1(ii)`, `3.1(iii)`, `3.9(iii)`, `3.10(i)`, `4.1.2(b)`, `4.1.2(c)`, `4.5`, `4.7`, and `bbl-2003` `6.0(i)` across all 5 corporations; add the Greater Bengaluru `notes_by_site` on `bbl-2003` `6.0(i)` (`"Each City Corporation changed this rule in May 2026. Choose a corporation to see its wording."`).
- **Next.js Web Application (`app/`, `components/`, `lib/`)**:
  - `lib/data.ts`: Fix `fetchJurisdictionDataset` so hydrated amendment versions preserve the amending clause's citations (`page` in `amending_doc`) instead of copying `c.citations` from the base document; expose `dataset_id`.
  - `lib/plain-language.ts`: Canonical register-driven `formatPlainDocumentTitle` and date formatting; applicability-aware `computeSubjectBandContinuityNotices` and `BYELAW_1_4_SUBJECT_SLUGS` guard for `"Master plan rules apply instead (bye-law 1.4)"`.
  - `app/j/[id]/topics/[topic]/page.tsx`: Render `dataset_id` attribute; render applicability rule one-line explanation + tap-to-open quote under `"Why this rule applies"` instead of `"Not settled"` when settled; show unreachable sub-band note on `Table 9` `11.5`–`12 m` row; show corporation wording and `"Changed May 2026, [corporation]"` tag on `6.0(i)` in corporation views and the plain May 2026 note in the Greater Bengaluru view; never apply `"Master plan rules apply instead (bye-law 1.4)"` outside Bye-law `1.4` subjects.
- **CI & Test Suites (`pipeline/tests/`, `__tests__/`, `e2e/`, `scripts/check_page_budgets.mjs`)**:
  - Shared-content check, same-build `dataset_id` check, strict page citation check, register instrument name/date check, applicability/"not settled" unit tests, and Bye-law `1.4` label check in CI.

## Open Questions

None — `docs/plans/one-build-correct-citations-plan.md` is self-contained and specifies all 5 parts, CI checks, and acceptance criteria.

## Assumptions

| # | Grade | Decision | Rationale | Scores |
|---|-------|----------|-----------|--------|
| 1 | Certain | Diagnose the stale Greater Bengaluru view, generate the city view and all five corporation views in one build step from one dataset with a single shared dataset identifier, update the remote storage bundle, and enforce shared-content and same-build checks in CI | Explicitly specified in `docs/plans/one-build-correct-citations-plan.md` §3 Decision 1, §5 Part 1.1–1.5, and §7 | S:100 R:90 A:95 D:100 |
| 2 | Certain | Make every amended provision cite the amending instrument's exact PDF page where its replacement wording appears (while keeping the original document and page citation on the previous wording in Details), and enforce a CI citation check verifying that every quoted provision wording, table row, and excerpt appears on its cited page | Explicitly specified in `docs/plans/one-build-correct-citations-plan.md` §2, §3 Decision 2, §5 Part 2.1–2.4, and §7 | S:100 R:90 A:95 D:100 |
| 3 | Certain | Derive every instrument's plain name and date strictly from its source register entry, resolve `"Zoning Regulations Amendment (Setbacks, Basements and Industrial Norms), 20 January 2026"` to the registered 5 January 2026 notification (`rmp2015-zr-amend-2026-01`, `No. UDD 235 MNJ 2025(E)`), and enforce a CI name/date check across built pages and data artifacts | Explicitly specified in `docs/plans/one-build-correct-citations-plan.md` §2, §3 Decision 3, §5 Part 3.1–3.3, and §7 | S:100 R:95 A:95 D:100 |
| 4 | Certain | Record applicability clauses (`3.1(ii)` and `3.1(iii)` as amended in January 2026) in the dataset with their verbatim quotes and citations; do not show `"not settled"` when an in-force applicability clause decides the transition, instead adding one plain line under `"Why this rule applies"` (`"Buildings up to 12 m use Table 8; taller buildings use Table 9 (clauses 3.1(ii) and (iii), January 2026)"` with quote on tap) and marking Table 9's 11.5–12 m band with a small note | Explicitly specified in `docs/plans/one-build-correct-citations-plan.md` §2, §3 Decision 4, §5 Part 4.1–4.4, and §7 | S:100 R:90 A:95 D:100 |
| 5 | Certain | Show each City Corporation's current May 2026 wording for bye-law `6.0(i)` tagged `"Changed May 2026, [corporation]"` with previous wording on tap and citation pointing to the amendment's page; show the 2003 wording on Greater Bengaluru with `"Each City Corporation changed this rule in May 2026. Choose a corporation to see its wording."`; and restrict `"Master plan rules apply instead (bye-law 1.4)"` strictly to Bye-law 1.4 subjects with a CI check | Explicitly specified in `docs/plans/one-build-correct-citations-plan.md` §2, §3 Decision 5, §5 Part 5.1–5.4, and §7 | S:100 R:90 A:95 D:100 |

5 assumptions (5 certain, 0 confident, 0 tentative, 0 unresolved).
