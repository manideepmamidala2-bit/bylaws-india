# Structured Building Bylaws — Plan v1.1: Next Phase

**Date:** 23 November 2026 · **Covers:** milestones M1.5, M2 and M3 · **Builds on:** Plan v1.0 and the audit at commit `8d868da`

This plan is the working instruction set for the next phase. It is self-contained for the work it covers. Where it changes Plan v1.0, the change is listed in Section 2 and **this document wins**. Everything in Plan v1.0 that is not changed here still applies (rules R1–R6, data model, pipeline stages, map workflow, later milestones).

---

## 1. Where we are and what this phase does

M0 (scaffold) and M1 (schemas, config loader, fixture) are complete and CI is green. The audit found that nothing downstream of configuration does anything yet: all pipeline stages are stubs that report success, and the web app renders hard-coded empty lists against a manifest whose files do not exist. Plan v1.0 put the first visible output at M8, which made progress impossible to see or steer.

This phase fixes that order. It:

1. makes unbuilt code fail loudly and removes two fallbacks that break the project's own rules;
2. fixes structural problems in the codebase while they are still cheap;
3. runs the synthetic fixture through every stage with simple tools, so the app shows real (synthetic) output;
4. rebuilds the interface in the dg2n idiom;
5. sets the project up as **open data**;
6. checks the real Bengaluru documents early, then acquires and parses them (M2, M3).

From the end of this phase on, every milestone replaces a simple stage with a better one, and its effect is visible on screen the same day.

### Definition of done for this phase

- The fixture jurisdiction runs from `acquire` to `publish` offline with one command, and all published files exist.
- All four app pages, plus a new Data page, render fixture data in the new design, with zone polygons on a real Leaflet map.
- No unbuilt stage can report success; the two fallbacks are gone.
- The repository is publicly licensed as open data and open code, and each data release is downloadable.
- Bengaluru South sources are acquired with checksums and verified legal status; the corporation boundary appears on the map.
- A parser comparison report exists for every Bengaluru document, and the owner has chosen a parser per document.

---

## 2. Decisions and changes since Plan v1.0

| # | Change | Replaces / affects |
|---|---|---|
| D1 | **The project is open data.** Data under CC BY 4.0, code under Apache-2.0, public repository. | R4, Section 12 |
| D2 | **No permissive-licence exceptions.** No GPL, AGPL or non-commercial dependencies or model weights, at runtime or in published outputs. Marker and MinerU are removed from the parser comparison. | R4, Section 8.2, Section 17 |
| D3 | **No "prototype" wording anywhere in the interface or display names.** The accuracy disclaimer stays, reworded (Section 8.6). | Section 10 |
| D4 | **Vertical slice (M1.5) inserted before M2.** | Section 13 |
| D5 | **Clause citations carry the position on the page** (a bounding box), not just the page number. | Section 7.3 |
| D6 | **Verified records are never edited.** A change to a `human_verified` clause or zone creates a new record that supersedes it. | Sections 7.3, 7.4, 7.6 |
| D7 | **Each jurisdiction declares its own gaps** in a `declarations.json` (what is not modelled, known gaps, newer documents not yet read). | Section 7 |
| D8 | **Zones can be imported** from an existing GIS file as well as traced from a scan. | Sections 7.1, 9 |
| D9 | **Source list corrected**: the July 2025 and 11.11.2025 amendments to the RMP 2015 zonal regulations are in force, not drafts. | Section 4 |
| D10 | **Home page is a search box** with type-ahead; no default map. | Section 10 |
| D11 | **A coverage note** on each area page replaces the prototype label. | Section 10 |
| D12 | **A Data page** offers release downloads, licence and citation. | Section 10 |
| D13 | **Phase 2 rule format will be compatible with Indicodes Rules** (Section 10 of this plan). | Section 16 |
| D14 | **Allmaps** is the default for the map review overlay and manual georeferencing fallback in M6, subject to licence check. | Section 9 |

---

## 3. Non-negotiable rules (restated with changes)

R1–R6 from Plan v1.0 still apply. Changed or added:

**R4 (replaced) — Licences.**
- Code: Apache-2.0 (`LICENSE`). Data: CC BY 4.0 (`LICENSE-DATA.md`).
- Every dependency, model and service must allow use in an open, permissively licensed project, including commercial reuse by others. No GPL, AGPL, or non-commercial licences, including model weights.
- Hosted services (e.g. LLMWhisperer) may be used as tools if their terms allow publishing the outputs; record this in `docs/decisions/`.
- Every new dependency is listed with its licence in `docs/dependencies.md`. CI fails if a dependency with a disallowed licence appears (use a licence checker for Python and npm).
- Data sources and their licences or terms are listed in `docs/data-sources.md`, with required attribution.

**R7 (new) — Fail loudly.** Any command, stage or loader that is not implemented, or that cannot produce its output, exits non-zero with a clear message. Nothing reports success it has not earned.

**R8 (new) — No defaults that strengthen a claim.** Missing data is shown as missing. A clause without a legal status is "status unknown", never "in force". A clause without a page has no source link, never a link to page 1. Upstream validation must make both cases fail before publishing.

**R9 (new) — Verified data is immutable.** See D6.

---

## 4. Open data setup

- **Repository:** public on GitHub.
- **Files at the root:** `LICENSE` (Apache-2.0), `LICENSE-DATA.md` (CC BY 4.0, with attribution text "Structured Building Bylaws" and a note that source texts are government publications), `CONTRIBUTING.md` (how to report an error, propose a correction, review a clause or zone), `CODE_OF_CONDUCT.md`, `CITATION.cff`.
- **Releases:** each data release is published in two places:
  1. Vercel Blob, for the app;
  2. a GitHub Release with a zip of the release files, a `SHA256SUMS` file and the changelog, so anyone can download the data without the app.
- **Source PDFs:** not redistributed in this phase. The data links to the original public source URL with a page anchor. (Redistributing page extracts can be decided later, after checking each source's terms.)
- **Attribution:** OpenStreetMap (ODbL) for base map and control points; OpenCity and each issuing authority for source documents. Shown in the app footer and on the Data page.
- **Credit for design ideas:** `docs/decisions/` records that citation-with-position, immutable verified records and self-declared gaps follow practices from Indicodes Rules (github.com/indicodes-in/rules). No code or data is copied from it in this phase.

---

## 5. Milestone M1.5 — Make it real, end to end

M1.5 has five steps. S0 can run in parallel with S1–S2.

### S0 — Real-document reconnaissance (0.5 day)

Purpose: measure the biggest unknowns before investing in tools.

- Download the Bengaluru South documents listed in Section 7 (manually if automated download is blocked) into `data/raw/` locally. Do not process them further yet.
- For each PDF, report: page count, whether pages contain a text layer or need OCR (sample every 10th page), presence of tables, languages present, and obvious problems (rotated pages, two-column layouts, stamps over text).
- For the RMP 2015 land-use map sheet that likely covers Jayanagar and the index map: render at 300 DPI and report image resolution, whether legend colours are visually distinct, how much text and hatching overprints the colours, and whether named roads and junctions are readable.
- Output: `data/reports/in-ka-bengaluru-south/recon.md` with sample images.
- **Checkpoint (light):** owner reads the report. If the map is too degraded for colour segmentation, M6 plans start from the fallback method.

✅ `recon.md` committed with findings for every document and the map sheet.

### S1 — Fail loudly and remove the fallbacks (0.5 day)

- Every stub stage exits with a non-zero code and the message `not implemented: <stage>`. Replace the parametrised test that asserts stubs exit 0 with one that asserts they exit non-zero until implemented.
- `validate` must not print "valid" for checks it has not run. It reports exactly which checks ran.
- Remove the in-force fallback in `ClausePanel` and `ClauseTree`: render a `STATUS UNKNOWN` tag (Section 8.4).
- Remove the page-1 fallback in `ClausePanel`: if a clause has no page, show "No source page recorded" and no link.
- Add schema rules so that `legal_status` and at least one citation page are required on every clause; `validate` fails otherwise.

✅ Calling any unbuilt stage fails CI; tests cover both removed fallbacks.

### S1b — Structural fixes (1 day)

- **One source for the data model.** JSON Schemas in `schemas/` are the single source. Generate Pydantic models (e.g. `datamodel-code-generator`) into `pipeline/bylaws/models/_generated.py` and TypeScript types (e.g. `json-schema-to-typescript`) into `web/lib/types/generated.ts`. Add `make generate` (or an equivalent script) and a CI check that fails if generated files are out of date. Hand-written models and interfaces are deleted. Strictness the loader needs (forbid unknown fields) is expressed in the schemas (`additionalProperties: false`).
- **Remove the fixture literal from schema ID patterns.** Rename the fixture jurisdiction to an ID that matches the normal pattern (e.g. `xx-test-fixture`, using a country code that cannot be real) and drop every special case for `_fixture-test`. Update the R1 static check accordingly.
- **Dependencies:** move `fpdf2` to dev dependencies.
- **Repository root:** stop resolving paths relative to the package file. Resolve the project root from a `--root` option, then the `BYLAWS_ROOT` environment variable, then by searching upward from the current directory for a marker file (e.g. `bylaws.toml`). Fail with a clear message if none is found.
- **Python version:** pin one version in `.python-version` and `pyproject.toml` and use it in CI (3.12 unless all dependencies support a newer one; record the choice).
- **`run-all` command:** `bylaws run-all --jurisdiction <id>` runs every stage in order and stops at the first failure, printing which stage failed.
- **Licence check in CI** (R4).

✅ CI green with generated types; no fixture literal in schemas; `run-all` exists (and fails at the first unbuilt stage).

### Schema changes in this phase (do with S1b)

Bump `schema_version` to `1.1` in all schemas and update fixtures.

**Clause record (`clause-tree.schema.json`):**
- Replace `pages` with `citations`, a non-empty list:
  ```json
  "citations": [
    { "doc_id": "fixture-base-2020", "page": 2,
      "bbox": [0.12, 0.31, 0.88, 0.44],
      "text_excerpt": "first few words of the clause as printed" }
  ]
  ```
  `bbox` is `[x0, y0, x1, y1]` as fractions of page width and height (top-left origin), nullable only when the parser cannot provide positions; `validate` reports the share of clauses without a bbox.
- Add `record_id` (unique per version of a clause) alongside `clause_id` (stable across versions), plus `supersedes` and `superseded_by` (record IDs or null).
- `legal_status` copied onto each clause from its document, required.

**Zone feature properties (`zones.schema.json`):** add `record_id`, `supersedes`, `superseded_by`; add `extraction_method: "imported"` as an allowed value; add `source_attribution` (required when imported).

**Overrides (`overrides.schema.json`):** an override that targets a `human_verified` record must produce a new record that supersedes it, never modify it in place. `apply-overrides` enforces this.

**New: `declarations.schema.json`**, one file per jurisdiction release:
```json
{
  "schema_version": "1.1",
  "jurisdiction": "xx-test-fixture",
  "not_modelled": ["Fire safety requirements of the National Building Code"],
  "known_gaps": [{ "doc_id": "…", "description": "Pages 40–42 illegible in source scan" }],
  "unread_documents": [{ "title": "…", "source_url": "…", "reason": "Published after this release" }]
}
```

**Document record:** add `status_evidence` (URL and short description of what shows the legal status, e.g. the notification) and `licence_or_terms`.

**Jurisdiction config:** zoning maps may be `kind: traced` (scan to be georeferenced, as in Plan v1.0) or `kind: imported` (an existing GIS file with a field mapping to `zone_code`).

**Manifest:** each release gets `licence`, `download_zip`, `sha256sums`, `declarations` URL and `changelog`.

### S2 — Fixture vertical slice (3–4 days)

Run the fixture through every stage with the simplest permissive tools. Each stage written here is a real implementation, later improved or swapped, not a throwaway.

- **acquire:** copies fixture files from `pipeline/tests/fixtures/` (config `source_url` may be a `file://` path), writes `.meta.json` with SHA-256; converts the KML boundary to GeoJSON.
- **parse:** `pypdfium2` text adapter implementing `ParserAdapter`. Extracts text per page with character positions, so blocks carry page and bbox. No tables from this adapter (report "tables not supported by this adapter").
- **structure:** deterministic regex clause detection (numbers such as `1`, `1.2`, `1.2.3`, plus `(a)` and `(i)` sub-items), parent and order, citations with page and bbox, cross-reference detection.
- **amendments:** pattern detection for substitute / insert / omit instructions on the fixture amendment, with confidence.
- **apply-overrides:** implemented including the supersede rule (R9).
- **validate:** schema validation plus QA checks from Plan v1.0 Section 8.7, plus: every clause has `legal_status`; every clause has at least one citation with a page; share of citations with bbox; drafts never referenced from in-force data. Writes `qa.md`.
- **geo:** implement the `imported` path only: read a GeoJSON or shapefile declared in config, map fields to `zone_code`, reproject to WGS84, clip to boundary, validate geometry, set `extraction_method: imported`. The fixture provides a small imported zones file. (The `traced` path stays not-implemented until M6, and says so.)
- **declarations:** generated from config plus QA results (e.g. pages with no clauses become `known_gaps`).
- **publish:** writes the release to a data directory chosen by `DATA_TARGET`:
  - `local` → `web/public/data/<jurisdiction>/<release>/` and `web/public/data/manifest.json` (used for the fixture and local development);
  - `blob` → Vercel Blob (used for real releases);
  - in both cases also builds the release zip and `SHA256SUMS`.
- **Golden tests:** the fixture's clause tree, amendments, zones and declarations are stored as expected outputs; tests compare (geometry with tolerance).

✅ `bylaws run-all --jurisdiction xx-test-fixture` succeeds offline; every file listed in the manifest exists; golden tests pass.

### S3 — Data wiring and architecture (2 days)

- **Data client** (`web/lib/data.ts`): loaders for manifest, document list, clause trees, amendments, zones, boundary and declarations. The base URL comes from `NEXT_PUBLIC_DATA_BASE_URL` (local `/data` or the Blob URL). Components never construct URLs.
- **Server components and static generation:** read the manifest at build time; pre-render each jurisdiction's pages for its latest release (`generateStaticParams`). Only the map and interactive panels are client components.
- **Freshness:** publishing a new release must update the site without manual steps. `publish --target blob` calls a Vercel deploy hook (URL in `VERCEL_DEPLOY_HOOK_URL`) after uploading. Also set time-based revalidation on the manifest as a safety net.
- **Map:** use Leaflet through `react-leaflet` pinned to a **stable** release compatible with React 19 (no release candidates), loaded with `next/dynamic` and server rendering off. Render boundary and zones from GeoJSON.
- **Page titles** use the jurisdiction's display name, never its ID.

✅ All pages render fixture data; polygons appear on a real map; a publish to a preview environment triggers a rebuild that shows the new release.

### S4 — Interface rebuild in the dg2n idiom (3 days)

Design direction: near-monochrome and typographic; hierarchy from type and rules, not boxes and colour (audit Figure 2).

**Tokens** (Tailwind v4 theme block; fonts via `next/font`, all under the SIL Open Font Licence):

| Token | Value |
|---|---|
| paper / panel | `#f5f3ed` / `#efeee8` |
| ink / muted | `#080909` / `#5b5e56` |
| hairline | `#c8ccc0` |
| accent (one use only: selection) | `#ff6b52` |
| display | Inter Tight, letter-spacing −0.05em |
| reading (clause text) | Source Serif 4 |
| labels | JetBrains Mono, capitals |

**Corrections to the audit's direction (required):**
- The coral accent is used **only for the selected zone and selected clause**. It is not used for drafts.
- **Coral is never used for text.** Coral `#ff6b52` on paper is about 2.5:1 contrast, below the 4.5:1 needed for small text. Use it for fills, outlines and dots only.
- **Status tags** (mono, capitals, ink text):
  - `IN FORCE` — solid ink outline;
  - `DRAFT` — dashed ink outline;
  - `SUPERSEDED` — struck through, muted;
  - `STATUS UNKNOWN` — dotted outline with a short explanation on hover/tap.
- **Zones** are told apart by tone and hatch pattern **and** by the zone code printed inside each polygon (required, not optional), so the map works in greyscale and when there are more zone codes than patterns.
- All text meets WCAG AA contrast; an automated accessibility check (e.g. axe) runs in CI on each page.

**Primitives** (cover every page): running head, mono label, status tag, ruled table, pill (toggles only). No cards, no shadows, square corners.

**Content rules:** clause numbers in mono, leading each entry; clause text in serif; tables ruled; no em dashes in interface strings.

**Pages:**
1. **Home (`/`):** search box with type-ahead over jurisdictions from the manifest (name, ID, aliases from config). Selecting a result opens the area page. No map on the home page.
2. **Area (`/j/[id]`):** map (boundary, zones, legend from source map) and clause panel. Clicking a zone lists clauses tagged to its code, grouped by document and layer, with status tags, amendments beside the clause they change, and "View source p. N" linking to the source PDF at that page. Drafts hidden by default behind a toggle and labelled when shown.
3. **Clauses (`/j/[id]/clauses`):** collapsible tree using `level` and `parent_id`, all collapsed except the first level; search with highlighted matches; tables ruled.
4. **Review (`/j/[id]/review`):** source map image and traced zones side by side and as an overlay with a working opacity slider; approve / reject / note per zone; "Export review" downloads YAML for `data/overrides/`. (Image warping arrives with M6.)
5. **Data (`/data`):** for each jurisdiction and release: release date, changelog, download zip, checksums, licence (CC BY 4.0), how to cite, source documents with their status, and the declarations (what is not covered).

**Notices (replacing the prototype label):**
- Accuracy strip on the area and review pages (mono, ink, small coral dot):
  `ZONE BOUNDARIES ARE TRACED FROM SCANNED MASTER PLAN MAPS AND ARE APPROXIMATE. CONFIRM A PLOT'S ZONE WITH THE PLANNING AUTHORITY.`
  For imported zones, the wording names the source instead of "traced from scanned maps".
- Coverage note on the area page, generated from `declarations.json`: which layers are included (e.g. municipal bye-laws, master plan zoning regulations) and which are not.
- Footer: licences and attribution.
- Remove "(example)" from jurisdiction display names in configs.

✅ Owner signs off the look; accessibility check passes; no "prototype" string anywhere in `web/` or in jurisdiction display names (add to the R1 static check).

---

## 6. Milestone M2 — Acquisition (2–3 days)

As Plan v1.0 Section 8.1, plus:

- Use the source list in Section 7. **Verify each document's legal status at acquisition** and record `status_evidence`. Do not trust the table in this plan if the source says otherwise; report differences.
- Record `licence_or_terms` for every source.
- Convert the GBA corporation and ward boundaries to GeoJSON; select Bengaluru South for `boundary.geojson`.
- Publish a release `0.0.x` for Bengaluru South containing only documents metadata, boundary and declarations, so the app shows the corporation outline on the map. The declarations state that clauses and zones are not yet available.
- Write `docs/data-sources.md`.

✅ All raw files checksummed with status evidence; corporation boundary visible in the deployed app.

---

## 7. Corrected source list — Bengaluru South (example jurisdiction)

Still example data only (R1). Verify every entry at acquisition.

| Suggested ID | Document | Layer | Status (to verify) | Where |
|---|---|---|---|---|
| `bbmp-bbl-2003` | BBMP Building Bye-Laws 2003 | Municipal, base | In force as amended | OpenCity, Bengaluru group, "BBMP: Building Bye-Laws 2003" |
| `bscc-bbl-amend-2026` | Bengaluru South City Corporation Building (Amendment) Bye-laws 2026, final, from 14.05.2026 | Municipal, amendment | In force | https://data.opencity.in/dataset/bengaluru-city-corporations-bye-laws-2026 |
| `bscc-bbl-amend-2026-draft` | Draft of the above, dated 01.04.2026 | Municipal | Draft, superseded by final | Same dataset |
| `bda-rmp2015-zr` | RMP 2015 Zoning Regulations | Planning, base | In force as amended | https://data-opencity.sgp1.cdn.digitaloceanspaces.com/Documents/DocumentCloud/bda-zoning-regulations-rmp2015.pdf |
| `bda-rmp2015-zr-amend-2025-07` | Zonal Regulations of RMP 2015 (Amendment) Regulations 2025, final, July 2025 (building height, stilt parking and other changes) | Planning, amendment | **In force** (corrected from v1.0) | https://data.opencity.in/dataset/zonal-regulations-of-the-rmp-2015-of-local-planning-area-of-bengaluru-amendment-regulations-2025 |
| `bda-rmp2015-zr-amend-2025-11` | Amendment to setback dimensions in the zonal regulations, published 11.11.2025 | Planning, amendment | **In force** (to verify) | Same dataset |
| `bda-rmp2015-zr-stilt-draft-2025` | Draft regulations for stilt parking 2025 | Planning | Draft, likely superseded by July 2025 final | Same dataset |
| `bda-rmp2015-maps` | RMP 2015 index map and planning district land-use maps | Planning, map | In force | https://data.opencity.in/dataset/bda-revised-master-plan-2015 |
| `gba-corp-boundaries-2025` | GBA Corporations Delimitation 2025 | Boundary | Current | OpenCity, Greater Bengaluru Authority organisation |
| `gba-wards-2025` | GBA Wards Delimitation 2025 (KML) | Boundary | Current | OpenCity, Greater Bengaluru Authority organisation |
| `ksrsac-landuse` | Bengaluru Urban Land Use Maps 2011 / 2017 (KML) | Existing land use: cross-check only, never zoning | Reference | OpenCity, BDA organisation |
| `bbmp-road-width` | Bengaluru Road Width Map (KML) | Reference for Phase 2 (rules depending on road width) | Reference | OpenCity, Bengaluru urban planning datasets |

Context the agent must keep in mind (unchanged from v1.0): BBMP was replaced by the Greater Bengaluru Authority and five City Corporations in 2025; RMP 2015 remains the zoning in force; RMP 2041 is in preparation (only a draft road grid outside the GBA area has been published) and must not be treated as in force; the draft RMP 2031 was withdrawn.

The planning district checkpoint from v1.0 (M5) is unchanged: Jayanagar-area district, fully inside the South corporation, confirmed by the owner; note the OpenCity index-map label error for Planning District 204.

---

## 8. Milestone M3 — Parsing and comparison (3 days)

As Plan v1.0 Sections 8.2–8.3, with these changes:

- **Adapters in the comparison:**
  1. `pypdfium2` text adapter from S2 (baseline; fast; no OCR, no tables);
  2. **Docling** (MIT) with OCR enabled for scanned pages and table extraction;
  3. **LLMWhisperer** (hosted API, free tier 100 pages per day) as an optional third, only if its terms allow publishing outputs; API key from environment.
  Marker and MinerU are excluded (D2).
- Every adapter must return page numbers and bounding boxes for blocks. Record when an adapter cannot.
- Add to the comparison report: share of blocks with bbox; OCR confidence where available; table fidelity checked against page images for at least three tables per document.
- Use S0's recon findings to focus the comparison on the hardest pages.

**Checkpoint:** owner chooses the parser per document; recorded in `docs/decisions/`.

✅ Comparison report for every Bengaluru document; parser decisions recorded.

---

## 9. Changes to later milestones (for awareness; detailed in the next plan)

- **M4 (structure):** uses the chosen parser per document; citations with bbox; amendments now include the two in-force RMP 2015 amendments; `declarations.json` filled from QA.
- **M6 (zoning map):** two paths per map: `imported` (S2) and `traced` (v1.0 Section 9). For `traced`:
  - **Allmaps** for the review overlay: its Leaflet plugin warps the scanned map onto the web map from the ground control points, expressed as a Georeference Annotation (an open format). The map image must be served as IIIF; generate static IIIF tiles at publish time. Check the licence of each Allmaps package used before adoption (D2).
  - **Allmaps Editor** as the manual fallback when automatic control-point matching fails the error threshold: the owner places points in the browser and the annotation is imported.
  - **MapReader** text spotting (optional) to read zone codes printed on the map as a second signal for labelling zones; check licence first.
- **M8 (publish and app):** already largely delivered by M1.5; becomes "publish Bengaluru South release 0.1.0".

---

## 10. Phase 2 compatibility with Indicodes Rules

Indicodes Rules (github.com/indicodes-in/rules) is an open dataset of computable Indian building rules (Delhi first), with data under CC BY 4.0 and code under Apache-2.0. It stores rules as parameter, applicability conditions, output value and citations with page position, and its engine declines rather than guesses when rules do not settle a question.

Decision: **build independently, stay compatible.**
- In this phase: adopt its practices already listed (D5, D6, D7). Nothing else.
- In Phase 2: design the rule schema so that every Indicodes rule field has a direct equivalent (parameter, applicability conditions with facts and operators, output with unit, effective date, citations with page and bbox, verification), and write a converter both ways with a round-trip test. Prefer reusing their engine package (Apache-2.0) over writing a new evaluator if it fits; credit it per its licence.
- Our differentiators stay: the full clause corpus behind every rule, and the geographic zone layer.

---

## 11. Environment variables

| Variable | Used by | Notes |
|---|---|---|
| `BYLAWS_ROOT` | pipeline | Optional; see S1b |
| `DATA_TARGET` | publish | `local` or `blob` |
| `BLOB_READ_WRITE_TOKEN` | publish | Blob uploads |
| `VERCEL_DEPLOY_HOOK_URL` | publish | Triggers rebuild after a release |
| `NEXT_PUBLIC_DATA_BASE_URL` | web | `/data` locally, Blob URL in production |
| `LLMWHISPERER_API_KEY` | parse (optional) | Only if LLMWhisperer is used |

`.env.example` lists names only. No secrets in the repository.

---

## 12. Checkpoints in this phase

| When | Owner decision |
|---|---|
| S0 | Read recon report; decide whether M6 starts from the fallback method |
| S4 | Sign off the design |
| M2 | Download files manually if automated download is blocked; confirm status differences found at acquisition |
| M3 | Choose parser per document |

The agent stops and asks at these points rather than guessing.

---

## 13. Sequence and estimates

Rough single-developer estimates; S0 runs in parallel with S1.

| Step | Work | Estimate |
|---|---|---|
| S0 | Real-document reconnaissance | 0.5 day |
| S1 | Fail loudly, remove fallbacks | 0.5 day |
| S1b | Structural fixes, schema 1.1, licence check, `run-all` | 1–1.5 days |
| S2 | Fixture vertical slice, imported zones path, publish targets, golden tests | 3–4 days |
| S3 | Data wiring, static generation, deploy hook, Leaflet | 2 days |
| S4 | dg2n rebuild, Data page, notices, accessibility | 3 days |
| M2 | Acquisition with status evidence, boundary release | 2–3 days |
| M3 | Parsing comparison and decision | 3 days |
| **Total** | | **about 15–18 working days** |

---

## 14. Acceptance checklist for the phase

- [ ] No stage reports success without producing output (R7); CI proves it.
- [ ] No "in force" or "page 1" defaults (R8); tests prove it.
- [ ] Schemas are the single source; generated types are current in CI.
- [ ] No fixture literal in schemas; no "prototype" in the interface or display names.
- [ ] Licence check in CI passes; `docs/dependencies.md` and `docs/data-sources.md` complete.
- [ ] `run-all` on the fixture succeeds offline; golden tests pass.
- [ ] All five pages render fixture data in the new design; accessibility check passes; owner signed off.
- [ ] Release zip and checksums produced; Data page shows licence, citation and declarations.
- [ ] Publishing to Blob triggers a site rebuild.
- [ ] Bengaluru South sources acquired with checksums, status evidence and terms; boundary visible in the deployed app.
- [ ] Recon and parser comparison reports committed; parser decisions recorded.
