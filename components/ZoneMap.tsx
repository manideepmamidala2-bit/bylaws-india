"use client";

import React from "react";
import type { ZoneFeature } from "@/lib/data";

interface ZoneMapProps {
  zones: ZoneFeature[];
  selectedZoneCode: string | null;
  onSelectZone: (zoneCode: string) => void;
}

export function ZoneMap({
  zones,
  selectedZoneCode,
  onSelectZone,
}: ZoneMapProps) {
  const activeZones = zones.filter((feature) => !feature.properties.superseded_by);

  return (
    <section
      aria-label="Zoning map"
      className="flex h-full min-h-[360px] flex-col justify-between rounded-lg border border-slate-300 bg-slate-50 p-4"
    >
      <div>
        <h2 className="text-base font-semibold text-slate-900">
          Zoning Map Layer
        </h2>
        <p className="mt-1 text-xs text-slate-600">
          Select a zone polygon below to inspect applicable building bylaw clauses.
        </p>

        {activeZones.length === 0 ? (
          <p className="mt-6 text-sm text-slate-500">
            No zone polygons loaded for this jurisdiction release.
          </p>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {activeZones.map((feature) => {
              const { zone_id, record_id, zone_code, zone_label, verification } =
                feature.properties;
              const isSelected = selectedZoneCode === zone_code;
              return (
                <button
                  key={record_id ?? zone_id}
                  type="button"
                  onClick={() => onSelectZone(zone_code)}
                  className={`flex items-center justify-between rounded border px-3 py-2 text-left text-sm transition ${
                    isSelected
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-300 bg-white text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <span>
                    <strong className="font-mono">{zone_code}</strong>:{" "}
                    {zone_label}
                  </span>
                  <span className="ml-2 text-xs opacity-75">{verification}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <footer className="mt-4 border-t border-slate-200 pt-2 text-xs text-slate-500">
        Base map attribution: © OpenStreetMap contributors (ODbL).
      </footer>
    </section>
  );
}
