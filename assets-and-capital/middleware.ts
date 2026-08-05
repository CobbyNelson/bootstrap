import { NextResponse } from "next/server";
import { splitLocale, DEFAULT_LOCALE } from "@/lib/i18n/config";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session-core";
import {
  PREVIEW_COOKIE,
  isAllowedWhileLocked,
  isLockEnabled,
  verifyPreviewToken,
} from "@/lib/site-lock";

const ADMIN_ROLES = new Set(["ADMIN", "SUPER_ADMIN", "STAFF"]);

/**
 * Content-Security-Policy.
 *
 * On script-src this uses 'unsafe-inline' rather than a per-request nonce, and
 * that is a measured decision, not an oversight:
 *
 * A nonce must be generated per request, so every page carrying one has to be
 * dynamically rendered. Almost every route here is statically prerendered, and
 * a nonce CSP demonstrably BROKE them — /login's prerendered bootstrap scripts
 * were blocked outright and the page could not hydrate. The alternatives were
 * to force dynamic rendering site-wide (paying a server render on every request
 * for a marketing site with no CDN in front of it) or to accept 'unsafe-inline'.
 *
 * What the policy still buys, which is most of the value: scripts may only load
 * from this origin, so an injected `<script src="evil.example">` is blocked;
 * connect-src 'self' stops exfiltration to another host; form-action 'self'
 * stops a tampered page posting credentials elsewhere; frame-ancestors 'none'
 * kills clickjacking. Stored-content XSS is separately mitigated by allowlist
 * sanitisation at write time (lib/sanitize.ts) and React's default escaping.
 *
 * To upgrade later: add `export const dynamic = "force-dynamic"` to the pages
 * that need it, then swap in `'nonce-${nonce}' 'strict-dynamic'` below.
 */
function buildCsp(isDev: boolean): string {
  return [
    "default-src 'self'",
    // 'unsafe-eval' is React's dev-time error reconstruction only — never prod.
    `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "frame-src 'none'",
    "upgrade-insecure-requests",
  ].join("; ");
}

export async function middleware(req: NextRequest) {
  const { pathname: rawPath } = req.nextUrl;
  const csp = buildCsp(process.env.NODE_ENV === "development");

  // ---- Locale ------------------------------------------------------------
  // /fr/pricing is rewritten to /pricing with the locale carried in a header,
  // so every route exists in four languages without four copies of the route
  // tree. The URL stays distinct, which is what hreflang and a crawler need;
  // a cookie-switched site serves every language from one URL and gets indexed
  // in whichever one the crawler happened to see.
  //
  // Everything below this point works on the STRIPPED path. Doing it here
  // rather than later is what stops /fr/admin bypassing the admin check and
  // /fr/anything bypassing the pre-launch gate — both of which are exactly the
  // kind of hole a prefix scheme introduces if it is applied too late.
  const { locale, path: pathname } = splitLocale(rawPath);
  const localised = locale !== DEFAULT_LOCALE;

  /** Attach CSP (and the nonce Next needs) to any response we return. */
  const withCsp = <T extends NextResponse>(res: T): T => {
    res.headers.set("Content-Security-Policy", csp);
    // Read by the layouts to pick a dictionary and set dir/lang. A header
    // rather than a cookie: it is per-request, so two languages open in two
    // tabs cannot overwrite each other.
    res.headers.set("x-locale", locale);
    return res;
  };

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const user = token ? await verifySessionToken(token) : null;

  // ---- Pre-launch gate -----------------------------------------------------
  // Runs before auth so a locked site leaks nothing at all: not page HTML, not
  // API JSON, not the existence of a route. Staff sessions pass through, so an
  // admin who is already signed in is never locked out by a mislaid code.
  if (isLockEnabled() && !isAllowedWhileLocked(pathname)) {
    const unlocked =
      (await verifyPreviewToken(req.cookies.get(PREVIEW_COOKIE)?.value)) ||
      (user !== null && ADMIN_ROLES.has(user.role));

    if (!unlocked) {
      // API routes get JSON, not the gate's HTML — a fetch() handed a page of
      // markup fails deep inside a client component with a parse error that
      // says nothing about why.
      if (pathname.startsWith("/api/")) {
        return withCsp(
          NextResponse.json({ error: "Site is not yet public." }, { status: 503 }),
        );
      }
      // Redirect rather than rewrite. A rewrite looks tidier (the visitor's URL
      // is preserved) but breaks behind a TLS-terminating proxy: nextUrl carries
      // the external https scheme while the app listens on plain http, so Next
      // resolves the rewrite to an absolute https://localhost:3000/… and fails
      // trying to TLS-proxy to itself. Locally, over http, it works — which is
      // precisely why this only appeared in production.
      const url = req.nextUrl.clone();
      url.pathname = "/coming-soon";
      url.search = "";
      const res = withCsp(NextResponse.redirect(url));
      res.headers.set("X-Robots-Tag", "noindex, nofollow");
      return res;
    }
  }

  // A localised URL is rewritten to the unprefixed route, so /fr/pricing
  // renders the pricing page. Rewrite rather than redirect: the visitor keeps
  // the /fr URL in the address bar, which is the whole point of having it.
  const pass = () => {
    if (!localised) return withCsp(NextResponse.next());
    // Built from req.url, NOT req.nextUrl.clone().
    //
    // Behind Caddy, nextUrl carries the EXTERNAL https origin while the app
    // listens on plain http, so a rewrite target cloned from it resolves to
    // https://localhost:3000 and the proxy fails the TLS handshake against a
    // plaintext socket — every localised page 500s. req.url is the internal
    // origin. This is the same trap the gate hit; it is written down twice
    // because it costs a deploy to rediscover.
    const url = new URL(`${pathname}${req.nextUrl.search}`, req.url);
    return withCsp(NextResponse.rewrite(url, { request: { headers: localeHeaders(req) } }));
  };

  function localeHeaders(request: NextRequest): Headers {
    // Server components read the locale from the REQUEST headers, so it has to
    // be set here as well as on the response.
    const h = new Headers(request.headers);
    h.set("x-locale", locale);
    return h;
  }

  // ---- Authenticated areas -------------------------------------------------
  const guarded = pathname.startsWith("/dashboard") || pathname.startsWith("/admin");
  if (!guarded) return pass();

  if (!user) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return withCsp(NextResponse.redirect(url));
  }

  if (pathname.startsWith("/admin") && !ADMIN_ROLES.has(user.role)) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    return withCsp(NextResponse.redirect(url));
  }

  return pass();
}

export const config = {
  /**
   * Everything except Next's own build output. The gate must see every request:
   * the previous matcher covered only /dashboard and /admin, which is correct
   * for auth but would leave the entire public site exposed.
   */
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
