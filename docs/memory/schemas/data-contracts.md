---
type: memory
description: "Eight Schema v1.1 Draft 2020-12 JSON Schema contracts, bbox citations, Rule R9 record immutability, imported zoning maps, and single-source Pydantic/TypeScript codegen."
---
# Versioned JSON Schemas & Data Contracts

**Domain**: schemas

## Overview
All configuration inputs, raw document metadata, processed bylaw datasets, manual overrides, coverage gap declarations, amendment links, and published release manifests are governed by eight JSON Schema (Draft 2020-12) files at `schema_version: "1.1"` in `schemas/` (a5ou, 8ay2). These contracts serve as the single source of truth for runtime validation in `pipeline/bylaws/schema_validator.py` and for generated Pydantic v2 models (`pipeline/bylaws/models/_generated.py`) and TypeScript interfaces (`lib/types/generated.ts`), forming the boundary between the Python pipeline and the Next.js web application described in [overview](/architecture/overview.md) (a5ou, 8ay2).

## Requirements

### Requirement: Eight Versioned Draft 2020-12 JSON Schemas (Schema v1.1)
The `schemas/` directory MUST define eight JSON Schema (Draft 2020-12) contracts at `schema_version: "1.1"` with `additionalProperties: false` on structured objects, registered in `pipeline/bylaws/schema_validator.py` (`SCHEMA_NAMES`) and documented in `docs/schema.md` (a5ou, 8ay2):
1. `schemas/jurisdiction.schema.json`: Validates `jurisdictions/<id>.yaml` (`id` matching `^[a-z0-9]+(-[a-z0-9]+)*$`, `name`, optional `aliases[]`, `country`, `state`, `building_types[]`, `parents[]`, optional `not_modelled[]`, optional `unread_documents[]` with `{ title, source_url, reason }`, `documents[]` requiring `status_evidence` (`{ url, description }`) and `licence_or_terms`, and `maps.boundaries[]` / `maps.zoning[]` discriminated by `kind: "traced" | "imported"`) (a5ou, 8ay2).
2. `schemas/document.schema.json`: Validates `data/raw/<jurisdiction>/<doc_id>.meta.json` and entries in `documents.json` (`schema_version: "1.1"`, `doc_id`, `title`, `issuing_authority`, `layer`, `role`, `legal_status`, `status_evidence` (`{ url, description }`), `licence_or_terms`, `notified_date`, `effective_from`, `amends[]`, `supersedes[]`, `source_url`, `retrieved_at`, 64-char lowercase hex `sha256`, `bytes`, `page_count`, `is_scanned`) (a5ou, 8ay2).
3. `schemas/clause-tree.schema.json`: Validates `data/processed/<jurisdiction>/documents/<doc_id>.clauses.json` (`schema_version: "1.1"`, `doc_id`, `jurisdiction`, `legal_status`, `generated`, and `clauses[]` with `clause_id`, `record_id` (`<doc_id>:<number>@v<N>`), `supersedes`, `superseded_by`, `legal_status`, `number`, `title`, `level`, `parent_id`, `order`, `text`, `tables[]`, non-empty `citations[]`, `cross_references[]`, `amended_by[]`, `applies_to_zones[]`, `verification`) (a5ou, 8ay2).
4. `schemas/zones.schema.json`: Validates `data/processed/<jurisdiction>/zones.geojson` as a GeoJSON `FeatureCollection` requiring `schema_version: "1.1"` and `Polygon` or `MultiPolygon` features carrying `zone_id`, `record_id` (`<map_id>:z<NNNN>@v<N>`), `supersedes`, `superseded_by`, `zone_code`, `zone_label`, `source_map`, `georef_run`, `extraction_method` (`colour_segmentation | road_outline_fallback | manual | imported`), `source_attribution`, `area_sq_m`, `verification`, and `notes` (a5ou, 8ay2).
5. `schemas/overrides.schema.json`: Validates `data/overrides/<jurisdiction>/*.yaml` (`schema_version: "1.1"`, optional `clause_fixes[]`, `zone_tags[]`, `zone_fixes[]`, and `map_curations[]`) (a5ou, 8ay2).
6. `schemas/declarations.schema.json`: Validates `data/processed/<jurisdiction>/declarations.json` (`schema_version: "1.1"`, `jurisdiction`, `not_modelled[]`, `known_gaps[]` with `{ doc_id, description }`, and `unread_documents[]` with `{ title, source_url, reason }`) (8ay2).
7. `schemas/amendments.schema.json`: Validates `data/processed/<jurisdiction>/amendments.json` (`schema_version: "1.1"`, `jurisdiction`, and `links[]` with `{ amending_clause, target_clause, action, confidence, verification, note? }`) (8ay2).
8. `schemas/manifest.schema.json`: Validates `public/data/manifest.json` (`schema_version: "1.1"`, `jurisdictions[]` with `id`, `name`, optional `aliases[]`, `latest_release`, and `releases[]` containing `version`, `released_at`, `licence`, `download_zip`, `sha256sums`, `declarations`, `changelog`, `files`, and `drafts`) (a5ou, 8ay2).

#### Scenario: Valid and Invalid Schema v1.1 Payload Validation
- **GIVEN** the eight schema files in `schemas/` and `pipeline/bylaws/schema_validator.py`
- **WHEN** `validate_payload` or `validate_file` runs via `Draft202012Validator`
- **THEN** conforming v1.1 payloads for all eight schemas pass validation
- **AND** payloads missing `schema_version: "1.1"`, required provenance or immutability fields, or valid enum values raise `SchemaValidationError` listing the offending field paths

### Requirement: Citations, Record Immutability, Imported Maps, and Legal Status Separation (Rules R2, R3 & R9)
The Schema v1.1 contracts MUST enforce provenance, record immutability, and legal status separation at the data-contract level (a5ou, 8ay2):
- Every clause in `clause-tree.schema.json` MUST include a non-empty `citations` array of `{ doc_id: string, page: integer >= 1, bbox: [x0, y0, x1, y1] | null, text_excerpt: string }` (where `bbox` coordinates are normalized `0.0`–`1.0` page fractions with top-left origin), an explicit `legal_status` (`in_force | draft | superseded | withdrawn`), a `verification` status (`unverified | machine_checked | human_verified`), and versioned immutability fields `record_id`, `supersedes`, and `superseded_by` (a5ou, 8ay2).
- Every zone feature in `zones.schema.json` MUST include `record_id`, `supersedes`, `superseded_by`, `source_map`, `georef_run`, `extraction_method` (`colour_segmentation | road_outline_fallback | manual | imported`), `source_attribution`, and `verification` (`unverified | machine_checked | human_verified | rejected`); when `extraction_method == "imported"`, JSON Schema conditional validation (`if`/`then`) MUST require `source_attribution` to be a non-empty string (a5ou, 8ay2).
- Zoning map configurations in `jurisdiction.schema.json` MUST support both `kind: "traced"` (`id`, `kind`, `document`, `page`, `planning_district`, `legend_page`) and `kind: "imported"` (`id`, `kind`, `source_url`, `zone_code_field`, `zone_label_field`, `source_attribution`) (8ay2).
- Every document and clause tree MUST specify `legal_status` (`in_force | draft | superseded | withdrawn`), and `manifest.schema.json` MUST isolate draft clause trees under `releases[].drafts.clauses` separate from `releases[].files.clauses` (a5ou).

#### Scenario: Rejecting Clauses or Zones Missing Citations, Attribution, or Immutability Fields
- **GIVEN** a clause object with an empty `citations: []` array or missing `record_id`, or an `"imported"` zone feature with `source_attribution: null` or `""`
- **WHEN** validated against `clause-tree.schema.json` or `zones.schema.json`
- **THEN** validation fails with a `SchemaValidationError`

### Requirement: Single-Source Codegen and Typed Jurisdiction Configuration Loader
`scripts/generate_models.py` (invoked via `make generate` or `npm run generate`) MUST deterministically generate `pipeline/bylaws/models/_generated.py` (using `datamodel-code-generator` targeting Pydantic v2 `BaseModel` with `extra="forbid"`) and `lib/types/generated.ts` (using `json-schema-to-typescript`) from `schemas/*.schema.json`, verified in CI via `git diff --exit-code` (8ay2). `pipeline/bylaws/config.py` and `lib/data.ts` MUST consume and re-export these generated models and types (8ay2). `pipeline/bylaws/config.py` MUST load `jurisdictions/<id>.yaml`, validate the raw dictionary against `schemas/jurisdiction.schema.json`, verify that the internal `id` matches the requested filename stem, verify that every `kind: "traced"` entry in `maps.zoning[]` references a declared `document` in `documents[]`, and return an immutable Pydantic `JurisdictionConfig` model, raising `ConfigValidationError` on any violation (a5ou, 8ay2).

#### Scenario: Deterministic Codegen and Jurisdiction Config Validation
- **GIVEN** `schemas/*.schema.json` and `jurisdictions/xx-test-fixture.yaml`
- **WHEN** `make generate` runs and `load_jurisdiction_config("xx-test-fixture")` is called
- **THEN** `pipeline/bylaws/models/_generated.py` and `lib/types/generated.ts` are produced with zero git diff, `load_jurisdiction_config("xx-test-fixture")` returns a populated `JurisdictionConfig` instance, and configs with missing fields or unknown traced map document IDs raise `ConfigValidationError`

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
**Why**: Prevents schema drift between Python pipeline stages, JSON Schema validators, and Next.js TypeScript components as Schema v1.1 contracts govern citations, supersede chains, declarations, and amendment links.
**Rejected**: Hand-maintaining duplicate Pydantic classes in `pipeline/bylaws/config.py` and TypeScript interfaces in `lib/data.ts`.
*Introduced by*: 261123-8ay2-m1-5-pipeline-vertical-slice

### Discriminated Traced vs. Imported Zoning Map Configurations
**Decision**: Discriminate `maps.zoning[]` entries in `schemas/jurisdiction.schema.json` by `kind: "traced" | "imported"` and require non-empty `source_attribution` on `zones.schema.json` features whenever `extraction_method == "imported"`.
**Why**: Enables the pipeline to ingest authoritative open-data GeoJSON zoning layers alongside PDF-traced maps while enforcing license attribution on imported geospatial features.
**Rejected**: Assuming all zoning maps originate from rasterized PDF pages or allowing imported GeoJSON zones without source attribution.
*Introduced by*: 261123-8ay2-m1-5-pipeline-vertical-slice
