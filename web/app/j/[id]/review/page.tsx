"use client";

import React, { use } from "react";
import Link from "next/link";
import { ReviewPanel } from "@/components/ReviewPanel";

interface ReviewPageProps {
  params: Promise<{ id: string }>;
}

export default function ReviewPage({ params }: ReviewPageProps) {
  const { id } = use(params);

  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <header className="mb-6 flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <Link
            href={`/j/${id}`}
            className="text-xs font-medium text-slate-500 underline"
          >
            ← Back to Map ({id})
          </Link>
          <h1 className="mt-1 text-xl font-bold text-slate-900">
            Zoning Map Review — <span className="font-mono">{id}</span>
          </h1>
        </div>
      </header>

      <ReviewPanel zones={[]} />
    </main>
  );
}
