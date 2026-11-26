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

function extractVerbatimSubstring(
  clauses: ReadonlyArray<ClauseNode>,
  docId: string,
  eid: string,
  targetSubstring: string
): { excerpt: string | null; page: number; pdfUrl: string } {
  const node = clauses.find((c) => c.doc_id === docId && c.eid === eid);
  const cit = node?.citations?.[0];
  const page = cit?.page ?? 1;
  const pdfUrl =
    node?.official_url || node?.source_url
      ? `${node.official_url || node.source_url}#page=${page}`
      : `/j/in-ka-bengaluru/documents/${docId}#node-${eid}`;

  if (!node || !node.text) {
    return { excerpt: null, page, pdfUrl };
  }
  const normalizedNode = node.text.replace(/\s+/g, " ").trim();
  const normalizedTarget = targetSubstring.replace(/\s+/g, " ").trim();
  if (normalizedNode.includes(normalizedTarget)) {
    return { excerpt: normalizedTarget, page, pdfUrl };
  }
  return { excerpt: normalizedNode, page, pdfUrl };
}

function buildHomeFarStorySteps(
  clauses: ReadonlyArray<ClauseNode>,
  documents: ReadonlyArray<DocumentMetadata>,
  parametersPayload: JurisdictionParameters | null,
  jurId: string
): FarStoryStep[] {
  const docById = new Map(documents.map((d) => [d.doc_id, d]));
  const allParams = (parametersPayload?.records ?? []).filter(
    isPlausibleParameterRecord
  );

  // Step 1: 2004 BBL 2003 Bye-law 9.2
  const s1Quote =
    "The set backs required on all the sides of building/s, maximum plot coverage, maximum FAR, maximum number of floors, maximum height of buildings that are permissible for different dimensioned sites and widths of roads are set out in Tables 4, 5 and 6 given below.";
  const s1 = extractVerbatimSubstring(
    clauses,
    "bbl-2003",
    "part_III__sec_9.0__cl_9.2",
    s1Quote
  );
  const bblDoc = docById.get("bbl-2003");
  const bblPdfBase = bblDoc?.official_url || bblDoc?.source_url || "";
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

  // Step 2: 2007 RMP 2015 Zoning Regulations Chapter 4 (Residential Main Table 10)
  const s2Quote =
    "The areas of the city which have predominantly residential land use pattern is considered for the Residential (Main) zone. This includes many old areas of the city such as Parts of Malleswaram, Richmond Town, Vasant Nagar, Jayanagar, Vijayanagar, Visveswarapura, Rajajinagar, RT Nagar, etc.";
  const s2 = extractVerbatimSubstring(
    clauses,
    "rmp2015-zr",
    "chp_4__cl_4.1__cl_4.1.1",
    s2Quote
  );
  const rmpDoc = docById.get("rmp2015-zr");
  const rmpPdfBase = rmpDoc?.official_url || rmpDoc?.source_url || "";
  const tbl10Far = allParams.filter(
    (r) =>
      r.source.doc_id === "rmp2015-zr" &&
      r.parameter === "far_base_max" &&
      (r.source.table_eid === "chp_4__cl_4.1__cl_4.1.3__tbl_10" ||
        r.source.table_eid === "chp_4__cl_4.1__cl_4.1.3__tbl_1")
  );
  const tbl10CovByRow = new Map<number, string>();
  for (const r of allParams) {
    if (
      r.source.doc_id === "rmp2015-zr" &&
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
  const s3Quote =
    "All mandatory Master Plan or Zonal Regulations regarding use, land use, coverage, FAR, setback or open space, height, number of stories, number of dwelling units, parking standards etc. for various categories of buildings including modification therein made from time to time shall be applicable mutatis mutandis in these Bye-Laws under this clause. All amendments or modifications made in the aforesaid regulations shall automatically stand deemed to have been included as part of these Bye-laws.";
  const s3 = extractVerbatimSubstring(
    clauses,
    "bbl-2003",
    "part_I__sec_1.0__cl_1.4",
    s3Quote
  );
  const modelDoc = docById.get("ka-model-bbl-2017");
  const modelPdfBase =
    modelDoc?.official_url || modelDoc?.source_url || bblPdfBase;

  // Step 4: 2025 Premium FAR Chapter 11
  const s4Quote =
    "The Premium F.A.R by levy of premium charges is the additional F.A.R granted over and above the ordinarily permissible F.A.R, on the basis of levy of premium charges by the Authority who accords permission for development of building or land under section 15 of the Karnataka Town and Country Planning Act, 1961, and in the areas as specified under regulation 2 below.";
  const s4 = extractVerbatimSubstring(
    clauses,
    "rmp2015-zr-amend-2025-04",
    "chp_11_2",
    s4Quote
  );
  const pfarDoc = docById.get("rmp2015-zr-amend-2025-04");
  const pfarPdfBase = pfarDoc?.official_url || pfarDoc?.source_url || "";
  const pfarRecs = allParams.filter(
    (r) =>
      r.source.doc_id === "rmp2015-zr-amend-2025-04" &&
      r.parameter === "far_premium_additional_max"
  );
  const tdrByRow = new Map<number, string>();
  for (const r of allParams) {
    if (
      r.source.doc_id === "rmp2015-zr-amend-2025-04" &&
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
  const s5Quote =
    "The maximum additional FAR allowed for a given building site shall not be more than 60% of the regular FAR otherwise allowed free of cost. This could be availed either as combination of Premium FAR and TDR/ DRC as given in Table above or purely through purchase of the DRC/ TDR.";
  const s5 = extractVerbatimSubstring(
    clauses,
    "rmp2015-zr-amend-2025-04",
    "chp_11_2__note_2",
    s5Quote
  );
  const s5Rows: FarStoryTableRow[] = [
    {
      condition: "Base FAR (by zone, plot size and road width)",
      values: ["1.0 to 3.25", "RMP 2015 Zoning Regulations (via Bye-law 1.4)"],
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

  return [
    {
      stepNumber: 1,
      heading: "2004. The bye-laws set FAR.",
      inShortBySite:
        "The Building Bye-laws 2003 (in operation from 5 June 2004) set FAR in their own tables (bye-law 9.2, Tables 4 to 6).",
      verbatimExcerpt: s1.excerpt ?? s1Quote,
      documentTitle:
        "Bengaluru Mahanagara Palike Building Bye-Laws 2003 (Bye-law 9.2)",
      documentDate: "5 June 2004",
      pageNumber: 21,
      viewPageUrl: bblPdfBase ? `${bblPdfBase}#page=21` : s1.pdfUrl,
      documentHref: `/j/${jurId}/documents/bbl-2003#node-part_III__sec_9.0__cl_9.2`,
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
        "The RMP 2015 Zoning Regulations set FAR by zone, plot size and road width (Chapter 4, Table 10).",
      verbatimExcerpt: s2.excerpt ?? s2Quote,
      documentTitle:
        "Revised Master Plan 2015 — Zoning of Land Use and Regulations (Chapter 4)",
      documentDate: "25 June 2007",
      pageNumber: 28,
      viewPageUrl: rmpPdfBase ? `${rmpPdfBase}#page=28` : s2.pdfUrl,
      documentHref: `/j/${jurId}/documents/rmp2015-zr#node-chp_4__cl_4.1__cl_4.1.3__tbl_10`,
      tableCaption:
        "Derived by this site · Residential (Main) base FAR and coverage (Table 10)",
      tableHeaders: ["Zone, plot size and road width", "Coverage", "Base FAR", "Source"],
      tableRows: s2Rows,
    },
    {
      stepNumber: 3,
      heading: "2017. The bye-laws hand FAR to the master plan.",
      inShortBySite:
        "Bye-law 1.4, from notification UDD 14 TTP 2017, makes the master plan rules govern use, coverage, FAR, setbacks, height, floors, dwelling units and parking.",
      verbatimExcerpt: s3.excerpt ?? s3Quote,
      documentTitle:
        "Building Bye-Laws 2003 — Bye-law 1.4 (from Notification UDD 14 TTP 2017)",
      documentDate: "28 October 2017",
      pageNumber: 2,
      viewPageUrl: modelPdfBase ? `${modelPdfBase}#page=2` : s3.pdfUrl,
      documentHref: `/j/${jurId}/documents/bbl-2003#node-part_I__sec_1.0__cl_1.4`,
    },
    {
      stepNumber: 4,
      heading: "2025. Premium FAR is added.",
      inShortBySite:
        "The premium FAR chapter (Chapter 11, notified 2 April 2025) allows extra FAR on payment, by road width.",
      verbatimExcerpt: s4.excerpt ?? s4Quote,
      documentTitle:
        "RMP 2015 Zoning Regulations (Amendment) — Chapter 11 Premium FAR",
      documentDate: "2 April 2025",
      pageNumber: 2,
      viewPageUrl: pfarPdfBase ? `${pfarPdfBase}#page=2` : s4.pdfUrl,
      documentHref: `/j/${jurId}/documents/rmp2015-zr-amend-2025-04#node-chp_11_2`,
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
      verbatimExcerpt: s5.excerpt ?? s5Quote,
      documentTitle:
        "RMP 2015 Zoning Regulations — Chapter 11, Note 2 (Combined FAR Cap)",
      documentDate: "2 April 2025",
      pageNumber: 3,
      viewPageUrl: pfarPdfBase ? `${pfarPdfBase}#page=3` : s5.pdfUrl,
      documentHref: `/j/${jurId}/topics/far`,
      tableCaption: "Derived by this site · How FAR rules combine today",
      tableHeaders: ["Component", "Allowance", "Governing instrument", "Source"],
      tableRows: s5Rows,
    },
  ];
}

export default async function HomePage() {
  const { visibleJurisdictions } = await getHomePageProps();
  const parentJurisdiction =
    visibleJurisdictions.find((j) => j.id === "in-ka-bengaluru") ??
    visibleJurisdictions.find((j) =>
      visibleJurisdictions.some((child) => child.parent === j.id)
    ) ??
    visibleJurisdictions[0];

  const targetJurId = parentJurisdiction?.id ?? "in-ka-bengaluru";
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

  // Newest 4 in-force instruments for 04 / Recently changed (collapsing the 5 May 2026 corporation amendments into one clean entry or showing the distinct recent changes)
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

  // Select up to 5 distinct recent changes (representing the 14 May 2026 City Corporation amendments + Jan 2026 + Oct 2025 + Jul 2025 Order + May 2025 Act)
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

  // Convergence illustration lines (newest first)
  const convergenceItems = [
    {
      year: "May 2026",
      label: "City Corporation Building (Amendment) Bye-laws",
    },
    {
      year: "Jan 2026",
      label: "RMP 2015 Setbacks, Basements and Ramps Amendment",
    },
    {
      year: "Oct 2025",
      label: "RMP 2015 Storm-Water Drain Buffer Notification",
    },
    {
      year: "Jul 2025",
      label: "Government Order on e-Khata and Plan Approval",
    },
    {
      year: "May 2025",
      label: "Greater Bengaluru Governance Act 2024",
    },
    {
      year: "Apr 2025",
      label: "RMP 2015 Chapter 11 Premium FAR and TDR Notification",
    },
    {
      year: "Oct 2017",
      label: "Notification UDD 14 TTP 2017 (Bye-law 1.4 incorporation)",
    },
    {
      year: "Jun 2007",
      label: "Revised Master Plan 2015 Zoning Regulations",
    },
    {
      year: "Jun 2004",
      label: "Bengaluru Mahanagara Palike Building Bye-Laws 2003",
    },
  ];

  // Plain-English missing items from declarations
  const missingItems: string[] = [];
  if (declarations) {
    for (const u of declarations.unobtainable_documents ?? []) {
      if (u.legal_status === "draft") continue;
      missingItems.push(
        "The 18 July 2025 Karnataka Gazette zoning amendment (referenced in later notifications) has not yet been obtained from official archives."
      );
    }
  }
  if (missingItems.length === 0) {
    missingItems.push(
      "The 18 July 2025 Karnataka Gazette zoning amendment (referenced in later notifications) has not yet been obtained from official archives."
    );
  }
  missingItems.push(
    "Georeferenced Proposed Land Use map polygons are currently published for four sheets in Planning Districts 2.10 (Jayanagar) and 2.11 (Banashankari) in Bengaluru South; the remaining planning districts are not yet georeferenced."
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
          <div className="dg-mono text-[#5b5e56]">Bylaw One · Greater Bengaluru</div>
          <h1
            id="hero-heading"
            className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight text-[#080909] md:text-5xl"
          >
            Bengaluru&apos;s building rules. One code.
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
              <div className="border-l-4 border-l-[#ff6b52] border border-[#080909] bg-[#f5f3ed] p-4">
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
            affecting buildings in Bengaluru.
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
                Every instrument is acquired from official Karnataka Gazette,
                Bangalore Development Authority, or Greater Bengaluru / BBMP
                publications, verified by cryptographic checksum, and preserved
                in the Internet Archive. A machine fidelity check verifies that
                every provision and excerpt matches the extracted text of its
                cited source page.
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
