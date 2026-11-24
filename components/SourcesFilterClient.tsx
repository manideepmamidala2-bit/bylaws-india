"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import type { DocumentMetadata } from "@/lib/data";
import { StatusBadge } from "./StatusBadge";

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

  const layers = useMemo(() => {
    const set = new Set<string>();
    for (const d of documents) {
      set.add(d.layer);
    }
    return ["ALL", ...Array.from(set)];
  }, [documents]);

  const statuses = useMemo(() => {
    const set = new Set<string>();
    for (const d of documents) {
      set.add(d.legal_status);
    }
    return ["ALL", ...Array.from(set)];
  }, [documents]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return documents.filter((doc) => {
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
  }, [documents, query, selectedLayer, selectedStatus]);

  return (
    <section aria-label="Regulatory source register" className="space-y-6">
      <div className="grid grid-cols-1 gap-4 border border-[#080909] bg-[#efeee8] p-4 md:grid-cols-3">
        <div>
          <label
            htmlFor="sources-search"
            className="dg-mono block text-[10.5px] text-[#080909]"
          >
            Filter sources by title, ID, authority, or notification number
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
            Regulatory layer
          </label>
          <select
            id="sources-layer-filter"
            value={selectedLayer}
            onChange={(e) => setSelectedLayer(e.target.value)}
            className="mt-1.5 w-full border border-[#080909] bg-[#f5f3ed] px-3 py-1.5 font-mono text-xs uppercase text-[#080909]"
          >
            {layers.map((lyr) => (
              <option key={lyr} value={lyr}>
                {lyr.replace("_", " ")}
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
                {st.replace("_", " ")}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="dg-mono">
        Showing {filtered.length} of {documents.length} source instrument(s)
      </div>

      <div className="divide-y divide-[#080909] border border-[#080909] bg-[#f5f3ed]">
        {filtered.map((doc) => {
          const isRefOnly = doc.text_rights?.mode === "reference_only";
          const hasStructuredPage =
            structuredSet.has(doc.doc_id) || isRefOnly;
          const originUrl = doc.official_url || doc.source_url;

          return (
            <article key={doc.doc_id} className="p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2 font-mono text-xs text-[#5b5e56]">
                  <span className="font-semibold text-[#080909]">
                    {doc.doc_id}
                  </span>
                  <span>·</span>
                  <span className="uppercase">{doc.layer}</span>
                  <span>·</span>
                  <span className="uppercase">
                    {doc.doc_type ?? doc.role}
                  </span>
                  {doc.languages && doc.languages.length > 0 && (
                    <>
                      <span>·</span>
                      <span className="uppercase">
                        {doc.languages.join("+")}
                      </span>
                    </>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="border border-[#080909] bg-[#efeee8] px-1.5 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.12em] text-[#080909]">
                    {isRefOnly ? "REFERENCE ONLY" : "FULL TEXT"}
                  </span>
                  <StatusBadge status={doc.legal_status} />
                </div>
              </div>

              <h2 className="mt-1.5 text-lg font-semibold tracking-tight text-[#080909]">
                {doc.title}
              </h2>

              <dl className="mt-2 grid grid-cols-1 gap-2 text-xs sm:grid-cols-4">
                <div>
                  <dt className="dg-mono text-[10px]">Issuing Authority</dt>
                  <dd className="text-[#171917]">{doc.issuing_authority}</dd>
                </div>
                <div>
                  <dt className="dg-mono text-[10px]">Notification / Ref</dt>
                  <dd className="font-mono text-[#080909]">
                    {doc.notification_number ?? "Not recorded"}
                  </dd>
                </div>
                <div>
                  <dt className="dg-mono text-[10px]">
                    Notified / Effective
                  </dt>
                  <dd className="font-mono text-[#080909]">
                    {doc.notified_date ?? "Not recorded"} /{" "}
                    {doc.effective_from ?? "Not in force"}
                  </dd>
                </div>
                <div>
                  <dt className="dg-mono text-[10px]">SHA-256 Checksum</dt>
                  <dd
                    className="truncate font-mono text-[11px] text-[#5b5e56]"
                    title={doc.sha256 ?? "Reference-only external standard"}
                  >
                    {doc.sha256
                      ? `${doc.sha256.slice(0, 16)}…`
                      : "External reference (no file)"}
                  </dd>
                </div>
              </dl>

              {(doc.status_evidence.quoted_line ||
                doc.status_evidence.description) && (
                <div className="mt-3 border-l-2 border-[#080909] bg-[#efeee8] px-3 py-2 text-xs">
                  <div className="dg-mono text-[9.5px] text-[#080909]">
                    Status Evidence
                    {doc.superseded_by_document
                      ? ` · Superseded by ${doc.superseded_by_document}`
                      : ""}
                  </div>
                  <p className="dg-serif mt-0.5 text-sm text-[#171917]">
                    {doc.status_evidence.quoted_line ??
                      doc.status_evidence.description}
                  </p>
                </div>
              )}

              {doc.text_rights && (
                <p className="mt-2 font-mono text-[10.5px] text-[#5b5e56]">
                  Text rights: {doc.text_rights.reason}
                </p>
              )}

              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-[#c8ccc0] pt-2.5 font-mono text-[10.5px] uppercase tracking-[0.12em]">
                <div className="flex flex-wrap items-center gap-4">
                  {hasStructuredPage && (
                    <Link
                      href={`/j/${jurisdictionId}/documents/${doc.doc_id}`}
                      className="font-medium text-[#080909] underline underline-offset-3"
                    >
                      {isRefOnly
                        ? "View Reference & Citing Clauses →"
                        : "Read Structured Document →"}
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
                  {(doc.mirror_urls ?? []).map((mUrl, mIdx) => (
                    <a
                      key={`${doc.doc_id}-mirror-${mIdx}`}
                      href={mUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#5b5e56] underline underline-offset-3 hover:text-[#080909]"
                    >
                      Mirror {mIdx + 1} ↗
                    </a>
                  ))}
                </div>

                {doc.amends && doc.amends.length > 0 && (
                  <span className="text-[#5b5e56]">
                    Amends: {doc.amends.join(", ")}
                  </span>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
