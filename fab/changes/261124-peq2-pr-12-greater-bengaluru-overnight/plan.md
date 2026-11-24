# Plan: PR 12 — Greater Bengaluru Overnight Run (08b, 09, 09b, 10, 11)

**Change**: 261124-peq2-pr-12-greater-bengaluru-overnight
**Created**: 2026-11-24
**Status**: Active
**Intake**: `intake.md`

## Requirements

### Part 1 (`08b`): Map Fix, Annotation Quality, Law-First Document View, `/structure`, Outline Tree, Pagefind Search & `graph.json`

- **R1 (Map Fix, Annotation Quality, Law-First View, Graphology `graph.json`, `/structure` & Pagefind Search)**:
  - The Map page MUST render in a real headless Chromium browser test (`e2e/map.spec.ts` via Playwright) with valid `.pmtiles` byte-range / tile responses and non-blank canvas pixels, and show a WebGL fallback banner with links to ward/zone data if WebGL is unavailable; `docs/map.md` MUST record the root-cause diagnosis and fix.
  - Annotations (`pipeline/bylaws/structure.py`, `pipeline/bylaws/annotations.py`) MUST extract `defines` strictly from quoted terms (rejecting stopwords, articles, single letters, and numbers), match `defined_term_use` whole-word case-insensitively at most once per term per provision (excluding headings and definition nodes), resolve `cross_reference` within-document first then registered instruments (else `external:<instrument>`), and classify `provision_type` by explicit rule order (`scope`/`commencement` $\to$ `definition` $\to$ `exception` $\to$ `prohibition` $\to$ `permission` $\to$ `obligation` $\to$ `fee`), reporting annotation QA metrics in `qa.md`.
  - The Document page (`components/ClauseTree.tsx`, `app/j/[id]/documents/[doc]/page.tsx`) MUST show the law first (number, heading, text, and `"p. N"` link by default; `"Details"` toggle per provision; global `"Show annotations"` switch off by default; definition popovers when enabled; collapsible outline sidebar with breadcrumbs).
  - The pipeline MUST publish `graph.json` (Graphology JSON format) and `graph.graphml` per release; the web app MUST provide `/structure` (plain-English explanation, model diagram, real examples, live counts, downloads), collection overview diagram on `/j/[id]/clauses`, and static full-text search via Pagefind (`pagefind`, MIT).
  - **Scenario**: Running Playwright and unit tests for Part 1
    - **GIVEN** the built Next.js application and published release
    - **WHEN** `pytest tests/test_pr12_greater_bengaluru.py` and Playwright `e2e/map.spec.ts` run
    - **THEN** the map canvas is non-blank, zero stopwords appear as defined terms, zero headings are marked as references, `graph.json` and `graph.graphml` exist, and `/structure` renders live counts and passes `axe-core`.

### Part 2: City Foundation (`in-ka-bengaluru` + Five City Corporations)

- **R2 (Parent `in-ka-bengaluru` & Five Child City Corporations, 369 Wards & 2026 Bye-laws Amendments)**:
  - The repository MUST define parent jurisdiction `in-ka-bengaluru` (Greater Bengaluru, GBA area) holding shared documents and child jurisdictions `in-ka-bengaluru-central`, `in-ka-bengaluru-north`, `in-ka-bengaluru-south` (existing URLs preserved), `in-ka-bengaluru-east`, and `in-ka-bengaluru-west` (`parent: "in-ka-bengaluru"` in `schemas/jurisdiction.schema.json`, `applies_in: string[]` on `AmendmentEffect` in `schemas/amendments.schema.json`).
  - All 5 corporation boundaries (`gba_corporation_boundary`), all 10 GBA zones (`gba_zone_boundary`), and all 369 wards (`ward_369_final`) MUST be imported with R15 `retrieval` records and cross-checked per corporation in `map-verification.md`.
  - The 2026 Building (Amendment) Bye-laws of Central, North, East, and West City Corporations MUST be discovered, acquired (with R15 `retrieval` records where obtainable, or declared in `unobtainable_documents` per R16), structured, and applied with `applies_in` so per-corporation consolidated views of `bbl-2003` are computed and selectable via a corporation picker on Home, Map, and Document pages.
  - **Scenario**: Inspecting the five City Corporations and per-corporation consolidated views
    - **GIVEN** `in-ka-bengaluru` and its five child City Corporations
    - **WHEN** `bylaws check-provenance` and `pytest tests/test_pr12_greater_bengaluru.py` run
    - **THEN** all 5 corporations have valid boundaries and 369 total wards, `in-ka-bengaluru-south` URLs continue working, and per-corporation consolidated views and corporation picker render cleanly.

### Part 3 (`09`): RMP 2015 Zoning Regulations Amendment Chain

- **R3 (Zoning Regulations Amendment Chain Structured, Applied & Verified)**:
  - All acquired English instruments in the RMP 2015 Zoning Regulations (`rmp2015-zr`) chain (`rmp2015-zr-amend-2009-03`, `2015-03`, `2018-09`, `2019-06`, `2025-02`, `2026-01`, plus any additional obtainable notifications) MUST be structured (`structured: true`), their Layer 3 `effects` (including inserted chapters like Premium FAR and replaced setback/FAR/parking tables) extracted and applied in date order to `rmp2015-zr` node `versions`, conflicts recorded without guesswork, consolidated views and timeline updated, and every applied effect verified against 150 DPI page images in `qa.md`.
  - **Scenario**: Validating `rmp2015-zr` Layer 3 effects and consolidated views
    - **GIVEN** the structured `rmp2015-zr` amendment chain
    - **WHEN** `bylaws amendments` and `bylaws validate` run
    - **THEN** inserted chapters and replaced tables in `rmp2015-zr` have versioned nodes and page-image verification rows in `qa.md`.

### Part 4 (`09b`): Schema 1.4 Topics, Relations, Conflicts, Precedence, Applicability & Succession

- **R4 (Schema 1.4 Fourth Layer: Topics, Relations, Precedence, Succession, Applicability & Local Provision Graph)**:
  - The repository MUST define `topics.yaml`, `succession.yaml`, and `schemas/relations.schema.json` (`relations.json` with `same_topic`, `definition_differs`, `numeric_differs`, `cross_document_reference`, `precedence`, `corporation_differs`), tag provisions with `topic` and `quantity` annotations (using `pint` BSD-3-Clause / regex), require a quoted statutory precedence span for every `precedence` relation, record `applies_to_jurisdiction` (`yes | no | partly | unknown` with evidence) on every document, and render `/j/[id]/topics`, `/j/[id]/topics/[topic]`, and `/j/[id]/documents/[doc]/[eid]` (with local neighborhood graph + accessible connection list).
  - **Scenario**: Inspecting `relations.json`, `/j/[id]/topics`, and `/j/[id]/documents/[doc]/[eid]`
    - **GIVEN** the published `relations.json` and topic annotations
    - **WHEN** `pytest` and `npm test` run
    - **THEN** every `precedence` relation has a quoted statutory span, `relations.md` reports counts and sampled verification, and the Topics and Provision local-graph pages pass `axe-core` WCAG AA checks.

### Parts 5 & 6 (`10` & `11`): Supporting Provisions, Verified Overlays, All Land-Use Sheets & `zone_applicability` Links

- **R5 (Supporting Provisions, Verified Overlays, All Intersecting Land-Use Sheets & `zone_applicability` Evidence Links)**:
  - Supporting building instruments (Fire NOC, KTCP TDR Rules 2016, OC exemptions, Metro 11 m influence zone, Lake buffers where verified, GBA 2025 OC/CC rules) MUST be discovered, acquired (R15) or declared (R16), their building-relevant provisions structured with `applies_in`, and verified derived overlays (`overlays.geojson`, `derived: true`, approximate) drawn.
  - All RMP 2015 Proposed Land Use sheets intersecting the GBA boundary (remaining Bengaluru South sheets first, then corporation by corporation) MUST be acquired and extracted via the PR 07 printed-grid method with measured RMSE and independent road/ward checks in `map-verification.md`; `zone_applicability` annotations (`zone_code` or `ALL` with evidence spans, never on preamble/title/definition/commencement) and the legend-to-regulation mapping in `docs/map.md` MUST link map zone clicks to consolidated provisions for that corporation.
  - **Scenario**: Inspecting city-wide sheets, `zone_applicability` links, and final release
    - **GIVEN** the processed RMP 2015 sheets and `zone_applicability` annotations
    - **WHEN** `pytest` and `npm run build` run
    - **THEN** every processed sheet reports its RMSE and road/ward checks in `map-verification.md`, every `zone_applicability` link carries a non-empty evidence span, and no preamble/title/definition/commencement node is linked to a zone.

## Tasks

### Phase 1: Part 1 (`08b`) — Map Fix + Playwright Test, Annotation Cleanup, Law-First View, `graph.json`, `/structure`, Outline Tree & Pagefind Search

- [x] T001 Open the draft GitHub PR (`PR 12 — Greater Bengaluru Overnight Run`), write falsifiable tests in `pipeline/tests/test_pr12_greater_bengaluru.py` and Playwright browser test `e2e/map.spec.ts`, complete Part 1 (`08b`: blank map diagnosis in `docs/map.md` + WebGL fallback + Playwright 206/canvas check; strict quoted-only `defines`, stopword-free single-occurrence `defined_term_use`, `external:` cross-references, and ordered `provision_type` rules + QA table in `qa.md`; law-first `ClauseTree.tsx` with on-demand Details, global annotations toggle, definition popovers, and outline sidebar; `graph.json` + `graph.graphml` generator in `pipeline/bylaws/graph.py`; `/structure` page; collection overview diagram; Pagefind search), publish Release `2.4.0`, and commit + push <!-- R1 -->

### Phase 2: Part 2 — City Foundation (`in-ka-bengaluru` + 5 City Corporations, 369 Wards & 2026 Corporation Bye-law Amendments)

- [ ] T002 Implement Part 2: create `jurisdictions/in-ka-bengaluru.yaml` (parent) and `in-ka-bengaluru-central.yaml`, `in-ka-bengaluru-north.yaml`, `in-ka-bengaluru-south.yaml`, `in-ka-bengaluru-east.yaml`, `in-ka-bengaluru-west.yaml` (children with `parent: "in-ka-bengaluru"`), import all 5 corporation boundaries, 10 GBA zones, and 369 wards with R15 `retrieval` records and ward count verification in `map-verification.md`, discover/acquire/structure/apply the 2026 Building (Amendment) Bye-laws of Central, North, East, and West with `applies_in` and per-corporation consolidated views, update Home/Map/Document pages with the Corporation Picker, publish Release `2.5.0`, and commit + push <!-- R2 -->

### Phase 3: Part 3 (`09`) — RMP 2015 Zoning Regulations Amendment Chain

- [ ] T003 Implement Part 3 (`09`): structure all acquired RMP 2015 Zoning Regulations (`rmp2015-zr`) amending instruments (`2009-03`, `2015-03`, `2018-09`, `2019-06`, `2025-02`, `2026-01`), extract and apply Layer 3 `effects` (including inserted Premium FAR / TDR provisions and replaced setback/FAR/parking tables) in date order, record any conflicts without guesswork, verify all applied effects against 150 DPI page images in `qa.md`, update the Zoning Regulations coverage notice and Timeline, publish Release `2.6.0`, and commit + push <!-- R3 -->

### Phase 4: Part 4 (`09b`) — Schema 1.4 Topics, Relations, Conflicts, Precedence, Applicability, Succession & Local Graph

- [ ] T004 Implement Part 4 (`09b`): add Schema 1.4 (`topics.yaml`, `succession.yaml`, `schemas/relations.schema.json`, `applies_to_jurisdiction` on documents, `topic` and `quantity` annotations using `pint`/regex, and `pipeline/bylaws/relations.py` generating `relations.json` with `same_topic`, `definition_differs`, `numeric_differs`, `cross_document_reference`, `precedence` requiring quoted statutory spans, and `corporation_differs`, plus `relations.md` QA report), build `/j/[id]/topics`, `/j/[id]/topics/[topic]`, and `/j/[id]/documents/[doc]/[eid]` (with local neighborhood graph + accessible list) and update `/structure` and `/j/[id]/sources`, publish Release `2.7.0`, and commit + push <!-- R4 -->

### Phase 5: Parts 5 & 6 (`10` & `11`) — Supporting Provisions, Verified Overlays, All GBA Land-Use Sheets, `zone_applicability` Links & Final Release `3.0.0`

- [ ] T005 Implement Parts 5 & 6 (`10` & `11`): discover/acquire/structure supporting building provisions (Fire NOC, TDR Rules 2016, OC exemptions, Metro 11 m influence zone, Lake buffers where verified, GBA 2025 OC/CC rules) and generate verified derived overlays (`overlays.geojson`); acquire and process all RMP 2015 Proposed Land Use sheets intersecting the GBA boundary (remaining Bengaluru South sheets first, then Central, North, East, West) with printed-grid georeferencing and independent road/ward checks in `map-verification.md`; extract `zone_applicability` annotations with evidence spans and legend-to-regulation mapping in `docs/map.md`; publish final Release `3.0.0`, update `docs/progress.md` and the PR description (`For owner review`, `Decisions made`, `Known gaps`, release counts), run review sub-agent, hydrate memory, and ship PR 12 <!-- R5 -->

## Acceptance

### Functional Completeness
- [ ] A-001 R1: Playwright browser test (`e2e/map.spec.ts`) verifies that the Map page renders on desktop and mobile viewports with valid `.pmtiles` responses and a non-blank `<canvas>`, and `docs/map.md` records the blank-map diagnosis and fix.
- [ ] A-002 R1: No stopword is a defined term, no heading is a cross-reference, `defined_term_use` appears at most once per term per provision, and `qa.md` reports per-document annotation counts (definitions, rejected terms, term uses median/max, references resolved/external/unresolved, provision types by kind).
- [ ] A-003 R1: The Document page default view shows only number, heading, text, and `"p. N"` link, with on-demand `"Details"`, global `"Show annotations"` off by default, definition popovers, outline sidebar with breadcrumbs, `/structure` page, `graph.json` (Graphology format) + `graph.graphml`, and Pagefind search across all documents.
- [ ] A-004 R2: Parent jurisdiction `in-ka-bengaluru` and five child City Corporations (`-central`, `-north`, `-south`, `-east`, `-west`) are configured with all 5 corporation boundaries, 10 GBA zones, and 369 wards (with R15 `retrieval` records), `-south` URLs continue working, and per-corporation consolidated views of `bbl-2003` (with `applies_in`) are selectable in the UI.
- [ ] A-005 R3: All acquired English instruments in the RMP 2015 Zoning Regulations (`rmp2015-zr`) chain are structured, their Layer 3 `effects` (including inserted chapters and replaced tables) are applied and verified against 150 DPI page images in `qa.md`, and conflicts are recorded without guesswork.
- [ ] A-006 R4: Schema 1.4 (`topics.yaml`, `succession.yaml`, `relations.json`, `applies_to_jurisdiction`, `topic` and `quantity` annotations) is active; every `precedence` relation has a quoted statutory span; `relations.md` reports QA metrics; and `/j/[id]/topics`, `/j/[id]/topics/[topic]`, and `/j/[id]/documents/[doc]/[eid]` (with local graph and accessible list) render and pass `axe-core`.
- [ ] A-007 R5: Supporting building provisions and verified overlays (`overlays.geojson`, `derived: true`) are published, all RMP 2015 Proposed Land Use sheets intersecting the GBA boundary are processed (or declared) in the stated order with measured RMSE and road/ward checks in `map-verification.md`, and `zone_applicability` links carry evidence spans (with zero preamble/title/definition/commencement nodes linked to zones).

### Scenario Coverage
- [ ] A-008 R1: `pipeline/tests/test_pr12_greater_bengaluru.py`, `e2e/map.spec.ts`, and `__tests__/routes-and-axe.test.tsx` verify all 6 parts and pass in CI.

### Code Quality
- [ ] A-009 Pattern consistency: Zero jurisdiction-specific constants appear in `pipeline/bylaws/`, `app/`, `components/`, or `lib/` (`pipeline/tests/test_r1_no_hardcoding.py` passes), and zero records are marked `human_verified`.
- [ ] A-010 No unnecessary duplication: Every new dependency and model passes `pipeline/tests/test_r4_licences.py` and is recorded in `docs/dependencies.md`, `bylaws check-provenance` exits `0`, and `npm run build` succeeds.

## Assumptions

| # | Grade | Decision | Rationale | Scores |
|---|-------|----------|-----------|--------|
| 1 | Certain | Open one draft PR at the start and commit + push at the end of each completed Part (1 through 6) with a published release and updated `docs/progress.md` and PR description | Explicitly mandated by `12-bengaluru-city-overnight.md` §2 Rules 1–6 | S:98 R:95 A:95 D:98 |
| 2 | Certain | Keep `in-ka-bengaluru-south` URLs and data working while introducing parent `in-ka-bengaluru` and the four sibling City Corporations (`-central`, `-north`, `-east`, `-west`) | Explicitly mandated by `12-bengaluru-city-overnight.md` §1 (`-south (existing ID kept, so current links keep working)`) | S:98 R:95 A:95 D:98 |
| 3 | Certain | Never fabricate source content, never mark any record `human_verified`, and declare any blocked download (`HTTP 403` / missing Wayback capture), unreadable sheet, or ambiguous amendment in `declarations.json` and the PR description | Explicitly mandated by `12-bengaluru-city-overnight.md` §2 Rules 1 & 7 and Rules R10, R15, R16, R17 | S:98 R:95 A:98 D:98 |

3 assumptions (3 certain, 0 confident, 0 tentative).
