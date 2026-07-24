import type { Metadata } from "next";
import Link from "next/link";
import { Target, Bookmark, Eye, Presentation, FileText, Download, ArrowRight } from "lucide-react";
import { FEATURED_OPPORTUNITIES } from "@/lib/content";
import { OpportunityCard } from "@/components/ui/opportunity-card";
import { Badge } from "@/components/ui/badge";
import { StatCard, Panel, ProgressRing } from "@/components/dashboard/widgets";

export const metadata: Metadata = { title: "Investor Dashboard" };

const SAVED = [
  { name: "Cape Wine Estates", sector: "Food & Beverage", ask: "$12M", match: 82 },
  { name: "Coastal Wind Partners", sector: "Renewable Energy", ask: "$48M", match: 85 },
  { name: "Nile Digital Bank", sector: "FinTech", ask: "$25M", match: 91 },
];
const MESSAGES = [
  { from: "Sahara Solar Grid", preview: "Thanks for your interest — sharing the data room access now.", time: "2h", unread: true },
  { from: "A&C Deal Team", preview: "Your roadshow in Nairobi is confirmed for 18 Sep.", time: "5h", unread: true },
  { from: "Lagos HealthTech", preview: "Happy to walk you through the unit economics this week.", time: "1d", unread: false },
];
const DOCS = [
  { name: "Sahara Solar Grid — Teaser.pdf", size: "2.4 MB", date: "Jul 21" },
  { name: "Lagos HealthTech — Financials.xlsx", size: "840 KB", date: "Jul 20" },
  { name: "NDA — Atlas Logistics.pdf", size: "180 KB", date: "Jul 18" },
];

export default function InvestorDashboard() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-ink/50">Investor workspace</p>
          <h1 className="mt-1 font-display text-3xl font-semibold text-ink">Welcome back, Aurora</h1>
        </div>
        <Link href="/marketplace" className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700">
          Browse marketplace <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="New mandate matches" value="9" delta="+3 this week" icon={Target} />
        <StatCard label="Saved opportunities" value="12" delta="+2" icon={Bookmark} />
        <StatCard label="Recently viewed" value="34" delta="7 today" trend="flat" icon={Eye} />
        <StatCard label="Upcoming roadshows" value="2" delta="Nairobi · London" trend="flat" icon={Presentation} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* matches */}
        <Panel id="matches" title="Recommended for your mandate" action={{ label: "See all", href: "/marketplace" }}>
          <div className="grid gap-5 sm:grid-cols-2">
            {FEATURED_OPPORTUNITIES.slice(0, 2).map((o) => (
              <OpportunityCard key={o.name} o={o} />
            ))}
          </div>
        </Panel>

        {/* profile completion */}
        <Panel title="Mandate profile">
          <div className="flex items-center gap-4">
            <ProgressRing value={82} />
            <div>
              <p className="font-medium text-ink">82% complete</p>
              <p className="text-sm text-ink/55">Add exit preferences and governance to sharpen your matches.</p>
            </div>
          </div>
          <Link href="/register/investor" className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full border border-ink/12 py-2.5 text-sm font-medium text-ink hover:border-ink/25">
            Complete profile
          </Link>
          <div className="mt-5 space-y-2 border-t border-ink/[0.06] pt-4 text-sm">
            <div className="flex justify-between"><span className="text-ink/55">Strategy</span><span className="font-medium text-ink">Private Equity</span></div>
            <div className="flex justify-between"><span className="text-ink/55">Ticket band</span><span className="font-medium text-ink">$10–40M</span></div>
            <div className="flex justify-between"><span className="text-ink/55">Markets</span><span className="font-medium text-ink">Sub-Saharan Africa</span></div>
          </div>
        </Panel>
      </div>

      {/* saved */}
      <Panel id="saved" title="Saved & watchlist" action={{ label: "View all", href: "/marketplace" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[0.7rem] uppercase tracking-wide text-ink/40">
                <th className="pb-3 font-semibold">Opportunity</th>
                <th className="pb-3 font-semibold">Sector</th>
                <th className="pb-3 text-right font-semibold">Ask</th>
                <th className="pb-3 text-right font-semibold">Match</th>
                <th className="pb-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/[0.06]">
              {SAVED.map((s) => (
                <tr key={s.name}>
                  <td className="py-3 font-medium text-ink">{s.name}</td>
                  <td className="py-3 text-ink/60">{s.sector}</td>
                  <td className="py-3 text-right font-medium text-ink tnum">{s.ask}</td>
                  <td className="py-3 text-right"><span className="font-medium text-emerald-600 tnum">{s.match}%</span></td>
                  <td className="py-3 text-right">
                    <Link href="/marketplace" className="text-sm font-medium text-brand-600 hover:text-brand-700">View</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* messages */}
        <Panel id="messages" title="Messages" action={{ label: "Inbox", href: "#messages" }}>
          <div className="divide-y divide-ink/[0.06]">
            {MESSAGES.map((m) => (
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

        {/* documents */}
        <Panel id="documents" title="Document vault" action={{ label: "All files", href: "#documents" }}>
          <div className="divide-y divide-ink/[0.06]">
            {DOCS.map((d) => (
              <div key={d.name} className="flex items-center gap-3 py-3 first:pt-0">
                <span className="grid h-9 w-9 flex-none place-items-center rounded-xl bg-brand-50 text-brand-600">
                  <FileText className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-ink">{d.name}</p>
                  <p className="text-xs text-ink/50">{d.size} · {d.date}</p>
                </div>
                <button className="grid h-8 w-8 place-items-center rounded-full text-ink/40 hover:bg-paper-2 hover:text-ink" aria-label="Download">
                  <Download className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* roadshows */}
      <Panel id="roadshows" title="Upcoming roadshows" action={{ label: "All events", href: "/events" }}>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { title: "East Africa Capital Roadshow", loc: "Nairobi, Kenya", date: "18 Sep 2026", day: "18", month: "SEP" },
            { title: "Global Investor Forum", loc: "London, UK", date: "02 Oct 2026", day: "02", month: "OCT" },
          ].map((ev) => (
            <div key={ev.title} className="flex items-center gap-4 rounded-2xl border border-ink/[0.06] p-4">
              <div className="grid h-14 w-14 flex-none place-items-center rounded-xl bg-brand-600 text-white">
                <span className="font-display text-xl font-semibold leading-none tnum">{ev.day}</span>
                <span className="text-[0.55rem] font-semibold uppercase tracking-widest">{ev.month}</span>
              </div>
              <div>
                <Badge variant="gold" size="sm">Roadshow</Badge>
                <p className="mt-1.5 font-medium text-ink">{ev.title}</p>
                <p className="text-xs text-ink/50">{ev.loc} · {ev.date}</p>
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
