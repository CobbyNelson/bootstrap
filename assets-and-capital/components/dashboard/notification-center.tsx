"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { MessageSquare, TrendingUp, Wallet, Calendar, FileSignature, BadgeCheck, Megaphone, Check, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { relativeTime } from "@/lib/dates";

/**
 * The account's real notifications.
 *
 * This page rendered ten invented items from a `SEED` constant — a 98% match,
 * a message from "Cedar Ridge IR", an invoice due in five days, a colleague
 * called Marcus mentioning you — to every account that opened it, over a
 * Notification table that had never had a row written to it.
 *
 * "Mark all read" mutated local state, so it worked until you reloaded.
 *
 * The rows now come from /api/notifications, scoped to the session, and are
 * written by lib/notify.ts when something actually happens to the account.
 */

type Cat = "message" | "commitment" | "payment" | "event" | "nda" | "approval" | "kyc" | "interest" | "announcement";

const META: Record<Cat, { label: string; icon: typeof Bell; color: string }> = {
  message: { label: "Messages", icon: MessageSquare, color: "text-brand-600 bg-brand-50" },
  commitment: { label: "Commitments", icon: TrendingUp, color: "text-emerald-700 bg-emerald-50" },
  interest: { label: "Interest", icon: TrendingUp, color: "text-emerald-700 bg-emerald-50" },
  payment: { label: "Payments", icon: Wallet, color: "text-navy-700 bg-navy-100" },
  event: { label: "Events", icon: Calendar, color: "text-brand-600 bg-brand-50" },
  nda: { label: "NDAs", icon: FileSignature, color: "text-navy-700 bg-navy-100" },
  approval: { label: "Approvals", icon: BadgeCheck, color: "text-emerald-700 bg-emerald-50" },
  kyc: { label: "Verification", icon: BadgeCheck, color: "text-emerald-700 bg-emerald-50" },
  announcement: { label: "Announcements", icon: Megaphone, color: "text-navy-700 bg-navy-100" },
};

/** An unrecognised type still renders rather than crashing on a missing icon. */
const FALLBACK = { label: "Updates", icon: Bell, color: "text-ink/70 bg-paper-2" };
const metaOf = (t: string) => META[t as Cat] ?? FALLBACK;

type Note = { id: string; type: string; title: string; body: string | null; readAt: string | null; createdAt: string };

export function NotificationCenter() {
  const [notes, setNotes] = useState<Note[] | null>(null);
  const [filter, setFilter] = useState<string>("all");

  const load = useCallback(() => {
    fetch("/api/notifications", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setNotes(Array.isArray(d?.items) ? d.items : []))
      .catch(() => setNotes([]));
  }, []);
  useEffect(load, [load]);

  const unread = (notes ?? []).filter((n) => !n.readAt).length;

  // Only the categories that are actually present. A fixed row of nine filter
  // chips over an empty list is nine buttons that each prove there is nothing
  // to filter.
  const cats = useMemo(() => [...new Set((notes ?? []).map((n) => n.type))], [notes]);
  const shown = useMemo(
    () => (filter === "all" ? notes ?? [] : (notes ?? []).filter((n) => n.type === filter)),
    [notes, filter],
  );

  async function markAll() {
    // Optimistic, then persisted. The old version only ever did the first half,
    // so "Mark all read" survived exactly until a reload.
    setNotes((ns) => (ns ?? []).map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })));
    await fetch("/api/notifications", { method: "POST", body: "{}" }).catch(() => {});
    load();
  }

  async function markOne(id: string) {
    setNotes((ns) => (ns ?? []).map((n) => (n.id === id ? { ...n, readAt: n.readAt ?? new Date().toISOString() } : n)));
    await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    }).catch(() => {});
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-ink/65">Workspace</p>
          <h1 className="mt-1 flex items-center gap-2 font-display text-3xl font-semibold text-navy-700">
            Notifications
            {unread > 0 && (
              <span className="rounded-full bg-brand-600 px-2 py-0.5 text-xs font-semibold text-white tnum">{unread}</span>
            )}
          </h1>
        </div>
        {unread > 0 && (
          <button
            onClick={markAll}
            className="inline-flex items-center gap-2 rounded-[var(--radius-button)] border border-ink/12 px-4 py-2.5 text-sm font-medium text-ink/70 hover:border-ink/25"
          >
            <Check className="h-4 w-4" /> Mark all read
          </button>
        )}
      </div>

      {cats.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {["all", ...cats].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-[var(--radius-button)] border px-3.5 py-1.5 text-sm font-medium transition-colors",
                filter === f ? "border-brand-600 bg-brand-50 text-brand-700" : "border-ink/12 text-ink/60 hover:border-ink/25",
              )}
            >
              {f === "all" ? "All" : metaOf(f).label}
            </button>
          ))}
        </div>
      )}

      <div className="overflow-hidden rounded-3xl border border-ink/[0.07] bg-white">
        {notes === null ? (
          <div className="grid place-items-center py-16 text-center">
            <p className="text-sm text-ink/65">Loading…</p>
          </div>
        ) : shown.length === 0 ? (
          <div className="grid place-items-center px-6 py-16 text-center">
            <Bell className="h-8 w-8 text-ink/25" />
            <p className="mt-3 text-sm font-medium text-ink">You&rsquo;re all caught up</p>
            <p className="mt-1 max-w-sm text-sm text-ink/65">
              We&rsquo;ll tell you here when an NDA is signed, a commitment moves, or your verification is decided.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-ink/[0.06]">
            {shown.map((n) => {
              const m = metaOf(n.type);
              const read = Boolean(n.readAt);
              return (
                <button
                  key={n.id}
                  onClick={() => !read && markOne(n.id)}
                  className={cn(
                    "flex w-full items-start gap-4 px-5 py-4 text-left transition-colors hover:bg-paper-2/50",
                    !read && "bg-brand-50/30",
                  )}
                >
                  <span className={cn("grid h-10 w-10 flex-none place-items-center rounded-xl", m.color)}>
                    <m.icon className="h-[18px] w-[18px]" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className={cn("truncate text-sm", read ? "font-medium text-ink/80" : "font-semibold text-ink")}>
                        {n.title}
                      </p>
                      {!read && <span className="h-1.5 w-1.5 flex-none rounded-full bg-brand-600" />}
                    </div>
                    {n.body && <p className="mt-0.5 line-clamp-2 text-sm text-ink/65">{n.body}</p>}
                  </div>
                  <span className="flex-none text-xs text-ink/60 tnum">{relativeTime(n.createdAt)}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
