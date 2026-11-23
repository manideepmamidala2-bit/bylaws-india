"""Automated Rule R4 strict permissive licence allowlist & `docs/dependencies.md` checks (Plan v2.0 §2 & §5.A1)."""

from __future__ import annotations

import importlib.metadata
import json
import re
import tomllib
from typing import Any

from bylaws.root import resolve_repo_root

REPO_ROOT = resolve_repo_root()

# Explicit permissive licence allowlist per Plan v2.0 §2 Rule R4
ALLOWED_PERMISSIVE_TOKENS: frozenset[str] = frozenset(
    {
        "mit",
        "mit license",
        "mit-0",
        "mit-cmu",
        "apache-2.0",
        "apache software license",
        "apache 2.0",
        "bsd",
        "bsd license",
        "bsd-2-clause",
        "bsd-3-clause",
        "0bsd",
        "isc",
        "isc license (iscl)",
        "psf-2.0",
        "python-2.0",
        "python software foundation license",
        "cc0-1.0",
        "cc0",
        "cc-by-4.0",
        "unlicense",
        "the unlicense (unlicense)",
        "ofl-1.1",
        "mpl-2.0",
        "mozilla public license 2.0 (mpl 2.0)",
        "blueoak-1.0.0",
        "zlib",
        "zlib/libpng license",
        "hpnd",
        "historical permission notice and disclaimer (hpnd)",
        "artistic-2.0",
    }
)

# Strictly prohibited copyleft / unknown / non-commercial tokens (never allowed even in expressions)
STRICTLY_DISALLOWED_RE = re.compile(
    r"\b(?:AGPL|GPL|GPLv2|GPLv3|GPL-2\.0|GPL-3\.0|SSPL|UNKNOWN|Non[- ]?Commercial|CC[- ]BY[- ]NC|Proprietary)\b"
    r"|(?<!Lesser\s)\bGNU General Public License\b"
    r"|\bGNU Affero\b",
    re.IGNORECASE,
)


def _extract_pep508_name(spec: str) -> str:
    match = re.match(r"^([A-Za-z0-9_.-]+)", spec.strip())
    assert match is not None, f"Invalid dependency specifier: {spec}"
    return match.group(1).lower()


def _extract_dist_licence(dist: importlib.metadata.Distribution) -> str:
    meta = dist.metadata
    for key in ("License-Expression", "License"):
        val = meta.get(key)
        if val and val.strip() and val.strip().upper() != "UNKNOWN":
            first_line = val.strip().splitlines()[0].strip()
            if len(first_line) <= 120 and not first_line.startswith("Copyright"):
                return first_line
    classifiers = [
        c.split("::")[-1].strip()
        for c in (meta.get_all("Classifier") or [])
        if c.startswith("License ::") and "OSI Approved" not in c.split("::")[-1]
    ]
    if classifiers:
        return " / ".join(classifiers)
    return "UNKNOWN"


def load_documented_exceptions() -> dict[str, str]:
    """Parse written exceptions from `docs/dependencies.md` §3."""
    deps_doc = (REPO_ROOT / "docs" / "dependencies.md").read_text(encoding="utf-8")
    if "## 3. Written LGPL & Transitive Exceptions" not in deps_doc:
        return {}
    section = deps_doc.split("## 3. Written LGPL & Transitive Exceptions", 1)[1]
    exceptions: dict[str, str] = {}
    for match in re.finditer(
        r"^\|\s*`([^`]+)`\s*\|\s*`([^`]+)`\s*\|\s*([^|]+)\|",
        section,
        flags=re.MULTILINE,
    ):
        pkg_name = match.group(1).strip().lower()
        lic_str = match.group(2).strip()
        rationale = match.group(3).strip()
        if rationale:
            exceptions[pkg_name] = lic_str
    return exceptions


def is_licence_allowed(
    package_name: str,
    licence_str: str,
    documented_exceptions: dict[str, str],
) -> tuple[bool, str]:
    """Validate `(package_name, licence_str)` against the Rule R4 allowlist and written exceptions."""
    pkg_lower = package_name.strip().lower()
    cleaned = (licence_str or "").strip()
    if not cleaned or cleaned.upper() == "UNKNOWN":
        return False, f"{package_name}: missing or UNKNOWN licence"

    # Reject GPL / AGPL / non-commercial unconditionally (note: LGPL does not match `\bGPL\b`)
    if STRICTLY_DISALLOWED_RE.search(cleaned):
        return False, f"{package_name}: strictly disallowed licence '{cleaned}'"

    # Check if covered by a written exception in docs/dependencies.md
    if pkg_lower in documented_exceptions:
        expected_lic = documented_exceptions[pkg_lower].lower()
        if expected_lic in cleaned.lower():
            return True, "ok (written exception)"

    # Split compound expressions like "(MIT OR Apache-2.0)", "BSD-3-Clause AND MIT", "BSD-3-Clause, Apache-2.0, dependency licenses"
    normalized = cleaned
    if normalized.startswith("(") and normalized.endswith(")"):
        normalized = normalized[1:-1].strip()
    normalized = re.sub(r",\s*dependency licenses$", "", normalized, flags=re.IGNORECASE)
    tokens = [
        tok.strip().lower()
        for tok in re.split(r"\s+(?:OR|AND|/)\s+|,\s*", normalized, flags=re.IGNORECASE)
        if tok.strip()
    ]
    if not tokens:
        return False, f"{package_name}: empty licence expression '{cleaned}'"

    disallowed_tokens = [t for t in tokens if t not in ALLOWED_PERMISSIVE_TOKENS]
    if disallowed_tokens:
        return (
            False,
            f"{package_name}: licence '{cleaned}' contains token(s) {disallowed_tokens} not in Rule R4 allowlist",
        )
    return True, "ok"


def validate_python_licences(
    records: list[tuple[str, str]],
    documented_exceptions: dict[str, str],
) -> list[str]:
    violations: list[str] = []
    for name, lic in records:
        allowed, reason = is_licence_allowed(name, lic, documented_exceptions)
        if not allowed:
            violations.append(reason)
    return violations


def validate_npm_lock_packages(
    lock_packages: dict[str, dict[str, Any]],
    documented_exceptions: dict[str, str],
) -> list[str]:
    violations: list[str] = []
    for pkg_path, info in sorted(lock_packages.items()):
        if not pkg_path:  # Root project entry ""
            continue
        # Extract package name from last "node_modules/<name>" segment
        parts = pkg_path.split("node_modules/")
        pkg_name = parts[-1].strip("/")
        lic_val = info.get("license")
        if isinstance(lic_val, dict):
            lic_str = str(lic_val.get("type") or "")
        elif isinstance(lic_val, list):
            lic_str = " OR ".join(
                str(item.get("type") if isinstance(item, dict) else item) for item in lic_val
            )
        else:
            lic_str = str(lic_val or "")

        allowed, reason = is_licence_allowed(pkg_name, lic_str, documented_exceptions)
        if not allowed:
            violations.append(f"{pkg_path} ({reason})")
    return violations


def test_docs_dependencies_md_lists_all_direct_python_and_npm_dependencies() -> None:
    """Every direct dependency in `pipeline/pyproject.toml` and `package.json` is in `docs/dependencies.md`."""
    deps_doc = (REPO_ROOT / "docs" / "dependencies.md").read_text(encoding="utf-8")
    documented_names = {
        m.group(1).lower()
        for m in re.finditer(r"^\|\s*`([^`]+)`\s*\|", deps_doc, flags=re.MULTILINE)
    }

    pyproject = tomllib.loads(
        (REPO_ROOT / "pipeline" / "pyproject.toml").read_text(encoding="utf-8")
    )
    py_runtime = [
        _extract_pep508_name(s) for s in pyproject["project"].get("dependencies", [])
    ]
    py_dev = [
        _extract_pep508_name(s)
        for s in pyproject["project"].get("optional-dependencies", {}).get("dev", [])
    ]

    pkg_json = json.loads((REPO_ROOT / "package.json").read_text(encoding="utf-8"))
    npm_runtime = [k.lower() for k in pkg_json.get("dependencies", {})]
    npm_dev = [k.lower() for k in pkg_json.get("devDependencies", {})]

    all_direct = set(py_runtime + py_dev + npm_runtime + npm_dev)
    missing = sorted(all_direct - documented_names)
    assert not missing, (
        f"Direct dependencies missing from docs/dependencies.md: {missing}"
    )


def test_python_distributions_have_permissive_licences() -> None:
    """All installed Python distributions satisfy the strict Rule R4 allowlist."""
    exceptions = load_documented_exceptions()
    records: list[tuple[str, str]] = []
    for dist in importlib.metadata.distributions():
        name = (dist.metadata.get("Name") or "").lower()
        if not name:
            continue
        records.append((name, _extract_dist_licence(dist)))

    violations = validate_python_licences(records, exceptions)
    assert not violations, "Python licence violation(s) under Rule R4:\n" + "\n".join(
        violations
    )


def test_all_direct_and_transitive_npm_packages_have_permissive_licences() -> None:
    """All direct and transitive npm packages in `package-lock.json` satisfy the strict Rule R4 allowlist."""
    exceptions = load_documented_exceptions()
    lock_json = json.loads((REPO_ROOT / "package-lock.json").read_text(encoding="utf-8"))
    lock_packages: dict[str, dict[str, Any]] = lock_json.get("packages", {})
    assert len(lock_packages) > 50, "Expected transitive packages in package-lock.json"

    violations = validate_npm_lock_packages(lock_packages, exceptions)
    assert not violations, "npm licence violation(s) under Rule R4:\n" + "\n".join(
        violations
    )


def test_licence_checker_rejects_planted_gplv3_unknown_and_transitive_npm_violations() -> None:
    """Unit test proving planted GPLv3, AGPL, UNKNOWN, and undocumented LGPL packages fail (A-018)."""
    exceptions = load_documented_exceptions()

    py_violations = validate_python_licences(
        [
            ("pymupdf", "GNU AFFERO GENERAL PUBLIC LICENSE Version 3 (AGPL-3.0)"),
            ("some-gpl-pkg", "GPLv3"),
            ("mystery-pkg", "UNKNOWN"),
            ("undocumented-lgpl-pkg", "LGPL-3.0-only"),
        ],
        exceptions,
    )
    assert len(py_violations) == 4
    assert any("pymupdf" in v for v in py_violations)
    assert any("some-gpl-pkg" in v for v in py_violations)
    assert any("mystery-pkg" in v for v in py_violations)
    assert any("undocumented-lgpl-pkg" in v for v in py_violations)

    npm_violations = validate_npm_lock_packages(
        {
            "": {"name": "bylaws-india"},
            "node_modules/safe-pkg": {"license": "MIT"},
            "node_modules/safe-pkg/node_modules/nested-gpl-pkg": {"license": "GPL-3.0-only"},
            "node_modules/nested-unknown": {"license": ""},
            "node_modules/nested-proprietary": {"license": "Proprietary"},
        },
        exceptions,
    )
    assert len(npm_violations) == 3
    assert any("nested-gpl-pkg" in v for v in npm_violations)
    assert any("nested-unknown" in v for v in npm_violations)
    assert any("nested-proprietary" in v for v in npm_violations)
