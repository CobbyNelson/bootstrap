import { MARKETPLACE } from "./marketplace-data";
import type { Opportunity } from "./content";

/* ============================================================
   Assets & Capital — mandate matching engine
   Deterministic, explainable scoring of an opportunity against
   an investor mandate. Rules are the floor; a future ML/embedding
   "lift" plugs in behind the same interface (see scoreOpportunity).
   ============================================================ */

export type Mandate = {
  name: string;
  investorClass: "Private Equity" | "Real Estate" | "Fund";
  sectors: string[];
  regions: string[];
  ticketMinM: number; // USD millions
  ticketMaxM: number;
  stages: string[];
  targetIrr: number; // %
  esgPreferred: boolean;
};

/** The signed-in demo investor's active mandate (Aurora Family Office). */
export const DEMO_MANDATE: Mandate = {
  name: "North America & Africa Growth",
  investorClass: "Private Equity",
  sectors: ["Renewable Energy", "FinTech", "Healthcare", "Digital Health", "Agriculture", "Infrastructure"],
  regions: ["East Africa", "West Africa", "Southern Africa", "North Africa"],
  ticketMinM: 10,
  ticketMaxM: 40,
  stages: ["Growth", "Series A", "Buyout", "Mature"],
  targetIrr: 18,
  esgPreferred: true,
};

export type Dimension = { key: string; label: string; weight: number; f: number };
export type MatchResult = {
  score: number;
  tier: "Strong" | "Good" | "Exploratory";
  dimensions: Dimension[];
  matched: string[];
  watchouts: string[];
};

const WEIGHTS = {
  sector: 28,
  geography: 16,
  checkSize: 20,
  stage: 12,
  riskReturn: 16,
  esg: 8,
} as const;

// sector adjacency — a near-miss still scores partially, not zero
const SECTOR_ADJACENCY: Record<string, string[]> = {
  "Renewable Energy": ["Energy", "ESG", "Infrastructure"],
  FinTech: ["Financial Services"],
  "Digital Health": ["Healthcare"],
  Healthcare: ["Digital Health"],
  "Transport & Logistics": ["Infrastructure", "Industrials"],
  "Natural Resources": ["Materials", "Energy"],
  "Food & Beverage": ["Consumer", "Agriculture"],
  Agriculture: ["ESG", "Food & Beverage"],
  Infrastructure: ["Real Estate", "Energy"],
};

function parseAskM(ask: string): number {
  const n = parseFloat(ask.replace(/[^0-9.]/g, "")) || 0;
  if (/b/i.test(ask)) return n * 1000;
  if (/k/i.test(ask)) return n / 1000;
  return n;
}

function sectorFit(m: Mandate, o: Opportunity): number {
  if (m.sectors.includes(o.sector)) return 1;
  const adj = SECTOR_ADJACENCY[o.sector] ?? [];
  if (adj.some((a) => m.sectors.includes(a))) return 0.6;
  return 0.25;
}

function geoFit(m: Mandate, o: Opportunity): number {
  if (m.regions.includes(o.region)) return 1;
  // African sub-regions are treated as adjacent within a pan-African mandate
  const african = ["East Africa", "West Africa", "Southern Africa", "North Africa"];
  if (m.regions.some((r) => african.includes(r)) && african.includes(o.region)) return 0.75;
  return 0.2;
}

function checkFit(m: Mandate, o: Opportunity): number {
  const ask = parseAskM(o.ask);
  if (ask >= m.ticketMinM && ask <= m.ticketMaxM) return 1;
  // smooth decay outside the band (gaussian-ish)
  const mid = (m.ticketMinM + m.ticketMaxM) / 2;
  const half = (m.ticketMaxM - m.ticketMinM) / 2 || 1;
  const z = (ask - mid) / (half * 1.8);
  return Math.max(0.15, Math.exp(-z * z));
}

function stageFit(m: Mandate, o: Opportunity): number {
  if (m.stages.includes(o.stage)) return 1;
  const growthy = ["Growth", "Series A", "Buyout", "Mature", "Brown field"];
  if (m.stages.some((s) => growthy.includes(s)) && growthy.includes(o.stage)) return 0.6;
  return 0.3;
}

function returnFit(m: Mandate, o: Opportunity): number {
  const t = o.targetReturn;
  const val = parseFloat(t.replace(/[^0-9.]/g, "")) || 0;
  if (/moic|×|x/i.test(t)) return val >= 3 ? 1 : val >= 2.5 ? 0.85 : val >= 2 ? 0.65 : 0.4;
  if (/irr/i.test(t)) {
    if (val >= m.targetIrr) return 1;
    if (val >= m.targetIrr - 3) return 0.8;
    if (val >= m.targetIrr - 6) return 0.6;
    return 0.4;
  }
  return 0.5; // coupon / other
}

function esgFit(m: Mandate, o: Opportunity): number {
  const green = ["Renewable Energy", "ESG", "Agriculture"];
  const isGreen = green.includes(o.sector) || /esg|clean|green|solar|wind/i.test(o.blurb);
  if (!m.esgPreferred) return 0.5;
  return isGreen ? 1 : 0.5;
}

export function scoreOpportunity(mandate: Mandate, o: Opportunity): MatchResult {
  const dims: Dimension[] = [
    { key: "sector", label: "Sector & strategy", weight: WEIGHTS.sector, f: sectorFit(mandate, o) },
    { key: "geography", label: "Geography", weight: WEIGHTS.geography, f: geoFit(mandate, o) },
    { key: "checkSize", label: "Check size fit", weight: WEIGHTS.checkSize, f: checkFit(mandate, o) },
    { key: "stage", label: "Stage / vintage", weight: WEIGHTS.stage, f: stageFit(mandate, o) },
    { key: "riskReturn", label: "Risk / return", weight: WEIGHTS.riskReturn, f: returnFit(mandate, o) },
    { key: "esg", label: "ESG alignment", weight: WEIGHTS.esg, f: esgFit(mandate, o) },
  ];

  const score = Math.round(dims.reduce((sum, d) => sum + d.weight * d.f, 0));
  const tier: MatchResult["tier"] = score >= 80 ? "Strong" : score >= 60 ? "Good" : "Exploratory";

  const matched: string[] = [];
  const watchouts: string[] = [];
  const askM = parseAskM(o.ask);
  if (sectorFit(mandate, o) >= 0.8) matched.push(`${o.sector} fits your sector thesis`);
  else if (sectorFit(mandate, o) < 0.5) watchouts.push(`${o.sector} is outside your core sectors`);
  if (geoFit(mandate, o) >= 0.8) matched.push(`${o.region} is a target market`);
  else if (geoFit(mandate, o) < 0.5) watchouts.push(`${o.region} is outside your target markets`);
  if (checkFit(mandate, o) >= 0.9) matched.push(`$${askM}M ask fits your $${mandate.ticketMinM}–${mandate.ticketMaxM}M band`);
  else if (checkFit(mandate, o) < 0.6) watchouts.push(`$${askM}M ask sits outside your typical ticket band`);
  if (stageFit(mandate, o) >= 0.9) matched.push(`${o.stage} stage matches your mandate`);
  if (returnFit(mandate, o) >= 0.9) matched.push(`Target return meets your ${mandate.targetIrr}%+ objective`);
  else if (returnFit(mandate, o) < 0.6) watchouts.push(`Return profile is below your target`);
  if (mandate.esgPreferred && esgFit(mandate, o) >= 0.9) matched.push("Meets your ESG preference");

  return { score, tier, dimensions: dims, matched, watchouts };
}

/* ---- opportunity lookup helpers (slug-based routing) ---- */

export function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function allOpportunitySlugs(): string[] {
  return MARKETPLACE.map((o) => slugify(o.name));
}

export function getOpportunityBySlug(slug: string): Opportunity | undefined {
  return MARKETPLACE.find((o) => slugify(o.name) === slug);
}

/** Top-N recommendations for a mandate, sorted by computed match. */
export function recommend(mandate: Mandate, n = 6): { opportunity: Opportunity; match: MatchResult }[] {
  return MARKETPLACE.map((o) => ({ opportunity: o, match: scoreOpportunity(mandate, o) }))
    .sort((a, b) => b.match.score - a.match.score)
    .slice(0, n);
}

/** Marketplace with each opportunity's `match` computed by the engine
 *  against the demo investor's active mandate (single source of truth). */
export const SCORED_MARKETPLACE: Opportunity[] = MARKETPLACE.map((o) => ({
  ...o,
  match: scoreOpportunity(DEMO_MANDATE, o).score,
}));
