import React from "react";
import {
  buildReportProblemIssueUrl,
  getSiteConfig,
} from "@/lib/site-config";

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
  className = "",
}: ReportProblemLinkProps) {
  const siteCfg = getSiteConfig();
  const issueHref = buildReportProblemIssueUrl({
    pagePath,
    ruleSummary,
    officialPageUrl,
  });
  const mailtoSubject = encodeURIComponent(
    ruleSummary
      ? `Bylaw One problem report: ${ruleSummary.slice(0, 70)}`
      : "Bylaw One problem report"
  );
  const mailtoBody = encodeURIComponent(
    `Page: ${siteCfg.siteUrl.replace(/\/+$/, "")}/${pagePath.replace(/^\/+/, "")}\nOfficial page: ${officialPageUrl || "Not specified"}\n\nWhat is wrong:\n`
  );
  const mailtoHref = `mailto:${siteCfg.contactEmail}?subject=${mailtoSubject}&body=${mailtoBody}`;

  return (
    <span
      data-testid="report-problem-links"
      className={`inline-flex flex-wrap items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.1em] text-[#5b5e56] ${className}`}
    >
      <a
        href={issueHref}
        target="_blank"
        rel="noopener noreferrer"
        className="underline decoration-[#c8ccc0] underline-offset-4 hover:text-[#080909] hover:decoration-[#080909]"
      >
        Report a problem
      </a>
      <span aria-hidden="true">·</span>
      <a
        href={mailtoHref}
        className="underline decoration-[#c8ccc0] underline-offset-4 hover:text-[#080909] hover:decoration-[#080909]"
      >
        {siteCfg.contactEmail}
      </a>
    </span>
  );
}
