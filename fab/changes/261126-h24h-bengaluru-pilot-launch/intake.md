# Intake: Bylaw One: Bengaluru Pilot, Launch-Ready Website

**Change**: 261126-h24h-bengaluru-pilot-launch
**Created**: 2026-11-26

## Origin

> Implement docs/plans/bengaluru-pilot-launch-plan.md using only the tools listed in its Section 2: open one draft PR with the preview URL at the top; Part 1 gitleaks in CI, repository files, citation files and issue forms; Part 2 rebuild the map with existing data (layers in the stated order, place search from a build-time place index, place card with rules for the zone and page links, sheet overlay with opacity, shareable address, generated accuracy and coverage lines, browse-by-ward page, Map in the main navigation, budgets and Lighthouse thresholds); Part 3 llms.txt, llms-full.txt, Markdown pages, JSON API with OpenAPI 3.1, schema.org Legislation markup, data package, Atom feed and "Use with AI" page; Part 4 the verification flow (task sets, verify page with browser-side export, import command, two Match verdicts for person-verified, verifier credits); Part 5 pilot, How we check, Join, Press pages, Report a problem everywhere and "current as of" dates, with every number generated from data; Part 6 partner documents in docs/partners/; Part 7 accessibility, social images, sitemap, robots, 404 and analytics; commit and push after each part, keep docs/progress.md current and the PR's "Owner actions", "Decisions made" and "Known gaps" sections up to date; never invent or rewrite legal text.

One-shot `/fab-new` invocation from the self-contained specification `docs/plans/bengaluru-pilot-launch-plan.md` ("Bylaw One: Bengaluru Pilot, Launch-Ready Website", dated 26 November 2026, replacing the earlier "Bengaluru Pilot" plan). All tool choices and design decisions in Sections 2–6 of `docs/plans/bengaluru-pilot-launch-plan.md` are pre-settled and incorporated verbatim.

## Why

1. **Problem**: `bylaws-india` (**Bylaw One** — `"Bengaluru's building rules. One code."`) has a verified Python data pipeline (`pipeline/`), fifteen Unified Schema `1.4` contracts (`schemas/`), and a clean Next.js web reader (`app/`, `components/`, `lib/`), but it is not yet launch-ready as a public **Bengaluru Pilot** for colleges, practitioners, and the press:
   - **Repository openness (Part 1)**: The repository lacks a full git-history `gitleaks` scan and CI job, `SECURITY.md`, `GOVERNANCE.md`, `.zenodo.json`, updated `README.md` / `CITATION.cff`, centralized config placeholders for `contact.email` and owner organisation name, and structured GitHub Issue Forms (`Report a problem with a rule`, `Suggest a source`, `Join the pilot`).
   - **Interactive map with existing data (Part 2)**: The map page (`/j/[id]`) is not in the primary top navigation (`The code`, `Map`, `What changed`, `About`), does not use `@protomaps/basemaps` (`light` flavor) with self-hosted fonts/sprites and strict 8-layer bottom-to-top ordering (including a light diagonal hatch `"Land-use data not yet available"` over uncovered areas, zone codes from zoom 15, and ward names from zoom 13), lacks a build-time `place-index.json` (`<= 300 KB` compressed) extracted from the PMTiles extract (`pmtiles` + `@mapbox/vector-tile`) searched via `MiniSearch`, lacks the **Place Card** showing **Rules for this zone** (`Uses`, `FAR`, `Ground coverage`, `Setbacks`, `Height`, `Parking`) with plain-word values, page links, Bye-law 1.4 quote on tap, phone bottom-sheet / desktop side-panel layout, and `#lat,lng,zoom,place` URL hash state, lacks multi-sheet MapLibre `image` overlays with per-sheet accuracy details, and lacks a standalone **"Browse by ward"** page reachable without the map.
   - **Machine and AI readability (Part 3)**: The site lacks `/llms.txt` and `/llms-full.txt`, `.md` versions of every document, subject, and provision page, a build-time static JSON API at `/api/v1/` (`documents`, `provisions`, `subjects`, `parameters`, `zones`, `sources`) described by `/api/v1/openapi.json` (OpenAPI 3.1), `schema.org/Legislation` JSON-LD on document and provision pages, a Frictionless Data Package (`datapackage.json`), an Atom feed at `/updates.xml`, and a `"Use with AI"` page (`/use-with-ai`).
   - **Human verification workflow for college workshops (Part 4)**: There is no serverless workshop verification workflow (`bylaws tasks create --count N --subject <subject> --seed <n>`, interactive `/verify/<task-set>` browser page with `localStorage` persistence and CSV export, `bylaws verify import <csv>` requiring two independent `Match` verdicts before marking a record `human_verified` and opening a review item on any `Mismatch`, and displaying `"Verified by [name], [institution], [date]"` on the site and in release credits).
   - **Pilot, trust, joining, press, and partner kit (Parts 5–6)**: Visitors lack the home-page pilot callout and `"Find rules by place"` action, `/pilot`, `/checks` (`"How we check"`), `/join` (Colleges, Students, Practitioners, Civic and data groups), `/press` (with build-generated screenshots and logo files), per-provision/per-rule `"Report a problem"` links, `"Current as of"` dates across key surfaces, the `"Who runs Bylaw One"` section on `/about`, and the six partner documents in `docs/partners/` (`offer.md`, `workshop-kit.md`, `internship.md`, `mou-template.md`, `charter.md`, `demo-script.md`).
   - **Quality, sharing, and analytics (Part 7)**: The site needs per-page `next/og` Open Graph images, `sitemap.xml`, `robots.txt`, a friendly `404` page, Vercel Web Analytics (cookieless, no personal data), and CI enforcement of WCAG 2.2 AA (`axe-core`) and Lighthouse thresholds (`performance >= 70`, `accessibility >= 95` on mobile emulation).
2. **Consequence**: Without these seven parts, visitors cannot understand the pilot in a few minutes, inspect zone rules on the map by place or ward, consume the code cleanly with AI/machines, run student verification workshops with named credit, or onboard colleges and practitioners for the January 2027 public launch.
3. **Approach**: Execute Parts 1 through 7 of `docs/plans/bengaluru-pilot-launch-plan.md` in strict order on one draft PR (with the preview URL at the top), using **only** the fixed tools listed in Section 2, committing and pushing after each part, and keeping `docs/progress.md` and the PR's **Owner actions**, **Decisions made**, and **Known gaps** sections current. Never invent or rewrite legal text; generate every number shown on a page from data at build time; keep code free of city-specific constants (Rule R1).

## What Changes

### Fixed Decisions & Tool Stack (Section 2)
- **No plot calculator on the website**: The map shows the rules for a place's zone, with sources; it does not compute a plot.
- **Language & Licences**: English only. Code under Apache-2.0 (`LICENSE`), data under CC BY 4.0 (`LICENSE-DATA.md`).
- **Governance & Stewardship**: Bylaw One is run by the owner's organisation (configured via `bylaws.toml` / site config placeholder); everything released stays open permanently.
- **Explicit Out-of-Scope (Section 1)**: Do NOT process additional land-use map sheets (Bengaluru South completion is a separate plan); do NOT build the local MCP/CLI agent engine; do NOT handle external event logistics.
- **Fixed Tool Choices (Section 2 — no alternatives to evaluate)**:

| Need | Tool | Licence |
|---|---|---|
| Map rendering | `maplibre-gl` (MapLibre GL JS) | BSD-3 |
| Base map style | `@protomaps/basemaps`, `light` flavor | BSD-3 (tiles ODbL, attribution required) |
| Base map file | PMTiles, existing Bengaluru extract (`basemap.pmtiles`) | open format |
| Place search | `minisearch` (MiniSearch) | MIT |
| Reading place names from tiles at build time | `pmtiles` + `@mapbox/vector-tile` (`@mapbox/point-geometry` / `pbf`) | BSD-3 / BSD-3 |
| Sheet overlay | MapLibre `image` source with fitted corner coordinates | built in |
| Secret scan | `gitleaks` | MIT |
| Analytics | `@vercel/analytics` (Vercel Web Analytics — cookieless, no personal data) | MIT / service |
| Social images | `next/og` | MIT |

---

### Part 1 — Ready to Open the Repository
1. **Secret scan (`gitleaks`)**:
   - Run `gitleaks` over the full git history (`gitleaks git -v`). If any findings exist, list them in the PR under **Owner actions** (rotation and history rewrite are owner actions).
   - Add a `gitleaks` step/job to `.github/workflows/ci.yml` (and `.gitleaks.toml` if needed) so every push and PR is scanned in CI.
2. **Repository documentation and governance files**:
   - Update `README.md`: what Bylaw One is, why it exists, how to run (`pipeline` and Next.js web app), and how to contribute.
   - Verify/update `LICENSE` (Apache-2.0) and `LICENSE-DATA.md` (CC BY 4.0 with explicit attribution text for Bylaw One).
   - Verify/update `CONTRIBUTING.md` and `CODE_OF_CONDUCT.md` (Contributor Covenant 2.1).
   - Add `SECURITY.md` (vulnerability reporting via configured contact email placeholder and GitHub security advisories) and `GOVERNANCE.md` (run by the owner's organisation; released data and code stay open permanently; university, practitioner, and civic partners may join an advisory group).
3. **Citation files**:
   - Update `CITATION.cff` and add `.zenodo.json` with consistent Bylaw One metadata, Apache-2.0 / CC BY 4.0 licences, and version `4.0.0`.
4. **GitHub Issue Forms (`.github/ISSUE_TEMPLATE/`)**:
   - `.github/ISSUE_TEMPLATE/config.yml`
   - `.github/ISSUE_TEMPLATE/report-problem-with-a-rule.yml` — **"Report a problem with a rule"** (fields: site link, what is wrong, official page that shows it).
   - `.github/ISSUE_TEMPLATE/suggest-a-source.yml` — **"Suggest a source"** (jurisdiction/corporation, instrument title and date, official link or copy, notes).
   - `.github/ISSUE_TEMPLATE/join-the-pilot.yml` — **"Join the pilot"** (name, organisation/college, role: College / Student / Practitioner / Civic or data group, how they would like to take part).
5. **Single configuration source for contact & organisation placeholders**:
   - Store `contact.email` (placeholder e.g. `contact@example.org` `[OWNER_ACTION: set contact.email]`) and `organisation.name` (placeholder e.g. `[Owner's Organisation]`) in `bylaws.toml` (`[contact]` / `[organisation]`) and expose them via a shared config module (`lib/site-config.ts` and `pipeline/bylaws/config.py`) so no contact detail or organisation name is scattered across templates or pages.

---

### Part 2 — The Map, Rebuilt with Existing Data
1. **2.1 Base and layout (`lib/map-style.ts`, `components/ZoneMap.tsx`, `components/TopNav.tsx`)**:
   - Rebuild the map page (`/j/[id]`) in the Bylaw One design using MapLibre GL JS and `@protomaps/basemaps` (`light` flavor), with self-hosted glyph fonts (`/fonts/{fontstack}/{range}.pbf`) and sprites (`/sprites/light.*`) served locally under `public/`.
   - Keep and pass the existing Playwright browser test (PMTiles HTTP `206` responses, WebGL canvas not blank).
   - Map attribution: `"Protomaps © OpenStreetMap"`.
   - Add **Map** to the main navigation in `components/TopNav.tsx` (`The code`, `Map`, `What changed`, `About`).
2. **2.2 Layers, bottom to top (strict order 1–8)**:
   1. Base map without labels (`@protomaps/basemaps` `light` non-symbol layers).
   2. Land-use zones (`zones.geojson`) in the official RMP 2015 legend colours at `60%` opacity (`0.6`); zone codes (`zone_code`) shown inside polygons from `zoom >= 15`.
   3. Light diagonal hatch over areas without land-use data (computed difference polygon inside the Greater Bengaluru / corporation boundary where land-use sheets are not yet processed), quiet label `"Land-use data not yet available"`.
   4. Planning district outlines (`planning-districts.geojson`).
   5. Ward boundaries (`wards.geojson`); ward names shown from `zoom >= 13`.
   6. Corporation boundaries (`boundary.geojson`).
   7. Derived overlays (`overlays.geojson` — lake buffers) as dashed outlines explicitly labelled `"derived"`.
   8. Base map labels (`@protomaps/basemaps` `light` symbol/label layers) on top.
   - **Layer switch, in plain words**: `Land-use zones`, `Wards`, `Corporations`, `Planning districts`, `Original map sheets`.
3. **2.3 Place search (`scripts/build_place_index.mjs`, `lib/place-search.ts`)**:
   - At build time, read place names (localities, neighbourhoods, major roads, landmarks) from the PMTiles extract (`basemap.pmtiles`) using `pmtiles` + `@mapbox/vector-tile`, add ward names and numbers (`wards.geojson`) and corporation names (`boundary.geojson`), and write `public/data/<id>/place-index.json` (and `public/data/in-ka-bengaluru/place-index.json`, target `<= 300 KB` compressed).
   - Search on the client with `MiniSearch` (fuzzy, prefix). Selecting a search result flies the map to `[lng, lat]` and opens its **Place Card**.
   - `"My location"` button using browser `navigator.geolocation`, triggered only on click.
4. **2.4 Place card (`components/PlaceCard.tsx`, `components/AreaExplorerClient.tsx`)**:
   - Shows: **Corporation**, **Ward** (name and number), **Planning district**, and **Land-use zone** (plain name and code) or `"Land-use data not yet available here"`.
   - **Rules for this zone**, grouped in 6 sections:
     1. `Uses`
     2. `FAR`
     3. `Ground coverage`
     4. `Setbacks`
     5. `Height`
     6. `Parking`
     Each line shows: the rule in plain words, value or range with units, and a page link (`p. N`); clicking opens the subject page for that topic (`/j/<id>/topics/<subject>?zone=<zone_code>`). Uses existing `clause-zone-tags.json` / `zone_applicability` links and `parameters.json` records only. If a zone code has no linked rules: `"No rules linked to this zone yet."`
   - One line on why the zoning regulations govern these subjects (bye-law 1.4), with the verbatim quote on tap (`<details>`).
   - Corporation differences marked (`"In <Corporation>"`).
   - Responsive presentation: **Phone (`390 px`)**: bottom sheet; **Desktop (`1280 px`)**: side panel.
   - Shareable URL hash: address bar keeps map position and selected place (`#lat,lng,zoom,place` — e.g. `#12.9279,77.5831,15,Jayanagar`), and loading the page with that hash restores the position and opens the Place Card.
5. **2.5 Original map sheets**:
   - For each processed RMP 2015 sheet (`rmp2015-pd-210-b`, `rmp2015-pd-210-a`, `rmp2015-pd-211-a`, `rmp2015-pd-211-b` in `geo-layers.json` / `map-verification.md`), overlay the sheet image using a MapLibre `image` source with its fitted WGS 84 corner coordinates; provide an opacity slider (`0` to `100%`) and sheet selector/list.
   - Each sheet's details show its name and measured placement accuracy (street centre-line median and 90th-percentile distance in metres, plus grid-fit RMSE inside `Details`).
6. **2.6 Accuracy and coverage lines**:
   - Accuracy text generated dynamically from `data/reports/in-ka-bengaluru-south/map-verification.md`: median and 90th-percentile distance, in metres.
   - Coverage text generated dynamically from data (`zones.geojson` area vs. Greater Bengaluru `boundary.geojson` area): `"Land-use zones cover N% of Greater Bengaluru, in parts of Bengaluru South."`
7. **2.7 Without the map (`app/j/[id]/wards/page.tsx`)**:
   - **"Browse by ward"** page (`/j/[id]/wards`, linked prominently from the map page): `Corporation → Ward → Zones present → Rules for each zone`. Same zone-rule content as the Place Card, reachable without WebGL/map and accessible to screen readers.
8. **2.8 Performance and access**:
   - Map page: initial JavaScript plus data `<= 1.5 MB` uncompressed (`scripts/check_page_budgets.mjs`); Lighthouse performance `>= 70` on mobile emulation; Lighthouse accessibility `>= 95`.
   - All map and place-card controls keyboard-operable with visible focus indicators.

---

### Part 3 — Readable by Machines and AI
1. **`/llms.txt` and `/llms-full.txt` at site root (`public/llms.txt`, `public/llms-full.txt`)**:
   - Generated at build/publish time (`scripts/build_machine_readable.mjs`):
     - `llms.txt`: what Bylaw One is, coverage, how to cite, the rules any AI should follow (cite the page, label derived values, ask for missing plot details, confirm with the authority), and links to key pages and data.
     - `llms-full.txt`: every subject's `"What applies today"` in clean Markdown (parameter tables, governing provisions, resolution rules, and citations).
2. **Markdown versions of every document, subject, and provision page (`.md` at the same path)**:
   - Generate and serve clean Markdown at:
     - `/j/<id>/documents/<doc>.md`
     - `/j/<id>/topics/<topic>.md`
     - `/j/<id>/documents/<doc>/<eid>.md`
     Configured via static file generation in `public/` and/or Next.js rewrites/route handlers so fetching `<path>.md` returns UTF-8 Markdown with verbatim text and page citations.
3. **Static JSON API at `/api/v1/` with OpenAPI 3.1 (`public/api/v1/`)**:
   - Built at publish/build time under `public/api/v1/`:
     - `/api/v1/openapi.json` (valid OpenAPI `3.1.0` document)
     - `/api/v1/documents.json`
     - `/api/v1/provisions.json`
     - `/api/v1/subjects.json`
     - `/api/v1/parameters.json`
     - `/api/v1/zones.json`
     - `/api/v1/sources.json`
     Each record carries its citation (`doc_id`, `plain_title`, `page`, `official_url`, `archive_url`) and status (`legal_status`, `verification`, `derived`). Validated by schema checks in CI.
4. **`schema.org` `Legislation` JSON-LD**:
   - Embed `<script type="application/ld+json">` on document pages (`/j/[id]/documents/[doc]`) and provision pages/views with `@context: "https://schema.org"`, `@type: "Legislation"`, `name`, `legislationIdentifier`, `legislationDate`, `legislationJurisdiction`, `legislationLegalForce`, `legislationChanges` (for amendments), `isPartOf`, and `url` (official PDF URL).
   - Validate in CI against the `schema.org` `Legislation` vocabulary requirements.
5. **Frictionless Data Package (`datapackage.json`)**:
   - Generate `datapackage.json` for each release (`public/data/<id>/<version>/datapackage.json` and `public/data/datapackage.json`) with `resources`, `licenses`, `sources`, and `contributors` (including person verifiers from Part 4), and link it for download from `/data`.
6. **Atom feed of changes (`/updates.xml`)**:
   - Generate `public/updates.xml` (valid Atom 1.0 XML feed), one `<entry>` per instrument added or changed, ordered newest first. Validate XML/Atom structure in CI.
7. **`"Use with AI"` page (`app/use-with-ai/page.tsx` — `/use-with-ai`)**:
   - Explains how to use Bylaw One with an AI today (point it at `/llms.txt`, give it a page's `.md` Markdown URL, use the `/api/v1/` JSON API), states that a local agent engine is coming, and lists the honesty rules an AI should follow.

---

### Part 4 — Verification by People (for Workshops)
1. **Verification tasks CLI (`bylaws tasks create`)**:
   - Add `bylaws tasks create --jurisdiction <id> --count <N> --subject <subject> --seed <n>` (supporting `--jurisdiction` per Rule R1, plus `--output-dir` / default task-set output under `public/data/<id>/tasks/<task_set_id>/` and `data/tasks/<id>/<task_set_id>/`):
   - Deterministically selects `N` records (provisions or parameter records matching `<subject>`) using `--seed <n>`, each with its record ID, text or value, conditions, cited page number, official PDF `#page=N` link, and Wayback archive `#page=N` link.
   - Outputs:
     - Task-set JSON manifest (`public/data/tasks/<task_set_id>.json`) consumed by `/verify/<task-set>`
     - Printable HTML task sheet (`<task_set_id>.html`)
     - CSV task file (`<task_set_id>.csv`)
2. **Verify page (`app/verify/[taskSet]/page.tsx` — `/verify/<task-set>`)**:
   - Displays each task in the task set with the record text or value on one side and an `"Open official page"` link (plus archive link) on the other.
   - The verifier marks `Match`, `Mismatch`, or `Can't tell`, adds an optional note, and enters their **name** and **institution**.
   - Answers are saved in the browser (`localStorage` keyed by `taskSet`) and exported as a `.csv` download when done (`task_id,record_id,record_kind,verdict,note,verifier_name,institution,verified_at`). Nothing is sent to any server.
3. **Import CLI (`bylaws verify import <csv>`)**:
   - Add `bylaws verify import <csv> --jurisdiction <id>` in `pipeline/bylaws/verify_records.py` / `cli.py`:
   - Appends/merges each verification entry into `data/overrides/<jurisdiction>/verifications.yaml` (and `schemas/overrides.schema.json` `human_verifications[]`) with `record_id`, `record_kind` (`provision | parameter | zone`), `verifier_name`, `institution`, `verified_at` (date), `verdict` (`match | mismatch | cant_tell`), and `note`.
   - **Two-Match threshold rule**: During `apply-overrides` / `validate` / `publish`, a record's `verification` becomes `"human_verified"` (`"Verified by a person"`) **only after at least two independent `match` verdicts** (distinct `verifier_name` + `institution` pairs) and zero unresolved `mismatch` verdicts.
   - **Mismatch rule**: Any `mismatch` verdict keeps the record out of `human_verified` and records an open review item in `data/reports/<jurisdiction>/verification-review.md` (and `checks-summary.json`).
4. **Shown on the site**:
   - Each person-verified record (`verification === "human_verified"` with `verifications[]`) displays `"Verified by [name], [institution], [date]"` (listing both/all verifiers) inside its `Details` disclosure on subject and document pages.
   - Verification totals by level (`Machine-checked`, `Verified by a person`, `Open review items`) are displayed on the `"How we check"` page (`/checks`).
5. **Credits**:
   - Each release's metadata (`manifest.json` / `datapackage.json` `contributors`) and generated release notes list verifiers by name and institution.

---

### Part 5 — Pilot, Trust and Joining
1. **Home page (`app/page.tsx`)**:
   - Under the hero, add one line: `"A working pilot for Bengaluru. Built in the open. Looking for partners."` linking to `/pilot`.
   - Add `"Find rules by place"` linking to the map (`/j/in-ka-bengaluru-south`) alongside `"Read the code"`.
   - Display `"Current as of <date>"` generated from the newest in-force instrument in the release.
2. **Pilot page (`app/pilot/page.tsx` — `/pilot`)**:
   - **The problem and idea** in five sentences.
   - **What works today** with generated numbers from dataset state (never hand-typed): `documents`, `provisions`, `rules as data` (`parameters`), `corporations`, `wards`, `map coverage` (`%`), `records verified by people`, and `checks per build`.
   - **What is missing**: generated in plain words from `declarations.json`.
   - **What comes next**: Bengaluru complete, Karnataka, other states, agent engine.
   - **How to join**: link and summary pointing to `/join`.
3. **How we check (`app/checks/page.tsx` — `/checks`)**:
   - Lists every automatic check that runs on each build (text fidelity against stored PDF page text, structure & depth, parameter plausibility bounds, table overlap & band continuity, 5-corporation parity, map street-offset & grid-fit checks, R15/R16 provenance gate, plain-language & no-internal-IDs gate, page weight budgets & WCAG AA accessibility), what each check guarantees, and the latest measured result from build artifacts.
   - Displays verification totals by level (`Machine-checked`, `Verified by a person`), showing `0` honestly where zero.
4. **Report a problem (`components/ReportProblemLink.tsx`)**:
   - On every provision (`ClauseTree.tsx`, subject-page provisions) and every rule row (subject-page parameter tables and Place Card rules), render a quiet `"Report a problem"` link to the pre-filled GitHub issue form (`.github/ISSUE_TEMPLATE/report-problem-with-a-rule.yml` with site URL, rule/provision reference, and official page link) plus the configured `contact.email` mailto link.
5. **Current as of**:
   - Compute the date of the newest instrument in the release dynamically from `documents.json` (`14 May 2026`) and display `"Current as of 14 May 2026"` on Home (`/`), Pilot (`/pilot`), Map (`/j/[id]`), and every Subject page (`/j/[id]/topics/[topic]`).
6. **Join page (`app/join/page.tsx` — `/join`)**, with four short sections:
   - **Colleges**: a free MoU with real activities each semester (a one-day workshop, a faculty session, supervised verification internships of 60 to 120 hours), named credit in every release, a citable dataset, state-steward role.
   - **Students**: what the workshop teaches (reading city rules; using AI and checking it against the gazette), verification internships, certificates.
   - **Practitioners**: report problems, review rules in your field, early access to the agent engine.
   - **Civic and data groups**: sources, documents, maps.
   - One contact line (from config `contact.email`) and the `"Join the pilot"` GitHub issue form link.
7. **Who runs Bylaw One (`app/about/page.tsx` — `/about`)**:
   - Add a short section on `/about`: run by the owner's organisation (name from config), core principles, and that released data and code stay open permanently.
8. **Press page (`app/press/page.tsx` — `/press`)**:
   - One-paragraph plain description of Bylaw One and the Bengaluru pilot (with generated numbers), three screenshots generated at build/test time (`public/press/`), downloadable SVG logo/wordmark files (`public/press/bylaw-one-logo.svg`, `public/press/bylaw-one-mark.svg`), and contact details from config.
9. **CI generated-numbers check**:
   - Add a test in CI (`pipeline/tests/test_release_and_copy_consistency.py` / `scripts/check_page_budgets.mjs`) verifying that the numbers shown on `/`, `/pilot`, `/checks`, and `/press` match the published dataset JSON counts and are never stale hand-typed literals.

---

### Part 6 — Partner Documents (in `docs/partners/`)
Write six self-contained Markdown documents in `docs/partners/` for the owner to review and adapt:
1. `docs/partners/offer.md`: the one-page offer to a college.
2. `docs/partners/workshop-kit.md`: one-day workshop outline (five sessions: why rules are hard; follow one rule; verify for real using Part 4; AI with citations; show and tell), materials list, facilitator notes, certificate template text.
3. `docs/partners/internship.md`: a 60 to 120-hour verification internship outline with weekly tasks and outputs.
4. `docs/partners/mou-template.md`: free, non-exclusive MoU covering activities each semester, roles, open licences (Apache-2.0 / CC BY 4.0), named credit, term, and exit.
5. `docs/partners/charter.md`: purpose, principles (open, cited, verbatim law, derived labelled, not legal advice), how decisions are made, permanent openness of released work.
6. `docs/partners/demo-script.md`: a five-minute live demo of the site (home story, a subject page, the map place card, a verification task, `"Use with AI"`).

---

### Part 7 — Quality and Sharing
1. **WCAG 2.2 AA & `axe-core`**:
   - Ensure `axe-core` passes with zero WCAG 2.2 AA violations across all pages (`/`, `/pilot`, `/checks`, `/join`, `/press`, `/use-with-ai`, `/verify/<task-set>`, `/j/[id]`, `/j/[id]/wards`, `/j/[id]/topics/[topic]`, `/j/[id]/documents/[doc]`, `/about`, `/data`).
2. **Lighthouse in CI**:
   - Run Lighthouse in CI (`scripts/check_lighthouse.mjs` using headless Chromium) for Home (`/`), Map (`/j/in-ka-bengaluru-south`), one Subject page (`/j/in-ka-bengaluru-south/topics/far`), and one Document page (`/j/in-ka-bengaluru-south/documents/bbl-2003`) under mobile emulation, enforcing `performance >= 70` and `accessibility >= 95`.
3. **Open Graph images per page (`next/og`)**:
   - Generate Open Graph social images using `next/og` (`ImageResponse` in `app/opengraph-image.tsx` and route-level OG image generators / dynamic OG route) in the Bylaw One aesthetic.
4. **`sitemap.xml`, `robots.txt`, and friendly `404`**:
   - `app/sitemap.ts`: generates `/sitemap.xml` listing all public routes.
   - `app/robots.ts`: generates `/robots.txt` allowing public pages to be crawled by search and AI crawlers and pointing to `/sitemap.xml`.
   - `app/not-found.tsx`: friendly 404 page in the Bylaw One design with links to Home, The code, Map, and search.
5. **Vercel Web Analytics**:
   - Enable `@vercel/analytics/react` (`<Analytics />` in `app/layout.tsx`) — cookieless, no personal data, documented in `docs/dependencies.md`.

## Affected Memory

- `architecture/overview`: (modify) Document the Part 1–7 launch-ready pilot architecture: `gitleaks` in CI, open-repository & governance files (`SECURITY.md`, `GOVERNANCE.md`, `.zenodo.json`, GitHub issue forms), centralized `contact.email` and `organisation.name` config, 4-item navigation (`The code`, `Map`, `What changed`, `About`), rebuilt MapLibre + `@protomaps/basemaps` `light` map with 8 ordered layers, build-time `place-index.json` (`pmtiles` + `@mapbox/vector-tile` + `MiniSearch`), Place Card with 6-group "Rules for this zone" and `#lat,lng,zoom,place` shareable hash, multi-sheet overlays, `/j/[id]/wards` ("Browse by ward"), `/llms.txt`, `/llms-full.txt`, `.md` page mirrors, `/api/v1/` static JSON API + OpenAPI 3.1, `schema.org/Legislation` JSON-LD, Frictionless `datapackage.json`, `/updates.xml` Atom feed, `/use-with-ai`, workshop verification flow (`bylaws tasks create`, `/verify/<task-set>`, `bylaws verify import`, two-Match threshold, release credits), `/pilot`, `/checks`, `/join`, `/press`, `"Report a problem"` links, `"Current as of"` dates, `docs/partners/*`, `next/og` social images, `sitemap.xml`, `robots.txt`, `404`, Vercel Web Analytics, and CI Lighthouse gates.
- `schemas/data-contracts`: (modify) Document the schema extensions in `schemas/overrides.schema.json` (`human_verifications[]`), `schemas/clause-tree.schema.json` / `schemas/parameters.schema.json` (`verifications[]` / `verified_by` metadata), OpenAPI 3.1 `/api/v1/openapi.json` contract, Frictionless `datapackage.json`, `place-index.json`, and workshop task-set JSON/CSV contracts.

## Impact

- **Repository Root, CI & Governance**: `.github/workflows/ci.yml`, `.github/ISSUE_TEMPLATE/*.yml`, `README.md`, `LICENSE`, `LICENSE-DATA.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, `GOVERNANCE.md`, `CITATION.cff`, `.zenodo.json`, `bylaws.toml`, `docs/dependencies.md`, `docs/progress.md`, `docs/partners/*.md`.
- **Schemas & Python Pipeline (`schemas/`, `pipeline/`)**: `schemas/overrides.schema.json`, `schemas/clause-tree.schema.json`, `schemas/parameters.schema.json`, `schemas/manifest.schema.json`, `pipeline/bylaws/cli.py`, `pipeline/bylaws/tasks.py`, `pipeline/bylaws/verify_records.py`, `pipeline/bylaws/overrides.py`, `pipeline/bylaws/validate.py`, `pipeline/bylaws/publish.py`, `pipeline/tests/*`.
- **Build & Verification Scripts (`scripts/`)**: `scripts/build_place_index.mjs`, `scripts/build_machine_readable.mjs`, `scripts/check_page_budgets.mjs`, `scripts/check_lighthouse.mjs`.
- **Next.js Web Application (`app/`, `components/`, `lib/`, `__tests__/`, `e2e/`)**:
  - Config & utilities: `lib/site-config.ts`, `lib/data.ts`, `lib/plain-language.ts`, `lib/map-style.ts`, `lib/place-search.ts`.
  - Navigation & layout: `components/TopNav.tsx`, `components/Footer.tsx`, `app/layout.tsx`, `app/not-found.tsx`, `app/sitemap.ts`, `app/robots.ts`, `app/opengraph-image.tsx`.
  - Map & Place Card & Browse by Ward: `app/j/[id]/page.tsx`, `app/j/[id]/wards/page.tsx`, `components/AreaExplorerClient.tsx`, `components/ZoneMap.tsx`, `components/PlaceCard.tsx`.
  - Machine/AI & JSON-LD: `app/use-with-ai/page.tsx`, `components/LegislationJsonLd.tsx`.
  - Verification UI: `app/verify/[taskSet]/page.tsx`, `components/VerifyTaskSetClient.tsx`.
  - Pilot, Checks, Join, Press, About, Home: `app/page.tsx`, `app/pilot/page.tsx`, `app/checks/page.tsx`, `app/join/page.tsx`, `app/press/page.tsx`, `app/about/page.tsx`, `components/ReportProblemLink.tsx`.

## Open Questions

- None for implementation — all tool choices and design decisions are explicitly fixed in `docs/plans/bengaluru-pilot-launch-plan.md` §2, and all owner-only actions (setting `contact.email` and organisation name, enabling Zenodo, reviewing `docs/partners/`, rotating/rewriting any `gitleaks` history findings if present, and making the repository public) are required by §3 and §5 to be listed in the PR's **Owner actions** section rather than executed by the agent.

## Assumptions

| # | Grade | Decision | Rationale | Scores |
|---|-------|----------|-----------|--------|
| 1 | Certain | Use only the exact tools specified in Section 2 (`maplibre-gl`, `@protomaps/basemaps` `light`, `pmtiles` + `@mapbox/vector-tile`, `minisearch`, MapLibre `image` source, `gitleaks`, Vercel Web Analytics, `next/og`) without evaluating alternatives | Explicitly mandated by user prompt and `docs/plans/bengaluru-pilot-launch-plan.md` §2 | S:100 R:95 A:100 D:100 |
| 2 | Certain | Open one draft PR with preview URL at top, commit and push after each part (Parts 1–7), and keep `docs/progress.md` and the PR's "Owner actions", "Decisions made", and "Known gaps" sections up to date | Explicitly mandated by user prompt and `docs/plans/bengaluru-pilot-launch-plan.md` §§3, 5 | S:100 R:95 A:100 D:100 |
| 3 | Certain | Never invent or rewrite legal text; generate every number shown on any page from dataset/report files at build time; keep code free of city-specific constants (Rule R1) | Explicitly mandated by `docs/plans/bengaluru-pilot-launch-plan.md` §3 and `fab/project/constitution.md` | S:100 R:100 A:100 D:100 |
| 4 | Certain | Do not process new land-use map sheets in this change; rebuild the map using existing data (4 processed sheets in Bengaluru South, 369 wards, 5 corporations) and display the diagonal hatch `"Land-use data not yet available"` elsewhere | Explicitly specified in `docs/plans/bengaluru-pilot-launch-plan.md` §1 ("Not in this plan: Processing more land-use map sheets") and §4 Part 2 | S:100 R:95 A:100 D:100 |
| 5 | Certain | Centralize `contact.email` and `organisation.name` in config (`bylaws.toml` + `lib/site-config.ts`) as owner placeholders and list them under "Owner actions" in the PR | Explicitly specified in `docs/plans/bengaluru-pilot-launch-plan.md` §4 Part 1.5, Part 5.7, and §5 | S:95 R:95 A:95 D:95 |
| 6 | Certain | Require two independent `Match` verdicts (and zero `Mismatch` verdicts) in `bylaws verify import <csv>` before marking a record `human_verified`, and open a review item on any `Mismatch` | Explicitly specified in `docs/plans/bengaluru-pilot-launch-plan.md` §4 Part 4.3 | S:100 R:90 A:95 D:100 |
| 7 | Certain | Require `--jurisdiction <id>` on `bylaws tasks create` and `bylaws verify import` (or resolve from task-set/CSV metadata while keeping `--jurisdiction` required on CLI subcommands) to preserve Rule R1 (`test_r1_no_hardcoding.py`) | Constitution II and `docs/memory/architecture/overview.md` require `--jurisdiction` with no default on jurisdiction-scoped `bylaws` CLI subcommands | S:85 R:90 A:90 D:85 |
| 8 | Certain | Generate static `.md` mirrors, `/llms.txt`, `/llms-full.txt`, `/api/v1/*`, `/api/v1/openapi.json`, `datapackage.json`, and `/updates.xml` into `public/` during `prebuild` / `publish` so static hosting and Next.js serve them with zero runtime server dependencies | Matches the read-only static Next.js architecture in `docs/memory/architecture/overview.md` and Part 3 | S:85 R:85 A:90 D:85 |

8 assumptions (8 certain, 0 confident, 0 tentative, 0 unresolved).
