"""Static check enforcing Rule R1 (no hard-coded jurisdictions) and D3 (no 'prototype' or '(example)')."""

from __future__ import annotations

from pathlib import Path
from typing import Any

import yaml

from bylaws.schema_validator import REPO_ROOT

# Baseline sentinel terms from Plan §4 / §7 so the R1 check catches violations even before
# non-fixture jurisdiction YAML files are added in Milestone M2.
SENTINEL_TERMS: tuple[str, ...] = (
    "bengaluru",
    "bangalore",
    "jayanagar",
    "benson town",
    "bbmp",
    "opencity",
    "in-ka-bengaluru-south",
    "bscc",
    "rmp2015",
    "ksrsac",
)

GENERIC_CONFIG_VALUES: frozenset[str] = frozenset(
    {
        "1.2",
        "in",
        "ka",
        "xx",
        "yy",
        "en",
        "kn",
        "public",
        "test",
        "cc by 4.0",
        "cc-by-4.0",
        "cc0-1.0",
        "odbl-1.0",
        "residential",
        "commercial",
        "industrial",
        "municipal",
        "planning",
        "state",
        "state_rules",
        "statute",
        "orders",
        "overlay",
        "national",
        "national_reference",
        "in_force",
        "draft",
        "superseded",
        "withdrawn",
        "status_unknown",
        "full_text",
        "reference_only",
        "base",
        "amendment",
        "regulation",
        "regulations",
        "act",
        "rules",
        "bye_laws",
        "notification",
        "government_order",
        "circular",
        "map",
        "standard_reference",
        "boundary",
        "reference",
        "imported",
        "traced",
        "vector_pdf",
        "grid_georeferenced_raster",
        "osm_gcp_raster",
        "corporation",
        "gba_zones",
        "wards",
        "official_boundary",
        "master_plan_zone",
        "derived_overlay",
    }
)

SOURCE_EXTENSIONS: frozenset[str] = frozenset({".py", ".ts", ".tsx", ".js", ".mjs", ".json"})

IGNORED_DIR_NAMES: frozenset[str] = frozenset(
    {
        "node_modules",
        ".next",
        ".venv",
        "__pycache__",
        ".pytest_cache",
        ".ruff_cache",
        "dist",
        "build",
        "coverage",
        "__tests__",
        "tests",
    }
)

IGNORED_FILE_NAMES: frozenset[str] = frozenset(
    {
        "package-lock.json",
        "tsconfig.tsbuildinfo",
    }
)


def _extract_strings_from_yaml_value(value: Any) -> set[str]:
    found: set[str] = set()
    if isinstance(value, str):
        cleaned = value.strip()
        if len(cleaned) >= 4 and cleaned.lower() not in GENERIC_CONFIG_VALUES:
            found.add(cleaned)
    elif isinstance(value, list):
        for item in value:
            found.update(_extract_strings_from_yaml_value(item))
    elif isinstance(value, dict):
        for item in value.values():
            found.update(_extract_strings_from_yaml_value(item))
    return found


def collect_prohibited_terms(jurisdictions_dir: Path | None = None) -> set[str]:
    """Collect prohibited strings from all public jurisdiction configs (visibility != 'test') plus sentinels."""
    terms: set[str] = {term.lower() for term in SENTINEL_TERMS}
    base_dir = jurisdictions_dir or (REPO_ROOT / "jurisdictions")
    if not base_dir.is_dir():
        return terms

    for yaml_path in sorted(base_dir.glob("*.yaml")):
        raw = yaml.safe_load(yaml_path.read_text(encoding="utf-8"))
        if not isinstance(raw, dict) or raw.get("visibility") == "test":
            continue
        for extracted in _extract_strings_from_yaml_value(raw):
            terms.add(extracted.lower())
    return terms


def iter_source_files(root_dirs: list[Path]) -> list[Path]:
    """Return all non-ignored source files under given root directories."""
    collected: list[Path] = []
    for root_dir in root_dirs:
        if not root_dir.exists():
            continue
        for path in sorted(root_dir.rglob("*")):
            if not path.is_file():
                continue
            if any(part in IGNORED_DIR_NAMES for part in path.parts):
                continue
            if path.name in IGNORED_FILE_NAMES:
                continue
            if path.suffix in SOURCE_EXTENSIONS:
                collected.append(path)
    return collected


def scan_text_for_r1_violations(text: str, prohibited_terms: set[str]) -> list[str]:
    """Return any prohibited jurisdiction terms present in `text` (case-insensitive)."""
    lowered = text.lower()
    return sorted(term for term in prohibited_terms if term in lowered)


def test_r1_no_jurisdiction_constants_in_pipeline_or_web_source() -> None:
    prohibited_terms = collect_prohibited_terms()
    source_files = iter_source_files(
        [
            REPO_ROOT / "pipeline" / "bylaws",
            REPO_ROOT / "app",
            REPO_ROOT / "components",
            REPO_ROOT / "lib",
        ]
    )
    assert len(source_files) > 0, "Expected source files in pipeline/bylaws/ and app/components/lib/"

    violations: list[str] = []
    for file_path in source_files:
        content = file_path.read_text(encoding="utf-8")
        matched = scan_text_for_r1_violations(content, prohibited_terms)
        if matched:
            rel_path = file_path.relative_to(REPO_ROOT)
            violations.append(f"{rel_path}: found prohibited jurisdiction terms {matched}")

    assert not violations, "Rule R1 violation(s) detected:\n" + "\n".join(violations)


def test_d3_no_prototype_or_example_wording_in_web_or_jurisdiction_names() -> None:
    """Enforce Plan v1.1 D3 / S4: no 'prototype' or '(example)' in web source or jurisdiction names."""
    web_files = iter_source_files(
        [
            REPO_ROOT / "app",
            REPO_ROOT / "components",
            REPO_ROOT / "lib",
        ]
    )
    violations: list[str] = []
    for file_path in web_files:
        content_lower = file_path.read_text(encoding="utf-8").lower()
        rel_path = file_path.relative_to(REPO_ROOT)
        if "prototype" in content_lower:
            violations.append(f"{rel_path}: contains prohibited string 'prototype'")
        if "(example)" in content_lower:
            violations.append(f"{rel_path}: contains prohibited string '(example)'")

    jurisdictions_dir = REPO_ROOT / "jurisdictions"
    for yaml_path in sorted(jurisdictions_dir.glob("*.yaml")):
        raw = yaml.safe_load(yaml_path.read_text(encoding="utf-8"))
        name_val = str(raw.get("name", "")).lower()
        if "prototype" in name_val or "(example)" in name_val:
            violations.append(
                f"jurisdictions/{yaml_path.name}: display name {raw.get('name')!r} contains prohibited wording"
            )

    assert not violations, "Plan v1.1 D3 violation(s) detected:\n" + "\n".join(violations)


def test_r1_scanner_detects_synthetic_violation(tmp_path: Path) -> None:
    fake_jurisdictions = tmp_path / "jurisdictions"
    fake_jurisdictions.mkdir()
    (fake_jurisdictions / "in-mh-sample-city.yaml").write_text(
        yaml.safe_dump(
            {
                "id": "in-mh-sample-city",
                "name": "Sample City Municipal Corporation",
                "country": "IN",
                "state": "MH",
                "building_types": ["residential"],
                "parents": [],
                "documents": [
                    {
                        "id": "scmc-dcpr-2034",
                        "title": "Sample City Development Control Regulations",
                        "issuing_authority": "SCMC",
                        "layer": "municipal",
                        "legal_status": "in_force",
                        "role": "base",
                        "source_url": "https://example.org/scmc-dcpr.pdf",
                    }
                ],
                "maps": {"boundaries": [], "zoning": []},
            }
        ),
        encoding="utf-8",
    )

    terms = collect_prohibited_terms(fake_jurisdictions)
    assert "in-mh-sample-city" in terms
    assert "scmc-dcpr-2034" in terms

    bad_snippet = 'const DEFAULT_CITY = "in-mh-sample-city"; // Bengaluru fallback'
    matches = scan_text_for_r1_violations(bad_snippet, terms)
    assert "in-mh-sample-city" in matches
    assert "bengaluru" in matches
