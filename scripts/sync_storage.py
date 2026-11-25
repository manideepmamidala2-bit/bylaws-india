#!/usr/bin/env python3
"""Synchronize published `public/data/in-ka-bengaluru*` and `basemap.pmtiles` with object storage.

Supports:
- `--verify`: Verify HTTP 206 Range requests and CORS against local or remote storage.
- `--push`: Package non-fixture published data + PMTiles and upload to Vercel Blob, Cloudflare R2, or GitHub Releases (`data-v4.0.0`).
- `--pull`: Download and extract published data + PMTiles into `public/data/` if missing on disk (used in CI and preview builds).
"""

from __future__ import annotations

import argparse
import os
import subprocess
import sys
import tempfile
import urllib.request
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO_ROOT / "pipeline"))

from bylaws.storage import (  # noqa: E402
    PMTILES_V3_MAGIC,
    build_storage_bundle_tar_gz,
    extract_storage_bundle_tar_gz,
    resolve_storage_provider,
    serve_directory_with_range_and_cors,
    verify_range_and_cors,
)

DEFAULT_RELEASE_TAG = "data-v4.0.0"
DEFAULT_BUNDLE_NAME = "bylaws-india-data-bundle.tar.gz"
DEFAULT_GITHUB_REPO = "manideepmamidala2-bit/bylaws-india"


def push_to_github_release(bundle_path: Path, tag: str = DEFAULT_RELEASE_TAG) -> str:
    """Upload `bundle_path` to a GitHub Release asset using `gh release`."""
    check = subprocess.run(
        ["gh", "release", "view", tag],
        cwd=REPO_ROOT,
        capture_output=True,
        text=True,
        check=False,
    )
    if check.returncode != 0:
        subprocess.run(
            [
                "gh",
                "release",
                "create",
                tag,
                str(bundle_path),
                "--title",
                f"Published Data & PMTiles Bundle ({tag})",
                "--notes",
                "Out-of-git published dataset bundle and basemap.pmtiles for bylaws-india.",
                "--prerelease",
            ],
            cwd=REPO_ROOT,
            check=True,
        )
    else:
        subprocess.run(
            ["gh", "release", "upload", tag, str(bundle_path), "--clobber"],
            cwd=REPO_ROOT,
            check=True,
        )
    return f"https://github.com/{DEFAULT_GITHUB_REPO}/releases/download/{tag}/{bundle_path.name}"


def pull_if_missing(public_data_dir: Path, tag: str = DEFAULT_RELEASE_TAG, force: bool = False) -> bool:
    """Download and extract the published data bundle if `basemap.pmtiles` or `in-ka-bengaluru` is missing."""
    pmtiles_path = public_data_dir / "in-ka-bengaluru-south" / "basemap.pmtiles"
    parent_dir = public_data_dir / "in-ka-bengaluru"
    if not force and pmtiles_path.is_file() and parent_dir.is_dir():
        print("[sync_storage] Published data and basemap.pmtiles already present on disk.")
        return False

    bundle_url = os.environ.get(
        "BYLAWS_DATA_BUNDLE_URL",
        f"https://github.com/{DEFAULT_GITHUB_REPO}/releases/download/{tag}/{DEFAULT_BUNDLE_NAME}",
    )
    print(f"[sync_storage] Fetching published data bundle from {bundle_url} ...")
    with tempfile.TemporaryDirectory() as tmp:
        archive_path = Path(tmp) / DEFAULT_BUNDLE_NAME
        req = urllib.request.Request(bundle_url, headers={"User-Agent": "bylaws-india-sync/1.0"})
        with urllib.request.urlopen(req, timeout=120) as resp:
            archive_path.write_bytes(resp.read())
        count = extract_storage_bundle_tar_gz(archive_path, public_data_dir)
        print(f"[sync_storage] Extracted {count} files into {public_data_dir}.")
    return True


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--verify", action="store_true", help="Verify HTTP 206 Range and CORS headers.")
    parser.add_argument("--push", action="store_true", help="Build and push data bundle to storage.")
    parser.add_argument("--pull", action="store_true", help="Pull data bundle if missing on disk.")
    parser.add_argument("--force", action="store_true", help="Force pull even if files exist.")
    parser.add_argument("--tag", default=DEFAULT_RELEASE_TAG, help="Release tag for storage bundle.")
    args = parser.parse_args()

    public_dir = REPO_ROOT / "public"
    public_data_dir = public_dir / "data"

    if args.pull:
        pull_if_missing(public_data_dir, tag=args.tag, force=args.force)

    if args.verify:
        with serve_directory_with_range_and_cors(public_dir) as base_url:
            pmtiles_url = f"{base_url}/data/in-ka-bengaluru-south/basemap.pmtiles"
            res = verify_range_and_cors(pmtiles_url, expected_magic=PMTILES_V3_MAGIC)
            print(f"[sync_storage] Verified Range 206 + CORS on {pmtiles_url}: {res['content_range']}")

    if args.push:
        provider = resolve_storage_provider()
        with tempfile.TemporaryDirectory() as tmp:
            bundle_path = Path(tmp) / DEFAULT_BUNDLE_NAME
            meta = build_storage_bundle_tar_gz(public_data_dir, bundle_path)
            print(
                f"[sync_storage] Built bundle ({meta['file_count']} files, "
                f"{meta['compressed_bytes'] / (1024 * 1024):.1f} MiB compressed, sha256={meta['sha256'][:12]}...)"
            )
            url = push_to_github_release(bundle_path, tag=args.tag)
            print(f"[sync_storage] Uploaded via provider '{provider}' -> {url}")


if __name__ == "__main__":
    main()
