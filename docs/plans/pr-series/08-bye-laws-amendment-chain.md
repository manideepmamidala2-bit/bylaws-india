# PR 08 — Building Bye-laws Amendment Chain

**Read first:** `00-overview.md`, `03-schema-three-layers.md` · **Depends on:** PR 05 · **Estimate:** 4–6 days · **Checkpoint:** owner reviews and merges

## Goal

Bring the Building Bye-laws 2003 up to date: structure every amending instrument found in PR 04, turn each instruction into effects on the 2003 text, and publish the consolidated "as amended" view alongside the original.

## Inputs

The bye-laws chain from the PR 04 register, including the Bengaluru South City Corporation Building (Amendment) Bye-laws 2026 (final, from 14.05.2026) and its 01.04.2026 draft, and any earlier amendments found. If PR 04 left gaps in this chain, search again first and log it; acquire anything new through `bylaws acquire` (R15).

## 1. Structure each amending instrument (Layer 1)

- Each amending document becomes its own structured document: preamble, title and commencement, each numbered instruction as a node, quoted new text as nested nodes, signature block.
- Drafts are structured and published as `draft` documents; they never produce effects on the in-force text.

## 2. Effects (Layer 3)

- For each instruction: `action` (`substitute`, `insert_after`, `insert_before`, `omit`, `renumber`, `modify_text`), `target_eid` in the 2003 tree, `new_nodes` from the quoted text, `valid_from` from the instrument's own commencement provision (R17).
- Handle whole-provision replacements (e.g. a substituted clause with a new table), omissions of several bye-laws at once, and insertions of new tables.
- Target resolution: by native number and context; when the instruction's wording is ambiguous, record `confidence` low and do not apply; list in `qa.md`.
- Where an instruction targets text not found in our 2003 tree, stop and check: either our tree is wrong (fix through overrides with page evidence) or the instruction targets an earlier amendment not yet found (search, log, declare).

## 3. Versions and consolidated view

- Applying effects creates new versions on target nodes with `valid_from` and `valid_to`.
- Consolidated view computed for today and for each amendment date, marked derived (R14), listing effects applied.
- Document page: "Original / As amended (derived)" toggle; each changed node shows "Changed by <instrument>, from <date>" with links to the instruction and its source page. Low-confidence effects shown beside their targets, not applied.
- Timeline page: the bye-laws chain in date order, each instrument with what it changed.

## 4. Quality

- Every instruction in every in-force amending instrument has an effect (applied, or recorded as unapplied with reason).
- Self-check: every applied effect compared against the amending document's page image and the resulting consolidated text; recorded in `qa.md`.
- Annotations (three kinds) for the amending documents and the new nodes they introduce.

## 5. Publish

- New release; declarations updated (bye-laws chain complete to best evidence, or gaps listed).
- Remove the "amendments not yet applied" notice from the bye-laws only when every known in-force instrument's effects are applied or explicitly listed as unapplied.

## Acceptance

- [ ] Every bye-laws amending instrument found is structured; drafts labelled.
- [ ] Every instruction has an effect; applied effects verified against page images.
- [ ] Consolidated view correct for today and each amendment date (tests on chosen nodes with hand-written expectations).
- [ ] Timeline shows the chain.
- [ ] CI green.
