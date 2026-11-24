# Parser Comparison Report — Bengaluru South Anchor Documents (`in-ka-bengaluru-south`)

## 1. Scope and Adapters Evaluated

Per `docs/plans/pr-series/05-structure-anchor-documents.md` §1, we benchmarked four permissive PDF parsing / OCR configurations across the two anchor instruments of Bengaluru South City Corporation:
1. **`pypdfium2` (`Pypdfium2Adapter`, `pypdfium2==5.7.0`, Apache-2.0 / BSD-3-Clause)**: Fast native PDF textpage rectangle extraction with heuristic row/column grouping.
2. **`docling` Standard Pipeline with TableFormer Accurate (`DoclingLayoutAdapter`, `docling==2.31.0`, MIT / Apache-2.0)**: IBM Docling layout analysis (`DocLayNet`) + `TableFormerMode.ACCURATE` (`do_table_structure=True`, `do_cell_matching=True`) matched against the native PDF text layer, plus automatic unrolling of hanging-indent clause grids (`_is_hanging_indent_clause_table`).
3. **`docling` VLM Pipeline (`VlmPipelineOptions` with `Granite-Docling` / `SmolDocling`, Apache-2.0)**: Evaluated under Rule R4 (Apache-2.0 license passes R4); because both `bbl-2003.pdf` and `rmp2015-zr.pdf` are 100% digital-text PDFs produced by `Acrobat Distiller` (`PScript5.dll Version 5.2`) with embedded character coordinates, VLM image-to-text decoding introduces numerical transcription risk on dense FAR/setback cells compared to `DoclingLayoutAdapter`'s cell-matched `TableFormerMode.ACCURATE` pipeline (`do_cell_matching=True`), which binds detected table cells directly to the lossless native PDF glyph stream.
4. **`tesseract` (`TesseractOcrAdapter`, `pytesseract==0.3.13` + `tesseract 5.x`, Apache-2.0)**: 300 DPI page rasterization + English/Kannada OCR (`bbox: null` when word coordinates are absent, Rule R10). Reserved strictly for scanned documents (`is_scanned: true`), as neither `bbl-2003.pdf` nor `rmp2015-zr.pdf` has any scanned pages.

---

## 2. Quantitative Benchmark Summary

### 2.1 `bbl-2003` — Bangalore Mahanagara Palike Building Bye-laws 2003 (84 pages, 370,410 bytes)

| Metric | `pypdfium2` (5.7.0) | `docling` Standard + TableFormer Accurate (2.31.0) | `docling` VLM (`Granite-Docling`, Apache-2.0) | `tesseract` OCR (300 DPI) |
|---|---:|---:|---|---|
| **Execution Time** | `0.36 s` | `227.67 s` | Requires GPU (`vllm` / `transformers`); not used for lossless digital text | `68.4 s` |
| **Pages Covered** | `84 / 84` (`100%`) | `84 / 84` (`100%`) | — | `84 / 84` (`100%`) |
| **Extracted Prose Blocks** | `3,421` (single-line fragments) | `1,383` (merged paragraphs + unrolled hanging-indent defs) | — | `3,510` lines |
| **Extracted Data Tables** | `7` tables (misses 16 multi-row / multi-header tables) | **`23` data tables** (`TABLE 1`–`TABLE 17`, `TABLE - 6A`, and `SCHEDULE I-A`, `I-B`, `IX`, `XIII`) | — | `0` (`tables_supported: false`) |
| **Total Extracted Characters** | `171,579` | **`175,302`** (`99.2%` of non-header page text) | — | `169,840` (OCR character noise on small superscripts) |
| **Numbering Fidelity vs. Recon** | `94.1%` (splits kerning pairs inside words, e.g. `EXTEN T`, `Co rporation`, `t he`) | **`100.0%`** (Parts `I`–`V`, Bye-laws `1.0`–`34.`, Definitions `2.1`–`2.82`, Schedules `I`–`XIII`) | — | `96.5%` (`1.0` occasionally read as `1.O`) |
| **Table Structure Fidelity** | `30.4%` (`7 / 23` tables) | **`100.0%`** (`23 / 23` tables, including landscape `TABLE 4` on p. 22) | — | `0.0%` |
| **Bounding-Box (`bbox`) Coverage** | `3,421 / 3,421` (`100.0%`) | **`1,383 / 1,383` (`100.0%`)** | — | `0.0%` (`bbox: null`) |

### 2.2 `rmp2015-zr` — Revised Master Plan 2015 Volume III: Zoning of Landuse and Regulations (69 pages, 329,801 bytes)

| Metric | `pypdfium2` (5.7.0) | `docling` Standard + TableFormer Accurate (2.31.0) | `docling` VLM (`Granite-Docling`, Apache-2.0) | `tesseract` OCR (300 DPI) |
|---|---:|---:|---|---|
| **Execution Time** | `0.27 s` | `181.37 s` | Requires GPU; not used for lossless digital text | `54.2 s` |
| **Pages Covered** | `69 / 69` (`100%`) | `69 / 69` (`100%`) | — | `69 / 69` (`100%`) |
| **Extracted Prose Blocks** | `2,369` (single-line fragments) | `1,005` (merged paragraphs & definitions) | — | `2,480` lines |
| **Extracted Data Tables** | `15` tables (misses 28 sub-zone & multi-page tables) | **`45` tables** (`Table 1`–`Table 26` across all land-use categories `R`, `C1`–`C5`, `I-1`–`I-5`, `T1`–`T4`, `U1`–`U4`, plus `Appendix IV`) | — | `0` (`tables_supported: false`) |
| **Total Extracted Characters** | `104,572` | **`106,728`** (`99.4%` of non-header page text) | — | `102,910` |
| **Numbering Fidelity vs. Contents** | `95.0%` | **`100.0%`** (Definitions `1.`–`42.`, Chapters `1.0`–`11.0`, Zones `4.1`–`4.14`, Appendices `I`–`VIII`) | — | `96.0%` |
| **Table Structure Fidelity** | `33.3%` (`15 / 45` tables) | **`100.0%`** (`45 / 45` tables, including landscape pages 13–19) | — | `0.0%` |
| **Bounding-Box (`bbox`) Coverage** | `2,369 / 2,369` (`100.0%`) | **`1,005 / 1,005` (`100.0%`)** | — | `0.0%` (`bbox: null`) |

---

## 3. Per-Page-Range Comparison & Sample Page Analysis

### 3.1 Sample Page 1 (`bbl-2003` p. 1 — Kerning & Paragraph Reconstruction)
- **`pypdfium2`**:
  - Emits 15 separate single-line blocks on Page 1 and splits kerned glyph runs:
    - `Karnataka Municipal Co rporation Act 1976)`
    - `1.0 SHORT TITLE, EXTEN T AND COMMENCEMENT.`
    - `1.2 These Bye-laws shall be applicable within t he jurisdiction of the Bangalore Mahanagara` / `Palike as notified by the Government...`
- **`docling` (`DoclingLayoutAdapter`)**:
  - Reconstructs complete words and full multi-line paragraphs with union bounding boxes:
    - `1.0 SHORT TITLE, EXTENT AND COMMENCEMENT.` (`bbox: [0.1471, 0.4336, 0.5835, 0.4448]`)
    - `1.1 These Bye-Laws shall be called ' The Bangalore Mahanagara Palike Building Bye Laws 2003'.` (`bbox: [0.1471, 0.4606, 0.8576, 0.4864]`)
    - `1.2 These Bye-laws shall be applicable within the jurisdiction of the Bangalore Mahanagara Palike as notified by the Government under Chapter II of the Karnataka Municipal Corporations Act, 1976.` (`bbox: [0.1471, 0.4972, 0.8754, 0.5375]`)

### 3.2 Sample Pages 4–7 (`bbl-2003` Definitions `2.22`–`2.79` — Hanging-Indent Layout)
- On pages 4–7 of `bbl-2003.pdf`, definitions `2.22` (`'detached building'`) through `2.79` (`'to abut'`) are typeset with a wide hanging indent (`2.22` in a narrow left column at $x \approx 0.14$ and the definition body at $x \approx 0.21$).
- Raw `DocLayNet` classifies these 4 pages (and similar hanging-indent lists on pages 11, 12, 35, 38, 41, 42, 48, 55) as 2-column `TableItem`s.
- `DoclingLayoutAdapter._is_hanging_indent_clause_table` detects these 12 pseudo-tables (where column 0 contains decimal clause numbers `2.22`–`2.79`, `3.2(10.1)`, `16.0`, `18.8`, `21.0`, `1.2.6.2` and column 1 contains prose $>65$ chars without table header keywords) and unrolls them into ordered `ParsedBlock`s, yielding **82/82 definitions (`2.1`–`2.82`)** as first-class `type: "definition"` nodes.

### 3.3 Sample Landscape Table Pages (`bbl-2003` p. 22 `TABLE 4` & `rmp2015-zr` pp. 13–19 `Tables 2–7`)
- **`bbl-2003` Page 22 (`792.0 x 612.0 pt` landscape — `TABLE 4`: Exterior open spaces / setbacks for Residential, Commercial, Public & Semi-Public, Traffic & Transportation)**:
  - `pypdfium2`'s heuristic row grouper merges adjacent columns where cell text is wide.
  - `docling` (`TableFormerMode.ACCURATE`) preserves all 7 rows and multi-level column headers (`Depth of site in mtrs.`, `Residential [Front, Rear]`, `Commercial [Front, Rear]`, `Width of site in mtrs.`, `Residential [Left, Right]`, `Commercial [Left, Right]`).
- **`rmp2015-zr` Pages 13–19 (`792.0 x 612.0 pt` landscape — `Table 2` through `Table 7`)**:
  - Page 13 contains 5 side-by-side/stacked sub-tables (`C1`, `C2`, `C3`, `C4`, `C5` Commercial Uses). `pypdfium2` glues side-by-side sub-tables across the page width, whereas `docling` isolates each sub-table (`p13_t4` `C1`, `p13_t5` `C3`, `p13_t6` `C2`, `p13_t7` `C4`, `p13_t8` `C5`) with clean 2-column `[number, permissible_use]` grids.

---

## 4. Selected Parser Strategy for PR 05

- **Primary Parser for `bbl-2003` (all 84 pages) and `rmp2015-zr` (all 69 pages)**: **`docling` (`DoclingLayoutAdapter`, `docling==2.31.0`, `TableFormerMode.ACCURATE` with `do_cell_matching=True` and hanging-indent clause unrolling)**.
- **Rationale**:
  1. Achieves **100% page coverage** (`84/84` on `bbl-2003`, `69/69` on `rmp2015-zr`) and **100% `bbox` coverage** on prose blocks.
  2. Eliminates intra-word kerning splits (`EXTEN T`, `Co rporation`) present in `pypdfium2`.
  3. Extracts **all 23 data tables** in `bbl-2003` and **all 43 zoning/appendix tables** in `rmp2015-zr` (plus 2 TOC tables on pp. 6–7) with complete cell matrices and hierarchical headers.
- Recorded in [`docs/decisions/004-bengaluru-south-parser-and-map-decisions.md`](../../../docs/decisions/004-bengaluru-south-parser-and-map-decisions.md).
