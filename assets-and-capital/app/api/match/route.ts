import { NextResponse } from "next/server";
import { MARKETPLACE } from "@/lib/marketplace-data";
import { DEMO_MANDATE, DEFAULT_WEIGHTS, scoreOpportunity, slugify, type Mandate } from "@/lib/matching";

/**
 * Live matching endpoint — runs the explainable scoring engine server-side.
 *
 *   GET  /api/match?limit=10            → ranked matches for the demo mandate
 *   POST /api/match { mandate, weights, limit }
 *                                        → ranked matches for a supplied mandate
 *
 * This is the real engine (the same one the UI uses), wired as an API seam.
 * Swap MARKETPLACE for a database query to go fully live.
 */

function rank(mandate: Mandate, weights = DEFAULT_WEIGHTS) {
  return MARKETPLACE.map((o) => {
    const m = scoreOpportunity(mandate, o, weights);
    return {
      name: o.name,
      slug: slugify(o.name),
      sector: o.sector,
      country: o.country,
      region: o.region,
      ask: o.ask,
      tier: o.tier,
      score: m.score,
      stars: m.stars,
      rating: m.tier,
      matched: m.matched,
      watchouts: m.watchouts,
    };
  }).sort((a, b) => b.score - a.score);
}

export function GET(request: Request) {
  const limit = Number(new URL(request.url).searchParams.get("limit") ?? 10) || 10;
  const results = rank(DEMO_MANDATE).slice(0, limit);
  return NextResponse.json({ mandate: "demo", count: results.length, results });
}

export async function POST(request: Request) {
  let body: { mandate?: Partial<Mandate>; weights?: typeof DEFAULT_WEIGHTS; limit?: number } = {};
  try {
    body = await request.json();
  } catch {
    /* empty body is fine */
  }
  const mandate: Mandate = { ...DEMO_MANDATE, ...(body.mandate ?? {}) };
  const weights = body.weights ?? DEFAULT_WEIGHTS;
  const limit = body.limit ?? 10;
  const results = rank(mandate, weights).slice(0, limit);
  return NextResponse.json({ count: results.length, results });
}
