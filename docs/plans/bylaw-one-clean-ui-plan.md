# Bylaw One: Clean Interface and New Home Page

**Date:** 26 November 2026 · **Basis:** the status review of 26 November 2026 (data and interface) and the owner's design decisions · **Scope:** interface and presentation; data changes only where needed so nothing wrong is displayed

This plan is self-contained.

---

## 1. Intent

The project gathers Bengaluru's scattered building rules (bye-laws, master plan zoning regulations, their amendments, corporation notices and relevant state law) into **one code**, with every rule traced to its official page and overlaps resolved openly.

This round makes that visible and simple:
- a new name, **Bylaw One**;
- a clean, calm interface in the style of dg2n.com;
- a home page that explains the project's value through one real story, with **no map and no plot calculator**.

---

## 2. Decisions

1. **Name:** Bylaw One. Descriptor: "Bengaluru's building rules. One code."
2. **No map on the home page.** The map stays available as its own page, linked from the footer and from the Land use subject.
3. **No plot calculator or plot inputs anywhere in the interface for now.** The data and resolver stay in the repository but are not shown.
4. **Home tells one story step by step: how FAR came to be what it is today.**
5. **Style:** dg2n.com: short two-part headlines, numbered sections, generous space, honest labels on anything illustrative or derived, one coral accent, a plain FAQ.
6. **Plain language first, details on tap.** Most recent first for lists of instruments and changes; the law's own order inside documents.
7. **English only.**

---

## 3. Style

### 3.1 Principles (from dg2n.com)
- **Two-part headlines** that state an idea plainly (e.g. "Many sources. One code.").
- **Numbered sections**: `01 / The problem`, `02 / Follow one rule`, each with one heading and at most two short sentences.
- **Step-by-step storytelling** for explanation, one idea per step, with a step counter ("Step 2 / 5").
- **Honest labels** on anything that is the site's own work: "In short, by this site", "Derived by this site", "From the official text".
- **A short FAQ** near the end of the home page.
- **A closing line** that sums up the product: "Read. Trace. Compare."

### 3.2 Tokens
| Token | Value |
|---|---|
| Paper / panel | `#f5f3ed` / `#efeee8` |
| Ink / muted | `#080909` / `#5b5e56` |
| Hairline | `#c8ccc0` |
| Accent (one use: the current selection or active step) | `#ff6b52`, never for text |
| Display | Inter Tight, tight letter-spacing |
| Reading (legal text) | Source Serif 4 |
| Labels | JetBrains Mono, small capitals |

- No cards, no shadows, square corners, hairline rules between sections.
- Three text sizes on any page (display, body, label).
- Reading width 65 to 75 characters for legal text.
- Generous vertical space between sections.
- Fonts loaded with `next/font`; all text meets WCAG AA contrast.

### 3.3 Language rules
- No internal IDs, enum names, schema or release internals, file paths or project references in the primary layer.
- Units written normally: m, m², %.
- Status in words: "In force since 14 May 2026", "Draft, not in force", "Replaced in January 2026".
- Page introductions: at most two sentences.
- Technical detail (addresses, retrieval records, checksums, archive links, verification) only inside "Details" expanders, closed by default.
- CI check: built pages fail if they contain internal ID patterns, enum names or raw unit tokens (such as `sq_m`) outside Details expanders.

---

## 4. Site structure

**Header:** wordmark "Bylaw One" (text wordmark in Inter Tight) and three items: **The code**, **What changed**, **About**. A search icon opens search across all documents.

**Footer:** Sources, Map, Data and downloads, Licence, How this is built. Short line: "Worked out from the official documents. Not an official publication."

Pages:
| Page | Purpose |
|---|---|
| Home | The story of the project in one scroll |
| The code | All subjects; each subject page shows what applies today |
| Subject page | One subject (e.g. FAR) across all sources |
| Document page | One official instrument, in its own order |
| What changed | All instruments and changes, newest first |
| Sources | The register, newest first, technical fields in Details |
| Map | The existing map, moved off the home page |
| About | What this is, how it is built, what is missing, FAQ in full |

Remove from navigation: Topics (becomes "The code"), Timeline (becomes "What changed"), Review, Structure (moves to "How this is built" in the footer), Data (footer).

Corporation choice: a small, quiet selector on subject and document pages ("Showing: Bengaluru South City Corporation · Change"), defaulting to Greater Bengaluru for shared rules.

---

## 5. Home page

### Hero
- Heading: **Bengaluru's building rules. One code.**
- Subline: "[N] official documents from [M] bodies, joined into one readable code. Every rule traced to its page." Counts computed from the data (instruments in force, issuing bodies), never typed by hand.
- Buttons: **Read the code** (primary), **What changed recently** (secondary).
- No map, no counters beyond the subline, no release number.

### 01 / The problem
- Heading: **Many sources. One building.**
- Two sentences: the rules for one building sit in bye-laws, master plan regulations, amendments, corporation notices and state law; they overlap and sometimes disagree.
- A quiet illustration: the documents (as titled lines or small marks, newest first) converging into one. Labelled "Illustration".

### 02 / Follow one rule: FAR
A step-by-step explainer (dg2n "Decision 1 / 4" pattern), five steps, one idea each, with a step counter and previous/next controls.

| Step | Heading (example) | Content |
|---|---|---|
| 1 | **2004. The bye-laws set FAR.** | The Building Bye-laws 2003 (in operation from 5 June 2004) set FAR in their own tables (bye-law 9.2, Tables 4 to 6). |
| 2 | **2007. The master plan sets FAR by zone.** | The RMP 2015 Zoning Regulations set FAR by zone, plot size and road width (Chapter 4, Table 1). |
| 3 | **2017. The bye-laws hand FAR to the master plan.** | Bye-law 1.4, from notification UDD 14 TTP 2017, makes the master plan rules govern use, coverage, FAR, setbacks, height, floors, dwelling units and parking. |
| 4 | **2025. Premium FAR is added.** | The premium FAR chapter (Chapter 11, notified 2 April 2025) allows extra FAR on payment, by road width. |
| 5 | **Today. What applies.** | Base FAR from the zoning table, with premium FAR and TDR on top, each from its own source. |

Each step shows:
- one plain sentence, labelled "In short, by this site";
- a short excerpt of the actual text, labelled "From the official text", quoted **verbatim** from the structured data (must pass the same fidelity check as provision text), with document name, date and a "View page" link;
- where useful, a small clean table from the existing table data (values with units, conditions in words), with any implausible value excluded (see Section 9).

Behaviour:
- Works without JavaScript as an ordered list of the five steps.
- Keyboard and screen-reader accessible; respects reduced motion.
- On phones, steps stack vertically.
- The agent selects excerpts from existing data; if a step's source text cannot be found verbatim in the data, that step says so plainly instead of paraphrasing as a quote.

### 03 / The code, by subject
- Heading: **The code, by subject.**
- A clean list (not cards): Land use, Ground coverage, FAR, Setbacks, Height, Parking, Basements and stilts, Projections and open spaces, Approvals and certificates, Fire safety, Definitions. Each with one plain line and a link.

### 04 / Recently changed
- Heading: **What changed recently.**
- The newest three to five in-force instruments: date, plain title, one line "what changed" (labelled "In short, by this site"), link. Drafts shown only with "Draft, not in force".
- Link: "All changes".

### Questions people ask
Short answers, each expandable:
- Is this official? (No; it is worked out from official documents, each linked.)
- Where does the text come from? (Official PDFs and gazettes; archived copies kept.)
- What happens when rules disagree? (The site applies a stated order and shows both rules; one line on bye-law 1.4.)
- What is missing? (Generated from declarations, in plain words, only gaps that matter.)

### Closing
- Line: **Read. Trace. Compare.**
- Button: **Read the code**.

---

## 6. The code (subject pages)

**Index:** the subject list from home, with one line each.

**Subject page**, in this order:
1. Heading and one plain sentence on what the subject covers.
2. **What applies today**: the governing provisions and, where the data holds them, their values as a clean table:
   - one row per distinct rule (no duplicate tiles);
   - conditions in words ("Plots above 360 up to 1,000 m², roads above 12 up to 18 m");
   - values with units;
   - source and page on each row (small "p. 12" link).
   - No raw row text (e.g. "2 | Above 15 mup to 18.0m"); show it only inside Details.
3. **Why this rule applies**: one line (e.g. "Bye-law 1.4 hands FAR to the master plan regulations"), expandable to the quoted authority.
4. **Older or replaced rules**: collapsed, newest first.
5. **Related provisions**: collapsed. Definitions, tables of contents and headings never appear above the fold.
6. **Gap note** only if a known gap can change this subject (e.g. the July 2025 zoning amendment that was not obtained); otherwise none.

No plot inputs or filters on subject pages in this round.

---

## 7. Other pages

**Document page**
- Header: plain title, issuing body, date, one status line, links to the official PDF and archive (archive inside Details).
- Body: the law's own order, provision number and verbatim text only. Changes shown as a small tag ("Changed in 2026") opening the amendment.
- Tap a provision: Details with page link, archive link, version history (newest first), site notes, references, address.
- Outline for navigation; chapters load on demand.
- Notices only for gaps that affect this document's in-force text. Remove the notice about the 4 March 2026 South draft from in-force documents, since drafts never apply.
- No "Read provisions" link for instruments whose text the site does not hold.

**What changed**
- Newest first: date, plain title, type in words, one line on what changed, link. Filter by type (amendment, notification, order) and by corporation.

**Sources**
- Newest first; plain names and statuses; technical fields in Details.

**Map (its own page)**
- Unchanged in function; title "Map"; link back to the code. Plot answers removed from the map's panel; clicking shows area, ward, corporation and zone only.

**About**
- What Bylaw One is, how it is built, how disagreements are handled, verification (all checks are machine checks), licences, full FAQ, "How this is built" (the former Structure content).

---

## 8. Removing the plot features from view

- Remove the plot card, plot inputs and plot answers from all pages.
- Keep the resolver, parameters and their tests in the repository; they are not shown.
- Remove any copy that promises plot answers.

---

## 9. Minimum data fixes (so nothing wrong is displayed)

The new subject pages and the FAR story display table values. Before they do:
1. **Plausibility bounds per parameter kind** (e.g. FAR 0.25 to 5; coverage 0 to 100%; setbacks 0 to 30 m). Values outside bounds are never displayed; they are listed for owner review.
2. **Fix the hectare conversion** ("Upto 0.40 Hectares" read as 0.4 m²): hectares to m².
3. **Reclassify the non-FAR rows** recorded as FAR (deviation tolerances, compounding-fee rates, premium FAR price rows).
4. **Parking values** that are sentences are shown as text, not as numbers.
5. Add tests for each fix, with expected values taken from the source tables.

---

## 10. Rename

- Site title, metadata, Open Graph title and description, favicon (a simple mark in ink on paper), wordmark: "Bylaw One".
- Descriptor in metadata: "Bengaluru's building rules. One code."
- Keep the current domain and repository name for now; note in `docs/` that a domain and trademark check is pending.

---

## 11. Phone first

- Design at 390 px first, then widen.
- Header collapses to the wordmark, a search icon and a menu button.
- Home sections stack; the FAR story steps stack vertically with clear step numbers.
- Tap targets at least 44 px.

---

## 12. Quality

- Accessibility checks (axe) pass on every page; keyboard navigation for the FAR story and expanders.
- Page budgets: HTML per page ≤ 300 KB; initial JavaScript plus data ≤ 1.5 MB uncompressed.
- Browser tests in CI: home renders the five FAR steps with verbatim excerpts and working page links; a subject page shows a clean table with units; a document page expands a provision; no plot inputs anywhere.
- Language check in CI (Section 3.3).
- The fidelity check covers every quoted excerpt on the home page.

---

## 13. Pull request

- One draft pull request; preview URL at the top.
- Commit and push after each section of work; keep `docs/progress.md` current.
- PR description: what changed; screenshots at 390 px and 1280 px of home, a subject page and a document page; **For owner review** (values excluded by plausibility bounds, FAR story excerpts, any step that could not be sourced verbatim); decisions made; known gaps.
- The owner reviews the preview and merges.

---

## 14. Acceptance

- [ ] Site named Bylaw One throughout; descriptor in metadata.
- [ ] Home: hero, 01 problem, 02 five-step FAR story with verbatim excerpts and page links, 03 code by subject, 04 recent changes, FAQ, closing line. No map, no plot inputs.
- [ ] Header with three items; other pages in the footer.
- [ ] Subject pages open with what applies today as clean tables with units and conditions in words; older and related rules collapsed.
- [ ] Document pages clean: number and text first, details on tap; irrelevant draft notices removed.
- [ ] Most recent first on What changed and Sources; law order inside documents.
- [ ] dg2n style: tokens, numbered sections, honest labels, one coral accent never used for text.
- [ ] Plausibility bounds, hectare fix and non-FAR reclassification in place; no implausible value displayed.
- [ ] Phone layout designed first; budgets, accessibility, language and browser checks pass in CI.
