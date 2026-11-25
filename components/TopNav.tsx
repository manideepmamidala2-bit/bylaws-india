import React from "react";
import Link from "next/link";

export type NavSection =
  | "home"
  | "map"
  | "sources"
  | "documents"
  | "topics"
  | "timeline"
  | "review"
  | "structure"
  | "data"
  | "about";

interface TopNavProps {
  jurisdictionId?: string;
  jurisdictionName?: string;
  active: NavSection;
  releaseVersion?: string;
  licence?: string;
}

export function TopNav({
  jurisdictionId,
  jurisdictionName,
  active,
  releaseVersion,
  licence = "CC BY 4.0",
}: TopNavProps) {
  const jId = jurisdictionId;

  const navItems: Array<{ key: NavSection; label: string; href: string }> = jId
    ? [
        { key: "map", label: "Map", href: `/j/${jId}` },
        { key: "sources", label: "Sources", href: `/j/${jId}/sources` },
        { key: "documents", label: "Documents", href: `/j/${jId}/clauses` },
        { key: "topics", label: "Topics", href: `/j/${jId}/topics` },
        { key: "timeline", label: "Timeline", href: `/j/${jId}/timeline` },
        { key: "review", label: "Review", href: `/j/${jId}/review` },
        { key: "structure", label: "Structure", href: "/structure" },
        { key: "data", label: "Data", href: "/data" },
        { key: "about", label: "About", href: "/about" },
      ]
    : [
        { key: "home", label: "Overview", href: "/" },
        { key: "structure", label: "Structure", href: "/structure" },
        { key: "data", label: "Data", href: "/data" },
        { key: "about", label: "About", href: "/about" },
      ];

  return (
    <header
      className="flex flex-wrap items-center justify-between gap-4 border-b border-[#080909] bg-[#f5f3ed] px-6 py-3"
      role="banner"
    >
      <div className="flex items-center gap-4">
        <Link
          href="/"
          className="font-mono text-[11px] font-medium uppercase tracking-[0.15em] text-[#080909] no-underline"
        >
          Structured Building Bylaws
        </Link>
        {jurisdictionName && (
          <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-[#5b5e56]">
            / {jurisdictionName}
          </span>
        )}
      </div>

      <nav aria-label="Primary navigation" className="flex flex-wrap items-center gap-6">
        {navItems.map((item) => {
          const isCurrent = active === item.key;
          return (
            <Link
              key={item.key}
              href={item.href}
              aria-current={isCurrent ? "page" : undefined}
              className={`font-mono text-[11px] uppercase tracking-[0.14em] no-underline ${
                isCurrent
                  ? "border-b border-[#080909] pb-0.5 font-medium text-[#080909]"
                  : "text-[#5b5e56] hover:text-[#080909]"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-[#5b5e56]">
        {releaseVersion ? `Release ${releaseVersion} · ${licence}` : licence}
      </div>
    </header>
  );
}
