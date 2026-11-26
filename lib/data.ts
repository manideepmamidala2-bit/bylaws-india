/**
 * Centralized data client for published building bylaws datasets.
 *
 * Types are generated from `schemas/*.schema.json` into `lib/types/generated.ts`
 * and re-exported here with typed loaders for every published artifact.
 */

import type {
  AmendmentEffect,
  AmendmentLink,
  AnnotationEntry,
  AnnotationTarget,
  ClauseChangeMark,
  ClauseCitation,
  ClauseNode as GeneratedClauseNode,
  ClauseOutlineEntry,
  ClauseTable,
  ClauseTree as ClauseTreeDocument,
  ClauseZoneTagEntry,
  ConsolidatedClauseRecord,
  ConsolidatedClauseTable,
  ConsolidatedDocumentManifest,
  ConsolidatedSnapshotRef,
  ContestedStatus,
  DocumentAnnotations,
  DocumentApplicability,
  DocumentCitedProvision,
  DocumentCopy,
  DocumentMetadata,
  DocumentStatusEvidence,
  DocumentTextRights,
  GeoLayerEntry,
  JurisdictionAmendments,
  JurisdictionClauseZoneTags,
  JurisdictionConsolidated,
  JurisdictionDeclarations,
  JurisdictionGeoLayers,
  JurisdictionManifest as JurisdictionSummary,
  JurisdictionParameters,
  JurisdictionRelations,
  KnownGap,
  NodeVersion,
  NumericInterval,
  OcrCorrection,
  ParameterConditions,
  ParameterRecord,
  ParameterSource,
  RelationEntry,
  ReleaseDrafts,
  ReleaseEntry,
  ReleaseFiles,
  ReleaseManifest,
  ResolutionAuthority,
  ResolutionStep,
  StatutoryResolutionConfig,
  SuccessionEntry,
  TableColumnHeader,
  TableFootnote,
  TableMeta,
  TopicDefinition,
  UnconsolidatedClauseRecord,
  UnobtainableDocument,
  UnreadDocument,
  ZoneFeature,
  ZoneFeatureProperties,
  ZoneGeometry,
  ZonesFeatureCollection,
} from "@/lib/types/generated";

export type {
  AmendmentEffect,
  AmendmentLink,
  AnnotationEntry,
  AnnotationTarget,
  ClauseChangeMark,
  ClauseCitation,
  ClauseOutlineEntry,
  ClauseTable,
  ClauseTreeDocument,
  ClauseZoneTagEntry,
  ConsolidatedClauseRecord,
  ConsolidatedClauseTable,
  ConsolidatedDocumentManifest,
  ConsolidatedSnapshotRef,
  ContestedStatus,
  DocumentAnnotations,
  DocumentApplicability,
  DocumentCitedProvision,
  DocumentCopy,
  DocumentMetadata,
  DocumentStatusEvidence,
  DocumentTextRights,
  GeoLayerEntry,
  JurisdictionAmendments,
  JurisdictionClauseZoneTags,
  JurisdictionConsolidated,
  JurisdictionDeclarations,
  JurisdictionGeoLayers,
  JurisdictionParameters,
  JurisdictionRelations,
  JurisdictionSummary,
  KnownGap,
  NodeVersion,
  NumericInterval,
  OcrCorrection,
  ParameterConditions,
  ParameterRecord,
  ParameterSource,
  RelationEntry,
  ReleaseDrafts,
  ReleaseEntry,
  ReleaseFiles,
  ReleaseManifest,
  ResolutionAuthority,
  ResolutionStep,
  StatutoryResolutionConfig,
  SuccessionEntry,
  TableColumnHeader,
  TableFootnote,
  TableMeta,
  TopicDefinition,
  UnconsolidatedClauseRecord,
  UnobtainableDocument,
  UnreadDocument,
  ZoneFeature,
  ZoneFeatureProperties,
  ZoneGeometry,
  ZonesFeatureCollection,
};

export type LegalStatus = GeneratedClauseNode["legal_status"];
export type DisplayLegalStatus = LegalStatus | "status_unknown";
export type VerificationStatus = ZoneFeatureProperties["verification"];

export interface GenericGeoJSONFeature {
  type: "Feature";
  id?: string | number;
  properties: Record<string, unknown>;
  geometry: ZoneGeometry;
}

export interface GenericFeatureCollection {
  type: "FeatureCollection";
  features: GenericGeoJSONFeature[];
}

/**
 * ClauseNode with optional UI-hydrated document metadata and defensive null tolerance.
 */
export type ClauseNode = Omit<GeneratedClauseNode, "legal_status" | "citations"> & {
  legal_status?: LegalStatus | null;
  citations?: ClauseCitation[];
  source_url?: string;
  official_url?: string | null;
  archive_url?: string | null;
  doc_id?: string;
  doc_title?: string;
  doc_layer?: DocumentMetadata["layer"];
};

export interface JurisdictionDatasetBundle {
  jurisdiction: JurisdictionSummary;
  release: ReleaseEntry | null;
  documents: DocumentMetadata[];
  clauseTrees: ClauseTreeDocument[];
  draftClauseTrees: ClauseTreeDocument[];
  annotationsByDocId: Record<string, AnnotationEntry[]>;
  clauses: ClauseNode[];
  amendments: JurisdictionAmendments;
  consolidated: JurisdictionConsolidated | null;
  zones: ZonesFeatureCollection;
  boundary: GenericFeatureCollection;
  gbaZones: GenericFeatureCollection | null;
  wards: GenericFeatureCollection | null;
  planningDistricts: GenericFeatureCollection | null;
  overlays: GenericFeatureCollection | null;
  geoLayers: JurisdictionGeoLayers | null;
  clauseZoneTags: JurisdictionClauseZoneTags | null;
  relations: JurisdictionRelations | null;
  declarations: JurisdictionDeclarations;
}

const DEFAULT_DATA_BASE_URL = "/data";

export function getDataBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_DATA_BASE_URL?.trim();
  if (configured && configured.length > 0) {
    return configured.replace(/\/+$/, "");
  }
  return DEFAULT_DATA_BASE_URL;
}

export function getManifestUrl(): string {
  const explicitManifest = process.env.NEXT_PUBLIC_MANIFEST_URL?.trim();
  if (explicitManifest && explicitManifest.length > 0) {
    return explicitManifest;
  }
  return `${getDataBaseUrl()}/manifest.json`;
}

/**
 * Server-only environment check for including `visibility: "test"` jurisdictions.
 * False unless `SHOW_TEST_JURISDICTIONS` is explicitly set to `"true"` or `"1"`.
 */
export function shouldShowTestJurisdictions(): boolean {
  const flag = process.env.SHOW_TEST_JURISDICTIONS?.trim().toLowerCase();
  return flag === "true" || flag === "1";
}

export function isProductionEnvironment(): boolean {
  return !shouldShowTestJurisdictions();
}

export function isWithdrawnRelease(release: ReleaseEntry): boolean {
  return release.status === "withdrawn" || !release.files;
}

/**
 * Return visible jurisdictions from the manifest.
 * Excludes `visibility: "test"` jurisdictions unless `SHOW_TEST_JURISDICTIONS` is enabled,
 * and orders `visibility: "public"` jurisdictions first.
 */
export function getVisibleJurisdictions(
  manifest: ReleaseManifest
): JurisdictionSummary[] {
  const showTest = shouldShowTestJurisdictions();
  const filtered = manifest.jurisdictions.filter((item) =>
    showTest ? true : item.visibility !== "test"
  );
  return [...filtered].sort((a, b) => {
    const aPub = a.visibility !== "test" ? 0 : 1;
    const bPub = b.visibility !== "test" ? 0 : 1;
    return aPub - bPub;
  });
}

export function getPrimaryPublicJurisdiction(
  manifest: ReleaseManifest
): JurisdictionSummary | undefined {
  const visible = getVisibleJurisdictions(manifest);
  return (
    visible.find(
      (j) =>
        j.visibility !== "test" &&
        j.releases.some((rel) => isWithdrawnRelease(rel)) &&
        Boolean(j.latest_release)
    ) ??
    visible.find((j) => j.visibility !== "test" && Boolean(j.latest_release)) ??
    visible[0]
  );
}

const LAYER_LABELS: Record<string, string> = {
  statute: "State Act",
  state_rules: "State model rules",
  planning: "Master plan zoning regulations",
  municipal: "Municipal building bye-laws",
  orders: "Government order",
  overlay: "Overlay & buffer rules",
  national_reference: "National reference standard",
  boundary: "Official boundary map",
};

export function formatLayerLabel(layer?: string | null): string {
  if (!layer) return "Regulation";
  return LAYER_LABELS[layer] ?? layer.replace(/_/g, " ");
}

export function formatInstrumentTypeLabel(
  instrumentType?: string | null,
  docType?: string | null,
  role?: string | null
): string {
  if (instrumentType === "compilation") return "Unofficial compilation";
  if (instrumentType === "map" || docType === "map") return "Map";
  if (instrumentType === "bill") return "Legislative bill";
  if (instrumentType === "order" || docType === "government_order") {
    return "Government order";
  }
  if (docType === "act") return "Act";
  if (docType === "bye_laws") return "Building bye-laws";
  if (docType === "regulations") return "Zoning regulations";
  if (docType === "amendment" || role === "amendment") return "Amendment notification";
  if (docType === "notification") return "Gazette notification";
  if (docType === "circular") return "Circular";
  return "Legal instrument";
}

export function formatPlainDocumentStatus(doc: {
  legal_status?: string | null;
  instrument_type?: string | null;
  doc_type?: string | null;
  role?: string | null;
  effective_from?: string | null;
  notified_date?: string | null;
  superseded_by_document?: string | null;
  applies_to_jurisdiction?: { status?: string | null } | null;
  acquisition_status?: string | null;
}): string {
  const instType =
    doc.instrument_type ??
    (doc.doc_type === "map" || doc.role === "boundary" ? "map" : "instrument");
  if (instType === "compilation") {
    return "Unofficial compilation (finding aid only)";
  }
  if (instType === "map") {
    return "Reference map";
  }
  if (instType === "bill") {
    return "Bill, not yet law";
  }
  if (doc.acquisition_status === "not_found") {
    return "Not yet obtained";
  }
  if (doc.applies_to_jurisdiction?.status === "no") {
    return "In force for municipalities; not applicable to City Corporations";
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
  const dt = doc.effective_from || doc.notified_date;
  if (doc.legal_status === "in_force") {
    return dt ? `In force since ${formatHumanDate(dt)}` : "In force";
  }
  return "Status not confirmed";
}

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

export function formatHumanDate(isoDate?: string | null): string {
  if (!isoDate) return "Date not recorded";
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate.trim());
  if (!m) return isoDate;
  const year = Number(m[1]);
  const monthIdx = Number(m[2]) - 1;
  const day = Number(m[3]);
  const monthName = MONTH_NAMES[monthIdx];
  if (!monthName) return isoDate;
  return `${day} ${monthName} ${year}`;
}

export function formatUnitLabel(unit?: string | null): string {
  if (!unit) return "";
  const map: Record<string, string> = {
    sq_m: "m²",
    "sq.m": "m²",
    "sq. m": "m²",
    m2: "m²",
    m: "m",
    mtrs: "m",
    pct: "%",
    "%": "%",
    ratio: "",
    floors: "floors",
    spaces_per_m2: "spaces per m²",
    spaces_per_dwelling: "spaces per dwelling",
    pct_of_plot_depth: "% of plot depth",
    pct_of_plot_width: "% of plot width",
    multiple_of_base_far: "× base FAR",
  };
  return map[unit] ?? unit.replace(/sq_m/g, "m²").replace(/_/g, " ");
}

export function filterManifestForServer(
  manifest: ReleaseManifest
): ReleaseManifest {
  return {
    ...manifest,
    jurisdictions: getVisibleJurisdictions(manifest),
  };
}

function isMockedGlobalFetch(): boolean {
  const fn = globalThis.fetch as unknown as Record<string, unknown> | undefined;
  return Boolean(fn && ("mock" in fn || "_isMockFunction" in fn));
}

const diskJsonCache = new Map<string, { mtimeMs: number; value: unknown }>();

export async function readPublishedJson<T>(
  webPath: string,
  customFetch?: typeof fetch
): Promise<T> {
  const forceNetwork = Boolean(customFetch) || isMockedGlobalFetch();

  if (
    !forceNetwork &&
    typeof process !== "undefined" &&
    typeof process.getBuiltinModule === "function"
  ) {
    const fs = process.getBuiltinModule(
      "fs/promises"
    ) as typeof import("fs/promises");
    const path = process.getBuiltinModule("path") as typeof import("path");
    let relativePath = webPath.replace(/^\/+/, "");
    if (webPath.startsWith("http://") || webPath.startsWith("https://")) {
      try {
        const parsedUrl = new URL(webPath);
        relativePath = parsedUrl.pathname.replace(/^\/+/, "");
      } catch {
        relativePath = "";
      }
    }
    if (relativePath) {
      const diskPath = path.join(process.cwd(), "public", relativePath);
      try {
        const stat = await fs.stat(diskPath);
        const cached = diskJsonCache.get(diskPath);
        if (cached && cached.mtimeMs === stat.mtimeMs) {
          return cached.value as T;
        }
        const rawText = await fs.readFile(diskPath, "utf8");
        const parsed = JSON.parse(rawText) as T;
        diskJsonCache.set(diskPath, { mtimeMs: stat.mtimeMs, value: parsed });
        return parsed;
      } catch {
        if (!webPath.startsWith("http://") && !webPath.startsWith("https://")) {
          throw new Error(`Failed to read local published JSON at ${diskPath}`);
        }
      }
    }
  }

  const fetchImpl = customFetch ?? fetch;
  const response = await fetchImpl(webPath, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${webPath} (HTTP ${response.status})`);
  }
  return (await response.json()) as T;
}

export async function fetchRawManifest(
  customFetch?: typeof fetch
): Promise<ReleaseManifest> {
  const url = getManifestUrl();
  return readPublishedJson<ReleaseManifest>(url, customFetch);
}

/**
 * Load the manifest on the server, already filtered so `visibility: "test"`
 * jurisdictions are removed unless `SHOW_TEST_JURISDICTIONS` is enabled.
 */
export async function fetchManifest(
  customFetch?: typeof fetch
): Promise<ReleaseManifest> {
  const raw = await fetchRawManifest(customFetch);
  return filterManifestForServer(raw);
}

export function findJurisdictionRelease(
  manifest: ReleaseManifest,
  jurisdictionId: string,
  version?: string
): { jurisdiction: JurisdictionSummary; release: ReleaseEntry | null } | null {
  const visible = getVisibleJurisdictions(manifest);
  const jurisdiction = visible.find((item) => item.id === jurisdictionId);
  if (!jurisdiction) {
    return null;
  }
  const publishedReleases = jurisdiction.releases.filter(
    (rel) => !isWithdrawnRelease(rel)
  );
  if (publishedReleases.length === 0) {
    return { jurisdiction, release: null };
  }
  const targetVersion = version ?? jurisdiction.latest_release;
  const release =
    (targetVersion
      ? publishedReleases.find((rel) => rel.version === targetVersion)
      : undefined) ??
    publishedReleases[publishedReleases.length - 1] ??
    publishedReleases[0] ??
    null;
  return { jurisdiction, release };
}

export async function fetchDocuments(
  jurisdictionId: string,
  version?: string
): Promise<DocumentMetadata[]> {
  const manifest = await fetchManifest();
  const found = findJurisdictionRelease(manifest, jurisdictionId, version);
  if (!found) {
    return [];
  }
  if (!found.release || !found.release.files) {
    if (found.jurisdiction.register_documents) {
      try {
        return await readPublishedJson<DocumentMetadata[]>(
          found.jurisdiction.register_documents
        );
      } catch {
        return [];
      }
    }
    return [];
  }
  return readPublishedJson<DocumentMetadata[]>(found.release.files.documents);
}

export async function fetchClauseTrees(
  jurisdictionId: string,
  options?: { includeDrafts?: boolean; version?: string }
): Promise<ClauseTreeDocument[]> {
  const manifest = await fetchManifest();
  const found = findJurisdictionRelease(
    manifest,
    jurisdictionId,
    options?.version
  );
  if (!found || !found.release || !found.release.files) {
    return [];
  }
  const paths = [
    ...found.release.files.clauses,
    ...(options?.includeDrafts && found.release.drafts
      ? found.release.drafts.clauses
      : []),
  ];
  return Promise.all(
    paths.map((p) => readPublishedJson<ClauseTreeDocument>(p))
  );
}

export async function fetchDocumentClauseTree(
  jurisdictionId: string,
  docId: string,
  version?: string
): Promise<ClauseTreeDocument | null> {
  const manifest = await fetchManifest();
  const found = findJurisdictionRelease(manifest, jurisdictionId, version);
  if (!found || !found.release || !found.release.files) {
    return null;
  }
  const allPaths = [
    ...found.release.files.clauses,
    ...(found.release.drafts ? found.release.drafts.clauses : []),
  ];
  const suffix = `/${docId}.clauses.json`;
  const matchedPath = allPaths.find((p) => p.endsWith(suffix));
  if (!matchedPath) {
    return null;
  }
  return readPublishedJson<ClauseTreeDocument>(matchedPath);
}

export async function fetchDocumentOutline(
  jurisdictionId: string,
  docId: string,
  version?: string
): Promise<ClauseTreeDocument | null> {
  const manifest = await fetchManifest();
  const found = findJurisdictionRelease(manifest, jurisdictionId, version);
  if (!found || !found.release || !found.release.files) {
    return null;
  }
  const outlinePaths = [
    ...(found.release.files.outlines ?? []),
    ...(found.release.drafts?.outlines ?? []),
  ];
  const suffix = `/${docId}.outline.json`;
  const matchedPath = outlinePaths.find((p) => p.endsWith(suffix));
  if (!matchedPath) {
    return null;
  }
  try {
    return await readPublishedJson<ClauseTreeDocument>(matchedPath);
  } catch {
    return null;
  }
}

export async function fetchParameters(
  jurisdictionId: string,
  version?: string
): Promise<JurisdictionParameters | null> {
  const manifest = await fetchManifest();
  const found = findJurisdictionRelease(manifest, jurisdictionId, version);
  if (
    !found ||
    !found.release ||
    !found.release.files ||
    !found.release.files.parameters
  ) {
    return null;
  }
  try {
    // When a child City Corporation is requested, load shared parameters once from the parent release
    // and layer only corporation-specific (`conditions.jurisdiction`) records on top.
    if (found.jurisdiction.parent) {
      const parentFound = findJurisdictionRelease(
        manifest,
        found.jurisdiction.parent
      );
      if (parentFound?.release?.files?.parameters) {
        const [parentPayload, childPayload] = await Promise.all([
          readPublishedJson<JurisdictionParameters>(
            parentFound.release.files.parameters
          ),
          readPublishedJson<JurisdictionParameters>(
            found.release.files.parameters
          ).catch(() => null),
        ]);
        const sharedRecords = parentPayload.records.filter(
          (r) =>
            !r.conditions.jurisdiction ||
            r.conditions.jurisdiction.length === 0 ||
            r.conditions.jurisdiction.includes(jurisdictionId)
        );
        const corpDiffRecords = (childPayload?.records ?? []).filter(
          (r) =>
            Boolean(r.conditions.jurisdiction?.length) &&
            r.conditions.jurisdiction?.includes(jurisdictionId)
        );
        const existingIds = new Set(sharedRecords.map((r) => r.parameter_id));
        const merged = [
          ...sharedRecords,
          ...corpDiffRecords.filter((r) => !existingIds.has(r.parameter_id)),
        ];
        return {
          ...parentPayload,
          jurisdiction: jurisdictionId,
          records: merged,
        };
      }
    }
    return await readPublishedJson<JurisdictionParameters>(
      found.release.files.parameters
    );
  } catch {
    return null;
  }
}

export function slimParametersForSsr(
  payload: JurisdictionParameters | null
): JurisdictionParameters | null {
  if (!payload) return null;
  const slimmed = payload.records
    .filter(
      (r) =>
        r.conditions.zone !== null ||
        r.source.doc_id.includes("amend-2026-01") ||
        r.source.doc_id.includes("amend-2025-04") ||
        r.source.eid.includes("chp_8__tbl_1__row_13") ||
        r.source.eid.includes("chp_8__tbl_1__row_2")
    )
    .slice(0, 32)
    .map((r) => ({
      ...r,
      value_text: r.value_text.slice(0, 120),
      conditions: {
        ...r.conditions,
        unexpressed_conditions: [],
      },
      source: {
        ...r.source,
        bbox: null,
        footnote_markers: [],
        footnotes_text: [],
        archive_url: null,
      },
    }));
  return {
    ...payload,
    records: slimmed,
  };
}

export async function fetchResolution(
  jurisdictionId: string,
  version?: string
): Promise<StatutoryResolutionConfig | null> {
  const manifest = await fetchManifest();
  const found = findJurisdictionRelease(manifest, jurisdictionId, version);
  if (
    !found ||
    !found.release ||
    !found.release.files ||
    !found.release.files.resolution
  ) {
    return null;
  }
  try {
    return await readPublishedJson<StatutoryResolutionConfig>(
      found.release.files.resolution
    );
  } catch {
    return null;
  }
}

export async function fetchAmendments(
  jurisdictionId: string,
  version?: string
): Promise<JurisdictionAmendments> {
  const manifest = await fetchManifest();
  const found = findJurisdictionRelease(manifest, jurisdictionId, version);
  if (!found || !found.release || !found.release.files) {
    return { schema_version: "1.4", jurisdiction: jurisdictionId, effects: [], links: [] };
  }
  return readPublishedJson<JurisdictionAmendments>(
    found.release.files.amendments
  );
}

export async function fetchConsolidated(
  jurisdictionId: string,
  version?: string
): Promise<JurisdictionConsolidated | null> {
  const manifest = await fetchManifest();
  const found = findJurisdictionRelease(manifest, jurisdictionId, version);
  if (
    !found ||
    !found.release ||
    !found.release.files ||
    !found.release.files.consolidated
  ) {
    return null;
  }
  return readPublishedJson<JurisdictionConsolidated>(
    found.release.files.consolidated
  );
}

export async function fetchZones(
  jurisdictionId: string,
  version?: string
): Promise<ZonesFeatureCollection> {
  const manifest = await fetchManifest();
  const found = findJurisdictionRelease(manifest, jurisdictionId, version);
  if (!found || !found.release || !found.release.files) {
    return {
      type: "FeatureCollection",
      schema_version: "1.4",
      features: [],
    };
  }
  return readPublishedJson<ZonesFeatureCollection>(found.release.files.zones);
}

export async function fetchBoundary(
  jurisdictionId: string,
  version?: string
): Promise<GenericFeatureCollection> {
  const manifest = await fetchManifest();
  const found = findJurisdictionRelease(manifest, jurisdictionId, version);
  if (!found || !found.release || !found.release.files) {
    return { type: "FeatureCollection", features: [] };
  }
  return readPublishedJson<GenericFeatureCollection>(
    found.release.files.boundary
  );
}

export async function fetchOptionalFeatureCollection(
  webPath: string | null | undefined
): Promise<GenericFeatureCollection | null> {
  if (!webPath) {
    return null;
  }
  return readPublishedJson<GenericFeatureCollection>(webPath);
}

export async function fetchGeoLayers(
  jurisdictionId: string,
  version?: string
): Promise<JurisdictionGeoLayers | null> {
  const manifest = await fetchManifest();
  const found = findJurisdictionRelease(manifest, jurisdictionId, version);
  if (
    !found ||
    !found.release ||
    !found.release.files ||
    !found.release.files.geo_layers
  ) {
    return null;
  }
  return readPublishedJson<JurisdictionGeoLayers>(
    found.release.files.geo_layers
  );
}

export async function fetchClauseZoneTags(
  jurisdictionId: string,
  version?: string
): Promise<JurisdictionClauseZoneTags | null> {
  const manifest = await fetchManifest();
  const found = findJurisdictionRelease(manifest, jurisdictionId, version);
  if (
    !found ||
    !found.release ||
    !found.release.files ||
    !found.release.files.clause_zone_tags
  ) {
    return null;
  }
  return readPublishedJson<JurisdictionClauseZoneTags>(
    found.release.files.clause_zone_tags
  );
}

export async function fetchDeclarations(
  jurisdictionId: string,
  version?: string
): Promise<JurisdictionDeclarations> {
  const manifest = await fetchManifest();
  const found = findJurisdictionRelease(manifest, jurisdictionId, version);
  if (!found || !found.release || !found.release.declarations) {
    return {
      schema_version: "1.4",
      jurisdiction: jurisdictionId,
      not_modelled: [],
      known_gaps: [],
      unread_documents: [],
      unobtainable_documents: [],
      contested_status: [],
    };
  }
  return readPublishedJson<JurisdictionDeclarations>(
    found.release.declarations
  );
}

export async function fetchJurisdictionDataset(
  jurisdictionId: string,
  version?: string
): Promise<JurisdictionDatasetBundle | null> {
  const manifest = await fetchManifest();
  const found = findJurisdictionRelease(manifest, jurisdictionId, version);
  if (!found) {
    return null;
  }
  const { jurisdiction, release } = found;
  if (!release || !release.files || !release.declarations) {
    let registerDocs: DocumentMetadata[] = [];
    if (jurisdiction.register_documents) {
      try {
        registerDocs = await readPublishedJson<DocumentMetadata[]>(
          jurisdiction.register_documents
        );
      } catch {
        registerDocs = [];
      }
    }
    return {
      jurisdiction,
      release: null,
      documents: registerDocs,
      clauseTrees: [],
      draftClauseTrees: [],
      annotationsByDocId: {},
      clauses: [],
      amendments: {
        schema_version: "1.4",
        jurisdiction: jurisdictionId,
        effects: [],
        links: [],
      },
      consolidated: null,
      zones: {
        type: "FeatureCollection",
        schema_version: "1.4",
        features: [],
      },
      boundary: { type: "FeatureCollection", features: [] },
      gbaZones: null,
      wards: null,
      planningDistricts: null,
      overlays: null,
      geoLayers: null,
      clauseZoneTags: null,
      relations: null,
      declarations: {
        schema_version: "1.4",
        jurisdiction: jurisdictionId,
        not_modelled: [],
        known_gaps: [],
        unread_documents: [],
        unobtainable_documents: [],
        contested_status: [],
      },
    };
  }

  const releaseFiles = release.files;
  const releaseDrafts = release.drafts;

  const [
    documents,
    clauseTrees,
    draftClauseTrees,
    annotationDocs,
    amendments,
    consolidated,
    zones,
    boundary,
    gbaZones,
    wards,
    planningDistricts,
    overlays,
    geoLayers,
    clauseZoneTags,
    relations,
    declarations,
  ] = await Promise.all([
    readPublishedJson<DocumentMetadata[]>(releaseFiles.documents),
    Promise.all(
      releaseFiles.clauses.map((p) => readPublishedJson<ClauseTreeDocument>(p))
    ),
    Promise.all(
      (releaseDrafts?.clauses ?? []).map((p) =>
        readPublishedJson<ClauseTreeDocument>(p)
      )
    ),
    Promise.all(
      (releaseFiles.annotations ?? []).map((p) =>
        readPublishedJson<DocumentAnnotations>(p)
      )
    ),
    readPublishedJson<JurisdictionAmendments>(releaseFiles.amendments),
    releaseFiles.consolidated
      ? readPublishedJson<JurisdictionConsolidated>(releaseFiles.consolidated)
      : Promise.resolve(null),
    readPublishedJson<ZonesFeatureCollection>(releaseFiles.zones),
    readPublishedJson<GenericFeatureCollection>(releaseFiles.boundary),
    fetchOptionalFeatureCollection(releaseFiles.gba_zones),
    fetchOptionalFeatureCollection(releaseFiles.wards),
    fetchOptionalFeatureCollection(releaseFiles.planning_districts),
    fetchOptionalFeatureCollection(releaseFiles.overlays),
    releaseFiles.geo_layers
      ? readPublishedJson<JurisdictionGeoLayers>(releaseFiles.geo_layers)
      : Promise.resolve(null),
    releaseFiles.clause_zone_tags
      ? readPublishedJson<JurisdictionClauseZoneTags>(
          releaseFiles.clause_zone_tags
        )
      : Promise.resolve(null),
    releaseFiles.relations
      ? readPublishedJson<JurisdictionRelations>(releaseFiles.relations).catch(
          () => null
        )
      : Promise.resolve(null),
    readPublishedJson<JurisdictionDeclarations>(release.declarations),
  ]);

  const docById = new Map<string, DocumentMetadata>();
  for (const doc of documents) {
    docById.set(doc.doc_id, doc);
  }

  const appliedEffectsByTarget = new Map<string, AmendmentEffect[]>();
  for (const eff of amendments.effects ?? []) {
    if (!eff.applied) continue;
    const key = `${eff.target_doc}:${eff.target_eid}`;
    const list = appliedEffectsByTarget.get(key) ?? [];
    list.push(eff);
    appliedEffectsByTarget.set(key, list);
  }

  const allTrees = [...clauseTrees, ...draftClauseTrees];
  const amendingNodeByKey = new Map<string, GeneratedClauseNode>();
  for (const tree of allTrees) {
    for (const c of tree.clauses) {
      if (c.eid) {
        amendingNodeByKey.set(`${tree.doc_id}:${c.eid}`, c);
      }
      if (c.number) {
        amendingNodeByKey.set(`${tree.doc_id}:${c.number}`, c);
      }
    }
  }

  const clauses: ClauseNode[] = [];
  for (const tree of allTrees) {
    const docMeta = docById.get(tree.doc_id);
    const pdfUrl =
      docMeta?.official_url ||
      (docMeta?.mirror_urls && docMeta.mirror_urls[0]) ||
      docMeta?.source_url;
    for (const c of tree.clauses) {
      let hydratedVersions = c.versions;
      let hydratedChangeMark = c.change_mark;
      let hydratedOmitted = c.omitted;
      const targetEffects = c.eid
        ? appliedEffectsByTarget.get(`${tree.doc_id}:${c.eid}`)
        : undefined;
      if (targetEffects && targetEffects.length > 0) {
        const existingEffIds = new Set(
          (c.versions ?? []).map((v) => v.effect_id).filter(Boolean)
        );
        const existingSourcePairs = new Set(
          (c.versions ?? [])
            .filter((v) => v.source_doc && v.source_eid)
            .map((v) => `${v.source_doc}:${v.source_eid}`)
        );
        const missingEffects = targetEffects.filter(
          (e) =>
            !existingEffIds.has(e.effect_id) &&
            !existingSourcePairs.has(`${e.amending_doc}:${e.amending_eid}`)
        );
        if (missingEffects.length > 0) {
          const baseVers = [...(c.versions ?? [])];
          for (const mEff of missingEffects) {
            const firstPayload = mEff.new_nodes?.[0];
            const amNode = amendingNodeByKey.get(
              `${mEff.amending_doc}:${mEff.amending_eid}`
            );
            const amCitations =
              amNode?.citations && amNode.citations.length > 0
                ? amNode.citations
                : c.citations ?? [];
            if (baseVers.length > 0 && !baseVers[baseVers.length - 1].valid_to) {
              baseVers[baseVers.length - 1] = {
                ...baseVers[baseVers.length - 1],
                valid_to: mEff.valid_from ?? null,
              };
            }
            baseVers.push({
              version_id: `v${baseVers.length + 1}`,
              valid_from: mEff.valid_from ?? null,
              valid_to: null,
              heading: firstPayload?.heading ?? c.heading ?? null,
              intro: firstPayload?.intro ?? c.intro ?? null,
              content:
                mEff.action === "omit"
                  ? `[Omitted by ${mEff.amending_doc}:${mEff.amending_eid}]`
                  : firstPayload?.content ?? c.content ?? c.text,
              wrap_up: firstPayload?.wrap_up ?? c.wrap_up ?? null,
              cells: c.cells ?? null,
              source_doc: mEff.amending_doc,
              source_eid: mEff.amending_eid,
              effect_id: mEff.effect_id,
              citations: amCitations,
              legal_status: "in_force",
              omitted: mEff.action === "omit",
            });
            const isCorpEffect = Boolean(
              jurisdiction.parent &&
                (mEff.applies_in?.includes(jurisdiction.id) ||
                  mEff.amending_doc.includes("-bbl-amend-"))
            );
            hydratedOmitted = mEff.action === "omit";
            hydratedChangeMark = {
              label: isCorpEffect
                ? `Changed for ${jurisdiction.name}, ${formatHumanDate(mEff.valid_from)}`
                : `Changed in ${(mEff.valid_from ?? "2026").slice(0, 4)}`,
              amending_doc: mEff.amending_doc,
              amending_eid: mEff.amending_eid,
              amending_clause_id: `${mEff.amending_doc}:${mEff.amending_eid}`,
              effective_date: mEff.valid_from ?? "",
              action: mEff.action,
              original_text: c.versions?.[0]?.content ?? c.text,
              original_heading: c.versions?.[0]?.heading ?? c.heading ?? null,
              original_cells: c.versions?.[0]?.cells ?? c.cells ?? null,
            };
          }
          hydratedVersions = baseVers;
        }
      }
      clauses.push({
        ...c,
        versions: hydratedVersions,
        change_mark: hydratedChangeMark,
        omitted: hydratedOmitted,
        doc_id: tree.doc_id,
        doc_title: docMeta?.title ?? tree.doc_id,
        doc_layer: docMeta?.layer,
        source_url: pdfUrl,
        official_url: docMeta?.official_url ?? null,
        archive_url: docMeta?.retrieval?.archive_url ?? null,
      });
    }
  }

  const annotationsByDocId: Record<string, AnnotationEntry[]> = {};
  for (const annDoc of annotationDocs) {
    annotationsByDocId[annDoc.doc_id] = annDoc.annotations;
  }

  return {
    jurisdiction,
    release,
    documents,
    clauseTrees,
    draftClauseTrees,
    annotationsByDocId,
    clauses,
    amendments,
    consolidated,
    zones,
    boundary,
    gbaZones,
    wards,
    planningDistricts,
    overlays,
    geoLayers,
    clauseZoneTags,
    relations,
    declarations,
  };
}

/**
 * Filter a list of ClauseNode records into active records vs historical record versions.
 */
export function partitionClauseVersions(clauses: ClauseNode[]): {
  activeClauses: ClauseNode[];
  historyByClauseId: Map<string, ClauseNode[]>;
} {
  const historyByClauseId = new Map<string, ClauseNode[]>();
  const activeClauses: ClauseNode[] = [];

  for (const clause of clauses) {
    const isSupersededVersion = Boolean(
      clause.record_superseded_by || clause.superseded_by
    );
    if (isSupersededVersion) {
      const existing = historyByClauseId.get(clause.clause_id) ?? [];
      existing.push(clause);
      historyByClauseId.set(clause.clause_id, existing);
    } else {
      activeClauses.push(clause);
    }
  }

  return { activeClauses, historyByClauseId };
}
