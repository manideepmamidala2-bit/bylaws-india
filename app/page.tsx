"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  fetchJurisdictionDataset,
  fetchManifest,
  getVisibleJurisdictions,
  partitionClauseVersions,
  type JurisdictionDatasetBundle,
  type ReleaseManifest,
} from "@/lib/data";
import { TopNav } from "@/components/TopNav";

export default function JurisdictionPickerPage() {
  const [manifest, setManifest] = useState<ReleaseManifest | null>(null);
  const [featuredBundle, setFeaturedBundle] =
    useState<JurisdictionDatasetBundle | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchManifest()
      .then(async (loaded) => {
        if (cancelled) return;
        setManifest(loaded);
        const visible = getVisibleJurisdictions(loaded);
        const primary = visible[0];
        const isMocked = Boolean(
          globalThis.fetch &&
            ("mock" in (globalThis.fetch as unknown as Record<string, unknown>))
        );
        if (primary && !isMocked) {
          try {
            const bundle = await fetchJurisdictionDataset(primary.id);
            if (!cancelled && bundle) {
              setFeaturedBundle(bundle);
            }
          } catch {
            // Ignore optional bundle summary failure when running against minimal mock manifests
          }
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load manifest"
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const visibleJurisdictions = manifest
    ? getVisibleJurisdictions(manifest)
    : [];
  const primaryJurisdiction = visibleJurisdictions[0];

  const featuredCounts = featuredBundle
    ? (() => {
        const { activeClauses } = partitionClauseVersions(
          featuredBundle.clauses
        );
        const totalTables = activeClauses.reduce(
          (acc, c) => acc + (c.tables?.length ?? 0),
          0
        );
        const activeZones = featuredBundle.zones.features.filter(
          (z) =>
            !z.properties.superseded_by && !z.properties.record_superseded_by
        );
        return {
          sources: featuredBundle.documents.length,
          clauses: activeClauses.length,
          tables: totalTables,
          zones: activeZones.length,
          amendments: featuredBundle.amendments.links.length,
          consolidated: featuredBundle.consolidated?.records.length ?? 0,
        };
      })()
    : null;

  return (
    <div className="min-h-screen bg-[#f5f3ed] text-[#080909]">
      <TopNav
        jurisdictionId={primaryJurisdiction?.id}
        jurisdictionName={primaryJurisdiction?.name}
        active="home"
        releaseVersion={primaryJurisdiction?.latest_release}
      />

      <main className="mx-auto max-w-6xl px-6 py-10">
        <header className="border-b border-[#080909] pb-8">
          <div className="dg-mono">
            Open Regulatory Dataset · Schema v1.2 · CC BY 4.0 Data · Apache-2.0
            Code
          </div>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-[#080909]">
            Structured Building Bylaws
          </h1>
          <p className="dg-serif mt-3 max-w-3xl text-base leading-relaxed text-[#171917]">
            Every regulatory source governing building construction — statutes,
            master plan zoning regulations, municipal building bye-laws,
            amendment notifications, executive orders, and land-use maps —
            verified at its official origin, converted into structured data with
            page and bounding-box provenance, linked to the map, and published
            under an open licence.
          </p>
        </header>

        {error && (
          <div
            role="alert"
            className="mt-6 border border-[#080909] bg-[#efeee8] p-4 font-mono text-xs text-[#080909]"
          >
            {error}
          </div>
        )}

        {!manifest && !error && (
          <p className="mt-6 font-mono text-xs uppercase tracking-[0.12em] text-[#5b5e56]">
            Loading published jurisdictions from manifest...
          </p>
        )}

        {featuredBundle && featuredCounts && (
          <section
            aria-label="Featured jurisdiction overview"
            className="mt-8 border border-[#080909] bg-[#efeee8] p-6"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-[#c8ccc0] pb-4">
              <div>
                <div className="dg-mono">
                  Featured Public Dataset · {featuredBundle.jurisdiction.id} ·
                  Release v{featuredBundle.release.version}
                </div>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight text-[#080909]">
                  {featuredBundle.jurisdiction.name}
                </h2>
              </div>
              <span className="border border-[#080909] bg-[#f5f3ed] px-2.5 py-1 font-mono text-xs uppercase tracking-[0.12em] text-[#080909]">
                {featuredBundle.release.licence}
              </span>
            </div>

            <dl className="mt-5 grid grid-cols-2 gap-4 border-b border-[#c8ccc0] pb-5 sm:grid-cols-6">
              <div>
                <dt className="dg-mono text-[10px]">Sources</dt>
                <dd className="mt-1 font-mono text-2xl font-semibold text-[#080909]">
                  {featuredCounts.sources}
                </dd>
              </div>
              <div>
                <dt className="dg-mono text-[10px]">Clauses</dt>
                <dd className="mt-1 font-mono text-2xl font-semibold text-[#080909]">
                  {featuredCounts.clauses}
                </dd>
              </div>
              <div>
                <dt className="dg-mono text-[10px]">Structured Tables</dt>
                <dd className="mt-1 font-mono text-2xl font-semibold text-[#080909]">
                  {featuredCounts.tables}
                </dd>
              </div>
              <div>
                <dt className="dg-mono text-[10px]">Map Zones</dt>
                <dd className="mt-1 font-mono text-2xl font-semibold text-[#080909]">
                  {featuredCounts.zones}
                </dd>
              </div>
              <div>
                <dt className="dg-mono text-[10px]">Amendment Links</dt>
                <dd className="mt-1 font-mono text-2xl font-semibold text-[#080909]">
                  {featuredCounts.amendments}
                </dd>
              </div>
              <div>
                <dt className="dg-mono text-[10px]">Consolidated (R14)</dt>
                <dd className="mt-1 font-mono text-2xl font-semibold text-[#080909]">
                  {featuredCounts.consolidated}
                </dd>
              </div>
            </dl>

            <div className="mt-5 flex flex-wrap gap-3 font-mono text-xs uppercase tracking-[0.12em]">
              <Link
                href={`/j/${featuredBundle.jurisdiction.id}`}
                className="border border-[#080909] bg-[#080909] px-4 py-2 text-[#f5f3ed] no-underline"
              >
                1. Map &amp; Zone Explorer →
              </Link>
              <Link
                href={`/j/${featuredBundle.jurisdiction.id}/sources`}
                className="border border-[#080909] bg-[#f5f3ed] px-4 py-2 text-[#080909] no-underline hover:bg-[#e5e6de]"
              >
                2. Source Register
              </Link>
              <Link
                href={`/j/${featuredBundle.jurisdiction.id}/clauses`}
                className="border border-[#080909] bg-[#f5f3ed] px-4 py-2 text-[#080909] no-underline hover:bg-[#e5e6de]"
              >
                3. Structured Documents
              </Link>
              <Link
                href={`/j/${featuredBundle.jurisdiction.id}/timeline`}
                className="border border-[#080909] bg-[#f5f3ed] px-4 py-2 text-[#080909] no-underline hover:bg-[#e5e6de]"
              >
                4. Regulatory Timeline
              </Link>
              <Link
                href="/data"
                className="border border-[#080909] bg-[#f5f3ed] px-4 py-2 text-[#080909] no-underline hover:bg-[#e5e6de]"
              >
                5. Download Data &amp; Checksums
              </Link>
            </div>
          </section>
        )}

        {manifest && (
          <section aria-label="Available jurisdictions" className="mt-8">
            <div className="dg-mono mb-3">
              Published Jurisdictions ({visibleJurisdictions.length})
            </div>

            {visibleJurisdictions.length === 0 ? (
              <p className="text-sm text-[#5b5e56]">
                No jurisdictions published in manifest.
              </p>
            ) : (
              <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {visibleJurisdictions.map((item) => (
                  <li
                    key={item.id}
                    className="border border-[#080909] bg-[#f5f3ed] p-5"
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <h2 className="text-lg font-semibold text-[#080909]">
                        {item.name}
                      </h2>
                      <span className="border border-[#080909] bg-[#efeee8] px-2 py-0.5 font-mono text-xs text-[#080909]">
                        v{item.latest_release}
                      </span>
                    </div>
                    <p className="mt-1 font-mono text-xs text-[#5b5e56]">
                      ID: {item.id}
                      {item.visibility === "test"
                        ? " · TEST FIXTURE (HIDDEN IN PROD)"
                        : ""}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2 font-mono text-[11px] uppercase tracking-[0.12em]">
                      <Link
                        href={`/j/${item.id}`}
                        className="border border-[#080909] bg-[#080909] px-3 py-1.5 text-[#f5f3ed] no-underline"
                      >
                        Map
                      </Link>
                      <Link
                        href={`/j/${item.id}/sources`}
                        className="border border-[#080909] bg-[#f5f3ed] px-3 py-1.5 text-[#080909] no-underline hover:bg-[#efeee8]"
                      >
                        Sources
                      </Link>
                      <Link
                        href={`/j/${item.id}/clauses`}
                        className="border border-[#080909] bg-[#f5f3ed] px-3 py-1.5 text-[#080909] no-underline hover:bg-[#efeee8]"
                      >
                        Documents
                      </Link>
                      <Link
                        href={`/j/${item.id}/timeline`}
                        className="border border-[#080909] bg-[#f5f3ed] px-3 py-1.5 text-[#080909] no-underline hover:bg-[#efeee8]"
                      >
                        Timeline
                      </Link>
                      <Link
                        href={`/j/${item.id}/review`}
                        className="border border-[#080909] bg-[#f5f3ed] px-3 py-1.5 text-[#080909] no-underline hover:bg-[#efeee8]"
                      >
                        Review
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
