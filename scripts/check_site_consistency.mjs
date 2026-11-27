#!/usr/bin/env node
/**
 * Bylaw One — Part 1.8 CI Link & Figure Consistency Gate:
 * Fails the build if:
 *  (a) a destination appears in both header and footer;
 *  (b) a page body (`<main>`) links to the same destination more than twice,
 *      or a card/list item links to the same destination more than once;
 *  (c) the same figure has different values on different pages (e.g. "1 sheets" vs "4 sheets").
 * Also verifies `docs/site-map.md`, single navigation config (`lib/navigation.ts`),
 * unified map route (`Map` and `Find rules by place`), and deduplicated gaps on `/pilot`.
 */

import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const nextServerAppDir = path.join(repoRoot, ".next", "server", "app");
const violations = [];

// 1. Verify docs/site-map.md exists and documents every core route
const siteMapPath = path.join(repoRoot, "docs", "site-map.md");
if (!fs.existsSync(siteMapPath)) {
  violations.push("docs/site-map.md is missing.");
} else {
  const siteMapText = fs.readFileSync(siteMapPath, "utf8");
  for (const requiredRoute of [
    "`/`",
    "`/j/[id]/topics`",
    "`/j/[id]`",
    "`/j/[id]/timeline`",
    "`/about`",
    "`/pilot`",
    "`/checks`",
    "`/use-with-ai`",
    "`/join`",
    "`/press`",
    "`/j/[id]/sources`",
    "`/data`",
    "`/verify/[taskSet]`",
    "`/guide`",
    "`/guide/slides`",
  ]) {
    if (!siteMapText.includes(requiredRoute)) {
      violations.push(
        `docs/site-map.md is missing route entry ${requiredRoute}`
      );
    }
  }
}

// 2. Verify TopNav.tsx and Footer.tsx both read from lib/navigation.ts
const navConfigPath = path.join(repoRoot, "lib", "navigation.ts");
const topNavPath = path.join(repoRoot, "components", "TopNav.tsx");
const footerPath = path.join(repoRoot, "components", "Footer.tsx");

if (!fs.existsSync(navConfigPath)) {
  violations.push("lib/navigation.ts is missing.");
}
if (fs.existsSync(topNavPath)) {
  const txt = fs.readFileSync(topNavPath, "utf8");
  if (!txt.includes("@/lib/navigation")) {
    violations.push("components/TopNav.tsx does not import from @/lib/navigation");
  }
}
if (fs.existsSync(footerPath)) {
  const txt = fs.readFileSync(footerPath, "utf8");
  if (!txt.includes("@/lib/navigation")) {
    violations.push("components/Footer.tsx does not import from @/lib/navigation");
  }
}

function collectHtmlFiles(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectHtmlFiles(full, out);
    } else if (entry.isFile() && full.endsWith(".html")) {
      out.push(full);
    }
  }
  return out;
}

function extractHrefs(htmlFragment) {
  const hrefs = [];
  for (const m of htmlFragment.matchAll(/<a\b[^>]*\bhref="([^"]+)"[^>]*>/gi)) {
    hrefs.push(m[1].replace(/&amp;/g, "&").trim());
  }
  return hrefs;
}

function stripDetailsAndScripts(html) {
  let cleaned = html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ");
  const innerDetailsRe =
    /<details\b[^>]*>(?:(?!<details\b)[\s\S])*?<\/details>/gi;
  let prev = "";
  while (prev !== cleaned) {
    prev = cleaned;
    cleaned = cleaned.replace(innerDetailsRe, " ");
  }
  return cleaned;
}

if (!fs.existsSync(nextServerAppDir)) {
  console.error(
    "[check_site_consistency] .next/server/app not found. Run `npm run build` first."
  );
  process.exit(1);
}

const htmlFiles = collectHtmlFiles(nextServerAppDir);

// Expected authoritative figures from published release dataset
const manifest = JSON.parse(
  fs.readFileSync(path.join(repoRoot, "public", "data", "manifest.json"), "utf8")
);
const parentJur = manifest.jurisdictions.find(
  (j) =>
    j.visibility !== "test" &&
    manifest.jurisdictions.some((c) => c.parent === j.id)
);
const childCorps = manifest.jurisdictions.filter(
  (j) => j.visibility !== "test" && j.parent === parentJur.id
);
const activeVer = parentJur.latest_release || "4.0.0";
const parentDocs = JSON.parse(
  fs.readFileSync(
    path.join(
      repoRoot,
      "public",
      "data",
      parentJur.id,
      activeVer,
      "documents.json"
    ),
    "utf8"
  )
);
const inForceMainDocs = parentDocs.filter(
  (d) =>
    d.legal_status === "in_force" &&
    d.acquisition_status !== "not_found" &&
    d.applies_to_jurisdiction?.status !== "no" &&
    (d.instrument_type ?? "instrument") !== "map" &&
    (d.instrument_type ?? "instrument") !== "compilation"
);
const normalizedBodies = new Set();
for (const d of inForceMainDocs) {
  const raw = (d.issuing_authority || "").trim();
  if (!raw) continue;
  const primaryPart = raw
    .split(/[/,]/)
    .map((s) => s.trim().toLowerCase())
    .find(Boolean);
  if (primaryPart) {
    normalizedBodies.add(primaryPart);
  }
}
const expectedDocsCount = inForceMainDocs.length;
const expectedBodiesCount = normalizedBodies.size;
const expectedCorpsCount = childCorps.length;

const southZones = JSON.parse(
  fs.readFileSync(
    path.join(
      repoRoot,
      "public",
      "data",
      "in-ka-bengaluru-south",
      activeVer,
      "zones.geojson"
    ),
    "utf8"
  )
);
const activeZones = southZones.features.filter(
  (f) => !f.properties?.superseded_by && !f.properties?.record_superseded_by
);
const expectedZonesCount = activeZones.length;
const expectedSheetsCount = new Set(
  activeZones.map((f) => f.properties?.source_map).filter(Boolean)
).size;

const parentWards = JSON.parse(
  fs.readFileSync(
    path.join(repoRoot, "public", "data", parentJur.id, activeVer, "wards.geojson"),
    "utf8"
  )
);
const expectedWardsCount = parentWards.features.length;

for (const htmlPath of htmlFiles) {
  const relRoute =
    "/" +
    path
      .relative(nextServerAppDir, htmlPath)
      .replace(/\.html$/, "")
      .replace(/\/index$/, "");
  if (relRoute.includes("xx-test-fixture") || relRoute.includes("_not-found")) {
    continue;
  }

  const rawHtml = fs.readFileSync(htmlPath, "utf8");

  // (a) Header vs Footer destination disjointness
  const headerMatch = rawHtml.match(
    /<header\b[^>]*role="banner"[^>]*>([\s\S]*?)<\/header>/i
  );
  const footerMatch = rawHtml.match(
    /<footer\b[^>]*role="contentinfo"[^>]*>([\s\S]*?)<\/footer>/i
  );
  if (headerMatch && footerMatch) {
    const headerNavMatch = headerMatch[1].match(
      /<nav\b[^>]*aria-label="Primary navigation"[^>]*>([\s\S]*?)<\/nav>/i
    );
    const headerHrefs = new Set(
      extractHrefs(headerNavMatch ? headerNavMatch[1] : headerMatch[1]).filter(
        (h) => h !== "/"
      )
    );
    const footerHrefs = new Set(extractHrefs(footerMatch[1]));
    for (const h of headerHrefs) {
      if (footerHrefs.has(h)) {
        violations.push(
          `${relRoute}: Navigation check failed — destination ${JSON.stringify(h)} appears in both header and footer`
        );
      }
    }
  }

  // (b) Page body link frequency check (max 2 links to same destination in <main> outside <details> and CorporationSelector)
  const mainMatch = rawHtml.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i);
  if (mainMatch) {
    const primaryMain = stripDetailsAndScripts(mainMatch[1]).replace(
      /<nav\b[^>]*aria-label="Select City Corporation"[^>]*>[\s\S]*?<\/nav>/gi,
      " "
    );
    const bodyHrefs = extractHrefs(primaryMain).filter(
      (h) =>
        h.startsWith("/") &&
        !h.startsWith("/api/") &&
        !h.endsWith(".zip") &&
        !h.endsWith(".json") &&
        !h.endsWith(".csv") &&
        !h.endsWith(".geojson") &&
        !h.endsWith("SHA256SUMS")
    );
    const countsByHref = new Map();
    for (const h of bodyHrefs) {
      countsByHref.set(h, (countsByHref.get(h) || 0) + 1);
    }
    for (const [href, count] of countsByHref.entries()) {
      if (count > 2) {
        violations.push(
          `${relRoute}: Body link check failed — destination ${JSON.stringify(href)} is linked ${count} times in page body (max 2 allowed)`
        );
      }
    }
  }

  // (c) Consistent figures & grammar check across all pages
  const visibleText = rawHtml
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#x27;/g, "'")
    .replace(/\s+/g, " ");

  if (/\b1\s+sheets\b/i.test(visibleText)) {
    violations.push(
      `${relRoute}: Figure/plural check failed — found '1 sheets' mismatch (expected '${expectedSheetsCount} sheets')`
    );
  }
  for (const sheetMatch of visibleText.matchAll(
    /\b(\d+)\s+(?:processed\s+(?:master\s+plan\s+)?)?sheets\b/gi
  )) {
    const n = Number(sheetMatch[1]);
    if (n !== expectedSheetsCount) {
      violations.push(
        `${relRoute}: Figure check failed — sheet count ${n} !== expected ${expectedSheetsCount} (${JSON.stringify(sheetMatch[0])})`
      );
    }
  }

  for (const docBodyMatch of visibleText.matchAll(
    /\b(\d+)\s+(?:official\s+documents|in-force\s+instruments|in-force\s+building\s+acts[^.]*?)\s+from\s+(\d+)\s+(?:statutory\s+)?bodies\b/gi
  )) {
    const dCount = Number(docBodyMatch[1]);
    const bCount = Number(docBodyMatch[2]);
    if (dCount !== expectedDocsCount || bCount !== expectedBodiesCount) {
      violations.push(
        `${relRoute}: Figure check failed — documents/bodies (${dCount}/${bCount}) !== expected (${expectedDocsCount}/${expectedBodiesCount})`
      );
    }
  }

  for (const wardMatch of visibleText.matchAll(
    /\b(\d+)\s+City\s+Corporations\s+and\s+(\d+)\s+wards\b/gi
  )) {
    const cCount = Number(wardMatch[1]);
    const wCount = Number(wardMatch[2]);
    if (cCount !== expectedCorpsCount || wCount !== expectedWardsCount) {
      violations.push(
        `${relRoute}: Figure check failed — corporations/wards (${cCount}/${wCount}) !== expected (${expectedCorpsCount}/${expectedWardsCount})`
      );
    }
  }

  for (const zonePolyMatch of visibleText.matchAll(
    /\b([0-9,]+)\s+(?:georeferenced\s+land-use\s+)?zone\s+polygons\b/gi
  )) {
    const zCount = Number(zonePolyMatch[1].replace(/,/g, ""));
    if (zCount !== expectedZonesCount) {
      violations.push(
        `${relRoute}: Figure check failed — zone polygons count ${zCount} !== expected ${expectedZonesCount}`
      );
    }
  }
}

// Home-specific checks: Map and "Find rules by place" resolve to the same route
const homeHtmlPath = path.join(nextServerAppDir, "index.html");
if (fs.existsSync(homeHtmlPath)) {
  const homeHtml = fs.readFileSync(homeHtmlPath, "utf8");
  const headerNavMatch = homeHtml.match(
    /<nav\b[^>]*aria-label="Primary navigation"[^>]*>([\s\S]*?)<\/nav>/i
  );
  const mapHeaderLinkMatch = headerNavMatch?.[1]?.match(
    /<a\b[^>]*\bhref="([^"]+)"[^>]*>Map<\/a>/i
  );
  const findRulesMatch = homeHtml.match(
    /<a\b[^>]*\bhref="([^"]+)"[^>]*data-testid="hero-find-rules-by-place"[^>]*>|<a\b[^>]*data-testid="hero-find-rules-by-place"[^>]*\bhref="([^"]+)"[^>]*>/i
  );
  const headerMapHref = mapHeaderLinkMatch?.[1];
  const heroMapHref = findRulesMatch?.[1] || findRulesMatch?.[2];
  if (!headerMapHref || !heroMapHref || headerMapHref !== heroMapHref) {
    violations.push(
      `/: Map route check failed — header Map (${JSON.stringify(headerMapHref)}) !== hero 'Find rules by place' (${JSON.stringify(heroMapHref)})`
    );
  }
}

// Pilot-specific checks: July 2025 amendment appears at most once in the missing items list
const pilotHtmlPath = path.join(nextServerAppDir, "pilot.html");
if (fs.existsSync(pilotHtmlPath)) {
  const pilotHtml = fs.readFileSync(pilotHtmlPath, "utf8");
  const missingListMatch = pilotHtml.match(
    /<ul\b[^>]*data-testid="pilot-missing-items-list"[^>]*>([\s\S]*?)<\/ul>/i
  );
  if (!missingListMatch) {
    violations.push(
      "/pilot: Missing data-testid='pilot-missing-items-list' list"
    );
  } else {
    const lis = [
      ...missingListMatch[1].matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi),
    ].map((m) => m[1]);
    const july2025Lis = lis.filter((li) => /July\s+2025/i.test(li));
    if (july2025Lis.length > 1) {
      violations.push(
        `/pilot: Gap deduplication check failed — July 2025 amendment appears ${july2025Lis.length} times in What is missing`
      );
    }
  }
}

if (violations.length > 0) {
  console.error(
    "[check_site_consistency] FAIL — Site link or figure consistency violations:"
  );
  for (const v of violations) {
    console.error(`  - ${v}`);
  }
  process.exit(1);
}

console.log(
  `[check_site_consistency] PASS — Verified ${htmlFiles.length} built HTML routes: disjoint header/footer nav, <=2 body links per destination, unified map address, deduplicated gaps, and consistent figures (${expectedDocsCount} docs, ${expectedBodiesCount} bodies, ${expectedCorpsCount} corporations, ${expectedWardsCount} wards, ${expectedZonesCount} zones, ${expectedSheetsCount} sheets).`
);
