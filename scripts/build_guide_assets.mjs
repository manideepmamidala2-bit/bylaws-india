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
import {
  interpolatePlaceholders as interpolate,
  loadGuidePlaceholdersFromDisk,
} from "./guide_placeholders.mjs";

const repoRoot = process.cwd();
const guideDir = path.join(repoRoot, "content", "guide");
const diagramsOutDir = path.join(repoRoot, "public", "guide", "diagrams");
const screenshotsOutDir = path.join(repoRoot, "public", "guide", "screenshots");

fs.mkdirSync(diagramsOutDir, { recursive: true });
fs.mkdirSync(screenshotsOutDir, { recursive: true });

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

  const placeholders = loadGuidePlaceholdersFromDisk(repoRoot);
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
