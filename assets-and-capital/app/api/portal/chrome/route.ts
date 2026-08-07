import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { getPortalIdentity } from "@/lib/portal-queries";

/**
 * Who is signed into the portal, and what is unread.
 *
 * The dashboard shell decided all of this from the URL: `isBusiness` was
 * `pathname.startsWith("/dashboard/business")`, the sidebar identity was the
 * string "Aurora Family Office / PE mandate" or "Accra FinPay / Gold listing",
 * and the notification dot was a `<span>` with no condition on it.
 *
 * So the workspace you saw depended on the address you typed rather than the
 * account you signed in with, and the name in the corner belonged to nobody.
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const [me, unread] = await Promise.all([
    getPortalIdentity(),
    prisma.notification.count({ where: { userId: user.id, readAt: null } }).catch(() => 0),
  ]);

  if (!me) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  return NextResponse.json({
    me,
    unread,
    // Only staff get the workspace switcher. It was shown to everyone as
    // "View business view", which on a real investor account is a link to
    // somebody else's workspace.
    canSwitch: ["ADMIN", "SUPER_ADMIN", "STAFF"].includes(user.role),
  });
}
