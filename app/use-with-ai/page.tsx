import React from "react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Use with AI · Bylaw One",
  description:
    "How to use Bylaw One with AI today via llms.txt, Markdown pages, and the OpenAPI 3.1 JSON API.",
  openGraph: {
    title: "Use with AI · Bylaw One",
    description:
      "How to use Bylaw One with AI today via llms.txt, Markdown pages, and the OpenAPI 3.1 JSON API.",
    images: ["/api/og?title=Use%20Bylaw%20One%20with%20AI"],
  },
};
import {
  fetchJurisdictionDataset,
  fetchManifest,
  getPrimaryPublicJurisdiction,
  getVisibleJurisdictions,
} from "@/lib/data";
import { TopNav } from "@/components/TopNav";
import { computeNewestInForceInstrumentDate } from "@/lib/plain-language";

export default async function UseWithAiPage() {
  const manifest = await fetchManifest();
  const visible = getVisibleJurisdictions(manifest);
  const primary = getPrimaryPublicJurisdiction(manifest);
  const rootJur =
    visible.find((j) => visible.some((child) => child.parent === j.id)) ??
    primary;
  const targetJurId = rootJur?.id ?? primary?.id ?? "";
  const dataset = targetJurId
    ? await fetchJurisdictionDataset(targetJurId).catch(() => null)
    : null;
  const currentAsOfDate = computeNewestInForceInstrumentDate(
    dataset?.documents ?? []
  );
  const firstDocId = dataset?.documents?.[0]?.doc_id ?? "doc";

  return (
    <div className="min-h-screen bg-[#f5f3ed] text-[#080909]">
      <TopNav
        jurisdictionId={targetJurId}
        jurisdictionName={rootJur?.name}
        active="about"
      />

      <main
        data-dataset-id={
          dataset?.release?.dataset_id ?? manifest.dataset_id ?? ""
        }
        className="mx-auto max-w-5xl space-y-12 px-5 py-10"
      >
        <header className="border-b border-[#c8ccc0] pb-8">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div className="dg-mono text-[#5b5e56]">
              Readable by machines &amp; AI
            </div>
            {currentAsOfDate && (
              <span
                data-testid="current-as-of-date"
                className="font-mono text-xs uppercase tracking-[0.12em] text-[#5b5e56]"
              >
                Current as of {currentAsOfDate}
              </span>
            )}
          </div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#080909] md:text-4xl">
            Use Bylaw One with AI
          </h1>
          <p className="dg-serif mt-3 max-w-3xl text-base leading-relaxed text-[#171917]">
            Every subject, document, provision, parameter table, and land-use
            zone on Bylaw One is published in clean Markdown and structured JSON
            with exact official page numbers so AI assistants and research tools
            can read the law without guessing.
          </p>
        </header>

        {/* 01 / Three ways to use Bylaw One with an AI today */}
        <section
          aria-labelledby="use-today-heading"
          className="space-y-6 border-b border-[#c8ccc0] pb-12"
        >
          <div className="dg-mono text-[#5b5e56]">01 / Use today</div>
          <h2
            id="use-today-heading"
            className="text-2xl font-semibold tracking-tight text-[#080909]"
          >
            How to use Bylaw One with an AI today.
          </h2>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <div className="border border-[#080909] bg-[#efeee8] p-5">
              <div className="dg-mono text-[#080909]">
                1 · Point your AI at llms.txt
              </div>
              <p className="dg-serif mt-2 text-sm leading-relaxed text-[#171917]">
                Give your AI assistant <code>/llms.txt</code> for a compact
                directory of the site, coverage, and citation rules, or{" "}
                <code>/llms-full.txt</code> for every subject&apos;s &ldquo;What
                applies today&rdquo; in one Markdown file.
              </p>
              <div className="mt-4 flex flex-wrap gap-3 font-mono text-xs">
                <a
                  href="/llms.txt"
                  className="border border-[#080909] bg-[#080909] px-3 py-1.5 text-[#f5f3ed] no-underline"
                >
                  Open /llms.txt
                </a>
                <a
                  href="/llms-full.txt"
                  className="border border-[#080909] bg-[#f5f3ed] px-3 py-1.5 text-[#080909] no-underline"
                >
                  Open /llms-full.txt
                </a>
              </div>
            </div>

            <div className="border border-[#080909] bg-[#efeee8] p-5">
              <div className="dg-mono text-[#080909]">
                2 · Add .md to any page address
              </div>
              <p className="dg-serif mt-2 text-sm leading-relaxed text-[#171917]">
                Every subject, document, and provision page has a clean Markdown
                version at the same path ending in <code>.md</code>:
              </p>
              <ul className="mt-3 space-y-2 font-mono text-xs text-[#080909]">
                <li>
                  <a
                    href={`/j/${targetJurId}/topics/far.md`}
                    className="inline-flex min-h-[28px] items-center underline"
                  >
                    FAR subject in Markdown (.md)
                  </a>
                </li>
                <li>
                  <a
                    href={`/j/${targetJurId}/topics/setbacks.md`}
                    className="inline-flex min-h-[28px] items-center underline"
                  >
                    Setbacks subject in Markdown (.md)
                  </a>
                </li>
                <li>
                  <a
                    href={`/j/${targetJurId}/documents/${firstDocId}.md`}
                    className="inline-flex min-h-[28px] items-center underline"
                  >
                    Document in Markdown (.md)
                  </a>
                </li>
              </ul>
            </div>

            <div className="border border-[#080909] bg-[#efeee8] p-5">
              <div className="dg-mono text-[#080909]">
                3 · Use the static JSON API
              </div>
              <p className="dg-serif mt-2 text-sm leading-relaxed text-[#171917]">
                Query structured records at <code>/api/v1/</code>, described by
                an OpenAPI 3.1 specification (
                <a
                  href="/api/v1/openapi.json"
                  className="inline-flex min-h-[28px] items-center font-mono underline"
                >
                  /api/v1/openapi.json
                </a>
                ):
              </p>
              <ul className="mt-3 space-y-1.5 font-mono text-xs text-[#080909]">
                <li>
                  <a
                    href="/api/v1/documents.json"
                    className="inline-flex min-h-[28px] items-center underline"
                  >
                    /api/v1/documents.json
                  </a>
                </li>
                <li>
                  <a
                    href="/api/v1/provisions.json"
                    className="inline-flex min-h-[28px] items-center underline"
                  >
                    /api/v1/provisions.json
                  </a>
                </li>
                <li>
                  <a
                    href="/api/v1/subjects.json"
                    className="inline-flex min-h-[28px] items-center underline"
                  >
                    /api/v1/subjects.json
                  </a>
                </li>
                <li>
                  <a
                    href="/api/v1/parameters.json"
                    className="inline-flex min-h-[28px] items-center underline"
                  >
                    /api/v1/parameters.json
                  </a>
                </li>
                <li>
                  <a
                    href="/api/v1/zones.json"
                    className="inline-flex min-h-[28px] items-center underline"
                  >
                    /api/v1/zones.json
                  </a>
                </li>
                <li>
                  <a
                    href="/api/v1/sources.json"
                    className="inline-flex min-h-[28px] items-center underline"
                  >
                    /api/v1/sources.json
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* 02 / Rules an AI should follow */}
        <section
          aria-labelledby="ai-rules-heading"
          className="space-y-4 border-b border-[#c8ccc0] pb-12"
        >
          <div className="dg-mono text-[#5b5e56]">02 / Honesty rules</div>
          <h2
            id="ai-rules-heading"
            className="text-2xl font-semibold tracking-tight text-[#080909]"
          >
            Four rules any AI using Bylaw One must follow.
          </h2>
          <ol className="dg-serif list-decimal space-y-3 pl-5 text-base leading-relaxed text-[#171917]">
            <li>
              <strong>Cite the official page:</strong> Always name the
              instrument, effective date, provision or table number, and exact
              official PDF page (<code>p. N</code>) with a link to the official
              page. Never invent or paraphrase legal text as if it were a
              verbatim quote.
            </li>
            <li>
              <strong>Label derived values:</strong> Explicitly state when a
              consolidated provision, parameter table value, or buffer is
              derived by Bylaw One rather than printed in a single source.
            </li>
            <li>
              <strong>Ask for missing plot details:</strong> Never guess a
              plot&apos;s land-use zone, road width, plot area, plot depth, plot
              width, or building height when a rule depends on them. Ask the
              user for the missing plot details.
            </li>
            <li>
              <strong>Confirm with the authority:</strong> Remind the user that
              Bylaw One is an open reference worked out from official Gazette
              publications and is not legal advice; plot decisions must be
              confirmed with the planning authority or a qualified professional.
            </li>
          </ol>
        </section>

        {/* 03 / Coming next: Local agent engine */}
        <section
          aria-labelledby="agent-engine-heading"
          className="space-y-4"
        >
          <div className="dg-mono text-[#5b5e56]">03 / Coming next</div>
          <h2
            id="agent-engine-heading"
            className="text-2xl font-semibold tracking-tight text-[#080909]"
          >
            A local agent engine is coming.
          </h2>
          <p className="dg-serif max-w-3xl text-base leading-relaxed text-[#171917]">
            We are building a local, deterministic agent engine — a Model
            Context Protocol (MCP) server, command-line tool, and Agent Skill —
            so architects, planners, and researchers can run exact, cited rule
            checks locally inside their own tools. Practitioners who{" "}
            <Link href="/join" className="text-[#080909] underline">
              join the pilot
            </Link>{" "}
            receive early access.
          </p>
        </section>
      </main>
    </div>
  );
}
