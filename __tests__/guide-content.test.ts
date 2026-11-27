import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fireEvent, render, screen } from "@testing-library/react";
import axe from "axe-core";
import { describe, expect, it } from "vitest";
import GuidePage from "@/app/guide/page";
import GuideSlidesPage from "@/app/guide/slides/page";
import {
  countWords,
  interpolateGuidePlaceholders,
  loadGuideBundle,
  MAX_SLIDE_SUMMARY_WORDS,
  parseGuideSectionMarkdown,
} from "@/lib/guide";

describe("Part 2 — Guide Content as Source Files, Generated Figures, Mermaid Diagrams & Playwright Screenshots", () => {
  it("loads all 12 guide sections with <= 40-word slide summaries, presenter notes, reading versions, and zero unreplaced placeholders", async () => {
    const bundle = await loadGuideBundle();

    expect(bundle.sections.map((s) => s.id)).toEqual([
      "opening",
      "why-this-exists",
      "see-it-working",
      "how-its-built",
      "principles",
      "the-movement",
      "take-part",
      "for-developers",
      "the-launch",
      "sustainability",
      "whats-missing-and-next",
      "contact-and-citing",
    ]);

    for (const sec of bundle.sections) {
      expect(sec.slideSummary.length).toBeGreaterThan(20);
      expect(sec.slideSummaryWordCount).toBeLessThanOrEqual(
        MAX_SLIDE_SUMMARY_WORDS
      );
      expect(sec.presenterNotes.length).toBeGreaterThan(80);
      expect(sec.readingMarkdown.length).toBeGreaterThan(100);
      expect(sec.slideSummary).not.toMatch(/\{\{[^}]*\}\}/);
      expect(sec.presenterNotes).not.toMatch(/\{\{[^}]*\}\}/);
      expect(sec.readingMarkdown).not.toMatch(/\{\{[^}]*\}\}/);
    }

    // Verify all 5 audience entry points exist and map to valid section IDs
    expect(bundle.audiences.map((a) => a.label)).toEqual([
      "I'm from a college",
      "I'm a student",
      "I'm a practitioner",
      "I'm a developer",
      "I'm a partner or funder",
    ]);
    const validIds = new Set(bundle.sections.map((s) => s.id));
    for (const aud of bundle.audiences) {
      expect(aud.sectionIds.length).toBeGreaterThanOrEqual(5);
      for (const sid of aud.sectionIds) {
        expect(validIds.has(sid)).toBe(true);
      }
    }
  });

  it("throws an explicit error on unknown placeholders or slide summaries exceeding 40 words", () => {
    expect(() =>
      interpolateGuidePlaceholders(
        "Count is {{non_existent_placeholder}}",
        { city: "Bengaluru" },
        "test.md"
      )
    ).toThrow(/Unknown guide placeholder/);

    const fortyOneWords = Array.from({ length: 41 }, (_, i) => `word${i + 1}`).join(
      " "
    );
    expect(countWords(fortyOneWords)).toBe(41);
    expect(() =>
      parseGuideSectionMarkdown(
        `---\nid: test\nnumber: "99"\ntitle: "Test"\n---\n\n## Slide summary\n\n${fortyOneWords}\n\n## Presenter notes\n\nNotes here.\n\n## Reading version\n\nReading here.\n`,
        "99-test.md",
        {}
      )
    ).toThrow(/max 40 allowed/);
  });

  it("includes all 6 pre-rendered Mermaid SVG diagrams and all 12 Playwright screenshots (1280 px and 390 px)", async () => {
    const bundle = await loadGuideBundle();

    expect(bundle.diagrams.map((d) => d.id)).toEqual([
      "sources-to-one-code",
      "how-a-rule-travels",
      "data-layers",
      "checks-pipeline",
      "layered-packs",
      "agent-engine-four-doors",
    ]);
    for (const diag of bundle.diagrams) {
      expect(diag.svgMarkup).toBeTruthy();
      expect(diag.svgMarkup).toContain("<svg");
      expect(diag.svgMarkup).toContain('role="img"');
    }

    expect(bundle.screenshots.map((s) => s.id)).toEqual([
      "home-hero",
      "far-story",
      "subject-far",
      "map-place-card",
      "verify-task",
      "pilot-page",
    ]);
    for (const shot of bundle.screenshots) {
      const deskPath = path.join(
        process.cwd(),
        "public",
        shot.desktopSrc.replace(/^\/+/, "")
      );
      const mobPath = path.join(
        process.cwd(),
        "public",
        shot.mobileSrc.replace(/^\/+/, "")
      );
      expect(fs.existsSync(deskPath)).toBe(true);
      expect(fs.existsSync(mobPath)).toBe(true);
      expect(fs.statSync(deskPath).size).toBeGreaterThan(5000);
      expect(fs.statSync(mobPath).size).toBeGreaterThan(5000);
    }
  });

  it("follows Section 6's content brief and describes the agent engine, packs, and installers strictly as planned", async () => {
    const bundle = await loadGuideBundle();
    const byId = new Map(bundle.sections.map((s) => [s.id, s]));

    // 6.1 Narrative
    const whySec = byId.get("why-this-exists")!;
    expect(whySec.readingMarkdown).toContain(
      "Every building in India is governed by rules scattered across bye-laws, master plans, amendments, circulars and state Acts"
    );
    expect(whySec.readingMarkdown).toContain("**Open**");
    expect(whySec.readingMarkdown).toContain("**Cited**");
    expect(whySec.readingMarkdown).toContain("**Collective**");
    expect(whySec.readingMarkdown).toContain("Read. Trace. Compare.");

    // 6.2 Principles
    const prinSec = byId.get("principles")!;
    expect(prinSec.readingMarkdown).toContain(
      "The law's words exactly as printed; nothing added inside legal text."
    );
    expect(prinSec.readingMarkdown).toContain("Apache-2.0");
    expect(prinSec.readingMarkdown).toContain("CC BY 4.0");

    // 6.3 & 6.4 Roles & Layered packs (planned)
    const moveSec = byId.get("the-movement")!;
    for (const role of [
      "State stewards",
      "Contributors",
      "Reviewers",
      "Maintainers",
    ]) {
      expect(moveSec.readingMarkdown).toContain(role);
    }
    expect(moveSec.readingMarkdown.toLowerCase()).toContain("planned");

    // 6.5 Agent engine (planned) — no unbuilt install commands
    const devSec = byId.get("for-developers")!;
    expect(devSec.readingMarkdown.toLowerCase()).toContain("planned");
    expect(devSec.readingMarkdown).toContain("local MCP server");
    expect(devSec.readingMarkdown).toContain("Agent Skill");
    expect(devSec.readingMarkdown).not.toMatch(
      /npm install -g bylaw|brew install bylaw|curl -fsSL.*install/i
    );

    // 6.6 & 6.7 Offers & Workshop
    const takePartSec = byId.get("take-part")!;
    expect(takePartSec.readingMarkdown).toContain("functional MoUs");
    expect(takePartSec.readingMarkdown).toContain("60 to 120-hour");
    expect(takePartSec.readingMarkdown).toContain("two-hour faculty session");

    // 6.8 Launch timeline
    const launchSec = byId.get("the-launch")!;
    expect(launchSec.readingMarkdown).toContain("30 Nov – 6 Dec 2026");
    expect(launchSec.readingMarkdown).toContain("Last week of Jan");
    expect(launchSec.readingMarkdown).toContain("Verify Bengaluru");
    expect(launchSec.readingMarkdown).toContain("Dec 2027");

    // 6.9 Sustainability
    const sustSec = byId.get("sustainability")!;
    expect(sustSec.readingMarkdown).toContain(
      "Grants and philanthropy for open civic technology"
    );
    expect(sustSec.readingMarkdown).toContain("CSR funding");
  });

  it("verifies that any quoted statutory text in the guide matches stored PDF page text", async () => {
    const bundle = await loadGuideBundle();
    const seeSec = bundle.sections.find((s) => s.id === "see-it-working")!;
    const quoteMatch = /`"(The set backs required[\s\S]*?given below\.)"`/.exec(
      seeSec.readingMarkdown
    );
    expect(quoteMatch).not.toBeNull();

    const bblPagesPath = path.join(
      process.cwd(),
      "data",
      "page_text",
      "bbl-2003.pages.json.gz"
    );
    const pagesPayload = JSON.parse(
      zlib.gunzipSync(fs.readFileSync(bblPagesPath)).toString("utf8")
    );
    const page21Text = String(pagesPayload.pages["21"] || "")
      .replace(/\s+/g, " ")
      .toLowerCase();
    const quotedWords = quoteMatch![1]
      .replace(/[^a-zA-Z0-9\s]/g, " ")
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length >= 4);
    for (const word of quotedWords) {
      expect(page21Text).toContain(word);
    }
  });

  it("renders /guide in reading mode with sticky contents, 5 audience entry points, Present and Download buttons, and passes axe-core WCAG 2.2 AA", async () => {
    const ui = await GuidePage();
    const { container, unmount } = render(ui);

    expect(
      screen.getByRole("heading", { name: "The Bylaw One Guide" })
    ).toBeInTheDocument();
    expect(screen.getByTestId("guide-present-btn")).toHaveAttribute(
      "href",
      "/guide/slides"
    );
    expect(screen.getByTestId("guide-download-btn")).toHaveAttribute(
      "href",
      "/bylaw-one-guide.html"
    );
    expect(screen.getByTestId("guide-sticky-contents")).toBeInTheDocument();

    for (const audId of [
      "college",
      "student",
      "practitioner",
      "developer",
      "partner-funder",
    ]) {
      expect(screen.getByTestId(`audience-btn-${audId}`)).toBeInTheDocument();
    }

    fireEvent.click(screen.getByTestId("audience-btn-college"));
    expect(screen.getByTestId("audience-selected-path")).toHaveTextContent(
      /Recommended path for: Colleges & faculties/i
    );

    expect(
      screen.getByTestId("start-slides-see-it-working")
    ).toHaveAttribute("href", "/guide/slides#slide-see-it-working");

    const results = await axe.run(container, {
      rules: {
        region: { enabled: false },
      },
    });
    expect(results.violations).toHaveLength(0);
    unmount();
  });

  it("renders /guide/slides with reveal.js deck, keyboard navigation, speaker view presenter notes, section jump strip, and passes axe-core WCAG 2.2 AA", async () => {
    const ui = await GuideSlidesPage();
    const { container, unmount } = render(ui);

    expect(screen.getByTestId("guide-slides-deck")).toBeInTheDocument();
    expect(screen.getByTestId("slides-counter")).toHaveTextContent(
      /Slide 1 \/ 24/
    );

    // Click Next -> advances to Slide 2
    fireEvent.click(screen.getByTestId("slides-next-btn"));
    expect(screen.getByTestId("slides-counter")).toHaveTextContent(
      /Slide 2 \/ 24/
    );

    // Toggle Speaker view -> shows presenter notes
    fireEvent.click(screen.getByTestId("slides-speaker-view-btn"));
    expect(screen.getByTestId("guide-speaker-view-panel")).toBeInTheDocument();
    expect(
      (screen.getByTestId("speaker-view-notes-text").textContent ?? "").length
    ).toBeGreaterThan(50);

    // Jump to "08 · The launch" section
    fireEvent.click(screen.getByTestId("slides-jump-section-the-launch"));
    expect(screen.getByTestId("speaker-view-notes-text")).toHaveTextContent(
      /public launch takes place in Bengaluru in the last week of January 2027/i
    );

    const results = await axe.run(container, {
      rules: {
        region: { enabled: false },
      },
    });
    expect(results.violations).toHaveLength(0);
    unmount();
  });
});
