import type { Metadata } from "next";
import Link from "next/link";
import { Eye, Users, Bookmark, FileCheck, ArrowRight, Wallet, Download, CheckCircle2 } from "lucide-react";
import { FEATURED_OPPORTUNITIES } from "@/lib/content";
import { scoreBusiness } from "@/lib/business-scoring";
import { Badge } from "@/components/ui/badge";
import { StatCard, Panel, ProgressRing } from "@/components/dashboard/widgets";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Business Dashboard" };

const INTEREST = [
  { name: "Aurora Family Office", type: "Family Office", stage: "Data room", ticket: "$8M", match: 91 },
  { name: "Meridian Growth", type: "PE Fund", stage: "Shortlisted", ticket: "$12M", match: 86 },
  { name: "Rift Valley Capital", type: "Institutional", stage: "Viewed", ticket: "$5M", match: 74 },
  { name: "Delta Partners", type: "Family Office", stage: "Intro requested", ticket: "$10M", match: 80 },
];
const INVOICES = [
  { id: "INV-2041", desc: "Gold listing — 6 months", amount: "$3,500", status: "Paid" },
  { id: "INV-2088", desc: "Personalised roadshow", amount: "$4,000", status: "Paid" },
  { id: "INV-2131", desc: "Financial modelling service", amount: "$2,200", status: "Due" },
];

// simple sparkline points (28-day views)
const VIEWS = [12, 18, 15, 22, 30, 26, 34, 40, 38, 52, 60, 58, 72, 84];

function AreaChart() {
  const w = 640;
  const h = 180;
  const max = Math.max(...VIEWS);
  const step = w / (VIEWS.length - 1);
  const pts = VIEWS.map((v, i) => [i * step, h - (v / max) * (h - 20) - 10]);
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const area = `${line} L${w},${h} L0,${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" role="img" aria-label="Listing views over the last 28 days">
      <defs>
        <linearGradient id="ac-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(185,28,28,0.18)" />
          <stop offset="100%" stopColor="rgba(185,28,28,0)" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((g) => (
        <line key={g} x1="0" y1={h * g} x2={w} y2={h * g} stroke="rgba(12,13,16,0.06)" strokeWidth="1" />
      ))}
      <path d={area} fill="url(#ac-area)" />
      <path d={line} fill="none" stroke="var(--color-brand-600)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="4" fill="var(--color-brand-600)" stroke="#fff" strokeWidth="2" />
    </svg>
  );
}

export default function BusinessDashboard() {
  const self = FEATURED_OPPORTUNITIES.find((o) => o.name === "Accra FinPay") ?? FEATURED_OPPORTUNITIES[0];
  const scores = scoreBusiness(self);
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-ink/50">Business workspace</p>
          <h1 className="mt-1 font-display text-3xl font-semibold text-ink">Accra FinPay</h1>
          <div className="mt-2 flex items-center gap-2">
            <Badge variant="gold" size="sm">Gold listing</Badge>
            <Badge variant="success" size="sm">Verified</Badge>
          </div>
        </div>
        <Link href="/dashboard/business/billing" className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700">
          Upgrade listing <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Listing views" value="1,284" delta="+18% vs last month" icon={Eye} />
        <StatCard label="Investor views" value="342" delta="+42 this week" icon={Users} />
        <StatCard label="Shortlists" value="28" delta="+6" icon={Bookmark} />
        <StatCard label="Intro requests" value="9" delta="+3" icon={FileCheck} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Panel id="performance" title="Listing performance" action={{ label: "Details", href: "#performance" }}>
          <div className="mb-4 flex items-baseline gap-3">
            <span className="font-display text-3xl font-semibold text-ink tnum">1,284</span>
            <span className="text-sm font-medium text-emerald-600">+18% · 28 days</span>
          </div>
          <AreaChart />
        </Panel>

        <Panel title="Raise progress">
          <div className="flex items-center gap-4">
            <ProgressRing value={64} />
            <div>
              <p className="font-medium text-ink">$9.6M of $15M</p>
              <p className="text-sm text-ink/55">Soft-circled across 4 investors.</p>
            </div>
          </div>
          <div className="mt-5 space-y-2 border-t border-ink/[0.06] pt-4 text-sm">
            <div className="flex justify-between"><span className="text-ink/55">Instrument</span><span className="font-medium text-ink">Equity</span></div>
            <div className="flex justify-between"><span className="text-ink/55">Stake offered</span><span className="font-medium text-ink">18%</span></div>
            <div className="flex justify-between"><span className="text-ink/55">Return offer</span><span className="font-medium text-ink">4.0× MOIC</span></div>
          </div>
        </Panel>
      </div>

      <Panel id="scorecard" title="AI business scorecard" action={{ label: "Improve score", href: "/register/business" }}>
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {scores.map((s) => {
            const good = s.higherIsBetter ? s.value >= 70 : s.value <= 45;
            const mid = s.higherIsBetter ? s.value >= 55 : s.value <= 60;
            const tone = good ? "text-emerald-600" : mid ? "text-gold-600" : "text-brand-600";
            return (
              <div key={s.key} className="rounded-2xl border border-ink/[0.06] p-4">
                <p className="text-xs text-ink/50">{s.label}</p>
                <p className={cn("mt-1 font-display text-2xl font-semibold tnum", tone)}>{s.value}</p>
                <p className="mt-1.5 text-[0.7rem] leading-snug text-ink/45">{s.recommendations[0]}</p>
              </div>
            );
          })}
        </div>
      </Panel>

      <Panel id="interest" title="Investor interest" action={{ label: "View all", href: "#interest" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[0.7rem] uppercase tracking-wide text-ink/40">
                <th className="pb-3 font-semibold">Investor</th>
                <th className="pb-3 font-semibold">Type</th>
                <th className="pb-3 font-semibold">Stage</th>
                <th className="pb-3 text-right font-semibold">Ticket</th>
                <th className="pb-3 text-right font-semibold">Match</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/[0.06]">
              {INTEREST.map((r) => (
                <tr key={r.name}>
                  <td className="py-3 font-medium text-ink">{r.name}</td>
                  <td className="py-3 text-ink/60">{r.type}</td>
                  <td className="py-3"><Badge variant="neutral" size="sm">{r.stage}</Badge></td>
                  <td className="py-3 text-right font-medium text-ink tnum">{r.ticket}</td>
                  <td className="py-3 text-right font-medium text-emerald-600 tnum">{r.match}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel id="messages" title="Messages">
          <div className="divide-y divide-ink/[0.06]">
            {[
              { from: "Aurora Family Office", preview: "Reviewed the teaser — can we schedule a call?", time: "1h", unread: true },
              { from: "A&C Deal Team", preview: "Two more mandate-matched investors added to your list.", time: "4h", unread: true },
              { from: "Meridian Growth", preview: "Please share the FY25 audited financials.", time: "1d", unread: false },
            ].map((m) => (
              <div key={m.from} className="flex items-start gap-3 py-3 first:pt-0">
                <span className="grid h-9 w-9 flex-none place-items-center rounded-full bg-paper-2 text-xs font-semibold text-ink/60">
                  {m.from.split(" ").slice(0, 2).map((w) => w[0]).join("")}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate font-medium text-ink">{m.from}</p>
                    <span className="flex items-center gap-2 text-xs text-ink/40">
                      {m.unread && <span className="h-1.5 w-1.5 rounded-full bg-brand-600" />}
                      {m.time}
                    </span>
                  </div>
                  <p className="truncate text-sm text-ink/55">{m.preview}</p>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel id="payments" title="Payments & invoices" action={{ label: "Billing", href: "/dashboard/business/billing" }}>
          <div className="divide-y divide-ink/[0.06]">
            {INVOICES.map((inv) => (
              <div key={inv.id} className="flex items-center gap-3 py-3 first:pt-0">
                <span className="grid h-9 w-9 flex-none place-items-center rounded-xl bg-brand-50 text-brand-600">
                  <Wallet className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-ink">{inv.desc}</p>
                  <p className="text-xs text-ink/50">{inv.id}</p>
                </div>
                <span className="font-medium text-ink tnum">{inv.amount}</span>
                <Badge variant={inv.status === "Paid" ? "success" : "gold"} size="sm">{inv.status}</Badge>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel id="documents" title="Documents & data room" action={{ label: "Manage", href: "#documents" }}>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { name: "Pitch deck v4.pdf", size: "5.2 MB" },
            { name: "Financial model.xlsx", size: "1.1 MB" },
            { name: "Cap table.pdf", size: "320 KB" },
            { name: "FY25 audited financials.pdf", size: "2.8 MB" },
          ].map((d) => (
            <div key={d.name} className="flex items-center gap-3 rounded-2xl border border-ink/[0.06] p-4">
              <span className="grid h-9 w-9 flex-none place-items-center rounded-xl bg-paper-2 text-ink/60">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-ink">{d.name}</p>
                <p className="text-xs text-ink/50">{d.size}</p>
              </div>
              <Download className="h-4 w-4 text-ink/40" />
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
