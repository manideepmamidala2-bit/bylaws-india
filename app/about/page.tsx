import React from "react";
import {
  fetchJurisdictionDataset,
  fetchManifest,
  getPrimaryPublicJurisdiction,
  getVisibleJurisdictions,
  isWithdrawnRelease,
} from "@/lib/data";
import { TopNav } from "@/components/TopNav";

export default async function AboutPage() {
  const manifest = await fetchManifest();
  const visible = getVisibleJurisdictions(manifest);
  const primary = getPrimaryPublicJurisdiction(manifest);
  const withdrawnRelease = visible
    .flatMap((j) => j.releases)
    .find((rel) => isWithdrawnRelease(rel));
  const dataset = primary
    ? await fetchJurisdictionDataset(primary.id)
    : null;

  const issuingAuthorities = Array.from(
    new Set((dataset?.documents ?? []).map((d) => d.issuing_authority))
  );

  return (
    <div className="min-h-screen bg-[#f5f3ed] text-[#080909]">
      <TopNav
        jurisdictionId={primary?.id}
        jurisdictionName={primary?.name}
        active="about"
        releaseVersion={primary?.latest_release ?? undefined}
      />

      <main className="mx-auto max-w-5xl space-y-8 px-6 py-8">
        <header className="border-b border-[#080909] pb-6">
          <div className="dg-mono">
            Methodology · Provenance · Open Licences
          </div>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-[#080909]">
            About Structured Building Bylaws
          </h1>
          <p className="dg-serif mt-2 max-w-3xl text-base leading-relaxed text-[#171917]">
            Structured Building Bylaws is a reproducible pipeline and open
            regulatory dataset that converts municipal building bye-laws, master
            plan zoning regulations, enabling statutes, and land-use maps into
            schema-validated, citable data.
          </p>
        </header>

        <section
          aria-label="Current project status"
          className="border border-[#080909] bg-[#efeee8] p-6"
        >
          <div className="dg-mono text-[#080909]">Current Status</div>
          <h2 className="mt-1 text-lg font-semibold text-[#080909]">
            {primary?.latest_release
              ? `Release ${primary.latest_release} published; all checks are machine checks`
              : "Consolidated building code published"}
          </h2>
          <p className="dg-serif mt-2 text-sm leading-relaxed text-[#171917]">
            All checks in this dataset are automated machine checks against the
            source PDFs and page images; nothing on this site is presented as
            verified by a person.
            {withdrawnRelease
              ? ` Release ${withdrawnRelease.version} was withdrawn (${withdrawnRelease.withdrawn_reason}); real source acquisition and verification under way for remaining map sheets.`
              : ""}
          </p>
        </section>

        <section
          aria-label="Pipeline methodology"
          className="grid grid-cols-1 gap-6 md:grid-cols-2"
        >
          <div className="border border-[#080909] bg-[#efeee8] p-5">
            <div className="dg-mono text-[#080909]">
              1. Provenance &amp; Verification States
            </div>
            <h2 className="mt-1 text-lg font-semibold text-[#080909]">
              Verification Levels
            </h2>
            <ul className="dg-serif mt-2 list-disc space-y-1.5 pl-5 text-sm text-[#171917]">
              <li>
                <strong className="font-mono text-xs uppercase">
                  Unchecked
                </strong>
                : Raw automated extraction prior to quality checks.
              </li>
              <li>
                <strong className="font-mono text-xs uppercase">
                  Machine-checked
                </strong>
                : Checked by automated quality thresholds and page-image
                self-checks with page and bounding-box citations.
              </li>
              <li>
                <strong className="font-mono text-xs uppercase">
                  Verified by a person (not claimed here)
                </strong>
                : Reserved strictly for records checked directly by a person
                against the source document. Nothing in this release is marked
                as verified by a person.
              </li>
            </ul>
          </div>

          <div className="border border-[#080909] bg-[#efeee8] p-5">
            <div className="dg-mono text-[#080909]">
              2. Derived Work &amp; Text Rights
            </div>
            <h2 className="mt-1 text-lg font-semibold text-[#080909]">
              What Derived by This Project Means
            </h2>
            <p className="dg-serif mt-2 text-sm text-[#171917]">
              Any consolidated &ldquo;as amended&rdquo; text, georeferenced
              master plan zone polygon, or buffered influence-zone overlay
              computed by our pipeline is explicitly marked as derived by this
              project, not an official publication, states the method and
              measured accuracy, and links back to the underlying source
              documents.
            </p>
            <p className="dg-serif mt-2 text-sm text-[#171917]">
              Government statutes, rules, regulations, bye-laws, and gazette
              notifications are published as full text where available, whereas
              copyrighted standards (such as the National Building Code) are
              listed as references only without reproducing their text.
            </p>
          </div>
        </section>

        <section
          aria-label="Licences and attribution"
          className="border border-[#080909] bg-[#f5f3ed] p-6"
        >
          <div className="dg-mono">Licences, Limitations &amp; Attribution</div>
          <h2 className="mt-1 text-xl font-semibold text-[#080909]">
            Open Licences &amp; Upstream Sources
          </h2>
          <p className="dg-serif mt-2 text-sm text-[#171917]">
            <strong>Code Licence</strong>: Apache License 2.0 (Apache-2.0).{" "}
            <strong>Data Licence</strong>: Creative Commons Attribution 4.0
            International (CC BY 4.0).{" "}
            <strong>Disclaimer</strong>: This platform is an informational and
            research dataset, not legal or architectural advice; always confirm
            plot boundaries and applicable rules with the competent planning and
            municipal authorities.
          </p>

          <div className="mt-4 border-t border-[#c8ccc0] pt-4">
            <h3 className="dg-mono text-[#080909]">
              Attributed Authorities &amp; Data Repositories
            </h3>
            <ul className="dg-serif mt-2 list-disc space-y-1 pl-5 text-sm text-[#171917]">
              <li>
                OpenStreetMap contributors (Open Database License, ODbL 1.0) for
                base map tiles and transit alignment references.
              </li>
              {issuingAuthorities.map((auth, idx) => (
                <li key={idx}>{auth}</li>
              ))}
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
}
