import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  fetchDocumentOutline,
  fetchDocuments,
  fetchJurisdictionDataset,
  fetchManifest,
  getVisibleJurisdictions,
  type ClauseNode,
} from "@/lib/data";
import { TopNav } from "@/components/TopNav";
import { StatusBadge } from "@/components/StatusBadge";
import { ClauseTree } from "@/components/ClauseTree";

interface DocumentPageProps {
  params: Promise<{ id: string; doc: string }>;
}

export const dynamicParams = false;

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
  const [dataset, manifest, docOutline] = await Promise.all([
    fetchJurisdictionDataset(id),
    fetchManifest(),
    fetchDocumentOutline(id, doc),
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
  const gbaCorporations = rootParentId
    ? allVisible.filter(
        (j) => j.id === rootParentId || j.parent === rootParentId
      )
    : [];

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
        <main className="mx-auto max-w-5xl px-6 py-10">
          <header className="border-b border-[#080909] pb-6">
            <div className="dg-mono">Document · {jurisdiction.id}</div>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-[#080909]">
              {jurisdiction.name}
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

  const docMeta = documents.find((d) => d.doc_id === doc);
  if (!docMeta) {
    notFound();
  }

  const isReferenceOnly = docMeta.text_rights?.mode === "reference_only";
  const allDocClauses: ClauseNode[] = clauses
    .filter((c) => c.doc_id === doc)
    .map((c) => {
      const hasChildTable = (c.children ?? []).some((ch) =>
        ch.includes("__tbl_")
      );
      return {
        ...c,
        title: c.title === c.heading ? null : c.title,
        content:
          !c.intro && !c.wrap_up && c.content === c.text ? null : c.content,
        tables: hasChildTable ? [] : (c.tables ?? []).slice(0, 1),
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
      };
    });

  // Per-chapter initial slice (Part 1 §5): include first chapter slice + amended provisions + their table rows
  // so SSR HTML stays <= 300 KB and initial JS+data stays <= 1.5 MB while keeping full outline & on-demand chapter loading.
  const firstChapterCount = docOutline?.outline?.[0]?.child_count ?? 16;
  const nonRowDocClauses = allDocClauses.filter((c) => c.type !== "table_row");
  const initialNonRowSet = new Set<string>();
  for (const c of nonRowDocClauses.slice(0, Math.min(16, firstChapterCount))) {
    initialNonRowSet.add(c.record_id ?? c.clause_id);
  }
  for (const c of nonRowDocClauses) {
    if (
      initialNonRowSet.size < 22 &&
      ((c.versions?.length ?? 0) > 1 ||
        Boolean(c.versions?.[0]?.effect_id) ||
        (c.amended_by?.length ?? 0) > 0 ||
        Boolean(c.change_mark))
    ) {
      initialNonRowSet.add(c.record_id ?? c.clause_id);
    }
  }
  const neededTableRowEids = new Set<string>();
  for (const c of nonRowDocClauses) {
    if (
      initialNonRowSet.has(c.record_id ?? c.clause_id) &&
      c.type === "table" &&
      c.table_meta?.rows
    ) {
      for (const rEid of c.table_meta.rows.slice(0, 12)) {
        neededTableRowEids.add(rEid);
      }
    }
  }
  const docClauses: ClauseNode[] = allDocClauses.filter(
    (c) =>
      initialNonRowSet.has(c.record_id ?? c.clause_id) ||
      (c.type === "table_row" && c.eid && neededTableRowEids.has(c.eid))
  );
  const includedEids = new Set(
    docClauses.map((c) => c.eid).filter((x): x is string => Boolean(x))
  );
  const rawDocAnns = (annotationsByDocId[doc] ?? []).filter((ann) =>
    includedEids.has(ann.target.eid)
  );
  const annCountByEid = new Map<string, number>();
  let slimDocAnnsCount = 0;
  const slimDocAnns = rawDocAnns.filter((ann) => {
    const cnt = annCountByEid.get(ann.target.eid) ?? 0;
    if (cnt >= 4 || slimDocAnnsCount >= 40) return false;
    annCountByEid.set(ann.target.eid, cnt + 1);
    slimDocAnnsCount += 1;
    return true;
  });
  const docConsolidated = (consolidated?.records ?? [])
    .filter((r) => r.doc_id === doc)
    .slice(0, 16)
    .map((r) => ({ ...r, tables: (r.tables ?? []).slice(0, 1) }));
  const docUnconsolidated = (consolidated?.unconsolidated ?? []).filter(
    (u) => u.doc_id === doc
  );

  const docAmendmentLinks = amendments.links.filter((l) =>
    l.target_clause.startsWith(`${doc}:`)
  );
  const referencedAmendingIds = new Set(
    docAmendmentLinks.map((l) => l.amending_clause)
  );
  const allClausesLookup: Record<string, ClauseNode> = {};
  for (const c of clauses) {
    if (
      !c.superseded_by &&
      !c.record_superseded_by &&
      referencedAmendingIds.has(c.clause_id)
    ) {
      allClausesLookup[c.clause_id] = {
        ...c,
        text: c.text.slice(0, 260),
        content: null,
        tables: [],
        versions: undefined,
      };
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
            Back to Source Register ({jurisdiction.name})
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
                {isReferenceOnly ? "REFERENCE ONLY" : "FULL TEXT"}
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
                {docMeta.notification_number ?? "Not recorded"}
              </dd>
            </div>
            <div>
              <dt className="dg-mono text-[10px]">Notified / Effective</dt>
              <dd className="font-mono text-[#080909]">
                {docMeta.notified_date ?? "Not recorded"} /{" "}
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
                {docMeta.retrieval?.archive_url &&
                  docMeta.retrieval.archive_url.startsWith("http") && (
                    <>
                      {" · "}
                      <a
                        href={docMeta.retrieval.archive_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline"
                      >
                        Wayback Snapshot ↗
                      </a>
                    </>
                  )}
                {docMeta.sha256 ? ` · ${docMeta.sha256.slice(0, 12)}…` : ""}
              </dd>
            </div>
          </dl>
        </header>

        {docMeta.role === "base" &&
          docMeta.layer === "municipal" &&
          gbaCorporations.length > 1 && (
            <section
              aria-label="Corporation consolidated view selector"
              className="mb-6 border border-[#080909] bg-[#efeee8] p-4"
            >
              <div className="dg-mono text-[10.5px] text-[#080909]">
                Corporation-Specific Consolidated View · 2026 Building (Amendment) Bye-laws
              </div>
              <p className="dg-serif mt-1 text-xs text-[#171917]">
                Each City Corporation issued its own Building (Amendment)
                Bye-laws, 2026 (in force 14 May 2026, omitting Bye-laws
                3.8–3.10 and substituting Bye-law 6.0(i) with Table-2A to
                Table-2D). Select a corporation to view its consolidated
                version:
              </p>
              <div className="mt-3 flex flex-wrap gap-2 font-mono text-[11px] uppercase tracking-[0.12em]">
                {gbaCorporations.map((corp) => {
                  const isCurrent = corp.id === jurisdiction.id;
                  return (
                    <Link
                      key={corp.id}
                      href={`/j/${corp.id}/documents/${doc}`}
                      aria-current={isCurrent ? "page" : undefined}
                      className={
                        isCurrent
                          ? "border border-[#080909] bg-[#080909] px-2.5 py-1.5 text-[#f5f3ed] no-underline"
                          : "border border-[#080909] bg-[#f5f3ed] px-2.5 py-1.5 text-[#080909] no-underline hover:bg-[#e5e6de]"
                      }
                    >
                      {corp.name}
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

        {(declarations.known_gaps ?? [])
          .filter((g) => g.doc_id === doc)
          .map((gap, gIdx) => (
            <section
              key={`gap-${gIdx}`}
              aria-label="Document coverage notice"
              className="mb-6 border border-[#080909] bg-[#efeee8] p-4"
            >
              <div className="dg-mono text-[10.5px] text-[#080909]">
                Coverage Notice · Original Wording (v1)
              </div>
              <p className="dg-serif mt-1 text-sm text-[#171917]">
                {gap.description}
              </p>
            </section>
          ))}

        {isReferenceOnly ? (
          <section
            aria-label="Reference-only standard metadata and cited provisions"
            className="space-y-6 border border-[#080909] bg-[#f5f3ed] p-6"
          >
            <div className="border-l-2 border-[#080909] bg-[#efeee8] p-4">
              <div className="dg-mono text-[#080909]">
                Text Rights Notice (Reference Only)
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
                        <td className="font-mono text-xs">
                          {cp.part ?? "Not specified"}
                        </td>
                        <td className="font-mono text-xs font-medium">
                          {cp.clause}
                        </td>
                        <td>{cp.topic ?? "Not specified"}</td>
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
                        <td className="text-xs">
                          {cp.where_to_obtain ?? "Not specified"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        ) : docClauses.length === 0 ? (
          <section
            aria-label="Structuring status"
            className="border border-[#080909] bg-[#efeee8] p-6"
          >
            <h2 className="text-lg font-semibold text-[#080909]">
              Not yet structured
            </h2>
            <p className="dg-serif mt-2 max-w-2xl text-sm text-[#171917]">
              This instrument is recorded in the legal source register for{" "}
              {jurisdiction.name} but has not yet been structured into a clause
              tree in Release v{release.version}.
            </p>
          </section>
        ) : (
          <ClauseTree
            jurisdictionId={jurisdiction.id}
            jurisdictionName={jurisdiction.name}
            clauses={docClauses}
            outline={docOutline?.outline ?? []}
            totalClausesCount={
              docOutline?.total_clauses ?? nonRowDocClauses.length
            }
            defaultStatus={docMeta.legal_status}
            defaultEffectiveDate={docMeta.effective_from}
            docSourceUrl={originUrl}
            docArchiveUrl={docMeta.retrieval?.archive_url ?? null}
            annotations={slimDocAnns}
            amendmentEffects={(amendments.effects ?? [])
              .filter((e) => e.target_doc === doc)
              .map((e) => ({ ...e, new_nodes: [] }))}
            consolidatedRecords={docConsolidated}
            unconsolidatedRecords={docUnconsolidated}
            amendmentLinks={docAmendmentLinks}
            allClausesLookup={allClausesLookup}
            allowConsolidatedToggle={
              docConsolidated.length > 0 ||
              (amendments.effects ?? []).some((e) => e.target_doc === doc)
            }
          />
        )}
      </main>
    </div>
  );
}
