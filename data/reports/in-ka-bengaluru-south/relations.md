# Relations, Topics, Precedence & Succession QA Report (`in-ka-bengaluru-south`)

## 1. Summary Counts by Relation Kind and Status

| Relation Kind | Total Count | Confirmed | Candidate |
|---|---:|---:|---:|
| `same_topic` | 49 | 49 | 0 |
| `definition_differs` | 59 | 59 | 0 |
| `numeric_differs` | 22 | 0 | 22 |
| `cross_document_reference` | 27 | 27 | 0 |
| `precedence` | 19 | 19 | 0 |
| `corporation_differs` | 16 | 16 | 0 |
| **Total** | **192** | **170** | **22** |

## 2. Statutory Precedence Relations (Quoted Law Spans)

| ID | From Provision | To Provision | Topic | Quoted Statutory Precedence Span |
|---|---|---|---|---|
| `rel_158` | `bbl-2003:part_III__sec_20.0__cl_20.10__item_c` | `rmp2015-zr:chp_1__cl_1.2` | `projections_open_spaces` | Subject to bye-law 32 |
| `rel_159` | `bbl-2003:part_III__sec_20.0__cl_20.10__item_d` | `rmp2015-zr:part_III__sec_20.0__cl_20.10__item_d` | `general` | Subject to bye-law 32 |
| `rel_160` | `bbl-2003:part_III__sec_9.0__cl_9.10__cl_9.10.6` | `rmp2015-zr:chp_10__cl_10.1__cl_9` | `ground_coverage` | subject to the provision of minimum set backs prescribed in Tables 4 and 5, whichever is applicable |
| `rel_161` | `bbl-2003:part_II__sec_4.0__cl_4.1__cl_4.1.1` | `rmp2015-zr:part_II__sec_4.0__cl_4.1__cl_4.1.1` | `general` | Subject to sections 303 and 304 of the Act, the Authority, after having examined the application for licence, may either grant the licence as per the proposal |
| `rel_162` | `bbl-2003:part_V__sec_34` | `rmp2015-zr:part_V__sec_34` | `general` | On these bye-laws coming into force, 'The City of Bangalore Municipal Corporation Building Bye-laws, 1983' (approved by the Govt |
| `rel_163` | `gbga-2024:chp_XVIII__cl_316__item_2__item_3__item_4__item_b__item_5` | `bbl-2003:part_I__sec_1.0` | `general` | notwithstanding anything contained in section 318 |
| `rel_164` | `gbga-2024:chp_XVII__cl_223` | `bbl-2003:part_I__sec_1.0` | `general` | Notwithstanding anything contained in this Act, a Corporation or any officer or other authority required by or under this Act to exercise any power, or perform any function or d |
| `rel_165` | `gbga-2024:chp_XVII__cl_230__item_2__item_3__item_4__item_5__item_6__item_7__item_8__item_9__item_10` | `bbl-2003:part_I__sec_1.0` | `general` | Notwithstanding anything contained in this chapter, the Commissioner shall have the power to order for the stoppage of any construction which in his opinion endangers the public |
| `rel_166` | `gbga-2024:chp_XVII__cl_234__prov_1` | `bbl-2003:part_I__sec_1.0` | `general` | Notwithstanding anything contained in this act no licence or permission shall be necessary for the Bengaluru Metropolitan Transport City Corporation in respect of the fixation o |
| `rel_167` | `gbga-2024:chp_XVII__cl_238` | `bbl-2003:part_I__sec_1.0` | `general` | Notwithstanding anything contained in this Act or any rule or bye-law made there under, the construction of, or any addition to any building of public entertainment or any addit |
| `rel_168` | `gbga-2024:chp_XVII__cl_249` | `bbl-2003:part_II__sec_3.0__cl_3.10__note_1` | `deviations_regularisation` | Notwithstanding anything contained in this Act, when construction of any building is completed in contravention of the provisions of this Chapter and the building bye-laws, the |
| `rel_169` | `rmp2015-zr:app_VIII` | `bbl-2003:part_III__sec_10.0` | `far` | subject to the provision of Section 14-B of the Karnataka Town and Country planing Act, 1961 and Rules thereunder: |
| `rel_170` | `rmp2015-zr:chp_10__cl_10.1__cl_8` | `bbl-2003:part_I__sec_1.0` | `general` | subject to condition No |
| `rel_171` | `rmp2015-zr:chp_2__note_1` | `bbl-2003:part_III__sec_13.0__cl_13.1` | `land_use` | subject to condition that the zone permits the extent of the area and power consumption, the activity follows the required space standard, performance character |
| `rel_172` | `rmp2015-zr:chp_2__tbl_10__row_3` | `bbl-2003:part_I__sec_1.0` | `general` | subject to condition that the zone permits the extent of the area and installed power and performance characteristics such as Noise, Vibration, Dust , Odour, Ef |
| `rel_173` | `rmp2015-zr:chp_2__tbl_7__row_2` | `bbl-2003:part_I__sec_1.0` | `general` | subject to condition that the zone permits the extent of area and the power consumption does not exceed 5 KW |
| `rel_174` | `rmp2015-zr:chp_4__cl_4.10__cl_4.10.2__item_i` | `bbl-2003:part_III__sec_13.0__cl_13.2__note_1` | `building_height` | subject to condition that it satisfies fire and airport authority restrictions where ever applicable |
| `rel_175` | `rmp2015-zr:chp_8__cl_8.1__item_b__item_iii` | `bbl-2003:part_III__sec_13.0__cl_13.2__note_1` | `building_height` | subject to condition that they satisfy fire and airport authority restrictions where ever applicable |
| `rel_176` | `rmp2015-zr-amend-2009-03:chp_3__cl_4.10__cl_4.10.2` | `bbl-2003:part_III__sec_13.0__cl_13.2__note_1` | `building_height` | subject to condition that it satisfies fire and airport authority restrictions wherever applicable |

## 3. Sampled Relations Verification Against Source Texts (30 Samples)

| ID | Kind | Status | From (`doc:eid`) | To (`doc:eid`) | Verification |
|---|---|---|---|---|---|
| `rel_1` | `definition_differs` | `confirmed` | `bbl-2003:part_I__sec_2.0__def_2.1` | `ka-model-bbl-2017:chp_2_2__cl_15.07.2017__def_2` | PASS (`machine_checked`) |
| `rel_2` | `definition_differs` | `confirmed` | `bbl-2003:part_I__sec_2.0__def_2.2` | `ka-model-bbl-2017:chp_2_2__cl_15.07.2017__def_4` | PASS (`machine_checked`) |
| `rel_3` | `definition_differs` | `confirmed` | `rmp2015-zr:sec_DEFINITIONS__def_1` | `ka-model-bbl-2017:chp_2_2__cl_15.07.2017__def_6` | PASS (`machine_checked`) |
| `rel_4` | `definition_differs` | `confirmed` | `bbl-2003:part_I__sec_2.0__def_2.4` | `rmp2015-zr:sec_DEFINITIONS__def_3` | PASS (`machine_checked`) |
| `rel_5` | `definition_differs` | `confirmed` | `bbl-2003:part_I__sec_2.0__def_2.4` | `ka-model-bbl-2017:chp_2_2__cl_15.07.2017__def_9` | PASS (`machine_checked`) |
| `rel_6` | `definition_differs` | `confirmed` | `bbl-2003:part_I__sec_2.0__def_2.6` | `ka-model-bbl-2017:chp_2_2__cl_15.07.2017__def_13` | PASS (`machine_checked`) |
| `rel_7` | `definition_differs` | `confirmed` | `rmp2015-zr:sec_DEFINITIONS__def_4` | `ka-model-bbl-2017:chp_2_2__cl_15.07.2017__def_16` | PASS (`machine_checked`) |
| `rel_8` | `definition_differs` | `confirmed` | `bbl-2003:part_I__sec_2.0__def_2.7` | `rmp2015-zr:sec_DEFINITIONS__def_5` | PASS (`machine_checked`) |
| `rel_9` | `definition_differs` | `confirmed` | `bbl-2003:part_I__sec_2.0__def_2.7` | `ka-model-bbl-2017:chp_2_2__cl_15.07.2017__def_17` | PASS (`machine_checked`) |
| `rel_10` | `definition_differs` | `confirmed` | `bbl-2003:part_I__sec_2.0__def_2.8` | `ka-model-bbl-2017:chp_2_2__cl_15.07.2017__def_18` | PASS (`machine_checked`) |
| `rel_11` | `definition_differs` | `confirmed` | `bbl-2003:part_I__sec_2.0__def_2.9` | `ka-model-bbl-2017:chp_2_2__cl_15.07.2017__def_19` | PASS (`machine_checked`) |
| `rel_12` | `definition_differs` | `confirmed` | `bbl-2003:part_I__sec_2.0__def_2.10` | `ka-model-bbl-2017:chp_2_2__cl_15.07.2017__def_21` | PASS (`machine_checked`) |
| `rel_13` | `definition_differs` | `confirmed` | `bbl-2003:part_I__sec_2.0__def_2.11` | `rmp2015-zr:sec_DEFINITIONS__def_9` | PASS (`machine_checked`) |
| `rel_14` | `definition_differs` | `confirmed` | `bbl-2003:part_I__sec_2.0__def_2.11` | `ka-model-bbl-2017:chp_2_2__cl_15.07.2017__def_22` | PASS (`machine_checked`) |
| `rel_15` | `definition_differs` | `confirmed` | `rmp2015-zr:sec_DEFINITIONS__def_8` | `ka-model-bbl-2017:chp_2_2__cl_15.07.2017__def_24` | PASS (`machine_checked`) |
| `rel_16` | `definition_differs` | `confirmed` | `rmp2015-zr:sec_DEFINITIONS__def_11` | `ka-model-bbl-2017:chp_2_2__cl_15.07.2017__def_25` | PASS (`machine_checked`) |
| `rel_17` | `definition_differs` | `confirmed` | `bbl-2003:part_I__sec_2.0__def_2.13` | `ka-model-bbl-2017:chp_2_2__cl_15.07.2017__def_29` | PASS (`machine_checked`) |
| `rel_18` | `definition_differs` | `confirmed` | `rmp2015-zr:sec_DEFINITIONS__def_14` | `ka-model-bbl-2017:chp_2_2__cl_15.07.2017__def_31` | PASS (`machine_checked`) |
| `rel_19` | `definition_differs` | `confirmed` | `bbl-2003:part_I__sec_2.0__def_2.16` | `ka-model-bbl-2017:chp_2_2__cl_15.07.2017__def_35` | PASS (`machine_checked`) |
| `rel_20` | `definition_differs` | `confirmed` | `bbl-2003:part_I__sec_2.0__def_2.22` | `ka-model-bbl-2017:chp_2_2__cl_15.07.2017__def_a` | PASS (`machine_checked`) |
| `rel_21` | `definition_differs` | `confirmed` | `bbl-2003:part_I__sec_2.0__def_2.23` | `ka-model-bbl-2017:chp_2_2__cl_15.07.2017__def_43` | PASS (`machine_checked`) |
| `rel_22` | `definition_differs` | `confirmed` | `bbl-2003:part_I__sec_2.0__def_2.24` | `rmp2015-zr:sec_DEFINITIONS__def_16` | PASS (`machine_checked`) |
| `rel_23` | `definition_differs` | `confirmed` | `rmp2015-zr:sec_DEFINITIONS__def_18` | `ka-model-bbl-2017:chp_2_2__cl_15.07.2017__def_45` | PASS (`machine_checked`) |
| `rel_24` | `definition_differs` | `confirmed` | `bbl-2003:part_I__sec_2.0__def_2.28` | `ka-model-bbl-2017:chp_2_2__cl_15.07.2017__def_53` | PASS (`machine_checked`) |
| `rel_25` | `definition_differs` | `confirmed` | `bbl-2003:part_I__sec_2.0__def_2.30` | `ka-model-bbl-2017:chp_2_2__cl_15.07.2017__def_55` | PASS (`machine_checked`) |
| `rel_26` | `definition_differs` | `confirmed` | `bbl-2003:part_I__sec_2.0__def_2.31` | `ka-model-bbl-2017:chp_2_2__cl_15.07.2017__def_56` | PASS (`machine_checked`) |
| `rel_27` | `definition_differs` | `confirmed` | `bbl-2003:part_I__sec_2.0__def_2.32` | `ka-model-bbl-2017:chp_2_2__cl_15.07.2017__def_57` | PASS (`machine_checked`) |
| `rel_28` | `definition_differs` | `confirmed` | `bbl-2003:part_I__sec_2.0__def_2.34` | `ka-model-bbl-2017:chp_2_2__cl_15.07.2017__def_72` | PASS (`machine_checked`) |
| `rel_29` | `definition_differs` | `confirmed` | `bbl-2003:part_I__sec_2.0__def_2.35` | `ka-model-bbl-2017:chp_2_2__cl_15.07.2017__def_74` | PASS (`machine_checked`) |
| `rel_30` | `definition_differs` | `confirmed` | `bbl-2003:part_I__sec_2.0__def_2.36` | `rmp2015-zr:sec_DEFINITIONS__def_20` | PASS (`machine_checked`) |

