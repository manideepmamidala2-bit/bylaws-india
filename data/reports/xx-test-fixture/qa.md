# Quality Assurance Report — `xx-test-fixture` (Synthetic Test Jurisdiction)

## 1. Schema v1.4 Validation

- `data/raw/xx-test-fixture/fixture-base-2020.meta.json` against `document.schema.json`: PASS
- `data/raw/xx-test-fixture/fixture-amend-2024.meta.json` against `document.schema.json`: PASS
- `data/raw/xx-test-fixture/fixture-draft-2026.meta.json` against `document.schema.json`: PASS
- `data/raw/xx-test-fixture/fixture-map-atlas.meta.json` against `document.schema.json`: PASS
- `data/processed/xx-test-fixture/documents/fixture-base-2020.clauses.json` against `clause-tree.schema.json`: PASS
- `data/processed/xx-test-fixture/documents/fixture-base-2020.annotations.json` against `annotations.schema.json`: PASS
- `data/processed/xx-test-fixture/documents/fixture-amend-2024.clauses.json` against `clause-tree.schema.json`: PASS
- `data/processed/xx-test-fixture/documents/fixture-amend-2024.annotations.json` against `annotations.schema.json`: PASS
- `data/processed/xx-test-fixture/documents/fixture-draft-2026.clauses.json` against `clause-tree.schema.json`: PASS
- `data/processed/xx-test-fixture/documents/fixture-draft-2026.annotations.json` against `annotations.schema.json`: PASS
- `data/processed/xx-test-fixture/documents/fixture-map-atlas.clauses.json` against `clause-tree.schema.json`: PASS
- `data/processed/xx-test-fixture/documents/fixture-map-atlas.annotations.json` against `annotations.schema.json`: PASS
- `data/processed/xx-test-fixture/amendments.json` against `amendments.schema.json`: PASS
- `data/processed/xx-test-fixture/consolidated.json` against `consolidated.schema.json`: PASS
- `data/processed/xx-test-fixture/zones.geojson` against `zones.schema.json`: PASS
- `data/processed/xx-test-fixture/geo-layers.json` against `geo-layers.schema.json`: PASS
- `data/processed/xx-test-fixture/clause-zone-tags.json` against `clause-zone-tags.schema.json`: PASS
- `data/processed/xx-test-fixture/declarations.json` against `declarations.schema.json`: PASS
- `data/processed/xx-test-fixture/relations.json` against `relations.schema.json`: PASS

## 2. QA Checks Executed

| # | Check | Status | Details |
|---|---|---|---|
| 1 | Clause `legal_status` present & valid | PASS | 25/25 valid |
| 2 | Clause citation page >= 1 | PASS | 25/25 valid |
| 3 | Citation bounding box (`bbox`) coverage | PASS | 25/25 citations (100.0%) have bbox (>= 95% threshold) |
| 4 | Clause numbering continuity (with source page citations) | PASS | Duplicates: 0; Source-native gaps: 0 (none) |
| 5 | Clauses with empty text | PASS | 0 empty clause(s) |
| 6 | Page text character coverage (>= 98%) & known gaps | PASS | Page text coverage: `fixture-base-2020`: 86.1% (1256/1459 content chars); `fixture-amend-2024`: 75.4% (478/634 content chars); `fixture-draft-2026`: 66.2% (137/207 content chars); `fixture-map-atlas`: 37.8% (31/82 content chars); 0 known gap(s) recorded in `declarations.json` |
| 7 | Unresolved cross-references | PASS | 0 unresolved (none) |
| 8 | Low-confidence amendment links | PASS | 0 low-confidence link(s) |
| 9 | Drafts referenced from `in_force` clauses | PASS | 0 draft reference(s) |
| 10 | Structure gates (no date clause numbers, depth <= 6, uniqueness, table captions) | PASS | Date tokens: 0; Depth > 6: 0; Duplicates: 0; Redundant table labels: 0 |
| 11 | Non-content excluded from topics and zones | PASS | 0 non-content topic/zone tag(s) |
| 12 | Explicit `instrument_type` & status/text-rights invariants | PASS | 4/4 valid |

## 3. Declarations Summary

- **Not Modelled**: 1
- **Known Gaps**: 0
- **Unread Documents**: 1
- **Unobtainable Documents**: 0
- **Contested Status**: 0

## 4. Stratified 30-Node Self-Check Against Rendered PDF Pages

## 5. Applied Amendment Effect Verification (Page-Image Self-Check)

| # | Effect ID | Amending Doc & EID | Source Page & Image Dim (150 DPI) | Target Doc & EID | Action | Valid From | Applied | Resulting Consolidated / Unapplied Note | Result |
|---:|---|---|---|---|---|---|---|---|---|
| 1 | `fixture-amend-2024:eff_1` | `fixture-amend-2024:cl_2` | p. 1 (`1241x1754`) | `fixture-base-2020:chp_II__cl_2.2` | `substitute` | `2024-06-15` | `Yes` | `No residential building in zone Z1 shall exceed 15.0 metres in height,` | PASS |
| 2 | `fixture-amend-2024:eff_2` | `fixture-amend-2024:cl_3` | p. 1 (`1241x1754`) | `fixture-base-2020:chp_II__cl_2.2` | `insert_after` | `2024-06-15` | `Yes` | `Elevated solar panels up to 1.8 metres above the parapet are exempt fr` | PASS |
| 3 | `fixture-amend-2024:eff_3` | `fixture-amend-2024:cl_4` | p. 1 (`1241x1754`) | `fixture-base-2020:chp_II__cl_2.3` | `omit` | `2024-06-15` | `Yes` | `Applied` | PASS |

## 6. Annotation Quality Summary (`08b` §2)

| Document | Definitions Found | Rejected Stopword/Unquoted Terms | Term Uses per Provision (Median / Max) | References (Resolved / External / Unresolved) | Provision Types by Kind |
|---|---:|---:|---|---|---|
| `fixture-amend-2024` | 0 | 0 | `0.0` / `0` | `0` / `0` / `4` | `obligation`: 3 |
| `fixture-base-2020` | 1 | 0 | `1.0` / `1` | `3` / `0` / `0` | `definition`: 1, `exception`: 1, `obligation`: 2, `scope`: 1 |
| `fixture-draft-2026` | 0 | 0 | `0.0` / `0` | `0` / `0` / `0` | none |
| `fixture-map-atlas` | 0 | 0 | `0.0` / `0` | `0` / `0` / `0` | none |
