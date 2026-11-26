import type { DocumentMetadata } from "@/lib/data";

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

export function formatPlainLayerLabel(layer: string | null | undefined): string {
  switch (layer) {
    case "planning":
      return "Master plan zoning regulations";
    case "municipal":
      return "Municipal building bye-laws";
    case "state_rules":
      return "State rules & notifications";
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
    .replace(/\bsq_m\b/g, "m²")
    .replace(/\bsq_ft\b/g, "sq ft")
    .replace(/\bpercent\b/g, "%");
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
