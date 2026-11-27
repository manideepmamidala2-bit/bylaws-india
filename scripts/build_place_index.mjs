#!/usr/bin/env node
/**
 * Build-time place index & uncovered land-use hatch generator (Part 2.2 & 2.3).
 *
 * Uses `pmtiles` + `@mapbox/vector-tile` (`pbf`) to read localities,
 * neighbourhoods, major roads, and landmarks from `basemap.pmtiles`,
 * joins them with `wards.geojson`, `boundary.geojson`, `planning-districts.geojson`,
 * and `zones.geojson`, and writes `public/data/<id>/place-index.json`
 * (guaranteed <= 300 KB compressed) plus `public/data/<id>/uncovered-area.geojson`.
 */

import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { PMTiles } from "pmtiles";
import { VectorTile } from "@mapbox/vector-tile";
import { PbfReader } from "pbf";

const repoRoot = process.cwd();
const publicDataDir = path.join(repoRoot, "public", "data");
const manifestPath = path.join(publicDataDir, "manifest.json");

if (!fs.existsSync(manifestPath)) {
  console.log("[build_place_index] No manifest.json found; skipping.");
  process.exit(0);
}

class LocalFileSource {
  constructor(filename) {
    this.filename = filename;
    this.fd = fs.openSync(filename, "r");
  }
  getKey() {
    return this.filename;
  }
  async getBytes(offset, length) {
    const buf = Buffer.alloc(length);
    fs.readSync(this.fd, buf, 0, length, offset);
    return {
      data: buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength),
    };
  }
  close() {
    try {
      fs.closeSync(this.fd);
    } catch {
      // ignore
    }
  }
}

function lon2tile(lon, z) {
  return Math.floor(((lon + 180) / 360) * Math.pow(2, z));
}

function lat2tile(lat, z) {
  const rad = (lat * Math.PI) / 180;
  return Math.floor(
    ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) *
      Math.pow(2, z)
  );
}

function getRings(geometry) {
  if (!geometry) return [];
  if (geometry.type === "Polygon") {
    return geometry.coordinates || [];
  }
  if (geometry.type === "MultiPolygon") {
    const out = [];
    for (const poly of geometry.coordinates || []) {
      if (poly && poly[0]) out.push(poly[0]);
    }
    return out;
  }
  return [];
}

function computeFeatureBboxAndCentroid(geometry) {
  const rings = getRings(geometry);
  let minLng = Infinity;
  let maxLng = -Infinity;
  let minLat = Infinity;
  let maxLat = -Infinity;
  let sumLng = 0;
  let sumLat = 0;
  let count = 0;
  for (const ring of rings) {
    for (const pt of ring) {
      const lng = Number(pt[0]);
      const lat = Number(pt[1]);
      if (!Number.isFinite(lng) || !Number.isFinite(lat)) continue;
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
      sumLng += lng;
      sumLat += lat;
      count += 1;
    }
  }
  if (count === 0) {
    return null;
  }
  return {
    bbox: [minLng, minLat, maxLng, maxLat],
    centroid: [
      Number((sumLng / count).toFixed(5)),
      Number((sumLat / count).toFixed(5)),
    ],
  };
}

function pointInRing(lng, lat, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = Number(ring[i][0]);
    const yi = Number(ring[i][1]);
    const xj = Number(ring[j][0]);
    const yj = Number(ring[j][1]);
    const intersect =
      yi > lat !== yj > lat &&
      lng < ((xj - xi) * (lat - yi)) / (yj - yi + 1e-12) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function pointInGeometry(lng, lat, geometry, bbox) {
  if (
    bbox &&
    (lng < bbox[0] || lng > bbox[2] || lat < bbox[1] || lat > bbox[3])
  ) {
    return false;
  }
  if (!geometry) return false;
  if (geometry.type === "Polygon") {
    const rings = geometry.coordinates || [];
    if (!rings.length || !pointInRing(lng, lat, rings[0])) return false;
    for (let i = 1; i < rings.length; i++) {
      if (pointInRing(lng, lat, rings[i])) return false;
    }
    return true;
  }
  if (geometry.type === "MultiPolygon") {
    for (const poly of geometry.coordinates || []) {
      if (!poly || !poly.length) continue;
      if (pointInRing(lng, lat, poly[0])) {
        let inHole = false;
        for (let i = 1; i < poly.length; i++) {
          if (pointInRing(lng, lat, poly[i])) {
            inHole = true;
            break;
          }
        }
        if (!inHole) return true;
      }
    }
  }
  return false;
}

function extractCoordFromGeoJSON(geom) {
  if (!geom) return null;
  if (geom.type === "Point" && Array.isArray(geom.coordinates)) {
    return [Number(geom.coordinates[0]), Number(geom.coordinates[1])];
  }
  if (geom.type === "MultiPoint" && geom.coordinates?.[0]) {
    return [Number(geom.coordinates[0][0]), Number(geom.coordinates[0][1])];
  }
  if (geom.type === "LineString" && Array.isArray(geom.coordinates) && geom.coordinates.length > 0) {
    const mid = geom.coordinates[Math.floor(geom.coordinates.length / 2)];
    return [Number(mid[0]), Number(mid[1])];
  }
  if (geom.type === "MultiLineString" && geom.coordinates?.[0]?.length > 0) {
    const line = geom.coordinates[0];
    const mid = line[Math.floor(line.length / 2)];
    return [Number(mid[0]), Number(mid[1])];
  }
  const info = computeFeatureBboxAndCentroid(geom);
  return info ? info.centroid : null;
}

function readJsonIfExists(p) {
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const publicJurs = (manifest.jurisdictions || []).filter(
  (j) => j.visibility !== "test"
);
const parentJur =
  publicJurs.find((j) => publicJurs.some((c) => c.parent === j.id)) ||
  publicJurs[0];

if (!parentJur) {
  process.exit(0);
}

const childJurs = publicJurs.filter((j) => j.parent === parentJur.id);
const activeVersion = parentJur.latest_release || "4.0.0";

// Locate PMTiles file
let pmtilesPath = path.join(publicDataDir, parentJur.id, "basemap.pmtiles");
if (!fs.existsSync(pmtilesPath)) {
  for (const cj of childJurs) {
    const cand = path.join(publicDataDir, cj.id, "basemap.pmtiles");
    if (fs.existsSync(cand)) {
      pmtilesPath = cand;
      break;
    }
  }
}

// Load boundaries, wards, planning districts, and zones across parent + child corporations
const corpMetaList = [];
for (const cj of childJurs) {
  const bPath = path.join(publicDataDir, cj.id, activeVersion, "boundary.geojson");
  const bFc = readJsonIfExists(bPath);
  const feat = bFc?.features?.[0];
  const info = feat ? computeFeatureBboxAndCentroid(feat.geometry) : null;
  const shortKey = String(
    feat?.properties?.Corporation ||
      feat?.properties?.corporation ||
      cj.name
  ).trim();
  corpMetaList.push({
    id: cj.id,
    name: cj.name,
    shortKey: shortKey.toLowerCase(),
    geometry: feat?.geometry || null,
    bbox: info?.bbox || null,
    centroid: info?.centroid || [77.5946, 12.9716],
  });
}

const indexedWards = [];
for (const cj of childJurs) {
  const wPath = path.join(publicDataDir, cj.id, activeVersion, "wards.geojson");
  const wFc = readJsonIfExists(wPath);
  for (const f of wFc?.features || []) {
    const info = computeFeatureBboxAndCentroid(f.geometry);
    if (!info) continue;
    const wardNumber = String(
      f.properties?.ward_id ?? f.properties?.ward_no ?? ""
    ).trim();
    const wardName = String(f.properties?.ward_name ?? "").trim();
    indexedWards.push({
      corporationId: cj.id,
      corporationName: cj.name,
      wardNumber,
      wardName,
      gbaZone: String(f.properties?.zone_name ?? f.properties?.zone ?? "").trim(),
      geometry: f.geometry,
      bbox: info.bbox,
      centroid: info.centroid,
      zonesPresent: new Map(),
    });
  }
}

const indexedPlanningDistricts = [];
const seenPdNames = new Set();
for (const jur of [parentJur, ...childJurs]) {
  const pdPath = path.join(
    publicDataDir,
    jur.id,
    activeVersion,
    "planning-districts.geojson"
  );
  const pdFc = readJsonIfExists(pdPath);
  for (const f of pdFc?.features || []) {
    const info = computeFeatureBboxAndCentroid(f.geometry);
    if (!info) continue;
    const pdNum = String(
      f.properties?.planning_district ?? f.properties?.pd_no ?? "2.10"
    ).trim();
    const pdName = String(
      f.properties?.name ?? f.properties?.pd_name ?? "Jayanagar"
    ).trim();
    const label = pdName.startsWith(pdNum) ? pdName : `${pdNum} · ${pdName}`;
    if (seenPdNames.has(label)) continue;
    seenPdNames.add(label);
    indexedPlanningDistricts.push({
      label,
      geometry: f.geometry,
      bbox: info.bbox,
      centroid: info.centroid,
    });
  }
}

const indexedZones = [];
let zonesMinLng = Infinity;
let zonesMaxLng = -Infinity;
let zonesMinLat = Infinity;
let zonesMaxLat = -Infinity;

for (const jur of [parentJur, ...childJurs]) {
  const zPath = path.join(publicDataDir, jur.id, activeVersion, "zones.geojson");
  const zFc = readJsonIfExists(zPath);
  for (const f of zFc?.features || []) {
    if (f.properties?.superseded_by || f.properties?.record_superseded_by) {
      continue;
    }
    const info = computeFeatureBboxAndCentroid(f.geometry);
    if (!info) continue;
    if (info.bbox[0] < zonesMinLng) zonesMinLng = info.bbox[0];
    if (info.bbox[2] > zonesMaxLng) zonesMaxLng = info.bbox[2];
    if (info.bbox[1] < zonesMinLat) zonesMinLat = info.bbox[1];
    if (info.bbox[3] > zonesMaxLat) zonesMaxLat = info.bbox[3];
    indexedZones.push({
      zoneCode: String(f.properties?.zone_code || "").trim(),
      zoneLabel: String(f.properties?.zone_label || "").trim(),
      planningDistrict: String(f.properties?.planning_district || "").trim(),
      sheet: String(f.properties?.sheet || "").trim(),
      geometry: f.geometry,
      bbox: info.bbox,
      centroid: info.centroid,
    });
  }
  if (indexedZones.length > 0) break;
}

// Associate zones with wards (check each zone centroid against wards)
for (const z of indexedZones) {
  const [lng, lat] = z.centroid;
  for (const w of indexedWards) {
    if (pointInGeometry(lng, lat, w.geometry, w.bbox)) {
      if (!w.zonesPresent.has(z.zoneCode)) {
        w.zonesPresent.set(z.zoneCode, z.zoneLabel);
      }
      break;
    }
  }
}

function locatePointContext(lng, lat) {
  let matchedWard = null;
  for (const w of indexedWards) {
    if (pointInGeometry(lng, lat, w.geometry, w.bbox)) {
      matchedWard = w;
      break;
    }
  }
  let matchedCorp = null;
  if (matchedWard) {
    matchedCorp =
      corpMetaList.find((c) => c.id === matchedWard.corporationId) || null;
  } else {
    for (const c of corpMetaList) {
      if (pointInGeometry(lng, lat, c.geometry, c.bbox)) {
        matchedCorp = c;
        break;
      }
    }
  }

  let matchedPd = null;
  for (const pd of indexedPlanningDistricts) {
    if (pointInGeometry(lng, lat, pd.geometry, pd.bbox)) {
      matchedPd = pd.label;
      break;
    }
  }

  let matchedZone = null;
  for (const z of indexedZones) {
    if (pointInGeometry(lng, lat, z.geometry, z.bbox)) {
      matchedZone = z;
      break;
    }
  }

  if (!matchedPd && matchedZone?.planningDistrict) {
    matchedPd = matchedZone.planningDistrict;
  }

  return {
    corporationId: matchedCorp?.id || parentJur.id,
    corporationName: matchedCorp?.name || parentJur.name,
    wardNumber: matchedWard?.wardNumber || null,
    wardName: matchedWard?.wardName || null,
    planningDistrict: matchedPd || null,
    zoneCode: matchedZone?.zoneCode || null,
    zoneLabel: matchedZone?.zoneLabel || null,
  };
}

const placeEntries = [];
let nextSeq = 1;

// 1. Add all 5 Corporations
for (const c of corpMetaList) {
  const ctx = locatePointContext(c.centroid[0], c.centroid[1]);
  placeEntries.push({
    id: `corp-${c.id}`,
    name: c.name,
    kind: "corporation",
    categoryLabel: "City Corporation",
    lat: c.centroid[1],
    lng: c.centroid[0],
    corporationId: c.id,
    corporationName: c.name,
    wardNumber: ctx.wardNumber,
    wardName: ctx.wardName,
    planningDistrict: ctx.planningDistrict,
    zoneCode: ctx.zoneCode,
    zoneLabel: ctx.zoneLabel,
    zonesPresent: [],
  });
}

// 2. Add all 369 Wards
for (const w of indexedWards) {
  const ctx = locatePointContext(w.centroid[0], w.centroid[1]);
  const zonesList = Array.from(w.zonesPresent.entries()).map(
    ([zoneCode, zoneLabel]) => ({ zoneCode, zoneLabel })
  );
  const firstZone = zonesList[0] || null;
  placeEntries.push({
    id: `ward-${w.corporationId}-${w.wardNumber}`,
    name: `Ward ${w.wardNumber} · ${w.wardName}`,
    kind: "ward",
    categoryLabel: "Ward",
    lat: w.centroid[1],
    lng: w.centroid[0],
    corporationId: w.corporationId,
    corporationName: w.corporationName,
    wardNumber: w.wardNumber,
    wardName: w.wardName,
    planningDistrict: ctx.planningDistrict,
    zoneCode: ctx.zoneCode || firstZone?.zoneCode || null,
    zoneLabel: ctx.zoneLabel || firstZone?.zoneLabel || null,
    zonesPresent: zonesList,
  });
}

// 3. Extract localities, neighbourhoods, major roads, and landmarks from basemap.pmtiles
const ALLOWED_POI_KINDS = new Set([
  "station",
  "train_station",
  "subway_entrance",
  "bus_station",
  "hospital",
  "college",
  "university",
  "library",
  "townhall",
  "courthouse",
  "park",
  "stadium",
  "marketplace",
  "museum",
  "aerodrome",
]);

if (fs.existsSync(pmtilesPath)) {
  const source = new LocalFileSource(pmtilesPath);
  const pm = new PMTiles(source);
  const header = await pm.getHeader();
  const z = Math.min(14, header.maxZoom || 14);
  const xMin = lon2tile(header.minLon, z);
  const xMax = lon2tile(header.maxLon, z);
  const yMin = lat2tile(header.maxLat, z);
  const yMax = lat2tile(header.minLat, z);

  const seenPlaceKey = new Map();

  for (let x = xMin; x <= xMax; x++) {
    for (let y = yMin; y <= yMax; y++) {
      const tileResp = await pm.getZxy(z, x, y);
      if (!tileResp || !tileResp.data) continue;
      const vt = new VectorTile(new PbfReader(new Uint8Array(tileResp.data)));

      for (const layerName of ["places", "roads", "pois", "landuse"]) {
        const layer = vt.layers[layerName];
        if (!layer) continue;

        for (let i = 0; i < layer.length; i++) {
          const feat = layer.feature(i);
          const props = feat.properties || {};
          const rawName = String(props["name:en"] || props.name || "").trim();
          if (!rawName || rawName.length < 3 || rawName.length > 70) continue;
          if (/^[0-9\W]+$/.test(rawName)) continue;

          let entryKind = "place";
          let categoryLabel = "Locality";
          let priority = 2;

          if (layerName === "places") {
            const kd = String(props.kind_detail || props.kind || "");
            entryKind = "locality";
            categoryLabel =
              kd === "neighbourhood" || kd === "suburb" || kd === "quarter"
                ? "Neighbourhood"
                : "Locality";
            priority = 1;
          } else if (layerName === "roads") {
            const rKind = String(props.kind || "");
            const rDetail = String(props.kind_detail || "");
            if (rKind !== "highway" && rKind !== "major_road") continue;
            if (
              rKind === "major_road" &&
              rDetail &&
              !["trunk", "primary", "secondary"].includes(rDetail)
            ) {
              continue;
            }
            entryKind = "road";
            categoryLabel = "Major road";
            priority = 3;
          } else if (layerName === "pois" || layerName === "landuse") {
            const pKind = String(props.kind || props.kind_detail || "");
            if (!ALLOWED_POI_KINDS.has(pKind)) continue;
            entryKind = "landmark";
            categoryLabel = "Landmark";
            priority = 4;
          }

          const dedupKey = `${entryKind}:${rawName.toLowerCase()}`;
          if (seenPlaceKey.has(dedupKey)) {
            const prev = seenPlaceKey.get(dedupKey);
            // Prefer entries that fall inside a mapped land-use zone
            if (prev.zoneCode) continue;
          }

          const geo = feat.toGeoJSON(x, y, z);
          const coord = extractCoordFromGeoJSON(geo.geometry);
          if (!coord) continue;
          const [lng, lat] = coord;
          const ctx = locatePointContext(lng, lat);
          // Only include features within or near the city bounds
          if (!ctx.wardNumber && !ctx.zoneCode) continue;

          seenPlaceKey.set(dedupKey, {
            id: `pm-${nextSeq++}`,
            name: rawName,
            kind: entryKind,
            categoryLabel,
            priority,
            lat: Number(lat.toFixed(5)),
            lng: Number(lng.toFixed(5)),
            corporationId: ctx.corporationId,
            corporationName: ctx.corporationName,
            wardNumber: ctx.wardNumber,
            wardName: ctx.wardName,
            planningDistrict: ctx.planningDistrict,
            zoneCode: ctx.zoneCode,
            zoneLabel: ctx.zoneLabel,
          });
        }
      }
    }
  }
  source.close();

  const extractedList = Array.from(seenPlaceKey.values());
  extractedList.sort((a, b) => {
    const aHasZone = a.zoneCode ? 0 : 1;
    const bHasZone = b.zoneCode ? 0 : 1;
    if (aHasZone !== bHasZone) return aHasZone - bHasZone;
    if (a.priority !== b.priority) return a.priority - b.priority;
    return a.name.localeCompare(b.name);
  });

  // Cap at 1,800 PMTiles features (plus 369 wards + 5 corporations) so gzipped size stays ~80-140 KB (well under 300 KB)
  for (const item of extractedList.slice(0, 1800)) {
    delete item.priority;
    placeEntries.push(item);
  }
}

const payload = {
  schema_version: "1.4",
  generated_from: path.basename(pmtilesPath),
  count: placeEntries.length,
  places: placeEntries,
};

const jsonString = JSON.stringify(payload);
const gzipBytes = zlib.gzipSync(Buffer.from(jsonString, "utf8")).byteLength;
if (gzipBytes > 300 * 1024) {
  throw new Error(
    `place-index.json compressed size ${(gzipBytes / 1024).toFixed(1)} KB exceeds 300 KB limit`
  );
}

// Write uncovered-area.geojson for Layer 3 (diagonal hatch + "Land-use data not yet available" label)
function buildUncoveredGeoJSON(boundaryFc) {
  const features = [];
  const hasHole =
    Number.isFinite(zonesMinLng) &&
    Number.isFinite(zonesMaxLng) &&
    zonesMaxLng > zonesMinLng;
  const holeRing = hasHole
    ? [
        [zonesMinLng, zonesMinLat],
        [zonesMinLng, zonesMaxLat],
        [zonesMaxLng, zonesMaxLat],
        [zonesMaxLng, zonesMinLat],
        [zonesMinLng, zonesMinLat],
      ]
    : null;

  for (const bf of boundaryFc?.features || []) {
    const rings = getRings(bf.geometry);
    for (const outer of rings) {
      const coords = holeRing ? [outer, holeRing] : [outer];
      features.push({
        type: "Feature",
        properties: {
          kind: "uncovered_hatch",
          label: "Land-use data not yet available",
        },
        geometry: {
          type: "Polygon",
          coordinates: coords,
        },
      });
    }
    const info = computeFeatureBboxAndCentroid(bf.geometry);
    if (info) {
      features.push({
        type: "Feature",
        properties: {
          kind: "uncovered_label",
          label: "Land-use data not yet available",
        },
        geometry: {
          type: "Point",
          coordinates: info.centroid,
        },
      });
    }
  }
  return {
    type: "FeatureCollection",
    features,
  };
}

for (const jur of [parentJur, ...childJurs]) {
  const jurDir = path.join(publicDataDir, jur.id);
  fs.mkdirSync(jurDir, { recursive: true });
  fs.writeFileSync(path.join(jurDir, "place-index.json"), jsonString, "utf8");

  const bFc = readJsonIfExists(
    path.join(jurDir, activeVersion, "boundary.geojson")
  );
  if (bFc) {
    const uncov = buildUncoveredGeoJSON(bFc);
    fs.writeFileSync(
      path.join(jurDir, "uncovered-area.geojson"),
      JSON.stringify(uncov),
      "utf8"
    );
  }
}

console.log(
  `[build_place_index] Wrote place-index.json (${placeEntries.length} entries, ${(Buffer.byteLength(jsonString, "utf8") / 1024).toFixed(1)} KB raw, ${(gzipBytes / 1024).toFixed(1)} KB gzipped <= 300 KB) across ${1 + childJurs.length} jurisdictions.`
);
