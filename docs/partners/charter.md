# Bylaw One — Charter

**Steward**: `[Owner's Organisation]` (`bylaws.toml`) · **Site**: `https://bylaws-india.vercel.app` · **Repository**: `https://github.com/manideepmamidala2-bit/bylaws-india`

---

## 1. Purpose

**Bylaw One** exists to make Indian municipal building bye-laws, master plan zoning regulations, state legislation, amendments, and land-use maps readable, verifiable, and openly accessible to everyone — citizens, architects, planners, engineers, students, researchers, officials, and AI systems.

---

## 2. Five Core Principles

1. **Open by Default**:
   - All source code is published under the **Apache License 2.0 (`Apache-2.0`)** and all structured datasets, consolidated texts, parameter records, map layers, and verification records are published under **Creative Commons Attribution 4.0 International (`CC BY 4.0`)**.
2. **Every Rule Traced to Its Page**:
   - Every provision, table cell, statutory resolution step, and map layer must carry a machine-checkable citation to the exact page (`#page=N`) of the official publication and an archived copy.
3. **Verbatim Law**:
   - Official legal text is never invented, paraphrased, or silently rewritten. Plain-language summaries sit in separate `"In short, by this site"` fields so readers always know what is the gazette's wording and what is this site's explanation.
4. **Derived Values Explicitly Labelled**:
   - Consolidated texts, extracted parameter tables, georeferenced zone polygons, and lake/drain buffer overlays are explicitly labelled as derived by Bylaw One, with their method and measured error stated openly.
5. **Not Legal Advice**:
   - Bylaw One is an open public reference worked out from official publications. It does not replace the official Gazette or professional advice; users must confirm plot-specific decisions with the planning authority or a qualified professional.

---

## 3. How Decisions Are Made

- **Stewardship**: Bylaw One is maintained by `[Owner's Organisation]`, which oversees technical architecture, schema stability, CI quality gates, and release publishing.
- **Partner & Advisory Network**: Partner colleges, practising professionals, and civic data groups form the Bylaw One Advisory Group. Members advise on city/state expansion priorities, statutory precedence rules, and workshop verification standards.
- **Evidence-First Dispute Resolution**: Disagreements about what a rule says or which provision governs are settled solely by citing the official Gazette text, notification date, and statutory hierarchy — never by opinion. When two in-force provisions of equal rank genuinely conflict and no in-force clause settles the tie, both are shown side by side as `"Not settled"`.
- **Two-Match Verification Standard**: No record is marked `"Verified by a person"` (`human_verified`) unless at least two independent verifiers record `Match` against the official PDF page and zero verifiers record `Mismatch`.

---

## 4. Permanent Openness Commitment

Everything released by Bylaw One stays open permanently:
- Published dataset releases (`manifest.json`, `.zip` bundles, `SHA256SUMS`, `datapackage.json`, and `/api/v1/` snapshots) are immutable and permanently licensed under `CC BY 4.0`.
- Even if stewardship transitions in the future, no published code or dataset release may ever be relicensed restrictively or placed behind a paywall.
