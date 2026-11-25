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

for (const htmlPath of htmlFiles) {
  const relRoute =
    "/" +
    path
      .relative(nextServerAppDir, htmlPath)
      .replace(/\.html$/, "")
      .replace(/\/index$/, "");
  const htmlBytes = fs.statSync(htmlPath).size;
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
  console.error("[check_page_budgets] FAIL — Page weight budget violations:");
  for (const v of violations) {
    console.error(`  - ${v}`);
  }
  process.exit(1);
}
