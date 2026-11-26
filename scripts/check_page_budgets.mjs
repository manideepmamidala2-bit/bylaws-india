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

const manifestJsonPath = path.join(repoRoot, "public", "data", "manifest.json");
const manifestObj = fs.existsSync(manifestJsonPath)
  ? JSON.parse(fs.readFileSync(manifestJsonPath, "utf8"))
  : null;
const expectedDatasetId = manifestObj?.dataset_id || "";
if (!/^ds-[0-9a-f]{12}$/.test(expectedDatasetId)) {
  violations.push(
    `public/data/manifest.json: Missing or invalid dataset_id (${JSON.stringify(expectedDatasetId)})`
  );
}
const observedDatasetIds = new Set();

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
  {
    label: "Old-design marker",
    regex:
      /Structured Building Bylaws|Statutory Resolution Cards|Local Graph|Local Knowledge Graph|One-Hop Neighborhood|\btopic:/i,
  },
];

const FORBIDDEN_ANYWHERE_HTML_PATTERNS = [
  {
    label: "Old-design marker",
    regex:
      /Structured Building Bylaws|Statutory Resolution Cards|Local Graph|Local Knowledge Graph|One-Hop Neighborhood|\btopic:[a-z_]+/i,
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
    const dsMatches = [...htmlText.matchAll(/data-dataset-id="([^"]*)"/g)].map(
      (m) => m[1]
    );
    if (dsMatches.length === 0) {
      violations.push(
        `${relRoute}: Same-build check failed — missing data-dataset-id attribute`
      );
    } else {
      for (const dsVal of dsMatches) {
        observedDatasetIds.add(dsVal);
        if (expectedDatasetId && dsVal !== expectedDatasetId) {
          violations.push(
            `${relRoute}: Same-build check failed — page data-dataset-id ${JSON.stringify(dsVal)} !== manifest dataset_id ${JSON.stringify(expectedDatasetId)}`
          );
        }
      }
    }
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
    const visibleHtmlText = htmlText
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ");
    for (const pat of FORBIDDEN_ANYWHERE_HTML_PATTERNS) {
      const m = visibleHtmlText.match(pat.regex);
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

if (observedDatasetIds.size > 1) {
  violations.push(
    `Same-build check failed — multiple dataset_id values found across built pages: ${JSON.stringify([...observedDatasetIds])}`
  );
}

// Part 1.3 Shared-content check (CI): compare shared parameter rows and shared provisions
// between the Greater Bengaluru city view and all 5 City Corporation views across every subject.
const cityTopicsDir = path.join(
  nextServerAppDir,
  "j",
  "in-ka-bengaluru",
  "topics"
);
const childCorporations = [
  "in-ka-bengaluru-central",
  "in-ka-bengaluru-north",
  "in-ka-bengaluru-south",
  "in-ka-bengaluru-east",
  "in-ka-bengaluru-west",
];
const CORP_AMENDED_BASE_ADDRESSES = new Set([
  "bbl-2003:part_II__sec_6.0__item_i",
  "bbl-2003:part_II__sec_3.0__cl_3.8",
  "bbl-2003:part_II__sec_3.0__cl_3.9",
  "bbl-2003:part_II__sec_3.0__cl_3.10",
]);

function normalizeJurLinks(fragment) {
  return fragment
    .replace(/\/j\/in-ka-bengaluru(?:-[a-z]+)?\//g, "/j/<JUR>/")
    .replace(/\s+/g, " ")
    .trim();
}

function extractSharedParameterRowsFromSubjectHtml(html) {
  const rows = [];
  const tableMatches = html.matchAll(
    /<table\b[^>]*data-testid="(?:subject-parameter-table|older-parameter-table)"[^>]*>([\s\S]*?)<\/table>/g
  );
  for (const tm of tableMatches) {
    const tbodyMatch = tm[1].match(/<tbody>([\s\S]*?)<\/tbody>/);
    if (!tbodyMatch) continue;
    for (const trMatch of tbodyMatch[1].matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/g)) {
      const trHtml = trMatch[1];
      if (trHtml.includes('data-testid="corporation-diff-badge"')) {
        continue;
      }
      rows.push(normalizeJurLinks(trHtml));
    }
  }
  return rows;
}

function extractSharedProvisionsFromSubjectHtml(html) {
  const map = new Map();
  for (const liMatch of html.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/g)) {
    const liHtml = liMatch[1];
    const codeMatch = liHtml.match(
      /Technical address:\s*<!--\s*-->\s*<code[^>]*>([^<]+)<\/code>|Technical address:\s*<code[^>]*>([^<]+)<\/code>/
    );
    const addr = (codeMatch?.[1] || codeMatch?.[2] || "").trim();
    if (!addr) continue;
    if (
      CORP_AMENDED_BASE_ADDRESSES.has(addr) ||
      addr.includes("-bbl-amend-2026")
    ) {
      continue;
    }
    map.set(addr, normalizeJurLinks(liHtml));
  }
  return map;
}

let sharedChecksCount = 0;
if (fs.existsSync(cityTopicsDir)) {
  const subjectFiles = fs
    .readdirSync(cityTopicsDir)
    .filter((f) => f.endsWith(".html"))
    .sort();
  for (const sFile of subjectFiles) {
    const slug = sFile.replace(/\.html$/, "");
    const cityHtml = fs.readFileSync(path.join(cityTopicsDir, sFile), "utf8");
    const cityParamRows = extractSharedParameterRowsFromSubjectHtml(cityHtml);
    const cityProvs = extractSharedProvisionsFromSubjectHtml(cityHtml);

    for (const corpId of childCorporations) {
      const corpPath = path.join(nextServerAppDir, "j", corpId, "topics", sFile);
      if (!fs.existsSync(corpPath)) {
        violations.push(
          `Shared-content check failed — missing subject page /j/${corpId}/topics/${slug}`
        );
        continue;
      }
      const corpHtml = fs.readFileSync(corpPath, "utf8");
      const corpParamRows = extractSharedParameterRowsFromSubjectHtml(corpHtml);
      const corpProvs = extractSharedProvisionsFromSubjectHtml(corpHtml);
      sharedChecksCount += 1;

      if (cityParamRows.length !== corpParamRows.length) {
        violations.push(
          `Shared-content check failed on /j/${corpId}/topics/${slug}: shared parameter row count ${corpParamRows.length} !== city view ${cityParamRows.length}`
        );
      } else {
        for (let i = 0; i < cityParamRows.length; i++) {
          if (cityParamRows[i] !== corpParamRows[i]) {
            violations.push(
              `Shared-content check failed on /j/${corpId}/topics/${slug}: shared parameter row #${i + 1} differs from Greater Bengaluru city view`
            );
            break;
          }
        }
      }

      const cityAddrs = [...cityProvs.keys()];
      const corpAddrs = [...corpProvs.keys()];
      if (JSON.stringify(cityAddrs) !== JSON.stringify(corpAddrs)) {
        violations.push(
          `Shared-content check failed on /j/${corpId}/topics/${slug}: shared provision list ${JSON.stringify(corpAddrs)} !== city view ${JSON.stringify(cityAddrs)}`
        );
      } else {
        for (const addr of cityAddrs) {
          if (cityProvs.get(addr) !== corpProvs.get(addr)) {
            violations.push(
              `Shared-content check failed on /j/${corpId}/topics/${slug}: shared provision ${addr} content differs between city view and ${corpId}`
            );
          }
        }
      }
    }
  }
}

console.log(
  `[check_page_budgets] Checked ${htmlFiles.length} built HTML routes (dataset_id=${expectedDatasetId}, shared-content pairs=${sharedChecksCount}): ` +
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
