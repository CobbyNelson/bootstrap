import { NextResponse } from "next/server";
import { splitLocale, DEFAULT_LOCALE } from "@/lib/i18n/config";
import { SITE_ORIGIN } from "@/lib/site-url";
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
 * Surfaces that get no canonical header: they are not public pages, so a
 * canonical would be inviting a crawler to index a signed-in surface.
 *
 * Deliberately checked against the RAW path, not the locale-stripped one — the
 * canonical is about the address the visitor typed.
 */
const NOT_CANONICAL = ["/api", "/admin", "/dashboard", "/chat", "/coming-soon", "/login", "/logout", "/_next"];

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
  // app/[locale] is a real route segment now, so /fr/pricing matches natively
  // and carries its locale as a param — no rewrite, nothing to propagate.
  //
  // Only the default locale is rewritten, /pricing to /en/pricing, so English
  // URLs stay unprefixed. If that rewrite ever loses the header the fallback is
  // already `en`, which is the answer it would have carried anyway.
  //
  // The split happens BEFORE the gate and the admin check, so /fr/admin is
  // seen as /admin and cannot route around either. Covered by tests.
  const { locale, path: pathname, prefixed } = splitLocale(rawPath);

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

  // ---- English has no prefix ----------------------------------------------
  //
  // `/pricing` IS the English pricing page. `/en/pricing` is a second address
  // for the same page, so it is sent home rather than served.
  //
  // This reverses a redirect that used to run in the other direction. That one
  // existed because three attempts at an internal rewrite failed behind this
  // proxy: `NextResponse.rewrite()` takes an absolute URL, `nextUrl` reports an
  // origin matching neither the request nor the server, and Next dials anything
  // it does not recognise as internal — so the rewrite left the process and
  // could not get back in. Giving English a prefix was the way out at the time.
  //
  // The rewrite now lives in next.config.ts. That is a different mechanism, not
  // a fourth attempt at the same one: a routing-table entry matched inside the
  // router, which constructs no URL and dials nothing, so the proxy cannot
  // participate in it. English can therefore sit at the root, and all that is
  // left here is retiring the prefixed form.
  //
  // Above the auth check on purpose. Otherwise `/en/dashboard` signed-out would
  // bounce to /login carrying `?next=/en/dashboard`, and sign-in would land on
  // a URL that only redirects again.
  //
  // 308, not 307: this is the permanent shape of the URL, and only a permanent
  // redirect consolidates a duplicate rather than merely tolerating it.
  if (prefixed && locale === DEFAULT_LOCALE) {
    const url = req.nextUrl.clone();
    url.pathname = pathname;
    return withCsp(NextResponse.redirect(url, 308));
  }

  // Anything else already sits on the route that serves it — /fr/pricing
  // natively, /pricing via the config rewrite. next() with modified request
  // headers is the documented way to hand the locale to the root layout, which
  // owns <html lang dir> and sits above the segment.
  const pass = () => {
    const headers = new Headers(req.headers);
    headers.set("x-locale", locale);
    const res = withCsp(NextResponse.next({ request: { headers } }));

    /**
     * The canonical URL, from the only place that knows it.
     *
     * This used to be `alternates.canonical: "./"` in the site layout, which
     * Next resolves against the pathname. That worked while every locale was
     * prefixed. Once English moved to the root it broke for exactly the pages
     * that are prerendered: they are still ROUTED at /en/…, so /about baked its
     * build-time route and declared itself canonical at /en/about — which now
     * 308s away. Pages rendered per request resolved the same string correctly,
     * so half the site was right and half was wrong, which is worse than either.
     *
     * Here the address the visitor used is simply known: `rawPath` is what
     * arrived, before the config rewrite puts /en on the front of it.
     *
     * A `Link` header rather than a tag because the alternative is going
     * dynamic. Reading a path inside generateMetadata would opt every page under
     * that layout out of prerendering — the regression this codebase has already
     * had three times — to produce markup a header expresses exactly as well.
     *
     * The query string is deliberately dropped, which is what the canonical was
     * there for in the first place: the marketplace takes filter parameters, and
     * without this every combination is a separate URL competing with the rest
     * for the same content.
     */
    const localised = !NOT_CANONICAL.some((p) => rawPath === p || rawPath.startsWith(`${p}/`));
    if (localised && !/\.[a-z0-9]+$/i.test(rawPath)) {
      res.headers.set("Link", `<${SITE_ORIGIN}${rawPath === "/" ? "" : rawPath}>; rel="canonical"`);
    }
    return res;
  };

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
