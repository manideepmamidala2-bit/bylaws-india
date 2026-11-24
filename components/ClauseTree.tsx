"use client";

import React, { useState } from "react";
import type {
  AmendmentEffect,
  AmendmentLink,
  AnnotationEntry,
  ClauseNode,
  ConsolidatedClauseRecord,
  DisplayLegalStatus,
  UnconsolidatedClauseRecord,
} from "@/lib/data";
import { partitionClauseVersions } from "@/lib/data";
import { StatusBadge } from "./StatusBadge";

interface ClauseTreeProps {
  jurisdictionId?: string;
  clauses: ClauseNode[];
  annotations?: AnnotationEntry[];
  amendmentEffects?: AmendmentEffect[];
  consolidatedRecords?: ConsolidatedClauseRecord[];
  unconsolidatedRecords?: UnconsolidatedClauseRecord[];
  amendmentLinks?: AmendmentLink[];
  allClausesLookup?: Record<string, ClauseNode>;
  allowConsolidatedToggle?: boolean;
}

const INITIAL_VISIBLE_COUNT = 40;
const MAX_INLINE_ANNOTATIONS = 12;

export function ClauseTree({
  jurisdictionId = "",
  clauses,
  annotations = [],
  amendmentEffects = [],
  consolidatedRecords = [],
  unconsolidatedRecords = [],
  amendmentLinks = [],
  allClausesLookup = {},
  allowConsolidatedToggle = false,
}: ClauseTreeProps) {
  const [query, setQuery] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [viewMode, setViewMode] = useState<"original" | "consolidated">(
    "original"
  );
  const availableDates = Array.from(
    new Set(
      amendmentEffects
        .filter((e) => e.applied && e.valid_from)
        .map((e) => String(e.valid_from))
    )
  ).sort();
  const [asOfDate, setAsOfDate] = useState<string>("latest");

  const { activeClauses, historyByClauseId } = partitionClauseVersions(clauses);
  const baseClauses = activeClauses.length > 0 ? activeClauses : clauses;

  const byEid = new Map<string, ClauseNode>();
  for (const node of baseClauses) {
    if (node.eid) {
      byEid.set(node.eid, node);
    }
  }

  const annotationsByEid = new Map<string, AnnotationEntry[]>();
  for (const ann of annotations) {
    const eid = ann.target.eid;
    const list = annotationsByEid.get(eid) ?? [];
    list.push(ann);
    annotationsByEid.set(eid, list);
  }

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

  const effectsByTargetEid = new Map<string, AmendmentEffect[]>();
  for (const eff of amendmentEffects) {
    const existing = effectsByTargetEid.get(eff.target_eid) ?? [];
    existing.push(eff);
    effectsByTargetEid.set(eff.target_eid, existing);
  }

  // Separate `table_row` nodes so they render inside their parent `table` node rather than as loose rows
  const displayClauses = baseClauses.filter((node) => {
    if (node.type === "table_row") {
      return false;
    }
    const firstVer = node.versions?.[0];
    if (viewMode === "original") {
      if (firstVer && firstVer.effect_id) {
        return false;
      }
    } else if (asOfDate !== "latest" && firstVer?.valid_from) {
      if (String(firstVer.valid_from) > asOfDate) {
        return false;
      }
    }
    return true;
  });

  const hasVersionedAmendments =
    allowConsolidatedToggle ||
    amendmentEffects.length > 0 ||
    baseClauses.some((c) => (c.versions?.length ?? 0) > 1);

  const normalizedQuery = query.trim().toLowerCase();
  const filtered = displayClauses.filter((clause) => {
    if (!normalizedQuery) {
      return true;
    }
    const cons = consolidatedByClauseId.get(clause.clause_id);
    const latestVer =
      clause.versions && clause.versions.length > 0
        ? clause.versions[clause.versions.length - 1]
        : null;
    return (
      clause.number.toLowerCase().includes(normalizedQuery) ||
      (clause.eid?.toLowerCase().includes(normalizedQuery) ?? false) ||
      (clause.title?.toLowerCase().includes(normalizedQuery) ?? false) ||
      clause.text.toLowerCase().includes(normalizedQuery) ||
      (latestVer?.content?.toLowerCase().includes(normalizedQuery) ?? false) ||
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
            Filter provisions by number, address, title, or text
          </label>
          <input
            id="clause-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter provisions..."
            className="mt-1.5 w-full border border-[#080909] bg-[#f5f3ed] px-3 py-2 text-sm text-[#080909]"
          />
        </div>

        {hasVersionedAmendments && (
          <div
            role="group"
            aria-label="Document text view mode"
            className="flex flex-wrap items-center gap-2"
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
            {viewMode === "consolidated" && availableDates.length > 0 && (
              <div className="flex items-center gap-1.5 pl-1">
                <label
                  htmlFor="consolidated-as-of-date"
                  className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#5b5e56]"
                >
                  As of:
                </label>
                <select
                  id="consolidated-as-of-date"
                  value={asOfDate}
                  onChange={(e) => setAsOfDate(e.target.value)}
                  className="border border-[#080909] bg-[#f5f3ed] px-2 py-1 font-mono text-xs text-[#080909]"
                >
                  <option value="latest">Today (Latest Consolidated)</option>
                  {availableDates.map((dt) => (
                    <option key={dt} value={dt}>
                      {dt} Amendment
                    </option>
                  ))}
                </select>
              </div>
            )}
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
              Derived by this project, not an official publication:
            </strong>{" "}
            <span className="dg-serif text-sm">
              Consolidated provisions are computed from node versions where
              amending effects have high confidence. Low-confidence effects are
              shown beside the target provision without modifying its text.
            </span>
          </div>
        </div>
      )}

      <div className="divide-y divide-[#c8ccc0] border border-[#080909] bg-[#f5f3ed]">
        {(showAll || normalizedQuery.length > 0
          ? filtered
          : filtered.slice(0, INITIAL_VISIBLE_COUNT)
        ).map((clause) => {
          const eid = clause.eid ?? clause.number;
          const nodeType = clause.type ?? "clause";
          const versions = clause.versions ?? [];
          const activeVer =
            viewMode === "consolidated" && versions.length > 0
              ? asOfDate === "latest"
                ? versions[versions.length - 1]
                : versions.find(
                    (v) =>
                      (!v.valid_from || String(v.valid_from) <= asOfDate) &&
                      (!v.valid_to || asOfDate < String(v.valid_to))
                  ) ?? versions[versions.length - 1]
              : versions[0];

          const consRecord =
            viewMode === "consolidated"
              ? consolidatedByClauseId.get(clause.clause_id)
              : undefined;
          const unconsRecord =
            viewMode === "consolidated"
              ? unconsolidatedByClauseId.get(clause.clause_id)
              : undefined;

          const status: DisplayLegalStatus =
            (viewMode === "consolidated" && activeVer?.legal_status
              ? activeVer.legal_status
              : clause.legal_status) ?? "status_unknown";

          const isAmendedVersion =
            viewMode === "consolidated" &&
            (Boolean(activeVer?.effect_id) || Boolean(consRecord));

          const displayTitle =
            (viewMode === "consolidated" && activeVer?.heading) ||
            (consRecord ? consRecord.title : clause.heading ?? clause.title);
          const displayIntro =
            viewMode === "consolidated" && activeVer
              ? activeVer.intro
              : clause.intro;
          const displayContent =
            viewMode === "consolidated" && activeVer?.content
              ? activeVer.content
              : consRecord
                ? consRecord.text
                : clause.content ?? (!displayIntro ? clause.text : null);
          const displayWrapUp =
            viewMode === "consolidated" && activeVer
              ? activeVer.wrap_up
              : clause.wrap_up;
          const displayTables = consRecord ? consRecord.tables : clause.tables;

          const nodeAnns = annotationsByEid.get(eid) ?? [];
          const provTypeAnn = nodeAnns.find((a) => a.kind === "provision_type");
          const linkAnns = nodeAnns.filter(
            (a) => a.kind === "cross_reference" || a.kind === "defined_term_use"
          );

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

          const targetAmendments =
            amendmentsByTarget.get(clause.clause_id) ?? [];
          const unappliedEffects = (effectsByTargetEid.get(eid) ?? []).filter(
            (e) => !e.applied
          );

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
          const indentClass =
            clause.level >= 3
              ? "pl-8 bg-[#f5f3ed]"
              : clause.level === 2
                ? "pl-5"
                : "";

          const specialTypeClass =
            nodeType === "proviso"
              ? "border-l-4 border-l-[#080909] bg-[#efeee8]/60"
              : nodeType === "explanation" || nodeType === "note"
                ? "border-l-2 border-l-[#5b5e56] bg-[#efeee8]/40"
                : "";

          return (
            <details
              key={clause.record_id ?? clause.clause_id}
              id={`node-${eid}`}
              open
              className={`p-4 ${indentClass} ${specialTypeClass}`}
            >
              <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2 font-medium text-[#080909]">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs">
                    {clause.native_number ?? clause.number}
                  </span>
                  {displayTitle && (
                    <span className="font-semibold">{displayTitle}</span>
                  )}
                  <span className="font-mono text-[10px] text-[#5b5e56]">
                    [{eid}]
                  </span>
                </span>
                <span className="flex flex-wrap items-center gap-2">
                  {nodeType === "definition" && clause.defines && (
                    <span className="border border-[#080909] bg-[#efeee8] px-1.5 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.12em] text-[#080909]">
                      Defines: {clause.defines}
                    </span>
                  )}
                  {(nodeType === "proviso" ||
                    nodeType === "explanation" ||
                    nodeType === "note") && (
                    <span className="border border-[#080909] bg-[#f5f3ed] px-1.5 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.12em] text-[#080909]">
                      {nodeType}
                    </span>
                  )}
                  {provTypeAnn && (
                    <span className="border border-[#c8ccc0] bg-[#efeee8] px-1.5 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.12em] text-[#5b5e56]">
                      {provTypeAnn.value}
                    </span>
                  )}
                  {isAmendedVersion && (
                    <span className="border border-[#080909] bg-[#efeee8] px-1.5 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.12em] text-[#080909]">
                      Derived · From{" "}
                      {activeVer?.valid_from ?? consRecord?.as_of_date}
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

              {displayIntro && (
                <p
                  lang={clause.language === "kn" ? "kn" : "en"}
                  className="dg-serif mt-2 whitespace-pre-line text-[15px] leading-[1.52] text-[#171917]"
                >
                  {displayIntro}
                </p>
              )}

              {displayContent && nodeType !== "table" && (
                <p
                  lang={clause.language === "kn" ? "kn" : "en"}
                  className="dg-serif mt-2 whitespace-pre-line text-[15px] leading-[1.52] text-[#171917]"
                >
                  {displayContent}
                </p>
              )}

              {displayWrapUp && (
                <p
                  lang={clause.language === "kn" ? "kn" : "en"}
                  className="dg-serif mt-2 border-t border-dotted border-[#c8ccc0] pt-1.5 text-[14.5px] leading-[1.5] text-[#171917]"
                >
                  {displayWrapUp}
                </p>
              )}

              {/* Layer 1 Structured Table Node */}
              {nodeType === "table" && clause.table_meta && (
                <div className="mt-3 overflow-x-auto">
                  {clause.table_meta.extraction === "failed" ? (
                    <div className="border border-dashed border-[#080909] bg-[#efeee8] p-3 font-mono text-xs text-[#080909]">
                      Table extraction gap:{" "}
                      {clause.table_meta.gap_reason ?? "Unable to extract table grid"}
                    </div>
                  ) : (
                    <>
                      <table className="dg-table">
                        <thead>
                          <tr>
                            {clause.table_meta.columns.map((col, cIdx) => (
                              <th key={cIdx}>
                                {col.label}
                                {col.unit ? ` (${col.unit})` : ""}
                              </th>
                            ))}
                          </tr>
                          {clause.table_meta.columns.some(
                            (col) => col.children && col.children.length > 0
                          ) && (
                            <tr>
                              {clause.table_meta.columns.map((col, cIdx) => (
                                  <th
                                    key={`sub-${cIdx}`}
                                    className="font-mono text-[10px] font-normal text-[#5b5e56]"
                                  >
                                    {col.children?.[0]?.label || col.label}
                                  </th>
                              ))}
                            </tr>
                          )}
                        </thead>
                        <tbody>
                          {clause.table_meta.rows.map((rowEid) => {
                            const rowNode = byEid.get(rowEid);
                            const cells = rowNode?.cells ?? [];
                            return (
                              <tr key={rowEid} id={`node-${rowEid}`}>
                                {cells.map((cell, cellIdx) => (
                                  <td key={cellIdx}>{cell}</td>
                                ))}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                      {clause.table_meta.footnotes.length > 0 && (
                        <ul className="mt-2 space-y-1 font-mono text-[11px] text-[#5b5e56]">
                          {clause.table_meta.footnotes.map((fn, fIdx) => (
                            <li key={fIdx}>
                              <strong>{fn.marker}</strong> {fn.text}
                            </li>
                          ))}
                        </ul>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Legacy/inline tables when present on non-table nodes */}
              {nodeType !== "table" &&
                clause.children?.every((chEid) => byEid.get(chEid)?.type !== "table") &&
                displayTables.map((table) => (
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
                            <th key={idx}>
                              {header.trim() ||
                                (idx === 0 ? "Sl. No." : `Column ${idx + 1}`)}
                            </th>
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

              {/* Layer 2 Stand-Off Annotation Links */}
              {linkAnns.length > 0 && (
                <div className="mt-2 flex flex-wrap items-center gap-2 font-mono text-[10.5px]">
                  <span className="uppercase tracking-[0.12em] text-[#5b5e56]">
                    Annotations ({linkAnns.length}):
                  </span>
                  {linkAnns.slice(0, MAX_INLINE_ANNOTATIONS).map((ann) => {
                    const isUnresolved = ann.value.startsWith("unresolved:");
                    const targetHref = isUnresolved
                      ? undefined
                      : `#node-${ann.value}`;
                    const labelPrefix =
                      ann.kind === "defined_term_use" ? "Term" : "Ref";
                    return targetHref ? (
                      <a
                        key={ann.annotation_id}
                        href={targetHref}
                        className="border border-[#080909] bg-[#efeee8] px-2 py-0.5 text-[#080909] underline"
                      >
                        {labelPrefix}: {ann.target.span_text} → {ann.value}
                      </a>
                    ) : (
                      <span
                        key={ann.annotation_id}
                        className="border border-dashed border-[#5b5e56] px-2 py-0.5 text-[#5b5e56]"
                      >
                        {labelPrefix}: {ann.target.span_text} (unresolved)
                      </span>
                    );
                  })}
                  {linkAnns.length > MAX_INLINE_ANNOTATIONS && (
                    <span className="text-[#5b5e56]">
                      +{linkAnns.length - MAX_INLINE_ANNOTATIONS} more
                    </span>
                  )}
                </div>
              )}

              {isAmendedVersion && (
                <div className="mt-2 border-l-2 border-[#080909] bg-[#efeee8] px-3 py-2 text-xs">
                  <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#080909]">
                    Changed by{" "}
                    {activeVer?.source_doc ? (
                      jurisdictionId ? (
                        <a
                          href={`/j/${jurisdictionId}/documents/${activeVer.source_doc}#node-${activeVer.source_eid ?? ""}`}
                          className="font-semibold underline"
                        >
                          {activeVer.source_doc}:{activeVer.source_eid}
                        </a>
                      ) : (
                        `${activeVer.source_doc}:${activeVer.source_eid}`
                      )
                    ) : (
                      consRecord?.amendments_applied.join(", ")
                    )}
                    , from {activeVer?.valid_from ?? consRecord?.as_of_date} ·{" "}
                    Derived by this project, not an official publication
                    {activeVer?.citations?.[0]?.page ? (
                      <>
                        {" · "}
                        <span>
                          Amending source p. {activeVer.citations[0].page}
                        </span>
                      </>
                    ) : null}
                  </div>
                  {versions.length > 1 && versions[0]?.content && (
                    <div className="mt-1 text-xs text-[#5b5e56]">
                      Original wording ({eid}): &ldquo;{versions[0].content}
                      &rdquo;
                    </div>
                  )}
                </div>
              )}

              {unconsRecord && (
                <div className="mt-2 border border-dashed border-[#080909] bg-[#efeee8] px-3 py-2 font-mono text-[10.5px] text-[#080909]">
                  Unconsolidated: {unconsRecord.reason}
                </div>
              )}

              {unappliedEffects.map((eff) => (
                <div
                  key={eff.effect_id}
                  className="mt-2 border border-dashed border-[#080909] bg-[#efeee8] px-3 py-2 font-mono text-[10.5px] text-[#080909]"
                >
                  Unapplied effect ({eff.effect_id}, {eff.action}):{" "}
                  {eff.unapplied_reason ?? "Low confidence"}
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
      {!showAll &&
        normalizedQuery.length === 0 &&
        filtered.length > INITIAL_VISIBLE_COUNT && (
          <div className="flex items-center justify-between border border-[#080909] bg-[#efeee8] px-4 py-3 font-mono text-xs">
            <span>
              Showing {INITIAL_VISIBLE_COUNT} of {filtered.length} structured
              provisions
            </span>
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className="border border-[#080909] bg-[#080909] px-3 py-1.5 uppercase tracking-[0.12em] text-[#f5f3ed]"
            >
              Show all {filtered.length} provisions
            </button>
          </div>
        )}
    </section>
  );
}
