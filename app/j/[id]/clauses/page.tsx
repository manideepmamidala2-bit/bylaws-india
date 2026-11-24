import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  fetchJurisdictionDataset,
  fetchManifest,
  type ClauseNode,
} from "@/lib/data";
import { TopNav } from "@/components/TopNav";
import { StatusBadge } from "@/components/StatusBadge";
import { ClauseTree } from "@/components/ClauseTree";

interface ClausesPageProps {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  const manifest = await fetchManifest();
  return manifest.jurisdictions.map((j) => ({ id: j.id }));
}

export default async function ClausesPage({ params }: ClausesPageProps) {
  const { id } = await params;
  const dataset = await fetchJurisdictionDataset(id);
  if (!dataset) {
    notFound();
  }

  const {
    jurisdiction,
    release,
    documents,
    annotationsByDocId,
    clauses,
    amendments,
    consolidated,
    declarations,
  } = dataset;

  if (!release) {
    return (
      <div className="min-h-screen bg-[#f5f3ed] text-[#080909]">
        <TopNav
          jurisdictionId={jurisdiction.id}
          jurisdictionName={jurisdiction.name}
          active="documents"
        />
        <main className="mx-auto max-w-6xl px-6 py-10">
          <header className="border-b border-[#080909] pb-6">
            <div className="dg-mono">
              Structured Documents · {jurisdiction.id}
            </div>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-[#080909]">
              {jurisdiction.name}: Documents &amp; Clauses
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
              Structured regulatory documents for {jurisdiction.name} are not
              published yet.
            </p>
          </section>
        </main>
      </div>
    );
  }

  const allClausesLookup: Record<string, ClauseNode> = {};
  for (const c of clauses) {
    if (!c.superseded_by && !c.record_superseded_by) {
      allClausesLookup[c.clause_id] = c;
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f3ed] text-[#080909]">
      <TopNav
        jurisdictionId={jurisdiction.id}
        jurisdictionName={jurisdiction.name}
        active="documents"
        releaseVersion={release.version}
        licence={release.licence}
      />

      <main className="mx-auto max-w-6xl px-6 py-8">
        <header className="mb-6 border-b border-[#080909] pb-6">
          <div className="dg-mono">
            Structured Documents &amp; Clauses · {jurisdiction.id}
          </div>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-[#080909]">
            {jurisdiction.name}: Documents &amp; Clauses
          </h1>
          <p className="dg-serif mt-2 max-w-3xl text-base text-[#171917]">
            Select any legal instrument below to read its complete structured
            document (with Original and As-Amended derived views), or filter
            across all structured clauses below.
          </p>
        </header>

        {declarations.known_gaps && declarations.known_gaps.length > 0 && (
          <section
            aria-label="Coverage notice"
            className="mb-6 border border-[#080909] bg-[#efeee8] p-4"
          >
            <div className="dg-mono text-[10.5px] text-[#080909]">
              Coverage Notice · Release v{release.version}
            </div>
            <p className="dg-serif mt-1 text-sm text-[#171917]">
              {declarations.known_gaps[0].description}
            </p>
          </section>
        )}

        <section
          aria-label="Structured document directory"
          className="mb-8 border border-[#080909] bg-[#efeee8] p-5"
        >
          <div className="dg-mono mb-3">
            Instruments in Release v{release.version} ({documents.length})
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {documents.map((doc) => {
              const isRef = doc.text_rights?.mode === "reference_only";
              return (
                <Link
                  key={doc.doc_id}
                  href={`/j/${jurisdiction.id}/documents/${doc.doc_id}`}
                  className="flex flex-col justify-between border border-[#080909] bg-[#f5f3ed] p-3.5 no-underline hover:bg-[#e5e6de]"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-semibold text-[#080909]">
                        {doc.doc_id}
                      </span>
                      <StatusBadge status={doc.legal_status} />
                    </div>
                    <div className="mt-1 text-sm font-medium text-[#080909]">
                      {doc.title}
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.12em] text-[#5b5e56]">
                    <span>{doc.layer}</span>
                    <span>{isRef ? "Reference only" : "Full text"}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <ClauseTree
          clauses={clauses}
          annotations={Object.values(annotationsByDocId).flat()}
          amendmentEffects={amendments.effects ?? []}
          consolidatedRecords={consolidated?.records ?? []}
          unconsolidatedRecords={consolidated?.unconsolidated ?? []}
          amendmentLinks={amendments.links}
          allClausesLookup={allClausesLookup}
          allowConsolidatedToggle={Boolean(
            (consolidated && consolidated.records.length > 0) ||
              (amendments.effects && amendments.effects.length > 0)
          )}
        />
      </main>
    </div>
  );
}
