import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  fetchJurisdictionDataset,
  fetchManifest,
  fetchMapVerificationMetrics,
  fetchParameters,
  getVisibleJurisdictions,
  partitionClauseVersions,
  readPublishedJson,
  type ZoneGeometry,
} from "@/lib/data";
import { TopNav } from "@/components/TopNav";
import {
  CorporationSelector,
  formatPlainCorporationName,
} from "@/components/CorporationSelector";
import { AreaExplorerClient } from "@/components/AreaExplorerClient";
import {
  computeNewestInForceInstrumentDate,
  formatLandUseZoneGapPlainLine,
  formatMapSheetFitErrorDetail,
  formatMapZoneAccuracyPlainLine,
  formatMapZoneCoveragePlainLine,
} from "@/lib/plain-language";
import {
  buildZoneRulesSummaryMap,
  extractByelaw14GovernanceInfo,
} from "@/lib/zone-rules";
import type { PlaceIndexPayload } from "@/lib/place-search";

interface JurisdictionMapPageProps {
  params: Promise<{ id: string }>;
}

export const dynamicParams = false;

export async function generateStaticParams() {
  const manifest = await fetchManifest();
  return manifest.jurisdictions.map((j) => ({ id: j.id }));
}

export async function generateMetadata({
  params,
}: JurisdictionMapPageProps): Promise<Metadata> {
  const { id } = await params;
  const dataset = await fetchJurisdictionDataset(id).catch(() => null);
  const name = dataset?.jurisdiction.name ?? id;
  const title = `Map · ${name} · Bylaw One`;
  const desc = `Interactive map of official boundaries, wards, and master plan land-use zones with governing rules by zone for ${name}.`;
  return {
    title,
    description: desc,
    openGraph: {
      title,
      description: desc,
      images: [
        `/api/og?title=${encodeURIComponent(title)}&subtitle=${encodeURIComponent(desc)}`,
      ],
    },
  };
}

export default async function JurisdictionMapPage({
  params,
}: JurisdictionMapPageProps) {
  const { id } = await params;
  const [dataset, manifest, parametersPayload] = await Promise.all([
    fetchJurisdictionDataset(id),
    fetchManifest(),
    fetchParameters(id),
  ]);
  if (!dataset) {
    notFound();
  }
  const allVisible = getVisibleJurisdictions(manifest);
  const rootParentId =
    dataset.jurisdiction.parent ??
    (allVisible.some((j) => j.parent === dataset.jurisdiction.id)
      ? dataset.jurisdiction.id
      : null);
  const parentJurisdiction = rootParentId
    ? allVisible.find((j) => j.id === rootParentId) ?? null
    : null;
  const gbaJurisdictions = rootParentId
    ? allVisible.filter(
        (j) => j.id === rootParentId || j.parent === rootParentId
      )
    : [];
  const partialZoneCorp = allVisible.find(
    (j) =>
      j.parent === rootParentId &&
      j.releases.some(
        (rel) =>
          Boolean(rel.files?.planning_districts) && Boolean(rel.files?.zones)
      )
  );

  const fallbackZoneDataset =
    dataset.zones.features.length === 0 &&
    partialZoneCorp &&
    partialZoneCorp.id !== id
      ? await fetchJurisdictionDataset(partialZoneCorp.id).catch(() => null)
      : null;

  const landUseZoneGapLine = formatLandUseZoneGapPlainLine(
    partialZoneCorp?.name ?? null
  );
  const verificationMetrics = await fetchMapVerificationMetrics(
    id,
    partialZoneCorp?.id ?? null,
    rootParentId
  );

  const regionName =
    parentJurisdiction?.aliases?.[2] ??
    parentJurisdiction?.name ??
    dataset.jurisdiction.name;
  const coverageStatement = formatMapZoneCoveragePlainLine(
    verificationMetrics?.coveragePctOfParent ?? null,
    regionName,
    partialZoneCorp?.name ?? null
  );

  const {
    jurisdiction,
    release,
    documents,
    clauses,
    amendments,
    zones,
    boundary,
    gbaZones,
    wards,
    planningDistricts,
    overlays,
    geoLayers,
    clauseZoneTags,
    declarations,
  } = dataset;

  const effectiveZones =
    zones.features.length > 0
      ? zones
      : fallbackZoneDataset?.zones ?? zones;
  const effectiveOverlays =
    (overlays?.features?.length ?? 0) > 0
      ? overlays
      : fallbackZoneDataset?.overlays ?? overlays;
  const effectiveClauseZoneTags =
    (clauseZoneTags?.tags?.length ?? 0) > 0
      ? clauseZoneTags?.tags ?? []
      : fallbackZoneDataset?.clauseZoneTags?.tags ?? [];
  const zonesSourceJurisdictionId =
    zones.features.length > 0
      ? jurisdiction.id
      : partialZoneCorp?.id ?? jurisdiction.id;

  const plainCorpName = formatPlainCorporationName(
    jurisdiction.id,
    jurisdiction.name
  );
  const currentAsOfDate = computeNewestInForceInstrumentDate(documents);

  if (!release) {
    return (
      <div className="bg-[#f5f3ed] text-[#080909]">
        <TopNav
          jurisdictionId={jurisdiction.id}
          jurisdictionName={jurisdiction.name}
          active="map"
        />
        <main className="mx-auto max-w-5xl space-y-10 px-5 py-10">
          <header className="border-b border-[#c8ccc0] pb-6">
            <div className="dg-mono text-[#5b5e56]">Map</div>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-[#080909] md:text-4xl">
              Map · {plainCorpName}
            </h1>
          </header>
          <section
            aria-label="Publication status"
            className="border border-[#080909] bg-[#efeee8] p-6"
          >
            <h2 className="text-lg font-semibold text-[#080909]">
              No data published yet
            </h2>
            <p className="dg-serif mt-2 max-w-2xl text-sm text-[#171917]">
              Official boundaries and land-use zones for {plainCorpName} are
              being acquired and verified. No map layers are published yet.
            </p>
          </section>
        </main>
      </div>
    );
  }

  const { activeClauses } = partitionClauseVersions(clauses);
  const inForceDocsCount = documents.filter(
    (d) => d.legal_status === "in_force"
  ).length;
  const draftDocsCount = documents.filter(
    (d) => d.legal_status === "draft"
  ).length;
  const activeZonesCount = effectiveZones.features.filter(
    (z) => !z.properties.superseded_by && !z.properties.record_superseded_by
  ).length;

  const zoneCodesWithLabels = new Map<string, string>();
  for (const z of effectiveZones.features) {
    if (!z.properties.superseded_by && !z.properties.record_superseded_by) {
      zoneCodesWithLabels.set(z.properties.zone_code, z.properties.zone_label);
    }
  }

  const corpNameById = new Map<string, string>(
    allVisible.map((j) => [j.id, formatPlainCorporationName(j.id, j.name)])
  );

  const zoneRulesByCode = buildZoneRulesSummaryMap({
    jurisdictionId: jurisdiction.id,
    zoneCodesWithLabels,
    parameterRecords: parametersPayload?.records ?? [],
    clauseZoneTags: effectiveClauseZoneTags,
    clauses: activeClauses,
    documents,
    corpNameById,
  });

  const byelaw14Info = extractByelaw14GovernanceInfo(
    activeClauses,
    documents,
    jurisdiction.id
  );

  const placeIndexPayload = await readPublishedJson<PlaceIndexPayload>(
    `/data/${jurisdiction.id}/place-index.json`
  ).catch(() => null);
  const ssrInitialPlaces = (placeIndexPayload?.places ?? [])
    .filter((p) => p.kind === "locality" && p.zoneCode)
    .slice(0, 12);

  // Strip heavy vertex coordinate arrays from SSR props so HTML stays <= 300 KB;
  // ZoneMap loads the full GeoJSON geometry on the client from /data/<id>/<version>/*.geojson.
  const emptyPoly = {
    type: "Polygon",
    coordinates: [],
  } as unknown as ZoneGeometry;
  const stripFc = (fc: typeof boundary | null, maxFeatures = 72) =>
    fc
      ? {
          ...fc,
          features: fc.features.slice(0, maxFeatures).map((f) => {
            const p = { ...(f.properties ?? {}) };
            delete p.source_attribution;
            delete p.verification_note;
            delete p.georef_run;
            return {
              ...f,
              properties: p,
              geometry: emptyPoly,
            };
          }),
        }
      : null;
  const seenZoneCode = new Set<string>();
  const ssrZoneFeatures = effectiveZones.features
    .filter((z) => {
      const k = z.properties.zone_code;
      if (seenZoneCode.has(k) && seenZoneCode.size >= 12) return false;
      seenZoneCode.add(k);
      return true;
    })
    .slice(0, 12)
    .map((z) => ({ ...z, geometry: emptyPoly }));

  const masterPlanLayer = geoLayers?.layers.find(
    (l) => l.kind === "master_plan_zone"
  );
  const sheetOverlay = masterPlanLayer?.sheet_overlay ?? null;
  const effectiveMedianOffsetM =
    verificationMetrics?.roadMedianOffsetM ??
    sheetOverlay?.road_median_offset_m ??
    null;
  const effectiveP90OffsetM =
    verificationMetrics?.roadP90OffsetM ??
    sheetOverlay?.road_p90_offset_m ??
    null;
  const effectiveGridFitRmseM =
    verificationMetrics?.gridFitRmseM ?? sheetOverlay?.rmse_m ?? null;
  const effectiveLooRmseM =
    verificationMetrics?.looRmseM ?? sheetOverlay?.loo_rmse_m ?? null;

  const accuracyStatement =
    formatMapZoneAccuracyPlainLine(
      effectiveMedianOffsetM,
      effectiveP90OffsetM
    ) ??
    "Official corporation and ward boundaries published; confirm a plot's ward and zone with the planning authority.";
  const sheetFitDetailLine = formatMapSheetFitErrorDetail(
    effectiveGridFitRmseM,
    effectiveLooRmseM
  );

  return (
    <div className="bg-[#f5f3ed] text-[#080909]">
      <TopNav
        jurisdictionId={jurisdiction.id}
        jurisdictionName={jurisdiction.name}
        active="map"
        releaseVersion={release.version}
        licence={release.licence}
      />

      <main
        data-dataset-id={release.dataset_id ?? manifest.dataset_id ?? ""}
        className="mx-auto max-w-6xl space-y-8 px-5 py-10"
      >
        <header className="border-b border-[#c8ccc0] pb-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Link
              href={`/j/${jurisdiction.id}/topics`}
              className="inline-flex min-h-[44px] items-center font-mono text-xs uppercase tracking-[0.12em] text-[#5b5e56] no-underline hover:text-[#080909]"
            >
              ← The code, by subject
            </Link>
            <div className="flex flex-wrap items-center gap-4">
              <Link
                href={`/j/${jurisdiction.id}/wards`}
                data-testid="browse-by-ward-link"
                className="inline-flex min-h-[44px] items-center font-mono text-xs uppercase tracking-[0.12em] text-[#080909] underline decoration-[#080909] underline-offset-4"
              >
                Browse by ward (without map) →
              </Link>
              <Link
                href={`/j/${jurisdiction.id}/topics/land-use`}
                className="inline-flex min-h-[44px] items-center font-mono text-xs uppercase tracking-[0.12em] text-[#080909] underline decoration-[#080909] underline-offset-4"
              >
                Land use rules →
              </Link>
            </div>
          </div>

          <div className="mt-2 flex flex-wrap items-baseline justify-between gap-2">
            <h1 className="text-3xl font-semibold tracking-tight text-[#080909] md:text-4xl">
              Map · {plainCorpName}
            </h1>
            {currentAsOfDate && (
              <span
                data-testid="current-as-of-date"
                className="font-mono text-xs uppercase tracking-[0.12em] text-[#5b5e56]"
              >
                Current as of {currentAsOfDate}
              </span>
            )}
          </div>
          <p className="dg-serif mt-2 text-base leading-relaxed text-[#171917]">
            Official City Corporation and ward boundaries, with master plan
            land-use zones and governing rules by zone where map sheets have
            been processed.
          </p>

          {rootParentId && (
            <div className="mt-3 space-y-2 border-l-2 border-[#080909] bg-[#efeee8] px-3 py-2 text-sm text-[#171917]">
              <p data-testid="map-zone-gap-notice" className="dg-serif">
                {landUseZoneGapLine}
              </p>
              {coverageStatement && (
                <p data-testid="map-coverage-statement" className="dg-serif">
                  {coverageStatement}
                </p>
              )}
            </div>
          )}

          <div
            role="region"
            aria-label="Zone boundary accuracy notice"
            data-testid="map-accuracy-statement"
            className="mt-3 border border-[#c8ccc0] bg-[#efeee8] px-4 py-3"
          >
            <div className="dg-mono text-[#5b5e56]">Positional accuracy</div>
            <p className="dg-serif mt-1 text-sm leading-relaxed text-[#080909]">
              {accuracyStatement}
            </p>
            <details className="mt-2">
              <summary className="inline-flex min-h-[44px] cursor-pointer items-center font-mono text-[11px] uppercase tracking-[0.12em] text-[#5b5e56] underline hover:text-[#080909]">
                Details · How map accuracy is measured ({activeZonesCount}{" "}
                zones, {inForceDocsCount} in-force sources, {draftDocsCount}{" "}
                draft, {activeClauses.length} provisions,{" "}
                {amendments.links.length} amendment links)
              </summary>
              <div className="mt-2 space-y-2 border-t border-[#c8ccc0] pt-2 text-xs text-[#171917]">
                {effectiveMedianOffsetM !== null &&
                  effectiveP90OffsetM !== null && (
                    <p className="dg-serif">
                      Street centre-line check: compared against{" "}
                      {verificationMetrics?.roadSegmentCount
                        ? `${verificationMetrics.roadSegmentCount} OpenStreetMap road segments`
                        : "OpenStreetMap road centre-lines"}{" "}
                      (median offset{" "}
                      <span className="font-mono">
                        {effectiveMedianOffsetM} m
                      </span>
                      , 90th-percentile offset{" "}
                      <span className="font-mono">{effectiveP90OffsetM} m</span>
                      ). Confirm a plot&apos;s ward and zone with the planning
                      authority.
                    </p>
                  )}
                {sheetFitDetailLine && (
                  <p
                    data-testid="map-sheet-fit-error-detail"
                    className="font-mono text-xs text-[#5b5e56]"
                  >
                    {sheetFitDetailLine}
                  </p>
                )}
                {declarations.not_modelled.length > 0 && (
                  <p className="dg-serif text-xs text-[#5b5e56]">
                    {declarations.not_modelled.join(" ")}
                  </p>
                )}
              </div>
            </details>
          </div>

          <CorporationSelector
            currentId={jurisdiction.id}
            currentName={jurisdiction.name}
            pathSuffix=""
            corporations={gbaJurisdictions}
          />
        </header>

        <AreaExplorerClient
          jurisdictionId={jurisdiction.id}
          zonesSourceJurisdictionId={zonesSourceJurisdictionId}
          corporationName={jurisdiction.name}
          releaseVersion={release.version}
          zones={ssrZoneFeatures}
          boundary={stripFc(boundary)}
          gbaZones={stripFc(gbaZones)}
          wards={stripFc(wards)}
          planningDistricts={stripFc(planningDistricts)}
          overlays={stripFc(effectiveOverlays)}
          geoLayers={geoLayers?.layers ?? []}
          processedSheets={verificationMetrics?.sheets ?? []}
          initialPlaces={ssrInitialPlaces}
          zoneRulesByCode={zoneRulesByCode}
          byelaw14Info={byelaw14Info}
        />
      </main>
    </div>
  );
}
