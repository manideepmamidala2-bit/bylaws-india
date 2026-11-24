import React from "react";
import { notFound } from "next/navigation";
import { fetchJurisdictionDataset, fetchManifest } from "@/lib/data";
import { TopNav } from "@/components/TopNav";
import { ReviewPanel } from "@/components/ReviewPanel";

interface ReviewPageProps {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  const manifest = await fetchManifest();
  return manifest.jurisdictions.map((j) => ({ id: j.id }));
}

export default async function ReviewPage({ params }: ReviewPageProps) {
  const { id } = await params;
  const dataset = await fetchJurisdictionDataset(id);
  if (!dataset) {
    notFound();
  }

  const { jurisdiction, release, zones, geoLayers } = dataset;

  return (
    <div className="min-h-screen bg-[#f5f3ed] text-[#080909]">
      <TopNav
        jurisdictionId={jurisdiction.id}
        jurisdictionName={jurisdiction.name}
        active="review"
        releaseVersion={release.version}
        licence={release.licence}
      />

      <main className="mx-auto max-w-6xl px-6 py-8">
        <header className="mb-6 border-b border-[#080909] pb-6">
          <div className="dg-mono">
            Zoning Map &amp; Layer Verification · {jurisdiction.id}
          </div>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-[#080909]">
            {jurisdiction.name} — Zoning Map Review
          </h1>
          <p className="dg-serif mt-2 max-w-3xl text-base text-[#171917]">
            Source sheet beside extracted land-use zones with an overlay opacity
            slider for verification and reproducible YAML override generation.
          </p>
        </header>

        <ReviewPanel
          zones={zones.features}
          geoLayers={geoLayers?.layers ?? []}
        />
      </main>
    </div>
  );
}
