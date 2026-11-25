import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  fetchJurisdictionDataset,
  fetchManifest,
  type ClauseNode,
} from "@/lib/data";
import { TopNav } from "@/components/TopNav";

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

export default async function TopicDetailPage({
  params,
}: TopicDetailPageProps) {
  const { id, topic } = await params;
  const dataset = await fetchJurisdictionDataset(id);
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

  // Collect all provisions tagged with this topic
  const taggedNodeKeys = new Set<string>();
  const quantitiesByNodeKey = new Map<string, string[]>();
  for (const [docId, anns] of Object.entries(annotationsByDocId)) {
    for (const ann of anns) {
      const nKey = `${docId}:${ann.target.eid}`;
      if (ann.kind === "topic" && ann.value === topic) {
        taggedNodeKeys.add(nKey);
      } else if (ann.kind === "quantity") {
        const list = quantitiesByNodeKey.get(nKey) ?? [];
        if (!list.includes(ann.value)) {
          list.push(ann.value);
          quantitiesByNodeKey.set(nKey, list);
        }
      }
    }
  }

  const taggedClauses: ClauseNode[] = clauses.filter(
    (c) =>
      !c.superseded_by &&
      !c.record_superseded_by &&
      taggedNodeKeys.has(`${c.doc_id}:${c.eid}`)
  );

  const topicRelations = relations.relations.filter(
    (r) => r.topic === topic && r.public_visible !== false
  );
  const diffRelations = topicRelations.filter(
    (r) =>
      r.kind === "incorporates" ||
      r.kind === "amends" ||
      r.kind === "corporation_differs"
  );
  const precedenceRelations = topicRelations.filter(
    (r) => r.kind === "precedence"
  );

  // Order documents by hierarchy: planning -> municipal -> state_rules -> statute
  const layerOrder: Record<string, number> = {
    planning: 1,
    municipal: 2,
    state_rules: 3,
    statute: 4,
    orders: 5,
  };
  const docMetaById = new Map(documents.map((d) => [d.doc_id, d]));
  const docsWithProvisions = Array.from(
    new Set(taggedClauses.map((c) => c.doc_id ?? ""))
  )
    .filter(Boolean)
    .sort((a, b) => {
      const la = layerOrder[docMetaById.get(a)?.layer ?? ""] ?? 9;
      const lb = layerOrder[docMetaById.get(b)?.layer ?? ""] ?? 9;
      return la - lb || a.localeCompare(b);
    });

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
            ← Back to All Regulatory Topics ({jurisdiction.name})
          </Link>
        </div>

        <header className="border-b border-[#080909] pb-6">
          <div className="dg-mono">
            Rules by Subject · What Applies Today
          </div>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-[#080909]">
            {topicDef.label}
          </h1>
          <p className="dg-serif mt-2 max-w-3xl text-base text-[#171917]">
            {topicDef.description}
          </p>
        </header>

        {/* 1. Resolution Cards (Part 5: what governs, why in one line, the other provision, links) */}
        {diffRelations.length > 0 && (
          <section
            aria-label="Statutory resolution cards"
            className="border border-[#080909] bg-[#efeee8] p-6"
          >
            <div className="dg-mono mb-1">
              1 · Statutory Resolution Cards ({diffRelations.length})
            </div>
            <h2 className="text-xl font-semibold text-[#080909]">
              What Governs &amp; How Instruments Relate on This Topic
            </h2>
            <p className="dg-serif mt-1 text-sm text-[#171917]">
              Each card states which provision governs, why in one plain line,
              and links to both provisions.
            </p>

            <div className="mt-4 space-y-4">
              {diffRelations.slice(0, 16).map((rel) => {
                const isCorpDiff = rel.kind === "corporation_differs";
                const isIncorp = rel.kind === "incorporates";
                const whyLine = isIncorp
                  ? "Master Plan Zoning Regulations govern this parameter under Building Bye-law 1.4 (inserted 2017)."
                  : isCorpDiff
                    ? "Each City Corporation's 2026 Building (Amendment) Bye-laws govern inside that corporation."
                    : "The later in-force amending notification governs over the original wording.";

                return (
                  <article
                    key={rel.id}
                    className="border border-[#080909] bg-[#f5f3ed] p-4"
                  >
                    <p className="font-mono text-xs font-semibold text-[#080909]">
                      {whyLine}
                    </p>
                    <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="border border-[#c8ccc0] bg-[#efeee8] p-3">
                        <div className="font-mono text-xs font-semibold">
                          <Link
                            href={`/j/${jurisdiction.id}/documents/${rel.from_doc}/${rel.from_eid}`}
                            className="underline"
                          >
                            {rel.from_doc}
                          </Link>
                        </div>
                        <p className="dg-serif mt-1 text-sm text-[#171917]">
                          {rel.from_span}
                        </p>
                      </div>
                      <div className="border border-[#c8ccc0] bg-[#efeee8] p-3">
                        <div className="font-mono text-xs font-semibold">
                          <Link
                            href={`/j/${jurisdiction.id}/documents/${rel.to_doc}/${rel.to_eid}`}
                            className="underline"
                          >
                            {rel.to_doc}
                          </Link>
                        </div>
                        <p className="dg-serif mt-1 text-sm text-[#171917]">
                          {rel.to_span}
                        </p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {/* 2. Statutory Precedence Clauses */}
        {precedenceRelations.length > 0 && (
          <section
            aria-label="Statutory precedence clauses"
            className="border border-[#080909] bg-[#efeee8] p-6"
          >
            <div className="dg-mono mb-1">
              2 · Quoted Statutory Precedence &amp; Condition Clauses (
              {precedenceRelations.length})
            </div>
            <h2 className="text-xl font-semibold text-[#080909]">
              What the Law Itself States About Precedence &amp; Conditions
            </h2>
            <div className="mt-4 space-y-3">
              {precedenceRelations.map((rel) => (
                <div
                  key={rel.id}
                  className="border border-[#080909] bg-[#f5f3ed] p-4"
                >
                  <div className="font-mono text-xs font-semibold">
                    <Link
                      href={`/j/${jurisdiction.id}/documents/${rel.from_doc}/${rel.from_eid}`}
                      className="underline"
                    >
                      {rel.from_doc}:{rel.from_eid}
                    </Link>
                  </div>
                  <p className="dg-serif mt-1 text-sm italic text-[#080909]">
                    &ldquo;{rel.precedence_span}&rdquo;
                  </p>
                  <p className="dg-serif mt-1 text-xs text-[#5b5e56]">
                    {rel.from_span}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 3. All Provisions on This Topic Grouped by Document */}
        <section aria-label="Provisions by document" className="space-y-6">
          <div className="dg-mono">
            3 · All Provisions Tagged to {topicDef.label} (
            {taggedClauses.length})
          </div>
          {docsWithProvisions.map((docId) => {
            const docMeta = docMetaById.get(docId);
            const docNodes = taggedClauses
              .filter((c) => c.doc_id === docId)
              .slice(0, 12);
            return (
              <div
                key={docId}
                className="border border-[#080909] bg-[#f5f3ed] p-5"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[#c8ccc0] pb-3">
                  <div>
                    <div className="dg-mono text-[10px]">
                      {docId} · {docMeta?.layer}
                    </div>
                    <h2 className="text-lg font-semibold text-[#080909]">
                      <Link
                        href={`/j/${jurisdiction.id}/documents/${docId}`}
                        className="underline"
                      >
                        {docMeta?.title ?? docId}
                      </Link>
                    </h2>
                  </div>
                  <span className="font-mono text-xs text-[#5b5e56]">
                    {docNodes.length} provisions shown
                  </span>
                </div>

                <ul className="mt-4 divide-y divide-[#c8ccc0]">
                  {docNodes.map((node) => {
                    const nKey = `${docId}:${node.eid}`;
                    const qtys = quantitiesByNodeKey.get(nKey) ?? [];
                    const lastVer =
                      node.versions && node.versions.length > 0
                        ? node.versions[node.versions.length - 1]
                        : null;
                    const rawTxt =
                      lastVer?.content || node.content || node.text;
                    const displayTxt =
                      rawTxt.length > 360 ? `${rawTxt.slice(0, 360)}…` : rawTxt;

                    return (
                      <li key={node.eid} className="py-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <Link
                            href={`/j/${jurisdiction.id}/documents/${docId}/${node.eid}`}
                            className="font-mono text-xs font-semibold text-[#080909] underline"
                          >
                            {node.native_number ?? node.number}{" "}
                            {node.heading ? `— ${node.heading}` : ""}
                          </Link>
                          <div className="flex flex-wrap gap-1.5 font-mono text-[10px]">
                            {qtys.map((q) => (
                              <span
                                key={q}
                                className="border border-[#080909] bg-[#efeee8] px-1.5 py-0.5"
                              >
                                {q}
                              </span>
                            ))}
                            <Link
                              href={`/j/${jurisdiction.id}/documents/${docId}/${node.eid}`}
                              className="border border-[#080909] bg-[#f5f3ed] px-1.5 py-0.5 uppercase no-underline hover:bg-[#e5e6de]"
                            >
                              Local Graph →
                            </Link>
                          </div>
                        </div>
                        <p className="dg-serif mt-1 text-sm text-[#171917]">
                          {displayTxt}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </section>
      </main>
    </div>
  );
}
