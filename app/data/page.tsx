import React from "react";
import {
  fetchDeclarations,
  fetchManifest,
  getVisibleJurisdictions,
} from "@/lib/data";
import { TopNav } from "@/components/TopNav";

export default async function DataReleasesPage() {
  const manifest = await fetchManifest();
  const visibleJurisdictions = getVisibleJurisdictions(manifest);
  const primary = visibleJurisdictions[0];

  const declarationsByJurisdiction = await Promise.all(
    visibleJurisdictions.map(async (j) => ({
      id: j.id,
      declarations: await fetchDeclarations(j.id),
    }))
  );
  const declMap = new Map(
    declarationsByJurisdiction.map((item) => [item.id, item.declarations])
  );

  const bibtexSnippet = `@dataset{structured_building_bylaws_2026,
  title     = {Structured Building Bylaws — Versioned Open Regulatory Dataset},
  year      = {2026},
  version   = {${primary?.latest_release ?? "1.0.0"}},
  license   = {CC-BY-4.0},
  url       = {https://bylaws-india.vercel.app/data}
}`;

  return (
    <div className="min-h-screen bg-[#f5f3ed] text-[#080909]">
      <TopNav
        jurisdictionId={primary?.id}
        jurisdictionName={primary?.name}
        active="data"
        releaseVersion={primary?.latest_release}
      />

      <main className="mx-auto max-w-6xl px-6 py-8">
        <header className="mb-8 border-b border-[#080909] pb-6">
          <div className="dg-mono">
            Open Data Releases · Schema v{manifest.schema_version} · CC BY 4.0
          </div>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-[#080909]">
            Dataset Releases, Checksums &amp; Declarations
          </h1>
          <p className="dg-serif mt-2 max-w-3xl text-base text-[#171917]">
            Download complete versioned regulatory bundles (`.zip`), verify file
            integrity against `SHA256SUMS`, download machine-readable source
            registers (`CSV` and `JSON`), and inspect self-declared scope and
            contested-status notes (`declarations.json`).
          </p>
        </header>

        <div className="space-y-8">
          {visibleJurisdictions.map((j) => {
            const decl = declMap.get(j.id);
            return (
              <section
                key={j.id}
                aria-label={`Releases for ${j.name}`}
                className="border border-[#080909] bg-[#f5f3ed] p-6"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[#c8ccc0] pb-4">
                  <div>
                    <div className="dg-mono">{j.id}</div>
                    <h2 className="mt-1 text-2xl font-semibold text-[#080909]">
                      {j.name}
                    </h2>
                  </div>
                  <span className="border border-[#080909] bg-[#efeee8] px-2.5 py-1 font-mono text-xs uppercase">
                    Latest: v{j.latest_release}
                  </span>
                </div>

                <div className="mt-4 space-y-4">
                  {j.releases.map((rel) => (
                    <div
                      key={rel.version}
                      className="border border-[#c8ccc0] bg-[#efeee8] p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-mono text-sm font-semibold text-[#080909]">
                          Release v{rel.version} · {rel.released_at}
                        </span>
                        <span className="font-mono text-xs text-[#5b5e56]">
                          Licence: {rel.licence}
                        </span>
                      </div>
                      <p className="dg-serif mt-1 text-sm text-[#171917]">
                        {rel.changelog}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-3 font-mono text-[11px] uppercase tracking-[0.12em]">
                        <a
                          href={rel.download_zip}
                          className="border border-[#080909] bg-[#080909] px-3 py-1.5 text-[#f5f3ed] no-underline"
                        >
                          Download Bundle (.zip) ↓
                        </a>
                        <a
                          href={rel.sha256sums}
                          className="border border-[#080909] bg-[#f5f3ed] px-3 py-1.5 text-[#080909] no-underline"
                        >
                          SHA256SUMS
                        </a>
                        {rel.files.sources_csv && (
                          <a
                            href={rel.files.sources_csv}
                            className="border border-[#080909] bg-[#f5f3ed] px-3 py-1.5 text-[#080909] no-underline"
                          >
                            Source Register (.csv)
                          </a>
                        )}
                        {rel.files.sources_json && (
                          <a
                            href={rel.files.sources_json}
                            className="border border-[#080909] bg-[#f5f3ed] px-3 py-1.5 text-[#080909] no-underline"
                          >
                            Source Register (.json)
                          </a>
                        )}
                        <a
                          href={rel.declarations}
                          className="border border-[#080909] bg-[#f5f3ed] px-3 py-1.5 text-[#080909] no-underline"
                        >
                          declarations.json
                        </a>
                      </div>
                    </div>
                  ))}
                </div>

                {decl && (
                  <div className="mt-6 grid grid-cols-1 gap-4 border-t border-[#c8ccc0] pt-4 text-xs md:grid-cols-2">
                    <div>
                      <h3 className="dg-mono text-[#080909]">
                        Not Modelled ({decl.not_modelled.length})
                      </h3>
                      <ul className="dg-serif mt-2 list-disc space-y-1 pl-5 text-sm text-[#171917]">
                        {decl.not_modelled.map((nm, idx) => (
                          <li key={idx}>{nm}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <h3 className="dg-mono text-[#080909]">
                          Contested Status ({decl.contested_status?.length ?? 0})
                        </h3>
                        {(decl.contested_status ?? []).map((cs) => (
                          <div
                            key={cs.doc_id}
                            className="mt-1 border-l-2 border-[#080909] pl-3"
                          >
                            <div className="font-mono text-xs font-semibold">
                              {cs.doc_id}: {cs.title} ({cs.declared_status})
                            </div>
                            <p className="dg-serif text-xs text-[#5b5e56]">
                              {cs.conflicting_evidence.join(" ")}
                            </p>
                          </div>
                        ))}
                      </div>

                      <div>
                        <h3 className="dg-mono text-[#080909]">
                          Unobtainable Scans (
                          {decl.unobtainable_documents?.length ?? 0})
                        </h3>
                        {(decl.unobtainable_documents ?? []).map((ud) => (
                          <div
                            key={ud.id}
                            className="mt-1 border-l-2 border-[#c8ccc0] pl-3"
                          >
                            <div className="font-mono text-xs font-semibold">
                              {ud.id}: {ud.title}
                            </div>
                            <p className="dg-serif text-xs text-[#5b5e56]">
                              {ud.reason}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </section>
            );
          })}

          <section
            aria-label="How to cite and licence"
            className="border border-[#080909] bg-[#efeee8] p-6"
          >
            <div className="dg-mono">Licence &amp; Citation</div>
            <h2 className="mt-1 text-xl font-semibold text-[#080909]">
              How to Cite This Dataset (CC BY 4.0)
            </h2>
            <p className="dg-serif mt-2 text-sm text-[#171917]">
              All structured clause trees, amendment links, consolidated views,
              georeferenced zoning layers, and reports are licensed under{" "}
              <strong>
                Creative Commons Attribution 4.0 International (CC BY 4.0)
              </strong>
              . Underlying statutes, rules, regulations, bye-laws, and gazette
              notifications are public government publications under Section
              52(1)(q) of the Indian Copyright Act, 1957.
            </p>
            <pre className="mt-3 overflow-x-auto border border-[#080909] bg-[#f5f3ed] p-3 font-mono text-xs text-[#080909]">
              {bibtexSnippet}
            </pre>
          </section>
        </div>
      </main>
    </div>
  );
}
