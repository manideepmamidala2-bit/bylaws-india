# Bylaw One — Site Map (One Job per Page)

Every route on Bylaw One has one clear purpose. Header and footer navigation are driven by `lib/navigation.ts`, and no destination appears in both header and footer.

## Primary Routes

| Route | Label | Where Linked | One-Line Purpose |
|---|---|---|---|
| `/` | **Home** | Header wordmark (`Bylaw One`) | The story and the doorway: the problem in one picture, the 5-step FAR story, the 11 subjects, recent changes, and a short 4-question FAQ. |
| `/j/[id]/topics` | **The code** | Header (`The code`), Home hero & closing CTA | Index of the 11 subjects of the building code for the selected city or corporation. |
| `/j/[id]/topics/[topic]` | **Subject page** | Subject index, Home subject list, Map Place Card | What applies today for one subject (deduplicated parameter tables and consolidated provisions with page links), why it governs, and older or replaced rules on tap. |
| `/j/[id]/documents/[doc]` | **Document page** | Subject citations, What changed, Sources | Full structured text of one official instrument in the law's own order, with consolidated corporation wording, change marks, and source page links. |
| `/j/[id]` | **Map** | Header (`Map`), Home hero (`Find rules by place`) | Interactive map of Greater Bengaluru and the 5 City Corporations showing official boundaries, wards, georeferenced master plan land-use zones, original map sheets, and the Place Card with governing rules by zone. |
| `/j/[id]/wards` | **Browse by ward** | Map page (`Browse by ward (without map)`) | Accessible directory of corporations, wards, land-use zones present in each ward, and governing rules for each zone without requiring WebGL or the map canvas. |
| `/j/[id]/timeline` | **What changed** | Header (`What changed`), Home (`All changes →`) | Chronological register of every statute, master plan regulation, building bye-law, amendment notification, and order, ordered newest first with type and corporation filters. |
| `/about` | **About** | Header (`About`), Footer (`Licence` → `/about#licence`) | Who runs Bylaw One, core principles, how the 4-layer code is built (`#how-this-is-built`), the 6-step statutory order for handling disagreements, verification model, and open licences (`#licence`). |

## Footer & Reference Routes

| Route | Label | Where Linked | One-Line Purpose |
|---|---|---|---|
| `/guide` | **Guide** | Footer (`Guide`) | The complete Bylaw One guide in reading mode, with entry points for colleges, students, practitioners, developers, and partners/funders, plus Present and single-file Download actions. |
| `/guide/slides` | **Guide (Slide mode)** | `/guide` (`Present`, `Start from section`) | Presentation slide deck powered by `reveal.js` with one idea per slide, diagrams, screenshots, and speaker view / presenter notes for talks at colleges and the launch event. |
| `/bylaw-one-guide.html` | **Offline guide (single file)** | `/guide` (`Download guide`), `/data` | Self-contained offline HTML file (`<= 10 MB`) combining both reading mode and slide mode with all CSS, JS, fonts, SVG diagrams, and screenshots inlined. |
| `/pilot` | **Pilot** | Footer (`Pilot`), Home hero callout | Live status of the Bengaluru pilot with generated dataset figures, the single full list of declared coverage gaps (`#what-is-missing`), and the 4-step roadmap. |
| `/checks` | **How we check** | Footer (`How we check`), Pilot | Every automatic check that runs on each build, what each check guarantees, its latest measured result, and verification totals by level (`Machine-checked`, `Verified by a person`, `Open review items`). |
| `/use-with-ai` | **Use with AI** | Footer (`Use with AI`) | How to use Bylaw One with AI tools today (`/llms.txt`, `/llms-full.txt`, `.md` page mirrors, and `/api/v1/` JSON API), the four AI honesty rules, and the planned local agent engine. |
| `/join` | **Join** | Footer (`Join`), Pilot | How colleges, students, practitioners, and civic/data groups can take part in workshops, internships, rule reviews, and the pilot network. |
| `/press` | **Press** | Footer (`Press`) | One-paragraph plain description with generated numbers, build-generated product screenshots, downloadable SVG logos, and press contact details. |
| `/j/[id]/sources` | **Sources** | Footer (`Sources`), Document header | Complete legal source register with official links, Wayback Machine archive snapshots, SHA-256 digests, quoted status evidence, and applicability notes. |
| `/data` | **Data and downloads** | Footer (`Data and downloads`) | Versioned dataset release bundles (`.zip`), `SHA256SUMS`, Frictionless `datapackage.json`, OpenAPI 3.1 JSON API, Atom feed (`/updates.xml`), and the offline guide download. |
| `/verify/[taskSet]` | **Verify** | `/checks`, `/join` | Browser-only workshop verification sheet where students and practitioners compare records against official PDF pages and export CSV verdicts. |
