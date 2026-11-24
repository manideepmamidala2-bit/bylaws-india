# Quality Assurance Report — `xx-test-fixture` (Synthetic Test Jurisdiction)

## 1. Schema v1.3 Validation

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
- `data/processed/xx-test-fixture/amendments.json` against `amendments.schema.json`: PASS
- `data/processed/xx-test-fixture/consolidated.json` against `consolidated.schema.json`: PASS
- `data/processed/xx-test-fixture/zones.geojson` against `zones.schema.json`: PASS
- `data/processed/xx-test-fixture/geo-layers.json` against `geo-layers.schema.json`: PASS
- `data/processed/xx-test-fixture/clause-zone-tags.json` against `clause-zone-tags.schema.json`: PASS
- `data/processed/xx-test-fixture/declarations.json` against `declarations.schema.json`: PASS

## 2. QA Checks Executed

| # | Check | Status | Details |
|---|---|---|---|
| 1 | Clause `legal_status` present & valid | PASS | 24/24 valid |
| 2 | Clause citation page >= 1 | PASS | 24/24 valid |
| 3 | Citation bounding box (`bbox`) coverage | INFO | 24/24 citations (100.0%) have bbox |
| 4 | Clause numbering continuity | PASS | Duplicates: 0; Gaps: 0 (none) |
| 5 | Clauses with empty text | PASS | 0 empty clause(s) |
| 6 | Source page coverage & adapter gaps | INFO | 0 known gap(s) recorded in `declarations.json` |
| 7 | Unresolved cross-references | PASS | 0 unresolved (none) |
| 8 | Low-confidence amendment links | PASS | 0 low-confidence link(s) |
| 9 | Drafts referenced from `in_force` clauses | PASS | 0 draft reference(s) |

## 3. Declarations Summary

- **Not Modelled**: 1
- **Known Gaps**: 0
- **Unread Documents**: 1
- **Unobtainable Documents**: 0
- **Contested Status**: 0
