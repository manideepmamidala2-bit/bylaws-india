import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  fetchDocuments,
  fetchJurisdictionDataset,
  fetchManifest,
  type ClauseNode,
} from "@/lib/data";
import { TopNav } from "@/components/TopNav";
import { StatusBadge } from "@/components/StatusBadge";
import { ClauseTree } from "@/components/ClauseTree";

interface DocumentPageProps {
  params: Promise<{ id: string; doc: string }>;
}

export async function generateStaticParams() {
  const manifest = await fetchManifest();
  const paramsList: Array<{ id: string; doc: string }> = [];
  for (const j of manifest.jurisdictions) {
    const docs = await fetchDocuments(j.id);
    for (const d of docs) {
      paramsList.push({ id: j.id, doc: d.doc_id });
    }
  }
  return paramsList;
}

export default async function DocumentViewerPage({
  params,
}: DocumentPageProps) {
  const { id, doc } = await params;
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

  const docMeta = documents.find((d) => d.doc_id === doc);
  if (!docMeta) {
    notFound();
  }

  const isReferenceOnly = docMeta.text_rights?.mode === "reference_only";
  const docClauses = clauses.filter((c) => c.doc_id === doc);
  const docConsolidated = (consolidated?.records ?? []).filter(
    (r) => r.doc_id === doc
  );
  const docUnconsolidated = (consolidated?.unconsolidated ?? []).filter(
    (u) => u.doc_id === doc
  );

  const allClausesLookup: Record<string, ClauseNode> = {};
  for (const c of clauses) {
    if (!c.superseded_by && !c.record_superseded_by) {
      allClausesLookup[c.clause_id] = c;
    }
  }

  const originUrl = docMeta.official_url || docMeta.source_url;

  return (
    <div className="min-h-screen bg-[#f5f3ed] text-[#080909]">
      <TopNav
        jurisdictionId={jurisdiction.id}
        jurisdictionName={jurisdiction.name}
        active="documents"
        releaseVersion={release.version}
        licence={release.licence}
      />

      <main className="mx-auto max-w-5xl px-6 py-8">
        <div className="mb-4">
          <Link
            href={`/j/${jurisdiction.id}/sources`}
            className="font-mono text-xs uppercase tracking-[0.12em] text-[#5b5e56] underline hover:text-[#080909]"
          >
            ← Back to Source Register ({jurisdiction.name})
          </Link>
        </div>

        <header className="mb-6 border border-[#080909] bg-[#efeee8] p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="dg-mono">
              {docMeta.doc_id} · {docMeta.layer} ·{" "}
              {docMeta.doc_type ?? docMeta.role}
            </span>
            <div className="flex items-center gap-2">
              <span className="border border-[#080909] bg-[#f5f3ed] px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[#080909]">
                {isReferenceOnly ? "REFERENCE ONLY (R13)" : "FULL TEXT"}
              </span>
              <StatusBadge status={docMeta.legal_status} />
            </div>
          </div>

          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[#080909] sm:text-3xl">
            {docMeta.title}
          </h1>

          <dl className="mt-4 grid grid-cols-1 gap-3 border-t border-[#c8ccc0] pt-3 text-xs sm:grid-cols-4">
            <div>
              <dt className="dg-mono text-[10px]">Issuing Authority</dt>
              <dd className="text-[#171917]">{docMeta.issuing_authority}</dd>
            </div>
            <div>
              <dt className="dg-mono text-[10px]">Notification / Gazette</dt>
              <dd className="font-mono text-[#080909]">
                {docMeta.notification_number ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="dg-mono text-[10px]">Notified / Effective</dt>
              <dd className="font-mono text-[#080909]">
                {docMeta.notified_date ?? "—"} /{" "}
                {docMeta.effective_from ?? "Not in force"}
              </dd>
            </div>
            <div>
              <dt className="dg-mono text-[10px]">Origin &amp; Checksum</dt>
              <dd className="font-mono text-[11px] text-[#080909]">
                {originUrl && originUrl.startsWith("http") ? (
                  <a
                    href={originUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    Official Origin ↗
                  </a>
                ) : (
                  "Staged source"
                )}
                {docMeta.sha256 ? ` · ${docMeta.sha256.slice(0, 12)}…` : ""}
              </dd>
            </div>
          </dl>
        </header>

        {isReferenceOnly ? (
          <section
            aria-label="Reference-only standard metadata and cited provisions"
            className="space-y-6 border border-[#080909] bg-[#f5f3ed] p-6"
          >
            <div className="border-l-2 border-[#080909] bg-[#efeee8] p-4">
              <div className="dg-mono text-[#080909]">
                Rule R13 — Text Rights Notice (Reference Only)
              </div>
              <p className="dg-serif mt-1 text-base text-[#171917]">
                {docMeta.text_rights?.reason}
              </p>
              {originUrl && originUrl.startsWith("http") && (
                <p className="mt-2 font-mono text-xs">
                  Where to obtain / access:{" "}
                  <a
                    href={originUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#080909] underline"
                  >
                    {originUrl} ↗
                  </a>
                </p>
              )}
            </div>

            <div>
              <h2 className="text-lg font-semibold text-[#080909]">
                Provisions Cited by {jurisdiction.name} Law
              </h2>
              <p className="dg-serif mt-1 text-sm text-[#5b5e56]">
                Specific parts and clauses of {docMeta.title} referenced by
                statutes, zoning regulations, and building bye-laws in{" "}
                {jurisdiction.name}:
              </p>

              <div className="mt-3 overflow-x-auto">
                <table className="dg-table">
                  <thead>
                    <tr>
                      <th>Part</th>
                      <th>Clause / Schedule</th>
                      <th>Regulatory Topic</th>
                      <th>Cited By Clauses</th>
                      <th>Where to Obtain</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(docMeta.cited_provisions ?? []).map((cp, idx) => (
                      <tr key={idx}>
                        <td className="font-mono text-xs">{cp.part ?? "—"}</td>
                        <td className="font-mono text-xs font-medium">
                          {cp.clause}
                        </td>
                        <td>{cp.topic ?? "—"}</td>
                        <td className="font-mono text-xs">
                          <div className="flex flex-wrap gap-2">
                            {cp.cited_by.map((cid) => {
                              const citingDoc = cid.split(":")[0];
                              return (
                                <Link
                                  key={cid}
                                  href={`/j/${jurisdiction.id}/documents/${citingDoc}`}
                                  className="underline"
                                >
                                  {cid}
                                </Link>
                              );
                            })}
                          </div>
                        </td>
                        <td className="text-xs">{cp.where_to_obtain ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        ) : (
          <ClauseTree
            clauses={docClauses}
            consolidatedRecords={docConsolidated}
            unconsolidatedRecords={docUnconsolidated}
            amendmentLinks={amendments.links}
            allClausesLookup={allClausesLookup}
            allowConsolidatedToggle={docConsolidated.length > 0}
          />
        )}
      </main>
    </div>
  );
}
