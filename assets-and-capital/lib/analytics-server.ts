import "server-only";
import { createHash, randomBytes } from "node:crypto";

/**
 * Visitor identity that expires by construction.
 *
 * The problem with analytics is not counting — it is that the obvious way to
 * count people creates a permanent identifier, and a permanent identifier is a
 * profile whether or not anyone intends to use it as one.
 *
 * So: a visitor is the hash of (salt, IP, user agent). The salt is random, held
 * only in memory, and thrown away at midnight UTC. Consequences, all deliberate:
 *
 *   - Two views by the same person on the same day collapse to one visitor.
 *   - The same person tomorrow is a different, unlinkable row.
 *   - Nobody can work backwards from a stored hash to an IP, because the salt
 *     that produced it no longer exists anywhere.
 *   - A restart rotates the salt early. That slightly over-counts uniques for
 *     the rest of that day, which is the right way to be wrong.
 *
 * The IP is used to derive a country and is then dropped. It is never stored.
 */

let salt = randomBytes(32);
let saltDay = utcDay(new Date());

function utcDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function currentSalt(now: Date): Buffer {
  const day = utcDay(now);
  if (day !== saltDay) {
    salt = randomBytes(32);
    saltDay = day;
  }
  return salt;
}

function hash(...parts: (string | Buffer)[]): string {
  const h = createHash("sha256");
  for (const p of parts) h.update(p);
  // 128 bits is far past collision risk at this volume, and half the storage.
  return h.digest("hex").slice(0, 32);
}

export type VisitorKeys = { visitorDay: string; sessionKey: string };

/**
 * Session bucketing without a cookie: the same visitor within the same
 * half-hour window is one session. A visit that straddles a boundary is
 * counted as two, which is the cost of not tracking anyone between visits.
 */
const SESSION_MINUTES = 30;

export function visitorKeys(ip: string, userAgent: string, now = new Date()): VisitorKeys {
  const s = currentSalt(now);
  const visitorDay = hash(s, ip, userAgent);
  const bucket = Math.floor(now.getTime() / (SESSION_MINUTES * 60_000));
  return { visitorDay, sessionKey: hash(s, ip, userAgent, String(bucket)) };
}

/**
 * Device class, OS and browser from the user agent.
 *
 * Coarse on purpose. A precise UA string is a fingerprint; "mobile / Android /
 * Chrome" answers the question the dashboard actually asks — do we need to care
 * about small screens — without narrowing anyone down.
 */
export function parseUserAgent(ua: string): { device: string; os: string | null; browser: string | null } {
  const s = ua.toLowerCase();

  const tablet = /ipad|tablet|playbook|silk|(android(?!.*mobile))/.test(s);
  const mobile = /iphone|ipod|android.*mobile|windows phone|blackberry|opera mini|iemobile/.test(s);
  const device = tablet ? "tablet" : mobile ? "mobile" : "desktop";

  const os =
    /iphone|ipad|ipod/.test(s) ? "iOS"
    : /android/.test(s) ? "Android"
    : /mac os x|macintosh/.test(s) ? "macOS"
    : /windows/.test(s) ? "Windows"
    : /linux/.test(s) ? "Linux"
    : null;

  // Order matters: every one of these also claims to be Safari or Chrome.
  const browser =
    /edg\//.test(s) ? "Edge"
    : /opr\/|opera/.test(s) ? "Opera"
    : /samsungbrowser/.test(s) ? "Samsung Internet"
    : /firefox\//.test(s) ? "Firefox"
    : /chrome\/|crios/.test(s) ? "Chrome"
    : /safari\//.test(s) ? "Safari"
    : null;

  return { device, os, browser };
}

/** Obvious non-humans. Not exhaustive — it is a filter, not a defence. */
const BOT = /bot|crawler|spider|crawling|slurp|bingpreview|headlesschrome|lighthouse|pagespeed|curl\/|wget\/|python-requests|node-fetch|axios\/|monitoring|uptime|pingdom|semrush|ahrefs|dataprovider|facebookexternalhit|preview/i;

export function looksLikeBot(ua: string): boolean {
  return !ua || ua.length < 12 || BOT.test(ua);
}

/** Referrer host only — a full URL can carry search terms and session tokens. */
export function referrerHost(referrer: string | null, selfHost: string): string | null {
  if (!referrer) return null;
  try {
    const h = new URL(referrer).hostname.replace(/^www\./, "");
    return h === selfHost.replace(/^www\./, "") ? null : h;
  } catch {
    return null;
  }
}

/** Strip query and hash: they carry unlock codes, emails and tokens. */
export function normalisePath(raw: string): string | null {
  if (!raw || !raw.startsWith("/")) return null;
  const clean = raw.split("?")[0].split("#")[0];
  if (clean.length > 300) return null;
  // Collapse trailing slash so "/pricing" and "/pricing/" are one page.
  return clean.length > 1 ? clean.replace(/\/+$/, "") : clean;
}
