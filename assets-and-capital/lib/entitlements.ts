"use client";

import { useCallback, useEffect, useState } from "react";
import { useCollection } from "@/lib/use-collection";

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

function readSub(): Subscription {
  try {
    const raw = localStorage.getItem(SUB_KEY);
    if (!raw) return { active: false, plan: null };
    const p = JSON.parse(raw);
    return { active: !!p.active, plan: p.plan ?? null };
  } catch {
    return { active: false, plan: null };
  }
}

export function useSubscription() {
  const [sub, setSub] = useState<Subscription>({ active: false, plan: null });

  useEffect(() => {
    setSub(readSub());
    const onStorage = (e: StorageEvent) => {
      if (e.key === SUB_KEY) setSub(readSub());
    };
    const onCustom = () => setSub(readSub());
    window.addEventListener("storage", onStorage);
    window.addEventListener(SUB_EVT, onCustom);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(SUB_EVT, onCustom);
    };
  }, []);

  const write = useCallback((next: Subscription) => {
    try {
      localStorage.setItem(SUB_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
    window.dispatchEvent(new Event(SUB_EVT));
  }, []);

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
