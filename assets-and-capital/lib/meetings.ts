import "server-only";
import { prisma } from "@/lib/prisma";
import { SITE, SITE as S } from "@/lib/content";
import { SITE_ORIGIN } from "@/lib/site-url";
import type { SessionUser } from "@/lib/session";
import { PROVIDER_LABEL as LABELS } from "@/lib/meeting-kinds";
import type { MeetingProvider, MeetingRow } from "@/lib/meeting-kinds";

/**
 * Meetings the platform arranged between an investor and a business.
 *
 * The portal used to carry a Meetings page built entirely from a MEETINGS
 * constant — invented calls with invented attendees, a provider dropdown that
 * changed nothing and a set of time slots nobody could book. It was retired
 * rather than wired, because there was no model behind it and no way to make
 * one honest without building this.
 *
 * This is that: a real row, both parties as real accounts, a join link, and an
 * .ics so it lands in whatever calendar each of them actually uses.
 *
 * NO ZOOM OR GOOGLE API. Creating a meeting through either needs an OAuth app
 * per provider and a stored token per organiser, plus a refresh path when the
 * token expires — for the same outcome as pasting the link Zoom already gave
 * you. The provider is recorded so the button can say where it goes, and the
 * seam is here if that trade ever changes.
 */

export { PROVIDER_LABEL } from "@/lib/meeting-kinds";
export type { MeetingProvider, MeetingRow } from "@/lib/meeting-kinds";

const SELECT = {
  id: true, title: true, agenda: true, startsAt: true, endsAt: true,
  provider: true, joinUrl: true, location: true, status: true, slug: true, revision: true,
  investor: { select: { id: true, name: true, email: true } },
  business: { select: { id: true, name: true, email: true } },
} as const;

type Row = {
  investor: { id: string; name: string | null; email: string };
  business: { id: string; name: string | null; email: string };
} & Omit<MeetingRow, "investor" | "business">;

const toDto = (m: Row): MeetingRow => ({
  ...m,
  investor: { ...m.investor, name: m.investor.name || m.investor.email },
  business: { ...m.business, name: m.business.name || m.business.email },
});

/**
 * The meetings this account is actually part of.
 *
 * Scoped by session on both sides — never by an id the caller supplies, which
 * on a marketplace is the difference between your calendar and everyone's.
 */
export async function getMyMeetings(user: SessionUser, opts: { past?: boolean } = {}): Promise<MeetingRow[]> {
  try {
    const rows = await prisma.meeting.findMany({
      where: {
        OR: [{ investorId: user.id }, { businessId: user.id }],
        status: { not: "CANCELLED" },
        ...(opts.past ? { endsAt: { lt: new Date() } } : { endsAt: { gte: new Date() } }),
      },
      orderBy: { startsAt: opts.past ? "desc" : "asc" },
      take: 25,
      select: SELECT,
    });
    return rows.map(toDto);
  } catch {
    return [];
  }
}

/** Staff view: every meeting, upcoming first. */
export async function listAllMeetings(): Promise<MeetingRow[]> {
  try {
    const rows = await prisma.meeting.findMany({
      orderBy: { startsAt: "desc" },
      take: 100,
      select: SELECT,
    });
    return rows.map(toDto);
  } catch {
    return [];
  }
}

/**
 * One meeting, but only for somebody entitled to see it.
 *
 * The ICS route is unauthenticated by necessity — a calendar client fetching a
 * subscription URL carries no session — so entitlement there is the
 * unguessable cuid in the URL. Everywhere else goes through this.
 */
export async function getMeetingFor(id: string, user: SessionUser): Promise<MeetingRow | null> {
  try {
    const staff = ["ADMIN", "SUPER_ADMIN", "STAFF"].includes(user.role);
    const m = await prisma.meeting.findFirst({
      where: staff ? { id } : { id, OR: [{ investorId: user.id }, { businessId: user.id }] },
      select: SELECT,
    });
    return m ? toDto(m) : null;
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------- ICS */

/** ICS wants UTC as YYYYMMDDTHHMMSSZ, with no separators. */
function icsStamp(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/**
 * RFC 5545 folds lines at 75 octets, and a client that meets a longer one is
 * entitled to reject the whole file. Continuation lines start with a space.
 */
function fold(line: string): string {
  if (line.length <= 74) return line;
  const parts: string[] = [line.slice(0, 74)];
  let rest = line.slice(74);
  while (rest.length > 73) {
    parts.push(` ${rest.slice(0, 73)}`);
    rest = rest.slice(73);
  }
  if (rest) parts.push(` ${rest}`);
  return parts.join("\r\n");
}

/**
 * Escaping is not optional: an unescaped comma or semicolon in a summary ends
 * the property early and the event silently loses everything after it.
 */
function esc(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

/**
 * An .ics for one meeting.
 *
 * UID is stable across edits and SEQUENCE increments, which together are what
 * make a re-sent invitation update the event already in someone's calendar
 * instead of adding a second one beside it. METHOD:REQUEST is what makes Outlook
 * and Google treat it as an invitation rather than a file to look at.
 *
 * CRLF throughout — RFC 5545 requires it, and Outlook in particular will reject
 * a file that uses bare newlines.
 */
export function meetingIcs(m: MeetingRow & { revision?: number }): string {
  const joinLine = m.joinUrl ? `Join: ${m.joinUrl}` : "";
  const description = [m.agenda ?? "", joinLine, `Arranged by ${SITE.name}.`]
    .filter(Boolean)
    .join("\n");

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:-//${esc(S.legalName)}//Meetings//EN`,
    "CALSCALE:GREGORIAN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:${m.id}@${SITE.domain}`,
    `SEQUENCE:${m.revision ?? 0}`,
    // DTSTAMP is when this file was produced, distinct from when the meeting is.
    `DTSTAMP:${icsStamp(new Date())}`,
    `DTSTART:${icsStamp(m.startsAt)}`,
    `DTEND:${icsStamp(m.endsAt)}`,
    `SUMMARY:${esc(m.title)}`,
    `DESCRIPTION:${esc(description)}`,
    m.joinUrl ? `URL:${esc(m.joinUrl)}` : "",
    `LOCATION:${esc(m.location || (m.joinUrl ? LABELS[m.provider] : SITE.name))}`,
    `ORGANIZER;CN=${esc(SITE.name)}:mailto:${SITE.email}`,
    `ATTENDEE;CN=${esc(m.investor.name)};ROLE=REQ-PARTICIPANT;RSVP=TRUE:mailto:${m.investor.email}`,
    `ATTENDEE;CN=${esc(m.business.name)};ROLE=REQ-PARTICIPANT;RSVP=TRUE:mailto:${m.business.email}`,
    `STATUS:${m.status === "CANCELLED" ? "CANCELLED" : "CONFIRMED"}`,
    "BEGIN:VALARM",
    "TRIGGER:-PT15M",
    "ACTION:DISPLAY",
    `DESCRIPTION:${esc(m.title)}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);

  return lines.map(fold).join("\r\n") + "\r\n";
}

/** The URL a dashboard offers as "Add to calendar". */
export const icsUrl = (id: string) => `${SITE_ORIGIN}/api/meetings/${id}/ics`;
