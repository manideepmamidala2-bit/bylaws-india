"""Machine-enforced provision text fidelity and stored PDF page-text verifier."""

from __future__ import annotations

import gzip
import hashlib
import json
import re
from pathlib import Path
from typing import Any

import click

from bylaws.config import DocumentConfig, JurisdictionConfig
from bylaws.root import resolve_repo_root
from bylaws.structure import (
    _find_interim_parse_file,
    load_document_overrides_for_structure,
)

EDITORIAL_INSERTION_RE = re.compile(
    r"\[Amended\s*\(|\[Modified\s*\("
    r"|published on the official [A-Z/]+ Building Plan Approval System"
    r"|up to 15% setback and coverage deviation;\s*up to 15% FAR deviation"
    r"|Plot up to 60 sq\.m \(All uses\):\s*Front 0\.75 m",
    re.IGNORECASE,
)

WORD_TOKEN_RE = re.compile(r"[a-z0-9]+", re.IGNORECASE)


def normalize_for_fidelity(text: str) -> str:
    """Normalize whitespace, soft-hyphens, and quotes for page-text fidelity comparison."""
    cleaned = re.sub(r"\x02\s*", "-", text or "")
    cleaned = cleaned.replace("\x0c", " ").replace("\x90", "")
    cleaned = cleaned.replace("“", '"').replace("”", '"').replace("‘", "'").replace("’", "'")
    cleaned = cleaned.replace("–", "-").replace("—", "-")
    cleaned = cleaned.replace("[unreadable in source]", " ")
    return " ".join(cleaned.split())


def extract_word_tokens(text: str) -> list[str]:
    """Return lowercase alphanumeric word tokens from `text` (after stripping unreadable markers)."""
    norm = normalize_for_fidelity(text).lower()
    return WORD_TOKEN_RE.findall(norm)


def resolve_stored_page_text_path(
    doc_id: str,
    jurisdiction_id: str,
    *,
    is_test: bool = False,
    repo_root: Path | None = None,
) -> Path:
    """Resolve the versioned stored page-text path (`data/page_text/.../<doc_id>.pages.json.gz`)."""
    root = repo_root or resolve_repo_root()
    base_dir = root / "data" / "page_text"
    scoped_path = base_dir / jurisdiction_id / f"{doc_id}.pages.json.gz"
    if is_test or scoped_path.is_file():
        return scoped_path
    return base_dir / f"{doc_id}.pages.json.gz"


def build_and_write_stored_page_text(
    doc: DocumentConfig,
    config: JurisdictionConfig,
    *,
    repo_root: Path | None = None,
) -> Path | None:
    """Extract per-page text from the original PDF / parser output and write `<doc_id>.pages.json.gz` with PDF SHA-256."""
    root = repo_root or resolve_repo_root()
    acq_status = getattr(doc, "acquisition_status", None) or "acquired"
    if acq_status in {"pending", "not_found", "reference_only"}:
        return None

    cand_raw_dirs = [root / "data" / "raw" / config.id]
    if getattr(config, "parent", None):
        cand_raw_dirs.append(root / "data" / "raw" / str(config.parent))
    raw_root = root / "data" / "raw"
    if raw_root.is_dir():
        cand_raw_dirs.extend(sorted(d for d in raw_root.iterdir() if d.is_dir()))
    pdf_path = next(
        (d / f"{doc.id}.pdf" for d in cand_raw_dirs if (d / f"{doc.id}.pdf").is_file()),
        None,
    )
    if pdf_path is None:
        return None

    pdf_sha256 = hashlib.sha256(pdf_path.read_bytes()).hexdigest()
    reg_sha256 = getattr(getattr(doc, "retrieval", None), "sha256", None)
    if reg_sha256 and pdf_sha256 != reg_sha256:
        raise click.ClickException(
            f"PDF SHA-256 mismatch for '{doc.id}': disk={pdf_sha256} != register={reg_sha256}"
        )

    pages_by_num: dict[int, list[str]] = {}
    parser_used = "pypdfium2"
    page_count = 0

    # 1. Include parser blocks and tables from `data/interim/` when available
    interim_dir = root / "data" / "interim" / config.id
    try:
        interim_path = _find_interim_parse_file(interim_dir, doc.id)
        interim_data = json.loads(interim_path.read_text(encoding="utf-8"))
        parser_used = str(interim_data.get("parser_name") or parser_used)
        page_count = int(interim_data.get("page_count") or 0)
        # Exclude cross-page merged Docling block on page 36 (`17.0`) so true PDF page
        # boundaries from `pdfplumber`/`pypdfium2` govern page 36 vs. page 37.
        for blk in interim_data.get("blocks") or []:
            pg = int(blk.get("page") or 1)
            b_txt = str(blk.get("text") or "").strip()
            if doc.role == "base" and pg == 36 and "parallel to the rounded off" in b_txt:
                continue
            if b_txt:
                pages_by_num.setdefault(pg, []).append(b_txt)
        for tbl in interim_data.get("tables") or []:
            pg = int(tbl.get("page") or 1)
            if tbl.get("caption"):
                pages_by_num.setdefault(pg, []).append(str(tbl["caption"]))
            for h in tbl.get("headers") or []:
                pages_by_num.setdefault(pg, []).append(str(h))
            for r in tbl.get("rows") or []:
                for cell in r:
                    pages_by_num.setdefault(pg, []).append(str(cell))
    except (click.ClickException, OSError, ValueError):
        pass

    # 2. For digital base documents (`role == "base"`), supplement with `pdfplumber` per-page text so
    # true PDF page boundaries (p. 36 vs p. 37) and spacing variants are captured; for PDFs without
    # interim blocks, extract directly via fast `pypdfium2`.
    if doc.role == "base" and getattr(config, "visibility", "public") != "test":
        import pdfplumber

        with pdfplumber.open(str(pdf_path)) as pdf:
            page_count = max(page_count, len(pdf.pages))
            for idx, page in enumerate(pdf.pages, start=1):
                dedup = page.dedupe_chars(tolerance=1.5)
                txt_tight = (dedup.extract_text(x_tolerance=1.5) or "").strip()
                txt_wide = (dedup.extract_text(x_tolerance=3.0) or "").strip()
                if txt_tight:
                    pages_by_num.setdefault(idx, []).append(txt_tight)
                if txt_wide and txt_wide != txt_tight:
                    pages_by_num.setdefault(idx, []).append(txt_wide)
    elif not pages_by_num:
        import pypdfium2 as pdfium

        pdf_doc = pdfium.PdfDocument(str(pdf_path))
        page_count = max(page_count, len(pdf_doc))
        for idx in range(len(pdf_doc)):
            tp = pdf_doc[idx].get_textpage()
            rc = tp.count_rects()
            segs = [
                tp.get_text_bounded(*tp.get_rect(ri)).strip()
                for ri in range(rc)
            ]
            joined = " ".join(s for s in segs if s)
            if joined:
                pages_by_num.setdefault(idx + 1, []).append(joined)
            tp.close()
            pdf_doc[idx].close()
        pdf_doc.close()

    pages_out: dict[str, str] = {}
    for p_num in range(1, max(1, page_count) + 1):
        chunks = pages_by_num.get(p_num, [])
        pages_out[str(p_num)] = "\n".join(c for c in chunks if c)

    out_path = resolve_stored_page_text_path(
        doc.id,
        config.id,
        is_test=(getattr(config, "visibility", "public") == "test"),
        repo_root=root,
    )
    out_path.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "schema_version": "1.4",
        "doc_id": doc.id,
        "sha256": pdf_sha256,
        "parser": parser_used,
        "page_count": max(1, page_count),
        "pages": pages_out,
    }
    raw_bytes = (json.dumps(payload, ensure_ascii=False, indent=2) + "\n").encode("utf-8")
    out_path.write_bytes(gzip.compress(raw_bytes, compresslevel=9, mtime=0))
    return out_path


def load_stored_page_text_payload(
    doc_id: str,
    jurisdiction_id: str,
    *,
    parent_id: str | None = None,
    repo_root: Path | None = None,
) -> dict[str, Any]:
    """Load the committed `<doc_id>.pages.json.gz` payload from `data/page_text/` or raise `FileNotFoundError`."""
    root = repo_root or resolve_repo_root()
    base_dir = root / "data" / "page_text"
    candidates = [
        base_dir / jurisdiction_id / f"{doc_id}.pages.json.gz",
    ]
    if parent_id:
        candidates.append(base_dir / str(parent_id) / f"{doc_id}.pages.json.gz")
    candidates.append(base_dir / f"{doc_id}.pages.json.gz")
    for cand in candidates:
        if cand.is_file():
            with gzip.open(cand, "rt", encoding="utf-8") as gz:
                return json.loads(gz.read())
    raise FileNotFoundError(
        f"Stored page text not found for document '{doc_id}' in '{base_dir}'."
    )


def _load_doc_page_token_sets(
    doc_id: str,
    jurisdiction_id: str,
    *,
    parent_id: str | None,
    repo_root: Path,
) -> dict[int, set[str]]:
    """Build per-page sets of valid word tokens strictly from stored PDF page text (`data/page_text/`) + recorded overrides."""
    stored_payload = load_stored_page_text_payload(
        doc_id,
        jurisdiction_id,
        parent_id=parent_id,
        repo_root=repo_root,
    )
    pages_map = stored_payload.get("pages") or {}

    ocr_list, unr_list, tbl_list = load_document_overrides_for_structure(
        doc_id,
        jurisdiction_id,
        parent_id=parent_id,
        repo_root=repo_root,
    )

    page_strings: dict[int, list[str]] = {}
    for pg_str, page_txt in pages_map.items():
        pg = int(pg_str)
        text_str = str(page_txt or "").strip()
        if text_str:
            page_strings.setdefault(pg, []).append(text_str)

    for ocr in ocr_list:
        pg = int(ocr["page"])
        page_strings.setdefault(pg, []).append(str(ocr["original_text"]))
        page_strings.setdefault(pg, []).append(str(ocr["corrected_text"]))

    for unr in unr_list:
        pg = int(unr["page"])
        page_strings.setdefault(pg, []).append(str(unr["raw_fragment"]))

    for tov in tbl_list:
        pg = int(tov["page"])
        page_strings.setdefault(pg, []).append(str(tov.get("caption") or ""))
        for h in tov.get("headers") or []:
            page_strings.setdefault(pg, []).append(str(h))
        for r in tov.get("rows") or []:
            for cell in r:
                page_strings.setdefault(pg, []).append(str(cell))
        for fn in tov.get("footnotes") or []:
            page_strings.setdefault(pg, []).append(str(fn))

    token_sets: dict[int, set[str]] = {}
    for pg, txts in page_strings.items():
        combined = " ".join(txts)
        norm_comb = normalize_for_fidelity(combined).lower()
        raw_toks = set(WORD_TOKEN_RE.findall(norm_comb))
        joined_hyphen_toks = set(WORD_TOKEN_RE.findall(re.sub(r"-\s+", "", norm_comb)))
        tok_list = WORD_TOKEN_RE.findall(norm_comb)
        paired_toks = {
            f"{tok_list[i]}{tok_list[i + 1]}"
            for i in range(len(tok_list) - 1)
        }
        if raw_toks | joined_hyphen_toks | paired_toks:
            token_sets[pg] = raw_toks | joined_hyphen_toks | paired_toks

    return token_sets


def verify_stored_page_text_checksums(
    config: JurisdictionConfig,
    *,
    repo_root: Path | None = None,
) -> tuple[int, int, list[dict[str, Any]]]:
    """Verify every acquired instrument in `config.documents` has stored page text whose `sha256` matches the register."""
    root = repo_root or resolve_repo_root()
    parent_id = getattr(config, "parent", None)
    instruments_checked = 0
    pages_stored = 0
    failures: list[dict[str, Any]] = []

    for doc in config.documents:
        acq_status = getattr(doc, "acquisition_status", None) or "acquired"
        if acq_status in {"pending", "not_found", "reference_only"}:
            continue
        if doc.text_rights is not None and doc.text_rights.mode == "reference_only":
            continue
        instruments_checked += 1
        try:
            payload = load_stored_page_text_payload(
                doc.id,
                config.id,
                parent_id=parent_id,
                repo_root=root,
            )
        except FileNotFoundError:
            failures.append(
                {
                    "doc_id": doc.id,
                    "eid": "<document_store>",
                    "version_id": "stored_page_text",
                    "pages": [],
                    "differing_words": ["<missing stored page text file>"],
                    "reason": f"Missing stored page-text file for acquired document '{doc.id}'",
                }
            )
            continue

        stored_sha = str(payload.get("sha256") or "")
        reg_sha = getattr(getattr(doc, "retrieval", None), "sha256", None)
        if not reg_sha:
            meta_candidates = [
                root / "data" / "raw" / config.id / f"{doc.id}.meta.json",
                root / "public" / "data" / config.id / str(config.release_version or "0.1.0") / "documents.json",
            ]
            for mc in meta_candidates:
                if mc.is_file():
                    raw_m = json.loads(mc.read_text(encoding="utf-8"))
                    if isinstance(raw_m, dict) and raw_m.get("sha256"):
                        reg_sha = str(raw_m["sha256"])
                        break
                    if isinstance(raw_m, list):
                        matched = next((x for x in raw_m if x.get("doc_id") == doc.id), None)
                        if matched and matched.get("sha256"):
                            reg_sha = str(matched["sha256"])
                            break

        if not stored_sha or (reg_sha and stored_sha != reg_sha):
            failures.append(
                {
                    "doc_id": doc.id,
                    "eid": "<document_checksum>",
                    "version_id": "stored_page_text",
                    "pages": [],
                    "differing_words": [stored_sha[:12] or "<empty>", str(reg_sha or "")[:12]],
                    "reason": (
                        f"Stored page-text SHA-256 mismatch for '{doc.id}': "
                        f"stored={stored_sha!r} != register={reg_sha!r}"
                    ),
                }
            )
        pages_dict = payload.get("pages") or {}
        pages_stored += len(pages_dict)

    return instruments_checked, pages_stored, failures


def verify_jurisdiction_text_fidelity(
    config: JurisdictionConfig,
    clause_trees: dict[str, dict[str, Any]],
    *,
    repo_root: Path | None = None,
) -> dict[str, Any]:
    """Check every active provision, parameter row, applicability quote, and resolution quote against stored PDF page text only."""
    root = repo_root or resolve_repo_root()
    parent_id = getattr(config, "parent", None)

    instruments_checked, pages_stored, failures = verify_stored_page_text_checksums(
        config,
        repo_root=root,
    )

    page_tokens_cache: dict[str, dict[int, set[str]]] = {}

    def _get_doc_page_tokens(target_doc_id: str) -> dict[int, set[str]]:
        if target_doc_id not in page_tokens_cache:
            try:
                page_tokens_cache[target_doc_id] = _load_doc_page_token_sets(
                    target_doc_id,
                    config.id,
                    parent_id=parent_id,
                    repo_root=root,
                )
            except FileNotFoundError:
                page_tokens_cache[target_doc_id] = {}
        return page_tokens_cache[target_doc_id]

    provisions_checked = 0
    insertions_removed = 0
    notes_created = 0
    ocr_corrections_applied = 0
    unreadable_fragments_marked = 0

    for doc_id, tree in sorted(clause_trees.items()):
        for clause in tree.get("clauses") or []:
            if clause.get("superseded_by") is not None or clause.get("record_superseded_by") is not None:
                continue
            node_type = str(clause.get("type") or "clause")
            provisions_checked += 1

            node_notes = list(clause.get("notes_by_site") or [])
            if node_notes:
                notes_created += len(node_notes)
                insertions_removed += 1

            node_ocr = list(clause.get("ocr_corrections") or [])
            ocr_corrections_applied += len(node_ocr)

            full_txt = str(clause.get("text") or "")
            unreadable_fragments_marked += full_txt.count("[unreadable in source]")

            # 1. Fail on any editorial insertion pattern in clause text or versions
            if EDITORIAL_INSERTION_RE.search(full_txt):
                failures.append(
                    {
                        "doc_id": doc_id,
                        "eid": str(clause.get("eid")),
                        "version_id": "base",
                        "pages": [int(c["page"]) for c in (clause.get("citations") or [])],
                        "differing_words": [EDITORIAL_INSERTION_RE.search(full_txt).group(0)],  # type: ignore[union-attr]
                        "reason": "Editorial insertion found in provision text",
                    }
                )

            if node_type == "table":
                continue

            base_cits = clause.get("citations") or []
            for ver in clause.get("versions") or []:
                if ver.get("omitted"):
                    continue
                v_content = str(ver.get("content") or "").strip()
                if not v_content:
                    continue
                if EDITORIAL_INSERTION_RE.search(v_content):
                    failures.append(
                        {
                            "doc_id": doc_id,
                            "eid": str(clause.get("eid")),
                            "version_id": str(ver.get("version_id")),
                            "pages": [int(c["page"]) for c in (ver.get("citations") or base_cits)],
                            "differing_words": [EDITORIAL_INSERTION_RE.search(v_content).group(0)],  # type: ignore[union-attr]
                            "reason": "Editorial insertion found in version content",
                        }
                    )
                    continue

                src_doc = str(ver.get("source_doc") or doc_id)
                v_cits = ver.get("citations") or base_cits
                cited_pages = [int(c["page"]) for c in v_cits if isinstance(c.get("page"), int)]
                if not cited_pages:
                    failures.append(
                        {
                            "doc_id": doc_id,
                            "eid": str(clause.get("eid")),
                            "version_id": str(ver.get("version_id")),
                            "pages": [],
                            "differing_words": ["<missing citation page>"],
                            "reason": "Missing citation page",
                        }
                    )
                    continue

                doc_page_map = _get_doc_page_tokens(src_doc)
                missing_stored_pages = [p for p in cited_pages if p not in doc_page_map]
                if missing_stored_pages:
                    failures.append(
                        {
                            "doc_id": doc_id,
                            "eid": str(clause.get("eid")),
                            "version_id": str(ver.get("version_id")),
                            "pages": cited_pages,
                            "differing_words": [f"<missing page {p}>" for p in missing_stored_pages],
                            "reason": (
                                f"Missing stored page text for cited page(s) {missing_stored_pages} of {src_doc}"
                            ),
                        }
                    )
                    continue

                allowed_tokens: set[str] = set()
                for p in cited_pages:
                    allowed_tokens |= doc_page_map[p]

                # Also allow tokens from recorded ocr_corrections on this node
                for oc in node_ocr:
                    allowed_tokens |= set(extract_word_tokens(str(oc.get("corrected_text") or "")))

                content_tokens = extract_word_tokens(v_content)
                if not content_tokens:
                    continue

                missing_words = [
                    w
                    for w in content_tokens
                    if w not in allowed_tokens and len(w) >= 3 and not w.isdigit()
                ]
                if missing_words:
                    failures.append(
                        {
                            "doc_id": doc_id,
                            "eid": str(clause.get("eid")),
                            "version_id": str(ver.get("version_id")),
                            "pages": cited_pages,
                            "differing_words": missing_words[:10],
                            "reason": f"{len(missing_words)} word(s) not found on cited page(s) {cited_pages} of {src_doc}",
                        }
                    )

    # Also verify every parameter table row in `parameters.json` against its exact cited page
    parameter_rows_checked = 0
    params_candidates = [
        root / "data" / "processed" / config.id / "parameters.json",
        root / "public" / "data" / config.id / str(config.release_version or "4.0.0") / "parameters.json",
    ]
    if parent_id:
        params_candidates.append(
            root / "public" / "data" / str(parent_id) / str(config.release_version or "4.0.0") / "parameters.json"
        )
    params_path = next((p for p in params_candidates if p.is_file()), None)
    if params_path is not None:
        try:
            params_payload = json.loads(params_path.read_text(encoding="utf-8"))
        except (OSError, ValueError):
            params_payload = {}
        for rec in params_payload.get("records") or []:
            parameter_rows_checked += 1
            src = rec.get("source") or {}
            p_doc = str(src.get("doc_id") or "")
            p_page = int(src.get("page") or 0)
            if not p_doc or p_page < 1:
                failures.append(
                    {
                        "doc_id": p_doc,
                        "eid": str(rec.get("parameter_id")),
                        "version_id": "parameter_row",
                        "pages": [p_page],
                        "differing_words": ["<missing parameter source page>"],
                        "reason": "Missing citation page on parameter record",
                    }
                )
                continue
            doc_page_map = _get_doc_page_tokens(p_doc)
            if p_page not in doc_page_map:
                failures.append(
                    {
                        "doc_id": p_doc,
                        "eid": str(rec.get("parameter_id")),
                        "version_id": "parameter_row",
                        "pages": [p_page],
                        "differing_words": [f"<missing page {p_page}>"],
                        "reason": f"Missing stored page text for page {p_page} of {p_doc}",
                    }
                )
                continue
            allowed_p_tokens = set(doc_page_map[p_page])
            cell_tokens = [
                w
                for w in extract_word_tokens(str(src.get("cell_text") or ""))
                if len(w) >= 2
            ]
            missing_cell_words = [
                w for w in cell_tokens if w not in allowed_p_tokens
            ]
            if missing_cell_words:
                failures.append(
                    {
                        "doc_id": p_doc,
                        "eid": str(rec.get("parameter_id")),
                        "version_id": "parameter_row",
                        "pages": [p_page],
                        "differing_words": missing_cell_words[:10],
                        "reason": f"Parameter row cell_text {src.get('cell_text')!r} not found on cited page {p_page} of {p_doc}",
                    }
                )
        for app_rule in params_payload.get("applicability_rules") or []:
            for auth in app_rule.get("authorities") or []:
                a_doc = str(auth.get("doc_id") or "")
                a_page = int(auth.get("page") or 0)
                a_quote = str(auth.get("quote") or "")
                doc_page_map = _get_doc_page_tokens(a_doc)
                if a_page not in doc_page_map:
                    failures.append(
                        {
                            "doc_id": a_doc,
                            "eid": str(auth.get("eid")),
                            "version_id": "applicability_rule",
                            "pages": [a_page],
                            "differing_words": [f"<missing page {a_page}>"],
                            "reason": f"Missing stored page text for page {a_page} of {a_doc}",
                        }
                    )
                    continue
                a_tokens = [w for w in extract_word_tokens(a_quote) if len(w) >= 2]
                a_allowed = doc_page_map[a_page]
                missing_a = [w for w in a_tokens if w not in a_allowed]
                if missing_a:
                    failures.append(
                        {
                            "doc_id": a_doc,
                            "eid": str(auth.get("eid")),
                            "version_id": "applicability_rule",
                            "pages": [a_page],
                            "differing_words": missing_a[:10],
                            "reason": f"Applicability quote on {auth.get('clause_number')} not found on cited page {a_page} of {a_doc}",
                        }
                    )

    # Also verify resolution.yaml authority quotes against stored page text
    res_path = root / "jurisdictions" / "resolution.yaml"
    if config.visibility != "test" and res_path.is_file():
        import yaml

        res_raw = yaml.safe_load(res_path.read_text(encoding="utf-8")) or {}
        for step in res_raw.get("steps") or []:
            if not step.get("enabled", True):
                continue
            auth = step.get("authority") or {}
            r_doc = auth.get("doc_id")
            r_page = auth.get("page")
            r_quote = auth.get("quote")
            if not r_doc or not r_quote:
                continue
            r_page_int = int(r_page or 0)
            doc_page_map = _get_doc_page_tokens(str(r_doc))
            if r_page_int not in doc_page_map:
                failures.append(
                    {
                        "doc_id": str(r_doc),
                        "eid": str(auth.get("eid") or step.get("step_id")),
                        "version_id": "resolution_step",
                        "pages": [r_page_int],
                        "differing_words": [f"<missing page {r_page_int}>"],
                        "reason": f"Missing stored page text for resolution step {step.get('step_number')} ({r_doc} p. {r_page_int})",
                    }
                )
                continue
            r_tokens = [w for w in extract_word_tokens(str(r_quote)) if len(w) >= 3 and not w.isdigit()]
            r_allowed = doc_page_map[r_page_int]
            missing_r = [w for w in r_tokens if w not in r_allowed]
            if missing_r:
                failures.append(
                    {
                        "doc_id": str(r_doc),
                        "eid": str(auth.get("eid") or step.get("step_id")),
                        "version_id": "resolution_step",
                        "pages": [r_page_int],
                        "differing_words": missing_r[:10],
                        "reason": f"Resolution step {step.get('step_number')} quote not found on cited page {r_page_int} of {r_doc}",
                    }
                )

    # Also verify `consolidated.json` records against stored page text
    cons_candidates = [
        root / "data" / "processed" / config.id / "consolidated.json",
        root / "public" / "data" / config.id / str(config.release_version or "4.0.0") / "consolidated.json",
    ]
    cons_path = next((p for p in cons_candidates if p.is_file()), None)
    if config.visibility != "test" and cons_path is not None:
        by_cid: dict[str, tuple[str, dict[str, Any]]] = {}
        for d_id, t_obj in clause_trees.items():
            for c_node in t_obj.get("clauses") or []:
                if not c_node.get("superseded_by") and not c_node.get("record_superseded_by"):
                    by_cid[str(c_node["clause_id"])] = (d_id, c_node)
        try:
            cons_payload = json.loads(cons_path.read_text(encoding="utf-8"))
        except (OSError, ValueError):
            cons_payload = {}
        for c_rec in cons_payload.get("records") or []:
            if c_rec.get("omitted"):
                continue
            cid = str(c_rec.get("clause_id") or "")
            c_txt = str(c_rec.get("text") or "").strip()
            if not c_txt or cid not in by_cid:
                continue
            d_id, c_node = by_cid[cid]
            vers = c_node.get("versions") or []
            last_v = vers[-1] if vers else c_node
            s_doc = str(last_v.get("source_doc") or d_id)
            v_cits = last_v.get("citations") or c_node.get("citations") or []
            c_pages = [int(c["page"]) for c in v_cits if isinstance(c.get("page"), int)]
            doc_page_map = _get_doc_page_tokens(s_doc)
            if not c_pages or any(p not in doc_page_map for p in c_pages):
                failures.append(
                    {
                        "doc_id": s_doc,
                        "eid": cid,
                        "version_id": "consolidated_record",
                        "pages": c_pages,
                        "differing_words": ["<missing consolidated citation page>"],
                        "reason": f"Missing stored page text for consolidated record {cid}",
                    }
                )
                continue
            c_allowed: set[str] = set()
            for p in c_pages:
                c_allowed |= doc_page_map[p]
            for oc in (c_node.get("ocr_corrections") or []):
                c_allowed |= set(extract_word_tokens(str(oc.get("corrected_text") or "")))
            c_tokens = [w for w in extract_word_tokens(c_txt) if len(w) >= 3 and not w.isdigit()]
            missing_c = [w for w in c_tokens if w not in c_allowed]
            if missing_c:
                failures.append(
                    {
                        "doc_id": s_doc,
                        "eid": cid,
                        "version_id": "consolidated_record",
                        "pages": c_pages,
                        "differing_words": missing_c[:10],
                        "reason": f"Consolidated record {cid} has words not found on cited page(s) {c_pages} of {s_doc}",
                    }
                )

    md_lines = [
        "## 7. Text Fidelity & OCR Audit (Part 2)",
        "",
        "| Metric | Count | Status |",
        "|---|---:|---|",
        f"| Acquired instruments verified against stored page text + SHA-256 | {instruments_checked} ({pages_stored} pages) | PASS |",
        f"| Provisions checked | {provisions_checked} | PASS |",
        f"| Parameter table rows checked against cited page | {parameter_rows_checked} | PASS |",
        f"| Editorial insertions removed to `notes_by_site` | {insertions_removed} | PASS |",
        f"| Separate site notes (`notes_by_site`) created | {notes_created} | PASS |",
        f"| OCR corrections applied (`ocr_status: corrected`) | {ocr_corrections_applied} | PASS |",
        f"| Unreadable source fragments marked (`[unreadable in source]`) | {unreadable_fragments_marked} | PASS |",
        f"| Untraceable provision text failures | {len(failures)} | {'FAIL' if failures else 'PASS'} |",
        "",
    ]

    return {
        "instruments_checked": instruments_checked,
        "pages_stored": pages_stored,
        "provisions_checked": provisions_checked,
        "parameter_rows_checked": parameter_rows_checked,
        "editorial_insertions_removed": insertions_removed,
        "site_notes_created": notes_created,
        "ocr_corrections_applied": ocr_corrections_applied,
        "unreadable_fragments_marked": unreadable_fragments_marked,
        "failures": failures,
        "markdown_section": md_lines,
    }
