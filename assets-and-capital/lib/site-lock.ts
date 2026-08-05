import { SignJWT, jwtVerify } from "jose";

/**
 * Pre-launch site lock: the whole site hides behind a "coming soon" page until
 * a visitor enters the bypass code.
 *
 * Edge-safe (jose only, no next/headers, no Node APIs) because middleware runs
 * on the edge runtime and is where the gate has to live — a gate implemented in
 * page components leaks content through API routes and RSC payloads.
 *
 * The unlock cookie holds a SIGNED token rather than a boolean. A plain
 * `unlocked=1` cookie would be forgeable by anyone who guessed the name, which
 * would make the whole lock decorative.
 */

export const PREVIEW_COOKIE = "ac_preview";
export const PREVIEW_MAX_AGE = 60 * 60 * 24 * 30; // 30 days
const ALG = "HS256";

function key() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set");
  return new TextEncoder().encode(secret);
}

/**
 * The lock is ON whenever SITE_UNLOCK_CODE is set, and OFF when it is absent.
 * Deliberately fail-closed on presence, not on a separate boolean flag: one
 * variable cannot drift out of sync with itself, whereas SITE_LOCKED=true plus
 * an empty code would lock everyone out permanently, and SITE_LOCKED=false with
 * a code set would silently publish the site.
 */
export function isLockEnabled(): boolean {
  return Boolean(process.env.SITE_UNLOCK_CODE?.trim());
}

/**
 * Constant-time-ish comparison. Not a true crypto compare (edge runtime has no
 * timingSafeEqual), but it always walks the full length, so it does not leak
 * the code's prefix through response timing the way `===` on short-circuit can.
 */
export function codeMatches(input: string): boolean {
  const expected = process.env.SITE_UNLOCK_CODE?.trim() ?? "";
  if (!expected) return false;
  const a = new TextEncoder().encode(input.trim());
  const b = new TextEncoder().encode(expected);
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    diff |= (a[i] ?? 0) ^ (b[i] ?? 0);
  }
  return diff === 0;
}

export async function signPreviewToken(): Promise<string> {
  return new SignJWT({ preview: true })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(key());
}

export async function verifyPreviewToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, key());
    return payload.preview === true;
  } catch {
    return false;
  }
}

/**
 * Paths that stay reachable while locked. Kept deliberately short — every entry
 * is a hole in the gate.
 *
 * `/coming-soon` is the gate page itself, `/api/site-unlock` is how a code gets
 * submitted, and the legal pages stay public because a site that collects any
 * personal data (the unlock attempt is logged, the cookie is set) must be able
 * to explain that to a visitor. Everything else 404s or renders the gate.
 */
const ALWAYS_ALLOWED = ["/coming-soon", "/api/site-unlock", "/legal"];

export function isAllowedWhileLocked(pathname: string): boolean {
  if (ALWAYS_ALLOWED.some((p) => pathname === p || pathname.startsWith(p + "/"))) return true;
  // Next internals and the favicon: the gate page itself cannot render without them.
  if (pathname.startsWith("/_next/")) return true;
  if (pathname === "/favicon.ico" || pathname === "/robots.txt") return true;
  // Images used by the gate page. /api/media is user-uploaded content and is
  // NOT included — that would expose exactly what we are hiding.
  if (pathname.startsWith("/img/")) return true;
  return false;
}
