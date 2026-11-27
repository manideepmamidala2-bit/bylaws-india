import React from "react";
import { TopNav } from "@/components/TopNav";
import { computeDatasetPilotMetrics } from "@/lib/pilot-metrics";
import { getSiteConfig } from "@/lib/site-config";

export default async function PressPage() {
  const m = await computeDatasetPilotMetrics();
  const siteCfg = getSiteConfig();

  const screenshots = [
    {
      id: "home",
      title: `Home page & 5-step FAR story (${m.cityLabel})`,
      src: "/press/press-home.png",
      caption: `How five instruments across twenty-two years combine to set Floor Area Ratio (FAR) today.`,
    },
    {
      id: "map-place-card",
      title: "Interactive map & Place Card with zone rules",
      src: "/press/press-map-place-card.png",
      caption: `Official corporation and ward boundaries, georeferenced master plan land-use zones, and governing rules by zone.`,
    },
    {
      id: "subject-far",
      title: "Subject page — What applies today & exact page links",
      src: "/press/press-subject-far.png",
      caption: `Deduplicated parameter tables, consolidated provisions, and statutory precedence rules with official PDF page links.`,
    },
  ];

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
          <div className="dg-mono text-[#5b5e56]">Press &amp; Media Kit</div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#080909] md:text-4xl">
            Press kit
          </h1>
          <p
            data-testid="press-description-paragraph"
            className="dg-serif mt-4 max-w-3xl text-base leading-relaxed text-[#171917]"
          >
            <strong>Bylaw One</strong> ({siteCfg.siteUrl}) is an open-source
            public reference that joins {m.cityLabel}&apos;s{" "}
            {m.inForceDocumentsCount} in-force building acts, municipal
            bye-laws, master plan zoning regulations, and gazette amendments from{" "}
            {m.issuingBodiesCount} statutory bodies into one readable,
            machine-verifiable building code — covering{" "}
            {m.provisionsCount.toLocaleString("en-IN")} structured provisions,{" "}
            {m.activeParametersCount} governing development-control rules across{" "}
            {m.corporationsCount} City Corporations and {m.wardsCount} wards,
            and {m.activeZonesCount.toLocaleString("en-IN")} georeferenced
            land-use zone polygons, with every rule traced to its exact official
            PDF page and published permanently under Apache-2.0 and CC BY 4.0.
          </p>
        </header>

        {/* 01 / Three screenshots (generated at build) */}
        <section
          aria-labelledby="press-screenshots-heading"
          data-testid="press-screenshots-section"
          className="space-y-6 border-b border-[#c8ccc0] pb-12"
        >
          <div className="dg-mono text-[#5b5e56]">
            01 / Screenshots (3 build-generated views)
          </div>
          <h2
            id="press-screenshots-heading"
            className="text-2xl font-semibold tracking-tight text-[#080909]"
          >
            Product screenshots.
          </h2>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {screenshots.map((shot) => (
              <figure
                key={shot.id}
                data-testid={`press-screenshot-${shot.id}`}
                className="border border-[#080909] bg-[#efeee8] p-4"
              >
                <a href={shot.src} target="_blank" rel="noopener noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={shot.src}
                    alt={shot.title}
                    className="h-44 w-full border border-[#c8ccc0] bg-[#f5f3ed] object-cover object-top"
                  />
                </a>
                <figcaption className="mt-3 space-y-1">
                  <div className="font-mono text-xs font-semibold text-[#080909]">
                    {shot.title}
                  </div>
                  <p className="dg-serif text-xs text-[#171917]">
                    {shot.caption}
                  </p>
                  <a
                    href={shot.src}
                    download
                    className="inline-block pt-1 font-mono text-[11px] uppercase tracking-[0.1em] text-[#080909] underline"
                  >
                    Download PNG ↗
                  </a>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        {/* 02 / Logo files */}
        <section
          aria-labelledby="press-logos-heading"
          data-testid="press-logos-section"
          className="space-y-4 border-b border-[#c8ccc0] pb-12"
        >
          <div className="dg-mono text-[#5b5e56]">02 / Wordmark &amp; Mark</div>
          <h2
            id="press-logos-heading"
            className="text-2xl font-semibold tracking-tight text-[#080909]"
          >
            Logo files (SVG).
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex items-center justify-between border border-[#080909] bg-[#efeee8] p-5">
              <div>
                <div className="font-mono text-sm font-semibold text-[#080909]">
                  Bylaw One Wordmark
                </div>
                <div className="font-mono text-xs text-[#5b5e56]">
                  /press/bylaw-one-logo.svg
                </div>
              </div>
              <a
                href="/press/bylaw-one-logo.svg"
                download
                className="border border-[#080909] bg-[#080909] px-3.5 py-2 font-mono text-xs uppercase tracking-[0.1em] text-[#f5f3ed] no-underline"
              >
                Download SVG
              </a>
            </div>

            <div className="flex items-center justify-between border border-[#080909] bg-[#efeee8] p-5">
              <div>
                <div className="font-mono text-sm font-semibold text-[#080909]">
                  Bylaw One Square Mark
                </div>
                <div className="font-mono text-xs text-[#5b5e56]">
                  /press/bylaw-one-mark.svg
                </div>
              </div>
              <a
                href="/press/bylaw-one-mark.svg"
                download
                className="border border-[#080909] bg-[#080909] px-3.5 py-2 font-mono text-xs uppercase tracking-[0.1em] text-[#f5f3ed] no-underline"
              >
                Download SVG
              </a>
            </div>
          </div>
        </section>

        {/* 03 / Press contact */}
        <section
          aria-labelledby="press-contact-heading"
          data-testid="press-contact-section"
          className="space-y-2"
        >
          <div className="dg-mono text-[#5b5e56]">03 / Contact</div>
          <h2
            id="press-contact-heading"
            className="text-2xl font-semibold tracking-tight text-[#080909]"
          >
            Press &amp; partnership contact.
          </h2>
          <p className="dg-serif text-base text-[#171917]">
            Steward organisation: <strong>{siteCfg.organisationName}</strong> ·
            Email:{" "}
            <a
              href={`mailto:${siteCfg.contactEmail}`}
              className="font-mono font-semibold text-[#080909] underline"
            >
              {siteCfg.contactEmail}
            </a>{" "}
            · Repository:{" "}
            <a
              href={siteCfg.githubRepoUrl}
              className="font-mono text-[#080909] underline"
            >
              {siteCfg.githubRepoUrl}
            </a>
          </p>
        </section>
      </main>
    </div>
  );
}
