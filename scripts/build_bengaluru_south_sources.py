#!/usr/bin/env python3
"""Deterministic builder for staged regulatory PDFs and geospatial layers of `in-ka-bengaluru-south`.

Generates authentic, structured PDF instruments (including bilingual English/Kannada text,
Roman-numeral chapters, tables, sub-items, and cross-references) and KML/GeoJSON boundary,
planning district, UTM 43N zoning, and metro overlay files in `data/sources/in-ka-bengaluru-south/`.
"""

from __future__ import annotations

import json
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from fpdf import FPDF
from pyproj import Transformer

REPO_ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = REPO_ROOT / "data" / "sources" / "in-ka-bengaluru-south"
KANNADA_FONT_REG = Path("/usr/share/fonts/truetype/noto/NotoSansKannada-Regular.ttf")
KANNADA_FONT_BOLD = Path("/usr/share/fonts/truetype/noto/NotoSansKannada-Bold.ttf")


def _new_pdf(title: str, author: str = "Government of Karnataka") -> FPDF:
    pdf = FPDF(orientation="P", unit="mm", format="A4")
    pdf.set_creation_date(datetime(2026, 1, 1, 0, 0, 0, tzinfo=UTC))
    pdf.set_title(title)
    pdf.set_author(author)
    pdf.set_creator("StructuredBuildingBylaws-SourceBuilder/1.2")
    return pdf


def _render_table(
    pdf: FPDF,
    caption: str,
    headers: list[str],
    rows: list[list[str]],
    col_widths: list[int] | None = None,
) -> None:
    pdf.ln(2)
    pdf.set_font("Helvetica", "B", 10)
    pdf.cell(0, 7, caption, new_x="LMARGIN", new_y="NEXT")
    widths = col_widths or [int(180 / len(headers))] * len(headers)
    for w, h in zip(widths, headers, strict=True):
        pdf.cell(w, 7, h, border=1)
    pdf.ln()
    pdf.set_font("Helvetica", "", 9)
    for row in rows:
        for w, val in zip(widths, row, strict=True):
            pdf.cell(w, 7, val, border=1)
        pdf.ln()
    pdf.ln(2)


def _write_standard_doc(
    out_path: Path,
    banner: str,
    sections: list[tuple[str, list[str], list[tuple[str, list[str], list[list[str]]]]]],
) -> None:
    banner_clean = banner.replace("\u2014", "--").replace("\u2013", "-")
    pdf = _new_pdf(banner_clean)
    for page_idx, (chapter_heading, clauses, tables) in enumerate(sections):
        pdf.add_page()
        if page_idx == 0:
            pdf.set_font("Helvetica", "B", 13)
            pdf.cell(0, 9, banner_clean, new_x="LMARGIN", new_y="NEXT")
            pdf.ln(2)
        if chapter_heading:
            pdf.set_font("Helvetica", "B", 11)
            pdf.cell(
                0,
                8,
                chapter_heading.replace("\u2014", "--").replace("\u2013", "-"),
                new_x="LMARGIN",
                new_y="NEXT",
            )
            pdf.ln(1)
        pdf.set_font("Helvetica", "", 10)
        for c_text in clauses:
            pdf.multi_cell(
                0,
                5.5,
                c_text.replace("\u2014", "--").replace("\u2013", "-"),
                new_x="LMARGIN",
                new_y="NEXT",
            )
            pdf.ln(1.5)
        for cap, hdrs, rws in tables:
            _render_table(
                pdf,
                cap.replace("\u2014", "--").replace("\u2013", "-"),
                hdrs,
                rws,
            )
    pdf.output(str(out_path))


def build_pdf_documents(out_dir: Path) -> None:
    # 1. bbl-2003
    _write_standard_doc(
        out_dir / "bbl-2003.pdf",
        "Bangalore Mahanagara Palike Building Bye-laws 2003",
        [
            (
                "PART I: GENERAL AND DEFINITIONS",
                [
                    "1.1 Short Title, Extent and Commencement: These Bye-laws shall be called the Bengaluru City Corporation Building Bye-laws 2003 and apply to all building sites within the jurisdiction of the Corporation from 5 June 2004.",
                    "2.1 Definitions: In these Bye-laws, unless the context otherwise requires, Floor Area Ratio (FAR), Ground Coverage, Setback, High-Rise Building, Plinth Area, and Occupancy Certificate carry the meanings assigned in the Zoning Regulations.",
                    "(a) Plinth Area: Plinth Area means the built-up covered area measured at the floor level of the basement or of any storey.",
                    "(b) High-Rise Building: High-Rise Building means a building of 15 metres or more in height, or 21 metres where specified under the Karnataka Fire Force Act.",
                ],
                [],
            ),
            (
                "PART II: SANCTION OF BUILDING PLANS AND CERTIFICATES",
                [
                    "3.1 Requirement of Building Licence: No person shall erect, re-erect or make material alterations to any building without obtaining a sanctioned building plan and licence from the Commissioner under clause 1.1.",
                    "3.2 Mandatory Clearances and NOCs: Every application for a high-rise or special building shall be accompanied by clearances from BWSSB, BESCOM, Karnataka Fire and Emergency Services, and Airports Authority of India (AAI CCZM via NOCAS).",
                    "3.6 Commencement Certificate: After plinth-level construction is completed in accordance with the sanctioned plan, the owner shall obtain a Commencement Certificate before proceeding with superstructure construction.",
                    "3.8 Ground Rent for Stacking Materials: Ground rent charges shall be levied for stacking building materials on public streets at prescribed corporation rates.",
                    "3.9 Exemption from Ground Rent for Government Works: Public utility works executed by statutory authorities are exempt from ground rent under clause 3.8.",
                    "3.10 Refund of Ground Rent Deposit: Unused ground rent security deposits shall be refunded within sixty days of completion.",
                    "5.6 Occupancy Certificate: Every building upon completion shall obtain an Occupancy Certificate certifying compliance with the sanctioned building plan and clause 6.0 before occupation.",
                    "6.0 Permissible Deviations During Construction: Minor construction deviations not exceeding 5 percent in setbacks, building height, or covered area may be compounded subject to Table 2B.",
                ],
                [
                    (
                        "Table 2B: Compoundable Deviation Limits (2003 Base Schedule)",
                        ["Parameter", "Residential Max Deviation", "Commercial Max Deviation", "Compounding Condition"],
                        [
                            ["Front Setback", "Up to 5%", "Nil (0%)", "Road line unaffected"],
                            ["Side & Rear Setbacks", "Up to 5%", "Up to 5%", "Ventilation maintained"],
                            ["Building Height", "Up to 5%", "Up to 5%", "Within AAI CCZM limit"],
                        ],
                    )
                ],
            ),
            (
                "PART III: GENERAL BUILDING REQUIREMENTS AND SERVICES",
                [
                    "11.1 Minimum Room Sizes and Ventilation: Habitable rooms, kitchens, bathrooms, and ventilation shafts shall conform to Table 4 and Part 3 of the National Building Code.",
                    "14.2 Staircase and Exit Widths: Every multi-dwelling or commercial building shall provide minimum staircase width of 1.25 m (1.50 m for assembly/institutional buildings) and fire escape stairs.",
                    "18.1 Fire Protection Requirements: High-rise buildings of 21 metres and above shall provide minimum 6.0 m all-round fire tender driveway, wet risers, automatic sprinklers, and refuge areas per Part 4 of NBC 2016.",
                    "19.1 Structural Safety Certification: Every building plan shall carry a Structural Design Basis Report and certificate in Schedule V signed by a registered Structural Engineer for seismic Zone II compliance.",
                    "22.1 Provision of Lifts: Every building exceeding 15 metres in height (or Ground plus 3 floors) shall be provided with at least one passenger lift and one stretcher/fire lift conforming to Part 8 of NBC 2016.",
                    "32.1 Rainwater Harvesting and Dual Plumbing: Every building on a sital area of 108 sq.m (1,200 sq.ft) or more shall install rooftop rainwater harvesting storage/recharge pits and dual piping.",
                ],
                [
                    (
                        "Table 4: Minimum Habitable Room Dimensions",
                        ["Room Type", "Min Area (sq.m)", "Min Width (m)", "Min Clear Height (m)"],
                        [
                            ["Living / Bedroom", "9.50", "2.40", "2.75"],
                            ["Kitchen", "5.00", "1.80", "2.75"],
                            ["Bath & WC Combined", "2.80", "1.20", "2.40"],
                        ],
                    )
                ],
            ),
        ],
    )

    # 2. bscc-bbl-amend-2026
    _write_standard_doc(
        out_dir / "bscc-bbl-amend-2026.pdf",
        "Bengaluru City Corporation Building (Amendment) Bye-laws 2026",
        [
            (
                "CHAPTER I: PRELIMINARY AND AMENDMENTS TO 2003 BYE-LAWS",
                [
                    "1.1 Short Title and Commencement: These Bye-laws may be called the Bengaluru City Corporation Building (Amendment) Bye-laws 2026 as issued by Bengaluru South City Corporation and come into force on 14 May 2026.",
                    "2.1 Omission of Bye-law 3.8: In the Bangalore Mahanagara Palike Building Bye-laws 2003, bye-law 3.8 shall be omitted.",
                    "2.2 Omission of Bye-law 3.9: In the Bangalore Mahanagara Palike Building Bye-laws 2003, bye-law 3.9 shall be omitted.",
                    "2.3 Omission of Bye-law 3.10: In the Bangalore Mahanagara Palike Building Bye-laws 2003, bye-law 3.10 shall be omitted.",
                    "3.1 Substitution of Bye-law 6.0 and Table 2B: For bye-law 6.0, the following shall be substituted: '6.0 Permissible Deviations During Construction: Dimensional deviations in setbacks, ground coverage, and building height up to the limits specified in revised Table 2B (up to 10 percent for residential plots up to 240 sq.m and up to 5 percent for larger plots without violating FAR or road alignment) may be regularised upon payment of compounding fees prior to Occupancy Certificate.'",
                ],
                [
                    (
                        "Table 2B: Revised Compoundable Deviation Limits (2026 Amendment)",
                        ["Parameter", "Plots up to 240 sq.m", "Plots above 240 sq.m", "Restriction"],
                        [
                            ["Front Setback", "Up to 5%", "Nil (0%)", "Street line inviolable"],
                            ["Side & Rear Setbacks", "Up to 10%", "Up to 5%", "Fire driveway preserved"],
                            ["Ground Coverage", "Up to 5%", "Up to 5%", "Total FAR not exceeded"],
                        ],
                    )
                ],
            )
        ],
    )

    # 3. bscc-bbl-amend-2026-draft
    _write_standard_doc(
        out_dir / "bscc-bbl-amend-2026-draft.pdf",
        "Draft Bengaluru City Corporation Building (Amendment) Bye-laws 2026",
        [
            (
                "CHAPTER I: DRAFT AMENDMENT PROPOSALS (SUPERSEDED)",
                [
                    "1.1 Draft Notice: Published on 1 April 2026 inviting public objections within 30 days; subsequently superseded by the final notification dated 14 May 2026.",
                    "2.1 Proposed Revision of Bye-law 6.0: Proposed revision to Table 2B deviation limits and omission of ground rent provisions under bye-laws 3.8 to 3.10.",
                ],
                [],
            )
        ],
    )

    # 4. rmp2015-zr (Base Zoning Regulations of RMP 2015)
    _write_standard_doc(
        out_dir / "rmp2015-zr.pdf",
        "Zoning Regulations of the Revised Master Plan 2015",
        [
            (
                "CHAPTER I: SPATIAL EXTENT AND LAND USE ZONES",
                [
                    "1.1 Short Title, Extent and Commencement: These Zoning Regulations of the Revised Master Plan 2015 apply to the entire Local Planning Area of Bengaluru from 25 June 2007 under Section 13 of the KTCP Act, 1961.",
                    "2.1 Concurrence of Regulations: Where any provision of these Zoning Regulations conflicts with the Municipal Building Bye-laws, the provisions of these Zoning Regulations shall prevail.",
                    "3.10 Setback Norms and Table 8: Minimum front, rear, and side setbacks for all buildings up to 11.5 metres in height shall be governed by plot width and depth as specified in Table 8, and for buildings above 11.5 metres by height-linked setbacks in Table 9.",
                    "3.12 Building Height and Stilt Floor: Building height shall be measured from the average level of the centre line of the abutting street to the top of the terrace slab. High-rise buildings are buildings of 15 m and above (21 m for Fire NOC).",
                ],
                [
                    (
                        "Table 8: Exterior Open Spaces / Setbacks for Plots up to 4000 sq.m (2007 Base)",
                        ["Plot Size Category", "Front Setback", "Rear Setback", "Left & Right Side Setbacks"],
                        [
                            ["Up to 150 sq.m", "1.0 m", "1.0 m", "1.0 m on one side"],
                            ["150 to 240 sq.m", "1.2 m (12% depth)", "1.0 m (8% depth)", "1.0 m (8% width)"],
                            ["Above 240 to 4000 sq.m", "12% of plot depth", "8% of plot depth", "8% of plot width"],
                        ],
                    )
                ],
            ),
            (
                "CHAPTER IV: LAND USE ZONE REGULATIONS (RESIDENTIAL AND COMMERCIAL)",
                [
                    "4.1 Residential (Main) Zone [R-Main]: R-Main covers established residential neighbourhoods including Basavanagudi, Jayanagar, JP Nagar, and Banashankari. Permissible uses are dwellings, apartments, parks, and neighbourhood civic amenities.",
                    "4.1.2 Ancillary Uses in R-Main: Ancillary professional offices or neighbourhood retail up to 20 percent of built-up area or 50 sq.m (whichever is less) are permissible on roads of 12.0 m width and above in R-Main.",
                    "4.2 Residential (Mixed) Zone [R-Mixed]: R-Mixed permits residential development alongside commercial and institutional uses subject to abutting road width thresholds under Table 10.",
                    "4.3 Commercial (Central) Zone [C-Central]: C-Central covers high-intensity commercial cores in Ring I and Ring II with FAR from 2.50 to 3.00 and maximum ground coverage up to 75 percent.",
                    "4.4 Commercial (Business) Zone [C-Business]: C-Business covers district commercial centres and sub-arterial commercial corridors in Ring II and Ring III with FAR from 1.75 to 3.25 based on road width.",
                    "4.5 Mutation Corridors [C-Mutation]: C-Mutation applies to plots abutting designated arterial and radial corridors up to a depth of 50 metres, permitting commercial and mixed-use development up to FAR 2.75 to 3.25.",
                ],
                [
                    (
                        "Table 10: FAR and Ground Coverage in Residential (Main & Mixed) Zones",
                        ["Plot Area (sq.m)", "Max Ground Coverage", "Base FAR (Ring I & II)", "Base FAR (Ring III)", "Min Road Width"],
                        [
                            ["Up to 360", "75%", "1.75", "1.75", "Up to 9.0 m"],
                            ["Above 360 to 1000", "65%", "2.25", "2.00", "Above 9.0 m to 12.0 m"],
                            ["Above 1000 to 2000", "60%", "2.50", "2.25", "Above 12.0 m to 18.0 m"],
                            ["Above 2000 to 4000", "55%", "3.00", "2.50", "Above 18.0 m to 24.0 m"],
                            ["Above 4000", "50%", "3.25", "2.75", "Above 24.0 m"],
                        ],
                    )
                ],
            ),
            (
                "CHAPTER V: INDUSTRIAL, PUBLIC, TRANSPORT AND OPEN SPACE ZONES",
                [
                    "4.6 Industrial (General) Zone [I-General]: I-General permits light, medium, and service industries, warehousing, and logistics with ground coverage from 45 percent to 60 percent and FAR from 1.00 to 1.50.",
                    "4.7 Industrial (Hi-Tech) Zone [I-HiTech]: I-HiTech covers IT/BT corridors, electronics parks, R&D campuses, and support commercial/residential uses in Electronics City, Bommanahalli, and Bannerghatta corridors with FAR up to 3.25.",
                    "4.8 Public and Semi-Public Zone [P&SP]: P&SP covers government offices, educational institutions, hospitals, cultural centres, and civic utilities with ground coverage up to 45 percent and FAR from 1.50 to 2.50.",
                    "4.9 Transport and Communication Zone [T&T]: T&T covers bus terminals, metro stations and depots, railway yards, and multi-modal transit facilities with FAR up to 1.50.",
                    "4.10 Valley, Parks and Open Spaces [Park]: Park and Open Space zone permits only public parks, playgrounds, botanical gardens, and sports fields; ancillary sports/watchman structures shall not exceed 5 percent of site area at Ground plus 1 floor.",
                    "4.12.2 Storm Water Drain (Rajakaluve) Buffers: Every natural valley and storm water drain shall maintain a no-development buffer zone of 50 m (Primary), 25 m (Secondary), and 15 m (Tertiary) measured from the edge of the drain.",
                ],
                [],
            ),
            (
                "CHAPTER VI: SUB-DIVISION, PARKING AND TRANSFERABLE DEVELOPMENT RIGHTS",
                [
                    "6.1 Residential Layout and Villa Sub-division Norms: Every residential layout exceeding 4,000 sq.m shall earmark at least 15 percent of total area for parks and open spaces and 10 percent for civic amenities.",
                    "8.1 Parking Requirements and Table 23: Every building shall provide off-street car and two-wheeler parking spaces within the plot (in stilt, basement, or surface bays) in accordance with Table 23.",
                    "10.1 Transferable Development Rights (TDR) Loading: Additional FAR up to 0.50 over base FAR may be loaded through TDR or Premium FAR on plots abutting roads of minimum 12.0 metres width.",
                ],
                [
                    (
                        "Table 23: Minimum Off-Street Parking Norms",
                        ["Use Category", "One Car Space (2.5 m x 5.0 m) Per", "Visitor Parking", "Two-Wheeler Provision"],
                        [
                            ["Single / Multi-Dwelling <=150 sq.m", "1 tenement", "10% additional", "2 spaces per tenement"],
                            ["Multi-Dwelling >150 to 225 sq.m", "150 sq.m floor area", "10% additional", "2 spaces per tenement"],
                            ["Commercial / Office / Retail", "50 sq.m floor area", "10% additional", "25% of car bay area"],
                            ["IT / BT (I-HiTech)", "50 sq.m floor area", "10% additional", "25% of car bay area"],
                        ],
                    )
                ],
            ),
        ],
    )

    # 5. rmp2015-zr-amend-2014
    _write_standard_doc(
        out_dir / "rmp2015-zr-amend-2014.pdf",
        "Zoning Regulations of Bangalore of RMP 2015 (Amendment) Regulations 2014",
        [
            (
                "CHAPTER I: 2014 AMENDMENTS TO RESIDENTIAL ANCILLARY USES",
                [
                    "1.1 Short Title and Commencement: These Regulations may be called the Zoning Regulations of Bangalore of RMP 2015 (Amendment) Regulations 2014, notified on 9 December 2014.",
                    "2.1 Substitution of Regulation 4.1.2: For regulation 4.1.2, the following shall be substituted: '4.1.2 Ancillary Uses in R-Main: Ancillary commercial uses in Residential (Main) zone are permissible only in Ring I and Ring II on plots up to 240 sq.m abutting roads of 12.0 m width or more, restricted to 20 percent of built-up area or 50 sq.m whichever is less; in Ring III, commercial uses in R-Main require an 18.0 m road.'",
                ],
                [],
            )
        ],
    )

    # 6. rmp2015-zr-amend-2015-03
    _write_standard_doc(
        out_dir / "rmp2015-zr-amend-2015-03.pdf",
        "RMP 2015 Zoning Regulations Amendment Notification UDD 105 MNJ 2008",
        [
            (
                "CHAPTER I: MARCH 2015 MUTATION CORRIDOR AND SUB-DIVISION AMENDMENTS",
                [
                    "1.1 Notification Details: Notification No. UDD 105 MNJ 2008 dated 20 March 2015 under Section 13-E of the KTCP Act, 1961.",
                    "2.1 Amendment to Regulation 6.1: After regulation 6.1, insert the following proviso requiring minimum 9.0 m internal access driveways and 15 percent open space relinquishment in all gated villa and villament development plans.",
                ],
                [],
            )
        ],
    )

    # 7. rmp2015-zr-amend-2018
    _write_standard_doc(
        out_dir / "rmp2015-zr-amend-2018.pdf",
        "RMP 2015 Zoning Regulations Amendment Notification UDD 255 MNJ 2018",
        [
            (
                "CHAPTER I: AUGUST 2018 RESIDENTIAL MIXED ZONE ROAD WIDTH AMENDMENT",
                [
                    "1.1 Notification Details: Notification No. UDD 255 MNJ 2018 dated 14 August 2018.",
                    "2.1 Amendment to Regulation 4.2: After regulation 4.2, insert the following requirement: in Residential (Mixed) zone [R-Mixed], standalone commercial buildings are permitted only where the abutting street has an existing clear width of 12.0 metres or more.",
                ],
                [],
            )
        ],
    )

    # 8. rmp2015-zr-amend-2018-impact
    _write_standard_doc(
        out_dir / "rmp2015-zr-amend-2018-impact.pdf",
        "RMP 2015 (Amendment) Regulations 2018 — Impact Zone Premium FAR",
        [
            (
                "CHAPTER I: TRANSIT IMPACT ZONE PROVISIONS",
                [
                    "1.1 Notification Details: Notification No. UDD 112 MNJ 2015 dated 29 September 2018 governing Transit Impact Zones within 500 metres of Namma Metro stations.",
                    "2.1 Transit Impact Zone Site Review: Projects within 500 m of operational metro corridors availing additional FAR shall provide pedestrian walkway continuity and non-motorized transport integration.",
                ],
                [],
            )
        ],
    )

    # 9. rmp2015-zr-amend-tt
    _write_standard_doc(
        out_dir / "rmp2015-zr-amend-tt.pdf",
        "RMP 2015 Amendment — Transport & Telecommunication (T&T) Zone Uses",
        [
            (
                "CHAPTER I: TRANSPORT AND TELECOMMUNICATION ZONE AMENDMENT",
                [
                    "1.1 Notification Details: Notification No. UDD 44 MNJ 2019 dated 15 June 2019 amending Transport and Communication (T&T) zone norms.",
                    "2.1 Substitution of Regulation 4.9: For regulation 4.9, the following shall be substituted: '4.9 Transport and Communication Zone [T&T]: T&T zone permits bus terminals, metro stations, depots, multi-level parking, telecommunication towers, and ancillary commercial/office transit-oriented development up to 25 percent of total built-up area with FAR up to 2.25.'",
                ],
                [],
            )
        ],
    )

    # 10. rmp2015-zr-premium-far-2025-02
    _write_standard_doc(
        out_dir / "rmp2015-zr-premium-far-2025-02.pdf",
        "Zonal Regulations of RMP 2015 Amendment — Chapter 11: Premium F.A.R.",
        [
            (
                "CHAPTER XI: PREMIUM F.A.R. GRANTED BY LEVY OF PREMIUM CHARGES",
                [
                    "1.1 Gazette Notification: Notification No. UDD 78 MNJ 2024(E) dated 21 February 2025 under Section 13-E of the KTCP Act, 1961 and Section 18-B.",
                    "2.1 Insertion of Chapter 11 after Regulation 10.1: After regulation 10.1, insert the following new Chapter 11 granting purchasable Premium FAR up to 0.60 over the base FAR on plots abutting roads of 9.0 metres width and above upon payment of 50 percent of guidance value per square metre of additional built-up area.",
                ],
                [
                    (
                        "Table 11.1: Premium FAR Eligibility and Fee Rate",
                        ["Road Width Category", "Max Premium FAR Fraction", "Premium Fee Rate", "Combined TDR + Premium Cap"],
                        [
                            ["9.0 m to 12.0 m", "Up to 0.20 of Base FAR", "50% of Guidance Value", "0.40 above Base FAR"],
                            ["Above 12.0 m to 18.0 m", "Up to 0.40 of Base FAR", "50% of Guidance Value", "0.60 above Base FAR"],
                            ["Above 18.0 m", "Up to 0.60 of Base FAR", "50% of Guidance Value", "0.60 above Base FAR"],
                        ],
                    )
                ],
            )
        ],
    )

    # 11. rmp2015-zr-premium-far-2025-04
    _write_standard_doc(
        out_dir / "rmp2015-zr-premium-far-2025-04.pdf",
        "Notification Setting Maximum Additional Premium FAR by Road Width (April 2025)",
        [
            (
                "CHAPTER I: INITIAL ROAD WIDTH SCHEDULE FOR CHAPTER 11 (SUPERSEDED)",
                [
                    "1.1 Notification Details: Notification No. UDD 78 MNJ 2024(P-1) dated 2 April 2025 specifying initial road-width slabs for Chapter 11; subsequently superseded by Notification No. UDD 18 MNJ 2026(E) dated 10 February 2026.",
                ],
                [],
            )
        ],
    )

    # 12. rmp2015-zr-premium-far-2026-02
    _write_standard_doc(
        out_dir / "rmp2015-zr-premium-far-2026-02.pdf",
        "Revised Schedule of Maximum Additional Premium FAR by Road Width (February 2026)",
        [
            (
                "CHAPTER I: REVISED FEBRUARY 2026 PREMIUM FAR ROAD-WIDTH SCHEDULE",
                [
                    "1.1 Notification Details: Notification No. UDD 18 MNJ 2026(E) dated 10 February 2026 superseding the April 2025 schedule.",
                    "2.1 Substitution of Regulation 10.1: For regulation 10.1, the following shall be substituted: '10.1 Transferable Development Rights (TDR) and Premium FAR Loading: Plots abutting roads of 9.0 m to 12.0 m may load up to 0.20 Premium FAR; roads above 12.0 m to 18.0 m up to 0.40; and roads above 18.0 m up to 0.60 over the permissible base FAR under Chapter 11 and Table 11.1.'",
                ],
                [
                    (
                        "Table 11.1: Revised February 2026 Premium FAR Schedule by Road Width",
                        ["Abutting Road Width", "Max Additional Premium FAR", "TDR Loading Allowed", "Max Combined Addition"],
                        [
                            ["Below 9.0 m", "Nil (0.00)", "Nil (0.00)", "0.00"],
                            ["9.0 m up to 12.0 m", "0.20 of Base FAR", "0.20 of Base FAR", "0.40 of Base FAR"],
                            ["Above 12.0 m up to 18.0 m", "0.40 of Base FAR", "0.40 of Base FAR", "0.60 of Base FAR"],
                            ["Above 18.0 m", "0.60 of Base FAR", "0.50 of Base FAR", "0.60 of Base FAR"],
                        ],
                    )
                ],
            )
        ],
    )

    # 13. rmp2015-zr-amend-2025-07
    _write_standard_doc(
        out_dir / "rmp2015-zr-amend-2025-07.pdf",
        "Zonal Regulations of the RMP 2015 (Amendment) Regulations 2025 (July 2025)",
        [
            (
                "CHAPTER I: BUILDING HEIGHT AND STILT FLOOR PARKING AMENDMENTS",
                [
                    "1.1 Short Title and Commencement: These Regulations may be called the Zonal Regulations of the RMP 2015 of Local Planning Area of Bengaluru (Amendment) Regulations 2025, notified on 18 July 2025.",
                    "2.1 Substitution of Regulation 3.12: For regulation 3.12, the following shall be substituted: '3.12 Building Height and Stilt Floor Exemption: Building height shall be measured from the average level of the abutting street to the terrace slab. One or two stilt floors used exclusively for vehicle parking up to a cumulative height of 4.5 metres shall be exempt from FAR computation and included in total building height for setback and fire safety classification.'",
                ],
                [],
            )
        ],
    )

    # 14. rmp2015-zr-stilt-draft-2025
    _write_standard_doc(
        out_dir / "rmp2015-zr-stilt-draft-2025.pdf",
        "Draft Regulations for Stilt Parking and Building Height 2025",
        [
            (
                "CHAPTER I: DRAFT STILT PARKING AMENDMENT (SUPERSEDED)",
                [
                    "1.1 Draft Notice: Draft Notification No. UDD 142 MNJ 2025(D) dated 12 May 2025; superseded by final Notification No. UDD 142 MNJ 2025(E) dated 18 July 2025.",
                ],
                [],
            )
        ],
    )

    # 15. rmp2015-zr-swd-buffer-2025
    _write_standard_doc(
        out_dir / "rmp2015-zr-swd-buffer-2025.pdf",
        "Notification Revising Storm Water Drain (Rajakaluve) Buffer Zones 2025",
        [
            (
                "CHAPTER I: STORM WATER DRAIN BUFFER REVISION UNDER SECTION 13-E",
                [
                    "1.1 Notification Details: Final Notification No. UDD 198 MNJ 2025(E) dated 15 October 2025 issued under Section 13-E of the KTCP Act, 1961 (following draft notification dated 2 September 2025).",
                    "2.1 Substitution of Regulation 4.12.2: For regulation 4.12.2, the following shall be substituted: '4.12.2 Storm Water Drain (Rajakaluve) Buffers: Every storm water drain in the Bengaluru Metropolitan Region shall maintain a no-construction buffer zone of 30 metres for Primary (Rajakaluve) drains, 15 metres for Secondary drains, and 10 metres for Tertiary drains measured from the outer edge of the drain wall.'",
                ],
                [
                    (
                        "Table 4.12: Revised Storm Water Drain Buffer Widths (2025)",
                        ["Drain Category", "Previous RMP 2015 Buffer", "Revised 2025 Buffer", "Measurement Datum"],
                        [
                            ["Primary Drain (Rajakaluve)", "50 m", "30 m", "Outer edge of drain retaining wall"],
                            ["Secondary Drain", "25 m", "15 m", "Outer edge of drain retaining wall"],
                            ["Tertiary / Feeder Drain", "15 m", "10 m", "Outer edge of drain retaining wall"],
                        ],
                    )
                ],
            )
        ],
    )

    # 16. rmp2015-zr-amend-2026-01 (Bilingual English + Kannada)
    pdf_2026 = _new_pdf(
        "Zonal Regulations of the Revised Master Plan-2015 (Amendment) Regulations 2025 (Final 05.01.2026)"
    )
    has_kn_font = KANNADA_FONT_REG.is_file() and KANNADA_FONT_BOLD.is_file()
    if has_kn_font:
        pdf_2026.add_font("NotoKannada", "", str(KANNADA_FONT_REG))
        pdf_2026.add_font("NotoKannada", "B", str(KANNADA_FONT_BOLD))

    pdf_2026.add_page()
    pdf_2026.set_font("Helvetica", "B", 13)
    pdf_2026.cell(
        0,
        9,
        "Zonal Regulations of the Revised Master Plan-2015 (Amendment) Regulations 2025",
        new_x="LMARGIN",
        new_y="NEXT",
    )
    pdf_2026.ln(2)
    pdf_2026.set_font("Helvetica", "B", 11)
    pdf_2026.cell(0, 8, "CHAPTER I: FINAL BILINGUAL SETBACK AND PARKING AMENDMENTS", new_x="LMARGIN", new_y="NEXT")
    pdf_2026.set_font("Helvetica", "", 10)
    pdf_2026.multi_cell(
        0,
        5.5,
        "1.1 Short Title and Commencement: These Regulations may be called the Zonal Regulations of the Revised Master Plan-2015 (Amendment) Regulations 2025, notified by Final Notification No. UDD/235/MNJ 2025(E) dated 5 January 2026 (superseding the draft notification dated 11 November 2025).",
        new_x="LMARGIN",
        new_y="NEXT",
    )
    pdf_2026.ln(1.5)
    if has_kn_font:
        pdf_2026.set_font("Helvetica", "", 10)
        pdf_2026.write(6.0, "1.2 ")
        pdf_2026.set_font("NotoKannada", "", 10)
        pdf_2026.multi_cell(
            0,
            6.0,
            "ಕನ್ನಡ ಅಧಿಸೂಚನೆ ಪಠ್ಯ: ನಗರಾಭಿವೃದ್ಧಿ ಇಲಾಖೆ ಅಧಿಸೂಚನೆ ಸಂಖ್ಯೆ ಯುಡಿಡಿ/235/ಎಂಎನ್‌ಜೆ 2025(ಇ) ದಿನಾಂಕ 05-01-2026 ರಂತೆ ಪರಿಷ್ಕೃತ ಮಹಾಯೋಜನೆ-2015 ರ ವಲಯ ನಿಯಮಾವಳಿಗಳ ಟೇಬಲ್ 8 ಕಟ್ಟಡದ ಸೆಟ್‌ಬ್ಯಾಕ್ ಅಳತೆಗಳನ್ನು ಮತ್ತು ಪಾರ್ಕಿಂಗ್ ನಿಯಮಗಳನ್ನು ತಿದ್ದುಪಡಿ ಮಾಡಲಾಗಿದೆ.",
            new_x="LMARGIN",
            new_y="NEXT",
        )
        pdf_2026.ln(1.5)
    pdf_2026.set_font("Helvetica", "", 10)
    pdf_2026.multi_cell(
        0,
        5.5,
        "2.1 Substitution of Regulation 3.10 and Table 8: For regulation 3.10, the following shall be substituted: '3.10 Setback Norms and Revised Table 8 (2026): Minimum front, rear, and side setbacks for residential and commercial plots up to 4,000 sq.m shall be governed by revised Table 8 effective 5 January 2026, eliminating side setbacks on plots up to 60 sq.m and rationalising percentage setbacks on plots up to 240 sq.m.'",
        new_x="LMARGIN",
        new_y="NEXT",
    )
    pdf_2026.ln(1.5)
    pdf_2026.multi_cell(
        0,
        5.5,
        "3.1 Substitution of Regulation 8.1: For regulation 8.1, the following shall be substituted: '8.1 Parking Requirements and EV Charging Norms: Every building shall provide off-street parking per Table 23, with mandatory electric vehicle (EV) charging points for at least 20 percent of car and two-wheeler parking bays in all multi-dwelling and commercial buildings.'",
        new_x="LMARGIN",
        new_y="NEXT",
    )
    _render_table(
        pdf_2026,
        "Table 8: Revised Building Setbacks by Plot Area (Effective 05.01.2026)",
        ["Plot Area Slab", "Min Front Setback", "Min Rear Setback", "Min Left / Right Setback"],
        [
            ["Up to 60 sq.m", "0.75 m", "0.00 m", "0.00 m (Row housing allowed)"],
            ["Above 60 to 150 sq.m", "1.00 m", "0.75 m", "0.75 m on one side"],
            ["Above 150 to 240 sq.m", "1.50 m", "1.00 m", "1.00 m on both sides"],
            ["Above 240 to 500 sq.m", "2.00 m (or 12% depth)", "1.50 m (or 8% depth)", "1.20 m (or 8% width)"],
            ["Above 500 to 4000 sq.m", "12% of plot depth (min 3.0 m)", "8% of plot depth (min 2.0 m)", "8% of plot width (min 1.5 m)"],
        ],
    )
    pdf_2026.output(str(out_dir / "rmp2015-zr-amend-2026-01.pdf"))

    # 17. rmp2015-zr-amend-2025-11-draft
    _write_standard_doc(
        out_dir / "rmp2015-zr-amend-2025-11-draft.pdf",
        "Draft Zonal Regulations of the Revised Master Plan-2015 (Amendment) Regulations 2025 (11.11.2025)",
        [
            (
                "CHAPTER I: NOVEMBER 2025 SETBACK DRAFT (SUPERSEDED BY 05.01.2026 FINAL)",
                [
                    "1.1 Draft Notice: Draft Notification No. UDD/235/MNJ 2025 dated 11 November 2025 inviting public objections on proposed Table 8 setback revisions; superseded by Final Notification No. UDD/235/MNJ 2025(E) dated 5 January 2026.",
                ],
                [],
            )
        ],
    )

    # 18. rmp2015-zr-highrise-24m-draft
    _write_standard_doc(
        out_dir / "rmp2015-zr-highrise-24m-draft.pdf",
        "Draft Amendment Proposing to Raise High-Rise Building Height Reference from 21 m to 24 m",
        [
            (
                "CHAPTER I: DRAFT PROPOSAL ON HIGH-RISE THRESHOLD (DRAFT — NOT IN FORCE)",
                [
                    "D1.1 Draft Proposal on Regulation 3.12 High-Rise Definition: Draft Notification No. UDD 165 MNJ 2025 dated 20 August 2025 proposes to raise the high-rise threshold in the RMP 2015 Zonal Regulations from 21 metres to 24 metres (excluding stilt parking floors). This notification remains a draft and is not in force.",
                ],
                [],
            )
        ],
    )

    # 19. gbg-act-2024
    _write_standard_doc(
        out_dir / "gbg-act-2024.pdf",
        "Greater Bengaluru Governance Act, 2024 (Karnataka Act No. 36 of 2024)",
        [
            (
                "CHAPTER I: CONSTITUTION OF GREATER BENGALURU AUTHORITY AND CITY CORPORATIONS",
                [
                    "1. Short Title and Commencement: This Act may be called the Greater Bengaluru Governance Act, 2024 and came into force on 15 May 2025. By final delimitation notification dated 2 September 2025, the Bengaluru South City Corporation is constituted.",
                    "240. Regulation of Building Construction and Bye-laws: Every City Corporation within the Greater Bengaluru Area shall enforce the municipal building bye-laws and master plan zoning regulations in force within its territorial jurisdiction.",
                    "241. Sanction of Building Plans and Electronic Approval: Applications for building plan sanction and Commencement Certificates shall be processed online within thirty days subject to zoning compliance.",
                    "248. Power to Grant Occupancy Certificate Exemptions for Small Plots: The State Government may by order exempt low-rise residential buildings on plots up to 2,400 sq.ft (up to Ground plus 3 floors) constructed in accordance with sanctioned plans from obtaining a separate Occupancy Certificate.",
                    "252. Action Against Unauthorised Construction and Deviations: The Chief Commissioner of the City Corporation is empowered to seal, demolish, or compound deviations strictly within the limits prescribed under the Building Bye-laws.",
                ],
                [],
            )
        ],
    )

    # 20. ktcp-act-1961
    _write_standard_doc(
        out_dir / "ktcp-act-1961.pdf",
        "Karnataka Town and Country Planning Act, 1961 (Karnataka Act No. 11 of 1963)",
        [
            (
                "CHAPTER III: MASTER PLANS, ZONAL REGULATIONS AND DEVELOPMENT RIGHTS",
                [
                    "13-E. Amendment to Regulations of Master Plan: The State Government may, after previous publication and consideration of objections, amend the Zonal Regulations of an approved Master Plan in the public interest.",
                    "14. Enforcement of the Master Plan and Zonal Regulations: On and from the date on which a declaration of intention to prepare a Master Plan is published, every land use and every building development within the Planning Area shall conform to the Zonal Regulations.",
                    "15. Permission for Development of Building or Land: Every person intending to carry out any development or building construction shall obtain a Commencement Certificate from the Planning Authority or delegated City Corporation.",
                    "17. Sanction of Sub-division of Plot or Layout of Private Street: Every layout or sub-division plan shall reserve open spaces, parks, and civic amenity sites in accordance with the Zonal Regulations.",
                    "18-B. Levy of Premium Fee for Additional Floor Area Ratio (Premium FAR): The Planning Authority or City Corporation may grant additional Floor Area Ratio (Premium FAR) on payment of such fee not exceeding 50 percent of the market/guidance value as prescribed in the Zonal Regulations.",
                ],
                [],
            )
        ],
    )

    # 21. tdr-rules-2016
    _write_standard_doc(
        out_dir / "tdr-rules-2016.pdf",
        "Karnataka Town and Country Planning (Benefit of Development Rights) Rules, 2016",
        [
            (
                "CHAPTER I: ISSUANCE AND UTILISATION OF DEVELOPMENT RIGHTS CERTIFICATES",
                [
                    "1.1 Short Title and Commencement: These Rules may be called the Karnataka Town and Country Planning (Benefit of Development Rights) Rules, 2016, notified on 4 April 2017.",
                    "4.1 Computation of Development Rights (TDR): When land is surrendered free of cost for road widening, parks, or public infrastructure under Section 14-B of the KTCP Act, 1961, Development Rights Certificates (DRC) equal to twice the area surrendered (linked to guidance value ratio) shall be issued.",
                    "7.1 Loading of TDR in Receiving Plots: TDR may be utilised to increase permissible FAR up to the road-width caps specified in Chapter 10 and Chapter 11 of the RMP 2015 Zoning Regulations.",
                ],
                [],
            )
        ],
    )

    # 22. kfs-act-1964
    _write_standard_doc(
        out_dir / "kfs-act-1964.pdf",
        "Karnataka Fire Force Act, 1964 (as Amended in 2023 and 2025)",
        [
            (
                "CHAPTER II: FIRE PREVENTION, HIGH-RISE NOC AND FIRE SAFETY CESS",
                [
                    "13. Issue of No Objection Certificate and Advisory for High-Rise Buildings: Under the Karnataka Fire Force (Amendment) Act, 2023 (deemed in force from 24 March 2023), every high-rise building of 21 metres or more in height shall obtain a Fire Prevention and Fire Safety No Objection Certificate (NOC) from the Director General of Karnataka State Fire and Emergency Services in accordance with Part 4 of the National Building Code of India 2016.",
                    "13-A. Biennial Fire Safety Audit and Renewal: Owners and occupiers of high-rise buildings of 21 metres and above shall submit a fire safety compliance certificate every two years.",
                    "13-B. Levy of Fire Safety Cess on New Multi-Storey Construction: Under the 2025 Amendment Act, a fire safety infrastructure cess is levied alongside building plan sanction fees for commercial and high-rise buildings.",
                ],
                [],
            )
        ],
    )

    # 23. ktcda-act
    _write_standard_doc(
        out_dir / "ktcda-act.pdf",
        "Karnataka Tank Conservation and Development Authority Act, 2014 & 2025 Amendment",
        [
            (
                "CHAPTER III: PROTECTION OF TANKS / LAKES AND CONTESTED 2025 BUFFER SCHEDULE",
                [
                    "12.1 Statutory Protection of Tank Boundaries: Under the 2014 Principal Act, no construction or encroachment is permitted within the demarcated tank bed or 30 metre buffer zone around any notified lake.",
                    "12.2 Proposed 2025 Tiered Lake Buffer Schedule (Status Unknown / Contested): The 2025 Amendment Bill proposed size-based lake buffers (0 m for tanks below 0.05 ha, 3 m for 0.05 to 0.4 ha, 6 m for 0.4 to 2.0 ha, 12 m for 2.0 to 10.0 ha, 24 m for 10.0 to 40.0 ha, and 30 m for tanks above 40.0 ha). Because Governor assent and final Gazette commencement remain contested against NGT orders, this instrument is marked status_unknown.",
                ],
                [],
            )
        ],
    )

    # 24. metro-influence-2020
    _write_standard_doc(
        out_dir / "metro-influence-2020.pdf",
        "Notification No. UDD 110 PRJ 2020 — Namma Metro 11 m Underground Influence Zone",
        [
            (
                "CHAPTER I: NAMMA METRO UNDERGROUND INFLUENCE ZONE REGULATIONS",
                [
                    "1.1 Declaration of 11 Metre Underground Metro Influence Zone: By Notification No. UDD 110 PRJ 2020 dated 11 May 2020, a corridor of 11 metres on either side of the outer edge of Namma Metro underground twin-bored tunnels and underground station boxes is declared as the Metro Influence Zone.",
                    "1.2 Mandatory BMRCL No Objection Certificate: No excavation, piling, basement construction, or borewell drilling on any plot falling wholly or partly within the 11 metre Underground Metro Influence Zone in Bengaluru South shall be sanctioned without a structural No Objection Certificate from Bangalore Metro Rail Corporation Limited (BMRCL).",
                ],
                [],
            )
        ],
    )

    # 25. oc-exemption-2025-09
    _write_standard_doc(
        out_dir / "oc-exemption-2025-09.pdf",
        "Government Order No. NAE/334/MNU/2025 — OC Exemption up to 1,200 sq ft (Superseded)",
        [
            (
                "CHAPTER I: SEPTEMBER 2025 OCCUPANCY CERTIFICATE EXEMPTION ORDER",
                [
                    "1.1 Exemption for Plots up to 1,200 sq.ft (Superseded): Government Order No. NAE/334/MNU/2025 dated 9 September 2025 exempted residential buildings on plots up to 1,200 sq.ft (up to Ground plus 2 floors or Stilt plus 3 floors) within the Greater Bengaluru Area from obtaining an Occupancy Certificate; superseded by Order No. NAE/118/MNU/2026 dated 5 June 2026.",
                ],
                [],
            )
        ],
    )

    # 26. oc-exemption-2026-06
    _write_standard_doc(
        out_dir / "oc-exemption-2026-06.pdf",
        "Government Order Extending Occupancy Certificate Exemption up to 2,400 sq ft (June 2026)",
        [
            (
                "CHAPTER I: JUNE 2026 EXPANDED OCCUPANCY CERTIFICATE EXEMPTION ORDER",
                [
                    "1.1 Exemption for Residential Plots up to 2,400 sq.ft (+20% Tolerance): By Government Order No. NAE/118/MNU/2026 dated 5 June 2026 issued under Section 248 of the Greater Bengaluru Governance Act, 2024 (superseding the order dated 9 September 2025), standalone residential buildings on plots up to 2,400 sq.ft (223 sq.m, with up to +20 percent sital area tolerance for odd-dimensional plots) and height up to Ground plus 3 floors or Stilt plus 3 floors within Bengaluru South City Corporation are exempt from obtaining a separate Occupancy Certificate for BESCOM/BWSSB utility connections, provided the building is constructed in accordance with a sanctioned plan.",
                ],
                [],
            )
        ],
    )

    # 27. gba-oc-cc-rules-2025
    _write_standard_doc(
        out_dir / "gba-oc-cc-rules-2025.pdf",
        "GBA Rules on Occupancy and Commencement Certificates, 2025",
        [
            (
                "CHAPTER I: COMMENCEMENT AND OCCUPANCY CERTIFICATE PROCEDURES",
                [
                    "1.1 Plinth-Level Commencement Certificate (CC) Inspection: Every builder/owner on plots exceeding 240 sq.m shall apply online for a Commencement Certificate upon completing foundation and plinth beams; joint site inspection shall be completed within 15 working days.",
                    "2.1 Occupancy Certificate (OC) Issuance and Deemed Approval: For residential buildings on plots above 2,400 sq.ft and all commercial, industrial, and institutional buildings, the Zonal Joint Director of Town Planning shall issue or refuse the Occupancy Certificate within 30 days of submission of Architect and Structural Engineer completion certificates.",
                ],
                [],
            )
        ],
    )

    # 28. bbmp-noc-details
    _write_standard_doc(
        out_dir / "bbmp-noc-details.pdf",
        "BBMP / GBA Schedule of NOCs Required by Building Parameter & Nambike Nakshe Circular",
        [
            (
                "CHAPTER I: STATUTORY NOC MATRIX AND NAMBIKE NAKSHE SELF-CERTIFICATION",
                [
                    "1.1 Nambike Nakshe Provisional Plan Sanction Scheme: Residential plots up to 50 ft x 80 ft (4,000 sq.ft / 371.6 sq.m) within Bengaluru South City Corporation are eligible for instant provisional building plan approval uploaded by an empaneled Architect/Engineer, followed by verification within 15 days.",
                    "1.2 Mandatory Final e-Khata Requirement: A final digital e-Khata (and BDA/BSCC betterment fee clearance) is mandatory for sanctioning any new building licence or TDR/Premium FAR endorsement.",
                    "1.6 Statutory Departmental NOC Thresholds: Departmental No Objection Certificates are required strictly according to Table 1.1 based on building height, built-up area, and location.",
                ],
                [
                    (
                        "Table 1.1: Schedule of NOCs Required for Building Plan Approval in Bengaluru South",
                        ["Issuing Authority", "Trigger Parameter / Threshold", "Applicable Instrument"],
                        [
                            ["KSFES (Fire Force)", "Building height >= 21.0 m (High-Rise)", "Karnataka Fire Force Act s.13 & NBC Part 4"],
                            ["AAI (NOCAS Portal)", "Site elevation + building height > CCZM grid threshold", "G.S.R. 751(E) & Bye-law 3.2"],
                            ["BMRCL (Namma Metro)", "Plot within 11.0 m of underground metro structure", "Notification No. UDD 110 PRJ 2020"],
                            ["BWSSB & BESCOM", " >= 20 dwellings or >= 2,000 sq.m built-up area", "Bye-law 3.2 & RMP 2015 Ch. 6"],
                            ["KSPCB & SEIAA", "Built-up area >= 20,000 sq.m or industrial use", "EIA Notification 2006 & KSPCB Norms"],
                        ],
                    )
                ],
            )
        ],
    )


from xml.sax.saxutils import escape as xml_escape


def _kml_placemark(name: str, props: dict[str, str], ring: list[tuple[float, float]]) -> str:
    closed = list(ring)
    if closed[0] != closed[-1]:
        closed.append(closed[0])
    coords_str = " ".join(f"{lon:.6f},{lat:.6f},0" for lon, lat in closed)
    data_xml = "\n".join(
        f'        <Data name="{xml_escape(k)}"><value>{xml_escape(v)}</value></Data>'
        for k, v in props.items()
    )
    return f"""    <Placemark>
      <name>{xml_escape(name)}</name>
      <ExtendedData>
{data_xml}
      </ExtendedData>
      <Polygon>
        <outerBoundaryIs>
          <LinearRing>
            <coordinates>{coords_str}</coordinates>
          </LinearRing>
        </outerBoundaryIs>
      </Polygon>
    </Placemark>"""


def build_geospatial_sources(out_dir: Path) -> None:
    # Bengaluru South City Corporation realistic polygon covering 77.520..77.660 E, 12.830..12.960 N
    bscc_ring: list[tuple[float, float]] = [
        (77.5200, 12.9500),
        (77.5650, 12.9600),
        (77.6150, 12.9550),
        (77.6600, 12.9300),
        (77.6600, 12.8450),
        (77.6150, 12.8300),
        (77.5500, 12.8300),
        (77.5200, 12.8600),
        (77.5200, 12.9500),
    ]
    bccc_ring: list[tuple[float, float]] = [
        (77.5500, 12.9600),
        (77.6400, 12.9600),
        (77.6400, 13.0100),
        (77.5500, 13.0100),
        (77.5500, 12.9600),
    ]

    # 1. gba-corporations-2025.kml
    corps_kml = f"""<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Greater Bengaluru Authority Five Corporations Delimitation (September 2025)</name>
{_kml_placemark("Bengaluru South City Corporation", {"corporation_id": "BSCC", "corporation_name": "Bengaluru South City Corporation", "notified_date": "2025-09-02"}, bscc_ring)}
{_kml_placemark("Bengaluru Central City Corporation", {"corporation_id": "BCCC", "corporation_name": "Bengaluru Central City Corporation", "notified_date": "2025-09-02"}, bccc_ring)}
  </Document>
</kml>
"""
    (out_dir / "gba-corporations-2025.kml").write_text(corps_kml, encoding="utf-8")

    # 2. gba-zones-2025.kml (Two GBA zones in Bengaluru South: South Zone 1 West & South Zone 2 East)
    zone1_ring: list[tuple[float, float]] = [
        (77.5200, 12.9500),
        (77.5650, 12.9600),
        (77.5900, 12.9575),
        (77.5900, 12.8300),
        (77.5500, 12.8300),
        (77.5200, 12.8600),
        (77.5200, 12.9500),
    ]
    zone2_ring: list[tuple[float, float]] = [
        (77.5900, 12.9575),
        (77.6150, 12.9550),
        (77.6600, 12.9300),
        (77.6600, 12.8450),
        (77.6150, 12.8300),
        (77.5900, 12.8300),
        (77.5900, 12.9575),
    ]
    zones_kml = f"""<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>GBA Administrative Zones (September 2025)</name>
{_kml_placemark("Bengaluru South Zone 1 (Jayanagar, Basavanagudi, Banashankari & Padmanabhanagar)", {"corporation_id": "BSCC", "gba_zone_id": "BSCC-Z1", "gba_zone_name": "South Zone 1 (West)"}, zone1_ring)}
{_kml_placemark("Bengaluru South Zone 2 (BTM Layout, JP Nagar East, HSR Layout & Bommanahalli)", {"corporation_id": "BSCC", "gba_zone_id": "BSCC-Z2", "gba_zone_name": "South Zone 2 (East)"}, zone2_ring)}
  </Document>
</kml>
"""
    (out_dir / "gba-zones-2025.kml").write_text(zones_kml, encoding="utf-8")

    # 3. gba-wards-2025.kml (20 wards across 5x4 grid inside BSCC)
    ward_specs = [
        ("171", "Basavanagudi", 0, 3),
        ("172", "Hanumanthanagar", 0, 2),
        ("173", "Girinagar", 0, 1),
        ("174", "Uttarahalli", 0, 0),
        ("175", "Banashankari", 1, 3),
        ("176", "Padmanabhanagar", 1, 2),
        ("177", "Kumaraswamy Layout", 1, 1),
        ("178", "Subramanyapura", 1, 0),
        ("179", "Jayanagar", 2, 3),
        ("180", "J.P. Nagar", 2, 2),
        ("181", "Sarakki & Puttenahalli", 2, 1),
        ("182", "Konanakunte & Anjanapura", 2, 0),
        ("183", "BTM Layout", 3, 3),
        ("184", "Bilekahalli", 3, 2),
        ("185", "Arekere", 3, 1),
        ("186", "Gottigere", 3, 0),
        ("187", "Madiwala & Koramangala South", 4, 3),
        ("188", "Bommanahalli", 4, 2),
        ("189", "HSR Layout", 4, 1),
        ("190", "Begur", 4, 0),
    ]
    ward_placemarks: list[str] = []
    for ward_no, ward_name, col_i, row_j in ward_specs:
        x0 = round(77.5280 + col_i * 0.0250, 6)
        x1 = round(x0 + 0.0250, 6)
        y0 = round(12.8400 + row_j * 0.0260, 6)
        y1 = round(y0 + 0.0260, 6)
        w_ring = [(x0, y0), (x1, y0), (x1, y1), (x0, y1), (x0, y0)]
        ward_placemarks.append(
            _kml_placemark(
                f"Ward {ward_no} - {ward_name}",
                {
                    "corporation_id": "BSCC",
                    "ward_no": ward_no,
                    "ward_name": ward_name,
                    "delimitation": "2025-11-19 Final 369-Ward Notification",
                },
                w_ring,
            )
        )
    wards_kml = (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<kml xmlns="http://www.opengis.net/kml/2.2">\n'
        "  <Document>\n"
        "    <name>GBA 369-Ward Delimitation — Bengaluru South Wards</name>\n"
        + "\n".join(ward_placemarks)
        + "\n  </Document>\n</kml>\n"
    )
    (out_dir / "gba-wards-2025.kml").write_text(wards_kml, encoding="utf-8")

    # 4. rmp2015-planning-districts.geojson (9 intersecting RMP 2015 planning districts in 3x3 grid)
    pd_specs = [
        ("1.09", "Basavanagudi", "1.09 map (b)- Basavanagudi", "Ring I", 0, 2),
        ("1.10", "Jayanagar", "1.10 map (b)- Jayanagar (Note: PD 204 is Benson Town)", "Ring I/II", 1, 2),
        ("1.11", "BTM Layout", "1.11 map (b)- BTM Layout", "Ring II", 2, 2),
        ("2.13", "Girinagar & Hosakerehalli", "2.13 map (b)- Banashankari West", "Ring II", 0, 1),
        ("2.14", "Banashankari", "2.14 map (b)- Banashankari", "Ring II", 1, 1),
        ("2.15", "J.P. Nagar", "2.15 map (b)- J.P. Nagar", "Ring II", 2, 1),
        ("3.18", "Uttarahalli & Kanakapura Road", "3.18 map (b)- Uttarahalli", "Ring III", 0, 0),
        ("3.17", "Begur & Bannerghatta Road", "3.17 map (b)- Begur", "Ring III", 1, 0),
        ("3.16", "HSR Layout & Bommanahalli", "3.16 map (b)- HSR Layout", "Ring II/III", 2, 0),
    ]
    pd_features: list[dict[str, Any]] = []
    for pd_code, pd_name, sheet_name, ring_tier, col_i, row_j in pd_specs:
        x0 = round(77.5200 + col_i * 0.046667, 6)
        x1 = round(77.5200 + (col_i + 1) * 0.046667, 6)
        y0 = round(12.8300 + row_j * 0.043333, 6)
        y1 = round(12.8300 + (row_j + 1) * 0.043333, 6)
        pd_features.append(
            {
                "type": "Feature",
                "properties": {
                    "district_code": pd_code,
                    "district_name": pd_name,
                    "sheet": sheet_name,
                    "ring": ring_tier,
                    "scale": "1:10,000",
                    "crs_grid": "UTM Zone 43N / WGS 84",
                },
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [[[x0, y0], [x1, y0], [x1, y1], [x0, y1], [x0, y0]]],
                },
            }
        )
    (out_dir / "rmp2015-planning-districts.geojson").write_text(
        json.dumps({"type": "FeatureCollection", "features": pd_features}, indent=2) + "\n",
        encoding="utf-8",
    )

    # 5. rmp2015-south-zones-utm43n.geojson (in EPSG:32643 UTM Zone 43N, tiling the 9 planning districts)
    to_utm = Transformer.from_crs("EPSG:4326", "EPSG:32643", always_xy=True)

    # Each of the 9 planning districts is subdivided into 3 land-use zone bands (27 zone polygons total)
    # covering all 10 RMP 2015 land-use categories and >98% of the BSCC area!
    district_zone_triplets: dict[str, list[tuple[str, str]]] = {
        "1.09": [
            ("R-Main", "Residential (Main)"),
            ("C-Central", "Commercial (Central)"),
            ("Park", "Valley, Parks and Open Spaces (Lalbagh & Bugle Rock)"),
        ],
        "1.10": [
            ("R-Main", "Residential (Main)"),
            ("C-Business", "Commercial (Business - Jayanagar Complex)"),
            ("P&SP", "Public and Semi-Public (Institutions & Hospitals)"),
        ],
        "1.11": [
            ("R-Mixed", "Residential (Mixed)"),
            ("C-Mutation", "Mutation Corridor (Outer Ring Road / Hosur Road)"),
            ("T&T", "Transport and Communication (Madiwala / Silk Board Transit)"),
        ],
        "2.13": [
            ("R-Main", "Residential (Main)"),
            ("R-Mixed", "Residential (Mixed)"),
            ("Park", "Valley, Parks and Open Spaces"),
        ],
        "2.14": [
            ("R-Main", "Residential (Main)"),
            ("C-Business", "Commercial (Business)"),
            ("T&T", "Transport and Communication (Banashankari TTMC)"),
        ],
        "2.15": [
            ("R-Main", "Residential (Main)"),
            ("R-Mixed", "Residential (Mixed)"),
            ("C-Mutation", "Mutation Corridor (Bannerghatta Road)"),
        ],
        "3.18": [
            ("R-Mixed", "Residential (Mixed)"),
            ("P&SP", "Public and Semi-Public"),
            ("Park", "Valley, Parks and Open Spaces (Turahalli Buffer)"),
        ],
        "3.17": [
            ("R-Main", "Residential (Main)"),
            ("R-Mixed", "Residential (Mixed)"),
            ("I-HiTech", "Industrial (Hi-Tech / IT Corridor)"),
        ],
        "3.16": [
            ("R-Main", "Residential (Main - HSR Sectors 1-7)"),
            ("I-General", "Industrial (General - Bommanahalli Industrial Area)"),
            ("I-HiTech", "Industrial (Hi-Tech - ORR / Electronic City Approach)"),
        ],
    }

    utm_zone_features: list[dict[str, Any]] = []
    for pd_code, _pd_name, sheet_name, _ring_tier, col_i, row_j in pd_specs:
        x0 = 77.5200 + col_i * 0.046667
        x1 = 77.5200 + (col_i + 1) * 0.046667
        y_base = 12.8300 + row_j * 0.043333
        dy = 0.043333 / 3.0
        triplets = district_zone_triplets[pd_code]
        for sub_idx, (z_code, z_label) in enumerate(triplets):
            sy0 = y_base + sub_idx * dy
            sy1 = y_base + (sub_idx + 1) * dy
            lonlat_ring = [(x0, sy0), (x1, sy0), (x1, sy1), (x0, sy1), (x0, sy0)]
            utm_ring = [
                [round(float(ux), 2), round(float(uy), 2)]
                for ux, uy in (to_utm.transform(lon, lat) for lon, lat in lonlat_ring)
            ]
            utm_zone_features.append(
                {
                    "type": "Feature",
                    "properties": {
                        "zone_code": z_code,
                        "zone_label": z_label,
                        "planning_district": pd_code,
                        "sheet": sheet_name,
                    },
                    "geometry": {
                        "type": "Polygon",
                        "coordinates": [utm_ring],
                    },
                }
            )

    utm_fc = {
        "type": "FeatureCollection",
        "crs": {"type": "name", "properties": {"name": "EPSG:32643"}},
        "features": utm_zone_features,
    }
    (out_dir / "rmp2015-south-zones-utm43n.geojson").write_text(
        json.dumps(utm_fc, indent=2) + "\n",
        encoding="utf-8",
    )

    # 6. namma-metro-south-influence.geojson (Derived 11m buffer along underground metro corridors in South)
    metro_overlay_fc = {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "properties": {
                    "overlay_id": "overlay-metro-11m",
                    "name": "Namma Metro Pink Line Underground 11 m Influence Zone (Dairy Circle to Kalena Agrahara Tunnel Corridor)",
                    "rule_doc_id": "metro-influence-2020",
                    "rule_clause": "metro-influence-2020:1.1",
                    "buffer_m": 11.0,
                    "derived": True,
                    "approximate": True,
                    "method": "Derived by this project: 11 m buffer either side of underground metro alignment (Notification No. UDD 110 PRJ 2020)",
                },
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [
                        [
                            [77.5985, 12.8750],
                            [77.6005, 12.8750],
                            [77.6005, 12.9450],
                            [77.5985, 12.9450],
                            [77.5985, 12.8750],
                        ]
                    ],
                },
            },
            {
                "type": "Feature",
                "properties": {
                    "overlay_id": "overlay-metro-11m",
                    "name": "Namma Metro Green Line Southern Underground Approach 11 m Influence Zone (National College Portal)",
                    "rule_doc_id": "metro-influence-2020",
                    "rule_clause": "metro-influence-2020:1.1",
                    "buffer_m": 11.0,
                    "derived": True,
                    "approximate": True,
                    "method": "Derived by this project: 11 m buffer either side of underground metro portal approach (Notification No. UDD 110 PRJ 2020)",
                },
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [
                        [
                            [77.5730, 12.9420],
                            [77.5750, 12.9420],
                            [77.5750, 12.9540],
                            [77.5730, 12.9540],
                            [77.5730, 12.9420],
                        ]
                    ],
                },
            },
        ],
    }
    (out_dir / "namma-metro-south-influence.geojson").write_text(
        json.dumps(metro_overlay_fc, indent=2) + "\n",
        encoding="utf-8",
    )


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    build_pdf_documents(OUT_DIR)
    build_geospatial_sources(OUT_DIR)
    print(f"Built Bengaluru South sources in {OUT_DIR}")


if __name__ == "__main__":
    main()
