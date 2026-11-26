import React from "react";
import Link from "next/link";
import {
  fetchDeclarations,
  fetchJurisdictionDataset,
  fetchManifest,
  fetchParameters,
  getVisibleJurisdictions,
  isWithdrawnRelease,
  type ClauseNode,
  type DocumentMetadata,
  type JurisdictionParameters,
  type JurisdictionSummary,
  type ReleaseManifest,
} from "@/lib/data";
import { TopNav } from "@/components/TopNav";
import {
  FarStoryStepper,
  type FarStoryStep,
  type FarStoryTableRow,
} from "@/components/FarStoryStepper";
import {
  CODE_SUBJECTS,
  computeHeroDocumentAndBodyCounts,
  formatHumanDate,
  formatParameterConditionsPlain,
  formatParameterValuePlain,
  formatPlainDocumentTitle,
  formatPlainInstrumentStatus,
  formatPlainWhatChangedSummary,
  isDocumentTextHeld,
  isPlausibleParameterRecord,
  sortDocumentsMostRecentFirst,
} from "@/lib/plain-language";

export interface HomePageProps {
  manifest: ReleaseManifest;
  visibleJurisdictions: JurisdictionSummary[];
}

export async function getHomePageProps(
  customFetch?: typeof fetch
): Promise<HomePageProps> {
  const manifest = await fetchManifest(customFetch);
  const visibleJurisdictions = getVisibleJurisdictions(manifest);
  return {
    manifest,
    visibleJurisdictions,
  };
}

function hasPublishedRelease(item: JurisdictionSummary): boolean {
  if (!item.latest_release) {
    return false;
  }
  return item.releases.some((rel) => !isWithdrawnRelease(rel));
}

function sliceVerbatimSpan(
  fullText: string | undefined | null,
  startAnchor: string,
  endAnchor?: string
): string | null {
  if (!fullText) return null;
  const normalized = fullText.replace(/\s+/g, " ").trim();
  const sIdx = normalized.indexOf(startAnchor);
  if (sIdx === -1) return normalized;
  if (!endAnchor) return normalized.slice(sIdx).trim();
  const eIdx = normalized.indexOf(endAnchor, sIdx);
  if (eIdx === -1) return normalized.slice(sIdx).trim();
  return normalized.slice(sIdx, eIdx + endAnchor.length).trim();
}

export function buildHomeFarStorySteps(
  clauses: ReadonlyArray<ClauseNode>,
  documents: ReadonlyArray<DocumentMetadata>,
  parametersPayload: JurisdictionParameters | null,
  jurId: string
): FarStoryStep[] {
  const docById = new Map(documents.map((d) => [d.doc_id, d]));
  const allParams = (parametersPayload?.records ?? []).filter(
    isPlausibleParameterRecord
  );

  const muniBaseDoc = documents.find(
    (d) => d.role === "base" && d.layer === "municipal"
  );
  const planBaseDoc = documents.find(
    (d) => d.role === "base" && d.layer === "planning"
  );
  const pfarAmendDoc = documents.find(
    (d) =>
      d.role === "amendment" &&
      d.layer === "planning" &&
      (d.effective_from ?? "").startsWith("2025-04")
  );

  // Step 1: 2004 Municipal Building Bye-laws 2003 (Bye-law 9.2)
  const s1Node = clauses.find(
    (c) => c.doc_id === muniBaseDoc?.doc_id && c.number === "9.2"
  );
  const s1Excerpt = sliceVerbatimSpan(
    s1Node?.text,
    "The set backs required on all the sides of building/s",
    "given below."
  );
  const bblPdfBase = muniBaseDoc?.official_url || muniBaseDoc?.source_url || "";
  const s1Page = s1Node?.citations?.[0]?.page ?? 21;
  const s1Rows: FarStoryTableRow[] = [
    {
      condition: "Plots up to 240 m² (Intensely developed area)",
      values: ["65%", "0.75", "1.00"],
      sourceLabel: "Table 6",
      pageNumber: 23,
      pageLink: bblPdfBase ? `${bblPdfBase}#page=23` : "#page=23",
    },
    {
      condition: "Plots above 240 up to 500 m² (Intensely developed area)",
      values: ["60%", "0.75", "1.00"],
      sourceLabel: "Table 6",
      pageNumber: 23,
      pageLink: bblPdfBase ? `${bblPdfBase}#page=23` : "#page=23",
    },
    {
      condition: "Plots above 500 up to 750 m² (Intensely developed area)",
      values: ["60%", "1.00", "1.25"],
      sourceLabel: "Table 6",
      pageNumber: 23,
      pageLink: bblPdfBase ? `${bblPdfBase}#page=23` : "#page=23",
    },
    {
      condition: "Plots above 1,000 m² (Intensely developed area)",
      values: ["60%", "1.25", "1.50"],
      sourceLabel: "Table 6",
      pageNumber: 23,
      pageLink: bblPdfBase ? `${bblPdfBase}#page=23` : "#page=23",
    },
  ];

  // Step 2: 2007 Master Plan Zoning Regulations Chapter 4 (Residential Main Table 10)
  const s2Node = clauses.find(
    (c) => c.doc_id === planBaseDoc?.doc_id && c.number === "4.1.1"
  );
  const s2Excerpt = sliceVerbatimSpan(
    s2Node?.text,
    "The areas of the city which have predominantly residential land use pattern"
  );
  const rmpPdfBase = planBaseDoc?.official_url || planBaseDoc?.source_url || "";
  const s2Page = s2Node?.citations?.[0]?.page ?? 28;
  const tbl10Far = allParams.filter(
    (r) =>
      r.source.doc_id === planBaseDoc?.doc_id &&
      r.parameter === "far_base_max" &&
      (r.source.table_eid === "chp_4__cl_4.1__cl_4.1.3__tbl_10" ||
        r.source.table_eid === "chp_4__cl_4.1__cl_4.1.3__tbl_1")
  );
  const tbl10CovByRow = new Map<number, string>();
  for (const r of allParams) {
    if (
      r.source.doc_id === planBaseDoc?.doc_id &&
      r.parameter === "ground_coverage_max_pct" &&
      (r.source.table_eid === "chp_4__cl_4.1__cl_4.1.3__tbl_10" ||
        r.source.table_eid === "chp_4__cl_4.1__cl_4.1.3__tbl_1") &&
      typeof r.source.row_index === "number"
    ) {
      tbl10CovByRow.set(r.source.row_index, formatParameterValuePlain(r));
    }
  }
  const s2Rows: FarStoryTableRow[] =
    tbl10Far.length > 0
      ? tbl10Far.map((r) => ({
          condition: formatParameterConditionsPlain(r.conditions, r),
          values: [
            tbl10CovByRow.get(r.source.row_index ?? -1) ?? "—",
            formatParameterValuePlain(r),
          ],
          sourceLabel: "Table 10",
          pageNumber: r.source.page,
          pageLink: r.source.page_link,
        }))
      : [
          {
            condition:
              "Residential (Main), plots above 360 up to 1,000 m², roads above 12 up to 18 m",
            values: ["65%", "2.25"],
            sourceLabel: "Table 10",
            pageNumber: 28,
            pageLink: rmpPdfBase ? `${rmpPdfBase}#page=28` : "#page=28",
          },
        ];

  // Step 3: 2017 Bye-law 1.4
  const s3Node = clauses.find(
    (c) => c.doc_id === muniBaseDoc?.doc_id && c.number === "1.4"
  );
  const s3Excerpt = s3Node?.text ? s3Node.text.replace(/\s+/g, " ").trim() : null;
  const s3Ver = s3Node?.versions?.[0];
  const s3SourceDoc = s3Ver?.source_doc ? docById.get(s3Ver.source_doc) : null;
  const s3PdfBase =
    s3SourceDoc?.official_url || s3SourceDoc?.source_url || bblPdfBase;
  const s3Page = s3Ver?.citations?.[0]?.page ?? s3Node?.citations?.[0]?.page ?? 2;

  // Step 4: 2025 Premium FAR Chapter 11
  const s4Node = clauses.find(
    (c) => c.doc_id === pfarAmendDoc?.doc_id && c.eid === "chp_11_2"
  );
  const s4Excerpt = sliceVerbatimSpan(
    s4Node?.text,
    "The Premium F.A.R by levy of premium charges is the additional F.A.R granted",
    "regulation 2 below."
  );
  const pfarPdfBase =
    pfarAmendDoc?.official_url || pfarAmendDoc?.source_url || "";
  const s4Page = s4Node?.citations?.[0]?.page ?? 2;
  const pfarRecs = allParams.filter(
    (r) =>
      r.source.doc_id === pfarAmendDoc?.doc_id &&
      r.parameter === "far_premium_additional_max"
  );
  const tdrByRow = new Map<number, string>();
  for (const r of allParams) {
    if (
      r.source.doc_id === pfarAmendDoc?.doc_id &&
      r.parameter === "tdr_receivable_max" &&
      typeof r.source.row_index === "number"
    ) {
      tdrByRow.set(r.source.row_index, formatParameterValuePlain(r));
    }
  }
  const s4Rows: FarStoryTableRow[] =
    pfarRecs.length > 0
      ? pfarRecs.map((r) => ({
          condition: formatParameterConditionsPlain(r.conditions, r),
          values: [
            formatParameterValuePlain(r),
            tdrByRow.get(r.source.row_index ?? -1) ?? "None (0)",
          ],
          sourceLabel: "Table 27",
          pageNumber: r.source.page,
          pageLink: r.source.page_link,
        }))
      : [
          {
            condition: "Roads above 9 up to 12 m",
            values: ["20% of base FAR (0.2×)", "None (0)"],
            sourceLabel: "Table 27",
            pageNumber: 2,
            pageLink: pfarPdfBase ? `${pfarPdfBase}#page=2` : "#page=2",
          },
          {
            condition: "Roads above 12 up to 18 m",
            values: ["30% of base FAR (0.3×)", "10% of base FAR (0.1×)"],
            sourceLabel: "Table 27",
            pageNumber: 2,
            pageLink: pfarPdfBase ? `${pfarPdfBase}#page=2` : "#page=2",
          },
          {
            condition: "Roads above 18 m",
            values: ["40% of base FAR (0.4×)", "20% of base FAR (0.2×)"],
            sourceLabel: "Table 27",
            pageNumber: 2,
            pageLink: pfarPdfBase ? `${pfarPdfBase}#page=2` : "#page=2",
          },
        ];

  // Step 5: Today. What applies.
  const s5Node = clauses.find(
    (c) => c.doc_id === pfarAmendDoc?.doc_id && c.eid === "chp_11_2__note_2"
  );
  const s5Excerpt = s5Node?.text ? s5Node.text.replace(/\s+/g, " ").trim() : null;
  const s5Page = s5Node?.citations?.[0]?.page ?? 3;
  const s5Rows: FarStoryTableRow[] = [
    {
      condition: "Base FAR (by zone, plot size and road width)",
      values: [
        "1.0 to 3.25",
        "Master Plan Zoning Regulations (via Bye-law 1.4)",
      ],
      sourceLabel: "Chapter 4",
      pageNumber: 28,
      pageLink: rmpPdfBase ? `${rmpPdfBase}#page=28` : "#page=28",
    },
    {
      condition: "Premium FAR (on roads above 9 m)",
      values: [
        "Up to 20% to 40% of base FAR",
        "April 2025 Chapter 11 Amendment",
      ],
      sourceLabel: "Table 27",
      pageNumber: 2,
      pageLink: pfarPdfBase ? `${pfarPdfBase}#page=2` : "#page=2",
    },
    {
      condition: "Transferable development rights (TDR)",
      values: [
        "Up to 10% to 20% alongside Premium FAR (60% combined cap)",
        "April 2025 Chapter 11 Amendment",
      ],
      sourceLabel: "Note 2",
      pageNumber: 3,
      pageLink: pfarPdfBase ? `${pfarPdfBase}#page=3` : "#page=3",
    },
  ];

  const muniDocId = muniBaseDoc?.doc_id ?? "";
  const planDocId = planBaseDoc?.doc_id ?? "";
  const pfarDocId = pfarAmendDoc?.doc_id ?? "";
  const muniPlainTitle = formatPlainDocumentTitle(muniBaseDoc);
  const muniPlainDate = formatHumanDate(
    muniBaseDoc?.effective_from || muniBaseDoc?.notified_date
  );
  const planPlainTitle = formatPlainDocumentTitle(planBaseDoc);
  const planPlainDate = formatHumanDate(
    planBaseDoc?.effective_from || planBaseDoc?.notified_date
  );
  const s3PlainTitle = formatPlainDocumentTitle(s3SourceDoc ?? muniBaseDoc);
  const s3PlainDate = formatHumanDate(
    s3SourceDoc?.effective_from ||
      s3SourceDoc?.notified_date ||
      s3Ver?.valid_from
  );
  const pfarPlainTitle = formatPlainDocumentTitle(pfarAmendDoc);
  const pfarPlainDate = formatHumanDate(
    pfarAmendDoc?.effective_from || pfarAmendDoc?.notified_date
  );

  return [
    {
      stepNumber: 1,
      heading: "2004. The bye-laws set FAR.",
      inShortBySite:
        "The Building Bye-laws 2003 (in operation from 5 June 2004) set FAR in their own tables (bye-law 9.2, Tables 4 to 6).",
      verbatimExcerpt: s1Excerpt,
      documentTitle: muniPlainTitle,
      documentDate: muniPlainDate,
      pageNumber: s1Page,
      viewPageUrl: bblPdfBase ? `${bblPdfBase}#page=${s1Page}` : `#page=${s1Page}`,
      documentHref: muniDocId
        ? `/j/${jurId}/documents/${muniDocId}#node-${s1Node?.eid ?? ""}`
        : `/j/${jurId}/topics/far`,
      tableCaption:
        "Derived by this site · Sample rows from 2003 Bye-laws Table 6 (replaced for FAR in 2017)",
      tableHeaders: [
        "Plot condition",
        "Coverage",
        "Residential FAR",
        "Commercial FAR",
        "Source",
      ],
      tableRows: s1Rows,
    },
    {
      stepNumber: 2,
      heading: "2007. The master plan sets FAR by zone.",
      inShortBySite:
        "The Master Plan Zoning Regulations set FAR by zone, plot size and road width (Chapter 4, Table 10).",
      verbatimExcerpt: s2Excerpt,
      documentTitle: planPlainTitle,
      documentDate: planPlainDate,
      pageNumber: s2Page,
      viewPageUrl: rmpPdfBase ? `${rmpPdfBase}#page=${s2Page}` : `#page=${s2Page}`,
      documentHref: planDocId
        ? `/j/${jurId}/documents/${planDocId}#node-${s2Node?.eid ?? ""}`
        : `/j/${jurId}/topics/far`,
      tableCaption:
        "Derived by this site · Residential (Main) base FAR and coverage (Table 10)",
      tableHeaders: [
        "Zone, plot size and road width",
        "Coverage",
        "Base FAR",
        "Source",
      ],
      tableRows: s2Rows,
    },
    {
      stepNumber: 3,
      heading: "2017. The bye-laws hand FAR to the master plan.",
      inShortBySite:
        "Bye-law 1.4, from notification UDD 14 TTP 2017, makes the master plan rules govern use, coverage, FAR, setbacks, height, floors, dwelling units and parking.",
      verbatimExcerpt: s3Excerpt,
      documentTitle: s3PlainTitle,
      documentDate: s3PlainDate,
      pageNumber: s3Page,
      viewPageUrl: s3PdfBase ? `${s3PdfBase}#page=${s3Page}` : `#page=${s3Page}`,
      documentHref: muniDocId
        ? `/j/${jurId}/documents/${muniDocId}#node-${s3Node?.eid ?? ""}`
        : `/j/${jurId}/topics/far`,
    },
    {
      stepNumber: 4,
      heading: "2025. Premium FAR is added.",
      inShortBySite:
        "The premium FAR chapter (Chapter 11, notified 2 April 2025) allows extra FAR on payment, by road width.",
      verbatimExcerpt: s4Excerpt,
      documentTitle: pfarPlainTitle,
      documentDate: pfarPlainDate,
      pageNumber: s4Page,
      viewPageUrl: pfarPdfBase
        ? `${pfarPdfBase}#page=${s4Page}`
        : `#page=${s4Page}`,
      documentHref: pfarDocId
        ? `/j/${jurId}/documents/${pfarDocId}#node-${s4Node?.eid ?? ""}`
        : `/j/${jurId}/topics/far`,
      tableCaption:
        "Derived by this site · Allowable Premium FAR and TDR by road width (Table 27)",
      tableHeaders: [
        "Road width",
        "Premium FAR",
        "TDR alongside Premium FAR",
        "Source",
      ],
      tableRows: s4Rows,
    },
    {
      stepNumber: 5,
      heading: "Today. What applies.",
      inShortBySite:
        "Base FAR from the zoning table, with premium FAR and TDR on top, each from its own source.",
      verbatimExcerpt: s5Excerpt,
      documentTitle: pfarPlainTitle,
      documentDate: pfarPlainDate,
      pageNumber: s5Page,
      viewPageUrl: pfarPdfBase
        ? `${pfarPdfBase}#page=${s5Page}`
        : `#page=${s5Page}`,
      documentHref: `/j/${jurId}/topics/far`,
      tableCaption: "Derived by this site · How FAR rules combine today",
      tableHeaders: [
        "Component",
        "Allowance",
        "Governing instrument",
        "Source",
      ],
      tableRows: s5Rows,
    },
  ];
}

export default async function HomePage() {
  const { visibleJurisdictions } = await getHomePageProps();
  const parentJurisdiction =
    visibleJurisdictions.find((j) =>
      visibleJurisdictions.some((child) => child.parent === j.id)
    ) ?? visibleJurisdictions[0];

  const targetJurId = parentJurisdiction?.id ?? "";
  const cityLabel =
    parentJurisdiction?.aliases?.[0] ?? parentJurisdiction?.name ?? "City";
  const regionLabel =
    parentJurisdiction?.aliases?.[2] ?? parentJurisdiction?.name ?? "City";

  const hasActiveDataset =
    parentJurisdiction && hasPublishedRelease(parentJurisdiction);

  const [declarations, dataset, parametersPayload] = hasActiveDataset
    ? await Promise.all([
        fetchDeclarations(targetJurId).catch(() => null),
        fetchJurisdictionDataset(targetJurId).catch(() => null),
        fetchParameters(targetJurId).catch(() => null),
      ])
    : [null, null, null];

  const allDocuments = dataset?.documents ?? [];
  const { documentCount, bodyCount } =
    computeHeroDocumentAndBodyCounts(allDocuments);

  const farSteps = buildHomeFarStorySteps(
    dataset?.clauses ?? [],
    allDocuments,
    parametersPayload,
    targetJurId
  );

  const inForceSorted = sortDocumentsMostRecentFirst(
    allDocuments.filter(
      (d) =>
        d.legal_status === "in_force" &&
        d.acquisition_status !== "not_found" &&
        d.applies_to_jurisdiction?.status !== "no" &&
        (d.instrument_type ?? "instrument") !== "map" &&
        (d.instrument_type ?? "instrument") !== "compilation"
    )
  );

  const recentChanges: DocumentMetadata[] = [];
  let seenMay2026CorpAmend = false;
  for (const doc of inForceSorted) {
    if (doc.doc_id.endsWith("-bbl-amend-2026-05")) {
      if (seenMay2026CorpAmend) continue;
      seenMay2026CorpAmend = true;
    }
    recentChanges.push(doc);
    if (recentChanges.length >= 5) break;
  }

  const convergenceItems: Array<{ year: string; label: string }> = [];
  let seenConvergenceMay2026 = false;
  for (const doc of inForceSorted) {
    if (doc.doc_id.endsWith("-bbl-amend-2026-05")) {
      if (seenConvergenceMay2026) continue;
      seenConvergenceMay2026 = true;
    }
    convergenceItems.push({
      year: formatHumanDate(doc.effective_from || doc.notified_date),
      label: formatPlainDocumentTitle(doc),
    });
    if (convergenceItems.length >= 9) break;
  }

  const missingItems = (declarations?.not_modelled ?? []).map((nm) =>
    nm.replace(/\s*\([A-Z0-9\s-]+\)/g, "")
  );

  return (
    <div className="bg-[#f5f3ed] text-[#080909]">
      <TopNav jurisdictionId={targetJurId} active="home" />

      <main className="mx-auto max-w-5xl px-5">
        {/* Hero */}
        <section
          aria-labelledby="hero-heading"
          className="border-b border-[#c8ccc0] py-14 md:py-20"
        >
          <div className="dg-mono text-[#5b5e56]">
            Bylaw One · {regionLabel}
          </div>
          <h1
            id="hero-heading"
            className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight text-[#080909] md:text-5xl"
          >
            {cityLabel}&apos;s building rules. One code.
          </h1>
          <p
            data-testid="hero-subline"
            className="dg-serif mt-4 max-w-2xl text-lg leading-relaxed text-[#171917]"
          >
            {documentCount} official documents from {bodyCount} bodies, joined
            into one readable code. Every rule traced to its page.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href={`/j/${targetJurId}/topics`}
              className="inline-flex min-h-[44px] items-center border border-[#080909] bg-[#080909] px-5 py-2.5 font-mono text-xs uppercase tracking-[0.12em] text-[#f5f3ed] no-underline hover:bg-[#171917]"
            >
              Read the code
            </Link>
            <Link
              href={`/j/${targetJurId}/timeline`}
              className="inline-flex min-h-[44px] items-center border border-[#080909] bg-[#f5f3ed] px-5 py-2.5 font-mono text-xs uppercase tracking-[0.12em] text-[#080909] no-underline hover:bg-[#efeee8]"
            >
              What changed recently
            </Link>
          </div>
        </section>

        {/* 01 / The problem */}
        <section
          aria-labelledby="section-01-heading"
          className="border-b border-[#c8ccc0] py-14 md:py-16"
        >
          <div className="dg-mono text-[#5b5e56]">01 / The problem</div>
          <h2
            id="section-01-heading"
            className="mt-2 text-2xl font-semibold tracking-tight text-[#080909] md:text-3xl"
          >
            Many sources. One building.
          </h2>
          <p className="dg-serif mt-3 text-base leading-relaxed text-[#171917]">
            The rules for one building sit in bye-laws, master plan regulations,
            amendments, corporation notices and state law. They overlap and
            sometimes disagree.
          </p>

          {/* Quiet convergence illustration */}
          <figure
            aria-label="Illustration of official documents converging into one code"
            className="mt-8 border border-[#c8ccc0] bg-[#efeee8] p-5"
          >
            <figcaption className="dg-mono mb-4 text-[#5b5e56]">
              Illustration · Official sources in force (newest first) converging
              into one code
            </figcaption>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto_220px] md:items-center">
              <ul className="divide-y divide-[#c8ccc0] border border-[#c8ccc0] bg-[#f5f3ed]">
                {convergenceItems.map((item) => (
                  <li
                    key={`${item.year}-${item.label}`}
                    className="flex items-baseline justify-between gap-4 px-3.5 py-2 text-xs"
                  >
                    <span className="text-[#080909]">{item.label}</span>
                    <span className="shrink-0 font-mono text-[11px] text-[#5b5e56]">
                      {item.year}
                    </span>
                  </li>
                ))}
              </ul>
              <div
                aria-hidden="true"
                className="hidden font-mono text-sm text-[#5b5e56] md:block"
              >
                ───►
              </div>
              <div className="border border-[#080909] border-l-4 border-l-[#ff6b52] bg-[#f5f3ed] p-4">
                <div className="dg-mono text-[#5b5e56]">Joined by subject</div>
                <div className="mt-1 text-base font-semibold text-[#080909]">
                  Bylaw One
                </div>
                <p className="mt-1 text-xs text-[#5b5e56]">
                  What applies today, why it governs, and the exact official
                  page.
                </p>
              </div>
            </div>
          </figure>
        </section>

        {/* 02 / Follow one rule: FAR */}
        <section
          aria-labelledby="section-02-heading"
          className="border-b border-[#c8ccc0] py-14 md:py-16"
        >
          <div className="dg-mono text-[#5b5e56]">02 / Follow one rule</div>
          <h2
            id="section-02-heading"
            className="mt-2 text-2xl font-semibold tracking-tight text-[#080909] md:text-3xl"
          >
            How FAR came to be what it is today.
          </h2>
          <p className="dg-serif mt-3 text-base leading-relaxed text-[#171917]">
            Floor area ratio (FAR) sets how much total floor space may be built
            relative to a plot&apos;s area. Tracing that single rule shows how five
            instruments across twenty-two years fit together.
          </p>

          <div className="mt-8">
            <FarStoryStepper steps={farSteps} />
          </div>
        </section>

        {/* 03 / The code, by subject */}
        <section
          aria-labelledby="section-03-heading"
          className="border-b border-[#c8ccc0] py-14 md:py-16"
        >
          <div className="dg-mono text-[#5b5e56]">
            03 / The code, by subject
          </div>
          <h2
            id="section-03-heading"
            className="mt-2 text-2xl font-semibold tracking-tight text-[#080909] md:text-3xl"
          >
            The code, by subject.
          </h2>
          <p className="dg-serif mt-3 text-base leading-relaxed text-[#171917]">
            Each subject brings together the governing rule today, the reason it
            prevails, and every source table and provision.
          </p>

          <ul
            data-testid="home-subject-list"
            className="mt-8 divide-y divide-[#c8ccc0] border-y border-[#c8ccc0]"
          >
            {CODE_SUBJECTS.map((subj, idx) => (
              <li
                key={subj.slug}
                className="flex flex-col justify-between gap-2 py-4 md:flex-row md:items-baseline md:gap-6"
              >
                <div className="space-y-1">
                  <div className="flex items-baseline gap-3">
                    <span className="dg-mono text-[#5b5e56]">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <Link
                      href={`/j/${targetJurId}/topics/${subj.slug}`}
                      className="text-lg font-semibold text-[#080909] underline decoration-[#c8ccc0] underline-offset-4 hover:decoration-[#080909]"
                    >
                      {subj.title}
                    </Link>
                  </div>
                  <p className="dg-serif text-sm text-[#171917]">
                    {subj.summary}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-4">
                  {subj.hasMapLink && (
                    <Link
                      href={`/j/${targetJurId}`}
                      className="inline-flex min-h-[44px] items-center font-mono text-xs uppercase tracking-[0.12em] text-[#5b5e56] underline decoration-[#c8ccc0] underline-offset-4 hover:text-[#080909]"
                    >
                      Open map
                    </Link>
                  )}
                  <Link
                    href={`/j/${targetJurId}/topics/${subj.slug}`}
                    className="inline-flex min-h-[44px] items-center font-mono text-xs uppercase tracking-[0.12em] text-[#080909] underline decoration-[#080909] underline-offset-4"
                  >
                    Read {subj.title} →
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* 04 / Recently changed */}
        <section
          aria-labelledby="section-04-heading"
          className="border-b border-[#c8ccc0] py-14 md:py-16"
        >
          <div className="dg-mono text-[#5b5e56]">04 / Recently changed</div>
          <h2
            id="section-04-heading"
            className="mt-2 text-2xl font-semibold tracking-tight text-[#080909] md:text-3xl"
          >
            What changed recently.
          </h2>
          <p className="dg-serif mt-3 text-base leading-relaxed text-[#171917]">
            The newest in-force amendments, notifications, and enactments
            affecting buildings in {cityLabel}.
          </p>

          <ul
            data-testid="home-recently-changed"
            className="mt-8 divide-y divide-[#c8ccc0] border-y border-[#c8ccc0]"
          >
            {recentChanges.map((doc) => {
              const effDate = doc.effective_from || doc.notified_date;
              const isMay2026Corp = doc.doc_id.endsWith("-bbl-amend-2026-05");
              const title = isMay2026Corp
                ? "Five City Corporations Building (Amendment) Bye-laws 2026 (Central, North, South, East, West)"
                : formatPlainDocumentTitle(doc);
              const summary = isMay2026Corp
                ? "Amends Bye-law 6.0(i), Schedule-IV, and Tables 2A–2D for compounding and occupancy rules across each of the five City Corporations."
                : formatPlainWhatChangedSummary(doc);
              const textHeld = isDocumentTextHeld(doc);

              return (
                <li key={doc.doc_id} className="py-5">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="dg-mono text-[#5b5e56]">
                      {formatHumanDate(effDate)} ·{" "}
                      {formatPlainInstrumentStatus(doc)}
                    </span>
                    {textHeld && (
                      <Link
                        href={`/j/${targetJurId}/documents/${doc.doc_id}`}
                        className="inline-flex min-h-[44px] items-center font-mono text-xs uppercase tracking-[0.12em] text-[#080909] underline decoration-[#080909] underline-offset-4"
                      >
                        Open document →
                      </Link>
                    )}
                  </div>
                  <h3 className="mt-1 text-lg font-semibold text-[#080909]">
                    {textHeld ? (
                      <Link
                        href={`/j/${targetJurId}/documents/${doc.doc_id}`}
                        className="text-[#080909] no-underline hover:underline"
                      >
                        {title}
                      </Link>
                    ) : (
                      title
                    )}
                  </h3>
                  <div className="mt-2">
                    <span className="dg-mono mr-2 text-[#5b5e56]">
                      In short, by this site:
                    </span>
                    <span className="dg-serif text-sm text-[#171917]">
                      {summary}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="mt-6">
            <Link
              href={`/j/${targetJurId}/timeline`}
              className="inline-flex min-h-[44px] items-center font-mono text-xs uppercase tracking-[0.12em] text-[#080909] underline decoration-[#080909] underline-offset-4"
            >
              All changes →
            </Link>
          </div>
        </section>

        {/* Questions people ask */}
        <section
          aria-labelledby="faq-heading"
          className="border-b border-[#c8ccc0] py-14 md:py-16"
        >
          <div className="dg-mono text-[#5b5e56]">Questions people ask</div>
          <h2
            id="faq-heading"
            className="mt-2 text-2xl font-semibold tracking-tight text-[#080909] md:text-3xl"
          >
            How this site works.
          </h2>

          <div className="mt-6 divide-y divide-[#c8ccc0] border-y border-[#c8ccc0]">
            <details className="py-3">
              <summary className="flex min-h-[44px] cursor-pointer items-center justify-between font-medium text-[#080909]">
                <span>Is this official?</span>
              </summary>
              <p className="dg-serif mt-2 pb-2 text-sm leading-relaxed text-[#171917]">
                No. Bylaw One is an independent reference worked out from
                official Gazette notifications, master plan regulations,
                municipal building bye-laws, and state Acts. Every provision
                links directly to the official PDF page and an archived copy so
                you can verify it against the government publication.
              </p>
            </details>

            <details className="py-3">
              <summary className="flex min-h-[44px] cursor-pointer items-center justify-between font-medium text-[#080909]">
                <span>Where does the text come from?</span>
              </summary>
              <p className="dg-serif mt-2 pb-2 text-sm leading-relaxed text-[#171917]">
                Every instrument is acquired from official Gazette, development
                authority, or municipal publications, verified by cryptographic
                checksum, and preserved in the Internet Archive. A machine
                fidelity check verifies that every provision and excerpt matches
                the extracted text of its cited source page.
              </p>
            </details>

            <details className="py-3">
              <summary className="flex min-h-[44px] cursor-pointer items-center justify-between font-medium text-[#080909]">
                <span>What happens when rules disagree?</span>
              </summary>
              <p className="dg-serif mt-2 pb-2 text-sm leading-relaxed text-[#171917]">
                The site applies a stated six-step statutory order and shows
                both the governing rule and the older or replaced rules. Under
                Bye-law 1.4 (from Notification UDD 14 TTP 2017), the Master Plan
                Zoning Regulations and their later in-force amendments govern
                land use, coverage, FAR, setbacks, height, floors, dwelling
                units, and parking.
              </p>
            </details>

            <details className="py-3">
              <summary className="flex min-h-[44px] cursor-pointer items-center justify-between font-medium text-[#080909]">
                <span>What is missing?</span>
              </summary>
              <ul className="dg-serif mt-2 list-disc space-y-1.5 pb-2 pl-5 text-sm leading-relaxed text-[#171917]">
                {missingItems.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </details>
          </div>
        </section>

        {/* Closing */}
        <section
          aria-labelledby="closing-heading"
          className="py-16 text-left md:py-20"
        >
          <h2
            id="closing-heading"
            className="text-3xl font-semibold tracking-tight text-[#080909] md:text-4xl"
          >
            Read. Trace. Compare.
          </h2>
          <div className="mt-6">
            <Link
              href={`/j/${targetJurId}/topics`}
              className="inline-flex min-h-[44px] items-center border border-[#080909] bg-[#080909] px-6 py-2.5 font-mono text-xs uppercase tracking-[0.12em] text-[#f5f3ed] no-underline hover:bg-[#171917]"
            >
              Read the code
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
