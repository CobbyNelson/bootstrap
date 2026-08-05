"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

/**
 * The handful of motion primitives this site actually used framer-motion for.
 *
 * framer-motion was 43KB gzipped on the critical path to provide scroll
 * reveals, two menu transitions and a sliding tab pill. All of it is native
 * platform behaviour: IntersectionObserver for "is it on screen", matchMedia
 * for the motion preference, and CSS for the animation itself.
 *
 * Driving the animation in CSS also fixes something the old setup worked
 * around. globals.css already neutralises animation under
 * prefers-reduced-motion, but those rules could never see transforms that
 * lived in JavaScript — which is why a MotionConfig provider existed purely to
 * re-implement the preference. The stylesheet now covers everything.
 */

/** True once the element has been on screen. Latches — it never goes back. */
export function useInViewOnce<T extends Element>(margin = "-80px") {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;

    // No IntersectionObserver: show the content rather than leave it invisible
    // forever. Deferred a tick so this is not a synchronous setState inside an
    // effect, which cascades an extra render pass on every mount.
    if (typeof IntersectionObserver === "undefined") {
      const t = window.setTimeout(() => setSeen(true), 0);
      return () => window.clearTimeout(t);
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { rootMargin: margin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [seen, margin]);

  return [ref, seen] as const;
}

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(onChange: () => void) {
  const mq = window.matchMedia(REDUCED_QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

/**
 * The OS "reduce motion" preference, kept live if it changes.
 *
 * useSyncExternalStore rather than useState + useEffect: matchMedia is exactly
 * the external mutable source it exists for, and it avoids a first render that
 * claims "no preference" and then corrects itself.
 */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_QUERY).matches,
    // Server default: assume motion is fine. The client corrects on hydration,
    // and erring the other way would strip animation from every prerender.
    () => false,
  );
}

/**
 * Keeps a closing element mounted long enough to animate out.
 *
 * This is the one thing AnimatePresence did that CSS cannot do alone: React
 * unmounts on state change, so an exit animation never gets a frame to run in.
 *
 * `exitMs` must match the CSS duration. Too short truncates the animation; too
 * long leaves an invisible element sitting over the page swallowing clicks.
 */
export function usePresence(open: boolean, exitMs: number) {
  const [lingering, setLingering] = useState(false);
  const wasOpen = useRef(open);

  useEffect(() => {
    const justClosed = wasOpen.current && !open;
    wasOpen.current = open;
    if (!justClosed) return;

    setLingering(true);
    const t = window.setTimeout(() => setLingering(false), exitMs);
    return () => window.clearTimeout(t);
  }, [open, exitMs]);

  return {
    // `open` wins immediately, so opening is never delayed by a render pass.
    mounted: open || lingering,
    state: open ? ("open" as const) : ("closed" as const),
  };
}

/**
 * Writes CSS custom properties straight onto a node.
 *
 * Used for the sliding tab pill, whose position is measured from the DOM. Held
 * as state it would cost a render on every tab change and push the measurement
 * into a layout effect; as a direct write it is one assignment, and the CSS
 * transition still owns the easing.
 */
export function useCssVars<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const set = useCallback((vars: Record<string, string>) => {
    const el = ref.current;
    if (!el) return;
    for (const [k, v] of Object.entries(vars)) el.style.setProperty(k, v);
  }, []);
  return [ref, set] as const;
}
