# Intake: Bylaw One: The Guide, and One Job per Page

**Change**: 261127-nmcj-bylaw-one-guide
**Created**: 2026-11-27

## Origin

> Implement docs/plans/bylaw-one-guide-plan.md: open one draft PR with the preview URL at the top; Part 1 write docs/site-map.md giving every page one job, drive header and footer from one navigation config with no destination in both, remove duplicate links and buttons in page bodies, send Map and "Find rules by place" to the same route, list gaps once from declarations, make every repeated figure come from one generated value, and add CI checks for duplicate links and inconsistent figures; Part 2 write the guide as source files in content/guide/ with slide summaries, presenter notes and reading versions, generated figures, Mermaid diagrams and Playwright screenshots, using the content brief in Section 6 for narrative, principles, offers, timeline and sustainability; Part 3 build /guide in reading mode with audience entry points, contents and Present and Download buttons; Part 4 build /guide/slides with reveal.js and speaker view in the Bylaw One look; Part 5 build bylaw-one-guide.html as a single self-contained offline file with both modes, tested with the network disabled; describe the agent engine, packs and installers as planned; commit and push after each part, keep docs/progress.md current and the PR's "For owner review", "Decisions made" and "Known gaps" sections up to date; never invent or rewrite legal text.

One-shot `/fab-new` invocation from the self-contained specification `docs/plans/bylaw-one-guide-plan.md` ("Bylaw One: The Guide, and One Job per Page", dated 27 November 2026). Section 6 of `docs/plans/bylaw-one-guide-plan.md` provides the agreed content brief (narrative, principles, offers, workshop, launch timeline, and sustainability) to be used as written, and Section 2 specifies all tools (`reveal.js`, `mermaid`, `playwright`).

## Why

1. **Problem**:
   - **No unified guide across reading, presentation, and offline distribution**: Bylaw One needs one canonical guide explaining why it exists, what works today in the Bengaluru pilot, how it is built, the collective movement, the launch timeline, and how colleges, students, practitioners, developers, and partners/funders can take part — viewable in reading mode (`/guide`), slide presentation mode with speaker notes (`/guide/slides`), and a single self-contained offline HTML file (`bylaw-one-guide.html`).
   - **Duplicate links, overlapping pages, and figure mismatches across the live site**:
     - Navigation links are defined separately in `components/TopNav.tsx` and `components/Footer.tsx`, with `Map` appearing in both header and footer and `/guide` missing from the footer.
     - Page bodies repeat links to the same destination (e.g., Home subject cards link both the subject title and `"Read {title} →"` to `/j/<id>/topics/<slug>`, and recent changes items link both `"Open document →"` and the document heading to `/j/<id>/documents/<doc_id>`).
     - `"Map"` in the header (`/j/in-ka-bengaluru`) and `"Find rules by place"` on the home hero (`/j/in-ka-bengaluru-south`) point to different routes instead of one canonical Greater Bengaluru map route with the corporation selector.
     - Declared coverage gaps (`declarations.json`) are listed in full in multiple places (Home FAQ, About FAQ, Pilot) and contain duplicate entries for the July 2025 amendment (`not_modelled` vs `unobtainable_documents`).
     - Figures such as processed map sheets show mismatches (`1 sheets` vs `4 sheets`) and ungrammatical plurals when not sourced from a single generated value.
     - Home, Pilot, and About overlap in prose and FAQ content instead of each having one distinct job.
2. **Consequence**: Without a single-source guide (reading, slides, and offline HTML) and a strict "one job per page" cleanup backed by CI checks, talks at colleges and the launch event lack a consistent deck and leave-behind artifact, and visitors encounter redundant links, overlapping copy, and inconsistent counts across pages.
3. **Approach**: Execute Parts 1 through 5 of `docs/plans/bylaw-one-guide-plan.md` in order on one draft PR (with the preview URL at the top), committing and pushing after each part, keeping `docs/progress.md` and the PR description (`For owner review`, `Decisions made`, `Known gaps`) updated after every part, generating all figures from release data at build time, and enforcing single-job navigation, link deduplication, and figure consistency in CI.

## What Changes

### Fixed Decisions & Tool Stack (Section 2 & Section 3)

- **Guide routes & artifact**:
  - Reading mode at `/guide` (`app/guide/page.tsx`)
  - Slide mode at `/guide/slides` (`app/guide/slides/page.tsx`)
  - Single-file offline download at `/bylaw-one-guide.html` (`public/bylaw-one-guide.html`, also linked from `/guide` and `/data`, and attached to GitHub releases)
- **Audience entry points**: Colleges, students, practitioners, developers, partners and funders.
- **Internal repository & site context**: Includes the launch plan, funding options, and targets.
- **Honest status of unbuilt features**: Features not yet built (the local agent engine, layered data packs, native/desktop installers) MUST be described as **planned**, never as available; install steps are added only when they work.
- **Generated figures**: All figures are generated from the release at build time, never hand-typed.
- **Legal text integrity**: Never invent or rewrite legal text; quotes in the guide pass the citation check.
- **Tools & Licences**:
  - `reveal.js` (MIT) for slide mode (`/guide/slides` and offline file slide mode), including speaker view / presenter notes.
  - `mermaid` (MIT) for diagrams (rendered to SVG).
  - `@playwright/test` / `playwright` (Apache-2.0) for build-time screenshots (`1280 px` and `390 px`) and offline network-disabled verification.
  - Check licences of installed versions and record them in `docs/dependencies.md` and the permissive licence check.

---

### Part 1 — One Job per Page

1. **Page inventory (`docs/site-map.md`)**:
   - List every route with its purpose in one line in `docs/site-map.md`:
     - **Home (`/`)**: the story and the doorway (problem, FAR story, subjects, recent changes, short FAQ).
     - **The code (`/j/[id]/topics`, `/j/[id]/topics/[topic]`, `/j/[id]/documents/[doc]`)**: subjects and what applies today.
     - **Map (`/j/[id]`, `/j/[id]/wards`)**: rules by place.
     - **What changed (`/j/[id]/timeline`)**: instruments and changes, newest first.
     - **About (`/about`)**: who runs Bylaw One, principles, licences, how it is built.
     - **Pilot (`/pilot`)**: live status, gaps, roadmap.
     - **How we check (`/checks`)**: automated build checks, measured results, and verification counts.
     - **Use with AI (`/use-with-ai`)**: how to use `llms.txt`, `.md` pages, and `/api/v1/` today, plus AI honesty rules.
     - **Join (`/join`)**: how colleges, students, practitioners, and civic groups take part.
     - **Press (`/press`)**: press description, generated screenshots, logos, and contact details.
     - **Sources (`/j/[id]/sources`)**: full source register with provenance, checksums, and archive links.
     - **Data (`/data`)**: bulk downloads, schemas, data package, and the offline guide file.
     - **Verify (`/verify/[taskSet]`)**: browser verification task sheet for workshops.
     - **Guide (`/guide`, `/guide/slides`)**: the complete Bylaw One guide in reading mode, slide mode, and single-file download.
2. **Navigation from one config (`lib/navigation.ts`, `components/TopNav.tsx`, `components/Footer.tsx`)**:
   - Drive header and footer from a single navigation configuration module (`lib/navigation.ts`).
   - **Header**: `The code`, `Map`, `What changed`, `About`.
   - **Footer**: `Guide` (`/guide`), `Pilot` (`/pilot`), `How we check` (`/checks`), `Use with AI` (`/use-with-ai`), `Join` (`/join`), `Press` (`/press`), `Sources` (`/j/<id>/sources`), `Data and downloads` (`/data`), `Licence` (`/about#licence`).
   - **Rule**: No destination (`href` path) appears in both header and footer (remove `Map` from footer; footer anchors such as `"Licence"` (`/about#licence`) or `"How this is built"` (`/about#how-this-is-built`) carry distinct `#fragment` targets pointing to About sections without duplicating the bare `/about` header item).
3. **No repeated calls to action on one page**:
   - Each page links to a destination at most once in its body (or at most twice only when one is near the top hero and one is in a closing section, as with `"Read the code"` on Home).
   - Remove duplicate buttons and duplicate links within cards:
     - On Home (`app/page.tsx`): in subject cards (`home-subject-list`), keep one link per subject to `/j/${targetJurId}/topics/${subj.slug}` (remove the duplicate title/CTA link pair so each subject card links once) and remove per-row `"Open map"` links that repeat the map destination across rows; in `home-recently-changed`, keep one link per document to `/j/${targetJurId}/documents/${doc.doc_id}` instead of both `"Open document →"` and a linked title.
     - Audit all other pages (`/pilot`, `/about`, `/checks`, `/join`, `/press`, `/use-with-ai`, `/data`, `/j/[id]`, `/j/[id]/topics`, `/j/[id]/topics/[topic]`, `/j/[id]/timeline`, `/j/[id]/sources`, `/j/[id]/wards`) and remove any duplicate body links to the same destination.
4. **One map address**:
   - Both header `"Map"` and home hero `"Find rules by place"` (and any other map entry link) resolve to the same canonical Greater Bengaluru map route (`/j/in-ka-bengaluru`, which displays Greater Bengaluru with the corporation selector and loads the zone/ward layers).
5. **One source for gaps**:
   - Deduplicate the missing/unobtainable list derived from `declarations.json` in `lib/pilot-metrics.ts` (so the 15 July 2025 draft amendment notification `UDD 83 BMR 2024` appears once, not twice across `unobtainable_documents` and `not_modelled`).
   - **Home (`app/page.tsx`)**: in `"What is missing?"`, show a concise summary sentence with a link to `/pilot#what-is-missing` rather than repeating the full list.
   - **About (`app/about/page.tsx`)**: remove the duplicate `"What is missing?"` list (and duplicate FAQ items that repeat Home), keeping About focused on who runs Bylaw One, principles, how it is built, how disagreements are handled, and licences.
   - **Pilot (`app/pilot/page.tsx`)**: holds the single full deduplicated list of what is missing (`#what-is-missing`).
6. **Consistent figures**:
   - Every count shown in more than one place comes from the same generated value in `lib/pilot-metrics.ts` / `data/reports/in-ka-bengaluru-south/map-verification.json` (and dataset files).
   - Fix the processed map sheets count mismatch (`4 sheets` everywhere — ensure `fetchMapVerificationMetrics` / `map-verification.json` reports all 4 processed RMP 2015 sheets `rmp2015-pd-210-a`, `rmp2015-pd-210-b`, `rmp2015-pd-211-a`, `rmp2015-pd-211-b` and uses proper singular/plural formatting `1 sheet` vs `4 sheets`).
7. **Overlapping pages cleanup (`Home`, `Pilot`, `About`)**:
   - Ensure Home, Pilot, and About do not repeat each other's paragraphs:
     - **Home**: teases the problem, shows the interactive FAR story, lists subjects, shows recent changes, and has a short 4-question FAQ (`Is this official?`, `Where does the text come from?`, `What happens when rules disagree?`, `What is missing?` summary + link to Pilot).
     - **Pilot**: gives live status metrics, the full deduplicated list of gaps, and the 4-step roadmap.
     - **About**: explains who runs Bylaw One, core principles, how the 4-layer code is built, the 6-step statutory disagreement order, verification model, and open licences.
8. **CI link and figure check (`scripts/check_site_consistency.mjs` / `__tests__/`)**:
   - Fail the build if:
     - (a) a destination appears in both header and footer;
     - (b) a page body (`<main>`) links to the same destination (`href`) more than twice (or more than once outside an allowed hero+closing pair);
     - (c) the same figure (documents in force, issuing bodies, provisions, rules as data, corporations, wards, processed sheets, map coverage %, human verified count, checks per build, current-as-of date) has different values across pages.

---

### Part 2 — Guide Content as Source Files (`content/guide/`)

1. **Source files in `content/guide/`**:
   - Write the guide sections in `content/guide/` following Section 5's outline (`00-opening.md` through `11-contact-and-citing.md` plus a manifest/loader in `lib/guide.ts`):
     - `00-opening.md` — **Opening**: `"Bengaluru's building rules. One code."` The problem in one picture. The pilot in live numbers.
     - `01-why-this-exists.md` — **1. Why this exists**
     - `02-see-it-working.md` — **2. See it working**: FAR story; a subject page; the map place card; a verification task
     - `03-how-its-built.md` — **3. How it's built**: sources; structure; rules as data; settling overlaps; checks; the map; machines and AI
     - `04-principles.md` — **4. Principles**
     - `05-the-movement.md` — **5. The movement**: roles; layered packs (planned); state stewards
     - `06-take-part.md` — **6. Take part**: colleges; students; practitioners; civic and data groups; how credit works; the one-day workshop
     - `07-for-developers.md` — **7. For developers**: repository layout; data model; running the pipeline; adding a source or a city; the planned pack format; the planned agent engine; contribution rules
     - `08-the-launch.md` — **8. The launch**: timeline; what happens at the launch; workshops and internships
     - `09-sustainability.md` — **9. Sustainability**: funding options; how Bylaw One is run; success measures
     - `10-whats-missing-and-next.md` — **10. What's missing and what's next**
     - `11-contact-and-citing.md` — **11. Contact and how to cite**
   - Each section file contains structured frontmatter/blocks for:
     - **Slide summary**: at most 40 words, one idea (enforced by unit/CI check).
     - **Presenter notes**: speaker notes for reveal.js speaker view.
     - **Reading version**: fuller text, at most ~400 words per section unless a table or diagram needs more.
     - Optional additional slides for key diagrams and screenshots so every slide carries one idea.
2. **Generated values (`{{placeholder}}` interpolation from `computeDatasetPilotMetrics()`)**:
   - Replace placeholders at build/render time from release data, never hand-typed:
     - `{{documents_in_force}}`
     - `{{registered_sources}}`
     - `{{issuing_bodies}}`
     - `{{provisions}}`
     - `{{rules_as_data}}`
     - `{{corporations}}`
     - `{{wards}}`
     - `{{processed_sheets}}`
     - `{{active_zones}}`
     - `{{map_coverage_pct}}`
     - `{{verified_by_people}}`
     - `{{machine_checked}}`
     - `{{checks_per_build}}`
     - `{{current_as_of}}`
     - `{{release_version}}`
     - `{{dataset_id}}`
     - `{{contact_email}}`
     - `{{organisation_name}}`
3. **Six Mermaid diagrams (rendered to SVG at build time and stored in `public/guide/diagrams/` + inlined)**:
   1. `sources-to-one-code`: Official sources converging into one code.
   2. `how-a-rule-travels`: How FAR travels across instruments (`2004 → 2007 → 2017 → 2025 → today`).
   3. `data-layers`: The data layers (`sources → structure → rules as data → resolution → site`).
   4. `checks-pipeline`: The 10-check automated verification & human verification pipeline.
   5. `layered-packs`: Layered packs (`national → state → city` with `adopted`, `adopted with changes`, `reference only` — marked **planned**).
   6. `agent-engine-four-doors`: The agent engine's four doors (`Local MCP server`, `CLI`, `Agent Skill`, `Open data files` — marked **planned**).
4. **Playwright screenshots (`scripts/build_guide_assets.mjs` -> `public/guide/screenshots/`)**:
   - Generated with Playwright from the built site at `1280 px` (desktop) and `390 px` (mobile) for all 6 required views:
     1. Home hero (`home-hero-1280.png`, `home-hero-390.png`)
     2. FAR story step (`far-story-1280.png`, `far-story-390.png`)
     3. A subject page (`subject-far-1280.png`, `subject-far-390.png`)
     4. The map with a place card (`map-place-card-1280.png`, `map-place-card-390.png`)
     5. A verify task (`verify-task-1280.png`, `verify-task-390.png`)
     6. The pilot page (`pilot-page-1280.png`, `pilot-page-390.png`)
5. **Content brief fidelity (Section 6)**:
   - Use Section 6's wording for:
     - **6.1 The narrative** (including the three ideas **Open**, **Cited**, **Collective**, and closing line **Read. Trace. Compare.**)
     - **6.2 Principles** (6 principles)
     - **6.3 How the work is organised** (State stewards, Contributors, Reviewers, Maintainers, brand under owner's organisation)
     - **6.4 Layered packs (planned)**
     - **6.5 The agent engine (planned, for the launch)**
     - **6.6 Why colleges, students and practitioners take part**
     - **6.7 The workshop (one day)** (5 sessions + 2-hour faculty session)
     - **6.8 Launch timeline** (`30 Nov – 6 Dec 2026` through `Dec 2027`)
     - **6.9 Sustainability** (income sources table + pilot-year success measures with stated goals and current generated values)

---

### Part 3 — Reading Mode (`/guide` — `app/guide/page.tsx`)

- **Layout**: Bylaw One design (`#f5f3ed` paper background, `#080909` ink text, `#c8ccc0` hairline rules, `#ff6b52` single coral accent); one main reading column with a sticky table of contents (`<nav aria-label="Guide contents">`).
- **Audience entry points at the top**:
  - `"I'm from a college"`
  - `"I'm a student"`
  - `"I'm a practitioner"`
  - `"I'm a developer"`
  - `"I'm a partner or funder"`
  Each card/button jumps to or highlights a curated path of the 4–6 sections most relevant to that audience, with direct anchor links to each section.
- **Section rendering**:
  - Shows each section's reading version, inline SVG Mermaid diagrams, and responsive desktop/mobile screenshots (with `<details>` expanders where long or for mobile/speaker notes inspection).
- **Top & per-section actions**:
  - `"Present"` button at the top (`/guide/slides`) and `"Start from section"` / `"Present from here"` link on each section (`/guide/slides#slide-<slug>`).
  - `"Download guide (single file)"` button linking to `/bylaw-one-guide.html` (`download="bylaw-one-guide.html"`).
- **Budgets & accessibility**:
  - Passes `scripts/check_page_budgets.mjs` (`HTML <= 300 KB`, initial `JS + data <= 1.5 MB`) and zero `axe-core` WCAG 2.2 AA violations.

---

### Part 4 — Slide Mode (`/guide/slides` — `app/guide/slides/page.tsx`)

- **Engine**: Powered by `reveal.js` (MIT), initialized on the client with keyboard navigation (arrow keys, space, `F` for fullscreen, `S` for speaker view / presenter notes overlay, `Esc`/`O` for overview) plus an accessible on-screen toolbar (`Prev`, `Next`, `Notes`, `Fullscreen`, `Reading mode`).
- **Slide structure**:
  - Opening title slide + one slide per section summary (`<= 40 words`, one idea per slide) + dedicated slides for the 6 diagrams and 6 screenshots.
  - Presenter notes (`<aside class="notes">`) populated from each section's source file, visible in reveal.js speaker view and toggleable notes panel.
- **Bylaw One visual theme**:
  - `#f5f3ed` paper background, `#080909` ink text, `Inter Tight` headings, `Source Serif 4` body/quotes, `JetBrains Mono` labels/numbers, and `#ff6b52` coral accent used strictly for the current item indicator.
- **Deep linking & offline readiness**:
  - Supports `#slide-<section-slug>` / `#/<index>` so clicking `"Start from section"` on `/guide` opens `/guide/slides` directly at that section.
  - Works offline once loaded (all diagrams inline SVG, screenshots local).

---

### Part 5 — Single-File Download (`public/bylaw-one-guide.html` & `scripts/build_guide_bundle.mjs`)

- **Build step (`scripts/build_guide_bundle.mjs`)**:
  - Produces `public/bylaw-one-guide.html` during `prebuild` / build.
  - Contains **both reading mode and slide mode in one self-contained HTML file**, with a `"Present"` / `"Reading mode"` toggle that switches modes (and `"Start from section"` buttons in reading mode that open slide mode at that section).
  - Inlines **all** CSS, JavaScript (including `reveal.js` core/notes controller), subset WOFF2 fonts (`data:font/woff2;base64,...`), pre-rendered SVG Mermaid diagrams, and compressed `data:image/...;base64,...` screenshots.
  - Makes **zero external network requests** (no external stylesheets, scripts, fonts, images, or fetch calls; CSP `default-src 'none'; img-src data:; font-src data:; style-src 'unsafe-inline'; script-src 'unsafe-inline'`).
- **Size & metadata**:
  - Total file size `<= 10 MB` (enforced by build check).
  - Title header shows the release version (`v4.0.0`), `dataset_id`, and the date generated (`27 November 2026` / `currentAsOfDate`).
- **Distribution**:
  - Linked from `/guide` (`"Download guide (single file)"`) and published on `/data` (`app/data/page.tsx`).
  - Added to the GitHub release workflow / release artifacts list.
- **Playwright offline test**:
  - Open `bylaw-one-guide.html` in Playwright with `context.route('**/*', ...)` / `context.setOffline(true)` blocking all network requests, verify zero failed network requests, verify reading mode renders all sections/diagrams/images, click `"Present"` to switch to slide mode, navigate slides via keyboard, and toggle presenter notes.

## Affected Memory

- `architecture/overview`: (modify) Document the one-job-per-page architecture (`docs/site-map.md`, centralized `lib/navigation.ts` with disjoint header/footer destinations, deduplicated `declarations.json` gaps, single-source generated figures, CI link and figure consistency checks) and the three-form Bylaw One Guide (`content/guide/*.md`, `/guide` reading mode with 5 audience entry points, `/guide/slides` reveal.js slide deck with speaker notes, and `public/bylaw-one-guide.html` self-contained offline dual-mode bundle verified with network disabled).

## Impact

- **Documentation & Plans**: `docs/site-map.md`, `docs/progress.md`, `docs/dependencies.md`.
- **Guide Content (`content/guide/`)**: `content/guide/00-opening.md` through `content/guide/11-contact-and-citing.md`.
- **Navigation & Shared Libraries (`lib/`, `components/`)**:
  - `lib/navigation.ts` (new single navigation config for header and footer)
  - `lib/guide.ts` (guide content parser, placeholder interpolator, audience path definitions, and diagram/screenshot registry)
  - `lib/pilot-metrics.ts` (deduplicated missing/unobtainable items, accurate 4-sheet count from `map-verification.json`)
  - `components/TopNav.tsx`, `components/Footer.tsx`
- **Pages (`app/`)**:
  - `app/guide/page.tsx` (new reading mode page)
  - `app/guide/slides/page.tsx` and `components/GuideSlidesClient.tsx` (new reveal.js slide mode page)
  - `app/page.tsx`, `app/pilot/page.tsx`, `app/about/page.tsx`, `app/data/page.tsx`, `app/sitemap.ts`
- **Build & CI Scripts (`scripts/`, `__tests__/`, `e2e/`)**:
  - `scripts/check_site_consistency.mjs` (CI check for disjoint header/footer links, max body link frequency, and cross-page figure consistency)
  - `scripts/build_guide_assets.mjs` (renders Mermaid diagrams to SVG and captures Playwright screenshots at `1280 px` and `390 px`)
  - `scripts/build_guide_bundle.mjs` (builds self-contained `public/bylaw-one-guide.html` `<= 10 MB` with inlined CSS, JS, fonts, SVGs, and base64 images)
  - `e2e/guide.spec.ts` (Playwright tests for `/guide`, `/guide/slides`, and offline `bylaw-one-guide.html` with network disabled)

## Open Questions

- None — `docs/plans/bylaw-one-guide-plan.md` is self-contained, includes the complete content brief in Section 6, and specifies all tools, routes, and acceptance criteria. Items requiring owner sign-off (narrative wording, launch dates, sustainability section) are explicitly designated for the PR's **For owner review** section per Section 7.

## Assumptions

| # | Grade | Decision | Rationale | Scores |
|---|-------|----------|-----------|--------|
| 1 | Certain | Use `reveal.js` (MIT) for `/guide/slides`, `mermaid` (MIT) for diagrams, and `@playwright/test` (Apache-2.0) for build-time screenshots and offline tests, recording their versions and licences in `docs/dependencies.md` | Explicitly specified in `docs/plans/bylaw-one-guide-plan.md` §2 | S:100 R:95 A:100 D:100 |
| 2 | Certain | Drive both `TopNav` and `Footer` from one config (`lib/navigation.ts`) with zero overlap between header (`The code`, `Map`, `What changed`, `About`) and footer (`Guide`, `Pilot`, `How we check`, `Use with AI`, `Join`, `Press`, `Sources`, `Data and downloads`, `Licence`) | Explicitly specified in `docs/plans/bylaw-one-guide-plan.md` §4 Part 1.2 | S:100 R:95 A:100 D:100 |
| 3 | Certain | Point both header `Map` and home hero `"Find rules by place"` to the Greater Bengaluru map route (`/j/in-ka-bengaluru`) with the corporation selector | Explicitly specified in `docs/plans/bylaw-one-guide-plan.md` §4 Part 1.4 | S:100 R:95 A:100 D:100 |
| 4 | Certain | Describe the local agent engine, layered data packs, and one-click/native installers strictly as **planned** and include no install commands for unbuilt software | Explicitly specified in `docs/plans/bylaw-one-guide-plan.md` §§2, 6.4, 6.5, 8 | S:100 R:100 A:100 D:100 |
| 5 | Certain | Generate all repeated counts from `computeDatasetPilotMetrics()` / release artifacts at build time and enforce cross-page figure equality and link deduplication in CI | Explicitly specified in `docs/plans/bylaw-one-guide-plan.md` §§2, 4 Part 1.5–1.8 | S:100 R:95 A:100 D:100 |
| 6 | Certain | Produce `public/bylaw-one-guide.html` (`<= 10 MB`) with all CSS, JS, subset fonts, SVG diagrams, and compressed screenshots inlined so it works in both reading and slide modes with network disabled | Explicitly specified in `docs/plans/bylaw-one-guide-plan.md` §4 Part 5 | S:100 R:90 A:95 D:100 |
| 7 | Certain | Open one draft PR with the preview URL at the top, commit and push after each of Parts 1–5, and maintain `docs/progress.md` and the PR's `For owner review`, `Decisions made`, and `Known gaps` sections | Explicitly specified in `docs/plans/bylaw-one-guide-plan.md` §§3, 7 | S:100 R:95 A:100 D:100 |

7 assumptions (7 certain, 0 confident, 0 tentative, 0 unresolved).
