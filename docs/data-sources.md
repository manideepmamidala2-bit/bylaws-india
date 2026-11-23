# Open Data Sources & Attribution Registry (`Rule R4` & `Rule R13`)

This document records the upstream data sources, their licences or terms of use, text republishing rights (`Rule R13`), and the required attribution strings surfaced in published datasets (`documents.json`, `sources.json`, `zones.geojson`, `geo-layers.json`) and the web interface.

## 1. Base Maps, Boundaries & Geospatial Sources

| Source | Licence / Terms | Required Attribution | Usage |
|--------|-----------------|----------------------|-------|
| **OpenStreetMap** | [Open Database License (ODbL 1.0)](https://opendatacommons.org/licenses/odbl/) | `© OpenStreetMap contributors (ODbL)` | Base map tiles, Namma Metro alignment reference, and ground control points |
| **Greater Bengaluru Authority (GBA) / OpenCity** | Public Government Notification / CC BY 4.0 | `Greater Bengaluru Authority / OpenCity Urban Data Portal (CC BY 4.0)` | 2025 Five Corporations (`gba-corporations-2025`), GBA Zones, and 369-Ward Delimitation (`gba-wards-2025`) |
| **Bangalore Development Authority (BDA)** | Public Statutory Master Plan / CC BY 4.0 | `Bangalore Development Authority RMP 2015 Proposed Land Use Sheets` | RMP 2015 Planning Districts (`1.09–3.18`) and Master Plan Land Use Zones (`zones.geojson`) |
| **KSRSAC** | Government of Karnataka Reference Map | `Karnataka State Remote Sensing Applications Centre (KSRSAC)` | 2011 / 2017 Existing Land Use (ELU) cross-check reference only |

## 2. Bengaluru South City Corporation (`in-ka-bengaluru-south`) Regulatory Register

Full source metadata (27 instruments across 7 regulatory layers) is maintained in [`docs/sources/in-ka-bengaluru-south.md`](sources/in-ka-bengaluru-south.md) and [`jurisdictions/in-ka-bengaluru-south.yaml`](../jurisdictions/in-ka-bengaluru-south.yaml):
- **Government Statutes, Rules, Regulations, Bye-laws, Notifications & Orders (`text_rights.mode: "full_text"`)**: Published in full under Section 52(1)(q) of the Indian Copyright Act, 1957.
- **Copyrighted Standards & Restricted Portals (`text_rights.mode: "reference_only"`, Rule R13)**:
  - `nbc-2016` (*National Building Code of India 2016*, Bureau of Indian Standards `SP 7:2016`): Recorded as reference metadata and cited-provision pointers only; no text reproduced.
  - `aai-cczm` (*AAI Colour Coded Zoning Maps*, Ministry of Civil Aviation `G.S.R. 751(E)`): Linked to the official [AAI NOCAS Portal](http://nocas2.aai.aero/nocas); height surfaces are not redistributed.
  - `model-bbl-2017` (*Karnataka Model Building Bye-laws 2017*): Recorded as reference metadata with applicability note.

## 3. Synthetic Test Fixture (`xx-test-fixture`, `visibility: "test"`)

| Source ID | Title | Licence / Terms | Status Evidence |
|-----------|-------|-----------------|-----------------|
| `fixture-base-2020` | Synthetic Municipal Building Regulations 2020 | `CC0-1.0` | Synthetic notification `2020-01-15` (`in_force`) |
| `fixture-amend-2024` | Synthetic Municipal Building (Amendment) Regulations 2024 | `CC0-1.0` | Synthetic amendment notification `2024-06-01` (`in_force`) |
| `fixture-draft-2026` | Draft Synthetic Zoning Revisions 2026 | `CC0-1.0` | Synthetic public draft notice `2026-03-01` (`draft`) |
| `fixture-map-atlas` | Synthetic Planning District Land Use Atlas | `CC0-1.0` | Synthetic planning atlas notification `2020-01-15` (`in_force`) |
| `fixture-pd-01` | Synthetic Planning District 01 Imported Zones | `CC BY 4.0` | Synthetic GIS layer inside `FIX-01` boundary |
