# Project Progress Tracker (`Plan v2.0 — Bengaluru South, Complete`)

Tracks completion of **Plan v2.0** ([`docs/plan-v2.md`](plan-v2.md)) and earlier Phase 1 milestones ([`docs/plan.md`](plan.md), [`docs/plan-v1.1.md`](plan-v1.1.md)).

## Plan v2.0 Execution Summary

| Part / Step | Scope | Status | Change | Date |
|-------------|-------|--------|--------|------|
| **Part A (A1–A2)** | Foundations: Audit 2 integrity fixes, Schema v1.2 codegen, CRS reprojection, strict licence allowlist, `SOURCE_DATE_EPOCH`, general layout/table structuring, and data wiring | ✅ Complete | `261123-izxl-plan-v2-bengaluru-south-complete` | 2026-11-23 |
| **Part B (B1–B7)** | Bengaluru South Sources: 31-instrument source register across 7 layers, acquisition, recon, multi-adapter parse/compare, 28 structured clause trees (139 clauses, 9 tables, Kannada verbatim), 14 amendment links, and 13 consolidated records | ✅ Complete | `261123-izxl-plan-v2-bengaluru-south-complete` | 2026-11-23 |
| **Part C (C1–C5)** | Bengaluru South Maps: Official GBA corporation, 2 GBA zones, 20 wards, 9 RMP 2015 planning districts, 27 UTM 43N land-use zone polygons across 10 zone codes, derived 11 m Namma Metro overlay, and 141 quoted clause–zone tags | ✅ Complete | `261123-izxl-plan-v2-bengaluru-south-complete` | 2026-11-23 |
| **Part D (D1–D3)** | Website & Release `1.0.0`: dg2n visual system (`#f5f3ed` paper, `#ff6b52` selection-only coral), 8 static/client routes, Leaflet map, R12 record version history, R13 reference-only hub, R14 derived notices, blocking `axe-core` WCAG AA CI, and Release `1.0.0` | ✅ Complete | `261123-izxl-plan-v2-bengaluru-south-complete` | 2026-11-23 |

---

## Earlier Phase 1 Milestones

| Milestone | Title | Status | Change | Date |
|-----------|-------|--------|--------|------|
| **M0** | Scaffold | ✅ Complete | `261123-a5ou-m0-m1-scaffold-schemas-fixture` | 2026-11-23 |
| **M1** | Schemas, config loader, fixture | ✅ Complete | `261123-a5ou-m0-m1-scaffold-schemas-fixture` | 2026-11-23 |
| **M1.5** | Pipeline vertical slice, Schema v1.1 codegen & open data setup | ✅ Complete | `261123-8ay2-m1-5-pipeline-vertical-slice` | 2026-11-23 |
| **M2–M9** | Superseded and completed under **Plan v2.0 Parts A–D** above | ✅ Complete | `261123-izxl-plan-v2-bengaluru-south-complete` | 2026-11-23 |

---

## Release `1.0.0` Summary (`in-ka-bengaluru-south`)

- **Jurisdiction**: Bengaluru South City Corporation (`in-ka-bengaluru-south`, `visibility: "public"`, `licence: "CC BY 4.0"`)
- **Documents by Layer (31 total)**:
  - `municipal`: 3 (`bbl-2003`, `bscc-bbl-amend-2026`, `bscc-bbl-amend-2026-draft`)
  - `planning`: 15 (`rmp2015-zr` + 14 amendment/draft notifications from 2014 to 2026)
  - `statute` / `state_rules` / `overlay`: 6 (`gbg-act-2024`, `ktcp-act-1961`, `tdr-rules-2016`, `kfs-act-1964`, `ktcda-act`, `metro-influence-2020`)
  - `orders`: 4 (`oc-exemption-2025-09`, `oc-exemption-2026-06`, `gba-oc-cc-rules-2025`, `bbmp-noc-details`)
  - `national_reference` (`reference_only` per Rule R13): 3 (`nbc-2016`, `aai-cczm`, `model-bbl-2017`)
- **Structured Clauses & Tables**: 28 `.clauses.json` trees, 139 clauses (100% status/page/bbox coverage, verbatim Kannada on `rmp2015-zr-amend-2026-01:1.2`), 9 structured tables, 0 `human_verified` claims.
- **Amendments & Consolidation**: 14 amendment links (`amendments.json`), 13 derived high-confidence consolidated records (`consolidated.json`).
- **Geospatial Layers**: `boundary.geojson` (1 corporation), `gba-zones.geojson` (2 zones), `wards.geojson` (20 wards), `planning-districts.geojson` (9 districts), `zones.geojson` (27 polygons across 10 zone codes, 100% coverage), `overlays.geojson` (2 derived 11 m metro influence corridors), `geo-layers.json` (7 layers), and `clause-zone-tags.json` (141 quoted tags).
