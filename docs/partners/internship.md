# Bylaw One — Verification Internship Outline (60 to 120 Hours)

**Duration**: 60 hours (4 weeks part-time) or 120 hours (6–8 weeks part-time / summer studio) · **Mode**: Hybrid or remote, supervised jointly by a faculty mentor and Bylaw One maintainer

---

## 1. Purpose & Learning Outcomes

The Bylaw One Verification Internship trains students of architecture, urban planning, civil engineering, and law to:
1. Read primary Indian urban legislation (state municipal Acts, development authority master plans, building bye-laws, and gazette amendments) from official sources.
2. Audit structured provisions, condition-bearing parameter tables, and georeferenced zoning maps against official government PDFs.
3. Contribute reproducible YAML overrides (`data/overrides/<jurisdiction>/`) and verification records under open-source git workflows.

Every intern whose verifications pass the two-match threshold is credited by name and institution on the website, in `datapackage.json`, and in the release notes.

---

## 2. Weekly Tasks & Outputs (60-Hour Track — Weeks 1 to 4)

| Week | Hours | Focus | Tasks | Deliverable / Output |
|------|------:|-------|-------|----------------------|
| **Week 1** | 15 h | **Source Register & Commencement Audit** | Audit 5–8 instruments in the jurisdiction source register (`documents.json`): verify notification numbers, effective dates, quoted status evidence (`status_evidence`), and Internet Archive snapshots. Identify any missing amending notifications or circulars. | Completed source audit sheet + 1–2 `Suggest a source` issue submissions if new instruments are found. |
| **Week 2** | 15 h | **Provision & Amendment Chain Verification** | Complete 60 provision verification tasks in `/verify/<task-set>` across core subjects (`Land use`, `Approvals and certificates`, `Fire safety`, `Definitions`). Check consolidated wording (`versions`) against amending gazette pages. | Exported `.csv` verification file (`60` provisions) + YAML `ocr_corrections` / `clause_fixes` for any mismatches. |
| **Week 3** | 15 h | **Parameter Tables & Conditions Audit** | Complete 60 parameter verification tasks in `/verify/<task-set>` across numeric subjects (`FAR`, `Ground coverage`, `Setbacks`, `Height`, `Parking`). Verify plot-size intervals, road-width thresholds, zone codes, and table footnotes against the PDF tables. | Exported `.csv` verification file (`60` parameter records) + review notes for any table overlap or footnote gaps. |
| **Week 4** | 15 h | **Map & Ward Cross-Check and Final Report** | Cross-check 15–20 wards on `/j/<id>` and `/j/<id>/wards` against official ward delimitation PDFs and master plan land-use sheets. Present a 10-minute summary of findings. | Exported ward/zone verification notes + merged pull request updating `data/overrides/<jurisdiction>/verifications.yaml`. |

---

## 3. Extended Track (120 Hours — Weeks 5 to 8)

Interns continuing for the 120-hour track complete Weeks 1–4 plus:

| Week | Hours | Focus | Tasks | Deliverable / Output |
|------|------:|-------|-------|----------------------|
| **Weeks 5–6** | 30 h | **Land-Use Sheet Georeferencing & GCP Audit** | Identify printed UTM grid crosshairs or road-intersection ground control points (GCPs) on 1–2 unprocessed master plan Proposed Land Use sheets; verify street centre-line offsets against OpenStreetMap. | Committed `map_curations` GCPs and legend swatches in `data/overrides/<jurisdiction>/` with measured street-offset report in `map-verification.md`. |
| **Weeks 7–8** | 30 h | **Worked Case Studies & AI Citation Evaluation** | Construct 5 realistic plot scenarios (varying zone, plot area, road width, and corporation), verify every step of the statutory resolution order by hand against the PDFs, and test AI responses using `/llms-full.txt`. | 5 page-verified worked cases + internship completion certificate and named release credit. |

---

## 4. Supervision & Credit

- **Double-keyed verification**: Interns work in pairs so every task set is checked independently by two interns before `bylaws verify import <csv>` promotes records to `human_verified`.
- **Certificate & portfolio**: Upon completing the deliverables above, interns receive a signed certificate and a permanent link to their credited release on `https://bylaws-india.vercel.app/data`.
