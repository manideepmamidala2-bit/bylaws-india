# Data Model & JSON Schemas (`schemas/` — Schema v1.3: Three Layers)

All structured outputs in `bylaws-india` are validated against twelve **JSON Schema Draft 2020-12** (`https://json-schema.org/draft/2020-12/schema`) files at `schema_version: "1.3"` in `schemas/`. These schemas are the single source of truth from which both Python Pydantic v2 models (`pipeline/bylaws/models/_generated.py`) and TypeScript types (`lib/types/generated.ts`) are generated via `make generate`.

Schema 1.3 models every regulatory document across **three distinct layers**:

1. **Layer 1 — The Faithful Tree (`clause-tree.schema.json`)**: Mirrors each document's native hierarchy down to the smallest citable unit using Akoma Ntoso hierarchical addresses (`eid`).
2. **Layer 2 — Stand-Off Annotations (`annotations.schema.json`)**: Stores meaning (`cross_reference`, `defined_term_use`, `provision_type`) in `<doc_id>.annotations.json` pointing at exact character spans `[start, end]`, never mutating the verbatim text.
3. **Layer 3 — History, Versions & Effects (`amendments.schema.json`, `consolidated.schema.json`)**: Records dated `versions` on each node and amending instructions as structured `effects`, computing derived consolidated views for any date (`Rule R14`) while keeping data-correction `record_version` chains separate (`Rule R12`).

---

## 1. Layer 1 — The Faithful Tree (`schemas/clause-tree.schema.json`)

### Node Fields (`ClauseNode`)

Every node in a structured document tree carries:

- `eid`: Hierarchical address built from ancestors following the Akoma Ntoso naming approach. Each segment is `<prefix>_<sanitised_native_token>`, joined with `__` (e.g., `chp_II__cl_2.1__item_a`, `bl_6.0__cl_i__item_2`).
- `native_number`: Exactly as printed in the source (e.g., `"6.0"`, `"(i)"`, `"(2)"`, `"2A"`, `"(aa)"`), or `null` for unnumbered provisos/tables/rows.
- `type`: One of 22 structural node types:
  `preface`, `preamble`, `part`, `chapter`, `section`, `regulation`, `bye_law`, `clause`, `subclause`, `item`, `paragraph`, `proviso`, `explanation`, `note`, `definition`, `schedule`, `annexure`, `appendix`, `form`, `table`, `table_row`, `signature_block`.
- `heading`: Printed heading (`string | null`).
- `intro`: Lead-in text before child nodes (`string | null`).
- `content`: Body text for leaf nodes (`string | null`).
- `wrap_up`: Closing text after child nodes (`string | null`).
- `children`: Ordered list of child `eid`s (`string[]`), paired with `parent_eid` (`string | null`).
- `defines` & `defines_normalised`: On `definition` nodes, the defined term exactly as printed (`'"Floor Area Ratio"'`) and normalized (`"floor area ratio"`).
- `table_meta`: On `table` nodes:
  - `columns`: Hierarchical header tree (`{ label, unit?, children? }[]`) supporting multi-row headers.
  - `rows`: Ordered list of `table_row` child `eid`s (`tbl_2.1__row_1`, etc.).
  - `footnotes`: Attached footnote definitions (`{ marker, text, cell_refs[] }[]`).
  - `extraction`: `"complete"` or `"failed"` (with `page_image` and `gap_reason` when extraction fails).
- `cells`: On `table_row` nodes, verbatim cell strings (`string[]`).
- `citations`: Non-empty array of `{ doc_id, page, bbox, text_excerpt }` (`bbox: null` when word coordinates are unavailable; never invented, `Rule R8`).
- `language`: `"en"` (or `"kn"`).

### Prefix & Akoma Ntoso Mapping Table

Native tokens are sanitised (spaces removed, brackets dropped, case preserved) and must be unique within their parent; sibling `eid` collisions fail validation.

| Schema 1.3 `type` | `eid` Prefix | Example Segment | Akoma Ntoso XML Element |
|-------------------|--------------|-----------------|-------------------------|
| `preface` | `pref_` | `pref_1` | `<preface>` |
| `preamble` | `prea_` | `prea_1` | `<preamble>` |
| `part` | `part_` | `part_I` | `<part>` |
| `chapter` | `chp_` | `chp_II` | `<chapter>` |
| `section` | `sec_` | `sec_13` | `<section>` |
| `regulation` | `reg_` | `reg_3.1` | `<article>` / `<section>` |
| `bye_law` | `bl_` | `bl_6.0` | `<article>` / `<clause>` |
| `clause` | `cl_` | `cl_2.1` | `<clause>` |
| `subclause` | `subcl_` | `subcl_1` | `<subclause>` |
| `item` | `item_` | `item_a` | `<item>` / `<point>` |
| `paragraph` | `para_` | `para_1` | `<paragraph>` |
| `proviso` | `prov_` | `prov_1` | `<proviso>` / `<mod>` |
| `explanation` | `expl_` | `expl_1` | `<authorialNote>` / `<block name="explanation">` |
| `note` | `note_` | `note_1` | `<note>` |
| `definition` | `def_` | `def_1.2` | `<def>` |
| `schedule` | `sch_` | `sch_I` | `<attachment>` / `<doc name="schedule">` |
| `annexure` | `ann_` | `ann_A` | `<attachment>` / `<doc name="annexure">` |
| `appendix` | `app_` | `app_I` | `<attachment>` / `<doc name="appendix">` |
| `form` | `form_` | `form_1` | `<attachment>` / `<doc name="form">` |
| `table` | `tbl_` | `tbl_2.1` | `<table>` |
| `table_row` | `row_` | `row_1` | `<tr>` |
| `signature_block` | `sig_` | `sig_1` | `<conclusions>` / `<signature>` |

---

## 2. Layer 2 — Stand-Off Annotations (`schemas/annotations.schema.json`)

Stored separately from nodes in `<doc_id>.annotations.json`. Each `AnnotationEntry` contains:

- `annotation_id`: Unique ID (`<doc_id>:ann_<N>`).
- `target`: `{ eid, version_id, field ("heading" | "intro" | "content" | "wrap_up" | "cell"), cell_index?, span: [start, end], span_text }`.
- `kind`:
  - `cross_reference` (`value` = target `eid` or `"unresolved:<raw_text>"`)
  - `defined_term_use` (`value` = target `definition` node `eid`)
  - `provision_type` (`value` = one of `definition`, `obligation`, `prohibition`, `permission`, `exception`, `procedure`, `fee`, `penalty`, `scope`, `commencement`)
- `method`: `"rule"`, `"model"` (with `model_name` and `model_version`), or `"person"`.
- `confidence`: `0.0`–`1.0`.
- `verification`: `"unverified"`, `"machine_checked"`, or `"human_verified"`.

**Span Validation**: Every annotation span `[start, end]` must lie within the target field's text and satisfy `field_text[start:end] == span_text`.

---

## 3. Layer 3 — History, Versions & Effects (`schemas/amendments.schema.json`, `schemas/consolidated.schema.json`)

### Node Versions (`versions[]`)

Every node carries an ordered `versions` list (`NodeVersion`):
- `version_id` (`"v1"`, `"v2"`, ...), `valid_from` (commencement date from the instrument itself, `Rule R17`), `valid_to` (`null` while active, or closed when superseded by a later amendment), `heading`, `intro`, `content`, `wrap_up`, `cells`, `source_doc`, `source_eid`, `effect_id`, `citations`, `legal_status`, and `omitted`.

### Amending Effects (`effects[]`)

Amending instruments are structured as their own Layer 1 documents AND produce `AmendmentEffect` entries:
- `effect_id`, `amending_doc`, `amending_eid`, `target_doc`, `target_eid`, `action` (`"substitute" | "insert_after" | "insert_before" | "omit" | "renumber" | "modify_text"`), `new_nodes` (structured nodes from the quoted replacement/inserted text), `valid_from`, `confidence` (`0.0`–`1.0`), `applied`, `unapplied_reason`, `verification`.
- Applying high-confidence effects (`confidence >= 0.8`) appends new versions on target nodes (or inserts `new_nodes` into the tree for `insert_after`/`insert_before`). Low-confidence effects are recorded with `applied: false` and displayed beside the target without mutating versions.

### Consolidated View (`Rule R14`) & Record Versions (`Rule R12`)

- **Consolidated View (`compute_consolidated_view_as_of`)**: Derived per document per date (`as_of_date`) by selecting each node's version where `valid_from <= as_of_date < valid_to`. Marked `derived: true` with `applied_effects[]`.
- **Record Versions (`Rule R12`)**: Data corrections applied via `data/overrides/<jurisdiction>/` increment `record_version` (`@v1` -> `@v2`) and never conflate data-correction history with legal amendment `versions`.

---

## 4. Worked Example (All Three Layers)

### Layer 1 Node (`fixture-base-2020.clauses.json`)

```json
{
  "eid": "chp_II__cl_2.1",
  "native_number": "2.1",
  "type": "clause",
  "heading": "Residential Setback Norms",
  "intro": "Every residential building in zone Z1 or Z2 shall provide minimum setbacks as per clause 1.1 and Table 2.1 below:",
  "content": null,
  "wrap_up": "Corner plots shall provide the front setback on both abutting streets.",
  "children": [
    "chp_II__cl_2.1__item_a",
    "chp_II__cl_2.1__item_b",
    "chp_II__cl_2.1__prov_1",
    "chp_II__cl_2.1__expl_1",
    "chp_II__cl_2.1__tbl_2.1"
  ],
  "parent_eid": "chp_II",
  "versions": [
    {
      "version_id": "v1",
      "valid_from": "2020-02-01",
      "valid_to": null,
      "heading": "Residential Setback Norms",
      "intro": "Every residential building in zone Z1 or Z2 shall provide minimum setbacks as per clause 1.1 and Table 2.1 below:",
      "content": null,
      "wrap_up": "Corner plots shall provide the front setback on both abutting streets.",
      "source_doc": "fixture-base-2020",
      "source_eid": "chp_II__cl_2.1",
      "effect_id": null,
      "legal_status": "in_force",
      "omitted": false
    }
  ]
}
```

### Layer 2 Stand-Off Annotation (`fixture-base-2020.annotations.json`)

```json
{
  "annotation_id": "fixture-base-2020:ann_10",
  "target": {
    "eid": "chp_II__cl_2.1",
    "version_id": "v1",
    "field": "intro",
    "span": [82, 92],
    "span_text": "clause 1.1"
  },
  "kind": "cross_reference",
  "value": "chp_I__cl_1.1",
  "method": "rule",
  "confidence": 0.95,
  "verification": "machine_checked"
}
```

### Layer 3 Amending Effect (`amendments.json`)

```json
{
  "effect_id": "fixture-amend-2024:eff_1",
  "amending_doc": "fixture-amend-2024",
  "amending_eid": "cl_2",
  "target_doc": "fixture-base-2020",
  "target_eid": "chp_II__cl_2.2",
  "action": "substitute",
  "new_nodes": [
    {
      "eid": "chp_II__cl_2.2",
      "native_number": "2.2",
      "type": "clause",
      "heading": "Maximum Building Height",
      "content": "No residential building in zone Z1 shall exceed 15.0 metres in height, subject to road width norms under clause 2.1.",
      "parent_eid": "chp_II"
    }
  ],
  "valid_from": "2024-06-15",
  "confidence": 0.95,
  "applied": true,
  "verification": "machine_checked"
}
```
