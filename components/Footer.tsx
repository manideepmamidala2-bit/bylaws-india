"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface FooterProps {
  jurisdictionId?: string;
}

export function Footer({ jurisdictionId }: FooterProps) {
  let pathname: string | null = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    pathname = usePathname();
  } catch {
    pathname = null;
  }

  const matchedJur = pathname ? /^\/j\/([^/]+)/.exec(pathname)?.[1] : null;
  const bodyDefaultJur =
    typeof document !== "undefined"
      ? document.body?.dataset?.defaultJurisdiction || ""
      : "";
  const targetJurId = matchedJur || jurisdictionId || bodyDefaultJur || "";
  const prefix = targetJurId ? `/j/${targetJurId}` : "";

  const footerLinks = [
    { label: "Sources", href: prefix ? `${prefix}/sources` : "/data" },
    { label: "Map", href: prefix || "/data" },
    { label: "Data and downloads", href: "/data" },
    { label: "Licence", href: "/about#licence" },
    { label: "How this is built", href: "/about#how-this-is-built" },
  ];

  return (
    <footer
      role="contentinfo"
      className="mt-16 border-t border-[#c8ccc0] bg-[#f5f3ed] px-5 py-10 text-[#080909]"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <div className="text-base font-semibold tracking-tight text-[#080909]">
            Bylaw One
          </div>
          <p className="text-sm text-[#5b5e56]">
            Worked out from the official documents. Not an official publication.
          </p>
        </div>

        <nav
          aria-label="Footer navigation"
          className="flex flex-wrap items-center gap-x-6 gap-y-1"
        >
          {footerLinks.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="inline-flex min-h-[44px] items-center font-mono text-xs uppercase tracking-[0.12em] text-[#080909] underline decoration-[#c8ccc0] underline-offset-4 hover:decoration-[#080909]"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
