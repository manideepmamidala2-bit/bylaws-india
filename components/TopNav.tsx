"use client";

import React, { useState } from "react";
import Link from "next/link";
import { SearchBar } from "./SearchBar";

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

export function TopNav({ jurisdictionId, active }: TopNavProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const targetJurId = jurisdictionId ?? "";
  const prefix = targetJurId ? `/j/${targetJurId}` : "";

  const navItems: Array<{
    key: "code" | "changed" | "about";
    label: string;
    href: string;
    isCurrent: boolean;
  }> = [
    {
      key: "code",
      label: "The code",
      href: prefix ? `${prefix}/topics` : "/data",
      isCurrent: active === "topics" || active === "documents",
    },
    {
      key: "changed",
      label: "What changed",
      href: prefix ? `${prefix}/timeline` : "/data",
      isCurrent: active === "timeline",
    },
    {
      key: "about",
      label: "About",
      href: "/about",
      isCurrent: active === "about" || active === "structure",
    },
  ];

  return (
    <header
      className="border-b border-[#c8ccc0] bg-[#f5f3ed] text-[#080909]"
      role="banner"
    >
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-2.5">
        <Link
          href="/"
          className="inline-flex min-h-[44px] items-center text-lg font-semibold tracking-tight text-[#080909] no-underline"
        >
          Bylaw One
        </Link>

        <div className="flex items-center gap-2 md:gap-6">
          <nav
            aria-label="Primary navigation"
            className="hidden items-center gap-7 md:flex"
          >
            {navItems.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                aria-current={item.isCurrent ? "page" : undefined}
                className={`inline-flex min-h-[44px] items-center font-mono text-xs uppercase tracking-[0.12em] no-underline ${
                  item.isCurrent
                    ? "border-b-2 border-[#ff6b52] font-medium text-[#080909]"
                    : "text-[#5b5e56] hover:text-[#080909]"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <button
            type="button"
            data-testid="header-search-toggle"
            aria-label="Search all documents"
            aria-expanded={searchOpen}
            onClick={() => setSearchOpen((prev) => !prev)}
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center border border-transparent text-[#080909] hover:border-[#c8ccc0] hover:bg-[#efeee8]"
          >
            <svg
              aria-hidden="true"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="square"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3.5-3.5" />
            </svg>
          </button>

          <button
            type="button"
            data-testid="header-menu-toggle"
            aria-label="Menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((prev) => !prev)}
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center border border-[#c8ccc0] bg-[#f5f3ed] font-mono text-[11px] uppercase tracking-[0.12em] text-[#080909] md:hidden"
          >
            {menuOpen ? "Close" : "Menu"}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav
          aria-label="Mobile navigation"
          data-testid="mobile-nav-menu"
          className="border-t border-[#c8ccc0] bg-[#efeee8] px-5 py-2 md:hidden"
        >
          <ul className="divide-y divide-[#c8ccc0]">
            {navItems.map((item) => (
              <li key={item.key}>
                <Link
                  href={item.href}
                  aria-current={item.isCurrent ? "page" : undefined}
                  onClick={() => setMenuOpen(false)}
                  className={`flex min-h-[44px] items-center font-mono text-xs uppercase tracking-[0.12em] no-underline ${
                    item.isCurrent
                      ? "border-l-2 border-[#ff6b52] pl-3 font-medium text-[#080909]"
                      : "text-[#080909]"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}

      {searchOpen && (
        <div
          data-testid="header-search-panel"
          className="border-t border-[#c8ccc0] bg-[#efeee8] px-5 py-3"
        >
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
            <SearchBar jurisdictionId={targetJurId} autoFocus />
            <button
              type="button"
              onClick={() => setSearchOpen(false)}
              className="inline-flex min-h-[44px] items-center px-3 font-mono text-xs uppercase tracking-[0.12em] text-[#5b5e56] hover:text-[#080909]"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
