# Intake: PR 04 — Acquire Core Documents and Reconnaissance

**Change**: 261124-986m-pr-04-acquire-core-documents
**Created**: 2026-11-24

## Origin

> Implement PR 04 (Acquire Core Documents and Reconnaissance) per docs/plans/pr-series/00-overview.md and docs/plans/pr-series/04-acquire-core-documents.md: discover, verify, and download all real core documents in the Building Bye-laws chain and RMP 2015 Zoning Regulations chain via bylaws acquire with retrieval records and Wayback links (R15-R17); log every search in data/reports/in-ka-bengaluru-south/source-discovery.md; update jurisdictions/in-ka-bengaluru-south.yaml and docs/sources/in-ka-bengaluru-south.md; measure real PDFs into recon.md with structuring rules for PR 05; surface the core register on Data and Sources pages; include Checkpoint 1 verification links, page counts, and first/last clause numbers in the PR description.

Fourth PR in the 11-PR remediation series (`docs/plans/pr-series/00-overview.md` and `docs/plans/pr-series/04-acquire-core-documents.md`), following PR 03 (`261124-llmz-pr-03-schema-three-layers`, merged in PR #8). This PR reaches **Owner Checkpoint 1**.

## Why

1. **Problem**: With the R15/R16 provenance gate (PR 02) and Schema 1.3 (PR 03) in place, `in-ka-bengaluru-south` currently has `acquisition_status: "pending"` placeholders in `jurisdictions/in-ka-bengaluru-south.yaml` and no acquired documents, reconnaissance measurements, or source register published.
2. **Consequence of inaction**: We cannot structure the base anchor documents in PR 05 or the amendment chains in PRs 08–09 without first acquiring the real PDFs from official authorities/mirrors, recording their HTTP retrieval records and Wayback Machine snapshots, quoting their titles/dates/notification numbers directly from the PDFs (Rule R17), and measuring their page-by-page layout, numbering forms, tables, and scanned vs. digital text layers in `recon.md`.
3. **Why this approach**: Separating acquisition and reconnaissance (PR 04) from structuring (PR 05) creates **Owner Checkpoint 1**, allowing the owner to verify in one minute that the downloaded PDFs are the authentic documents (checking links, archive links, page counts, and first/last clause numbers) before any structuring work begins.

## What Changes

### 1. Discover, Verify, and Acquire Real Core Documents (`jurisdictions/in-ka-bengaluru-south.yaml`, `data/reports/in-ka-bengaluru-south/source-discovery.md`)

- Search official and mirror repositories in priority order (Issuing authority / Karnataka Gazette → India Code → BBMP/GBA town planning & BPAS circulars → OpenCity → Wayback Machine) for every core document in:
  1. **Building Bye-laws chain**:
     - Bangalore Mahanagara Palike Building Bye-laws 2003
     - Bengaluru South City Corporation Building (Amendment) Bye-laws 2026 (final and draft)
     - Any other amendments to the 2003 bye-laws (2004–2026)
  2. **RMP 2015 Zoning Regulations chain**:
     - Zoning Regulations of RMP 2015 (base)
     - BBMP's consolidated "Amendment to Zoning Regulation" and "Revising the amendments in the regulations in BBMP revised Mahayojane 2015"
     - Amendments 2014–2026 (UDD 105 MNJ 2008 dated 20-03-2015; UDD 255 MNJ 2018; T&T zone uses amendment; Impact Zone Premium FAR UDD 112 MNJ 2015 dated 29.09.2018; Premium FAR chapter UDD 78 MNJ 2024(E) dated 21.02.2025, 02.04.2025 schedule, Feb 2026 road-width revision; July 2025 height/stilt parking final & draft; storm water drain buffer 2025 draft/final; UDD/235/MNJ 2025(E) dated 05.01.2026 setbacks/parking final & Nov 2025 draft; high-rise 21 m to 24 m draft).
- Log every query, site searched, URL visited, what was found (with direct PDF URLs, HTTP status, and SHA-256), and what could not be found in `data/reports/in-ka-bengaluru-south/source-discovery.md`.
- Acquire every obtainable PDF via `bylaws acquire --jurisdiction in-ka-bengaluru-south`, recording its complete `retrieval` block (`fetched_at`, `requested_url`, `final_url`, `http_status`, `content_type`, `content_length`, `response_headers`, `sha256`, `archive_url` or `archive_failure_reason`, `fetched_by: "agent"`).
- Quote `title`, `issuing_authority`, `notification_number`, `notified_date`, `effective_from`, `amends`, and `status_evidence.quoted_line` directly from each fetched PDF (Rule R17).
- For any Kannada-only instrument: record in the register with link and declared gap (`languages: ["kn"]`, not structured).
- For any referenced instrument that cannot be obtained: record in the register with `acquisition_status: "not_found"` and search log reference (Rule R16).

### 2. Human-Readable Core Register (`docs/sources/in-ka-bengaluru-south.md`) and Reconnaissance Report (`data/reports/in-ka-bengaluru-south/recon.md`)

- Write `docs/sources/in-ka-bengaluru-south.md`: human-readable register of the core tier ordered as two chains (Building Bye-laws chain, Zoning Regulations chain) by date, with title as printed, authority, notification number, dates, legal status with quoted evidence, language, official/mirror URL, Wayback archive link, SHA-256, and acquisition status.
- Measure every acquired PDF and write `data/reports/in-ka-bengaluru-south/recon.md` containing per-document measurements:
  - Total page count
  - Digital text layer vs. scanned pages (checked on every page)
  - Layout (single-column vs. multi-column)
  - Numbering forms actually used, with page examples and first/last clause numbers
  - Running heads and footers
  - Tables (count, page numbers, header rows, footnotes)
  - Schedules, forms, annexures
  - Stamps, signatures, rotated or poor-quality pages
  - English vs. Kannada pages
  - **Structuring rules list for PR 05**, with page examples for each rule.

### 3. Surface the Real Core Register on Sources and Data Pages (`public/data/`, `lib/data.ts`, `app/j/[id]/sources/page.tsx`, `app/data/page.tsx`, `components/SourcesFilterClient.tsx`)

- Publish the core source register metadata (`public/data/in-ka-bengaluru-south/register/documents.json` referenced from `public/data/manifest.json` or loaded via `lib/data.ts`) so that:
  - The Sources page (`/j/in-ka-bengaluru-south/sources`) displays the real core register with each document's status, quoted evidence, official URL, mirror URLs, Wayback archive link (`retrieval.archive_url`), SHA-256, and a badge `"Not yet structured"`.
  - The Data page (`/data`) shows the core register summary and links alongside the withdrawn `1.0.0` release notice (still no structured release bundle until `2.0.0` in PR 05).

### 4. Checkpoint 1 Instructions in PR Description

- Include the **Checkpoint 1** verification block in the PR description with:
  1. Direct links and Wayback archive links for the three checkpoint documents (2003 Building Bye-laws, RMP 2015 Zoning Regulations, and 2026 Bengaluru South City Corporation Amendment Bye-laws).
  2. Recorded page count and first and last clause numbers for each of the three documents.
  3. The list of any documents not found or Kannada-only.

## Affected Memory

- `architecture/overview`: (modify) Document PR 04 core register acquisition, reconnaissance report (`recon.md`), and pre-release source register display on the Sources and Data pages.
- `schemas/data-contracts`: (modify) Document optional `register_documents` path on `jurisdictionManifest` in `schemas/manifest.schema.json` for publishing the verified source register prior to structured release `2.0.0`.

## Impact

- **Config & Reports**: `jurisdictions/in-ka-bengaluru-south.yaml`, `docs/sources/in-ka-bengaluru-south.md`, `data/reports/in-ka-bengaluru-south/source-discovery.md`, `data/reports/in-ka-bengaluru-south/recon.md`, `docs/progress.md`.
- **Published Register & Web UI**: `schemas/manifest.schema.json`, `public/data/manifest.json`, `public/data/in-ka-bengaluru-south/register/documents.json`, `lib/data.ts`, `app/j/[id]/sources/page.tsx`, `app/data/page.tsx`, `components/SourcesFilterClient.tsx`.
- **Tests**: `pipeline/tests/test_core_documents_pr04.py`, `__tests__/routes-and-axe.test.tsx`.

## Open Questions

None — all leads and rules are specified in `docs/plans/pr-series/00-overview.md` and `docs/plans/pr-series/04-acquire-core-documents.md`.

## Assumptions

| # | Grade | Decision | Rationale | Scores |
|---|-------|----------|-----------|--------|
| 1 | Certain | Acquire real PDFs from the web using `bylaws acquire` and record full `retrieval` blocks + Wayback snapshots in `jurisdictions/in-ka-bengaluru-south.yaml` | Explicitly specified in `04-acquire-core-documents.md` §2 (R15) | S:95 R:90 A:95 D:95 |
| 2 | Certain | Never fabricate or reconstruct any missing or Kannada-only document; record as `not_found` or Kannada-only gap with search log evidence | Explicitly specified in `04-acquire-core-documents.md` §2 (R16, R17) | S:100 R:95 A:100 D:100 |
| 3 | Certain | Export verified register metadata to `public/data/in-ka-bengaluru-south/register/documents.json` so `/j/in-ka-bengaluru-south/sources` and `/data` render the real core register marked `"Not yet structured"` | Required by `04-acquire-core-documents.md` §3 while keeping raw PDFs uncommitted in gitignored `data/raw/` | S:90 R:90 A:95 D:90 |
| 4 | Certain | Stop at PR creation with Checkpoint 1 verification instructions in the PR description and wait for owner confirmation | Explicitly required by Rule R18 and `04-acquire-core-documents.md` §4 | S:100 R:100 A:100 D:100 |

4 assumptions (4 certain, 0 confident, 0 tentative, 0 unresolved).
