"use client";

import { useCallback, useEffect, useState } from "react";

function read(key: string): string[] {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch {
    return [];
  }
}

/**
 * A localStorage-backed string set that stays in sync across components in the
 * same tab (custom event) and across tabs (storage event).
 */
export function useCollection(key: string, max = Number.POSITIVE_INFINITY) {
  const [items, setItems] = useState<string[]>([]);
  const evt = `ac-collection-${key}`;

  useEffect(() => {
    setItems(read(key));
    const onStorage = (e: StorageEvent) => {
      if (e.key === key) setItems(read(key));
    };
    const onCustom = () => setItems(read(key));
    window.addEventListener("storage", onStorage);
    window.addEventListener(evt, onCustom);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(evt, onCustom);
    };
  }, [key, evt]);

  const persist = useCallback(
    (next: string[]) => {
      try {
        localStorage.setItem(key, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      window.dispatchEvent(new Event(evt));
    },
    [key, evt]
  );

  const has = useCallback((id: string) => items.includes(id), [items]);

  const toggle = useCallback(
    (id: string) => {
      const cur = read(key);
      if (cur.includes(id)) {
        persist(cur.filter((x) => x !== id));
      } else {
        if (cur.length >= max) return;
        persist([...cur, id]);
      }
    },
    [key, max, persist]
  );

  const remove = useCallback((id: string) => persist(read(key).filter((x) => x !== id)), [key, persist]);
  const clear = useCallback(() => persist([]), [persist]);

  return { items, has, toggle, remove, clear, count: items.length, full: items.length >= max };
}

export const useSaved = () => useCollection("ac_saved_v1");
export const useCompare = () => useCollection("ac_compare_v1", 3);
