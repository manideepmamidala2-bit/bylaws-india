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
- `data/processed/in-ka-bengaluru-south/documents/bbl-2003.clauses.json` against `clause-tree.schema.json`: PASS
- `data/processed/in-ka-bengaluru-south/documents/bbl-2003.annotations.json` against `annotations.schema.json`: PASS
- `data/processed/in-ka-bengaluru-south/documents/rmp2015-zr.clauses.json` against `clause-tree.schema.json`: PASS
- `data/processed/in-ka-bengaluru-south/documents/rmp2015-zr.annotations.json` against `annotations.schema.json`: PASS
- `data/processed/in-ka-bengaluru-south/amendments.json` against `amendments.schema.json`: PASS
- `data/processed/in-ka-bengaluru-south/consolidated.json` against `consolidated.schema.json`: PASS
- `data/processed/in-ka-bengaluru-south/geo-layers.json` against `geo-layers.schema.json`: PASS
- `data/processed/in-ka-bengaluru-south/clause-zone-tags.json` against `clause-zone-tags.schema.json`: PASS
- `data/processed/in-ka-bengaluru-south/declarations.json` against `declarations.schema.json`: PASS

## 2. QA Checks Executed

| # | Check | Status | Details |
|---|---|---|---|
| 1 | Clause `legal_status` present & valid | PASS | 1725/1725 valid |
| 2 | Clause citation page >= 1 | PASS | 1725/1725 valid |
| 3 | Citation bounding box (`bbox`) coverage | PASS | 1769/1769 citations (100.0%) have bbox (>= 95% threshold) |
| 4 | Clause numbering continuity (with source page citations) | PASS | Duplicates: 0; Source-native gaps: 9 (bbl-2003: bbl-2003:3.0.missing [11] (source p. 15); bbl-2003: bbl-2003:4.0.missing [2, 3] (source p. 15, p. 16); bbl-2003: bbl-2003:9.10.missing [3] (source p. 28); bbl-2003: bbl-2003:10.0.missing [3] (source p. 29); bbl-2003: bbl-2003:11.0.missing [4] (source p. 30); bbl-2003: bbl-2003:SCHEDULE I:1.2.missing [7] (source p. 54); bbl-2003: bbl-2003:SCHEDULE XIII.missing [2, 3] (source p. 82, p. 83); rmp2015-zr: rmp2015-zr:CHAPTER 3.missing [3] (source p. 21); rmp2015-zr: rmp2015-zr:10.1.missing [10] (source p. 55)) |
| 5 | Clauses with empty text | PASS | 0 empty clause(s) |
| 6 | Page text character coverage (>= 98%) & known gaps | PASS | Page text coverage: `bbl-2003`: 98.8% (169291/171419 content chars); `rmp2015-zr`: 98.7% (105021/106414 content chars); 2 known gap(s) recorded in `declarations.json` |
| 7 | Unresolved cross-references | WARN | 17 unresolved (bbl-2003:preamble -> bbl-2003:428; bbl-2003:3.2(10.1)(b) -> bbl-2003:17; bbl-2003:5.6(a) -> bbl-2003:300; bbl-2003:7.1(j) -> bbl-2003:95; bbl-2003:7.1:note_1 -> bbl-2003:354; bbl-2003:7.3 -> bbl-2003:17; bbl-2003:15.4(i)(iii) -> bbl-2003:9.10.3; bbl-2003:20.3(a) -> bbl-2003:20.11.3; bbl-2003:32.0(b) -> bbl-2003:32; bbl-2003:32.0(c) -> bbl-2003:32; bbl-2003:SCHEDULE II -> bbl-2003:299; bbl-2003:SCHEDULE III -> bbl-2003:3.2.11; bbl-2003:SCHEDULE V-A:3 -> bbl-2003:310; bbl-2003:SCHEDULE VIII -> bbl-2003:5.6.1; bbl-2003:SCHEDULE IX -> bbl-2003:5.6.1; bbl-2003:SCHEDULE XI -> bbl-2003:31; bbl-2003:SCHEDULE XII -> bbl-2003:32) |
| 8 | Low-confidence amendment links | PASS | 0 low-confidence link(s) |
| 9 | Drafts referenced from `in_force` clauses | PASS | 0 draft reference(s) |

## 3. Declarations Summary

- **Not Modelled**: 2
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
| 9 | `part_II__sec_3.0` | `section` | 9 | `3.0` | `1275x1651` | `BUILDING LICENCE` | PASS |
| 10 | `part_II__sec_3.0__cl_3.2__item_b_2` | `item` | 10 | `(b)` | `1275x1651` | `use or occupancy of all parts of the building;` | PASS |
| 11 | `part_II__sec_3.0__cl_3.2__item_j_2` | `item` | 10 | `(j)` | `1275x1651` | `in case of basement floor, position of the ramp with respect to t` | PASS |
| 12 | `part_II__sec_3.0__cl_3.10` | `clause` | 15 | `3.10` | `1275x1651` | `Exemptions for ground rent - Ground rent may be exempted in the f` | PASS |
| 13 | `part_II__sec_5.0__cl_5.6__def_b` | `definition` | 17 | `(b)` | `1275x1651` | `Physical inspection means the Authority shall find out whether th` | PASS |
| 14 | `part_III__sec_9.0__cl_9.2__note_3` | `note` | 25 | `3` | `1275x1651` | `(a) The front and rear set backs shall be with reference to the d` | PASS |
| 15 | `part_III__sec_9.0__cl_9.10__cl_9.10.1__note_3` | `note` | 28 | `—` | `1275x1651` | `(3) When two sides of the same road are included in two different` | PASS |
| 16 | `part_III__sec_9.0__cl_9.10__cl_9.10.2__note_1` | `note` | 28 | `—` | `1275x1651` | `One penthouse only is permissible for a building. The area of the` | PASS |
| 17 | `part_III__sec_20.0__cl_20.6__item_c` | `item` | 40 | `(c)` | `1275x1651` | `Assembly building like auditoria, theatres and cinemas 1.5 mtr.` | PASS |
| 18 | `part_III__sec_20.0__cl_20.9` | `clause` | 41 | `20.9` | `1275x1651` | `Industrial buildings - The minimum height of rooms shall be as pr` | PASS |
| 19 | `part_III__sec_21.0__cl_21.1__def_21.1.9` | `definition` | 42 | `21.1.9` | `1275x1651` | `All exits shall provide continuous means of egress to the exterio` | PASS |
| 20 | `part_IV__sec_26.0__cl_26.2` | `clause` | 48 | `26.2` | `1275x1651` | `The safety measures to be adopted during the various construction` | PASS |
| 21 | `part_V__sec_33.0__cl_33.1` | `clause` | 51 | `33.1` | `1275x1651` | `Erection on drains - No building or part of a building shall be e` | PASS |
| 22 | `sch_I__cl_1.2__cl_1.2.9__cl_1.2.9.1` | `clause` | 55 | `1.2.9.1` | `1275x1651` | `Uses that are permissible - Railway yards, railway station, bus s` | PASS |
| 23 | `sch_IV__item_i__item_i_2` | `item` | 65 | `(i)` | `1275x1651` | `All plans and related information with necessary certificates con` | PASS |
| 24 | `sch_V-A__cl_1` | `clause` | 68 | `1` | `1275x1651` | `A copy of the sanctioned plan should be displayed in the work spo` | PASS |
| 25 | `part_III__sec_8.0__cl_8.4__tbl_1` | `table` | 20 | `Table 1` | `1275x1651` | `Table 1` | PASS |
| 26 | `part_III__sec_17.0__tbl_1__row_12` | `table_row` | 36 | `12` | `1275x1651` | `11 / Kalyana mandiras / 10 sq.mtr. of auditorium floor area` | PASS |
| 27 | `part_III__sec_21.0__cl_21.5__tbl_2__row_1` | `table_row` | 43 | `1` | `1275x1651` | `1 / Residential / 25 / 50 / 75` | PASS |
| 28 | `sch_1-A__tbl_1__row_31` | `table_row` | 57 | `31` | `1275x1651` | `31 / STD/ISD counters` | PASS |
| 29 | `sch_1-B__tbl_1__row_28` | `table_row` | 58 | `28` | `1275x1651` | `28 / Cards board box and paper products including paper` | PASS |
| 30 | `sch_X__tbl_4__row_24` | `table_row` | 77 | `24` | `1275x1651` | `127 / Gavipuram Guttahalli Main Rd / 2 m from the edge of the roa` | PASS |

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
