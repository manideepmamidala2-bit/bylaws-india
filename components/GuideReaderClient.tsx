"use client";

import React, { useState } from "react";
import Link from "next/link";
import type {
  GuideAudienceEntryPoint,
  GuideAudienceId,
  GuideSection,
} from "@/lib/guide";

interface GuideReaderClientProps {
  audiences: GuideAudienceEntryPoint[];
  sections: GuideSection[];
}

function renderInlineMarkdown(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  // Tokenize bold+link, link, bold, italic, and inline code
  const tokenRegex =
    /\*\*\[([^\]]+)\]\(([^)]+)\)\*\*|\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`/g;
  let lastIdx = 0;
  let match: RegExpExecArray | null = null;
  let keyIdx = 0;

  while ((match = tokenRegex.exec(text)) !== null) {
    if (match.index > lastIdx) {
      nodes.push(text.slice(lastIdx, match.index));
    }
    keyIdx += 1;
    if (match[1] !== undefined && match[2] !== undefined) {
      const href = match[2];
      nodes.push(
        <strong key={`bl-${keyIdx}`} className="font-semibold text-[#080909]">
          <Link href={href} className="text-[#080909] underline">
            {match[1]}
          </Link>
        </strong>
      );
    } else if (match[3] !== undefined && match[4] !== undefined) {
      const href = match[4];
      const rawLabel = match[3];
      const isBoldLabel =
        rawLabel.startsWith("**") && rawLabel.endsWith("**");
      const cleanLabel = isBoldLabel
        ? rawLabel.slice(2, -2)
        : rawLabel.replace(/^`|`$/g, "");
      const inner = isBoldLabel ? (
        <strong className="font-semibold text-[#080909]">{cleanLabel}</strong>
      ) : (
        cleanLabel
      );
      if (href.startsWith("http") || href.startsWith("mailto:")) {
        nodes.push(
          <a
            key={`a-${keyIdx}`}
            href={href}
            className="text-[#080909] underline"
          >
            {inner}
          </a>
        );
      } else {
        nodes.push(
          <Link
            key={`l-${keyIdx}`}
            href={href}
            className="text-[#080909] underline"
          >
            {inner}
          </Link>
        );
      }
    } else if (match[5] !== undefined) {
      nodes.push(
        <strong key={`b-${keyIdx}`} className="font-semibold text-[#080909]">
          {match[5]}
        </strong>
      );
    } else if (match[6] !== undefined) {
      nodes.push(
        <em key={`i-${keyIdx}`} className="italic">
          {match[6]}
        </em>
      );
    } else if (match[7] !== undefined) {
      nodes.push(
        <code
          key={`c-${keyIdx}`}
          className="bg-[#efeee8] px-1 py-0.5 font-mono text-xs text-[#080909]"
        >
          {match[7]}
        </code>
      );
    }
    lastIdx = tokenRegex.lastIndex;
  }

  if (lastIdx < text.length) {
    nodes.push(text.slice(lastIdx));
  }
  return nodes;
}

export function renderGuideMarkdownBlocks(
  markdown: string,
  sectionTitle: string
): React.ReactNode[] {
  const rawBlocks = markdown
    .trim()
    .split(/\r?\n\r?\n+/)
    .map((b) => b.trim())
    .filter(Boolean);

  return rawBlocks.map((block, bIdx) => {
    const lines = block.split(/\r?\n/);

    // Subheading ###
    if (lines.length === 1 && lines[0].startsWith("### ")) {
      return (
        <h3
          key={`h3-${bIdx}`}
          className="mt-6 text-lg font-semibold tracking-tight text-[#080909]"
        >
          {renderInlineMarkdown(lines[0].slice(4).trim())}
        </h3>
      );
    }

    // Blockquote >
    if (lines.every((l) => l.trim().startsWith(">"))) {
      const quoteText = lines
        .map((l) => l.trim().replace(/^>\s?/, ""))
        .join(" ");
      return (
        <blockquote
          key={`bq-${bIdx}`}
          className="dg-serif border-l-4 border-[#080909] bg-[#efeee8] px-5 py-4 text-base leading-relaxed text-[#080909]"
        >
          {renderInlineMarkdown(quoteText)}
        </blockquote>
      );
    }

    // Markdown table | ... |
    if (
      lines.length >= 3 &&
      lines[0].trim().startsWith("|") &&
      /^\|[\s:|-]+\|$/.test(lines[1].trim())
    ) {
      const parseRow = (rowLine: string) =>
        rowLine
          .trim()
          .replace(/^\|/, "")
          .replace(/\|$/, "")
          .split("|")
          .map((c) => c.trim());
      const headers = parseRow(lines[0]);
      const rows = lines.slice(2).map(parseRow);
      return (
        <div
          key={`tbl-${bIdx}`}
          tabIndex={0}
          role="region"
          aria-label={`${sectionTitle} table ${bIdx + 1}`}
          className="overflow-x-auto"
        >
          <table className="dg-table">
            <thead>
              <tr>
                {headers.map((h, hIdx) => (
                  <th key={hIdx}>{renderInlineMarkdown(h)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, rIdx) => (
                <tr key={rIdx}>
                  {r.map((cell, cIdx) => (
                    <td key={cIdx} className="dg-serif text-sm text-[#171917]">
                      {renderInlineMarkdown(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    // Unordered list - ...
    if (lines.every((l) => l.trim().startsWith("- "))) {
      return (
        <ul
          key={`ul-${bIdx}`}
          className="dg-serif list-disc space-y-2 pl-5 text-base leading-relaxed text-[#171917]"
        >
          {lines.map((l, lIdx) => (
            <li key={lIdx}>
              {renderInlineMarkdown(l.trim().slice(2).trim())}
            </li>
          ))}
        </ul>
      );
    }

    // Ordered list 1. ...
    if (lines.every((l) => /^\d+\.\s+/.test(l.trim()))) {
      return (
        <ol
          key={`ol-${bIdx}`}
          className="dg-serif list-decimal space-y-2.5 pl-5 text-base leading-relaxed text-[#171917]"
        >
          {lines.map((l, lIdx) => (
            <li key={lIdx}>
              {renderInlineMarkdown(l.trim().replace(/^\d+\.\s+/, ""))}
            </li>
          ))}
        </ol>
      );
    }

    // Standard paragraph
    return (
      <p
        key={`p-${bIdx}`}
        className="dg-serif text-base leading-relaxed text-[#171917]"
      >
        {renderInlineMarkdown(lines.join(" "))}
      </p>
    );
  });
}

export function GuideReaderClient({
  audiences,
  sections,
}: GuideReaderClientProps) {
  const [selectedAudienceId, setSelectedAudienceId] =
    useState<GuideAudienceId | null>(null);
  const [activeSectionId, setActiveSectionId] = useState<string>(
    sections[0]?.id ?? "opening"
  );

  const selectedAudience =
    audiences.find((a) => a.id === selectedAudienceId) ?? null;
  const sectionById = new Map(sections.map((s) => [s.id, s]));
  const highlightedSet = new Set(selectedAudience?.sectionIds ?? []);

  return (
    <div className="space-y-10">
      {/* Audience entry points */}
      <section
        aria-labelledby="audience-entry-heading"
        data-testid="guide-audience-entry-points"
        className="border-b border-[#c8ccc0] pb-8"
      >
        <div className="dg-mono text-[#5b5e56]">
          Start here · Choose your path
        </div>
        <h2
          id="audience-entry-heading"
          className="mt-1 text-xl font-semibold tracking-tight text-[#080909]"
        >
          Who are you reading as?
        </h2>
        <div className="mt-4 flex flex-wrap gap-2.5">
          {audiences.map((aud) => {
            const isSelected = selectedAudienceId === aud.id;
            return (
              <button
                key={aud.id}
                type="button"
                data-testid={`audience-btn-${aud.id}`}
                aria-pressed={isSelected}
                onClick={() => {
                  const next = isSelected ? null : aud.id;
                  setSelectedAudienceId(next);
                  if (next && aud.sectionIds[0]) {
                    setActiveSectionId(aud.sectionIds[0]);
                  }
                }}
                className={`inline-flex min-h-[44px] items-center border px-4 py-2 font-mono text-xs uppercase tracking-[0.1em] ${
                  isSelected
                    ? "border-[#080909] border-b-2 border-b-[#ff6b52] bg-[#efeee8] font-semibold text-[#080909]"
                    : "border-[#080909] bg-[#f5f3ed] text-[#080909] hover:bg-[#efeee8]"
                }`}
              >
                {aud.label}
              </button>
            );
          })}
        </div>

        {selectedAudience && (
          <div
            data-testid="audience-selected-path"
            className="mt-4 border border-[#080909] border-l-4 border-l-[#ff6b52] bg-[#efeee8] p-4"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div className="font-mono text-xs font-semibold uppercase tracking-[0.1em] text-[#080909]">
                Recommended path for: {selectedAudience.roleTitle}
              </div>
              <button
                type="button"
                onClick={() => setSelectedAudienceId(null)}
                className="font-mono text-[11px] uppercase tracking-[0.1em] text-[#5b5e56] underline hover:text-[#080909]"
              >
                Show all sections equally
              </button>
            </div>
            <p className="dg-serif mt-1 text-sm text-[#171917]">
              {selectedAudience.summary}
            </p>
            <ol className="mt-3 flex flex-wrap gap-2">
              {selectedAudience.sectionIds.map((sid, idx) => {
                const sec = sectionById.get(sid);
                if (!sec) return null;
                return (
                  <li key={sid}>
                    <a
                      href={`#section-${sid}`}
                      onClick={() => setActiveSectionId(sid)}
                      className="inline-flex min-h-[36px] items-center border border-[#080909] bg-[#f5f3ed] px-3 py-1 font-mono text-xs text-[#080909] no-underline hover:bg-[#080909] hover:text-[#f5f3ed]"
                    >
                      {idx + 1}. {sec.title}
                    </a>
                  </li>
                );
              })}
            </ol>
          </div>
        )}
      </section>

      {/* Main layout: Sticky contents + One reading column */}
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside aria-label="Guide table of contents">
          <nav
            aria-label="Guide contents"
            data-testid="guide-sticky-contents"
            className="border border-[#c8ccc0] bg-[#efeee8] p-4 lg:sticky lg:top-6"
          >
            <div className="dg-mono mb-3 text-[#5b5e56]">Contents</div>
            <ol className="space-y-1">
              {sections.map((sec) => {
                const isCurrent = activeSectionId === sec.id;
                const isAudienceMatch =
                  !selectedAudience || highlightedSet.has(sec.id);
                return (
                  <li key={sec.id}>
                    <a
                      href={`#section-${sec.id}`}
                      onClick={() => setActiveSectionId(sec.id)}
                      aria-current={isCurrent ? "location" : undefined}
                      className={`flex min-h-[36px] items-baseline gap-2 px-2 py-1 text-xs no-underline ${
                        isCurrent
                          ? "border-l-2 border-[#ff6b52] bg-[#f5f3ed] font-semibold text-[#080909]"
                          : isAudienceMatch
                            ? "text-[#080909] hover:bg-[#f5f3ed]"
                            : "text-[#5b5e56] hover:text-[#080909]"
                      }`}
                    >
                      <span className="font-mono text-[11px] text-[#5b5e56]">
                        {sec.number}
                      </span>
                      <span>{sec.title}</span>
                    </a>
                  </li>
                );
              })}
            </ol>
          </nav>
        </aside>

        {/* Single reading column */}
        <div
          data-testid="guide-reading-column"
          className="max-w-3xl space-y-14"
        >
          {sections.map((sec) => {
            const isHighlighted =
              selectedAudience && highlightedSet.has(sec.id);
            return (
              <section
                key={sec.id}
                id={`section-${sec.id}`}
                data-testid={`guide-section-${sec.id}`}
                aria-labelledby={`heading-${sec.id}`}
                onMouseEnter={() => setActiveSectionId(sec.id)}
                className="scroll-mt-8 space-y-5 border-b border-[#c8ccc0] pb-12 last:border-b-0"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="dg-mono text-[#5b5e56]">{sec.kicker}</span>
                    {isHighlighted && (
                      <span className="border border-[#080909] bg-[#efeee8] px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-[#080909]">
                        In your path
                      </span>
                    )}
                  </div>
                  <Link
                    href={`/guide/slides#slide-${sec.id}`}
                    data-testid={`start-slides-${sec.id}`}
                    className="inline-flex min-h-[44px] items-center font-mono text-xs uppercase tracking-[0.12em] text-[#080909] underline decoration-[#c8ccc0] underline-offset-4 hover:decoration-[#080909]"
                  >
                    Start from section →
                  </Link>
                </div>

                <h2
                  id={`heading-${sec.id}`}
                  className="text-2xl font-semibold tracking-tight text-[#080909] md:text-3xl"
                >
                  {sec.number === "00"
                    ? sec.title
                    : `${Number(sec.number)}. ${sec.title}`}
                </h2>

                {/* Reading prose / tables / lists */}
                <div className="space-y-4">
                  {renderGuideMarkdownBlocks(sec.readingMarkdown, sec.title)}
                </div>

                {/* Mermaid SVG diagrams */}
                {sec.diagrams.map((diag) => (
                  <figure
                    key={diag.id}
                    data-testid={`guide-diagram-${diag.id}`}
                    aria-label={diag.title}
                    className="mt-6 border border-[#080909] bg-[#efeee8] p-4"
                  >
                    <figcaption className="mb-3 space-y-1 border-b border-[#c8ccc0] pb-2">
                      <div className="dg-mono text-[#080909]">
                        Diagram · {diag.title}
                      </div>
                      <p className="dg-serif text-xs text-[#171917]">
                        {diag.caption}
                      </p>
                    </figcaption>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/guide/diagrams/${diag.id}.svg`}
                      alt={diag.title}
                      className="w-full border border-[#c8ccc0] bg-[#f5f3ed] p-3"
                    />
                  </figure>
                ))}

                {/* Playwright screenshots (1280 px desktop + 390 px mobile inside Details) */}
                {sec.screenshots.map((shot) => (
                  <figure
                    key={shot.id}
                    data-testid={`guide-screenshot-${shot.id}`}
                    aria-label={shot.title}
                    className="mt-6 border border-[#080909] bg-[#efeee8] p-4"
                  >
                    <figcaption className="mb-3 space-y-1">
                      <div className="dg-mono text-[#080909]">
                        Live view · {shot.title}
                      </div>
                      <p className="dg-serif text-xs text-[#171917]">
                        {shot.caption}
                      </p>
                    </figcaption>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={shot.desktopSrc}
                      alt={`${shot.title} (1280 px desktop view)`}
                      loading="lazy"
                      className="w-full border border-[#c8ccc0] bg-[#f5f3ed]"
                    />
                    <details className="mt-2">
                      <summary className="inline-flex min-h-[44px] cursor-pointer items-center font-mono text-[11px] uppercase tracking-[0.12em] text-[#5b5e56] underline hover:text-[#080909]">
                        Details · Phone view (390 px) &amp; presenter notes
                      </summary>
                      <div className="mt-2 grid grid-cols-1 gap-4 border-t border-[#c8ccc0] pt-3 sm:grid-cols-[220px_1fr] sm:items-start">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={shot.mobileSrc}
                          alt={`${shot.title} (390 px phone view)`}
                          loading="lazy"
                          className="w-48 border border-[#c8ccc0] bg-[#f5f3ed]"
                        />
                        <div className="space-y-2 text-xs text-[#171917]">
                          <div className="dg-mono text-[#080909]">
                            Presenter notes for this view
                          </div>
                          <p className="dg-serif leading-relaxed">
                            {shot.presenterNotes}
                          </p>
                        </div>
                      </div>
                    </details>
                  </figure>
                ))}

                {/* Slide summary & presenter notes on tap */}
                <details className="border-t border-[#c8ccc0] pt-2">
                  <summary className="inline-flex min-h-[44px] cursor-pointer items-center font-mono text-[11px] uppercase tracking-[0.12em] text-[#5b5e56] underline hover:text-[#080909]">
                    Details · Slide summary ({sec.slideSummaryWordCount} words)
                    &amp; presenter notes
                  </summary>
                  <div className="mt-2 space-y-2 border border-[#c8ccc0] bg-[#efeee8] p-3 text-xs text-[#171917]">
                    <div>
                      <span className="dg-mono text-[#080909]">
                        Slide summary:{" "}
                      </span>
                      <span className="dg-serif font-medium text-[#080909]">
                        {sec.slideSummary}
                      </span>
                    </div>
                    <div>
                      <span className="dg-mono text-[#5b5e56]">
                        Presenter notes:{" "}
                      </span>
                      <span className="dg-serif">{sec.presenterNotes}</span>
                    </div>
                  </div>
                </details>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
