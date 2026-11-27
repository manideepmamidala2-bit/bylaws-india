"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import { Protocol } from "pmtiles";
import type {
  GenericFeatureCollection,
  GenericGeoJSONFeature,
  GeoLayerEntry,
  ProcessedSheetMetadata,
  ZoneFeature,
  ZoneGeometry,
} from "@/lib/data";
import { buildProtomapsLightStyle } from "@/lib/map-style";
import {
  formatMapSheetFitErrorDetail,
  formatMapZoneAccuracyPlainLine,
} from "@/lib/plain-language";
import {
  createPlaceMiniSearch,
  searchPlacesWithMiniSearch,
  type PlaceIndexEntry,
  type PlaceIndexPayload,
} from "@/lib/place-search";

export interface ZoneMapProps {
  jurisdictionId?: string;
  zonesSourceJurisdictionId?: string;
  releaseVersion?: string;
  zones: ZoneFeature[];
  selectedZoneCode: string | null;
  onSelectZone: (zoneCode: string) => void;
  onSelectPlaceEntry?: (entry: PlaceIndexEntry) => void;
  initialPlaces?: PlaceIndexEntry[];
  flyToTarget?: { lat: number; lng: number; zoom: number } | null;
  boundary?: GenericFeatureCollection | null;
  gbaZones?: GenericFeatureCollection | null;
  wards?: GenericFeatureCollection | null;
  planningDistricts?: GenericFeatureCollection | null;
  overlays?: GenericFeatureCollection | null;
  geoLayers?: GeoLayerEntry[];
  processedSheets?: ProcessedSheetMetadata[];
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

function collectPointsFromGeometry(
  geom: ZoneGeometry
): Array<[number, number]> {
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

function buildDiagonalHatchPattern(): {
  width: number;
  height: number;
  data: Uint8Array;
} {
  const size = 16;
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const onDiag = (x + y) % 8 === 0 || (x + y) % 8 === 1;
      if (onDiag) {
        data[idx] = 140;
        data[idx + 1] = 142;
        data[idx + 2] = 134;
        data[idx + 3] = 115;
      } else {
        data[idx] = 239;
        data[idx + 1] = 238;
        data[idx + 2] = 232;
        data[idx + 3] = 45;
      }
    }
  }
  return { width: size, height: size, data };
}

let pmtilesProtocolRegistered = false;

export function ZoneMap({
  jurisdictionId = "",
  zonesSourceJurisdictionId,
  releaseVersion = "4.0.0",
  zones,
  selectedZoneCode,
  onSelectZone,
  onSelectPlaceEntry,
  initialPlaces = [],
  flyToTarget = null,
  boundary = null,
  gbaZones = null,
  wards = null,
  planningDistricts = null,
  overlays = null,
  geoLayers = [],
  processedSheets = [],
  showDrafts = false,
  onToggleDrafts,
  initialShowSheetOverlay = false,
  sheetOverlayOpacity,
  onChangeSheetOverlayOpacity,
}: ZoneMapProps) {
  // Part 2.2 Layer switch in plain words: Land-use zones, Wards, Corporations, Planning districts, Original map sheets
  const [showZonesLayer, setShowZonesLayer] = useState(true);
  const [showWardsLayer, setShowWardsLayer] = useState(true);
  const [showBoundaryLayer, setShowBoundaryLayer] = useState(true);
  const [showPlanningDistrictsLayer, setShowPlanningDistrictsLayer] =
    useState(true);
  const [showOverlaysLayer, setShowOverlaysLayer] = useState(true);
  const [placeWardQuery, setPlaceWardQuery] = useState("");
  const [placesList, setPlacesList] =
    useState<PlaceIndexEntry[]>(initialPlaces);
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
  const [internalOverlayOpacity, setInternalOverlayOpacity] = useState(70);
  const effectiveOverlayOpacity =
    sheetOverlayOpacity ?? internalOverlayOpacity;
  const handleOverlayOpacityChange = (val: number) => {
    setInternalOverlayOpacity(val);
    onChangeSheetOverlayOpacity?.(val);
  };

  // Load place-index.json on client if not already provided
  useEffect(() => {
    if (initialPlaces.length > 0) {
      setPlacesList(initialPlaces);
      return;
    }
    if (!jurisdictionId) return;
    let cancelled = false;
    fetch(`/data/${jurisdictionId}/place-index.json`)
      .then((r) => (r.ok ? r.json() : null))
      .then((payload: PlaceIndexPayload | null) => {
        if (!cancelled && payload?.places?.length) {
          setPlacesList(payload.places);
        }
      })
      .catch(() => {
        // Ignore in offline/unit test environments
      });
    return () => {
      cancelled = true;
    };
  }, [initialPlaces, jurisdictionId]);

  const miniSearch = useMemo(
    () => createPlaceMiniSearch(placesList),
    [placesList]
  );

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
      : null);

  const zonesLayerMeta = useMemo(
    () =>
      geoLayers.find(
        (l) =>
          l.layer_id === "landuse_zones" || l.layer_id === "master-plan-zones"
      ),
    [geoLayers]
  );
  const fallbackSheetOverlay = zonesLayerMeta?.sheet_overlay ?? null;

  const effectiveSheets: ProcessedSheetMetadata[] = useMemo(() => {
    if (processedSheets.length > 0) return processedSheets;
    if (
      fallbackSheetOverlay &&
      fallbackSheetOverlay.bounds_wgs84?.length === 4
    ) {
      return [
        {
          sheetId: fallbackSheetOverlay.sheet || "sheet-1",
          sheetLabel: fallbackSheetOverlay.sheet || "Original sheet",
          planningDistrict: fallbackSheetOverlay.planning_district || "",
          imageUrl: fallbackSheetOverlay.image_url,
          boundsWgs84:
            fallbackSheetOverlay.bounds_wgs84 as unknown as ProcessedSheetMetadata["boundsWgs84"],
          roadSegmentCount: null,
          roadMedianOffsetM:
            fallbackSheetOverlay.road_median_offset_m ?? null,
          roadP90OffsetM: fallbackSheetOverlay.road_p90_offset_m ?? null,
          gridFitRmseM: fallbackSheetOverlay.rmse_m ?? null,
          looRmseM: fallbackSheetOverlay.loo_rmse_m ?? null,
        },
      ];
    }
    return [];
  }, [fallbackSheetOverlay, processedSheets]);

  const [selectedSheetId, setSelectedSheetId] = useState<string>(
    effectiveSheets[0]?.sheetId ?? "all"
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

  const effectiveZonesJurId = zonesSourceJurisdictionId || jurisdictionId;
  const pmtilesUrl =
    process.env.NEXT_PUBLIC_PMTILES_URL?.trim() ||
    `/data/${effectiveZonesJurId}/basemap.pmtiles`;

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
  const zonesRelBase = `/data/${effectiveZonesJurId}/${releaseVersion}`;

  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;

    if (
      typeof window === "undefined" ||
      (typeof navigator !== "undefined" && /jsdom/i.test(navigator.userAgent))
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
        style: buildProtomapsLightStyle(resolvedUrl, window.location.origin),
        bounds: [bounds.minLon, bounds.minLat, bounds.maxLon, bounds.maxLat],
        fitBoundsOptions: { padding: 24 },
        attributionControl: false,
        keyboard: true,
        touchZoomRotate: true,
        dragPan: true,
      });

      mapInstanceRef.current = map;

      map.on("load", () => {
        // Strict bottom-to-top layer order (Part 2.2):
        // 1. Base map without labels (already in style below protomaps-labels-anchor)
        // 2. Land-use zones (60% opacity, zone codes from zoom 15) + optional Original map sheets
        // 3. Light diagonal hatch over areas without land-use data ("Land-use data not yet available")
        // 4. Planning district outlines
        // 5. Ward boundaries (ward names from zoom 13)
        // 6. Corporation boundaries
        // 7. Derived overlays (lake buffers) as dashed outlines labelled "derived"
        // 8. Base map labels on top (above protomaps-labels-anchor)
        const beforeLabelId = map.getLayer("protomaps-labels-anchor")
          ? "protomaps-labels-anchor"
          : undefined;

        if (typeof maplibregl.ScaleControl === "function") {
          map.addControl(
            new maplibregl.ScaleControl({ maxWidth: 120, unit: "metric" }),
            "bottom-left"
          );
        }

        if (!map.hasImage("diagonal-hatch")) {
          const hatch = buildDiagonalHatchPattern();
          map.addImage("diagonal-hatch", hatch);
        }

        // Original map sheets (Part 2.5): MapLibre image source per processed sheet
        for (const sheet of effectiveSheets) {
          const srcId = `rmp-sheet-src-${sheet.sheetId}`;
          const lyrId = `rmp-sheet-layer-${sheet.sheetId}`;
          const imgUrl =
            sheet.imageUrl.startsWith("http://") ||
            sheet.imageUrl.startsWith("https://")
              ? sheet.imageUrl
              : `${window.location.origin}${sheet.imageUrl}`;
          map.addSource(srcId, {
            type: "image",
            url: imgUrl,
            coordinates: sheet.boundsWgs84,
          });
          map.addLayer(
            {
              id: lyrId,
              type: "raster",
              source: srcId,
              layout: {
                visibility: showSheetOverlay ? "visible" : "none",
              },
              paint: {
                "raster-opacity": effectiveOverlayOpacity / 100,
              },
            },
            beforeLabelId
          );
        }

        // Layer 2: Land-use zones in official RMP 2015 legend colours, 60% opacity; zone codes from zoom 15
        if (activeZones.length > 0) {
          map.addSource("master-plan-zones", {
            type: "geojson",
            data: hasZoneCoords
              ? ({
                  type: "FeatureCollection",
                  features: activeZones,
                } as unknown as GeoJSON.FeatureCollection)
              : `${window.location.origin}${zonesRelBase}/zones.geojson`,
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
                "fill-opacity": 0.6,
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
              },
              paint: {
                "line-color": "#080909",
                "line-width": 0.9,
              },
            },
            beforeLabelId
          );
          map.addLayer(
            {
              id: "master-plan-zones-label",
              type: "symbol",
              source: "master-plan-zones",
              minzoom: 15,
              layout: {
                visibility: showZonesLayer ? "visible" : "none",
                "text-field": ["get", "zone_code"],
                "text-font": ["Noto Sans Medium"],
                "text-size": 11,
              },
              paint: {
                "text-color": "#080909",
                "text-halo-color": "#f5f3ed",
                "text-halo-width": 1.2,
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

        // Layer 3: Light diagonal hatch over areas without land-use data, labelled "Land-use data not yet available"
        map.addSource("uncovered-landuse", {
          type: "geojson",
          data: `${window.location.origin}/data/${jurisdictionId}/uncovered-area.geojson`,
        });
        map.addLayer(
          {
            id: "uncovered-landuse-hatch",
            type: "fill",
            source: "uncovered-landuse",
            filter: ["==", ["get", "kind"], "uncovered_hatch"],
            layout: {
              visibility: showZonesLayer ? "visible" : "none",
            },
            paint: {
              "fill-pattern": "diagonal-hatch",
              "fill-opacity": 0.45,
            },
          },
          beforeLabelId
        );
        map.addLayer(
          {
            id: "uncovered-landuse-label",
            type: "symbol",
            source: "uncovered-landuse",
            filter: ["==", ["get", "kind"], "uncovered_label"],
            layout: {
              visibility: showZonesLayer ? "visible" : "none",
              "text-field": "Land-use data not yet available",
              "text-font": ["Noto Sans Italic"],
              "text-size": 11,
            },
            paint: {
              "text-color": "#5b5e56",
              "text-halo-color": "#f5f3ed",
              "text-halo-width": 1.4,
            },
          },
          beforeLabelId
        );

        // Layer 4: Planning district outlines
        if (planningDistricts && planningDistricts.features.length > 0) {
          map.addSource("planning-districts", {
            type: "geojson",
            data: hasCoords(planningDistricts)
              ? (planningDistricts as unknown as GeoJSON.FeatureCollection)
              : `${window.location.origin}${relBase}/planning-districts.geojson`,
          });
          map.addLayer(
            {
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
            },
            beforeLabelId
          );
        }

        // Layer 5: Ward boundaries; ward names from zoom 13
        if (wards && wards.features.length > 0) {
          map.addSource("gba-wards", {
            type: "geojson",
            data: hasCoords(wards)
              ? (wards as unknown as GeoJSON.FeatureCollection)
              : `${window.location.origin}${relBase}/wards.geojson`,
          });
          map.addLayer(
            {
              id: "gba-wards-fill",
              type: "fill",
              source: "gba-wards",
              layout: {
                visibility: showWardsLayer ? "visible" : "none",
              },
              paint: {
                "fill-color": "#efeee8",
                "fill-opacity": 0.08,
              },
            },
            beforeLabelId
          );
          map.addLayer(
            {
              id: "gba-wards-line",
              type: "line",
              source: "gba-wards",
              layout: {
                visibility: showWardsLayer ? "visible" : "none",
              },
              paint: {
                "line-color": "#5b5e56",
                "line-width": 1.1,
              },
            },
            beforeLabelId
          );
          map.addLayer(
            {
              id: "gba-wards-label",
              type: "symbol",
              source: "gba-wards",
              minzoom: 13,
              layout: {
                visibility: showWardsLayer ? "visible" : "none",
                "text-field": ["get", "ward_name"],
                "text-font": ["Noto Sans Regular"],
                "text-size": 11,
              },
              paint: {
                "text-color": "#171917",
                "text-halo-color": "#f5f3ed",
                "text-halo-width": 1.2,
              },
            },
            beforeLabelId
          );

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

        // Layer 6: Corporation boundaries
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

        // Layer 7: Derived overlays (lake buffers) as dashed outlines labelled "derived"
        if (overlays && overlays.features.length > 0) {
          map.addSource("derived-overlays", {
            type: "geojson",
            data: hasCoords(overlays)
              ? (overlays as unknown as GeoJSON.FeatureCollection)
              : `${window.location.origin}${zonesRelBase}/overlays.geojson`,
          });
          map.addLayer(
            {
              id: "derived-overlays-line",
              type: "line",
              source: "derived-overlays",
              layout: {
                visibility: showOverlaysLayer ? "visible" : "none",
              },
              paint: {
                "line-color": "#0b5c8f",
                "line-dasharray": [4, 3],
                "line-width": 1.6,
              },
            },
            beforeLabelId
          );
          map.addLayer(
            {
              id: "derived-overlays-label",
              type: "symbol",
              source: "derived-overlays",
              minzoom: 14,
              layout: {
                visibility: showOverlaysLayer ? "visible" : "none",
                "symbol-placement": "line",
                "text-field": "derived",
                "text-font": ["Noto Sans Italic"],
                "text-size": 10,
              },
              paint: {
                "text-color": "#0b5c8f",
                "text-halo-color": "#f5f3ed",
                "text-halo-width": 1,
              },
            },
            beforeLabelId
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

  // Fly map when flyToTarget changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !flyToTarget) return;
    try {
      map.flyTo({
        center: [flyToTarget.lng, flyToTarget.lat],
        zoom: flyToTarget.zoom,
      });
    } catch {
      // Ignore in test environments
    }
  }, [flyToTarget]);

  // Synchronize layer visibility toggles and sheet overlay opacity with MapLibre instance
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !map.isStyleLoaded()) return;
    const syncVis = (layerId: string, visible: boolean) => {
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(
          layerId,
          "visibility",
          visible ? "visible" : "none"
        );
      }
    };
    syncVis("master-plan-zones-fill", showZonesLayer);
    syncVis("master-plan-zones-line", showZonesLayer);
    syncVis("master-plan-zones-label", showZonesLayer);
    syncVis("uncovered-landuse-hatch", showZonesLayer);
    syncVis("uncovered-landuse-label", showZonesLayer);
    syncVis("planning-districts-line", showPlanningDistrictsLayer);
    syncVis("gba-wards-fill", showWardsLayer);
    syncVis("gba-wards-line", showWardsLayer);
    syncVis("gba-wards-label", showWardsLayer);
    syncVis("gba-corporation-line", showBoundaryLayer);
    syncVis("derived-overlays-line", showOverlaysLayer);
    syncVis("derived-overlays-label", showOverlaysLayer);

    for (const sheet of effectiveSheets) {
      const lyrId = `rmp-sheet-layer-${sheet.sheetId}`;
      const isTargetSheet =
        selectedSheetId === "all" || selectedSheetId === sheet.sheetId;
      syncVis(lyrId, showSheetOverlay && isTargetSheet);
      if (map.getLayer(lyrId)) {
        map.setPaintProperty(
          lyrId,
          "raster-opacity",
          effectiveOverlayOpacity / 100
        );
      }
    }
  }, [
    effectiveOverlayOpacity,
    effectiveSheets,
    selectedSheetId,
    showBoundaryLayer,
    showOverlaysLayer,
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
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        mapInstanceRef.current?.flyTo({
          center: [lng, lat],
          zoom: 15,
        });
      });
    }
  };

  const searchResults = useMemo(() => {
    const q = placeWardQuery.trim();
    if (!q) return [];
    const msMatches = searchPlacesWithMiniSearch(miniSearch, q, 8);
    if (msMatches.length > 0) return msMatches;
    // Fallback substring match against loaded wards if place-index.json is still loading
    const lower = q.toLowerCase();
    return sortedWards
      .filter((w) => {
        const wid = String(
          w.properties?.ward_id ?? w.properties?.ward_no ?? ""
        ).toLowerCase();
        const wname = String(w.properties?.ward_name ?? "").toLowerCase();
        return wid === lower || `ward ${wid}` === lower || wname.includes(lower);
      })
      .slice(0, 8)
      .map((w) => {
        const wid = String(w.properties?.ward_id ?? w.properties?.ward_no ?? "");
        const wname = String(w.properties?.ward_name ?? "");
        return {
          id: `ward-${wid}`,
          name: `Ward ${wid} · ${wname}`,
          kind: "ward" as const,
          categoryLabel: "Ward",
          lat: (bounds.minLat + bounds.maxLat) / 2,
          lng: (bounds.minLon + bounds.maxLon) / 2,
          corporationId: jurisdictionId,
          corporationName: jurisdictionId,
          wardNumber: wid,
          wardName: wname,
          planningDistrict: null,
          zoneCode: activeZones[0]?.properties.zone_code ?? null,
          zoneLabel: activeZones[0]?.properties.zone_label ?? null,
        };
      });
  }, [
    activeZones,
    bounds.maxLat,
    bounds.maxLon,
    bounds.minLat,
    bounds.minLon,
    jurisdictionId,
    miniSearch,
    placeWardQuery,
    sortedWards,
  ]);

  const activeSheetMeta = useMemo(
    () =>
      effectiveSheets.find((s) => s.sheetId === selectedSheetId) ??
      effectiveSheets[0] ??
      null,
    [effectiveSheets, selectedSheetId]
  );

  return (
    <section
      aria-label="Interactive zoning and official boundary map"
      className="flex flex-col border border-[#080909] bg-[#f5f3ed] p-5"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="dg-mono">Street Map &amp; Official Boundaries</div>
          <h2 className="mt-0.5 text-lg font-semibold text-[#080909]">
            Find rules by place, ward or zone
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div
            role="group"
            aria-label="Keyboard map navigation controls"
            className="flex flex-wrap items-center gap-1"
          >
            <button
              type="button"
              onClick={handleZoomIn}
              aria-label="Zoom in map"
              className="min-h-[36px] min-w-[36px] border border-[#080909] bg-[#f5f3ed] px-2.5 py-1 font-mono text-xs text-[#080909] hover:bg-[#efeee8] focus:outline-2 focus:outline-[#080909]"
            >
              +
            </button>
            <button
              type="button"
              onClick={handleZoomOut}
              aria-label="Zoom out map"
              className="min-h-[36px] min-w-[36px] border border-[#080909] bg-[#f5f3ed] px-2.5 py-1 font-mono text-xs text-[#080909] hover:bg-[#efeee8] focus:outline-2 focus:outline-[#080909]"
            >
              -
            </button>
            <button
              type="button"
              onClick={handleResetView}
              className="min-h-[36px] border border-[#080909] bg-[#f5f3ed] px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-[#080909] hover:bg-[#efeee8] focus:outline-2 focus:outline-[#080909]"
            >
              Reset View
            </button>
            <button
              type="button"
              onClick={handleToggleFullscreen}
              aria-label="Full screen map"
              className="min-h-[36px] border border-[#080909] bg-[#f5f3ed] px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-[#080909] hover:bg-[#efeee8] focus:outline-2 focus:outline-[#080909]"
            >
              {isFullscreen ? "Exit Full Screen" : "Full Screen"}
            </button>
            <button
              type="button"
              data-testid="map-my-location-btn"
              onClick={handleMyLocation}
              aria-label="My location"
              className="min-h-[36px] border border-[#080909] bg-[#f5f3ed] px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-[#080909] hover:bg-[#efeee8] focus:outline-2 focus:outline-[#080909]"
            >
              My location
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
        </div>
      </div>

      {/* Part 2.3 Place search with MiniSearch */}
      <div className="mb-3">
        <label
          htmlFor="map-place-ward-search"
          className="dg-mono block text-[10.5px] text-[#080909]"
        >
          Search by place, neighbourhood, road, landmark, or ward
        </label>
        <input
          id="map-place-ward-search"
          data-testid="map-place-search-input"
          type="search"
          value={placeWardQuery}
          onChange={(e) => setPlaceWardQuery(e.target.value)}
          placeholder="Search place name, neighbourhood, major road, or ward..."
          className="mt-1 min-h-[44px] w-full border border-[#080909] bg-[#f5f3ed] px-3 py-2 font-mono text-xs text-[#080909] focus:outline-2 focus:outline-[#080909]"
        />
        {searchResults.length > 0 && (
          <ul
            aria-label="Place and ward search suggestions"
            data-testid="map-place-search-results"
            className="mt-1 divide-y divide-[#c8ccc0] border border-[#080909] bg-[#f5f3ed] font-mono text-xs"
          >
            {searchResults.map((entry) => (
              <li key={entry.id}>
                <button
                  type="button"
                  data-testid={`place-search-result-${entry.id}`}
                  onClick={() => {
                    if (entry.wardNumber) {
                      setSelectedWardId(entry.wardNumber);
                    }
                    if (entry.zoneCode) {
                      onSelectZone(entry.zoneCode);
                    }
                    onSelectPlaceEntry?.(entry);
                    mapInstanceRef.current?.flyTo({
                      center: [entry.lng, entry.lat],
                      zoom: 15,
                    });
                    setPlaceWardQuery("");
                  }}
                  className="flex min-h-[44px] w-full flex-wrap items-center justify-between gap-2 px-3 py-2 text-left text-[#080909] hover:bg-[#efeee8] focus:outline-2 focus:outline-[#080909]"
                >
                  <span>
                    <strong>{entry.name}</strong>
                    {entry.wardName && entry.kind !== "ward"
                      ? ` · Ward ${entry.wardNumber ?? ""} ${entry.wardName}`
                      : ""}
                  </span>
                  <span className="text-[10.5px] text-[#5b5e56]">
                    {entry.categoryLabel}
                    {entry.zoneCode ? ` · ${entry.zoneLabel} (${entry.zoneCode})` : ""}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Part 2.2 Layer switch in plain words: Land-use zones, Wards, Corporations, Planning districts, Original map sheets */}
      <div
        role="group"
        aria-label="Map layer switch"
        data-testid="map-layer-switch"
        className="mb-3 flex flex-wrap items-center gap-4 border border-[#c8ccc0] bg-[#efeee8] px-3 py-2 font-mono text-[10.5px] uppercase tracking-[0.12em] text-[#080909]"
      >
        <span className="font-semibold">Layers:</span>
        <label className="flex min-h-[36px] cursor-pointer items-center gap-1.5">
          <input
            type="checkbox"
            checked={showZonesLayer}
            onChange={(e) => setShowZonesLayer(e.target.checked)}
            className="h-3.5 w-3.5 accent-[#080909]"
          />
          <span>Land-use zones</span>
        </label>
        <label className="flex min-h-[36px] cursor-pointer items-center gap-1.5">
          <input
            type="checkbox"
            checked={showWardsLayer}
            onChange={(e) => setShowWardsLayer(e.target.checked)}
            className="h-3.5 w-3.5 accent-[#080909]"
          />
          <span>Wards</span>
        </label>
        <label className="flex min-h-[36px] cursor-pointer items-center gap-1.5">
          <input
            type="checkbox"
            checked={showBoundaryLayer}
            onChange={(e) => setShowBoundaryLayer(e.target.checked)}
            className="h-3.5 w-3.5 accent-[#080909]"
          />
          <span>Corporations</span>
        </label>
        <label className="flex min-h-[36px] cursor-pointer items-center gap-1.5">
          <input
            type="checkbox"
            checked={showPlanningDistrictsLayer}
            onChange={(e) => setShowPlanningDistrictsLayer(e.target.checked)}
            className="h-3.5 w-3.5 accent-[#080909]"
          />
          <span>Planning districts</span>
        </label>
        <label className="flex min-h-[36px] cursor-pointer items-center gap-1.5">
          <input
            type="checkbox"
            data-testid="toggle-original-map-sheets"
            checked={showSheetOverlay}
            onChange={(e) => setShowSheetOverlay(e.target.checked)}
            className="h-3.5 w-3.5 accent-[#080909]"
          />
          <span>Original map sheets</span>
        </label>
        {overlays && overlays.features.length > 0 && (
          <label className="flex min-h-[36px] cursor-pointer items-center gap-1.5">
            <input
              type="checkbox"
              checked={showOverlaysLayer}
              onChange={(e) => setShowOverlaysLayer(e.target.checked)}
              className="h-3.5 w-3.5 accent-[#080909]"
            />
            <span>Lake buffers (derived)</span>
          </label>
        )}
      </div>

      {/* Part 2.5 Original map sheets selector, opacity slider (0 to 100%), and per-sheet accuracy */}
      {effectiveSheets.length > 0 && (
        <div
          data-testid="map-sheets-panel"
          className="mb-3 border border-[#c8ccc0] bg-[#efeee8] p-3 text-xs"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <label
                htmlFor="map-sheet-select"
                className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-[#080909]"
              >
                Original map sheet:
              </label>
              <select
                id="map-sheet-select"
                data-testid="map-sheet-select"
                value={selectedSheetId}
                onChange={(e) => {
                  setSelectedSheetId(e.target.value);
                  setShowSheetOverlay(true);
                }}
                className="min-h-[36px] border border-[#080909] bg-[#f5f3ed] px-2.5 py-1 font-mono text-xs text-[#080909]"
              >
                <option value="all">
                  All processed sheets ({effectiveSheets.length})
                </option>
                {effectiveSheets.map((s) => (
                  <option key={s.sheetId} value={s.sheetId}>
                    {s.sheetLabel}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label
                htmlFor="map-sheet-opacity"
                className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-[#080909]"
              >
                Sheet opacity: {effectiveOverlayOpacity}%
              </label>
              <input
                id="map-sheet-opacity"
                data-testid="map-sheet-opacity-slider"
                type="range"
                min={0}
                max={100}
                value={effectiveOverlayOpacity}
                onChange={(e) => {
                  handleOverlayOpacityChange(Number(e.target.value));
                  if (!showSheetOverlay) setShowSheetOverlay(true);
                }}
                className="w-28 accent-[#080909]"
              />
            </div>
          </div>

          {activeSheetMeta && (
            <details className="mt-2 border-t border-[#c8ccc0] pt-2">
              <summary className="inline-flex min-h-[36px] cursor-pointer items-center font-mono text-[10.5px] uppercase tracking-[0.1em] text-[#5b5e56] underline hover:text-[#080909]">
                Sheet details &amp; measured placement accuracy (
                {effectiveSheets.length} sheets)
              </summary>
              <ul className="mt-2 space-y-1.5 text-xs text-[#171917]">
                {effectiveSheets.map((s) => (
                  <li key={s.sheetId} className="dg-serif">
                    <strong>{s.sheetLabel}</strong>:{" "}
                    {formatMapZoneAccuracyPlainLine(
                      s.roadMedianOffsetM,
                      s.roadP90OffsetM
                    )}{" "}
                    <span className="font-mono text-[11px] text-[#5b5e56]">
                      {formatMapSheetFitErrorDetail(
                        s.gridFitRmseM,
                        s.looRmseM
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}

      {/* MapLibre GL JS + PMTiles Canvas */}
      <div className="relative w-full border border-[#080909] bg-[#efeee8]">
        {webglError && (
          <div
            role="alert"
            className="border-b border-[#080909] bg-[#efeee8] p-4 font-mono text-xs text-[#080909]"
          >
            Interactive WebGL map rendering is unavailable in this browser (
            {webglError}). Use the Place search, Ward selector, or Browse by
            ward page.
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
          data-testid="map-attribution"
          className="flex flex-wrap items-center justify-between gap-2 border-t border-[#c8ccc0] bg-[#f5f3ed] px-3 py-1.5 font-mono text-[10px] text-[#5b5e56]"
        >
          <span>Protomaps © OpenStreetMap (OpenStreetMap contributors)</span>
          <span>Land-use zones at 60% opacity · Labels on top</span>
        </div>
      </div>

      {/* Zone Legend & Selector Pills */}
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
                className={`dg-pill focus:outline-2 focus:outline-[#080909] ${
                  isSelected ? "dg-pill-active" : ""
                }`}
              >
                {item.zone_label} ({item.zone_code})
              </button>
            );
          })}
        </div>
      )}

      {/* About this map expander */}
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
                    Inspect Official Ward ({sortedWards.length} Wards)
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
                    Official Ward Delimitation Source ↗
                  </a>
                )}
              </div>

              {selectedWardFeature && (
                <dl className="mt-3 grid grid-cols-1 gap-3 border-t border-[#c8ccc0] pt-3 text-xs sm:grid-cols-3">
                  <div>
                    <dt className="dg-mono text-[10px]">Ward No. &amp; Name</dt>
                    <dd className="mt-0.5 font-semibold text-[#080909]">
                      Ward{" "}
                      {String(
                        selectedWardFeature.properties?.ward_id ??
                          selectedWardFeature.properties?.ward_no ??
                          ""
                      )}{" "}
                      ·{" "}
                      {String(selectedWardFeature.properties?.ward_name ?? "")}
                    </dd>
                  </div>
                  <div>
                    <dt className="dg-mono text-[10px]">Zone</dt>
                    <dd className="mt-0.5 font-mono text-[#080909]">
                      {String(selectedWardFeature.properties?.zone ?? "")}
                      {selectedWardFeature.properties?.zone_name
                        ? ` · ${String(selectedWardFeature.properties.zone_name)}`
                        : ""}
                    </dd>
                  </div>
                  <div>
                    <dt className="dg-mono text-[10px]">
                      Assembly Constituency
                    </dt>
                    <dd className="mt-0.5 text-[#171917]">
                      {String(
                        selectedWardFeature.properties?.Assembly ??
                          selectedWardFeature.properties?.ac ??
                          "Not specified"
                      )}
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
