"""Part 1 CI checks: uniform release across all jurisdictions/pages and zero internal references in public copy."""

from __future__ import annotations

import json
import re

from bylaws.root import resolve_repo_root
from bylaws.schema_validator import validate_file

REPO_ROOT = resolve_repo_root()
PUBLIC_DATA_DIR = REPO_ROOT / "public" / "data"

FORBIDDEN_PUBLIC_PATTERNS: tuple[tuple[str, re.Pattern[str]], ...] = (
    ("PR number", re.compile(r"\bPR\s+0?\d+\b")),
    (
        "Internal plan name",
        re.compile(
            r"\b(Plan\s+v\d+|building-code-plan|trustworthy-simple-building-code|00-overview\.md)\b",
            re.IGNORECASE,
        ),
    ),
    ("Schema version label", re.compile(r"\bSchema\s+v?1\.\d+\b", re.IGNORECASE)),
    (
        "Stale release notice",
        re.compile(r"Two base documents published|pending in PR", re.IGNORECASE),
    ),
    (
        "Old-design marker",
        re.compile(
            r"Structured Building Bylaws|Statutory Resolution Cards|Local Graph|Local Knowledge Graph|One-Hop Neighborhood|\btopic:[a-z_]+",
            re.IGNORECASE,
        ),
    ),
)


def test_every_public_jurisdiction_reports_the_same_active_release() -> None:
    """Every public jurisdiction in `manifest.json` reports the exact same `latest_release` with valid declarations and documents."""
    manifest = validate_file(PUBLIC_DATA_DIR / "manifest.json", "manifest")
    public_jurs = [
        j for j in manifest["jurisdictions"] if j.get("visibility") != "test"
    ]
    assert len(public_jurs) >= 6

    latest_versions = {j["latest_release"] for j in public_jurs}
    assert len(latest_versions) == 1, (
        f"Expected a single active release across all public jurisdictions, got {latest_versions}"
    )
    active_version = next(iter(latest_versions))
    assert active_version is not None

    for jur in public_jurs:
        jid = jur["id"]
        rel = next(
            (r for r in jur["releases"] if r["version"] == active_version),
            None,
        )
        assert rel is not None, f"{jid} missing active release {active_version}"
        assert rel["status"] == "published"

        decl_path = REPO_ROOT / "public" / str(rel["declarations"]).lstrip("/")
        docs_path = REPO_ROOT / "public" / str(rel["files"]["documents"]).lstrip("/")
        assert decl_path.is_file(), f"Missing {decl_path}"
        assert docs_path.is_file(), f"Missing {docs_path}"

        decl_text = decl_path.read_text(encoding="utf-8")
        docs_text = docs_path.read_text(encoding="utf-8")
        for label, pattern in FORBIDDEN_PUBLIC_PATTERNS:
            assert not pattern.search(decl_text), (
                f"{decl_path} contains forbidden {label}: {pattern.search(decl_text)}"
            )
            assert not pattern.search(docs_text), (
                f"{docs_path} contains forbidden {label}: {pattern.search(docs_text)}"
            )


def test_no_internal_references_in_public_ui_copy() -> None:
    """Public UI pages and components do not render internal PR numbers, plan names, or schema version labels."""
    ui_files = [
        *sorted((REPO_ROOT / "app").rglob("*.tsx")),
        *sorted((REPO_ROOT / "components").rglob("*.tsx")),
    ]
    assert len(ui_files) >= 15

    for tsx_path in ui_files:
        raw = tsx_path.read_text(encoding="utf-8")
        # Strip JS/TS comments before scanning public JSX copy
        no_block_comments = re.sub(r"/\*[\s\S]*?\*/", "", raw)
        no_line_comments = re.sub(r"//.*", "", no_block_comments)
        for label, pattern in FORBIDDEN_PUBLIC_PATTERNS:
            match = pattern.search(no_line_comments)
            assert match is None, (
                f"{tsx_path.relative_to(REPO_ROOT)} contains forbidden {label}: {match.group(0)!r}"
            )
        assert "schema_version" not in no_line_comments, (
            f"{tsx_path.relative_to(REPO_ROOT)} exposes 'schema_version' in UI code"
        )


def test_zero_human_verified_records_across_published_datasets() -> None:
    """Nothing in any published dataset is marked `human_verified` (Decision 8)."""
    manifest = json.loads((PUBLIC_DATA_DIR / "manifest.json").read_text(encoding="utf-8"))
    for jur in manifest["jurisdictions"]:
        if jur.get("visibility") == "test":
            continue
        active_ver = jur["latest_release"]
        rel_dir = PUBLIC_DATA_DIR / jur["id"] / active_ver
        for json_file in sorted(rel_dir.glob("*.json")):
            text = json_file.read_text(encoding="utf-8")
            assert '"human_verified"' not in text, (
                f"{json_file.relative_to(REPO_ROOT)} contains forbidden human_verified claim"
            )


def _strip_details_and_tags(html: str) -> str:
    cleaned = re.sub(r"<script\b[^>]*>[\s\S]*?</script>", " ", html, flags=re.IGNORECASE)
    cleaned = re.sub(r"<style\b[^>]*>[\s\S]*?</style>", " ", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"<svg\b[^>]*>[\s\S]*?</svg>", " ", cleaned, flags=re.IGNORECASE)
    inner_details_re = re.compile(
        r"<details\b[^>]*>(?:(?!<details\b)[\s\S])*?</details>",
        re.IGNORECASE,
    )
    prev = None
    while prev != cleaned:
        prev = cleaned
        cleaned = inner_details_re.sub(" ", cleaned)
    return re.sub(r"<[^>]+>", " ", cleaned)


def test_built_html_primary_layer_language_check_outside_details() -> None:
    """Section 3.3 CI language check: built pages contain zero internal IDs, enum names, or raw unit tokens (`sq_m`) outside `<details>` expanders."""
    next_app_dir = REPO_ROOT / ".next" / "server" / "app"
    if not next_app_dir.is_dir():
        return

    forbidden_primary: list[tuple[str, re.Pattern[str]]] = [
        *FORBIDDEN_PUBLIC_PATTERNS,
        (
            "Internal document/jurisdiction ID",
            re.compile(
                r"\b(bbl-2003|rmp2015-zr|in-ka-bengaluru(?:-south|-north|-central|-east|-west)?|xx-test-fixture|part_I__|sec_1\.0|chp_4__)\b"
            ),
        ),
        (
            "Raw enum name",
            re.compile(
                r"\b(in_force|status_unknown|reference_only|state_rules|far_base_max|ground_coverage_max_pct|setback_front_min_m|m2_per_car_space|pct_of_plot_depth)\b"
            ),
        ),
        (
            "Raw unit token",
            re.compile(r"\b(sq_m|sq_ft)\b"),
        ),
    ]

    html_files = sorted(next_app_dir.rglob("*.html"))
    assert len(html_files) >= 10
    for html_path in html_files:
        rel = html_path.relative_to(next_app_dir).as_posix()
        if "xx-test-fixture" in rel or "_not-found" in rel:
            continue
        primary_txt = _strip_details_and_tags(html_path.read_text(encoding="utf-8"))
        assert "Bylaw One" in primary_txt, f"{rel} missing 'Bylaw One' wordmark"
        for label, pat in forbidden_primary:
            m = pat.search(primary_txt)
            assert m is None, (
                f"{rel} primary layer outside <details> contains {label}: {m.group(0)!r}"
            )
        # Old-design check (Part 3.4): fail even inside <details> if old-design markers appear anywhere in visible HTML
        raw_html = html_path.read_text(encoding="utf-8")
        visible_all = re.sub(
            r"<[^>]+>",
            " ",
            re.sub(
                r"<(script|style)\b[^>]*>[\s\S]*?</\1>",
                " ",
                raw_html,
                flags=re.IGNORECASE,
            ),
        )
        old_design_re = re.compile(
            r"Structured Building Bylaws|Statutory Resolution Cards|Local Graph|Local Knowledge Graph|One-Hop Neighborhood|\btopic:[a-z_]+",
            re.IGNORECASE,
        )
        m_old = old_design_re.search(visible_all)
        assert m_old is None, (
            f"{rel} built HTML contains forbidden old-design marker: {m_old.group(0)!r}"
        )


def test_part3_one_name_and_date_per_instrument_from_register() -> None:
    """One Build, Correct Citations Part 3: Every instrument reference (`Replaced by <name>, <date>`) in `parameters.json` and built HTML pages takes its plain name and date from `documents.json`, and zero `20 January 2026` / `2026-01-20` references remain."""
    from bylaws.parameters import _format_human_date_plain, _format_short_doc_label

    manifest = json.loads((PUBLIC_DATA_DIR / "manifest.json").read_text(encoding="utf-8"))
    public_jurs = [j for j in manifest["jurisdictions"] if j.get("visibility") != "test"]

    registered_replaced_labels: set[str] = set()
    for jur in public_jurs:
        rel_dir = PUBLIC_DATA_DIR / jur["id"] / str(jur["latest_release"])
        docs = json.loads((rel_dir / "documents.json").read_text(encoding="utf-8"))
        for d in docs:
            plain_title = _format_short_doc_label(type("DocObj", (), {"title": d.get("title")})(), d["doc_id"])
            dt = _format_human_date_plain(d.get("effective_from") or d.get("notified_date"))
            registered_replaced_labels.add(f"Replaced by {plain_title}, {dt}")
            registered_replaced_labels.add(f"Replaced by {plain_title}")

    for jur in public_jurs:
        rel_dir = PUBLIC_DATA_DIR / jur["id"] / str(jur["latest_release"])
        params_text = (rel_dir / "parameters.json").read_text(encoding="utf-8")
        assert "20 January 2026" not in params_text, f"Stale '20 January 2026' in {jur['id']} parameters.json"
        assert "2026-01-20" not in params_text, f"Stale '2026-01-20' in {jur['id']} parameters.json"
        assert "Setbacks, Basements and Industrial Norms" not in params_text

        params = json.loads(params_text)
        for rec in params["records"]:
            note = str(rec.get("note") or "").strip()
            if note.startswith("Replaced by "):
                assert note in registered_replaced_labels, (
                    f"Unregistered instrument reference in {jur['id']} {rec['parameter_id']}: {note!r}"
                )


def test_part5_byelaw_6_0_i_corporation_wording_and_byelaw_1_4_label_check() -> None:
    """One Build, Correct Citations Part 5: In each corporation view, bye-law 6.0(i) shows that corporation's May 2026 wording tagged 'Changed May 2026, [corporation]' with previous wording on tap and citation to p. 2 of the amendment; on Greater Bengaluru, 6.0(i) shows the 2003 wording with 'Each City Corporation changed this rule in May 2026. Choose a corporation to see its wording.'; and 'Master plan rules apply instead (bye-law 1.4)' appears only on Bye-law 1.4 subjects."""
    next_app_dir = REPO_ROOT / ".next" / "server" / "app"
    if not next_app_dir.is_dir():
        return

    allowed_byelaw14_slugs = {
        "land-use",
        "ground-coverage",
        "far",
        "setbacks",
        "projections-and-open-spaces",
        "height",
        "parking",
    }

    for html_path in sorted(next_app_dir.rglob("*.html")):
        rel = html_path.relative_to(next_app_dir).as_posix()
        clean_html = re.sub(r"<!--[\s\S]*?-->", "", html_path.read_text(encoding="utf-8"))
        if "Master plan rules apply instead (bye-law 1.4)" in clean_html:
            m_topic = re.match(r"^j/[a-z0-9-]+/topics/([a-z0-9-]+)\.html$", rel)
            assert m_topic is not None and m_topic.group(1) in allowed_byelaw14_slugs, (
                f"Label check failed: 'Master plan rules apply instead (bye-law 1.4)' found on non-Bye-law-1.4 route {rel}"
            )
            for li_m in re.finditer(
                r'<li\b[^>]*data-technical-address="([^"]+)"[^>]*>([\s\S]*?)</li>',
                clean_html,
            ):
                addr, body = li_m.group(1), li_m.group(2)
                if "Master plan rules apply instead (bye-law 1.4)" in body:
                    assert addr != "bbl-2003:part_II__sec_6.0__item_i"
                    assert not addr.lower().startswith("bbl-2003:part_ii__")
                    assert not addr.lower().startswith("bbl-2003:part_v__")

    # Verify Greater Bengaluru view of 6.0(i)
    city_setbacks = re.sub(
        r"<!--[\s\S]*?-->",
        "",
        (next_app_dir / "j" / "in-ka-bengaluru" / "topics" / "setbacks.html").read_text(encoding="utf-8"),
    )
    m_city_60i = re.search(
        r'<li\b[^>]*data-technical-address="bbl-2003:part_II__sec_6\.0__item_i"[^>]*>([\s\S]*?)</li>',
        city_setbacks,
    )
    assert m_city_60i is not None
    city_60i_html = m_city_60i.group(1)
    assert "within 5% of" in city_60i_html
    assert "Each City Corporation changed this rule in May 2026. Choose a corporation to see its wording." in city_60i_html
    assert "Master plan rules apply instead" not in city_60i_html

    # Verify each of the 5 City Corporations shows its May 2026 wording for 6.0(i)
    for corp_id, corp_name in (
        ("in-ka-bengaluru-central", "Bengaluru Central City Corporation"),
        ("in-ka-bengaluru-north", "Bengaluru North City Corporation"),
        ("in-ka-bengaluru-south", "Bengaluru South City Corporation"),
        ("in-ka-bengaluru-east", "Bengaluru East City Corporation"),
        ("in-ka-bengaluru-west", "Bengaluru West City Corporation"),
    ):
        corp_setbacks = re.sub(
            r"<!--[\s\S]*?-->",
            "",
            (next_app_dir / "j" / corp_id / "topics" / "setbacks.html").read_text(encoding="utf-8"),
        )
        m_corp_60i = re.search(
            r'<li\b[^>]*data-technical-address="bbl-2003:part_II__sec_6\.0__item_i"[^>]*>([\s\S]*?)</li>',
            corp_setbacks,
        )
        assert m_corp_60i is not None, f"Missing 6.0(i) on {corp_id} Setbacks HTML"
        corp_60i_html = m_corp_60i.group(1)
        assert "Table-2B below" in corp_60i_html
        assert f"Changed May 2026, {corp_name}" in corp_60i_html
        assert "#page=2" in corp_60i_html
        assert "Previous wording (" in corp_60i_html
        assert "within 5% of" in corp_60i_html
        assert "Master plan rules apply instead" not in corp_60i_html


