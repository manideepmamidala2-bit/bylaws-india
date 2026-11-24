import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import JurisdictionPickerPage, { getHomePageProps } from "@/app/page";
import type { ReleaseManifest } from "@/lib/data";

const FIXTURE_MANIFEST: ReleaseManifest = {
  schema_version: "1.3",
  jurisdictions: [
    {
      id: "in-ka-bengaluru-south",
      name: "Bengaluru South City Corporation",
      aliases: ["Bengaluru South"],
      visibility: "public",
      latest_release: null,
      releases: [
        {
          version: "1.0.0",
          status: "withdrawn",
          withdrawn_reason:
            "Synthetic demonstration data, not the law of Bengaluru South",
          released_at: "2026-11-23T00:00:00Z",
          licence: "CC BY 4.0",
          download_zip: null,
          sha256sums: null,
          declarations: null,
          files: null,
          drafts: null,
          changelog:
            "Withdrawn: synthetic demonstration data, not the law of Bengaluru South",
        },
      ],
    },
    {
      id: "xx-test-fixture",
      name: "Synthetic Test Jurisdiction Alpha",
      aliases: ["Synthetic Fixture", "Test City"],
      visibility: "test",
      latest_release: "0.1.0",
      releases: [
        {
          version: "0.1.0",
          status: "published",
          released_at: "2026-11-23T00:00:00Z",
          licence: "CC BY 4.0",
          download_zip: "/data/xx-test-fixture/0.1.0/xx-test-fixture-0.1.0.zip",
          sha256sums: "/data/xx-test-fixture/0.1.0/SHA256SUMS",
          declarations: "/data/xx-test-fixture/0.1.0/declarations.json",
          files: {
            documents: "/data/xx-test-fixture/0.1.0/documents.json",
            clauses: [
              "/data/xx-test-fixture/0.1.0/fixture-base-2020.clauses.json",
            ],
            amendments: "/data/xx-test-fixture/0.1.0/amendments.json",
            zones: "/data/xx-test-fixture/0.1.0/zones.geojson",
            boundary: "/data/xx-test-fixture/0.1.0/boundary.geojson",
            review_images: [],
          },
          drafts: {
            clauses: [],
          },
          changelog: "Initial synthetic release.",
        },
      ],
    },
  ],
};

describe("JurisdictionPickerPage server filtering and status tests", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("filters out visibility: test jurisdictions on the server by default and shows 'No data published yet' for Bengaluru South", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => FIXTURE_MANIFEST,
    } as Response);

    const props = await getHomePageProps();
    expect(props.visibleJurisdictions.map((j) => j.id)).toEqual([
      "in-ka-bengaluru-south",
    ]);
    expect(
      props.visibleJurisdictions.every((j) => j.visibility !== "test")
    ).toBe(true);

    const ui = await JurisdictionPickerPage();
    render(ui);

    expect(
      screen.getByRole("heading", { name: "Bengaluru South City Corporation" })
    ).toBeInTheDocument();
    expect(screen.getByText("No data published yet")).toBeInTheDocument();
    expect(
      screen.queryByText("Synthetic Test Jurisdiction Alpha")
    ).not.toBeInTheDocument();
    expect(fetchSpy).toHaveBeenCalled();
  });

  it("includes visibility: test jurisdictions on the server only when SHOW_TEST_JURISDICTIONS is set", async () => {
    vi.stubEnv("SHOW_TEST_JURISDICTIONS", "true");
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => FIXTURE_MANIFEST,
    } as Response);

    const props = await getHomePageProps();
    expect(props.visibleJurisdictions.map((j) => j.id)).toEqual([
      "in-ka-bengaluru-south",
      "xx-test-fixture",
    ]);

    const ui = await JurisdictionPickerPage();
    render(ui);

    expect(
      screen.getByText("Synthetic Test Jurisdiction Alpha")
    ).toBeInTheDocument();
    expect(screen.getByText("v0.1.0")).toBeInTheDocument();
  });

  it("shows an empty state when the manifest has zero jurisdictions", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ schema_version: "1.3", jurisdictions: [] }),
    } as Response);

    const ui = await JurisdictionPickerPage();
    render(ui);

    expect(
      screen.getByText("No jurisdictions published in manifest.")
    ).toBeInTheDocument();
  });
});
