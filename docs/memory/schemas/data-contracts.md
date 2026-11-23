---
type: memory
description: "Six versioned Draft 2020-12 JSON Schemas (jurisdiction, document, clause-tree, zones, overrides, manifest), provenance invariants, and config validation."
---
# Versioned JSON Schemas & Data Contracts

**Domain**: schemas

## Overview
All configuration inputs, intermediate metadata, processed bylaw datasets, manual overrides, and published release manifests are governed by six JSON Schema (Draft 2020-12) files in `schemas/` and validated via `pipeline/bylaws/schema_validator.py` and `pipeline/bylaws/config.py`. These contracts form the boundary between the Python pipeline and the Next.js web application described in [overview](/architecture/overview.md) (a5ou).

## Requirements

### Requirement: Six Versioned Draft 2020-12 JSON Schemas
The `schemas/` directory MUST define six JSON Schema (Draft 2020-12) contracts with `additionalProperties: false` on structured objects (a5ou):
1. `schemas/jurisdiction.schema.json`: Validates `jurisdictions/<id>.yaml` (`id`, `name`, `country`, `state`, `building_types`, `parents`, `documents[]`, and `maps.boundaries[]` / `maps.zoning[]`).
2. `schemas/document.schema.json`: Validates `data/raw/<jurisdiction>/<doc_id>.meta.json` (`schema_version: "1.0"`, `doc_id`, `title`, `issuing_authority`, `layer`, `role`, `legal_status`, `notified_date`, `effective_from`, `amends`, `supersedes`, `source_url`, `retrieved_at`, 64-char hex `sha256`, `bytes`, `page_count`, `is_scanned`).
3. `schemas/clause-tree.schema.json`: Validates `data/processed/<jurisdiction>/documents/<doc_id>.clauses.json` (`schema_version: "1.0"`, `doc_id`, `jurisdiction`, `legal_status`, `generated`, and `clauses[]` with `clause_id`, `number`, `title`, `level`, `parent_id`, `order`, `text`, `tables[]`, `pages[]`, `cross_references[]`, `amended_by[]`, `applies_to_zones[]`, `verification`).
4. `schemas/zones.schema.json`: Validates `data/processed/<jurisdiction>/zones.geojson` as a GeoJSON `FeatureCollection` of `Polygon` or `MultiPolygon` features carrying `zone_id`, `zone_code`, `zone_label`, `source_map`, `georef_run`, `extraction_method`, `area_sq_m`, `verification`, and `notes`.
5. `schemas/overrides.schema.json`: Validates `data/overrides/<jurisdiction>/*.yaml` (`schema_version: "1.0"`, optional `clause_fixes[]`, `zone_tags[]`, `zone_fixes[]`, and `map_curations[]`).
6. `schemas/manifest.schema.json`: Validates `manifest.json` (`schema_version: "1.0"`, `jurisdictions[]` with `id`, `name`, `latest_release`, and `releases[]` containing `files`, `drafts`, and `changelog`).

#### Scenario: Valid and Invalid Payload Validation
- **GIVEN** the six schema files in `schemas/` and `pipeline/bylaws/schema_validator.py`
- **WHEN** `validate_payload` or `validate_file` runs via `Draft202012Validator`
- **THEN** conforming payloads for all six schemas pass validation
- **AND** payloads missing `schema_version: "1.0"`, required provenance fields, or valid enum values raise `SchemaValidationError` listing the offending field paths

### Requirement: Mandatory Provenance and Legal Status Separation (Rules R2 & R3)
The schemas MUST enforce Rule R2 provenance and Rule R3 legal status separation at the data-contract level (a5ou):
- Every clause in `clause-tree.schema.json` MUST include a non-empty `pages` array of 1-based page numbers (`integer >= 1`) and a `verification` status (`unverified | machine_checked | human_verified`).
- Every zone feature in `zones.schema.json` MUST include `source_map`, `georef_run`, `extraction_method` (`colour_segmentation | road_outline_fallback | manual`), and `verification` (`unverified | machine_checked | human_verified | rejected`).
- Every document and clause tree MUST specify `legal_status` (`in_force | draft | superseded | withdrawn`), and `manifest.schema.json` MUST isolate draft clause trees under `releases[].drafts.clauses` separate from `releases[].files.clauses`.

#### Scenario: Rejecting Clauses or Zones Without Provenance
- **GIVEN** a clause object with an empty `pages: []` array or a zone feature missing `source_map` or `georef_run`
- **WHEN** validated against `clause-tree.schema.json` or `zones.schema.json`
- **THEN** validation fails with a `SchemaValidationError`

### Requirement: Typed Jurisdiction Configuration Loader
`pipeline/bylaws/config.py` MUST load `jurisdictions/<id>.yaml`, validate the raw dictionary against `schemas/jurisdiction.schema.json`, verify that the internal `id` matches the requested filename stem, verify that every `maps.zoning[].document` references a declared entry in `documents[]`, and return an immutable Pydantic `JurisdictionConfig` model (a5ou). Any missing file, invalid YAML syntax, schema error, or cross-reference mismatch MUST raise `ConfigValidationError` (a5ou).

#### Scenario: Loading Valid and Malformed Jurisdiction Configs
- **GIVEN** `jurisdictions/_fixture-test.yaml`
- **WHEN** `load_jurisdiction_config("_fixture-test")` is called
- **THEN** it returns a populated `JurisdictionConfig` instance
- **AND** when a config dictionary is missing required fields or references an unknown document ID in `maps.zoning`, `ConfigValidationError` is raised with the field path

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
