# PR 12 — Greater Bengaluru, Overnight Run: 08b, 09, 09b, 10, 11

**Read first:** `00-overview.md`, then the part plans this file combines: `08b-clarity-navigation-map-fix.md`, `09-zoning-regulations-amendment-chain.md`, `09b-relations-topics-conflicts.md`, `10-supporting-provisions.md`, `11-all-sheets-zone-links-release.md`. This file sets the order, the city-wide scope, and the rules for an unattended run. **Where this file differs from a part plan, this file wins.**

**Depends on:** PR 08 merged (Building Bye-laws chain for Bengaluru South).

---

## 1. Scope change: the whole city

The scope grows from Bengaluru South City Corporation to **all of Greater Bengaluru**: the area governed by the Greater Bengaluru Authority, made up of five City Corporations: **Central, North, South, East and West**.

- **In scope:** all five corporations, all their wards, every RMP 2015 planning district sheet that intersects any of them.
- **Out of scope:** parts of the BDA local planning area outside the GBA boundary (villages and towns under other local bodies). Declare this in every release.

### What is shared and what differs

| Layer | Shared across the city | Differs by corporation |
|---|---|---|
| Building Bye-laws 2003 (base) | Yes | — |
| 2026 amendments to the bye-laws | — | **Each corporation issued its own** (final versions in force from 14.05.2026; drafts of April 2026) |
| RMP 2015 Zoning Regulations and their amendments | Yes (BDA local planning area) | — |
| Supporting provisions (fire, TDR, OC exemptions, metro) | Mostly yes; check each instrument's extent | Some orders may name specific areas |
| Land-use maps | Same sheet series | Different sheets cover different corporations |
| Boundaries, wards | — | Per corporation |

Consequence: **the bye-laws "as amended" text differs by corporation.** The consolidated view must be computed per corporation.

### Jurisdiction model (R1: all in config)

- Parent: `in-ka-bengaluru` (Greater Bengaluru, GBA area). Holds the shared documents.
- Children: `in-ka-bengaluru-central`, `-north`, `-south` (existing ID kept, so current links keep working), `-east`, `-west`. Each holds its own amendment instruments, boundary and wards, and inherits the parent's documents.
- Schema: jurisdictions gain `parent`; effects gain `applies_in` (list of jurisdiction IDs, from the amending instrument's own extent). Consolidated views are computed per jurisdiction from the effects that apply there.
- Website: home shows **Greater Bengaluru** with a corporation picker; the city map shows all five corporations; selecting a place resolves its corporation and shows that corporation's version of the bye-laws plus the shared regulations.

### City sources to add (acquire through `bylaws acquire`, R15, R17)

- The 2026 Building (Amendment) Bye-laws of **Central, North, East and West** City Corporations, final and draft: start from https://data.opencity.in/dataset/bengaluru-city-corporations-bye-laws-2026 and find each original on the GBA or corporation website. (Central's final is reported as notification BCCC/Com/PR/48/2026-27; confirm from the document.)
- All five corporation boundaries and the GBA zones map: https://data.opencity.in/dataset/greater-bengaluru-authority-corporations-delimitation-2025 (already acquired for South; reuse the same files).
- All 369 wards (final notification of 19 November 2025 and the December 2025 named version): https://data.opencity.in/dataset/gba-wards-delimitation-2025.
- All RMP 2015 land-use sheets intersecting the GBA boundary: from https://site.bbmp.gov.in/revised%20masterplan%20(1).html and the `site.bbmp.gov.in/PDF/landusemaps/...` and `site.bbmp.gov.in/documents/...` files, mirror https://data.opencity.in/dataset/bda-revised-master-plan-2015. The index lists 47 planning districts.

---

## 2. Rules for an unattended overnight run

All rules in `00-overview.md` apply, especially **R15 (provenance gate), R16 (never generate source content), R17 (evidence quotes the source), R10 (nothing `human_verified`)**. For this run:

1. **No pauses.** Owner checkpoints are replaced by a **"For owner review"** section in the PR description: anything a person should look at (sheets with high placement error, low-confidence effects, unknown applicability, conflicts in status) is listed there with links. Nothing waits; nothing is marked verified by a person.
2. **Work in parts, in order (Section 3). Commit and push at the end of every part** (and at least hourly within long parts), so the preview always shows a working state. Each part ends with CI green and an honest release.
3. **Never leave a broken state.** If a part cannot be finished, finish what is solid, declare the rest (`declarations.json` and "Known gaps" in the PR description), and move to the next part only if it does not depend on the unfinished work. Otherwise stop and write a clear status.
4. **Priority if time runs out:** correctness of what is published > Bengaluru South completeness > city breadth. Better one corporation done properly than five done badly.
5. **Resumable.** Keep `docs/progress.md` updated per part and per sub-step (e.g. "sheets done: 2.08, 2.09, 2.10a/b; remaining: …"). A later session must be able to continue from it with the same prompt.
6. **One pull request**, opened as a draft at the start, preview URL at the top of the description, updated as parts land. The owner merges.
7. **Never fabricate to meet a target.** A blocked download, an unreadable sheet or an ambiguous amendment is a declared gap, not something to work around with invented content.

---

## 3. Parts, in order

### Part 1 — Map fix, clarity and navigation (`08b`)
Everything in `08b-clarity-navigation-map-fix.md`, with one change: build the tree, `/structure`, search and `graph.json` to handle **multiple jurisdictions** (documents grouped by parent and child jurisdiction).

**Done when:** map renders in the Playwright test (206 responses, non-blank canvas); annotation noise gone; law-first document view; structure page; outline tree; Pagefind search; `graph.json`. Commit, push, release.

### Part 2 — City foundation (new)
- Add the parent and child jurisdictions (Section 1); move shared documents to the parent; keep South's existing data and URLs working.
- Import all five corporation boundaries, GBA zones and all 369 wards with retrieval records; check ward counts per corporation against the source; report differences.
- Acquire, structure and apply the **2026 bye-laws amendments of Central, North, East and West**, using the PR 08 method (amending instruments as documents, effects with `applies_in`, versions, consolidated view per corporation, page-image checks of every applied effect).
- City map: all corporations and wards; corporation picker on the home page; Document page shows a corporation selector for the bye-laws' consolidated view.

**Done when:** five corporations with boundaries and wards on the map; all five bye-laws consolidated views available; differences between corporations visible (e.g. a provision shows "As amended in North City Corporation" vs "As amended in South City Corporation"). Commit, push, release.

### Part 3 — Zoning Regulations amendment chain (`09`)
Everything in `09-zoning-regulations-amendment-chain.md`, attached to the parent jurisdiction (the zoning regulations apply across the BDA area). Split note: if the chain exceeds about 12 instruments, do it in two sub-parts by date (to 2018; 2019 onwards), committing after each.

**Done when:** chain structured, effects applied and verified against page images, consolidated view and timeline; the "amendments not yet applied" notice removed from the zoning regulations only if the chain is complete to best evidence. Commit, push, release.

### Part 4 — Relations, topics and conflicts (`09b`)
Everything in `09b-relations-topics-conflicts.md`, city-wide:
- Topics and relations computed per corporation where bye-laws differ, and across the shared regulations.
- Add a relation kind `corporation_differs`: the same bye-law provision has different consolidated text in two corporations; shown on the Topics pages ("This rule differs between corporations").
- Applicability and succession tables cover all five corporations (e.g. BBMP → each of the five City Corporations by area).

**Done when:** topic pages, side-by-side comparisons, conflict flags, precedence only from quoted law, applicability, succession, local graph. Commit, push, release.

### Part 5 — Supporting provisions (`10`)
Everything in `10-supporting-provisions.md`, city-wide. Check each instrument's own extent clause and record `applies_in`. Overlays (metro influence zone, verified lake buffers) drawn for the whole city.

**Done when:** supporting instruments confirmed, relevant provisions structured, overlays only where rules are verified. Commit, push, release.

### Part 6 — All land-use sheets, zone links and release (`11`)
Everything in `11-all-sheets-zone-links-release.md`, city-wide, in this order so progress is useful at every stop:
1. Remaining Bengaluru South sheets.
2. Then corporations by the share of their area covered by processed sheets, finishing one corporation before starting the next.
3. Zone links (`zone_applicability` with evidence spans) once the legend-to-regulation mapping is built; the mapping is shared across the city.
4. Per-sheet measured error and independent checks in `map-verification.md`; sheets beyond 30 m published as outlines only and listed for owner review.

Commit after each sheet or small batch of sheets.

**Done when:** every sheet intersecting the GBA boundary is processed or declared; coverage reported per corporation and city-wide; zone click shows linked provisions for the right corporation; final release published.

---

## 4. Releases

- One release per completed part, versioned from config (continuing from the last real release).
- The final release of this run covers Greater Bengaluru to the extent completed, with `declarations.json` listing per corporation: documents not found, effects unapplied, sheets missing or high-error, overlays not drawn, unknown applicability.
- Data page lists all releases; Release 1.0.0 stays withdrawn.

---

## 5. PR description (keep updated through the night)

- Preview URL.
- Progress per part (done, partial, not started) with links to commits.
- **For owner review:** the specific items, each with a link and one line on what to check.
- Decisions made.
- Known gaps.
- Release contents: per corporation and city-wide counts (documents, provisions, effects applied/unapplied, topics, relations by kind, zones by sheet with measured error, zone links, coverage).

---

## 6. Acceptance for the whole run

- [ ] Map renders (CI browser test).
- [ ] Clarity, navigation, search and `graph.json` live.
- [ ] Five corporations with boundaries, wards and their own bye-laws consolidated views.
- [ ] Zoning regulations chain complete to best evidence.
- [ ] Topics, relations, conflicts, precedence, applicability, succession live.
- [ ] Supporting provisions with verified overlays only.
- [ ] Sheets processed city-wide in the stated order, or progress and remaining list recorded.
- [ ] Every published item traceable to a fetched source; provenance gate green; nothing `human_verified`.
- [ ] PR description complete; `docs/progress.md` resumable.
