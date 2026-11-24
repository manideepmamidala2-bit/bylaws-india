# Map & Geospatial Verification Report — `in-ka-bengaluru-south` (Bengaluru South City Corporation)

**Step**: PR 06–07 / Plan v2.0 §5.C1–C4 · **Verification Cap**: `machine_checked` (Rule R10)

## 1. Coverage & Coordinate Reference System Summary

- **Corporation Boundary Area (`boundary.geojson`)**: 152.28 sq.km (Bounds `EPSG:4326`: `[77.489302, 12.833491, 77.702887, 12.951664]`; Geometry: Repaired via `make_valid` (Ring Self-intersection[77.672328 12.88465]))
- **GBA Zones Within Corporation (`gba-zones.geojson`)**: 2
- **Official Wards Within Corporation (`wards.geojson`)**: 72 (61 valid in source, 11 repaired via `shapely.make_valid`)
- **Intersecting Planning Districts (`planning-districts.geojson`)**: 1
- **Active Master Plan Zone Polygons (`zones.geojson`)**: 868
- **Zoned Area Coverage Within Corporation**: **5.0%**
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

## 4. Per-Planning-District / Sheet Verification & Printed-Grid Georeferencing

| Planning District | Source Sheet | Extraction & CRS Method | Polygons | Zone Codes Present | Clipped Area | Status |
|---|---|---|---|---|---|---|
| `2.10` | `2.10 Jayanagar map (b)` | `grid_georeferenced_raster` (UTM 43N `EPSG:32643` -> `EPSG:4326`) | 868 | `C-AXES, C-BIZ, G-LAKE, G-PARK, I-GEN, I-HITECH, PSP, R-MAIN, R-MIX, T-TRANS` | 7.65 sq.km | PASS (`machine_checked`) |

### Sheet `2.10 Jayanagar map (b)` (Planning District `2.10`)

- **Target CRS**: `EPSG:32643` (UTM Zone 43N, WGS 1984, reprojected to `EPSG:4326`)
- **Printed Grid Control Points (`+`)**: `20`
- **Affine Fit RMSE**: **`0.0032 m`** (Target `<= 10.0 m`: `PASS`)
- **Leave-One-Out (LOO) Cross-Validation RMSE**: **`0.0038 m`**
- **Maximum Grid Residual**: **`0.0046 m`**
- **Independent Check 1 — OpenStreetMap Roads (`basemap.pmtiles`)**: `654` vector road segments compared; **Median offset: `8.02 m`**, **90th-percentile (`p90`) offset: `21.11 m`**, Mean offset: `10.36 m` *(Note: sheet draws road curb/ROW edges while OpenStreetMap draws road centrelines)*.
- **Independent Check 2 — Official GBA Ward Boundaries (`wards.geojson`)**: `364` boundary sample points compared along shared arterial corridors; **Median offset: `28.2 m`**, **90th-percentile (`p90`) offset: `51.9 m`**.
- **Rendered Sheet Image Overlay**: `/data/in-ka-bengaluru-south/sheets/rmp2015-pd-210-b.png` (WGS 84 corners: `[[77.572798, 12.938434], [77.623007, 12.937934], [77.622634, 12.902208], [77.572432, 12.902707]]`)

| Grid ID | PDF X (pt) | PDF Y (pt) | Printed Easting (m) | Printed Northing (m) | Residual (m) | Leave-One-Out Error (m) |
|---|---:|---:|---:|---:|---:|---:|
| `grid_780000_1431000` | 551.679 | 487.389 | 780000.0 | 1431000.0 | 0.0038 | 0.0049 |
| `grid_781000_1431000` | 1118.283 | 487.389 | 781000.0 | 1431000.0 | 0.0037 | 0.0044 |
| `grid_782000_1431000` | 1684.891 | 487.389 | 782000.0 | 1431000.0 | 0.0022 | 0.0026 |
| `grid_783000_1431000` | 2251.500 | 487.389 | 783000.0 | 1431000.0 | 0.0007 | 0.0008 |
| `grid_784000_1431000` | 2818.108 | 487.389 | 784000.0 | 1431000.0 | 0.0019 | 0.0025 |
| `grid_780000_1430000` | 551.679 | 1054.012 | 780000.0 | 1430000.0 | 0.0044 | 0.0052 |
| `grid_781000_1430000` | 1118.283 | 1054.012 | 781000.0 | 1430000.0 | 0.0043 | 0.0047 |
| `grid_782000_1430000` | 1684.891 | 1054.012 | 782000.0 | 1430000.0 | 0.0031 | 0.0033 |
| `grid_783000_1430000` | 2251.500 | 1054.012 | 783000.0 | 1430000.0 | 0.0023 | 0.0025 |
| `grid_784000_1430000` | 2818.108 | 1054.012 | 784000.0 | 1430000.0 | 0.0029 | 0.0034 |
| `grid_780000_1429000` | 551.679 | 1620.638 | 780000.0 | 1429000.0 | 0.0046 | 0.0055 |
| `grid_781000_1429000` | 1118.283 | 1620.638 | 781000.0 | 1429000.0 | 0.0045 | 0.0050 |
| `grid_782000_1429000` | 1684.891 | 1620.638 | 782000.0 | 1429000.0 | 0.0035 | 0.0037 |
| `grid_783000_1429000` | 2251.500 | 1620.638 | 783000.0 | 1429000.0 | 0.0027 | 0.0030 |
| `grid_784000_1429000` | 2818.108 | 1620.638 | 784000.0 | 1429000.0 | 0.0033 | 0.0039 |
| `grid_780000_1428000` | 551.679 | 2187.260 | 780000.0 | 1428000.0 | 0.0039 | 0.0051 |
| `grid_781000_1428000` | 1118.283 | 2187.260 | 781000.0 | 1428000.0 | 0.0038 | 0.0045 |
| `grid_782000_1428000` | 1684.891 | 2187.260 | 782000.0 | 1428000.0 | 0.0024 | 0.0028 |
| `grid_783000_1428000` | 2251.500 | 2187.260 | 783000.0 | 1428000.0 | 0.0011 | 0.0013 |
| `grid_784000_1428000` | 2818.108 | 2187.260 | 784000.0 | 1428000.0 | 0.0021 | 0.0027 |

#### Legend Colour Mapping Table (`ZONING CLASSIFICATION`)

| Zone Code | Zone Label | Indexed Palette RGB Swatches | Min Polygon Area (`sq.m`) |
|---|---|---|---:|
| `R-MAIN` | Residential (Main) | `(255, 255, 153)`, `(255, 255, 204)`, `(255, 255, 224)`, `(206, 206, 155)` | 2000 |
| `R-MIX` | Residential (Mixed) | `(255, 224, 38)`, `(255, 239, 146)`, `(206, 190, 97)` | 2000 |
| `C-BIZ` | Commercial (Business) | `(153, 204, 255)`, `(102, 179, 255)`, `(204, 229, 255)`, `(155, 180, 206)`, `(129, 168, 206)`, `(178, 217, 255)` | 400 |
| `C-AXES` | Commercial Axes | `(0, 224, 255)`, `(127, 239, 255)`, `(78, 190, 206)` | 400 |
| `I-GEN` | Industrial | `(163, 102, 179)`, `(209, 178, 217)`, `(160, 129, 168)` | 1500 |
| `I-HITECH` | High Tech | `(191, 166, 255)`, `(223, 210, 255)`, `(174, 161, 206)` | 1500 |
| `PSP` | Public and Semi-public | `(224, 0, 0)`, `(239, 127, 127)`, `(190, 78, 78)` | 1500 |
| `G-PARK` | Green (Parks and Open Spaces) | `(163, 240, 36)`, `(209, 247, 145)`, `(160, 198, 96)` | 1500 |
| `G-LAKE` | Lake / tank | `(224, 240, 255)`, `(239, 247, 255)` | 400 |
| `T-TRANS` | Traffic and Transportation | `(102, 102, 102)`, `(129, 129, 129)`, `(127, 127, 127)` | 2000 |

## 5. Land-Use Zone Distribution (`zones.geojson`)

| Zone Code | Total Clipped Area | Share of Zoned Area |
|---|---|---|
| `C-AXES` | 0.09 sq.km | 1.2% |
| `C-BIZ` | 0.03 sq.km | 0.4% |
| `G-LAKE` | 0.03 sq.km | 0.4% |
| `G-PARK` | 0.31 sq.km | 4.1% |
| `I-GEN` | 0.10 sq.km | 1.3% |
| `I-HITECH` | 0.11 sq.km | 1.4% |
| `PSP` | 0.41 sq.km | 5.3% |
| `R-MAIN` | 5.94 sq.km | 77.6% |
| `R-MIX` | 0.64 sq.km | 8.3% |
| `T-TRANS` | 0.00 sq.km | 0.0% |

## 6. Existing Land Use Cross-Check & Overlay Notes

- **Existing Land Use Cross-Check (Plan v2.0 §5.C3)**: Master plan zones reflect statutory *proposed/permissible* zoning and are never altered to match existing land use.
- **`planning_districts`**: Bangalore Development Authority (BDA) Revised Master Plan 2015 — 47 Planning Districts Index Map, clipped to Bengaluru South City Corporation boundary.
- No additional overlay layers configured.

## 7. Greater Bengaluru (GBA) Five City Corporations & 369 Wards Verification (PR 12 Part 2)

| Jurisdiction ID | City Corporation Name | GBA Zones (`gba_zone_boundary`) | Official Wards (`ward_369_final`) | 2026 Final Bye-laws Notification | Effective Date |
|---|---|---|---:|---|---|
| `in-ka-bengaluru-central` | Bengaluru Central City Corporation | Zone 1 (C.V. Raman Nagar), Zone 2 (Gandhinagara) | **63** | `No: BCCC/Com/PR/48/2026-27` (Gazette Part-III No. 375) | `2026-05-14` |
| `in-ka-bengaluru-north` | Bengaluru North City Corporation | Zone 1 (Byatarayanapura), Zone 2 (Yelahanka) | **72** | `No: BNCC/Com/PR/103/2026-27` (Gazette Part-III No. 373) | `2026-05-14` |
| `in-ka-bengaluru-south` | Bengaluru South City Corporation | Zone 1 (Jayanagar), Zone 2 (Bommanahalli) | **72** | `No: BSCC/Com/PR/35/2026-27` (Gazette Part-III No. 372) | `2026-05-14` |
| `in-ka-bengaluru-east` | Bengaluru East City Corporation | Zone 1 (Mahadevapura), Zone 2 (K.R. Pura) | **50** | `No: BECC/Com/PR/331/2026-27` (Gazette Part-III No. 371) | `2026-05-14` |
| `in-ka-bengaluru-west` | Bengaluru West City Corporation | Zone 1 (Rajarajeshwarinagar), Zone 2 (Malleshwaram) | **112** | `No: BWCC/Com/PR/44/2026-27` (Gazette Part-III No. 374) | `2026-05-14` |
| **`in-ka-bengaluru` (Total)** | **Greater Bengaluru (GBA Area)** | **10 GBA Zones** | **369 Wards** | **5 Final + 5 Draft Notifications** | **`2026-05-14`** |
