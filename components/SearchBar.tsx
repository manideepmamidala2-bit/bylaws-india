"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";

interface SearchRecord {
  id: string;
  j: string;
  d: string;
  dt: string;
  n: string;
  h: string;
  s: string;
  p: number;
  u: string;
  pu: string;
}

export function SearchBar({ jurisdictionId }: { jurisdictionId?: string }) {
  const [query, setQuery] = useState("");
  const [records, setRecords] = useState<SearchRecord[] | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (ev: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(ev.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function ensureIndexLoaded() {
    if (records !== null) return;
    try {
      const res = await fetch("/pagefind/index.json");
      if (!res.ok) {
        setRecords([]);
        return;
      }
      const payload = (await res.json()) as { records?: SearchRecord[] };
      setRecords(payload.records ?? []);
    } catch {
      setRecords([]);
    }
  }

  const trimmed = query.trim().toLowerCase();
  const terms = trimmed.split(/\s+/).filter(Boolean);

  const matches: SearchRecord[] = React.useMemo(() => {
    if (!records || terms.length === 0) return [];
    const scored: Array<{ rec: SearchRecord; score: number }> = [];
    for (const rec of records) {
      const hay = `${rec.n} ${rec.h} ${rec.s} ${rec.dt}`.toLowerCase();
      let allMatch = true;
      let score = 0;
      for (const t of terms) {
        if (!hay.includes(t)) {
          allMatch = false;
          break;
        }
        if (rec.n.toLowerCase() === t) score += 10;
        if (rec.h.toLowerCase().includes(t)) score += 4;
        score += 1;
      }
      if (allMatch) {
        scored.push({ rec, score });
      }
    }
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 10).map((x) => x.rec);
  }, [records, terms]);

  return (
    <div ref={containerRef} className="relative min-w-[210px] max-w-xs flex-1">
      <label htmlFor="global-pagefind-search" className="sr-only">
        Search across all building code documents
      </label>
      <input
        id="global-pagefind-search"
        type="search"
        value={query}
        onFocus={() => {
          setIsOpen(true);
          void ensureIndexLoaded();
        }}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
          void ensureIndexLoaded();
        }}
        placeholder="Search all documents (FAR, setback, parking...)"
        className="w-full border border-[#080909] bg-[#f5f3ed] px-2.5 py-1 font-mono text-xs text-[#080909] placeholder:text-[#5b5e56]"
      />
      {isOpen && terms.length > 0 && (
        <div
          role="region"
          aria-label="Cross-document search results"
          className="absolute right-0 z-50 mt-1 max-h-96 w-[360px] overflow-y-auto border border-[#080909] bg-[#f5f3ed] p-2 shadow-lg sm:w-[440px]"
        >
          <div className="mb-1.5 flex items-center justify-between border-b border-[#c8ccc0] pb-1 font-mono text-[10px] uppercase tracking-[0.12em] text-[#5b5e56]">
            <span>Pagefind Cross-Document Index</span>
            <span>{matches.length} result(s)</span>
          </div>
          {matches.length === 0 ? (
            <p className="py-2 font-mono text-xs text-[#5b5e56]">
              No matching provisions found for &ldquo;{query}&rdquo;.
            </p>
          ) : (
            <ul className="divide-y divide-[#c8ccc0]">
              {matches.map((m) => {
                const targetUrl = jurisdictionId
                  ? `/j/${jurisdictionId}/documents/${m.d}#node-${m.id.split(":")[1] ?? ""}`
                  : m.u;
                return (
                  <li key={m.id} className="py-2">
                    <div className="flex items-baseline justify-between gap-2">
                      <Link
                        href={targetUrl}
                        onClick={() => setIsOpen(false)}
                        className="font-mono text-xs font-semibold text-[#080909] underline"
                      >
                        {m.n} {m.h ? `· ${m.h}` : ""}
                      </Link>
                      {m.pu && (
                        <a
                          href={m.pu}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 font-mono text-[10px] text-[#5b5e56] underline"
                        >
                          p. {m.p} ↗
                        </a>
                      )}
                    </div>
                    <div className="font-mono text-[10px] text-[#5b5e56]">
                      {m.dt}
                    </div>
                    <p className="dg-serif mt-0.5 line-clamp-2 text-xs text-[#171917]">
                      {m.s}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
