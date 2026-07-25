"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bookmark, Scale, Trash2 } from "lucide-react";
import { useSaved } from "@/lib/use-collection";
import { getOpportunityBySlug } from "@/lib/matching";
import { OpportunityCard } from "@/components/ui/opportunity-card";
import { EmptyState } from "@/components/ui/empty-state";

export default function SavedPage() {
  const { items, clear, count } = useSaved();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const opps = items.map((slug) => getOpportunityBySlug(slug)).filter(Boolean);
  const compareHref = `/marketplace/compare?ids=${items.slice(0, 3).join(",")}`;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="kicker text-[0.7rem] text-brand-700">Investor workspace</p>
          <h1 className="mt-1.5 font-display text-2xl font-bold text-navy-700">Saved &amp; watchlist</h1>
          <p className="mt-1 text-sm text-ink/65">
            {mounted ? `${count} saved ${count === 1 ? "opportunity" : "opportunities"}` : "Your saved opportunities"}
          </p>
        </div>
        {mounted && count > 0 && (
          <div className="flex items-center gap-2">
            {count >= 2 && (
              <Link href={compareHref} className="inline-flex items-center gap-2 rounded-full bg-navy-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-navy-800">
                <Scale className="h-4 w-4" /> Compare {count > 3 ? "top 3" : count}
              </Link>
            )}
            <button onClick={clear} className="inline-flex items-center gap-2 rounded-full border border-ink/12 px-4 py-2.5 text-sm font-medium text-ink/60 hover:border-brand-300 hover:text-brand-600">
              <Trash2 className="h-4 w-4" /> Clear all
            </button>
          </div>
        )}
      </div>

      {!mounted ? (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton h-80 rounded-2xl" />
          ))}
        </div>
      ) : count === 0 ? (
        <EmptyState
          icon={Bookmark}
          title="Nothing saved yet"
          description="Tap the bookmark on any opportunity to add it to your watchlist and compare deals side by side."
          action={{ label: "Browse the marketplace", href: "/marketplace" }}
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {opps.map((o) => (
            <OpportunityCard key={o!.name} o={o!} />
          ))}
        </div>
      )}
    </div>
  );
}
