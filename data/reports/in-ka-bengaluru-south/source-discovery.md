# Source Discovery Report — Bengaluru South City Corporation (`in-ka-bengaluru-south`)

## 1. Scope and Objectives

This report documents the empirical source-discovery campaign for **Bengaluru South City Corporation (`in-ka-bengaluru-south`)** conducted for **PR 04 (Owner Checkpoint 1)** under Rules R1, R15, R16, and R17 of `docs/plans/pr-series/00-overview.md` and `docs/plans/pr-series/04-acquire-core-documents.md`.

Every source recorded in `jurisdictions/in-ka-bengaluru-south.yaml` was verified by HTTP(S) retrieval (`bylaws acquire --jurisdiction in-ka-bengaluru-south`), SHA-256 verification (`bylaws verify-sources --jurisdiction in-ka-bengaluru-south`), PDF Creator/Producer provenance inspection (`bylaws check-provenance`), and Wayback Machine snapshot resolution.

---

## 2. Portals and Indexes Searched

1. **Bengaluru South City Corporation & Greater Bengaluru Authority (GBA) Official Portals**:
   - `https://bengalurusouth.karnataka.gov.in/home` (and its React SPA bundle `/static/js/main.d4bca926.js`)
   - `https://gba.karnataka.gov.in/` (and its React SPA bundle `/static/js/main.31174c47.js`)
   - Discovery findings:
     - Both portals share a unified GBA frontend configuration (`wt.buildingPermission = "https://bpas.bbmpgov.in/BPAMSClient4/NewDefault1.aspx"`, `wt.bda = "https://bdakarnataka.in/#googtrans(en|kn)"`).
     - Both portals host the RMP 2015 Volume II Master Index PDF (`/LandUseMaps/Revised_Master_Plan.pdf`) and all 74 Series-1, Series-2, and Series-3 land-use map sheet PDFs (`/LandUseMaps/Series-1Maps/...`, `/LandUseMaps/Series-2Maps/...`, `/LandUseMaps/Series-3Maps/...`).
2. **GBA / BBMP Building Plan Approval System (BPAS)**:
   - `https://bpas.bbmpgov.in/BPAMSClient4/NewDefault1.aspx`
   - `https://bpas.bbmpgov.in/BPAMSClient4/CommonForms/Circulars.aspx`
   - `https://bpas.bbmpgov.in/BPAMSClient4/CommonForms/download.aspx`
   - Discovery findings:
     - `Circulars.aspx` is the live official municipal repository of building bye-laws, zoning regulations, amendments, and circulars used for building plan sanction across GBA / BBMP.
     - Under **Bye laws and Zoning Regulations** and **Metro FAR**, `Circulars.aspx` lists:
       1. `Bangalore-Building-Byelaws- 2003.pdf`
       2. `Model Building Byelaws Notification No. UDD 14 TTP 2017 (P-4) Bengaluru, Dated 28-10-2017 .pdf`
       3. `T & T Zone Uses Amendment.pdf` (Notification No. UDD 93 MNJ 2008 dated 02-03-2009)
       4. `Zoning Regulations 2015 Amendment Notification No. UDD 105 MNJ 2008, Bangalore Dated 20-03-2015.pdf`
       5. `Zoning Regulations 2015 Amendment Notification No. UDD 255 MNJ 2018, Bangalore Dated 19-06-2019.pdf`
       6. `Zoning_Regulations_RMP2015f (2).pdf`
       7. `Impact Zone Premium FAR Notifi.pdf` (Notification No. UDD 112 MNJ 2015 dated 29-09-2018)
     - **Important binary-integrity finding**: Four linearized/scanned PDFs on `bpas.bbmpgov.in` (`Bangalore-Building-Byelaws-%202003.pdf`, `Zoning_Regulations_RMP2015f%20(2).pdf`, `Impact%20Zone%20Premium%20FAR%20Notifi.pdf`, and `Zoning%20Regulations%202015%20Amendment%20Notification%20No.%20UDD%20105%20MNJ%202008,%20Bangalore%20Dated%2020-03-2015.pdf`) suffered `\r` $\rightarrow$ `\r\n` ASCII-mode FTP line-ending expansion or trailing ASP.NET HTML when uploaded to the Windows IIS server on `bpas.bbmpgov.in`, corrupting binary xref/stream offsets. The original uncorrupted binary copies from `site.bbmp.gov.in` preserved in the Internet Archive Wayback Machine (and verified against the PDF `/Linearized /L <length>` header and OpenCity DigitalOcean CDN copies) match the exact internal byte lengths and open cleanly in PDFium and Docling.
3. **BBMP Legacy Official Website (`site.bbmp.gov.in`) via Internet Archive Wayback Machine CDX**:
   - Searched `https://web.archive.org/cdx/search/cdx?url=site.bbmp.gov.in/*&filter=mimetype:application/pdf` and snapshots of `https://site.bbmp.gov.in/townplanning.html` (`20220619101507` through `20250406150942`).
   - Verified uncorrupted captures of `Bangalore-Building-Byelaws-%202003.pdf` (`20250417153022`), `Zoning_Regulations_RMP2015f%20(1).pdf` (`20220721123900`), `T%20&%20T%20Zone%20Uses%20Amendment2.3.09.pdf` (`20220831190609`), `Amendments%20ZR%20Commercial%20uses%20in%20Residential%20Zone%20dated%2020-03-2015.pdf` (`20220831190613`), `ImpactZone%20Premium%20FAR%20Notifi29.09.18.pdf` (`20220831190616`), `ZR%20Amend%20FAR%20exemptns%2019.6.19.pdf` (`20220831190619`), and the October 2024 Kannada compilation `KM_266_160102035827-pages-deleted_29102024.pdf` (`20250325225145`).
4. **Bangalore Development Authority (BDA) Portals (`bdakarnataka.in` and `bdabangalore.org`)**:
   - Inspected `https://bdakarnataka.in/` (and its React SPA bundle `/assets/index-AG464VUV.js` and `/api/section/getAllSections`).
   - Confirmed BDA's Town Planning section lists **Revised Master Plan 2015 (RMP-2015)** approved vide G.O. No. UDD 540 BEM AA SE 2004 dated 22.06.2007 / 25.06.2007 as the operative Master Plan for Bengaluru (the Draft RMP 2031 dated 22.11.2017 was withdrawn and never notified as final).
5. **Karnataka Gazette (`erajyapatra.karnataka.gov.in`) & OpenCity Urban Data Portal (`data.opencity.in` / `data-opencity.sgp1.cdn.digitaloceanspaces.com`)**:
   - Searched Wayback Machine CDX for `data.opencity.in/dataset/*` and `data-opencity.sgp1.cdn.digitaloceanspaces.com/*`.
   - Retrieved the February 2025 Premium FAR Gazette notification (`No. UDD 78 MNJ 2024 (E)` dated `21.02.2025`, `premium-far-gazette.pdf`) and the January 2026 Greater Bengaluru Zonal Regulations Amendment (`No. UDD 235 MNJ 2025(E)` dated `05.01.2026`, `udd-235-mnj-2025e-05.01.2026.pdf`) from verified Wayback Machine captures of `data.opencity.in`.

---

## 3. Statutory Continuity of the 2003 Building Bye-Laws

A core legal question in `04-acquire-core-documents.md` is whether the **Bangalore Mahanagara Palike Building Bye-laws 2003 (`bbl-2003`)** continue in force for Bengaluru South City Corporation:

1. **Original Notification**: Approved by the Government of Karnataka in `Order No.UDD/223/MNU/2001, Dated 21-02-2004`, published under Section 428 of the Karnataka Municipal Corporations Act, 1976, and brought into operation on **5 June 2004** (Clause 1.3).
2. **Saving under the BBMP Act, 2020 and Greater Bengaluru Governance Act, 2024**:
   - Section 375(2)(b) of the *Bruhat Bengaluru Mahanagara Palike Act, 2020* and Section 370 of the *Greater Bengaluru Governance Act, 2024* save all rules, regulations, bye-laws, notifications, and orders made under the repealed *Karnataka Municipal Corporations Act, 1976* / *BBMP Act, 2020* insofar as they are not inconsistent with the new Act, until superseded by new bye-laws made thereunder.
3. **Operational Confirmation on Official Portals**:
   - On `bengalurusouth.karnataka.gov.in`, the Building Plan Approval service links directly to `https://bpas.bbmpgov.in/BPAMSClient4/NewDefault1.aspx`.
   - On `https://bpas.bbmpgov.in/BPAMSClient4/CommonForms/Circulars.aspx`, `Bangalore-Building-Byelaws- 2003.pdf` is listed first under **Bye laws and Zoning Regulations**.
   - Furthermore, on 4 March 2026, Bengaluru South City Corporation published the *Draft Bengaluru South City Corporation Building (Amendment) Bye-laws, 2026* (`bscc-10125.pdf`) inviting public comments within 30 days to amend the 2003 Bye-laws—confirming that the 2003 Bye-laws remain the operative principal municipal building bye-laws.

---

## 4. Acquired Core Documents (10 PDFs in `data/raw/in-ka-bengaluru-south/`)

| `doc_id` | Verbatim Title / Notification | Notified Date | Effective Date | Pages | Bytes | SHA-256 (prefix) | Primary `source_url` |
|---|---|---:|---:|---:|---:|---|---|
| `bbl-2003` | `BANGALORE MAHANAGARA PALIKE BUILDING BYE-LAWS 2003` (`Order No.UDD/223/MNU/2001`) | `2004-02-21` | `2004-06-05` | 84 | 370,410 | `b819e808ca7083eb` | `https://web.archive.org/web/20250417153022id_/https://site.bbmp.gov.in/PDF/Bangalore-Building-Byelaws-%202003.pdf` |
| `ka-model-bbl-2017` | `Karnataka Municipalities Model Building Bye-Laws, 2017` (`No. UDD 14 TTP 2017 (P-4)`) | `2017-10-28` | `2017-10-28` | 255 | 2,640,281 | `17ec9bac9bfb15d5` | `https://bpas.bbmpgov.in/BPAMSClient4/Downloads/Bye%20laws%20and%20Zoning%20Regulations/Model%20Building%20Byelaws%20Notification%20No.%20UDD%2014%20TTP%202017%20(P-4)%20Bengaluru,%20Dated%2028-10-2017%20.pdf` |
| `rmp2015-zr` | `Revised Master Plan 2015 BANGALORE 2007 Volume – III ZONING OF LANDUSE AND REGULATIONS` (`G.O. No UDD 540 BEM AA SE 2004`) | `2007-06-22` | `2007-06-25` | 69 | 329,801 | `db0d125f4da8abcb` | `https://web.archive.org/web/20220721123900id_/http://site.bbmp.gov.in/PDF/townplanning/Zoning_Regulations_RMP2015f%20(1).pdf` |
| `rmp2015-zr-amend-2009-03` | `Notification No.UDD 93 MNJ 2008 dated 2-3-2009 (4.10 Traffic and Transportation (T&T) Zone Uses Amendment)` | `2009-03-02` | `2009-03-02` | 4 | 1,458,644 | `a4f2be5a66485686` | `https://bpas.bbmpgov.in/BPAMSClient4/Downloads/Bye%20laws%20and%20Zoning%20Regulations/T%20&%20T%20Zone%20Uses%20Amendment.pdf` |
| `rmp2015-zr-amend-2015-03` | `URBAN DEVELOPMENT SECRETARIAT NOTIFICATION No: UDD 105 MNJ 2008, Bangalore, Dated:20/03/2015` | `2015-03-20` | `2015-03-23` | 3 | 155,049 | `620acf259f2cbf19` | `https://web.archive.org/web/20220831190613id_/http://site.bbmp.gov.in/PDF/townplanning/Amendments%20ZR%20Commercial%20uses%20in%20Residential%20Zone%20dated%2020-03-2015.pdf` |
| `rmp2015-zr-amend-2018-09` | `Zoning Regulations of Bengaluru of the Revised Master Plan-2015 (Amendment) Regulations 2018` (`NO. UDD 112 MNJ 2015`) | `2018-09-29` | `2018-09-29` | 2 | 118,308 | `51e90bb43a4c070f` | `https://web.archive.org/web/20220831190616id_/http://site.bbmp.gov.in/PDF/townplanning/ImpactZone%20Premium%20FAR%20Notifi29.09.18.pdf` |
| `rmp2015-zr-amend-2019-06` | `Zoning Regulations of Bengaluru of the Revised Master Plan-2015 (Amendment) Regulations, 2019` (`No. UDD 255 MNJ 2018`) | `2019-06-19` | `2019-06-20` | 8 | 3,568,360 | `94fa7888905ff99b` | `https://bpas.bbmpgov.in/BPAMSClient4/Downloads/Bye%20laws%20and%20Zoning%20Regulations/Zoning%20Regulations%202015%20Amendment%20Notification%20No.%20UDD%20255%20MNJ%202018,%20Bangalore%20Dated%2019-06-2019.pdf` |
| `rmp2015-zr-comp-2024-10-kn` | `Revising the amendments in the regulations in BBMP revised Mahayojane 2015` (`BBMP/TP/2024-25`, Kannada-only) | `2024-10-19` | `2024-10-19` | 36 | 8,248,176 | `2d1329fb205a708d` | `https://web.archive.org/web/20250325225145id_/https://site.bbmp.gov.in/PDF/townplanning/KM_266_160102035827-pages-deleted_29102024.pdf` |
| `rmp2015-zr-amend-2025-02` | `GOVERNMENT OF KARNATAKA No. UDD 78 MNJ 2024 (E) Dated:21.02.2025 NOTIFICATION-1 & NOTIFICATION-II` | `2025-02-21` | `2025-02-21` | 16 | 1,282,141 | `d305dbdf8a42ee7a` | `https://web.archive.org/web/20250307075721id_/https://data.opencity.in/dataset/3877072d-adef-4923-890d-1de96e72faeb/resource/886578b2-3419-40f0-9f51-21b78fefbac7/download/premium-far-gazette.pdf` |
| `rmp2015-zr-amend-2026-01` | `GOVERNMENT OF KARNATAKA No. UDD 235 MNJ 2025(E) date: 05.01.2026 NOTIFICATION` | `2026-01-05` | `2026-01-05` | 7 | 344,161 | `a3672d169c20b77e` | `https://web.archive.org/web/20260216195827id_/https://data.opencity.in/dataset/31a482fe-4ffd-4929-a61d-2fdcca90be91/resource/36f1c5e6-5f5d-4356-bfba-00c5fe1020e2/download/udd-235-mnj-2025e-05.01.2026.pdf` |

---

## 5. Unobtainable & Language-Gap Documents (Rule R16 & Language Policy)

### 5.1 Declared Language Gap (`languages: ["kn"]`)
- **`rmp2015-zr-comp-2024-10-kn`** (`KM_266_160102035827-pages-deleted_29102024.pdf`):
  - Acquired (36 pages, 8,248,176 bytes, SHA-256 `2d1329fb205a708d57c2a4305c3d210ee17c3122c9b0b61371a5a3efcac69760`) from the BBMP Town Planning page (`site.bbmp.gov.in/townplanning.html`).
  - Inspection of all 36 pages confirms this compilation is entirely in Kannada (`languages: ["kn"]`) with no English version in the PDF.
  - Per the Language Policy in `docs/plans/pr-series/00-overview.md`, it is retained in the register with full provenance and declared in `unread_documents` rather than machine-translated or structured.

### 5.2 Unobtainable Documents (`acquisition_status: "not_found"`, Rule R16)
1. **`rmp2015-zr-amend-2025-07`** — *Gazette Notification (July 2025) - Bengaluru Master Plan 2015 Zoning Regulations Amendments*:
   - Discovered in the Wayback Machine snapshot of `https://data.opencity.in/dataset/bengaluru-bda-revised-master-plan-2015-zoning-regulation-amendments` (`20260208040653`), which links to `https://data.opencity.in/dataset/31a482fe-4ffd-4929-a61d-2fdcca90be91/resource/3f2685b8-5e27-44e5-9222-8f6dbff9445f/download/d7b00660-a3bc-49cf-b35a-3d70283ace0a.pdf`.
   - Direct HTTP GET requests to `data.opencity.in` return `HTTP 403 Forbidden` with `cf-mitigated: challenge` (Cloudflare Turnstile bot protection).
   - Searched Wayback Machine CDX (`web.archive.org/cdx/search/cdx?url=data.opencity.in/*`), `data-opencity.sgp1.cdn.digitaloceanspaces.com/*`, `bpas.bbmpgov.in`, `bdakarnataka.in`, and `erajyapatra.karnataka.gov.in`; no archived copy or mirror of `d7b00660-a3bc-49cf-b35a-3d70283ace0a.pdf` exists.
   - Recorded truthfully with `acquisition_status: "not_found"` in `jurisdictions/in-ka-bengaluru-south.yaml` and `unobtainable_documents` per Rule R16.
2. **`bscc-bbl-amend-2026-draft`** — *Bengaluru South City Corporation Building (Amendment) Bye-laws 2026 (04-03-2026)*:
   - Discovered in the Wayback Machine snapshot of `https://data.opencity.in/dataset/bbmp-building-byelaws` (`20260405045507`), which links to `https://data.opencity.in/dataset/bbmp-building-byelaws/resource/d37c7718-8c24-4da7-86a0-d19b974fb8a9/download/bscc-10125.pdf` ("Draft notification for Bengaluru South City Corporation inviting comments within 30 days").
   - Direct HTTP GET requests to `data.opencity.in` return `HTTP 403 Forbidden` (`cf-mitigated: challenge`).
   - Searched `bengalurusouth.karnataka.gov.in`, `gba.karnataka.gov.in`, `bpas.bbmpgov.in`, `updates.bbmpgov.in`, and Wayback Machine CDX; no archived copy or mirror of `bscc-10125.pdf` exists.
   - Recorded truthfully with `legal_status: "draft"` and `acquisition_status: "not_found"` in `jurisdictions/in-ka-bengaluru-south.yaml` and `unobtainable_documents` per Rule R16.
