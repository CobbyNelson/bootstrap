import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

/**
 * Everything the admin sidebar and header need to stop being decorative.
 *
 * Three separate fictions lived in that chrome: the profile said "Platform
 * Admin / Super admin" to whoever was signed in, the notification bell carried
 * a permanently lit dot, and "Active team" listed four invented initials with a
 * "+12" — sixteen colleagues on a platform with three accounts.
 *
 * One endpoint rather than three because the shell wraps every admin page and
 * mounts once. Three round trips on every navigation to populate one sidebar is
 * a cost paid on each page for no benefit.
 */
const ROLES = new Set(["ADMIN", "SUPER_ADMIN", "STAFF"]);

const initials = (name: string | null, email: string) =>
  (name || email)
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("") || "?";

const LABEL: Record<string, string> = {
  SUPER_ADMIN: "Super admin",
  ADMIN: "Admin",
  STAFF: "Staff",
};

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !ROLES.has(user.role)) {
    return NextResponse.json({ error: "Not permitted." }, { status: 403 });
  }

  const [team, unread] = await Promise.all([
    prisma.user
      .findMany({
        where: { role: { in: ["ADMIN", "SUPER_ADMIN", "STAFF"] } },
        select: { id: true, name: true, email: true, role: true },
        orderBy: { createdAt: "asc" },
        take: 12,
      })
      .catch(() => []),
    prisma.notification.count({ where: { userId: user.id, readAt: null } }).catch(() => 0),
  ]);

  return NextResponse.json({
    me: {
      name: user.name || user.email,
      role: LABEL[user.role] ?? user.role,
      initials: initials(user.name, user.email),
    },
    team: team.map((t) => ({
      id: t.id,
      initials: initials(t.name, t.email),
      name: t.name || t.email,
      role: LABEL[t.role] ?? t.role,
    })),
    unread,
  });
}
