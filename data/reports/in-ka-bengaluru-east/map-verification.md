# Map & Geospatial Verification Report — `in-ka-bengaluru-east` (Bengaluru East City Corporation)

**Step**: PR 06–07 / Plan v2.0 §5.C1–C4 · **Verification Cap**: `machine_checked` (Rule R10)

## 1. Coverage & Coordinate Reference System Summary

- **Corporation Boundary Area (`boundary.geojson`)**: 163.68 sq.km (Bounds `EPSG:4326`: `[77.632716, 12.902026, 77.784064, 13.085152]`; Geometry: Valid (`is_valid=True`))
- **GBA Zones Within Corporation (`gba-zones.geojson`)**: 2
- **Official Wards Within Corporation (`wards.geojson`)**: 50 (47 valid in source, 3 repaired via `shapely.make_valid`)
- **Intersecting Planning Districts (`planning-districts.geojson`)**: 0
- **Active Master Plan Zone Polygons (`zones.geojson`)**: 0
- **Zoned Area Coverage Within Corporation**: **0.0%**
- **Derived Overlay Features (`overlays.geojson`)**: 0

## 2. Official GBA Zones (`gba-zones.geojson`)

| Zone Code | Zone Name | Corporation Attribute | Area | Geometry Validation |
|---|---|---|---|---|
| `Zone1` | Mahadevapura | `East` | 107.41 sq.km | Repaired via `make_valid` (Ring Self-intersection[77.705874 12.999308]) |
| `Zone2` | K.R. Pura | `East` | 56.27 sq.km | Repaired via `make_valid` (Ring Self-intersection[77.705874 12.999308]) |

## 3. Official Delimitation Wards (`wards.geojson` — 50 Wards) & Notification Cross-Check

- **Selection Method (Rule R1)**: Selected deterministically by source attribute `Corporation == "East"` from `https://gisapps.bbmp.gov.in/geoserver/wfs?service=WFS&version=1.1.0&request=GetFeature&typeName=gba_boundary:ward_369_final&outputFormat=application/vnd.google-earth.kml+xml&srsName=EPSG:4326`.
- **Notification Cross-Check**: Cross-checked against the official GBA Ward Delimitation notification (gba_boundary:ward_369_final, November 2025): 50 wards in Bengaluru East City Corporation (out of 369 GBA wards total).

| Ward No. | Ward Name (EN) | Ward Name (KN) | GBA Zone | Assembly Constituency | Population (`TOT_P`) | Area | Geometry Validation |
|---:|---|---|---|---|---:|---:|---|
| `1` | K Narayanapura | ಕೆ ನಾರಾಯಣಪುರ | Zone2 (K.R. Pura) | 151 - K.R. Pura | 15003.0 | 4.77 sq.km | Valid (`is_valid=True`) |
| `2` | Horamavu | ಹೊರಮಾವು | Zone2 (K.R. Pura) | 151 - K.R. Pura | 14756.0 | 7.82 sq.km | `make_valid` (Ring Self-intersection[77.643765 13.038965]) |
| `3` | Chellakere | ಚೆಲ್ಲಕೆರೆ | Zone2 (K.R. Pura) | 151 - K.R. Pura | 17010.0 | 1.67 sq.km | Valid (`is_valid=True`) |
| `4` | Babusab Palya | ಬಾಬುಸಾಬ್ ಪಾಳ್ಯ | Zone2 (K.R. Pura) | 151 - K.R. Pura | 19361.0 | 1.83 sq.km | Valid (`is_valid=True`) |
| `5` | Hoysala Nagara East | ಹೊಯ್ಸಳ ನಗರ ಪೂರ್ವ | Zone2 (K.R. Pura) | 151 - K.R. Pura | 18244.0 | 1.61 sq.km | Valid (`is_valid=True`) |
| `6` | Kalkere | ಕಲ್ಕೆರೆ | Zone2 (K.R. Pura) | 151 - K.R. Pura | 17359.0 | 3.84 sq.km | Valid (`is_valid=True`) |
| `7` | K Chennasandra | ಕೆ ಚೆನ್ನಸಂದ್ರ | Zone2 (K.R. Pura) | 151 - K.R. Pura | 14572.0 | 2.12 sq.km | Valid (`is_valid=True`) |
| `8` | Anandapura | ಆನಂದಪುರ | Zone2 (K.R. Pura) | 151 - K.R. Pura | 18898.0 | 2.21 sq.km | Valid (`is_valid=True`) |
| `9` | Bhattarahalli | ಭಟ್ಟರಹಳ್ಳಿ | Zone2 (K.R. Pura) | 151 - K.R. Pura | 14911.0 | 2.57 sq.km | Valid (`is_valid=True`) |
| `10` | Basavanapura | ಬಸವನಪುರ | Zone2 (K.R. Pura) | 151 - K.R. Pura | 16224.0 | 3.94 sq.km | Valid (`is_valid=True`) |
| `11` | Krishnanagar | ಕೃಷ್ಣನಗರ | Zone2 (K.R. Pura) | 151 - K.R. Pura | 16000.0 | 1.23 sq.km | Valid (`is_valid=True`) |
| `12` | Devasandra | ದೇವಸಂದ್ರ | Zone2 (K.R. Pura) | 151 - K.R. Pura | 14990.0 | 1.29 sq.km | `make_valid` (Ring Self-intersection[77.705874 12.999308]) |
| `13` | Rajarajeshwari Temple ward | ರಾಜರಾಜೇಶ್ವರಿ ದೇವಸ್ಥಾನ ವಾರ್ಡ್ | Zone2 (K.R. Pura) | 151 - K.R. Pura | 17539.0 | 1.36 sq.km | `make_valid` (Ring Self-intersection[77.690672 12.997264]) |
| `14` | K.R Pura | ಕೆ ಆರ್ ಪುರ | Zone2 (K.R. Pura) | 151 - K.R. Pura | 14930.0 | 0.89 sq.km | Valid (`is_valid=True`) |
| `15` | Ramamurthy Nagara | ರಾಮಮೂರ್ತಿ ನಗರ | Zone2 (K.R. Pura) | 151 - K.R. Pura | 17257.0 | 0.80 sq.km | Valid (`is_valid=True`) |
| `16` | Kotthur | ಕೊತ್ತೂರು | Zone2 (K.R. Pura) | 151 - K.R. Pura | 14653.0 | 1.24 sq.km | Valid (`is_valid=True`) |
| `17` | Vijinapura | ವಿಜಿನಾಪುರ | Zone2 (K.R. Pura) | 151 - K.R. Pura | 15133.0 | 0.33 sq.km | Valid (`is_valid=True`) |
| `18` | Dooravaninagar | ದೂರವಾಣಿನಗರ | Zone2 (K.R. Pura) | 151 - K.R. Pura | 14677.0 | 1.25 sq.km | Valid (`is_valid=True`) |
| `19` | K.S. Nissar Ahmed Ward | ಕೆ. ಎಸ್. ನಿಸಾರ್ ಅಹಮದ್ ವಾರ್ಡ್ | Zone2 (K.R. Pura) | 151 - K.R. Pura | 15446.0 | 0.84 sq.km | Valid (`is_valid=True`) |
| `20` | A Narayanapura | ಎ ನಾರಾಯಣಪುರ | Zone2 (K.R. Pura) | 151 - K.R. Pura | 21640.0 | 1.30 sq.km | Valid (`is_valid=True`) |
| `21` | Uday Nagar | ಉದಯ್ ನಗರ | Zone2 (K.R. Pura) | 151 - K.R. Pura | 20262.0 | 0.78 sq.km | Valid (`is_valid=True`) |
| `22` | Mahadevapura | ಮಹದೇವಪುರ | Zone2 (K.R. Pura) | 151 - K.R. Pura | 17381.0 | 2.71 sq.km | Valid (`is_valid=True`) |
| `23` | Sangama Ward | ಸಂಗಮ ವಾರ್ಡ್ | Zone2 (K.R. Pura) | 151 - K.R. Pura | 15835.0 | 1.99 sq.km | Valid (`is_valid=True`) |
| `24` | Vignananagara | ವಿಜ್ಞಾನನಗರ | Zone2 (K.R. Pura) | 151 - K.R. Pura | 14649.0 | 1.33 sq.km | Valid (`is_valid=True`) |
| `25` | L.B Shastri Nagar | ಎಲ್.ಬಿ.ಶಾಸ್ತ್ರಿ ನಗರ | Zone2 (K.R. Pura) | 151 - K.R. Pura | 14946.0 | 0.42 sq.km | Valid (`is_valid=True`) |
| `26` | Jagadish Nagar | ಜಗದೀಶ್ ನಗರ | Zone2 (K.R. Pura) | 151 - K.R. Pura | 18479.0 | 1.42 sq.km | Valid (`is_valid=True`) |
| `27` | Vibhootipura | ವಿಭೂತಿಪುರ | Zone2 (K.R. Pura) | 151 - K.R. Pura | 16475.0 | 4.72 sq.km | Valid (`is_valid=True`) |
| `28` | Byrathi | ಬೈರತಿ | Zone1 (Mahadevapura) | 174 - Mahadevapura | 13969.0 | 5.74 sq.km | Valid (`is_valid=True`) |
| `29` | Hoodi | ಹೂಡಿ | Zone1 (Mahadevapura) | 174 - Mahadevapura | 20699.0 | 4.19 sq.km | Valid (`is_valid=True`) |
| `30` | Belathur | ಬೆಳತ್ತೂರ್ | Zone1 (Mahadevapura) | 174 - Mahadevapura | 20869.0 | 7.65 sq.km | Valid (`is_valid=True`) |
| `31` | Kadugodi | ಕಾಡುಗೋಡಿ | Zone1 (Mahadevapura) | 174 - Mahadevapura | 18927.0 | 4.51 sq.km | Valid (`is_valid=True`) |
| `32` | Channasandra | ಚನ್ನಸಂದ್ರ | Zone1 (Mahadevapura) | 174 - Mahadevapura | 14621.0 | 2.27 sq.km | Valid (`is_valid=True`) |
| `33` | S.M Krishna Ward | ಎಸ್.ಎಂ ಕೃಷ್ಣ ವಾರ್ಡ್ | Zone1 (Mahadevapura) | 174 - Mahadevapura | 16262.0 | 4.91 sq.km | Valid (`is_valid=True`) |
| `34` | Kaveri Nagara | ಕಾವೇರಿ ನಗರ | Zone1 (Mahadevapura) | 174 - Mahadevapura | 20959.0 | 2.88 sq.km | Valid (`is_valid=True`) |
| `35` | Garudachar Palya | ಗರುಡಾಚಾರ್ ಪಾಳ್ಯ | Zone1 (Mahadevapura) | 174 - Mahadevapura | 20983.0 | 1.31 sq.km | Valid (`is_valid=True`) |
| `36` | Bharath Aikya Ward | ಭಾರತ್ ಐಕ್ಯ ವಾರ್ಡ್ | Zone1 (Mahadevapura) | 174 - Mahadevapura | 19498.0 | 3.94 sq.km | Valid (`is_valid=True`) |
| `37` | Kundalahalli | ಕುಂದಲಹಳ್ಳಿ | Zone1 (Mahadevapura) | 174 - Mahadevapura | 18217.0 | 5.65 sq.km | Valid (`is_valid=True`) |
| `38` | Whitefield | ವೈಟ್‌ಫೀಲ್ಡ್ | Zone1 (Mahadevapura) | 174 - Mahadevapura | 20265.0 | 4.45 sq.km | Valid (`is_valid=True`) |
| `39` | Hagaduru | ಹಗದೂರು | Zone1 (Mahadevapura) | 174 - Mahadevapura | 15105.0 | 5.80 sq.km | Valid (`is_valid=True`) |
| `40` | Varthur | ವರ್ತೂರು | Zone1 (Mahadevapura) | 174 - Mahadevapura | 20908.0 | 9.15 sq.km | Valid (`is_valid=True`) |
| `41` | Munnenkolalu | ಮುನ್ನೇನಕೊಳಲು | Zone1 (Mahadevapura) | 174 - Mahadevapura | 20977.0 | 2.48 sq.km | Valid (`is_valid=True`) |
| `42` | Priyadarshini Ward | ಪ್ರಿಯದರ್ಶಿನಿ ವಾರ್ಡ್ | Zone1 (Mahadevapura) | 174 - Mahadevapura | 16847.0 | 1.60 sq.km | Valid (`is_valid=True`) |
| `43` | Dodda Nekkundi | ದೊಡ್ಡ ನೆಕ್ಕುಂಡಿ | Zone1 (Mahadevapura) | 174 - Mahadevapura | 16961.0 | 3.64 sq.km | Valid (`is_valid=True`) |
| `44` | Ashwath Nagar | ಅಶ್ವಥ್ ನಗರ | Zone1 (Mahadevapura) | 174 - Mahadevapura | 15851.0 | 1.27 sq.km | Valid (`is_valid=True`) |
| `45` | Marathahalli | ಮಾರತಹಳ್ಳಿ | Zone1 (Mahadevapura) | 174 - Mahadevapura | 17823.0 | 1.00 sq.km | Valid (`is_valid=True`) |
| `46` | Yamalur | ಯಮಲೂರು | Zone1 (Mahadevapura) | 174 - Mahadevapura | 17526.0 | 7.06 sq.km | Valid (`is_valid=True`) |
| `47` | Bellanduru | ಬೆಳ್ಳಂದೂರು | Zone1 (Mahadevapura) | 174 - Mahadevapura | 16685.0 | 1.91 sq.km | Valid (`is_valid=True`) |
| `48` | Panathur | ಪಣತ್ತೂರು | Zone1 (Mahadevapura) | 174 - Mahadevapura | 14766.0 | 8.66 sq.km | Valid (`is_valid=True`) |
| `49` | Doddakannelli Ward | ದೊಡ್ಡಕನ್ನೆಲ್ಲಿ ವಾರ್ಡ್ | Zone1 (Mahadevapura) | 174 - Mahadevapura | 15012.0 | 4.57 sq.km | Valid (`is_valid=True`) |
| `50` | Gunjur | ಗುಂಜೂರು | Zone1 (Mahadevapura) | 174 - Mahadevapura | 15085.0 | 12.74 sq.km | Valid (`is_valid=True`) |

## 4. Per-Planning-District / Sheet Verification & Printed-Grid Georeferencing

| Planning District | Source Sheet | Extraction & CRS Method | Polygons | Zone Codes Present | Clipped Area | Status |
|---|---|---|---|---|---|---|
| — | — | — | 0 | — | 0.00 sq.km | — |

## 5. Land-Use Zone Distribution (`zones.geojson`)

| Zone Code | Total Clipped Area | Share of Zoned Area |
|---|---|---|
| — | 0.00 sq.km | 0.0% |

## 6. Existing Land Use Cross-Check & Overlay Notes

- **Existing Land Use Cross-Check (Plan v2.0 §5.C3)**: Master plan zones reflect statutory *proposed/permissible* zoning and are never altered to match existing land use.
- No additional overlay layers configured.
