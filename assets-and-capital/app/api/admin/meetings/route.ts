import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { notify } from "@/lib/notify";
import { listAllMeetings, PROVIDER_LABEL, type MeetingProvider } from "@/lib/meetings";

/**
 * Booking a meeting between an investor and a business.
 *
 * Staff only, and deliberately so: the platform's model is that introductions
 * are brokered rather than self-served — it is what Kwaku declines to do and
 * what the pricing page sells. A participant-facing "book a call" button would
 * contradict the product, so this lives on the desk.
 */
const STAFF = new Set(["ADMIN", "SUPER_ADMIN", "STAFF"]);
const PROVIDERS = new Set(Object.keys(PROVIDER_LABEL));

async function requireStaff() {
  const user = await getCurrentUser();
  return user && STAFF.has(user.role) ? user : null;
}

/** Both dashboards and the desk show this, so all three are refreshed. */
function revalidateMeetingSurfaces() {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/business");
  revalidatePath("/admin/meetings");
}

export async function GET() {
  if (!(await requireStaff())) return NextResponse.json({ error: "Not permitted." }, { status: 403 });

  // The bookable accounts come back with the meetings, so the desk makes one
  // request and cannot offer a party that no longer exists.
  const [meetings, people] = await Promise.all([
    listAllMeetings(),
    prisma.user
      .findMany({
        where: { role: { in: ["INVESTOR", "BUSINESS"] } },
        select: { id: true, name: true, email: true, role: true },
        orderBy: { createdAt: "asc" },
        take: 200,
      })
      .catch(() => []),
  ]);

  return NextResponse.json({
    meetings,
    investors: people.filter((p) => p.role === "INVESTOR").map((p) => ({ id: p.id, label: p.name || p.email })),
    businesses: people.filter((p) => p.role === "BUSINESS").map((p) => ({ id: p.id, label: p.name || p.email })),
  });
}

export async function POST(req: NextRequest) {
  const staff = await requireStaff();
  if (!staff) return NextResponse.json({ error: "Not permitted." }, { status: 403 });

  let b: Record<string, string | undefined> = {};
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  const title = b.title?.trim();
  if (!title) return NextResponse.json({ error: "A title is required." }, { status: 400 });
  if (!b.investorId || !b.businessId) {
    return NextResponse.json({ error: "Pick both an investor and a business." }, { status: 400 });
  }
  if (b.investorId === b.businessId) {
    return NextResponse.json({ error: "A meeting needs two different people." }, { status: 400 });
  }

  const startsAt = new Date(b.startsAt ?? "");
  if (Number.isNaN(startsAt.getTime())) {
    return NextResponse.json({ error: "That start time isn't a valid date." }, { status: 400 });
  }
  const minutes = Math.round(Number(b.durationMins ?? 30));
  if (!Number.isFinite(minutes) || minutes < 5 || minutes > 480) {
    return NextResponse.json({ error: "Duration must be between 5 and 480 minutes." }, { status: 400 });
  }
  const endsAt = new Date(startsAt.getTime() + minutes * 60_000);

  const provider = (b.provider && PROVIDERS.has(b.provider) ? b.provider : "OTHER") as MeetingProvider;

  // A remote meeting with no link is a meeting nobody can attend, so it is
  // refused here rather than discovered at the appointed minute.
  const joinUrl = b.joinUrl?.trim() || null;
  if (provider !== "IN_PERSON" && !joinUrl) {
    return NextResponse.json({ error: "A join link is required for a remote meeting." }, { status: 400 });
  }
  if (joinUrl && !/^https:\/\//i.test(joinUrl)) {
    return NextResponse.json({ error: "The join link must be an https:// URL." }, { status: 400 });
  }

  // Both accounts must exist. Checked rather than trusted: the ids come from a
  // form, and a bad one would create a meeting nobody can see.
  const [investor, business] = await Promise.all([
    prisma.user.findUnique({ where: { id: b.investorId }, select: { id: true, name: true, email: true } }),
    prisma.user.findUnique({ where: { id: b.businessId }, select: { id: true, name: true, email: true } }),
  ]);
  if (!investor || !business) {
    return NextResponse.json({ error: "One of those accounts no longer exists." }, { status: 400 });
  }

  const meeting = await prisma.meeting.create({
    data: {
      title,
      agenda: b.agenda?.trim() || null,
      startsAt,
      endsAt,
      provider,
      joinUrl,
      location: b.location?.trim() || null,
      slug: b.slug?.trim() || null,
      investorId: investor.id,
      businessId: business.id,
      organiserId: staff.id,
    },
    select: { id: true, title: true, startsAt: true },
  });

  // Both sides are told, in their own portal, on the record. Without this the
  // meeting appears silently and depends on somebody noticing it.
  const when = meeting.startsAt.toUTCString();
  await Promise.all([
    notify(investor.id, "announcement", "Meeting scheduled", `${title} with ${business.name || business.email} — ${when}.`),
    notify(business.id, "announcement", "Meeting scheduled", `${title} with ${investor.name || investor.email} — ${when}.`),
  ]);

  revalidateMeetingSurfaces();
  return NextResponse.json({ ok: true, meeting });
}

/** Cancelling. The row is kept so the .ics can tell calendars to remove it. */
export async function DELETE(req: NextRequest) {
  const staff = await requireStaff();
  if (!staff) return NextResponse.json({ error: "Not permitted." }, { status: 403 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });

  const m = await prisma.meeting
    .update({
      where: { id },
      // Cancelled, not deleted, and the revision bumped: a calendar only learns
      // an event is off if it can fetch a file with a HIGHER sequence saying so.
      // Deleting the row would leave it sitting in both diaries forever.
      data: { status: "CANCELLED", revision: { increment: 1 } },
      select: { id: true, title: true, investorId: true, businessId: true },
    })
    .catch(() => null);
  if (!m) return NextResponse.json({ error: "That meeting no longer exists." }, { status: 400 });

  await Promise.all([
    notify(m.investorId, "announcement", "Meeting cancelled", `${m.title} has been cancelled.`),
    notify(m.businessId, "announcement", "Meeting cancelled", `${m.title} has been cancelled.`),
  ]);

  revalidateMeetingSurfaces();
  return NextResponse.json({ ok: true });
}
