"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RefreshCw, Home, AlertTriangle } from "lucide-react";
import { Logo } from "@/components/layout/logo";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Integration seam: forward to your error-reporting service (e.g. Sentry).
    console.error(error);
  }, [error]);

  return (
    <main className="grid min-h-dvh place-items-center px-6 py-16">
      <div className="w-full max-w-lg text-center">
        <div className="flex justify-center">
          <Logo />
        </div>
        <span className="mx-auto mt-10 grid h-16 w-16 place-items-center rounded-2xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
          <AlertTriangle className="h-8 w-8" />
        </span>
        <h1 className="mt-6 font-display text-2xl font-bold text-navy-700">Something went wrong</h1>
        <p className="mx-auto mt-3 max-w-sm text-ink/60">
          An unexpected error occurred. You can try again, or head back home while we look into it.
        </p>
        {error?.digest && <p className="mt-2 text-xs text-ink/60">Reference: {error.digest}</p>}
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 rounded-[var(--radius-button)] bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
          >
            <RefreshCw className="h-4 w-4" /> Try again
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-[var(--radius-button)] border border-ink/12 bg-white px-5 py-3 text-sm font-semibold text-ink transition-colors hover:border-ink/25"
          >
            <Home className="h-4 w-4" /> Back home
          </Link>
        </div>
      </div>
    </main>
  );
}
