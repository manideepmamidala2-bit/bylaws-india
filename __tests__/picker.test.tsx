import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, afterEach } from "vitest";
import JurisdictionPickerPage from "@/app/page";
import type { ReleaseManifest } from "@/lib/data";

const FIXTURE_MANIFEST: ReleaseManifest = {
  schema_version: "1.0",
  jurisdictions: [
    {
      id: "_fixture-test",
      name: "Synthetic Test Jurisdiction Alpha",
      latest_release: "0.1.0",
      releases: [
        {
          version: "0.1.0",
          released_at: "2026-11-23T00:00:00Z",
          files: {
            documents: "/data/_fixture-test/0.1.0/documents.json",
            clauses: ["/data/_fixture-test/0.1.0/clauses.json"],
            amendments: "/data/_fixture-test/0.1.0/amendments.json",
            zones: "/data/_fixture-test/0.1.0/zones.geojson",
            boundary: "/data/_fixture-test/0.1.0/boundary.geojson",
            review_images: [],
          },
          drafts: {
            clauses: [],
          },
          changelog: "Initial synthetic release.",
        },
      ],
    },
    {
      id: "xx-yy-synthetic-beta",
      name: "Synthetic Test Jurisdiction Beta",
      latest_release: "0.2.0",
      releases: [
        {
          version: "0.2.0",
          released_at: "2026-11-23T00:00:00Z",
          files: {
            documents: "/data/xx-yy-synthetic-beta/0.2.0/documents.json",
            clauses: [],
            amendments: "/data/xx-yy-synthetic-beta/0.2.0/amendments.json",
            zones: "/data/xx-yy-synthetic-beta/0.2.0/zones.geojson",
            boundary: "/data/xx-yy-synthetic-beta/0.2.0/boundary.geojson",
            review_images: [],
          },
          drafts: {
            clauses: [],
          },
          changelog: "Second synthetic jurisdiction.",
        },
      ],
    },
  ],
};

describe("JurisdictionPickerPage smoke tests", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders jurisdictions dynamically from a fixture manifest via lib/data.ts", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => FIXTURE_MANIFEST,
    } as Response);

    render(<JurisdictionPickerPage />);

    await waitFor(() => {
      expect(
        screen.getByText("Synthetic Test Jurisdiction Alpha")
      ).toBeInTheDocument();
    });
    expect(
      screen.getByText("Synthetic Test Jurisdiction Beta")
    ).toBeInTheDocument();
    expect(screen.getByText("v0.1.0")).toBeInTheDocument();
    expect(screen.getByText("v0.2.0")).toBeInTheDocument();
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("shows an empty state when the manifest has zero jurisdictions", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ schema_version: "1.0", jurisdictions: [] }),
    } as Response);

    render(<JurisdictionPickerPage />);

    await waitFor(() => {
      expect(
        screen.getByText("No jurisdictions published in manifest.")
      ).toBeInTheDocument();
    });
  });
});
