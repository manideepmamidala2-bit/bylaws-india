#!/usr/bin/env node
/**
 * Enforce Bylaw One §3.3 & §12 Page Weight Budgets and Primary-Layer Language Gate
 * against the built Next.js `.next/` output:
 * - HTML per page <= 300 KB (307,200 bytes) uncompressed
 * - Initial JavaScript + data per page <= 1.5 MB (1,572,864 bytes) uncompressed
 * - Zero internal IDs, enum names, raw unit tokens (`sq_m`), or project references
 *   outside `<details>` expanders.
 */

import fs from "node:fs";
import path from "node:path";

const MAX_HTML_BYTES = 300 * 1024;
const MAX_INITIAL_JS_AND_DATA_BYTES = Math.floor(1.5 * 1024 * 1024);

const repoRoot = process.cwd();
const nextServerAppDir = path.join(repoRoot, ".next", "server", "app");
const buildManifestPath = path.join(repoRoot, ".next", "build-manifest.json");

if (!fs.existsSync(nextServerAppDir)) {
  console.error(
    "[check_page_budgets] .next/server/app not found. Run `npm run build` first."
  );
  process.exit(1);
}

function collectFiles(dir, ext, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectFiles(full, ext, out);
    } else if (entry.isFile() && full.endsWith(ext)) {
      out.push(full);
    }
  }
  return out;
}

function stripDetailsAndTags(html) {
  let cleaned = html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi, " ");
  const innerDetailsRe =
    /<details\b[^>]*>(?:(?!<details\b)[\s\S])*?<\/details>/gi;
  let prev = "";
  while (prev !== cleaned) {
    prev = cleaned;
    cleaned = cleaned.replace(innerDetailsRe, " ");
  }
  return cleaned.replace(/<[^>]+>/g, " ");
}

let rootMainJsBytes = 0;
if (fs.existsSync(buildManifestPath)) {
  const bm = JSON.parse(fs.readFileSync(buildManifestPath, "utf8"));
  const rootFiles = new Set([
    ...(bm.rootMainFiles || []),
    ...(bm.polyfillFiles || []),
  ]);
  for (const rel of rootFiles) {
    const p = path.join(repoRoot, ".next", rel);
    if (fs.existsSync(p)) {
      rootMainJsBytes += fs.statSync(p).size;
    }
  }
}

const htmlFiles = collectFiles(nextServerAppDir, ".html");
const violations = [];
let maxHtmlObserved = 0;
let maxHtmlRoute = "";
let maxTotalObserved = 0;
let maxTotalRoute = "";

const FORBIDDEN_PRIMARY_LAYER_PATTERNS = [
  { label: "PR number reference", regex: /\bPR\s+0?\d+\b/ },
  {
    label: "Internal plan reference",
    regex: /\b(Plan\s+v\d+|building-code-plan|00-overview\.md)\b/i,
  },
  { label: "Schema version label", regex: /\bSchema\s+v?1\.\d+\b/i },
  {
    label: "Stale release notice",
    regex: /Two base documents published|pending in PR/i,
  },
  {
    label: "Internal document or jurisdiction ID",
    regex:
      /\b(bbl-2003|rmp2015-zr|in-ka-bengaluru(?:-south|-north|-central|-east|-west)?|xx-test-fixture|part_I__|sec_1\.0|chp_4__)\b/,
  },
  {
    label: "Raw enum name",
    regex:
      /\b(in_force|status_unknown|reference_only|state_rules|far_base_max|ground_coverage_max_pct|setback_front_min_m|m2_per_car_space|pct_of_plot_depth)\b/,
  },
  {
    label: "Raw unit token",
    regex: /\b(sq_m|sq_ft)\b/,
  },
];

for (const htmlPath of htmlFiles) {
  const relRoute =
    "/" +
    path
      .relative(nextServerAppDir, htmlPath)
      .replace(/\.html$/, "")
      .replace(/\/index$/, "");
  const htmlBytes = fs.statSync(htmlPath).size;
  const htmlText = fs.readFileSync(htmlPath, "utf8");
  const primaryLayerText = stripDetailsAndTags(htmlText);

  if (
    !relRoute.includes("xx-test-fixture") &&
    !relRoute.includes("_not-found")
  ) {
    if (!primaryLayerText.includes("Bylaw One")) {
      violations.push(
        `${relRoute}: Missing 'Bylaw One' wordmark in built HTML`
      );
    }
    for (const pat of FORBIDDEN_PRIMARY_LAYER_PATTERNS) {
      const m = primaryLayerText.match(pat.regex);
      if (m) {
        violations.push(
          `${relRoute}: Primary layer outside <details> contains forbidden ${pat.label} (${JSON.stringify(m[0])})`
        );
      }
    }
  }

  const rscPath = htmlPath.replace(/\.html$/, ".rsc");
  const rscBytes = fs.existsSync(rscPath) ? fs.statSync(rscPath).size : 0;
  const initialJsAndDataBytes = rootMainJsBytes + rscBytes;

  if (htmlBytes > maxHtmlObserved) {
    maxHtmlObserved = htmlBytes;
    maxHtmlRoute = relRoute;
  }
  if (initialJsAndDataBytes > maxTotalObserved) {
    maxTotalObserved = initialJsAndDataBytes;
    maxTotalRoute = relRoute;
  }

  if (htmlBytes > MAX_HTML_BYTES) {
    violations.push(
      `${relRoute}: HTML ${(htmlBytes / 1024).toFixed(1)} KB exceeds 300.0 KB budget`
    );
  }
  if (initialJsAndDataBytes > MAX_INITIAL_JS_AND_DATA_BYTES) {
    violations.push(
      `${relRoute}: Initial JS+data ${(initialJsAndDataBytes / (1024 * 1024)).toFixed(2)} MB exceeds 1.50 MB budget`
    );
  }
}

console.log(
  `[check_page_budgets] Checked ${htmlFiles.length} built HTML routes: ` +
    `max HTML = ${(maxHtmlObserved / 1024).toFixed(1)} KB (${maxHtmlRoute || "/"}) [budget <= 300 KB], ` +
    `max initial JS+data = ${(maxTotalObserved / (1024 * 1024)).toFixed(2)} MB (${maxTotalRoute || "/"}) [budget <= 1.50 MB].`
);

if (violations.length > 0) {
  console.error(
    "[check_page_budgets] FAIL — Page budget or language gate violations:"
  );
  for (const v of violations) {
    console.error(`  - ${v}`);
  }
  process.exit(1);
}
