# PR 09b — Relations, Topics and Conflicts Across Documents

**Read first:** `00-overview.md`, `03-schema-three-layers.md`, `08b-clarity-navigation-map-fix.md` · **Run after:** PR 09 · **Before:** PR 10 · **Estimate:** 8–12 days · **Checkpoint:** owner reviews the preview and merges

## Goal

Address the core problem the project exists for: building rules come from several documents that **overlap and contradict**. After PRs 08 and 09 each document is correct on its own and up to date. This PR connects them:

1. a **topic index**, so one question ("setbacks") shows every relevant provision from every document, as of today;
2. a **relations layer** recording where provisions overlap, define the same term differently, or conflict, each with evidence;
3. **precedence** taken only from what the law itself says;
4. an **institution succession** table for bodies and offices that no longer exist;
5. an **"applies here"** field separate from legal status;
6. a **local graph view** for each provision.

**The project never decides a legal conflict by itself.** It records candidates, shows both provisions with citations, and states precedence only when a provision's own words establish it.

---

## 1. Schema 1.4: the fourth layer

### Topics
- A fixed, versioned topic list in config (`topics.yaml`), starting with: land use and permissible uses; FAR (including premium FAR and TDR); ground coverage; setbacks; building height; parking; basements and stilts; projections and open spaces; plot size and frontage; road width; deviations and regularisation; approvals and certificates; fire and safety; definitions of building terms.
- Each topic: id, label, short description, seed phrases.
- Provision-to-topic links are annotations (`kind: topic`) with an evidence span, method and confidence.

### Relations
Stored in `relations.json`, each with: `id`, `kind`, `from` and `to` (node addresses, any documents), `topic`, `evidence` (spans in both provisions), `method`, `confidence`, `status`.
- `kind`: `same_topic`, `definition_differs` (same term defined in two documents with different text), `numeric_differs` (same topic and parameter, different quantities or conditions), `cross_document_reference` (one document names another's provision), `precedence` (one provision states it prevails over or is subject to another).
- `status`: `candidate` (found by the pipeline), `confirmed` (evidence spans establish it by rule), `rejected` (checked and not a real relation, with reason), `human_verified` (only when a person checks, R10).
- `precedence` relations require a span with precedence language from the law itself: "notwithstanding anything contained in", "subject to", "in supersession of", "shall prevail", "shall apply in addition to", "in case of conflict". Without such a span, there is no precedence relation.

### Applies here
Each document gets `applies_to_jurisdiction`: `yes`, `no`, `partly`, `unknown`, with a reason and evidence (e.g. the extent clause, the Act it is made under). Example to resolve: the Karnataka Municipalities Model Building Bye-laws 2017 are made under the Karnataka Municipalities Act; determine from their own extent clause and from the Greater Bengaluru Governance Act whether they apply in Bengaluru South, and record `unknown` with both pieces of evidence if they do not settle it.

### Institution succession
`succession.yaml`: old body or office → current body or office, effective date, and the instrument that made the change, quoted (R17). Starting rows to confirm from the instruments: Bangalore Mahanagara Palike / Bruhat Bengaluru Mahanagara Palike → Bengaluru South City Corporation (and the Greater Bengaluru Authority) under the Greater Bengaluru Governance Act 2024 and the corporations notification; Commissioner of BBMP → Commissioner of the City Corporation. Provisions that name an old body show "now: …" beside the name, linked to the evidence.

Regenerate types; update `graph.json` with topic, relation and succession edges.

---

## 2. How relations are found (reuse tools, never let a model decide)

**Topic tagging**
1. Rule pass: seed phrases per topic matched with spaCy `PhraseMatcher` (MIT) on headings first, then text; headings carry more weight.
2. Similarity pass for provisions the rules missed: sentence embeddings with **sentence-transformers** (Apache-2.0) using a small permissively licensed model (check the model card licence, e.g. `all-MiniLM-L6-v2` or a `bge-small` variant); a provision is tagged only if it is close to the topic's already-tagged provisions above a threshold. Model name, version and threshold recorded.
3. Table rows inherit the topic of their table unless their own text says otherwise.

**Quantities** (needed for `numeric_differs`)
- Extract quantities with units from text and table cells: metres, square metres, square feet, percentages, ratios (FAR), number of floors, number of parking spaces per unit. Use **pint** (BSD) for unit normalisation and a small rule-based extractor (regex) for Indian building text; record the source span for every quantity.
- Quantities are stored as annotations (`kind: quantity`) on provisions tagged to a topic. This is groundwork for the computable-rules phase, kept to what conflict detection needs.

**Candidate relations**
- `same_topic`: provisions in different documents sharing a topic, as of today's consolidated text.
- `definition_differs`: same normalised defined term in two documents; compare texts; differences recorded with both definitions.
- `numeric_differs`: same topic, both with quantities of the same dimension, different values; recorded with both spans and any conditions (zone, plot size, road width, height) found near the quantity.
- Optional ranking aid: a natural-language-inference model may be used only to **order** candidates for review; its output is never stored as a relation's status.

**Confirmation by rule**
- `definition_differs` and `cross_document_reference` are confirmed when the spans match the patterns.
- `numeric_differs` stays `candidate` unless the two provisions' conditions are clearly the same (same zone or same building class and same parameter); otherwise it is shown as "possible conflict: check conditions".
- `precedence` confirmed only with a precedence span.

**QA:** `relations.md` reports counts by kind and status, 30 sampled relations per kind checked against both texts by the agent, and every `precedence` relation listed with its span.

---

## 3. Website

### Topics (`/j/[id]/topics` and `/j/[id]/topics/[topic]`)
- Topic list with counts per document.
- Topic page: every provision on the topic from every document, **as of today** (date picker for another date), grouped by document and ordered by the document hierarchy (zoning regulations, bye-laws, supporting provisions).
- Side-by-side comparison for provisions linked by `definition_differs` or `numeric_differs`, with the quantities highlighted in both.
- **Conflict flags** in plain words: "These provisions give different values for the same thing. Check which applies to your case." Confirmed precedence shown as "The zoning regulations state this provision applies notwithstanding …", with the quote and link.
- Map integration: when a zone is selected on the Map (once PR 11 links zones), the topic page can filter to provisions applying to that zone.

### Provision page and local graph
- Every provision gets its own page (`/j/[id]/documents/[doc]/[eid]`) with: breadcrumb, text, page link, history (PR 08/09), and its connections.
- **Local graph:** the provision and its neighbours one hop away (two hops on demand): terms it uses, provisions it refers to and that refer to it, amendments, same-topic provisions in other documents, conflicts, zones (when available). Drawn with **Sigma.js** with **Graphology** (both MIT; React bindings `@react-sigma/core`), reading from `graph.json`. Alternative: **Cytoscape.js** (MIT) if its layouts suit small neighbourhoods better; choose one and record why. Edge colours and line styles show the link kind; conflicts in the accent used for selection only when selected, otherwise a dashed ink line (dg2n rules: no coral text).
- The graph is an aid: a plain list of the same connections sits beside it for accessibility and for screen readers.

### Institution notes and applicability
- Old body names in text show "now: Bengaluru South City Corporation" with the evidence link.
- The Sources page shows "Applies here: yes / no / partly / unknown" beside legal status, with the reason; documents with `no` are listed separately as "In force elsewhere, not applicable here".

### Structure page
- `/structure` (from PR 08b) gains topics, relations, succession and applicability, with examples and counts.

---

## Acceptance

- [ ] Schema 1.4 with topics, relations, quantities, succession and applicability; types regenerated; `graph.json` updated.
- [ ] Every provision in the bye-laws and zoning regulations (consolidated, as of today) tagged to topics where applicable, with spans and methods.
- [ ] Candidate relations produced for all kinds; confirmations only by rule; QA sample checked; no relation `human_verified`.
- [ ] Every precedence relation has a quoted precedence span from the law.
- [ ] Applicability set for every document with evidence; the Model Building Bye-laws 2017 case resolved or recorded as unknown with evidence.
- [ ] Succession table confirmed from instruments; shown beside old names.
- [ ] Topics pages, side-by-side comparisons and conflict flags working; plain-English wording; no legal conclusions beyond what the texts state.
- [ ] Provision pages with local graph and accessible list; axe passes.
- [ ] Every new dependency and model licence-checked and recorded.
