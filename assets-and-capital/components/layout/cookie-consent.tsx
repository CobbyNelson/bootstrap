"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMounted } from "@/lib/use-mounted";
import { Cookie } from "lucide-react";
import {
  CONSENT_COOKIE,
  CONSENT_MAX_AGE,
  parseConsent,
  serialiseConsent,
} from "@/lib/consent";

/**
 * Cookie banner and preference centre.
 *
 * Opens automatically when no valid consent cookie exists, and can be reopened
 * at any time from the footer — withdrawing consent must be as easy as giving
 * it. "Reject all" sits beside "Accept all" with identical prominence, which is
 * a requirement rather than a style choice.
 */

/** Footer link dispatches this to reopen the preference centre. */
export const OPEN_CONSENT_EVENT = "ac:open-consent";

function writeConsent(analytics: boolean, marketing: boolean) {
  const value = serialiseConsent({ analytics, marketing });
  // Not HttpOnly on purpose: client code must be able to read its own consent
  // state to decide whether to initialise anything. Secure only over https so
  // local http development still works.
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${CONSENT_COOKIE}=${value}; Path=/; Max-Age=${CONSENT_MAX_AGE}; SameSite=Lax${secure}`;
}

function readConsentCookie(): string | undefined {
  return document.cookie
    .split("; ")
    .find((c) => c.startsWith(`${CONSENT_COOKIE}=`))
    ?.split("=")
    .slice(1)
    .join("=");
}

export function CookieConsent() {
  const pathname = usePathname();
  // The cookie can only be read on the client, and reading it must not happen
  // during the server render or hydration would mismatch. `mounted` gates that;
  // the banner then shows on the first client pass rather than after a second
  // render scheduled from an effect.
  const mounted = useMounted();
  const stored = useMemo(() => (mounted ? parseConsent(readConsentCookie()) : null), [mounted]);

  const [reopened, setReopened] = useState(false);
  const [detail, setDetail] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  // Derived, not stored: ask when there is no valid consent yet, or when the
  // visitor reopened the panel from the footer.
  const open = mounted && (reopened || !stored);

  useEffect(() => {
    const reopen = () => {
      // Prefill from the saved choice. This runs in an event handler, so
      // setting state here is exactly what handlers are for.
      const existing = parseConsent(readConsentCookie());
      if (existing) {
        setAnalytics(existing.analytics);
        setMarketing(existing.marketing);
      }
      setDetail(true);
      setReopened(true);
    };
    window.addEventListener(OPEN_CONSENT_EVENT, reopen);
    return () => window.removeEventListener(OPEN_CONSENT_EVENT, reopen);
  }, []);

  // The pre-launch gate sets only strictly necessary cookies, so asking for
  // consent there would be asking about nothing.
  if (pathname === "/coming-soon") return null;
  if (!open) return null;

  function decide(a: boolean, m: boolean) {
    writeConsent(a, m);
    setReopened(false);
    setDetail(false);
    // Reload so server components re-render with the new consent state and any
    // consent-gated script is emitted (or withheld) correctly.
    window.location.reload();
  }

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="cookie-consent-title"
      className="fixed inset-x-0 bottom-0 z-[150] px-4 pb-4"
    >
      <div className="mx-auto max-w-3xl rounded-2xl border border-ink/10 bg-white/95 p-4 shadow-[var(--shadow-lift)] backdrop-blur-md">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <span className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
            <Cookie className="h-5 w-5" />
          </span>
          <div className="flex-1">
            <h2 id="cookie-consent-title" className="text-sm font-semibold text-ink">
              Your cookie choices
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-ink/70">
              We use cookies that are necessary to run the platform. With your
              permission we would also measure how it is used. See our{" "}
              <Link
                href="/legal/cookies"
                className="font-medium text-brand-700 underline-offset-2 hover:underline"
              >
                cookie policy
              </Link>
              .
            </p>
          </div>
        </div>

        {detail && (
          <div className="mt-4 space-y-3 border-t border-ink/10 pt-4">
            <Row
              title="Strictly necessary"
              description="Sign-in, security and your cookie choices. Always on — the platform cannot work without them."
              checked
              disabled
            />
            <Row
              title="Analytics"
              description="Aggregate usage measurement, so we can see which parts of the platform are useful."
              checked={analytics}
              onChange={setAnalytics}
            />
            <Row
              title="Marketing"
              description="Advertising and retargeting. We do not currently use these; the choice is here so nothing can be added without your say."
              checked={marketing}
              onChange={setMarketing}
            />
          </div>
        )}

        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            onClick={() => setDetail((d) => !d)}
            className="rounded-full px-4 py-2 text-sm font-medium text-ink/70 underline-offset-2 transition-colors hover:text-ink hover:underline"
          >
            {detail ? "Hide options" : "Manage options"}
          </button>
          {detail && (
            <button
              onClick={() => decide(analytics, marketing)}
              className="rounded-full border border-ink/15 px-4 py-2 text-sm font-medium text-ink/80 transition-colors hover:border-ink/30"
            >
              Save choices
            </button>
          )}
          {/* Reject and Accept share styling weight deliberately: an easier
              "accept" than "reject" is a dark pattern regulators call out. */}
          <button
            onClick={() => decide(false, false)}
            className="rounded-full border border-ink/15 px-5 py-2 text-sm font-semibold text-ink/80 transition-colors hover:border-ink/30"
          >
            Reject all
          </button>
          <button
            onClick={() => decide(true, true)}
            className="rounded-full bg-brand-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
          >
            Accept all
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({
  title,
  description,
  checked,
  disabled,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange?: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.checked)}
        className="mt-1 h-4 w-4 flex-none accent-brand-600 disabled:opacity-60"
      />
      <span>
        <span className="block text-sm font-medium text-ink">
          {title}
          {disabled && <span className="ml-2 text-xs font-normal text-ink/50">Always on</span>}
        </span>
        <span className="mt-0.5 block text-xs leading-relaxed text-ink/60">{description}</span>
      </span>
    </label>
  );
}
