"""Stage 8.8: Package release artifacts (.zip, SHA256SUMS, sources.json/csv, manifest.json) and publish."""

from __future__ import annotations

import csv
import hashlib
import io
import json
import os
import urllib.request
import zipfile
from pathlib import Path
from typing import Any

import click

from bylaws.acquire import (
    _build_unacquired_document_payload,
    sync_raw_metadata_from_config,
)
from bylaws.config import JurisdictionConfig
from bylaws.root import (
    get_deterministic_timestamp,
    get_deterministic_zip_date_time,
    resolve_repo_root,
)
from bylaws.schema_validator import validate_payload
from bylaws.structure import is_structurable_document


def _sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def _build_deterministic_zip(files_map: dict[str, bytes]) -> bytes:
    zip_dt = get_deterministic_zip_date_time()
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, mode="w", compression=zipfile.ZIP_DEFLATED) as zf:
        for filename in sorted(files_map):
            info = zipfile.ZipInfo(filename=filename, date_time=zip_dt)
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o644 << 16
            zf.writestr(info, files_map[filename])
    return buffer.getvalue()


def _build_sources_exports(documents_list: list[dict[str, Any]]) -> tuple[bytes, bytes]:
    """Generate `sources.json` and `sources.csv` bytes from the document metadata list."""
    sources_json_bytes = (json.dumps(documents_list, indent=2) + "\n").encode("utf-8")

    csv_buf = io.StringIO()
    fieldnames = [
        "doc_id",
        "title",
        "layer",
        "doc_type",
        "issuing_authority",
        "notification_number",
        "notified_date",
        "effective_from",
        "legal_status",
        "text_rights_mode",
        "official_url",
        "source_url",
        "sha256",
    ]
    writer = csv.DictWriter(csv_buf, fieldnames=fieldnames, lineterminator="\n")
    writer.writeheader()
    for doc in documents_list:
        tr = doc.get("text_rights") or {}
        writer.writerow(
            {
                "doc_id": doc.get("doc_id") or "",
                "title": doc.get("title") or "",
                "layer": doc.get("layer") or "",
                "doc_type": doc.get("doc_type") or doc.get("role") or "",
                "issuing_authority": doc.get("issuing_authority") or "",
                "notification_number": doc.get("notification_number") or "",
                "notified_date": doc.get("notified_date") or "",
                "effective_from": doc.get("effective_from") or "",
                "legal_status": doc.get("legal_status") or "",
                "text_rights_mode": tr.get("mode") if isinstance(tr, dict) else "full_text",
                "official_url": doc.get("official_url") or "",
                "source_url": doc.get("source_url") or "",
                "sha256": doc.get("sha256") or "",
            }
        )
    sources_csv_bytes = csv_buf.getvalue().encode("utf-8")
    return sources_json_bytes, sources_csv_bytes


def _sanitize_chapter_slug(raw: str) -> str:
    cleaned = "".join(ch if ch.isalnum() or ch in {"_", "-"} else "_" for ch in raw)
    while "__" in cleaned:
        cleaned = cleaned.replace("__", "_")
    return cleaned.strip("_") or "ch"


def split_clause_tree_into_chapters(
    tree_payload: dict[str, Any],
    url_prefix: str,
    max_non_row_per_chapter: int = 60,
) -> tuple[dict[str, Any], dict[str, dict[str, Any]]]:
    """Split a `ClauseTree` into `<doc_id>.outline.json` and `<doc_id>/chapters/<chapter_eid>.json`."""
    doc_id = str(tree_payload["doc_id"])
    all_clauses: list[dict[str, Any]] = list(tree_payload.get("clauses") or [])
    active_clauses = [
        c
        for c in all_clauses
        if c.get("superseded_by") is None and c.get("record_superseded_by") is None
    ]
    superseded_by_cid: dict[str, list[dict[str, Any]]] = {}
    for c in all_clauses:
        if c.get("superseded_by") is not None or c.get("record_superseded_by") is not None:
            cid = str(c.get("clause_id") or "")
            superseded_by_cid.setdefault(cid, []).append(c)

    # Group active clauses by top-level container prefix while keeping table_row nodes with their table
    raw_groups: list[tuple[str, list[dict[str, Any]]]] = []
    current_key = ""
    current_group: list[dict[str, Any]] = []

    for node in active_clauses:
        eid = str(node.get("eid") or node.get("number") or "cl")
        if node.get("type") == "table_row" and current_group:
            current_group.append(node)
            continue
        top_prefix = eid.split("__", 1)[0]
        is_major_container = node.get("type") in {
            "part",
            "chapter",
            "schedule",
            "annexure",
            "appendix",
        } or top_prefix.startswith(("part_", "chp_", "sched_", "annex_"))

        if not current_group:
            current_key = top_prefix if is_major_container else "sec_intro"
            current_group.append(node)
        else:
            target_key = top_prefix if is_major_container else current_key
            non_rows_in_current = sum(
                1 for n in current_group if n.get("type") != "table_row"
            )
            if (
                target_key != current_key and non_rows_in_current >= 10
            ) or non_rows_in_current >= max_non_row_per_chapter:
                raw_groups.append((current_key, current_group))
                current_key = top_prefix
                current_group = [node]
            else:
                if target_key != current_key and current_key == "sec_intro":
                    current_key = target_key
                current_group.append(node)

    if current_group:
        raw_groups.append((current_key, current_group))

    outline_entries: list[dict[str, Any]] = []
    chapter_files: dict[str, dict[str, Any]] = {}
    total_non_row = 0
    total_tables = 0

    for idx, (grp_key, grp_nodes) in enumerate(raw_groups, start=1):
        slug = _sanitize_chapter_slug(f"ch_{idx:02d}_{grp_key}")
        rel_path = f"{doc_id}/chapters/{slug}.json"
        web_url = f"{url_prefix}/{rel_path}"

        first_node = grp_nodes[0]
        non_row_nodes = [n for n in grp_nodes if n.get("type") != "table_row"]
        table_nodes = [n for n in grp_nodes if n.get("type") == "table"]
        total_non_row += len(non_row_nodes)
        total_tables += len(table_nodes)

        changed_cnt = sum(
            1
            for n in non_row_nodes
            if len(n.get("versions") or []) > 1
            or bool(n.get("amended_by"))
            or bool(n.get("change_mark"))
        )
        pages = [
            int(cit["page"])
            for n in grp_nodes
            for cit in (n.get("citations") or [])
            if isinstance(cit.get("page"), int)
        ]
        min_page = min(pages) if pages else 1

        heading_label = (
            first_node.get("heading")
            or first_node.get("title")
            or f"Section {first_node.get('native_number') or first_node.get('number') or idx}"
        )

        # Include superseded historical records for any clause in this chapter
        chapter_clauses: list[dict[str, Any]] = []
        for n in grp_nodes:
            chapter_clauses.extend(
                superseded_by_cid.get(str(n.get("clause_id") or ""), [])
            )
            chapter_clauses.append(n)

        chapter_payload: dict[str, Any] = {
            "schema_version": "1.4",
            "doc_id": doc_id,
            "jurisdiction": str(tree_payload["jurisdiction"]),
            "legal_status": str(tree_payload["legal_status"]),
            "chapter_eid": slug,
            "chapter_title": str(heading_label),
            "as_of_date": tree_payload.get("as_of_date"),
            "derived": tree_payload.get("derived"),
            "generated": tree_payload["generated"],
            "clauses": chapter_clauses,
        }
        chapter_files[rel_path] = chapter_payload

        outline_entries.append(
            {
                "eid": str(first_node.get("eid") or slug),
                "clause_id": str(first_node.get("clause_id") or f"{doc_id}:{slug}"),
                "number": str(first_node.get("native_number") or first_node.get("number") or str(idx)),
                "title": first_node.get("title"),
                "heading": str(heading_label),
                "type": str(first_node.get("type") or "chapter"),
                "level": int(first_node.get("level") or 1),
                "parent_eid": first_node.get("parent_eid"),
                "order": idx - 1,
                "page": min_page,
                "child_count": len(non_row_nodes),
                "table_count": len(table_nodes),
                "chapter_file": web_url,
                "changed_count": changed_cnt,
            }
        )

    outline_payload: dict[str, Any] = {
        "schema_version": "1.4",
        "doc_id": doc_id,
        "jurisdiction": str(tree_payload["jurisdiction"]),
        "legal_status": str(tree_payload["legal_status"]),
        "as_of_date": tree_payload.get("as_of_date"),
        "derived": tree_payload.get("derived"),
        "total_clauses": total_non_row,
        "total_tables": total_tables,
        "outline": outline_entries,
        "generated": tree_payload["generated"],
        "clauses": [],
    }
    return outline_payload, chapter_files


def _collect_release_artifacts(
    config: JurisdictionConfig,
    root: Path,
    release_version: str = "",
) -> tuple[
    dict[str, bytes],
    list[str],
    list[str],
    list[str],
    list[str],
    list[str],
    dict[str, dict[str, Any]],
]:
    """Collect release file bytes and return `(artifact_bytes, in_force_clause_files, in_force_annotation_files, draft_clause_files, in_force_outlines, draft_outlines, shared_documents)`."""
    raw_dir = root / "data" / "raw" / config.id
    processed_dir = root / "data" / "processed" / config.id
    docs_dir = processed_dir / "documents"

    sync_raw_metadata_from_config(config, repo_root=root)

    documents_list: list[dict[str, Any]] = []
    for doc in config.documents:
        meta_path = raw_dir / f"{doc.id}.meta.json"
        acq_status = getattr(doc, "acquisition_status", None) or "acquired"
        if not meta_path.is_file():
            if acq_status in {"pending", "not_found"}:
                documents_list.append(_build_unacquired_document_payload(doc))
                continue
            raise click.ClickException(
                f"Cannot publish '{config.id}': missing '{meta_path}'."
            )
        documents_list.append(json.loads(meta_path.read_text(encoding="utf-8")))

    sources_json_bytes, sources_csv_bytes = _build_sources_exports(documents_list)

    artifacts: dict[str, bytes] = {
        "documents.json": (json.dumps(documents_list, indent=2) + "\n").encode("utf-8"),
        "sources.json": sources_json_bytes,
        "sources.csv": sources_csv_bytes,
    }

    in_force_clause_files: list[str] = []
    in_force_annotation_files: list[str] = []
    draft_clause_files: list[str] = []
    in_force_outlines: list[str] = []
    draft_outlines: list[str] = []
    shared_documents: dict[str, dict[str, Any]] = {}

    parent_id = getattr(config, "parent", None)
    ver_str = release_version or str(getattr(config, "release_version", None) or "")
    url_prefix = f"/data/{config.id}/{ver_str}"
    parent_prefix = f"/data/{parent_id}/{ver_str}" if parent_id else url_prefix
    parent_release_dir = (
        root / "public" / "data" / parent_id / ver_str
        if parent_id and ver_str
        else None
    )

    for doc in config.documents:
        if not is_structurable_document(doc):
            continue
        clause_filename = f"{doc.id}.clauses.json"
        outline_filename = f"{doc.id}.outline.json"
        clause_path = docs_dir / clause_filename
        if not clause_path.is_file():
            raise click.ClickException(
                f"Cannot publish '{config.id}': missing '{clause_path}'."
            )
        ann_filename = f"{doc.id}.annotations.json"
        ann_path = docs_dir / ann_filename

        # Store shared base documents and shared amendments once in the parent jurisdiction;
        # child corporations store only corporation-specific documents (where `applies_in` is set)
        # while referencing shared documents by content digest.
        is_shared_from_parent = (
            parent_release_dir is not None
            and not getattr(doc, "applies_in", None)
            and (parent_release_dir / clause_filename).is_file()
        )
        effective_prefix = parent_prefix if is_shared_from_parent else url_prefix

        if is_shared_from_parent and parent_release_dir is not None:
            parent_clause_bytes = (parent_release_dir / clause_filename).read_bytes()
            shared_documents[doc.id] = {
                "sha256": _sha256_bytes(parent_clause_bytes),
                "clauses": f"{parent_prefix}/{clause_filename}",
                "outline": f"{parent_prefix}/{outline_filename}",
                "annotations": (
                    f"{parent_prefix}/{ann_filename}"
                    if (parent_release_dir / ann_filename).is_file()
                    else None
                ),
            }
        else:
            raw_clause_bytes = clause_path.read_bytes()
            artifacts[clause_filename] = raw_clause_bytes
            if config.visibility != "test":
                tree_dict = json.loads(raw_clause_bytes.decode("utf-8"))
                outline_dict, chapter_map = split_clause_tree_into_chapters(
                    tree_dict, effective_prefix
                )
                artifacts[outline_filename] = (
                    json.dumps(outline_dict, indent=2) + "\n"
                ).encode("utf-8")
                for ch_rel_path, ch_dict in chapter_map.items():
                    artifacts[ch_rel_path] = (
                        json.dumps(ch_dict, indent=2) + "\n"
                    ).encode("utf-8")
            if ann_path.is_file():
                artifacts[ann_filename] = ann_path.read_bytes()

        if ann_path.is_file() and doc.legal_status != "draft":
            in_force_annotation_files.append(ann_filename)
        if doc.legal_status == "draft":
            draft_clause_files.append(clause_filename)
            if config.visibility != "test":
                draft_outlines.append(outline_filename)
        else:
            in_force_clause_files.append(clause_filename)
            if config.visibility != "test":
                in_force_outlines.append(outline_filename)

    for required_name in (
        "amendments.json",
        "zones.geojson",
        "boundary.geojson",
        "declarations.json",
    ):
        src_path = processed_dir / required_name
        if not src_path.is_file():
            raise click.ClickException(
                f"Cannot publish '{config.id}': missing required processed file '{src_path}'."
            )
        artifacts[required_name] = src_path.read_bytes()

    for optional_name in (
        "consolidated.json",
        "geo-layers.json",
        "clause-zone-tags.json",
        "gba-zones.geojson",
        "wards.geojson",
        "planning-districts.geojson",
        "overlays.geojson",
        "graph.json",
        "graph.graphml",
        "relations.json",
        "parameters.json",
        "resolution.json",
        "places.json",
    ):
        opt_path = processed_dir / optional_name
        if opt_path.is_file():
            artifacts[optional_name] = opt_path.read_bytes()

    # Include any per-chapter consolidated snapshots and Akoma Ntoso XML files
    cons_dir = processed_dir / "consolidated"
    if cons_dir.is_dir():
        for sub_file in sorted(cons_dir.rglob("*")):
            if sub_file.is_file():
                rel_sub = sub_file.relative_to(processed_dir)
                artifacts[str(rel_sub)] = sub_file.read_bytes()

    return (
        artifacts,
        in_force_clause_files,
        in_force_annotation_files,
        draft_clause_files,
        in_force_outlines,
        draft_outlines,
        shared_documents,
    )


def _upload_to_vercel_blob(pathname: str, content: bytes, token: str) -> str:
    url = f"https://blob.vercel-storage.com/{pathname.lstrip('/')}"
    req = urllib.request.Request(
        url,
        data=content,
        method="PUT",
        headers={
            "Authorization": f"Bearer {token}",
            "x-api-version": "7",
            "x-add-random-suffix": "0",
            "Content-Type": "application/octet-stream",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            payload: dict[str, Any] = json.loads(resp.read().decode("utf-8"))
            return str(payload.get("url") or url)
    except Exception as exc:
        raise click.ClickException(f"Vercel Blob upload failed for '{pathname}': {exc}") from exc


def _trigger_deploy_hook(hook_url: str) -> None:
    req = urllib.request.Request(hook_url, data=b"", method="POST")
    try:
        with urllib.request.urlopen(req, timeout=30):
            pass
    except Exception as exc:
        raise click.ClickException(f"Failed to trigger VERCEL_DEPLOY_HOOK_URL: {exc}") from exc


def _compute_manifest_dataset_id(
    jurisdictions: list[dict[str, Any]],
    public_data_dir: Path,
    current_jur_id: str,
    current_rel_ver: str,
    current_sha256sums_bytes: bytes,
) -> str:
    """Compute a deterministic `dataset_id` (`ds-<12-hex>`) across all public releases in the manifest."""
    hasher = hashlib.sha256()
    public_entries = [
        j for j in jurisdictions if j.get("visibility", "public") != "test"
    ]
    if not public_entries:
        public_entries = list(jurisdictions)
    for j in sorted(public_entries, key=lambda x: str(x.get("id") or "")):
        j_id = str(j.get("id") or "")
        lat_ver = str(j.get("latest_release") or "")
        if not j_id or not lat_ver:
            continue
        if j_id == current_jur_id and lat_ver == current_rel_ver:
            sha_bytes = current_sha256sums_bytes
        else:
            sha_file = public_data_dir / j_id / lat_ver / "SHA256SUMS"
            sha_bytes = sha_file.read_bytes() if sha_file.is_file() else b""
        hasher.update(f"{j_id}@{lat_ver}:".encode())
        hasher.update(sha_bytes)
    return f"ds-{hasher.hexdigest()[:12]}"


def run_publish(
    config: JurisdictionConfig,
    *,
    dry_run: bool = False,
    target: str | None = None,
    release_version: str | None = None,
    repo_root: Path | None = None,
    _cascade_children: bool = True,
) -> None:
    """Publish processed jurisdiction datasets and update manifest.json safely."""
    resolved_version = (
        release_version
        or getattr(config, "release_version", None)
        or ""
    ).strip()
    if not resolved_version:
        raise click.ClickException(
            f"Cannot publish '{config.id}': 'release_version' is absent in jurisdiction configuration."
        )
    release_version = resolved_version
    root = repo_root or resolve_repo_root()
    resolved_target = (target or os.environ.get("DATA_TARGET") or "local").strip().lower()
    if resolved_target not in {"local", "blob"}:
        raise click.ClickException(
            f"Unsupported publish target '{resolved_target}'. Expected 'local' or 'blob'."
        )

    (
        artifacts,
        in_force_clauses,
        in_force_annotations,
        draft_clauses,
        in_force_outlines,
        draft_outlines,
        shared_documents,
    ) = _collect_release_artifacts(config, root, release_version)

    zip_filename = f"{config.id}-{release_version}.zip"
    zip_bytes = _build_deterministic_zip(artifacts)
    all_release_files: dict[str, bytes] = {
        **artifacts,
        zip_filename: zip_bytes,
    }

    sha_lines = [
        f"{_sha256_bytes(all_release_files[fname])}  {fname}"
        for fname in sorted(all_release_files)
    ]
    all_release_files["SHA256SUMS"] = ("\n".join(sha_lines) + "\n").encode("utf-8")

    url_prefix = f"/data/{config.id}/{release_version}"
    parent_id = getattr(config, "parent", None)
    parent_prefix = f"/data/{parent_id}/{release_version}" if parent_id else url_prefix
    released_at = get_deterministic_timestamp()
    from bylaws.verify_records import collect_verified_contributors_for_jurisdiction

    verifiers_list = collect_verified_contributors_for_jurisdiction(
        config, repo_root=root
    )
    if verifiers_list:
        verifier_credits_str = "; ".join(
            f"{v['verifier_name']} ({v['institution']})" for v in verifiers_list
        )
        changelog = (
            f"Release {release_version} for {config.name}. "
            f"Verified by: {verifier_credits_str}."
        )
    else:
        changelog = f"Release {release_version} for {config.name}."

    def _resolve_file_url(fname: str) -> str:
        if fname in artifacts:
            return f"{url_prefix}/{fname}"
        return f"{parent_prefix}/{fname}"

    files_entry: dict[str, Any] = {
        "documents": f"{url_prefix}/documents.json",
        "clauses": [_resolve_file_url(fname) for fname in in_force_clauses],
        "annotations": [_resolve_file_url(fname) for fname in in_force_annotations],
        "amendments": f"{url_prefix}/amendments.json",
        "zones": f"{url_prefix}/zones.geojson",
        "boundary": f"{url_prefix}/boundary.geojson",
        "sources_json": f"{url_prefix}/sources.json",
        "sources_csv": f"{url_prefix}/sources.csv",
        "review_images": [],
    }
    if in_force_outlines:
        files_entry["outlines"] = [_resolve_file_url(fname) for fname in in_force_outlines]
    if shared_documents:
        files_entry["shared_documents"] = shared_documents
    optional_file_keys = (
        ("consolidated", "consolidated.json"),
        ("geo_layers", "geo-layers.json"),
        ("clause_zone_tags", "clause-zone-tags.json"),
        ("gba_zones", "gba-zones.geojson"),
        ("wards", "wards.geojson"),
        ("planning_districts", "planning-districts.geojson"),
        ("overlays", "overlays.geojson"),
        ("relations", "relations.json"),
        ("graph", "graph.json"),
        ("parameters", "parameters.json"),
        ("resolution", "resolution.json"),
        ("places", "places.json"),
    )
    for manifest_key, filename in optional_file_keys:
        if filename in artifacts:
            if manifest_key in {"relations", "graph", "parameters", "resolution", "places"} and config.visibility == "test":
                continue
            files_entry[manifest_key] = f"{url_prefix}/{filename}"

    akn_xml_files = sorted(
        f"{url_prefix}/{fname}"
        for fname in artifacts
        if fname.endswith(".akn.xml")
    )
    if akn_xml_files and config.visibility != "test":
        files_entry["akn_xml"] = akn_xml_files

    drafts_entry: dict[str, Any] = {
        "clauses": [_resolve_file_url(fname) for fname in draft_clauses],
    }
    if draft_outlines:
        drafts_entry["outlines"] = [_resolve_file_url(fname) for fname in draft_outlines]

    release_entry: dict[str, Any] = {
        "version": release_version,
        "status": "published",
        "released_at": released_at,
        "licence": str(config.licence or "CC BY 4.0"),
        "download_zip": f"{url_prefix}/{zip_filename}",
        "sha256sums": f"{url_prefix}/SHA256SUMS",
        "declarations": f"{url_prefix}/declarations.json",
        "files": files_entry,
        "drafts": drafts_entry,
        "changelog": changelog,
        "verifiers": verifiers_list,
    }

    public_data_dir = root / "public" / "data"
    manifest_path = public_data_dir / "manifest.json"

    other_jurisdictions: list[dict[str, Any]] = []
    existing_releases_for_current: list[dict[str, Any]] = []
    existing_register_docs: str | None = None

    if manifest_path.exists():
        try:
            raw_manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as exc:
            raise click.ClickException(
                f"Failed to read or parse existing manifest at '{manifest_path}': {exc}"
            ) from exc

        if not isinstance(raw_manifest, dict) or not isinstance(
            raw_manifest.get("jurisdictions"), list
        ):
            raise click.ClickException(
                f"Existing manifest at '{manifest_path}' is malformed: expected object with 'jurisdictions' list."
            )

        for entry in raw_manifest["jurisdictions"]:
            if not isinstance(entry, dict) or not entry.get("id"):
                raise click.ClickException(
                    f"Existing manifest at '{manifest_path}' contains malformed jurisdiction entry."
                )
            if entry["id"] == config.id:
                if isinstance(entry.get("register_documents"), str):
                    existing_register_docs = str(entry["register_documents"])
                for rel in entry.get("releases") or []:
                    if isinstance(rel, dict) and rel.get("version") != release_version:
                        existing_releases_for_current.append(rel)
            else:
                other_jurisdictions.append(entry)

    if not existing_register_docs and (public_data_dir / config.id / "register" / "documents.json").is_file():
        existing_register_docs = f"/data/{config.id}/register/documents.json"

    jurisdiction_manifest_entry: dict[str, Any] = {
        "id": config.id,
        "name": config.name,
        "aliases": list(config.aliases or []),
        "visibility": str(config.visibility or "public"),
        "latest_release": release_version,
        "releases": [*existing_releases_for_current, release_entry],
    }
    if getattr(config, "parent", None):
        jurisdiction_manifest_entry["parent"] = str(config.parent)
    if existing_register_docs:
        jurisdiction_manifest_entry["register_documents"] = existing_register_docs

    all_jurisdictions = [*other_jurisdictions, jurisdiction_manifest_entry]
    dataset_id = _compute_manifest_dataset_id(
        all_jurisdictions,
        public_data_dir,
        config.id,
        release_version,
        all_release_files["SHA256SUMS"],
    )
    for j_entry in all_jurisdictions:
        if j_entry.get("visibility", "public") != "test" or len(all_jurisdictions) == 1:
            for rel_obj in j_entry.get("releases") or []:
                if isinstance(rel_obj, dict) and rel_obj.get("status") != "withdrawn":
                    rel_obj["dataset_id"] = dataset_id

    manifest_payload: dict[str, Any] = {
        "schema_version": "1.4",
        "dataset_id": dataset_id,
        "jurisdictions": all_jurisdictions,
    }
    validate_payload(manifest_payload, "manifest", source=str(manifest_path))

    if dry_run:
        for fname in sorted(all_release_files):
            click.echo(f"[publish:dry-run] Would write {url_prefix}/{fname}")
        click.echo("[publish:dry-run] Would update /data/manifest.json")
        return

    if resolved_target == "local":
        release_dir = public_data_dir / config.id / release_version
        release_dir.mkdir(parents=True, exist_ok=True)
        for fname, content in sorted(all_release_files.items()):
            dest_path = release_dir / fname
            dest_path.parent.mkdir(parents=True, exist_ok=True)
            dest_path.write_bytes(content)
        manifest_path.parent.mkdir(parents=True, exist_ok=True)
        manifest_path.write_text(
            json.dumps(manifest_payload, indent=2) + "\n",
            encoding="utf-8",
        )
        click.echo(
            f"[publish:local] Published {len(all_release_files)} file(s) to "
            f"'{release_dir.relative_to(root)}' and updated '{manifest_path.relative_to(root)}'."
        )
        if _cascade_children and not getattr(config, "parent", None) and config.visibility != "test":
            from bylaws.config import load_jurisdiction_config

            jurs_dir = root / "jurisdictions"
            if jurs_dir.is_dir():
                for child_yaml in sorted(jurs_dir.glob("*.yaml")):
                    if child_yaml.stem == config.id or child_yaml.stem == "resolution" or child_yaml.stem.startswith("_"):
                        continue
                    child_cfg = load_jurisdiction_config(child_yaml.stem, repo_root=root)
                    if getattr(child_cfg, "parent", None) == config.id:
                        run_publish(
                            child_cfg,
                            dry_run=dry_run,
                            target=target,
                            release_version=release_version,
                            repo_root=root,
                            _cascade_children=False,
                        )
        return

    blob_token = os.environ.get("BLOB_READ_WRITE_TOKEN", "").strip()
    if not blob_token:
        raise click.ClickException(
            "BLOB_READ_WRITE_TOKEN is required when publishing with --target blob."
        )

    for fname, content in sorted(all_release_files.items()):
        _upload_to_vercel_blob(f"data/{config.id}/{release_version}/{fname}", content, blob_token)

    manifest_bytes = (json.dumps(manifest_payload, indent=2) + "\n").encode("utf-8")
    _upload_to_vercel_blob("data/manifest.json", manifest_bytes, blob_token)

    deploy_hook = os.environ.get("VERCEL_DEPLOY_HOOK_URL", "").strip()
    if deploy_hook:
        _trigger_deploy_hook(deploy_hook)

    click.echo(
        f"[publish:blob] Uploaded {len(all_release_files)} file(s) and manifest.json for '{config.id}'."
    )
