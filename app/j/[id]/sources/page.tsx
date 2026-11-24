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

  if (!release && documents.length === 0) {
    return (
      <div className="min-h-screen bg-[#f5f3ed] text-[#080909]">
        <TopNav
          jurisdictionId={jurisdiction.id}
          jurisdictionName={jurisdiction.name}
          active="sources"
        />
        <main className="mx-auto max-w-6xl px-6 py-10">
          <header className="border-b border-[#080909] pb-6">
            <div className="dg-mono">Source Register · {jurisdiction.id}</div>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-[#080909]">
              {jurisdiction.name}: Legal Source Register
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
              Source documents for {jurisdiction.name} are being acquired and
              verified. No source register is published yet.
            </p>
          </section>
        </main>
      </div>
    );
  }

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
        releaseVersion={release?.version}
        licence={release?.licence}
      />

      <main className="mx-auto max-w-6xl px-6 py-8">
        <header className="mb-6 border-b border-[#080909] pb-6">
          <div className="dg-mono">
            Source Register · {jurisdiction.id} · {documents.length} Instrument(s)
          </div>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-[#080909]">
            {jurisdiction.name}: Legal Source Register
          </h1>
          <p className="dg-serif mt-2 max-w-3xl text-base text-[#171917]">
            Statutes, statutory rules, master plan zoning regulations, municipal
            building bye-laws, amendment notifications, government orders, and
            reference standards governing construction in {jurisdiction.name},
            with quoted status evidence, SHA-256 checksums, text rights, and
            links to source documents.
          </p>
        </header>

        {!release && (
          <section
            aria-label="Structuring status"
            className="mb-6 border border-[#080909] bg-[#efeee8] p-4"
          >
            <div className="dg-mono text-[10.5px] text-[#080909]">
              Pre-Release Source Register · Not yet structured
            </div>
            <p className="dg-serif mt-1 text-sm text-[#171917]">
              Core regulatory documents for {jurisdiction.name} have been
              acquired and verified with SHA-256 checksums and archival
              provenance. Clause structuring and consolidation are not yet
              published.
            </p>
          </section>
        )}

        <SourcesFilterClient
          jurisdictionId={jurisdiction.id}
          documents={documents}
          structuredDocIds={structuredDocIds}
        />
      </main>
    </div>
  );
}
