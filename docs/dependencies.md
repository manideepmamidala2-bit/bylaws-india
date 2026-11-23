# Dependency & Licence Inventory (Rule R4)

Per **Rule R4 (Permissive Licensing)**, every direct dependency in `pipeline/pyproject.toml` and `package.json` is listed here with its SPDX licence identifier. Automated CI checks (`pipeline/tests/test_r4_licences.py`) verify that:

1. Every direct dependency in `pipeline/pyproject.toml` and `package.json` is documented in this file.
2. No installed Python distribution or npm package carries a disallowed `GPL`, `AGPL`, or non-commercial licence.

## 1. Python Pipeline Dependencies (`pipeline/pyproject.toml`)

### Runtime Dependencies

| Package | SPDX Licence | Purpose |
|---------|--------------|---------|
| `click` | `BSD-3-Clause` | CLI command group and argument parsing |
| `pyyaml` | `MIT` | Jurisdiction config and overrides YAML parsing |
| `jsonschema` | `MIT` | Draft 2020-12 JSON Schema validation |
| `pydantic` | `MIT` | Typed data validation and generated schema models |
| `pypdfium2` | `Apache-2.0 OR BSD-3-Clause` | Baseline PDF text/bbox extraction and page rasterization |
| `pillow` | `MIT-CMU` | Image I/O for PDF page rendering and map inspection |
| `shapely` | `BSD-3-Clause` | Polygon clipping, geometry validation, and area calculation |

### Development Dependencies (`[project.optional-dependencies].dev`)

| Package | SPDX Licence | Purpose |
|---------|--------------|---------|
| `pytest` | `MIT` | Python unit, schema, licence, and golden test runner |
| `ruff` | `MIT` | Fast Python linter and formatter |
| `fpdf2` | `LGPL-3.0-only` | Synthetic test fixture PDF generation only (dev-only library import; no copied code, not used at runtime) |
| `datamodel-code-generator` | `MIT` | Single-source Pydantic v2 model code generation from `schemas/*.schema.json` |

## 2. Web Application Dependencies (`package.json`)

### Runtime Dependencies (`dependencies`)

| Package | SPDX Licence | Purpose |
|---------|--------------|---------|
| `leaflet` | `BSD-2-Clause` | Interactive map rendering engine |
| `next` | `MIT` | React App Router framework |
| `react` | `MIT` | UI component library |
| `react-dom` | `MIT` | DOM renderer for React |
| `react-leaflet` | `BlueOak-1.0.0` | React components for Leaflet maps |

### Development Dependencies (`devDependencies`)

| Package | SPDX Licence | Purpose |
|---------|--------------|---------|
| `@eslint/eslintrc` | `MIT` | ESLint compatibility configuration helper |
| `@tailwindcss/postcss` | `MIT` | Tailwind CSS v4 PostCSS integration |
| `@testing-library/jest-dom` | `MIT` | DOM assertion matchers for Vitest |
| `@testing-library/react` | `MIT` | React component testing utilities |
| `@types/leaflet` | `MIT` | TypeScript definitions for Leaflet |
| `@types/node` | `MIT` | TypeScript definitions for Node.js |
| `@types/react` | `MIT` | TypeScript definitions for React |
| `@types/react-dom` | `MIT` | TypeScript definitions for React DOM |
| `@vitejs/plugin-react` | `MIT` | Vite React plugin for Vitest |
| `eslint` | `MIT` | JavaScript/TypeScript linter |
| `eslint-config-next` | `MIT` | Next.js ESLint ruleset |
| `jsdom` | `MIT` | DOM environment for Vitest component tests |
| `json-schema-to-typescript` | `MIT` | Single-source TypeScript type generation from `schemas/*.schema.json` |
| `postcss` | `MIT` | CSS transformation pipeline |
| `tailwindcss` | `MIT` | Utility-first CSS framework |
| `typescript` | `Apache-2.0` | TypeScript compiler and type checker |
| `vitest` | `MIT` | Unit and component test runner |
