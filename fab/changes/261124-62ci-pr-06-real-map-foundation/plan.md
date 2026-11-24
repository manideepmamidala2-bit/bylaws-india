# Plan: PR 06 — Real Map Foundation and Official Boundaries

**Change**: 261124-62ci-pr-06-real-map-foundation
**Intake**: `intake.md`

## Requirements

### Web Map Foundation: MapLibre GL JS + PMTiles Basemap and SVG Schematic Removal

#### R1: MapLibre GL JS + PMTiles Basemap in dg2n Monochrome Palette (`components/ZoneMap.tsx`, `lib/map-style.ts`, `docs/map.md`)
`package.json`, `components/ZoneMap.tsx`, `lib/map-style.ts`, `public/data/in-ka-bengaluru-south/basemap.pmtiles`, and `docs/map.md` MUST replace `leaflet` / `react-leaflet` with **`maplibre-gl`** and **`pmtiles`** (both BSD-3-Clause, passing Rule R4), remove the SVG schematic view and its toggle completely, and serve a Protomaps vector basemap extract for the Bengaluru South corporation bounding box padded by ~2 km:
- `docs/map.md` MUST record the Protomaps build date, bounding box (`[min_lon, min_lat, max_lon, max_lat]`), byte size, SHA-256 checksum, and HTTP `Range` request verification (`206 Partial Content`).
- `lib/map-style.ts` MUST define a custom MapLibre style in the monochrome dg2n palette (`--paper: #f5f3ed` land, `#e5e6de`/`#efeee8` water/parks, `--hairline: #c8ccc0` minor roads/buildings, `--ink: #080909` major roads/boundaries, `--muted: #5b5e56` English labels).
- `components/ZoneMap.tsx` MUST display visible attribution `"© OpenStreetMap contributors · Protomaps"`, support touch zoom/pan and keyboard-focusable controls, and contain zero SVG schematic view code.

- **GIVEN** `public/data/in-ka-bengaluru-south/basemap.pmtiles` and `lib/map-style.ts`
- **WHEN** `ZoneMap` renders and HTTP `Range` (`bytes=0-511`) is tested against the PMTiles file
- **THEN** `ZoneMap` initializes the PMTiles protocol with `maplibre-gl` in the dg2n monochrome palette, displays `"© OpenStreetMap contributors · Protomaps"`, has zero SVG schematic fallback, and passes `test_r4_licences.py` and `axe-core` WCAG AA audits

### Pipeline & Geospatial Boundaries: Official GBA Corporation, GBA Zones, and Wards

#### R2: Official GBA Corporation, GBA Zones, and Wards Acquisition & Processing (`jurisdictions/in-ka-bengaluru-south.yaml`, `pipeline/bylaws/acquire.py`, `pipeline/bylaws/geo/boundaries.py`, `pipeline/bylaws/geo/__init__.py`)
`pipeline/bylaws/acquire.py`, `pipeline/bylaws/provenance.py`, `pipeline/bylaws/geo/boundaries.py`, `pipeline/bylaws/geo/__init__.py`, and `jurisdictions/in-ka-bengaluru-south.yaml` MUST acquire and process the official Greater Bengaluru Authority (GBA) boundaries with full R15 `retrieval` records:
- Acquire the official GBA five-corporations boundary KML/GeoJSON (September 2025), GBA zones KML/GeoJSON, and GBA 369 wards delimitation KML/GeoJSON (November / December 2025) plus the delimitation notification PDF via `bylaws acquire` with R15 `retrieval` records and Wayback Machine snapshots.
- Select Bengaluru South's corporation boundary (`boundary.geojson`), its two GBA zones (`gba-zones.geojson`), and its wards (`wards.geojson`) via declarative selectors in `jurisdictions/in-ka-bengaluru-south.yaml` (`select.property`, `select.equals` / `select.in_values` / `select.within_boundary`), with zero hard-coded city/corporation names in Python code (Rule R1).
- Validate all polygon geometries with `shapely.is_valid` (applying `shapely.make_valid` if needed and recording any geometry fixes in `data/reports/in-ka-bengaluru-south/map-verification.md`), verify that output polygon coordinates match the source files exactly, and cross-check ward count, ward numbers, and ward names against the notification in `data/reports/in-ka-bengaluru-south/map-verification.md`.
- Publish `corporation`, `gba_zones`, and `wards` layers in `geo-layers.json` (`kind: "official_boundary"`, `derived: false`) with source and retrieval date.

- **GIVEN** `jurisdictions/in-ka-bengaluru-south.yaml` configured with remote HTTP `maps.boundaries[]` sources and selectors
- **WHEN** `bylaws acquire --jurisdiction in-ka-bengaluru-south`, `bylaws geo --jurisdiction in-ka-bengaluru-south`, and `bylaws publish --jurisdiction in-ka-bengaluru-south` run
- **THEN** `boundary.geojson`, `gba-zones.geojson`, `wards.geojson`, and `geo-layers.json` are published in `public/data/in-ka-bengaluru-south/2.1.0/` with valid WGS 84 geometries matching the source coordinates, complete R15 `retrieval` records, and a complete ward verification report in `data/reports/in-ka-bengaluru-south/map-verification.md`

### Interactive Map Page: Layer Controls, Ward Inspector, and Plain Accuracy Notice

#### R3: Interactive Map Page with Ward Inspector and Layer Controls (`app/j/[id]/page.tsx`, `components/AreaExplorerClient.tsx`, `components/ZoneMap.tsx`)
`app/j/[id]/page.tsx`, `components/AreaExplorerClient.tsx`, and `components/ZoneMap.tsx` MUST provide interactive inspection of the official boundaries on `/j/in-ka-bengaluru-south`:
- Layer controls for **Corporation** (`corporation`, on by default), **GBA Zones** (`gba_zones`, toggleable), and **Wards** (`wards`, on by default).
- Selecting or clicking a ward displays the ward's **ward number** and **ward name** from the source, its **GBA zone**, area, and a **source link**.
- The accuracy/source notice is generated in plain words from `geo-layers.json` metadata (e.g., `"Boundaries from the Greater Bengaluru Authority delimitation maps, November 2025"`), and when no land-use zones are published yet (`zones.features.length === 0`), a plain notice states that master plan land-use zones are not published yet.

- **GIVEN** Release `2.1.0` published with `boundary.geojson`, `gba-zones.geojson`, `wards.geojson`, and `geo-layers.json`
- **WHEN** `/j/in-ka-bengaluru-south` renders and a user selects a ward
- **THEN** `corporation` and `wards` layers are active by default, clicking/selecting a ward displays its source ward number, ward name, GBA zone, and source link, the plain accuracy and no-land-use-zones notices are shown, and `axe-core` WCAG AA checks pass

### Design Decisions

#### Declarative Multi-Value & Spatial-Containment Boundary Selectors (`in_values` & `within_boundary`)
**Decision**: Extend `boundarySelectRule` in `schemas/jurisdiction.schema.json` with optional `in_values` (`string[]`) and `within_boundary` (`boolean`, default `false`) alongside `property` and `equals`, and add `retrieval` (`RetrievalRecord | null`), `source_label`, and `retrieved_date` to `boundaryMapConfig`.
**Why**: Allows `jurisdictions/in-ka-bengaluru-south.yaml` to select Bengaluru South's corporation polygon (`equals`), its two GBA zones (`in_values` or `equals`), and all Bengaluru South wards (by corporation attribute `equals`/`in_values` or spatial containment `within_boundary: true` inside `boundary.geojson`) declaratively in YAML without any hard-coded strings in `pipeline/bylaws/geo/boundaries.py` (Rule R1).
**Rejected**: Hard-coding `"Bengaluru South"`, `"South"`, or ward ID ranges in Python code (violates Rule R1).
*Introduced by*: 261124-62ci-pr-06-real-map-foundation

## Tasks

### Phase 1: Falsifiable Tests & Official GBA Boundary Discovery/Acquisition

- [x] T001 Write falsifiable tests in `pipeline/tests/test_real_map_foundation_pr06.py` (demonstrated failing first per Rule R11); discover and acquire the official GBA five-corporations boundary, GBA zones boundary, and 369 wards delimitation KML/GeoJSON files + notification PDF from `gba.karnataka.gov.in` / `data.opencity.in` / Wayback Machine with full R15 `retrieval` records <!-- R2 -->

### Phase 2: Boundary Processing, Geometry Validation, and `geo-layers.json` (`boundaries.py`, `geo/__init__.py`)

- [x] T002 Extend `schemas/jurisdiction.schema.json` (`make generate`), `pipeline/bylaws/acquire.py`, `pipeline/bylaws/provenance.py`, `pipeline/bylaws/geo/boundaries.py`, and `pipeline/bylaws/geo/__init__.py` to acquire remote boundary files with R15 `retrieval` records, parse KML/GeoJSON attributes (including KML ExtendedData / HTML description tables), filter by declarative `equals` / `in_values` / `within_boundary` selectors, validate geometries with `shapely.is_valid` / `make_valid`, cross-check ward counts/names in `data/reports/in-ka-bengaluru-south/map-verification.md`, and emit `corporation`, `gba_zones`, and `wards` in `geo-layers.json` <!-- R2 -->

### Phase 3: Protomaps `.pmtiles` Basemap Extract & `docs/map.md`

- [x] T003 Extract the Protomaps vector basemap (`public/data/in-ka-bengaluru-south/basemap.pmtiles`) covering the Bengaluru South corporation bounding box padded by ~2 km, verify HTTP `Range` request support (`bytes=0-511`), and document the build date, bounding box, SHA-256 checksum, and range-request test in `docs/map.md` <!-- R1 -->

### Phase 4: MapLibre GL JS + PMTiles Map Component, Ward Inspector & Release `2.1.0`

- [x] T004 Replace `leaflet` / `react-leaflet` with `maplibre-gl` and `pmtiles` in `package.json` and `docs/dependencies.md`, create `lib/map-style.ts` (dg2n monochrome palette), rewrite `components/ZoneMap.tsx` and `components/AreaExplorerClient.tsx` (removing the SVG schematic view completely, adding layer toggles with `corporation` and `wards` on by default, interactive ward inspector showing ward number/name/GBA zone/source link, `"© OpenStreetMap contributors · Protomaps"` attribution, and plain accuracy + no-land-use-zones notices in `app/j/[id]/page.tsx`), and publish Release `2.1.0` <!-- R1, R3 -->
- [x] T005 Update `__tests__/routes-and-axe.test.tsx` and `docs/progress.md`, and verify all Python tests (`pytest`), `bylaws check-provenance`, R4 license checks, Vitest + `axe-core` WCAG AA tests (`npm test`), `npm run lint`, `npm run typecheck`, and `npm run build` pass <!-- R1, R2, R3 -->

## Acceptance

### Functional Completeness

- [ ] A-001 R1: `leaflet` and `react-leaflet` are replaced by `maplibre-gl` and `pmtiles`, the SVG schematic view and its toggle are completely removed, and `ZoneMap.tsx` renders with the dg2n monochrome style (`lib/map-style.ts`) and visible `"© OpenStreetMap contributors · Protomaps"` attribution
- [ ] A-002 R1: `public/data/in-ka-bengaluru-south/basemap.pmtiles` is extracted for Bengaluru South + ~2 km margin, supports HTTP `Range` requests, and its build date, bounding box, and SHA-256 checksum are documented in `docs/map.md`
- [ ] A-003 R2: Official GBA corporation (`boundary.geojson`), GBA zones (`gba-zones.geojson`), and wards (`wards.geojson`) boundaries and notification PDF are acquired with R15 `retrieval` records, selected via config selectors (Rule R1), validated with `shapely`, and published in `geo-layers.json` (`kind: "official_boundary"`)
- [ ] A-004 R2: `data/reports/in-ka-bengaluru-south/map-verification.md` reports the exact ward count, ward numbers, and ward names from the source and cross-checks them against the delimitation notification
- [ ] A-005 R3: `/j/in-ka-bengaluru-south` enables `corporation` and `wards` by default, displays ward number, ward name, GBA zone, and source link when a ward is selected, and shows plain-language accuracy and no-land-use-zones notices

### Behavioral Correctness

- [ ] A-006 R2: Published polygon outlines in `boundary.geojson`, `gba-zones.geojson`, and `wards.geojson` match the source file coordinates (verified by unit test) and all geometries are valid (`shapely.is_valid`)
- [ ] A-007 R1: `test_r4_licences.py` passes with `maplibre-gl` and `pmtiles` installed

### Scenario Coverage

- [ ] A-008 R2: Falsifiable tests in `pipeline/tests/test_real_map_foundation_pr06.py` are shown failing first (Rule R11) and pass once boundaries, PMTiles basemap, `geo-layers.json`, and `map-verification.md` are generated
- [ ] A-009 R3: All Vitest and `axe-core` WCAG AA checks pass on the updated Map page and ward inspector

### Code Quality

- [ ] A-010 Pattern consistency & R1 compliance: Zero hard-coded city, corporation, or ward names exist in `pipeline/bylaws/` or `components/`

## Notes

- Check items as you review: `- [x]`

## Assumptions

| # | Grade | Decision | Rationale | Scores |
|---|-------|----------|-----------|--------|
| 1 | Certain | Replace `leaflet` and `react-leaflet` with `maplibre-gl` and `pmtiles` (both BSD-3-Clause) and completely remove the SVG schematic view and its toggle | Explicitly mandated by `06-real-map-foundation.md` §1 | S:100 R:90 A:95 D:100 |
| 2 | Certain | Acquire official GBA corporations, GBA zones, and wards boundaries via `bylaws acquire` with full R15 `retrieval` records and select Bengaluru South features via declarative selectors in `jurisdictions/in-ka-bengaluru-south.yaml` (Rule R1) | Explicitly required by `06-real-map-foundation.md` §2 | S:98 R:90 A:95 D:95 |
| 3 | Certain | Enable `corporation` and `wards` layers by default on `/j/in-ka-bengaluru-south`, display ward number, ward name, GBA zone, and source link on ward selection, and show a plain line stating that land-use zones are not published yet | Explicitly required by `06-real-map-foundation.md` §3 | S:98 R:95 A:95 D:98 |

3 assumptions (3 certain, 0 confident, 0 tentative).
