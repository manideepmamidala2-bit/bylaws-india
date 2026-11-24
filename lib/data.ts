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
  ClauseCitation,
  ClauseNode as GeneratedClauseNode,
  ClauseTable,
  ClauseTree as ClauseTreeDocument,
  ClauseZoneTagEntry,
  ConsolidatedClauseRecord,
  ConsolidatedClauseTable,
  ContestedStatus,
  DocumentAnnotations,
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
  KnownGap,
  NodeVersion,
  ReleaseDrafts,
  ReleaseEntry,
  ReleaseFiles,
  ReleaseManifest,
  TableColumnHeader,
  TableFootnote,
  TableMeta,
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
  ClauseCitation,
  ClauseTable,
  ClauseTreeDocument,
  ClauseZoneTagEntry,
  ConsolidatedClauseRecord,
  ConsolidatedClauseTable,
  ContestedStatus,
  DocumentAnnotations,
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
  JurisdictionSummary,
  KnownGap,
  NodeVersion,
  ReleaseDrafts,
  ReleaseEntry,
  ReleaseFiles,
  ReleaseManifest,
  TableColumnHeader,
  TableFootnote,
  TableMeta,
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

export async function readPublishedJson<T>(
  webPath: string,
  customFetch?: typeof fetch
): Promise<T> {
  const useNetwork =
    Boolean(customFetch) ||
    webPath.startsWith("http://") ||
    webPath.startsWith("https://") ||
    isMockedGlobalFetch();

  if (
    !useNetwork &&
    typeof process !== "undefined" &&
    typeof process.getBuiltinModule === "function"
  ) {
    const fs = process.getBuiltinModule(
      "fs/promises"
    ) as typeof import("fs/promises");
    const path = process.getBuiltinModule("path") as typeof import("path");
    const relativePath = webPath.replace(/^\/+/, "");
    const diskPath = path.join(process.cwd(), "public", relativePath);
    const rawText = await fs.readFile(diskPath, "utf8");
    return JSON.parse(rawText) as T;
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

export async function fetchAmendments(
  jurisdictionId: string,
  version?: string
): Promise<JurisdictionAmendments> {
  const manifest = await fetchManifest();
  const found = findJurisdictionRelease(manifest, jurisdictionId, version);
  if (!found || !found.release || !found.release.files) {
    return { schema_version: "1.3", jurisdiction: jurisdictionId, effects: [], links: [] };
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
      schema_version: "1.3",
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
      schema_version: "1.3",
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
        schema_version: "1.3",
        jurisdiction: jurisdictionId,
        effects: [],
        links: [],
      },
      consolidated: null,
      zones: {
        type: "FeatureCollection",
        schema_version: "1.3",
        features: [],
      },
      boundary: { type: "FeatureCollection", features: [] },
      gbaZones: null,
      wards: null,
      planningDistricts: null,
      overlays: null,
      geoLayers: null,
      clauseZoneTags: null,
      declarations: {
        schema_version: "1.3",
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
    readPublishedJson<JurisdictionDeclarations>(release.declarations),
  ]);

  const docById = new Map<string, DocumentMetadata>();
  for (const doc of documents) {
    docById.set(doc.doc_id, doc);
  }

  const allTrees = [...clauseTrees, ...draftClauseTrees];
  const clauses: ClauseNode[] = [];
  for (const tree of allTrees) {
    const docMeta = docById.get(tree.doc_id);
    const pdfUrl =
      docMeta?.official_url ||
      (docMeta?.mirror_urls && docMeta.mirror_urls[0]) ||
      docMeta?.source_url;
    for (const c of tree.clauses) {
      clauses.push({
        ...c,
        doc_id: tree.doc_id,
        doc_title: docMeta?.title ?? tree.doc_id,
        doc_layer: docMeta?.layer,
        source_url: pdfUrl,
        official_url: docMeta?.official_url ?? null,
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
