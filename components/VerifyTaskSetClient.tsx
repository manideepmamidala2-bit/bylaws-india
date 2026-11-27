"use client";

import React, { useEffect, useMemo, useState } from "react";

export type VerificationVerdict = "match" | "mismatch" | "cant_tell";

export interface VerificationTaskItem {
  task_id: string;
  record_id: string;
  record_kind: "provision" | "parameter" | "zone";
  subject: string;
  document_id: string;
  document_title: string;
  number_or_label: string;
  text_or_value: string;
  page: number;
  official_page_url: string;
  archive_page_url?: string | null;
}

export interface VerificationTaskSetPayload {
  task_set_id: string;
  jurisdiction: string;
  jurisdiction_name: string;
  subject: string;
  seed: number;
  count: number;
  created_at: string;
  tasks: VerificationTaskItem[];
}

export interface TaskResponseEntry {
  verdict: VerificationVerdict | "";
  note: string;
  verifiedAt: string;
}

export interface StoredVerificationSession {
  verifierName: string;
  institution: string;
  responses: Record<string, TaskResponseEntry>;
}

function escapeCsvCell(val: string | number | null | undefined): string {
  const s = String(val ?? "");
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function serializeVerificationsToCsv(
  taskSet: VerificationTaskSetPayload,
  verifierName: string,
  institution: string,
  responses: Record<string, TaskResponseEntry>,
  fallbackDate = "2026-11-26"
): string {
  const headers = [
    "task_id",
    "record_id",
    "record_kind",
    "verdict",
    "note",
    "verifier_name",
    "institution",
    "verified_at",
  ];
  const lines = [headers.join(",")];
  for (const t of taskSet.tasks) {
    const resp = responses[t.task_id];
    const verdict = resp?.verdict || "";
    const note = resp?.note || "";
    const vDate = resp?.verifiedAt || fallbackDate;
    lines.push(
      [
        escapeCsvCell(t.task_id),
        escapeCsvCell(t.record_id),
        escapeCsvCell(t.record_kind),
        escapeCsvCell(verdict),
        escapeCsvCell(note),
        escapeCsvCell(verifierName.trim()),
        escapeCsvCell(institution.trim()),
        escapeCsvCell(vDate),
      ].join(",")
    );
  }
  return lines.join("\n") + "\n";
}

export interface VerifyTaskSetClientProps {
  taskSet: VerificationTaskSetPayload;
}

export function VerifyTaskSetClient({ taskSet }: VerifyTaskSetClientProps) {
  const storageKey = `bylaw_one_verify_${taskSet.task_set_id}`;
  const [verifierName, setVerifierName] = useState("");
  const [institution, setInstitution] = useState("");
  const [responses, setResponses] = useState<Record<string, TaskResponseEntry>>(
    {}
  );
  const [exportedCsvPreview, setExportedCsvPreview] = useState<string | null>(
    null
  );

  // Load saved answers from browser localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<StoredVerificationSession>;
      if (typeof parsed.verifierName === "string") {
        setVerifierName(parsed.verifierName);
      }
      if (typeof parsed.institution === "string") {
        setInstitution(parsed.institution);
      }
      if (parsed.responses && typeof parsed.responses === "object") {
        setResponses(parsed.responses);
      }
    } catch {
      // Ignore corrupt localStorage entries
    }
  }, [storageKey]);

  const persistSession = (
    nextName: string,
    nextInst: string,
    nextResponses: Record<string, TaskResponseEntry>
  ) => {
    if (typeof window === "undefined") return;
    try {
      const payload: StoredVerificationSession = {
        verifierName: nextName,
        institution: nextInst,
        responses: nextResponses,
      };
      window.localStorage.setItem(storageKey, JSON.stringify(payload));
    } catch {
      // Ignore storage quota errors
    }
  };

  const handleSetVerdict = (taskId: string, verdict: VerificationVerdict) => {
    const todayIso = new Date().toISOString().slice(0, 10);
    setResponses((prev) => {
      const existing = prev[taskId] ?? {
        verdict: "",
        note: "",
        verifiedAt: todayIso,
      };
      const next = {
        ...prev,
        [taskId]: {
          ...existing,
          verdict,
          verifiedAt: todayIso,
        },
      };
      persistSession(verifierName, institution, next);
      return next;
    });
  };

  const handleSetNote = (taskId: string, note: string) => {
    const todayIso = new Date().toISOString().slice(0, 10);
    setResponses((prev) => {
      const existing = prev[taskId] ?? {
        verdict: "",
        note: "",
        verifiedAt: todayIso,
      };
      const next = {
        ...prev,
        [taskId]: {
          ...existing,
          note,
          verifiedAt: existing.verifiedAt || todayIso,
        },
      };
      persistSession(verifierName, institution, next);
      return next;
    });
  };

  const completedCount = useMemo(
    () =>
      taskSet.tasks.filter((t) => Boolean(responses[t.task_id]?.verdict))
        .length,
    [responses, taskSet.tasks]
  );

  const handleExportCsv = () => {
    const csvContent = serializeVerificationsToCsv(
      taskSet,
      verifierName,
      institution,
      responses
    );
    setExportedCsvPreview(csvContent);
    if (
      typeof window !== "undefined" &&
      typeof URL !== "undefined" &&
      typeof URL.createObjectURL === "function"
    ) {
      try {
        const blob = new Blob([csvContent], {
          type: "text/csv;charset=utf-8;",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${taskSet.task_set_id}-verifications.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } catch {
        // Fallback preview already set in state
      }
    }
  };

  return (
    <div className="space-y-8">
      {/* Verifier details & local-only notice */}
      <section
        aria-label="Verifier details and export"
        data-testid="verify-verifier-form"
        className="border border-[#080909] bg-[#efeee8] p-5"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[#c8ccc0] pb-3">
          <div>
            <div className="dg-mono text-[#5b5e56]">
              Workshop verification · Saved in your browser only
            </div>
            <h2 className="mt-0.5 text-lg font-semibold text-[#080909]">
              Your name and institution (for release credit)
            </h2>
          </div>
          <span
            data-testid="verify-progress-counter"
            className="border border-[#080909] bg-[#f5f3ed] px-3 py-1 font-mono text-xs font-semibold text-[#080909]"
          >
            {completedCount} of {taskSet.tasks.length} tasks marked
          </span>
        </div>

        <p className="dg-serif mt-2 text-sm text-[#171917]">
          Your answers are saved automatically in this browser and exported as a
          CSV file when you are done. Nothing is sent to any server. A record
          becomes &ldquo;Verified by a person&rdquo; after two independent{" "}
          <strong>Match</strong> verdicts.
        </p>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="verifier-name-input"
              className="dg-mono block text-[10.5px] text-[#080909]"
            >
              Your name
            </label>
            <input
              id="verifier-name-input"
              data-testid="verifier-name-input"
              type="text"
              value={verifierName}
              onChange={(e) => {
                setVerifierName(e.target.value);
                persistSession(e.target.value, institution, responses);
              }}
              placeholder="Full name (for release credit)"
              className="mt-1 min-h-[44px] w-full border border-[#080909] bg-[#f5f3ed] px-3 py-2 font-mono text-xs text-[#080909]"
            />
          </div>

          <div>
            <label
              htmlFor="verifier-institution-input"
              className="dg-mono block text-[10.5px] text-[#080909]"
            >
              Institution / College / Practice
            </label>
            <input
              id="verifier-institution-input"
              data-testid="verifier-institution-input"
              type="text"
              value={institution}
              onChange={(e) => {
                setInstitution(e.target.value);
                persistSession(verifierName, e.target.value, responses);
              }}
              placeholder="College, university, or practice name"
              className="mt-1 min-h-[44px] w-full border border-[#080909] bg-[#f5f3ed] px-3 py-2 font-mono text-xs text-[#080909]"
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#c8ccc0] pt-4">
          <details className="font-mono text-xs text-[#5b5e56]">
            <summary className="cursor-pointer uppercase tracking-[0.1em] underline">
              Details · Maintainer import command
            </summary>
            <div className="mt-1">
              <code className="text-[#080909]">
                bylaws verify import {taskSet.task_set_id}-verifications.csv
                --jurisdiction {taskSet.jurisdiction}
              </code>
            </div>
          </details>
          <button
            type="button"
            data-testid="export-verifications-csv-btn"
            onClick={handleExportCsv}
            className="min-h-[44px] border border-[#080909] bg-[#080909] px-5 py-2 font-mono text-xs uppercase tracking-[0.12em] text-[#f5f3ed] hover:bg-[#171917]"
          >
            Export completed CSV ({completedCount}/{taskSet.tasks.length})
          </button>
        </div>

        {exportedCsvPreview && (
          <details open className="mt-4 border-t border-[#c8ccc0] pt-3">
            <summary className="cursor-pointer font-mono text-xs uppercase tracking-[0.1em] text-[#080909]">
              Exported CSV preview ({taskSet.task_set_id}-verifications.csv)
            </summary>
            <pre
              data-testid="exported-csv-preview"
              className="mt-2 overflow-x-auto border border-[#c8ccc0] bg-[#f5f3ed] p-3 font-mono text-[11px] text-[#080909]"
            >
              {exportedCsvPreview}
            </pre>
          </details>
        )}
      </section>

      {/* Task cards */}
      <ol
        aria-label="Verification tasks list"
        data-testid="verify-tasks-list"
        className="space-y-4"
      >
        {taskSet.tasks.map((task, idx) => {
          const currentResp = responses[task.task_id];
          const currentVerdict = currentResp?.verdict ?? "";
          const currentNote = currentResp?.note ?? "";

          return (
            <li
              key={task.task_id}
              data-testid={`verify-task-card-${task.task_id}`}
              className="border border-[#080909] bg-[#f5f3ed] p-5"
            >
              <div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_320px]">
                {/* Left: Record text or value */}
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2 font-mono text-xs text-[#5b5e56]">
                    <span className="font-semibold text-[#080909]">
                      Task {idx + 1} of {taskSet.tasks.length}
                    </span>
                    <span>·</span>
                    <span>
                      {task.record_kind === "parameter"
                        ? "Rule as data"
                        : "Provision"}
                    </span>
                    <span>·</span>
                    <span>{task.document_title}</span>
                  </div>

                  <h3 className="text-base font-semibold text-[#080909]">
                    {task.number_or_label}
                  </h3>

                  <div className="border-l-2 border-[#080909] bg-[#efeee8] p-3">
                    <div className="dg-mono text-[10px] text-[#5b5e56]">
                      Text or value shown on Bylaw One
                    </div>
                    <p className="dg-serif mt-1 text-sm leading-relaxed text-[#080909]">
                      {task.text_or_value}
                    </p>
                  </div>

                  <details className="text-xs">
                    <summary className="inline-flex min-h-[36px] cursor-pointer items-center font-mono text-[10.5px] uppercase tracking-[0.1em] text-[#5b5e56] underline">
                      Details · Record ID
                    </summary>
                    <div className="mt-1 font-mono text-[11px] text-[#5b5e56]">
                      Record ID: <code className="text-[#080909]">{task.record_id}</code>
                    </div>
                  </details>
                </div>

                {/* Right: Open official page + Match / Mismatch / Can't tell + note */}
                <div className="flex flex-col justify-between gap-4 border-t border-[#c8ccc0] pt-4 md:border-t-0 md:border-l md:pl-5 md:pt-0">
                  <div className="space-y-2">
                    <div className="dg-mono text-[10.5px] text-[#5b5e56]">
                      Step 1 · Check the official publication
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <a
                        href={task.official_page_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        data-testid={`open-official-page-${task.task_id}`}
                        className="inline-flex min-h-[44px] items-center border border-[#080909] bg-[#080909] px-3.5 py-2 font-mono text-xs uppercase tracking-[0.1em] text-[#f5f3ed] no-underline hover:bg-[#171917]"
                      >
                        Open official page (p. {task.page}) ↗
                      </a>
                      {task.archive_page_url && (
                        <a
                          href={task.archive_page_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex min-h-[44px] items-center border border-[#080909] bg-[#f5f3ed] px-3 py-2 font-mono text-xs uppercase tracking-[0.1em] text-[#080909] no-underline hover:bg-[#efeee8]"
                        >
                          Archive p. {task.page} ↗
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="dg-mono text-[10.5px] text-[#5b5e56]">
                      Step 2 · Record your verdict
                    </div>
                    <div
                      role="group"
                      aria-label={`Verdict for ${task.task_id}`}
                      className="grid grid-cols-3 gap-2"
                    >
                      {(
                        [
                          { key: "match", label: "Match" },
                          { key: "mismatch", label: "Mismatch" },
                          { key: "cant_tell", label: "Can't tell" },
                        ] as const
                      ).map((opt) => {
                        const active = currentVerdict === opt.key;
                        return (
                          <button
                            key={opt.key}
                            type="button"
                            data-testid={`verdict-${opt.key}-${task.task_id}`}
                            aria-pressed={active}
                            onClick={() =>
                              handleSetVerdict(task.task_id, opt.key)
                            }
                            className={`min-h-[44px] border px-2 py-1.5 font-mono text-xs uppercase tracking-[0.08em] ${
                              active
                                ? "border-[#080909] bg-[#080909] font-semibold text-[#f5f3ed]"
                                : "border-[#080909] bg-[#f5f3ed] text-[#080909] hover:bg-[#efeee8]"
                            }`}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor={`note-${task.task_id}`}
                      className="dg-mono block text-[10px] text-[#5b5e56]"
                    >
                      Note (optional)
                    </label>
                    <input
                      id={`note-${task.task_id}`}
                      data-testid={`verify-note-${task.task_id}`}
                      type="text"
                      value={currentNote}
                      onChange={(e) =>
                        handleSetNote(task.task_id, e.target.value)
                      }
                      placeholder="What differed or needs attention..."
                      className="mt-1 min-h-[38px] w-full border border-[#c8ccc0] bg-[#f5f3ed] px-2.5 py-1 font-mono text-xs text-[#080909]"
                    />
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
