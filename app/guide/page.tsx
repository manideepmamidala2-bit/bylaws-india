import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { TopNav } from "@/components/TopNav";
import { GuideReaderClient } from "@/components/GuideReaderClient";
import { loadGuideBundle } from "@/lib/guide";

export async function generateMetadata(): Promise<Metadata> {
  const bundle = await loadGuideBundle();
  const m = bundle.metrics;
  const title = `The Bylaw One Guide · ${m.cityLabel}`;
  const desc = `Why Bylaw One exists, what works today (${m.inForceDocumentsCount} documents, ${m.provisionsCount.toLocaleString("en-IN")} provisions, ${m.activeParametersCount} rules as data, ${m.wardsCount} wards), how it is built, the movement, the launch, and how to take part.`;
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

export default async function GuidePage() {
  const bundle = await loadGuideBundle();
  const { metrics: m } = bundle;

  const slimSections = bundle.sections.map((sec) => ({
    ...sec,
    diagrams: sec.diagrams.map((d) => ({
      ...d,
      svgMarkup: null,
    })),
  }));

  return (
    <div className="min-h-screen bg-[#f5f3ed] text-[#080909]">
      <TopNav
        jurisdictionId={m.parentJurisdictionId}
        jurisdictionName={m.regionLabel}
        active="guide"
      />

      <main
        data-dataset-id={m.datasetId}
        className="mx-auto max-w-5xl space-y-10 px-5 py-10"
      >
        <header className="border-b border-[#c8ccc0] pb-8">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div className="dg-mono text-[#5b5e56]">
              Bylaw One · The Guide · Release v{m.releaseVersion}
            </div>
            <span
              data-testid="current-as-of-date"
              className="font-mono text-xs uppercase tracking-[0.12em] text-[#5b5e56]"
            >
              Current as of {m.currentAsOfDate}
            </span>
          </div>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#080909] md:text-4xl">
            The Bylaw One Guide
          </h1>
          <p className="dg-serif mt-3 max-w-3xl text-base leading-relaxed text-[#171917]">
            Why Bylaw One exists, what works today in {m.cityLabel}, how the
            code is built and checked, the collective movement across colleges
            and practitioners, the launch plan, and how to take part.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              href="/guide/slides"
              data-testid="guide-present-btn"
              className="inline-flex min-h-[44px] items-center border border-[#080909] bg-[#080909] px-5 py-2.5 font-mono text-xs uppercase tracking-[0.12em] text-[#f5f3ed] no-underline hover:bg-[#171917]"
            >
              Present (slide mode) →
            </Link>
            <a
              href="/bylaw-one-guide.html"
              download="bylaw-one-guide.html"
              data-testid="guide-download-btn"
              className="inline-flex min-h-[44px] items-center border border-[#080909] bg-[#f5f3ed] px-5 py-2.5 font-mono text-xs uppercase tracking-[0.12em] text-[#080909] no-underline hover:bg-[#efeee8]"
            >
              Download guide (single file) ↓
            </a>
          </div>
        </header>

        <GuideReaderClient
          audiences={bundle.audiences}
          sections={slimSections}
        />
      </main>
    </div>
  );
}
