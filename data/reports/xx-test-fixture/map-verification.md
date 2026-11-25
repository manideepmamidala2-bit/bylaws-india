# Map & Geospatial Verification Report — `xx-test-fixture` (Synthetic Test Jurisdiction)

**Step**: PR 06–07 / Plan v2.0 §5.C1–C4 · **Verification Cap**: `machine_checked` (Rule R10)

## 1. Coverage & Coordinate Reference System Summary

- **Corporation Boundary Area (`boundary.geojson`)**: 4.85 sq.km (Bounds `EPSG:4326`: `[10.000000, 10.000000, 10.020000, 10.020000]`; Geometry: Valid (`is_valid=True`))
- **GBA Zones Within Corporation (`gba-zones.geojson`)**: 0
- **Official Wards Within Corporation (`wards.geojson`)**: 0 (0 valid in source, 0 repaired via `shapely.make_valid`)
- **Intersecting Planning Districts (`planning-districts.geojson`)**: 0
- **Active Master Plan Zone Polygons (`zones.geojson`)**: 2
- **Zoned Area Coverage Within Corporation**: **81.0%**
- **Derived Overlay Features (`overlays.geojson`)**: 0

## 2. Official GBA Zones (`gba-zones.geojson`)

| Zone Code | Zone Name | Corporation Attribute | Area | Geometry Validation |
|---|---|---|---|---|
| — | — | — | 0.00 sq.km | — |

## 3. Official Delimitation Wards (`wards.geojson` — 0 Wards) & Notification Cross-Check


| Ward No. | Ward Name (EN) | Ward Name (KN) | GBA Zone | Assembly Constituency | Population (`TOT_P`) | Area | Geometry Validation |
|---:|---|---|---|---|---:|---:|---|
| — | — | — | — | — | — | 0.00 sq.km | — |

## 4. Per-Planning-District / Sheet Verification & Printed-Grid Georeferencing

| Planning District | Source Sheet | Extraction & CRS Method | Polygons | Zone Codes Present | Clipped Area | Status |
|---|---|---|---|---|---|---|
| `PD-01` | `Sheet-1` | `imported` (UTM 43N `EPSG:32643` -> `EPSG:4326`) | 2 | `Z1, Z2` | 3.93 sq.km | PASS (`machine_checked`) |

## 5. Land-Use Zone Distribution (`zones.geojson`)

| Zone Code | Total Clipped Area | Share of Zoned Area |
|---|---|---|
| `Z1` | 1.75 sq.km | 44.4% |
| `Z2` | 2.18 sq.km | 55.6% |

## 6. Existing Land Use Cross-Check & Overlay Notes

- **Existing Land Use Cross-Check (Plan v2.0 §5.C3)**: Master plan zones reflect statutory *proposed/permissible* zoning and are never altered to match existing land use.
- No additional overlay layers configured.
