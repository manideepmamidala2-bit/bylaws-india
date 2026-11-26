# Relations, Topics, Precedence & Succession QA Report (`xx-test-fixture`)

## 1. Summary Counts by Relation Kind and Status

| Relation Kind | Total Count | Confirmed | Candidate |
|---|---:|---:|---:|
| `same_topic` | 0 | 0 | 0 |
| `definition_differs` | 0 | 0 | 0 |
| `numeric_differs` | 0 | 0 | 0 |
| `cross_document_reference` | 3 | 3 | 0 |
| `precedence` | 0 | 0 | 0 |
| `corporation_differs` | 0 | 0 | 0 |
| **Total** | **3** | **3** | **0** |

## 2. Statutory Precedence Relations (Quoted Law Spans)

| ID | From Provision | To Provision | Topic | Quoted Statutory Precedence Span |
|---|---|---|---|---|

## 3. Sampled Relations Verification Against Source Texts (30 Samples)

| ID | Kind | Status | From (`doc:eid`) | To (`doc:eid`) | Verification |
|---|---|---|---|---|---|
| `rel_1` | `cross_document_reference` | `confirmed` | `fixture-amend-2024:cl_2` | `fixture-base-2020:chp_II__cl_2.2` | PASS (`machine_checked`) |
| `rel_2` | `cross_document_reference` | `confirmed` | `fixture-amend-2024:cl_3` | `fixture-base-2020:chp_II__cl_2.2` | PASS (`machine_checked`) |
| `rel_3` | `cross_document_reference` | `confirmed` | `fixture-amend-2024:cl_4` | `fixture-base-2020:chp_II__cl_2.3` | PASS (`machine_checked`) |

