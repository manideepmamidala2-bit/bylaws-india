# Intake: PR 05 — Structure the Two Anchor Documents (Checkpoint 2)

**Change**: 261124-fgv0-pr-05-structure-anchor-documents
**Created**: 2026-11-24

## Origin

> Implement PR 05 (Structure the Two Anchor Documents) per `docs/plans/pr-series/00-overview.md` and `docs/plans/pr-series/05-structure-anchor-documents.md`: benchmark `pypdfium2`, Docling standard, Docling VLM, and Tesseract on Building Bye-laws 2003 and RMP 2015 Zoning Regulations (writing `parser-comparison.md`); structure both base documents completely into Schema 1.3 Layer 1 with Layer 2 annotations; run QA checks and 30-node stratified page-image self-check per document (writing `qa.md`); publish Release `2.0.0` with prominent "amendments not yet applied" notices; include 5 stratified nodes with preview text and source PDF page links in the PR description for Checkpoint 2.

Initiated after PR 04 (`261124-986m-pr-04-acquire-core-documents`, PR #9) was reviewed and merged on GitHub (Owner Checkpoint 1 passed).

## Why

1. **Problem**: In PR 04 we acquired and verified the real PDFs for the two anchor instruments of Bengaluru South City Corporation—**`bbl-2003`** (*BANGALORE MAHANAGARA PALIKE BUILDING BYE-LAWS 2003*, 84 pages, 370,410 bytes) and **`rmp2015-zr`** (*Revised Master Plan 2015 BANGALORE 2007 Volume – III ZONING OF LANDUSE AND REGULATIONS*, 69 pages, 329,801 bytes)—and documented their reconnaissance and structuring rules (`S1`–`S8`) in `data/reports/in-ka-bengaluru-south/recon.md`. However, neither document has been structured into Schema 1.3 Layer 1 clause trees or Layer 2 stand-off annotations yet, and `in-ka-bengaluru-south` still has `latest_release: null` (`"No data published yet"`).
2. **Consequence of not doing this**: Without faithful Layer 1 structuring and Layer 2 annotations of the two base documents (`bbl-2003` and `rmp2015-zr`), downstream amendment chains (PRs 08 and 09), supporting provisions (PR 10), and zone-link tags (PR 11) have no base `eid` hierarchy (`part_I`–`part_V`, `sec_1`–`sec_34`, `sched_I`–`sched_XIII`, `tbl_1`–`tbl_17` in `bbl-2003`; `sec_defs`, `ch_1`–`ch_11`, `sec_3_1`–`sec_3_18`, `sec_4_1`–`sec_4_14`, `tbl_1`–`tbl_26`, `app_I`–`app_VIII` in `rmp2015-zr`) to target.
3. **Why this approach**: Following `05-structure-anchor-documents.md`, we first compare our real parser adapters (`pypdfium2`, `docling` standard pipeline with table structure, and `tesseract` where needed; plus evaluating Docling VLM / Granite-Docling against Rule R4) on `bbl-2003` and `rmp2015-zr` (`data/reports/in-ka-bengaluru-south/parser-comparison.md` and `docs/decisions/004-bengaluru-south-parser-and-map-decisions.md`), then structure both anchor documents completely into Schema 1.3 Layer 1 (`v1` only; amendments are deferred to PRs 08 and 09) and Layer 2 (`cross_reference`, `defined_term_use`, `provision_type`), verify 100% page citation coverage, $\ge 95\%$ bbox coverage, $\ge 98\%$ page text coverage, and a 30-node stratified page-image self-check per document in `data/reports/in-ka-bengaluru-south/qa.md`, and publish **Release `2.0.0`** with a prominent banner on both documents stating: *"Two base documents published. Amendments not yet applied: the text shown is the original wording, which may have been changed since."*

## What Changes

### 1. Real Parser Comparison & Decision Record (`pipeline/bylaws/compare.py`, `data/reports/in-ka-bengaluru-south/parser-comparison.md`, `docs/decisions/004-bengaluru-south-parser-and-map-decisions.md`)
- Benchmark `pypdfium2`, `docling` standard pipeline (with `do_table_structure=True`), and `tesseract` (plus evaluate Docling VLM / Granite-Docling license and runtime applicability under Rule R4) on `bbl-2003.pdf` (84 pages) and `rmp2015-zr.pdf` (69 pages).
- Measure per document and per page range:
  - Text completeness (character count and page coverage)
  - Numbering fidelity against the document's own table of contents and `recon.md`
  - Table structure fidelity checked against rendered page images for every table (`TABLE 1`–`TABLE 17` and `TABLE - 6A` in `bbl-2003`; `Table 1`–`Table 26` in `rmp2015-zr`, including landscape page 22 in `bbl-2003` and landscape pages 13–19 in `rmp2015-zr`)
  - Bounding-box (`bbox`) coverage
- Record the parser selection per page range and table extraction strategy in `docs/decisions/004-bengaluru-south-parser-and-map-decisions.md` and output `data/reports/in-ka-bengaluru-south/parser-comparison.md` with quantitative scores and sample page comparisons.

### 2. Complete Schema 1.3 Layer 1 Structuring of `bbl-2003` and `rmp2015-zr` (`pipeline/bylaws/structure.py`, `data/overrides/in-ka-bengaluru-south/`)
- Enhance `pipeline/bylaws/structure.py` to implement the reconnaissance structuring rules (`S1`–`S3` from `recon.md`) in a completely jurisdiction-agnostic, data-driven way (Rule R1):
  - **Running header & page-number stripping**: Strip repeating document running headers (e.g. `Building Bye-Laws – 2003` + page number at top of page) and standalone leading/trailing page numbers (`0`–`68`, `- 54 -`) before heading and paragraph assembly so mid-sentence page breaks merge cleanly into their parent node while preserving page-level citations and bounding boxes for every page spanned.
  - **Full hierarchical depth & 22 node types**:
    - Parse `PART I`–`PART V`, decimal sections/bye-laws (`1.0`–`34.`), sub-clauses (`1.1`, `1.2`, `9.1`, `9.2`, `(a)`, `(b)`, `(i)`, `(ii)`), numbered definitions (`2.1`–`2.96` in `bbl-2003`; `1.`–`85.` under `TECHNICAL TERMS AND DEFINITIONS` in `rmp2015-zr` as `type: "definition"` with `defines` and `defines_normalised`), `proviso` (`Provided that...`), `explanation` (`Explanation...`), `note` (`Note:` / `Note :-`), `schedule` (`SCHEDULE I`–`SCHEDULE XIII`), and `appendix` (`APPENDIX I`–`APPENDIX-VIII`) nodes with accurate `parent_eid` and `children` arrays.
    - Populate `intro` (lead-in text before child items), `content` (leaf text), and `wrap_up` (closing text after child items).
    - Extract all tables (`TABLE 1`–`TABLE 17` + `TABLE - 6A` in `bbl-2003`; `Table 1`–`Table 26` in `rmp2015-zr`) as `type: "table"` nodes with `table_meta` (`columns`, `rows`, `footnotes`, `extraction: "docling" | "pdfplumber" | "pypdfium2" | "override" | "failed"`) and child `type: "table_row"` nodes with `cells[]`, removing duplicated raw table text from prose.
    - Ensure **nothing is dropped**: every page (`1`–`84` of `bbl-2003` and `1`–`69` of `rmp2015-zr`) has its content captured in nodes (with `citations` covering every page and $\ge 98\%$ character coverage against the reference page text), or any non-content page (such as `bbl-2003` p. 84 `MAP` placeholder) is explicitly represented/declared.
    - Keep verbatim source wording (no silent spelling/punctuation edits); any OCR or table-cell correction is stored in `data/overrides/in-ka-bengaluru-south/` with `source_page` and `reason`.
    - In PR 05, only the two base documents (`bbl-2003` and `rmp2015-zr`) are structured (each node has `versions: [v1]` only); amendment documents remain in the source register with `Not yet structured` status until PRs 08 and 09.

### 3. Layer 2 Stand-Off Annotations (`pipeline/bylaws/annotations.py`)
- Generate `<doc_id>.annotations.json` (`bbl-2003.annotations.json` and `rmp2015-zr.annotations.json`) with the three Layer 2 annotation kinds required by `05-structure-anchor-documents.md` §3:
  1. `cross_reference`: Rule-based detection of internal bye-law, regulation, section, clause, table, schedule, and appendix references (e.g., `Bye-law 2.48`, `Table 8`, `Table 9`, `Schedule I`, `Appendix II`, `Section 14-B`), resolving internal targets to canonical `eid`s and retaining unresolved references with raw text.
  2. `defined_term_use`: Rule-based matching of normalised defined terms within the same document (`bbl-2003` terms from Bye-law `2.0`; `rmp2015-zr` terms from `TECHNICAL TERMS AND DEFINITIONS` `1.`–`85.`), linking each occurrence's `[start, end]` character span to the defining node's `eid`.
  3. `provision_type`: Rule-based classification (`definition`, `prohibition`, `exception`, `obligation`, `permission`, `Empowerment`/`procedure`) with `method: "rule"`, `confidence`, and `verification: "machine_checked"`.
- Validate that every annotation's `target.span` `[start, end]` slice matches `target.span_text` exactly.

### 4. QA Thresholds & 30-Node Stratified Page-Image Self-Check (`pipeline/bylaws/validate.py`, `data/reports/in-ka-bengaluru-south/qa.md`)
- Verify and record in `data/reports/in-ka-bengaluru-south/qa.md` for both `bbl-2003` and `rmp2015-zr`:
  - **100%** of nodes have a valid `page` citation ($\ge 1$).
  - **$\ge 95\%$** of nodes have a normalized `[x0, y0, x1, y1]` bounding box (`bbox`).
  - **$\ge 98\%$** of each page's content text is covered by structured nodes (character count against the reference parser page text).
  - **Zero** unexplained numbering gaps or duplicate `eid`s (any source-native numbering quirk—such as `bbl-2003` jumping from `13.0 Industrial buildings` to `15.0 Height limitation` on pp. 31–33 because `14.0` was omitted in the printed 2003 Gazette—is documented with its exact source page).
  - **Every table** is structured (`table` + `table_row` nodes) or explicitly declared.
  - **Stratified 30-node self-check per document** (60 nodes total across `bbl-2003` and `rmp2015-zr`, stratified across clauses, sub-items, table rows, definitions, and provisos/explanations/notes): compare each node's extracted `native_number`, `heading`, `intro`/`content`/`wrap_up`/`cells`, and `page` against rendered page images from the PDF, record the per-node verification table in `data/reports/in-ka-bengaluru-south/qa.md`, fix any discrepancy via `structure.py` or `data/overrides/in-ka-bengaluru-south/`, and mark verified nodes `verification: "machine_checked"`.

### 5. Publish Release `2.0.0` & Prominent "Amendments Not Yet Applied" Notice (`jurisdictions/in-ka-bengaluru-south.yaml`, `public/data/`, `app/`, `components/`)
- Set `release_version: "2.0.0"` in `jurisdictions/in-ka-bengaluru-south.yaml`.
- In `jurisdictions/in-ka-bengaluru-south.yaml`, scope structuring/publishing in PR 05 to the two base documents (`bbl-2003` and `rmp2015-zr`) while preserving all 12 core documents in `documents.json` / `sources.json` / `sources.csv` so `/j/in-ka-bengaluru-south/sources` continues showing the complete 12-document core register (with `bbl-2003` and `rmp2015-zr` now linking to `"Read Structured Document →"` and the remaining amendment documents still marked `"Not yet structured"`).
- Record in `declarations.json` (`known_gaps`) and render prominently on the Home page (`/`), Jurisdiction pages (`/j/in-ka-bengaluru-south/clauses` and `/j/in-ka-bengaluru-south/documents/[doc]`), and Data page (`/data`):
  > *"Two base documents published. Amendments not yet applied: the text shown is the original wording, which may have been changed since."*
- Ensure `"View source p. N"` links on every clause open the official/primary PDF URL with `#page=N` and display the Wayback Machine archive link (`Archive p. N ↗`) right beside it (`05-structure-anchor-documents.md` §5).
- Keep Release `1.0.0` in `public/data/manifest.json` listed with `status: "withdrawn"`.
- In the PR description for **Owner Checkpoint 2**, list **five stratified nodes** (a numbered clause, a sub-item, a table row, a definition, and a proviso/explanation) with their `eid`/address, exact preview text, and direct PDF `#page=N` link so the owner can verify them in ~10 minutes.

## Affected Memory

- `architecture/overview`: (modify) Document Release `2.0.0` publication of the two anchor documents (`bbl-2003` and `rmp2015-zr`), parser comparison, 30-node stratified self-check in `qa.md`, and the prominent "Amendments not yet applied" notice and side-by-side official + Wayback archive page links.
- `schemas/data-contracts`: (modify) Document selective base-document structuring in `bylaws structure` / `bylaws publish` while preserving full source-register visibility in `documents.json`.

## Impact

- **Python Pipeline (`pipeline/bylaws/`)**:
  - `pipeline/bylaws/compare.py`
  - `pipeline/bylaws/structure.py`
  - `pipeline/bylaws/annotations.py`
  - `pipeline/bylaws/validate.py`
  - `pipeline/bylaws/publish.py`
- **Configuration, Overrides & Reports**:
  - `jurisdictions/in-ka-bengaluru-south.yaml` (`release_version: "2.0.0"`)
  - `data/overrides/in-ka-bengaluru-south/` (if any page-cited OCR/table overrides are needed)
  - `data/reports/in-ka-bengaluru-south/parser-comparison.md`
  - `data/reports/in-ka-bengaluru-south/qa.md`
  - `docs/decisions/004-bengaluru-south-parser-and-map-decisions.md`
  - `docs/progress.md`
- **Published Release `2.0.0` (`public/data/`)**:
  - `public/data/manifest.json` (`latest_release: "2.0.0"`, `1.0.0` preserved as `withdrawn`)
  - `public/data/in-ka-bengaluru-south/2.0.0/` (`documents.json`, `bbl-2003.clauses.json`, `bbl-2003.annotations.json`, `rmp2015-zr.clauses.json`, `rmp2015-zr.annotations.json`, `amendments.json`, `consolidated.json`, `zones.geojson`, `boundary.geojson`, `declarations.json`, `sources.json`, `sources.csv`, `SHA256SUMS`, `in-ka-bengaluru-south-2.0.0.zip`)
- **Web UI (`app/`, `components/`, `lib/`) & Tests**:
  - `app/j/[id]/documents/[doc]/page.tsx`, `app/j/[id]/clauses/page.tsx`, `components/DocumentViewerClient.tsx` (prominent *"Two base documents published. Amendments not yet applied: the text shown is the original wording, which may have been changed since."* notice, plus side-by-side `"View source p. N"` and `"Archive p. N"` links)
  - `pipeline/tests/test_anchor_documents_pr05.py` and `__tests__/routes-and-axe.test.tsx`

## Open Questions

None — all requirements, QA thresholds, and Checkpoint 2 deliverables are explicitly specified in `docs/plans/pr-series/05-structure-anchor-documents.md`.

## Assumptions

| # | Grade | Decision | Rationale | Scores |
|---|-------|----------|-----------|--------|
| 1 | Certain | Structure only the two base anchor documents (`bbl-2003` and `rmp2015-zr`) into `<doc_id>.clauses.json` and `<doc_id>.annotations.json` in Release `2.0.0`, while keeping all 12 core register documents in `documents.json` (`sources.json` / `sources.csv`) with `"Not yet structured"` on the remaining amendment documents | Explicitly mandated by `05-structure-anchor-documents.md` Goal & §5 ("Turn the two base documents into complete, faithful structured data and publish them as the first real release (`2.0.0`)... Amendments are not applied in this PR (PRs 08 and 09). Each node gets version 1 only.") | S:98 R:90 A:95 D:95 |
| 2 | Certain | Display the exact coverage notice `"Two base documents published. Amendments not yet applied: the text shown is the original wording, which may have been changed since."` in `declarations.json` and prominently on both document pages | Explicitly quoted in `05-structure-anchor-documents.md` §5 | S:100 R:95 A:98 D:100 |
| 3 | Certain | Show both the official/primary source link (`View source p. N`) and the Wayback Machine archive link (`Archive p. N`) with `#page=N` on every clause in `DocumentViewerClient.tsx` | Explicitly required by `05-structure-anchor-documents.md` §5 ("'View source p. N' links go to the official URL used, with the page anchor; the archive link is shown beside it.") | S:98 R:95 A:95 D:98 |
| 4 | Certain | Perform a 30-node stratified self-check per document (60 nodes total across `bbl-2003` and `rmp2015-zr`) against rendered PDF page images and record the per-node verification table in `data/reports/in-ka-bengaluru-south/qa.md` | Explicitly required by `05-structure-anchor-documents.md` §4 | S:98 R:90 A:95 D:95 |

4 assumptions (4 certain, 0 confident, 0 tentative, 0 unresolved).
