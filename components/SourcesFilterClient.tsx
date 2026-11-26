"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import type { DocumentMetadata } from "@/lib/data";
import {
  formatHumanDate,
  formatPlainDocumentTitle,
  formatPlainInstrumentStatus,
  formatPlainLayerLabel,
  formatPlainWhatChangedSummary,
  isDocumentTextHeld,
  sortDocumentsMostRecentFirst,
} from "@/lib/plain-language";

interface SourcesFilterClientProps {
  jurisdictionId: string;
  documents: DocumentMetadata[];
  structuredDocIds: string[];
}

export function SourcesFilterClient({
  jurisdictionId,
  documents,
  structuredDocIds,
}: SourcesFilterClientProps) {
  const [selectedLayer, setSelectedLayer] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [query, setQuery] = useState<string>("");

  const structuredSet = useMemo(
    () => new Set(structuredDocIds),
    [structuredDocIds]
  );

  const sortedDocuments = useMemo(
    () => sortDocumentsMostRecentFirst(documents),
    [documents]
  );

  const layers = useMemo(() => {
    const set = new Set<string>();
    for (const d of sortedDocuments) {
      set.add(d.layer);
    }
    return ["ALL", ...Array.from(set)];
  }, [sortedDocuments]);

  const statuses = useMemo(() => {
    const set = new Set<string>();
    for (const d of sortedDocuments) {
      set.add(d.legal_status);
    }
    return ["ALL", ...Array.from(set)];
  }, [sortedDocuments]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sortedDocuments.filter((doc) => {
      if (selectedLayer !== "ALL" && doc.layer !== selectedLayer) {
        return false;
      }
      if (selectedStatus !== "ALL" && doc.legal_status !== selectedStatus) {
        return false;
      }
      if (!q) {
        return true;
      }
      return (
        doc.doc_id.toLowerCase().includes(q) ||
        doc.title.toLowerCase().includes(q) ||
        doc.issuing_authority.toLowerCase().includes(q) ||
        (doc.notification_number?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [sortedDocuments, query, selectedLayer, selectedStatus]);

  const applicableFiltered = useMemo(
    () =>
      filtered.filter((d) => d.applies_to_jurisdiction?.status !== "no"),
    [filtered]
  );
  const notApplicableHereFiltered = useMemo(
    () =>
      filtered.filter((d) => d.applies_to_jurisdiction?.status === "no"),
    [filtered]
  );

  function renderDocumentCard(doc: DocumentMetadata) {
    const iType = doc.instrument_type ?? "instrument";
    const isNonTextType =
      iType === "compilation" || iType === "map" || iType === "bill";
    const isRefOnly =
      doc.text_rights?.mode === "reference_only" || isNonTextType;
    const isStructured =
      structuredSet.has(doc.doc_id) &&
      !isNonTextType &&
      isDocumentTextHeld(doc);
    const originUrl = doc.official_url || doc.source_url;
    const archiveUrl = doc.retrieval?.archive_url ?? null;
    const acqStatus = doc.acquisition_status ?? "acquired";
    const isNotApplicable = doc.applies_to_jurisdiction?.status === "no";
    const plainStatus = formatPlainInstrumentStatus(doc);
    const displayDate = formatHumanDate(
      doc.effective_from || doc.notified_date
    );
    const plainTitle = formatPlainDocumentTitle(doc);
    const summaryText =
      doc.summary_by_site || formatPlainWhatChangedSummary(doc);

    return (
      <article key={doc.doc_id} className="p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2 font-mono text-xs text-[#5b5e56]">
            <span>{displayDate}</span>
            <span>·</span>
            <span>{formatPlainLayerLabel(doc.layer)}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!isStructured && !isNonTextType && (
              <span className="border border-[#080909] bg-[#f5f3ed] px-1.5 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.12em] text-[#5b5e56]">
                Not yet structured
              </span>
            )}
            {isNotApplicable && doc.applies_to_jurisdiction && (
              <span
                title={doc.applies_to_jurisdiction.reason}
                className="border border-[#080909] bg-[#f5f3ed] px-1.5 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.12em] text-[#080909]"
              >
                Not applicable here (likely)
              </span>
            )}
            <span className="border border-[#080909] bg-[#efeee8] px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-[#080909]">
              {plainStatus}
            </span>
          </div>
        </div>

        <h2 className="mt-1.5 text-lg font-semibold tracking-tight text-[#080909]">
          {plainTitle}
        </h2>

        <p className="dg-serif mt-1.5 text-sm text-[#171917]">
          <strong className="font-mono text-[10.5px] uppercase tracking-[0.08em] text-[#5b5e56]">
            In short, by this site:{" "}
          </strong>
          {summaryText}
        </p>

        {doc.notes_by_site && doc.notes_by_site.length > 0 && (
          <div className="mt-2 space-y-1 border-l-2 border-[#080909] bg-[#efeee8] px-3 py-2 text-xs text-[#171917]">
            <div className="dg-mono text-[9.5px] text-[#080909]">
              Note by this site
            </div>
            {doc.notes_by_site.map((noteText, nIdx) => (
              <p key={nIdx} className="dg-serif">
                {noteText}
              </p>
            ))}
          </div>
        )}

        {isNotApplicable && doc.applies_to_jurisdiction && (
          <details className="mt-2 border-l-2 border-[#080909] bg-[#efeee8] px-3 py-2 text-xs text-[#171917]">
            <summary className="cursor-pointer font-mono text-[10px] uppercase tracking-[0.1em] text-[#080909] underline">
              Quoted statutory evidence on applicability &amp; Bye-law 1.4
            </summary>
            <p className="dg-serif mt-1.5">
              {doc.applies_to_jurisdiction.reason}
            </p>
            {doc.applies_to_jurisdiction.quoted_evidence && (
              <p className="dg-serif mt-1.5 italic text-[#080909]">
                {doc.applies_to_jurisdiction.quoted_evidence}
              </p>
            )}
          </details>
        )}

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-[#c8ccc0] pt-2.5 font-mono text-[10.5px] uppercase tracking-[0.12em]">
          <div className="flex flex-wrap items-center gap-4">
            {isStructured && (
              <Link
                href={`/j/${jurisdictionId}/documents/${doc.doc_id}`}
                className="font-medium text-[#080909] underline underline-offset-3"
              >
                Read Structured Document →
              </Link>
            )}
            {!isStructured &&
              isRefOnly &&
              (doc.cited_provisions?.length ?? 0) > 0 && (
                <Link
                  href={`/j/${jurisdictionId}/documents/${doc.doc_id}`}
                  className="font-medium text-[#080909] underline underline-offset-3"
                >
                  View Reference &amp; Citing Clauses →
                </Link>
              )}
            {originUrl && originUrl.startsWith("http") && (
              <a
                href={originUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#5b5e56] underline underline-offset-3 hover:text-[#080909]"
              >
                Official Origin ↗
              </a>
            )}
          </div>

          <details className="text-xs normal-case">
            <summary className="cursor-pointer font-mono text-[10px] uppercase tracking-[0.12em] text-[#5b5e56] underline">
              Details
            </summary>
            <div className="mt-2 space-y-1.5 border border-[#c8ccc0] bg-[#efeee8] p-3 text-xs text-[#171917]">
              <div>
                <strong>Official title:</strong> {doc.title} (
                <code>{doc.doc_id}</code>)
              </div>
              <div>
                <strong>Authority:</strong> {doc.issuing_authority}
                {doc.notification_number
                  ? ` · Ref: ${doc.notification_number}`
                  : ""}
              </div>
              <div>
                <strong>Notified:</strong> {doc.notified_date ?? "Not recorded"}{" "}
                · <strong>Effective:</strong>{" "}
                {doc.effective_from ?? "Not in force"}
              </div>
              {archiveUrl && archiveUrl.startsWith("http") && (
                <div>
                  <strong>Archive copy:</strong>{" "}
                  <a
                    href={archiveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    Wayback Snapshot ↗
                  </a>
                </div>
              )}
              {(doc.status_evidence.quoted_line ||
                doc.status_evidence.description) && (
                <div>
                  <strong>Status evidence:</strong>{" "}
                  {doc.status_evidence.quoted_line ??
                    doc.status_evidence.description}
                </div>
              )}
              <div>
                <strong>SHA-256:</strong>{" "}
                <span className="font-mono text-[11px]">
                  {doc.sha256
                    ? `${doc.sha256.slice(0, 16)}…`
                    : acqStatus === "not_found"
                      ? "Not found"
                      : "External reference"}
                </span>
                {doc.text_rights ? ` · ${doc.text_rights.reason}` : ""}
              </div>
            </div>
          </details>
        </div>
      </article>
    );
  }

  return (
    <section aria-label="Regulatory source register" className="space-y-6">
      <div className="grid grid-cols-1 gap-4 border border-[#080909] bg-[#efeee8] p-4 md:grid-cols-3">
        <div>
          <label
            htmlFor="sources-search"
            className="dg-mono block text-[10.5px] text-[#080909]"
          >
            Filter sources by title, authority, or notification number
          </label>
          <input
            id="sources-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter sources..."
            className="mt-1.5 w-full border border-[#080909] bg-[#f5f3ed] px-3 py-1.5 text-sm text-[#080909]"
          />
        </div>

        <div>
          <label
            htmlFor="sources-layer-filter"
            className="dg-mono block text-[10.5px] text-[#080909]"
          >
            Category
          </label>
          <select
            id="sources-layer-filter"
            value={selectedLayer}
            onChange={(e) => setSelectedLayer(e.target.value)}
            className="mt-1.5 w-full border border-[#080909] bg-[#f5f3ed] px-3 py-1.5 font-mono text-xs text-[#080909]"
          >
            {layers.map((lyr) => (
              <option key={lyr} value={lyr}>
                {lyr === "ALL" ? "All categories" : formatPlainLayerLabel(lyr)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="sources-status-filter"
            className="dg-mono block text-[10.5px] text-[#080909]"
          >
            Legal status
          </label>
          <select
            id="sources-status-filter"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="mt-1.5 w-full border border-[#080909] bg-[#f5f3ed] px-3 py-1.5 font-mono text-xs uppercase text-[#080909]"
          >
            {statuses.map((st) => (
              <option key={st} value={st}>
                {st === "ALL" ? "All statuses" : st.replace("_", " ")}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="dg-mono">
        Showing {filtered.length} of {documents.length} source instrument(s) ·
        Most recent first
      </div>

      <div className="divide-y divide-[#080909] border border-[#080909] bg-[#f5f3ed]">
        {applicableFiltered.map((doc) => renderDocumentCard(doc))}
      </div>

      {notApplicableHereFiltered.length > 0 && (
        <div
          aria-label="In force elsewhere, not applicable here"
          className="space-y-3 border border-[#080909] bg-[#efeee8] p-5"
        >
          <div>
            <div className="dg-mono text-[10.5px] text-[#080909]">
              Register Only · Excluded from Active Definitions, Relations &amp;
              Parameters
            </div>
            <h3 className="mt-1 text-lg font-semibold text-[#080909]">
              In force elsewhere, not applicable here
            </h3>
          </div>
          <div className="divide-y divide-[#080909] border border-[#080909] bg-[#f5f3ed]">
            {notApplicableHereFiltered.map((doc) => renderDocumentCard(doc))}
          </div>
        </div>
      )}
    </section>
  );
}
