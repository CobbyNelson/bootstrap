import type { Metadata } from "next";
import {
  Building2, Users, TrendingUp, BadgeCheck, Check, X, Wallet,
  ArrowUpRight, Download, CalendarDays, type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Panel } from "@/components/dashboard/widgets";
import { BarChartDual, DonutChart, AreaChart, Sparkline } from "@/components/admin/charts";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Admin" };

/* ---------- data ---------- */
const APPROVALS = [
  { name: "Kigali PropCo", type: "Business listing", detail: "Real Estate · $14M ask", when: "2h ago" },
  { name: "Delta Partners", type: "Investor mandate", detail: "Family Office · accreditation", when: "4h ago" },
  { name: "Sahel AgriProcessing", type: "Business listing", detail: "Agriculture · $7M ask", when: "6h ago" },
];
const ACTIVITY_ROWS = [
  { name: "Accra FinPay", email: "raise@accrafinpay.com", sector: "FinTech", interest: 8, tier: "Gold", status: "Live", value: "$9.6M" },
  { name: "Sahara Solar Grid", email: "ir@saharasolar.com", sector: "Renewable", interest: 12, tier: "Platinum", status: "Live", value: "$11.0M" },
  { name: "Atlas Logistics", email: "cfo@atlaslog.ma", sector: "Logistics", interest: 5, tier: "Gold", status: "Diligence", value: "$4.0M" },
  { name: "Cape Wine Estates", email: "team@capewine.co.za", sector: "F&B", interest: 3, tier: "Silver", status: "Live", value: "$2.0M" },
];
const PAYMENTS = [
  { id: "INV-2131", who: "Accra FinPay", desc: "Financial modelling", amount: "$2,200", status: "Due" },
  { id: "INV-2129", who: "Sahara Solar Grid", desc: "Platinum listing", amount: "$8,500", status: "Paid" },
  { id: "INV-2118", who: "Atlas Logistics", desc: "Roadshow", amount: "$4,000", status: "Paid" },
];

const DEAL_VOLUME = [
  { base: 30, cap: 10 }, { base: 38, cap: 14 }, { base: 34, cap: 14 }, { base: 46, cap: 20 },
  { base: 50, cap: 22 }, { base: 44, cap: 17 }, { base: 60, cap: 24 }, { base: 66, cap: 26 },
  { base: 56, cap: 22 }, { base: 70, cap: 26 }, { base: 78, cap: 32 }, { base: 88, cap: 36 },
];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const TIER_SPLIT = [
  { label: "Platinum", value: 12, color: "brand" as const },
  { label: "Gold", value: 28, color: "gold" as const },
  { label: "Silver", value: 34, color: "teal" as const },
  { label: "Standard", value: 26, color: "ink" as const },
];
const CAPITAL = [60, 88, 74, 120, 150, 132, 180, 210, 176, 232, 248, 300];
const TARGET = [80, 90, 100, 110, 130, 150, 165, 180, 195, 210, 225, 250];

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

const TIER_VARIANT = (tier: string) => (tier === "Platinum" ? "brand" : tier === "Gold" ? "gold" : "neutral");

export default function AdminOverview() {
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
        <Kpi tone="navy" icon={TrendingUp} label="Capital facilitated" value="$248M" delta="12%" spark={[40, 52, 48, 66, 72, 61, 84, 96]} />
        <Kpi tone="ink" icon={Building2} label="Active listings" value="482" delta="24" spark={[30, 34, 40, 38, 52, 60, 66, 78]} />
        <Kpi tone="brand" icon={Users} label="Active investors" value="1,204" delta="61" spark={[20, 28, 34, 40, 44, 56, 66, 80]} />
        <Kpi tone="cream" icon={BadgeCheck} label="Pending approvals" value="6" delta="2 overdue" spark={[8, 5, 9, 6, 10, 7, 6, 6]} />
      </div>

      {/* table + bar chart */}
      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        <Panel title="Recent activity" action={{ label: "Manage listings", href: "#businesses" }}>
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
                {ACTIVITY_ROWS.map((b) => (
                  <tr key={b.name}>
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <span className="grid h-9 w-9 flex-none place-items-center rounded-[var(--radius-button)] bg-brand-600 text-[0.7rem] font-semibold text-white">
                          {initials(b.name)}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-ink">{b.name}</p>
                          <p className="truncate text-xs text-ink/60">{b.email}</p>
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
                    <td className="py-3 text-right font-medium text-ink tnum">{b.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Deal volume" action={{ label: "Statistics", href: "#stats" }}>
          <div className="mb-4 flex items-baseline gap-2">
            <span className="font-grotesk text-2xl font-semibold text-ink tnum">1,124</span>
            <span className="text-sm font-medium text-emerald-700">+18% · 12 mo</span>
          </div>
          <BarChartDual data={DEAL_VOLUME} labels={MONTHS.map((m) => m[0])} />
          <div className="mt-4 flex items-center gap-4 text-xs text-ink/65">
            <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-ink" /> Closed</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-navy-400" /> In pipeline</span>
          </div>
        </Panel>
      </div>

      {/* donut + area */}
      <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
        <Panel title="Listings by tier">
          <DonutChart data={TIER_SPLIT} centerValue="482" centerLabel="listings" />
        </Panel>

        <Panel title="Capital connected" action={{ label: "Full report", href: "#activity" }}>
          <div className="mb-3 flex flex-wrap items-center gap-4">
            <div className="flex items-baseline gap-2">
              <span className="font-grotesk text-2xl font-semibold text-ink tnum">$248M</span>
              <span className="text-sm font-medium text-emerald-700">+12% YoY</span>
            </div>
            <div className="ml-auto flex items-center gap-4 text-xs text-ink/65">
              <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-brand-600" /> Connected</span>
              <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-navy-500" /> Target</span>
            </div>
          </div>
          <AreaChart primary={CAPITAL} secondary={TARGET} labels={MONTHS} peakLabel="$300M" />
        </Panel>
      </div>

      {/* approvals + payments */}
      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <Panel id="approvals" title="Approvals queue" action={{ label: "All", href: "#approvals" }}>
          <div className="space-y-3">
            {APPROVALS.map((a) => (
              <div key={a.name} className="rounded-2xl border border-ink/[0.06] p-3.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink">{a.name}</p>
                    <p className="text-xs text-ink/65">{a.detail}</p>
                  </div>
                  <Badge variant="neutral" size="sm">{a.type.split(" ")[0]}</Badge>
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

        <Panel id="payments" title="Recent payments" action={{ label: "All transactions", href: "#payments" }}>
          <div className="divide-y divide-ink/[0.06]">
            {PAYMENTS.map((p) => (
              <div key={p.id} className="flex items-center gap-3 py-3 first:pt-0">
                <span className="grid h-9 w-9 flex-none place-items-center rounded-xl bg-paper-2 text-ink/65">
                  <Wallet className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-ink">{p.who}</p>
                  <p className="text-xs text-ink/65">{p.desc} · {p.id}</p>
                </div>
                <span className="font-medium text-ink tnum">{p.amount}</span>
                <Badge variant={p.status === "Paid" ? "success" : "gold"} size="sm">{p.status}</Badge>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
