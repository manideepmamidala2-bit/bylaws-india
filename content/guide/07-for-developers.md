---
id: for-developers
number: "07"
title: "For developers"
kicker: "07 / Architecture, Pipeline & Planned Agent Engine"
audiences: [developer, practitioner]
diagrams: [agent-engine-four-doors]
screenshots: []
---

## Slide summary

The repository separates a Python data pipeline (`pipeline/`) from a static Next.js reader (`app/`) across 15 JSON Schemas (`schemas/`). A planned local TypeScript agent engine will expose four doors: MCP server, CLI, Agent Skill, and open data files.

## Presenter notes

For developers and technical contributors, the repository has a clean two-half architecture. The offline Python 3.12+ pipeline (`pipeline/`, managed with `uv`) acquires PDFs, parses tables, structures provisions, applies amendments, extracts parameters, georeferences map sheets, and validates outputs against fifteen Draft 2020-12 JSON Schemas in `schemas/`. The Next.js App Router frontend at the repository root (`app/`, `components/`, `lib/`) is a static, read-only reader with zero city-specific constants (Rule R1). We are also designing the planned local agent engine for the launch: one small TypeScript engine running on the user's own machine with separately updated data packs, offline keyword and meaning-based search, and four doors — a local MCP server, a CLI, an Agent Skill teaching the honesty rules, and the open data files themselves.

## Reading version

### Repository layout, data model & running the pipeline

- **Repository layout:** `schemas/` (15 Draft 2020-12 JSON Schemas), `jurisdictions/` (declarative YAML configs), `data/overrides/<id>/` (committed OCR corrections, table overrides, zone tags, and workshop verifications), `data/page_text/` (SHA-256-verified per-page text store), `pipeline/` (`uv`-managed Python CLI `bylaws`), and `app/`, `components/`, `lib/` (Next.js App Router web reader).
- **Data model:** Three layers — Layer 1 faithful provision trees (`clauses.json` / per-chapter outlines), Layer 2 stand-off annotations (`annotations.json`), and Layer 3 dated amendment effects (`amendments.json`, `consolidated.json`, `parameters.json`, `resolution.yaml`, `relations.json`).
- **Running the pipeline & adding a source or city:** Run `uv run bylaws <stage> --jurisdiction <id>` (`acquire → parse → structure → amendments → parameters → relations → geo → apply-overrides → validate → publish`). Adding a source or a new city requires only declarative entries in `jurisdictions/<id>.yaml` and `data/overrides/<id>/` — zero city names or zone codes are ever hard-coded in Python or TypeScript (`Rule R1`).
- **Contribution rules:** Permissive dependencies only (`Apache-2.0`, `MIT`, `BSD` — `Rule R4`), immutable raw sources (`Rule R5`), deterministic builds (`Rule R6`), and zero invented legal text (`test_text_fidelity.py`).

### The planned pack format & agent engine (planned, for the launch)

- **Planned pack format:** Downloadable national, state, and city packs (**planned**) storing shared text once and recording `adopted`, `adopted with changes`, or `reference only` links between layers.
- **One small engine (planned):** Written in TypeScript, running on the user's own machine; data packs installed separately and updated as new rules are added.
- **Four doors (planned):** (1) a local MCP server (for Claude, Cursor, VS Code, Gemini CLI, Codex and other MCP apps); (2) a command line for any agent that can run commands; (3) an Agent Skill that teaches any agent the honesty rules (cite the page, label derived values, ask for missing plot details, confirm with the authority); (4) the open data files themselves.
- **Offline search & planned tools:** Keyword search built in and meaning-based search with a small bundled model (**planned**). Planned tools: search rules; get a provision; resolve a plot (asks for missing dimensions instead of guessing); what changed; compare places; get sources.
- **Planned installation:** Planned as a one-click bundle for AI desktop apps and native installers for Windows, macOS and Linux. A hosted endpoint for ChatGPT and web assistants comes later. (Install steps will be published only when the engine and installers ship; until then, see [Use with AI](/use-with-ai) for `/llms.txt`, `.md` pages, and `/api/v1/`.)
