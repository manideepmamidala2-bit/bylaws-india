"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { fetchManifest, type ReleaseManifest } from "@/lib/data";

export default function JurisdictionPickerPage() {
  const [manifest, setManifest] = useState<ReleaseManifest | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchManifest()
      .then((loaded) => {
        if (!cancelled) {
          setManifest(loaded);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load manifest"
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <header className="border-b border-slate-200 pb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Structured Building Bylaws
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Choose a published jurisdiction dataset below to inspect its zoning map,
          applicable building bylaw clauses, and source PDF citations.
        </p>
      </header>

      {error && (
        <div
          role="alert"
          className="mt-6 rounded border border-rose-300 bg-rose-50 p-4 text-sm text-rose-900"
        >
          {error}
        </div>
      )}

      {!manifest && !error && (
        <p className="mt-6 text-sm text-slate-500">
          Loading published jurisdictions from manifest...
        </p>
      )}

      {manifest && (
        <section aria-label="Available jurisdictions" className="mt-6">
          {manifest.jurisdictions.length === 0 ? (
            <p className="text-sm text-slate-500">
              No jurisdictions published in manifest.
            </p>
          ) : (
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {manifest.jurisdictions.map((item) => (
                <li
                  key={item.id}
                  className="rounded-lg border border-slate-300 bg-white p-5 shadow-xs"
                >
                  <div className="flex items-baseline justify-between">
                    <h2 className="text-base font-semibold text-slate-900">
                      {item.name}
                    </h2>
                    <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-700">
                      v{item.latest_release}
                    </span>
                  </div>
                  <p className="mt-1 font-mono text-xs text-slate-500">
                    ID: {item.id}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3 text-sm font-medium">
                    <Link
                      href={`/j/${item.id}`}
                      className="rounded bg-slate-900 px-3 py-1.5 text-white hover:bg-slate-800"
                    >
                      Open Map &amp; Clauses
                    </Link>
                    <Link
                      href={`/j/${item.id}/clauses`}
                      className="rounded border border-slate-300 px-3 py-1.5 text-slate-700 hover:bg-slate-100"
                    >
                      Browse Clause Tree
                    </Link>
                    <Link
                      href={`/j/${item.id}/review`}
                      className="rounded border border-slate-300 px-3 py-1.5 text-slate-700 hover:bg-slate-100"
                    >
                      Map Review
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </main>
  );
}
