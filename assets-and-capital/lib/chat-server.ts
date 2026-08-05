import "server-only";
import { cookies } from "next/headers";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export const VISITOR_COOKIE = "ac_chat";
/** A staff member counts as online if they have checked in this recently. */
export const PRESENCE_WINDOW_MS = 70_000;
/** A visitor counts as still on the page on the same basis. */
export const VISITOR_WINDOW_MS = 70_000;

const STAFF_ROLES = ["ADMIN", "SUPER_ADMIN", "STAFF"];

/**
 * The visitor's conversation, created on first message.
 *
 * Identity is a cookie rather than an account, because most people asking a
 * question have not signed up yet — that is usually the question. If they ARE
 * signed in the account is attached too, so staff can see who they are talking
 * to and the thread survives a new device.
 */
export async function getOrCreateConversation() {
  const jar = await cookies();
  const existing = jar.get(VISITOR_COOKIE)?.value;
  const user = await getCurrentUser();

  if (existing) {
    const found = await prisma.chatConversation.findUnique({ where: { visitorKey: existing } });
    if (found) {
      // Adopt the account if they signed in partway through.
      if (user && !found.userId) {
        return prisma.chatConversation.update({
          where: { id: found.id },
          data: { userId: user.id, visitorSeenAt: new Date() },
        });
      }
      return prisma.chatConversation.update({
        where: { id: found.id },
        data: { visitorSeenAt: new Date() },
      });
    }
  }

  const visitorKey = randomUUID();
  const created = await prisma.chatConversation.create({
    data: { visitorKey, userId: user?.id ?? null, name: user?.name ?? null, email: user?.email ?? null },
  });
  return created;
}

/** Set the visitor cookie on a response — the route does this, not this module. */
export function attachVisitorCookie(res: Response, visitorKey: string) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  res.headers.append(
    "Set-Cookie",
    `${VISITOR_COOKIE}=${visitorKey}; Path=/; Max-Age=${60 * 60 * 24 * 30}; HttpOnly; SameSite=Lax${secure}`,
  );
  return res;
}

/** Is anyone on the desk right now? Derived from heartbeats, not a manual toggle. */
export async function staffOnline(): Promise<boolean> {
  const since = new Date(Date.now() - PRESENCE_WINDOW_MS);
  const count = await prisma.user.count({
    where: { role: { in: STAFF_ROLES as never[] }, staffSeenAt: { gte: since } },
  });
  return count > 0;
}

export async function requireStaff() {
  const user = await getCurrentUser();
  if (!user || !STAFF_ROLES.includes(user.role)) return { user: null as never, ok: false as const };
  return { user, ok: true as const };
}

export function visitorIsPresent(seenAt: Date): boolean {
  return Date.now() - seenAt.getTime() < VISITOR_WINDOW_MS;
}
