import React from "react";
import { notFound } from "next/navigation";
import {
  fetchJurisdictionDataset,
  fetchManifest,
  type ZoneGeometry,
} from "@/lib/data";
import { TopNav } from "@/components/TopNav";
import { ReviewPanel } from "@/components/ReviewPanel";

interface ReviewPageProps {
  params: Promise<{ id: string }>;
}

export const dynamicParams = false;

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
          <header className="border-b border-[#c8ccc0] pb-6">
            <div className="dg-mono">Zoning Map Review</div>
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

  const emptyPoly = {
    type: "Polygon",
    coordinates: [],
  } as unknown as ZoneGeometry;
  const stripFc = (fc: typeof boundary | null, maxFeatures = 75) =>
    fc
      ? {
          ...fc,
          features: fc.features.slice(0, maxFeatures).map((f) => ({
            ...f,
            geometry: emptyPoly,
          })),
        }
      : null;
  const seenZoneCode = new Set<string>();
  const ssrZones = zones.features
    .filter((z) => {
      const k = z.properties.zone_code;
      if (seenZoneCode.has(k) && seenZoneCode.size >= 12) return false;
      seenZoneCode.add(k);
      return true;
    })
    .slice(0, 12)
    .map((z) => ({ ...z, geometry: emptyPoly }));

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
          <div className="dg-mono">Zoning Map &amp; Layer Verification</div>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-[#080909]">
            {jurisdiction.name}: Zoning Map Review
          </h1>
          <p className="dg-serif mt-2 max-w-3xl text-base text-[#171917]">
            Source sheet beside extracted land-use zones with an overlay opacity
            slider for verification.
          </p>
        </header>

        <ReviewPanel
          jurisdictionId={jurisdiction.id}
          releaseVersion={release.version}
          zones={ssrZones}
          boundary={stripFc(boundary)}
          gbaZones={stripFc(gbaZones)}
          wards={stripFc(wards)}
          planningDistricts={stripFc(planningDistricts)}
          geoLayers={geoLayers?.layers ?? []}
        />
      </main>
    </div>
  );
}
