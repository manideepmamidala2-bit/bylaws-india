import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type {
  GenericFeatureCollection,
  JurisdictionConsolidated,
  JurisdictionParameters,
  StatutoryResolutionConfig,
  ZonesFeatureCollection,
} from "@/lib/data";
import {
  lookupPlotGeography,
  resolvePlotParameters,
} from "@/lib/resolver";

const southBaseDir = path.join(
  process.cwd(),
  "public",
  "data",
  "in-ka-bengaluru-south"
);
const southDir = fs.existsSync(path.join(southBaseDir, "5.0.0", "parameters.json"))
  ? path.join(southBaseDir, "5.0.0")
  : path.join(southBaseDir, "4.0.0");

function readJson<T>(filename: string): T {
  return JSON.parse(
    fs.readFileSync(path.join(southDir, filename), "utf8")
  ) as T;
}

describe("Part 4 — Deterministic Browser Plot Resolver & Jayanagar Worked Target", () => {
  it("resolves Jayanagar 600 m² plot on 15 m road in Residential (Main) identically to Python resolver", () => {
    const parametersPayload = readJson<JurisdictionParameters>("parameters.json");
    const resolutionConfig = readJson<StatutoryResolutionConfig>("resolution.json");
    const consolidatedPayload =
      readJson<JurisdictionConsolidated>("consolidated.json");
    const boundaryFc = readJson<GenericFeatureCollection>("boundary.geojson");
    const wardsFc = readJson<GenericFeatureCollection>("wards.geojson");
    const pdFc = readJson<GenericFeatureCollection>(
      "planning-districts.geojson"
    );
    const zonesFc = readJson<ZonesFeatureCollection>("zones.geojson");
    const overlaysFc = readJson<GenericFeatureCollection>("overlays.geojson");

    const geo = lookupPlotGeography({
      lat: 12.918125,
      lon: 77.603191,
      explicitCorporationId: "in-ka-bengaluru-south",
      boundaryFc,
      wardsFc,
      planningDistrictsFc: pdFc,
      zonesFc,
      overlaysFc,
    });

    expect(geo.corporation_id).toBe("in-ka-bengaluru-south");
    expect(geo.ward_id).toBe("11");
    expect(geo.ward_name).toContain("Jayanagar");
    expect(geo.zone_code).toBe("R-MAIN");
    expect(geo.zone_source).toBe("polygon_lookup");

    const result = resolvePlotParameters({
      parametersPayload,
      resolutionConfig,
      corporationId: "in-ka-bengaluru-south",
      zoneCode: geo.zone_code,
      plotAreaM2: 600,
      roadWidthM: 15,
      plotDepthM: 30,
      plotWidthM: 20,
      buildingHeightM: 11.5,
      use: "residential",
      asOfDate: "2026-11-25",
      consolidatedPayload,
      geography: geo,
    });

    expect(result.derived).toBe(true);
    expect(result.notice).toContain(
      "Worked out from the official documents by this site. Confirm with the planning authority or a qualified professional."
    );

    const cov = result.parameters.ground_coverage_max_pct;
    expect(cov.status).toBe("resolved");
    expect(cov.value).toBe(65);
    expect(cov.unit).toBe("%");
    expect(cov.computed_value).toBe(390);
    expect(cov.governing_record?.source.doc_id).toBe("rmp2015-zr");
    expect(cov.governing_record?.source.page).toBe(28);
    expect(cov.resolution_step?.step_id).toBe("zoning_governs_via_byelaw_1_4");

    const far = result.parameters.far_base_max;
    expect(far.status).toBe("resolved");
    expect(far.value).toBe(2.25);
    expect(far.computed_value).toBe(1350);
    expect(far.governing_record?.source.doc_id).toBe("rmp2015-zr");
    expect(far.governing_record?.source.page).toBe(28);

    const front = result.parameters.setback_front_min_m;
    expect(front.status).toBe("resolved");
    expect(front.value).toBe(12);
    expect(front.unit).toBe("pct_of_plot_depth");
    expect(front.computed_value).toBe(3.6);
    expect(front.governing_record?.source.doc_id).toBe(
      "rmp2015-zr-amend-2026-01"
    );
    expect(front.governing_record?.source.page).toBe(2);
    expect(front.resolution_step?.step_id).toBe("lex_posterior_within_family");

    const rear = result.parameters.setback_rear_min_m;
    expect(rear.value).toBe(8);
    expect(rear.computed_value).toBe(2.4);

    const side = result.parameters.setback_side_min_m;
    expect(side.value).toBe(8);
    expect(side.computed_value).toBe(1.6);

    const pfar = result.parameters.far_premium_additional_max;
    expect(pfar.value).toBe(0.3);
    expect(pfar.computed_value).toBe(0.675);
    expect(pfar.governing_record?.source.doc_id).toBe(
      "rmp2015-zr-amend-2025-04"
    );

    const tdr = result.parameters.tdr_receivable_max;
    expect(tdr.value).toBe(0.1);
    expect(tdr.computed_value).toBe(0.225);

    expect(result.corporation_changes.length).toBeGreaterThanOrEqual(4);
  });

  it("handles unknown zones outside processed sheets and reports 'not_settled' when two rules tie", () => {
    const parametersPayload = readJson<JurisdictionParameters>("parameters.json");
    const resolutionConfig = readJson<StatutoryResolutionConfig>("resolution.json");

    const unknownGeo = lookupPlotGeography({
      lat: 13.05,
      lon: 77.59,
      explicitCorporationId: "in-ka-bengaluru-north",
      zonesFc: { type: "FeatureCollection", features: [] },
    });
    expect(unknownGeo.zone_code).toBe("unknown");
    expect(unknownGeo.zone_label).toBe("Zone data not yet available here");

    const clonedParams: JurisdictionParameters = JSON.parse(
      JSON.stringify(parametersPayload)
    );
    const targetRec = clonedParams.records.find(
      (r) =>
        r.parameter === "far_base_max" &&
        r.source.doc_id === "rmp2015-zr" &&
        r.value === 2.25
    )!;
    clonedParams.records.push({
      ...targetRec,
      parameter_id: "planted:tie_browser",
      value: 2.4,
      value_text: "2.40",
    });

    const tiedResult = resolvePlotParameters({
      parametersPayload: clonedParams,
      resolutionConfig,
      corporationId: "in-ka-bengaluru-south",
      zoneCode: "R-MAIN",
      plotAreaM2: 600,
      roadWidthM: 15,
    });
    expect(tiedResult.parameters.far_base_max.status).toBe("not_settled");
    expect(tiedResult.parameters.far_base_max.tied_records).toHaveLength(2);
    expect(tiedResult.parameters.far_base_max.display_value).toContain(
      "Not settled: two rules apply"
    );
  });

  it("returns 'needs depth/width/height' without assuming dimensions and distinguishes 'No limit in the law for this case' from 'Not covered by our data yet' across the four review plots", () => {
    const parametersPayload = readJson<JurisdictionParameters>("parameters.json");
    const resolutionConfig = readJson<StatutoryResolutionConfig>("resolution.json");

    // 1. 600 m² on 15 m road in Residential (Main) without depth/width/height
    const p1 = resolvePlotParameters({
      parametersPayload,
      resolutionConfig,
      corporationId: "in-ka-bengaluru-south",
      zoneCode: "R-MAIN",
      plotAreaM2: 600,
      roadWidthM: 15,
      use: "residential",
    });
    expect(p1.inputs.plot_depth_m).toBeNull();
    expect(p1.inputs.plot_width_m).toBeNull();
    expect(p1.inputs.building_height_m).toBeNull();
    expect(p1.parameters.setback_front_min_m.status).toBe("needs_depth");
    expect(p1.parameters.setback_front_min_m.display_value).toContain(
      "needs depth"
    );
    expect(p1.parameters.setback_rear_min_m.status).toBe("needs_depth");
    expect(p1.parameters.setback_side_min_m.status).toBe("needs_width");
    expect(p1.parameters.setback_side_min_m.display_value).toContain(
      "needs width"
    );
    expect(p1.parameters.building_height_max_m.status).toBe("no_limit_in_law");
    expect(p1.parameters.building_height_max_m.display_value).toBe(
      "No limit in the law for this case"
    );
    expect(
      p1.parameters.building_height_max_m.no_limit_authority?.doc_id
    ).toBe("rmp2015-zr-amend-2026-01");
    expect(p1.parameters.building_height_max_m.no_limit_authority?.page).toBe(5);
    expect(p1.parameters.floors_max.status).toBe("no_limit_in_law");

    // 2. 150 m² on 9 m road in Residential (Main)
    const p2 = resolvePlotParameters({
      parametersPayload,
      resolutionConfig,
      corporationId: "in-ka-bengaluru-south",
      zoneCode: "R-MAIN",
      plotAreaM2: 150,
      roadWidthM: 9,
      use: "residential",
    });
    expect(p2.parameters.ground_coverage_max_pct.value).toBe(75);
    expect(p2.parameters.far_base_max.value).toBe(1.75);
    expect(p2.parameters.far_premium_additional_max.status).toBe(
      "no_limit_in_law"
    );
    expect(p2.parameters.tdr_receivable_max.status).toBe("no_limit_in_law");
    expect(p2.parameters.building_height_max_m.value).toBe(12);
    expect(p2.parameters.floors_max.status).toBe("no_limit_in_law");
    expect(p2.parameters.setback_front_min_m.status).toBe("needs_height");
    expect(p2.parameters.setback_front_min_m.display_value).toBe("needs height");

    // 3. 3,000 m² commercial (`C-BIZ`) on 24 m road
    const p3 = resolvePlotParameters({
      parametersPayload,
      resolutionConfig,
      corporationId: "in-ka-bengaluru-south",
      zoneCode: "C-BIZ",
      plotAreaM2: 3000,
      roadWidthM: 24,
      use: "commercial",
    });
    expect(p3.parameters.ground_coverage_max_pct.value).toBe(45);
    expect(p3.parameters.far_base_max.value).toBe(2.5);
    expect(p3.parameters.setback_front_min_m.status).toBe("needs_depth");
    expect(p3.parameters.building_height_max_m.status).toBe("no_limit_in_law");
    expect(p3.parameters.floors_max.status).toBe("no_limit_in_law");

    // 4. 6,000 m² industrial (`I-GEN`) on 18 m road
    const p4 = resolvePlotParameters({
      parametersPayload,
      resolutionConfig,
      corporationId: "in-ka-bengaluru-south",
      zoneCode: "I-GEN",
      plotAreaM2: 6000,
      roadWidthM: 18,
      use: "industrial",
    });
    expect(p4.parameters.ground_coverage_max_pct.value).toBe(45);
    expect(p4.parameters.far_base_max.value).toBe(1);
    expect(p4.parameters.setback_front_min_m.value).toBe(10);
    expect(p4.parameters.setback_rear_min_m.value).toBe(8);
    expect(p4.parameters.setback_side_min_m.value).toBe(8);
    expect(p4.parameters.building_height_max_m.status).toBe("no_limit_in_law");
    expect(p4.parameters.floors_max.status).toBe("no_limit_in_law");

    // 5. Unknown zone -> "not_covered_by_data" ("Not covered by our data yet")
    const pUnknown = resolvePlotParameters({
      parametersPayload,
      resolutionConfig,
      corporationId: "in-ka-bengaluru-south",
      zoneCode: "unknown",
      plotAreaM2: 600,
      roadWidthM: 15,
      use: "residential",
    });
    expect(pUnknown.parameters.ground_coverage_max_pct.status).toBe(
      "not_covered_by_data"
    );
    expect(pUnknown.parameters.ground_coverage_max_pct.display_value).toBe(
      "Not covered by our data yet"
    );
  });
});
