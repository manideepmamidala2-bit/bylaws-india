import React from "react";
import Link from "next/link";
import { TopNav } from "@/components/TopNav";
import { computeDatasetPilotMetrics } from "@/lib/pilot-metrics";
import {
  buildJoinPilotIssueUrl,
  buildReportProblemIssueUrl,
  buildSuggestSourceIssueUrl,
  getSiteConfig,
} from "@/lib/site-config";

export default async function JoinPage() {
  const m = await computeDatasetPilotMetrics();
  const siteCfg = getSiteConfig();
  const joinFormUrl = buildJoinPilotIssueUrl();
  const suggestSourceUrl = buildSuggestSourceIssueUrl();
  const reportProblemUrl = buildReportProblemIssueUrl({ pagePath: "/join" });

  return (
    <div className="min-h-screen bg-[#f5f3ed] text-[#080909]">
      <TopNav
        jurisdictionId={m.parentJurisdictionId}
        jurisdictionName={m.regionLabel}
        active="about"
      />

      <main
        data-dataset-id={m.datasetId}
        className="mx-auto max-w-5xl space-y-12 px-5 py-10"
      >
        <header className="border-b border-[#c8ccc0] pb-8">
          <div className="dg-mono text-[#5b5e56]">
            Join the {m.cityLabel} Pilot
          </div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#080909] md:text-4xl">
            Join the pilot
          </h1>
          <p className="dg-serif mt-3 max-w-3xl text-base leading-relaxed text-[#171917]">
            Bylaw One is an open public reference built with colleges, students,
            practising professionals, and civic data groups. Every verified
            contribution carries named credit in the release metadata and
            release notes.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* 1. Colleges */}
          <section
            aria-labelledby="join-colleges-heading"
            data-testid="join-section-colleges"
            className="border border-[#080909] bg-[#efeee8] p-6"
          >
            <div className="dg-mono text-[#5b5e56]">01 / Colleges</div>
            <h2
              id="join-colleges-heading"
              className="mt-1 text-xl font-semibold text-[#080909]"
            >
              Colleges &amp; faculties
            </h2>
            <p className="dg-serif mt-2 text-sm leading-relaxed text-[#171917]">
              Sign a free, non-exclusive MoU with real activities each semester:
              a one-day hands-on workshop, a faculty session, and supervised
              student verification internships of 60 to 120 hours. Partner
              colleges receive named credit in every release, a citable dataset
              (with DOI/Zenodo metadata), and the opportunity to serve as a
              city or state steward.
            </p>
          </section>

          {/* 2. Students */}
          <section
            aria-labelledby="join-students-heading"
            data-testid="join-section-students"
            className="border border-[#080909] bg-[#efeee8] p-6"
          >
            <div className="dg-mono text-[#5b5e56]">02 / Students</div>
            <h2
              id="join-students-heading"
              className="mt-1 text-xl font-semibold text-[#080909]"
            >
              Students
            </h2>
            <p className="dg-serif mt-2 text-sm leading-relaxed text-[#171917]">
              Our one-day workshop teaches how to read city building rules across
              acts, bye-laws, and master plans, and how to use AI tools while
              checking every claim against the official gazette page. Students
              can complete 60 to 120-hour supervised verification internships,
              earn certificates, and have their names and institution recorded
              on every provision they verify.
            </p>
            <div className="mt-4">
              <Link
                href={`/verify/${m.sampleTaskSetId}`}
                className="font-mono text-xs uppercase tracking-[0.1em] text-[#080909] underline"
              >
                Open sample workshop task set →
              </Link>
            </div>
          </section>

          {/* 3. Practitioners */}
          <section
            aria-labelledby="join-practitioners-heading"
            data-testid="join-section-practitioners"
            className="border border-[#080909] bg-[#efeee8] p-6"
          >
            <div className="dg-mono text-[#5b5e56]">03 / Practitioners</div>
            <h2
              id="join-practitioners-heading"
              className="mt-1 text-xl font-semibold text-[#080909]"
            >
              Practitioners
            </h2>
            <p className="dg-serif mt-2 text-sm leading-relaxed text-[#171917]">
              Architects, urban planners, structural and fire engineers, and
              property lawyers can report problems on any rule row, review
              provisions and edge cases in their field of practice, and receive
              early access to the local Bylaw One agent engine (MCP server, CLI,
              and Agent Skill).
            </p>
            <div className="mt-4">
              <a
                href={reportProblemUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-xs uppercase tracking-[0.1em] text-[#080909] underline"
              >
                Report a problem with a rule ↗
              </a>
            </div>
          </section>

          {/* 4. Civic and data groups */}
          <section
            aria-labelledby="join-civic-heading"
            data-testid="join-section-civic"
            className="border border-[#080909] bg-[#efeee8] p-6"
          >
            <div className="dg-mono text-[#5b5e56]">
              04 / Civic &amp; data groups
            </div>
            <h2
              id="join-civic-heading"
              className="mt-1 text-xl font-semibold text-[#080909]"
            >
              Civic and data groups
            </h2>
            <p className="dg-serif mt-2 text-sm leading-relaxed text-[#171917]">
              Help locate hard-to-find gazette notifications, historical
              amendments, circulars, and high-resolution master plan map scans,
              or cross-check ward and planning-district boundaries. All curated
              data is published permanently under CC BY 4.0.
            </p>
            <div className="mt-4">
              <a
                href={suggestSourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-xs uppercase tracking-[0.1em] text-[#080909] underline"
              >
                Suggest an official source or map ↗
              </a>
            </div>
          </section>
        </div>

        {/* Contact line & Join the pilot issue form */}
        <section
          aria-label="Contact and Join the pilot form"
          data-testid="join-contact-cta"
          className="border border-[#080909] bg-[#f5f3ed] p-6"
        >
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <div className="dg-mono text-[#5b5e56]">Get in touch</div>
              <p className="dg-serif mt-1 text-base text-[#080909]">
                Write to us at{" "}
                <a
                  href={`mailto:${siteCfg.contactEmail}`}
                  className="font-mono font-semibold underline"
                >
                  {siteCfg.contactEmail}
                </a>{" "}
                or submit the GitHub form to join the pilot.
              </p>
            </div>
            <a
              href={joinFormUrl}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="join-the-pilot-form-link"
              className="inline-flex min-h-[44px] shrink-0 items-center border border-[#080909] bg-[#080909] px-5 py-2.5 font-mono text-xs uppercase tracking-[0.12em] text-[#f5f3ed] no-underline hover:bg-[#171917]"
            >
              Join the pilot (GitHub form) ↗
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}
