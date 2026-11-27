#!/usr/bin/env node
/**
 * Build single-file self-contained offline guide (`public/bylaw-one-guide.html`) — Part 5:
 * - Combines reading mode and slide mode in one HTML file (`Present` / `Reading mode` toggle)
 * - Inlines all CSS, JavaScript (`reveal.js`), subset WOFF2 fonts (`app/fonts/*.woff2`),
 *   pre-rendered SVG Mermaid diagrams (`public/guide/diagrams/*.svg`), and
 *   Playwright screenshots (`public/guide/screenshots/*.png`) as base64 data URIs
 * - Enforces zero network requests (CSP `default-src 'none'`) and total file size <= 10 MB
 * - Displays release version, dataset ID, and date generated on the title page.
 */

import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const guideDir = path.join(repoRoot, "content", "guide");
const diagramsDir = path.join(repoRoot, "public", "guide", "diagrams");
const screenshotsDir = path.join(repoRoot, "public", "guide", "screenshots");
const fontsDir = path.join(repoRoot, "app", "fonts");
const outPath = path.join(repoRoot, "public", "bylaw-one-guide.html");

const MAX_BUNDLE_BYTES = 10 * 1024 * 1024; // 10 MB

function toBase64DataUri(filePath, mimeType) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`[build_guide_bundle] Missing asset file: ${filePath}`);
  }
  const b64 = fs.readFileSync(filePath).toString("base64");
  return `data:${mimeType};base64,${b64}`;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function parseTomlValue(tomlText, section, key, fallback) {
  const secRe = new RegExp(`\\[${section}\\]([\\s\\S]*?)(?:\\n\\[|$)`);
  const secM = secRe.exec(tomlText);
  if (!secM) return fallback;
  const keyRe = new RegExp(`^\\s*${key}\\s*=\\s*"([^"]*)"`, "m");
  const keyM = keyRe.exec(secM[1]);
  return keyM ? keyM[1].trim() : fallback;
}

function loadPlaceholders() {
  const tomlPath = path.join(repoRoot, "bylaws.toml");
  const tomlText = fs.existsSync(tomlPath)
    ? fs.readFileSync(tomlPath, "utf8")
    : "";
  const contactEmail = parseTomlValue(
    tomlText,
    "contact",
    "email",
    "contact@example.org"
  );
  const organisationName = parseTomlValue(
    tomlText,
    "organisation",
    "name",
    "[Owner's Organisation]"
  );
  const githubRepoUrl = parseTomlValue(
    tomlText,
    "organisation",
    "github_repo",
    "https://github.com/manideepmamidala2-bit/bylaws-india"
  );
  const siteUrl = parseTomlValue(
    tomlText,
    "organisation",
    "site_url",
    "https://bylaws-india.vercel.app"
  );

  const manifest = JSON.parse(
    fs.readFileSync(
      path.join(repoRoot, "public", "data", "manifest.json"),
      "utf8"
    )
  );
  const visible = manifest.jurisdictions.filter((j) => j.visibility !== "test");
  const parentJur =
    visible.find((j) => visible.some((c) => c.parent === j.id)) || visible[0];
  const childCorps = visible.filter((j) => j.parent === parentJur.id);
  const ver = parentJur.latest_release || "4.0.0";
  const parentDataDir = path.join(
    repoRoot,
    "public",
    "data",
    parentJur.id,
    ver
  );
  const southDataDir = path.join(
    repoRoot,
    "public",
    "data",
    "in-ka-bengaluru-south",
    ver
  );

  const docs = JSON.parse(
    fs.readFileSync(path.join(parentDataDir, "documents.json"), "utf8")
  );
  const inForceDocs = docs.filter(
    (d) =>
      d.legal_status === "in_force" &&
      d.acquisition_status !== "not_found" &&
      d.applies_to_jurisdiction?.status !== "no" &&
      (d.instrument_type ?? "instrument") !== "map" &&
      (d.instrument_type ?? "instrument") !== "compilation"
  );
  const bodies = new Set();
  for (const d of inForceDocs) {
    const p = (d.issuing_authority || "")
      .split(/[/,]/)
      .map((s) => s.trim().toLowerCase())
      .find(Boolean);
    if (p) bodies.add(p);
  }

  let provisionsCount = 0;
  let machineCheckedProvs = 0;
  let humanVerifiedProvs = 0;
  const parentRel = parentJur.releases.find((r) => r.version === ver);
  for (const clRel of [
    ...(parentRel.files?.clauses || []),
    ...(parentRel.drafts?.clauses || []),
  ]) {
    const clPath = path.join(repoRoot, "public", clRel.replace(/^\/+/, ""));
    if (!fs.existsSync(clPath)) continue;
    const tree = JSON.parse(fs.readFileSync(clPath, "utf8"));
    for (const c of tree.clauses || []) {
      if (c.superseded_by || c.record_superseded_by) continue;
      if (c.type === "table_row") continue;
      provisionsCount += 1;
      if (c.verification === "machine_checked") machineCheckedProvs += 1;
      if (c.verification === "human_verified") humanVerifiedProvs += 1;
    }
  }

  const paramsPayload = JSON.parse(
    fs.readFileSync(path.join(parentDataDir, "parameters.json"), "utf8")
  );
  const allParams = paramsPayload.records || [];
  const machineCheckedParams = allParams.filter(
    (r) => r.verification === "machine_checked"
  ).length;
  const humanVerifiedParams = allParams.filter(
    (r) => r.verification === "human_verified"
  ).length;

  const wardsFc = JSON.parse(
    fs.readFileSync(path.join(parentDataDir, "wards.geojson"), "utf8")
  );
  const zonesFc = JSON.parse(
    fs.readFileSync(path.join(southDataDir, "zones.geojson"), "utf8")
  );
  const activeZones = (zonesFc.features || []).filter(
    (z) => !z.properties?.superseded_by && !z.properties?.record_superseded_by
  );
  const machineCheckedZones = activeZones.filter(
    (z) => z.properties?.verification === "machine_checked"
  ).length;
  const humanVerifiedZones = activeZones.filter(
    (z) => z.properties?.verification === "human_verified"
  ).length;
  const sheetsSet = new Set(
    activeZones.map((z) => z.properties?.source_map).filter(Boolean)
  );
  const sheetsCount = sheetsSet.size || 4;

  const totalMachineChecked =
    machineCheckedProvs + machineCheckedParams + machineCheckedZones;
  const totalHumanVerified =
    humanVerifiedProvs + humanVerifiedParams + humanVerifiedZones;

  return {
    city: parentJur.aliases?.[0] || "Bengaluru",
    region: parentJur.aliases?.[2] || "Greater Bengaluru",
    state: "Karnataka",
    partial_zone_area: "Bengaluru South",
    documents_in_force: String(inForceDocs.length),
    registered_sources: String(docs.length),
    issuing_bodies: String(bodies.size),
    provisions: provisionsCount.toLocaleString("en-IN"),
    rules_as_data: "271",
    total_parameters: String(allParams.length),
    corporations: String(childCorps.length),
    wards: String(wardsFc.features.length),
    active_zones: activeZones.length.toLocaleString("en-IN"),
    processed_sheets:
      sheetsCount === 1 ? "1 sheet" : `${sheetsCount} sheets`,
    processed_sheets_count: String(sheetsCount),
    map_coverage_pct: "1.5%",
    road_median_offset_m: "8 m",
    road_p90_offset_m: "21 m",
    verified_by_people: String(totalHumanVerified),
    machine_checked: totalMachineChecked.toLocaleString("en-IN"),
    checks_per_build: "10",
    current_as_of: "14 May 2026",
    release_version: ver,
    dataset_id: manifest.dataset_id || "",
    contact_email: contactEmail,
    organisation_name: organisationName,
    github_repo_url: githubRepoUrl,
    site_url: siteUrl,
    generated_date: "27 November 2026",
  };
}

function interpolate(rawText, placeholders) {
  return rawText.replace(/\{\{([a-z0-9_]+)\}\}/gi, (_full, k) => {
    const key = String(k).toLowerCase();
    if (!(key in placeholders)) {
      throw new Error(`Unknown placeholder {{${k}}} in offline bundle`);
    }
    return placeholders[key];
  });
}

function renderInlineMdHtml(text, siteUrl) {
  let out = escapeHtml(text);
  // Links [**label**](url) or [label](url)
  out = out.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    (_m, rawLabel, rawHref) => {
      const href = rawHref.startsWith("/")
        ? `${siteUrl.replace(/\/+$/, "")}${rawHref}`
        : rawHref;
      const cleanLabel = rawLabel
        .replace(/^\*\*|\*\*$/g, "")
        .replace(/^`|`$/g, "");
      const isBold = rawLabel.startsWith("**") && rawLabel.endsWith("**");
      return `<a href="${href}" class="inline-link">${isBold ? `<strong>${cleanLabel}</strong>` : cleanLabel}</a>`;
    }
  );
  // Bold **...**
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  // Italic *...*
  out = out.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  // Inline code `...`
  out = out.replace(/`([^`]+)`/g, "<code>$1</code>");
  return out;
}

function renderMarkdownBlocksHtml(markdown, sectionTitle, siteUrl) {
  const blocks = markdown
    .trim()
    .split(/\r?\n\r?\n+/)
    .map((b) => b.trim())
    .filter(Boolean);

  return blocks
    .map((block, bIdx) => {
      const lines = block.split(/\r?\n/);
      if (lines.length === 1 && lines[0].startsWith("### ")) {
        return `<h3>${renderInlineMdHtml(lines[0].slice(4).trim(), siteUrl)}</h3>`;
      }
      if (lines.every((l) => l.trim().startsWith(">"))) {
        const q = lines.map((l) => l.trim().replace(/^>\s?/, "")).join(" ");
        return `<blockquote>${renderInlineMdHtml(q, siteUrl)}</blockquote>`;
      }
      if (
        lines.length >= 3 &&
        lines[0].trim().startsWith("|") &&
        /^\|[\s:|-]+\|$/.test(lines[1].trim())
      ) {
        const parseRow = (r) =>
          r
            .trim()
            .replace(/^\|/, "")
            .replace(/\|$/, "")
            .split("|")
            .map((c) => c.trim());
        const headers = parseRow(lines[0]);
        const rows = lines.slice(2).map(parseRow);
        return `<div class="table-wrap" tabindex="0" role="region" aria-label="${escapeHtml(sectionTitle)} table ${bIdx + 1}"><table class="dg-table"><thead><tr>${headers.map((h) => `<th>${renderInlineMdHtml(h, siteUrl)}</th>`).join("")}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${renderInlineMdHtml(c, siteUrl)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
      }
      if (lines.every((l) => l.trim().startsWith("- "))) {
        return `<ul>${lines.map((l) => `<li>${renderInlineMdHtml(l.trim().slice(2).trim(), siteUrl)}</li>`).join("")}</ul>`;
      }
      if (lines.every((l) => /^\d+\.\s+/.test(l.trim()))) {
        return `<ol>${lines.map((l) => `<li>${renderInlineMdHtml(l.trim().replace(/^\d+\.\s+/, ""), siteUrl)}</li>`).join("")}</ol>`;
      }
      return `<p>${renderInlineMdHtml(lines.join(" "), siteUrl)}</p>`;
    })
    .join("\n");
}

function parseBracketList(rawVal) {
  if (!rawVal) return [];
  const trimmed = rawVal.trim();
  const inner =
    trimmed.startsWith("[") && trimmed.endsWith("]")
      ? trimmed.slice(1, -1)
      : trimmed;
  return inner
    .split(",")
    .map((s) => s.trim().replace(/^["']|["']$/g, ""))
    .filter(Boolean);
}

function buildOfflineGuideHtml() {
  const placeholders = loadPlaceholders();
  const assetsJson = JSON.parse(
    fs.readFileSync(path.join(guideDir, "assets.json"), "utf8")
  );

  // Fonts as base64 data URIs
  const fontInterTight = toBase64DataUri(
    path.join(fontsDir, "inter-tight-latin.woff2"),
    "font/woff2"
  );
  const fontSerifNormal = toBase64DataUri(
    path.join(fontsDir, "source-serif-4-latin-normal.woff2"),
    "font/woff2"
  );
  const fontSerifItalic = toBase64DataUri(
    path.join(fontsDir, "source-serif-4-latin-italic.woff2"),
    "font/woff2"
  );
  const fontMono = toBase64DataUri(
    path.join(fontsDir, "jetbrains-mono-latin.woff2"),
    "font/woff2"
  );

  // Diagrams (inline SVG)
  const diagramById = new Map();
  for (const d of assetsJson.diagrams) {
    const svgPath = path.join(diagramsDir, `${d.id}.svg`);
    const svgMarkup = fs.existsSync(svgPath)
      ? fs.readFileSync(svgPath, "utf8")
      : "";
    diagramById.set(d.id, {
      id: d.id,
      sectionId: d.sectionId,
      title: interpolate(d.title, placeholders),
      caption: interpolate(d.caption, placeholders),
      slideSummary: interpolate(d.slideSummary, placeholders),
      presenterNotes: interpolate(d.presenterNotes, placeholders),
      svgMarkup,
    });
  }

  // Screenshots (base64 data URIs)
  const screenshotById = new Map();
  for (const s of assetsJson.screenshots) {
    const deskFile = path.join(
      screenshotsDir,
      path.basename(s.desktopSrc)
    );
    const mobFile = path.join(
      screenshotsDir,
      path.basename(s.mobileSrc)
    );
    screenshotById.set(s.id, {
      id: s.id,
      sectionId: s.sectionId,
      title: interpolate(s.title, placeholders),
      caption: interpolate(s.caption, placeholders),
      slideSummary: interpolate(s.slideSummary, placeholders),
      presenterNotes: interpolate(s.presenterNotes, placeholders),
      desktopDataUri: toBase64DataUri(deskFile, "image/png"),
      mobileDataUri: toBase64DataUri(mobFile, "image/png"),
    });
  }

  // Parse all 12 markdown sections
  const mdFiles = fs
    .readdirSync(guideDir)
    .filter((f) => /^\d{2}-.*\.md$/.test(f))
    .sort();

  const sections = [];
  const slides = [];

  for (const fileName of mdFiles) {
    const raw = fs.readFileSync(path.join(guideDir, fileName), "utf8").trim();
    const fmMatch = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/.exec(raw);
    if (!fmMatch) continue;
    const fm = {};
    for (const line of fmMatch[1].split(/\r?\n/)) {
      const idx = line.indexOf(":");
      if (idx === -1) continue;
      fm[line.slice(0, idx).trim()] = line
        .slice(idx + 1)
        .trim()
        .replace(/^["']|["']$/g, "");
    }
    const body = fmMatch[2];
    const slideSummary = interpolate(
      (/## Slide summary\s+([\s\S]*?)(?=\r?\n## Presenter notes\b)/.exec(body)?.[1] || "").trim(),
      placeholders
    );
    const presenterNotes = interpolate(
      (/## Presenter notes\s+([\s\S]*?)(?=\r?\n## Reading version\b)/.exec(body)?.[1] || "").trim(),
      placeholders
    );
    const readingMarkdown = interpolate(
      (/## Reading version\s+([\s\S]*)$/.exec(body)?.[1] || "").trim(),
      placeholders
    );

    const id = fm.id;
    const number = fm.number || "00";
    const title = interpolate(fm.title || id, placeholders);
    const kicker = interpolate(fm.kicker || `Section ${number}`, placeholders);
    const secDiagrams = parseBracketList(fm.diagrams)
      .map((did) => diagramById.get(did))
      .filter(Boolean);
    const secScreenshots = parseBracketList(fm.screenshots)
      .map((sid) => screenshotById.get(sid))
      .filter(Boolean);

    const firstSlideIndex = slides.length;
    slides.push({
      slideIndex: firstSlideIndex,
      slideId: `slide-${id}`,
      sectionId: id,
      sectionNumber: number,
      sectionTitle: title,
      kicker,
      kind: "section",
      heading: title,
      summaryText: slideSummary,
      presenterNotes,
    });

    for (const diag of secDiagrams) {
      slides.push({
        slideIndex: slides.length,
        slideId: `slide-diagram-${diag.id}`,
        sectionId: id,
        sectionNumber: number,
        sectionTitle: title,
        kicker: `${kicker} · Diagram`,
        kind: "diagram",
        heading: diag.title,
        summaryText: diag.slideSummary,
        presenterNotes: diag.presenterNotes,
        diagram: diag,
      });
    }

    for (const shot of secScreenshots) {
      slides.push({
        slideIndex: slides.length,
        slideId: `slide-screenshot-${shot.id}`,
        sectionId: id,
        sectionNumber: number,
        sectionTitle: title,
        kicker: `${kicker} · Live View`,
        kind: "screenshot",
        heading: shot.title,
        summaryText: shot.slideSummary,
        presenterNotes: shot.presenterNotes,
        screenshot: shot,
      });
    }

    sections.push({
      id,
      number,
      title,
      kicker,
      slideSummary,
      presenterNotes,
      readingHtml: renderMarkdownBlocksHtml(
        readingMarkdown,
        title,
        placeholders.site_url
      ),
      diagrams: secDiagrams,
      screenshots: secScreenshots,
      firstSlideIndex,
    });
  }

  const revealJsSource = fs
    .readFileSync(
      path.join(repoRoot, "node_modules", "reveal.js", "dist", "reveal.js"),
      "utf8"
    )
    .replace(/<\/script>/gi, "<\\/script>");

  const readingSectionsHtml = sections
    .map((sec) => {
      const headingLabel =
        sec.number === "00"
          ? escapeHtml(sec.title)
          : `${Number(sec.number)}. ${escapeHtml(sec.title)}`;
      const diagsHtml = sec.diagrams
        .map(
          (diag) => `
          <figure class="asset-box" data-testid="offline-diagram-${diag.id}" aria-label="${escapeHtml(diag.title)}">
            <figcaption class="asset-caption">
              <div class="dg-mono">Diagram · ${escapeHtml(diag.title)}</div>
              <p>${escapeHtml(diag.caption)}</p>
            </figcaption>
            <div class="svg-container">${diag.svgMarkup}</div>
          </figure>`
        )
        .join("\n");

      const shotsHtml = sec.screenshots
        .map(
          (shot) => `
          <figure class="asset-box" data-testid="offline-screenshot-${shot.id}" aria-label="${escapeHtml(shot.title)}">
            <figcaption class="asset-caption">
              <div class="dg-mono">Live view · ${escapeHtml(shot.title)}</div>
              <p>${escapeHtml(shot.caption)}</p>
            </figcaption>
            <img src="${shot.desktopDataUri}" alt="${escapeHtml(shot.title)} (1280 px desktop view)" class="screenshot-img" />
            <details class="details-box">
              <summary class="details-summary">Details · Phone view (390 px) &amp; presenter notes</summary>
              <div class="mobile-shot-grid">
                <img src="${shot.mobileDataUri}" alt="${escapeHtml(shot.title)} (390 px phone view)" class="mobile-shot-img" />
                <div>
                  <div class="dg-mono">Presenter notes</div>
                  <p>${escapeHtml(shot.presenterNotes)}</p>
                </div>
              </div>
            </details>
          </figure>`
        )
        .join("\n");

      return `
      <section id="section-${sec.id}" data-section-id="${sec.id}" data-testid="offline-section-${sec.id}" class="guide-section">
        <div class="section-top-row">
          <span class="dg-mono">${escapeHtml(sec.kicker)}</span>
          <button type="button" class="link-btn start-from-section-btn" data-slide-index="${sec.firstSlideIndex}" data-testid="offline-start-slides-${sec.id}">
            Start from section →
          </button>
        </div>
        <h2>${headingLabel}</h2>
        <div class="prose-blocks">${sec.readingHtml}</div>
        ${diagsHtml}
        ${shotsHtml}
        <details class="details-box">
          <summary class="details-summary">Details · Slide summary &amp; presenter notes</summary>
          <div class="details-body">
            <p><strong>Slide summary:</strong> ${escapeHtml(sec.slideSummary)}</p>
            <p><strong>Presenter notes:</strong> ${escapeHtml(sec.presenterNotes)}</p>
          </div>
        </details>
      </section>`;
    })
    .join("\n");

  const slidesHtml = slides
    .map((slide, idx) => {
      let mediaHtml = "";
      if (slide.kind === "diagram" && slide.diagram) {
        mediaHtml = `
          <figure class="asset-box">
            <div class="svg-container">${slide.diagram.svgMarkup}</div>
            <figcaption class="asset-caption"><p>${escapeHtml(slide.diagram.caption)}</p></figcaption>
          </figure>`;
      } else if (slide.kind === "screenshot" && slide.screenshot) {
        mediaHtml = `
          <figure class="asset-box">
            <img src="${slide.screenshot.desktopDataUri}" alt="${escapeHtml(slide.screenshot.title)}" class="screenshot-img slide-shot" />
            <figcaption class="asset-caption"><p>${escapeHtml(slide.screenshot.caption)}</p></figcaption>
          </figure>`;
      }
      return `
      <section id="${slide.slideId}" data-slide-index="${idx}" data-section-id="${slide.sectionId}" data-notes="${escapeHtml(slide.presenterNotes)}" class="offline-slide ${idx === 0 ? "active-slide" : ""}">
        <div class="section-top-row">
          <span class="dg-mono">${escapeHtml(slide.kicker)}</span>
          <span class="dg-mono">${idx + 1} / ${slides.length}</span>
        </div>
        <h2 class="slide-heading">${escapeHtml(slide.heading)}</h2>
        <p class="slide-summary">${escapeHtml(slide.summaryText)}</p>
        ${mediaHtml}
        <aside class="notes">${escapeHtml(slide.presenterNotes)}</aside>
      </section>`;
    })
    .join("\n");

  const audiencesJson = JSON.stringify(assetsJson.audiences);
  const sectionsMetaJson = JSON.stringify(
    sections.map((s) => ({
      id: s.id,
      number: s.number,
      title: s.title,
      firstSlideIndex: s.firstSlideIndex,
    }))
  );
  const slidesMetaJson = JSON.stringify(
    slides.map((s) => ({
      slideIndex: s.slideIndex,
      slideId: s.slideId,
      sectionId: s.sectionId,
      heading: s.heading,
      summaryText: s.summaryText,
      presenterNotes: s.presenterNotes,
    }))
  );

  return `<!DOCTYPE html>
<html lang="en" data-dataset-id="${escapeHtml(placeholders.dataset_id)}" data-release-version="${escapeHtml(placeholders.release_version)}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; font-src data:; style-src 'unsafe-inline'; script-src 'unsafe-inline';" />
  <title>The Bylaw One Guide · Release v${escapeHtml(placeholders.release_version)} (${escapeHtml(placeholders.dataset_id)})</title>
  <style>
    @font-face {
      font-family: "Inter Tight";
      font-style: normal;
      font-weight: 400 700;
      font-display: swap;
      src: url("${fontInterTight}") format("woff2");
    }
    @font-face {
      font-family: "Source Serif 4";
      font-style: normal;
      font-weight: 400 600;
      font-display: swap;
      src: url("${fontSerifNormal}") format("woff2");
    }
    @font-face {
      font-family: "Source Serif 4";
      font-style: italic;
      font-weight: 400 600;
      font-display: swap;
      src: url("${fontSerifItalic}") format("woff2");
    }
    @font-face {
      font-family: "JetBrains Mono";
      font-style: normal;
      font-weight: 400 500;
      font-display: swap;
      src: url("${fontMono}") format("woff2");
    }
    :root {
      --bg-paper: #f5f3ed;
      --bg-subtle: #efeee8;
      --ink: #080909;
      --ink-body: #171917;
      --ink-muted: #5b5e56;
      --rule: #c8ccc0;
      --accent: #ff6b52;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: var(--bg-paper);
      color: var(--ink);
      font-family: "Inter Tight", system-ui, -apple-system, sans-serif;
      line-height: 1.5;
    }
    .container {
      max-width: 1024px;
      margin: 0 auto;
      padding: 24px 20px 64px;
    }
    .top-bar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      border-bottom: 1px solid var(--rule);
      padding-bottom: 14px;
      margin-bottom: 24px;
    }
    .brand {
      font-size: 18px;
      font-weight: 600;
      letter-spacing: -0.02em;
    }
    .dg-mono {
      font-family: "JetBrains Mono", ui-monospace, monospace;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: var(--ink-muted);
    }
    .title-header {
      border-bottom: 1px solid var(--rule);
      padding-bottom: 24px;
      margin-bottom: 28px;
    }
    h1 {
      font-size: clamp(28px, 4vw, 40px);
      font-weight: 600;
      letter-spacing: -0.025em;
      margin: 8px 0 12px;
    }
    h2 {
      font-size: clamp(22px, 3vw, 28px);
      font-weight: 600;
      letter-spacing: -0.02em;
      margin: 8px 0 12px;
    }
    h3 {
      font-size: 18px;
      font-weight: 600;
      margin: 20px 0 8px;
    }
    p, li, td {
      font-family: "Source Serif 4", Georgia, serif;
      font-size: 16px;
      line-height: 1.65;
      color: var(--ink-body);
    }
    code {
      font-family: "JetBrains Mono", ui-monospace, monospace;
      font-size: 12px;
      background: var(--bg-subtle);
      padding: 2px 5px;
      color: var(--ink);
    }
    blockquote {
      margin: 16px 0;
      padding: 14px 18px;
      border-left: 4px solid var(--ink);
      background: var(--bg-subtle);
      font-family: "Source Serif 4", Georgia, serif;
    }
    .btn {
      display: inline-flex;
      min-height: 44px;
      align-items: center;
      padding: 8px 16px;
      border: 1px solid var(--ink);
      background: var(--bg-paper);
      color: var(--ink);
      font-family: "JetBrains Mono", ui-monospace, monospace;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      cursor: pointer;
      text-decoration: none;
    }
    .btn-primary {
      background: var(--ink);
      color: var(--bg-paper);
    }
    .btn-active {
      border-bottom: 2px solid var(--accent);
      background: var(--bg-subtle);
      font-weight: 600;
    }
    .link-btn {
      background: transparent;
      border: none;
      color: var(--ink);
      font-family: "JetBrains Mono", ui-monospace, monospace;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      text-decoration: underline;
      cursor: pointer;
      min-height: 44px;
    }
    .inline-link {
      color: var(--ink);
      text-decoration: underline;
    }
    .audience-bar {
      border-bottom: 1px solid var(--rule);
      padding-bottom: 24px;
      margin-bottom: 28px;
    }
    .audience-buttons {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 12px;
    }
    .audience-path-box {
      margin-top: 16px;
      border: 1px solid var(--ink);
      border-left: 4px solid var(--accent);
      background: var(--bg-subtle);
      padding: 16px;
    }
    .audience-path-links {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      list-style: none;
      padding: 0;
      margin: 12px 0 0;
    }
    .reading-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 32px;
    }
    @media (min-width: 900px) {
      .reading-grid {
        grid-template-columns: 230px minmax(0, 1fr);
      }
      .sticky-toc {
        position: sticky;
        top: 20px;
      }
    }
    .sticky-toc {
      border: 1px solid var(--rule);
      background: var(--bg-subtle);
      padding: 14px;
    }
    .toc-list {
      list-style: none;
      padding: 0;
      margin: 10px 0 0;
    }
    .toc-link {
      display: flex;
      align-items: baseline;
      gap: 8px;
      padding: 6px 8px;
      font-size: 13px;
      color: var(--ink);
      text-decoration: none;
      border-left: 2px solid transparent;
    }
    .toc-link.current {
      border-left-color: var(--accent);
      background: var(--bg-paper);
      font-weight: 600;
    }
    .guide-section {
      border-bottom: 1px solid var(--rule);
      padding-bottom: 40px;
      margin-bottom: 40px;
    }
    .section-top-row {
      display: flex;
      flex-wrap: wrap;
      align-items: baseline;
      justify-content: space-between;
      gap: 8px;
    }
    .table-wrap {
      overflow-x: auto;
      margin: 16px 0;
    }
    .dg-table {
      width: 100%;
      border-collapse: collapse;
      border-top: 1px solid var(--ink);
      border-bottom: 1px solid var(--ink);
    }
    .dg-table th {
      text-align: left;
      font-family: "JetBrains Mono", ui-monospace, monospace;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      padding: 10px 8px;
      border-bottom: 1px solid var(--ink);
    }
    .dg-table td {
      padding: 10px 8px;
      border-bottom: 1px solid var(--rule);
      font-size: 14px;
    }
    .asset-box {
      margin: 20px 0;
      border: 1px solid var(--ink);
      background: var(--bg-subtle);
      padding: 16px;
    }
    .asset-caption {
      margin-bottom: 10px;
    }
    .asset-caption p {
      font-size: 13px;
      margin: 4px 0 0;
    }
    .svg-container {
      background: var(--bg-paper);
      border: 1px solid var(--rule);
      padding: 12px;
      overflow-x: auto;
    }
    .svg-container svg {
      max-width: 100%;
      height: auto;
    }
    .screenshot-img {
      width: 100%;
      height: auto;
      border: 1px solid var(--rule);
      background: var(--bg-paper);
      display: block;
    }
    .slide-shot {
      max-height: 400px;
      object-fit: contain;
      object-position: top;
    }
    .details-box {
      margin-top: 12px;
      border-top: 1px solid var(--rule);
      padding-top: 8px;
    }
    .details-summary {
      cursor: pointer;
      font-family: "JetBrains Mono", ui-monospace, monospace;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--ink-muted);
      min-height: 36px;
      display: inline-flex;
      align-items: center;
    }
    .mobile-shot-grid {
      display: grid;
      grid-template-columns: 180px 1fr;
      gap: 16px;
      margin-top: 10px;
      align-items: start;
    }
    .mobile-shot-img {
      width: 170px;
      height: auto;
      border: 1px solid var(--rule);
    }
    .hidden { display: none !important; }
    .slide-canvas {
      border: 2px solid var(--ink);
      background: var(--bg-paper);
      padding: 32px;
      min-height: 420px;
    }
    .offline-slide { display: none; }
    .offline-slide.active-slide { display: block; }
    .slide-heading {
      font-size: clamp(26px, 3.5vw, 38px);
      margin: 14px 0;
    }
    .slide-summary {
      font-size: clamp(18px, 2.2vw, 24px);
      border-left: 4px solid var(--accent);
      padding-left: 16px;
      color: var(--ink);
    }
    .speaker-panel {
      margin-top: 20px;
      border: 2px solid var(--ink);
      background: var(--bg-subtle);
      padding: 20px;
    }
    .notes { display: none; }
  </style>
</head>
<body>
  <div class="container">
    <header class="top-bar" role="banner">
      <div>
        <div class="brand">Bylaw One · The Guide (Offline Single-File Edition)</div>
        <div class="dg-mono" data-testid="offline-release-meta">
          Release v${escapeHtml(placeholders.release_version)} · Dataset ${escapeHtml(placeholders.dataset_id)} · Generated ${escapeHtml(placeholders.generated_date)} · Current as of ${escapeHtml(placeholders.current_as_of)}
        </div>
      </div>
      <div>
        <button type="button" id="mode-toggle-btn" data-testid="offline-mode-toggle" class="btn btn-primary">
          Present (slide mode)
        </button>
      </div>
    </header>

    <main id="main-content">
      <!-- READING MODE -->
      <div id="reading-mode-view" data-testid="offline-reading-mode">
        <div class="title-header">
          <div class="dg-mono">Bylaw One · ${escapeHtml(placeholders.region)}</div>
          <h1>${escapeHtml(placeholders.city)}'s building rules. One code.</h1>
          <p>
            Self-contained offline edition of the Bylaw One Guide (Release v${escapeHtml(placeholders.release_version)}, dataset <code>${escapeHtml(placeholders.dataset_id)}</code>, generated ${escapeHtml(placeholders.generated_date)}). Switch between reading mode and presentation slide mode at any time using the <strong>Present</strong> button above.
          </p>
        </div>

        <section class="audience-bar" aria-label="Audience entry points" data-testid="offline-audience-entry-points">
          <div class="dg-mono">Start here · Choose your path</div>
          <div class="audience-buttons" id="audience-buttons-container"></div>
          <div id="audience-path-box" class="audience-path-box hidden" data-testid="offline-audience-path"></div>
        </section>

        <div class="reading-grid">
          <aside aria-label="Guide contents">
            <nav class="sticky-toc" data-testid="offline-sticky-contents">
              <div class="dg-mono">Contents</div>
              <ol class="toc-list" id="toc-list-container">
                ${sections
                  .map(
                    (sec, idx) =>
                      `<li><a href="#section-${sec.id}" class="toc-link ${idx === 0 ? "current" : ""}" data-toc-sec="${sec.id}"><span class="dg-mono">${sec.number}</span><span>${escapeHtml(sec.title)}</span></a></li>`
                  )
                  .join("")}
              </ol>
            </nav>
          </aside>
          <div>
            ${readingSectionsHtml}
          </div>
        </div>
      </div>

      <!-- SLIDE MODE -->
      <div id="slide-mode-view" data-testid="offline-slide-mode" class="hidden">
        <div class="top-bar">
          <span class="dg-mono" id="offline-slide-counter" data-testid="offline-slide-counter">
            Slide 1 / ${slides.length}
          </span>
          <div style="display:flex;flex-wrap:wrap;gap:8px;">
            <button type="button" id="slide-prev-btn" data-testid="offline-slide-prev" class="btn">← Prev</button>
            <button type="button" id="slide-next-btn" data-testid="offline-slide-next" class="btn btn-primary">Next →</button>
            <button type="button" id="slide-notes-btn" data-testid="offline-slide-notes-toggle" class="btn">Speaker view (S)</button>
          </div>
        </div>

        <div id="slide-section-strip" style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:16px;">
          ${sections
            .map(
              (sec, idx) =>
                `<button type="button" class="btn ${idx === 0 ? "btn-active" : ""}" data-jump-slide="${sec.firstSlideIndex}" data-sec-strip="${sec.id}">${sec.number} · ${escapeHtml(sec.title)}</button>`
            )
            .join("")}
        </div>

        <div class="reveal slide-canvas" id="offline-reveal-deck">
          <div class="slides">
            ${slidesHtml}
          </div>
        </div>

        <aside id="offline-speaker-panel" data-testid="offline-speaker-panel" class="speaker-panel hidden" aria-label="Speaker view presenter notes">
          <div class="dg-mono" id="speaker-notes-header">Presenter notes · Slide 1 of ${slides.length}</div>
          <p id="speaker-notes-body" data-testid="offline-speaker-notes-text">${escapeHtml(slides[0]?.presenterNotes || "")}</p>
        </aside>
      </div>
    </main>
  </div>

  <script>${revealJsSource}</script>
  <script>
    (function() {
      var AUDIENCES = ${audiencesJson};
      var SECTIONS = ${sectionsMetaJson};
      var SLIDES = ${slidesMetaJson};

      var mode = "reading";
      var currentSlideIdx = 0;
      var speakerNotesOpen = false;
      var selectedAudienceId = null;

      var modeToggleBtn = document.getElementById("mode-toggle-btn");
      var readingView = document.getElementById("reading-mode-view");
      var slideView = document.getElementById("slide-mode-view");
      var slideCounter = document.getElementById("offline-slide-counter");
      var speakerPanel = document.getElementById("offline-speaker-panel");
      var speakerHeader = document.getElementById("speaker-notes-header");
      var speakerBody = document.getElementById("speaker-notes-body");

      function setMode(nextMode, targetSlideIndex) {
        mode = nextMode;
        if (mode === "slides") {
          readingView.classList.add("hidden");
          slideView.classList.remove("hidden");
          modeToggleBtn.textContent = "Reading mode";
          if (typeof targetSlideIndex === "number") {
            goToSlide(targetSlideIndex);
          } else {
            goToSlide(currentSlideIdx);
          }
        } else {
          slideView.classList.add("hidden");
          readingView.classList.remove("hidden");
          modeToggleBtn.textContent = "Present (slide mode)";
        }
      }

      function goToSlide(idx) {
        currentSlideIdx = Math.max(0, Math.min(SLIDES.length - 1, idx));
        var slideEls = document.querySelectorAll(".offline-slide");
        for (var i = 0; i < slideEls.length; i++) {
          if (i === currentSlideIdx) {
            slideEls[i].classList.add("active-slide");
          } else {
            slideEls[i].classList.remove("active-slide");
          }
        }
        var sMeta = SLIDES[currentSlideIdx];
        slideCounter.textContent = "Slide " + (currentSlideIdx + 1) + " / " + SLIDES.length;
        speakerHeader.textContent = "Presenter notes · Slide " + (currentSlideIdx + 1) + " of " + SLIDES.length;
        speakerBody.textContent = sMeta ? sMeta.presenterNotes : "";

        var stripBtns = document.querySelectorAll("[data-sec-strip]");
        for (var j = 0; j < stripBtns.length; j++) {
          var secId = stripBtns[j].getAttribute("data-sec-strip");
          if (sMeta && secId === sMeta.sectionId) {
            stripBtns[j].classList.add("btn-active");
          } else {
            stripBtns[j].classList.remove("btn-active");
          }
        }
      }

      modeToggleBtn.addEventListener("click", function() {
        setMode(mode === "reading" ? "slides" : "reading");
      });

      document.getElementById("slide-prev-btn").addEventListener("click", function() {
        goToSlide(currentSlideIdx - 1);
      });
      document.getElementById("slide-next-btn").addEventListener("click", function() {
        goToSlide(currentSlideIdx + 1);
      });
      document.getElementById("slide-notes-btn").addEventListener("click", function() {
        speakerNotesOpen = !speakerNotesOpen;
        if (speakerNotesOpen) {
          speakerPanel.classList.remove("hidden");
        } else {
          speakerPanel.classList.add("hidden");
        }
      });

      var startBtns = document.querySelectorAll(".start-from-section-btn");
      for (var k = 0; k < startBtns.length; k++) {
        startBtns[k].addEventListener("click", function(ev) {
          var idx = Number(ev.currentTarget.getAttribute("data-slide-index") || "0");
          setMode("slides", idx);
        });
      }

      var jumpBtns = document.querySelectorAll("[data-jump-slide]");
      for (var m = 0; m < jumpBtns.length; m++) {
        jumpBtns[m].addEventListener("click", function(ev) {
          var idx = Number(ev.currentTarget.getAttribute("data-jump-slide") || "0");
          goToSlide(idx);
        });
      }

      // Audience selector buttons
      var audContainer = document.getElementById("audience-buttons-container");
      var audPathBox = document.getElementById("audience-path-box");
      var secById = {};
      for (var s = 0; s < SECTIONS.length; s++) {
        secById[SECTIONS[s].id] = SECTIONS[s];
      }

      function renderAudienceButtons() {
        audContainer.innerHTML = "";
        for (var i = 0; i < AUDIENCES.length; i++) {
          (function(aud) {
            var btn = document.createElement("button");
            btn.type = "button";
            btn.className = "btn" + (selectedAudienceId === aud.id ? " btn-active" : "");
            btn.setAttribute("data-testid", "offline-audience-btn-" + aud.id);
            btn.textContent = aud.label;
            btn.addEventListener("click", function() {
              selectedAudienceId = selectedAudienceId === aud.id ? null : aud.id;
              renderAudienceButtons();
              renderAudiencePath();
            });
            audContainer.appendChild(btn);
          })(AUDIENCES[i]);
        }
      }

      function renderAudiencePath() {
        if (!selectedAudienceId) {
          audPathBox.classList.add("hidden");
          audPathBox.innerHTML = "";
          return;
        }
        var found = null;
        for (var i = 0; i < AUDIENCES.length; i++) {
          if (AUDIENCES[i].id === selectedAudienceId) found = AUDIENCES[i];
        }
        if (!found) return;
        audPathBox.classList.remove("hidden");
        var linksHtml = found.sectionIds.map(function(sid, idx) {
          var sec = secById[sid];
          return sec ? '<li><a href="#section-' + sid + '" class="btn">' + (idx + 1) + '. ' + sec.title + '</a></li>' : '';
        }).join("");
        audPathBox.innerHTML = '<div class="dg-mono">Recommended path for: ' + found.roleTitle + '</div><p>' + found.summary + '</p><ol class="audience-path-links">' + linksHtml + '</ol>';
      }

      renderAudienceButtons();

      window.addEventListener("keydown", function(e) {
        if (mode !== "slides") return;
        if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") {
          e.preventDefault();
          goToSlide(currentSlideIdx + 1);
        } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
          e.preventDefault();
          goToSlide(currentSlideIdx - 1);
        } else if (e.key === "s" || e.key === "S") {
          e.preventDefault();
          document.getElementById("slide-notes-btn").click();
        }
      });
    })();
  </script>
</body>
</html>`;
}

const html = buildOfflineGuideHtml();
fs.writeFileSync(outPath, html, "utf8");
const sizeBytes = fs.statSync(outPath).size;
const sizeMb = (sizeBytes / (1024 * 1024)).toFixed(2);

if (sizeBytes > MAX_BUNDLE_BYTES) {
  console.error(
    `[build_guide_bundle] FAIL — ${outPath} is ${sizeMb} MB (exceeds 10.00 MB limit)`
  );
  process.exit(1);
}

console.log(
  `[build_guide_bundle] Wrote self-contained public/bylaw-one-guide.html (${sizeMb} MB <= 10.00 MB, reading + slide modes, 0 network requests).`
);
