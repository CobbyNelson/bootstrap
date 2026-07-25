import "server-only";

/**
 * Fixed-window rate limiter. In-memory per instance — enough to blunt
 * credential stuffing on a single node. Swap the store for Redis/Upstash when
 * running multi-instance (the call sites don't change).
 */
type Entry = { count: number; resetAt: number };
const buckets = new Map<string, Entry>();

export function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean; retryAfterSec: number } {
  const now = Date.now();
  const hit = buckets.get(key);

  if (!hit || now >= hit.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterSec: 0 };
  }
  hit.count += 1;
  if (hit.count > limit) {
    return { ok: false, retryAfterSec: Math.max(1, Math.ceil((hit.resetAt - now) / 1000)) };
  }
  return { ok: true, retryAfterSec: 0 };
}

// Opportunistic cleanup so the map can't grow without bound.
export function sweep() {
  const now = Date.now();
  for (const [k, v] of buckets) if (now >= v.resetAt) buckets.delete(k);
}
