import React from "react";
import type { Metadata } from "next";
import { TopNav } from "@/components/TopNav";
import { GuideSlidesClient } from "@/components/GuideSlidesClient";
import { loadGuideBundle } from "@/lib/guide";

export async function generateMetadata(): Promise<Metadata> {
  const bundle = await loadGuideBundle();
  const m = bundle.metrics;
  const title = `The Bylaw One Guide (Slides) · ${m.cityLabel}`;
  const desc = `Slide presentation mode with speaker notes for talks at colleges and the ${m.cityLabel} launch event.`;
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

export default async function GuideSlidesPage() {
  const bundle = await loadGuideBundle();
  const { metrics: m } = bundle;

  const slimSlides = bundle.slides.map((s) => ({
    ...s,
    diagram: s.diagram
      ? {
          ...s.diagram,
          svgMarkup: null,
        }
      : undefined,
  }));

  const sectionIndexMeta = bundle.sections.map((sec) => ({
    id: sec.id,
    number: sec.number,
    title: sec.title,
    firstSlideIndex: sec.firstSlideIndex,
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
        className="mx-auto max-w-5xl space-y-6 px-5 py-8"
      >
        <header className="sr-only">
          <h1>The Bylaw One Guide — Slide Presentation Mode</h1>
        </header>

        <GuideSlidesClient
          slides={slimSlides}
          sections={sectionIndexMeta}
          releaseVersion={m.releaseVersion}
          currentAsOfDate={m.currentAsOfDate}
        />
      </main>
    </div>
  );
}
