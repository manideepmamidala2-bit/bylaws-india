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

test.describe("Bylaw One — Bengaluru Pilot Launch E2E, Accessibility & Screenshot Suite (Parts 1–7)", () => {
  for (const viewport of [
    { name: "desktop", width: 1280, height: 800 },
    { name: "mobile", width: 390, height: 844 },
  ]) {
    test(`Part 2: Map place search -> Place Card -> rule link, sheet overlay opacity, URL hash, and Browse by ward on ${viewport.name}`, async ({
      page,
    }) => {
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      });

      await page.goto("/j/in-ka-bengaluru-south", {
        waitUntil: "domcontentloaded",
      });

      // Verify attribution, coverage line, accuracy line, and layer switch
      await expect(page.getByTestId("map-attribution")).toContainText(
        "Protomaps © OpenStreetMap"
      );
      await expect(page.getByTestId("map-coverage-statement")).toContainText(
        "Land-use zones cover 1.5% of Greater Bengaluru, in parts of Bengaluru South."
      );
      await expect(page.getByTestId("map-accuracy-statement")).toContainText(
        "Zone boundaries are approximate: typically about 8 m from street centre-lines, and within about 21 m in 9 out of 10 places."
      );

      // Search for a place with MiniSearch -> select result -> Place Card updates + URL hash updates
      const searchInput = page.getByTestId("map-place-search-input");
      await searchInput.fill("Jayanagar");
      const resultsList = page.getByTestId("map-place-search-results");
      await expect(resultsList).toBeVisible();
      await resultsList.locator("button").first().click();

      const placeCard = page.getByTestId("place-card");
      await expect(placeCard).toBeVisible();
      await expect(page.getByTestId("place-card-corporation")).toContainText(
        "Bengaluru South City Corporation"
      );
      await expect(page.getByTestId("place-card-group-uses")).toBeVisible();
      await expect(page.getByTestId("place-card-group-far")).toBeVisible();
      await expect(
        page.getByTestId("place-card-group-ground-coverage")
      ).toBeVisible();
      await expect(page.getByTestId("place-card-group-setbacks")).toBeVisible();
      await expect(page.getByTestId("place-card-group-height")).toBeVisible();
      await expect(page.getByTestId("place-card-group-parking")).toBeVisible();

      const currentUrl = page.url();
      expect(currentUrl).toMatch(/#12\.\d+,77\.\d+,15,/);

      await expectZeroAxeViolations(page, `/j/in-ka-bengaluru-south (${viewport.name})`);

      // Capture screenshot: map with place card
      await page.screenshot({
        path: `/tmp/opencode/pilot-map-place-card-${viewport.width}px.png`,
        fullPage: false,
      });
      if (viewport.width === 1280) {
        await page.screenshot({
          path: "public/press/press-map-place-card.png",
          fullPage: false,
        });
      }

      // Enable Original map sheets & adjust opacity slider
      const sheetCheckbox = page.getByTestId("toggle-original-map-sheets");
      await sheetCheckbox.check();
      const opacitySlider = page.getByTestId("map-sheet-opacity-slider");
      await opacitySlider.fill("85");
      await expect(page.getByText(/Sheet opacity: 85%/i)).toBeVisible();

      // Capture screenshot: sheet overlay
      await page.screenshot({
        path: `/tmp/opencode/pilot-sheet-overlay-${viewport.width}px.png`,
        fullPage: false,
      });

      // Follow a rule link from the Place Card to the FAR subject page
      const farLink = page.getByTestId("place-card-subject-link-far");
      await farLink.click();
      await expect(page).toHaveURL(/\/j\/in-ka-bengaluru-south\/topics\/far/);
      await expect(page.getByRole("heading", { name: "FAR" })).toBeVisible();
      if (viewport.width === 1280) {
        await page.screenshot({
          path: "public/press/press-subject-far.png",
          fullPage: false,
        });
      }

      // Browse by ward page (/j/in-ka-bengaluru-south/wards)
      await page.goto("/j/in-ka-bengaluru-south/wards", {
        waitUntil: "domcontentloaded",
      });
      await expect(
        page.getByRole("heading", {
          name: /Browse by ward · Bengaluru South City Corporation/i,
        })
      ).toBeVisible();
      await expect(page.getByTestId("browse-by-ward-directory")).toBeVisible();
      await expect(page.getByTestId("browse-by-ward-zone-rules")).toBeVisible();
      await expectZeroAxeViolations(
        page,
        `/j/in-ka-bengaluru-south/wards (${viewport.name})`
      );
    });

    test(`Parts 3, 4, 5 & 7: Pilot, How we check, Join, Verify task, Press, Use with AI, OG, Sitemap, Robots & 404 on ${viewport.name}`, async ({
      page,
    }) => {
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      });

      // Home page press screenshot
      if (viewport.width === 1280) {
        await page.goto("/", { waitUntil: "domcontentloaded" });
        await expect(page.getByTestId("hero-pilot-line")).toContainText(
          "A working pilot for Bengaluru. Built in the open. Looking for partners."
        );
        await expect(
          page.getByTestId("hero-find-rules-by-place")
        ).toBeVisible();
        await page.screenshot({
          path: "public/press/press-home.png",
          fullPage: false,
        });
      }

      // 1. Pilot page (/pilot)
      await page.goto("/pilot", { waitUntil: "domcontentloaded" });
      await expect(
        page.getByRole("heading", { name: /The Bengaluru Pilot/i })
      ).toBeVisible();
      await expect(page.getByTestId("metric-documents")).toHaveText("16");
      await expect(page.getByTestId("metric-corporations")).toHaveText("5");
      await expect(page.getByTestId("metric-wards")).toHaveText("369");
      await expectZeroAxeViolations(page, `/pilot (${viewport.name})`);
      await page.screenshot({
        path: `/tmp/opencode/pilot-page-${viewport.width}px.png`,
        fullPage: false,
      });

      // 2. Join page (/join)
      await page.goto("/join", { waitUntil: "domcontentloaded" });
      await expect(
        page.getByRole("heading", { name: /Join the pilot/i })
      ).toBeVisible();
      await expect(page.getByTestId("join-section-colleges")).toBeVisible();
      await expect(page.getByTestId("join-section-students")).toBeVisible();
      await expect(
        page.getByTestId("join-section-practitioners")
      ).toBeVisible();
      await expect(page.getByTestId("join-section-civic")).toBeVisible();
      await expectZeroAxeViolations(page, `/join (${viewport.name})`);
      await page.screenshot({
        path: `/tmp/opencode/pilot-join-page-${viewport.width}px.png`,
        fullPage: false,
      });

      // 3. Verify task page (/verify/bengaluru-pilot-sample)
      await page.goto("/verify/bengaluru-pilot-sample", {
        waitUntil: "domcontentloaded",
      });
      await expect(
        page.getByRole("heading", {
          name: /Verify rules against official pages/i,
        })
      ).toBeVisible();
      await page.getByTestId("verifier-name-input").fill("Asha Rao");
      await page
        .getByTestId("verifier-institution-input")
        .fill("RV College of Architecture");
      await page.getByTestId("verdict-match-task-001").click();
      await expect(page.getByTestId("verify-progress-counter")).toContainText(
        "1 of"
      );
      await expectZeroAxeViolations(
        page,
        `/verify/bengaluru-pilot-sample (${viewport.name})`
      );
      await page.screenshot({
        path: `/tmp/opencode/pilot-verify-task-${viewport.width}px.png`,
        fullPage: false,
      });

      // 4. How we check (/checks)
      await page.goto("/checks", { waitUntil: "domcontentloaded" });
      await expect(
        page.getByRole("heading", { name: /How we check/i })
      ).toBeVisible();
      await expect(page.getByTestId("checks-total-human-verified")).toHaveText(
        "0"
      );
      await expectZeroAxeViolations(page, `/checks (${viewport.name})`);
      await page.screenshot({
        path: `/tmp/opencode/pilot-how-we-check-${viewport.width}px.png`,
        fullPage: false,
      });

      // 5. Use with AI (/use-with-ai) & Press (/press)
      await page.goto("/use-with-ai", { waitUntil: "domcontentloaded" });
      await expect(
        page.getByRole("heading", { name: /Use Bylaw One with AI/i })
      ).toBeVisible();
      await expectZeroAxeViolations(page, `/use-with-ai (${viewport.name})`);

      await page.goto("/press", { waitUntil: "domcontentloaded" });
      await expect(
        page.getByRole("heading", { name: /Press kit/i })
      ).toBeVisible();
      await expectZeroAxeViolations(page, `/press (${viewport.name})`);
    });
  }

  test("Part 3 & Part 7: Machine endpoints (/llms.txt, .md mirror, /api/v1/openapi.json, /updates.xml, /sitemap.xml, /robots.txt, /api/og, and friendly 404) respond properly", async ({
    page,
    request,
  }) => {
    for (const endpoint of [
      "/llms.txt",
      "/llms-full.txt",
      "/j/in-ka-bengaluru/topics/far.md",
      "/j/in-ka-bengaluru/documents/bbl-2003.md",
      "/j/in-ka-bengaluru/documents/bbl-2003/part_I__sec_1.0__cl_1.4.md",
      "/api/v1/openapi.json",
      "/api/v1/documents.json",
      "/api/v1/parameters.json",
      "/data/datapackage.json",
      "/updates.xml",
      "/sitemap.xml",
      "/robots.txt",
      "/api/og?title=Bylaw%20One",
    ]) {
      const resp = await request.get(endpoint);
      expect(resp.status(), `Status of ${endpoint}`).toBe(200);
    }

    const resp404 = await page.goto("/non-existent-route-check-404", {
      waitUntil: "domcontentloaded",
    });
    expect(resp404?.status()).toBe(404);
    await expect(page.getByTestId("not-found-page")).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: /We could not find that page in Bylaw One/i,
      })
    ).toBeVisible();
    await expectZeroAxeViolations(page, "404 NotFoundPage");
  });
});
