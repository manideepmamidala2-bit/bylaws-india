import React from "react";
import Link from "next/link";
import {
  fetchDeclarations,
  fetchManifest,
  getVisibleJurisdictions,
  isWithdrawnRelease,
} from "@/lib/data";
import { TopNav } from "@/components/TopNav";

export default async function DataReleasesPage() {
  const manifest = await fetchManifest();
  const visibleJurisdictions = getVisibleJurisdictions(manifest);
  const primary = visibleJurisdictions[0];

  const declarationsByJurisdiction = await Promise.all(
    visibleJurisdictions.map(async (j) => {
      const hasActiveRelease =
        Boolean(j.latest_release) &&
        j.releases.some((rel) => !isWithdrawnRelease(rel));
      return {
        id: j.id,
        declarations: hasActiveRelease ? await fetchDeclarations(j.id) : null,
      };
    })
  );
  const declMap = new Map(
    declarationsByJurisdiction.map((item) => [item.id, item.declarations])
  );

  return (
    <div className="min-h-screen bg-[#f5f3ed] text-[#080909]">
      <TopNav
        jurisdictionId={primary?.id}
        jurisdictionName={primary?.name}
        active="data"
        releaseVersion={primary?.latest_release ?? undefined}
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
            Download versioned regulatory bundles, verify file integrity against
            published SHA-256 checksums, download machine-readable source
            registers in CSV and JSON, and inspect declared coverage and gaps.
          </p>
        </header>

        <div className="space-y-8">
          {visibleJurisdictions.map((j) => {
            const decl = declMap.get(j.id);
            const hasActiveRelease =
              Boolean(j.latest_release) &&
              j.releases.some((rel) => !isWithdrawnRelease(rel));

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
                    {hasActiveRelease
                      ? `Latest: v${j.latest_release}`
                      : "No data published yet"}
                  </span>
                </div>

                <div className="mt-4 space-y-4">
                  {j.register_documents && !hasActiveRelease && (
                    <div className="border border-[#080909] bg-[#efeee8] p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-mono text-sm font-semibold text-[#080909]">
                          Core Source Register
                        </span>
                        <span className="border border-[#080909] bg-[#f5f3ed] px-2 py-0.5 font-mono text-xs uppercase text-[#080909]">
                          Not yet structured
                        </span>
                      </div>
                      <p className="dg-serif mt-1.5 text-sm text-[#171917]">
                        Core building bye-laws, master plan zoning regulations,
                        and amendment notifications acquired with SHA-256
                        checksums, quoted status evidence, and Wayback Machine
                        snapshots. Clause structuring is in progress.
                      </p>
                      <div className="mt-3 flex flex-wrap gap-3 font-mono text-[11px] uppercase tracking-[0.12em]">
                        <Link
                          href={`/j/${j.id}/sources`}
                          className="border border-[#080909] bg-[#080909] px-3 py-1.5 text-[#f5f3ed] no-underline"
                        >
                          Browse Source Register →
                        </Link>
                        <a
                          href={j.register_documents}
                          className="border border-[#080909] bg-[#f5f3ed] px-3 py-1.5 text-[#080909] no-underline"
                        >
                          Core Source Register (.json)
                        </a>
                      </div>
                    </div>
                  )}

                  {j.releases.map((rel) => {
                    const withdrawn = isWithdrawnRelease(rel);
                    const withdrawnReason =
                      rel.withdrawn_reason ||
                      `Synthetic demonstration data, not the law of ${j.name}`;

                    return (
                      <div
                        key={rel.version}
                        className="border border-[#c8ccc0] bg-[#efeee8] p-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-mono text-sm font-semibold text-[#080909]">
                            Release v{rel.version} · {rel.released_at}
                          </span>
                          <span className="border border-[#080909] bg-[#f5f3ed] px-2 py-0.5 font-mono text-xs uppercase text-[#080909]">
                            {withdrawn ? "Withdrawn" : `Licence: ${rel.licence}`}
                          </span>
                        </div>

                        {withdrawn ? (
                          <p className="dg-serif mt-2 text-sm text-[#171917]">
                            Withdrawn: {withdrawnReason}
                          </p>
                        ) : (
                          <>
                            <p className="dg-serif mt-1 text-sm text-[#171917]">
                              {rel.changelog}
                            </p>

                            <div className="mt-3 flex flex-wrap gap-3 font-mono text-[11px] uppercase tracking-[0.12em]">
                              {rel.download_zip && (
                                <a
                                  href={rel.download_zip}
                                  className="border border-[#080909] bg-[#080909] px-3 py-1.5 text-[#f5f3ed] no-underline"
                                >
                                  Download Bundle (.zip)
                                </a>
                              )}
                              {rel.sha256sums && (
                                <a
                                  href={rel.sha256sums}
                                  className="border border-[#080909] bg-[#f5f3ed] px-3 py-1.5 text-[#080909] no-underline"
                                >
                                  SHA256SUMS
                                </a>
                              )}
                              {rel.files?.sources_csv && (
                                <a
                                  href={rel.files.sources_csv}
                                  className="border border-[#080909] bg-[#f5f3ed] px-3 py-1.5 text-[#080909] no-underline"
                                >
                                  Source Register (.csv)
                                </a>
                              )}
                              {rel.files?.sources_json && (
                                <a
                                  href={rel.files.sources_json}
                                  className="border border-[#080909] bg-[#f5f3ed] px-3 py-1.5 text-[#080909] no-underline"
                                >
                                  Source Register (.json)
                                </a>
                              )}
                              {rel.declarations && (
                                <a
                                  href={rel.declarations}
                                  className="border border-[#080909] bg-[#f5f3ed] px-3 py-1.5 text-[#080909] no-underline"
                                >
                                  Declarations (.json)
                                </a>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>

                {decl && (
                  <div className="mt-6 grid grid-cols-1 gap-4 border-t border-[#c8ccc0] pt-4 text-xs md:grid-cols-2">
                    <div className="space-y-3">
                      {decl.known_gaps && decl.known_gaps.length > 0 && (
                        <div>
                          <h3 className="dg-mono text-[#080909]">
                            Coverage Notes ({decl.known_gaps.length})
                          </h3>
                          {decl.known_gaps.map((kg, kIdx) => (
                            <div
                              key={`${kg.doc_id}-${kIdx}`}
                              className="mt-1 border-l-2 border-[#080909] pl-3"
                            >
                              <div className="font-mono text-xs font-semibold">
                                {kg.doc_id}
                              </div>
                              <p className="dg-serif text-xs text-[#171917]">
                                {kg.description}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}

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
              Open Licences (CC BY 4.0 &amp; Apache-2.0)
            </h2>
            <p className="dg-serif mt-2 text-sm text-[#171917]">
              Structured regulatory data, consolidated views, georeferenced
              zoning layers, and reports are published under{" "}
              <strong>
                Creative Commons Attribution 4.0 International (CC BY 4.0)
              </strong>
              . Source code is licensed under{" "}
              <strong>Apache License 2.0 (Apache-2.0)</strong>. Underlying
              statutes, rules, regulations, bye-laws, and gazette notifications
              are public government publications under Section 52(1)(q) of the
              Indian Copyright Act, 1957.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
