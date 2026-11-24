import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchJurisdictionDataset, fetchManifest } from "@/lib/data";
import { TopNav } from "@/components/TopNav";
import { StatusBadge } from "@/components/StatusBadge";

interface TimelinePageProps {
  params: Promise<{ id: string }>;
}

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
            <div className="dg-mono">Timeline · {jurisdiction.id}</div>
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

  const sortedDocs = [...documents].sort((a, b) => {
    const dateA = a.notified_date || a.effective_from || "0000-00-00";
    const dateB = b.notified_date || b.effective_from || "0000-00-00";
    return dateA.localeCompare(dateB);
  });

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
            Chronological Evolution · {jurisdiction.id} · {sortedDocs.length}{" "}
            Instrument(s)
          </div>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-[#080909]">
            {jurisdiction.name}: Regulatory Timeline
          </h1>
          <p className="dg-serif mt-2 max-w-3xl text-base text-[#171917]">
            Every enabling statute, master plan zoning regulation, municipal
            building bye-law, amendment notification, and executive order in
            date order, showing what each instrument enacted, amended, or
            superseded.
          </p>
        </header>

        <ol
          aria-label="Chronological regulatory instruments"
          className="space-y-4 border-l-2 border-[#080909] pl-6"
        >
          {sortedDocs.map((doc) => {
            const docLinks = linksByAmendingDoc.get(doc.doc_id) ?? [];
            const displayDate =
              doc.notified_date ?? doc.effective_from ?? "Date unrecorded";

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
                    <span className="font-semibold">{doc.doc_id}</span>
                    <span className="text-[#5b5e56]">
                      · {doc.layer} · {doc.doc_type ?? doc.role}
                    </span>
                  </div>
                  <StatusBadge status={doc.legal_status} />
                </div>

                <h2 className="mt-2 text-lg font-semibold text-[#080909]">
                  <Link
                    href={`/j/${jurisdiction.id}/documents/${doc.doc_id}`}
                    className="underline underline-offset-3"
                  >
                    {doc.title}
                  </Link>
                </h2>

                <p className="dg-serif mt-1.5 text-sm text-[#171917]">
                  {doc.status_evidence.quoted_line ??
                    doc.status_evidence.description}
                </p>

                <div className="mt-2.5 flex flex-wrap gap-4 font-mono text-[10.5px] uppercase tracking-[0.12em] text-[#5b5e56]">
                  {doc.notification_number && (
                    <span>Ref: {doc.notification_number}</span>
                  )}
                  {doc.effective_from && (
                    <span>Effective: {doc.effective_from}</span>
                  )}
                  {doc.amends && doc.amends.length > 0 && (
                    <span className="text-[#080909]">
                      Amends: {doc.amends.join(", ")}
                    </span>
                  )}
                  {doc.supersedes && doc.supersedes.length > 0 && (
                    <span>Supersedes: {doc.supersedes.join(", ")}</span>
                  )}
                  {doc.superseded_by_document && (
                    <span>Superseded by: {doc.superseded_by_document}</span>
                  )}
                </div>

                {docLinks.length > 0 && (
                  <div className="mt-3 border-t border-[#c8ccc0] pt-2.5">
                    <div className="dg-mono mb-1.5 text-[10px] text-[#080909]">
                      Linked Clause Amendments ({docLinks.length})
                    </div>
                    <ul className="space-y-1 font-mono text-xs">
                      {docLinks.map((lnk, idx) => {
                        const targetDoc = lnk.target_clause.split(":")[0];
                        return (
                          <li key={idx} className="space-y-0.5">
                            <div className="flex flex-wrap gap-2">
                              <span className="uppercase text-[#5b5e56]">
                                [{lnk.action.replace("_", " ")}]
                              </span>
                              <span>{lnk.amending_clause}</span>
                              <span>→</span>
                              <Link
                                href={`/j/${jurisdiction.id}/documents/${targetDoc}`}
                                className="font-semibold text-[#080909] underline"
                              >
                                {lnk.target_clause}
                              </Link>
                              {lnk.confidence !== "high" && (
                                <span className="border border-dashed border-[#5b5e56] px-1 text-[10px] text-[#5b5e56]">
                                  {lnk.confidence} confidence · not applied
                                </span>
                              )}
                            </div>
                            {(lnk.summary || lnk.note) && (
                              <p className="dg-serif pl-4 font-sans text-xs text-[#5b5e56]">
                                {lnk.summary ?? lnk.note}
                              </p>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      </main>
    </div>
  );
}
