"use client";

import { useSyncExternalStore } from "react";

/**
 * The current time, as a value a component may read while rendering.
 *
 * "Is this meeting joinable yet" is a question about now. Answering it on the
 * server bakes a stale answer — somebody sitting on the page two minutes before
 * a call would never see the button appear — and answering it with
 * `Date.now()` in the render body is an impure read the compiler rejects.
 * Setting state inside an effect to work around that trades one lint error for
 * a cascading render.
 *
 * useSyncExternalStore is the sanctioned way out, and the same one
 * lib/use-collection.ts already uses: the clock is external state, subscribed
 * to rather than sampled. The server snapshot is 0 so the first client render
 * matches the HTML exactly — anything else is a hydration mismatch by
 * construction, and the callers all treat 0 as "not yet".
 */
export function useNow(intervalMs = 30_000): number {
  return useSyncExternalStore(
    (onChange) => {
      const t = setInterval(onChange, intervalMs);
      return () => clearInterval(t);
    },
    () => Date.now(),
    () => 0,
  );
}
