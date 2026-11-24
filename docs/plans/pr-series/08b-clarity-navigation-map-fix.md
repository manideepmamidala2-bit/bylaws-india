# PR 08b — Map Fix, Clarity and Navigation

**Read first:** `00-overview.md`, `03-schema-three-layers.md` · **Run after:** PR 08 · **Before:** PR 09 · **Estimate:** 5–7 days · **Checkpoint:** owner reviews the preview and merges

## Goal

Make what we already publish clear, correct and easy to navigate, before more data arrives:
1. the map renders for everyone;
2. annotations stop adding noise;
3. the document view shows the law first and everything else on demand;
4. there is an index of how the data is structured, a tree to navigate it, and a published graph file of nodes and links.

**Use existing tools wherever possible.** Every tool below must pass the R4 licence allowlist before use; check the licence of the exact version installed and record it in `docs/dependencies.md`. If a tool fails R4, use the listed alternative.

---

## 1. Fix the blank map

The owner sees an empty white area where the map should be. Diagnose before changing anything, and record findings in `docs/map.md`.

**Diagnose** (in a real browser, e.g. Playwright with Chromium, on desktop and a mobile viewport):
- Network tab: every `.pmtiles` request must return **206 Partial Content**. A **200** means range requests are not supported by the host; a CORS error means the host does not allow the `Range` header or does not expose `Content-Range`.
- Console: CSP errors (MapLibre needs `worker-src blob:` and `child-src blob:`), style, glyph or sprite load failures (glyph URLs must point to a host we control or one that allows our origin), WebGL errors.
- Layout: the map container must have a non-zero height at all breakpoints.

**Fix by cause:**
- Range or CORS failure on Vercel Blob: move the `.pmtiles` file to a host that supports range requests and CORS for static files. In order of preference: the app's own static files if size allows; Cloudflare R2 (free tier) with CORS allowing `GET`, `HEAD`, `Range` and exposing `Content-Range`, `Accept-Ranges`; GitHub Pages. Serve with `application/vnd.pmtiles`, no gzip.
- CSP: add the needed directives narrowly.
- Glyphs and sprites: self-host the Protomaps font and sprite assets in the app's static files.
- Container: fix the height.
- **Fallback:** if WebGL is unavailable, show a clear message with links to the ward and zone data, never a blank area.

**Test:** add a Playwright test that loads the Map page, waits for the map's `idle` event, asserts at least one `.pmtiles` response with status 206, and checks the canvas is not blank (sample pixels differ from the background). Runs in CI.

---

## 2. Annotation quality

Today's annotations link the word "the" to definitions dozens of times, flag "PART I" and "partly" as references, and label the short title an "obligation". Fix at the source:

**Definitions (how a defined term is recognised).** Follow the approach Laws.Africa uses for legislation: a definition is a phrase in quotes followed by "means" or "includes" inside a definitions provision. Apply to our data:
- `defines` must come from the quoted term only. Reject terms that are stopwords, articles, single letters, or numbers; reject definitions whose term is not quoted in the source.
- Re-extract definitions; any definition node with a rejected term is fixed through overrides with page evidence, or loses its `defines` value.

**Defined-term uses.**
- Match only the defined phrase, whole words, case-insensitive, using spaCy's `PhraseMatcher` (MIT) or an equivalent matcher; never match stopwords.
- Do not mark uses inside the definition that defines the term, or inside headings.
- One annotation per term per provision (first occurrence), not every occurrence.
- Scope: a document's definitions apply within that document only (cross-document meaning is PR 09b).

**Cross-references.**
- Only patterns that name a target: "bye-law 6.0", "clause (i)", "sub-clause (ii)", "Table 2B", "regulation 4.1.2", "Chapter 11", "section 428 of the Act". Headings, words like "partly", and bare part names in headings are never references.
- Resolve within the document first; references to other instruments resolve to that instrument if it is in the register, else `external` with the instrument name (not `unresolved` noise).

**Provision types.**
- Rule-based classification with an explicit order: title, extent, commencement → `scope` or `commencement`; definition nodes → `definition`; "Provided that" → `exception`; "shall not", "no person shall" → `prohibition`; "may" with an authority as subject → `permission`; "shall" → `obligation`; fees and charges → `fee`.
- Nodes inside a definition inherit `definition` unless they state a separate rule.
- Anything the rules cannot classify with confidence stays unclassified. No model-based typing in this PR.

**Display threshold:** annotations below a confidence threshold are stored but not shown.

**QA:** `qa.md` reports per document: definitions found, rejected terms, term uses per provision (median, max), references resolved / external / unresolved, provision types by kind. A test fails if any stopword is a defined term or any heading is a reference.

---

## 3. Show the law first

Redesign the Document page so the default view reads like a clean copy of the law:
- **Default per provision:** number, heading (if any), and text. Nothing else.
- **Document level, once:** legal status, effective date, verification, source and archive links, coverage notice.
- **Per provision, only when different from the document:** status, effective date, amendment marks (from PR 08).
- **On demand:** a "Details" toggle per provision (address, page link, verification, annotations) and a global "Show annotations" switch, off by default.
- **Defined terms:** subtle underline; definition in a popover on hover or tap; link to the definition.
- **Cross-references:** plain links to the target provision.
- **Source page:** a small "p. N" link at the end of each provision.

**Reuse:** evaluate **Laws.Africa Law Widgets** (`@lawsafrica/law-widgets`, with React bindings `@lawsafrica/law-widgets-react`): web components for Akoma Ntoso documents including a table of contents, defined-term popups and links, and reference decoration. If its licence passes R4 and its non-network features work without a Laws.Africa account, render our documents as Akoma Ntoso-style HTML (`akn-*` classes, `data-refersTo` on terms) and use its term and table-of-contents components. If not, implement the same behaviour with our components and record why.

---

## 4. Index of how the data is structured

### 4.1 Publish the graph
The pipeline publishes `graph.json` per release: every node (documents, structural nodes, definitions, table rows) and every edge with a type:
- `contains` (parent to child), `defines` (definition to term), `uses_term`, `refers_to`, `amends` / `amended_by` (from PR 08 effects), `in_register` (document to register entry).
- Each edge carries its evidence (annotation id or effect id), method and confidence. Only edges above the display threshold are included.
- Use the **Graphology** JSON format (MIT) so the file loads directly in Graphology and Sigma.js, and add a GraphML export for tools like Gephi.

### 4.2 "How this is structured" page (`/structure`)
Plain English, short:
- what a document, provision, definition, table row, amendment and annotation are;
- the kinds of links, with one example each from real data;
- a small diagram of the model (node kinds and link kinds), drawn with Mermaid (MIT) or as static SVG;
- live counts from the release (documents, provisions by kind, links by kind);
- how to download `graph.json` and the other files.

### 4.3 Tree navigation
- **Outline sidebar** on the Document page: collapsible tree of the document (parts, chapters, sections, clauses), synchronised with scroll position, keyboard navigable, with a breadcrumb at the top. Use **react-arborist** (MIT) for the tree, or an equivalent accessible tree component.
- **Collection overview** on the Documents page: every document as a collapsible tree with counts per level; an overview diagram of the whole collection using **d3-hierarchy** (ISC), e.g. an icicle or indented tree, where clicking a block opens that part of the document.
- Large documents load lazily (children fetched on expand) so pages stay fast.

### 4.4 Search across everything
Add static full-text search with **Pagefind** (MIT): indexes the built site, runs in the browser, no server. Results show the provision number, document and a snippet, and link to the provision. Filters: document, layer, legal status.

---

## Acceptance

- [ ] Map renders on desktop and mobile in CI (Playwright test: 206 responses, non-blank canvas); cause and fix recorded.
- [ ] No stopword defined terms; no headings as references; term uses at most one per term per provision; QA report shows the counts.
- [ ] Document page default shows only number, heading, text and page link; details and annotations on demand; definition popovers work.
- [ ] Law Widgets adopted or rejected with the reason recorded.
- [ ] `graph.json` (Graphology format) and GraphML published per release.
- [ ] `/structure` page with model diagram, examples and live counts.
- [ ] Outline sidebar, breadcrumbs, collection overview diagram, lazy loading.
- [ ] Pagefind search across all documents.
- [ ] axe passes; no em dashes or internal rule references in copy.
- [ ] Every new dependency licence-checked and recorded.
