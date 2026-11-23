import React from "react";
import type { DisplayLegalStatus } from "@/lib/data";

interface StatusBadgeProps {
  status: DisplayLegalStatus;
}

const STATUS_LABELS: Record<DisplayLegalStatus, string> = {
  in_force: "IN FORCE",
  draft: "DRAFT",
  superseded: "SUPERSEDED",
  withdrawn: "WITHDRAWN",
  status_unknown: "STATUS UNKNOWN",
};

const STATUS_STYLES: Record<DisplayLegalStatus, string> = {
  in_force: "bg-emerald-100 text-emerald-900 border-emerald-300 border-solid",
  draft: "bg-amber-100 text-amber-900 border-amber-400 border-dashed",
  superseded: "bg-slate-200 text-slate-800 border-slate-400 line-through",
  withdrawn: "bg-rose-100 text-rose-900 border-rose-300",
  status_unknown: "bg-slate-100 text-slate-900 border-slate-500 border-dotted",
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      data-testid={`status-badge-${status}`}
      title={
        status === "status_unknown"
          ? "Legal status was not recorded in the source dataset."
          : undefined
      }
      className={`inline-flex items-center rounded border px-2 py-0.5 font-mono text-xs font-semibold uppercase tracking-wide ${STATUS_STYLES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
