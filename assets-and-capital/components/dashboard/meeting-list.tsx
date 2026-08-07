"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Video, CalendarPlus, MapPin, ArrowUpRight } from "lucide-react";
import { PROVIDER_LABEL, type MeetingRow } from "@/lib/meeting-kinds";
import { formatDate, formatTimeRange } from "@/lib/dates";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";

/**
 * The meetings this account is part of, with a way into each one.
 *
 * The page this replaces listed invented calls with a provider dropdown that
 * changed nothing and time slots nobody could book. Every row here is a real
 * meeting between two real accounts.
 *
 * "Join" is only shown once the meeting is close. A join button live three
 * weeks early invites somebody into an empty room and teaches them the button
 * does not work.
 */

/** Joinable from fifteen minutes before until the end. */
const JOIN_WINDOW_MS = 15 * 60_000;

export function MeetingList({
  meetings,
  /** Which side is reading, so the card names the OTHER party. */
  viewerId,
  emptyHint,
}: {
  meetings: MeetingRow[];
  viewerId: string;
  emptyHint?: string;
}) {
  /**
   * The clock lives in the browser, not in the render on the server.
   *
   * "Is this joinable yet" is a question about now, and a server-rendered
   * answer is stale the moment it is sent — somebody sitting on this page two
   * minutes before a call would never see the button appear without reloading.
   * It ticks every 30 seconds, which is finer than the fifteen-minute window
   * needs and cheap enough not to matter.
   *
   * Starts at 0 so the server and the first client render agree; anything else
   * is a hydration mismatch by construction.
   */
  const [now, setNow] = useState(0);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);
  if (meetings.length === 0) {
    return (
      <EmptyState
        icon={Video}
        title="No meetings scheduled"
        description={emptyHint ?? "When our team arranges a call, it will appear here with a join link and a calendar invitation."}
      />
    );
  }


  return (
    <div className="divide-y divide-ink/[0.06]">
      {meetings.map((m) => {
        const counterpart = m.investor.id === viewerId ? m.business : m.investor;
        const joinable =
          Boolean(m.joinUrl) &&
          now >= m.startsAt.getTime() - JOIN_WINDOW_MS &&
          now <= m.endsAt.getTime();
        const live = now >= m.startsAt.getTime() && now <= m.endsAt.getTime();

        return (
          <div key={m.id} className="flex flex-wrap items-center gap-4 py-4 first:pt-0">
            <div className="grid h-12 w-12 flex-none place-items-center rounded-xl bg-brand-50 text-brand-600">
              {m.provider === "IN_PERSON" ? <MapPin className="h-5 w-5" /> : <Video className="h-5 w-5" />}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate font-medium text-ink">{m.title}</p>
                {live && <Badge variant="success" size="sm">Now</Badge>}
              </div>
              <p className="mt-0.5 text-sm text-ink/65">
                With {counterpart.name} · {formatDate(m.startsAt, "en")}, {formatTimeRange(m.startsAt, m.endsAt, "en")}
              </p>
              <p className="text-xs text-ink/60">
                {m.location || PROVIDER_LABEL[m.provider]}
              </p>
            </div>

            <div className="flex flex-none items-center gap-2">
              {/* Always available, whenever the meeting is — this is the part
                  that puts it in their own calendar rather than only ours. */}
              <a
                href={`/api/meetings/${m.id}/ics`}
                className="inline-flex items-center gap-1.5 rounded-[var(--radius-button)] border border-ink/12 px-3 py-2 text-xs font-medium text-ink/70 transition-colors hover:border-ink/25"
              >
                <CalendarPlus className="h-3.5 w-3.5" /> Add to calendar
              </a>

              {m.joinUrl ? (
                joinable ? (
                  <a
                    href={m.joinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-[var(--radius-button)] bg-brand-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-brand-700"
                  >
                    Join {PROVIDER_LABEL[m.provider]} <ArrowUpRight className="h-3.5 w-3.5" />
                  </a>
                ) : (
                  // Present but inert, and saying why. A hidden button leaves
                  // somebody wondering whether there is a link at all.
                  <span className="rounded-[var(--radius-button)] border border-dashed border-ink/15 px-3 py-2 text-xs text-ink/55">
                    Join opens 15 min before
                  </span>
                )
              ) : null}
            </div>

            {m.slug && (
              <Link
                href={`/marketplace/${m.slug}`}
                className="w-full text-xs font-medium text-brand-700 hover:text-brand-800 sm:w-auto"
              >
                View the listing
              </Link>
            )}
          </div>
        );
      })}
    </div>
  );
}
