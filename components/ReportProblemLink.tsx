import React from "react";
import { getSiteConfig } from "@/lib/site-config";

export interface ReportProblemLinkProps {
  pagePath: string;
  ruleSummary?: string;
  officialPageUrl?: string;
  className?: string;
}

export function ReportProblemLink({
  pagePath,
  ruleSummary,
  officialPageUrl,
}: ReportProblemLinkProps) {
  const siteCfg = getSiteConfig();
  const baseRepo = siteCfg.githubRepoUrl.replace(/\/+$/, "");
  const issueHref =
    ruleSummary || officialPageUrl
      ? `${baseRepo}/issues/new?template=report-problem-with-a-rule.yml&site_link=${encodeURIComponent(pagePath)}${
          officialPageUrl
            ? `&official_page=${encodeURIComponent(officialPageUrl)}`
            : ""
        }`
      : "/report-problem";

  return (
    <span className="dg-report-links">
      <a href={issueHref}>Report a problem</a>·
      <a href={`mailto:${siteCfg.contactEmail}`}>{siteCfg.contactEmail}</a>
    </span>
  );
}
