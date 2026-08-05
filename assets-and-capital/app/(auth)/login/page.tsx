import type { Metadata } from "next";
import { Suspense } from "react";
import { ShieldCheck } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { LoginForm } from "@/components/auth/login-form";
import { IMAGERY } from "@/lib/imagery";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your Assets & Capital account.",
};

export default function LoginPage() {
  return (
    <section className="grid min-h-dvh lg:grid-cols-2">
      {/* form side */}
      <div className="flex items-center justify-center px-6 py-24">
        <div className="w-full max-w-sm">
          <Logo />
          <h1 className="mt-10 font-display text-3xl font-semibold text-navy-700">Welcome back</h1>
          <p className="mt-2 text-ink/65">Sign in to access your marketplace and matches.</p>
          <div className="mt-8">
            <Suspense fallback={<div className="h-64" />}>
              <LoginForm />
            </Suspense>
          </div>
        </div>
      </div>

      {/* brand side */}
      <div className="relative hidden overflow-hidden bg-ink lg:block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={IMAGERY.handshake.src}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover"
        />
        {/* Flat wash across the whole frame, then a bottom-up gradient behind
            the copy. The panel has to stay legible wherever the photograph is
            light, so the wash does the work rather than a corner gradient. */}
        <div className="absolute inset-0 bg-ink/75" aria-hidden />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/40 to-transparent" aria-hidden />
        <div className="grid-noise absolute inset-0 opacity-20" aria-hidden />

        <div className="relative flex h-full flex-col justify-center px-16 text-white">
          <ShieldCheck className="h-10 w-10 text-brand-500" />

          {/* Copy speaks to both states: the form on the left toggles between
              signing in and creating an account, and its mode lives in a client
              component this page cannot read. */}
          <p className="label-cta mt-8 text-[0.68rem] text-white/70">Join the marketplace</p>
          <h2 className="mt-3 max-w-md font-display text-3xl font-semibold leading-snug text-white">
            See who is raising, and on what terms.
          </h2>
          <p className="mt-4 max-w-md leading-relaxed text-white/85">
            Registering is free. Businesses are screened before they are listed, and every
            opportunity is scored against your written mandate before it reaches you.
          </p>

          <blockquote className="mt-8 max-w-md border-l-2 border-brand-500 pl-4 text-[0.95rem] leading-relaxed text-white/75">
            Businesses are screened before they are listed. Opportunities are scored before they reach you.
          </blockquote>

          <div className="mt-10 grid max-w-md grid-cols-3 gap-6">
            {[
              { v: "15", k: "Match criteria" },
              { v: "14", k: "Sectors" },
              { v: "4", k: "Listing tiers" },
            ].map((s) => (
              <div key={s.k}>
                <p className="font-display text-2xl font-semibold tnum">{s.v}</p>
                <p className="mt-1 text-xs text-white/75">{s.k}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
