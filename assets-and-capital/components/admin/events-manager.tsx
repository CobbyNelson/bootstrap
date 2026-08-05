"use client";

import { useState } from "react";
import {
  Calendar, MapPin, Users, Ticket, QrCode, Plus, TrendingUp, CheckCircle2,
  Globe, DollarSign, ArrowUpRight, Search,
} from "lucide-react";
import { cn } from "@/lib/utils";

type EventStatus = "Live" | "Upcoming" | "Draft" | "Closed";
type Ev = {
  id: number;
  title: string;
  type: "Roadshow" | "Demo Day" | "Webinar" | "Summit";
  date: string;
  city: string;
  mode: "In-person" | "Virtual" | "Hybrid";
  status: EventStatus;
  registered: number;
  capacity: number;
  checkedIn: number;
  revenue: string;
};

const STATUS_STYLE: Record<EventStatus, string> = {
  Live: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  Upcoming: "bg-sky-50 text-sky-700 ring-sky-100",
  Draft: "bg-ink/[0.05] text-ink/65 ring-ink/10",
  Closed: "bg-ink/[0.05] text-ink/60 ring-ink/10",
};

const EVENTS: Ev[] = [
  { id: 1, title: "Lagos Capital Summit 2026", type: "Summit", date: "24 Jul 2026", city: "Lagos, NG", mode: "Hybrid", status: "Live", registered: 412, capacity: 500, checkedIn: 287, revenue: "$61,800" },
  { id: 2, title: "Nairobi Investor Roadshow", type: "Roadshow", date: "31 Jul 2026", city: "Nairobi, KE", mode: "In-person", status: "Upcoming", registered: 168, capacity: 200, checkedIn: 0, revenue: "$25,200" },
  { id: 3, title: "Fintech Demo Day — Q3", type: "Demo Day", date: "14 Aug 2026", city: "Virtual", mode: "Virtual", status: "Upcoming", registered: 934, capacity: 2000, checkedIn: 0, revenue: "$0" },
  { id: 4, title: "Family Office Masterclass", type: "Webinar", date: "22 Aug 2026", city: "Virtual", mode: "Virtual", status: "Draft", registered: 0, capacity: 300, checkedIn: 0, revenue: "$0" },
  { id: 5, title: "Accra Growth Capital Forum", type: "Summit", date: "12 Jun 2026", city: "Accra, GH", mode: "Hybrid", status: "Closed", registered: 386, capacity: 400, checkedIn: 351, revenue: "$57,900" },
];

const REGISTRANTS = [
  { name: "David Mensah", org: "Accra FinPay", tier: "VIP", checkedIn: true, time: "09:12" },
  { name: "Aurora Family Office", org: "Aurora Capital", tier: "Investor", checkedIn: true, time: "09:20" },
  { name: "Nadia Okonkwo", org: "Sahel Ventures", tier: "Investor", checkedIn: true, time: "09:31" },
  { name: "Marcus Lindqvist", org: "Nordstar Advisory", tier: "Speaker", checkedIn: true, time: "08:45" },
  { name: "Zainab Bello", org: "Lagos AgriTech", tier: "General", checkedIn: false, time: "—" },
  { name: "Kwame Asante", org: "Kumasi Logistics", tier: "General", checkedIn: false, time: "—" },
];

const TIER_STYLE: Record<string, string> = {
  VIP: "bg-navy-100 text-navy-700",
  Investor: "bg-brand-50 text-brand-700",
  Speaker: "bg-violet-50 text-violet-700",
  General: "bg-ink/[0.05] text-ink/65",
};

function Stat({ icon: Icon, label, value, sub }: { icon: typeof Users; label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-ink/[0.07] bg-white p-5">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-100"><Icon className="h-4 w-4" /></span>
      <p className="mt-4 font-display text-2xl font-semibold text-navy-700 tnum">{value}</p>
      <p className="mt-0.5 text-sm text-ink/65">{label}</p>
      {sub && <p className="mt-1 text-xs font-medium text-emerald-700">{sub}</p>}
    </div>
  );
}

export function EventsManager() {
  const [activeId, setActiveId] = useState(1);
  const active = EVENTS.find((e) => e.id === activeId)!;
  const [registrants, setRegistrants] = useState(REGISTRANTS);
  const checkedIn = registrants.filter((r) => r.checkedIn).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">Roadshows &amp; events</p>
          <h1 className="mt-1 font-display text-2xl font-semibold text-navy-700">Event management</h1>
          <p className="mt-1 text-sm text-ink/65">Registration, ticketing, QR check-in and live attendance.</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-[var(--radius-button)] bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700"><Plus className="h-4 w-4" /> Create event</button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={Calendar} label="Active events" value="4" />
        <Stat icon={Users} label="Total registrations" value="1,900" sub="+218 this week" />
        <Stat icon={CheckCircle2} label="Live check-ins" value="287" sub="70% of registered" />
        <Stat icon={DollarSign} label="Ticket revenue" value="$144.9K" sub="+$25.2K pending" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        {/* events table */}
        <div className="overflow-hidden rounded-2xl border border-ink/[0.07] bg-white">
          <div className="border-b border-ink/[0.06] p-4">
            <h2 className="font-display text-base font-semibold text-navy-700">All events</h2>
          </div>
          <div className="divide-y divide-ink/[0.04]">
            {EVENTS.map((e) => (
              <button key={e.id} onClick={() => setActiveId(e.id)} className={cn("flex w-full items-center gap-4 px-4 py-4 text-left transition-colors", activeId === e.id ? "bg-brand-50/40" : "hover:bg-paper-2/40")}>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium text-ink">{e.title}</p>
                    <span className={cn("rounded-full px-2 py-0.5 text-[0.65rem] font-medium ring-1", STATUS_STYLE[e.status])}>{e.status}</span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink/65">
                    <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" /> {e.date}</span>
                    <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {e.city}</span>
                    <span className="inline-flex items-center gap-1"><Globe className="h-3 w-3" /> {e.mode}</span>
                  </div>
                </div>
                <div className="hidden text-right sm:block">
                  <p className="text-sm font-medium text-ink tnum">{e.registered}/{e.capacity}</p>
                  <p className="text-xs text-ink/60">registered</p>
                </div>
                <div className="hidden w-24 sm:block">
                  <div className="h-1.5 overflow-hidden rounded-full bg-ink/[0.06]">
                    <div className="h-full rounded-full bg-brand-500" style={{ width: `${Math.round((e.registered / e.capacity) * 100)}%` }} />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* check-in panel */}
        <div className="space-y-4">
          <div className="rounded-3xl border border-ink/[0.07] bg-white p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-ink/60">{active.type}</p>
                <h3 className="mt-1 font-display text-lg font-semibold text-navy-700">{active.title}</h3>
              </div>
              <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium ring-1", STATUS_STYLE[active.status])}>{active.status}</span>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3 text-center">
              {[
                { label: "Registered", value: active.registered, icon: Ticket },
                { label: "Checked in", value: active.status === "Live" ? checkedIn : active.checkedIn, icon: CheckCircle2 },
                { label: "Capacity", value: active.capacity, icon: Users },
              ].map((s) => (
                <div key={s.label} className="rounded-xl bg-paper-2/60 p-3">
                  <s.icon className="mx-auto h-4 w-4 text-brand-600" />
                  <p className="mt-1.5 font-display text-lg font-semibold text-navy-700 tnum">{s.value}</p>
                  <p className="text-[0.65rem] text-ink/65">{s.label}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 grid place-items-center rounded-2xl border border-dashed border-ink/15 bg-paper-2/40 p-6">
              <div className="grid h-28 w-28 place-items-center rounded-2xl bg-white shadow-sm ring-1 ring-ink/[0.06]">
                <QrCode className="h-20 w-20 text-ink" strokeWidth={1} />
              </div>
              <p className="mt-3 text-xs font-medium text-ink/60">Scan to check in</p>
              <p className="text-[0.7rem] text-ink/60">events.assetsandcapitalltd.com/{active.id}</p>
            </div>
          </div>

          <div className="rounded-3xl border border-ink/[0.07] bg-white p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-display text-base font-semibold text-navy-700">Registrants</h3>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700"><TrendingUp className="h-3.5 w-3.5" /> {checkedIn} checked in</span>
            </div>
            <div className="mb-3 flex items-center gap-2 rounded-[var(--radius-button)] bg-paper-2 px-3.5">
              <Search className="h-4 w-4 text-ink/60" />
              <input placeholder="Search registrants…" className="h-8 w-full bg-transparent text-sm text-ink placeholder:text-ink/60 focus:outline-none" />
            </div>
            <div className="space-y-1">
              {registrants.map((r, i) => (
                <div key={i} className="flex items-center gap-3 rounded-lg px-1.5 py-2 hover:bg-paper-2/50">
                  <span className="grid h-8 w-8 flex-none place-items-center rounded-[var(--radius-button)] bg-ink text-[0.65rem] font-semibold text-white">
                    {r.name.split(" ").slice(0, 2).map((w) => w[0]).join("")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{r.name}</p>
                    <p className="truncate text-xs text-ink/60">{r.org}</p>
                  </div>
                  <span className={cn("rounded px-1.5 py-0.5 text-[0.6rem] font-medium", TIER_STYLE[r.tier])}>{r.tier}</span>
                  {r.checkedIn ? (
                    <span className="inline-flex items-center gap-1 text-[0.7rem] font-medium text-emerald-700"><CheckCircle2 className="h-3.5 w-3.5" /> {r.time}</span>
                  ) : (
                    <button onClick={() => setRegistrants((prev) => prev.map((x, xi) => xi === i ? { ...x, checkedIn: true, time: "Now" } : x))} className="rounded-[var(--radius-button)] border border-ink/12 px-2.5 py-1 text-[0.7rem] font-medium text-ink/60 hover:bg-paper-2">Check in</button>
                  )}
                </div>
              ))}
            </div>
            <button className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:text-brand-800">Export attendance <ArrowUpRight className="h-3.5 w-3.5" /></button>
          </div>
        </div>
      </div>
    </div>
  );
}
