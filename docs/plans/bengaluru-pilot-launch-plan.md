# Bylaw One: Bengaluru Pilot, Launch-Ready Website

**Date:** 26 November 2026 · **Basis:** the live site (https://bylaws-india.vercel.app), the status reviews of 26 November 2026, and the launch decisions · **Run after:** the trust-and-accuracy round is merged · **Target:** launch-ready by 10 January 2027

This plan is self-contained. It replaces the earlier "Bengaluru Pilot" plan.

---

## 1. Goal

Make the current website ready to launch publicly as **a working pilot for Bengaluru**, so that in the last week of January 2027 it can be shown to colleges, practitioners and the press, and invite them to join.

After this round, a visitor understands in a few minutes: the problem, that it works for Bengaluru, that machines and AI can use it, how trustworthy it is, and how to join. Students in a workshop can verify rules against official pages, and their verification is recorded with their names.

### Not in this plan (separate plans)
- Processing more land-use map sheets (Bengaluru South completion).
- The agent engine (local MCP server, command line, Agent Skill).
- Organisation, funding and launch-event logistics.

---

## 2. Fixed decisions

- No plot calculator on the website. The map shows the rules for a place's zone, with sources; it does not compute a plot.
- English only. Code Apache-2.0, data CC BY 4.0. Repository becomes public after this round.
- Bylaw One is run by the owner's organisation; the site says who runs it and that everything released stays open permanently.
- Tools chosen for this round (no alternatives to evaluate):

| Need | Tool | Licence |
|---|---|---|
| Map rendering | MapLibre GL JS | BSD-3 |
| Base map style | @protomaps/basemaps, `light` flavor | BSD-3 (tiles ODbL, attribution required) |
| Base map file | PMTiles, existing Bengaluru extract | open format |
| Place search | MiniSearch | MIT |
| Reading place names from tiles at build time | pmtiles + @mapbox/vector-tile | BSD-3 / BSD-3 |
| Sheet overlay | MapLibre image source with fitted corner coordinates | built in |
| Secret scan | gitleaks | MIT |
| Analytics | Vercel Web Analytics (cookieless, no personal data) | service |
| Social images | next/og | MIT |

---

## 3. Rules for the work

- Never invent or rewrite legal text; every value traced to its page.
- Every number shown on a page is generated from data at build time, never typed by hand.
- Plain language first; details on tap; no internal IDs in the primary layer.
- Nothing city-specific in code.
- Owner-only actions (enabling Zenodo, publishing a contact email, making the repository public) are listed in the PR, not done by the agent.
- Commit and push after each part; the preview always works.

---

## 4. Work, in order

### Part 1 — Ready to open the repository

1. Run gitleaks over the full git history. If anything is found, list it in the PR under "For owner review" (rotation and history rewrite are owner actions). Add gitleaks to CI.
2. Add or update: `README.md` (what, why, how to run, how to contribute), `LICENSE` (Apache-2.0), `LICENSE-DATA.md` (CC BY 4.0 with attribution text), `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md` (Contributor Covenant 2.1), `SECURITY.md`, `GOVERNANCE.md` (run by the owner's organisation; released data and code stay open permanently; partners may join an advisory group).
3. Add `CITATION.cff` and `.zenodo.json`.
4. Add GitHub issue forms: "Report a problem with a rule" (site link, what is wrong, official page that shows it), "Suggest a source", "Join the pilot".
5. Contact details come from one config value (`contact.email`); leave it as a placeholder for the owner.

**Done when:** gitleaks passes in CI; all files present; issue forms render on GitHub.

### Part 2 — The map, rebuilt with existing data

**2.1 Base and layout**
- Rebuild the map page in the Bylaw One design using MapLibre and the Protomaps `light` flavor, with fonts and sprites self-hosted. Keep the existing browser test (tile responses 206, canvas not blank).
- Attribution: "Protomaps © OpenStreetMap".
- Add **Map** to the main navigation (The code, Map, What changed, About).

**2.2 Layers, bottom to top**
1. Base map without labels.
2. Land-use zones in the official RMP 2015 legend colours, 60% opacity; zone codes shown inside polygons from zoom 15.
3. Light diagonal hatch over areas without land-use data, labelled "Land-use data not yet available".
4. Planning district outlines.
5. Ward boundaries; ward names from zoom 13.
6. Corporation boundaries.
7. Derived overlays (lake buffers) as dashed outlines labelled "derived".
8. Base map labels on top.

Layer switch, in plain words: Land-use zones, Wards, Corporations, Planning districts, Original map sheets.

**2.3 Place search**
- At build time, read place names (localities, neighbourhoods, major roads, landmarks) from the PMTiles extract, add ward names and numbers and corporation names, and write `place-index.json` (target ≤ 300 KB compressed).
- Search with MiniSearch (fuzzy, prefix). Selecting a result flies the map to it and opens its place card.
- "My location" button using browser geolocation, only on click.

**2.4 Place card**
- Shows: corporation, ward (name and number), planning district, land-use zone (plain name and code) or "Land-use data not yet available here".
- **Rules for this zone**, grouped: Uses, FAR, Ground coverage, Setbacks, Height, Parking. Each line: the rule in plain words, value or range with units, and a page link; opens the subject page for that topic. Uses existing zone links and parameter records only. If a zone code has no linked rules: "No rules linked to this zone yet."
- One line on why the zoning regulations govern these subjects (bye-law 1.4), with the quote on tap.
- Corporation differences marked.
- Phone: bottom sheet. Desktop: side panel.
- Address bar keeps map position and selected place (`#lat,lng,zoom,place`), so a place can be shared.

**2.5 Original map sheets**
- For each processed RMP 2015 sheet, overlay the sheet image using a MapLibre image source with its fitted corner coordinates; opacity slider (0 to 100%).
- Each sheet's details show its name and measured placement accuracy.

**2.6 Accuracy and coverage lines**
- Accuracy text generated from the verification report: median and 90th-percentile distance, in metres.
- Coverage text generated from data: "Land-use zones cover N% of Greater Bengaluru, in parts of Bengaluru South."

**2.7 Without the map**
- "Browse by ward" page: corporation → ward → zones present → rules for each zone. Same content as the place card, reachable without the map and by screen readers.

**2.8 Performance and access**
- Map page: initial JavaScript plus data ≤ 1.5 MB uncompressed; Lighthouse performance ≥ 70 on mobile emulation; accessibility ≥ 95.
- All controls keyboard-operable with visible focus.

**Done when:** browser tests cover search → place card → rule link; sheet overlay opacity works; budgets and Lighthouse thresholds pass in CI.

### Part 3 — Readable by machines and AI

1. `llms.txt` at the site root: what Bylaw One is, coverage, how to cite, the rules any AI should follow (cite the page, label derived values, ask for missing plot details, confirm with the authority), links to key pages and data. `llms-full.txt`: every subject's "What applies today" in Markdown.
2. A Markdown version of every document, subject and provision page at the same path with `.md`.
3. Static JSON API at `/api/v1/` (built at publish time): `documents`, `provisions`, `subjects`, `parameters`, `zones`, `sources`, each record with citation and status. Described by `/api/v1/openapi.json` (OpenAPI 3.1). Schema checks in CI.
4. schema.org `Legislation` JSON-LD on document and provision pages: `name`, `legislationIdentifier`, `legislationDate`, `legislationJurisdiction`, `legislationLegalForce`, `legislationChanges` (for amendments), `isPartOf`, `url` (official PDF). Validated in CI against the schema.org vocabulary.
5. Frictionless Data Package for each release (`datapackage.json` with resources, licences, sources, contributors), downloadable from the Data page.
6. Atom feed of changes at `/updates.xml`, one entry per instrument added or changed, newest first.
7. "Use with AI" page: how to use Bylaw One with an AI today (point it at `llms.txt`, give it a page's Markdown, use the JSON API), that a local agent engine is coming, and the rules an AI should follow.

**Done when:** all files generated in the build; API schema and JSON-LD checks pass; feed validates.

### Part 4 — Verification by people (for workshops)

This is how "verified by a person" becomes real, without a server.

1. **Verification tasks:** a command `bylaws tasks create --count N --subject <subject> --seed <n>` produces a set of tasks, each a record (provision or parameter) with its official page link and archive link. Output: a printable HTML task sheet and a CSV.
2. **Verify page** (`/verify/<task-set>`): shows each task with the record text or value on one side and a "Open official page" link on the other; the verifier marks Match / Mismatch / Can't tell, adds a note, and enters their name and institution. Answers are saved in the browser and exported as a CSV file when done. Nothing is sent anywhere.
3. **Import:** `bylaws verify import <csv>` records each verification in the overrides with verifier name, institution, date and verdict. A record becomes "Verified by a person" only after two independent Match verdicts; any Mismatch opens a review item.
4. **Shown on the site:** each verified record shows "Verified by [name], [institution], [date]" in its details; totals on the "How we check" page.
5. **Credits:** each release's metadata and release notes list verifiers by name and institution.

**Done when:** a task set can be created, completed in the browser, exported, imported, and shown on the site (tested end to end in CI with a fixture CSV).

### Part 5 — Pilot, trust and joining

1. **Home:** under the hero, one line: "A working pilot for Bengaluru. Built in the open. Looking for partners." linking to `/pilot`; add "Find rules by place" linking to the map.
2. **Pilot page** (`/pilot`): the problem and idea in five sentences; what works today with generated numbers (documents, provisions, rules as data, corporations, wards, map coverage, records verified by people, checks per build); what is missing (from declarations); what comes next (Bengaluru complete, Karnataka, other states, agent engine); how to join.
3. **How we check** (`/checks`): every automatic check that runs on each build, what it guarantees, and the latest result; verification totals by level, including zero where zero.
4. **Report a problem:** on every provision and rule row, a link to the pre-filled GitHub issue form, plus the contact email.
5. **Current as of:** the date of the newest instrument in the release, on home, pilot, map and every subject page.
6. **Join** (`/join`), with four short sections:
   - **Colleges:** a free MoU with real activities each semester (a one-day workshop, a faculty session, supervised verification internships of 60 to 120 hours), named credit in every release, a citable dataset, state-steward role.
   - **Students:** what the workshop teaches (reading city rules; using AI and checking it against the gazette), verification internships, certificates.
   - **Practitioners:** report problems, review rules in your field, early access to the agent engine.
   - **Civic and data groups:** sources, documents, maps.
   - One contact line (from config) and the "Join the pilot" issue form.
7. **Who runs Bylaw One:** a short section on About: run by the owner's organisation (name from config), principles, and that released data and code stay open permanently.
8. **Press page** (`/press`): one-paragraph description, three screenshots (generated at build), logo files, contact.

**Done when:** all pages render with generated numbers; links work; no hand-typed figures (CI check for numbers in these pages matching data).

### Part 6 — Partner documents (in the repository)

Write in `docs/partners/` as Markdown, for the owner to review and adapt:
1. `offer.md`: the one-page offer to a college.
2. `workshop-kit.md`: one-day workshop outline (five sessions: why rules are hard; follow one rule; verify for real using Part 4; AI with citations; show and tell), materials list, facilitator notes, certificate template text.
3. `internship.md`: a 60 to 120-hour verification internship outline with weekly tasks and outputs.
4. `mou-template.md`: free, non-exclusive MoU covering activities each semester, roles, open licences, credit, term and exit.
5. `charter.md`: purpose, principles (open, cited, verbatim law, derived labelled, not legal advice), how decisions are made, permanent openness of released work.
6. `demo-script.md`: a five-minute live demo of the site (home story, a subject page, the map place card, a verification task, "Use with AI").

### Part 7 — Quality and sharing

- WCAG 2.2 AA; axe passes on all pages.
- Lighthouse in CI for home, map, one subject page and one document page (mobile: performance ≥ 70, accessibility ≥ 95).
- Open Graph images per page (next/og).
- `sitemap.xml`, `robots.txt` allowing public pages to be crawled, friendly 404.
- Vercel Web Analytics enabled; no cookies, no personal data.

---

## 5. Pull request

- One draft pull request; preview URL at the top.
- Commit and push after each part; keep `docs/progress.md` current.
- PR description sections: progress per part; **Owner actions** (set `contact.email` and organisation name; enable Zenodo; review partner documents; make the repository public; any gitleaks findings); decisions made; known gaps.
- Screenshots at 390 px and 1280 px: map with place card, sheet overlay, pilot page, join page, a verify task, "How we check".

---

## 6. Acceptance

- [ ] gitleaks in CI; repository files and issue forms in place.
- [ ] Map rebuilt: layers in the stated order, place search, place card with rules for the zone and page links, sheet overlay with opacity, shareable address, generated accuracy and coverage lines, browse-by-ward page, Map in the main navigation; budgets and Lighthouse thresholds met.
- [ ] `llms.txt`, `llms-full.txt`, Markdown pages, JSON API with OpenAPI 3.1, schema.org Legislation markup, data package, Atom feed, "Use with AI" page.
- [ ] Verification flow works end to end; a record needs two Match verdicts to show as verified by a person; verifiers credited in releases.
- [ ] Pilot, How we check, Join, Press pages and home line; Report a problem everywhere; "current as of" dates; every number generated from data.
- [ ] Partner documents in `docs/partners/`.
- [ ] WCAG 2.2 AA, Open Graph images, sitemap, robots, 404, analytics.
