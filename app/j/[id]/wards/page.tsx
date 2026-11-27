import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  fetchJurisdictionDataset,
  fetchManifest,
  fetchParameters,
  getVisibleJurisdictions,
  partitionClauseVersions,
  readPublishedJson,
} from "@/lib/data";
import { TopNav } from "@/components/TopNav";
import {
  CorporationSelector,
  formatPlainCorporationName,
} from "@/components/CorporationSelector";
import {
  computeNewestInForceInstrumentDate,
  formatLandUseZoneGapPlainLine,
} from "@/lib/plain-language";
import {
  buildZoneRulesSummaryMap,
  extractByelaw14GovernanceInfo,
} from "@/lib/zone-rules";
import type { PlaceIndexEntry, PlaceIndexPayload } from "@/lib/place-search";
import { ReportProblemLink } from "@/components/ReportProblemLink";

interface BrowseByWardPageProps {
  params: Promise<{ id: string }>;
}

export const dynamicParams = false;

export async function generateStaticParams() {
  const manifest = await fetchManifest();
  return manifest.jurisdictions.map((j) => ({ id: j.id }));
}

export default async function BrowseByWardPage({
  params,
}: BrowseByWardPageProps) {
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

  const effectiveZones =
    dataset.zones.features.length > 0
      ? dataset.zones
      : fallbackZoneDataset?.zones ?? dataset.zones;
  const effectiveClauseZoneTags =
    (dataset.clauseZoneTags?.tags?.length ?? 0) > 0
      ? dataset.clauseZoneTags?.tags ?? []
      : fallbackZoneDataset?.clauseZoneTags?.tags ?? [];

  const { activeClauses } = partitionClauseVersions(dataset.clauses);
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
    jurisdictionId: dataset.jurisdiction.id,
    zoneCodesWithLabels,
    parameterRecords: parametersPayload?.records ?? [],
    clauseZoneTags: effectiveClauseZoneTags,
    clauses: activeClauses,
    documents: dataset.documents,
    corpNameById,
  });

  const byelaw14Info = extractByelaw14GovernanceInfo(
    activeClauses,
    dataset.documents,
    dataset.jurisdiction.id
  );

  const placeIndexPayload = await readPublishedJson<PlaceIndexPayload>(
    `/data/${dataset.jurisdiction.id}/place-index.json`
  ).catch(() => null);

  const wardEntriesFromIndex: PlaceIndexEntry[] = (
    placeIndexPayload?.places ?? []
  ).filter(
    (p) =>
      p.kind === "ward" &&
      (dataset.jurisdiction.id === rootParentId ||
        p.corporationId === dataset.jurisdiction.id)
  );

  const plainCorpName = formatPlainCorporationName(
    dataset.jurisdiction.id,
    dataset.jurisdiction.name
  );
  const currentAsOfDate = computeNewestInForceInstrumentDate(dataset.documents);
  const landUseZoneGapLine = formatLandUseZoneGapPlainLine(
    partialZoneCorp?.name ?? null
  );

  // Group wards by Corporation -> Ward -> Zones present
  const wardsByCorporation = new Map<string, PlaceIndexEntry[]>();
  if (wardEntriesFromIndex.length > 0) {
    for (const w of wardEntriesFromIndex) {
      const corpLabel = formatPlainCorporationName(
        w.corporationId,
        w.corporationName
      );
      const list = wardsByCorporation.get(corpLabel) ?? [];
      list.push(w);
      wardsByCorporation.set(corpLabel, list);
    }
  } else {
    const fallbackList: PlaceIndexEntry[] = (
      dataset.wards?.features ?? []
    ).map((f) => {
      const wNo = String(f.properties?.ward_id ?? f.properties?.ward_no ?? "1");
      const wName = String(f.properties?.ward_name ?? "");
      return {
        id: `ward-${wNo}`,
        name: `Ward ${wNo} · ${wName}`,
        kind: "ward",
        categoryLabel: "Ward",
        lat: 12.9279,
        lng: 77.5831,
        corporationId: dataset.jurisdiction.id,
        corporationName: plainCorpName,
        wardNumber: wNo,
        wardName: wName,
        planningDistrict: null,
        zoneCode: null,
        zoneLabel: null,
        zonesPresent: [],
      };
    });
    wardsByCorporation.set(plainCorpName, fallbackList);
  }

  const orderedZoneSummaries = Array.from(zoneCodesWithLabels.keys())
    .map((code) => zoneRulesByCode[code])
    .filter(Boolean);

  return (
    <div className="min-h-screen bg-[#f5f3ed] text-[#080909]">
      <TopNav
        jurisdictionId={dataset.jurisdiction.id}
        jurisdictionName={dataset.jurisdiction.name}
        active="map"
        releaseVersion={dataset.release?.version}
        licence={dataset.release?.licence}
      />

      <main
        data-dataset-id={
          dataset.release?.dataset_id ?? manifest.dataset_id ?? ""
        }
        className="mx-auto max-w-5xl space-y-10 px-5 py-10"
      >
        <header className="border-b border-[#c8ccc0] pb-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Link
              href={`/j/${dataset.jurisdiction.id}`}
              className="inline-flex min-h-[44px] items-center font-mono text-xs uppercase tracking-[0.12em] text-[#080909] underline decoration-[#080909] underline-offset-4"
            >
              ← Back to interactive map
            </Link>
            <Link
              href={`/j/${dataset.jurisdiction.id}/topics`}
              className="inline-flex min-h-[44px] items-center font-mono text-xs uppercase tracking-[0.12em] text-[#5b5e56] underline decoration-[#c8ccc0] underline-offset-4 hover:text-[#080909]"
            >
              The code, by subject →
            </Link>
          </div>

          <div className="mt-2 flex flex-wrap items-baseline justify-between gap-2">
            <h1 className="text-3xl font-semibold tracking-tight text-[#080909] md:text-4xl">
              Browse by ward · {plainCorpName}
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
            Inspect corporations, wards, land-use zones present in each ward,
            and the governing rules for each zone without needing the interactive
            map.
          </p>

          {rootParentId && (
            <p className="dg-serif mt-3 border-l-2 border-[#080909] bg-[#efeee8] px-3 py-2 text-sm text-[#171917]">
              {landUseZoneGapLine}
            </p>
          )}

          <CorporationSelector
            currentId={dataset.jurisdiction.id}
            currentName={dataset.jurisdiction.name}
            pathSuffix="/wards"
            corporations={gbaJurisdictions}
          />
        </header>

        {/* Section 1: Corporation -> Ward -> Zones present */}
        <section
          aria-labelledby="wards-by-corp-heading"
          data-testid="browse-by-ward-directory"
          className="space-y-6 border-b border-[#c8ccc0] pb-10"
        >
          <div>
            <div className="dg-mono text-[#5b5e56]">
              01 / Corporations &amp; Wards
            </div>
            <h2
              id="wards-by-corp-heading"
              className="mt-1 text-2xl font-semibold tracking-tight text-[#080909]"
            >
              Corporation → Ward → Zones present
            </h2>
          </div>

          {Array.from(wardsByCorporation.entries()).map(
            ([corpTitle, wardsList]) => {
              const mappedWards = wardsList.filter(
                (w) => (w.zonesPresent?.length ?? 0) > 0
              );
              return (
                <div
                  key={corpTitle}
                  className="border border-[#c8ccc0] bg-[#efeee8] p-5"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[#c8ccc0] pb-3">
                    <h3 className="text-lg font-semibold text-[#080909]">
                      {corpTitle} ({wardsList.length} wards)
                    </h3>
                    <span className="font-mono text-xs text-[#5b5e56]">
                      {mappedWards.length > 0
                        ? `${mappedWards.length} wards with mapped land-use zones`
                        : "Land-use data not yet available"}
                    </span>
                  </div>

                  {mappedWards.length > 0 && (
                    <div className="mt-4">
                      <div className="dg-mono mb-2 text-[#080909]">
                        Wards with mapped land-use zones ({mappedWards.length})
                      </div>
                      <ul className="divide-y divide-[#c8ccc0] border border-[#c8ccc0] bg-[#f5f3ed]">
                        {mappedWards.map((w) => (
                          <li
                            key={w.id}
                            className="flex flex-col justify-between gap-2 px-4 py-3 sm:flex-row sm:items-center"
                          >
                            <div>
                              <span className="font-semibold text-[#080909]">
                                Ward {w.wardNumber} · {w.wardName}
                              </span>
                              {w.planningDistrict && (
                                <span className="ml-2 font-mono text-xs text-[#5b5e56]">
                                  (Planning District {w.planningDistrict})
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {(w.zonesPresent ?? []).map((zp) => (
                                <a
                                  key={zp.zoneCode}
                                  href={`#zone-${zp.zoneCode}`}
                                  className="border border-[#080909] bg-[#efeee8] px-2 py-0.5 font-mono text-[11px] text-[#080909] underline"
                                >
                                  {zp.zoneLabel} ({zp.zoneCode})
                                </a>
                              ))}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <details className="mt-4">
                    <summary className="inline-flex min-h-[44px] cursor-pointer items-center font-mono text-xs uppercase tracking-[0.1em] text-[#080909] underline">
                      All {wardsList.length} wards in {corpTitle}
                    </summary>
                    <ul className="mt-2 grid grid-cols-1 gap-2 border-t border-[#c8ccc0] pt-3 text-xs sm:grid-cols-2 md:grid-cols-3">
                      {wardsList.map((w) => (
                        <li
                          key={w.id}
                          className="border border-[#c8ccc0] bg-[#f5f3ed] px-3 py-2"
                        >
                          <div className="font-semibold text-[#080909]">
                            Ward {w.wardNumber} · {w.wardName}
                          </div>
                          <div className="mt-1 font-mono text-[11px] text-[#5b5e56]">
                            {w.zonesPresent && w.zonesPresent.length > 0
                              ? w.zonesPresent
                                  .map((z) => `${z.zoneLabel} (${z.zoneCode})`)
                                  .join(", ")
                              : "Land-use data not yet available here"}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </details>
                </div>
              );
            }
          )}
        </section>

        {/* Section 2: Rules for each zone */}
        <section
          aria-labelledby="rules-by-zone-heading"
          data-testid="browse-by-ward-zone-rules"
          className="space-y-6"
        >
          <div>
            <div className="dg-mono text-[#5b5e56]">
              02 / Rules for each zone
            </div>
            <h2
              id="rules-by-zone-heading"
              className="mt-1 text-2xl font-semibold tracking-tight text-[#080909]"
            >
              Rules for each land-use zone
            </h2>
            <p className="dg-serif mt-2 text-sm text-[#171917]">
              {byelaw14Info.plainLine}
            </p>
          </div>

          <div className="space-y-6">
            {orderedZoneSummaries.map((zSummary) => (
              <article
                key={zSummary.zoneCode}
                id={`zone-${zSummary.zoneCode}`}
                data-testid={`ward-zone-card-${zSummary.zoneCode}`}
                className="border border-[#080909] bg-[#efeee8] p-5"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[#c8ccc0] pb-3">
                  <h3 className="text-xl font-semibold text-[#080909]">
                    {zSummary.zoneLabel} ({zSummary.zoneCode})
                  </h3>
                  <Link
                    href={`/j/${dataset.jurisdiction.id}#12.9279,77.5831,15,${encodeURIComponent(zSummary.zoneCode)}`}
                    className="inline-flex min-h-[44px] items-center font-mono text-xs uppercase tracking-[0.12em] text-[#080909] underline"
                  >
                    Open on map →
                  </Link>
                </div>

                {!zSummary.hasLinkedRules ? (
                  <p className="dg-serif mt-3 text-sm text-[#171917]">
                    No rules linked to this zone yet.
                  </p>
                ) : (
                  <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                    {zSummary.groups.map((grp) => (
                      <section
                        key={grp.key}
                        aria-label={`${zSummary.zoneLabel} ${grp.title}`}
                        className="border border-[#c8ccc0] bg-[#f5f3ed] p-3"
                      >
                        <div className="flex items-baseline justify-between gap-2 border-b border-[#c8ccc0] pb-1.5">
                          <h4 className="font-mono text-xs font-semibold uppercase tracking-[0.1em] text-[#080909]">
                            {grp.title}
                          </h4>
                          <Link
                            href={grp.subjectHref}
                            className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-[#080909] underline"
                          >
                            {grp.title} subject →
                          </Link>
                        </div>
                        {grp.lines.length === 0 ? (
                          <p className="dg-serif mt-2 text-xs text-[#5b5e56]">
                            See the{" "}
                            <Link
                              href={grp.subjectHref}
                              className="text-[#080909] underline"
                            >
                              {grp.title} subject page
                            </Link>
                            .
                          </p>
                        ) : (
                          <ul className="mt-2 space-y-2">
                            {grp.lines.map((line) => (
                              <li key={line.id} className="text-xs">
                                <div className="flex flex-wrap items-baseline justify-between gap-2">
                                  <Link
                                    href={line.subjectHref}
                                    className="dg-serif font-medium text-[#080909] underline decoration-[#c8ccc0] underline-offset-4 hover:decoration-[#080909]"
                                  >
                                    {line.rulePlain}
                                  </Link>
                                  <span className="font-mono font-semibold text-[#080909]">
                                    {line.valuePlain}
                                  </span>
                                </div>
                                <div className="mt-0.5 flex flex-wrap items-center justify-between gap-2 font-mono text-[10.5px] text-[#5b5e56]">
                                  <span>
                                    {line.sourceDocTitle} ·{" "}
                                    <a
                                      href={line.pageLink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-[#080909] underline"
                                    >
                                      p. {line.pageNumber} ↗
                                    </a>
                                  </span>
                                  <ReportProblemLink
                                    pagePath={`/j/${dataset.jurisdiction.id}/wards`}
                                    ruleSummary={`${zSummary.zoneLabel} ${line.rulePlain}: ${line.valuePlain}`}
                                    officialPageUrl={line.pageLink}
                                  />
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}
                      </section>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
