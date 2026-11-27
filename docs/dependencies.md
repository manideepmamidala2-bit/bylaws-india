# Dependency & Licence Inventory (Rule R4)

Per **Rule R4 (Permissive Licensing)**, every direct dependency in `pipeline/pyproject.toml` and `package.json` is listed here with its SPDX licence identifier, and all direct and transitive Python and npm packages are checked in CI (`pipeline/tests/test_r4_licences.py`) against the explicit permissive licence allowlist (`MIT`, `Apache-2.0`, `BSD-2-Clause`, `BSD-3-Clause`, `BSD`, `ISC`, `PSF-2.0`, `0BSD`, `BSL-1.0`, `CC0-1.0`, `CC-BY-4.0`, `Unlicense`, `OFL-1.1`, `MPL-2.0`, `BlueOak-1.0.0`, `Zlib`, `Python-2.0`).

## 1. Python Pipeline Dependencies (`pipeline/pyproject.toml`)

### Runtime Dependencies

| Package | SPDX Licence | Purpose |
|---------|--------------|---------|
| `click` | `BSD-3-Clause` | CLI command group and argument parsing |
| `pyyaml` | `MIT` | Jurisdiction config and overrides YAML parsing |
| `jsonschema` | `MIT` | Draft 2020-12 JSON Schema validation |
| `pydantic` | `MIT` | Typed data validation and generated schema models |
| `pypdfium2` | `Apache-2.0 OR BSD-3-Clause` | Baseline PDF text/bbox extraction and page rasterization |
| `pdfplumber` | `MIT` | PDF path, vector fill, and table extraction |
| `docling` | `MIT` | Layout-aware document parsing and table structure extraction (`docling-ibm-models` under MIT / Apache-2.0) |
| `pytesseract` | `Apache-2.0` | Python wrapper for Tesseract OCR on scanned PDF pages |
| `httpx` | `BSD-3-Clause` | HTTP client for source acquisition and verification |
| `pillow` | `MIT-CMU` | Image I/O for PDF page rendering and map inspection |
| `shapely` | `BSD-3-Clause` | Polygon clipping, geometry validation, and area calculation |
| `pyproj` | `MIT` | Coordinate Reference System (CRS) inspection and UTM/WGS84 reprojection |
| `geopandas` | `BSD-3-Clause` | Vector geospatial dataframe processing and reprojection |
| `rasterio` | `BSD-3-Clause` | Georeferenced raster I/O and affine/GCP coordinate transforms |
| `opencv-python-headless` | `Apache-2.0` | Headless image processing and colour segmentation for map sheets |
| `scikit-image` | `BSD-3-Clause` | Perceptual colour-space conversion and morphological cleanup |
| `torch` | `BSD-3-Clause` | CPU tensor runtime for Docling layout and table models |
| `torchvision` | `BSD-3-Clause` | CPU vision utilities for Docling layout and table models |

### Development Dependencies (`[project.optional-dependencies].dev`)

| Package | SPDX Licence | Purpose |
|---------|--------------|---------|
| `pytest` | `MIT` | Python unit, schema, licence, provenance, and golden test runner |
| `ruff` | `MIT` | Fast Python linter and formatter |
| `fpdf2` | `LGPL-3.0-only` | Synthetic test fixture PDF generation only (see §3 written exception) |
| `datamodel-code-generator` | `MIT` | Single-source Pydantic v2 model code generation from `schemas/*.schema.json` |

### System Packages & Models

| Component | SPDX Licence | Purpose |
|-----------|--------------|---------|
| `tesseract-ocr` + `tesseract-ocr-eng` | `Apache-2.0` | System OCR engine and English language data for scanned PDF pages |
| `gdal-bin` + `libgdal-dev` | `MIT` | Geospatial Data Abstraction Library for KML/GeoJSON/raster operations |
| Docling layout & TableFormer models (`ds4sd/docling-models`) | `Apache-2.0` | Pre-trained document layout and table-structure weights used by Docling |

## 2. Web Application Dependencies (`package.json`)

### Runtime Dependencies (`dependencies`)

| Package | SPDX Licence | Purpose |
|---------|--------------|---------|
| `@mapbox/vector-tile` | `BSD-3-Clause` | Mapbox Vector Tile decoding for build-time PMTiles place-name extraction |
| `@protomaps/basemaps` | `BSD-3-Clause` | Official Protomaps `light` flavor MapLibre GL style layers |
| `@vercel/analytics` | `Apache-2.0` | Cookieless Vercel Web Analytics with zero personal data collection |
| `maplibre-gl` | `BSD-3-Clause` | Interactive WebGL vector map rendering engine |
| `minisearch` | `MIT` | Lightweight fuzzy and prefix client-side place and ward search engine |
| `next` | `MIT` | React App Router framework |
| `pbf` | `BSD-3-Clause` | Protocol Buffer decoder used with `@mapbox/vector-tile` |
| `pmtiles` | `BSD-3-Clause` | Single-file HTTP byte-range vector tile protocol for Protomaps basemaps |
| `react` | `MIT` | UI component library |
| `react-dom` | `MIT` | DOM renderer for React |

### Development Dependencies (`devDependencies`)

| Package | SPDX Licence | Purpose |
|---------|--------------|---------|
| `@eslint/eslintrc` | `MIT` | ESLint compatibility configuration helper |
| `@playwright/test` | `Apache-2.0` | Headless Chromium end-to-end browser test runner (`e2e/map.spec.ts`) |
| `@tailwindcss/postcss` | `MIT` | Tailwind CSS v4 PostCSS integration |
| `@testing-library/jest-dom` | `MIT` | DOM assertion matchers for Vitest |
| `@testing-library/react` | `MIT` | React component testing utilities |
| `@types/node` | `MIT` | TypeScript definitions for Node.js |
| `@types/pbf` | `MIT` | TypeScript definitions for `pbf` |
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

Per Rule R4 ("LGPL only with a written exception"), the following runtime/dev library imports are explicitly approved with written rationale:

| Package | Licence | Written Exception Rationale |
|---------|---------|-----------------------------|
| `fpdf2` | `LGPL-3.0-only` | Dev-only library import used exclusively in `pipeline/tests/fixtures/` to generate synthetic test PDFs; no `fpdf2` code is copied or shipped in runtime builds or data releases. |
| `python-bidi` | `LGPL` | Unmodified transitive library pulled by `easyocr`/`docling` for bidirectional text layout; imported at runtime without modification. |
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

## 4. Evaluated Libraries & Tooling Decisions (PR 12 / `08b`)

- **`@lawsafrica/law-widgets` (`MIT`)**: Evaluated in Part 1 (`08b` §3). `@lawsafrica/law-widgets` is a Stencil Web-Components bundle designed around server-rendered Akoma Ntoso XML/HTML (`<akomaNtoso>` DOM subtrees) and Indigo API conventions rather than React virtualized JSON node trees (`ClauseNode[]` + stand-off character-span `AnnotationEntry[]`). To keep React 19 / Next.js 15 App Router SSR and `axe-core` accessibility deterministic without Stencil hydration mismatches, we implemented the Akoma Ntoso `akn-ref` / `data-refers-to` term popovers, on-demand Details disclosure, and synchronized Document Outline tree directly in `components/ClauseTree.tsx`.
- **Graphology JSON (`MIT` format) & GraphML**: `pipeline/bylaws/graph.py` emits `graph.json` in the standard Graphology serialized graph schema (`{ attributes, options, nodes, edges }`) and `graph.graphml` in standard XML GraphML so files load directly into Graphology, Sigma.js, NetworkX, and Gephi without extra runtime bundle weight.
