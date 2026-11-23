# Data Model & JSON Schemas (`schemas/` — Schema v1.1)

All structured outputs in `bylaws-india` are validated against versioned **JSON Schema Draft 2020-12** (`https://json-schema.org/draft/2020-12/schema`) files located in `schemas/`. These 8 schema files are the single source of truth from which both Python Pydantic v2 models (`pipeline/bylaws/models/_generated.py`) and TypeScript types (`lib/types/generated.ts`) are generated via `make generate`.

## Core Invariants Enforced by Schema v1.1

1. **R1 — Jurisdiction Isolation**: No schema hard-codes city names, planning district numbers, or authority-specific zone codes. All jurisdiction IDs follow the standard lowercase hyphenated pattern `^[a-z0-9]+(-[a-z0-9]+)*$` (synthetic fixtures use country code `XX`, e.g. `xx-test-fixture`).
2. **R2 & D5 — Mandatory Provenance with Page Bounding Boxes**: Every clause requires a non-empty `citations` array (`{ doc_id, page, bbox: [x0, y0, x1, y1] | null, text_excerpt }`) and `verification` (`unverified | machine_checked | human_verified`). Every zone feature requires `source_map`, `georef_run`, `extraction_method`, `source_attribution`, and `verification`.
3. **R3 — Explicit Legal Status**: Every document, clause tree, and individual clause carries `legal_status` (`in_force | draft | superseded | withdrawn`). In `manifest.schema.json`, draft clause trees are isolated under `drafts.clauses` and never mixed into `files.clauses`.
4. **R5 — Immutable Raw Metadata**: `document.schema.json` enforces `sha256` (64-character lowercase hex), `bytes`, `retrieved_at` (ISO 8601), `source_url`, `status_evidence`, and `licence_or_terms`.
5. **R6 & R9 — Deterministic Overrides & Immutable Verified Records**: `overrides.schema.json` captures `clause_fixes`, `zone_tags`, `zone_fixes`, and `map_curations` as committed YAML files. Every clause and zone carries `record_id` (`<id>@v<N>`), `supersedes`, and `superseded_by` so `human_verified` records are never mutated in place.
6. **D7 — Self-Declared Coverage Gaps**: `declarations.schema.json` records `not_modelled`, `known_gaps`, and `unread_documents` for each jurisdiction release.

---

## 1. `schemas/jurisdiction.schema.json`

Validates `jurisdictions/<id>.yaml`.

- **Top-level fields** (`additionalProperties: false`):
  - `id` (`string`, pattern `^[a-z0-9]+(-[a-z0-9]+)*$`).
  - `name` (`string`, non-empty): Human-readable display name.
  - `aliases` (`string[]`, optional): Alternative search names for the home page type-ahead.
  - `country` (`string`, pattern `^[A-Z]{2}$`): 2-letter uppercase country code (`XX` for synthetic fixtures).
  - `state` (`string`, pattern `^[A-Z0-9]{2,4}$`): State/territory code.
  - `building_types` (`string[]`, `minItems: 1`).
  - `parents` (`string[]`).
  - `not_modelled` (`string[]`, optional): Regulatory topics intentionally not covered.
  - `unread_documents` (`object[]`, optional): `{ title, source_url, reason }`.
  - `documents` (`object[]`, `minItems: 1`):
    - Required: `id`, `title`, `issuing_authority`, `layer` (`national | state | planning | municipal`), `legal_status` (`in_force | draft | superseded | withdrawn`), `status_evidence` (`{ url: string | null, description: string }`), `licence_or_terms` (`string`), `role` (`base | amendment | regulation | boundary | reference`), `source_url`.
    - Optional: `amends` (`string[]`), `supersedes` (`string[]`), `notified_date` (`string | null`), `effective_from` (`string | null`).
  - `maps` (`object`):
    - `boundaries` (`object[]`): `{ id, source_url, select: { property, equals } }`.
    - `zoning` (`object[]`): Discriminated by `kind`:
      - `kind: "traced"`: `{ id, kind: "traced", document, page, planning_district, legend_page }`.
      - `kind: "imported"`: `{ id, kind: "imported", source_url, zone_code_field, zone_label_field, source_attribution }`.

---

## 2. `schemas/document.schema.json`

Validates `data/raw/<jurisdiction>/<doc_id>.meta.json` (and entries in `documents.json`).

- **Required fields** (`additionalProperties: false`):
  - `schema_version`: Const `"1.1"`.
  - `doc_id`, `title`, `issuing_authority`, `layer`, `role`, `legal_status`.
  - `status_evidence`: `{ url: string | null, description: string }`.
  - `licence_or_terms` (`string`, non-empty).
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
  - `schema_version`: Const `"1.1"`.
  - `doc_id`, `jurisdiction`, `legal_status`.
  - `generated`: `{ parser, parser_version, pipeline_version, generated_at }`.
  - `clauses`: Array of `ClauseNode` objects:
    - `clause_id` (`string`, `<doc_id>:<number>`).
    - `record_id` (`string`, `<doc_id>:<number>@v<N>`).
    - `supersedes` (`string | null`), `superseded_by` (`string | null`).
    - `legal_status` (`in_force | draft | superseded | withdrawn`).
    - `number` (`string`), `title` (`string | null`), `level` (`integer >= 1`), `parent_id` (`string | null`), `order` (`integer >= 0`).
    - `text` (`string`, non-empty verbatim clause text).
    - `tables` (`object[]`): `{ table_id, caption, headers: string[], rows: string[][], page: integer >= 1 }`.
    - `citations` (`object[]`, `minItems: 1`): `{ doc_id, page: integer >= 1, bbox: [x0, y0, x1, y1] | null, text_excerpt: string }`.
    - `cross_references` (`string[]`), `amended_by` (`string[]`), `applies_to_zones` (`string[]`).
    - `verification`: `unverified | machine_checked | human_verified`.

---

## 4. `schemas/zones.schema.json`

Validates `data/processed/<jurisdiction>/zones.geojson`.

- GeoJSON `FeatureCollection` requiring `type: "FeatureCollection"`, `schema_version: "1.1"`, and `features`:
  - `type`: `"Feature"`.
  - `geometry`: GeoJSON `Polygon` or `MultiPolygon` with WGS84 coordinates.
  - `properties` (`additionalProperties: false`):
    - `zone_id` (`string`, e.g. `<map_id>:z0001`).
    - `record_id` (`string`, e.g. `<map_id>:z0001@v1`).
    - `supersedes` (`string | null`), `superseded_by` (`string | null`).
    - `zone_code` (`string`), `zone_label` (`string`).
    - `source_map` (`string`), `georef_run` (`string`).
    - `extraction_method`: `colour_segmentation | road_outline_fallback | manual | imported`.
    - `source_attribution` (`string | null`; required non-empty string when `extraction_method == "imported"`).
    - `area_sq_m` (`number >= 0`).
    - `verification`: `unverified | machine_checked | human_verified | rejected`.
    - `notes` (`string | null`).

---

## 5. `schemas/overrides.schema.json`

Validates `data/overrides/<jurisdiction>/*.yaml`.

- **Required**: `schema_version` (`"1.1"`).
- **Optional sections**:
  - `clause_fixes`: Array of `{ clause_id, field, value, reason }`.
  - `zone_tags`: Array of `{ clause_id, zones: string[], reason }`.
  - `zone_fixes`: Array of `{ zone_id, set: { zone_code?, zone_label?, verification?, notes? }, reason? }`.
  - `map_curations`: Array of `{ map_id, legend_entries?: [{ zone_code, zone_label, rgb: [int, int, int] }], gcps?: [{ id, label, pixel_x, pixel_y, lon?, lat?, osm_query? }] }`.

---

## 6. `schemas/declarations.schema.json`

Validates `data/processed/<jurisdiction>/declarations.json`.

- **Required** (`additionalProperties: false`):
  - `schema_version`: Const `"1.1"`.
  - `jurisdiction`: Jurisdiction ID.
  - `not_modelled`: `string[]`.
  - `known_gaps`: Array of `{ doc_id, description }`.
  - `unread_documents`: Array of `{ title, source_url, reason }`.

---

## 7. `schemas/amendments.schema.json`

Validates `data/processed/<jurisdiction>/amendments.json`.

- **Required** (`additionalProperties: false`):
  - `schema_version`: Const `"1.1"`.
  - `jurisdiction`: Jurisdiction ID.
  - `links`: Array of `{ amending_clause, target_clause, action: "substitute" | "insert_after" | "insert_before" | "omit" | "modify", confidence: "high" | "medium" | "low", verification: "unverified" | "machine_checked" | "human_verified", note?: string | null }`.

---

## 8. `schemas/manifest.schema.json`

Validates `public/data/manifest.json`.

- **Required** (`additionalProperties: false`):
  - `schema_version`: Const `"1.1"`.
  - `jurisdictions`: Array of `{ id, name, aliases?, latest_release, releases }`.
  - Each `releaseEntry` requires:
    - `version`, `released_at`, `licence`, `download_zip`, `sha256sums`, `declarations`, `changelog`.
    - `files`: `{ documents, clauses, amendments, zones, boundary, review_images }`.
    - `drafts`: `{ clauses }`.
