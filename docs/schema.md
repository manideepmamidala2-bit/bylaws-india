# Data Model & JSON Schemas (`schemas/`)

All structured outputs in `bylaws-india` are validated against versioned **JSON Schema Draft 2020-12** (`https://json-schema.org/draft/2020-12/schema`) files located in `schemas/`. Breaking changes require a `schema_version` bump and an explicit migration.

## Core Invariants Enforced by the Schemas

1. **R1 — Jurisdiction Isolation**: No schema hard-codes city names, planning district numbers, or authority-specific zone codes. Zone codes, document IDs, and jurisdiction IDs are validated structurally (e.g., kebab-case `^[a-z0-9]+(-[a-z0-9]+)*$` or `_fixture-test` for synthetic tests).
2. **R2 — Mandatory Provenance**: Every clause requires `doc_id`, `pages` (non-empty array of 1-based page numbers), and `verification` (`unverified | machine_checked | human_verified`). Every zone feature requires `source_map`, `georef_run`, `extraction_method`, and `verification`.
3. **R3 — Explicit Legal Status**: Every document and clause tree carries `legal_status` (`in_force | draft | superseded | withdrawn`). In `manifest.schema.json`, draft clause trees are isolated under `drafts.clauses` and never mixed into `files.clauses`.
4. **R5 — Immutable Raw Metadata**: `document.schema.json` enforces `sha256` (64-character lowercase hex), `bytes`, `retrieved_at` (ISO 8601), and `source_url`.
5. **R6 — Deterministic Overrides**: `overrides.schema.json` captures `clause_fixes`, `zone_tags`, `zone_fixes`, and `map_curations` (legend swatches and pixel Ground Control Points) as committed YAML files.

---

## 1. `schemas/jurisdiction.schema.json`

Validates `jurisdictions/<id>.yaml`.

- **Top-level fields** (`additionalProperties: false`):
  - `id` (`string`): Lowercase hyphenated identifier (`^(_fixture-test|[a-z0-9]+(-[a-z0-9]+)*)$`).
  - `name` (`string`, non-empty): Human-readable display name.
  - `country` (`string`, pattern `^[A-Z]{2}$`): 2-letter uppercase country code.
  - `state` (`string`, pattern `^[A-Z0-9]{2,4}$`): State/province code.
  - `building_types` (`string[]`, `minItems: 1`): Covered building types (e.g. `["residential"]`).
  - `parents` (`string[]`): Parent jurisdiction IDs (`[]` in Phase 1).
  - `documents` (`object[]`, `minItems: 1`):
    - Required: `id`, `title`, `issuing_authority`, `layer` (`national | state | planning | municipal`), `legal_status` (`in_force | draft | superseded | withdrawn`), `role` (`base | amendment | regulation | boundary | reference`), `source_url`.
    - Optional: `amends` (`string[]`), `supersedes` (`string[]`), `notified_date` (`string | null`), `effective_from` (`string | null`).
  - `maps` (`object`):
    - `boundaries` (`object[]`): Each item requires `id`, `source_url`, and `select` (`{ property: string, equals: string }`).
    - `zoning` (`object[]`): Each item requires `id`, `document`, `page` (`integer >= 1`), `planning_district` (`integer | string`), and `legend_page` (`integer >= 1 | null`).

---

## 2. `schemas/document.schema.json`

Validates `data/raw/<jurisdiction>/<doc_id>.meta.json`.

- **Required fields** (`additionalProperties: false`):
  - `schema_version`: Const `"1.0"`.
  - `doc_id`, `title`, `issuing_authority`, `layer`, `role`, `legal_status`.
  - `notified_date`, `effective_from` (`string | null`).
  - `amends`, `supersedes` (`string[]`).
  - `source_url` (`string`), `retrieved_at` (`string`, ISO 8601 date-time).
  - `sha256` (`string`, pattern `^[a-f0-9]{64}$`).
  - `bytes` (`integer >= 0`).
  - `page_count` (`integer >= 1 | null`).
  - `is_scanned` (`boolean`).

---

## 3. `schemas/clause-tree.schema.json`

Validates `data/processed/<jurisdiction>/documents/<doc_id>.clauses.json`.

- **Top-level fields**:
  - `schema_version`: Const `"1.0"`.
  - `doc_id`, `jurisdiction`, `legal_status`.
  - `generated`: `{ parser, parser_version, pipeline_version, generated_at }`.
  - `clauses`: Array of clause objects:
    - `clause_id` (`string`, `<doc_id>:<number>`).
    - `number` (`string`), `title` (`string | null`), `level` (`integer >= 1`), `parent_id` (`string | null`), `order` (`integer >= 0`).
    - `text` (`string`, non-empty verbatim clause text).
    - `tables` (`object[]`): `{ table_id, caption, headers: string[], rows: string[][], page: integer >= 1 }`.
    - `pages` (`integer[]`, `minItems: 1`, each `>= 1`).
    - `cross_references` (`string[]`), `amended_by` (`string[]`), `applies_to_zones` (`string[]`).
    - `verification`: `unverified | machine_checked | human_verified`.

---

## 4. `schemas/zones.schema.json`

Validates `data/processed/<jurisdiction>/zones.geojson`.

- GeoJSON `FeatureCollection` where each feature has:
  - `type`: `"Feature"`.
  - `geometry`: GeoJSON `Polygon` or `MultiPolygon` with WGS84 coordinates.
  - `properties` (`additionalProperties: false`):
    - `zone_id` (`string`, e.g. `<map_id>:z0001`).
    - `zone_code` (`string`), `zone_label` (`string`).
    - `source_map` (`string`), `georef_run` (`string`).
    - `extraction_method`: `colour_segmentation | road_outline_fallback | manual`.
    - `area_sq_m` (`number >= 0`).
    - `verification`: `unverified | machine_checked | human_verified | rejected`.
    - `notes` (`string | null`).

---

## 5. `schemas/overrides.schema.json`

Validates `data/overrides/<jurisdiction>/*.yaml`.

- **Required**: `schema_version` (`"1.0"`).
- **Optional sections**:
  - `clause_fixes`: Array of `{ clause_id, field, value, reason }`.
  - `zone_tags`: Array of `{ clause_id, zones: string[], reason }`.
  - `zone_fixes`: Array of `{ zone_id, set: { zone_code?, zone_label?, verification?, notes? }, reason? }`.
  - `map_curations`: Array of `{ map_id, legend_entries?: [{ zone_code, zone_label, rgb: [int, int, int] }], gcps?: [{ id, label, pixel_x, pixel_y, lon?, lat?, osm_query? }] }`.

---

## 6. `schemas/manifest.schema.json`

Validates `manifest.json` at the published data root.

- **Required**:
  - `schema_version`: Const `"1.0"`.
  - `jurisdictions`: Array of jurisdiction manifest entries:
    - `id`, `name`, `latest_release`.
    - `releases`: Array of `{ version, released_at, files: { documents, clauses, amendments, zones, boundary, review_images }, drafts: { clauses }, changelog }`.
