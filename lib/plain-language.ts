import type {
  DocumentMetadata,
  JurisdictionDeclarations,
  NumericInterval,
  ParameterConditions,
  ParameterRecord,
  TopicDefinition,
} from "@/lib/data";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export const PLAUSIBILITY_BOUNDS: Record<
  Exclude<ParameterRecord["parameter"], "parking_requirement">,
  readonly [number, number]
> = {
  far_base_max: [0.25, 5.0],
  far_premium_additional_max: [0.05, 2.0],
  tdr_receivable_max: [0.0, 2.0],
  ground_coverage_max_pct: [5.0, 100.0],
  setback_front_min_m: [0.0, 30.0],
  setback_rear_min_m: [0.0, 30.0],
  setback_side_min_m: [0.0, 30.0],
  building_height_max_m: [3.0, 250.0],
  floors_max: [1.0, 60.0],
};

export const SETBACK_PCT_BOUNDS: readonly [number, number] = [1.0, 50.0];
export const PARKING_M2_BOUNDS: readonly [number, number] = [5.0, 1000.0];
const MIN_PLAUSIBLE_PLOT_AREA_M2 = 5.0;

export interface CodeSubjectMeta {
  slug: string;
  topicId: string;
  title: string;
  summary: string;
  parameterKinds: Array<ParameterRecord["parameter"]>;
  zoningGoverned: boolean;
  whyAppliesLine: string;
  hasMapLink?: boolean;
}

export const CODE_SUBJECTS: readonly CodeSubjectMeta[] = [
  {
    slug: "land-use",
    topicId: "land_use",
    title: "Land use",
    summary:
      "What may be built in Residential, Commercial, Industrial, Public and Semi-Public, and Traffic zones across Rings I, II and III.",
    parameterKinds: [],
    zoningGoverned: true,
    whyAppliesLine:
      "Bye-law 1.4 hands land use and permissible uses in each zone to the master plan zoning regulations.",
    hasMapLink: true,
  },
  {
    slug: "ground-coverage",
    topicId: "ground_coverage",
    title: "Ground coverage",
    summary:
      "How much of a plot's area may be covered by the building footprint, by zone and plot size.",
    parameterKinds: ["ground_coverage_max_pct"],
    zoningGoverned: true,
    whyAppliesLine:
      "Bye-law 1.4 hands maximum ground coverage to the master plan zoning regulations and their in-force amendments.",
  },
  {
    slug: "far",
    topicId: "far",
    title: "FAR",
    summary:
      "Total floor area allowed relative to plot size, including base FAR by zone and road width, premium FAR, and transferable development rights.",
    parameterKinds: [
      "far_base_max",
      "far_premium_additional_max",
      "tdr_receivable_max",
    ],
    zoningGoverned: true,
    whyAppliesLine:
      "Bye-law 1.4 hands floor area ratio (FAR) to the master plan zoning regulations, read with the April 2025 premium FAR chapter.",
  },
  {
    slug: "setbacks",
    topicId: "setbacks",
    title: "Setbacks",
    summary:
      "Open space required at the front, rear and sides of a building, by plot size and building height.",
    parameterKinds: [
      "setback_front_min_m",
      "setback_rear_min_m",
      "setback_side_min_m",
    ],
    zoningGoverned: true,
    whyAppliesLine:
      "Bye-law 1.4 hands setbacks to the master plan zoning regulations, governed today by the January 2026 setback tables for low-rise buildings and Table 9 for taller buildings.",
  },
  {
    slug: "height",
    topicId: "building_height",
    title: "Height",
    summary:
      "Maximum building height, number of floors, road-width caps, and high-rise thresholds.",
    parameterKinds: ["building_height_max_m", "floors_max"],
    zoningGoverned: true,
    whyAppliesLine:
      "Bye-law 1.4 hands maximum building height and number of floors to the master plan zoning regulations and their January 2026 amendments.",
  },
  {
    slug: "parking",
    topicId: "parking",
    title: "Parking",
    summary:
      "Minimum car and two-wheeler parking spaces, visitor parking, and ramp rules by building use.",
    parameterKinds: ["parking_requirement"],
    zoningGoverned: true,
    whyAppliesLine:
      "Bye-law 1.4 hands parking requirements to the master plan zoning regulations (Chapter 8, Table 23 and the June 2019 metro-corridor amendment).",
  },
  {
    slug: "basements-and-stilts",
    topicId: "basements_stilts",
    title: "Basements and stilts",
    summary:
      "When basements, cellars and stilt parking floors are allowed, their height and setback rules, and permitted uses.",
    parameterKinds: [],
    zoningGoverned: true,
    whyAppliesLine:
      "Master plan zoning regulations (as amended in January 2026) and building bye-laws govern basement levels, ramps, and stilt floor height.",
  },
  {
    slug: "projections-and-open-spaces",
    topicId: "projections_open_spaces",
    title: "Projections and open spaces",
    summary:
      "Balconies, chajjas, canopies, staircases in setbacks, courtyards, and buffer zones around lakes and drains.",
    parameterKinds: [],
    zoningGoverned: true,
    whyAppliesLine:
      "Master plan zoning regulations (including the October 2025 drain buffer notification) and building bye-laws govern open spaces, projections, and water-body buffers.",
  },
  {
    slug: "approvals-and-certificates",
    topicId: "approvals_certificates",
    title: "Approvals and certificates",
    summary:
      "Plan sanction, commencement certificate, occupancy certificate, khata rules, and corporation compounding schedules.",
    parameterKinds: [],
    zoningGoverned: false,
    whyAppliesLine:
      "The municipal governance Act, the Building Bye-laws 2003 (as amended in May 2026 for each City Corporation), and the February 2025 property-record order govern plan sanction and occupancy certificates.",
  },
  {
    slug: "fire-safety",
    topicId: "fire_safety",
    title: "Fire safety",
    summary:
      "Fire driveways, exits, staircases, refuge areas, Fire Force clearance, rainwater harvesting, and solar norms.",
    parameterKinds: [],
    zoningGoverned: false,
    whyAppliesLine:
      "Building Bye-laws 2003 and master plan high-rise fire protection rules govern exits, fire driveways, and safety clearances.",
  },
  {
    slug: "definitions",
    topicId: "definitions",
    title: "Definitions",
    summary:
      "What the terms used in the building bye-laws, master plan zoning regulations, and governance Act mean.",
    parameterKinds: [],
    zoningGoverned: false,
    whyAppliesLine:
      "Each instrument defines the terms used within it; where a zoning parameter is governed by the master plan under Bye-law 1.4, the master plan definition applies to that parameter.",
  },
];

const EXTRA_TOPIC_SUBJECTS: Record<string, CodeSubjectMeta> = {
  plot_size_frontage: {
    slug: "plot-size-and-frontage",
    topicId: "plot_size_frontage",
    title: "Plot size and frontage",
    summary:
      "Minimum plot area, frontage, and subdivision rules for residential, commercial, and group development sites.",
    parameterKinds: [],
    zoningGoverned: true,
    whyAppliesLine:
      "Bye-law 1.4 hands plot size and frontage thresholds for development to the master plan zoning regulations.",
  },
  road_width: {
    slug: "road-width",
    topicId: "road_width",
    title: "Road width and access",
    summary:
      "How road width is measured, minimum road widths for apartments and commercial buildings, and intersection splays.",
    parameterKinds: [],
    zoningGoverned: true,
    whyAppliesLine:
      "Master plan zoning regulations and building bye-laws govern road width measurement and access requirements.",
  },
  deviations_regularisation: {
    slug: "deviations-and-compounding",
    topicId: "deviations_regularisation",
    title: "Deviations and compounding",
    summary:
      "Condonable limits of construction deviation and compounding fee schedules under the May 2026 City Corporation amendments.",
    parameterKinds: [],
    zoningGoverned: false,
    whyAppliesLine:
      "The May 2026 City Corporation Building (Amendment) Bye-laws set maximum condonable deviation limits and compounding fee tables inside each corporation.",
  },
};

export function resolveCodeSubject(
  slugOrTopicId: string,
  fallbackTopics?: ReadonlyArray<TopicDefinition>
): CodeSubjectMeta | null {
  const direct = CODE_SUBJECTS.find(
    (s) => s.slug === slugOrTopicId || s.topicId === slugOrTopicId
  );
  if (direct) return direct;

  const extra = Object.values(EXTRA_TOPIC_SUBJECTS).find(
    (s) => s.slug === slugOrTopicId || s.topicId === slugOrTopicId
  );
  if (extra) return extra;

  const foundTopic = fallbackTopics?.find((t) => t.id === slugOrTopicId);
  if (foundTopic) {
    return {
      slug: foundTopic.id.replace(/_/g, "-"),
      topicId: foundTopic.id,
      title: foundTopic.label,
      summary: foundTopic.description,
      parameterKinds: [],
      zoningGoverned: false,
      whyAppliesLine:
        "Governed by the in-force master plan zoning regulations and municipal building bye-laws.",
    };
  }
  return null;
}

const ZONING_AFFECTED_SUBJECT_SLUGS = new Set([
  "land-use",
  "ground-coverage",
  "far",
  "setbacks",
  "height",
  "parking",
  "basements-and-stilts",
  "projections-and-open-spaces",
  "plot-size-and-frontage",
  "road-width",
]);

export function getRelevantGapNoteForSubject(
  subjectSlug: string,
  declarations?: JurisdictionDeclarations | null
): string | null {
  const subj = resolveCodeSubject(subjectSlug);
  const canonicalSlug = subj?.slug ?? subjectSlug;
  if (!ZONING_AFFECTED_SUBJECT_SLUGS.has(canonicalSlug)) {
    return null;
  }
  const hasMissingJuly2025 =
    !declarations ||
    (declarations.unobtainable_documents ?? []).some(
      (u) =>
        u.id.includes("2025-07") ||
        u.title.toLowerCase().includes("july 2025")
    ) ||
    (declarations.known_gaps ?? []).some((g) =>
      g.description.toLowerCase().includes("july 2025")
    );

  if (!hasMissingJuly2025) {
    return null;
  }
  return "A Karnataka Gazette zoning amendment dated 18 July 2025 (referenced in later notifications) has not yet been obtained from official archives. Rules shown here reflect the 2007 Zoning Regulations and all obtained amendments through January 2026.";
}

export function formatLandUseZoneGapPlainLine(
  partialZoneAreaName?: string | null
): string {
  const areaLabel = (partialZoneAreaName || "")
    .replace(/\s*City Corporation\s*/i, "")
    .trim();
  if (areaLabel) {
    return `Land-use zones are available for parts of ${areaLabel} only. Elsewhere the map shows boundaries and wards.`;
  }
  return "Land-use zones are available for processed map sheets only. Elsewhere the map shows boundaries and wards.";
}

export function formatMapZoneAccuracyPlainLine(
  roadMedianOffsetM: number | null | undefined,
  roadP90OffsetM: number | null | undefined
): string | null {
  if (
    typeof roadMedianOffsetM !== "number" ||
    Number.isNaN(roadMedianOffsetM) ||
    roadMedianOffsetM <= 0 ||
    typeof roadP90OffsetM !== "number" ||
    Number.isNaN(roadP90OffsetM) ||
    roadP90OffsetM <= 0
  ) {
    return null;
  }
  const medianRounded = Math.max(1, Math.round(roadMedianOffsetM));
  const p90Rounded = Math.max(1, Math.round(roadP90OffsetM));
  return `Zone boundaries are approximate: typically about ${medianRounded} m from street centre-lines, and within about ${p90Rounded} m in 9 out of 10 places.`;
}

export function formatMapSheetFitErrorDetail(
  gridFitRmseM: number | null | undefined,
  looRmseM?: number | null
): string | null {
  if (
    typeof gridFitRmseM !== "number" ||
    Number.isNaN(gridFitRmseM) ||
    gridFitRmseM < 0
  ) {
    return null;
  }
  const looPart =
    typeof looRmseM === "number" && !Number.isNaN(looRmseM)
      ? ` (${looRmseM} m leave-one-out cross-validation)`
      : "";
  return `Sheet-fitting error (how closely the printed UTM grid crosshairs on the scanned PDF fit the coordinate grid, not positional accuracy on the ground): ${gridFitRmseM} m RMSE${looPart}.`;
}

const ZONE_CODE_PLAIN_LABELS: Record<string, string> = {
  "R-MAIN": "Residential (Main)",
  "R-MIX": "Residential (Mixed)",
  "C-CENTRAL": "Commercial (Central)",
  "C-BIZ": "Commercial (Business)",
  "C-AXES": "Mutation Corridors",
  "I-GEN": "Industrial (General)",
  "I-HITECH": "Industrial (Hi-Tech)",
  PSP: "Public and semi-public",
  "T-TRANS": "Traffic and transportation",
  "DEV-PLAN-RES": "Residential development plan",
  "DEV-PLAN-NONRES": "Non-residential development plan and flatted industries",
  "INTEGRATED-TOWNSHIP": "Integrated township",
};

const AREA_CLASS_PLAIN_LABELS: Record<string, string> = {
  intensely_developed: "Intensely developed area (Area A)",
  moderately_developed: "Moderately developed area (Area B)",
  sparsely_developed: "Sparsely developed area (Area C)",
  ring_i: "Ring I",
  ring_ii: "Ring II",
  ring_iii: "Ring III",
};

const USE_PLAIN_LABELS: Record<string, string> = {
  residential: "Residential",
  commercial: "Commercial",
  industrial: "Industrial",
  public_semi_public: "Public and semi-public",
  traffic_transportation: "Traffic and transportation",
  residential_development_plan: "Residential development plan",
  non_residential_development_plan:
    "Non-residential development plan and flatted industries",
  integrated_township: "Integrated township",
  multi_dwelling_units: "Multi-dwelling units",
  star_hotels: "Star hotels",
  lodging_hotels: "Lodging establishments, hotels and tourist homes",
  office_buildings_non_residential_dp:
    "Office buildings in non-residential development plan",
  office_buildings: "Office buildings",
  retail_business: "Retail business (shops, shopping complexes, malls)",
  multiplex_shopping: "Multiplex integrated with shopping",
  restaurants: "Restaurants and food establishments",
  industrial_buildings: "Industrial buildings",
  theaters_auditoriums: "Theatres and auditoriums",
  wholesale_warehouse: "Wholesale and warehouse buildings",
  hostels: "Hostels",
  nursing_homes: "Nursing homes",
  hospitals: "Hospitals",
  kalyana_mantaps: "Kalyana mantaps and convention centres",
  recreational_clubs: "Recreational clubs",
  educational_buildings: "Educational buildings",
  other_public_semi_public: "Other public and semi-public buildings",
};

export const PARAMETER_PLAIN_LABELS: Record<
  ParameterRecord["parameter"],
  string
> = {
  ground_coverage_max_pct: "Maximum ground coverage",
  far_base_max: "Base FAR",
  far_premium_additional_max: "Premium FAR (additional)",
  tdr_receivable_max: "Transferable development rights (TDR)",
  setback_front_min_m: "Front setback",
  setback_rear_min_m: "Rear setback",
  setback_side_min_m: "Side setback",
  building_height_max_m: "Maximum building height",
  floors_max: "Maximum floors",
  parking_requirement: "Parking requirement",
};

function formatNumberPlain(n: number): string {
  if (Number.isInteger(n)) {
    return n.toLocaleString("en-IN");
  }
  return Number(n.toFixed(2)).toLocaleString("en-IN");
}

export function formatNumericIntervalPlain(
  interval: NumericInterval | null | undefined,
  nounPrefix: string,
  unit: string
): string | null {
  if (!interval) return null;
  const { min, max, min_inclusive, max_inclusive } = interval;
  if ((min === null || min === undefined) && max !== null && max !== undefined) {
    const verb = max_inclusive === false ? "below" : "up to";
    return `${nounPrefix} ${verb} ${formatNumberPlain(max)} ${unit}`;
  }
  if (min !== null && min !== undefined && max !== null && max !== undefined) {
    const lowWord = min_inclusive ? "from" : "above";
    const highWord =
      max_inclusive === false ? "below" : min_inclusive ? "to" : "up to";
    return `${nounPrefix} ${lowWord} ${formatNumberPlain(min)} ${highWord} ${formatNumberPlain(max)} ${unit}`;
  }
  if (min !== null && min !== undefined && (max === null || max === undefined)) {
    if (min_inclusive) {
      return `${nounPrefix} ${formatNumberPlain(min)} ${unit} and above`;
    }
    return `${nounPrefix} above ${formatNumberPlain(min)} ${unit}`;
  }
  return null;
}

export function cleanTableRowHeader(rawHeader: string | null | undefined): string {
  if (!rawHeader) return "";
  const parts = rawHeader
    .split("|")
    .map((p) => p.trim())
    .filter(Boolean);
  const withoutIndex =
    parts.length > 1 && /^\d+\.?$/.test(parts[0]) ? parts.slice(1) : parts;
  return formatPlainQuantity(withoutIndex.join(" — "));
}

export function formatParameterConditionsPlain(
  conditions: ParameterConditions | null | undefined,
  record?: Pick<ParameterRecord, "parameter" | "source">
): string {
  if (!conditions) return "All plots in scope";
  const parts: string[] = [];

  if (conditions.zone && conditions.zone.length > 0) {
    const zLabels = conditions.zone.map(
      (z) => ZONE_CODE_PLAIN_LABELS[z] ?? z
    );
    parts.push(zLabels.join(", "));
  } else if (conditions.use && conditions.use.length > 0) {
    const uLabels = conditions.use.map(
      (u) => USE_PLAIN_LABELS[u.toLowerCase()] ?? u
    );
    parts.push(uLabels.join(", "));
  }

  if (conditions.area_class && conditions.area_class.length > 0) {
    const aLabels = conditions.area_class.map(
      (a) => AREA_CLASS_PLAIN_LABELS[a] ?? a
    );
    parts.push(aLabels.join(", "));
  }

  const plotStr = formatNumericIntervalPlain(
    conditions.plot_area_m2,
    parts.length === 0 ? "Plots" : "plots",
    "m²"
  );
  if (plotStr) parts.push(plotStr);

  const roadStr = formatNumericIntervalPlain(
    conditions.road_width_m,
    parts.length === 0 ? "Roads" : "roads",
    "m"
  );
  if (roadStr) parts.push(roadStr);

  const heightStr = formatNumericIntervalPlain(
    conditions.building_height_m,
    parts.length === 0 ? "Building height" : "building height",
    "m"
  );
  if (heightStr) parts.push(heightStr);

  const depthStr = formatNumericIntervalPlain(
    conditions.plot_depth_m,
    parts.length === 0 ? "Plot depth or width" : "plot depth or width",
    "m"
  );
  if (depthStr && !plotStr) {
    parts.push(depthStr);
  }

  if (record?.parameter === "parking_requirement" && record.source?.row_header) {
    const cat = cleanTableRowHeader(record.source.row_header);
    if (cat) {
      return cat;
    }
  }

  if (parts.length === 0 && record?.source?.row_header) {
    const cleaned = cleanTableRowHeader(record.source.row_header);
    if (cleaned) return cleaned;
  }

  return parts.length > 0 ? parts.join(", ") : "General rule";
}

export function isPlausibleParameterValue(
  parameter: ParameterRecord["parameter"],
  value: number | string | null | undefined,
  unit?: string | null,
  conditions?: ParameterConditions | null
): boolean {
  if (value === null || value === undefined) return false;

  if (conditions?.plot_area_m2) {
    const { min, max } = conditions.plot_area_m2;
    if (typeof min === "number" && min > 0 && min < MIN_PLAUSIBLE_PLOT_AREA_M2) {
      return false;
    }
    if (typeof max === "number" && max > 0 && max < MIN_PLAUSIBLE_PLOT_AREA_M2) {
      return false;
    }
  }

  if (parameter === "parking_requirement") {
    if (typeof value === "number") {
      return value >= PARKING_M2_BOUNDS[0] && value <= PARKING_M2_BOUNDS[1];
    }
    return typeof value === "string" && value.trim().length > 0;
  }

  if (typeof value !== "number" || Number.isNaN(value)) {
    return false;
  }

  if (
    (parameter === "setback_front_min_m" ||
      parameter === "setback_rear_min_m" ||
      parameter === "setback_side_min_m") &&
    (unit === "pct_of_plot_depth" || unit === "pct_of_plot_width" || unit === "%")
  ) {
    return value >= SETBACK_PCT_BOUNDS[0] && value <= SETBACK_PCT_BOUNDS[1];
  }

  const bounds = PLAUSIBILITY_BOUNDS[parameter];
  if (!bounds) return true;
  return value >= bounds[0] && value <= bounds[1];
}

export function isPlausibleParameterRecord(record: ParameterRecord): boolean {
  return isPlausibleParameterValue(
    record.parameter,
    record.value,
    record.unit,
    record.conditions
  );
}

export function formatParameterValuePlain(record: ParameterRecord): string {
  const { parameter, value, unit, value_text } = record;
  if (parameter === "parking_requirement") {
    if (typeof value === "number" && unit === "m2_per_car_space") {
      return `1 car space per ${formatNumberPlain(value)} m² of floor area`;
    }
    return formatPlainQuantity(String(value_text || value || "").trim());
  }

  if (typeof value !== "number") {
    return formatPlainQuantity(String(value_text || value || "").trim());
  }

  if (parameter === "ground_coverage_max_pct") {
    return `${formatNumberPlain(value)}%`;
  }
  if (parameter === "far_base_max") {
    return formatNumberPlain(value);
  }
  if (parameter === "far_premium_additional_max") {
    if (unit === "multiple_of_base_far") {
      return `${Math.round(value * 100)}% of base FAR (${formatNumberPlain(value)}×)`;
    }
    return formatNumberPlain(value);
  }
  if (parameter === "tdr_receivable_max") {
    if (value === 0) return "None (0)";
    if (unit === "multiple_of_base_far") {
      return `${Math.round(value * 100)}% of base FAR (${formatNumberPlain(value)}×)`;
    }
    return formatNumberPlain(value);
  }
  if (
    parameter === "setback_front_min_m" ||
    parameter === "setback_rear_min_m" ||
    parameter === "setback_side_min_m"
  ) {
    if (unit === "pct_of_plot_depth") {
      return `${formatNumberPlain(value)}% of plot depth`;
    }
    if (unit === "pct_of_plot_width") {
      return `${formatNumberPlain(value)}% of plot width`;
    }
    if (value === 0) {
      return "0 m";
    }
    if (value_text.toLowerCase().includes("on any one side")) {
      return `${formatNumberPlain(value)} m (on one side)`;
    }
    return `${formatNumberPlain(value)} m`;
  }
  if (parameter === "building_height_max_m") {
    return `${formatNumberPlain(value)} m`;
  }
  if (parameter === "floors_max") {
    return `${formatNumberPlain(value)} floors`;
  }
  return `${formatNumberPlain(value)}${unit ? ` ${unit}` : ""}`;
}

function toTitleCaseIfScreaming(title: string): string {
  const letters = title.replace(/[^a-zA-Z]/g, "");
  if (!letters) return title;
  const upperCount = title.replace(/[^A-Z]/g, "").length;
  if (upperCount / letters.length < 0.7) {
    return title;
  }
  const keepUpper = new Set(["FAR", "TDR", "DRC", "NOC", "RMP", "I", "II", "III", "IV"]);
  return title
    .split(/\s+/)
    .map((word) => {
      const clean = word.replace(/[^a-zA-Z0-9]/g, "");
      if (keepUpper.has(clean.toUpperCase())) {
        return word.toUpperCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}

export function formatPlainDocumentTitle(
  doc:
    | (Pick<DocumentMetadata, "doc_id" | "title"> & {
        plain_title?: string | null;
      })
    | null
    | undefined,
  fallbackId?: string
): string {
  if (doc?.plain_title && doc.plain_title.trim().length > 0) {
    return doc.plain_title.trim();
  }
  if (doc?.title) {
    return toTitleCaseIfScreaming(doc.title.trim());
  }
  if (fallbackId) {
    return fallbackId;
  }
  return "Official regulation";
}

export function formatPlainWhatChangedSummary(
  doc: Pick<
    DocumentMetadata,
    | "doc_id"
    | "title"
    | "instrument_type"
    | "legal_status"
    | "layer"
    | "role"
    | "summary_by_site"
  > & {
    status_evidence?: { description?: string | null };
  }
): string {
  if (doc.summary_by_site && doc.summary_by_site.trim().length > 0) {
    return formatPlainQuantity(doc.summary_by_site.trim());
  }
  if (
    doc.status_evidence?.description &&
    doc.status_evidence.description.trim().length > 0
  ) {
    return formatPlainQuantity(doc.status_evidence.description.trim());
  }
  if (doc.legal_status === "draft") {
    return "Draft notification published for public objection; not in force.";
  }
  if (doc.role === "amendment" && doc.layer === "planning") {
    return "Amends the master plan zoning regulations and development control tables.";
  }
  if (doc.role === "amendment" && doc.layer === "municipal") {
    return "Amends the municipal building bye-laws, plan sanction rules, and compounding schedules.";
  }
  if (doc.layer === "statute") {
    return "Enacts municipal governance, building regulation, and licensing authority.";
  }
  if (doc.layer === "orders") {
    return "Sets administrative rules for property records and building plan approval.";
  }
  if (doc.layer === "planning") {
    return "Sets zone-by-zone permissible land uses, base FAR, ground coverage, setbacks, height, and parking tables.";
  }
  if (doc.layer === "municipal") {
    return "Establishes municipal building plan sanction, occupancy certificate, structural, fire, and building envelope rules.";
  }
  return "Official instrument in the building code source register.";
}

export function computeHeroDocumentAndBodyCounts(
  documents: ReadonlyArray<DocumentMetadata>
): { documentCount: number; bodyCount: number } {
  const inForceDocs = documents.filter(
    (d) =>
      d.legal_status === "in_force" &&
      d.acquisition_status !== "not_found" &&
      d.applies_to_jurisdiction?.status !== "no" &&
      (d.instrument_type ?? "instrument") !== "map" &&
      (d.instrument_type ?? "instrument") !== "compilation"
  );

  const normalizedBodies = new Set<string>();
  for (const d of inForceDocs) {
    const raw = (d.issuing_authority || "").trim();
    if (!raw) continue;
    const primaryPart = raw
      .split(/[/,]/)
      .map((s) => s.trim().toLowerCase())
      .find(Boolean);
    if (primaryPart) {
      normalizedBodies.add(primaryPart);
    }
  }

  return {
    documentCount: inForceDocs.length,
    bodyCount: normalizedBodies.size,
  };
}

export function formatHumanDate(isoDate: string | null | undefined): string {
  if (!isoDate) return "Date not recorded";
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(isoDate.trim());
  if (!m) return isoDate;
  const year = m[1];
  const monthIdx = Number(m[2]) - 1;
  const day = Number(m[3]);
  const monthName = MONTH_NAMES[monthIdx];
  if (!monthName || Number.isNaN(day)) return isoDate;
  return `${day} ${monthName} ${year}`;
}

export function formatMonthYearPlain(isoDate: string | null | undefined): string {
  if (!isoDate) return "Amended";
  const m = /^(\d{4})-(\d{2})/.exec(isoDate.trim());
  if (!m) return isoDate;
  const year = m[1];
  const monthIdx = Number(m[2]) - 1;
  const monthName = MONTH_NAMES[monthIdx];
  if (!monthName) return year;
  return `${monthName} ${year}`;
}

export function formatReplacedByPlain(
  doc:
    | (Pick<
        DocumentMetadata,
        "doc_id" | "title" | "effective_from" | "notified_date"
      > & {
        plain_title?: string | null;
      })
    | null
    | undefined,
  fallbackDate?: string | null
): string {
  const plainName = formatPlainDocumentTitle(doc);
  const dt = doc?.effective_from || doc?.notified_date || fallbackDate;
  const humanDate = dt ? formatHumanDate(dt) : null;
  return humanDate
    ? `Replaced by ${plainName}, ${humanDate}`
    : `Replaced by ${plainName}`;
}

export interface SubjectBandContinuitySource {
  docId: string;
  docTitle: string;
  date: string;
  page: number;
  pageLink: string;
  ruleSummary: string;
}

export interface SubjectBandContinuityNotice {
  id: string;
  kind: "overlap" | "gap";
  headline: string;
  explanation: string;
  sourceA: SubjectBandContinuitySource;
  sourceB: SubjectBandContinuitySource;
}

export function computeSubjectBandContinuityNotices(
  subjectSlug: string,
  records: ReadonlyArray<ParameterRecord>,
  docMetaById: ReadonlyMap<
    string,
    Pick<
      DocumentMetadata,
      "doc_id" | "title" | "effective_from" | "notified_date"
    >
  >,
  applicabilityRules?: ReadonlyArray<{
    dimension?: string | null;
    range_settled?: string | null;
  }> | null
): SubjectBandContinuityNotice[] {
  const notices: SubjectBandContinuityNotice[] = [];
  if (subjectSlug === "setbacks" || subjectSlug === "height") {
    const settledByApplicability =
      applicabilityRules !== undefined && applicabilityRules !== null
        ? applicabilityRules.some(
            (ar) =>
              ar.dimension === "building_height_m" &&
              ar.range_settled === "11.5 m to 12 m"
          )
        : records.some((r) =>
            (r.note ?? "").includes("clauses 3.1(ii) and (iii)")
          );

    const lowRiseRec = records.find(
      (r) =>
        r.legal_status === "in_force" &&
        !r.valid_to &&
        r.conditions.building_height_m?.max === 12.0 &&
        (r.conditions.building_height_m?.min === null ||
          r.conditions.building_height_m?.min === undefined)
    );
    const highRiseRec = records.find(
      (r) =>
        r.legal_status === "in_force" &&
        !r.valid_to &&
        r.conditions.building_height_m?.min === 11.5
    );
    if (lowRiseRec && highRiseRec && !settledByApplicability) {
      const docA = docMetaById.get(lowRiseRec.source.doc_id);
      const docB = docMetaById.get(highRiseRec.source.doc_id);
      notices.push({
        id: "setback-height-band-overlap-11.5-12",
        kind: "overlap",
        headline:
          "Not settled: two rules apply — The current tables overlap between 11.5 m and 12 m.",
        explanation:
          "The January 2026 setback table (Table 8) covers buildings with total height up to 12 m, while the 2007 taller-building setback table (Table 9), still in force, starts above 11.5 m. Neither number has been adjusted here.",
        sourceA: {
          docId: lowRiseRec.source.doc_id,
          docTitle: formatPlainDocumentTitle(docA, lowRiseRec.source.doc_id),
          date: formatHumanDate(
            docA?.effective_from ||
              docA?.notified_date ||
              lowRiseRec.valid_from
          ),
          page: lowRiseRec.source.page,
          pageLink: lowRiseRec.source.page_link,
          ruleSummary:
            "Table 8 sets setbacks for buildings up to 12 m in height (excluding stilt floor).",
        },
        sourceB: {
          docId: highRiseRec.source.doc_id,
          docTitle: formatPlainDocumentTitle(docB, highRiseRec.source.doc_id),
          date: formatHumanDate(
            docB?.effective_from ||
              docB?.notified_date ||
              highRiseRec.valid_from
          ),
          page: highRiseRec.source.page,
          pageLink: highRiseRec.source.page_link,
          ruleSummary:
            "Table 9 row 1 sets a 5 m setback on all sides for buildings above 11.5 m up to 15 m in height.",
        },
      });
    }
  }
  return notices;
}

export function formatPlainInstrumentStatus(
  doc: Pick<
    DocumentMetadata,
    | "instrument_type"
    | "legal_status"
    | "effective_from"
    | "notified_date"
    | "superseded_by_document"
    | "acquisition_status"
  >
): string {
  const iType = doc.instrument_type ?? "instrument";
  if (iType === "compilation") {
    return "Unofficial compilation";
  }
  if (iType === "map") {
    return "Reference map";
  }
  if (iType === "bill") {
    return "Bill, not yet law";
  }
  if (doc.acquisition_status === "not_found") {
    return "Not yet obtained";
  }
  if (doc.superseded_by_document || doc.legal_status === "superseded") {
    return "Replaced";
  }
  if (doc.legal_status === "draft") {
    return "Draft, not in force";
  }
  if (doc.legal_status === "withdrawn") {
    return "Withdrawn";
  }
  if (doc.legal_status === "status_unknown") {
    return "Status not confirmed";
  }
  const eff = doc.effective_from || doc.notified_date;
  if (eff) {
    return `In force since ${formatHumanDate(eff)}`;
  }
  return "In force";
}

export function formatPlainInstrumentType(
  doc: Pick<DocumentMetadata, "instrument_type" | "role" | "layer">
): string {
  const iType = doc.instrument_type ?? "instrument";
  if (iType === "compilation") return "Compilation";
  if (iType === "map") return "Map";
  if (iType === "bill") return "Bill";
  if (iType === "order" || doc.layer === "orders") return "Order";
  if (doc.layer === "statute") return "Act";
  if (doc.role === "amendment") return "Amendment";
  if (doc.layer === "state_rules") return "Notification";
  return "Regulation";
}

export function isDocumentTextHeld(
  doc: Pick<
    DocumentMetadata,
    "acquisition_status" | "text_rights" | "instrument_type"
  > & {
    structured?: boolean;
    clauses_count?: number;
  }
): boolean {
  if (doc.structured === false) return false;
  const iType = doc.instrument_type ?? "instrument";
  if (iType === "compilation" || iType === "map" || iType === "bill") {
    return false;
  }
  if (doc.acquisition_status && doc.acquisition_status !== "acquired") {
    return false;
  }
  if (doc.text_rights?.mode === "reference_only") return false;
  if (typeof doc.clauses_count === "number" && doc.clauses_count <= 0) {
    return false;
  }
  return true;
}

export function formatPlainLayerLabel(layer: string | null | undefined): string {
  switch (layer) {
    case "planning":
      return "Master plan zoning regulations";
    case "municipal":
      return "Municipal building bye-laws";
    case "state_rules":
      return "State rules and notifications";
    case "statute":
      return "State Act";
    case "orders":
      return "Government order";
    case "national_code":
      return "National code reference";
    case "aviation":
      return "Aviation height reference";
    default:
      return "Regulation";
  }
}

export function formatPlainQuantity(raw: string): string {
  return raw
    .replace(/\bsq_m\b/gi, "m²")
    .replace(/\bsq\.?\s*m(?:trs?\.?|ts?\.?)?\b/gi, "m²")
    .replace(/\b(\d+(?:\.\d+)?)sqm\b/gi, "$1 m²")
    .replace(/\bm2\b/gi, "m²")
    .replace(/\bsq_ft\b/gi, "sq ft")
    .replace(/\bpercent\b/gi, "%")
    .replace(/\bpct\b/gi, "%")
    .replace(/\bmtrs?\.?\b/gi, "m");
}

export function sortDocumentsMostRecentFirst<
  T extends Pick<DocumentMetadata, "effective_from" | "notified_date" | "doc_id">
>(docs: ReadonlyArray<T>): T[] {
  return [...docs].sort((a, b) => {
    const dateA = a.effective_from || a.notified_date || "0000-00-00";
    const dateB = b.effective_from || b.notified_date || "0000-00-00";
    return dateB.localeCompare(dateA) || a.doc_id.localeCompare(b.doc_id);
  });
}

export function truncateAtWordBoundary(text: string, maxChars: number): string {
  const cleaned = text.trim();
  if (cleaned.length <= maxChars) return cleaned;
  const slice = cleaned.slice(0, maxChars);
  const lastSpace = slice.lastIndexOf(" ");
  if (lastSpace > maxChars * 0.6) {
    return `${slice.slice(0, lastSpace).replace(/[,;:\-–—]+$/, "")}…`;
  }
  return `${slice}…`;
}
