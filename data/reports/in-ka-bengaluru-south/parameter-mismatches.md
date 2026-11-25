# Parameter Extraction & Table Cell Cross-Check Report (`in-ka-bengaluru-south`)

- **Total Parameter Records Extracted**: `322`
- **Source Table Anomalies / Mismatches Flagged for Owner Review**: `4`

## Flagged Source Table Anomalies & Mismatches

| Record / Node | Document | Page | Printed Cell / Row Header | Observation for Owner Review |
|---|---|---:|---|---|
| `rmp2015-zr:chp_4__cl_4.10__cl_4.10.3__tbl_1__row_2` | `rmp2015-zr` | p. 38 | `Up to 1000` | Source table prints `Up to 1000` directly below `Up to 500` without `Above 500`; normalised interval min to `500.0`. |
| `rmp2015-zr:chp_4__cl_4.5__cl_4.5.3__tbl_1__row_2` | `rmp2015-zr` | p. 33 | `sq.m` | Multi-row merged cell `'All plot sizes up to 12000 sq.m'` split `'sq.m'` into row 2 in PDF table extraction; linked to `[0, 12000]` m² interval. |
| `rmp2015-zr:chp_4__cl_4.9__cl_4.9.3__tbl_1__row_2` | `rmp2015-zr` | p. 37 | `Up to 1000` | Source table prints `Up to 1000` directly below `Up to 500` without `Above 500`; normalised interval min to `500.0`. |
| `in-ka-bengaluru-south:param_0297` | `rmp2015-zr` | p. 28 | `Stilt +GF+2 floors` | Record `in-ka-bengaluru-south:param_0297` parsed numeric value `3.0` not found literally in cell_text `Stilt +GF+2 floors`. |

## Additional Statutory Notes Flagged During Page-Image Inspection

- **Table 10 vs. Table 1 naming (`rmp2015-zr` p. 28)**: The Residential (Main) FAR and Ground Coverage table on PDF page 28 (printed page `- 27 -`) is captioned **`Table 10: FAR and Ground Coverage in Residential (Main)`** in the gazette PDF, whereas its internal Akoma Ntoso `eid` is `chp_4__cl_4.1__cl_4.1.3__tbl_1` (the first table inside Clause 4.1.3).
- **January 2026 Note 4 on Chapter 4 Coverage (p. 3, `cl_11.11.2025__cl_4`)**: Inserts Note 4 after Table 9 stating: *"For the plot area upto 4000 sq.m coverage mentioned in chapter 4: Regulations for main land use zones shall not be considered."* Both Table 10's printed `Up to 65%` coverage (`chp_4__cl_4.1__cl_4.1.3__tbl_1__row_2`) and Note 4's qualification are surfaced for owner review.
