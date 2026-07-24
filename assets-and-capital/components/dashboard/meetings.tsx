"use client";

import { useState } from "react";
import {
  Video, Calendar, Clock, Users, Plus, Link2, CheckCircle2, ChevronRight, Play,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Provider = "A&C Meet" | "Zoom" | "Google Meet" | "Microsoft Teams";
type Meeting = {
  id: number;
  title: string;
  with: string;
  date: string;
  time: string;
  duration: string;
  provider: Provider;
  status: "Confirmed" | "Pending" | "Live";
  attendees: string[];
};

const PROVIDER_STYLE: Record<Provider, string> = {
  "A&C Meet": "bg-brand-50 text-brand-700",
  Zoom: "bg-sky-50 text-sky-700",
  "Google Meet": "bg-emerald-50 text-emerald-700",
  "Microsoft Teams": "bg-violet-50 text-violet-700",
};

const MEETINGS: Meeting[] = [
  { id: 1, title: "Fund IV diligence kick-off", with: "Cedar Ridge Partners", date: "Today", time: "15:00 GMT", duration: "45 min", provider: "A&C Meet", status: "Live", attendees: ["Aurora Family Office", "Cedar Ridge IR", "R. Osei"] },
  { id: 2, title: "Accra FinPay management presentation", with: "David Mensah, CEO", date: "Today", time: "17:30 GMT", duration: "60 min", provider: "Zoom", status: "Confirmed", attendees: ["Aurora Family Office", "David Mensah"] },
  { id: 3, title: "IC review — Series A term sheet", with: "Investment Committee", date: "Tomorrow", time: "10:00 GMT", duration: "30 min", provider: "Microsoft Teams", status: "Confirmed", attendees: ["Aurora Family Office", "Compliance Desk", "R. Osei"] },
  { id: 4, title: "Intro call — Sahel Ventures", with: "Nadia Okonkwo", date: "Thu 26 Jul", time: "14:00 GMT", duration: "30 min", provider: "Google Meet", status: "Pending", attendees: ["Aurora Family Office", "Nadia Okonkwo"] },
];

const SLOTS = ["09:00", "10:30", "13:00", "14:30", "16:00", "17:30"];
const PROVIDERS: Provider[] = ["A&C Meet", "Zoom", "Google Meet", "Microsoft Teams"];

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("");
}

export function Meetings() {
  const [slot, setSlot] = useState("14:30");
  const [provider, setProvider] = useState<Provider>("A&C Meet");
  const live = MEETINGS.find((m) => m.status === "Live");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">Video meetings</p>
          <h1 className="mt-1 font-display text-2xl font-semibold text-ink">Calls &amp; scheduling</h1>
          <p className="mt-1 text-sm text-ink/55">Host secure calls or connect your calendar and conferencing tools.</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700"><Plus className="h-4 w-4" /> New meeting</button>
      </div>

      {live && (
        <div className="overflow-hidden rounded-3xl border border-brand-200 bg-gradient-to-br from-brand-600 to-brand-800 p-6 text-white">
          <div className="flex flex-wrap items-center gap-4">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium">
              <span className="h-2 w-2 animate-pulse rounded-full bg-white" /> Live now
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-display text-lg font-semibold">{live.title}</p>
              <p className="text-sm text-white/70">{live.with} · started {live.time}</p>
            </div>
            <div className="flex -space-x-2">
              {live.attendees.map((a) => (
                <span key={a} className="grid h-9 w-9 place-items-center rounded-full border-2 border-brand-700 bg-white/20 text-[0.7rem] font-semibold backdrop-blur">{initials(a)}</span>
              ))}
            </div>
            <button className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-brand-700 hover:bg-white/90"><Play className="h-4 w-4 fill-brand-700" /> Join call</button>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* upcoming */}
        <div className="space-y-3">
          <h2 className="font-display text-base font-semibold text-ink">Upcoming</h2>
          {MEETINGS.filter((m) => m.status !== "Live").map((m) => (
            <div key={m.id} className="flex items-center gap-4 rounded-2xl border border-ink/[0.07] bg-white p-4">
              <div className="grid h-14 w-14 flex-none place-items-center rounded-2xl bg-paper-2 text-center">
                <span className="text-[0.6rem] font-medium uppercase text-ink/45">{m.date.split(" ")[0]}</span>
                <span className="font-display text-lg font-semibold leading-none text-ink">{m.time.split(":")[0]}<span className="text-xs">:{m.time.split(":")[1].slice(0, 2)}</span></span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">{m.title}</p>
                <p className="truncate text-xs text-ink/50">{m.with}</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[0.7rem] text-ink/50">
                  <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {m.duration}</span>
                  <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" /> {m.attendees.length}</span>
                  <span className={cn("rounded-full px-2 py-0.5 font-medium", PROVIDER_STYLE[m.provider])}>{m.provider}</span>
                </div>
              </div>
              <div className="flex flex-none items-center gap-2">
                {m.status === "Pending" ? (
                  <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[0.7rem] font-medium text-amber-700">Pending</span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[0.7rem] font-medium text-emerald-700"><CheckCircle2 className="h-3 w-3" /> Confirmed</span>
                )}
                <button className="grid h-9 w-9 place-items-center rounded-full text-ink/40 hover:bg-paper-2 hover:text-ink"><ChevronRight className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
        </div>

        {/* scheduler */}
        <div className="space-y-4">
          <div className="rounded-3xl border border-ink/[0.07] bg-white p-5">
            <h2 className="font-display text-base font-semibold text-ink">Quick schedule</h2>
            <label className="mt-4 block">
              <span className="text-xs font-medium text-ink/55">Date</span>
              <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-ink/10 bg-paper-2/40 px-3.5 py-2.5 text-sm text-ink">
                <Calendar className="h-4 w-4 text-ink/40" /> Thursday, 24 Jul 2026
              </div>
            </label>
            <div className="mt-4">
              <span className="text-xs font-medium text-ink/55">Available slots (GMT)</span>
              <div className="mt-1.5 grid grid-cols-3 gap-2">
                {SLOTS.map((s) => (
                  <button key={s} onClick={() => setSlot(s)} className={cn("rounded-xl border py-2 text-sm font-medium transition-colors tnum", slot === s ? "border-brand-600 bg-brand-50 text-brand-700" : "border-ink/10 text-ink/60 hover:border-ink/20")}>{s}</button>
                ))}
              </div>
            </div>
            <div className="mt-4">
              <span className="text-xs font-medium text-ink/55">Platform</span>
              <div className="mt-1.5 grid grid-cols-2 gap-2">
                {PROVIDERS.map((p) => (
                  <button key={p} onClick={() => setProvider(p)} className={cn("flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition-colors", provider === p ? "border-brand-600 bg-brand-50 text-brand-700" : "border-ink/10 text-ink/60 hover:border-ink/20")}>
                    <Video className="h-3.5 w-3.5" /> {p}
                  </button>
                ))}
              </div>
            </div>
            <button className="mt-5 w-full rounded-full bg-brand-600 py-2.5 text-sm font-medium text-white hover:bg-brand-700">Send invite for {slot} · {provider}</button>
          </div>

          <div className="rounded-3xl border border-ink/[0.07] bg-white p-5">
            <h2 className="font-display text-base font-semibold text-ink">Connected calendars</h2>
            <div className="mt-3 space-y-2.5">
              {[
                { name: "Google Calendar", connected: true },
                { name: "Microsoft Outlook", connected: true },
                { name: "Zoom", connected: false },
              ].map((c) => (
                <div key={c.name} className="flex items-center gap-3">
                  <span className="grid h-8 w-8 flex-none place-items-center rounded-lg bg-ink/[0.05] text-ink/50"><Link2 className="h-4 w-4" /></span>
                  <span className="flex-1 text-sm text-ink/75">{c.name}</span>
                  {c.connected ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600"><CheckCircle2 className="h-3.5 w-3.5" /> Connected</span>
                  ) : (
                    <button className="rounded-full border border-ink/12 px-3 py-1 text-xs font-medium text-ink/60 hover:bg-paper-2">Connect</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
