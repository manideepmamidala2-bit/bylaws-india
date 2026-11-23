# ADR 002: Open Data Licensing, Permissive Dependency Policy, and Indicodes Rules Practices

- **Date**: 2026-11-23
- **Status**: Accepted
- **Context**: Plan v1.1 §2 (Decisions D1, D2, D5, D6, D7, D13), §3 (Rules R4, R7, R8, R9), §4 (Open Data Setup), §10 (Indicodes Rules Compatibility)

## Context

Following completion of Milestones M0 and M1, the project was transitioned to a fully public open-data and open-code repository with an end-to-end vertical slice (Milestone M1.5). Three architectural and governance areas needed formal decisions:

1. **Open Data & Code Licensing (D1)**: How source code and published regulatory datasets are licensed and distributed.
2. **Strict Permissive Dependency Policy (D2 / R4)**: Whether any GPL, AGPL, or non-commercial dependencies or model weights can be used in the pipeline or parser comparison.
3. **Provenance, Immutability, and Gap Declarations (D5, D6/R9, D7, D13)**: How to structure citations, preserve human-verified records across overrides, declare unmodelled regulations, and stay compatible with the broader Indian computable rules ecosystem.

## Decisions

### 1. Apache-2.0 for Code and CC BY 4.0 for Data (`D1`)

- All source code in this repository is licensed under the **Apache License 2.0** (`LICENSE`).
- All published structured datasets, overrides, and reports are licensed under **Creative Commons Attribution 4.0 International (CC BY 4.0)** (`LICENSE-DATA.md`), with required attribution to `"Structured Building Bylaws"` and a clear note that underlying statutes and notifications are Indian government publications.
- Every data release is published both to Vercel Blob (for the web viewer) and as a downloadable `.zip` archive with `SHA256SUMS`.

### 2. Zero GPL / AGPL / Non-Commercial Dependencies (`D2` / `R4`)

- Every runtime dependency, model weight, and hosted tool output must permit commercial and open-data redistribution.
- **Marker** and **MinerU** are permanently removed from the Milestone M3 parser comparison due to GPL/AGPL and non-commercial model weight restrictions.
- M3 parser comparison uses `pypdfium2` (Apache-2.0 / BSD-3-Clause baseline), `Docling` (MIT), and optionally `LLMWhisperer` (if terms permit publishing outputs).
- Automated CI tests (`pipeline/tests/test_r4_licences.py`) inspect installed Python distributions and npm packages on every push and verify that `docs/dependencies.md` stays complete.

### 3. Adoption of Indicodes Rules Practices (`D5`, `D6`/`R9`, `D7`, `D13`)

We credit **Indicodes Rules** (<https://github.com/indicodes-in/rules>, Apache-2.0 code / CC BY 4.0 data) for three data-hygiene practices adopted into Schema v1.1 (no code or data is copied from Indicodes Rules in Phase 1):

1. **Citation with Page Bounding Box (`D5`)**: Clause citations carry `{ doc_id, page, bbox: [x0, y0, x1, y1], text_excerpt }` rather than bare page numbers so readers and downstream tools can locate the exact region on a page.
2. **Immutable Human-Verified Records (`D6` / `Rule R9`)**: Records with `verification: "human_verified"` are never mutated in place. When an override updates a `human_verified` clause or zone, `apply-overrides` retains the original record (`@v1`) with `superseded_by` pointing to the new `record_id` (`@v2`) and appends the new record with `supersedes` pointing to `@v1`.
3. **Self-Declared Jurisdiction Gaps (`D7`)**: Every jurisdiction release publishes `declarations.json` (`not_modelled`, `known_gaps`, `unread_documents`) so users know what the dataset does and does not cover.
4. **Phase 2 Compatibility (`D13`)**: In Phase 2, computable parameter/condition rules will be designed with a bidirectional converter for the Indicodes Rules schema.
