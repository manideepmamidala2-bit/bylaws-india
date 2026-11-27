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
import BrowseByWardPage from "@/app/j/[id]/wards/page";
import {
  createPlaceMiniSearch,
  formatMapUrlHash,
  parseMapUrlHash,
  searchPlacesWithMiniSearch,
} from "@/lib/place-search";
import SourcesPage from "@/app/j/[id]/sources/page";
import DocumentViewerPage from "@/app/j/[id]/documents/[doc]/page";
import TimelinePage from "@/app/j/[id]/timeline/page";
import DataReleasesPage from "@/app/data/page";
import AboutPage from "@/app/about/page";
import UseWithAiPage from "@/app/use-with-ai/page";
import TopicsIndexPage from "@/app/j/[id]/topics/page";
import TopicDetailPage from "@/app/j/[id]/topics/[topic]/page";
import nextConfig from "@/next.config";

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
      if (jur.register_documents) {
        const regDiskPath = path.join(
          process.cwd(),
          "public",
          jur.register_documents.replace(/^\/+/, "")
        );
        if (!fs.existsSync(regDiskPath)) {
          errors.push(
            `${jur.id}@register: missing published file ${jur.register_documents}`
          );
        } else {
          const regDocs = JSON.parse(
            fs.readFileSync(regDiskPath, "utf8")
          ) as Array<{
            doc_id?: string;
            source_url?: string | null;
          }>;
          for (const doc of regDocs) {
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
                `${jur.id}@register:${doc.doc_id ?? "unknown"} has local or non-http(s) source_url '${src}'`
              );
            }
          }
        }
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
    expect(serverManifest.jurisdictions.map((j) => j.id)).toContain(
      "in-ka-bengaluru-south"
    );
    expect(serverManifest.jurisdictions.map((j) => j.id)).not.toContain(
      "xx-test-fixture"
    );

    const homeProps = await getHomePageProps();
    expect(
      homeProps.visibleJurisdictions.every((j) => j.visibility !== "test")
    ).toBe(true);
    expect(
      homeProps.manifest.jurisdictions.every((j) => j.visibility !== "test")
    ).toBe(true);

    const staticParams = await generateMapParams();
    expect(staticParams.map((p) => p.id)).toContain("in-ka-bengaluru-south");
    expect(staticParams.map((p) => p.id)).not.toContain("xx-test-fixture");

    // When SHOW_TEST_JURISDICTIONS="true" is set on the server
    vi.stubEnv("SHOW_TEST_JURISDICTIONS", "true");
    const testEnabledManifest = await fetchManifest();
    expect(
      getVisibleJurisdictions(testEnabledManifest).map((j) => j.id)
    ).toContain("xx-test-fixture");
  });

  it(
    "renders Release 2.0.0 base documents with 'Amendments not yet applied' notice and side-by-side archive links across Bengaluru South routes, and passes axe",
    { timeout: 20000 },
    async () => {
    const homeUi = await JurisdictionPickerPage();
    const { container: homeContainer, unmount: uHome } = render(homeUi);
    expect(
      screen.getByRole("heading", {
        name: /Bengaluru's building rules\. One code\./i,
      })
    ).toBeInTheDocument();
    expect(screen.getByTestId("far-story-stepper")).toBeInTheDocument();
    expect(screen.queryByLabelText(/Plot area/i)).not.toBeInTheDocument();
    assertCleanPublicCopy(homeContainer.textContent ?? "", "Home", {
      allowDataEmDash: true,
    });
    await assertNoAxeViolations(homeContainer);
    uHome();

    // Sources page renders plain names and statuses with technical fields in Details
    const sourcesUi = await SourcesPage({
      params: Promise.resolve({ id: "in-ka-bengaluru-south" }),
    });
    const { container: sourcesContainer, unmount: uSources } =
      render(sourcesUi);
    expect(
      screen.getAllByText(/Mahanagara Palike Building Bye-Laws 2003/i).length
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByRole("link", { name: /Read Structured Document/i }).length
    ).toBeGreaterThanOrEqual(4);
    expect(screen.getAllByText(/Not yet structured/i).length).toBeGreaterThan(1);
    assertCleanPublicCopy(
      sourcesContainer.textContent ?? "",
      "Bengaluru South Sources",
      { allowDataEmDash: true }
    );
    await assertNoAxeViolations(sourcesContainer);
    uSources();

    // Document page for bbl-2003 renders Original / As Amended (Derived) toggle, Details on tap, and no 4 March 2026 South draft notice
    const docUi = await DocumentViewerPage({
      params: Promise.resolve({
        id: "in-ka-bengaluru-south",
        doc: "bbl-2003",
      }),
    });
    const { container: docContainer, unmount: uDoc } = render(docUi);
    expect(
      screen.queryByText(/Amendments not yet applied/i)
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/04-03-2026/i)
    ).not.toBeInTheDocument();
    const asAmendedBtn = screen.getByRole("button", {
      name: /As Amended \(Derived\)/i,
    });
    fireEvent.click(asAmendedBtn);
    expect(
      screen.getAllByText(/Derived by this project, not an official publication/i)
        .length
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByRole("link", { name: /View source p\. 1/i }).length
    ).toBeGreaterThan(0);
    assertCleanPublicCopy(
      docContainer.textContent ?? "",
      "Bengaluru South bbl-2003",
      { allowDataEmDash: true }
    );
    await assertNoAxeViolations(docContainer);
    uDoc();

    // Document page for rmp2015-zr renders Original / As Amended (Derived) toggle in PR 09 and no "Amendments not yet applied" notice
    const zrDocUi = await DocumentViewerPage({
      params: Promise.resolve({
        id: "in-ka-bengaluru-south",
        doc: "rmp2015-zr",
      }),
    });
    const { unmount: uZrDoc } = render(zrDocUi);
    expect(
      screen.queryByText(/Amendments not yet applied/i)
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /As Amended \(Derived\)/i })
    ).toBeInTheDocument();
    uZrDoc();

    // Unstructured Kannada compilation document renders "Not yet structured"
    const unstructUi = await DocumentViewerPage({
      params: Promise.resolve({
        id: "in-ka-bengaluru-south",
        doc: "rmp2015-zr-comp-2024-10-kn",
      }),
    });
    const { container: unstructContainer, unmount: uUnstruct } =
      render(unstructUi);
    expect(
      screen.getByRole("heading", { name: "Not yet structured" })
    ).toBeInTheDocument();
    await assertNoAxeViolations(unstructContainer);
    uUnstruct();

    // Map page renders Protomaps © OpenStreetMap attribution, plain-words layer switch, Place Card with 6 rule groups, sheet overlay opacity, and coverage/accuracy statements
    const mapUi = await JurisdictionMapPage({
      params: Promise.resolve({ id: "in-ka-bengaluru-south" }),
    });
    const { container: mapContainer, unmount: uMap } = render(mapUi);
    expect(
      screen.getByText(/Protomaps © OpenStreetMap/i)
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("map-coverage-statement")
    ).toHaveTextContent(
      /Land-use zones cover 1\.5% of Greater Bengaluru, in parts of Bengaluru South\./i
    );
    expect(
      screen.getByRole("checkbox", {
        name: /^Land-use zones$/i,
      })
    ).toBeChecked();
    expect(
      screen.getByRole("checkbox", {
        name: /^Wards$/i,
      })
    ).toBeChecked();
    expect(
      screen.getByRole("checkbox", {
        name: /^Corporations$/i,
      })
    ).toBeChecked();
    expect(
      screen.getByRole("checkbox", {
        name: /^Planning districts$/i,
      })
    ).toBeChecked();
    expect(
      screen.getByRole("checkbox", {
        name: /^Original map sheets$/i,
      })
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(/Sheet opacity: 70%/i)
    ).toBeInTheDocument();
    expect(screen.getByTestId("place-card")).toBeInTheDocument();
    expect(screen.getByTestId("place-card-group-uses")).toBeInTheDocument();
    expect(screen.getByTestId("place-card-group-far")).toBeInTheDocument();
    expect(
      screen.getByTestId("place-card-group-ground-coverage")
    ).toBeInTheDocument();
    expect(screen.getByTestId("place-card-group-setbacks")).toBeInTheDocument();
    expect(screen.getByTestId("place-card-group-height")).toBeInTheDocument();
    expect(screen.getByTestId("place-card-group-parking")).toBeInTheDocument();
    const wardSelect = screen.getByLabelText(
      /Inspect Official Ward \(72 Wards\)/i
    );
    fireEvent.change(wardSelect, { target: { value: "11" } });
    expect(screen.getAllByText(/Jayanagar East/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Zone1 · Jayanagar/i).length).toBeGreaterThan(0);
    assertCleanPublicCopy(mapContainer.textContent ?? "", "Map", {
      allowDataEmDash: true,
    });
    await assertNoAxeViolations(mapContainer);
    uMap();

    const routes: Array<{ label: string; renderFn: () => Promise<React.ReactElement> }> = [
      {
        label: "Timeline",
        renderFn: () =>
          TimelinePage({
            params: Promise.resolve({ id: "in-ka-bengaluru-south" }),
          }),
      },
      {
        label: "TopicsIndex",
        renderFn: () =>
          TopicsIndexPage({
            params: Promise.resolve({ id: "in-ka-bengaluru-south" }),
          }),
      },
    ];

    for (const route of routes) {
      const ui = await route.renderFn();
      const { container, unmount } = render(ui);
      assertCleanPublicCopy(container.textContent ?? "", route.label, {
        allowDataEmDash: true,
      });
      await assertNoAxeViolations(container);
      unmount();
    }
  });

  it("shows release 1.0.0 as withdrawn and release 2.3.0 as published on Data page, and renders honest About page", async () => {
    const dataUi = await DataReleasesPage();
    const { container: dataContainer, unmount: uData } = render(dataUi);

    expect(
      screen.getByText(
        /Withdrawn: Synthetic demonstration data, not the law of Bengaluru South/i
      )
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(/Latest: v[234]\.\d+\.\d+/i).length
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByRole("link", { name: /Download Bundle/i }).length
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByRole("link", { name: /SHA256SUMS/i }).length
    ).toBeGreaterThan(0);
    assertCleanPublicCopy(dataContainer.textContent ?? "", "Data", {
      allowDataEmDash: true,
    });
    await assertNoAxeViolations(dataContainer);
    uData();

    const aboutUi = await AboutPage();
    const { container: aboutContainer, unmount: uAbout } = render(aboutUi);
    expect(
      screen.getByRole("heading", { name: /About Bylaw One/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/all checks are machine checks/i)
    ).toBeInTheDocument();
    assertCleanPublicCopy(aboutContainer.textContent ?? "", "About", {
      allowDataEmDash: true,
    });
    await assertNoAxeViolations(aboutContainer);
    uAbout();

    const topicsUi = await TopicsIndexPage({
      params: Promise.resolve({ id: "in-ka-bengaluru-south" }),
    });
    const { container: topicsContainer, unmount: uTopics } = render(topicsUi);
    expect(
      screen.getByRole("heading", { name: /The code, by subject\./i })
    ).toBeInTheDocument();
    await assertNoAxeViolations(topicsContainer);
    uTopics();

    const topicDetailUi = await TopicDetailPage({
      params: Promise.resolve({
        id: "in-ka-bengaluru-south",
        topic: "setbacks",
      }),
    });
    const { container: topicDetailContainer, unmount: uTopicDetail } =
      render(topicDetailUi);
    expect(
      screen.getByRole("heading", { name: "Setbacks" })
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("subject-parameter-table")
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(/Building height above 15 up to 18 m/i).length
    ).toBeGreaterThan(0);
    await assertNoAxeViolations(topicDetailContainer);
    uTopicDetail();

    // Verify Part 3 old-route removals and corporation-preserving redirects in next.config.ts
    expect(typeof nextConfig.redirects).toBe("function");
    const redirectRules = await nextConfig.redirects!();
    const bySource = new Map(redirectRules.map((r) => [r.source, r]));
    expect(bySource.get("/structure")?.destination).toBe(
      "/about#how-this-is-built"
    );
    expect(bySource.get("/j/:id/review")?.destination).toBe("/j/:id");
    expect(bySource.get("/j/:id/clauses")?.destination).toBe(
      "/j/:id/sources"
    );
    expect(bySource.get("/j/:id/documents")?.destination).toBe(
      "/j/:id/sources"
    );
    expect(bySource.get("/j/:id/documents/:doc/:eid")?.destination).toBe(
      "/j/:id/documents/:doc#node-:eid"
    );
    expect(bySource.get("/j/:id/topics/building_height")?.destination).toBe(
      "/j/:id/topics/height"
    );
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

    // Layer 1 node types: definition, proviso, explanation, hierarchical table + footnote
    expect(screen.getByText(/Defines: "Floor Area Ratio"/i)).toBeInTheDocument();
    expect(screen.getAllByText(/proviso/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/explanation/i).length).toBeGreaterThan(0);
    expect(
      screen.getByText(/Corner plots in Z1 require an additional 0\.5 m splay/i)
    ).toBeInTheDocument();

    // Layer 2 annotations: hidden by default (law-first view), visible when "Show annotations" is checked
    expect(
      screen.queryByText(/Ref: clause 1\.1 → chp_I__cl_1\.1/i)
    ).not.toBeInTheDocument();
    const showAnnsCheckbox = screen.getByRole("checkbox", {
      name: /Show annotations/i,
    });
    fireEvent.click(showAnnsCheckbox);
    expect(
      screen.getAllByText(/Ref: clause 1\.1 → chp_I__cl_1\.1/i).length
    ).toBeGreaterThan(0);
    expect(
      screen.getByText(/Term: Floor Area Ratio → chp_I__def_1\.2/i)
    ).toBeInTheDocument();

    // Layer 3 versions: Original vs As Amended (Derived)
    expect(screen.getByText(/11\.5 metres/i)).toBeInTheDocument();
    const derivedBtn = screen.getByRole("button", {
      name: /As Amended \(Derived\)/i,
    });
    fireEvent.click(derivedBtn);
    expect(
      screen.getAllByText(/Derived by this project, not an official publication/i)
        .length
    ).toBeGreaterThan(0);
    expect(screen.getAllByText(/15\.0 metres/i).length).toBeGreaterThan(0);
    expect(
      screen.getAllByText(/Solar Rooftop Structures/i).length
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText(/Omitted by fixture-amend-2024/i).length
    ).toBeGreaterThan(0);
    assertCleanPublicCopy(cDoc.textContent ?? "", "Fixture Document");
    await assertNoAxeViolations(cDoc);
    uDoc();
  });

  it("fails the recurrence guard if any non-test published manifest entry references a local source_url", async () => {
    const raw = await fetchRawManifest();
    expect(validateNonTestManifestSources(raw)).toEqual([]);

    // Confirm withdrawn release directory public/data/in-ka-bengaluru-south/1.0.0 does not exist on disk
    const removedDir = path.join(
      process.cwd(),
      "public",
      "data",
      "in-ka-bengaluru-south",
      "1.0.0"
    );
    expect(fs.existsSync(removedDir)).toBe(false);

    // Planted non-test manifest entry referencing fixture documents.json (which has local file path in source_url)
    const plantedManifest: ReleaseManifest = {
      schema_version: "1.4",
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

  it("renders Part 1 city-level truth on Setbacks and FAR (supersession, 3.1(ii)-(iii) current wording, deduplication, 11.5m-12m overlap, and Bye-law 1.4 label invariants)", async () => {
    // 1. Setbacks at city level (`in-ka-bengaluru`)
    const setbacksUi = await TopicDetailPage({
      params: Promise.resolve({
        id: "in-ka-bengaluru",
        topic: "setbacks",
      }),
    });
    const { container: cSetbacks, unmount: uSetbacks } = render(setbacksUi);

    const whatAppliesSection = screen.getByTestId("what-applies-today-section");
    const whatAppliesText = whatAppliesSection.textContent ?? "";

    // Part 4: 11.5 m to 12 m setback height band is settled by 3.1(ii)-(iii), NOT shown as "Not settled",
    // and explained in one line under "Why this rule applies" with verbatim quotes on tap and unreachable-band note on Table 9
    expect(screen.queryByTestId("band-continuity-notice")).not.toBeInTheDocument();
    expect(screen.getByTestId("applicability-rule-line").textContent).toBe(
      "Buildings up to 12 m use Table 8; taller buildings use Table 9 (clauses 3.1(ii) and (iii), January 2026)."
    );
    expect(
      screen.getAllByTestId("applicability-rule-quote").length
    ).toBeGreaterThanOrEqual(2);
    expect(screen.getByTestId("unreachable-band-note").textContent).toContain(
      "11.5 to 12 m is unreachable here"
    );

    // Governing provisions 3.1(ii) and 3.1(iii) show January 2026 wording, "Changed January 2026", and previous 2007 wording in Details
    expect(whatAppliesText).toContain(
      "For all types of building with total height up to 12.0m, excluding the stilt floor, the setbacks shall be calculated as per Table 8."
    );
    expect(whatAppliesText).toContain(
      "Table 9 shall be referred to buildings which are more than 12.0 m in total height"
    );
    expect(
      screen.getAllByTestId("provision-changed-tag").map((el) => el.textContent)
    ).toContain("Changed January 2026");
    expect(
      screen
        .getAllByTestId("provision-previous-wording")
        .some((el) => (el.textContent ?? "").includes("Up to 11.5 m height"))
    ).toBe(true);

    // Definitions never appear in "What applies today" on Setbacks
    expect(whatAppliesText).not.toContain(
      "Means the line up to which the plinth of a building may lawfully extend"
    );

    // Industrial (General) plots up to 500 m²: 12% / 8% in "What applies today"; 4.5 m moved to "Older or replaced rules"
    const govTable = screen.getByTestId("subject-parameter-table");
    const govRows = Array.from(govTable.querySelectorAll("tbody tr")).map(
      (tr) => tr.textContent ?? ""
    );
    const igen500GovRows = govRows.filter((txt) =>
      txt.includes("Industrial (General), plots up to 500 m²")
    );
    expect(
      igen500GovRows.some((txt) => txt.includes("12% of plot depth"))
    ).toBe(true);
    expect(igen500GovRows.some((txt) => txt.includes("4.5 m"))).toBe(false);

    // Older or replaced rules: 2007 Industrial (General) 4.5 m row is "Replaced by ...", bbl-2003 rules are "Master plan rules apply instead (bye-law 1.4)", and Bye-law 1.4 is NEVER in Older or replaced rules
    const olderDetails = screen.getByTestId("older-or-replaced-rules");
    const olderText = olderDetails.textContent ?? "";
    expect(olderText).toContain("Industrial (General), plots up to 500 m²");
    expect(olderText).toContain("Replaced by");
    expect(olderText).toContain("Master plan rules apply instead (bye-law 1.4)");
    expect(olderText).not.toContain(
      "All mandatory Master Plan or Zonal Regulations regarding use"
    );
    expect(olderText).not.toContain("under Bye-law 1.4");

    await assertNoAxeViolations(cSetbacks);
    uSetbacks();

    // 2. FAR at city level (`in-ka-bengaluru`)
    const farUi = await TopicDetailPage({
      params: Promise.resolve({
        id: "in-ka-bengaluru",
        topic: "far",
      }),
    });
    const { container: cFar, unmount: uFar } = render(farUi);

    const farGovTable = screen.getByTestId("subject-parameter-table");
    const farGovRows = Array.from(
      farGovTable.querySelectorAll("tbody tr")
    ).map((tr) => tr.textContent ?? "");

    // Traffic and Transportation up to 500 m² shown ONCE citing 2009, with earlier 2007 source in Details
    const ttrans500Rows = farGovRows.filter((txt) =>
      txt.includes("Traffic and transportation, plots up to 500 m²")
    );
    expect(ttrans500Rows).toHaveLength(1);
    expect(ttrans500Rows[0]).toContain("Earlier source with identical value");

    // Industrial (General) up to 500 m² shown ONCE citing 2026, with earlier 2007 source in Details
    const igen500FarRows = farGovRows.filter((txt) =>
      txt.includes("Industrial (General), plots up to 500 m²")
    );
    expect(igen500FarRows).toHaveLength(1);
    expect(igen500FarRows[0]).toContain("Earlier source with identical value");

    await assertNoAxeViolations(cFar);
    uFar();

    // 3. Part 2: Subject & Document pages with a City Corporation selected (`in-ka-bengaluru-south`)
    const southFarUi = await TopicDetailPage({
      params: Promise.resolve({
        id: "in-ka-bengaluru-south",
        topic: "far",
      }),
    });
    const { container: cSouthFar, unmount: uSouthFar } = render(southFarUi);
    expect(
      screen.getByTestId("corporation-layer-notice").textContent
    ).toContain(
      "Showing Greater Bengaluru rules, with differences for Bengaluru South City Corporation."
    );
    expect(
      screen.getByTestId("corporation-no-differences").textContent
    ).toContain(
      "No differences for Bengaluru South City Corporation on this subject."
    );
    await assertNoAxeViolations(cSouthFar);
    uSouthFar();

    const southApprovalsUi = await TopicDetailPage({
      params: Promise.resolve({
        id: "in-ka-bengaluru-south",
        topic: "approvals-and-certificates",
      }),
    });
    const { container: cSouthApp, unmount: uSouthApp } =
      render(southApprovalsUi);
    expect(
      screen.getByTestId("corporation-layer-notice").textContent
    ).toContain(
      "Showing Greater Bengaluru rules, with differences for Bengaluru South City Corporation."
    );
    expect(
      screen.queryByTestId("corporation-no-differences")
    ).not.toBeInTheDocument();
    expect(
      screen
        .getAllByTestId("corporation-diff-badge")
        .some((el) =>
          (el.textContent ?? "").includes(
            "In Bengaluru South City Corporation"
          )
        )
    ).toBe(true);
    await assertNoAxeViolations(cSouthApp);
    uSouthApp();

    const southBblDocUi = await DocumentViewerPage({
      params: Promise.resolve({
        id: "in-ka-bengaluru-south",
        doc: "bbl-2003",
      }),
    });
    const { container: cSouthBbl, unmount: uSouthBbl } = render(southBblDocUi);
    expect(cSouthBbl.textContent ?? "").toContain(
      "Changed for Bengaluru South City Corporation, 14 May 2026"
    );
    expect(cSouthBbl.textContent ?? "").toContain("Table-2B below");
    const jsonLdEl = cSouthBbl.querySelector(
      'script[data-testid="legislation-json-ld"]'
    );
    expect(jsonLdEl).not.toBeNull();
    const jsonLdObj = JSON.parse(jsonLdEl?.textContent ?? "{}");
    expect(jsonLdObj["@context"]).toBe("https://schema.org");
    expect(jsonLdObj["@type"]).toBe("Legislation");
    expect(jsonLdObj.legislationIdentifier).toBeTruthy();
    expect(jsonLdObj.legislationDate).toBeTruthy();
    expect(jsonLdObj.legislationJurisdiction).toContain(
      "Bengaluru South City Corporation"
    );
    expect(jsonLdObj.legislationLegalForce).toBe("https://schema.org/InForce");
    expect(Array.isArray(jsonLdObj.legislationChanges)).toBe(true);
    expect(jsonLdObj.isPartOf).toBeTruthy();
    expect(jsonLdObj.url).toMatch(/^https?:\/\//);
    expect(Array.isArray(jsonLdObj.hasPart)).toBe(true);
    await assertNoAxeViolations(cSouthBbl);
    uSouthBbl();

    const useAiUi = await UseWithAiPage();
    const { container: cUseAi, unmount: uUseAi } = render(useAiUi);
    expect(cUseAi.textContent ?? "").toContain("Use Bylaw One with AI");
    expect(cUseAi.textContent ?? "").toContain("/llms.txt");
    expect(cUseAi.textContent ?? "").toContain("local agent engine is coming");
    await assertNoAxeViolations(cUseAi);
    uUseAi();

    // 4. Part 4: Plain land-use zone gap notice on Map and Land use subject pages
    const expectedGapLine =
      "Land-use zones are available for parts of Bengaluru South only. Elsewhere the map shows boundaries and wards.";

    const landUseUi = await TopicDetailPage({
      params: Promise.resolve({
        id: "in-ka-bengaluru",
        topic: "land-use",
      }),
    });
    const { container: cLandUse, unmount: uLandUse } = render(landUseUi);
    expect(screen.getByTestId("land-use-zone-gap-notice").textContent).toBe(
      expectedGapLine
    );
    await assertNoAxeViolations(cLandUse);
    uLandUse();

    const cityMapUi = await JurisdictionMapPage({
      params: Promise.resolve({ id: "in-ka-bengaluru" }),
    });
    const { container: cCityMap, unmount: uCityMap } = render(cityMapUi);
    expect(screen.getByTestId("map-zone-gap-notice").textContent).toBe(
      expectedGapLine
    );
    await assertNoAxeViolations(cCityMap);
    uCityMap();

    // 5. Browse by ward page (/j/[id]/wards) and MiniSearch + URL hash round-trip
    const wardsUi = await BrowseByWardPage({
      params: Promise.resolve({ id: "in-ka-bengaluru-south" }),
    });
    const { container: cWards, unmount: uWards } = render(wardsUi);
    expect(
      screen.getByTestId("browse-by-ward-directory")
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("browse-by-ward-zone-rules")
    ).toBeInTheDocument();
    expect(cWards.textContent ?? "").toContain("Jayanagar East");
    expect(cWards.textContent ?? "").toContain("Residential (Main) (R-MAIN)");
    await assertNoAxeViolations(cWards);
    uWards();

    const hashStr = formatMapUrlHash({
      lat: 12.9279,
      lng: 77.5831,
      zoom: 15,
      place: "Jayanagar",
    });
    expect(hashStr).toBe("#12.9279,77.5831,15,Jayanagar");
    const parsedHash = parseMapUrlHash(hashStr);
    expect(parsedHash).toEqual({
      lat: 12.9279,
      lng: 77.5831,
      zoom: 15,
      place: "Jayanagar",
    });

    const ms = createPlaceMiniSearch([
      {
        id: "p1",
        name: "Jayanagar 4th Block",
        kind: "locality",
        categoryLabel: "Neighbourhood",
        lat: 12.92657,
        lng: 77.5835,
        corporationId: "in-ka-bengaluru-south",
        corporationName: "Bengaluru South City Corporation",
        wardNumber: "8",
        wardName: "Tilak Nagara",
        planningDistrict: "2.10 · Jayanagar",
        zoneCode: "R-MAIN",
        zoneLabel: "Residential (Main)",
      },
    ]);
    const hits = searchPlacesWithMiniSearch(ms, "Jayanag");
    expect(hits).toHaveLength(1);
    expect(hits[0].zoneCode).toBe("R-MAIN");
  });
});
