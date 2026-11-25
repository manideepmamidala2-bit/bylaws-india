"use client";

import React, { useMemo, useState } from "react";
import type {
  AmendmentLink,
  ClauseNode,
  ClauseZoneTagEntry,
  GenericFeatureCollection,
  GeoLayerEntry,
  JurisdictionConsolidated,
  JurisdictionParameters,
  StatutoryResolutionConfig,
  ZoneFeature,
} from "@/lib/data";
import { ZoneMap } from "./ZoneMap";
import { ClausePanel } from "./ClausePanel";
import { PlotCard } from "./PlotCard";

interface AreaExplorerClientProps {
  jurisdictionId: string;
  corporationName?: string;
  releaseVersion?: string;
  zones: ZoneFeature[];
  clauses: ClauseNode[];
  amendmentLinks: AmendmentLink[];
  clauseZoneTags: ClauseZoneTagEntry[];
  boundary: GenericFeatureCollection | null;
  gbaZones: GenericFeatureCollection | null;
  wards: GenericFeatureCollection | null;
  planningDistricts: GenericFeatureCollection | null;
  overlays: GenericFeatureCollection | null;
  geoLayers: GeoLayerEntry[];
  parametersPayload?: JurisdictionParameters | null;
  resolutionConfig?: StatutoryResolutionConfig | null;
  consolidatedPayload?: JurisdictionConsolidated | null;
}

export function AreaExplorerClient({
  jurisdictionId,
  corporationName,
  releaseVersion,
  zones,
  clauses,
  amendmentLinks,
  clauseZoneTags,
  boundary,
  gbaZones,
  wards,
  planningDistricts,
  overlays,
  geoLayers,
  parametersPayload = null,
  resolutionConfig = null,
  consolidatedPayload = null,
}: AreaExplorerClientProps) {
  const activeZones = useMemo(
    () =>
      zones.filter(
        (z) => !z.properties.superseded_by && !z.properties.record_superseded_by
      ),
    [zones]
  );

  const [selectedZoneCode, setSelectedZoneCode] = useState<string | null>(
    activeZones[0]?.properties.zone_code ?? null
  );
  const [showDrafts, setShowDrafts] = useState(false);

  const selectedZoneLabel = useMemo(() => {
    if (!selectedZoneCode) return null;
    const matched = activeZones.find(
      (z) => z.properties.zone_code === selectedZoneCode
    );
    return matched?.properties.zone_label ?? selectedZoneCode;
  }, [activeZones, selectedZoneCode]);

  const handleSelectZone = (code: string) => {
    setSelectedZoneCode((prev) => (code === "" || prev === code ? null : code));
  };

  return (
    <div className="grid flex-1 grid-cols-1 lg:grid-cols-[1fr_460px]">
      <div className="flex flex-col">
        <ZoneMap
          jurisdictionId={jurisdictionId}
          releaseVersion={releaseVersion}
          zones={zones}
          selectedZoneCode={selectedZoneCode}
          onSelectZone={handleSelectZone}
          boundary={boundary}
          gbaZones={gbaZones}
          wards={wards}
          planningDistricts={planningDistricts}
          overlays={overlays}
          geoLayers={geoLayers}
          showDrafts={showDrafts}
          onToggleDrafts={setShowDrafts}
        />
      </div>
      <div className="max-h-[880px] space-y-4 overflow-y-auto border-l border-[#080909] bg-[#f5f3ed] p-4">
        <PlotCard
          jurisdictionId={jurisdictionId}
          corporationName={corporationName ?? jurisdictionId}
          parametersPayload={parametersPayload}
          resolutionConfig={resolutionConfig}
          consolidatedPayload={consolidatedPayload}
          selectedZoneCode={selectedZoneCode}
          selectedZoneLabel={selectedZoneLabel}
          onSelectZone={handleSelectZone}
        />
        <ClausePanel
          selectedZoneCode={selectedZoneCode}
          selectedZoneLabel={selectedZoneLabel}
          clauses={clauses}
          showDrafts={showDrafts}
          amendmentLinks={amendmentLinks}
          clauseZoneTags={clauseZoneTags}
          jurisdictionId={jurisdictionId}
        />
      </div>
    </div>
  );
}
