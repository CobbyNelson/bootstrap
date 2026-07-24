"use client";

import { useMemo, useState } from "react";
import { MessageSquare, TrendingUp, Wallet, Calendar, CheckSquare, BadgeCheck, AtSign, Megaphone, Check, Bell } from "lucide-react";
import { cn } from "@/lib/utils";

type Cat = "message" | "deal" | "payment" | "event" | "task" | "approval" | "mention" | "announcement";
const META: Record<Cat, { label: string; icon: typeof Bell; color: string }> = {
  message: { label: "Messages", icon: MessageSquare, color: "text-brand-600 bg-brand-50" },
  deal: { label: "Deals", icon: TrendingUp, color: "text-emerald-600 bg-emerald-50" },
  payment: { label: "Payments", icon: Wallet, color: "text-gold-700 bg-gold-100" },
  event: { label: "Events", icon: Calendar, color: "text-brand-600 bg-brand-50" },
  task: { label: "Tasks", icon: CheckSquare, color: "text-ink/70 bg-paper-2" },
  approval: { label: "Approvals", icon: BadgeCheck, color: "text-emerald-600 bg-emerald-50" },
  mention: { label: "Mentions", icon: AtSign, color: "text-brand-600 bg-brand-50" },
  announcement: { label: "Announcements", icon: Megaphone, color: "text-gold-700 bg-gold-100" },
};

type Note = { id: number; cat: Cat; title: string; body: string; time: string; read: boolean };
const SEED: Note[] = [
  { id: 1, cat: "deal", title: "New Excellent Match — Sahara Solar Grid", body: "98% match to your North America & Africa Growth mandate.", time: "8m", read: false },
  { id: 2, cat: "message", title: "Message from Cedar Ridge IR", body: "“Thanks for your interest — sharing the data room access now.”", time: "22m", read: false },
  { id: 3, cat: "approval", title: "NDA countersignature required", body: "Cedar Ridge IV — compliance gate cleared, awaiting your signature.", time: "1h", read: false },
  { id: 4, cat: "event", title: "Roadshow confirmed — Nairobi", body: "East Africa Capital Roadshow on 18 Sep 2026.", time: "3h", read: false },
  { id: 5, cat: "payment", title: "Invoice INV-2131 is due", body: "Financial modelling service — $2,200 due in 5 days.", time: "5h", read: true },
  { id: 6, cat: "mention", title: "Marcus mentioned you", body: "“@Aurora can you take the IC review on Blue Harbor?”", time: "6h", read: true },
  { id: 7, cat: "task", title: "IC memo review due Friday", body: "Blue Harbor Private Credit II — analyst draft ready.", time: "1d", read: true },
  { id: 8, cat: "deal", title: "Deal advanced to Negotiation", body: "Nile Digital Bank moved from Due Diligence.", time: "1d", read: true },
  { id: 9, cat: "announcement", title: "New: AI matching v2 is live", body: "Matches now score across 15 weighted criteria with full explanations.", time: "2d", read: true },
  { id: 10, cat: "approval", title: "KYC re-verification cleared", body: "Aurora Family Office — OFAC / PEP screen clean.", time: "2d", read: true },
];

const FILTERS: ("all" | Cat)[] = ["all", "deal", "message", "approval", "payment", "event", "task", "mention", "announcement"];

export function NotificationCenter() {
  const [notes, setNotes] = useState<Note[]>(SEED);
  const [filter, setFilter] = useState<"all" | Cat>("all");

  const unread = notes.filter((n) => !n.read).length;
  const shown = useMemo(() => (filter === "all" ? notes : notes.filter((n) => n.cat === filter)), [notes, filter]);

  function markAll() {
    setNotes((ns) => ns.map((n) => ({ ...n, read: true })));
  }
  function toggle(id: number) {
    setNotes((ns) => ns.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-ink/50">Workspace</p>
          <h1 className="mt-1 flex items-center gap-2 font-display text-3xl font-semibold text-ink">
            Notifications
            {unread > 0 && <span className="rounded-full bg-brand-600 px-2 py-0.5 text-xs font-semibold text-white tnum">{unread}</span>}
          </h1>
        </div>
        <button onClick={markAll} className="inline-flex items-center gap-2 rounded-full border border-ink/12 px-4 py-2.5 text-sm font-medium text-ink/70 hover:border-ink/25">
          <Check className="h-4 w-4" /> Mark all read
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-sm font-medium capitalize transition-colors",
              filter === f ? "border-brand-600 bg-brand-50 text-brand-700" : "border-ink/12 text-ink/60 hover:border-ink/25"
            )}
          >
            {f === "all" ? "All" : META[f].label}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-3xl border border-ink/[0.07] bg-white">
        {shown.length === 0 ? (
          <div className="grid place-items-center py-16 text-center">
            <Bell className="h-8 w-8 text-ink/25" />
            <p className="mt-3 text-sm text-ink/50">Nothing here right now.</p>
          </div>
        ) : (
          <div className="divide-y divide-ink/[0.06]">
            {shown.map((n) => {
              const m = META[n.cat];
              return (
                <button
                  key={n.id}
                  onClick={() => toggle(n.id)}
                  className={cn("flex w-full items-start gap-4 px-5 py-4 text-left transition-colors hover:bg-paper-2/50", !n.read && "bg-brand-50/30")}
                >
                  <span className={cn("grid h-10 w-10 flex-none place-items-center rounded-xl", m.color)}>
                    <m.icon className="h-[18px] w-[18px]" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className={cn("truncate text-sm", n.read ? "font-medium text-ink/80" : "font-semibold text-ink")}>{n.title}</p>
                      {!n.read && <span className="h-1.5 w-1.5 flex-none rounded-full bg-brand-600" />}
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-sm text-ink/55">{n.body}</p>
                  </div>
                  <span className="flex-none text-xs text-ink/40 tnum">{n.time}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
