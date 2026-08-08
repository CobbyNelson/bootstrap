/**
 * What the public forms will accept, declared once.
 *
 * The form imports this to check an answer as somebody commits it, and the API
 * route imports the SAME object to check the posted body. That is the whole
 * point of the file: before it existed, the rules lived inside a React
 * component, which meant they were a property of the browser rather than of the
 * platform, and a request that skipped the browser skipped them entirely.
 *
 * Adding a field to a form without adding it here is not an oversight the
 * server will forgive — `validateSubmission` drops keys the schema does not
 * declare, so an unlisted field silently never arrives.
 */
import type { Rule } from "./form-validation";

/** The business listing intake — components/register/business-intake.tsx. */
export const INTAKE_SCHEMA: Record<string, Rule> = {
  companyName: { kind: "company", required: true, min: 2, max: 140 },
  hqCountry: { kind: "name", required: true, min: 2, max: 60 },
  region: { kind: "text", required: true, max: 40 },
  website: { kind: "url", max: 300 },
  // Four digits, and a company founded before writing or after next year is a
  // typo rather than a company.
  founded: { kind: "digits", max: 4, minValue: 1800, maxValue: 2100 },
  legalStructure: { kind: "text", max: 40 },
  founders: { kind: "text", max: 2000 },
  contactName: { kind: "name", required: true, min: 2, max: 80 },
  contactEmail: { kind: "email", required: true },
  contactPhone: { kind: "phone" },
  purpose: { kind: "text", required: true, min: 20, max: 4000 },
  // A trillion-dollar raise is not a raise, and the cap keeps a figure from
  // being used to post a number no downstream column can hold.
  amount: { kind: "digits", required: true, minValue: 1000, maxValue: 1_000_000_000_000 },
  instrument: { kind: "text", required: true, max: 120 },
  equityStake: { kind: "decimal", maxValue: 100 },
  returnOffer: { kind: "decimal", maxValue: 1000 },
  listingTier: { kind: "text", required: true, max: 40 },
  services: { kind: "text", max: 400 },
  featuredImage: { kind: "url", max: 500 },
  consent: { kind: "text", required: true, max: 10 },
};

/** The contact form — components/contact/contact-form.tsx. */
export const CONTACT_SCHEMA: Record<string, Rule> = {
  name: { kind: "name", required: true, min: 2, max: 80 },
  email: { kind: "email", required: true },
  company: { kind: "company", max: 140 },
  role: { kind: "text", required: true, max: 60 },
  message: { kind: "text", required: true, min: 10, max: 4000 },
};

/**
 * Answers picked from a list, checked against the list.
 *
 * A choice question renders buttons, so the only way to submit something that
 * is not on them is to post directly — which is exactly the case the server is
 * here for. Free text would pass the `text` rule happily; this will not.
 *
 * Multi-select values arrive joined with ", ", so each part is checked.
 */
export const ALLOWED_CHOICES: Record<string, string[]> = {
  region: ["East Africa", "West Africa", "North Africa", "Southern Africa", "North America", "Europe", "Middle East", "Asia Pacific"],
  legalStructure: ["LLC", "C-Corp", "Ltd", "PLC", "Partnership", "Other"],
  instrument: ["Debt", "Equity", "Preferred Share"],
  listingTier: ["Standard", "Silver", "Gold", "Platinum"],
  services: [
    "Basic Teaser Preparation",
    "Business Plan Writing",
    "Financial Reporting Services",
    "Shadow Investor Search",
    "Investor Roadshow",
  ],
  role: ["Investor", "Business seeking capital", "Partner / advisor", "Other"],
};

/** Split a multi-select answer back into its parts. */
export function choiceParts(raw: string): string[] {
  return raw.split(",").map((p) => p.trim()).filter(Boolean);
}

/* ------------------------------------------------- the investor mandate */

/**
 * The option lists for the investor mandate, in English.
 *
 * They live here rather than in the component so there is ONE copy: the form
 * imports them and maps each through `tl()` to render, and the route checks
 * submissions against the same arrays. Defining them in the component and
 * repeating them here is how a choice list silently stops matching what the
 * buttons offer — and the check then either blocks everybody or nobody.
 */
export const MARKETS = ["East Africa", "West Africa", "North Africa", "Southern Africa", "North America", "Europe", "Middle East", "Asia Pacific"];
export const SECTORS = ["Technology", "Healthcare", "Consumer", "Industrials", "FinTech", "Energy", "Financial Services", "Natural Resources", "Real Estate", "Infrastructure", "Communications & Media", "Agriculture", "Hospitality, Travel & Leisure", "Education", "ESG"];
export const INSTRUMENTS = ["Debt Only", "Preference Equity", "Equity"];
export const YES_NO = ["Yes", "No"];

export const INVESTOR_OPTIONS: Record<string, string[]> = {
  branch: ["Private Equity", "Real Estate", "Fund Investor"],
  investorType: ["Individual", "Family Office", "Institutional Investor", "Pension Fund", "Sovereign Wealth Fund", "Other"],
  accredited: YES_NO,
  kyc: YES_NO,

  pe_objectives: ["Capital Appreciation", "Sector Leadership", "Diversification", "Strategic Exposure"],
  pe_risk: ["Moderate", "High", "Opportunistic"],
  pe_control: ["Majority ownership", "Minority with Board membership", "Silent minority"],
  pe_horizon: ["3–5 yrs", "5–7 yrs", "7–10 yrs", ">10 yrs"],
  pe_strategies: ["Buyouts", "Growth Equity", "Venture Capital", "Secondary Stakes", "Turnarounds / Distressed", "Sector-Focused"],
  pe_instruments: INSTRUMENTS,
  pe_stage: ["Green field / Start Up", "Growth", "Brown field / Mature"],
  pe_markets: MARKETS,
  pe_sectors: SECTORS,
  pe_liquidity: ["IPO", "Strategic Sale", "Secondary Sale", "Dividend Recapitalization"],
  pe_governance: ["Board Seat", "Observer Rights", "Advisory Committee", "None"],

  re_objectives: ["Income Generation", "Capital Appreciation", "Inflation Hedge", "Portfolio Diversification", "Strategic Sector Exposure"],
  re_risk: ["Core (Lower Risk)", "Core-Plus", "Value-Add", "Opportunistic"],
  re_classes: ["Residential", "Commercial Office", "Retail", "Industrial / Logistics", "Hospitality", "Healthcare & Senior Living", "Mixed-Use"],
  re_structure: ["Direct Ownership", "Fund Vehicle", "Joint Venture", "SPV / Co-Investment"],
  re_instruments: INSTRUMENTS,
  re_dev: ["Stabilized Assets", "Light Renovation", "Ground-Up Development"],
  re_markets: MARKETS,
  re_deploy: ["Immediate", "3–6 Months", "6–12 Months", "Longer"],
  re_liquidity: ["Long-Term Hold", "Medium Hold", "Short-Term Flip"],
  re_exit: ["Sale to Strategic Buyer", "Recapitalization", "REIT / Public Listing", "Refinancing"],
  re_metrics: ["NOI", "Cash-on-Cash Return", "Cap Rate", "Valuation Reports"],

  fd_objectives: ["Capital Growth", "Income / Dividend Yield", "Capital Preservation", "Diversification", "Hedging Inflation", "Tax Efficiency"],
  fd_risk: ["Low", "Moderate", "High", "Opportunistic / Aggressive"],
  fd_horizon: ["<3 years", "3–5 years", "5–7 years", ">7 years"],
  fd_categories: ["Mutual / Open-End", "Hedge / Alternative", "Private Funds (AIF, PE)", "UCITS", "ETFs", "Balanced / Multi-Asset"],
  fd_styles: ["Active Management", "Passive / Index-Linked", "Quantitative / Systematic", "Thematic (ESG, Tech…)", "Sector-Specific"],
  fd_strategies: ["Equity-Focused", "Fixed Income", "Multi-asset", "L/S Equity Hedge", "Private Credit", "Real Assets / Infrastructure", "Emerging Markets"],
  fd_exclusions: ["High Leverage", "Illiquid Only", "Derivatives Only", "Non-ESG Compliant"],
  fd_lockup: ["None", "Up to 3 Months", "3–6 Months", "6–12 Months", ">12 Months"],
  fd_governance: ["Advisory Committee Participation", "Voting Rights in Underlying Holdings", "No Governance Involvement"],
  fd_fees: ["Flat Management Fee", "Performance Fee (Carry)", "Hurdle Rate Requirement", "Tiered Fee"],
};

/** A percentage somebody is targeting. 500% is a typo, not a mandate. */
const PCT: Rule = { kind: "decimal", maxValue: 500 };
/** A ticket in US dollars. */
const USD: Rule = { kind: "digits", maxValue: 1_000_000_000_000 };
/** Something picked from a list. Membership is checked separately. */
const PICK: Rule = { kind: "text", max: 80 };
/** Several things picked from a list, joined with ", ". */
const PICKS: Rule = { kind: "text", max: 600 };

export const INVESTOR_SCHEMA: Record<string, Rule> = {
  branch: { ...PICK, required: true },

  entityName: { kind: "company", required: true, min: 2, max: 140 },
  contactName: { kind: "name", required: true, min: 2, max: 80 },
  contactTitle: { kind: "text", max: 100 },
  email: { kind: "email", required: true },
  phone: { kind: "phone" },
  investorType: { ...PICK, required: true },
  jurisdiction: { kind: "name", required: true, min: 2, max: 60 },
  accredited: { ...PICK, required: true },
  kyc: PICK,

  pe_objectives: { ...PICKS, required: true },
  pe_irr_min: PCT, pe_irr_target: PCT, pe_irr_aggr: PCT,
  pe_risk: { ...PICK, required: true },
  pe_control: PICK, pe_horizon: PICK,
  pe_strategies: { ...PICKS, required: true },
  pe_instruments: PICKS, pe_stage: PICKS,
  pe_markets: { ...PICKS, required: true },
  pe_sectors: PICKS,
  pe_exclusions: { kind: "text", max: 600 },
  pe_total: { ...USD, required: true },
  pe_min: USD, pe_target: USD, pe_max: USD,
  pe_liquidity: PICKS, pe_governance: PICKS,

  re_objectives: { ...PICKS, required: true },
  re_noi: PCT, re_growth: PCT, re_irr: PCT,
  re_risk: { ...PICK, required: true },
  re_classes: { ...PICKS, required: true },
  re_structure: PICKS, re_instruments: PICKS, re_dev: PICK,
  re_markets: { ...PICKS, required: true },
  re_total: { ...USD, required: true },
  re_min: USD, re_target: USD, re_max: USD,
  re_deploy: PICK, re_liquidity: PICK, re_exit: PICKS, re_metrics: PICKS,

  fd_objectives: { ...PICKS, required: true },
  fd_min: PCT, fd_target: PCT, fd_upside: PCT,
  fd_risk: { ...PICK, required: true },
  fd_horizon: PICK,
  fd_categories: { ...PICKS, required: true },
  fd_styles: PICKS, fd_strategies: PICKS, fd_exclusions: PICKS,
  fd_total: { ...USD, required: true },
  fd_lockup: PICK, fd_governance: PICKS, fd_fees: PICKS,

  consent: { kind: "text", required: true, max: 10 },
};

/**
 * The mandate's schema for the branch actually chosen.
 *
 * A private-equity investor never sees a real-estate question, so requiring
 * `re_total` of them would refuse every valid submission. The branch decides
 * which required fields exist — and the other branches' keys are dropped
 * entirely rather than merely ignored, so a payload cannot smuggle a
 * real-estate mandate into a fund registration.
 */
export function investorSchemaFor(branch: string): Record<string, Rule> {
  const prefix = { "Private Equity": "pe_", "Real Estate": "re_", "Fund Investor": "fd_" }[branch];
  if (!prefix) return {};

  const out: Record<string, Rule> = {};
  for (const [key, rule] of Object.entries(INVESTOR_SCHEMA)) {
    const branchScoped = /^(pe|re|fd)_/.test(key);
    if (!branchScoped || key.startsWith(prefix)) out[key] = rule;
  }
  return out;
}
