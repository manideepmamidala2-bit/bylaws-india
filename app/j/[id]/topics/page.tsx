import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  fetchJurisdictionDataset,
  fetchManifest,
  getVisibleJurisdictions,
} from "@/lib/data";
import { TopNav } from "@/components/TopNav";

interface TopicsPageProps {
  params: Promise<{ id: string }>;
}

export const dynamicParams = false;

export async function generateStaticParams() {
  const manifest = await fetchManifest();
  return manifest.jurisdictions.map((j) => ({ id: j.id }));
}

export default async function TopicsIndexPage({ params }: TopicsPageProps) {
  const { id } = await params;
  const [dataset, manifest] = await Promise.all([
    fetchJurisdictionDataset(id),
    fetchManifest(),
  ]);
  if (!dataset) {
    notFound();
  }

  const { jurisdiction, release, annotationsByDocId, relations } = dataset;
  const allVisible = getVisibleJurisdictions(manifest);
  const rootParentId =
    jurisdiction.parent ??
    (allVisible.some((j) => j.parent === jurisdiction.id)
      ? jurisdiction.id
      : null);
  const gbaCorporations = rootParentId
    ? allVisible.filter(
        (j) => j.id === rootParentId || j.parent === rootParentId
      )
    : [];

  const topics = relations?.topics ?? [];
  const allRelations = relations?.relations ?? [];
  const succession = relations?.succession ?? [];

  // Count provisions tagged per topic per document
  const countsByTopicDoc: Record<string, Record<string, number>> = {};
  for (const [docId, anns] of Object.entries(annotationsByDocId)) {
    for (const ann of anns) {
      if (ann.kind === "topic") {
        const tId = ann.value;
        countsByTopicDoc[tId] = countsByTopicDoc[tId] ?? {};
        countsByTopicDoc[tId][docId] = (countsByTopicDoc[tId][docId] ?? 0) + 1;
      }
    }
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
        <header className="border-b border-[#080909] pb-6">
          <div className="dg-mono">
            Schema 1.4 · Cross-Document Topics, Relations &amp; Succession ·{" "}
            {jurisdiction.id}
          </div>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-[#080909]">
            Regulatory Topics &amp; Cross-Document Relations
          </h1>
          <p className="dg-serif mt-2 max-w-3xl text-base text-[#171917]">
            Inspect how building bye-laws, master plan zoning regulations, and
            amending notifications overlap, where definitions or numeric
            standards differ across instruments or City Corporations, and where
            statutory precedence clauses apply.
          </p>

          {gbaCorporations.length > 1 && (
            <div
              aria-label="Corporation topics selector"
              className="mt-4 flex flex-wrap items-center gap-2 font-mono text-[11px] uppercase tracking-[0.12em]"
            >
              <span className="text-[#5b5e56]">Corporation:</span>
              {gbaCorporations.map((corp) => {
                const isCurrent = corp.id === jurisdiction.id;
                return (
                  <Link
                    key={corp.id}
                    href={`/j/${corp.id}/topics`}
                    aria-current={isCurrent ? "page" : undefined}
                    className={
                      isCurrent
                        ? "border border-[#080909] bg-[#080909] px-2.5 py-1 text-[#f5f3ed] no-underline"
                        : "border border-[#080909] bg-[#efeee8] px-2.5 py-1 text-[#080909] no-underline hover:bg-[#e5e6de]"
                    }
                  >
                    {corp.name}
                  </Link>
                );
              })}
            </div>
          )}
        </header>

        {/* Topics Grid */}
        <section aria-label="Regulatory topics">
          <div className="dg-mono mb-3">
            1 · Regulatory Topics ({topics.length})
          </div>
          {topics.length === 0 ? (
            <p className="text-sm text-[#5b5e56]">
              No topic index published for this jurisdiction yet.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {topics.map((topic) => {
                const byDoc = countsByTopicDoc[topic.id] ?? {};
                const totalProvisions = Object.values(byDoc).reduce(
                  (a, b) => a + b,
                  0
                );
                const topicRels = allRelations.filter(
                  (r) => r.topic === topic.id
                );
                const diffCount = topicRels.filter(
                  (r) =>
                    r.kind === "definition_differs" ||
                    r.kind === "numeric_differs" ||
                    r.kind === "corporation_differs"
                ).length;
                const precCount = topicRels.filter(
                  (r) => r.kind === "precedence"
                ).length;

                return (
                  <article
                    key={topic.id}
                    className="flex flex-col justify-between border border-[#080909] bg-[#f5f3ed] p-5"
                  >
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="dg-mono text-[10px] text-[#5b5e56]">
                          topic:{topic.id}
                        </span>
                        <div className="flex flex-wrap gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em]">
                          <span className="border border-[#080909] bg-[#efeee8] px-2 py-0.5">
                            {totalProvisions} provisions
                          </span>
                          {diffCount > 0 && (
                            <span className="border border-dashed border-[#080909] bg-[#efeee8] px-2 py-0.5 font-semibold">
                              {diffCount} differences
                            </span>
                          )}
                          {precCount > 0 && (
                            <span className="border border-[#080909] bg-[#efeee8] px-2 py-0.5">
                              {precCount} precedence
                            </span>
                          )}
                        </div>
                      </div>
                      <h2 className="mt-2 text-lg font-semibold text-[#080909]">
                        <Link
                          href={`/j/${jurisdiction.id}/topics/${topic.id}`}
                          className="underline hover:text-[#5b5e56]"
                        >
                          {topic.label}
                        </Link>
                      </h2>
                      <p className="dg-serif mt-1 text-sm text-[#171917]">
                        {topic.description}
                      </p>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[#c8ccc0] pt-3 font-mono text-[11px]">
                      <div className="flex flex-wrap gap-2 text-[#5b5e56]">
                        {Object.entries(byDoc)
                          .slice(0, 4)
                          .map(([dId, cnt]) => (
                            <span key={dId}>
                              {dId}: <strong className="text-[#080909]">{cnt}</strong>
                            </span>
                          ))}
                      </div>
                      <Link
                        href={`/j/${jurisdiction.id}/topics/${topic.id}`}
                        className="border border-[#080909] bg-[#080909] px-2.5 py-1 uppercase tracking-[0.12em] text-[#f5f3ed] no-underline"
                      >
                        Compare Provisions →
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* Institution Succession Table */}
        {succession.length > 0 && (
          <section
            aria-label="Institution succession"
            className="border border-[#080909] bg-[#efeee8] p-6"
          >
            <div className="dg-mono mb-2">
              2 · Statutory Institution &amp; Office Succession
            </div>
            <h2 className="text-xl font-semibold text-[#080909]">
              Former Authorities &amp; Current Successor Bodies in{" "}
              {jurisdiction.name}
            </h2>
            <p className="dg-serif mt-1 max-w-3xl text-sm text-[#171917]">
              Provisions in older instruments that name predecessor municipal or
              planning bodies are displayed verbatim alongside their statutory
              successor under the enabling municipal governance statute:
            </p>
            <div className="mt-4 overflow-x-auto">
              <table className="dg-table">
                <thead>
                  <tr>
                    <th>Predecessor Body / Office</th>
                    <th>Now ({jurisdiction.name})</th>
                    <th>Effective Date</th>
                    <th>Enacting Instrument &amp; Quoted Evidence</th>
                  </tr>
                </thead>
                <tbody>
                  {succession.map((s) => (
                    <tr key={s.id}>
                      <td className="font-mono text-xs font-medium">
                        {s.old_body}
                      </td>
                      <td className="font-mono text-xs font-semibold">
                        now: {s.new_body}
                      </td>
                      <td className="font-mono text-xs">{s.effective_date}</td>
                      <td className="text-xs">
                        <div className="font-semibold">{s.instrument_title}</div>
                        <div className="dg-serif mt-1 italic text-[#171917]">
                          &ldquo;{s.quoted_evidence}&rdquo;
                        </div>
                        {s.source_url && s.source_url.startsWith("http") && (
                          <a
                            href={s.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1 inline-block font-mono text-[10.5px] underline"
                          >
                            Source PDF ↗
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
