# Bylaw One: Trust and Accuracy

**Date:** 26 November 2026 · **Basis:** the status review "Where the Project Meets Its Intent, and Where It Does Not" (26 November 2026) and the live site (https://bylaws-india.vercel.app) · **Scope:** existing data and the existing Bylaw One design; no new data, no new features

This plan is self-contained.

---

## 1. Intent

Bylaw One's claim is "Every rule traced to its page." This round makes every check behind that claim real, removes every false or confusing statement the review found, and prepares the resolver for later use without showing new features.

---

## 2. What the review found (items in scope)

1. **The citation check cannot fail in CI.** Locally it compares provision text with the parser's page text; in CI, where parser output is absent, it rebuilds each page's text from the published clause file itself, so a provision is compared with its own text.
2. **The map overstates accuracy.** Its banner says zone boundaries are "within about 0.0032 m of street centre-lines". That is the grid-fit error on the scanned sheet. The map verification report measures a median offset of 8.02 m and a 90th percentile of 21.11 m.
3. **The map page is in the old design**, linked once from the home page and not from the main navigation or footer consistently.
4. **Source labels lag behind the register.** Subject pages repeat full gazette titles in capitals ("GOVERNMENT OF KARNATAKA No. UDD 235 MNJ 2025(E) date: 05.01.2026 NOTIFICATION…") on every row, though each instrument now has a plain register name.
5. **Two home-page attributions confuse:**
   - the 2017 step quotes bye-law 1.4 under the title of the Karnataka Municipalities Model Building Bye-laws, which the site marks "not applicable here";
   - the 2007 step's quote describes which areas are Residential (Main), not that FAR is set by zone.
6. **Relations are shown without measured precision.** All 134 relations are rule-confirmed only; 63 are public; the 60-item labelling sheet has no verdicts.
7. **The resolver assumes plot dimensions** (a 3:2 plot and an 11.5 m building) when depth, width and height are not given.
8. **"No rule matched" is ambiguous**: it does not say whether the law sets no limit for that case or the data lacks the rule.

**Out of scope this round:** bringing back a plot answer in the interface; land-use sheets for other corporations; numeric parking values; the missing July 2025 amendment.

---

## 3. Principles

- Never invent or rewrite legal text.
- A check must be able to fail; test it by planting a fault.
- Every figure shown to readers is the measured one, with its method on tap.
- Every attribution names the instrument the quoted words actually come from.
- Plain names from the source register everywhere.
- Nothing presented as verified by a person unless a person verified it.
- Commit and push after each part.

---

## 4. Work, in order

### Part 1 — A citation check that can fail (most important)

1. **Stored page text.** For every acquired instrument, store the text of each page as extracted from the original PDF (the parser's page text), with the PDF's checksum, in a versioned file that is committed or stored alongside the source register (not derived from the published clause files). If storage size is a concern, store compressed page text per instrument.
2. **CI uses stored page text only.** The fidelity and citation checks read page text from this store. Remove the fallback that rebuilds page text from published clause files. If stored page text is missing for a cited page, the check **fails**, it does not skip.
3. **Planted-fault tests:** add tests that (a) alter one word in a published provision and (b) change one cited page number; both must make the check fail in CI.
4. **Integrity link:** the stored page text records the PDF checksum; CI verifies it matches the checksum in the source register.
5. Report in the PR: pages stored, provisions checked, citations that failed against stored text (with list), and fixes made.

### Part 2 — Correct the map

1. **Accuracy statement:** replace the 0.0032 m claim with the measured figures, in plain words: "Zone boundaries are approximate: typically about 8 m from street centre-lines, and within about 21 m in 9 out of 10 places." The grid-fit figure moves into Details, labelled as the sheet-fitting error, not positional accuracy.
2. **Accuracy check (CI):** the accuracy text shown must be generated from the map verification report's median and 90th-percentile values; a hard-coded figure fails the build.
3. **New design:** rebuild the map page in the Bylaw One design (tokens, type, header, footer, plain language, details on tap). Keep its function: boundaries, wards, land-use zones where available, layer switch, click for area, ward, corporation and zone. State plainly: "Land-use zones are available for parts of Bengaluru South only."
4. **Reachable:** link "Map" from the footer on every page and from the Land use subject page. Leave the main navigation at three items.

### Part 3 — Plain names and correct attributions

1. **Source cells:** every source cell, replaced-rule label, "Changed" tag and timeline item uses the instrument's plain register name and date (e.g. "Zoning amendment, 5 Jan 2026, p. 6"). Full official titles appear only in Details and on the document page header.
2. **Name check (CI):** built pages fail if a full official title appears outside Details or document headers.
3. **2017 step:** attribute the quote to "Building Bye-laws 2003, bye-law 1.4 (inserted by notification UDD 14 TTP 2017, 28 October 2017)". Link to bye-law 1.4 in the bye-laws and to the notification's page. If the notification document is the Model Building Bye-laws, say so in one plain line ("This notification also issued the Model Building Bye-laws, which do not otherwise apply in Bengaluru").
4. **2007 step:** replace the quote with words from the zoning regulations that actually introduce FAR by zone, plot size and road width (the text introducing or heading the FAR table). The quote must pass the citation check. If no such sentence exists in the data, show the table's own caption and say so.
5. **Attribution check (CI):** every home-page quote's cited document and page must contain the quoted words (uses Part 1's check).

### Part 4 — Relations shown honestly

1. Show publicly only relation kinds confirmed by structure: amendments (amends), incorporation (bye-law 1.4), and corporation differences. Keep all other kinds in the data, marked "not yet reviewed", and hide them from the interface.
2. Keep the 60-item labelling sheet ready in `docs/review/relations-labelling.md`, with each item showing both provisions, their pages and a verdict column. Do not fill it.
3. Add a rule: a relation kind becomes public only when its labelled precision is at least 0.8 (computed from the sheet once verdicts exist).
4. Every public relation shows "Checked by rule, not yet by a person" inside its Details.

### Part 5 — Resolver honesty (no interface change)

1. **No assumed dimensions.** When a rule depends on plot depth, plot width or building height and the input does not provide it, return "needs depth" (or width, or height) for that parameter instead of computing from an assumed 3:2 plot or 11.5 m building. Remove the defaults.
2. **Two kinds of "no rule":** record, per parameter and case, whether
   - the law sets no limit for this case (with the quoted text or table showing that the limit applies only elsewhere, e.g. height caps only for plots up to 250 m² or roads under 9 m), or
   - the data lacks a rule for this case.
   Return these as different outcomes: "No limit in the law for this case" with the citation, or "Not covered by our data yet".
3. **Tests** from source tables: the four review plots (600 m² on a 15 m road in Residential (Main); 150 m² on a 9 m road; 3,000 m² commercial on a 24 m road; 6,000 m² industrial on an 18 m road), each checked for "needs depth" where depth is missing and for the correct kind of "no rule".
4. The resolver remains hidden from the website; it will be used later by agent tools.

---

## 5. Pull request

- One draft pull request; preview URL at the top.
- Commit and push after each part; keep `docs/progress.md` current.
- PR description: counts (pages of stored text, citations checked and failed, labels renamed, relations hidden, resolver outcomes changed); results of the planted-fault tests; **For owner review** (any citation that failed and could not be fixed; the replacement quote for the 2007 step; the labelling sheet, ready to fill); decisions made; known gaps.
- Screenshots: map page, a subject page source column, home steps 2 and 3, at 390 px and 1280 px.
- The owner reviews the preview and merges.

---

## 6. Acceptance

- [ ] Citation and fidelity checks in CI read only stored page text; planted faults fail the build; missing page text fails, not skips.
- [ ] Map states the measured accuracy (about 8 m median, about 21 m at the 90th percentile), generated from the verification report; map page in the new design; linked from the footer and Land use.
- [ ] Plain register names in all source cells and labels; full titles only in Details and document headers (CI).
- [ ] Home steps 2 and 3 quote and attribute correctly; quotes pass the citation check.
- [ ] Only structurally confirmed relation kinds public; labelling sheet ready; precision rule recorded.
- [ ] Resolver returns "needs depth/width/height" instead of assuming; distinguishes "no limit in the law" from "not covered by our data"; tests from source tables pass.
- [ ] Accessibility, page budgets and browser tests pass.
