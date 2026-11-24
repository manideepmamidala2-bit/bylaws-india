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
import StructurePage from "@/app/structure/page";
import TopicsIndexPage from "@/app/j/[id]/topics/page";
import TopicDetailPage from "@/app/j/[id]/topics/[topic]/page";
import ProvisionDetailPage from "@/app/j/[id]/documents/[doc]/[eid]/page";

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
    expect(screen.getAllByText(/v2\.\d+\.\d+/i).length).toBeGreaterThan(0);
    expect(
      screen.getByText(/Synthetic demonstration data, not the law of Bengaluru South/i)
    ).toBeInTheDocument();
    assertCleanPublicCopy(homeContainer.textContent ?? "", "Home");
    await assertNoAxeViolations(homeContainer);
    uHome();

    // Sources page renders the 12-document core register (2 structured base docs + 10 "Not yet structured")
    const sourcesUi = await SourcesPage({
      params: Promise.resolve({ id: "in-ka-bengaluru-south" }),
    });
    const { container: sourcesContainer, unmount: uSources } =
      render(sourcesUi);
    expect(
      screen.getByText("BANGALORE MAHANAGARA PALIKE BUILDING BYE-LAWS 2003")
    ).toBeInTheDocument();
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

    // Document page for bbl-2003 renders Original / As Amended (Derived) toggle, Changed by links, and no "Amendments not yet applied" notice
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
    const asAmendedBtn = screen.getByRole("button", {
      name: /As Amended \(Derived\)/i,
    });
    fireEvent.click(asAmendedBtn);
    expect(
      screen.getAllByText(/Derived by this project, not an official publication/i)
        .length
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText(/Changed by/i).length
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByRole("link", { name: /View source p\. 1/i }).length
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByRole("link", { name: /Archive p\. 1/i }).length
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

    // Map page renders official GBA Corporation (1), GBA Zones (2), Wards (72), Planning Districts (1), Land-Use Zones (868), and Sheet Overlay toggle + plain-words accuracy notice
    const mapUi = await JurisdictionMapPage({
      params: Promise.resolve({ id: "in-ka-bengaluru-south" }),
    });
    const { container: mapContainer, unmount: uMap } = render(mapUi);
    expect(
      screen.getByText(/© OpenStreetMap contributors · Protomaps/i)
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(
        /Zones traced from the RMP 2015 Proposed Land Use sheet/i
      ).length
    ).toBeGreaterThan(0);
    expect(
      screen.getByRole("checkbox", {
        name: /Sheet Overlay: 2\.10 Jayanagar map \(b\)/i,
      })
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(/Sheet Opacity: 65%/i)
    ).toBeInTheDocument();
    const corpCheckbox = screen.getByRole("checkbox", {
      name: /Corporation \(1\)/i,
    });
    const wardsCheckbox = screen.getByRole("checkbox", {
      name: /Wards \(72\)/i,
    });
    expect(corpCheckbox).toBeChecked();
    expect(wardsCheckbox).toBeChecked();
    const wardSelect = screen.getByLabelText(
      /Inspect Official Ward \(72 Wards in Corporation\)/i
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
        label: "Clauses",
        renderFn: () =>
          ClausesPage({
            params: Promise.resolve({ id: "in-ka-bengaluru-south" }),
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
      {
        label: "Structure",
        renderFn: () => StructurePage(),
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
      screen.getAllByText(/Latest: v[23]\.\d+\.\d+/i).length
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
      screen.getByText(/About Structured Building Bylaws/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Release 1\.0\.0 withdrawn; real acquisition under way/i)
    ).toBeInTheDocument();
    assertCleanPublicCopy(aboutContainer.textContent ?? "", "About");
    await assertNoAxeViolations(aboutContainer);
    uAbout();

    const structureUi = await StructurePage();
    const { container: structureContainer, unmount: uStructure } =
      render(structureUi);
    expect(
      screen.getByText(/How This Dataset Is Structured/i)
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(/Download graph\.graphml \(Gephi\)/i).length
    ).toBeGreaterThan(0);
    assertCleanPublicCopy(structureContainer.textContent ?? "", "Structure");
    await assertNoAxeViolations(structureContainer);
    uStructure();

    const topicsUi = await TopicsIndexPage({
      params: Promise.resolve({ id: "in-ka-bengaluru-south" }),
    });
    const { container: topicsContainer, unmount: uTopics } = render(topicsUi);
    expect(
      screen.getByText(/Regulatory Topics & Cross-Document Relations/i)
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
      screen.getAllByText(/Setbacks & Building Lines/i).length
    ).toBeGreaterThan(0);
    await assertNoAxeViolations(topicDetailContainer);
    uTopicDetail();

    const provUi = await ProvisionDetailPage({
      params: Promise.resolve({
        id: "in-ka-bengaluru-south",
        doc: "bbl-2003",
        eid: "part_II__sec_6.0__item_i",
      }),
    });
    const { container: provContainer, unmount: uProv } = render(provUi);
    expect(
      screen.getByText(/One-Hop Neighborhood Around bbl-2003:part_II__sec_6\.0__item_i/i)
    ).toBeInTheDocument();
    await assertNoAxeViolations(provContainer);
    uProv();
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
      schema_version: "1.3",
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
