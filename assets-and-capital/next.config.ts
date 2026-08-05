import type { NextConfig } from "next";

// Baseline security headers. CSP is deliberately omitted here: Next injects
// inline styles/scripts, so a correct policy needs nonce plumbing — tracked as
// follow-up rather than shipped in a form that would break the app.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
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
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
