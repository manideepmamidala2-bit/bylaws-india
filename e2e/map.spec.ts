import { test, expect } from "@playwright/test";

test.describe("Bylaw One — Home, Subject, Document & Map E2E Suite", () => {
  for (const viewport of [
    { name: "desktop", width: 1280, height: 800 },
    { name: "mobile", width: 390, height: 844 },
  ]) {
    test(`renders Home page 5-step FAR story, 11 subjects, and header/footer with no map or plot inputs on ${viewport.name}`, async ({
      page,
    }) => {
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      });

      await page.goto("/", { waitUntil: "domcontentloaded" });

      // Wordmark & Hero
      await expect(
        page.getByRole("banner").getByRole("link", { name: "Bylaw One" })
      ).toBeVisible();
      await expect(
        page.getByRole("heading", {
          name: /Bengaluru's building rules\. One code\./i,
        })
      ).toBeVisible();

      // Mobile vs desktop header behavior & >= 44px tap targets
      const searchBtn = page.getByTestId("header-search-toggle");
      await expect(searchBtn).toBeVisible();
      const sBox = await searchBtn.boundingBox();
      expect(sBox).not.toBeNull();
      expect(sBox!.height).toBeGreaterThanOrEqual(44);
      expect(sBox!.width).toBeGreaterThanOrEqual(44);

      if (viewport.width === 390) {
        const menuBtn = page.getByTestId("header-menu-toggle");
        await expect(menuBtn).toBeVisible();
        const mBox = await menuBtn.boundingBox();
        expect(mBox).not.toBeNull();
        expect(mBox!.height).toBeGreaterThanOrEqual(44);
        await menuBtn.click();
        const mobileNav = page.getByTestId("mobile-nav-menu");
        await expect(mobileNav).toBeVisible();
        await expect(
          mobileNav.getByRole("link", { name: "The code" })
        ).toBeVisible();
        await expect(
          mobileNav.getByRole("link", { name: "Map" })
        ).toBeVisible();
        await expect(
          mobileNav.getByRole("link", { name: "What changed" })
        ).toBeVisible();
        await expect(
          mobileNav.getByRole("link", { name: "About" })
        ).toBeVisible();
        await menuBtn.click();
      } else {
        const primaryNav = page.getByRole("navigation", {
          name: "Primary navigation",
        });
        await expect(
          primaryNav.getByRole("link", { name: "The code" })
        ).toBeVisible();
        await expect(
          primaryNav.getByRole("link", { name: "Map" })
        ).toBeVisible();
        await expect(
          primaryNav.getByRole("link", { name: "What changed" })
        ).toBeVisible();
        await expect(
          primaryNav.getByRole("link", { name: "About" })
        ).toBeVisible();
      }

      // 01 / The problem
      await expect(
        page.getByRole("heading", { name: /Many sources\. One building\./i })
      ).toBeVisible();

      // 02 / Follow one rule: FAR (all 5 steps with verbatim excerpts and working page links)
      const stepper = page.getByTestId("far-story-stepper");
      await expect(stepper).toBeVisible();
      for (let i = 1; i <= 5; i++) {
        const excerpt = page.getByTestId(`far-story-excerpt-${i}`);
        await expect(excerpt).toBeVisible();
        const txt = await excerpt.textContent();
        expect((txt ?? "").length).toBeGreaterThan(40);

        const viewPage = page.getByTestId(`far-story-view-page-${i}`);
        await expect(viewPage).toBeVisible();
        const href = await viewPage.getAttribute("href");
        expect(href).toMatch(/#page=\d+$/);
      }

      // Verify Step 2 & Step 3 attributions on Home page
      const step2 = page.getByTestId("far-story-step-2");
      await expect(step2).toContainText(
        "Table 10: FAR and Ground Coverage in Residential (Main)"
      );
      await expect(step2).toContainText(
        "Shown from Table 10's own caption and column headings on p. 28"
      );
      const step3 = page.getByTestId("far-story-step-3");
      await expect(step3).toContainText(
        "Building Bye-laws 2003, bye-law 1.4 (inserted by notification UDD 14 TTP 2017, 28 October 2017)"
      );
      await expect(step3).toContainText(
        "This notification also issued the Model Building Bye-laws, which do not otherwise apply in Bengaluru."
      );
      await step2.scrollIntoViewIfNeeded();
      await page.screenshot({
        path: `/tmp/opencode/home-steps-2-3-${viewport.width}px.png`,
        fullPage: false,
      });

      // 03 / The code, by subject (11 subjects)
      const subjectList = page.getByTestId("home-subject-list");
      await expect(subjectList.locator("li")).toHaveCount(11);

      // Closing & Footer
      await expect(
        page.getByRole("heading", { name: /Read\. Trace\. Compare\./i })
      ).toBeVisible();
      const footer = page.getByRole("contentinfo");
      await expect(footer.getByRole("link", { name: "Guide" })).toBeVisible();
      await expect(footer.getByRole("link", { name: "Pilot" })).toBeVisible();
      await expect(
        footer.getByRole("link", { name: "How we check" })
      ).toBeVisible();
      await expect(footer.getByRole("link", { name: "Sources" })).toBeVisible();
      await expect(
        footer.getByRole("link", { name: "Data and downloads" })
      ).toBeVisible();
      await expect(footer.getByRole("link", { name: "Licence" })).toBeVisible();
      await expect(footer.getByRole("link", { name: "Map" })).toHaveCount(0);

      // Zero map canvas and zero plot inputs on Home
      await expect(
        page.getByRole("region", { name: /MapLibre GL JS street map canvas/i })
      ).toHaveCount(0);
      await expect(page.getByLabel(/Plot area/i)).toHaveCount(0);
      await expect(page.getByLabel(/Road width/i)).toHaveCount(0);

      await page.screenshot({
        path: `/tmp/opencode/home-${viewport.width}px.png`,
        fullPage: false,
      });
    });

    test(`renders Subject pages (Setbacks & FAR) at city level and for Bengaluru South with supersession, deduplication, band overlap notice, and corporation layer line on ${viewport.name}`, async ({
      page,
    }) => {
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      });

      // 1. City-level Setbacks
      await page.goto("/j/in-ka-bengaluru/topics/setbacks", {
        waitUntil: "domcontentloaded",
      });
      await expect(
        page.getByRole("heading", { name: "Setbacks" })
      ).toBeVisible();
      await expect(
        page.getByRole("heading", { name: "What applies today" })
      ).toBeVisible();
      await expect(page.getByTestId("band-continuity-notice")).toHaveCount(0);
      await expect(page.getByTestId("applicability-rule-line")).toContainText(
        "Buildings up to 12 m use Table 8; taller buildings use Table 9 (clauses 3.1(ii) and (iii), January 2026)."
      );

      const paramTable = page.getByTestId("subject-parameter-table");
      await expect(paramTable).toBeVisible();
      await expect(paramTable).toContainText(
        /Building height above 15 up to 18 m/i
      );
      await expect(paramTable).toContainText(/6 m/);
      await expect(paramTable).toContainText(/12% of plot depth/);
      await expect(paramTable).toContainText(/Zoning amendment, 5 January 2026/i);
      await paramTable.scrollIntoViewIfNeeded();
      await page.screenshot({
        path: `/tmp/opencode/subject-source-column-${viewport.width}px.png`,
        fullPage: false,
      });

      const olderDetails = page.getByTestId("older-or-replaced-rules");
      await expect(olderDetails).toBeVisible();
      expect(await olderDetails.getAttribute("open")).toBeNull();
      const cityDatasetId = await page.locator("main").getAttribute("data-dataset-id");
      expect(cityDatasetId).toMatch(/^ds-[0-9a-f]{12}$/);

      // Part 1.5: 3.1(ii) in January 2026 wording, 2007 industrial row under replaced rules, no Replaced label on bye-law 1.4
      await expect(page.getByTestId("governing-provisions-list")).toContainText(
        /height up to 12\.0m, excluding the stilt floor, the setbacks shall be calculated as per Table 8/i
      );
      await olderDetails.locator("summary").click();
      await expect(page.getByTestId("older-parameter-table")).toContainText(
        /Industrial \(General\), plots up to 500 m²/i
      );
      await expect(page.getByTestId("older-parameter-table")).toContainText(
        /4\.5 m/
      );
      await expect(olderDetails).not.toContainText(/1\.4\b.*Replaced/i);
      await olderDetails.locator("summary").click();
      await expect(page.getByLabel(/Plot area/i)).toHaveCount(0);

      await page.screenshot({
        path: `/tmp/opencode/city-setbacks-${viewport.width}px.png`,
        fullPage: false,
      });

      // 1b. Bengaluru North Setbacks (same dataset_id, shared content parity)
      await page.goto("/j/in-ka-bengaluru-north/topics/setbacks", {
        waitUntil: "domcontentloaded",
      });
      const northDatasetId = await page.locator("main").getAttribute("data-dataset-id");
      expect(northDatasetId).toBe(cityDatasetId);
      await expect(page.getByTestId("corporation-layer-notice")).toContainText(
        "Showing Greater Bengaluru rules, with differences for Bengaluru North City Corporation."
      );
      await expect(
        page.getByTestId("corporation-no-differences")
      ).toContainText(
        "No differences for Bengaluru North City Corporation on this subject."
      );
      await page.screenshot({
        path: `/tmp/opencode/corp-north-setbacks-${viewport.width}px.png`,
        fullPage: false,
      });

      // 2. City-level FAR
      await page.goto("/j/in-ka-bengaluru/topics/far", {
        waitUntil: "domcontentloaded",
      });
      await expect(page.getByRole("heading", { name: "FAR" })).toBeVisible();
      await page.screenshot({
        path: `/tmp/opencode/city-far-${viewport.width}px.png`,
        fullPage: false,
      });

      // 3. Bengaluru South Setbacks
      await page.goto("/j/in-ka-bengaluru-south/topics/setbacks", {
        waitUntil: "domcontentloaded",
      });
      await expect(page.getByTestId("corporation-layer-notice")).toContainText(
        "Showing Greater Bengaluru rules, with differences for Bengaluru South City Corporation."
      );
      await expect(
        page.getByTestId("corporation-no-differences")
      ).toContainText(
        "No differences for Bengaluru South City Corporation on this subject."
      );
      await page.screenshot({
        path: `/tmp/opencode/corp-south-setbacks-${viewport.width}px.png`,
        fullPage: false,
      });

      // 4. Bengaluru South FAR
      await page.goto("/j/in-ka-bengaluru-south/topics/far", {
        waitUntil: "domcontentloaded",
      });
      await expect(page.getByTestId("corporation-layer-notice")).toContainText(
        "Showing Greater Bengaluru rules, with differences for Bengaluru South City Corporation."
      );
      await page.screenshot({
        path: `/tmp/opencode/corp-south-far-${viewport.width}px.png`,
        fullPage: false,
      });
    });

    test(`renders MapLibre canvas, plain land-use zone gap notice, and serves .pmtiles with HTTP 206 without plot inputs on ${viewport.name}`, async ({
      page,
    }) => {
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      });

      await page.goto("/j/in-ka-bengaluru-south", {
        waitUntil: "domcontentloaded",
      });

      await expect(page.getByTestId("map-zone-gap-notice")).toHaveText(
        "Land-use zones are available for parts of Bengaluru South only. Elsewhere the map shows boundaries and wards."
      );

      const mapRegion = page.getByRole("region", {
        name: /MapLibre GL JS street map canvas/i,
      });
      await expect(mapRegion).toBeVisible();
      const box = await mapRegion.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.width).toBeGreaterThan(200);
      expect(box!.height).toBeGreaterThan(200);

      // Verify direct HTTP Range request against basemap.pmtiles returns 206 Partial Content
      const rangeCheck = await page.evaluate(async () => {
        const res = await fetch(
          "/data/in-ka-bengaluru-south/basemap.pmtiles",
          {
            headers: { Range: "bytes=0-511" },
          }
        );
        return {
          status: res.status,
          contentRange: res.headers.get("content-range"),
          acceptRanges: res.headers.get("accept-ranges"),
        };
      });
      expect(rangeCheck.status).toBe(206);
      expect(rangeCheck.contentRange).toMatch(/^bytes 0-511\//);
      expect(rangeCheck.acceptRanges).toBe("bytes");

      // Location summary shows area, ward, corporation and zone only (no plot inputs)
      await expect(page.getByTestId("map-location-summary")).toBeVisible();
      await expect(page.getByTestId("map-accuracy-statement")).toContainText(
        "Zone boundaries are approximate: typically about 8 m from street centre-lines, and within about 21 m in 9 out of 10 places."
      );
      await expect(page.getByLabel(/Plot area/i)).toHaveCount(0);
      await expect(page.getByLabel(/Road width/i)).toHaveCount(0);
      await page.screenshot({
        path: `/tmp/opencode/map-${viewport.width}px.png`,
        fullPage: false,
      });
    });
  }

  test("renders document page within <= 300 KB HTML budget, expands a provision on tap, and omits the 4 March 2026 South draft notice", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    const resp = await page.goto(
      "/j/in-ka-bengaluru-south/documents/bbl-2003",
      { waitUntil: "domcontentloaded" }
    );
    expect(resp).not.toBeNull();
    expect(resp!.status()).toBe(200);
    const bodyBuffer = await resp!.body();
    expect(bodyBuffer.byteLength).toBeLessThanOrEqual(300 * 1024);

    await expect(
      page.getByRole("heading", {
        name: /Building Bye-laws 2003/i,
      })
    ).toBeVisible();
    await expect(
      page.getByTestId("document-page-header")
    ).toContainText(/BANGALORE MAHANAGARA PALIKE BUILDING BYE-LAWS 2003/i);
    await expect(
      page.getByRole("complementary", { name: /Document outline navigation/i })
    ).toBeVisible();

    // No 4 March 2026 South draft notice on in-force document page
    await expect(page.getByText(/04-03-2026/i)).toHaveCount(0);

    const firstDetailsSummary = page
      .locator('[data-testid^="provision-details-"] summary')
      .first();
    await firstDetailsSummary.click();
    await expect(page.getByText(/Address:/i).first()).toBeVisible();

    await page.screenshot({
      path: "/tmp/opencode/document-bbl2003-1280px.png",
      fullPage: false,
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({
      path: "/tmp/opencode/document-bbl2003-390px.png",
      fullPage: false,
    });
  });
});
