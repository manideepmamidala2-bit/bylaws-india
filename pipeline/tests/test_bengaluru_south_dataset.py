"""Verification tests for PR 01 production containment of `in-ka-bengaluru-south`."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import pytest

from bylaws.root import resolve_repo_root
from bylaws.schema_validator import validate_file, validate_payload

REPO_ROOT = resolve_repo_root()
PUBLIC_DATA_DIR = REPO_ROOT / "public" / "data"
MANIFEST_PATH = PUBLIC_DATA_DIR / "manifest.json"
WITHDRAWN_RELEASE_DIR = PUBLIC_DATA_DIR / "in-ka-bengaluru-south" / "1.0.0"


def assert_published_manifest_has_no_local_sources(
    manifest: dict[str, Any], public_root: Path
) -> None:
    """Fail if any non-test published manifest entry references a local `source_url` or exposes withdrawn files."""
    for jur in manifest.get("jurisdictions", []):
        if jur.get("visibility") == "test":
            continue
        jur_id = jur.get("id", "<unknown>")
        for rel in jur.get("releases", []):
            ver = rel.get("version", "<unknown>")
            if rel.get("status") == "withdrawn":
                for forbidden_key in (
                    "download_zip",
                    "sha256sums",
                    "declarations",
                    "files",
                    "drafts",
                ):
                    if rel.get(forbidden_key) is not None:
                        raise AssertionError(
                            f"Withdrawn release {jur_id}@{ver} must not expose '{forbidden_key}'"
                        )
                continue

            files = rel.get("files") or {}
            docs_rel_path = files.get("documents")
            if not isinstance(docs_rel_path, str) or not docs_rel_path.strip():
                raise AssertionError(
                    f"Published release {jur_id}@{ver} is missing files.documents"
                )

            docs_disk_path = public_root / docs_rel_path.lstrip("/")
            if not docs_disk_path.is_file():
                raise AssertionError(
                    f"Published release {jur_id}@{ver} references missing {docs_disk_path}"
                )

            docs = json.loads(docs_disk_path.read_text(encoding="utf-8"))
            for doc in docs:
                doc_id = doc.get("doc_id", "<unknown>")
                source_url = str(doc.get("source_url") or "").strip()
                if (
                    not source_url
                    or source_url.startswith(("file://", "/", ".", "data/"))
                    or not source_url.startswith(("http://", "https://"))
                ):
                    raise AssertionError(
                        f"Published non-test source {jur_id}@{ver}:{doc_id} has local or non-http(s) source_url: {source_url!r}"
                    )


def test_bengaluru_south_release_1_0_0_is_withdrawn_and_files_removed() -> None:
    """Release 1.0.0 of `in-ka-bengaluru-south` is marked withdrawn with reason and removed from `public/data/`."""
    manifest = validate_file(MANIFEST_PATH, "manifest")

    by_id = {j["id"]: j for j in manifest["jurisdictions"]}
    assert "in-ka-bengaluru-south" in by_id

    bscc = by_id["in-ka-bengaluru-south"]
    assert bscc["visibility"] == "public"
    assert bscc["latest_release"] in {"2.0.0", "2.1.0", "2.2.0", "2.3.0", "2.4.0", "2.5.0", "2.6.0", "2.7.0", "2.8.0", "3.0.0"}

    rel = next(r for r in bscc["releases"] if r["version"] == "1.0.0")
    assert rel["version"] == "1.0.0"
    assert rel["status"] == "withdrawn"
    assert (
        rel["withdrawn_reason"]
        == "Synthetic demonstration data, not the law of Bengaluru South"
    )
    assert rel["download_zip"] is None
    assert rel["sha256sums"] is None
    assert rel["declarations"] is None
    assert rel["files"] is None
    assert rel["drafts"] is None

    assert not WITHDRAWN_RELEASE_DIR.exists(), (
        f"Withdrawn release directory {WITHDRAWN_RELEASE_DIR} must be removed from public/data/"
    )


def test_published_manifest_recurrence_guard_blocks_local_source_urls(
    tmp_path: Path,
) -> None:
    """Published manifest passes the recurrence guard, while a planted local source_url fails."""
    manifest = validate_file(MANIFEST_PATH, "manifest")
    assert_published_manifest_has_no_local_sources(manifest, REPO_ROOT / "public")

    # Planted non-test release with a local source_url must fail
    planted_public = tmp_path / "public"
    planted_rel_dir = planted_public / "data" / "in-ka-planted" / "1.0.0"
    planted_rel_dir.mkdir(parents=True)
    (planted_rel_dir / "documents.json").write_text(
        json.dumps(
            [
                {
                    "doc_id": "planted-doc",
                    "source_url": "data/sources/in-ka-bengaluru-south/bbl-2003.pdf",
                }
            ]
        ),
        encoding="utf-8",
    )

    planted_manifest = {
        "schema_version": "1.3",
        "jurisdictions": [
            {
                "id": "in-ka-planted",
                "name": "Planted Public Jurisdiction",
                "visibility": "public",
                "latest_release": "1.0.0",
                "releases": [
                    {
                        "version": "1.0.0",
                        "status": "published",
                        "released_at": "2026-11-24T00:00:00Z",
                        "licence": "CC BY 4.0",
                        "download_zip": "/data/in-ka-planted/1.0.0/in-ka-planted-1.0.0.zip",
                        "sha256sums": "/data/in-ka-planted/1.0.0/SHA256SUMS",
                        "declarations": "/data/in-ka-planted/1.0.0/declarations.json",
                        "files": {
                            "documents": "/data/in-ka-planted/1.0.0/documents.json",
                            "clauses": [],
                            "amendments": "/data/in-ka-planted/1.0.0/amendments.json",
                            "zones": "/data/in-ka-planted/1.0.0/zones.geojson",
                            "boundary": "/data/in-ka-planted/1.0.0/boundary.geojson",
                            "review_images": [],
                        },
                        "drafts": {"clauses": []},
                        "changelog": "Planted release",
                    }
                ],
            }
        ],
    }
    validate_payload(planted_manifest, "manifest")

    with pytest.raises(AssertionError, match="has local or non-http\\(s\\) source_url"):
        assert_published_manifest_has_no_local_sources(planted_manifest, planted_public)
