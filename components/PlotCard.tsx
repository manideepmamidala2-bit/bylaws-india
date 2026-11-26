"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import type {
  JurisdictionConsolidated,
  JurisdictionParameters,
  StatutoryResolutionConfig,
} from "@/lib/data";
import {
  PARAMETER_LABELS,
  PARAMETER_ORDER,
  resolvePlotParameters,
  type ResolvedParameterOutcome,
} from "@/lib/resolver";

export interface PlotCardProps {
  jurisdictionId: string;
  corporationName: string;
  parametersPayload: JurisdictionParameters | null;
  resolutionConfig: StatutoryResolutionConfig | null;
  consolidatedPayload?: JurisdictionConsolidated | null;
  selectedWardId?: string | null;
  selectedWardName?: string | null;
  selectedPlanningDistrict?: string | null;
  selectedZoneCode: string | null;
  selectedZoneLabel?: string | null;
  onSelectZone?: (zoneCode: string) => void;
  lat?: number | null;
  lon?: number | null;
}

const ZONE_OPTIONS: ReadonlyArray<{ code: string; label: string }> = [
  { code: "R-MAIN", label: "Residential (Main)" },
  { code: "R-MIX", label: "Residential (Mixed)" },
  { code: "C-BIZ", label: "Commercial (Business)" },
  { code: "C-AXES", label: "Commercial Axes / Mutation Corridors" },
  { code: "I-GEN", label: "Industrial (General)" },
  { code: "I-HITECH", label: "Industrial (Hi-Tech)" },
  { code: "PSP", label: "Public and Semi-Public" },
  { code: "T-TRANS", label: "Traffic and Transportation" },
];

export function PlotCard({
  jurisdictionId,
  corporationName,
  parametersPayload,
  resolutionConfig,
  consolidatedPayload = null,
  selectedWardId = null,
  selectedWardName = null,
  selectedPlanningDistrict = null,
  selectedZoneCode,
  selectedZoneLabel = null,
  onSelectZone,
  lat = null,
  lon = null,
}: PlotCardProps) {
  const [plotAreaM2, setPlotAreaM2] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search);
      const v = Number(p.get("area"));
      if (v > 0) return v;
    }
    return 600;
  });
  const [roadWidthM, setRoadWidthM] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search);
      const v = Number(p.get("road"));
      if (v > 0) return v;
    }
    return 15;
  });
  const [plotDepthM, setPlotDepthM] = useState<number>(30);
  const [plotWidthM, setPlotWidthM] = useState<number>(20);
  const [buildingHeightM, setBuildingHeightM] = useState<number>(11.5);
  const [useCategory, setUseCategory] = useState<string>("residential");
  const [fallbackZoneCode, setFallbackZoneCode] = useState<string>("R-MAIN");
  const [copiedShareUrl, setCopiedShareUrl] = useState<string | null>(null);

  const hasMapZone = Boolean(
    selectedZoneCode && selectedZoneCode !== "unknown"
  );
  const effectiveZoneCode = hasMapZone
    ? selectedZoneCode!
    : fallbackZoneCode || "R-MAIN";
  const effectiveZoneLabel = hasMapZone
    ? selectedZoneLabel || selectedZoneCode!
    : ZONE_OPTIONS.find((z) => z.code === effectiveZoneCode)?.label ??
      effectiveZoneCode;

  const resolution = useMemo(() => {
    if (!parametersPayload || !resolutionConfig) {
      return null;
    }
    return resolvePlotParameters({
      parametersPayload,
      resolutionConfig,
      corporationId: jurisdictionId,
      zoneCode: effectiveZoneCode,
      plotAreaM2: Math.max(10, plotAreaM2 || 600),
      roadWidthM: Math.max(1, roadWidthM || 15),
      plotDepthM: Math.max(1, plotDepthM || 30),
      plotWidthM: Math.max(1, plotWidthM || 20),
      buildingHeightM: Math.max(1, buildingHeightM || 11.5),
      use: useCategory,
      asOfDate: "2026-11-25",
      consolidatedPayload,
    });
  }, [
    buildingHeightM,
    consolidatedPayload,
    effectiveZoneCode,
    jurisdictionId,
    parametersPayload,
    plotAreaM2,
    plotDepthM,
    plotWidthM,
    resolutionConfig,
    roadWidthM,
    useCategory,
  ]);

  const shareQuery = useMemo(() => {
    const params = new URLSearchParams();
    params.set("corp", jurisdictionId);
    params.set("zone", effectiveZoneCode);
    params.set("area", String(plotAreaM2));
    params.set("road", String(roadWidthM));
    params.set("depth", String(plotDepthM));
    params.set("width", String(plotWidthM));
    params.set("height", String(buildingHeightM));
    params.set("use", useCategory);
    if (lat !== null && lat !== undefined) params.set("lat", String(lat));
    if (lon !== null && lon !== undefined) params.set("lon", String(lon));
    return `?${params.toString()}`;
  }, [
    buildingHeightM,
    effectiveZoneCode,
    jurisdictionId,
    lat,
    lon,
    plotAreaM2,
    plotDepthM,
    plotWidthM,
    roadWidthM,
    useCategory,
  ]);

  function handleShareLink() {
    if (typeof window === "undefined") return;
    const nextUrl = `${window.location.pathname}${shareQuery}`;
    window.history.replaceState(null, "", nextUrl);
    setCopiedShareUrl(nextUrl);
  }

  return (
    <section
      aria-label="Plot building code resolver card"
      className="border border-[#080909] bg-[#f5f3ed] p-5"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[#080909] pb-3">
        <div>
          <div className="dg-mono text-[10.5px] text-[#080909]">
            What May Be Built on This Plot
          </div>
          <h2 className="mt-0.5 text-xl font-semibold tracking-tight text-[#080909]">
            Plot Building Code Answers
          </h2>
        </div>
        <button
          type="button"
          onClick={handleShareLink}
          className="border border-[#080909] bg-[#efeee8] px-2.5 py-1 font-mono text-[10.5px] uppercase tracking-[0.12em] text-[#080909] hover:bg-[#e5e6de]"
        >
          Share plot link
        </button>
      </div>

      {copiedShareUrl && (
        <div
          role="status"
          className="mt-2 border border-[#c8ccc0] bg-[#efeee8] px-3 py-1.5 font-mono text-[11px] text-[#080909]"
        >
          Shareable address updated: <span>{copiedShareUrl}</span>
        </div>
      )}

      {/* Location summary */}
      <dl className="mt-3 grid grid-cols-2 gap-2 border-b border-[#c8ccc0] bg-[#efeee8] p-3 text-xs sm:grid-cols-4">
        <div>
          <dt className="dg-mono text-[10px]">Corporation</dt>
          <dd className="mt-0.5 font-semibold text-[#080909]">
            {corporationName}
          </dd>
        </div>
        <div>
          <dt className="dg-mono text-[10px]">Ward</dt>
          <dd className="mt-0.5 font-medium text-[#080909]">
            {selectedWardId
              ? `Ward ${selectedWardId}${selectedWardName ? ` · ${selectedWardName}` : ""}`
              : "Click map or select ward"}
          </dd>
        </div>
        <div>
          <dt className="dg-mono text-[10px]">Planning District</dt>
          <dd className="mt-0.5 font-mono text-[#080909]">
            {selectedPlanningDistrict ?? "Select on map"}
          </dd>
        </div>
        <div>
          <dt className="dg-mono text-[10px]">Land-Use Zone</dt>
          <dd className="mt-0.5 font-medium text-[#080909]">
            {hasMapZone ? (
              <span>{effectiveZoneLabel}</span>
            ) : (
              <span className="text-[#5b5e56]">
                Zone data not yet available here (using chosen zone:{" "}
                <strong className="text-[#080909]">{effectiveZoneLabel}</strong>)
              </span>
            )}
          </dd>
        </div>
      </dl>

      {/* Plot Inputs */}
      <div className="mt-3 grid grid-cols-1 gap-3 border-b border-[#c8ccc0] pb-3 sm:grid-cols-3">
        <div>
          <label
            htmlFor="plot-input-area"
            className="dg-mono block text-[10px] text-[#080909]"
          >
            Plot area (m²)
          </label>
          <input
            id="plot-input-area"
            type="number"
            min={15}
            max={50000}
            step={10}
            value={plotAreaM2}
            onChange={(e) => setPlotAreaM2(Number(e.target.value) || 600)}
            className="mt-1 w-full border border-[#080909] bg-[#f5f3ed] px-2.5 py-1.5 font-mono text-xs text-[#080909]"
          />
        </div>
        <div>
          <label
            htmlFor="plot-input-road"
            className="dg-mono block text-[10px] text-[#080909]"
          >
            Road width (m)
          </label>
          <input
            id="plot-input-road"
            type="number"
            min={3}
            max={60}
            step={0.5}
            value={roadWidthM}
            onChange={(e) => setRoadWidthM(Number(e.target.value) || 15)}
            className="mt-1 w-full border border-[#080909] bg-[#f5f3ed] px-2.5 py-1.5 font-mono text-xs text-[#080909]"
          />
        </div>
        <div>
          <label
            htmlFor="plot-input-zone"
            className="dg-mono block text-[10px] text-[#080909]"
          >
            Land-use zone {hasMapZone ? "(from map)" : "(user-selected)"}
          </label>
          <select
            id="plot-input-zone"
            value={effectiveZoneCode}
            onChange={(e) => {
              const nextCode = e.target.value;
              setFallbackZoneCode(nextCode);
              onSelectZone?.(nextCode);
            }}
            className="mt-1 w-full border border-[#080909] bg-[#f5f3ed] px-2.5 py-1.5 font-mono text-xs text-[#080909]"
          >
            {ZONE_OPTIONS.map((z) => (
              <option key={z.code} value={z.code}>
                {z.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <details className="mt-2 border-b border-[#c8ccc0] pb-2">
        <summary className="cursor-pointer font-mono text-[10.5px] uppercase tracking-[0.12em] text-[#5b5e56]">
          Optional plot inputs (depth, width, height, use)
        </summary>
        <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div>
            <label
              htmlFor="plot-input-depth"
              className="dg-mono block text-[10px] text-[#080909]"
            >
              Plot depth (m)
            </label>
            <input
              id="plot-input-depth"
              type="number"
              min={3}
              max={200}
              value={plotDepthM}
              onChange={(e) => setPlotDepthM(Number(e.target.value) || 30)}
              className="mt-1 w-full border border-[#080909] bg-[#f5f3ed] px-2 py-1 font-mono text-xs text-[#080909]"
            />
          </div>
          <div>
            <label
              htmlFor="plot-input-width"
              className="dg-mono block text-[10px] text-[#080909]"
            >
              Plot width (m)
            </label>
            <input
              id="plot-input-width"
              type="number"
              min={3}
              max={200}
              value={plotWidthM}
              onChange={(e) => setPlotWidthM(Number(e.target.value) || 20)}
              className="mt-1 w-full border border-[#080909] bg-[#f5f3ed] px-2 py-1 font-mono text-xs text-[#080909]"
            />
          </div>
          <div>
            <label
              htmlFor="plot-input-height"
              className="dg-mono block text-[10px] text-[#080909]"
            >
              Building height (m)
            </label>
            <input
              id="plot-input-height"
              type="number"
              min={3}
              max={100}
              step={0.5}
              value={buildingHeightM}
              onChange={(e) =>
                setBuildingHeightM(Number(e.target.value) || 11.5)
              }
              className="mt-1 w-full border border-[#080909] bg-[#f5f3ed] px-2 py-1 font-mono text-xs text-[#080909]"
            />
          </div>
          <div>
            <label
              htmlFor="plot-input-use"
              className="dg-mono block text-[10px] text-[#080909]"
            >
              Building use
            </label>
            <select
              id="plot-input-use"
              value={useCategory}
              onChange={(e) => setUseCategory(e.target.value)}
              className="mt-1 w-full border border-[#080909] bg-[#f5f3ed] px-2 py-1 font-mono text-xs text-[#080909]"
            >
              <option value="residential">Residential</option>
              <option value="commercial">Commercial</option>
              <option value="industrial">Industrial</option>
              <option value="public_semi_public">Public &amp; Semi-Public</option>
            </select>
          </div>
        </div>
      </details>

      {/* Resolved Answers */}
      {!resolution ? (
        <p className="mt-3 text-xs text-[#5b5e56]">
          Parameter dataset not available for this jurisdiction.
        </p>
      ) : (
        <div className="mt-3 divide-y divide-[#c8ccc0]">
          {PARAMETER_ORDER.map((paramKey) => {
            const outcome: ResolvedParameterOutcome =
              resolution.parameters[paramKey];
            if (!outcome || outcome.status === "no_applicable_rule") {
              return null;
            }
            const gov = outcome.governing_record;
            const src = gov?.source;
            const label = PARAMETER_LABELS[paramKey];

            return (
              <div key={paramKey} className="py-2.5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-mono text-xs font-semibold uppercase tracking-[0.08em] text-[#080909]">
                    {label}
                  </span>
                  <span className="font-mono text-sm font-bold text-[#080909]">
                    {outcome.display_value}
                  </span>
                </div>

                {outcome.status === "not_settled" ? (
                  <div className="mt-1.5 space-y-1.5 border-l-2 border-[#080909] bg-[#efeee8] p-2 text-xs">
                    <div className="font-mono text-[10.5px] font-semibold text-[#080909]">
                      Not settled: two rules apply
                    </div>
                    {outcome.tied_records.map((tr) => (
                      <div
                        key={tr.parameter_id}
                        className="flex items-center justify-between gap-2"
                      >
                        <span>
                          <strong>{String(tr.value_text)}</strong> (
                          {tr.source.table_id ?? tr.source.doc_id})
                        </span>
                        <a
                          href={tr.source.page_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-[10.5px] underline"
                        >
                          p. {tr.source.page} ↗
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-1 space-y-1 text-xs text-[#5b5e56]">
                    <div className="dg-serif">
                      {outcome.resolution_step?.title ?? outcome.plain_reason}
                    </div>
                    <details
                      data-testid={`plot-answer-details-${paramKey}`}
                      className="pt-0.5"
                    >
                      <summary className="cursor-pointer font-mono text-[10px] uppercase tracking-[0.12em] text-[#080909] underline">
                        Details, source page &amp; other provisions
                      </summary>
                      <div className="mt-1.5 space-y-1.5 border-l-2 border-[#080909] bg-[#efeee8] px-3 py-2 text-xs text-[#171917]">
                        {src && (
                          <div>
                            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#5b5e56]">
                              Source table row:{" "}
                            </span>
                            <strong>{gov?.value_text}</strong>
                            {src.row_header ? ` (${src.row_header})` : ""}
                            {src.column_header ? ` · ${src.column_header}` : ""}
                            {src.table_id ? ` · ${src.table_id}` : ""}
                          </div>
                        )}
                        {gov?.conditions?.dependent &&
                          (gov.conditions.unexpressed_conditions?.length ?? 0) > 0 && (
                            <div>
                              <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#5b5e56]">
                                Depends on conditions:{" "}
                              </span>
                              <span>
                                {(
                                  gov.conditions.unexpressed_conditions ?? []
                                ).join(" ")}
                              </span>
                            </div>
                          )}
                        {outcome.resolution_step?.authority?.quote && (
                          <div className="dg-serif italic text-[#080909]">
                            &ldquo;{outcome.resolution_step.authority.quote}&rdquo;
                          </div>
                        )}
                        {src && (
                          <div className="flex flex-wrap items-center gap-3 font-mono text-[10.5px]">
                            <Link
                              href={`/j/${jurisdictionId}/documents/${src.doc_id}#node-${src.table_eid ?? src.eid}`}
                              className="text-[#080909] underline"
                            >
                              Read provision
                            </Link>
                            {src.page_link && src.page_link.startsWith("http") && (
                              <a
                                href={src.page_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#080909] underline"
                              >
                                Official PDF p. {src.page} ↗
                              </a>
                            )}
                            {src.archive_url &&
                              src.archive_url.startsWith("http") && (
                                <a
                                  href={`${src.archive_url}#page=${src.page}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[#5b5e56] underline hover:text-[#080909]"
                                >
                                  Archive p. {src.page} ↗
                                </a>
                              )}
                          </div>
                        )}
                        {outcome.other_applicable_records.length > 0 && (
                          <div className="border-t border-[#c8ccc0] pt-1.5">
                            <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#080909]">
                              Other provisions that also apply (
                              {outcome.other_applicable_records.length}):
                            </div>
                            <div className="mt-1 space-y-1">
                              {outcome.other_applicable_records
                                .slice(0, 3)
                                .map((alt, idx) => (
                                  <div
                                    key={idx}
                                    className="flex flex-wrap items-baseline justify-between gap-2"
                                  >
                                    <span>
                                      <strong>{alt.record.value_text}</strong> —{" "}
                                      {alt.reason_not_chosen}
                                    </span>
                                    {alt.record.source.page_link.startsWith(
                                      "http"
                                    ) && (
                                      <a
                                        href={alt.record.source.page_link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="font-mono text-[10px] underline"
                                      >
                                        p. {alt.record.source.page} ↗
                                      </a>
                                    )}
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </details>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Mandatory Derived-Work Confirmation Notice */}
      <p
        role="note"
        aria-label="Derived work confirmation notice"
        className="dg-serif mt-3 border-t border-[#080909] pt-2.5 text-xs text-[#171917]"
      >
        Worked out from the official documents by this site. Confirm with the
        planning authority or a qualified professional.
      </p>
    </section>
  );
}
