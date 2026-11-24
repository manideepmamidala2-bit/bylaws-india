# Intake: PR 07 — One Land-Use Sheet (Checkpoint 3)

**Change**: 261124-mm6o-pr-07-one-land-use-sheet
**Created**: 2026-11-24
**Status**: Draft

## Origin

Implements **PR 07 — One Land-Use Sheet (Checkpoint 3)** (`docs/plans/pr-series/07-one-land-use-sheet.md`) in the 11-PR remediation series (`docs/plans/pr-series/00-overview.md`). Depends on PR 06 (`261124-62ci-pr-06-real-map-foundation`, merged in PR #11).

## Why

Before extracting all RMP 2015 Proposed Land Use sheets across Bengaluru South (PR 11), we must prove on **one real RMP 2015 Proposed Land Use sheet** inside Bengaluru South how land-use zones are extracted from the official PDF, mapped to the sheet's own legend codes/labels, placed onto WGS 84 via the sheet's printed UTM Zone 43N (`EPSG:32643`) coordinate grid with measured RMSE (target `≤ 10 m`), independently cross-checked against OpenStreetMap roads and official GBA ward boundaries, and rendered both as GeoJSON polygons (`zones.geojson`, `planning-districts.geojson`) and as a georeferenced sheet image overlay on the MapLibre street map (`/j/in-ka-bengaluru-south`) and Review page (`/j/in-ka-bengaluru-south/review`) with an opacity slider (Checkpoint 3).

## What Changes

### 1. RMP 2015 Index Map & Planning District Discovery (`docs/map.md`, `jurisdictions/in-ka-bengaluru-south.yaml`)
- Acquire (with Rule R15 `retrieval` record) the RMP 2015 Index Map / Planning District boundary dataset from official BBMP (`https://site.bbmp.gov.in/revised%20masterplan%20(1).html`) / OpenCity mirror (`https://data.opencity.in/dataset/bda-revised-master-plan-2015`).
- Identify every RMP 2015 planning district sheet that intersects the Bengaluru South corporation boundary (`boundary.geojson` from PR 06), reading district numbers and names directly from the maps (noting OpenCity's index mislabelling of PD 204 as "Jayanagar" when the map sheet is "Benson Town").
- Record the complete list of intersecting planning district sheets in `docs/map.md`, inspect candidate sheets inside Bengaluru South (recording vector paths vs. raster, printed UTM 43N grid readability, legend readability, and corporation overlap), choose the clearest sheet for PR 07, and list the remaining sheets as pending for PR 11.

### 2. Printed-Grid Georeferencing & Vector/Raster Zone Extraction (`pipeline/bylaws/geo/georef.py`, `pipeline/bylaws/geo/zones.py`, `pipeline/bylaws/geo/__init__.py`)
- Acquire the chosen RMP 2015 Proposed Land Use PDF sheet with full R15 `retrieval` metadata.
- **Georeferencing (`pipeline/bylaws/geo/georef.py`)**:
  - Extract printed UTM Zone 43N (`EPSG:32643`, WGS 1984, 1:10,000) grid easting/northing labels and grid line intersections from the PDF coordinate space (or curated grid intersections in `data/overrides/in-ka-bengaluru-south/`).
  - Fit an affine transform from PDF coordinates to `EPSG:32643`, compute residuals at every grid intersection, leave-one-out (LOO) error, RMSE in metres (target `≤ 10 m`), and maximum residual, and reproject to `EPSG:4326` (WGS 84).
  - Render the sheet image (`public/data/in-ka-bengaluru-south/sheets/<sheet_id>.png`) and compute its WGS 84 corner coordinates (`[[lon_tl, lat_tl], [lon_tr, lat_tr], [lon_br, lat_br], [lon_bl, lat_bl]]`) for MapLibre image source overlay.
- **Zone Extraction (`pipeline/bylaws/geo/zones.py`)**:
  - Extract land-use polygons using vector path extraction (`vector_pdf`: reading PDF fill paths and fill colours, mapping strictly to the sheet's legend swatches/codes/labels, reconstructing polygons with shared edges merged and holes preserved) or `grid_georeferenced_raster` fallback if vector paths are absent.
  - Clip extracted polygons to the Bengaluru South corporation boundary (`boundary.geojson`) and emit Schema 1.3 `zones.geojson` features (`zone_code`, `zone_label`, `planning_district`, `sheet`, `extraction_method`, `georef_run`, `area_sq_m`, `derived: true`, `verification: "machine_checked"`) and `planning-districts.geojson` for the chosen planning district outline.

### 3. Independent Accuracy Checks (`pipeline/bylaws/geo/verify.py`, `data/reports/in-ka-bengaluru-south/map-verification.md`)
- Run independent placement checks that do not depend on the grid intersections used to fit the transform:
  - **Roads**: Compare road edges/centrelines on the sheet against OpenStreetMap roads from `basemap.pmtiles` / OSM features; report median and 90th-percentile offset in metres.
  - **Boundaries**: Compare administrative/ward lines on the sheet against the official GBA ward boundaries (`wards.geojson` from PR 06) where both exist.
  - Record all grid residuals, LOO RMSE, maximum residual, independent road/boundary offset metrics, legend mapping table, and sample verification notes in `data/reports/in-ka-bengaluru-south/map-verification.md`.

### 4. Publish Layers, Sheet Image Overlay & Release `2.2.0` (`components/ZoneMap.tsx`, `components/ReviewPanel.tsx`, `public/data/in-ka-bengaluru-south/2.2.0/`)
- Publish `planning_districts` (`planning-districts.geojson`) and `landuse_zones` (`zones.geojson`) in `geo-layers.json`, plus sheet overlay metadata (`external_url` / corner coordinates) so:
  - `/j/in-ka-bengaluru-south` (Map page) renders the extracted land-use zones and planning district outline, includes a toggle + opacity slider for the original georeferenced RMP 2015 sheet image overlay on the MapLibre canvas, and displays the plain-words accuracy notice (`"Zones traced from the RMP 2015 Proposed Land Use sheet <name>, placed using the sheet's printed grid; measured placement error about N m."`).
  - `/j/in-ka-bengaluru-south/review` (Review page) renders the MapLibre sheet image overlay beside/over the extracted zones with the interactive opacity slider.
- Publish Release `2.2.0` with updated `declarations.json` stating that 1 planning district of N in Bengaluru South has extracted zones and the remaining N-1 districts are pending (PR 11).
- Include the Checkpoint 3 preview link, 3 specific inspection points (e.g., a major road junction, a park, and a zone boundary along a road), and the measured errors in the PR description.

## Affected Memory

- `architecture/overview`: (modify) Document printed-grid UTM 43N georeferencing, vector/raster land-use sheet extraction, independent road/boundary checks, MapLibre sheet image overlay, and Release `2.2.0`.
- `schemas/data-contracts`: (modify) Document any schema additions for traced sheet georeferencing / sheet overlay metadata in `jurisdiction.schema.json` and `geo-layers.schema.json`.

## Impact

- **Schemas**: `schemas/jurisdiction.schema.json`, `schemas/geo-layers.schema.json`, regenerated `pipeline/bylaws/models/_generated.py` and `lib/types/generated.ts`.
- **Pipeline**: `pipeline/bylaws/geo/georef.py`, `pipeline/bylaws/geo/zones.py`, `pipeline/bylaws/geo/verify.py`, `pipeline/bylaws/geo/__init__.py`, `pipeline/bylaws/publish.py`, `pipeline/tests/test_one_land_use_sheet_pr07.py`.
- **Config & Overrides**: `jurisdictions/in-ka-bengaluru-south.yaml`, `data/overrides/in-ka-bengaluru-south/overrides.yaml`.
- **Web App**: `components/ZoneMap.tsx`, `components/AreaExplorerClient.tsx`, `components/ReviewPanel.tsx`, `app/j/[id]/page.tsx`, `app/j/[id]/review/page.tsx`, `__tests__/routes-and-axe.test.tsx`.
- **Published Data & Docs**: `public/data/in-ka-bengaluru-south/2.2.0/`, `public/data/in-ka-bengaluru-south/sheets/`, `docs/map.md`, `data/reports/in-ka-bengaluru-south/map-verification.md`, `docs/progress.md`.

## Open Questions

None — all requirements, target RMSE (`≤ 10 m`), extraction preference order, independent checks, and Checkpoint 3 deliverables are specified in `docs/plans/pr-series/07-one-land-use-sheet.md`.

## Assumptions

| # | Grade | Decision | Rationale | Scores |
|---|-------|----------|-----------|--------|
| 1 | Certain | Bump `in-ka-bengaluru-south` `release_version` to `"2.2.0"` for PR 07 | Follows `07-one-land-use-sheet.md` §5 (`Release 2.x.0 with declarations: one district of N in Bengaluru South has zones; the rest pending`), incrementing minor version from PR 06's `2.1.0` | S:95 R:95 A:95 D:95 |
| 2 | Certain | Acquire RMP 2015 Index Map and chosen Land Use PDF sheet from official BBMP (`site.bbmp.gov.in`) / OpenCity mirror (`data.opencity.in`) or Wayback Machine with full R15 `retrieval` metadata | Explicitly mandated by `07-one-land-use-sheet.md` §1 and Rules R15/R16 | S:95 R:90 A:95 D:95 |
| 3 | Certain | Render the georeferenced sheet overlay using a MapLibre `"image"` source with 4 WGS 84 corner coordinates and interactive opacity slider on both the Map and Review pages | Explicitly specified by `07-one-land-use-sheet.md` §5 (`MapLibre image source placed by the fitted transform ... with an opacity slider on the Review page and a toggle on the Map page`) | S:95 R:90 A:95 D:95 |

3 assumptions (3 certain, 0 confident, 0 tentative, 0 unresolved). Run /fab-clarify to review.
