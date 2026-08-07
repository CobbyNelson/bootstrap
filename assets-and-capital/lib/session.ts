import "server-only";
import { cookies } from "next/headers";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE, SESSION_MAX_AGE, signSessionToken, verifySessionToken, type SessionUser } from "./session-core";

export type { SessionUser };

export async function createSession(user: SessionUser): Promise<void> {
  // The version is read at sign-in and baked into the token, so a bump after
  // this moment invalidates it.
  const row = await prisma.user
    .findUnique({ where: { id: user.id }, select: { tokenVersion: true } })
    .catch(() => null);

  const token = await signSessionToken(user, row?.tokenVersion ?? 0);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

/**
 * Sign out, and mean it.
 *
 * Clearing the cookie only asks the browser to forget the token; the token
 * itself stayed valid for the rest of its seven days, so one captured from a
 * shared machine kept working long after somebody thought they had signed out.
 * Bumping the version invalidates it — and every other session that account has
 * open, which is the behaviour somebody signing out of a lost laptop wants.
 */
export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    const claims = await verifySessionToken(token);
    if (claims) {
      await prisma.user
        .update({ where: { id: claims.id }, data: { tokenVersion: { increment: 1 } } })
        .catch(() => null);
    }
  }
  store.delete(SESSION_COOKIE);
}

/**
 * Who is signed in — checked against the database, not just the token.
 *
 * The token used to be the whole answer, which meant two things that are wrong
 * for a platform gating capital commitments on a role:
 *
 *   The ROLE was whatever it was at sign-in. Demoting somebody, or stripping a
 *   compromised account, did nothing for up to seven days. The role now comes
 *   from the row, so a change takes effect on the account's next request.
 *
 *   There was NO REVOCATION at all. A self-contained token with a week's life
 *   and no way to say "not any more" is a credential you cannot take back.
 *   `tokenVersion` is that lever.
 *
 * The cost is one indexed primary-key read per authenticated request, which is
 * the price of being able to revoke. `cache()` collapses it to once per request
 * however many times a page or route asks.
 *
 * A user row that has vanished returns null: an account deleted mid-session
 * stops being signed in.
 */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const claims = await verifySessionToken(token);
  if (!claims) return null;

  try {
    const row = await prisma.user.findUnique({
      where: { id: claims.id },
      select: { id: true, email: true, name: true, role: true, tokenVersion: true },
    });
    if (!row) return null;
    if (row.tokenVersion !== claims.v) return null;

    // The row wins on every field, so a renamed or re-roled account is current.
    return { id: row.id, email: row.email, name: row.name, role: row.role };
  } catch {
    // The database is unreachable. Refusing to authenticate is the only safe
    // answer: treating a signature as sufficient here would restore exactly the
    // stale-privilege hole this exists to close.
    return null;
  }
});

/**
 * Invalidate every session an account holds.
 *
 * Call this wherever a role changes, an account is suspended, or a password is
 * reset — the three moments where a token minted a moment earlier should stop
 * being honoured.
 */
export async function revokeSessions(userId: string): Promise<void> {
  await prisma.user
    .update({ where: { id: userId }, data: { tokenVersion: { increment: 1 } } })
    .catch(() => null);
}
