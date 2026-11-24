# Plan: PR 04 — Acquire Core Documents and Reconnaissance

**Change**: 261124-986m-pr-04-acquire-core-documents
**Intake**: `intake.md`

## Requirements

### Core Document Discovery & Provenance-Gated Acquisition (Rules R15, R16, R17)

#### R1: Search Log (`source-discovery.md`), Real PDF Acquisition, and Quoted Register Metadata
Every core document in the Building Bye-laws chain and RMP 2015 Zoning Regulations chain (`04-acquire-core-documents.md` §1) MUST be searched across official and mirror repositories (Issuing authority / Karnataka Gazette → India Code → BBMP/GBA town planning & BPAS circulars → OpenCity → Wayback Machine), with every query, URL visited, copy found, and unobtained document logged in `data/reports/in-ka-bengaluru-south/source-discovery.md`.
- Every obtainable PDF MUST be acquired via `bylaws acquire` with a complete `retrieval` block (`fetched_at`, `requested_url`, `final_url`, `http_status`, `content_type`, `content_length`, `response_headers`, `sha256`, `archive_url` or `archive_failure_reason`, `fetched_by: "agent"`) stored in `jurisdictions/in-ka-bengaluru-south.yaml`.
- Title, issuing authority, notification number, notified date, effective/commencement date, `amends`, and `status_evidence.quoted_line` MUST be quoted from the fetched PDF itself (Rule R17).
- Any Kannada-only document MUST be recorded with its link and a declared gap (`languages: ["kn"]`, not structured); any unobtainable document MUST be recorded with `acquisition_status: "not_found"` and search log reference (Rule R16).

- **GIVEN** `jurisdictions/in-ka-bengaluru-south.yaml` and `data/reports/in-ka-bengaluru-south/source-discovery.md`
- **WHEN** `bylaws check-provenance` and `test_core_documents_pr04.py` run
- **THEN** every acquired document has a valid `http(s)` `source_url`, a complete `retrieval` block with a 64-char SHA-256 and Wayback `archive_url` (or `archive_failure_reason`), and quoted `status_evidence` from the document itself, and `bylaws check-provenance` passes

### Human-Readable Register & Measured Reconnaissance (`recon.md`)

#### R2: `docs/sources/in-ka-bengaluru-south.md` and `data/reports/in-ka-bengaluru-south/recon.md`
`docs/sources/in-ka-bengaluru-south.md` MUST list the complete core tier ordered as two chains (Building Bye-laws, Zoning Regulations) by date. `data/reports/in-ka-bengaluru-south/recon.md` MUST be measured from the real downloaded PDFs, recording per document: page count; digital text layer vs. scanned (checked on every page); column layout; numbering forms actually used with page examples and first/last clause numbers; running heads and footers; tables (count, page numbers, header rows, footnotes); schedules, forms, annexures; stamps, signatures, rotated or poor pages; English vs. Kannada pages; and a **structuring rules list** for PR 05 with page examples for each rule.

- **GIVEN** the downloaded core PDFs in `data/raw/in-ka-bengaluru-south/`
- **WHEN** `recon.md` and `docs/sources/in-ka-bengaluru-south.md` are inspected
- **THEN** both files exist, `recon.md` records measured page counts, per-page text/scanned status, numbering examples, table counts, and the structuring rules list for PR 05, and `docs/sources/in-ka-bengaluru-south.md` lists both chains in date order

### Web Sources & Data Pages Register Display

#### R3: Show Real Core Register on Sources and Data Pages (`"Not yet structured"`)
`schemas/manifest.schema.json`, `public/data/manifest.json`, `public/data/in-ka-bengaluru-south/register/documents.json`, `lib/data.ts`, `app/j/[id]/sources/page.tsx`, `app/data/page.tsx`, and `components/SourcesFilterClient.tsx` MUST surface the verified core source register on the Sources and Data pages even before structured release `2.0.0` is published:
- Each document in the register is shown with its legal status, quoted status evidence, official link, mirror links, Wayback archive link (`retrieval.archive_url`), SHA-256, and a badge `"Not yet structured"` (or `"Kannada only — not structured"` / `"Not found"` where applicable).

- **GIVEN** `public/data/manifest.json` referencing `/data/in-ka-bengaluru-south/register/documents.json`
- **WHEN** `/j/in-ka-bengaluru-south/sources` and `/data` render
- **THEN** the Sources page lists the real core register with official links, Wayback archive links, and `"Not yet structured"` badges, and passes `axe-core` WCAG AA checks

### Design Decisions

#### Pre-Release Source Register via `register_documents` on `JurisdictionManifest`
**Decision**: Add an optional `register_documents` (`string | null`) field to `jurisdictionManifest` in `schemas/manifest.schema.json` pointing to `/data/<id>/register/documents.json`, populated from the verified `jurisdictions/<id>.yaml` register entries. When `release === null` on a jurisdiction but `register_documents` is present, `fetchJurisdictionDataset` loads `documents` from `register_documents` while keeping `release: null` and `clauses: []`.
**Why**: Allows the Sources and Data pages to display the real acquired source register in PR 04 (marked `"Not yet structured"`) while Map, Documents, Timeline, and Review pages continue showing `"No data published yet"` until PR 05 publishes Release `2.0.0`.
**Rejected**: Creating a fake release in `releases[]` for PR 04, which would violate `00-overview.md` §7 ("Real releases start at `2.0.0` (PR 05)").
*Introduced by*: 261124-986m-pr-04-acquire-core-documents

## Tasks

### Phase 1: Web Discovery & Real PDF Acquisition

- [x] T001 Search official and mirror repositories (BBMP, India Code, GBA, BPAS circulars, OpenCity, Wayback Machine) for all core documents in the Building Bye-laws chain and RMP 2015 Zoning Regulations chain, and write the complete search log in `data/reports/in-ka-bengaluru-south/source-discovery.md` <!-- R1 -->
- [x] T002 Download all obtainable core PDFs into `data/raw/in-ka-bengaluru-south/`, request Wayback Machine snapshots, inspect every PDF to extract verbatim titles, notification numbers, dates, and quoted status evidence (R17), and update `jurisdictions/in-ka-bengaluru-south.yaml` with full `retrieval` records (and `not_found` / Kannada-only gap declarations where applicable) <!-- R1 -->

### Phase 2: Reconnaissance (`recon.md`) & Human-Readable Source Register

- [x] T003 Measure every acquired real PDF (page count, per-page text layer vs. scanned check, columns, numbering forms with page examples and first/last clause numbers, running heads/footers, tables, schedules/forms/annexures, stamps/signatures/rotated pages, English vs. Kannada pages) and write `data/reports/in-ka-bengaluru-south/recon.md` (with the PR 05 structuring rules list) and `docs/sources/in-ka-bengaluru-south.md` <!-- R2 -->

### Phase 3: Web Register Display & Falsifiable Tests (R11)

- [x] T004 Add optional `register_documents` to `schemas/manifest.schema.json` (and run `make generate`), export `public/data/in-ka-bengaluru-south/register/documents.json` and update `public/data/manifest.json`, and update `lib/data.ts`, `app/j/[id]/sources/page.tsx`, `app/data/page.tsx`, and `components/SourcesFilterClient.tsx` to display the real core register with official links, Wayback archive links, and `"Not yet structured"` badges <!-- R3 -->
- [x] T005 Write falsifiable tests in `pipeline/tests/test_core_documents_pr04.py` (shown failing first per R11) and update `__tests__/routes-and-axe.test.tsx` and `docs/progress.md`; verify `bylaws check-provenance`, pytest, Vitest/axe, and `npm run build` pass <!-- R1, R2, R3 -->

## Acceptance

### Functional Completeness

- [x] A-001 R1: Every core register row in `jurisdictions/in-ka-bengaluru-south.yaml` is confirmed from its fetched document with quoted `status_evidence`, or declared `not_found` / Kannada-only with the search logged in `data/reports/in-ka-bengaluru-south/source-discovery.md`
- [x] A-002 R1: Complete `retrieval` records and Wayback `archive_url` (or `archive_failure_reason`) are recorded for every acquired file, and `bylaws check-provenance` passes
- [x] A-003 R2: `data/reports/in-ka-bengaluru-south/recon.md` is measured from the real files and ends with the structuring rules list for PR 05, and `docs/sources/in-ka-bengaluru-south.md` lists the two chains in date order
- [x] A-004 R3: The Sources page (`/j/in-ka-bengaluru-south/sources`) and Data page (`/data`) show the real core register with links, archive links, and `"Not yet structured"` status

### Behavioral Correctness

- [x] A-005 R1: Zero synthetic or locally generated PDFs exist for `in-ka-bengaluru-south`, and all SHA-256 digests in `jurisdictions/in-ka-bengaluru-south.yaml` match the real downloaded bytes
- [x] A-006 R3: Map, Documents (`/clauses`), Timeline, and Review pages for `in-ka-bengaluru-south` continue showing `"No data published yet"` while Sources shows the real register

### Scenario Coverage

- [x] A-007 R1: Falsifiable tests in `pipeline/tests/test_core_documents_pr04.py` are shown failing first (R11) and pass once the register, `source-discovery.md`, and `recon.md` are populated
- [x] A-008 R3: All Vitest and `axe-core` WCAG AA checks pass on the updated Sources and Data pages

### Code Quality

- [x] A-009 Pattern consistency: Register export and UI components follow existing schema and dg2n styling conventions
- [x] A-010 No unnecessary duplication: Reuses `SourcesFilterClient` and `DocumentMetadata` types

## Notes

- Check items as you review: `- [x]`
- All acceptance items must pass before `/fab-continue` (hydrate)
- If an item is not applicable, mark checked and prefix with **N/A**: `- [x] A-NNN **N/A**: {reason}`

## Deletion Candidates

- `None` — this change adds new functionality without making existing code redundant

## Assumptions

| # | Grade | Decision | Rationale | Scores |
|---|-------|----------|-----------|--------|
| 1 | Certain | Acquire real PDFs from the web using `bylaws acquire` and record full `retrieval` blocks + Wayback snapshots in `jurisdictions/in-ka-bengaluru-south.yaml` | Explicitly specified in `04-acquire-core-documents.md` §2 (R15) | S:95 R:90 A:95 D:95 |
| 2 | Certain | Never fabricate or reconstruct any missing or Kannada-only document; record as `not_found` or Kannada-only gap with search log evidence | Explicitly specified in `04-acquire-core-documents.md` §2 (R16, R17) | S:100 R:95 A:100 D:100 |
| 3 | Certain | Export verified register metadata to `public/data/in-ka-bengaluru-south/register/documents.json` so `/j/in-ka-bengaluru-south/sources` and `/data` render the real core register marked `"Not yet structured"` | Required by `04-acquire-core-documents.md` §3 while keeping raw PDFs uncommitted in gitignored `data/raw/` | S:90 R:90 A:95 D:90 |
| 4 | Certain | Stop at PR creation with Checkpoint 1 verification instructions in the PR description and wait for owner confirmation | Explicitly required by Rule R18 and `04-acquire-core-documents.md` §4 | S:100 R:100 A:100 D:100 |

4 assumptions (4 certain, 0 confident, 0 tentative).
