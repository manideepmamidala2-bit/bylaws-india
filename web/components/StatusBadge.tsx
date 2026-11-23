import React from "react";
import type { LegalStatus } from "@/lib/data";

interface StatusBadgeProps {
  status: LegalStatus;
}

const STATUS_LABELS: Record<LegalStatus, string> = {
  in_force: "In Force",
  draft: "Draft",
  superseded: "Superseded",
  withdrawn: "Withdrawn",
};

const STATUS_STYLES: Record<LegalStatus, string> = {
  in_force: "bg-emerald-100 text-emerald-900 border-emerald-300",
  draft: "bg-amber-100 text-amber-900 border-amber-400",
  superseded: "bg-slate-200 text-slate-800 border-slate-400",
  withdrawn: "bg-rose-100 text-rose-900 border-rose-300",
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      data-testid={`status-badge-${status}`}
      className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-semibold uppercase tracking-wide ${STATUS_STYLES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
