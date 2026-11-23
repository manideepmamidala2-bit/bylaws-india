import React from "react";
import {
  fetchJurisdictionDataset,
  fetchManifest,
  getVisibleJurisdictions,
} from "@/lib/data";
import { TopNav } from "@/components/TopNav";

export default async function AboutPage() {
  const manifest = await fetchManifest();
  const visible = getVisibleJurisdictions(manifest);
  const primary = visible[0];
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
        releaseVersion={primary?.latest_release}
      />

      <main className="mx-auto max-w-5xl space-y-8 px-6 py-8">
        <header className="border-b border-[#080909] pb-6">
          <div className="dg-mono">
            Methodology · Verification · Provenance · Open Licences
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
          aria-label="Pipeline methodology and rules"
          className="grid grid-cols-1 gap-6 md:grid-cols-2"
        >
          <div className="border border-[#080909] bg-[#efeee8] p-5">
            <div className="dg-mono text-[#080909]">
              1. Mandatory Provenance &amp; Verification (Rules R2, R9, R10)
            </div>
            <h2 className="mt-1 text-lg font-semibold text-[#080909]">
              Verification Levels
            </h2>
            <ul className="dg-serif mt-2 list-disc space-y-1.5 pl-5 text-sm text-[#171917]">
              <li>
                <strong className="font-mono text-xs uppercase">
                  unverified
                </strong>
                : Raw automated extraction prior to QA verification.
              </li>
              <li>
                <strong className="font-mono text-xs uppercase">
                  machine_checked
                </strong>
                : Verified by automated 9-point QA and clause-to-page self-check
                with page and bounding-box citations.
              </li>
              <li>
                <strong className="font-mono text-xs uppercase">
                  human_verified
                </strong>
                : Reserved strictly for human reviewers (never assigned by
                automated agents, Rule R10). Corrections create immutable
                record versions (`@v1` → `@v2`, Rule R9 &amp; R12).
              </li>
            </ul>
          </div>

          <div className="border border-[#080909] bg-[#efeee8] p-5">
            <div className="dg-mono text-[#080909]">
              2. Derived Work &amp; Text Rights (Rules R13 &amp; R14)
            </div>
            <h2 className="mt-1 text-lg font-semibold text-[#080909]">
              What &ldquo;Derived by This Project&rdquo; Means
            </h2>
            <p className="dg-serif mt-2 text-sm text-[#171917]">
              Under <strong>Rule R14</strong>, any consolidated &ldquo;as
              amended&rdquo; clause text, georeferenced master plan zone polygon,
              or buffered influence-zone overlay computed by our pipeline carries{" "}
              <code className="font-mono text-xs">derived: true</code>, is
              labelled{" "}
              <em>
                &ldquo;derived by this project, not an official
                publication&rdquo;
              </em>
              , states its exact method and accuracy estimate, and links back to
              the underlying official gazettes.
            </p>
            <p className="dg-serif mt-2 text-sm text-[#171917]">
              Under <strong>Rule R13</strong>, government statutes, rules,
              regulations, bye-laws, and gazette notifications are published as{" "}
              <code className="font-mono text-xs">full_text</code>, whereas
              copyrighted standards and restricted aviation portals are recorded
              as <code className="font-mono text-xs">reference_only</code>{" "}
              citations without reproducing their text or height surfaces.
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
            <strong>Code Licence</strong>: Apache License 2.0 (
            <code className="font-mono text-xs">Apache-2.0</code>).{" "}
            <strong>Data Licence</strong>: Creative Commons Attribution 4.0
            International (<code className="font-mono text-xs">CC BY 4.0</code>
            ).{" "}
            <strong>Disclaimer</strong>: This platform is an informational and
            research dataset, not legal or architectural advice; always verify
            plot boundaries and applicable rules with the competent planning and
            municipal authorities.
          </p>

          <div className="mt-4 border-t border-[#c8ccc0] pt-4">
            <h3 className="dg-mono text-[#080909]">
              Attributed Authorities &amp; Data Repositories
            </h3>
            <ul className="dg-serif mt-2 list-disc space-y-1 pl-5 text-sm text-[#171917]">
              <li>
                OpenStreetMap contributors (Open Database License,{" "}
                <code className="font-mono text-xs">ODbL 1.0</code>) for base
                map tiles and transit alignment references.
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
