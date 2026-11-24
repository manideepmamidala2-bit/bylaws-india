# Plan: PR 01 — Contain Production

**Change**: 261124-tuou-pr-01-contain-production
**Intake**: `intake.md`

## Requirements

### Schemas & Published Data: Withdraw Synthetic Release 1.0.0

#### R1: Withdraw Synthetic Release 1.0.0 and Remove Published Files
The manifest schema (`schemas/manifest.schema.json`), codegen outputs (`pipeline/bylaws/models/_generated.py`, `lib/types/generated.ts`), and published manifest (`public/data/manifest.json`) MUST support and record release `1.0.0` of `in-ka-bengaluru-south` as `status: "withdrawn"` with `withdrawn_reason: "Synthetic demonstration data, not the law of Bengaluru South"`, `latest_release: null`, and zero downloadable file links (`download_zip`, `sha256sums`, `declarations`, `files`, and `drafts` set to `null`). All 41 generated files under `public/data/in-ka-bengaluru-south/1.0.0/` MUST be removed from `public/data/`.

- **GIVEN** `schemas/manifest.schema.json` and `public/data/manifest.json`
- **WHEN** `make generate` and schema validation run against `public/data/manifest.json`
- **THEN** `in-ka-bengaluru-south` remains listed with `visibility: "public"` and `latest_release: null`, its `1.0.0` release has `status: "withdrawn"` and `withdrawn_reason: "Synthetic demonstration data, not the law of Bengaluru South"` with no downloadable file URLs, and `public/data/in-ka-bengaluru-south/1.0.0/` does not exist

### Web Application: Server-Side Build-Time Test Jurisdiction Filter

#### R2: Filter `visibility: "test"` Jurisdictions at Build Time on the Server
The data client (`lib/data.ts`) and Next.js Server Components (`app/page.tsx`, `app/data/page.tsx`, `app/about/page.tsx`, `app/j/[id]/**`) MUST filter out `visibility: "test"` jurisdictions on the server unless the server-only environment variable `SHOW_TEST_JURISDICTIONS` is explicitly set (`"true"` or `"1"`). The home page (`app/page.tsx`) MUST NOT rely on client-side `process.env.VERCEL_ENV` checks; the manifest and page props passed to pages in a production build MUST already exclude `visibility: "test"` jurisdictions.

- **GIVEN** `public/data/manifest.json` containing both `in-ka-bengaluru-south` (`visibility: "public"`) and `xx-test-fixture` (`visibility: "test"`)
- **WHEN** server-side manifest loading and page rendering run without `SHOW_TEST_JURISDICTIONS` set
- **THEN** no `visibility: "test"` jurisdiction appears in the filtered manifest, `getVisibleJurisdictions`, `generateStaticParams`, or rendered page props
- **AND** when `SHOW_TEST_JURISDICTIONS="true"` is set on the server (e.g., in fixture tests), `xx-test-fixture` is included

### Web Application: Honest Public Copy and Editorial Hygiene

#### R3: Honest Copy, Withdrawn Release Display, and Removal of Internal Shorthand
All public routes (`app/page.tsx`, `app/data/page.tsx`, `app/about/page.tsx`, `app/j/[id]/page.tsx`, `app/j/[id]/sources/page.tsx`, `app/j/[id]/clauses/page.tsx`, `app/j/[id]/documents/[doc]/page.tsx`, `app/j/[id]/timeline/page.tsx`, `app/j/[id]/review/page.tsx`) and shared UI components (`components/**`) MUST present honest status copy and clean editorial text:
- The Home page (`app/page.tsx`) MUST explain what the project is, state that the first Bengaluru South release (`1.0.0`) was synthetic demonstration data and has been withdrawn, state that real data is being acquired and will be published as it is verified, and list Bengaluru South with status `"No data published yet"` and no dataset counts.
- Map, Sources, Documents, Timeline, and Review pages for a jurisdiction with no published data (`in-ka-bengaluru-south`) MUST render a plain `"No data published yet"` state with no generated clauses, zones, boundaries, or source checksums.
- The Data page (`app/data/page.tsx`) MUST list release `1.0.0` as `"Withdrawn: synthetic demonstration data, not the law of Bengaluru South"` with no download links.
- The About page (`app/about/page.tsx`) MUST describe the methodology and current status honestly without claiming verification at official origin.
- Public copy across `app/**` and `components/**` MUST contain zero occurrences of `"verified at its official origin"`, internal rule numbers (`Rule R13`, `(R14)`, `Rules R2`, etc.), plan references (`Plan v2.0`), repository file paths, raw backticks, or em dashes (`—`).

- **GIVEN** the rendered HTML/text of all routes (`Home`, `Map`, `Sources`, `Documents`, `Timeline`, `Review`, `Data`, `About`) and UI components in `app/**` and `components/**`
- **WHEN** rendered for `in-ka-bengaluru-south` and audited by automated tests
- **THEN** Map, Sources, Documents, Timeline, and Review show `"No data published yet"` with no generated data, Data shows release `1.0.0` as withdrawn with reason and no download links, and public copy contains no `"verified at its official origin"`, rule/plan references, repo paths, backticks, or em dashes

### Quality & Guardrails: Recurrence Guard Test

#### R4: Guard Against Local Source URLs in Published Non-Test Manifests
Automated tests in `pipeline/tests/` and `__tests__/` MUST fail if any published (non-`visibility: "test"`, non-`status: "withdrawn"`) manifest entry in `public/data/manifest.json` references a file whose `source_url` is local (`file://`, relative path, `data/sources/`, or non-`http(s)://`) or if any withdrawn release entry exposes downloadable files. `docs/progress.md` MUST be updated to reflect PR 01.

- **GIVEN** `public/data/manifest.json` and a test helper that validates published manifest entries
- **WHEN** a non-test published manifest entry references a local `source_url` or a withdrawn release includes a `download_zip` or `files` payload
- **THEN** the recurrence guard test fails immediately

### Non-Goals
- Moving `scripts/build_bengaluru_south_sources.py` to `pipeline/tests/fixtures/` — scheduled for PR 02 (`02-provenance-gate-and-repo-sync.md`).
- Full `retrieval` block schema, Wayback Machine archiving, and Docling/Tesseract installation — scheduled for PR 02.

### Design Decisions

#### Server-Side Manifest Filtering via `SHOW_TEST_JURISDICTIONS`
**Decision**: Evaluate `process.env.SHOW_TEST_JURISDICTIONS` (`"true"` or `"1"`) on the server in `lib/data.ts` (`shouldShowTestJurisdictions()`), filter `manifest.jurisdictions` inside `fetchManifest()` / `getVisibleJurisdictions()` by default when `shouldShowTestJurisdictions()` is false, and convert `app/page.tsx` to a Server Component that passes pre-filtered server data to the page.
**Why**: `VERCEL_ENV` is a server-only variable not exposed to client bundles; filtering on the server at build/render time guarantees that production HTML and page props never include `visibility: "test"` jurisdictions.
**Rejected**: Using `NEXT_PUBLIC_VERCEL_ENV` in client components, which still ships test jurisdiction metadata in the client bundle and violates `01-contain-production.md` §2.
*Introduced by*: 261124-tuou-pr-01-contain-production

#### Explicit `withdrawn` Release Status in `manifest.schema.json`
**Decision**: Add `status: "published" | "withdrawn"` and `withdrawn_reason: string | null` to `releaseEntry` in `schemas/manifest.schema.json`, make `latest_release` nullable on `jurisdictionManifest`, and allow `download_zip`, `sha256sums`, `declarations`, `files`, and `drafts` to be `null` when `status == "withdrawn"`.
**Why**: Allows `public/data/manifest.json` to record withdrawn releases (`1.0.0`) with their withdrawal reason while guaranteeing zero downloadable links and maintaining strict JSON Schema validation.
**Rejected**: Deleting `1.0.0` from `manifest.json` entirely and hard-coding the withdrawal notice in `app/data/page.tsx` (violates R1 data-driven architecture).
*Introduced by*: 261124-tuou-pr-01-contain-production

## Tasks

### Phase 1: Setup & Schema / Data Containment

- [x] T001 Update `schemas/manifest.schema.json`, `pipeline/bylaws/publish.py`, and `public/data/manifest.json` to support `status: "withdrawn"`, `withdrawn_reason`, nullable `latest_release`, and nullable file fields; run `make generate` to update `pipeline/bylaws/models/_generated.py` and `lib/types/generated.ts`; remove all files in `public/data/in-ka-bengaluru-south/1.0.0/` <!-- R1 -->

### Phase 2: Core Implementation (Server Filter & Honest Copy)

- [x] T002 Update `lib/data.ts` to filter `visibility: "test"` jurisdictions on the server via `SHOW_TEST_JURISDICTIONS` (default false) and handle jurisdictions with `latest_release: null` / only withdrawn releases (`release: null`) gracefully across all data loaders <!-- R2 -->
- [x] T003 Update `app/page.tsx` (converting to server-filtered build-time data), `app/data/page.tsx`, `app/about/page.tsx`, and all jurisdiction routes (`app/j/[id]/page.tsx`, `app/j/[id]/sources/page.tsx`, `app/j/[id]/clauses/page.tsx`, `app/j/[id]/documents/[doc]/page.tsx`, `app/j/[id]/timeline/page.tsx`, `app/j/[id]/review/page.tsx`) to show honest copy, withdrawn release `1.0.0` without download links, and `"No data published yet"` for Bengaluru South <!-- R2, R3 -->
- [x] T004 Sweep `app/**` and `components/**` (`TopNav.tsx`, `ClausePanel.tsx`, `ClauseTree.tsx`, `SourcesFilterClient.tsx`, `ReviewPanel.tsx`, `ZoneMap.tsx`, `StatusBadge.tsx`, `AreaExplorerClient.tsx`) to remove all em dashes (`—`), internal rule/plan references (`Rule R13`, `(R14)`, etc.), repo paths, raw backticks, and long wrapping labels <!-- R3 -->

### Phase 3: Integration, Recurrence Guard Tests & Docs

- [x] T005 Update and add tests in `__tests__/picker.test.tsx`, `__tests__/routes-and-axe.test.tsx`, `pipeline/tests/test_bengaluru_south_dataset.py`, and `pipeline/tests/test_config_and_schemas.py` (proving `visibility: "test"` is hidden when `SHOW_TEST_JURISDICTIONS` is unset, verifying withdrawn release `1.0.0` and `"No data published yet"` states, verifying zero em dashes/backticks/rule refs in public copy, and blocking local `source_url` in non-test published manifests), and update `docs/progress.md` <!-- R1, R2, R3, R4 -->

## Acceptance

### Functional Completeness

- [x] A-001 R1: `public/data/manifest.json` marks release `1.0.0` of `in-ka-bengaluru-south` as `status: "withdrawn"` with reason `"Synthetic demonstration data, not the law of Bengaluru South"`, `latest_release: null`, and no downloadable file links, and `public/data/in-ka-bengaluru-south/1.0.0/` is deleted
- [x] A-002 R2: `lib/data.ts` and `app/page.tsx` filter `visibility: "test"` jurisdictions on the server using `SHOW_TEST_JURISDICTIONS` (false unless set), not client-side `VERCEL_ENV`
- [x] A-003 R3: Home, Map, Sources, Documents, Timeline, Review, Data, and About pages render honest status copy, show `"No data published yet"` for Bengaluru South, and list release `1.0.0` on Data page as withdrawn with reason and no download link
- [x] A-004 R4: Recurrence guard tests in Python and Vitest fail if any non-test published manifest entry references a local `source_url` or if a withdrawn release exposes downloadable files

### Behavioral Correctness

- [x] A-005 R2: Production build page props (when `SHOW_TEST_JURISDICTIONS` is unset) contain zero `visibility: "test"` jurisdictions (verified by automated test)
- [x] A-006 R3: Zero occurrences of `"verified at its official origin"`, internal rule/plan references (`Rule R13`, `(R14)`, `Plan v2.0`), repository paths, raw backticks, or em dashes (`—`) exist in rendered public copy across `app/**` and `components/**`

### Scenario Coverage

- [x] A-007 R1: `make generate` produces zero git diff on `pipeline/bylaws/models/_generated.py` and `lib/types/generated.ts`, and `public/data/manifest.json` validates against `schemas/manifest.schema.json`
- [x] A-008 R3: All routes pass `axe-core` WCAG AA accessibility checks in `npm test`

### Edge Cases & Error Handling

- [x] A-009 R2: Visiting `/j/in-ka-bengaluru-south` and its sub-routes (`/sources`, `/clauses`, `/timeline`, `/review`) when `latest_release` is `null` renders `"No data published yet"` cleanly without throwing a null-dereference error

### Code Quality

- [x] A-010 Pattern consistency: New code follows naming and structural patterns of surrounding code
- [x] A-011 No unnecessary duplication: Existing utilities in `lib/data.ts` and `pipeline/bylaws/` are reused
- [x] A-012 Readability and concise functions: Helper functions in `lib/data.ts` and page components remain focused and under 50 lines where practical

## Notes

- Check items as you review: `- [x]`
- All acceptance items must pass before `/fab-continue` (hydrate)
- If an item is not applicable, mark checked and prefix with **N/A**: `- [x] A-NNN **N/A**: {reason}`

## Deletion Candidates

- `lib/data.ts:155-157` (`isProductionEnvironment`) — Legacy helper superseded by `shouldShowTestJurisdictions()` with zero remaining call sites in the codebase.
- `scripts/build_bengaluru_south_sources.py` — Synthetic dataset generator whose published output in `public/data/in-ka-bengaluru-south/1.0.0/` was withdrawn and deleted in this change (scheduled to move to `pipeline/tests/fixtures/` in PR 02).

## Assumptions

| # | Grade | Decision | Rationale | Scores |
|---|-------|----------|-----------|--------|
| 1 | Certain | Map `web/public/data/` in `01-contain-production.md` to root `public/data/` | Discussed and verified against repo layout where Next.js app lives at repository root | S:95 R:95 A:100 D:100 |
| 2 | Certain | Use server-only `SHOW_TEST_JURISDICTIONS` env var (default false) to filter `visibility: "test"` jurisdictions at build time on the server | Explicitly specified in `01-contain-production.md` §2 | S:95 R:90 A:95 D:95 |
| 3 | Certain | Extend `manifest.schema.json` `releaseEntry` with `status: "published" or "withdrawn"` and `withdrawn_reason` and nullable file fields | Required by `01-contain-production.md` §1 so `manifest.json` validates against JSON Schema while listing release `1.0.0` as withdrawn with no downloadable files | S:90 R:90 A:95 D:90 |
| 4 | Certain | Render `"No data published yet"` on Map, Sources, Documents, Timeline, and Review pages for `in-ka-bengaluru-south` | Explicitly specified in `01-contain-production.md` §1 & §3 | S:95 R:90 A:95 D:95 |

4 assumptions (4 certain, 0 confident, 0 tentative).
