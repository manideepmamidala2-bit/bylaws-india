import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ClausePanel } from "@/components/ClausePanel";
import { ClauseTree } from "@/components/ClauseTree";
import type { ClauseNode } from "@/lib/data";

const BASE_CLAUSE: ClauseNode = {
  clause_id: "fixture-base-2020:1.1",
  record_version: 1,
  record_id: "fixture-base-2020:1.1@v1",
  record_supersedes: null,
  record_superseded_by: null,
  record_change_reason: null,
  supersedes: null,
  superseded_by: null,
  legal_status: "in_force",
  number: "1.1",
  title: "Short Title",
  level: 2,
  parent_id: "fixture-base-2020:1",
  order: 1,
  text: "These regulations apply to residential plots.",
  tables: [],
  citations: [
    {
      doc_id: "fixture-base-2020",
      page: 2,
      bbox: [0.1, 0.2, 0.8, 0.3],
      text_excerpt: "1.1 Short Title: These regulations apply",
    },
  ],
  cross_references: [],
  amended_by: [],
  applies_to_zones: ["Z1"],
  verification: "machine_checked",
  source_url: "https://example.org/fixture-base.pdf",
};

describe("Rules R8 & R12 — Provenance fallbacks and Record Version separation", () => {
  it("renders STATUS UNKNOWN in ClausePanel and ClauseTree when legal_status is missing", () => {
    const unknownStatusClause: ClauseNode = {
      ...BASE_CLAUSE,
      legal_status: undefined,
    };

    const { unmount } = render(
      <ClausePanel
        selectedZoneCode={null}
        clauses={[unknownStatusClause]}
        showDrafts={true}
      />
    );
    expect(screen.getByText("STATUS UNKNOWN")).toBeInTheDocument();
    expect(screen.queryByText("IN FORCE")).not.toBeInTheDocument();
    unmount();

    render(<ClauseTree clauses={[unknownStatusClause]} />);
    expect(screen.getByText("STATUS UNKNOWN")).toBeInTheDocument();
    expect(screen.queryByText("IN FORCE")).not.toBeInTheDocument();
  });

  it("renders 'No source page recorded' and no source link when citations are empty", () => {
    const noPageClause: ClauseNode = {
      ...BASE_CLAUSE,
      citations: [],
    };

    const { container, unmount } = render(
      <ClausePanel
        selectedZoneCode={null}
        clauses={[noPageClause]}
        showDrafts={true}
      />
    );
    expect(screen.getByText("No source page recorded")).toBeInTheDocument();
    expect(container.querySelectorAll("a")).toHaveLength(0);
    unmount();

    render(<ClauseTree clauses={[noPageClause]} />);
    expect(screen.getByText("No source page recorded")).toBeInTheDocument();
  });

  it("enforces Rule R12: hides @v1 by default when @v2 is present, shows 'v2 · corrected from v1', and never badges record version as SUPERSEDED legal status", () => {
    const v1Clause: ClauseNode = {
      ...BASE_CLAUSE,
      record_version: 1,
      record_id: "fixture-base-2020:1.1@v1",
      title: "Short Title and Commencement",
      superseded_by: "fixture-base-2020:1.1@v2",
      record_superseded_by: "fixture-base-2020:1.1@v2",
      legal_status: "in_force",
    };
    const v2Clause: ClauseNode = {
      ...BASE_CLAUSE,
      record_version: 2,
      record_id: "fixture-base-2020:1.1@v2",
      title: "Short Title, Extent and Commencement",
      supersedes: "fixture-base-2020:1.1@v1",
      record_supersedes: "fixture-base-2020:1.1@v1",
      record_change_reason: "Refine heading on verified clause",
      legal_status: "in_force",
    };

    render(
      <ClausePanel
        selectedZoneCode={null}
        clauses={[v1Clause, v2Clause]}
        showDrafts={true}
      />
    );

    expect(
      screen.getByText("Short Title, Extent and Commencement")
    ).toBeInTheDocument();
    expect(
      screen.getByText(/v2 · corrected from v1/i)
    ).toBeInTheDocument();
    expect(screen.getByText("IN FORCE")).toBeInTheDocument();
    expect(screen.queryByText("SUPERSEDED")).not.toBeInTheDocument();
  });
});
