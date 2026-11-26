import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  fetchDeclarations,
  fetchJurisdictionDataset,
  fetchManifest,
  fetchParameters,
  fetchResolution,
  getVisibleJurisdictions,
  type ClauseNode,
  type ParameterRecord,
} from "@/lib/data";
import { TopNav } from "@/components/TopNav";
import { CorporationSelector } from "@/components/CorporationSelector";
import {
  CODE_SUBJECTS,
  PARAMETER_PLAIN_LABELS,
  formatHumanDate,
  formatParameterConditionsPlain,
  formatParameterValuePlain,
  formatPlainDocumentTitle,
  formatPlainInstrumentStatus,
  getRelevantGapNoteForSubject,
  isPlausibleParameterRecord,
  resolveCodeSubject,
} from "@/lib/plain-language";

interface TopicDetailPageProps {
  params: Promise<{ id: string; topic: string }>;
}

export const dynamicParams = false;

export async function generateStaticParams() {
  const manifest = await fetchManifest();
  const paramsList: Array<{ id: string; topic: string }> = [];
  for (const j of manifest.jurisdictions) {
    const ds = await fetchJurisdictionDataset(j.id);
    const seenSlugs = new Set<string>();
    for (const s of CODE_SUBJECTS) {
      seenSlugs.add(s.slug);
      paramsList.push({ id: j.id, topic: s.slug });
    }
    for (const t of ds?.relations?.topics ?? []) {
      if (!seenSlugs.has(t.id)) {
        seenSlugs.add(t.id);
        paramsList.push({ id: j.id, topic: t.id });
      }
    }
  }
  return paramsList;
}

interface CleanSubjectParameterRow {
  key: string;
  ruleLabel: string;
  conditionsPlain: string;
  valuePlain: string;
  docId: string;
  docTitle: string;
  page: number;
  pageLink: string;
  rawRowHeader: string | null;
  rawCellText: string;
  tableLabel: string | null;
  parameterIds: string[];
}

function buildDeduplicatedSubjectParameterRows(
  records: ReadonlyArray<ParameterRecord>,
  docTitleById: ReadonlyMap<string, string>
): CleanSubjectParameterRow[] {
  const plausible = records.filter(isPlausibleParameterRecord);

  // First group identical setback values from the same table row (e.g. front, rear, and sides all 5 m)
  const setbackGroups = new Map<string, ParameterRecord[]>();
  const nonGrouped: ParameterRecord[] = [];

  for (const rec of plausible) {
    if (
      (rec.parameter === "setback_front_min_m" ||
        rec.parameter === "setback_rear_min_m" ||
        rec.parameter === "setback_side_min_m") &&
      rec.source.table_eid !== null &&
      rec.source.row_index !== null
    ) {
      const gKey = `${rec.source.doc_id}|${rec.source.table_eid}|${rec.source.row_index}|${String(rec.value)}|${String(rec.unit)}`;
      const list = setbackGroups.get(gKey) ?? [];
      list.push(rec);
      setbackGroups.set(gKey, list);
    } else {
      nonGrouped.push(rec);
    }
  }

  const candidateRows: CleanSubjectParameterRow[] = [];

  for (const [, group] of setbackGroups) {
    const first = group[0];
    const paramsInGroup = new Set(group.map((g) => g.parameter));
    let ruleLabel = PARAMETER_PLAIN_LABELS[first.parameter];
    if (
      paramsInGroup.has("setback_front_min_m") &&
      paramsInGroup.has("setback_rear_min_m") &&
      paramsInGroup.has("setback_side_min_m")
    ) {
      ruleLabel = "Setback on all sides (front, rear and sides)";
    } else if (
      paramsInGroup.has("setback_rear_min_m") &&
      paramsInGroup.has("setback_side_min_m") &&
      paramsInGroup.size === 2
    ) {
      ruleLabel = "Rear and side setbacks";
    }

    const conditionsPlain = formatParameterConditionsPlain(
      first.conditions,
      first
    );
    const valuePlain = formatParameterValuePlain(first);
    const docTitle =
      docTitleById.get(first.source.doc_id) ??
      formatPlainDocumentTitle(null, first.source.doc_id);

    candidateRows.push({
      key: `${ruleLabel}|${conditionsPlain}|${valuePlain}|${first.source.doc_id}|${first.source.page}`,
      ruleLabel,
      conditionsPlain,
      valuePlain,
      docId: first.source.doc_id,
      docTitle,
      page: first.source.page,
      pageLink: first.source.page_link,
      rawRowHeader: first.source.row_header ?? null,
      rawCellText: first.source.cell_text,
      tableLabel: first.source.table_id ?? null,
      parameterIds: group.map((g) => g.parameter_id),
    });
  }

  for (const rec of nonGrouped) {
    const ruleLabel = PARAMETER_PLAIN_LABELS[rec.parameter];
    const conditionsPlain = formatParameterConditionsPlain(
      rec.conditions,
      rec
    );
    const valuePlain = formatParameterValuePlain(rec);
    const docTitle =
      docTitleById.get(rec.source.doc_id) ??
      formatPlainDocumentTitle(null, rec.source.doc_id);

    candidateRows.push({
      key: `${ruleLabel}|${conditionsPlain}|${valuePlain}|${rec.source.doc_id}|${rec.source.page}`,
      ruleLabel,
      conditionsPlain,
      valuePlain,
      docId: rec.source.doc_id,
      docTitle,
      page: rec.source.page,
      pageLink: rec.source.page_link,
      rawRowHeader: rec.source.row_header ?? null,
      rawCellText: rec.source.cell_text,
      tableLabel: rec.source.table_id ?? null,
      parameterIds: [rec.parameter_id],
    });
  }

  const deduped: CleanSubjectParameterRow[] = [];
  const seenKeys = new Set<string>();
  for (const row of candidateRows) {
    if (seenKeys.has(row.key)) continue;
    seenKeys.add(row.key);
    deduped.push(row);
  }
  return deduped;
}

function isDefinitionOrBareHeading(
  node: ClauseNode,
  subjectTopicId: string
): boolean {
  const eid = node.eid.toLowerCase();
  if (eid.includes("toc") || eid.startsWith("pref_") || eid.startsWith("prea_")) {
    return true;
  }
  if (subjectTopicId !== "definitions") {
    if (
      eid.includes("__sec_2.0") ||
      eid.startsWith("chp_1__cl_1.2") ||
      (node.title && node.title.toLowerCase().includes("definition"))
    ) {
      return true;
    }
  }
  const wordCount = (node.text || "").trim().split(/\s+/).filter(Boolean).length;
  if (node.type !== "table" && wordCount < 5) {
    return true;
  }
  return false;
}

export default async function TopicDetailPage({
  params,
}: TopicDetailPageProps) {
  const { id, topic } = await params;
  const [dataset, manifest, parametersPayload, declarations, resolutionConfig] =
    await Promise.all([
      fetchJurisdictionDataset(id),
      fetchManifest(),
      fetchParameters(id).catch(() => null),
      fetchDeclarations(id).catch(() => null),
      fetchResolution(id).catch(() => null),
    ]);

  if (!dataset || !dataset.relations) {
    notFound();
  }

  const { jurisdiction, documents, clauses, annotationsByDocId, relations } =
    dataset;
  const subjectMeta = resolveCodeSubject(topic, relations.topics);
  if (!subjectMeta) {
    notFound();
  }

  const allVisible = getVisibleJurisdictions(manifest);
  const rootParentId =
    jurisdiction.parent ??
    (allVisible.some((j) => j.parent === jurisdiction.id)
      ? jurisdiction.id
      : null);
  const gbaCorporations = rootParentId
    ? allVisible.filter(
        (j) => j.id === rootParentId || j.parent === rootParentId
      )
    : [];

  const docMetaById = new Map(documents.map((d) => [d.doc_id, d]));
  const docTitleById = new Map(
    documents.map((d) => [d.doc_id, formatPlainDocumentTitle(d)])
  );

  // Collect all provisions tagged with `subjectMeta.topicId`
  const taggedNodeKeys = new Set<string>();
  for (const [docId, anns] of Object.entries(annotationsByDocId)) {
    for (const ann of anns) {
      if (ann.kind === "topic" && ann.value === subjectMeta.topicId) {
        if (
          !ann.target.eid.startsWith("pref_") &&
          !ann.target.eid.startsWith("prea_") &&
          !ann.target.eid.startsWith("sig_")
        ) {
          taggedNodeKeys.add(`${docId}:${ann.target.eid}`);
        }
      }
    }
  }

  const taggedClauses: ClauseNode[] = clauses.filter(
    (c) =>
      !c.superseded_by &&
      !c.record_superseded_by &&
      c.type !== "preface" &&
      c.type !== "preamble" &&
      c.type !== "signature_block" &&
      c.type !== "table_row" &&
      taggedNodeKeys.has(`${c.doc_id}:${c.eid}`)
  );

  const whatAppliesToday: ClauseNode[] = [];
  const olderOrReplacedRules: ClauseNode[] = [];
  const relatedProvisions: ClauseNode[] = [];

  for (const node of taggedClauses) {
    const dMeta = docMetaById.get(node.doc_id ?? "");
    const isDraftOrSuperseded =
      node.legal_status === "draft" ||
      node.legal_status === "superseded" ||
      dMeta?.legal_status === "draft" ||
      dMeta?.legal_status === "superseded" ||
      Boolean(dMeta?.superseded_by_document);

    if (isDraftOrSuperseded) {
      olderOrReplacedRules.push(node);
      continue;
    }

    if (
      subjectMeta.zoningGoverned &&
      dMeta?.layer === "municipal" &&
      dMeta?.role === "base"
    ) {
      olderOrReplacedRules.push(node);
      continue;
    }

    if (isDefinitionOrBareHeading(node, subjectMeta.topicId)) {
      relatedProvisions.push(node);
      continue;
    }

    if (
      (subjectMeta.zoningGoverned && dMeta?.layer === "planning") ||
      (!subjectMeta.zoningGoverned &&
        (dMeta?.layer === "municipal" ||
          dMeta?.layer === "statute" ||
          dMeta?.layer === "orders"))
    ) {
      if (whatAppliesToday.length < 12) {
        whatAppliesToday.push(node);
      } else {
        relatedProvisions.push(node);
      }
    } else {
      relatedProvisions.push(node);
    }
  }

  if (whatAppliesToday.length === 0 && relatedProvisions.length > 0) {
    whatAppliesToday.push(...relatedProvisions.splice(0, 8));
  }

  // Sort older/replaced provisions newest first
  olderOrReplacedRules.sort((a, b) => {
    const dA =
      docMetaById.get(a.doc_id ?? "")?.effective_from ||
      docMetaById.get(a.doc_id ?? "")?.notified_date ||
      "0000-00-00";
    const dB =
      docMetaById.get(b.doc_id ?? "")?.effective_from ||
      docMetaById.get(b.doc_id ?? "")?.notified_date ||
      "0000-00-00";
    return dB.localeCompare(dA);
  });

  // Governing parameter table rows for this subject
  const paramKinds = subjectMeta.parameterKinds;
  const governingParamRecords = (parametersPayload?.records ?? []).filter(
    (r) =>
      paramKinds.includes(r.parameter) &&
      r.legal_status === "in_force" &&
      !r.valid_to &&
      (!subjectMeta.zoningGoverned ||
        docMetaById.get(r.source.doc_id)?.layer === "planning")
  );
  const cleanParameterRows = buildDeduplicatedSubjectParameterRows(
    governingParamRecords,
    docTitleById
  );

  // Older/superseded parameter rows for this subject
  const olderParamRecords = (parametersPayload?.records ?? []).filter(
    (r) =>
      paramKinds.includes(r.parameter) &&
      (r.legal_status !== "in_force" ||
        Boolean(r.valid_to) ||
        (subjectMeta.zoningGoverned &&
          docMetaById.get(r.source.doc_id)?.layer === "municipal"))
  );
  const olderParameterRows = buildDeduplicatedSubjectParameterRows(
    olderParamRecords,
    docTitleById
  );

  // Statutory authority quotes for "Why this rule applies"
  const byelaw14Step = (resolutionConfig?.steps ?? []).find(
    (s) => s.step_id === "zoning_governs_via_byelaw_1_4"
  );
  const lexPosteriorStep = (resolutionConfig?.steps ?? []).find(
    (s) => s.step_id === "lex_posterior_within_family"
  );
  const corpScopeStep = (resolutionConfig?.steps ?? []).find(
    (s) => s.step_id === "corporation_scope"
  );

  const relevantGapNote = getRelevantGapNoteForSubject(
    subjectMeta.slug,
    declarations
  );

  function renderProvisionRow(node: ClauseNode, olderReason?: string) {
    const docId = node.doc_id ?? "";
    const dMeta = docMetaById.get(docId);
    const plainDocTitle =
      docTitleById.get(docId) ?? formatPlainDocumentTitle(dMeta, docId);
    const effDate = dMeta?.effective_from || dMeta?.notified_date;
    const cit = node.citations?.[0];
    const page = cit?.page ?? 1;
    const pdfUrl = dMeta?.official_url || dMeta?.source_url || node.source_url;
    const archiveUrl = dMeta?.retrieval?.archive_url || node.archive_url;

    return (
      <li
        key={`${docId}:${node.eid}`}
        className="border-b border-[#c8ccc0] py-5 last:border-b-0"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div className="flex flex-wrap items-baseline gap-2">
            <Link
              href={`/j/${jurisdiction.id}/documents/${docId}#node-${node.eid}`}
              className="font-mono text-sm font-semibold text-[#080909] underline decoration-[#080909] underline-offset-4"
            >
              {node.number || "Provision"}
              {node.title ? ` · ${node.title}` : ""}
            </Link>
            <span className="font-mono text-xs text-[#5b5e56]">
              {plainDocTitle}
            </span>
          </div>

          <div className="flex items-center gap-3 font-mono text-xs text-[#5b5e56]">
            {effDate && <span>{formatHumanDate(effDate)}</span>}
            {pdfUrl && (
              <a
                href={`${pdfUrl}#page=${page}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#080909] underline"
              >
                p. {page}
              </a>
            )}
          </div>
        </div>

        {olderReason && (
          <div className="mt-1.5 font-mono text-xs text-[#5b5e56]">
            {olderReason}
          </div>
        )}

        <p className="dg-serif mt-2 whitespace-pre-line text-base leading-relaxed text-[#171917]">
          {node.text}
        </p>

        {node.notes_by_site && node.notes_by_site.length > 0 && (
          <div className="mt-3 border-l-2 border-[#c8ccc0] bg-[#efeee8] px-3 py-2 text-xs text-[#171917]">
            <span className="dg-mono mr-2 text-[#5b5e56]">
              In short, by this site:
            </span>
            {node.notes_by_site.join(" ")}
          </div>
        )}

        <details className="mt-2">
          <summary className="inline-flex min-h-[44px] cursor-pointer items-center font-mono text-[11px] uppercase tracking-[0.12em] text-[#5b5e56] hover:text-[#080909]">
            Details
          </summary>
          <div className="mt-1 space-y-1 border border-[#c8ccc0] bg-[#efeee8] p-3 font-mono text-xs text-[#5b5e56]">
            <div>
              Document: <span className="text-[#080909]">{plainDocTitle}</span>{" "}
              ({dMeta ? formatPlainInstrumentStatus(dMeta) : "In force"})
            </div>
            <div>
              Page: <span className="text-[#080909]">p. {page}</span>
              {archiveUrl && (
                <>
                  {" · "}
                  <a
                    href={`${archiveUrl}#page=${page}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#080909] underline"
                  >
                    Archived PDF (p. {page}) ↗
                  </a>
                </>
              )}
            </div>
            <div>
              Technical address:{" "}
              <code className="text-[#080909]">
                {docId}:{node.eid}
              </code>
            </div>
          </div>
        </details>
      </li>
    );
  }

  return (
    <div className="bg-[#f5f3ed] text-[#080909]">
      <TopNav
        jurisdictionId={jurisdiction.id}
        jurisdictionName={jurisdiction.name}
        active="topics"
      />

      <main className="mx-auto max-w-5xl space-y-12 px-5 py-10">
        {/* 1. Heading and one plain sentence */}
        <header className="border-b border-[#c8ccc0] pb-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Link
              href={`/j/${jurisdiction.id}/topics`}
              className="inline-flex min-h-[44px] items-center font-mono text-xs uppercase tracking-[0.12em] text-[#5b5e56] no-underline hover:text-[#080909]"
            >
              ← The code, by subject
            </Link>
            {subjectMeta.hasMapLink && (
              <Link
                href={`/j/${jurisdiction.id}`}
                className="inline-flex min-h-[44px] items-center font-mono text-xs uppercase tracking-[0.12em] text-[#080909] underline decoration-[#080909] underline-offset-4"
              >
                Open land-use map →
              </Link>
            )}
          </div>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#080909] md:text-4xl">
            {subjectMeta.title}
          </h1>
          <p className="dg-serif mt-2 text-base leading-relaxed text-[#171917]">
            {subjectMeta.summary}
          </p>

          <CorporationSelector
            currentId={jurisdiction.id}
            currentName={jurisdiction.name}
            pathSuffix={`/topics/${subjectMeta.slug}`}
            corporations={gbaCorporations}
          />
        </header>

        {/* 2. What applies today */}
        <section
          aria-labelledby="what-applies-today-heading"
          data-testid="what-applies-today-section"
          className="space-y-8"
        >
          <div>
            <div className="dg-mono text-[#5b5e56]">01 / Governing rules</div>
            <h2
              id="what-applies-today-heading"
              className="mt-1 text-2xl font-semibold tracking-tight text-[#080909]"
            >
              What applies today
            </h2>
          </div>

          {cleanParameterRows.length > 0 && (
            <div className="space-y-3">
              <div className="dg-mono text-[#5b5e56]">
                Derived by this site · Governing table values (
                {cleanParameterRows.length} distinct rules)
              </div>
              <div className="overflow-x-auto">
                <table
                  data-testid="subject-parameter-table"
                  className="dg-table"
                >
                  <thead>
                    <tr>
                      <th>Rule</th>
                      <th>Conditions</th>
                      <th>Value</th>
                      <th>Source &amp; page</th>
                      <th>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cleanParameterRows.map((row) => (
                      <tr key={row.key}>
                        <td className="font-medium text-[#080909]">
                          {row.ruleLabel}
                        </td>
                        <td className="text-[#171917]">{row.conditionsPlain}</td>
                        <td className="font-mono text-xs font-semibold text-[#080909]">
                          {row.valuePlain}
                        </td>
                        <td className="font-mono text-xs">
                          <span className="text-[#5b5e56]">{row.docTitle}</span>
                          {" · "}
                          <a
                            href={row.pageLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-[#080909] underline"
                          >
                            p. {row.page}
                          </a>
                        </td>
                        <td>
                          <details>
                            <summary className="cursor-pointer font-mono text-[11px] uppercase tracking-[0.12em] text-[#5b5e56] hover:text-[#080909]">
                              Details
                            </summary>
                            <div className="mt-1 space-y-1 border border-[#c8ccc0] bg-[#efeee8] p-2 font-mono text-[11px] text-[#5b5e56]">
                              {row.tableLabel && (
                                <div>
                                  Table:{" "}
                                  <span className="text-[#080909]">
                                    {row.tableLabel}
                                  </span>
                                </div>
                              )}
                              {row.rawRowHeader && (
                                <div>
                                  Printed row header:{" "}
                                  <code className="text-[#080909]">
                                    {row.rawRowHeader}
                                  </code>
                                </div>
                              )}
                              <div>
                                Printed cell:{" "}
                                <code className="text-[#080909]">
                                  {row.rawCellText}
                                </code>
                              </div>
                              <div>
                                Record ID:{" "}
                                <code className="text-[#080909]">
                                  {row.parameterIds.join(", ")}
                                </code>
                              </div>
                            </div>
                          </details>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {whatAppliesToday.length > 0 && (
            <div className="space-y-2">
              <div className="dg-mono text-[#5b5e56]">
                From the official text · Governing provisions in force (
                {whatAppliesToday.length})
              </div>
              <ul className="border-t border-[#c8ccc0]">
                {whatAppliesToday.map((node) => renderProvisionRow(node))}
              </ul>
            </div>
          )}
        </section>

        {/* 3. Why this rule applies */}
        <section
          aria-labelledby="why-this-rule-applies-heading"
          className="border-t border-[#c8ccc0] pt-8"
        >
          <div className="dg-mono text-[#5b5e56]">02 / Precedence</div>
          <h2
            id="why-this-rule-applies-heading"
            className="mt-1 text-xl font-semibold tracking-tight text-[#080909]"
          >
            Why this rule applies
          </h2>
          <p className="dg-serif mt-2 text-base text-[#080909]">
            <span className="dg-mono mr-2 text-[#5b5e56]">
              In short, by this site:
            </span>
            {subjectMeta.whyAppliesLine}
          </p>

          <details
            data-testid="why-this-rule-applies"
            className="mt-3 border border-[#c8ccc0] bg-[#efeee8] p-4"
          >
            <summary className="flex min-h-[44px] cursor-pointer items-center font-mono text-xs uppercase tracking-[0.12em] text-[#080909]">
              Read quoted statutory authority
            </summary>
            <div className="mt-3 space-y-4 border-t border-[#c8ccc0] pt-3 text-sm">
              {byelaw14Step && (
                <div>
                  <div className="font-mono text-xs font-semibold text-[#080909]">
                    {byelaw14Step.title} —{" "}
                    {byelaw14Step.authority.provision_label} (p.{" "}
                    {byelaw14Step.authority.page})
                  </div>
                  <blockquote className="dg-serif mt-1 border-l-2 border-[#080909] pl-3 italic text-[#171917]">
                    &ldquo;{byelaw14Step.authority.verbatim_quote}&rdquo;
                  </blockquote>
                </div>
              )}
              {lexPosteriorStep && (
                <div>
                  <div className="font-mono text-xs font-semibold text-[#080909]">
                    {lexPosteriorStep.title} —{" "}
                    {lexPosteriorStep.authority.provision_label} (p.{" "}
                    {lexPosteriorStep.authority.page})
                  </div>
                  <blockquote className="dg-serif mt-1 border-l-2 border-[#080909] pl-3 italic text-[#171917]">
                    &ldquo;{lexPosteriorStep.authority.verbatim_quote}&rdquo;
                  </blockquote>
                </div>
              )}
              {corpScopeStep && (
                <div>
                  <div className="font-mono text-xs font-semibold text-[#080909]">
                    {corpScopeStep.title} —{" "}
                    {corpScopeStep.authority.provision_label} (p.{" "}
                    {corpScopeStep.authority.page})
                  </div>
                  <blockquote className="dg-serif mt-1 border-l-2 border-[#080909] pl-3 italic text-[#171917]">
                    &ldquo;{corpScopeStep.authority.verbatim_quote}&rdquo;
                  </blockquote>
                </div>
              )}
            </div>
          </details>
        </section>

        {/* 4. Older or replaced rules (collapsed, newest first) */}
        {(olderOrReplacedRules.length > 0 || olderParameterRows.length > 0) && (
          <section
            aria-label="Older or replaced rules"
            className="border-t border-[#c8ccc0] pt-6"
          >
            <details data-testid="older-or-replaced-rules">
              <summary className="flex min-h-[44px] cursor-pointer items-center justify-between font-mono text-xs uppercase tracking-[0.12em] text-[#5b5e56] hover:text-[#080909]">
                <span>
                  Older or replaced rules (
                  {olderOrReplacedRules.length + olderParameterRows.length}) —
                  newest first
                </span>
              </summary>
              <div className="mt-4 space-y-6">
                {olderParameterRows.length > 0 && (
                  <div className="overflow-x-auto">
                    <div className="dg-mono mb-2 text-[#5b5e56]">
                      Superseded or replaced table rows (
                      {olderParameterRows.length})
                    </div>
                    <table className="dg-table">
                      <thead>
                        <tr>
                          <th>Rule</th>
                          <th>Conditions</th>
                          <th>Value</th>
                          <th>Source &amp; page</th>
                        </tr>
                      </thead>
                      <tbody>
                        {olderParameterRows.map((row) => (
                          <tr key={`older-${row.key}`}>
                            <td>{row.ruleLabel}</td>
                            <td>{row.conditionsPlain}</td>
                            <td className="font-mono text-xs">
                              {row.valuePlain}
                            </td>
                            <td className="font-mono text-xs">
                              {row.docTitle} ·{" "}
                              <a
                                href={row.pageLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline"
                              >
                                p. {row.page}
                              </a>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {olderOrReplacedRules.length > 0 && (
                  <ul className="border-t border-[#c8ccc0]">
                    {olderOrReplacedRules.map((node) => {
                      const dMeta = docMetaById.get(node.doc_id ?? "");
                      const whyOlder =
                        dMeta?.legal_status === "draft"
                          ? "Draft, not in force."
                          : dMeta?.layer === "municipal" &&
                              subjectMeta.zoningGoverned
                            ? "Replaced for this subject by the Master Plan Zoning Regulations under Bye-law 1.4."
                            : "Replaced by a later amendment.";
                      return renderProvisionRow(node, whyOlder);
                    })}
                  </ul>
                )}
              </div>
            </details>
          </section>
        )}

        {/* 5. Related provisions (collapsed) */}
        {relatedProvisions.length > 0 && (
          <section
            aria-label="Related provisions"
            className="border-t border-[#c8ccc0] pt-6"
          >
            <details data-testid="related-provisions">
              <summary className="flex min-h-[44px] cursor-pointer items-center justify-between font-mono text-xs uppercase tracking-[0.12em] text-[#5b5e56] hover:text-[#080909]">
                <span>Related provisions ({relatedProvisions.length})</span>
              </summary>
              <div className="mt-4">
                <ul className="border-t border-[#c8ccc0]">
                  {relatedProvisions.map((node) => renderProvisionRow(node))}
                </ul>
              </div>
            </details>
          </section>
        )}

        {/* 6. Gap note (only if a known gap can change this subject) */}
        {relevantGapNote && (
          <section
            aria-label="Known gap affecting this subject"
            data-testid="subject-gap-note"
            className="border-t border-[#c8ccc0] pt-6"
          >
            <div className="border-l-2 border-[#080909] bg-[#efeee8] p-4">
              <div className="dg-mono text-[#5b5e56]">
                Known gap on this subject
              </div>
              <p className="dg-serif mt-1 text-sm leading-relaxed text-[#171917]">
                {relevantGapNote}
              </p>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
