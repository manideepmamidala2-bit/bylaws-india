# Intake: Bengaluru Building Bylaws: Trustworthy Data, a Usable Code, a Simple Site (Parts 1–6)

**Change**: 261125-ucy1-trustworthy-simple-building-code
**Created**: 2026-11-25

## Origin

> Implement docs/plans/trustworthy-simple-building-code-plan.md using only data already in the repository: open one draft PR with the preview URL at the top; Part 1 make every page show the same release and remove internal references from public copy, with CI checks; Part 2 enforce text fidelity in CI (every provision's text found on its cited page or covered by a recorded correction), remove editorial insertions into labelled site notes, restore table digests as real tables, correct OCR against page images or mark unreadable, strip gazette headers; Part 3 repair structure (dates never clause numbers, remove duplicates, list items as siblings, depth and uniqueness checks, real table captions, non-content excluded from topics); Part 4 explicit instrument types (compilation, map and bill never shown as in force), explain the 2017 notification's relationship to bye-law 1.4 with quotes, evidence-backed authority succession, statuses re-derived from evidence; Part 5 tables as data, parameter records for coverage, FAR, setbacks, height, floors and parking with intervals and cell sources, resolution rules as data with quoted authorities, resolver in pipeline and browser tested from source tables including the Jayanagar 600 m² / 15 m road case, 40-record self-check; Part 6 map-first home with a readable light base map, plot card with plain answers and tap-to-expand detail, most-recent-first lists everywhere with law order inside documents, plain primary layer with details on expand, "Rules by subject" showing what applies today first, page budgets and browser tests in CI; commit and push after each part, keep docs/progress.md resumable and the PR's "For owner review", "Decisions made" and "Known gaps" sections current; never invent or rewrite legal text, never present anything as verified by a person.

One-shot invocation referencing the self-contained specification in `docs/plans/trustworthy-simple-building-code-plan.md` (dated 25 November 2026), operating strictly on data already in the repository with zero new acquisition.

## Why

1. **Problem**: A live-site audit of `bylaws-india` on 25 November 2026 identified critical gaps across consistency, text fidelity, document structure, legal status/relationships, conflict resolution, and non-expert usability:
   - **Release & copy inconsistency**: Different pages report different release states ("two base documents", "Amendment links 0", "pending in PR 11") and expose internal project vocabulary (`PR 11`, `Schema 1.4`, `topic:setbacks`, `state_rules`, `sq_m`, `Local Graph →`) in public copy.
   - **Text fidelity violations**: Several provisions contain editorial insertions inside legal sentences (bracketed notification numbers and deviation percentages inside `bbl-2003` bye-law `6.0(i)`, table digests presented as clause prose in `rmp2015-zr` regulation `3.1`, publication notes inside `bbl-2003` bye-law `1.4`), alongside uncleaned OCR noise (`"LL Dhl"`, `"Ms ~ fh . Cc — 3 To The Com…"`), gazette mailing headers, and split words (`"M inimum"`).
   - **Structural defects**: Date-shaped tokens (`11.11.2025`, `12.12.2025`) are parsed as clause numbers (`cl_11.11.2025`), creating false parent nodes and duplicate clauses (e.g., clause 17 of the premium FAR notification appears three times); sibling list items (`(a), (b), (c)` / `(i), (ii), (iii)`) nest as children up to ~18 levels deep; tables carry redundant captions (`"Table 1 — Table 1"`); and non-content nodes (tables of contents, cover pages, gazette headers) are tagged to topics like `setbacks`.
   - **Ambiguous instrument types & relationships**: The Kannada compilation and maps appear as in-force instruments with "Full text"; the relationship between the Karnataka Municipalities Model Building Bye-laws 2017 (`UDD 14 TTP 2017`) and `bbl-2003` bye-law `1.4` is not explained with quotes; and authority succession rows cite clauses (e.g. a deviation clause) or dates that do not substantiate the succession claim.
   - **Usability & conflict presentation**: Resolution cards repeat text or truncate mid-word without stating the governing value; topics are unranked keyword dumps of 96+ provisions rather than "what applies today" comparisons; document pages repeat metadata on every item; and the map page buries the map under raw coordinate systems, URLs, contradictory accuracy figures, and a 72-ward text list.
2. **Consequence of not fixing**: Homeowners, builders, architects, and legal reviewers cannot trust that quoted provision text is verbatim official text, encounter duplicated or deeply nested broken clauses, see internal developer jargon and contradictory statuses, and struggle to get a clear, verifiable answer to *"what can I build on my plot?"*.
3. **Why this approach**: Executing Parts 1–6 in `docs/plans/trustworthy-simple-building-code-plan.md` enforces machine-checked text fidelity against page text/images in CI, strips editorial insertions into separate labelled `note_by_site` records, repairs date-token/list-nesting/table-caption structure with CI gates, formalizes instrument types and quoted statutory relationships, ensures cell-traceable parameter extraction and resolution rules, and delivers a clean progressive-disclosure UI ("primary layer short and plain; everything else tap to expand") with a single draft PR and per-part commits.

## What Changes

### Part 1 — One Consistent Site

1. **Uniform Release Across All Pages**:
   - Audit data loading (`lib/data.ts`, `public/data/manifest.json`, static generation, and per-jurisdiction release pointers) so Home (`/`), Map (`/j/[id]`), Documents, Rules by subject (`/j/[id]/topics`), Timeline, Sources, Review, and Data (`/data`) all read and report the exact same current release (`5.0.0` / unified active release across `in-ka-bengaluru` and the 5 City Corporations) with zero stale static notices ("two base documents", "Amendment links 0").
2. **CI Check for Release Uniformity**:
   - Add an automated test / CI check (`pipeline/tests/test_release_and_copy_consistency.py` and build check) verifying that every built HTML page and dataset manifest entry reports the same release identifier.
3. **Remove Internal References from Public Copy + CI Gate**:
   - Strip all internal project references from public copy across React components, data generators, and configuration descriptions: PR numbers (`PR 11`, `PR 05`, `PR 08`, etc.), internal plan names (`Plan v2`, `building-code-plan`), schema version badges (`Schema 1.4`, `Schema 1.3`), internal file paths (`public/data/...`, `jurisdictions/...`), raw enum identifiers (`state_rules`, `topic:setbacks`, `sq_m`), and raw IDs in the primary layer.
   - Add a CI gate that scans built HTML pages (and public-facing strings) and fails if any forbidden internal reference pattern appears in public copy.
4. **Regenerate Declarations and Status Notices from Actual Data**:
   - Regenerate `declarations.json` and all site status notices strictly from the live structured, consolidated, and parameter dataset state.

### Part 2 — Text Fidelity (Machine-Enforced)

1. **Page-Level Text Fidelity Check (`pipeline/bylaws/fidelity.py` & `pipeline/tests/test_text_fidelity.py`)**:
   - Implement a deterministic fidelity verifier that checks every structured and consolidated provision's text (`heading`, `intro`, `content`, `wrap_up`, and table cell text) against the parser's extracted text of its cited page(s) in `data/interim/<jurisdiction>/parse/<doc_id>/` after whitespace/hyphenation normalization, or verifies that any difference is covered by an explicit recorded `ocr_correction` entry or `"[unreadable in source]"` marker.
   - Report every failing provision and its differing words.
2. **Remove Editorial Insertions into Labelled Site Notes (`note_by_site`)**:
   - Add `notes_by_site` (`string[]` or structured `{ text, kind, source_ref }` rendered as `"Note by this site"`) and `summary_by_site` (`"In short (by this site)"`) to `schemas/clause-tree.schema.json`, `schemas/consolidated.schema.json`, `schemas/document.schema.json`, and `schemas/overrides.schema.json`.
   - Remove all non-source editorial insertions from provision text in `data/overrides/`, `pipeline/bylaws/structure.py`, `pipeline/bylaws/amendments.py`, and `jurisdictions/*.yaml` `amendment_links`:
     - Bracketed notes and notification numbers/percentages inserted into `bbl-2003` bye-law `6.0(i)` (`[Per BBMP/GBA Notification...]`) → restore exact source wording and move explanation to `note_by_site`.
     - Publication descriptions inserted into `bbl-2003` bye-law `1.4` (`[Inserted by UDD 14 TTP 2017...]`) → restore exact printed clause text from the 2017 gazette notification and move the provenance note to `note_by_site`.
     - Any website names, bracketed commentary, or synthetic replacement prose across all documents and `amendment_links`.
3. **Restore Table Digests as Real Tables**:
   - Where a provision's text was replaced or supplemented by an editorial digest of a table (specifically `rmp2015-zr` regulation `3.1` and any similar provisions), restore the verbatim surrounding text from the source page and represent the tabular content as a proper `table` node with `table_meta` and `table_row` children.
4. **OCR Corrections & Unreadable Fragments**:
   - Add structured `ocr_corrections` support (`{ original_text, corrected_text, page, reason }`) and `ocr_status: "corrected" | "unreadable_fragments"` on provisions.
   - Compare OCR noise (`"LL Dhl"`, `"Ms ~ fh . Cc — 3 To The Com…"`, split words like `"M inimum"`, garbled headers) against rendered PDF page images (`pypdfium2` at 150 DPI):
     - Where the printed text on the page image is unambiguous, record `original_text`, `corrected_text`, `page`, and `reason`, and mark the provision `"corrected"` (UI shows `"Corrected OCR"` and reveals `original_text` on tap).
     - Where the source scan is genuinely illegible, replace the garbled fragment with `"[unreadable in source]"` and link directly to the PDF page.
5. **Strip Page Furniture**:
   - Strip gazette mailing headers (e.g. `"To The Compiler, Karnataka Gazette..."`, `"RNI No..."`, postal registration headers), running heads, standalone page numbers, and form-feed artefacts in `pipeline/bylaws/structure.py` before clause text assembly.
6. **CI Gate & QA Reporting**:
   - Run the text fidelity check in CI (`pytest pipeline/tests/test_text_fidelity.py`) so any provision text not traceable to its cited page or a recorded correction fails the build.
   - Report exact counts in `data/reports/<jurisdiction>/qa.md`: provisions checked, editorial insertions removed, site notes created, OCR corrections applied, and unreadable fragments marked.

### Part 3 — Structure Repair

1. **Dates Never Parsed as Clause Numbers**:
   - Update clause-number regexes and tokenizers in `pipeline/bylaws/structure.py` to reject date-shaped tokens (`dd.mm.yyyy`, `dd-mm-yyyy`, `dd/mm/yyyy`, `yyyy-mm-dd`, e.g. `11.11.2025`, `12.12.2025`, `28.10.2017`) as clause or subclause numbers.
   - Rebuild all affected documents (including `rmp2015-zr-amend-2025-04` Premium FAR notification and all gazette amendments), eliminating false date-parent nodes (`cl_11.11.2025`, `cl_12.12.2025`) and the duplicate clauses they caused (e.g. keeping exactly one copy of clause 17 of the premium FAR notification with complete citations).
2. **Siblings, Not Runaway Children + Depth Check**:
   - Fix list-item hierarchy attachment in `pipeline/bylaws/structure.py`: sequential list items at the same numbering style (`(a), (b), (c)` or `(i), (ii), (iii)` or `(1), (2), (3)`) attach as siblings under their shared parent rather than nesting each item inside the previous one.
   - Add an automated depth check in `validate.py` and CI: no provision `eid` address may exceed the document's real maximum structural depth (max 6 levels; anything deeper than 6 levels fails validation/CI).
3. **Provision Uniqueness Check in CI**:
   - Enforce in `validate.py` and `pipeline/tests/` that no two provisions in the same document have identical `native_number` and normalized text under the same scope (or duplicate clause copies caused by parser state resets); duplicates fail CI.
4. **Meaningful Table Labels**:
   - Extract the printed table caption for every `table` node `heading`; if no caption is printed on the page, label it `"Table (under <parent provision number/title>)"`. Eliminate all redundant labels like `"Table 1 — Table 1"`.
5. **Exclude Non-Content from Topics and Zones**:
   - Update `pipeline/bylaws/annotations.py`, `pipeline/bylaws/relations.py`, and `clause-zone-tags` generation so `preface`, `preamble`, `signature_block`, tables of contents, indexes, cover pages, and gazette headers are never tagged with `topic` or `zone_applicability` annotations.
6. **Rebuild Addresses, Links, References, Topics, and Relations**:
   - Re-run structure, annotations, amendments, consolidation, parameters, and relations across all jurisdictions so all `eid` addresses, cross-references, amendment targets, topics, and relations reflect the repaired trees.

### Part 4 — Statuses and Relationships

1. **Explicit Instrument Types (`instrument_type`)**:
   - Add explicit `instrument_type: "instrument" | "compilation" | "map" | "bill" | "order"` to `schemas/jurisdiction.schema.json` and `schemas/document.schema.json`.
   - Enforce in pipeline validation and UI rendering that `compilation`, `map`, and `bill` entries **never** display `"In force"` or `"Full text"`.
2. **Kannada Compilation (`rmp2015-zr-2024-kan`)**:
   - Set `instrument_type: "compilation"`, `structured: false` (English-only structuring per Decision 9), and keep it in the Sources list with its official link and plain description (`"Unofficial compilation (finding aid only, not structured)"`).
3. **Model Building Bye-laws 2017 (`ka-model-bbl-2017` / `UDD 14 TTP 2017`) & Bye-law 1.4 Relationship**:
   - Inspect the exact held text of `ka-model-bbl-2017` (`UDD 14 TTP 2017`, dated 28-10-2017) and `bbl-2003` / its amendments in `data/raw/` and `data/interim/`:
     - Determine and record with verbatim quotes:
       1. Whether `ka-model-bbl-2017` applies to City Corporations (quoting its preamble/title under the *Karnataka Municipalities Act, 1964* vs. *KMC Act, 1976* / *GBGA 2024*, and checking whether `UDD 14 TTP 2017` relates to BBMP/City Corporations).
       2. Whether its clause `1.3` / `1.4` is the source of the rule recorded as `bbl-2003` bye-law `1.4` (that Master Plan Zoning Regulations prevail for plot area, coverage, FAR, setbacks, height, floors, dwelling units, and parking).
       3. How bye-law `1.4` came to be in the 2003 bye-laws (or whether `UDD 14 TTP 2017` was cited by compilation/practice, recording the exact finding and any uncertainty with both quotes).
     - Present this relationship in plain words in the UI and data (`"This 2017 notification is where the rule that master plan regulations govern setbacks, FAR and coverage comes from"` — or where a sub-question is not settled by the held text, state `"unclear"` with both verbatim quotes).
     - Ensure `ka-model-bbl-2017`'s other provisions do not feed plot answers unless the held evidence proves they apply in Bengaluru City Corporations.
4. **Evidence-Backed Former and Current Authorities (`jurisdictions/succession.yaml`)**:
   - Audit every row in `jurisdictions/succession.yaml` against the structured text of the cited instruments (`gbga-2024`, May 2026 Corporation notifications, etc.).
   - Every row must carry a verbatim quote that **actually states the institutional/office succession** (never a deviation percentage clause) and an `effective_date` matching that quote/notification. Rows lacking direct textual evidence in the repository are either removed or explicitly marked `status: "not_confirmed"` with an honest explanation.
5. **Re-derive Every Instrument's Status from Held Evidence**:
   - Re-verify `legal_status` and `status_evidence` for all 23+ entries across `jurisdictions/in-ka-bengaluru*.yaml`, cleanly separating `in_force` finals, `draft` notifications (never applied), `superseded` drafts (e.g. April 2026 corporation drafts superseded by May 2026 finals, Feb 2025 premium FAR draft superseded by April 2025 final), `bill` (`ktcda-amend-bill-2025`), `compilation`, and `map`.

### Part 5 — The Numbers as Data

1. **Tables as Data (`pipeline/bylaws/structure.py` & `pipeline/bylaws/parameters.py`)**:
   - For every parameter-setting table in the in-force instruments (`rmp2015-zr`, `rmp2015-zr-amend-2025-04`, `rmp2015-zr-amend-2025-10`, `rmp2015-zr-amend-2026-01`, `bbl-2003`, `b*cc-bbl-amend-2026-05`), store each cell's verbatim text (`cell_text`) and parsed numeric value/unit or numeric interval (`"Up to X"`, `"Above X up to Y"`, `"X to Y"`, `"Less than X"`, `"X and above"`).
   - Ensure multi-row headers are cleanly merged without reading `"Max"`/`"Min"` as units and all known OCR/table misreads are fixed via page-image-verified overrides or parser rules.
2. **Parameter Records (`parameters.json`)**:
   - Generate complete, cell-sourced records for: ground coverage, FAR (base, premium, TDR), setbacks (front, rear, sides), building height, number of floors, and parking.
   - Include `value`, `unit`, `value_text`, `conditions` (`plot_area_m2`, `plot_width_m`, `plot_depth_m`, `road_width_m`, `building_height_m`, `zone`, `area_class`/`ring`, `use`, `jurisdiction`), `valid_from`, `valid_to`, and full cell provenance (`doc_id`, `eid`, `table_eid`, `row_index`, `col_index`, `column_header`, `row_header`, `cell_text`, `page`, `official_url`, `archive_url`).
   - Conditions that cannot be expressed as numeric intervals or categories are preserved in `unexpressed_conditions` and marked `dependent: true` (rendered as `"depends on conditions"`).
3. **Resolution Rules as Data (`jurisdictions/resolution.yaml`)**:
   - Verify the 6 ordered resolution steps in `jurisdictions/resolution.yaml`:
     1. Drafts never apply.
     2. A corporation's amendment applies only in that corporation.
     3. Where the Greater Bengaluru Governance Act 2024 says `"notwithstanding"`, it prevails.
     4. For use, coverage, FAR, setbacks, height, floors, dwelling units and parking, the master plan zoning regulations govern (bye-law 1.4, and its source as established in Part 4).
     5. Within one family of instruments, the later in-force provision wins.
     6. Otherwise: not settled; show both.
   - Verify every step's quoted authority against the repaired structured text; switch off and declare any step whose authority cannot be quoted from the held data.
4. **Resolver in Pipeline and Browser (`pipeline/bylaws/resolver.py` & `lib/resolver.ts`)**:
   - Accept location (or zone + corporation), plot area, road width, optional plot width, plot depth, building height, use, and date (default today).
   - Output per parameter: governing value, one-line plain reason (`why`), source and page link, other applicable provisions with one-line reasons why they were not chosen, or `"not_settled"` showing both.
5. **Falsifiable Test Cases from Source Tables (Including Worked Jayanagar Case)**:
   - Write falsifiable test cases directly from source tables (checked against PDF page images) in `pipeline/tests/test_resolver.py` and `__tests__/resolver.test.ts`, including the worked case: **600 m² residential plot on a 15 m road in a Residential (Main) zone in Jayanagar, today**. Where the source document differs from any prior expectation, the source wins.
6. **40-Record Self-Check in `qa.md`**:
   - Re-verify 40 sampled parameter records against rendered PDF page images and record the full comparison table in `data/reports/<jurisdiction>/qa.md`.

### Part 6 — A Simple Site for Non-Experts

1. **Primary Layer Short and Plain; Everything Else Tap to Expand**:
   - Enforce across all pages: no internal IDs (`bbl-2003`, `sec_1.0`), enum names (`state_rules`, `in_force`), schema versions (`Schema 1.4`), or file paths in the primary layer.
   - Units formatted normally (`"m²"`, `"m"`, `"%"`), never `"sq_m"` or `"pct"`.
   - No repeated headings inside provision text (if `heading` equals `content` or starts `content`, deduplicate in display/data).
   - Page introductions at most two sentences.
   - `"Local graph"` and technical metadata available only inside the expanded view.
2. **Home = The Map (`app/page.tsx`, `app/j/[id]/page.tsx`, `components/ZoneMap.tsx`)**:
   - Full-width map above the fold with one line of introduction.
   - Readable base map (Protomaps light style: road hierarchy, street and area names, parks, water, metro); project layers drawn beneath street labels (`beforeId`); zone colours from the official RMP 2015 land-use legends; plain legend names.
   - Controls: zoom, scale bar, my location, full screen, simple layer switch (`Streets`, `Land-use zones`, `Wards`, `Corporations`, `Original map sheet`).
   - Search by place name (from base map names) and by ward name or number.
   - Move all technical map text (source URLs, coordinate system codes `EPSG:32643`/`EPSG:4326`, RMSE figures, 72-ward text lists, layer metadata) behind an `"About this map"` expander. State **one honest accuracy figure** (the measured OSM road median offset, e.g. `"Within about 8 m of street centre-lines"`) in plain words in the primary view instead of contradicting `"about 8 m"` with `"±0.0032 m"`.
3. **Plot Card (`components/PlotCard.tsx`)**:
   - Primary view: area name, ward, corporation, and zone in plain words; inputs (plot size, road width) and answers: coverage, FAR, setbacks, height, floors/parking, each as a clean number with one short plain-English reason.
   - Tap to expand each answer: verbatim provision text, table row, PDF page link, archive link, resolution step & quoted authority, and other provisions that also apply (with why they were not chosen).
   - `"Not settled"` shown plainly with both rules.
   - Exact one-line notice: `"Worked out from the official documents by this site. Confirm with the planning authority or a qualified professional."`
4. **Documents (`/j/[id]/documents` & `/j/[id]/documents/[doc]`)**:
   - Documents list: **most recent first** (`effective_from` / `notified_date` descending); each item shows plain title, date, one status in plain words (`"In force since 14 May 2026"`, `"Draft, not in force"`, `"Replaced"`, `"Unofficial compilation"`, `"Bill, not yet law"`, `"Reference map"`), and an `"In short (by this site)"` one-line summary.
   - Document page: **law's own order** (`1.0, 1.1, 1.2…`); each provision shows its number and verbatim text only in the primary layer. Change marks are a small tag (`"Changed in 2026"`).
   - Tap a provision to expand: official PDF page link, archive link, version history (**most recent first**), notes by the site (`"Note by this site"`), OCR correction details (`"Corrected"` with original text), references, local graph link, and technical address (`eid`).
   - Load chapter by chapter with a clean outline for navigation.
5. **Rules by Subject (renamed from Topics — `/j/[id]/topics` & `/j/[id]/topics/[topic]`)**:
   - Rename `"Topics"` in navigation and headings to `"Rules by subject"`.
   - Each subject page starts with **"What applies today"** (the governing in-force provision(s) and, where available, their parameter values), followed by `"Older or replaced rules"` (collapsed by default) and `"Related provisions"` (collapsed by default).
   - Resolution cards state clearly: what governs, the governing value (if known), and why in one plain line; tap to expand for both provisions and the quoted statutory authority. Never repeat sentences or truncate mid-word.
   - Exclude tables of contents, empty headings, and unrelated provisions.
6. **Timeline (`/j/[id]/timeline`) & Sources (`/j/[id]/sources`)**:
   - Timeline: **most recent first**; each entry shows date, plain title, and a one-line `"what changed"` summary; tap to expand the list of changed provisions.
   - Sources: **most recent first**; plain names and plain-word statuses in the primary layer; technical fields (SHA-256 checksums, HTTP retrieval records, Wayback archive metadata, file sizes) behind a tap-to-expand `"Technical details"` disclosure.
7. **Performance Budgets & CI Browser Tests**:
   - Enforce per-chapter loading and CI page budgets: HTML per page ≤ `300 KB`, initial JS + data per page ≤ `1.5 MB` uncompressed.
   - Playwright browser tests in CI (`e2e/`):
     1. Map renders with light base map and controls.
     2. Plot card returns plain-language answers for the worked Jayanagar 600 m² / 15 m road case and expands detail on tap.
     3. Document page renders provisions in law order and expands a provision on tap to reveal page links and details.

## Affected Memory

- `architecture/overview`: (modify) Update pipeline stages (`fidelity.py` text fidelity gate, structure date-token/sibling/depth/uniqueness guards, instrument types, `ka-model-bbl-2017` / bye-law `1.4` relationship evidence, evidence-backed `succession.yaml`, plain-language progressive-disclosure UI, "Rules by subject" navigation, and CI release/copy/fidelity checks).
- `schemas/data-contracts`: (modify) Update Schema `1.4` contracts (`instrument_type`, `summary_by_site`, `notes_by_site`, `ocr_corrections`, `ocr_status`, `succession` evidence fields, and release/copy/fidelity invariants).

## Impact

- **Schemas & Codegen (`schemas/`, `pipeline/bylaws/models/_generated.py`, `lib/types/generated.ts`)**: Add `instrument_type`, `summary_by_site`, `notes_by_site`, `ocr_corrections`, and `ocr_status` fields across `document.schema.json`, `jurisdiction.schema.json`, `clause-tree.schema.json`, `consolidated.schema.json`, and `overrides.schema.json`.
- **Python Pipeline (`pipeline/bylaws/`)**:
  - `fidelity.py` (new) & `validate.py`: Page-text fidelity verification, OCR correction tracking, editorial insertion removal audit, depth check (≤6 levels), duplicate provision check, and `qa.md` fidelity/OCR reporting.
  - `structure.py`: Reject date-shaped tokens as clause numbers, fix sibling list-item attachment, strip gazette mailing headers/running heads/page furniture, restore `rmp2015-zr` 3.1 table digest as a real `table` node, and generate meaningful table captions.
  - `annotations.py` & `relations.py`: Exclude non-content nodes (`preface`, `preamble`, `signature_block`, ToC, headers) from topics and zones; ensure clean resolution card summaries.
  - `parameters.py` & `resolver.py`: Verify cell-level parameter records, `dependent` condition flags, `resolution.yaml` quoted authorities, and worked Jayanagar test case.
- **Data Configurations & Overrides (`jurisdictions/`, `data/overrides/`)**:
  - Explicit `instrument_type` and plain `summary_by_site` on all documents; `rmp2015-zr-2024-kan` marked `compilation` (`structured: false`).
  - Quoted explanation of `ka-model-bbl-2017` (`UDD 14 TTP 2017`) and `bbl-2003` bye-law `1.4`.
  - Evidence-audited `jurisdictions/succession.yaml`.
  - Cleaned overrides (`data/overrides/in-ka-bengaluru*/overrides.yaml`) moving editorial notes out of provision text into `notes_by_site` and recording page-image-verified `ocr_corrections`.
- **Next.js Web Application (`app/`, `components/`, `lib/`, `e2e/`)**:
  - Consistent release display across all routes; zero internal references/IDs/enums in primary copy.
  - Home/Map with `"About this map"` expander and single honest accuracy figure; `PlotCard.tsx` with plain answers, tap-to-expand details, and exact one-line disclaimer notice.
  - Documents list (most recent first, plain status, `"In short (by this site)"`), Document viewer (law order, number + verbatim text only in primary view, `"Changed in 2026"` tag, tap-to-expand details/notes/history/address).
  - `"Rules by subject"` (`/j/[id]/topics`) showing `"What applies today"` first, collapsed `"Older or replaced rules"` and `"Related provisions"`, and non-truncated Resolution cards with governing values.
  - Most-recent-first Timeline and Sources with technical details behind expanders.
- **CI & Tests (`pipeline/tests/`, `__tests__/`, `e2e/`, `.github/workflows/ci.yml`)**:
  - CI gates for single release across pages, zero internal references in public copy, 100% provision text fidelity to cited pages/corrections, structural depth & uniqueness, page budgets, and Playwright E2E tests.

## Open Questions

None — `docs/plans/trustworthy-simple-building-code-plan.md` is self-contained and explicitly resolves all 10 design decisions in Section 3.

## Assumptions

| # | Grade | Decision | Rationale | Scores |
|---|-------|----------|-----------|--------|
| 1 | Certain | Enforce strict verbatim text fidelity in CI so every provision's text matches its cited page parser text (normalized) or an explicit recorded `ocr_correction` / `"[unreadable in source]"`, moving all editorial text into `notes_by_site` | Explicitly decided in Section 3 Decisions 1–2 and Part 2 ("Each provision's text must be found in the parser's text of its cited page(s), after whitespace normalisation, or be covered by a recorded correction") | S:100 R:90 A:95 D:100 |
| 2 | Certain | Reject date-shaped tokens (`dd.mm.yyyy`, `dd-mm-yyyy`, `dd/mm/yyyy`) as clause numbers, attach same-level list items (`(a),(b),(c)`, `(i),(ii),(iii)`) as siblings with a max depth check (≤6), and fail CI on duplicate provisions | Explicitly specified in Part 3 items 1–3 | S:100 R:90 A:95 D:100 |
| 3 | Certain | Classify every register entry with an explicit `instrument_type` (`instrument`, `compilation`, `map`, `bill`, `order`), never show `"In force"` or `"Full text"` on compilations/maps/bills, and keep the Kannada compilation unstructured (`compilation`) | Explicitly specified in Section 3 Decision 9 and Part 4 items 1–2 | S:100 R:90 A:95 D:100 |
| 4 | Certain | Determine and explain with verbatim quotes from held text how `UDD 14 TTP 2017` (`ka-model-bbl-2017`) relates to `bbl-2003` bye-law `1.4` and City Corporations, stating `"unclear"` with both quotes if any sub-question is not settled by the text | Explicitly specified in Part 4 item 3 | S:95 R:90 A:95 D:95 |
| 5 | Certain | Audit `jurisdictions/succession.yaml` so every authority-succession row is backed by a quote that actually states the succession and a matching effective date, removing or marking `"not confirmed"` any unsupported row | Explicitly specified in Part 4 item 4 | S:95 R:90 A:95 D:95 |
| 6 | Certain | Order every list of instruments/changes most-recent-first (Documents list, Sources, Timeline, provision amendments, version history) while keeping the law's own order (`1.0, 1.1, 1.2…`) inside a document | Explicitly specified in Section 3 Decision 4 and Part 6 | S:100 R:90 A:95 D:100 |
| 7 | Certain | Present a plain-language primary layer (no internal IDs, enum names, schema versions, file paths, or `"sq_m"`; `"Topics"` renamed `"Rules by subject"` with `"What applies today"` first; map technical details behind `"About this map"`; provision metadata behind tap-to-expand) | Explicitly specified in Section 3 Decisions 3 & 5 and Part 6 | S:100 R:85 A:95 D:100 |
| 8 | Certain | Work on a new feature branch and open one draft PR (or update the active draft PR) with the preview URL at the top, committing and pushing after each part while keeping `docs/progress.md` and the PR's review sections current | Explicitly specified in Section 6 and the user prompt | S:95 R:90 A:95 D:95 |

8 assumptions (8 certain, 0 confident, 0 tentative, 0 unresolved).
