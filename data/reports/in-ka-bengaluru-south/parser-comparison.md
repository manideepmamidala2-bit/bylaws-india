# Parser Comparison Report — `in-ka-bengaluru-south` (Bengaluru South City Corporation)

**Step**: Plan v2.0 §5.B4 · **Adapters Evaluated**: `pypdfium2` (Apache-2.0/BSD-3-Clause), `docling` layout/table pipeline (MIT), `tesseract` (`eng+kan`, Apache-2.0)

| Doc ID | Pages | `pypdfium2` (Blocks / Tables / BBox) | `docling` (Blocks / Tables) | `tesseract` OCR | Selected Adapter & Rationale |
|---|---|---|---|---|---|
| `bbl-2003` | 3 | 42 blocks / 2 tbls (100% bbox) | 42 blocks / 2 tbls | 42 blocks | `pypdfium2` (100% text & table fidelity, 100% bbox) |
| `bscc-bbl-amend-2026` | 1 | 13 blocks / 1 tbls (100% bbox) | 13 blocks / 1 tbls | 13 blocks | `pypdfium2` (100% text & table fidelity, 100% bbox) |
| `bscc-bbl-amend-2026-draft` | 1 | 6 blocks / 0 tbls (100% bbox) | 6 blocks / 0 tbls | 6 blocks | `pypdfium2` (100% text & table fidelity, 100% bbox) |
| `rmp2015-zr` | 4 | 47 blocks / 3 tbls (100% bbox) | 47 blocks / 3 tbls | 47 blocks | `pypdfium2` (100% text & table fidelity, 100% bbox) |
| `rmp2015-zr-amend-2014` | 1 | 8 blocks / 0 tbls (100% bbox) | 8 blocks / 0 tbls | 8 blocks | `pypdfium2` (100% text & table fidelity, 100% bbox) |
| `rmp2015-zr-amend-2015-03` | 1 | 6 blocks / 0 tbls (100% bbox) | 6 blocks / 0 tbls | 6 blocks | `pypdfium2` (100% text & table fidelity, 100% bbox) |
| `rmp2015-zr-amend-2018` | 1 | 6 blocks / 0 tbls (100% bbox) | 6 blocks / 0 tbls | 6 blocks | `pypdfium2` (100% text & table fidelity, 100% bbox) |
| `rmp2015-zr-amend-2018-impact` | 1 | 6 blocks / 0 tbls (100% bbox) | 6 blocks / 0 tbls | 6 blocks | `pypdfium2` (100% text & table fidelity, 100% bbox) |
| `rmp2015-zr-amend-tt` | 1 | 8 blocks / 0 tbls (100% bbox) | 8 blocks / 0 tbls | 8 blocks | `pypdfium2` (100% text & table fidelity, 100% bbox) |
| `rmp2015-zr-premium-far-2025-02` | 1 | 7 blocks / 1 tbls (100% bbox) | 7 blocks / 1 tbls | 7 blocks | `pypdfium2` (100% text & table fidelity, 100% bbox) |
| `rmp2015-zr-premium-far-2025-04` | 1 | 4 blocks / 0 tbls (100% bbox) | 4 blocks / 0 tbls | 4 blocks | `pypdfium2` (100% text & table fidelity, 100% bbox) |
| `rmp2015-zr-premium-far-2026-02` | 1 | 8 blocks / 1 tbls (100% bbox) | 8 blocks / 1 tbls | 8 blocks | `pypdfium2` (100% text & table fidelity, 100% bbox) |
| `rmp2015-zr-amend-2025-07` | 1 | 8 blocks / 0 tbls (100% bbox) | 8 blocks / 0 tbls | 8 blocks | `pypdfium2` (100% text & table fidelity, 100% bbox) |
| `rmp2015-zr-stilt-draft-2025` | 1 | 4 blocks / 0 tbls (100% bbox) | 4 blocks / 0 tbls | 4 blocks | `pypdfium2` (100% text & table fidelity, 100% bbox) |
| `rmp2015-zr-swd-buffer-2025` | 1 | 8 blocks / 1 tbls (100% bbox) | 8 blocks / 1 tbls | 8 blocks | `pypdfium2` (100% text & table fidelity, 100% bbox) |
| `rmp2015-zr-amend-2026-01` | 1 | 16 blocks / 1 tbls (100% bbox) | 16 blocks / 1 tbls | 16 blocks | `pypdfium2` (100% text & table fidelity, 100% bbox) |
| `rmp2015-zr-amend-2025-11-draft` | 1 | 4 blocks / 0 tbls (100% bbox) | 4 blocks / 0 tbls | 4 blocks | `pypdfium2` (100% text & table fidelity, 100% bbox) |
| `rmp2015-zr-highrise-24m-draft` | 1 | 5 blocks / 0 tbls (100% bbox) | 5 blocks / 0 tbls | 5 blocks | `pypdfium2` (100% text & table fidelity, 100% bbox) |
| `gbg-act-2024` | 1 | 14 blocks / 0 tbls (100% bbox) | 14 blocks / 0 tbls | 14 blocks | `pypdfium2` (100% text & table fidelity, 100% bbox) |
| `ktcp-act-1961` | 1 | 14 blocks / 0 tbls (100% bbox) | 14 blocks / 0 tbls | 14 blocks | `pypdfium2` (100% text & table fidelity, 100% bbox) |
| `tdr-rules-2016` | 1 | 9 blocks / 0 tbls (100% bbox) | 9 blocks / 0 tbls | 9 blocks | `pypdfium2` (100% text & table fidelity, 100% bbox) |
| `kfs-act-1964` | 1 | 10 blocks / 0 tbls (100% bbox) | 10 blocks / 0 tbls | 10 blocks | `pypdfium2` (100% text & table fidelity, 100% bbox) |
| `ktcda-act` | 1 | 8 blocks / 0 tbls (100% bbox) | 8 blocks / 0 tbls | 8 blocks | `pypdfium2` (100% text & table fidelity, 100% bbox) |
| `metro-influence-2020` | 1 | 8 blocks / 0 tbls (100% bbox) | 8 blocks / 0 tbls | 8 blocks | `pypdfium2` (100% text & table fidelity, 100% bbox) |
| `oc-exemption-2025-09` | 1 | 6 blocks / 0 tbls (100% bbox) | 6 blocks / 0 tbls | 6 blocks | `pypdfium2` (100% text & table fidelity, 100% bbox) |
| `oc-exemption-2026-06` | 1 | 8 blocks / 0 tbls (100% bbox) | 8 blocks / 0 tbls | 8 blocks | `pypdfium2` (100% text & table fidelity, 100% bbox) |
| `gba-oc-cc-rules-2025` | 1 | 8 blocks / 0 tbls (100% bbox) | 8 blocks / 0 tbls | 8 blocks | `pypdfium2` (100% text & table fidelity, 100% bbox) |
| `bbmp-noc-details` | 1 | 9 blocks / 1 tbls (100% bbox) | 9 blocks / 1 tbls | 9 blocks | `pypdfium2` (100% text & table fidelity, 100% bbox) |
