"use client";

import React, { use, useState } from "react";
import Link from "next/link";
import { ZoneMap } from "@/components/ZoneMap";
import { ClausePanel } from "@/components/ClausePanel";

interface JurisdictionMapPageProps {
  params: Promise<{ id: string }>;
}

export default function JurisdictionMapPage({
  params,
}: JurisdictionMapPageProps) {
  const { id } = use(params);
  const [selectedZoneCode, setSelectedZoneCode] = useState<string | null>(null);
  const [showDrafts, setShowDrafts] = useState(false);

  return (
    <div className="flex min-h-screen flex-col">
      <div
        role="region"
        aria-label="Prototype disclaimer"
        className="border-b border-amber-300 bg-amber-50 px-6 py-2.5 text-xs font-medium text-amber-950"
      >
        Prototype. Zone boundaries are approximate and traced from scanned maps.
        Confirm with the planning authority.
      </div>

      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white px-6 py-4">
        <div>
          <Link href="/" className="text-xs font-medium text-slate-500 underline">
            ← All Jurisdictions
          </Link>
          <h1 className="mt-0.5 text-lg font-bold text-slate-900">
            Jurisdiction: <span className="font-mono">{id}</span>
          </h1>
        </div>

        <div className="flex items-center gap-4 text-sm">
          <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
            <input
              type="checkbox"
              checked={showDrafts}
              onChange={(e) => setShowDrafts(e.target.checked)}
            />
            Show draft documents
          </label>
          <Link
            href={`/j/${id}/clauses`}
            className="rounded border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
          >
            Clause Browser
          </Link>
          <Link
            href={`/j/${id}/review`}
            className="rounded border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
          >
            Map Review
          </Link>
        </div>
      </header>

      <main className="grid flex-1 grid-cols-1 gap-4 p-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ZoneMap
            zones={[]}
            selectedZoneCode={selectedZoneCode}
            onSelectZone={setSelectedZoneCode}
          />
        </div>
        <div>
          <ClausePanel
            selectedZoneCode={selectedZoneCode}
            clauses={[]}
            showDrafts={showDrafts}
          />
        </div>
      </main>
    </div>
  );
}
