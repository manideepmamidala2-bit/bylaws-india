# Reconnaissance Report — `xx-test-fixture` (Synthetic Test Jurisdiction)

**Step**: Plan v2.0 §5.B3 · **Jurisdiction**: `xx-test-fixture`

## 1. Document Layout & Numbering Reconnaissance

| Doc ID | Layer | Type | Pages | Text Layer | Languages | Layout, Tables & Sample Heading |
|---|---|---|---|---|---|---|
| `fixture-base-2020` | `municipal` | `regulations` | 2 | Digital text layer | `en` | 21 blocks, 1 table(s); e.g. `Synthetic Municipal Building Regulations 2020` |
| `fixture-amend-2024` | `municipal` | `amendment` | 1 | Digital text layer | `en` | 8 blocks, 0 table(s); e.g. `Synthetic Municipal Building (Amendment) Regulations 2024` |
| `fixture-draft-2026` | `planning` | `regulations` | 1 | Digital text layer | `en` | 3 blocks, 0 table(s); e.g. `DRAFT -- Synthetic Zoning Revisions 2026` |
| `fixture-map-atlas` | `planning` | `map` | 1 | Digital text layer | `en` | 4 blocks, 0 table(s); e.g. `Synthetic Planning District 01 -- Land Use Map` |

## 2. Structure Rules Derived from Reconnaissance (for Step B5)

1. **Hierarchy & Roman-Numeral Chapters**: Recognize `PART I`, `PART II`, `PART III`, `CHAPTER I`..`CHAPTER XI`, `SCHEDULE`, and `ANNEXURE` as `level=1` headings (`CHAPTER_LINE_RE`).
2. **Decimal & Statutory Section Numbering**: Match decimal clauses (`1.1`, `3.10`, `4.1.2`) and statute section numbers (`13-E.`, `18-B.`, `240.`) while rejecting mid-sentence measurements (`3.5 m`, `11.5 metres`, `0.50 FAR`) and 4-digit years (`2020`, `2025`).
3. **Scoped Sub-Items**: Scope parenthetical sub-clauses `(a)`, `(b)`, `(i)`, `(ii)` to their parent clause ID (`<doc_id>:<number>(a)`).
4. **Structured Table Extraction**: Extract captioned and grid tables into `clause.tables[]` and strip flattened cells from clause prose `text`.
5. **Bilingual Preservation (Rule R13 / §5.B5)**: Preserve regional script text verbatim with `language: "kn"` without machine translation.
