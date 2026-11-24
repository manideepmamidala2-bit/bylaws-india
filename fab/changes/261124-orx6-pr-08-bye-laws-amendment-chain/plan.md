# Plan: PR 08 — Building Bye-laws Amendment Chain

**Change**: 261124-orx6-pr-08-bye-laws-amendment-chain
**Created**: 2026-11-24
**Status**: Active
**Intake**: `intake.md`

## Requirements

### Source Discovery & Acquisition: Building Bye-laws 2003 Chain (`source-discovery.md`, `jurisdictions/in-ka-bengaluru-south.yaml`)

- **R1 (Complete Building Bye-laws 2003 Chain Discovery & Acquisition)**: The pipeline MUST re-search official portals (`bpas.bbmpgov.in/BPAMSClient4/CommonForms/Circulars.aspx`, `bengalurusouth.karnataka.gov.in`, `gba.karnataka.gov.in`, `erajyapatra.karnataka.gov.in`, `data.opencity.in`, `data-opencity.sgp1.cdn.digitaloceanspaces.com`, and Wayback Machine CDX) for every instrument in the Building Bye-laws 2003 (`bbl-2003`) chain—including `ka-model-bbl-2017` (*Karnataka Municipalities Model Building Bye-Laws, 2017*), any obtainable BBMP / Bengaluru South City Corporation Building Bye-laws notifications/circulars, and the 2026 Bengaluru South City Corporation Building (Amendment) Bye-laws (04.03.2026 / 01.04.2026 draft and 14.05.2026 final)—log every search query and outcome in `data/reports/in-ka-bengaluru-south/source-discovery.md`, acquire obtainable PDFs via `bylaws acquire` with R15 `retrieval` records, and declare any unobtainable instruments under Rule R16.
  - **Scenario**: Inspecting `source-discovery.md` and `jurisdictions/in-ka-bengaluru-south.yaml`
    - **GIVEN** the Building Bye-laws 2003 (`bbl-2003`) chain in `jurisdictions/in-ka-bengaluru-south.yaml`
    - **WHEN** `bylaws check-provenance` and `pytest tests/test_bylaws_amendment_chain_pr08.py` run
    - **THEN** every acquired Building Bye-laws instrument has a complete R15 `retrieval` record and R17 `status_evidence`, and every unobtainable 2026 bye-law notification is logged with searched portals/URLs in `source-discovery.md` and declared in `unobtainable_documents`.

### Structuring & Layer 2/3 Amendment Pipeline: `bbl-2003` Chain (`structure.py`, `amendments.py`, `consolidate.py`)

- **R2 (Layer 1 Structuring & Layer 2 Annotations for Bye-laws Chain Instruments)**: Every acquired English instrument in the Building Bye-laws chain (`bbl-2003`, `ka-model-bbl-2017`, and any acquired `bbl-2003` amending instruments) MUST be structured (`structured: true`) into a Schema 1.3 Layer 1 node tree with Layer 2 stand-off annotations (`<doc_id>.annotations.json` with `cross_reference`, `defined_term_use`, `provision_type`), keeping `draft` instruments labelled `draft` so they never produce effects on `in_force` text.
  - **Scenario**: Validating structured Building Bye-laws chain documents
    - **GIVEN** the acquired Building Bye-laws chain PDFs in `data/raw/in-ka-bengaluru-south/`
    - **WHEN** `bylaws structure --jurisdiction in-ka-bengaluru-south` runs
    - **THEN** `<doc_id>.clauses.json` and `<doc_id>.annotations.json` are generated and validate against Schema 1.3 (`clause-tree` and `annotations`).

- **R3 (Layer 3 Amendment Effects, Node Versions, Consolidated Views & Page-Image Self-Check)**: `pipeline/bylaws/amendments.py` and `pipeline/bylaws/consolidate.py` MUST extract and apply Layer 3 `effects` (`amendments.json`: `action`, `target_eid`, `new_nodes`, `valid_from`, `confidence`, `applied`, `unapplied_reason`), create new `NodeVersion` entries (`valid_from`, `valid_to`) on modified `bbl-2003` nodes, compute derived consolidated views (`consolidated.json`, `derived: true`) for each amendment date and today, and verify every applied effect against the amending document's page image in `data/reports/in-ka-bengaluru-south/qa.md`.
  - **Scenario**: Inspecting `amendments.json`, `consolidated.json`, and `qa.md`
    - **GIVEN** the structured `bbl-2003` tree and its amending instruments / overrides
    - **WHEN** `bylaws amendments --jurisdiction in-ka-bengaluru-south` and `bylaws validate --jurisdiction in-ka-bengaluru-south` run
    - **THEN** `amendments.json` and `consolidated.json` validate against Schema 1.3, every applied effect creates a versioned node on `bbl-2003` (`versions` length $\ge 2$) and is verified against page images in `qa.md`, and low-confidence (`confidence < 0.8`) or unapplied effects are recorded with `applied: false` and `unapplied_reason`.

### Web Application: Document Toggle, Timeline & Release `2.3.0` (`app/j/[id]/documents/[doc]/page.tsx`, `app/j/[id]/timeline/page.tsx`)

- **R4 (Document Page Consolidated Toggle, Timeline & Release `2.3.0`)**: The Document page (`/j/in-ka-bengaluru-south/documents/[doc]`) MUST provide the **Original / As amended (derived)** toggle, show `"Changed by <instrument>, from <date>"` with links to the amending instruction and source page, display low-confidence unapplied effects beside their targets without applying them, update the coverage notice on `bbl-2003` to reflect the completed Building Bye-laws chain (while retaining `"Amendments not yet applied"` on `rmp2015-zr` until PR 09), update the Timeline page (`/j/in-ka-bengaluru-south/timeline`) to show the chronological chain of instruments and what each changed, and publish Release `2.3.0`.
  - **Scenario**: Rendering `/j/in-ka-bengaluru-south/documents/bbl-2003` and `/j/in-ka-bengaluru-south/timeline`
    - **GIVEN** Release `2.3.0` in `public/data/in-ka-bengaluru-south/2.3.0/`
    - **WHEN** `npm test` and `npm run build` run
    - **THEN** `/j/in-ka-bengaluru-south/documents/bbl-2003` renders the Original / As amended toggle and updated coverage notice, `/j/in-ka-bengaluru-south/documents/rmp2015-zr` retains the `"Amendments not yet applied"` notice, `/j/in-ka-bengaluru-south/timeline` renders the chronological instrument chain with change summaries, and all routes pass `axe-core` WCAG AA checks.

### Design Decisions

1. **Decision**: Support both automated text-pattern instruction detection and declarative `amendment_links` in `data/overrides/<jurisdiction>/overrides.yaml` in `pipeline/bylaws/amendments.py`, and include `as_of_dates` in `consolidated.json`.
   - **Why**: Ensures every amending instruction (including multi-clause substitutions, table insertions, and statutory saving/supersession provisions) produces an exact, reproducible Layer 3 `AmendmentEffect` and `NodeVersion` chain (Rules R6, R14, R17).
   - **Rejected**: Relying solely on regex heuristics without override support or omitting per-date consolidated views.
   - *Introduced by*: `261124-orx6-pr-08-bye-laws-amendment-chain`

## Tasks

### Phase 1: Falsifiable Tests & Building Bye-laws 2003 Chain Re-Search / Acquisition

- [x] T001 Write falsifiable tests in `pipeline/tests/test_bylaws_amendment_chain_pr08.py` (demonstrated failing first per Rule R11); re-search `bpas.bbmpgov.in/BPAMSClient4/CommonForms/Circulars.aspx`, `bengalurusouth.karnataka.gov.in`, `gba.karnataka.gov.in`, `erajyapatra.karnataka.gov.in`, `data.opencity.in`, and Wayback Machine CDX for all Building Bye-laws 2003 amendments/circulars (including the 2026 BSCC Building Amendment Bye-laws draft/final and BBMP bye-law circulars), acquire obtainable PDFs with R15 `retrieval` records, and document all findings in `data/reports/in-ka-bengaluru-south/source-discovery.md` and `docs/sources/in-ka-bengaluru-south.md` <!-- R1 -->

### Phase 2: Structure Bye-laws Chain Instruments & Layer 2/3 Amendment Pipeline (`structure.py`, `amendments.py`, `consolidate.py`, `validate.py`)

- [x] T002 Enable structuring (`structured: true`) for `ka-model-bbl-2017` and all acquired Building Bye-laws chain instruments in `jurisdictions/in-ka-bengaluru-south.yaml`, run `bylaws parse` and `bylaws structure` to produce Layer 1 node trees (`<doc_id>.clauses.json`) and Layer 2 annotations (`<doc_id>.annotations.json`), keeping `draft` instruments labelled `draft` <!-- R2 -->
- [x] T003 Enhance `pipeline/bylaws/amendments.py`, `pipeline/bylaws/consolidate.py`, and `pipeline/bylaws/validate.py` (and `data/overrides/in-ka-bengaluru-south/overrides.yaml` if needed) to extract and apply Layer 3 `effects` (`amendments.json`) and `NodeVersion` chains (`valid_from`, `valid_to`) on `bbl-2003`, compute derived consolidated views (`consolidated.json`) per amendment date and today, and verify every applied effect against the amending document's page image in `data/reports/in-ka-bengaluru-south/qa.md` <!-- R3 -->

### Phase 3: Document Page Consolidated Toggle, Timeline & Release `2.3.0`

- [x] T004 Update `app/j/[id]/documents/[doc]/page.tsx`, `components/ClauseTree.tsx`, and `app/j/[id]/timeline/page.tsx` to render the **Original / As amended (derived)** toggle with date selector, `"Changed by <instrument>, from <date>"` provenance links, unapplied low-confidence effects display, per-document coverage notice (updating `bbl-2003` while keeping `"Amendments not yet applied"` on `rmp2015-zr`), and chronological timeline changes, and publish Release `2.3.0` (`public/data/in-ka-bengaluru-south/2.3.0/`) <!-- R4 -->
- [x] T005 Update `__tests__/routes-and-axe.test.tsx`, `pipeline/tests/test_bengaluru_south_dataset.py`, `pipeline/tests/test_anchor_documents_pr05.py`, and `docs/progress.md`, verify all Python tests (`pytest`), `bylaws check-provenance`, R1/R4 checks, Vitest + `axe-core` WCAG AA tests (`npm test`), `npm run lint`, `npm run typecheck`, and `npm run build` pass, open draft PR, run review sub-agent, hydrate memory, and ship PR 08 <!-- R1, R2, R3, R4 -->

## Acceptance

### Functional Completeness
- [x] A-001 R1: `data/reports/in-ka-bengaluru-south/source-discovery.md` logs the PR 08 re-search for all Building Bye-laws 2003 amendments (including `bpas.bbmpgov.in/BPAMSClient4/CommonForms/Circulars.aspx`, the 04.03.2026 / 01.04.2026 draft, and the 14.05.2026 final notification); every acquired instrument has a complete R15 `retrieval` record and R17 `status_evidence`, and unobtainable notifications are declared in `unobtainable_documents` (`bylaws check-provenance` exits `0`).
- [x] A-002 R2: All acquired English instruments in the Building Bye-laws chain (`bbl-2003`, `ka-model-bbl-2017`, and any acquired `bbl-2003` amending instruments) are structured (`structured: true`) with valid Schema 1.3 `<doc_id>.clauses.json` and `<doc_id>.annotations.json` files; `draft` documents are labelled `draft` and do not modify `in_force` text.
- [x] A-003 R3: `public/data/in-ka-bengaluru-south/2.3.0/amendments.json` and `consolidated.json` validate against Schema 1.3; every instruction in every acquired in-force Building Bye-laws amending instrument has a Layer 3 effect (`applied: true` creating a new `NodeVersion` with `valid_from`/`valid_to`, or `applied: false` with `unapplied_reason`), and every applied effect is verified against the amending document's page image in `data/reports/in-ka-bengaluru-south/qa.md`.
- [x] A-004 R3: Consolidated views (`consolidated.json`, `derived: true`) are computed accurately for today and for each amendment date, verified by unit tests with hand-written expectations on affected `bbl-2003` nodes.
- [x] A-005 R4: `/j/in-ka-bengaluru-south/documents/bbl-2003` renders the **Original / As amended (derived)** toggle, shows `"Changed by <instrument>, from <date>"` on amended nodes with links to the instruction and source page, displays low-confidence unapplied effects beside their targets, and updates the coverage notice for `bbl-2003` while keeping `"Amendments not yet applied"` on `/j/in-ka-bengaluru-south/documents/rmp2015-zr`.
- [x] A-006 R4: `/j/in-ka-bengaluru-south/timeline` displays the Building Bye-laws chain in chronological date order with a clear summary of what each instrument changed and links to the structured documents/clauses.

### Scenario Coverage
- [x] A-007 R3: `pipeline/tests/test_bylaws_amendment_chain_pr08.py` verifies the structured Building Bye-laws chain documents, Layer 3 `effects` in `amendments.json`, node `versions` and `consolidated.json` against hand-written expectations, and the page-image effect verification section in `qa.md`.
- [x] A-008 R4: `__tests__/routes-and-axe.test.tsx` verifies the `bbl-2003` Document page toggle/notice, `rmp2015-zr` notice, Timeline page, and Data page (`Latest: v2.3.0`) with zero `axe-core` WCAG AA violations.

### Code Quality
- [x] A-009 Pattern consistency: Zero jurisdiction-specific constants appear in `pipeline/bylaws/`, `app/`, `components/`, or `lib/` (`pipeline/tests/test_r1_no_hardcoding.py` passes).
- [x] A-010 No unnecessary duplication: All Python and npm dependencies remain strictly permissive (`pipeline/tests/test_r4_licences.py` passes) and `npm run build` succeeds.

## Assumptions

| # | Grade | Decision | Rationale | Scores |
|---|-------|----------|-----------|--------|
| 1 | Certain | Bump `in-ka-bengaluru-south` `release_version` to `"2.3.0"` for PR 08 | Follows `08-bye-laws-amendment-chain.md` §5 (`New release; declarations updated`), incrementing minor version from PR 07's `2.2.0` | S:95 R:95 A:95 D:95 |
| 2 | Certain | Re-search official portals and Wayback Machine for any additional Building Bye-laws 2003 amendments (including `bpas.bbmpgov.in` circulars/notifications and 2026 BSCC bye-law notifications), acquire obtainable PDFs with R15 `retrieval` records, and declare unobtainable ones under Rule R16 | Explicitly required by `08-bye-laws-amendment-chain.md` §Inputs and Rules R15/R16 | S:95 R:90 A:95 D:95 |
| 3 | Certain | Structure `ka-model-bbl-2017` and all acquired Building Bye-laws chain instruments to Schema 1.3 Layer 1 + Layer 2 + Layer 3, verify applied effects against page images in `qa.md`, and keep the `"Amendments not yet applied"` notice on `rmp2015-zr` until PR 09 | Explicitly required by `08-bye-laws-amendment-chain.md` §1–§5 | S:95 R:90 A:95 D:95 |

3 assumptions (3 certain, 0 confident, 0 tentative).

## Deletion Candidates

- `None — this change adds new functionality without making existing code redundant`
