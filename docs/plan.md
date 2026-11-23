# Structured Building Bylaws — Phase 1 Plan

**Status:** Prototype · **Version of this plan:** 1.0 · **Date:** 23 November 2026

This document is the working plan for an agent (or developer) building Phase 1 of the project. It records every decision made so far, the rules the build must follow, the data model, the pipeline, the map workflow, the web app, and the milestones with acceptance criteria. Read it fully before starting work.

---

## 1. What we are building

Indian building regulations are spread across many authorities (national, state, planning authority, municipal), published as unstructured PDFs, and organised only by clause numbers like 1, 1.1, 1.3.2. Using them means reading and reconciling many documents by hand.

This project builds **a curated, versioned, machine-readable dataset of building bylaws**, where every clause is:

- structured (clause tree, tables as rows and columns),
- traceable to its source (document, page, version),
- labelled with its legal status (in force, draft, superseded),
- linked to the geographic area it governs (zone polygons on a map).

**The dataset is the product.** Tools like Docling, Marker, LLMWhisperer or Unstract are converters: a document goes in, structured output comes out, and nothing is kept. We use converters as replaceable components inside our pipeline. What we keep, maintain and publish is the data.

### Guiding principles

1. **Data first, tools second.** The pipeline must allow swapping any parser or model without changing stored data.
2. **The schema is the contract.** Schemas are versioned; breaking changes require a schema version bump and a migration.
3. **Provenance is mandatory.** No clause or zone exists without a source reference.
4. **In-force data is primary; drafts are separate.** The app must never present a draft as law.
5. **Data is released like software.** Each jurisdiction's data is published as numbered releases with a changelog.
6. **Nothing is jurisdiction-specific in code.** See Section 2.

---

## 2. Non-negotiable rules

These apply to every milestone. A pull request that breaks any of them is not done.

**R1 — No jurisdiction is hard-coded.**
- Every jurisdiction is defined by a config file in `jurisdictions/`. Adding a city means adding a config file, not changing code.
- No city name, URL, planning district number, zone code list, bounding box or coordinate appears in source code (`pipeline/` or `web/`), including as a default value.
- Every pipeline command takes `--jurisdiction <id>` as a **required** argument with no default.
- The web app discovers jurisdictions from `manifest.json` at runtime.
- Tests run against a **synthetic fixture jurisdiction** (Section 11), not real data.
- Bengaluru South (Section 4) is the **first example dataset**, nothing more.

**R2 — Provenance on everything.** Every clause records source document ID, page number(s), document version and verification state. Every zone polygon records source map, georeferencing run ID and verification state.

**R3 — Legal status is explicit.** Every document has a `legal_status` (`in_force`, `draft`, `superseded`, `withdrawn`). Drafts are stored and published separately from in-force data and are visibly labelled in the UI.

**R4 — Licensing hygiene.** This is a prototype, but avoid future rework:
- Do not copy code from AGPL-licensed projects (including Unstract and PyMuPDF) into this repository.
- Prefer permissively licensed dependencies (MIT, Apache-2.0, BSD).
- Before adding any dependency with GPL, AGPL or non-commercial terms (check Marker and MinerU specifically, including their model weights), record it in `docs/decisions/` with the reason.
- Record attribution requirements for data sources (e.g. OpenStreetMap's ODbL, OpenCity's stated licences) in `docs/data-sources.md`.

**R5 — Raw sources are immutable.** Downloaded files are never edited. Each is stored with its SHA-256 checksum, source URL and retrieval date.

**R6 — Reproducibility.** Every processed output can be regenerated from raw sources plus config by running the pipeline. Manual corrections are stored as separate, versioned override files, never as hand-edits to generated output.

---

## 3. Phase 1 scope

### Definition of done

A user opens the web app, chooses a jurisdiction, sees its zones on a map, clicks a zone and sees the bylaw clauses that apply there. Each clause shows its text, its source document, its legal status and a link to the exact page of the source PDF. A separate view lets the user browse the full clause tree and search it. A review view lets the project owner compare the original zoning map with the traced zones and mark each zone approved or needing a fix.

### In scope

- One jurisdiction (the example in Section 4), one building type (residential).
- Acquiring source PDFs and map files with checksums.
- Parsing PDFs to Markdown through a swappable parser adapter, with a comparison of at least two parsers.
- Building a JSON clause tree per document, validated against a JSON Schema.
- Recording amendment documents and linking their clauses to the clauses they amend.
- Boundary layers from existing digital data (KML → GeoJSON).
- Zone polygons produced by agent-driven georeferencing and colour-based extraction of the zoning map, with a verification report.
- Manually curated tagging of clauses to zone codes (as an override file).
- Publishing data files to Vercel Blob; a Next.js web app on Vercel.

### Out of scope for Phase 1

- Extracting computable rules (FAR, setback values as numbers with conditions). This is Phase 2.
- National and state layers (National Building Code, state fire rules).
- A database. Static JSON and GeoJSON files are enough.
- User uploads or running the pipeline on a server.
- Automatic consolidation of every amendment into a merged text (only where it is unambiguous; see Section 7.5).
- Accounts, authentication, payments.

---

## 4. First jurisdiction (example data only)

**Bengaluru South City Corporation**, restricted to **one RMP 2015 planning district**, residential use.

### Context the agent must understand

- In 2025 the BBMP was dissolved under the Greater Bengaluru Governance Act, 2024 and replaced by the Greater Bengaluru Authority (GBA) with five City Corporations (Central, North, South, East, West). Each corporation now has its own building bye-laws document.
- The 2026 corporation bye-laws are **amendments** to the BBMP Building Bye-laws 2003. The data model must hold the 2003 base document and the 2026 amendment as separate, linked documents.
- Land-use zoning and most development controls come from the **Revised Master Plan 2015 (RMP 2015)** of the Bangalore Development Authority: a Zoning Regulations document read together with planning district land-use maps. RMP 2015 remains the plan in force as of late 2026. RMP 2041 is in preparation; only a draft road grid for areas outside GBA has been published. The draft RMP 2031 was withdrawn and must not be used.
- A draft "Greater Bengaluru (Amendment) Regulations 2025" proposes changes to the RMP 2015 zoning regulations. It is a **draft**: store separately with `legal_status: draft`.

### Planning district selection (human checkpoint)

The target is a mostly residential planning district (Jayanagar area is the proposed candidate) that lies **entirely within the South City Corporation boundary**, so only one set of corporation bye-laws applies.

The agent must:
1. Download the RMP 2015 index map and identify candidate planning districts.
2. Note the known labelling error on OpenCity's index map: Planning District 204 should read "Benson Town", not "Jayanagar". Confirm district numbers from the map itself, not from listings.
3. Check containment against the South City Corporation boundary (Section 8.1).
4. Present the candidates with a containment check and a recommendation to the project owner, then wait for confirmation before proceeding past Milestone M5.

### Source documents

All URLs must be re-verified at acquisition time; record the actual URL used and the retrieval date. If a link is dead, search the same portal for the dataset by name and record the replacement.

| ID (suggested) | Document | Layer | Status | Source |
|---|---|---|---|---|
| `bbmp-bbl-2003` | BBMP Building Bye-Laws 2003 | Municipal (base) | In force as amended | OpenCity, Bengaluru group, dataset "BBMP: Building Bye-Laws 2003" |
| `bscc-bbl-amend-2026` | Bengaluru South City Corporation final building bye-laws (amendment) from 14.05.2026 | Municipal (amendment) | In force | https://data.opencity.in/dataset/bengaluru-city-corporations-bye-laws-2026 |
| `bscc-bbl-amend-2026-draft` | Draft Bengaluru City Corporation Building (Amendment) Bye-laws 2026, dated 01.04.2026 (South) | Municipal | Draft (superseded by final) | Same dataset as above |
| `bda-rmp2015-zr` | RMP 2015 Zoning Regulations | Planning | In force | https://data-opencity.sgp1.cdn.digitaloceanspaces.com/Documents/DocumentCloud/bda-zoning-regulations-rmp2015.pdf |
| `bda-rmp2015-maps` | RMP 2015 index map, planning district land-use maps | Planning (map) | In force | https://data.opencity.in/dataset/bda-revised-master-plan-2015 |
| `gb-amend-regs-2025-draft` | Draft Greater Bengaluru (Amendment) Regulations 2025 (amending RMP 2015 zonal regulations) | Planning | Draft | OpenCity, dataset of the same name |
| `gba-corp-boundaries-2025` | GBA Corporations Delimitation 2025 | Boundary | Current | OpenCity, Greater Bengaluru Authority organisation |
| `gba-wards-2025` | GBA Wards Delimitation 2025 (KML) | Boundary | Current | OpenCity, Greater Bengaluru Authority organisation |
| `ksrsac-landuse` | Bengaluru Urban Land Use Maps (2011, 2017), KML | Existing land use (reference only, NOT zoning) | Reference | OpenCity, BDA organisation |

Notes:
- The KSRSAC land-use maps show **existing** land use, not legal zoning. Use them only for cross-checking (Section 8.4), never as the zone layer.
- OpenCity may block automated scraping of its HTML pages. Prefer direct resource download URLs (CKAN `/download/` links or the CDN). If downloads are blocked, stop and ask the project owner to download the files manually into `data/raw/`.

---

## 5. Architecture

Two halves, deliberately separated:

```
┌────────────────────────────── LOCAL (Python) ───────────────────────────────┐
│                                                                             │
│  jurisdictions/*.yaml ──► acquire ──► parse ──► structure ──► validate      │
│                              │          (adapter)     │            │        │
│                              ▼                         ▼            ▼        │
│                         data/raw/            data/interim/   data/processed/ │
│                                                                             │
│  map: boundaries ──► georeference ──► extract zones ──► verify ──► publish  │
│                                                                    │        │
└────────────────────────────────────────────────────────────────────┼────────┘
                                                                     ▼
                                                    Vercel Blob (JSON, GeoJSON,
                                                    manifest, map images)
                                                                     │
                                                                     ▼
                                                 Next.js app on Vercel (read-only)
```

- **Pipeline (Python, runs locally).** Parsing models are too heavy and slow for serverless functions. The pipeline runs on a laptop (later: a server or CI job) and produces finished files.
- **Web app (Next.js on Vercel).** Only reads published files and displays them. No processing.
- **Storage.** Vercel Blob for published data. Source PDFs stay local in `data/raw/` (gitignored); the app links to the original public source URL with a page anchor.

---

## 6. Repository structure

```
bylaws/
├── README.md
├── docs/
│   ├── plan.md                    # this document
│   ├── data-sources.md            # licences and attribution for every source
│   ├── schema.md                  # human-readable explanation of the schemas
│   └── decisions/                 # short decision records (parser choice, licences…)
├── jurisdictions/
│   ├── _fixture-test.yaml         # synthetic jurisdiction used by tests
│   └── in-ka-bengaluru-south.yaml # first example jurisdiction
├── schemas/                       # JSON Schemas (versioned)
│   ├── jurisdiction.schema.json
│   ├── document.schema.json
│   ├── clause-tree.schema.json
│   ├── zones.schema.json          # properties required on zone features
│   ├── overrides.schema.json
│   └── manifest.schema.json
├── pipeline/
│   ├── pyproject.toml             # managed with uv; lockfile committed
│   ├── bylaws/
│   │   ├── cli.py                 # entry point: `bylaws <command> --jurisdiction <id>`
│   │   ├── config.py              # loads and validates jurisdiction configs
│   │   ├── acquire.py             # download, checksum, registry
│   │   ├── parsers/
│   │   │   ├── base.py            # ParserAdapter interface
│   │   │   ├── docling_adapter.py
│   │   │   └── …                  # other adapters (marker, llmwhisperer API…)
│   │   ├── compare.py             # parser comparison report
│   │   ├── structure.py           # Markdown → clause tree
│   │   ├── amendments.py          # link amendment clauses to targets
│   │   ├── overrides.py           # apply manual corrections and zone tags
│   │   ├── validate.py            # schema + quality checks
│   │   ├── geo/
│   │   │   ├── boundaries.py      # KML → GeoJSON, clipping
│   │   │   ├── rasterize.py       # PDF map page → image
│   │   │   ├── gcp.py             # ground control point finding + geocoding
│   │   │   ├── georef.py          # GDAL transform, error metrics
│   │   │   ├── zones.py           # colour segmentation → polygons
│   │   │   └── verify.py          # overlays, cross-checks, report
│   │   └── publish.py             # build manifest, upload to Blob
│   └── tests/
│       ├── fixtures/              # synthetic PDF, map image, boundary
│       └── …
├── data/                          # NOT committed except overrides and reports
│   ├── raw/<jurisdiction>/        # original files + .meta.json (gitignored)
│   ├── interim/<jurisdiction>/    # parser Markdown, intermediate images (gitignored)
│   ├── processed/<jurisdiction>/  # generated JSON/GeoJSON (gitignored)
│   ├── overrides/<jurisdiction>/  # manual corrections, zone tags (COMMITTED)
│   └── reports/<jurisdiction>/    # QA and verification reports (COMMITTED)
└── web/
    ├── package.json
    ├── app/
    │   ├── page.tsx               # jurisdiction picker (from manifest)
    │   └── j/[id]/
    │       ├── page.tsx           # map + clause panel
    │       ├── clauses/page.tsx   # clause tree browser + search
    │       └── review/page.tsx    # map review: source map vs traced zones
    ├── components/
    │   ├── ZoneMap.tsx
    │   ├── ClausePanel.tsx
    │   ├── ClauseTree.tsx
    │   ├── StatusBadge.tsx        # in force / draft / superseded
    │   └── ReviewPanel.tsx
    └── lib/data.ts                # fetch manifest and files from Blob
```

---

## 7. Data model

All files are JSON (UTF-8) except geometry, which is GeoJSON (WGS84, EPSG:4326). Each schema has a `schema_version` field. Field names below are the contract; the agent writes matching JSON Schemas in `schemas/`.

### 7.1 Jurisdiction config (`jurisdictions/<id>.yaml`)

IDs are lowercase, hyphenated and hierarchical: `<country>-<state>-<area>`.

```yaml
id: in-ka-bengaluru-south
name: Bengaluru South City Corporation (example)
country: IN
state: KA
building_types: [residential]
parents: []                      # Phase 1: none modelled; later in, in-ka …
documents:
  - id: bbmp-bbl-2003
    title: BBMP Building Bye-Laws 2003
    issuing_authority: Bruhat Bengaluru Mahanagara Palike
    layer: municipal              # national | state | planning | municipal
    legal_status: in_force
    role: base                    # base | amendment | regulation
    source_url: <verified URL>
  - id: bscc-bbl-amend-2026
    title: Bengaluru South City Corporation Building (Amendment) Bye-laws 2026
    layer: municipal
    legal_status: in_force
    role: amendment
    amends: [bbmp-bbl-2003]
    effective_from: 2026-05-14
    source_url: <verified URL>
  # … remaining documents from Section 4
maps:
  boundaries:
    - id: gba-corp-boundaries-2025
      source_url: <verified URL>
      select: { property: <field>, equals: <value identifying South> }
  zoning:
    - id: bda-rmp2015-pd-<number>
      document: bda-rmp2015-maps
      page: <page in PDF>
      planning_district: <number>
      legend_page: <page or null>
```

The config loader validates against `jurisdiction.schema.json` and fails loudly on missing fields. Code never assumes any value from this file.

### 7.2 Document record (`data/raw/<jurisdiction>/<doc_id>.meta.json`)

| Field | Meaning |
|---|---|
| `doc_id` | Stable ID from the config |
| `title`, `issuing_authority`, `layer`, `role` | From config |
| `legal_status` | `in_force` · `draft` · `superseded` · `withdrawn` |
| `notified_date`, `effective_from` | ISO dates if known, else null |
| `amends`, `supersedes` | Lists of doc IDs |
| `source_url` | URL actually used |
| `retrieved_at` | ISO timestamp |
| `sha256`, `bytes`, `page_count` | File facts |
| `is_scanned` | Whether OCR was needed (detected) |

### 7.3 Clause tree (`data/processed/<jurisdiction>/documents/<doc_id>.clauses.json`)

```json
{
  "schema_version": "1.0",
  "doc_id": "bda-rmp2015-zr",
  "jurisdiction": "in-ka-bengaluru-south",
  "legal_status": "in_force",
  "generated": {
    "parser": "docling",
    "parser_version": "<version>",
    "pipeline_version": "<git sha>",
    "generated_at": "<iso timestamp>"
  },
  "clauses": [
    {
      "clause_id": "bda-rmp2015-zr:4.2.1",
      "number": "4.2.1",
      "title": "Setbacks",
      "level": 3,
      "parent_id": "bda-rmp2015-zr:4.2",
      "order": 12,
      "text": "Original clause text, unchanged …",
      "tables": [
        {
          "table_id": "bda-rmp2015-zr:4.2.1:t1",
          "caption": "…",
          "headers": ["…"],
          "rows": [["…"]],
          "page": 41
        }
      ],
      "pages": [41, 42],
      "cross_references": ["bda-rmp2015-zr:2.3"],
      "amended_by": [],
      "applies_to_zones": [],
      "verification": "machine_checked"
    }
  ]
}
```

Rules:
- `clause_id` = `<doc_id>:<number>`. It must be stable across re-runs. Unnumbered blocks (preambles, notes) get IDs like `<doc_id>:_preamble` or `<parent>:_note1`.
- `text` is the source text, not a summary or paraphrase. Whitespace normalisation is allowed; wording changes are not.
- `verification` is one of `unverified`, `machine_checked`, `human_verified`.
- Tables are always captured as structured rows in addition to appearing in the parse output. Most numeric controls (setbacks, FAR, coverage, parking) are in tables.
- `applies_to_zones` is filled only from the overrides file in Phase 1 (Section 7.6).

### 7.4 Zones (`data/processed/<jurisdiction>/zones.geojson`)

A GeoJSON FeatureCollection. Each feature's `properties`:

| Property | Meaning |
|---|---|
| `zone_id` | Unique ID, e.g. `<map_id>:z0042` |
| `zone_code` | Code from the map legend (e.g. `R`, `C3`, `T1`) as printed on the source map |
| `zone_label` | Legend text for that code |
| `source_map` | Map ID from config |
| `georef_run` | ID of the georeferencing run that produced it |
| `extraction_method` | `colour_segmentation` · `road_outline_fallback` · `manual` |
| `area_sq_m` | Computed area |
| `verification` | `unverified` · `machine_checked` · `human_verified` · `rejected` |
| `notes` | Free text from review |

Also published: `boundary.geojson` (the jurisdiction's outer boundary) and `planning_districts.geojson` if available.

Zone codes are read from the legend of the source map, never from a list in code.

### 7.5 Amendments

Amendment documents are parsed into their own clause trees like any other document. Additionally, `amendments.py` detects amendment instructions (patterns such as "for clause X, the following shall be substituted", "after clause X, insert", "clause X shall be omitted") and writes `data/processed/<jurisdiction>/amendments.json`:

```json
{
  "schema_version": "1.0",
  "links": [
    {
      "amending_clause": "bscc-bbl-amend-2026:3",
      "target_clause": "bbmp-bbl-2003:6.1",
      "action": "substitute",
      "confidence": "high",
      "verification": "unverified"
    }
  ]
}
```

`action` is one of `substitute`, `insert_after`, `insert_before`, `omit`, `modify`. The target clause's `amended_by` lists amending clause IDs. In Phase 1, do not produce a merged "consolidated" text automatically; the UI shows the original clause with its amendments beside it. Low-confidence links are listed in the QA report for human review.

### 7.6 Overrides (`data/overrides/<jurisdiction>/*.yaml`, committed)

Manual corrections that the pipeline applies on every run, so generated files are never hand-edited.

```yaml
schema_version: "1.0"
clause_fixes:
  - clause_id: bda-rmp2015-zr:4.2.1
    field: title
    value: "Setbacks"
    reason: "Parser merged heading with previous line"
zone_tags:
  - clause_id: bda-rmp2015-zr:4.2.1
    zones: [R]
    reason: "Clause applies to residential main land use"
zone_fixes:
  - zone_id: bda-rmp2015-pd-xxx:z0042
    set: { zone_code: R, verification: human_verified }
```

### 7.7 Manifest (`manifest.json` at Blob root)

```json
{
  "schema_version": "1.0",
  "jurisdictions": [
    {
      "id": "in-ka-bengaluru-south",
      "name": "Bengaluru South City Corporation (example)",
      "latest_release": "0.1.0",
      "releases": [
        {
          "version": "0.1.0",
          "released_at": "<iso>",
          "files": {
            "documents": "<blob url>",
            "clauses": ["<blob url>", "…"],
            "amendments": "<blob url>",
            "zones": "<blob url>",
            "boundary": "<blob url>",
            "review_images": ["<blob url>"]
          },
          "drafts": { "clauses": ["<blob url>"] },
          "changelog": "…"
        }
      ]
    }
  ]
}
```

Drafts are listed under `drafts`, never mixed into the main `files`.

---

## 8. Pipeline stages

All commands: `bylaws <command> --jurisdiction <id>` (uv-managed Python, latest stable versions pinned in the lockfile at setup time).

### 8.1 `acquire`
- Download every document and map listed in the config into `data/raw/<jurisdiction>/`.
- Write a `.meta.json` per file (Section 7.2). Skip files whose checksum already matches.
- Convert boundary KML/KMZ to GeoJSON (GDAL `ogr2ogr` or a Python equivalent), select the jurisdiction's polygon using the config's `select` rule, write `boundary.geojson`.
- Respect site terms; identify the client with a descriptive User-Agent; no aggressive retries.

### 8.2 `parse`
- `ParserAdapter` interface: `parse(pdf_path) -> ParseResult` containing Markdown, a list of tables (structured), and per-block page numbers. Adapters must not leak parser-specific types.
- Default adapter: **Docling** (MIT). Enable OCR automatically for scanned pages.
- Additional adapters for the comparison: at least one of Marker or LLMWhisperer (hosted API; free tier of 100 pages/day; API key from environment variable, never committed). Licence notes per R4.
- Page images are rendered with a permissively licensed library (e.g. pypdfium2), not PyMuPDF (AGPL).
- Output: `data/interim/<jurisdiction>/<doc_id>.<parser>.md` plus `<doc_id>.<parser>.tables.json`.

### 8.3 `compare` (parser comparison)
Produce `data/reports/<jurisdiction>/parser-comparison.md` with, per parser per document:
- number of numbered clauses detected vs. clauses expected from the document's table of contents (if present),
- numbering continuity (gaps, duplicates, out-of-order numbers),
- tables detected and a sample of each rendered side by side with the page image,
- pages with empty or garbled text,
- runtime.

**Human checkpoint:** the project owner picks the parser per document (recorded in `docs/decisions/`).

### 8.4 `structure`
- Convert chosen parser output into the clause tree (Section 7.3).
- Primary method: deterministic rules — regex for clause numbers (`^\d+(\.\d+)*`, plus patterns used in the document such as "Article", "Chapter", roman numerals, `(a)`, `(i)`), heading levels, page tracking.
- Secondary method: an LLM may be used **only** to resolve ambiguous boundaries (e.g. where a clause starts) and must not rewrite text. Any LLM-touched clause is recorded in the QA report. The model provider is configurable via environment variables; no provider is hard-coded.
- Attach tables to the clause they appear in.
- Detect cross-references ("as per clause X", "under Article Y") into `cross_references`.

### 8.5 `amendments`
As in Section 7.5.

### 8.6 `apply-overrides`
Apply `data/overrides/<jurisdiction>/*.yaml`. Fail if an override references an ID that no longer exists (forces review after re-parsing).

### 8.7 `validate`
- Schema validation of every output file.
- Quality checks, written to `data/reports/<jurisdiction>/qa.md`:
  - numbering gaps and duplicates,
  - clauses with empty text or no page reference (must be zero),
  - every page of the source represented by at least one clause or explicitly marked as non-content (cover, index),
  - tables with ragged rows,
  - unresolved cross-references,
  - low-confidence amendment links,
  - drafts accidentally referenced from in-force data (must be zero).
- `validate` exits non-zero on hard failures.

### 8.8 `publish`
- Upload processed files and review images to Vercel Blob under `<jurisdiction>/<release>/…`.
- Update `manifest.json`. Releases are immutable; a fix is a new release.
- Token from `BLOB_READ_WRITE_TOKEN` environment variable.
- `--dry-run` flag lists what would be uploaded.

---

## 9. Zoning map workflow (agent-driven)

Goal: turn a scanned planning district land-use map (PDF without coordinates) into zone polygons with zone codes, plus evidence that the result is roughly right. Output accuracy target for the prototype is approximate (tens of metres), and the app must say so.

### 9.1 Rasterize (`geo/rasterize.py`)
- Render the map page to a high-resolution PNG (start at 300 DPI; increase if labels are unreadable).
- Crop the map frame from the legend and title block; save the legend crop separately.

### 9.2 Read the legend
- Identify each legend entry: colour swatch (sample the dominant colour), zone code and label.
- Write `data/interim/<jurisdiction>/<map_id>.legend.json`. Codes and labels come only from the legend.
- **Human checkpoint (light):** include the legend crop and parsed table in the verification report.

### 9.3 Ground control points (`geo/gcp.py`)
- Identify 15–25 well-distributed, unambiguous features on the map image: named road junctions, lake outlines, railway crossings, flyovers, large parks. Record their pixel coordinates.
- Find real-world coordinates for the same features using OpenStreetMap data (Nominatim for named places; Overpass API for junctions of named roads and water bodies). Follow their usage policies: max 1 request per second for Nominatim, descriptive User-Agent, cache results locally.
- Prefer road junctions found via Overpass (intersection of two named ways) over geocoded place names, which are less precise.
- Store GCPs with their source in `<map_id>.gcps.json`.

### 9.4 Georeference (`geo/georef.py`)
- Fit a transform with GDAL (first-order polynomial/affine first; try second-order only if there are ≥ 10 GCPs and residuals improve meaningfully).
- Use leave-one-out validation: drop each GCP, refit, measure its error. Discard GCPs with large residuals (likely mismatches) and refit.
- Metrics: RMSE in metres and maximum residual. **Acceptance threshold:** RMSE ≤ 30 m and no remaining GCP residual > 60 m. If not met after cleaning, report failure and stop for human input rather than proceeding.
- Output a georeferenced GeoTIFF and record a `georef_run` ID with metrics.

### 9.5 Extract zones (`geo/zones.py`)
- Primary method — colour segmentation:
  1. Convert to a perceptual colour space (e.g. CIELAB) and classify each pixel to the nearest legend colour within a tolerance; leave unmatched pixels unclassified.
  2. Remove printed text, road lines and hatching noise with morphological operations; fill small holes.
  3. Vectorise each class to polygons (e.g. rasterio features + shapely), simplify slightly, drop fragments below a minimum area (configurable, start around 200 m²).
  4. Clip to the jurisdiction boundary.
- Fallback — road outline method: if colour segmentation fails on parts of the map (faded scan, heavy overprinting), build blocks from OpenStreetMap road polygons within the area and assign each block the majority legend colour found inside it. Mark these features `extraction_method: road_outline_fallback`.
- Libraries: GDAL, rasterio, shapely, geopandas, OpenCV or scikit-image (all permissive).

### 9.6 Verify (`geo/verify.py`)
Write `data/reports/<jurisdiction>/map-verification.md` with:
- GCP table and residuals, RMSE, transform type.
- Overlay images: traced zones on OpenStreetMap; georeferenced source map at 50% opacity on OpenStreetMap.
- Coverage: share of the planning district area that received a zone code; share unclassified.
- Containment: zones outside the corporation boundary (should be ~0 after clipping) and whether the planning district is fully inside the corporation.
- Cross-check against KSRSAC existing land use: percentage of `R` zone area that is residential in existing land use. Large mismatches are flagged, not auto-corrected (zoning and existing use legitimately differ).
- List of zones with low confidence (small, irregular, fallback-derived).

### 9.7 Human review
The web app's review page (Section 10) shows the source map and traced zones side by side and in overlay. The owner marks zones approved or needing a fix; decisions are exported as YAML and committed to `data/overrides/<jurisdiction>/zones-review.yaml`, then applied by `apply-overrides`.

---

## 10. Web app

**Stack:** Next.js (App Router, TypeScript), Tailwind CSS, Leaflet via react-leaflet. Deployed on Vercel. Data read from Vercel Blob via the manifest.

**Base map:** OpenStreetMap tiles with attribution for the prototype (low traffic). Note: the OSM public tile server has a usage policy; switch to a provider before any real traffic.

### Pages
1. **`/` — Jurisdiction picker.** Lists jurisdictions from `manifest.json`. No jurisdiction is preselected or hard-coded.
2. **`/j/[id]` — Map and clauses.**
   - Map of zones coloured by `zone_code`, boundary outline, legend.
   - Click a zone → side panel lists clauses whose `applies_to_zones` includes that code, grouped by document and layer, each with a status badge, clause number, title, text, amendments shown alongside, and a "View source" link to the original PDF URL with `#page=N`.
   - Persistent banner: "Prototype. Zone boundaries are approximate and traced from scanned maps. Confirm with the planning authority."
   - Toggle to show draft documents (off by default; draft items visibly labelled).
3. **`/j/[id]/clauses` — Clause browser.** Collapsible tree per document; text search across clause numbers, titles and text; tables rendered as HTML tables.
4. **`/j/[id]/review` — Map review.** Source map image (from Blob) and the traced map side by side, plus an opacity slider overlay; click a zone to approve, reject or note; "Export review" downloads the YAML for `data/overrides/`. No server-side writes in Phase 1.

### Requirements
- Responsive (works on a phone), accessible colour choices with zone codes also shown as text.
- All data fetching goes through `lib/data.ts`; components never construct Blob URLs themselves.
- No API keys in the browser.

---

## 11. Testing and quality

- **Fixture jurisdiction** (`jurisdictions/_fixture-test.yaml`): a small synthetic PDF with numbered clauses, a table, an amendment document, a synthetic coloured "zoning map" image with a legend and known control points, and a simple boundary polygon. The full pipeline must run end to end on it in CI with no network access.
- **Unit tests:** config loading and validation; clause numbering parser; amendment pattern detection; override application; georeference error calculation; colour classification.
- **Golden tests:** for the fixture, expected clause tree and zone polygons are stored; tests compare outputs (with tolerances for geometry).
- **Static check for R1:** a test that scans `pipeline/` and `web/` source for strings found in non-fixture jurisdiction configs (names, URLs, district numbers) and fails if any appear.
- **Web:** type-check, lint, and a smoke test that the picker renders jurisdictions from a fixture manifest.
- **CI:** GitHub Actions running Python tests, schema validation and web checks on every push.

---

## 12. Hosting and environment

| Concern | Choice | Notes |
|---|---|---|
| Code | GitHub | Private or public, owner's choice |
| Web app | Vercel (Hobby plan for prototype) | Hobby is for non-commercial personal use; move to Pro if this becomes commercial |
| Data | Vercel Blob | Hobby includes about 1 GB storage per month; exceeding limits blocks access for 30 days, so do not store source PDFs there |
| Pipeline | Local machine | Python via uv; GDAL installed system-wide or via conda if wheels are problematic |
| Secrets | `.env` (gitignored) + Vercel project env vars | `BLOB_READ_WRITE_TOKEN`, optional `LLMWHISPERER_API_KEY`, optional LLM provider key |

Commit a `.env.example` listing variable names only.

---

## 13. Milestones

Each milestone ends with its acceptance criteria met and a short note in `docs/progress.md`.

**M0 — Scaffold**
- Repository structure from Section 6, uv project, Next.js app skeleton, CI running.
- ✅ `bylaws --help` works; `bylaws <cmd>` without `--jurisdiction` errors; CI green.

**M1 — Schemas, config loader, fixture**
- All JSON Schemas; config loader; fixture jurisdiction and fixture files; R1 static check.
- ✅ Fixture config validates; invalid configs fail with clear messages.

**M2 — Acquisition**
- `acquire` for fixture (local files) and the Bengaluru South config.
- Verify and record every URL in Section 4; fill config fields; write `docs/data-sources.md`.
- ✅ All raw files present with `.meta.json`; boundary GeoJSON for the corporation produced and viewable.

**M3 — Parsing and comparison**
- Docling adapter plus at least one alternative; `compare` report.
- ✅ Report generated for every document. **Checkpoint:** owner chooses parser(s).

**M4 — Structure, amendments, validation**
- Clause trees for all documents; amendment links; overrides mechanism; `validate` with QA report.
- ✅ Zero clauses without page references; numbering gaps explained or fixed via overrides; QA report committed. **Checkpoint:** owner spot-checks 20 random clauses against PDFs.

**M5 — Planning district selection and boundaries**
- Rasterize index map; identify candidate districts; containment check against corporation boundary.
- ✅ Recommendation presented. **Checkpoint:** owner confirms the planning district; config updated.

**M6 — Zoning map**
- Legend reading, GCPs, georeferencing, zone extraction, verification report.
- ✅ RMSE threshold met; ≥ 90% of the planning district area assigned a zone code; verification report committed.

**M7 — Zone tagging**
- Tag clauses from the RMP 2015 zoning regulations (and relevant bye-law clauses) to zone codes via overrides, starting with residential (`R`) and the zones present in the chosen district.
- ✅ Every zone code present on the map has at least one tagged clause, or is explicitly listed as "no specific clauses found".

**M8 — Publish and web app**
- `publish` to Blob; manifest; all four pages; deploy to Vercel.
- ✅ Definition of done (Section 3) demonstrably met on the deployed URL.

**M9 — Review and release 0.1.0**
- Owner reviews zones in the review page; overrides committed; republish as release 0.1.0 with changelog.
- ✅ Release 0.1.0 live; all zones either `human_verified` or `rejected` with notes.

---

## 14. Human checkpoints summary

| When | Decision |
|---|---|
| M2 | Download files manually if automated download is blocked |
| M3 | Parser choice per document |
| M4 | Spot-check of clauses against source PDFs |
| M5 | Confirm planning district |
| M6 | Intervene if georeferencing threshold not met |
| M9 | Approve or reject zones; approve release |

The agent must stop and ask at these points rather than guess.

---

## 15. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Source links change or portals block downloads | Record retrieval URL and checksum; manual download fallback; mirror nothing publicly without checking licence |
| Scanned PDFs with poor OCR | Compare parsers; OCR on; overrides for fixes; flag low-quality pages in QA |
| Amendments ambiguous or partial | Link only; no automatic consolidation; confidence levels; human review |
| Zoning map too degraded for colour segmentation | Road outline fallback; human review; mark approximate |
| Georeferencing error from wrong GCP matches | Leave-one-out validation; residual thresholds; stop on failure |
| Users treat prototype as legal advice | Persistent disclaimer; status badges; source links on every clause |
| Regulatory change during build (e.g. RMP 2041, new GBA amendments) | Versioned documents and releases; legal status field; re-run acquisition |
| Licence contamination | R4; decision records; avoid AGPL code |
| Vendor lock-in to a parser | Adapter interface; parser recorded per output, not assumed |

---

## 16. After Phase 1

- **Phase 2 — Computable rules.** Extract rules from clauses and tables into a rule schema: applicability conditions (zone, plot size, road width, height, use), parameter (FAR, coverage, setbacks, height, parking), value or lookup table, units, exceptions, source clause. Consider prompt-per-rule-type extraction with grounding to source spans (e.g. LangExtract), and a second-model verification pass (the idea behind Unstract's LLMChallenge, implemented independently). Answer queries like "maximum height for this plot".
- **Phase 3 — Scale.** More corporations and cities via new config files; state and national layers with explicit precedence rules; a spatial database (PostGIS) for plot-level queries; scheduled source monitoring for new notifications.
- **Phase 4 — Design checking.** Compare a building design (e.g. IFC/BIM) against the computable rules.

---

## 17. Reference: tools mentioned

| Tool | Use | Licence notes |
|---|---|---|
| Docling | Default PDF parser | MIT |
| Marker | Alternative parser | Check code and model-weight licence terms before adoption |
| MinerU | Alternative parser for difficult scans | Check licence (has been AGPL) |
| LLMWhisperer | Hosted parsing API (comparison only) | Proprietary service; free tier 100 pages/day; only the client is open source |
| Unstract | Design reference only (adapter pattern, prompt-per-field, dual-model checks) | AGPL-3.0 — do not copy code |
| LangExtract | Phase 2 grounded extraction | Check licence at adoption |
| pypdfium2 | Rendering PDF pages to images | Permissive |
| GDAL, rasterio, shapely, geopandas | Geospatial processing | Permissive |
| OpenCV / scikit-image | Image segmentation | Permissive |
| OpenStreetMap (Nominatim, Overpass, tiles) | Control points, overlays, base map | Data ODbL; follow usage policies; attribute |
| QGIS | Optional manual inspection by the owner | Not required by the pipeline |
| Next.js, Tailwind, Leaflet | Web app | Permissive |
| Vercel, Vercel Blob | Hosting and storage | Hobby plan limits apply |
