# Intake: PR 12 — Greater Bengaluru Overnight Run (08b, 09, 09b, 10, 11)

**Change**: 261124-peq2-pr-12-greater-bengaluru-overnight
**Created**: 2026-11-24
**Status**: Draft

## Origin

Implements **PR 12 — Greater Bengaluru, Overnight Run: 08b, 09, 09b, 10, 11** (`docs/plans/pr-series/12-bengaluru-city-overnight.md`) combining:
- **Part 1 (`08b`)**: `docs/plans/pr-series/08b-clarity-navigation-map-fix.md` — Map fix (with Playwright 206 + non-blank canvas test), annotation quality cleanup, law-first document view, `/structure` page, outline tree & collection overview, Pagefind static search, and `graph.json` (Graphology JSON + GraphML).
- **Part 2 (City Foundation)**: Parent jurisdiction `in-ka-bengaluru` (Greater Bengaluru / GBA area) + five child City Corporations (`in-ka-bengaluru-central`, `-north`, `-south`, `-east`, `-west`, keeping `-south` URLs working), all 5 corporation boundaries + 10 GBA zones + 369 wards, and the 2026 Building (Amendment) Bye-laws of Central, North, East, and West as per-corporation effects (`applies_in`) with per-corporation consolidated views.
- **Part 3 (`09`)**: `docs/plans/pr-series/09-zoning-regulations-amendment-chain.md` — RMP 2015 Zoning Regulations (`rmp2015-zr`) amendment chain (`2009-03`, `2015-03`, `2018-09`, `2019-06`, `2025-02`, `2026-01`, plus any newly obtainable notifications) structured to Layer 1/2/3 with inserted chapters, replaced tables, versions, consolidated views, and page-image verification in `qa.md`.
- **Part 4 (`09b`)**: `docs/plans/pr-series/09b-relations-topics-conflicts.md` — Schema 1.4 fourth layer: topics (`topics.yaml`), relations (`relations.json`: `same_topic`, `definition_differs`, `numeric_differs`, `cross_document_reference`, `precedence`, `corporation_differs`), precedence only from quoted statutory spans, institution succession (`succession.yaml`), `applies_to_jurisdiction` with evidence, `/j/[id]/topics` and `/j/[id]/topics/[topic]` pages, and `/j/[id]/documents/[doc]/[eid]` provision pages with a local neighborhood graph + accessible list.
- **Part 5 (`10`)**: `docs/plans/pr-series/10-supporting-provisions.md` — Supporting building provisions (Fire NOC, TDR Rules 2016, OC exemptions, Metro 11 m influence zone, Lake buffers where verified, GBA 2025 OC/CC rules) with `applies_in` and verified map overlays (`derived: true`, approximate).
- **Part 6 (`11`)**: `docs/plans/pr-series/11-all-sheets-zone-links-release.md` — All RMP 2015 Proposed Land Use sheets intersecting the GBA boundary (starting with remaining Bengaluru South sheets, then corporation by corporation), `zone_applicability` annotations with evidence spans, legend-to-regulation mapping in `docs/map.md`, and final city-wide release.

## Why

The scope expands from Bengaluru South City Corporation (`in-ka-bengaluru-south`) to **all of Greater Bengaluru (`in-ka-bengaluru`)** across all five GBA City Corporations (**Central, North, South, East, and West**, 369 wards total), while making the web viewer clear, fast, and navigable (law-first document view, outline tree, Pagefind search, Graphology `graph.json`, `/structure` page, Topics & Conflicts pages, and per-corporation consolidated bye-laws).

## What Changes

### Part 1 — Map Fix, Clarity & Navigation (`08b-clarity-navigation-map-fix.md`)
1. **Blank Map Diagnosis & Fix + Playwright Browser Test (`docs/map.md`, `components/ZoneMap.tsx`, `e2e/map.spec.ts`)**:
   - Record the root-cause diagnosis in `docs/map.md` (MapLibre v5 ESM worker URL resolution in Next.js 15 webpack returning `""` $\to$ HTML MIME type error, fixed via self-hosted `/maplibre-gl-worker.js` and `maplibregl.setWorkerUrl("/maplibre-gl-worker.js")`, plus WebGL fallback banner and city-wide Protomaps `.pmtiles` bbox covering all 5 GBA corporations `[77.44, 12.81, 77.79, 13.18]`).
   - Add a Playwright test (`e2e/map.spec.ts`, run in CI) that loads the Map page on desktop and mobile viewports, asserts `.pmtiles` HTTP `206 Partial Content` (or valid PMTiles protocol tile responses) and non-blank `<canvas>` pixels.
2. **Annotation Quality (`pipeline/bylaws/structure.py`, `pipeline/bylaws/annotations.py`, `qa.md`)**:
   - Definitions: `defines` extracted strictly from quoted terms in definitions provisions; reject stopwords, articles, single letters, and numbers; fix/clear any definition node with a rejected term.
   - Defined-term uses: whole-word, case-insensitive phrase matching; never match stopwords, never inside headings or the definition that defines the term; at most **one annotation per term per provision** (first occurrence), scoped within the document.
   - Cross-references: only explicit target patterns (`bye-law 6.0`, `clause (i)`, `Table 2B`, `regulation 4.1.2`, `Chapter 11`, `section 428 of the Act`); resolve within-document first, then registered instruments, else `external:<instrument>`.
   - Provision types: explicit rule order (`scope` / `commencement` $\to$ `definition` $\to$ `exception` $\to$ `prohibition` $\to$ `permission` $\to$ `obligation` $\to$ `fee`); nodes inside a definition inherit `definition`; unclassified stays unclassified; store confidence and filter display by threshold (`>= 0.8`).
   - Report per-document annotation QA metrics in `qa.md` and enforce via unit tests.
3. **Show the Law First (`components/ClauseTree.tsx`, `app/j/[id]/documents/[doc]/page.tsx`)**:
   - Default per provision: number, heading (if any), text, and small `"p. N"` link at the end.
   - Document-level metadata shown once at the top; per-provision badges shown only when different from the document (`legal_status`, `effective_from`, amendment marks).
   - On-demand `"Details"` toggle per provision (address `eid`, verification, annotations) and global `"Show annotations"` switch (off by default).
   - Defined terms underlined when annotations are shown, with definition popover/tooltip and link to definition; cross-references rendered as plain links to target provisions.
   - Evaluate `@lawsafrica/law-widgets` for R4 licence and offline Akoma Ntoso compatibility and record the decision in `docs/dependencies.md`.
4. **Graph Export, `/structure` Page, Outline Tree & Pagefind Search (`pipeline/bylaws/graph.py`, `app/structure/page.tsx`, `components/DocumentOutlineTree.tsx`, Pagefind)**:
   - Pipeline emits `graph.json` (Graphology JSON format) and `graph.graphml` per release (`contains`, `defines`, `uses_term`, `refers_to`, `amends`, `amended_by`, `in_register`), grouped by parent and child jurisdiction.
   - New `/structure` page explaining documents, provisions, definitions, table rows, amendments, annotations, link kinds with real examples, a model diagram, live counts, and download links.
   - Outline sidebar on Document page + collection overview diagram on Documents page, with lazy loading for large documents.
   - Static full-text search across all documents with Pagefind (`pagefind`, MIT) with filters for document, layer, and legal status.

### Part 2 — City Foundation (`in-ka-bengaluru` + 5 City Corporations)
- Add parent jurisdiction `jurisdictions/in-ka-bengaluru.yaml` and child jurisdictions `in-ka-bengaluru-central.yaml`, `in-ka-bengaluru-north.yaml`, `in-ka-bengaluru-south.yaml`, `in-ka-bengaluru-east.yaml`, and `in-ka-bengaluru-west.yaml`.
- Extend `jurisdiction.schema.json` with `parent` and `amendments.schema.json` with `applies_in: string[]`.
- Import all 5 corporation boundaries (`gba_corporation_boundary`), all 10 GBA zones (`gba_zone_boundary`), and all 369 wards (`ward_369_final`) with R15 `retrieval` records and cross-checked ward counts per corporation in `map-verification.md`.
- Discover, acquire (with R15 `retrieval` records), structure, and apply the **2026 Building (Amendment) Bye-laws of Central, North, East, and West City Corporations** (starting from `data.opencity.in/dataset/bengaluru-city-corporations-bye-laws-2026`, GBA/corporation portals, and Wayback Machine CDX; declaring any unobtainable ones per R16), computing per-corporation consolidated views of `bbl-2003` and rendering a Corporation Picker on Home, Map, and Document pages.

### Part 3 — Zoning Regulations Amendment Chain (`09-zoning-regulations-amendment-chain.md`)
- Structure all acquired instruments in the RMP 2015 Zoning Regulations (`rmp2015-zr`) chain (`rmp2015-zr-amend-2009-03`, `2015-03`, `2018-09`, `2019-06`, `2025-02`, `2026-01`, plus any additional obtainable notifications), extract Layer 3 `effects` (including inserted chapters like Premium FAR and replaced setback/FAR/parking tables), compute node `versions` and consolidated views, and verify every applied effect against 150 DPI page images in `qa.md`.

### Part 4 — Schema 1.4: Topics, Relations, Conflicts, Precedence, Applicability & Succession (`09b-relations-topics-conflicts.md`)
- Add `topics.yaml`, `succession.yaml`, `relations.schema.json` (`relations.json` with `same_topic`, `definition_differs`, `numeric_differs`, `cross_document_reference`, `precedence`, `corporation_differs`), `quantity` and `topic` annotations, and `applies_to_jurisdiction` on documents.
- Build `/j/[id]/topics`, `/j/[id]/topics/[topic]`, and `/j/[id]/documents/[doc]/[eid]` (with local neighborhood graph and accessible list), plus institution succession notes (`"now: ..."`) and applicability badges on Sources.

### Part 5 — Supporting Provisions & Verified Overlays (`10-supporting-provisions.md`)
- Discover, acquire (R15), and structure building-relevant provisions of supporting instruments (Fire Force Act 1964 & 2023/2025 amendments, KTCP Benefit of Development Rights Rules 2016, 2025/2026 OC exemption orders, Metro 11 m influence zone notification `UDD 110 PRJ 2020`, Lake buffer Act/amendment if verified, GBA 2025 OC/CC rules) with `applies_in`, and draw verified derived overlays (`overlays.geojson`).

### Part 6 — All Land-Use Sheets, Zone Applicability Links & Final City Release (`11-all-sheets-zone-links-release.md`)
- Process all RMP 2015 Proposed Land Use sheets intersecting the GBA boundary (remaining Bengaluru South sheets first, then Central, North, East, West by area share) using the PR 07 printed-grid method, reporting per-sheet RMSE and independent road/ward checks in `map-verification.md`.
- Extract `zone_applicability` annotations with evidence spans (`zone_code` or `ALL`, excluding preamble/title/definition/commencement nodes), document the legend-to-regulation mapping in `docs/map.md`, wire zone clicks on the Map page to consolidated provisions for the selected corporation, and publish the final city-wide release.

## Affected Memory

- `architecture/overview`: (modify) Document Parts 1–6 (Greater Bengaluru 5-corporation model, Playwright map verification, law-first document viewer, `/structure`, `/topics`, local provision graph, Pagefind search, supporting provisions, and city-wide land-use sheets).
- `schemas/data-contracts`: (modify) Document Schema 1.4 contracts (`parent`, `applies_in`, `applies_to_jurisdiction`, `graph.json`, `relations.schema.json`, `topic` / `quantity` / `zone_applicability` annotations).

## Impact

- **Schemas**: `schemas/*.schema.json` (Schema 1.4), `pipeline/bylaws/models/_generated.py`, `lib/types/generated.ts`.
- **Pipeline**: `pipeline/bylaws/` (`structure.py`, `annotations.py`, `amendments.py`, `consolidate.py`, `graph.py`, `relations.py`, `geo/`, `validate.py`, `publish.py`), `pipeline/tests/`.
- **Jurisdictions**: `jurisdictions/in-ka-bengaluru*.yaml`, `topics.yaml`, `succession.yaml`.
- **Web App**: `app/`, `components/`, `lib/`, `e2e/map.spec.ts`, `public/data/`.

## Open Questions

None — `docs/plans/pr-series/12-bengaluru-city-overnight.md` defines the exact 6-part sequence, unattended run rules, priority order, and acceptance criteria.

## Assumptions

| # | Grade | Decision | Rationale | Scores |
|---|-------|----------|-----------|--------|
| 1 | Certain | Open one draft PR at the start and commit + push at the end of each completed Part (1 through 6) with a published release and updated `docs/progress.md` and PR description | Explicitly mandated by `12-bengaluru-city-overnight.md` §2 Rules 1–6 | S:98 R:95 A:95 D:98 |
| 2 | Certain | Keep `in-ka-bengaluru-south` URLs and data working while introducing parent `in-ka-bengaluru` and the four sibling City Corporations (`-central`, `-north`, `-east`, `-west`) | Explicitly mandated by `12-bengaluru-city-overnight.md` §1 (`-south (existing ID kept, so current links keep working)`) | S:98 R:95 A:95 D:98 |
| 3 | Certain | Never fabricate source content, never mark any record `human_verified`, and declare any blocked download (`HTTP 403` / missing Wayback capture), unreadable sheet, or ambiguous amendment in `declarations.json` and the PR description | Explicitly mandated by `12-bengaluru-city-overnight.md` §2 Rules 1 & 7 and Rules R10, R15, R16, R17 | S:98 R:95 A:98 D:98 |

3 assumptions (3 certain, 0 confident, 0 tentative, 0 unresolved). Run /fab-clarify to review.
