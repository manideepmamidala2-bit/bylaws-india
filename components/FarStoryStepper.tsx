"use client";

import React, { useState } from "react";
import Link from "next/link";

export interface FarStoryTableRow {
  condition: string;
  values: string[];
  sourceLabel?: string;
  pageLink?: string;
  pageNumber?: number;
}

export interface FarStoryStep {
  stepNumber: number;
  heading: string;
  inShortBySite: string;
  verbatimExcerpt: string | null;
  missingExcerptReason?: string;
  documentTitle: string;
  documentDate: string;
  documentNote?: string;
  pageNumber: number;
  viewPageUrl: string;
  documentHref: string;
  documentLinkLabel?: string;
  secondaryDocumentHref?: string;
  secondaryDocumentLabel?: string;
  tableCaption?: string;
  tableHeaders?: string[];
  tableRows?: FarStoryTableRow[];
}

interface FarStoryStepperProps {
  steps: ReadonlyArray<FarStoryStep>;
}

export function FarStoryStepper({ steps }: FarStoryStepperProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const total = steps.length;

  function goToStep(nextIdx: number) {
    const clamped = Math.max(0, Math.min(total - 1, nextIdx));
    setActiveIndex(clamped);
    const el = document.getElementById(`far-story-step-${clamped + 1}`);
    if (el && typeof window !== "undefined") {
      const reduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;
      if (typeof el.scrollIntoView === "function") {
        el.scrollIntoView({
          behavior: reduced ? "auto" : "smooth",
          block: "nearest",
        });
      }
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      goToStep(activeIndex + 1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      goToStep(activeIndex - 1);
    }
  }

  return (
    <div
      data-testid="far-story-stepper"
      onKeyDown={handleKeyDown}
      className="space-y-6"
    >
      {/* Stepper bar & controls */}
      <div
        role="group"
        aria-label="FAR story step navigation"
        className="flex flex-wrap items-center justify-between gap-4 border-y border-[#c8ccc0] bg-[#efeee8] px-4 py-3"
      >
        <div className="flex flex-wrap items-center gap-2">
          <span
            data-testid="far-story-step-counter"
            className="dg-mono font-medium text-[#080909]"
          >
            Step {activeIndex + 1} / {total}
          </span>
          <div className="flex items-center gap-1.5">
            {steps.map((s, idx) => {
              const isActive = idx === activeIndex;
              return (
                <button
                  key={s.stepNumber}
                  type="button"
                  onClick={() => goToStep(idx)}
                  aria-label={`Go to step ${s.stepNumber}: ${s.heading}`}
                  aria-current={isActive ? "step" : undefined}
                  className={`inline-flex min-h-[44px] min-w-[44px] items-center justify-center border font-mono text-xs ${
                    isActive
                      ? "border-[#080909] border-b-4 border-b-[#ff6b52] bg-[#f5f3ed] font-semibold text-[#080909]"
                      : "border-[#c8ccc0] bg-[#f5f3ed] text-[#5b5e56] hover:text-[#080909]"
                  }`}
                >
                  {s.stepNumber}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            data-testid="far-story-prev"
            disabled={activeIndex === 0}
            onClick={() => goToStep(activeIndex - 1)}
            className="inline-flex min-h-[44px] items-center border border-[#080909] bg-[#f5f3ed] px-4 font-mono text-xs uppercase tracking-[0.12em] text-[#080909] disabled:border-[#c8ccc0] disabled:text-[#5b5e56]"
          >
            Previous
          </button>
          <button
            type="button"
            data-testid="far-story-next"
            disabled={activeIndex === total - 1}
            onClick={() => goToStep(activeIndex + 1)}
            className="inline-flex min-h-[44px] items-center border border-[#080909] bg-[#080909] px-4 font-mono text-xs uppercase tracking-[0.12em] text-[#f5f3ed] disabled:border-[#c8ccc0] disabled:bg-[#efeee8] disabled:text-[#5b5e56]"
          >
            Next
          </button>
        </div>
      </div>

      {/* Ordered list of all 5 steps: works without JS and stacks on phones */}
      <ol className="space-y-8">
        {steps.map((step, idx) => {
          const isActive = idx === activeIndex;
          return (
            <li
              key={step.stepNumber}
              id={`far-story-step-${step.stepNumber}`}
              data-testid={`far-story-step-${step.stepNumber}`}
              onClick={() => setActiveIndex(idx)}
              className={`border-t border-[#c8ccc0] pt-6 transition-colors motion-reduce:transition-none ${
                isActive
                  ? "border-l-4 border-l-[#ff6b52] bg-[#efeee8] p-5"
                  : "bg-[#f5f3ed] p-5"
              }`}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="dg-mono text-[#5b5e56]">
                  Step {step.stepNumber} / {total}
                </span>
                <span className="dg-mono text-[#5b5e56]">
                  {step.documentDate}
                </span>
              </div>

              <h3 className="mt-2 text-xl font-semibold tracking-tight text-[#080909] md:text-2xl">
                {step.heading}
              </h3>

              {/* In short, by this site */}
              <div className="mt-4 space-y-1">
                <div className="dg-mono text-[#5b5e56]">
                  In short, by this site
                </div>
                <p className="text-base text-[#080909]">{step.inShortBySite}</p>
              </div>

              {/* From the official text */}
              <div className="mt-5 border-l-2 border-[#080909] bg-[#f5f3ed] p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="dg-mono text-[#5b5e56]">
                    From the official text
                  </span>
                  <span className="font-mono text-xs text-[#5b5e56]">
                    {step.documentTitle} · {step.documentDate}
                  </span>
                </div>

                {step.verbatimExcerpt ? (
                  <blockquote
                    data-testid={`far-story-excerpt-${step.stepNumber}`}
                    className="dg-serif mt-2 text-base leading-relaxed text-[#080909]"
                  >
                    &ldquo;{step.verbatimExcerpt}&rdquo;
                  </blockquote>
                ) : (
                  <p className="mt-2 text-sm text-[#5b5e56]">
                    {step.missingExcerptReason ||
                      "Source text for this step could not be found verbatim in the structured dataset."}
                  </p>
                )}

                {step.documentNote && (
                  <p
                    data-testid={`far-story-note-${step.stepNumber}`}
                    className="dg-serif mt-2 text-xs text-[#5b5e56]"
                  >
                    {step.documentNote}
                  </p>
                )}

                <div className="mt-3 flex flex-wrap items-center gap-4">
                  <a
                    href={step.viewPageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-testid={`far-story-view-page-${step.stepNumber}`}
                    className="inline-flex min-h-[44px] items-center font-mono text-xs uppercase tracking-[0.12em] text-[#080909] underline decoration-[#080909] underline-offset-4"
                  >
                    View page (p. {step.pageNumber}) ↗
                  </a>
                  <Link
                    href={step.documentHref}
                    className="inline-flex min-h-[44px] items-center font-mono text-xs uppercase tracking-[0.12em] text-[#5b5e56] underline decoration-[#c8ccc0] underline-offset-4 hover:text-[#080909]"
                  >
                    {step.documentLinkLabel || "Open in document"}
                  </Link>
                  {step.secondaryDocumentHref && (
                    <Link
                      href={step.secondaryDocumentHref}
                      className="inline-flex min-h-[44px] items-center font-mono text-xs uppercase tracking-[0.12em] text-[#5b5e56] underline decoration-[#c8ccc0] underline-offset-4 hover:text-[#080909]"
                    >
                      {step.secondaryDocumentLabel || "Open notification"}
                    </Link>
                  )}
                </div>
              </div>

              {/* Optional clean table */}
              {step.tableHeaders &&
                step.tableRows &&
                step.tableRows.length > 0 && (
                  <div className="mt-5">
                    {step.tableCaption && (
                      <div className="dg-mono mb-2 text-[#5b5e56]">
                        {step.tableCaption}
                      </div>
                    )}
                    <div className="overflow-x-auto">
                      <table className="dg-table">
                        <thead>
                          <tr>
                            {step.tableHeaders.map((hdr) => (
                              <th key={hdr}>{hdr}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {step.tableRows.map((row, rIdx) => (
                            <tr key={`${row.condition}-${rIdx}`}>
                              <td className="font-medium text-[#080909]">
                                {row.condition}
                              </td>
                              {row.values.map((v, vIdx) => (
                                <td
                                  key={vIdx}
                                  className="font-mono text-xs text-[#080909]"
                                >
                                  {v}
                                </td>
                              ))}
                              {row.pageLink && (
                                <td className="font-mono text-xs">
                                  <a
                                    href={row.pageLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[#080909] underline"
                                  >
                                    {row.sourceLabel
                                      ? `${row.sourceLabel}, p. ${row.pageNumber}`
                                      : `p. ${row.pageNumber}`}
                                  </a>
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
