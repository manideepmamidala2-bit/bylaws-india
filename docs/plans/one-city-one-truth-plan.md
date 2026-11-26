# Bylaw One: One City, One Truth

**Date:** 26 November 2026 · **Basis:** a review of the live site (https://bylaws-india.vercel.app) on 26 November 2026 · **Scope:** existing data and the existing Bylaw One design; no new data

This plan is self-contained.

---

## 1. Intent

Bylaw One promises "Bengaluru's building rules. One code." This round makes that promise true:
- each subject page shows only the rules that actually apply today;
- the whole city is built as one code, with each City Corporation as a thin layer showing only what differs there;
- every page uses the same Bylaw One design and the same cleaned data.

---

## 2. What the review found

**"What applies today" mixes current and replaced rules**
- Setbacks shows Industrial (General) plots up to 500 m² twice: 4.5 m on all sides from the 2007 regulations, and 12% / 8% / 8% of plot depth and width from the January 2026 notification, both as governing.
- Under "Governing provisions in force", setbacks clauses 3.1(ii) and 3.1(iii) show their 2007 wording, while the site's own note says the January 2026 notification substituted them.
- Height bands overlap: the 2026 setback table covers buildings up to 12 m, while the 2007 taller-building table, still shown as governing, starts above 11.5 m.
- FAR shows Traffic and Transportation twice (2007 regulations and the 2009 amendment, same values) and Industrial (General) twice (2007 and January 2026).
- In "Older or replaced rules", bye-law 1.4 itself and several definitions are labelled "Replaced for this subject by the Master Plan Zoning Regulations under Bye-law 1.4".

**Two websites in one**
- The corporation selector on the new subject pages ("Showing: Greater Bengaluru · Change") links to corporation pages that are still the previous site: titled "Structured Building Bylaws", old navigation (Map, Sources, Documents, Topics, Timeline, Review, Structure, Data), old labels ("Statutory Resolution Cards", "topic:setbacks", "Local Graph →").
- Those pages still carry the old data problems fixed elsewhere: editorial words inside bye-law 1.4 and bye-law 6.0(i); OCR noise and gazette mailing headers inside clauses; premium FAR clause 17 shown three times under addresses built from a date; an address nested about 18 levels deep in the 2019 amendment.
- Confirmed for Bengaluru South; the other four corporations are built the same way and must be checked.

**How the city's rules actually divide**
- Shared across Greater Bengaluru: the zoning regulations and all their amendments, the 2003 bye-laws, the premium FAR chapter, the Governance Act provisions, the 2025 khata order. Nearly every rule people look up (FAR, coverage, setbacks, height, parking) is shared.
- Different per corporation: mainly the 2026 bye-law amendments (deviation limits, compounding fees, omitted ground-rent rules), plus boundaries and wards.
- Uneven for a data reason: land-use zone polygons exist only for four map sheets in Bengaluru South.

---

## 3. Decisions

1. **One city code.** Shared rules are built once for Greater Bengaluru.
2. **Corporations are a thin layer.** Choosing a corporation shows the same subject page with that corporation's differences marked; nothing else changes.
3. **Switching corporations:** one page per subject with the existing "Showing: … · Change" selector.
4. **All old pages removed**, not restyled; rebuilt from the Bylaw One templates; old addresses redirected.
5. **Equal treatment for all five corporations.**
6. **No new map data this round.** The land-use zone gap is stated plainly.
7. **No new data acquisition.**

---

## 4. Principles

- Never invent or rewrite legal text; current wording comes from applied amendments, verbatim.
- Every value traceable to its table cell, provision, page and official source.
- Derived means labelled.
- "Not settled" is a valid answer; never pick silently.
- Plain language in the primary layer; details on tap.
- Tests must be able to fail; expected values come from the source documents.
- Nothing city-specific in code.
- Commit and push after each part; the preview always works.

---

## 5. Work, in order

### Part 1 — "What applies today" made true (city level)

1. **Apply supersession to tables.** For each table and row that an in-force amendment substitutes, omits or replaces, only the replacing version appears under "What applies today". The replaced version moves to "Older or replaced rules", newest first, with "Replaced by [plain name], [date]".
2. **Apply supersession to provisions.** "Governing provisions" show the **current wording** (after applying amendments), with a small tag "Changed [month year]" and the previous wording one tap away. A provision whose current wording comes from an amendment cites the amending notification and its page.
3. **Remove duplicates.** Where an amendment restates a rule with identical values (e.g. the 2009 Traffic and Transportation table), show it once, citing the latest source; earlier sources listed in Details.
4. **Overlap check (CI).** For each subject, no two rows under "What applies today" may cover the same rule, zone or use, and overlapping conditions (plot area, road width, height, width, depth) with different values. Overlaps either resolve by supersession or are shown as "Not settled: two rules apply" with both. The build fails on any unexplained overlap.
5. **Band continuity check.** Where a subject's rules use ranges (height, plot area, road width), report gaps and overlaps between current tables (e.g. 2026 setbacks up to 12 m against the taller-building table). If the current texts themselves overlap or leave a gap, show it plainly to the reader ("The current tables overlap between 11.5 m and 12 m") with both sources; never adjust a number.
6. **Correct "Replaced" labels.** Only rules actually replaced by a later rule carry "Replaced". Bye-law 1.4 is never labelled replaced. Definitions are labelled replaced only if a later instrument replaces that definition. Bye-law rules displaced by bye-law 1.4 are labelled "Master plan rules apply instead (bye-law 1.4)", not "replaced".
7. **Governing provisions list holds only governing provisions.** Definitions, tables of contents, headings and unrelated provisions move to "Related" or are excluded.
8. **Tests** for each of the found cases (industrial setbacks, 3.1(ii) and (iii), Traffic and Transportation FAR, industrial FAR, the 1.4 label), with expectations taken from the source pages.

### Part 2 — One city code, corporations as a thin layer

1. **Single source.** Shared documents, parameters and provisions are built once at Greater Bengaluru level. Corporation views reference them; nothing shared is copied per corporation.
2. **Corporation differences.** Each corporation layer contains only what its own in-force instruments introduce (its 2026 bye-law amendment, its boundary and wards, and anything else whose own text limits it to that corporation).
3. **Subject pages with a corporation selected:** identical to the city page, plus:
   - a short line under the heading: "Showing Greater Bengaluru rules, with differences for [corporation]";
   - rows and provisions that differ marked "In [corporation]: …" with the source;
   - if nothing differs for this subject: "No differences for [corporation] on this subject."
4. **Document pages with a corporation selected:** the bye-laws show the corporation's consolidated wording where its amendment applies, marked "Changed for [corporation], [date]".
5. **Equal treatment.** Each corporation's 2026 amendment is checked to the same standard: fidelity check (every provision's text found on its cited page or covered by a recorded correction), no editorial insertions inside legal text, structure rules (no dates as clause numbers, no duplicates, no runaway nesting), plain title.
6. **Parity check (CI).** For any two corporations, the set of pages, subjects and documents is identical, and every difference in content traces to an instrument that applies only in one of them. Any other difference fails the build.

### Part 3 — One site, one design

1. **Remove old pages.** Delete the previous site's routes and templates (corporation pages under their old layout, old Topics, Timeline, Review, Structure, Documents and Map views where they still use the old layout).
2. **Rebuild** every corporation page from the Bylaw One templates used at city level.
3. **Redirect** every old address to its new equivalent (corporation subject page, document page, provision anchor, sources, what changed, map), preserving the corporation choice. No old address returns a page in the old design.
4. **Old-design check (CI).** Built pages fail if they contain the old site title, old navigation labels or old component names ("Structured Building Bylaws", "Statutory Resolution Cards", "Local Graph", "topic:").
5. **Clean data everywhere.** Corporation pages read the same cleaned data as city pages; the fidelity, structure and language checks run over every built page, city and corporation.

### Part 4 — Map and gaps stated plainly

- The map shows boundaries and wards for all five corporations. Land-use zones appear only where processed (parts of Bengaluru South).
- One plain line on the map and on the Land use subject: "Land-use zones are available for parts of Bengaluru South only. Elsewhere the map shows boundaries and wards."
- Gap notices appear only where a gap can change what a page shows.

---

## 6. Pull request

- One draft pull request; preview URL at the top.
- Commit and push after each part; keep `docs/progress.md` current.
- PR description: progress per part; **For owner review** (any "not settled" overlaps and band gaps found in the current texts; any corporation difference the parity check flagged; redirects that could not map one-to-one); decisions made; known gaps; counts (rows moved to replaced, duplicates removed, overlaps resolved or shown as not settled, old routes removed, redirects added).
- Screenshots: Setbacks and FAR at city level and for one corporation, at 390 px and 1280 px.
- The owner reviews the preview and merges.

---

## 7. Acceptance

- [ ] "What applies today" on every subject shows only current rules; replaced rules under "Older or replaced rules"; current wording for amended provisions.
- [ ] No duplicate rows; overlap check and band continuity check in CI; current-text overlaps shown plainly, never adjusted.
- [ ] "Replaced" used correctly; bye-law 1.4 never labelled replaced.
- [ ] Shared rules built once; corporation views show only their differences; parity check in CI.
- [ ] All five corporations' 2026 amendments pass the fidelity and structure checks.
- [ ] No page in the old design; old addresses redirect; old-design check in CI.
- [ ] Map and Land use state the zone gap plainly.
- [ ] Accessibility, page budgets and browser tests pass.
