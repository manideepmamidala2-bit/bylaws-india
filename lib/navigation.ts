/**
 * Single navigation configuration driving both Header (`components/TopNav.tsx`)
 * and Footer (`components/Footer.tsx`).
 *
 * Invariant (Part 1.2 & Part 1.8):
 * - Header: The code, Map, What changed, About.
 * - Footer: Guide, Pilot, How we check, Use with AI, Join, Press, Sources, Data and downloads, Licence.
 * - No destination (`href`) appears in both header and footer.
 */

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
  | "about"
  | "guide";

export interface HeaderNavItem {
  key: "code" | "map" | "changed" | "about";
  label: string;
  href: string;
  isCurrent: boolean;
}

export interface FooterNavItem {
  key:
    | "guide"
    | "pilot"
    | "checks"
    | "use-with-ai"
    | "join"
    | "press"
    | "sources"
    | "data"
    | "licence";
  label: string;
  href: string;
}

export const HEADER_NAV_DEFINITIONS: ReadonlyArray<{
  key: HeaderNavItem["key"];
  label: string;
  buildHref: (prefix: string) => string;
  matchesActive: (active: NavSection) => boolean;
}> = [
  {
    key: "code",
    label: "The code",
    buildHref: (prefix) => (prefix ? `${prefix}/topics` : "/j"),
    matchesActive: (active) => active === "topics" || active === "documents",
  },
  {
    key: "map",
    label: "Map",
    buildHref: (prefix) => prefix || "/j",
    matchesActive: (active) => active === "map",
  },
  {
    key: "changed",
    label: "What changed",
    buildHref: (prefix) => (prefix ? `${prefix}/timeline` : "/j"),
    matchesActive: (active) => active === "timeline",
  },
  {
    key: "about",
    label: "About",
    buildHref: () => "/about",
    matchesActive: (active) => active === "about" || active === "structure",
  },
];

export const FOOTER_NAV_DEFINITIONS: ReadonlyArray<{
  key: FooterNavItem["key"];
  label: string;
  buildHref: (prefix: string) => string;
}> = [
  {
    key: "guide",
    label: "Guide",
    buildHref: () => "/guide",
  },
  {
    key: "pilot",
    label: "Pilot",
    buildHref: () => "/pilot",
  },
  {
    key: "checks",
    label: "How we check",
    buildHref: () => "/checks",
  },
  {
    key: "use-with-ai",
    label: "Use with AI",
    buildHref: () => "/use-with-ai",
  },
  {
    key: "join",
    label: "Join",
    buildHref: () => "/join",
  },
  {
    key: "press",
    label: "Press",
    buildHref: () => "/press",
  },
  {
    key: "sources",
    label: "Sources",
    buildHref: (prefix) => (prefix ? `${prefix}/sources` : "/sources"),
  },
  {
    key: "data",
    label: "Data and downloads",
    buildHref: () => "/data",
  },
  {
    key: "licence",
    label: "Licence",
    buildHref: () => "/about#licence",
  },
];

export function getHeaderNavItems(
  jurisdictionId: string | undefined,
  active: NavSection
): HeaderNavItem[] {
  const targetJurId = (jurisdictionId ?? "").trim();
  const prefix = targetJurId ? `/j/${targetJurId}` : "";
  return HEADER_NAV_DEFINITIONS.map((def) => ({
    key: def.key,
    label: def.label,
    href: def.buildHref(prefix),
    isCurrent: def.matchesActive(active),
  }));
}

export function getFooterNavItems(
  jurisdictionId: string | undefined
): FooterNavItem[] {
  const targetJurId = (jurisdictionId ?? "").trim();
  const prefix = targetJurId ? `/j/${targetJurId}` : "";
  return FOOTER_NAV_DEFINITIONS.map((def) => ({
    key: def.key,
    label: def.label,
    href: def.buildHref(prefix),
  }));
}
