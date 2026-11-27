"use client";

import React from "react";
import Link from "next/link";
import type {
  Byelaw14GovernanceInfo,
  ZoneRulesSummary,
} from "@/lib/zone-rules";
import { ReportProblemLink } from "./ReportProblemLink";

export interface SelectedPlaceContext {
  placeName: string | null;
  lat: number | null;
  lng: number | null;
  zoom: number;
  corporationName: string;
  wardNumber: string | null;
  wardName: string | null;
  planningDistrict: string | null;
  zoneCode: string | null;
  zoneLabel: string | null;
}

export interface PlaceCardProps {
  jurisdictionId: string;
  selectedPlace: SelectedPlaceContext;
  zoneRules: ZoneRulesSummary | null;
  byelaw14Info: Byelaw14GovernanceInfo;
  shareableHash: string;
  onSelectZoneCode?: (zoneCode: string) => void;
  availableZones?: ReadonlyArray<{ zoneCode: string; zoneLabel: string }>;
}

export function PlaceCard({
  jurisdictionId,
  selectedPlace,
  zoneRules,
  byelaw14Info,
  shareableHash,
  onSelectZoneCode,
  availableZones = [],
}: PlaceCardProps) {
  const {
    placeName,
    corporationName,
    wardNumber,
    wardName,
    planningDistrict,
    zoneCode,
    zoneLabel,
  } = selectedPlace;

  const wardDisplay =
    wardNumber && wardName
      ? `Ward ${wardNumber} · ${wardName}`
      : wardName
        ? wardName
        : wardNumber
          ? `Ward ${wardNumber}`
          : "Select a place or ward on the map";

  const zoneDisplay =
    zoneCode && zoneLabel
      ? `${zoneLabel} (${zoneCode})`
      : zoneCode
        ? zoneCode
        : "Land-use data not yet available here";

  return (
    <aside
      aria-label="Place card and rules for this zone"
      data-testid="place-card"
      tabIndex={0}
      className="fixed inset-x-0 bottom-0 z-30 max-h-[58vh] overflow-y-auto border-t-2 border-[#080909] bg-[#f5f3ed] p-5 shadow-lg md:static md:z-auto md:max-h-none md:border md:border-[#080909] md:bg-[#efeee8] md:shadow-none"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[#c8ccc0] pb-3">
        <div>
          <div className="dg-mono text-[#5b5e56]">Place card</div>
          <h2
            data-testid="place-card-heading"
            className="mt-0.5 text-xl font-semibold tracking-tight text-[#080909]"
          >
            {placeName || wardDisplay || corporationName}
          </h2>
        </div>
        {shareableHash && (
          <a
            href={shareableHash}
            data-testid="place-card-share-link"
            className="inline-flex min-h-[44px] items-center font-mono text-[11px] uppercase tracking-[0.12em] text-[#080909] underline decoration-[#c8ccc0] underline-offset-4 hover:decoration-[#080909]"
          >
            Shareable link ({shareableHash.slice(0, 28)}
            {shareableHash.length > 28 ? "…" : ""})
          </a>
        )}
      </div>

      {/* Location attributes: corporation, ward, planning district, land-use zone */}
      <dl
        data-testid="map-location-summary"
        className="mt-3 grid grid-cols-1 gap-3 border-b border-[#c8ccc0] pb-4 text-sm sm:grid-cols-2"
      >
        <div>
          <dt className="dg-mono text-[10.5px] text-[#5b5e56]">Corporation</dt>
          <dd
            data-testid="place-card-corporation"
            className="mt-0.5 font-medium text-[#080909]"
          >
            {corporationName}
          </dd>
        </div>
        <div>
          <dt className="dg-mono text-[10.5px] text-[#5b5e56]">Ward</dt>
          <dd
            data-testid="place-card-ward"
            className="mt-0.5 font-medium text-[#080909]"
          >
            {wardDisplay}
          </dd>
        </div>
        <div>
          <dt className="dg-mono text-[10.5px] text-[#5b5e56]">
            Planning district
          </dt>
          <dd
            data-testid="place-card-planning-district"
            className="mt-0.5 font-medium text-[#080909]"
          >
            {planningDistrict || "Outside processed sheets"}
          </dd>
        </div>
        <div>
          <dt className="dg-mono text-[10.5px] text-[#5b5e56]">
            Land-use zone
          </dt>
          <dd
            data-testid="place-card-zone"
            className="mt-0.5 font-semibold text-[#080909]"
          >
            {zoneDisplay}
          </dd>
        </div>
      </dl>

      {/* Optional quick zone switcher pills */}
      {availableZones.length > 0 && onSelectZoneCode && (
        <div
          role="group"
          aria-label="Inspect zone rules by zone"
          className="mt-3 flex flex-wrap gap-1.5 border-b border-[#c8ccc0] pb-3"
        >
          {availableZones.map((z) => {
            const active = zoneCode === z.zoneCode;
            return (
              <button
                key={z.zoneCode}
                type="button"
                aria-pressed={active}
                onClick={() => onSelectZoneCode(z.zoneCode)}
                className={`min-h-[36px] border px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.08em] focus:outline-2 focus:outline-[#080909] ${
                  active
                    ? "border-[#080909] bg-[#080909] text-[#f5f3ed]"
                    : "border-[#c8ccc0] bg-[#f5f3ed] text-[#080909] hover:border-[#080909]"
                }`}
              >
                {z.zoneLabel} ({z.zoneCode})
              </button>
            );
          })}
        </div>
      )}

      {/* Rules for this zone */}
      <div className="mt-4 space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-base font-semibold text-[#080909]">
            Rules for this zone
          </h3>
        </div>

        {/* One line on why zoning regulations govern these subjects (bye-law 1.4), with quote on tap */}
        <div
          data-testid="place-card-byelaw14"
          className="border border-[#c8ccc0] bg-[#f5f3ed] p-3 text-xs"
        >
          <p className="dg-serif text-xs leading-relaxed text-[#171917]">
            {byelaw14Info.plainLine}
          </p>
          {byelaw14Info.verbatimQuote && (
            <details className="mt-1.5">
              <summary className="inline-flex min-h-[36px] cursor-pointer items-center font-mono text-[10.5px] uppercase tracking-[0.1em] text-[#5b5e56] underline hover:text-[#080909]">
                Read verbatim quote (bye-law 1.4)
              </summary>
              <div className="mt-2 space-y-1.5 border-t border-[#c8ccc0] pt-2">
                <blockquote className="dg-serif border-l-2 border-[#080909] pl-3 text-xs italic text-[#080909]">
                  &ldquo;{byelaw14Info.verbatimQuote}&rdquo;
                </blockquote>
                <div className="flex flex-wrap items-center gap-3 font-mono text-[10.5px] text-[#5b5e56]">
                  <span>{byelaw14Info.attributionLabel}</span>
                  <a
                    href={byelaw14Info.pageLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#080909] underline"
                  >
                    Official PDF p. {byelaw14Info.pageNumber} ↗
                  </a>
                  <Link
                    href={byelaw14Info.documentHref}
                    className="text-[#080909] underline"
                  >
                    Open in document →
                  </Link>
                </div>
              </div>
            </details>
          )}
        </div>

        {!zoneCode ? (
          <p
            data-testid="place-card-no-zone-data"
            className="dg-serif border border-[#c8ccc0] bg-[#f5f3ed] p-3 text-sm text-[#171917]"
          >
            Land-use data not yet available here. Choose a mapped neighbourhood
            or zone above to inspect zone rules, or browse all subjects in{" "}
            <Link
              href={`/j/${jurisdictionId}/topics`}
              className="font-medium text-[#080909] underline"
            >
              The code
            </Link>
            .
          </p>
        ) : !zoneRules || !zoneRules.hasLinkedRules ? (
          <p
            data-testid="place-card-no-linked-rules"
            className="dg-serif border border-[#c8ccc0] bg-[#f5f3ed] p-3 text-sm text-[#171917]"
          >
            No rules linked to this zone yet.
          </p>
        ) : (
          <div
            data-testid="place-card-rule-groups"
            className="divide-y divide-[#c8ccc0] border border-[#c8ccc0] bg-[#f5f3ed]"
          >
            {zoneRules.groups.map((group) => (
              <section
                key={group.key}
                data-testid={`place-card-group-${group.key}`}
                aria-label={`${group.title} rules`}
                className="p-3"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <h4 className="font-mono text-xs font-semibold uppercase tracking-[0.1em] text-[#080909]">
                    {group.title}
                  </h4>
                  <Link
                    href={group.subjectHref}
                    data-testid={`place-card-subject-link-${group.key}`}
                    className="inline-flex min-h-[36px] items-center font-mono text-[10.5px] uppercase tracking-[0.1em] text-[#080909] underline decoration-[#080909] underline-offset-4"
                  >
                    Open {group.title} subject →
                  </Link>
                </div>

                {group.lines.length === 0 ? (
                  <p className="dg-serif mt-1 text-xs text-[#5b5e56]">
                    General {group.title.toLowerCase()} rules apply on the{" "}
                    {group.title.toLowerCase()} subject page.
                  </p>
                ) : (
                  <ul className="mt-2 space-y-2">
                    {group.lines.map((line) => (
                      <li
                        key={line.id}
                        className="border-t border-[#efeee8] pt-2 first:border-t-0 first:pt-0"
                      >
                        <div className="flex flex-wrap items-baseline justify-between gap-2 text-xs">
                          <span className="dg-serif inline-flex min-h-[26px] items-center font-medium text-[#080909]">
                            {line.rulePlain}
                          </span>
                          <span className="font-mono text-xs font-semibold text-[#080909]">
                            {line.valuePlain}
                          </span>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center justify-between gap-2 font-mono text-[10.5px] text-[#5b5e56]">
                          <div className="flex flex-wrap items-center gap-2">
                            <span>{line.sourceDocTitle}</span>
                            <a
                              href={line.pageLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex min-h-[26px] items-center text-[#080909] underline"
                            >
                              p. {line.pageNumber} ↗
                            </a>
                            {line.corporationTag && (
                              <span
                                data-testid="place-card-corporation-diff"
                                className="border border-[#080909] bg-[#efeee8] px-1.5 py-0.5 text-[10px] text-[#080909]"
                              >
                                {line.corporationTag}
                              </span>
                            )}
                          </div>
                          <ReportProblemLink
                            pagePath={`/j/${jurisdictionId}`}
                            ruleSummary={`${line.rulePlain}: ${line.valuePlain}`}
                            officialPageUrl={line.pageLink}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
