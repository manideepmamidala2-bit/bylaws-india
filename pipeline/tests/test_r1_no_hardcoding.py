"""Static check enforcing Rule R1: no jurisdiction is hard-coded in source code (Plan §2 & §11)."""

from __future__ import annotations

from pathlib import Path
from typing import Any

import yaml

from bylaws.schema_validator import REPO_ROOT

# Baseline sentinel terms from Plan §4 so the R1 check catches violations even before
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
        "in",
        "ka",
        "xx",
        "yy",
        "residential",
        "commercial",
        "industrial",
        "municipal",
        "planning",
        "state",
        "national",
        "in_force",
        "draft",
        "superseded",
        "withdrawn",
        "base",
        "amendment",
        "regulation",
        "boundary",
        "reference",
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
    """Collect prohibited strings from all non-fixture jurisdiction configs plus sentinels."""
    terms: set[str] = {term.lower() for term in SENTINEL_TERMS}
    base_dir = jurisdictions_dir or (REPO_ROOT / "jurisdictions")
    if not base_dir.is_dir():
        return terms

    for yaml_path in sorted(base_dir.glob("*.yaml")):
        if yaml_path.name.startswith("_fixture"):
            continue
        raw = yaml.safe_load(yaml_path.read_text(encoding="utf-8"))
        for extracted in _extract_strings_from_yaml_value(raw):
            terms.add(extracted.lower())
    return terms


def iter_source_files(root_dirs: list[Path]) -> list[Path]:
    """Return all non-ignored source files under `pipeline/bylaws/` and the root Next.js app."""
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
