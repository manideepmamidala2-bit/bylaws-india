import React from "react";
import Link from "next/link";
import type {
  AmendmentLink,
  ClauseNode,
  ClauseZoneTagEntry,
  DisplayLegalStatus,
} from "@/lib/data";
import { partitionClauseVersions } from "@/lib/data";
import { StatusBadge } from "./StatusBadge";

interface ClausePanelProps {
  selectedZoneCode: string | null;
  selectedZoneLabel?: string | null;
  clauses: ClauseNode[];
  showDrafts: boolean;
  amendmentLinks?: AmendmentLink[];
  clauseZoneTags?: ClauseZoneTagEntry[];
  jurisdictionId?: string;
}

export function ClausePanel({
  selectedZoneCode,
  selectedZoneLabel,
  clauses,
  showDrafts,
  amendmentLinks = [],
  clauseZoneTags = [],
  jurisdictionId,
}: ClausePanelProps) {
  const { activeClauses, historyByClauseId } = partitionClauseVersions(clauses);
  // If only historical records were passed (e.g. isolated unit test), fall back to showing them
  const baseList = activeClauses.length > 0 ? activeClauses : clauses;

  const clauseTextById = new Map<string, ClauseNode>();
  for (const c of baseList) {
    clauseTextById.set(c.clause_id, c);
  }

  const tagReasonMap = new Map<string, string>();
  for (const tag of clauseZoneTags) {
    if (
      selectedZoneCode &&
      (tag.zone_code === selectedZoneCode || tag.zone_code === "ALL")
    ) {
      tagReasonMap.set(tag.clause_id, tag.reason);
    }
  }

  const visibleClauses = baseList.filter((clause) => {
    if (clause.type === "table_row") {
      return false;
    }
    if (!showDrafts && clause.legal_status === "draft") {
      return false;
    }
    if (!selectedZoneCode) {
      return true;
    }
    return (
      clause.applies_to_zones.includes(selectedZoneCode) ||
      clause.applies_to_zones.includes("ALL") ||
      tagReasonMap.has(clause.clause_id)
    );
  });
  const previewClauses = visibleClauses.slice(0, 40);

  const uniqueDocCount = new Set(
    visibleClauses.map((c) => c.doc_id ?? c.clause_id.split(":")[0])
  ).size;

  const amendmentsByTarget = new Map<string, AmendmentLink[]>();
  for (const link of amendmentLinks) {
    const list = amendmentsByTarget.get(link.target_clause) ?? [];
    list.push(link);
    amendmentsByTarget.set(link.target_clause, list);
  }

  return (
    <aside
      aria-label="Applicable bylaw clauses"
      className="flex h-full flex-col border-l border-[#080909] bg-[#f5f3ed]"
    >
      <div className="border-b border-[#c8ccc0] px-6 py-4">
        <div className="dg-mono">
          {selectedZoneCode
            ? `Zone ${selectedZoneCode} · ${visibleClauses.length} clause(s) · ${uniqueDocCount} document(s)`
            : `All Zones · ${visibleClauses.length} clause(s) · ${uniqueDocCount} document(s)`}
        </div>
        <h2 className="mt-1.5 text-2xl font-semibold tracking-tight text-[#080909]">
          {selectedZoneCode
            ? selectedZoneLabel || `Zone ${selectedZoneCode}`
            : "All Applicable Provisions"}
        </h2>
        <p className="dg-serif mt-1 text-sm text-[#5b5e56]">
          {selectedZoneCode
            ? "Clauses tagged to this zone code and universal city-wide provisions, grouped by instrument."
            : "Select a zone polygon on the map to filter clauses by land-use zone or overlay."}
        </p>
      </div>

      <div className="flex-1 divide-y divide-[#c8ccc0] overflow-y-auto">
        {visibleClauses.length === 0 ? (
          <p className="px-6 py-6 text-sm text-[#5b5e56]">
            No matching clauses for the current selection.
          </p>
        ) : (
          previewClauses.map((clause, idx) => {
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
            const docId = clause.doc_id ?? clause.clause_id.split(":")[0];
            const prevDocId =
              idx > 0
                ? (previewClauses[idx - 1].doc_id ??
                  previewClauses[idx - 1].clause_id.split(":")[0])
                : null;
            const showGroupHeader = docId !== prevDocId;

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

            const targetAmendments =
              amendmentsByTarget.get(clause.clause_id) ?? [];
            const quotedReason = tagReasonMap.get(clause.clause_id);
            const sourceHref = clause.official_url || clause.source_url;

            return (
              <React.Fragment key={clause.record_id ?? clause.clause_id}>
                {showGroupHeader && (
                  <div className="flex items-center justify-between bg-[#efeee8] px-6 py-2 font-mono text-[10.5px] uppercase tracking-[0.14em] text-[#5b5e56]">
                    <span>
                      {clause.doc_layer ? `${clause.doc_layer} · ` : ""}
                      {docId}
                    </span>
                    {jurisdictionId && (
                      <Link
                        href={`/j/${jurisdictionId}/documents/${docId}`}
                        className="text-[#080909] underline underline-offset-2"
                      >
                        Open document
                      </Link>
                    )}
                  </div>
                )}
                <article
                  className={`px-6 py-4 ${idx === 0 && selectedZoneCode ? "dg-selected-row" : ""}`}
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="font-mono text-xs font-medium tracking-[0.06em] text-[#080909]">
                      {clause.number}
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      {clause.language === "kn" && (
                        <span className="border border-[#080909] px-1.5 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.12em] text-[#080909]">
                          KN · Verbatim
                        </span>
                      )}
                      <StatusBadge status={status} />
                    </div>
                  </div>

                  {clause.title && (
                    <h3 className="mt-1 text-base font-semibold tracking-tight text-[#080909]">
                      {clause.title}
                    </h3>
                  )}

                  <p
                    lang={clause.language === "kn" ? "kn" : "en"}
                    className="dg-serif mt-1.5 whitespace-pre-line text-[14px] leading-[1.48] text-[#171917]"
                  >
                    {clause.text}
                  </p>

                  {clause.tables && clause.tables.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {clause.tables.map((tbl) => (
                        <div key={tbl.table_id} className="overflow-x-auto">
                          {tbl.caption && (
                            <div className="mb-1 font-mono text-[10.5px] font-medium uppercase tracking-[0.08em] text-[#080909]">
                              {tbl.caption}
                            </div>
                          )}
                          <table className="dg-table">
                            <thead>
                              <tr>
                                {tbl.headers.map((h, hIdx) => (
                                  <th key={hIdx}>
                                    {h.trim() ||
                                      (hIdx === 0
                                        ? "Sl. No."
                                        : `Column ${hIdx + 1}`)}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {tbl.rows.map((r, rIdx) => (
                                <tr key={rIdx}>
                                  {r.map((cell, cIdx) => (
                                    <td key={cIdx}>{cell}</td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ))}
                    </div>
                  )}

                  {targetAmendments.map((lnk, lIdx) => {
                    const amendingNode = clauseTextById.get(lnk.amending_clause);
                    return (
                      <div
                        key={`${lnk.amending_clause}-${lIdx}`}
                        className="mt-2.5 border-l-2 border-[#080909] pl-3"
                      >
                        <div className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-[#5b5e56]">
                          {lnk.amending_clause} · {lnk.action.replace("_", " ")}
                          {lnk.effective_date ? ` · ${lnk.effective_date}` : ""}
                        </div>
                        {amendingNode && (
                          <p className="dg-serif mt-0.5 text-[13px] text-[#5b5e56]">
                            {amendingNode.text}
                          </p>
                        )}
                      </div>
                    );
                  })}

                  {quotedReason && (
                    <div className="mt-2 border-l border-[#c8ccc0] pl-2.5 font-mono text-[10px] text-[#5b5e56]">
                      Tag basis: &ldquo;{quotedReason}&rdquo;
                    </div>
                  )}

                  <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 font-mono text-[10.5px] uppercase tracking-[0.12em] text-[#5b5e56]">
                    <span>
                      {firstPage === null ? (
                        "No source page recorded"
                      ) : (
                        <>
                          p. {validPages.join(", ")} ·{" "}
                          {clause.verification.replace("_", " ")}
                          {hasVersionHistory ? ` · v${recordVersion}` : ""}
                        </>
                      )}
                    </span>
                    <div className="flex flex-wrap items-center gap-3">
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
                      {firstPage !== null &&
                        clause.archive_url &&
                        clause.archive_url.startsWith("http") && (
                          <a
                            href={`${clause.archive_url}#page=${firstPage}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#5b5e56] underline underline-offset-3 hover:text-[#080909]"
                          >
                            Archive p. {firstPage} ↗
                          </a>
                        )}
                    </div>
                  </div>

                  {hasVersionHistory && (
                    <details
                      data-testid={`record-version-history-${clause.clause_id}`}
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
                </article>
              </React.Fragment>
            );
          })
        )}
      </div>
    </aside>
  );
}
