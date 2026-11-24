# PR 06 — Real Map Foundation and Official Boundaries

**Read first:** `00-overview.md` · **Depends on:** PR 02 (can run alongside PRs 04–05) · **Estimate:** 3–4 days · **Checkpoint:** owner reviews and merges

## Goal

Replace the schematic map with a real street map, and show the real, official boundaries of Bengaluru South City Corporation, its two GBA zones and its wards.

## 1. Base map: Protomaps

- Switch the map component from Leaflet to **MapLibre GL JS** with the **PMTiles** protocol (vector tiles from a single file). Check licences against R4 (MapLibre GL JS and the pmtiles library are permissively licensed; basemap data is OpenStreetMap under ODbL, which requires attribution).
- Build a basemap extract for Bengaluru South plus a margin (bounding box from the official corporation boundary, padded ~2 km) from a recent Protomaps daily build using the `pmtiles extract` command. Record the build date, bounding box and file checksum in `docs/map.md`.
- Host the `.pmtiles` file in **Vercel Blob**. PMTiles needs HTTP range requests: verify that the Blob URL serves `Range` requests correctly (test with a partial request). If it does not, record the finding and fall back to serving the file from the app's static files if it fits size limits, otherwise from another static host that supports range requests; record the decision.
- **Style:** a custom MapLibre style in the dg2n palette (paper `#f5f3ed` land, hairline `#c8ccc0` minor roads, muted `#5b5e56` labels, ink `#080909` major roads and boundaries), built from the Protomaps basemap layers. Monochrome; water and parks as subtle tones. Labels in English.
- Attribution visible on the map: "© OpenStreetMap contributors · Protomaps".
- **Remove the SVG schematic view entirely**, including its toggle and code.
- The map works on mobile (touch zoom and pan), and with keyboard (focusable controls).

## 2. Official boundaries

Acquire through `bylaws acquire` with retrieval records (R15), from:
- **GBA corporations:** https://data.opencity.in/dataset/greater-bengaluru-authority-corporations-delimitation-2025: the final five-corporations map (September 2025, KML), the GBA zones map (KML), and the final notification PDF. Look for the original on gba.karnataka.gov.in and use it if available.
- **Wards:** https://data.opencity.in/dataset/gba-wards-delimitation-2025: the final wards map (369 wards, notified 19 November 2025) and the December 2025 version with name changes.

Process:
- Convert KML to GeoJSON, keep source attributes, reproject only if needed (KML is WGS 84).
- Select Bengaluru South by the attribute value **found in the file** (record it), not by a hard-coded name in code (R1: the selector lives in config).
- Wards: select those belonging to Bengaluru South **by the file's own attributes or by spatial containment within the corporation boundary**; record which method and why. Ward count, numbers and names come from the source; report the count. Cross-check the count against the final notification if it lists wards per corporation; report any difference rather than resolving it silently.
- Validate geometry (valid, no self-intersections; fix only with `make_valid` and record it).
- Publish layers: `corporation`, `gba_zones` (the corporation's two zones), `wards`, each with source, retrieval date, and `kind: official_boundary`.

## 3. Map page

- Layer controls: corporation, GBA zones, wards (on by default: corporation and wards). Planning districts and land-use zones appear in PR 07.
- Click a ward: ward number and name from the source, its GBA zone, and a source link.
- Accuracy note generated from layer metadata in plain words (e.g. "Boundaries from the Greater Bengaluru Authority delimitation maps, November 2025").
- If no land-use zones are published yet: a plain line saying so.

## Acceptance

- [ ] Real street map by default, styled in the dg2n palette; schematic view removed.
- [ ] PMTiles served with working range requests (test recorded).
- [ ] Corporation, GBA zones and wards from official files with retrieval records; outlines match the source files exactly (test compares coordinates).
- [ ] Ward count and names reported from source; any mismatch with the notification declared.
- [ ] Attribution shown; works on mobile and keyboard; axe passes.
- [ ] CI green.
