import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Bookmark, Scale } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { getSavedListings } from "@/lib/portal-queries";
import { getOpportunityBySlug } from "@/lib/matching";
import { OpportunityCard } from "@/components/ui/opportunity-card";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = { title: "Saved & watchlist" };

/**
 * Saved opportunities, from the account rather than the browser.
 *
 * This page read localStorage through `useSaved()`, so a shortlist built on a
 * laptop was invisible on a phone and one cleared cache erased it — while
 * `toggleSaved` had been writing every one of those slugs to SavedListing all
 * along with nothing reading them back.
 */
export default async function SavedPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/dashboard/saved");

  const saved = await getSavedListings(user);
  const opps = saved.map((s) => getOpportunityBySlug(s.slug)).filter((o) => o !== undefined);
  const compareHref = `/marketplace/compare?ids=${saved.slice(0, 3).map((s) => s.slug).join(",")}`;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="kicker text-[0.7rem] text-brand-700">Investor workspace</p>
          <h1 className="mt-1.5 font-display text-2xl font-bold text-navy-700">Saved &amp; watchlist</h1>
          <p className="mt-1 text-sm text-ink/65">
            {saved.length === 0
              ? "Nothing saved yet."
              : `${saved.length} ${saved.length === 1 ? "opportunity" : "opportunities"} on your list.`}
          </p>
        </div>
        {saved.length >= 2 && (
          <Link
            href={compareHref}
            className="inline-flex items-center gap-2 rounded-[var(--radius-button)] border border-ink/12 px-4 py-2.5 text-sm font-medium text-ink/70 transition-colors hover:border-ink/25"
          >
            <Scale className="h-4 w-4" /> Compare {Math.min(saved.length, 3)}
          </Link>
        )}
      </div>

      {opps.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          title="Nothing saved yet"
          description="Save an opportunity from the marketplace and it will appear here — on every device you sign in from."
          action={{ label: "Browse the marketplace", href: "/marketplace" }}
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {opps.map((o) => (
            <OpportunityCard key={o.name} o={o} />
          ))}
        </div>
      )}
    </div>
  );
}
