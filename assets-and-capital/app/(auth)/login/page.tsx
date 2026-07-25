import type { Metadata } from "next";
import { Suspense } from "react";
import { ShieldCheck } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { LoginForm } from "@/components/auth/login-form";

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
        <div className="grid-noise absolute inset-0 opacity-30" aria-hidden />
        <div
          className="absolute -right-24 top-1/4 h-[420px] w-[420px] rounded-full opacity-40 blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(185,28,28,0.4), transparent 60%)" }}
          aria-hidden
        />
        <div className="relative flex h-full flex-col justify-center px-16 text-white">
          <ShieldCheck className="h-10 w-10 text-navy-400" />
          <blockquote className="mt-8 max-w-md font-display text-3xl font-medium leading-snug">
            “The connection between quality assets and ready capital — made simple, credible, and impactful.”
          </blockquote>
          <div className="mt-10 grid max-w-md grid-cols-3 gap-6">
            {[
              { v: "$2.4B", k: "Connected" },
              { v: "1,200+", k: "Opportunities" },
              { v: "46", k: "Countries" },
            ].map((s) => (
              <div key={s.k}>
                <p className="font-display text-2xl font-semibold tnum">{s.v}</p>
                <p className="mt-1 text-xs text-white/65">{s.k}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
