import { NextResponse } from "next/server";
import { clientIp as ipFromHeaders } from "@/lib/client-ip";
import type { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { rateLimit } from "@/lib/rate-limit";
import { MARKETPLACE } from "@/lib/marketplace-data";
import { DEMO_MANDATE, DEFAULT_WEIGHTS, scoreOpportunity, slugify, type Mandate } from "@/lib/matching";
import { getWeights } from "@/lib/matching-weights";

/**
 * Live matching endpoint — runs the explainable scoring engine server-side.
 *
 *   GET  /api/match?limit=10            → ranked matches for the demo mandate
 *   POST /api/match { mandate, weights, limit }
 *                                        → ranked matches for a supplied mandate
 *
 * This is the real engine (the same one the UI uses), wired as an API seam.
 *
 * ACCESS. lib/entitlements-server.ts puts match rate and its reasoning behind
 * the `deal` tier — a subscription plus expressed interest. This route must not
 * undercut that:
 *
 *   GET  fixed demo mandate over the sample catalogue. A showcase, and the only
 *        reason scores are public here.
 *   POST scores an ARBITRARY mandate against the catalogue, which is the paid
 *        engine itself. Requires a session.
 *
 * BEFORE MARKETPLACE becomes a database query, gate the GET too — at that point
 * the demo stops being a demo and starts being real listings, and this endpoint
 * would hand out match rates the marketplace charges for.
 */

function clientIp(req: Request): string {
  return (
    ipFromHeaders(req.headers)
  );
}

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

export async function GET(request: Request) {
  // Scoring walks the whole catalogue per call. Cheap on sample data, not
  // cheap once this is a database query — and unmetered either way was an
  // open invitation.
  const limit = Number(new URL(request.url).searchParams.get("limit") ?? 10) || 10;
  const results = rank(DEMO_MANDATE, await getWeights()).slice(0, limit);
  return NextResponse.json({ mandate: "demo", count: results.length, results });
}

export async function POST(request: NextRequest) {
  const gate = rateLimit(`match:${clientIp(request)}`, 30, 60_000);
  if (!gate.ok) {
    return NextResponse.json(
      { error: "Too many requests." },
      { status: 429, headers: { "Retry-After": String(gate.retryAfterSec) } },
    );
  }

  // An arbitrary mandate is the paid engine. Anonymous callers get the demo
  // endpoint; scoring their own mandate is what a subscription buys.
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Sign in to score your own mandate." },
      { status: 401 },
    );
  }

  let body: { mandate?: Partial<Mandate>; weights?: typeof DEFAULT_WEIGHTS; limit?: number } = {};
  try {
    body = await request.json();
  } catch {
    /* empty body is fine */
  }
  const mandate: Mandate = { ...DEMO_MANDATE, ...(body.mandate ?? {}) };
  // The caller may override for a what-if, but the DEFAULT is now the
  // platform's saved model rather than the shipped constant — otherwise tuning
  // the weights in the admin changed the preview and nothing else.
  const weights = body.weights ?? (await getWeights());
  const limit = Math.min(Math.max(Number(body.limit) || 10, 1), 100);
  const results = rank(mandate, weights).slice(0, limit);
  return NextResponse.json({ count: results.length, results });
}
