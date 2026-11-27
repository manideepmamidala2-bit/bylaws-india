"use client";

import React, { useEffect, useMemo, useState } from "react";
import type {
  AmendmentLink,
  ClauseNode,
  ClauseZoneTagEntry,
  GenericFeatureCollection,
  GeoLayerEntry,
  JurisdictionConsolidated,
  JurisdictionParameters,
  ProcessedSheetMetadata,
  StatutoryResolutionConfig,
  ZoneFeature,
} from "@/lib/data";
import { ZoneMap } from "./ZoneMap";
import { formatPlainCorporationName } from "./CorporationSelector";
import { PlaceCard, type SelectedPlaceContext } from "./PlaceCard";
import {
  formatMapUrlHash,
  parseMapUrlHash,
  type PlaceIndexEntry,
} from "@/lib/place-search";
import type {
  Byelaw14GovernanceInfo,
  ZoneRulesSummary,
} from "@/lib/zone-rules";

interface AreaExplorerClientProps {
  jurisdictionId: string;
  zonesSourceJurisdictionId?: string;
  corporationName?: string;
  releaseVersion?: string;
  zones: ZoneFeature[];
  clauses?: ClauseNode[];
  amendmentLinks?: AmendmentLink[];
  clauseZoneTags?: ClauseZoneTagEntry[];
  boundary: GenericFeatureCollection | null;
  gbaZones: GenericFeatureCollection | null;
  wards: GenericFeatureCollection | null;
  planningDistricts: GenericFeatureCollection | null;
  overlays: GenericFeatureCollection | null;
  geoLayers: GeoLayerEntry[];
  processedSheets?: ProcessedSheetMetadata[];
  initialPlaces?: PlaceIndexEntry[];
  zoneRulesByCode?: Record<string, ZoneRulesSummary>;
  byelaw14Info?: Byelaw14GovernanceInfo;
  parametersPayload?: JurisdictionParameters | null;
  resolutionConfig?: StatutoryResolutionConfig | null;
  consolidatedPayload?: JurisdictionConsolidated | null;
}

const DEFAULT_BYELAW14_INFO: Byelaw14GovernanceInfo = {
  plainLine:
    "Under Bye-law 1.4, the Master Plan Zoning Regulations and their in-force amendments govern land use, coverage, FAR, setbacks, height, and parking.",
  verbatimQuote: null,
  attributionLabel: "Building Bye-laws, bye-law 1.4, p. 2",
  pageNumber: 2,
  pageLink: "#page=2",
  documentHref: "/data",
};

export function AreaExplorerClient({
  jurisdictionId,
  zonesSourceJurisdictionId,
  corporationName,
  releaseVersion,
  zones,
  boundary,
  gbaZones,
  wards,
  planningDistricts,
  overlays,
  geoLayers,
  processedSheets = [],
  initialPlaces = [],
  zoneRulesByCode = {},
  byelaw14Info = DEFAULT_BYELAW14_INFO,
}: AreaExplorerClientProps) {
  const activeZones = useMemo(
    () =>
      zones.filter(
        (z) => !z.properties.superseded_by && !z.properties.record_superseded_by
      ),
    [zones]
  );

  const plainCorp = formatPlainCorporationName(
    jurisdictionId,
    corporationName
  );
  const firstWard = wards?.features?.[0];
  const firstWardNo = firstWard
    ? String(firstWard.properties?.ward_id ?? firstWard.properties?.ward_no ?? "1")
    : null;
  const firstWardName = firstWard
    ? String(firstWard.properties?.ward_name ?? "")
    : null;
  const firstPdName =
    planningDistricts?.features?.[0]
      ? String(
          planningDistricts.features[0].properties?.name ??
            planningDistricts.features[0].properties?.pd_name ??
            "Published planning districts"
        )
      : null;

  const [selectedPlace, setSelectedPlace] = useState<SelectedPlaceContext>({
    placeName: null,
    lat: 12.9279,
    lng: 77.5831,
    zoom: 15,
    corporationName: plainCorp,
    wardNumber: firstWardNo,
    wardName: firstWardName,
    planningDistrict: firstPdName,
    zoneCode: activeZones[0]?.properties.zone_code ?? null,
    zoneLabel: activeZones[0]?.properties.zone_label ?? null,
  });

  const [flyToTarget, setFlyToTarget] = useState<{
    lat: number;
    lng: number;
    zoom: number;
  } | null>(null);
  const [showDrafts, setShowDrafts] = useState(false);

  const availableZones = useMemo(() => {
    const map = new Map<string, string>();
    for (const z of activeZones) {
      if (!map.has(z.properties.zone_code)) {
        map.set(z.properties.zone_code, z.properties.zone_label);
      }
    }
    return Array.from(map.entries()).map(([zoneCode, zoneLabel]) => ({
      zoneCode,
      zoneLabel,
    }));
  }, [activeZones]);

  // Restore #lat,lng,zoom,place from URL hash on mount & hashchange
  useEffect(() => {
    if (typeof window === "undefined") return;
    const applyHash = () => {
      const parsed = parseMapUrlHash(window.location.hash);
      if (!parsed) return;
      const lowerPlace = (parsed.place || "").toLowerCase();
      const matchedEntry = lowerPlace
        ? initialPlaces.find((p) => p.name.toLowerCase() === lowerPlace) ??
          initialPlaces.find((p) => p.name.toLowerCase().includes(lowerPlace))
        : null;

      setFlyToTarget({
        lat: parsed.lat,
        lng: parsed.lng,
        zoom: parsed.zoom,
      });

      if (matchedEntry) {
        setSelectedPlace({
          placeName: matchedEntry.name,
          lat: parsed.lat,
          lng: parsed.lng,
          zoom: parsed.zoom,
          corporationName: formatPlainCorporationName(
            matchedEntry.corporationId,
            matchedEntry.corporationName
          ),
          wardNumber: matchedEntry.wardNumber,
          wardName: matchedEntry.wardName,
          planningDistrict: matchedEntry.planningDistrict,
          zoneCode: matchedEntry.zoneCode,
          zoneLabel: matchedEntry.zoneLabel,
        });
      } else {
        setSelectedPlace((prev) => ({
          ...prev,
          placeName: parsed.place ?? prev.placeName,
          lat: parsed.lat,
          lng: parsed.lng,
          zoom: parsed.zoom,
        }));
      }
    };
    applyHash();
    window.addEventListener("hashchange", applyHash);
    return () => window.removeEventListener("hashchange", applyHash);
  }, [initialPlaces]);

  const updateUrlHash = (next: SelectedPlaceContext) => {
    if (
      typeof window !== "undefined" &&
      next.lat !== null &&
      next.lng !== null
    ) {
      const hashStr = formatMapUrlHash({
        lat: next.lat,
        lng: next.lng,
        zoom: next.zoom,
        place: next.placeName ?? next.wardName ?? next.zoneCode,
      });
      try {
        window.history.replaceState(null, "", hashStr);
      } catch {
        // Ignore in sandboxed test environments
      }
    }
  };

  const handleSelectZone = (code: string) => {
    if (!code) {
      setSelectedPlace((prev) => ({
        ...prev,
        zoneCode: null,
        zoneLabel: null,
      }));
      return;
    }
    const matched = activeZones.find((z) => z.properties.zone_code === code);
    const label =
      matched?.properties.zone_label ??
      zoneRulesByCode[code]?.zoneLabel ??
      code;
    const next: SelectedPlaceContext = {
      ...selectedPlace,
      zoneCode: code,
      zoneLabel: label,
    };
    setSelectedPlace(next);
    updateUrlHash(next);
  };

  const handleSelectPlaceEntry = (entry: PlaceIndexEntry) => {
    const next: SelectedPlaceContext = {
      placeName: entry.name,
      lat: entry.lat,
      lng: entry.lng,
      zoom: 15,
      corporationName: formatPlainCorporationName(
        entry.corporationId,
        entry.corporationName
      ),
      wardNumber: entry.wardNumber,
      wardName: entry.wardName,
      planningDistrict: entry.planningDistrict,
      zoneCode: entry.zoneCode,
      zoneLabel: entry.zoneLabel,
    };
    setSelectedPlace(next);
    setFlyToTarget({ lat: entry.lat, lng: entry.lng, zoom: 15 });
    updateUrlHash(next);
  };

  const shareableHash =
    selectedPlace.lat !== null && selectedPlace.lng !== null
      ? formatMapUrlHash({
          lat: selectedPlace.lat,
          lng: selectedPlace.lng,
          zoom: selectedPlace.zoom,
          place:
            selectedPlace.placeName ??
            selectedPlace.wardName ??
            selectedPlace.zoneCode,
        })
      : "";

  const activeZoneRules = selectedPlace.zoneCode
    ? zoneRulesByCode[selectedPlace.zoneCode] ?? null
    : null;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_410px] lg:items-start">
      <ZoneMap
        jurisdictionId={jurisdictionId}
        zonesSourceJurisdictionId={zonesSourceJurisdictionId}
        releaseVersion={releaseVersion}
        zones={zones}
        selectedZoneCode={selectedPlace.zoneCode}
        onSelectZone={handleSelectZone}
        onSelectPlaceEntry={handleSelectPlaceEntry}
        initialPlaces={initialPlaces}
        flyToTarget={flyToTarget}
        boundary={boundary}
        gbaZones={gbaZones}
        wards={wards}
        planningDistricts={planningDistricts}
        overlays={overlays}
        geoLayers={geoLayers}
        processedSheets={processedSheets}
        showDrafts={showDrafts}
        onToggleDrafts={setShowDrafts}
      />

      <PlaceCard
        jurisdictionId={jurisdictionId}
        selectedPlace={selectedPlace}
        zoneRules={activeZoneRules}
        byelaw14Info={byelaw14Info}
        shareableHash={shareableHash}
        onSelectZoneCode={handleSelectZone}
        availableZones={availableZones}
      />
    </div>
  );
}
