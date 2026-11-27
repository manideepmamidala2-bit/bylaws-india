import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  fetchJurisdictionDataset,
  fetchManifest,
  getVisibleJurisdictions,
} from "@/lib/data";
import { TopNav } from "@/components/TopNav";
import { CorporationSelector } from "@/components/CorporationSelector";
import { CODE_SUBJECTS } from "@/lib/plain-language";

interface TopicsPageProps {
  params: Promise<{ id: string }>;
}

export const dynamicParams = false;

export async function generateStaticParams() {
  const manifest = await fetchManifest();
  return manifest.jurisdictions.map((j) => ({ id: j.id }));
}

export default async function TopicsIndexPage({ params }: TopicsPageProps) {
  const { id } = await params;
  const [dataset, manifest] = await Promise.all([
    fetchJurisdictionDataset(id),
    fetchManifest(),
  ]);
  if (!dataset) {
    notFound();
  }

  const { jurisdiction, relations } = dataset;
  const allVisible = getVisibleJurisdictions(manifest);
  const rootParentId =
    jurisdiction.parent ??
    (allVisible.some((j) => j.parent === jurisdiction.id)
      ? jurisdiction.id
      : null);
  const gbaCorporations = rootParentId
    ? allVisible.filter(
        (j) => j.id === rootParentId || j.parent === rootParentId
      )
    : [];

  const succession = relations?.succession ?? [];

  return (
    <div className="bg-[#f5f3ed] text-[#080909]">
      <TopNav
        jurisdictionId={jurisdiction.id}
        jurisdictionName={jurisdiction.name}
        active="topics"
      />

      <main className="mx-auto max-w-5xl space-y-12 px-5 py-10">
        <header className="border-b border-[#c8ccc0] pb-6">
          <div className="dg-mono text-[#5b5e56]">The code</div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#080909] md:text-4xl">
            The code, by subject.
          </h1>
          <p className="dg-serif mt-3 text-base leading-relaxed text-[#171917]">
            Each subject brings together what applies today across the master
            plan zoning regulations, building bye-laws, and corporation
            amendments, with every figure traced to its official page.
          </p>

          <CorporationSelector
            currentId={jurisdiction.id}
            currentName={jurisdiction.name}
            pathSuffix="/topics"
            corporations={gbaCorporations}
          />
        </header>

        <section aria-label="Subjects of the building code">
          <ul
            data-testid="topics-subject-list"
            className="divide-y divide-[#c8ccc0] border-y border-[#c8ccc0]"
          >
            {CODE_SUBJECTS.map((subj, idx) => (
              <li
                key={subj.slug}
                className="flex flex-col justify-between gap-2 py-5 md:flex-row md:items-baseline md:gap-6"
              >
                <div className="space-y-1">
                  <div className="flex items-baseline gap-3">
                    <span className="dg-mono text-[#5b5e56]">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <Link
                      href={`/j/${jurisdiction.id}/topics/${subj.slug}`}
                      className="text-xl font-semibold text-[#080909] underline decoration-[#c8ccc0] underline-offset-4 hover:decoration-[#080909]"
                    >
                      {subj.title} →
                    </Link>
                  </div>
                  <p className="dg-serif text-sm leading-relaxed text-[#171917]">
                    {subj.summary}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {succession.length > 0 && (
          <section aria-label="Statutory authority succession">
            <details className="border-y border-[#c8ccc0] py-4">
              <summary className="flex min-h-[44px] cursor-pointer items-center justify-between font-mono text-xs uppercase tracking-[0.12em] text-[#5b5e56] hover:text-[#080909]">
                <span>
                  Details · Former and current statutory authorities (
                  {succession.length})
                </span>
              </summary>
              <div className="mt-4 overflow-x-auto">
                <table className="dg-table">
                  <thead>
                    <tr>
                      <th>Former body</th>
                      <th>Current body</th>
                      <th>Effective date</th>
                      <th>Quoted statutory authority</th>
                    </tr>
                  </thead>
                  <tbody>
                    {succession.map((s) => (
                      <tr key={s.id}>
                        <td className="font-mono text-xs">{s.old_body}</td>
                        <td className="font-mono text-xs font-medium">
                          {s.new_body}
                        </td>
                        <td className="font-mono text-xs">
                          {s.effective_date}
                        </td>
                        <td className="text-xs">
                          <div className="font-medium">{s.instrument_title}</div>
                          <div className="dg-serif mt-1 italic text-[#171917]">
                            &ldquo;{s.quoted_evidence}&rdquo;
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          </section>
        )}
      </main>
    </div>
  );
}
