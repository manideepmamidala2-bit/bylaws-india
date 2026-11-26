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
  formatPlainDocumentTitle,
  formatPlainInstrumentStatus,
  formatPlainLayerLabel,
  formatPlainWhatChangedSummary,
  isDocumentTextHeld,
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
          <header className="border-b border-[#c8ccc0] pb-6">
            <div className="dg-mono">Structured Documents</div>
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
        <header className="mb-6 border-b border-[#c8ccc0] pb-6">
          <div className="dg-mono text-[#5b5e56]">Documents</div>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-[#080909]">
            Official Documents in {jurisdiction.name}
          </h1>
          <p className="dg-serif mt-2 max-w-3xl text-base text-[#171917]">
            Select any instrument below (ordered most recent first) to read its
            provisions in the law&apos;s own order.
          </p>
        </header>

        <section
          aria-label="Structured document directory"
          className="mb-8 border-y border-[#c8ccc0] py-4"
        >
          <div className="dg-mono mb-4 text-[#5b5e56]">
            Instruments · Most recent first ({documents.length})
          </div>
          <ul className="divide-y divide-[#c8ccc0]">
            {sortDocumentsMostRecentFirst(documents).map((doc) => {
              const textHeld = isDocumentTextHeld(doc);
              const plainStatus = formatPlainInstrumentStatus(doc);
              const dateStr = formatHumanDate(
                doc.effective_from || doc.notified_date
              );
              const plainTitle = formatPlainDocumentTitle(doc);
              const summary =
                doc.summary_by_site || formatPlainWhatChangedSummary(doc);
              return (
                <li
                  key={doc.doc_id}
                  className="flex flex-col justify-between gap-2 py-4 md:flex-row md:items-baseline md:gap-6"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2 font-mono text-xs text-[#5b5e56]">
                      <span>{dateStr}</span>
                      <span>·</span>
                      <span>{formatPlainLayerLabel(doc.layer)}</span>
                      <span>·</span>
                      <span className="font-semibold text-[#080909]">
                        {plainStatus}
                      </span>
                    </div>
                    <h2 className="text-lg font-semibold text-[#080909]">
                      {textHeld ? (
                        <Link
                          href={`/j/${jurisdiction.id}/documents/${doc.doc_id}`}
                          className="text-[#080909] underline decoration-[#c8ccc0] underline-offset-4 hover:decoration-[#080909]"
                        >
                          {plainTitle}
                        </Link>
                      ) : (
                        plainTitle
                      )}
                    </h2>
                    <p className="dg-serif text-sm text-[#171917]">
                      <span className="dg-mono mr-2 text-[#5b5e56]">
                        In short, by this site:
                      </span>
                      {summary}
                    </p>
                  </div>
                  <div className="shrink-0 font-mono text-xs uppercase tracking-[0.12em]">
                    {textHeld ? (
                      <Link
                        href={`/j/${jurisdiction.id}/documents/${doc.doc_id}`}
                        className="inline-flex min-h-[44px] items-center text-[#080909] underline decoration-[#080909] underline-offset-4"
                      >
                        Read provisions →
                      </Link>
                    ) : (
                      <span className="inline-flex min-h-[44px] items-center text-[#5b5e56]">
                        Text not held on site
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
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
