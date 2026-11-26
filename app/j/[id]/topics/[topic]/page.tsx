import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  fetchJurisdictionDataset,
  fetchManifest,
  fetchParameters,
  type ClauseNode,
} from "@/lib/data";
import { TopNav } from "@/components/TopNav";
import {
  formatHumanDate,
  formatPlainQuantity,
  truncateAtWordBoundary,
} from "@/lib/plain-language";

interface TopicDetailPageProps {
  params: Promise<{ id: string; topic: string }>;
}

export const dynamicParams = false;

export async function generateStaticParams() {
  const manifest = await fetchManifest();
  const paramsList: Array<{ id: string; topic: string }> = [];
  for (const j of manifest.jurisdictions) {
    const ds = await fetchJurisdictionDataset(j.id);
    const topics = ds?.relations?.topics ?? [];
    for (const t of topics) {
      paramsList.push({ id: j.id, topic: t.id });
    }
  }
  return paramsList;
}

const ZONING_GOVERNED_TOPICS = new Set([
  "land_use",
  "far",
  "ground_coverage",
  "setbacks",
  "building_height",
  "parking",
  "plot_size_frontage",
  "road_width",
  "basements_stilts",
  "projections_open_spaces",
]);

const TOPIC_TO_PARAM_KINDS: Record<string, string[]> = {
  ground_coverage: ["ground_coverage_max_pct"],
  far: ["far_base_max", "far_premium_additional_max", "tdr_receivable_max"],
  setbacks: ["setback_front_min_m", "setback_rear_min_m", "setback_side_min_m"],
  building_height: ["building_height_max_m", "floors_max"],
  parking: ["parking_requirement"],
};

export default async function TopicDetailPage({
  params,
}: TopicDetailPageProps) {
  const { id, topic } = await params;
  const [dataset, parametersPayload] = await Promise.all([
    fetchJurisdictionDataset(id),
    fetchParameters(id).catch(() => null),
  ]);
  if (!dataset || !dataset.relations) {
    notFound();
  }

  const {
    jurisdiction,
    release,
    documents,
    clauses,
    annotationsByDocId,
    relations,
  } = dataset;

  const topicDef = relations.topics.find((t) => t.id === topic);
  if (!topicDef) {
    notFound();
  }

  const docMetaById = new Map(documents.map((d) => [d.doc_id, d]));

  // Collect all provisions tagged with this topic (excluding non-content nodes per Part 3)
  const taggedNodeKeys = new Set<string>();
  const quantitiesByNodeKey = new Map<string, string[]>();
  for (const [docId, anns] of Object.entries(annotationsByDocId)) {
    for (const ann of anns) {
      const nKey = `${docId}:${ann.target.eid}`;
      if (ann.kind === "topic" && ann.value === topic) {
        if (
          !ann.target.eid.startsWith("pref_") &&
          !ann.target.eid.startsWith("prea_") &&
          !ann.target.eid.startsWith("sig_")
        ) {
          taggedNodeKeys.add(nKey);
        }
      } else if (ann.kind === "quantity") {
        const list = quantitiesByNodeKey.get(nKey) ?? [];
        const formattedQty = formatPlainQuantity(ann.value);
        if (!list.includes(formattedQty)) {
          list.push(formattedQty);
          quantitiesByNodeKey.set(nKey, list);
        }
      }
    }
  }

  const taggedClauses: ClauseNode[] = clauses.filter(
    (c) =>
      !c.superseded_by &&
      !c.record_superseded_by &&
      c.type !== "preface" &&
      c.type !== "preamble" &&
      c.type !== "signature_block" &&
      c.type !== "table_row" &&
      taggedNodeKeys.has(`${c.doc_id}:${c.eid}`)
  );

  // Partition into:
  // 1. What applies today (governing in-force provisions)
  // 2. Older or replaced rules (drafts, superseded documents, or 2003 bye-law parameter rules replaced by Zoning Regulations via Bye-law 1.4)
  // 3. Related provisions (ancillary / supporting provisions)
  const isZoningTopic = ZONING_GOVERNED_TOPICS.has(topic);
  const whatAppliesToday: ClauseNode[] = [];
  const olderOrReplacedRules: ClauseNode[] = [];
  const relatedProvisions: ClauseNode[] = [];

  for (const node of taggedClauses) {
    const dMeta = docMetaById.get(node.doc_id ?? "");
    const isDraftOrSuperseded =
      node.legal_status === "draft" ||
      node.legal_status === "superseded" ||
      dMeta?.legal_status === "draft" ||
      dMeta?.legal_status === "superseded" ||
      Boolean(dMeta?.superseded_by_document);

    if (isDraftOrSuperseded) {
      olderOrReplacedRules.push(node);
      continue;
    }

    if (isZoningTopic && dMeta?.layer === "municipal" && dMeta?.role === "base") {
      // On zoning-governed parameters, base municipal bye-law parameter tables are superseded by Master Plan Zoning Regulations under Bye-law 1.4
      olderOrReplacedRules.push(node);
      continue;
    }

    if (
      (isZoningTopic && dMeta?.layer === "planning") ||
      (!isZoningTopic &&
        (dMeta?.layer === "municipal" ||
          dMeta?.layer === "statute" ||
          dMeta?.layer === "orders"))
    ) {
      if (whatAppliesToday.length < 14) {
        whatAppliesToday.push(node);
      } else {
        relatedProvisions.push(node);
      }
    } else {
      relatedProvisions.push(node);
    }
  }

  if (whatAppliesToday.length === 0 && relatedProvisions.length > 0) {
    whatAppliesToday.push(...relatedProvisions.splice(0, 10));
  }

  // Governing parameter values for this topic (if applicable)
  const paramKindsForTopic = TOPIC_TO_PARAM_KINDS[topic] ?? [];
  const sampleParameters = (parametersPayload?.records ?? [])
    .filter(
      (r) =>
        paramKindsForTopic.includes(r.parameter) &&
        r.legal_status === "in_force" &&
        !r.valid_to &&
        docMetaById.get(r.source.doc_id)?.layer === "planning"
    )
    .slice(0, 6);

  const topicRelations = relations.relations.filter(
    (r) => r.topic === topic && r.public_visible !== false
  );
  const diffRelations = topicRelations.filter(
    (r) =>
      r.kind === "incorporates" ||
      r.kind === "amends" ||
      r.kind === "corporation_differs"
  );

  function renderProvisionItem(node: ClauseNode, noteWhyOlder?: string) {
    const docId = node.doc_id ?? "";
    const dMeta = docMetaById.get(docId);
    const nKey = `${docId}:${node.eid}`;
    const qtys = quantitiesByNodeKey.get(nKey) ?? [];
    const lastVer =
      node.versions && node.versions.length > 0
        ? node.versions[node.versions.length - 1]
        : null;
    const rawTxt = (lastVer?.content || node.content || node.text || "").trim();
    const rawHeading = (node.heading || "").trim();
    const showHeading =
      rawHeading &&
      rawHeading.toLowerCase() !== rawTxt.toLowerCase() &&
      !rawTxt.toLowerCase().startsWith(rawHeading.toLowerCase());
    const displayTxt = truncateAtWordBoundary(rawTxt, 340);
    const effDate = dMeta?.effective_from || dMeta?.notified_date;

    return (
      <li key={`${docId}:${node.eid}`} className="py-3.5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <span className="font-mono text-xs font-semibold text-[#080909]">
              {node.native_number ?? node.number}
            </span>
            {showHeading && (
              <span className="ml-1.5 font-semibold text-[#080909]">
                {rawHeading}
              </span>
            )}
            <span className="ml-2 text-xs text-[#5b5e56]">
              · {dMeta?.title ?? "Official instrument"}
              {effDate ? ` (${formatHumanDate(effDate)})` : ""}
            </span>
          </div>
          {qtys.length > 0 && (
            <div className="flex flex-wrap gap-1.5 font-mono text-[10px]">
              {qtys.slice(0, 4).map((q) => (
                <span
                  key={q}
                  className="border border-[#080909] bg-[#efeee8] px-1.5 py-0.5"
                >
                  {q}
                </span>
              ))}
            </div>
          )}
        </div>

        <p className="dg-serif mt-1 text-sm text-[#171917]">{displayTxt}</p>

        {noteWhyOlder && (
          <p className="mt-1 font-mono text-[10.5px] text-[#5b5e56]">
            {noteWhyOlder}
          </p>
        )}

        <details className="mt-1.5">
          <summary className="cursor-pointer font-mono text-[10px] uppercase tracking-[0.12em] text-[#5b5e56] underline">
            Details, document link &amp; local graph
          </summary>
          <div className="mt-1 flex flex-wrap items-center gap-3 font-mono text-[10.5px] text-[#5b5e56]">
            <Link
              href={`/j/${jurisdiction.id}/documents/${docId}#node-${node.eid}`}
              className="text-[#080909] underline"
            >
              Read in document →
            </Link>
            <Link
              href={`/j/${jurisdiction.id}/documents/${docId}/${node.eid}`}
              className="text-[#080909] underline"
            >
              Local graph →
            </Link>
            <span>Address: {node.eid}</span>
          </div>
        </details>
      </li>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f3ed] text-[#080909]">
      <TopNav
        jurisdictionId={jurisdiction.id}
        jurisdictionName={jurisdiction.name}
        active="topics"
        releaseVersion={release?.version}
        licence={release?.licence}
      />

      <main className="mx-auto max-w-6xl space-y-8 px-6 py-8">
        <div>
          <Link
            href={`/j/${jurisdiction.id}/topics`}
            className="font-mono text-xs uppercase tracking-[0.12em] text-[#5b5e56] underline hover:text-[#080909]"
          >
            ← Back to Rules by Subject ({jurisdiction.name})
          </Link>
        </div>

        <header className="border-b border-[#080909] pb-6">
          <div className="dg-mono">Rules by Subject · What Applies Today</div>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-[#080909]">
            {topicDef.label}
          </h1>
          <p className="dg-serif mt-2 max-w-3xl text-base text-[#171917]">
            {topicDef.description}
          </p>
        </header>

        {/* 1. What Applies Today */}
        <section
          aria-label="What applies today"
          className="border border-[#080909] bg-[#f5f3ed] p-6"
        >
          <div className="dg-mono mb-1">1 · What Applies Today</div>
          <h2 className="text-xl font-semibold text-[#080909]">
            Current In-Force Rules ({whatAppliesToday.length})
          </h2>
          <p className="dg-serif mt-1 text-sm text-[#171917]">
            {isZoningTopic
              ? "Under Building Bye-law 1.4 (from the 2017 notification), the Revised Master Plan 2015 Zoning Regulations and their in-force amendments govern this subject today."
              : "The following in-force provisions govern this subject today in this jurisdiction."}
          </p>

          {sampleParameters.length > 0 && (
            <div className="mt-4 border border-[#c8ccc0] bg-[#efeee8] p-4">
              <div className="dg-mono mb-2 text-[10px] text-[#080909]">
                Key Governing Values from In-Force Tables
              </div>
              <div className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-2 lg:grid-cols-3">
                {sampleParameters.map((rec) => (
                  <div
                    key={rec.parameter_id}
                    className="border border-[#c8ccc0] bg-[#f5f3ed] p-2.5"
                  >
                    <div className="font-mono text-xs font-bold text-[#080909]">
                      {rec.value_text}
                    </div>
                    <div className="mt-0.5 text-[11px] text-[#5b5e56]">
                      {rec.source.row_header
                        ? `${rec.source.row_header} · `
                        : ""}
                      {rec.source.table_id ?? "In-force table"} (p.{" "}
                      {rec.source.page})
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <ul className="mt-4 divide-y divide-[#c8ccc0]">
            {whatAppliesToday.map((node) => renderProvisionItem(node))}
          </ul>
        </section>

        {/* Resolution Cards (state what governs, the value if known, and why in one line; tap to expand both provisions & authority) */}
        {diffRelations.length > 0 && (
          <section
            aria-label="Statutory resolution cards"
            className="border border-[#080909] bg-[#efeee8] p-6"
          >
            <div className="dg-mono mb-1">
              Resolution Cards ({diffRelations.length})
            </div>
            <h2 className="text-xl font-semibold text-[#080909]">
              Which Rule Governs When Multiple Instruments Speak
            </h2>
            <p className="dg-serif mt-1 text-sm text-[#171917]">
              Each card states which instrument governs and why in one line; tap
              to compare both provisions and read the statutory authority.
            </p>

            <div className="mt-4 space-y-3">
              {diffRelations.slice(0, 12).map((rel) => {
                const isCorpDiff = rel.kind === "corporation_differs";
                const isIncorp = rel.kind === "incorporates";
                const fromTitle =
                  docMetaById.get(rel.from_doc)?.title ?? rel.from_doc;
                const toTitle =
                  docMetaById.get(rel.to_doc)?.title ?? rel.to_doc;

                const governsSummary = isIncorp
                  ? `Master Plan Zoning Regulations (${toTitle}) govern over the 2003 Building Bye-laws`
                  : isCorpDiff
                    ? `Each City Corporation's May 2026 Amendment Bye-laws govern inside that corporation`
                    : `${fromTitle} governs over the earlier wording in ${toTitle}`;

                const whyLine = isIncorp
                  ? "Building Bye-law 1.4 (from the 2017 notification) incorporates Master Plan Zoning Regulations for use, coverage, FAR, setbacks, height, floors, dwelling units, and parking."
                  : isCorpDiff
                    ? "Enacted under Section 317 read with Section 224 of the enabling municipal governance statute for each City Corporation."
                    : "Within the same instrument family, the later in-force amendment substitutes or modifies the earlier provision.";

                const cleanFrom = truncateAtWordBoundary(rel.from_span, 240);
                const cleanTo = truncateAtWordBoundary(rel.to_span, 240);

                return (
                  <article
                    key={rel.id}
                    className="border border-[#080909] bg-[#f5f3ed] p-4"
                  >
                    <div className="text-sm font-semibold text-[#080909]">
                      {governsSummary}
                    </div>
                    <p className="dg-serif mt-1 text-xs text-[#171917]">
                      {whyLine}
                    </p>

                    <details className="mt-2 border-t border-[#c8ccc0] pt-2">
                      <summary className="cursor-pointer font-mono text-[10.5px] uppercase tracking-[0.12em] text-[#080909] underline">
                        Compare both provisions &amp; quoted authority
                      </summary>
                      <div className="mt-2 grid grid-cols-1 gap-3 md:grid-cols-2">
                        <div className="border border-[#c8ccc0] bg-[#efeee8] p-3">
                          <div className="font-mono text-xs font-semibold">
                            <Link
                              href={`/j/${jurisdiction.id}/documents/${rel.from_doc}#node-${rel.from_eid}`}
                              className="underline"
                            >
                              {fromTitle}
                            </Link>
                          </div>
                          <p className="dg-serif mt-1 text-xs text-[#171917]">
                            {cleanFrom}
                          </p>
                        </div>
                        <div className="border border-[#c8ccc0] bg-[#efeee8] p-3">
                          <div className="font-mono text-xs font-semibold">
                            <Link
                              href={`/j/${jurisdiction.id}/documents/${rel.to_doc}#node-${rel.to_eid}`}
                              className="underline"
                            >
                              {toTitle}
                            </Link>
                          </div>
                          <p className="dg-serif mt-1 text-xs text-[#171917]">
                            {cleanTo}
                          </p>
                        </div>
                      </div>
                      {rel.precedence_span && (
                        <p className="dg-serif mt-2 border-l-2 border-[#080909] pl-3 text-xs italic text-[#080909]">
                          Quoted authority: &ldquo;
                          {truncateAtWordBoundary(rel.precedence_span, 260)}
                          &rdquo;
                        </p>
                      )}
                    </details>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {/* 2. Older or Replaced Rules (collapsed by default) */}
        {olderOrReplacedRules.length > 0 && (
          <details
            data-testid="older-or-replaced-rules"
            className="border border-[#080909] bg-[#efeee8] p-5"
          >
            <summary className="cursor-pointer font-mono text-xs font-semibold uppercase tracking-[0.12em] text-[#080909]">
              Older or replaced rules ({olderOrReplacedRules.length})
            </summary>
            <p className="dg-serif mt-2 text-xs text-[#5b5e56]">
              These provisions are from earlier 2003 bye-law tables superseded by
              the Master Plan Zoning Regulations under Bye-law 1.4, or from
              draft notifications that are not in force.
            </p>
            <ul className="mt-3 divide-y divide-[#c8ccc0]">
              {olderOrReplacedRules
                .slice(0, 20)
                .map((node) =>
                  renderProvisionItem(
                    node,
                    node.legal_status === "draft"
                      ? "Draft notification — not in force."
                      : "Replaced on this subject by the Master Plan Zoning Regulations under Bye-law 1.4."
                  )
                )}
            </ul>
          </details>
        )}

        {/* 3. Related Provisions (collapsed by default) */}
        {relatedProvisions.length > 0 && (
          <details
            data-testid="related-provisions"
            className="border border-[#080909] bg-[#f5f3ed] p-5"
          >
            <summary className="cursor-pointer font-mono text-xs font-semibold uppercase tracking-[0.12em] text-[#080909]">
              Related provisions ({relatedProvisions.length})
            </summary>
            <ul className="mt-3 divide-y divide-[#c8ccc0]">
              {relatedProvisions
                .slice(0, 20)
                .map((node) => renderProvisionItem(node))}
            </ul>
          </details>
        )}
      </main>
    </div>
  );
}
