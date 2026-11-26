import React from "react";
import { notFound } from "next/navigation";
import {
  fetchJurisdictionDataset,
  fetchManifest,
  getVisibleJurisdictions,
} from "@/lib/data";
import { TopNav } from "@/components/TopNav";
import { CorporationSelector } from "@/components/CorporationSelector";
import { WhatChangedClient } from "@/components/WhatChangedClient";

interface TimelinePageProps {
  params: Promise<{ id: string }>;
}

export const dynamicParams = false;

export async function generateStaticParams() {
  const manifest = await fetchManifest();
  return manifest.jurisdictions.map((j) => ({ id: j.id }));
}

export default async function TimelinePage({ params }: TimelinePageProps) {
  const { id } = await params;
  const [dataset, manifest] = await Promise.all([
    fetchJurisdictionDataset(id),
    fetchManifest(),
  ]);
  if (!dataset) {
    notFound();
  }

  const { jurisdiction, release, documents, amendments } = dataset;
  const allVisible = getVisibleJurisdictions(manifest);
  const rootParentId =
    jurisdiction.parent ??
    (allVisible.some((j) => j.parent === jurisdiction.id)
      ? jurisdiction.id
      : null);
  const gbaCorporations = rootParentId
    ? allVisible
        .filter((j) => j.id === rootParentId || j.parent === rootParentId)
        .map((j) => ({ id: j.id, name: j.name }))
    : [];

  const slimDocs = documents.map((d) => ({
    ...d,
    mirror_urls: [],
    cited_provisions: [],
    notes_by_site: [],
    status_evidence: {
      ...d.status_evidence,
      quoted_line: (d.status_evidence?.quoted_line ?? "").slice(0, 200),
      description: (d.status_evidence?.description ?? "").slice(0, 200),
    },
  }));

  if (!release) {
    return (
      <div className="min-h-screen bg-[#f5f3ed] text-[#080909]">
        <TopNav
          jurisdictionId={jurisdiction.id}
          jurisdictionName={jurisdiction.name}
          active="timeline"
        />
        <main className="mx-auto max-w-5xl px-5 py-10">
          <header className="border-b border-[#c8ccc0] pb-6">
            <div className="dg-mono">What changed</div>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-[#080909]">
              What changed
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
              Chronological regulatory history for {jurisdiction.name} is not
              published yet.
            </p>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f3ed] text-[#080909]">
      <TopNav
        jurisdictionId={jurisdiction.id}
        jurisdictionName={jurisdiction.name}
        active="timeline"
        releaseVersion={release.version}
        licence={release.licence}
      />

      <main className="mx-auto max-w-5xl space-y-8 px-5 py-10">
        <header className="border-b border-[#c8ccc0] pb-6">
          <div className="dg-mono text-[#5b5e56]">
            Most recent first · {documents.length} instruments
          </div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#080909] md:text-4xl">
            What changed
          </h1>
          <p className="dg-serif mt-3 text-base leading-relaxed text-[#171917]">
            Every statute, master plan zoning regulation, building bye-law,
            amendment notification, and order, ordered from most recent to
            oldest. Filter by instrument type or corporation below.
          </p>

          <CorporationSelector
            currentId={jurisdiction.id}
            currentName={jurisdiction.name}
            pathSuffix="/timeline"
            corporations={gbaCorporations}
          />
        </header>

        <WhatChangedClient
          jurisdictionId={jurisdiction.id}
          documents={slimDocs}
          amendmentLinks={amendments.links.slice(0, 20)}
          corporations={gbaCorporations}
        />
      </main>
    </div>
  );
}
