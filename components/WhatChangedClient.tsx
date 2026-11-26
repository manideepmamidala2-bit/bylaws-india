"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import type { AmendmentLink, DocumentMetadata } from "@/lib/data";
import {
  formatHumanDate,
  formatPlainDocumentTitle,
  formatPlainInstrumentStatus,
  formatPlainInstrumentType,
  formatPlainWhatChangedSummary,
  isDocumentTextHeld,
  sortDocumentsMostRecentFirst,
} from "@/lib/plain-language";
import { formatPlainCorporationName } from "./CorporationSelector";

interface WhatChangedClientProps {
  jurisdictionId: string;
  documents: DocumentMetadata[];
  amendmentLinks: AmendmentLink[];
}

const TYPE_FILTERS = [
  "All",
  "Amendment",
  "Notification",
  "Order",
  "Act",
  "Regulation",
] as const;

export function WhatChangedClient({
  jurisdictionId,
  documents,
  amendmentLinks,
}: WhatChangedClientProps) {
  const [selectedType, setSelectedType] = useState<string>("All");
  const [selectedCorp, setSelectedCorp] = useState<string>("ALL");

  const sortedDocs = useMemo(
    () =>
      sortDocumentsMostRecentFirst(
        documents.filter((d) => (d.instrument_type ?? "instrument") !== "map")
      ),
    [documents]
  );

  const linksByAmendingDoc = useMemo(() => {
    const map = new Map<string, AmendmentLink[]>();
    for (const lnk of amendmentLinks) {
      const docId =
        lnk.amending_doc_id ?? lnk.amending_clause.split(":", 1)[0] ?? "";
      const list = map.get(docId) ?? [];
      list.push(lnk);
      map.set(docId, list);
    }
    return map;
  }, [amendmentLinks]);

  const filteredDocs = useMemo(() => {
    return sortedDocs.filter((doc) => {
      const plainType = formatPlainInstrumentType(doc);
      if (selectedType !== "All" && plainType !== selectedType) {
        return false;
      }
      if (selectedCorp !== "ALL") {
        const applies = doc.applies_in ?? [];
        if (applies.length > 0 && !applies.includes(selectedCorp)) {
          return false;
        }
      }
      return true;
    });
  }, [sortedDocs, selectedType, selectedCorp]);

  return (
    <div className="space-y-6">
      {/* Filter bar by type and corporation */}
      <div
        role="region"
        aria-label="Filter changes by type and corporation"
        className="flex flex-wrap items-center justify-between gap-4 border-y border-[#c8ccc0] bg-[#efeee8] p-4"
      >
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="dg-mono mr-2 text-[#5b5e56]">Type:</span>
          {TYPE_FILTERS.map((t) => {
            const isActive = selectedType === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setSelectedType(t)}
                aria-pressed={isActive}
                className={`inline-flex min-h-[44px] items-center border px-3 font-mono text-xs uppercase tracking-[0.12em] ${
                  isActive
                    ? "border-[#080909] border-b-2 border-b-[#ff6b52] bg-[#f5f3ed] font-semibold text-[#080909]"
                    : "border-[#c8ccc0] bg-[#f5f3ed] text-[#5b5e56] hover:text-[#080909]"
                }`}
              >
                {t}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <label
            htmlFor="what-changed-corp-filter"
            className="dg-mono text-[#5b5e56]"
          >
            Corporation:
          </label>
          <select
            id="what-changed-corp-filter"
            value={selectedCorp}
            onChange={(e) => setSelectedCorp(e.target.value)}
            className="min-h-[44px] border border-[#080909] bg-[#f5f3ed] px-3 py-1.5 font-mono text-xs text-[#080909]"
          >
            <option value="ALL">All corporations</option>
            <option value="in-ka-bengaluru-central">
              {formatPlainCorporationName("in-ka-bengaluru-central")}
            </option>
            <option value="in-ka-bengaluru-north">
              {formatPlainCorporationName("in-ka-bengaluru-north")}
            </option>
            <option value="in-ka-bengaluru-south">
              {formatPlainCorporationName("in-ka-bengaluru-south")}
            </option>
            <option value="in-ka-bengaluru-east">
              {formatPlainCorporationName("in-ka-bengaluru-east")}
            </option>
            <option value="in-ka-bengaluru-west">
              {formatPlainCorporationName("in-ka-bengaluru-west")}
            </option>
          </select>
        </div>
      </div>

      <ol
        aria-label="Chronological regulatory instruments"
        className="divide-y divide-[#c8ccc0] border-y border-[#c8ccc0]"
      >
        {filteredDocs.map((doc) => {
          const docLinks = linksByAmendingDoc.get(doc.doc_id) ?? [];
          const rawDate = doc.effective_from ?? doc.notified_date;
          const displayDate = formatHumanDate(rawDate);
          const plainStatus = formatPlainInstrumentStatus(doc);
          const plainType = formatPlainInstrumentType(doc);
          const plainTitle = formatPlainDocumentTitle(doc);
          const whatChangedLine =
            doc.summary_by_site || formatPlainWhatChangedSummary(doc);
          const textHeld = isDocumentTextHeld(doc);
          const originUrl = doc.official_url || doc.source_url;

          return (
            <li key={doc.doc_id} className="py-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2 font-mono text-xs text-[#5b5e56]">
                  <span className="font-semibold text-[#080909]">
                    {displayDate}
                  </span>
                  <span>·</span>
                  <span>{plainType}</span>
                </div>
                <span className="border border-[#080909] bg-[#efeee8] px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-[#080909]">
                  {plainStatus}
                </span>
              </div>

              <h2 className="mt-2 text-lg font-semibold text-[#080909]">
                {textHeld ? (
                  <Link
                    href={`/j/${jurisdictionId}/documents/${doc.doc_id}`}
                    className="text-[#080909] underline decoration-[#c8ccc0] underline-offset-4 hover:decoration-[#080909]"
                  >
                    {plainTitle}
                  </Link>
                ) : (
                  plainTitle
                )}
              </h2>

              <p className="dg-serif mt-1.5 text-sm text-[#171917]">
                <span className="dg-mono mr-2 text-[#5b5e56]">
                  In short, by this site:
                </span>
                {whatChangedLine}
              </p>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-4 font-mono text-xs uppercase tracking-[0.12em]">
                  {textHeld ? (
                    <Link
                      href={`/j/${jurisdictionId}/documents/${doc.doc_id}`}
                      className="inline-flex min-h-[44px] items-center text-[#080909] underline decoration-[#080909] underline-offset-4"
                    >
                      Open document →
                    </Link>
                  ) : originUrl && originUrl.startsWith("http") ? (
                    <a
                      href={originUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-[44px] items-center text-[#5b5e56] underline hover:text-[#080909]"
                    >
                      Official PDF ↗
                    </a>
                  ) : null}
                </div>

                <details className="text-xs">
                  <summary className="inline-flex min-h-[44px] cursor-pointer items-center font-mono text-[11px] uppercase tracking-[0.12em] text-[#5b5e56] underline">
                    Details
                  </summary>
                  <div className="mt-2 space-y-2 border border-[#c8ccc0] bg-[#efeee8] p-3 text-xs text-[#171917]">
                    <div className="font-mono text-[11px] text-[#5b5e56]">
                      Official title: {doc.title} (<code>{doc.doc_id}</code>)
                    </div>
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
                      <p className="dg-serif border-l-2 border-[#080909] bg-[#f5f3ed] px-3 py-1.5 italic text-[#080909]">
                        &ldquo;{doc.status_evidence.quoted_line}&rdquo;
                      </p>
                    )}
                    {docLinks.length > 0 && (
                      <div className="font-mono text-[11px] text-[#5b5e56]">
                        Modifies {docLinks.length} provision(s)
                      </div>
                    )}
                  </div>
                </details>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
