# Open Data Sources & Attribution Registry (`Rule R4`)

This document records the upstream data sources, their licences or terms of use, and the required attribution strings surfaced in published datasets (`documents.json`, `zones.geojson`) and the web interface.

## 1. Base Maps & Geospatial Control Points

| Source | Licence / Terms | Required Attribution | Usage |
|--------|-----------------|----------------------|-------|
| **OpenStreetMap** | [Open Database License (ODbL 1.0)](https://opendatacommons.org/licenses/odbl/) | `© OpenStreetMap contributors (ODbL)` | Base map tiles and road/intersection ground control points (GCPs) |

## 2. Synthetic Test Fixture (`xx-test-fixture`)

| Source ID | Title | Licence / Terms | Status Evidence |
|-----------|-------|-----------------|-----------------|
| `fixture-base-2020` | Synthetic Municipal Building Regulations 2020 | `CC0-1.0` (synthetic test fixture generated in repository) | Synthetic notification `2020-01-15` (`in_force`) |
| `fixture-amend-2024` | Synthetic Municipal Building (Amendment) Regulations 2024 | `CC0-1.0` (synthetic test fixture generated in repository) | Synthetic amendment notification `2024-06-01` (`in_force`) |
| `fixture-draft-2026` | Draft Synthetic Zoning Revisions 2026 | `CC0-1.0` (synthetic test fixture generated in repository) | Synthetic public draft notice `2026-03-01` (`draft`) |
| `fixture-map-atlas` | Synthetic Planning District Land Use Atlas | `CC0-1.0` (synthetic test fixture generated in repository) | Synthetic planning atlas notification `2020-01-15` (`in_force`) |
| `fixture-pd-01` | Synthetic Planning District 01 Imported Zones | `CC-BY-4.0` (`Synthetic Planning Board Open GIS Portal (CC BY 4.0)`) | Synthetic GIS layer inside `FIX-01` boundary |

## 3. Municipal & Planning Authority Sources (Registry Template for M2+)

Real jurisdiction sources acquired in Milestone M2 (such as Greater Bengaluru Authority / Bengaluru South City Corporation, Bangalore Development Authority RMP 2015, and OpenCity urban data repository mirrors) are recorded with:
- **`status_evidence`**: Direct URL and description of the official gazette notification or government order establishing `in_force`, `draft`, `superseded`, or `withdrawn` status.
- **`licence_or_terms`**: Public government publication / OpenCity open-data attribution terms.
- **Redistribution Policy**: Raw source PDFs are not redistributed in Phase 1; published clause citations link directly to the public `source_url` with `#page=<N>` anchors.
