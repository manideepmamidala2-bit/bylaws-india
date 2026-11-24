import fs from "node:fs";
import path from "node:path";
import { fireEvent, render, screen } from "@testing-library/react";
import axe from "axe-core";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  fetchManifest,
  fetchRawManifest,
  getVisibleJurisdictions,
  isWithdrawnRelease,
  type ReleaseManifest,
} from "@/lib/data";
import JurisdictionPickerPage, { getHomePageProps } from "@/app/page";
import JurisdictionMapPage, {
  generateStaticParams as generateMapParams,
} from "@/app/j/[id]/page";
import SourcesPage from "@/app/j/[id]/sources/page";
import DocumentViewerPage from "@/app/j/[id]/documents/[doc]/page";
import ClausesPage from "@/app/j/[id]/clauses/page";
import TimelinePage from "@/app/j/[id]/timeline/page";
import ReviewPage from "@/app/j/[id]/review/page";
import DataReleasesPage from "@/app/data/page";
import AboutPage from "@/app/about/page";

async function assertNoAxeViolations(container: HTMLElement) {
  const results = await axe.run(container, {
    rules: {
      region: { enabled: false },
    },
  });
  const summary = results.violations
    .map((v) => `${v.id}: ${v.help} (${v.nodes.length} nodes)`)
    .join("; ");
  expect(results.violations, `Axe WCAG violations: ${summary}`).toHaveLength(0);
}

function assertCleanPublicCopy(
  text: string,
  routeLabel: string,
  options?: { allowDataEmDash?: boolean }
) {
  if (!options?.allowDataEmDash) {
    expect(text, `${routeLabel}: contains em dash`).not.toContain("—");
  }
  expect(text, `${routeLabel}: contains backtick`).not.toContain("`");
  expect(
    text.toLowerCase(),
    `${routeLabel}: contains 'verified at its official origin'`
  ).not.toContain("verified at its official origin");
  expect(text, `${routeLabel}: contains internal rule ref`).not.toMatch(
    /\bRules?\s+R\d+\b|\(R\d+\)/i
  );
  expect(text, `${routeLabel}: contains internal plan ref`).not.toMatch(
    /\bPlan\s+v\d+/i
  );
  expect(text, `${routeLabel}: contains repo path`).not.toMatch(
    /\b(data\/overrides|data\/sources|web\/public\/data|public\/data)\b/
  );
}

function validateNonTestManifestSources(manifest: ReleaseManifest): string[] {
  const errors: string[] = [];
  for (const jur of manifest.jurisdictions) {
    if (jur.visibility === "test") {
      continue;
    }
    for (const rel of jur.releases) {
      if (isWithdrawnRelease(rel)) {
        if (
          rel.download_zip ||
          rel.sha256sums ||
          rel.declarations ||
          rel.files ||
          rel.drafts
        ) {
          errors.push(
            `${jur.id}@${rel.version}: withdrawn release must not expose downloadable files`
          );
        }
        continue;
      }
      if (!rel.files?.documents) {
        errors.push(`${jur.id}@${rel.version}: missing documents.json path`);
        continue;
      }
      const docsDiskPath = path.join(
        process.cwd(),
        "public",
        rel.files.documents.replace(/^\/+/, "")
      );
      if (!fs.existsSync(docsDiskPath)) {
        errors.push(
          `${jur.id}@${rel.version}: missing published file ${rel.files.documents}`
        );
        continue;
      }
      const docs = JSON.parse(fs.readFileSync(docsDiskPath, "utf8")) as Array<{
        doc_id?: string;
        source_url?: string | null;
      }>;
      for (const doc of docs) {
        const src = (doc.source_url ?? "").trim();
        if (
          !src ||
          src.startsWith("file://") ||
          src.startsWith("/") ||
          src.startsWith(".") ||
          src.startsWith("data/") ||
          (!src.startsWith("http://") && !src.startsWith("https://"))
        ) {
          errors.push(
            `${jur.id}@${rel.version}:${doc.doc_id ?? "unknown"} has local or non-http(s) source_url '${src}'`
          );
        }
      }
    }
  }
  return errors;
}

describe("PR 01 — Contain Production: Server Filtering, Withdrawn Release 1.0.0, Honest Copy & Recurrence Guard", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("excludes visibility: test jurisdictions from server manifest, page props, and static params in production builds", async () => {
    const raw = await fetchRawManifest();
    expect(raw.jurisdictions.some((j) => j.visibility === "test")).toBe(true);

    // Default server behavior (SHOW_TEST_JURISDICTIONS unset)
    const serverManifest = await fetchManifest();
    expect(
      serverManifest.jurisdictions.every((j) => j.visibility !== "test")
    ).toBe(true);
    expect(serverManifest.jurisdictions.map((j) => j.id)).toEqual([
      "in-ka-bengaluru-south",
    ]);

    const homeProps = await getHomePageProps();
    expect(
      homeProps.visibleJurisdictions.every((j) => j.visibility !== "test")
    ).toBe(true);
    expect(
      homeProps.manifest.jurisdictions.every((j) => j.visibility !== "test")
    ).toBe(true);

    const staticParams = await generateMapParams();
    expect(staticParams).toEqual([{ id: "in-ka-bengaluru-south" }]);

    // When SHOW_TEST_JURISDICTIONS="true" is set on the server
    vi.stubEnv("SHOW_TEST_JURISDICTIONS", "true");
    const testEnabledManifest = await fetchManifest();
    expect(
      getVisibleJurisdictions(testEnabledManifest).map((j) => j.id)
    ).toEqual(["in-ka-bengaluru-south", "xx-test-fixture"]);
  });

  it("shows 'No data published yet' and zero generated data across Bengaluru South routes, and passes axe", async () => {
    const homeUi = await JurisdictionPickerPage();
    const { container: homeContainer, unmount: uHome } = render(homeUi);
    expect(screen.getByText("No data published yet")).toBeInTheDocument();
    expect(
      screen.getByText(/Synthetic demonstration data, not the law of Bengaluru South/i)
    ).toBeInTheDocument();
    assertCleanPublicCopy(homeContainer.textContent ?? "", "Home");
    await assertNoAxeViolations(homeContainer);
    uHome();

    const routes: Array<{ label: string; renderFn: () => Promise<React.ReactElement> }> = [
      {
        label: "Map",
        renderFn: () =>
          JurisdictionMapPage({
            params: Promise.resolve({ id: "in-ka-bengaluru-south" }),
          }),
      },
      {
        label: "Sources",
        renderFn: () =>
          SourcesPage({
            params: Promise.resolve({ id: "in-ka-bengaluru-south" }),
          }),
      },
      {
        label: "Clauses",
        renderFn: () =>
          ClausesPage({
            params: Promise.resolve({ id: "in-ka-bengaluru-south" }),
          }),
      },
      {
        label: "Document",
        renderFn: () =>
          DocumentViewerPage({
            params: Promise.resolve({
              id: "in-ka-bengaluru-south",
              doc: "bbl-2003",
            }),
          }),
      },
      {
        label: "Timeline",
        renderFn: () =>
          TimelinePage({
            params: Promise.resolve({ id: "in-ka-bengaluru-south" }),
          }),
      },
      {
        label: "Review",
        renderFn: () =>
          ReviewPage({
            params: Promise.resolve({ id: "in-ka-bengaluru-south" }),
          }),
      },
    ];

    for (const route of routes) {
      const ui = await route.renderFn();
      const { container, unmount } = render(ui);
      expect(
        screen.getByRole("heading", { name: "No data published yet" })
      ).toBeInTheDocument();
      expect(container.textContent).not.toContain("R-Main");
      expect(container.textContent).not.toContain("bbl-2003");
      assertCleanPublicCopy(container.textContent ?? "", route.label);
      await assertNoAxeViolations(container);
      unmount();
    }
  });

  it("shows release 1.0.0 as withdrawn with reason and no download links on Data page, and renders honest About page", async () => {
    const dataUi = await DataReleasesPage();
    const { container: dataContainer, unmount: uData } = render(dataUi);

    expect(
      screen.getByText(
        /Withdrawn: Synthetic demonstration data, not the law of Bengaluru South/i
      )
    ).toBeInTheDocument();
    expect(screen.getByText("No data published yet")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /Download Bundle/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /SHA256SUMS/i })
    ).not.toBeInTheDocument();
    assertCleanPublicCopy(dataContainer.textContent ?? "", "Data");
    await assertNoAxeViolations(dataContainer);
    uData();

    const aboutUi = await AboutPage();
    const { container: aboutContainer, unmount: uAbout } = render(aboutUi);
    expect(
      screen.getByText(/About Structured Building Bylaws/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Release 1\.0\.0 withdrawn; real acquisition under way/i)
    ).toBeInTheDocument();
    assertCleanPublicCopy(aboutContainer.textContent ?? "", "About");
    await assertNoAxeViolations(aboutContainer);
    uAbout();
  });

  it("renders xx-test-fixture routes cleanly when SHOW_TEST_JURISDICTIONS=true with zero copy or axe violations", async () => {
    vi.stubEnv("SHOW_TEST_JURISDICTIONS", "true");

    const mapUi = await JurisdictionMapPage({
      params: Promise.resolve({ id: "xx-test-fixture" }),
    });
    const { container: cMap, unmount: uMap } = render(mapUi);
    assertCleanPublicCopy(cMap.textContent ?? "", "Fixture Map");
    await assertNoAxeViolations(cMap);
    uMap();

    const sourcesUi = await SourcesPage({
      params: Promise.resolve({ id: "xx-test-fixture" }),
    });
    const { container: cSources, unmount: uSources } = render(sourcesUi);
    assertCleanPublicCopy(cSources.textContent ?? "", "Fixture Sources", {
      allowDataEmDash: true,
    });
    await assertNoAxeViolations(cSources);
    uSources();

    const docUi = await DocumentViewerPage({
      params: Promise.resolve({
        id: "xx-test-fixture",
        doc: "fixture-base-2020",
      }),
    });
    const { container: cDoc, unmount: uDoc } = render(docUi);
    const derivedBtn = screen.getByRole("button", {
      name: /As Amended \(Derived\)/i,
    });
    fireEvent.click(derivedBtn);
    expect(
      screen.getAllByText(/Derived by this project, not an official publication/i)
        .length
    ).toBeGreaterThan(0);
    assertCleanPublicCopy(cDoc.textContent ?? "", "Fixture Document");
    await assertNoAxeViolations(cDoc);
    uDoc();
  });

  it("fails the recurrence guard if any non-test published manifest entry references a local source_url", async () => {
    const raw = await fetchRawManifest();
    expect(validateNonTestManifestSources(raw)).toEqual([]);

    // Confirm public/data/in-ka-bengaluru-south does not exist on disk
    const removedDir = path.join(
      process.cwd(),
      "public",
      "data",
      "in-ka-bengaluru-south"
    );
    expect(fs.existsSync(removedDir)).toBe(false);

    // Planted non-test manifest entry referencing fixture documents.json (which has local file path in source_url)
    const plantedManifest: ReleaseManifest = {
      schema_version: "1.2",
      jurisdictions: [
        {
          id: "in-ka-planted",
          name: "Planted Public Jurisdiction",
          visibility: "public",
          latest_release: "1.0.0",
          releases: [
            {
              version: "1.0.0",
              status: "published",
              released_at: "2026-11-24T00:00:00Z",
              licence: "CC BY 4.0",
              download_zip: "/data/xx-test-fixture/0.1.0/xx-test-fixture-0.1.0.zip",
              sha256sums: "/data/xx-test-fixture/0.1.0/SHA256SUMS",
              declarations: "/data/xx-test-fixture/0.1.0/declarations.json",
              files: {
                documents: "/data/xx-test-fixture/0.1.0/documents.json",
                clauses: [],
                amendments: "/data/xx-test-fixture/0.1.0/amendments.json",
                zones: "/data/xx-test-fixture/0.1.0/zones.geojson",
                boundary: "/data/xx-test-fixture/0.1.0/boundary.geojson",
                review_images: [],
              },
              drafts: { clauses: [] },
              changelog: "Planted release",
            },
          ],
        },
      ],
    };

    const plantedErrors = validateNonTestManifestSources(plantedManifest);
    expect(plantedErrors.length).toBeGreaterThan(0);
    expect(plantedErrors[0]).toMatch(/has local or non-http\(s\) source_url/);
  });
});
