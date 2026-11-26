import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchJurisdictionDataset, fetchManifest } from "@/lib/data";
import { TopNav } from "@/components/TopNav";
import {
  formatHumanDate,
  formatPlainInstrumentStatus,
  formatPlainLayerLabel,
  sortDocumentsMostRecentFirst,
} from "@/lib/plain-language";

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
  const dataset = await fetchJurisdictionDataset(id);
  if (!dataset) {
    notFound();
  }

  const { jurisdiction, release, documents, amendments } = dataset;

  if (!release) {
    return (
      <div className="min-h-screen bg-[#f5f3ed] text-[#080909]">
        <TopNav
          jurisdictionId={jurisdiction.id}
          jurisdictionName={jurisdiction.name}
          active="timeline"
        />
        <main className="mx-auto max-w-5xl px-6 py-10">
          <header className="border-b border-[#080909] pb-6">
            <div className="dg-mono">Timeline</div>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-[#080909]">
              {jurisdiction.name}: Regulatory Timeline
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

  // Part 6: Most recent first
  const sortedDocs = sortDocumentsMostRecentFirst(documents);

  const linksByAmendingDoc = new Map<string, typeof amendments.links>();
  for (const lnk of amendments.links) {
    const docId =
      lnk.amending_doc_id ?? lnk.amending_clause.split(":", 1)[0] ?? "";
    const existing = linksByAmendingDoc.get(docId) ?? [];
    existing.push(lnk);
    linksByAmendingDoc.set(docId, existing);
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

      <main className="mx-auto max-w-5xl px-6 py-8">
        <header className="mb-8 border-b border-[#080909] pb-6">
          <div className="dg-mono">
            Most Recent First · {sortedDocs.length} Instrument(s)
          </div>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-[#080909]">
            {jurisdiction.name}: Regulatory Timeline
          </h1>
          <p className="dg-serif mt-2 max-w-3xl text-base text-[#171917]">
            Every statute, master plan zoning regulation, building bye-law,
            amendment notification, and order ordered from most recent to
            oldest, with a one-line summary of what changed.
          </p>
        </header>

        <ol
          aria-label="Chronological regulatory instruments"
          className="space-y-4 border-l-2 border-[#080909] pl-6"
        >
          {sortedDocs.map((doc) => {
            const docLinks = linksByAmendingDoc.get(doc.doc_id) ?? [];
            const rawDate = doc.effective_from ?? doc.notified_date;
            const displayDate = formatHumanDate(rawDate);
            const plainStatus = formatPlainInstrumentStatus(doc);
            const whatChangedLine =
              doc.summary_by_site ??
              doc.status_evidence.description ??
              doc.status_evidence.quoted_line;

            return (
              <li
                key={doc.doc_id}
                className="border border-[#080909] bg-[#f5f3ed] p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2 font-mono text-xs text-[#080909]">
                    <span className="bg-[#080909] px-2 py-0.5 text-[#f5f3ed]">
                      {displayDate}
                    </span>
                    <span className="text-[#5b5e56]">
                      {formatPlainLayerLabel(doc.layer)}
                    </span>
                  </div>
                  <span className="border border-[#080909] bg-[#efeee8] px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-[#080909]">
                    {plainStatus}
                  </span>
                </div>

                <h2 className="mt-2 text-lg font-semibold text-[#080909]">
                  <Link
                    href={`/j/${jurisdiction.id}/documents/${doc.doc_id}`}
                    className="underline underline-offset-3"
                  >
                    {doc.title}
                  </Link>
                </h2>

                {whatChangedLine && (
                  <p className="dg-serif mt-1.5 text-sm text-[#171917]">
                    {whatChangedLine}
                  </p>
                )}

                <details className="mt-3 border-t border-[#c8ccc0] pt-2.5">
                  <summary className="cursor-pointer font-mono text-[10.5px] uppercase tracking-[0.12em] text-[#080909] underline">
                    {docLinks.length > 0
                      ? `Changed provisions (${docLinks.length}) & citation details`
                      : "Citation & status details"}
                  </summary>

                  <div className="mt-2 space-y-2 text-xs text-[#171917]">
                    <div className="flex flex-wrap gap-4 font-mono text-[10.5px] text-[#5b5e56]">
                      {doc.notification_number && (
                        <span>Notification: {doc.notification_number}</span>
                      )}
                      {doc.notified_date && (
                        <span>Notified: {doc.notified_date}</span>
                      )}
                      {doc.effective_from && (
                        <span>Effective: {doc.effective_from}</span>
                      )}
                    </div>

                    {doc.status_evidence.quoted_line && (
                      <p className="dg-serif border-l-2 border-[#080909] bg-[#efeee8] px-3 py-1.5 italic text-[#080909]">
                        &ldquo;{doc.status_evidence.quoted_line}&rdquo;
                      </p>
                    )}

                    {docLinks.length > 0 && (
                      <ul className="space-y-1.5 pt-1 font-mono text-xs">
                        {docLinks.map((lnk, idx) => {
                          const targetDoc = lnk.target_clause.split(":")[0];
                          return (
                            <li
                              key={idx}
                              className="border border-[#c8ccc0] bg-[#efeee8] p-2.5"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <span className="uppercase text-[#080909]">
                                  {lnk.action.replace("_", " ")}
                                </span>
                                <Link
                                  href={`/j/${jurisdiction.id}/documents/${targetDoc}`}
                                  className="font-semibold text-[#080909] underline"
                                >
                                  Read affected provision →
                                </Link>
                              </div>
                              {(lnk.summary || lnk.note) && (
                                <p className="dg-serif mt-1 font-sans text-xs text-[#171917]">
                                  {lnk.summary ?? lnk.note}
                                </p>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                </details>
              </li>
            );
          })}
        </ol>
      </main>
    </div>
  );
}
