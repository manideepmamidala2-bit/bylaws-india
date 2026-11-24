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
  in_force: "border-[#080909] border-solid bg-[#f5f3ed] text-[#080909]",
  draft: "border-[#080909] border-dashed bg-[#efeee8] text-[#080909]",
  superseded:
    "border-[#5b5e56] border-solid bg-[#efeee8] text-[#5b5e56] line-through",
  withdrawn: "border-[#080909] border-double bg-[#efeee8] text-[#080909]",
  status_unknown: "border-[#5b5e56] border-dotted bg-[#efeee8] text-[#080909]",
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      data-testid={`status-badge-${status}`}
      title={
        status === "status_unknown"
          ? "Legal status is contested or was not recorded in the source dataset."
          : undefined
      }
      className={`inline-flex items-center border px-1.5 py-0.5 font-mono text-[9.5px] font-medium uppercase tracking-[0.14em] ${STATUS_STYLES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
