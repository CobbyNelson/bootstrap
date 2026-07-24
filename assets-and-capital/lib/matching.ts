import { MARKETPLACE } from "./marketplace-data";
import type { Opportunity } from "./content";

/* ============================================================
   Assets & Capital — AI Matching Engine (v2)
   Continuously compares an investor MANDATE against an
   opportunity's CAPITAL REQUIREMENT across 15 weighted
   criteria, returns a 0-100 compatibility score, a star
   rating, and human-readable reasons. Weights are tunable
   (admin) — scoreOpportunity accepts a weights override.
   Rules are the floor; an ML/embedding lift plugs in behind
   the same interface.
   ============================================================ */

export type Mandate = {
  name: string;
  investorClass: "Private Equity" | "Real Estate" | "Fund";
  sectors: string[];
  regions: string[];
  countries: string[]; // approved countries
  ticketMinM: number; // USD millions
  ticketMaxM: number;
  instruments: string[];
  investmentTypes: string[]; // fund primary / co-investment / direct / secondary
  stages: string[];
  minRevenueM: number;
  riskAppetite: "Conservative" | "Moderate" | "High" | "Opportunistic";
  horizonYears: number;
  targetIrr: number; // %
  esgPreferred: boolean;
  governance: string[];
  exit: string[];
  currency: string;
};

export const DEMO_MANDATE: Mandate = {
  name: "North America & Africa Growth",
  investorClass: "Private Equity",
  sectors: ["Renewable Energy", "FinTech", "Healthcare", "Digital Health", "Agriculture", "Infrastructure"],
  regions: ["East Africa", "West Africa", "Southern Africa", "North Africa"],
  countries: ["Kenya", "Nigeria", "Ghana", "South Africa", "Tanzania", "Rwanda", "Morocco", "Egypt", "Senegal", "Botswana", "Mauritius"],
  ticketMinM: 10,
  ticketMaxM: 40,
  instruments: ["Equity", "Preferred Equity", "Equity + Debt"],
  investmentTypes: ["Fund primary", "Co-investment", "Direct deal"],
  stages: ["Growth", "Series A", "Buyout", "Mature"],
  minRevenueM: 3,
  riskAppetite: "High",
  horizonYears: 7,
  targetIrr: 18,
  esgPreferred: true,
  governance: ["Board Seat", "Observer Rights"],
  exit: ["Strategic Sale", "IPO", "Secondary Sale"],
  currency: "USD",
};

/* ---- derived opportunity attributes (estimated from the listing) ---- */

export type Derived = {
  askM: number;
  revenueM: number;
  ebitdaMargin: number; // %
  employees: number;
  riskLevel: "Low" | "Medium" | "High";
  horizonYears: number;
  currency: string;
};

const STAGE_REVENUE: Record<string, number> = { "Green field": 0.2, "Series A": 0.7, Growth: 1.6, "Brown field": 2.2, Mature: 3.2, Buyout: 4.2 };
const STAGE_EMPLOYEES: Record<string, number> = { "Green field": 14, "Series A": 48, Growth: 180, "Brown field": 340, Mature: 620, Buyout: 940 };
const STAGE_EBITDA: Record<string, number> = { "Green field": -20, "Series A": -5, Growth: 12, "Brown field": 18, Mature: 24, Buyout: 28 };
const STAGE_RISK: Record<string, Derived["riskLevel"]> = { "Green field": "High", "Series A": "High", Growth: "Medium", "Brown field": "Medium", Mature: "Low", Buyout: "Low" };
const STAGE_HORIZON: Record<string, number> = { "Green field": 8, "Series A": 7, Growth: 6, "Brown field": 5, Mature: 5, Buyout: 5 };

function parseAskM(ask: string): number {
  const n = parseFloat(ask.replace(/[^0-9.]/g, "")) || 0;
  if (/b/i.test(ask)) return n * 1000;
  if (/k/i.test(ask)) return n / 1000;
  return n;
}

export function derive(o: Opportunity): Derived {
  const askM = parseAskM(o.ask);
  return {
    askM,
    revenueM: Math.round(askM * (STAGE_REVENUE[o.stage] ?? 1.2) * 10) / 10,
    ebitdaMargin: STAGE_EBITDA[o.stage] ?? 8,
    employees: STAGE_EMPLOYEES[o.stage] ?? 120,
    riskLevel: STAGE_RISK[o.stage] ?? "Medium",
    horizonYears: STAGE_HORIZON[o.stage] ?? 6,
    currency: "USD",
  };
}

/* ---- weights (admin-tunable) ---- */

export type Weights = Record<string, number>;
export const DEFAULT_WEIGHTS: Weights = {
  sector: 15,
  region: 9,
  country: 5,
  checkSize: 14,
  instrument: 7,
  stage: 8,
  revenue: 6,
  ebitda: 4,
  employees: 3,
  risk: 8,
  horizon: 5,
  expectedReturn: 8,
  esg: 4,
  governance: 2,
  exit: 2,
};

export const WEIGHT_LABELS: Record<string, string> = {
  sector: "Industry & sector",
  region: "Region",
  country: "Country",
  checkSize: "Investment size",
  instrument: "Instrument / type",
  stage: "Business stage",
  revenue: "Annual revenue",
  ebitda: "EBITDA / profitability",
  employees: "Company size",
  risk: "Risk appetite",
  horizon: "Investment horizon",
  expectedReturn: "Expected return",
  esg: "ESG alignment",
  governance: "Governance",
  exit: "Exit strategy",
};

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

const RISK_ORDER = { Conservative: 0, Moderate: 1, High: 2, Opportunistic: 3 } as const;
const LEVEL_TO_APPETITE = { Low: 0, Medium: 1, High: 2 } as const;

/* ---- per-dimension scorers → f in [0,1] ---- */

function fSector(m: Mandate, o: Opportunity): number {
  if (m.sectors.includes(o.sector)) return 1;
  const adj = SECTOR_ADJACENCY[o.sector] ?? [];
  return adj.some((a) => m.sectors.includes(a)) ? 0.6 : 0.2;
}
function fRegion(m: Mandate, o: Opportunity): number {
  if (m.regions.includes(o.region)) return 1;
  const african = ["East Africa", "West Africa", "Southern Africa", "North Africa"];
  return m.regions.some((r) => african.includes(r)) && african.includes(o.region) ? 0.7 : 0.15;
}
function fCountry(m: Mandate, o: Opportunity): number {
  return m.countries.includes(o.country) ? 1 : 0.35;
}
function fCheck(m: Mandate, d: Derived): number {
  if (d.askM >= m.ticketMinM && d.askM <= m.ticketMaxM) return 1;
  const mid = (m.ticketMinM + m.ticketMaxM) / 2;
  const half = (m.ticketMaxM - m.ticketMinM) / 2 || 1;
  const z = (d.askM - mid) / (half * 1.8);
  return Math.max(0.1, Math.exp(-z * z));
}
function fInstrument(m: Mandate, o: Opportunity): number {
  return m.instruments.includes(o.instrument) ? 1 : 0.4;
}
function fStage(m: Mandate, o: Opportunity): number {
  if (m.stages.includes(o.stage)) return 1;
  const growthy = ["Growth", "Series A", "Buyout", "Mature", "Brown field"];
  return m.stages.some((s) => growthy.includes(s)) && growthy.includes(o.stage) ? 0.6 : 0.3;
}
function fRevenue(m: Mandate, d: Derived): number {
  if (d.revenueM >= m.minRevenueM) return 1;
  return Math.max(0.2, d.revenueM / m.minRevenueM);
}
function fEbitda(d: Derived): number {
  if (d.ebitdaMargin >= 20) return 1;
  if (d.ebitdaMargin >= 10) return 0.85;
  if (d.ebitdaMargin >= 0) return 0.65;
  return 0.45; // pre-profit growth
}
function fEmployees(d: Derived): number {
  if (d.employees >= 50) return 1;
  if (d.employees >= 20) return 0.8;
  return 0.6;
}
function fRisk(m: Mandate, d: Derived): number {
  const appetite = RISK_ORDER[m.riskAppetite];
  const level = LEVEL_TO_APPETITE[d.riskLevel];
  return level <= appetite ? 1 : Math.max(0.4, 1 - (level - appetite) * 0.35);
}
function fHorizon(m: Mandate, d: Derived): number {
  const diff = Math.abs(m.horizonYears - d.horizonYears);
  return Math.max(0.5, 1 - diff * 0.12);
}
function fReturn(m: Mandate, o: Opportunity): number {
  const t = o.targetReturn;
  const val = parseFloat(t.replace(/[^0-9.]/g, "")) || 0;
  if (/moic|×|x/i.test(t)) return val >= 3 ? 1 : val >= 2.5 ? 0.85 : val >= 2 ? 0.65 : 0.4;
  if (/irr/i.test(t)) {
    if (val >= m.targetIrr) return 1;
    if (val >= m.targetIrr - 3) return 0.8;
    if (val >= m.targetIrr - 6) return 0.6;
    return 0.4;
  }
  return 0.5;
}
function fEsg(m: Mandate, o: Opportunity): number {
  const green = ["Renewable Energy", "ESG", "Agriculture"];
  const isGreen = green.includes(o.sector) || /esg|clean|green|solar|wind/i.test(o.blurb);
  if (!m.esgPreferred) return 0.6;
  return isGreen ? 1 : 0.5;
}
function fGovernance(m: Mandate): number {
  return m.governance.length > 0 ? 0.9 : 0.6;
}
function fExit(m: Mandate): number {
  return m.exit.length > 0 ? 0.9 : 0.6;
}

/* ---- result ---- */

export type Dimension = { key: string; label: string; weight: number; f: number };
export type MatchResult = {
  score: number;
  stars: 1 | 2 | 3 | 4 | 5;
  tier: "Excellent Match" | "Strong Match" | "Moderate Match" | "Weak Match" | "Poor Match";
  dimensions: Dimension[];
  matched: string[];
  watchouts: string[];
};

function starsFor(score: number): MatchResult["stars"] {
  if (score >= 90) return 5;
  if (score >= 75) return 4;
  if (score >= 60) return 3;
  if (score >= 45) return 2;
  return 1;
}
const TIER_BY_STARS: Record<number, MatchResult["tier"]> = {
  5: "Excellent Match", 4: "Strong Match", 3: "Moderate Match", 2: "Weak Match", 1: "Poor Match",
};

export function scoreOpportunity(m: Mandate, o: Opportunity, weights: Weights = DEFAULT_WEIGHTS): MatchResult {
  const d = derive(o);
  const raw: { key: string; f: number }[] = [
    { key: "sector", f: fSector(m, o) },
    { key: "region", f: fRegion(m, o) },
    { key: "country", f: fCountry(m, o) },
    { key: "checkSize", f: fCheck(m, d) },
    { key: "instrument", f: fInstrument(m, o) },
    { key: "stage", f: fStage(m, o) },
    { key: "revenue", f: fRevenue(m, d) },
    { key: "ebitda", f: fEbitda(d) },
    { key: "employees", f: fEmployees(d) },
    { key: "risk", f: fRisk(m, d) },
    { key: "horizon", f: fHorizon(m, d) },
    { key: "expectedReturn", f: fReturn(m, o) },
    { key: "esg", f: fEsg(m, o) },
    { key: "governance", f: fGovernance(m) },
    { key: "exit", f: fExit(m) },
  ];
  const totalW = raw.reduce((s, r) => s + (weights[r.key] ?? 0), 0) || 1;
  const score = Math.round(raw.reduce((s, r) => s + (weights[r.key] ?? 0) * r.f, 0) / totalW * 100);
  const stars = starsFor(score);

  const dimensions: Dimension[] = raw.map((r) => ({
    key: r.key,
    label: WEIGHT_LABELS[r.key] ?? r.key,
    weight: Math.round(((weights[r.key] ?? 0) / totalW) * 100),
    f: r.f,
  }));

  const matched: string[] = [];
  const watchouts: string[] = [];
  if (fSector(m, o) >= 0.9) matched.push(`Industry aligns — ${o.sector} is a core sector`);
  else if (fSector(m, o) < 0.5) watchouts.push(`${o.sector} is outside your core sectors`);
  if (fCountry(m, o) >= 1) matched.push(`${o.country} is an approved country`);
  else watchouts.push(`${o.country} is not on your approved-country list`);
  if (fCheck(m, d) >= 0.9) matched.push(`Investment size ($${d.askM}M) is within your $${m.ticketMinM}–${m.ticketMaxM}M mandate`);
  else if (fCheck(m, d) < 0.6) watchouts.push(`$${d.askM}M ask sits outside your typical ticket band`);
  if (fInstrument(m, o) >= 1) matched.push(`${o.instrument} instrument is permitted`);
  if (fStage(m, o) >= 0.9) matched.push(`${o.stage} stage matches your mandate`);
  if (fReturn(m, o) >= 0.9) matched.push(`Expected return falls inside your ${m.targetIrr}%+ target`);
  else if (fReturn(m, o) < 0.6) watchouts.push(`Return profile is below your target`);
  if (fRisk(m, d) >= 0.9) matched.push(`${d.riskLevel} risk is within your ${m.riskAppetite.toLowerCase()} appetite`);
  else if (fRisk(m, d) < 0.6) watchouts.push(`${d.riskLevel} risk exceeds your appetite`);
  if (m.esgPreferred && fEsg(m, o) >= 0.9) matched.push("Meets your ESG preference");
  if (fRevenue(m, d) < 0.6) watchouts.push(`Revenue (~$${d.revenueM}M) is below your $${m.minRevenueM}M floor`);

  return { score, stars, tier: TIER_BY_STARS[stars], dimensions, matched, watchouts };
}

/* ---- helpers ---- */

export function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
export function allOpportunitySlugs(): string[] {
  return MARKETPLACE.map((o) => slugify(o.name));
}
export function getOpportunityBySlug(slug: string): Opportunity | undefined {
  return MARKETPLACE.find((o) => slugify(o.name) === slug);
}
export function recommend(mandate: Mandate, n = 6): { opportunity: Opportunity; match: MatchResult }[] {
  return MARKETPLACE.map((o) => ({ opportunity: o, match: scoreOpportunity(mandate, o) }))
    .sort((a, b) => b.match.score - a.match.score)
    .slice(0, n);
}

export const SCORED_MARKETPLACE: Opportunity[] = MARKETPLACE.map((o) => ({
  ...o,
  match: scoreOpportunity(DEMO_MANDATE, o).score,
}));
