import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { getKpis } from "@/lib/admin-queries";

/**
 * How much is waiting for a decision.
 *
 * Exists so the sidebar badge can be a fact rather than a constant — it read
 * "6" whatever the queue held. Served rather than passed down as a prop because
 * the shell is a client component wrapping every admin page, and threading the
 * count through each of them would mean every page had to fetch it whether or
 * not it showed the sidebar.
 *
 * Same definition as the overview's KPI, from the same function, so the badge
 * and the card can never disagree.
 */
const ROLES = new Set(["ADMIN", "SUPER_ADMIN", "STAFF"]);

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !ROLES.has(user.role)) {
    return NextResponse.json({ error: "Not permitted." }, { status: 403 });
  }
  const { pendingApprovals } = await getKpis();
  return NextResponse.json({ count: pendingApprovals });
}
