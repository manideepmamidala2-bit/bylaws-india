# Map & Geospatial Verification Report — `in-ka-bengaluru` (Greater Bengaluru (GBA Area))

**Step**: PR 06–07 / Plan v2.0 §5.C1–C4 · **Verification Cap**: `machine_checked` (Rule R10)

## 1. Coverage & Coordinate Reference System Summary

- **Corporation Boundary Area (`boundary.geojson`)**: 717.21 sq.km (Bounds `EPSG:4326`: `[77.459880, 12.833491, 77.784064, 13.142620]`; Geometry: Valid (`is_valid=True`))
- **GBA Zones Within Corporation (`gba-zones.geojson`)**: 10
- **Official Wards Within Corporation (`wards.geojson`)**: 369 (335 valid in source, 34 repaired via `shapely.make_valid`)
- **Intersecting Planning Districts (`planning-districts.geojson`)**: 1
- **Active Master Plan Zone Polygons (`zones.geojson`)**: 0
- **Zoned Area Coverage Within Corporation**: **0.0%**
- **Derived Overlay Features (`overlays.geojson`)**: 0

## 2. Official GBA Zones (`gba-zones.geojson`)

| Zone Code | Zone Name | Corporation Attribute | Area | Geometry Validation |
|---|---|---|---|---|
| `Zone1` | Byatarayanapura | `North` | 92.76 sq.km | Repaired via `make_valid` (Self-intersection[77.599699009998 13.027862964293]) |
| `Zone2` | Gandhinagara | `Central` | 34.69 sq.km | Repaired via `make_valid` (Too few points in geometry component[77.5521 12.966269]) |
| `Zone1` | Mahadevapura | `East` | 107.41 sq.km | Repaired via `make_valid` (Ring Self-intersection[77.705874 12.999308]) |
| `Zone1` | C.V. Raman Nagar | `Central` | 43.19 sq.km | Repaired via `make_valid` (Self-intersection[77.662631 12.928537]) |
| `Zone2` | Bommanahalli | `South` | 58.43 sq.km | Repaired via `make_valid` (Too few points in geometry component[77.641158 12.887122]) |
| `Zone2` | Malleshwaram | `West` | 45.12 sq.km | Repaired via `make_valid` (Self-intersection[77.55447 12.923589]) |
| `Zone1` | Rajarajeshwarinagar | `West` | 118.44 sq.km | Repaired via `make_valid` (Self-intersection[77.579617 12.93306]) |
| `Zone2` | K.R. Pura | `East` | 56.27 sq.km | Repaired via `make_valid` (Ring Self-intersection[77.705874 12.999308]) |
| `Zone1` | Jayanagar | `South` | 93.85 sq.km | Repaired via `make_valid` (Ring Self-intersection[77.663439 12.884434]) |
| `Zone2` | Yelahanka | `North` | 67.05 sq.km | Repaired via `make_valid` (Self-intersection[77.599699009998 13.027862964293]) |

## 3. Official Delimitation Wards (`wards.geojson` — 369 Wards) & Notification Cross-Check

- **Selection Method (Rule R1)**: Selected deterministically by source attribute `Corporation == "*"` from `https://gisapps.bbmp.gov.in/geoserver/wfs?service=WFS&version=1.1.0&request=GetFeature&typeName=gba_boundary:ward_369_final&outputFormat=application/vnd.google-earth.kml+xml&srsName=EPSG:4326`.
- **Notification Cross-Check**: Cross-checked against the official GBA Ward Delimitation notification of 19 November 2025 (gba_boundary:ward_369_final): Central = 63 wards, North = 72 wards, South = 72 wards, East = 50 wards, West = 112 wards (Total = 369 wards).

| Ward No. | Ward Name (EN) | Ward Name (KN) | GBA Zone | Assembly Constituency | Population (`TOT_P`) | Area | Geometry Validation |
|---:|---|---|---|---|---:|---:|---|
| `1` | K Narayanapura | ಕೆ ನಾರಾಯಣಪುರ | Zone2 (K.R. Pura) | 151 - K.R. Pura | 15003.0 | 4.77 sq.km | Valid (`is_valid=True`) |
| `1` | Padmanabhanagara | ಪದ್ಮನಾಭನಗರ | Zone1 (Jayanagar) | 171 - Padmanabanagar | 23419.0 | 0.90 sq.km | Valid (`is_valid=True`) |
| `1` | Raja Kempegowda ward | ರಾಜ ಕೆಂಪೇಗೌಡ ವಾರ್ಡ್ | Zone2 (Yelahanka) | 150 - Yelahanka | 21561.0 | 1.80 sq.km | Valid (`is_valid=True`) |
| `1` | Ramaswamy Palya | ರಾಮಸ್ವಾಮಿ ಪಾಳ್ಯ | Zone2 (Gandhinagara) | 162 - Shivajinagar | 26124.0 | 0.70 sq.km | Valid (`is_valid=True`) |
| `1` | Nagasandra | ನಾಗಸಂದ್ರ | Zone1 (Rajarajeshwarinagar) | 155 - Dasarahalli | 24974.0 | 1.91 sq.km | Valid (`is_valid=True`) |
| `2` | Aerocity | ಏರೋಸಿಟಿ | Zone2 (Yelahanka) | 150 - Yelahanka | 20655.0 | 10.26 sq.km | Valid (`is_valid=True`) |
| `2` | Kadirenahalli | ಕದಿರೇನಹಳ್ಳಿ | Zone1 (Jayanagar) | 171 - Padmanabanagar | 19937.0 | 0.65 sq.km | Valid (`is_valid=True`) |
| `2` | Horamavu | ಹೊರಮಾವು | Zone2 (K.R. Pura) | 151 - K.R. Pura | 14756.0 | 7.82 sq.km | `make_valid` (Ring Self-intersection[77.643765 13.038965]) |
| `2` | Jayamahal | ಜಯಮಹಲ್ | Zone2 (Gandhinagara) | 162 - Shivajinagar | 25834.0 | 1.42 sq.km | Valid (`is_valid=True`) |
| `2` | Chokkasandra | ಚೊಕ್ಕಸಂದ್ರ | Zone1 (Rajarajeshwarinagar) | 155 - Dasarahalli | 27117.0 | 1.09 sq.km | Valid (`is_valid=True`) |
| `3` | Chowdeshwari ward | ಚೌಡೇಶ್ವರಿ ವಾರ್ಡ್ | Zone2 (Yelahanka) | 150 - Yelahanka | 26795.0 | 6.43 sq.km | Valid (`is_valid=True`) |
| `3` | Yarab nagar | ಯಾರಬ್ ನಗರ | Zone1 (Jayanagar) | 171 - Padmanabanagar | 20832.0 | 0.28 sq.km | Valid (`is_valid=True`) |
| `3` | Nelagadaranahalli | ನೆಲಗದರನಹಳ್ಳಿ | Zone1 (Rajarajeshwarinagar) | 155 - Dasarahalli | 22738.0 | 2.17 sq.km | Valid (`is_valid=True`) |
| `3` | Chellakere | ಚೆಲ್ಲಕೆರೆ | Zone2 (K.R. Pura) | 151 - K.R. Pura | 17010.0 | 1.67 sq.km | Valid (`is_valid=True`) |
| `3` | Vasanth Nagar | ವಸಂತ ನಗರ | Zone2 (Gandhinagara) | 162 - Shivajinagar | 28272.0 | 1.95 sq.km | Valid (`is_valid=True`) |
| `4` | Babusab Palya | ಬಾಬುಸಾಬ್ ಪಾಳ್ಯ | Zone2 (K.R. Pura) | 151 - K.R. Pura | 19361.0 | 1.83 sq.km | Valid (`is_valid=True`) |
| `4` | Banashankari Temple Ward | ಬನಶಂಕರಿ ದೇವಸ್ಥಾನ ವಾರ್ಡ್ | Zone1 (Jayanagar) | 171 - Padmanabanagar | 22549.0 | 0.40 sq.km | Valid (`is_valid=True`) |
| `4` | Sampangirama Nagar | ಸಂಪಂಗಿರಾಮ ನಗರ | Zone2 (Gandhinagara) | 162 - Shivajinagar | 27874.0 | 4.68 sq.km | Valid (`is_valid=True`) |
| `4` | Nyayanga Badavane | ನ್ಯಾಯಾಂಗ ಬಡಾವಣೆ | Zone2 (Yelahanka) | 150 - Yelahanka | 20006.0 | 2.55 sq.km | Valid (`is_valid=True`) |
| `4` | Parvathi Nagar | ಪಾರ್ವತಿ ನಗರ | Zone1 (Rajarajeshwarinagar) | 155 - Dasarahalli | 20312.0 | 1.46 sq.km | Valid (`is_valid=True`) |
| `5` | Kane Muneshwara Ward | ಕಾನೆ ಮುನೇಶ್ವರ ವಾರ್ಡ್ | Zone1 (Jayanagar) | 171 - Padmanabanagar | 22022.0 | 1.13 sq.km | Valid (`is_valid=True`) |
| `5` | Yelahanka Satellite Town | ಯಲಹಂಕ ಸ್ಯಾಟಲೈಟ್‌ ಟೌನ್‌ | Zone2 (Yelahanka) | 150 - Yelahanka | 29889.0 | 2.91 sq.km | Valid (`is_valid=True`) |
| `5` | Hoysala Nagara East | ಹೊಯ್ಸಳ ನಗರ ಪೂರ್ವ | Zone2 (K.R. Pura) | 151 - K.R. Pura | 18244.0 | 1.61 sq.km | Valid (`is_valid=True`) |
| `5` | Shivajinagar | ಶಿವಾಜಿನಗರ | Zone2 (Gandhinagara) | 162 - Shivajinagar | 25484.0 | 1.16 sq.km | `make_valid` (Ring Self-intersection[77.608729 12.977165]) |
| `5` | Rajeshwarinagar | ರಾಜೇಶ್ವರಿನಗರ | Zone1 (Rajarajeshwarinagar) | 155 - Dasarahalli | 25418.0 | 0.47 sq.km | Valid (`is_valid=True`) |
| `6` | Gowdanapalya | ಗೌಡನಪಾಳ್ಯ | Zone1 (Jayanagar) | 171 - Padmanabanagar | 24691.0 | 0.91 sq.km | Valid (`is_valid=True`) |
| `6` | Doddabettahalli | ದೊಡ್ಡಬೆಟ್ಟಹಳ್ಳಿ | Zone2 (Yelahanka) | 150 - Yelahanka | 29553.0 | 5.08 sq.km | Valid (`is_valid=True`) |
| `6` | Kalkere | ಕಲ್ಕೆರೆ | Zone2 (K.R. Pura) | 151 - K.R. Pura | 17359.0 | 3.84 sq.km | Valid (`is_valid=True`) |
| `6` | Bharathi Nagar | ಭಾರತಿ ನಗರ | Zone2 (Gandhinagara) | 162 - Shivajinagar | 24220.0 | 0.34 sq.km | Valid (`is_valid=True`) |
| `6` | Shivapura | ಶಿವಪುರ | Zone1 (Rajarajeshwarinagar) | 155 - Dasarahalli | 26408.0 | 2.68 sq.km | Valid (`is_valid=True`) |
| `7` | Byrasandra | ಬೈರಸಂದ್ರ | Zone1 (Jayanagar) | 173 - Jayanagar | 21108.0 | 1.14 sq.km | `make_valid` (Ring Self-intersection[77.579617 12.933045]) |
| `7` | Attur | ಅಟ್ಟುರು | Zone2 (Yelahanka) | 150 - Yelahanka | 26922.0 | 2.53 sq.km | Valid (`is_valid=True`) |
| `7` | Rajagopala Nagara | ರಾಜಗೋಪಾಲ ನಗರ | Zone1 (Rajarajeshwarinagar) | 155 - Dasarahalli | 24944.0 | 1.00 sq.km | Valid (`is_valid=True`) |
| `7` | K Chennasandra | ಕೆ ಚೆನ್ನಸಂದ್ರ | Zone2 (K.R. Pura) | 151 - K.R. Pura | 14572.0 | 2.12 sq.km | Valid (`is_valid=True`) |
| `7` | K Kamaraj Ward | ಕೆ ಕಾಮರಾಜ್ ವಾರ್ಡ್ | Zone2 (Gandhinagara) | 162 - Shivajinagar | 23193.0 | 1.98 sq.km | Valid (`is_valid=True`) |
| `8` | Tilak Nagara | ತಿಲಕ ನಗರ | Zone1 (Jayanagar) | 173 - Jayanagar | 25625.0 | 1.01 sq.km | Valid (`is_valid=True`) |
| `8` | Halasuru | ಹಲಸೂರು | Zone2 (Gandhinagara) | 162 - Shivajinagar | 24019.0 | 0.51 sq.km | Valid (`is_valid=True`) |
| `8` | Singapura | ಸಿಂಗಾಪುರ | Zone1 (Byatarayanapura) | 152 - Byatarayanapura | 24794.0 | 2.44 sq.km | Valid (`is_valid=True`) |
| `8` | Anandapura | ಆನಂದಪುರ | Zone2 (K.R. Pura) | 151 - K.R. Pura | 18898.0 | 2.21 sq.km | Valid (`is_valid=True`) |
| `8` | Hegganahalli | ಹೆಗ್ಗನಹಳ್ಳಿ | Zone1 (Rajarajeshwarinagar) | 155 - Dasarahalli | 28416.0 | 0.88 sq.km | `make_valid` (Ring Self-intersection[77.517703 13.004381]) |
| `9` | Hoysala Nagara Central | ಹೊಯ್ಸಳ ನಗರ ಕೇಂದ್ರ | Zone1 (C.V. Raman Nagar) | 161 - C.V. Raman Nagar | 27798.0 | 1.97 sq.km | Valid (`is_valid=True`) |
| `9` | N.A.L Layout | ಎನ್‌.ಎ.ಎಲ್ ಲೇಔಟ್ | Zone1 (Jayanagar) | 173 - Jayanagar | 20532.0 | 0.35 sq.km | Valid (`is_valid=True`) |
| `9` | Srigandhanagar | ಶ್ರೀಗಂಧನಗರ | Zone1 (Rajarajeshwarinagar) | 155 - Dasarahalli | 22361.0 | 0.75 sq.km | Valid (`is_valid=True`) |
| `9` | Kuvempunagara | ಕುವೆಂಪುನಗರ | Zone1 (Byatarayanapura) | 152 - Byatarayanapura | 25815.0 | 5.48 sq.km | Valid (`is_valid=True`) |
| `9` | Bhattarahalli | ಭಟ್ಟರಹಳ್ಳಿ | Zone2 (K.R. Pura) | 151 - K.R. Pura | 14911.0 | 2.57 sq.km | Valid (`is_valid=True`) |
| `10` | Abdul Kalam Nagar | ಅಬ್ದುಲ್ ಕಲಾಂ ನಗರ | Zone1 (Jayanagar) | 173 - Jayanagar | 23124.0 | 0.41 sq.km | Valid (`is_valid=True`) |
| `10` | Basavanapura | ಬಸವನಪುರ | Zone2 (K.R. Pura) | 151 - K.R. Pura | 16224.0 | 3.94 sq.km | Valid (`is_valid=True`) |
| `10` | Cox Town | ಕಾಕ್ಸ್ ಟೌನ್ | Zone1 (C.V. Raman Nagar) | 161 - C.V. Raman Nagar | 21026.0 | 1.24 sq.km | Valid (`is_valid=True`) |
| `10` | Vidyaranyapura | ವಿದ್ಯಾರಣ್ಯಪುರ | Zone1 (Byatarayanapura) | 152 - Byatarayanapura | 24887.0 | 1.75 sq.km | Valid (`is_valid=True`) |
| `10` | Sunkadakatte | ಸುಂಕದಕಟ್ಟೆ | Zone1 (Rajarajeshwarinagar) | 155 - Dasarahalli | 23123.0 | 0.77 sq.km | Valid (`is_valid=True`) |
| `11` | Old Baiyappanahalli | ಹಳೆ ಬೈಯಪ್ಪನಹಳ್ಳಿ | Zone1 (C.V. Raman Nagar) | 161 - C.V. Raman Nagar | 18858.0 | 0.55 sq.km | Valid (`is_valid=True`) |
| `11` | Krishnanagar | ಕೃಷ್ಣನಗರ | Zone2 (K.R. Pura) | 151 - K.R. Pura | 16000.0 | 1.23 sq.km | Valid (`is_valid=True`) |
| `11` | Jayanagar East | ಜಯನಗರ ಪೂರ್ವ | Zone1 (Jayanagar) | 173 - Jayanagar | 22697.0 | 0.46 sq.km | Valid (`is_valid=True`) |
| `11` | Doddabommasandra | ದೊಡ್ಡಬೊಮ್ಮಸಂದ್ರ | Zone1 (Byatarayanapura) | 152 - Byatarayanapura | 25941.0 | 4.21 sq.km | Valid (`is_valid=True`) |
| `11` | Dodda Bidarakallu | ದೊಡ್ಡ ಬಿದರಕಲ್ಲು | Zone1 (Rajarajeshwarinagar) | 153 - Yeshwanthapura | 25777.0 | 4.24 sq.km | Valid (`is_valid=True`) |
| `12` | Kasturi Nagar | ಕಸ್ತೂರಿ ನಗರ | Zone1 (C.V. Raman Nagar) | 161 - C.V. Raman Nagar | 19331.0 | 3.51 sq.km | Valid (`is_valid=True`) |
| `12` | Pattabhirama Nagara | ಪಟ್ಟಾಭಿರಾಮ ನಗರ | Zone1 (Jayanagar) | 173 - Jayanagar | 22547.0 | 1.50 sq.km | Valid (`is_valid=True`) |
| `12` | Thindlu | ತಿಂಡ್ಲು | Zone1 (Byatarayanapura) | 152 - Byatarayanapura | 24289.0 | 7.41 sq.km | Valid (`is_valid=True`) |
| `12` | Devasandra | ದೇವಸಂದ್ರ | Zone2 (K.R. Pura) | 151 - K.R. Pura | 14990.0 | 1.29 sq.km | `make_valid` (Ring Self-intersection[77.705874 12.999308]) |
| `12` | Andrahalli | ಅಂದ್ರಹಳ್ಳಿ | Zone1 (Rajarajeshwarinagar) | 153 - Yeshwanthapura | 27694.0 | 5.58 sq.km | Valid (`is_valid=True`) |
| `13` | Marenahalli South | ಮಾರೇನಹಳ್ಳಿ ದಕ್ಷಿಣ | Zone1 (Jayanagar) | 173 - Jayanagar | 23458.0 | 0.76 sq.km | Valid (`is_valid=True`) |
| `13` | Krishnaiahnapalya | ಕೃಷ್ಣಯ್ಯನ ಪಾಳ್ಯ | Zone1 (C.V. Raman Nagar) | 161 - C.V. Raman Nagar | 19302.0 | 1.19 sq.km | Valid (`is_valid=True`) |
| `13` | Kodigehalli | ಕೊಡಿಗೆಹಳ್ಳಿ | Zone1 (Byatarayanapura) | 152 - Byatarayanapura | 28244.0 | 1.35 sq.km | Valid (`is_valid=True`) |
| `13` | Rajarajeshwari Temple ward | ರಾಜರಾಜೇಶ್ವರಿ ದೇವಸ್ಥಾನ ವಾರ್ಡ್ | Zone2 (K.R. Pura) | 151 - K.R. Pura | 17539.0 | 1.36 sq.km | `make_valid` (Ring Self-intersection[77.690672 12.997264]) |
| `13` | Nada prabhu Kempegowda Nagara | ನಾಡ ಪ್ರಭು ಕೆಂಪೇಗೌಡ ನಗರ | Zone1 (Rajarajeshwarinagar) | 153 - Yeshwanthapura | 27225.0 | 4.21 sq.km | Valid (`is_valid=True`) |
| `14` | K.R Pura | ಕೆ ಆರ್ ಪುರ | Zone2 (K.R. Pura) | 151 - K.R. Pura | 14930.0 | 0.89 sq.km | Valid (`is_valid=True`) |
| `14` | J.P Nagar | ಜೆ.ಪಿ. ನಗರ | Zone1 (Jayanagar) | 173 - Jayanagar | 22264.0 | 1.27 sq.km | Valid (`is_valid=True`) |
| `14` | Rajiv Gandhi Nagar | ರಾಜೀವ್ ಗಾಂಧಿ ನಗರ | Zone1 (Byatarayanapura) | 152 - Byatarayanapura | 20148.0 | 2.89 sq.km | `make_valid` (Ring Self-intersection[77.590483 13.043086]) |
| `14` | Nagavarapalya | ನಾಗವಾರಪಾಳ್ಯ | Zone1 (C.V. Raman Nagar) | 161 - C.V. Raman Nagar | 24875.0 | 1.96 sq.km | Valid (`is_valid=True`) |
| `14` | Herohalli | ಹೆರೋಹಳ್ಳಿ | Zone1 (Rajarajeshwarinagar) | 153 - Yeshwanthapura | 28413.0 | 1.50 sq.km | Valid (`is_valid=True`) |
| `15` | Ramamurthy Nagara | ರಾಮಮೂರ್ತಿ ನಗರ | Zone2 (K.R. Pura) | 151 - K.R. Pura | 17257.0 | 0.80 sq.km | Valid (`is_valid=True`) |
| `15` | Shakambarinagara | ಶಾಕಂಭರಿನಗರ | Zone1 (Jayanagar) | 173 - Jayanagar | 25845.0 | 1.73 sq.km | Valid (`is_valid=True`) |
| `15` | Byatarayanapura | ಬ್ಯಾಟರಾಯನಪುರ | Zone1 (Byatarayanapura) | 152 - Byatarayanapura | 28870.0 | 5.09 sq.km | Valid (`is_valid=True`) |
| `15` | Byadarahalli | ಬ್ಯಾಡರಹಳ್ಳಿ | Zone1 (Rajarajeshwarinagar) | 153 - Yeshwanthapura | 22784.0 | 4.16 sq.km | Valid (`is_valid=True`) |
| `15` | Indiranagar | ಇಂದಿರಾನಗರ | Zone1 (C.V. Raman Nagar) | 161 - C.V. Raman Nagar | 19324.0 | 2.98 sq.km | Valid (`is_valid=True`) |
| `16` | Kotthur | ಕೊತ್ತೂರು | Zone2 (K.R. Pura) | 151 - K.R. Pura | 14653.0 | 1.24 sq.km | Valid (`is_valid=True`) |
| `16` | Amruthahalli | ಅಮೃತಹಳ್ಳಿ | Zone1 (Byatarayanapura) | 152 - Byatarayanapura | 21732.0 | 1.32 sq.km | Valid (`is_valid=True`) |
| `16` | Sarakki | ಸಾರಕ್ಕಿ | Zone1 (Jayanagar) | 173 - Jayanagar | 23257.0 | 0.68 sq.km | Valid (`is_valid=True`) |
| `16` | New Thippasandra | ನ್ಯೂ ತಿಪ್ಪಸಂದ್ರ | Zone1 (C.V. Raman Nagar) | 161 - C.V. Raman Nagar | 27969.0 | 1.98 sq.km | Valid (`is_valid=True`) |
| `16` | Ullal | ಉಳ್ಳಾಲ | Zone1 (Rajarajeshwarinagar) | 153 - Yeshwanthapura | 22549.0 | 5.58 sq.km | Valid (`is_valid=True`) |
| `17` | Kaggadasapura | ಕಗ್ಗದಾಸಪುರ | Zone1 (C.V. Raman Nagar) | 161 - C.V. Raman Nagar | 20794.0 | 1.15 sq.km | `make_valid` (Ring Self-intersection[77.667973 12.985491]) |
| `17` | Vijinapura | ವಿಜಿನಾಪುರ | Zone2 (K.R. Pura) | 151 - K.R. Pura | 15133.0 | 0.33 sq.km | Valid (`is_valid=True`) |
| `17` | N.S Palya | ಎನ್.ಎಸ್. ಪಾಳ್ಯ | Zone2 (Bommanahalli) | 172 - B.T.M Layout | 26701.0 | 0.72 sq.km | Valid (`is_valid=True`) |
| `17` | Jakkur | ಜಕ್ಕೂರು | Zone1 (Byatarayanapura) | 152 - Byatarayanapura | 28519.0 | 7.81 sq.km | Valid (`is_valid=True`) |
| `17` | Nagadevanahalli | ನಾಗದೇವನಹಳ್ಳಿ | Zone1 (Rajarajeshwarinagar) | 153 - Yeshwanthapura | 23269.0 | 2.48 sq.km | Valid (`is_valid=True`) |
| `18` | Viswamanava Kuvempu Ward | ವಿಶ್ವಮಾನವ ಕುವೆಂಪು ವಾರ್ಡ್ | Zone2 (Bommanahalli) | 172 - B.T.M Layout | 25500.0 | 1.39 sq.km | Valid (`is_valid=True`) |
| `18` | Kempapura | ಕೆಂಪಾಪುರ | Zone1 (Byatarayanapura) | 152 - Byatarayanapura | 28936.0 | 5.31 sq.km | Valid (`is_valid=True`) |
| `18` | Dooravaninagar | ದೂರವಾಣಿನಗರ | Zone2 (K.R. Pura) | 151 - K.R. Pura | 14677.0 | 1.25 sq.km | Valid (`is_valid=True`) |
| `18` | G.M Palya | ಜಿ.ಎಂ. ಪಾಳ್ಯ | Zone1 (C.V. Raman Nagar) | 161 - C.V. Raman Nagar | 20579.0 | 0.84 sq.km | Valid (`is_valid=True`) |
| `18` | Kengal Hanumanthaiah West | ಕೆಂಗಲ್ ಹನುಮಂತಯ್ಯ ಪಶ್ಚಿಮ | Zone1 (Rajarajeshwarinagar) | 153 - Yeshwanthapura | 21223.0 | 2.33 sq.km | Valid (`is_valid=True`) |
| `19` | K.S. Nissar Ahmed Ward | ಕೆ. ಎಸ್. ನಿಸಾರ್ ಅಹಮದ್ ವಾರ್ಡ್ | Zone2 (K.R. Pura) | 151 - K.R. Pura | 15446.0 | 0.84 sq.km | Valid (`is_valid=True`) |
| `19` | Tavarekere | ತಾವರೆಕೆರೆ | Zone2 (Bommanahalli) | 172 - B.T.M Layout | 19251.0 | 0.55 sq.km | Valid (`is_valid=True`) |
| `19` | Thanisandra | ಥಣಿಸಂದ್ರ | Zone1 (Byatarayanapura) | 152 - Byatarayanapura | 28159.0 | 2.73 sq.km | Valid (`is_valid=True`) |
| `19` | Jeevan Bhimanagar | ಜೀವನ್ ಭೀಮನಗರ | Zone1 (C.V. Raman Nagar) | 161 - C.V. Raman Nagar | 27299.0 | 1.40 sq.km | Valid (`is_valid=True`) |
| `19` | Shivanapalya | ಶಿವನಪಾಳ್ಯ | Zone1 (Rajarajeshwarinagar) | 153 - Yeshwanthapura | 21903.0 | 1.68 sq.km | Valid (`is_valid=True`) |
| `20` | Kengeri Kote ward | ಕೆಂಗೇರಿ ಕೋಟೆ ವಾರ್ಡ್ | Zone1 (Rajarajeshwarinagar) | 153 - Yeshwanthapura | 19339.0 | 15.23 sq.km | `make_valid` (Ring Self-intersection[77.478945 12.886205]) |
| `20` | Madiwala | ಮಡಿವಾಳ | Zone2 (Bommanahalli) | 172 - B.T.M Layout | 25538.0 | 0.69 sq.km | `make_valid` (Self-intersection[77.622729 12.9173]) |
| `20` | Sampigehalli | ಸಂಪಿಗೆಹಳ್ಳಿ | Zone1 (Byatarayanapura) | 152 - Byatarayanapura | 28461.0 | 8.79 sq.km | Valid (`is_valid=True`) |
| `20` | A Narayanapura | ಎ ನಾರಾಯಣಪುರ | Zone2 (K.R. Pura) | 151 - K.R. Pura | 21640.0 | 1.30 sq.km | Valid (`is_valid=True`) |
| `20` | Kodihalli | ಕೋಡಿಹಳ್ಳಿ | Zone1 (C.V. Raman Nagar) | 161 - C.V. Raman Nagar | 24057.0 | 1.30 sq.km | Valid (`is_valid=True`) |
| `21` | Kogilu | ಕೋಗಿಲು | Zone1 (Byatarayanapura) | 152 - Byatarayanapura | 28728.0 | 11.45 sq.km | Valid (`is_valid=True`) |
| `21` | Chikka Adugodi | ಚಿಕ್ಕ ಆಡುಗೋಡಿ | Zone2 (Bommanahalli) | 172 - B.T.M Layout | 21468.0 | 0.72 sq.km | Valid (`is_valid=True`) |
| `21` | Uday Nagar | ಉದಯ್ ನಗರ | Zone2 (K.R. Pura) | 151 - K.R. Pura | 20262.0 | 0.78 sq.km | Valid (`is_valid=True`) |
| `21` | Kengeri | ಕೆಂಗೇರಿ | Zone1 (Rajarajeshwarinagar) | 153 - Yeshwanthapura | 21835.0 | 6.10 sq.km | Valid (`is_valid=True`) |
| `21` | Konena Agrahara | ಕೋನೇನ ಅಗ್ರಹಾರ | Zone1 (C.V. Raman Nagar) | 161 - C.V. Raman Nagar | 26714.0 | 1.48 sq.km | Valid (`is_valid=True`) |
| `22` | Bangarappa Nagara | ಬಂಗಾರಪ್ಪ ನಗರ | Zone1 (Rajarajeshwarinagar) | 154 - Rajarajeshwarinagar | 28414.0 | 6.76 sq.km | Valid (`is_valid=True`) |
| `22` | S.G Palya | ಎಸ್.ಜಿ. ಪಾಳ್ಯ | Zone2 (Bommanahalli) | 172 - B.T.M Layout | 21440.0 | 1.24 sq.km | Valid (`is_valid=True`) |
| `22` | Nagavara | ನಾಗವಾರ | Zone1 (Byatarayanapura) | 160 - Sarvagnanagar | 20153.0 | 0.96 sq.km | Valid (`is_valid=True`) |
| `22` | Mahadevapura | ಮಹದೇವಪುರ | Zone2 (K.R. Pura) | 151 - K.R. Pura | 17381.0 | 2.71 sq.km | Valid (`is_valid=True`) |
| `22` | Domluru | ದೊಮ್ಮಲೂರು | Zone1 (C.V. Raman Nagar) | 163 - Shanthinagar | 19982.0 | 1.16 sq.km | Valid (`is_valid=True`) |
| `23` | Lakkasandra | ಲಕ್ಕಸಂದ್ರ | Zone2 (Bommanahalli) | 172 - B.T.M Layout | 20932.0 | 0.69 sq.km | Valid (`is_valid=True`) |
| `23` | Hennur | ಹೆಣ್ಣೂರು | Zone1 (Byatarayanapura) | 160 - Sarvagnanagar | 21706.0 | 1.93 sq.km | Valid (`is_valid=True`) |
| `23` | Sangama Ward | ಸಂಗಮ ವಾರ್ಡ್ | Zone2 (K.R. Pura) | 151 - K.R. Pura | 15835.0 | 1.99 sq.km | Valid (`is_valid=True`) |
| `23` | Jogpalya | ಜೋಗಪಾಳ್ಯ | Zone1 (C.V. Raman Nagar) | 163 - Shanthinagar | 25803.0 | 1.09 sq.km | Valid (`is_valid=True`) |
| `23` | Rajarajeshwari Nagara | ರಾಜರಾಜೇಶ್ವರಿ ನಗರ | Zone1 (Rajarajeshwarinagar) | 154 - Rajarajeshwarinagar | 26050.0 | 4.13 sq.km | Valid (`is_valid=True`) |
| `24` | Agaram | ಅಗರಂ | Zone1 (C.V. Raman Nagar) | 163 - Shanthinagar | 28081.0 | 11.04 sq.km | `make_valid` (Self-intersection[77.662631 12.928537]) |
| `24` | HBR Layout | ಎಚ್.ಬಿ.ಆರ್. ಲೇಔಟ್ | Zone1 (Byatarayanapura) | 160 - Sarvagnanagar | 20380.0 | 1.79 sq.km | Valid (`is_valid=True`) |
| `24` | A Adugodi | ಎ. ಆಡುಗೋಡಿ | Zone2 (Bommanahalli) | 172 - B.T.M Layout | 21458.0 | 1.74 sq.km | `make_valid` (Ring Self-intersection[77.605858 12.949787]) |
| `24` | Vignananagara | ವಿಜ್ಞಾನನಗರ | Zone2 (K.R. Pura) | 151 - K.R. Pura | 14649.0 | 1.33 sq.km | Valid (`is_valid=True`) |
| `24` | Jnana Bharathi Ward | ಜ್ಞಾನ ಭಾರತಿ ವಾರ್ಡ್ | Zone1 (Rajarajeshwarinagar) | 154 - Rajarajeshwarinagar | 20533.0 | 6.62 sq.km | Valid (`is_valid=True`) |
| `25` | Vinayaka Layout | ವಿನಾಯಕ ಲೇಔಟ್ | Zone1 (Rajarajeshwarinagar) | 154 - Rajarajeshwarinagar | 20170.0 | 2.58 sq.km | Valid (`is_valid=True`) |
| `25` | L.B Shastri Nagar | ಎಲ್.ಬಿ.ಶಾಸ್ತ್ರಿ ನಗರ | Zone2 (K.R. Pura) | 151 - K.R. Pura | 14946.0 | 0.42 sq.km | Valid (`is_valid=True`) |
| `25` | Govindapura | ಗೋವಿಂದಪುರ | Zone1 (Byatarayanapura) | 160 - Sarvagnanagar | 21432.0 | 0.56 sq.km | Valid (`is_valid=True`) |
| `25` | National Games Village | ನ್ಯಾಷನಲ್ ಗೇಮ್ಸ್ ವಿಲೇಜ್ | Zone2 (Bommanahalli) | 172 - B.T.M Layout | 19407.0 | 0.51 sq.km | Valid (`is_valid=True`) |
| `25` | Ashokanagar | ಅಶೋಕನಗರ | Zone1 (C.V. Raman Nagar) | 163 - Shanthinagar | 21804.0 | 3.93 sq.km | Valid (`is_valid=True`) |
| `26` | Ejipura | ಈಜಿಪುರ | Zone2 (Bommanahalli) | 172 - B.T.M Layout | 22239.0 | 0.51 sq.km | Valid (`is_valid=True`) |
| `26` | Vannarpet | ವನ್ನಾರ್‌ಪೇಟೆ | Zone1 (C.V. Raman Nagar) | 163 - Shanthinagar | 22858.0 | 0.52 sq.km | Valid (`is_valid=True`) |
| `26` | Jagadish Nagar | ಜಗದೀಶ್ ನಗರ | Zone2 (K.R. Pura) | 151 - K.R. Pura | 18479.0 | 1.42 sq.km | Valid (`is_valid=True`) |
| `26` | Mallathahalli | ಮಲ್ಲತ್ತಹಳ್ಳಿ | Zone1 (Rajarajeshwarinagar) | 154 - Rajarajeshwarinagar | 21575.0 | 2.62 sq.km | Valid (`is_valid=True`) |
| `26` | Samadhana Nagar | ಸಮಾಧಾನ ನಗರ | Zone1 (Byatarayanapura) | 160 - Sarvagnanagar | 20684.0 | 0.57 sq.km | Valid (`is_valid=True`) |
| `27` | Sri Lakshmi Devi Ward | ಶ್ರೀ ಲಕ್ಷ್ಮೀದೇವಿ ವಾರ್ಡ್ | Zone2 (Bommanahalli) | 172 - B.T.M Layout | 19844.0 | 0.72 sq.km | Valid (`is_valid=True`) |
| `27` | Ambedkarnagar | ಅಂಬೇಡ್ಕರ್‌ನಗರ | Zone1 (C.V. Raman Nagar) | 163 - Shanthinagar | 27816.0 | 0.39 sq.km | `make_valid` (Ring Self-intersection[77.605858 12.949787]) |
| `27` | Vibhootipura | ವಿಭೂತಿಪುರ | Zone2 (K.R. Pura) | 151 - K.R. Pura | 16475.0 | 4.72 sq.km | Valid (`is_valid=True`) |
| `27` | Srigandada Kaval | ಶ್ರೀಗಂಧದ ಕಾವಲ್ | Zone1 (Rajarajeshwarinagar) | 154 - Rajarajeshwarinagar | 25652.0 | 2.24 sq.km | Valid (`is_valid=True`) |
| `27` | K.G.Halli | ಕೆ.ಜಿ.ಹಳ್ಳಿ | Zone1 (Byatarayanapura) | 160 - Sarvagnanagar | 28238.0 | 0.40 sq.km | Valid (`is_valid=True`) |
| `28` | Kottegepalya | ಕೊಟ್ಟಿಗೆಪಾಳ್ಯ | Zone1 (Rajarajeshwarinagar) | 154 - Rajarajeshwarinagar | 22872.0 | 2.40 sq.km | Valid (`is_valid=True`) |
| `28` | Byrathi | ಬೈರತಿ | Zone1 (Mahadevapura) | 174 - Mahadevapura | 13969.0 | 5.74 sq.km | Valid (`is_valid=True`) |
| `28` | Kormangala East | ಕೋರಮಂಗಲ ಪೂರ್ವ | Zone2 (Bommanahalli) | 172 - B.T.M Layout | 22885.0 | 2.29 sq.km | Valid (`is_valid=True`) |
| `28` | Venkateshpuram | ವೆಂಕಟೇಶಪುರಂ | Zone1 (Byatarayanapura) | 160 - Sarvagnanagar | 22028.0 | 0.36 sq.km | Valid (`is_valid=True`) |
| `28` | Neelasandra | ನೀಲಸಂದ್ರ | Zone1 (C.V. Raman Nagar) | 163 - Shanthinagar | 24853.0 | 0.26 sq.km | Valid (`is_valid=True`) |
| `29` | Lingarajpura | ಲಿಂಗರಾಜಪುರ | Zone1 (Byatarayanapura) | 160 - Sarvagnanagar | 26438.0 | 0.92 sq.km | Valid (`is_valid=True`) |
| `29` | Kormangala West | ಕೋರಮಂಗಲ ಪಶ್ಚಿಮ | Zone2 (Bommanahalli) | 172 - B.T.M Layout | 27879.0 | 2.44 sq.km | Valid (`is_valid=True`) |
| `29` | Chowdeshwari Nagar | ಚೌಡೇಶ್ವರಿ ನಗರ | Zone1 (Rajarajeshwarinagar) | 154 - Rajarajeshwarinagar | 24455.0 | 1.17 sq.km | Valid (`is_valid=True`) |
| `29` | Hoodi | ಹೂಡಿ | Zone1 (Mahadevapura) | 174 - Mahadevapura | 20699.0 | 4.19 sq.km | Valid (`is_valid=True`) |
| `29` | Austin Town | ಆಸ್ಟಿನ್ ಟೌನ್ | Zone1 (C.V. Raman Nagar) | 163 - Shanthinagar | 19730.0 | 0.42 sq.km | Valid (`is_valid=True`) |
| `30` | Kacharakanahalli | ಕಾಚರಕನಹಳ್ಳಿ | Zone1 (Byatarayanapura) | 160 - Sarvagnanagar | 21873.0 | 1.42 sq.km | `make_valid` (Ring Self-intersection[77.632716 13.027773]) |
| `30` | Vinayakanagar | ವಿನಾಯಕನಗರ | Zone1 (C.V. Raman Nagar) | 163 - Shanthinagar | 21367.0 | 1.28 sq.km | Valid (`is_valid=True`) |
| `30` | Jakkasandra | ಜಕ್ಕಸಂದ್ರ | Zone2 (Bommanahalli) | 172 - B.T.M Layout | 25594.0 | 0.79 sq.km | Valid (`is_valid=True`) |
| `30` | Belathur | ಬೆಳತ್ತೂರ್ | Zone1 (Mahadevapura) | 174 - Mahadevapura | 20869.0 | 7.65 sq.km | Valid (`is_valid=True`) |
| `30` | Kempegowda Layout | ಕೆಂಪೇಗೌಡ ಬಡಾವಣೆ | Zone1 (Rajarajeshwarinagar) | 154 - Rajarajeshwarinagar | 20026.0 | 0.63 sq.km | Valid (`is_valid=True`) |
| `31` | Kasavanahalli | ಕಸವನಹಳ್ಳಿ | Zone2 (Bommanahalli) | 174 - Mahadevapura | 21288.0 | 7.69 sq.km | `make_valid` (Self-intersection[77.6547 12.901803]) |
| `31` | Shanthinagar | ಶಾಂತಿನಗರ | Zone1 (C.V. Raman Nagar) | 163 - Shanthinagar | 24474.0 | 1.54 sq.km | Valid (`is_valid=True`) |
| `31` | Kadugodi | ಕಾಡುಗೋಡಿ | Zone1 (Mahadevapura) | 174 - Mahadevapura | 18927.0 | 4.51 sq.km | Valid (`is_valid=True`) |
| `31` | Freedom Fighter Ward | ಫ್ರೀಡಂ ಫೈಟರ್ ವಾರ್ಡ್ | Zone1 (Rajarajeshwarinagar) | 154 - Rajarajeshwarinagar | 18985.0 | 0.50 sq.km | Valid (`is_valid=True`) |
| `31` | Kalyan Nagar | ಕಲ್ಯಾಣ ನಗರ | Zone1 (Byatarayanapura) | 160 - Sarvagnanagar | 23746.0 | 1.46 sq.km | Valid (`is_valid=True`) |
| `32` | Kudlu | ಕೂಡ್ಲು | Zone2 (Bommanahalli) | 177 - Anekal | 16661.0 | 3.36 sq.km | `make_valid` (Self-intersection[77.653915 12.894532]) |
| `32` | Banaswadi | ಬಾಣಸವಾಡಿ | Zone1 (Byatarayanapura) | 160 - Sarvagnanagar | 25077.0 | 2.02 sq.km | Valid (`is_valid=True`) |
| `32` | Channasandra | ಚನ್ನಸಂದ್ರ | Zone1 (Mahadevapura) | 174 - Mahadevapura | 14621.0 | 2.27 sq.km | Valid (`is_valid=True`) |
| `32` | SilverJubilee Park Ward | ಸಿಲ್ವರ್ ಜುಬಿಲಿ ಪಾರ್ಕ್ ವಾರ್ಡ್ | Zone2 (Gandhinagara) | 169 - Chickpet | 18858.0 | 0.63 sq.km | Valid (`is_valid=True`) |
| `32` | Laggere | ಲಗ್ಗೆರೆ | Zone1 (Rajarajeshwarinagar) | 154 - Rajarajeshwarinagar | 20508.0 | 0.51 sq.km | Valid (`is_valid=True`) |
| `33` | Naganathapura | ನಾಗನಾಥಪುರ | Zone1 (Jayanagar) | 176 - Bangalore South | 18599.0 | 3.35 sq.km | `make_valid` (Ring Self-intersection[77.663439 12.884434]) |
| `33` | Dharmaraya Swamy Temple Ward | ಧರ್ಮರಾಯ ಸ್ವಾಮಿ ದೇವಸ್ಥಾನ ವಾರ್ಡ್ | Zone2 (Gandhinagara) | 169 - Chickpet | 18905.0 | 0.76 sq.km | Valid (`is_valid=True`) |
| `33` | Lakshmi Devi Nagar | ಲಕ್ಷ್ಮಿ ದೇವಿ ನಗರ | Zone1 (Rajarajeshwarinagar) | 154 - Rajarajeshwarinagar | 24599.0 | 0.52 sq.km | Valid (`is_valid=True`) |
| `33` | HRBR Layout | ಹೆಚ್‌ಆರ್‌ಬಿಆರ್ ಲೇಔಟ್ | Zone1 (Byatarayanapura) | 160 - Sarvagnanagar | 24637.0 | 0.74 sq.km | Valid (`is_valid=True`) |
| `33` | S.M Krishna Ward | ಎಸ್.ಎಂ ಕೃಷ್ಣ ವಾರ್ಡ್ | Zone1 (Mahadevapura) | 174 - Mahadevapura | 16262.0 | 4.91 sq.km | Valid (`is_valid=True`) |
| `34` | Subbayanapalya | ಸುಬ್ಬಯ್ಯನಪಾಳ್ಯ | Zone1 (Byatarayanapura) | 160 - Sarvagnanagar | 22175.0 | 0.48 sq.km | Valid (`is_valid=True`) |
| `34` | Chikkathoguru | ಚಿಕ್ಕ ತೋಗೂರು | Zone1 (Jayanagar) | 176 - Bangalore South | 18868.0 | 5.79 sq.km | Valid (`is_valid=True`) |
| `34` | D.V Gundappa Ward | ಡಿ.ವಿ. ಗುಂಡಪ್ಪ ವಾರ್ಡ್ | Zone2 (Gandhinagara) | 169 - Chickpet | 20279.0 | 0.71 sq.km | Valid (`is_valid=True`) |
| `34` | Peenya | ಪೀಣ್ಯ | Zone1 (Rajarajeshwarinagar) | 154 - Rajarajeshwarinagar | 26003.0 | 4.00 sq.km | Valid (`is_valid=True`) |
| `34` | Kaveri Nagara | ಕಾವೇರಿ ನಗರ | Zone1 (Mahadevapura) | 174 - Mahadevapura | 20959.0 | 2.88 sq.km | Valid (`is_valid=True`) |
| `35` | Kammanahalli | ಕಮ್ಮನಹಳ್ಳಿ | Zone1 (Byatarayanapura) | 160 - Sarvagnanagar | 26646.0 | 0.51 sq.km | Valid (`is_valid=True`) |
| `35` | Goraguntepalya | ಗೋರಗುಂಟೆಪಾಳ್ಯ | Zone1 (Rajarajeshwarinagar) | 154 - Rajarajeshwarinagar | 21462.0 | 2.11 sq.km | `make_valid` (Self-intersection[77.540749 13.032503]) |
| `35` | Vishwapriya Nagara | ವಿಶ್ವಪ್ರಿಯ ನಗರ | Zone1 (Jayanagar) | 176 - Bangalore South | 19281.0 | 2.33 sq.km | Valid (`is_valid=True`) |
| `35` | Garudachar Palya | ಗರುಡಾಚಾರ್ ಪಾಳ್ಯ | Zone1 (Mahadevapura) | 174 - Mahadevapura | 20983.0 | 1.31 sq.km | Valid (`is_valid=True`) |
| `35` | Hombegowda Nagara | ಹೊಂಬೇಗೌಡ ನಗರ | Zone2 (Gandhinagara) | 169 - Chickpet | 18866.0 | 0.96 sq.km | Valid (`is_valid=True`) |
| `36` | Beguru | ಬೇಗೂರು | Zone1 (Jayanagar) | 176 - Bangalore South | 18605.0 | 2.89 sq.km | Valid (`is_valid=True`) |
| `36` | Someshwara Nagara | ಸೋಮೇಶ್ವರ ನಗರ | Zone2 (Gandhinagara) | 169 - Chickpet | 18863.0 | 0.62 sq.km | Valid (`is_valid=True`) |
| `36` | Maruthi Seva Nagara | ಮಾರುತಿ ಸೇವಾ ನಗರ | Zone1 (Byatarayanapura) | 160 - Sarvagnanagar | 24347.0 | 1.20 sq.km | Valid (`is_valid=True`) |
| `36` | Bharath Aikya Ward | ಭಾರತ್ ಐಕ್ಯ ವಾರ್ಡ್ | Zone1 (Mahadevapura) | 174 - Mahadevapura | 19498.0 | 3.94 sq.km | Valid (`is_valid=True`) |
| `36` | Nalwadi Krishnaraja Wadiyar Ward | ನಾಲ್ವಡಿ ಕೃಷ್ಣರಾಜ ಒಡೆಯರ್ ವಾರ್ಡ್ | Zone1 (Rajarajeshwarinagar) | 156 - Mahalakshmi Layout | 28281.0 | 1.79 sq.km | Valid (`is_valid=True`) |
| `37` | Yelenahalli | ಯೆಲೇನಹಳ್ಳಿ | Zone1 (Jayanagar) | 176 - Bangalore South | 18609.0 | 5.04 sq.km | `make_valid` (Self-intersection[77.591188 12.862236]) |
| `37` | Jeevanahalli | ಜೀವನಹಳ್ಳಿ | Zone1 (Byatarayanapura) | 160 - Sarvagnanagar | 28142.0 | 1.53 sq.km | Valid (`is_valid=True`) |
| `37` | Kundalahalli | ಕುಂದಲಹಳ್ಳಿ | Zone1 (Mahadevapura) | 174 - Mahadevapura | 18217.0 | 5.65 sq.km | Valid (`is_valid=True`) |
| `37` | BHEL Ward | ಬಿಎಚ್‌ಇಎಲ್ ವಾರ್ಡ್ | Zone2 (Gandhinagara) | 169 - Chickpet | 19336.0 | 1.06 sq.km | Valid (`is_valid=True`) |
| `37` | Dr. Puneeth Rajkumar Ward | ಡಾ. ಪುನೀತ್ ರಾಜ್‌ಕುಮಾರ್ ವಾರ್ಡ್ | Zone1 (Rajarajeshwarinagar) | 156 - Mahalakshmi Layout | 25126.0 | 0.56 sq.km | `make_valid` (Ring Self-intersection[77.535683 13.021355]) |
| `38` | Doddakammanahalli | ದೊಡ್ಡಕಮ್ಮನಹಳ್ಳಿ | Zone1 (Jayanagar) | 176 - Bangalore South | 19891.0 | 4.88 sq.km | `make_valid` (Ring Self-intersection[77.591188 12.862237]) |
| `38` | Kanakanapalya | ಕನಕನಪಾಳ್ಯ | Zone2 (Gandhinagara) | 169 - Chickpet | 20054.0 | 0.97 sq.km | Valid (`is_valid=True`) |
| `38` | Shampura | ಶಾಂಪುರ | Zone1 (Byatarayanapura) | 159 - Pulakeshinagar | 21846.0 | 0.87 sq.km | Valid (`is_valid=True`) |
| `38` | Nandini Layout | ನಂದಿನಿ ಲೇಔಟ್ | Zone1 (Rajarajeshwarinagar) | 156 - Mahalakshmi Layout | 19639.0 | 0.37 sq.km | Valid (`is_valid=True`) |
| `38` | Whitefield | ವೈಟ್‌ಫೀಲ್ಡ್ | Zone1 (Mahadevapura) | 174 - Mahadevapura | 20265.0 | 4.45 sq.km | Valid (`is_valid=True`) |
| `39` | Gottigere | ಗೊಟ್ಟಿಗೆರೆ | Zone1 (Jayanagar) | 176 - Bangalore South | 21839.0 | 2.06 sq.km | Valid (`is_valid=True`) |
| `39` | Hagaduru | ಹಗದೂರು | Zone1 (Mahadevapura) | 174 - Mahadevapura | 15105.0 | 5.80 sq.km | Valid (`is_valid=True`) |
| `39` | Kaval Byrasandra | ಕಾವಲ್ ಬೈರಸಂದ್ರ | Zone1 (Byatarayanapura) | 159 - Pulakeshinagar | 21965.0 | 0.73 sq.km | Valid (`is_valid=True`) |
| `39` | Venkat Reddy Nagara | ವೆಂಕಟ ರೆಡ್ಡಿ ನಗರ | Zone2 (Gandhinagara) | 169 - Chickpet | 18888.0 | 0.20 sq.km | Valid (`is_valid=True`) |
| `39` | Jai Maruthi Nagar | ಜೈ ಮಾರುತಿ ನಗರ | Zone1 (Rajarajeshwarinagar) | 156 - Mahalakshmi Layout | 27166.0 | 0.91 sq.km | Valid (`is_valid=True`) |
| `40` | Anjanapura | ಅಂಜನಾಪುರ | Zone1 (Jayanagar) | 176 - Bangalore South | 23865.0 | 12.16 sq.km | Valid (`is_valid=True`) |
| `40` | Varthur | ವರ್ತೂರು | Zone1 (Mahadevapura) | 174 - Mahadevapura | 20908.0 | 9.15 sq.km | Valid (`is_valid=True`) |
| `40` | Ashoka Pillar | ಅಶೋಕ ಪಿಲ್ಲರ್‌ | Zone2 (Gandhinagara) | 169 - Chickpet | 18989.0 | 1.55 sq.km | Valid (`is_valid=True`) |
| `40` | Shakthi Nagar | ಶಕ್ತಿ ನಗರ | Zone1 (Byatarayanapura) | 159 - Pulakeshinagar | 20035.0 | 0.33 sq.km | Valid (`is_valid=True`) |
| `40` | Mahalakshmipuram | ಮಹಾಲಕ್ಷ್ಮಿಪುರಂ | Zone1 (Rajarajeshwarinagar) | 156 - Mahalakshmi Layout | 28125.0 | 0.52 sq.km | Valid (`is_valid=True`) |
| `41` | V.V Puram | ವಿ.ವಿ. ಪುರಂ | Zone2 (Gandhinagara) | 169 - Chickpet | 19813.0 | 1.08 sq.km | Valid (`is_valid=True`) |
| `41` | Periyar Nagar | ಪೆರಿಯಾರ್ ನಗರ | Zone1 (Byatarayanapura) | 159 - Pulakeshinagar | 19963.0 | 0.25 sq.km | Valid (`is_valid=True`) |
| `41` | Kothanur | ಕೊತ್ತನೂರು | Zone1 (Jayanagar) | 176 - Bangalore South | 23161.0 | 3.45 sq.km | Valid (`is_valid=True`) |
| `41` | Munnenkolalu | ಮುನ್ನೇನಕೊಳಲು | Zone1 (Mahadevapura) | 174 - Mahadevapura | 20977.0 | 2.48 sq.km | Valid (`is_valid=True`) |
| `41` | Nagapura | ನಾಗಪುರ | Zone1 (Rajarajeshwarinagar) | 156 - Mahalakshmi Layout | 26591.0 | 0.97 sq.km | Valid (`is_valid=True`) |
| `42` | RBI Layout | ಆರ್‌ಬಿಐ ಲೇಔಟ್ | Zone1 (Jayanagar) | 176 - Bangalore South | 22569.0 | 2.02 sq.km | Valid (`is_valid=True`) |
| `42` | Priyadarshini Ward | ಪ್ರಿಯದರ್ಶಿನಿ ವಾರ್ಡ್ | Zone1 (Mahadevapura) | 174 - Mahadevapura | 16847.0 | 1.60 sq.km | Valid (`is_valid=True`) |
| `42` | Aruna Asif Ali Ward | ಅರುಣಾ ಆಸಿಫ್ ಅಲಿ ವಾರ್ಡ್ | Zone1 (Byatarayanapura) | 159 - Pulakeshinagar | 29461.0 | 0.35 sq.km | Valid (`is_valid=True`) |
| `42` | Sunkenahalli | ಸುಂಕೇನಹಳ್ಳಿ | Zone2 (Gandhinagara) | 169 - Chickpet | 21179.0 | 1.57 sq.km | Valid (`is_valid=True`) |
| `42` | Raja Mayura Varma Ward | ರಾಜ ಮಯೂರ ವರ್ಮಾ ವಾರ್ಡ್ | Zone1 (Rajarajeshwarinagar) | 156 - Mahalakshmi Layout | 27523.0 | 0.48 sq.km | `make_valid` (Ring Self-intersection[77.528148 12.999149]) |
| `43` | Bheereshwara Nagar | ಭೀರೇಶ್ವರ ನಗರ | Zone1 (Jayanagar) | 176 - Bangalore South | 26950.0 | 0.83 sq.km | `make_valid` (Self-intersection[77.57548 12.895159]) |
| `43` | Varalakshmi Nagar | ವರಲಕ್ಷ್ಮಿ ನಗರ | Zone1 (Byatarayanapura) | 159 - Pulakeshinagar | 26578.0 | 1.68 sq.km | `make_valid` (Self-intersection[77.599699009998 13.027862964293]) |
| `43` | Dodda Nekkundi | ದೊಡ್ಡ ನೆಕ್ಕುಂಡಿ | Zone1 (Mahadevapura) | 174 - Mahadevapura | 16961.0 | 3.64 sq.km | Valid (`is_valid=True`) |
| `43` | Devaraj Urs Ward | ದೇವರಾಜ ಅರಸು ವಾರ್ಡ್‌ | Zone2 (Gandhinagara) | 169 - Chickpet | 19525.0 | 0.53 sq.km | Valid (`is_valid=True`) |
| `43` | Kethamaranahalli | ಕೇತಮಾರನಹಳ್ಳಿ | Zone1 (Rajarajeshwarinagar) | 156 - Mahalakshmi Layout | 28154.0 | 1.44 sq.km | Valid (`is_valid=True`) |
| `44` | Harinagar | ಹರಿನಗರ | Zone1 (Jayanagar) | 176 - Bangalore South | 21893.0 | 1.77 sq.km | Valid (`is_valid=True`) |
| `44` | Doddanna Nagar | ದೊಡ್ಡಣ್ಣ ನಗರ | Zone1 (Byatarayanapura) | 159 - Pulakeshinagar | 29566.0 | 0.46 sq.km | Valid (`is_valid=True`) |
| `44` | Ashwath Nagar | ಅಶ್ವಥ್ ನಗರ | Zone1 (Mahadevapura) | 174 - Mahadevapura | 15851.0 | 1.27 sq.km | Valid (`is_valid=True`) |
| `44` | Chamarajpet | ಚಾಮರಾಜಪೇಟೆ | Zone2 (Gandhinagara) | 168 - Chamrajapet | 25619.0 | 0.89 sq.km | Valid (`is_valid=True`) |
| `44` | Shankar Mutt | ಶಂಕರ ಮಠ | Zone1 (Rajarajeshwarinagar) | 156 - Mahalakshmi Layout | 28358.0 | 0.50 sq.km | Valid (`is_valid=True`) |
| `45` | Marathahalli | ಮಾರತಹಳ್ಳಿ | Zone1 (Mahadevapura) | 174 - Mahadevapura | 17823.0 | 1.00 sq.km | Valid (`is_valid=True`) |
| `45` | Konanakunte | ಕೋಣನಕುಂಟೆ | Zone1 (Jayanagar) | 176 - Bangalore South | 20525.0 | 1.65 sq.km | Valid (`is_valid=True`) |
| `45` | Kushal Nagar | ಕುಶಾಲ್ ನಗರ | Zone1 (Byatarayanapura) | 159 - Pulakeshinagar | 19954.0 | 0.28 sq.km | Valid (`is_valid=True`) |
| `45` | K.R Market | ಕೆ.ಆರ್. ಮಾರುಕಟ್ಟೆ | Zone2 (Gandhinagara) | 168 - Chamrajapet | 22413.0 | 0.74 sq.km | Valid (`is_valid=True`) |
| `45` | Shakthi Ganapathi Nagara | ಶಕ್ತಿ ಗಣಪತಿ ನಗರ | Zone1 (Rajarajeshwarinagar) | 156 - Mahalakshmi Layout | 20838.0 | 0.39 sq.km | Valid (`is_valid=True`) |
| `46` | Yamalur | ಯಮಲೂರು | Zone1 (Mahadevapura) | 174 - Mahadevapura | 17526.0 | 7.06 sq.km | Valid (`is_valid=True`) |
| `46` | Yelachenahalli | ಯೆಲಚೇನಹಳ್ಳಿ | Zone1 (Jayanagar) | 176 - Bangalore South | 23953.0 | 0.92 sq.km | Valid (`is_valid=True`) |
| `46` | Sagayapuram | ಸಗಾಯಪುರಂ | Zone1 (Byatarayanapura) | 159 - Pulakeshinagar | 28588.0 | 0.66 sq.km | Valid (`is_valid=True`) |
| `46` | Cheluvadi Palya | ಚೆಲುವಾದಿ ಪಾಳ್ಯ | Zone2 (Gandhinagara) | 168 - Chamrajapet | 21019.0 | 0.22 sq.km | `make_valid` (Ring Self-intersection[77.570221 12.967956]) |
| `46` | Kamalanagara | ಕಮಲಾನಗರ | Zone1 (Rajarajeshwarinagar) | 156 - Mahalakshmi Layout | 28196.0 | 0.46 sq.km | Valid (`is_valid=True`) |
| `47` | Pulakeshi Nagar | ಪುಲಕೇಶಿ ನಗರ | Zone1 (Byatarayanapura) | 159 - Pulakeshinagar | 21148.0 | 1.30 sq.km | Valid (`is_valid=True`) |
| `47` | Chandranagara | ಚಂದ್ರನಗರ | Zone1 (Jayanagar) | 176 - Bangalore South | 22054.0 | 0.61 sq.km | Valid (`is_valid=True`) |
| `47` | Bellanduru | ಬೆಳ್ಳಂದೂರು | Zone1 (Mahadevapura) | 174 - Mahadevapura | 16685.0 | 1.91 sq.km | Valid (`is_valid=True`) |
| `47` | Vrishabhavathi Nagar | ವೃಷಭಾವತಿ ನಗರ | Zone1 (Rajarajeshwarinagar) | 156 - Mahalakshmi Layout | 28346.0 | 0.59 sq.km | Valid (`is_valid=True`) |
| `47` | IPD Salappa Ward | ಐಪಿಡಿ ಸಾಲಪ್ಪ ವಾರ್ಡ್ | Zone2 (Gandhinagara) | 168 - Chamrajapet | 20622.0 | 0.49 sq.km | Valid (`is_valid=True`) |
| `48` | Vasanthapura | ವಸಂತಪುರ | Zone1 (Jayanagar) | 176 - Bangalore South | 22830.0 | 1.58 sq.km | Valid (`is_valid=True`) |
| `48` | S.K Garden | ಎಸ್.ಕೆ. ಗಾರ್ಡನ್ | Zone1 (Byatarayanapura) | 159 - Pulakeshinagar | 20102.0 | 0.99 sq.km | Valid (`is_valid=True`) |
| `48` | Mathikere | ಮತ್ತಿಕೆರೆ | Zone2 (Malleshwaram) | 157 - Malleshwaram | 26058.0 | 0.67 sq.km | Valid (`is_valid=True`) |
| `48` | Panathur | ಪಣತ್ತೂರು | Zone1 (Mahadevapura) | 174 - Mahadevapura | 14766.0 | 8.66 sq.km | Valid (`is_valid=True`) |
| `48` | Azad Nagar | ಆಜಾದ್ ನಗರ | Zone2 (Gandhinagara) | 168 - Chamrajapet | 20270.0 | 0.41 sq.km | Valid (`is_valid=True`) |
| `49` | Uttarahalli | ಉತ್ತರಹಳ್ಳಿ | Zone1 (Jayanagar) | 176 - Bangalore South | 25302.0 | 2.15 sq.km | Valid (`is_valid=True`) |
| `49` | Aramane Nagara | ಅರಮನೆ ನಗರ | Zone2 (Malleshwaram) | 157 - Malleshwaram | 26145.0 | 0.88 sq.km | Valid (`is_valid=True`) |
| `49` | Kasturbha Nagar | ಕಸ್ತೂರ ಬಾ ವಾರ್ಡ್‌ | Zone2 (Gandhinagara) | 168 - Chamrajapet | 24488.0 | 0.37 sq.km | Valid (`is_valid=True`) |
| `49` | Jaya Chamarajendra Nagara | ಜಯ ಚಾಮರಾಜೇಂದ್ರ ನಗರ | Zone2 (Yelahanka) | 158 - Hebbal | 25953.0 | 0.66 sq.km | Valid (`is_valid=True`) |
| `49` | Doddakannelli Ward | ದೊಡ್ಡಕನ್ನೆಲ್ಲಿ ವಾರ್ಡ್ | Zone1 (Mahadevapura) | 174 - Mahadevapura | 15012.0 | 4.57 sq.km | Valid (`is_valid=True`) |
| `50` | Dinnur | ದಿಣ್ಣೂರು | Zone2 (Yelahanka) | 158 - Hebbal | 27395.0 | 0.51 sq.km | Valid (`is_valid=True`) |
| `50` | Sarvabhouma Nagar | ಸಾರ್ವಭೌಮ ನಗರ | Zone1 (Jayanagar) | 176 - Bangalore South | 25256.0 | 1.02 sq.km | Valid (`is_valid=True`) |
| `50` | JJR Nagara | ಜೆಜೆಆರ್ ನಗರ | Zone2 (Gandhinagara) | 168 - Chamrajapet | 27850.0 | 0.53 sq.km | Valid (`is_valid=True`) |
| `50` | Gunjur | ಗುಂಜೂರು | Zone1 (Mahadevapura) | 174 - Mahadevapura | 15085.0 | 12.74 sq.km | Valid (`is_valid=True`) |
| `50` | Sadashiva Nagara | ಸದಾಶಿವ ನಗರ | Zone2 (Malleshwaram) | 157 - Malleshwaram | 19596.0 | 4.97 sq.km | Valid (`is_valid=True`) |
| `51` | Old Guddadahalli | ಹಳೆ ಗುಡ್ಡದಹಳ್ಳಿ | Zone2 (Gandhinagara) | 168 - Chamrajapet | 25228.0 | 0.21 sq.km | `make_valid` (Self-intersection[77.545166 12.962246]) |
| `51` | Subramanyapura | ಸುಬ್ರಹ್ಮಣ್ಯಪುರ | Zone1 (Jayanagar) | 176 - Bangalore South | 27304.0 | 7.71 sq.km | Valid (`is_valid=True`) |
| `51` | Manorayanapalya | ಮನೋರಾಯನಪಾಳ್ಯ | Zone2 (Yelahanka) | 158 - Hebbal | 23684.0 | 0.53 sq.km | Valid (`is_valid=True`) |
| `51` | Rajamahal | ರಾಜಮಹಲ್ | Zone2 (Malleshwaram) | 157 - Malleshwaram | 24705.0 | 2.44 sq.km | Valid (`is_valid=True`) |
| `52` | Talagattapura | ತಲಘಟ್ಟಪುರ | Zone1 (Jayanagar) | 153 - Yeshwanthapura | 23797.0 | 18.07 sq.km | Valid (`is_valid=True`) |
| `52` | Padarayanapura | ಪಾದರಾಯನಪುರ | Zone2 (Gandhinagara) | 168 - Chamrajapet | 25833.0 | 0.23 sq.km | Valid (`is_valid=True`) |
| `52` | Vishwanatha Nagenahalli | ವಿಶ್ವನಾಥ ನಾಗೇನಹಳ್ಳಿ | Zone2 (Yelahanka) | 158 - Hebbal | 28859.0 | 0.97 sq.km | Valid (`is_valid=True`) |
| `52` | Kodandarampura | ಕೋದಂಡರಾಮಪುರ | Zone2 (Malleshwaram) | 157 - Malleshwaram | 18962.0 | 0.50 sq.km | Valid (`is_valid=True`) |
| `53` | Rayapuram | ರಾಯಪುರಂ | Zone2 (Gandhinagara) | 168 - Chamrajapet | 23438.0 | 0.21 sq.km | Valid (`is_valid=True`) |
| `53` | R.T Nagar | ಆರ್.ಟಿ ನಗರ | Zone2 (Yelahanka) | 158 - Hebbal | 29905.0 | 0.63 sq.km | Valid (`is_valid=True`) |
| `53` | Jaraganahalli | ಜರಗನಹಳ್ಳಿ | Zone2 (Bommanahalli) | 175 - Bommanahalli | 22646.0 | 0.86 sq.km | Valid (`is_valid=True`) |
| `53` | Malleshwaram | ಮಲ್ಲೇಶ್ವರಂ | Zone2 (Malleshwaram) | 157 - Malleshwaram | 21827.0 | 2.14 sq.km | Valid (`is_valid=True`) |
| `54` | Gangenahalli | ಗಂಗೇನಹಳ್ಳಿ | Zone2 (Yelahanka) | 158 - Hebbal | 24120.0 | 1.08 sq.km | Valid (`is_valid=True`) |
| `54` | Kengal Hanumanthaiah South | ಕೆಂಗಲ್ ಹನುಮಂತಯ್ಯ ದಕ್ಷಿಣ | Zone2 (Bommanahalli) | 175 - Bommanahalli | 25484.0 | 0.84 sq.km | Valid (`is_valid=True`) |
| `54` | Subedarpalya | ಸುಬೇದಾರಪಾಳ್ಯ | Zone2 (Malleshwaram) | 157 - Malleshwaram | 24829.0 | 0.53 sq.km | `make_valid` (Ring Self-intersection[77.55586 13.015809]) |
| `54` | Binnypete | ಬಿನ್ನಿಪೇಟೆ | Zone2 (Gandhinagara) | 164 - Gandhinagara | 25018.0 | 0.48 sq.km | Valid (`is_valid=True`) |
| `55` | Ganganagar | ಗಂಗಾನಗರ | Zone2 (Yelahanka) | 158 - Hebbal | 25186.0 | 0.74 sq.km | Valid (`is_valid=True`) |
| `55` | Puttenahalli | ಪುಟ್ಟೇನಹಳ್ಳಿ | Zone2 (Bommanahalli) | 175 - Bommanahalli | 21484.0 | 1.04 sq.km | Valid (`is_valid=True`) |
| `55` | Bhuvaneshwari Nagar | ಭುವನೇಶ್ವರಿ ನಗರ | Zone2 (Gandhinagara) | 164 - Gandhinagara | 19936.0 | 0.24 sq.km | Valid (`is_valid=True`) |
| `55` | Subramanyanagara | ಸುಬ್ರಹ್ಮಣ್ಯನಗರ | Zone2 (Malleshwaram) | 157 - Malleshwaram | 27312.0 | 0.83 sq.km | Valid (`is_valid=True`) |
| `56` | Hebbal | ಹೆಬ್ಬಾಳ | Zone2 (Yelahanka) | 158 - Hebbal | 27422.0 | 1.10 sq.km | Valid (`is_valid=True`) |
| `56` | Doresanipalya | ದೊರೆಸಾನಿಪಾಳ್ಯ | Zone2 (Bommanahalli) | 175 - Bommanahalli | 23059.0 | 2.52 sq.km | Valid (`is_valid=True`) |
| `56` | Gayathri Nagara | ಗಾಯತ್ರಿ ನಗರ | Zone2 (Malleshwaram) | 157 - Malleshwaram | 26978.0 | 0.44 sq.km | `make_valid` (Self-intersection[77.560572 12.997178]) |
| `56` | Gopalpura | ಗೋಪಾಲಪುರ | Zone2 (Gandhinagara) | 164 - Gandhinagara | 26986.0 | 1.27 sq.km | Valid (`is_valid=True`) |
| `57` | Bhoopasandra | ಭೂಪಸಂದ್ರ | Zone2 (Yelahanka) | 158 - Hebbal | 25193.0 | 2.64 sq.km | Valid (`is_valid=True`) |
| `57` | Hulimavu | ಹುಳಿಮಾವು | Zone2 (Bommanahalli) | 175 - Bommanahalli | 19598.0 | 1.33 sq.km | Valid (`is_valid=True`) |
| `57` | Kuvempu Ward | ಕುವೆಂಪು ವಾರ್ಡ್ | Zone2 (Malleshwaram) | 157 - Malleshwaram | 24283.0 | 0.47 sq.km | Valid (`is_valid=True`) |
| `57` | Cottonpete | ಕಾಟನ್‌ಪೇಟೆ | Zone2 (Gandhinagara) | 164 - Gandhinagara | 27147.0 | 0.96 sq.km | Valid (`is_valid=True`) |
| `58` | Nagashettyhalli | ನಾಗಶೆಟ್ಟಿಹಳ್ಳಿ | Zone2 (Yelahanka) | 158 - Hebbal | 23289.0 | 0.96 sq.km | Valid (`is_valid=True`) |
| `58` | Dayanand Nagara | ದಯಾನಂದ ನಗರ | Zone2 (Malleshwaram) | 165 - Rajajinagar | 21165.0 | 0.27 sq.km | Valid (`is_valid=True`) |
| `58` | Arakere | ಅರಕೆರೆ | Zone2 (Bommanahalli) | 175 - Bommanahalli | 18995.0 | 1.26 sq.km | Valid (`is_valid=True`) |
| `58` | Chickpete | ಚಿಕ್ಕಪೇಟೆ | Zone2 (Gandhinagara) | 164 - Gandhinagara | 27619.0 | 0.61 sq.km | Valid (`is_valid=True`) |
| `59` | Vijaya Bank Layout | ವಿಜಯ ಬ್ಯಾಂಕ್ ಲೇಔಟ್ | Zone2 (Bommanahalli) | 175 - Bommanahalli | 27787.0 | 4.23 sq.km | Valid (`is_valid=True`) |
| `59` | Geddalahalli | ಗೆದ್ದಲಹಳ್ಳಿ | Zone2 (Yelahanka) | 158 - Hebbal | 23331.0 | 1.46 sq.km | Valid (`is_valid=True`) |
| `59` | Bandi Reddy Circle Ward | ಬಂಡಿ ರೆಡ್ಡಿ ವೃತ್ತ ವಾರ್ಡ್ | Zone2 (Malleshwaram) | 165 - Rajajinagar | 21286.0 | 0.26 sq.km | Valid (`is_valid=True`) |
| `59` | Nehru Nagar | ನೆಹರು ನಗರ | Zone2 (Gandhinagara) | 164 - Gandhinagara | 25780.0 | 1.80 sq.km | Valid (`is_valid=True`) |
| `60` | Jalahalli | ಜಾಲಹಳ್ಳಿ | Zone2 (Yelahanka) | 154 - Rajarajeshwarinagar | 23400.0 | 1.98 sq.km | Valid (`is_valid=True`) |
| `60` | Bilekahalli | ಬಿಳೇಕಹಳ್ಳಿ | Zone2 (Bommanahalli) | 175 - Bommanahalli | 25208.0 | 2.48 sq.km | Valid (`is_valid=True`) |
| `60` | Prakash Nagara | ಪ್ರಕಾಶ ನಗರ | Zone2 (Malleshwaram) | 165 - Rajajinagar | 19859.0 | 0.40 sq.km | Valid (`is_valid=True`) |
| `60` | Seshadripuram | ಶೇಷಾದ್ರಿಪುರಂ | Zone2 (Gandhinagara) | 164 - Gandhinagara | 19052.0 | 0.38 sq.km | Valid (`is_valid=True`) |
| `61` | HMT Ward | ಎಚ್ಎಮ್.ಟಿ ವಾರ್ಡ್ | Zone2 (Yelahanka) | 154 - Rajarajeshwarinagar | 29538.0 | 4.17 sq.km | Valid (`is_valid=True`) |
| `61` | Kodi Chikkanahalli | ಕೋಡಿ ಚಿಕ್ಕನಹಳ್ಳಿ | Zone2 (Bommanahalli) | 175 - Bommanahalli | 27784.0 | 1.13 sq.km | `make_valid` (Ring Self-intersection[77.622729 12.9173]) |
| `61` | Dattatreya Ward | ದತ್ತಾತ್ರೇಯ ವಾರ್ಡ್ | Zone2 (Gandhinagara) | 164 - Gandhinagara | 19627.0 | 0.50 sq.km | Valid (`is_valid=True`) |
| `61` | Da.Ra. Bendre Ward | ದ.ರಾ.ಬೇಂದ್ರೆ ವಾರ್ಡ್ | Zone2 (Malleshwaram) | 165 - Rajajinagar | 20756.0 | 0.53 sq.km | Valid (`is_valid=True`) |
| `62` | Brundavana Nagara | ಬೃಂದಾವನ ನಗರ | Zone2 (Yelahanka) | 154 - Rajarajeshwarinagar | 28749.0 | 0.67 sq.km | Valid (`is_valid=True`) |
| `62` | Swatantra Palya Ward | ಸ್ವತಂತ್ರ ಪಾಳ್ಯ ವಾರ್ಡ್ | Zone2 (Gandhinagara) | 164 - Gandhinagara | 28137.0 | 0.36 sq.km | Valid (`is_valid=True`) |
| `62` | Devarachikkanahalli | ದೇವರಚಿಕ್ಕನಹಳ್ಳಿ | Zone2 (Bommanahalli) | 175 - Bommanahalli | 24847.0 | 1.19 sq.km | Valid (`is_valid=True`) |
| `62` | Rama Mandira | ರಾಮ ಮಂದಿರ | Zone2 (Malleshwaram) | 165 - Rajajinagar | 22322.0 | 0.66 sq.km | Valid (`is_valid=True`) |
| `63` | J.P PARK | ಜೆಪಿ ಪಾರ್ಕ್ | Zone2 (Yelahanka) | 154 - Rajarajeshwarinagar | 22172.0 | 0.83 sq.km | Valid (`is_valid=True`) |
| `63` | Okalipuram | ಓಕಳಿಪುರಂ | Zone2 (Gandhinagara) | 164 - Gandhinagara | 27815.0 | 0.42 sq.km | Valid (`is_valid=True`) |
| `63` | Bommanahalli | ಬೊಮ್ಮನಹಳ್ಳಿ | Zone2 (Bommanahalli) | 175 - Bommanahalli | 26792.0 | 0.88 sq.km | Valid (`is_valid=True`) |
| `63` | Rajajinagara | ರಾಜಾಜಿನಗರ | Zone2 (Malleshwaram) | 165 - Rajajinagar | 19632.0 | 0.88 sq.km | Valid (`is_valid=True`) |
| `64` | Yeshwanthpura | ಯಶವಂತಪುರ | Zone2 (Yelahanka) | 154 - Rajarajeshwarinagar | 20236.0 | 0.35 sq.km | Valid (`is_valid=True`) |
| `64` | Hongasandra | ಹೊಂಗಸಂದ್ರ | Zone2 (Bommanahalli) | 175 - Bommanahalli | 27790.0 | 0.50 sq.km | Valid (`is_valid=True`) |
| `64` | Shivanagara | ಶಿವನಗರ | Zone2 (Malleshwaram) | 165 - Rajajinagar | 20472.0 | 0.29 sq.km | Valid (`is_valid=True`) |
| `65` | Abbigere | ಅಬ್ಬಿಗೆರೆ | Zone2 (Yelahanka) | 155 - Dasarahalli | 21241.0 | 4.58 sq.km | Valid (`is_valid=True`) |
| `65` | Garvebavi Palya | ಗಾರ್ವೆಬಾವಿ ಪಾಳ್ಯ | Zone2 (Bommanahalli) | 175 - Bommanahalli | 22967.0 | 1.27 sq.km | Valid (`is_valid=True`) |
| `65` | Manjunath Nagara | ಮಂಜುನಾಥ್  ನಗರ | Zone2 (Malleshwaram) | 165 - Rajajinagar | 20584.0 | 0.28 sq.km | Valid (`is_valid=True`) |
| `66` | Kammagondanahalli | ಕಮ್ಮಗೊಂಡನಹಳ್ಳಿ | Zone2 (Yelahanka) | 155 - Dasarahalli | 20542.0 | 1.39 sq.km | Valid (`is_valid=True`) |
| `66` | Singasandra | ಸಿಂಗಸಂದ್ರ | Zone2 (Bommanahalli) | 175 - Bommanahalli | 19089.0 | 1.86 sq.km | Valid (`is_valid=True`) |
| `66` | Sane Guruvana Halli | ಸಾಣೆ ಗುರುವನ ಹಳ್ಳಿ | Zone2 (Malleshwaram) | 165 - Rajajinagar | 20561.0 | 0.35 sq.km | Valid (`is_valid=True`) |
| `67` | Shettihalli | ಶೆಟ್ಟಿಹಳ್ಳಿ | Zone2 (Yelahanka) | 155 - Dasarahalli | 23313.0 | 3.70 sq.km | Valid (`is_valid=True`) |
| `67` | Bandepalya | ಬಂಡೇಪಾಳ್ಯ | Zone2 (Bommanahalli) | 175 - Bommanahalli | 19744.0 | 1.76 sq.km | Valid (`is_valid=True`) |
| `67` | Basaveshwara Nagara | ಬಸವೇಶ್ವರ ನಗರ | Zone2 (Malleshwaram) | 165 - Rajajinagar | 20769.0 | 0.87 sq.km | Valid (`is_valid=True`) |
| `68` | Mallasandra | ಮಲ್ಲಸಂದ್ರ | Zone2 (Yelahanka) | 155 - Dasarahalli | 26890.0 | 1.19 sq.km | Valid (`is_valid=True`) |
| `68` | Mangammana Palya | ಮಂಗಮ್ಮನ ಪಾಳ್ಯ | Zone2 (Bommanahalli) | 175 - Bommanahalli | 23783.0 | 0.59 sq.km | Valid (`is_valid=True`) |
| `68` | Kamakshipalya | ಕಾಮಾಕ್ಷಿಪಾಳ್ಯ | Zone2 (Malleshwaram) | 165 - Rajajinagar | 25024.0 | 0.67 sq.km | Valid (`is_valid=True`) |
| `69` | Bagalagunte | ಬಾಗಲಗುಂಟೆ | Zone2 (Yelahanka) | 155 - Dasarahalli | 28685.0 | 2.52 sq.km | Valid (`is_valid=True`) |
| `69` | Hosapalya | ಹೊಸಪಾಳ್ಯ | Zone2 (Bommanahalli) | 175 - Bommanahalli | 18834.0 | 1.32 sq.km | Valid (`is_valid=True`) |
| `69` | Agrahara Dasarahalli | ಅಗ್ರಹಾರ ದಾಸರಹಳ್ಳಿ | Zone2 (Malleshwaram) | 166 - Govindraj Nagar | 24742.0 | 0.52 sq.km | Valid (`is_valid=True`) |
| `70` | Manjunatha Nagar | ಮಂಜುನಾಥ ನಗರ | Zone2 (Yelahanka) | 155 - Dasarahalli | 27870.0 | 1.49 sq.km | Valid (`is_valid=True`) |
| `70` | Iblur | ಇಬ್ಬಲೂರು | Zone2 (Bommanahalli) | 175 - Bommanahalli | 27146.0 | 2.80 sq.km | `make_valid` (Ring Self-intersection[77.654796 12.901776]) |
| `70` | Dr Rajkumar Ward | ಡಾ. ರಾಜ್‌ಕುಮಾರ್ ವಾರ್ಡ್ | Zone2 (Malleshwaram) | 166 - Govindraj Nagar | 24106.0 | 0.98 sq.km | Valid (`is_valid=True`) |
| `71` | Nele Maheshwaramma Temple Ward | ನೆಲೆ ಮಹೇಶ್ವರಮ್ಮ ದೇವಸ್ಥಾನ ವಾರ್ಡ್ | Zone2 (Yelahanka) | 155 - Dasarahalli | 27033.0 | 0.59 sq.km | Valid (`is_valid=True`) |
| `71` | Agara | ಅಗರ | Zone2 (Bommanahalli) | 175 - Bommanahalli | 18836.0 | 1.86 sq.km | Valid (`is_valid=True`) |
| `71` | Thimmenahalli | ತಿಮ್ಮೇನಹಳ್ಳಿ | Zone2 (Malleshwaram) | 166 - Govindraj Nagar | 23837.0 | 0.69 sq.km | Valid (`is_valid=True`) |
| `72` | Dasarahalli | ದಾಸರಹಳ್ಳಿ | Zone2 (Yelahanka) | 155 - Dasarahalli | 29082.0 | 0.74 sq.km | Valid (`is_valid=True`) |
| `72` | HSR Layout | ಎಚ್‌ಎಸ್‌ಆರ್ ಲೇಔಟ್ | Zone2 (Bommanahalli) | 175 - Bommanahalli | 18787.0 | 2.67 sq.km | Valid (`is_valid=True`) |
| `72` | Kaveripura | ಕಾವೇರಿಪುರ | Zone2 (Malleshwaram) | 166 - Govindraj Nagar | 22300.0 | 1.01 sq.km | Valid (`is_valid=True`) |
| `73` | Dr. Vishnuvardhan Ward | ಡಾII ವಿಷ್ಣುವರ್ಧನ್ ವಾರ್ಡ್ | Zone2 (Malleshwaram) | 166 - Govindraj Nagar | 21949.0 | 0.89 sq.km | Valid (`is_valid=True`) |
| `74` | Pattegar Palya | ಪಟ್ಟೆಗಾರ್ ಪಾಳ್ಯ | Zone2 (Malleshwaram) | 166 - Govindraj Nagar | 20465.0 | 0.42 sq.km | Valid (`is_valid=True`) |
| `75` | Marenahalli West | ಮಾರೇನಹಳ್ಳಿ ಪಶ್ಚಿಮ | Zone2 (Malleshwaram) | 166 - Govindraj Nagar | 23915.0 | 0.49 sq.km | Valid (`is_valid=True`) |
| `76` | Moodalapalya | ಮೂಡಲಪಾಳ್ಯ | Zone2 (Malleshwaram) | 166 - Govindraj Nagar | 19590.0 | 0.40 sq.km | Valid (`is_valid=True`) |
| `77` | Maruthi Mandira Ward | ಮಾರುತಿ ಮಂದಿರ ವಾರ್ಡ್ | Zone2 (Malleshwaram) | 166 - Govindraj Nagar | 21251.0 | 0.55 sq.km | Valid (`is_valid=True`) |
| `78` | Anubhava Nagara | ಅನುಭವ ನಗರ | Zone2 (Malleshwaram) | 166 - Govindraj Nagar | 23375.0 | 0.62 sq.km | Valid (`is_valid=True`) |
| `79` | Nagarbhavi | ನಾಗರಭಾವಿ | Zone2 (Malleshwaram) | 166 - Govindraj Nagar | 28194.0 | 2.18 sq.km | `make_valid` (Ring Self-intersection[77.517788 12.936379]) |
| `80` | Chandra Layout | ಚಂದ್ರ ಲೇಔಟ್ | Zone2 (Malleshwaram) | 166 - Govindraj Nagar | 26205.0 | 0.67 sq.km | Valid (`is_valid=True`) |
| `81` | Nayanda Halli | ನಾಯಂಡ ಹಳ್ಳಿ | Zone2 (Malleshwaram) | 166 - Govindraj Nagar | 25982.0 | 0.88 sq.km | Valid (`is_valid=True`) |
| `82` | Attigupe | ಅತ್ತಿಗುಪ್ಪೆ | Zone2 (Malleshwaram) | 167 - Vijayanagar | 24614.0 | 0.85 sq.km | Valid (`is_valid=True`) |
| `83` | Hampi Nagar | ಹಂಪಿ ನಗರ | Zone2 (Malleshwaram) | 167 - Vijayanagar | 23420.0 | 0.90 sq.km | Valid (`is_valid=True`) |
| `84` | Hosahalli | ಹೊಸಹಳ್ಳಿ | Zone2 (Malleshwaram) | 167 - Vijayanagar | 27966.0 | 0.63 sq.km | Valid (`is_valid=True`) |
| `85` | Adi Chunchanagiri Ward | ಆದಿ ಚುಂಚನಗಿರಿ ವಾರ್ಡ್ | Zone2 (Malleshwaram) | 167 - Vijayanagar | 26463.0 | 0.71 sq.km | `make_valid` (Ring Self-intersection[77.545171 12.962238]) |
| `86` | Vidyaranyanagara | ವಿದ್ಯಾರಣ್ಯನಗರ | Zone2 (Malleshwaram) | 167 - Vijayanagar | 28411.0 | 0.31 sq.km | Valid (`is_valid=True`) |
| `87` | K.P Agrahara | ಕೆ.ಪಿ. ಅಗ್ರಹಾರ | Zone2 (Malleshwaram) | 167 - Vijayanagar | 23555.0 | 0.34 sq.km | Valid (`is_valid=True`) |
| `88` | Sangolli Rayanna Ward | ಸಂಗೊಳ್ಳಿ ರಾಯಣ್ಣ ವಾರ್ಡ್ | Zone2 (Malleshwaram) | 167 - Vijayanagar | 26299.0 | 0.20 sq.km | Valid (`is_valid=True`) |
| `89` | Bapuji Nagara | ಬಾಪೂಜಿ ನಗರ | Zone2 (Malleshwaram) | 167 - Vijayanagar | 20625.0 | 0.35 sq.km | Valid (`is_valid=True`) |
| `90` | Krishnadevaraya ward | ಕೃಷ್ಣದೇವರಾಯ ವಾರ್ಡ್ | Zone2 (Malleshwaram) | 167 - Vijayanagar | 28148.0 | 0.48 sq.km | Valid (`is_valid=True`) |
| `91` | Gali Anjaneya Temple Ward | ಗಾಳಿ ಆಂಜನೇಯ ದೇವಸ್ಥಾನ ವಾರ್ಡ್ | Zone2 (Malleshwaram) | 167 - Vijayanagar | 22841.0 | 0.77 sq.km | Valid (`is_valid=True`) |
| `92` | Muneshwara Block | ಮುನೇಶ್ವರ ಬ್ಲಾಕ್ | Zone2 (Malleshwaram) | 167 - Vijayanagar | 19922.0 | 0.63 sq.km | Valid (`is_valid=True`) |
| `93` | Avalahalli | ಆವಲಹಳ್ಳಿ | Zone2 (Malleshwaram) | 167 - Vijayanagar | 24326.0 | 0.45 sq.km | `make_valid` (Ring Self-intersection[77.546412 12.942763]) |
| `94` | Deepanjali Nagara | ದೀಪಾಂಜಲಿ ನಗರ | Zone2 (Malleshwaram) | 167 - Vijayanagar | 27561.0 | 1.77 sq.km | Valid (`is_valid=True`) |
| `95` | Swamy Vivekananda Ward | ಸ್ವಾಮಿ ವಿವೇಕಾನಂದ ವಾರ್ಡ್ | Zone2 (Malleshwaram) | 170 - Basavanagudi | 28152.0 | 1.52 sq.km | Valid (`is_valid=True`) |
| `96` | Kathriguppe | ಕತ್ರಿಗುಪ್ಪೆ | Zone2 (Malleshwaram) | 170 - Basavanagudi | 27696.0 | 1.01 sq.km | `make_valid` (Self-intersection[77.55447 12.923589]) |
| `97` | Srinivasa Nagara | ಶ್ರೀನಿವಾಸ ನಗರ | Zone2 (Malleshwaram) | 170 - Basavanagudi | 25716.0 | 0.43 sq.km | Valid (`is_valid=True`) |
| `98` | Ashoka Nagara | ಅಶೋಕ ನಗರ | Zone2 (Malleshwaram) | 170 - Basavanagudi | 28420.0 | 0.73 sq.km | Valid (`is_valid=True`) |
| `99` | T.R Shamanna Nagar | ಟಿ.ಆರ್.ಶಾಮಣ್ಣ ನಗರ | Zone2 (Malleshwaram) | 170 - Basavanagudi | 22292.0 | 0.35 sq.km | Valid (`is_valid=True`) |
| `100` | Srinagar | ಶ್ರೀನಗರ | Zone2 (Malleshwaram) | 170 - Basavanagudi | 19229.0 | 0.29 sq.km | Valid (`is_valid=True`) |
| `101` | Kempambudhi Ward | ಕೆಂಪಾಂಬುಧಿ ವಾರ್ಡ್ | Zone2 (Malleshwaram) | 170 - Basavanagudi | 19310.0 | 0.60 sq.km | Valid (`is_valid=True`) |
| `102` | Hanumanthanagar | ಹನುಮಂತನಗರ | Zone2 (Malleshwaram) | 170 - Basavanagudi | 24583.0 | 0.68 sq.km | Valid (`is_valid=True`) |
| `103` | N.R Colony | ಎನ್.ಆರ್. ಕಾಲೋನಿ | Zone2 (Malleshwaram) | 170 - Basavanagudi | 27603.0 | 1.06 sq.km | Valid (`is_valid=True`) |
| `104` | Thyagarajnagar | ತ್ಯಾಗರಾಜನಗರ | Zone2 (Malleshwaram) | 170 - Basavanagudi | 21082.0 | 0.42 sq.km | Valid (`is_valid=True`) |
| `105` | Yediyuru | ಯಡಿಯೂರು | Zone1 (Rajarajeshwarinagar) | 171 - Padmanabanagar | 23023.0 | 1.04 sq.km | Valid (`is_valid=True`) |
| `106` | Devagiri Temple Ward | ದೇವಗಿರಿ ದೇವಸ್ಥಾನ ವಾರ್ಡ್ | Zone1 (Rajarajeshwarinagar) | 171 - Padmanabanagar | 19352.0 | 0.85 sq.km | Valid (`is_valid=True`) |
| `107` | Dharmagiri Ward | ಧರ್ಮಗಿರಿ ವಾರ್ಡ್ | Zone1 (Rajarajeshwarinagar) | 171 - Padmanabanagar | 19154.0 | 0.64 sq.km | Valid (`is_valid=True`) |
| `108` | Ganesh Mandira Ward | ಗಣೇಶ್ ಮಂದಿರಾ ವಾರ್ಡ್ | Zone1 (Rajarajeshwarinagar) | 171 - Padmanabanagar | 24265.0 | 1.43 sq.km | Valid (`is_valid=True`) |
| `109` | Kamakya Layout | ಕಾಮಕ್ಯ ಲೇಔಟ್ | Zone1 (Rajarajeshwarinagar) | 171 - Padmanabanagar | 28151.0 | 0.95 sq.km | Valid (`is_valid=True`) |
| `110` | Chikkalasandra | ಚಿಕ್ಕಲ್ಲಸಂದ್ರ | Zone1 (Rajarajeshwarinagar) | 171 - Padmanabanagar | 20242.0 | 0.39 sq.km | Valid (`is_valid=True`) |
| `111` | Ittamadu | ಇಟ್ಟಮಡು | Zone1 (Rajarajeshwarinagar) | 171 - Padmanabanagar | 19028.0 | 0.46 sq.km | Valid (`is_valid=True`) |
| `112` | Hosakerehalli | ಹೊಸಕೆರೆಹಳ್ಳಿ | Zone1 (Rajarajeshwarinagar) | 171 - Padmanabanagar | 23619.0 | 0.65 sq.km | Valid (`is_valid=True`) |

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
- **`planning_districts`**: Bangalore Development Authority (BDA) Revised Master Plan 2015 — 47 Planning Districts Index Map, clipped to Bengaluru South City Corporation boundary.
- No additional overlay layers configured.
