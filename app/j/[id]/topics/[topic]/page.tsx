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
  type DocumentMetadata,
  type ParameterRecord,
} from "@/lib/data";
import { TopNav } from "@/components/TopNav";
import {
  CorporationSelector,
  formatPlainCorporationName,
} from "@/components/CorporationSelector";
import {
  CODE_SUBJECTS,
  PARAMETER_PLAIN_LABELS,
  computeSubjectBandContinuityNotices,
  formatHumanDate,
  formatLandUseZoneGapPlainLine,
  formatMonthYearPlain,
  formatParameterConditionsPlain,
  formatParameterValuePlain,
  formatPlainDocumentTitle,
  formatPlainInstrumentStatus,
  formatReplacedByPlain,
  getRelevantGapNoteForSubject,
  isPlausibleParameterRecord,
  resolveCodeSubject,
  truncateAtWordBoundary,
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
      const resolved = resolveCodeSubject(t.id, ds?.relations?.topics);
      const canonicalSlug = resolved?.slug ?? t.id;
      if (!seenSlugs.has(canonicalSlug)) {
        seenSlugs.add(canonicalSlug);
        paramsList.push({ id: j.id, topic: canonicalSlug });
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
  validFrom: string;
  validTo: string | null;
  legalStatus: ParameterRecord["legal_status"];
  page: number;
  pageLink: string;
  rawRowHeader: string | null;
  rawCellText: string;
  tableLabel: string | null;
  note: string | null;
  statusLabel: string | null;
  isCorporationSpecific: boolean;
  parameterIds: string[];
}

function buildDeduplicatedSubjectParameterRows(
  records: ReadonlyArray<ParameterRecord>,
  docTitleById: ReadonlyMap<string, string>,
  docMetaById: ReadonlyMap<string, DocumentMetadata>,
  zoningGoverned: boolean
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

  function computeOlderStatusLabel(rec: ParameterRecord): string | null {
    const dMeta = docMetaById.get(rec.source.doc_id);
    if (zoningGoverned && dMeta?.layer === "municipal") {
      return "Master plan rules apply instead (bye-law 1.4)";
    }
    if (rec.note && rec.note.startsWith("Replaced by")) {
      return rec.note;
    }
    if (rec.legal_status === "superseded" || rec.valid_to) {
      return rec.valid_to
        ? `Replaced by a later amendment, ${formatHumanDate(rec.valid_to)}`
        : "Replaced by a later amendment";
    }
    return null;
  }

  function isRecordCorporationSpecific(rec: ParameterRecord): boolean {
    if ((rec.conditions.jurisdiction?.length ?? 0) > 0) {
      return true;
    }
    return rec.source.doc_id.includes("-bbl-amend-2026");
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
      key: `${ruleLabel}|${conditionsPlain}|${valuePlain}|${first.source.doc_id}`,
      ruleLabel,
      conditionsPlain,
      valuePlain,
      docId: first.source.doc_id,
      docTitle,
      validFrom: first.valid_from ?? "0000-00-00",
      validTo: first.valid_to ?? null,
      legalStatus: first.legal_status,
      page: first.source.page,
      pageLink: first.source.page_link,
      rawRowHeader: first.source.row_header ?? null,
      rawCellText: first.source.cell_text,
      tableLabel: first.source.table_id ?? null,
      note: first.note ?? null,
      statusLabel: computeOlderStatusLabel(first),
      isCorporationSpecific: isRecordCorporationSpecific(first),
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
      key: `${ruleLabel}|${conditionsPlain}|${valuePlain}|${rec.source.doc_id}`,
      ruleLabel,
      conditionsPlain,
      valuePlain,
      docId: rec.source.doc_id,
      docTitle,
      validFrom: rec.valid_from ?? "0000-00-00",
      validTo: rec.valid_to ?? null,
      legalStatus: rec.legal_status,
      page: rec.source.page,
      pageLink: rec.source.page_link,
      rawRowHeader: rec.source.row_header ?? null,
      rawCellText: rec.source.cell_text,
      tableLabel: rec.source.table_id ?? null,
      note: rec.note ?? null,
      statusLabel: computeOlderStatusLabel(rec),
      isCorporationSpecific: isRecordCorporationSpecific(rec),
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

function isByeLaw14Node(
  node: ClauseNode,
  docMetaById: ReadonlyMap<string, DocumentMetadata>
): boolean {
  const eid = (node.eid ?? "").toLowerCase();
  const num = (node.number ?? "").trim();
  const dMeta = docMetaById.get(node.doc_id ?? "");
  return (
    dMeta?.layer === "municipal" &&
    dMeta?.role === "base" &&
    (eid === "part_i__sec_1.0__cl_1.4" || eid.endsWith("__cl_1.4") || num === "1.4")
  );
}

function isDefinitionNode(node: ClauseNode): boolean {
  const eid = (node.eid ?? "").toLowerCase();
  return (
    node.type === "definition" ||
    eid.includes("sec_definitions") ||
    eid.includes("__def_") ||
    eid.includes("__sec_2.0") ||
    eid.startsWith("chp_1__cl_1.2") ||
    Boolean(node.title && node.title.toLowerCase().includes("definition"))
  );
}

function isExcludedNonContentOrBareHeading(node: ClauseNode): boolean {
  const eid = (node.eid ?? "").toLowerCase();
  if (
    eid.includes("toc") ||
    eid.startsWith("pref_") ||
    eid.startsWith("prea_") ||
    eid.startsWith("sig_") ||
    node.type === "preface" ||
    node.type === "preamble" ||
    node.type === "signature_block" ||
    node.type === "table_row"
  ) {
    return true;
  }
  const vers = node.versions ?? [];
  const activeContent =
    vers.length > 1 && vers[vers.length - 1].content
      ? vers[vers.length - 1].content ?? ""
      : node.text ?? "";
  const wordCount = activeContent.trim().split(/\s+/).filter(Boolean).length;
  if (node.type !== "table" && wordCount < 5) {
    return true;
  }
  return false;
}

function isNodeOmittedByAmendment(node: ClauseNode): boolean {
  if (node.omitted) return true;
  const vers = node.versions ?? [];
  if (vers.length > 0 && vers[vers.length - 1].omitted) {
    return true;
  }
  return false;
}

function isNodeCorporationSpecific(node: ClauseNode): boolean {
  const docId = node.doc_id ?? "";
  if (docId.includes("-bbl-amend-2026")) {
    return true;
  }
  const vers = node.versions ?? [];
  if (vers.length > 1) {
    const lastSrc = vers[vers.length - 1].source_doc ?? "";
    if (lastSrc.includes("-bbl-amend-2026")) {
      return true;
    }
  }
  if (node.change_mark?.amending_doc?.includes("-bbl-amend-2026")) {
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

  const {
    jurisdiction,
    documents,
    clauses,
    annotationsByDocId,
    amendments,
    relations,
  } = dataset;
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
  const parentSummary = rootParentId
    ? allVisible.find((j) => j.id === rootParentId)
    : null;
  const parentPlainName = parentSummary
    ? formatPlainCorporationName(parentSummary.id, parentSummary.name)
    : formatPlainCorporationName(jurisdiction.id, jurisdiction.name);
  const isChildCorporation = Boolean(jurisdiction.parent);
  const plainCorporationName = formatPlainCorporationName(
    jurisdiction.id,
    jurisdiction.name
  );
  const gbaCorporations = rootParentId
    ? allVisible
        .filter((j) => j.id === rootParentId || j.parent === rootParentId)
        .map((j) => ({ id: j.id, name: j.name }))
    : [];
  const partialZoneCorp = allVisible.find(
    (j) =>
      j.parent === rootParentId &&
      j.releases.some(
        (rel) =>
          Boolean(rel.files?.planning_districts) && Boolean(rel.files?.zones)
      )
  );
  const landUseZoneGapLine = formatLandUseZoneGapPlainLine(
    partialZoneCorp?.name ?? null
  );

  const docMetaById = new Map(documents.map((d) => [d.doc_id, d]));
  const docTitleById = new Map(
    documents.map((d) => [d.doc_id, formatPlainDocumentTitle(d)])
  );

  // Map applied amending clauses (`amending_doc:amending_eid`) -> target base provisions (`target_doc:target_eid`)
  // so standalone amending instructions do not duplicate the consolidated base provision.
  const appliedTargetByAmendingKey = new Map<string, string>();
  for (const eff of amendments.effects ?? []) {
    if (eff.applied && eff.action !== "insert_after" && eff.action !== "insert_before") {
      appliedTargetByAmendingKey.set(
        `${eff.amending_doc}:${eff.amending_eid}`,
        `${eff.target_doc}:${eff.target_eid}`
      );
    }
  }

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
          const rawKey = `${docId}:${ann.target.eid}`;
          const mappedTarget = appliedTargetByAmendingKey.get(rawKey);
          taggedNodeKeys.add(mappedTarget ?? rawKey);
        }
      }
    }
  }

  const rawTaggedClauses: ClauseNode[] = clauses.filter(
    (c) =>
      !c.superseded_by &&
      !c.record_superseded_by &&
      taggedNodeKeys.has(`${c.doc_id}:${c.eid}`) &&
      !appliedTargetByAmendingKey.has(`${c.doc_id}:${c.eid}`)
  );

  // Prioritize primary subject chapters (e.g. Chapter 3 Setbacks `chp_3__cl_3.1*` on Setbacks)
  const taggedClauses = [...rawTaggedClauses].sort((a, b) => {
    const eidA = a.eid ?? "";
    const eidB = b.eid ?? "";
    if (subjectMeta.topicId === "setbacks") {
      const aPrimary = eidA.startsWith("chp_3__cl_3.1") ? 0 : 1;
      const bPrimary = eidB.startsWith("chp_3__cl_3.1") ? 0 : 1;
      if (aPrimary !== bPrimary) return aPrimary - bPrimary;
    }
    if (isChildCorporation) {
      const aCorp = isNodeCorporationSpecific(a) ? 0 : 1;
      const bCorp = isNodeCorporationSpecific(b) ? 0 : 1;
      if (aCorp !== bCorp) return aCorp - bCorp;
    }
    return 0;
  });

  const whatAppliesToday: ClauseNode[] = [];
  const olderOrReplacedRules: ClauseNode[] = [];
  const relatedProvisions: ClauseNode[] = [];

  for (const node of taggedClauses) {
    if (isExcludedNonContentOrBareHeading(node)) {
      continue;
    }

    // Bye-law 1.4 is NEVER placed in "Older or replaced rules" and NEVER labelled replaced (Part 1.6)
    if (isByeLaw14Node(node, docMetaById)) {
      relatedProvisions.push(node);
      continue;
    }

    // Definitions move to "Related provisions" (except on the Definitions subject itself) and are never labelled replaced unless replaced by a later instrument (Part 1.6 & 1.7)
    if (subjectMeta.topicId !== "definitions" && isDefinitionNode(node)) {
      relatedProvisions.push(node);
      continue;
    }

    const dMeta = docMetaById.get(node.doc_id ?? "");
    const isOmitted = isNodeOmittedByAmendment(node);
    const isDraftOrSuperseded =
      isOmitted ||
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

    // Exclude standalone `table` nodes from the text provision list when clean parameter tables are already rendered above
    if (node.type === "table" && subjectMeta.parameterKinds.length > 0) {
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
      if (whatAppliesToday.length < 7) {
        whatAppliesToday.push(node);
      } else {
        relatedProvisions.push(node);
      }
    } else {
      relatedProvisions.push(node);
    }
  }

  if (whatAppliesToday.length === 0 && relatedProvisions.length > 0) {
    whatAppliesToday.push(...relatedProvisions.splice(0, 6));
  }

  // Sort older/replaced provisions newest first
  olderOrReplacedRules.sort((a, b) => {
    const verA = (a.versions ?? [])[a.versions ? a.versions.length - 1 : 0];
    const verB = (b.versions ?? [])[b.versions ? b.versions.length - 1 : 0];
    const dA =
      verA?.valid_from ||
      docMetaById.get(a.doc_id ?? "")?.effective_from ||
      docMetaById.get(a.doc_id ?? "")?.notified_date ||
      "0000-00-00";
    const dB =
      verB?.valid_from ||
      docMetaById.get(b.doc_id ?? "")?.effective_from ||
      docMetaById.get(b.doc_id ?? "")?.notified_date ||
      "0000-00-00";
    return dB.localeCompare(dA);
  });

  const totalOlderProvisionsCount = olderOrReplacedRules.length;
  const totalRelatedProvisionsCount = relatedProvisions.length;
  const visibleOlderRules = olderOrReplacedRules.slice(0, 6);
  const visibleRelatedProvisions = relatedProvisions.slice(0, 6);

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
    docTitleById,
    docMetaById,
    subjectMeta.zoningGoverned
  );

  // Band continuity & current-text overlap notices (e.g. 11.5 m to 12 m setback table overlap)
  const bandContinuityNotices = computeSubjectBandContinuityNotices(
    subjectMeta.slug,
    governingParamRecords,
    docMetaById
  );

  // Older/superseded parameter rows for this subject (sorted newest first so 2007 replaced rows precede 2004 displaced rows)
  const olderParamRecords = (parametersPayload?.records ?? [])
    .filter(
      (r) =>
        paramKinds.includes(r.parameter) &&
        (r.legal_status !== "in_force" ||
          Boolean(r.valid_to) ||
          (subjectMeta.zoningGoverned &&
            docMetaById.get(r.source.doc_id)?.layer === "municipal"))
    )
    .sort((a, b) => {
      const aReplaced = a.legal_status === "superseded" || Boolean(a.valid_to) ? 1 : 0;
      const bReplaced = b.legal_status === "superseded" || Boolean(b.valid_to) ? 1 : 0;
      if (aReplaced !== bReplaced) return bReplaced - aReplaced;
      const dA = a.valid_to || a.valid_from || "0000-00-00";
      const dB = b.valid_to || b.valid_from || "0000-00-00";
      return dB.localeCompare(dA);
    });
  const olderParameterRows = buildDeduplicatedSubjectParameterRows(
    olderParamRecords,
    docTitleById,
    docMetaById,
    subjectMeta.zoningGoverned
  ).slice(0, 8);

  // Determine whether any governing rule or provision on this subject differs for the selected City Corporation
  const corporationDiffCount = isChildCorporation
    ? cleanParameterRows.filter((r) => r.isCorporationSpecific).length +
      whatAppliesToday.filter((n) => isNodeCorporationSpecific(n)).length
    : 0;

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

  function computeOlderProvisionReason(node: ClauseNode): string {
    const dMeta = docMetaById.get(node.doc_id ?? "");
    if (dMeta?.legal_status === "draft" || node.legal_status === "draft") {
      return "Draft, not in force.";
    }
    const vers = node.versions ?? [];
    const lastVer = vers.length > 0 ? vers[vers.length - 1] : null;
    if (node.omitted || lastVer?.omitted) {
      const amDocId =
        lastVer?.source_doc || node.change_mark?.amending_doc || "";
      const amMeta = docMetaById.get(amDocId);
      return formatReplacedByPlain(
        amMeta,
        lastVer?.valid_from || node.change_mark?.effective_date
      );
    }
    if (dMeta?.superseded_by_document) {
      const supMeta = docMetaById.get(dMeta.superseded_by_document);
      return formatReplacedByPlain(supMeta);
    }
    if (dMeta?.layer === "municipal" && subjectMeta?.zoningGoverned) {
      return "Master plan rules apply instead (bye-law 1.4)";
    }
    if (vers.length > 1 && lastVer) {
      const amMeta = docMetaById.get(lastVer.source_doc);
      return formatReplacedByPlain(amMeta, lastVer.valid_from);
    }
    return "Replaced by a later amendment.";
  }

  function renderProvisionRow(
    node: ClauseNode,
    options?: { olderReason?: string; compact?: boolean }
  ) {
    const baseDocId = node.doc_id ?? "";
    const baseDocMeta = docMetaById.get(baseDocId);
    const vers = node.versions ?? [];
    const hasAmendedVersion =
      !options?.olderReason &&
      vers.length > 1 &&
      !vers[vers.length - 1].omitted &&
      Boolean(vers[vers.length - 1].content) &&
      vers[vers.length - 1].content !== "None";

    const activeVer = hasAmendedVersion ? vers[vers.length - 1] : null;
    const origVer = hasAmendedVersion ? vers[0] : null;

    const citingDocId =
      activeVer?.source_doc ||
      (hasAmendedVersion ? node.change_mark?.amending_doc : null) ||
      baseDocId;
    const citingDocMeta = docMetaById.get(citingDocId) ?? baseDocMeta;
    const plainDocTitle =
      docTitleById.get(citingDocId) ??
      formatPlainDocumentTitle(citingDocMeta, citingDocId);

    const effDate =
      citingDocMeta?.effective_from ||
      citingDocMeta?.notified_date ||
      activeVer?.valid_from ||
      baseDocMeta?.effective_from ||
      baseDocMeta?.notified_date;

    const activeCit =
      activeVer?.citations?.[0] ?? node.citations?.[0];
    const page = activeCit?.page ?? 1;
    const pdfUrl =
      citingDocMeta?.official_url ||
      citingDocMeta?.source_url ||
      node.source_url;
    const archiveUrl =
      citingDocMeta?.retrieval?.archive_url || node.archive_url;

    const isCompact = Boolean(options?.compact);
    const currentWording = activeVer?.content || node.text;
    const displayText = isCompact
      ? truncateAtWordBoundary(currentWording, 260)
      : truncateAtWordBoundary(currentWording, 480);

    const previousWording =
      hasAmendedVersion
        ? origVer?.content && origVer.content !== "None"
          ? origVer.content
          : node.change_mark?.original_text &&
              node.change_mark.original_text !== "None"
            ? node.change_mark.original_text
            : node.text !== currentWording
              ? node.text
              : null
        : null;
    const origDocTitle =
      docTitleById.get(baseDocId) ??
      formatPlainDocumentTitle(baseDocMeta, baseDocId);
    const origDate = formatHumanDate(
      baseDocMeta?.effective_from || baseDocMeta?.notified_date
    );
    const origPage = origVer?.citations?.[0]?.page ?? node.citations?.[0]?.page ?? 1;

    // Avoid repeating old body sentences inside the provision link title
    const rawTitle = (node.heading || node.title || "").trim();
    const showHeading =
      Boolean(rawTitle) &&
      rawTitle.length <= 60 &&
      rawTitle.toLowerCase() !== (node.text || "").trim().toLowerCase() &&
      rawTitle.toLowerCase() !== (previousWording || "").trim().toLowerCase();

    const changedMonthYear = hasAmendedVersion
      ? `Changed ${formatMonthYearPlain(effDate)}`
      : null;
    const isCorpDiffNode =
      isChildCorporation && isNodeCorporationSpecific(node);

    return (
      <li
        key={`${baseDocId}:${node.eid}`}
        className="border-b border-[#c8ccc0] py-4 last:border-b-0"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div className="flex flex-wrap items-baseline gap-2">
            <Link
              href={`/j/${jurisdiction.id}/documents/${baseDocId}#node-${node.eid}`}
              className="font-mono text-sm font-semibold text-[#080909] underline decoration-[#080909] underline-offset-4"
            >
              {node.number || "Provision"}
              {showHeading ? ` · ${rawTitle}` : ""}
            </Link>
            {isCorpDiffNode && (
              <span
                data-testid="corporation-diff-badge"
                className="border border-[#080909] bg-[#efeee8] px-2 py-0.5 font-mono text-[10.5px] font-medium text-[#080909]"
              >
                In {plainCorporationName}
              </span>
            )}
            {changedMonthYear && (
              <span
                data-testid="provision-changed-tag"
                className="border border-[#c8ccc0] bg-[#efeee8] px-2 py-0.5 font-mono text-[10.5px] text-[#080909]"
              >
                {changedMonthYear}
              </span>
            )}
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

        {options?.olderReason && (
          <div
            data-testid="older-rule-reason"
            className="mt-1 font-mono text-xs text-[#5b5e56]"
          >
            {options.olderReason}
          </div>
        )}

        <p className="dg-serif mt-2 whitespace-pre-line text-base leading-relaxed text-[#171917]">
          {displayText}
        </p>

        {!isCompact && node.notes_by_site && node.notes_by_site.length > 0 && (
          <div className="mt-3 border-l-2 border-[#c8ccc0] bg-[#efeee8] px-3 py-2 text-xs text-[#171917]">
            <span className="dg-mono mr-2 text-[#5b5e56]">
              In short, by this site:
            </span>
            {node.notes_by_site.join(" ")}
          </div>
        )}

        {!isCompact && (
          <details className="mt-2">
            <summary className="inline-flex min-h-[44px] cursor-pointer items-center font-mono text-[11px] uppercase tracking-[0.12em] text-[#5b5e56] hover:text-[#080909]">
              {previousWording ? "Details & previous wording" : "Details"}
            </summary>
            <div className="mt-1 space-y-2 border border-[#c8ccc0] bg-[#efeee8] p-3 font-mono text-xs text-[#5b5e56]">
              <div>
                Current source:{" "}
                <span className="text-[#080909]">{plainDocTitle}</span> (
                {citingDocMeta
                  ? formatPlainInstrumentStatus(citingDocMeta)
                  : "In force"}
                ) · p. {page}
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
              {previousWording && (
                <div
                  data-testid="provision-previous-wording"
                  className="border-t border-[#c8ccc0] pt-2"
                >
                  <div className="font-semibold text-[#080909]">
                    Previous wording ({origDocTitle}, {origDate}, p. {origPage}):
                  </div>
                  <p className="dg-serif mt-1 text-xs text-[#171917]">
                    {previousWording}
                  </p>
                </div>
              )}
              <div>
                Technical address:{" "}
                <code className="text-[#080909]">
                  {baseDocId}:{node.eid}
                </code>
              </div>
            </div>
          </details>
        )}
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
        {/* 1. Heading, one plain sentence, and corporation selector */}
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

          {isChildCorporation && (
            <div
              data-testid="corporation-layer-notice"
              className="mt-3 space-y-1 border-l-2 border-[#080909] bg-[#efeee8] px-3 py-2 text-xs text-[#171917]"
            >
              <p className="font-mono text-xs font-medium text-[#080909]">
                Showing {parentPlainName} rules, with differences for{" "}
                {plainCorporationName}.
              </p>
              {corporationDiffCount === 0 && (
                <p
                  data-testid="corporation-no-differences"
                  className="dg-serif text-xs text-[#5b5e56]"
                >
                  No differences for {plainCorporationName} on this subject.
                </p>
              )}
            </div>
          )}

          {subjectMeta.slug === "land-use" && (
            <p
              data-testid="land-use-zone-gap-notice"
              className="dg-serif mt-3 border-l-2 border-[#080909] bg-[#efeee8] px-3 py-2 text-sm text-[#171917]"
            >
              {landUseZoneGapLine}
            </p>
          )}

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

          {bandContinuityNotices.map((notice) => (
            <div
              key={notice.id}
              data-testid="band-continuity-notice"
              className="border border-[#080909] bg-[#efeee8] p-4"
            >
              <div className="dg-mono text-[#080909]">{notice.headline}</div>
              <p className="dg-serif mt-1 text-sm leading-relaxed text-[#171917]">
                {notice.explanation}
              </p>
              <ul className="mt-3 space-y-1.5 border-t border-[#c8ccc0] pt-2 font-mono text-xs text-[#171917]">
                <li>
                  <span className="font-semibold text-[#080909]">
                    {notice.sourceA.docTitle}
                  </span>{" "}
                  ({notice.sourceA.date},{" "}
                  <a
                    href={notice.sourceA.pageLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    p. {notice.sourceA.page}
                  </a>
                  ): {notice.sourceA.ruleSummary}
                </li>
                <li>
                  <span className="font-semibold text-[#080909]">
                    {notice.sourceB.docTitle}
                  </span>{" "}
                  ({notice.sourceB.date},{" "}
                  <a
                    href={notice.sourceB.pageLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    p. {notice.sourceB.page}
                  </a>
                  ): {notice.sourceB.ruleSummary}
                </li>
              </ul>
            </div>
          ))}

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
                          {isChildCorporation && row.isCorporationSpecific ? (
                            <span>
                              <strong className="font-mono text-xs">
                                In {plainCorporationName}:
                              </strong>{" "}
                              {row.ruleLabel}
                            </span>
                          ) : (
                            row.ruleLabel
                          )}
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
                            <summary className="cursor-pointer font-mono text-[11px] uppercase tracking-[0.12em] text-[#5b5e56]">
                              Details
                            </summary>
                            <span className="mt-1 block space-y-1 font-mono text-[10px] text-[#5b5e56]">
                              <span className="block">
                                {row.tableLabel ? `${row.tableLabel} · ` : ""}
                                {row.rawRowHeader ? `${row.rawRowHeader} · ` : ""}
                                {row.rawCellText} ({row.parameterIds[0]})
                              </span>
                              {row.note && (
                                <span
                                  data-testid="parameter-row-note"
                                  className="block text-[#080909]"
                                >
                                  {row.note}
                                </span>
                              )}
                            </span>
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
                    {byelaw14Step.authority.clause_id} (p.{" "}
                    {byelaw14Step.authority.page})
                  </div>
                  <blockquote className="dg-serif mt-1 border-l-2 border-[#080909] pl-3 italic text-[#171917]">
                    &ldquo;{byelaw14Step.authority.quote}&rdquo;
                  </blockquote>
                </div>
              )}
              {lexPosteriorStep && (
                <div>
                  <div className="font-mono text-xs font-semibold text-[#080909]">
                    {lexPosteriorStep.title} —{" "}
                    {lexPosteriorStep.authority.clause_id} (p.{" "}
                    {lexPosteriorStep.authority.page})
                  </div>
                  <blockquote className="dg-serif mt-1 border-l-2 border-[#080909] pl-3 italic text-[#171917]">
                    &ldquo;{lexPosteriorStep.authority.quote}&rdquo;
                  </blockquote>
                </div>
              )}
              {corpScopeStep && (
                <div>
                  <div className="font-mono text-xs font-semibold text-[#080909]">
                    {corpScopeStep.title} —{" "}
                    {corpScopeStep.authority.clause_id} (p.{" "}
                    {corpScopeStep.authority.page})
                  </div>
                  <blockquote className="dg-serif mt-1 border-l-2 border-[#080909] pl-3 italic text-[#171917]">
                    &ldquo;{corpScopeStep.authority.quote}&rdquo;
                  </blockquote>
                </div>
              )}
            </div>
          </details>
        </section>

        {/* 4. Older or replaced rules (collapsed, newest first) */}
        {(visibleOlderRules.length > 0 || olderParameterRows.length > 0) && (
          <section
            aria-label="Older or replaced rules"
            className="border-t border-[#c8ccc0] pt-6"
          >
            <details data-testid="older-or-replaced-rules">
              <summary className="flex min-h-[44px] cursor-pointer items-center justify-between font-mono text-xs uppercase tracking-[0.12em] text-[#5b5e56] hover:text-[#080909]">
                <span>
                  Older or replaced rules (
                  {totalOlderProvisionsCount + olderParameterRows.length}) —
                  newest first
                </span>
              </summary>
              <div className="mt-4 space-y-6">
                {olderParameterRows.length > 0 && (
                  <div className="overflow-x-auto">
                    <div className="dg-mono mb-2 text-[#5b5e56]">
                      Older or replaced table rows ({olderParameterRows.length})
                    </div>
                    <table
                      data-testid="older-parameter-table"
                      className="dg-table"
                    >
                      <thead>
                        <tr>
                          <th>Rule</th>
                          <th>Conditions</th>
                          <th>Value</th>
                          <th>Source &amp; page</th>
                          <th>Status</th>
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
                            <td className="font-mono text-xs text-[#5b5e56]">
                              {row.statusLabel}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {visibleOlderRules.length > 0 && (
                  <ul className="border-t border-[#c8ccc0]">
                    {visibleOlderRules.map((node) =>
                      renderProvisionRow(node, {
                        olderReason: computeOlderProvisionReason(node),
                        compact: true,
                      })
                    )}
                  </ul>
                )}
              </div>
            </details>
          </section>
        )}

        {/* 5. Related provisions (collapsed) */}
        {visibleRelatedProvisions.length > 0 && (
          <section
            aria-label="Related provisions"
            className="border-t border-[#c8ccc0] pt-6"
          >
            <details data-testid="related-provisions">
              <summary className="flex min-h-[44px] cursor-pointer items-center justify-between font-mono text-xs uppercase tracking-[0.12em] text-[#5b5e56] hover:text-[#080909]">
                <span>Related provisions ({totalRelatedProvisionsCount})</span>
              </summary>
              <div className="mt-4">
                <ul className="border-t border-[#c8ccc0]">
                  {visibleRelatedProvisions.map((node) =>
                    renderProvisionRow(node, { compact: true })
                  )}
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
