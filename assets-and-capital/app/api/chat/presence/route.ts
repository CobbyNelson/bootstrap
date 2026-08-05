import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaff, staffOnline } from "@/lib/chat-server";

/** Public: is anyone on the desk? Drives the live/away badge in the widget. */
export async function GET() {
  return NextResponse.json({ online: await staffOnline() });
}

/**
 * Staff heartbeat. Presence is derived from the timestamp rather than a
 * toggle, so closing the tab takes someone offline on its own — nobody can
 * leave the desk showing "live" all night by forgetting to flip a switch.
 */
export async function POST() {
  const { user, ok } = await requireStaff();
  if (!ok) return NextResponse.json({ error: "Staff only." }, { status: 403 });
  await prisma.user.update({ where: { id: user.id }, data: { staffSeenAt: new Date() } });
  return NextResponse.json({ ok: true, online: true });
}
