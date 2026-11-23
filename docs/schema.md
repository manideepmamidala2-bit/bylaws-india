# Data Model & JSON Schemas (`schemas/` — Schema v1.2)

All structured outputs in `bylaws-india` are validated against versioned **JSON Schema Draft 2020-12** (`https://json-schema.org/draft/2020-12/schema`) files located in `schemas/`. These 11 schema files are the single source of truth from which both Python Pydantic v2 models (`pipeline/bylaws/models/_generated.py`) and TypeScript types (`lib/types/generated.ts`) are generated via `make generate`.

## Core Invariants Enforced by Schema v1.2

1. **R1 — Jurisdiction Isolation**: No schema hard-codes city names, planning district numbers, or authority-specific zone codes. All jurisdiction IDs follow the standard lowercase hyphenated pattern `^[a-z0-9]+(-[a-z0-9]+)*$`.
2. **R2 — Mandatory Provenance with Page Bounding Boxes**: Every clause requires a non-empty `citations` array (`{ doc_id, page, bbox: [x0, y0, x1, y1] | null, text_excerpt }`), `effective_from`, `language` (`en | kn`), and `verification` (`unverified | machine_checked | human_verified`). Every zone feature requires `source_map`, `georef_run`, `extraction_method`, `source_attribution`, and `verification`.
3. **R3 — Explicit Legal Status**: Every document, clause tree, and individual clause carries `legal_status` (`in_force | draft | superseded | withdrawn | status_unknown`). In `manifest.schema.json`, draft clause trees are isolated under `drafts.clauses` and never mixed into `files.clauses`.
4. **R5 — Immutable Raw Metadata**: `document.schema.json` enforces `sha256` (64-character lowercase hex for `full_text` documents), `bytes`, `retrieved_at` (ISO 8601), `source_url`, `status_evidence`, `copies[]`, and `licence_or_terms`.
5. **R6, R9 & R12 — Deterministic Overrides & Record Version Separation**: `overrides.schema.json` captures `clause_fixes`, `zone_tags`, `zone_fixes`, `map_curations`, and `amendment_links` as committed YAML files. Every clause and zone carries `record_version` (`integer >= 1`), `record_id` (`<id>@v<N>`), `record_supersedes`, `record_superseded_by`, and `record_change_reason` (separate from `legal_status`, Rule R12).
6. **R13 — Explicit Text Rights**: Every document specifies `text_rights` (`{ mode: "full_text" | "reference_only", reason }`). Standards with `mode: "reference_only"` (`nbc-2016`, `aai-cczm`) carry `cited_provisions[]` without full text.
7. **R14 — Derived Work Provenance**: `consolidated.schema.json` and `geo-layers.schema.json` tag project-derived outputs with `derived: true` and `method`.

---

## 1. `schemas/jurisdiction.schema.json` (`JurisdictionConfig`)

Validates `jurisdictions/<id>.yaml`.

- `schema_version` (`"1.2"`), `id`, `name`, `aliases?`, `visibility` (`"public" | "test"`), `licence` (`string`), `country`, `state`, `building_types[]`, `parents[]`.
- Declarations: `not_modelled?`, `unread_documents?`, `unobtainable_documents?`, `contested_status?`, `building_relevant_sections?`.
- `documents[]`: `id`, `title`, `issuing_authority`, `doc_type` (`act | rules | regulations | bye_laws | amendment | notification | government_order | circular | map | standard_reference`), `layer` (`statute | state_rules | planning | municipal | orders | overlay | national_reference | boundary`), `legal_status` (`in_force | draft | superseded | withdrawn | status_unknown`), `status_evidence` (`{ url, quoted_line?, description? }`), `notification_number?`, `gazette_reference?`, `superseded_by_document?`, `licence_or_terms`, `text_rights?` (`{ mode, reason }`), `languages?` (`("en" | "kn")[]`), `role?`, `official_url?`, `mirror_urls?`, `source_url`, `notified_date?`, `effective_from?`, `amends?`, `supersedes?`, `cited_provisions?`.
- `maps`: `boundaries[]`, `planning_districts?`, `zoning[]` (`traced | vector_pdf | grid_georeferenced_raster | osm_gcp_raster | imported`), `overlays?`.

## 2. `schemas/document.schema.json` (`DocumentMetadata`)

Validates `data/raw/<jurisdiction>/<doc_id>.meta.json` and entries in `documents.json`.

- `schema_version`: Const `"1.2"`.
- `doc_id`, `title`, `issuing_authority`, `doc_type?`, `layer`, `role`, `legal_status`, `status_evidence`, `notification_number?`, `gazette_reference?`, `superseded_by_document?`, `licence_or_terms`, `text_rights?`, `languages?`, `official_url?`, `mirror_urls?`, `copies?`, `cited_provisions?`, `notified_date`, `effective_from`, `amends`, `supersedes`, `source_url`, `retrieved_at`, `sha256`, `bytes`, `page_count`, `is_scanned`.

## 3. `schemas/clause-tree.schema.json` (`ClauseTree`)

Validates `data/processed/<jurisdiction>/documents/<doc_id>.clauses.json`.

- `schema_version`: Const `"1.2"`, `doc_id`, `jurisdiction`, `legal_status`, `generated`, `clauses[]`.
- Each `ClauseNode` includes `clause_id`, `record_version`, `record_id`, `record_supersedes`, `record_superseded_by`, `record_change_reason`, `supersedes`, `superseded_by`, `legal_status`, `effective_from`, `number`, `title`, `level`, `parent_id`, `order`, `text`, `language` (`en | kn`), `tables[]`, `citations[]`, `cross_references[]`, `amended_by[]`, `applies_to_zones[]`, `verification`, `verified_by`.

## 4. `schemas/zones.schema.json` (`ZonesFeatureCollection`)

Validates `data/processed/<jurisdiction>/zones.geojson`.

- GeoJSON `FeatureCollection` with `schema_version: "1.2"` and `features[]` carrying `zone_id`, `record_version`, `record_id`, `record_supersedes`, `record_superseded_by`, `record_change_reason`, `supersedes`, `superseded_by`, `zone_code`, `zone_label`, `planning_district`, `sheet`, `source_map`, `georef_run`, `extraction_method` (`vector_pdf | grid_georeferenced_raster | osm_gcp_raster | imported | colour_segmentation | road_outline_fallback | manual`), `source_attribution`, `area_sq_m`, `verification`, `verified_by`, `notes`.

## 5. `schemas/overrides.schema.json` (`JurisdictionOverrides`)

Validates `data/overrides/<jurisdiction>/*.yaml` (`schema_version: "1.2"`, `clause_fixes`, `zone_tags`, `zone_fixes`, `map_curations`, `amendment_links`).

## 6. `schemas/declarations.schema.json` (`JurisdictionDeclarations`)

Validates `data/processed/<jurisdiction>/declarations.json` (`schema_version: "1.2"`, `jurisdiction`, `not_modelled[]`, `known_gaps[]`, `unread_documents[]`, `unobtainable_documents[]`, `contested_status[]`, `building_relevant_sections?`).

## 7. `schemas/amendments.schema.json` (`JurisdictionAmendments`)

Validates `data/processed/<jurisdiction>/amendments.json` (`schema_version: "1.2"`, `jurisdiction`, `links[]` with `action: substitute | insert_after | insert_before | omit | modify | renumber`, `effective_date`, `confidence`, `verification`).

## 8. `schemas/manifest.schema.json` (`ReleaseManifest`)

Validates `public/data/manifest.json` (`schema_version: "1.2"`, `jurisdictions[]` with `visibility`, `latest_release`, and `releases[]` referencing `documents`, `clauses`, `amendments`, `consolidated?`, `zones`, `boundary`, `gba_zones?`, `wards?`, `planning_districts?`, `overlays?`, `geo_layers?`, `clause_zone_tags?`, `sources_json?`, `sources_csv?`, `review_images`).

## 9. `schemas/consolidated.schema.json` (`JurisdictionConsolidated`)

Validates `data/processed/<jurisdiction>/consolidated.json` (`schema_version: "1.2"`, `jurisdiction`, `generated`, `records[]` with `derived: true`, `method`, `confidence: "high"`, `as_of_date`, `amendments_applied[]`, and `unconsolidated[]`).

## 10. `schemas/geo-layers.schema.json` (`JurisdictionGeoLayers`)

Validates `data/processed/<jurisdiction>/geo-layers.json` (`schema_version: "1.2"`, `jurisdiction`, `layers[]` with `layer_id`, `title`, `kind` (`official_boundary | master_plan_zone | derived_overlay | reference`), `source`, `method`, `accuracy_m`, `derived`, `file`, `external_url`, `feature_count`).

## 11. `schemas/clause-zone-tags.schema.json` (`JurisdictionClauseZoneTags`)

Validates `data/processed/<jurisdiction>/clause-zone-tags.json` (`schema_version: "1.2"`, `jurisdiction`, `tags[]` with `clause_id`, `doc_id`, `zone_code`, `reason`, `verification`).
