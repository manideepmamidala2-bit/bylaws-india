# Plan: Bengaluru Building Bylaws: Trustworthy Data, a Usable Code, a Simple Site (Parts 1–6)

**Change**: 261125-ucy1-trustworthy-simple-building-code
**Intake**: `intake.md`

## Requirements

### Site Consistency & Public Copy Hygiene: Part 1

#### R1: Uniform Release Across All Pages and Zero Internal Project References in Public Copy
Every built page and dataset loader in the web application (`app/`, `components/`, `lib/data.ts`) and published manifest (`public/data/manifest.json`) MUST report the exact same active release identifier (`5.0.0` across `in-ka-bengaluru` and the 5 City Corporations), and all declarations and status notices MUST be regenerated directly from the current structured, consolidated, and parameter dataset state. Public copy across all pages and components SHALL NOT contain internal project references, including PR numbers (`PR 11`, `PR 05`, `PR 08`), internal plan names (`Plan v2`, `building-code-plan`), schema version labels (`Schema 1.4`, `Schema 1.3`), repository file paths (`public/data/`, `jurisdictions/`), raw enum identifiers (`state_rules`, `topic:setbacks`, `sq_m`), or raw internal IDs in the primary view. Both invariants MUST be enforced in CI (`pipeline/tests/test_release_and_copy_consistency.py`).

- **GIVEN** the published release dataset and the built Next.js application
- **WHEN** `pytest pipeline/tests/test_release_and_copy_consistency.py` and the build checks execute in CI
- **THEN** every page and jurisdiction manifest entry reports the same release version (`5.0.0`) with zero stale release notices ("two base documents", "Amendment links 0", "pending in PR 11")
- **AND** zero forbidden internal references (PR numbers, plan names, schema versions, file paths, `sq_m`, `state_rules`, `topic:`) appear in public copy

### Text Fidelity & Provenance: Part 2

#### R2: Machine-Enforced Verbatim Text Fidelity, Labelled Site Notes, Real Tables, OCR Corrections, and Page-Furniture Stripping
Every structured and consolidated provision's text (`heading`, `intro`, `content`, `wrap_up`, and table cell text) MUST be found in the parser's extracted text of its cited page(s) (`data/interim/<jurisdiction>/parse/<doc_id>/`) after whitespace normalization, or be covered by an explicit recorded `ocr_correction` (`{ original_text, corrected_text, page, reason }` with `ocr_status: "corrected"`) or `"[unreadable in source]"` marker (`pipeline/bylaws/fidelity.py`, enforced in CI by `pipeline/tests/test_text_fidelity.py`). All editorial insertions in provision text (bracketed notes, notification numbers, deviation percentages inside `bbl-2003` bye-law `6.0(i)`, publication notes inside `bbl-2003` bye-law `1.4`, website names, and synthetic summaries) MUST be removed from legal text and stored separately in `notes_by_site` (labelled `"Note by this site"`) or `summary_by_site` (labelled `"In short (by this site)"`). Provisions whose text was a digest of a table (such as `rmp2015-zr` regulation `3.1`) MUST restore the verbatim surrounding text and represent the table as a proper `table` node. Gazette mailing headers (`"To The Compiler..."`, `"RNI No..."`), running heads, standalone page numbers, and form-feed artefacts MUST be stripped from provision text, and exact counts (provisions checked, insertions removed, notes created, corrections, unreadable fragments) MUST be reported in `data/reports/<jurisdiction>/qa.md`.

- **GIVEN** all structured and consolidated documents across `in-ka-bengaluru` and the 5 City Corporations
- **WHEN** `bylaws validate` and `pytest pipeline/tests/test_text_fidelity.py` run
- **THEN** 100% of provisions have text traceable to their cited page(s) or a recorded `ocr_correction` / `"[unreadable in source]"` entry
- **AND** `bbl-2003` bye-laws `6.0(i)` and `1.4` contain only verbatim gazette text with explanatory notes moved to `notes_by_site`, `rmp2015-zr` regulation `3.1` represents its land-use classification table as a real `table` node, gazette headers and OCR noise (`"LL Dhl"`, `"M inimum"`) are stripped or corrected with `original_text` preserved, and `qa.md` reports all five fidelity counts

### Structure Repair & Topic Hygiene: Part 3

#### R3: Date-Token Rejection, Sibling List-Item Hierarchy, Depth & Uniqueness Gates, Meaningful Table Captions, and Non-Content Topic Exclusion
`pipeline/bylaws/structure.py` SHALL NOT parse date-shaped tokens (`dd.mm.yyyy`, `dd-mm-yyyy`, `dd/mm/yyyy`, `yyyy-mm-dd`, such as `11.11.2025` or `12.12.2025`) as clause numbers, and rebuilding affected documents MUST eliminate false date-parent nodes and duplicate clauses (such as the three copies of clause 17 in `rmp2015-zr-amend-2025-04`). Sequential list items at the same numbering style (`(a), (b), (c)` or `(i), (ii), (iii)`) MUST attach as siblings under their shared parent rather than nesting as children of the previous item, and `validate.py` / CI MUST enforce a maximum structural depth check (≤ 6 levels) and a provision uniqueness check (no two provisions in the same document with identical number and text). Every `table` node MUST carry its printed caption or `"Table (under <parent provision>)"` (never `"Table 1 — Table 1"`), and non-content nodes (`preface`, `preamble`, `signature_block`, tables of contents, indexes, cover pages, gazette headers) SHALL NOT be tagged to topics or zones.

- **GIVEN** the structured clause trees, annotations, topics, and relations across all documents
- **WHEN** `bylaws structure`, `bylaws annotations`, `bylaws relations`, `bylaws validate`, and CI structure tests run
- **THEN** zero `eid`s or `native_number`s match date patterns (`11.11.2025`, `12.12.2025`), clause 17 of `rmp2015-zr-amend-2025-04` appears once with accurate citations, no provision exceeds depth 6, zero duplicate provisions exist in any document, zero tables have `"Table N — Table N"` headings, and zero tables of contents or preambles appear in topics or zone links

### Legal Statuses, Instrument Types & Institutional Relationships: Part 4

#### R4: Explicit Instrument Types, Quoted 2017 Model Bye-laws / Bye-law 1.4 Relationship, Evidence-Backed Authority Succession, and Re-Derived Statuses
Every register entry in `jurisdictions/*.yaml` and `documents.json` MUST declare an explicit `instrument_type` (`"instrument" | "compilation" | "map" | "bill" | "order"`), and `compilation`, `map`, and `bill` entries SHALL NEVER be displayed as `"In force"` or `"Full text"`. The Kannada compilation (`rmp2015-zr-2024-kan`) MUST have `instrument_type: "compilation"` and `structured: false`. The relationship between `ka-model-bbl-2017` (`UDD 14 TTP 2017`) and `bbl-2003` bye-law `1.4` MUST be recorded and displayed in plain words with verbatim quotes from the held texts covering (1) whether `ka-model-bbl-2017` applies to City Corporations, (2) whether its clause `1(3)` / `1.4` is the source of the rule recorded as `bbl-2003` bye-law `1.4`, and (3) how bye-law `1.4` came to be in the 2003 bye-laws (stating `"unclear"` with both quotes where the held text does not settle a point), while excluding `ka-model-bbl-2017`'s other provisions from plot answers. Every row in `jurisdictions/succession.yaml` MUST be backed by a quote that actually states the authority change and a matching `effective_date` (or be removed / marked `"not confirmed"`), and every instrument's status MUST be re-derived from held evidence, separating drafts, finals, and superseded drafts.

- **GIVEN** `jurisdictions/*.yaml`, `jurisdictions/succession.yaml`, and `documents.json`
- **WHEN** validated and rendered in the web UI
- **THEN** compilations, maps, and bills never show `"In force"` or `"Full text"`, `rmp2015-zr-2024-kan` is an unstructured `compilation`, the 2017 notification's relationship to bye-law `1.4` is explained in plain English with verbatim quotes, every confirmed row in `succession.yaml` cites a quote that states the institutional succession with a matching effective date, and all drafts, superseded drafts, and finals have evidence-backed statuses

### Building Parameters & Statutory Plot Resolution: Part 5

#### R5: Cell-Traceable Parameter Records, 6-Step Quoted Resolution Engine, Worked Jayanagar Test Case, and 40-Record Page-Image Self-Check
`pipeline/bylaws/parameters.py` MUST extract parameter records (`parameters.json`) for ground coverage, FAR (base, premium, TDR), setbacks (front, rear, sides), building height, number of floors, and parking from in-force tables, storing each cell's verbatim `cell_text`, parsed numeric value/unit or interval (`"Up to X"`, `"Above X up to Y"`, `"X to Y"`, `"Less than X"`, `"X and above"`), structured conditions (`plot_area_m2`, `plot_width_m`, `plot_depth_m`, `road_width_m`, `building_height_m`, `zone`, `area_class`, `use`, `jurisdiction`), `dependent: true` (`"depends on conditions"`) for unexpressed prose conditions, and cell-level provenance (`doc_id`, `eid`, `table_eid`, `row_index`, `col_index`, `page`, `official_url`, `archive_url`). `jurisdictions/resolution.yaml`, `pipeline/bylaws/resolver.py`, and `lib/resolver.ts` MUST apply the 6 ordered statutory resolution steps with quoted authorities verified against the repaired structured text, tested against source tables (checked against PDF page images) including the worked Jayanagar `600 m²` / `15 m` road `Residential (Main)` plot case, and accompanied by a 40-record PDF page-image self-check in `data/reports/<jurisdiction>/qa.md`.

- **GIVEN** the repaired structured tables, `parameters.json`, and `jurisdictions/resolution.yaml`
- **WHEN** `pytest pipeline/tests/test_resolver.py` and `npx vitest run __tests__/resolver.test.ts` execute
- **THEN** both Python and TypeScript resolvers return identical, source-table-verified values, one-line reasons, and page links for all test cases including the worked Jayanagar `600 m²` / `15 m` road `Residential (Main)` plot, and `qa.md` contains the 40-record page-image comparison table

### Simple Non-Expert Site, Progressive Disclosure & Performance Budgets: Part 6

#### R6: Plain-Language Primary Layer, Map-First Home with Expandable Plot Card & About Map, Most-Recent-First Lists, Law-Order Documents, Rules by Subject, and CI Browser/Budget Checks
The web application MUST present a short, plain-language primary layer with all technical/legal detail one tap deeper:
1. **Home = the map (`/` & `/j/[id]`)**: Full-width above-the-fold map with one line of introduction, Protomaps light style, project layers beneath street labels, official RMP 2015 legend colours with plain names, zoom/scale/location/fullscreen/layer-switch controls, place and ward search, and all technical map details (source URLs, CRS codes, ward lists) behind an `"About this map"` expander with one honest measured accuracy figure in plain words.
2. **Plot card (`components/PlotCard.tsx`)**: Primary view shows area name, ward, corporation, and zone in plain words, plot inputs, and answers for coverage, FAR, setbacks, height, and parking as numbers with one short reason; tapping an answer expands the provision text, table row, page link, resolution step, and other applicable provisions; `"Not settled"` shows both rules; includes the exact notice `"Worked out from the official documents by this site. Confirm with the planning authority or a qualified professional."`
3. **Documents (`/j/[id]/documents` & `/j/[id]/documents/[doc]`)**: Document list ordered **most recent first** with plain title, date, one status in words (`"In force since 14 May 2026"`, `"Draft, not in force"`, `"Replaced"`), and `"In short (by this site)"`; document page ordered in the **law's own order** (`1.0, 1.1, 1.2…`) showing only provision number and verbatim text (with no repeated heading inside text) plus a small `"Changed in 2026"` tag, expanding on tap to show page link, archive link, version history (most recent first), notes by the site, OCR corrections, references, local graph, and address; loaded chapter by chapter with an outline.
4. **Rules by subject (`/j/[id]/topics` & `/j/[id]/topics/[topic]`)**: Renamed from `"Topics"`; each subject starts with `"What applies today"` (governing provision and values), then collapsed `"Older or replaced rules"` and `"Related provisions"`, plus clean non-truncated Resolution cards stating what governs, the value, and why in one line (tap for both provisions and authority).
5. **Timeline & Sources**: Both ordered **most recent first**, with one-line summaries on Timeline (tap for changed provisions) and technical fields (checksums, retrieval records, archive links) behind an expander on Sources.
6. **Language, Budgets & Browser Tests**: Normal units (`"m²"`, `"m"`), introductions ≤ 2 sentences, HTML ≤ `300 KB` and initial JS+data ≤ `1.5 MB` uncompressed enforced in CI, and Playwright browser tests (`e2e/`) verifying map render, plot card worked case, and document provision expansion.

- **GIVEN** the built Next.js application
- **WHEN** Vitest, page-budget checks, and Playwright browser tests run in CI
- **THEN** all primary-layer language rules, most-recent-first list orderings, law-order document rendering, tap-to-expand disclosures, page budgets (`<= 300 KB` HTML, `<= 1.5 MB` JS+data), and browser tests pass

### Non-Goals

- Acquiring new PDFs or external datasets — this change uses strictly data already in the repository (`docs/plans/trustworthy-simple-building-code-plan.md` §3 Decision 10).
- Structuring the 2024 Kannada compilation (`rmp2015-zr-2024-kan`) — English-only structuring per Decision 9; the Kannada compilation is retained in Sources as `instrument_type: "compilation"`.
- Claiming human verification — all checks are machine checks (`verification: "machine_checked"`), and nothing is presented as verified by a person (Decision 8).

### Design Decisions

#### Verbatim Legal Text with Stand-Off Site Notes and Recorded OCR Corrections
**Decision**: Enforce in `pipeline/bylaws/fidelity.py` and CI that every provision's text matches the parser's text of its cited page(s) after whitespace normalization, or is covered by a recorded `ocr_correction` (`{ original_text, corrected_text, page, reason }`) or `"[unreadable in source]"` token; move all editorial explanations, notification numbers, and summaries into `notes_by_site` (`"Note by this site"`) and `summary_by_site` (`"In short (by this site)"`).
**Why**: Legal provisions must quote the official gazette/document verbatim so readers can rely on the exact words of the law while still benefiting from clearly separated plain-language notes and transparent OCR fixes.
**Rejected**: Inserting bracketed editorial notes (`[Per UDD 14 TTP 2017...]`) or table digests directly inside clause prose, which corrupts legal quotes and makes machine text-fidelity verification impossible.
*Introduced by*: 261125-ucy1-trustworthy-simple-building-code

#### Explicit Instrument Types and Plain-Language Progressive Disclosure
**Decision**: Classify every register entry by `instrument_type` (`instrument | compilation | map | bill | order`) so compilations, maps, and bills never appear as in-force instruments, and structure every web page with a plain-language primary layer (most-recent-first lists, law-order provisions showing only number and verbatim text, `"Rules by subject"` starting with `"What applies today"`) and tap-to-expand technical/legal details.
**Why**: Homeowners and small builders need immediate, jargon-free answers and clear legal statuses first, while architects and lawyers can tap any provision or plot answer to inspect exact citations, version history, resolution steps, and technical metadata.
**Rejected**: Rendering internal schema versions, `eid`s, enum strings (`sq_m`, `state_rules`), and repeated metadata badges inline on every provision row.
*Introduced by*: 261125-ucy1-trustworthy-simple-building-code

## Tasks

### Phase 1: Setup, Draft PR & Part 1 (One Consistent Site)

- [x] T001 Record baseline in `docs/progress.md`, open the draft PR on GitHub with the preview URL at the top, unify release version (`5.0.0`) and schema fields (`instrument_type`, `summary_by_site`, `notes_by_site`, `ocr_corrections`, `ocr_status`) across `schemas/*.schema.json`, `pipeline/bylaws/models/_generated.py`, and `lib/types/generated.ts`, remove all internal project references from public copy (`app/`, `components/`, `lib/`, `jurisdictions/`), regenerate `declarations.json`, add CI checks in `pipeline/tests/test_release_and_copy_consistency.py`, and commit & push Part 1 <!-- R1 -->

### Phase 2: Core Pipeline Repairs — Parts 2, 3 & 4 (Text Fidelity, Structure Repair & Statuses/Relationships)

- [x] T002 Implement `pipeline/bylaws/fidelity.py` and `pipeline/tests/test_text_fidelity.py`, strip gazette mailing headers/running heads/page furniture in `pipeline/bylaws/structure.py`, move editorial insertions (`bbl-2003` `6.0(i)`, `1.4`, etc.) into `notes_by_site`, restore `rmp2015-zr` `3.1` table digest as a real `table` node, inspect PDF page images to record `ocr_corrections` or `"[unreadable in source]"` in `data/overrides/`, update `qa.md` with fidelity counts, and commit & push Part 2 <!-- R2 -->
- [x] T003 Repair `pipeline/bylaws/structure.py`, `annotations.py`, `relations.py`, and `validate.py` so date-shaped tokens never become clause numbers, duplicates (incl. premium FAR clause 17) are eliminated, same-level list items attach as siblings with a max depth check (≤6) and uniqueness check in CI, tables carry printed captions or `"Table (under <provision>)"`, and non-content nodes are excluded from topics/zones; then implement Part 4 (`instrument_type` across `jurisdictions/*.yaml`, `rmp2015-zr-2024-kan` as unstructured `compilation`, quoted explanation of `ka-model-bbl-2017` / `UDD 14 TTP 2017` and `bbl-2003` bye-law `1.4`, evidence-backed `jurisdictions/succession.yaml`, re-derived statuses), and commit & push Parts 3 and 4 <!-- R3, R4 -->

### Phase 3: Numbers as Data & Simple Non-Expert Site — Parts 5 & 6

- [x] T004 Audit and refine `pipeline/bylaws/parameters.py`, `jurisdictions/resolution.yaml`, `pipeline/bylaws/resolver.py`, and `lib/resolver.ts` so all parameter tables store verbatim `cell_text` and parsed values/intervals with `dependent` flags (`"depends on conditions"`) and cell sources, verify quoted authorities on all 6 resolution steps, test both resolvers against source tables including the worked Jayanagar `600 m²` / `15 m` road `Residential (Main)` plot in `pipeline/tests/test_resolver.py` and `__tests__/resolver.test.ts`, record the 40-record page-image self-check in `qa.md`, and commit & push Part 5 <!-- R5 -->
- [x] T005 Implement the Part 6 simple non-expert UI across `app/page.tsx`, `app/j/[id]/page.tsx`, `components/ZoneMap.tsx` (`"About this map"` expander + single honest accuracy figure), `components/PlotCard.tsx` (plain answers, tap-to-expand details, exact one-line disclaimer), `app/j/[id]/documents/page.tsx` & `components/ClauseTree.tsx` (most-recent-first documents list with plain statuses & `"In short"`, law-order provisions with number + verbatim text only and tap-to-expand details), `app/j/[id]/topics/` (renamed `"Rules by subject"` with `"What applies today"` first and clean Resolution cards), `app/j/[id]/timeline/page.tsx` & `app/j/[id]/sources/page.tsx` (most-recent-first with expanders), verify page budgets (`<= 300 KB` HTML, `<= 1.5 MB` JS+data) and Playwright browser tests (`e2e/`) in `.github/workflows/ci.yml`, update `docs/progress.md` and the PR body, and commit & push Part 6 <!-- R6 -->

## Execution Order

- T001 establishes schemas, release consistency, and the draft PR before T002–T005.
- T002 (Part 2 text fidelity & table restoration) and T003 (Part 3 structure repair & Part 4 statuses/relationships) rebuild the structured and consolidated documents consumed by T004 (Part 5 parameters & resolver) and T005 (Part 6 web UI & E2E tests).

## Acceptance

### Functional Completeness

- [ ] A-001 R1: Every built page and manifest entry shows the same release (`5.0.0`), declarations and status notices are regenerated from actual data, and CI enforces zero internal references in public copy.
- [ ] A-002 R2: `pipeline/bylaws/fidelity.py` and `pipeline/tests/test_text_fidelity.py` verify in CI that every provision's text is found on its cited page(s) or covered by a recorded correction/`"[unreadable in source]"`, editorial insertions are moved to `notes_by_site`, `rmp2015-zr` 3.1 is a real table, gazette headers are stripped, and `qa.md` reports all counts.
- [ ] A-003 R3: Date-shaped tokens never become clause numbers, duplicate provisions (including premium FAR clause 17) are removed, same-level list items attach as siblings with depth ≤ 6 and uniqueness enforced in CI, tables have meaningful captions, and non-content nodes are excluded from topics and zones.
- [ ] A-004 R4: Every register entry has an explicit `instrument_type` (`instrument`, `compilation`, `map`, `bill`, `order`), compilations/maps/bills never show `"In force"` or `"Full text"`, `ka-model-bbl-2017`'s relationship to bye-law `1.4` is explained with verbatim quotes, `succession.yaml` rows are backed by quotes and matching dates, and statuses are re-derived from evidence.
- [ ] A-005 R5: `parameters.json` covers coverage, FAR, setbacks, height, floors, and parking with numeric intervals, conditions (`dependent` where unexpressed), and cell sources; `resolution.yaml` and the Python/TypeScript resolvers pass source-table tests including the worked Jayanagar `600 m²` / `15 m` road case; and `qa.md` includes the 40-record page-image self-check.
- [ ] A-006 R6: Map-first home with light base map and `"About this map"` expander, Plot card with plain answers and tap-to-expand detail, most-recent-first lists everywhere, law-order documents with verbatim text and tap-to-expand details, `"Rules by subject"` starting with `"What applies today"`, page budgets (`<= 300 KB` HTML, `<= 1.5 MB` JS+data), and Playwright browser tests pass in CI.

### Behavioral Correctness

- [ ] A-007 R2: `bbl-2003` bye-laws `6.0(i)` and `1.4` contain strictly verbatim printed text in `content`, with editorial commentary and notification notes surfaced only under `notes_by_site`.
- [ ] A-008 R3: `rmp2015-zr-amend-2025-04` contains zero `cl_11.11.2025` or `cl_12.12.2025` nodes and exactly one clause 17 node.
- [ ] A-009 R4: `ka-model-bbl-2017` (`UDD 14 TTP 2017`) displays a plain-language explanation with verbatim quotes explaining its relationship to `bbl-2003` bye-law `1.4` and City Corporations, and its other provisions do not feed plot answers.

### Scenario Coverage

- [ ] A-010 R5: Both `pytest pipeline/tests/test_resolver.py` and `npx vitest run __tests__/resolver.test.ts` verify the Jayanagar `600 m²` / `15 m` road `Residential (Main)` plot case against source tables and page images.
- [ ] A-011 R6: Playwright browser tests (`e2e/`) verify that the map renders, the plot card returns answers for the worked case and expands on tap, and a document page expands a provision on tap.

### Edge Cases & Error Handling

- [ ] A-012 R2: Unambiguous OCR errors are recorded with `original_text`, `corrected_text`, `page`, and `reason` and marked `"corrected"`, while illegible source fragments are rendered as `"[unreadable in source]"` with a page link.
- [ ] A-013 R5: When resolution rules do not settle a parameter or a step's authority cannot be quoted, the resolver returns `"not_settled"` and displays both applicable provisions without inventing a rule.
- [ ] A-014 R1: Zero records in any generated dataset carry `verification: "human_verified"`.

### Code Quality

- [ ] A-015 Pattern consistency: New code follows naming and structural patterns of surrounding code in `pipeline/bylaws/`, `app/`, `components/`, and `lib/`.
- [ ] A-016 No unnecessary duplication: Existing utilities (`schema_validator.py`, `lib/data.ts`, `lib/resolver.ts`) are reused rather than duplicated.
- [ ] A-017 Readability and composition: Functions in `fidelity.py`, `structure.py`, `parameters.py`, `resolver.py`, and React components remain focused, modular, and readable without magic strings or hard-coded jurisdiction literals (Rule R1).
- [ ] A-018 Test-alongside verification: Unit, fidelity, structure, budget, accessibility (`axe-core`), and E2E tests accompany every part and pass in CI.

## Notes

- Check items as you review: `- [x]`
- All acceptance items must pass before `/fab-continue` (hydrate)
- If an item is not applicable, mark checked and prefix with **N/A**: `- [x] A-NNN **N/A**: {reason}`

## Assumptions

| # | Grade | Decision | Rationale | Scores |
|---|-------|----------|-----------|--------|
| 1 | Certain | Bump the published dataset release version to `5.0.0` across `in-ka-bengaluru` and the 5 City Corporations so every page and manifest entry cleanly reflects the post-review trustworthy code release | Ensures deterministic cache/manifest consistency for Part 1 while preserving Schema `1.4` compatibility | S:95 R:90 A:95 D:95 |
| 2 | Certain | Group the 6 sequential parts of `docs/plans/trustworthy-simple-building-code-plan.md` into 5 cohesive phase tasks (`T001`–`T005`) while still making a dedicated git commit and push after each of Parts 1 through 6 | Satisfies both the plan's per-part commit/push rule and sequential pipeline execution | S:95 R:90 A:95 D:95 |

2 assumptions (2 certain, 0 confident, 0 tentative).
