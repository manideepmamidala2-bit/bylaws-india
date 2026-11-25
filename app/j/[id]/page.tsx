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
import { AreaExplorerClient } from "@/components/AreaExplorerClient";

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
          <header className="border-b border-[#080909] pb-6">
            <div className="dg-mono">{jurisdiction.id} · Map</div>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-[#080909]">
              {jurisdiction.name}
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
  const accuracyMessage = masterPlanLayer
    ? `${masterPlanLayer.method}${
        masterPlanLayer.accuracy_m !== null
          ? ` (±${masterPlanLayer.accuracy_m} m)`
          : ""
      } · Source: ${masterPlanLayer.source} · Confirm a plot's zone with the planning authority.`
    : officialBoundaryLayer
      ? `Boundaries from ${officialBoundaryLayer.source} · Confirm a plot's ward and zone with the planning authority.`
      : "Zones loaded from published master plan layer · Confirm a plot's zone with the planning authority.";

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

      <div className="border-b border-[#080909] bg-[#f5f3ed] px-6 py-5">
        <div className="dg-mono">
          {jurisdiction.id}
          {jurisdiction.aliases && jurisdiction.aliases.length > 0
            ? ` · ${jurisdiction.aliases.slice(0, 5).join(" · ")}`
            : ""}
        </div>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-[#080909] sm:text-4xl">
          {jurisdiction.name}
        </h1>
        {gbaJurisdictions.length > 1 && (
          <div
            aria-label="City corporation selector"
            className="mt-3 flex flex-wrap items-center gap-2 font-mono text-[11px] uppercase tracking-[0.12em]"
          >
            <span className="text-[#5b5e56]">Corporation View:</span>
            {gbaJurisdictions.map((j) => {
              const isCurrent = j.id === jurisdiction.id;
              return (
                <Link
                  key={j.id}
                  href={`/j/${j.id}`}
                  aria-current={isCurrent ? "page" : undefined}
                  className={
                    isCurrent
                      ? "border border-[#080909] bg-[#080909] px-2.5 py-1 text-[#f5f3ed] no-underline"
                      : "border border-[#080909] bg-[#efeee8] px-2.5 py-1 text-[#080909] no-underline hover:bg-[#e5e6de]"
                  }
                >
                  {j.name}
                </Link>
              );
            })}
          </div>
        )}
        <div className="mt-3 flex flex-wrap gap-6 font-mono text-[11px] uppercase tracking-[0.12em] text-[#5b5e56]">
          <span>
            Sources{" "}
            <strong className="font-semibold text-[#080909]">
              {inForceDocsCount} in force · {draftDocsCount} draft ·{" "}
              {documents.length} total
            </strong>
          </span>
          <span>
            Clauses{" "}
            <strong className="font-semibold text-[#080909]">
              {activeClauses.length}
            </strong>
          </span>
          <span>
            Zones{" "}
            <strong className="font-semibold text-[#080909]">
              {activeZonesCount}
            </strong>
          </span>
          <span>
            Amendment links{" "}
            <strong className="font-semibold text-[#080909]">
              {amendments.links.length}
            </strong>
          </span>
        </div>
      </div>

      <div className="border-b border-[#c8ccc0] bg-[#efeee8] px-6 py-2.5 text-xs text-[#5b5e56]">
        <span className="mr-2 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-[#080909]">
          COVERAGE &amp; DECLARATIONS
        </span>
        <span className="dg-serif text-sm text-[#171917]">
          {declarations.known_gaps && declarations.known_gaps.length > 0
            ? `${declarations.known_gaps[0].description} `
            : ""}
          Not modelled: {declarations.not_modelled.join("; ") || "None"}.
          {declarations.contested_status &&
          declarations.contested_status.length > 0
            ? ` Contested status (${declarations.contested_status.length}): ${declarations.contested_status
                .map((c) => `${c.title} (status not confirmed)`)
                .join(", ")}.`
            : ""}
        </span>
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
