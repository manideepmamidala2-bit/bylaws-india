"use client";

import React, { useState } from "react";
import type { ZoneFeature } from "@/lib/data";

interface ReviewPanelProps {
  zones: ZoneFeature[];
}

export function ReviewPanel({ zones }: ReviewPanelProps) {
  const [opacity, setOpacity] = useState(50);

  return (
    <section
      aria-label="Map review panel"
      className="space-y-4 rounded-lg border border-slate-300 bg-white p-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Source Map vs. Traced Zones Review
          </h2>
          <p className="text-xs text-slate-600">
            Compare the georeferenced source map against traced zone polygons and export YAML overrides.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <label htmlFor="overlay-opacity" className="font-medium text-slate-700">
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

      <div className="divide-y divide-slate-200 border-t border-slate-200 pt-2 text-sm">
        {zones.length === 0 ? (
          <p className="py-4 text-slate-500">No zones available for review.</p>
        ) : (
          zones.map((zone) => (
            <div
              key={zone.properties.zone_id}
              className="flex items-center justify-between py-2"
            >
              <span>
                <strong className="font-mono">{zone.properties.zone_code}</strong>{" "}
                ({zone.properties.zone_id}) — {zone.properties.zone_label}
              </span>
              <span className="rounded bg-slate-100 px-2 py-0.5 text-xs">
                {zone.properties.verification}
              </span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
