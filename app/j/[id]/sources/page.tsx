import React from "react";
import { notFound } from "next/navigation";
import { fetchJurisdictionDataset, fetchManifest } from "@/lib/data";
import { TopNav } from "@/components/TopNav";
import { SourcesFilterClient } from "@/components/SourcesFilterClient";

interface SourcesPageProps {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  const manifest = await fetchManifest();
  return manifest.jurisdictions.map((j) => ({ id: j.id }));
}

export default async function SourcesPage({ params }: SourcesPageProps) {
  const { id } = await params;
  const dataset = await fetchJurisdictionDataset(id);
  if (!dataset) {
    notFound();
  }

  const { jurisdiction, release, documents, clauseTrees, draftClauseTrees } =
    dataset;
  const structuredDocIds = [
    ...clauseTrees.map((t) => t.doc_id),
    ...draftClauseTrees.map((t) => t.doc_id),
  ];

  return (
    <div className="min-h-screen bg-[#f5f3ed] text-[#080909]">
      <TopNav
        jurisdictionId={jurisdiction.id}
        jurisdictionName={jurisdiction.name}
        active="sources"
        releaseVersion={release.version}
        licence={release.licence}
      />

      <main className="mx-auto max-w-6xl px-6 py-8">
        <header className="mb-6 border-b border-[#080909] pb-6">
          <div className="dg-mono">
            Source Register · {jurisdiction.id} · {documents.length} Instrument(s)
          </div>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-[#080909]">
            {jurisdiction.name} — Legal Source Register
          </h1>
          <p className="dg-serif mt-2 max-w-3xl text-base text-[#171917]">
            Every statute, statutory rule, master plan zoning regulation,
            municipal building bye-law, amendment notification, government
            order, and reference standard governing construction in{" "}
            {jurisdiction.name}, with quoted status evidence, SHA-256
            checksums, text republishing rights (Rule R13), and direct links to
            official origins and our structured copies.
          </p>
        </header>

        <SourcesFilterClient
          jurisdictionId={jurisdiction.id}
          documents={documents}
          structuredDocIds={structuredDocIds}
        />
      </main>
    </div>
  );
}
