import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

/**
 * The signed-in user's notifications.
 *
 * The bell in the admin header had no handler and a permanently lit red dot —
 * it claimed unread items on a table with no rows, every minute of every day.
 * A badge that is always on carries no information, and worse, it trains
 * whoever sees it to ignore the one time it matters.
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const [items, unread] = await Promise.all([
    prisma.notification
      .findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 20,
      })
      .catch(() => []),
    prisma.notification.count({ where: { userId: user.id, readAt: null } }).catch(() => 0),
  ]);

  return NextResponse.json({ unread, items });
}

/**
 * Mark as read. Without an id, marks everything — which is what "open the
 * panel and glance at it" actually means, and saves a per-row round trip for a
 * gesture nobody thinks of as twenty actions.
 */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  let body: { id?: string } = {};
  try {
    body = await req.json();
  } catch {
    /* an empty body means "all" */
  }

  await prisma.notification
    .updateMany({
      // Scoped to the caller in both branches. An id alone would let anyone
      // mark anyone's notification read by guessing one.
      where: body.id ? { id: body.id, userId: user.id } : { userId: user.id, readAt: null },
      data: { readAt: new Date() },
    })
    .catch(() => null);

  return NextResponse.json({ ok: true });
}
