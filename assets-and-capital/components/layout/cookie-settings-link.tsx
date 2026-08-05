"use client";

import { OPEN_CONSENT_EVENT } from "@/components/layout/cookie-consent";

/**
 * Reopens the cookie preference centre.
 *
 * GDPR Art. 7(3): withdrawing consent must be as easy as giving it. A banner
 * that appears once and can never be recalled fails that, so this sits
 * permanently in the footer alongside the policy links.
 */
export function CookieSettingsLink({ className }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(OPEN_CONSENT_EVENT))}
      className={className ?? "text-sm text-ink/70 transition-colors hover:text-brand-700"}
    >
      Cookie settings
    </button>
  );
}
