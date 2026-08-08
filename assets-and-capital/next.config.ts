import type { NextConfig } from "next";

// Baseline security headers. CSP is NOT here — it needs a per-request nonce, so
// it is built in middleware.ts where one can be generated.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  {
    key: "Permissions-Policy",
    // Deny the powerful APIs outright. This app needs none of them, and an
    // explicit denial is what stops an injected iframe or script from asking.
    value:
      "camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=(), interest-cohort=()",
  },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  // Isolates this origin's browsing context group: blocks cross-origin window
  // handles (tabnabbing) and is a precondition for cross-origin isolation.
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  // Stops other sites embedding our resources (including uploaded media).
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  // Legacy Flash/PDF cross-domain policy files — deny explicitly.
  { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
];

const nextConfig: NextConfig = {
  /**
   * Standalone output for the VPS: `next build` traces exactly the modules the
   * server needs into .next/standalone (a few tens of MB) instead of shipping
   * the 800MB node_modules tree. The deploy scripts under deploy/ rsync that
   * directory plus .next/static and public.
   */
  output: "standalone",
  /**
   * This app lives in a SUBDIRECTORY of the bootstrap fork, and the repo root
   * has its own package.json — without this, Next treats the repo root as the
   * workspace root and file tracing resolves against the wrong tree.
   */
  outputFileTracingRoot: __dirname,
  /**
   * lib/media-store.ts resolves MEDIA_DIR at runtime, which defeats static
   * tracing and makes Next copy the whole project into standalone. The
   * turbopackIgnore hint is not honoured for path.resolve, so prune here:
   * `public` is rsynced alongside the artifact by the deploy scripts, and
   * `storage` is user uploads — those must never travel inside a build.
   */
  outputFileTracingExcludes: {
    "*": [
      "public/**",
      "storage/**",
      "docs/**",
      "e2e/**",
      "scripts/**",
      "package-lock.json",
      "tsconfig.tsbuildinfo",
    ],
  },
  /**
   * English lives at the root; the other three languages live in subfolders.
   *
   * `/pricing` IS the English pricing page — it does not redirect anywhere. The
   * pages themselves live under app/[locale], so the request is rewritten onto
   * `/en/pricing` internally and the visitor's URL never changes.
   *
   * WHY HERE AND NOT IN MIDDLEWARE. Middleware tried exactly this and failed
   * three times behind the VPS's TLS-terminating proxy (see the note in
   * middleware.ts): `NextResponse.rewrite()` takes an absolute URL, `nextUrl`
   * reports an origin matching neither the request nor the server, and Next
   * dials anything it does not recognise as internal — so the rewrite left the
   * process and could not get back in. The workaround at the time was to give
   * up on unprefixed English and 308 `/pricing` to `/en/pricing`.
   *
   * A config rewrite is a different mechanism, not a retry of the same one. It
   * is an entry in Next's own routing table, matched inside the router before
   * the filesystem is consulted. No URL is constructed, no origin is resolved,
   * nothing is dialled — so the proxy cannot participate in it at all.
   *
   * `beforeFiles` specifically, because the destination is a real route: with
   * `afterFiles` the filesystem is checked first, `/pricing` 404s, and the
   * rewrite never runs.
   *
   * THE SOURCE PATTERN excludes, in order: the four locale prefixes (so
   * `/fr/pricing` is left alone and `/en/pricing` can be redirected by
   * middleware rather than rewritten into itself), the routes that do not live
   * under app/[locale], and anything with a file extension. Each alternative is
   * anchored with `(?:/|$)` so a page called `/energy` or `/apiary` is not
   * mistaken for `/en` or `/api` — a plain `(?!en|api)` would swallow both.
   */
  async rewrites() {
    const RESERVED = [
      // Locale prefixes: already routed, or handled by middleware.
      "en", "fr", "es", "ar",
      // Not under app/[locale]. Kept in step with NOT_LOCALISED in middleware.ts.
      "api", "admin", "dashboard", "chat", "coming-soon", "login", "logout", "security", "_next",
    ].join("|");

    return {
      beforeFiles: [
        { source: "/", destination: "/en" },
        {
          source: `/:path((?!(?:${RESERVED})(?:/|$))(?!.*\\.[a-zA-Z0-9]+$).*)`,
          destination: "/en/:path",
        },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        // Design imagery in public/. Next serves these with max-age=0 by
        // default, so every navigation re-requested every photograph — the
        // repeat-visit cost of a site whose pages are mostly pictures.
        // Thirty days rather than immutable: the filenames are not
        // content-hashed, so a replaced image must still be able to win.
        source: "/img/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=2592000, stale-while-revalidate=86400" },
        ],
      },
      {
        // Fonts are content-hashed by the build, so they can be pinned hard.
        source: "/_next/static/media/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

export default nextConfig;
