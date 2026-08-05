"use client";

/**
 * Shared plumbing for state that actually lives in localStorage.
 *
 * These used to be `useState([]) + useEffect(() => setItems(read()))`, which
 * works but renders twice on every mount (empty, then the real value) and is
 * the pattern React's `set-state-in-effect` rule exists to discourage. The
 * correct primitive is useSyncExternalStore: localStorage IS an external store,
 * and this tells React how to read it and how to hear about changes.
 *
 * The one trap: `getSnapshot` must return the SAME reference until the stored
 * data actually changes, or React re-renders forever comparing fresh objects.
 * Hence the cache below, keyed by the raw string we last parsed.
 */

type Entry = { raw: string | null; parsed: unknown };
const cache = new Map<string, Entry>();

function rawOf(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** Subscribe to a key: other tabs via `storage`, this tab via a custom event. */
export function subscribeTo(key: string, event: string) {
  return (onChange: () => void) => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === key) onChange();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener(event, onChange);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(event, onChange);
    };
  };
}

/**
 * Read `key`, parsing only when the underlying string has changed so the
 * returned reference stays stable across renders.
 */
export function snapshotOf<T>(key: string, parse: (raw: string | null) => T): T {
  const raw = rawOf(key);
  const hit = cache.get(key);
  if (hit && hit.raw === raw) return hit.parsed as T;
  const parsed = parse(raw);
  cache.set(key, { raw, parsed });
  return parsed;
}

/** Write, then tell this tab (the `storage` event only fires in OTHER tabs). */
export function writeTo(key: string, value: unknown, event: string) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota or privacy mode — the UI still works, it just will not persist */
  }
  window.dispatchEvent(new Event(event));
}
