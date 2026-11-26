import { describe, expect, it } from "vitest";
import {
  CODE_SUBJECTS,
  computeSubjectBandContinuityNotices,
  formatLandUseZoneGapPlainLine,
  formatMonthYearPlain,
  formatParameterConditionsPlain,
  formatParameterValuePlain,
  formatReplacedByPlain,
  getRelevantGapNoteForSubject,
  isPlausibleParameterValue,
  resolveCodeSubject,
} from "@/lib/plain-language";
import type { DocumentMetadata, ParameterRecord } from "@/lib/data";

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

  it("formats Changed [month year], Replaced by [plain name], [date], and detects the 11.5m-12m setback table band overlap", () => {
    expect(formatMonthYearPlain("2026-01-05")).toBe("January 2026");
    expect(formatMonthYearPlain("2019-06-19")).toBe("June 2019");

    expect(
      formatReplacedByPlain({
        doc_id: "rmp2015-zr-amend-2026-01",
        title:
          "GOVERNMENT OF KARNATAKA No. UDD 235 MNJ 2025(E) date: 05.01.2026 NOTIFICATION (Amendment to Zonal Regulations of Revised Master Plan-2015 of Bengaluru and Greater Bengaluru)",
        effective_from: "2026-01-05",
        notified_date: "2026-01-05",
      })
    ).toBe(
      "Replaced by GOVERNMENT OF KARNATAKA No. UDD 235 MNJ 2025(E) date: 05.01.2026 NOTIFICATION (Amendment to Zonal Regulations of Revised Master Plan-2015 of Bengaluru and Greater Bengaluru), 5 January 2026"
    );

    expect(
      formatLandUseZoneGapPlainLine("Bengaluru South City Corporation")
    ).toBe(
      "Land-use zones are available for parts of Bengaluru South only. Elsewhere the map shows boundaries and wards."
    );

    const lowRiseRecord: ParameterRecord = {
      parameter_id: "test:low",
      parameter: "setback_front_min_m",
      value: 12,
      unit: "pct_of_plot_depth",
      value_text: "12% of the depth of site",
      conditions: {
        dependent: false,
        building_height_m: {
          min: null,
          max: 12.0,
          min_inclusive: true,
          max_inclusive: true,
        },
      },
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
    };

    const highRiseRecord: ParameterRecord = {
      ...lowRiseRecord,
      parameter_id: "test:high",
      value: 5.0,
      unit: "m",
      value_text: "5.0 m",
      conditions: {
        dependent: false,
        building_height_m: {
          min: 11.5,
          max: 15.0,
          min_inclusive: false,
          max_inclusive: true,
        },
      },
      valid_from: "2007-06-25",
      source: {
        doc_id: "rmp2015-zr",
        eid: "chp_3__cl_3.4__tbl_9",
        clause_id: "rmp2015-zr:chp_3__cl_3.4__tbl_9",
        cell_text: "5.0 m",
        page: 21,
        page_link: "#page=21",
      },
    };

    const docMap = new Map<
      string,
      Pick<
        DocumentMetadata,
        "doc_id" | "title" | "effective_from" | "notified_date"
      >
    >([
      [
        "rmp2015-zr-amend-2026-01",
        {
          doc_id: "rmp2015-zr-amend-2026-01",
          title:
            "GOVERNMENT OF KARNATAKA No. UDD 235 MNJ 2025(E) date: 05.01.2026 NOTIFICATION (Amendment to Zonal Regulations of Revised Master Plan-2015 of Bengaluru and Greater Bengaluru)",
          effective_from: "2026-01-05",
          notified_date: "2026-01-05",
        },
      ],
      [
        "rmp2015-zr",
        {
          doc_id: "rmp2015-zr",
          title:
            "Revised Master Plan 2015 Volume III Zoning of Landuse and Regulations",
          effective_from: "2007-06-25",
          notified_date: "2007-06-22",
        },
      ],
    ]);

    // Constructed overlap with no applicability rule -> shown as "Not settled"
    const noticesUnsettled = computeSubjectBandContinuityNotices(
      "setbacks",
      [lowRiseRecord, highRiseRecord],
      docMap,
      []
    );
    expect(noticesUnsettled).toHaveLength(1);
    expect(noticesUnsettled[0].headline).toContain(
      "The current tables overlap between 11.5 m and 12 m"
    );
    expect(noticesUnsettled[0].sourceA.page).toBe(2);
    expect(noticesUnsettled[0].sourceB.page).toBe(21);

    // When applicability rule (clauses 3.1(ii) and (iii)) settles 11.5 m to 12 m -> NOT shown as "Not settled"
    const noticesSettled = computeSubjectBandContinuityNotices(
      "setbacks",
      [lowRiseRecord, highRiseRecord],
      docMap,
      [{ dimension: "building_height_m", range_settled: "11.5 m to 12 m" }]
    );
    expect(noticesSettled).toHaveLength(0);
  });
});
