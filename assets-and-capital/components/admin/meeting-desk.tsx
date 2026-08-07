"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarPlus, Loader2, Video, X } from "lucide-react";
import { PROVIDER_LABEL } from "@/lib/meeting-kinds";
import { Badge } from "@/components/ui/badge";

/**
 * Where staff book a call between an investor and a business.
 *
 * Deliberately staff-only rather than a "book a call" button on a listing: the
 * platform's model is that introductions are brokered once both sides agree —
 * it is what the pricing page sells and what Kwaku declines to shortcut.
 *
 * The provider is recorded and the join link is pasted, rather than created
 * through Zoom's or Google's API. Both would need an OAuth app per provider and
 * a stored token per organiser to produce the same link the organiser already
 * has in front of them.
 */

type Person = { id: string; label: string };
type Meeting = {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string;
  provider: keyof typeof PROVIDER_LABEL;
  joinUrl: string | null;
  status: string;
  investor: { id: string; name: string };
  business: { id: string; name: string };
};

const FIELD =
  "w-full rounded-[var(--radius-button)] border border-ink/12 bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-brand-600";

export function MeetingDesk() {
  const [meetings, setMeetings] = useState<Meeting[] | null>(null);
  const [investors, setInvestors] = useState<Person[]>([]);
  const [businesses, setBusinesses] = useState<Person[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Two taps to cancel, rather than a confirm() dialog: cancelling reaches two
  // people's calendars, and a mis-tap is not worth a silent one.
  const [armed, setArmed] = useState<string | null>(null);

  const load = useCallback(() => {
    fetch("/api/admin/meetings", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        setMeetings(d?.meetings ?? []);
        setInvestors(d?.investors ?? []);
        setBusinesses(d?.businesses ?? []);
      })
      .catch(() => setMeetings([]));
  }, []);
  useEffect(load, [load]);

  async function book(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const d = new FormData(form);
    setBusy(true);
    setError(null);

    const res = await fetch("/api/admin/meetings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: d.get("title"),
        agenda: d.get("agenda"),
        // datetime-local gives a wall-clock string with no zone; the browser
        // reads it as local, which is what the person typing it meant.
        startsAt: d.get("startsAt") ? new Date(String(d.get("startsAt"))).toISOString() : "",
        durationMins: d.get("durationMins"),
        provider: d.get("provider"),
        joinUrl: d.get("joinUrl"),
        investorId: d.get("investorId"),
        businessId: d.get("businessId"),
        slug: d.get("slug"),
      }),
    });
    const body = await res.json().catch(() => ({}));
    setBusy(false);

    if (!res.ok) {
      setError(body.error ?? "We couldn't schedule that meeting.");
      return;
    }
    form.reset();
    load();
  }

  async function cancel(id: string) {
    await fetch(`/api/admin/meetings?id=${encodeURIComponent(id)}`, { method: "DELETE" }).catch(() => {});
    load();
  }

  const noParties = investors.length === 0 || businesses.length === 0;

  return (
    <div className="space-y-6">
      <form onSubmit={book} className="rounded-3xl border border-ink/[0.07] bg-white p-6">
        <h2 className="font-display text-lg font-semibold text-navy-700">Schedule a meeting</h2>
        <p className="mt-1 text-sm text-ink/65">
          Both sides get it in their dashboard, a notification, and a calendar invitation.
        </p>

        {noParties && (
          <p className="mt-4 rounded-2xl bg-paper-2/60 p-4 text-sm text-ink/70">
            You need at least one investor account and one business account before a meeting can be booked.
          </p>
        )}

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="mb-1.5 block text-sm font-medium text-ink">Title</span>
            <input name="title" required className={FIELD} placeholder="Introductory call" />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink">Investor</span>
            <select name="investorId" required className={FIELD} defaultValue="">
              <option value="" disabled>Choose…</option>
              {investors.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink">Business</span>
            <select name="businessId" required className={FIELD} defaultValue="">
              <option value="" disabled>Choose…</option>
              {businesses.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink">Starts</span>
            <input type="datetime-local" name="startsAt" required className={FIELD} />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink">Minutes</span>
            <input type="number" name="durationMins" defaultValue={30} min={5} max={480} className={FIELD} />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink">Where</span>
            <select name="provider" defaultValue="ZOOM" className={FIELD}>
              {Object.entries(PROVIDER_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink">Join link</span>
            <input name="joinUrl" className={FIELD} placeholder="https://zoom.us/j/…" />
            <span className="mt-1 block text-xs text-ink/60">
              Paste the link Zoom or Meet gave you. Required unless the meeting is in person.
            </span>
          </label>

          <label className="block sm:col-span-2">
            <span className="mb-1.5 block text-sm font-medium text-ink">Agenda</span>
            <textarea name="agenda" rows={2} className={FIELD} placeholder="What the call is for." />
          </label>

          <label className="block sm:col-span-2">
            <span className="mb-1.5 block text-sm font-medium text-ink">Listing slug (optional)</span>
            <input name="slug" className={FIELD} placeholder="accra-finpay" />
          </label>
        </div>

        {error && <p className="mt-4 text-sm font-medium text-brand-700">{error}</p>}

        <button
          type="submit"
          disabled={busy || noParties}
          className="mt-5 inline-flex items-center gap-2 rounded-[var(--radius-button)] bg-brand-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarPlus className="h-4 w-4" />}
          {busy ? "Scheduling…" : "Schedule"}
        </button>
      </form>

      <div className="overflow-hidden rounded-3xl border border-ink/[0.07] bg-white">
        <div className="border-b border-ink/[0.06] px-5 py-4">
          <h2 className="font-display text-lg font-semibold text-navy-700">Scheduled</h2>
        </div>
        {meetings === null ? (
          <p className="px-5 py-10 text-center text-sm text-ink/65">Loading…</p>
        ) : meetings.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-ink/65">Nothing scheduled yet.</p>
        ) : (
          <div className="divide-y divide-ink/[0.06]">
            {meetings.map((m) => (
              <div key={m.id} className="flex flex-wrap items-center gap-3 px-5 py-4">
                <span className="grid h-9 w-9 flex-none place-items-center rounded-xl bg-brand-50 text-brand-600">
                  <Video className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-ink">{m.title}</p>
                  <p className="truncate text-xs text-ink/65">
                    {m.investor.name} · {m.business.name} — {new Date(m.startsAt).toUTCString()}
                  </p>
                </div>
                <Badge variant={m.status === "CANCELLED" ? "neutral" : "success"} size="sm">
                  {m.status.toLowerCase()}
                </Badge>
                {m.status !== "CANCELLED" && (
                  <button
                    onClick={() => (armed === m.id ? cancel(m.id) : setArmed(m.id))}
                    className={
                      armed === m.id
                        ? "rounded-[var(--radius-button)] bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white"
                        : "rounded-[var(--radius-button)] border border-ink/12 px-3 py-1.5 text-xs font-medium text-ink/70 hover:border-ink/25"
                    }
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <X className="h-3 w-3" />
                      {armed === m.id ? "Tap again to cancel" : "Cancel"}
                    </span>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
