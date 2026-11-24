# Parser Comparison Report — `xx-test-fixture` (Synthetic Test Jurisdiction)

**Step**: Plan v2.0 §5.B4 · **Adapters Evaluated**: `pypdfium2` (Apache-2.0/BSD-3-Clause), `docling` layout/table pipeline (MIT), `tesseract` (`eng+kan`, Apache-2.0)

| Doc ID | Pages | `pypdfium2` (Blocks / Tables / BBox) | `docling` (Blocks / Tables) | `tesseract` OCR | Selected Adapter & Rationale |
|---|---|---|---|---|---|
| `fixture-base-2020` | 2 | 21 blocks / 1 tbls (100% bbox) | 19 blocks / 1 tbls (100% bbox) | 27 blocks (0% bbox) | `pypdfium2` (100% text & table fidelity, 100% bbox) |
| `fixture-amend-2024` | 1 | 8 blocks / 0 tbls (100% bbox) | 5 blocks / 0 tbls (100% bbox) | 8 blocks (0% bbox) | `pypdfium2` (100% text & table fidelity, 100% bbox) |
| `fixture-draft-2026` | 1 | 3 blocks / 0 tbls (100% bbox) | 2 blocks / 0 tbls (100% bbox) | 3 blocks (0% bbox) | `pypdfium2` (100% text & table fidelity, 100% bbox) |
