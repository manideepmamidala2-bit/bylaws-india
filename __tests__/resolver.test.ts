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

const southDir = path.join(
  process.cwd(),
  "public",
  "data",
  "in-ka-bengaluru-south",
  "4.0.0"
);

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
      "Derived from the official documents by this project. Confirm with the planning authority or a qualified professional before relying on it."
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
});
