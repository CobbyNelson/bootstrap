import { prisma } from "@/lib/prisma";
import { meetingIcs, type MeetingProvider } from "@/lib/meetings";

/**
 * The .ics for one meeting.
 *
 * UNAUTHENTICATED BY NECESSITY. A calendar client fetching this URL carries no
 * session cookie — that is the whole point of handing someone a subscription
 * link — so the entitlement is the unguessable cuid in the path. Nothing
 * sensitive is returned beyond the two names and the join link, which both
 * parties already have.
 *
 * A cancelled meeting still returns a file, with STATUS:CANCELLED, because that
 * is how a calendar is told to remove the event. Returning 404 would leave the
 * old entry sitting in everybody's diary.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const m = await prisma.meeting
    .findUnique({
      where: { id },
      select: {
        id: true, title: true, agenda: true, startsAt: true, endsAt: true,
        provider: true, joinUrl: true, location: true, status: true, slug: true, revision: true,
        investor: { select: { id: true, name: true, email: true } },
        business: { select: { id: true, name: true, email: true } },
      },
    })
    .catch(() => null);

  if (!m) return new Response("Not found", { status: 404 });

  const ics = meetingIcs({
    ...m,
    provider: m.provider as MeetingProvider,
    investor: { ...m.investor, name: m.investor.name || m.investor.email },
    business: { ...m.business, name: m.business.name || m.business.email },
  });

  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      // A filename makes the browser download rather than render it as text.
      "Content-Disposition": `attachment; filename="meeting-${m.id}.ics"`,
      // Never cached: an edited meeting must not be served from a proxy at its
      // old time, and SEQUENCE only helps if the client actually refetches.
      "Cache-Control": "no-store",
    },
  });
}
