#!/usr/bin/env node
/**
 * Build-time guide asset generator (Part 2.3 & Part 2.4):
 * 1. Renders the 6 Mermaid diagrams in `content/guide/assets.json` to clean SVGs
 *    in `public/guide/diagrams/<id>.svg` using `node_modules/mermaid/dist/mermaid.min.js`
 *    inside headless Chromium (`@playwright/test`).
 * 2. Captures the 12 screenshots (`6 views × {1280 px, 390 px}`) from the built site
 *    into `public/guide/screenshots/<id>-{1280,390}.png` (and updates `public/press/`).
 */

import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { chromium } from "@playwright/test";

const repoRoot = process.cwd();
const guideDir = path.join(repoRoot, "content", "guide");
const diagramsOutDir = path.join(repoRoot, "public", "guide", "diagrams");
const screenshotsOutDir = path.join(repoRoot, "public", "guide", "screenshots");

fs.mkdirSync(diagramsOutDir, { recursive: true });
fs.mkdirSync(screenshotsOutDir, { recursive: true });

function computePlaceholdersFromPublishedData() {
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
  for (const d of inForceDocs) {
    const p = (d.issuing_authority || "")
      .split(/[/,]/)
      .map((s) => s.trim().toLowerCase())
      .find(Boolean);
    if (p) bodies.add(p);
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
  const activeParams = allParams.filter(
    (r) => r.legal_status === "in_force" && !r.valid_to
  );
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
    rules_as_data: "271",
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
    current_as_of: "14 May 2026",
    release_version: ver,
    dataset_id: manifest.dataset_id || "",
  };
}

function interpolate(str, placeholders) {
  return str.replace(/\{\{([a-z0-9_]+)\}\}/gi, (_m, k) => {
    const key = String(k).toLowerCase();
    return key in placeholders ? placeholders[key] : _m;
  });
}

async function renderMermaidDiagrams(browser, assetsJson, placeholders) {
  const mermaidScriptPath = path.join(
    repoRoot,
    "node_modules",
    "mermaid",
    "dist",
    "mermaid.min.js"
  );
  const mermaidJs = fs.readFileSync(mermaidScriptPath, "utf8");
  const page = await browser.newPage({
    viewport: { width: 1200, height: 800 },
  });
  await page.setContent(
    `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{margin:0;background:#f5f3ed;font-family:sans-serif;}</style></head><body><div id="mount"></div></body></html>`
  );
  await page.addScriptTag({ content: mermaidJs });
  await page.evaluate(() => {
    // @ts-expect-error mermaid is injected
    window.mermaid.initialize({
      startOnLoad: false,
      securityLevel: "strict",
      theme: "base",
      flowchart: {
        htmlLabels: false,
        curve: "linear",
        padding: 14,
        nodeSpacing: 32,
        rankSpacing: 42,
      },
      themeVariables: {
        background: "#f5f3ed",
        primaryColor: "#efeee8",
        primaryTextColor: "#080909",
        primaryBorderColor: "#080909",
        lineColor: "#080909",
        secondaryColor: "#f5f3ed",
        tertiaryColor: "#efeee8",
        edgeLabelBackground: "#f5f3ed",
        fontFamily: "JetBrains Mono, ui-monospace, monospace",
        fontSize: "13px",
      },
    });
  });

  for (const diag of assetsJson.diagrams) {
    const mermaidDef = interpolate(diag.mermaid, placeholders);
    const title = interpolate(diag.title, placeholders);
    const svgString = await page.evaluate(
      async ({ id, code, label }) => {
        // @ts-expect-error mermaid is injected
        const { svg } = await window.mermaid.render(`mmd_${id.replace(/[^a-z0-9]/gi, "_")}`, code);
        const parser = new DOMParser();
        const doc = parser.parseFromString(svg, "image/svg+xml");
        const svgEl = doc.querySelector("svg");
        if (svgEl) {
          svgEl.setAttribute("role", "img");
          svgEl.setAttribute("aria-label", label);
          const titleEl = doc.createElementNS(
            "http://www.w3.org/2000/svg",
            "title"
          );
          titleEl.textContent = label;
          svgEl.insertBefore(titleEl, svgEl.firstChild);
        }
        return svgEl ? svgEl.outerHTML : svg;
      },
      { id: diag.id, code: mermaidDef, label: title }
    );

    const outPath = path.join(diagramsOutDir, `${diag.id}.svg`);
    fs.writeFileSync(outPath, svgString, "utf8");
  }

  await page.close();
  console.log(
    `[build_guide_assets] Rendered ${assetsJson.diagrams.length} Mermaid diagrams to public/guide/diagrams/*.svg.`
  );
}

async function waitForServer(url, timeoutMs = 45000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // retry
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  throw new Error(`Timed out waiting for ${url}`);
}

async function captureScreenshots(browser, baseUrl) {
  const viewports = [
    { suffix: "1280", width: 1280, height: 800 },
    { suffix: "390", width: 390, height: 844 },
  ];

  for (const vp of viewports) {
    const page = await browser.newPage({
      viewport: { width: vp.width, height: vp.height },
    });

    // 1. home-hero & 2. far-story
    await page.goto(`${baseUrl}/`, { waitUntil: "networkidle" });
    await page.screenshot({
      path: path.join(screenshotsOutDir, `home-hero-${vp.suffix}.png`),
      fullPage: false,
    });
    if (vp.width === 1280) {
      await page.screenshot({
        path: path.join(repoRoot, "public", "press", "press-home.png"),
        fullPage: false,
      });
    }

    const farStepper = page.getByTestId("far-story-stepper");
    await farStepper.scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);
    await page.screenshot({
      path: path.join(screenshotsOutDir, `far-story-${vp.suffix}.png`),
      fullPage: false,
    });

    // 3. subject-far
    await page.goto(`${baseUrl}/j/in-ka-bengaluru/topics/far`, {
      waitUntil: "networkidle",
    });
    await page.screenshot({
      path: path.join(screenshotsOutDir, `subject-far-${vp.suffix}.png`),
      fullPage: false,
    });

    // 4. map-place-card
    await page.goto(`${baseUrl}/j/in-ka-bengaluru-south`, {
      waitUntil: "domcontentloaded",
    });
    const searchInput = page.getByTestId("map-place-search-input");
    await searchInput.fill("Jayanagar");
    const resultsList = page.getByTestId("map-place-search-results");
    await resultsList.waitFor({ state: "visible", timeout: 10000 });
    await resultsList.locator("button").first().click();
    await page.getByTestId("place-card").waitFor({ state: "visible" });
    await page.waitForTimeout(800);
    await page.screenshot({
      path: path.join(screenshotsOutDir, `map-place-card-${vp.suffix}.png`),
      fullPage: false,
    });

    // 5. verify-task
    await page.goto(`${baseUrl}/verify/bengaluru-pilot-sample`, {
      waitUntil: "networkidle",
    });
    await page.screenshot({
      path: path.join(screenshotsOutDir, `verify-task-${vp.suffix}.png`),
      fullPage: false,
    });

    // 6. pilot-page
    await page.goto(`${baseUrl}/pilot`, { waitUntil: "networkidle" });
    await page.screenshot({
      path: path.join(screenshotsOutDir, `pilot-page-${vp.suffix}.png`),
      fullPage: false,
    });

    await page.close();
  }

  console.log(
    "[build_guide_assets] Captured 12 Playwright screenshots (1280 px and 390 px) in public/guide/screenshots/."
  );
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const diagramsOnly = args.has("--diagrams-only");
  const ifMissingOnly = args.has("--if-missing");

  const assetsJson = JSON.parse(
    fs.readFileSync(path.join(guideDir, "assets.json"), "utf8")
  );
  const allDiagramsExist = assetsJson.diagrams.every((d) =>
    fs.existsSync(path.join(diagramsOutDir, `${d.id}.svg`))
  );
  const allScreenshotsExist = assetsJson.screenshots.every(
    (s) =>
      fs.existsSync(path.join(screenshotsOutDir, `${s.id}-1280.png`)) &&
      fs.existsSync(path.join(screenshotsOutDir, `${s.id}-390.png`))
  );

  if (ifMissingOnly && allDiagramsExist && (diagramsOnly || allScreenshotsExist)) {
    return;
  }

  const placeholders = computePlaceholdersFromPublishedData();
  const browser = await chromium.launch({ headless: true });

  try {
    await renderMermaidDiagrams(browser, assetsJson, placeholders);

    if (!diagramsOnly) {
      const port = 3421;
      const baseUrl = `http://127.0.0.1:${port}`;
      const serverProc = spawn(
        "npx",
        ["next", "start", "-p", String(port), "-H", "127.0.0.1"],
        {
          cwd: repoRoot,
          stdio: "ignore",
        }
      );
      try {
        await waitForServer(`${baseUrl}/`);
        await captureScreenshots(browser, baseUrl);
      } finally {
        serverProc.kill("SIGTERM");
      }
    }
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error("[build_guide_assets] Error:", err);
  process.exit(1);
});
