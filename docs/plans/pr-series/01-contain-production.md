# PR 01 — Contain Production

**Read first:** `00-overview.md` · **Estimate:** 0.5 day · **Checkpoint:** owner reviews and merges

## Goal

Production stops presenting generated data as the law of Bengaluru South, today. This PR is small on purpose so it can merge immediately.

## Work

### 1. Remove the synthetic release from public view
- Mark release `1.0.0` of `in-ka-bengaluru-south` as **withdrawn** in the manifest, with reason "Synthetic demonstration data, not the law of Bengaluru South".
- The published manifest must contain no downloadable files for the withdrawn release. Remove its files from `web/public/data/` (the generated data remains reproducible from the repository's script until PR 02 moves it to fixtures).
- The Bengaluru South jurisdiction stays listed, with status "No data published yet".

### 2. Fix the production filter
- The home page is a client component and `VERCEL_ENV` is not exposed to the browser, so test jurisdictions appear in production.
- Do the filtering **at build time on the server**: the manifest given to pages is already filtered. Use a server-only environment variable (e.g. `SHOW_TEST_JURISDICTIONS`, false unless set) read in server code, not `NEXT_PUBLIC_*`.
- Add a test: a production build's page props contain no `visibility: test` jurisdictions.

### 3. Honest copy everywhere
- Home page: replace the dataset counts and "verified at its official origin" with a short status: what the project is, that the first Bengaluru South release was synthetic and has been withdrawn, and that real data is being acquired and will be published as it is verified.
- Map, Sources, Documents, Timeline pages for Bengaluru South: show a plain "No data published yet" state, no generated content.
- Data page: list release 1.0.0 as withdrawn with its reason; no bundle link.
- About page: remove claims about verification at official origin; describe the method honestly and state the current status.
- Remove internal language from public copy: rule numbers ("per Rule R13"), plan references ("Plan v2.0 §5.C4"), repository paths, raw backticks.
- Remove all em dashes from interface strings; shorten labels that wrap at 1280 px.

### 4. Guard against recurrence (minimal, until PR 02)
- Add a test that fails if any published (non-test) manifest entry references a file whose source URL is local.

## Acceptance

- [ ] Production preview shows no generated clauses, zones, boundaries or source checksums for Bengaluru South.
- [ ] Test jurisdictions hidden in the production build (test proves it).
- [ ] Release 1.0.0 shown as withdrawn with reason; no download.
- [ ] No "verified at its official origin", no internal rule or plan references, no repository paths, no backticks, no em dashes in public copy.
- [ ] CI green.

## Out of scope

Moving the generator script, provenance gate, dependency changes (PR 02).
