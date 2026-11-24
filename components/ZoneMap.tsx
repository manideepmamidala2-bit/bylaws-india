"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import { Protocol } from "pmtiles";
import type {
  GenericFeatureCollection,
  GenericGeoJSONFeature,
  GeoLayerEntry,
  ZoneFeature,
  ZoneGeometry,
} from "@/lib/data";
import { buildDg2nMapStyle } from "@/lib/map-style";

interface ZoneMapProps {
  jurisdictionId?: string;
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
  boundary?: GenericFeatureCollection | null,
  wards?: GenericFeatureCollection | null
): Bounds {
  const allPts: Array<[number, number]> = [];
  for (const b of boundary?.features ?? []) {
    if (b.geometry) {
      allPts.push(...collectPointsFromGeometry(b.geometry));
    }
  }
  for (const w of wards?.features ?? []) {
    if (w.geometry) {
      allPts.push(...collectPointsFromGeometry(w.geometry));
    }
  }
  for (const z of zones) {
    if (z.geometry) {
      allPts.push(...collectPointsFromGeometry(z.geometry));
    }
  }
  if (allPts.length === 0) {
    return {
      minLon: 77.489,
      maxLon: 77.703,
      minLat: 12.833,
      maxLat: 12.952,
    };
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
  const padLon = Math.max(0.002, (maxLon - minLon) * 0.05);
  const padLat = Math.max(0.002, (maxLat - minLat) * 0.05);
  return {
    minLon: minLon - padLon,
    maxLon: maxLon + padLon,
    minLat: minLat - padLat,
    maxLat: maxLat + padLat,
  };
}

let pmtilesProtocolRegistered = false;

export function ZoneMap({
  jurisdictionId = "",
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
  // On by default: corporation and wards (06-real-map-foundation.md §3)
  const [showBoundaryLayer, setShowBoundaryLayer] = useState(true);
  const [showGbaZonesLayer, setShowGbaZonesLayer] = useState(false);
  const [showWardsLayer, setShowWardsLayer] = useState(true);
  const [showPlanningDistrictsLayer, setShowPlanningDistrictsLayer] =
    useState(true);
  const [showZonesLayer, setShowZonesLayer] = useState(true);
  const [showOverlaysLayer, setShowOverlaysLayer] = useState(true);

  const sortedWards = useMemo(() => {
    const feats = [...(wards?.features ?? [])];
    feats.sort((a, b) => {
      const aNo = Number(a.properties?.ward_id ?? a.properties?.ward_no ?? 0);
      const bNo = Number(b.properties?.ward_id ?? b.properties?.ward_no ?? 0);
      return aNo - bNo;
    });
    return feats;
  }, [wards]);

  const [selectedWardId, setSelectedWardId] = useState<string | null>(
    sortedWards[0]
      ? String(
          sortedWards[0].properties?.ward_id ??
            sortedWards[0].properties?.ward_no ??
            "1"
        )
      : null
  );

  const selectedWardFeature: GenericGeoJSONFeature | null = useMemo(() => {
    if (!selectedWardId) return null;
    return (
      sortedWards.find(
        (w) =>
          String(w.properties?.ward_id ?? w.properties?.ward_no ?? "") ===
          selectedWardId
      ) ?? null
    );
  }, [sortedWards, selectedWardId]);

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
    () => computeBounds(activeZones, boundary, wards),
    [activeZones, boundary, wards]
  );

  const wardsLayerMeta = useMemo(
    () => geoLayers.find((l) => l.layer_id === "wards"),
    [geoLayers]
  );
  const wardsSourceHref =
    wardsLayerMeta?.external_url ||
    (wardsLayerMeta?.source?.startsWith("http")
      ? wardsLayerMeta.source
      : "https://gba.karnataka.gov.in/gba-corporations-delimitation-2025/index.html");

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
      if (!existing) {
        byCode.set(code, {
          zone_code: code,
          zone_label: feat.properties.zone_label,
          maxVersion: ver,
        });
      } else if (ver > existing.maxVersion) {
        existing.maxVersion = ver;
      }
    }
    return Array.from(byCode.values());
  }, [activeZones]);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<maplibregl.Map | null>(null);

  const pmtilesUrl =
    process.env.NEXT_PUBLIC_PMTILES_URL?.trim() ||
    `/data/${jurisdictionId}/basemap.pmtiles`;

  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;

    // Guard headless jsdom environments where WebGL context is not implemented
    if (
      typeof window === "undefined" ||
      typeof navigator !== "undefined" && /jsdom/i.test(navigator.userAgent)
    ) {
      return;
    }

    try {
      if (!pmtilesProtocolRegistered) {
        const protocol = new Protocol();
        maplibregl.addProtocol("pmtiles", protocol.tile);
        pmtilesProtocolRegistered = true;
      }

      const resolvedUrl =
        pmtilesUrl.startsWith("http://") || pmtilesUrl.startsWith("https://")
          ? pmtilesUrl
          : `${window.location.origin}${pmtilesUrl}`;

      const map = new maplibregl.Map({
        container,
        style: buildDg2nMapStyle(resolvedUrl),
        bounds: [bounds.minLon, bounds.minLat, bounds.maxLon, bounds.maxLat],
        fitBoundsOptions: { padding: 24 },
        attributionControl: false,
        keyboard: true,
        touchZoomRotate: true,
        dragPan: true,
      });

      mapInstanceRef.current = map;

      map.on("load", () => {
        if (boundary && boundary.features.length > 0) {
          map.addSource("gba-corporation", {
            type: "geojson",
            data: boundary as unknown as GeoJSON.FeatureCollection,
          });
          map.addLayer({
            id: "gba-corporation-line",
            type: "line",
            source: "gba-corporation",
            layout: {
              visibility: showBoundaryLayer ? "visible" : "none",
            },
            paint: {
              "line-color": "#080909",
              "line-width": 2.4,
            },
          });
        }

        if (gbaZones && gbaZones.features.length > 0) {
          map.addSource("gba-zones", {
            type: "geojson",
            data: gbaZones as unknown as GeoJSON.FeatureCollection,
          });
          map.addLayer({
            id: "gba-zones-line",
            type: "line",
            source: "gba-zones",
            layout: {
              visibility: showGbaZonesLayer ? "visible" : "none",
            },
            paint: {
              "line-color": "#080909",
              "line-dasharray": [4, 2],
              "line-width": 1.8,
            },
          });
        }

        if (wards && wards.features.length > 0) {
          map.addSource("gba-wards", {
            type: "geojson",
            data: wards as unknown as GeoJSON.FeatureCollection,
          });
          map.addLayer({
            id: "gba-wards-fill",
            type: "fill",
            source: "gba-wards",
            layout: {
              visibility: showWardsLayer ? "visible" : "none",
            },
            paint: {
              "fill-color": "#efeee8",
              "fill-opacity": 0.28,
            },
          });
          map.addLayer({
            id: "gba-wards-line",
            type: "line",
            source: "gba-wards",
            layout: {
              visibility: showWardsLayer ? "visible" : "none",
            },
            paint: {
              "line-color": "#5b5e56",
              "line-width": 1.0,
            },
          });

          map.on(
            "click",
            "gba-wards-fill",
            (ev: maplibregl.MapLayerMouseEvent) => {
              const clicked = ev.features?.[0];
              const wid =
                clicked?.properties?.ward_id ?? clicked?.properties?.ward_no;
              if (wid !== undefined && wid !== null) {
                setSelectedWardId(String(wid));
              }
            }
          );
        }

        if (activeZones.length > 0) {
          map.addSource("master-plan-zones", {
            type: "geojson",
            data: {
              type: "FeatureCollection",
              features: activeZones,
            } as unknown as GeoJSON.FeatureCollection,
          });
          map.addLayer({
            id: "master-plan-zones-fill",
            type: "fill",
            source: "master-plan-zones",
            layout: {
              visibility: showZonesLayer ? "visible" : "none",
            },
            paint: {
              "fill-color": "#efeee8",
              "fill-opacity": 0.5,
            },
          });
          map.addLayer({
            id: "master-plan-zones-line",
            type: "line",
            source: "master-plan-zones",
            layout: {
              visibility: showZonesLayer ? "visible" : "none",
            },
            paint: {
              "line-color": "#080909",
              "line-width": 1.5,
            },
          });

          map.on(
            "click",
            "master-plan-zones-fill",
            (ev: maplibregl.MapLayerMouseEvent) => {
              const zCode = ev.features?.[0]?.properties?.zone_code;
              if (typeof zCode === "string" && zCode) {
                onSelectZone(zCode);
              }
            }
          );
        }
      });

      return () => {
        map.remove();
        mapInstanceRef.current = null;
      };
    } catch {
      return undefined;
    }
  }, [
    activeZones,
    boundary,
    bounds.maxLat,
    bounds.maxLon,
    bounds.minLat,
    bounds.minLon,
    gbaZones,
    onSelectZone,
    pmtilesUrl,
    showBoundaryLayer,
    showGbaZonesLayer,
    showWardsLayer,
    showZonesLayer,
    wards,
  ]);

  // Synchronize layer visibility toggles with MapLibre instance
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !map.isStyleLoaded()) return;
    const syncVis = (layerId: string, visible: boolean) => {
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(layerId, "visibility", visible ? "visible" : "none");
      }
    };
    syncVis("gba-corporation-line", showBoundaryLayer);
    syncVis("gba-zones-line", showGbaZonesLayer);
    syncVis("gba-wards-fill", showWardsLayer);
    syncVis("gba-wards-line", showWardsLayer);
    syncVis("master-plan-zones-fill", showZonesLayer);
    syncVis("master-plan-zones-line", showZonesLayer);
  }, [showBoundaryLayer, showGbaZonesLayer, showWardsLayer, showZonesLayer]);

  const handleZoomIn = () => {
    mapInstanceRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapInstanceRef.current?.zoomOut();
  };

  const handleResetView = () => {
    mapInstanceRef.current?.fitBounds(
      [bounds.minLon, bounds.minLat, bounds.maxLon, bounds.maxLat],
      { padding: 24 }
    );
  };

  return (
    <section
      aria-label="Interactive zoning and official boundary map"
      className="flex flex-col border-b border-[#080909] bg-[#f5f3ed] p-6"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="dg-mono">
            Vector Street Map &amp; Official GBA Boundaries (EPSG:4326)
          </div>
          <h2 className="mt-0.5 text-lg font-semibold text-[#080909]">
            Official Boundaries, Wards &amp; Land-Use Zones
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div
            role="group"
            aria-label="Keyboard map navigation controls"
            className="flex items-center gap-1"
          >
            <button
              type="button"
              onClick={handleZoomIn}
              aria-label="Zoom in map"
              className="border border-[#080909] bg-[#f5f3ed] px-2.5 py-1 font-mono text-xs text-[#080909] hover:bg-[#efeee8]"
            >
              +
            </button>
            <button
              type="button"
              onClick={handleZoomOut}
              aria-label="Zoom out map"
              className="border border-[#080909] bg-[#f5f3ed] px-2.5 py-1 font-mono text-xs text-[#080909] hover:bg-[#efeee8]"
            >
              -
            </button>
            <button
              type="button"
              onClick={handleResetView}
              className="border border-[#080909] bg-[#f5f3ed] px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-[#080909] hover:bg-[#efeee8]"
            >
              Reset View
            </button>
          </div>

          {onToggleDrafts && (
            <label className="flex cursor-pointer items-center gap-2 font-mono text-[11px] uppercase tracking-[0.12em] text-[#080909]">
              <input
                type="checkbox"
                checked={showDrafts}
                onChange={(e) => onToggleDrafts(e.target.checked)}
                className="h-3.5 w-3.5 accent-[#080909]"
              />
              <span>Include Drafts</span>
            </label>
          )}

          {selectedZoneCode && (
            <button
              type="button"
              onClick={() => onSelectZone("")}
              className="dg-pill"
            >
              Clear selection ({selectedZoneCode})
            </button>
          )}
        </div>
      </div>

      {/* Layer Toggles (Corporation and Wards on by default) */}
      <div
        role="group"
        aria-label="Map layer toggles"
        className="mb-3 flex flex-wrap items-center gap-4 border border-[#c8ccc0] bg-[#efeee8] px-3 py-2 font-mono text-[10.5px] uppercase tracking-[0.12em] text-[#080909]"
      >
        <span className="font-semibold">Layers:</span>
        <label className="flex cursor-pointer items-center gap-1.5">
          <input
            type="checkbox"
            checked={showBoundaryLayer}
            onChange={(e) => setShowBoundaryLayer(e.target.checked)}
            className="h-3 w-3 accent-[#080909]"
          />
          <span>Corporation ({boundary?.features?.length ?? 0})</span>
        </label>
        <label className="flex cursor-pointer items-center gap-1.5">
          <input
            type="checkbox"
            checked={showGbaZonesLayer}
            onChange={(e) => setShowGbaZonesLayer(e.target.checked)}
            className="h-3 w-3 accent-[#080909]"
          />
          <span>GBA Zones ({gbaZones?.features?.length ?? 0})</span>
        </label>
        <label className="flex cursor-pointer items-center gap-1.5">
          <input
            type="checkbox"
            checked={showWardsLayer}
            onChange={(e) => setShowWardsLayer(e.target.checked)}
            className="h-3 w-3 accent-[#080909]"
          />
          <span>Wards ({wards?.features?.length ?? 0})</span>
        </label>
        {planningDistricts && planningDistricts.features.length > 0 && (
          <label className="flex cursor-pointer items-center gap-1.5">
            <input
              type="checkbox"
              checked={showPlanningDistrictsLayer}
              onChange={(e) => setShowPlanningDistrictsLayer(e.target.checked)}
              className="h-3 w-3 accent-[#080909]"
            />
            <span>
              Planning Districts ({planningDistricts.features.length})
            </span>
          </label>
        )}
        {activeZones.length > 0 && (
          <label className="flex cursor-pointer items-center gap-1.5">
            <input
              type="checkbox"
              checked={showZonesLayer}
              onChange={(e) => setShowZonesLayer(e.target.checked)}
              className="h-3 w-3 accent-[#080909]"
            />
            <span>Master Plan Zones ({activeZones.length})</span>
          </label>
        )}
        {overlays && overlays.features.length > 0 && (
          <label className="flex cursor-pointer items-center gap-1.5">
            <input
              type="checkbox"
              checked={showOverlaysLayer}
              onChange={(e) => setShowOverlaysLayer(e.target.checked)}
              className="h-3 w-3 accent-[#080909]"
            />
            <span>Derived Overlays ({overlays.features.length})</span>
          </label>
        )}
      </div>

      {/* MapLibre GL JS + PMTiles Canvas */}
      <div className="relative w-full border border-[#080909] bg-[#efeee8]">
        <div
          ref={mapContainerRef}
          role="region"
          aria-label="MapLibre GL JS street map canvas"
          tabIndex={0}
          className="h-[460px] w-full focus:outline-2 focus:outline-[#080909]"
        />
        <div
          aria-label="Map attribution"
          className="flex flex-wrap items-center justify-between gap-2 border-t border-[#c8ccc0] bg-[#f5f3ed] px-3 py-1.5 font-mono text-[10px] text-[#5b5e56]"
        >
          <span>© OpenStreetMap contributors · Protomaps</span>
          <span>PMTiles v3 · dg2n Monochrome Basemap</span>
        </div>
      </div>

      {/* Plain line when no land-use zones are published yet (06-real-map-foundation.md §3) */}
      {activeZones.length === 0 && (
        <p
          role="status"
          className="dg-serif mt-3 border border-[#c8ccc0] bg-[#efeee8] px-3 py-2 text-sm text-[#171917]"
        >
          No master plan land-use zones are published yet; showing official
          corporation, GBA zone, and ward boundaries.
        </p>
      )}

      {/* Interactive Ward Inspector (06-real-map-foundation.md §3) */}
      {sortedWards.length > 0 && (
        <div
          role="region"
          aria-label="Official ward boundary inspector"
          className="mt-4 border border-[#080909] bg-[#efeee8] p-4"
        >
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="min-w-[260px] flex-1">
              <label
                htmlFor="ward-inspector-select"
                className="dg-mono block text-[10.5px] text-[#080909]"
              >
                Inspect Official Ward ({sortedWards.length} Wards in Corporation)
              </label>
              <select
                id="ward-inspector-select"
                value={selectedWardId ?? ""}
                onChange={(e) => setSelectedWardId(e.target.value || null)}
                className="mt-1.5 w-full border border-[#080909] bg-[#f5f3ed] px-3 py-1.5 font-mono text-xs text-[#080909]"
              >
                {sortedWards.map((w) => {
                  const wid = String(
                    w.properties?.ward_id ?? w.properties?.ward_no ?? ""
                  );
                  const wname = String(w.properties?.ward_name ?? "");
                  const zname = String(
                    w.properties?.zone_name ?? w.properties?.zone ?? ""
                  );
                  return (
                    <option key={wid} value={wid}>
                      Ward {wid} · {wname} ({zname})
                    </option>
                  );
                })}
              </select>
            </div>

            {wardsSourceHref && (
              <a
                href={wardsSourceHref}
                target="_blank"
                rel="noopener noreferrer"
                className="border border-[#080909] bg-[#f5f3ed] px-3 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.12em] text-[#080909] underline"
              >
                Official GBA Ward Delimitation Source ↗
              </a>
            )}
          </div>

          {selectedWardFeature && (
            <dl className="mt-3 grid grid-cols-1 gap-3 border-t border-[#c8ccc0] pt-3 text-xs sm:grid-cols-4">
              <div>
                <dt className="dg-mono text-[10px]">Ward No. &amp; Name</dt>
                <dd className="mt-0.5 font-semibold text-[#080909]">
                  Ward{" "}
                  {String(
                    selectedWardFeature.properties?.ward_id ??
                      selectedWardFeature.properties?.ward_no ??
                      ""
                  )}{" "}
                  · {String(selectedWardFeature.properties?.ward_name ?? "")}
                  {selectedWardFeature.properties?.ward_name_kn
                    ? ` (${String(selectedWardFeature.properties.ward_name_kn)})`
                    : ""}
                </dd>
              </div>
              <div>
                <dt className="dg-mono text-[10px]">GBA Zone</dt>
                <dd className="mt-0.5 font-mono text-[#080909]">
                  {String(selectedWardFeature.properties?.zone ?? "")}
                  {selectedWardFeature.properties?.zone_name
                    ? ` · ${String(selectedWardFeature.properties.zone_name)}`
                    : ""}
                </dd>
              </div>
              <div>
                <dt className="dg-mono text-[10px]">Assembly Constituency</dt>
                <dd className="mt-0.5 text-[#171917]">
                  {String(
                    selectedWardFeature.properties?.Assembly ??
                      selectedWardFeature.properties?.ac ??
                      "Not specified"
                  )}
                </dd>
              </div>
              <div>
                <dt className="dg-mono text-[10px]">Source Attribution</dt>
                <dd className="mt-0.5 font-mono text-[11px]">
                  <a
                    href={wardsSourceHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#080909] underline"
                  >
                    GBA Final Delimitation (Nov 2025) ↗
                  </a>
                </dd>
              </div>
            </dl>
          )}
        </div>
      )}

      {/* Zone Legend & Selector Pills (when land-use zones exist) */}
      {legendItems.length > 0 && (
        <div
          role="group"
          aria-label="Zone code filter buttons"
          className="mt-4 flex flex-wrap gap-2"
        >
          {legendItems.map((item) => {
            const isSelected = selectedZoneCode === item.zone_code;
            return (
              <button
                key={item.zone_code}
                type="button"
                aria-pressed={isSelected}
                onClick={() => onSelectZone(item.zone_code)}
                className={`dg-pill ${isSelected ? "dg-pill-active" : ""}`}
              >
                {item.zone_code} · {item.zone_label}
                {item.maxVersion > 1 ? ` · v${item.maxVersion}` : ""}
              </button>
            );
          })}
        </div>
      )}

      {/* Layer Metadata & Accuracy Table */}
      {geoLayers.length > 0 && (
        <div className="mt-4 border-t border-[#c8ccc0] pt-3">
          <div className="dg-mono mb-2">
            Published Geospatial Layers ({geoLayers.length})
          </div>
          <div className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
            {geoLayers.map((layer) => (
              <div
                key={layer.layer_id}
                className="border border-[#c8ccc0] bg-[#efeee8] px-3 py-2"
              >
                <div className="flex items-center justify-between gap-2 font-mono text-[10.5px]">
                  <span className="font-semibold text-[#080909]">
                    {layer.title}
                  </span>
                  <span className="uppercase text-[#5b5e56]">
                    {layer.derived ? "Derived" : "Official"}
                    {layer.accuracy_m !== null
                      ? ` · ±${layer.accuracy_m}m`
                      : ""}
                  </span>
                </div>
                <p className="dg-serif mt-0.5 text-xs text-[#5b5e56]">
                  {layer.method}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
