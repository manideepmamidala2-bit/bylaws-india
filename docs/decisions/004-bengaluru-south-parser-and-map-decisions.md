# ADR 004: Bengaluru South (`in-ka-bengaluru-south`) Parser Selection, Bilingual Handling, and Map Extraction Decisions

- **Date**: 2026-11-23
- **Status**: Accepted
- **Context**: Plan v2.0 (`docs/plan-v2.md`) §5.B3–B5 (Reconnaissance, Parsing & Structuring) and §5.C1–C5 (Maps, Overlays & Clause–Zone Tagging)

## Context

During execution of Part B and Part C for **Bengaluru South City Corporation (`in-ka-bengaluru-south`)**, decisions were required on:
1. **Parser selection across the 28 full-text instruments** (including bilingual English/Kannada gazette notifications such as `rmp2015-zr-amend-2026-01` and multi-table instruments such as `bbl-2003` and `rmp2015-zr`).
2. **Treatment of statutory section numbering (`13-E`, `18-B`, `13-A`, `240`, `248`)** in enabling Karnataka Acts (`ktcp-act-1961`, `kfs-act-1964`, `gbg-act-2024`).
3. **Geospatial CRS reprojection and overlay generation** across the 9 RMP 2015 planning districts (`1.09` to `3.18`) intersecting Bengaluru South City Corporation.

## Decisions

### 1. Permissive Parser Selection (`pypdfium2` + Column/Table Layout Pipeline + `tesseract` `eng+kan` OCR Fallback)

- Every full-text PDF in `in-ka-bengaluru-south` is evaluated across `pypdfium2` (Apache-2.0 / BSD-3-Clause), `docling` layout/table pipeline (MIT), and `tesseract` (`eng+kan`, Apache-2.0) in `bylaws compare --jurisdiction in-ka-bengaluru-south` (`data/reports/in-ka-bengaluru-south/parser-comparison.md`).
- Because the staged PDFs carry embedded digital text layers (including embedded `NotoSansKannada` Unicode glyphs for Kannada provisions in `rmp2015-zr-amend-2026-01`), the column-aware and table-extracting `pypdfium2` pipeline achieves **100% text coverage**, **100% bounding-box (`bbox`) citation coverage**, and **100% structured table extraction** across all 9 regulatory tables (`Table 2B` 2003 & 2026, `Table 4`, `Table 8` 2007 & 2026, `Table 10`, `Table 11.1` 2025 & 2026, `Table 23`, `Table 4.12`, and `Table 1.1`), while `tesseract` (`eng+kan`) is retained for scanned page ranges.
- Kannada clauses (such as `rmp2015-zr-amend-2026-01:1.2`) are preserved verbatim with `language: "kn"` and never machine-translated (Plan v2.0 §5.B5).

### 2. Hyphenated Statutory Section Numbering (`13-E`, `18-B`, `13-A`)

- Karnataka statutes (`ktcp-act-1961` Sections `13-E`, `18-B` and `kfs-act-1964` Sections `13-A`, `13-B`) use hyphenated alphanumeric section numbers followed by a period (`13-E. Amendment to Regulations of Master Plan: ...`).
- `INT_CLAUSE_RE` in `pipeline/bylaws/structure.py` is extended to `^(?P<number>\d{1,3}(?:-[A-Z])?)\.\s+(?P<rest>[A-Z'\"(\u0c80-\u0cff].+)$` so hyphenated statutory section numbers are structured as first-class clauses without false positives on 4-digit years or dates.

### 3. Geospatial Layers, UTM Zone 43N Reprojection & Honest Overlay Declarations

- **Official Boundaries (`kind: "official_boundary"`)**: Extracted from the GBA September/November 2025 delimitation KMLs into `boundary.geojson` (Bengaluru South City Corporation), `gba-zones.geojson` (South Zone 1 West & South Zone 2 East), and `wards.geojson` (20 Bengaluru South wards).
- **Intersecting RMP 2015 Planning Districts (`planning-districts.geojson`)**: All 9 intersecting planning districts (`1.09` Basavanagudi, `1.10` Jayanagar, `1.11` BTM Layout, `2.13` Girinagar/Hosakerehalli, `2.14` Banashankari, `2.15` J.P. Nagar, `3.16` HSR/Bommanahalli, `3.17` Begur/Bannerghatta Road, `3.18` Uttarahalli/Kanakapura Road) are published in `planning-districts.geojson` with OpenCity's PD 204 label error (Benson Town vs Jayanagar) corrected.
- **Master Plan Land-Use Zones (`zones.geojson`)**: Reprojected from `EPSG:32643` (UTM Zone 43N, the 1:10,000 grid printed on RMP 2015 sheets) to `EPSG:4326` (WGS 84), clipped to the Bengaluru South boundary, and verified in `data/reports/in-ka-bengaluru-south/map-verification.md` with `>98%` area coverage across all 10 RMP 2015 zone codes (`R-Main`, `R-Mixed`, `C-Central`, `C-Business`, `C-Mutation`, `I-General`, `I-HiTech`, `P&SP`, `T&T`, `Park`).
- **Derived & Reference Overlays (`overlays.geojson` & `geo-layers.json`, Rules R13 & R14)**:
  - `overlay-metro-11m` (`metro-influence-2020`, `in_force`): Published in `overlays.geojson` as an approximate 11 m buffer (`derived: true`, `accuracy_m: 15.0`) around Namma Metro underground alignments in Bengaluru South.
  - `ktcda-act` Lake Buffers: Not drawn because the 2025 size-based lake buffer amendment has contested assent/commencement status (`legal_status: "status_unknown"`); declared in `declarations.json`.
  - `rmp2015-zr-swd-buffer-2025` Storm Water Drain Buffers: Rule text (30 m / 15 m / 10 m) is structured in full; polygon buffers are declared in `declarations.json` (`not_modelled`) pending official GBA classified primary/secondary/tertiary drain centreline GIS publication.
  - `overlay-aai-cczm-ref` (`aai-cczm`): Recorded as `kind: "reference"` in `geo-layers.json` linking to `http://nocas2.aai.aero/nocas` without drawing height surfaces.
