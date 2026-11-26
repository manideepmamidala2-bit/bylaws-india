import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchJurisdictionDataset, fetchManifest } from "@/lib/data";
import { TopNav } from "@/components/TopNav";
import { StatusBadge } from "@/components/StatusBadge";
import { formatPlainDocumentTitle } from "@/lib/plain-language";

interface ProvisionPageProps {
  params: Promise<{ id: string; doc: string; eid: string }>;
}

export const dynamicParams = true;

export async function generateStaticParams() {
  const manifest = await fetchManifest();
  const paramsList: Array<{ id: string; doc: string; eid: string }> = [];
  const primary = manifest.jurisdictions[0];
  if (primary) {
    const ds = await fetchJurisdictionDataset(primary.id);
    for (const c of (ds?.clauses ?? []).slice(0, 15)) {
      if (c.doc_id && c.eid) {
        paramsList.push({ id: primary.id, doc: c.doc_id, eid: c.eid });
      }
    }
  }
  return paramsList;
}

export default async function ProvisionDetailPage({
  params,
}: ProvisionPageProps) {
  const { id, doc, eid } = await params;
  const dataset = await fetchJurisdictionDataset(id);
  if (!dataset) {
    notFound();
  }

  const {
    jurisdiction,
    release,
    documents,
    clauses,
    annotationsByDocId,
    amendments,
    relations,
  } = dataset;

  const docMeta = documents.find((d) => d.doc_id === doc);
  const node = clauses.find(
    (c) =>
      c.doc_id === doc &&
      (c.eid === eid || c.native_number === eid || c.number === eid)
  );
  if (!docMeta || !node) {
    notFound();
  }

  const resolvedEid = node.eid ?? eid;
  const docAnns = (annotationsByDocId[doc] ?? []).filter(
    (a) => a.target.eid === resolvedEid
  );
  const nodeRelations = (relations?.relations ?? []).filter(
    (r) =>
      (r.from_doc === doc && r.from_eid === resolvedEid) ||
      (r.to_doc === doc && r.to_eid === resolvedEid)
  );
  const nodeEffects = (amendments.effects ?? []).filter(
    (e) =>
      (e.target_doc === doc && e.target_eid === resolvedEid) ||
      (e.amending_doc === doc && e.amending_eid === resolvedEid)
  );

  // Build 1-hop neighborhood nodes for the local SVG graph and accessible list
  const neighbors: Array<{
    key: string;
    label: string;
    edgeKind: string;
    href: string;
    isConflict: boolean;
  }> = [];

  if (node.parent_eid) {
    neighbors.push({
      key: `${doc}:${node.parent_eid}`,
      label: `Parent: ${node.parent_eid}`,
      edgeKind: "contains",
      href: `/j/${jurisdiction.id}/documents/${doc}/${node.parent_eid}`,
      isConflict: false,
    });
  }
  for (const chEid of (node.children ?? []).slice(0, 4)) {
    neighbors.push({
      key: `${doc}:${chEid}`,
      label: `Child: ${chEid}`,
      edgeKind: "contains",
      href: `/j/${jurisdiction.id}/documents/${doc}/${chEid}`,
      isConflict: false,
    });
  }
  for (const ann of docAnns) {
    if (ann.kind === "topic") {
      neighbors.push({
        key: `topic:${ann.value}`,
        label: `Topic: ${ann.value}`,
        edgeKind: "tagged_topic",
        href: `/j/${jurisdiction.id}/topics/${ann.value}`,
        isConflict: false,
      });
    } else if (ann.kind === "defined_term_use") {
      neighbors.push({
        key: `${doc}:${ann.value}`,
        label: `Term: ${ann.target.span_text}`,
        edgeKind: "uses_term",
        href: `/j/${jurisdiction.id}/documents/${doc}/${ann.value}`,
        isConflict: false,
      });
    } else if (
      ann.kind === "cross_reference" &&
      !ann.value.startsWith("unresolved:") &&
      !ann.value.startsWith("external:")
    ) {
      neighbors.push({
        key: `${doc}:${ann.value}`,
        label: `Ref: ${ann.value}`,
        edgeKind: "refers_to",
        href: `/j/${jurisdiction.id}/documents/${doc}/${ann.value}`,
        isConflict: false,
      });
    }
  }
  for (const rel of nodeRelations.slice(0, 6)) {
    const isFrom = rel.from_doc === doc && rel.from_eid === resolvedEid;
    const otherDoc = isFrom ? rel.to_doc : rel.from_doc;
    const otherEid = isFrom ? rel.to_eid : rel.from_eid;
    neighbors.push({
      key: `${rel.id}:${otherDoc}:${otherEid}`,
      label: `${otherDoc}:${otherEid}`,
      edgeKind: rel.kind,
      href: `/j/${jurisdiction.id}/documents/${otherDoc}/${otherEid}`,
      isConflict:
        rel.kind === "numeric_differs" ||
        rel.kind === "definition_differs" ||
        rel.kind === "corporation_differs",
    });
  }
  for (const eff of nodeEffects.slice(0, 4)) {
    const isTarget = eff.target_doc === doc && eff.target_eid === resolvedEid;
    const otherDoc = isTarget ? eff.amending_doc : eff.target_doc;
    const otherEid = isTarget ? eff.amending_eid : eff.target_eid;
    neighbors.push({
      key: `eff:${eff.effect_id}`,
      label: `${otherDoc}:${otherEid}`,
      edgeKind: isTarget ? "amended_by" : "amends",
      href: `/j/${jurisdiction.id}/documents/${otherDoc}/${otherEid}`,
      isConflict: false,
    });
  }

  // Match institution succession mentions in provision text
  const fullText = `${node.heading ?? ""} ${node.intro ?? ""} ${node.content ?? ""} ${node.text ?? ""}`;
  const matchedSuccession = (relations?.succession ?? []).filter((s) =>
    [s.old_body, ...(s.aliases ?? [])].some((alias) =>
      fullText.toLowerCase().includes(alias.toLowerCase())
    )
  );

  const firstCit = node.citations?.[0];
  const pdfUrl =
    node.official_url || docMeta.official_url || docMeta.source_url;
  const plainDocTitle = formatPlainDocumentTitle(docMeta, doc);

  return (
    <div className="min-h-screen bg-[#f5f3ed] text-[#080909]">
      <TopNav
        jurisdictionId={jurisdiction.id}
        jurisdictionName={jurisdiction.name}
        active="documents"
        releaseVersion={release?.version}
        licence={release?.licence}
      />

      <main className="mx-auto max-w-5xl space-y-8 px-6 py-8">
        <nav
          aria-label="Provision breadcrumb"
          className="font-mono text-xs uppercase tracking-[0.12em] text-[#5b5e56]"
        >
          <Link href={`/j/${jurisdiction.id}/clauses`} className="underline">
            Documents
          </Link>{" "}
          /{" "}
          <Link
            href={`/j/${jurisdiction.id}/documents/${doc}`}
            className="underline"
          >
            {plainDocTitle}
          </Link>{" "}
          / <span className="text-[#080909]">Provision {node.native_number ?? node.number}</span>
        </nav>

        <header className="border border-[#080909] bg-[#efeee8] p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="dg-mono">
              {plainDocTitle} · {node.type ?? "clause"}
            </span>
            <div className="flex items-center gap-2">
              {firstCit && pdfUrl && (
                <a
                  href={`${pdfUrl}#page=${firstCit.page}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border border-[#080909] bg-[#f5f3ed] px-2 py-0.5 font-mono text-[10.5px] text-[#080909] underline"
                >
                  Source PDF p. {firstCit.page} ↗
                </a>
              )}
              <StatusBadge status={node.legal_status ?? "in_force"} />
            </div>
          </div>

          <h1 className="mt-2 text-2xl font-semibold text-[#080909]">
            {node.native_number ?? node.number}{" "}
            {node.heading ? `— ${node.heading}` : ""}
          </h1>

          <p className="dg-serif mt-3 whitespace-pre-line text-base leading-relaxed text-[#171917]">
            {node.text}
          </p>

          {matchedSuccession.length > 0 && (
            <div className="mt-4 border-t border-[#c8ccc0] pt-3 font-mono text-xs">
              {matchedSuccession.map((s) => (
                <div key={s.id} className="mt-1">
                  <span className="text-[#5b5e56]">{s.old_body} → </span>
                  <strong className="text-[#080909]">now: {s.new_body}</strong>{" "}
                  <span className="text-[#5b5e56]">
                    ({s.instrument_title}, {s.effective_date})
                  </span>
                </div>
              ))}
            </div>
          )}

          <details className="mt-4 border-t border-[#c8ccc0] pt-3">
            <summary className="cursor-pointer font-mono text-xs uppercase tracking-[0.12em] text-[#5b5e56]">
              Details · Version history &amp; local graph ({neighbors.length})
            </summary>

            <div className="mt-4 space-y-6">
              <div className="font-mono text-xs text-[#5b5e56]">
                Address: <code>{doc}:{resolvedEid}</code>
              </div>

              {node.versions && node.versions.length > 0 && (
                <section
                  aria-label="Provision version history"
                  className="border border-[#080909] bg-[#f5f3ed] p-4"
                >
                  <div className="dg-mono mb-2">
                    1 · Version History ({node.versions.length})
                  </div>
                  <div className="space-y-3">
                    {node.versions.map((ver) => (
                      <div
                        key={ver.version_id}
                        className="border border-[#c8ccc0] bg-[#efeee8] p-3"
                      >
                        <div className="font-mono text-xs font-semibold">
                          {ver.version_id} · From{" "}
                          {ver.valid_from ?? "Original"} to{" "}
                          {ver.valid_to ?? "Present"} · Source:{" "}
                          {ver.source_doc}:{ver.source_eid}
                        </div>
                        <p className="dg-serif mt-1 text-sm text-[#171917]">
                          {ver.content || ver.heading}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <section
                aria-label="Local provision neighborhood graph"
                className="border border-[#080909] bg-[#f5f3ed] p-4"
              >
                <div className="dg-mono mb-1">
                  2 · Local Knowledge Graph &amp; Accessible Connections (
                  {neighbors.length})
                </div>
                <h2 className="text-lg font-semibold text-[#080909]">
                  One-Hop Neighborhood Around {doc}:{resolvedEid}
                </h2>
                <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <div className="border border-[#080909] bg-[#f5f3ed] p-4">
                    <svg
                      viewBox="0 0 420 320"
                      className="h-auto w-full"
                      role="img"
                      aria-label={`Local neighborhood graph for ${doc}:${resolvedEid}`}
                    >
                      {neighbors.slice(0, 8).map((nb, idx, arr) => {
                        const angle =
                          (2 * Math.PI * idx) / Math.max(1, arr.length);
                        const nx = Math.round(210 + 135 * Math.cos(angle));
                        const ny = Math.round(160 + 110 * Math.sin(angle));
                        return (
                          <g key={nb.key}>
                            <line
                              x1={210}
                              y1={160}
                              x2={nx}
                              y2={ny}
                              stroke="#080909"
                              strokeWidth={nb.isConflict ? 1.8 : 1.2}
                              strokeDasharray={nb.isConflict ? "4 3" : undefined}
                            />
                            <rect
                              x={nx - 58}
                              y={ny - 16}
                              width={116}
                              height={32}
                              fill="#efeee8"
                              stroke="#080909"
                              strokeDasharray={nb.isConflict ? "3 2" : undefined}
                            />
                            <text
                              x={nx}
                              y={ny - 2}
                              textAnchor="middle"
                              fontSize="8.5"
                              fontFamily="monospace"
                              fill="#5b5e56"
                            >
                              {nb.edgeKind}
                            </text>
                            <text
                              x={nx}
                              y={ny + 10}
                              textAnchor="middle"
                              fontSize="9"
                              fontFamily="monospace"
                              fontWeight="bold"
                              fill="#080909"
                            >
                              {nb.label.slice(0, 18)}
                            </text>
                          </g>
                        );
                      })}
                      <rect
                        x={145}
                        y={138}
                        width={130}
                        height={44}
                        fill="#080909"
                        stroke="#080909"
                      />
                      <text
                        x={210}
                        y={156}
                        textAnchor="middle"
                        fontSize="9.5"
                        fontFamily="monospace"
                        fill="#f5f3ed"
                      >
                        {doc}
                      </text>
                      <text
                        x={210}
                        y={171}
                        textAnchor="middle"
                        fontSize="10.5"
                        fontFamily="monospace"
                        fontWeight="bold"
                        fill="#f5f3ed"
                      >
                        {resolvedEid.slice(0, 18)}
                      </text>
                    </svg>
                  </div>

                  <div className="border border-[#080909] bg-[#f5f3ed] p-4">
                    <div className="dg-mono mb-2 text-[10.5px] text-[#080909]">
                      Accessible Connection List ({neighbors.length})
                    </div>
                    {neighbors.length === 0 ? (
                      <p className="text-xs text-[#5b5e56]">
                        No direct neighbor links recorded for this provision.
                      </p>
                    ) : (
                      <ul className="divide-y divide-[#c8ccc0] font-mono text-xs">
                        {neighbors.map((nb) => (
                          <li
                            key={nb.key}
                            className="flex items-center justify-between gap-2 py-2"
                          >
                            <span className="uppercase text-[#5b5e56]">
                              {nb.edgeKind}
                            </span>
                            <Link
                              href={nb.href}
                              className="font-semibold underline"
                            >
                              {nb.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </section>
            </div>
          </details>
        </header>
      </main>
    </div>
  );
}
