/**
 * Cookie consent model (GDPR Art. 6(1)(a) / ePrivacy).
 *
 * Stored in a first-party COOKIE rather than localStorage so the server can
 * read it during render and simply not emit non-essential scripts — the
 * previous localStorage approach could only hide a banner, which does not
 * satisfy "no non-essential cookies before consent" if any script had been
 * added later.
 *
 * Design points that are legal requirements, not preferences:
 *  - Reject must be exactly as easy as accept (EDPB: no dark patterns), so the
 *    banner has a same-prominence "Reject all" beside "Accept all".
 *  - Nothing is pre-ticked. Absence of a choice means no consent.
 *  - Consent is withdrawable at any time, as easily as it was given — hence the
 *    persistent "Cookie settings" entry in the footer.
 *  - A version is stored so a future change in purposes can re-ask rather than
 *    silently inheriting stale consent.
 */

export const CONSENT_COOKIE = "ac_consent";
export const CONSENT_VERSION = 1;
/** 6 months. EDPB guidance is to re-ask periodically rather than "forever". */
export const CONSENT_MAX_AGE = 60 * 60 * 24 * 182;

export type ConsentCategories = {
  /** Sessions, security, the pre-launch gate. No consent needed, cannot be off. */
  necessary: true;
  /** Aggregate usage measurement. */
  analytics: boolean;
  /** Advertising / retargeting. Nothing uses this yet; the switch exists so it
   *  cannot be added later without a consent path already in place. */
  marketing: boolean;
};

export type ConsentRecord = ConsentCategories & {
  v: number;
  /** ISO timestamp — the "when" half of a demonstrable consent record. */
  at: string;
};

export const DENY_ALL: ConsentRecord = {
  v: CONSENT_VERSION,
  necessary: true,
  analytics: false,
  marketing: false,
  at: "",
};

/**
 * Parse a consent cookie. Anything malformed, older than the current version,
 * or absent yields "no consent" — failing closed is the only safe default.
 */
export function parseConsent(raw: string | undefined): ConsentRecord | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(raw));
    if (typeof parsed !== "object" || parsed === null) return null;
    if (parsed.v !== CONSENT_VERSION) return null;
    return {
      v: CONSENT_VERSION,
      necessary: true,
      analytics: parsed.analytics === true,
      marketing: parsed.marketing === true,
      at: typeof parsed.at === "string" ? parsed.at : "",
    };
  } catch {
    return null;
  }
}

export function serialiseConsent(c: Omit<ConsentRecord, "v" | "at" | "necessary">): string {
  const record: ConsentRecord = {
    v: CONSENT_VERSION,
    necessary: true,
    analytics: c.analytics,
    marketing: c.marketing,
    at: new Date().toISOString(),
  };
  return encodeURIComponent(JSON.stringify(record));
}

/** The cookie table rendered in the cookie policy — one source of truth, so the
 *  published policy cannot drift from what the app actually sets. */
export const COOKIE_REGISTRY = [
  {
    name: "ac_session",
    category: "Strictly necessary",
    purpose: "Keeps you signed in. Signed, HTTP-only.",
    retention: "7 days",
  },
  {
    name: "ac_consent",
    category: "Strictly necessary",
    purpose: "Remembers your cookie choices so we do not ask on every page.",
    retention: "6 months",
  },
  {
    name: "ac_preview",
    category: "Strictly necessary",
    purpose: "Pre-launch access. Only set if you enter a preview code.",
    retention: "30 days",
  },
  {
    name: "ac-theme",
    category: "Strictly necessary",
    purpose: "Remembers light/dark preference. Stored in your browser, not sent to us.",
    retention: "Until cleared",
  },
] as const;
