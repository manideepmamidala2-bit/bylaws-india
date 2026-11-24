# PR 07 — One Land-Use Sheet

**Read first:** `00-overview.md` · **Depends on:** PR 06 · **Estimate:** 3–5 days · **Checkpoint 3:** owner checks the sheet overlay on the street map

## Goal

Prove, on one real RMP 2015 Proposed Land Use sheet inside Bengaluru South, how land-use zones will be extracted and placed on the map, with measured accuracy. All other sheets follow in PR 11 using the method proven here.

## 1. Find the sheets for Bengaluru South

- Acquire (R15) the RMP 2015 index map and the list of planning district sheets from the official BBMP page https://site.bbmp.gov.in/revised%20masterplan%20(1).html (sheets are PDFs under `site.bbmp.gov.in/PDF/landusemaps/<group>/<sheet>.pdf`, e.g. https://site.bbmp.gov.in/PDF/landusemaps/2/2.12%20map%20(b)-%20Vijayanagar.pdf), with OpenCity https://data.opencity.in/dataset/bda-revised-master-plan-2015 as mirror.
- Identify every planning district sheet that intersects the Bengaluru South corporation boundary (from PR 06). Note that OpenCity's index listing mislabels Planning District 204 ("Benson Town", not "Jayanagar"); read names and numbers from the maps.
- Record the list in `docs/map.md`; acquire only what is needed for this PR (the chosen sheet and the index), and list the rest for PR 11.

## 2. Choose one sheet

Pick the sheet inside Bengaluru South with the clearest content for proving the method. Inspect candidates and record for each: vector paths present or raster only; printed coordinate grid present and readable (sheets are expected to show "UTM zone 43N, WGS 1984, 1:10,000" with grid values); legend readable; how much of the sheet lies inside the corporation. Choose and record the reason.

## 3. Extract zones, in order of preference

**A. Vector extraction (if the PDF contains drawn land-use polygons)**
- Read fill paths and their fill colours from the PDF (pypdfium2 page objects or pdfplumber).
- Map fill colours to legend entries by reading the legend swatches and labels from the same PDF. Zone codes and labels come only from the legend.
- Reconstruct polygons (close paths, merge fragments of the same fill that share edges, keep holes).

**B. Placing the sheet: the printed grid**
- Find grid labels (easting and northing values) and their tick or line positions in PDF coordinates, from the text layer if present, otherwise by OCR of the rendered sheet.
- Fit a transform from PDF coordinates to UTM zone 43N (EPSG:32643): affine first; consider a higher-order fit only if residuals justify it.
- Measure: residuals at every grid intersection used, leave-one-out error, RMSE in metres, maximum residual. **Target RMSE ≤ 10 m.**
- Reproject the zones to WGS 84 for publishing.

**C. Raster fallback (no vector paths)**
- Render at high resolution, georeference from the printed grid as in B, then segment colours by legend in a perceptual colour space, clean up text and hatching, vectorise.
- Only if the sheet has no usable grid: OpenStreetMap control points (target RMSE ≤ 30 m).

## 4. Independent checks

The placement check must not depend on the same inputs used to fit it:
- **Roads:** compare road edges or road centrelines drawn on the sheet (if present as paths) with OpenStreetMap roads; report median and 90th-percentile offset in metres.
- **Boundaries:** compare any ward or administrative lines on the sheet with the official ward boundaries from PR 06, where both exist.
- **Existing land use:** report agreement with KSRSAC existing land use (if acquired), as information only; zoning is never "corrected" to existing use.

## 5. Publish

- Layers: `planning_districts` (this district's outline), `landuse_zones` (zones from this sheet, clipped to the corporation boundary), each zone with `zone_code`, `zone_label`, `planning_district`, `sheet`, `extraction_method`, measured accuracy, `derived: true` (placed by the project), `verification: machine_checked`.
- **Sheet overlay:** the original sheet as an image on the map (MapLibre image source placed by the fitted transform; for a non-affine fit, a warped raster), with an opacity slider on the Review page and a toggle on the Map page.
- Accuracy note in plain words, e.g. "Zones traced from the RMP 2015 Proposed Land Use sheet <name>, placed using the sheet's printed grid; measured placement error about N m."
- Release `2.x.0` with declarations: one district of N in Bengaluru South has zones; the rest pending.
- `map-verification.md` with every measurement and sample images.

## 6. Checkpoint 3 (owner)

The PR description gives:
- the preview link to the Map page zoomed to the sheet, with the overlay on;
- three places to look (e.g. a major junction, a park, a zone boundary along a road) with what to expect;
- the measured errors.

The owner checks that the sheet lines up with the streets and that zones match the sheet. The agent waits for confirmation.

## Acceptance

- [ ] Sheets intersecting Bengaluru South listed from the real index.
- [ ] One sheet extracted by the best available method, with codes from its legend.
- [ ] Placement measured; RMSE target met or the shortfall declared with the measured value.
- [ ] Independent checks reported.
- [ ] Overlay of the original sheet on the street map works.
- [ ] Checkpoint 3 passed.
