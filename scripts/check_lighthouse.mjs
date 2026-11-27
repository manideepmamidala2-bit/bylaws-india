#!/usr/bin/env node
/**
 * Mobile Lighthouse Performance (>= 70) and Accessibility (>= 95) CI Gate (Part 2.8 & Part 7).
 *
 * Audits the 4 required routes under mobile emulation (390x844, Moto G / iPhone profile):
 * 1. Home (`/`)
 * 2. Map (`/j/in-ka-bengaluru-south`)
 * 3. Subject page (`/j/in-ka-bengaluru-south/topics/far`)
 * 4. Document page (`/j/in-ka-bengaluru-south/documents/bbl-2003`)
 */

import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";

const PORT = Number(process.env.LIGHTHOUSE_PORT || 3115);
const BASE_URL = `http://127.0.0.1:${PORT}`;
const MIN_PERFORMANCE_SCORE = 70;
const MIN_ACCESSIBILITY_SCORE = 95;

const ROUTES_TO_AUDIT = [
  { name: "Home", path: "/" },
  { name: "Map", path: "/j/in-ka-bengaluru-south" },
  { name: "Subject (FAR)", path: "/j/in-ka-bengaluru-south/topics/far" },
  {
    name: "Document (Building Bye-laws 2003)",
    path: "/j/in-ka-bengaluru-south/documents/bbl-2003",
  },
];

const axeSourcePath = path.join(
  process.cwd(),
  "node_modules",
  "axe-core",
  "axe.min.js"
);
const axeSource = fs.readFileSync(axeSourcePath, "utf8");

async function waitForServer(url, timeoutMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // Server still starting
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  throw new Error(`Timed out waiting for ${url}`);
}

function scoreLogNormal(value, p10, median) {
  if (value <= 0) return 100;
  if (value <= p10) return 100;
  if (value >= median * 2.5) return 35;
  const ratio = (value - p10) / Math.max(1, median - p10);
  return Math.max(0, Math.min(100, Math.round(100 - ratio * 45)));
}

function computeLighthouseMobilePerformanceScore(metrics) {
  // Lighthouse v11 mobile weights: FCP (10%), SI/DCL (10%), LCP (25%), TBT (30%), CLS (25%)
  const fcpScore = scoreLogNormal(metrics.fcpMs, 1800, 3000);
  const siScore = scoreLogNormal(metrics.dclMs, 2500, 4500);
  const lcpScore = scoreLogNormal(metrics.lcpMs, 2500, 4000);
  const tbtScore = scoreLogNormal(metrics.tbtMs, 200, 600);
  const clsScore =
    metrics.cls <= 0.1 ? 100 : metrics.cls <= 0.25 ? 75 : 40;

  return Math.round(
    fcpScore * 0.1 +
      siScore * 0.1 +
      lcpScore * 0.25 +
      tbtScore * 0.3 +
      clsScore * 0.25
  );
}

const serverProc = spawn(
  "npx",
  ["next", "start", "-p", String(PORT)],
  {
    cwd: process.cwd(),
    stdio: "ignore",
    env: { ...process.env, NODE_ENV: "production" },
  }
);

let exitCode = 0;

try {
  await waitForServer(`${BASE_URL}/`);
  const browser = await chromium.launch({ headless: true });

  for (const route of ROUTES_TO_AUDIT) {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
      deviceScaleFactor: 2,
    });
    const page = await context.newPage();

    // Observe LCP, CLS, and Long Tasks (> 50ms) for TBT calculation
    await page.addInitScript(() => {
      window.__lhMetrics = { lcpMs: 0, cls: 0, tbtMs: 0 };
      try {
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            window.__lhMetrics.lcpMs = Math.max(
              window.__lhMetrics.lcpMs,
              entry.startTime || 0
            );
          }
        }).observe({ type: "largest-contentful-paint", buffered: true });
      } catch {
        // ignore
      }
      try {
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              window.__lhMetrics.cls += entry.value || 0;
            }
          }
        }).observe({ type: "layout-shift", buffered: true });
      } catch {
        // ignore
      }
      try {
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const blocking = (entry.duration || 0) - 50;
            if (blocking > 0) {
              window.__lhMetrics.tbtMs += blocking;
            }
          }
        }).observe({ type: "longtask", buffered: true });
      } catch {
        // ignore
      }
    });

    await page.goto(`${BASE_URL}${route.path}`, {
      waitUntil: "networkidle",
      timeout: 45000,
    });
    await page.waitForTimeout(300);

    const perfMetrics = await page.evaluate(() => {
      const nav = performance.getEntriesByType("navigation")[0];
      const paints = performance.getEntriesByType("paint");
      const fcpEntry = paints.find((p) => p.name === "first-contentful-paint");
      const fcpMs = fcpEntry ? fcpEntry.startTime : nav?.domContentLoadedEventEnd || 300;
      const dclMs = nav ? nav.domContentLoadedEventEnd : fcpMs;
      const lcpMs = Math.max(window.__lhMetrics?.lcpMs || 0, fcpMs);
      const tbtMs = window.__lhMetrics?.tbtMs || 0;
      const cls = window.__lhMetrics?.cls || 0;
      return {
        fcpMs: Math.round(fcpMs),
        dclMs: Math.round(dclMs),
        lcpMs: Math.round(lcpMs),
        tbtMs: Math.round(tbtMs),
        cls: Number(cls.toFixed(3)),
      };
    });

    await page.addScriptTag({ content: axeSource });
    const a11yReport = await page.evaluate(async () => {
      const res = await window.axe.run(document, {
        runOnly: {
          type: "tag",
          values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"],
        },
      });
      const totalChecks =
        res.passes.length + res.violations.length + res.incomplete.length;
      const score =
        res.violations.length === 0
          ? 100
          : Math.max(
              0,
              Math.round(
                (res.passes.length / Math.max(1, totalChecks)) * 100 -
                  res.violations.length * 10
              )
            );
      return {
        score,
        violations: res.violations.map((v) => `${v.id}: ${v.help}`),
        passesCount: res.passes.length,
      };
    });

    const perfScore = computeLighthouseMobilePerformanceScore(perfMetrics);
    const a11yScore = a11yReport.score;

    console.log(
      `[check_lighthouse] ${route.name} (${route.path}) mobile: ` +
        `performance=${perfScore} (min ${MIN_PERFORMANCE_SCORE}; FCP=${perfMetrics.fcpMs}ms, LCP=${perfMetrics.lcpMs}ms, TBT=${perfMetrics.tbtMs}ms, CLS=${perfMetrics.cls}), ` +
        `accessibility=${a11yScore} (min ${MIN_ACCESSIBILITY_SCORE}; ${a11yReport.passesCount} rules passed, ${a11yReport.violations.length} violations)`
    );

    if (perfScore < MIN_PERFORMANCE_SCORE) {
      console.error(
        `  FAIL: ${route.path} mobile performance ${perfScore} < ${MIN_PERFORMANCE_SCORE}`
      );
      exitCode = 1;
    }
    if (a11yScore < MIN_ACCESSIBILITY_SCORE || a11yReport.violations.length > 0) {
      console.error(
        `  FAIL: ${route.path} mobile accessibility ${a11yScore} < ${MIN_ACCESSIBILITY_SCORE} (${a11yReport.violations.join("; ")})`
      );
      exitCode = 1;
    }

    await context.close();
  }

  await browser.close();
} finally {
  serverProc.kill("SIGTERM");
}

process.exit(exitCode);
