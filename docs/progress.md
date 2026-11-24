# Project Progress Tracker — PR Plan Series (01–11)

Tracks the 11-PR remediation series defined in [`docs/plans/pr-series/00-overview.md`](plans/pr-series/00-overview.md).

## PR Series Status

| PR | Title | Depends on | Status | Change | Date |
|----|-------|------------|--------|--------|------|
| **01** | Contain production | — | ✅ Complete | `261124-tuou-pr-01-contain-production` | 2026-11-24 |
| **02** | Provenance gate and repository sync | 01 | ✅ Complete | `261124-fcwm-pr-02-provenance-gate-repo-sync` | 2026-11-24 |
| **03** | Schema 1.3: three layers | 02 | ✅ Complete | `261124-llmz-pr-03-schema-three-layers` | 2026-11-24 |
| **04** | Acquire core documents and reconnaissance (Checkpoint 1) | 03 | ✅ Complete | `261124-986m-pr-04-acquire-core-documents` | 2026-11-24 |
| **05** | Structure the two anchor documents (Checkpoint 2) | 04 | ✅ Complete | `261124-fgv0-pr-05-structure-anchor-documents` | 2026-11-24 |
| **06** | Real map foundation and official boundaries | 02 | ✅ Complete | `261124-62ci-pr-06-real-map-foundation` | 2026-11-24 |
| **07** | One land-use sheet (Checkpoint 3) | 06 | Pending | — | — |
| **08** | Building Bye-laws amendment chain | 05 | Pending | — | — |
| **09** | Zoning Regulations amendment chain | 05 | Pending | — | — |
| **10** | Supporting provisions | 08, 09 | Pending | — | — |
| **11** | All land-use sheets, zone links and release | 07, 09 | Pending | — | — |

## Release Status (`in-ka-bengaluru-south`)

- **Release `1.0.0`**: **Withdrawn** ("Synthetic demonstration data, not the law of Bengaluru South"; downloadable files removed from `public/data/` in PR 01, and all generated source/override/report files removed from `data/` in PR 02).
- **Schema 1.3 (Three Layers)**: Active across all 12 JSON Schemas, pipeline stages, and web Document viewer (PR 03).
- **Core Source Register (PR 04 — Checkpoint 1)**: 12 core instruments registered in `jurisdictions/in-ka-bengaluru-south.yaml` (10 acquired PDFs with verified SHA-256 digests, quoted R17 status evidence, and Wayback Machine snapshots; 2 unobtainable notifications declared `not_found` per R16), reconnaissance report and PR 05 structuring rules in `data/reports/in-ka-bengaluru-south/recon.md`, and pre-release register published at `/j/in-ka-bengaluru-south/sources` (`"Not yet structured"`).
- **Release `2.0.0` (PR 05 — Checkpoint 2)**: **Published** with the two base anchor documents (`bbl-2003` with 1,069 nodes / 23 tables / 7,163 annotations across 84 pages, and `rmp2015-zr` with 656 nodes / 43 tables / 476 annotations across 69 pages), parser comparison report (`parser-comparison.md`), 60-node stratified page-image self-check (`qa.md`), side-by-side official + Wayback archive `#page=N` links, and prominent coverage notice (`"Two base documents published. Amendments not yet applied: the text shown is the original wording, which may have been changed since."`).
- **Release `2.1.0` (PR 06 — Real Map Foundation & Official GBA Boundaries)**: **Published** with MapLibre GL JS + PMTiles monochrome `dg2n` street basemap (`public/data/in-ka-bengaluru-south/basemap.pmtiles`, SVG schematic view removed), official GBA Corporation boundary (`boundary.geojson`, 152.28 sq.km), GBA Zones (`gba-zones.geojson`, Zone 1 Jayanagar & Zone 2 Bommanahalli), and 72 Delimitation Wards (`wards.geojson`, cross-checked against official GBA notification PDFs in `map-verification.md`), with interactive ward inspection on `/j/in-ka-bengaluru-south`.
