# Bylaw One: One Build, Correct Citations

**Date:** 26 November 2026 · **Basis:** a review of the live site (https://bylaws-india.vercel.app) on 26 November 2026 · **Scope:** existing data and the existing Bylaw One design; no new data

This plan is self-contained.

---

## 1. Intent

The site must give the same, correct answer whichever view a reader opens, and every link must take them to the exact page where the quoted text appears.

---

## 2. What the review found

**The default view is stale (most pressing)**
- Corporation views (e.g. Bengaluru North, Setbacks) show the corrected content: the 2007 industrial setback row moved to replaced rules; clause 3.1(ii) and 3.1(iii) in their January 2026 wording with the previous wording on tap; old bye-law rules labelled "Master plan rules apply instead (bye-law 1.4)"; "No differences for Bengaluru North City Corporation on this subject".
- The Greater Bengaluru view of the same subject, which every home-page link opens, still shows the uncorrected content: the 2007 industrial row (4.5 m) beside the 2026 row (12% of plot depth) for the same plots; 3.1(ii) in its 2007 wording as in force; bye-law 1.4 labelled "Replaced for this subject by the Master Plan Zoning Regulations under Bye-law 1.4".
- The two views come from different builds: the same 2007 row carries `param_0132` in the city view and `param_0127` in the North view.

**Wrong page citations for amended provisions**
- In the corrected view, the current wording of 3.1(ii) and 3.1(iii) cites the January 2026 notification at p. 20, and 3.10(i) at p. 24, while the same notification's tables are cited at p. 2 and p. 6. Pages 20 and 24 appear to be the original 2007 document's page numbers carried over.

**One instrument, two names and dates**
- Some replaced rows say "Replaced by Zoning Regulations Amendment (Setbacks, Basements and Industrial Norms), 20 January 2026"; others name the same change as the 5 January 2026 notification (UDD 235 MNJ 2025(E)).

**A false "not settled" warning**
- The page warns "The current tables overlap between 11.5 m and 12 m", but the amended clauses settle it: 3.1(ii) sends buildings up to 12 m to Table 8, and 3.1(iii) sends buildings above 12 m to Table 9 (with Table 8 also applying to plots up to 250 m² and height up to 15 m). The 11.5 m start of Table 9 is unreachable, not in conflict.

**Corporation wording for bye-law 6.0(i)**
- In the North view, 6.0(i) is tagged "In Bengaluru North City Corporation" but shows the 2003 wording ("within 5% of…") and the label "Master plan rules apply instead (bye-law 1.4)". Deviation limits are not among the subjects bye-law 1.4 hands to the master plan, and each corporation's May 2026 amendment substituted this clause.

---

## 3. Decisions

1. All views (Greater Bengaluru and each corporation) come from **one build of one dataset**.
2. Every citation must point to the page where the quoted text actually appears, checked automatically.
3. Each instrument has **one name and one date**, from the source register.
4. An overlap is "not settled" only if no in-force clause decides which rule applies.
5. Corporation-specific clauses show that corporation's current wording.
6. No new data; no design changes.

---

## 4. Principles

- Never invent or rewrite legal text.
- Every value and quote traceable to the right page of the right document.
- Derived means labelled; "not settled" only when it truly is.
- Plain language in the primary layer.
- Tests must be able to fail; expectations come from the source documents.
- Nothing city-specific in code.
- Commit and push after each part.

---

## 5. Work, in order

### Part 1 — One build for every view

1. Find why the Greater Bengaluru view is built from older data or code than the corporation views (stale static pages, separate generation step, cache, partial deploy). Record the cause in `docs/progress.md`.
2. Generate the city view and all corporation views in **one build step from one dataset**; remove any separate or cached path for the city view.
3. **Shared-content check (CI):** for every subject and every shared rule or provision (one not introduced by a corporation's own instrument), the content shown in the city view and in each corporation view must be identical (value, conditions, wording, source, page, status). Any difference fails the build.
4. **Same-build check (CI):** every built page carries one dataset identifier; all must match.
5. Verify after deploy (browser test): the Greater Bengaluru Setbacks page shows the 2007 industrial row under replaced rules, 3.1(ii) in its January 2026 wording, and no "Replaced" label on bye-law 1.4.

### Part 2 — Correct page citations

1. For every provision whose current wording comes from an amending instrument, the citation (page and links, official and archive) points to **the amending instrument's page where that wording appears**, not the original document's page.
2. **Citation check (CI):** for every quoted wording, table row and excerpt, the text must be found on the cited page of the cited document (using the stored page text). Mismatch fails the build. Report the number of citations corrected.
3. Previous wording keeps its own citation (original document and its page).
4. Tests: 3.1(ii), 3.1(iii) and 3.10(i) cite the January 2026 notification at the pages where their text appears.

### Part 3 — One name and date per instrument

1. Every reference to an instrument (replaced labels, sources, "Changed" tags, timeline, precedence) takes its plain name and date from the source register entry; no free-text names.
2. Resolve the "Zoning Regulations Amendment (Setbacks, Basements and Industrial Norms), 20 January 2026" label: if it refers to the 5 January 2026 notification, replace it with the register's name and date; if it refers to a separate instrument, confirm from existing data and register it properly, otherwise remove the reference and list it for owner review.
3. **Name check (CI):** no instrument reference in built pages may use a name or date that is not in the register.

### Part 4 — "Not settled" only when it is

1. Before reporting an overlap between current rules, check whether an in-force clause states which rule applies to which case (for setbacks: 3.1(ii) and 3.1(iii) as amended in January 2026). Record such clauses as **applicability rules** in the data, with their quoted text and source.
2. If an applicability rule decides the case, do not show "not settled". Instead, under "Why this rule applies", add one plain line (e.g. "Buildings up to 12 m use Table 8; taller buildings use Table 9 (clauses 3.1(ii) and (iii), January 2026)"), with the quote on tap. Mark rows that the applicability rule makes unreachable (e.g. Table 9's 11.5 to 12 m band) with a small note, not as conflicts.
3. Keep "not settled" for overlaps no in-force clause decides.
4. Tests: the setbacks 11.5 to 12 m band is not shown as "not settled"; a constructed overlap with no applicability clause still is.

### Part 5 — Corporation wording for bye-law 6.0(i)

1. In each corporation view, bye-law 6.0(i) shows that corporation's current wording from its May 2026 amendment, tagged "Changed May 2026, [corporation]", with the previous wording on tap and the citation pointing to the amendment's page.
2. Remove the "Master plan rules apply instead" label from 6.0(i) and from any other provision outside the subjects bye-law 1.4 lists (use, land use, coverage, FAR, setback or open space, height, number of storeys, number of dwelling units, parking).
3. **Label check (CI):** "Master plan rules apply instead (bye-law 1.4)" may only appear on provisions tagged to those subjects.
4. On the Greater Bengaluru view, 6.0(i) shows the 2003 wording with a plain note: "Each City Corporation changed this rule in May 2026. Choose a corporation to see its wording."

---

## 6. Pull request

- One draft pull request; preview URL at the top.
- Commit and push after each part; keep `docs/progress.md` current.
- PR description: cause of the stale city view; counts (shared-content differences found and fixed, citations corrected, instrument names unified, "not settled" warnings removed or kept); **For owner review** (any instrument name that could not be matched to the register; any overlap still "not settled"); decisions made; known gaps.
- Screenshots: Setbacks in Greater Bengaluru and North views at 390 px and 1280 px.
- The owner reviews the preview and merges.

---

## 7. Acceptance

- [ ] City and corporation views from one build; shared-content and same-build checks in CI; Greater Bengaluru Setbacks verified correct after deploy.
- [ ] Every quote and table row found on its cited page (CI); amended provisions cite the amending instrument's page.
- [ ] One name and date per instrument, from the register (CI).
- [ ] Applicability clauses recorded; no "not settled" where an in-force clause decides; the setbacks height case explained in one line.
- [ ] Bye-law 6.0(i) shows each corporation's current wording; "Master plan rules apply instead" only on bye-law 1.4 subjects (CI).
- [ ] Accessibility, page budgets and browser tests pass.
