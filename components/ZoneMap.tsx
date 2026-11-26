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
import {
  formatMapSheetFitErrorDetail,
  formatMapZoneAccuracyPlainLine,
} from "@/lib/plain-language";

interface ZoneMapProps {
  jurisdictionId?: string;
  releaseVersion?: string;
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
  initialShowSheetOverlay?: boolean;
  sheetOverlayOpacity?: number;
  onChangeSheetOverlayOpacity?: (nextOpacity: number) => void;
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
  releaseVersion = "4.0.0",
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
  initialShowSheetOverlay = false,
  sheetOverlayOpacity,
  onChangeSheetOverlayOpacity,
}: ZoneMapProps) {
  // On by default: corporation and wards (06-real-map-foundation.md §3)
  const [showStreetsLayer, setShowStreetsLayer] = useState(true);
  const [showBoundaryLayer, setShowBoundaryLayer] = useState(true);
  const [showGbaZonesLayer, setShowGbaZonesLayer] = useState(false);
  const [showWardsLayer, setShowWardsLayer] = useState(true);
  const [showPlanningDistrictsLayer, setShowPlanningDistrictsLayer] =
    useState(true);
  const [showZonesLayer, setShowZonesLayer] = useState(true);
  const [showOverlaysLayer, setShowOverlaysLayer] = useState(true);
  const [placeWardQuery, setPlaceWardQuery] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [webglError, setWebglError] = useState<string | null>(null);
  const [showSheetOverlay, setShowSheetOverlay] = useState<boolean>(() => {
    if (initialShowSheetOverlay) return true;
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("overlay") === "1" || params.get("overlay") === "true") {
        return true;
      }
    }
    return false;
  });
  const [internalOverlayOpacity, setInternalOverlayOpacity] = useState(65);
  const effectiveOverlayOpacity =
    sheetOverlayOpacity ?? internalOverlayOpacity;
  const handleOverlayOpacityChange = (val: number) => {
    setInternalOverlayOpacity(val);
    onChangeSheetOverlayOpacity?.(val);
  };

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

  const zonesLayerMeta = useMemo(
    () =>
      geoLayers.find(
        (l) =>
          l.layer_id === "landuse_zones" || l.layer_id === "master-plan-zones"
      ),
    [geoLayers]
  );
  const sheetOverlay = zonesLayerMeta?.sheet_overlay ?? null;

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
  const onSelectZoneRef = useRef(onSelectZone);
  useEffect(() => {
    onSelectZoneRef.current = onSelectZone;
  }, [onSelectZone]);

  const pmtilesUrl =
    process.env.NEXT_PUBLIC_PMTILES_URL?.trim() ||
    `/data/${jurisdictionId}/basemap.pmtiles`;

  const hasCoords = (fc?: GenericFeatureCollection | null) =>
    Boolean(
      fc?.features?.[0]?.geometry &&
        Array.isArray(fc.features[0].geometry.coordinates) &&
        fc.features[0].geometry.coordinates.length > 0
    );
  const hasZoneCoords =
    activeZones.length > 0 &&
    Array.isArray(activeZones[0].geometry?.coordinates) &&
    activeZones[0].geometry.coordinates.length > 0;
  const relBase = `/data/${jurisdictionId}/${releaseVersion}`;

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
        if (typeof maplibregl.setWorkerUrl === "function") {
          maplibregl.setWorkerUrl("/maplibre-gl-worker.js");
        }
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
        const beforeLabelId = map.getLayer("protomaps-labels-anchor")
          ? "protomaps-labels-anchor"
          : undefined;

        if (typeof maplibregl.ScaleControl === "function") {
          map.addControl(
            new maplibregl.ScaleControl({ maxWidth: 120, unit: "metric" }),
            "bottom-left"
          );
        }

        if (boundary && boundary.features.length > 0) {
          map.addSource("gba-corporation", {
            type: "geojson",
            data: hasCoords(boundary)
              ? (boundary as unknown as GeoJSON.FeatureCollection)
              : `${window.location.origin}${relBase}/boundary.geojson`,
          });
          map.addLayer(
            {
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
            },
            beforeLabelId
          );
        }

        if (gbaZones && gbaZones.features.length > 0) {
          map.addSource("gba-zones", {
            type: "geojson",
            data: hasCoords(gbaZones)
              ? (gbaZones as unknown as GeoJSON.FeatureCollection)
              : `${window.location.origin}${relBase}/gba-zones.geojson`,
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
            data: hasCoords(wards)
              ? (wards as unknown as GeoJSON.FeatureCollection)
              : `${window.location.origin}${relBase}/wards.geojson`,
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

        if (planningDistricts && planningDistricts.features.length > 0) {
          map.addSource("planning-districts", {
            type: "geojson",
            data: hasCoords(planningDistricts)
              ? (planningDistricts as unknown as GeoJSON.FeatureCollection)
              : `${window.location.origin}${relBase}/planning-districts.geojson`,
          });
          map.addLayer({
            id: "planning-districts-line",
            type: "line",
            source: "planning-districts",
            layout: {
              visibility: showPlanningDistrictsLayer ? "visible" : "none",
            },
            paint: {
              "line-color": "#080909",
              "line-dasharray": [6, 3],
              "line-width": 2.0,
            },
          });
        }

        if (sheetOverlay && sheetOverlay.bounds_wgs84?.length === 4) {
          const imgUrl =
            sheetOverlay.image_url.startsWith("http://") ||
            sheetOverlay.image_url.startsWith("https://")
              ? sheetOverlay.image_url
              : `${window.location.origin}${sheetOverlay.image_url}`;
          map.addSource("rmp-sheet-overlay", {
            type: "image",
            url: imgUrl,
            coordinates: sheetOverlay.bounds_wgs84 as unknown as [
              [number, number],
              [number, number],
              [number, number],
              [number, number]
            ],
          });
          map.addLayer({
            id: "rmp-sheet-overlay-layer",
            type: "raster",
            source: "rmp-sheet-overlay",
            layout: {
              visibility: showSheetOverlay ? "visible" : "none",
            },
            paint: {
              "raster-opacity": effectiveOverlayOpacity / 100,
            },
          });
        }

        if (activeZones.length > 0) {
          map.addSource("master-plan-zones", {
            type: "geojson",
            data: hasZoneCoords
              ? ({
                  type: "FeatureCollection",
                  features: activeZones,
                } as unknown as GeoJSON.FeatureCollection)
              : `${window.location.origin}${relBase}/zones.geojson`,
          });
          map.addLayer(
            {
              id: "master-plan-zones-fill",
              type: "fill",
              source: "master-plan-zones",
              layout: {
                visibility: showZonesLayer ? "visible" : "none",
              },
              paint: {
                "fill-color": [
                  "match",
                  ["get", "zone_code"],
                  "R-MAIN",
                  "#faf57a",
                  "R-MIX",
                  "#ffd600",
                  "C-BIZ",
                  "#4da6ff",
                  "C-AXES",
                  "#1ed2f5",
                  "I-GEN",
                  "#9b4dff",
                  "I-HITECH",
                  "#c299ff",
                  "PSP",
                  "#e03131",
                  "G-PARK",
                  "#69db7c",
                  "G-LAKE",
                  "#74c0fc",
                  "T-TRANS",
                  "#adb5bd",
                  "#efeee8",
                ],
                "fill-opacity": 0.42,
              },
            },
            beforeLabelId
          );
          map.addLayer(
            {
              id: "master-plan-zones-line",
              type: "line",
              source: "master-plan-zones",
              layout: {
                visibility: showZonesLayer ? "visible" : "none",
                "line-Sort-Key": 1,
              } as unknown as maplibregl.LineLayerSpecification["layout"],
              paint: {
                "line-color": "#080909",
                "line-width": 1.1,
              },
            },
            beforeLabelId
          );

          map.on(
            "click",
            "master-plan-zones-fill",
            (ev: maplibregl.MapLayerMouseEvent) => {
              const zCode = ev.features?.[0]?.properties?.zone_code;
              if (typeof zCode === "string" && zCode) {
                onSelectZoneRef.current(zCode);
              }
            }
          );
        }
      });

      return () => {
        map.remove();
        mapInstanceRef.current = null;
      };
    } catch (err) {
      setWebglError(
        err instanceof Error ? err.message : "WebGL context unavailable"
      );
      return undefined;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    activeZones,
    boundary,
    bounds.maxLat,
    bounds.maxLon,
    bounds.minLat,
    bounds.minLon,
    gbaZones,
    pmtilesUrl,
    wards,
  ]);

  // Synchronize layer visibility toggles and sheet overlay opacity with MapLibre instance
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !map.isStyleLoaded()) return;
    const syncVis = (layerId: string, visible: boolean) => {
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(layerId, "visibility", visible ? "visible" : "none");
      }
    };
    syncVis("roads-minor", showStreetsLayer);
    syncVis("roads-medium", showStreetsLayer);
    syncVis("roads-major", showStreetsLayer);
    syncVis("gba-corporation-line", showBoundaryLayer);
    syncVis("gba-zones-line", showGbaZonesLayer);
    syncVis("gba-wards-fill", showWardsLayer);
    syncVis("gba-wards-line", showWardsLayer);
    syncVis("planning-districts-line", showPlanningDistrictsLayer);
    syncVis("rmp-sheet-overlay-layer", showSheetOverlay);
    syncVis("master-plan-zones-fill", showZonesLayer);
    syncVis("master-plan-zones-line", showZonesLayer);
    if (map.getLayer("rmp-sheet-overlay-layer")) {
      map.setPaintProperty(
        "rmp-sheet-overlay-layer",
        "raster-opacity",
        effectiveOverlayOpacity / 100
      );
    }
  }, [
    effectiveOverlayOpacity,
    showStreetsLayer,
    showBoundaryLayer,
    showGbaZonesLayer,
    showPlanningDistrictsLayer,
    showSheetOverlay,
    showWardsLayer,
    showZonesLayer,
  ]);

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

  const handleToggleFullscreen = () => {
    setIsFullscreen((prev) => !prev);
  };

  const handleMyLocation = () => {
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        mapInstanceRef.current?.flyTo({
          center: [pos.coords.longitude, pos.coords.latitude],
          zoom: 15,
        });
      });
    }
  };

  const matchingWardsForSearch = useMemo(() => {
    const q = placeWardQuery.trim().toLowerCase();
    if (!q) return [];
    return sortedWards
      .filter((w) => {
        const wid = String(
          w.properties?.ward_id ?? w.properties?.ward_no ?? ""
        ).toLowerCase();
        const wname = String(w.properties?.ward_name ?? "").toLowerCase();
        const zname = String(
          w.properties?.zone_name ?? w.properties?.zone ?? ""
        ).toLowerCase();
        const ac = String(
          w.properties?.Assembly ?? w.properties?.ac ?? ""
        ).toLowerCase();
        return (
          wid === q ||
          `ward ${wid}` === q ||
          wname.includes(q) ||
          zname.includes(q) ||
          ac.includes(q)
        );
      })
      .slice(0, 8);
  }, [placeWardQuery, sortedWards]);

  return (
    <section
      aria-label="Interactive zoning and official boundary map"
      className="flex flex-col border-b border-[#080909] bg-[#f5f3ed] p-6"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="dg-mono">
            Street Map &amp; Official Boundaries
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
            <button
              type="button"
              onClick={handleToggleFullscreen}
              aria-label="Full screen map"
              className="border border-[#080909] bg-[#f5f3ed] px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-[#080909] hover:bg-[#efeee8]"
            >
              {isFullscreen ? "Exit Full Screen" : "Full Screen"}
            </button>
            <button
              type="button"
              onClick={handleMyLocation}
              aria-label="My location"
              className="border border-[#080909] bg-[#f5f3ed] px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-[#080909] hover:bg-[#efeee8]"
            >
              My Location
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

      {/* Local Place & Ward Search (Part 5: no external geocoding service) */}
      <div className="mb-3">
        <label
          htmlFor="map-place-ward-search"
          className="dg-mono block text-[10px] text-[#080909]"
        >
          Search by place name, neighbourhood, or ward name/number
        </label>
        <input
          id="map-place-ward-search"
          type="search"
          value={placeWardQuery}
          onChange={(e) => setPlaceWardQuery(e.target.value)}
          placeholder="Search place name, neighbourhood, or ward number..."
          className="mt-1 w-full border border-[#080909] bg-[#f5f3ed] px-3 py-1.5 font-mono text-xs text-[#080909]"
        />
        {matchingWardsForSearch.length > 0 && (
          <ul
            aria-label="Place and ward search suggestions"
            className="mt-1 divide-y divide-[#c8ccc0] border border-[#080909] bg-[#f5f3ed] font-mono text-xs"
          >
            {matchingWardsForSearch.map((w, wIdx) => {
              const wid = String(
                w.properties?.ward_id ?? w.properties?.ward_no ?? ""
              );
              const wname = String(w.properties?.ward_name ?? "");
              const zname = String(
                w.properties?.zone_name ?? w.properties?.zone ?? ""
              );
              const corpKey = String(
                w.properties?.Corporation ?? w.properties?.Corporatio ?? wIdx
              );
              return (
                <li key={`${corpKey}-${wid}-${wname}`}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedWardId(wid);
                      setPlaceWardQuery("");
                    }}
                    className="flex w-full items-center justify-between px-3 py-1.5 text-left text-[#080909] hover:bg-[#efeee8]"
                  >
                    <span>
                      <strong>{wname}</strong> · Ward {wid}
                    </span>
                    <span className="text-[10.5px] text-[#5b5e56]">{zname}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Layer Toggles (Streets, Land-use zones, Wards, Corporations, Original sheet overlay) */}
      <div
        role="group"
        aria-label="Map layer toggles"
        className="mb-3 flex flex-wrap items-center gap-4 border border-[#c8ccc0] bg-[#efeee8] px-3 py-2 font-mono text-[10.5px] uppercase tracking-[0.12em] text-[#080909]"
      >
        <span className="font-semibold">Layers:</span>
        <label className="flex cursor-pointer items-center gap-1.5">
          <input
            type="checkbox"
            checked={showStreetsLayer}
            onChange={(e) => setShowStreetsLayer(e.target.checked)}
            className="h-3 w-3 accent-[#080909]"
          />
          <span>Streets</span>
        </label>
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
            <span>Land-Use Zones ({activeZones.length})</span>
          </label>
        )}
        {sheetOverlay && (
          <>
            <label className="flex cursor-pointer items-center gap-1.5">
              <input
                type="checkbox"
                checked={showSheetOverlay}
                onChange={(e) => setShowSheetOverlay(e.target.checked)}
                className="h-3 w-3 accent-[#080909]"
              />
              <span>Sheet Overlay: {sheetOverlay.sheet}</span>
            </label>
            <div className="flex items-center gap-2 border-l border-[#c8ccc0] pl-3">
              <label
                htmlFor="map-sheet-opacity"
                className="text-[10px] text-[#080909]"
              >
                Sheet Opacity: {effectiveOverlayOpacity}%
              </label>
              <input
                id="map-sheet-opacity"
                type="range"
                min={0}
                max={100}
                value={effectiveOverlayOpacity}
                onChange={(e) =>
                  handleOverlayOpacityChange(Number(e.target.value))
                }
                className="w-24 accent-[#080909]"
              />
            </div>
          </>
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
        {webglError && (
          <div
            role="alert"
            className="border-b border-[#080909] bg-[#efeee8] p-4 font-mono text-xs text-[#080909]"
          >
            Interactive WebGL map rendering is unavailable in this browser (
            {webglError}). Use the Ward and Zone selector controls below or
            download the GeoJSON layers directly from{" "}
            <a href="/data" className="underline">
              /data
            </a>
            .
          </div>
        )}
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
          <span>Scale: 100 m – 1 km · Protomaps Light Style (Labels Above Zones)</span>
        </div>
      </div>

      {/* One honest measured accuracy figure in plain words (Part 2) */}
      {sheetOverlay && (
        <p
          role="status"
          className="dg-serif mt-3 border border-[#c8ccc0] bg-[#efeee8] px-3 py-2 text-sm text-[#171917]"
        >
          Zones traced from the RMP 2015 Proposed Land Use sheet{" "}
          <span className="font-semibold">{sheetOverlay.sheet}</span>.{" "}
          {formatMapZoneAccuracyPlainLine(
            sheetOverlay.road_median_offset_m,
            sheetOverlay.road_p90_offset_m
          )}{" "}
          Derived by this project, not an official publication.
        </p>
      )}

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

      {/* Zone Legend & Selector Pills (plain legend names in primary layer) */}
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
                {item.zone_label}
              </button>
            );
          })}
        </div>
      )}

      {/* About this map expander: all technical details, ward inspector, and layer metadata */}
      {(sortedWards.length > 0 || geoLayers.length > 0) && (
        <details
          data-testid="about-this-map-expander"
          className="mt-4 border border-[#080909] bg-[#efeee8] p-4"
        >
          <summary className="cursor-pointer font-mono text-xs font-semibold uppercase tracking-[0.12em] text-[#080909]">
            About this map
          </summary>

          {sortedWards.length > 0 && (
            <div
              role="region"
              aria-label="Official ward boundary inspector"
              className="mt-3 border-t border-[#c8ccc0] pt-3"
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
                    {sortedWards.map((w, wIdx) => {
                      const wid = String(
                        w.properties?.ward_id ?? w.properties?.ward_no ?? ""
                      );
                      const wname = String(w.properties?.ward_name ?? "");
                      const zname = String(
                        w.properties?.zone_name ?? w.properties?.zone ?? ""
                      );
                      const corpKey = String(
                        w.properties?.Corporation ??
                          w.properties?.Corporatio ??
                          wIdx
                      );
                      return (
                        <option key={`${corpKey}-${wid}-${wname}`} value={wid}>
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

          {geoLayers.length > 0 && (
            <div className="mt-4 border-t border-[#c8ccc0] pt-3">
              <div className="dg-mono mb-2">
                Published Geospatial Layers ({geoLayers.length})
              </div>
              {sheetOverlay && (
                <p className="mb-2 font-mono text-xs text-[#5b5e56]">
                  {formatMapSheetFitErrorDetail(
                    sheetOverlay.rmse_m,
                    sheetOverlay.loo_rmse_m
                  )}
                </p>
              )}
              <div className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
                {geoLayers.map((layer) => (
                  <div
                    key={layer.layer_id}
                    className="border border-[#c8ccc0] bg-[#f5f3ed] px-3 py-2"
                  >
                    <div className="flex items-center justify-between gap-2 font-mono text-[10.5px]">
                      <span className="font-semibold text-[#080909]">
                        {layer.title}
                      </span>
                      <span className="uppercase text-[#5b5e56]">
                        {layer.derived ? "Derived" : "Official"}
                        {layer.sheet_overlay?.road_median_offset_m
                          ? ` · street offset ~${Math.round(layer.sheet_overlay.road_median_offset_m)} m (p90 ~${Math.round(layer.sheet_overlay.road_p90_offset_m ?? layer.sheet_overlay.road_median_offset_m)} m)`
                          : layer.accuracy_m !== null
                            ? ` · within about ${layer.accuracy_m} m`
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
        </details>
      )}
    </section>
  );
}
