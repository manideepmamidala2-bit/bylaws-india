# ADR 003: Plan v2.0 — Schema v1.2, Record Version Separation (R12), Text Rights (R13), and Derived Provenance (R14)

- **Date**: 2026-11-23
- **Status**: Accepted
- **Context**: Plan v2.0 (`docs/plan-v2.md`) §2 (Rules R1–R14), §4 (Data Model Changes — Schema 1.2), and Audit 2 findings at commit `7e0273c`

## Context

Following the Milestone M1.5 vertical slice and Audit 2 review (`7e0273c`), the project adopted **Plan v2.0: Bengaluru South, Complete** (`docs/plan-v2.md`) to deliver a complete public dataset and web viewer for Bengaluru South City Corporation (`in-ka-bengaluru-south`). Four data-modeling and regulatory integrity decisions required formal specification in **Schema v1.2**:

1. **Record Version Chain vs. Legal Status (`Rule R12`)**: In Schema v1.1, when an override updated a verified clause (`1.1@v1` -> `1.1@v2`), the UI conflated `superseded_by` on the data record with `legal_status: "superseded"`, rendering the old record alongside the new one with a `SUPERSEDED` legal badge that falsely implied the law itself had been repealed.
2. **Text Republishing Rights (`Rule R13`)**: While Indian government statutes, rules, regulations, bye-laws, notifications, and orders are public government works that may be republished in full, commercial standards cited by municipal law (such as the Bureau of Indian Standards' *National Building Code of India 2016*, `nbc-2016`) and restricted aviation maps (AAI CCZM via NOCAS, `aai-cczm`) are copyrighted or non-redistributable.
3. **Derived Work Labelling (`Rule R14`)**: Editorial outputs computed by this project—such as consolidated "as amended" clause text, georeferenced master plan polygons, and buffered influence-zone overlays—must never be confused with official gazette publications.
4. **Expanded Regulatory & Geospatial Contracts (`Schema v1.2`)**: Modelling a complete Indian municipal jurisdiction requires 8 regulatory layers (`statute`, `state_rules`, `planning`, `municipal`, `orders`, `overlay`, `national_reference`, `boundary`), 10 document types, multi-copy SHA-256 provenance, bilingual (`en` / `kn`) verbatim clauses, consolidated clause trees, multi-layer GeoJSON registries (`geo-layers.json`), and quoted clause–zone applicability tags (`clause-zone-tags.json`).

## Decisions

### 1. Separate Record Version Fields from Legal Status (`Rule R12`)

- Every clause (`clause-tree.schema.json`) and zone feature (`zones.schema.json`) carries explicit record-version fields:
  - `record_version` (`integer >= 1`)
  - `record_id` (`<id>@v<N>`)
  - `record_supersedes` (`string | null`)
  - `record_superseded_by` (`string | null`)
  - `record_change_reason` (`string | null`)
  (retaining `supersedes` and `superseded_by` synced for backward compatibility).
- `legal_status` (`in_force | draft | superseded | withdrawn | status_unknown`) represents **only** the legal enactment state of the provision or instrument and is never mutated when a data correction creates `@v2`.
- Default UI views filter out historical record versions (`record_superseded_by != null`) and render a compact `"v2 · corrected from v1"` disclosure on the current record that expands version history without displaying a `SUPERSEDED` legal status badge.

### 2. Explicit `text_rights` Mode (`Rule R13`)

- Every document in `jurisdiction.schema.json` and `document.schema.json` declares `text_rights: { mode: "full_text" | "reference_only", reason: string }`.
- Government Acts, state rules, master plan zoning regulations, municipal building bye-laws, gazette notifications, and government orders use `mode: "full_text"` and are parsed and structured in full.
- Copyrighted standards (`nbc-2016`) and non-redistributable external maps (`aai-cczm`) use `mode: "reference_only"` with `cited_provisions[]` recording the specific parts, clauses, and topics cited by Karnataka/Bengaluru law alongside `where_to_obtain` instructions. Their full text or height surfaces are never reproduced.

### 3. Explicit `derived: true` Provenance (`Rule R14`)

- Consolidated "as amended" clause records (`schemas/consolidated.schema.json`) and project-generated geospatial layers (`schemas/geo-layers.schema.json`) carry `derived: true` and a human-readable `method` description.
- Consolidated text is generated only when every applicable amendment link for a target clause has `confidence: "high"`; otherwise the clause is listed in `unconsolidated[]` with an explicit reason and the UI displays original text and amending clauses side by side.
- Every derived view or map layer is visibly badged `"Derived by this project, not an official publication"` with direct links back to the underlying official sources.

### 4. Single-Source Schema v1.2 Suite

- All 11 JSON Schemas (`jurisdiction`, `document`, `clause-tree`, `zones`, `overrides`, `declarations`, `amendments`, `manifest`, `consolidated`, `geo-layers`, and `clause-zone-tags`) are versioned at `schema_version: "1.2"` and registered in `pipeline/bylaws/schema_validator.py` and `scripts/generate_models.py`.
