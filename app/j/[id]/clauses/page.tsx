import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  fetchJurisdictionDataset,
  fetchManifest,
  type ClauseNode,
} from "@/lib/data";
import { TopNav } from "@/components/TopNav";
import { ClauseTree } from "@/components/ClauseTree";
import {
  formatHumanDate,
  formatPlainInstrumentStatus,
  formatPlainLayerLabel,
  sortDocumentsMostRecentFirst,
} from "@/lib/plain-language";

interface ClausesPageProps {
  params: Promise<{ id: string }>;
}

export const dynamicParams = false;

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

  const referencedAmendingIds = new Set(
    amendments.links.map((l) => l.amending_clause)
  );
  const allClausesLookup: Record<string, ClauseNode> = {};
  for (const c of clauses) {
    if (
      !c.superseded_by &&
      !c.record_superseded_by &&
      referencedAmendingIds.has(c.clause_id)
    ) {
      allClausesLookup[c.clause_id] = { ...c, versions: undefined };
    }
  }
  const referenceDocIds = new Set(
    documents.filter((d) => d.role === "reference").map((d) => d.doc_id)
  );
  const allFilteredClauses: ClauseNode[] = clauses
    .filter((c) => !referenceDocIds.has(c.doc_id ?? "") && c.type !== "table_row")
    .map((c) => ({
      ...c,
      title: c.title === c.heading ? null : c.title,
      content: !c.intro && !c.wrap_up && c.content === c.text ? null : c.content,
      citations: (c.citations ?? []).slice(0, 1).map((cit) => ({
        doc_id: cit.doc_id,
        page: cit.page,
        bbox: null,
        text_excerpt: "",
      })),
      versions:
        (c.versions?.length ?? 0) > 1 || c.versions?.[0]?.effect_id
          ? c.versions
          : undefined,
    }));
  const slimmedClauses = allFilteredClauses.slice(0, 16).map((c) => ({
    ...c,
    tables: [],
  }));

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
            Structured Documents &amp; Clauses
          </div>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-[#080909]">
            {jurisdiction.name}: Documents &amp; Clauses
          </h1>
          <p className="dg-serif mt-2 max-w-3xl text-base text-[#171917]">
            Select any legal instrument below (ordered most recent first) to
            read its complete text in the law&apos;s own order, or filter across
            structured provisions below.
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
            Instruments · Most Recent First ({documents.length})
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {sortDocumentsMostRecentFirst(documents).map((doc) => {
              const iType = doc.instrument_type ?? "instrument";
              const isRef =
                doc.text_rights?.mode === "reference_only" ||
                iType === "compilation" ||
                iType === "map" ||
                iType === "bill";
              const plainStatus = formatPlainInstrumentStatus(doc);
              const dateStr = formatHumanDate(
                doc.effective_from || doc.notified_date
              );
              return (
                <Link
                  key={doc.doc_id}
                  href={`/j/${jurisdiction.id}/documents/${doc.doc_id}`}
                  className="flex flex-col justify-between border border-[#080909] bg-[#f5f3ed] p-3.5 no-underline hover:bg-[#e5e6de]"
                >
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-mono text-[11px] text-[#5b5e56]">
                        {dateStr}
                      </span>
                      <span className="border border-[#080909] bg-[#efeee8] px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-[#080909]">
                        {plainStatus}
                      </span>
                    </div>
                    <div className="mt-1.5 text-sm font-semibold text-[#080909]">
                      {doc.title}
                    </div>
                    {doc.summary_by_site && (
                      <p className="dg-serif mt-1.5 text-xs text-[#171917]">
                        <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-[#5b5e56]">
                          In short (by this site):{" "}
                        </span>
                        {doc.summary_by_site}
                      </p>
                    )}
                  </div>
                  <div className="mt-3 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.12em] text-[#5b5e56]">
                    <span>{formatPlainLayerLabel(doc.layer)}</span>
                    <span>{isRef ? "Reference" : "Read provisions →"}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <ClauseTree
          clauses={slimmedClauses}
          totalClausesCount={allFilteredClauses.length}
          annotations={[]}
          amendmentEffects={(amendments.effects ?? []).map((e) => ({
            ...e,
            new_nodes: [],
          }))}
          consolidatedRecords={(consolidated?.records ?? [])
            .slice(0, 12)
            .map((r) => ({ ...r, tables: [] }))}
          unconsolidatedRecords={consolidated?.unconsolidated ?? []}
          amendmentLinks={amendments.links.slice(0, 15)}
          allClausesLookup={{}}
          allowConsolidatedToggle={Boolean(
            (consolidated && consolidated.records.length > 0) ||
              (amendments.effects && amendments.effects.length > 0)
          )}
        />
      </main>
    </div>
  );
}
