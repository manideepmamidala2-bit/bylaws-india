import React from "react";
import Link from "next/link";
import { fetchJurisdictionDataset, fetchManifest } from "@/lib/data";
import { TopNav } from "@/components/TopNav";

export default async function StructurePage() {
  const manifest = await fetchManifest();
  const primaryJurisdiction = manifest.jurisdictions[0];
  const dataset = primaryJurisdiction
    ? await fetchJurisdictionDataset(primaryJurisdiction.id)
    : null;

  const docsCount = dataset?.documents.length ?? 0;
  const clausesList = dataset?.clauses ?? [];
  const annsList = dataset
    ? Object.values(dataset.annotationsByDocId).flat()
    : [];
  const effectsList = dataset?.amendments.effects ?? [];
  const relationsData = dataset?.relations ?? null;
  const topicsCount = relationsData?.topics.length ?? 0;
  const relationsList = relationsData?.relations ?? [];
  const successionCount = relationsData?.succession.length ?? 0;

  const byNodeKind: Record<string, number> = {};
  for (const c of clausesList) {
    if (!c.superseded_by && !c.record_superseded_by) {
      const k = c.type ?? "clause";
      byNodeKind[k] = (byNodeKind[k] ?? 0) + 1;
    }
  }

  const byAnnKind: Record<string, number> = {};
  for (const a of annsList) {
    if ((a.confidence ?? 1) >= 0.8) {
      byAnnKind[a.kind] = (byAnnKind[a.kind] ?? 0) + 1;
    }
  }

  const releaseVer = dataset?.release?.version ?? "2.4.0";
  const jId = primaryJurisdiction?.id ?? "";
  const firstDocId = dataset?.documents[0]?.doc_id ?? "doc-1";
  const sampleChild = clausesList.find((c) => Boolean(c.parent_eid));
  const sampleDef = clausesList.find(
    (c) => c.type === "definition" && Boolean(c.defines_normalised)
  );
  const sampleTermUse = annsList.find((a) => a.kind === "defined_term_use");
  const sampleRef = annsList.find(
    (a) => a.kind === "cross_reference" && !a.value.startsWith("unresolved:")
  );
  const sampleEff = effectsList[0];

  return (
    <div className="min-h-screen bg-[#f5f3ed] text-[#080909]">
      <TopNav
        jurisdictionId={primaryJurisdiction?.id}
        jurisdictionName={primaryJurisdiction?.name}
        active="structure"
        releaseVersion={releaseVer}
      />

      <main className="mx-auto max-w-5xl space-y-8 px-6 py-10">
        <header className="border-b border-[#080909] pb-6">
          <div className="dg-mono">Data Model &amp; Knowledge Graph</div>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-[#080909] sm:text-4xl">
            How This Dataset Is Structured
          </h1>
          <p className="dg-serif mt-2 max-w-3xl text-base text-[#171917]">
            Every legal instrument is published in four layers: faithful
            document structure, stand-off character-span annotations, amending
            effects and versioned consolidated views, and a directed knowledge
            graph in Graphology JSON and GraphML formats.
          </p>
        </header>

        {/* 1. Core Building Blocks */}
        <section
          aria-label="Core building blocks"
          className="border border-[#080909] bg-[#efeee8] p-6"
        >
          <div className="dg-mono mb-2">1 · Nodes in the Graph</div>
          <h2 className="text-xl font-semibold text-[#080909]">
            What Each Building Block Represents
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="border border-[#080909] bg-[#f5f3ed] p-4">
              <div className="font-mono text-xs font-semibold uppercase tracking-[0.12em]">
                Document
              </div>
              <p className="dg-serif mt-1 text-sm text-[#171917]">
                An official Act, building bye-law, master plan zoning
                regulation, or gazette amendment, verified by SHA-256 checksum
                and Wayback snapshot.
              </p>
            </div>
            <div className="border border-[#080909] bg-[#f5f3ed] p-4">
              <div className="font-mono text-xs font-semibold uppercase tracking-[0.12em]">
                Provision
              </div>
              <p className="dg-serif mt-1 text-sm text-[#171917]">
                A part, chapter, section, regulation, bye-law, clause, item,
                proviso, or note with a stable Akoma Ntoso address and source
                page bounding box.
              </p>
            </div>
            <div className="border border-[#080909] bg-[#f5f3ed] p-4">
              <div className="font-mono text-xs font-semibold uppercase tracking-[0.12em]">
                Definition
              </div>
              <p className="dg-serif mt-1 text-sm text-[#171917]">
                A provision inside a definitions section that defines a quoted
                statutory term (such as &ldquo;apartment&rdquo; or
                &ldquo;building line&rdquo;).
              </p>
            </div>
            <div className="border border-[#080909] bg-[#f5f3ed] p-4">
              <div className="font-mono text-xs font-semibold uppercase tracking-[0.12em]">
                Table &amp; Table Row
              </div>
              <p className="dg-serif mt-1 text-sm text-[#171917]">
                Structured setback, FAR, coverage, and parking schedules stored
                with column headers, units, footnotes, and individual row
                addresses.
              </p>
            </div>
            <div className="border border-[#080909] bg-[#f5f3ed] p-4">
              <div className="font-mono text-xs font-semibold uppercase tracking-[0.12em]">
                Amendment Effect
              </div>
              <p className="dg-serif mt-1 text-sm text-[#171917]">
                A substitute, insert, omit, or modify instruction linking an
                amending notification to a target provision and creating a dated
                node version.
              </p>
            </div>
            <div className="border border-[#080909] bg-[#f5f3ed] p-4">
              <div className="font-mono text-xs font-semibold uppercase tracking-[0.12em]">
                Annotation
              </div>
              <p className="dg-serif mt-1 text-sm text-[#171917]">
                A stand-off character-span pointer recording a defined-term use,
                cross-reference, or provision type without altering the verbatim
                statutory text.
              </p>
            </div>
          </div>
        </section>

        {/* 2. Static SVG Model Diagram */}
        <section
          aria-label="Knowledge graph model diagram"
          className="border border-[#080909] bg-[#f5f3ed] p-6"
        >
          <div className="dg-mono mb-2">2 · Node Kinds &amp; Link Kinds</div>
          <h2 className="text-xl font-semibold text-[#080909]">
            Graph Schema Diagram
          </h2>
          <div className="mt-4 overflow-x-auto border border-[#c8ccc0] bg-[#efeee8] p-4">
            <svg
              viewBox="0 0 820 220"
              role="img"
              aria-label="Diagram showing Register, Document, Provision, Definition, Term, and Amendment nodes connected by in_register, contains, defines, uses_term, refers_to, and amends edges"
              className="h-auto w-full max-w-4xl font-mono text-[11px]"
            >
              <rect x="20" y="25" width="130" height="44" fill="#f5f3ed" stroke="#080909" strokeWidth="1.5" />
              <text x="85" y="51" textAnchor="middle" fill="#080909">Source Register</text>

              <rect x="220" y="25" width="140" height="44" fill="#f5f3ed" stroke="#080909" strokeWidth="1.5" />
              <text x="290" y="51" textAnchor="middle" fill="#080909">Document</text>

              <rect x="440" y="25" width="150" height="44" fill="#f5f3ed" stroke="#080909" strokeWidth="1.5" />
              <text x="515" y="51" textAnchor="middle" fill="#080909">Provision / Table</text>

              <rect x="660" y="25" width="140" height="44" fill="#f5f3ed" stroke="#080909" strokeWidth="1.5" />
              <text x="730" y="51" textAnchor="middle" fill="#080909">Child / Row</text>

              <rect x="440" y="140" width="150" height="44" fill="#f5f3ed" stroke="#080909" strokeWidth="1.5" />
              <text x="515" y="166" textAnchor="middle" fill="#080909">Definition Node</text>

              <rect x="660" y="140" width="140" height="44" fill="#f5f3ed" stroke="#080909" strokeWidth="1.5" />
              <text x="730" y="166" textAnchor="middle" fill="#080909">Defined Term</text>

              <rect x="220" y="140" width="140" height="44" fill="#f5f3ed" stroke="#080909" strokeWidth="1.5" />
              <text x="290" y="166" textAnchor="middle" fill="#080909">Amending Clause</text>

              <line x1="220" y1="47" x2="150" y2="47" stroke="#080909" strokeWidth="1.2" />
              <text x="185" y="40" textAnchor="middle" fill="#5b5e56">in_register</text>

              <line x1="360" y1="47" x2="440" y2="47" stroke="#080909" strokeWidth="1.2" />
              <text x="400" y="40" textAnchor="middle" fill="#5b5e56">contains</text>

              <line x1="590" y1="47" x2="660" y2="47" stroke="#080909" strokeWidth="1.2" />
              <text x="625" y="40" textAnchor="middle" fill="#5b5e56">contains</text>

              <line x1="515" y1="69" x2="515" y2="140" stroke="#080909" strokeWidth="1.2" strokeDasharray="4 2" />
              <text x="565" y="108" textAnchor="middle" fill="#5b5e56">uses_term / refers_to</text>

              <line x1="590" y1="162" x2="660" y2="162" stroke="#080909" strokeWidth="1.2" />
              <text x="625" y="155" textAnchor="middle" fill="#5b5e56">defines</text>

              <line x1="360" y1="155" x2="440" y2="69" stroke="#080909" strokeWidth="1.2" />
              <text x="380" y="108" textAnchor="middle" fill="#5b5e56">amends</text>
            </svg>
          </div>
        </section>

        {/* 3. Edge Types with Real Examples */}
        <section
          aria-label="Link kinds and real examples"
          className="border border-[#080909] bg-[#f5f3ed] p-6"
        >
          <div className="dg-mono mb-2">3 · Link Types &amp; Real Examples</div>
          <h2 className="text-xl font-semibold text-[#080909]">
            How Nodes Connect
          </h2>
          <div className="mt-4 overflow-x-auto">
            <table className="dg-table">
              <thead>
                <tr>
                  <th>Edge Type</th>
                  <th>Meaning</th>
                  <th>Real Dataset Example</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="font-mono text-xs font-semibold">contains</td>
                  <td>Parent structural container to child provision or row</td>
                  <td className="font-mono text-xs">
                    {sampleChild
                      ? `${sampleChild.doc_id}:${sampleChild.parent_eid} → ${sampleChild.doc_id}:${sampleChild.eid}`
                      : `${firstDocId}:sec_1 → ${firstDocId}:sec_1__cl_1`}
                  </td>
                </tr>
                <tr>
                  <td className="font-mono text-xs font-semibold">defines</td>
                  <td>Definition provision to the normalised term it defines</td>
                  <td className="font-mono text-xs">
                    {sampleDef
                      ? `${sampleDef.doc_id}:${sampleDef.eid} → term:${sampleDef.doc_id}:${sampleDef.defines_normalised}`
                      : `${firstDocId}:def_1 → term:${firstDocId}:term`}
                  </td>
                </tr>
                <tr>
                  <td className="font-mono text-xs font-semibold">uses_term</td>
                  <td>Provision using a defined term (first occurrence) to its definition</td>
                  <td className="font-mono text-xs">
                    {sampleTermUse
                      ? `${firstDocId}:${sampleTermUse.target.eid} → ${firstDocId}:${sampleTermUse.value}`
                      : `${firstDocId}:cl_1 → ${firstDocId}:def_1`}
                  </td>
                </tr>
                <tr>
                  <td className="font-mono text-xs font-semibold">refers_to</td>
                  <td>Provision citing another clause, table, schedule, or Act</td>
                  <td className="font-mono text-xs">
                    {sampleRef
                      ? `${firstDocId}:${sampleRef.target.eid} → ${sampleRef.value}`
                      : `${firstDocId}:cl_2 → ${firstDocId}:tbl_1`}
                  </td>
                </tr>
                <tr>
                  <td className="font-mono text-xs font-semibold">amends / amended_by</td>
                  <td>Amending instruction to target provision (with dated effect)</td>
                  <td className="font-mono text-xs">
                    {sampleEff
                      ? `${sampleEff.amending_doc}:${sampleEff.amending_eid} → ${sampleEff.target_doc}:${sampleEff.target_eid} (${sampleEff.effect_id})`
                      : `${firstDocId}:cl_1 → ${firstDocId}:cl_2`}
                  </td>
                </tr>
                <tr>
                  <td className="font-mono text-xs font-semibold">in_register</td>
                  <td>Document to its verified jurisdiction source register entry</td>
                  <td className="font-mono text-xs">
                    doc:{firstDocId} → register:{jId}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 4. Live Counts & Downloads */}
        <section
          aria-label="Live release counts and graph downloads"
          className="border border-[#080909] bg-[#efeee8] p-6"
        >
          <div className="dg-mono mb-2">
            4 · Live Release Counts (v{releaseVer}) &amp; Downloads
          </div>
          <h2 className="text-xl font-semibold text-[#080909]">
            Published Inventory &amp; Graph Exports
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="border border-[#080909] bg-[#f5f3ed] p-3">
              <div className="dg-mono text-[10px]">Registered Instruments</div>
              <div className="mt-1 font-mono text-2xl font-semibold">
                {docsCount}
              </div>
            </div>
            <div className="border border-[#080909] bg-[#f5f3ed] p-3">
              <div className="dg-mono text-[10px]">Structured Nodes</div>
              <div className="mt-1 font-mono text-2xl font-semibold">
                {clausesList.length}
              </div>
            </div>
            <div className="border border-[#080909] bg-[#f5f3ed] p-3">
              <div className="dg-mono text-[10px]">Display Annotations</div>
              <div className="mt-1 font-mono text-2xl font-semibold">
                {Object.values(byAnnKind).reduce((a, b) => a + b, 0)}
              </div>
            </div>
            <div className="border border-[#080909] bg-[#f5f3ed] p-3">
              <div className="dg-mono text-[10px]">Amendment Effects</div>
              <div className="mt-1 font-mono text-2xl font-semibold">
                {effectsList.length}
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="border border-[#080909] bg-[#f5f3ed] p-4">
              <div className="dg-mono mb-2 text-[10.5px] text-[#080909]">
                Provisions by Node Type
              </div>
              <ul className="space-y-1 font-mono text-xs">
                {Object.entries(byNodeKind)
                  .sort((a, b) => b[1] - a[1])
                  .map(([k, cnt]) => (
                    <li key={k} className="flex justify-between">
                      <span>{k}</span>
                      <strong>{cnt}</strong>
                    </li>
                  ))}
              </ul>
            </div>
            <div className="border border-[#080909] bg-[#f5f3ed] p-4">
              <div className="dg-mono mb-2 text-[10.5px] text-[#080909]">
                Annotations by Kind (Confidence &ge; 0.8)
              </div>
              <ul className="space-y-1 font-mono text-xs">
                {Object.entries(byAnnKind)
                  .sort((a, b) => b[1] - a[1])
                  .map(([k, cnt]) => (
                    <li key={k} className="flex justify-between">
                      <span>{k}</span>
                      <strong>{cnt}</strong>
                    </li>
                  ))}
              </ul>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="border border-[#080909] bg-[#f5f3ed] p-4">
              <div className="dg-mono text-[10px] text-[#5b5e56]">
                Regulatory Topics
              </div>
              <div className="mt-1 font-mono text-2xl font-semibold">
                {topicsCount}
              </div>
            </div>
            <div className="border border-[#080909] bg-[#f5f3ed] p-4">
              <div className="dg-mono text-[10px] text-[#5b5e56]">
                Cross-Document Relations
              </div>
              <div className="mt-1 font-mono text-2xl font-semibold">
                {relationsList.length}
              </div>
            </div>
            <div className="border border-[#080909] bg-[#f5f3ed] p-4">
              <div className="dg-mono text-[10px] text-[#5b5e56]">
                Institution Successions
              </div>
              <div className="mt-1 font-mono text-2xl font-semibold">
                {successionCount}
              </div>
            </div>
          </div>

          {jId && (
            <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-[#c8ccc0] pt-4 font-mono text-xs">
              <a
                href={`/data/${jId}/${releaseVer}/graph.json`}
                className="border border-[#080909] bg-[#080909] px-3 py-2 uppercase tracking-[0.12em] text-[#f5f3ed] no-underline"
              >
                Download graph.json (Graphology)
              </a>
              <a
                href={`/data/${jId}/${releaseVer}/graph.graphml`}
                className="border border-[#080909] bg-[#f5f3ed] px-3 py-2 uppercase tracking-[0.12em] text-[#080909] no-underline hover:bg-[#e5e6de]"
              >
                Download graph.graphml (Gephi)
              </a>
              <a
                href={`/data/${jId}/${releaseVer}/relations.json`}
                className="border border-[#080909] bg-[#f5f3ed] px-3 py-2 uppercase tracking-[0.12em] text-[#080909] no-underline hover:bg-[#e5e6de]"
              >
                Download relations.json (Schema 1.4)
              </a>
              <Link
                href="/data"
                className="border border-[#080909] bg-[#f5f3ed] px-3 py-2 uppercase tracking-[0.12em] text-[#080909] no-underline hover:bg-[#e5e6de]"
              >
                All Release Bundles &amp; Checksums
              </Link>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
