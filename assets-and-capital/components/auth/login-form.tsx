"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, Lock, ArrowRight, Loader2 } from "lucide-react";

export function LoginForm() {
  const [status, setStatus] = useState<"idle" | "loading">("idle");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    // Integration seam: Supabase Auth signInWithPassword. Simulated here.
    await new Promise((r) => setTimeout(r, 900));
    setStatus("idle");
  }

  const input = "w-full rounded-xl border border-ink/10 bg-paper-2/60 py-2.5 pl-11 pr-3.5 text-sm text-ink placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-brand-600/30";

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-ink/80">Email</label>
        <div className="relative">
          <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
          <input type="email" required placeholder="you@company.com" className={input} />
        </div>
      </div>
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label className="text-sm font-medium text-ink/80">Password</label>
          <Link href="#" className="text-xs font-medium text-brand-600 hover:text-brand-700">
            Forgot?
          </Link>
        </div>
        <div className="relative">
          <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
          <input type="password" required placeholder="••••••••" className={input} />
        </div>
      </div>
      <button
        type="submit"
        disabled={status === "loading"}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-600 py-3 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:opacity-60"
      >
        {status === "loading" ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Signing in…
          </>
        ) : (
          <>
            Sign in <ArrowRight className="h-4 w-4" />
          </>
        )}
      </button>
      <p className="text-center text-sm text-ink/55">
        New here?{" "}
        <Link href="/register" className="font-medium text-brand-600 hover:text-brand-700">
          Create an account
        </Link>
      </p>
    </form>
  );
}
