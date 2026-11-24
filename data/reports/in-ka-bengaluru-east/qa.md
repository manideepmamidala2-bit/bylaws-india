# Quality Assurance Report — `in-ka-bengaluru-east` (Bengaluru East City Corporation)

## 1. Schema v1.3 Validation

- `data/raw/in-ka-bengaluru-east/bbl-2003.meta.json` against `document.schema.json`: PASS
- `data/raw/in-ka-bengaluru-east/ka-model-bbl-2017.meta.json` against `document.schema.json`: PASS
- `data/raw/in-ka-bengaluru-east/rmp2015-zr.meta.json` against `document.schema.json`: PASS
- `data/raw/in-ka-bengaluru-east/rmp2015-zr-amend-2009-03.meta.json` against `document.schema.json`: PASS
- `data/raw/in-ka-bengaluru-east/rmp2015-zr-amend-2015-03.meta.json` against `document.schema.json`: PASS
- `data/raw/in-ka-bengaluru-east/rmp2015-zr-amend-2018-09.meta.json` against `document.schema.json`: PASS
- `data/raw/in-ka-bengaluru-east/rmp2015-zr-amend-2019-06.meta.json` against `document.schema.json`: PASS
- `data/raw/in-ka-bengaluru-east/rmp2015-zr-comp-2024-10-kn.meta.json` against `document.schema.json`: PASS
- `data/raw/in-ka-bengaluru-east/rmp2015-zr-amend-2025-02.meta.json` against `document.schema.json`: PASS
- `data/raw/in-ka-bengaluru-east/rmp2015-zr-amend-2026-01.meta.json` against `document.schema.json`: PASS
- `register:rmp2015-zr-amend-2025-07` (not_found) against `document.schema.json`: PASS
- `data/raw/in-ka-bengaluru-east/udd-1107-mnu-2018-draft.meta.json` against `document.schema.json`: PASS
- `data/raw/in-ka-bengaluru-east/rmp2015-pd-index.meta.json` against `document.schema.json`: PASS
- `data/raw/in-ka-bengaluru-east/becc-bbl-amend-2026-05.meta.json` against `document.schema.json`: PASS
- `data/raw/in-ka-bengaluru-east/becc-bbl-amend-2026-04-draft.meta.json` against `document.schema.json`: PASS
- `data/processed/in-ka-bengaluru-east/documents/bbl-2003.clauses.json` against `clause-tree.schema.json`: PASS
- `data/processed/in-ka-bengaluru-east/documents/bbl-2003.annotations.json` against `annotations.schema.json`: PASS
- `data/processed/in-ka-bengaluru-east/documents/ka-model-bbl-2017.clauses.json` against `clause-tree.schema.json`: PASS
- `data/processed/in-ka-bengaluru-east/documents/ka-model-bbl-2017.annotations.json` against `annotations.schema.json`: PASS
- `data/processed/in-ka-bengaluru-east/documents/rmp2015-zr.clauses.json` against `clause-tree.schema.json`: PASS
- `data/processed/in-ka-bengaluru-east/documents/rmp2015-zr.annotations.json` against `annotations.schema.json`: PASS
- `data/processed/in-ka-bengaluru-east/documents/udd-1107-mnu-2018-draft.clauses.json` against `clause-tree.schema.json`: PASS
- `data/processed/in-ka-bengaluru-east/documents/udd-1107-mnu-2018-draft.annotations.json` against `annotations.schema.json`: PASS
- `data/processed/in-ka-bengaluru-east/documents/becc-bbl-amend-2026-05.clauses.json` against `clause-tree.schema.json`: PASS
- `data/processed/in-ka-bengaluru-east/documents/becc-bbl-amend-2026-05.annotations.json` against `annotations.schema.json`: PASS
- `data/processed/in-ka-bengaluru-east/documents/becc-bbl-amend-2026-04-draft.clauses.json` against `clause-tree.schema.json`: PASS
- `data/processed/in-ka-bengaluru-east/documents/becc-bbl-amend-2026-04-draft.annotations.json` against `annotations.schema.json`: PASS
- `data/processed/in-ka-bengaluru-east/amendments.json` against `amendments.schema.json`: PASS
- `data/processed/in-ka-bengaluru-east/consolidated.json` against `consolidated.schema.json`: PASS
- `data/processed/in-ka-bengaluru-east/geo-layers.json` against `geo-layers.schema.json`: PASS
- `data/processed/in-ka-bengaluru-east/clause-zone-tags.json` against `clause-zone-tags.schema.json`: PASS
- `data/processed/in-ka-bengaluru-east/declarations.json` against `declarations.schema.json`: PASS

## 2. QA Checks Executed

| # | Check | Status | Details |
|---|---|---|---|
| 1 | Clause `legal_status` present & valid | PASS | 5539/5539 valid |
| 2 | Clause citation page >= 1 | PASS | 5539/5539 valid |
| 3 | Citation bounding box (`bbox`) coverage | PASS | 5755/5755 citations (100.0%) have bbox (>= 95% threshold) |
| 4 | Clause numbering continuity (with source page citations) | PASS | Duplicates: 0; Source-native gaps: 27 (bbl-2003: bbl-2003:3.0.missing [11] (source p. 15); bbl-2003: bbl-2003:4.0.missing [2, 3] (source p. 15, p. 16); bbl-2003: bbl-2003:9.10.missing [3] (source p. 28); bbl-2003: bbl-2003:10.0.missing [3] (source p. 29); bbl-2003: bbl-2003:11.0.missing [4] (source p. 30); bbl-2003: bbl-2003:SCHEDULE I:1.2.missing [7] (source p. 54); bbl-2003: bbl-2003:SCHEDULE XIII.missing [2, 3] (source p. 82, p. 83); ka-model-bbl-2017: ka-model-bbl-2017:APPENDIX VII.missing [3, 4] (source p. 15); ka-model-bbl-2017: ka-model-bbl-2017:CHAPTER 5.missing [15] (source p. 23); ka-model-bbl-2017: ka-model-bbl-2017:5.2.3.missing [2] (source p. 24); ka-model-bbl-2017: ka-model-bbl-2017:5.2.4.missing [3, 4] (source p. 25, p. 26); ka-model-bbl-2017: ka-model-bbl-2017:CHAPTER 10.missing [3] (source p. 54); ka-model-bbl-2017: ka-model-bbl-2017:PART 4_5.missing [15] (source p. 64); ka-model-bbl-2017: ka-model-bbl-2017:CHAPTER 13.missing [3, 4, 5, 6, 7, 8, 9] (source p. 1, p. 71, p. 76); ka-model-bbl-2017: ka-model-bbl-2017:14.2.missing [4] (source p. 78); ka-model-bbl-2017: ka-model-bbl-2017:14.3.1.missing [2, 3] (source p. 78); ka-model-bbl-2017: ka-model-bbl-2017:11.2:11.2.3_3.missing [5, 6, 7, 8, 9, 11, 24] (source p. 1, p. 89, p. 95); ka-model-bbl-2017: ka-model-bbl-2017:3.11.missing [3, 4] (source p. 141); ka-model-bbl-2017: ka-model-bbl-2017:CHAPTER 5_2.missing [15] (source p. 150); ka-model-bbl-2017: ka-model-bbl-2017:9.3:9.3.1.missing [2] (source p. 179); ka-model-bbl-2017: ka-model-bbl-2017:CHAPTER 10_2.missing [8, 9] (source p. 182, p. 184); ka-model-bbl-2017: ka-model-bbl-2017:CHAPTER 13_2.missing [5, 6, 7, 8, 9] (source p. 1, p. 201, p. 204); ka-model-bbl-2017: ka-model-bbl-2017:11.2:11.2.3_7.missing [5, 6, 7, 8, 9, 11, 24] (source p. 1, p. 218, p. 223, p. 224); ka-model-bbl-2017: ka-model-bbl-2017:ANNEXURE C_2.missing [6, 7, 8, 9, 10, 11, 12, 13, 14, 19, 20] (source p. 1, p. 225, p. 226); rmp2015-zr: rmp2015-zr:CHAPTER 3.missing [3] (source p. 21); rmp2015-zr: rmp2015-zr:10.1.missing [10] (source p. 55); udd-1107-mnu-2018-draft: top-level missing [5, 7] (source p. 5, p. 6)) |
| 5 | Clauses with empty text | PASS | 0 empty clause(s) |
| 6 | Page text character coverage (>= 98%) & known gaps | PASS | Page text coverage: `bbl-2003`: 100.0% (169825/169406 content chars); `ka-model-bbl-2017`: 99.2% (943869/951754 content chars); `rmp2015-zr`: 100.0% (105021/104258 content chars); `udd-1107-mnu-2018-draft`: 100.0% (13745/13370 content chars); `becc-bbl-amend-2026-05`: 100.0% (7860/7838 content chars); `becc-bbl-amend-2026-04-draft`: 99.3% (7674/7728 content chars); 2 known gap(s) recorded in `declarations.json` |
| 7 | Unresolved cross-references | WARN | 99 unresolved (bbl-2003:preamble -> bbl-2003:428; bbl-2003:3.2(10.1)(b) -> bbl-2003:17; bbl-2003:5.6(a) -> bbl-2003:300; bbl-2003:7.1(j) -> bbl-2003:95; bbl-2003:7.1:note_1 -> bbl-2003:354; bbl-2003:7.3 -> bbl-2003:17; bbl-2003:15.4(i)(iii) -> bbl-2003:9.10.3; bbl-2003:20.3(a) -> bbl-2003:20.11.3; bbl-2003:32.0(b) -> bbl-2003:32; bbl-2003:32.0(c) -> bbl-2003:32; bbl-2003:SCHEDULE II -> bbl-2003:299; bbl-2003:SCHEDULE III -> bbl-2003:3.2.11; bbl-2003:SCHEDULE V-A:3 -> bbl-2003:310; bbl-2003:SCHEDULE VIII -> bbl-2003:5.6.1; bbl-2003:SCHEDULE IX -> bbl-2003:5.6.1; bbl-2003:SCHEDULE XI -> bbl-2003:31; bbl-2003:SCHEDULE XII -> bbl-2003:32; ka-model-bbl-2017:CHAPTER 2 -> ka-model-bbl-2017:325; ka-model-bbl-2017:CHAPTER 2(2)(3)(ii):note_1 -> ka-model-bbl-2017:14B; ka-model-bbl-2017:CHAPTER 2(2)(3)(iii) -> ka-model-bbl-2017:45B; ka-model-bbl-2017:CHAPTER 2(2)(3)(iii) -> ka-model-bbl-2017:20A; ka-model-bbl-2017:CHAPTER 2(2)(3)(iii)(a)(b):CHAPTER 2(2)(3)(iii)(a)(b)(ii)(126)(130) -> ka-model-bbl-2017:20B; ka-model-bbl-2017:3.15.3(d)(iii) -> ka-model-bbl-2017:73; ka-model-bbl-2017:3.15.3(d)(iii) -> ka-model-bbl-2017:76; ka-model-bbl-2017:APPENDIX XII -> ka-model-bbl-2017:76F; ka-model-bbl-2017:APPENDIX XII(2) -> ka-model-bbl-2017:73; ka-model-bbl-2017:5.3.2(xiv) -> ka-model-bbl-2017:4.1.1; ka-model-bbl-2017:5.3.2(g) -> ka-model-bbl-2017:4.2.5.1; ka-model-bbl-2017:5.3.2:5.3.2(1):5.3.2:5.3.2(1)(vii) -> ka-model-bbl-2017:4.2.5.1; ka-model-bbl-2017:5.3.2:1 -> ka-model-bbl-2017:4.2.5.1; ka-model-bbl-2017:5.3.2:2_3 -> ka-model-bbl-2017:4.2.5.1; ka-model-bbl-2017:5.3.2:5.3.2(1)_6 -> ka-model-bbl-2017:4.2.5.1; ka-model-bbl-2017:5.3.2:5.3.2(1)_9 -> ka-model-bbl-2017:4.2.5.1; ka-model-bbl-2017:5.3.2:5.3.2(3)_2 -> ka-model-bbl-2017:4.2.5.1; ka-model-bbl-2017:5.3.2:5.3.2(2)_3(v) -> ka-model-bbl-2017:4.2.5.1; ka-model-bbl-2017:5.3.2:5.3.2(3)_4 -> ka-model-bbl-2017:4.2.5.1; ka-model-bbl-2017:5.3.2:5.3.2(4)_3 -> ka-model-bbl-2017:4.2.5.1; ka-model-bbl-2017:5.3.2:5.3.2(1)_14(iv) -> ka-model-bbl-2017:4.2.5.1; ka-model-bbl-2017:5.3.2:3_2 -> ka-model-bbl-2017:4.2.5.1; ka-model-bbl-2017:7.1.6 -> ka-model-bbl-2017:3.17; ka-model-bbl-2017:12.7.4 -> ka-model-bbl-2017:4.2; ka-model-bbl-2017:12.7.4 -> ka-model-bbl-2017:4.4.2.1; ka-model-bbl-2017:12.7.4 -> ka-model-bbl-2017:4.3; ka-model-bbl-2017:12.7.4 -> ka-model-bbl-2017:4.4.2.4.3; ka-model-bbl-2017:12.7.4 -> ka-model-bbl-2017:4.4.2.4.3.2; ka-model-bbl-2017:12.7.4 -> ka-model-bbl-2017:4.4.2.4.2; ka-model-bbl-2017:PART 4_5 -> ka-model-bbl-2017:4.4.2.4; ka-model-bbl-2017:PART 4_5 -> ka-model-bbl-2017:4.4.2.4.3.2; ka-model-bbl-2017:14.3.3 -> ka-model-bbl-2017:3.16; ka-model-bbl-2017:15.1.1 -> ka-model-bbl-2017:76F; ka-model-bbl-2017:15.1.2 -> ka-model-bbl-2017:3.17; ka-model-bbl-2017:15.1.2(e) -> ka-model-bbl-2017:76F; ka-model-bbl-2017:APPENDIX I -> ka-model-bbl-2017:2.123; ka-model-bbl-2017:APPENDIX II(a)(b)(c)(d)(e)(a)(b)(c)(d)(e)(f)(g)(h)(i)(j)(k)(a)(b)(c)(d)(e)(g)(h) -> ka-model-bbl-2017:3.11.3; ka-model-bbl-2017:APPENDIX II(a)(b)(c)(d)(e)(a)(b)(c)(d)(e)(f)(g)(h)(i)(j)(k)(a)(b)(c)(d)(e)(g)(h) -> ka-model-bbl-2017:3.11.4; ka-model-bbl-2017:APPENDIX XIII:2 -> ka-model-bbl-2017:64; ka-model-bbl-2017:FORM XVA -> ka-model-bbl-2017:7.1.7.2; ka-model-bbl-2017:15.07.2017 -> ka-model-bbl-2017:508; ka-model-bbl-2017:15.07.2017 -> ka-model-bbl-2017:428; ka-model-bbl-2017:15.07.2017(44) -> ka-model-bbl-2017:14B; ka-model-bbl-2017:15.07.2017(100) -> ka-model-bbl-2017:45B; ka-model-bbl-2017:15.07.2017(124) -> ka-model-bbl-2017:20A; ka-model-bbl-2017:15.07.2017:15.07.2017(b)_5:15.07.2017:15.07.2017(b)_5(ii) -> ka-model-bbl-2017:20B; ka-model-bbl-2017:FORM I_3:3.15.3(d)(iii) -> ka-model-bbl-2017:73; ka-model-bbl-2017:FORM I_3:3.15.3(d)(iii) -> ka-model-bbl-2017:76; ka-model-bbl-2017:FORM XII_2:3.16.9(2) -> ka-model-bbl-2017:73; ka-model-bbl-2017:5.3.2.3:5.3.2.3(b)(xii) -> ka-model-bbl-2017:4.1.1; ka-model-bbl-2017:5.3.2.3(5):5.3.2.3(5)(i) -> ka-model-bbl-2017:4.2.5.1; ka-model-bbl-2017:5.3.2.3(5)(ii) -> ka-model-bbl-2017:4.2.5.1; ka-model-bbl-2017:5.3.2.3(vi) -> ka-model-bbl-2017:4.2.5.1; ka-model-bbl-2017:5.3.2.3:1_4 -> ka-model-bbl-2017:4.2.5.1; ka-model-bbl-2017:5.3.2.3:1_6 -> ka-model-bbl-2017:4.2.5.1; ka-model-bbl-2017:5.3.2.3:5.3.2.3(1)_6 -> ka-model-bbl-2017:4.2.5.1; ka-model-bbl-2017:5.3.2.3:5.3.2.3(3) -> ka-model-bbl-2017:4.2.5.1; ka-model-bbl-2017:5.3.2.3:5.3.2.3(3)_3 -> ka-model-bbl-2017:4.2.5.1; ka-model-bbl-2017:5.3.2.3:1_11 -> ka-model-bbl-2017:4.2.5.1; ka-model-bbl-2017:5.3.2.3:5.3.2.3(4) -> ka-model-bbl-2017:4.2.5.1; ka-model-bbl-2017:5.3.2.3:5.3.2.3(1)_9:5.3.2.3:5.3.2.3(1)_9(iv) -> ka-model-bbl-2017:4.2.5.1; ka-model-bbl-2017:5.3.2.3:1_12 -> ka-model-bbl-2017:4.2.5.1; ka-model-bbl-2017:5.3.2.6(c) -> ka-model-bbl-2017:4.2.5.1; ka-model-bbl-2017:CHAPTER 7_2:7.1:7.1.6 -> ka-model-bbl-2017:3.17; ka-model-bbl-2017:FORM XVA_2 -> ka-model-bbl-2017:3.17; ka-model-bbl-2017:12.7:12.7.3 -> ka-model-bbl-2017:4.2; ka-model-bbl-2017:12.7:12.7.3 -> ka-model-bbl-2017:4.4.2.1; ka-model-bbl-2017:12.7:12.7.3 -> ka-model-bbl-2017:4.3; ka-model-bbl-2017:12.7:12.7.3 -> ka-model-bbl-2017:4.4.2.4.3; ka-model-bbl-2017:12.7:12.7.3 -> ka-model-bbl-2017:4.4.2.4.3.2; ka-model-bbl-2017:12.7:12.7.3 -> ka-model-bbl-2017:4.4.2.4.2; ka-model-bbl-2017:PART 4_10 -> ka-model-bbl-2017:4.4.2.4; ka-model-bbl-2017:PART 4_10 -> ka-model-bbl-2017:4.4.2.4.3.2; ka-model-bbl-2017:CHAPTER 14_2:3.11_2(i):CHAPTER 14_2:3.11_2(i)(iii) -> ka-model-bbl-2017:3.16; ka-model-bbl-2017:APPENDIX XV_2:15.1 -> ka-model-bbl-2017:76F; ka-model-bbl-2017:15.2 -> ka-model-bbl-2017:3.17; ka-model-bbl-2017:15.2(e) -> ka-model-bbl-2017:76F; ka-model-bbl-2017:APPENDIX I_2 -> ka-model-bbl-2017:2.123; ka-model-bbl-2017:APPENDIX II_2(a)(b)(c)(d)(e)(f)(a)(b)(c)(d)(e)(f)(g)(h)(i)(j)(k)(a)(b)(c)(d)(e)(f)(g)(c) -> ka-model-bbl-2017:3.11.3; ka-model-bbl-2017:APPENDIX II_2(a)(b)(c)(d)(e)(f)(a)(b)(c)(d)(e)(f)(g)(h)(i)(j)(k)(a)(b)(c)(d)(e)(f)(g)(c)(a)(b)(c)(d)(e)(f)(g)(h) -> ka-model-bbl-2017:3.11.4; ka-model-bbl-2017:APPENDIX XIII_2:4(1)(2) -> ka-model-bbl-2017:64; ka-model-bbl-2017:FORM XVA_3 -> ka-model-bbl-2017:7.1.7.2) |
| 8 | Low-confidence amendment links | WARN | 1 low-confidence link(s) |
| 9 | Drafts referenced from `in_force` clauses | PASS | 0 draft reference(s) |

## 3. Declarations Summary

- **Not Modelled**: 3
- **Known Gaps**: 2
- **Unread Documents**: 1
- **Unobtainable Documents**: 1
- **Contested Status**: 0

## 4. Stratified 30-Node Self-Check Against Rendered PDF Pages

### Document: `bbl-2003` (30 Stratified Nodes Verified Against Rendered Page Images)

| # | `eid` | Type | Page | Native No. | Page Image Dim (px @ 150 DPI) | Excerpt Verified Against Rendered Page | Result |
|---:|---|---|---:|---|---|---|---|
| 1 | `part_I__sec_1.0__cl_1.3` | `clause` | 1 | `1.3` | `1275x1651` | `These Bye-laws shall come into operation from 5 th of June 2004 .` | PASS |
| 2 | `part_I__sec_2.0__def_2.2` | `definition` | 2 | `2.2` | `1275x1651` | `'agriculture' includes horticulture, farming, growing of crops, f` | PASS |
| 3 | `part_I__sec_2.0__def_2.4` | `definition` | 2 | `2.4` | `1275x1651` | `'apartment' means a part of the property intended for any type of` | PASS |
| 4 | `part_I__sec_2.0__def_2.21` | `definition` | 3 | `2.21` | `1275x1651` | `' density' means concentration of population expressed in terms o` | PASS |
| 5 | `part_I__sec_2.0__def_2.46` | `definition` | 5 | `2.46` | `1275x1651` | `' high-rise building' means a building with ground floor plus fou` | PASS |
| 6 | `part_I__sec_2.0__def_2.60` | `definition` | 6 | `2.60` | `1275x1651` | `' parking space' means an area enclosed or unenclosed, covered or` | PASS |
| 7 | `part_I__sec_2.0__def_2.62` | `definition` | 6 | `2.62` | `1275x1651` | `' person' includes any body of persons corporate or incorporate.` | PASS |
| 8 | `part_I__sec_2.0__def_2.67` | `definition` | 7 | `2.67` | `1275x1651` | `'porch or portico' means a roof cover supported on pillars or can` | PASS |
| 9 | `part_II__sec_3.0__cl_3.2__item_j_2` | `item` | 10 | `(j)` | `1275x1651` | `in case of basement floor, position of the ramp with respect to t` | PASS |
| 10 | `part_II__sec_3.0__cl_3.2__cl_3.210.1__item_e` | `item` | 11 | `(e)` | `1275x1651` | `In case of civic amenity site, leased out by the Bangalore Develo` | PASS |
| 11 | `part_II__sec_3.0__cl_3.2_2__cl_3.210.6` | `clause` | 11 | `3.2(10.6)` | `1275x1651` | `Telecommunication Department N.O.C in case of high rise building ` | PASS |
| 12 | `part_II__sec_3.0__cl_3.8__note_3` | `note` | 14 | `—` | `1275x1651` | `(iii) If the public land is utilised for storing of excavated mat` | PASS |
| 13 | `part_II__sec_5.0__cl_5.5__item_i` | `item` | 17 | `(i)` | `1275x1651` | `The owner/builder/contractor shall during the construction, displ` | PASS |
| 14 | `part_III__sec_9.0__cl_9.2__note_1` | `note` | 25 | `1` | `1275x1651` | `The dimensions in British system if any, adopted for the dimensio` | PASS |
| 15 | `part_III__sec_9.0__cl_9.6__cl_9.6.1` | `clause` | 27 | `9.6.1` | `1275x1651` | `Where the nomenclature of a road differs from the one mentioned i` | PASS |
| 16 | `part_III__sec_15.0__cl_15.3` | `clause` | 33 | `15.3` | `1275x1651` | `For buildings within the landing and take off zones of air craft ` | PASS |
| 17 | `part_III__sec_16.0__item_a` | `item` | 35 | `(a)` | `1275x1651` | `Each off street car parking space provided for motor vehicles sha` | PASS |
| 18 | `part_III__sec_18.0__cl_18.6` | `clause` | 37 | `18.6` | `1275x1651` | `Access to the basement shall floor used other than for parking pu` | PASS |
| 19 | `part_III__sec_20.0__cl_20.4` | `clause` | 39 | `20.4` | `1275x1651` | `Mezzanine floor - (1) Not more than one mezzanine floor shall be ` | PASS |
| 20 | `part_III__sec_20.0__cl_20.4__item_10` | `item` | 40 | `(10)` | `1275x1651` | `In no case, a mezzanine floor shall be closed so as to make it li` | PASS |
| 21 | `part_III__sec_21.0__cl_21.6__item_c` | `item` | 44 | `(c)` | `1275x1651` | `Exit doorways shall open outwards i.e., away from the room. But s` | PASS |
| 22 | `sch_1-B__note_1` | `note` | 60 | `—` | `1275x1651` | `Conditions to be fulfilled:` | PASS |
| 23 | `sch_II__cl_8` | `clause` | 61 | `8` | `1275x1651` | `Affidavit and Indemnity Bond as prescribed.` | PASS |
| 24 | `sch_V-A__cl_2` | `clause` | 68 | `2` | `1275x1651` | `A note book should be maintained in the workspot and should invar` | PASS |
| 25 | `sch_1-A__tbl_1__row_2` | `table_row` | 57 | `2` | `1275x1651` | `2 / Confectionery, candies and sweets` | PASS |
| 26 | `sch_1-B__tbl_1__row_17` | `table_row` | 58 | `17` | `1275x1651` | `17 / Webbing (narrow fabrics, embroidery lace manufacturing)` | PASS |
| 27 | `sch_X__tbl_1__row_22` | `table_row` | 74 | `22` | `1275x1651` | `22 / Kengal Hanumanthaiah Road / 3 m from the edge of the road / ` | PASS |
| 28 | `sch_X__tbl_1__row_25` | `table_row` | 74 | `25` | `1275x1651` | `25 / H.Siddaiah Road / 3 m from the edge of the road / 9` | PASS |
| 29 | `sch_X__tbl_3__row_35` | `table_row` | 76 | `35` | `1275x1651` | `101 / Mysore Road / 5 m up to REMCO from the edge of the road / 1` | PASS |
| 30 | `sch_X__tbl_4__row_14` | `table_row` | 77 | `14` | `1275x1651` | `117 / Ibrahim Saheb Street / 2 m from the edge of the road / 10` | PASS |

### Document: `ka-model-bbl-2017` (30 Stratified Nodes Verified Against Rendered Page Images)

| # | `eid` | Type | Page | Native No. | Page Image Dim (px @ 150 DPI) | Excerpt Verified Against Rendered Page | Result |
|---:|---|---|---:|---|---|---|---|
| 1 | `chp_2__item_2__item_3__item_ii__note_1` | `note` | 5 | `—` | `1240x1755` | `All unsafe buildings /structure will require be restoring by repa` | PASS |
| 2 | `chp_2__item_2__item_3__def_iii__item_a__item_b__item_ii_2__def_126__def_130__def_131__def_132__def_133__def_134__def_135__def_136__def_137` | `definition` | 11 | `(137)` | `1240x1755` | `‘Road/Street Line’ means the line defining the side limits of a r` | PASS |
| 3 | `chp_2__item_2__item_3__def_iii__item_a__item_b__item_ii_2__def_126__def_130__def_131__def_132__def_133__def_134__def_135__def_136__def_137__def_138__def_139__def_140__def_141__def_142__def_143__def_144__def_145__def_146` | `definition` | 11 | `(146)` | `1240x1755` | `‘Spiral Staircase’ means a staircase forming continuous winding c` | PASS |
| 4 | `chp_3__cl_3.6__cl_3.6.4__item_a` | `item` | 13 | `(a)` | `1240x1755` | `if the site is not drained properly or is incapable of being well` | PASS |
| 5 | `app_VII__cl_3.12.1` | `clause` | 15 | `3.12.1` | `1240x1755` | `Signing the Building Plans.- All plans for submission to the Auth` | PASS |
| 6 | `part_4_2__cl_15__item_16__item_17__item_18__item_19` | `item` | 47 | `(19)` | `1240x1755` | `13935-2009 ‘Seismic Evaluation, Repair and Seismic Strengthening ` | PASS |
| 7 | `chp_9__cl_9.7__item_d` | `item` | 53 | `(d)` | `1240x1755` | `The W.C. seat shall be 500mm from the floor.` | PASS |
| 8 | `app_III__item_1__item_3__item_4__item_5__item_6__item_7__item_8__item_1__item_3__item_4__item_5__item_6__item_7__item_a__item_b__item_c` | `item` | 106 | `(c)` | `1240x1755` | `Extent to be surrendered for P and OS and CA, if ap plicable.` | PASS |
| 9 | `chp_2_2__cl_15.07.2017__def_h` | `definition` | 130 | `(h)` | `1240x1755` | `‘ Storage Building’ - means a building or part thereof used prima` | PASS |
| 10 | `chp_2_2__cl_15.07.2017__def_25` | `definition` | 131 | `(25)` | `1240x1755` | `‘Bus Terminal’ means a premise used by public transport agency to` | PASS |
| 11 | `chp_2_2__cl_15.07.2017__def_111` | `definition` | 135 | `(111)` | `1240x1755` | `‘Owner’ means a person who for the time being is receiving or is ` | PASS |
| 12 | `chp_2_2__cl_15.07.2017__def_138` | `definition` | 137 | `(138)` | `1240x1755` | `‘Road Width or Width of Road/Street’ means the right of way/dista` | PASS |
| 13 | `chp_2_2__cl_15.07.2017__def_144` | `definition` | 137 | `(144)` | `1240x1755` | `‘Site Plan’ means a detailed Plan showing the proposed placemen t` | PASS |
| 14 | `chp_3_2` | `chapter` | 138 | `CHAPTER 3` | `1240x1755` | `CHAPTER 3 3. JURISDICTION, APPLICABILITY AND PROCEDURAL REQUIREM ` | PASS |
| 15 | `chp_3_2__cl_3.10__cl_3.10.4__item_2` | `item` | 140 | `(2)` | `1240x1755` | `In case the noting of discrepancy is accepted by th e Commissione` | PASS |
| 16 | `chp_5_2__cl_5.1.2__cl_5.1.2.2` | `clause` | 148 | `5.1.2.2` | `1240x1755` | `The requirements of clause 5.1.2.1 shall apply to residential, bu` | PASS |
| 17 | `chp_5__cl_5.3__cl_5.3.2_2__cl_5.3.2.3__cl_1_6` | `clause` | 161 | `1` | `1240x1755` | `Some WCs may be of Indian style, if desired. to be decided by the` | PASS |
| 18 | `chp_5__cl_5.3__cl_5.3.2_2__cl_5.3.2.3__cl_2_5` | `clause` | 161 | `2` | `1240x1755` | `Male population may be assumed as two-third and fem ale populatio` | PASS |
| 19 | `chp_6__cl_6.4__cl_6.4.6_2` | `clause` | 171 | `6.4.6` | `1240x1755` | `Compartmentation The building shall be suitably compartmentalized` | PASS |
| 20 | `chp_10_2__cl_2` | `clause` | 184 | `2` | `1240x1755` | `The Authority shall include inspection of Rain water Harvesting S` | PASS |
| 21 | `part_4_10__cl_12.18__note_1` | `note` | 195 | `—` | `1240x1755` | `The sub-station installations shall be carried ou t in conformity` | PASS |
| 22 | `part_4_10__cl_12.28` | `clause` | 198 | `12.28` | `1240x1755` | `House keeping A high standard of housekeeping must be insisted up` | PASS |
| 23 | `chp_11__cl_11.2__cl_11.2.3_8__note_1` | `note` | 219 | `—` | `1240x1755` | `The solid waste management system and waste water m anagement sys` | PASS |
| 24 | `app_III_2__item_1__item_2__item_3__item_4__item_5__item_6__item_7` | `item` | 235 | `(7)` | `1240x1755` | `Existing and proposed width of roads abutting the p lot` | PASS |
| 25 | `chp_5__cl_5.3__cl_5.3.2__cl_4__tbl_2__row_1` | `table_row` | 34 | `1` | `1240x1755` | `viii) / Kitchen sink / 1 per floor, Min.` | PASS |
| 26 | `chp_5__cl_5.3__cl_5.3.2__cl_3_2__tbl_9__row_1` | `table_row` | 38 | `1` | `1240x1755` | `additional / per / additional / additional / For 800: 16 / For 80` | PASS |
| 27 | `chp_5__cl_5.3__cl_5.3.2_2__cl_5.3.2.3__cl_2_13__tbl_3__row_2` | `table_row` | 166 | `2` | `1240x1755` | `1000 or / addition / 1000 or / addition / For 1000: 18 / For 1000` | PASS |
| 28 | `chp_5__cl_5.3__cl_5.3.2_2__cl_5.3.2.3__cl_2_13__tbl_4` | `table` | 166 | `Table 4` | `1240x1755` | `Table 4` | PASS |
| 29 | `chp_11_2__tbl_11.1ProvisionsandapplicabilityforvariousplotsizesResidentialandNon-Residential__row_1` | `table_row` | 185 | `1` | `1240x1755` | `plot area / construction / Provisions for Residential` | PASS |
| 30 | `chp_11__cl_11.2__cl_11.2.3_8__cl_4__tbl_2__row_1` | `table_row` | 221 | `1` | `1240x1755` | `No / to D-6 (see Note 22 and / (see Note 22) / Mercantile F-1,` | PASS |

### Document: `rmp2015-zr` (30 Stratified Nodes Verified Against Rendered Page Images)

| # | `eid` | Type | Page | Native No. | Page Image Dim (px @ 150 DPI) | Excerpt Verified Against Rendered Page | Result |
|---:|---|---|---:|---|---|---|---|
| 1 | `sec_DEFINITIONS__cl_6` | `clause` | 3 | `6` | `1275x1651` | `is a premise in which rooms are let out on a long term basis as c` | PASS |
| 2 | `chp_2__note_1` | `note` | 12 | `—` | `1275x1651` | `When service apartments are permitted, fee under section 18 of KT` | PASS |
| 3 | `chp_4__cl_4.1` | `clause` | 28 | `4.1` | `1275x1651` | `RESIDENTIAL (MAIN)` | PASS |
| 4 | `chp_4__cl_4.3__cl_4.3.2__item_i` | `item` | 31 | `(i)` | `1275x1651` | ` Main Land use category: C4  Other land uses permissible (as ma` | PASS |
| 5 | `chp_4__cl_4.8__cl_4.8.2` | `clause` | 36 | `4.8.2` | `1275x1651` | `Regulations` | PASS |
| 6 | `chp_4__cl_4.8__cl_4.8.2__item_b` | `item` | 36 | `(b)` | `1275x1651` | `TDR is applicable as per rules.` | PASS |
| 7 | `chp_4__cl_4.10__cl_4.10.1` | `clause` | 38 | `4.10.1` | `1275x1651` | `Description Transportation zones are reserved for Transport and T` | PASS |
| 8 | `chp_4__cl_4.11__cl_4.11.2__def_1` | `definition` | 39 | `1` | `1275x1651` | `The buffer created for accommodating the utilities such as Power,` | PASS |
| 9 | `chp_4__cl_4.11__cl_4.11.2__cl_4` | `clause` | 39 | `4` | `1275x1651` | `For electrical networks, KPTCL standards are followed.` | PASS |
| 10 | `chp_4__cl_4.13__cl_4.13.2__item_i__item_ii` | `item` | 41 | `(ii)` | `1275x1651` | ` 20 % of the sital area of the land may be used for educational ` | PASS |
| 11 | `chp_5__cl_5.1__item_i` | `item` | 43 | `(i)` | `1275x1651` | `These are identified areas which require detailed planning and de` | PASS |
| 12 | `chp_5__cl_5.2` | `clause` | 43 | `5.2` | `1275x1651` | `The Co-ordinated planning schemes are the zones where the BDA int` | PASS |
| 13 | `chp_6__cl_6.1` | `clause` | 44 | `6.1` | `1275x1651` | `RESIDENTIAL a. Road widths: The minimum width of road shall not b` | PASS |
| 14 | `chp_6__cl_6.1__item_c` | `item` | 44 | `(c)` | `1275x1651` | `Parks / Open spaces and Playgrounds shall not be less than 15 % o` | PASS |
| 15 | `chp_8__note_1` | `note` | 49 | `—` | `1275x1651` | `Additional parking for part area shall be provided when the part ` | PASS |
| 16 | `chp_8__cl_8.1__item_a__item_i` | `item` | 50 | `(i)` | `1275x1651` | `Parking provided on the ground floor with the building on stilts,` | PASS |
| 17 | `chp_9__cl_9.2__cl_1` | `clause` | 51 | `1` | `1275x1651` | `22.5mtrs.` | PASS |
| 18 | `chp_9__cl_9.2__note_1` | `note` | 52 | `—` | `1275x1651` | `The travel distance to an exit from the dead end of a corridor sh` | PASS |
| 19 | `chp_10__cl_10.1__cl_15` | `clause` | 56 | `15` | `1275x1651` | `The Authority may charge a fee of Rupees one hundred for grant / ` | PASS |
| 20 | `chp_10__cl_10.1__cl_18` | `clause` | 56 | `18` | `1275x1651` | `The Authority may reject or cancel the grant of D.R.C. in the fol` | PASS |
| 21 | `app_VIII__item_1__item_a__item_b` | `item` | 69 | `(b)` | `1275x1651` | `Land handed over the Authority / Govt. Vide Possession Receipt No` | PASS |
| 22 | `chp_2__tbl_5__row_2` | `table_row` | 13 | `2` | `1651x1275` | `2 / Warehouses and storage areas for goods` | PASS |
| 23 | `chp_2__tbl_11__row_1` | `table_row` | 15 | `1` | `1651x1275` | `1) Food products / 5) Other works such as` | PASS |
| 24 | `chp_2__cl_13__tbl_1` | `table` | 17 | `Table 1` | `1651x1275` | `Table 1` | PASS |
| 25 | `chp_2__cl_13__tbl_2` | `table` | 17 | `Table 2` | `1651x1275` | `Table 2` | PASS |
| 26 | `chp_2__cl_13__tbl_5__row_2` | `table_row` | 18 | `2` | `1651x1275` | `2 / Police stations, post offices` | PASS |
| 27 | `chp_7__cl_7.1__cl_5__tbl_3__row_1` | `table_row` | 48 | `1` | `1275x1651` | `Above 18m < 24m / 55% / 2.5` | PASS |
| 28 | `app_1__tbl_1__row_12` | `table_row` | 58 | `12` | `1275x1651` | `12. / Triveni Road, Yashwanthpur / 12.0 mbeyond C.M.T.I Quarter r` | PASS |
| 29 | `app_1__tbl_1__row_30` | `table_row` | 58 | `30` | `1275x1651` | `30. / Brigade road / 3.0 mfrom the edge of the road` | PASS |
| 30 | `app_1__tbl_2__row_5` | `table_row` | 59 | `5` | `1275x1651` | `44. / Narasimharaja road / 3.0 mfrom the edge of the road` | PASS |

## 5. Applied Amendment Effect Verification (Page-Image Self-Check)

| # | Effect ID | Amending Doc & EID | Source Page & Image Dim (150 DPI) | Target Doc & EID | Action | Valid From | Applied | Resulting Consolidated / Unapplied Note | Result |
|---:|---|---|---|---|---|---|---|---|---|
| 1 | `rmp2015-zr:eff_1` | `rmp2015-zr:chp_3__cl_3.1` | p. 20 (`1275x1651`) | `bbl-2003:part_III__sec_9.0__cl_9.2` | `substitute` | `2007-06-25` | `Yes` | `Exterior open spaces / setbacks, coverage, floor area ratio, numbers o` | PASS |
| 2 | `rmp2015-zr:eff_2` | `rmp2015-zr:chp_3__cl_3.1` | p. 20 (`1275x1651`) | `bbl-2003:part_III__sec_9.0__cl_9.3__cl_9.3.1` | `substitute` | `2007-06-25` | `Yes` | `In the case of high-rise buildings (11.5 m height and above), the mini` | PASS |
| 3 | `rmp2015-zr:eff_3` | `rmp2015-zr:chp_1__cl_1.2` | p. 10 (`1275x1651`) | `bbl-2003:part_III__sec_9.0__cl_9.10__cl_9.10.1` | `substitute` | `2007-06-25` | `Yes` | `Under Revised Master Plan 2015 Volume III Zoning Regulations (effectiv` | PASS |
| 4 | `rmp2015-zr:eff_4` | `rmp2015-zr:chp_8` | p. 49 (`1275x1651`) | `bbl-2003:part_III__sec_16.0` | `substitute` | `2007-06-25` | `Yes` | `Adequate space for the parking of vehicles shall be provided in the si` | PASS |
| 5 | `rmp2015-zr:eff_5` | `rmp2015-zr:chp_9__cl_9.3` | p. 52 (`1275x1651`) | `bbl-2003:part_IV__sec_30.0` | `modify_text` | `2007-06-25` | `Yes` | `Buildings with ground plus three floors and above or height of 11.5 m ` | PASS |
| 6 | `ka-model-bbl-2017:eff_6` | `ka-model-bbl-2017:chp_2__item_2__item_3` | p. 2 (`1240x1755`) | `bbl-2003:part_I__sec_1.0__cl_1.3` | `insert_after` | `2017-10-28` | `Yes` | `Pursuant to Clause 1(3) of Notification No. UDD 14 TTP 2017 (P-4) date` | PASS |
| 7 | `ka-model-bbl-2017:eff_7` | `ka-model-bbl-2017:chp_1` | p. 2 (`1240x1755`) | `bbl-2003:part_II__sec_3.0` | `modify_text` | `2017-10-28` | `No` | `Karnataka Municipal Corporations Model Building Bye-Laws, 2017 (Notifi` | PASS |
| 8 | `udd-1107-mnu-2018-draft:eff_8` | `udd-1107-mnu-2018-draft:cl_4` | p. 5 (`1240x1765`) | `bbl-2003:part_II__sec_4.0` | `modify_text` | `2018-11-28` | `No` | `Amending instrument 'udd-1107-mnu-2018-draft' has status 'draft'.` | PASS |
| 9 | `becc-bbl-amend-2026-05:eff_9` | `becc-bbl-amend-2026-05:part_III__cl_2` | p. 2 (`1275x1651`) | `bbl-2003:part_II__sec_3.0__cl_3.8` | `omit` | `2026-05-14` | `Yes` | `Applied` | PASS |
| 10 | `becc-bbl-amend-2026-05:eff_10` | `becc-bbl-amend-2026-05:part_III__cl_2` | p. 2 (`1275x1651`) | `bbl-2003:part_II__sec_3.0__cl_3.9` | `omit` | `2026-05-14` | `Yes` | `Applied` | PASS |
| 11 | `becc-bbl-amend-2026-05:eff_11` | `becc-bbl-amend-2026-05:part_III__cl_2` | p. 2 (`1275x1651`) | `bbl-2003:part_II__sec_3.0__cl_3.10` | `omit` | `2026-05-14` | `Yes` | `Applied` | PASS |
| 12 | `becc-bbl-amend-2026-05:eff_12` | `becc-bbl-amend-2026-05:part_III__cl_3` | p. 2 (`1275x1651`) | `bbl-2003:part_II__sec_6.0__item_i` | `substitute` | `2026-05-14` | `Yes` | `(i) Wherever any construction is in violation/deviation of the sanctio` | PASS |

## 6. Annotation Quality Summary (`08b` §2)

| Document | Definitions Found | Rejected Stopword/Unquoted Terms | Term Uses per Provision (Median / Max) | References (Resolved / External / Unresolved) | Provision Types by Kind |
|---|---:|---:|---|---|---|
| `bbl-2003` | 82 | 0 | `1.0` / `8` | `121` / `8` / `30` | `commencement`: 14, `definition`: 90, `exception`: 3, `fee`: 9, `obligation`: 221, `permission`: 21, `prohibition`: 59, `scope`: 15 |
| `becc-bbl-amend-2026-04-draft` | 0 | 0 | `0.0` / `0` | `1` / `1` / `14` | `commencement`: 2, `fee`: 1, `obligation`: 8, `prohibition`: 2 |
| `becc-bbl-amend-2026-05` | 0 | 0 | `0.0` / `0` | `0` / `2` / `16` | `commencement`: 2, `fee`: 2, `obligation`: 8, `prohibition`: 1 |
| `ka-model-bbl-2017` | 177 | 0 | `2.0` / `50` | `602` / `22` / `192` | `commencement`: 35, `definition`: 184, `exception`: 28, `fee`: 8, `obligation`: 1127, `permission`: 19, `prohibition`: 173, `scope`: 20 |
| `rmp2015-zr` | 1 | 0 | `1.0` / `1` | `155` / `3` / `4` | `definition`: 1, `exception`: 1, `obligation`: 68, `permission`: 12, `prohibition`: 25, `scope`: 5 |
| `udd-1107-mnu-2018-draft` | 0 | 0 | `0.0` / `0` | `3` / `2` / `3` | `commencement`: 2, `fee`: 2, `obligation`: 1 |
