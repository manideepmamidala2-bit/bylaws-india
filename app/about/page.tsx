import React from "react";
import Link from "next/link";
import {
  fetchDeclarations,
  fetchJurisdictionDataset,
  fetchManifest,
  getPrimaryPublicJurisdiction,
  getVisibleJurisdictions,
  isWithdrawnRelease,
} from "@/lib/data";
import { TopNav } from "@/components/TopNav";
import { computeHeroDocumentAndBodyCounts } from "@/lib/plain-language";

export default async function AboutPage() {
  const manifest = await fetchManifest();
  const visible = getVisibleJurisdictions(manifest);
  const primary = getPrimaryPublicJurisdiction(manifest);
  const rootJur =
    visible.find((j) => visible.some((child) => child.parent === j.id)) ??
    primary;
  const cityLabel = rootJur?.aliases?.[0] ?? rootJur?.name ?? "City";
  const withdrawnRelease = visible
    .flatMap((j) => j.releases)
    .find((rel) => isWithdrawnRelease(rel));

  const targetJurId = rootJur?.id ?? primary?.id ?? "";
  const [dataset, declarations] = targetJurId
    ? await Promise.all([
        fetchJurisdictionDataset(targetJurId),
        fetchDeclarations(targetJurId).catch(() => null),
      ])
    : [null, null];

  const { documentCount, bodyCount } = computeHeroDocumentAndBodyCounts(
    dataset?.documents ?? []
  );

  const issuingAuthorities = Array.from(
    new Set((dataset?.documents ?? []).map((d) => d.issuing_authority))
  );

  return (
    <div className="min-h-screen bg-[#f5f3ed] text-[#080909]">
      <TopNav
        jurisdictionId={targetJurId}
        jurisdictionName={rootJur?.name}
        active="about"
      />

      <main className="mx-auto max-w-5xl space-y-14 px-5 py-10">
        {/* Header */}
        <header className="border-b border-[#c8ccc0] pb-8">
          <div className="dg-mono text-[#5b5e56]">About</div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#080909] md:text-4xl">
            About Bylaw One
          </h1>
          <p className="dg-serif mt-3 text-base leading-relaxed text-[#171917]">
            Bylaw One gathers {cityLabel}&apos;s scattered building rules (
            {documentCount} in-force instruments from {bodyCount} statutory
            bodies) into one readable code, with every rule traced to its
            official page and overlaps resolved openly.
          </p>
        </header>

        {/* 01 / How this is built */}
        <section
          id="how-this-is-built"
          aria-labelledby="how-built-heading"
          className="space-y-6 border-b border-[#c8ccc0] pb-12"
        >
          <div className="dg-mono text-[#5b5e56]">01 / How this is built</div>
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

        {/* 02 / How disagreements are handled */}
        <section
          aria-labelledby="disagreements-heading"
          className="space-y-4 border-b border-[#c8ccc0] pb-12"
        >
          <div className="dg-mono text-[#5b5e56]">
            02 / How disagreements are handled
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

        {/* 03 / Verification */}
        <section
          aria-labelledby="verification-heading"
          className="space-y-4 border-b border-[#c8ccc0] pb-12"
        >
          <div className="dg-mono text-[#5b5e56]">03 / Verification</div>
          <h2
            id="verification-heading"
            className="text-2xl font-semibold tracking-tight text-[#080909]"
          >
            All checks are machine checks.
          </h2>
          <p className="dg-serif text-base leading-relaxed text-[#171917]">
            All checks in this dataset are automated machine checks against the
            source PDFs and page images; nothing on this site is presented as
            verified by a person. Every provision is tested against the parser
            text of its cited source page, and every table value is checked
            against parameter plausibility bounds.
            {withdrawnRelease
              ? ` An earlier demonstration release was withdrawn (${withdrawnRelease.withdrawn_reason}).`
              : ""}
          </p>
        </section>

        {/* 04 / Questions people ask (Full FAQ) */}
        <section
          aria-labelledby="full-faq-heading"
          className="space-y-4 border-b border-[#c8ccc0] pb-12"
        >
          <div className="dg-mono text-[#5b5e56]">04 / Questions people ask</div>
          <h2
            id="full-faq-heading"
            className="text-2xl font-semibold tracking-tight text-[#080909]"
          >
            Frequently asked questions.
          </h2>

          <div className="divide-y divide-[#c8ccc0] border-y border-[#c8ccc0]">
            <details className="py-3" open>
              <summary className="flex min-h-[44px] cursor-pointer items-center justify-between font-medium text-[#080909]">
                <span>Is this official?</span>
              </summary>
              <p className="dg-serif mt-2 pb-2 text-sm leading-relaxed text-[#171917]">
                No. Bylaw One is worked out from the official documents, each
                linked to its government PDF and an archived snapshot. It is not
                an official government publication.
              </p>
            </details>

            <details className="py-3">
              <summary className="flex min-h-[44px] cursor-pointer items-center justify-between font-medium text-[#080909]">
                <span>Where does the text come from?</span>
              </summary>
              <p className="dg-serif mt-2 pb-2 text-sm leading-relaxed text-[#171917]">
                Every provision is extracted from official Gazette, development
                authority, and municipal PDFs. No legal text is rewritten or
                invented; site summaries are always labelled &ldquo;In short, by
                this site&rdquo;.
              </p>
            </details>

            <details className="py-3">
              <summary className="flex min-h-[44px] cursor-pointer items-center justify-between font-medium text-[#080909]">
                <span>What is missing?</span>
              </summary>
              <ul className="dg-serif mt-2 list-disc space-y-1.5 pb-2 pl-5 text-sm leading-relaxed text-[#171917]">
                {(declarations?.not_modelled ?? []).map((nm, idx) => (
                  <li key={idx}>{nm.replace(/\s*\([A-Z0-9\s-]+\)/g, "")}</li>
                ))}
              </ul>
            </details>

            <details className="py-3">
              <summary className="flex min-h-[44px] cursor-pointer items-center justify-between font-medium text-[#080909]">
                <span>Do the 2017 Model Building Bye-laws apply here?</span>
              </summary>
              <p className="dg-serif mt-2 pb-2 text-sm leading-relaxed text-[#171917]">
                The 2017 Model Building Bye-laws were issued under the
                Municipalities Act 1964 for smaller municipalities, whereas the
                2003 Building Bye-laws (and the May 2026 City Corporation
                amendments) remain the municipal bye-laws in force. Clause 1(3)
                of Notification UDD 14 TTP 2017 is published on the official
                building plan approval portal as Bye-law 1.4, routing zoning
                parameters to the Master Plan.
              </p>
            </details>
          </div>
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
