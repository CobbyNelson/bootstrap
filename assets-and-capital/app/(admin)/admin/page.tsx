import type { Metadata } from "next";
import {
  Building2, Users, TrendingUp, BadgeCheck, Check, X, Wallet,
  ArrowUpRight, Download, CalendarDays, type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Panel } from "@/components/dashboard/widgets";
import { BarChartDual, DonutChart, AreaChart, Sparkline } from "@/components/admin/charts";
import { cn } from "@/lib/utils";
import {
  getKpis, getApprovals, getRecentListings, getDealVolume,
  getRecentPayments, getAuditLog, getTierMix, getCapitalSeries,
} from "@/lib/admin-queries";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Admin" };

/* ---------- data ----------
 * Everything below used to be a display constant: an approvals queue of three
 * invented companies, four made-up listings, "$248M capital facilitated". It
 * read as a working dashboard and was a picture of one.
 *
 * The numbers now come from lib/admin-queries. Most are zero today, which is
 * the point — a dashboard reporting 0 listings when there are 0 listings is
 * telling the truth, and the first real one appears without a deploy.
 */


function initials(name: string) {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("");
}

/* ---------- KPI card ---------- */
const TONES = {
  navy: { card: "bg-navy-700 text-white", label: "text-white/60", badge: "bg-white/12 text-white", spark: "var(--color-navy-200)", pill: "bg-white/12 text-white" },
  ink: { card: "bg-ink text-white", label: "text-white/70", badge: "bg-white/10 text-navy-300", spark: "var(--color-navy-300)", pill: "bg-white/10 text-white" },
  brand: { card: "bg-brand-600 text-white", label: "text-white", badge: "bg-white/15 text-white", spark: "#ffffff", pill: "bg-white/15 text-white" },
  cream: { card: "bg-white text-ink border border-ink/[0.07]", label: "text-ink/65", badge: "bg-brand-50 text-brand-600", spark: "var(--color-brand-600)", pill: "bg-emerald-50 text-emerald-700" },
} as const;

function Kpi({
  tone, icon: Icon, label, value, delta, spark,
}: {
  tone: keyof typeof TONES;
  icon: LucideIcon;
  label: string;
  value: string;
  delta: string;
  spark: number[];
}) {
  const t = TONES[tone];
  return (
    <div className={cn("relative overflow-hidden rounded-3xl p-5", t.card)}>
      <div className="flex items-start justify-between">
        <span className={cn("grid h-9 w-9 place-items-center rounded-[var(--radius-button)]", t.badge)}>
          <Icon className="h-4 w-4" />
        </span>
        <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.7rem] font-medium", t.pill)}>
          <ArrowUpRight className="h-3 w-3" /> {delta}
        </span>
      </div>
      <p className="mt-4 font-grotesk text-[1.75rem] font-semibold leading-none tnum">{value}</p>
      <div className="mt-1.5 flex items-end justify-between gap-2">
        <p className={cn("kicker text-[0.68rem]", t.label)}>{label}</p>
        <Sparkline data={spark} stroke={t.spark} />
      </div>
    </div>
  );
}

// The enum is upper-case (PLATINUM); the old table held title-case strings.
const TIER_VARIANT = (tier: string) =>
  tier.toUpperCase() === "PLATINUM" ? "brand" : tier.toUpperCase() === "GOLD" ? "gold" : "neutral";

export const dynamic = "force-dynamic";

export default async function AdminOverview() {
  const [kpis, approvals, listings, volume, payments, audit, tierMix, capital, counts] = await Promise.all([
    getKpis(), getApprovals(), getRecentListings(), getDealVolume(),
    getRecentPayments(), getAuditLog(), getTierMix(), getCapitalSeries(),
    // The three sidebar sections that had no panel at all to scroll to.
    Promise.all([
      prisma.organization.count({ where: { type: "BUSINESS" } }).catch(() => 0),
      prisma.user.count({ where: { role: "INVESTOR" } }).catch(() => 0),
      prisma.listing.count().catch(() => 0),
    ]),
  ]);
  const [businessCount, investorCount, listingCount] = counts;
  const usd = (n: number) =>
    n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `$${(n / 1_000).toFixed(0)}K` : `$${n}`;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="kicker text-[0.7rem] text-brand-700">Platform administration</p>
          <h1 className="mt-1.5 font-display text-3xl font-medium text-navy-700">Overview</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-[var(--radius-button)] border border-ink/10 bg-white px-3.5 py-2 text-sm text-ink/60">
            <CalendarDays className="h-4 w-4 text-ink/60" /> Last 30 days
          </span>
          <button
            disabled
            title="Export is not built yet."
            className="cursor-not-allowed opacity-40 inline-flex items-center gap-2 rounded-[var(--radius-button)] bg-ink px-4 py-2 text-sm font-medium text-white hover:bg-ink-2">
            <Download className="h-4 w-4" /> Export
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi tone="navy" icon={TrendingUp} label="Capital facilitated" value={usd(kpis.capitalFacilitatedUsd)} delta="funded only" spark={[40, 52, 48, 60, 58, 72, 80, 96]} />
        <Kpi tone="ink" icon={Building2} label="Active listings" value={String(kpis.activeListings)} delta="live" spark={[30, 34, 40, 38, 52, 60, 66, 74]} />
        <Kpi tone="brand" icon={Users} label="Active investors" value={String(kpis.activeInvestors)} delta="registered" spark={[20, 28, 34, 40, 44, 56, 62, 70]} />
        <Kpi tone="cream" icon={BadgeCheck} label="Pending approvals" value={String(kpis.pendingApprovals)} delta="awaiting review" spark={[8, 5, 9, 6, 7, 4, 6, 5]} />
      </div>

      {/* table + bar chart */}
      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        <Panel title="Recent activity" action={{ label: "All listings", href: "/admin/listings" }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[0.68rem] uppercase tracking-wide text-ink/60">
                  <th className="pb-3 font-semibold">Business</th>
                  <th className="hidden pb-3 font-semibold sm:table-cell">Sector</th>
                  <th className="pb-3 text-center font-semibold">Interest</th>
                  <th className="hidden pb-3 font-semibold md:table-cell">Tier</th>
                  <th className="pb-3 text-right font-semibold">Raised</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/[0.05]">
                {listings.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-sm text-ink/55">
                      No listings yet — the marketplace still runs on the sample catalogue.
                    </td>
                  </tr>
                )}
                {listings.map((b) => (
                  <tr key={b.name}>
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <span className="grid h-9 w-9 flex-none place-items-center rounded-[var(--radius-button)] bg-brand-600 text-[0.7rem] font-semibold text-white">
                          {initials(b.name)}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-ink">{b.name}</p>
                          <p className="truncate text-xs text-ink/60">{b.sector}</p>
                        </div>
                      </div>
                    </td>
                    <td className="hidden py-3 text-ink/60 sm:table-cell">{b.sector}</td>
                    <td className="py-3 text-center">
                      <span className="inline-grid h-7 w-7 place-items-center rounded-[var(--radius-button)] bg-navy-600 text-[0.7rem] font-semibold text-white tnum">
                        {b.interest}
                      </span>
                    </td>
                    <td className="hidden py-3 md:table-cell">
                      <Badge variant={TIER_VARIANT(b.tier) as "brand" | "gold" | "neutral"} size="sm">{b.tier}</Badge>
                    </td>
                    <td className="py-3 text-right font-medium text-ink tnum">{b.askUsd ? usd(b.askUsd) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Deal volume" action={{ label: "Analytics", href: "/admin/analytics" }}>
          <div className="mb-4 flex items-baseline gap-2">
            <span className="font-grotesk text-2xl font-semibold text-ink tnum">
              {volume.reduce((n, m) => n + m.closed + m.pipeline, 0)}
            </span>
            <span className="text-sm font-medium text-ink/55">commitments · 12 mo</span>
          </div>
          <BarChartDual
            data={volume.map((m) => ({ base: m.closed, cap: m.pipeline }))}
            labels={volume.map((m) => m.month)}
          />
          <div className="mt-4 flex items-center gap-4 text-xs text-ink/65">
            <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-ink" /> Closed</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-navy-400" /> In pipeline</span>
          </div>
        </Panel>
      </div>

      {/* donut + area */}
      <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
        <Panel title="Listings by tier">
          {tierMix.length === 0 ? (
            <p className="py-10 text-center text-sm text-ink/55">No live listings to break down yet.</p>
          ) : (
            <DonutChart
              data={tierMix.map((t, i) => ({
                label: t.tier.charAt(0) + t.tier.slice(1).toLowerCase(),
                value: t.count,
                color: (["brand", "gold", "teal", "ink"] as const)[i % 4],
              }))}
              centerValue={String(tierMix.reduce((n, t) => n + t.count, 0))}
              centerLabel="listings"
            />
          )}
        </Panel>

        <Panel title="Capital connected" action={{ label: "Payments", href: "/admin/payments" }}>
          <div className="mb-3 flex flex-wrap items-center gap-4">
            <div className="flex items-baseline gap-2">
              <span className="font-grotesk text-2xl font-semibold text-ink tnum">
                {usd(kpis.capitalFacilitatedUsd)}
              </span>
              <span className="text-sm font-medium text-ink/55">funded to date</span>
            </div>
            <div className="ml-auto flex items-center gap-4 text-xs text-ink/65">
              <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-brand-600" /> Connected</span>
              <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-navy-500" /> Target</span>
            </div>
          </div>
          {capital.every((c) => c.totalUsd === 0) ? (
            <p className="py-12 text-center text-sm text-ink/55">
              Nothing funded yet. This chart fills in as commitments are funded.
            </p>
          ) : (
            <AreaChart
              primary={capital.map((c) => Math.round(c.totalUsd / 1000))}
              secondary={capital.map((c) => Math.round(c.totalUsd / 1000))}
              labels={capital.map((c) => c.month)}
              peakLabel={usd(capital[capital.length - 1]?.totalUsd ?? 0)}
            />
          )}
        </Panel>
      </div>

      {/* approvals + payments */}
      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <Panel title="Approvals queue" action={{ label: "All", href: "/admin/approvals" }}>
          <div className="space-y-3">
            {approvals.length === 0 && (
              <p className="py-6 text-center text-sm text-ink/55">
                Nothing awaiting review. Investor verifications and listings submitted for review appear here.
              </p>
            )}
            {approvals.map((a) => (
              <div key={a.kind + a.id} className="rounded-2xl border border-ink/[0.06] p-3.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink">{a.name}</p>
                    <p className="text-xs text-ink/65">{a.detail}</p>
                  </div>
                  <Badge variant="neutral" size="sm">{a.kind === "kyc" ? "Investor" : "Listing"}</Badge>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <button
                    disabled
                    title="Not wired yet — this queue shows sample rows, not real submissions."
                    className="cursor-not-allowed opacity-40 inline-flex flex-1 items-center justify-center gap-1.5 rounded-[var(--radius-button)] bg-ink py-1.5 text-[0.7rem] kicker text-white hover:bg-ink-2">
                    <Check className="h-3.5 w-3.5" /> Approve
                  </button>
                  <button
                    disabled
                    title="Not wired yet — this queue shows sample rows, not real submissions."
                    className="cursor-not-allowed opacity-40 inline-flex flex-1 items-center justify-center gap-1.5 rounded-[var(--radius-button)] border border-ink/12 py-1.5 text-[0.7rem] kicker text-ink/60 hover:border-brand-300 hover:text-brand-700">
                    <X className="h-3.5 w-3.5" /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Recent payments" action={{ label: "All transactions", href: "/admin/payments" }}>
          <div className="divide-y divide-ink/[0.06]">
            {payments.length === 0 && (
              <p className="py-6 text-center text-sm text-ink/55">No payments recorded yet.</p>
            )}
            {payments.map((p) => (
              <div key={p.id} className="flex items-center gap-3 py-3 first:pt-0">
                <span className="grid h-9 w-9 flex-none place-items-center rounded-xl bg-paper-2 text-ink/65">
                  <Wallet className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-ink">{p.description}</p>
                  <p className="text-xs text-ink/65">{p.status}</p>
                </div>
                <span className="font-medium text-ink tnum">{usd(p.amountCents / 100)}</span>
                <Badge variant={p.status === "PAID" ? "success" : "gold"} size="sm">{p.status}</Badge>
              </div>
            ))}
          </div>
        </Panel>
      </div>

        {/*
          Businesses, Investors, Listings and Audit log.

          The sidebar has linked to #businesses, #investors, #listings and
          #audit since it was written, and not one of those ids existed on this
          page — four of its six entries scrolled nowhere and looked broken.
          They are real sections now, reading the real tables.
        */}
        <div className="grid gap-4 lg:grid-cols-3">
          <Panel title="Businesses" action={{ label: "Open", href: "/admin/businesses" }}>
            <p className="font-grotesk text-3xl font-semibold text-navy-700 tnum">{businessCount}</p>
            <p className="mt-1 text-sm text-ink/60">
              {businessCount === 0
                ? "No business organisations registered yet."
                : "Organisations registered as businesses."}
            </p>
          </Panel>

          <Panel title="Investors" action={{ label: "Open", href: "/admin/investors" }}>
            <p className="font-grotesk text-3xl font-semibold text-navy-700 tnum">{investorCount}</p>
            <p className="mt-1 text-sm text-ink/60">
              {investorCount === 0 ? "No investors registered yet." : "Accounts with the investor role."}
            </p>
          </Panel>

          <Panel title="Listings" action={{ label: "Open", href: "/admin/listings" }}>
            <p className="font-grotesk text-3xl font-semibold text-navy-700 tnum">{listingCount}</p>
            <p className="mt-1 text-sm text-ink/60">
              {listingCount === 0
                ? "No listings yet — the marketplace still runs on the sample catalogue."
                : `${kpis.activeListings} live, ${listingCount - kpis.activeListings} in other states.`}
            </p>
          </Panel>
        </div>

        <Panel title="Audit log" action={{ label: "Open", href: "/admin/audit" }}>
          {audit.length === 0 ? (
            <p className="py-6 text-center text-sm text-ink/55">
              Nothing recorded yet. Admin actions are written here as they happen.
            </p>
          ) : (
            <div className="divide-y divide-ink/[0.06]">
              {audit.map((a) => (
                <div key={a.id} className="flex items-center gap-3 py-2.5 text-sm first:pt-0">
                  <span className="font-medium text-ink">{a.action}</span>
                  {a.target && <span className="truncate text-ink/60">{a.target}</span>}
                  <span className="ml-auto flex-none text-xs text-ink/50">
                    {a.actor} · {a.createdAt.toLocaleDateString("en-GB")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Panel>
    </div>
  );
}
