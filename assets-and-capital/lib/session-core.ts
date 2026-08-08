import { SignJWT, jwtVerify } from "jose";

// Edge-safe session primitives (jose only — no next/headers, no Node APIs) so
// this can be imported by middleware as well as server code.

export const SESSION_COOKIE = "ac_session";
const ALG = "HS256";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export type SessionUser = { id: string; email: string; name: string | null; role: string };

function key() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set");
  return new TextEncoder().encode(secret);
}

/**
 * `v` is the account's tokenVersion at the moment of signing.
 *
 * Compared against the database on every authenticated request (see
 * getCurrentUser), which is what turns a self-contained token into a revocable
 * one: raising the number on the account invalidates every token issued before
 * it, without a session table.
 */
export async function signSessionToken(user: SessionUser, tokenVersion = 0, mfa = false): Promise<string> {
  return new SignJWT({ email: user.email, name: user.name, role: user.role, v: tokenVersion, m: mfa })
    .setProtectedHeader({ alg: ALG })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(key());
}

/**
 * Signature and expiry ONLY. Deliberately no database.
 *
 * This runs in middleware, on the edge runtime, where Prisma cannot go — so it
 * is a cheap gate that answers "is this token authentic", not "is this account
 * still allowed". The freshness check belongs to getCurrentUser, which runs on
 * the server runtime and is what every route and page actually authorises on.
 *
 * The consequence is deliberate and worth stating: a revoked token still gets
 * PAST middleware, and is then rejected by the page or route behind it. The gate
 * is not the authority.
 */
export async function verifySessionToken(token: string): Promise<(SessionUser & { v: number; m: boolean }) | null> {
  try {
    const { payload } = await jwtVerify(token, key());
    return {
      id: String(payload.sub),
      email: String(payload.email),
      name: (payload.name as string) ?? null,
      role: String(payload.role),
      v: typeof payload.v === "number" ? payload.v : 0,
      // Whether the second factor has been satisfied FOR THIS SESSION.
      //
      // A separate claim rather than a property of the account, because the
      // question is not "does this person use 2FA" — it is "has this particular
      // browser proved it yet". A password alone mints a token with m:false,
      // which is enough to reach the verification screen and nothing else.
      //
      // Absent on tokens issued before 2FA existed, so it defaults to false and
      // those sessions are sent to verify rather than silently trusted.
      m: payload.m === true,
    };
  } catch {
    return null;
  }
}
