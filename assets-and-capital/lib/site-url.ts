/**
 * The canonical host, on its own so the edge can have it.
 *
 * It lives in SITE.domain too — SITE re-exports this rather than repeating the
 * string, so there is one copy and it cannot drift. The reason for the separate
 * module is that lib/content.ts imports lucide-react, and middleware runs on the
 * edge runtime: importing SITE there would pull an icon library into the bundle
 * on every request to get one hostname.
 *
 * Not read from an env var. This is the site's identity, not its deployment —
 * a canonical URL that changes with an environment variable is a canonical URL
 * that can silently point at a staging host in production.
 */
export const SITE_HOST = "assetsandcapitalltd.com";

export const SITE_ORIGIN = `https://${SITE_HOST}`;
