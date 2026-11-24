# Open Data Sources & Attribution Registry (`Rule R4`, `Rule R13`, `Rule R15`)

This document records the target upstream data sources, their licences or terms of use, text republishing rights (`Rule R13`), and required attribution strings.

> **Current Status (PR 02)**: Synthetic release `1.0.0` of `in-ka-bengaluru-south` has been withdrawn and removed. All entries in `jurisdictions/in-ka-bengaluru-south.yaml` are currently marked `acquisition_status: pending` and will be fetched from their official `http(s)` origins with full `retrieval` records and Wayback Machine snapshots in PR 04 (core documents) and PRs 06–07 (official boundaries and RMP 2015 land-use sheets).

## 1. Target Base Maps, Boundaries & Geospatial Sources (PRs 06–07)

| Source | Licence / Terms | Required Attribution | Target Usage |
|--------|-----------------|----------------------|--------------|
| **OpenStreetMap & Protomaps** | [Open Database License (ODbL 1.0)](https://opendatacommons.org/licenses/odbl/) / BSD-3-Clause | `© OpenStreetMap contributors · Protomaps` | Vector basemap tiles (PMTiles) and independent road-offset verification |
| **Greater Bengaluru Authority (GBA) / OpenCity** | Public Government Notification / CC BY 4.0 | `Greater Bengaluru Authority / OpenCity Urban Data Portal (CC BY 4.0)` | 2025 Five Corporations (`corporation`), GBA Zones (`gba_zones`), and 369-Ward Delimitation (`wards`) |
| **Bangalore Development Authority (BDA) / BBMP** | Public Statutory Master Plan | `Bangalore Development Authority RMP 2015 Proposed Land Use Sheets` | RMP 2015 Index Map, Planning Districts, and Proposed Land Use Zone Sheets |

## 2. Target Bengaluru South (`in-ka-bengaluru-south`) Core Regulatory Sources (PR 04)

Configured in [`jurisdictions/in-ka-bengaluru-south.yaml`](../jurisdictions/in-ka-bengaluru-south.yaml) with `acquisition_status: pending`:
- **Building Bye-laws Chain**: BBMP Building Bye-laws 2003 (`site.bbmp.gov.in`) and the Bengaluru South City Corporation Building (Amendment) Bye-laws 2026 (`gba.karnataka.gov.in` / `data.opencity.in`).
- **RMP 2015 Zoning Regulations Chain**: RMP 2015 Zoning Regulations base text (`upload.indiacode.nic.in`) and amendments from 2014–2026 (`site.bbmp.gov.in`, `bpas.bbmpgov.in`, `data.opencity.in`, Karnataka Gazette).
- **Copyrighted Standards & Restricted Portals (`text_rights.mode: "reference_only"`, Rule R13)**: National Building Code of India (BIS) and AAI NOCAS colour-coded zoning maps are referenced by link only and never reproduced.

## 3. Synthetic Test Fixtures (`visibility: "test"`)

Used strictly for offline CI and unit tests (`xx-test-fixture` in `pipeline/tests/fixtures/` and `xx-synthetic-city` in `pipeline/tests/fixtures/build_synthetic_jurisdiction.py`). Hidden from production builds via server-side `SHOW_TEST_JURISDICTIONS` filtering.
