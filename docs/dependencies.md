# Dependency & Licence Inventory (Rule R4)

Per **Rule R4 (Permissive Licensing)**, every direct dependency in `pipeline/pyproject.toml` and `package.json` is listed here with its SPDX licence identifier, and all direct and transitive Python and npm packages are checked in CI (`pipeline/tests/test_r4_licences.py`) against the explicit permissive licence allowlist (`MIT`, `Apache-2.0`, `BSD-2-Clause`, `BSD-3-Clause`, `BSD`, `ISC`, `PSF-2.0`, `0BSD`, `CC0-1.0`, `CC-BY-4.0`, `Unlicense`, `OFL-1.1`, `MPL-2.0`, `BlueOak-1.0.0`, `Zlib`, `Python-2.0`).

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
| `pyproj` | `MIT` | Coordinate Reference System (CRS) inspection and UTM/WGS84 reprojection |

### Development Dependencies (`[project.optional-dependencies].dev`)

| Package | SPDX Licence | Purpose |
|---------|--------------|---------|
| `pytest` | `MIT` | Python unit, schema, licence, and golden test runner |
| `ruff` | `MIT` | Fast Python linter and formatter |
| `fpdf2` | `LGPL-3.0-only` | Synthetic test fixture PDF generation only (see §3 written exception) |
| `datamodel-code-generator` | `MIT` | Single-source Pydantic v2 model code generation from `schemas/*.schema.json` |

## 2. Web Application Dependencies (`package.json`)

### Runtime Dependencies (`dependencies`)

| Package | SPDX Licence | Purpose |
|---------|--------------|---------|
| `leaflet` | `BSD-2-Clause` | Interactive map rendering engine |
| `next` | `MIT` | React App Router framework |
| `react` | `MIT` | UI component library |
| `react-dom` | `MIT` | DOM renderer for React |
| `react-leaflet` | `Hippocratic-2.1` | React components for Leaflet maps (Plan v2.0 §5.A2 / §6; see §3 exception) |

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
| `axe-core` | `MPL-2.0` | Automated WCAG AA accessibility engine for blocking CI tests |
| `eslint` | `MIT` | JavaScript/TypeScript linter |
| `eslint-config-next` | `MIT` | Next.js ESLint ruleset |
| `jsdom` | `MIT` | DOM environment for Vitest component tests |
| `json-schema-to-typescript` | `MIT` | Single-source TypeScript type generation from `schemas/*.schema.json` |
| `postcss` | `MIT` | CSS transformation pipeline |
| `tailwindcss` | `MIT` | Utility-first CSS framework |
| `typescript` | `Apache-2.0` | TypeScript compiler and type checker |
| `vitest` | `MIT` | Unit and component test runner |

## 3. Written LGPL & Transitive Exceptions (Rule R4)

Per Plan v2.0 §2 Rule R4 ("LGPL only with a written exception"), the following runtime/dev library imports are explicitly approved with written rationale:

| Package | Licence | Written Exception Rationale |
|---------|---------|-----------------------------|
| `fpdf2` | `LGPL-3.0-only` | Dev-only library import used exclusively in `pipeline/tests/fixtures/generate_fixtures.py` to generate synthetic test PDFs; no `fpdf2` code is copied or shipped in runtime builds or data releases. |
| `@img/sharp-libvips-darwin-arm64` | `LGPL-3.0-or-later` | Unmodified transitive `libvips` shared library binary pulled by Next.js `sharp` image optimizer; dynamically linked at build/runtime without modification. |
| `@img/sharp-libvips-darwin-x64` | `LGPL-3.0-or-later` | Unmodified transitive `libvips` shared library binary pulled by Next.js `sharp` image optimizer. |
| `@img/sharp-libvips-linux-arm` | `LGPL-3.0-or-later` | Unmodified transitive `libvips` shared library binary pulled by Next.js `sharp` image optimizer. |
| `@img/sharp-libvips-linux-arm64` | `LGPL-3.0-or-later` | Unmodified transitive `libvips` shared library binary pulled by Next.js `sharp` image optimizer. |
| `@img/sharp-libvips-linux-ppc64` | `LGPL-3.0-or-later` | Unmodified transitive `libvips` shared library binary pulled by Next.js `sharp` image optimizer. |
| `@img/sharp-libvips-linux-riscv64` | `LGPL-3.0-or-later` | Unmodified transitive `libvips` shared library binary pulled by Next.js `sharp` image optimizer. |
| `@img/sharp-libvips-linux-s390x` | `LGPL-3.0-or-later` | Unmodified transitive `libvips` shared library binary pulled by Next.js `sharp` image optimizer. |
| `@img/sharp-libvips-linux-x64` | `LGPL-3.0-or-later` | Unmodified transitive `libvips` shared library binary pulled by Next.js `sharp` image optimizer. |
| `@img/sharp-libvips-linuxmusl-arm64` | `LGPL-3.0-or-later` | Unmodified transitive `libvips` shared library binary pulled by Next.js `sharp` image optimizer. |
| `@img/sharp-libvips-linuxmusl-x64` | `LGPL-3.0-or-later` | Unmodified transitive `libvips` shared library binary pulled by Next.js `sharp` image optimizer. |
| `@img/sharp-wasm32` | `Apache-2.0 AND LGPL-3.0-or-later AND MIT` | Unmodified transitive `libvips` WebAssembly runtime pulled by Next.js `sharp`. |
| `@img/sharp-win32-arm64` | `Apache-2.0 AND LGPL-3.0-or-later` | Unmodified transitive `libvips` shared library binary pulled by Next.js `sharp`. |
| `@img/sharp-win32-ia32` | `Apache-2.0 AND LGPL-3.0-or-later` | Unmodified transitive `libvips` shared library binary pulled by Next.js `sharp`. |
| `@img/sharp-win32-x64` | `Apache-2.0 AND LGPL-3.0-or-later` | Unmodified transitive `libvips` shared library binary pulled by Next.js `sharp`. |
| `react-leaflet` | `Hippocratic-2.1` | Explicitly specified in Plan v2.0 §5.A2 & §6 as the React wrapper for Leaflet (`BSD-2-Clause`). |
| `@react-leaflet/core` | `Hippocratic-2.1` | Direct internal core package of `react-leaflet` (Plan v2.0 §5.A2 & §6). |
