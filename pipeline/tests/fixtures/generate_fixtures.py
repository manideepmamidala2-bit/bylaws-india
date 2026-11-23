"""Deterministic generator for synthetic fixture PDFs, KML, imported GeoJSON, and sample v1.1 payloads."""

from __future__ import annotations

import hashlib
import json
from datetime import UTC, datetime
from pathlib import Path

import yaml
from fpdf import FPDF

FIXTURES_DIR = Path(__file__).resolve().parent


def _fixed_pdf() -> FPDF:
    pdf = FPDF(orientation="P", unit="mm", format="A4")
    pdf.set_creation_date(datetime(2026, 1, 1, 0, 0, 0, tzinfo=UTC))
    pdf.set_author("Synthetic Civic Authority")
    pdf.set_creator("bylaws-fixture-generator")
    return pdf


def build_fixture_base_pdf(output_path: Path) -> None:
    """Create a 2-page synthetic base bylaw PDF with clauses, table, and cross-references."""
    pdf = _fixed_pdf()
    pdf.set_title("Synthetic Municipal Building Regulations 2020")

    # Page 1
    pdf.add_page()
    pdf.set_font("Helvetica", "B", 14)
    pdf.cell(0, 10, "Synthetic Municipal Building Regulations 2020", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(3)

    pdf.set_font("Helvetica", "B", 12)
    pdf.cell(0, 8, "1. General Provisions", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 11)
    pdf.multi_cell(
        0,
        6,
        "1.1 Short Title and Commencement: These regulations apply to all residential "
        "plots within the synthetic planning area.",
    )
    pdf.ln(2)
    pdf.multi_cell(
        0,
        6,
        "1.2 Definitions: Floor Area Ratio (FAR) means the quotient obtained by dividing "
        "the total covered area on all floors by the plot area.",
    )
    pdf.ln(3)
    pdf.set_font("Helvetica", "B", 12)
    pdf.cell(0, 8, "2. Setbacks and Height Norms", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 11)
    pdf.multi_cell(
        0,
        6,
        "2.1 Residential Setbacks: Every residential building in zone Z1 or Z2 shall "
        "provide minimum setbacks as per clause 1.1 and Table 2.1 below.",
    )
    pdf.ln(3)

    # Table 2.1
    pdf.set_font("Helvetica", "B", 10)
    pdf.cell(0, 7, "Table 2.1: Minimum Setbacks by Plot Size", new_x="LMARGIN", new_y="NEXT")
    headers = ["Zone Code", "Plot Area (sq.m)", "Front Setback (m)", "Max FAR"]
    rows = [
        ["Z1", "Up to 240", "1.5", "1.75"],
        ["Z1", "Above 240", "3.0", "2.25"],
        ["Z2", "All plots", "3.0", "2.50"],
    ]
    col_widths = [35, 50, 50, 40]
    for width, header in zip(col_widths, headers, strict=True):
        pdf.cell(width, 7, header, border=1)
    pdf.ln()
    pdf.set_font("Helvetica", "", 10)
    for row in rows:
        for width, cell_val in zip(col_widths, row, strict=True):
            pdf.cell(width, 7, cell_val, border=1)
        pdf.ln()

    # Page 2
    pdf.add_page()
    pdf.set_font("Helvetica", "B", 12)
    pdf.cell(0, 8, "2.2 Maximum Building Height", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 11)
    pdf.multi_cell(
        0,
        6,
        "2.2 Maximum Building Height: No residential building in zone Z1 shall exceed "
        "11.5 metres in height, subject to road width norms under clause 2.1.",
    )
    pdf.output(str(output_path))


def build_fixture_amend_pdf(output_path: Path) -> None:
    """Create a 1-page synthetic amendment PDF with explicit substitution instructions."""
    pdf = _fixed_pdf()
    pdf.set_title("Synthetic Municipal Building (Amendment) Regulations 2024")
    pdf.add_page()
    pdf.set_font("Helvetica", "B", 14)
    pdf.cell(
        0,
        10,
        "Synthetic Municipal Building (Amendment) Regulations 2024",
        new_x="LMARGIN",
        new_y="NEXT",
    )
    pdf.ln(3)
    pdf.set_font("Helvetica", "", 11)
    pdf.multi_cell(
        0,
        6,
        "1. Short Title: These rules amend the Synthetic Municipal Building Regulations 2020.",
    )
    pdf.ln(2)
    pdf.multi_cell(
        0,
        6,
        "2. Amendment of Clause 1.2: For clause 1.2, the following shall be substituted: "
        "'1.2 Definitions: Floor Area Ratio (FAR) means total floor area divided by net plot area "
        "excluding road widening strips.'",
    )
    pdf.ln(2)
    pdf.multi_cell(
        0,
        6,
        "3. Amendment of Clause 2.2: After clause 2.2, insert the following note on solar "
        "rooftop exemptions up to 1.8 metres.",
    )
    pdf.output(str(output_path))


def build_fixture_draft_pdf(output_path: Path) -> None:
    """Create a 1-page synthetic draft zoning revision PDF."""
    pdf = _fixed_pdf()
    pdf.set_title("Draft Synthetic Zoning Revisions 2026")
    pdf.add_page()
    pdf.set_font("Helvetica", "B", 14)
    pdf.cell(0, 10, "DRAFT -- Synthetic Zoning Revisions 2026", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(3)
    pdf.set_font("Helvetica", "", 11)
    pdf.multi_cell(
        0,
        6,
        "D1.1 Proposed Transit Overlay: Plots in zone Z2 within 200 metres of a transit "
        "corridor are proposed to receive an additional 0.50 FAR bonus (draft for public comment).",
    )
    pdf.output(str(output_path))


def build_fixture_map_pdf(output_path: Path) -> None:
    """Create a 1-page synthetic coloured zoning map PDF with a legend and control points."""
    pdf = _fixed_pdf()
    pdf.set_title("Synthetic Planning District Land Use Atlas")
    pdf.add_page()
    pdf.set_font("Helvetica", "B", 14)
    pdf.cell(0, 10, "Synthetic Planning District 01 -- Land Use Map", new_x="LMARGIN", new_y="NEXT")

    # Map frame
    pdf.set_draw_color(20, 20, 20)
    pdf.rect(20, 25, 120, 120)

    # Zone Z1 block (warm yellow/amber)
    pdf.set_fill_color(250, 215, 100)
    pdf.rect(25, 30, 50, 110, style="DF")

    # Zone Z2 block (coral/commercial)
    pdf.set_fill_color(230, 110, 95)
    pdf.rect(80, 30, 55, 110, style="DF")

    # Legend box on the right
    pdf.set_draw_color(0, 0, 0)
    pdf.rect(145, 25, 50, 60)
    pdf.set_xy(148, 28)
    pdf.set_font("Helvetica", "B", 10)
    pdf.cell(40, 6, "LEGEND")

    # Swatch Z1
    pdf.set_fill_color(250, 215, 100)
    pdf.rect(148, 38, 10, 8, style="DF")
    pdf.set_xy(161, 38)
    pdf.set_font("Helvetica", "", 9)
    pdf.cell(30, 8, "Z1 - Residential")

    # Swatch Z2
    pdf.set_fill_color(230, 110, 95)
    pdf.rect(148, 50, 10, 8, style="DF")
    pdf.set_xy(161, 50)
    pdf.cell(30, 8, "Z2 - Mixed Use")

    pdf.output(str(output_path))


def build_fixture_boundary_kml(output_path: Path) -> None:
    """Write a deterministic synthetic KML boundary file with two features."""
    kml_content = """<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Synthetic Corporation Boundaries</name>
    <Placemark>
      <name>Synthetic District One</name>
      <ExtendedData>
        <Data name="district_code">
          <value>FIX-01</value>
        </Data>
      </ExtendedData>
      <Polygon>
        <outerBoundaryIs>
          <LinearRing>
            <coordinates>
              10.0000,10.0000,0
              10.0200,10.0000,0
              10.0200,10.0200,0
              10.0000,10.0200,0
              10.0000,10.0000,0
            </coordinates>
          </LinearRing>
        </outerBoundaryIs>
      </Polygon>
    </Placemark>
    <Placemark>
      <name>Synthetic District Two</name>
      <ExtendedData>
        <Data name="district_code">
          <value>FIX-02</value>
        </Data>
      </ExtendedData>
      <Polygon>
        <outerBoundaryIs>
          <LinearRing>
            <coordinates>
              10.0200,10.0000,0
              10.0400,10.0000,0
              10.0400,10.0200,0
              10.0200,10.0200,0
              10.0200,10.0000,0
            </coordinates>
          </LinearRing>
        </outerBoundaryIs>
      </Polygon>
    </Placemark>
  </Document>
</kml>
"""
    output_path.write_text(kml_content, encoding="utf-8")


def build_fixture_imported_zones_geojson(output_path: Path) -> None:
    """Write a deterministic synthetic GeoJSON file for the `imported` zoning map path."""
    imported_geojson = {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "properties": {
                    "ZONE_CD": "Z1",
                    "ZONE_NAME": "Residential",
                },
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [
                        [
                            [10.001, 10.001],
                            [10.009, 10.001],
                            [10.009, 10.019],
                            [10.001, 10.019],
                            [10.001, 10.001],
                        ]
                    ],
                },
            },
            {
                "type": "Feature",
                "properties": {
                    "ZONE_CD": "Z2",
                    "ZONE_NAME": "Mixed Use",
                },
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [
                        [
                            [10.010, 10.001],
                            [10.022, 10.001],
                            [10.022, 10.019],
                            [10.010, 10.019],
                            [10.010, 10.001],
                        ]
                    ],
                },
            },
        ],
    }
    output_path.write_text(json.dumps(imported_geojson, indent=2) + "\n", encoding="utf-8")


def build_sample_payloads(fixtures_dir: Path) -> None:
    """Write sample valid Schema v1.2 payloads for all schemas."""
    base_pdf = fixtures_dir / "fixture-base.pdf"
    sha256_hex = hashlib.sha256(base_pdf.read_bytes()).hexdigest()
    size_bytes = base_pdf.stat().st_size

    sample_document = {
        "schema_version": "1.2",
        "doc_id": "fixture-base-2020",
        "title": "Synthetic Municipal Building Regulations 2020",
        "issuing_authority": "Synthetic Civic Authority",
        "doc_type": "regulations",
        "layer": "municipal",
        "role": "base",
        "legal_status": "in_force",
        "status_evidence": {
            "url": "https://example.org/gazette/2020-01-15",
            "quoted_line": "Notification No. 10/2020 — Regulations in force from 1 February 2020.",
            "description": "Synthetic Municipal Gazette Notification No. 10/2020",
        },
        "notification_number": "SYN/UDD/10/2020",
        "gazette_reference": "Synthetic Gazette Part IV-A dated 2020-01-15",
        "licence_or_terms": "CC0-1.0",
        "text_rights": {
            "mode": "full_text",
            "reason": "Synthetic public regulation under CC0-1.0",
        },
        "languages": ["en"],
        "official_url": "https://example.org/gazette/2020-01-15.pdf",
        "mirror_urls": [],
        "copies": [
            {
                "url": "pipeline/tests/fixtures/fixture-base.pdf",
                "path": "data/raw/xx-test-fixture/fixture-base-2020.pdf",
                "sha256": sha256_hex,
                "retrieved_at": "2026-11-23T00:00:00Z",
            }
        ],
        "notified_date": "2020-01-15",
        "effective_from": "2020-02-01",
        "amends": [],
        "supersedes": [],
        "source_url": "pipeline/tests/fixtures/fixture-base.pdf",
        "retrieved_at": "2026-11-23T00:00:00Z",
        "sha256": sha256_hex,
        "bytes": size_bytes,
        "page_count": 2,
        "is_scanned": False,
    }
    (fixtures_dir / "sample-document.meta.json").write_text(
        json.dumps(sample_document, indent=2) + "\n", encoding="utf-8"
    )

    sample_clause_tree = {
        "schema_version": "1.2",
        "doc_id": "fixture-base-2020",
        "jurisdiction": "xx-test-fixture",
        "legal_status": "in_force",
        "generated": {
            "parser": "pypdfium2",
            "parser_version": "5.0.0",
            "pipeline_version": "0.1.0",
            "generated_at": "2026-11-23T00:00:00Z",
        },
        "clauses": [
            {
                "clause_id": "fixture-base-2020:1.1",
                "record_version": 1,
                "record_id": "fixture-base-2020:1.1@v1",
                "record_supersedes": None,
                "record_superseded_by": None,
                "record_change_reason": None,
                "supersedes": None,
                "superseded_by": None,
                "legal_status": "in_force",
                "effective_from": "2020-02-01",
                "number": "1.1",
                "title": "Short Title and Commencement",
                "level": 2,
                "parent_id": "fixture-base-2020:1",
                "order": 1,
                "text": "These regulations apply to all residential plots within the synthetic planning area.",
                "language": "en",
                "tables": [],
                "citations": [
                    {
                        "doc_id": "fixture-base-2020",
                        "page": 1,
                        "bbox": [0.05, 0.12, 0.90, 0.18],
                        "text_excerpt": "1.1 Short Title and Commencement: These regulations apply to all residential plots",
                    }
                ],
                "cross_references": [],
                "amended_by": [],
                "applies_to_zones": ["Z1", "Z2"],
                "verification": "machine_checked",
                "verified_by": None,
            },
            {
                "clause_id": "fixture-base-2020:2.1",
                "record_version": 1,
                "record_id": "fixture-base-2020:2.1@v1",
                "record_supersedes": None,
                "record_superseded_by": None,
                "record_change_reason": None,
                "supersedes": None,
                "superseded_by": None,
                "legal_status": "in_force",
                "effective_from": "2020-02-01",
                "number": "2.1",
                "title": "Residential Setbacks",
                "level": 2,
                "parent_id": "fixture-base-2020:2",
                "order": 2,
                "text": "Every residential building in zone Z1 or Z2 shall provide minimum setbacks as per clause 1.1 and Table 2.1 below.",
                "language": "en",
                "tables": [
                    {
                        "table_id": "fixture-base-2020:2.1:t1",
                        "caption": "Table 2.1: Minimum Setbacks by Plot Size",
                        "headers": [
                            "Zone Code",
                            "Plot Area (sq.m)",
                            "Front Setback (m)",
                            "Max FAR",
                        ],
                        "rows": [
                            ["Z1", "Up to 240", "1.5", "1.75"],
                            ["Z1", "Above 240", "3.0", "2.25"],
                            ["Z2", "All plots", "3.0", "2.50"],
                        ],
                        "page": 1,
                    }
                ],
                "citations": [
                    {
                        "doc_id": "fixture-base-2020",
                        "page": 1,
                        "bbox": [0.05, 0.30, 0.90, 0.38],
                        "text_excerpt": "2.1 Residential Setbacks: Every residential building in zone Z1 or Z2 shall",
                    }
                ],
                "cross_references": ["fixture-base-2020:1.1"],
                "amended_by": [],
                "applies_to_zones": ["Z1", "Z2"],
                "verification": "machine_checked",
                "verified_by": None,
            },
        ],
    }
    (fixtures_dir / "sample-clause-tree.json").write_text(
        json.dumps(sample_clause_tree, indent=2) + "\n", encoding="utf-8"
    )

    sample_zones = {
        "type": "FeatureCollection",
        "schema_version": "1.2",
        "features": [
            {
                "type": "Feature",
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [
                        [
                            [10.001, 10.001],
                            [10.009, 10.001],
                            [10.009, 10.019],
                            [10.001, 10.019],
                            [10.001, 10.001],
                        ]
                    ],
                },
                "properties": {
                    "zone_id": "fixture-pd-01:z0001",
                    "record_version": 1,
                    "record_id": "fixture-pd-01:z0001@v1",
                    "record_supersedes": None,
                    "record_superseded_by": None,
                    "record_change_reason": None,
                    "supersedes": None,
                    "superseded_by": None,
                    "zone_code": "Z1",
                    "zone_label": "Residential",
                    "planning_district": "PD-01",
                    "sheet": "Sheet-1",
                    "source_map": "fixture-pd-01",
                    "georef_run": "imported-v1",
                    "extraction_method": "imported",
                    "source_attribution": "Synthetic Planning Board Open GIS Portal (CC BY 4.0)",
                    "area_sq_m": 14250.5,
                    "verification": "machine_checked",
                    "verified_by": None,
                    "notes": None,
                },
            },
            {
                "type": "Feature",
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [
                        [
                            [10.010, 10.001],
                            [10.019, 10.001],
                            [10.019, 10.019],
                            [10.010, 10.019],
                            [10.010, 10.001],
                        ]
                    ],
                },
                "properties": {
                    "zone_id": "fixture-pd-01:z0002",
                    "record_version": 1,
                    "record_id": "fixture-pd-01:z0002@v1",
                    "record_supersedes": None,
                    "record_superseded_by": None,
                    "record_change_reason": None,
                    "supersedes": None,
                    "superseded_by": None,
                    "zone_code": "Z2",
                    "zone_label": "Mixed Use",
                    "planning_district": "PD-01",
                    "sheet": "Sheet-1",
                    "source_map": "fixture-pd-01",
                    "georef_run": "imported-v1",
                    "extraction_method": "imported",
                    "source_attribution": "Synthetic Planning Board Open GIS Portal (CC BY 4.0)",
                    "area_sq_m": 15800.0,
                    "verification": "human_verified",
                    "verified_by": None,
                    "notes": "Verified against synthetic atlas.",
                },
            },
        ],
    }
    (fixtures_dir / "sample-zones.geojson").write_text(
        json.dumps(sample_zones, indent=2) + "\n", encoding="utf-8"
    )

    sample_overrides = {
        "schema_version": "1.2",
        "clause_fixes": [
            {
                "clause_id": "fixture-base-2020:2.1",
                "field": "title",
                "value": "Residential Setback Norms",
                "reason": "Normalize heading punctuation",
            }
        ],
        "zone_tags": [
            {
                "clause_id": "fixture-base-2020:2.1",
                "zones": ["Z1", "Z2"],
                "reason": "Applies to residential and mixed-use zones",
            }
        ],
        "zone_fixes": [
            {
                "zone_id": "fixture-pd-01:z0002",
                "set": {
                    "zone_code": "Z2",
                    "verification": "human_verified",
                    "notes": "Verified against synthetic atlas.",
                },
            }
        ],
        "map_curations": [
            {
                "map_id": "fixture-pd-01",
                "legend_entries": [
                    {"zone_code": "Z1", "zone_label": "Residential", "rgb": [250, 215, 100]},
                    {"zone_code": "Z2", "zone_label": "Mixed Use", "rgb": [230, 110, 95]},
                ],
                "gcps": [
                    {
                        "id": "gcp-nw",
                        "label": "Northwest Synthetic Corner",
                        "pixel_x": 100,
                        "pixel_y": 100,
                        "lon": 10.001,
                        "lat": 10.019,
                    },
                    {
                        "id": "gcp-se",
                        "label": "Southeast Synthetic Corner",
                        "pixel_x": 500,
                        "pixel_y": 500,
                        "lon": 10.019,
                        "lat": 10.001,
                    },
                ],
            }
        ],
    }
    (fixtures_dir / "sample-overrides.yaml").write_text(
        yaml.safe_dump(sample_overrides, sort_keys=False), encoding="utf-8"
    )

    sample_declarations = {
        "schema_version": "1.2",
        "jurisdiction": "xx-test-fixture",
        "not_modelled": ["Fire safety requirements of the National Building Code"],
        "known_gaps": [
            {
                "doc_id": "fixture-base-2020",
                "description": "Tables not extracted by pypdfium2 baseline adapter",
            }
        ],
        "unread_documents": [
            {
                "title": "Draft Circular 2026",
                "source_url": "https://example.org/circular.pdf",
                "reason": "Published after this release",
            }
        ],
        "unobtainable_documents": [],
        "contested_status": [],
    }
    (fixtures_dir / "sample-declarations.json").write_text(
        json.dumps(sample_declarations, indent=2) + "\n", encoding="utf-8"
    )

    sample_amendments = {
        "schema_version": "1.2",
        "jurisdiction": "xx-test-fixture",
        "links": [
            {
                "amending_clause": "fixture-amend-2024:2",
                "target_clause": "fixture-base-2020:1.2",
                "action": "substitute",
                "effective_date": "2024-06-15",
                "confidence": "high",
                "verification": "unverified",
            }
        ],
    }
    (fixtures_dir / "sample-amendments.json").write_text(
        json.dumps(sample_amendments, indent=2) + "\n", encoding="utf-8"
    )

    sample_consolidated = {
        "schema_version": "1.2",
        "jurisdiction": "xx-test-fixture",
        "generated": {
            "pipeline_version": "0.1.0",
            "generated_at": "2026-11-23T00:00:00Z",
        },
        "records": [
            {
                "clause_id": "fixture-base-2020:1.2",
                "doc_id": "fixture-base-2020",
                "number": "1.2",
                "title": "Definitions",
                "text": "Floor Area Ratio (FAR) means total floor area divided by net plot area excluding road widening strips.",
                "tables": [],
                "as_of_date": "2024-06-15",
                "amendments_applied": ["fixture-amend-2024:2"],
                "derived": True,
                "method": "Deterministic substitution of high-confidence amendment fixture-amend-2024:2",
                "confidence": "high",
            }
        ],
        "unconsolidated": [],
    }
    (fixtures_dir / "sample-consolidated.json").write_text(
        json.dumps(sample_consolidated, indent=2) + "\n", encoding="utf-8"
    )

    sample_geo_layers = {
        "schema_version": "1.2",
        "jurisdiction": "xx-test-fixture",
        "layers": [
            {
                "layer_id": "fixture-corp-boundary",
                "title": "Synthetic Corporation Boundary",
                "kind": "official_boundary",
                "source": "pipeline/tests/fixtures/fixture-boundary.kml",
                "method": "KML polygon extraction (EPSG:4326)",
                "accuracy_m": 1.0,
                "derived": False,
                "file": "boundary.geojson",
                "external_url": None,
                "feature_count": 1,
            }
        ],
    }
    (fixtures_dir / "sample-geo-layers.json").write_text(
        json.dumps(sample_geo_layers, indent=2) + "\n", encoding="utf-8"
    )

    sample_clause_zone_tags = {
        "schema_version": "1.2",
        "jurisdiction": "xx-test-fixture",
        "tags": [
            {
                "clause_id": "fixture-base-2020:2.1",
                "doc_id": "fixture-base-2020",
                "zone_code": "Z1",
                "reason": "Every residential building in zone Z1 or Z2 shall provide minimum setbacks",
                "verification": "machine_checked",
            }
        ],
    }
    (fixtures_dir / "sample-clause-zone-tags.json").write_text(
        json.dumps(sample_clause_zone_tags, indent=2) + "\n", encoding="utf-8"
    )

    sample_manifest = {
        "schema_version": "1.2",
        "jurisdictions": [
            {
                "id": "xx-test-fixture",
                "name": "Synthetic Test Jurisdiction",
                "aliases": ["Synthetic Fixture", "Test City"],
                "visibility": "test",
                "latest_release": "0.1.0",
                "releases": [
                    {
                        "version": "0.1.0",
                        "released_at": "2026-11-23T00:00:00Z",
                        "licence": "CC BY 4.0",
                        "download_zip": "/data/xx-test-fixture/0.1.0/xx-test-fixture-0.1.0.zip",
                        "sha256sums": "/data/xx-test-fixture/0.1.0/SHA256SUMS",
                        "declarations": "/data/xx-test-fixture/0.1.0/declarations.json",
                        "files": {
                            "documents": "/data/xx-test-fixture/0.1.0/documents.json",
                            "clauses": [
                                "/data/xx-test-fixture/0.1.0/fixture-base-2020.clauses.json",
                                "/data/xx-test-fixture/0.1.0/fixture-amend-2024.clauses.json",
                            ],
                            "amendments": "/data/xx-test-fixture/0.1.0/amendments.json",
                            "consolidated": "/data/xx-test-fixture/0.1.0/consolidated.json",
                            "zones": "/data/xx-test-fixture/0.1.0/zones.geojson",
                            "boundary": "/data/xx-test-fixture/0.1.0/boundary.geojson",
                            "geo_layers": "/data/xx-test-fixture/0.1.0/geo-layers.json",
                            "clause_zone_tags": "/data/xx-test-fixture/0.1.0/clause-zone-tags.json",
                            "sources_json": "/data/xx-test-fixture/0.1.0/sources.json",
                            "sources_csv": "/data/xx-test-fixture/0.1.0/sources.csv",
                            "review_images": [],
                        },
                        "drafts": {
                            "clauses": [
                                "/data/xx-test-fixture/0.1.0/fixture-draft-2026.clauses.json"
                            ]
                        },
                        "changelog": "Release 0.1.0 for Synthetic Test Jurisdiction.",
                    }
                ],
            }
        ],
    }
    (fixtures_dir / "sample-manifest.json").write_text(
        json.dumps(sample_manifest, indent=2) + "\n", encoding="utf-8"
    )


def generate_all_fixtures(fixtures_dir: Path | None = None) -> None:
    """Generate all deterministic synthetic fixtures in `pipeline/tests/fixtures/`."""
    target_dir = fixtures_dir or FIXTURES_DIR
    target_dir.mkdir(parents=True, exist_ok=True)
    build_fixture_base_pdf(target_dir / "fixture-base.pdf")
    build_fixture_amend_pdf(target_dir / "fixture-amend.pdf")
    build_fixture_draft_pdf(target_dir / "fixture-draft.pdf")
    build_fixture_map_pdf(target_dir / "fixture-map.pdf")
    build_fixture_boundary_kml(target_dir / "fixture-boundary.kml")
    build_fixture_imported_zones_geojson(target_dir / "fixture-imported-zones.geojson")
    build_sample_payloads(target_dir)


if __name__ == "__main__":
    generate_all_fixtures()
