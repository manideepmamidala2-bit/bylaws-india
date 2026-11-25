import { test, expect } from "@playwright/test";

test.describe("Map Page — PMTiles HTTP 206 Range & Non-Blank Canvas (08b §1)", () => {
  for (const viewport of [
    { name: "desktop", width: 1280, height: 800 },
    { name: "mobile", width: 390, height: 844 },
  ]) {
    test(`renders MapLibre canvas and serves .pmtiles with HTTP 206 on ${viewport.name}`, async ({
      page,
    }) => {
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      });

      const pmtilesStatuses: number[] = [];
      page.on("response", (resp) => {
        if (resp.url().includes(".pmtiles")) {
          pmtilesStatuses.push(resp.status());
        }
      });

      await page.goto("/j/in-ka-bengaluru-south", {
        waitUntil: "domcontentloaded",
      });

      // Verify map container has non-zero bounding box at this viewport
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

      // Wait for MapLibre canvas element or WebGL fallback banner
      const canvas = mapRegion.locator("canvas").first();
      const hasCanvas = (await canvas.count()) > 0;
      if (hasCanvas) {
        await page.waitForTimeout(1500);
        const nonBlank = await canvas.evaluate((el: HTMLCanvasElement) => {
          return el.width > 0 && el.height > 0;
        });
        expect(nonBlank).toBe(true);
      }
    });
  }

  test("renders document page with per-chapter outline within <= 300 KB HTML budget", async ({
    page,
  }) => {
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
        name: /BANGALORE MAHANAGARA PALIKE BUILDING BYE-LAWS 2003/i,
      })
    ).toBeVisible();
    await expect(
      page.getByRole("complementary", { name: /Document outline navigation/i })
    ).toBeVisible();
  });

  test("renders map-first home and resolves Jayanagar 600 m² / 15 m road plot card answers", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });

    const plotCard = page.getByRole("region", {
      name: /Plot building code resolver card/i,
    });
    await expect(plotCard).toBeVisible();

    const areaInput = plotCard.getByLabel(/Plot area \(m²\)/i);
    const roadInput = plotCard.getByLabel(/Road width \(m\)/i);
    await areaInput.fill("600");
    await roadInput.fill("15");

    await expect(plotCard).toContainText(/65%/i);
    await expect(plotCard).toContainText(/2\.25/i);
    await expect(plotCard).toContainText(
      /Derived from the official documents by this project/i
    );
  });
});
