---
type: memory
description: "Twelve Schema v1.3 Draft 2020-12 JSON Schema contracts, three-layer document model, R12 record version chains, R13 text rights, R14 derived consolidated clauses and geo layers, pre-release register_documents manifest path, and single-source Pydantic/TypeScript codegen."
---
# Versioned JSON Schemas & Data Contracts

**Domain**: schemas

## Overview
All configuration inputs, raw document metadata, processed bylaw datasets, stand-off annotations, manual overrides, coverage gap declarations, amending effects, consolidated clauses, geospatial layers, clause–zone tags, and published release manifests are governed by twelve JSON Schema (Draft 2020-12) files at `schema_version: "1.3"` in `schemas/` (a5ou, 8ay2, izxl, fcwm, llmz, 986m). These contracts serve as the single source of truth for runtime validation in `pipeline/bylaws/schema_validator.py` and for generated Pydantic v2 models (`pipeline/bylaws/models/_generated.py`) and TypeScript interfaces (`lib/types/generated.ts`), forming the boundary between the Python pipeline and the Next.js web application described in [overview](/architecture/overview.md) (a5ou, 8ay2, izxl, llmz, 986m).

## Requirements

### Requirement: Twelve Versioned Draft 2020-12 JSON Schemas (Schema v1.3: Three Layers)
The `schemas/` directory MUST define twelve JSON Schema (Draft 2020-12) contracts at `schema_version: "1.3"` with `additionalProperties: false` on structured objects, registered in `pipeline/bylaws/schema_validator.py` (`SCHEMA_NAMES`) and documented in `docs/schema.md` (a5ou, 8ay2, izxl, llmz):
1. `schemas/jurisdiction.schema.json`: Validates `jurisdictions/<id>.yaml` (`id` matching `^[a-z0-9]+(-[a-z0-9]+)*$`, `name`, optional `visibility` (`"public" | "test"`), optional `licence` (e.g., `"CC BY 4.0"`), optional `release_version` (`string | null` matching `^\d+\.\d+\.\d+$`), optional `aliases[]`, `country`, `state`, `building_types[]`, `parents[]`, declaration fields (`not_modelled[]`, `known_gaps[]`, `unread_documents[]`, `unobtainable_documents[]`, `contested_status[]`, `building_relevant_sections[]`), `documents[]` with `doc_type` / `role`, `layer`, `legal_status`, optional `acquisition_status` (`"acquired" | "pending" | "not_found" | "reference_only"`, default `"acquired"`), optional `retrieval` (`RetrievalRecord | null`), `status_evidence`, `text_rights`, `languages[]`, `official_url`, `mirror_urls[]`, `cited_provisions[]`, and `maps` (`boundaries[]`, `planning_districts[]`, `zoning[]`, `overlays[]`)) (a5ou, 8ay2, izxl, fcwm).
2. `schemas/document.schema.json`: Validates `data/raw/<jurisdiction>/<doc_id>.meta.json` and entries in `documents.json` (`schema_version: "1.2"`, `doc_id`, `title`, `issuing_authority`, `layer`, `doc_type`, `role`, `notification_number`, `gazette_reference`, `notified_date`, `effective_from`, `legal_status`, optional `acquisition_status` (`"acquired" | "pending" | "not_found" | "reference_only"`), optional `retrieval` (`RetrievalRecord` with `fetched_at`, `requested_url`, `final_url`, `http_status`, `content_type`, `content_length`, `response_headers`, `sha256`, `archive_url`, `archive_failure_reason`, `fetched_by`), `status_evidence`, `superseded_by_document`, `amends[]`, `supersedes[]`, `text_rights`, `languages[]`, `official_url`, `mirror_urls[]`, `copies[]`, `cited_provisions[]`, `licence_or_terms`, `source_url`, `retrieved_at`, 64-char lowercase hex `sha256`, `bytes`, `page_count`, `is_scanned`) (a5ou, 8ay2, izxl, fcwm).
3. `schemas/clause-tree.schema.json`: Validates `data/processed/<jurisdiction>/documents/<doc_id>.clauses.json` (`schema_version: "1.3"`, `doc_id`, `jurisdiction`, `legal_status`, `generated`, and `clauses[]` carrying Layer 1 fields `eid` (`<prefix>_<token>` joined by `__`), `native_number`, 22 `type` values (`preface`, `preamble`, `part`, `chapter`, `section`, `regulation`, `bye_law`, `clause`, `subclause`, `item`, `paragraph`, `proviso`, `explanation`, `note`, `definition`, `schedule`, `annexure`, `appendix`, `form`, `table`, `table_row`, `signature_block`), `heading`, `intro`, `content`, `wrap_up`, `children[]`, `parent_eid`, `defines`, `defines_normalised`, `table_meta` (`columns[]`, `rows[]`, `footnotes[]`, `extraction`), `cells[]`, Layer 3 `versions[]` (`NodeVersion`), non-empty `citations[]`, and R12 record version fields) (a5ou, 8ay2, izxl, llmz).
4. `schemas/annotations.schema.json`: Validates `data/processed/<jurisdiction>/documents/<doc_id>.annotations.json` (`schema_version: "1.3"`, `doc_id`, `jurisdiction`, and `annotations[]` with `annotation_id`, `target` (`{ eid, version_id, field, cell_index?, span: [start, end], span_text }`), `kind` (`"cross_reference" | "defined_term_use" | "provision_type"`), `value`, `method` (`"rule" | "model" | "person"`), `confidence` (`0.0`–`1.0`), and `verification`) (llmz).
4. `schemas/zones.schema.json`: Validates `data/processed/<jurisdiction>/zones.geojson` as a GeoJSON `FeatureCollection` requiring `schema_version: "1.2"` and `Polygon` or `MultiPolygon` features carrying `zone_id`, `record_id` (`<map_id>:z<NNNN>@v<N>`), `record_version` (integer >= 1), `record_supersedes`, `record_superseded_by`, `record_change_reason`, `supersedes`, `superseded_by`, `zone_code`, `zone_label`, `planning_district`, `sheet`, `source_map`, `georef_run`, `extraction_method` (`vector_pdf | grid_georeferenced_raster | osm_gcp_raster | imported | colour_segmentation | road_outline_fallback | manual`), `source_attribution`, `area_sq_m`, `verification`, `verified_by`, and `notes` (a5ou, 8ay2, izxl).
5. `schemas/overrides.schema.json`: Validates `data/overrides/<jurisdiction>/*.yaml` (`schema_version: "1.2"`, optional `clause_fixes[]`, `zone_tags[]`, `zone_fixes[]`, and `map_curations[]`) (a5ou, 8ay2, izxl).
6. `schemas/declarations.schema.json`: Validates `data/processed/<jurisdiction>/declarations.json` (`schema_version: "1.2"`, `jurisdiction`, `not_modelled[]`, `known_gaps[]` with `{ doc_id, description }`, `unread_documents[]` with `{ title, source_url, reason }`, `unobtainable_documents[]` with `{ id, title, searched_sources[], reason }`, `contested_status[]` with `{ doc_id, title, conflicting_evidence[], declared_status: "status_unknown" }`, and `building_relevant_sections[]`) (8ay2, izxl).
7. `schemas/amendments.schema.json`: Validates `data/processed/<jurisdiction>/amendments.json` (`schema_version: "1.2"`, `jurisdiction`, and `links[]` with `{ amending_clause, target_clause, target_doc_id?, amending_doc_id?, action: "substitute" | "insert_after" | "insert_before" | "omit" | "modify" | "renumber", effective_date?, confidence: "high" | "medium" | "low", verification, summary?, note? }`) (8ay2, izxl).
8. `schemas/consolidated.schema.json`: Validates `data/processed/<jurisdiction>/consolidated.json` (`schema_version: "1.2"`, `jurisdiction`, `generated`, `derived: true`, `clauses[]` with `{ clause_id, doc_id, number, title, as_of_date, text, tables[], amendments_applied[], derived: true, method, confidence: "high" }`, and `unconsolidated[]` recording clauses omitted from consolidation when any applicable amendment link is not high-confidence) (izxl).
9. `schemas/geo-layers.schema.json`: Validates `data/processed/<jurisdiction>/geo-layers.json` (`schema_version: "1.2"`, `jurisdiction`, and `layers[]` with `{ layer_id, title, kind: "official_boundary" | "master_plan_zone" | "derived_overlay" | "reference", source, method, accuracy_m, derived, file, external_url? }`) (izxl).
10. `schemas/clause-zone-tags.schema.json`: Validates `data/processed/<jurisdiction>/clause-zone-tags.json` (`schema_version: "1.2"`, `jurisdiction`, and `tags[]` with `{ clause_id, doc_id, zone_code, reason, verification }`) (izxl).
11. `schemas/manifest.schema.json`: Validates `public/data/manifest.json` (`schema_version: "1.3"`, `jurisdictions[]` with `id`, `name`, optional `visibility` (`"public" | "test"`), optional `aliases[]`, nullable `latest_release` (`string | null`), optional `register_documents` (`string | null` pointing to `/data/<id>/register/documents.json` for pre-release source register display), and `releases[]` containing `version`, optional `status` (`"published" | "withdrawn"`, default `"published"`), optional `withdrawn_reason` (`string | null`), `released_at`, `licence`, and nullable `download_zip`, `sha256sums`, `declarations`, `files`, and `drafts`, plus `changelog`) (a5ou, 8ay2, izxl, tuou, llmz, 986m).

#### Scenario: Valid and Invalid Schema v1.2 Payload Validation
- **GIVEN** the eleven schema files in `schemas/` and `pipeline/bylaws/schema_validator.py`
- **WHEN** `validate_payload` or `validate_file` runs via `Draft202012Validator`
- **THEN** conforming v1.2 payloads for all eleven schemas pass validation
- **AND** payloads missing `schema_version: "1.2"`, required provenance or immutability fields, or valid enum values raise `SchemaValidationError` listing the offending field paths

### Requirement: Citations, Record Version Separation, Text Rights, Derived Provenance, and Clause–Zone Tags (Rules R2, R3, R9, R12, R13 & R14)
The Schema v1.2 contracts MUST enforce provenance, record version separation, text rights, and derived attribution at the data-contract level (a5ou, 8ay2, izxl):
- Every clause in `clause-tree.schema.json` MUST include a non-empty `citations` array of `{ doc_id: string, page: integer >= 1, bbox: [x0, y0, x1, y1] | null, text_excerpt: string }` (where `bbox` coordinates are normalized `0.0`–`1.0` page fractions with top-left origin), an explicit `legal_status` (`in_force | draft | superseded | withdrawn | status_unknown`), a `verification` status (`unverified | machine_checked | human_verified`), and record version fields `record_id`, `record_version`, `record_supersedes`, `record_superseded_by`, `record_change_reason` (alongside `supersedes` and `superseded_by` compatibility fields) separate from `legal_status` (a5ou, 8ay2, izxl).
- Every zone feature in `zones.schema.json` MUST include `record_id`, `record_version`, `record_supersedes`, `record_superseded_by`, `record_change_reason`, `source_map`, `georef_run`, `extraction_method` (`vector_pdf | grid_georeferenced_raster | osm_gcp_raster | imported | colour_segmentation | road_outline_fallback | manual`), `source_attribution`, and `verification` (`unverified | machine_checked | human_verified | rejected`); when `extraction_method == "imported"`, JSON Schema conditional validation (`if`/`then`) MUST require `source_attribution` to be a non-empty string (a5ou, 8ay2, izxl).
- Every document in `document.schema.json` and `jurisdiction.schema.json` MUST declare `text_rights` (`{ mode: "full_text" | "reference_only", reason: string }`) and `legal_status` (`in_force | draft | superseded | withdrawn | status_unknown`), and `manifest.schema.json` MUST isolate draft clause trees under `releases[].drafts.clauses` separate from `releases[].files.clauses` (a5ou, izxl).
- Every consolidated clause in `consolidated.schema.json` MUST carry `derived: true`, `method` (non-empty string), `confidence: "high"`, and `amendments_applied[]`, and every geospatial layer in `geo-layers.schema.json` MUST declare `derived` (`boolean`), `method`, `source`, and `accuracy_m` (`number | null`) (izxl).
- Every tag in `clause-zone-tags.schema.json` MUST link a `clause_id` and `doc_id` to a `zone_code` (specific code, overlay ID, or `ALL`) with a non-empty quoted `reason` and `verification` (izxl).

#### Scenario: Rejecting Clauses or Zones Missing Citations, Attribution, or Record Version Fields
- **GIVEN** a clause object with an empty `citations: []` array or missing `record_id`, or an `"imported"` zone feature with `source_attribution: null` or `""`
- **WHEN** validated against `clause-tree.schema.json` or `zones.schema.json`
- **THEN** validation fails with a `SchemaValidationError`

### Requirement: Single-Source Codegen and Typed Jurisdiction Configuration Loader
`scripts/generate_models.py` (invoked via `make generate` or `npm run generate`) MUST deterministically generate `pipeline/bylaws/models/_generated.py` (using `datamodel-code-generator` targeting Pydantic v2 `BaseModel` with `extra="forbid"`) and `lib/types/generated.ts` (using `json-schema-to-typescript`) from all eleven `schemas/*.schema.json` contracts, verified in CI via `git diff --exit-code` (8ay2, izxl). `pipeline/bylaws/config.py` and `lib/data.ts` MUST consume and re-export these generated models and types (8ay2, izxl). `pipeline/bylaws/config.py` MUST load `jurisdictions/<id>.yaml`, validate the raw dictionary against `schemas/jurisdiction.schema.json`, verify that the internal `id` matches the requested filename stem, verify that every `kind: "traced"` entry in `maps.zoning[]` references a declared `document` in `documents[]`, and return an immutable Pydantic `JurisdictionConfig` model, raising `ConfigValidationError` on any violation (a5ou, 8ay2).

#### Scenario: Deterministic Codegen and Jurisdiction Config Validation
- **GIVEN** `schemas/*.schema.json`, `jurisdictions/xx-test-fixture.yaml`, and `jurisdictions/in-ka-bengaluru-south.yaml`
- **WHEN** `make generate` runs and `load_jurisdiction_config` is called for both jurisdictions
- **THEN** `pipeline/bylaws/models/_generated.py` and `lib/types/generated.ts` are produced with zero git diff, `load_jurisdiction_config` returns populated `JurisdictionConfig` instances, and configs with missing fields or unknown traced map document IDs raise `ConfigValidationError`

## Design Decisions

### Committed Map Curations in Overrides Schema
**Decision**: Include an optional `map_curations` array in `schemas/overrides.schema.json` storing per-map `legend_entries` (`zone_code`, `zone_label`, `rgb`) and pixel `gcps` (`id`, `label`, `pixel_x`, `pixel_y`, optional `lon`/`lat` or `osm_query`).
**Why**: Upholds Rule R6 (deterministic reproducibility from raw sources plus committed configuration and overrides) by keeping agent-curated map legend swatches and Ground Control Points versioned and schema-validated under `data/overrides/<jurisdiction>/`.
**Rejected**: Storing manual GCPs or legend colour mappings in untracked `data/interim/` files that cannot be reproduced on a clean checkout.
*Introduced by*: 261123-a5ou-m0-m1-scaffold-schemas-fixture

### Dual-Layer Validation with JSON Schema Draft 2020-12 and Pydantic
**Decision**: Validate all JSON, GeoJSON, and YAML artifacts against `schemas/*.schema.json` using `jsonschema.Draft202012Validator` in `pipeline/bylaws/schema_validator.py`, and parse `jurisdictions/<id>.yaml` into `Pydantic` (`BaseModel` with `extra="forbid"`) models in `pipeline/bylaws/config.py` with cross-field document ID verification.
**Why**: Keeps the language-neutral JSON Schema files in `schemas/` as the single source of truth shared between Python and TypeScript while providing strict static typing and cross-reference checks inside the Python pipeline.
**Rejected**: Maintaining only Pydantic models without language-neutral JSON Schemas, or skipping cross-field validation between `maps.zoning[].document` and `documents[].id`.
*Introduced by*: 261123-a5ou-m0-m1-scaffold-schemas-fixture

### Single-Source Model Codegen from JSON Schemas
**Decision**: Generate `pipeline/bylaws/models/_generated.py` (via `datamodel-code-generator` targeting Pydantic v2 `extra="forbid"`) and `lib/types/generated.ts` (via `json-schema-to-typescript`) from `schemas/*.schema.json` using `scripts/generate_models.py` (`make generate` / `npm run generate`), enforced in CI with `git diff --exit-code`.
**Why**: Prevents schema drift between Python pipeline stages, JSON Schema validators, and Next.js TypeScript components as Schema v1.2 contracts govern citations, record version chains, text rights, consolidated clauses, geospatial layers, clause–zone tags, declarations, and amendment links.
**Rejected**: Hand-maintaining duplicate Pydantic classes in `pipeline/bylaws/config.py` and TypeScript interfaces in `lib/data.ts`.
*Introduced by*: 261123-8ay2-m1-5-pipeline-vertical-slice

### Discriminated Traced vs. Imported Zoning Map Configurations
**Decision**: Discriminate `maps.zoning[]` entries in `schemas/jurisdiction.schema.json` by `kind: "traced" | "imported"` and require non-empty `source_attribution` on `zones.schema.json` features whenever `extraction_method == "imported"`.
**Why**: Enables the pipeline to ingest authoritative open-data GeoJSON zoning layers alongside PDF-traced maps while enforcing license attribution on imported geospatial features.
**Rejected**: Assuming all zoning maps originate from rasterized PDF pages or allowing imported GeoJSON zones without source attribution.
*Introduced by*: 261123-8ay2-m1-5-pipeline-vertical-slice

### Separate Record Version Chain from Legal Status (Rule R12)
**Decision**: Represent record correction history on clauses and zones with `record_version` (integer), `record_supersedes`, `record_superseded_by`, and `record_change_reason`, while reserving `legal_status` (`in_force | draft | superseded | withdrawn | status_unknown`) strictly for regulatory enactment status. Filter superseded record versions (`record_superseded_by != null`) out of default lists and display a compact `"v2 · corrected from v1"` disclosure on the current record.
**Why**: Conflating data correction versions (`1.1@v1` → `1.1@v2`) with repealed legislation (`legal_status: "superseded"`) causes corrected clauses to appear twice and misleads users into thinking an active provision was legally repealed.
**Rejected**: Using a single `SUPERSEDED` badge for both repealed legislation and corrected data records.
*Introduced by*: 261123-izxl-plan-v2-bengaluru-south-complete

### Explicit Text Rights and Derived Work Provenance (Rules R13 & R14)
**Decision**: Add `text_rights: { mode: "full_text" | "reference_only", reason }` to every document and `derived: boolean` + `method: string` to consolidated clause records and geospatial layers. Render `reference_only` documents (`nbc-2016`, `aai-cczm`) as structured citation/metadata hubs without full text, and badge all consolidated clauses and buffered overlays as `"Derived by this project, not an official publication"`.
**Why**: Government statutes, rules, regulations, bye-laws, and gazette notifications may be republished in full under Indian copyright law (Section 52(1)(q) Copyright Act, 1957), whereas BIS standards (NBC 2016) are copyrighted commercial publications and consolidated "as amended" text / buffer polygons are editorial derivations rather than official gazettes.
**Rejected**: Publishing scraped NBC 2016 text (copyright violation) or presenting consolidated text without an explicit derived disclaimer (regulatory traceability violation).
*Introduced by*: 261123-izxl-plan-v2-bengaluru-south-complete

### Explicit `withdrawn` Release Status in `manifest.schema.json`
**Decision**: Add `status: "published" | "withdrawn"` and `withdrawn_reason: string | null` to `releaseEntry` in `schemas/manifest.schema.json`, make `latest_release` nullable on `jurisdictionManifest`, and allow `download_zip`, `sha256sums`, `declarations`, `files`, and `drafts` to be `null` when `status == "withdrawn"`.
**Why**: Allows `public/data/manifest.json` to record withdrawn releases (`1.0.0`) with their withdrawal reason while guaranteeing zero downloadable links and maintaining strict JSON Schema validation.
**Rejected**: Deleting `1.0.0` from `manifest.json` entirely and hard-coding the withdrawal notice in `app/data/page.tsx` (violates R1 data-driven architecture).
*Introduced by*: 261124-tuou-pr-01-contain-production

### Dual-Compatible Node Representation in Schema 1.3
**Decision**: Populate all Schema 1.3 Layer 1 fields (`eid`, `native_number`, `type`, `heading`, `intro`, `content`, `wrap_up`, `children`, `parent_eid`, `defines`, `defines_normalised`, `table_meta`, `cells`, `versions`) on every node while retaining `clause_id` (`<doc_id>:<eid>`), `number`, `title`, and `text` as synchronized convenience properties.
**Why**: Satisfies every Layer 1–3 requirement of `03-schema-three-layers.md` while keeping map zone tagging (`clause-zone-tags.json`) and R12 record version helpers (`<doc_id>:<eid>@v<N>`) uniform across pipeline stages.
**Rejected**: Breaking `clause_id` references in geospatial zone tags before PR 11 migrates zone links to `zone_applicability` annotations.
*Introduced by*: 261124-llmz-pr-03-schema-three-layers

### Pre-Release Source Register via `register_documents` on `JurisdictionManifest`
**Decision**: Add an optional `register_documents` (`string | null`) field to `jurisdictionManifest` in `schemas/manifest.schema.json` pointing to `/data/<id>/register/documents.json`, populated by `bylaws acquire` from the verified `jurisdictions/<id>.yaml` register entries. When `release === null` on a jurisdiction but `register_documents` is present, `fetchJurisdictionDataset` loads `documents` from `register_documents` while keeping `release: null` and `clauses: []`.
**Why**: Allows the Sources and Data pages to display the real acquired source register in PR 04 (marked `"Not yet structured"`) while Map, Documents, Timeline, and Review pages continue showing `"No data published yet"` until PR 05 publishes Release `2.0.0`.
**Rejected**: Creating a premature release entry in `releases[]` for PR 04, which would violate `00-overview.md` §7 ("Real releases start at `2.0.0` (PR 05)").
*Introduced by*: 261124-986m-pr-04-acquire-core-documents
