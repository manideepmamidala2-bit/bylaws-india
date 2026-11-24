# Map Architecture, PMTiles Basemap & Official GBA Boundaries

## 1. Overview

In **PR 06 (`261124-62ci-pr-06-real-map-foundation`)**, the web map component (`components/ZoneMap.tsx`) was migrated from Leaflet (and the legacy SVG schematic view, which has been completely removed) to **MapLibre GL JS** (`maplibre-gl`, BSD-3-Clause) with the **PMTiles** protocol (`pmtiles`, BSD-3-Clause), styled in the monochrome **dg2n** editorial palette.

---

## 2. Protomaps Basemap Extract (`public/data/in-ka-bengaluru-south/basemap.pmtiles`)

The vector street basemap for Bengaluru South City Corporation (`in-ka-bengaluru-south`) was extracted from the Protomaps daily planet build using `go-pmtiles` (`v1.31.2`):

```bash
pmtiles extract \
  https://build.protomaps.com/20261124.pmtiles \
  public/data/in-ka-bengaluru-south/basemap.pmtiles \
  --bbox=77.469,12.813,77.723,12.972 \
  --maxzoom=15
```

### 2.1 Basemap Provenance & Checksum

| Property | Value |
|---|---|
| **Source Build** | `https://build.protomaps.com/20261124.pmtiles` |
| **Protomaps Basemap Version** | `4.15.2` (`planetiler:version = 0.10.2`) |
| **OSM Replication Timestamp** | `2026-11-24T04:00:00Z` (`seq = 124461`) |
| **Official Corporation Bounds (`EPSG:4326`)** | `[77.489302, 12.833491, 77.702887, 12.951664]` |
| **Extracted Bounding Box (~2 km margin)** | `[77.469000, 12.813000, 77.723000, 12.972000]` |
| **Zoom Range** | `0` – `15` (`520` addressed MVT tiles, `clustered: true`, `gzip`) |
| **Vector Layers Included** | `earth`, `water`, `landcover`, `landuse`, `buildings`, `roads`, `boundaries`, `places`, `pois` |
| **File Path** | `public/data/in-ka-bengaluru-south/basemap.pmtiles` (web path: `/data/in-ka-bengaluru-south/basemap.pmtiles`) |
| **File Size** | `15,830,444` bytes (`15.1 MiB`) |
| **SHA-256 Checksum** | `cd8084fcec28305374a49b8ab2266ce8f9cfbd54f6413e0e5d0e8b6393052448` |
| **Basemap Licence & Attribution** | OpenStreetMap data under ODbL; Protomaps basemap schema under BSD-3-Clause. Attribution displayed on map: **`© OpenStreetMap contributors · Protomaps`** |

### 2.2 Hosting & HTTP `Range` Request Verification

- **Hosting Decision**: Because `VERCEL_BLOB_READ_WRITE_TOKEN` is not configured in the repository environment and the extracted `basemap.pmtiles` archive is only **15.1 MiB** (`15,830,444` bytes), the file is committed directly under `public/data/in-ka-bengaluru-south/basemap.pmtiles` and served from the Next.js / Vercel CDN static asset root (`/data/in-ka-bengaluru-south/basemap.pmtiles`), with optional override via `NEXT_PUBLIC_PMTILES_URL` when a custom Vercel Blob or CDN URL is configured.
- **HTTP `Range` Verification**:
  - Verified with `pmtiles verify public/data/in-ka-bengaluru-south/basemap.pmtiles` (`Completed verify in 136.626µs`) and partial HTTP byte-range requests (`Range: bytes=0-511` and `Range: bytes=0-16383` for the PMTiles v3 header and root directory).
  - Byte-range requests for `bytes=0-511` return `HTTP 206 Partial Content` with `Accept-Ranges: bytes`, `Content-Range: bytes 0-511/15830444`, `Content-Length: 512`, and the 8-byte PMTiles v3 magic header `b"PMTiles\x03"` (`4d 50 54 69 6c 65 73 03`).

---

## 3. Monochrome `dg2n` MapLibre Style (`lib/map-style.ts`)

`lib/map-style.ts` builds a MapLibre GL Style Specification v8 document over the `pmtiles://` source using the project's strict monochrome `dg2n` palette:

- **Background / Earth (`earth`)**: `--paper` (`#f5f3ed`)
- **Parks & Landuse (`landuse`, `landcover`)**: subtle warm panel tone (`#efeee8`)
- **Water (`water`)**: muted monochrome wash (`#e2e0d8`) with hairline shore outline (`#c8ccc0`)
- **Buildings (`buildings`)**: subtle fill (`#ebe9e1`) with hairline stroke (`#d5d7cd`) at zoom $\ge 13$
- **Minor Roads (`roads` — residential, service, street, path)**: `--hairline` (`#c8ccc0`)
- **Major Roads (`roads` — highway, major_road, medium_road)**: `--ink` (`#080909`) and muted (`#5b5e56`)
- **Zero External Glyph/Tile Requests**: `lib/map-style.ts` defines a self-contained glyph-free vector style (`background`, `fill`, and `line` layers over `pmtiles://`) so no external font/glyph server or third-party tile CDN is contacted at runtime; ward names, GBA zone names, and source citations are rendered directly in the DOM Ward Inspector and layer controls.

---

## 4. Official GBA Boundaries (`corporation`, `gba_zones`, `wards`)

All three official boundary layers are acquired via `bylaws acquire --jurisdiction in-ka-bengaluru-south` from the live Greater Bengaluru Authority GeoServer (`https://gisapps.bbmp.gov.in/geoserver/wfs`, the authoritative WFS backend of `https://gba.karnataka.gov.in/gisviewer/index.html`) with full Rule R15 `retrieval` records:

1. **`corporation` (`boundary.geojson`)**:
   - WFS layer: `gba_boundary:gba_corporation_boundary` (5 GBA City Corporations, September 2025 final notification).
   - Declarative selector (`jurisdictions/in-ka-bengaluru-south.yaml`): `property: Corporation`, `equals: South`.
   - Extracted features: **1 MultiPolygon** (`152.28 sq.km`, bounds `[77.489302, 12.833491, 77.702887, 12.951664]`).
2. **`gba_zones` (`gba-zones.geojson`)**:
   - WFS layer: `gba_boundary:gba_zone_boundary` (10 GBA Zones across the 5 corporations).
   - Declarative selector: `property: Corporation`, `equals: South`.
   - Extracted features: **2 MultiPolygons**:
     - `Zone1` — **Jayanagar** (`93.85 sq.km`)
     - `Zone2` — **Bommanahalli** (`58.43 sq.km`)
3. **`wards` (`wards.geojson`)**:
   - WFS layer: `gba_boundary:ward_369_final` (369 final delimitation wards, November 2025).
   - Declarative selector: `property: Corporation`, `equals: South`.
   - Extracted features: **72 Wards** (`ward_id` `1` through `72`), cross-checked against the 8 official Assembly-wise GBA Ward Delimitation & Population Notification PDFs on `gba.karnataka.gov.in/gba-corporations-delimitation-2025/` in [`data/reports/in-ka-bengaluru-south/map-verification.md`](../data/reports/in-ka-bengaluru-south/map-verification.md).

---

## 5. RMP 2015 Index Map & Planning Districts Intersecting Bengaluru South (PR 07)

### 5.1 Index Map Provenance & PD 204 Mislabelling Note

The BDA **Revised Master Plan 2015 (RMP 2015)** divides the Bangalore Metropolitan Area (`1,214.8 sq.km`) into **47 Planning Districts** across three concentric rings (`101`–`107`, `201`–`218`, and `301`–`322`):

- **Official BBMP Listing Page**: `https://site.bbmp.gov.in/revised%20masterplan%20(1).html` (archived at `https://web.archive.org/web/20250224114910id_/https://site.bbmp.gov.in/revised%20masterplan%20(1).html`)
- **RMP 2015 Planning Districts Index Map (`rmp2015-pd-index`)**: `https://data-opencity.sgp1.cdn.digitaloceanspaces.com/Documents/Recent/Bengaluru-BDA-RMP-2015-PD-IndexMap.pdf` (`1,994,640` bytes, SHA-256 `a545231e0a3a6298f070951eb0ee556369fdf680d638dc5c37825ed42391d91b`, Wayback `http://web.archive.org/web/20221222112943/https://data-opencity.sgp1.cdn.digitaloceanspaces.com/Documents/Recent/Bengaluru-BDA-RMP-2015-PD-IndexMap.pdf`)
- **Mislabelling Note on Planning District `204` ("Benson Town", not "Jayanagar")**:
  - Both the printed table on `Bengaluru-BDA-RMP-2015-PD-IndexMap.pdf` and OpenCity's index listing erroneously label Planning District `204` (`2.04`) as `"Jayanagar"`.
  - Inspecting the actual BBMP/BDA Proposed Land Use map sheet (`documents/2.04-Benson Town.pdf` / `Bengaluru-BDA-RMP-2015-PLU_PD_204-Benson_Town.pdf`) and the geographic polygon on the Index Map confirms that **Planning District `204` (`2.04`) is Benson Town** (located in north-central Bengaluru between `203 Malleshwaram`, `104 Vasant Nagar`, `105 Shivaji Nagar`, and `216 Kaval Byrasandra`, completely outside Bengaluru South), whereas **Planning District `210` (`2.10`) is Jayanagar** (`documents/2.10 map(a)-Jayanagar.pdf` and `documents/2.10 map(b)-Jayanagar.pdf`).

### 5.2 Complete List of RMP 2015 Planning Districts Intersecting Bengaluru South

Intersecting the 47 vector planning district polygons from `rmp2015-pd-index` (calibrated to `EPSG:32643` UTM Zone 43N at `113.0006 m/pt`) with the official Bengaluru South City Corporation boundary (`boundary.geojson`, `152.28 sq.km`) identifies **10 intersecting Planning Districts** (comprising **21 individual map sheets** on `site.bbmp.gov.in` / **10 combined PDF files** on OpenCity):

| PD Code | District Name (Verified from Map Sheet) | Official BBMP Sheet Path(s) (`site.bbmp.gov.in/documents/`) | OpenCity Mirror PDF (`data-opencity.sgp1.cdn.digitaloceanspaces.com/Documents/Recent/`) | Total PD Area (`sq.km`) | Area Inside Bengaluru South (`sq.km`) | Share of PD Inside South | Extraction Status |
|---|---|---|---|---:|---:|---:|---|
| **`2.08`** (`208`) | **Koramangala** *(combined sheet with `2.07 Unclassified`)* | `2.07 Unclassified & 2.08 Koramangala-map (a).pdf`, `map (b).pdf` | `Bengaluru-BDA-RMP-2015-PLU_PD_207-208-Unclassified-Koramangala.pdf` | 7.65 | 4.32 | 56.4% | Pending (**PR 11**) |
| **`2.09`** (`209`) | **Shanti Nagar** | `2.09 map (a)-Shanti Nagar.pdf`, `2.09 map (b)-Shanti Nagar.pdf` | `Bengaluru-BDA-RMP-2015-PLU_PD_209-Shanti_Nagar.pdf` | 14.00 | 5.39 | 38.5% | Pending (**PR 11**) |
| **`2.10`** (`210`) | **Jayanagar** | `2.10 map(a)-Jayanagar.pdf`, `2.10 map(b)-Jayanagar.pdf` | `Bengaluru-BDA-RMP-2015-PLU_PD_210-Jayanagar.pdf` | 13.48 | 8.74 | 64.8% | **Extracted in PR 07** (`2.10 map (b)`); `2.10 map (a)` in **PR 11** |
| **`2.11`** (`211`) | **Banashankari** | `2.11 map(a)-Banashankari.pdf`, `2.11 map(b)-Banashankari.pdf` | `Bengaluru-BDA-RMP-2015-PLU_PD_211-Banashankari.pdf` | 18.51 | 2.66 | 14.4% | Pending (**PR 11**) |
| **`3.01`** (`301`) | **Kengeri** | `3.01 map(a)`–`map(d)-Kengeri.pdf` (4 sheets) | `Bengaluru-BDA-RMP-2015-PLU_PD_301-Kengeri.pdf` | 126.16 | 4.15 | 3.3% | Pending (**PR 11**) |
| **`3.16`** (`316`) | **Varthur** | `3.16 map(a)-Varthur.pdf`, `3.16 map(b)-Varthur.pdf` | `Bengaluru-BDA-RMP-2015-PLU_PD_316-Varthur.pdf` | 52.00 | 0.28 | 0.5% | Pending (**PR 11**) |
| **`3.18`** (`318`) | **Begur** | `3.18 map(a)- Begur.pdf`, `3.18 map(b)- Begur.pdf` | `Bengaluru-BDA-RMP-2015-PLU_PD_318-Begur.pdf` | 73.30 | 50.44 | 68.8% | Pending (**PR 11**) |
| **`3.19`** (`319`) | **Electronic City** | `3.19 -Electronic City.pdf` (1 sheet) | `Bengaluru-BDA-RMP-2015-PLU_PD_319-Electronic_City.pdf` | 36.61 | 1.89 | 5.2% | Pending (**PR 11**) |
| **`3.20`** (`320`) | **Bannerghatta** | `3.20 map(a)`–`map(d)-Bannerghatta.pdf` (4 sheets) | `Bengaluru-BDA-RMP-2015-PLU_PD_320-Bannerghatta.pdf` | 117.38 | 6.65 | 5.7% | Pending (**PR 11**) |
| **`3.21`** (`321`) | **Anjanapura** | `3.21 map(a)-Anjanapura.pdf`, `3.21 map(b)-Anjanapura.pdf` | `Bengaluru-BDA-RMP-2015-PLU_PD_321-Anjanapura.pdf` | 71.08 | 67.76 | 95.3% | Pending (**PR 11**) |
| **Total** | **10 Intersecting Planning Districts** | **21 sheets** | **10 PDFs** | **530.17** | **152.28** | **100.0% of Corp** | **1 sheet in PR 07 · 20 sheets in PR 11** |

---

## 6. Candidate Sheet Inspection & Selection of `2.10 Jayanagar map (b)` (PR 07)

### 6.1 Candidate Inspection Summary

Five candidate Proposed Land Use PDFs inside Bengaluru South were inspected across vector/raster structure, printed coordinate grid readability, legend readability, and corporation overlap:

| Candidate Sheet | Scale & Printed CRS | Vector vs. Raster Structure | Printed Grid Crosshairs (`+`) | Legend Readability | Map Frame Overlap with Bengaluru South |
|---|---|---|---|---|---|
| **`2.10 Jayanagar map (a)`** (`rmp2015-plu-pd-210` p. 1) | `1 : 5,000` · `UTM zone 43N, WGS 1984` | Hybrid: `3,719` vector curves + `844` vector lines (roads, boundaries, grid crosshairs) over `25` lossless 8-bit `Indexed` palette raster strips (`4276 x 123` px) | **20 exact vector `+` crosshairs** (`E 779000–783000`, `N 1431000–1434000`) | Readable (`ZONING CLASSIFICATION` + area table) | `24.9%` (northern half lies in Bengaluru Central) |
| **`2.10 Jayanagar map (b)`** (`rmp2015-plu-pd-210` p. 2) — **CHOSEN** | `1 : 5,000` · `UTM zone 43N, WGS 1984` | Hybrid: `3,390` vector curves + `1,648` vector lines (roads, boundaries, grid crosshairs) over `26` lossless 8-bit/4-bit `Indexed` palette raster strips (`4276 x 123` px) | **20 exact vector `+` crosshairs** (`E 780000–784000`, `N 1428000–1431000`) | Readable (`ZONING CLASSIFICATION` + area table) | **`86.7%` of map frame (`~95%` of PD 2.10 south half)** |
| **`2.11 Banashankari map (a)/(b)`** (`PD 211`) | `1 : 5,000` · `UTM zone 43N, WGS 1984` | Hybrid: vector roads/grid over `25` `Indexed` palette raster strips | `20` vector `+` crosshairs per page | Readable | `14.4%` of PD lies inside Bengaluru South (most lies in West) |
| **`2.07 & 2.08 Koramangala map (a)/(b)`** (`PD 208`) | `1 : 5,000` · `UTM zone 43N, WGS 1984` | Hybrid: vector roads/grid over `28` `Indexed` palette raster strips | `20` vector `+` crosshairs per page | Readable | `56.4%` of PD 208 lies inside Bengaluru South |
| **`3.18 Begur` / `3.21 Anjanapura`** (`PD 318`, `PD 321`) | `1 : 10,000` · `UTM zone 43N, WGS 1984` | Hybrid: vector roads/grid over `25`–`29` `Indexed` palette raster strips | `80`–`88` vector `+` crosshairs per page | Readable | `68.8%` (`3.18`) / `95.3%` (`3.21`), but `1:10,000` scale has half the linear resolution of `2.10` |

### 6.2 Why `2.10 Jayanagar map (b)` (`rmp2015-plu-pd-210` Page 2) Was Selected

1. **Highest `1 : 5,000` Coverage Inside Bengaluru South**: `86.7%` of the map frame (`~95%` of the coloured PD 2.10 area on `map (b)`) lies inside the Bengaluru South City Corporation boundary, covering Jayanagar 4th Block, 4th T Block, 5th–9th Blocks, Tilak Nagar, BTM Layout I & II Stage, JP Nagar I–III Phase, and Sarakki.
2. **Vector-Exact Printed UTM 43N Grid (`RMSE = 0.0032 m`)**: All `20` printed `1,000 m` grid intersections (`5 Eastings: 780000..784000` $\times$ `4 Northings: 1428000..1431000`) are present as exact vector crosshair primitives in the PDF, yielding an affine fit with **`RMSE = 0.0032 m`** and **`Leave-One-Out (LOO) RMSE = 0.0038 m`** (well below the `≤ 10 m` target).
3. **Lossless 8-Bit/4-Bit `Indexed` Palette Strips Below Vector Text**: Because BDA exported the land-use colour fills as lossless `Indexed` palette raster strips underneath the vector road network and text labels, reading the raw palette streams directly from the PDF avoids text/hatching occlusion while mapping 1-to-1 to the sheet's `ZONING CLASSIFICATION` legend swatches (`R-MAIN`, `R-MIX`, `C-BIZ`, `C-AXES`, `I-GEN`, `I-HITECH`, `PSP`, `G-PARK`, `G-LAKE`, `T-TRANS`).
4. **Rich Independent Verification Features**: The sheet contains `654` vector road segments and `364` administrative boundary sample points for independent comparison against OpenStreetMap roads (`median offset = 8.02 m`, `90th-percentile offset = 21.11 m`) and official GBA ward boundaries (`median offset = 28.20 m`, `90th-percentile offset = 51.89 m`).
