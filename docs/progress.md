# Phase 1 Progress Tracker

Tracks completion of the milestones defined in [`docs/plan.md`](plan.md) §13.

## Milestone Summary

| Milestone | Title | Status | Change | Date |
|-----------|-------|--------|--------|------|
| **M0** | Scaffold | ✅ Complete | `261123-a5ou-m0-m1-scaffold-schemas-fixture` | 2026-11-23 |
| **M1** | Schemas, config loader, fixture | ✅ Complete | `261123-a5ou-m0-m1-scaffold-schemas-fixture` | 2026-11-23 |
| **M2** | Acquisition | ⏳ Pending | — | — |
| **M3** | Parsing and comparison | ⏳ Pending | — | — |
| **M4** | Structure, amendments, validation | ⏳ Pending | — | — |
| **M5** | Planning district selection and boundaries | ⏳ Pending | — | — |
| **M6** | Zoning map | ⏳ Pending | — | — |
| **M7** | Zone tagging | ⏳ Pending | — | — |
| **M8** | Publish and web app | ⏳ Pending | — | — |
| **M9** | Review and release 0.1.0 | ⏳ Pending | — | — |

---

## Completed Milestones

### M0 — Scaffold (2026-11-23)

- Repository structure created matching Plan §6 (`docs/`, `jurisdictions/`, `schemas/`, `pipeline/`, `data/overrides/`, `data/reports/`, `web/`, `.github/workflows/ci.yml`).
- `uv`-managed Python package in `pipeline/` (`pyproject.toml` + `uv.lock`) with `bylaws` CLI entry point (`pipeline/bylaws/cli.py`).
- Next.js (App Router, TypeScript, Tailwind CSS, Leaflet) web skeleton in `web/` with routes `/`, `/j/[id]`, `/j/[id]/clauses`, `/j/[id]/review` and centralized data client `web/lib/data.ts`.
- Acceptance criteria verified:
  - ✅ `bylaws --help` works.
  - ✅ `bylaws <cmd>` without `--jurisdiction` exits non-zero with a clear error message across all 9 subcommands.
  - ✅ Python (`pytest`) and Web (`lint`, `typecheck`, `test`, `build`) checks green.

### M1 — Schemas, config loader, fixture (2026-11-23)

- Created all 6 Draft 2020-12 JSON Schemas in `schemas/`:
  - `jurisdiction.schema.json`
  - `document.schema.json`
  - `clause-tree.schema.json`
  - `zones.schema.json`
  - `overrides.schema.json`
  - `manifest.schema.json`
- Implemented `pipeline/bylaws/schema_validator.py` and `pipeline/bylaws/config.py` (`load_jurisdiction_config`, `ConfigValidationError`).
- Created synthetic fixture jurisdiction `jurisdictions/_fixture-test.yaml` and deterministic synthetic PDF/KML/JSON/YAML fixtures in `pipeline/tests/fixtures/`.
- Implemented `pipeline/tests/test_r1_no_hardcoding.py` enforcing Non-Negotiable Rule R1 across `pipeline/` and `web/`.
- Acceptance criteria verified:
  - ✅ Fixture config (`_fixture-test.yaml`) and all 6 schema sample payloads validate cleanly.
  - ✅ Invalid configs and malformed payloads fail with clear field-level validation messages.
  - ✅ R1 static check passes and catches synthetic violations.
