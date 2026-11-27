import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { getFooterNavItems, getHeaderNavItems } from "@/lib/navigation";
import {
  computeDatasetPilotMetrics,
  formatPluralCount,
} from "@/lib/pilot-metrics";

describe("Part 1 — One Job per Page, Disjoint Navigation, Unified Map Route, Deduplicated Gaps & Consistent Figures", () => {
  it("lists every route with its purpose in docs/site-map.md", () => {
    const siteMapPath = path.join(process.cwd(), "docs", "site-map.md");
    expect(fs.existsSync(siteMapPath)).toBe(true);
    const content = fs.readFileSync(siteMapPath, "utf8");
    for (const route of [
      "`/`",
      "`/j/[id]/topics`",
      "`/j/[id]`",
      "`/j/[id]/wards`",
      "`/j/[id]/timeline`",
      "`/about`",
      "`/pilot`",
      "`/checks`",
      "`/use-with-ai`",
      "`/join`",
      "`/press`",
      "`/j/[id]/sources`",
      "`/data`",
      "`/verify/[taskSet]`",
      "`/guide`",
      "`/guide/slides`",
      "`/bylaw-one-guide.html`",
    ]) {
      expect(content).toContain(route);
    }
  });

  it("drives header and footer from lib/navigation.ts with zero overlapping destinations", () => {
    const headerItems = getHeaderNavItems("in-ka-bengaluru", "home");
    const footerItems = getFooterNavItems("in-ka-bengaluru");

    expect(headerItems.map((i) => i.label)).toEqual([
      "The code",
      "Map",
      "What changed",
      "About",
    ]);
    expect(footerItems.map((i) => i.label)).toEqual([
      "Guide",
      "Pilot",
      "How we check",
      "Use with AI",
      "Join",
      "Press",
      "Sources",
      "Data and downloads",
      "Licence",
    ]);

    const headerHrefs = new Set(headerItems.map((i) => i.href));
    for (const fItem of footerItems) {
      expect(headerHrefs.has(fItem.href)).toBe(false);
    }
  });

  it("formats singular and plural counts cleanly and reports 4 processed sheets and deduplicated July 2025 gap", async () => {
    expect(formatPluralCount(1, "sheet")).toBe("1 sheet");
    expect(formatPluralCount(4, "sheet")).toBe("4 sheets");

    const metrics = await computeDatasetPilotMetrics();
    expect(metrics.processedSheetsCount).toBe(4);
    expect(metrics.processedSheetsLabel).toBe("4 sheets");

    const july2025Items = metrics.missingItems.filter((item) =>
      /July\s+2025/i.test(item)
    );
    expect(july2025Items).toHaveLength(1);
    expect(
      metrics.missingItems.some((item) => /\b1\s+sheets\b/i.test(item))
    ).toBe(false);
  });
});
