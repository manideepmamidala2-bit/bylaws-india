# Bengaluru Building Code: From Structured Library to Usable Code

**Date:** 25 November 2026 · **Basis:** the status review of 25 November 2026 and a review of the live site (https://bylaws-india.vercel.app) · **Scope:** existing data only

This plan is self-contained. It does not depend on any earlier plan.

---

## 1. Intent

Building in Bengaluru is governed by several instruments at once: the municipal building bye-laws, the master plan zoning regulations, their many amendments, corporation-specific amendments and parts of state law. They are published separately as PDFs, overlap, and sometimes contradict each other.

The project's purpose is to gather these **building bye-laws and codes** into **one structured, machine-readable, consolidated building code**, and to present it so that a person can find out what may be built on a plot, with every answer traceable to the official text.

---

## 2. Where the project stands

From the status review and the live site:

**Strong**
- A source register where every instrument has its official link, retrieval record, checksum, archive snapshot and quoted evidence of its legal status.
- Faithful structured text (a tree of every part, chapter, clause, sub-item and table row) for: Building Bye-laws 2003; RMP 2015 Zoning Regulations; eight amendments to the zoning regulations (2009 to January 2026); the 2026 bye-law amendments of the City Corporations; Chapter XVII of the Greater Bengaluru Governance Act 2024; the Karnataka Municipalities Model Building Bye-laws 2017. About 6,000 provisions; 66 tables in the two main documents.
- Dated amendment effects applied to provisions; drafts never applied.
- A real map: corporation boundaries, 369 wards, land-use zones from four master plan sheets (Bengaluru South only), a vector base map.
- A careful, accessible static website with law-first reading, original versus as-amended views and page links to the official PDFs.

**Weak**
- **No consolidated code.** Only about 25 clauses carry an as-amended reading; a reader must assemble the current law themselves.
- **Numbers are still text.** The tables that set coverage, FAR, setbacks and height store values like "Above 360 up to 1000" and "Up to 65%" as strings; some headers and quantities are misread.
- **Conflicts are flagged, not resolved, and the flags are weak.** Relations between documents are found by matching words and numbers, so many "conflicts" pair values that apply to different situations; many "precedence" links are internal conditions, not relations between instruments.
- **A modelling error:** the zoning regulations are recorded as "substituting" a bye-law clause. In law, bye-law 1.4 (inserted 2017) makes master plan rules govern use, coverage, FAR, setbacks, height, floors, dwelling units and parking. That is incorporation, not amendment.
- **The Model Building Bye-laws 2017 distort the data:** they are made under the Karnataka Municipalities Act (which governs municipalities, not city corporations), yet they are shown as in force and generate most of the definition conflicts.
- **The site answers "what does this clause say", not "what may I build here".**
- **The map is visible but hard to read:** faint styling, few recognisable cues, zones covering street names, and it starts below the fold.
- **Heavy and verbose pages:** some document pages ship up to 12 MB of HTML; conflict cards show internal IDs and codes; zone panels list dozens of clauses unranked.
- **Hygiene:** every corporation carries its own copy of every base document; about 248 MB of data and a 33 MB map file live in git; schema versions differ between files; some published declarations are stale; the browser map test does not run in CI.

---

## 3. Decisions

1. **Resolve conflicts openly.** Resolution rules are stored as data and applied deterministically. Every outcome is labelled as derived by the project, cites the rule and the authority it relies on, and keeps the other provision visible. The site recommends confirmation with the planning authority or a qualified professional.
2. **Model Building Bye-laws 2017:** moved to "register only, likely not applicable here", with the evidence. The structured text stays available but no longer feeds definitions, relations, parameters or plot answers.
3. **Kannada-only compilation (2024):** not structured; declared as a gap.
4. **First parameters:** ground coverage, FAR (base, premium, TDR), setbacks, building height, parking.
5. **Plot first:** a readable map is the front door; documents are the second door.
6. **No new data.** Use only what the repository already holds.
7. **English only.**

---

## 4. Principles for this work

- **Never generate source content.** No document text, table value, boundary or zone is invented or reconstructed. Anything that cannot be done from existing data is declared as a gap.
- **Everything traceable.** Every value shown links to the provision, table cell and page it came from, and to the official source.
- **Derived means labelled.** Consolidated text, parameter values parsed from tables, resolutions and traced zones are labelled as derived, with their method.
- **Honest verification.** Agent checks are recorded as machine-checked. Nothing is marked as verified by a person unless a person did it.
- **Unresolved is a valid answer.** If the rules do not settle a value, say "Not settled: two rules apply" and show both.
- **Plain language in public view.** No internal IDs, codes, enum names, file paths or rule numbers in the interface.
- **Tests must be able to fail.** Expected values are written from the source documents (checked against page images), never from the code's own output.
- **Nothing for one city in code.** Jurisdictions, documents and rules live in configuration and data, so the same code can serve another city later.
- **Working state at every step.** Commit and push after each part; the preview always shows a working, honest site.

---

## 5. Work, in order

### Part 1 — Clean foundation and speed

1. **Baseline.** Record which release and commit the work starts from in `docs/progress.md`.
2. **One schema version** across all schemas, config and published files; regenerate types; CI fails on mismatch.
3. **Store shared documents once.** Base documents and amendments are stored once (content-addressed); each corporation references them and stores only what differs (its amendments, its consolidated differences, its boundaries, wards and zones).
4. **Data out of git.** Published data and the map tile file move to object storage that supports HTTP range requests and CORS (verify with a test; Vercel Blob if it passes, otherwise Cloudflare R2). Git keeps code, configuration, corrections, reports and a small test fixture.
5. **Load in pieces.** Documents are split into per-chapter files plus an outline; pages fetch chapters on demand. Budgets enforced in CI: HTML per page ≤ 300 KB; initial JavaScript plus data per page ≤ 1.5 MB uncompressed.
6. **Search across all documents** with Pagefind (static, no server).
7. **Regenerate declarations** from the actual data, removing stale statements.
8. **Browser tests in CI:** map renders (tile requests return 206, canvas not blank), one document page, and the plot flow from Part 5.

### Part 2 — The consolidated code

1. **Full consolidated text** of every base document, as of today and as of each amendment date, per corporation where the bye-laws differ: every provision, not only changed ones. Published per chapter as JSON, and as a readable view; Akoma Ntoso XML export if time allows.
2. **Change marks:** each changed provision shows a quiet note ("Changed 2026, South City Corporation") linking to the amending provision and the original wording.
3. **Fix incorporation:** remove "substitute" effects authored by the zoning regulations against the bye-laws; add an `incorporates` relation from bye-law 1.4 to the zoning regulations, for the listed parameters, citing bye-law 1.4. Both texts remain live.
4. Declare what the consolidation cannot include (e.g. the July 2025 zoning amendment, which was never obtained).

### Part 3 — Parameters: the numbers as data

Model each building rule as a dated value with its legal reference, and with conditions per zone and plot, following established patterns for encoding legal parameters and zoning constraints (dated values with references; explicit conditions; a "dependent" marker when a condition cannot be expressed).

**Record shape (`parameters.json`):**
- `parameter`: `ground_coverage_max_pct`, `far_base_max`, `far_premium_additional_max`, `tdr_receivable_max`, `setback_front_min_m`, `setback_rear_min_m`, `setback_side_min_m`, `building_height_max_m`, `floors_max`, `parking_requirement`.
- `value`, `unit`, and `value_text` exactly as printed.
- `conditions`: numeric intervals with inclusive or exclusive ends for `plot_area_m2`, `plot_depth_m`, `plot_width_m`, `road_width_m`, `building_height_m`; categories for `zone`, area class or ring where the table uses one, `use`, `jurisdiction`. Conditions that cannot be expressed are kept as text with `dependent: true`.
- `valid_from`, `valid_to`, `legal_status`.
- `source`: document, provision address, table, row, column, cell text, page link, official URL.
- `method`, `confidence`, `verification`.

**Sources (already in the data):** the zoning regulations' development control tables (coverage, FAR, height by plot size and road width); setback tables, including as amended in January 2026; bye-law tables as substituted by the 2026 corporation amendments where they set building parameters; the premium FAR chapter; the TDR chapter; parking provisions.

**Table parsing:**
- Fix header parsing (multi-row headers; words like "Max" read as units) and footnotes that change meaning.
- A range parser for the phrasing used in these tables: "Up to X", "Above X up to Y", "X to Y", "Less than X", "X and above", in m, m², sq. mtrs, sq ft, %. Fix known misreads such as "10,000 sq. mtrs" read as "0".
- Every parsed value checked against its cell text; mismatches listed for owner review.
- Self-check of 40 sampled records against page images, recorded in `qa.md`.

### Part 4 — Resolution and the plot resolver

**Resolution order (`resolution.yaml`), applied top to bottom; each outcome records the step and its authority:**
1. Drafts never apply.
2. A corporation's amendment applies only inside that corporation.
3. Where the Greater Bengaluru Governance Act 2024 says "notwithstanding", it prevails.
4. For use, coverage, FAR, setbacks, height, floors, dwelling units and parking, the zoning regulations govern (bye-law 1.4).
5. Within one instrument family, the later in-force provision wins.
6. Otherwise: not settled; show both.

Each step's authority is quoted from the structured text. If the quote cannot be found in the data, the step is disabled and declared.

**Resolver** (command line in the pipeline and the same logic in the browser):
- Input: a location (or a chosen zone and corporation), plot area, road width; optionally plot depth and width, building height, use; a date (default today).
- Output per parameter: value and unit; the governing record with its cell, page and official link; the step used and its authority; the other applicable records and why they were not chosen; or "not settled" with both.
- Location to corporation, ward and zone by point-in-polygon (Turf.js in the browser, Shapely in the pipeline). Outside processed land-use sheets the zone is unknown; the user may choose one, clearly marked.
- Deterministic; tested with hand-written cases.

**Worked target (acceptance test):** a 600 m² plot on a 15 m road in a Residential (Main) zone of Jayanagar, today. The review expects coverage 65% and base FAR 2.25 from the zoning regulations' Table 1, setbacks from the January 2026 table, premium FAR and TDR headroom from their chapters, any lake buffer from the overlay, and the South City Corporation's 2026 changes, each with a page link and the step that selected it. **Confirm every expected value against the page images before writing the test.** Where the source differs from the review, the source wins and the difference is listed for owner review.

**Relations, rebuilt:**
- Keep only relations with legal meaning: `amends`, `incorporates`, `corporation_differs`, `cross_document_reference`, `definition_differs` (only between documents that both apply here), `precedence` (only between different instruments, never internal conditions).
- Remove word-matching "same topic" relations (topics stay as groupings) and number-matching "conflicts" (replaced by the resolver's reported alternatives, which carry their conditions).
- Show publicly only kinds confirmed by structure (`amends`, `incorporates`, `corporation_differs`). Prepare a 60-item labelling sheet (10 per kind) in `docs/review/relations-labelling.md` for the owner; other kinds stay hidden until their measured precision is at least 0.8.

### Part 5 — A readable, plot-first site

**Home is the map**, full width, above the fold on desktop and mobile, with one line of introduction.

**Readable map:**
- Base map in the Protomaps light style (road hierarchy, street and area names, parks, water, metro) from the existing tile file. The site's own visual style stays around the map, not on it.
- Project layers drawn beneath street and place labels: semi-transparent zone fills with clear outlines; zone codes inside polygons only when zoomed in.
- Zone colours taken from the official RMP 2015 land-use legends, so the map matches the authority's printed maps; legend in plain names.
- Controls: zoom, scale bar, full screen, my location, layer switch (Streets, Land-use zones, Wards, Corporations, Original sheet overlay).
- Search by place name (from names in the tile file) and by ward name or number. No outside geocoding service, no satellite layer.

**Click a place → plot card:**
- Corporation, ward, planning district, land-use zone (or "Zone data not yet available here").
- Inputs: plot area, road width; optional depth, width, height, use.
- Answers: coverage, FAR (base, premium, TDR), setbacks, height, parking. Each a number, one plain line on why, and a page link. "Not settled" items show both rules.
- Notice: "Derived from the official documents by this project. Confirm with the planning authority or a qualified professional before relying on it."
- Shareable link (location and inputs in the address).

**The law beneath:** each number opens its provision in the consolidated text with change marks and links to the original wording. Documents remain available from the menu.

**Less verbose:**
- Resolution cards instead of conflict cards: what governs, why in one line, the other provision, links.
- Zone panel grouped by topic (uses, coverage, FAR, setbacks, height, parking), each showing its governing provisions; no flat lists.
- Status, verification and dates shown once per document; on a provision only when different.
- Internal IDs only inside a "Details" toggle.
- Page introductions at most two sentences.

### Part 6 — Register and gaps

- Model Building Bye-laws 2017: "not applicable here (likely)", with the quoted evidence from its own title and enabling Act; listed under "In force elsewhere, not applicable here".
- Declared gaps, each in plain words with what it means for users: the July 2025 zoning amendment (not obtained; some values may not reflect it); the Kannada compilation (not structured); supporting instruments not in the dataset (fire NOC, standalone TDR rules, occupancy certificate exemption orders, metro influence zone); land-use zones only where sheets are processed.
- Data page lists the new release with consolidated documents, parameters, resolution rules, resolver test cases, relations (marked measured or unmeasured), boundaries, wards, zones, declarations and checksums.

---

## 6. Pull request

- One draft pull request; preview URL at the top.
- Commit and push after each part; keep `docs/progress.md` current enough to resume.
- PR description sections: progress per part; **For owner review** (the labelling sheet, parameter mismatches, unresolved cases, the six resolution rules for professional review); decisions made; known gaps; counts (parameters by kind, resolutions by step, unresolved count, page weights before and after).
- The owner reviews the preview and merges.

---

## 7. Acceptance

- [ ] One schema version; shared documents stored once; data and tiles out of git with range requests verified.
- [ ] Page budgets met; cross-document search; declarations accurate; browser tests in CI.
- [ ] Full consolidated documents per corporation and date; bye-law 1.4 modelled as incorporation.
- [ ] Parameters for coverage, FAR (base, premium, TDR), setbacks, height and parking with intervals, conditions and cell-level sources; 40-record self-check.
- [ ] Resolution rules as data with quoted authorities; deterministic resolver; worked target passes after confirming values against page images.
- [ ] Relations rebuilt; only structurally confirmed kinds public; labelling sheet ready.
- [ ] Readable, map-first home; plot card with answers, reasons and page links; resolution cards; plain, short copy.
- [ ] Model Bye-laws 2017 excluded from answers; all gaps declared in plain words.
- [ ] Nothing invented; nothing marked verified by a person; accessibility checks pass.
