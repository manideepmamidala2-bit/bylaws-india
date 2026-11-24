# Plan: PR 03 — Schema 1.3: Three Layers

**Change**: 261124-llmz-pr-03-schema-three-layers
**Intake**: `intake.md`

## Requirements

### Layer 1: The Faithful Tree

#### R1: Akoma Ntoso `eid` Addressing, 22 Node Types, Intro/Content/Wrap-Up, Hierarchical Tables, and Definitions
`schemas/clause-tree.schema.json` (`schema_version: "1.3"`) and `pipeline/bylaws/structure.py` MUST structure every document into a faithful hierarchy where every node carries:
- `eid`: hierarchical address built from ancestors (`<prefix>_<sanitised_token>` joined by `__`, using the documented prefixes `part_`, `chp_`, `sec_`, `reg_`, `bl_`, `cl_`, `subcl_`, `item_`, `para_`, `prov_`, `expl_`, `note_`, `def_`, `sch_`, `ann_`, `app_`, `form_`, `tbl_`, `row_`, `pref_`, `prea_`, `sig_`). Sibling `eid` collisions MUST fail validation.
- `native_number`: string or null, verbatim as printed.
- `type`: one of `preface`, `preamble`, `part`, `chapter`, `section`, `regulation`, `bye_law`, `clause`, `subclause`, `item`, `paragraph`, `proviso`, `explanation`, `note`, `definition`, `schedule`, `annexure`, `appendix`, `form`, `table`, `table_row`, `signature_block`.
- `heading` (`string | null`), `intro` (`string | null`, lead-in before children), `content` (`string | null`, for leaf nodes), `wrap_up` (`string | null`, closing text after children).
- `children`: ordered list of child `eid`s (`string[]`), and `parent_eid` (`string | null`).
- `defines` and `defines_normalised` on `definition` nodes.
- `table_meta` on `table` nodes (`columns` header tree with optional `unit`, `rows` list of `table_row` `eid`s, `footnotes` with markers linking to cells, `extraction: "complete" | "failed"`, `page_image`, `gap_reason`) and `cells` (`string[]`) on `table_row` nodes.
- `citations` (`bbox: null` when positions cannot be determined) and `language: "en"`.
- `versions`: ordered list of Layer 3 temporal versions, kept strictly separate from R12 `record_version` fields.

- **GIVEN** a document containing repeated `(a)` sub-items under different parents, a clause with lead-in + list + closing text, a proviso, an explanation, a definitions section, and a two-row header table with a footnote
- **WHEN** `bylaws structure` executes
- **THEN** repeated `(a)` items receive distinct ancestor-scoped `eid`s (`...__item_a`) without collision, lead-in text lands in `intro` and closing text in `wrap_up` on the parent, definitions populate `defines` and `defines_normalised`, and the table and its rows/footnotes are structured as `table` and `table_row` nodes

### Layer 2: Stand-Off Annotations

#### R2: Stand-Off Character-Span Annotations (`annotations.json`)
`schemas/annotations.schema.json` (`schema_version: "1.3"`) and `pipeline/bylaws/annotations.py` MUST store and validate stand-off annotations per document (`<doc_id>.annotations.json`):
- Each annotation carries `annotation_id`, `target` (`{ eid, version_id, field, cell_index?, span: [start, end], span_text }`), `kind` (`"cross_reference" | "defined_term_use" | "provision_type"`), `value`, `method` (`"rule" | "model" | "person"`, optional `model_name`, `model_version`), `confidence` (`0.0`–`1.0`), and `verification`.
- Validation MUST verify that `0 <= start < end <= len(field_text)` and `field_text[start:end] == span_text` for every annotation.

- **GIVEN** a structured document tree and its `<doc_id>.annotations.json`
- **WHEN** `validate_annotations_against_tree` runs
- **THEN** every annotation's `[start, end]` span matches the exact substring in the target node's field, and any out-of-bounds or mismatched span raises a validation error

### Layer 3: History, Effects & Derived Consolidated View

#### R3: Node Versions, Amending Effects (`effects.json`), and Date-Derived Consolidated View
`schemas/amendments.schema.json` (`effects.json` / `amendments.json`), `pipeline/bylaws/amendments.py`, and `pipeline/bylaws/consolidate.py` MUST model amending instruments both as Layer 1 documents and as structured `effects[]`:
- Each effect carries `effect_id`, `amending_doc`, `amending_eid`, `target_doc`, `target_eid`, `action` (`"substitute" | "insert_after" | "insert_before" | "omit" | "renumber" | "modify_text"`), `new_nodes` (structured nodes for substitutions and insertions), `valid_from` (from the instrument's commencement provision, R17), `confidence` (`0.0`–`1.0`), `applied`, and `verification`.
- Applying high-confidence effects (`confidence >= 0.8`) appends new dated `versions` on target nodes (and inserts `new_nodes` for insertions). Low-confidence effects are recorded (`applied: false`) and shown beside the target without mutating versions.
- Consolidated views (`derived: true`, Rule R14) are computed for any `as_of_date` by selecting each node's version valid on that date (`valid_from <= as_of_date < valid_to`).

- **GIVEN** the base fixture document (`valid_from: "2020-02-01"`) and an amending fixture document (`valid_from: "2024-06-15"`) that substitutes one clause, inserts one clause, and omits one clause
- **WHEN** the consolidated view is computed on a date before `"2024-06-15"` (e.g. `"2023-01-01"`) and on a date on/after `"2024-06-15"` (e.g. `"2025-01-01"`)
- **THEN** the pre-amendment view returns the original tree unmodified, while the post-amendment view shows the substituted text, includes the inserted node, and marks/omits the omitted node, with `derived: true` and the list of applied effects

### Web Document Viewer & Schema Documentation

#### R4: Web Document Page Rendering of All Three Layers and `docs/schema.md`
`lib/data.ts`, `components/ClauseTree.tsx`, `components/ClausePanel.tsx`, and `app/j/[id]/documents/[doc]/page.tsx` MUST render all Layer 1 node types (`intro`, `children`, `wrap_up`, tables with multi-row header hierarchy and footnotes, definitions, provisos, and explanations visually distinct), Layer 2 annotations (links for `cross_reference` and `defined_term_use`, mono badges for `provision_type`), and Layer 3 versions via the "Original / As amended (derived)" toggle. `docs/schema.md` MUST explain all three layers in plain English with a worked example, the prefix table, and an Akoma Ntoso element mapping table.

- **GIVEN** the extended `xx-test-fixture` dataset rendered in the web Document page (`SHOW_TEST_JURISDICTIONS="true"`)
- **WHEN** rendered in both Original and As Amended (Derived) modes and checked with `axe-core`
- **THEN** all node types (`intro`/`wrap_up`, `definition`, `proviso`, `explanation`, hierarchical `table` with `table_row` and `footnote`), annotations, and amended versions render accurately with zero `axe-core` violations

### Design Decisions

#### Dual-Compatible Node Representation in Schema 1.3
**Decision**: Populate all Schema 1.3 Layer 1 fields (`eid`, `native_number`, `type`, `heading`, `intro`, `content`, `wrap_up`, `children`, `parent_eid`, `defines`, `defines_normalised`, `table_meta`, `cells`, `versions`) on every node while retaining `clause_id` (`<doc_id>:<eid>`), `number`, `title`, and `text` as synchronized convenience properties.
**Why**: Satisfies every Layer 1–3 requirement of `03-schema-three-layers.md` while keeping map zone tagging (`clause-zone-tags.json`) and R12 record version helpers (`<doc_id>:<eid>@v<N>`) uniform across pipeline stages.
**Rejected**: Breaking `clause_id` references in geospatial zone tags before PR 11 migrates zone links to `zone_applicability` annotations.
*Introduced by*: 261124-llmz-pr-03-schema-three-layers

## Tasks

### Phase 1: Schema 1.3 Contracts & Codegen

- [x] T001 Update `schemas/*.schema.json` to Schema 1.3 (`clause-tree.schema.json` with Layer 1/3 node fields, new `schemas/annotations.schema.json` for Layer 2 stand-off annotations, `amendments.schema.json` with Layer 3 `effects[]`, `consolidated.schema.json`, `overrides.schema.json`, `manifest.schema.json`, and `bylaws.toml`), register `annotations` in `pipeline/bylaws/schema_validator.py` and `scripts/generate_models.py`, and run `make generate` <!-- R1, R2, R3 -->

### Phase 2: Pipeline Layer 1, Layer 2 & Layer 3 Implementation

- [x] T002 Implement Layer 1 faithful tree builder in `pipeline/bylaws/structure.py` (Akoma Ntoso `eid`s, 22 node types, `intro`/`content`/`wrap_up`, `definition` nodes, hierarchical `table` & `table_row` nodes, sibling collision validation), Layer 2 stand-off annotation generator & span validator in `pipeline/bylaws/annotations.py`, and Layer 3 `effects` / `versions` / date-parameterized consolidation in `pipeline/bylaws/amendments.py`, `pipeline/bylaws/consolidate.py`, `pipeline/bylaws/overrides.py`, `pipeline/bylaws/validate.py`, and `pipeline/bylaws/publish.py` <!-- R1, R2, R3 -->

### Phase 3: Extended Fixture & Hand-Written Golden Outputs (R11)

- [x] T003 Extend the synthetic fixture (`pipeline/tests/fixtures/generate_fixtures.py`, `pipeline/tests/fixtures/sample-*.json`, `jurisdictions/xx-test-fixture.yaml`, `data/overrides/xx-test-fixture/overrides.yaml`) with lead-in + list + wrap-up, repeated `(a)` under different parents, a proviso, an explanation, a definitions section, a two-row header table with a footnote, and an amending document that substitutes, inserts, and omits clauses; hand-write expected golden outputs in `pipeline/tests/golden/xx-test-fixture/` and refresh `public/data/xx-test-fixture/0.1.0/` <!-- R1, R2, R3, R4 -->

### Phase 4: Web Document Page & Schema Documentation

- [x] T004 Update `lib/data.ts`, `components/ClauseTree.tsx`, `components/ClausePanel.tsx`, `app/j/[id]/documents/[doc]/page.tsx`, `app/j/[id]/clauses/page.tsx`, and `app/j/[id]/timeline/page.tsx` to render the Layer 1 tree (`intro`/`children`/`wrap_up`, hierarchical tables with footnotes, definitions, provisos, explanations), Layer 2 annotations (links and provision-type labels), and Layer 3 version-based "Original / As amended (derived)" toggle <!-- R4 -->
- [x] T005 Write `docs/schema.md` (explaining all three layers in plain English with a worked example, prefix table, and Akoma Ntoso mapping table), update `docs/progress.md`, and write falsifiable tests in `pipeline/tests/test_schema_1_3_three_layers.py` (shown failing first per R11) and Vitest tests in `__tests__/` <!-- R1, R2, R3, R4 -->

## Acceptance

### Functional Completeness

- [ ] A-001 R1: `schemas/clause-tree.schema.json` and `pipeline/bylaws/structure.py` produce Layer 1 nodes with Akoma Ntoso `eid`s, `native_number`, 22 node types, `intro`/`content`/`wrap_up`, `children`, `defines`/`defines_normalised`, hierarchical `table` + `table_row` nodes, and `versions`
- [ ] A-002 R2: `schemas/annotations.schema.json` and `pipeline/bylaws/annotations.py` produce `<doc_id>.annotations.json` with `cross_reference`, `defined_term_use`, and `provision_type` annotations whose character spans validate against the target field text
- [ ] A-003 R3: `schemas/amendments.schema.json`, `pipeline/bylaws/amendments.py`, and `pipeline/bylaws/consolidate.py` produce Layer 3 `effects` (`substitute`, `insert_after`, `insert_before`, `omit`, `renumber`, `modify_text`), update node `versions`, and compute derived consolidated views for any date
- [ ] A-004 R4: Extended synthetic fixture produces the hand-written expected tree, annotations, effects, and versions, and the web Document page renders all node types, annotations, and version toggle with `axe-core` passing
- [ ] A-005 R4: `docs/schema.md` explains all three layers in plain English with a worked example, prefix table, and Akoma Ntoso element mapping table

### Behavioral Correctness

- [ ] A-006 R1: Repeated sub-items `(a)` under different parents never collide, and `intro` and `wrap_up` text land on the parent node
- [ ] A-007 R3: Consolidated view on a date after the fixture amendment shows substituted, inserted, and omitted text correctly; on a date before the amendment, it shows the original text
- [ ] A-008 R2: Every annotation span validates against its target field text, and a planted invalid span fails validation

### Scenario Coverage

- [ ] A-009 R1: `make generate` produces zero git diff on `pipeline/bylaws/models/_generated.py` and `lib/types/generated.ts`, and `bylaws run-all --jurisdiction xx-test-fixture` matches hand-written golden files
- [ ] A-010 R4: All Vitest and `axe-core` accessibility tests pass on the updated Document page

### Code Quality

- [ ] A-011 Pattern consistency: New code follows existing pipeline and Next.js TypeScript conventions
- [ ] A-012 No unnecessary duplication: Shared tree traversal, span validation, and version-selection utilities are reused

## Notes

- Check items as you review: `- [x]`
- All acceptance items must pass before `/fab-continue` (hydrate)
- If an item is not applicable, mark checked and prefix with **N/A**: `- [x] A-NNN **N/A**: {reason}`

## Assumptions

| # | Grade | Decision | Rationale | Scores |
|---|-------|----------|-----------|--------|
| 1 | Certain | Bump `schema_version` to `"1.3"` across all JSON schemas and add `schemas/annotations.schema.json` for Layer 2 stand-off annotations | Explicitly specified in `03-schema-three-layers.md` | S:95 R:90 A:95 D:95 |
| 2 | Certain | Keep compatibility properties (`clause_id` = `<doc_id>:<eid>`, `number`, `title`, `text`) alongside `eid`, `native_number`, `heading`, `intro`, `content`, `wrap_up` on `ClauseNode` so map zone tags and existing loaders work seamlessly | Preserves clean interface compatibility across pipeline stages and UI components | S:90 R:95 A:95 D:90 |
| 3 | Certain | Compute consolidated views per date directly from each node's `versions` list (`valid_from <= date < valid_to`) | Explicitly specified in `03-schema-three-layers.md` Layer 3 | S:95 R:90 A:95 D:95 |
| 4 | Certain | Include Akoma Ntoso element element mapping table and worked example in `docs/schema.md` | Explicitly specified in `03-schema-three-layers.md` Implementation | S:95 R:95 A:95 D:100 |

4 assumptions (4 certain, 0 confident, 0 tentative).
