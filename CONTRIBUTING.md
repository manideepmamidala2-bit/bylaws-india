# Contributing to Structured Building Bylaws

Contributions to improve clause extraction accuracy, amendment linking, zone boundary verification, and jurisdiction coverage are welcome.

## 1. Reporting Errors in Clause Text or Zoning Maps

If you find an extraction defect, wrong clause hierarchy, missing amendment link, or inaccurate zone polygon:

1. Open a GitHub Issue describing the jurisdiction ID, document ID, clause number (or `zone_id`), and the discrepancy against the official gazette PDF or planning map.
2. Include the page number in the source PDF so reviewers can verify the citation directly.

## 2. Proposing a Data Override (`data/overrides/<jurisdiction>/`)

Per **Rule R6 (Deterministic Reproducibility)**, generated files in `data/processed/` and `public/data/` are never hand-edited. All manual corrections and verifications are stored in `data/overrides/<jurisdiction>/*.yaml` and validated against `schemas/overrides.schema.json`.

Per **Rule R9 (Immutable Verified Records)**, any override targeting a record already marked `verification: human_verified` will automatically create a new versioned record (`@v2`, `@v3`, etc.) that supersedes the prior verified record rather than overwriting it in place.

To submit a correction or verification:

1. Edit or add a YAML override entry under `data/overrides/<jurisdiction>/overrides.yaml` (`clause_fixes`, `zone_tags`, `zone_fixes`, or `map_curations`) with a clear `reason`.
2. Run the pipeline for the target jurisdiction:
   ```bash
   cd pipeline
   uv run bylaws run-all --jurisdiction <id>
   ```
3. Inspect the updated QA report in `data/reports/<jurisdiction>/qa.md`.

## 3. Running Checks Before Opening a Pull Request

From the repository root:

```bash
# Regenerate Pydantic and TypeScript models from schemas/ and check for drift
make generate
git diff --exit-code

# Run Python pipeline linter and tests (including R1 and R4 checks)
cd pipeline && uv run ruff check . && uv run pytest -v

# Run Next.js web application checks
npm run lint
npm run typecheck
npm test
npm run build
```

## 4. Licensing of Contributions

By submitting a pull request, you agree that:
- Code contributions are licensed under the **Apache License 2.0** (`LICENSE`).
- Data, override, and documentation contributions are licensed under **CC BY 4.0** (`LICENSE-DATA.md`).
