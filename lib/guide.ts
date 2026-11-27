/**
 * Single-source guide loader and validator (`content/guide/*.md` and `content/guide/assets.json`).
 *
 * Feeds all three forms of the Bylaw One Guide:
 * 1. Reading mode at `/guide` (`app/guide/page.tsx`)
 * 2. Slide mode at `/guide/slides` (`app/guide/slides/page.tsx`)
 * 3. Self-contained single-file download at `/bylaw-one-guide.html` (`scripts/build_guide_bundle.mjs`)
 */

import {
  computeDatasetPilotMetrics,
  type DatasetPilotMetrics,
} from "@/lib/pilot-metrics";
import { getSiteConfig, type SiteConfig } from "@/lib/site-config";

export type GuideAudienceId =
  | "college"
  | "student"
  | "practitioner"
  | "developer"
  | "partner-funder";

export interface GuideAudienceEntryPoint {
  id: GuideAudienceId;
  label: string;
  roleTitle: string;
  summary: string;
  sectionIds: string[];
}

export interface GuideDiagramAsset {
  id: string;
  sectionId: string;
  title: string;
  caption: string;
  slideSummary: string;
  presenterNotes: string;
  mermaid: string;
  svgMarkup: string | null;
}

export interface GuideScreenshotAsset {
  id: string;
  sectionId: string;
  title: string;
  caption: string;
  slideSummary: string;
  presenterNotes: string;
  route: string;
  selector?: string;
  desktopSrc: string;
  mobileSrc: string;
}

export interface GuideSection {
  id: string;
  fileName: string;
  number: string;
  title: string;
  kicker: string;
  audiences: GuideAudienceId[];
  diagramIds: string[];
  screenshotIds: string[];
  slideSummary: string;
  slideSummaryWordCount: number;
  presenterNotes: string;
  readingMarkdown: string;
  diagrams: GuideDiagramAsset[];
  screenshots: GuideScreenshotAsset[];
  firstSlideIndex: number;
}

export interface GuideSlideItem {
  slideIndex: number;
  slideId: string;
  sectionId: string;
  sectionNumber: string;
  sectionTitle: string;
  kicker: string;
  kind: "section" | "diagram" | "screenshot";
  heading: string;
  summaryText: string;
  presenterNotes: string;
  diagram?: GuideDiagramAsset;
  screenshot?: GuideScreenshotAsset;
}

export interface LoadedGuideBundle {
  metrics: DatasetPilotMetrics;
  siteConfig: SiteConfig;
  generatedDate: string;
  placeholders: Record<string, string>;
  audiences: GuideAudienceEntryPoint[];
  sections: GuideSection[];
  diagrams: GuideDiagramAsset[];
  screenshots: GuideScreenshotAsset[];
  slides: GuideSlideItem[];
}

export const MAX_SLIDE_SUMMARY_WORDS = 40;

export function countWords(text: string): number {
  const cleaned = text
    .replace(/`[^`]*`/g, (m) => m.slice(1, -1))
    .replace(/[—–]|(?:\s-\s)/g, " ")
    .replace(/[*_~>#]/g, " ")
    .trim();
  if (!cleaned) return 0;
  return cleaned.split(/\s+/).filter(Boolean).length;
}

export function buildGuidePlaceholders(
  m: DatasetPilotMetrics,
  siteCfg: SiteConfig
): Record<string, string> {
  return {
    city: m.cityLabel,
    region: m.regionLabel,
    state: m.stateLabel,
    partial_zone_area: m.partialZoneAreaLabel,
    documents_in_force: String(m.inForceDocumentsCount),
    registered_sources: String(m.totalRegisterDocumentsCount),
    issuing_bodies: String(m.issuingBodiesCount),
    provisions: m.provisionsCount.toLocaleString("en-IN"),
    rules_as_data: String(m.activeParametersCount),
    total_parameters: String(m.totalParametersCount),
    corporations: String(m.corporationsCount),
    wards: String(m.wardsCount),
    active_zones: m.activeZonesCount.toLocaleString("en-IN"),
    processed_sheets: m.processedSheetsLabel,
    processed_sheets_count: String(m.processedSheetsCount),
    map_coverage_pct: `${m.mapCoveragePct}%`,
    road_median_offset_m: `${m.roadMedianOffsetM} m`,
    road_p90_offset_m: `${m.roadP90OffsetM} m`,
    verified_by_people: String(m.humanVerifiedCount),
    machine_checked: m.machineCheckedCount.toLocaleString("en-IN"),
    checks_per_build: String(m.checksPerBuildCount),
    current_as_of: m.currentAsOfDate,
    release_version: m.releaseVersion,
    dataset_id: m.datasetId,
    contact_email: siteCfg.contactEmail,
    organisation_name: siteCfg.organisationName,
    github_repo_url: siteCfg.githubRepoUrl,
    site_url: siteCfg.siteUrl,
  };
}

export function interpolateGuidePlaceholders(
  rawText: string,
  placeholders: Readonly<Record<string, string>>,
  sourceContext: string
): string {
  const replaced = rawText.replace(/\{\{([a-z0-9_]+)\}\}/gi, (_full, key) => {
    const k = String(key).toLowerCase();
    if (!(k in placeholders)) {
      throw new Error(
        `Unknown guide placeholder '{{${key}}}' in ${sourceContext}`
      );
    }
    return placeholders[k];
  });

  const leftoverMatch = /\{\{[^}]*\}\}/.exec(replaced);
  if (leftoverMatch) {
    throw new Error(
      `Unreplaced guide placeholder '${leftoverMatch[0]}' in ${sourceContext}`
    );
  }
  return replaced;
}

function parseBracketList(rawVal: string | undefined): string[] {
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

export function parseGuideSectionMarkdown(
  rawMarkdown: string,
  fileName: string,
  placeholders: Readonly<Record<string, string>>
): Omit<
  GuideSection,
  "diagrams" | "screenshots" | "firstSlideIndex"
> {
  const fmMatch = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/.exec(
    rawMarkdown.trim()
  );
  if (!fmMatch) {
    throw new Error(`Missing frontmatter in content/guide/${fileName}`);
  }
  const fmLines = fmMatch[1].split(/\r?\n/);
  const fm: Record<string, string> = {};
  for (const line of fmLines) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const k = line.slice(0, idx).trim();
    const v = line
      .slice(idx + 1)
      .trim()
      .replace(/^["']|["']$/g, "");
    fm[k] = v;
  }

  const body = fmMatch[2];
  const slideMatch =
    /## Slide summary\s+([\s\S]*?)(?=\r?\n## Presenter notes\b)/.exec(body);
  const notesMatch =
    /## Presenter notes\s+([\s\S]*?)(?=\r?\n## Reading version\b)/.exec(body);
  const readingMatch = /## Reading version\s+([\s\S]*)$/.exec(body);

  if (!slideMatch || !notesMatch || !readingMatch) {
    throw new Error(
      `content/guide/${fileName} must contain '## Slide summary', '## Presenter notes', and '## Reading version' headings.`
    );
  }

  const id = fm.id || fileName.replace(/\.md$/, "");
  const number = fm.number || "00";
  const title = interpolateGuidePlaceholders(
    fm.title || id,
    placeholders,
    `${fileName}:title`
  );
  const kicker = interpolateGuidePlaceholders(
    fm.kicker || `Section ${number}`,
    placeholders,
    `${fileName}:kicker`
  );
  const audiences = parseBracketList(fm.audiences) as GuideAudienceId[];
  const diagramIds = parseBracketList(fm.diagrams);
  const screenshotIds = parseBracketList(fm.screenshots);

  const slideSummary = interpolateGuidePlaceholders(
    slideMatch[1].trim(),
    placeholders,
    `${fileName}:slideSummary`
  );
  const slideSummaryWordCount = countWords(slideSummary);
  if (slideSummaryWordCount > MAX_SLIDE_SUMMARY_WORDS) {
    throw new Error(
      `Slide summary in content/guide/${fileName} has ${slideSummaryWordCount} words (max ${MAX_SLIDE_SUMMARY_WORDS} allowed).`
    );
  }

  const presenterNotes = interpolateGuidePlaceholders(
    notesMatch[1].trim(),
    placeholders,
    `${fileName}:presenterNotes`
  );
  const readingMarkdown = interpolateGuidePlaceholders(
    readingMatch[1].trim(),
    placeholders,
    `${fileName}:readingVersion`
  );

  return {
    id,
    fileName,
    number,
    title,
    kicker,
    audiences,
    diagramIds,
    screenshotIds,
    slideSummary,
    slideSummaryWordCount,
    presenterNotes,
    readingMarkdown,
  };
}

interface RawAssetsManifest {
  audiences: GuideAudienceEntryPoint[];
  diagrams: Array<Omit<GuideDiagramAsset, "svgMarkup">>;
  screenshots: GuideScreenshotAsset[];
}

export async function loadGuideBundle(): Promise<LoadedGuideBundle> {
  const [metrics, siteConfig] = await Promise.all([
    computeDatasetPilotMetrics(),
    Promise.resolve(getSiteConfig()),
  ]);
  const placeholders = buildGuidePlaceholders(metrics, siteConfig);

  const fs = process.getBuiltinModule("fs") as typeof import("fs");
  const path = process.getBuiltinModule("path") as typeof import("path");
  const guideDir = path.join(process.cwd(), "content", "guide");
  const diagramsPublicDir = path.join(
    process.cwd(),
    "public",
    "guide",
    "diagrams"
  );

  const rawAssetsJson = JSON.parse(
    fs.readFileSync(path.join(guideDir, "assets.json"), "utf8")
  ) as RawAssetsManifest;

  const diagrams: GuideDiagramAsset[] = rawAssetsJson.diagrams.map((d) => {
    const svgPath = path.join(diagramsPublicDir, `${d.id}.svg`);
    const svgMarkup = fs.existsSync(svgPath)
      ? fs.readFileSync(svgPath, "utf8")
      : null;
    const slideSummary = interpolateGuidePlaceholders(
      d.slideSummary,
      placeholders,
      `assets.json:diagram:${d.id}:slideSummary`
    );
    const words = countWords(slideSummary);
    if (words > MAX_SLIDE_SUMMARY_WORDS) {
      throw new Error(
        `Diagram '${d.id}' slideSummary has ${words} words (max ${MAX_SLIDE_SUMMARY_WORDS}).`
      );
    }
    return {
      id: d.id,
      sectionId: d.sectionId,
      title: interpolateGuidePlaceholders(
        d.title,
        placeholders,
        `assets.json:diagram:${d.id}:title`
      ),
      caption: interpolateGuidePlaceholders(
        d.caption,
        placeholders,
        `assets.json:diagram:${d.id}:caption`
      ),
      slideSummary,
      presenterNotes: interpolateGuidePlaceholders(
        d.presenterNotes,
        placeholders,
        `assets.json:diagram:${d.id}:presenterNotes`
      ),
      mermaid: interpolateGuidePlaceholders(
        d.mermaid,
        placeholders,
        `assets.json:diagram:${d.id}:mermaid`
      ),
      svgMarkup,
    };
  });

  const screenshots: GuideScreenshotAsset[] = rawAssetsJson.screenshots.map(
    (s) => {
      const slideSummary = interpolateGuidePlaceholders(
        s.slideSummary,
        placeholders,
        `assets.json:screenshot:${s.id}:slideSummary`
      );
      const words = countWords(slideSummary);
      if (words > MAX_SLIDE_SUMMARY_WORDS) {
        throw new Error(
          `Screenshot '${s.id}' slideSummary has ${words} words (max ${MAX_SLIDE_SUMMARY_WORDS}).`
        );
      }
      return {
        ...s,
        title: interpolateGuidePlaceholders(
          s.title,
          placeholders,
          `assets.json:screenshot:${s.id}:title`
        ),
        caption: interpolateGuidePlaceholders(
          s.caption,
          placeholders,
          `assets.json:screenshot:${s.id}:caption`
        ),
        slideSummary,
        presenterNotes: interpolateGuidePlaceholders(
          s.presenterNotes,
          placeholders,
          `assets.json:screenshot:${s.id}:presenterNotes`
        ),
      };
    }
  );

  const diagramById = new Map(diagrams.map((d) => [d.id, d]));
  const screenshotById = new Map(screenshots.map((s) => [s.id, s]));

  const mdFiles = fs
    .readdirSync(guideDir)
    .filter((f) => /^\d{2}-.*\.md$/.test(f))
    .sort();

  const parsedSections = mdFiles.map((fileName) => {
    const rawMd = fs.readFileSync(path.join(guideDir, fileName), "utf8");
    return parseGuideSectionMarkdown(rawMd, fileName, placeholders);
  });

  const slides: GuideSlideItem[] = [];
  const sections: GuideSection[] = [];

  for (const sec of parsedSections) {
    const secDiagrams = sec.diagramIds
      .map((id) => diagramById.get(id))
      .filter((d): d is GuideDiagramAsset => Boolean(d));
    const secScreenshots = sec.screenshotIds
      .map((id) => screenshotById.get(id))
      .filter((s): s is GuideScreenshotAsset => Boolean(s));

    const firstSlideIndex = slides.length;
    slides.push({
      slideIndex: firstSlideIndex,
      slideId: `slide-${sec.id}`,
      sectionId: sec.id,
      sectionNumber: sec.number,
      sectionTitle: sec.title,
      kicker: sec.kicker,
      kind: "section",
      heading: sec.title,
      summaryText: sec.slideSummary,
      presenterNotes: sec.presenterNotes,
    });

    for (const diag of secDiagrams) {
      slides.push({
        slideIndex: slides.length,
        slideId: `slide-diagram-${diag.id}`,
        sectionId: sec.id,
        sectionNumber: sec.number,
        sectionTitle: sec.title,
        kicker: `${sec.kicker} · Diagram`,
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
        sectionId: sec.id,
        sectionNumber: sec.number,
        sectionTitle: sec.title,
        kicker: `${sec.kicker} · Live View`,
        kind: "screenshot",
        heading: shot.title,
        summaryText: shot.slideSummary,
        presenterNotes: shot.presenterNotes,
        screenshot: shot,
      });
    }

    sections.push({
      ...sec,
      diagrams: secDiagrams,
      screenshots: secScreenshots,
      firstSlideIndex,
    });
  }

  return {
    metrics,
    siteConfig,
    generatedDate: "27 November 2026",
    placeholders,
    audiences: rawAssetsJson.audiences,
    sections,
    diagrams,
    screenshots,
    slides,
  };
}
