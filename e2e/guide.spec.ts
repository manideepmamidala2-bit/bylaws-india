import fs from "node:fs";
import path from "node:path";
import { test, expect, type Page } from "@playwright/test";

const axeSource = fs.readFileSync(
  path.join(process.cwd(), "node_modules", "axe-core", "axe.min.js"),
  "utf8"
);

async function expectZeroAxeViolations(page: Page, routeLabel: string) {
  await page.addScriptTag({ content: axeSource });
  const violations = await page.evaluate(async () => {
    // @ts-expect-error axe is injected onto window
    const res = await window.axe.run(document, {
      runOnly: {
        type: "tag",
        values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"],
      },
    });
    return res.violations.map(
      (v: { id: string; help: string }) => `${v.id}: ${v.help}`
    );
  });
  expect(violations, `WCAG 2.2 AA violations on ${routeLabel}`).toEqual([]);
}

test.describe("Bylaw One — The Guide (/guide, /guide/slides, and offline bylaw-one-guide.html)", () => {
  for (const viewport of [
    { name: "desktop", width: 1280, height: 800 },
    { name: "mobile", width: 390, height: 844 },
  ]) {
    test(`Parts 3 & 4: /guide reading mode and /guide/slides reveal.js presentation mode on ${viewport.name}`, async ({
      page,
    }) => {
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      });

      // 1. Reading mode (/guide)
      await page.goto("/guide", { waitUntil: "domcontentloaded" });
      await expect(
        page.getByRole("heading", { name: "The Bylaw One Guide" })
      ).toBeVisible();
      await expect(page.getByTestId("guide-present-btn")).toBeVisible();
      await expect(page.getByTestId("guide-download-btn")).toBeVisible();
      await expect(page.getByTestId("guide-sticky-contents")).toBeVisible();

      // Audience entry points
      await page.getByTestId("audience-btn-college").click();
      await expect(page.getByTestId("audience-selected-path")).toBeVisible();
      await expect(page.getByTestId("audience-selected-path")).toContainText(
        "Colleges & faculties"
      );

      await expectZeroAxeViolations(page, `/guide (${viewport.name})`);
      await page.screenshot({
        path: `/tmp/opencode/guide-reading-${viewport.width}px.png`,
        fullPage: false,
      });

      // 2. Click "Start from section" on "See it working" -> opens /guide/slides at #slide-see-it-working
      await page.getByTestId("start-slides-see-it-working").click();
      await expect(page).toHaveURL(/\/guide\/slides#slide-see-it-working/);
      await expect(page.getByTestId("guide-slides-deck")).toBeVisible();
      await expect(
        page.getByRole("heading", { name: "See it working" })
      ).toBeVisible();

      // Navigate with keyboard ArrowRight and toggle Speaker view
      await page.keyboard.press("ArrowRight");
      await page.getByTestId("slides-speaker-view-btn").click();
      await expect(
        page.getByTestId("guide-speaker-view-panel")
      ).toBeVisible();
      await expect(
        page.getByTestId("speaker-view-notes-text")
      ).not.toBeEmpty();

      await expectZeroAxeViolations(page, `/guide/slides (${viewport.name})`);
      if (viewport.width === 1280) {
        await page.screenshot({
          path: `/tmp/opencode/guide-slides-${viewport.width}px.png`,
          fullPage: false,
        });
      }
    });
  }

  test("Part 5: bylaw-one-guide.html works in both reading mode and slide mode with the network disabled (<= 10 MB, 0 network requests)", async ({
    browser,
    page: onlinePage,
  }) => {
    const bundlePath = path.join(
      process.cwd(),
      "public",
      "bylaw-one-guide.html"
    );
    expect(fs.existsSync(bundlePath)).toBe(true);
    const sizeBytes = fs.statSync(bundlePath).size;
    expect(sizeBytes).toBeLessThanOrEqual(10 * 1024 * 1024);

    // Also verify /data links to /bylaw-one-guide.html and capture Home + Footer screenshots after clean-up
    await onlinePage.setViewportSize({ width: 1280, height: 800 });
    await onlinePage.goto("/data", { waitUntil: "domcontentloaded" });
    await expect(
      onlinePage.getByTestId("download-offline-guide-link")
    ).toHaveAttribute("href", "/bylaw-one-guide.html");

    await onlinePage.goto("/", { waitUntil: "domcontentloaded" });
    await onlinePage.screenshot({
      path: "/tmp/opencode/home-cleaned-1280px.png",
      fullPage: false,
    });
    const footer = onlinePage.getByRole("contentinfo");
    await footer.scrollIntoViewIfNeeded();
    await onlinePage.screenshot({
      path: "/tmp/opencode/footer-cleaned-1280px.png",
      fullPage: false,
    });

    // Open bylaw-one-guide.html in a fresh browser context with network disabled
    const offlineContext = await browser.newContext({
      viewport: { width: 1280, height: 800 },
    });
    const externalNetworkRequests: string[] = [];
    offlineContext.on("request", (req) => {
      const url = req.url();
      if (!url.startsWith("data:")) {
        externalNetworkRequests.push(url);
      }
    });

    const offlinePage = await offlineContext.newPage();
    await offlineContext.setOffline(true);

    const htmlContent = fs.readFileSync(bundlePath, "utf8");
    await offlinePage.setContent(htmlContent, {
      waitUntil: "domcontentloaded",
    });

    expect(externalNetworkRequests).toEqual([]);

    // Verify title page metadata (release, dataset ID, date generated)
    const metaText = await offlinePage
      .getByTestId("offline-release-meta")
      .textContent();
    expect(metaText).toMatch(/Release v4\.0\.0/);
    expect(metaText).toMatch(/Dataset ds-[0-9a-f]{12}/);
    expect(metaText).toContain("Generated 27 November 2026");

    // Verify reading mode works offline
    await expect(
      offlinePage.getByTestId("offline-reading-mode")
    ).toBeVisible();
    await expect(
      offlinePage.getByTestId("offline-sticky-contents")
    ).toBeVisible();
    await offlinePage.getByTestId("offline-audience-btn-practitioner").click();
    await expect(
      offlinePage.getByTestId("offline-audience-path")
    ).toContainText("Architects, planners, engineers & lawyers");

    // Verify inline SVG diagram and base64 screenshot decoded properly offline
    const svgCount = await offlinePage
      .locator('[data-testid^="offline-diagram-"] svg')
      .count();
    expect(svgCount).toBe(6);

    const imgLoaded = await offlinePage.evaluate(() => {
      const img = document.querySelector(
        '[data-testid="offline-screenshot-home-hero"] img'
      ) as HTMLImageElement | null;
      return Boolean(img && img.complete && img.naturalWidth > 200);
    });
    expect(imgLoaded).toBe(true);

    await expectZeroAxeViolations(
      offlinePage,
      "bylaw-one-guide.html (reading mode, offline)"
    );

    // Switch to slide mode via the "Present (slide mode)" toggle
    await offlinePage.getByTestId("offline-mode-toggle").click();
    await expect(offlinePage.getByTestId("offline-slide-mode")).toBeVisible();
    await expect(
      offlinePage.getByTestId("offline-reading-mode")
    ).toBeHidden();
    await expect(
      offlinePage.getByTestId("offline-slide-counter")
    ).toContainText("Slide 1 / 24");

    // Navigate slides via keyboard and open Speaker view presenter notes
    await offlinePage.keyboard.press("ArrowRight");
    await expect(
      offlinePage.getByTestId("offline-slide-counter")
    ).toContainText("Slide 2 / 24");

    await offlinePage.getByTestId("offline-slide-notes-toggle").click();
    await expect(
      offlinePage.getByTestId("offline-speaker-panel")
    ).toBeVisible();
    await expect(
      offlinePage.getByTestId("offline-speaker-notes-text")
    ).not.toBeEmpty();

    await offlinePage.screenshot({
      path: "/tmp/opencode/guide-offline-1280px.png",
      fullPage: false,
    });

    expect(externalNetworkRequests).toEqual([]);
    await offlineContext.close();
  });
});
