# Map & Geospatial Verification Report — `in-ka-bengaluru-west` (Bengaluru West City Corporation)

**Step**: PR 06–07 / Plan v2.0 §5.C1–C4 · **Verification Cap**: `machine_checked` (Rule R10)

## 1. Coverage & Coordinate Reference System Summary

- **Corporation Boundary Area (`boundary.geojson`)**: 163.57 sq.km (Bounds `EPSG:4326`: `[77.459880, 12.871363, 77.596254, 13.051565]`; Geometry: Repaired via `make_valid` (Self-intersection[77.579617 12.93306]))
- **GBA Zones Within Corporation (`gba-zones.geojson`)**: 2
- **Official Wards Within Corporation (`wards.geojson`)**: 112 (101 valid in source, 11 repaired via `shapely.make_valid`)
- **Intersecting Planning Districts (`planning-districts.geojson`)**: 0
- **Active Master Plan Zone Polygons (`zones.geojson`)**: 0
- **Zoned Area Coverage Within Corporation**: **0.0%**
- **Derived Overlay Features (`overlays.geojson`)**: 0

## 2. Official GBA Zones (`gba-zones.geojson`)

| Zone Code | Zone Name | Corporation Attribute | Area | Geometry Validation |
|---|---|---|---|---|
| `Zone2` | Malleshwaram | `West` | 45.12 sq.km | Repaired via `make_valid` (Self-intersection[77.55447 12.923589]) |
| `Zone1` | Rajarajeshwarinagar | `West` | 118.44 sq.km | Repaired via `make_valid` (Self-intersection[77.579617 12.93306]) |

## 3. Official Delimitation Wards (`wards.geojson` — 112 Wards) & Notification Cross-Check

- **Selection Method (Rule R1)**: Selected deterministically by source attribute `Corporation == "West"` from `https://gisapps.bbmp.gov.in/geoserver/wfs?service=WFS&version=1.1.0&request=GetFeature&typeName=gba_boundary:ward_369_final&outputFormat=application/vnd.google-earth.kml+xml&srsName=EPSG:4326`.
- **Notification Cross-Check**: Cross-checked against the official GBA Ward Delimitation notification (gba_boundary:ward_369_final, November 2025): 112 wards in Bengaluru West City Corporation (out of 369 GBA wards total).

| Ward No. | Ward Name (EN) | Ward Name (KN) | GBA Zone | Assembly Constituency | Population (`TOT_P`) | Area | Geometry Validation |
|---:|---|---|---|---|---:|---:|---|
| `1` | Nagasandra | ನಾಗಸಂದ್ರ | Zone1 (Rajarajeshwarinagar) | 155 - Dasarahalli | 24974.0 | 1.91 sq.km | Valid (`is_valid=True`) |
| `2` | Chokkasandra | ಚೊಕ್ಕಸಂದ್ರ | Zone1 (Rajarajeshwarinagar) | 155 - Dasarahalli | 27117.0 | 1.09 sq.km | Valid (`is_valid=True`) |
| `3` | Nelagadaranahalli | ನೆಲಗದರನಹಳ್ಳಿ | Zone1 (Rajarajeshwarinagar) | 155 - Dasarahalli | 22738.0 | 2.17 sq.km | Valid (`is_valid=True`) |
| `4` | Parvathi Nagar | ಪಾರ್ವತಿ ನಗರ | Zone1 (Rajarajeshwarinagar) | 155 - Dasarahalli | 20312.0 | 1.46 sq.km | Valid (`is_valid=True`) |
| `5` | Rajeshwarinagar | ರಾಜೇಶ್ವರಿನಗರ | Zone1 (Rajarajeshwarinagar) | 155 - Dasarahalli | 25418.0 | 0.47 sq.km | Valid (`is_valid=True`) |
| `6` | Shivapura | ಶಿವಪುರ | Zone1 (Rajarajeshwarinagar) | 155 - Dasarahalli | 26408.0 | 2.68 sq.km | Valid (`is_valid=True`) |
| `7` | Rajagopala Nagara | ರಾಜಗೋಪಾಲ ನಗರ | Zone1 (Rajarajeshwarinagar) | 155 - Dasarahalli | 24944.0 | 1.00 sq.km | Valid (`is_valid=True`) |
| `8` | Hegganahalli | ಹೆಗ್ಗನಹಳ್ಳಿ | Zone1 (Rajarajeshwarinagar) | 155 - Dasarahalli | 28416.0 | 0.88 sq.km | `make_valid` (Ring Self-intersection[77.517703 13.004381]) |
| `9` | Srigandhanagar | ಶ್ರೀಗಂಧನಗರ | Zone1 (Rajarajeshwarinagar) | 155 - Dasarahalli | 22361.0 | 0.75 sq.km | Valid (`is_valid=True`) |
| `10` | Sunkadakatte | ಸುಂಕದಕಟ್ಟೆ | Zone1 (Rajarajeshwarinagar) | 155 - Dasarahalli | 23123.0 | 0.77 sq.km | Valid (`is_valid=True`) |
| `11` | Dodda Bidarakallu | ದೊಡ್ಡ ಬಿದರಕಲ್ಲು | Zone1 (Rajarajeshwarinagar) | 153 - Yeshwanthapura | 25777.0 | 4.24 sq.km | Valid (`is_valid=True`) |
| `12` | Andrahalli | ಅಂದ್ರಹಳ್ಳಿ | Zone1 (Rajarajeshwarinagar) | 153 - Yeshwanthapura | 27694.0 | 5.58 sq.km | Valid (`is_valid=True`) |
| `13` | Nada prabhu Kempegowda Nagara | ನಾಡ ಪ್ರಭು ಕೆಂಪೇಗೌಡ ನಗರ | Zone1 (Rajarajeshwarinagar) | 153 - Yeshwanthapura | 27225.0 | 4.21 sq.km | Valid (`is_valid=True`) |
| `14` | Herohalli | ಹೆರೋಹಳ್ಳಿ | Zone1 (Rajarajeshwarinagar) | 153 - Yeshwanthapura | 28413.0 | 1.50 sq.km | Valid (`is_valid=True`) |
| `15` | Byadarahalli | ಬ್ಯಾಡರಹಳ್ಳಿ | Zone1 (Rajarajeshwarinagar) | 153 - Yeshwanthapura | 22784.0 | 4.16 sq.km | Valid (`is_valid=True`) |
| `16` | Ullal | ಉಳ್ಳಾಲ | Zone1 (Rajarajeshwarinagar) | 153 - Yeshwanthapura | 22549.0 | 5.58 sq.km | Valid (`is_valid=True`) |
| `17` | Nagadevanahalli | ನಾಗದೇವನಹಳ್ಳಿ | Zone1 (Rajarajeshwarinagar) | 153 - Yeshwanthapura | 23269.0 | 2.48 sq.km | Valid (`is_valid=True`) |
| `18` | Kengal Hanumanthaiah West | ಕೆಂಗಲ್ ಹನುಮಂತಯ್ಯ ಪಶ್ಚಿಮ | Zone1 (Rajarajeshwarinagar) | 153 - Yeshwanthapura | 21223.0 | 2.33 sq.km | Valid (`is_valid=True`) |
| `19` | Shivanapalya | ಶಿವನಪಾಳ್ಯ | Zone1 (Rajarajeshwarinagar) | 153 - Yeshwanthapura | 21903.0 | 1.68 sq.km | Valid (`is_valid=True`) |
| `20` | Kengeri Kote ward | ಕೆಂಗೇರಿ ಕೋಟೆ ವಾರ್ಡ್ | Zone1 (Rajarajeshwarinagar) | 153 - Yeshwanthapura | 19339.0 | 15.23 sq.km | `make_valid` (Ring Self-intersection[77.478945 12.886205]) |
| `21` | Kengeri | ಕೆಂಗೇರಿ | Zone1 (Rajarajeshwarinagar) | 153 - Yeshwanthapura | 21835.0 | 6.10 sq.km | Valid (`is_valid=True`) |
| `22` | Bangarappa Nagara | ಬಂಗಾರಪ್ಪ ನಗರ | Zone1 (Rajarajeshwarinagar) | 154 - Rajarajeshwarinagar | 28414.0 | 6.76 sq.km | Valid (`is_valid=True`) |
| `23` | Rajarajeshwari Nagara | ರಾಜರಾಜೇಶ್ವರಿ ನಗರ | Zone1 (Rajarajeshwarinagar) | 154 - Rajarajeshwarinagar | 26050.0 | 4.13 sq.km | Valid (`is_valid=True`) |
| `24` | Jnana Bharathi Ward | ಜ್ಞಾನ ಭಾರತಿ ವಾರ್ಡ್ | Zone1 (Rajarajeshwarinagar) | 154 - Rajarajeshwarinagar | 20533.0 | 6.62 sq.km | Valid (`is_valid=True`) |
| `25` | Vinayaka Layout | ವಿನಾಯಕ ಲೇಔಟ್ | Zone1 (Rajarajeshwarinagar) | 154 - Rajarajeshwarinagar | 20170.0 | 2.58 sq.km | Valid (`is_valid=True`) |
| `26` | Mallathahalli | ಮಲ್ಲತ್ತಹಳ್ಳಿ | Zone1 (Rajarajeshwarinagar) | 154 - Rajarajeshwarinagar | 21575.0 | 2.62 sq.km | Valid (`is_valid=True`) |
| `27` | Srigandada Kaval | ಶ್ರೀಗಂಧದ ಕಾವಲ್ | Zone1 (Rajarajeshwarinagar) | 154 - Rajarajeshwarinagar | 25652.0 | 2.24 sq.km | Valid (`is_valid=True`) |
| `28` | Kottegepalya | ಕೊಟ್ಟಿಗೆಪಾಳ್ಯ | Zone1 (Rajarajeshwarinagar) | 154 - Rajarajeshwarinagar | 22872.0 | 2.40 sq.km | Valid (`is_valid=True`) |
| `29` | Chowdeshwari Nagar | ಚೌಡೇಶ್ವರಿ ನಗರ | Zone1 (Rajarajeshwarinagar) | 154 - Rajarajeshwarinagar | 24455.0 | 1.17 sq.km | Valid (`is_valid=True`) |
| `30` | Kempegowda Layout | ಕೆಂಪೇಗೌಡ ಬಡಾವಣೆ | Zone1 (Rajarajeshwarinagar) | 154 - Rajarajeshwarinagar | 20026.0 | 0.63 sq.km | Valid (`is_valid=True`) |
| `31` | Freedom Fighter Ward | ಫ್ರೀಡಂ ಫೈಟರ್ ವಾರ್ಡ್ | Zone1 (Rajarajeshwarinagar) | 154 - Rajarajeshwarinagar | 18985.0 | 0.50 sq.km | Valid (`is_valid=True`) |
| `32` | Laggere | ಲಗ್ಗೆರೆ | Zone1 (Rajarajeshwarinagar) | 154 - Rajarajeshwarinagar | 20508.0 | 0.51 sq.km | Valid (`is_valid=True`) |
| `33` | Lakshmi Devi Nagar | ಲಕ್ಷ್ಮಿ ದೇವಿ ನಗರ | Zone1 (Rajarajeshwarinagar) | 154 - Rajarajeshwarinagar | 24599.0 | 0.52 sq.km | Valid (`is_valid=True`) |
| `34` | Peenya | ಪೀಣ್ಯ | Zone1 (Rajarajeshwarinagar) | 154 - Rajarajeshwarinagar | 26003.0 | 4.00 sq.km | Valid (`is_valid=True`) |
| `35` | Goraguntepalya | ಗೋರಗುಂಟೆಪಾಳ್ಯ | Zone1 (Rajarajeshwarinagar) | 154 - Rajarajeshwarinagar | 21462.0 | 2.11 sq.km | `make_valid` (Self-intersection[77.540749 13.032503]) |
| `36` | Nalwadi Krishnaraja Wadiyar Ward | ನಾಲ್ವಡಿ ಕೃಷ್ಣರಾಜ ಒಡೆಯರ್ ವಾರ್ಡ್ | Zone1 (Rajarajeshwarinagar) | 156 - Mahalakshmi Layout | 28281.0 | 1.79 sq.km | Valid (`is_valid=True`) |
| `37` | Dr. Puneeth Rajkumar Ward | ಡಾ. ಪುನೀತ್ ರಾಜ್‌ಕುಮಾರ್ ವಾರ್ಡ್ | Zone1 (Rajarajeshwarinagar) | 156 - Mahalakshmi Layout | 25126.0 | 0.56 sq.km | `make_valid` (Ring Self-intersection[77.535683 13.021355]) |
| `38` | Nandini Layout | ನಂದಿನಿ ಲೇಔಟ್ | Zone1 (Rajarajeshwarinagar) | 156 - Mahalakshmi Layout | 19639.0 | 0.37 sq.km | Valid (`is_valid=True`) |
| `39` | Jai Maruthi Nagar | ಜೈ ಮಾರುತಿ ನಗರ | Zone1 (Rajarajeshwarinagar) | 156 - Mahalakshmi Layout | 27166.0 | 0.91 sq.km | Valid (`is_valid=True`) |
| `40` | Mahalakshmipuram | ಮಹಾಲಕ್ಷ್ಮಿಪುರಂ | Zone1 (Rajarajeshwarinagar) | 156 - Mahalakshmi Layout | 28125.0 | 0.52 sq.km | Valid (`is_valid=True`) |
| `41` | Nagapura | ನಾಗಪುರ | Zone1 (Rajarajeshwarinagar) | 156 - Mahalakshmi Layout | 26591.0 | 0.97 sq.km | Valid (`is_valid=True`) |
| `42` | Raja Mayura Varma Ward | ರಾಜ ಮಯೂರ ವರ್ಮಾ ವಾರ್ಡ್ | Zone1 (Rajarajeshwarinagar) | 156 - Mahalakshmi Layout | 27523.0 | 0.48 sq.km | `make_valid` (Ring Self-intersection[77.528148 12.999149]) |
| `43` | Kethamaranahalli | ಕೇತಮಾರನಹಳ್ಳಿ | Zone1 (Rajarajeshwarinagar) | 156 - Mahalakshmi Layout | 28154.0 | 1.44 sq.km | Valid (`is_valid=True`) |
| `44` | Shankar Mutt | ಶಂಕರ ಮಠ | Zone1 (Rajarajeshwarinagar) | 156 - Mahalakshmi Layout | 28358.0 | 0.50 sq.km | Valid (`is_valid=True`) |
| `45` | Shakthi Ganapathi Nagara | ಶಕ್ತಿ ಗಣಪತಿ ನಗರ | Zone1 (Rajarajeshwarinagar) | 156 - Mahalakshmi Layout | 20838.0 | 0.39 sq.km | Valid (`is_valid=True`) |
| `46` | Kamalanagara | ಕಮಲಾನಗರ | Zone1 (Rajarajeshwarinagar) | 156 - Mahalakshmi Layout | 28196.0 | 0.46 sq.km | Valid (`is_valid=True`) |
| `47` | Vrishabhavathi Nagar | ವೃಷಭಾವತಿ ನಗರ | Zone1 (Rajarajeshwarinagar) | 156 - Mahalakshmi Layout | 28346.0 | 0.59 sq.km | Valid (`is_valid=True`) |
| `48` | Mathikere | ಮತ್ತಿಕೆರೆ | Zone2 (Malleshwaram) | 157 - Malleshwaram | 26058.0 | 0.67 sq.km | Valid (`is_valid=True`) |
| `49` | Aramane Nagara | ಅರಮನೆ ನಗರ | Zone2 (Malleshwaram) | 157 - Malleshwaram | 26145.0 | 0.88 sq.km | Valid (`is_valid=True`) |
| `50` | Sadashiva Nagara | ಸದಾಶಿವ ನಗರ | Zone2 (Malleshwaram) | 157 - Malleshwaram | 19596.0 | 4.97 sq.km | Valid (`is_valid=True`) |
| `51` | Rajamahal | ರಾಜಮಹಲ್ | Zone2 (Malleshwaram) | 157 - Malleshwaram | 24705.0 | 2.44 sq.km | Valid (`is_valid=True`) |
| `52` | Kodandarampura | ಕೋದಂಡರಾಮಪುರ | Zone2 (Malleshwaram) | 157 - Malleshwaram | 18962.0 | 0.50 sq.km | Valid (`is_valid=True`) |
| `53` | Malleshwaram | ಮಲ್ಲೇಶ್ವರಂ | Zone2 (Malleshwaram) | 157 - Malleshwaram | 21827.0 | 2.14 sq.km | Valid (`is_valid=True`) |
| `54` | Subedarpalya | ಸುಬೇದಾರಪಾಳ್ಯ | Zone2 (Malleshwaram) | 157 - Malleshwaram | 24829.0 | 0.53 sq.km | `make_valid` (Ring Self-intersection[77.55586 13.015809]) |
| `55` | Subramanyanagara | ಸುಬ್ರಹ್ಮಣ್ಯನಗರ | Zone2 (Malleshwaram) | 157 - Malleshwaram | 27312.0 | 0.83 sq.km | Valid (`is_valid=True`) |
| `56` | Gayathri Nagara | ಗಾಯತ್ರಿ ನಗರ | Zone2 (Malleshwaram) | 157 - Malleshwaram | 26978.0 | 0.44 sq.km | `make_valid` (Self-intersection[77.560572 12.997178]) |
| `57` | Kuvempu Ward | ಕುವೆಂಪು ವಾರ್ಡ್ | Zone2 (Malleshwaram) | 157 - Malleshwaram | 24283.0 | 0.47 sq.km | Valid (`is_valid=True`) |
| `58` | Dayanand Nagara | ದಯಾನಂದ ನಗರ | Zone2 (Malleshwaram) | 165 - Rajajinagar | 21165.0 | 0.27 sq.km | Valid (`is_valid=True`) |
| `59` | Bandi Reddy Circle Ward | ಬಂಡಿ ರೆಡ್ಡಿ ವೃತ್ತ ವಾರ್ಡ್ | Zone2 (Malleshwaram) | 165 - Rajajinagar | 21286.0 | 0.26 sq.km | Valid (`is_valid=True`) |
| `60` | Prakash Nagara | ಪ್ರಕಾಶ ನಗರ | Zone2 (Malleshwaram) | 165 - Rajajinagar | 19859.0 | 0.40 sq.km | Valid (`is_valid=True`) |
| `61` | Da.Ra. Bendre Ward | ದ.ರಾ.ಬೇಂದ್ರೆ ವಾರ್ಡ್ | Zone2 (Malleshwaram) | 165 - Rajajinagar | 20756.0 | 0.53 sq.km | Valid (`is_valid=True`) |
| `62` | Rama Mandira | ರಾಮ ಮಂದಿರ | Zone2 (Malleshwaram) | 165 - Rajajinagar | 22322.0 | 0.66 sq.km | Valid (`is_valid=True`) |
| `63` | Rajajinagara | ರಾಜಾಜಿನಗರ | Zone2 (Malleshwaram) | 165 - Rajajinagar | 19632.0 | 0.88 sq.km | Valid (`is_valid=True`) |
| `64` | Shivanagara | ಶಿವನಗರ | Zone2 (Malleshwaram) | 165 - Rajajinagar | 20472.0 | 0.29 sq.km | Valid (`is_valid=True`) |
| `65` | Manjunath Nagara | ಮಂಜುನಾಥ್  ನಗರ | Zone2 (Malleshwaram) | 165 - Rajajinagar | 20584.0 | 0.28 sq.km | Valid (`is_valid=True`) |
| `66` | Sane Guruvana Halli | ಸಾಣೆ ಗುರುವನ ಹಳ್ಳಿ | Zone2 (Malleshwaram) | 165 - Rajajinagar | 20561.0 | 0.35 sq.km | Valid (`is_valid=True`) |
| `67` | Basaveshwara Nagara | ಬಸವೇಶ್ವರ ನಗರ | Zone2 (Malleshwaram) | 165 - Rajajinagar | 20769.0 | 0.87 sq.km | Valid (`is_valid=True`) |
| `68` | Kamakshipalya | ಕಾಮಾಕ್ಷಿಪಾಳ್ಯ | Zone2 (Malleshwaram) | 165 - Rajajinagar | 25024.0 | 0.67 sq.km | Valid (`is_valid=True`) |
| `69` | Agrahara Dasarahalli | ಅಗ್ರಹಾರ ದಾಸರಹಳ್ಳಿ | Zone2 (Malleshwaram) | 166 - Govindraj Nagar | 24742.0 | 0.52 sq.km | Valid (`is_valid=True`) |
| `70` | Dr Rajkumar Ward | ಡಾ. ರಾಜ್‌ಕುಮಾರ್ ವಾರ್ಡ್ | Zone2 (Malleshwaram) | 166 - Govindraj Nagar | 24106.0 | 0.98 sq.km | Valid (`is_valid=True`) |
| `71` | Thimmenahalli | ತಿಮ್ಮೇನಹಳ್ಳಿ | Zone2 (Malleshwaram) | 166 - Govindraj Nagar | 23837.0 | 0.69 sq.km | Valid (`is_valid=True`) |
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
- No additional overlay layers configured.
