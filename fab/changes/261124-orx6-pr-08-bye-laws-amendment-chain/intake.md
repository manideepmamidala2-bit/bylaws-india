# Intake: PR 08 — Building Bye-laws Amendment Chain

**Change**: 261124-orx6-pr-08-bye-laws-amendment-chain
**Created**: 2026-11-24
**Status**: Draft

## Origin

Implements **PR 08 — Building Bye-laws Amendment Chain** (`docs/plans/pr-series/08-bye-laws-amendment-chain.md`) in the 11-PR remediation series (`docs/plans/pr-series/00-overview.md`). Depends on PR 05 (`261124-fgv0-pr-05-structure-anchor-documents`, merged in PR #10) and builds on Release `2.2.0` (PR 07, merged in PR #12).

## Why

In PR 05, we structured the principal municipal building bye-laws (`bbl-2003`, *Bangalore Mahanagara Palike Building Bye-laws 2003*) and the principal zoning regulations (`rmp2015-zr`) as base documents, displaying a prominent `"Amendments not yet applied"` notice. In PR 08, we must bring the **Building Bye-laws 2003 (`bbl-2003`) chain** up to date by:
1. Re-searching official portals (`bengalurusouth.karnataka.gov.in`, `gba.karnataka.gov.in`, `bpas.bbmpgov.in`, `erajyapatra.karnataka.gov.in`, `data.opencity.in`, and Internet Archive Wayback Machine CDX) for every instrument in the Building Bye-laws 2003 chain—including the *Karnataka Municipalities Model Building Bye-Laws, 2017* (`ka-model-bbl-2017`, already acquired in PR 04 on `bpas.bbmpgov.in` under *Bye laws and Zoning Regulations*), any 2004–2026 BBMP / Bengaluru South City Corporation Building Bye-laws amendments (including the 04.03.2026 / 01.04.2026 draft `bscc-bbl-amend-2026` and any 14.05.2026 final notification), logging all search results in `data/reports/in-ka-bengaluru-south/source-discovery.md`, and acquiring any newly found PDFs via `bylaws acquire` (Rule R15) or declaring unobtainable ones under Rule R16.
2. Structuring all acquired instruments in the Building Bye-laws chain (`ka-model-bbl-2017` and any acquired `bbl-2003` amending instruments; keeping `draft` instruments labelled `draft` so they never produce effects on `in_force` text).
3. Extracting and applying Layer 3 `effects` (`amendments.json`) and node `versions` (`valid_from`, `valid_to`), computing the derived consolidated view (`consolidated.json`) for today and each amendment date, verifying applied effects against page images in `data/reports/in-ka-bengaluru-south/qa.md`, updating the Document page (`Original / As amended (derived)` toggle and per-instrument coverage notice) and Timeline page (`/j/in-ka-bengaluru-south/timeline`), and publishing Release `2.3.0`.

## What Changes

### 1. Re-Search & Complete the Building Bye-laws 2003 Chain (`source-discovery.md`, `jurisdictions/in-ka-bengaluru-south.yaml`)
- Search official Karnataka Gazette (`erajyapatra.karnataka.gov.in`), `bengalurusouth.karnataka.gov.in`, `gba.karnataka.gov.in`, `bpas.bbmpgov.in`, `data.opencity.in`, `data-opencity.sgp1.cdn.digitaloceanspaces.com`, and Wayback Machine CDX for:
  - Any obtainable copy or mirror of the 2026 Bengaluru South City Corporation Building (Amendment) Bye-laws (04.03.2026 / 01.04.2026 draft `bscc-10125.pdf` and 14.05.2026 final notification), plus any earlier BBMP Building Bye-laws amendments (e.g., rainwater harvesting / solar / environmental bye-law circulars or notifications on `bpas.bbmpgov.in/BPAMSClient4/CommonForms/Circulars.aspx`).
  - Acquire any newly discovered obtainable PDFs via `bylaws acquire` with full R15 `retrieval` records and R17 `status_evidence`, and log every search query and result in `data/reports/in-ka-bengaluru-south/source-discovery.md` and `docs/sources/in-ka-bengaluru-south.md`.

### 2. Structure Building Bye-laws Chain Instruments & Layer 2 Annotations (`pipeline/bylaws/structure.py`, `pipeline/bylaws/annotations.py`)
- Enable structuring (`structured: true`) for all acquired Building Bye-laws instruments (`bbl-2003`, `ka-model-bbl-2017`, and any acquired `bbl-2003` amending instruments).
- Ensure amending instruments are structured into preamble, title and commencement, numbered amending instructions, nested quoted replacement/inserted nodes, and signature block, with `draft` instruments published under `drafts` and excluded from `in_force` amendment effects.
- Run Layer 2 stand-off annotation extraction (`cross_reference`, `defined_term_use`, `provision_type`) across all newly structured documents and any newly introduced nodes.

### 3. Layer 3 Effects, Node Versions & Derived Consolidated View (`pipeline/bylaws/amendments.py`, `pipeline/bylaws/consolidate.py`)
- Enhance `pipeline/bylaws/amendments.py` and `pipeline/bylaws/consolidate.py` to:
  - Extract Layer 3 `effects` (`action`: `substitute`, `insert_after`, `insert_before`, `omit`, `renumber`, `modify_text`; `target_eid`; `new_nodes`; `valid_from` from the instrument's commencement provision; `confidence`; `applied` boolean and `unapplied_reason` when `confidence < 0.8` or target is ambiguous/unobtainable).
  - Support declarative/curated amendment effects in `data/overrides/<jurisdiction>/overrides.yaml` (`amendment_links`) alongside automated instruction parsing so multi-clause substitutions, table insertions, and statutory saving/supersession notes are captured with 100% precision.
  - Create new `NodeVersion` entries (`v2`, `v3`, ...) on modified target nodes with `valid_from` and `valid_to`, and compute derived consolidated views (`consolidated.json`, `derived: true`) for each amendment date and today.
- Verify every applied effect against the amending document's rendered page image in `data/reports/in-ka-bengaluru-south/qa.md`.

### 4. Web Document Viewer, Timeline & Release `2.3.0` (`app/j/[id]/documents/[doc]/page.tsx`, `components/ClauseTree.tsx`, `app/j/[id]/timeline/page.tsx`)
- Update the Document viewer (`/j/in-ka-bengaluru-south/documents/[doc]`) so:
  - It renders the **Original / As amended (derived)** toggle with date selector when amendments/versions exist, shows `"Changed by <instrument>, from <date>"` with links to the amending instruction and source page, and displays low-confidence (`applied: false`) effects beside their targets without applying them.
  - It updates the coverage notice per document: for `bbl-2003`, state the exact status of the Building Bye-laws chain (including any unobtainable 2026 notifications declared in `declarations.json`), while keeping the `"Amendments not yet applied"` notice on `rmp2015-zr` until PR 09.
- Update the Timeline page (`/j/in-ka-bengaluru-south/timeline`) to show the complete chronological chain of instruments (`1961–2026`), what each instrument changed, and links to structured documents and affected clauses.
- Publish Release `2.3.0` (`public/data/in-ka-bengaluru-south/2.3.0/`).

## Affected Memory

- `architecture/overview`: (modify) Document Building Bye-laws chain structuring, Layer 3 effects/versions, consolidated date views, page-image effect verification in `qa.md`, and Release `2.3.0`.
- `schemas/data-contracts`: (modify) Document any schema additions in `amendments.schema.json` / `consolidated.schema.json` / `overrides.schema.json` for Layer 3 effect payloads and date-indexed consolidated views.

## Impact

- **Schemas**: `schemas/amendments.schema.json`, `schemas/consolidated.schema.json`, `schemas/overrides.schema.json`, regenerated `pipeline/bylaws/models/_generated.py` and `lib/types/generated.ts`.
- **Pipeline**: `pipeline/bylaws/structure.py`, `pipeline/bylaws/amendments.py`, `pipeline/bylaws/consolidate.py`, `pipeline/bylaws/validate.py`, `pipeline/tests/test_bylaws_amendment_chain_pr08.py`.
- **Config & Reports**: `jurisdictions/in-ka-bengaluru-south.yaml`, `data/overrides/in-ka-bengaluru-south/overrides.yaml`, `data/reports/in-ka-bengaluru-south/source-discovery.md`, `data/reports/in-ka-bengaluru-south/qa.md`, `docs/sources/in-ka-bengaluru-south.md`, `docs/progress.md`.
- **Web App**: `app/j/[id]/documents/[doc]/page.tsx`, `components/ClauseTree.tsx`, `app/j/[id]/timeline/page.tsx`, `__tests__/routes-and-axe.test.tsx`.
- **Published Data**: `public/data/in-ka-bengaluru-south/2.3.0/`, `public/data/manifest.json`.

## Open Questions

None — `docs/plans/pr-series/08-bye-laws-amendment-chain.md` and `03-schema-three-layers.md` specify the Layer 1/2/3 structure, effect actions, low-confidence handling, page-image self-check in `qa.md`, and UI behavior.

## Assumptions

| # | Grade | Decision | Rationale | Scores |
|---|-------|----------|-----------|--------|
| 1 | Certain | Bump `in-ka-bengaluru-south` `release_version` to `"2.3.0"` for PR 08 | Follows `08-bye-laws-amendment-chain.md` §5 (`New release; declarations updated`), incrementing minor version from PR 07's `2.2.0` | S:95 R:95 A:95 D:95 |
| 2 | Certain | Re-search official portals and Wayback Machine for any additional Building Bye-laws 2003 amendments (including `bpas.bbmpgov.in` circulars/notifications and 2026 BSCC bye-law notifications), acquire obtainable PDFs with R15 `retrieval` records, and declare unobtainable ones under Rule R16 | Explicitly required by `08-bye-laws-amendment-chain.md` §Inputs and Rules R15/R16 | S:95 R:90 A:95 D:95 |
| 3 | Certain | Structure `ka-model-bbl-2017` and all acquired Building Bye-laws chain instruments to Schema 1.3 Layer 1 + Layer 2 + Layer 3, verify applied effects against page images in `qa.md`, and keep the `"Amendments not yet applied"` notice on `rmp2015-zr` until PR 09 | Explicitly required by `08-bye-laws-amendment-chain.md` §1–§5 | S:95 R:90 A:95 D:95 |

3 assumptions (3 certain, 0 confident, 0 tentative, 0 unresolved). Run /fab-clarify to review.
