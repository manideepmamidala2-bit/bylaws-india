"""Generate a purely synthetic test jurisdiction (`xx-synthetic-city`) for offline pipeline testing.

This script exists strictly for test fixtures (`visibility: test`) and contains zero references
to any real authority, city, place, or external URL (Rule R16).
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import yaml
from fpdf import FPDF


def _write_synthetic_pdf(
    out_path: Path,
    *,
    title: str,
    clauses: list[tuple[str, str, str]],
) -> None:
    pdf = FPDF()
    pdf.set_title(title)
    pdf.set_author("Synthetic Test Suite")
    pdf.set_creator("SyntheticJurisdictionBuilder")
    pdf.add_page()
    pdf.set_font("Helvetica", style="B", size=13)
    pdf.multi_cell(0, 8, text=title)
    pdf.ln(3)
    pdf.set_font("Helvetica", size=10)
    for num, heading, body in clauses:
        pdf.set_font("Helvetica", style="B", size=10)
        pdf.multi_cell(0, 6, text=f"{num} {heading}")
        pdf.set_font("Helvetica", size=10)
        pdf.multi_cell(0, 5.5, text=body)
        pdf.ln(2)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_bytes(bytes(pdf.output()))


def build_synthetic_jurisdiction(output_root: Path) -> dict[str, Any]:
    """Generate `xx-synthetic-city` test fixture files under `output_root`."""
    jur_id = "xx-synthetic-city"
    sources_dir = output_root / "sources" / jur_id
    sources_dir.mkdir(parents=True, exist_ok=True)

    _write_synthetic_pdf(
        sources_dir / "synth-bbl-2020.pdf",
        title="Synthetic Municipal Building Bye-laws 2020",
        clauses=[
            (
                "1.0",
                "Short Title and Commencement",
                "These synthetic building bye-laws apply solely to the synthetic test city fixture.",
            ),
            (
                "2.0",
                "Minimum Setbacks",
                "Every residential building in the synthetic test city shall maintain a minimum front setback of 3.0 m.",
            ),
        ],
    )

    _write_synthetic_pdf(
        sources_dir / "synth-bbl-amend-2024.pdf",
        title="Synthetic Municipal Building (Amendment) Bye-laws 2024",
        clauses=[
            (
                "1.0",
                "Amendment of Clause 2.0",
                'For Clause 2.0 of the Synthetic Municipal Building Bye-laws 2020, substitute: "Every residential building shall maintain a minimum front setback of 2.5 m."',
            ),
        ],
    )

    boundary_kml = """<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <Placemark>
      <ExtendedData>
        <SimpleData name="city_code">SYN-CITY-01</SimpleData>
      </ExtendedData>
      <Polygon>
        <outerBoundaryIs>
          <LinearRing>
            <coordinates>
              10.00,10.00,0 10.04,10.00,0 10.04,10.04,0 10.00,10.04,0 10.00,10.00,0
            </coordinates>
          </LinearRing>
        </outerBoundaryIs>
      </Polygon>
    </Placemark>
  </Document>
</kml>
"""
    (sources_dir / "synth-boundary.kml").write_text(boundary_kml, encoding="utf-8")

    zones_geojson = {
        "type": "FeatureCollection",
        "crs": {"type": "name", "properties": {"name": "EPSG:4326"}},
        "features": [
            {
                "type": "Feature",
                "properties": {
                    "ZONE_CD": "SYN-R1",
                    "ZONE_NAME": "Synthetic Residential Zone 1",
                },
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [
                        [
                            [10.00, 10.00],
                            [10.02, 10.00],
                            [10.02, 10.02],
                            [10.00, 10.02],
                            [10.00, 10.00],
                        ]
                    ],
                },
            }
        ],
    }
    (sources_dir / "synth-zones.geojson").write_text(
        json.dumps(zones_geojson, indent=2) + "\n",
        encoding="utf-8",
    )

    config_payload: dict[str, Any] = {
        "schema_version": "1.2",
        "id": jur_id,
        "name": "Synthetic Demonstration City",
        "aliases": ["Synthetic City", "Test Demonstration City"],
        "visibility": "test",
        "licence": "CC BY 4.0",
        "release_version": "0.1.0",
        "country": "XX",
        "state": "YY",
        "building_types": ["residential", "commercial"],
        "parents": [],
        "not_modelled": [],
        "documents": [
            {
                "id": "synth-bbl-2020",
                "title": "Synthetic Municipal Building Bye-laws 2020",
                "issuing_authority": "Synthetic Civic Authority",
                "doc_type": "bye_laws",
                "layer": "municipal",
                "role": "base",
                "legal_status": "in_force",
                "acquisition_status": "acquired",
                "status_evidence": {
                    "url": "https://synthetic-authority.example.org/gazette/2020-01.pdf",
                    "quoted_line": "Synthetic Municipal Building Bye-laws 2020 in force from 2020-01-01.",
                },
                "licence_or_terms": "CC0-1.0",
                "text_rights": {
                    "mode": "full_text",
                    "reason": "Synthetic test fixture document",
                },
                "languages": ["en"],
                "notified_date": "2020-01-01",
                "effective_from": "2020-01-01",
                "source_url": str(sources_dir / "synth-bbl-2020.pdf"),
            },
            {
                "id": "synth-bbl-amend-2024",
                "title": "Synthetic Municipal Building (Amendment) Bye-laws 2024",
                "issuing_authority": "Synthetic Civic Authority",
                "doc_type": "amendment",
                "layer": "municipal",
                "role": "amendment",
                "legal_status": "in_force",
                "acquisition_status": "acquired",
                "status_evidence": {
                    "url": "https://synthetic-authority.example.org/gazette/2024-06.pdf",
                    "quoted_line": "Synthetic Amendment Bye-laws 2024 in force from 2024-06-01.",
                },
                "licence_or_terms": "CC0-1.0",
                "text_rights": {
                    "mode": "full_text",
                    "reason": "Synthetic test fixture document",
                },
                "languages": ["en"],
                "amends": ["synth-bbl-2020"],
                "notified_date": "2024-06-01",
                "effective_from": "2024-06-01",
                "source_url": str(sources_dir / "synth-bbl-amend-2024.pdf"),
            },
        ],
        "maps": {
            "boundaries": [
                {
                    "id": "synth-city-boundary",
                    "source_url": str(sources_dir / "synth-boundary.kml"),
                    "select": {"property": "city_code", "equals": "SYN-CITY-01"},
                }
            ],
            "zoning": [
                {
                    "id": "synth-pd-01",
                    "kind": "imported",
                    "source_url": str(sources_dir / "synth-zones.geojson"),
                    "zone_code_field": "ZONE_CD",
                    "zone_label_field": "ZONE_NAME",
                    "planning_district": "SYN-PD-01",
                    "sheet": "SYN-Sheet-1",
                    "source_attribution": "Synthetic Test GIS Fixture (CC0-1.0)",
                }
            ],
        },
    }

    jur_dir = output_root / "jurisdictions"
    jur_dir.mkdir(parents=True, exist_ok=True)
    (jur_dir / f"{jur_id}.yaml").write_text(
        yaml.safe_dump(config_payload, sort_keys=False),
        encoding="utf-8",
    )
    return config_payload


if __name__ == "__main__":
    import tempfile

    with tempfile.TemporaryDirectory() as tmp:
        build_synthetic_jurisdiction(Path(tmp))
