import React from "react";
import Link from "next/link";
import {
  fetchManifest,
  getPrimaryPublicJurisdiction,
  getVisibleJurisdictions,
} from "@/lib/data";
import { TopNav } from "@/components/TopNav";

export default async function NotFoundPage() {
  const manifest = await fetchManifest().catch(() => null);
  const visible = manifest ? getVisibleJurisdictions(manifest) : [];
  const primary = manifest ? getPrimaryPublicJurisdiction(manifest) : undefined;
  const rootJur =
    visible.find((j) => visible.some((child) => child.parent === j.id)) ??
    primary;
  const targetJurId = rootJur?.id ?? primary?.id ?? "";
  const mapJurId = targetJurId;

  return (
    <div className="min-h-screen bg-[#f5f3ed] text-[#080909]">
      <TopNav
        jurisdictionId={targetJurId}
        jurisdictionName={rootJur?.name}
        active="home"
      />

      <main
        data-dataset-id={manifest?.dataset_id ?? ""}
        data-testid="not-found-page"
        className="mx-auto max-w-4xl space-y-8 px-5 py-16"
      >
        <div className="dg-mono text-[#5b5e56]">404 · Page not found</div>
        <h1 className="text-3xl font-semibold tracking-tight text-[#080909] md:text-4xl">
          We could not find that page in Bylaw One.
        </h1>
        <p className="dg-serif max-w-2xl text-base leading-relaxed text-[#171917]">
          The provision, subject, or map address you followed may have moved or
          been consolidated. Use the links below or the search bar in the header
          to find the rule you need.
        </p>

        <div className="flex flex-wrap gap-3 pt-2">
          <Link
            href="/"
            className="inline-flex min-h-[44px] items-center border border-[#080909] bg-[#080909] px-5 py-2.5 font-mono text-xs uppercase tracking-[0.12em] text-[#f5f3ed] no-underline hover:bg-[#171917]"
          >
            Home
          </Link>
          {targetJurId && (
            <Link
              href={`/j/${targetJurId}/topics`}
              className="inline-flex min-h-[44px] items-center border border-[#080909] bg-[#f5f3ed] px-5 py-2.5 font-mono text-xs uppercase tracking-[0.12em] text-[#080909] no-underline hover:bg-[#efeee8]"
            >
              Read the code
            </Link>
          )}
          {mapJurId && (
            <Link
              href={`/j/${mapJurId}`}
              className="inline-flex min-h-[44px] items-center border border-[#080909] bg-[#f5f3ed] px-5 py-2.5 font-mono text-xs uppercase tracking-[0.12em] text-[#080909] no-underline hover:bg-[#efeee8]"
            >
              Find rules by place
            </Link>
          )}
          <Link
            href="/pilot"
            className="inline-flex min-h-[44px] items-center border border-[#080909] bg-[#f5f3ed] px-5 py-2.5 font-mono text-xs uppercase tracking-[0.12em] text-[#080909] no-underline hover:bg-[#efeee8]"
          >
            About the pilot
          </Link>
        </div>
      </main>
    </div>
  );
}
