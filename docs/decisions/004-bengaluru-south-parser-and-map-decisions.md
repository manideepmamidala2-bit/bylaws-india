# ADR 004 — Parser Selection for Bengaluru South Anchor Documents (`bbl-2003` & `rmp2015-zr`)

- **Status**: Accepted (PR 05)
- **Date**: 2026-11-24
- **Context**: `docs/plans/pr-series/05-structure-anchor-documents.md` §1

## Context

In PR 05 we structure the two anchor instruments of Bengaluru South City Corporation into Schema 1.3 Layer 1 + Layer 2:
1. **`bbl-2003`** — *BANGALORE MAHANAGARA PALIKE BUILDING BYE-LAWS 2003* (84 pages, 370,410 bytes, `Acrobat Distiller 5.0.5 (Windows)`)
2. **`rmp2015-zr`** — *Revised Master Plan 2015 BANGALORE 2007 Volume – III ZONING OF LANDUSE AND REGULATIONS* (69 pages, 329,801 bytes, `Acrobat Distiller 7.0.5 (Windows)`)

Per `05-structure-anchor-documents.md` §1, we evaluated four permissive parsing configurations:
1. `pypdfium2` (`Pypdfium2Adapter`, `pypdfium2==5.7.0`, Apache-2.0 / BSD-3-Clause)
2. `docling` Standard Pipeline with `TableFormerMode.ACCURATE` (`DoclingLayoutAdapter`, `docling==2.31.0`, MIT / Apache-2.0)
3. `docling` VLM Pipeline (`VlmPipelineOptions` with `Granite-Docling` / `SmolDocling`, Apache-2.0)
4. `tesseract` OCR (`TesseractOcrAdapter`, `pytesseract==0.3.13` + `tesseract 5.x`, Apache-2.0)

## Decision

1. **Use `DoclingLayoutAdapter` (`docling==2.31.0`, `PdfPipelineOptions(do_ocr=False, do_table_structure=True)` with `TableFormerMode.ACCURATE` and `do_cell_matching=True`) across all 84 pages of `bbl-2003` and all 69 pages of `rmp2015-zr`.**
   - `Docling` reconstructs complete words and multi-line paragraphs without the intra-word kerning splits (`EXTEN T`, `Co rporation`, `t he`) observed in `pypdfium2`'s raw text-rect segmentation.
   - `Docling`'s `TableFormerMode.ACCURATE` extracts all 23 data tables in `bbl-2003` (including landscape `TABLE 4` on p. 22 and `SCHEDULE I-A`, `I-B`, `IX`, `XIII`) and all 45 tables in `rmp2015-zr` (including the side-by-side landscape tables `C1`–`C5`, `I-1`–`I-5`, `T1`–`T4`, `U1`–`U4` on pp. 13–19 and `Table 8`–`Table 26` on pp. 20–60), whereas `pypdfium2`'s heuristic table detector captures only 7/23 tables in `bbl-2003` and 15/45 tables in `rmp2015-zr`.
2. **Unroll Hanging-Indent Clause Pseudo-Tables in `DoclingLayoutAdapter` (`_is_hanging_indent_clause_table`)**:
   - On pages 4–7, 11–12, 35, 38, 41, 42, 48, and 55 of `bbl-2003.pdf`, hanging-indent definitions (`2.22`–`2.79`) and numbered sub-clauses (`3.2(10.1)`, `16.0`, `18.8`, `21.0`, `1.2.6.2`) are detected by `DocLayNet` as 2-column grids.
   - `_is_hanging_indent_clause_table` identifies grids whose first column contains decimal clause numbers/sub-items and whose second column contains long prose sentences ($>65$ characters) without table header keywords, unrolling them into ordered `ParsedBlock`s with interpolated bounding boxes so they are structured as `definition` and `clause` nodes rather than tables.
3. **Rule R4 & Accuracy Evaluation of Docling VLM (`Granite-Docling`)**:
   - `ibm-granite/granite-docling-258M` and `HuggingFaceTB/SmolDocling-256M-preview` are licensed under **Apache-2.0**, which satisfies Rule R4.
   - However, because `bbl-2003.pdf` and `rmp2015-zr.pdf` have 100% lossless native PDF text streams (`is_scanned: false`), `TableFormerMode.ACCURATE` with `do_cell_matching=True` binds table cells directly to the exact PDF character glyphs without VLM generative transcription risk on numeric FAR/setback values.
4. **Reserve `TesseractOcrAdapter` for Scanned Amendment Notifications (PRs 08–09)**:
   - Neither `bbl-2003.pdf` nor `rmp2015-zr.pdf` contains scanned pages; `TesseractOcrAdapter` is therefore not used on the two anchor documents in PR 05 and will be used in PR 09 for the 4 scanned Zoning Regulation amendment notifications (`2009-03`, `2015-03`, `2019-06`, `2026-01`).
