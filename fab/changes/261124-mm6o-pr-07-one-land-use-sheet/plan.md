# Plan: PR 07 — One Land-Use Sheet (Checkpoint 3)

**Change**: 261124-mm6o-pr-07-one-land-use-sheet
**Created**: 2026-11-24
**Status**: Active
**Intake**: `intake.md`

## Requirements

### Geospatial Pipeline: RMP 2015 Index Discovery & Planning Districts (`docs/map.md`, `jurisdictions/in-ka-bengaluru-south.yaml`)

- **R1 (RMP 2015 Index Discovery & Intersecting Planning Districts)**: The pipeline MUST acquire (with a full Rule R15 `retrieval` record) the RMP 2015 Index Map / Planning District boundary dataset from official BBMP (`site.bbmp.gov.in`) or OpenCity mirror (`data.opencity.in`), identify every planning district sheet that intersects the Bengaluru South corporation boundary (`boundary.geojson`), record the complete list in `docs/map.md` (with district numbers and names read from the maps, noting OpenCity's index mislabelling of PD 204), inspect candidate sheets inside Bengaluru South, and choose the clearest sheet for PR 07.
  - **Scenario**: Inspecting `docs/map.md` and `planning-districts.geojson`
    - **GIVEN** the official Bengaluru South corporation boundary (`boundary.geojson`) and the RMP 2015 planning district index
    - **WHEN** `bylaws geo --jurisdiction in-ka-bengaluru-south` runs
    - **THEN** `docs/map.md` lists all planning district sheets intersecting Bengaluru South with candidate evaluation and selection rationale, and `planning-districts.geojson` contains the outline of the chosen planning district clipped to `boundary.geojson`.

### Geospatial Pipeline: Printed-Grid Georeferencing, Vector Zone Extraction & Independent Checks (`georef.py`, `zones.py`, `verify.py`)

- **R2 (Printed-Grid Georeferencing & Vector/Raster Zone Extraction)**: The pipeline MUST acquire the chosen RMP 2015 Proposed Land Use PDF sheet with a full R15 `retrieval` record, fit an affine transform from PDF coordinates to UTM Zone 43N (`EPSG:32643`, WGS 1984, 1:10,000) using the sheet's printed coordinate grid, measure residuals at every grid intersection, leave-one-out (LOO) error, RMSE in metres (target `≤ 10 m`), and maximum residual, extract land-use polygons mapped strictly to the sheet's legend swatches/codes/labels (`vector_pdf` or `grid_georeferenced_raster`), clip to `boundary.geojson`, and reproject to WGS 84 (`EPSG:4326`) in `zones.geojson` (`derived: true`, `verification: "machine_checked"`).
  - **Scenario**: Validating `zones.geojson` and georeferencing metrics
    - **GIVEN** the acquired RMP 2015 Proposed Land Use PDF sheet and its printed UTM 43N coordinate grid
    - **WHEN** `bylaws geo --jurisdiction in-ka-bengaluru-south` runs
    - **THEN** `zones.geojson` validates against `schemas/zones.schema.json` (`schema_version: "1.3"`), every feature has `derived: true`, `verification: "machine_checked"`, a legend-derived `zone_code` and `zone_label`, and `georef_run` with measured `rmse_m` (`≤ 10 m` or declared shortfall) and `loo_rmse_m`.

- **R3 (Independent Road & Boundary Accuracy Checks)**: `pipeline/bylaws/geo/verify.py` MUST run independent placement checks (comparing road lines on the sheet against OpenStreetMap roads and administrative/ward lines on the sheet against official GBA ward boundaries from PR 06), and write `data/reports/in-ka-bengaluru-south/map-verification.md` containing the grid residuals, LOO RMSE, maximum residual, independent road median and 90th-percentile offset in metres, ward boundary comparison, and legend mapping table.
  - **Scenario**: Inspecting `data/reports/in-ka-bengaluru-south/map-verification.md`
    - **GIVEN** the georeferenced sheet, OpenStreetMap road geometries, and `wards.geojson`
    - **WHEN** `bylaws geo --jurisdiction in-ka-bengaluru-south` completes
    - **THEN** `map-verification.md` reports the grid intersection residuals, LOO RMSE, maximum residual, independent road median/p90 offset in metres, and ward boundary comparison.

### Web Application: Sheet Image Overlay, Accuracy Notice & Release `2.2.0` (`ZoneMap.tsx`, `ReviewPanel.tsx`)

- **R4 (MapLibre Sheet Image Overlay, Opacity Slider & Release `2.2.0`)**: The pipeline MUST render and publish the georeferenced sheet overlay image (`public/data/in-ka-bengaluru-south/sheets/<sheet_id>.png`) and its WGS 84 corner coordinates in `geo-layers.json`, publish `planning_districts` and `landuse_zones` in Release `2.2.0` (`public/data/in-ka-bengaluru-south/2.2.0/`) with updated `declarations.json` (1 district extracted, remaining intersecting districts pending for PR 11), and render the sheet image overlay with a toggle on `/j/in-ka-bengaluru-south` (Map page) and an interactive opacity slider on `/j/in-ka-bengaluru-south/review` (Review page), plus the plain-words accuracy notice.
  - **Scenario**: Rendering `/j/in-ka-bengaluru-south` and `/j/in-ka-bengaluru-south/review`
    - **GIVEN** Release `2.2.0` in `public/data/in-ka-bengaluru-south/2.2.0/`
    - **WHEN** the Map and Review pages render
    - **THEN** the Map page displays `landuse_zones`, `planning_districts`, the sheet overlay toggle, and the plain-words accuracy notice (`"Zones traced from the RMP 2015 Proposed Land Use sheet ..., placed using the sheet's printed grid; measured placement error about ... m."`), and the Review page renders the sheet overlay with an interactive opacity slider and passes `axe-core` WCAG AA checks.

### Design Decisions

1. **Decision**: Add optional `sheet_overlay` metadata (`image_url`, `bounds_wgs84`: `[[lon_tl, lat_tl], [lon_tr, lat_tr], [lon_br, lat_br], [lon_bl, lat_bl]]`, `sheet`, `planning_district`, `rmse_m`, `road_median_offset_m`, `road_p90_offset_m`) to `geoLayerEntry` in `schemas/geo-layers.schema.json`.
   - **Why**: Enables both `ZoneMap.tsx` and `ReviewPanel.tsx` to place a MapLibre `"image"` source using the exact fitted transform corners without hardcoding sheet coordinates in UI code (Rule R1).
   - **Rejected**: Hardcoding corner coordinates in `ZoneMap.tsx` or `ReviewPanel.tsx` (violates Rule R1).
   - *Introduced by*: `261124-mm6o-pr-07-one-land-use-sheet`

## Tasks

### Phase 1: Falsifiable Tests & RMP 2015 Index / Sheet Discovery & Acquisition

- [x] T001 Write falsifiable tests in `pipeline/tests/test_one_land_use_sheet_pr07.py` (demonstrated failing first per Rule R11); discover and acquire the RMP 2015 Index Map / Planning District boundaries and candidate RMP 2015 Proposed Land Use sheet PDFs from official BBMP (`site.bbmp.gov.in/PDF/landusemaps/...`) / OpenCity mirror (`data.opencity.in`) with full R15 `retrieval` records, identify all planning district sheets intersecting `boundary.geojson`, inspect candidates, choose the clearest sheet inside Bengaluru South, and document the complete intersecting list and candidate inspection in `docs/map.md` <!-- R1 -->

### Phase 2: Printed-Grid Georeferencing, Vector Zone Extraction & Independent Checks (`georef.py`, `zones.py`, `verify.py`)

- [x] T002 Implement `pipeline/bylaws/geo/georef.py` to extract/read the sheet's printed UTM Zone 43N (`EPSG:32643`, WGS 1984, 1:10,000) coordinate grid intersections, fit an affine transform from PDF coordinates to `EPSG:32643`, compute per-point residuals, leave-one-out (LOO) RMSE, overall RMSE in metres (`≤ 10 m`), and maximum residual, render the sheet overlay image (`public/data/in-ka-bengaluru-south/sheets/<sheet_id>.png`), and compute its 4 WGS 84 corner coordinates <!-- R2 -->
- [x] T003 Implement `pipeline/bylaws/geo/zones.py` and `pipeline/bylaws/geo/__init__.py` to extract land-use polygons from the PDF sheet (`vector_pdf` path extraction mapped strictly to the sheet's legend swatches/codes/labels, or `grid_georeferenced_raster` fallback), reproject via the fitted grid transform to `EPSG:4326`, clip to `boundary.geojson`, emit `zones.geojson` and `planning-districts.geojson`, and implement independent road (vs. OpenStreetMap) and boundary (vs. `wards.geojson`) offset checks in `pipeline/bylaws/geo/verify.py` (`data/reports/in-ka-bengaluru-south/map-verification.md`) <!-- R2, R3 -->

### Phase 3: MapLibre Sheet Overlay, Review Page & Release `2.2.0`

- [x] T004 Extend `schemas/geo-layers.schema.json` and `schemas/jurisdiction.schema.json` (`make generate`), update `components/ZoneMap.tsx`, `components/AreaExplorerClient.tsx`, `components/ReviewPanel.tsx`, `app/j/[id]/page.tsx`, and `app/j/[id]/review/page.tsx` to render `planning_districts`, `landuse_zones` (with legend colours), the MapLibre `"image"` source sheet overlay with toggle on the Map page and opacity slider on the Review page, plus the plain-words accuracy notice, and publish Release `2.2.0` (`public/data/in-ka-bengaluru-south/2.2.0/`) with updated `declarations.json` <!-- R4 -->
- [x] T005 Update `__tests__/routes-and-axe.test.tsx`, `pipeline/tests/test_bengaluru_south_dataset.py`, `pipeline/tests/test_anchor_documents_pr05.py`, and `docs/progress.md`, verify all Python tests (`pytest`), `bylaws check-provenance`, R1/R4 checks, Vitest + `axe-core` WCAG AA tests (`npm test`), `npm run lint`, `npm run typecheck`, and `npm run build` pass, and include the Checkpoint 3 preview link, 3 inspection points, and measured errors in the PR description <!-- R1, R2, R3, R4 -->

## Acceptance

### Functional Completeness
- [x] A-001 R1: `docs/map.md` lists every RMP 2015 planning district sheet intersecting the Bengaluru South corporation boundary (with district numbers and names verified from the maps, noting PD 204), records the candidate sheet evaluation (vector paths vs. raster, printed UTM 43N grid readability, legend readability, corporation overlap), and explains why the chosen sheet was selected.
- [x] A-002 R1: Both the RMP 2015 index/planning-district source and the chosen RMP 2015 Proposed Land Use PDF sheet are acquired with full Rule R15 `retrieval` records (`fetched_at`, `requested_url`, `final_url`, `http_status: 200`, `content_type`, `content_length`, `response_headers`, 64-hex `sha256`, `archive_url` or `archive_failure_reason`, `fetched_by`), and `bylaws check-provenance` exits `0`.
- [x] A-003 R2: `pipeline/bylaws/geo/georef.py` fits a PDF-to-UTM-43N (`EPSG:32643`) transform from the sheet's printed grid intersections and computes per-point residuals, leave-one-out RMSE, overall RMSE in metres (`≤ 10 m` or declared shortfall), and maximum residual.
- [x] A-004 R2: `public/data/in-ka-bengaluru-south/2.2.0/zones.geojson` and `planning-districts.geojson` validate against Schema 1.3; every zone polygon is clipped to `boundary.geojson` and carries `zone_code` and `zone_label` from the sheet's own legend, `planning_district`, `sheet`, `extraction_method`, `georef_run` (with measured `rmse_m`), `derived: true`, and `verification: "machine_checked"`.
- [x] A-005 R3: `data/reports/in-ka-bengaluru-south/map-verification.md` records all grid intersection residuals, LOO RMSE, maximum residual, independent OpenStreetMap road offset metrics (median and 90th-percentile offset in metres), and ward boundary comparison against `wards.geojson`.
- [x] A-006 R4: `components/ZoneMap.tsx` and `components/ReviewPanel.tsx` render the georeferenced RMP 2015 sheet image (`public/data/in-ka-bengaluru-south/sheets/<sheet_id>.png`) as a MapLibre `"image"` source overlay with a toggle on the Map page (`/j/in-ka-bengaluru-south`) and an interactive opacity slider on the Review page (`/j/in-ka-bengaluru-south/review`), alongside the plain-words accuracy notice and updated `declarations.json` for Release `2.2.0`.

### Scenario Coverage
- [x] A-007 R2: `pipeline/tests/test_one_land_use_sheet_pr07.py` verifies the intersecting planning districts list in `docs/map.md`, R15 `retrieval` records for the index and sheet PDF, printed-grid georeferencing RMSE and LOO RMSE, legend-matched `zones.geojson` polygons, independent road/ward check metrics in `map-verification.md`, and published sheet overlay assets.
- [x] A-008 R4: `__tests__/routes-and-axe.test.tsx` verifies that `/j/in-ka-bengaluru-south` and `/j/in-ka-bengaluru-south/review` render the extracted zones, sheet overlay toggle/opacity slider, and plain-words accuracy notice, with zero `axe-core` WCAG AA violations.

### Code Quality
- [x] A-009 Pattern consistency: Zero jurisdiction-specific constants appear in `pipeline/bylaws/`, `app/`, `components/`, or `lib/` (`pipeline/tests/test_r1_no_hardcoding.py` passes).
- [x] A-010 No unnecessary duplication: All Python and npm dependencies remain strictly permissive (`pipeline/tests/test_r4_licences.py` passes) and `npm run build` succeeds.

## Assumptions

| # | Grade | Decision | Rationale | Scores |
|---|-------|----------|-----------|--------|
| 1 | Certain | Bump `in-ka-bengaluru-south` `release_version` to `"2.2.0"` for PR 07 | Follows `07-one-land-use-sheet.md` §5 (`Release 2.x.0 with declarations: one district of N in Bengaluru South has zones; the rest pending`), incrementing minor version from PR 06's `2.1.0` | S:95 R:95 A:95 D:95 |
| 2 | Certain | Acquire RMP 2015 Index Map and chosen Land Use PDF sheet from official BBMP (`site.bbmp.gov.in`) / OpenCity mirror (`data.opencity.in`) or Wayback Machine with full R15 `retrieval` metadata | Explicitly mandated by `07-one-land-use-sheet.md` §1 and Rules R15/R16 | S:95 R:90 A:95 D:95 |
| 3 | Certain | Render the georeferenced sheet overlay using a MapLibre `"image"` source with 4 WGS 84 corner coordinates and interactive opacity slider on both the Map and Review pages | Explicitly specified by `07-one-land-use-sheet.md` §5 (`MapLibre image source placed by the fitted transform ... with an opacity slider on the Review page and a toggle on the Map page`) | S:95 R:90 A:95 D:95 |

3 assumptions (3 certain, 0 confident, 0 tentative).

## Deletion Candidates

- `components/ZoneMap.tsx:135` (`showOverlaysLayer` state) — Toggled by checkbox at `components/ZoneMap.tsx:730-736`, but never wired to any MapLibre source or layer.
- `pipeline/bylaws/geo/__init__.py:263` (`"master-plan-zones"` legacy layer ID) — Unifying imported and traced zoning layer IDs on `"landuse_zones"` would remove the dual-ID fallback in `components/ZoneMap.tsx:214`.
