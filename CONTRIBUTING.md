# Contributing to Bylaw One

Contributions from colleges, students, practising architects, planners, engineers, lawyers, and civic data groups to improve provision extraction accuracy, amendment linking, zone boundary verification, and city coverage are welcome.

## 1. Reporting a Problem with a Rule or Suggesting a Source

- **Report a problem with a rule**: Click **Report a problem** on any provision or rule row on the website, or open the [Report a problem with a rule](.github/ISSUE_TEMPLATE/report-problem-with-a-rule.yml) GitHub Issue Form with the site link, what is wrong, and the official PDF page that shows the rule.
- **Suggest a source**: Open the [Suggest a source](.github/ISSUE_TEMPLATE/suggest-a-source.yml) GitHub Issue Form with the instrument title, date, and official link.
- **Join the pilot**: Open the [Join the pilot](.github/ISSUE_TEMPLATE/join-the-pilot.yml) GitHub Issue Form or see `/join` on the website.

## 2. Workshop Verification by People (`bylaws tasks` & `bylaws verify`)

Students and practitioners in workshops can verify provisions and table values against the official PDF pages without running a server:

1. Generate a verification task set:
   ```bash
   cd pipeline
   uv run bylaws tasks create --jurisdiction <id> --count 20 --subject far --seed 1
   ```
2. Complete the tasks in the browser at `/verify/<task-set>`, entering your name and institution, and export the `.csv` file.
3. Import completed CSV files into `data/overrides/<jurisdiction>/verifications.yaml`:
   ```bash
   cd pipeline
   uv run bylaws verify import <path-to.csv> --jurisdiction <id>
   ```
   A record becomes `"Verified by a person"` (`human_verified`) only after at least two independent `Match` verdicts; any `Mismatch` opens a review item.

## 3. Proposing a Data Override (`data/overrides/<jurisdiction>/`)

Per **Rule R6 (Deterministic Reproducibility)**, generated files in `data/processed/` and `public/data/` are never hand-edited. All manual corrections and verifications are stored in `data/overrides/<jurisdiction>/*.yaml` and validated against `schemas/overrides.schema.json`.

Per **Rule R9 (Immutable Verified Records)**, any override targeting a record already marked `verification: human_verified` automatically creates a new versioned record (`@v2`, `@v3`, etc.) that supersedes the prior verified record rather than overwriting it in place.

## 4. Running Checks Before Opening a Pull Request

From the repository root:

```bash
# Regenerate Pydantic and TypeScript models from schemas/ and check for drift
make generate
git diff --exit-code

# Run Python pipeline linter and tests (including R1, R4, and text fidelity checks)
cd pipeline && uv run ruff check . && uv run pytest -v

# Run Next.js web application checks
npm run lint
npm run typecheck
npm test
npm run build
npm run check-budgets
```

## 5. Licensing of Contributions

By submitting a pull request or verification file, you agree that:
- Code contributions are licensed under the **Apache License 2.0** (`LICENSE`).
- Data, override, verification, and documentation contributions are licensed under **CC BY 4.0** (`LICENSE-DATA.md`), with named credit in release metadata for workshop and partner verifiers.

