"use client";

import React, { useState } from "react";
import type { ClauseNode } from "@/lib/data";
import { StatusBadge } from "./StatusBadge";

interface ClauseTreeProps {
  clauses: ClauseNode[];
}

export function ClauseTree({ clauses }: ClauseTreeProps) {
  const [query, setQuery] = useState("");

  const normalizedQuery = query.trim().toLowerCase();
  const filtered = clauses.filter((clause) => {
    if (!normalizedQuery) {
      return true;
    }
    return (
      clause.number.toLowerCase().includes(normalizedQuery) ||
      (clause.title?.toLowerCase().includes(normalizedQuery) ?? false) ||
      clause.text.toLowerCase().includes(normalizedQuery)
    );
  });

  return (
    <section aria-label="Clause tree browser" className="space-y-4">
      <div>
        <label
          htmlFor="clause-search"
          className="block text-sm font-medium text-slate-800"
        >
          Search clauses by number, title, or text
        </label>
        <input
          id="clause-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search clauses..."
          className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="space-y-3">
        {filtered.map((clause) => (
          <details
            key={clause.clause_id}
            open
            className="rounded border border-slate-200 bg-white p-3"
          >
            <summary className="flex cursor-pointer items-center justify-between font-medium text-slate-900">
              <span>
                <span className="font-mono">{clause.number}</span>{" "}
                {clause.title ?? ""}
              </span>
              <StatusBadge status={clause.legal_status ?? "in_force"} />
            </summary>
            <p className="mt-2 text-sm text-slate-700">{clause.text}</p>
            {clause.tables.map((table) => (
              <div key={table.table_id} className="mt-3 overflow-x-auto">
                {table.caption && (
                  <p className="mb-1 text-xs font-semibold text-slate-700">
                    {table.caption}
                  </p>
                )}
                <table className="min-w-full border-collapse border border-slate-300 text-xs">
                  <thead>
                    <tr className="bg-slate-100">
                      {table.headers.map((header, idx) => (
                        <th
                          key={idx}
                          className="border border-slate-300 px-2 py-1 text-left"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {table.rows.map((row, rIdx) => (
                      <tr key={rIdx}>
                        {row.map((cell, cIdx) => (
                          <td
                            key={cIdx}
                            className="border border-slate-300 px-2 py-1"
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </details>
        ))}
      </div>
    </section>
  );
}
