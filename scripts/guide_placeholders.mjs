/**
 * Shared build-time placeholder resolver for `scripts/build_guide_assets.mjs`
 * and `scripts/build_guide_bundle.mjs`.
 */

import fs from "node:fs";
import path from "node:path";

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
  if (!isoDate) return "";
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(isoDate).trim());
  if (!m) return String(isoDate);
  const year = m[1];
  const monthName = MONTH_NAMES[Number(m[2]) - 1];
  const day = Number(m[3]);
  return monthName && !Number.isNaN(day) ? `${day} ${monthName} ${year}` : String(isoDate);
}

function parseTomlValue(tomlText, section, key, fallback) {
  const secRe = new RegExp(`\\[${section}\\]([\\s\\S]*?)(?:\\n\\[|$)`);
  const secM = secRe.exec(tomlText);
  if (!secM) return fallback;
  const keyRe = new RegExp(`^\\s*${key}\\s*=\\s*"([^"]*)"`, "m");
  const keyM = keyRe.exec(secM[1]);
  return keyM ? keyM[1].trim() : fallback;
}

export function loadGuidePlaceholdersFromDisk(repoRoot = process.cwd()) {
  const tomlPath = path.join(repoRoot, "bylaws.toml");
  const tomlText = fs.existsSync(tomlPath)
    ? fs.readFileSync(tomlPath, "utf8")
    : "";
  const contactEmail = parseTomlValue(
    tomlText,
    "contact",
    "email",
    "contact@example.org"
  );
  const organisationName = parseTomlValue(
    tomlText,
    "organisation",
    "name",
    "[Owner's Organisation]"
  );
  const githubRepoUrl = parseTomlValue(
    tomlText,
    "organisation",
    "github_repo",
    "https://github.com/manideepmamidala2-bit/bylaws-india"
  );
  const siteUrl = parseTomlValue(
    tomlText,
    "organisation",
    "site_url",
    "https://bylaws-india.vercel.app"
  );

  const manifest = JSON.parse(
    fs.readFileSync(
      path.join(repoRoot, "public", "data", "manifest.json"),
      "utf8"
    )
  );
  const visible = manifest.jurisdictions.filter((j) => j.visibility !== "test");
  const parentJur =
    visible.find((j) => visible.some((c) => c.parent === j.id)) || visible[0];
  const childCorps = visible.filter((j) => j.parent === parentJur.id);
  const ver = parentJur.latest_release || "4.0.0";
  const parentDataDir = path.join(
    repoRoot,
    "public",
    "data",
    parentJur.id,
    ver
  );
  const southDataDir = path.join(
    repoRoot,
    "public",
    "data",
    "in-ka-bengaluru-south",
    ver
  );

  const docs = JSON.parse(
    fs.readFileSync(path.join(parentDataDir, "documents.json"), "utf8")
  );
  const inForceDocs = docs.filter(
    (d) =>
      d.legal_status === "in_force" &&
      d.acquisition_status !== "not_found" &&
      d.applies_to_jurisdiction?.status !== "no" &&
      (d.instrument_type ?? "instrument") !== "map" &&
      (d.instrument_type ?? "instrument") !== "compilation"
  );
  const bodies = new Set();
  let newestDateIso = "";
  for (const d of inForceDocs) {
    const p = (d.issuing_authority || "")
      .split(/[/,]/)
      .map((s) => s.trim().toLowerCase())
      .find(Boolean);
    if (p) bodies.add(p);
    const dt = d.effective_from || d.notified_date || "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(dt) && dt > newestDateIso) {
      newestDateIso = dt;
    }
  }

  let provisionsCount = 0;
  let machineCheckedProvs = 0;
  let humanVerifiedProvs = 0;
  const parentRel = parentJur.releases.find((r) => r.version === ver);
  for (const clRel of [
    ...(parentRel.files?.clauses || []),
    ...(parentRel.drafts?.clauses || []),
  ]) {
    const clPath = path.join(repoRoot, "public", clRel.replace(/^\/+/, ""));
    if (!fs.existsSync(clPath)) continue;
    const tree = JSON.parse(fs.readFileSync(clPath, "utf8"));
    for (const c of tree.clauses || []) {
      if (c.superseded_by || c.record_superseded_by) continue;
      if (c.type === "table_row") continue;
      provisionsCount += 1;
      if (c.verification === "machine_checked") machineCheckedProvs += 1;
      if (c.verification === "human_verified") humanVerifiedProvs += 1;
    }
  }

  const paramsPayload = JSON.parse(
    fs.readFileSync(path.join(parentDataDir, "parameters.json"), "utf8")
  );
  const allParams = paramsPayload.records || [];
  const activeParamsCount = allParams.filter(
    (r) => r.legal_status === "in_force" && !r.valid_to
  ).length;
  const machineCheckedParams = allParams.filter(
    (r) => r.verification === "machine_checked"
  ).length;
  const humanVerifiedParams = allParams.filter(
    (r) => r.verification === "human_verified"
  ).length;

  const wardsFc = JSON.parse(
    fs.readFileSync(path.join(parentDataDir, "wards.geojson"), "utf8")
  );
  const zonesFc = JSON.parse(
    fs.readFileSync(path.join(southDataDir, "zones.geojson"), "utf8")
  );
  const activeZones = (zonesFc.features || []).filter(
    (z) => !z.properties?.superseded_by && !z.properties?.record_superseded_by
  );
  const machineCheckedZones = activeZones.filter(
    (z) => z.properties?.verification === "machine_checked"
  ).length;
  const humanVerifiedZones = activeZones.filter(
    (z) => z.properties?.verification === "human_verified"
  ).length;
  const sheetsSet = new Set(
    activeZones.map((z) => z.properties?.source_map).filter(Boolean)
  );
  const sheetsCount = sheetsSet.size || 4;

  const totalMachineChecked =
    machineCheckedProvs + machineCheckedParams + machineCheckedZones;
  const totalHumanVerified =
    humanVerifiedProvs + humanVerifiedParams + humanVerifiedZones;

  return {
    city: parentJur.aliases?.[0] || "Bengaluru",
    region: parentJur.aliases?.[2] || "Greater Bengaluru",
    state: "Karnataka",
    partial_zone_area: "Bengaluru South",
    documents_in_force: String(inForceDocs.length),
    registered_sources: String(docs.length),
    issuing_bodies: String(bodies.size),
    provisions: provisionsCount.toLocaleString("en-IN"),
    rules_as_data: String(activeParamsCount),
    total_parameters: String(allParams.length),
    corporations: String(childCorps.length),
    wards: String(wardsFc.features.length),
    active_zones: activeZones.length.toLocaleString("en-IN"),
    processed_sheets:
      sheetsCount === 1 ? "1 sheet" : `${sheetsCount} sheets`,
    processed_sheets_count: String(sheetsCount),
    map_coverage_pct: "1.5%",
    road_median_offset_m: "8 m",
    road_p90_offset_m: "21 m",
    verified_by_people: String(totalHumanVerified),
    machine_checked: totalMachineChecked.toLocaleString("en-IN"),
    checks_per_build: "10",
    current_as_of: formatHumanDate(newestDateIso) || "14 May 2026",
    release_version: ver,
    dataset_id: manifest.dataset_id || "",
    contact_email: contactEmail,
    organisation_name: organisationName,
    github_repo_url: githubRepoUrl,
    site_url: siteUrl,
    generated_date: "27 November 2026",
  };
}

export function interpolatePlaceholders(rawText, placeholders) {
  return String(rawText).replace(/\{\{([a-z0-9_]+)\}\}/gi, (_full, k) => {
    const key = String(k).toLowerCase();
    if (!(key in placeholders)) {
      throw new Error(`Unknown placeholder {{${k}}} in guide build script`);
    }
    return placeholders[key];
  });
}
