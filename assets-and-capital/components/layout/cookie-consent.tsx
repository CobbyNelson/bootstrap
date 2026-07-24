"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Cookie } from "lucide-react";

const KEY = "ac_cookie_consent";

export function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) setShow(true);
    } catch {
      /* ignore */
    }
  }, []);

  function decide(value: "accepted" | "declined") {
    try {
      localStorage.setItem(KEY, value);
    } catch {
      /* ignore */
    }
    setShow(false);
    // Integration seam: toggle analytics/marketing scripts based on `value`.
  }

  if (!show) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[150] px-4 pb-4">
      <div className="mx-auto flex max-w-3xl flex-col items-start gap-4 rounded-2xl border border-ink/10 bg-white/95 p-4 shadow-[var(--shadow-lift)] backdrop-blur-md sm:flex-row sm:items-center">
        <span className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
          <Cookie className="h-5 w-5" />
        </span>
        <p className="flex-1 text-sm leading-relaxed text-ink/70">
          We use cookies to run the platform, remember your preferences and understand how it&apos;s used. See our{" "}
          <Link href="/legal/cookies" className="font-medium text-brand-600 underline-offset-2 hover:underline">
            cookie policy
          </Link>
          .
        </p>
        <div className="flex w-full flex-none gap-2 sm:w-auto">
          <button
            onClick={() => decide("declined")}
            className="flex-1 rounded-full border border-ink/12 px-4 py-2 text-sm font-medium text-ink/70 transition-colors hover:border-ink/25 sm:flex-none"
          >
            Decline
          </button>
          <button
            onClick={() => decide("accepted")}
            className="flex-1 rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700 sm:flex-none"
          >
            Accept all
          </button>
        </div>
      </div>
    </div>
  );
}
