/**
 * Centralized data client for published building bylaws datasets (Plan §10).
 *
 * All components and pages read manifest and dataset files exclusively through
 * this module. No jurisdiction ID, city name, or storage URL is hard-coded here.
 */

export type LegalStatus = "in_force" | "draft" | "superseded" | "withdrawn";

export type VerificationStatus =
  | "unverified"
  | "machine_checked"
  | "human_verified"
  | "rejected";

export interface ReleaseFiles {
  documents: string;
  clauses: string[];
  amendments: string;
  zones: string;
  boundary: string;
  review_images: string[];
}

export interface ReleaseEntry {
  version: string;
  released_at: string;
  files: ReleaseFiles;
  drafts: {
    clauses: string[];
  };
  changelog: string;
}

export interface JurisdictionSummary {
  id: string;
  name: string;
  latest_release: string;
  releases: ReleaseEntry[];
}

export interface ReleaseManifest {
  schema_version: string;
  jurisdictions: JurisdictionSummary[];
}

export interface ClauseTable {
  table_id: string;
  caption: string | null;
  headers: string[];
  rows: string[][];
  page: number;
}

export interface ClauseNode {
  clause_id: string;
  number: string;
  title: string | null;
  level: number;
  parent_id: string | null;
  order: number;
  text: string;
  tables: ClauseTable[];
  pages: number[];
  cross_references: string[];
  amended_by: string[];
  applies_to_zones: string[];
  verification: Exclude<VerificationStatus, "rejected">;
  source_url?: string;
  doc_id?: string;
  legal_status?: LegalStatus;
}

export interface ClauseTreeDocument {
  schema_version: string;
  doc_id: string;
  jurisdiction: string;
  legal_status: LegalStatus;
  generated: {
    parser: string;
    parser_version: string;
    pipeline_version: string;
    generated_at: string;
  };
  clauses: ClauseNode[];
}

export interface ZoneFeatureProperties {
  zone_id: string;
  zone_code: string;
  zone_label: string;
  source_map: string;
  georef_run: string;
  extraction_method: "colour_segmentation" | "road_outline_fallback" | "manual";
  area_sq_m: number;
  verification: VerificationStatus;
  notes: string | null;
}

export interface ZoneFeature {
  type: "Feature";
  geometry: {
    type: "Polygon" | "MultiPolygon";
    coordinates: number[][][] | number[][][][];
  };
  properties: ZoneFeatureProperties;
}

export interface ZonesFeatureCollection {
  type: "FeatureCollection";
  schema_version?: string;
  features: ZoneFeature[];
}

const DEFAULT_MANIFEST_PATH = "/data/manifest.json";

export function getManifestUrl(): string {
  const configured = process.env.NEXT_PUBLIC_MANIFEST_URL?.trim();
  return configured && configured.length > 0 ? configured : DEFAULT_MANIFEST_PATH;
}

export async function fetchManifest(
  customFetch: typeof fetch = fetch
): Promise<ReleaseManifest> {
  const url = getManifestUrl();
  const response = await customFetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Failed to fetch manifest from ${url} (HTTP ${response.status})`);
  }
  return (await response.json()) as ReleaseManifest;
}

export function findJurisdictionRelease(
  manifest: ReleaseManifest,
  jurisdictionId: string,
  version?: string
): { jurisdiction: JurisdictionSummary; release: ReleaseEntry } | null {
  const jurisdiction = manifest.jurisdictions.find((item) => item.id === jurisdictionId);
  if (!jurisdiction) {
    return null;
  }
  const targetVersion = version ?? jurisdiction.latest_release;
  const release =
    jurisdiction.releases.find((rel) => rel.version === targetVersion) ??
    jurisdiction.releases[0];
  if (!release) {
    return null;
  }
  return { jurisdiction, release };
}
