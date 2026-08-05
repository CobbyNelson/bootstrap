"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { useCollection } from "@/lib/use-collection";
import { snapshotOf, subscribeTo, writeTo } from "@/lib/local-store";

/**
 * Investor access model (front-end demo of the real business rules):
 *   • Free investor  → sees only CORE listing details.
 *   • Paid subscriber → sees FULL business details (financials, risk, compliance).
 *   • Subscriber who has EXPRESSED INTEREST in a business → unlocks that
 *     business's DEAL layer: data room documents, AI profile/scorecard and the
 *     personalised match rate.
 *
 * Businesses list for free; none of this gates them.
 *
 * State is kept in localStorage so the experience is demonstrable without a
 * backend. Real enforcement will move server-side once auth + billing are wired
 * (see docs/BACKEND.md) — the gated data is then fetched only for entitled users.
 */

export type Subscription = { active: boolean; plan: string | null };

const SUB_KEY = "ac_subscription_v1";
const SUB_EVT = "ac-subscription";

/** Stable "not subscribed" object — a fresh literal per read would be a new
 *  reference every render and send useSyncExternalStore into a loop. */
const NO_SUB: Subscription = { active: false, plan: null };

function parseSub(raw: string | null): Subscription {
  if (!raw) return NO_SUB;
  try {
    const p = JSON.parse(raw);
    return { active: !!p.active, plan: p.plan ?? null };
  } catch {
    return NO_SUB;
  }
}

export function useSubscription() {
  // localStorage is an external store; read it through the primitive built for
  // that instead of mirroring it into state inside an effect, which rendered
  // "not subscribed" first and the real value a beat later.
  const subscribe_ = useMemo(() => subscribeTo(SUB_KEY, SUB_EVT), []);
  const getSnapshot = useCallback(() => snapshotOf(SUB_KEY, parseSub), []);
  const getServerSnapshot = useCallback(() => NO_SUB, []);
  const sub = useSyncExternalStore(subscribe_, getSnapshot, getServerSnapshot);

  const write = useCallback((next: Subscription) => writeTo(SUB_KEY, next, SUB_EVT), []);

  const subscribe = useCallback((plan: string) => write({ active: true, plan }), [write]);
  const cancel = useCallback(() => write({ active: false, plan: null }), [write]);

  return { ...sub, subscribe, cancel };
}

/** Businesses this investor has expressed interest in (by slug). */
export const useInterest = () => useCollection("ac_interest_v1");

/** Businesses whose mutual NDA this investor has signed (by slug). */
export const useNDA = () => useCollection("ac_nda_v1");

/** Resolved access level for a single business. */
export function useAccess(slug: string) {
  const { active, plan } = useSubscription();
  const { has } = useInterest();
  const interested = has(slug);
  return {
    subscribed: active,
    plan,
    interested,
    /** full business details (paid subscription) */
    full: active,
    /** deal layer: documents, AI profile, match rate (subscription + interest) */
    deal: active && interested,
  };
}
