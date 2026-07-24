"use client";

import { useMemo, useState } from "react";
import { Columns3, TableProperties, TrendingUp, Clock, Target, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

type Stage = { key: string; label: string; color: string; prob: number };
const STAGES: Stage[] = [
  { key: "discovery", label: "Discovery", color: "#8B96A9", prob: 0.05 },
  { key: "shortlisted", label: "Shortlisted", color: "#8B96A9", prob: 0.1 },
  { key: "contacted", label: "Contacted", color: "#7c8aa0", prob: 0.15 },
  { key: "meeting", label: "Meeting Scheduled", color: "#c2a04a", prob: 0.25 },
  { key: "nda", label: "NDA Signed", color: "#c2a04a", prob: 0.35 },
  { key: "docs", label: "Documents Shared", color: "#b8863b", prob: 0.45 },
  { key: "dd", label: "Due Diligence", color: "#b91c1c", prob: 0.55 },
  { key: "negotiation", label: "Negotiation", color: "#b91c1c", prob: 0.7 },
  { key: "approved", label: "Investment Approved", color: "#991b1b", prob: 0.85 },
  { key: "legal", label: "Legal Documentation", color: "#7f1d1d", prob: 0.9 },
  { key: "funding", label: "Funding", color: "#2f6f52", prob: 0.95 },
  { key: "completed", label: "Completed", color: "#24b47e", prob: 1 },
  { key: "cancelled", label: "Cancelled", color: "#94a3b8", prob: 0 },
  { key: "lost", label: "Lost", color: "#e5484d", prob: 0 },
];

type Deal = { name: string; sector: string; ticketM: number; score: number; owner: string; days: number; stage: string };
const DEALS: Deal[] = [
  { name: "Sahara Solar Grid", sector: "Renewable Energy", ticketM: 18, score: 98, owner: "DW", days: 4, stage: "dd" },
  { name: "Nile Digital Bank", sector: "FinTech", ticketM: 25, score: 96, owner: "PR", days: 9, stage: "negotiation" },
  { name: "Accra FinPay", sector: "FinTech", ticketM: 15, score: 96, owner: "DW", days: 2, stage: "nda" },
  { name: "Lagos HealthTech", sector: "Digital Health", ticketM: 8, score: 90, owner: "ML", days: 6, stage: "docs" },
  { name: "Atlas Logistics", sector: "Transport", ticketM: 32, score: 86, owner: "DW", days: 12, stage: "dd" },
  { name: "Coastal Wind Partners", sector: "Renewable Energy", ticketM: 48, score: 91, owner: "PR", days: 3, stage: "meeting" },
  { name: "Cape Wine Estates", sector: "Food & Bev", ticketM: 12, score: 82, owner: "ML", days: 1, stage: "shortlisted" },
  { name: "Rift Valley AgriTech", sector: "Agriculture", ticketM: 6, score: 91, owner: "DW", days: 5, stage: "contacted" },
  { name: "Serengeti MedSupply", sector: "Healthcare", ticketM: 9, score: 91, owner: "PR", days: 2, stage: "discovery" },
  { name: "Kalahari Copper JV", sector: "Natural Resources", ticketM: 60, score: 74, owner: "ML", days: 20, stage: "approved" },
  { name: "Dakar Logistics Park", sector: "Infrastructure", ticketM: 40, score: 71, owner: "DW", days: 8, stage: "legal" },
  { name: "Nairobi Fibre", sector: "Infrastructure", ticketM: 22, score: 84, owner: "PR", days: 14, stage: "funding" },
  { name: "Coastal Credit Fund", sector: "Private Credit", ticketM: 50, score: 88, owner: "DW", days: 30, stage: "completed" },
  { name: "Granite Buyout II", sector: "Buyout", ticketM: 45, score: 81, owner: "ML", days: 18, stage: "completed" },
  { name: "Meridian RealEstate", sector: "Real Estate", ticketM: 20, score: 61, owner: "PR", days: 7, stage: "discovery" },
  { name: "Solaris Venture V", sector: "Venture", ticketM: 12, score: 60, owner: "DW", days: 4, stage: "shortlisted" },
  { name: "Delta Textiles", sector: "Industrials", ticketM: 14, score: 55, owner: "ML", days: 22, stage: "lost" },
  { name: "Highland Dairy", sector: "Agriculture", ticketM: 10, score: 58, owner: "PR", days: 16, stage: "cancelled" },
];

function money(m: number) {
  return `$${m}M`;
}

export function DealPipeline() {
  const [view, setView] = useState<"kanban" | "table">("kanban");

  const analytics = useMemo(() => {
    const active = DEALS.filter((d) => !["completed", "cancelled", "lost"].includes(d.stage));
    const totalValue = active.reduce((s, d) => s + d.ticketM, 0);
    const expected = DEALS.reduce((s, d) => {
      const st = STAGES.find((x) => x.key === d.stage);
      return s + d.ticketM * (st?.prob ?? 0);
    }, 0);
    const completed = DEALS.filter((d) => d.stage === "completed").length;
    const resolved = DEALS.filter((d) => ["completed", "lost", "cancelled"].includes(d.stage)).length;
    const conv = resolved ? Math.round((completed / resolved) * 100) : 0;
    const avgDays = Math.round(DEALS.reduce((s, d) => s + d.days, 0) / DEALS.length);
    return { activeCount: active.length, totalValue, expected: Math.round(expected), conv, avgDays };
  }, []);

  const kpis = [
    { label: "Weighted pipeline", value: money(analytics.totalValue), icon: DollarSign, sub: `${analytics.activeCount} active deals` },
    { label: "Expected revenue", value: money(analytics.expected), icon: TrendingUp, sub: "probability-weighted" },
    { label: "Conversion rate", value: `${analytics.conv}%`, icon: Target, sub: "completed vs resolved" },
    { label: "Avg. deal age", value: `${analytics.avgDays}d`, icon: Clock, sub: "across pipeline" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-ink/50">Workspace</p>
          <h1 className="mt-1 font-display text-3xl font-semibold text-ink">Deal pipeline</h1>
        </div>
        <div className="inline-flex rounded-full border border-ink/10 bg-white p-1">
          {[
            { k: "kanban", label: "Board", icon: Columns3 },
            { k: "table", label: "Table", icon: TableProperties },
          ].map((v) => (
            <button
              key={v.k}
              onClick={() => setView(v.k as "kanban" | "table")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                view === v.k ? "bg-ink text-white" : "text-ink/60 hover:text-ink"
              )}
            >
              <v.icon className="h-4 w-4" /> {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* analytics */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-2xl border border-ink/[0.07] bg-white p-5">
            <div className="flex items-center justify-between">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
                <k.icon className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-4 font-display text-2xl font-semibold text-ink tnum">{k.value}</p>
            <p className="mt-1 text-sm text-ink/55">{k.label}</p>
            <p className="text-xs text-ink/40">{k.sub}</p>
          </div>
        ))}
      </div>

      {view === "kanban" ? (
        <div className="flex gap-3 overflow-x-auto pb-4">
          {STAGES.map((stage) => {
            const deals = DEALS.filter((d) => d.stage === stage.key);
            const value = deals.reduce((s, d) => s + d.ticketM, 0);
            return (
              <div key={stage.key} className="flex w-[236px] flex-none flex-col rounded-2xl border border-ink/[0.07] bg-white">
                <div className="flex items-center gap-2 border-b border-ink/[0.06] p-3">
                  <span className="h-3 w-1 rounded-full" style={{ background: stage.color }} />
                  <span className="text-[0.8rem] font-semibold text-ink">{stage.label}</span>
                  <span className="ml-auto rounded-full bg-paper-2 px-2 py-0.5 text-[0.65rem] font-medium text-ink/50 tnum">{deals.length}</span>
                </div>
                <div className="flex flex-col gap-2 p-2.5">
                  {value > 0 && <p className="px-1 text-[0.65rem] font-medium uppercase tracking-wide text-ink/35 tnum">{money(value)}</p>}
                  {deals.map((d) => (
                    <div key={d.name} className="rounded-xl border border-ink/[0.06] bg-paper-2/40 p-3 transition-colors hover:border-ink/15">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-[0.8rem] font-medium leading-snug text-ink">{d.name}</p>
                        <span className={cn("text-[0.65rem] font-semibold tnum", d.score >= 90 ? "text-emerald-600" : d.score >= 75 ? "text-brand-600" : "text-navy-600")}>{d.score}</span>
                      </div>
                      <p className="mt-0.5 text-[0.68rem] text-ink/45">{d.sector}</p>
                      <div className="mt-2.5 flex items-center justify-between">
                        <span className="font-mono text-[0.72rem] font-medium text-ink tnum">{money(d.ticketM)}</span>
                        <span className="flex items-center gap-1.5 text-[0.65rem] text-ink/40">
                          {d.days}d
                          <span className="grid h-5 w-5 place-items-center rounded-full bg-gradient-to-br from-ink to-ink-2 text-[0.55rem] font-semibold text-white">{d.owner}</span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-ink/[0.07] bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[0.7rem] uppercase tracking-wide text-ink/40">
                <th className="px-5 py-3 font-semibold">Deal</th>
                <th className="px-5 py-3 font-semibold">Sector</th>
                <th className="px-5 py-3 font-semibold">Stage</th>
                <th className="px-5 py-3 text-right font-semibold">Ticket</th>
                <th className="px-5 py-3 text-right font-semibold">Match</th>
                <th className="px-5 py-3 text-right font-semibold">Age</th>
                <th className="px-5 py-3">Owner</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/[0.06]">
              {DEALS.map((d) => {
                const st = STAGES.find((s) => s.key === d.stage)!;
                return (
                  <tr key={d.name} className="hover:bg-paper-2/40">
                    <td className="px-5 py-3 font-medium text-ink">{d.name}</td>
                    <td className="px-5 py-3 text-ink/60">{d.sector}</td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-ink/70">
                        <span className="h-2 w-2 rounded-full" style={{ background: st.color }} /> {st.label}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right font-medium text-ink tnum">{money(d.ticketM)}</td>
                    <td className="px-5 py-3 text-right font-medium text-emerald-600 tnum">{d.score}</td>
                    <td className="px-5 py-3 text-right text-ink/60 tnum">{d.days}d</td>
                    <td className="px-5 py-3">
                      <span className="grid h-6 w-6 place-items-center rounded-full bg-gradient-to-br from-ink to-ink-2 text-[0.6rem] font-semibold text-white">{d.owner}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
