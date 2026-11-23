# Specifications Index

> **Specs are pre-implementation artifacts** — what you *planned*. They capture conceptual design
> intent, high-level decisions, and the "why" behind features. Specs are human-curated,
> flat in structure, and deliberately size-controlled for quick reading.
>
> Contrast with [`docs/memory/index.md`](../memory/index.md): memory files are *post-implementation* —
> what actually happened. Memory files are the authoritative source of truth for system behavior,
> maintained by `/fab-continue` (hydrate).
>
> **Ownership**: Specs are written and maintained by humans. No automated tooling creates or
> enforces structure here — organize files however makes sense for your project.

| Spec | Description |
|------|-------------|
| [`../plan.md`](../plan.md) | Structured Building Bylaws — Phase 1 Plan (canonical requirements, data model, pipeline stages, web app, and milestones M0–M9) |
| [`../plan-v1.1.md`](../plan-v1.1.md) | Structured Building Bylaws — Plan v1.1: Next Phase (open data setup, Rules R4/R7/R8/R9, Schema v1.1, M1.5 vertical slice, dg2n UI, M2, and M3) |
| [`../schema.md`](../schema.md) | Human-readable specification of the 8 versioned Draft 2020-12 JSON Schemas (Schema v1.1) |
| [`../decisions/001-parsers-and-licences.md`](../decisions/001-parsers-and-licences.md) | ADR-001: Permissive PDF parser and geospatial library selection (R4 licensing hygiene) |
| [`../decisions/002-open-data-and-indicodes-practices.md`](../decisions/002-open-data-and-indicodes-practices.md) | ADR-002: Open data licensing (Apache-2.0 / CC BY 4.0), strict permissive dependency policy, and Indicodes Rules practices |
