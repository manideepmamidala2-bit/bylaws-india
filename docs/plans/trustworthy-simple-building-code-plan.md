# Bengaluru Building Bylaws: Trustworthy Data, a Usable Code, a Simple Site

**Date:** 25 November 2026 · **Basis:** a review of the live site (https://bylaws-india.vercel.app) on 25 November 2026 · **Scope:** data already in the repository; no new acquisition

This plan is self-contained.

---

## 1. Intent

Bengaluru's building rules are spread across bye-laws, master plan zoning regulations, their amendments, corporation-specific amendments and parts of state law. They overlap and sometimes contradict each other. This project turns them into one structured, machine-readable building code and presents it so that **anyone, not only experts, can find out what applies to a plot**, with every answer traceable to the official text.

The documents are now structured. This plan makes that structure **trustworthy**, turns the numbers into **data a program can use**, and puts a **simple, plain-language site** on top.

---

## 2. What the review found

**Strong**
- 23 instruments gathered in one place: the 2003 bye-laws, the RMP 2015 zoning regulations with amendments from 2009 to January 2026, the premium FAR chapter, the storm water drain buffer notification, the 2026 City Corporation amendments, the building chapters of the Greater Bengaluru Governance Act 2024, the July 2025 khata and plan-approval order, and more.
- Every provision links to the official PDF page and an archived copy.
- Gaps are stated openly (e.g. a South City Corporation draft that could not be obtained; a lake-buffer bill with unknown status).
- The right concepts exist: topics across documents, a corporation switcher, a table of former and current authorities, bye-law 1.4 identified as the rule that makes the zoning regulations govern key parameters.

**Problems**

*Consistency*
- Pages show different releases at once: home and map show an older release ("two base documents", "Amendment links 0", "pending in PR 11"); documents and topics show a newer one.
- Internal project references ("PR 11") appear in public copy.

*Text fidelity (most serious)*
- Some provisions contain words not in the official text: bracketed notes inserted inside sentences (e.g. a notification number and deviation percentages inside bye-law 6.0(i)), digests of tables presented as clause text (zoning regulation 3.1), and descriptions of where a document was published (bye-law 1.4).
- OCR noise left in text ("LL Dhl", "Ms ~ fh . Cc — 3 To The Com…"), gazette mailing headers inside clauses, split words ("M inimum").

*Structure*
- Dates parsed as clause numbers (`cl_11.11.2025`, `cl_12.12.2025`), creating false parents and **duplicated clauses** (clause 17 of the premium FAR notification appears three times).
- Runaway nesting: list items attached as children of the previous item instead of siblings (an address about 18 levels deep).
- Empty labels ("Table 1 — Table 1"); the table of contents tagged as a setbacks provision.

*Status and relationships*
- The Kannada compilation shown as an in-force instrument with "Full text".
- Maps listed as documents with "Full text".
- The Karnataka Municipalities Model Building Bye-laws 2017 shown as a parallel in-force code, while its notification (UDD 14 TTP 2017) also appears to be the source of bye-law 1.4. The relationship is not explained.
- The former-and-current-authorities table cites evidence that does not support some rows (a deviation clause quoted as evidence of who succeeded the Commissioner; an effective date earlier than the cited notifications).

*Conflict handling*
- "Resolution cards" repeat one sentence three times, are cut off mid-word, and never state the governing value.
- Topics are keyword lists (96 "setbacks" provisions including the table of contents and a garage rule), not comparisons; outdated tables appear beside current ones without saying which governs.

*Usability*
- Internal vocabulary in public view: "Schema 1.4", "topic:setbacks", document IDs, layer types like "state_rules", units as "sq_m", "Local Graph →" on every item.
- Heavy repetition per provision (heading repeated as text, status, pages, date, two links, details); one document page lists about 1,600 provisions this way.
- The map page is mostly text (raw source URL, coordinate system codes, a 72-ward text list, layer metadata), shows "0 clauses" for a zone, and contradicts itself on accuracy ("about 8 m" beside "±0.0032 m").
- Nothing starts from the user's real question: *what can I build on my plot?*

---

## 3. Decisions

1. **The law's words exactly as printed.** Nothing is added inside legal text. Explanations, notification numbers and summaries live in separate notes beside it.
2. **OCR handling:** obvious OCR errors are corrected against the page image and marked "corrected" (the original shown on tap); unreadable fragments are shown as "[unreadable in source]" with a page link; gazette headers and footers are removed from provision text.
3. **Plain summaries allowed, clearly separate.** Instruments and key provisions may have a one-line summary labelled "In short (by this site)". The exact legal text is always one tap away and never altered.
4. **Most recent first** for every list of instruments and changes: timeline, documents list, sources list, amendments on a provision, version history. **Inside a document, the law's own order** (1.0, 1.1, 1.2…) is kept.
5. **Main reader: a homeowner or small builder.** The primary layer uses plain words, no codes or IDs. Everything an architect or lawyer needs (clause references, addresses, verification, metadata) is one tap deeper.
6. **Include the plot answer in this round**: tables turned into data, explicit resolution rules, and a plot card.
7. **Resolve conflicts openly** with rules stored as data; every result labelled as derived by the site, citing the rule and its authority, with the other provision visible.
8. **No owner spot-check.** The agent proceeds alone; all checks are machine checks, and the site says so plainly (nothing is presented as verified by a person).
9. **English only.** The Kannada compilation is not structured.
10. **No new data** in this round.

---

## 4. Principles

- **Never invent or rewrite legal text.** If something cannot be read, say so.
- **Every number traceable** to its provision, table cell, page and official source.
- **Derived means labelled:** summaries, consolidated text, parameter values, resolutions and traced map zones.
- **Not settled is a valid answer:** if the rules do not decide, show both provisions.
- **Plain language first, detail on demand.**
- **Tests must be able to fail:** expected values come from the source documents, not from the code's output.
- **Nothing city-specific in code:** jurisdictions, documents and rules live in configuration and data.
- **Working state at every step:** commit and push after each part.

---

## 5. Work, in order

### Part 1 — One consistent site

1. Find why pages show different releases (stale static pages, cache, partial deploy) and fix it so every page reads the same release.
2. Add a CI check: every built page reports the same release identifier.
3. Remove internal references (PR numbers, plan names, schema versions, file paths) from all public copy; add a CI check that fails on such strings in built pages.
4. Regenerate all declarations and status notices from the actual data.

### Part 2 — Text fidelity (machine-enforced)

1. **Fidelity check for every provision.** Each provision's text must be found in the parser's text of its cited page(s), after whitespace normalisation, or be covered by a recorded correction. Report every provision that fails, with the differing words.
2. **Remove editorial insertions.** Any words in provision text that are not in the source page (bracketed notes, notification numbers, percentages, website names, table digests) are removed from the text. If the information is useful, it becomes a separate note (`note_by_site`) attached to the provision, labelled as such.
3. **Table digests become tables.** Where a provision's text is a summary of a table (e.g. zoning regulation 3.1), restore the verbatim surrounding text and represent the table as a proper table node (see Part 4).
4. **OCR corrections.** For OCR noise, compare against the page image; correct only when the intended text is unambiguous, record `original_text`, `corrected_text`, page and reason, and mark the provision "corrected". Otherwise replace the fragment with "[unreadable in source]" and link the page.
5. **Remove page furniture:** gazette mailing headers, running heads, page numbers and form-feed artefacts.
6. **CI gate:** the fidelity check runs in CI and fails on any provision text not traceable to its page or a recorded correction.
7. Report counts in `qa.md`: provisions checked, insertions removed, notes created, corrections, unreadable fragments.

### Part 3 — Structure repair

1. **Dates are not clause numbers.** Date-shaped tokens (dd.mm.yyyy, dd-mm-yyyy, dd/mm/yyyy) can never become clause numbers. Rebuild affected documents; remove the duplicates this created (e.g. the three copies of premium FAR clause 17), keeping one with correct citations.
2. **Siblings, not children.** List items at the same level ((a), (b), (c) or (i), (ii), (iii)) are siblings; a new nesting level starts only when the numbering style changes or the layout indents. Add a depth check: no address deeper than the document's real maximum depth (flag anything over 6 levels for review).
3. **Uniqueness check:** no two provisions in the same document with identical text and number; duplicates fail CI.
4. **Meaningful labels:** tables take their printed caption; if none, "Table" plus the provision it belongs to. No "Table 1 — Table 1".
5. **Non-content excluded from topics:** tables of contents, indexes, cover pages and gazette headers are never tagged to topics or zones.
6. Rebuild addresses, links and references after repair; regenerate topics and relations.

### Part 4 — Statuses and relationships

1. **Instrument types made explicit:** `instrument` (has legal force), `compilation` (unofficial collection of amendments, finding aid only), `map`, `bill` (not law until enacted), `order`. Compilations, maps and bills never show "In force" or "Full text".
2. **Kannada compilation:** type `compilation`, not structured, kept in the source list with its link.
3. **Model Building Bye-laws 2017:** from the text already held, determine and record with quotes: whether it applies to City Corporations; whether its clause 1(3) is the source of the rule recorded as bye-law 1.4; and how bye-law 1.4 came to be in the 2003 bye-laws. Show the result in plain words ("This 2017 notification is where the rule that master plan regulations govern setbacks, FAR and coverage comes from"). If the text does not settle a question, say "unclear" with both quotes. Its other provisions do not feed plot answers unless the evidence shows they apply here.
4. **Former and current authorities:** every row must be supported by a quote that actually states the change, with an effective date matching that quote. Rows without such evidence are removed or marked "not confirmed".
5. **Every instrument's status** re-derived from the evidence held; drafts, finals and superseded drafts clearly separated.

### Part 5 — The numbers as data

1. **Tables as data.** For every table in the in-force instruments that sets building parameters, store each cell's verbatim text and, where possible, a parsed value: numbers with units, and ranges such as "Up to X", "Above X up to Y", "X to Y", "Less than X", "X and above" as numeric intervals. Fix header parsing (multi-row headers; words like "Max" read as units) and known misreads.
2. **Parameter records** for: ground coverage, FAR (base, premium, TDR), setbacks (front, rear, sides), building height, number of floors, parking. Each record: value and unit, the printed text, conditions (plot area, plot width and depth, road width, building height, zone, area class or ring where used, use, corporation), valid from and to, and its source cell, provision and page. Conditions that cannot be expressed are kept as text and marked "depends on conditions".
3. **Resolution rules as data**, applied in order, each outcome citing the step and its quoted authority:
   1. Drafts never apply.
   2. A corporation's amendment applies only in that corporation.
   3. Where the Greater Bengaluru Governance Act 2024 says "notwithstanding", it prevails.
   4. For use, coverage, FAR, setbacks, height, floors, dwelling units and parking, the master plan zoning regulations govern (bye-law 1.4, and its source as established in Part 4).
   5. Within one family of instruments, the later in-force provision wins.
   6. Otherwise: not settled; show both.
   A step whose authority cannot be quoted from the data is switched off and declared.
4. **Resolver**, in the pipeline and in the browser: inputs location (or zone and corporation), plot area, road width, optional plot width and depth, building height, use, date (default today); outputs, per parameter, the value, why (one line), the source and page, other provisions that also apply and why they were not chosen, or "not settled".
5. **Test cases** written from the source tables (checked against page images), including one worked case: a 600 m² residential plot on a 15 m road in a Residential (Main) zone in Jayanagar, today. Where the source differs from any expectation, the source wins.
6. **Self-check:** 40 parameter records compared against page images; results in `qa.md`.

### Part 6 — A simple site for non-experts

**Primary layer: short and plain. Everything else: tap to expand.**

**Home = the map**
- Full-width map above the fold, one line of introduction.
- Readable base map (Protomaps light style: road hierarchy, street and area names, parks, water, metro); project layers drawn beneath street labels; zone colours from the official RMP 2015 land-use legends; plain legend names.
- Controls: zoom, scale bar, my location, full screen, simple layer switch (Streets, Land-use zones, Wards, Corporations, Original map sheet).
- Search by place name (from the base map's names) and by ward name or number.
- All technical text (source URLs, coordinate systems, accuracy figures, ward lists) moves behind an "About this map" expander. One honest accuracy figure (the measured one) in plain words.

**Plot card (tap anywhere)**
- Primary: area name, ward, corporation, zone in plain words; then inputs (plot size, road width) and answers: coverage, FAR, setbacks, height, parking, each as a number with one short reason.
- Expand: the provision text, table row, page link, the resolution step, other provisions that also apply.
- "Not settled" shown plainly with both rules.
- One-line notice: "Worked out from the official documents by this site. Confirm with the planning authority or a qualified professional."

**Documents**
- List: most recent first; each item shows plain title, date, one status in words ("In force since 14 May 2026", "Draft, not in force", "Replaced"), and an "In short" line.
- Document page: law order; each provision shows number and verbatim text only. Change marks are a small tag ("Changed in 2026"). Tap a provision to expand: page link, archive link, version history (most recent first), notes by the site, references, address.
- Load chapter by chapter; an outline for navigation.

**Topics (renamed "Rules by subject")**
- Each subject starts with **what applies today** (the governing provision and, where available, its values), then "Older or replaced rules" collapsed, then "Related provisions" collapsed.
- Resolution cards state: what governs, the value if known, why in one line; tap for both provisions and the authority.
- No tables of contents, headings or unrelated provisions.

**Timeline**
- Most recent first; each entry: date, plain title, one-line "what changed"; tap for the list of changed provisions.

**Sources**
- Most recent first; plain names and statuses; technical fields (checksums, retrieval records, archive links) behind an expander.

**Language rules (CI-checked where possible)**
- No internal IDs, enum names, schema versions or file paths in the primary layer.
- Units written normally ("m²", "m"), not "sq_m".
- No repeated headings inside provision text.
- Page introductions at most two sentences.
- "Local graph" and similar tools available only inside the expanded view.

**Performance**
- Per-chapter data loading; HTML per page ≤ 300 KB; initial JavaScript plus data per page ≤ 1.5 MB uncompressed (CI-enforced).
- Browser tests in CI: map renders, plot card returns answers for the worked case, a document page expands a provision.

---

## 6. Pull request

- One draft pull request; preview URL at the top.
- Commit and push after each part; keep `docs/progress.md` current enough to resume.
- PR description: progress per part; **For owner review** (fidelity failures that could not be fixed, structure repairs, status changes, parameter mismatches, unresolved plot cases, the resolution rules for professional review); decisions made; known gaps; counts (provisions checked, insertions removed, corrections, duplicates removed, parameters by kind, page weights before and after).
- Declarations state plainly that all checks are machine checks and nothing has been verified by a person.
- The owner reviews the preview and merges.

---

## 7. Acceptance

- [ ] Every page shows the same release; no internal references in public copy (CI).
- [ ] Every provision's text traceable to its page or a recorded correction (CI); editorial insertions removed or moved to labelled notes; OCR noise corrected or marked unreadable; page furniture removed.
- [ ] No dates as clause numbers; no duplicate provisions; no runaway nesting; meaningful table labels; non-content excluded from topics (CI where possible).
- [ ] Instrument types explicit; compilation, maps and bills never shown as in-force instruments; 2017 notification's relationship to bye-law 1.4 explained with quotes; authority-succession rows supported by evidence.
- [ ] Parameters for coverage, FAR, setbacks, height, floors and parking with intervals, conditions and cell sources; 40-record self-check.
- [ ] Resolution rules as data with quoted authorities; resolver tested from source tables, including the worked case.
- [ ] Map-first home, readable map, plot card with plain answers and expandable detail.
- [ ] Most-recent-first lists everywhere; law order inside documents; plain primary layer with details on expand.
- [ ] Page budgets met; browser tests in CI; accessibility checks pass.
- [ ] Nothing invented; nothing presented as verified by a person.
