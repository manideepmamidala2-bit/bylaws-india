# Plan: Bylaw One: The Guide, and One Job per Page

**Change**: 261127-nmcj-bylaw-one-guide
**Intake**: `intake.md`

## Requirements

### Web Architecture: One Job per Page and Site-Wide Consistency (Part 1)

#### R1: Page Inventory, Single-Config Disjoint Navigation, Deduplicated Links/Gaps, Unified Map Route, and CI Consistency Gate
The repository and web application MUST assign every route a single clear purpose in `docs/site-map.md`, drive the header (`components/TopNav.tsx`) and footer (`components/Footer.tsx`) from one navigation configuration (`lib/navigation.ts`) with zero destination overlap between header and footer, eliminate duplicate calls to action and duplicate destination links within page bodies and cards, route both header `"Map"` and home hero `"Find rules by place"` to the same Greater Bengaluru map route (`/j/in-ka-bengaluru`), list declared coverage gaps from `declarations.json` once without duplication on `/pilot` while showing only a concise summary with a link on `/` and removing duplicate gap/FAQ sections from `/about`, derive every repeated figure from a single generated source in `lib/pilot-metrics.ts` (including fixing the `4 sheets` count and singular/plural formatting), and enforce link and figure consistency in CI (`scripts/check_site_consistency.mjs`).

- **GIVEN** the built Next.js application and `docs/site-map.md`
- **WHEN** `scripts/check_site_consistency.mjs` and unit/E2E tests inspect `docs/site-map.md`, `lib/navigation.ts`, `TopNav`, `Footer`, and all rendered pages
- **THEN** `docs/site-map.md` lists every route with its one-line job, header (`The code`, `Map`, `What changed`, `About`) and footer (`Guide`, `Pilot`, `How we check`, `Use with AI`, `Join`, `Press`, `Sources`, `Data and downloads`, `Licence`) share zero destinations, both `"Map"` and `"Find rules by place"` link to `/j/in-ka-bengaluru`, no page body links to the same destination more than twice (and card items do not contain duplicate links to the same target), the July 2025 amendment gap appears at most once in the Pilot gap list, and every repeated count (`documents`, `bodies`, `provisions`, `rules as data`, `corporations`, `wards`, `processed sheets = 4`, `map coverage %`, `verified by people`, `checks per build`, `current as of`) is identical across pages

### Guide Content & Asset Pipeline: Single Source in `content/guide/` (Part 2)

#### R2: Markdown Guide Source Sections, Build-Time Generated Placeholders, Mermaid SVG Diagrams, and Playwright Screenshots
The guide MUST be authored as structured Markdown source files in `content/guide/` (`00-opening.md` through `11-contact-and-citing.md`) parsed by `lib/guide.ts`, where each section provides a slide summary (`<= 40 words`, one idea), presenter notes, and a reading version (`<= ~400 words` for prose sections), interpolates all counts and metadata (`{{documents_in_force}}`, `{{provisions}}`, `{{rules_as_data}}`, `{{wards}}`, `{{map_coverage_pct}}`, `{{verified_by_people}}`, `{{checks_per_build}}`, `{{current_as_of}}`, etc.) from `computeDatasetPilotMetrics()` at build/render time, includes the six Mermaid diagrams rendered to SVG (`sources-to-one-code`, `how-a-rule-travels`, `data-layers`, `checks-pipeline`, `layered-packs`, `agent-engine-four-doors`) and Playwright screenshots captured at `1280 px` and `390 px` for six views (`home-hero`, `far-story`, `subject-far`, `map-place-card`, `verify-task`, `pilot-page`), follows the Section 6 content brief for narrative, principles, roles, layered packs, agent engine, college/student/practitioner offers, one-day workshop, launch timeline, and sustainability, describes unbuilt features (agent engine, layered packs, installers) strictly as **planned** with no unbuilt install commands, and never invents or rewrites legal text.

- **GIVEN** the source files in `content/guide/` and the release dataset
- **WHEN** the guide loader (`lib/guide.ts`), asset generator (`scripts/build_guide_assets.mjs`), and tests run
- **THEN** all 12 sections (`00-opening` through `11-contact-and-citing`) load with slide summaries `<= 40 words`, presenter notes, and reading versions with zero unreplaced `{{...}}` placeholders, all 6 Mermaid diagrams exist as valid SVGs, all 12 Playwright screenshots (`6 views × {1280px, 390px}`) exist under `public/guide/screenshots/`, all quoted legal excerpts match official source text, and the agent engine, packs, and installers are explicitly marked as planned

### Web Guide Views: Reading Mode and Slide Mode (Parts 3 & 4)

#### R3: Reading Mode at `/guide` with Audience Entry Points, Sticky Contents, Diagrams, Screenshots, and Present/Download Actions
The web application MUST serve the reading mode of the guide at `/guide` (`app/guide/page.tsx`) in the Bylaw One design (`#f5f3ed` paper, `#080909` ink, one column with a sticky table of contents), featuring five audience entry points at the top (`"I'm from a college"`, `"I'm a student"`, `"I'm a practitioner"`, `"I'm a developer"`, `"I'm a partner or funder"`) that jump to curated section paths, rendering each section's reading version with inline SVG diagrams, screenshots, and `<details>` disclosures where appropriate, and providing `"Present"` (`/guide/slides` and per-section `"Start from section"` links `/guide/slides#slide-<slug>`) and `"Download guide (single file)"` (`/bylaw-one-guide.html`) buttons while passing page weight budgets and `axe-core` WCAG 2.2 AA checks.

- **GIVEN** the built Next.js application
- **WHEN** a user or Playwright test visits `/guide` at `390 px` and `1280 px`
- **THEN** the page renders the sticky contents list, all 5 audience entry points with section jump paths, all 12 guide sections with generated numbers, diagrams, and screenshots, working `"Present"` / `"Start from section"` links to `/guide/slides`, and a `"Download guide (single file)"` link to `/bylaw-one-guide.html`, within page budgets and with zero `axe-core` WCAG 2.2 AA violations

#### R4: Slide Mode at `/guide/slides` with `reveal.js`, Speaker View, Keyboard Controls, and Bylaw One Theme
The web application MUST serve the slide deck mode of the guide at `/guide/slides` (`app/guide/slides/page.tsx`, `components/GuideSlidesClient.tsx`) powered by `reveal.js` (MIT), rendering one slide per section summary plus dedicated slides for key diagrams and screenshots, presenter notes from the source files accessible via speaker view / notes panel, keyboard navigation, fullscreen toggle, `"Start from section"` hash deep-linking (`#slide-<slug>`), and offline operation once loaded, styled in the Bylaw One aesthetic (`#f5f3ed` paper background, `#080909` ink text, `Inter Tight` headings, and `#ff6b52` coral accent for the current item only).

- **GIVEN** `/guide/slides` opened in a browser or Playwright test
- **WHEN** the user navigates slides via keyboard or controls, opens a `#slide-<slug>` deep link from `/guide`, or opens speaker notes
- **THEN** `reveal.js` transitions between section summary, diagram, and screenshot slides in the Bylaw One look, jumps to the targeted section when `#slide-<slug>` is present, displays the section's presenter notes in speaker view, and passes `axe-core` accessibility checks

### Self-Contained Offline Distribution (Part 5)

#### R5: Single-File Self-Contained Offline Guide (`bylaw-one-guide.html`) with Dual Modes and Network-Disabled Verification
A build script (`scripts/build_guide_bundle.mjs`) MUST generate `public/bylaw-one-guide.html` (`<= 10 MB`) containing both reading mode and slide mode in a single HTML file (switched via a `"Present"` / `"Reading mode"` toggle and per-section `"Start from section"` buttons) with all CSS, JavaScript (`reveal.js`), subset WOFF2 fonts, pre-rendered SVG Mermaid diagrams, and compressed screenshots inlined as data URIs / inline markup so it makes zero network requests, displays the release version, `dataset_id`, and generated date on its title page, is linked from `/guide` and `/data` (`app/data/page.tsx`) and attached to GitHub releases (`.github/workflows/ci.yml`), and passes a Playwright test that opens the file with the network disabled and verifies both modes.

- **GIVEN** the generated `public/bylaw-one-guide.html` file
- **WHEN** its file size is checked and Playwright opens `bylaw-one-guide.html` with all network requests blocked (`context.setOffline(true)` / route abort)
- **THEN** the file size is `<= 10 MB`, zero external network requests are attempted, the title page displays the release version, `dataset_id`, and generated date, reading mode displays all guide sections, diagrams, and screenshots, and toggling `"Present"` switches to slide mode with working keyboard navigation and speaker notes

### Non-Goals
- Building or shipping the local MCP/CLI agent engine, layered data packs, or desktop installers — these are described strictly as **planned** per Sections 2 and 6.4–6.5.
- Processing additional RMP 2015 land-use map sheets beyond the existing 4 processed sheets in Bengaluru South.
- Inventing, paraphrasing, or altering any statutory/legal text inside quoted provisions.

### Design Decisions

#### Single Source in `content/guide/` Feeding Three Outputs
**Decision**: Store the guide as numbered Markdown files (`content/guide/00-opening.md` through `11-contact-and-citing.md`) with structured sections (`## Slide summary`, `## Presenter notes`, `## Reading`) and `{{placeholder}}` tokens resolved by `lib/guide.ts` from `computeDatasetPilotMetrics()`, feeding `/guide`, `/guide/slides`, and `public/bylaw-one-guide.html`.
**Why**: Guarantees that slide summaries, speaker notes, reading prose, and live dataset counts never drift across the web reading view, the `reveal.js` presentation deck, and the offline single-file HTML bundle.
**Rejected**: Maintaining separate TSX/HTML files for `/guide`, `/guide/slides`, and the downloadable HTML file, which would duplicate text and risk inconsistent figures.
*Introduced by*: 261127-nmcj-bylaw-one-guide

#### Disjoint Header and Footer Navigation from One Config (`lib/navigation.ts`)
**Decision**: Define `HEADER_NAV_ITEMS` (`The code`, `Map`, `What changed`, `About`) and `FOOTER_NAV_ITEMS` (`Guide`, `Pilot`, `How we check`, `Use with AI`, `Join`, `Press`, `Sources`, `Data and downloads`, `Licence`) in `lib/navigation.ts`, consumed by both `TopNav.tsx` and `Footer.tsx` and verified by `scripts/check_site_consistency.mjs`.
**Why**: Enforces the "one job per page" and "no destination in both header and footer" rules from a single source of truth.
**Rejected**: Keeping independent link arrays in `TopNav.tsx` and `Footer.tsx`, which caused `Map` to appear in both and allowed navigation drift.
*Introduced by*: 261127-nmcj-bylaw-one-guide

## Tasks

### Phase 1: One Job per Page & Navigation Cleanup (Part 1)

- [x] T001 Write `docs/site-map.md`, create `lib/navigation.ts` driving `components/TopNav.tsx` and `components/Footer.tsx` with no destination in both, point `Map` and `"Find rules by place"` to `/j/in-ka-bengaluru`, deduplicate gaps and page body links across `app/page.tsx`, `app/pilot/page.tsx`, `app/about/page.tsx`, and other pages, fix the 4-sheet count and plural formatting in `lib/pilot-metrics.ts` and `lib/data.ts`, add CI checks in `scripts/check_site_consistency.mjs` and `__tests__/site-consistency.test.ts`, update `docs/progress.md`, commit, push, and open the draft PR <!-- R1 -->

### Phase 2: Guide Source Content, Diagrams & Screenshots (Part 2)

- [x] T002 Install `reveal.js` and `mermaid` (recording licences in `docs/dependencies.md`), write the 12 guide source files in `content/guide/00-opening.md` through `11-contact-and-citing.md` using the Section 6 content brief and `{{placeholder}}` tokens, implement `lib/guide.ts` and `scripts/build_guide_assets.mjs` to generate the 6 Mermaid SVG diagrams (`public/guide/diagrams/*.svg`) and 12 Playwright screenshots at `1280 px` and `390 px` (`public/guide/screenshots/*.png`), add unit tests in `__tests__/guide-content.test.ts`, update `docs/progress.md`, commit, and push Part 2 <!-- R2 -->

### Phase 3: Reading Mode `/guide` & Slide Mode `/guide/slides` (Parts 3 & 4)

- [x] T003 Implement `/guide` reading mode in `app/guide/page.tsx` and `components/GuideReaderClient.tsx` with sticky contents, 5 audience entry points (`college`, `student`, `practitioner`, `developer`, `partner-funder`), inline SVG diagrams, responsive screenshots, `"Present"` / `"Start from section"` buttons, and `"Download guide (single file)"` button, verify page budgets and `axe-core` accessibility, update `docs/progress.md`, commit, and push Part 3 <!-- R3 -->
- [x] T004 Implement `/guide/slides` in `app/guide/slides/page.tsx` and `components/GuideSlidesClient.tsx` using `reveal.js` with one slide per section summary (`<= 40 words`), dedicated diagram and screenshot slides, presenter notes / speaker view, keyboard & fullscreen navigation, `#slide-<slug>` deep-linking from `/guide`, and Bylaw One styling (`#f5f3ed` paper, `#080909` ink, `#ff6b52` current-item accent), update `docs/progress.md`, commit, and push Part 4 <!-- R4 -->

### Phase 4: Single-File Offline Bundle & End-to-End Verification (Part 5)

- [x] T005 Implement `scripts/build_guide_bundle.mjs` to build `public/bylaw-one-guide.html` (`<= 10 MB`) with both reading and slide modes, inlined CSS, JS, subset WOFF2 fonts, SVG diagrams, and base64 screenshots (zero network requests), link it on `/data` (`app/data/page.tsx`) and in `.github/workflows/ci.yml`, add Playwright tests in `e2e/guide.spec.ts` testing `/guide`, `/guide/slides`, and `bylaw-one-guide.html` with network disabled, capture final PR screenshots, update `docs/progress.md` and the PR body, commit, and push Part 5 <!-- R5 -->

## Execution Order

- T001 establishes the cleaned site routes, single navigation config, consistent figures, and draft PR required before capturing screenshots in T002.
- T002 creates `content/guide/*`, `lib/guide.ts`, SVG diagrams, and Playwright screenshots consumed by T003, T004, and T005.
- T003 and T004 build `/guide` and `/guide/slides`, which T005 mirrors into the offline single-file HTML bundle and tests end-to-end with Playwright.

## Acceptance

### Functional Completeness

- [ ] A-001 R1: `docs/site-map.md` exists and lists every route with its purpose in one line.
- [ ] A-002 R1: Header (`TopNav.tsx`) and footer (`Footer.tsx`) read from one navigation config (`lib/navigation.ts`), and no destination appears in both header and footer.
- [ ] A-003 R1: No page body links to the same destination more than twice, duplicate links/buttons within cards are removed, `"Map"` and `"Find rules by place"` resolve to the same route (`/j/in-ka-bengaluru`), gaps from `declarations.json` are deduplicated and listed in full only on `/pilot`, and every repeated figure comes from one generated value (`4 sheets` everywhere).
- [ ] A-004 R2: `content/guide/` contains all sections from Section 5's outline with slide summaries (`<= 40 words`), presenter notes, and reading versions, generated `{{placeholder}}` figures from release data, 6 Mermaid SVG diagrams, and 12 Playwright screenshots (`1280 px` and `390 px`).
- [ ] A-005 R3: `/guide` renders in reading mode in the Bylaw One design with a sticky contents list, 5 audience entry points (`college`, `student`, `practitioner`, `developer`, `partner or funder`), inline diagrams, screenshots, and `"Present"` and `"Download guide (single file)"` buttons.
- [ ] A-006 R4: `/guide/slides` renders with `reveal.js`, keyboard navigation, fullscreen, speaker view / presenter notes, `"Start from section"` deep-linking, and the Bylaw One look (`#f5f3ed` paper, `#080909` ink, `Inter Tight` headings, `#ff6b52` accent for current item only).
- [ ] A-007 R5: `public/bylaw-one-guide.html` (`<= 10 MB`) is generated at build time with both reading mode and slide mode, all CSS/JS/fonts/SVGs/screenshots inlined, release/dataset/date metadata on the title page, linked from `/guide` and `/data`, and attached to releases.

### Behavioral Correctness

- [ ] A-008 R1: `scripts/check_site_consistency.mjs` runs in CI and fails the build if a destination appears in both header and footer, if a page body links the same destination more than twice, or if a repeated figure differs across pages.
- [ ] A-009 R2: All narrative, principles, roles, layered packs, agent engine, college/student/practitioner offers, one-day workshop, launch timeline, and sustainability content follow Section 6's content brief, and unbuilt features (agent engine, packs, installers) are described strictly as **planned** with no unbuilt install steps.
- [ ] A-010 R2: No legal text is invented or rewritten anywhere in the guide, and all quoted provisions pass the text fidelity / citation check.

### Scenario Coverage

- [ ] A-011 R5: Playwright test (`e2e/guide.spec.ts`) opens `bylaw-one-guide.html` with network disabled and verifies that both reading mode and slide mode work with zero network requests.
- [ ] A-012 R3: `/guide` and `/guide/slides` pass `axe-core` WCAG 2.2 AA accessibility checks and `scripts/check_page_budgets.mjs` page weight budgets.

### Edge Cases & Error Handling

- [ ] A-013 R1: Singular/plural formatting for sheet counts (`1 sheet` vs `4 sheets`) and deduplication of the July 2025 amendment across `unobtainable_documents` and `not_modelled` handle both single and multi-item arrays cleanly.
- [ ] A-014 R2: `lib/guide.ts` throws an explicit error at build/test time if any `{{placeholder}}` token in `content/guide/*.md` is unknown or unreplaced, or if any slide summary exceeds 40 words.

### Code Quality

- [ ] A-015 Pattern consistency: New code follows naming and structural patterns of surrounding TypeScript/Next.js and Node build script files.
- [ ] A-016 No unnecessary duplication: Existing utilities (`computeDatasetPilotMetrics`, `getSiteConfig`, `lib/data.ts`) are reused rather than duplicated.
- [ ] A-017 Readability and maintainability: Functions remain focused and modular (`lib/navigation.ts`, `lib/guide.ts`, `components/GuideReaderClient.tsx`, `components/GuideSlidesClient.tsx`).
- [ ] A-018 No magic strings or numbers: Generated dataset figures and configuration values come from `computeDatasetPilotMetrics()` and `getSiteConfig()` rather than hardcoded literals.

## Notes

- Check items as you review: `- [x]`
- All acceptance items must pass before `/fab-continue` (hydrate)
- If an item is not applicable, mark checked and prefix with **N/A**: `- [x] A-NNN **N/A**: {reason}`

## Assumptions

| # | Grade | Decision | Rationale | Scores |
|---|-------|----------|-----------|--------|
| 1 | Certain | Structure the work as 5 tasks (`T001`–`T005`) corresponding 1-to-1 with Parts 1–5 of `docs/plans/bylaw-one-guide-plan.md`, committing and pushing after each part | Matches the explicit 5-part structure and per-part commit/push rule in `docs/plans/bylaw-one-guide-plan.md` §§3–4 | S:100 R:95 A:100 D:100 |
| 2 | Certain | Use `reveal.js` (MIT), `mermaid` (MIT), and `@playwright/test` (Apache-2.0) and record their installed versions and licences in `docs/dependencies.md` | Explicitly mandated in `docs/plans/bylaw-one-guide-plan.md` §2 and Rule R4 | S:100 R:95 A:100 D:100 |
| 3 | Certain | Pre-render the 6 Mermaid diagrams to SVG files (`public/guide/diagrams/*.svg`) at build time and inline those SVGs in `/guide`, `/guide/slides`, and `bylaw-one-guide.html` | Keeps `/guide` and `/guide/slides` fast and within page weight budgets while guaranteeing identical offline rendering in `bylaw-one-guide.html` | S:90 R:95 A:95 D:95 |

3 assumptions (3 certain, 0 confident, 0 tentative).
