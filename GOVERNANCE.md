# Governance of Bylaw One

## 1. Stewardship

**Bylaw One** is run and maintained by the owner's organisation (configured in [`bylaws.toml`](bylaws.toml) under `[organisation].name`, currently placeholder `[Owner's Organisation]`).

The steward organisation is responsible for:
- Maintaining the open-source Python pipeline (`pipeline/`), JSON Schemas (`schemas/`), and Next.js web reader (`app/`, `components/`, `lib/`).
- Reviewing and publishing verified dataset releases, source registers, and georeferenced land-use map layers.
- Running automated CI verification gates (text fidelity against stored PDF page text, statutory resolution checks, parameter plausibility and overlap checks, provenance gates, licence checks, accessibility checks, and secret scans).

## 2. Permanent Openness Commitment

Everything released by Bylaw One stays open permanently:
- **Source code** is published under the **Apache License 2.0 (`Apache-2.0`)** ([`LICENSE`](LICENSE)).
- **Structured datasets, parameters, consolidated texts, georeferenced map layers, and verification records** are published under **Creative Commons Attribution 4.0 International (`CC BY 4.0`)** ([`LICENSE-DATA.md`](LICENSE-DATA.md)).
- Published releases are archived with cryptographic SHA-256 checksums and Zenodo metadata ([`.zenodo.json`](.zenodo.json)) so colleges, researchers, practitioners, and civic groups can rely on them permanently without fear of paywalls or restrictive relicensing.

## 3. Advisory Group & Partner Network

Colleges of architecture, planning, law, and engineering, practising professionals, and civic or open-data organisations are invited to join the **Bylaw One Partner & Advisory Group** (see [`docs/partners/charter.md`](docs/partners/charter.md) and `/join`):
- **College partners** co-host one-day verification workshops, faculty sessions, and supervised 60 to 120-hour student verification internships under a free, non-exclusive MoU ([`docs/partners/mou-template.md`](docs/partners/mou-template.md)), and may serve as state or city stewards.
- **Student & practitioner verifiers** check structured provisions and parameter rows against official gazette pages; every person whose verification passes the two-match threshold is credited by name and institution in the release metadata and release notes.
- **Advisory group members** review coverage priorities, statutory resolution rules, and new city/state expansions.

## 4. Non-Negotiable Editorial & Technical Rules

1. **Verbatim Law**: Official legal text is never rewritten, paraphrased, or invented. Plain-language explanations sit in separate `"In short, by this site"` fields.
2. **Every Value Traced to Its Page**: Every provision, parameter value, and resolution step links to the exact page of the official PDF and an Internet Archive snapshot.
3. **Derived Values Labelled**: Consolidated texts, parameter tables, and buffer overlays are explicitly marked as derived by this site.
4. **Honest Verification Levels**: Machine checks are labelled `"Machine-checked"`. A record becomes `"Verified by a person"` (`human_verified`) only after at least two independent `Match` verdicts with zero unresolved `Mismatch` verdicts.
5. **Not Legal Advice**: Bylaw One is an open reference worked out from official publications; users must confirm plot-specific decisions with the planning authority or a qualified professional.
