# Structured Building Bylaws — Plan v2.0: Bengaluru South, Complete

**Date:** 23 November 2026 · **Starting point:** commit `7e0273c` (Audit 2) · **Replaces:** Plans v1.1 and v1.2 for all work from here on. Plan v1.0's principles (data first, provenance, no hard-coded jurisdictions, open data) still apply.

---

## 0. What this plan delivers

A **finished public website and open dataset** for **Bengaluru South City Corporation**: every rule source that governs construction there, found from its true origin, converted from PDF into complete structured data, linked to the map, and published.

Concretely, when this plan is done, anyone can:

1. See every legal source that applies to building in Bengaluru South, with its official link, status, dates and our structured copy (**Sources**).
2. Read any source as a structured document: every clause, table and schedule, with each clause linked to its page in the original PDF, and amendments shown where they apply (**Documents**).
3. See how the rules changed over time, instrument by instrument (**Timeline**).
4. Open a map of the whole corporation, with its wards, planning districts, master plan land-use zones and overlays, click any zone and see the clauses that apply there (**Map**).
5. Download the complete dataset with checksums under an open licence (**Data**).

**The priority is complete, correct structured data.** Search is a basic filter only.

---

## 1. How the agent executes this plan

- **One fresh agent session, one pull request.** Commit per step, each commit message starting with the step ID (`A1:`, `B3:` …). Push often; the Vercel preview updates with each push. Put the preview URL at the top of the PR description.
- **No human checkpoints.** The agent decides using the criteria in this plan and records every decision in `docs/decisions/` and the PR description ("Decisions made").
- **Never invent, never stop.** If something cannot be done to the standard here, publish the honest best version, declare what is missing in the data (`declarations.json`) and in the PR description ("Known gaps"), and continue.
- **Verification is honest.** Nothing is marked `human_verified`. Agent-checked records are `machine_checked`.
- **The owner reviews the preview and merges.** Merging publishes to https://bylaws-india.vercel.app.
- **Progress:** keep `docs/progress.md` current.

---

## 2. Rules (all earlier rules still apply; these are restated or new)

- **R1** No jurisdiction-specific code. No branching on jurisdiction IDs, country codes or fixture names. Bengaluru South lives entirely in config and data.
- **R2** Provenance on everything: source, page, position, version, retrieval date, checksum.
- **R3** Legal status explicit: `in_force`, `draft`, `superseded`, `withdrawn`, `status_unknown`. Drafts never shown as law.
- **R4** Open licences: code Apache-2.0, data CC BY 4.0. Dependencies on the allowlist only (MIT, Apache-2.0, BSD-2/3, ISC, PSF-2.0, 0BSD, CC0, Unlicense, OFL-1.1, MPL-2.0; LGPL only with a written exception), checked in CI including transitive npm packages.
- **R5** Raw sources immutable, checksummed.
- **R6** Reproducible: outputs regenerate byte-identically from sources + config + overrides. Timestamps from `SOURCE_DATE_EPOCH`.
- **R7** Fail loudly. Nothing reports success it did not earn.
- **R8** No defaults that strengthen a claim (no "in force" for missing status, no page 1 for missing page).
- **R9** Verified records are never edited; corrections create new record versions.
- **R10** Verification honest (see Section 1).
- **R11** Tests must be able to fail: each new test shown failing first; fixture expectations hand-written.
- **R12** Legal status and record version are separate fields and never shown as each other.
- **R13 (new) Text rights.** Only publish full text of documents that may be republished. Government Acts, rules, regulations, bye-laws, notifications and orders are published as full text. **Copyrighted standards (e.g. the National Building Code of India 2016, published and sold by the Bureau of Indian Standards) are recorded as references only**: title, edition, part and clause numbers cited by other sources, and where to obtain it. Never reproduce their text.
- **R14 (new) Our work is labelled as ours.** Anything this project derives (consolidated "as amended" text, buffer zones drawn from a rule, georeferenced map zones) is labelled "derived by this project, not an official publication" with its method, and links back to the originals.

---

## 3. The source register — what governs building in Bengaluru South

This is the result of research on 23 November 2026. It is the starting list, **not** a final list. Step B1 requires the agent to complete it from the true origins and verify every entry.

**Source priority for every document:** (1) the issuing authority's own site or the Karnataka Gazette; (2) India Code (indiacode.nic.in) for Acts and rules; (3) the BBMP/GBA town planning pages and the BPAS circulars page; (4) OpenCity (data.opencity.in) as mirror; (5) a web archive copy. Record every copy found, use the highest-priority one, keep checksums of all.

### 3.1 Layer: Municipal bye-laws (Bengaluru South City Corporation)

| ID | Document | Status (verify) | Where found |
|---|---|---|---|
| `bbl-2003` | Bangalore Mahanagara Palike Building Bye-laws 2003 (now referred to as the Bengaluru City Corporation Building Bye-laws 2003). Approved by G.O. No. UDD/223/MNU/2001 dated 21-02-2004; in operation from 5 June 2004. | In force as amended | Official: https://site.bbmp.gov.in/PDF/Bangalore-Building-Byelaws-%202003.pdf · Mirror: https://data.opencity.in/dataset/bbmp-building-bye-laws-2003 · Also listed on https://bpas.bbmpgov.in/BPAMSClient4/CommonForms/Circulars.aspx |
| `bscc-bbl-amend-2026` | Bengaluru City Corporation Building (Amendment) Bye-laws 2026 as issued by Bengaluru South City Corporation, final, in force from 14.05.2026 (amends bye-law 6.0 deviation limits with a new Table 2B, omits ground-rent bye-laws 3.8–3.10, and other changes) | In force | Source named by OpenCity: gba.karnataka.gov.in · Mirror: https://data.opencity.in/dataset/bengaluru-city-corporations-bye-laws-2026 |
| `bscc-bbl-amend-2026-draft` | Draft of the above, notified 01.04.2026 | Draft, superseded by final | Same dataset |
| *to find* | Any other amendments to the 2003 bye-laws between 2004 and 2026 | Verify | BBMP/GBA town planning pages; Karnataka Gazette; BPAS circulars |

### 3.2 Layer: Master plan zoning (RMP 2015, Bangalore Development Authority local planning area)

RMP 2015 was notified in June 2007 and remains the zoning in force. RMP 2041 is in preparation and is not in force; the draft RMP 2031 was withdrawn. **Neither is used.**

| ID | Document | Status (verify) | Where found |
|---|---|---|---|
| `rmp2015-zr` | Zoning Regulations of the Revised Master Plan 2015 (base text) | In force as amended | India Code: https://upload.indiacode.nic.in/showfile?actid=AC_KA_71_402_00001_11_1552283484255&filename=zoning_regulations_rmp2015f.pdf&type=rule · BBMP: https://site.bbmp.gov.in/townplanning.html · Mirror: https://data-opencity.sgp1.cdn.digitaloceanspaces.com/Documents/DocumentCloud/bda-zoning-regulations-rmp2015.pdf |
| `rmp2015-zr-amend-2014` | Zoning Regulations of Bangalore of RMP 2015 (Amendment) Regulations 2014 | In force (verify) | BBMP "Amendment to Zoning Regulation" PDF (from the town planning page) |
| `rmp2015-zr-amend-2015-03` | Amendment notification No. UDD 105 MNJ 2008 dated 20-03-2015 | In force (verify) | BPAS circulars page |
| `rmp2015-zr-amend-2018` | Amendment notification No. UDD 255 MNJ 2018 | In force (verify) | BPAS circulars page |
| `rmp2015-zr-amend-2018-impact` | Zoning Regulations of Bengaluru of RMP 2015 (Amendment) Regulations 2018 — Impact Zone Premium FAR, No. UDD 112 MNJ 2015 dated 29.09.2018 | Verify whether still in force after the 2025 premium FAR chapter | https://site.bbmp.gov.in/PDF/townplanning/ImpactZone%20Premium%20FAR%20Notifi29.09.18.pdf |
| `rmp2015-zr-amend-tt` | Transport & Telecommunication (T&T) zone uses amendment | Verify | BPAS circulars page |
| `rmp2015-zr-premium-far-2025-02` | Premium FAR: new chapter "Premium F.A.R. Granted by Levy of Premium Charges" inserted after Chapter 10, Gazette notification No. UDD 78 MNJ 2024(E) dated 21.02.2025 | In force (upheld by the Karnataka High Court) | https://data.opencity.in/dataset/3877072d-adef-4923-890d-1de96e72faeb/resource/886578b2-3419-40f0-9f51-21b78fefbac7/download/premium-far-gazette.pdf ; Karnataka Gazette |
| `rmp2015-zr-premium-far-2025-04` | Notification dated 02.04.2025 setting maximum additional FAR by road width (Chapter 11 schedule) | In force (verify) | Karnataka Gazette; GBA / UDD |
| `rmp2015-zr-premium-far-2026-02` | February 2026 revision of the additional-FAR-by-road-width table | In force (verify) | Karnataka Gazette; UDD |
| `rmp2015-zr-amend-2025-07` | Zonal Regulations of RMP 2015 (Amendment) Regulations 2025, final, July 2025 (building height, stilt parking and other changes) | In force (verify) | https://data.opencity.in/dataset/zonal-regulations-of-the-rmp-2015-of-local-planning-area-of-bengaluru-amendment-regulations-2025 |
| `rmp2015-zr-stilt-draft-2025` | Draft regulations for stilt parking 2025 | Draft, likely superseded | Same dataset |
| `rmp2015-zr-swd-buffer-2025` | Notification reducing buffer zones around storm water drains in the Bengaluru Metropolitan Region (draft 02.09.2025; final later in 2025), amending the RMP 2015 zoning regulations under section 13-E KTCP Act | In force (verify date and number) | Karnataka Gazette; UDD |
| `rmp2015-zr-amend-2026-01` | Zonal Regulations of the Revised Master Plan-2015 (Amendment) Regulations 2025, No. UDD/235/MNJ 2025(E), final, dated 05.01.2026 (setbacks, parking and related changes). The draft was published in November 2025. | In force | https://data.opencity.in/dataset/greater-bengaluru-amendment-regulations-2025 (final and draft) |
| `rmp2015-zr-amend-2025-11-draft` | Draft of the above, November 2025 | Draft, superseded by 05.01.2026 final | Same dataset; also listed in the July 2025 dataset as "Changes to Setback Dimensions" |
| `rmp2015-zr-highrise-24m-draft` | Draft amendment proposing to raise the high-rise height reference in the zonal regulations from 21 m to 24 m | Draft (verify current status) | UDD notification; Karnataka Gazette |
| *to find* | Every other amendment to the RMP 2015 zoning regulations from 2007 to today | Verify | BBMP town planning "Amendment to Zoning Regulation" and "Revising the amendments in the regulations in BBMP revised Mahayojane 2015"; BPAS circulars; Karnataka Gazette; OpenCity BDA and GBA organisations |

**Correction to earlier plans:** the "11.11.2025 setback amendment" is the **draft**; its **final** is the 05.01.2026 notification UDD/235/MNJ 2025(E).

### 3.3 Layer: Master plan maps

| ID | What | Where found |
|---|---|---|
| `rmp2015-plu-sheets` | RMP 2015 Proposed Land Use maps, one or two sheets per planning district, named like `2.12 map (b)- Vijayanagar`. These sheets print a **UTM zone 43N / WGS 84 coordinate grid at 1:10,000**, and may be vector PDFs. | Official: https://site.bbmp.gov.in/revised%20masterplan%20(1).html and the `site.bbmp.gov.in/PDF/landusemaps/<group>/<sheet>.pdf` files (example: https://site.bbmp.gov.in/PDF/landusemaps/2/2.12%20map%20(b)-%20Vijayanagar.pdf) · Mirror: https://data.opencity.in/dataset/bda-revised-master-plan-2015 |
| `rmp2015-index` | RMP 2015 planning district index map | Same as above. Note OpenCity's label error: Planning District 204 is "Benson Town", not "Jayanagar". |
| `rmp2015-plu-analysis` | Proposed land use area tables printed on the sheets | Same sheets |

### 3.4 Layer: Jurisdiction boundaries

| ID | What | Where found |
|---|---|---|
| `gba-corporations-2025` | Five corporations map (final, September 2025, KML); GBA zones map (each corporation split into two zones, KML); final notification splitting BBMP into five corporations (PDF, English and Kannada). Bengaluru South City Corporation constituted by final notification dated 2 September 2025. | https://data.opencity.in/dataset/greater-bengaluru-authority-corporations-delimitation-2025 |
| `gba-wards-2025` | Final wards map, 369 wards across five corporations, notified 19 November 2025, and the December 2025 version with name changes and population (KML) | https://data.opencity.in/dataset/gba-wards-delimitation-2025 |

### 3.5 Layer: State Acts and rules (enabling law)

Publish as full structured text (R13 allows it). Where an Act is long, structure the whole Act but mark the building-relevant chapters and sections in `declarations.json` so the site can lead with them.

| ID | Document | Where found |
|---|---|---|
| `gbg-act-2024` | Greater Bengaluru Governance Act, 2024 (including the building and planning provisions and the section under which OC exemptions are granted) | India Code; Karnataka Gazette; e-Gazette |
| `ktcp-act-1961` | Karnataka Town and Country Planning Act, 1961 (sections 13-E, 14, 15, 17, 18-B and others cited by the zoning regulations) | India Code |
| `tdr-rules-2016` | Karnataka Town and Country Planning (Benefit of Development Rights) Rules, 2016 | India Code; Karnataka Gazette |
| `kfs-act-1964` | Karnataka Fire Force Act, 1964, as amended by the 2023 Amendment Act (NOC for buildings of 21 m or more, deemed in force from 24 March 2023) and the 2025 Amendment Act (fire cess) | India Code; PRS bill texts for cross-check: https://prsindia.org/files/bills_acts/bills_states/karnataka/2023/Bill3of2023Karnataka.pdf and https://prsindia.org/files/bills_acts/bills_states/karnataka/2025/Bill42of2025KA.pdf |
| `ktcda-act` | Karnataka Tank Conservation and Development Authority Act and its 2025 Amendment (size-based lake buffers). **Verify** whether the amendment received assent and is notified; reports conflict. | India Code; Karnataka Gazette |
| `metro-influence-2020` | Notification No. UDD 110 PRJ 2020 dated 11 May 2020 declaring 11 m either side of Namma Metro underground structures as the Influence Zone, requiring a BMRCL NOC | Karnataka Gazette; UDD; BMRCL |

### 3.6 Layer: Government orders and procedures that change building requirements

| ID | Document | Where found |
|---|---|---|
| `oc-exemption-2025-09` | Order No. NAE/334/MNU of 2025 dated 9 September 2025: Occupancy Certificate exemption for residential buildings on plots up to 1,200 sq ft (ground + 2 or stilt + 3) within GBA | UDD; GBA; Karnataka Gazette |
| `oc-exemption-2026-06` | Order dated 5 June 2026 extending the exemption to plots up to 2,400 sq ft (+20%), up to ground + 3 | UDD; GBA |
| `gba-oc-cc-rules-2025` | GBA rules on Occupancy and Commencement Certificates, 2025 | OpenCity GBA organisation ("GBA Rules on Occupancy and Commencement Certificates - 2025") |
| `bbmp-noc-details` | BBMP list of NOCs required by building parameter | https://site.bbmp.gov.in/PDF/buildingplanapproval/NOC%20Details.pdf |
| *to find* | Other circulars that change building requirements (e.g. Nambike Nakshe scheme, e-Khata requirement for plan approval) | GBA, BBMP BPAS circulars page |

Procedural circulars that do not change what may be built are recorded in the register but need not be structured.

### 3.7 Layer: National references (reference only unless free to republish)

| ID | Document | Treatment |
|---|---|---|
| `nbc-2016` | National Building Code of India 2016 (BIS) | **Reference only (R13).** Record parts and clauses that Karnataka law cites (e.g. the high-rise definition used by the Fire Force Act). No text. |
| `aai-cczm` | Airports Authority of India Colour Coded Zoning Maps and the Ministry of Civil Aviation height-restriction rules; NOCAS portal (http://nocas2.aai.aero/nocas). Bengaluru's CCZM covers Kempegowda International, HAL, Jakkur and Yelahanka aerodromes. | Rules text: structure if the official gazette text is freely available. Maps: **not** redistributed (official CCZM access is via NOCAS); record as a reference layer with a link. Do not draw height surfaces. |
| `model-bbl-2017` | Karnataka Model Building Bye-laws, Notification No. UDD 14 TTP 2017 (P-4) dated 28-10-2017 (listed on the BPAS circulars page) | Determine whether it applies within GBA; if it does not, record as reference only with the reason. |

### 3.8 Reference data (cross-checks only)

| ID | What | Where |
|---|---|---|
| `ksrsac-elu` | Bengaluru Urban Land Use Maps 2011 and 2017 (existing land use, **not** zoning) | https://data.opencity.in/organization/bangalore-development-authority |
| `road-width` | Bengaluru road width map (KML) | https://data.opencity.in/organization/bruhat-bengaluru-mahanagara-palike |
| `osm` | OpenStreetMap (roads, lakes, metro alignment) | Overpass API; ODbL attribution |

---

## 4. Data model changes (schema 1.2)

Keep everything from schema 1.1, plus:

- **Document types:** `act`, `rules`, `regulations`, `bye_laws`, `amendment`, `notification`, `government_order`, `circular`, `map`, `standard_reference`.
- **Layers:** `statute`, `state_rules`, `planning`, `municipal`, `orders`, `overlay`, `national_reference`, `boundary`.
- **Document fields:** `issuing_authority`, `notification_number`, `gazette_reference`, `notified_date`, `effective_from`, `legal_status`, `status_evidence` (URL + quoted line), `superseded_by_document`, `amends` (list of doc IDs), `text_rights` (`full_text` | `reference_only`, with reason), `languages` (e.g. `en`, `kn`), `official_url`, `mirror_urls`, `copies` (each with SHA-256).
- **Clause records (R12):** `record_version`, `record_supersedes`, `record_superseded_by`, `record_change_reason`; `legal_status`; `effective_from`; `citations` (page, bbox, excerpt); `verification` and `verified_by`; `language`.
- **Amendment links:** amending clause, target clause, action (`substitute`, `insert_after`, `insert_before`, `omit`, `modify`, `renumber`), effective date, confidence.
- **Consolidated text (R14):** `consolidated` records per target clause per date, each with the list of amendments applied, `derived: true`, and `confidence`. Produced only when every applicable amendment link is high-confidence; otherwise none, and the site shows original plus amendments side by side.
- **Geo layers:** each layer has `kind` (`official_boundary`, `master_plan_zone`, `derived_overlay`, `reference`), `source`, `method`, `accuracy_m` (estimated), `derived` flag.
- **Zone features:** `zone_code` and `zone_label` from the map legend, `planning_district`, `sheet`, `extraction_method` (`vector_pdf`, `grid_georeferenced_raster`, `osm_gcp_raster`, `imported`), `verification`, record version fields.
- **Clause–zone tags:** clause, zone code or `ALL`, reason (quoted clause words), verification.
- **Declarations:** not modelled, known gaps, unread documents, documents found but not obtainable, contested or uncertain status.

Regenerate Python and TypeScript types from the schemas; CI fails on drift.

---

## 5. Work plan

Four parts. Part A starts immediately; Part B starts in parallel; Parts C and D follow as their inputs arrive.

```
A  Foundations ───────────────────────────────┐
B  Sources: discover → acquire → parse → structure → amendments → consolidate ─┐
C  Maps: boundaries → master plan zones → overlays → clause tags ──────────────┤
D  Website & release ◄─────────────────────────────────────────────────────────┘
```

### Part A — Foundations (fix what Audit 2 found)

**A1. Integrity fixes** (each with a failing test first, R11)
- Overrides idempotent; no-op fixes create nothing; YAML order kept; zone curations applied or rejected, never ignored.
- Publish fails on an unreadable manifest, preserves all jurisdictions and all releases, takes licence from config, no fixture literals.
- Remove all `XX` branches; `SOURCE_DATE_EPOCH`; real parser names and versions.
- Geo reprojects sources with a declared CRS; refuses sources without one.
- Licence allowlist covering transitive npm packages.
- Remove fixture-only branches in structure.
- Hand-written fixture expectations.
- Schema 1.2 (Section 4) with generated types.

**A2. Data wiring**
- Data served from `web/public/data` (versioned in git). Loaders for every file type in Section 4.
- Server components with static generation per release; only map and interactive panels on the client.
- Leaflet via a stable `react-leaflet` release supporting React 19, loaded client-side only.
- Production hides `visibility: test` jurisdictions (the fixture); previews show them.

✅ Repeated `run-all` and `apply-overrides` change nothing; licence and R1 checks catch planted violations; fixture renders on a real map in preview.

### Part B — Sources to structured data

**B1. Discover and complete the source register**
- Starting from Section 3, search each "to find" row and verify every entry at its origin: Karnataka Gazette / e-Gazette, India Code, GBA (gba.karnataka.gov.in), BBMP town planning pages, BPAS circulars page, UDD, BDA, OpenCity.
- For every document record: official URL, mirrors, notification number, dates, issuing authority, legal status with quoted evidence, what it amends or supersedes, languages, text rights.
- Build the **amendment chain** for the RMP 2015 zoning regulations (2007 to today) and for the 2003 bye-laws (2004 to today), in date order.
- Where status is uncertain or contested (e.g. the lake buffer amendment), record `status_unknown` with the conflicting evidence. Never guess.
- Output: `docs/sources/in-ka-bengaluru-south.md` (human-readable register), the jurisdiction config, and `data/reports/in-ka-bengaluru-south/source-discovery.md` (what was searched, what was found, what could not be obtained).

✅ Every row has an obtainable copy or a declared reason why not; amendment chains complete to the best available evidence.

**B2. Acquire**
- Download every copy; SHA-256; `.meta.json`; respect site terms; descriptive User-Agent; polite retries; web archive copy as last resort.
- Convert boundary KMLs to GeoJSON, select Bengaluru South and its two GBA zones and its wards.

✅ All obtainable files present with metadata.

**B3. Reconnaissance**
For every PDF: page count, text layer or scanned, languages (English, Kannada), columns, numbering forms (`1.0`, `1.1`, `CHAPTER III`, roman numerals, `(a)`, `(i)`, `Schedule`, `Annexure`, `Table`, `Proviso`, `Explanation`), running heads, tables, stamps, rotated pages. For map sheets: vector or raster, printed coordinate grid present, legend, colours.
Output: `recon.md` and the **structure rules list** for B5 with page examples.

**B4. Parse**
- Adapters: pypdfium2 text (baseline); **Docling** (MIT) standard pipeline with table structure; Docling's VLM pipeline with **Granite-Docling** (Apache-2.0) for hard pages and tables; Tesseract OCR with the Kannada (`kan`) language pack for Kannada scanned pages. Check every model's licence against R4 before use.
- Per document, choose the parser by: text completeness, numbering fidelity against the document's own contents list, table fidelity checked against page images, bounding-box coverage. Different parsers may be used for different page ranges of one document if that scores better; record it.
- Output: `parser-comparison.md`; decisions in `docs/decisions/`.

**B5. Structure every document completely**
- Hierarchy: parts, chapters (incl. roman numerals), numbered clauses at every depth, sub-items scoped to parents (`bbl-2003:6.1(a)(ii)`), schedules, annexures, appendices, tables, notes, provisos, explanations, preambles and enacting text.
- No false clauses from measurements, years or numbers inside sentences; tests use real examples from recon.
- Nothing dropped: every page's content ends in exactly one record or is declared non-content.
- Two-column reading order; running heads and page numbers removed from text.
- Verbatim text (whitespace normalisation only); titles from heading lines.
- Tables as structured rows attached to their clause and removed from prose; unreliable tables kept as page-image references plus a declared gap.
- Kannada text kept verbatim with `language: kn`; where an official English text also exists, both are kept and linked. **No machine translation is published as law.**
- Cross-references resolved.
- Every clause: legal status, effective date, citation with page and bounding box.

**QA thresholds (per document, in `qa.md`):** 100% of clauses with status, date, page citation; ≥ 95% with bounding box; ≥ 98% of content text covered; zero unexplained numbering gaps; every table structured or declared. Agent self-check of 30 random clauses per document (or all if fewer) against page images; fix failures through overrides; records passing are `machine_checked`.

**B6. Amendments**
- For every amending instrument, link each instruction to its target: action, effective date, confidence.
- Handle insertion of whole chapters (e.g. the Premium FAR chapter) and table replacements.
- Low-confidence links listed in QA.

**B7. Consolidated "as amended" view (R14)**
- For each base document, produce consolidated text as of today (and as of each amendment date) where all applicable links are high-confidence.
- Label every consolidated clause "derived by this project", list the amendments applied, and link to the original wording.
- Where consolidation is not possible, record why; the site shows original plus amendments.

✅ Complete structured data for every full-text source; amendment chains linked; consolidated view where reliable.

### Part C — Maps

**C1. Boundaries**
- Corporation boundary, the corporation's two GBA zones, its wards (final 369-ward delimitation), all as official boundary layers.

**C2. Planning districts in Bengaluru South**
- From the RMP 2015 index map and sheets, identify **every planning district that intersects the South City Corporation boundary**, and the sheets covering them.

**C3. Master plan zones for all those districts** — in this order of preference:
1. **Vector extraction.** If a sheet is a vector PDF, extract the coloured land-use polygons directly from the PDF drawing paths, map their fill colours to legend entries, and use the printed UTM 43N grid to place them. Expected accuracy: as drawn on the sheet.
2. **Grid georeferencing.** If raster, georeference using the printed UTM zone 43N / WGS 84 grid coordinates on the sheet (read the grid labels, use their intersections as control points), then colour-segment by legend. Target RMSE ≤ 10 m.
3. **OpenStreetMap control points** (Plan v1.0 method) only if a sheet has no usable grid. Target RMSE ≤ 30 m.
- Zone codes and labels from each sheet's legend, never from code.
- Merge districts; resolve overlaps at district edges (keep the sheet that owns the area per the index map); clip to the corporation boundary.
- Cross-check against KSRSAC existing land use (report mismatches; never "correct" zoning to existing use).
- Coverage target: ≥ 95% of the corporation's area within RMP 2015 coverage assigned a zone code.
- If a sheet fails its threshold, publish that district's outline only and declare the gap.
- Verification report per sheet in `map-verification.md`. All zones `machine_checked` at most.

**C4. Derived overlays (R14, each labelled approximate)**
- **Metro influence zone:** 11 m either side of underground metro structures, using the metro alignment from OpenStreetMap or BMRCL publications; label as approximate because tunnel outer edges are not published.
- **Lake buffers:** only if the applicable rule's status is verified (B1). Lakes from official or OpenStreetMap geometry; buffer by the size tier in the verified rule. If the rule's status is unknown, do not draw buffers; declare the gap.
- **Storm water drain buffers:** only if drain geometry and the drain class are available from an official source; otherwise declare the gap.
- **Airport height zones:** not drawn (Section 3.7); the map links to NOCAS.

**C5. Clause–zone tagging**
- For every zone code present, tag the clauses that apply: zoning regulation chapters for main land-use zones, permissible uses, development controls (FAR, coverage, setbacks, height, parking), premium FAR, bye-laws general provisions.
- Clauses applying everywhere are tagged `ALL`. Overlay rules are tagged to their overlay.
- Every tag has a quoted reason; `machine_checked`.

✅ The corporation map is complete: boundaries, wards, planning districts, master plan zones (or declared gaps per sheet), overlays (or declared gaps), tags.

### Part D — The website and release

Design: the dg2n idiom from the audits (paper `#f5f3ed`, panel `#efeee8`, ink `#080909`, muted `#5b5e56`, hairline `#c8ccc0`; Inter Tight display, Source Serif 4 for legal text, JetBrains Mono capitals for labels; no cards, no shadows, square corners). Coral `#ff6b52` **only** for the current selection and **never** for text. Zone codes printed inside polygons. WCAG AA; axe in CI blocks merges. No "prototype" wording. Fonts via `next/font` (OFL).

**Pages**
1. **Home (`/`):** Bengaluru South overview: what the dataset covers, counts (sources, clauses, tables, zones), latest release, entry points to Map, Sources, Documents, Timeline, Data. List of jurisdictions (the only public one is Bengaluru South).
2. **Map (`/j/[id]`):** layers toggle (corporation, GBA zones, wards, planning districts, master plan zones, overlays); legend from source sheets; click a zone → clauses grouped by layer and document, current version, status tag, verification tag, amendments beside the clause, "View source p. N" linking to the original PDF page. Accuracy note generated from each layer's method and accuracy. Coverage note from declarations.
3. **Sources (`/j/[id]/sources`):** the full register: every document with layer, type, issuing authority, notification number, dates, legal status with evidence, official link, mirrors, checksums, text rights, and a link to our structured copy. Filter by layer and status.
4. **Document (`/j/[id]/documents/[doc]`):** the complete structured document: collapsible tree, tables ruled, each clause with page link. Toggle **Original / As amended (derived)**; amendments shown inline where they apply. For `reference_only` documents: metadata, where to obtain, and the clauses that cite it.
5. **Timeline (`/j/[id]/timeline`):** every instrument in date order, what it changed, links to the affected clauses.
6. **Data (`/data`):** releases with changelog, zip, checksums, licence, how to cite, declarations, source register download (CSV and JSON).
7. **About (`/about`):** method, verification levels, what "derived" means, limitations, licences, attribution (OpenCity, OpenStreetMap, issuing authorities).
8. **Review (`/j/[id]/review`):** kept for future human review: source sheet beside traced zones with an overlay slider.

Search: a simple text filter on Documents and Sources only.

**Record history (R12):** only current versions shown; "v2 · corrected from v1" expands to history; never shown as legal status.

**Release:** `run-all --jurisdiction in-ka-bengaluru-south` produces release `1.0.0` into `web/public/data` with zip, checksums, changelog, declarations. The PR description summarises release contents: documents by layer, clauses, tables, amendment links, consolidated clauses, zones by planning district, overlays, tags, verification counts, known gaps.

✅ Preview shows the complete Bengaluru South site; every page renders real data; axe passes; release downloadable.

---

## 6. Tools (latest, permissive)

| Purpose | Tool | Notes |
|---|---|---|
| PDF text and positions | pypdfium2 | Baseline adapter |
| Layout, tables | Docling (MIT) | Standard pipeline with table structure |
| Hard pages and tables | Docling VLM pipeline with Granite-Docling 258M (Apache-2.0); optionally Granite Vision for table structure | Check each model's licence; GPU optional |
| Kannada OCR | Tesseract with `kan` language data (Apache-2.0) | Via Docling's OCR options or directly |
| PDF vector paths (map sheets) | pypdfium2 page objects, or pdfplumber (MIT) | For vector land-use polygons |
| Geospatial | GDAL, rasterio, shapely, pyproj, geopandas | Reprojection from UTM 43N (EPSG:32643) to WGS 84 |
| Image segmentation | OpenCV / scikit-image | Raster fallback |
| Web | Next.js, Tailwind v4, react-leaflet (stable), Leaflet | Static generation |
| Accessibility | axe-core | Blocking in CI |
| Licences | Python and npm licence checkers with allowlist | Transitive included |

Excluded: Marker, MinerU, PyMuPDF (licences); Unstract code (AGPL; design ideas only).

---

## 7. Out of scope

- Computable rules (FAR or setback calculators) — next phase, designed to be compatible with Indicodes Rules.
- Other corporations.
- Human verification workflow beyond the Review page.
- Machine translation of Kannada text.
- Reproducing NBC text or AAI map data.

---

## 8. Estimate

Rough single-agent working days; Parts B and C overlap.

| Part | Days |
|---|---|
| A Foundations | 4–6 |
| B1–B3 Discovery, acquisition, recon | 5–7 |
| B4–B5 Parsing and structuring (likely 30–40 documents) | 12–18 |
| B6–B7 Amendments and consolidation | 5–8 |
| C Maps (all planning districts in South), overlays, tags | 8–12 |
| D Website and release | 7–9 |
| **Total** | **about 41–60 working days** |

This is a large single pull request. Push daily so the preview always shows current progress.

---

## 9. Acceptance checklist (copy into the PR description)

**Foundations**
- [ ] All Audit 2 integrity defects fixed with tests shown failing first.
- [ ] Schema 1.2 with generated types; R1, R4, R12 checks in CI.
- [ ] Outputs byte-identical across runs.

**Sources**
- [ ] Source register complete; every entry verified at origin with status evidence, or declared unobtainable.
- [ ] Amendment chains for RMP 2015 zoning regulations and the 2003 bye-laws complete to best evidence.
- [ ] Every full-text source structured; QA thresholds met or shortfalls declared.
- [ ] NBC and other copyrighted standards recorded as references only.
- [ ] Amendments linked; consolidated "as amended" view where reliable, labelled derived.
- [ ] Kannada text kept verbatim; no machine translation published.

**Maps**
- [ ] Corporation, GBA zones, wards published.
- [ ] Every planning district intersecting Bengaluru South identified; zones extracted per sheet (vector, grid, or fallback) with per-sheet verification, or declared gaps.
- [ ] Overlays drawn only where the rule's status is verified; each labelled derived and approximate.
- [ ] Clause–zone tags with quoted reasons.

**Website**
- [ ] Home, Map, Sources, Document, Timeline, Data, About pages render real data.
- [ ] Every clause links to its source page; every source links to its origin.
- [ ] dg2n design; coral only for selection; axe passes.
- [ ] Production hides the fixture.
- [ ] Release 1.0.0 with zip, checksums, changelog, declarations.

**PR description**
- [ ] Preview URL at top; "Decisions made"; "Known gaps"; release contents summary.
