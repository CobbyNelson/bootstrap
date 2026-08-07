import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { DEFAULT_WEIGHTS, type Weights } from "@/lib/matching";

/**
 * The matching weights in force, from the database.
 *
 * These decide how every opportunity on the platform is scored against an
 * investor's mandate. The admin page tuned them and saved to localStorage — a
 * key that was written and never read back, not even by the page that wrote it.
 * So an operator could change the scoring model, watch the preview reorder,
 * press Save, see "Saved", and change nothing for a single visitor.
 *
 * React cache(), not unstable_cache: a value an admin edits must not be able to
 * outlive a rebuild in a stale on-disk cache. That exact mistake left nine
 * freshly-seeded translations rendering English through two deploys.
 */
export const SETTING_KEY = "matching.weights";

function coerce(value: unknown): Weights {
  if (!value || typeof value !== "object") return { ...DEFAULT_WEIGHTS };
  const raw = value as Record<string, unknown>;
  const out: Weights = { ...DEFAULT_WEIGHTS };
  for (const key of Object.keys(DEFAULT_WEIGHTS)) {
    const v = raw[key];
    // A stored weight outside 0–100, or of the wrong type, falls back to the
    // default for that dimension rather than poisoning the whole model.
    if (typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= 100) out[key] = v;
  }
  return out;
}

export const getWeights = cache(async (): Promise<Weights> => {
  try {
    const row = await prisma.setting.findUnique({ where: { key: SETTING_KEY } });
    return coerce(row?.value);
  } catch {
    // Scoring must not fail because a settings read did. The defaults are a
    // complete, working model — they are what the platform shipped with.
    return { ...DEFAULT_WEIGHTS };
  }
});

export async function saveWeights(weights: Weights): Promise<Weights> {
  const clean = coerce(weights);
  await prisma.setting.upsert({
    where: { key: SETTING_KEY },
    create: { key: SETTING_KEY, value: clean },
    update: { value: clean },
  });
  return clean;
}
