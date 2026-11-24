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

  const { jurisdiction, release, zones, boundary, gbaZones, wards, planningDistricts, geoLayers } = dataset;

  if (!release) {
    return (
      <div className="min-h-screen bg-[#f5f3ed] text-[#080909]">
        <TopNav
          jurisdictionId={jurisdiction.id}
          jurisdictionName={jurisdiction.name}
          active="review"
        />
        <main className="mx-auto max-w-6xl px-6 py-10">
          <header className="border-b border-[#080909] pb-6">
            <div className="dg-mono">
              Zoning Map Review · {jurisdiction.id}
            </div>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-[#080909]">
              {jurisdiction.name}: Zoning Map Review
            </h1>
          </header>
          <section
            aria-label="Publication status"
            className="mt-8 border border-[#080909] bg-[#efeee8] p-6"
          >
            <h2 className="text-lg font-semibold text-[#080909]">
              No data published yet
            </h2>
            <p className="dg-serif mt-2 max-w-2xl text-sm text-[#171917]">
              Georeferenced land-use sheets and extracted zones for{" "}
              {jurisdiction.name} are not published yet.
            </p>
          </section>
        </main>
      </div>
    );
  }

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
            {jurisdiction.name}: Zoning Map Review
          </h1>
          <p className="dg-serif mt-2 max-w-3xl text-base text-[#171917]">
            Source sheet beside extracted land-use zones with an overlay opacity
            slider for verification and reproducible YAML override generation.
          </p>
        </header>

        <ReviewPanel
          jurisdictionId={jurisdiction.id}
          zones={zones.features}
          boundary={boundary}
          gbaZones={gbaZones}
          wards={wards}
          planningDistricts={planningDistricts}
          geoLayers={geoLayers?.layers ?? []}
        />
      </main>
    </div>
  );
}
