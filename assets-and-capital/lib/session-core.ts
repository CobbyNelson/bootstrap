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

export async function signSessionToken(user: SessionUser): Promise<string> {
  return new SignJWT({ email: user.email, name: user.name, role: user.role })
    .setProtectedHeader({ alg: ALG })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(key());
}

export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, key());
    return {
      id: String(payload.sub),
      email: String(payload.email),
      name: (payload.name as string) ?? null,
      role: String(payload.role),
    };
  } catch {
    return null;
  }
}
