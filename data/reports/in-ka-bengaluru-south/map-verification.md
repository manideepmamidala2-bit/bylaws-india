# Map & Geospatial Verification Report — `in-ka-bengaluru-south` (Bengaluru South City Corporation)

**Step**: Plan v2.0 §5.C1–C4 · **Verification Cap**: `machine_checked` (Rule R10)

## 1. Coverage & Coordinate Reference System Summary

- **Corporation Boundary Area (`boundary.geojson`)**: 195.63 sq.km
- **Intersecting Planning Districts (`planning-districts.geojson`)**: 9
- **Active Master Plan Zone Polygons (`zones.geojson`)**: 27
- **Zoned Area Coverage Within Corporation**: **100.0%** (Target >= 95.0%: **PASS**)
- **Derived Overlay Features (`overlays.geojson`)**: 2

## 2. Per-Planning-District / Sheet Verification

| Planning District | Source Sheet | Extraction & CRS Method | Polygons | Zone Codes Present | Clipped Area | Status |
|---|---|---|---|---|---|---|
| `1.09` | `1.09 map (b)- Basavanagudi` | `imported` (UTM 43N `EPSG:32643` -> `EPSG:4326`) | 3 | `C-Central, Park, R-Main` | 21.60 sq.km | PASS (`machine_checked`) |
| `1.10` | `1.10 map (b)- Jayanagar (Note: PD 204 is Benson Town)` | `imported` (UTM 43N `EPSG:32643` -> `EPSG:4326`) | 3 | `C-Business, P&SP, R-Main` | 22.90 sq.km | PASS (`machine_checked`) |
| `1.11` | `1.11 map (b)- BTM Layout` | `imported` (UTM 43N `EPSG:32643` -> `EPSG:4326`) | 3 | `C-Mutation, R-Mixed, T&T` | 14.74 sq.km | PASS (`machine_checked`) |
| `2.13` | `2.13 map (b)- Banashankari West` | `imported` (UTM 43N `EPSG:32643` -> `EPSG:4326`) | 3 | `Park, R-Main, R-Mixed` | 24.31 sq.km | PASS (`machine_checked`) |
| `2.14` | `2.14 map (b)- Banashankari` | `imported` (UTM 43N `EPSG:32643` -> `EPSG:4326`) | 3 | `C-Business, R-Main, T&T` | 24.31 sq.km | PASS (`machine_checked`) |
| `2.15` | `2.15 map (b)- J.P. Nagar` | `imported` (UTM 43N `EPSG:32643` -> `EPSG:4326`) | 3 | `C-Mutation, R-Main, R-Mixed` | 24.31 sq.km | PASS (`machine_checked`) |
| `3.16` | `3.16 map (b)- HSR Layout` | `imported` (UTM 43N `EPSG:32643` -> `EPSG:4326`) | 3 | `I-General, I-HiTech, R-Main` | 20.26 sq.km | PASS (`machine_checked`) |
| `3.17` | `3.17 map (b)- Begur` | `imported` (UTM 43N `EPSG:32643` -> `EPSG:4326`) | 3 | `I-HiTech, R-Main, R-Mixed` | 24.31 sq.km | PASS (`machine_checked`) |
| `3.18` | `3.18 map (b)- Uttarahalli` | `imported` (UTM 43N `EPSG:32643` -> `EPSG:4326`) | 3 | `P&SP, Park, R-Mixed` | 18.90 sq.km | PASS (`machine_checked`) |

## 3. Land-Use Zone Distribution (`zones.geojson`)

| Zone Code | Total Clipped Area | Share of Zoned Area |
|---|---|---|
| `C-Business` | 16.20 sq.km | 8.3% |
| `C-Central` | 8.10 sq.km | 4.1% |
| `C-Mutation` | 13.60 sq.km | 7.0% |
| `I-General` | 8.10 sq.km | 4.1% |
| `I-HiTech` | 16.21 sq.km | 8.3% |
| `P&SP` | 13.36 sq.km | 6.8% |
| `Park` | 21.59 sq.km | 11.0% |
| `R-Main` | 52.67 sq.km | 26.9% |
| `R-Mixed` | 36.55 sq.km | 18.7% |
| `T&T` | 9.26 sq.km | 4.7% |

## 4. Existing Land Use Cross-Check & Overlay Notes

- **Existing Land Use Cross-Check (Plan v2.0 §5.C3)**: Master plan zones reflect statutory *proposed/permissible* zoning and are never altered to match existing land use.
- **`rmp2015-south-planning-districts`**: Bangalore Development Authority Revised Master Plan 2015 Index & PLU Sheets (1:10,000 UTM Zone 43N / WGS 84; PD 204 label corrected to Benson Town per Plan v2.0 §3.3)
- **`overlay-metro-11m` (Namma Metro 11 m Underground Influence Zone (Approximate, Derived))**: `derived_overlay`, `derived=True`, method: Derived by this project via 11 m metric buffer (EPSG:32643 UTM 43N) on either side of Namma Metro underground alignment in Bengaluru South; labelled approximate because outer tunnel wall edges are not officially published (Plan v2.0 §5.C4, Rule R14)
- **`overlay-aai-cczm-ref` (AAI Colour Coded Zoning Map (CCZM) — Reference Link to NOCAS Portal)**: `reference`, `derived=False`, method: External reference link only; CCZM height surfaces are not redistributed or drawn per Plan v2.0 §3.7 and Rule R13
