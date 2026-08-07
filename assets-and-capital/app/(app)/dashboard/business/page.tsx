import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Eye, Users, Bookmark, FileSignature, ArrowRight, TrendingUp, Wallet, ShieldCheck } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { getBusinessHome, getPortalIdentity } from "@/lib/portal-queries";
import { getBusinessGallery } from "@/lib/business-listing";
import { getOpportunityBySlug } from "@/lib/matching";
import { listingImage } from "@/lib/imagery";
import { formatDate } from "@/lib/dates";
import { Badge } from "@/components/ui/badge";
import { StatCard, Panel, ProgressRing } from "@/components/dashboard/widgets";
import { GalleryCard } from "@/components/dashboard/gallery-card";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = { title: "Business Dashboard" };

/**
 * The business's own listing, and the real traffic against it.
 *
 * This page showed "Accra FinPay" to every business account, with 1,284
 * listing views, a 28-day area chart drawn from fourteen numbers in an array,
 * $9.6M soft-circled of a $15M raise, four named investors politely queued in
 * an interest table, three invoices and three messages. The only real thing on
 * it was the image gallery.
 *
 * Everything now comes from the account's own listing. Interest, saves, NDAs
 * and commitments are recorded against the marketplace slug, and reach this
 * listing through `Listing.title → slugify(title)` — the same bridge
 * lib/business-listing.ts uses.
 */
const usd = (n: number) => `$${n.toLocaleString("en-US")}`;

const TIER_VARIANT: Record<string, "gold" | "success" | "brand" | "neutral"> = {
  PLATINUM: "gold",
  GOLD: "gold",
  SILVER: "neutral",
  STANDARD: "neutral",
};

export default async function BusinessDashboard() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/dashboard/business");

  // The workspace follows the account, not the URL. An investor who lands here
  // gets their own dashboard rather than a business's numbers.
  if (user.role === "INVESTOR") redirect("/dashboard");

  const [me, home, gallery] = await Promise.all([
    getPortalIdentity(),
    getBusinessHome(user),
    getBusinessGallery(user),
  ]);

  const opp = home.slug ? getOpportunityBySlug(home.slug) : undefined;
  const raisePct =
    home.askUsd && home.askUsd > 0 ? Math.min(100, Math.round((home.committedUsd / home.askUsd) * 100)) : 0;

  if (!home.listingTitle) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <p className="text-sm text-ink/65">Business workspace</p>
          <h1 className="mt-1 font-display text-3xl font-semibold text-navy-700">
            {me?.orgName ?? me?.name ?? "Your business"}
          </h1>
        </div>
        <EmptyState
          icon={TrendingUp}
          title="No listing yet"
          description="Once your listing is created and approved it will appear here, with the views, investor interest and commitments it attracts."
          action={{ label: "Start a listing", href: "/register/business" }}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-ink/65">Business workspace</p>
          <h1 className="mt-1 font-display text-3xl font-semibold text-navy-700">{home.listingTitle}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {home.tier && (
              <Badge variant={TIER_VARIANT[home.tier] ?? "neutral"} size="sm">
                {home.tier.charAt(0) + home.tier.slice(1).toLowerCase()} listing
              </Badge>
            )}
            <Badge variant={home.kycStatus === "VERIFIED" ? "success" : "gold"} size="sm">
              <ShieldCheck className="h-3.5 w-3.5" />
              {home.kycStatus === "VERIFIED" ? "Verified" : "Not verified"}
            </Badge>
            {home.status && home.status !== "PUBLISHED" && (
              <Badge variant="neutral" size="sm">{home.status.replace(/_/g, " ").toLowerCase()}</Badge>
            )}
          </div>
        </div>
        <Link
          href="/dashboard/business/billing"
          className="inline-flex items-center gap-2 rounded-[var(--radius-button)] bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
        >
          Upgrade listing <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Every one is a count against this listing. */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Listing views" value={home.views.toLocaleString("en-US")} icon={Eye} trend="flat" />
        <StatCard label="Investor interest" value={String(home.interest.length)} icon={Users} trend="flat" />
        <StatCard label="Shortlisted by" value={String(home.savedCount)} icon={Bookmark} trend="flat" />
        <StatCard label="NDAs signed" value={String(home.ndaCount)} icon={FileSignature} trend="flat" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Panel id="interest" title="Investor interest">
          {home.interest.length === 0 ? (
            <p className="py-8 text-center text-sm text-ink/65">
              No investor has registered interest yet. Interest arrives once your listing is live in the marketplace.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[0.7rem] uppercase tracking-wide text-ink/60">
                    <th className="pb-3 font-semibold">Investor</th>
                    <th className="pb-3 font-semibold">Type</th>
                    <th className="pb-3 text-right font-semibold">Registered</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/[0.06]">
                  {home.interest.map((r) => (
                    <tr key={r.email}>
                      <td className="py-3 font-medium text-ink">{r.name}</td>
                      <td className="py-3 text-ink/60">{r.kind}</td>
                      <td className="py-3 text-right text-ink/60">{formatDate(r.at, "en")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        <div className="space-y-6">
          <GalleryCard initialImages={gallery} fallback={opp ? listingImage(opp) : null} />
          <Panel title="Raise progress">
            <div className="flex items-center gap-4">
              <ProgressRing value={raisePct} />
              <div>
                <p className="font-medium text-ink">
                  {home.askUsd ? `${usd(home.committedUsd)} of ${usd(home.askUsd)}` : usd(home.committedUsd)}
                </p>
                <p className="text-sm text-ink/65">
                  {home.commitments.length === 0
                    ? "Nothing committed yet."
                    : `Across ${home.commitments.length} ${home.commitments.length === 1 ? "investor" : "investors"}.`}
                </p>
              </div>
            </div>
          </Panel>
        </div>
      </div>

      <Panel id="payments" title="Commitments" action={{ label: "Pipeline", href: "/dashboard/pipeline" }}>
        {home.commitments.length === 0 ? (
          <p className="flex items-center justify-center gap-2 py-8 text-center text-sm text-ink/65">
            <Wallet className="h-4 w-4" /> No capital has been committed to this listing yet.
          </p>
        ) : (
          <div className="divide-y divide-ink/[0.06]">
            {home.commitments.map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-3 py-3 first:pt-0">
                <div className="min-w-0">
                  <p className="text-xs text-ink/65">{formatDate(c.createdAt, "en")}</p>
                  <p className="truncate text-sm text-ink/70">{c.status.replace(/_/g, " ").toLowerCase()}</p>
                </div>
                <p className="font-medium text-ink tnum">{usd(c.amountUsd)}</p>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
