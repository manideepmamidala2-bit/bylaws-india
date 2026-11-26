import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  fetchJurisdictionDataset,
  fetchManifest,
  fetchParameters,
  fetchResolution,
  getVisibleJurisdictions,
  partitionClauseVersions,
  slimParametersForSsr,
  type ZoneGeometry,
} from "@/lib/data";
import { TopNav } from "@/components/TopNav";
import { CorporationSelector } from "@/components/CorporationSelector";
import { AreaExplorerClient } from "@/components/AreaExplorerClient";
import { formatLandUseZoneGapPlainLine } from "@/lib/plain-language";

interface JurisdictionMapPageProps {
  params: Promise<{ id: string }>;
}

export const dynamicParams = false;

export async function generateStaticParams() {
  const manifest = await fetchManifest();
  return manifest.jurisdictions.map((j) => ({ id: j.id }));
}

export default async function JurisdictionMapPage({
  params,
}: JurisdictionMapPageProps) {
  const { id } = await params;
  const [dataset, manifest, parametersPayload, resolutionConfig] =
    await Promise.all([
      fetchJurisdictionDataset(id),
      fetchManifest(),
      fetchParameters(id),
      fetchResolution(id),
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
  const landUseZoneGapLine = formatLandUseZoneGapPlainLine(
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

  if (!release) {
    return (
      <div className="flex min-h-screen flex-col bg-[#f5f3ed] text-[#080909]">
        <TopNav
          jurisdictionId={jurisdiction.id}
          jurisdictionName={jurisdiction.name}
          active="map"
        />
        <main className="mx-auto w-full max-w-6xl px-6 py-10">
          <header className="border-b border-[#c8ccc0] pb-6">
            <div className="dg-mono">Map</div>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-[#080909]">
              Map · {jurisdiction.name}
            </h1>
          </header>
          <section
            aria-label="Publication status"
            className="mt-8 border border-[#080909] bg-[#efeee8] p-6"
          >
            <h2 className="text-lg font-semibold text-[#080909]">
              No data published yet
            </h2>
            <p className="dg-serif mt-2 max-w-2xl text-sm text-[#171917]">
              Official boundaries and land-use zones for {jurisdiction.name} are
              being acquired and verified. No map layers are published yet.
            </p>
          </section>
        </main>
      </div>
    );
  }

  const { activeClauses } = partitionClauseVersions(clauses);
  const taggedIds = new Set(
    (clauseZoneTags?.tags ?? []).map((t) => t.clause_id)
  );
  for (const lnk of amendments.links) {
    taggedIds.add(lnk.amending_clause);
    taggedIds.add(lnk.target_clause);
  }
  const explorerClauses = clauses
    .filter(
      (c) =>
        ((c.applies_to_zones && c.applies_to_zones.length > 0) ||
          taggedIds.has(c.clause_id)) &&
        c.type !== "table_row"
    )
    .slice(0, 18)
    .map((c) => ({
      ...c,
      text: c.text.slice(0, 280),
      content: null,
      intro: null,
      wrap_up: null,
      children: [],
      cross_references: [],
      tables: [],
      versions: undefined,
      citations: (c.citations ?? []).slice(0, 1).map((cit) => ({
        doc_id: cit.doc_id,
        page: cit.page,
        bbox: null,
        text_excerpt: "",
      })),
    }));
  const inForceDocsCount = documents.filter(
    (d) => d.legal_status === "in_force"
  ).length;
  const draftDocsCount = documents.filter(
    (d) => d.legal_status === "draft"
  ).length;
  const activeZonesCount = zones.features.filter(
    (z) => !z.properties.superseded_by && !z.properties.record_superseded_by
  ).length;

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
  const ssrZoneFeatures = zones.features
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
  const officialBoundaryLayer =
    geoLayers?.layers.find((l) => l.layer_id === "wards") ??
    geoLayers?.layers.find((l) => l.kind === "official_boundary");
  const accuracyMessage =
    masterPlanLayer && masterPlanLayer.accuracy_m !== null
      ? `Zone boundaries are within about ${masterPlanLayer.accuracy_m} m of street centre-lines; confirm a plot's zone with the planning authority.`
      : officialBoundaryLayer
        ? "Official corporation and ward boundaries published; confirm a plot's ward and zone with the planning authority."
        : "Zones loaded from published master plan layer; confirm a plot's zone with the planning authority.";

  return (
    <div className="flex min-h-screen flex-col bg-[#f5f3ed] text-[#080909]">
      <TopNav
        jurisdictionId={jurisdiction.id}
        jurisdictionName={jurisdiction.name}
        active="map"
        releaseVersion={release.version}
        licence={release.licence}
      />

      <div
        role="region"
        aria-label="Zone boundary accuracy notice"
        className="flex items-center gap-2.5 border-b border-[#c8ccc0] bg-[#f5f3ed] px-6 py-2 font-mono text-[10.5px] uppercase tracking-[0.12em] text-[#080909]"
      >
        <span className="dg-accent-dot" />
        <span>{accuracyMessage}</span>
      </div>

      <div className="border-b border-[#c8ccc0] bg-[#f5f3ed] px-5 py-5">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="dg-mono text-[#5b5e56]">
              Official boundaries, wards &amp; land-use zones
            </span>
            <Link
              href={`/j/${jurisdiction.id}/topics`}
              className="inline-flex min-h-[44px] items-center font-mono text-xs uppercase tracking-[0.12em] text-[#080909] underline decoration-[#080909] underline-offset-4"
            >
              ← Back to the code
            </Link>
          </div>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-[#080909] sm:text-4xl">
            Map · {jurisdiction.name}
          </h1>
          <p className="dg-serif mt-2 text-base text-[#171917]">
            Inspect official City Corporation and ward boundaries alongside
            georeferenced RMP 2015 Proposed Land Use zones.
          </p>
          {rootParentId && (
            <p
              data-testid="map-zone-gap-notice"
              className="dg-serif mt-3 border-l-2 border-[#080909] bg-[#efeee8] px-3 py-2 text-sm text-[#171917]"
            >
              {landUseZoneGapLine}
            </p>
          )}

          <CorporationSelector
            currentId={jurisdiction.id}
            currentName={jurisdiction.name}
            pathSuffix=""
            corporations={gbaJurisdictions}
          />

          <details className="mt-3 text-xs text-[#5b5e56]">
            <summary className="inline-flex min-h-[44px] cursor-pointer items-center font-mono text-[11px] uppercase tracking-[0.12em] text-[#5b5e56] underline">
              Details · Map coverage &amp; declarations ({activeZonesCount}{" "}
              zones, {inForceDocsCount} in-force sources, {draftDocsCount} draft,{" "}
              {activeClauses.length} provisions, {amendments.links.length}{" "}
              amendment links)
            </summary>
            <div className="mt-2 border border-[#c8ccc0] bg-[#efeee8] p-3 text-xs text-[#171917]">
              {declarations.not_modelled.join(" ")}
            </div>
          </details>
        </div>
      </div>

      <main className="flex flex-1 flex-col">
        <AreaExplorerClient
          jurisdictionId={jurisdiction.id}
          corporationName={jurisdiction.name}
          releaseVersion={release.version}
          zones={ssrZoneFeatures}
          clauses={explorerClauses}
          amendmentLinks={amendments.links.slice(0, 15)}
          clauseZoneTags={(clauseZoneTags?.tags ?? []).slice(0, 40)}
          boundary={stripFc(boundary)}
          gbaZones={stripFc(gbaZones)}
          wards={stripFc(wards)}
          planningDistricts={stripFc(planningDistricts)}
          overlays={stripFc(overlays)}
          geoLayers={geoLayers?.layers ?? []}
          parametersPayload={slimParametersForSsr(parametersPayload)}
          resolutionConfig={resolutionConfig}
          consolidatedPayload={
            dataset.consolidated
              ? {
                  ...dataset.consolidated,
                  documents: undefined,
                  records: dataset.consolidated.records.slice(0, 8).map((r) => ({
                    ...r,
                    tables: [],
                  })),
                }
              : null
          }
        />
      </main>
    </div>
  );
}
