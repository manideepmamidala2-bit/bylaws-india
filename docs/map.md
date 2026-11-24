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
