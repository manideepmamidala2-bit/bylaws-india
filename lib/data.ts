/**
 * Centralized data client for published building bylaws datasets (Plan v1.1 §S1b / §S3).
 *
 * Types are generated from `schemas/*.schema.json` into `lib/types/generated.ts`
 * and re-exported here with view-level helpers.
 */

import type {
  AmendmentLink,
  ClauseCitation,
  ClauseNode as GeneratedClauseNode,
  ClauseTable,
  ClauseTree as ClauseTreeDocument,
  DocumentMetadata,
  JurisdictionAmendments,
  JurisdictionDeclarations,
  JurisdictionManifest as JurisdictionSummary,
  ReleaseDrafts,
  ReleaseEntry,
  ReleaseFiles,
  ReleaseManifest,
  ZoneFeature,
  ZoneFeatureProperties,
  ZonesFeatureCollection,
} from "@/lib/types/generated";

export type {
  AmendmentLink,
  ClauseCitation,
  ClauseTable,
  ClauseTreeDocument,
  DocumentMetadata,
  JurisdictionAmendments,
  JurisdictionDeclarations,
  JurisdictionSummary,
  ReleaseDrafts,
  ReleaseEntry,
  ReleaseFiles,
  ReleaseManifest,
  ZoneFeature,
  ZoneFeatureProperties,
  ZonesFeatureCollection,
};

export type LegalStatus = GeneratedClauseNode["legal_status"];
export type DisplayLegalStatus = LegalStatus | "status_unknown";
export type VerificationStatus = ZoneFeatureProperties["verification"];

/**
 * ClauseNode with optional UI-Hydrated document source URL and partial tolerance
 * for defensive R8 rendering when inspecting incomplete records.
 */
export type ClauseNode = Omit<GeneratedClauseNode, "legal_status" | "citations"> & {
  legal_status?: LegalStatus | null;
  citations?: ClauseCitation[];
  source_url?: string;
  doc_id?: string;
};

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
