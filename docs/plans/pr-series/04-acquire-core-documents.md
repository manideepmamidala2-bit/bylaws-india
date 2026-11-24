# PR 04 — Acquire Core Documents and Reconnaissance

**Read first:** `00-overview.md` · **Depends on:** PR 03 · **Estimate:** 3–4 days · **Checkpoint 1:** owner confirms the PDFs are the real documents

## Goal

Find, verify and download the real core documents from the web, build the complete source register for the core tier, and measure the documents honestly. No structuring in this PR.

## Rules that matter most here

- **R16:** never write or reconstruct a source. If a document cannot be obtained, record it as not obtained, with what was tried.
- **R17:** status, dates and notification numbers are quoted from the fetched document. News articles help find documents, never stand in for them.
- **Log the search.** `data/reports/in-ka-bengaluru-south/source-discovery.md` records every query and site searched, URLs visited, what was found, and what was not.

## 1. Core documents to find

### Building Bye-laws chain
| Starting point | Known location (verify) |
|---|---|
| Bangalore Mahanagara Palike Building Bye-laws 2003 (approved by G.O. No. UDD/223/MNU/2001 dated 21-02-2004; in operation from 5 June 2004) | https://site.bbmp.gov.in/PDF/Bangalore-Building-Byelaws-%202003.pdf · OpenCity mirror: https://data.opencity.in/dataset/bbmp-building-bye-laws-2003 · BPAS circulars page: https://bpas.bbmpgov.in/BPAMSClient4/CommonForms/Circulars.aspx |
| Bengaluru South City Corporation Building (Amendment) Bye-laws 2026, final, from 14.05.2026, and its draft of 01.04.2026 | OpenCity: https://data.opencity.in/dataset/bengaluru-city-corporations-bye-laws-2026 (OpenCity names gba.karnataka.gov.in as source; find the original there) |
| Any other amendments to the 2003 bye-laws (2004–2026) | Search GBA, BBMP town planning pages, Karnataka Gazette, BPAS circulars, OpenCity |

### Zoning Regulations chain
| Starting point | Known location (verify) |
|---|---|
| Zoning Regulations of RMP 2015 (base) | India Code: https://upload.indiacode.nic.in/showfile?actid=AC_KA_71_402_00001_11_1552283484255&filename=zoning_regulations_rmp2015f.pdf&type=rule · BBMP: https://site.bbmp.gov.in/townplanning.html · OpenCity CDN: https://data-opencity.sgp1.cdn.digitaloceanspaces.com/Documents/DocumentCloud/bda-zoning-regulations-rmp2015.pdf |
| BBMP's consolidated "Amendment to Zoning Regulation" PDF and "Revising the amendments in the regulations in BBMP revised Mahayojane 2015" | https://site.bbmp.gov.in/townplanning.html |
| Amendments listed on the BPAS circulars page: UDD 105 MNJ 2008 dated 20-03-2015; UDD 255 MNJ 2018; T&T zone uses amendment | BPAS circulars page |
| Amendment Regulations 2014 | BBMP amendment PDF |
| Impact Zone Premium FAR, UDD 112 MNJ 2015 dated 29.09.2018 | https://site.bbmp.gov.in/PDF/townplanning/ImpactZone%20Premium%20FAR%20Notifi29.09.18.pdf |
| Premium FAR chapter, Gazette notification UDD 78 MNJ 2024(E) dated 21.02.2025; schedule notification of 02.04.2025; February 2026 revision of the road-width table | Gazette copy on OpenCity: https://data.opencity.in/dataset/3877072d-adef-4923-890d-1de96e72faeb/resource/886578b2-3419-40f0-9f51-21b78fefbac7/download/premium-far-gazette.pdf · Karnataka Gazette; UDD |
| Amendment Regulations 2025, final July 2025 (height, stilt parking), and the 2025 stilt parking draft | https://data.opencity.in/dataset/zonal-regulations-of-the-rmp-2015-of-local-planning-area-of-bengaluru-amendment-regulations-2025 |
| Storm water drain buffer amendment (draft 02.09.2025, final later in 2025) | Karnataka Gazette; UDD |
| Amendment Regulations 2025, No. UDD/235/MNJ 2025(E), final dated 05.01.2026 (setbacks, parking), and its November 2025 draft | https://data.opencity.in/dataset/greater-bengaluru-amendment-regulations-2025 |
| Draft raising the high-rise height reference from 21 m to 24 m | UDD; Karnataka Gazette |
| Any other amendment 2007–today | All of the above, plus Karnataka e-Gazette and BDA |

These are leads from research, not facts. Every row must be confirmed from the document itself.

**Do not use:** RMP 2031 draft (withdrawn), RMP 2041 materials (not in force).

## 2. For each document found

- Source priority: issuing authority or Karnataka Gazette → India Code → BBMP/GBA town planning pages and BPAS → OpenCity → Wayback Machine. Record every copy found; use the highest-priority copy; keep retrieval records and checksums of all.
- Fill the register entry from the document: title as printed, issuing authority, notification number, notified date, commencement or effective date, what it amends or supersedes (quoting the line), legal status with quoted evidence, language.
- If only a Kannada text exists: register entry with link and declared gap; do not structure.
- If a document is referenced but cannot be found: register entry `acquisition_status: not_found` with the search log reference.
- Acquire with `bylaws acquire` (retrieval record + archive link, R15).

## 3. Outputs

- `docs/sources/in-ka-bengaluru-south.md`: human-readable register of the core tier, ordered as two chains (bye-laws, zoning regulations) by date.
- Updated jurisdiction config with every document and its retrieval record.
- `source-discovery.md` (search log).
- **`recon.md`**, measured from the real files, per document: page count; text layer or scanned (checked on every page); layout (columns); numbering forms actually used, with page examples; running heads and footers; tables (count, page, header rows, footnotes); schedules, forms, annexures; stamps, signatures, rotated or poor pages; English and any Kannada pages. Ends with a **structuring rules list** for PR 05, with page examples for each rule.
- Data page and Sources page show the register (documents listed with status, links and archive links; marked "not yet structured").

## 4. Checkpoint 1 (owner)

The PR description gives the owner:
- links to three documents to open: the 2003 bye-laws, the RMP 2015 Zoning Regulations, and the 2026 South amendment, each with the official URL used and the archive link;
- the page count and first and last clause numbers the agent recorded for each, so the owner can confirm in a minute;
- the list of documents not found.

The agent waits for the owner's confirmation before PR 05 starts.

## Acceptance

- [ ] Every core register row confirmed from its fetched document, or declared not found / not obtainable with the search logged.
- [ ] Retrieval records and archive links for every acquired file; provenance gate passes.
- [ ] `recon.md` measured from real files, with the structuring rules list.
- [ ] Sources page shows the real register.
- [ ] Checkpoint instructions in the PR description.
