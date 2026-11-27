# Bylaw One: The Guide, and One Job per Page

**Date:** 27 November 2026 · **Basis:** the live site (https://bylaws-india.vercel.app) and the decisions on the guide · **Context:** this repository and site are internal

This plan is self-contained. Section 6 is the content brief: the agreed narrative, principles, offers and launch plan, to be used as written.

---

## 1. Goal

1. **The Bylaw One guide:** one source, three forms:
   - a page on the site at `/guide` (reading mode);
   - a slide mode at `/guide/slides` for talks at colleges and the launch event;
   - a downloadable single self-contained HTML file that works offline.
   It explains why Bylaw One exists, what works today, how it is built, the movement, the launch and how to take part, with entry points for each audience.
2. **One job per page:** remove repeated pages, sections and links, and fix inconsistent figures, so every page has a single clear purpose.

---

## 2. Decisions

- The guide lives at `/guide`, with a slide mode and a single-file download.
- One guide for everyone, with entry points: colleges, students, practitioners, developers, partners and funders.
- The repository and site are internal: the guide includes the launch plan, funding options and targets.
- Features not yet built (the agent engine, data packs, installers) are described as **planned**, never as available; install steps are added only when they work.
- All figures are generated from the release at build time, never typed.
- Tools: reveal.js (MIT) for slide mode, including its presenter notes; Mermaid (MIT) for diagrams; Playwright (Apache-2.0) for build-time screenshots. Check licences of the installed versions and record them.

---

## 3. Principles

- Never invent or rewrite legal text; quotes in the guide pass the citation check.
- Plain language; short sections; one idea per slide.
- Honest: show gaps, unverified status and "not legal advice" where relevant.
- Use the content brief's wording for narrative, principles and offers; adapt length, not meaning.
- Commit and push after each part.

---

## 4. Work, in order

### Part 1 — One job per page

1. **Page inventory:** list every route with its purpose in one line in `docs/site-map.md`. Proposed jobs:
   - **Home:** the story and the doorway (problem, FAR story, subjects, recent changes, short FAQ).
   - **The code:** subjects and what applies today.
   - **Map:** rules by place.
   - **What changed:** instruments and changes, newest first.
   - **About:** who runs Bylaw One, principles, licences, how it is built.
   - **Pilot:** live status, gaps, roadmap.
   - **How we check, Use with AI, Join, Press, Sources, Data, Verify, Guide.**
2. **Navigation from one config:** header and footer read from a single navigation file. Header: The code, Map, What changed, About. Footer: Guide, Pilot, How we check, Use with AI, Join, Press, Sources, Data and downloads, Licence. **No destination appears in both header and footer.** Footer anchors such as "Licence" and "How this is built" point to About sections without duplicating header items.
3. **No repeated calls to action on one page:** each page links to a destination at most once in its body (e.g. home has "Read the code" once near the top and once at the end only if the end is a closing section; otherwise once). Remove duplicate buttons and duplicate links within cards (e.g. subject cards with both a title link and a "Read … →" link to the same page: keep one).
4. **One map address:** "Map" and "Find rules by place" go to the same map route (Greater Bengaluru view, with the corporation selector).
5. **One source for gaps:** the list of what is missing comes from the declarations file once and is deduplicated (the July 2025 amendment appears once). Home shows a short summary with a link; the full list lives on the Pilot page.
6. **Consistent figures:** every count shown in more than one place comes from the same generated value (e.g. processed map sheets: one number everywhere; fix the "1 sheets" versus "4 sheets" mismatch and the plural).
7. **Overlapping pages:** Home, Pilot and About must not repeat each other's paragraphs. Home teases; Pilot gives status; About explains who and how.
8. **Link check (CI):** fail the build if (a) a destination appears in both header and footer, (b) a page body links the same destination more than twice, (c) the same figure has different values on different pages.

**Done when:** `docs/site-map.md` exists; navigation comes from one config; CI link and figure checks pass.

### Part 2 — Guide content as source files

1. Write the guide as Markdown or MDX sections in `content/guide/`, one file per section (Section 5 outline). Each section has:
   - a **slide summary** (at most 40 words, one idea) and **presenter notes**;
   - a **reading version** (fuller text, at most about 400 words per section unless a table or diagram needs more).
2. **Generated values:** placeholders such as `{{documents_in_force}}`, `{{provisions}}`, `{{rules_as_data}}`, `{{wards}}`, `{{map_coverage_pct}}`, `{{verified_by_people}}`, `{{checks_per_build}}`, `{{current_as_of}}` are filled from the release at build time.
3. **Diagrams (Mermaid):** sources to one code; how a rule travels (2004 → 2007 → 2017 → 2025 → today); the data layers (sources, structure, rules as data, resolution, site); the checks pipeline; layered packs (national → state → city); the agent engine's four doors (planned).
4. **Screenshots:** generated with Playwright from the built site at 1280 px and 390 px: home hero, FAR story step, a subject page, the map with a place card, a verify task, the pilot page.
5. **Factual sections** (what exists, how it's built, for developers, what's missing) are written from the repository and release data. **Narrative sections** use the content brief (Section 6).

### Part 3 — Reading mode (`/guide`)

- Bylaw One design; one column; a sticky contents list.
- **Entry points** at the top: "I'm from a college", "I'm a student", "I'm a practitioner", "I'm a developer", "I'm a partner or funder", each jumping to a short path through the sections relevant to them.
- Each section shows its reading version, diagrams and screenshots; details on tap where long.
- Buttons: "Present" (opens slide mode at the same section) and "Download guide (single file)".
- Within page budgets; accessible (axe).

### Part 4 — Slide mode (`/guide/slides`)

- reveal.js; one slide per section summary, plus slides for key diagrams and screenshots; presenter notes from the source files.
- Keyboard navigation, full screen, speaker view.
- Bylaw One look: paper background, ink text, Inter Tight headings, one coral accent for the current item only.
- Works offline once loaded.
- A "Start from section" link from each reading section.

### Part 5 — Single-file download

- A build step produces `bylaw-one-guide.html`: reading mode and slide mode in one file (a "Present" toggle switches modes), with all CSS, JavaScript, fonts (subset), diagrams (pre-rendered SVG) and screenshots (compressed images) inlined. No network requests.
- Size target ≤ 10 MB. Title page shows the release, dataset ID and the date generated.
- Published on the Data page and linked from `/guide`; attached to each GitHub release.
- Test: open the file with network disabled in Playwright; both modes work.

---

## 5. Guide outline

**Opening:** "Bengaluru's building rules. One code." The problem in one picture. The pilot in live numbers.

1. **Why this exists**
2. **See it working:** FAR story; a subject page; the map place card; a verification task
3. **How it's built:** sources; structure; rules as data; settling overlaps; checks; the map; machines and AI
4. **Principles**
5. **The movement:** roles; layered packs; state stewards
6. **Take part:** colleges; students; practitioners; civic and data groups; how credit works
7. **For developers:** repository layout; data model; running the pipeline; adding a source or a city; the planned pack format; the planned agent engine; contribution rules
8. **The launch:** timeline; what happens at the launch; workshops and internships
9. **Sustainability:** funding options; how Bylaw One is run; success measures
10. **What's missing and what's next**
11. **Contact and how to cite**

---

## 6. Content brief (use this wording)

### 6.1 The narrative
> Every building in India is governed by rules scattered across bye-laws, master plans, amendments, circulars and state Acts, published as PDFs by different bodies, often contradicting each other. Architects, engineers, students and homeowners spend days finding which rule applies, and still aren't sure. Bylaw One turns those rules into one open, cited, machine-readable code, so that any person, and any AI they use, can answer "what may I build here?" with the exact official page behind every answer. Built openly, verified by colleges and practitioners, starting with Bengaluru.

Three ideas: **Open** (free data, free tools, no lock-in to any company, including AI companies). **Cited** (every answer leads to the government's own page). **Collective** (a city at a time, a state at a time, built and checked by the profession itself).

Closing line: **Read. Trace. Compare.**

### 6.2 Principles
- The law's words exactly as printed; nothing added inside legal text.
- Every rule traced to its official page, with an archived copy.
- Anything the site works out is labelled as derived.
- When rules disagree, a stated order decides, and both rules stay visible; "not settled" when the law does not decide.
- Not legal advice; confirm with the authority.
- Released data and code stay open permanently (code Apache-2.0, data CC BY 4.0).

### 6.3 How the work is organised
- **State stewards:** colleges that curate their state's rules, verify records and teach with them.
- **Contributors:** anyone proposing sources, corrections or cities.
- **Reviewers:** faculty and practitioners who sign off verification.
- **Maintainers:** the core team that runs the engine, data format and checks.
- Bylaw One is run as a brand under the owner's organisation; released work stays open regardless.

### 6.4 Layered packs (planned)
Rules will be published as downloadable packs: national, state and city. Shared text is stored once. Each layer records how it relates to the one above: adopted, adopted with changes, or reference only, because a national model only applies where a state or city adopted it. A city pack shows each rule's trail.

### 6.5 The agent engine (planned, for the launch)
- One small engine, written in TypeScript, running on the user's own machine; data packs installed separately and updated as new rules are added.
- Four doors: a local MCP server (for Claude, Cursor, VS Code, Gemini CLI, Codex and other MCP apps); a command line for any agent that can run commands; an Agent Skill that teaches any agent the honesty rules (cite the page, label derived values, ask for missing plot details, confirm with the authority); the open data files themselves.
- Offline search over the law and its interpretations (keyword search built in; meaning-based search with a small bundled model).
- Planned tools: search rules; get a provision; resolve a plot (asks for missing dimensions instead of guessing); what changed; compare places; get sources.
- Installation planned as a one-click bundle for AI desktop apps and native installers for Windows, macOS and Linux. A hosted endpoint for ChatGPT and web assistants comes later.
- Until it ships: the "Use with AI" page explains how to use the site's llms.txt, Markdown pages and JSON API.

### 6.6 Why colleges, students and practitioners take part
- **Colleges:** accreditation counts functional MoUs, meaning MoUs with real activity during the assessment period. Bylaw One's MoU comes with activities every semester: a one-day workshop, a faculty session, supervised verification internships. Plus a citable dataset and the state-steward role.
- **Students:** skills employers want (reading city rules; using AI responsibly and checking it against the gazette); 60 to 120-hour verification internships that many universities can count toward internship credit; certificates; named credit in every release; a possible national student design trophy (designing within real, cited rules of a real site).
- **Faculty:** publishable research and thesis material; citable releases.
- **Practitioners:** hours saved finding which rule applies; early access to the agent engine; a voice in what comes next.
- **Civic and data groups:** a shared, open, cited source.

### 6.7 The workshop (one day)
1. Why rules are hard: one plot, many documents (45 min).
2. Follow one rule: the FAR story with the real documents (60 min).
3. Verify for real: each student checks rules against official pages using the Verify page (90 min).
4. AI with citations: ask an AI, check its answer against the page (60 min).
5. Show and tell: findings, errors caught, certificates (30 min).
Also offered as a two-hour faculty session.

### 6.8 Launch timeline
| When | What |
|---|---|
| 30 Nov – 6 Dec 2026 | Trust round merged; pilot work running; partner kit drafted; launch host college chosen; first contact with the national students' architecture association about a trophy |
| 7 – 20 Dec | Pilot work merged; Zenodo DOIs on; engine beta started; quiet pilot with a handful of architects and faculty |
| 21 Dec – 4 Jan 2027 | Fixes from the quiet pilot; demo video; press kit |
| 5 – 16 Jan | Engine beta ready; faculty sessions at the host college; first MoUs finalised |
| Last week of Jan | Public launch in Bengaluru; first student workshop the same week |
| Feb – Mar | Workshops at more colleges; first MoUs signed in Karnataka and other states; monthly "What changed" note begins |
| Apr – mid May | Exam season: workshops pause; internship cohort recruited |
| May – Jul | "Verify Bengaluru" internship cohort; release with named student credits |
| Aug – Oct | Second workshop season; a steward college starts its state's rules |
| Dec 2027 | One-year report |

### 6.9 Sustainability
The rules stay free and open; income comes from around the data:
| Source | When |
|---|---|
| Grants and philanthropy for open civic technology | Early |
| Sponsorship of workshops, the trophy, or a city's rules, credited openly | Early |
| Paid training for firms (reading the rules; using AI responsibly) | Early to mid |
| Services: integrations, hosted endpoints with service guarantees | Mid |
| CSR funding (needs a non-profit with tax registrations and a track record) | Later |
| Government projects on the same open model | Later |

Success at the end of the pilot year: functional MoUs signed; workshops held; students reached; records verified by people; a second state started; regular use by practitioners. Show targets as stated goals and current values generated from data where available.

---

## 7. Pull request

- One draft pull request; preview URL at the top.
- Commit and push after each part; keep `docs/progress.md` current.
- PR description: the page inventory and what was removed or merged; link and figure check results; guide sections written and their sources (repository or brief); **For owner review** (narrative wording, launch dates, sustainability section); decisions made; known gaps.
- Screenshots: guide reading mode at 390 px and 1280 px, slide mode, the downloaded file opened offline, home and footer after clean-up.

---

## 8. Acceptance

- [ ] Every page has one job (`docs/site-map.md`); navigation from one config; no destination in both header and footer; no duplicate links in page bodies; one map address; gaps listed once; consistent figures; CI checks pass.
- [ ] Guide source files with slide summaries, presenter notes and reading versions; generated figures; Mermaid diagrams; Playwright screenshots.
- [ ] `/guide` reading mode with audience entry points, contents, Present and Download buttons.
- [ ] `/guide/slides` with reveal.js, keyboard and speaker view, Bylaw One look.
- [ ] `bylaw-one-guide.html` works offline in both modes, ≤ 10 MB, on the Data page and attached to releases.
- [ ] Planned features described as planned; no install steps for unbuilt software.
- [ ] Narrative, principles, offers, timeline and sustainability follow the content brief.
- [ ] Accessibility and budgets pass.
