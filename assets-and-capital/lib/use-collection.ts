"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { snapshotOf, subscribeTo, writeTo } from "@/lib/local-store";

/** Stable empty array: returned on the server and whenever nothing is stored.
 *  A fresh `[]` here would be a new reference every render and loop React. */
const EMPTY: string[] = [];

function parseList(raw: string | null): string[] {
  if (!raw) return EMPTY;
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v : EMPTY;
  } catch {
    return EMPTY;
  }
}

/**
 * A localStorage-backed string set that stays in sync across components in the
 * same tab (custom event) and across tabs (storage event).
 *
 * Backed by useSyncExternalStore rather than state-plus-effect: the value is
 * correct on the very first client render instead of flashing empty, and React
 * can read it safely while rendering concurrently.
 */
export function useCollection(key: string, max = Number.POSITIVE_INFINITY) {
  const evt = `ac-collection-${key}`;

  const subscribe = useMemo(() => subscribeTo(key, evt), [key, evt]);
  const getSnapshot = useCallback(() => snapshotOf(key, parseList), [key]);
  const getServerSnapshot = useCallback(() => EMPTY, []);

  const items = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const persist = useCallback((next: string[]) => writeTo(key, next, evt), [key, evt]);

  const has = useCallback((id: string) => items.includes(id), [items]);

  const toggle = useCallback(
    (id: string) => {
      // Re-read rather than trusting `items`: two components sharing this key
      // can both be mid-render with an older snapshot.
      const cur = snapshotOf(key, parseList);
      if (cur.includes(id)) {
        persist(cur.filter((x) => x !== id));
      } else {
        if (cur.length >= max) return;
        persist([...cur, id]);
      }
    },
    [key, max, persist],
  );

  const remove = useCallback(
    (id: string) => persist(snapshotOf(key, parseList).filter((x) => x !== id)),
    [key, persist],
  );
  const clear = useCallback(() => persist(EMPTY), [persist]);

  return { items, has, toggle, remove, clear, count: items.length, full: items.length >= max };
}

export const useSaved = () => useCollection("ac_saved_v1");
export const useCompare = () => useCollection("ac_compare_v1", 3);
