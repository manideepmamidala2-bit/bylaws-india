"use client";

import React, { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import type {
  GenericFeatureCollection,
  GenericGeoJSONFeature,
  GeoLayerEntry,
  ZoneFeature,
  ZoneGeometry,
} from "@/lib/data";

const DynamicLeafletCanvas = dynamic(() => import("./LeafletCanvas"), {
  ssr: false,
});

interface ZoneMapProps {
  zones: ZoneFeature[];
  selectedZoneCode: string | null;
  onSelectZone: (zoneCode: string) => void;
  boundary?: GenericFeatureCollection | null;
  gbaZones?: GenericFeatureCollection | null;
  wards?: GenericFeatureCollection | null;
  planningDistricts?: GenericFeatureCollection | null;
  overlays?: GenericFeatureCollection | null;
  geoLayers?: GeoLayerEntry[];
  showDrafts?: boolean;
  onToggleDrafts?: (next: boolean) => void;
}

interface Bounds {
  minLon: number;
  maxLon: number;
  minLat: number;
  maxLat: number;
}

function collectPointsFromGeometry(geom: ZoneGeometry): Array<[number, number]> {
  const pts: Array<[number, number]> = [];
  if (geom.type === "Polygon") {
    for (const ring of geom.coordinates) {
      for (const pt of ring) {
        pts.push([Number(pt[0]), Number(pt[1])]);
      }
    }
  } else if (geom.type === "MultiPolygon") {
    for (const poly of geom.coordinates) {
      for (const ring of poly) {
        for (const pt of ring) {
          pts.push([Number(pt[0]), Number(pt[1])]);
        }
      }
    }
  }
  return pts;
}

function computeBounds(
  zones: ZoneFeature[],
  boundary?: GenericFeatureCollection | null
): Bounds {
  const allPts: Array<[number, number]> = [];
  for (const b of boundary?.features ?? []) {
    if (b.geometry) {
      allPts.push(...collectPointsFromGeometry(b.geometry));
    }
  }
  for (const z of zones) {
    if (z.geometry) {
      allPts.push(...collectPointsFromGeometry(z.geometry));
    }
  }
  if (allPts.length === 0) {
    return { minLon: 0, maxLon: 1, minLat: 0, maxLat: 1 };
  }
  let minLon = Infinity;
  let maxLon = -Infinity;
  let minLat = Infinity;
  let maxLat = -Infinity;
  for (const [lon, lat] of allPts) {
    if (lon < minLon) minLon = lon;
    if (lon > maxLon) maxLon = lon;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
  }
  const padLon = Math.max(0.002, (maxLon - minLon) * 0.08);
  const padLat = Math.max(0.002, (maxLat - minLat) * 0.08);
  return {
    minLon: minLon - padLon,
    maxLon: maxLon + padLon,
    minLat: minLat - padLat,
    maxLat: maxLat + padLat,
  };
}

function projectPoint(
  lon: number,
  lat: number,
  bounds: Bounds,
  width = 830,
  height = 460
): [number, number] {
  const spanLon = Math.max(1e-6, bounds.maxLon - bounds.minLon);
  const spanLat = Math.max(1e-6, bounds.maxLat - bounds.minLat);
  const x = ((lon - bounds.minLon) / spanLon) * width;
  const y = ((bounds.maxLat - lat) / spanLat) * height;
  return [Math.round(x * 10) / 10, Math.round(y * 10) / 10];
}

function geometryToSvgPath(geom: ZoneGeometry, bounds: Bounds): string {
  const rings =
    geom.type === "Polygon"
      ? geom.coordinates
      : geom.coordinates.flatMap((poly) => poly);

  const dParts: string[] = [];
  for (const ring of rings) {
    if (ring.length === 0) continue;
    const projected = ring.map((pt) =>
      projectPoint(Number(pt[0]), Number(pt[1]), bounds)
    );
    const cmds = projected.map(
      ([x, y], idx) => `${idx === 0 ? "M" : "L"}${x},${y}`
    );
    dParts.push(`${cmds.join(" ")} Z`);
  }
  return dParts.join(" ");
}

function computeCentroid(
  geom: ZoneGeometry,
  bounds: Bounds
): [number, number] {
  const pts = collectPointsFromGeometry(geom);
  if (pts.length === 0) {
    return [415, 230];
  }
  let sumLon = 0;
  let sumLat = 0;
  for (const [lon, lat] of pts) {
    sumLon += lon;
    sumLat += lat;
  }
  return projectPoint(sumLon / pts.length, sumLat / pts.length, bounds);
}

export function ZoneMap({
  zones,
  selectedZoneCode,
  onSelectZone,
  boundary = null,
  gbaZones = null,
  wards = null,
  planningDistricts = null,
  overlays = null,
  geoLayers = [],
  showDrafts = false,
  onToggleDrafts,
}: ZoneMapProps) {
  const [showBoundaryLayer, setShowBoundaryLayer] = useState(true);
  const [showGbaZonesLayer, setShowGbaZonesLayer] = useState(false);
  const [showWardsLayer, setShowWardsLayer] = useState(false);
  const [showPlanningDistrictsLayer, setShowPlanningDistrictsLayer] =
    useState(true);
  const [showZonesLayer, setShowZonesLayer] = useState(true);
  const [showOverlaysLayer, setShowOverlaysLayer] = useState(true);
  const [useLeafletTiles, setUseLeafletTiles] = useState(false);

  const activeZones = useMemo(
    () =>
      zones.filter(
        (feature) =>
          !feature.properties.superseded_by &&
          !feature.properties.record_superseded_by
      ),
    [zones]
  );

  const bounds = useMemo(
    () => computeBounds(activeZones, boundary),
    [activeZones, boundary]
  );

  const mapCenter: [number, number] = useMemo(
    () => [
      (bounds.minLat + bounds.maxLat) * 0.5,
      (bounds.minLon + bounds.maxLon) * 0.5,
    ],
    [bounds]
  );

  const legendItems = useMemo(() => {
    const byCode = new Map<
      string,
      { zone_code: string; zone_label: string; maxVersion: number }
    >();
    for (const feat of activeZones) {
      const code = feat.properties.zone_code;
      const ver =
        feat.properties.record_version ??
        (feat.properties.record_id?.includes("@v")
          ? Number(feat.properties.record_id.split("@v")[1]) || 1
          : 1);
      const existing = byCode.get(code);
      if (!existing || ver > existing.maxVersion) {
        byCode.set(code, {
          zone_code: code,
          zone_label: feat.properties.zone_label,
          maxVersion: ver,
        });
      }
    }
    return Array.from(byCode.values());
  }, [activeZones]);

  const referenceLayers = useMemo(
    () => geoLayers.filter((l) => l.kind === "reference" && l.external_url),
    [geoLayers]
  );

  return (
    <section
      aria-label="Zoning map"
      className="flex h-full flex-col justify-between bg-[#efeee8]"
    >
      {/* Layer Toggles & Map Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#c8ccc0] bg-[#f5f3ed] px-5 py-2.5">
        <div
          role="group"
          aria-label="Map layer toggles"
          className="flex flex-wrap items-center gap-1.5"
        >
          <button
            type="button"
            onClick={() => setShowZonesLayer((v) => !v)}
            aria-pressed={showZonesLayer}
            className={`dg-pill ${showZonesLayer ? "dg-pill-active" : ""}`}
          >
            Master Plan Zones ({activeZones.length})
          </button>
          {boundary && boundary.features.length > 0 && (
            <button
              type="button"
              onClick={() => setShowBoundaryLayer((v) => !v)}
              aria-pressed={showBoundaryLayer}
              className={`dg-pill ${showBoundaryLayer ? "dg-pill-active" : ""}`}
            >
              Corporation
            </button>
          )}
          {gbaZones && gbaZones.features.length > 0 && (
            <button
              type="button"
              onClick={() => setShowGbaZonesLayer((v) => !v)}
              aria-pressed={showGbaZonesLayer}
              className={`dg-pill ${showGbaZonesLayer ? "dg-pill-active" : ""}`}
            >
              Admin Zones ({gbaZones.features.length})
            </button>
          )}
          {wards && wards.features.length > 0 && (
            <button
              type="button"
              onClick={() => setShowWardsLayer((v) => !v)}
              aria-pressed={showWardsLayer}
              className={`dg-pill ${showWardsLayer ? "dg-pill-active" : ""}`}
            >
              Wards ({wards.features.length})
            </button>
          )}
          {planningDistricts && planningDistricts.features.length > 0 && (
            <button
              type="button"
              onClick={() => setShowPlanningDistrictsLayer((v) => !v)}
              aria-pressed={showPlanningDistrictsLayer}
              className={`dg-pill ${showPlanningDistrictsLayer ? "dg-pill-active" : ""}`}
            >
              Planning Districts ({planningDistricts.features.length})
            </button>
          )}
          {overlays && overlays.features.length > 0 && (
            <button
              type="button"
              onClick={() => setShowOverlaysLayer((v) => !v)}
              aria-pressed={showOverlaysLayer}
              className={`dg-pill ${showOverlaysLayer ? "dg-pill-active" : ""}`}
            >
              Overlays ({overlays.features.length})
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {onToggleDrafts && (
            <button
              type="button"
              onClick={() => onToggleDrafts(!showDrafts)}
              aria-pressed={showDrafts}
              className={`dg-pill ${showDrafts ? "dg-pill-active" : ""}`}
            >
              {showDrafts ? "Drafts on" : "Drafts off"}
            </button>
          )}
          <button
            type="button"
            onClick={() => setUseLeafletTiles((v) => !v)}
            aria-pressed={useLeafletTiles}
            className={`dg-pill ${useLeafletTiles ? "dg-pill-active" : ""}`}
          >
            {useLeafletTiles ? "Leaflet Street Tiles" : "Vector Sheet View"}
          </button>
        </div>
      </div>

      {/* Main Map Viewport */}
      <div className="relative min-h-[430px] flex-1 bg-[#efeee8]">
        {activeZones.length === 0 ? (
          <div className="flex h-full items-center justify-center p-8 text-sm text-[#5b5e56]">
            No zone polygons loaded for this jurisdiction release.
          </div>
        ) : useLeafletTiles ? (
          <DynamicLeafletCanvas
            zones={activeZones}
            boundary={showBoundaryLayer ? boundary : null}
            overlays={showOverlaysLayer ? overlays : null}
            selectedZoneCode={selectedZoneCode}
            onSelectZone={onSelectZone}
            center={mapCenter}
          />
        ) : (
          <svg
            viewBox="0 0 830 460"
            preserveAspectRatio="xMidYMid meet"
            role="img"
            aria-label="Interactive master plan zoning and boundary map"
            className="h-full w-full"
          >
            <defs>
              <pattern
                id="dg-hatch"
                width="8"
                height="8"
                patternUnits="userSpaceOnUse"
                patternTransform="rotate(45)"
              >
                <line
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="8"
                  stroke="#5b5e56"
                  strokeWidth="1.2"
                />
              </pattern>
            </defs>

            {/* Reference Coordinate Grid Lines */}
            <g stroke="#c8ccc0" strokeWidth="0.75">
              <line x1="0" y1="65" x2="830" y2="65" />
              <line x1="0" y1="230" x2="830" y2="230" />
              <line x1="0" y1="395" x2="830" y2="395" />
              <line x1="165" y1="0" x2="165" y2="460" />
              <line x1="415" y1="0" x2="415" y2="460" />
              <line x1="665" y1="0" x2="665" y2="460" />
            </g>

            {/* Master Plan Land-Use Zones */}
            {showZonesLayer &&
              activeZones.map((feat, idx) => {
                const { zone_id, record_id, zone_code, zone_label } =
                  feat.properties;
                const isSelected = selectedZoneCode === zone_code;
                const d = geometryToSvgPath(feat.geometry, bounds);
                const [cx, cy] = computeCentroid(feat.geometry, bounds);
                return (
                  <g
                    key={record_id ?? zone_id}
                    onClick={() => onSelectZone(zone_code)}
                    style={{ cursor: "pointer" }}
                  >
                    <path
                      d={d}
                      fill={
                        isSelected
                          ? "#ff6b52"
                          : idx % 2 === 0
                            ? "#f5f3ed"
                            : "url(#dg-hatch)"
                      }
                      fillOpacity={isSelected ? 0.28 : 0.85}
                      stroke={isSelected ? "#ff6b52" : "#080909"}
                      strokeWidth={isSelected ? 2.4 : 1.0}
                    >
                      <title>{`${zone_code}: ${zone_label}`}</title>
                    </path>
                    <text
                      x={cx}
                      y={cy}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontFamily="var(--font-mono)"
                      fontSize="11"
                      fontWeight={isSelected ? "600" : "500"}
                      fill="#080909"
                    >
                      {zone_code}
                    </text>
                  </g>
                );
              })}

            {/* Planning Districts Layer */}
            {showPlanningDistrictsLayer &&
              (planningDistricts?.features ?? []).map(
                (pd: GenericGeoJSONFeature, idx: number) => {
                  const d = geometryToSvgPath(pd.geometry, bounds);
                  const pdCode = String(
                    pd.properties?.district_code ?? `PD-${idx + 1}`
                  );
                  return (
                    <path
                      key={`pd-${pdCode}-${idx}`}
                      d={d}
                      fill="none"
                      stroke="#5b5e56"
                      strokeWidth="1.2"
                      strokeDasharray="4 3"
                    >
                      <title>{`Planning District ${pdCode}`}</title>
                    </path>
                  );
                }
              )}

            {/* Wards Layer */}
            {showWardsLayer &&
              (wards?.features ?? []).map(
                (w: GenericGeoJSONFeature, idx: number) => {
                  const d = geometryToSvgPath(w.geometry, bounds);
                  const wNo = String(w.properties?.ward_no ?? idx + 1);
                  return (
                    <path
                      key={`ward-${wNo}-${idx}`}
                      d={d}
                      fill="none"
                      stroke="#5b5e56"
                      strokeWidth="0.9"
                      strokeDasharray="2 2"
                    >
                      <title>{`Ward ${wNo}`}</title>
                    </path>
                  );
                }
              )}

            {/* GBA Zones Layer */}
            {showGbaZonesLayer &&
              (gbaZones?.features ?? []).map(
                (gz: GenericGeoJSONFeature, idx: number) => {
                  const d = geometryToSvgPath(gz.geometry, bounds);
                  return (
                    <path
                      key={`gba-zone-${idx}`}
                      d={d}
                      fill="none"
                      stroke="#080909"
                      strokeWidth="1.5"
                      strokeDasharray="8 4"
                    />
                  );
                }
              )}

            {/* Derived Overlays (Rule R14) */}
            {showOverlaysLayer &&
              (overlays?.features ?? []).map(
                (ov: GenericGeoJSONFeature, idx: number) => {
                  const d = geometryToSvgPath(ov.geometry, bounds);
                  const ovId = String(
                    ov.properties?.overlay_id ?? `overlay-${idx}`
                  );
                  const isSelected = selectedZoneCode === ovId;
                  return (
                    <path
                      key={`overlay-${ovId}-${idx}`}
                      d={d}
                      fill={isSelected ? "#ff6b52" : "#080909"}
                      fillOpacity={isSelected ? 0.35 : 0.2}
                      stroke={isSelected ? "#ff6b52" : "#080909"}
                      strokeWidth="2"
                      strokeDasharray="3 2"
                      onClick={() => onSelectZone(ovId)}
                      style={{ cursor: "pointer" }}
                    >
                      <title>{`${ovId} (Derived, Approximate)`}</title>
                    </path>
                  );
                }
              )}

            {/* Official Corporation Boundary */}
            {showBoundaryLayer &&
              (boundary?.features ?? []).map(
                (b: GenericGeoJSONFeature, idx: number) => {
                  const d = geometryToSvgPath(b.geometry, bounds);
                  return (
                    <path
                      key={`boundary-${idx}`}
                      d={d}
                      fill="none"
                      stroke="#080909"
                      strokeWidth="1.8"
                      strokeDasharray="6 4"
                    />
                  );
                }
              )}
          </svg>
        )}
      </div>

      {/* Interactive Legend & Keyboard-Accessible Zone Selector Bar */}
      <div className="border-t border-[#080909] bg-[#f5f3ed] px-5 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="dg-mono text-[10.5px] text-[#080909]">
            Legend · Select any zone code or overlay to inspect applicable clauses
          </span>
          {selectedZoneCode && (
            <button
              type="button"
              onClick={() => onSelectZone("")}
              className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-[#080909] underline"
            >
              Clear selection ({selectedZoneCode})
            </button>
          )}
        </div>

        <div className="mt-2.5 flex flex-wrap gap-2">
          {legendItems.map((item) => {
            const isSelected = selectedZoneCode === item.zone_code;
            return (
              <button
                key={item.zone_code}
                type="button"
                onClick={() => onSelectZone(item.zone_code)}
                aria-pressed={isSelected}
                className={`flex items-center gap-2 border px-2.5 py-1.5 text-left text-xs ${
                  isSelected
                    ? "border-[#ff6b52] bg-[#ff6b52]/20 font-semibold text-[#080909]"
                    : "border-[#080909] bg-[#f5f3ed] text-[#080909] hover:bg-[#efeee8]"
                }`}
              >
                <span
                  aria-hidden="true"
                  className="inline-block h-3 w-3 border border-[#080909]"
                  style={{
                    backgroundColor: isSelected ? "#ff6b52" : "#efeee8",
                  }}
                />
                <span className="font-mono text-[11px] font-medium">
                  {item.zone_code}
                </span>
                <span className="text-[#5b5e56]">
                  {item.zone_label}
                  {item.maxVersion > 1 ? ` · v${item.maxVersion}` : ""}
                  {isSelected ? " · selected" : ""}
                </span>
              </button>
            );
          })}

          {overlays && overlays.features.length > 0 && (
            <button
              type="button"
              onClick={() => {
                const ovId = String(
                  overlays.features[0]?.properties?.overlay_id ?? ""
                );
                if (ovId) onSelectZone(ovId);
              }}
              aria-pressed={
                selectedZoneCode ===
                String(overlays.features[0]?.properties?.overlay_id ?? "")
              }
              className="flex items-center gap-2 border border-dashed border-[#080909] bg-[#efeee8] px-2.5 py-1.5 text-left text-xs text-[#080909]"
            >
              <span className="dg-accent-dot" />
              <span className="font-mono text-[11px]">
                {String(
                  overlays.features[0]?.properties?.overlay_id ?? "Overlay"
                )}
              </span>
              <span className="text-[#5b5e56]">
                Derived 11 m Influence Zone (Approximate)
              </span>
            </button>
          )}
        </div>

        {/* External Reference Layers & Base Map Attribution */}
        <footer className="mt-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-[#c8ccc0] pt-2 font-mono text-[10px] uppercase tracking-[0.12em] text-[#5b5e56]">
          <span>Base map attribution: © OpenStreetMap contributors (ODbL)</span>
          <div className="flex flex-wrap gap-4">
            {referenceLayers.map((refLayer) => (
              <a
                key={refLayer.layer_id}
                href={refLayer.external_url ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#080909] underline underline-offset-2"
              >
                {refLayer.title} ↗
              </a>
            ))}
          </div>
        </footer>
      </div>
    </section>
  );
}
