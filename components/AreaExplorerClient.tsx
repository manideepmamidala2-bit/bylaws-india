"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
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
import { formatPlainCorporationName } from "./CorporationSelector";

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

  const plainCorp = formatPlainCorporationName(
    jurisdictionId,
    corporationName
  );
  const firstPdName = String(
    planningDistricts?.features?.[0]?.properties?.name ??
      planningDistricts?.features?.[0]?.properties?.pd_name ??
      "Published planning districts"
  );
  const wardsCount = wards?.features?.length ?? 0;

  return (
    <div className="grid flex-1 grid-cols-1 lg:grid-cols-[1fr_440px]">
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
        {/* Location summary panel: area, ward, corporation and zone only (no plot inputs or plot answers) */}
        <section
          aria-label="Selected area, ward, corporation and zone"
          data-testid="map-location-summary"
          className="border border-[#080909] bg-[#efeee8] p-4"
        >
          <div className="dg-mono text-[#5b5e56]">Location &amp; zone</div>
          <dl className="mt-3 grid grid-cols-2 gap-3 text-xs">
            <div>
              <dt className="dg-mono text-[10px] text-[#5b5e56]">
                Corporation
              </dt>
              <dd className="mt-0.5 font-medium text-[#080909]">{plainCorp}</dd>
            </div>
            <div>
              <dt className="dg-mono text-[10px] text-[#5b5e56]">Area</dt>
              <dd className="mt-0.5 font-medium text-[#080909]">
                {firstPdName}
              </dd>
            </div>
            <div>
              <dt className="dg-mono text-[10px] text-[#5b5e56]">Wards</dt>
              <dd className="mt-0.5 font-medium text-[#080909]">
                {wardsCount > 0
                  ? `${wardsCount} wards (click map or use About this map to inspect)`
                  : "Official ward boundary"}
              </dd>
            </div>
            <div>
              <dt className="dg-mono text-[10px] text-[#5b5e56]">
                Land-use zone
              </dt>
              <dd className="mt-0.5 font-medium text-[#080909]">
                {selectedZoneLabel || "Click a zone on the map"}
              </dd>
            </div>
          </dl>

          <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-[#c8ccc0] pt-3 font-mono text-xs uppercase tracking-[0.12em]">
            <Link
              href={`/j/${jurisdictionId}/topics`}
              className="inline-flex min-h-[44px] items-center text-[#080909] underline decoration-[#080909] underline-offset-4"
            >
              ← Back to the code
            </Link>
            <Link
              href={`/j/${jurisdictionId}/topics/land-use`}
              className="inline-flex min-h-[44px] items-center text-[#5b5e56] underline decoration-[#c8ccc0] underline-offset-4 hover:text-[#080909]"
            >
              Land use rules →
            </Link>
          </div>
        </section>

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
