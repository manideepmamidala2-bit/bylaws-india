# PR 11 — All Land-Use Sheets, Zone Links and Release

**Read first:** `00-overview.md`, `07-one-land-use-sheet.md` · **Depends on:** PRs 07 and 09 (and 10 for overlay links) · **Estimate:** 8–12 days · **Checkpoint:** owner reviews and merges

## Goal

Complete the map for the whole of Bengaluru South using the method proven in PR 07, link every zone to the clauses that apply to it with evidence, and publish the complete Bengaluru South release.

## 1. All sheets

- Process every planning district sheet intersecting Bengaluru South (list from PR 07), with the PR 07 method: vector extraction where possible, placement by the printed grid, raster fallback otherwise.
- Per sheet: measured placement error, independent checks (roads, ward boundaries), and a section in `map-verification.md`.
- Sheets that miss the accuracy target are still published if within 30 m, with their measured error shown; beyond that, the district shows its outline only and the gap is declared.
- **Edges between sheets:** where neighbouring sheets overlap, keep the area from the sheet that owns it according to the index map; report slivers and gaps along sheet edges and their sizes.
- Clip to the corporation boundary. Report coverage: share of the corporation's area with a zone code.
- Sheet overlays available for every sheet.

## 2. Zone links (adds the `zone_applicability` annotation)

A clause is linked to a zone only with evidence from its own words.
- New annotation kind `zone_applicability`: target node and span, `zone_code` (as printed in the map legends) or `ALL`, and the span text that establishes it (e.g. a chapter heading for a zone, a "permissible uses" table column, or a clause naming the zone).
- Sources of evidence, in order: zone-specific chapters and sections of the zoning regulations; permissible-use tables; tables with zone columns or rows; clauses that name zones.
- `ALL` only for provisions whose text applies to all buildings or all zones (e.g. general regulations applicable to all zones), with the span that says so. **Preamble, short title, definitions and commencement provisions are never linked to zones.**
- Supporting provisions (PR 10) are linked to their overlays or to `ALL` only where their text supports it.
- Legend codes and regulation zone names may differ in wording; build a mapping table from legend labels to regulation zone names, with evidence for each pair, in `docs/map.md`. Unmatched legend codes are declared.
- Map page: click a zone → linked nodes grouped by document, using the consolidated (as amended) text by default, each with its evidence span highlighted on hover and a "View source p. N" link.

## 3. Website completion

- Home: real counts from the release; coverage and gaps from declarations in plain English.
- Sources, Documents, Timeline, Map, Data, About: all real data; no internal rule numbers or paths in copy.
- Review page: every sheet's overlay and zones.
- Accessibility (axe) passes on every page.

## 4. Release

- Release `3.0.0` (or next major): complete Bengaluru South to best evidence.
- Declarations: documents not found or not obtainable; unapplied or conflicting effects; sheets with high error or missing; unmatched legend codes; overlays not drawn and why; status-unknown instruments.
- Bundle (zip) with checksums; source register as CSV and JSON.
- PR description summary: documents by tier, nodes, tables, effects applied and unapplied, zones by sheet with measured error, zone links, coverage, known gaps.

## Acceptance

- [ ] Every sheet in Bengaluru South processed with measured error, or declared.
- [ ] Coverage reported; sheet-edge issues reported.
- [ ] Every zone link has an evidence span; no preamble, title, definition or commencement provision linked to a zone.
- [ ] Legend-to-regulation mapping documented with evidence.
- [ ] All pages render real data; axe passes.
- [ ] Release published with complete declarations.
- [ ] CI green.
