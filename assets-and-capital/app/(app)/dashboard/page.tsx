import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Target, Bookmark, FileSignature, TrendingUp, ArrowRight, ShieldCheck, Presentation, Bell } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { getInvestorHome, getPortalIdentity } from "@/lib/portal-queries";
import { listPublicEvents } from "@/lib/events";
import { recommend, DEMO_MANDATE } from "@/lib/matching";
import { formatDate, dateBadge, formatDateShort } from "@/lib/dates";
import { OpportunityCard } from "@/components/ui/opportunity-card";
import { Badge } from "@/components/ui/badge";
import { StatCard, Panel } from "@/components/dashboard/widgets";

export const metadata: Metadata = { title: "Investor Dashboard" };

/**
 * The investor's own workspace.
 *
 * This page said "Welcome back, Aurora" to whoever signed in, over four KPIs
 * that were the literals 9, 12, 34 and 2, a saved table of three companies
 * nobody had saved, three messages nobody had sent, three documents that did
 * not exist and a trust score computed from a constant called DEMO_INVESTOR.
 *
 * Everything below is the signed-in account: saves and interests they recorded,
 * commitments they made, NDAs they signed, and the verification state that
 * gates all of it.
 */
const usd = (n: number) => `$${n.toLocaleString("en-US")}`;

const KYC_BADGE: Record<string, { variant: "success" | "gold" | "brand" | "neutral"; label: string }> = {
  VERIFIED: { variant: "success", label: "Verified" },
  PENDING: { variant: "brand", label: "Verification under review" },
  REJECTED: { variant: "neutral", label: "Verification declined" },
  EXPIRED: { variant: "gold", label: "Verification expired" },
  NOT_STARTED: { variant: "gold", label: "Not verified" },
};

export default async function InvestorDashboard() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/dashboard");

  const [me, home, events] = await Promise.all([getPortalIdentity(), getInvestorHome(user), listPublicEvents()]);

  const kyc = KYC_BADGE[home.kycStatus] ?? KYC_BADGE.NOT_STARTED;
  // The real matching engine over the real marketplace. It used to be
  // FEATURED_OPPORTUNITIES.slice(0, 2) — the same two businesses for everyone,
  // labelled "Recommended for your mandate".
  const matches = recommend(DEMO_MANDATE, 2);
  const upcoming = events.slice(0, 2);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-ink/65">Investor workspace</p>
          <h1 className="mt-1 font-display text-3xl font-semibold text-navy-700">
            Welcome back, {me?.name ?? "there"}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant={kyc.variant} size="sm">
              <ShieldCheck className="h-3.5 w-3.5" /> {kyc.label}
            </Badge>
            {home.kycStatus !== "VERIFIED" && (
              <Link href="/dashboard/verification" className="text-xs font-medium text-brand-700 hover:text-brand-800">
                Complete verification
              </Link>
            )}
          </div>
        </div>
        <Link
          href="/marketplace"
          className="inline-flex items-center gap-2 rounded-[var(--radius-button)] bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
        >
          Browse marketplace <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Counts, not claims. Each one is a row count for this account. */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Saved opportunities" value={String(home.savedCount)} icon={Bookmark} trend="flat" />
        <StatCard label="Interests registered" value={String(home.interestCount)} icon={Target} trend="flat" />
        <StatCard label="NDAs signed" value={String(home.ndaCount)} icon={FileSignature} trend="flat" />
        <StatCard
          label="Capital committed"
          value={home.committedUsd > 0 ? usd(home.committedUsd) : "—"}
          icon={TrendingUp}
          trend="flat"
        />
      </div>

      <Panel id="matches" title="Recommended for your mandate" action={{ label: "See all", href: "/marketplace" }}>
        <div className="grid gap-5 sm:grid-cols-2">
          {matches.map((m) => (
            <OpportunityCard key={m.opportunity.name} o={m.opportunity} />
          ))}
        </div>
      </Panel>

      <Panel id="saved" title="Saved & watchlist" action={{ label: "View all", href: "/dashboard/saved" }}>
        {home.saved.length === 0 ? (
          <p className="py-6 text-center text-sm text-ink/65">
            Nothing saved yet.{" "}
            <Link href="/marketplace" className="font-medium text-brand-700 hover:text-brand-800">
              Browse the marketplace
            </Link>
            .
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[0.7rem] uppercase tracking-wide text-ink/60">
                  <th className="pb-3 font-semibold">Opportunity</th>
                  <th className="pb-3 font-semibold">Sector</th>
                  <th className="pb-3 text-right font-semibold">Ask</th>
                  <th className="pb-3 text-right font-semibold">Match</th>
                  <th className="pb-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/[0.06]">
                {home.saved.slice(0, 5).map((s) => (
                  <tr key={s.slug}>
                    <td className="py-3 font-medium text-ink">{s.name}</td>
                    <td className="py-3 text-ink/60">{s.sector}</td>
                    <td className="py-3 text-right font-medium text-ink tnum">{s.ask}</td>
                    <td className="py-3 text-right">
                      <span className="font-medium text-emerald-700 tnum">{s.match}%</span>
                    </td>
                    <td className="py-3 text-right">
                      <Link
                        href={`/marketplace/${s.slug}`}
                        className="text-sm font-medium text-brand-700 hover:text-brand-800"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel id="commitments" title="Your commitments" action={{ label: "Pipeline", href: "/dashboard/pipeline" }}>
          {home.commitments.length === 0 ? (
            <p className="py-6 text-center text-sm text-ink/65">
              You haven&rsquo;t committed capital yet.
            </p>
          ) : (
            <div className="divide-y divide-ink/[0.06]">
              {home.commitments.slice(0, 4).map((c) => (
                <div key={c.id} className="flex items-center justify-between gap-3 py-3 first:pt-0">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink">{c.name}</p>
                    <p className="text-xs text-ink/65">{formatDate(c.createdAt, "en")}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-ink tnum">{usd(c.amountUsd)}</p>
                    <p className="text-xs text-ink/65">{c.status.replace(/_/g, " ").toLowerCase()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel id="roadshows" title="Upcoming roadshows" action={{ label: "All events", href: "/events" }}>
          {upcoming.length === 0 ? (
            <p className="flex items-center justify-center gap-2 py-6 text-center text-sm text-ink/65">
              <Presentation className="h-4 w-4" /> No events scheduled right now.
            </p>
          ) : (
            <div className="space-y-3">
              {upcoming.map((ev) => {
                // Derived from the date the row already carries — a real row
                // holds an ISO string, a sample holds its display text, and
                // dateBadge parses both.
                const badge = dateBadge(ev.date, "en");
                return (
                  <div key={ev.id} className="flex items-center gap-4 rounded-2xl border border-ink/[0.06] p-4">
                    <div className="grid h-14 w-14 flex-none place-items-center rounded-xl bg-brand-600 text-white">
                      <span className="font-display text-xl font-semibold leading-none tnum">{badge.day}</span>
                      <span className="text-[0.55rem] font-semibold uppercase tracking-widest">{badge.month}</span>
                    </div>
                    <div className="min-w-0">
                      <Badge variant="gold" size="sm">{ev.type}</Badge>
                      <p className="mt-1.5 truncate font-medium text-ink">{ev.title}</p>
                      <p className="truncate text-xs text-ink/65">
                        {ev.location} · {formatDateShort(ev.date, "en")}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Panel>
      </div>

      <Link
        href="/dashboard/notifications"
        className="flex items-center gap-3 rounded-2xl border border-ink/[0.07] bg-white px-5 py-4 text-sm text-ink/70 transition-colors hover:border-ink/20"
      >
        <Bell className="h-4 w-4 text-ink/50" />
        We&rsquo;ll tell you here when an NDA is signed, a commitment moves, or your verification is decided.
        <ArrowRight className="ml-auto h-4 w-4 text-ink/40" />
      </Link>
    </div>
  );
}
