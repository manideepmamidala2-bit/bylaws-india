# Bylaw One (`bylaws-india`)

**Bylaw One** (`https://bylaws-india.vercel.app`) is an open-source data pipeline (`pipeline/`) and web reader (`app/`, `components/`, `lib/`) that joins scattered municipal building bye-laws, master plan zoning regulations, state legislation, amendments, and land-use maps into one readable, citable building code — starting with the **Bengaluru Pilot**.

## What & Why

The rules for a single building sit across dozens of official PDFs from different authorities and decades: municipal building bye-laws, master plan zoning regulations, gazette amendment notifications, corporation notices, and state Acts. They overlap, amend one another, and sometimes disagree.

**Bylaw One** brings them together:
- **By subject** (`/j/<id>/topics/<subject>`): What applies today, why it prevails under the stated six-step statutory order, and the older or replaced rules underneath — with every provision and number linked to its exact official PDF page (`#page=N`) and an Internet Archive snapshot.
- **By place on the map** (`/j/<id>` and `/j/<id]/wards`): Search any neighbourhood, street, landmark, or ward to see the corporation, ward, planning district, land-use zone, and the governing rules for that zone (`Uses`, `FAR`, `Ground coverage`, `Setbacks`, `Height`, `Parking`), plus original georeferenced master plan sheets with measured street-offset accuracy.
- **Readable by machines and AI**: `/llms.txt`, `/llms-full.txt`, `.md` Markdown versions of every document, subject, and provision page, a static JSON API at `/api/v1/` described by OpenAPI 3.1 (`/api/v1/openapi.json`), `schema.org/Legislation` JSON-LD, Frictionless Data Packages (`datapackage.json`), and an Atom feed (`/updates.xml`).
- **Workshop verification by people**: A serverless workflow (`bylaws tasks create` → `/verify/<task-set>` → `bylaws verify import <csv>`) where students and practitioners verify provisions and table values against official gazette pages. A record becomes `"Verified by a person"` only after two independent `Match` verdicts, and verifiers are credited by name and institution in every release.

## How to Run

### System Prerequisites

Install Python 3.12+, Node.js 22+, `uv`, Tesseract OCR, and GDAL:

```bash
# Ubuntu / Debian
sudo apt-get update && sudo apt-get install -y tesseract-ocr tesseract-ocr-eng gdal-bin libgdal-dev
```

### Clean-Checkout Setup

```bash
make setup
```

### Running the Python Pipeline

```bash
cd pipeline
uv run bylaws --help
uv run bylaws check-provenance
uv run bylaws run-all --jurisdiction xx-test-fixture
uv run bylaws tasks create --jurisdiction in-ka-bengaluru --count 10 --subject far --seed 42
uv run pytest -v
```

### Running the Web Application

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run check-budgets
npm run dev
```

## How to Contribute

We welcome contributions from colleges, students, architects, planners, engineers, lawyers, and civic data groups:

1. **Report a problem with a rule**: Use the **Report a problem** link on any provision or rule row, or open the [Report a problem with a rule](.github/ISSUE_TEMPLATE/report-problem-with-a-rule.yml) issue form with the site link, what is wrong, and the official page that shows it.
2. **Suggest a source**: Use the [Suggest a source](.github/ISSUE_TEMPLATE/suggest-a-source.yml) issue form to share an official notification, circular, or planning map.
3. **Join the pilot**: Visit `/join` or open the [Join the pilot](.github/ISSUE_TEMPLATE/join-the-pilot.yml) issue form to run a college workshop, verification internship, or practitioner review.
4. **Submit a reproducible override**: Generated files in `data/processed/` and `public/data/` are never edited by hand. Store all manual text, table, or map corrections in `data/overrides/<jurisdiction>/` with a cited page and reason. See [`CONTRIBUTING.md`](CONTRIBUTING.md).

## Stewardship & Licences

- **Stewardship**: Bylaw One is run by `[Owner's Organisation]` (configured in [`bylaws.toml`](bylaws.toml)). Everything released stays open permanently; see [`GOVERNANCE.md`](GOVERNANCE.md).
- **Code Licence**: [Apache License 2.0 (`Apache-2.0`)](LICENSE)
- **Data Licence**: [Creative Commons Attribution 4.0 International (`CC BY 4.0`)](LICENSE-DATA.md)
- **Dependency Hygiene**: All direct and transitive Python and npm packages are verified in CI against the permissive licence allowlist ([`docs/dependencies.md`](docs/dependencies.md)).
- **Security**: See [`SECURITY.md`](SECURITY.md) for reporting vulnerabilities.
- **Citation**: See [`CITATION.cff`](CITATION.cff) and [`.zenodo.json`](.zenodo.json).

