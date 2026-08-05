"use client";

import { useEffect } from "react";

/**
 * Marks a signed-in staff member as on the desk while they have the site open.
 *
 * Mounted globally rather than only in the admin area, because "staff are
 * online" should mean they are reachable anywhere on the site — a colleague
 * reading the marketplace is still available to take a chat.
 *
 * The server decides who counts as staff; a non-staff caller just gets a 403
 * and this quietly stops.
 */
const BEAT_MS = 45_000;

export function StaffPresence() {
  useEffect(() => {
    let alive = true;
    let timer: number | undefined;

    const beat = async () => {
      try {
        const res = await fetch("/api/chat/presence", { method: "POST" });
        if (!alive) return;
        // Continue ONLY on an explicit staff acknowledgement. Testing for 403
        // is not enough: while the site is behind the pre-launch gate this
        // request is redirected to the gate page, which answers 200 with HTML
        // — not a refusal, so a status check would keep beating every 45s for
        // every visitor, forever, on behalf of nobody.
        const isJson = res.headers.get("content-type")?.includes("application/json");
        const body = res.ok && isJson ? await res.json().catch(() => null) : null;
        if (!body?.ok) return;
        timer = window.setTimeout(beat, BEAT_MS);
      } catch {
        if (alive) timer = window.setTimeout(beat, BEAT_MS);
      }
    };

    beat();
    return () => {
      alive = false;
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  return null;
}
