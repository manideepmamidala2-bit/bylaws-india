#!/usr/bin/env node
/**
 * Enforce Part 1 §5 Page Weight Budgets against the built Next.js `.next/` output:
 * - HTML per page <= 300 KB (307,200 bytes) uncompressed
 * - Initial JavaScript + data per page <= 1.5 MB (1,572,864 bytes) uncompressed
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
const observedReleases = new Set();

const FORBIDDEN_COPY_PATTERNS = [
  { label: "PR number reference", regex: /\bPR\s+0?\d+\b/ },
  { label: "Internal plan reference", regex: /\b(Plan\s+v\d+|building-code-plan|00-overview\.md)\b/i },
  { label: "Schema version label", regex: /\bSchema\s+v?1\.\d+\b/i },
  { label: "Stale release notice", regex: /Two base documents published|pending in PR/i },
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
  const visibleText = htmlText
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ");

  if (!relRoute.includes("xx-test-fixture") && !relRoute.includes("_not-found")) {
    const relMatch = visibleText.match(/Release\s+(\d+\.\d+\.\d+)\s*·\s*CC BY 4\.0/);
    if (!relMatch) {
      violations.push(`${relRoute}: Missing 'Release X.Y.Z · CC BY 4.0' banner in built HTML`);
    } else {
      observedReleases.add(relMatch[1]);
    }
    for (const pat of FORBIDDEN_COPY_PATTERNS) {
      const m = visibleText.match(pat.regex);
      if (m) {
        violations.push(
          `${relRoute}: Built HTML contains forbidden ${pat.label} (${JSON.stringify(m[0])})`
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

if (observedReleases.size > 1) {
  violations.push(
    `Built pages report inconsistent release identifiers: ${Array.from(observedReleases).join(", ")}`
  );
}

console.log(
  `[check_page_budgets] Checked ${htmlFiles.length} built HTML routes (release=${Array.from(observedReleases).join(",") || "none"}): ` +
    `max HTML = ${(maxHtmlObserved / 1024).toFixed(1)} KB (${maxHtmlRoute || "/"}) [budget <= 300 KB], ` +
    `max initial JS+data = ${(maxTotalObserved / (1024 * 1024)).toFixed(2)} MB (${maxTotalRoute || "/"}) [budget <= 1.50 MB].`
);

if (violations.length > 0) {
  console.error("[check_page_budgets] FAIL — Page weight budget violations:");
  for (const v of violations) {
    console.error(`  - ${v}`);
  }
  process.exit(1);
}
