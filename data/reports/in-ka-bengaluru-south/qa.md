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
| 1 | Clause `legal_status` present & valid | PASS | 1771/1771 valid |
| 2 | Clause citation page >= 1 | PASS | 1771/1771 valid |
| 3 | Citation bounding box (`bbox`) coverage | INFO | 1816/1816 citations (100.0%) have bbox |
| 4 | Clause numbering continuity | PASS | Duplicates: 0; Gaps: 8 (bbl-2003: bbl-2003:3.0.missing [11]; bbl-2003: bbl-2003:4.0.missing [2, 3]; bbl-2003: bbl-2003:PART III.missing [5, 6, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74]; bbl-2003: bbl-2003:9.10.missing [3]; bbl-2003: bbl-2003:10.0.missing [2, 3]; bbl-2003: bbl-2003:PART V.missing [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33]; bbl-2003: bbl-2003:SCHEDULE I:1.2.missing [7]; rmp2015-zr: rmp2015-zr:CHAPTER 2.missing [3]) |
| 5 | Clauses with empty text | PASS | 0 empty clause(s) |
| 6 | Source page coverage & adapter gaps | INFO | 2 known gap(s) recorded in `declarations.json` |
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
| 1 | `part_I__sec_2.0__def_2.12` | `definition` | 3 | `2.12` | `1275x1651` | `'chejja' means a continuous sloping or horizontal cantilever proj` | PASS |
| 2 | `part_I__sec_2.0__def_2.17` | `definition` | 3 | `2.17` | `1275x1651` | `' corporation' means the Bangalore Mahanagara Palike established ` | PASS |
| 3 | `part_I__sec_2.0__def_2.27` | `definition` | 4 | `2.27` | `1275x1651` | `'dwelling unit/tenement' means an independent housing unit with s` | PASS |
| 4 | `part_I__sec_2.0__def_2.58` | `definition` | 6 | `2.58` | `1275x1651` | `' owner' includes the person for the time being receiving or enti` | PASS |
| 5 | `part_I__sec_2.0__def_2.65` | `definition` | 6 | `2.65` | `1275x1651` | `' plinth level' means the level of the floor of a building immedi` | PASS |
| 6 | `part_I__sec_2.0__def_2.77` | `definition` | 7 | `2.77` | `1275x1651` | `'stair case room' means a room accommodating the stair and for pu` | PASS |
| 7 | `part_II__sec_3.0__cl_3.2__item_j_2` | `item` | 10 | `(j)` | `1275x1651` | `in case of basement floor, position of the ramp with respect to t` | PASS |
| 8 | `part_II__sec_3.0__cl_3.2__cl_3.210.1__item_e` | `item` | 11 | `(e)` | `1275x1651` | `In case of civic amenity site, leased out by the Bangalore Develo` | PASS |
| 9 | `part_II__sec_3.0__cl_3.2_2__cl_3.210.7` | `clause` | 11 | `3.2(10.7)` | `1275x1651` | `Karnataka Slum Clearance and Improvement Board N.O.C. with regard` | PASS |
| 10 | `part_II__sec_3.0__cl_3.8__note_3` | `note` | 14 | `—` | `1275x1651` | `(iii) If the public land is utilised for storing of excavated mat` | PASS |
| 11 | `part_II__sec_5.0__cl_5.5__item_i` | `item` | 17 | `(i)` | `1275x1651` | `The owner/builder/contractor shall during the construction, displ` | PASS |
| 12 | `part_III__sec_7.0__cl_7.4` | `clause` | 20 | `7.4` | `1275x1651` | `Distance of building from electrical lines No building shall be e` | PASS |
| 13 | `part_III__sec_16.0__item_c` | `item` | 35 | `(c)` | `1275x1651` | `No parking space shall be insisted upon in the intensely develope` | PASS |
| 14 | `part_III__sec_16.0__note_1` | `note` | 36 | `—` | `1275x1651` | `In addition to the above 10% additional parking space shall be pr` | PASS |
| 15 | `part_III__sec_18.0__cl_18.10` | `clause` | 38 | `18.10` | `1275x1651` | `The walls and the floors of the basement shall be watertight and ` | PASS |
| 16 | `part_III__sec_1.0__item_b` | `item` | 40 | `(b)` | `1275x1651` | `Residential hostel buildings` | PASS |
| 17 | `part_III__sec_21.0__cl_21.1__def_21.1.9` | `definition` | 42 | `21.1.9` | `1275x1651` | `All exits shall provide continuous means of egress to the exterio` | PASS |
| 18 | `part_III__sec_21.0__cl_21.7__item_1` | `item` | 45 | `(1)` | `1275x1651` | `Each revolving door shall be counted as one half of the exit unit` | PASS |
| 19 | `part_IV__sec_23.0__cl_23.1__cl_23.1.1` | `clause` | 47 | `23.1.1` | `1275x1651` | `For buildings with ground floor + four floors and above (or heigh` | PASS |
| 20 | `sch_I__cl_1.2__cl_1.2.9__cl_1.2.9.2` | `clause` | 55 | `1.2.9.2` | `1275x1651` | `Uses that are permissible under special circumstances - Canteens,` | PASS |
| 21 | `sch_1-B__note_1` | `note` | 60 | `—` | `1275x1651` | `Conditions to be fulfilled:` | PASS |
| 22 | `sch_I-C__cl_1` | `clause` | 60 | `1` | `1275x1651` | `Small domestic appliances and gadgets (room heaters) coolers, hot` | PASS |
| 23 | `sch_II__cl_8` | `clause` | 61 | `8` | `1275x1651` | `Affidavit and Indemnity Bond as prescribed.` | PASS |
| 24 | `sch_II_2__cl_1` | `clause` | 82 | `1` | `1275x1651` | `Code No :` | PASS |
| 25 | `sch_1-A__tbl_1__row_2` | `table_row` | 57 | `2` | `1275x1651` | `2 / Confectionery, candies and sweets` | PASS |
| 26 | `sch_1-B__tbl_1__row_17` | `table_row` | 58 | `17` | `1275x1651` | `17 / Webbing (narrow fabrics, embroidery lace manufacturing)` | PASS |
| 27 | `sch_X__tbl_1__row_22` | `table_row` | 74 | `22` | `1275x1651` | `22 / Kengal Hanumanthaiah Road / 3 m from the edge of the road / ` | PASS |
| 28 | `sch_X__tbl_1__row_25` | `table_row` | 74 | `25` | `1275x1651` | `25 / H.Siddaiah Road / 3 m from the edge of the road / 9` | PASS |
| 29 | `sch_X__tbl_3__row_35` | `table_row` | 76 | `35` | `1275x1651` | `101 / Mysore Road / 5 m up to REMCO from the edge of the road / 1` | PASS |
| 30 | `sch_X__tbl_4__row_14` | `table_row` | 77 | `14` | `1275x1651` | `117 / Ibrahim Saheb Street / 2 m from the edge of the road / 10` | PASS |

### Document: `rmp2015-zr` (30 Stratified Nodes Verified Against Rendered Page Images)

| # | `eid` | Type | Page | Native No. | Page Image Dim (px @ 150 DPI) | Excerpt Verified Against Rendered Page | Result |
|---:|---|---|---:|---|---|---|---|
| 1 | `sec_DEFINITIONS__def_4` | `definition` | 3 | `4` | `1275x1651` | `Premises having an enclosed space to seat audience and stage for ` | PASS |
| 2 | `sec_DEFINITIONS__def_7` | `definition` | 3 | `7` | `1275x1651` | `Means bifurcation of a plot into two.` | PASS |
| 3 | `sec_DEFINITIONS__def_11` | `definition` | 3 | `11` | `1275x1651` | `A premises used by public transport agency to park the buses for ` | PASS |
| 4 | `sec_DEFINITIONS__def_20` | `definition` | 4 | `20` | `1275x1651` | `Frontage means the width of the site abutting the access road.` | PASS |
| 5 | `sec_DEFINITIONS__def_27` | `definition` | 5 | `27` | `1275x1651` | `A premises used for lodging on payment with or with out boarding ` | PASS |
| 6 | `sec_DEFINITIONS__def_35` | `definition` | 5 | `35` | `1275x1651` | `A premises used for outdoor games, it may have on it landscaping ` | PASS |
| 7 | `sec_DEFINITIONS__def_39` | `definition` | 5 | `39` | `1275x1651` | `A premises used for serving food items on commercial basis includ` | PASS |
| 8 | `chp_2__cl_3.10__item_i` | `item` | 24 | `(i)` | `1275x1651` | `Provision for ramp shall have a minimum width of 3.5 m and a slop` | PASS |
| 9 | `chp_4__cl_4.2__cl_4.2.2` | `clause` | 29 | `4.2.2` | `1275x1651` | `Regulations` | PASS |
| 10 | `chp_4__cl_4.2__cl_4.2.2__item_i` | `item` | 29 | `(i)` | `1275x1651` | `· Main land use category: R · Ancillary land use category: C3, I-` | PASS |
| 11 | `chp_4__cl_4.2__cl_4.2.3__item_a` | `item` | 30 | `(a)` | `1275x1651` | `Buildings with a floor area not exceeding 100sqm are exempted fro` | PASS |
| 12 | `chp_4__cl_4.6__cl_4.6.2__item_b` | `item` | 34 | `(b)` | `1275x1651` | `TDR is applicable as per rules.` | PASS |
| 13 | `chp_4__cl_4.9__cl_4.9.2__item_i__item_i` | `item` | 37 | `(i)` | `1275x1651` | `In case, any private property is included within the boundary of ` | PASS |
| 14 | `chp_4__cl_4.10` | `clause` | 38 | `4.10` | `1275x1651` | `TRAFFIC AND TRANSPORTATION (T&T)` | PASS |
| 15 | `chp_4__cl_4.10__cl_4.10.2` | `clause` | 38 | `4.10.2` | `1275x1651` | `Regulations` | PASS |
| 16 | `chp_5__cl_5.2` | `clause` | 43 | `5.2` | `1275x1651` | `The Co-ordinated planning schemes are the zones where the BDA int` | PASS |
| 17 | `chp_5__cl_5.3__note_1` | `note` | 43 | `—` | `1275x1651` | `Set backs shall be applicable as per Table 8 or 9 as the case may` | PASS |
| 18 | `chp_7_2` | `chapter` | 46 | `CHAPTER 7` | `1275x1651` | `REGULATIONS FOR RESIDENTIAL DEVELOPMENT PLANS AND NON RESIDENTIAL` | PASS |
| 19 | `chp_8__cl_8.1__item_a__item_v` | `item` | 50 | `(v)` | `1275x1651` | `In case, additional car parking is provided as part of parking co` | PASS |
| 20 | `chp_9__cl_9.2__note_1` | `note` | 52 | `—` | `1275x1651` | `The travel distance to an exit from the dead end of a corridor sh` | PASS |
| 21 | `chp_9__cl_9.2__prov_1` | `proviso` | 52 | `—` | `1275x1651` | `Provided that for all multi-Storeyed high rise and special buildi` | PASS |
| 22 | `chp_9__cl_10.1` | `clause` | 54 | `10.1` | `1275x1651` | `Terms and Conditions for Grant & Utilisation of TDR` | PASS |
| 23 | `chp_9__cl_10.1__cl_13` | `clause` | 56 | `13` | `1275x1651` | `The D.R.C. obtained on account of surrendering a particular land ` | PASS |
| 24 | `chp_9__cl_10.1__cl_23` | `clause` | 57 | `23` | `1275x1651` | `Where the D.R.C. holder is a minor, no permission for transfer fo` | PASS |
| 25 | `chp_2__tbl_3__row_11` | `table_row` | 13 | `11` | `1651x1275` | `12 / All uses of C1 & C2 are permitted` | PASS |
| 26 | `chp_2__cl_13__tbl_5__row_14` | `table_row` | 18 | `14` | `1651x1275` | `15 / Broadcasting and Transmission stations` | PASS |
| 27 | `chp_4__cl_4.2__cl_4.2.2__tbl_2__row_2` | `table_row` | 29 | `2` | `1275x1651` | `2 / Up to 65% / 2.25 / Above 12.0 up to18.0m` | PASS |
| 28 | `chp_8__tbl_1__row_1` | `table_row` | 49 | `1` | `1275x1651` | `1 / Theaters and Auditoriums except Educational Institutions. / 2` | PASS |
| 29 | `app_1__tbl_2__row_30` | `table_row` | 59 | `30` | `1275x1651` | `69. / Seppings road / 2.0 mfrom the edge of road` | PASS |
| 30 | `app_1__tbl_2__row_34` | `table_row` | 59 | `34` | `1275x1651` | `73. / Jumma masjid road, OPH Road / 2.0 mfrom the edge of road` | PASS |
