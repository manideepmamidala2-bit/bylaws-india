# Plan: Bylaw One: One Build, Correct Citations

**Change**: 261126-mspg-one-build-correct-citations
**Intake**: `intake.md`

## Requirements

### Architecture & Build Pipeline: One Build for Every View (Part 1)

#### R1: Unified Dataset Build, Shared-Content Parity, and Same-Build Verification
The pipeline (`pipeline/bylaws/parameters.py`, `pipeline/bylaws/amendments.py`, `pipeline/bylaws/publish.py`), storage sync (`scripts/sync_storage.py`, `scripts/ensure_data.mjs`), and Next.js web application (`lib/data.ts`, `app/layout.tsx`, `app/j/[id]/topics/[topic]/page.tsx`) MUST generate the Greater Bengaluru view (`in-ka-bengaluru`) and all five City Corporation views (`in-ka-bengaluru-central`, `-north`, `-south`, `-east`, `-west`) in one build step from one dataset with a single shared `dataset_id`:
1. Diagnose why the Greater Bengaluru view was built from older data than the corporation views (`param_0132` vs `param_0127`, unamended `3.1(ii)` wording, and `"Replaced for this subject..."` on Bye-law `1.4`) and record the exact root cause in `docs/progress.md` and the PR description.
2. Remove any separate or stale cached path for the city view (`in-ka-bengaluru` vs `in-ka-bengaluru-south` vs child corporations), ensure `in-ka-bengaluru` and all five corporations share one canonical `parameters.json` and consolidated shared documents, stamp a single deterministic `dataset_id` in `public/data/manifest.json` and every rendered HTML page (`data-dataset-id`), and push the updated storage bundle (`data-v4.0.0`) so Vercel builds from the current dataset.
3. Enforce a **Shared-content check (CI)** verifying that for every subject and every shared rule or provision (one not introduced or amended by a corporation's own instrument), the content shown in the Greater Bengaluru city view and in each of the five corporation views is identical (value, conditions, wording, source document name, date, page, status). Any difference fails the build.
4. Enforce a **Same-build check (CI)** verifying that every built HTML page carries one `dataset_id` and that all built pages match.
5. Verify after deploy that the Greater Bengaluru Setbacks page (`/j/in-ka-bengaluru/topics/setbacks`) shows the 2007 industrial row (`4.5 m`) under **Older or replaced rules**, `3.1(ii)` in its January 2026 wording, and no `"Replaced"` label on Bye-law `1.4`.

- **GIVEN** the published datasets for `in-ka-bengaluru` and the five City Corporations and the built Next.js application
- **WHEN** the CI shared-content check, same-build check, and Playwright browser tests execute
- **THEN** every built HTML page carries the exact same non-empty `data-dataset-id`, every shared parameter row and governing provision on `/j/in-ka-bengaluru/topics/[topic]` is byte-for-byte identical in value, conditions, wording, source name, date, page (`p. N`), and status to `/j/in-ka-bengaluru-{central,north,south,east,west}/topics/[topic]`, and `/j/in-ka-bengaluru/topics/setbacks` shows the 2007 industrial setback row under **Older or replaced rules**, `3.1(ii)` in its January 2026 wording, and no `"Replaced"` label on Bye-law `1.4`

### Provenance & Fidelity: Correct Page Citations for Amended Provisions (Part 2)

#### R2: Amending-Page Citations and Machine-Enforced Page-Level Citation Verification
Every provision whose current wording comes from an amending instrument MUST cite (page number and official/archive `#page=N` links) the **amending instrument's exact PDF page where that wording appears**, not the original base document's page:
1. In `pipeline/bylaws/amendments.py`, `jurisdictions/in-ka-bengaluru*.yaml`, `data/overrides/in-ka-bengaluru*/overrides.yaml`, and `lib/data.ts` (`fetchJurisdictionDataset`), propagate the amending clause's exact `citations` (`doc_id`, `page`, `bbox`, `text_excerpt`) onto `effect.new_nodes` and `node.versions` so amended versions never inherit the original base document's page number.
2. Preserve the original document and its page citation on the previous wording (`versions[0]`) inside `"Details & previous wording"`.
3. Enforce a **Citation check (CI)** (`pipeline/bylaws/fidelity.py`, `pipeline/tests/test_text_fidelity.py`) verifying that for every quoted provision wording (base `v1` and amended `v2+`), every parameter table row (`cell_text` and `row_header`), every applicability/resolution quote, and every home-page excerpt, the text is found on the **exact cited page** of the **cited document** using the stored page text. Any mismatch fails the build. Report the number of citations corrected in `docs/progress.md` and the PR description.
4. Verify in unit tests that `3.1(ii)`, `3.1(iii)`, and `3.10(i)` cite the January 2026 notification (`rmp2015-zr-amend-2026-01`) at the exact pages where their text appears (`p. 2` for `3.1(ii)` and `3.1(iii)`, `p. 3` for `3.10(i)`), while their previous wording cites `rmp2015-zr` at `p. 20` and `p. 24`.

- **GIVEN** all structured clause trees, consolidated provisions, `parameters.json` rows, `resolution.yaml` / applicability quotes, and home-page excerpts
- **WHEN** `verify_jurisdiction_text_fidelity` and `pytest pipeline/tests/test_text_fidelity.py` execute
- **THEN** 100% of quoted provision wordings (including amended versions), parameter table rows, applicability quotes, and home-page excerpts are verified to appear on the exact cited page of their cited document
- **AND** `3.1(ii)` and `3.1(iii)` cite `rmp2015-zr-amend-2026-01` at `p. 2` and `3.10(i)` cites `rmp2015-zr-amend-2026-01` at `p. 3`, while their previous wording in Details cites `rmp2015-zr` at `p. 20` and `p. 24`

### Source Register Consistency: One Name and Date per Instrument (Part 3)

#### R3: Single Register-Backed Plain Name and Date per Instrument
Every reference to an instrument across the pipeline, published JSON artifacts, and rendered web pages (`Replaced by …` labels, Sources, `"Changed …"` tags, What changed timeline, Why this rule applies, and precedence/resolution steps) MUST derive its plain name and date strictly from its source register entry (`documents.json` / `jurisdictions/*.yaml`), with zero free-text instrument names:
1. Resolve the `"Zoning Regulations Amendment (Setbacks, Basements and Industrial Norms), 20 January 2026"` (`2026-01-20`) label by confirming from existing repository data that it refers to `rmp2015-zr-amend-2026-01` (`No. UDD 235 MNJ 2025(E)`, dated `5 January 2026`, `2026-01-05`), and replace all occurrences with the register's plain name and date (`5 January 2026`).
2. Unify plain document title formatting between Python (`pipeline/bylaws/parameters.py`, `pipeline/bylaws/consolidate.py`) and TypeScript (`lib/plain-language.ts`, `lib/data.ts`) so each instrument has exactly one plain name and one date across the entire site.
3. Enforce a **Name check (CI)** (`pipeline/tests/test_release_and_copy_consistency.py`, `scripts/check_page_budgets.mjs`) verifying that no instrument reference in `parameters.json`, `consolidated.json`, `relations.json`, `resolution.yaml`, or built HTML pages uses a name or date that is not in the source register.

- **GIVEN** the source register (`documents.json`), published datasets, and built HTML pages
- **WHEN** the CI instrument name and date check executes
- **THEN** every `Replaced by <name>, <date>` label, source citation, timeline entry, and precedence reference matches the exact plain name and date of a registered document in `documents.json`, and zero occurrences of `"20 January 2026"`, `"2026-01-20"`, or `"Zoning Regulations Amendment (Setbacks, Basements and Industrial Norms)"` remain

### Statutory Applicability & Band Continuity: "Not Settled" Only When It Is (Part 4)

#### R4: Applicability Rules for Table Transitions and True "Not Settled" Overlaps
Before reporting an overlap between current rules, the pipeline (`pipeline/bylaws/parameters.py`) and web UI (`lib/plain-language.ts`, `app/j/[id]/topics/[topic]/page.tsx`) MUST check whether an in-force clause states which rule applies to which case:
1. Record in-force applicability clauses (`3.1(ii)` and `3.1(iii)` as amended in January 2026 for setbacks) as structured `applicability_rules` in `parameters.json` (validated by `schemas/parameters.schema.json`), with their verbatim quoted text, `doc_id`, `eid`, `clause_number`, `page`, and `page_link`.
2. When an applicability rule decides the case (specifically `3.1(ii)` sending buildings up to `12 m` to `Table 8` and `3.1(iii)` sending buildings above `12 m` to `Table 9`, with `Table 8` also applying to plots up to `250 m²` and height up to `15 m`), do **NOT** show `"Not settled: two rules apply"`. Instead:
   - Under **"Why this rule applies"**, display one plain line: `"Buildings up to 12 m use Table 8; taller buildings use Table 9 (clauses 3.1(ii) and (iii), January 2026)."` with the verbatim quote and page link on tap.
   - Mark rows made unreachable over that sub-band (specifically `Table 9`'s `11.5 to 12 m` portion of the `above 11.5 up to 15 m` row) with a small note, not as conflicts.
3. Keep `"Not settled: two rules apply"` for genuine overlaps where no in-force clause decides which rule applies.
4. Verify in unit tests that the setbacks `11.5 to 12 m` band is not shown as `"not settled"` and that a constructed overlap with no applicability clause still is.

- **GIVEN** the Setbacks subject page (`/j/[id]/topics/setbacks`) and `parameters.json`
- **WHEN** `check_parameter_overlaps`, `check_band_continuity`, `computeSubjectBandContinuityNotices`, and the Setbacks page render execute
- **THEN** `parameters.json` contains the `applicability_rules` entry for `3.1(ii)` and `3.1(iii)` verified against `rmp2015-zr-amend-2026-01` p. 2, no `"Not settled"` banner is shown for the `11.5 m` to `12 m` band, `"Why this rule applies"` includes `"Buildings up to 12 m use Table 8; taller buildings use Table 9 (clauses 3.1(ii) and (iii), January 2026)."` with the verbatim quote on tap, `Table 9`'s `above 11.5 up to 15 m` row carries the small applicability note, and a constructed overlap without an applicability rule still produces a `"Not settled"` finding

### Corporation Amendments & Subject Scope: Bye-law `6.0(i)` and Bye-law `1.4` Labels (Part 5)

#### R5: Corporation Wording for Bye-law `6.0(i)` and Strict Bye-law `1.4` Subject Labelling
The pipeline (`pipeline/bylaws/amendments.py`, `pipeline/bylaws/consolidate.py`, `jurisdictions/in-ka-bengaluru-*.yaml`, `data/overrides/`) and web UI (`app/j/[id]/topics/[topic]/page.tsx`, `app/j/[id]/documents/[doc]/page.tsx`, `components/ClauseTree.tsx`, `lib/plain-language.ts`) MUST present each City Corporation's current wording for Bye-law `6.0(i)` and restrict the Bye-law `1.4` displacement label strictly to Bye-law `1.4` subjects:
1. In each corporation view (`in-ka-bengaluru-central`, `-north`, `-south`, `-east`, `-west`), Bye-law `6.0(i)` MUST show that corporation's current wording from its May 2026 amendment (`{bcc,bncc,bscc,becc,bwcc}-bbl-amend-2026-05`), tagged `"Changed May 2026, [corporation]"` (e.g. `"Changed May 2026, Bengaluru North City Corporation"`), with the 2003 previous wording (`"within 5% of…"`) on tap and the citation pointing to the May 2026 amendment's page.
2. On the Greater Bengaluru view (`in-ka-bengaluru`), Bye-law `6.0(i)` MUST show the 2003 wording with a plain note: `"Each City Corporation changed this rule in May 2026. Choose a corporation to see its wording."`
3. Remove the `"Master plan rules apply instead (bye-law 1.4)"` label from `6.0(i)` and from any other provision outside the subjects Bye-law `1.4` lists (`use`, `land use`, `coverage`, `FAR`, `setback or open space`, `height`, `number of storeys`, `number of dwelling units`, `parking`).
4. Enforce a **Label check (CI)** verifying that `"Master plan rules apply instead (bye-law 1.4)"` appears only on provisions tagged to Bye-law `1.4` subjects and never on `6.0(i)` or non-Bye-law-1.4 provisions.

- **GIVEN** the Greater Bengaluru view and all five City Corporation views
- **WHEN** Bye-law `6.0(i)` is rendered on subject pages and `/j/[id]/documents/bbl-2003`, and the CI label check runs
- **THEN** each corporation view shows its May 2026 substituted wording for `6.0(i)` tagged `"Changed May 2026, [corporation]"` citing the May 2026 amendment's page with the 2003 wording on tap, the Greater Bengaluru view shows the 2003 wording with `"Each City Corporation changed this rule in May 2026. Choose a corporation to see its wording."`, and `"Master plan rules apply instead (bye-law 1.4)"` never appears on `6.0(i)` or outside Bye-law `1.4` subjects

### Non-Goals

- Acquiring new external PDFs or map sheets — scope is strictly existing repository data (`docs/plans/one-build-correct-citations-plan.md` §3 Decision 6).
- Changing the **Bylaw One** (`dg2n`) visual design or typography (`docs/plans/one-build-correct-citations-plan.md` §3 Decision 6).
- Inventing, paraphrasing, or rewriting any legal provision text (`docs/plans/one-build-correct-citations-plan.md` §4).

### Design Decisions

#### Unified Dataset Build Stamp (`dataset_id`) and Parent-Shared Loader
**Decision**: Stamp a deterministic `dataset_id` (computed from the SHA-256 of the shared parent and child release digests) in `public/data/manifest.json` (`schemas/manifest.schema.json`), render `data-dataset-id` on the root layout / jurisdiction pages, ensure `lib/data.ts` loads shared documents, clauses, amendments, and parameters for `in-ka-bengaluru` and all five child City Corporations from the same canonical release files, and verify both shared-content identity and `dataset_id` uniformity in CI.
**Why**: Eliminates any divergence between the default Greater Bengaluru view and the five City Corporation views and guarantees that stale partial builds or unsynchronized storage bundles fail CI immediately.
**Rejected**: Allowing child corporations and the parent city view to maintain independent copies of shared `parameters.json` or `rmp2015-zr` amendments without a cross-view CI gate.
*Introduced by*: 261126-mspg-one-build-correct-citations

#### Amending-Clause Citation Propagation and Strict Page-Level Fidelity Check
**Decision**: Propagate the amending node's `citations` (`doc_id`, `page`, `bbox`, `text_excerpt`) onto `AmendmentEffect.new_nodes` and `NodeVersion.citations` in `pipeline/bylaws/amendments.py` and `lib/data.ts`, while keeping the base document's original `citations` on `versions[0]`, and enforce exact-page verification in `pipeline/bylaws/fidelity.py` across all provision versions, parameter table cells/row headers, applicability/resolution quotes, and home-page excerpts.
**Why**: Ensures every `"p. N"` link on an amended provision opens the exact page of the amending gazette PDF where the substituted text is printed, while `"Details & previous wording"` links to the original page of the base document.
**Rejected**: Carrying over `target_node.citations` onto amended `NodeVersion` entries or allowing `±1` page tolerance to mask off-by-one citation pages.
*Introduced by*: 261126-mspg-one-build-correct-citations

#### Structured `applicability_rules` for Statutory Table Transitions
**Decision**: Add an `applicability_rules` array to `schemas/parameters.schema.json` and `parameters.json` recording in-force clauses (such as `rmp2015-zr` `3.1(ii)` and `3.1(iii)` as substituted in January 2026) that govern which table applies across boundary heights/areas, surfacing a one-line explanation and tap-to-open verbatim quote under `"Why this rule applies"` and a small note on unreachable table sub-bands instead of a false `"Not settled"` warning.
**Why**: Distinguishes an apparent arithmetic overlap between table headers (`Table 8` `<= 12 m` vs `Table 9` `> 11.5 m`) that is explicitly settled by the governing text (`3.1(ii)` and `3.1(iii)`) from a genuine statutory conflict where no in-force clause decides.
**Rejected**: Altering the printed `11.5 m` number in `Table 9` (violates verbatim data integrity) or continuing to display a false `"Not settled: two rules apply"` warning when `3.1(ii)` and `3.1(iii)` settle the boundary.
*Introduced by*: 261126-mspg-one-build-correct-citations

## Tasks

### Phase 1: One Build for Every View & Correct Page Citations (Parts 1 & 2)

- [x] T001 Diagnose why the Greater Bengaluru view was stale (`docs/progress.md`), unify the parent/corporation dataset build and loader with a single `dataset_id` (`schemas/manifest.schema.json`, `pipeline/bylaws/publish.py`, `scripts/sync_storage.py`, `scripts/ensure_data.mjs`, `lib/data.ts`, `app/layout.tsx`), open the draft PR with the preview URL at the top, add the CI shared-content check and same-build `dataset_id` check (`pipeline/tests/test_pr12_greater_bengaluru.py`, `scripts/check_page_budgets.mjs`), verify Greater Bengaluru Setbacks, and commit and push Part 1 <!-- R1 -->
- [ ] T002 Propagate amending instrument page citations to `AmendmentEffect.new_nodes`, `NodeVersion.citations`, and `lib/data.ts` (`pipeline/bylaws/amendments.py`, `pipeline/bylaws/consolidate.py`, `jurisdictions/in-ka-bengaluru*.yaml`, `data/overrides/in-ka-bengaluru*/overrides.yaml`, `lib/data.ts`), preserve original citations on previous wording, enforce strict exact-page citation verification in CI for every provision quote, parameter table row, and excerpt (`pipeline/bylaws/fidelity.py`, `pipeline/tests/test_text_fidelity.py`), add unit tests for `3.1(ii)`, `3.1(iii)`, and `3.10(i)`, update `docs/progress.md` and the PR, and commit and push Part 2 <!-- R2 -->

### Phase 2: Register Names/Dates, Applicability Rules & Bye-law 6.0(i) (Parts 3, 4 & 5)

- [ ] T003 Unify all instrument names and dates from the source register across pipeline and web (`jurisdictions/in-ka-bengaluru*.yaml`, `pipeline/bylaws/parameters.py`, `pipeline/bylaws/consolidate.py`, `lib/plain-language.ts`, `lib/data.ts`), resolve `"Zoning Regulations Amendment (Setbacks, Basements and Industrial Norms), 20 January 2026"` (`2026-01-20`) to the registered `5 January 2026` notification (`rmp2015-zr-amend-2026-01`), add the CI instrument name and date check (`pipeline/tests/test_release_and_copy_consistency.py`, `scripts/check_page_budgets.mjs`), update `docs/progress.md` and the PR, and commit and push Part 3 <!-- R3 -->
- [ ] T004 Record in-force `applicability_rules` (`3.1(ii)` and `3.1(iii)`) in `schemas/parameters.schema.json` and `pipeline/bylaws/parameters.py`, update `check_parameter_overlaps`, `check_band_continuity`, `computeSubjectBandContinuityNotices`, and `app/j/[id]/topics/[topic]/page.tsx` so settled table transitions show the one-line explanation (`"Buildings up to 12 m use Table 8; taller buildings use Table 9 (clauses 3.1(ii) and (iii), January 2026)"`) with verbatim quote on tap under `"Why this rule applies"` and a small note on unreachable `Table 9` rows (`11.5–12 m`) instead of `"Not settled"`, add unit tests (`pipeline/tests/test_parameters.py`, `__tests__/`), update `docs/progress.md` and the PR, and commit and push Part 4 <!-- R4 -->
- [ ] T005 Link and display each City Corporation's May 2026 substituted wording for Bye-law `6.0(i)` tagged `"Changed May 2026, [corporation]"` with previous wording on tap and May 2026 page citation (`jurisdictions/in-ka-bengaluru-*.yaml`, `data/overrides/in-ka-bengaluru*/overrides.yaml`, `pipeline/bylaws/amendments.py`, `pipeline/bylaws/consolidate.py`, `app/j/[id]/topics/[topic]/page.tsx`, `components/ClauseTree.tsx`), display the 2003 wording with `"Each City Corporation changed this rule in May 2026. Choose a corporation to see its wording."` on Greater Bengaluru, remove `"Master plan rules apply instead (bye-law 1.4)"` outside Bye-law `1.4` subjects with a CI check (`pipeline/tests/test_release_and_copy_consistency.py`, `scripts/check_page_budgets.mjs`), capture `390 px` and `1280 px` screenshots, update `docs/progress.md` and the PR, and commit and push Part 5 <!-- R5 -->

## Acceptance

### Functional Completeness

- [ ] A-001 R1: Root cause of the stale Greater Bengaluru view is documented in `docs/progress.md` and the PR description, and the city view and all five corporation views are generated in one step from one dataset with a single matching `dataset_id`.
- [ ] A-002 R1: Shared-content CI check and same-build `dataset_id` CI check run in `pytest` and `scripts/check_page_budgets.mjs`, verifying identical shared parameter rows and governing provisions between `in-ka-bengaluru` and all five City Corporations.
- [ ] A-003 R2: Every amended provision (`3.1(ii)`, `3.1(iii)`, `3.9(iii)`, `3.10(i)`, `4.1.2(b)`, `4.1.2(c)`, and corporation `bbl-2003` amendments) cites the amending instrument's exact PDF page where its wording appears, while its previous wording in Details cites the original document and page.
- [ ] A-004 R2: CI citation check (`pipeline/bylaws/fidelity.py`, `pipeline/tests/test_text_fidelity.py`) verifies that every quoted provision wording, parameter table row, applicability/resolution quote, and home-page excerpt appears on its exact cited page of its cited document.
- [ ] A-005 R3: Every reference to an instrument across published JSON and built HTML pages takes its plain name and date from the source register, `"20 January 2026"` (`2026-01-20`) is resolved to the registered `5 January 2026` notification, and the CI name/date check passes.
- [ ] A-006 R4: `applicability_rules` are recorded in `parameters.json` (with `3.1(ii)` and `3.1(iii)` quotes and citations), the Setbacks `11.5 to 12 m` band is explained in one line under `"Why this rule applies"` with quote on tap and a small note on `Table 9`'s `11.5–12 m` band, and `"Not settled"` is shown only when no in-force clause decides.
- [ ] A-007 R5: Bye-law `6.0(i)` shows each City Corporation's May 2026 wording tagged `"Changed May 2026, [corporation]"` with previous wording on tap and May 2026 page citation, shows the 2003 wording on Greater Bengaluru with `"Each City Corporation changed this rule in May 2026. Choose a corporation to see its wording."`, and `"Master plan rules apply instead (bye-law 1.4)"` appears only on Bye-law `1.4` subjects (enforced in CI).

### Behavioral Correctness

- [ ] A-008 R1: `/j/in-ka-bengaluru/topics/setbacks` shows the 2007 industrial row (`4.5 m`) under **Older or replaced rules**, `3.1(ii)` in its January 2026 wording, and no `"Replaced"` label on Bye-law `1.4`.
- [ ] A-009 R2: On Setbacks (`/j/[id]/topics/setbacks`), `3.1(ii)` and `3.1(iii)` link to `p. 2` of the 5 January 2026 notification (not `p. 20`), and `3.10(i)` links to `p. 3` (not `p. 24`).
- [ ] A-010 R4: The false `"Not settled: two rules apply — The current tables overlap between 11.5 m and 12 m."` warning is no longer displayed on `/j/[id]/topics/setbacks` or `/j/[id]/topics/height`.
- [ ] A-011 R5: In Bengaluru North (`/j/in-ka-bengaluru-north/...`) and the other four corporations, Bye-law `6.0(i)` does not display the 2003 `"within 5% of…"` text as current wording and does not carry `"Master plan rules apply instead (bye-law 1.4)"`.

### Scenario Coverage

- [ ] A-012 R2: Unit tests verify that `3.1(ii)`, `3.1(iii)`, and `3.10(i)` cite the January 2026 notification at the exact pages where their text appears and that a synthetic wrong-page citation fails `verify_jurisdiction_text_fidelity`.
- [ ] A-013 R4: Unit tests verify both that the setbacks `11.5 to 12 m` band is settled by `3.1(ii)`/`3.1(iii)` (not shown as `"not settled"`) and that a constructed overlap with no applicability clause is still flagged as `"not settled"`.
- [ ] A-014 R5: Unit and E2E tests verify `6.0(i)` wording across Greater Bengaluru and all five City Corporations and verify the CI Bye-law `1.4` label check.

### Edge Cases & Error Handling

- [ ] A-015 R3: Any un-registered instrument name or date injected into a `Replaced by …` note or HTML page causes the CI name check to fail deterministically.

### Code Quality

- [ ] A-016 Pattern consistency: New code follows naming, typing, and R1 (zero jurisdiction hard-coding) conventions of surrounding pipeline and Next.js code.
- [ ] A-017 No unnecessary duplication: Shared plain-title, date, and applicability formatting utilities are reused cleanly across modules without magic strings or God functions.
- [ ] A-018 Readability, composition, and test-alongside: Functions remain focused and composable, all schemas/codegen (`make generate`), `pytest`, `vitest` + `axe-core`, page budgets (`scripts/check_page_budgets.mjs`), and Playwright browser tests pass.

## Notes

- Check items as you review: `- [x]`
- All acceptance items must pass before `/fab-continue` (hydrate)
- If an item is not applicable, mark checked and prefix with **N/A**: `- [x] A-NNN **N/A**: {reason}`

## Assumptions

| # | Grade | Decision | Rationale | Scores |
|---|-------|----------|-----------|--------|
| 1 | Certain | Diagnose the stale Greater Bengaluru view, generate the city view and all five corporation views in one build step from one dataset with a single shared dataset identifier, update the remote storage bundle, and enforce shared-content and same-build checks in CI | Explicitly specified in `docs/plans/one-build-correct-citations-plan.md` §3 Decision 1, §5 Part 1.1–1.5, and §7 | S:100 R:90 A:95 D:100 |
| 2 | Certain | Make every amended provision cite the amending instrument's exact PDF page where its replacement wording appears (while keeping the original document and page citation on the previous wording in Details), and enforce a CI citation check verifying that every quoted provision wording, table row, and excerpt appears on its cited page | Explicitly specified in `docs/plans/one-build-correct-citations-plan.md` §2, §3 Decision 2, §5 Part 2.1–2.4, and §7 | S:100 R:90 A:95 D:100 |
| 3 | Certain | Derive every instrument's plain name and date strictly from its source register entry, resolve `"Zoning Regulations Amendment (Setbacks, Basements and Industrial Norms), 20 January 2026"` to the registered 5 January 2026 notification (`rmp2015-zr-amend-2026-01`, `No. UDD 235 MNJ 2025(E)`), and enforce a CI name/date check across built pages and data artifacts | Explicitly specified in `docs/plans/one-build-correct-citations-plan.md` §2, §3 Decision 3, §5 Part 3.1–3.3, and §7 | S:100 R:95 A:95 D:100 |
| 4 | Certain | Record applicability clauses (`3.1(ii)` and `3.1(iii)` as amended in January 2026) in the dataset with their verbatim quotes and citations; do not show `"not settled"` when an in-force applicability clause decides the transition, instead adding one plain line under `"Why this rule applies"` (`"Buildings up to 12 m use Table 8; taller buildings use Table 9 (clauses 3.1(ii) and (iii), January 2026)"` with quote on tap) and marking Table 9's 11.5–12 m band with a small note | Explicitly specified in `docs/plans/one-build-correct-citations-plan.md` §2, §3 Decision 4, §5 Part 4.1–4.4, and §7 | S:100 R:90 A:95 D:100 |
| 5 | Certain | Show each City Corporation's current May 2026 wording for bye-law `6.0(i)` tagged `"Changed May 2026, [corporation]"` with previous wording on tap and citation pointing to the amendment's page; show the 2003 wording on Greater Bengaluru with `"Each City Corporation changed this rule in May 2026. Choose a corporation to see its wording."`; and restrict `"Master plan rules apply instead (bye-law 1.4)"` strictly to Bye-law 1.4 subjects with a CI check | Explicitly specified in `docs/plans/one-build-correct-citations-plan.md` §2, §3 Decision 5, §5 Part 5.1–5.4, and §7 | S:100 R:90 A:95 D:100 |

5 assumptions (5 certain, 0 confident, 0 tentative).
