import React from "react";
import Link from "next/link";

export interface CorporationOption {
  id: string;
  name: string;
}

export function formatPlainCorporationName(
  jurisdictionId: string,
  fallbackName?: string
): string {
  if (fallbackName) {
    return fallbackName.replace(/\s*\(GBA Area\)\s*/i, "").trim();
  }
  return jurisdictionId;
}

interface CorporationSelectorProps {
  currentId: string;
  currentName?: string;
  pathSuffix: string;
  corporations?: ReadonlyArray<CorporationOption>;
}

export function CorporationSelector({
  currentId,
  currentName,
  pathSuffix,
  corporations = [],
}: CorporationSelectorProps) {
  const activeLabel = formatPlainCorporationName(currentId, currentName);
  const options =
    corporations.length > 0
      ? corporations
      : [{ id: currentId, name: activeLabel }];

  return (
    <div
      data-testid="corporation-selector"
      className="mt-3 text-xs text-[#5b5e56]"
    >
      <details className="group inline-block">
        <summary className="inline-flex min-h-[44px] cursor-pointer list-none items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-[#5b5e56] hover:text-[#080909]">
          <span>Showing:</span>
          <strong className="font-medium text-[#080909]">{activeLabel}</strong>
          <span aria-hidden="true">·</span>
          <span className="underline decoration-[#c8ccc0] underline-offset-4 group-hover:decoration-[#080909]">
            Change
          </span>
        </summary>
        <div
          role="region"
          aria-label="Choose corporation"
          className="mt-1 flex flex-wrap gap-1.5 border border-[#c8ccc0] bg-[#efeee8] p-2"
        >
          {options.map((corp) => {
            const isCurrent = corp.id === currentId;
            const plainName = formatPlainCorporationName(corp.id, corp.name);
            return (
              <Link
                key={corp.id}
                href={`/j/${corp.id}${pathSuffix}`}
                aria-current={isCurrent ? "page" : undefined}
                className={
                  isCurrent
                    ? "inline-flex min-h-[44px] items-center border-l-2 border-[#ff6b52] bg-[#f5f3ed] px-3 py-1.5 font-mono text-[11px] font-medium text-[#080909] no-underline"
                    : "inline-flex min-h-[44px] items-center border border-[#c8ccc0] bg-[#f5f3ed] px-3 py-1.5 font-mono text-[11px] text-[#080909] no-underline hover:bg-[#e5e6de]"
                }
              >
                {plainName}
              </Link>
            );
          })}
        </div>
      </details>
    </div>
  );
}
