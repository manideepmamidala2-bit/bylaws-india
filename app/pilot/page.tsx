import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { TopNav } from "@/components/TopNav";
import { computeDatasetPilotMetrics } from "@/lib/pilot-metrics";

export async function generateMetadata(): Promise<Metadata> {
  const m = await computeDatasetPilotMetrics();
  const title = `The ${m.cityLabel} Pilot · Bylaw One`;
  const desc = `What works today (${m.inForceDocumentsCount} documents, ${m.provisionsCount} provisions, ${m.activeParametersCount} rules as data, ${m.wardsCount} wards), what is missing, and how to join.`;
  return {
    title,
    description: desc,
    openGraph: {
      title,
      description: desc,
      images: [
        `/api/og?title=${encodeURIComponent(title)}&subtitle=${encodeURIComponent(desc)}`,
      ],
    },
  };
}

export default async function PilotPage() {
  const m = await computeDatasetPilotMetrics();

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
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div className="dg-mono text-[#5b5e56]">
              Bylaw One · Working Pilot
            </div>
            <span
              data-testid="current-as-of-date"
              className="font-mono text-xs uppercase tracking-[0.12em] text-[#5b5e56]"
            >
              Current as of {m.currentAsOfDate}
            </span>
          </div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#080909] md:text-4xl">
            The {m.cityLabel} Pilot
          </h1>
          <div
            data-testid="pilot-five-sentences"
            className="dg-serif mt-4 max-w-3xl space-y-2 text-base leading-relaxed text-[#171917]"
          >
            <p>
              The rules that decide what may be built on a plot in {m.cityLabel}{" "}
              are scattered across municipal building bye-laws, master plan
              zoning regulations, dated gazette amendments, corporation
              notifications, and state Acts. Architects, homeowners, students,
              and officials have to piece together overlapping PDFs from
              different decades just to find which table or clause governs
              today. Bylaw One joins those official instruments into one
              readable, machine-verifiable code — by subject and by place on the
              map — while keeping every word verbatim and tracing every number
              to its exact official PDF page. Everything is built in the open
              under Apache-2.0 and CC BY 4.0 so people and AI tools can read the
              same cited source of truth without guessing. We are launching this
              working pilot in {m.cityLabel} with colleges, practitioners, and
              civic groups to verify the rules together and expand across India.
            </p>
          </div>
        </header>

        {/* 01 / What works today (generated numbers) */}
        <section
          aria-labelledby="what-works-heading"
          data-testid="pilot-what-works-today"
          className="space-y-6 border-b border-[#c8ccc0] pb-12"
        >
          <div className="dg-mono text-[#5b5e56]">
            01 / What works today (generated from Release v{m.releaseVersion})
          </div>
          <h2
            id="what-works-heading"
            className="text-2xl font-semibold tracking-tight text-[#080909]"
          >
            What works today in {m.cityLabel}.
          </h2>

          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="border border-[#080909] bg-[#efeee8] p-4">
              <dt className="dg-mono text-[10.5px] text-[#5b5e56]">
                In-force documents
              </dt>
              <dd className="mt-1">
                <div
                  data-testid="metric-documents"
                  className="font-mono text-2xl font-semibold text-[#080909]"
                >
                  {m.inForceDocumentsCount}
                </div>
                <div className="mt-1 text-xs text-[#5b5e56]">
                  of {m.totalRegisterDocumentsCount} registered sources from{" "}
                  {m.issuingBodiesCount} bodies
                </div>
              </dd>
            </div>

            <div className="border border-[#080909] bg-[#efeee8] p-4">
              <dt className="dg-mono text-[10.5px] text-[#5b5e56]">
                Provisions
              </dt>
              <dd className="mt-1">
                <div
                  data-testid="metric-provisions"
                  className="font-mono text-2xl font-semibold text-[#080909]"
                >
                  {m.provisionsCount.toLocaleString("en-IN")}
                </div>
                <div className="mt-1 text-xs text-[#5b5e56]">
                  structured in law order with page citations
                </div>
              </dd>
            </div>

            <div className="border border-[#080909] bg-[#efeee8] p-4">
              <dt className="dg-mono text-[10.5px] text-[#5b5e56]">
                Rules as data
              </dt>
              <dd className="mt-1">
                <div
                  data-testid="metric-parameters"
                  className="font-mono text-2xl font-semibold text-[#080909]"
                >
                  {m.activeParametersCount}
                </div>
                <div className="mt-1 text-xs text-[#5b5e56]">
                  active governing parameter rows ({m.totalParametersCount} total
                  extracted)
                </div>
              </dd>
            </div>

            <div className="border border-[#080909] bg-[#efeee8] p-4">
              <dt className="dg-mono text-[10.5px] text-[#5b5e56]">
                Corporations
              </dt>
              <dd className="mt-1">
                <div
                  data-testid="metric-corporations"
                  className="font-mono text-2xl font-semibold text-[#080909]"
                >
                  {m.corporationsCount}
                </div>
                <div className="mt-1 text-xs text-[#5b5e56]">
                  City Corporations with May 2026 amendments
                </div>
              </dd>
            </div>

            <div className="border border-[#080909] bg-[#efeee8] p-4">
              <dt className="dg-mono text-[10.5px] text-[#5b5e56]">Wards</dt>
              <dd className="mt-1">
                <div
                  data-testid="metric-wards"
                  className="font-mono text-2xl font-semibold text-[#080909]"
                >
                  {m.wardsCount}
                </div>
                <div className="mt-1 text-xs text-[#5b5e56]">
                  official delimitation wards on map &amp; directory
                </div>
              </dd>
            </div>

            <div className="border border-[#080909] bg-[#efeee8] p-4">
              <dt className="dg-mono text-[10.5px] text-[#5b5e56]">
                Map coverage
              </dt>
              <dd className="mt-1">
                <div
                  data-testid="metric-map-coverage"
                  className="font-mono text-2xl font-semibold text-[#080909]"
                >
                  {m.mapCoveragePct}%
                </div>
                <div className="mt-1 text-xs text-[#5b5e56]">
                  of {m.regionLabel} ({m.activeZonesCount.toLocaleString("en-IN")}{" "}
                  zone polygons across {m.processedSheetsLabel})
                </div>
              </dd>
            </div>

            <div className="border border-[#080909] bg-[#efeee8] p-4">
              <dt className="dg-mono text-[10.5px] text-[#5b5e56]">
                Verified by people
              </dt>
              <dd className="mt-1">
                <div
                  data-testid="metric-human-verified"
                  className="font-mono text-2xl font-semibold text-[#080909]"
                >
                  {m.humanVerifiedCount}
                </div>
                <div className="mt-1 text-xs text-[#5b5e56]">
                  records with 2+ independent Match verdicts (workshops starting)
                </div>
              </dd>
            </div>

            <div className="border border-[#080909] bg-[#efeee8] p-4">
              <dt className="dg-mono text-[10.5px] text-[#5b5e56]">
                Checks per build
              </dt>
              <dd className="mt-1">
                <div
                  data-testid="metric-checks-per-build"
                  className="font-mono text-2xl font-semibold text-[#080909]"
                >
                  {m.checksPerBuildCount}
                </div>
                <div className="mt-1 text-xs text-[#5b5e56]">
                  automated CI verification suites
                </div>
              </dd>
            </div>
          </dl>
        </section>

        {/* 02 / What is missing */}
        <section
          id="what-is-missing"
          aria-labelledby="what-is-missing-heading"
          data-testid="pilot-what-is-missing"
          className="space-y-4 border-b border-[#c8ccc0] pb-12"
        >
          <div className="dg-mono text-[#5b5e56]">
            02 / What is missing (from declared coverage gaps)
          </div>
          <h2
            id="what-is-missing-heading"
            className="text-2xl font-semibold tracking-tight text-[#080909]"
          >
            What is not covered yet.
          </h2>
          <p className="dg-serif text-base text-[#171917]">
            Every gap in the pilot dataset is declared openly in{" "}
            <Link href="/data" className="underline">
              declarations.json
            </Link>
            :
          </p>
          <ul
            data-testid="pilot-missing-items-list"
            className="dg-serif list-disc space-y-2 pl-5 text-sm leading-relaxed text-[#171917]"
          >
            {m.missingItems.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </section>

        {/* 03 / What comes next */}
        <section
          aria-labelledby="what-comes-next-heading"
          data-testid="pilot-what-comes-next"
          className="space-y-4 border-b border-[#c8ccc0] pb-12"
        >
          <div className="dg-mono text-[#5b5e56]">03 / Roadmap</div>
          <h2
            id="what-comes-next-heading"
            className="text-2xl font-semibold tracking-tight text-[#080909]"
          >
            What comes next.
          </h2>
          <ol className="dg-serif list-decimal space-y-3 pl-5 text-base leading-relaxed text-[#171917]">
            <li>
              <strong>{m.cityLabel} complete:</strong> Georeferencing and
              extracting all remaining master plan land-use sheets across all{" "}
              {m.corporationsCount} City Corporations, acquiring the remaining
              unobtained notifications, and completing student/practitioner
              verification workshops.
            </li>
            <li>
              <strong>{m.stateLabel}:</strong> Extending the same schema and
              pipeline across urban development authorities and municipal
              corporations in {m.stateLabel}.
            </li>
            <li>
              <strong>Other states:</strong> Partnering with architecture,
              planning, and law colleges as state stewards to bring other Indian
              cities and states into Bylaw One.
            </li>
            <li>
              <strong>Local agent engine:</strong> Shipping the local MCP
              server, CLI, and Agent Skill so practitioners can run cited rule
              checks inside their own design and research tools (see{" "}
              <Link href="/use-with-ai" className="underline">
                Use with AI
              </Link>
              ).
            </li>
          </ol>
        </section>

        {/* 04 / How to join */}
        <section
          aria-labelledby="how-to-join-heading"
          className="space-y-4"
        >
          <div className="dg-mono text-[#5b5e56]">04 / Take part</div>
          <h2
            id="how-to-join-heading"
            className="text-2xl font-semibold tracking-tight text-[#080909]"
          >
            How to join the pilot.
          </h2>
          <p className="dg-serif max-w-2xl text-base leading-relaxed text-[#171917]">
            We are inviting colleges of architecture, planning, engineering, and
            law, students, practising professionals, and civic data groups to
            co-host one-day verification workshops, run 60 to 120-hour
            internships, and review rules in their field.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/join"
              className="inline-flex min-h-[44px] items-center border border-[#080909] bg-[#080909] px-5 py-2.5 font-mono text-xs uppercase tracking-[0.12em] text-[#f5f3ed] no-underline hover:bg-[#171917]"
            >
              Join the pilot →
            </Link>
            <Link
              href="/checks"
              className="inline-flex min-h-[44px] items-center border border-[#080909] bg-[#f5f3ed] px-5 py-2.5 font-mono text-xs uppercase tracking-[0.12em] text-[#080909] no-underline hover:bg-[#efeee8]"
            >
              How we check →
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
