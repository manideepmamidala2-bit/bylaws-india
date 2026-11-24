# Parser Comparison Report — `xx-test-fixture` (Synthetic Test Jurisdiction)

**Step**: Plan v2.0 §5.B4 · **Adapters Evaluated**: `pypdfium2` (Apache-2.0/BSD-3-Clause), `docling` layout/table pipeline (MIT), `tesseract` (`eng+kan`, Apache-2.0)

| Doc ID | Pages | `pypdfium2` (Blocks / Tables / BBox) | `docling` (Blocks / Tables) | `tesseract` OCR | Selected Adapter & Rationale |
|---|---|---|---|---|---|
| `fixture-base-2020` | 2 | 12 blocks / 1 tbls (100% bbox) | 9 blocks / 1 tbls | 17 blocks | `pypdfium2` (100% text & table fidelity, 100% bbox) |
| `fixture-amend-2024` | 1 | 6 blocks / 0 tbls (100% bbox) | 4 blocks / 0 tbls | 6 blocks | `pypdfium2` (100% text & table fidelity, 100% bbox) |
| `fixture-draft-2026` | 1 | 3 blocks / 0 tbls (100% bbox) | 2 blocks / 0 tbls | 3 blocks | `pypdfium2` (100% text & table fidelity, 100% bbox) |
