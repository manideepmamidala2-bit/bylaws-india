# Map & Geospatial Verification Report — `in-ka-bengaluru-north` (Bengaluru North City Corporation)

**Step**: PR 06–07 / Plan v2.0 §5.C1–C4 · **Verification Cap**: `machine_checked` (Rule R10)

## 1. Coverage & Coordinate Reference System Summary

- **Corporation Boundary Area (`boundary.geojson`)**: 159.81 sq.km (Bounds `EPSG:4326`: `[77.490956, 12.987182, 77.662328, 13.142620]`; Geometry: Valid (`is_valid=True`))
- **GBA Zones Within Corporation (`gba-zones.geojson`)**: 2
- **Official Wards Within Corporation (`wards.geojson`)**: 72 (69 valid in source, 3 repaired via `shapely.make_valid`)
- **Intersecting Planning Districts (`planning-districts.geojson`)**: 0
- **Active Master Plan Zone Polygons (`zones.geojson`)**: 0
- **Zoned Area Coverage Within Corporation**: **0.0%**
- **Derived Overlay Features (`overlays.geojson`)**: 0

## 2. Official GBA Zones (`gba-zones.geojson`)

| Zone Code | Zone Name | Corporation Attribute | Area | Geometry Validation |
|---|---|---|---|---|
| `Zone1` | Byatarayanapura | `North` | 92.76 sq.km | Repaired via `make_valid` (Self-intersection[77.599699009998 13.027862964293]) |
| `Zone2` | Yelahanka | `North` | 67.05 sq.km | Repaired via `make_valid` (Self-intersection[77.599699009998 13.027862964293]) |

## 3. Official Delimitation Wards (`wards.geojson` — 72 Wards) & Notification Cross-Check

- **Selection Method (Rule R1)**: Selected deterministically by source attribute `Corporation == "North"` from `https://gisapps.bbmp.gov.in/geoserver/wfs?service=WFS&version=1.1.0&request=GetFeature&typeName=gba_boundary:ward_369_final&outputFormat=application/vnd.google-earth.kml+xml&srsName=EPSG:4326`.
- **Notification Cross-Check**: Cross-checked against the official GBA Ward Delimitation notification (gba_boundary:ward_369_final, November 2025): 72 wards in Bengaluru North City Corporation (out of 369 GBA wards total).

| Ward No. | Ward Name (EN) | Ward Name (KN) | GBA Zone | Assembly Constituency | Population (`TOT_P`) | Area | Geometry Validation |
|---:|---|---|---|---|---:|---:|---|
| `1` | Raja Kempegowda ward | ರಾಜ ಕೆಂಪೇಗೌಡ ವಾರ್ಡ್ | Zone2 (Yelahanka) | 150 - Yelahanka | 21561.0 | 1.80 sq.km | Valid (`is_valid=True`) |
| `2` | Aerocity | ಏರೋಸಿಟಿ | Zone2 (Yelahanka) | 150 - Yelahanka | 20655.0 | 10.26 sq.km | Valid (`is_valid=True`) |
| `3` | Chowdeshwari ward | ಚೌಡೇಶ್ವರಿ ವಾರ್ಡ್ | Zone2 (Yelahanka) | 150 - Yelahanka | 26795.0 | 6.43 sq.km | Valid (`is_valid=True`) |
| `4` | Nyayanga Badavane | ನ್ಯಾಯಾಂಗ ಬಡಾವಣೆ | Zone2 (Yelahanka) | 150 - Yelahanka | 20006.0 | 2.55 sq.km | Valid (`is_valid=True`) |
| `5` | Yelahanka Satellite Town | ಯಲಹಂಕ ಸ್ಯಾಟಲೈಟ್‌ ಟೌನ್‌ | Zone2 (Yelahanka) | 150 - Yelahanka | 29889.0 | 2.91 sq.km | Valid (`is_valid=True`) |
| `6` | Doddabettahalli | ದೊಡ್ಡಬೆಟ್ಟಹಳ್ಳಿ | Zone2 (Yelahanka) | 150 - Yelahanka | 29553.0 | 5.08 sq.km | Valid (`is_valid=True`) |
| `7` | Attur | ಅಟ್ಟುರು | Zone2 (Yelahanka) | 150 - Yelahanka | 26922.0 | 2.53 sq.km | Valid (`is_valid=True`) |
| `8` | Singapura | ಸಿಂಗಾಪುರ | Zone1 (Byatarayanapura) | 152 - Byatarayanapura | 24794.0 | 2.44 sq.km | Valid (`is_valid=True`) |
| `9` | Kuvempunagara | ಕುವೆಂಪುನಗರ | Zone1 (Byatarayanapura) | 152 - Byatarayanapura | 25815.0 | 5.48 sq.km | Valid (`is_valid=True`) |
| `10` | Vidyaranyapura | ವಿದ್ಯಾರಣ್ಯಪುರ | Zone1 (Byatarayanapura) | 152 - Byatarayanapura | 24887.0 | 1.75 sq.km | Valid (`is_valid=True`) |
| `11` | Doddabommasandra | ದೊಡ್ಡಬೊಮ್ಮಸಂದ್ರ | Zone1 (Byatarayanapura) | 152 - Byatarayanapura | 25941.0 | 4.21 sq.km | Valid (`is_valid=True`) |
| `12` | Thindlu | ತಿಂಡ್ಲು | Zone1 (Byatarayanapura) | 152 - Byatarayanapura | 24289.0 | 7.41 sq.km | Valid (`is_valid=True`) |
| `13` | Kodigehalli | ಕೊಡಿಗೆಹಳ್ಳಿ | Zone1 (Byatarayanapura) | 152 - Byatarayanapura | 28244.0 | 1.35 sq.km | Valid (`is_valid=True`) |
| `14` | Rajiv Gandhi Nagar | ರಾಜೀವ್ ಗಾಂಧಿ ನಗರ | Zone1 (Byatarayanapura) | 152 - Byatarayanapura | 20148.0 | 2.89 sq.km | `make_valid` (Ring Self-intersection[77.590483 13.043086]) |
| `15` | Byatarayanapura | ಬ್ಯಾಟರಾಯನಪುರ | Zone1 (Byatarayanapura) | 152 - Byatarayanapura | 28870.0 | 5.09 sq.km | Valid (`is_valid=True`) |
| `16` | Amruthahalli | ಅಮೃತಹಳ್ಳಿ | Zone1 (Byatarayanapura) | 152 - Byatarayanapura | 21732.0 | 1.32 sq.km | Valid (`is_valid=True`) |
| `17` | Jakkur | ಜಕ್ಕೂರು | Zone1 (Byatarayanapura) | 152 - Byatarayanapura | 28519.0 | 7.81 sq.km | Valid (`is_valid=True`) |
| `18` | Kempapura | ಕೆಂಪಾಪುರ | Zone1 (Byatarayanapura) | 152 - Byatarayanapura | 28936.0 | 5.31 sq.km | Valid (`is_valid=True`) |
| `19` | Thanisandra | ಥಣಿಸಂದ್ರ | Zone1 (Byatarayanapura) | 152 - Byatarayanapura | 28159.0 | 2.73 sq.km | Valid (`is_valid=True`) |
| `20` | Sampigehalli | ಸಂಪಿಗೆಹಳ್ಳಿ | Zone1 (Byatarayanapura) | 152 - Byatarayanapura | 28461.0 | 8.79 sq.km | Valid (`is_valid=True`) |
| `21` | Kogilu | ಕೋಗಿಲು | Zone1 (Byatarayanapura) | 152 - Byatarayanapura | 28728.0 | 11.45 sq.km | Valid (`is_valid=True`) |
| `22` | Nagavara | ನಾಗವಾರ | Zone1 (Byatarayanapura) | 160 - Sarvagnanagar | 20153.0 | 0.96 sq.km | Valid (`is_valid=True`) |
| `23` | Hennur | ಹೆಣ್ಣೂರು | Zone1 (Byatarayanapura) | 160 - Sarvagnanagar | 21706.0 | 1.93 sq.km | Valid (`is_valid=True`) |
| `24` | HBR Layout | ಎಚ್.ಬಿ.ಆರ್. ಲೇಔಟ್ | Zone1 (Byatarayanapura) | 160 - Sarvagnanagar | 20380.0 | 1.79 sq.km | Valid (`is_valid=True`) |
| `25` | Govindapura | ಗೋವಿಂದಪುರ | Zone1 (Byatarayanapura) | 160 - Sarvagnanagar | 21432.0 | 0.56 sq.km | Valid (`is_valid=True`) |
| `26` | Samadhana Nagar | ಸಮಾಧಾನ ನಗರ | Zone1 (Byatarayanapura) | 160 - Sarvagnanagar | 20684.0 | 0.57 sq.km | Valid (`is_valid=True`) |
| `27` | K.G.Halli | ಕೆ.ಜಿ.ಹಳ್ಳಿ | Zone1 (Byatarayanapura) | 160 - Sarvagnanagar | 28238.0 | 0.40 sq.km | Valid (`is_valid=True`) |
| `28` | Venkateshpuram | ವೆಂಕಟೇಶಪುರಂ | Zone1 (Byatarayanapura) | 160 - Sarvagnanagar | 22028.0 | 0.36 sq.km | Valid (`is_valid=True`) |
| `29` | Lingarajpura | ಲಿಂಗರಾಜಪುರ | Zone1 (Byatarayanapura) | 160 - Sarvagnanagar | 26438.0 | 0.92 sq.km | Valid (`is_valid=True`) |
| `30` | Kacharakanahalli | ಕಾಚರಕನಹಳ್ಳಿ | Zone1 (Byatarayanapura) | 160 - Sarvagnanagar | 21873.0 | 1.42 sq.km | `make_valid` (Ring Self-intersection[77.632716 13.027773]) |
| `31` | Kalyan Nagar | ಕಲ್ಯಾಣ ನಗರ | Zone1 (Byatarayanapura) | 160 - Sarvagnanagar | 23746.0 | 1.46 sq.km | Valid (`is_valid=True`) |
| `32` | Banaswadi | ಬಾಣಸವಾಡಿ | Zone1 (Byatarayanapura) | 160 - Sarvagnanagar | 25077.0 | 2.02 sq.km | Valid (`is_valid=True`) |
| `33` | HRBR Layout | ಹೆಚ್‌ಆರ್‌ಬಿಆರ್ ಲೇಔಟ್ | Zone1 (Byatarayanapura) | 160 - Sarvagnanagar | 24637.0 | 0.74 sq.km | Valid (`is_valid=True`) |
| `34` | Subbayanapalya | ಸುಬ್ಬಯ್ಯನಪಾಳ್ಯ | Zone1 (Byatarayanapura) | 160 - Sarvagnanagar | 22175.0 | 0.48 sq.km | Valid (`is_valid=True`) |
| `35` | Kammanahalli | ಕಮ್ಮನಹಳ್ಳಿ | Zone1 (Byatarayanapura) | 160 - Sarvagnanagar | 26646.0 | 0.51 sq.km | Valid (`is_valid=True`) |
| `36` | Maruthi Seva Nagara | ಮಾರುತಿ ಸೇವಾ ನಗರ | Zone1 (Byatarayanapura) | 160 - Sarvagnanagar | 24347.0 | 1.20 sq.km | Valid (`is_valid=True`) |
| `37` | Jeevanahalli | ಜೀವನಹಳ್ಳಿ | Zone1 (Byatarayanapura) | 160 - Sarvagnanagar | 28142.0 | 1.53 sq.km | Valid (`is_valid=True`) |
| `38` | Shampura | ಶಾಂಪುರ | Zone1 (Byatarayanapura) | 159 - Pulakeshinagar | 21846.0 | 0.87 sq.km | Valid (`is_valid=True`) |
| `39` | Kaval Byrasandra | ಕಾವಲ್ ಬೈರಸಂದ್ರ | Zone1 (Byatarayanapura) | 159 - Pulakeshinagar | 21965.0 | 0.73 sq.km | Valid (`is_valid=True`) |
| `40` | Shakthi Nagar | ಶಕ್ತಿ ನಗರ | Zone1 (Byatarayanapura) | 159 - Pulakeshinagar | 20035.0 | 0.33 sq.km | Valid (`is_valid=True`) |
| `41` | Periyar Nagar | ಪೆರಿಯಾರ್ ನಗರ | Zone1 (Byatarayanapura) | 159 - Pulakeshinagar | 19963.0 | 0.25 sq.km | Valid (`is_valid=True`) |
| `42` | Aruna Asif Ali Ward | ಅರುಣಾ ಆಸಿಫ್ ಅಲಿ ವಾರ್ಡ್ | Zone1 (Byatarayanapura) | 159 - Pulakeshinagar | 29461.0 | 0.35 sq.km | Valid (`is_valid=True`) |
| `43` | Varalakshmi Nagar | ವರಲಕ್ಷ್ಮಿ ನಗರ | Zone1 (Byatarayanapura) | 159 - Pulakeshinagar | 26578.0 | 1.68 sq.km | `make_valid` (Self-intersection[77.599699009998 13.027862964293]) |
| `44` | Doddanna Nagar | ದೊಡ್ಡಣ್ಣ ನಗರ | Zone1 (Byatarayanapura) | 159 - Pulakeshinagar | 29566.0 | 0.46 sq.km | Valid (`is_valid=True`) |
| `45` | Kushal Nagar | ಕುಶಾಲ್ ನಗರ | Zone1 (Byatarayanapura) | 159 - Pulakeshinagar | 19954.0 | 0.28 sq.km | Valid (`is_valid=True`) |
| `46` | Sagayapuram | ಸಗಾಯಪುರಂ | Zone1 (Byatarayanapura) | 159 - Pulakeshinagar | 28588.0 | 0.66 sq.km | Valid (`is_valid=True`) |
| `47` | Pulakeshi Nagar | ಪುಲಕೇಶಿ ನಗರ | Zone1 (Byatarayanapura) | 159 - Pulakeshinagar | 21148.0 | 1.30 sq.km | Valid (`is_valid=True`) |
| `48` | S.K Garden | ಎಸ್.ಕೆ. ಗಾರ್ಡನ್ | Zone1 (Byatarayanapura) | 159 - Pulakeshinagar | 20102.0 | 0.99 sq.km | Valid (`is_valid=True`) |
| `49` | Jaya Chamarajendra Nagara | ಜಯ ಚಾಮರಾಜೇಂದ್ರ ನಗರ | Zone2 (Yelahanka) | 158 - Hebbal | 25953.0 | 0.66 sq.km | Valid (`is_valid=True`) |
| `50` | Dinnur | ದಿಣ್ಣೂರು | Zone2 (Yelahanka) | 158 - Hebbal | 27395.0 | 0.51 sq.km | Valid (`is_valid=True`) |
| `51` | Manorayanapalya | ಮನೋರಾಯನಪಾಳ್ಯ | Zone2 (Yelahanka) | 158 - Hebbal | 23684.0 | 0.53 sq.km | Valid (`is_valid=True`) |
| `52` | Vishwanatha Nagenahalli | ವಿಶ್ವನಾಥ ನಾಗೇನಹಳ್ಳಿ | Zone2 (Yelahanka) | 158 - Hebbal | 28859.0 | 0.97 sq.km | Valid (`is_valid=True`) |
| `53` | R.T Nagar | ಆರ್.ಟಿ ನಗರ | Zone2 (Yelahanka) | 158 - Hebbal | 29905.0 | 0.63 sq.km | Valid (`is_valid=True`) |
| `54` | Gangenahalli | ಗಂಗೇನಹಳ್ಳಿ | Zone2 (Yelahanka) | 158 - Hebbal | 24120.0 | 1.08 sq.km | Valid (`is_valid=True`) |
| `55` | Ganganagar | ಗಂಗಾನಗರ | Zone2 (Yelahanka) | 158 - Hebbal | 25186.0 | 0.74 sq.km | Valid (`is_valid=True`) |
| `56` | Hebbal | ಹೆಬ್ಬಾಳ | Zone2 (Yelahanka) | 158 - Hebbal | 27422.0 | 1.10 sq.km | Valid (`is_valid=True`) |
| `57` | Bhoopasandra | ಭೂಪಸಂದ್ರ | Zone2 (Yelahanka) | 158 - Hebbal | 25193.0 | 2.64 sq.km | Valid (`is_valid=True`) |
| `58` | Nagashettyhalli | ನಾಗಶೆಟ್ಟಿಹಳ್ಳಿ | Zone2 (Yelahanka) | 158 - Hebbal | 23289.0 | 0.96 sq.km | Valid (`is_valid=True`) |
| `59` | Geddalahalli | ಗೆದ್ದಲಹಳ್ಳಿ | Zone2 (Yelahanka) | 158 - Hebbal | 23331.0 | 1.46 sq.km | Valid (`is_valid=True`) |
| `60` | Jalahalli | ಜಾಲಹಳ್ಳಿ | Zone2 (Yelahanka) | 154 - Rajarajeshwarinagar | 23400.0 | 1.98 sq.km | Valid (`is_valid=True`) |
| `61` | HMT Ward | ಎಚ್ಎಮ್.ಟಿ ವಾರ್ಡ್ | Zone2 (Yelahanka) | 154 - Rajarajeshwarinagar | 29538.0 | 4.17 sq.km | Valid (`is_valid=True`) |
| `62` | Brundavana Nagara | ಬೃಂದಾವನ ನಗರ | Zone2 (Yelahanka) | 154 - Rajarajeshwarinagar | 28749.0 | 0.67 sq.km | Valid (`is_valid=True`) |
| `63` | J.P PARK | ಜೆಪಿ ಪಾರ್ಕ್ | Zone2 (Yelahanka) | 154 - Rajarajeshwarinagar | 22172.0 | 0.83 sq.km | Valid (`is_valid=True`) |
| `64` | Yeshwanthpura | ಯಶವಂತಪುರ | Zone2 (Yelahanka) | 154 - Rajarajeshwarinagar | 20236.0 | 0.35 sq.km | Valid (`is_valid=True`) |
| `65` | Abbigere | ಅಬ್ಬಿಗೆರೆ | Zone2 (Yelahanka) | 155 - Dasarahalli | 21241.0 | 4.58 sq.km | Valid (`is_valid=True`) |
| `66` | Kammagondanahalli | ಕಮ್ಮಗೊಂಡನಹಳ್ಳಿ | Zone2 (Yelahanka) | 155 - Dasarahalli | 20542.0 | 1.39 sq.km | Valid (`is_valid=True`) |
| `67` | Shettihalli | ಶೆಟ್ಟಿಹಳ್ಳಿ | Zone2 (Yelahanka) | 155 - Dasarahalli | 23313.0 | 3.70 sq.km | Valid (`is_valid=True`) |
| `68` | Mallasandra | ಮಲ್ಲಸಂದ್ರ | Zone2 (Yelahanka) | 155 - Dasarahalli | 26890.0 | 1.19 sq.km | Valid (`is_valid=True`) |
| `69` | Bagalagunte | ಬಾಗಲಗುಂಟೆ | Zone2 (Yelahanka) | 155 - Dasarahalli | 28685.0 | 2.52 sq.km | Valid (`is_valid=True`) |
| `70` | Manjunatha Nagar | ಮಂಜುನಾಥ ನಗರ | Zone2 (Yelahanka) | 155 - Dasarahalli | 27870.0 | 1.49 sq.km | Valid (`is_valid=True`) |
| `71` | Nele Maheshwaramma Temple Ward | ನೆಲೆ ಮಹೇಶ್ವರಮ್ಮ ದೇವಸ್ಥಾನ ವಾರ್ಡ್ | Zone2 (Yelahanka) | 155 - Dasarahalli | 27033.0 | 0.59 sq.km | Valid (`is_valid=True`) |
| `72` | Dasarahalli | ದಾಸರಹಳ್ಳಿ | Zone2 (Yelahanka) | 155 - Dasarahalli | 29082.0 | 0.74 sq.km | Valid (`is_valid=True`) |

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
