# Quality Assurance Report — `in-ka-bengaluru-south` (Bengaluru South City Corporation)

## 1. Schema v1.3 Validation

- `data/raw/in-ka-bengaluru-south/bbl-2003.meta.json` against `document.schema.json`: PASS
- `data/raw/in-ka-bengaluru-south/ka-model-bbl-2017.meta.json` against `document.schema.json`: PASS
- `data/raw/in-ka-bengaluru-south/rmp2015-zr.meta.json` against `document.schema.json`: PASS
- `data/raw/in-ka-bengaluru-south/rmp2015-zr-amend-2009-03.meta.json` against `document.schema.json`: PASS
- `data/raw/in-ka-bengaluru-south/rmp2015-zr-amend-2015-03.meta.json` against `document.schema.json`: PASS
- `data/raw/in-ka-bengaluru-south/rmp2015-zr-amend-2018-09.meta.json` against `document.schema.json`: PASS
- `data/raw/in-ka-bengaluru-south/rmp2015-zr-amend-2019-06.meta.json` against `document.schema.json`: PASS
- `data/raw/in-ka-bengaluru-south/rmp2015-zr-comp-2024-10-kn.meta.json` against `document.schema.json`: PASS
- `data/raw/in-ka-bengaluru-south/rmp2015-zr-amend-2025-02.meta.json` against `document.schema.json`: PASS
- `data/raw/in-ka-bengaluru-south/rmp2015-zr-amend-2026-01.meta.json` against `document.schema.json`: PASS
- `register:rmp2015-zr-amend-2025-07` (not_found) against `document.schema.json`: PASS
- `register:bscc-bbl-amend-2026` (not_found) against `document.schema.json`: PASS
- `data/raw/in-ka-bengaluru-south/udd-1107-mnu-2018-draft.meta.json` against `document.schema.json`: PASS
- `data/raw/in-ka-bengaluru-south/rmp2015-pd-index.meta.json` against `document.schema.json`: PASS
- `data/raw/in-ka-bengaluru-south/rmp2015-plu-pd-210.meta.json` against `document.schema.json`: PASS
- `data/processed/in-ka-bengaluru-south/documents/bbl-2003.clauses.json` against `clause-tree.schema.json`: PASS
- `data/processed/in-ka-bengaluru-south/documents/bbl-2003.annotations.json` against `annotations.schema.json`: PASS
- `data/processed/in-ka-bengaluru-south/documents/ka-model-bbl-2017.clauses.json` against `clause-tree.schema.json`: PASS
- `data/processed/in-ka-bengaluru-south/documents/ka-model-bbl-2017.annotations.json` against `annotations.schema.json`: PASS
- `data/processed/in-ka-bengaluru-south/documents/rmp2015-zr.clauses.json` against `clause-tree.schema.json`: PASS
- `data/processed/in-ka-bengaluru-south/documents/rmp2015-zr.annotations.json` against `annotations.schema.json`: PASS
- `data/processed/in-ka-bengaluru-south/documents/udd-1107-mnu-2018-draft.clauses.json` against `clause-tree.schema.json`: PASS
- `data/processed/in-ka-bengaluru-south/documents/udd-1107-mnu-2018-draft.annotations.json` against `annotations.schema.json`: PASS
- `data/processed/in-ka-bengaluru-south/amendments.json` against `amendments.schema.json`: PASS
- `data/processed/in-ka-bengaluru-south/consolidated.json` against `consolidated.schema.json`: PASS
- `data/processed/in-ka-bengaluru-south/zones.geojson` against `zones.schema.json`: PASS
- `data/processed/in-ka-bengaluru-south/geo-layers.json` against `geo-layers.schema.json`: PASS
- `data/processed/in-ka-bengaluru-south/clause-zone-tags.json` against `clause-zone-tags.schema.json`: PASS
- `data/processed/in-ka-bengaluru-south/declarations.json` against `declarations.schema.json`: PASS

## 2. QA Checks Executed

| # | Check | Status | Details |
|---|---|---|---|
| 1 | Clause `legal_status` present & valid | PASS | 5501/5501 valid |
| 2 | Clause citation page >= 1 | PASS | 5501/5501 valid |
| 3 | Citation bounding box (`bbox`) coverage | PASS | 5710/5710 citations (100.0%) have bbox (>= 95% threshold) |
| 4 | Clause numbering continuity (with source page citations) | PASS | Duplicates: 0; Source-native gaps: 27 (bbl-2003: bbl-2003:3.0.missing [11] (source p. 15); bbl-2003: bbl-2003:4.0.missing [2, 3] (source p. 15, p. 16); bbl-2003: bbl-2003:9.10.missing [3] (source p. 28); bbl-2003: bbl-2003:10.0.missing [3] (source p. 29); bbl-2003: bbl-2003:11.0.missing [4] (source p. 30); bbl-2003: bbl-2003:SCHEDULE I:1.2.missing [7] (source p. 54); bbl-2003: bbl-2003:SCHEDULE XIII.missing [2, 3] (source p. 82, p. 83); ka-model-bbl-2017: ka-model-bbl-2017:APPENDIX VII.missing [3, 4] (source p. 15); ka-model-bbl-2017: ka-model-bbl-2017:CHAPTER 5.missing [15] (source p. 23); ka-model-bbl-2017: ka-model-bbl-2017:5.2.3.missing [2] (source p. 24); ka-model-bbl-2017: ka-model-bbl-2017:5.2.4.missing [3, 4] (source p. 25, p. 26); ka-model-bbl-2017: ka-model-bbl-2017:CHAPTER 10.missing [3] (source p. 54); ka-model-bbl-2017: ka-model-bbl-2017:PART 4_5.missing [15] (source p. 64); ka-model-bbl-2017: ka-model-bbl-2017:CHAPTER 13.missing [3, 4, 5, 6, 7, 8, 9] (source p. 1, p. 71, p. 76); ka-model-bbl-2017: ka-model-bbl-2017:14.2.missing [4] (source p. 78); ka-model-bbl-2017: ka-model-bbl-2017:14.3.1.missing [2, 3] (source p. 78); ka-model-bbl-2017: ka-model-bbl-2017:11.2:11.2.3_3.missing [5, 6, 7, 8, 9, 11, 24] (source p. 1, p. 89, p. 95); ka-model-bbl-2017: ka-model-bbl-2017:3.11.missing [3, 4] (source p. 141); ka-model-bbl-2017: ka-model-bbl-2017:CHAPTER 5_2.missing [15] (source p. 150); ka-model-bbl-2017: ka-model-bbl-2017:9.3:9.3.1.missing [2] (source p. 179); ka-model-bbl-2017: ka-model-bbl-2017:CHAPTER 10_2.missing [8, 9] (source p. 182, p. 184); ka-model-bbl-2017: ka-model-bbl-2017:CHAPTER 13_2.missing [5, 6, 7, 8, 9] (source p. 1, p. 201, p. 204); ka-model-bbl-2017: ka-model-bbl-2017:11.2:11.2.3_7.missing [5, 6, 7, 8, 9, 11, 24] (source p. 1, p. 218, p. 223, p. 224); ka-model-bbl-2017: ka-model-bbl-2017:ANNEXURE C_2.missing [6, 7, 8, 9, 10, 11, 12, 13, 14, 19, 20] (source p. 1, p. 225, p. 226); rmp2015-zr: rmp2015-zr:CHAPTER 3.missing [3] (source p. 21); rmp2015-zr: rmp2015-zr:10.1.missing [10] (source p. 55); udd-1107-mnu-2018-draft: top-level missing [5, 7] (source p. 5, p. 6)) |
| 5 | Clauses with empty text | PASS | 0 empty clause(s) |
| 6 | Page text character coverage (>= 98%) & known gaps | PASS | Page text coverage: `bbl-2003`: 99.1% (169825/171419 content chars); `ka-model-bbl-2017`: 99.2% (943869/951754 content chars); `rmp2015-zr`: 98.7% (105021/106414 content chars); `udd-1107-mnu-2018-draft`: 100.0% (13745/13370 content chars); 2 known gap(s) recorded in `declarations.json` |
| 7 | Unresolved cross-references | WARN | 99 unresolved (bbl-2003:preamble -> bbl-2003:428; bbl-2003:3.2(10.1)(b) -> bbl-2003:17; bbl-2003:5.6(a) -> bbl-2003:300; bbl-2003:7.1(j) -> bbl-2003:95; bbl-2003:7.1:note_1 -> bbl-2003:354; bbl-2003:7.3 -> bbl-2003:17; bbl-2003:15.4(i)(iii) -> bbl-2003:9.10.3; bbl-2003:20.3(a) -> bbl-2003:20.11.3; bbl-2003:32.0(b) -> bbl-2003:32; bbl-2003:32.0(c) -> bbl-2003:32; bbl-2003:SCHEDULE II -> bbl-2003:299; bbl-2003:SCHEDULE III -> bbl-2003:3.2.11; bbl-2003:SCHEDULE V-A:3 -> bbl-2003:310; bbl-2003:SCHEDULE VIII -> bbl-2003:5.6.1; bbl-2003:SCHEDULE IX -> bbl-2003:5.6.1; bbl-2003:SCHEDULE XI -> bbl-2003:31; bbl-2003:SCHEDULE XII -> bbl-2003:32; ka-model-bbl-2017:CHAPTER 2 -> ka-model-bbl-2017:325; ka-model-bbl-2017:CHAPTER 2(2)(3)(ii):note_1 -> ka-model-bbl-2017:14B; ka-model-bbl-2017:CHAPTER 2(2)(3)(iii) -> ka-model-bbl-2017:45B; ka-model-bbl-2017:CHAPTER 2(2)(3)(iii) -> ka-model-bbl-2017:20A; ka-model-bbl-2017:CHAPTER 2(2)(3)(iii)(a)(b):CHAPTER 2(2)(3)(iii)(a)(b)(ii)(126)(130) -> ka-model-bbl-2017:20B; ka-model-bbl-2017:3.15.3(d)(iii) -> ka-model-bbl-2017:73; ka-model-bbl-2017:3.15.3(d)(iii) -> ka-model-bbl-2017:76; ka-model-bbl-2017:APPENDIX XII -> ka-model-bbl-2017:76F; ka-model-bbl-2017:APPENDIX XII(2) -> ka-model-bbl-2017:73; ka-model-bbl-2017:5.3.2(xiv) -> ka-model-bbl-2017:4.1.1; ka-model-bbl-2017:5.3.2(g) -> ka-model-bbl-2017:4.2.5.1; ka-model-bbl-2017:5.3.2:5.3.2(1):5.3.2:5.3.2(1)(vii) -> ka-model-bbl-2017:4.2.5.1; ka-model-bbl-2017:5.3.2:1 -> ka-model-bbl-2017:4.2.5.1; ka-model-bbl-2017:5.3.2:2_3 -> ka-model-bbl-2017:4.2.5.1; ka-model-bbl-2017:5.3.2:5.3.2(1)_6 -> ka-model-bbl-2017:4.2.5.1; ka-model-bbl-2017:5.3.2:5.3.2(1)_9 -> ka-model-bbl-2017:4.2.5.1; ka-model-bbl-2017:5.3.2:5.3.2(3)_2 -> ka-model-bbl-2017:4.2.5.1; ka-model-bbl-2017:5.3.2:5.3.2(2)_3(v) -> ka-model-bbl-2017:4.2.5.1; ka-model-bbl-2017:5.3.2:5.3.2(3)_4 -> ka-model-bbl-2017:4.2.5.1; ka-model-bbl-2017:5.3.2:5.3.2(4)_3 -> ka-model-bbl-2017:4.2.5.1; ka-model-bbl-2017:5.3.2:5.3.2(1)_14(iv) -> ka-model-bbl-2017:4.2.5.1; ka-model-bbl-2017:5.3.2:3_2 -> ka-model-bbl-2017:4.2.5.1; ka-model-bbl-2017:7.1.6 -> ka-model-bbl-2017:3.17; ka-model-bbl-2017:12.7.4 -> ka-model-bbl-2017:4.2; ka-model-bbl-2017:12.7.4 -> ka-model-bbl-2017:4.4.2.1; ka-model-bbl-2017:12.7.4 -> ka-model-bbl-2017:4.3; ka-model-bbl-2017:12.7.4 -> ka-model-bbl-2017:4.4.2.4.3; ka-model-bbl-2017:12.7.4 -> ka-model-bbl-2017:4.4.2.4.3.2; ka-model-bbl-2017:12.7.4 -> ka-model-bbl-2017:4.4.2.4.2; ka-model-bbl-2017:PART 4_5 -> ka-model-bbl-2017:4.4.2.4; ka-model-bbl-2017:PART 4_5 -> ka-model-bbl-2017:4.4.2.4.3.2; ka-model-bbl-2017:14.3.3 -> ka-model-bbl-2017:3.16; ka-model-bbl-2017:15.1.1 -> ka-model-bbl-2017:76F; ka-model-bbl-2017:15.1.2 -> ka-model-bbl-2017:3.17; ka-model-bbl-2017:15.1.2(e) -> ka-model-bbl-2017:76F; ka-model-bbl-2017:APPENDIX I -> ka-model-bbl-2017:2.123; ka-model-bbl-2017:APPENDIX II(a)(b)(c)(d)(e)(a)(b)(c)(d)(e)(f)(g)(h)(i)(j)(k)(a)(b)(c)(d)(e)(g)(h) -> ka-model-bbl-2017:3.11.3; ka-model-bbl-2017:APPENDIX II(a)(b)(c)(d)(e)(a)(b)(c)(d)(e)(f)(g)(h)(i)(j)(k)(a)(b)(c)(d)(e)(g)(h) -> ka-model-bbl-2017:3.11.4; ka-model-bbl-2017:APPENDIX XIII:2 -> ka-model-bbl-2017:64; ka-model-bbl-2017:FORM XVA -> ka-model-bbl-2017:7.1.7.2; ka-model-bbl-2017:15.07.2017 -> ka-model-bbl-2017:508; ka-model-bbl-2017:15.07.2017 -> ka-model-bbl-2017:428; ka-model-bbl-2017:15.07.2017(44) -> ka-model-bbl-2017:14B; ka-model-bbl-2017:15.07.2017(100) -> ka-model-bbl-2017:45B; ka-model-bbl-2017:15.07.2017(124) -> ka-model-bbl-2017:20A; ka-model-bbl-2017:15.07.2017:15.07.2017(b)_5:15.07.2017:15.07.2017(b)_5(ii) -> ka-model-bbl-2017:20B; ka-model-bbl-2017:FORM I_3:3.15.3(d)(iii) -> ka-model-bbl-2017:73; ka-model-bbl-2017:FORM I_3:3.15.3(d)(iii) -> ka-model-bbl-2017:76; ka-model-bbl-2017:FORM XII_2:3.16.9(2) -> ka-model-bbl-2017:73; ka-model-bbl-2017:5.3.2.3:5.3.2.3(b)(xii) -> ka-model-bbl-2017:4.1.1; ka-model-bbl-2017:5.3.2.3(5):5.3.2.3(5)(i) -> ka-model-bbl-2017:4.2.5.1; ka-model-bbl-2017:5.3.2.3(5)(ii) -> ka-model-bbl-2017:4.2.5.1; ka-model-bbl-2017:5.3.2.3(vi) -> ka-model-bbl-2017:4.2.5.1; ka-model-bbl-2017:5.3.2.3:1_4 -> ka-model-bbl-2017:4.2.5.1; ka-model-bbl-2017:5.3.2.3:1_6 -> ka-model-bbl-2017:4.2.5.1; ka-model-bbl-2017:5.3.2.3:5.3.2.3(1)_6 -> ka-model-bbl-2017:4.2.5.1; ka-model-bbl-2017:5.3.2.3:5.3.2.3(3) -> ka-model-bbl-2017:4.2.5.1; ka-model-bbl-2017:5.3.2.3:5.3.2.3(3)_3 -> ka-model-bbl-2017:4.2.5.1; ka-model-bbl-2017:5.3.2.3:1_11 -> ka-model-bbl-2017:4.2.5.1; ka-model-bbl-2017:5.3.2.3:5.3.2.3(4) -> ka-model-bbl-2017:4.2.5.1; ka-model-bbl-2017:5.3.2.3:5.3.2.3(1)_9:5.3.2.3:5.3.2.3(1)_9(iv) -> ka-model-bbl-2017:4.2.5.1; ka-model-bbl-2017:5.3.2.3:1_12 -> ka-model-bbl-2017:4.2.5.1; ka-model-bbl-2017:5.3.2.6(c) -> ka-model-bbl-2017:4.2.5.1; ka-model-bbl-2017:CHAPTER 7_2:7.1:7.1.6 -> ka-model-bbl-2017:3.17; ka-model-bbl-2017:FORM XVA_2 -> ka-model-bbl-2017:3.17; ka-model-bbl-2017:12.7:12.7.3 -> ka-model-bbl-2017:4.2; ka-model-bbl-2017:12.7:12.7.3 -> ka-model-bbl-2017:4.4.2.1; ka-model-bbl-2017:12.7:12.7.3 -> ka-model-bbl-2017:4.3; ka-model-bbl-2017:12.7:12.7.3 -> ka-model-bbl-2017:4.4.2.4.3; ka-model-bbl-2017:12.7:12.7.3 -> ka-model-bbl-2017:4.4.2.4.3.2; ka-model-bbl-2017:12.7:12.7.3 -> ka-model-bbl-2017:4.4.2.4.2; ka-model-bbl-2017:PART 4_10 -> ka-model-bbl-2017:4.4.2.4; ka-model-bbl-2017:PART 4_10 -> ka-model-bbl-2017:4.4.2.4.3.2; ka-model-bbl-2017:CHAPTER 14_2:3.11_2(i):CHAPTER 14_2:3.11_2(i)(iii) -> ka-model-bbl-2017:3.16; ka-model-bbl-2017:APPENDIX XV_2:15.1 -> ka-model-bbl-2017:76F; ka-model-bbl-2017:15.2 -> ka-model-bbl-2017:3.17; ka-model-bbl-2017:15.2(e) -> ka-model-bbl-2017:76F; ka-model-bbl-2017:APPENDIX I_2 -> ka-model-bbl-2017:2.123; ka-model-bbl-2017:APPENDIX II_2(a)(b)(c)(d)(e)(f)(a)(b)(c)(d)(e)(f)(g)(h)(i)(j)(k)(a)(b)(c)(d)(e)(f)(g)(c) -> ka-model-bbl-2017:3.11.3; ka-model-bbl-2017:APPENDIX II_2(a)(b)(c)(d)(e)(f)(a)(b)(c)(d)(e)(f)(g)(h)(i)(j)(k)(a)(b)(c)(d)(e)(f)(g)(c)(a)(b)(c)(d)(e)(f)(g)(h) -> ka-model-bbl-2017:3.11.4; ka-model-bbl-2017:APPENDIX XIII_2:4(1)(2) -> ka-model-bbl-2017:64; ka-model-bbl-2017:FORM XVA_3 -> ka-model-bbl-2017:7.1.7.2) |
| 8 | Low-confidence amendment links | WARN | 1 low-confidence link(s) |
| 9 | Drafts referenced from `in_force` clauses | PASS | 0 draft reference(s) |

## 3. Declarations Summary

- **Not Modelled**: 3
- **Known Gaps**: 2
- **Unread Documents**: 1
- **Unobtainable Documents**: 2
- **Contested Status**: 0

## 4. Stratified 30-Node Self-Check Against Rendered PDF Pages

### Document: `bbl-2003` (30 Stratified Nodes Verified Against Rendered Page Images)

| # | `eid` | Type | Page | Native No. | Page Image Dim (px @ 150 DPI) | Excerpt Verified Against Rendered Page | Result |
|---:|---|---|---:|---|---|---|---|
| 1 | `part_I__sec_1.0__cl_1.3` | `clause` | 1 | `1.3` | `1275x1651` | `These Bye-laws shall come into operation from 5 th of June 2004 .` | PASS |
| 2 | `part_I__sec_2.0__def_2.11` | `definition` | 2 | `2.11` | `1275x1651` | `'building line' means the line upto which the plinth of buildings` | PASS |
| 3 | `part_I__sec_2.0__def_2.15__item_c` | `item` | 3 | `(c)` | `1275x1651` | `any such 'common' or 'dividing' wall shall be considered for the ` | PASS |
| 4 | `part_I__sec_2.0__def_2.19__item_a` | `item` | 3 | `(a)` | `1275x1651` | `court yard at the ground level, garden, rocky area, well and well` | PASS |
| 5 | `part_I__sec_2.0__def_2.20` | `definition` | 3 | `2.20` | `1275x1651` | `' cross wall' means an internal wall within the building upto the` | PASS |
| 6 | `part_I__sec_2.0__def_2.28` | `definition` | 4 | `2.28` | `1275x1651` | `' exit' means a passage, channel or means of egress from any floo` | PASS |
| 7 | `part_I__sec_2.0__def_2.46` | `definition` | 5 | `2.46` | `1275x1651` | `' high-rise building' means a building with ground floor plus fou` | PASS |
| 8 | `part_I__sec_2.0__def_2.78` | `definition` | 7 | `2.78` | `1275x1651` | `' storey' means the space between the surface of one floor and th` | PASS |
| 9 | `part_II` | `part` | 9 | `PART II` | `1275x1651` | `PART II ADMINISTRATION` | PASS |
| 10 | `part_II__sec_3.0__cl_3.2__item_b_2` | `item` | 10 | `(b)` | `1275x1651` | `use or occupancy of all parts of the building;` | PASS |
| 11 | `part_II__sec_3.0__cl_3.2__item_j_2` | `item` | 10 | `(j)` | `1275x1651` | `in case of basement floor, position of the ramp with respect to t` | PASS |
| 12 | `part_II__sec_3.0__cl_3.9` | `clause` | 14 | `3.9` | `1275x1651` | `High rise buildings are not exempted from payment of ground rent ` | PASS |
| 13 | `part_II__sec_5.0__cl_5.6__def_b` | `definition` | 17 | `(b)` | `1275x1651` | `Physical inspection means the Authority shall find out whether th` | PASS |
| 14 | `part_III__sec_9.0__cl_9.2__note_3` | `note` | 25 | `3` | `1275x1651` | `(a) The front and rear set backs shall be with reference to the d` | PASS |
| 15 | `part_III__sec_9.0__cl_9.10__cl_9.10.1__note_3` | `note` | 28 | `—` | `1275x1651` | `(3) When two sides of the same road are included in two different` | PASS |
| 16 | `part_III__sec_9.0__cl_9.10__cl_9.10.2__note_1` | `note` | 28 | `—` | `1275x1651` | `One penthouse only is permissible for a building. The area of the` | PASS |
| 17 | `part_III__sec_14__cl_14.3` | `clause` | 33 | `14.3` | `1275x1651` | `Balcony - The projection of the balcony shall be measured perpend` | PASS |
| 18 | `part_III__sec_20.0__cl_20.6__item_c` | `item` | 40 | `(c)` | `1275x1651` | `Assembly building like auditoria, theatres and cinemas 1.5 mtr.` | PASS |
| 19 | `part_III__sec_21.0__cl_21.1__cl_21.1.3` | `clause` | 42 | `21.1.3` | `1275x1651` | `All exits shall be free of obstructions.` | PASS |
| 20 | `part_III__sec_21.0__cl_21.1__def_21.1.9` | `definition` | 42 | `21.1.9` | `1275x1651` | `All exits shall provide continuous means of egress to the exterio` | PASS |
| 21 | `part_IV__sec_28.0__cl_28.2` | `clause` | 48 | `28.2` | `1275x1651` | `The Authority may approve any such alternative, provided it is fo` | PASS |
| 22 | `sch_I__cl_1.2__cl_1.2.8__cl_1.2.8.1` | `clause` | 55 | `1.2.8.1` | `1275x1651` | `Uses that are permissible - Sports grounds, stadium, playgrounds,` | PASS |
| 23 | `sch_IV__item_i__item_i_2` | `item` | 65 | `(i)` | `1275x1651` | `All plans and related information with necessary certificates con` | PASS |
| 24 | `sch_XI` | `schedule` | 78 | `SCHEDULE XI` | `1275x1651` | `(Bye-law 31) Facilities for physically handicapped persons` | PASS |
| 25 | `part_III__sec_8.0__cl_8.4__tbl_1` | `table` | 20 | `Table 1` | `1275x1651` | `Table 1` | PASS |
| 26 | `part_III__sec_17.0__tbl_1__row_12` | `table_row` | 36 | `12` | `1275x1651` | `11 / Kalyana mandiras / 10 sq.mtr. of auditorium floor area` | PASS |
| 27 | `part_III__sec_21.0__cl_21.5__tbl_2__row_1` | `table_row` | 43 | `1` | `1275x1651` | `1 / Residential / 25 / 50 / 75` | PASS |
| 28 | `sch_1-A__tbl_1__row_31` | `table_row` | 57 | `31` | `1275x1651` | `31 / STD/ISD counters` | PASS |
| 29 | `sch_1-B__tbl_1__row_28` | `table_row` | 58 | `28` | `1275x1651` | `28 / Cards board box and paper products including paper` | PASS |
| 30 | `sch_X__tbl_4__row_24` | `table_row` | 77 | `24` | `1275x1651` | `127 / Gavipuram Guttahalli Main Rd / 2 m from the edge of the roa` | PASS |

### Document: `ka-model-bbl-2017` (30 Stratified Nodes Verified Against Rendered Page Images)

| # | `eid` | Type | Page | Native No. | Page Image Dim (px @ 150 DPI) | Excerpt Verified Against Rendered Page | Result |
|---:|---|---|---:|---|---|---|---|
| 1 | `app_VII__cl_3.12.1` | `clause` | 15 | `3.12.1` | `1240x1755` | `Signing the Building Plans.- All plans for submission to the Auth` | PASS |
| 2 | `chp_11__cl_11.2__cl_11.2.3__note_1` | `note` | 58 | `—` | `1240x1755` | `‘Available roof space’ = 70% of total area of roof / terrace, con` | PASS |
| 3 | `app_XIII__cl_1__note_1__note_1__note_1__note_1` | `note` | 115 | `—` | `1240x1755` | `4:` | PASS |
| 4 | `chp_2_2__cl_15.07.2017__def_11` | `definition` | 129 | `(11)` | `1240x1755` | `‘Appendix’ means Appendix appended to these bye-laws.` | PASS |
| 5 | `chp_2_2__cl_15.07.2017__def_29` | `definition` | 131 | `(29)` | `1240x1755` | `‘Chimney’ means a structure usually vertical containing a pa ssag` | PASS |
| 6 | `chp_2_2__cl_15.07.2017__def_32` | `definition` | 131 | `(32)` | `1240x1755` | `‘Construction’ means; Any erection of a structure or a building, ` | PASS |
| 7 | `chp_2_2__cl_15.07.2017__def_33` | `definition` | 131 | `(33)` | `1240x1755` | `‘Contractor’ means the agency executing the works of any of the c` | PASS |
| 8 | `chp_2_2__cl_15.07.2017__def_47` | `definition` | 132 | `(47)` | `1240x1755` | `‘Duplex’ means a dwelling unit in two levels connected with an in` | PASS |
| 9 | `chp_2_2__cl_15.07.2017__def_55` | `definition` | 132 | `(55)` | `1240x1755` | `‘First floor’ means the floor immediately above the ground floor ` | PASS |
| 10 | `chp_2_2__cl_15.07.2017__def_85` | `definition` | 134 | `(85)` | `1240x1755` | `‘Heritage building’ means a building possessing architectural aes` | PASS |
| 11 | `chp_5__cl_5.3__cl_5.3.2_2__cl_5.3.2.6__item_5` | `item` | 167 | `(5)` | `1240x1755` | `(6) (7) (8) 1 for up to 12 1 per 50 1 per 50 2 for 13 to 25 (Min ` | PASS |
| 12 | `chp_12_3` | `chapter` | 169 | `CHAPTER 12` | `1240x1755` | `lifts shall have a vent at the top of area not less than 0.2Sq.m` | PASS |
| 13 | `chp_6__cl_6.4__cl_6.4.6_2` | `clause` | 171 | `6.4.6` | `1240x1755` | `Compartmentation The building shall be suitably compartmentalized` | PASS |
| 14 | `chp_12__cl_6.5__cl_6.5.4_2__item_h` | `item` | 172 | `(h)` | `1240x1755` | `Air ducts serving main floor areas, corridors, etc. shall not pas` | PASS |
| 15 | `chp_9__cl_9.7__cl_9.7.5_2__item_e` | `item` | 182 | `(e)` | `1240x1755` | `Immediately in front of an entrance/exit and the la nding. 9.9 Dr` | PASS |
| 16 | `chp_10_2__cl_3` | `clause` | 184 | `3` | `1240x1755` | `Set an example in the city by ensuring that Rai n water is harves` | PASS |
| 17 | `chp_11__cl_11.2__cl_11.2.6_2` | `clause` | 187 | `11.2.6` | `1240x1755` | `Sustainability of Building Materials Sustainability of natural re` | PASS |
| 18 | `part_4_5__cl_12.9__cl_12.9.1_2__item_l` | `item` | 190 | `(l)` | `1240x1755` | `Suitable arrangements such as providing slope in th e floor of th` | PASS |
| 19 | `part_4_10__cl_12.29` | `clause` | 199 | `12.29` | `1240x1755` | `Fire prevention In addition to the measures recommended above, th` | PASS |
| 20 | `ann_C_2__cl_3` | `clause` | 225 | `3` | `1240x1755` | `Water Storage Tanks (as notified by the Governm ent) Under Ground` | PASS |
| 21 | `ann_C_2__cl_23` | `clause` | 225 | `23` | `1240x1755` | `Buildings above 15 m in height not to be permitted for Group H Gr` | PASS |
| 22 | `app_II_2__item_a__item_b__item_c__item_d` | `item` | 229 | `(d)` | `1240x1755` | `Location / Alignment of sewerage system of ULB;` | PASS |
| 23 | `app_VI_2__item_a__item_b__item_c__item_d__item_e__item_f__item_g__item_h__item_i__item_j__item_k__item_l__item_m` | `item` | 238 | `(m)` | `1240x1755` | `Photo and other identity proof of the applicant ;` | PASS |
| 24 | `app_VIII_5__note_1` | `note` | 242 | `—` | `1240x1755` | `Additional time of 15 days shall be provided to the Environment c` | PASS |
| 25 | `chp_5__cl_5.3__cl_5.3.2__cl_2__tbl_6` | `table` | 30 | `Table 6` | `1240x1755` | `Table 6` | PASS |
| 26 | `chp_13__cl_13.2__tbl_1` | `table` | 73 | `Table 1` | `1240x1755` | `Table 1` | PASS |
| 27 | `app_VIII_2__tbl_1__row_1` | `table_row` | 79 | `1` | `1240x1755` | `in all floors (Sq.m) / to 2000m 2 / 2000m 2` | PASS |
| 28 | `chp_5__cl_5.3__cl_5.3.2_2__cl_5.3.2.3__cl_3_3__tbl_1__row_1` | `table_row` | 163 | `1` | `1240x1755` | `Over 400 add / Over 200 / 3 for 36 to 65 / 3 for 26 to 40` | PASS |
| 29 | `chp_13_2__cl_13_2__tbl_3__row_4` | `table_row` | 203 | `4` | `1240x1755` | `Conservation Committee to be / Conservation Committee / Governmen` | PASS |
| 30 | `chp_13_2__cl_13_2__tbl_4__row_3` | `table_row` | 203 | `3` | `1240x1755` | `shall be regulated and / grandeur of , or view from / grandeur of` | PASS |

### Document: `rmp2015-zr` (30 Stratified Nodes Verified Against Rendered Page Images)

| # | `eid` | Type | Page | Native No. | Page Image Dim (px @ 150 DPI) | Excerpt Verified Against Rendered Page | Result |
|---:|---|---|---:|---|---|---|---|
| 1 | `sec_DEFINITIONS__def_11` | `definition` | 3 | `11` | `1275x1651` | `A premises used by public transport agency to park the buses for ` | PASS |
| 2 | `sec_DEFINITIONS__def_17` | `definition` | 4 | `17` | `1275x1651` | `is a premise where temporary accommodation for short duration is ` | PASS |
| 3 | `sec_DEFINITIONS__def_19` | `definition` | 4 | `19` | `1275x1651` | `Used primarily to describe the equivalent household in buildings.` | PASS |
| 4 | `sec_DEFINITIONS__def_24` | `definition` | 4 | `24` | `1275x1651` | `Means the vertical distance measured, in the case of flat roofs, ` | PASS |
| 5 | `sec_DEFINITIONS__def_37` | `definition` | 5 | `37` | `1275x1651` | `A premises similar to retail shop for carrying out repair of hous` | PASS |
| 6 | `sec_DEFINITIONS__def_39` | `definition` | 5 | `39` | `1275x1651` | `A premises used for serving food items on commercial basis includ` | PASS |
| 7 | `chp_4__cl_4.2__cl_4.2.1` | `clause` | 29 | `4.2.1` | `1275x1651` | `Description Main features of 'Mixed Land Use' areas are those whe` | PASS |
| 8 | `chp_4__cl_4.4__cl_4.4.2__item_i` | `item` | 32 | `(i)` | `1275x1651` | ` Main land use category: C3  Other land uses permissible (as ma` | PASS |
| 9 | `chp_4__cl_4.5__cl_4.5.2` | `clause` | 33 | `4.5.2` | `1275x1651` | `Regulations` | PASS |
| 10 | `chp_4__cl_4.6__cl_4.6.1` | `clause` | 34 | `4.6.1` | `1275x1651` | `Description The major and minor roads which have commercial activ` | PASS |
| 11 | `chp_4__cl_4.6__cl_4.6.2` | `clause` | 34 | `4.6.2` | `1275x1651` | `Regulations` | PASS |
| 12 | `chp_4__cl_4.8__cl_4.8.2__item_a` | `item` | 36 | `(a)` | `1275x1651` | `Setbacks shall be in accordance with Table.8 or Table.9 depending` | PASS |
| 13 | `chp_4__cl_4.10__cl_4.10.2__item_i` | `item` | 38 | `(i)` | `1275x1651` | `Permissible land uses Main land use category : T4 (for MLCP, refe` | PASS |
| 14 | `chp_4__cl_4.11__cl_4.11.2__def_1` | `definition` | 39 | `1` | `1275x1651` | `The buffer created for accommodating the utilities such as Power,` | PASS |
| 15 | `chp_4__cl_4.11__cl_4.11.2__cl_4` | `clause` | 39 | `4` | `1275x1651` | `For electrical networks, KPTCL standards are followed.` | PASS |
| 16 | `chp_6__cl_6.1__item_d__item_ii` | `item` | 44 | `(ii)` | `1275x1651` | `If the area that remains after making provision for road and park` | PASS |
| 17 | `chp_8__note_1` | `note` | 49 | `—` | `1275x1651` | `Additional parking for part area shall be provided when the part ` | PASS |
| 18 | `chp_8__cl_8.1__item_b__item_iii` | `item` | 50 | `(iii)` | `1275x1651` | `When Multi Level Car Parking (MLCP) is proposed on a plot as inde` | PASS |
| 19 | `chp_9__cl_9.2__prov_1` | `proviso` | 52 | `—` | `1275x1651` | `Provided that for all multi-Storeyed high rise and special buildi` | PASS |
| 20 | `chp_9__cl_9.2__item_iii` | `item` | 52 | `(iii)` | `1275x1651` | `Number and width of exits - The width of an exit, stairway / corr` | PASS |
| 21 | `chp_9__cl_9.3__note_1` | `note` | 53 | `—` | `1275x1651` | `No deductions shall be made in the gross area of the corridors, c` | PASS |
| 22 | `chp_10__cl_10.1__cl_14` | `clause` | 56 | `14` | `1275x1651` | `Whenever the remaining portion of the plot or land after surrende` | PASS |
| 23 | `chp_10__cl_10.1__cl_15` | `clause` | 56 | `15` | `1275x1651` | `The Authority may charge a fee of Rupees one hundred for grant / ` | PASS |
| 24 | `chp_10__cl_10.1__cl_19` | `clause` | 56 | `19` | `1275x1651` | `The utilisation of D.R.C. in favour of Non-Resident of India and ` | PASS |
| 25 | `chp_2__tbl_3__row_9` | `table_row` | 13 | `9` | `1651x1275` | `10 / Hospitals and specialty hospitals` | PASS |
| 26 | `chp_4__cl_4.2__cl_4.2.2__tbl_2__row_4` | `table_row` | 29 | `4` | `1275x1651` | `4 / Up to 55% / 3.00 / Above 24.0 mup to 30m` | PASS |
| 27 | `chp_4__cl_4.10__cl_4.10.3__tbl_1` | `table` | 38 | `Table 1` | `1275x1651` | `Table 1` | PASS |
| 28 | `app_1__tbl_1__row_7` | `table_row` | 58 | `7` | `1275x1651` | `7. / 80 ft road, Rajajinagar / 3.0 mfrom the edge of road` | PASS |
| 29 | `app_1__tbl_2__row_24` | `table_row` | 59 | `24` | `1275x1651` | `63. / Hennur road / 3.0 mup to Salem railway line level crossing` | PASS |
| 30 | `app_1__tbl_2__row_37` | `table_row` | 59 | `37` | `1275x1651` | `76. / Thoppa mudaliar road / 2.0 mfrom the edge of road` | PASS |

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
