import { describe, expect, it } from "vitest";
import {
  CODE_SUBJECTS,
  formatParameterConditionsPlain,
  formatParameterValuePlain,
  getRelevantGapNoteForSubject,
  isPlausibleParameterValue,
  resolveCodeSubject,
} from "@/lib/plain-language";
import type { ParameterRecord } from "@/lib/data";

describe("Bylaw One plain-language helpers & 11 code subjects", () => {
  it("defines the 11 canonical code subjects in exact plan order", () => {
    expect(CODE_SUBJECTS.map((s) => s.title)).toEqual([
      "Land use",
      "Ground coverage",
      "FAR",
      "Setbacks",
      "Height",
      "Parking",
      "Basements and stilts",
      "Projections and open spaces",
      "Approvals and certificates",
      "Fire safety",
      "Definitions",
    ]);

    expect(resolveCodeSubject("land-use")?.topicId).toBe("land_use");
    expect(resolveCodeSubject("land_use")?.slug).toBe("land-use");
    expect(resolveCodeSubject("height")?.topicId).toBe("building_height");
    expect(resolveCodeSubject("building_height")?.slug).toBe("height");
    expect(resolveCodeSubject("basements-and-stilts")?.topicId).toBe(
      "basements_stilts"
    );
  });

  it("enforces plausibility bounds per parameter kind", () => {
    expect(isPlausibleParameterValue("far_base_max", 2.25, "ratio")).toBe(true);
    expect(isPlausibleParameterValue("far_base_max", 0.1, "ratio")).toBe(false);
    expect(isPlausibleParameterValue("far_base_max", 15, "ratio")).toBe(false);
    expect(isPlausibleParameterValue("far_base_max", 50, "ratio")).toBe(false);
    expect(isPlausibleParameterValue("far_base_max", 10000, "ratio")).toBe(
      false
    );
    expect(
      isPlausibleParameterValue("far_base_max", 2.0, "ratio", {
        dependent: false,
        plot_area_m2: {
          min: null,
          max: 0.4,
          min_inclusive: true,
          max_inclusive: true,
        },
      })
    ).toBe(false);

    expect(
      isPlausibleParameterValue("setback_front_min_m", 12, "pct_of_plot_depth")
    ).toBe(true);
    expect(isPlausibleParameterValue("setback_front_min_m", 6, "m")).toBe(true);
    expect(isPlausibleParameterValue("setback_front_min_m", 45, "m")).toBe(
      false
    );
  });

  it("formats parameter conditions and values in plain human words with normal units", () => {
    const condText = formatParameterConditionsPlain({
      dependent: false,
      zone: ["R-MAIN"],
      plot_area_m2: {
        min: 360,
        max: 1000,
        min_inclusive: false,
        max_inclusive: true,
      },
      road_width_m: {
        min: 12,
        max: 18,
        min_inclusive: false,
        max_inclusive: true,
      },
    });
    expect(condText).toBe(
      "Residential (Main), plots above 360 up to 1,000 m², roads above 12 up to 18 m"
    );

    const setbackCond = formatParameterConditionsPlain({
      dependent: false,
      building_height_m: {
        min: 15,
        max: 18,
        min_inclusive: false,
        max_inclusive: true,
      },
    });
    expect(setbackCond).toBe("Building height above 15 up to 18 m");

    const sampleRecord = {
      parameter_id: "test:1",
      parameter: "setback_front_min_m",
      value: 12,
      unit: "pct_of_plot_depth",
      value_text: "12% of the depth of site",
      conditions: { dependent: false },
      valid_from: "2026-01-05",
      valid_to: null,
      legal_status: "in_force",
      source: {
        doc_id: "rmp2015-zr-amend-2026-01",
        eid: "item_2_2__item_b",
        clause_id: "rmp2015-zr-amend-2026-01:item_2_2__item_b",
        cell_text: "12% of the depth of site",
        page: 2,
        page_link: "#page=2",
      },
      derived: true,
      method: "table_rule_parser",
      confidence: 0.95,
      verification: "machine_checked",
    } satisfies ParameterRecord;

    expect(formatParameterValuePlain(sampleRecord)).toBe("12% of plot depth");
  });

  it("scopes gap notes only to subjects that the missing zoning amendment can affect", () => {
    expect(getRelevantGapNoteForSubject("far")).toContain("18 July 2025");
    expect(getRelevantGapNoteForSubject("setbacks")).toContain("18 July 2025");
    expect(getRelevantGapNoteForSubject("fire-safety")).toBeNull();
    expect(getRelevantGapNoteForSubject("definitions")).toBeNull();
  });
});
