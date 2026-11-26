import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import HomePage, { getHomePageProps } from "@/app/page";
import type { ReleaseManifest } from "@/lib/data";

const FIXTURE_MANIFEST: ReleaseManifest = {
  schema_version: "1.4",
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

describe("Bylaw One HomePage server filtering and narrative structure tests", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("filters out visibility: test jurisdictions on the server by default and renders Bylaw One hero and 5-step FAR story", async () => {
    const props = await getHomePageProps(
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => FIXTURE_MANIFEST,
      } as unknown as Response)
    );
    expect(props.visibleJurisdictions.map((j) => j.id)).toEqual([
      "in-ka-bengaluru-south",
    ]);
    expect(
      props.visibleJurisdictions.every((j) => j.visibility !== "test")
    ).toBe(true);

    const ui = await HomePage();
    render(ui);

    expect(
      screen.getByRole("heading", {
        name: /Bengaluru's building rules\. One code\./i,
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /Many sources\. One building\./i })
    ).toBeInTheDocument();
    expect(screen.getByTestId("far-story-stepper")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /2004\. The bye-laws set FAR\./i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: /2007\. The master plan sets FAR by zone\./i,
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: /2017\. The bye-laws hand FAR to the master plan\./i,
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /2025\. Premium FAR is added\./i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /Today\. What applies\./i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /Read\. Trace\. Compare\./i })
    ).toBeInTheDocument();
  });

  it("includes visibility: test jurisdictions on the server only when SHOW_TEST_JURISDICTIONS is set", async () => {
    vi.stubEnv("SHOW_TEST_JURISDICTIONS", "true");
    const props = await getHomePageProps(
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => FIXTURE_MANIFEST,
      } as unknown as Response)
    );
    expect(props.visibleJurisdictions.map((j) => j.id)).toEqual([
      "in-ka-bengaluru-south",
      "xx-test-fixture",
    ]);
  });

  it("renders cleanly when the manifest has zero jurisdictions", async () => {
    const props = await getHomePageProps(
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ schema_version: "1.4", jurisdictions: [] }),
      } as unknown as Response)
    );
    expect(props.visibleJurisdictions).toEqual([]);
  });
});
