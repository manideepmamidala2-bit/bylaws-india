/**
 * Centralized site configuration reader (`bylaws.toml` `[contact]` and `[organisation]`).
 *
 * Ensures `contact.email` and `organisation.name` come from a single source
 * (`bylaws.toml`) and remain owner-configurable placeholders until launch.
 */

export interface SiteConfig {
  contactEmail: string;
  organisationName: string;
  githubRepoUrl: string;
  siteUrl: string;
}

const DEFAULT_SITE_CONFIG: SiteConfig = {
  contactEmail: "contact@example.org",
  organisationName: "[Owner's Organisation]",
  githubRepoUrl: "https://github.com/manideepmamidala2-bit/bylaws-india",
  siteUrl: "https://bylaws-india.vercel.app",
};

let cachedSiteConfig: SiteConfig | null = null;

function parseTomlSectionValue(
  tomlText: string,
  sectionName: string,
  keyName: string
): string | null {
  const sectionRegex = new RegExp(
    `\\[${sectionName}\\]([\\s\\S]*?)(?:\\n\\[|$)`
  );
  const sectionMatch = sectionRegex.exec(tomlText);
  if (!sectionMatch) return null;
  const body = sectionMatch[1];
  const keyRegex = new RegExp(
    `^\\s*${keyName}\\s*=\\s*"([^"]*)"`,
    "m"
  );
  const keyMatch = keyRegex.exec(body);
  return keyMatch ? keyMatch[1].trim() : null;
}

export function getSiteConfig(): SiteConfig {
  if (cachedSiteConfig) {
    return cachedSiteConfig;
  }

  if (
    typeof process !== "undefined" &&
    typeof process.getBuiltinModule === "function"
  ) {
    try {
      const fs = process.getBuiltinModule("fs") as typeof import("fs");
      const path = process.getBuiltinModule("path") as typeof import("path");
      const tomlPath = path.join(process.cwd(), "bylaws.toml");
      if (fs.existsSync(tomlPath)) {
        const raw = fs.readFileSync(tomlPath, "utf8");
        const email =
          parseTomlSectionValue(raw, "contact", "email") ||
          DEFAULT_SITE_CONFIG.contactEmail;
        const orgName =
          parseTomlSectionValue(raw, "organisation", "name") ||
          DEFAULT_SITE_CONFIG.organisationName;
        const repoUrl =
          parseTomlSectionValue(raw, "organisation", "github_repo") ||
          DEFAULT_SITE_CONFIG.githubRepoUrl;
        const siteUrl =
          parseTomlSectionValue(raw, "organisation", "site_url") ||
          DEFAULT_SITE_CONFIG.siteUrl;
        cachedSiteConfig = {
          contactEmail: email,
          organisationName: orgName,
          githubRepoUrl: repoUrl,
          siteUrl,
        };
        return cachedSiteConfig;
      }
    } catch {
      // Fall through to defaults in browser/client environments
    }
  }

  return DEFAULT_SITE_CONFIG;
}

export interface ReportProblemParams {
  pagePath: string;
  ruleSummary?: string;
  officialPageUrl?: string;
}

export function buildReportProblemIssueUrl(
  params: ReportProblemParams
): string {
  const cfg = getSiteConfig();
  const fullSiteUrl = params.pagePath.startsWith("http")
    ? params.pagePath
    : `${cfg.siteUrl.replace(/\/+$/, "")}/${params.pagePath.replace(/^\/+/, "")}`;
  const query = new URLSearchParams();
  query.set("template", "report-problem-with-a-rule.yml");
  if (params.ruleSummary) {
    query.set("title", `[Rule problem]: ${params.ruleSummary.slice(0, 80)}`);
  }
  query.set("site_link", fullSiteUrl);
  if (params.officialPageUrl) {
    query.set("official_page", params.officialPageUrl);
  }
  return `${cfg.githubRepoUrl.replace(/\/+$/, "")}/issues/new?${query.toString()}`;
}

export function buildSuggestSourceIssueUrl(): string {
  const cfg = getSiteConfig();
  return `${cfg.githubRepoUrl.replace(/\/+$/, "")}/issues/new?template=suggest-a-source.yml`;
}

export function buildJoinPilotIssueUrl(): string {
  const cfg = getSiteConfig();
  return `${cfg.githubRepoUrl.replace(/\/+$/, "")}/issues/new?template=join-the-pilot.yml`;
}
