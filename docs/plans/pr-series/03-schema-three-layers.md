# PR 03 — Schema 1.3: Three Layers

**Read first:** `00-overview.md` · **Depends on:** PR 02 · **Estimate:** 3–4 days · **Checkpoint:** owner reviews and merges

## Goal

Replace the flat clause list with a model that (1) mirrors each document's native structure faithfully, (2) carries meaning as annotations beside the text, and (3) records how each provision changed over time. Built and tested on the synthetic fixture only; real documents arrive in PR 05.

## Layer 1 — The faithful tree

### Nodes
Every node has:
- `eid`: address built from ancestors, following the Akoma Ntoso naming approach. Each segment is `<prefix>_<native token>`, joined with `__`. Example: `bl_6.0__cl_i__item_2`.
- `native_number`: exactly as printed (e.g. `6.0`, `(i)`, `(2)`, `2A`, `(aa)`).
- `type`: one of `preface`, `preamble`, `part`, `chapter`, `section`, `regulation`, `bye_law`, `clause`, `subclause`, `item`, `paragraph`, `proviso`, `explanation`, `note`, `definition`, `schedule`, `annexure`, `appendix`, `form`, `table`, `table_row`, `signature_block`.
- `heading` (if printed), and text fields: `intro` (lead-in before children), `content` (for nodes with no children), `wrap_up` (closing text after children). Text is verbatim; only whitespace normalised.
- `children`: ordered list of child `eid`s.
- `citation`: page(s) and bounding box(es) in the source; `bbox: null` when the parser cannot give positions (never invented).
- `language`: `en`.

### Prefixes (documented in `docs/schema.md`)
`part_`, `chp_`, `sec_`, `reg_`, `bl_`, `cl_`, `subcl_`, `item_`, `para_`, `prov_` (proviso, numbered in order within parent), `expl_`, `note_`, `def_`, `sch_`, `ann_`, `app_`, `form_`, `tbl_`, `row_`. Native tokens are sanitised (spaces removed, brackets dropped, case kept) and must be unique within the parent; collisions fail validation.

### Tables
- `columns`: header cells with hierarchy (multi-row headers become a tree), each with optional `unit`.
- `rows`: each row is a `table_row` node with its own `eid` (`tbl_2B__row_3`), cells as verbatim text.
- `footnotes`: nodes attached to the table, with markers linking to cells.
- A table that cannot be extracted reliably is a `table` node with `extraction: failed`, a page-image reference, and a declared gap.

### Definitions
- Each defined term is a `definition` node with `defines: "<term>"` exactly as printed, plus `defines_normalised` (lowercase, quotes removed).

## Layer 2 — Annotations (stand-off)

Stored separately from nodes (`annotations.json` per document). Each annotation:
- `target`: node `eid`, version id, field (`heading`, `intro`, `content`, `wrap_up`, or a table cell), character span `[start, end]`.
- `kind`: in this phase only `cross_reference`, `defined_term_use`, `provision_type`. (`zone_applicability` is added in PR 11; quantities and full applicability are next phase.)
- `value`: e.g. target `eid` for cross-references (or `unresolved` with the raw text), definition `eid` for term uses, one of `definition`, `obligation`, `prohibition`, `permission`, `exception`, `procedure`, `fee`, `penalty`, `scope`, `commencement` for provision types.
- `method`: `rule`, `model` (with model name and version), or `person`.
- `confidence` (0–1) and `verification`.
- Validation: spans must lie within the field's text; the span text is stored alongside for checking.

## Layer 3 — History

### Versions
Each node has `versions`: ordered list of `{version_id, valid_from, valid_to, text (intro/content/wrap_up/heading), source_doc, source_eid, effect_id, citation, legal_status}`. The original text is version 1, `valid_from` = the document's commencement date (from the document itself, R17).

### Effects
Amending instruments are structured as their own documents (Layer 1) **and** produce effects (`effects.json`):
- `effect_id`, `amending_eid` (the instruction in the amending document), `target_doc`, `target_eid`, `action` (`substitute`, `insert_after`, `insert_before`, `omit`, `renumber`, `modify_text`), `new_nodes` (for substitutions and insertions, the quoted text structured as nodes), `valid_from`, `confidence`, `verification`.
- Applying effects produces new versions on target nodes. Low-confidence effects are recorded but not applied; the site shows them beside the target.

### Consolidated view (R14)
Derived per document per date: the tree with each node's version valid on that date. Marked `derived: true` with the list of applied effects. Not stored as separate text; computed from versions.

### Record versions stay separate (R12)
Data corrections still use `record_version` and its fields; these are unrelated to legal versions.

## Implementation

- JSON Schemas updated; Pydantic and TypeScript types regenerated; drift check in CI.
- Migration: the structure stage, overrides, publish and web loaders updated to the new model. Old 1.2 files need not be migrated (no real data exists yet).
- Overrides can target nodes by `eid` and annotations by id; still idempotent.
- Web: Document page renders the tree with intro/children/wrap-up, tables with header hierarchy, definitions, provisos and explanations visually distinct; "Original / As amended (derived)" toggle uses versions; annotations shown as links (cross-references, defined terms) and small mono labels (provision type).
- `docs/schema.md`: explains all three layers in plain English with one worked example, and a mapping table to Akoma Ntoso element names for future XML export.

## Fixture

Extend the synthetic fixture (test only) with: a lead-in + list + closing clause; repeated `(a)` under different parents; a proviso; an explanation; a definitions section; a table with two-row headers and a footnote; an amending document that substitutes one clause, inserts one, omits one. Hand-write expected outputs (R11).

## Acceptance

- [ ] Fixture produces the hand-written expected tree, annotations, effects and versions.
- [ ] Repeated sub-items never collide; intro and wrap-up land on the parent.
- [ ] Consolidated view on a date after the fixture amendment shows substituted, inserted and omitted text correctly; before it, the original.
- [ ] Every annotation span validates against its text.
- [ ] Document page renders all node types; toggle works; axe passes.
- [ ] `docs/schema.md` written.
- [ ] CI green.
