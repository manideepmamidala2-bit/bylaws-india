"use client";

import React, { useState } from "react";
import type { GeoLayerEntry, ZoneFeature } from "@/lib/data";

interface ReviewPanelProps {
  zones: ZoneFeature[];
  geoLayers?: GeoLayerEntry[];
}

export function ReviewPanel({ zones, geoLayers = [] }: ReviewPanelProps) {
  const [opacity, setOpacity] = useState(65);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(
    zones[0]?.properties.zone_id ?? null
  );

  const activeZones = zones.filter(
    (z) => !z.properties.superseded_by && !z.properties.record_superseded_by
  );
  const displayZones = activeZones.length > 0 ? activeZones : zones;
  const selectedFeature =
    displayZones.find((z) => z.properties.zone_id === selectedZoneId) ??
    displayZones[0] ??
    null;

  const yamlSnippet = selectedFeature
    ? `schema_version: "1.2"\nzone_fixes:\n  - zone_id: ${selectedFeature.properties.zone_id}\n    reason: Verified polygon boundary and legend code against source sheet\n    set:\n      zone_code: ${selectedFeature.properties.zone_code}\n      zone_label: "${selectedFeature.properties.zone_label}"\n      verification: machine_checked\n`
    : "";

  return (
    <section
      aria-label="Map review panel"
      className="space-y-6 border border-[#080909] bg-[#f5f3ed] p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#c8ccc0] pb-4">
        <div>
          <div className="dg-mono">
            Source Sheet vs. Extracted Zones · {displayZones.length} Active
            Polygon(s)
          </div>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-[#080909]">
            Georeferenced Sheet &amp; Zone Overlay Inspector
          </h2>
          <p className="dg-serif mt-1 text-sm text-[#5b5e56]">
            Inspect source sheet provenance, adjust overlay opacity, and export
            YAML overrides.
          </p>
        </div>

        <div className="flex items-center gap-3 border border-[#080909] bg-[#efeee8] px-3 py-2">
          <label
            htmlFor="overlay-opacity"
            className="font-mono text-[11px] uppercase tracking-[0.12em] text-[#080909]"
          >
            Overlay opacity: {opacity}%
          </label>
          <input
            id="overlay-opacity"
            type="range"
            min={0}
            max={100}
            value={opacity}
            onChange={(e) => setOpacity(Number(e.target.value))}
          />
        </div>
      </div>

      {geoLayers.length > 0 && (
        <div className="overflow-x-auto">
          <div className="dg-mono mb-2">Registered Geospatial Layers</div>
          <table className="dg-table">
            <thead>
              <tr>
                <th>Layer ID</th>
                <th>Kind</th>
                <th>Method</th>
                <th>Accuracy (m)</th>
                <th>Derived</th>
                <th>Features</th>
              </tr>
            </thead>
            <tbody>
              {geoLayers.map((lyr) => (
                <tr key={lyr.layer_id}>
                  <td className="font-mono text-xs">{lyr.layer_id}</td>
                  <td className="font-mono text-xs">{lyr.kind}</td>
                  <td>{lyr.method}</td>
                  <td className="font-mono text-xs">
                    {lyr.accuracy_m !== null
                      ? `±${lyr.accuracy_m} m`
                      : "Not measured"}
                  </td>
                  <td className="font-mono text-xs">
                    {lyr.derived ? "Yes (Derived)" : "Official"}
                  </td>
                  <td className="font-mono text-xs">
                    {lyr.feature_count ?? "0"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {displayZones.length === 0 ? (
        <p className="py-4 text-sm text-[#5b5e56]">
          No zones available for review.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="max-h-[420px] divide-y divide-[#c8ccc0] overflow-y-auto border border-[#080909]">
            {displayZones.map((zone) => {
              const props = zone.properties;
              const isSelected =
                selectedFeature?.properties.zone_id === props.zone_id;
              const versionNum = props.record_version ?? 1;
              return (
                <button
                  key={props.record_id ?? props.zone_id}
                  type="button"
                  onClick={() => setSelectedZoneId(props.zone_id)}
                  className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm ${
                    isSelected
                      ? "dg-selected-row font-semibold"
                      : "bg-[#f5f3ed] hover:bg-[#efeee8]"
                  }`}
                >
                  <div>
                    <div className="font-mono text-xs text-[#080909]">
                      {props.zone_code} · {props.zone_id}
                      {versionNum > 1 ? ` · v${versionNum}` : ""}
                    </div>
                    <div className="dg-serif text-sm text-[#171917]">
                      {props.zone_label}
                    </div>
                    <div className="font-mono text-[10px] text-[#5b5e56]">
                      {props.planning_district
                        ? `District ${props.planning_district} · `
                        : ""}
                      {props.sheet ? `${props.sheet} · ` : ""}
                      {Math.round(props.area_sq_m).toLocaleString()} sq.m
                    </div>
                  </div>
                  <span className="border border-[#080909] px-1.5 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.12em] text-[#080909]">
                    {props.verification}
                  </span>
                </button>
              );
            })}
          </div>

          {selectedFeature && (
            <div className="space-y-4 border border-[#080909] bg-[#efeee8] p-4">
              <div className="dg-mono">
                Selected Zone Provenance · Overlay Opacity {opacity}%
              </div>
              <dl className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <dt className="dg-mono text-[10px]">Record ID</dt>
                  <dd className="font-mono text-[#080909]">
                    {selectedFeature.properties.record_id}
                  </dd>
                </div>
                <div>
                  <dt className="dg-mono text-[10px]">Extraction Method</dt>
                  <dd className="font-mono text-[#080909]">
                    {selectedFeature.properties.extraction_method}
                  </dd>
                </div>
                <div>
                  <dt className="dg-mono text-[10px]">Source Map</dt>
                  <dd className="font-mono text-[#080909]">
                    {selectedFeature.properties.source_map}
                  </dd>
                </div>
                <div>
                  <dt className="dg-mono text-[10px]">Georef Run</dt>
                  <dd className="font-mono text-[#080909]">
                    {selectedFeature.properties.georef_run}
                  </dd>
                </div>
              </dl>

              <div>
                <div className="dg-mono mb-1 text-[10px]">
                  Override YAML Snippet
                </div>
                <pre className="overflow-x-auto border border-[#080909] bg-[#f5f3ed] p-3 font-mono text-xs text-[#080909]">
                  {yamlSnippet}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
