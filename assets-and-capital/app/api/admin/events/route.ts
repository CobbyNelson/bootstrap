import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { LOCALES } from "@/lib/i18n/config";

/** Publishing an event puts it on the public site, so this is an admin action. */
const ROLES = new Set(["ADMIN", "SUPER_ADMIN"]);

async function guard() {
  const user = await getCurrentUser();
  return user && ROLES.has(user.role) ? user : null;
}

/**
 * The public events page is prerendered per locale, so a change here has to
 * drop those paths or the new event waits out the revalidation window while the
 * admin looks at a list that already contains it.
 */
function publish() {
  for (const locale of LOCALES) revalidatePath(`/${locale}/events`);
}

function parse(body: Record<string, unknown>) {
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const type = typeof body.type === "string" ? body.type.trim() : "";
  const location = typeof body.location === "string" ? body.location.trim() : "";
  const dateRaw = typeof body.date === "string" ? body.date : "";
  const date = dateRaw ? new Date(dateRaw) : null;

  if (!title) return { error: "A title is required." as const };
  if (!type) return { error: "A type is required." as const };
  if (!date || Number.isNaN(date.getTime())) return { error: "A valid date is required." as const };

  return { data: { title, type, location: location || null, date } };
}

export async function POST(req: NextRequest) {
  if (!(await guard())) return NextResponse.json({ error: "Admins only." }, { status: 403 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = parse(body);
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const event = await prisma.event.create({ data: parsed.data });
  publish();
  return NextResponse.json({ ok: true, event });
}

export async function PATCH(req: NextRequest) {
  if (!(await guard())) return NextResponse.json({ error: "Admins only." }, { status: 403 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const id = typeof body.id === "string" ? body.id : "";
  if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });

  const parsed = parse(body);
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const event = await prisma.event.update({ where: { id }, data: parsed.data }).catch(() => null);
  if (!event) return NextResponse.json({ error: "That event no longer exists." }, { status: 404 });
  publish();
  return NextResponse.json({ ok: true, event });
}

export async function DELETE(req: NextRequest) {
  if (!(await guard())) return NextResponse.json({ error: "Admins only." }, { status: 403 });

  // Query param rather than a body, matching the articles and media routes —
  // one convention across the admin APIs is worth more than each being ideal.
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });

  await prisma.event.delete({ where: { id } }).catch(() => null);
  publish();
  return NextResponse.json({ ok: true });
}
