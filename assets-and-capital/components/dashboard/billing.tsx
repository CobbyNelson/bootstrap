"use client";

import { useState } from "react";
import { Check, Sparkles, Tag, CreditCard } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Plan = { name: string; monthly: number | null; blurb: string; features: string[]; current?: boolean; enterprise?: boolean };
const PLANS: Plan[] = [
  { name: "Standard", monthly: 49, blurb: "Get discovered", features: ["1 active listing", "Marketplace search", "Basic analytics", "Secure messaging"] },
  { name: "Silver", monthly: 120, blurb: "Stand out", features: ["3 listings", "Priority placement", "Data room 25GB", "Featured badge"] },
  { name: "Gold", monthly: 350, blurb: "Actively promoted", features: ["10 listings", "Mandate-matched outreach", "1 roadshow", "Dedicated manager"], current: true },
  { name: "Platinum", monthly: 900, blurb: "White-glove", features: ["Unlimited listings", "Multiple roadshows", "Business plan + modelling", "Shadow investor search"] },
  { name: "Enterprise", monthly: null, blurb: "For funds & networks", features: ["Custom listings & seats", "API & SSO/SCIM", "Custom branding", "SLA support"], enterprise: true },
];

const USAGE = [
  { label: "Active listings", used: 2, total: 10, unit: "" },
  { label: "Data room storage", used: 12, total: 25, unit: "GB" },
  { label: "AI recommendations", used: 640, total: 1000, unit: "/mo" },
  { label: "Team seats", used: 3, total: 8, unit: "" },
];

const INVOICES = [
  { id: "INV-2129", desc: "Gold listing — annual", date: "12 Jan 2026", amount: "$3,500", status: "Paid" },
  { id: "INV-2088", desc: "Personalised roadshow", date: "04 Mar 2026", amount: "$4,000", status: "Paid" },
  { id: "INV-2131", desc: "Financial modelling service", date: "18 Jul 2026", amount: "$2,200", status: "Due" },
];

export function Billing() {
  const [annual, setAnnual] = useState(true);
  const [coupon, setCoupon] = useState("");
  const [applied, setApplied] = useState<string | null>(null);

  function price(p: Plan) {
    if (p.monthly === null) return "Custom";
    const m = annual ? Math.round(p.monthly * 10) : p.monthly; // 2 months free annually
    return annual ? `$${m.toLocaleString()}/yr` : `$${m}/mo`;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-ink/65">Business workspace</p>
          <h1 className="mt-1 font-display text-3xl font-semibold text-navy-700">Billing &amp; subscription</h1>
        </div>
        <button className="inline-flex items-center gap-2 rounded-[var(--radius-button)] border border-ink/12 px-4 py-2.5 text-sm font-medium text-ink/70 hover:border-ink/25">
          <CreditCard className="h-4 w-4" /> Manage payment method
        </button>
      </div>

      {/* current plan + usage */}
      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <div className="rounded-3xl border border-brand-600/20 bg-white p-6 ring-1 ring-brand-600/10">
          <div className="flex items-center justify-between">
            <Badge variant="gold"><Sparkles className="h-3.5 w-3.5" /> Gold plan</Badge>
            <span className="text-xs text-ink/60">Renews 12 Jan 2027</span>
          </div>
          <p className="mt-4 font-display text-3xl font-semibold text-navy-700 tnum">$3,500<span className="text-base font-normal text-ink/60">/yr</span></p>
          <p className="mt-1 text-sm text-ink/65">Actively promoted to mandate-matched investors.</p>
          <div className="mt-5 flex items-center gap-2 rounded-2xl bg-paper-2/60 p-1.5">
            <Tag className="ml-2 h-4 w-4 text-ink/60" />
            <input
              value={coupon}
              onChange={(e) => setCoupon(e.target.value)}
              placeholder="Promo code"
              className="h-9 flex-1 bg-transparent text-sm text-ink placeholder:text-ink/60 focus:outline-none"
            />
            <button
              onClick={() => setApplied(coupon.trim() ? coupon.trim().toUpperCase() : null)}
              className="rounded-[var(--radius-button)] bg-ink px-3.5 py-1.5 text-xs font-medium text-white hover:bg-ink-2"
            >
              Apply
            </button>
          </div>
          {applied && (
            <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
              <Check className="h-3.5 w-3.5" /> Code {applied} applied — 15% off next renewal
            </p>
          )}
        </div>

        <div className="rounded-3xl border border-ink/[0.07] bg-white p-6">
          <h2 className="font-display text-lg font-semibold text-navy-700">Usage this cycle</h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            {USAGE.map((u) => {
              const pct = Math.min(100, Math.round((u.used / u.total) * 100));
              return (
                <div key={u.label}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="text-ink/70">{u.label}</span>
                    <span className="font-medium text-ink tnum">{u.used}{u.unit} <span className="text-ink/60">/ {u.total}{u.unit}</span></span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-ink/[0.06]">
                    <div className={cn("h-full rounded-full", pct > 85 ? "bg-brand-600" : "bg-emerald-500")} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* plans */}
      <div className="rounded-3xl border border-ink/[0.07] bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-lg font-semibold text-navy-700">Plans</h2>
          <div className="inline-flex items-center gap-2 rounded-[var(--radius-button)] border border-ink/10 bg-paper-2/60 p-1 text-sm">
            <button onClick={() => setAnnual(false)} className={cn("rounded-[var(--radius-button)] px-3 py-1", !annual && "bg-white shadow-sm")}>Monthly</button>
            <button onClick={() => setAnnual(true)} className={cn("rounded-[var(--radius-button)] px-3 py-1", annual && "bg-white shadow-sm")}>
              Annual <span className="text-emerald-700">−17%</span>
            </button>
          </div>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-3 xl:grid-cols-5">
          {PLANS.map((p) => (
            <div key={p.name} className={cn("flex flex-col rounded-2xl border p-5", p.current ? "border-brand-600/30 ring-1 ring-brand-600/15" : "border-ink/[0.07]")}>
              <div className="flex items-center justify-between">
                <p className="font-semibold text-ink">{p.name}</p>
                {p.current && <Badge variant="brand" size="sm">Current</Badge>}
              </div>
              <p className="mt-0.5 text-xs text-ink/60">{p.blurb}</p>
              <p className="mt-3 font-display text-xl font-semibold text-navy-700 tnum">{price(p)}</p>
              <ul className="mt-4 flex-1 space-y-2">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs text-ink/65">
                    <Check className="mt-0.5 h-3.5 w-3.5 flex-none text-navy-600" /> {f}
                  </li>
                ))}
              </ul>
              <button
                className={cn(
                  "mt-5 w-full rounded-[var(--radius-button)] py-2 text-sm font-medium transition-colors",
                  p.current ? "cursor-default border border-ink/10 text-ink/60" : p.enterprise ? "border border-ink/15 text-ink hover:border-ink/30" : "bg-brand-600 text-white hover:bg-brand-700"
                )}
                disabled={p.current}
              >
                {p.current ? "Current plan" : p.enterprise ? "Contact sales" : "Upgrade"}
              </button>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-ink/60">Upgrades apply immediately with prorated billing. Referral discounts and promo codes stack up to 25%.</p>
      </div>

      {/* invoices */}
      <div className="rounded-3xl border border-ink/[0.07] bg-white p-6">
        <h2 className="mb-4 font-display text-lg font-semibold text-navy-700">Invoices</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[0.7rem] uppercase tracking-wide text-ink/60">
                <th className="pb-3 font-semibold">Invoice</th>
                <th className="pb-3 font-semibold">Description</th>
                <th className="pb-3 font-semibold">Date</th>
                <th className="pb-3 text-right font-semibold">Amount</th>
                <th className="pb-3 text-right font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/[0.06]">
              {INVOICES.map((inv) => (
                <tr key={inv.id}>
                  <td className="py-3 text-xs text-ink/60 tnum">{inv.id}</td>
                  <td className="py-3 font-medium text-ink">{inv.desc}</td>
                  <td className="py-3 text-ink/65">{inv.date}</td>
                  <td className="py-3 text-right font-medium text-ink tnum">{inv.amount}</td>
                  <td className="py-3 text-right"><Badge variant={inv.status === "Paid" ? "success" : "gold"} size="sm">{inv.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
