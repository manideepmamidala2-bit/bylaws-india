"""Automated Rule R4 licence & `docs/dependencies.md` completeness checks (Plan v1.1 §3 & §5)."""

from __future__ import annotations

import importlib.metadata
import json
import re
import tomllib

from bylaws.root import resolve_repo_root

REPO_ROOT = resolve_repo_root()

# Strong copyleft / non-commercial patterns disallowed by Rule R4 / D2
DISALLOWED_LICENCE_PATTERNS: tuple[re.Pattern[str], ...] = (
    re.compile(r"\bAGPL\b", re.IGNORECASE),
    re.compile(r"(?<!L)\bGPL\b", re.IGNORECASE),
    re.compile(r"\bGNU General Public License\b", re.IGNORECASE),
    re.compile(r"\bGNU Affero\b", re.IGNORECASE),
    re.compile(r"\bNon[- ]?Commercial\b", re.IGNORECASE),
    re.compile(r"\bCC[- ]BY[- ]NC\b", re.IGNORECASE),
)

DEV_ONLY_PACKAGES: frozenset[str] = frozenset({"fpdf2"})


def _extract_pep508_name(spec: str) -> str:
    match = re.match(r"^([A-Za-z0-9_.-]+)", spec.strip())
    assert match is not None, f"Invalid dependency specifier: {spec}"
    return match.group(1).lower()


def _extract_dist_licence(dist: importlib.metadata.Distribution) -> str:
    meta = dist.metadata
    classifiers = [
        c.split("::")[-1].strip()
        for c in (meta.get_all("Classifier") or [])
        if c.startswith("License ::")
    ]
    if classifiers:
        return " / ".join(classifiers)
    for key in ("License-Expression", "License"):
        val = meta.get(key)
        if val and val.strip() and val.strip().upper() != "UNKNOWN":
            first_line = val.strip().splitlines()[0].strip()
            return first_line[:120]
    return "UNKNOWN"


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
    """No installed Python distribution carries a disallowed GPL, AGPL, or non-commercial licence."""
    violations: list[str] = []
    for dist in importlib.metadata.distributions():
        name = (dist.metadata.get("Name") or "").lower()
        if not name or name in DEV_ONLY_PACKAGES:
            continue
        licence_str = _extract_dist_licence(dist)
        for pattern in DISALLOWED_LICENCE_PATTERNS:
            if pattern.search(licence_str):
                violations.append(f"{name}: disallowed licence '{licence_str}'")
                break

    assert not violations, "Python licence violation(s) under Rule R4:\n" + "\n".join(
        violations
    )


def test_npm_packages_have_permissive_licences() -> None:
    """Direct npm packages in `package.json` / `package-lock.json` have permissive licences."""
    pkg_json = json.loads((REPO_ROOT / "package.json").read_text(encoding="utf-8"))
    lock_json = json.loads((REPO_ROOT / "package-lock.json").read_text(encoding="utf-8"))
    lock_packages: dict[str, dict[str, object]] = lock_json.get("packages", {})

    direct_pkgs = [
        *pkg_json.get("dependencies", {}).keys(),
        *pkg_json.get("devDependencies", {}).keys(),
    ]

    violations: list[str] = []
    for pkg_name in direct_pkgs:
        entry = lock_packages.get(f"node_modules/{pkg_name}", {})
        licence_val = str(entry.get("license") or "")
        if not licence_val:
            node_pkg_path = REPO_ROOT / "node_modules" / pkg_name / "package.json"
            if node_pkg_path.is_file():
                node_pkg = json.loads(node_pkg_path.read_text(encoding="utf-8"))
                licence_val = str(node_pkg.get("license") or "")

        assert licence_val, f"Missing licence metadata for npm package '{pkg_name}'"
        for pattern in DISALLOWED_LICENCE_PATTERNS:
            if pattern.search(licence_val):
                violations.append(f"{pkg_name}: disallowed npm licence '{licence_val}'")
                break

    assert not violations, "npm licence violation(s) under Rule R4:\n" + "\n".join(
        violations
    )
