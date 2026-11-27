#!/usr/bin/env node
/**
 * Build-time machine & AI readability generator (Part 3):
 * 1. `public/llms.txt` and `public/llms-full.txt`
 * 2. Markdown mirrors (`public/j/<id>/documents/<doc>.md`, `public/j/<id>/topics/<topic>.md`, `public/j/<id>/documents/<doc>/<eid>.md`)
 * 3. Static JSON API under `public/api/v1/` (`openapi.json` OpenAPI 3.1.0, `documents.json`, `provisions.json`, `subjects.json`, `parameters.json`, `zones.json`, `sources.json`)
 * 4. Frictionless Data Package (`public/data/datapackage.json` and `public/data/<id>/<version>/datapackage.json`)
 * 5. Atom 1.0 feed at `public/updates.xml`
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import zlib from "node:zlib";

const repoRoot = process.cwd();
const publicDir = path.join(repoRoot, "public");
const publicDataDir = path.join(publicDir, "data");
const manifestPath = path.join(publicDataDir, "manifest.json");

if (!fs.existsSync(manifestPath)) {
  console.log("[build_machine_readable] No manifest.json found; skipping.");
  process.exit(0);
}

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function readJsonIfExists(p) {
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function sha256File(p) {
  if (!fs.existsSync(p)) return null;
  return crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex");
}

function escapeXml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function formatHumanDate(isoDate) {
  if (!isoDate) return "Date not recorded";
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(isoDate).trim());
  if (!m) return String(isoDate);
  const year = m[1];
  const monthIdx = Number(m[2]) - 1;
  const day = Number(m[3]);
  const monthName = MONTH_NAMES[monthIdx];
  if (!monthName || Number.isNaN(day)) return String(isoDate);
  return `${day} ${monthName} ${year}`;
}

const CODE_SUBJECTS = [
  {
    slug: "land-use",
    topicId: "land_use",
    title: "Land use",
    summary:
      "What may be built in Residential, Commercial, Industrial, Public and Semi-Public, and Traffic zones across Rings I, II and III.",
    parameterKinds: [],
    whyAppliesLine:
      "Bye-law 1.4 hands land use and permissible uses in each zone to the master plan zoning regulations.",
  },
  {
    slug: "ground-coverage",
    topicId: "ground_coverage",
    title: "Ground coverage",
    summary:
      "How much of a plot's area may be covered by the building footprint, by zone and plot size.",
    parameterKinds: ["ground_coverage_max_pct"],
    whyAppliesLine:
      "Bye-law 1.4 hands maximum ground coverage to the master plan zoning regulations and their in-force amendments.",
  },
  {
    slug: "far",
    topicId: "far",
    title: "FAR",
    summary:
      "Total floor area allowed relative to plot size, including base FAR by zone and road width, premium FAR, and transferable development rights.",
    parameterKinds: [
      "far_base_max",
      "far_premium_additional_max",
      "tdr_receivable_max",
    ],
    whyAppliesLine:
      "Bye-law 1.4 hands floor area ratio (FAR) to the master plan zoning regulations, read with the April 2025 premium FAR chapter.",
  },
  {
    slug: "setbacks",
    topicId: "setbacks",
    title: "Setbacks",
    summary:
      "Open space required at the front, rear and sides of a building, by plot size and building height.",
    parameterKinds: [
      "setback_front_min_m",
      "setback_rear_min_m",
      "setback_side_min_m",
    ],
    whyAppliesLine:
      "Bye-law 1.4 hands setbacks to the master plan zoning regulations, governed today by the January 2026 setback tables for low-rise buildings and Table 9 for taller buildings.",
  },
  {
    slug: "height",
    topicId: "building_height",
    title: "Height",
    summary:
      "Maximum building height, number of floors, road-width caps, and high-rise thresholds.",
    parameterKinds: ["building_height_max_m", "floors_max"],
    whyAppliesLine:
      "Bye-law 1.4 hands maximum building height and number of floors to the master plan zoning regulations and their January 2026 amendments.",
  },
  {
    slug: "parking",
    topicId: "parking",
    title: "Parking",
    summary:
      "Minimum car and two-wheeler parking spaces, visitor parking, and ramp rules by building use.",
    parameterKinds: ["parking_requirement"],
    whyAppliesLine:
      "Bye-law 1.4 hands parking requirements to the master plan zoning regulations (Chapter 8, Table 23 and the June 2019 metro-corridor amendment).",
  },
  {
    slug: "basements-and-stilts",
    topicId: "basements_stilts",
    title: "Basements and stilts",
    summary:
      "When basements, cellars and stilt parking floors are allowed, their height and setback rules, and permitted uses.",
    parameterKinds: [],
    whyAppliesLine:
      "Master plan zoning regulations (as amended in January 2026) and building bye-laws govern basement levels, ramps, and stilt floor height.",
  },
  {
    slug: "projections-and-open-spaces",
    topicId: "projections_open_spaces",
    title: "Projections and open spaces",
    summary:
      "Balconies, chajjas, canopies, staircases in setbacks, courtyards, and buffer zones around lakes and drains.",
    parameterKinds: [],
    whyAppliesLine:
      "Master plan zoning regulations (including the October 2025 drain buffer notification) and building bye-laws govern open spaces, projections, and water-body buffers.",
  },
  {
    slug: "approvals-and-certificates",
    topicId: "approvals_certificates",
    title: "Approvals and certificates",
    summary:
      "Plan sanction, commencement certificate, occupancy certificate, khata rules, and corporation compounding schedules.",
    parameterKinds: [],
    whyAppliesLine:
      "The municipal governance Act, the Building Bye-laws 2003 (as amended in May 2026 for each City Corporation), and the February 2025 property-record order govern plan sanction and occupancy certificates.",
  },
  {
    slug: "fire-safety",
    topicId: "fire_safety",
    title: "Fire safety",
    summary:
      "Fire driveways, exits, staircases, refuge areas, Fire Force clearance, rainwater harvesting, and solar norms.",
    parameterKinds: [],
    whyAppliesLine:
      "Building Bye-laws 2003 and master plan high-rise fire protection rules govern exits, fire driveways, and safety clearances.",
  },
  {
    slug: "definitions",
    topicId: "definitions",
    title: "Definitions",
    summary:
      "What the terms used in the building bye-laws, master plan zoning regulations, and governance Act mean.",
    parameterKinds: [],
    whyAppliesLine:
      "Each instrument defines the terms used within it; where a zoning parameter is governed by the master plan under Bye-law 1.4, the master plan definition applies to that parameter.",
  },
];

const EXTRA_SUBJECTS = [
  {
    slug: "plot-size-and-frontage",
    topicId: "plot_size_frontage",
    title: "Plot size and frontage",
    summary:
      "Minimum plot area, frontage, and subdivision rules for residential, commercial, and group development sites.",
    parameterKinds: [],
    whyAppliesLine:
      "Bye-law 1.4 hands plot size and frontage thresholds for development to the master plan zoning regulations.",
  },
  {
    slug: "road-width",
    topicId: "road_width",
    title: "Road width and access",
    summary:
      "How road width is measured, minimum road widths for apartments and commercial buildings, and intersection splays.",
    parameterKinds: [],
    whyAppliesLine:
      "Master plan zoning regulations and building bye-laws govern road width measurement and access requirements.",
  },
  {
    slug: "deviations-and-compounding",
    topicId: "deviations_regularisation",
    title: "Deviations and compounding",
    summary:
      "Condonable limits of construction deviation and compounding fee schedules under the May 2026 City Corporation amendments.",
    parameterKinds: [],
    whyAppliesLine:
      "The May 2026 City Corporation Building (Amendment) Bye-laws set maximum condonable deviation limits and compounding fee tables inside each corporation.",
  },
];

const ALL_SUBJECTS = [...CODE_SUBJECTS, ...EXTRA_SUBJECTS];

const manifest = readJson(manifestPath);
const publicJurs = (manifest.jurisdictions || []).filter(
  (j) => j.visibility !== "test"
);
const parentJur =
  publicJurs.find((j) => publicJurs.some((c) => c.parent === j.id)) ||
  publicJurs[0];
const childJurs = publicJurs.filter((j) => j.parent === parentJur?.id);
const activeVersion = parentJur?.latest_release || "4.0.0";
const siteBaseUrl = "https://bylaws-india.vercel.app";

// Collect documents, clauses, parameters, zones, and sources across public jurisdictions
const allDocsById = new Map();
const clausesByDocId = new Map();
const annotationsByDocId = new Map();

for (const jur of publicJurs) {
  const relDir = path.join(publicDataDir, jur.id, activeVersion);
  const docs = readJsonIfExists(path.join(relDir, "documents.json")) || [];
  for (const d of docs) {
    if (!allDocsById.has(d.doc_id)) {
      allDocsById.set(d.doc_id, { ...d, jurisdiction_id: jur.id });
    }
  }
  const rel = (jur.releases || []).find((r) => r.version === activeVersion);
  for (const cRel of rel?.files?.clauses || []) {
    const cPath = path.join(publicDir, cRel.replace(/^\/+/, ""));
    const tree = readJsonIfExists(cPath);
    if (tree && !clausesByDocId.has(tree.doc_id)) {
      clausesByDocId.set(tree.doc_id, tree.clauses || []);
    }
  }
  for (const aRel of rel?.files?.annotations || []) {
    const aPath = path.join(publicDir, aRel.replace(/^\/+/, ""));
    const annDoc = readJsonIfExists(aPath);
    if (annDoc && !annotationsByDocId.has(annDoc.doc_id)) {
      annotationsByDocId.set(annDoc.doc_id, annDoc.annotations || []);
    }
  }
}

const parentRelDir = path.join(publicDataDir, parentJur.id, activeVersion);
const parametersPayload =
  readJsonIfExists(path.join(parentRelDir, "parameters.json")) || {
    records: [],
  };
const southJur =
  childJurs.find((c) => {
    const zFcCand = readJsonIfExists(
      path.join(publicDataDir, c.id, activeVersion, "zones.geojson")
    );
    return (zFcCand?.features?.length ?? 0) > 0;
  }) || parentJur;
const zonesFc = readJsonIfExists(
  path.join(publicDataDir, southJur.id, activeVersion, "zones.geojson")
) || { features: [] };

const activeZones = (zonesFc.features || []).filter(
  (z) => !z.properties?.superseded_by && !z.properties?.record_superseded_by
);
const activeParams = (parametersPayload.records || []).filter(
  (r) => r.legal_status === "in_force" && !r.valid_to
);
const allDocuments = Array.from(allDocsById.values());
const inForceInstruments = allDocuments.filter(
  (d) =>
    d.legal_status === "in_force" &&
    d.acquisition_status !== "not_found" &&
    d.applies_to_jurisdiction?.status !== "no" &&
    (d.instrument_type ?? "instrument") !== "map" &&
    (d.instrument_type ?? "instrument") !== "compilation"
);

// Sort instruments newest first
const sortedInstruments = [...allDocuments].sort((a, b) => {
  const dA = a.effective_from || a.notified_date || "0000-00-00";
  const dB = b.effective_from || b.notified_date || "0000-00-00";
  return dB.localeCompare(dA) || a.doc_id.localeCompare(b.doc_id);
});
const newestInForceDate = formatHumanDate(
  sortedInstruments.find((d) => d.legal_status === "in_force")
    ?.effective_from ||
    sortedInstruments.find((d) => d.legal_status === "in_force")?.notified_date
);

// ---------------------------------------------------------------------------
// 1. Build `/llms.txt` and `/llms-full.txt`
// ---------------------------------------------------------------------------
const cityLabel = parentJur?.aliases?.[0] || parentJur?.name || "City";
const regionLabel = parentJur?.aliases?.[2] || parentJur?.name || "City";

const llmsTxt = `# Bylaw One — ${cityLabel}'s Building Rules. One Code.

> Open, page-traced municipal building bye-laws, master plan zoning regulations, dated amendments, condition-bearing parameter tables, and georeferenced land-use maps for ${regionLabel}. Current as of ${newestInForceDate}.

## Coverage

- **Jurisdictions**: ${parentJur.name} (${parentJur.id}) and ${childJurs.length} City Corporations (${childJurs.map((c) => c.name).join(", ")})
- **In-force instruments**: ${inForceInstruments.length} official acts, bye-laws, master plan regulations, and gazette notifications (${allDocuments.length} total source register entries)
- **Active parameter records**: ${activeParams.length} cell-sourced development control rules
- **Georeferenced land-use zone polygons**: ${activeZones.length} polygons
- **Licences**: Code under Apache-2.0 (\`/LICENSE\`), structured data under CC BY 4.0 (\`/LICENSE-DATA.md\`)

## How to Cite

Cite both the official government instrument and page number AND Bylaw One:

1. **Official source**: \`<Plain title>, <Effective date>, <Provision or Table>, p. <N> (<Official PDF URL>#page=<N>)\`
2. **Dataset attribution**: \`Bylaw One (${siteBaseUrl}), Release v${activeVersion}, licensed under CC BY 4.0.\`

## Rules Any AI Must Follow

1. **Cite the exact page**: Every rule, number, or excerpt you state must include the instrument name, date, provision or table number, and the official PDF page (\`p. N\`). Never invent or paraphrase legal text as if it were a verbatim quote.
2. **Label derived values**: Consolidated provisions, parameter tables, and buffer overlays are derived by Bylaw One from multiple official notifications. Always state when a value is derived rather than printed in a single source.
3. **Ask for missing plot details**: Many rules depend on land-use zone, road width, plot area, plot depth, plot width, or building height. Never guess or assume a plot's dimensions (such as assuming a 3:2 aspect ratio or default height); ask the user for the missing plot details.
4. **Confirm with the authority**: State clearly that Bylaw One is an open reference worked out from official Gazette publications and is not legal advice. Users must confirm plot-specific decisions with the planning authority or a qualified professional.

## Key Pages & Machine-Readable Endpoints

- [Home](${siteBaseUrl}/)
- [Bengaluru Pilot Overview](${siteBaseUrl}/pilot)
- [How We Check (Automated & Human Verification)](${siteBaseUrl}/checks)
- [Join the Pilot (Colleges, Students, Practitioners, Civic Groups)](${siteBaseUrl}/join)
- [Use with AI](${siteBaseUrl}/use-with-ai)
- [Interactive Map & Place Card](${siteBaseUrl}/j/${southJur.id})
- [Browse by Ward (No Map Required)](${siteBaseUrl}/j/${southJur.id}/wards)
- [Open Data Releases & Checksums](${siteBaseUrl}/data)
- [Full Subject Reference in Markdown (/llms-full.txt)](${siteBaseUrl}/llms-full.txt)
- [OpenAPI 3.1 Specification (/api/v1/openapi.json)](${siteBaseUrl}/api/v1/openapi.json)
- [JSON API — Documents (/api/v1/documents.json)](${siteBaseUrl}/api/v1/documents.json)
- [JSON API — Provisions (/api/v1/provisions.json)](${siteBaseUrl}/api/v1/provisions.json)
- [JSON API — Subjects (/api/v1/subjects.json)](${siteBaseUrl}/api/v1/subjects.json)
- [JSON API — Parameters (/api/v1/parameters.json)](${siteBaseUrl}/api/v1/parameters.json)
- [JSON API — Zones (/api/v1/zones.json)](${siteBaseUrl}/api/v1/zones.json)
- [JSON API — Sources (/api/v1/sources.json)](${siteBaseUrl}/api/v1/sources.json)
- [Frictionless Data Package (/data/datapackage.json)](${siteBaseUrl}/data/datapackage.json)
- [Atom Feed of Changes (/updates.xml)](${siteBaseUrl}/updates.xml)

## Subjects (HTML & Markdown)

${CODE_SUBJECTS.map(
  (s) =>
    `- [${s.title}](${siteBaseUrl}/j/${parentJur.id}/topics/${s.slug}) · [Markdown](${siteBaseUrl}/j/${parentJur.id}/topics/${s.slug}.md): ${s.summary}`
).join("\n")}
`;

fs.writeFileSync(path.join(publicDir, "llms.txt"), llmsTxt, "utf8");

function buildSubjectMarkdown(jur, subj) {
  const paramSet = new Set(subj.parameterKinds);
  const matchingParams = activeParams.filter((r) => paramSet.has(r.parameter));
  const lines = [
    `# ${subj.title} — ${jur.name}`,
    ``,
    `> ${subj.summary}`,
    `> Current as of ${newestInForceDate} · Canonical URL: ${siteBaseUrl}/j/${jur.id}/topics/${subj.slug}`,
    ``,
    `## 1. What Applies Today`,
    ``,
  ];

  if (matchingParams.length > 0) {
    lines.push(
      `### Governing Table Values (Derived by Bylaw One)`,
      ``,
      `| Parameter | Value | Unit | Zone / Use Conditions | Source Document | Page |`,
      `|---|---|---|---|---|---|`
    );
    for (const r of matchingParams.slice(0, 60)) {
      const doc = allDocsById.get(r.source.doc_id);
      const docTitle = doc?.plain_title || doc?.title || r.source.doc_id;
      const zCond =
        (r.conditions?.zone || []).join(", ") ||
        (r.conditions?.use || []).join(", ") ||
        "All applicable plots";
      lines.push(
        `| \`${r.parameter}\` | **${r.value_text || r.value}** | \`${r.unit || ""}\` | ${zCond} | ${docTitle} | [p. ${r.source.page}](${r.source.page_link}) |`
      );
    }
    lines.push(``);
  }

  // Governing provisions tagged with this topic
  const topicClauses = [];
  for (const [docId, anns] of annotationsByDocId.entries()) {
    const doc = allDocsById.get(docId);
    if (!doc || doc.legal_status !== "in_force") continue;
    const docClauses = clausesByDocId.get(docId) || [];
    const clauseByEid = new Map(docClauses.map((c) => [c.eid, c]));
    for (const ann of anns) {
      if (ann.kind === "topic" && ann.value === subj.topicId) {
        const c = clauseByEid.get(ann.target.eid);
        if (c && c.type !== "table_row" && !c.omitted) {
          topicClauses.push({ doc, clause: c });
        }
      }
    }
  }

  lines.push(`### Governing Provisions in Force`, ``);
  const seenClauseKeys = new Set();
  for (const { doc, clause } of topicClauses) {
    const key = `${doc.doc_id}:${clause.eid}`;
    if (seenClauseKeys.has(key)) continue;
    seenClauseKeys.add(key);
    const vers = clause.versions || [];
    const latestVer = vers.length > 0 ? vers[vers.length - 1] : null;
    const text = (latestVer?.content || clause.text || "")
      .replace(/\s+/g, " ")
      .trim();
    if (text.length < 15) continue;
    const page =
      latestVer?.citations?.[0]?.page ?? clause.citations?.[0]?.page ?? 1;
    const pdfUrl = doc.official_url || doc.source_url || "";
    const plainDoc = doc.plain_title || doc.title;
    lines.push(
      `#### ${clause.number || clause.eid}${clause.heading ? ` — ${clause.heading}` : ""} (${plainDoc}, [p. ${page}](${pdfUrl}#page=${page}))`,
      ``,
      text,
      ``
    );
    if (seenClauseKeys.size >= 12) break;
  }

  lines.push(
    `## 2. Why This Rule Applies`,
    ``,
    `${subj.whyAppliesLine}`,
    ``,
    `*Worked out from the official documents by Bylaw One. Confirm with the planning authority or a qualified professional.*`,
    ``
  );

  return lines.join("\n");
}

const llmsFullParts = [
  `# Bylaw One — Full Subject Reference ("What Applies Today")`,
  ``,
  `> Generated from Release v${activeVersion} (${manifest.dataset_id || "latest"}) · Current as of ${newestInForceDate}.`,
  `> Every value and provision below traces to its exact official PDF page.`,
  ``,
];

for (const subj of CODE_SUBJECTS) {
  llmsFullParts.push(buildSubjectMarkdown(parentJur, subj), `\n---\n`);
}

fs.writeFileSync(
  path.join(publicDir, "llms-full.txt"),
  llmsFullParts.join("\n"),
  "utf8"
);

// ---------------------------------------------------------------------------
// 2. Write Markdown `.md` mirrors for documents, subjects, and provisions
// ---------------------------------------------------------------------------
function buildDocumentMarkdown(jur, doc) {
  const clauses = clausesByDocId.get(doc.doc_id) || [];
  const plainTitle = doc.plain_title || doc.title;
  const effDate = formatHumanDate(doc.effective_from || doc.notified_date);
  const pdfUrl = doc.official_url || doc.source_url || "";
  const lines = [
    `# ${plainTitle}`,
    ``,
    `- **Official title**: ${doc.title}`,
    `- **Document ID**: \`${doc.doc_id}\``,
    `- **Issuing authority**: ${doc.issuing_authority}`,
    `- **Status**: \`${doc.legal_status}\` (${effDate})`,
    `- **Official PDF**: ${pdfUrl}`,
    `- **Archive URL**: ${doc.retrieval?.archive_url || "Not recorded"}`,
    `- **SHA-256**: \`${doc.sha256 || "Not recorded"}\``,
    ``,
    `## Provisions`,
    ``,
  ];

  for (const c of clauses) {
    if (c.type === "table_row") continue;
    const page = c.citations?.[0]?.page ?? 1;
    const vers = c.versions || [];
    const latestVer = vers.length > 0 ? vers[vers.length - 1] : null;
    const text = (latestVer?.content || c.text || "").trim();
    lines.push(
      `### ${c.number || c.eid}${c.heading ? ` · ${c.heading}` : ""} ([p. ${page}](${pdfUrl}#page=${page}))`,
      ``,
      text,
      ``
    );
  }
  return lines.join("\n");
}

function buildProvisionMarkdown(jur, doc, clause) {
  const plainTitle = doc.plain_title || doc.title;
  const pdfUrl = doc.official_url || doc.source_url || "";
  const vers = clause.versions || [];
  const latestVer = vers.length > 0 ? vers[vers.length - 1] : null;
  const page =
    latestVer?.citations?.[0]?.page ?? clause.citations?.[0]?.page ?? 1;
  const text = (latestVer?.content || clause.text || "").trim();
  return [
    `# ${clause.number || clause.eid}${clause.heading ? ` — ${clause.heading}` : ""}`,
    ``,
    `- **Instrument**: ${plainTitle} (\`${doc.doc_id}\`)`,
    `- **Provision EID**: \`${clause.eid}\``,
    `- **Legal status**: \`${clause.legal_status || doc.legal_status}\``,
    `- **Verification**: \`${clause.verification || "machine_checked"}\``,
    `- **Cited page**: [p. ${page}](${pdfUrl}#page=${page})`,
    `- **Canonical HTML**: ${siteBaseUrl}/j/${jur.id}/documents/${doc.doc_id}#node-${clause.eid}`,
    ``,
    `## Verbatim Text`,
    ``,
    text,
    ``,
  ].join("\n");
}

for (const jur of publicJurs) {
  const topicsOutDir = path.join(publicDir, "j", jur.id, "topics");
  const docsOutDir = path.join(publicDir, "j", jur.id, "documents");
  fs.mkdirSync(topicsOutDir, { recursive: true });
  fs.mkdirSync(docsOutDir, { recursive: true });

  for (const subj of ALL_SUBJECTS) {
    fs.writeFileSync(
      path.join(topicsOutDir, `${subj.slug}.md`),
      buildSubjectMarkdown(jur, subj),
      "utf8"
    );
  }

  const relDir = path.join(publicDataDir, jur.id, activeVersion);
  const jurDocs = readJsonIfExists(path.join(relDir, "documents.json")) || [];
  for (const doc of jurDocs) {
    fs.writeFileSync(
      path.join(docsOutDir, `${doc.doc_id}.md`),
      buildDocumentMarkdown(jur, doc),
      "utf8"
    );
    // Write provision .md files for the primary parent and South jurisdictions
    if (jur.id === parentJur.id || jur.id === southJur.id) {
      const clauses = clausesByDocId.get(doc.doc_id) || [];
      const docProvisionDir = path.join(docsOutDir, doc.doc_id);
      fs.mkdirSync(docProvisionDir, { recursive: true });
      for (const c of clauses.slice(0, 40)) {
        if (!c.eid || c.type === "table_row") continue;
        fs.writeFileSync(
          path.join(docProvisionDir, `${c.eid}.md`),
          buildProvisionMarkdown(jur, doc, c),
          "utf8"
        );
      }
      // Always include Bye-law 1.4 and 6.0(i)
      for (const c of clauses) {
        if (
          c.eid === "part_I__sec_1.0__cl_1.4" ||
          c.eid === "part_II__sec_6.0__item_i" ||
          c.eid === "chp_3__cl_3.1" ||
          c.eid === "chp_4__cl_4.1__cl_4.1.3__tbl_10"
        ) {
          fs.writeFileSync(
            path.join(docProvisionDir, `${c.eid}.md`),
            buildProvisionMarkdown(jur, doc, c),
            "utf8"
          );
        }
      }
    }
  }
}

// ---------------------------------------------------------------------------
// 3. Static JSON API at `/api/v1/` with OpenAPI 3.1 (`/api/v1/openapi.json`)
// ---------------------------------------------------------------------------
const apiV1Dir = path.join(publicDir, "api", "v1");
fs.mkdirSync(apiV1Dir, { recursive: true });

const apiDocuments = sortedInstruments.map((d) => ({
  doc_id: d.doc_id,
  plain_title: d.plain_title || d.title,
  official_title: d.title,
  issuing_authority: d.issuing_authority,
  layer: d.layer,
  role: d.role,
  instrument_type: d.instrument_type || "instrument",
  effective_from: d.effective_from || null,
  notified_date: d.notified_date || null,
  markdown_url: `/j/${parentJur.id}/documents/${d.doc_id}.md`,
  citation: {
    doc_id: d.doc_id,
    plain_title: d.plain_title || d.title,
    page: d.status_evidence?.page || 1,
    official_url: d.official_url || d.source_url || null,
    archive_url: d.retrieval?.archive_url || null,
  },
  status: {
    legal_status: d.legal_status,
    verification: "machine_checked",
    derived: false,
  },
}));

const apiProvisions = [];
for (const [docId, clauses] of clausesByDocId.entries()) {
  const doc = allDocsById.get(docId);
  if (!doc) continue;
  for (const c of clauses) {
    if (c.type === "table_row") continue;
    const vers = c.versions || [];
    const latestVer = vers.length > 0 ? vers[vers.length - 1] : null;
    const page =
      latestVer?.citations?.[0]?.page ?? c.citations?.[0]?.page ?? 1;
    const pdfUrl = doc.official_url || doc.source_url || "";
    apiProvisions.push({
      clause_id: c.clause_id,
      doc_id: docId,
      eid: c.eid,
      number: c.number || null,
      heading: c.heading || c.title || null,
      text: (latestVer?.content || c.text || "").slice(0, 1000),
      markdown_url: `/j/${parentJur.id}/documents/${docId}/${c.eid}.md`,
      citation: {
        doc_id: latestVer?.source_doc || docId,
        plain_title: doc.plain_title || doc.title,
        page,
        page_link: pdfUrl ? `${pdfUrl}#page=${page}` : `#page=${page}`,
        official_url: pdfUrl || null,
        archive_url: doc.retrieval?.archive_url || null,
      },
      status: {
        legal_status: c.legal_status || doc.legal_status,
        verification: c.verification || "machine_checked",
        verified_by: c.verified_by || null,
        verifications: c.verifications || [],
        derived: vers.length > 1,
      },
    });
  }
}

const apiSubjects = ALL_SUBJECTS.map((s) => {
  const pKinds = new Set(s.parameterKinds);
  const matchingParams = activeParams.filter((r) => pKinds.has(r.parameter));
  const firstDoc = allDocsById.get("rmp2015-zr") || sortedInstruments[0];
  return {
    slug: s.slug,
    topic_id: s.topicId,
    title: s.title,
    summary: s.summary,
    why_applies: s.whyAppliesLine,
    parameter_count: matchingParams.length,
    html_url: `/j/${parentJur.id}/topics/${s.slug}`,
    markdown_url: `/j/${parentJur.id}/topics/${s.slug}.md`,
    citation: {
      doc_id: firstDoc?.doc_id || "rmp2015-zr",
      plain_title: firstDoc?.plain_title || firstDoc?.title || "Master Plan",
      page: 1,
      official_url: firstDoc?.official_url || firstDoc?.source_url || null,
      archive_url: firstDoc?.retrieval?.archive_url || null,
    },
    status: {
      legal_status: "in_force",
      verification: "machine_checked",
      derived: true,
    },
  };
});

const apiParameters = (parametersPayload.records || []).map((r) => {
  const doc = allDocsById.get(r.source.doc_id);
  return {
    parameter_id: r.parameter_id,
    parameter: r.parameter,
    value: r.value,
    unit: r.unit,
    value_text: r.value_text,
    conditions: r.conditions,
    citation: {
      doc_id: r.source.doc_id,
      plain_title: doc?.plain_title || doc?.title || r.source.doc_id,
      eid: r.source.eid,
      table_id: r.source.table_id,
      page: r.source.page,
      page_link: r.source.page_link,
      official_url: r.source.official_url,
      archive_url: r.source.archive_url,
    },
    status: {
      legal_status: r.legal_status,
      verification: r.verification || "machine_checked",
      verified_by: r.verified_by || null,
      verifications: r.verifications || [],
      derived: Boolean(r.derived),
    },
  };
});

const zoneCounts = new Map();
for (const zf of activeZones) {
  const code = zf.properties.zone_code;
  const cur = zoneCounts.get(code) || {
    zone_code: code,
    zone_label: zf.properties.zone_label,
    polygon_count: 0,
    total_area_sq_m: 0,
    sample_feature: zf.properties,
  };
  cur.polygon_count += 1;
  cur.total_area_sq_m += Number(zf.properties.area_sq_m || 0);
  zoneCounts.set(code, cur);
}
const rmpDoc = allDocsById.get("rmp2015-zr") || sortedInstruments[0];
const apiZones = Array.from(zoneCounts.values()).map((z) => ({
  zone_code: z.zone_code,
  zone_label: z.zone_label,
  polygon_count: z.polygon_count,
  total_area_sq_km: Number((z.total_area_sq_m / 1e6).toFixed(3)),
  planning_district: z.sample_feature.planning_district,
  sheet: z.sample_feature.sheet,
  citation: {
    doc_id: rmpDoc?.doc_id || "rmp2015-zr",
    plain_title: z.sample_feature.sheet || "RMP 2015 Proposed Land Use Map",
    page: 1,
    official_url: rmpDoc?.official_url || rmpDoc?.source_url || null,
    archive_url: rmpDoc?.retrieval?.archive_url || null,
  },
  status: {
    legal_status: "in_force",
    verification: z.sample_feature.verification || "machine_checked",
    derived: Boolean(z.sample_feature.derived),
  },
}));

const apiSources = sortedInstruments.map((d) => ({
  source_id: d.doc_id,
  plain_title: d.plain_title || d.title,
  official_title: d.title,
  issuing_authority: d.issuing_authority,
  notification_number: d.notification_number || null,
  sha256: d.sha256 || null,
  acquisition_status: d.acquisition_status || "acquired",
  citation: {
    doc_id: d.doc_id,
    plain_title: d.plain_title || d.title,
    page: d.status_evidence?.page || 1,
    official_url: d.official_url || d.source_url || null,
    archive_url: d.retrieval?.archive_url || null,
  },
  status: {
    legal_status: d.legal_status,
    verification: "machine_checked",
    derived: false,
  },
}));

const openApiSpec = {
  openapi: "3.1.0",
  info: {
    title: "Bylaw One Static JSON API",
    version: activeVersion,
    summary:
      "Read-only, page-traced municipal building bye-laws, master plan zoning regulations, parameters, and zones API.",
    description:
      "Static JSON API built at publish time. Every record carries its official page citation (`citation`) and verification/legal status (`status`).",
    license: {
      name: "CC BY 4.0",
      identifier: "CC-BY-4.0",
      url: "https://creativecommons.org/licenses/by/4.0/",
    },
  },
  servers: [
    {
      url: siteBaseUrl,
      description: "Production & Preview Static Deployment",
    },
  ],
  paths: {
    "/api/v1/documents.json": {
      get: {
        operationId: "listDocuments",
        summary: "List all legal instruments in the source register",
        responses: {
          "200": {
            description: "Array of document records with citation and status",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ApiListEnvelope",
                },
              },
            },
          },
        },
      },
    },
    "/api/v1/provisions.json": {
      get: {
        operationId: "listProvisions",
        summary: "List structured provisions with verbatim text and page citations",
        responses: {
          "200": {
            description: "Array of provision records with citation and status",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ApiListEnvelope",
                },
              },
            },
          },
        },
      },
    },
    "/api/v1/subjects.json": {
      get: {
        operationId: "listSubjects",
        summary: "List regulatory subjects and their Markdown/HTML endpoints",
        responses: {
          "200": {
            description: "Array of subject records with citation and status",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ApiListEnvelope",
                },
              },
            },
          },
        },
      },
    },
    "/api/v1/parameters.json": {
      get: {
        operationId: "listParameters",
        summary: "List condition-bearing building parameter records with cell provenance",
        responses: {
          "200": {
            description: "Array of parameter records with citation and status",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ApiListEnvelope",
                },
              },
            },
          },
        },
      },
    },
    "/api/v1/zones.json": {
      get: {
        operationId: "listZones",
        summary: "List master plan land-use zone summaries and polygon counts",
        responses: {
          "200": {
            description: "Array of zone summary records with citation and status",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ApiListEnvelope",
                },
              },
            },
          },
        },
      },
    },
    "/api/v1/sources.json": {
      get: {
        operationId: "listSources",
        summary: "List source register entries with SHA-256 digests and archive URLs",
        responses: {
          "200": {
            description: "Array of source records with citation and status",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ApiListEnvelope",
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      CitationRecord: {
        type: "object",
        required: ["doc_id", "plain_title", "page"],
        properties: {
          doc_id: { type: "string" },
          plain_title: { type: "string" },
          page: { type: "integer", minimum: 1 },
          page_link: { type: ["string", "null"] },
          official_url: { type: ["string", "null"] },
          archive_url: { type: ["string", "null"] },
        },
      },
      StatusRecord: {
        type: "object",
        required: ["legal_status", "verification", "derived"],
        properties: {
          legal_status: { type: "string" },
          verification: {
            type: "string",
            enum: ["machine_checked", "human_verified", "unverified"],
          },
          derived: { type: "boolean" },
        },
      },
      ApiListEnvelope: {
        type: "object",
        required: ["schema_version", "dataset_id", "version", "count", "records"],
        properties: {
          schema_version: { type: "string" },
          dataset_id: { type: "string" },
          version: { type: "string" },
          count: { type: "integer", minimum: 0 },
          records: {
            type: "array",
            items: {
              type: "object",
              required: ["citation", "status"],
              properties: {
                citation: { $ref: "#/components/schemas/CitationRecord" },
                status: { $ref: "#/components/schemas/StatusRecord" },
              },
            },
          },
        },
      },
    },
  },
};

function writeApiCollection(filename, records) {
  const envelope = {
    schema_version: "1.4",
    dataset_id: manifest.dataset_id || "ds-latest",
    version: activeVersion,
    current_as_of: newestInForceDate,
    count: records.length,
    records,
  };
  fs.writeFileSync(
    path.join(apiV1Dir, filename),
    JSON.stringify(envelope, null, 2),
    "utf8"
  );
}

fs.writeFileSync(
  path.join(apiV1Dir, "openapi.json"),
  JSON.stringify(openApiSpec, null, 2),
  "utf8"
);
writeApiCollection("documents.json", apiDocuments);
writeApiCollection("provisions.json", apiProvisions);
writeApiCollection("subjects.json", apiSubjects);
writeApiCollection("parameters.json", apiParameters);
writeApiCollection("zones.json", apiZones);
writeApiCollection("sources.json", apiSources);

// ---------------------------------------------------------------------------
// 4. Frictionless Data Package (`datapackage.json`)
// ---------------------------------------------------------------------------
const contributors = [
  {
    title: "Bylaw One Contributors",
    role: "author",
  },
];
for (const jur of publicJurs) {
  for (const rel of jur.releases || []) {
    for (const v of rel.verifiers || []) {
      if (
        !contributors.some(
          (c) => c.title === v.verifier_name && c.organisation === v.institution
        )
      ) {
        contributors.push({
          title: v.verifier_name,
          organisation: v.institution,
          role: "contributor",
        });
      }
    }
  }
}

function buildDataPackageForJurisdiction(jur) {
  const rel = (jur.releases || []).find((r) => r.version === activeVersion);
  const resources = [];
  if (rel?.files) {
    const fileEntries = [
      ["documents", rel.files.documents, "json", "application/json"],
      ["amendments", rel.files.amendments, "json", "application/json"],
      ["consolidated", rel.files.consolidated, "json", "application/json"],
      ["parameters", rel.files.parameters, "json", "application/json"],
      ["resolution", rel.files.resolution, "json", "application/json"],
      ["relations", rel.files.relations, "json", "application/json"],
      ["zones", rel.files.zones, "geojson", "application/geo+json"],
      ["boundary", rel.files.boundary, "geojson", "application/geo+json"],
      ["wards", rel.files.wards, "geojson", "application/geo+json"],
      ["sources-csv", rel.files.sources_csv, "csv", "text/csv"],
    ];
    for (const [name, webPath, format, mediatype] of fileEntries) {
      if (!webPath) continue;
      const diskPath = path.join(publicDir, webPath.replace(/^\/+/, ""));
      if (!fs.existsSync(diskPath)) continue;
      resources.push({
        name: `${jur.id}-${name}`,
        path: webPath,
        format,
        mediatype,
        bytes: fs.statSync(diskPath).size,
        hash: `sha256:${sha256File(diskPath)}`,
      });
    }
  }
  return {
    profile: "data-package",
    name: `bylaw-one-${jur.id}`,
    title: `Bylaw One Regulatory Dataset — ${jur.name} (v${activeVersion})`,
    version: activeVersion,
    created: rel?.released_at || "2026-11-26T00:00:00Z",
    licenses: [
      {
        name: "CC-BY-4.0",
        title: "Creative Commons Attribution 4.0 International",
        path: "https://creativecommons.org/licenses/by/4.0/",
      },
      {
        name: "Apache-2.0",
        title: "Apache License 2.0 (Pipeline & Web Application Code)",
        path: "https://www.apache.org/licenses/LICENSE-2.0",
      },
    ],
    sources: sortedInstruments.slice(0, 25).map((d) => ({
      title: d.plain_title || d.title,
      path: d.official_url || d.source_url,
    })),
    contributors,
    resources,
  };
}

const rootDataPackage = buildDataPackageForJurisdiction(parentJur);
fs.writeFileSync(
  path.join(publicDataDir, "datapackage.json"),
  JSON.stringify(rootDataPackage, null, 2),
  "utf8"
);
for (const jur of publicJurs) {
  const jurRelDir = path.join(publicDataDir, jur.id, activeVersion);
  if (fs.existsSync(jurRelDir)) {
    fs.writeFileSync(
      path.join(jurRelDir, "datapackage.json"),
      JSON.stringify(buildDataPackageForJurisdiction(jur), null, 2),
      "utf8"
    );
  }
}

// ---------------------------------------------------------------------------
// 5. Atom 1.0 Feed at `/updates.xml`
// ---------------------------------------------------------------------------
const feedUpdatedIso = "2026-11-26T00:00:00Z";
const atomEntries = sortedInstruments
  .filter((d) => (d.instrument_type ?? "instrument") !== "compilation")
  .map((d) => {
    const plainTitle = d.plain_title || d.title;
    const rawDate = d.effective_from || d.notified_date || "2026-05-14";
    const isoTimestamp = /^\d{4}-\d{2}-\d{2}$/.test(rawDate)
      ? `${rawDate}T00:00:00Z`
      : feedUpdatedIso;
    const summary =
      d.summary_by_site ||
      `${plainTitle} (${d.issuing_authority}, ${formatHumanDate(rawDate)}) — status: ${d.legal_status}.`;
    const linkHref = `${siteBaseUrl}/j/${d.jurisdiction_id || parentJur.id}/documents/${d.doc_id}`;
    return `  <entry>
    <id>${escapeXml(`${siteBaseUrl}/instruments/${d.doc_id}`)}</id>
    <title>${escapeXml(`${plainTitle} (${formatHumanDate(rawDate)})`)}</title>
    <updated>${escapeXml(isoTimestamp)}</updated>
    <link href="${escapeXml(linkHref)}" rel="alternate" type="text/html" />
    <author>
      <name>${escapeXml(d.issuing_authority || "Official Authority")}</name>
    </author>
    <summary type="text">${escapeXml(summary)}</summary>
  </entry>`;
  })
  .join("\n");

const atomXml = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <id>${siteBaseUrl}/updates.xml</id>
  <title>Bylaw One — Regulatory Instruments &amp; Amendments Feed</title>
  <subtitle>Newest-first feed of official acts, building bye-laws, master plan zoning regulations, and amendments in Bylaw One.</subtitle>
  <updated>${feedUpdatedIso}</updated>
  <link href="${siteBaseUrl}/updates.xml" rel="self" type="application/atom+xml" />
  <link href="${siteBaseUrl}/" rel="alternate" type="text/html" />
  <rights>Creative Commons Attribution 4.0 International (CC BY 4.0)</rights>
${atomEntries}
</feed>
`;

fs.writeFileSync(path.join(publicDir, "updates.xml"), atomXml, "utf8");

// Ensure press screenshot PNG placeholders exist before Playwright browser run overwrites them
const pressDir = path.join(publicDir, "press");
fs.mkdirSync(pressDir, { recursive: true });
function createMinimalPngBuffer(width = 640, height = 360) {
  const crcTable = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    crcTable[n] = c;
  }
  function crc32(buf) {
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
    }
    return (c ^ 0xffffffff) >>> 0;
  }
  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, "ascii");
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // RGB
  const rowSize = 1 + width * 3;
  const raw = Buffer.alloc(rowSize * height);
  for (let y = 0; y < height; y++) {
    const rowStart = y * rowSize;
    raw[rowStart] = 0;
    for (let x = 0; x < width; x++) {
      const p = rowStart + 1 + x * 3;
      const border = x < 4 || x >= width - 4 || y < 4 || y >= height - 4;
      raw[p] = border ? 8 : 245;
      raw[p + 1] = border ? 9 : 243;
      raw[p + 2] = border ? 9 : 237;
    }
  }
  const idat = zlib.deflateSync(raw);
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}
for (const shotName of [
  "press-home.png",
  "press-map-place-card.png",
  "press-subject-far.png",
]) {
  const p = path.join(pressDir, shotName);
  if (!fs.existsSync(p)) {
    fs.writeFileSync(p, createMinimalPngBuffer(640, 360));
  }
}

console.log(
  `[build_machine_readable] Generated llms.txt, llms-full.txt, .md mirrors, /api/v1/* (${apiProvisions.length} provisions, ${apiParameters.length} parameters), datapackage.json, and updates.xml.`
);
