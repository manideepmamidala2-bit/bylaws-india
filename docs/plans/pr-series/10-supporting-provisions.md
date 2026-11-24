# PR 10 — Supporting Provisions

**Read first:** `00-overview.md` (scope tiers) · **Depends on:** PRs 08 and 09 · **Estimate:** 4–6 days · **Checkpoint:** owner reviews and merges

## Goal

Add the building rules that live outside the bye-laws and zoning regulations, structuring **only the provisions that govern buildings**, each linked to its full instrument.

## Candidates (leads; confirm each from the instrument, R17)

| Topic | Instrument to find | What to structure |
|---|---|---|
| Fire NOC for high-rise buildings | Karnataka Fire Force Act 1964 as amended by the 2023 Amendment Act (NOC for buildings of 21 m and above, deemed in force from 24 March 2023) and the 2025 Amendment Act (fire cess) | The sections that require the NOC, define high-rise, and levy the cess on buildings |
| TDR | Karnataka Town and Country Planning (Benefit of Development Rights) Rules, 2016 | Rules on using development rights in buildings (FAR loading, setback relaxation) |
| Occupancy certificate exemptions | Order No. NAE/334/MNU of 2025 dated 9 September 2025 (residential plots up to 1,200 sq ft); order dated 5 June 2026 extending to plots up to 2,400 sq ft | The full orders (they are short) |
| Metro influence zone | Notification UDD 110 PRJ 2020 dated 11 May 2020 (11 m either side of underground metro structures; BMRCL NOC) | The full notification |
| Lake buffers | Karnataka Tank Conservation and Development Authority Act and its 2025 Amendment | Only if the amendment's assent and notification are verified from the Gazette or India Code. Otherwise: register entry with `status_unknown` and the conflicting evidence; nothing structured or drawn |
| GBA rules on occupancy and commencement certificates, 2025 | Listed on OpenCity under the GBA organisation | Building requirements only |
| Others | Anything found during PRs 04–09 that passes the inclusion test | Relevant provisions, with the reason for inclusion recorded |

Sources: Karnataka Gazette and e-Gazette, India Code, UDD, GBA, BMRCL, OpenCity. PRS India bill texts may help find Acts but are not the enacted text.

## Work

- **Register:** each instrument added with tier `supporting`, full-instrument link, and a list of which provisions are structured and why.
- **Structure:** relevant provisions only, as subtrees of the instrument with their real addresses (e.g. `sec_13__subsec_3`), so citations are correct. Unstructured parts are not invented as placeholders; the document page states "Only building-related provisions are included" and links to the full text.
- **Effects:** where an amending Act changes a relevant section, model it as effects (same machinery as PRs 08–09).
- **Annotations:** three kinds; cross-references from the bye-laws or zoning regulations to these provisions resolved where they exist.
- **Map overlays (R14, labelled derived and approximate):**
  - Metro influence zone: a buffer around underground metro structures using alignments from OpenStreetMap or BMRCL publications; plainly labelled approximate because tunnel outer edges are not published.
  - Lake buffers: only if the rule is verified; buffer distances from the verified rule by lake size; lake geometry from an official source if available, otherwise OpenStreetMap, labelled.
  - Airport height zones: not drawn; a link to the AAI NOCAS portal in the coverage note.
- **Not included:** National Building Code text (reference only); whole Acts beyond their building provisions.

## Acceptance

- [ ] Each supporting instrument confirmed from its source, with tier, full link and included provisions listed.
- [ ] Included provisions structured with correct addresses; nothing invented for excluded parts.
- [ ] Overlays drawn only where the rule is verified; each labelled derived and approximate with its method.
- [ ] Release updated; declarations list what was excluded and why.
- [ ] CI green.
