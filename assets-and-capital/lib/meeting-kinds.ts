/**
 * Meeting shapes that BOTH the server and the browser need.
 *
 * Deliberately free of the `server-only` guard that lib/meetings.ts carries.
 * The dashboard list and the booking desk are client components, and importing
 * the query module for one label map pulls Prisma into the browser bundle —
 * which Turbopack refuses outright, correctly.
 *
 * Nothing here touches the database. If something in this file ever needs to,
 * it belongs in lib/meetings.ts instead.
 */

export type MeetingProvider = "ZOOM" | "GOOGLE_MEET" | "TEAMS" | "IN_PERSON" | "OTHER";

export const PROVIDER_LABEL: Record<MeetingProvider, string> = {
  ZOOM: "Zoom",
  GOOGLE_MEET: "Google Meet",
  TEAMS: "Microsoft Teams",
  IN_PERSON: "In person",
  OTHER: "Video call",
};

export type MeetingRow = {
  id: string;
  title: string;
  agenda: string | null;
  startsAt: Date;
  endsAt: Date;
  provider: MeetingProvider;
  joinUrl: string | null;
  location: string | null;
  status: string;
  slug: string | null;
  investor: { id: string; name: string; email: string };
  business: { id: string; name: string; email: string };
};
