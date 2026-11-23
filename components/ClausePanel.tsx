import React from "react";
import type { ClauseNode } from "@/lib/data";
import { StatusBadge } from "./StatusBadge";

interface ClausePanelProps {
  selectedZoneCode: string | null;
  clauses: ClauseNode[];
  showDrafts: boolean;
}

export function ClausePanel({
  selectedZoneCode,
  clauses,
  showDrafts,
}: ClausePanelProps) {
  const visibleClauses = clauses.filter((clause) => {
    if (!showDrafts && clause.legal_status === "draft") {
      return false;
    }
    if (!selectedZoneCode) {
      return true;
    }
    return clause.applies_to_zones.includes(selectedZoneCode);
  });

  return (
    <aside
      aria-label="Applicable bylaw clauses"
      className="flex h-full flex-col rounded-lg border border-slate-300 bg-white p-4"
    >
      <div className="border-b border-slate-200 pb-3">
        <h2 className="text-base font-semibold text-slate-900">
          {selectedZoneCode
            ? `Clauses for Zone ${selectedZoneCode}`
            : "All Applicable Clauses"}
        </h2>
        <p className="text-xs text-slate-600">
          {visibleClauses.length} clause(s) displayed
        </p>
      </div>

      <div className="mt-3 space-y-4 overflow-y-auto">
        {visibleClauses.length === 0 ? (
          <p className="text-sm text-slate-500">
            No matching clauses for the current selection.
          </p>
        ) : (
          visibleClauses.map((clause) => {
            const firstPage = clause.pages[0] ?? 1;
            const status = clause.legal_status ?? "in_force";
            return (
              <article
                key={clause.clause_id}
                className="rounded border border-slate-200 p-3 text-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono font-semibold text-slate-900">
                    Clause {clause.number}
                    {clause.title ? ` — ${clause.title}` : ""}
                  </span>
                  <StatusBadge status={status} />
                </div>
                <p className="mt-2 whitespace-pre-line text-slate-800">
                  {clause.text}
                </p>
                <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                  <span>Pages: {clause.pages.join(", ")}</span>
                  {clause.source_url && (
                    <a
                      href={`${clause.source_url}#page=${firstPage}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-blue-700 underline"
                    >
                      View source (p. {firstPage})
                    </a>
                  )}
                </div>
              </article>
            );
          })
        )}
      </div>
    </aside>
  );
}
