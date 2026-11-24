# Project Progress Tracker — PR Plan Series (01–11)

Tracks the 11-PR remediation series defined in [`docs/plans/pr-series/00-overview.md`](plans/pr-series/00-overview.md).

## PR Series Status

| PR | Title | Depends on | Status | Change | Date |
|----|-------|------------|--------|--------|------|
| **01** | Contain production | — | ✅ Complete | `261124-tuou-pr-01-contain-production` | 2026-11-24 |
| **02** | Provenance gate and repository sync | 01 | ✅ Complete | `261124-fcwm-pr-02-provenance-gate-repo-sync` | 2026-11-24 |
| **03** | Schema 1.3: three layers | 02 | ✅ Complete | `261124-llmz-pr-03-schema-three-layers` | 2026-11-24 |
| **04** | Acquire core documents and reconnaissance (Checkpoint 1) | 03 | ✅ Complete | `261124-986m-pr-04-acquire-core-documents` | 2026-11-24 |
| **05** | Structure the two anchor documents (Checkpoint 2) | 04 | Pending | — | — |
| **06** | Real map foundation and official boundaries | 02 | Pending | — | — |
| **07** | One land-use sheet (Checkpoint 3) | 06 | Pending | — | — |
| **08** | Building Bye-laws amendment chain | 05 | Pending | — | — |
| **09** | Zoning Regulations amendment chain | 05 | Pending | — | — |
| **10** | Supporting provisions | 08, 09 | Pending | — | — |
| **11** | All land-use sheets, zone links and release | 07, 09 | Pending | — | — |

## Release Status (`in-ka-bengaluru-south`)

- **Release `1.0.0`**: **Withdrawn** ("Synthetic demonstration data, not the law of Bengaluru South"; downloadable files removed from `public/data/` in PR 01, and all generated source/override/report files removed from `data/` in PR 02).
- **Schema 1.3 (Three Layers)**: Active across all 12 JSON Schemas, pipeline stages, and web Document viewer (PR 03).
- **Core Source Register (PR 04 — Checkpoint 1)**: 12 core instruments registered in `jurisdictions/in-ka-bengaluru-south.yaml` (10 acquired PDFs with verified SHA-256 digests, quoted R17 status evidence, and Wayback Machine snapshots; 2 unobtainable notifications declared `not_found` per R16), reconnaissance report and PR 05 structuring rules in `data/reports/in-ka-bengaluru-south/recon.md`, and pre-release register published at `/j/in-ka-bengaluru-south/sources` (`"Not yet structured"`).
- **Current public release status**: `"No data published yet"` — structured clauses and official maps will be published starting at Release `2.0.0` (PR 05).
