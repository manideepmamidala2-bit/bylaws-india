# Map & Geospatial Verification Report — `in-ka-bengaluru-central` (Bengaluru Central City Corporation)

**Step**: PR 06–07 / Plan v2.0 §5.C1–C4 · **Verification Cap**: `machine_checked` (Rule R10)

## 1. Coverage & Coordinate Reference System Summary

- **Corporation Boundary Area (`boundary.geojson`)**: 77.88 sq.km (Bounds `EPSG:4326`: `[77.543865, 12.916345, 77.680439, 13.012389]`; Geometry: Repaired via `make_valid` (Too few points in geometry component[77.5521 12.966269]))
- **GBA Zones Within Corporation (`gba-zones.geojson`)**: 2
- **Official Wards Within Corporation (`wards.geojson`)**: 63 (57 valid in source, 6 repaired via `shapely.make_valid`)
- **Intersecting Planning Districts (`planning-districts.geojson`)**: 0
- **Active Master Plan Zone Polygons (`zones.geojson`)**: 0
- **Zoned Area Coverage Within Corporation**: **0.0%**
- **Derived Overlay Features (`overlays.geojson`)**: 0

## 2. Official GBA Zones (`gba-zones.geojson`)

| Zone Code | Zone Name | Corporation Attribute | Area | Geometry Validation |
|---|---|---|---|---|
| `Zone2` | Gandhinagara | `Central` | 34.69 sq.km | Repaired via `make_valid` (Too few points in geometry component[77.5521 12.966269]) |
| `Zone1` | C.V. Raman Nagar | `Central` | 43.19 sq.km | Repaired via `make_valid` (Self-intersection[77.662631 12.928537]) |

## 3. Official Delimitation Wards (`wards.geojson` — 63 Wards) & Notification Cross-Check

- **Selection Method (Rule R1)**: Selected deterministically by source attribute `Corporation == "Central"` from `https://gisapps.bbmp.gov.in/geoserver/wfs?service=WFS&version=1.1.0&request=GetFeature&typeName=gba_boundary:ward_369_final&outputFormat=application/vnd.google-earth.kml+xml&srsName=EPSG:4326`.
- **Notification Cross-Check**: Cross-checked against the official GBA Ward Delimitation notification (gba_boundary:ward_369_final, November 2025): 63 wards in Bengaluru Central City Corporation (out of 369 GBA wards total).

| Ward No. | Ward Name (EN) | Ward Name (KN) | GBA Zone | Assembly Constituency | Population (`TOT_P`) | Area | Geometry Validation |
|---:|---|---|---|---|---:|---:|---|
| `1` | Ramaswamy Palya | ರಾಮಸ್ವಾಮಿ ಪಾಳ್ಯ | Zone2 (Gandhinagara) | 162 - Shivajinagar | 26124.0 | 0.70 sq.km | Valid (`is_valid=True`) |
| `2` | Jayamahal | ಜಯಮಹಲ್ | Zone2 (Gandhinagara) | 162 - Shivajinagar | 25834.0 | 1.42 sq.km | Valid (`is_valid=True`) |
| `3` | Vasanth Nagar | ವಸಂತ ನಗರ | Zone2 (Gandhinagara) | 162 - Shivajinagar | 28272.0 | 1.95 sq.km | Valid (`is_valid=True`) |
| `4` | Sampangirama Nagar | ಸಂಪಂಗಿರಾಮ ನಗರ | Zone2 (Gandhinagara) | 162 - Shivajinagar | 27874.0 | 4.68 sq.km | Valid (`is_valid=True`) |
| `5` | Shivajinagar | ಶಿವಾಜಿನಗರ | Zone2 (Gandhinagara) | 162 - Shivajinagar | 25484.0 | 1.16 sq.km | `make_valid` (Ring Self-intersection[77.608729 12.977165]) |
| `6` | Bharathi Nagar | ಭಾರತಿ ನಗರ | Zone2 (Gandhinagara) | 162 - Shivajinagar | 24220.0 | 0.34 sq.km | Valid (`is_valid=True`) |
| `7` | K Kamaraj Ward | ಕೆ ಕಾಮರಾಜ್ ವಾರ್ಡ್ | Zone2 (Gandhinagara) | 162 - Shivajinagar | 23193.0 | 1.98 sq.km | Valid (`is_valid=True`) |
| `8` | Halasuru | ಹಲಸೂರು | Zone2 (Gandhinagara) | 162 - Shivajinagar | 24019.0 | 0.51 sq.km | Valid (`is_valid=True`) |
| `9` | Hoysala Nagara Central | ಹೊಯ್ಸಳ ನಗರ ಕೇಂದ್ರ | Zone1 (C.V. Raman Nagar) | 161 - C.V. Raman Nagar | 27798.0 | 1.97 sq.km | Valid (`is_valid=True`) |
| `10` | Cox Town | ಕಾಕ್ಸ್ ಟೌನ್ | Zone1 (C.V. Raman Nagar) | 161 - C.V. Raman Nagar | 21026.0 | 1.24 sq.km | Valid (`is_valid=True`) |
| `11` | Old Baiyappanahalli | ಹಳೆ ಬೈಯಪ್ಪನಹಳ್ಳಿ | Zone1 (C.V. Raman Nagar) | 161 - C.V. Raman Nagar | 18858.0 | 0.55 sq.km | Valid (`is_valid=True`) |
| `12` | Kasturi Nagar | ಕಸ್ತೂರಿ ನಗರ | Zone1 (C.V. Raman Nagar) | 161 - C.V. Raman Nagar | 19331.0 | 3.51 sq.km | Valid (`is_valid=True`) |
| `13` | Krishnaiahnapalya | ಕೃಷ್ಣಯ್ಯನ ಪಾಳ್ಯ | Zone1 (C.V. Raman Nagar) | 161 - C.V. Raman Nagar | 19302.0 | 1.19 sq.km | Valid (`is_valid=True`) |
| `14` | Nagavarapalya | ನಾಗವಾರಪಾಳ್ಯ | Zone1 (C.V. Raman Nagar) | 161 - C.V. Raman Nagar | 24875.0 | 1.96 sq.km | Valid (`is_valid=True`) |
| `15` | Indiranagar | ಇಂದಿರಾನಗರ | Zone1 (C.V. Raman Nagar) | 161 - C.V. Raman Nagar | 19324.0 | 2.98 sq.km | Valid (`is_valid=True`) |
| `16` | New Thippasandra | ನ್ಯೂ ತಿಪ್ಪಸಂದ್ರ | Zone1 (C.V. Raman Nagar) | 161 - C.V. Raman Nagar | 27969.0 | 1.98 sq.km | Valid (`is_valid=True`) |
| `17` | Kaggadasapura | ಕಗ್ಗದಾಸಪುರ | Zone1 (C.V. Raman Nagar) | 161 - C.V. Raman Nagar | 20794.0 | 1.15 sq.km | `make_valid` (Ring Self-intersection[77.667973 12.985491]) |
| `18` | G.M Palya | ಜಿ.ಎಂ. ಪಾಳ್ಯ | Zone1 (C.V. Raman Nagar) | 161 - C.V. Raman Nagar | 20579.0 | 0.84 sq.km | Valid (`is_valid=True`) |
| `19` | Jeevan Bhimanagar | ಜೀವನ್ ಭೀಮನಗರ | Zone1 (C.V. Raman Nagar) | 161 - C.V. Raman Nagar | 27299.0 | 1.40 sq.km | Valid (`is_valid=True`) |
| `20` | Kodihalli | ಕೋಡಿಹಳ್ಳಿ | Zone1 (C.V. Raman Nagar) | 161 - C.V. Raman Nagar | 24057.0 | 1.30 sq.km | Valid (`is_valid=True`) |
| `21` | Konena Agrahara | ಕೋನೇನ ಅಗ್ರಹಾರ | Zone1 (C.V. Raman Nagar) | 161 - C.V. Raman Nagar | 26714.0 | 1.48 sq.km | Valid (`is_valid=True`) |
| `22` | Domluru | ದೊಮ್ಮಲೂರು | Zone1 (C.V. Raman Nagar) | 163 - Shanthinagar | 19982.0 | 1.16 sq.km | Valid (`is_valid=True`) |
| `23` | Jogpalya | ಜೋಗಪಾಳ್ಯ | Zone1 (C.V. Raman Nagar) | 163 - Shanthinagar | 25803.0 | 1.09 sq.km | Valid (`is_valid=True`) |
| `24` | Agaram | ಅಗರಂ | Zone1 (C.V. Raman Nagar) | 163 - Shanthinagar | 28081.0 | 11.04 sq.km | `make_valid` (Self-intersection[77.662631 12.928537]) |
| `25` | Ashokanagar | ಅಶೋಕನಗರ | Zone1 (C.V. Raman Nagar) | 163 - Shanthinagar | 21804.0 | 3.93 sq.km | Valid (`is_valid=True`) |
| `26` | Vannarpet | ವನ್ನಾರ್‌ಪೇಟೆ | Zone1 (C.V. Raman Nagar) | 163 - Shanthinagar | 22858.0 | 0.52 sq.km | Valid (`is_valid=True`) |
| `27` | Ambedkarnagar | ಅಂಬೇಡ್ಕರ್‌ನಗರ | Zone1 (C.V. Raman Nagar) | 163 - Shanthinagar | 27816.0 | 0.39 sq.km | `make_valid` (Ring Self-intersection[77.605858 12.949787]) |
| `28` | Neelasandra | ನೀಲಸಂದ್ರ | Zone1 (C.V. Raman Nagar) | 163 - Shanthinagar | 24853.0 | 0.26 sq.km | Valid (`is_valid=True`) |
| `29` | Austin Town | ಆಸ್ಟಿನ್ ಟೌನ್ | Zone1 (C.V. Raman Nagar) | 163 - Shanthinagar | 19730.0 | 0.42 sq.km | Valid (`is_valid=True`) |
| `30` | Vinayakanagar | ವಿನಾಯಕನಗರ | Zone1 (C.V. Raman Nagar) | 163 - Shanthinagar | 21367.0 | 1.28 sq.km | Valid (`is_valid=True`) |
| `31` | Shanthinagar | ಶಾಂತಿನಗರ | Zone1 (C.V. Raman Nagar) | 163 - Shanthinagar | 24474.0 | 1.54 sq.km | Valid (`is_valid=True`) |
| `32` | SilverJubilee Park Ward | ಸಿಲ್ವರ್ ಜುಬಿಲಿ ಪಾರ್ಕ್ ವಾರ್ಡ್ | Zone2 (Gandhinagara) | 169 - Chickpet | 18858.0 | 0.63 sq.km | Valid (`is_valid=True`) |
| `33` | Dharmaraya Swamy Temple Ward | ಧರ್ಮರಾಯ ಸ್ವಾಮಿ ದೇವಸ್ಥಾನ ವಾರ್ಡ್ | Zone2 (Gandhinagara) | 169 - Chickpet | 18905.0 | 0.76 sq.km | Valid (`is_valid=True`) |
| `34` | D.V Gundappa Ward | ಡಿ.ವಿ. ಗುಂಡಪ್ಪ ವಾರ್ಡ್ | Zone2 (Gandhinagara) | 169 - Chickpet | 20279.0 | 0.71 sq.km | Valid (`is_valid=True`) |
| `35` | Hombegowda Nagara | ಹೊಂಬೇಗೌಡ ನಗರ | Zone2 (Gandhinagara) | 169 - Chickpet | 18866.0 | 0.96 sq.km | Valid (`is_valid=True`) |
| `36` | Someshwara Nagara | ಸೋಮೇಶ್ವರ ನಗರ | Zone2 (Gandhinagara) | 169 - Chickpet | 18863.0 | 0.62 sq.km | Valid (`is_valid=True`) |
| `37` | BHEL Ward | ಬಿಎಚ್‌ಇಎಲ್ ವಾರ್ಡ್ | Zone2 (Gandhinagara) | 169 - Chickpet | 19336.0 | 1.06 sq.km | Valid (`is_valid=True`) |
| `38` | Kanakanapalya | ಕನಕನಪಾಳ್ಯ | Zone2 (Gandhinagara) | 169 - Chickpet | 20054.0 | 0.97 sq.km | Valid (`is_valid=True`) |
| `39` | Venkat Reddy Nagara | ವೆಂಕಟ ರೆಡ್ಡಿ ನಗರ | Zone2 (Gandhinagara) | 169 - Chickpet | 18888.0 | 0.20 sq.km | Valid (`is_valid=True`) |
| `40` | Ashoka Pillar | ಅಶೋಕ ಪಿಲ್ಲರ್‌ | Zone2 (Gandhinagara) | 169 - Chickpet | 18989.0 | 1.55 sq.km | Valid (`is_valid=True`) |
| `41` | V.V Puram | ವಿ.ವಿ. ಪುರಂ | Zone2 (Gandhinagara) | 169 - Chickpet | 19813.0 | 1.08 sq.km | Valid (`is_valid=True`) |
| `42` | Sunkenahalli | ಸುಂಕೇನಹಳ್ಳಿ | Zone2 (Gandhinagara) | 169 - Chickpet | 21179.0 | 1.57 sq.km | Valid (`is_valid=True`) |
| `43` | Devaraj Urs Ward | ದೇವರಾಜ ಅರಸು ವಾರ್ಡ್‌ | Zone2 (Gandhinagara) | 169 - Chickpet | 19525.0 | 0.53 sq.km | Valid (`is_valid=True`) |
| `44` | Chamarajpet | ಚಾಮರಾಜಪೇಟೆ | Zone2 (Gandhinagara) | 168 - Chamrajapet | 25619.0 | 0.89 sq.km | Valid (`is_valid=True`) |
| `45` | K.R Market | ಕೆ.ಆರ್. ಮಾರುಕಟ್ಟೆ | Zone2 (Gandhinagara) | 168 - Chamrajapet | 22413.0 | 0.74 sq.km | Valid (`is_valid=True`) |
| `46` | Cheluvadi Palya | ಚೆಲುವಾದಿ ಪಾಳ್ಯ | Zone2 (Gandhinagara) | 168 - Chamrajapet | 21019.0 | 0.22 sq.km | `make_valid` (Ring Self-intersection[77.570221 12.967956]) |
| `47` | IPD Salappa Ward | ಐಪಿಡಿ ಸಾಲಪ್ಪ ವಾರ್ಡ್ | Zone2 (Gandhinagara) | 168 - Chamrajapet | 20622.0 | 0.49 sq.km | Valid (`is_valid=True`) |
| `48` | Azad Nagar | ಆಜಾದ್ ನಗರ | Zone2 (Gandhinagara) | 168 - Chamrajapet | 20270.0 | 0.41 sq.km | Valid (`is_valid=True`) |
| `49` | Kasturbha Nagar | ಕಸ್ತೂರ ಬಾ ವಾರ್ಡ್‌ | Zone2 (Gandhinagara) | 168 - Chamrajapet | 24488.0 | 0.37 sq.km | Valid (`is_valid=True`) |
| `50` | JJR Nagara | ಜೆಜೆಆರ್ ನಗರ | Zone2 (Gandhinagara) | 168 - Chamrajapet | 27850.0 | 0.53 sq.km | Valid (`is_valid=True`) |
| `51` | Old Guddadahalli | ಹಳೆ ಗುಡ್ಡದಹಳ್ಳಿ | Zone2 (Gandhinagara) | 168 - Chamrajapet | 25228.0 | 0.21 sq.km | `make_valid` (Self-intersection[77.545166 12.962246]) |
| `52` | Padarayanapura | ಪಾದರಾಯನಪುರ | Zone2 (Gandhinagara) | 168 - Chamrajapet | 25833.0 | 0.23 sq.km | Valid (`is_valid=True`) |
| `53` | Rayapuram | ರಾಯಪುರಂ | Zone2 (Gandhinagara) | 168 - Chamrajapet | 23438.0 | 0.21 sq.km | Valid (`is_valid=True`) |
| `54` | Binnypete | ಬಿನ್ನಿಪೇಟೆ | Zone2 (Gandhinagara) | 164 - Gandhinagara | 25018.0 | 0.48 sq.km | Valid (`is_valid=True`) |
| `55` | Bhuvaneshwari Nagar | ಭುವನೇಶ್ವರಿ ನಗರ | Zone2 (Gandhinagara) | 164 - Gandhinagara | 19936.0 | 0.24 sq.km | Valid (`is_valid=True`) |
| `56` | Gopalpura | ಗೋಪಾಲಪುರ | Zone2 (Gandhinagara) | 164 - Gandhinagara | 26986.0 | 1.27 sq.km | Valid (`is_valid=True`) |
| `57` | Cottonpete | ಕಾಟನ್‌ಪೇಟೆ | Zone2 (Gandhinagara) | 164 - Gandhinagara | 27147.0 | 0.96 sq.km | Valid (`is_valid=True`) |
| `58` | Chickpete | ಚಿಕ್ಕಪೇಟೆ | Zone2 (Gandhinagara) | 164 - Gandhinagara | 27619.0 | 0.61 sq.km | Valid (`is_valid=True`) |
| `59` | Nehru Nagar | ನೆಹರು ನಗರ | Zone2 (Gandhinagara) | 164 - Gandhinagara | 25780.0 | 1.80 sq.km | Valid (`is_valid=True`) |
| `60` | Seshadripuram | ಶೇಷಾದ್ರಿಪುರಂ | Zone2 (Gandhinagara) | 164 - Gandhinagara | 19052.0 | 0.38 sq.km | Valid (`is_valid=True`) |
| `61` | Dattatreya Ward | ದತ್ತಾತ್ರೇಯ ವಾರ್ಡ್ | Zone2 (Gandhinagara) | 164 - Gandhinagara | 19627.0 | 0.50 sq.km | Valid (`is_valid=True`) |
| `62` | Swatantra Palya Ward | ಸ್ವತಂತ್ರ ಪಾಳ್ಯ ವಾರ್ಡ್ | Zone2 (Gandhinagara) | 164 - Gandhinagara | 28137.0 | 0.36 sq.km | Valid (`is_valid=True`) |
| `63` | Okalipuram | ಓಕಳಿಪುರಂ | Zone2 (Gandhinagara) | 164 - Gandhinagara | 27815.0 | 0.42 sq.km | Valid (`is_valid=True`) |

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
