# PR 05 — Structure the Two Anchor Documents

**Read first:** `00-overview.md`, `03-schema-three-layers.md` · **Depends on:** PR 04 and Checkpoint 1 · **Estimate:** 6–9 days · **Checkpoint 2:** owner compares five clauses with the PDFs

## Goal

Turn the two base documents into complete, faithful structured data and publish them as the first real release (`2.0.0`):

1. Building Bye-laws 2003 (base text, as originally issued)
2. Zoning Regulations of RMP 2015 (base text, as originally issued)

Amendments are not applied in this PR (PRs 08 and 09). Each node gets version 1 only.

## 1. Parse

- Adapters compared on both documents: pypdfium2 text (baseline); Docling standard pipeline with table structure; Docling VLM pipeline with Granite-Docling for hard pages and tables (if its licence passes R4). Tesseract only for scanned pages.
- Score per document and per page range: text completeness, numbering fidelity against the document's own contents list (if any) and recon, table fidelity checked against page images for every table, bounding-box coverage.
- Different parsers may be used for different page ranges; record why in `docs/decisions/`.
- Output `parser-comparison.md` with the scores and sample page comparisons.

## 2. Structure (schema 1.3, Layer 1)

Use the structuring rules list from `recon.md`. Requirements:
- Every numbered and lettered unit is a node, at every depth, with correct parent.
- Lead-in text to `intro`, closing text to `wrap_up`.
- Provisos, explanations and notes as their own nodes.
- Definitions as `definition` nodes with `defines`.
- Tables as `table` nodes with header hierarchy, row nodes, footnotes; removed from prose. A table that cannot be extracted reliably gets `extraction: failed`, a page image reference and a declared gap.
- Schedules, annexures, forms as nodes. Forms may be stored as headings plus page references if their layout cannot be captured; declared.
- Running heads, footers and page numbers removed from text.
- Nothing dropped: every page's content is in exactly one node, or the page is declared non-content (cover, blank, index) with a reason.
- Verbatim text only. No correction of the source's spelling or punctuation; obvious OCR errors corrected through overrides that cite the page image.

## 3. Annotate (Layer 2, this phase's kinds only)

- `cross_reference`: by rule (patterns from recon); unresolved references kept with raw text.
- `defined_term_use`: by rule, matching normalised defined terms in each document; within-document only for now.
- `provision_type`: rule-based first (e.g. "means" → definition, "shall not" → prohibition, "Provided that" → exception); model-assisted only for the remainder, with model name and version recorded and confidence; low confidence left unannotated rather than guessed.

## 4. Quality

Thresholds per document, written to `qa.md`:
- 100% of nodes with page citation; ≥ 95% with bounding box (or a recorded reason per page, e.g. scanned with no word positions).
- ≥ 98% of each page's content text covered by nodes (character count against the best parser's page text).
- Zero unexplained numbering gaps or duplicates; each explained gap cites the page showing it is in the source.
- Every table structured or declared.
- **Self-check:** 30 random nodes per document (stratified: clauses, sub-items, table rows, definitions, provisos) compared against rendered page images; result recorded per node; failures fixed through overrides and rechecked. Passing nodes are `machine_checked`.

## 5. Publish release 2.0.0

- Bengaluru South becomes visible in production again, with these two documents only.
- `declarations.json` and the coverage note state plainly: "Two base documents published. Amendments not yet applied: the text shown is the original wording, which may have been changed since." The site shows this on both documents, prominently, until PRs 08 and 09 land.
- Map page: still no zones (until PR 07); shows the official boundary if PR 06 has merged.
- "View source p. N" links go to the official URL used, with the page anchor; the archive link is shown beside it.
- Release 1.0.0 stays listed as withdrawn.

## 6. Checkpoint 2 (owner)

The PR description lists **five nodes**, chosen by the agent to cover different kinds (a numbered clause, a sub-item, a table row, a definition, a proviso or explanation), each with:
- its address and our text, as shown on the preview site;
- the source link opening the PDF at the right page.

The owner compares the five (about ten minutes). The agent waits for confirmation; any mismatch found is fixed and re-checked before merge.

## Acceptance

- [ ] Both documents structured completely to schema 1.3; QA thresholds met or each shortfall declared.
- [ ] Parser comparison report with real Docling.
- [ ] Annotations of the three kinds, with methods recorded.
- [ ] Release 2.0.0 published to preview with the "amendments not yet applied" notice.
- [ ] Checkpoint 2 passed.
