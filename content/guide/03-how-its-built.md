---
id: how-its-built
number: "03"
title: "How it's built"
kicker: "03 / Pipeline, Resolution, Map & AI"
audiences: [college, practitioner, developer]
diagrams: [data-layers, checks-pipeline]
screenshots: []
---

## Slide summary

Official PDFs pass through five deterministic layers — source register, verbatim structure, rules as data, six-step statutory resolution, and static web/AI endpoints — guarded by {{checks_per_build}} automatic build checks and double-keyed human verification.

## Presenter notes

How do we turn scanned and digital government PDFs into a trustworthy code? Every release passes through five layers. First, the source register acquires each official PDF with its SHA-256 digest, Wayback Machine snapshot, and quoted commencement evidence. Second, the structure stage builds a faithful hierarchy of {{provisions}} active provisions with tables as structured rows and keeps editorial summaries strictly separate in `notes_by_site`. Third, parameter extraction turns tables into {{rules_as_data}} active condition-bearing records with cell-level provenance. Fourth, a stated six-step statutory order settles overlaps across instruments while keeping older rules visible. Fifth, the build publishes the web reader, the 8-layer Protomaps/MapLibre map, and machine-readable endpoints (`/llms.txt`, `.md` pages, `/api/v1/` OpenAPI 3.1 JSON). Every build runs {{checks_per_build}} automatic verification suites, and records become "Verified by a person" only after two independent workshop Match verdicts.

## Reading version

Bylaw One processes official regulations through seven verifiable stages:

- **Sources:** Each of the `{{registered_sources}}` registered sources (`{{documents_in_force}}` in force) carries an HTTP retrieval record, SHA-256 checksum, Wayback Machine archive link, explicit `instrument_type`, and quoted status evidence.
- **Structure:** `{{provisions}}` active provisions are structured in the law's own hierarchy (`max depth <= 6`) with Akoma Ntoso `eid` addresses and table rows. Site explanations live in separate `notes_by_site` fields so verbatim legal text is never altered.
- **Rules as data:** Development-control tables are extracted into `{{rules_as_data}}` active parameter records (`{{total_parameters}}` total) across 10 parameter kinds with normalized units (`m`, `m²`, `%`), numeric intervals, and cell-level page citations.
- **Settling overlaps:** When instruments overlap, a stated six-step statutory order decides: (1) drafts never apply; (2) corporation amendments apply within that corporation; (3) the enabling Act prevails (`Section 230`); (4) Bye-law `1.4` hands zoning parameters to the Master Plan; (5) a later in-force amendment supersedes an earlier one; (6) unresolved ties are shown side by side as **not settled**.
- **Checks (`{{checks_per_build}}` per build):** Every build checks text fidelity against stored PDF page text (`data/page_text/`), hierarchy depth, parameter plausibility bounds, table band continuity (`3.1(ii)` and `3.1(iii)` for the `11.5 m–12 m` setback band), 5-corporation parity, map street-offset (`~{{road_median_offset_m}}` median, `~{{road_p90_offset_m}}` 90th-percentile), R15/R16 provenance, plain-language gates, permissive licences (`gitleaks` + Rule R4), and WCAG 2.2 AA / page budgets. Two independent human `Match` verdicts are required before a record is marked `Verified by a person`.
- **The map:** Built with MapLibre GL JS and `@protomaps/basemaps` (`light`) over `basemap.pmtiles`, layering `{{active_zones}}` land-use zone polygons (`{{processed_sheets}}`, `{{map_coverage_pct}}` of Greater Bengaluru), a diagonal hatch over uncovered areas, planning districts, `{{wards}}` wards, `{{corporations}}` corporations, and derived lake buffers.
- **Machines and AI:** Today the site publishes `/llms.txt`, `/llms-full.txt`, `.md` mirrors for every document, subject, and provision page, a static JSON API at `/api/v1/` (`openapi.json`), `schema.org/Legislation` JSON-LD, `datapackage.json`, and `/updates.xml`.
