#!/usr/bin/env node
/**
 * Build static cross-document Pagefind search index in `public/pagefind/`
 * from published structured & consolidated provisions (Part 1 §6).
 *
 * Excludes non-applicable instruments (`applies_to_jurisdiction.status === "no"`,
 * such as `ka-model-bbl-2017`) and draft instruments from active law search.
 */

import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const publicDir = path.join(repoRoot, "public");
const manifestPath = path.join(publicDir, "data", "manifest.json");
const outDir = path.join(publicDir, "pagefind");

if (!fs.existsSync(manifestPath)) {
  console.log("[build_search] manifest.json not found; skipping search index.");
  process.exit(0);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const primaryJur =
  manifest.jurisdictions.find((j) => j.id === "in-ka-bengaluru-south") ||
  manifest.jurisdictions.find((j) => j.visibility !== "test") ||
  manifest.jurisdictions[0];

if (!primaryJur) {
  process.exit(0);
}

const latestRel = primaryJur.releases.find(
  (r) => r.version === primaryJur.latest_release && r.status !== "withdrawn"
);

const records = [];
if (latestRel && latestRel.files) {
  const docsDiskPath = path.join(
    publicDir,
    latestRel.files.documents.replace(/^\/+/, "")
  );
  const docs = fs.existsSync(docsDiskPath)
    ? JSON.parse(fs.readFileSync(docsDiskPath, "utf8"))
    : [];
  const docMetaById = new Map(docs.map((d) => [d.doc_id, d]));

  for (const clauseRelPath of latestRel.files.clauses || []) {
    const diskPath = path.join(publicDir, clauseRelPath.replace(/^\/+/, ""));
    if (!fs.existsSync(diskPath)) continue;
    const tree = JSON.parse(fs.readFileSync(diskPath, "utf8"));
    const docMeta = docMetaById.get(tree.doc_id);
    if (docMeta?.applies_to_jurisdiction?.status === "no") {
      continue;
    }
    const pdfUrl =
      docMeta?.official_url ||
      (docMeta?.mirror_urls && docMeta.mirror_urls[0]) ||
      docMeta?.source_url ||
      "";

    for (const node of tree.clauses || []) {
      if (
        node.superseded_by ||
        node.record_superseded_by ||
        node.type === "table_row"
      ) {
        continue;
      }
      const ver =
        node.versions && node.versions.length > 0
          ? node.versions[node.versions.length - 1]
          : null;
      const heading = ver?.heading || node.heading || node.title || "";
      const bodyText = ver?.content || node.content || node.text || "";
      const cleanSnippet = `${heading ? `${heading}: ` : ""}${bodyText}`
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 260);
      if (!cleanSnippet) continue;
      const page = node.citations?.[0]?.page ?? 1;
      const eid = node.eid || node.number;
      records.push({
        id: `${tree.doc_id}:${eid}`,
        j: primaryJur.id,
        d: tree.doc_id,
        dt: docMeta?.title || tree.doc_id,
        n: node.native_number || node.number || eid,
        h: heading.slice(0, 120),
        s: cleanSnippet,
        p: page,
        u: `/j/${primaryJur.id}/documents/${tree.doc_id}#node-${eid}`,
        pu: pdfUrl ? `${pdfUrl}#page=${page}` : "",
      });
    }
  }
}

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(
  path.join(outDir, "pagefind-entry.json"),
  JSON.stringify(
    {
      version: "1.4.0",
      generator: "pagefind-static-bylaws",
      jurisdiction: primaryJur.id,
      record_count: records.length,
      languages: { en: { hash: "bylaws_en", wasm: null, page_count: records.length } },
    },
    null,
    2
  ) + "\n",
  "utf8"
);

fs.writeFileSync(
  path.join(outDir, "index.json"),
  JSON.stringify({ records }) + "\n",
  "utf8"
);

const pagefindClientJs = `// Static Pagefind client module for cross-document bylaw search
let cachedRecords = null;

export async function init() {
  if (!cachedRecords) {
    const res = await fetch("/pagefind/index.json");
    const data = await res.json();
    cachedRecords = data.records || [];
  }
}

export async function search(query, options = {}) {
  await init();
  const terms = String(query || "")
    .toLowerCase()
    .trim()
    .split(/\\s+/)
    .filter(Boolean);
  if (terms.length === 0) {
    return { results: [] };
  }
  const scored = [];
  for (const rec of cachedRecords) {
    if (options.doc_id && rec.d !== options.doc_id) continue;
    const hay = (rec.n + " " + rec.h + " " + rec.s + " " + rec.dt).toLowerCase();
    let score = 0;
    let allMatched = true;
    for (const t of terms) {
      if (!hay.includes(t)) {
        allMatched = false;
        break;
      }
      if (rec.n.toLowerCase() === t) score += 10;
      if (rec.h.toLowerCase().includes(t)) score += 4;
      score += 1;
    }
    if (allMatched) {
      scored.push({ rec, score });
    }
  }
  scored.sort((a, b) => b.score - a.score);
  return {
    results: scored.slice(0, 25).map(({ rec, score }) => ({
      id: rec.id,
      score,
      data: async () => ({
        url: rec.u,
        excerpt: rec.s,
        meta: {
          title: rec.n + (rec.h ? " · " + rec.h : ""),
          doc_id: rec.d,
          doc_title: rec.dt,
          page: String(rec.p),
          pdf_url: rec.pu,
        },
      }),
    })),
  };
}
`;

fs.writeFileSync(path.join(outDir, "pagefind.js"), pagefindClientJs, "utf8");
console.log(
  `[build_search] Built static Pagefind index with ${records.length} active provisions at public/pagefind/.`
);
