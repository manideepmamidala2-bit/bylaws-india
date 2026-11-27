import React from "react";
import Link from "next/link";
import { TopNav } from "@/components/TopNav";
import { computeDatasetPilotMetrics } from "@/lib/pilot-metrics";

export default async function ChecksPage() {
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
              Trust &amp; Verification
            </div>
            <span
              data-testid="current-as-of-date"
              className="font-mono text-xs uppercase tracking-[0.12em] text-[#5b5e56]"
            >
              Current as of {m.currentAsOfDate}
            </span>
          </div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#080909] md:text-4xl">
            How we check
          </h1>
          <p className="dg-serif mt-3 max-w-3xl text-base leading-relaxed text-[#171917]">
            Every build of Bylaw One runs {m.checksPerBuildCount} automatic
            verification suites against the stored PDF pages, schemas, and map
            control points, alongside human workshop verifications where two
            independent verifiers must record a <strong>Match</strong> before a
            record is marked verified by a person.
          </p>
        </header>

        {/* 01 / Verification totals by level (including zero where zero) */}
        <section
          aria-labelledby="verification-totals-heading"
          data-testid="checks-verification-totals"
          className="space-y-6 border-b border-[#c8ccc0] pb-12"
        >
          <div className="dg-mono text-[#5b5e56]">
            01 / Verification totals by level
          </div>
          <h2
            id="verification-totals-heading"
            className="text-2xl font-semibold tracking-tight text-[#080909]"
          >
            Verification status across the dataset.
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="border border-[#080909] bg-[#efeee8] p-5">
              <div className="dg-mono text-[10.5px] text-[#5b5e56]">
                Level 1 · Machine-checked
              </div>
              <div
                data-testid="checks-total-machine-checked"
                className="mt-1 font-mono text-3xl font-semibold text-[#080909]"
              >
                {m.machineCheckedCount.toLocaleString("en-IN")}
              </div>
              <p className="dg-serif mt-2 text-xs leading-relaxed text-[#171917]">
                Provisions ({m.provisionsCount.toLocaleString("en-IN")}),
                parameter cells ({m.totalParametersCount.toLocaleString("en-IN")}
                ), and land-use zone polygons (
                {m.activeZonesCount.toLocaleString("en-IN")}) verified by
                automated machine checks.
              </p>
            </div>

            <div className="border border-[#080909] bg-[#efeee8] p-5">
              <div className="dg-mono text-[10.5px] text-[#5b5e56]">
                Level 2 · Verified by a person
              </div>
              <div
                data-testid="checks-total-human-verified"
                className="mt-1 font-mono text-3xl font-semibold text-[#080909]"
              >
                {m.humanVerifiedCount}
              </div>
              <p className="dg-serif mt-2 text-xs leading-relaxed text-[#171917]">
                Requires at least two independent <strong>Match</strong>{" "}
                verdicts and zero <strong>Mismatch</strong> verdicts from named
                workshop verifiers. Shown honestly as{" "}
                <code>{m.humanVerifiedCount}</code> until workshop CSVs are
                imported.
              </p>
            </div>

            <div className="border border-[#080909] bg-[#efeee8] p-5">
              <div className="dg-mono text-[10.5px] text-[#5b5e56]">
                Open review items (Mismatches)
              </div>
              <div
                data-testid="checks-total-open-review"
                className="mt-1 font-mono text-3xl font-semibold text-[#080909]"
              >
                {m.openReviewItemsCount}
              </div>
              <p className="dg-serif mt-2 text-xs leading-relaxed text-[#171917]">
                Any <strong>Mismatch</strong> reported in a workshop opens a
                review item and blocks person-verified status until resolved.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={`/verify/${m.sampleTaskSetId}`}
              className="inline-flex min-h-[44px] items-center border border-[#080909] bg-[#080909] px-5 py-2 font-mono text-xs uppercase tracking-[0.12em] text-[#f5f3ed] no-underline hover:bg-[#171917]"
            >
              Try a sample verification task set →
            </Link>
            <Link
              href="/join"
              className="inline-flex min-h-[44px] items-center border border-[#080909] bg-[#f5f3ed] px-5 py-2 font-mono text-xs uppercase tracking-[0.12em] text-[#080909] no-underline hover:bg-[#efeee8]"
            >
              Host a college workshop →
            </Link>
          </div>
        </section>

        {/* 02 / Every automatic check that runs on each build */}
        <section
          aria-labelledby="automated-checks-heading"
          data-testid="checks-automated-list"
          className="space-y-6"
        >
          <div className="dg-mono text-[#5b5e56]">
            02 / Automatic build checks ({m.checksPerBuildCount} suites)
          </div>
          <h2
            id="automated-checks-heading"
            className="text-2xl font-semibold tracking-tight text-[#080909]"
          >
            Every automatic check that runs on each build.
          </h2>

          <div className="overflow-x-auto">
            <table className="dg-table">
              <thead>
                <tr>
                  <th>Check</th>
                  <th>What it guarantees</th>
                  <th>Latest measured result</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {m.automatedChecks.map((chk) => (
                  <tr key={chk.id} data-testid={`check-row-${chk.id}`}>
                    <td className="font-semibold text-[#080909]">
                      {chk.title}
                    </td>
                    <td className="dg-serif text-sm text-[#171917]">
                      {chk.guarantees}
                    </td>
                    <td className="font-mono text-xs text-[#080909]">
                      {chk.latestResult}
                    </td>
                    <td className="font-mono text-xs font-semibold text-[#080909]">
                      {chk.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
