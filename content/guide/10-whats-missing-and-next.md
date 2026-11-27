---
id: whats-missing-and-next
number: "10"
title: "What's missing and what's next"
kicker: "10 / Declared Coverage Gaps & Roadmap"
audiences: [college, student, practitioner, developer, partner-funder]
diagrams: []
screenshots: [pilot-page]
---

## Slide summary

Every gap is declared openly: land-use zones currently cover {{processed_sheets}} ({{map_coverage_pct}} of Greater Bengaluru) and the July 2025 amendment PDF is unobtained. Next: Bengaluru complete, Karnataka, other states with steward colleges, and the planned agent engine.

## Presenter notes

Honesty about what is missing is just as important as what works today. Every gap in our pilot dataset is declared openly in `declarations.json` and shown on the Pilot page: land-use zone polygons currently cover {{processed_sheets}} in parts of Bengaluru South ({{active_zones}} zone polygons, {{map_coverage_pct}} of Greater Bengaluru), with uncovered areas marked by a diagonal hatch on the map; the July 2025 zoning amendment PDF could not yet be obtained from public sources; the October 2024 Kannada compilation is unstructured in favour of the English original plus the 8 English amendments; and fire, TDR, NBC 2016, and aviation instruments are listed by reference. Our four-step roadmap takes us from completing Bengaluru's map sheets and workshops to Karnataka, other states, and shipping the planned local agent engine.

## Reading version

### What is missing today (from `declarations.json`)

Every coverage gap is declared openly on the [Pilot page](/pilot#what-is-missing):

- **Land-use zone polygons (`{{processed_sheets}}`, `{{map_coverage_pct}}` of Greater Bengaluru):** Currently cover `{{active_zones}}` zone polygons in Planning Districts `2.10` Jayanagar and `2.11` Banashankari in Bengaluru South; uncovered areas on the map are marked with a diagonal hatch (`"Land-use data not yet available"`).
- **July 2025 zoning amendment (`UDD 85 MNJ 2025`):** The official gazette PDF could not be obtained from public sources (direct download returns HTTP 403 and no Wayback Machine snapshot exists), so consolidated zoning text and parameter values may not reflect changes made in July 2025.
- **October 2024 Kannada compilation:** Published in Kannada only as an convenience compilation and not structured; this dataset uses the English original together with the 8 structured English amending notifications.
- **Supporting & reference-only instruments:** Karnataka Fire and Emergency Services NOC rules, standalone TDR procedural rules, and Occupancy Certificate exemption orders are not yet in the dataset; the National Building Code of India 2016 (copyrighted by BIS) and Airports Authority of India NOCAS colour-coded zoning map are listed as reference only (`Rule R13`).

### What comes next

1. **Bengaluru complete:** Georeferencing and extracting the remaining RMP 2015 land-use sheets across all `{{corporations}}` City Corporations, acquiring remaining notifications, and running student and practitioner verification workshops.
2. **Karnataka:** Extending the same schema and pipeline across urban development authorities and municipal corporations in Karnataka.
3. **Other states:** Partnering with colleges of architecture, planning, and law as state stewards to bring other Indian cities and states into Bylaw One.
4. **Local agent engine (planned):** Shipping the planned local MCP server, CLI, and Agent Skill so practitioners can run cited rule checks inside their own tools.
