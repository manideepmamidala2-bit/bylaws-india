# Plan: Bylaw One: Bengaluru Pilot, Launch-Ready Website

**Change**: 261126-h24h-bengaluru-pilot-launch
**Intake**: `intake.md`

## Requirements

### Repository & Governance: Open-Repository Readiness (Part 1)

#### R1: Secret Scanning, Open-Source Repository Files, Citation Metadata, Issue Forms, and Centralized Contact Configuration
The repository MUST run `gitleaks` across the full git history and in `.github/workflows/ci.yml` (listing any historical findings under **Owner actions** in the PR description without rewriting git history), include up-to-date open-repository files (`README.md`, `LICENSE` under Apache-2.0, `LICENSE-DATA.md` under CC BY 4.0 with attribution text, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md` under Contributor Covenant 2.1, `SECURITY.md`, and `GOVERNANCE.md` stating that Bylaw One is run by the owner's organisation, that released data and code stay open permanently, and that partners may join an advisory group), include `CITATION.cff` and `.zenodo.json`, provide GitHub Issue Forms in `.github/ISSUE_TEMPLATE/` for `"Report a problem with a rule"` (site link, what is wrong, official page that shows it), `"Suggest a source"`, and `"Join the pilot"`, and read all contact and organisation details from a single configuration entry (`contact.email` and `organisation.name` in `bylaws.toml` exposed via `lib/site-config.ts` and `pipeline/bylaws/config.py`) left as an owner placeholder.

- **GIVEN** the repository checkout and `.github/workflows/ci.yml`
- **WHEN** `gitleaks` and the repository readiness tests execute in CI
- **THEN** `gitleaks` passes, `README.md`, `LICENSE`, `LICENSE-DATA.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, `GOVERNANCE.md`, `CITATION.cff`, `.zenodo.json`, and the three GitHub Issue Forms (`.github/ISSUE_TEMPLATE/report-problem-with-a-rule.yml`, `suggest-a-source.yml`, `join-the-pilot.yml`, plus `config.yml`) exist and validate
- **AND** `contact.email` and `organisation.name` are read from `bylaws.toml` / `lib/site-config.ts` without scattering hardcoded email addresses across pages

### Web & Geospatial: Rebuilt Map with Existing Data (Part 2)

#### R2: MapLibre + Protomaps Light Map, 8 Ordered Layers, Build-Time Place Index + MiniSearch, Place Card with Zone Rules, Sheet Overlay, Shareable Hash, Browse-by-Ward, and Navigation
The map page (`/j/[id]`) MUST be rebuilt in the Bylaw One design using MapLibre GL JS (`maplibre-gl`) and `@protomaps/basemaps` (`light` flavor) over the existing PMTiles extract (`basemap.pmtiles`) with self-hosted glyph fonts and sprites, displaying attribution `"Protomaps © OpenStreetMap"`, adding **Map** to the primary navigation (`The code`, `Map`, `What changed`, `About` in `components/TopNav.tsx`), and keeping the Playwright browser test (HTTP `206` range responses, non-blank canvas). The map MUST draw 8 layers in strict bottom-to-top order:
1. Base map without labels
2. Land-use zones (`zones.geojson`) in official RMP 2015 legend colours at `60%` opacity (`0.6`), with zone codes shown inside polygons from `zoom >= 15`
3. Light diagonal hatch over areas without land-use data, labelled `"Land-use data not yet available"`
4. Planning district outlines (`planning-districts.geojson`)
5. Ward boundaries (`wards.geojson`), with ward names shown from `zoom >= 13`
6. Corporation boundaries (`boundary.geojson`)
7. Derived overlays (`overlays.geojson` — lake buffers) as dashed outlines labelled `"derived"`
8. Base map labels on top

The layer switch MUST use plain words: `Land-use zones`, `Wards`, `Corporations`, `Planning districts`, `Original map sheets`. At build time (`scripts/build_place_index.mjs`), the build MUST read place names (localities, neighbourhoods, major roads, landmarks) from the PMTiles extract using `pmtiles` + `@mapbox/vector-tile`, add ward names/numbers and corporation names, and write `place-index.json` (`<= 300 KB` compressed). Client search MUST use `MiniSearch` (fuzzy, prefix) so selecting a result flies the map to the location and opens its **Place Card**, alongside a click-only `"My location"` button using browser geolocation. The **Place Card** (`components/PlaceCard.tsx`) MUST show: corporation, ward (name and number), planning district, and land-use zone (plain name and code) or `"Land-use data not yet available here"`, followed by **Rules for this zone** grouped into `Uses`, `FAR`, `Ground coverage`, `Setbacks`, `Height`, and `Parking` (each line showing the rule in plain words, value or range with units, and a page link opening the subject page for that topic, using existing zone links and parameter records only, or `"No rules linked to this zone yet"` when none exist, with zero plot calculator inputs), one line on why the zoning regulations govern these subjects (bye-law 1.4) with the verbatim quote on tap, corporation differences marked, bottom-sheet layout on phones (`390 px`) and side-panel layout on desktop (`1280 px`), and URL hash synchronization (`#lat,lng,zoom,place`) for shareable links. Each processed RMP 2015 sheet MUST be overlayable via a MapLibre `image` source with fitted corner coordinates, an opacity slider (`0–100%`), and sheet details showing its name and measured placement accuracy. Accuracy text (`median` and `90th-percentile` distance in metres from `map-verification.md`) and coverage text (`"Land-use zones cover N% of Greater Bengaluru, in parts of Bengaluru South."`) MUST be generated from data. A standalone **"Browse by ward"** page (`/j/[id]/wards`) MUST expose `corporation → ward → zones present → rules for each zone` without the map. The map page MUST keep initial JS + data `<= 1.5 MB` uncompressed and meet Lighthouse mobile thresholds (`performance >= 70`, `accessibility >= 95`).

- **GIVEN** the built Next.js application and published Bengaluru dataset
- **WHEN** a user visits `/j/in-ka-bengaluru-south`, searches for a place via `MiniSearch`, selects a result, adjusts the sheet overlay opacity, or visits `/j/in-ka-bengaluru-south/wards`
- **THEN** the main navigation includes `Map`, the 8 map layers render in order with `60%` zone opacity and `"Protomaps © OpenStreetMap"` attribution, the URL hash updates to `#lat,lng,zoom,place`, the Place Card shows the 6 rule groups with page links and Bye-law 1.4 quote on tap, the sheet overlay opacity slider (`0–100%`) updates the raster layer, accuracy and coverage lines are generated from data, `/j/in-ka-bengaluru-south/wards` provides the full ward-to-zone-rules hierarchy without WebGL, and initial JS+data is `<= 1.5 MB`

### Machine & AI Readability: Static Endpoints, Structured Data, and Feeds (Part 3)

#### R3: `llms.txt`, `llms-full.txt`, Markdown Page Mirrors, Static JSON API (`/api/v1/`) with OpenAPI 3.1, `schema.org/Legislation` JSON-LD, Frictionless Data Package, Atom Feed, and `/use-with-ai`
The build/publish pipeline (`scripts/build_machine_readable.mjs`) MUST generate:
1. `/llms.txt` at the site root (what Bylaw One is, coverage, how to cite, AI honesty rules: cite the page, label derived values, ask for missing plot details, confirm with the authority, and links to key pages and data) and `/llms-full.txt` (every subject's `"What applies today"` in Markdown).
2. A Markdown version of every document (`/j/<id>/documents/<doc>.md`), subject (`/j/<id>/topics/<topic>.md`), and provision (`/j/<id>/documents/<doc>/<eid>.md`) page at the same path with `.md`.
3. A static JSON API at `/api/v1/` (`documents.json`, `provisions.json`, `subjects.json`, `parameters.json`, `zones.json`, `sources.json`), each record carrying its citation and status, described by `/api/v1/openapi.json` (OpenAPI 3.1.0) and validated in CI.
4. `schema.org` `Legislation` JSON-LD on document and provision pages (`name`, `legislationIdentifier`, `legislationDate`, `legislationJurisdiction`, `legislationLegalForce`, `legislationChanges` for amendments, `isPartOf`, `url` pointing to the official PDF), validated in CI against the `schema.org` vocabulary.
5. A Frictionless Data Package (`datapackage.json` with `resources`, `licenses`, `sources`, `contributors`) downloadable from `/data`.
6. An Atom feed of changes at `/updates.xml`, one entry per instrument added or changed, newest first.
7. A `"Use with AI"` page (`/use-with-ai`) explaining how to use Bylaw One with an AI today (`llms.txt`, page Markdown, JSON API), that a local agent engine is coming, and the rules an AI should follow.

- **GIVEN** the build output in `public/` and rendered pages
- **WHEN** CI validates `/llms.txt`, `/llms-full.txt`, `.md` mirrors, `/api/v1/*.json`, `/api/v1/openapi.json`, `datapackage.json`, `/updates.xml`, `/use-with-ai`, and embedded JSON-LD
- **THEN** all files exist and pass OpenAPI 3.1, JSON Schema, `schema.org` `Legislation`, Frictionless Data Package, and Atom 1.0 validation

### Human Verification Flow for Workshops (Part 4)

#### R4: Workshop Verification Task Sets (`bylaws tasks create`), Browser Verify Page (`/verify/<task-set>`), Verification Import (`bylaws verify import`), Two-Match Threshold, and Verifier Credits
The system MUST implement a serverless human verification workflow:
1. `bylaws tasks create --jurisdiction <id> --count N --subject <subject> --seed <n>` produces a deterministic task set of `N` records (provisions or parameters) with their official PDF `#page=N` link and Wayback archive `#page=N` link, outputting a printable HTML task sheet, a CSV file, and a static JSON task manifest for the web app.
2. `/verify/<task-set>` (`app/verify/[taskSet]/page.tsx`) displays each task with the record text or value on one side and an `"Open official page"` link on the other; the verifier marks `Match`, `Mismatch`, or `Can't tell`, adds a note, and enters their name and institution; answers are saved in `localStorage` in the browser and exported as a CSV file when done, sending nothing over the network.
3. `bylaws verify import <csv> --jurisdiction <id>` records each verification in `data/overrides/<jurisdiction>/verifications.yaml` (and `overrides.schema.json`) with verifier name, institution, date, and verdict. A record becomes `"Verified by a person"` (`verification: "human_verified"`) **only after two independent `Match` verdicts** (and zero unresolved `Mismatch` verdicts); any `Mismatch` verdict opens a review item in `data/reports/<jurisdiction>/verification-review.md` and keeps the record out of `human_verified`.
4. Each person-verified record shows `"Verified by [name], [institution], [date]"` in its details on the site, and verification totals by level appear on `/checks`.
5. Each release's metadata (`manifest.json`, `datapackage.json`) and release notes list verifiers by name and institution.

- **GIVEN** a task set created via `bylaws tasks create` and a fixture CSV of workshop verifier responses
- **WHEN** `bylaws verify import` runs with (a) one `Match`, (b) two independent `Match` verdicts, and (c) a `Mismatch` verdict
- **THEN** one `Match` leaves the record `machine_checked`, two independent `Match` verdicts promote the record to `human_verified` displaying `"Verified by [name], [institution], [date]"` on the site and crediting the verifiers in release metadata/notes, and any `Mismatch` opens a review item without promoting the record

### Pilot, Trust, Joining, and Press Surfaces (Part 5)

#### R5: Home Callout, `/pilot`, `/checks`, `/join`, `/press`, `/about` Stewardship, Universal `"Report a problem"`, `"Current as of"` Dates, and Data-Generated Numbers
The web application MUST provide:
1. **Home (`/`)**: under the hero, `"A working pilot for Bengaluru. Built in the open. Looking for partners."` linking to `/pilot`, plus `"Find rules by place"` linking to the map (`/j/in-ka-bengaluru-south`).
2. **Pilot page (`/pilot`)**: the problem and idea in five sentences; what works today with generated numbers (`documents`, `provisions`, `rules as data`, `corporations`, `wards`, `map coverage`, `records verified by people`, `checks per build`); what is missing (from `declarations.json`); what comes next (Bengaluru complete, Karnataka, other states, agent engine); and how to join.
3. **How we check (`/checks`)**: every automatic check that runs on each build, what it guarantees, and the latest result, plus verification totals by level (including `0` where zero).
4. **Report a problem**: on every provision and rule row, a link to the pre-filled GitHub issue form (`report-problem-with-a-rule.yml`) plus the configured `contact.email`.
5. **Current as of**: the date of the newest instrument in the release (`14 May 2026`), generated from data and shown on Home, Pilot, Map, and every Subject page.
6. **Join (`/join`)**: four short sections (**Colleges**, **Students**, **Practitioners**, **Civic and data groups**), one contact line from config, and the `"Join the pilot"` issue form link.
7. **Who runs Bylaw One (`/about`)**: short section stating that Bylaw One is run by the owner's organisation (name from config), its principles, and that released data and code stay open permanently.
8. **Press page (`/press`)**: one-paragraph description, three screenshots generated at build/test time, downloadable SVG logo files, and contact details from config.
9. **CI generated-numbers check**: CI MUST verify that all numbers shown on these pages match the underlying dataset files and are never hand-typed literals.

- **GIVEN** the built pages `/`, `/pilot`, `/checks`, `/join`, `/press`, `/about`, `/j/[id]`, and `/j/[id]/topics/[topic]`
- **WHEN** CI inspects the rendered HTML and runs the generated-numbers verification test
- **THEN** all pages render their required sections, `"Current as of"` dates, and `"Report a problem"` links, and every numeric count matches the published JSON datasets

### Partner Documents in Repository (Part 6)

#### R6: Partner Kit Markdown Documents in `docs/partners/`
The repository MUST contain six complete, plain-language Markdown documents in `docs/partners/` ready for the owner to review and adapt:
1. `docs/partners/offer.md` — one-page offer to a college
2. `docs/partners/workshop-kit.md` — one-day workshop outline (five sessions: why rules are hard; follow one rule; verify for real using Part 4; AI with citations; show and tell), materials list, facilitator notes, and certificate template text
3. `docs/partners/internship.md` — 60 to 120-hour verification internship outline with weekly tasks and outputs
4. `docs/partners/mou-template.md` — free, non-exclusive MoU covering activities each semester, roles, open licences (Apache-2.0 / CC BY 4.0), credit, term, and exit
5. `docs/partners/charter.md` — purpose, principles (open, cited, verbatim law, derived labelled, not legal advice), how decisions are made, and permanent openness of released work
6. `docs/partners/demo-script.md` — five-minute live demo script (home story, a subject page, the map place card, a verification task, `"Use with AI"`)

- **GIVEN** `docs/partners/` in the repository
- **WHEN** the partner document suite is inspected
- **THEN** all six Markdown files (`offer.md`, `workshop-kit.md`, `internship.md`, `mou-template.md`, `charter.md`, `demo-script.md`) exist and contain all required sections

### Quality, Accessibility, Social Preview, SEO, Analytics, and Incremental Delivery (Part 7 & Section 5)

#### R7: WCAG 2.2 AA (`axe-core`), Lighthouse CI (`>= 70` Performance, `>= 95` Accessibility), `next/og` Social Images, `sitemap.xml`, `robots.txt`, Friendly `404`, Vercel Web Analytics, and Per-Part PR Updates
The web application MUST pass `axe-core` WCAG 2.2 AA across all pages, pass Lighthouse mobile checks (`performance >= 70`, `accessibility >= 95`) in CI for Home, Map, one Subject page, and one Document page, provide per-page Open Graph images via `next/og`, generate `/sitemap.xml` and `/robots.txt` allowing public pages to be crawled, render a friendly `404` page (`app/not-found.tsx`), and enable cookieless Vercel Web Analytics (`@vercel/analytics`). Throughout implementation, work MUST be committed and pushed after each part (Parts 1–7) to a single draft PR with the preview URL at the top, keeping `docs/progress.md` and the PR's **Owner actions**, **Decisions made**, and **Known gaps** sections current.

- **GIVEN** the production Next.js build and CI workflow
- **WHEN** Vitest, Playwright `axe-core`, page budgets, and Lighthouse CI checks run
- **THEN** all pages pass WCAG 2.2 AA with zero violations, Lighthouse mobile scores meet `performance >= 70` and `accessibility >= 95`, Open Graph images, `/sitemap.xml`, `/robots.txt`, and `404` render properly, and `docs/progress.md` and the draft PR description reflect all 7 parts

### Non-Goals
- Processing additional RMP 2015 land-use map sheets (Bengaluru South completion is a separate plan).
- Building the local MCP server, CLI agent engine, or Agent Skill (separate plan).
- Executing owner-only external actions (enabling Zenodo integration, setting the final production email/organisation name, or flipping GitHub repo visibility to public).

### Design Decisions

#### Fixed Section 2 Tool Stack for Map, Search, Secret Scan, Analytics, and OG Images
**Decision**: Use only the exact tools specified in `docs/plans/bengaluru-pilot-launch-plan.md` §2: `maplibre-gl` (BSD-3), `@protomaps/basemaps` `light` flavor (BSD-3), `pmtiles` + `@mapbox/vector-tile` (BSD-3), `minisearch` (MIT), MapLibre `image` source (built-in), `gitleaks` (MIT), `@vercel/analytics` (cookieless Vercel Web Analytics), and `next/og` (MIT).
**Why**: Eliminates tool-selection ambiguity, guarantees 100% Rule R4 permissive licence compliance (`test_r4_licences.py`), and keeps the map and search 100% static and self-hosted without external API keys.
**Rejected**: External geocoding APIs, Leaflet raster tiles, `@allmaps/maplibre` runtime warping, or cookie-based analytics trackers.
*Introduced by*: 261126-h24h-bengaluru-pilot-launch

#### Serverless Two-Verifier Threshold for Person-Verified Records
**Decision**: Generate static workshop task sets (`bylaws tasks create`) and capture verifications in the browser (`/verify/<task-set>`) with CSV export imported via `bylaws verify import <csv>`, promoting a record to `verification: "human_verified"` only when at least two independent verifiers record `Match` and zero verifiers record `Mismatch`.
**Why**: Keeps the web application 100% static and read-only (Constitution & Two-Half Architecture) while enforcing academic double-keyed verification rigor and full git auditability in `data/overrides/<jurisdiction>/verifications.yaml`.
**Rejected**: Adding a mutable database backend to the Next.js app or allowing a single uncorroborated click to mark legal text as `human_verified`.
*Introduced by*: 261126-h24h-bengaluru-pilot-launch

## Tasks

### Phase 1: Setup & Part 1 — Ready to Open the Repository

- [x] T001 Open the initial draft PR with the preview URL at the top; run `gitleaks` over the full git history and add `gitleaks` to `.github/workflows/ci.yml`; centralize `contact.email` and `organisation.name` placeholders in `bylaws.toml`, `pipeline/bylaws/config.py`, and `lib/site-config.ts`; add/update `README.md`, `LICENSE`, `LICENSE-DATA.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, `GOVERNANCE.md`, `CITATION.cff`, `.zenodo.json`, and `.github/ISSUE_TEMPLATE/` (`config.yml`, `report-problem-with-a-rule.yml`, `suggest-a-source.yml`, `join-the-pilot.yml`); add Part 1 tests in `pipeline/tests/test_pilot_launch.py`, update `docs/progress.md`, commit, and push Part 1 <!-- R1 -->

### Phase 2: Core Implementation — Parts 2, 3, and 4

- [x] T002 Install `@protomaps/basemaps`, `@mapbox/vector-tile`, `pbf`, `minisearch`, and `@vercel/analytics` (updating `docs/dependencies.md` for R4 licence checks); implement `scripts/build_place_index.mjs` (extracting place names from `basemap.pmtiles` via `pmtiles` + `@mapbox/vector-tile` plus wards and corporations into `place-index.json` `<= 300 KB` compressed) and self-host MapLibre glyph fonts/sprites under `public/`; rebuild `lib/map-style.ts`, `components/TopNav.tsx` (adding `Map` to main nav: `The code`, `Map`, `What changed`, `About`), `components/ZoneMap.tsx`, `components/PlaceCard.tsx`, `components/AreaExplorerClient.tsx`, `app/j/[id]/page.tsx`, and `app/j/[id]/wards/page.tsx` (`Browse by ward`) with the 8 ordered layers (`60%` zone opacity, zoom 15 zone codes, uncovered diagonal hatch `"Land-use data not yet available"`, planning districts, zoom 13 ward names, corporations, dashed `"derived"` overlays, top labels), `MiniSearch` place search, `"My location"`, 6-group Place Card (`Uses`, `FAR`, `Ground coverage`, `Setbacks`, `Height`, `Parking`) with Bye-law 1.4 quote on tap, phone bottom sheet / desktop side panel, `#lat,lng,zoom,place` hash sync, multi-sheet MapLibre `image` overlays with opacity slider (`0–100%`) and per-sheet accuracy, and data-generated accuracy/coverage lines; update tests, `docs/progress.md`, commit, and push Part 2 <!-- R2 -->
- [x] T003 Implement `scripts/build_machine_readable.mjs` (wired into `prebuild` and `publish`) to generate `/llms.txt`, `/llms-full.txt`, `.md` Markdown versions of every document (`/j/<id>/documents/<doc>.md`), subject (`/j/<id>/topics/<topic>.md`), and provision (`/j/<id>/documents/<doc>/<eid>.md`) page, static JSON API files under `public/api/v1/` (`documents.json`, `provisions.json`, `subjects.json`, `parameters.json`, `zones.json`, `sources.json`, and OpenAPI 3.1 `openapi.json`), Frictionless Data Package (`datapackage.json` linked from `app/data/page.tsx`), and Atom feed (`public/updates.xml`); add `components/LegislationJsonLd.tsx` (`schema.org/Legislation` JSON-LD on document and provision pages) and `app/use-with-ai/page.tsx` (`/use-with-ai`); add CI schema/JSON-LD/Atom validation tests in `pipeline/tests/test_pilot_launch.py`, update `docs/progress.md`, commit, and push Part 3 <!-- R3 -->
- [x] T004 Extend `schemas/overrides.schema.json`, `schemas/clause-tree.schema.json`, `schemas/parameters.schema.json`, and `schemas/manifest.schema.json` (and run `npm run generate`) to support human verification records (`verifications[]`, `human_verifications[]`, release `verifiers[]` credits); implement `pipeline/bylaws/tasks.py` (`bylaws tasks create --jurisdiction <id> --count N --subject <subject> --seed <n>`) and `pipeline/bylaws/verify_records.py` (`bylaws verify import <csv> --jurisdiction <id>`) enforcing the two-independent-`Match` threshold for `human_verified` and opening review items on any `Mismatch`; build `app/verify/[taskSet]/page.tsx` and `components/VerifyTaskSetClient.tsx` with `localStorage` persistence and browser CSV export; display `"Verified by [name], [institution], [date]"` on verified records and credit verifiers in release metadata/notes; add end-to-end fixture CSV tests in `pipeline/tests/test_pilot_launch.py` and `__tests__/`, update `docs/progress.md`, commit, and push Part 4 <!-- R4 -->

### Phase 3: Pilot, Partner Kit, Quality & Sharing — Parts 5, 6, and 7

- [x] T005 Update `app/page.tsx` (hero pilot line linking to `/pilot`, `"Find rules by place"` linking to map, `"Current as of"` date), `app/about/page.tsx` (`"Who runs Bylaw One"` section from config, permanent openness), `app/j/[id]/topics/[topic]/page.tsx`, and `components/ClauseTree.tsx` (`components/ReportProblemLink.tsx` on every provision and rule row, `"Current as of"` dates); create `app/pilot/page.tsx` (`/pilot`), `app/checks/page.tsx` (`/checks`), `app/join/page.tsx` (`/join`), and `app/press/page.tsx` (`/press` with SVG logos and 3 build-generated screenshots); add CI checks verifying that every number on these pages matches published data, update `docs/progress.md`, commit, and push Part 5 <!-- R5 -->
- [x] T006 Author the six partner documents in `docs/partners/`: `offer.md`, `workshop-kit.md`, `internship.md`, `mou-template.md`, `charter.md`, and `demo-script.md`; add verification assertions in `pipeline/tests/test_pilot_launch.py`, update `docs/progress.md`, commit, and push Part 6 <!-- R6 -->
- [x] T007 Add per-page Open Graph social images using `next/og` (`app/opengraph-image.tsx` and route OG metadata), `app/sitemap.ts` (`/sitemap.xml`), `app/robots.ts` (`/robots.txt`), `app/not-found.tsx` (friendly 404), and cookieless Vercel Web Analytics in `app/layout.tsx`; implement `scripts/check_lighthouse.mjs` and Playwright E2E/axe/screenshot suite (`e2e/pilot-launch.spec.ts`) verifying WCAG 2.2 AA across all pages, Lighthouse mobile thresholds (`performance >= 70`, `accessibility >= 95`) on Home, Map, one Subject page, and one Document page, and capturing `390 px` and `1280 px` screenshots (map with place card, sheet overlay, pilot page, join page, verify task, How we check); wire into `.github/workflows/ci.yml`, update `docs/progress.md` and the PR description, commit, and push Part 7 <!-- R7 -->

## Execution Order

- T001 establishes the draft PR, repository config (`bylaws.toml`, `lib/site-config.ts`), and issue form filenames used by T002–T007.
- T002, T003, T004, T005, T006, and T007 execute sequentially in Part 1 → Part 7 order, committing and pushing after each part as required by `docs/plans/bengaluru-pilot-launch-plan.md` §§3, 5.

## Acceptance

### Functional Completeness

- [x] A-001 R1: `gitleaks` passes on the repository and is configured in `.github/workflows/ci.yml`; `README.md`, `LICENSE`, `LICENSE-DATA.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, `GOVERNANCE.md`, `CITATION.cff`, `.zenodo.json`, and the 3 GitHub Issue Forms (`report-problem-with-a-rule.yml`, `suggest-a-source.yml`, `join-the-pilot.yml`) are in place, with `contact.email` and `organisation.name` sourced from config.
- [x] A-002 R2: The map page (`/j/[id]`) uses MapLibre GL JS + `@protomaps/basemaps` (`light` flavor) with self-hosted fonts/sprites, `"Protomaps © OpenStreetMap"` attribution, **Map** in `TopNav.tsx`, the 8 layers in strict bottom-to-top order (`60%` zone opacity, zoom 15 zone codes, uncovered diagonal hatch `"Land-use data not yet available"`, planning districts, zoom 13 ward names, corporations, dashed `"derived"` overlays, top labels), build-time `place-index.json` (`<= 300 KB` compressed) searched with `MiniSearch`, Place Card with 6 rule groups (`Uses`, `FAR`, `Ground coverage`, `Setbacks`, `Height`, `Parking`) and Bye-law 1.4 quote on tap, `#lat,lng,zoom,place` URL hash, MapLibre `image` sheet overlays with `0–100%` opacity slider and per-sheet accuracy, data-generated accuracy and coverage lines, and `/j/[id]/wards` ("Browse by ward").
- [x] A-003 R3: `/llms.txt`, `/llms-full.txt`, `.md` versions of every document, subject, and provision page, `/api/v1/` static JSON API (`documents`, `provisions`, `subjects`, `parameters`, `zones`, `sources`) with OpenAPI 3.1 `/api/v1/openapi.json`, `schema.org` `Legislation` JSON-LD on document and provision pages, Frictionless `datapackage.json`, `/updates.xml` Atom feed, and `/use-with-ai` are generated at build time and pass schema checks in CI.
- [x] A-004 R4: `bylaws tasks create`, `/verify/<task-set>` (with browser storage and CSV export), and `bylaws verify import <csv>` work end to end; a record requires two independent `Match` verdicts to become `human_verified` (`"Verified by [name], [institution], [date]"`), any `Mismatch` opens a review item, and verifiers are credited in release metadata/notes.
- [x] A-005 R5: Home pilot callout and `"Find rules by place"` link, `/pilot`, `/checks`, `/join`, `/press`, `"Who runs Bylaw One"` on `/about`, universal `"Report a problem"` links on every provision and rule row, and `"Current as of"` dates are rendered with every number generated from data and verified in CI.
- [x] A-006 R6: All six partner documents (`offer.md`, `workshop-kit.md`, `internship.md`, `mou-template.md`, `charter.md`, `demo-script.md`) exist in `docs/partners/`.
- [x] A-007 R7: All pages pass `axe-core` WCAG 2.2 AA; Home, Map, one Subject page, and one Document page pass Lighthouse mobile thresholds (`performance >= 70`, `accessibility >= 95`); `next/og` Open Graph images, `/sitemap.xml`, `/robots.txt`, friendly `404`, and cookieless Vercel Web Analytics are active; `docs/progress.md` and the draft PR description are complete with `390 px` and `1280 px` screenshots.

### Behavioral Correctness

- [x] A-008 R2: Clicking a place or selecting a `MiniSearch` result on the map opens the Place Card showing governing rules for that zone with source page links and zero plot calculator inputs, and updates the URL hash `#lat,lng,zoom,place`.
- [x] A-009 R4: Importing a verification CSV with only one `Match` verdict does not mark a record `human_verified`, importing two independent `Match` verdicts marks it `human_verified` with verifier attribution, and importing a `Mismatch` verdict records a review item while keeping the record unpromoted.

### Scenario Coverage

- [x] A-010 R2: Playwright browser tests (`e2e/`) cover place search → Place Card → rule link navigation, sheet overlay opacity slider interaction, `#lat,lng,zoom,place` hash restoration, and `/j/[id]/wards` browse-by-ward navigation.
- [x] A-011 R3: Automated tests in `pipeline/tests/test_pilot_launch.py` validate `/api/v1/openapi.json` (OpenAPI 3.1), `/api/v1/*.json` record citations/statuses, `schema.org` `Legislation` JSON-LD fields, `datapackage.json`, `/updates.xml` Atom feed, `/llms.txt`, `/llms-full.txt`, and `.md` page mirrors.
- [x] A-012 R4: End-to-end automated tests in `pipeline/tests/test_pilot_launch.py` and Playwright (`e2e/`) verify creating a task set, completing tasks in `/verify/<task-set>`, exporting CSV, importing via `bylaws verify import`, and rendering verifier credits.
- [x] A-013 R5: Automated tests verify that every number rendered on `/`, `/pilot`, `/checks`, and `/press` matches the published JSON datasets and that `"Current as of"` and `"Report a problem"` links are present.

### Edge Cases & Error Handling

- [x] A-014 R2: Clicking a map location in a corporation or ward where land-use sheets have not yet been processed displays `"Land-use data not yet available here"` in the Place Card, and selecting a zone code with no linked rules displays `"No rules linked to this zone yet."`
- [x] A-015 R4: Submitting duplicate `Match` verdicts from the same verifier name and institution does not satisfy the two-independent-verifiers requirement for `human_verified`.

### Code Quality

- [x] A-016 Pattern consistency: New Python modules (`pipeline/bylaws/tasks.py`, `pipeline/bylaws/verify_records.py`) and Next.js components/routes follow existing project conventions, typing (`tsc --noEmit`, `ruff check`), and Rule R1 (zero hardcoded jurisdiction constants).
- [x] A-017 No unnecessary duplication: Shared plain-language formatting, dataset loading (`lib/data.ts`), and site config (`lib/site-config.ts`) utilities are reused across map, subject, pilot, checks, press, and machine-readable generators.
- [x] A-018 Readability and maintainability: Functions and components are modular and focused rather than monolithic god functions.
- [x] A-019 No magic strings or numbers: All dataset statistics, accuracy metrics, coverage percentages, and contact/organisation strings are derived from data or configuration rather than magic literals.

### Security

- [x] A-020 R1: `gitleaks` scans the repository in CI, Rule R4 (`test_r4_licences.py`) verifies all newly added npm/Python dependencies use permissive licences, and `/verify/<task-set>` and Vercel Web Analytics transmit zero personal data or cookies.

## Notes

- Check items as you review: `- [x]`
- All acceptance items must pass before `/fab-continue` (hydrate)
- If an item is not applicable, mark checked and prefix with **N/A**: `- [x] A-NNN **N/A**: {reason}`

## Deletion Candidates

- `components/PlotCard.tsx` — Standalone Plot Card UI component superseded by `components/PlaceCard.tsx` now that the map displays zone rules without a plot calculator.
- `components/ClausePanel.tsx` — Legacy zone-clause sidebar component superseded by `components/PlaceCard.tsx` and `lib/zone-rules.ts` (referenced only in `__tests__/clause-fallbacks.test.tsx`).
- `components/AreaExplorerClient.tsx:35-37,48-50` (`AreaExplorerClientProps` optional fields `clauses`, `amendmentLinks`, `clauseZoneTags`, `parametersPayload`, `resolutionConfig`, `consolidatedPayload`) — Optional legacy props retained on `AreaExplorerClientProps` after `app/j/[id]/page.tsx` switched to passing pre-computed `zoneRulesByCode` and `byelaw14Info` for `PlaceCard`.
- `lib/map-style.ts:58` (`buildDg2nMapStyle`) — Backwards-compatibility alias for `buildProtomapsLightStyle` with zero remaining call sites in `app/`, `components/`, or `lib/`.

## Assumptions

| # | Grade | Decision | Rationale | Scores |
|---|-------|----------|-----------|--------|
| 1 | Certain | Use `/j/[id]/wards` for the "Browse by ward" page and link it prominently from `/j/[id]` (the Map page) | Matches the existing `/j/[id]/*` jurisdiction routing convention and satisfies Part 2.7 | S:90 R:95 A:95 D:90 |
| 2 | Certain | Store human verification imports in `data/overrides/<jurisdiction>/verifications.yaml` (validated by `schemas/overrides.schema.json`) so `bylaws apply-overrides` and `bylaws publish` remain 100% deterministic under Rule R6 | Matches Rule R6 ("store all manual fixes in `data/overrides/<jurisdiction>/*.yaml`") and Part 4.3 ("records each verification in the overrides") | S:95 R:90 A:95 D:95 |
| 3 | Certain | Include a pre-built workshop task set (`public/data/tasks/bengaluru-pilot-sample.json`, `.html`, `.csv`) generated via `bylaws tasks create` so `/verify/bengaluru-pilot-sample` works immediately on the deployed preview and in CI browser tests | Ensures Part 4 ("Done when: a task set can be created, completed in the browser, exported, imported, and shown on the site") and Part 6 (`demo-script.md`) work live on the preview URL | S:90 R:95 A:90 D:90 |

3 assumptions (3 certain, 0 confident, 0 tentative).
