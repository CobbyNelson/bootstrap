"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * Reports the current page, once per navigation.
 *
 * Small on purpose — this is the only analytics code that reaches a visitor's
 * browser, and it does not read cookies, storage, canvas, fonts or anything
 * else a fingerprinting script would. It sends a path and a referrer, and the
 * server decides whether that is allowed to become a row.
 *
 * The App Router keeps this mounted across client navigations, so the effect
 * firing on pathname change is what makes SPA routes countable at all — a
 * script tag in <head> would only ever see the first page.
 *
 * Deliberately not sending: screen size, timezone, language, visit duration.
 * Each is another fingerprinting bit, and none answers a question the
 * dashboard asks.
 */
export function PageBeacon() {
  const pathname = usePathname();
  // Guards React's double-invoked effects in development, and a re-render that
  // happens to land on the same path — either would double-count the view.
  const lastSent = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || lastSent.current === pathname) return;
    lastSent.current = pathname;

    const payload = JSON.stringify({
      path: pathname,
      // Only meaningful on the first page of a visit; the server drops
      // same-origin referrers so internal navigation is not counted as traffic
      // we sent ourselves.
      referrer: document.referrer || null,
    });

    // sendBeacon survives the page being closed mid-flight, which a fetch on
    // an unloading document does not. Falls back for browsers without it.
    const sent =
      typeof navigator.sendBeacon === "function" &&
      navigator.sendBeacon("/api/analytics/collect", new Blob([payload], { type: "application/json" }));

    if (!sent) {
      fetch("/api/analytics/collect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true,
      }).catch(() => {
        /* A lost view is not worth surfacing to anyone. */
      });
    }
  }, [pathname]);

  return null;
}
