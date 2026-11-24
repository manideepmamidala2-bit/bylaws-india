# Plan: PR 05 — Structure the Two Anchor Documents (Checkpoint 2)

**Change**: 261124-fgv0-pr-05-structure-anchor-documents
**Intake**: `intake.md`

## Requirements

### Pipeline & Reports: Parser Comparison, Layer 1 Structuring, Layer 2 Annotations, and QA Self-Check

#### R1: Real Parser Comparison and Decision Record (`parser-comparison.md` & `docs/decisions/004-bengaluru-south-parser-and-map-decisions.md`)
`pipeline/bylaws/compare.py`, `data/reports/in-ka-bengaluru-south/parser-comparison.md`, and `docs/decisions/004-bengaluru-south-parser-and-map-decisions.md` MUST benchmark the real permissive parser adapters (`pypdfium2`, `docling` standard pipeline with table structure, and `tesseract` where applicable; plus document the evaluation of Docling VLM / Granite-Docling under Rule R4) on `bbl-2003.pdf` (84 pages) and `rmp2015-zr.pdf` (69 pages), scoring text completeness, numbering fidelity against the contents list and `recon.md`, table fidelity against page images, and `bbox` coverage.

- **GIVEN** the acquired real PDFs `data/raw/in-ka-bengaluru-south/bbl-2003.pdf` and `data/raw/in-ka-bengaluru-south/rmp2015-zr.pdf`
- **WHEN** `bylaws compare --jurisdiction in-ka-bengaluru-south` executes
- **THEN** `data/reports/in-ka-bengaluru-south/parser-comparison.md` records real quantitative scores (`pypdfium2` vs `docling` standard with table structure vs `tesseract`), table-by-table extraction comparisons, and sample page comparisons, and `docs/decisions/004-bengaluru-south-parser-and-map-decisions.md` records the chosen parser and table strategy per page range

#### R2: Complete Schema 1.3 Layer 1 Structuring of `bbl-2003` and `rmp2015-zr` (`versions: [v1]` Only)
`pipeline/bylaws/structure.py` MUST structure the two base anchor documents (`bbl-2003` and `rmp2015-zr`) into Schema 1.3 Layer 1 `<doc_id>.clauses.json` following the structuring rules (`S1`–`S3`) in `recon.md`:
- Strip repeating running headers (`Building Bye-Laws – 2003` + page number) and standalone page numbers (`0`–`68`, `- 54 -`) before heading and paragraph assembly so mid-sentence continuations across page breaks merge cleanly into their parent node while recording page citations and bounding boxes for every spanned page.
- Parse every numbered and lettered unit at every depth (`part`, `chapter`, `section`, `bye_law`, `regulation`, `clause`, `subclause`, `item`, `definition` with `defines` and `defines_normalised`, `proviso`, `explanation`, `note`, `schedule`, `appendix`, `form`, `table`, `table_row`) with accurate `parent_eid`, `children`, `intro`, `content`, and `wrap_up`.
- Extract every table (`TABLE 1`–`TABLE 17` + `TABLE - 6A` in `bbl-2003`; `Table 1`–`Table 26` in `rmp2015-zr`) into `type: "table"` nodes with `table_meta` (`columns`, `rows`, `footnotes`, `extraction`) and `type: "table_row"` child nodes (`cells[]`), removing duplicated raw table text from prose.
- Drop zero content pages: every page's content is captured in nodes ($\ge 98\%$ character coverage per page) or declared as a non-content page (`bbl-2003` p. 84 `MAP` placeholder).
- Preserve verbatim source text; each node carries `versions: [v1]` only (amendments are deferred to PRs 08 and 09).

- **GIVEN** `bbl-2003.pdf` (84 pages) and `rmp2015-zr.pdf` (69 pages)
- **WHEN** `bylaws structure --jurisdiction in-ka-bengaluru-south` runs
- **THEN** `bbl-2003.clauses.json` and `rmp2015-zr.clauses.json` validate against `schemas/clause-tree.schema.json`, cover all parts/chapters/sections/definitions/provisos/explanations/notes/tables/schedules/appendices with `versions: [v1]`, and achieve 100% page citation coverage, $\ge 95\%$ `bbox` coverage, and $\ge 98\%$ page text coverage

#### R3: Layer 2 Stand-Off Annotations and QA Self-Check (`<doc_id>.annotations.json` & `qa.md`)
`pipeline/bylaws/annotations.py` and `pipeline/bylaws/validate.py` MUST generate `bbl-2003.annotations.json` and `rmp2015-zr.annotations.json` with `cross_reference`, `defined_term_use`, and `provision_type` annotations (validated against exact `[start, end]` character spans in `target.span_text`), and `data/reports/in-ka-bengaluru-south/qa.md` MUST verify all QA thresholds plus a **30-node stratified page-image self-check per document** (60 nodes total across clauses, sub-items, table rows, definitions, and provisos/explanations/notes), marking passing nodes `verification: "machine_checked"`.

- **GIVEN** structured `bbl-2003.clauses.json` and `rmp2015-zr.clauses.json`
- **WHEN** Layer 2 annotation extraction and `bylaws validate --jurisdiction in-ka-bengaluru-south` execute
- **THEN** `bbl-2003.annotations.json` and `rmp2015-zr.annotations.json` validate against `schemas/annotations.schema.json` with all three annotation kinds, and `data/reports/in-ka-bengaluru-south/qa.md` records 100% page citations, $\ge 95\%$ `bbox` coverage, $\ge 98\%$ text coverage, explained source numbering gaps (`bbl-2003` `14.0`), and the 60-node stratified page-image self-check table

### Web Application & Release 2.0.0: Base Documents Published with Prominent Notice

#### R4: Publish Release `2.0.0` with Prominent "Amendments Not Yet Applied" Notice and Archive Links
`pipeline/bylaws/publish.py`, `jurisdictions/in-ka-bengaluru-south.yaml`, `public/data/`, `app/`, and `components/` MUST publish **Release `2.0.0`** of `in-ka-bengaluru-south` containing the two structured base documents (`bbl-2003` and `rmp2015-zr`) alongside the full 12-document source register:
- `declarations.json` and the web UI (on `/`, `/j/in-ka-bengaluru-south/clauses`, `/j/in-ka-bengaluru-south/documents/bbl-2003`, `/j/in-ka-bengaluru-south/documents/rmp2015-zr`, and `/data`) MUST prominently display:
  `"Two base documents published. Amendments not yet applied: the text shown is the original wording, which may have been changed since."`
- Every clause's `"View source p. N"` link in `DocumentViewerClient.tsx` MUST open the official/primary PDF URL with `#page=N` and display the Wayback Machine archive link (`Archive p. N ↗`) right beside it.
- Release `1.0.0` MUST remain listed in `public/data/manifest.json` with `status: "withdrawn"`.

- **GIVEN** Release `2.0.0` published in `public/data/in-ka-bengaluru-south/2.0.0/` and `public/data/manifest.json`
- **WHEN** the Next.js routes (`/`, `/j/in-ka-bengaluru-south/sources`, `/j/in-ka-bengaluru-south/clauses`, `/j/in-ka-bengaluru-south/documents/bbl-2003`, `/j/in-ka-bengaluru-south/documents/rmp2015-zr`, `/data`) render
- **THEN** both base documents render their complete structured trees, tables, and Layer 2 annotations with the prominent `"Two base documents published. Amendments not yet applied..."` notice and side-by-side `"View source p. N"` + `"Archive p. N"` links, while Map (`/j/in-ka-bengaluru-south`) and Review (`/j/in-ka-bengaluru-south/review`) continue showing `"No map data published yet"` until PRs 06–07, and all Vitest + `axe-core` WCAG AA checks pass

### Design Decisions

#### Selective Structuring Flag (`structure_in_release`) for Multi-Stage PR Rollout
**Decision**: Allow `bylaws structure`, `bylaws validate`, and `bylaws publish` to structure and publish the active base documents (`bbl-2003` and `rmp2015-zr` in PR 05) while retaining all 12 core documents in `documents.json` / `sources.json` / `sources.csv` (with unstructured amendment documents marked `"Not yet structured"` in the UI and declared in `declarations.json`).
**Why**: `05-structure-anchor-documents.md` requires Release `2.0.0` to publish only the two base anchor documents (`bbl-2003` and `rmp2015-zr`) with `v1` nodes while deferring the Building Bye-laws amendment chain to PR 08 and the Zoning Regulations amendment chain to PR 09, without losing the 12-document core source register established in PR 04.
**Rejected**: Temporarily deleting the 8 acquired amendment documents from `jurisdictions/in-ka-bengaluru-south.yaml`, which would regress the PR 04 core source register on `/j/in-ka-bengaluru-south/sources`.
*Introduced by*: 261124-fgv0-pr-05-structure-anchor-documents

## Tasks

### Phase 1: Falsifiable Tests & Parser Comparison (`parser-comparison.md`)

- [x] T001 Write falsifiable tests in `pipeline/tests/test_anchor_documents_pr05.py` (demonstrated failing first per Rule R11) and run real parser benchmarking (`pypdfium2`, `docling` standard pipeline with table structure, and `tesseract`; plus evaluate Docling VLM / Granite-Docling against Rule R4) on `bbl-2003.pdf` and `rmp2015-zr.pdf`, writing `data/reports/in-ka-bengaluru-south/parser-comparison.md` and `docs/decisions/004-bengaluru-south-parser-and-map-decisions.md` <!-- R1 -->

### Phase 2: Complete Layer 1 Structuring & Layer 2 Annotations (`structure.py`, `annotations.py`)

- [x] T002 Enhance `pipeline/bylaws/structure.py` and `pipeline/bylaws/annotations.py` to implement reconnaissance rules `S1`–`S3` (running-header/page-number stripping, multi-depth `part`/`chapter`/`section`/`bye_law`/`regulation`/`subclause`/`item`/`definition`/`proviso`/`explanation`/`note`/`schedule`/`appendix` hierarchy, `intro`/`content`/`wrap_up`, structured `table` + `table_row` extraction via Docling + `pypdfium2` with prose deduplication, 100% page coverage, and Layer 2 `cross_reference`, `defined_term_use`, and `provision_type` annotations) for `bbl-2003` and `rmp2015-zr` <!-- R2, R3 -->

### Phase 3: QA Validation & 60-Node Stratified Page-Image Self-Check (`validate.py`, `qa.md`)

- [x] T003 Enhance `pipeline/bylaws/validate.py`, run the 30-node stratified page-image self-check per document (60 nodes total across `bbl-2003` and `rmp2015-zr`), apply any required page-cited overrides in `data/overrides/in-ka-bengaluru-south/`, mark verified nodes `machine_checked`, and write `data/reports/in-ka-bengaluru-south/qa.md` <!-- R2, R3 -->

### Phase 4: Publish Release `2.0.0` & Web UI Updates (`publish.py`, `app/`, `components/`)

- [x] T004 Update `jurisdictions/in-ka-bengaluru-south.yaml` (`release_version: "2.0.0"`), `pipeline/bylaws/publish.py`, `lib/data.ts`, `app/page.tsx`, `app/j/[id]/page.tsx`, `app/j/[id]/clauses/page.tsx`, `app/j/[id]/documents/[doc]/page.tsx`, `app/data/page.tsx`, and `components/DocumentViewerClient.tsx` to publish Release `2.0.0`, display the prominent `"Two base documents published. Amendments not yet applied: the text shown is the original wording, which may have been changed since."` notice, and render side-by-side `"View source p. N"` and `"Archive p. N"` links <!-- R4 -->
- [x] T005 Update `__tests__/routes-and-axe.test.tsx` and `docs/progress.md`, and verify all Python tests (`pytest`), `bylaws check-provenance`, Vitest + `axe-core` WCAG AA tests (`npm test`), `npm run lint`, `npm run typecheck`, and `npm run build` pass <!-- R1, R2, R3, R4 -->

## Acceptance

### Functional Completeness

- [x] A-001 R1: `data/reports/in-ka-bengaluru-south/parser-comparison.md` and `docs/decisions/004-bengaluru-south-parser-and-map-decisions.md` benchmark real `pypdfium2`, `docling` standard pipeline with table structure, and `tesseract` (plus R4 evaluation of Docling VLM) on `bbl-2003.pdf` and `rmp2015-zr.pdf`
- [x] A-002 R2: `bbl-2003.clauses.json` and `rmp2015-zr.clauses.json` are structured completely to Schema 1.3 Layer 1 (`versions: [v1]` only) with `definition`, `proviso`, `explanation`, `note`, `schedule`, `appendix`, `table`, and `table_row` nodes, running headers stripped, and zero content pages dropped
- [x] A-003 R3: `bbl-2003.annotations.json` and `rmp2015-zr.annotations.json` contain valid `cross_reference`, `defined_term_use`, and `provision_type` stand-off annotations
- [x] A-004 R3: `data/reports/in-ka-bengaluru-south/qa.md` confirms 100% page citation coverage, $\ge 95\%$ `bbox` coverage, $\ge 98\%$ page text coverage, explained source numbering gaps, and a 30-node stratified page-image self-check per document (60 nodes total)
- [x] A-005 R4: Release `2.0.0` is published in `public/data/in-ka-bengaluru-south/2.0.0/` and `public/data/manifest.json` (with Release `1.0.0` kept as `withdrawn`), and the web UI displays the prominent `"Two base documents published. Amendments not yet applied..."` notice and side-by-side official + Wayback archive `#page=N` links

### Behavioral Correctness

- [x] A-006 R2: Every `table` node in `bbl-2003.clauses.json` and `rmp2015-zr.clauses.json` has structured `table_meta` and `table_row` children (or an explicit declared gap), and raw table text is not duplicated in surrounding prose
- [x] A-007 R4: Map (`/j/in-ka-bengaluru-south`) and Review (`/j/in-ka-bengaluru-south/review`) continue showing honest empty-map notices when `zones.features` and `boundary.features` are empty in Release `2.0.0` (before PRs 06–07)

### Scenario Coverage

- [x] A-008 R1: Falsifiable tests in `pipeline/tests/test_anchor_documents_pr05.py` are shown failing first (Rule R11) and pass once structuring, annotations, QA, and Release `2.0.0` publication complete
- [x] A-009 R4: All Vitest and `axe-core` WCAG AA checks pass across all routes with Release `2.0.0` active

### Code Quality

- [x] A-010 Pattern consistency & R1 compliance: `structure.py`, `annotations.py`, `validate.py`, and web components contain zero hard-coded jurisdiction strings (`in-ka-bengaluru-south`, `bbl-2003`, `rmp2015-zr`)

## Notes

- Check items as you review: `- [x]`

## Deletion Candidates

- `None — this change adds new functionality without making existing code redundant`

## Assumptions

| # | Grade | Decision | Rationale | Scores |
|---|-------|----------|-----------|--------|
| 1 | Certain | Structure only the two base anchor documents (`bbl-2003` and `rmp2015-zr`) into `<doc_id>.clauses.json` and `<doc_id>.annotations.json` in Release `2.0.0`, while keeping all 12 core register documents in `documents.json` (`sources.json` / `sources.csv`) with `"Not yet structured"` on the remaining amendment documents | Explicitly mandated by `05-structure-anchor-documents.md` Goal & §5 | S:98 R:90 A:95 D:95 |
| 2 | Certain | Display the exact coverage notice `"Two base documents published. Amendments not yet applied: the text shown is the original wording, which may have been changed since."` in `declarations.json` and prominently on both document pages | Explicitly quoted in `05-structure-anchor-documents.md` §5 | S:100 R:95 A:98 D:100 |
| 3 | Certain | Show both the official/primary source link (`View source p. N`) and the Wayback Machine archive link (`Archive p. N`) with `#page=N` on every clause in `DocumentViewerClient.tsx` | Explicitly required by `05-structure-anchor-documents.md` §5 | S:98 R:95 A:95 D:98 |
| 4 | Certain | Perform a 30-node stratified self-check per document (60 nodes total across `bbl-2003` and `rmp2015-zr`) against rendered PDF page images and record the per-node verification table in `data/reports/in-ka-bengaluru-south/qa.md` | Explicitly required by `05-structure-anchor-documents.md` §4 | S:98 R:90 A:95 D:95 |

4 assumptions (4 certain, 0 confident, 0 tentative).
