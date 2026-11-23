"use client";

import React, { useState } from "react";
import type {
  AmendmentLink,
  ClauseNode,
  ConsolidatedClauseRecord,
  DisplayLegalStatus,
  UnconsolidatedClauseRecord,
} from "@/lib/data";
import { partitionClauseVersions } from "@/lib/data";
import { StatusBadge } from "./StatusBadge";

interface ClauseTreeProps {
  clauses: ClauseNode[];
  consolidatedRecords?: ConsolidatedClauseRecord[];
  unconsolidatedRecords?: UnconsolidatedClauseRecord[];
  amendmentLinks?: AmendmentLink[];
  allClausesLookup?: Record<string, ClauseNode>;
  allowConsolidatedToggle?: boolean;
}

export function ClauseTree({
  clauses,
  consolidatedRecords = [],
  unconsolidatedRecords = [],
  amendmentLinks = [],
  allClausesLookup = {},
  allowConsolidatedToggle = false,
}: ClauseTreeProps) {
  const [query, setQuery] = useState("");
  const [viewMode, setViewMode] = useState<"original" | "consolidated">(
    "original"
  );

  const { activeClauses, historyByClauseId } = partitionClauseVersions(clauses);
  const baseClauses = activeClauses.length > 0 ? activeClauses : clauses;

  const consolidatedByClauseId = new Map<string, ConsolidatedClauseRecord>();
  for (const rec of consolidatedRecords) {
    consolidatedByClauseId.set(rec.clause_id, rec);
  }

  const unconsolidatedByClauseId = new Map<
    string,
    UnconsolidatedClauseRecord
  >();
  for (const u of unconsolidatedRecords) {
    unconsolidatedByClauseId.set(u.clause_id, u);
  }

  const amendmentsByTarget = new Map<string, AmendmentLink[]>();
  for (const lnk of amendmentLinks) {
    const existing = amendmentsByTarget.get(lnk.target_clause) ?? [];
    existing.push(lnk);
    amendmentsByTarget.set(lnk.target_clause, existing);
  }

  const normalizedQuery = query.trim().toLowerCase();
  const filtered = baseClauses.filter((clause) => {
    if (!normalizedQuery) {
      return true;
    }
    const cons = consolidatedByClauseId.get(clause.clause_id);
    return (
      clause.number.toLowerCase().includes(normalizedQuery) ||
      (clause.title?.toLowerCase().includes(normalizedQuery) ?? false) ||
      clause.text.toLowerCase().includes(normalizedQuery) ||
      (cons?.text.toLowerCase().includes(normalizedQuery) ?? false)
    );
  });

  return (
    <section aria-label="Clause tree browser" className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#c8ccc0] pb-4">
        <div className="flex-1 min-w-[260px]">
          <label
            htmlFor="clause-search"
            className="dg-mono block text-[10.5px] text-[#080909]"
          >
            Filter clauses by number, title, or text
          </label>
          <input
            id="clause-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter clauses..."
            className="mt-1.5 w-full border border-[#080909] bg-[#f5f3ed] px-3 py-2 text-sm text-[#080909]"
          />
        </div>

        {allowConsolidatedToggle && (
          <div
            role="group"
            aria-label="Document text view mode"
            className="flex items-center gap-2"
          >
            <button
              type="button"
              onClick={() => setViewMode("original")}
              aria-pressed={viewMode === "original"}
              className={`dg-pill ${viewMode === "original" ? "dg-pill-active" : ""}`}
            >
              Original Gazette Text
            </button>
            <button
              type="button"
              onClick={() => setViewMode("consolidated")}
              aria-pressed={viewMode === "consolidated"}
              className={`dg-pill ${viewMode === "consolidated" ? "dg-pill-active" : ""}`}
            >
              As Amended (Derived)
            </button>
          </div>
        )}
      </div>

      {viewMode === "consolidated" && (
        <div
          role="note"
          aria-label="Derived consolidation notice"
          className="flex items-start gap-2.5 border border-[#080909] bg-[#efeee8] px-4 py-3 text-xs text-[#080909]"
        >
          <span className="dg-accent-dot mt-1" />
          <div>
            <strong className="font-mono uppercase tracking-[0.12em]">
              Derived by this project, not an official publication (Rule R14):
            </strong>{" "}
            <span className="dg-serif text-sm">
              Consolidated clauses are produced deterministically only where all
              applicable amendment links are high-confidence. Where consolidation
              is not performed, original wording and amending clauses are shown
              side by side.
            </span>
          </div>
        </div>
      )}

      <div className="divide-y divide-[#c8ccc0] border border-[#080909] bg-[#f5f3ed]">
        {filtered.map((clause) => {
          // Rule R12: legal_status is strictly legislative status, never conflated with record_version
          const status: DisplayLegalStatus =
            clause.legal_status ?? "status_unknown";
          const validPages = Array.from(
            new Set(
              (clause.citations ?? [])
                .map((citation) => citation.page)
                .filter(
                  (page): page is number =>
                    typeof page === "number" &&
                    Number.isInteger(page) &&
                    page >= 1
                )
            )
          );
          const firstPage = validPages[0] ?? null;
          const consRecord =
            viewMode === "consolidated"
              ? consolidatedByClauseId.get(clause.clause_id)
              : undefined;
          const unconsRecord =
            viewMode === "consolidated"
              ? unconsolidatedByClauseId.get(clause.clause_id)
              : undefined;
          const targetAmendments =
            amendmentsByTarget.get(clause.clause_id) ?? [];

          const displayTitle = consRecord ? consRecord.title : clause.title;
          const displayText = consRecord ? consRecord.text : clause.text;
          const displayTables = consRecord ? consRecord.tables : clause.tables;

          const recordVersion =
            clause.record_version ??
            (clause.record_id?.includes("@v")
              ? Number(clause.record_id.split("@v")[1]) || 1
              : 1);
          const priorVersions = historyByClauseId.get(clause.clause_id) ?? [];
          const hasVersionHistory =
            recordVersion > 1 ||
            Boolean(clause.record_supersedes || clause.supersedes) ||
            priorVersions.length > 0;

          const sourceHref = clause.official_url || clause.source_url;

          return (
            <details
              key={clause.record_id ?? clause.clause_id}
              open
              className="p-4"
            >
              <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2 font-medium text-[#080909]">
                <span>
                  <span className="font-mono text-xs">{clause.number}</span>{" "}
                  {displayTitle && (
                    <span className="font-semibold">{displayTitle}</span>
                  )}
                </span>
                <span className="flex flex-wrap items-center gap-2">
                  {consRecord && (
                    <span className="border border-[#080909] bg-[#efeee8] px-1.5 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.12em] text-[#080909]">
                      Derived · As of {consRecord.as_of_date}
                    </span>
                  )}
                  {clause.language === "kn" && (
                    <span className="border border-[#080909] px-1.5 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.12em] text-[#080909]">
                      KN · Verbatim
                    </span>
                  )}
                  <StatusBadge status={status} />
                </span>
              </summary>

              <p
                lang={clause.language === "kn" ? "kn" : "en"}
                className="dg-serif mt-2 whitespace-pre-line text-[15px] leading-[1.52] text-[#171917]"
              >
                {displayText}
              </p>

              {consRecord && (
                <div className="mt-2 border-l-2 border-[#080909] bg-[#efeee8] px-3 py-2 text-xs">
                  <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#080909]">
                    Derived by this project, not an official publication ·
                    Amendments applied: {consRecord.amendments_applied.join(", ")}
                  </div>
                  <div className="mt-1 text-xs text-[#5b5e56]">
                    Original wording ({clause.clause_id}): &ldquo;{clause.text}
                    &rdquo;
                  </div>
                </div>
              )}

              {unconsRecord && (
                <div className="mt-2 border border-dashed border-[#080909] bg-[#efeee8] px-3 py-2 font-mono text-[10.5px] text-[#080909]">
                  Unconsolidated: {unconsRecord.reason}
                </div>
              )}

              {displayTables.map((table) => (
                <div key={table.table_id} className="mt-3 overflow-x-auto">
                  {table.caption && (
                    <p className="mb-1 font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-[#080909]">
                      {table.caption}
                    </p>
                  )}
                  <table className="dg-table">
                    <thead>
                      <tr>
                        {table.headers.map((header, idx) => (
                          <th key={idx}>{header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {table.rows.map((row, rIdx) => (
                        <tr key={rIdx}>
                          {row.map((cell, cIdx) => (
                            <td key={cIdx}>{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}

              {targetAmendments.length > 0 && (
                <div className="mt-3 space-y-2">
                  {targetAmendments.map((lnk, lIdx) => {
                    const amendingClause = allClausesLookup[lnk.amending_clause];
                    return (
                      <div
                        key={`${lnk.amending_clause}-${lIdx}`}
                        className="border-l-2 border-[#080909] pl-3"
                      >
                        <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#5b5e56]">
                          Amending clause: {lnk.amending_clause} ·{" "}
                          {lnk.action.replace("_", " ")}
                          {lnk.effective_date ? ` · ${lnk.effective_date}` : ""}
                        </div>
                        {amendingClause && (
                          <p className="dg-serif mt-0.5 text-sm text-[#5b5e56]">
                            {amendingClause.text}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 font-mono text-[10.5px] uppercase tracking-[0.12em] text-[#5b5e56]">
                <span>
                  {validPages.length > 0 ? (
                    <>
                      Pages: {validPages.join(", ")} ·{" "}
                      {clause.verification.replace("_", " ")}
                      {clause.effective_from
                        ? ` · Effective ${clause.effective_from}`
                        : ""}
                    </>
                  ) : (
                    "No source page recorded"
                  )}
                </span>
                {firstPage !== null &&
                  sourceHref &&
                  sourceHref.startsWith("http") && (
                    <a
                      href={`${sourceHref}#page=${firstPage}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#080909] underline underline-offset-3"
                    >
                      View source p. {firstPage}
                    </a>
                  )}
              </div>

              {hasVersionHistory && (
                <details
                  data-testid={`tree-record-version-history-${clause.clause_id}`}
                  className="mt-2 border-t border-[#e5e6de] pt-1.5 text-xs text-[#5b5e56]"
                >
                  <summary className="cursor-pointer font-mono text-[10px] uppercase tracking-[0.12em] text-[#080909]">
                    v{recordVersion} · corrected from v
                    {Math.max(1, recordVersion - 1)} (record version history)
                  </summary>
                  <div className="mt-1.5 space-y-1.5 bg-[#efeee8] p-2">
                    {clause.record_change_reason && (
                      <p className="font-mono text-[10px] text-[#080909]">
                        Correction note: {clause.record_change_reason}
                      </p>
                    )}
                    {priorVersions.map((pv) => (
                      <div
                        key={pv.record_id}
                        className="border-t border-[#c8ccc0] pt-1 text-xs"
                      >
                        <div className="font-mono text-[10px] text-[#5b5e56]">
                          Prior record {pv.record_id} (v
                          {pv.record_version ?? 1})
                        </div>
                        <div className="font-medium text-[#080909]">
                          {pv.title}
                        </div>
                        <p className="dg-serif text-xs text-[#5b5e56]">
                          {pv.text}
                        </p>
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </details>
          );
        })}
      </div>
    </section>
  );
}
