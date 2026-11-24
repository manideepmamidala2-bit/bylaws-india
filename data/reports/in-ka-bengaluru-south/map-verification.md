# Map & Geospatial Verification Report — `in-ka-bengaluru-south` (Bengaluru South City Corporation)

**Step**: PR 06 / Plan v2.0 §5.C1–C4 · **Verification Cap**: `machine_checked` (Rule R10)

## 1. Coverage & Coordinate Reference System Summary

- **Corporation Boundary Area (`boundary.geojson`)**: 152.28 sq.km (Bounds `EPSG:4326`: `[77.489302, 12.833491, 77.702887, 12.951664]`; Geometry: Repaired via `make_valid` (Ring Self-intersection[77.672328 12.88465]))
- **GBA Zones Within Corporation (`gba-zones.geojson`)**: 2
- **Official Wards Within Corporation (`wards.geojson`)**: 72 (61 valid in source, 11 repaired via `shapely.make_valid`)
- **Intersecting Planning Districts (`planning-districts.geojson`)**: 0
- **Active Master Plan Zone Polygons (`zones.geojson`)**: 0
- **Zoned Area Coverage Within Corporation**: **0.0%**
- **Derived Overlay Features (`overlays.geojson`)**: 0

## 2. Official GBA Zones (`gba-zones.geojson`)

| Zone Code | Zone Name | Corporation Attribute | Area | Geometry Validation |
|---|---|---|---|---|
| `Zone2` | Bommanahalli | `South` | 58.43 sq.km | Repaired via `make_valid` (Too few points in geometry component[77.641158 12.887122]) |
| `Zone1` | Jayanagar | `South` | 93.85 sq.km | Repaired via `make_valid` (Ring Self-intersection[77.663439 12.884434]) |

## 3. Official Delimitation Wards (`wards.geojson` — 72 Wards) & Notification Cross-Check

- **Selection Method (Rule R1)**: Selected deterministically by source attribute `Corporation == "South"` from `https://gisapps.bbmp.gov.in/geoserver/wfs?service=WFS&version=1.1.0&request=GetFeature&typeName=gba_boundary:ward_369_final&outputFormat=application/vnd.google-earth.kml+xml&srsName=EPSG:4326`.
- **Notification Cross-Check**: Cross-checked against the 8 official Assembly-wise GBA Ward Delimitation & Population Notification PDFs on gba.karnataka.gov.in/gba-corporations-delimitation-2025/ (Padmanabanagar, Jayanagar, B.T.M Layout, Anekal, Mahadevapura, Bangalore South, Yeshwanthapura, Bommanahalli): all 72 out of 72 ward numbers (1–72) match; 71 out of 72 English ward names match verbatim; Ward 19 is named 'Tavarekere' in the official GIS layer (gba_boundary:ward_369_final) and 'New Tavarekere' in the Assembly 172 (B.T.M Layout) population table PDF.

| Ward No. | Ward Name (EN) | Ward Name (KN) | GBA Zone | Assembly Constituency | Population (`TOT_P`) | Area | Geometry Validation |
|---:|---|---|---|---|---:|---:|---|
| `1` | Padmanabhanagara | ಪದ್ಮನಾಭನಗರ | Zone1 (Jayanagar) | 171 - Padmanabanagar | 23419.0 | 0.90 sq.km | Valid (`is_valid=True`) |
| `2` | Kadirenahalli | ಕದಿರೇನಹಳ್ಳಿ | Zone1 (Jayanagar) | 171 - Padmanabanagar | 19937.0 | 0.65 sq.km | Valid (`is_valid=True`) |
| `3` | Yarab nagar | ಯಾರಬ್ ನಗರ | Zone1 (Jayanagar) | 171 - Padmanabanagar | 20832.0 | 0.28 sq.km | Valid (`is_valid=True`) |
| `4` | Banashankari Temple Ward | ಬನಶಂಕರಿ ದೇವಸ್ಥಾನ ವಾರ್ಡ್ | Zone1 (Jayanagar) | 171 - Padmanabanagar | 22549.0 | 0.40 sq.km | Valid (`is_valid=True`) |
| `5` | Kane Muneshwara Ward | ಕಾನೆ ಮುನೇಶ್ವರ ವಾರ್ಡ್ | Zone1 (Jayanagar) | 171 - Padmanabanagar | 22022.0 | 1.13 sq.km | Valid (`is_valid=True`) |
| `6` | Gowdanapalya | ಗೌಡನಪಾಳ್ಯ | Zone1 (Jayanagar) | 171 - Padmanabanagar | 24691.0 | 0.91 sq.km | Valid (`is_valid=True`) |
| `7` | Byrasandra | ಬೈರಸಂದ್ರ | Zone1 (Jayanagar) | 173 - Jayanagar | 21108.0 | 1.14 sq.km | `make_valid` (Ring Self-intersection[77.579617 12.933045]) |
| `8` | Tilak Nagara | ತಿಲಕ ನಗರ | Zone1 (Jayanagar) | 173 - Jayanagar | 25625.0 | 1.01 sq.km | Valid (`is_valid=True`) |
| `9` | N.A.L Layout | ಎನ್‌.ಎ.ಎಲ್ ಲೇಔಟ್ | Zone1 (Jayanagar) | 173 - Jayanagar | 20532.0 | 0.35 sq.km | Valid (`is_valid=True`) |
| `10` | Abdul Kalam Nagar | ಅಬ್ದುಲ್ ಕಲಾಂ ನಗರ | Zone1 (Jayanagar) | 173 - Jayanagar | 23124.0 | 0.41 sq.km | Valid (`is_valid=True`) |
| `11` | Jayanagar East | ಜಯನಗರ ಪೂರ್ವ | Zone1 (Jayanagar) | 173 - Jayanagar | 22697.0 | 0.46 sq.km | Valid (`is_valid=True`) |
| `12` | Pattabhirama Nagara | ಪಟ್ಟಾಭಿರಾಮ ನಗರ | Zone1 (Jayanagar) | 173 - Jayanagar | 22547.0 | 1.50 sq.km | Valid (`is_valid=True`) |
| `13` | Marenahalli South | ಮಾರೇನಹಳ್ಳಿ ದಕ್ಷಿಣ | Zone1 (Jayanagar) | 173 - Jayanagar | 23458.0 | 0.76 sq.km | Valid (`is_valid=True`) |
| `14` | J.P Nagar | ಜೆ.ಪಿ. ನಗರ | Zone1 (Jayanagar) | 173 - Jayanagar | 22264.0 | 1.27 sq.km | Valid (`is_valid=True`) |
| `15` | Shakambarinagara | ಶಾಕಂಭರಿನಗರ | Zone1 (Jayanagar) | 173 - Jayanagar | 25845.0 | 1.73 sq.km | Valid (`is_valid=True`) |
| `16` | Sarakki | ಸಾರಕ್ಕಿ | Zone1 (Jayanagar) | 173 - Jayanagar | 23257.0 | 0.68 sq.km | Valid (`is_valid=True`) |
| `17` | N.S Palya | ಎನ್.ಎಸ್. ಪಾಳ್ಯ | Zone2 (Bommanahalli) | 172 - B.T.M Layout | 26701.0 | 0.72 sq.km | Valid (`is_valid=True`) |
| `18` | Viswamanava Kuvempu Ward | ವಿಶ್ವಮಾನವ ಕುವೆಂಪು ವಾರ್ಡ್ | Zone2 (Bommanahalli) | 172 - B.T.M Layout | 25500.0 | 1.39 sq.km | Valid (`is_valid=True`) |
| `19` | Tavarekere | ತಾವರೆಕೆರೆ | Zone2 (Bommanahalli) | 172 - B.T.M Layout | 19251.0 | 0.55 sq.km | Valid (`is_valid=True`) |
| `20` | Madiwala | ಮಡಿವಾಳ | Zone2 (Bommanahalli) | 172 - B.T.M Layout | 25538.0 | 0.69 sq.km | `make_valid` (Self-intersection[77.622729 12.9173]) |
| `21` | Chikka Adugodi | ಚಿಕ್ಕ ಆಡುಗೋಡಿ | Zone2 (Bommanahalli) | 172 - B.T.M Layout | 21468.0 | 0.72 sq.km | Valid (`is_valid=True`) |
| `22` | S.G Palya | ಎಸ್.ಜಿ. ಪಾಳ್ಯ | Zone2 (Bommanahalli) | 172 - B.T.M Layout | 21440.0 | 1.24 sq.km | Valid (`is_valid=True`) |
| `23` | Lakkasandra | ಲಕ್ಕಸಂದ್ರ | Zone2 (Bommanahalli) | 172 - B.T.M Layout | 20932.0 | 0.69 sq.km | Valid (`is_valid=True`) |
| `24` | A Adugodi | ಎ. ಆಡುಗೋಡಿ | Zone2 (Bommanahalli) | 172 - B.T.M Layout | 21458.0 | 1.74 sq.km | `make_valid` (Ring Self-intersection[77.605858 12.949787]) |
| `25` | National Games Village | ನ್ಯಾಷನಲ್ ಗೇಮ್ಸ್ ವಿಲೇಜ್ | Zone2 (Bommanahalli) | 172 - B.T.M Layout | 19407.0 | 0.51 sq.km | Valid (`is_valid=True`) |
| `26` | Ejipura | ಈಜಿಪುರ | Zone2 (Bommanahalli) | 172 - B.T.M Layout | 22239.0 | 0.51 sq.km | Valid (`is_valid=True`) |
| `27` | Sri Lakshmi Devi Ward | ಶ್ರೀ ಲಕ್ಷ್ಮೀದೇವಿ ವಾರ್ಡ್ | Zone2 (Bommanahalli) | 172 - B.T.M Layout | 19844.0 | 0.72 sq.km | Valid (`is_valid=True`) |
| `28` | Kormangala East | ಕೋರಮಂಗಲ ಪೂರ್ವ | Zone2 (Bommanahalli) | 172 - B.T.M Layout | 22885.0 | 2.29 sq.km | Valid (`is_valid=True`) |
| `29` | Kormangala West | ಕೋರಮಂಗಲ ಪಶ್ಚಿಮ | Zone2 (Bommanahalli) | 172 - B.T.M Layout | 27879.0 | 2.44 sq.km | Valid (`is_valid=True`) |
| `30` | Jakkasandra | ಜಕ್ಕಸಂದ್ರ | Zone2 (Bommanahalli) | 172 - B.T.M Layout | 25594.0 | 0.79 sq.km | Valid (`is_valid=True`) |
| `31` | Kasavanahalli | ಕಸವನಹಳ್ಳಿ | Zone2 (Bommanahalli) | 174 - Mahadevapura | 21288.0 | 7.69 sq.km | `make_valid` (Self-intersection[77.6547 12.901803]) |
| `32` | Kudlu | ಕೂಡ್ಲು | Zone2 (Bommanahalli) | 177 - Anekal | 16661.0 | 3.36 sq.km | `make_valid` (Self-intersection[77.653915 12.894532]) |
| `33` | Naganathapura | ನಾಗನಾಥಪುರ | Zone1 (Jayanagar) | 176 - Bangalore South | 18599.0 | 3.35 sq.km | `make_valid` (Ring Self-intersection[77.663439 12.884434]) |
| `34` | Chikkathoguru | ಚಿಕ್ಕ ತೋಗೂರು | Zone1 (Jayanagar) | 176 - Bangalore South | 18868.0 | 5.79 sq.km | Valid (`is_valid=True`) |
| `35` | Vishwapriya Nagara | ವಿಶ್ವಪ್ರಿಯ ನಗರ | Zone1 (Jayanagar) | 176 - Bangalore South | 19281.0 | 2.33 sq.km | Valid (`is_valid=True`) |
| `36` | Beguru | ಬೇಗೂರು | Zone1 (Jayanagar) | 176 - Bangalore South | 18605.0 | 2.89 sq.km | Valid (`is_valid=True`) |
| `37` | Yelenahalli | ಯೆಲೇನಹಳ್ಳಿ | Zone1 (Jayanagar) | 176 - Bangalore South | 18609.0 | 5.04 sq.km | `make_valid` (Self-intersection[77.591188 12.862236]) |
| `38` | Doddakammanahalli | ದೊಡ್ಡಕಮ್ಮನಹಳ್ಳಿ | Zone1 (Jayanagar) | 176 - Bangalore South | 19891.0 | 4.88 sq.km | `make_valid` (Ring Self-intersection[77.591188 12.862237]) |
| `39` | Gottigere | ಗೊಟ್ಟಿಗೆರೆ | Zone1 (Jayanagar) | 176 - Bangalore South | 21839.0 | 2.06 sq.km | Valid (`is_valid=True`) |
| `40` | Anjanapura | ಅಂಜನಾಪುರ | Zone1 (Jayanagar) | 176 - Bangalore South | 23865.0 | 12.16 sq.km | Valid (`is_valid=True`) |
| `41` | Kothanur | ಕೊತ್ತನೂರು | Zone1 (Jayanagar) | 176 - Bangalore South | 23161.0 | 3.45 sq.km | Valid (`is_valid=True`) |
| `42` | RBI Layout | ಆರ್‌ಬಿಐ ಲೇಔಟ್ | Zone1 (Jayanagar) | 176 - Bangalore South | 22569.0 | 2.02 sq.km | Valid (`is_valid=True`) |
| `43` | Bheereshwara Nagar | ಭೀರೇಶ್ವರ ನಗರ | Zone1 (Jayanagar) | 176 - Bangalore South | 26950.0 | 0.83 sq.km | `make_valid` (Self-intersection[77.57548 12.895159]) |
| `44` | Harinagar | ಹರಿನಗರ | Zone1 (Jayanagar) | 176 - Bangalore South | 21893.0 | 1.77 sq.km | Valid (`is_valid=True`) |
| `45` | Konanakunte | ಕೋಣನಕುಂಟೆ | Zone1 (Jayanagar) | 176 - Bangalore South | 20525.0 | 1.65 sq.km | Valid (`is_valid=True`) |
| `46` | Yelachenahalli | ಯೆಲಚೇನಹಳ್ಳಿ | Zone1 (Jayanagar) | 176 - Bangalore South | 23953.0 | 0.92 sq.km | Valid (`is_valid=True`) |
| `47` | Chandranagara | ಚಂದ್ರನಗರ | Zone1 (Jayanagar) | 176 - Bangalore South | 22054.0 | 0.61 sq.km | Valid (`is_valid=True`) |
| `48` | Vasanthapura | ವಸಂತಪುರ | Zone1 (Jayanagar) | 176 - Bangalore South | 22830.0 | 1.58 sq.km | Valid (`is_valid=True`) |
| `49` | Uttarahalli | ಉತ್ತರಹಳ್ಳಿ | Zone1 (Jayanagar) | 176 - Bangalore South | 25302.0 | 2.15 sq.km | Valid (`is_valid=True`) |
| `50` | Sarvabhouma Nagar | ಸಾರ್ವಭೌಮ ನಗರ | Zone1 (Jayanagar) | 176 - Bangalore South | 25256.0 | 1.02 sq.km | Valid (`is_valid=True`) |
| `51` | Subramanyapura | ಸುಬ್ರಹ್ಮಣ್ಯಪುರ | Zone1 (Jayanagar) | 176 - Bangalore South | 27304.0 | 7.71 sq.km | Valid (`is_valid=True`) |
| `52` | Talagattapura | ತಲಘಟ್ಟಪುರ | Zone1 (Jayanagar) | 153 - Yeshwanthapura | 23797.0 | 18.07 sq.km | Valid (`is_valid=True`) |
| `53` | Jaraganahalli | ಜರಗನಹಳ್ಳಿ | Zone2 (Bommanahalli) | 175 - Bommanahalli | 22646.0 | 0.86 sq.km | Valid (`is_valid=True`) |
| `54` | Kengal Hanumanthaiah South | ಕೆಂಗಲ್ ಹನುಮಂತಯ್ಯ ದಕ್ಷಿಣ | Zone2 (Bommanahalli) | 175 - Bommanahalli | 25484.0 | 0.84 sq.km | Valid (`is_valid=True`) |
| `55` | Puttenahalli | ಪುಟ್ಟೇನಹಳ್ಳಿ | Zone2 (Bommanahalli) | 175 - Bommanahalli | 21484.0 | 1.04 sq.km | Valid (`is_valid=True`) |
| `56` | Doresanipalya | ದೊರೆಸಾನಿಪಾಳ್ಯ | Zone2 (Bommanahalli) | 175 - Bommanahalli | 23059.0 | 2.52 sq.km | Valid (`is_valid=True`) |
| `57` | Hulimavu | ಹುಳಿಮಾವು | Zone2 (Bommanahalli) | 175 - Bommanahalli | 19598.0 | 1.33 sq.km | Valid (`is_valid=True`) |
| `58` | Arakere | ಅರಕೆರೆ | Zone2 (Bommanahalli) | 175 - Bommanahalli | 18995.0 | 1.26 sq.km | Valid (`is_valid=True`) |
| `59` | Vijaya Bank Layout | ವಿಜಯ ಬ್ಯಾಂಕ್ ಲೇಔಟ್ | Zone2 (Bommanahalli) | 175 - Bommanahalli | 27787.0 | 4.23 sq.km | Valid (`is_valid=True`) |
| `60` | Bilekahalli | ಬಿಳೇಕಹಳ್ಳಿ | Zone2 (Bommanahalli) | 175 - Bommanahalli | 25208.0 | 2.48 sq.km | Valid (`is_valid=True`) |
| `61` | Kodi Chikkanahalli | ಕೋಡಿ ಚಿಕ್ಕನಹಳ್ಳಿ | Zone2 (Bommanahalli) | 175 - Bommanahalli | 27784.0 | 1.13 sq.km | `make_valid` (Ring Self-intersection[77.622729 12.9173]) |
| `62` | Devarachikkanahalli | ದೇವರಚಿಕ್ಕನಹಳ್ಳಿ | Zone2 (Bommanahalli) | 175 - Bommanahalli | 24847.0 | 1.19 sq.km | Valid (`is_valid=True`) |
| `63` | Bommanahalli | ಬೊಮ್ಮನಹಳ್ಳಿ | Zone2 (Bommanahalli) | 175 - Bommanahalli | 26792.0 | 0.88 sq.km | Valid (`is_valid=True`) |
| `64` | Hongasandra | ಹೊಂಗಸಂದ್ರ | Zone2 (Bommanahalli) | 175 - Bommanahalli | 27790.0 | 0.50 sq.km | Valid (`is_valid=True`) |
| `65` | Garvebavi Palya | ಗಾರ್ವೆಬಾವಿ ಪಾಳ್ಯ | Zone2 (Bommanahalli) | 175 - Bommanahalli | 22967.0 | 1.27 sq.km | Valid (`is_valid=True`) |
| `66` | Singasandra | ಸಿಂಗಸಂದ್ರ | Zone2 (Bommanahalli) | 175 - Bommanahalli | 19089.0 | 1.86 sq.km | Valid (`is_valid=True`) |
| `67` | Bandepalya | ಬಂಡೇಪಾಳ್ಯ | Zone2 (Bommanahalli) | 175 - Bommanahalli | 19744.0 | 1.76 sq.km | Valid (`is_valid=True`) |
| `68` | Mangammana Palya | ಮಂಗಮ್ಮನ ಪಾಳ್ಯ | Zone2 (Bommanahalli) | 175 - Bommanahalli | 23783.0 | 0.59 sq.km | Valid (`is_valid=True`) |
| `69` | Hosapalya | ಹೊಸಪಾಳ್ಯ | Zone2 (Bommanahalli) | 175 - Bommanahalli | 18834.0 | 1.32 sq.km | Valid (`is_valid=True`) |
| `70` | Iblur | ಇಬ್ಬಲೂರು | Zone2 (Bommanahalli) | 175 - Bommanahalli | 27146.0 | 2.80 sq.km | `make_valid` (Ring Self-intersection[77.654796 12.901776]) |
| `71` | Agara | ಅಗರ | Zone2 (Bommanahalli) | 175 - Bommanahalli | 18836.0 | 1.86 sq.km | Valid (`is_valid=True`) |
| `72` | HSR Layout | ಎಚ್‌ಎಸ್‌ಆರ್ ಲೇಔಟ್ | Zone2 (Bommanahalli) | 175 - Bommanahalli | 18787.0 | 2.67 sq.km | Valid (`is_valid=True`) |

## 4. Per-Planning-District / Sheet Verification

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
