"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, MapPin, Plus, Trash2, Pencil, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type AdminEvent = {
  id: string;
  title: string;
  type: string;
  location: string | null;
  date: string;
};

/**
 * Event management, reduced to what the schema actually holds.
 *
 * This page used to show four statistics — active events, total registrations,
 * live check-ins, ticket revenue — a registrant list and a QR code for
 * door scanning. The Event model has four fields: title, type, location, date.
 * There is no registration, ticket or check-in table anywhere in the schema, so
 * three of those four numbers, the registrant list and the QR panel were
 * describing a ticketing product that does not exist and is not being built.
 *
 * Ticketing is a real feature if it is wanted, with its own tables and its own
 * decisions about payment and capacity. What it was not is nearly finished,
 * which is what that page implied to anyone reading it.
 *
 * What remains is the loop the site is designed around: an admin maintains the
 * event list and the public /events page shows it.
 */

const TYPES = ["Roadshow", "Forum", "Summit", "Networking", "Webinar"];

type Draft = { id?: string; title: string; type: string; location: string; date: string };

const EMPTY: Draft = { title: "", type: TYPES[0], location: "", date: "" };

export function EventsManager({ events }: { events: AdminEvent[] }) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const iso = (d: string) => (d ? new Date(d).toISOString().slice(0, 10) : "");

  async function save() {
    if (!draft) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/events", {
        method: draft.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not save.");
        return;
      }
      setDraft(null);
      router.refresh();
    } catch {
      setError("Could not reach the server.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    setBusy(true);
    try {
      await fetch(`/api/admin/events?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const upcoming = events.filter((e) => new Date(e.date) >= new Date()).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="kicker text-[0.7rem] text-brand-700">Roadshows &amp; events</p>
          <h1 className="mt-1.5 font-display text-3xl font-medium text-navy-700">Event management</h1>
          <p className="mt-1 text-sm text-ink/65">
            {events.length} event{events.length === 1 ? "" : "s"}
            {events.length > 0 && ` · ${upcoming} upcoming`}. These appear on the public events page.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setDraft({ ...EMPTY })}
          className="inline-flex items-center gap-2 rounded-[var(--radius-button)] bg-brand-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" /> Create event
        </button>
      </div>

      {draft && (
        <div className="rounded-3xl border border-ink/[0.07] bg-white p-6">
          <div className="flex items-center justify-between">
            <p className="font-display text-lg font-semibold text-navy-700">
              {draft.id ? "Edit event" : "New event"}
            </p>
            <button
              type="button"
              onClick={() => setDraft(null)}
              aria-label="Close"
              className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-button)] text-ink/60 hover:bg-ink/5"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink/80">Title</span>
              <input
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                className="w-full rounded-[var(--radius-button)] border border-ink/15 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink/80">Type</span>
              <select
                value={draft.type}
                onChange={(e) => setDraft({ ...draft, type: e.target.value })}
                className="w-full rounded-[var(--radius-button)] border border-ink/15 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
              >
                {TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink/80">Location</span>
              <input
                value={draft.location}
                onChange={(e) => setDraft({ ...draft, location: e.target.value })}
                placeholder="Nairobi, Kenya"
                className="w-full rounded-[var(--radius-button)] border border-ink/15 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink/80">Date</span>
              <input
                type="date"
                value={iso(draft.date)}
                onChange={(e) => setDraft({ ...draft, date: e.target.value })}
                className="w-full rounded-[var(--radius-button)] border border-ink/15 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
              />
            </label>
          </div>

          {error && <p className="mt-3 text-sm font-medium text-brand-700">{error}</p>}

          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setDraft(null)}
              className="rounded-[var(--radius-button)] border border-ink/12 px-4 py-2.5 text-sm font-medium text-ink/70 hover:border-ink/25"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={save}
              disabled={busy}
              className="rounded-[var(--radius-button)] bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-40"
            >
              {busy ? "Saving…" : draft.id ? "Save changes" : "Create event"}
            </button>
          </div>
        </div>
      )}

      <div className="rounded-3xl border border-ink/[0.07] bg-white">
        {events.length === 0 ? (
          <p className="px-6 py-14 text-center text-sm text-ink/55">
            No events yet. The public page falls back to the three sample events until you add one —
            the first real event replaces all of them.
          </p>
        ) : (
          <ul className="divide-y divide-ink/[0.06]">
            {events.map((e) => {
              const past = new Date(e.date) < new Date();
              return (
                <li key={e.id} className="flex flex-wrap items-center gap-4 px-6 py-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-ink">{e.title}</p>
                      <Badge variant={past ? "neutral" : "gold"} size="sm">
                        {past ? "Past" : e.type}
                      </Badge>
                    </div>
                    <p className="mt-1 inline-flex flex-wrap items-center gap-3 text-sm text-ink/60">
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {new Date(e.date).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                      {e.location && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {e.location}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        setDraft({
                          id: e.id,
                          title: e.title,
                          type: e.type,
                          location: e.location ?? "",
                          date: e.date,
                        })
                      }
                      aria-label={`Edit ${e.title}`}
                      className={cn(
                        "inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-button)]",
                        "text-ink/60 transition-colors hover:bg-ink/5 hover:text-ink",
                      )}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(e.id)}
                      disabled={busy}
                      aria-label={`Delete ${e.title}`}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-button)] text-ink/60 transition-colors hover:bg-brand-50 hover:text-brand-700 disabled:opacity-40"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
