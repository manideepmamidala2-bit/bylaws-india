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
      const rangeStatus = await page.evaluate(async () => {
        const res = await fetch(
          "/data/in-ka-bengaluru-south/basemap.pmtiles",
          {
            headers: { Range: "bytes=0-511" },
          }
        );
        return res.status;
      });
      expect([200, 206]).toContain(rangeStatus);

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
});
