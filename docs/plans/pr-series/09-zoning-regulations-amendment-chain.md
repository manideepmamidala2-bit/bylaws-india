# PR 09 — Zoning Regulations Amendment Chain

**Read first:** `00-overview.md`, `03-schema-three-layers.md`, `08-bye-laws-amendment-chain.md` (same method) · **Depends on:** PR 05 (and the effects machinery from PR 08) · **Estimate:** 6–9 days · **Checkpoint:** owner reviews and merges

## Goal

Bring the RMP 2015 Zoning Regulations up to date using the same method as PR 08. This chain is longer and includes whole new chapters, so it is a separate PR. If it grows beyond about 12 instruments, split it into two PRs by date (up to 2018; 2019 onwards) and say so in the PR description.

## Inputs

The zoning regulations chain from the PR 04 register. Expected to include (all to be confirmed from the documents themselves, R17):
- Amendment Regulations 2014.
- Notification UDD 105 MNJ 2008 dated 20-03-2015.
- Notification UDD 255 MNJ 2018.
- Impact Zone Premium FAR, UDD 112 MNJ 2015 dated 29.09.2018.
- Transport & Telecommunication zone uses amendment.
- Premium FAR chapter, UDD 78 MNJ 2024(E) dated 21.02.2025, its 02.04.2025 schedule notification, and the February 2026 revision of the road-width table.
- Amendment Regulations 2025, final July 2025 (height, stilt parking).
- Storm water drain buffer amendment (late 2025).
- Amendment Regulations 2025, UDD/235/MNJ 2025(E), final 05.01.2026 (setbacks, parking).
- Drafts (stilt parking 2025, November 2025 setbacks, the 21 m to 24 m high-rise proposal): structured as drafts, no effects.
- Anything else in BBMP's consolidated "Amendment to Zoning Regulation" PDF.

BBMP's consolidated amendment PDF is a compilation, not an instrument: use it to find instruments and cross-check, but take effects from the instruments themselves where they can be obtained. Where only the compilation exists for an amendment, record that as the source with a note.

## Special cases

- **Inserted chapters** (e.g. premium FAR inserted after Chapter 10): the whole chapter becomes new nodes with `insert_after` on the chapter level; their tables become table nodes.
- **Superseded amendments:** where a later instrument replaces an earlier amendment's text (e.g. the Impact Zone Premium FAR of 2018 and the 2025 premium FAR chapter), model it as effects on the same targets in date order. Do not decide which "wins" by reasoning; the effects' dates and wording decide. If two instruments conflict and the later one does not clearly replace the earlier, record both, apply neither, and declare.
- **Changes to tables** (setback tables, FAR by road width): row-level effects where the instrument replaces rows; table-level substitution where it replaces the table.
- **Court rulings:** the premium FAR notifications were challenged and upheld. The register may note that, with the judgment as a link, but judgments do not produce effects.

## Work

Same as PR 08: structure each instrument; effects with confidence; versions; consolidated view; document page toggle; timeline; QA with page-image self-check for every applied effect; three annotation kinds; new release; remove the "amendments not yet applied" notice from the zoning regulations only when the chain is complete to best evidence.

## Acceptance

- [ ] Every zoning regulations amending instrument found is structured; drafts labelled; compilations used only as finding aids or declared sources.
- [ ] Inserted chapters and replaced tables applied correctly (tests with hand-written expectations on chosen nodes and rows).
- [ ] Conflicts recorded, not resolved by guesswork.
- [ ] Consolidated view and timeline complete to best evidence; gaps declared.
- [ ] CI green.
