import React from "react";
import Link from "next/link";
import {
  fetchJurisdictionDataset,
  fetchManifest,
  getPrimaryPublicJurisdiction,
  getVisibleJurisdictions,
  isWithdrawnRelease,
} from "@/lib/data";
import { TopNav } from "@/components/TopNav";
import { computeDatasetPilotMetrics } from "@/lib/pilot-metrics";
import { computeHeroDocumentAndBodyCounts } from "@/lib/plain-language";
import { getSiteConfig } from "@/lib/site-config";

export default async function AboutPage() {
  const [manifest, pilotMetrics] = await Promise.all([
    fetchManifest(),
    computeDatasetPilotMetrics().catch(() => null),
  ]);
  const visible = getVisibleJurisdictions(manifest);
  const primary = getPrimaryPublicJurisdiction(manifest);
  const rootJur =
    visible.find((j) => visible.some((child) => child.parent === j.id)) ??
    primary;
  const cityLabel =
    pilotMetrics?.cityLabel ?? rootJur?.aliases?.[0] ?? rootJur?.name ?? "City";
  const withdrawnRelease = visible
    .flatMap((j) => j.releases)
    .find((rel) => isWithdrawnRelease(rel));

  const targetJurId =
    pilotMetrics?.parentJurisdictionId ?? rootJur?.id ?? primary?.id ?? "";
  const dataset = targetJurId
    ? await fetchJurisdictionDataset(targetJurId)
    : null;

  const { documentCount: rawDocCount, bodyCount: rawBodyCount } =
    computeHeroDocumentAndBodyCounts(dataset?.documents ?? []);
  const documentCount = pilotMetrics?.inForceDocumentsCount ?? rawDocCount;
  const bodyCount = pilotMetrics?.issuingBodiesCount ?? rawBodyCount;

  const issuingAuthorities = Array.from(
    new Set((dataset?.documents ?? []).map((d) => d.issuing_authority))
  );
  const siteCfg = getSiteConfig();

  return (
    <div className="min-h-screen bg-[#f5f3ed] text-[#080909]">
      <TopNav
        jurisdictionId={targetJurId}
        jurisdictionName={rootJur?.name}
        active="about"
      />

      <main
        data-dataset-id={
          pilotMetrics?.datasetId ??
          dataset?.release?.dataset_id ??
          manifest.dataset_id ??
          ""
        }
        className="mx-auto max-w-5xl space-y-14 px-5 py-10"
      >
        {/* Header */}
        <header className="border-b border-[#c8ccc0] pb-8">
          <div className="dg-mono text-[#5b5e56]">About</div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#080909] md:text-4xl">
            About Bylaw One
          </h1>
          <p className="dg-serif mt-3 text-base leading-relaxed text-[#171917]">
            Who runs Bylaw One, the principles behind every release, how{" "}
            {cityLabel}&apos;s {documentCount} in-force instruments from{" "}
            {bodyCount} statutory bodies are structured into one code, and the
            open licences governing the project.
          </p>
        </header>

        {/* 01 / Who runs Bylaw One */}
        <section
          id="who-runs-bylaw-one"
          aria-labelledby="who-runs-heading"
          data-testid="who-runs-bylaw-one"
          className="space-y-4 border-b border-[#c8ccc0] pb-12"
        >
          <div className="dg-mono text-[#5b5e56]">
            01 / Who runs Bylaw One
          </div>
          <h2
            id="who-runs-heading"
            className="text-2xl font-semibold tracking-tight text-[#080909]"
          >
            Stewardship &amp; permanent openness.
          </h2>
          <p className="dg-serif text-base leading-relaxed text-[#171917]">
            Bylaw One is run by <strong>{siteCfg.organisationName}</strong>.
            Every release follows six principles: the law&apos;s words exactly
            as printed with nothing added inside legal text, every rule traced
            to its official page with an archived copy, anything worked out by
            this site explicitly labelled as derived, disagreements settled by a
            stated statutory order with both rules kept visible, clear notice
            that this site is not legal advice, and permanent openness of all
            released code and data.
          </p>
          <p className="dg-serif text-base leading-relaxed text-[#171917]">
            Everything released by Bylaw One — both source code (Apache-2.0) and
            structured datasets, maps, and verifications (CC BY 4.0) — stays
            open permanently. Colleges, practitioners, and civic groups can{" "}
            <Link href="/join" className="text-[#080909] underline">
              join the partner and advisory network
            </Link>{" "}
            or{" "}
            <a
              href={`mailto:${siteCfg.contactEmail}`}
              className="text-[#080909] underline"
            >
              contact {siteCfg.contactEmail}
            </a>
            .
          </p>
        </section>

        {/* 02 / How this is built */}
        <section
          id="how-this-is-built"
          aria-labelledby="how-built-heading"
          className="space-y-6 border-b border-[#c8ccc0] pb-12"
        >
          <div className="dg-mono text-[#5b5e56]">02 / How this is built</div>
          <h2
            id="how-built-heading"
            className="text-2xl font-semibold tracking-tight text-[#080909]"
          >
            From official PDFs to one code.
          </h2>
          <p className="dg-serif text-base leading-relaxed text-[#171917]">
            Each act, building bye-law, master plan zoning regulation, and
            gazette amendment is acquired from its official publication,
            preserved in the Internet Archive, and structured into four layers:
          </p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="border border-[#c8ccc0] bg-[#efeee8] p-5">
              <div className="dg-mono text-[#080909]">1 · Source register</div>
              <p className="dg-serif mt-2 text-sm leading-relaxed text-[#171917]">
                Every instrument carries a retrieval record, cryptographic
                checksum, archive copy, explicit instrument type, and quoted
                commencement evidence. Drafts, bills, and convenience
                compilations are kept out of governing rules.
              </p>
            </div>

            <div className="border border-[#c8ccc0] bg-[#efeee8] p-5">
              <div className="dg-mono text-[#080909]">
                2 · Verbatim provisions &amp; tables
              </div>
              <p className="dg-serif mt-2 text-sm leading-relaxed text-[#171917]">
                Provisions are structured in the law&apos;s own hierarchy with
                tables as row nodes. Editorial explanations sit in separate
                &ldquo;In short, by this site&rdquo; records so quoted text is
                always the gazette&apos;s text.
              </p>
            </div>

            <div className="border border-[#c8ccc0] bg-[#efeee8] p-5">
              <div className="dg-mono text-[#080909]">
                3 · Dated amendments &amp; parameters
              </div>
              <p className="dg-serif mt-2 text-sm leading-relaxed text-[#171917]">
                Amending notifications apply dated substitution, insertion, or
                omission effects to produce consolidated texts per corporation,
                while setback, FAR, coverage, height, and parking tables are
                extracted as condition-bearing parameter records.
              </p>
            </div>

            <div className="border border-[#c8ccc0] bg-[#efeee8] p-5">
              <div className="dg-mono text-[#080909]">
                4 · Cross-document resolution
              </div>
              <p className="dg-serif mt-2 text-sm leading-relaxed text-[#171917]">
                Subjects join rules across instruments using a stated six-step
                statutory order, showing both what applies today and the older
                or replaced rules underneath.
              </p>
            </div>
          </div>

          <div>
            <Link
              href="/data"
              className="inline-flex min-h-[44px] items-center font-mono text-xs uppercase tracking-[0.12em] text-[#080909] underline decoration-[#080909] underline-offset-4"
            >
              Inspect data &amp; downloads →
            </Link>
          </div>
        </section>

        {/* 03 / How disagreements are handled */}
        <section
          aria-labelledby="disagreements-heading"
          className="space-y-4 border-b border-[#c8ccc0] pb-12"
        >
          <div className="dg-mono text-[#5b5e56]">
            03 / How disagreements are handled
          </div>
          <h2
            id="disagreements-heading"
            className="text-2xl font-semibold tracking-tight text-[#080909]"
          >
            Six steps, each with quoted authority.
          </h2>
          <p className="dg-serif text-base leading-relaxed text-[#171917]">
            When two instruments appear to set different rules for the same
            subject, the site applies six statutory rules in order and keeps
            both provisions visible:
          </p>

          <ol className="dg-serif list-decimal space-y-2 pl-5 text-sm leading-relaxed text-[#171917]">
            <li>
              <strong>Drafts never apply:</strong> Draft notifications inviting
              objections are stored for reference only until a final Gazette
              notification brings them into force.
            </li>
            <li>
              <strong>Corporation scope:</strong> A City Corporation amendment
              applies only inside that corporation&apos;s jurisdiction.
            </li>
            <li>
              <strong>Enabling statute prevails:</strong> Under Section 230 of
              the municipal governance Act, the Act&apos;s building provisions
              prevail over inconsistent rules or bye-laws.
            </li>
            <li>
              <strong>
                Bye-law 1.4 hands development parameters to the Master Plan:
              </strong>{" "}
              Under Bye-law 1.4 (from Notification UDD 14 TTP 2017), the Master
              Plan Zoning Regulations govern land use, coverage, FAR, setbacks,
              height, number of storeys, number of dwelling units, and parking.
              (The 2017 Model Building Bye-laws issued under the Municipalities
              Act 1964 apply to smaller municipalities, whereas the 2003
              Building Bye-laws and May 2026 City Corporation amendments remain
              the municipal bye-laws in force here.)
            </li>
            <li>
              <strong>Later in-force amendment wins:</strong> Within the same
              instrument family, a later in-force Gazette amendment supersedes
              an earlier provision on the same subject.
            </li>
            <li>
              <strong>Unresolved ties are stated openly:</strong> If two
              in-force provisions of equal rank still differ, both are shown
              side by side as not settled rather than guessing.
            </li>
          </ol>
        </section>

        {/* 04 / Verification */}
        <section
          aria-labelledby="verification-heading"
          className="space-y-4 border-b border-[#c8ccc0] pb-12"
        >
          <div className="dg-mono text-[#5b5e56]">04 / Verification</div>
          <h2
            id="verification-heading"
            className="text-2xl font-semibold tracking-tight text-[#080909]"
          >
            All checks are machine checks until verified by two people.
          </h2>
          <p className="dg-serif text-base leading-relaxed text-[#171917]">
            Automated machine checks verify every provision against the stored
            parser text of its cited source page and check every table value
            against parameter plausibility bounds; a record is marked verified
            by a person only after at least two independent workshop verifiers
            confirm a Match against the official PDF page.
            {withdrawnRelease
              ? ` An earlier demonstration release was withdrawn (${withdrawnRelease.withdrawn_reason}).`
              : ""}
          </p>
        </section>

        {/* 05 / Licences */}
        <section
          id="licence"
          aria-labelledby="licence-heading"
          className="space-y-4"
        >
          <div className="dg-mono text-[#5b5e56]">05 / Licences</div>
          <h2
            id="licence-heading"
            className="text-2xl font-semibold tracking-tight text-[#080909]"
          >
            Open licences &amp; attribution.
          </h2>
          <p className="dg-serif text-base leading-relaxed text-[#171917]">
            <strong>Code licence:</strong> Apache License 2.0 (Apache-2.0).{" "}
            <strong>Data licence:</strong> Creative Commons Attribution 4.0
            International (CC BY 4.0). Underlying statutes, rules, regulations,
            bye-laws, and gazette notifications are public government works
            under Section 52(1)(q) of the Indian Copyright Act 1957.
          </p>

          <details className="border-t border-[#c8ccc0] pt-4">
            <summary className="inline-flex min-h-[44px] cursor-pointer items-center font-mono text-xs uppercase tracking-[0.12em] text-[#5b5e56] underline">
              Details · Attributed authorities &amp; data repositories
            </summary>
            <ul className="dg-serif mt-2 list-disc space-y-1 pl-5 text-sm text-[#171917]">
              <li>
                OpenStreetMap contributors (Open Database License, ODbL 1.0) for
                base map tiles and street centre-line alignment checks.
              </li>
              {issuingAuthorities.map((auth, idx) => (
                <li key={idx}>{auth}</li>
              ))}
            </ul>
          </details>
        </section>
      </main>
    </div>
  );
}
