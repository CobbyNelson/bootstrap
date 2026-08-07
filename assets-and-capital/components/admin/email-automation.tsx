"use client";

import { useState } from "react";
import {
  Mail, Zap, Plus, TrendingUp, MousePointerClick, Send, Eye, Users,
  Clock, CheckCircle2, GitBranch, Play, Pause, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

type FlowStatus = "Active" | "Paused" | "Draft";
type Flow = {
  id: number;
  name: string;
  trigger: string;
  status: FlowStatus;
  steps: number;
  sent: number;
  openRate: number;
  clickRate: number;
};

const FLOWS: Flow[] = [
  { id: 1, name: "Investor onboarding journey", trigger: "Investor completes registration", status: "Active", steps: 5, sent: 3820, openRate: 62, clickRate: 24 },
  { id: 2, name: "Business listing activation", trigger: "Business submits intake", status: "Active", steps: 4, sent: 1240, openRate: 58, clickRate: 19 },
  { id: 3, name: "New deal match alert", trigger: "Match score ≥ 80 for mandate", status: "Active", steps: 2, sent: 9410, openRate: 71, clickRate: 38 },
  { id: 4, name: "Verification reminder", trigger: "KYC incomplete after 48h", status: "Active", steps: 3, sent: 640, openRate: 49, clickRate: 22 },
  { id: 5, name: "Data room re-engagement", trigger: "No activity for 7 days", status: "Paused", steps: 3, sent: 410, openRate: 44, clickRate: 15 },
  { id: 6, name: "Event follow-up sequence", trigger: "Attended a roadshow", status: "Draft", steps: 4, sent: 0, openRate: 0, clickRate: 0 },
];

const STATUS_STYLE: Record<FlowStatus, string> = {
  Active: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  Paused: "bg-amber-50 text-amber-700 ring-amber-100",
  Draft: "bg-ink/[0.05] text-ink/65 ring-ink/10",
};

const JOURNEY = [
  { icon: Zap, label: "Trigger", detail: "Investor completes registration", tone: "brand" },
  { icon: Mail, label: "Welcome email", detail: "Immediately · 62% open", tone: "ink" },
  { icon: Clock, label: "Wait 1 day", detail: "Delay", tone: "muted" },
  { icon: Mail, label: "Complete your mandate", detail: "If mandate empty · 54% open", tone: "ink" },
  { icon: Clock, label: "Wait 3 days", detail: "Delay", tone: "muted" },
  { icon: Mail, label: "Your first 5 matches", detail: "Personalised deals · 68% open", tone: "ink" },
  { icon: CheckCircle2, label: "Goal reached", detail: "Investor views a deal", tone: "emerald" },
];

const TONE: Record<string, string> = {
  brand: "bg-brand-50 text-brand-600 ring-brand-100",
  ink: "bg-ink text-white ring-ink",
  muted: "bg-ink/[0.05] text-ink/60 ring-ink/10",
  emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100",
};

function Metric({ icon: Icon, label, value, delta }: { icon: typeof Mail; label: string; value: string; delta?: string }) {
  return (
    <div className="rounded-2xl border border-ink/[0.07] bg-white p-5">
      <div className="flex items-center justify-between">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-100"><Icon className="h-4 w-4" /></span>
        {delta && <span className="text-xs font-medium text-emerald-700">{delta}</span>}
      </div>
      <p className="mt-4 font-display text-2xl font-semibold text-navy-700 tnum">{value}</p>
      <p className="mt-0.5 text-sm text-ink/65">{label}</p>
    </div>
  );
}

export function EmailAutomation() {
  const [flows, setFlows] = useState(FLOWS);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">Lifecycle marketing</p>
          <h1 className="mt-1 font-display text-2xl font-semibold text-navy-700">Email automation</h1>
          <p className="mt-1 text-sm text-ink/65">Triggered journeys that nurture investors and businesses end-to-end.</p>
        </div>
        <button
          disabled
          title="Flow creation is not built yet."
          className="cursor-not-allowed opacity-40 inline-flex items-center gap-2 rounded-[var(--radius-button)] bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700"><Plus className="h-4 w-4" /> New flow</button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={Send} label="Emails sent (30d)" value="15,560" delta="+12%" />
        <Metric icon={Eye} label="Avg. open rate" value="63.4%" delta="+3.1pt" />
        <Metric icon={MousePointerClick} label="Avg. click rate" value="27.8%" delta="+1.8pt" />
        <Metric icon={Users} label="Active journeys" value="4" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* flows list */}
        <div className="overflow-hidden rounded-2xl border border-ink/[0.07] bg-white">
          <div className="border-b border-ink/[0.06] p-4">
            <h2 className="font-display text-base font-semibold text-navy-700">Automation flows</h2>
          </div>
          <div className="divide-y divide-ink/[0.04]">
            {flows.map((f) => (
              <div key={f.id} className="flex items-center gap-4 px-4 py-4 hover:bg-paper-2/30">
                <span className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-100"><GitBranch className="h-5 w-5" /></span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium text-ink">{f.name}</p>
                    <span className={cn("rounded-full px-2 py-0.5 text-[0.65rem] font-medium ring-1", STATUS_STYLE[f.status])}>{f.status}</span>
                  </div>
                  <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-ink/65"><Zap className="h-3 w-3" /> {f.trigger} · {f.steps} steps</p>
                </div>
                <div className="hidden text-right md:block">
                  <p className="text-sm font-medium text-ink tnum">{f.sent.toLocaleString()}</p>
                  <p className="text-[0.7rem] text-ink/60">sent</p>
                </div>
                <div className="hidden w-28 text-right lg:block">
                  <p className="text-xs text-ink/60"><span className="font-medium text-ink tnum">{f.openRate}%</span> open</p>
                  <p className="text-xs text-ink/60"><span className="font-medium text-ink tnum">{f.clickRate}%</span> click</p>
                </div>
                {f.status !== "Draft" && (
                  <button
                    onClick={() => setFlows((prev) => prev.map((x) => x.id === f.id ? { ...x, status: x.status === "Active" ? "Paused" : "Active" } : x))}
                    className="grid h-9 w-9 flex-none place-items-center rounded-[var(--radius-button)] border border-ink/12 text-ink/60 hover:bg-paper-2"
                    aria-label={f.status === "Active" ? "Pause" : "Activate"}
                  >
                    {f.status === "Active" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* journey preview */}
        <div className="rounded-3xl border border-ink/[0.07] bg-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-semibold text-navy-700">Investor onboarding</h2>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700"><TrendingUp className="h-3.5 w-3.5" /> 24% goal</span>
          </div>
          <ol className="mt-5 relative space-y-4 border-l border-ink/[0.08] pl-6">
            {JOURNEY.map((s, i) => (
              <li key={i} className="relative">
                <span className={cn("absolute -left-[2.1rem] grid h-7 w-7 place-items-center rounded-[var(--radius-button)] ring-4 ring-white", TONE[s.tone])}>
                  <s.icon className="h-3.5 w-3.5" />
                </span>
                <p className="text-sm font-medium text-ink">{s.label}</p>
                <p className="text-xs text-ink/65">{s.detail}</p>
              </li>
            ))}
          </ol>
          <button
            disabled
            title="The flow builder is not built yet."
            className="mt-5 inline-flex w-full cursor-not-allowed items-center justify-center gap-1 opacity-40 rounded-[var(--radius-button)] border border-ink/12 py-2.5 text-sm font-medium text-ink/70 hover:bg-paper-2">Open flow builder <ChevronRight className="h-4 w-4" /></button>
        </div>
      </div>
    </div>
  );
}
