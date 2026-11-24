# Intake: PR 06 — Real Map Foundation and Official Boundaries

**Change**: 261124-62ci-pr-06-real-map-foundation
**Created**: 2026-11-24

## Origin

> Implement PR 06 (Real Map Foundation and Official Boundaries) per `docs/plans/pr-series/00-overview.md` and `docs/plans/pr-series/06-real-map-foundation.md`: replace Leaflet and remove the SVG schematic view in favor of MapLibre GL JS + PMTiles (Protomaps extract for Bengaluru South + 2km margin in dg2n monochrome palette, testing HTTP Range support); acquire official GBA corporations, GBA zones, and 369 wards KMLs + notification PDF via `bylaws acquire` (R15); select Bengaluru South via config selector (R1) and validate geometry; publish `corporation`, `gba_zones`, and `wards` layers with interactive ward inspection and `docs/map.md`.

Initiated after PR 05 (`261124-fgv0-pr-05-structure-anchor-documents`, PR #10) was reviewed and merged on GitHub (Owner Checkpoint 2 passed).

## Why

1. **Problem**: The web application currently uses `react-leaflet` / `leaflet` with an SVG schematic fallback toggle in `components/ZoneMap.tsx`, and `in-ka-bengaluru-south` in Release `2.0.0` has empty `boundary.geojson`, no `gba-zones.geojson`, and no `wards.geojson` layers.
2. **Consequence of not doing this**: Without a real vector street basemap (`MapLibre GL JS` + `PMTiles` in the dg2n monochrome palette) and the official Greater Bengaluru Authority (GBA) corporation, GBA zones, and wards boundaries acquired with R15 provenance, users cannot locate plots, streets, or wards in Bengaluru South, and PR 07 (georeferencing the Jayanagar land-use sheet against the street network and planning district boundary) has no real spatial foundation.
3. **Why this approach**: Following `06-real-map-foundation.md`, we:
   - Replace `leaflet` / `react-leaflet` and remove the SVG schematic view in `components/ZoneMap.tsx` in favor of **`maplibre-gl`** + **`pmtiles`** (both BSD-3-Clause, passing Rule R4), styled in the monochrome **dg2n palette** (`--paper: #f5f3ed`, `--panel: #efeee8`, `--hairline: #c8ccc0`, `--muted: #5b5e56`, `--ink: #080909`) with visible `"© OpenStreetMap contributors · Protomaps"` attribution, mobile touch zoom/pan, and keyboard-focusable controls.
   - Extract a Protomaps `.pmtiles` basemap covering the Bengaluru South bounding box padded by ~2 km, test HTTP `Range` request support, and record the build date, bounding box, SHA-256 checksum, and hosting/range-request verification in `docs/map.md`.
   - Acquire the official GBA corporations boundary KML/GeoJSON, GBA zones KML/GeoJSON, 369 wards delimitation KML/GeoJSON (and final notification PDF) from official GBA (`gba.karnataka.gov.in`) / OpenCity / Wayback sources via `bylaws acquire` with complete R15 `retrieval` records.
   - Select Bengaluru South's corporation polygon, its two GBA zones, and its wards deterministically via config selectors (`jurisdictions/in-ka-bengaluru-south.yaml`, Rule R1) or spatial containment within the corporation boundary, validate geometries (`shapely.is_valid` / `make_valid`), cross-check the ward count and names against the notification in `data/reports/in-ka-bengaluru-south/map-verification.md`, and publish the `corporation` (`boundary.geojson`), `gba_zones` (`gba-zones.geojson`), and `wards` (`wards.geojson`) layers in `geo-layers.json` with interactive ward click inspection on `/j/in-ka-bengaluru-south`.

## What Changes

### 1. MapLibre GL JS + PMTiles Basemap & Removal of SVG Schematic View (`package.json`, `components/ZoneMap.tsx`, `lib/map-style.ts`, `docs/map.md`, `public/data/in-ka-bengaluru-south/basemap.pmtiles`)
- Add `maplibre-gl` (BSD-3-Clause) and `pmtiles` (BSD-3-Clause) to `package.json` (and remove `leaflet`, `react-leaflet`, `@types/leaflet`), verifying `test_r4_licences.py` passes Rule R4.
- Extract a Protomaps vector basemap (`basemap.pmtiles`) for the Bengaluru South corporation bounding box padded by ~2 km (`[77.46, 12.81, 77.70, 12.99]`), verify HTTP `Range` (`bytes=0-511` returning `206 Partial Content` or static serving), and document the Protomaps build date, bounding box, byte size, SHA-256 digest, and HTTP `Range` verification in `docs/map.md`.
- Build a custom MapLibre style (`lib/map-style.ts`) in the dg2n monochrome palette:
  - Background / land: `--paper` (`#f5f3ed`)
  - Water & parks: subtle monochrome tones (`#e5e6de` / `#efeee8`)
  - Minor roads & buildings: `--hairline` (`#c8ccc0`)
  - Major roads & boundaries: `--ink` (`#080909`)
  - English labels (`name:en` / `name`): `--muted` (`#5b5e56`)
- Completely remove the SVG schematic view and its toggle from `components/ZoneMap.tsx`.
- Display visible attribution `"© OpenStreetMap contributors · Protomaps"` on the map, support mobile touch zoom/pan, and expose keyboard-focusable zoom/layer/feature controls that pass `axe-core` WCAG AA checks.

### 2. Official GBA Corporation, GBA Zones, and Wards Acquisition & Processing (`jurisdictions/in-ka-bengaluru-south.yaml`, `pipeline/bylaws/acquire.py`, `pipeline/bylaws/geo/boundaries.py`, `pipeline/bylaws/geo/__init__.py`)
- Discover and acquire with R15 `retrieval` records (and Wayback `archive_url` snapshots) from `gba.karnataka.gov.in` (`/gba-corporations-delimitation-2025/index.html`, `/KnowYourNewCorporation/index.html`, `/gisviewer/index.html`), `data.opencity.in`, and Wayback Machine:
  1. **GBA Five Corporations Final Delimitation Map** (September 2025 KML/GeoJSON) and final notification PDF.
  2. **GBA Zones Map** (KML/GeoJSON) for the two GBA zones inside Bengaluru South City Corporation.
  3. **GBA Wards Final Delimitation Map** (369 wards, notified 19 November 2025 / December 2025 KML/GeoJSON).
- Enhance `pipeline/bylaws/acquire.py` and `pipeline/bylaws/geo/boundaries.py` to:
  - Record full R15 `retrieval` metadata on every boundary source in `maps.boundaries[]` (in `jurisdictions/in-ka-bengaluru-south.yaml` and `data/raw/in-ka-bengaluru-south/<boundary_id>.meta.json`), and verify `bylaws check-provenance` checks boundary `retrieval` records.
  - Convert KML (`application/vnd.google-earth.kml+xml`) or GeoJSON to WGS 84 (`EPSG:4326`) GeoJSON while preserving all source attributes (`Name`, `Description`, extended data fields, ward numbers, ward names, corporation/zone names).
  - Select Bengaluru South's corporation boundary (`output_file: "boundary.geojson"`), its two GBA zones (`output_file: "gba-zones.geojson"`), and its wards (`output_file: "wards.geojson"`) via declarative selectors in `jurisdictions/in-ka-bengaluru-south.yaml` (`select.property` + `select.equals` / `select.in_values` or `select.within_boundary: true`), with zero hard-coded city/corporation names in Python code (Rule R1).
  - Validate every polygon geometry with `shapely.is_valid` (applying `shapely.make_valid` only if needed and recording any geometry repair in `data/reports/in-ka-bengaluru-south/map-verification.md`).
  - Cross-check the extracted ward count, ward numbers, and ward names against the delimitation notification and record the complete ward table and any discrepancy in `data/reports/in-ka-bengaluru-south/map-verification.md`.

### 3. Published Layers & Interactive Map Page (`pipeline/bylaws/geo/__init__.py`, `app/j/[id]/page.tsx`, `components/AreaExplorerClient.tsx`, `components/ZoneMap.tsx`)
- Publish three `official_boundary` layers in `geo-layers.json` (`corporation` -> `boundary.geojson`, `gba_zones` -> `gba-zones.geojson`, `wards` -> `wards.geojson`), each with its official `source`, retrieval date, `method`, `derived: false`, and `kind: "official_boundary"`.
- Update the Map page (`/j/in-ka-bengaluru-south`, `components/ZoneMap.tsx`, and `components/AreaExplorerClient.tsx`):
  - Layer controls for **Corporation** (`corporation`, on by default), **GBA Zones** (`gba_zones`, off or toggleable), and **Wards** (`wards`, on by default).
  - Clicking or selecting a ward displays the ward's **ward number**, **ward name** (as in the source), its **GBA zone / corporation**, area, and a direct **source link** to the official delimitation dataset/notification.
  - Generate the accuracy/source banner from `geo-layers.json` metadata in plain words (e.g. *"Boundaries from the Greater Bengaluru Authority delimitation maps, November 2025"*).
  - When no land-use zones are published yet (`zones.features.length === 0`), display a plain line stating: *"No master plan land-use zones are published yet; showing official corporation, GBA zone, and ward boundaries."*

## Affected Memory

- `architecture/overview`: (modify) Document the migration from Leaflet + SVG schematic view to MapLibre GL JS + PMTiles (`basemap.pmtiles`), HTTP Range verification in `docs/map.md`, and official GBA corporation, GBA zones, and wards boundaries in Release `2.1.0`.
- `schemas/data-contracts`: (modify) Document boundary `retrieval` provenance records and declarative multi-value / spatial-containment boundary selectors in `schemas/jurisdiction.schema.json`.

## Impact

- **Dependencies (`package.json`, `docs/dependencies.md`)**:
  - Add `maplibre-gl` and `pmtiles`; remove `leaflet`, `react-leaflet`, `@types/leaflet`.
- **Schemas & Config (`schemas/jurisdiction.schema.json`, `jurisdictions/in-ka-bengaluru-south.yaml`)**:
  - Extend `boundarySelectRule` and `boundaryMapConfig` in `schemas/jurisdiction.schema.json` to support `retrieval`, `in_values` (for selecting multiple GBA zones/wards by property list), and `within_boundary` (for spatial containment within `boundary.geojson`).
- **Python Pipeline (`pipeline/bylaws/acquire.py`, `pipeline/bylaws/provenance.py`, `pipeline/bylaws/geo/boundaries.py`, `pipeline/bylaws/geo/__init__.py`)**:
  - Remote HTTP acquisition with R15 `retrieval` records for `maps.boundaries[]`, KML ExtendedData / HTML description table attribute extraction, geometry validation, and `geo-layers.json` generation.
- **Web UI (`components/ZoneMap.tsx`, `components/AreaExplorerClient.tsx`, `lib/map-style.ts`, `app/j/[id]/page.tsx`, `app/globals.css`)**:
  - MapLibre GL JS + PMTiles map component in dg2n monochrome style, removal of SVG schematic view, layer toggles (`corporation` and `wards` on by default, `gba_zones` toggleable), interactive ward inspector with source link, and plain-language accuracy & no-land-use-zones notices.
- **Documentation & Tests (`docs/map.md`, `data/reports/in-ka-bengaluru-south/map-verification.md`, `pipeline/tests/test_real_map_foundation_pr06.py`, `__tests__/routes-and-axe.test.tsx`)**.

## Open Questions

None — all requirements and acceptance criteria are explicitly specified in `docs/plans/pr-series/06-real-map-foundation.md`.

## Assumptions

| # | Grade | Decision | Rationale | Scores |
|---|-------|----------|-----------|--------|
| 1 | Certain | Replace `leaflet` and `react-leaflet` with `maplibre-gl` and `pmtiles` (both BSD-3-Clause) and completely remove the SVG schematic view and its toggle | Explicitly mandated by `06-real-map-foundation.md` §1 ("Switch the map component from Leaflet to MapLibre GL JS with the PMTiles protocol... Remove the SVG schematic view entirely, including its toggle and code.") | S:100 R:90 A:95 D:100 |
| 2 | Certain | Acquire official GBA corporations, GBA zones, and wards boundaries via `bylaws acquire` with full R15 `retrieval` records and select Bengaluru South features via declarative selectors in `jurisdictions/in-ka-bengaluru-south.yaml` (Rule R1) | Explicitly required by `06-real-map-foundation.md` §2 | S:98 R:90 A:95 D:95 |
| 3 | Certain | Enable `corporation` and `wards` layers by default on `/j/in-ka-bengaluru-south`, display ward number, ward name, GBA zone, and source link on ward selection, and show a plain line stating that land-use zones are not published yet | Explicitly required by `06-real-map-foundation.md` §3 | S:98 R:95 A:95 D:98 |

3 assumptions (3 certain, 0 confident, 0 tentative, 0 unresolved).
