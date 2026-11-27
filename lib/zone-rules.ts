import type {
  ClauseNode,
  ClauseZoneTagEntry,
  DocumentMetadata,
  ParameterRecord,
} from "@/lib/data";
import {
  formatHumanDate,
  formatParameterConditionsPlain,
  formatParameterValuePlain,
  formatPlainDocumentTitle,
  isPlausibleParameterRecord,
  PARAMETER_PLAIN_LABELS,
} from "@/lib/plain-language";

export type ZoneRuleGroupKey =
  | "uses"
  | "far"
  | "ground-coverage"
  | "setbacks"
  | "height"
  | "parking";

export interface ZoneRuleLine {
  id: string;
  rulePlain: string;
  valuePlain: string;
  sourceDocTitle: string;
  pageNumber: number;
  pageLink: string;
  subjectHref: string;
  corporationTag?: string | null;
}

export interface ZoneRuleGroup {
  key: ZoneRuleGroupKey;
  title: string;
  subjectSlug: string;
  subjectHref: string;
  lines: ZoneRuleLine[];
}

export interface ZoneRulesSummary {
  zoneCode: string;
  zoneLabel: string;
  hasLinkedRules: boolean;
  groups: ZoneRuleGroup[];
}

export interface Byelaw14GovernanceInfo {
  plainLine: string;
  verbatimQuote: string | null;
  attributionLabel: string;
  pageNumber: number;
  pageLink: string;
  documentHref: string;
}

const GROUP_DEFINITIONS: ReadonlyArray<{
  key: ZoneRuleGroupKey;
  title: string;
  subjectSlug: string;
}> = [
  { key: "uses", title: "Uses", subjectSlug: "land-use" },
  { key: "far", title: "FAR", subjectSlug: "far" },
  {
    key: "ground-coverage",
    title: "Ground coverage",
    subjectSlug: "ground-coverage",
  },
  { key: "setbacks", title: "Setbacks", subjectSlug: "setbacks" },
  { key: "height", title: "Height", subjectSlug: "height" },
  { key: "parking", title: "Parking", subjectSlug: "parking" },
];

const ZONE_TO_USE_CATEGORIES: Record<string, ReadonlyArray<string>> = {
  "R-MAIN": ["residential", "multi_dwelling_units"],
  "R-MIX": ["residential", "multi_dwelling_units", "retail_business"],
  "C-CENTRAL": ["commercial", "retail_business", "office_buildings"],
  "C-BIZ": [
    "commercial",
    "retail_business",
    "office_buildings",
    "lodging_hotels",
    "star_hotels",
  ],
  "C-AXES": ["commercial", "retail_business", "office_buildings"],
  "I-GEN": ["industrial", "industrial_buildings", "wholesale_warehouse"],
  "I-HITECH": [
    "industrial",
    "industrial_buildings",
    "office_buildings",
    "office_buildings_non_residential_dp",
  ],
  PSP: [
    "public_semi_public",
    "educational_buildings",
    "hospitals",
    "nursing_homes",
    "other_public_semi_public",
  ],
  "T-TRANS": ["traffic_transportation"],
};

const ZONE_CODE_LABELS_FALLBACK: Record<string, string> = {
  "R-MAIN": "Residential (Main)",
  "R-MIX": "Residential (Mixed)",
  "C-CENTRAL": "Commercial (Central)",
  "C-BIZ": "Commercial (Business)",
  "C-AXES": "Mutation Corridors",
  "I-GEN": "Industrial (General)",
  "I-HITECH": "Industrial (Hi-Tech)",
  PSP: "Public and semi-public",
  "T-TRANS": "Traffic and transportation",
  "G-PARK": "Parks and open spaces",
  "G-LAKE": "Lake and water body",
};

export function extractByelaw14GovernanceInfo(
  clauses: ReadonlyArray<ClauseNode>,
  documents: ReadonlyArray<DocumentMetadata>,
  jurisdictionId: string
): Byelaw14GovernanceInfo {
  const docById = new Map(documents.map((d) => [d.doc_id, d]));
  const muniBaseDoc = documents.find(
    (d) => d.role === "base" && d.layer === "municipal"
  );
  const b14Node = clauses.find(
    (c) => c.doc_id === muniBaseDoc?.doc_id && c.number === "1.4"
  );
  const ver = b14Node?.versions?.[b14Node.versions.length - 1];
  const verDoc = ver?.source_doc ? docById.get(ver.source_doc) : null;
  const pdfBase =
    verDoc?.official_url ||
    verDoc?.source_url ||
    muniBaseDoc?.official_url ||
    muniBaseDoc?.source_url ||
    "";
  const pageNumber =
    ver?.citations?.[0]?.page ?? b14Node?.citations?.[0]?.page ?? 2;
  const pageLink = pdfBase ? `${pdfBase}#page=${pageNumber}` : `#page=${pageNumber}`;
  const muniTitle = formatPlainDocumentTitle(muniBaseDoc);
  const verDate = formatHumanDate(
    verDoc?.effective_from || verDoc?.notified_date || ver?.valid_from || "2017-10-28"
  );
  const verbatimQuote =
    (ver?.content || b14Node?.text || "").replace(/\s+/g, " ").trim() || null;

  return {
    plainLine:
      "Under Bye-law 1.4, the Master Plan Zoning Regulations and their in-force amendments govern land use, coverage, FAR, setbacks, height, and parking.",
    verbatimQuote,
    attributionLabel: `${muniTitle}, bye-law 1.4 (${verDate}), p. ${pageNumber}`,
    pageNumber,
    pageLink,
    documentHref: muniBaseDoc
      ? `/j/${jurisdictionId}/documents/${muniBaseDoc.doc_id}#node-${b14Node?.eid ?? "part_I__sec_1.0__cl_1.4"}`
      : `/j/${jurisdictionId}/topics/far`,
  };
}

function resolveCorporationTag(
  record: ParameterRecord,
  corpNameById: ReadonlyMap<string, string>
): string | null {
  const jurs = record.conditions.jurisdiction;
  if (!jurs || jurs.length === 0) return null;
  const names = jurs.map((id) => corpNameById.get(id) ?? id);
  return `In ${names.join(", ")}`;
}

export function buildZoneRulesSummaryMap(params: {
  jurisdictionId: string;
  zoneCodesWithLabels: ReadonlyMap<string, string>;
  parameterRecords: ReadonlyArray<ParameterRecord>;
  clauseZoneTags: ReadonlyArray<ClauseZoneTagEntry>;
  clauses: ReadonlyArray<ClauseNode>;
  documents: ReadonlyArray<DocumentMetadata>;
  corpNameById?: ReadonlyMap<string, string>;
}): Record<string, ZoneRulesSummary> {
  const {
    jurisdictionId,
    zoneCodesWithLabels,
    parameterRecords,
    clauseZoneTags,
    clauses,
    documents,
    corpNameById = new Map(),
  } = params;

  const docById = new Map(documents.map((d) => [d.doc_id, d]));
  const clauseByCompositeId = new Map<string, ClauseNode>();
  for (const c of clauses) {
    if (c.clause_id) clauseByCompositeId.set(c.clause_id, c);
    if (c.doc_id && c.number) {
      clauseByCompositeId.set(`${c.doc_id}:${c.number}`, c);
    }
    if (c.doc_id && c.eid) {
      clauseByCompositeId.set(`${c.doc_id}:${c.eid}`, c);
    }
  }

  const activeParams = parameterRecords.filter(
    (r) =>
      r.legal_status === "in_force" &&
      !r.valid_to &&
      isPlausibleParameterRecord(r)
  );

  const allZoneCodes = new Set<string>([
    ...zoneCodesWithLabels.keys(),
    ...Object.keys(ZONE_CODE_LABELS_FALLBACK),
  ]);

  const result: Record<string, ZoneRulesSummary> = {};

  for (const zoneCode of allZoneCodes) {
    const zoneLabel =
      zoneCodesWithLabels.get(zoneCode) ??
      ZONE_CODE_LABELS_FALLBACK[zoneCode] ??
      zoneCode;
    const subjectHrefFor = (slug: string) =>
      `/j/${jurisdictionId}/topics/${slug}?zone=${encodeURIComponent(zoneCode)}`;
    const allowedUses = ZONE_TO_USE_CATEGORIES[zoneCode] ?? [];

    // 1. Uses group (from clause-zone-tags.json)
    const matchingTags = clauseZoneTags.filter((t) => t.zone_code === zoneCode);
    const useLines: ZoneRuleLine[] = [];
    const seenUseClauses = new Set<string>();
    for (const tag of matchingTags) {
      const clause =
        clauseByCompositeId.get(tag.clause_id) ??
        clauseByCompositeId.get(`${tag.doc_id}:${tag.clause_id}`);
      if (!clause) continue;
      if (clause.type === "table_row") continue;
      const key = `${clause.doc_id}:${clause.eid || clause.number}`;
      if (seenUseClauses.has(key)) continue;
      seenUseClauses.add(key);

      const docMeta = clause.doc_id ? docById.get(clause.doc_id) : undefined;
      const plainDoc = formatPlainDocumentTitle(docMeta, clause.doc_id);
      const pageNum = clause.citations?.[0]?.page ?? 1;
      const pdfUrl =
        clause.official_url ||
        clause.source_url ||
        docMeta?.official_url ||
        docMeta?.source_url ||
        "";
      const pageLink = pdfUrl ? `${pdfUrl}#page=${pageNum}` : `#page=${pageNum}`;
      const numLabel = clause.number ? `Regulation ${clause.number}` : "Provision";
      const headingText = (
        clause.heading ||
        clause.text ||
        `Permissible uses in ${zoneLabel}`
      )
        .replace(/\s+/g, " ")
        .trim();
      const shortSummary =
        headingText.length > 95
          ? `${headingText.slice(0, 92).trim()}…`
          : headingText;

      useLines.push({
        id: `use-${zoneCode}-${key}`,
        rulePlain: `${numLabel} (${plainDoc})`,
        valuePlain: shortSummary,
        sourceDocTitle: plainDoc,
        pageNumber: pageNum,
        pageLink,
        subjectHref: subjectHrefFor("land-use"),
        corporationTag: clause.change_mark?.label?.includes("Changed for ")
          ? clause.change_mark.label
          : null,
      });
      if (useLines.length >= 2) break;
    }

    const toParamLines = (
      recs: ParameterRecord[],
      subjectSlug: string,
      maxItems = 3
    ): ZoneRuleLine[] => {
      const seenSig = new Set<string>();
      const out: ZoneRuleLine[] = [];
      for (const r of recs) {
        const condText = formatParameterConditionsPlain(r.conditions, r);
        const paramLabel = PARAMETER_PLAIN_LABELS[r.parameter] ?? r.parameter;
        const valText = formatParameterValuePlain(r);
        const sig = `${paramLabel}|${condText}|${valText}`;
        if (seenSig.has(sig)) continue;
        seenSig.add(sig);

        const docMeta = docById.get(r.source.doc_id);
        const plainDoc = formatPlainDocumentTitle(docMeta, r.source.doc_id);
        out.push({
          id: r.parameter_id,
          rulePlain: `${paramLabel} · ${condText}`,
          valuePlain: valText,
          sourceDocTitle: plainDoc,
          pageNumber: r.source.page,
          pageLink: r.source.page_link,
          subjectHref: subjectHrefFor(subjectSlug),
          corporationTag: resolveCorporationTag(r, corpNameById),
        });
        if (out.length >= maxItems) break;
      }
      return out;
    };

    // 2. FAR group
    const baseFarRecs = activeParams.filter(
      (r) =>
        r.parameter === "far_base_max" && r.conditions.zone?.includes(zoneCode)
    );
    const extraFarRecs =
      baseFarRecs.length > 0
        ? activeParams.filter(
            (r) =>
              (r.parameter === "far_premium_additional_max" ||
                r.parameter === "tdr_receivable_max") &&
              (!r.conditions.zone ||
                r.conditions.zone.length === 0 ||
                r.conditions.zone.includes(zoneCode))
          )
        : [];
    const farLines = toParamLines(
      [...baseFarRecs, ...extraFarRecs],
      "far",
      3
    );

    // 3. Ground coverage group
    const covRecs = activeParams.filter(
      (r) =>
        r.parameter === "ground_coverage_max_pct" &&
        r.conditions.zone?.includes(zoneCode)
    );
    const covLines = toParamLines(covRecs, "ground-coverage", 3);

    // 4. Setbacks group
    const zoneSetbackRecs = activeParams.filter(
      (r) =>
        (r.parameter === "setback_front_min_m" ||
          r.parameter === "setback_rear_min_m" ||
          r.parameter === "setback_side_min_m") &&
        r.conditions.zone?.includes(zoneCode)
    );
    const generalSetbackRecs =
      zoneSetbackRecs.length === 0 &&
      zoneCode !== "G-PARK" &&
      zoneCode !== "G-LAKE"
        ? activeParams.filter(
            (r) =>
              (r.parameter === "setback_front_min_m" ||
                r.parameter === "setback_rear_min_m" ||
                r.parameter === "setback_side_min_m") &&
              (!r.conditions.zone || r.conditions.zone.length === 0)
          )
        : [];
    const setbackLines = toParamLines(
      [...zoneSetbackRecs, ...generalSetbackRecs],
      "setbacks",
      3
    );

    // 5. Height group
    const zoneHeightRecs = activeParams.filter(
      (r) =>
        (r.parameter === "building_height_max_m" ||
          r.parameter === "floors_max") &&
        (r.conditions.zone?.includes(zoneCode) ||
          ((!r.conditions.zone || r.conditions.zone.length === 0) &&
            zoneCode !== "G-PARK" &&
            zoneCode !== "G-LAKE"))
    );
    const heightLines = toParamLines(zoneHeightRecs, "height", 2);

    // 6. Parking group
    const parkingRecs = activeParams.filter(
      (r) =>
        r.parameter === "parking_requirement" &&
        (r.conditions.zone?.includes(zoneCode) ||
          (r.conditions.use &&
            r.conditions.use.some((u) =>
              allowedUses.includes(u.toLowerCase())
            )))
    );
    const parkingLines = toParamLines(parkingRecs, "parking", 2);

    const linesByKey: Record<ZoneRuleGroupKey, ZoneRuleLine[]> = {
      uses: useLines,
      far: farLines,
      "ground-coverage": covLines,
      setbacks: setbackLines,
      height: heightLines,
      parking: parkingLines,
    };

    const groups: ZoneRuleGroup[] = GROUP_DEFINITIONS.map((def) => ({
      key: def.key,
      title: def.title,
      subjectSlug: def.subjectSlug,
      subjectHref: subjectHrefFor(def.subjectSlug),
      lines: linesByKey[def.key],
    }));

    const hasLinkedRules = groups.some((g) => g.lines.length > 0);
    result[zoneCode] = {
      zoneCode,
      zoneLabel,
      hasLinkedRules,
      groups,
    };
  }

  return result;
}
