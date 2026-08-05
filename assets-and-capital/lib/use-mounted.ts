"use client";

import { useSyncExternalStore } from "react";

// Never changes, so React never resubscribes.
const subscribe = () => () => {};
const onClient = () => true;
const onServer = () => false;

/**
 * False while server-rendering and during hydration, true afterwards.
 *
 * Replaces the `useState(false) + useEffect(() => setMounted(true))` idiom.
 * Same result, but it does not schedule a second render on every mount — the
 * value simply differs between the server and client snapshots, which is
 * exactly what useSyncExternalStore is for. Both snapshots are primitives, so
 * there is no reference-identity trap.
 */
export function useMounted(): boolean {
  return useSyncExternalStore(subscribe, onClient, onServer);
}
