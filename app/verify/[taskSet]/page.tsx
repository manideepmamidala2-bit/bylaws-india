import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  fetchManifest,
  getPrimaryPublicJurisdiction,
  readPublishedJson,
} from "@/lib/data";
import { TopNav } from "@/components/TopNav";
import {
  VerifyTaskSetClient,
  type VerificationTaskSetPayload,
} from "@/components/VerifyTaskSetClient";

interface VerifyTaskSetPageProps {
  params: Promise<{ taskSet: string }>;
}

export const dynamicParams = false;

export async function generateStaticParams() {
  if (
    typeof process !== "undefined" &&
    typeof process.getBuiltinModule === "function"
  ) {
    try {
      const fs = process.getBuiltinModule("fs") as typeof import("fs");
      const path = process.getBuiltinModule("path") as typeof import("path");
      const tasksDir = path.join(process.cwd(), "public", "data", "tasks");
      if (fs.existsSync(tasksDir)) {
        const files = fs
          .readdirSync(tasksDir)
          .filter((f) => f.endsWith(".json"))
          .sort();
        if (files.length > 0) {
          return files.map((f) => ({ taskSet: f.replace(/\.json$/, "") }));
        }
      }
    } catch {
      // Fallback below
    }
  }
  return [];
}

export default async function VerifyTaskSetPage({
  params,
}: VerifyTaskSetPageProps) {
  const { taskSet } = await params;
  const [manifest, taskSetPayload] = await Promise.all([
    fetchManifest(),
    readPublishedJson<VerificationTaskSetPayload>(
      `/data/tasks/${taskSet}.json`
    ).catch(() => null),
  ]);

  if (!taskSetPayload) {
    notFound();
  }

  const primary = getPrimaryPublicJurisdiction(manifest);

  return (
    <div className="min-h-screen bg-[#f5f3ed] text-[#080909]">
      <TopNav
        jurisdictionId={taskSetPayload.jurisdiction || primary?.id}
        jurisdictionName={taskSetPayload.jurisdiction_name || primary?.name}
        active="about"
      />

      <main
        data-dataset-id={manifest.dataset_id ?? ""}
        className="mx-auto max-w-5xl space-y-8 px-5 py-10"
      >
        <header className="border-b border-[#c8ccc0] pb-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Link
              href="/checks"
              className="inline-flex min-h-[44px] items-center font-mono text-xs uppercase tracking-[0.12em] text-[#5b5e56] no-underline hover:text-[#080909]"
            >
              ← How we check
            </Link>
            <Link
              href="/join"
              className="inline-flex min-h-[44px] items-center font-mono text-xs uppercase tracking-[0.12em] text-[#080909] underline"
            >
              Join a verification workshop →
            </Link>
          </div>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#080909] md:text-4xl">
            Verify rules against official pages
          </h1>
          <p className="dg-serif mt-2 max-w-3xl text-base leading-relaxed text-[#171917]">
            Task set: <strong>{taskSetPayload.task_set_id}</strong> ·{" "}
            {taskSetPayload.jurisdiction_name} · Subject:{" "}
            <strong>{taskSetPayload.subject}</strong> ({taskSetPayload.count}{" "}
            tasks). Open each official PDF page, check whether the text or value
            on Bylaw One matches the government publication, and export your CSV
            when done.
          </p>
        </header>

        <VerifyTaskSetClient taskSet={taskSetPayload} />
      </main>
    </div>
  );
}
