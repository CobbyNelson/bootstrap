"use client";

import { useMemo, useState } from "react";
import {
  Search, Plus, Star, Building2,
  Clock, CheckCircle2, Circle, Filter, LayoutGrid, Rows3, ArrowUpRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Stage = "Lead" | "Qualified" | "Engaged" | "Diligence" | "Committed";
type Contact = {
  id: number;
  name: string;
  title: string;
  org: string;
  type: "Investor" | "Business" | "Advisor";
  stage: Stage;
  email: string;
  phone: string;
  value: string;
  owner: string;
  starred?: boolean;
  lastTouch: string;
  tags: string[];
};

const STAGES: Stage[] = ["Lead", "Qualified", "Engaged", "Diligence", "Committed"];

const STAGE_STYLE: Record<Stage, string> = {
  Lead: "bg-ink/[0.06] text-ink/60",
  Qualified: "bg-sky-50 text-sky-700",
  Engaged: "bg-amber-50 text-amber-700",
  Diligence: "bg-violet-50 text-violet-700",
  Committed: "bg-emerald-50 text-emerald-700",
};

const CONTACTS: Contact[] = [
  { id: 1, name: "David Mensah", title: "CEO", org: "Accra FinPay", type: "Business", stage: "Diligence", email: "david@accrafinpay.com", phone: "+233 20 555 0110", value: "$4.5M raise", owner: "You", starred: true, lastTouch: "2h ago", tags: ["Payments", "Series A"] },
  { id: 2, name: "Aurora Family Office", title: "Investment Committee", org: "Aurora Capital", type: "Investor", stage: "Committed", email: "ic@auroracap.com", phone: "+44 20 7946 0300", value: "$12M mandate", owner: "You", starred: true, lastTouch: "1d ago", tags: ["PE", "Growth"] },
  { id: 3, name: "Cedar Ridge IR", title: "Investor Relations", org: "Cedar Ridge Partners", type: "Investor", stage: "Engaged", email: "ir@cedarridge.com", phone: "+1 415 555 0142", value: "$8M ticket", owner: "R. Osei", lastTouch: "4h ago", tags: ["Fund IV", "Buyout"] },
  { id: 4, name: "Zainab Bello", title: "Founder", org: "Lagos AgriTech", type: "Business", stage: "Qualified", email: "zainab@lagosagri.com", phone: "+234 80 5550 0198", value: "$2.1M raise", owner: "You", lastTouch: "3d ago", tags: ["AgriTech", "Seed"] },
  { id: 5, name: "Marcus Lindqvist", title: "Advisory Partner", org: "Nordstar Advisory", type: "Advisor", stage: "Engaged", email: "marcus@nordstar.com", phone: "+46 8 555 0177", value: "Co-advisor", owner: "R. Osei", lastTouch: "6h ago", tags: ["M&A", "IC memo"] },
  { id: 6, name: "Kwame Asante", title: "CFO", org: "Kumasi Logistics", type: "Business", stage: "Lead", email: "kwame@kumasilog.com", phone: "+233 24 555 0163", value: "$3.0M raise", owner: "You", lastTouch: "1w ago", tags: ["Logistics"] },
  { id: 7, name: "Meridian Pension Fund", title: "Head of Alternatives", org: "Meridian Pensions", type: "Investor", stage: "Qualified", email: "alts@meridianpf.com", phone: "+27 11 555 0121", value: "$20M mandate", owner: "R. Osei", lastTouch: "2d ago", tags: ["Institutional", "LP"] },
  { id: 8, name: "Nadia Okonkwo", title: "Managing Director", org: "Sahel Ventures", type: "Investor", stage: "Diligence", email: "nadia@sahelvc.com", phone: "+221 33 555 0154", value: "$6M ticket", owner: "You", starred: false, lastTouch: "5h ago", tags: ["VC", "Fintech"] },
];

type Task = { id: number; label: string; who: string; due: string; done: boolean; priority: "High" | "Medium" | "Low" };
const TASKS: Task[] = [
  { id: 1, label: "Send Fund IV data room access to Cedar Ridge", who: "Cedar Ridge IR", due: "Today", done: false, priority: "High" },
  { id: 2, label: "Follow up on Accra FinPay audited financials", who: "David Mensah", due: "Today", done: false, priority: "High" },
  { id: 3, label: "Schedule IC review with Aurora", who: "Aurora Family Office", due: "Tomorrow", done: false, priority: "Medium" },
  { id: 4, label: "Draft NDA for Sahel Ventures", who: "Nadia Okonkwo", due: "Thu", done: true, priority: "Medium" },
  { id: 5, label: "Prep teaser for Kumasi Logistics", who: "Kwame Asante", due: "Fri", done: false, priority: "Low" },
];

type Activity = { id: number; who: string; action: string; detail: string; time: string; kind: "message" | "meeting" | "doc" | "stage" | "note" };
const ACTIVITY: Activity[] = [
  { id: 1, who: "David Mensah", action: "moved to", detail: "Diligence", time: "2h ago", kind: "stage" },
  { id: 2, who: "Cedar Ridge IR", action: "shared", detail: "Fund IV data room", time: "4h ago", kind: "doc" },
  { id: 3, who: "Nadia Okonkwo", action: "booked a call", detail: "Thu 3:00pm GMT", time: "5h ago", kind: "meeting" },
  { id: 4, who: "Aurora Family Office", action: "signed", detail: "Term sheet", time: "1d ago", kind: "doc" },
  { id: 5, who: "You", action: "left a note on", detail: "Lagos AgriTech", time: "1d ago", kind: "note" },
  { id: 6, who: "R. Osei", action: "emailed", detail: "Meridian Pension Fund", time: "2d ago", kind: "message" },
];

const SAVED_VIEWS = ["All contacts", "My pipeline", "Hot investors", "Businesses in diligence", "Advisors"];
const TYPES = ["All", "Investor", "Business", "Advisor"] as const;

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("");
}

export function CRM() {
  const [view, setView] = useState<"table" | "board">("table");
  const [type, setType] = useState<(typeof TYPES)[number]>("All");
  const [query, setQuery] = useState("");
  const [savedView, setSavedView] = useState("All contacts");
  const [tasks, setTasks] = useState(TASKS);

  const filtered = useMemo(() => {
    return CONTACTS.filter((c) => {
      if (type !== "All" && c.type !== type) return false;
      if (query && !`${c.name} ${c.org} ${c.tags.join(" ")}`.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [type, query]);

  const openTasks = tasks.filter((t) => !t.done).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">Relationship manager</p>
          <h1 className="mt-1 font-display text-2xl font-semibold text-navy-700">CRM &amp; pipeline</h1>
          <p className="mt-1 text-sm text-ink/65">{CONTACTS.length} relationships · {openTasks} open tasks · $61.7M in tracked value</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-[var(--radius-button)] bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700">
          <Plus className="h-4 w-4" /> Add contact
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-4">
          {/* toolbar */}
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-ink/[0.07] bg-white p-3">
            <div className="flex min-w-[200px] flex-1 items-center gap-2 rounded-[var(--radius-button)] bg-paper-2 px-3.5">
              <Search className="h-4 w-4 text-ink/60" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search relationships…" className="h-9 w-full bg-transparent text-sm text-ink placeholder:text-ink/60 focus:outline-none" />
            </div>
            <div className="flex items-center gap-1 rounded-[var(--radius-button)] bg-paper-2 p-1">
              {TYPES.map((t) => (
                <button key={t} onClick={() => setType(t)} className={cn("rounded-[var(--radius-button)] px-3 py-1.5 text-xs font-medium transition-colors", type === t ? "bg-white text-ink shadow-sm" : "text-ink/65 hover:text-ink")}>{t}</button>
              ))}
            </div>
            <div className="flex items-center gap-1 rounded-[var(--radius-button)] border border-ink/10 p-1">
              <button onClick={() => setView("table")} className={cn("grid h-8 w-8 place-items-center rounded-[var(--radius-button)]", view === "table" ? "bg-ink text-white" : "text-ink/65 hover:text-ink")} aria-label="Table view"><Rows3 className="h-4 w-4" /></button>
              <button onClick={() => setView("board")} className={cn("grid h-8 w-8 place-items-center rounded-[var(--radius-button)]", view === "board" ? "bg-ink text-white" : "text-ink/65 hover:text-ink")} aria-label="Board view"><LayoutGrid className="h-4 w-4" /></button>
            </div>
          </div>

          {view === "table" ? (
            <div className="overflow-hidden rounded-2xl border border-ink/[0.07] bg-white">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-ink/[0.06] text-left text-[0.7rem] uppercase tracking-wider text-ink/60">
                    <th className="px-4 py-3 font-medium">Contact</th>
                    <th className="hidden px-4 py-3 font-medium md:table-cell">Stage</th>
                    <th className="hidden px-4 py-3 font-medium lg:table-cell">Value</th>
                    <th className="hidden px-4 py-3 font-medium xl:table-cell">Owner</th>
                    <th className="px-4 py-3 font-medium text-right">Last touch</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => (
                    <tr key={c.id} className="group border-b border-ink/[0.04] last:border-0 hover:bg-paper-2/40">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="grid h-9 w-9 flex-none place-items-center rounded-[var(--radius-button)] bg-gradient-to-br from-ink to-ink-2 text-[0.7rem] font-semibold text-white">{initials(c.name)}</span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              {c.starred && <Star className="h-3 w-3 flex-none fill-navy-500 text-navy-500" />}
                              <p className="truncate font-medium text-ink">{c.name}</p>
                            </div>
                            <p className="flex items-center gap-1 truncate text-xs text-ink/65"><Building2 className="h-3 w-3" /> {c.title} · {c.org}</p>
                          </div>
                        </div>
                      </td>
                      <td className="hidden px-4 py-3 md:table-cell"><span className={cn("rounded-[var(--radius-button)] px-2.5 py-1 text-xs font-medium", STAGE_STYLE[c.stage])}>{c.stage}</span></td>
                      <td className="hidden px-4 py-3 text-ink/70 lg:table-cell tnum">{c.value}</td>
                      <td className="hidden px-4 py-3 text-ink/60 xl:table-cell">{c.owner}</td>
                      <td className="px-4 py-3 text-right text-xs text-ink/60">{c.lastTouch}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid gap-3 overflow-x-auto pb-2 sm:grid-cols-2 xl:grid-cols-5 xl:gap-3">
              {STAGES.map((stage) => {
                const items = filtered.filter((c) => c.stage === stage);
                return (
                  <div key={stage} className="min-w-[220px] rounded-2xl bg-paper-2/60 p-2.5">
                    <div className="mb-2 flex items-center justify-between px-1.5 py-1">
                      <span className={cn("rounded-[var(--radius-button)] px-2 py-0.5 text-xs font-medium", STAGE_STYLE[stage])}>{stage}</span>
                      <span className="text-xs text-ink/60 tnum">{items.length}</span>
                    </div>
                    <div className="space-y-2">
                      {items.map((c) => (
                        <div key={c.id} className="rounded-xl border border-ink/[0.06] bg-white p-3">
                          <div className="flex items-center gap-2">
                            <span className="grid h-7 w-7 flex-none place-items-center rounded-[var(--radius-button)] bg-gradient-to-br from-ink to-ink-2 text-[0.6rem] font-semibold text-white">{initials(c.name)}</span>
                            <p className="truncate text-sm font-medium text-ink">{c.name}</p>
                          </div>
                          <p className="mt-1.5 truncate text-xs text-ink/65">{c.org}</p>
                          <p className="mt-1 text-xs font-medium text-ink/70 tnum">{c.value}</p>
                        </div>
                      ))}
                      {items.length === 0 && <p className="px-1.5 py-3 text-xs text-ink/30">No contacts</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* right rail */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-ink/[0.07] bg-white p-4">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-ink/60"><Filter className="h-3.5 w-3.5" /> Saved views</p>
            <div className="space-y-0.5">
              {SAVED_VIEWS.map((v) => (
                <button key={v} onClick={() => setSavedView(v)} className={cn("block w-full rounded-lg px-2.5 py-2 text-left text-sm transition-colors", savedView === v ? "bg-brand-50 font-medium text-brand-700" : "text-ink/60 hover:bg-paper-2")}>{v}</button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-ink/[0.07] bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-ink/60">Tasks</p>
              <span className="rounded-[var(--radius-button)] bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700 tnum">{openTasks} open</span>
            </div>
            <div className="space-y-1">
              {tasks.map((t) => (
                <button key={t.id} onClick={() => setTasks((prev) => prev.map((x) => x.id === t.id ? { ...x, done: !x.done } : x))} className="flex w-full items-start gap-2.5 rounded-lg px-1.5 py-2 text-left hover:bg-paper-2">
                  {t.done ? <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-emerald-500" /> : <Circle className="mt-0.5 h-4 w-4 flex-none text-ink/25" />}
                  <span className="min-w-0 flex-1">
                    <span className={cn("block text-sm leading-snug", t.done ? "text-ink/35 line-through" : "text-ink/75")}>{t.label}</span>
                    <span className="mt-0.5 flex items-center gap-1.5 text-[0.7rem] text-ink/60">
                      <Clock className="h-3 w-3" /> {t.due}
                      <span className={cn("rounded px-1 font-medium", t.priority === "High" ? "text-brand-600" : t.priority === "Medium" ? "text-amber-600" : "text-ink/60")}>{t.priority}</span>
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-ink/[0.07] bg-white p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink/60">Activity</p>
            <ol className="relative space-y-4 border-l border-ink/[0.08] pl-4">
              {ACTIVITY.map((a) => (
                <li key={a.id} className="relative">
                  <span className="absolute -left-[1.36rem] top-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-brand-500" />
                  <p className="text-sm leading-snug text-ink/75">
                    <span className="font-medium text-ink">{a.who}</span> {a.action} <span className="font-medium text-ink">{a.detail}</span>
                  </p>
                  <p className="mt-0.5 text-[0.7rem] text-ink/60">{a.time}</p>
                </li>
              ))}
            </ol>
            <button className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:text-brand-800">View full timeline <ArrowUpRight className="h-3.5 w-3.5" /></button>
          </div>
        </div>
      </div>
    </div>
  );
}
