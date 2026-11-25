"""Falsifiable tests for Part 1: Range + CORS storage, out-of-git data, shared document deduplication, per-chapter splitting, Pagefind index, and accurate declarations."""

from __future__ import annotations

import json
import subprocess
import urllib.error
import urllib.request

import pytest

from bylaws.config import load_jurisdiction_config
from bylaws.root import resolve_repo_root
from bylaws.schema_validator import validate_file
from bylaws.storage import (
    PMTILES_V3_MAGIC,
    serve_directory_with_range_and_cors,
    verify_range_and_cors,
)

REPO_ROOT = resolve_repo_root()


def test_http_206_range_requests_and_cors_headers_on_pmtiles_and_data() -> None:
    """Range server returns HTTP 206 Partial Content with Content-Range, Accept-Ranges, and CORS headers, and 416 on invalid ranges."""
    public_dir = REPO_ROOT / "public"
    with serve_directory_with_range_and_cors(public_dir) as base_url:
        pmtiles_url = f"{base_url}/data/in-ka-bengaluru-south/basemap.pmtiles"
        res_header = verify_range_and_cors(
            pmtiles_url,
            byte_start=0,
            byte_end=511,
            expected_magic=PMTILES_V3_MAGIC,
        )
        assert res_header["status"] == 206
        assert res_header["content_length"] == 512
        assert res_header["content_range"].startswith("bytes 0-511/")
        assert res_header["access_control_allow_origin"] == "*"

        # Second slice (bytes=512-1023)
        res_second = verify_range_and_cors(
            pmtiles_url,
            byte_start=512,
            byte_end=1023,
        )
        assert res_second["status"] == 206
        assert res_second["content_length"] == 512
        assert res_second["sha256_slice"] != res_header["sha256_slice"]

        # Out-of-bounds range must return HTTP 416
        bad_req = urllib.request.Request(
            pmtiles_url,
            headers={"Range": "bytes=999999999-9999999999"},
        )
        with pytest.raises(urllib.error.HTTPError) as exc_info:
            urllib.request.urlopen(bad_req, timeout=10)
        assert exc_info.value.code == 416


def test_published_bengaluru_data_and_pmtiles_are_out_of_git() -> None:
    """Git tracks only `xx-test-fixture` and `manifest.json` under `public/data/`; zero `in-ka-bengaluru*` or `.pmtiles` files are tracked."""
    completed = subprocess.run(
        ["git", "ls-files", "public/data/"],
        cwd=REPO_ROOT,
        capture_output=True,
        text=True,
        check=True,
    )
    tracked = [line.strip() for line in completed.stdout.splitlines() if line.strip()]
    assert "public/data/manifest.json" in tracked
    assert any("public/data/xx-test-fixture/" in p for p in tracked)
    for path_str in tracked:
        assert "in-ka-bengaluru" not in path_str, (
            f"Generated Bengaluru file must not be tracked in git: {path_str}"
        )
        assert not path_str.endswith(".pmtiles"), (
            f"PMTiles archive must not be tracked in git: {path_str}"
        )


def test_shared_documents_stored_once_and_referenced_across_corporations() -> None:
    """Base documents and shared amendments are stored once in `in-ka-bengaluru` and referenced by content SHA-256 across all 5 City Corporations."""
    manifest = validate_file(REPO_ROOT / "public" / "data" / "manifest.json", "manifest")
    by_id = {j["id"]: j for j in manifest["jurisdictions"]}
    parent_ver = by_id["in-ka-bengaluru"]["latest_release"]
    parent_dir = REPO_ROOT / "public" / "data" / "in-ka-bengaluru" / parent_ver

    for shared_doc in ("bbl-2003", "rmp2015-zr", "ka-model-bbl-2017", "gbga-2024"):
        assert (parent_dir / f"{shared_doc}.clauses.json").is_file()
        assert (parent_dir / f"{shared_doc}.outline.json").is_file()

    for corp_id in (
        "in-ka-bengaluru-central",
        "in-ka-bengaluru-north",
        "in-ka-bengaluru-south",
        "in-ka-bengaluru-east",
        "in-ka-bengaluru-west",
    ):
        corp_entry = by_id[corp_id]
        ver = corp_entry["latest_release"]
        corp_dir = REPO_ROOT / "public" / "data" / corp_id / ver
        rel = next(r for r in corp_entry["releases"] if r["version"] == ver)
        shared_map = rel["files"].get("shared_documents") or {}

        for base_doc in ("bbl-2003", "rmp2015-zr", "ka-model-bbl-2017", "gbga-2024"):
            assert base_doc in shared_map, f"{corp_id} missing shared_documents[{base_doc}]"
            assert len(shared_map[base_doc]["sha256"]) == 64
            assert shared_map[base_doc]["clauses"].startswith(f"/data/in-ka-bengaluru/{ver}/")
            assert not (corp_dir / f"{base_doc}.clauses.json").exists(), (
                f"Duplicate unshared {base_doc}.clauses.json found in {corp_dir}"
            )


def test_per_chapter_splitting_outlines_and_chapter_files_validate() -> None:
    """Structured documents are split into `<doc_id>.outline.json` and `<doc_id>/chapters/*.json` that validate against `clause-tree.schema.json`."""
    parent_cfg = load_jurisdiction_config("in-ka-bengaluru")
    ver = str(parent_cfg.release_version)
    parent_dir = REPO_ROOT / "public" / "data" / "in-ka-bengaluru" / ver

    for doc_id in ("bbl-2003", "rmp2015-zr"):
        full_tree = validate_file(parent_dir / f"{doc_id}.clauses.json", "clause-tree")
        outline_tree = validate_file(parent_dir / f"{doc_id}.outline.json", "clause-tree")
        assert outline_tree["clauses"] == []
        outline_entries = outline_tree.get("outline") or []
        assert len(outline_entries) >= 3

        reconstructed_count = 0
        for entry in outline_entries:
            ch_url = str(entry["chapter_file"])
            ch_disk = REPO_ROOT / "public" / ch_url.lstrip("/")
            assert ch_disk.is_file(), f"Missing chapter file {ch_disk}"
            ch_tree = validate_file(ch_disk, "clause-tree")
            non_rows = [
                c
                for c in ch_tree["clauses"]
                if c.get("type") != "table_row"
                and c.get("superseded_by") is None
                and c.get("record_superseded_by") is None
            ]
            assert len(non_rows) == entry["child_count"]
            reconstructed_count += len(non_rows)

        expected_active_non_rows = [
            c
            for c in full_tree["clauses"]
            if c.get("type") != "table_row"
            and c.get("superseded_by") is None
            and c.get("record_superseded_by") is None
        ]
        assert reconstructed_count == len(expected_active_non_rows)
        assert outline_tree["total_clauses"] == len(expected_active_non_rows)


def test_regenerated_declarations_have_no_stale_statements_and_pagefind_exists() -> None:
    """Latest `declarations.json` has zero stale references to PR 11 / Release 2.2.0 / 00-overview.md, and Pagefind static index exists."""
    south_cfg = load_jurisdiction_config("in-ka-bengaluru-south")
    rel_dir = REPO_ROOT / "public" / "data" / "in-ka-bengaluru-south" / str(south_cfg.release_version)
    decl_text = (rel_dir / "declarations.json").read_text(encoding="utf-8")
    for stale in ("PR 11", "Release 2.2.0", "00-overview.md", "Two base documents published"):
        assert stale not in decl_text, f"Stale declaration text {stale!r} found in declarations.json"

    pagefind_dir = REPO_ROOT / "public" / "pagefind"
    assert (pagefind_dir / "pagefind-entry.json").is_file()
    assert (pagefind_dir / "index.json").is_file()
    assert (pagefind_dir / "pagefind.js").is_file()
    entry = json.loads((pagefind_dir / "pagefind-entry.json").read_text(encoding="utf-8"))
    assert entry["record_count"] >= 1000
