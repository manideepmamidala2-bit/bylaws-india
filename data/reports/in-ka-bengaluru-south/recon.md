# Reconnaissance Report — Bengaluru South Core Documents (`in-ka-bengaluru-south`)

## 1. Overview

This reconnaissance report records the empirical PDF measurements, structural conventions, layout/OCR anomalies, and **PR 05 Structuring Rules** for all 10 acquired core documents in `data/raw/in-ka-bengaluru-south/`.

---

## 2. Empirical PDF Measurements

| `doc_id` | Bytes | Pages | Native Text Pages | Native Chars | Scanned / Digital | Page Dimensions (pt) | PDF Creator | PDF Producer | CreationDate |
|---|---:|---:|---:|---:|---|---|---|---|---|
| `bbl-2003` | 370,410 | 84 | 84 / 84 | 180,633 | Digital (`is_scanned: false`) | `612.0 x 792.0` (portrait), `792.0 x 612.0` (page 22 landscape) | `PScript5.dll Version 5.2` | `Acrobat Distiller 5.0.5 (Windows)` | `D:20040610120316Z` |
| `ka-model-bbl-2017` | 2,640,281 | 255 | 254 / 255 | 981,787 | Digital (`is_scanned: false`) | `595.0 x 841.0`, `595.0 x 842.0` | `PDFCreator Version 0.9.6` | `3-Heights(TM) PDF Merge Split API 4.9.17.0` | `D:20171030192019+05'30'` |
| `rmp2015-zr` | 329,801 | 69 | 69 / 69 | 111,258 | Digital (`is_scanned: false`) | `612.0 x 792.0` (portrait), `792.0 x 612.0` (pages 13–19 landscape) | `PScript5.dll Version 5.2` | `Acrobat Distiller 7.0.5 (Windows)` | `D:20070921144531+05'30'` |

### 2.1 First and Last Clause / Provision Numbers per Acquired Document (Owner Checkpoint 1 Verification)

| `doc_id` | Pages | First Clause / Provision (with PDF Page) | Last Clause / Provision (with PDF Page) |
|---|---:|---|---|
| `bbl-2003` | 84 | `PART I — GENERAL`, `1.0 SHORT TITLE, EXTENT AND COMMENCEMENT` / `1.1` (p. 1) | Main text: `PART V — MISCELLANEOUS`, `33.0 PROHIBITION OF CONSTRUCTION ON PUBLIC PROPERTY` (`33.2(ii)`) & `34. REPEAL AND SAVINGS` (p. 51); Schedules: `SCHEDULE I` (p. 53) to `SCHEDULE XIII` (`SCHEDULE II OF THE NATIONAL BUILDING ORGANISATION`, item `8. Date of completion of Construction`, p. 83; `MAP` placeholder on p. 84) |
| `ka-model-bbl-2017` | 255 | `1. Title, commencement and application.- (1)` & `2. Definitions.- (1) 'Act'` (p. 2) | `Annexure-XII` / final schedule form (p. 255) |
| `rmp2015-zr` | 69 | Definitions: `TECHNICAL TERMS AND DEFINITIONS` `1. Amalgamation` (PDF p. 3 / printed p. 2); Chapters: `1.0 INTRODUCTION` / `FRAMEWORK AND OBJECTIVES` (PDF p. 9 / printed p. 8) | Chapters: `11.0 TRANSFER OF DEVELOPMENT RIGHTS (TDR)` condition `24.` (PDF p. 57 / printed p. `- 56 -`); Appendices: `APPENDIX I` (`Table 26`, PDF p. 58 / printed p. `- 57 -`) to `APPENDIX-VIII` (`DEVELOPMENT RIGHTS CERTIFICATE`, item `(3)`, PDF p. 69 / printed p. `- 68 -`) |
| `rmp2015-zr-amend-2009-03` | 4 | `No.UDD 93 MNJ 2008 NOTIFICATION` preamble (p. 1) | `4.10 TRAFFIC AND TRANSPORTATION (T&T)` / `4.10.2 Regulations` / `Table 19: FAR and Ground Coverage in Traffic and Transportation` Note `iii.` (p. 3; distribution list `1)`–`16)` on p. 4) |
| `rmp2015-zr-amend-2015-03` | 3 | `No: UDD 105 MNJ 2008, Bangalore, Dated:20/03/2015` clause `1)` & `Table 1: Permissible land use in Residential category` (p. 1) | `4.2.2) Regulations — Permissible Land use: In Ring-III` bullet `4` (p. 3) |
| `rmp2015-zr-amend-2018-09` | 2 | `1. Title and commencement.- (1)` & `2. Amendment of Chapter-3.- (A) 3.4 (vi) Impact Zone Premium FAR` (p. 1) | `3. Insertion of Appendix IX` table (p. 2) |
| `rmp2015-zr-amend-2019-06` | 8 | English text: `1. Title and commencement.- (1)` & `2. Amendment of "technical terms and definitions".- (1)` (p. 6; Notification header on bottom of p. 5) | `6. Amendment to Chapter 8.-` (`Table-23` serial numbers `7` and `8`, p. 8) |
| `rmp2015-zr-comp-2024-10-kn` | 36 | Kannada preamble `BBMP/TP/2024-25` dated `19/10/2024` (p. 1) | Kannada compilation closing table / signature block (p. 36) |
| `rmp2015-zr-amend-2025-02` | 16 | `NOTIFICATION-1` (`No. UDD 78 MNJ 2024 (E)`, `1. Title and Commencement`, p. 1) | English text: `NOTIFICATION-II` clause `24. Undervaluation of premium charges...` (p. 11; Kannada Gazette text on pp. 12–16) |
| `rmp2015-zr-amend-2026-01` | 7 | `1. Title and Commencement` & `2. Amendment of Chapter 3` (`3.1 Setbacks` & `Table 8`, pp. 1–2) | `3. Amendment of Chapter 4` (`(d) In regulation 4.7 INDUSTRIAL I (GENERAL), table 16 shall be substituted as below: Table 16`, Sl. No. `1`–`4`, p. 6; distribution list `1.`–`10.` on p. 7) |
| `rmp2015-zr-amend-2009-03` | 1,458,644 | 4 | 0 / 4 | 0 (OCR: 4,218 chars) | Scanned (`is_scanned: true`) | `612.0 x 792.0` | *(none — image scan)* | *(none — image scan)* | *(none)* |
| `rmp2015-zr-amend-2015-03` | 155,049 | 3 | 0 / 3 | 0 (OCR: 4,812 chars) | Scanned (`is_scanned: true`) | `590.2 x 887.5` to `592.1 x 885.1` | `PaperPort 12` | `PaperPort 12` | `D:20150812161337+05'30'` |
| `rmp2015-zr-amend-2018-09` | 118,308 | 2 | 2 / 2 | 7,753 | Digital (`is_scanned: false`) | `595.0 x 842.0` | `PDFium` | `PDFium` | `D:20190129134509Z` |
| `rmp2015-zr-amend-2019-06` | 3,568,360 | 8 | 0 / 8 | 0 (OCR: pages 5–8 English) | Scanned (`is_scanned: true`) | `595.1 x 841.7` | `KMBT_C552` | `KONICA MINOLTA bizhub C552` | `D:20190716023751+00'00'` |
| `rmp2015-zr-comp-2024-10-kn` | 8,248,176 | 36 | 0 / 36 | 0 (Kannada-only scan) | Scanned (`is_scanned: true`) | `582.0 x 842.0` | *(none — image scan)* | *(none — image scan)* | *(none)* |
| `rmp2015-zr-amend-2025-02` | 1,282,141 | 16 | 16 / 16 | 35,282 | Digital (`is_scanned: false`) | `612.0 x 792.0` | *(none)* | `Microsoft: Print To PDF` | `D:20250225174936+05'30'` |
| `rmp2015-zr-amend-2026-01` | 344,161 | 7 | 0 / 7 | 0 (OCR: 10,845 chars) | Scanned (`is_scanned: true`) | `593.0 x 844.0` to `600.0 x 851.0` | `NAPS2` | `PDFsharp 1.32.2608-g (www.pdfsharp.net)` | `D:20260105192704+05'30'` |

---

## 3. Per-Document Structural & Layout Reconnaissance

### 3.1 `bbl-2003` — Bangalore Mahanagara Palike Building Bye-laws 2003 (84 pages, digital)
- **Hierarchy & Numbering**:
  - Top-level divisions: `PART I` (`GENERAL`, p. 1), `PART II` (`ADMINISTRATION`, p. 9), `PART III` (`GENERAL BUILDING REQUIREMENTS`, p. 19), `PART IV` (`STRUCTURAL DESIGN AND OTHER REQUIREMENTS`, p. 47).
  - Clauses use decimal numbering (`1.0`, `1.1`, `1.2`, `1.3`, `2.0`, `2.1` ... `2.96`, `3.0` ... `38.0`).
  - Sub-clauses use `(a)`, `(b)`, `(i)`, `(ii)` and decimal third-level numbers (`9.1`, `9.2`, `9.3`).
  - Schedules: `SCHEDULE I` through `SCHEDULE XIII` (pp. 53–84), including application forms, occupancy certificate forms, and ventilation/sanitation standards.
- **Tables**:
  - 18 numbered tables (`TABLE 1` through `TABLE 17`, plus `TABLE - 6A`).
  - **Page 22 (`TABLE 4`: Setbacks & Coverage for Residential/Commercial plots)** is formatted in **landscape (`792.0 x 612.0 pt`)**.
- **Running Headers / Footers**:
  - Every page starts with a two-line running header: `Building Bye-Laws – 2003` on line 1 and the page number (`1`–`84`) on line 2.

### 3.2 `rmp2015-zr` — Revised Master Plan 2015 Volume III: Zoning of Landuse and Regulations (69 pages, digital)
- **Hierarchy & Numbering**:
  - Prefatory sections: Cover (p. 1), `ABBREVIATIONS` (p. 2), `TECHNICAL TERMS AND DEFINITIONS` (numbered `1.`–`85.`, pp. 3–6), Table of Contents & List of Tables/Appendices (pp. 7–8).
  - Chapters (`1.0`–`9.0`):
    - `1.0 INTRODUCTION` (p. 9)
    - `2.0 LIST OF LAND USE CATEGORIES PERMISSIBLE IN VARIOUS ZONES` (`Table 1`–`Table 7`, pp. 12–19)
    - `3.0 REGULATIONS APPLICABLE TO ALL ZONES` (`3.1 Setbacks` with `Table 8` & `Table 9`, `3.2 Width of the road`, `3.3 Floor`, `3.4 FAR`, `3.5 Ground coverage`, `3.6 Distance between buildings`, `3.7 Compound wall`, `3.8 Cul-de-sac`, `3.9 Basement`, `3.10 Ramps`, `3.11 Mezzanine`, `3.12 Garages`, `3.13 Means of access`, `3.14 Staircase`, `3.15 Architectural features`, `3.16 General notes`, `3.17 No Objection Certificates`, `3.18 Security deposit`, pp. 20–27)
    - `4.0 REGULATIONS FOR MAIN LAND USE ZONES` (`4.1 RESIDENTIAL (MAIN)` with `Table 10`, `4.2 RESIDENTIAL (MIXED)` with `Table 11` & `Table 12`, `4.3 COMMERCIAL (CENTRAL)` with `Table 13`, `4.4 COMMERCIAL (BUSINESS)` with `Table 14`, `4.5 MUTATION CORRIDORS` with `Table 15`, `4.6 COMMERCIAL AXES`, `4.7 INDUSTRIAL (I-GENERAL)` with `Table 16`, `4.8 INDUSTRIAL (HI-TECH)` with `Table 17`, `4.9 PUBLIC AND SEMI-PUBLIC (P&SP)` with `Table 18`, `4.10 TRAFFIC AND TRANSPORTATION (T&T)` with `Table 19`, `4.11 PUBLIC UTILITIES (PU)`, `4.12 PARK AND OPEN SPACE (P)`, `4.13 UNCLASSIFIED USE`, `4.14 AGRICULTURAL LAND USE ZONE (AG)`, pp. 28–42)
    - `5.0 SUB-DIVISION REGULATIONS` (pp. 43–44)
    - `6.0 REGULATIONS FOR RESIDENTIAL DEVELOPMENT PLAN AND NON RESIDENTIAL DEVELOPMENT PLAN` (`Table 20` & `Table 21`, pp. 45–47)
    - `7.0 REGULATIONS FOR INTEGRATED TOWNSHIP` (`Table 22`, p. 48)
    - `8.0 PARKING REQUIREMENTS` (`Table 23`, pp. 49–51)
    - `9.0 FIRE PROTECTION REQUIREMENTS AND SAFETY MEASURES` (`Table 24`, pp. 52–54)
    - `10.0 HERITAGE CONSERVATION` & `11.0 TRANSFER OF DEVELOPMENT RIGHTS (TDR)` (`Table 25`, pp. 54–56)
    - `APPENDIX I` (`Table 26: Building lines specified for various roads`, pp. 57–59) through `APPENDIX VIII` (pp. 60–69).
- **Landscape Pages**:
  - Pages 13–19 (`Table 2` through `Table 7`) are formatted in **landscape (`792.0 x 612.0 pt`)**.
- **Running Headers / Footers**:
  - Top of each page has the 0-indexed page number (`0` on page 1 through `68` on page 69).

### 3.3 `rmp2015-zr-amend-2009-03` — Notification No. UDD 93 MNJ 2008 dated 02-03-2009 (4 pages, scanned)
- **Content**: Amends Clause `4.10 TRAFFIC AND TRANSPORTATION (T&T)` (`4.10.1 Description`, `4.10.2 Regulations`, and `Table 19: FAR and Ground Coverage in Traffic and Transportation`) and adds a Metro Rail station FAR 4.0 provision.
- **OCR Characteristics**: Clean 300 DPI monochrome scan in English; Tesseract OCR extracts all 4 pages accurately, with minor table border artifacts in `Table 19` (`Sl. No. 1–4`).

### 3.4 `rmp2015-zr-amend-2015-03` — Notification No. UDD 105 MNJ 2008 dated 20-03-2015 (3 pages, scanned)
- **Content**: Withdraws Notification No. UDD 105 MNJ 2008 dated 11-12-2014 and amends permissible commercial/ancillary uses in Residential Main (`4.1.2`) and Residential Mixed (`4.2.2`) zones across Rings I, II, and III, plus `Table 1: Permissible land use in Residential category`.
- **OCR Characteristics**: Bilingual Gazette masthead at top of Page 1 (Kannada + English), followed by 3 pages of English body text and bullet lists.

### 3.5 `rmp2015-zr-amend-2018-09` — Notification No. UDD 112 MNJ 2015 dated 29-09-2018 (2 pages, digital)
- **Content**: Enacts the *Zoning Regulations of Bengaluru of the Revised Master Plan-2015 (Amendment) Regulations 2018*:
  - Inserts `3.4 (vi) Impact Zone Premium FAR` (sub-clauses `(i)`–`(vii)`)
  - Omits Item `(ix)` in Regulation `3.16` (`General Notes`)
  - Inserts `Appendix-IX` (register format for Impact Zone Premium FAR).
- **Anomaly Found**: Page 1 has **three overlapping text frames** generated by PDFium (`Whereas the draft...` repeated three times in the native text stream). Page 2 has a single clean text layer.

### 3.6 `rmp2015-zr-amend-2019-06` — Notification No. UDD 255 MNJ 2018 dated 19-06-2019 (8 pages, scanned, bilingual)
- **Content**:
  - **Pages 1–5 (top half)**: Kannada Gazette text.
  - **Page 5 (bottom half) – Page 8**: English Gazette text enacting the *Zoning Regulations of Bengaluru of the Revised Master Plan-2015 (Amendment) Regulations, 2019*:
    - Clause 2: Amends Technical Terms & Definitions (`3. Apartment Building or Group Housing or Multi-Dwelling Unit Building`, `16. Non residential Development Plan`).
    - Clause 3: Amends Chapter 3 (`3.1` note after `Table-9` on watchman's cubicle and fire control room; substitutes `3.4 FAR or Floor Area Ratio` exclusions `(i)`–`(xvi)`; inserts `3.4-A Height of Building`; amends `3.6(i)` and `3.9(ix)`).
    - Clause 4: Amends Chapter 6 (`6.1.2` residential development earmarking up to 55%).
    - Clause 5: Amends Chapter 7 (`7.1 Table-20`, `7.2(c)` and `Table-21`, `7.3 Table-22`).
    - Clause 6: Amends Chapter 8 (`8.0 Table-23` serial numbers 7 and 8 for star hotels and office buildings).

### 3.7 `rmp2015-zr-amend-2025-02` — Notification No. UDD 78 MNJ 2024(E) dated 21-02-2025 (16 pages, digital, bilingual)
- **Content**:
  - Contains `NOTIFICATION-1` (pp. 1–6, English) and `NOTIFICATION-II` (pp. 6–11, English), followed by Kannada Gazette text on pp. 12–16.
  - Inserts comprehensive Premium FAR regulations (`3.4(vii)` / Premium FAR tables based on road width: 9m–12m $\rightarrow$ 20%, 12m–18m $\rightarrow$ 40%, above 18m $\rightarrow$ 60% of permissible FAR) and fee calculation / TDR equivalence rules.
- **Anomaly Found**: Occasional control-character ligature substitutions (`\u0002` in `Plan\u00022015`) from `Microsoft: Print To PDF`.

### 3.8 `rmp2015-zr-amend-2026-01` — Notification No. UDD 235 MNJ 2025(E) dated 05-01-2026 (7 pages, scanned, English)
- **Content**: Enacts the *Zonal Regulations of Revised Master Plan-2015 of the Local Planning Area of Bengaluru and Greater Bengaluru (Amendment) Regulations, 2025*:
  - Amends Regulation `3.1` Setbacks and substitutes **Table 8: Setbacks for buildings with total height upto 12.0 m (excluding stilt floor)** (plots up to 60 sq.m, 60–150 sq.m, 150–250 sq.m, 250–4000 sq.m) and height threshold up to 15m (including stilt) on plots $\le$ 250 sq.m.
  - Amends Regulation `3.9` Basement (`(iii)`, `(x)`) and Regulation `3.10` Ramps (`(i)`, `(iii)`, `(iv)`, mechanized/hydraulic car lift provisions).
  - Amends Ring I, II & III apartment plot size thresholds (`4.1` / `4.2`), Regulation `4.5` Mutation Corridors (`Table 15`), and Regulation `4.7` Industrial I (`Table 16`).

### 3.9 `ka-model-bbl-2017` — Karnataka Municipalities Model Building Bye-Laws, 2017 (255 pages, digital)
- **Content**: State-level Model Building Bye-laws notified under Section 325 of the Karnataka Municipalities Act, 1964; published on BPAS as a state reference document (`role: reference`).
- **Anomaly Found**: Page 1 is a blank cover page; Page 2 has a two-column bilingual Gazette header where the right edge of the English column was slightly clipped during PDF merge (`3-Heights(TM) PDF Merge Split API`).

---

## 4. Concrete PR 05 Structuring Rules List

Based on the reconnaissance findings above, **PR 05 (Structure Core Documents)** will apply the following explicit rules in `pipeline/bylaws/structure.py`, `pipeline/bylaws/annotations.py`, `pipeline/bylaws/amendments.py`, and `overrides/in-ka-bengaluru-south.yaml`:

1. **Rule S1 — Running Header & Page-Number Stripping**:
   - In `bbl-2003`, strip the top two-line running header (`^Building Bye-Laws\s*[–-]\s*2003\s*\n\d+\s*\n`) on pages 1–84 before heading detection so mid-sentence continuations across page breaks are not split into spurious clauses.
   - In `rmp2015-zr`, strip the leading 0-indexed page number (`^\s*\d+\s*\n`) at the top of pages 1–69.
2. **Rule S2 — Canonical Hierarchical `eid` Assignment (Layer 1)**:
   - `bbl-2003`: Assign `part_I`–`part_IV`, `sec_1`–`sec_38` (for `1.0`–`38.0`), `sec_9__subsec_9_1` (for `9.1`, `9.2`...), `sched_I`–`sched_XIII`, and `tbl_1`–`tbl_17` (`tbl_6A`).
   - `rmp2015-zr`: Assign `sec_defs` (for `TECHNICAL TERMS AND DEFINITIONS` items `1`–`85`), `ch_1`–`ch_11` (for `1.0`–`11.0`), `sec_3_1`–`sec_3_18`, `sec_4_1`–`sec_4_14` (for land-use zones `R`, `R-M`, `C-C`, `C-B`, `MC`, `I-G`, `I-HT`, `P&SP`, `T&T`, `PU`, `P`, `AG`), `tbl_1`–`tbl_26`, and `app_I`–`app_VIII`.
3. **Rule S3 — Landscape Table Extraction**:
   - Use `DoclingLayoutAdapter` on digital PDFs (`bbl-2003` p. 22 `TABLE 4` and `rmp2015-zr` pp. 13–19 `Table 2`–`Table 7`, pp. 20–21 `Table 8`–`Table 9`, pp. 29–41 `Table 10`–`Table 19`, pp. 49–51 `Table 23`) to preserve full row/column structure of wide landscape and multi-column zoning tables.
4. **Rule S4 — Bilingual Page Filtering (English-Only Ingestion)**:
   - In `rmp2015-zr-amend-2019-06` (8 pages scanned), restrict English structuring to pages 5–8 (where the English Gazette notification `No. UDD 255 MNJ 2018` begins) and ignore Kannada pages 1–4.
   - In `rmp2015-zr-amend-2025-02` (16 pages digital), restrict English structuring to pages 1–11 (`NOTIFICATION-1` and `NOTIFICATION-II`) and ignore Kannada pages 12–16.
   - Do not structure `rmp2015-zr-comp-2024-10-kn` (`languages: ["kn"]`).
5. **Rule S5 — Overlapping Text Frame Deduplication (`rmp2015-zr-amend-2018-09`)**:
   - On Page 1 of `rmp2015-zr-amend-2018-09.pdf`, deduplicate the three overlapping PDFium text frames (or select the complete frame containing `REGULATIONS 1. Title and commencement... 3.4 (vi) Impact Zone Premium FAR`) so each clause (`sec_1`, `sec_2`, `sec_3`) appears once with clean text.
6. **Rule S6 — Control-Character Normalization (`rmp2015-zr-amend-2025-02`)**:
   - Replace `\u0002` (STX) hyphenation/ligature control bytes from `Microsoft: Print To PDF` with `-` during text normalization.
7. **Rule S7 — Scanned Amendment OCR + Table Verification (`rmp2015-zr-amend-2009-03`, `2015-03`, `2019-06`, `2026-01`)**:
   - Run `TesseractOcrAdapter` (`bbox: null` per Rule R10) on the 4 scanned English amendments and apply verified `text_fixes` / `tables` in `overrides/in-ka-bengaluru-south.yaml` for OCR-degraded cells in `Table 19` (2009-03), `Table 23` (2019-06), and `Table 8` / `Table 16` (2026-01), with mandatory `source_page` and `reason` on every override entry.
8. **Rule S8 — Layer 3 Machine-Readable `effects` & `versions` Chain**:
   - Link each amendment (`2009-03`, `2015-03`, `2018-09`, `2019-06`, `2025-02`, `2026-01`) to its exact target `eid` in `rmp2015-zr` (`sec_4_10` / `tbl_19`, `sec_4_1` / `sec_4_2` / `tbl_1`, `sec_3_4` / `sec_3_16`, `sec_defs` / `sec_3_1` / `sec_3_4` / `tbl_20`–`tbl_23`, `sec_3_4`, `sec_3_1` / `tbl_8` / `sec_3_9` / `sec_3_10` / `tbl_15` / `tbl_16`) so `bylaws consolidate` builds the complete chronological `versions[]` history for every amended clause and table.
