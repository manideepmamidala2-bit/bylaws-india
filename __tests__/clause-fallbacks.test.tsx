import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ClausePanel } from "@/components/ClausePanel";
import { ClauseTree } from "@/components/ClauseTree";
import type { ClauseNode } from "@/lib/data";

const BASE_CLAUSE: ClauseNode = {
  clause_id: "fixture-base-2020:1.1",
  record_id: "fixture-base-2020:1.1@v1",
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

describe("Rule R8 — No provenance or legal status fallbacks", () => {
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

  it("renders SUPERSEDED badge when superseded_by is set on a human_verified record (Rule R9)", () => {
    const supersededClause: ClauseNode = {
      ...BASE_CLAUSE,
      superseded_by: "fixture-base-2020:1.1@v2",
    };

    render(
      <ClausePanel
        selectedZoneCode={null}
        clauses={[supersededClause]}
        showDrafts={true}
      />
    );
    expect(screen.getByText("SUPERSEDED")).toBeInTheDocument();
  });
});
