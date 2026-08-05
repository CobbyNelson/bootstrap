import type { Metadata } from "next";
import Link from "next/link";
import { UnlockForm } from "@/components/site-lock/unlock-form";

export const metadata: Metadata = {
  // `absolute` bypasses the root layout's "· Assets & Capital" suffix, which
  // would otherwise render "Assets & Capital — Coming soon · Assets & Capital".
  title: { absolute: "Assets & Capital — Coming soon" },
  description: "A marketplace for private capital. Launching soon.",
  // A pre-launch page must never be indexed: an early crawl can leave
  // "Coming soon" as the search result for the brand long after launch.
  robots: { index: false, follow: false, nocache: true },
};

/**
 * The pre-launch gate. Middleware rewrites every locked request here, so this
 * page is the only thing the public can see until SITE_UNLOCK_CODE is removed.
 *
 * Rendered standalone — no navbar, no footer, no theme toggle — because those
 * carry links into the site being hidden.
 */
export default function ComingSoonPage() {
  return (
    /* Literal #0b0e14 rather than the `ink` token: dark mode deliberately flips
       `ink` to a light value (it drives text colour site-wide), which turned
       this photographic scrim into a near-white wash. A scrim over a photograph
       has to stay dark in both themes, so it must not ride on a flipping token. */
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0b0e14] px-6 py-16">
      {/* Same hero photograph as the live site, so the gate reads as this brand
          rather than a generic placeholder. */}
      <div
        aria-hidden
        className="absolute inset-0 bg-cover bg-center opacity-[0.85]"
        style={{ backgroundImage: "url('/img/hero-tower.webp')" }}
      />
      {/* Lighter at the top so the bridge actually reads, deepening downward to
          hold the copy. Text contrast is checked against the darkest band. */}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-b from-[#0b0e14]/35 via-[#0b0e14]/70 to-[#0b0e14]"
      />

      <div className="relative w-full max-w-lg text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/img/logo.png"
          alt="Assets & Capital"
          className="mx-auto h-11 w-auto brightness-0 invert"
        />

        <p className="mt-10 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-brand-400">
          Launching soon
        </p>
        <h1 className="mt-4 text-balance text-4xl font-bold leading-tight text-white sm:text-5xl">
          Where quality assets
          <br />
          meet <em className="font-serif not-italic text-brand-400">ready capital</em>.
        </h1>
        <p className="mx-auto mt-5 max-w-md text-pretty text-base leading-relaxed text-white/70">
          We are putting the final pieces in place — vetted businesses, matched to
          investor mandates, carried to close by an on-the-ground team.
        </p>

        <UnlockForm />

        {/* white/60, not /40: at 12px over this scrim, /40 measures ~3.4:1 and
            fails WCAG AA (4.5:1). /60 lands around 6:1. */}
        <p className="mt-12 text-xs text-white/60">
          © {new Date().getFullYear()} Assets &amp; Capital Ltd ·{" "}
          <Link href="/legal/privacy" className="underline underline-offset-4 hover:text-white">
            Privacy
          </Link>
        </p>
      </div>
    </main>
  );
}
