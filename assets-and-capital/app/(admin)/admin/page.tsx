import type { Metadata } from "next";
import { Building2, Users, TrendingUp, BadgeCheck, Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { StatCard, Panel } from "@/components/dashboard/widgets";

export const metadata: Metadata = { title: "Admin" };

const APPROVALS = [
  { name: "Kigali PropCo", type: "Business listing", detail: "Real Estate · $14M ask", when: "2h ago" },
  { name: "Delta Partners", type: "Investor mandate", detail: "Family Office · verify accreditation", when: "4h ago" },
  { name: "Sahel AgriProcessing", type: "Business listing", detail: "Agriculture · $7M ask", when: "6h ago" },
  { name: "Northwind GP", type: "Investor mandate", detail: "Institutional · KYB pending", when: "1d ago" },
];
const BUSINESSES = [
  { name: "Accra FinPay", country: "Ghana", tier: "Gold", status: "Live", raised: "$9.6M" },
  { name: "Sahara Solar Grid", country: "Kenya", tier: "Platinum", status: "Live", raised: "$11M" },
  { name: "Atlas Logistics", country: "Morocco", tier: "Gold", status: "In diligence", raised: "$4M" },
  { name: "Cape Wine Estates", country: "South Africa", tier: "Silver", status: "Live", raised: "$2M" },
];
const PAYMENTS = [
  { id: "INV-2131", who: "Accra FinPay", desc: "Financial modelling", amount: "$2,200", status: "Due" },
  { id: "INV-2129", who: "Sahara Solar Grid", desc: "Platinum listing", amount: "$8,500", status: "Paid" },
  { id: "INV-2118", who: "Atlas Logistics", desc: "Roadshow", amount: "$4,000", status: "Paid" },
];
const AUDIT = [
  { actor: "admin@a&c", action: "approved.listing", target: "Coastal Wind Partners", when: "09:41" },
  { actor: "system", action: "kyc.cleared", target: "Aurora Family Office", when: "09:20" },
  { actor: "admin@a&c", action: "featured.listing", target: "Nile Digital Bank", when: "08:55" },
  { actor: "system", action: "payment.captured", target: "INV-2129", when: "08:30" },
];

const ACTIVITY = [40, 52, 48, 66, 72, 61, 84, 92, 78, 96, 110, 124];

function BarChart() {
  const max = Math.max(...ACTIVITY);
  return (
    <div className="flex h-40 items-end gap-2">
      {ACTIVITY.map((v, i) => (
        <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
          <div
            className="w-full rounded-t-md bg-gradient-to-t from-brand-700 to-brand-500"
            style={{ height: `${(v / max) * 100}%` }}
          />
        </div>
      ))}
    </div>
  );
}

export default function AdminOverview() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <p className="text-sm text-ink/50">Platform administration</p>
        <h1 className="mt-1 font-display text-3xl font-semibold text-ink">Overview</h1>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total businesses" value="482" delta="+24 this month" icon={Building2} />
        <StatCard label="Active investors" value="1,204" delta="+61" icon={Users} />
        <StatCard label="GMV facilitated" value="$248M" delta="+12%" icon={TrendingUp} />
        <StatCard label="Pending approvals" value="6" delta="2 overdue" trend="down" icon={BadgeCheck} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Panel id="activity" title="Platform activity" action={{ label: "Reports", href: "#activity" }}>
          <div className="mb-4 flex items-baseline gap-3">
            <span className="font-display text-3xl font-semibold text-ink tnum">1,124</span>
            <span className="text-sm font-medium text-emerald-600">+18% new registrations · 12 weeks</span>
          </div>
          <BarChart />
        </Panel>

        <Panel id="approvals" title="Approvals queue" action={{ label: "All", href: "#approvals" }}>
          <div className="space-y-3">
            {APPROVALS.map((a) => (
              <div key={a.name} className="rounded-2xl border border-ink/[0.06] p-3.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink">{a.name}</p>
                    <p className="text-xs text-ink/50">{a.detail}</p>
                  </div>
                  <Badge variant="neutral" size="sm">{a.type.split(" ")[0]}</Badge>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <button className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-emerald-500 py-1.5 text-xs font-medium text-white hover:bg-emerald-600">
                    <Check className="h-3.5 w-3.5" /> Approve
                  </button>
                  <button className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-ink/12 py-1.5 text-xs font-medium text-ink/60 hover:border-brand-300 hover:text-brand-600">
                    <X className="h-3.5 w-3.5" /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel id="businesses" title="Businesses" action={{ label: "Manage all", href: "#businesses" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[0.7rem] uppercase tracking-wide text-ink/40">
                <th className="pb-3 font-semibold">Business</th>
                <th className="pb-3 font-semibold">Country</th>
                <th className="pb-3 font-semibold">Tier</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 text-right font-semibold">Raised</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/[0.06]">
              {BUSINESSES.map((b) => (
                <tr key={b.name}>
                  <td className="py-3 font-medium text-ink">{b.name}</td>
                  <td className="py-3 text-ink/60">{b.country}</td>
                  <td className="py-3">
                    <Badge variant={b.tier === "Platinum" ? "brand" : b.tier === "Gold" ? "gold" : "neutral"} size="sm">{b.tier}</Badge>
                  </td>
                  <td className="py-3">
                    <Badge variant={b.status === "Live" ? "success" : "outline"} size="sm">{b.status}</Badge>
                  </td>
                  <td className="py-3 text-right font-medium text-ink tnum">{b.raised}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel id="payments" title="Recent payments" action={{ label: "All transactions", href: "#payments" }}>
          <div className="divide-y divide-ink/[0.06]">
            {PAYMENTS.map((p) => (
              <div key={p.id} className="flex items-center gap-3 py-3 first:pt-0">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-ink">{p.who}</p>
                  <p className="text-xs text-ink/50">{p.desc} · {p.id}</p>
                </div>
                <span className="font-medium text-ink tnum">{p.amount}</span>
                <Badge variant={p.status === "Paid" ? "success" : "gold"} size="sm">{p.status}</Badge>
              </div>
            ))}
          </div>
        </Panel>

        <Panel id="audit" title="Audit log" action={{ label: "Full log", href: "#audit" }}>
          <div className="divide-y divide-ink/[0.06] font-[family-name:var(--font-sans)]">
            {AUDIT.map((a, i) => (
              <div key={i} className="flex items-center gap-3 py-3 text-sm first:pt-0">
                <span className="tnum text-xs text-ink/40">{a.when}</span>
                <span className="rounded-md bg-paper-2 px-2 py-0.5 text-xs font-medium text-ink/70">{a.action}</span>
                <span className="truncate text-ink/60">{a.target}</span>
                <span className="ml-auto text-xs text-ink/40">{a.actor}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
