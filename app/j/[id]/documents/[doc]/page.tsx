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
import { CorporationSelector } from "@/components/CorporationSelector";
import { ClauseTree } from "@/components/ClauseTree";
import {
  formatHumanDate,
  formatPlainDocumentTitle,
  formatPlainInstrumentStatus,
  formatPlainLayerLabel,
  formatPlainWhatChangedSummary,
} from "@/lib/plain-language";

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
          <header className="border-b border-[#c8ccc0] pb-6">
            <div className="dg-mono">Document</div>
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

  const iType = docMeta.instrument_type ?? "instrument";
  const isNonTextInstrument =
    iType === "compilation" || iType === "map" || iType === "bill";
  const isReferenceOnly =
    docMeta.text_rights?.mode === "reference_only" || isNonTextInstrument;
  const hasCitedReferenceTable =
    isReferenceOnly && (docMeta.cited_provisions?.length ?? 0) > 0;
  const plainStatus = formatPlainInstrumentStatus(docMeta);
  const displayDate = formatHumanDate(
    docMeta.effective_from || docMeta.notified_date
  );
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
  const plainDocTitle = formatPlainDocumentTitle(docMeta);
  const plainSummary =
    docMeta.summary_by_site || formatPlainWhatChangedSummary(docMeta);
  const relevantGaps = (declarations.known_gaps ?? []).filter(
    (g) =>
      g.doc_id === doc &&
      !g.description.includes("04-03-2026") &&
      !g.description.toLowerCase().includes("draft") &&
      !g.description.toLowerCase().includes("zero extracted clauses")
  );

  return (
    <div className="min-h-screen bg-[#f5f3ed] text-[#080909]">
      <TopNav
        jurisdictionId={jurisdiction.id}
        jurisdictionName={jurisdiction.name}
        active="documents"
        releaseVersion={release.version}
        licence={release.licence}
      />

      <main className="mx-auto max-w-5xl px-5 py-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <Link
            href={`/j/${jurisdiction.id}/topics`}
            className="inline-flex min-h-[44px] items-center font-mono text-xs uppercase tracking-[0.12em] text-[#5b5e56] no-underline hover:text-[#080909]"
          >
            ← The code
          </Link>
          <Link
            href={`/j/${jurisdiction.id}/sources`}
            className="inline-flex min-h-[44px] items-center font-mono text-xs uppercase tracking-[0.12em] text-[#5b5e56] underline hover:text-[#080909]"
          >
            Sources
          </Link>
        </div>

        <header className="mb-6 border-b border-[#c8ccc0] pb-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="dg-mono text-[#5b5e56]">
              {docMeta.issuing_authority} · {displayDate} ·{" "}
              {formatPlainLayerLabel(docMeta.layer)}
            </span>
            <span className="border border-[#080909] bg-[#efeee8] px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-[#080909]">
              {plainStatus}
            </span>
          </div>

          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[#080909] sm:text-3xl">
            {plainDocTitle}
          </h1>

          {plainSummary && (
            <p className="dg-serif mt-2 text-sm text-[#171917]">
              <strong className="font-mono text-[10.5px] uppercase tracking-[0.08em] text-[#5b5e56]">
                In short, by this site:{" "}
              </strong>
              {plainSummary}
            </p>
          )}

          {docMeta.notes_by_site && docMeta.notes_by_site.length > 0 && (
            <div className="mt-3 space-y-1 border-l-2 border-[#080909] bg-[#efeee8] px-3 py-2 text-xs text-[#171917]">
              <div className="dg-mono text-[9.5px] text-[#080909]">
                Note by this site
              </div>
              {docMeta.notes_by_site.map((noteTxt, nIdx) => (
                <p key={nIdx} className="dg-serif">
                  {noteTxt}
                </p>
              ))}
            </div>
          )}

          <CorporationSelector
            currentId={jurisdiction.id}
            currentName={jurisdiction.name}
            pathSuffix={`/documents/${doc}`}
            corporations={gbaCorporations}
          />

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#c8ccc0] pt-3 text-xs">
            <div className="flex flex-wrap items-center gap-4 font-mono text-xs text-[#080909]">
              {originUrl && originUrl.startsWith("http") && (
                <a
                  href={originUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[44px] items-center underline"
                >
                  Official PDF ↗
                </a>
              )}
            </div>

            <details className="text-xs">
              <summary className="inline-flex min-h-[44px] cursor-pointer items-center font-mono text-[11px] uppercase tracking-[0.12em] text-[#5b5e56] underline">
                Details
              </summary>
              <dl className="mt-2 grid grid-cols-1 gap-3 border border-[#c8ccc0] bg-[#efeee8] p-3 text-xs sm:grid-cols-3">
                <div>
                  <dt className="dg-mono text-[10px]">Official title</dt>
                  <dd className="text-[#171917]">{docMeta.title}</dd>
                </div>
                <div>
                  <dt className="dg-mono text-[10px]">Notification / Gazette</dt>
                  <dd className="font-mono text-[#080909]">
                    {docMeta.notification_number ?? "Not recorded"} (
                    <code>{docMeta.doc_id}</code>)
                  </dd>
                </div>
                <div>
                  <dt className="dg-mono text-[10px]">Archive &amp; Checksum</dt>
                  <dd className="font-mono text-[#080909]">
                    {docMeta.retrieval?.archive_url &&
                    docMeta.retrieval.archive_url.startsWith("http") ? (
                      <a
                        href={docMeta.retrieval.archive_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline"
                      >
                        Wayback Snapshot ↗
                      </a>
                    ) : (
                      "Archive not recorded"
                    )}
                    {docMeta.sha256
                      ? ` · SHA-256: ${docMeta.sha256.slice(0, 12)}…`
                      : ""}
                  </dd>
                </div>
              </dl>
            </details>
          </div>
        </header>

        {relevantGaps.map((gap, gIdx) => (
          <section
            key={`gap-${gIdx}`}
            aria-label="Document coverage notice"
            className="mb-6 border-l-2 border-[#080909] bg-[#efeee8] p-4"
          >
            <div className="dg-mono text-[10.5px] text-[#5b5e56]">
              Known gap affecting this document
            </div>
            <p className="dg-serif mt-1 text-sm text-[#171917]">
              {gap.description}
            </p>
          </section>
        ))}

        {hasCitedReferenceTable ? (
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
                          <details>
                            <summary className="cursor-pointer underline">
                              {cp.cited_by.length} citing provision(s)
                            </summary>
                            <div className="mt-1 flex flex-wrap gap-2">
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
                          </details>
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
              {jurisdiction.name} but its full provision tree is not held on
              this site.
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
