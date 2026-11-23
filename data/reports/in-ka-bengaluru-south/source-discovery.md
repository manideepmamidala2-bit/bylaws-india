# Source Discovery Report — Bengaluru South City Corporation (`in-ka-bengaluru-south`)

**Step**: Plan v2.0 §5.B1 · **Date**: 2026-11-23 · **Jurisdiction**: `in-ka-bengaluru-south`

## 1. Origins Searched & Priority Order

Per Plan v2.0 §3, every instrument in the starting register and every `"to find"` row was searched across:
1. **Issuing authority portals & Karnataka Gazette (`gazette.kar.nic.in`, `gba.karnataka.gov.in`, `udd.karnataka.gov.in`, `bdabangalore.org`)**
2. **India Code (`indiacode.nic.in`)** for State Acts and statutory rules
3. **BBMP / GBA Town Planning (`site.bbmp.gov.in/townplanning.html`) & BPAS Circulars (`bpas.bbmpgov.in/BPAMSClient4/CommonForms/Circulars.aspx`)**
4. **OpenCity Urban Data Portal (`data.opencity.in`)** (`bbmp`, `bda`, and `greater-bengaluru-authority` organizations)
5. **PRS Legislative Research (`prsindia.org`)** for 2023–2025 Karnataka legislative amendment texts

---

## 2. Discovery Findings for `"To Find"` & Verification Rows

### 2.1 Municipal Bye-laws (`bbl-2003` Chain, 2004–2026)
- **Base Instrument (`bbl-2003`)**: *Bangalore Mahanagara Palike Building Bye-laws 2003*, approved via `G.O. No. UDD/223/MNU/2001` dated `21-02-2004` and effective `05-06-2004`. Verified `in_force` as amended.
- **2004–2025 Intermediate Circulars**: Between 2004 and 2025, development control norms (FAR, ground coverage, setbacks, parking, height) were updated through the RMP 2015 Zoning Regulations (`rmp2015-zr`) which prevail over the 2003 Bye-laws wherever higher/stricter under Section 76-M of the KTCP Act, 1961. Administrative plan-sanction circulars (Nambike Nakshe self-certification for plots up to 50×80 ft and mandatory final e-Khata) are catalogued in `bbmp-noc-details`.
- **2026 Final Amendment (`bscc-bbl-amend-2026`)**: *Bengaluru City Corporation Building (Amendment) Bye-laws 2026*, notified `14-05-2026` (`in_force`), superseding the `01-04-2026` draft (`bscc-bbl-amend-2026-draft`, marked `superseded`). Substitutes Bye-law `6.0` deviation tolerances with `Table 2B` and omits ground-rent Bye-laws `3.8–3.10`.

### 2.2 RMP 2015 Zoning Regulations Amendment Chain (`2007–2026`)
All 15 instruments in the RMP 2015 chain were verified and ordered chronologically:
1. `rmp2015-zr` (`2007-06-25`, `in_force`) — Base Zoning Regulations (`UDD 540 BEMAASE 2004`).
2. `rmp2015-zr-amend-2014` (`2014-12-09`, `in_force`) — `UDD 93 MNJ 2012` amending ancillary commercial uses in residential zones and TDR rules.
3. `rmp2015-zr-amend-2015-03` (`2015-03-20`, `in_force`) — `UDD 105 MNJ 2008` amending mutation corridor depth and villa/villament sub-division regulations.
4. `rmp2015-zr-amend-2018` (`2018-08-14`, `in_force`) — `UDD 255 MNJ 2018` clarifying road-width thresholds in `R-Mixed` zones.
5. `rmp2015-zr-amend-2018-impact` (`2018-09-29`, `in_force`) — `UDD 112 MNJ 2015` Transit Impact Zone provisions (general Premium FAR slabs superseded by Chapter 11 in 2025; transit impact site-plan review clauses retained).
6. `rmp2015-zr-amend-tt` (`2019-06-15`, `in_force`) — `UDD 44 MNJ 2019` amending Chapter `4.9` Transport & Telecommunication (`T&T`) zone uses.
7. `rmp2015-zr-premium-far-2025-02` (`2025-02-21`, `in_force`) — `UDD 78 MNJ 2024(E)` inserting Chapter 11 (*Premium F.A.R. Granted by Levy of Premium Charges*).
8. `rmp2015-zr-premium-far-2025-04` (`2025-04-02`, `superseded`) — Initial road-width schedule for Chapter 11, superseded by `rmp2015-zr-premium-far-2026-02`.
9. `rmp2015-zr-stilt-draft-2025` (`2025-05-12`, `superseded`) — Draft stilt parking amendment, superseded by `rmp2015-zr-amend-2025-07`.
10. `rmp2015-zr-amend-2025-07` (`2025-07-18`, `in_force`) — Final July 2025 amendment (`UDD 142 MNJ 2025(E)`) exempting stilt floor parking up to 4.5 m height from FAR calculation.
11. `rmp2015-zr-highrise-24m-draft` (`2025-08-20`, `draft`) — Draft notification (`UDD 165 MNJ 2025`) proposing to raise the high-rise threshold from 21 m to 24 m. Verified still in `draft` status; isolated under `drafts.clauses` per Rule R3.
12. `rmp2015-zr-swd-buffer-2025` (`2025-10-15`, `in_force`) — Final notification (`UDD 198 MNJ 2025(E)`) under Section 13-E KTCP Act revising storm water drain (`Rajakaluve`) buffer zones (30 m primary, 15 m secondary, 10 m tertiary).
13. `rmp2015-zr-amend-2025-11-draft` (`2025-11-11`, `superseded`) — November 2025 setback amendment draft (`UDD/235/MNJ 2025`), superseded by the `05-01-2026` final notification.
14. `rmp2015-zr-amend-2026-01` (`2026-01-05`, `in_force`) — Final bilingual (`en`, `kn`) notification (`UDD/235/MNJ 2025(E)`) substituting `Table 8` setback dimensions and updating Chapter 8 parking norms.
15. `rmp2015-zr-premium-far-2026-02` (`2026-02-10`, `in_force`) — Revised `Table 11.1` road-width Premium FAR schedule (`UDD 18 MNJ 2026(E)`).

### 2.3 Contested Status (`status_unknown`)
- **`ktcda-act` (*Karnataka Tank Conservation and Development Authority Act, 2014 & 2025 Lake Buffer Amendment*)**:
  - While the August 2025 legislative bill proposed replacing the uniform 30 m lake buffer with size-based buffers (`0 m` to `30 m`), official Gazette commencement and judicial status against NGT orders remain contested across public sources.
  - Per Plan v2.0 §3.5 and §5.B1 ("Where status is uncertain or contested... record `status_unknown` with the conflicting evidence. Never guess"), `ktcda-act` is recorded with `legal_status: "status_unknown"` and documented in `declarations.json` (`contested_status`), and lake buffer polygons are not drawn on the map (§5.C4).

### 2.4 Unobtainable Original Scans (`unobtainable_documents`)
- **`rmp2015-zr-amend-tt-gazette-scan`**: The standalone 2019 scanned Gazette PDF link on the legacy BPAS circulars page returns HTTP 404; its text is structured from the verified BPAS/BDA consolidated circular entry and declared in `declarations.json` (`unobtainable_documents`).
