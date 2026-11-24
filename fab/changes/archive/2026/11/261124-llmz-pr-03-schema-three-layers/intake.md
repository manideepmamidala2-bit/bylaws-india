# Intake: PR 03 — Schema 1.3: Three Layers

**Change**: 261124-llmz-pr-03-schema-three-layers
**Created**: 2026-11-24

## Origin

> Implement PR 03 (Schema 1.3: Three Layers) per docs/plans/pr-series/00-overview.md and docs/plans/pr-series/03-schema-three-layers.md: replace flat clauses with Layer 1 faithful tree (Akoma Ntoso eid, native_number, 22 node types, intro/content/wrap_up, hierarchical tables, definitions), Layer 2 stand-off annotations (cross_reference, defined_term_use, provision_type with validated spans), and Layer 3 history (versions, effects.json, derived consolidated view); regenerate Pydantic/TS types; update structure/overrides/publish stages and web Document page; extend xx-synthetic-city fixture with hand-written expected outputs; write docs/schema.md.

Third PR in the 11-PR remediation series (`docs/plans/pr-series/00-overview.md` and `docs/plans/pr-series/03-schema-three-layers.md`), following PR 02 (`261124-fcwm-pr-02-provenance-gate-repo-sync`, merged in PR #7).

## Why

1. **Problem**: Schema 1.2 represented documents as a flat `clauses[]` array where tables were embedded inside prose clauses, lead-in (`intro`) and closing (`wrap_up`) text around sub-lists were concatenated into a single `text` string, provisos/explanations/definitions were indistinguishable from ordinary clauses, cross-references were untyped string lists without character spans, and amendments produced a separate flat replacement string rather than dated node versions.
2. **Consequence of inaction**: Real Indian building bye-laws and master plan zoning regulations (arriving in PRs 04–05 and 08–09) contain deeply nested sub-clauses with repeated `(a)`/`(i)` numbering, lead-in and wrap-up text around lists, multi-row header tables with footnotes, formal definitions sections, provisos, explanations, and multi-instrument amendment chains that cannot be represented faithfully in a flat list.
3. **Why this approach**: Schema 1.3 cleanly separates **Layer 1 (The faithful tree)**, **Layer 2 (Stand-off annotations)**, and **Layer 3 (Temporal versions & amending effects)**, built and verified against the synthetic test fixture with hand-written expected outputs (Rule R11) before any real documents are structured in PR 05.

## What Changes

### 1. Layer 1 — The Faithful Tree (`schemas/clause-tree.schema.json`, `pipeline/bylaws/structure.py`)

- Bump `schema_version` to `"1.3"` across all schemas in `schemas/`.
- Update `schemas/clause-tree.schema.json`:
  - Each node (`ClauseNode` / `DocumentNode`) carries:
    - `eid`: Akoma Ntoso hierarchical address built from ancestors (`<prefix>_<sanitised_token>` joined by `__`, e.g., `chp_I__bl_1.1__item_a`).
    - `native_number`: string or null, verbatim as printed (`"1.1"`, `"(a)"`, `"(i)"`, `"2A"`).
    - `type`: one of 22 node types (`preface`, `preamble`, `part`, `chapter`, `section`, `regulation`, `bye_law`, `clause`, `subclause`, `item`, `paragraph`, `proviso`, `explanation`, `note`, `definition`, `schedule`, `annexure`, `appendix`, `form`, `table`, `table_row`, `signature_block`).
    - `heading` (`string | null`), `intro` (`string | null`, lead-in before children), `content` (`string | null`, body for leaf nodes), `wrap_up` (`string | null`, closing text after children).
    - `children`: ordered array of child `eid`s (`string[]`), plus `parent_eid` (`string | null`).
    - `defines` (`string | null`, verbatim defined term for `type == "definition"`) and `defines_normalised` (`string | null`, lowercase unquoted term).
    - `table_meta` (for `type == "table"`): `columns` (hierarchical header tree of `{ label, unit?, children? }`), `rows` (list of `table_row` `eid`s), `footnotes` (`{ marker, text, cell_refs[] }[]`), `extraction` (`"complete" | "failed"`), `page_image` (`string | null`), `gap_reason` (`string | null`).
    - `cells` (for `type == "table_row"`): `string[]` verbatim cell texts.
    - `citations`: non-empty list of `{ doc_id, page, bbox, text_excerpt }` (`bbox: null` when positions are unavailable, never invented).
    - `language`: `"en"`.
    - `versions`: ordered list of Layer 3 `NodeVersion` objects (`version_id`, `valid_from`, `valid_to`, `heading`, `intro`, `content`, `wrap_up`, `cells`, `source_doc`, `source_eid`, `effect_id`, `citations`, `legal_status`, `omitted`).
    - R12 record version fields (`record_id`, `record_version`, `record_supersedes`, `record_superseded_by`, `record_change_reason`, `verification`, `verified_by`).
- Prefixes (`docs/schema.md`):
  `part_`, `chp_`, `sec_`, `reg_`, `bl_`, `cl_`, `subcl_`, `item_`, `para_`, `prov_`, `expl_`, `note_`, `def_`, `sch_`, `ann_`, `app_`, `form_`, `tbl_`, `row_`, `pref_`, `prea_`, `sig_`. Native tokens are sanitised (spaces removed, brackets dropped, case preserved) and must be unique within their parent; any sibling `eid` collision fails validation.

### 2. Layer 2 — Stand-Off Annotations (`schemas/annotations.schema.json`, `pipeline/bylaws/annotations.py`)

- Add `schemas/annotations.schema.json` (12th schema in `SCHEMA_NAMES`) validating `data/processed/<jurisdiction>/documents/<doc_id>.annotations.json`:
  - `schema_version: "1.3"`, `doc_id`, `jurisdiction`, `annotations[]`:
    - `annotation_id`: string
    - `target`: `{ eid, version_id, field ("heading" | "intro" | "content" | "wrap_up" | "cell"), cell_index?, span: [start, end], span_text }`
    - `kind`: `"cross_reference" | "defined_term_use" | "provision_type"`
    - `value`: target `eid` or `"unresolved:<raw_text>"` for `cross_reference`; definition `eid` for `defined_term_use`; one of `"definition" | "obligation" | "prohibition" | "permission" | "exception" | "procedure" | "fee" | "penalty" | "scope" | "commencement"` for `provision_type`
    - `method`: `"rule" | "model" | "person"`, optional `model_name`, `model_version`
    - `confidence`: number (`0.0` to `1.0`)
    - `verification`: `"unverified" | "machine_checked" | "human_verified"`
- Implement `pipeline/bylaws/annotations.py` to generate and validate stand-off annotations for every document tree, enforcing that `field_text[start:end] == span_text` and `0 <= start < end <= len(field_text)`.

### 3. Layer 3 — History, Effects & Derived Consolidated View (`schemas/amendments.schema.json`, `schemas/consolidated.schema.json`, `pipeline/bylaws/amendments.py`, `pipeline/bylaws/consolidate.py`)

- Update `schemas/amendments.schema.json` (`effects.json` / `amendments.json`) to store structured `effects[]`:
  - `effect_id`, `amending_doc`, `amending_eid`, `target_doc`, `target_eid`, `action` (`"substitute" | "insert_after" | "insert_before" | "omit" | "renumber" | "modify_text"`), `new_nodes` (structured nodes for substitutions and insertions), `valid_from`, `confidence` (`0.0` to `1.0`), `applied` (`boolean`), `unapplied_reason` (`string | null`), `verification`.
- Applying effects (`pipeline/bylaws/amendments.py`) creates new `versions` on target nodes in the target document tree (closing `valid_to` on the previous version and appending the new version with `valid_from`, `source_doc`, `source_eid`, `effect_id`, and inserting `new_nodes` into the tree for `insert_after`/`insert_before` with `valid_from` on version 1). Low-confidence effects (`confidence < 0.8`) are recorded with `applied: false` and not applied.
- Consolidated view (`pipeline/bylaws/consolidate.py` and `lib/data.ts`):
  - Computed from node `versions` for any `as_of_date` (`valid_from <= as_of_date` and (`valid_to is None` or `as_of_date < valid_to`)), marked `derived: true` with `applied_effects[]` (Rule R14).

### 4. Fixture, Overrides, Publish, Web Document Page & `docs/schema.md`

- Extend the synthetic test fixture (`pipeline/tests/fixtures/generate_fixtures.py` and `jurisdictions/xx-test-fixture.yaml`) with:
  - a clause with `intro` + child `item`s + `wrap_up` closing text;
  - repeated `(a)` sub-items under different parent clauses (`cl_1.1__item_a` and `cl_2.1__item_a`);
  - a `proviso` (`prov_1`);
  - an `explanation` (`expl_1`);
  - a `definitions` section with `definition` nodes (`defines`, `defines_normalised`);
  - a `table` with two-row hierarchical headers (`columns`) and a `footnote`;
  - an amending document (`fixture-amend-2024`) that **substitutes** one clause, **inserts** one clause (`insert_after`), and **omits** one clause (`omit`).
- Hand-write expected golden outputs in `pipeline/tests/golden/xx-test-fixture/` (Rule R11).
- Update `pipeline/bylaws/overrides.py` so overrides target nodes by `eid` (or `<doc_id>:<eid>`) and annotations by `annotation_id`, preserving idempotence and R12 record version separation.
- Update `pipeline/bylaws/publish.py`, `schemas/manifest.schema.json`, and `lib/data.ts` to publish and load `<doc_id>.annotations.json` and `effects.json` (`amendments.json`).
- Update Web Document & Clause components (`components/ClauseTree.tsx`, `components/ClausePanel.tsx`, `app/j/[id]/documents/[doc]/page.tsx`) to render the Layer 1 hierarchy (`intro`, `children`, `wrap_up`), hierarchical table headers and footnotes, definitions, provisos, and explanations visually distinct; render Layer 2 annotations as inline links (`cross_reference`, `defined_term_use`) and mono badges (`provision_type`); and compute the "Original / As amended (derived)" view from node `versions` (with date selection support).
- Rewrite `docs/schema.md` to explain all three layers in plain English with a worked example and an Akoma Ntoso element mapping table.

## Affected Memory

- `schemas/data-contracts`: (modify) Document Schema 1.3 three-layer architecture (Layer 1 faithful tree with Akoma Ntoso `eid`s and 22 node types, Layer 2 stand-off `annotations.schema.json`, Layer 3 `versions` and `effects`).
- `architecture/overview`: (modify) Document updated `structure`, `annotations`, `amendments`, `overrides`, and web Document tree/annotation/version rendering for Schema 1.3.

## Impact

- **Schemas & Codegen**: All `schemas/*.schema.json` bumped to `1.3` + new `schemas/annotations.schema.json`; regenerated `pipeline/bylaws/models/_generated.py` and `lib/types/generated.ts`.
- **Pipeline**: `pipeline/bylaws/structure.py`, `pipeline/bylaws/annotations.py` (new), `pipeline/bylaws/amendments.py`, `pipeline/bylaws/consolidate.py`, `pipeline/bylaws/overrides.py`, `pipeline/bylaws/validate.py`, `pipeline/bylaws/publish.py`, `pipeline/bylaws/schema_validator.py`.
- **Fixtures & Tests**: `pipeline/tests/fixtures/generate_fixtures.py`, `pipeline/tests/golden/xx-test-fixture/*`, `pipeline/tests/test_schema_1_3_three_layers.py` (new), `pipeline/tests/test_golden_fixture.py`, `pipeline/tests/test_structure.py`, `pipeline/tests/test_config_and_schemas.py`.
- **Web App**: `lib/data.ts`, `components/ClauseTree.tsx`, `components/ClausePanel.tsx`, `app/j/[id]/documents/[doc]/page.tsx`, `app/j/[id]/clauses/page.tsx`, `app/j/[id]/timeline/page.tsx`, `__tests__/clause-fallbacks.test.tsx`, `__tests__/routes-and-axe.test.tsx`.
- **Docs**: `docs/schema.md`, `docs/progress.md`.

## Open Questions

None — all requirements are specified in `docs/plans/pr-series/00-overview.md` and `docs/plans/pr-series/03-schema-three-layers.md`.

## Assumptions

| # | Grade | Decision | Rationale | Scores |
|---|-------|----------|-----------|--------|
| 1 | Certain | Bump `schema_version` to `"1.3"` across all JSON schemas and add `schemas/annotations.schema.json` for Layer 2 stand-off annotations | Explicitly specified in `03-schema-three-layers.md` | S:95 R:90 A:95 D:95 |
| 2 | Certain | Keep compatibility properties (`clause_id` = `<doc_id>:<eid>`, `number`, `title`, `text`) alongside `eid`, `native_number`, `heading`, `intro`, `content`, `wrap_up` on `ClauseNode` so map zone tags and existing loaders work seamlessly | Preserves clean interface compatibility across pipeline stages and UI components | S:90 R:95 A:95 D:90 |
| 3 | Certain | Compute consolidated views per date directly from each node's `versions` list (`valid_from <= date < valid_to`) | Explicitly specified in `03-schema-three-layers.md` Layer 3 | S:95 R:90 A:95 D:95 |
| 4 | Certain | Include Akoma Ntoso element mapping table and worked example in `docs/schema.md` | Explicitly specified in `03-schema-three-layers.md` Implementation | S:95 R:95 A:95 D:100 |

4 assumptions (4 certain, 0 confident, 0 tentative, 0 unresolved).
