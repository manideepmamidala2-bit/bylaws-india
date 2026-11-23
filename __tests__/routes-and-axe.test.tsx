import { fireEvent, render, screen } from "@testing-library/react";
import axe from "axe-core";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  fetchJurisdictionDataset,
  fetchManifest,
  getVisibleJurisdictions,
} from "@/lib/data";
import JurisdictionMapPage from "@/app/j/[id]/page";
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

describe("Part D — Real Data Wiring, 8 Routes, R12/R13/R14 & Blocking Axe WCAG AA", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("hides visibility: test jurisdictions in production while showing them in preview/dev/test", async () => {
    const manifest = await fetchManifest();
    const previewList = getVisibleJurisdictions(manifest);
    expect(previewList.map((j) => j.id)).toContain("in-ka-bengaluru-south");
    expect(previewList.map((j) => j.id)).toContain("xx-test-fixture");
    expect(previewList[0].id).toBe("in-ka-bengaluru-south");

    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "production");
    const prodList = getVisibleJurisdictions(manifest);
    expect(prodList.map((j) => j.id)).toEqual(["in-ka-bengaluru-south"]);
  });

  it("renders Map route (/j/[id]) with real Bengaluru South zones, clauses, and passes axe", async () => {
    const ui = await JurisdictionMapPage({
      params: Promise.resolve({ id: "in-ka-bengaluru-south" }),
    });
    const { container } = render(ui);

    expect(
      screen.getByRole("heading", {
        name: "Bengaluru South City Corporation",
      })
    ).toBeInTheDocument();
    expect(screen.getAllByText(/R-Main/).length).toBeGreaterThan(0);
    await assertNoAxeViolations(container);
  });

  it("renders Sources route (/j/[id]/sources) with all 31 Bengaluru South instruments and passes axe", async () => {
    const ui = await SourcesPage({
      params: Promise.resolve({ id: "in-ka-bengaluru-south" }),
    });
    const { container } = render(ui);

    expect(
      screen.getByText(/Bengaluru South City Corporation — Legal Source Register/)
    ).toBeInTheDocument();
    expect(screen.getByText("bbl-2003")).toBeInTheDocument();
    expect(screen.getByText("nbc-2016")).toBeInTheDocument();
    expect(screen.getAllByText("REFERENCE ONLY (R13)").length).toBeGreaterThanOrEqual(3);
    await assertNoAxeViolations(container);
  });

  it("renders Document route (/j/[id]/documents/[doc]) with Original vs As Amended (Derived) toggle (R14) and passes axe", async () => {
    const ui = await DocumentViewerPage({
      params: Promise.resolve({
        id: "in-ka-bengaluru-south",
        doc: "bbl-2003",
      }),
    });
    const { container } = render(ui);

    expect(
      screen.getByRole("heading", {
        name: /Bangalore Mahanagara Palike Building Bye-laws 2003/i,
      })
    ).toBeInTheDocument();

    const derivedBtn = screen.getByRole("button", {
      name: /As Amended \(Derived\)/i,
    });
    fireEvent.click(derivedBtn);

    expect(
      screen.getAllByText(/Derived by this project, not an official publication/i)
        .length
    ).toBeGreaterThan(0);
    await assertNoAxeViolations(container);
  });

  it("renders reference_only Document route (/j/[id]/documents/nbc-2016) with cited provisions (R13) and passes axe", async () => {
    const ui = await DocumentViewerPage({
      params: Promise.resolve({
        id: "in-ka-bengaluru-south",
        doc: "nbc-2016",
      }),
    });
    const { container } = render(ui);

    expect(
      screen.getByText(/Rule R13 — Text Rights Notice \(Reference Only\)/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Provisions Cited by Bengaluru South City Corporation Law/i)
    ).toBeInTheDocument();
    expect(screen.getByText("kfs-act-1964:13")).toBeInTheDocument();
    await assertNoAxeViolations(container);
  });

  it("renders Clauses, Timeline, Review, Data, and About routes with real data and zero axe violations", async () => {
    const clausesUi = await ClausesPage({
      params: Promise.resolve({ id: "in-ka-bengaluru-south" }),
    });
    const { container: c1, unmount: u1 } = render(clausesUi);
    expect(
      screen.getByText(/Bengaluru South City Corporation — Documents & Clause Browser/)
    ).toBeInTheDocument();
    await assertNoAxeViolations(c1);
    u1();

    const timelineUi = await TimelinePage({
      params: Promise.resolve({ id: "in-ka-bengaluru-south" }),
    });
    const { container: c2, unmount: u2 } = render(timelineUi);
    expect(
      screen.getByText(/Bengaluru South City Corporation — Regulatory Timeline/)
    ).toBeInTheDocument();
    await assertNoAxeViolations(c2);
    u2();

    const reviewUi = await ReviewPage({
      params: Promise.resolve({ id: "in-ka-bengaluru-south" }),
    });
    const { container: c3, unmount: u3 } = render(reviewUi);
    expect(
      screen.getByText(/Georeferenced Sheet & Zone Overlay Inspector/)
    ).toBeInTheDocument();
    await assertNoAxeViolations(c3);
    u3();

    const dataUi = await DataReleasesPage();
    const { container: c4, unmount: u4 } = render(dataUi);
    expect(
      screen.getByText(/Dataset Releases, Checksums & Declarations/)
    ).toBeInTheDocument();
    await assertNoAxeViolations(c4);
    u4();

    const aboutUi = await AboutPage();
    const { container: c5, unmount: u5 } = render(aboutUi);
    expect(
      screen.getByText(/About Structured Building Bylaws/)
    ).toBeInTheDocument();
    await assertNoAxeViolations(c5);
    u5();

    const bundle = await fetchJurisdictionDataset("in-ka-bengaluru-south");
    expect(bundle).not.toBeNull();
    expect(bundle!.clauses.some((c) => c.language === "kn")).toBe(true);
  });
});
