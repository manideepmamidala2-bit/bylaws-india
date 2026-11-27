import React from "react";
import type {
  AmendmentLink,
  ClauseNode,
  DocumentMetadata,
} from "@/lib/data";
import { formatPlainDocumentTitle } from "@/lib/plain-language";

export interface LegislationJsonLdProps {
  jurisdictionId: string;
  jurisdictionName: string;
  document: DocumentMetadata;
  clauses: ReadonlyArray<ClauseNode>;
  amendmentLinks?: ReadonlyArray<AmendmentLink>;
  allDocuments?: ReadonlyArray<DocumentMetadata>;
}

function mapLegalForceUrl(legalStatus?: string | null): string {
  if (legalStatus === "in_force") {
    return "https://schema.org/InForce";
  }
  if (legalStatus === "PartiallyInForce") {
    return "https://schema.org/PartiallyInForce";
  }
  return "https://schema.org/NotInForce";
}

export function buildLegislationJsonLdObject({
  jurisdictionId,
  jurisdictionName,
  document,
  clauses,
  amendmentLinks = [],
  allDocuments = [],
}: LegislationJsonLdProps): Record<string, unknown> {
  const docById = new Map(allDocuments.map((d) => [d.doc_id, d]));
  const plainTitle = formatPlainDocumentTitle(document, document.doc_id);
  const officialPdfUrl =
    document.official_url ||
    document.source_url ||
    `https://bylaws-india.vercel.app/j/${jurisdictionId}/documents/${document.doc_id}`;
  const legislationDate =
    document.effective_from || document.notified_date || "2004-06-05";
  const legislationIdentifier =
    document.notification_number || document.doc_id;
  const legalForce = mapLegalForceUrl(document.legal_status);

  // Build `legislationChanges` when this document is an amendment or is amended by linked instruments
  const changedTargetIds = new Set<string>();
  for (const link of amendmentLinks) {
    if (link.amending_clause.startsWith(`${document.doc_id}:`)) {
      changedTargetIds.add(link.target_clause.split(":")[0]);
    } else if (link.target_clause.startsWith(`${document.doc_id}:`)) {
      changedTargetIds.add(link.amending_clause.split(":")[0]);
    }
  }
  if (document.amends) {
    for (const amTarget of document.amends) {
      changedTargetIds.add(amTarget);
    }
  }

  const legislationChanges = Array.from(changedTargetIds).map((targetDocId) => {
    const tDoc = docById.get(targetDocId);
    return {
      "@type": "Legislation",
      name: formatPlainDocumentTitle(tDoc, targetDocId),
      legislationIdentifier: tDoc?.notification_number || targetDocId,
      url:
        tDoc?.official_url ||
        tDoc?.source_url ||
        `https://bylaws-india.vercel.app/j/${jurisdictionId}/documents/${targetDocId}`,
    };
  });

  const parentDocMeta =
    document.amends && document.amends.length > 0
      ? docById.get(document.amends[0])
      : undefined;

  const isPartOf = parentDocMeta
    ? {
        "@type": "Legislation",
        name: formatPlainDocumentTitle(parentDocMeta, parentDocMeta.doc_id),
        legislationIdentifier:
          parentDocMeta.notification_number || parentDocMeta.doc_id,
        url:
          parentDocMeta.official_url ||
          parentDocMeta.source_url ||
          `https://bylaws-india.vercel.app/j/${jurisdictionId}/documents/${parentDocMeta.doc_id}`,
      }
    : {
        "@type": "Legislation",
        name: `${jurisdictionName} Building Code (Bylaw One)`,
        legislationIdentifier: jurisdictionId,
        url: `https://bylaws-india.vercel.app/j/${jurisdictionId}/topics`,
      };

  // Embed provision-level `schema.org/Legislation` records inside `hasPart`
  const provisionParts = clauses
    .filter((c) => c.type !== "table_row")
    .slice(0, 12)
    .map((c) => {
      const page = c.citations?.[0]?.page ?? 1;
      const provPdfUrl = officialPdfUrl.includes("#")
        ? officialPdfUrl
        : `${officialPdfUrl}#page=${page}`;
      return {
        "@type": "Legislation",
        name: `${c.number || c.eid}${c.heading ? ` · ${c.heading}` : ""}`,
        legislationIdentifier: `${document.doc_id}:${c.eid || c.number}`,
        legislationDate,
        legislationJurisdiction: jurisdictionName,
        legislationLegalForce: mapLegalForceUrl(
          c.legal_status || document.legal_status
        ),
        isPartOf: {
          "@type": "Legislation",
          name: plainTitle,
          legislationIdentifier,
          url: officialPdfUrl,
        },
        url: provPdfUrl,
      };
    });

  return {
    "@context": "https://schema.org",
    "@type": "Legislation",
    name: plainTitle,
    alternateName: document.title,
    legislationIdentifier,
    legislationDate,
    legislationJurisdiction: jurisdictionName,
    legislationLegalForce: legalForce,
    ...(legislationChanges.length > 0 ? { legislationChanges } : {}),
    isPartOf,
    url: officialPdfUrl,
    ...(provisionParts.length > 0 ? { hasPart: provisionParts } : {}),
  };
}

export function LegislationJsonLd(props: LegislationJsonLdProps) {
  const payload = buildLegislationJsonLdObject(props);
  return (
    <script
      type="application/ld+json"
      data-testid="legislation-json-ld"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(payload) }}
    />
  );
}
