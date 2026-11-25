/**
 * Pure, deterministic 6-step statutory building code resolver and point-in-polygon
 * geospatial lookup for the browser (mirrors `pipeline/bylaws/resolver.py`, Part 4).
 */

import type {
  ConsolidatedClauseRecord,
  GenericFeatureCollection,
  JurisdictionConsolidated,
  JurisdictionParameters,
  NumericInterval,
  ParameterRecord,
  ResolutionStep,
  StatutoryResolutionConfig,
  ZoneGeometry,
  ZonesFeatureCollection,
} from "@/lib/data";

export const PARAMETER_ORDER: ReadonlyArray<ParameterRecord["parameter"]> = [
  "ground_coverage_max_pct",
  "far_base_max",
  "far_premium_additional_max",
  "tdr_receivable_max",
  "setback_front_min_m",
  "setback_rear_min_m",
  "setback_side_min_m",
  "building_height_max_m",
  "floors_max",
  "parking_requirement",
];

export const PARAMETER_LABELS: Record<ParameterRecord["parameter"], string> = {
  ground_coverage_max_pct: "Ground coverage",
  far_base_max: "Base FAR",
  far_premium_additional_max: "Premium FAR",
  tdr_receivable_max: "TDR / DRC headroom",
  setback_front_min_m: "Front setback",
  setback_rear_min_m: "Rear setback",
  setback_side_min_m: "Side setback",
  building_height_max_m: "Building height",
  floors_max: "Maximum floors",
  parking_requirement: "Parking",
};

export interface ExcludedParameterRecord {
  record: ParameterRecord;
  reason_not_chosen: string;
  excluded_at_step: number;
}

export interface ResolvedParameterOutcome {
  parameter: ParameterRecord["parameter"];
  status: "resolved" | "not_settled" | "no_applicable_rule";
  value: number | string | null;
  unit: string | null;
  value_text?: string;
  computed_value: number | null;
  computed_unit: string | null;
  display_value: string;
  governing_record: ParameterRecord | null;
  resolution_step: ResolutionStep | null;
  plain_reason: string;
  other_applicable_records: ExcludedParameterRecord[];
  tied_records: ParameterRecord[];
}

export interface PlotGeographyLookup {
  lat: number | null;
  lon: number | null;
  corporation_id: string | null;
  corporation_name: string | null;
  ward_id: string | null;
  ward_name: string | null;
  planning_district: string | null;
  zone_code: string;
  zone_label: string;
  zone_source: "polygon_lookup" | "user_selected" | "unknown";
  overlays: Array<Record<string, unknown>>;
}

export interface CorporationChangeSummary {
  clause_id: string;
  number: string;
  title: string | null;
  change_note: string | null;
  as_of_date: string;
  amending_clause_id: string | null;
  omitted: boolean;
  summary: string;
}

export interface PlotResolutionResult {
  derived: true;
  notice: string;
  inputs: {
    corporation_id: string;
    zone_code: string;
    plot_area_m2: number;
    road_width_m: number;
    plot_depth_m: number;
    plot_width_m: number;
    building_height_m: number;
    use: string;
    as_of_date: string;
  };
  geography: PlotGeographyLookup | null;
  parameters: Record<ParameterRecord["parameter"], ResolvedParameterOutcome>;
  corporation_changes: CorporationChangeSummary[];
}

function pointInRing(lon: number, lat: number, ring: ReadonlyArray<ReadonlyArray<number>>): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0];
    const yi = ring[i][1];
    const xj = ring[j][0];
    const yj = ring[j][1];
    const intersect =
      yi > lat !== yj > lat &&
      lon < ((xj - xi) * (lat - yi)) / (yj - yi || 1e-12) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function pointInPolygonRings(
  lon: number,
  lat: number,
  rings: ReadonlyArray<ReadonlyArray<ReadonlyArray<number>>>
): boolean {
  if (rings.length === 0) return false;
  if (!pointInRing(lon, lat, rings[0])) return false;
  for (let k = 1; k < rings.length; k++) {
    if (pointInRing(lon, lat, rings[k])) return false;
  }
  return true;
}

export function booleanPointInGeometry(
  lon: number,
  lat: number,
  geometry: ZoneGeometry | null | undefined
): boolean {
  if (!geometry || !Array.isArray(geometry.coordinates) || geometry.coordinates.length === 0) {
    return false;
  }
  if (geometry.type === "Polygon") {
    return pointInPolygonRings(
      lon,
      lat,
      geometry.coordinates as unknown as ReadonlyArray<ReadonlyArray<ReadonlyArray<number>>>
    );
  }
  if (geometry.type === "MultiPolygon") {
    const polys = geometry.coordinates as unknown as ReadonlyArray<
      ReadonlyArray<ReadonlyArray<ReadonlyArray<number>>>
    >;
    for (const poly of polys) {
      if (pointInPolygonRings(lon, lat, poly)) return true;
    }
  }
  return false;
}

export function intervalMatches(
  interval: NumericInterval | null | undefined,
  value: number | null | undefined
): boolean {
  if (!interval || value === null || value === undefined) {
    return true;
  }
  const lo = interval.min;
  const hi = interval.max;
  const loInc = interval.min_inclusive ?? true;
  const hiInc = interval.max_inclusive ?? true;
  if (lo !== null && lo !== undefined) {
    if (loInc && value < lo) return false;
    if (!loInc && value <= lo) return false;
  }
  if (hi !== null && hi !== undefined) {
    if (hiInc && value > hi) return false;
    if (!hiInc && value >= hi) return false;
  }
  return true;
}

export function lookupPlotGeography(options: {
  lat: number | null;
  lon: number | null;
  explicitCorporationId?: string | null;
  explicitZoneCode?: string | null;
  boundaryFc?: GenericFeatureCollection | null;
  wardsFc?: GenericFeatureCollection | null;
  planningDistrictsFc?: GenericFeatureCollection | null;
  zonesFc?: ZonesFeatureCollection | GenericFeatureCollection | null;
  overlaysFc?: GenericFeatureCollection | null;
}): PlotGeographyLookup {
  const {
    lat,
    lon,
    explicitCorporationId = null,
    explicitZoneCode = null,
    boundaryFc = null,
    wardsFc = null,
    planningDistrictsFc = null,
    zonesFc = null,
    overlaysFc = null,
  } = options;

  const corporationId = explicitCorporationId;
  let corporationName: string | null = null;
  let wardId: string | null = null;
  let wardName: string | null = null;
  let planningDistrict: string | null = null;
  let zoneCode: string | null = null;
  let zoneLabel: string | null = null;
  let zoneSource: "polygon_lookup" | "user_selected" | "unknown" = "unknown";
  const matchedOverlays: Array<Record<string, unknown>> = [];

  if (lat !== null && lon !== null) {
    for (const feat of boundaryFc?.features ?? []) {
      if (booleanPointInGeometry(lon, lat, feat.geometry)) {
        const p = feat.properties ?? {};
        corporationName = String(p.Corporation ?? p.name ?? corporationId ?? "");
        break;
      }
    }

    for (const feat of wardsFc?.features ?? []) {
      if (booleanPointInGeometry(lon, lat, feat.geometry)) {
        const p = feat.properties ?? {};
        wardId = String(p.ward_id ?? p.ward_no ?? "");
        wardName = String(p.ward_name ?? p.Ward_Name ?? "");
        if (!corporationName && p.Corporation) {
          corporationName = String(p.Corporation);
        }
        break;
      }
    }

    for (const feat of planningDistrictsFc?.features ?? []) {
      if (booleanPointInGeometry(lon, lat, feat.geometry)) {
        const p = feat.properties ?? {};
        planningDistrict = String(
          p.district_code ?? p.planning_district ?? p.district_name ?? ""
        );
        break;
      }
    }

    for (const feat of zonesFc?.features ?? []) {
      const p = (feat.properties ?? {}) as Record<string, unknown>;
      if (p.superseded_by || p.record_superseded_by) continue;
      if (booleanPointInGeometry(lon, lat, feat.geometry)) {
        zoneCode = String(p.zone_code ?? "");
        zoneLabel = String(p.zone_label ?? zoneCode);
        zoneSource = "polygon_lookup";
        if (!planningDistrict && p.planning_district) {
          planningDistrict = String(p.planning_district);
        }
        break;
      }
    }

    for (const feat of overlaysFc?.features ?? []) {
      if (booleanPointInGeometry(lon, lat, feat.geometry)) {
        matchedOverlays.push({ ...(feat.properties ?? {}) });
      }
    }
  }

  if (!zoneCode && explicitZoneCode) {
    zoneCode = explicitZoneCode;
    zoneLabel = explicitZoneCode;
    zoneSource = "user_selected";
  }

  return {
    lat,
    lon,
    corporation_id: corporationId,
    corporation_name: corporationName,
    ward_id: wardId,
    ward_name: wardName,
    planning_district: planningDistrict,
    zone_code: zoneCode ?? "unknown",
    zone_label:
      zoneLabel ?? (zoneCode ? zoneCode : "Zone data not yet available here"),
    zone_source: zoneSource,
    overlays: matchedOverlays,
  };
}

function findInstrumentFamily(
  docId: string,
  families: Record<string, string[]>
): string {
  for (const [fam, list] of Object.entries(families)) {
    if (list.includes(docId)) return fam;
  }
  return "other";
}

export function resolvePlotParameters(options: {
  parametersPayload: JurisdictionParameters;
  resolutionConfig: StatutoryResolutionConfig;
  corporationId: string;
  zoneCode: string;
  plotAreaM2: number;
  roadWidthM: number;
  plotDepthM?: number | null;
  plotWidthM?: number | null;
  buildingHeightM?: number | null;
  use?: string;
  asOfDate?: string;
  consolidatedPayload?: JurisdictionConsolidated | null;
  geography?: PlotGeographyLookup | null;
}): PlotResolutionResult {
  const {
    parametersPayload,
    resolutionConfig,
    corporationId,
    zoneCode,
    plotAreaM2,
    roadWidthM,
    plotDepthM = null,
    plotWidthM = null,
    buildingHeightM = null,
    use = "residential",
    asOfDate = "2026-11-25",
    consolidatedPayload = null,
    geography = null,
  } = options;

  const allRecords = parametersPayload.records ?? [];
  const stepsById = new Map<string, ResolutionStep>();
  for (const s of resolutionConfig.steps ?? []) {
    if (s.enabled) {
      stepsById.set(s.step_id, s);
    }
  }
  const families = resolutionConfig.instrument_families ?? {};
  const zoningGoverned = new Set(
    stepsById.get("zoning_governs_via_byelaw_1_4")?.parameters_governed ?? []
  );

  const inferredDepth =
    plotDepthM !== null && plotDepthM !== undefined
      ? plotDepthM
      : Math.round(Math.sqrt(plotAreaM2 * 1.5) * 100) / 100;
  const inferredWidth =
    plotWidthM !== null && plotWidthM !== undefined
      ? plotWidthM
      : Math.round((plotAreaM2 / Math.max(1, inferredDepth)) * 100) / 100;
  const effHeight =
    buildingHeightM !== null && buildingHeightM !== undefined
      ? buildingHeightM
      : 11.5;

  const resolvedByParam = {} as Record<
    ParameterRecord["parameter"],
    ResolvedParameterOutcome
  >;
  let baseFarNumeric: number | null = null;

  for (const paramName of PARAMETER_ORDER) {
    const matching: ParameterRecord[] = [];
    for (const rec of allRecords) {
      if (rec.parameter !== paramName) continue;
      if (rec.valid_from && String(rec.valid_from) > asOfDate) continue;
      const conds = rec.conditions;
      if (conds.zone && zoneCode !== "unknown" && !conds.zone.includes(zoneCode)) {
        continue;
      }
      if (conds.zone && zoneCode === "unknown") {
        continue;
      }
      if (
        conds.use &&
        !conds.use.map((u) => u.toLowerCase()).includes(use.toLowerCase())
      ) {
        continue;
      }
      if (!intervalMatches(conds.plot_area_m2, plotAreaM2)) continue;
      if (!intervalMatches(conds.road_width_m, roadWidthM)) continue;
      if (!intervalMatches(conds.building_height_m, effHeight)) continue;
      if (!intervalMatches(conds.plot_depth_m, inferredDepth)) continue;
      if (!intervalMatches(conds.plot_width_m, inferredWidth)) continue;
      matching.push(rec);
    }

    const otherRecords: ExcludedParameterRecord[] = [];
    let activePool: ParameterRecord[] = [];
    let decidingStepId = "lex_posterior_within_family";

    // Step 1: Drafts never apply
    const step1 = stepsById.get("draft_excluded");
    for (const r of matching) {
      if (step1 && r.legal_status === "draft") {
        otherRecords.push({
          record: r,
          reason_not_chosen: `Step 1 (${step1.title}): ${step1.plain_rule}`,
          excluded_at_step: 1,
        });
      } else {
        activePool.push(r);
      }
    }

    // Step 2: Corporation scope
    const step2 = stepsById.get("corporation_scope");
    const afterStep2: ParameterRecord[] = [];
    for (const r of activePool) {
      const recJurs = r.conditions.jurisdiction;
      if (step2 && recJurs && !recJurs.includes(corporationId)) {
        otherRecords.push({
          record: r,
          reason_not_chosen: `Step 2 (${step2.title}): ${step2.plain_rule}`,
          excluded_at_step: 2,
        });
      } else {
        afterStep2.push(r);
      }
    }
    activePool = afterStep2;

    // Step 3: GBGA 2024 notwithstanding
    const step3 = stepsById.get("gbga_notwithstanding");
    if (step3) {
      const statuteRecs = activePool.filter(
        (r) => findInstrumentFamily(r.source.doc_id, families) === "statute"
      );
      if (statuteRecs.length > 0) {
        for (const r of activePool) {
          if (!statuteRecs.includes(r)) {
            otherRecords.push({
              record: r,
              reason_not_chosen: `Step 3 (${step3.title}): ${step3.plain_rule}`,
              excluded_at_step: 3,
            });
          }
        }
        activePool = statuteRecs;
        decidingStepId = "gbga_notwithstanding";
      }
    }

    // Step 4: Zoning regulations govern via bye-law 1.4
    const step4 = stepsById.get("zoning_governs_via_byelaw_1_4");
    if (step4 && zoningGoverned.has(paramName)) {
      const zrRecs = activePool.filter(
        (r) =>
          findInstrumentFamily(r.source.doc_id, families) ===
          "zoning_regulations"
      );
      const nonZrRecs = activePool.filter((r) => !zrRecs.includes(r));
      if (zrRecs.length > 0 && nonZrRecs.length > 0) {
        for (const r of nonZrRecs) {
          otherRecords.push({
            record: r,
            reason_not_chosen: `Step 4 (${step4.title}): ${step4.plain_rule}`,
            excluded_at_step: 4,
          });
        }
        activePool = zrRecs;
        decidingStepId = "zoning_governs_via_byelaw_1_4";
      } else if (zrRecs.length > 0) {
        decidingStepId = "zoning_governs_via_byelaw_1_4";
      }
    }

    // Step 5: Later in-force provision within same family wins
    const step5 = stepsById.get("lex_posterior_within_family");
    if (step5 && activePool.length > 1) {
      const inForceNow = activePool.filter(
        (r) =>
          r.legal_status === "in_force" &&
          (!r.valid_to || String(r.valid_to) > asOfDate)
      );
      if (inForceNow.length > 0 && inForceNow.length < activePool.length) {
        for (const r of activePool) {
          if (!inForceNow.includes(r)) {
            otherRecords.push({
              record: r,
              reason_not_chosen: `Step 5 (${step5.title}): Superseded on ${r.valid_to} by later amendment.`,
              excluded_at_step: 5,
            });
          }
        }
        activePool = inForceNow;
        decidingStepId = "lex_posterior_within_family";
      }

      const zoneSpecific = activePool.filter(
        (r) => r.conditions.zone && r.conditions.zone.includes(zoneCode)
      );
      if (zoneSpecific.length > 0 && zoneSpecific.length < activePool.length) {
        for (const r of activePool) {
          if (!zoneSpecific.includes(r)) {
            otherRecords.push({
              record: r,
              reason_not_chosen:
                "General provision superseded by zone-specific development control table in Chapter 4.",
              excluded_at_step: 5,
            });
          }
        }
        activePool = zoneSpecific;
      }

      if (activePool.length > 1) {
        const famsInPool = new Set(
          activePool.map((r) => findInstrumentFamily(r.source.doc_id, families))
        );
        if (famsInPool.size === 1) {
          const maxDate = activePool.reduce(
            (acc, r) =>
              String(r.valid_from ?? "") > acc
                ? String(r.valid_from ?? "")
                : acc,
            ""
          );
          const latestRecs = activePool.filter(
            (r) => String(r.valid_from ?? "") === maxDate
          );
          if (latestRecs.length < activePool.length) {
            for (const r of activePool) {
              if (!latestRecs.includes(r)) {
                otherRecords.push({
                  record: r,
                  reason_not_chosen: `Step 5 (${step5.title}): Earlier provision (${r.valid_from}) superseded by later provision (${maxDate}).`,
                  excluded_at_step: 5,
                });
              }
            }
            activePool = latestRecs;
            decidingStepId = "lex_posterior_within_family";
          }

          const nonRefRecs = activePool.filter((r) => r.unit !== "reference");
          if (nonRefRecs.length > 0 && nonRefRecs.length < activePool.length) {
            for (const r of activePool) {
              if (!nonRefRecs.includes(r)) {
                otherRecords.push({
                  record: r,
                  reason_not_chosen:
                    "Cross-reference pointer resolved to the target setback table.",
                  excluded_at_step: 5,
                });
              }
            }
            activePool = nonRefRecs;
          }
        }
      }
    }

    const uniqueByVal: ParameterRecord[] = [];
    const seenValKeys = new Set<string>();
    for (const r of activePool) {
      const vk = `${String(r.value)}|${String(r.unit)}|${r.source.doc_id}`;
      if (!seenValKeys.has(vk)) {
        seenValKeys.add(vk);
        uniqueByVal.push(r);
      }
    }

    if (uniqueByVal.length === 0) {
      resolvedByParam[paramName] = {
        parameter: paramName,
        status: "no_applicable_rule",
        value: null,
        unit: null,
        computed_value: null,
        computed_unit: null,
        display_value: "No rule matched plot inputs",
        governing_record: null,
        resolution_step: null,
        plain_reason:
          "No matching rule found for the given zone, plot area, and road width.",
        other_applicable_records: otherRecords,
        tied_records: [],
      };
      continue;
    }

    if (uniqueByVal.length === 1) {
      const gov = uniqueByVal[0];
      const stepObj =
        stepsById.get(decidingStepId) ??
        stepsById.get("zoning_governs_via_byelaw_1_4") ??
        null;
      const rawVal = gov.value;
      const rawUnit = gov.unit;
      let compVal: number | null = null;
      let compUnit: string | null = null;
      let displayVal = `${rawVal} ${rawUnit ?? ""}`.trim();

      if (typeof rawVal === "number") {
        if (paramName === "far_base_max") {
          baseFarNumeric = rawVal;
          compVal = Math.round(rawVal * plotAreaM2 * 100) / 100;
          compUnit = "m2_max_builtup";
          displayVal = `${rawVal} (up to ${compVal} m² floor area)`;
        } else if (paramName === "ground_coverage_max_pct") {
          compVal = Math.round((rawVal / 100) * plotAreaM2 * 100) / 100;
          compUnit = "m2_max_footprint";
          displayVal = `${rawVal}% (up to ${compVal} m² footprint)`;
        } else if (rawUnit === "pct_of_plot_depth") {
          compVal = Math.round((rawVal / 100) * inferredDepth * 100) / 100;
          compUnit = "m";
          displayVal = `${compVal} m (${rawVal}% of ${inferredDepth} m plot depth)`;
        } else if (rawUnit === "pct_of_plot_width") {
          compVal = Math.round((rawVal / 100) * inferredWidth * 100) / 100;
          compUnit = "m";
          displayVal = `${compVal} m (${rawVal}% of ${inferredWidth} m plot width)`;
        } else if (rawUnit === "multiple_of_base_far") {
          if (baseFarNumeric !== null) {
            compVal = Math.round(rawVal * baseFarNumeric * 1000) / 1000;
            compUnit = "far_ratio";
            displayVal = `+${compVal} FAR (${Math.round(rawVal * 100)}% of ${baseFarNumeric} base FAR)`;
          } else {
            displayVal = `${Math.round(rawVal * 100)}% of base FAR`;
          }
        } else if (rawUnit === "m") {
          compVal = rawVal;
          compUnit = "m";
          displayVal = `${rawVal} m`;
        }
      } else {
        displayVal = String(gov.value_text ?? rawVal);
      }

      const src = gov.source;
      const plainWhy = `${src.table_id ?? src.eid} (${src.doc_id}, p. ${src.page}) — ${
        stepObj ? stepObj.plain_rule : "Governing in-force provision."
      }`;

      resolvedByParam[paramName] = {
        parameter: paramName,
        status: "resolved",
        value: rawVal,
        unit: rawUnit,
        value_text: gov.value_text,
        computed_value: compVal,
        computed_unit: compUnit,
        display_value: displayVal,
        governing_record: gov,
        resolution_step: stepObj,
        plain_reason: plainWhy,
        other_applicable_records: otherRecords,
        tied_records: [],
      };
    } else {
      const step6 = stepsById.get("unresolved_tie") ?? null;
      resolvedByParam[paramName] = {
        parameter: paramName,
        status: "not_settled",
        value: null,
        unit: null,
        value_text: "Not settled: two rules apply",
        computed_value: null,
        computed_unit: null,
        display_value: "Not settled: two rules apply",
        governing_record: null,
        resolution_step: step6,
        plain_reason: step6
          ? step6.plain_rule
          : "Not settled: two rules apply",
        other_applicable_records: otherRecords,
        tied_records: uniqueByVal,
      };
    }
  }

  const corpChanges: CorporationChangeSummary[] = [];
  for (const rec of (consolidatedPayload?.records ?? []) as ConsolidatedClauseRecord[]) {
    const applied = rec.amendments_applied ?? [];
    if (applied.some((a) => String(a).includes("bbl-amend-2026"))) {
      corpChanges.push({
        clause_id: rec.clause_id,
        number: rec.number,
        title: rec.title,
        change_note: rec.change_note ?? null,
        as_of_date: rec.as_of_date,
        amending_clause_id: rec.amending_clause_id ?? null,
        omitted: Boolean(rec.omitted),
        summary: String(rec.text ?? "").slice(0, 240),
      });
    }
  }

  return {
    derived: true,
    notice: resolutionConfig.notice,
    inputs: {
      corporation_id: corporationId,
      zone_code: zoneCode,
      plot_area_m2: plotAreaM2,
      road_width_m: roadWidthM,
      plot_depth_m: inferredDepth,
      plot_width_m: inferredWidth,
      building_height_m: effHeight,
      use,
      as_of_date: asOfDate,
    },
    geography,
    parameters: resolvedByParam,
    corporation_changes: corpChanges,
  };
}
