import React from "react";
import Link from "next/link";
import {
  fetchDeclarations,
  fetchJurisdictionDataset,
  fetchManifest,
  fetchParameters,
  fetchResolution,
  getVisibleJurisdictions,
  isWithdrawnRelease,
  slimParametersForSsr,
  type JurisdictionSummary,
  type ReleaseManifest,
  type ZoneGeometry,
} from "@/lib/data";
import { TopNav } from "@/components/TopNav";
import { AreaExplorerClient } from "@/components/AreaExplorerClient";

export interface HomePageProps {
  manifest: ReleaseManifest;
  visibleJurisdictions: JurisdictionSummary[];
}

export async function getHomePageProps(
  customFetch?: typeof fetch
): Promise<HomePageProps> {
  const manifest = await fetchManifest(customFetch);
  const visibleJurisdictions = getVisibleJurisdictions(manifest);
  return {
    manifest,
    visibleJurisdictions,
  };
}

function hasPublishedRelease(item: JurisdictionSummary): boolean {
  if (!item.latest_release) {
    return false;
  }
  return item.releases.some((rel) => !isWithdrawnRelease(rel));
}

export default async function JurisdictionPickerPage() {
  const { visibleJurisdictions } = await getHomePageProps();
  const primaryJurisdiction =
    visibleJurisdictions.find((j) =>
      j.releases.some((rel) => isWithdrawnRelease(rel))
    ) ?? visibleJurisdictions[0];
  const parentJurisdiction =
    visibleJurisdictions.find((j) =>
      visibleJurisdictions.some((child) => child.parent === j.id)
    ) ?? primaryJurisdiction;
  const childCorporations = parentJurisdiction
    ? visibleJurisdictions.filter((j) => j.parent === parentJurisdiction.id)
    : [];
  const withdrawnRelease = primaryJurisdiction?.releases.find((rel) =>
    isWithdrawnRelease(rel)
  );

  const hasActiveDataset =
    primaryJurisdiction && hasPublishedRelease(primaryJurisdiction);
  const [primaryDecl, dataset, parametersPayload, resolutionConfig] =
    hasActiveDataset
      ? await Promise.all([
          fetchDeclarations(primaryJurisdiction.id).catch(() => null),
          fetchJurisdictionDataset(primaryJurisdiction.id).catch(() => null),
          fetchParameters(primaryJurisdiction.id).catch(() => null),
          fetchResolution(primaryJurisdiction.id).catch(() => null),
        ])
      : [null, null, null, null];

  const primaryGapNote = primaryDecl?.known_gaps?.[0]?.description ?? null;

  const emptyPoly = {
    type: "Polygon",
    coordinates: [],
  } as unknown as ZoneGeometry;
  const stripFc = (fc: NonNullable<typeof dataset>["boundary"] | null) =>
    fc
      ? {
          ...fc,
          features: fc.features.slice(0, 72).map((f) => {
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
  const ssrZones = (dataset?.zones.features ?? [])
    .filter((z) => {
      const k = z.properties.zone_code;
      if (seenZoneCode.has(k) && seenZoneCode.size >= 12) return false;
      seenZoneCode.add(k);
      return true;
    })
    .slice(0, 12)
    .map((z) => ({ ...z, geometry: emptyPoly }));
  const ssrClauses = (dataset?.clauses ?? [])
    .filter(
      (c) =>
        c.applies_to_zones &&
        c.applies_to_zones.length > 0 &&
        c.type !== "table_row"
    )
    .slice(0, 14)
    .map((c) => ({
      ...c,
      text: c.text.slice(0, 260),
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

  return (
    <div className="min-h-screen bg-[#f5f3ed] text-[#080909]">
      <TopNav
        jurisdictionId={primaryJurisdiction?.id ?? parentJurisdiction?.id}
        jurisdictionName={primaryJurisdiction?.name ?? parentJurisdiction?.name}
        active="home"
        releaseVersion={
          primaryJurisdiction?.latest_release ??
          parentJurisdiction?.latest_release ??
          undefined
        }
      />

      {/* One-line introduction + Full-width above-the-fold Map & Plot Card (Part 5) */}
      <div className="border-b border-[#080909] bg-[#efeee8] px-6 py-2.5">
        <p className="dg-serif text-sm text-[#080909]">
          Find what may be built on a plot from the consolidated building
          bye-laws and master plan zoning regulations, with every answer traced
          to the official text and page.
        </p>
      </div>

      {dataset && dataset.release && (
        <section
          aria-label="Above-the-fold interactive map and plot resolver"
          className="w-full border-b border-[#080909]"
        >
          <AreaExplorerClient
            jurisdictionId={dataset.jurisdiction.id}
            corporationName={dataset.jurisdiction.name}
            releaseVersion={dataset.release.version}
            zones={ssrZones}
            clauses={ssrClauses}
            amendmentLinks={dataset.amendments.links.slice(0, 12)}
            clauseZoneTags={(dataset.clauseZoneTags?.tags ?? []).slice(0, 30)}
            boundary={stripFc(dataset.boundary)}
            gbaZones={stripFc(dataset.gbaZones)}
            wards={stripFc(dataset.wards)}
            planningDistricts={stripFc(dataset.planningDistricts)}
            overlays={stripFc(dataset.overlays)}
            geoLayers={dataset.geoLayers?.layers ?? []}
            parametersPayload={slimParametersForSsr(parametersPayload)}
            resolutionConfig={resolutionConfig}
            consolidatedPayload={
              dataset.consolidated
                ? {
                    ...dataset.consolidated,
                    documents: undefined,
                    records: dataset.consolidated.records
                      .slice(0, 8)
                      .map((r) => ({ ...r, tables: [] })),
                  }
                : null
            }
          />
        </section>
      )}

      <main className="mx-auto max-w-6xl px-6 py-8">
        <header className="border-b border-[#080909] pb-6">
          <div className="dg-mono">
            Open Regulatory Dataset · CC BY 4.0 Data · Apache-2.0 Code
          </div>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-[#080909]">
            Structured Building Bylaws
          </h1>
          <p className="dg-serif mt-2 max-w-3xl text-sm leading-relaxed text-[#171917]">
            Consolidated municipal building bye-laws, master plan zoning
            regulations, and georeferenced land-use maps.
          </p>
        </header>

        {parentJurisdiction && childCorporations.length > 0 && (
          <section
            aria-label="City corporation picker"
            className="mt-6 border border-[#080909] bg-[#efeee8] p-5"
          >
            <div className="dg-mono">
              {parentJurisdiction.name} · {childCorporations.length} City
              Corporations
            </div>
            <h2 className="mt-1 text-lg font-semibold tracking-tight text-[#080909]">
              Select a City Corporation
            </h2>
            <p className="dg-serif mt-1 max-w-3xl text-sm text-[#171917]">
              Base building bye-laws and zoning regulations are shared across{" "}
              {parentJurisdiction.name}, while each City Corporation has its own
              2026 Building (Amendment) Bye-laws.
            </p>
            <div className="mt-3 flex flex-wrap gap-2 font-mono text-xs uppercase tracking-[0.12em]">
              <Link
                href={`/j/${parentJurisdiction.id}`}
                className="border border-[#080909] bg-[#080909] px-3 py-1.5 text-[#f5f3ed] no-underline"
              >
                All Corporations Map ({parentJurisdiction.name})
              </Link>
              {childCorporations.map((corp) => (
                <Link
                  key={corp.id}
                  href={`/j/${corp.id}`}
                  className="border border-[#080909] bg-[#f5f3ed] px-3 py-1.5 text-[#080909] no-underline hover:bg-[#e5e6de]"
                >
                  {corp.name}
                </Link>
              ))}
            </div>
          </section>
        )}

        <section
          aria-label="Project status"
          className="mt-6 border border-[#080909] bg-[#efeee8] p-5"
        >
          <div className="dg-mono">Current Status</div>
          <h2 className="mt-1 text-lg font-semibold tracking-tight text-[#080909]">
            {primaryJurisdiction && withdrawnRelease
              ? `Release ${withdrawnRelease.version} for ${primaryJurisdiction.name} withdrawn; consolidated dataset published`
              : "Consolidated dataset and source register"}
          </h2>
          <p className="dg-serif mt-1 max-w-3xl text-sm leading-relaxed text-[#171917]">
            {primaryJurisdiction && withdrawnRelease
              ? `The initial release (${withdrawnRelease.version}) for ${primaryJurisdiction.name} has been withdrawn (${withdrawnRelease.withdrawn_reason}). Verified source documents, consolidated texts, and parameters are published below.`
              : "Verified source documents, consolidated texts, and parameters are published below."}
          </p>
          {primaryGapNote && (
            <p className="dg-serif mt-2 max-w-3xl border-l-2 border-[#080909] pl-3 text-xs text-[#080909]">
              {primaryGapNote}
            </p>
          )}
        </section>

        <section aria-label="Available jurisdictions" className="mt-6">
          <div className="dg-mono mb-3">
            Jurisdictions ({visibleJurisdictions.length})
          </div>

          {visibleJurisdictions.length === 0 ? (
            <p className="text-sm text-[#5b5e56]">
              No jurisdictions published in manifest.
            </p>
          ) : (
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {visibleJurisdictions.map((item) => {
                const isPublished = hasPublishedRelease(item);
                return (
                  <li
                    key={item.id}
                    className="border border-[#080909] bg-[#f5f3ed] p-4"
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <h2 className="text-base font-semibold text-[#080909]">
                        {item.name}
                      </h2>
                      <span className="border border-[#080909] bg-[#efeee8] px-2 py-0.5 font-mono text-xs text-[#080909]">
                        {isPublished
                          ? `v${item.latest_release}`
                          : "No data published yet"}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2 font-mono text-[11px] uppercase tracking-[0.12em]">
                      <Link
                        href={`/j/${item.id}`}
                        className="border border-[#080909] bg-[#080909] px-2.5 py-1 text-[#f5f3ed] no-underline"
                      >
                        Map
                      </Link>
                      <Link
                        href={`/j/${item.id}/sources`}
                        className="border border-[#080909] bg-[#f5f3ed] px-2.5 py-1 text-[#080909] no-underline hover:bg-[#efeee8]"
                      >
                        Sources
                      </Link>
                      <Link
                        href={`/j/${item.id}/clauses`}
                        className="border border-[#080909] bg-[#f5f3ed] px-2.5 py-1 text-[#080909] no-underline hover:bg-[#efeee8]"
                      >
                        Documents
                      </Link>
                      <Link
                        href={`/j/${item.id}/timeline`}
                        className="border border-[#080909] bg-[#f5f3ed] px-2.5 py-1 text-[#080909] no-underline hover:bg-[#efeee8]"
                      >
                        Timeline
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
