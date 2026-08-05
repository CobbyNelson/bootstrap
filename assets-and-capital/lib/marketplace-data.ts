import { FEATURED_OPPORTUNITIES, type Opportunity } from "./content";

const MORE: Opportunity[] = [
  { name: "Nile Digital Bank", sector: "FinTech", country: "Egypt", region: "North Africa", stage: "Growth", instrument: "Equity", ask: "$25M", targetReturn: "3.6× MOIC", match: 91, tier: "Platinum", blurb: "Full-stack digital bank with 1.8M accounts and a fast-growing SME lending book." },
  { name: "Serengeti MedSupply", sector: "Healthcare", country: "Tanzania", region: "East Africa", stage: "Series A", instrument: "Equity", ask: "$9M", targetReturn: "3.0× MOIC", match: 78, tier: "Silver", blurb: "Last-mile medical distribution reaching 900 clinics across the region." },
  { name: "Kalahari Copper JV", sector: "Natural Resources", country: "Botswana", region: "Southern Africa", stage: "Mature", instrument: "Equity + Debt", ask: "$60M", targetReturn: "17% IRR", match: 74, tier: "Gold", blurb: "Late-stage copper development with offtake agreements secured." },
  { name: "Dakar Logistics Park", sector: "Infrastructure", country: "Senegal", region: "West Africa", stage: "Green field", instrument: "Preferred Equity", ask: "$40M", targetReturn: "16% IRR", match: 71, tier: "Gold", blurb: "Bonded warehousing and cold-chain hub serving the port of Dakar." },
  { name: "Atlas EdTech", sector: "Education", country: "Morocco", region: "North Africa", stage: "Series A", instrument: "Equity", ask: "$5M", targetReturn: "4.2× MOIC", match: 69, tier: "Silver", blurb: "Bilingual learning platform with 600k monthly active students." },
  // Overrides the "Renewable Energy" sector image, which is a solar farm — that
  // sector covers both solar and wind, and a wind listing showing panels is the
  // exact mismatch the per-listing `image` field exists to fix.
  { name: "Coastal Wind Partners", sector: "Renewable Energy", country: "South Africa", region: "Southern Africa", stage: "Growth", instrument: "Equity", ask: "$48M", targetReturn: "18% IRR", match: 85, tier: "Gold", blurb: "300MW onshore wind pipeline with signed power-purchase agreements.", image: "/img/sector-wind.png" },
  { name: "Kigali PropCo", sector: "Real Estate", country: "Rwanda", region: "East Africa", stage: "Brown field", instrument: "Equity", ask: "$14M", targetReturn: "15% IRR", match: 66, tier: "Standard", blurb: "Mixed-use residential and retail development in a high-growth corridor." },
  { name: "Sahel AgriProcessing", sector: "Agriculture", country: "Mali", region: "West Africa", stage: "Growth", instrument: "Debt", ask: "$7M", targetReturn: "12% coupon", match: 63, tier: "Standard", blurb: "Grain processing and storage with contracted supply from 4,000 farmers." },
  { name: "Indian Ocean Resorts", sector: "Hospitality", country: "Mauritius", region: "Southern Africa", stage: "Mature", instrument: "Preferred Equity", ask: "$22M", targetReturn: "14% IRR", match: 61, tier: "Silver", blurb: "Portfolio of premium eco-resorts with strong occupancy and ESG credentials." },
];

export const MARKETPLACE: Opportunity[] = [...FEATURED_OPPORTUNITIES, ...MORE];

export const REGIONS = [
  "East Africa",
  "West Africa",
  "North Africa",
  "Southern Africa",
  "North America",
  "Europe",
  "Middle East",
  "Asia Pacific",
] as const;

export const SECTORS_FILTER = [
  "FinTech",
  "Renewable Energy",
  "Healthcare",
  "Digital Health",
  "Real Estate",
  "Agriculture",
  "Infrastructure",
  "Natural Resources",
  "Transport & Logistics",
  "Food & Beverage",
  "Education",
  "Hospitality",
] as const;

export const STAGES = ["Green field", "Series A", "Growth", "Brown field", "Mature", "Buyout"] as const;

export const INSTRUMENTS = ["Equity", "Debt", "Preferred Equity", "Equity + Debt"] as const;

export const TIERS = ["Standard", "Silver", "Gold", "Platinum"] as const;

export const SORTS = [
  { key: "match", label: "Best match" },
  { key: "ask-desc", label: "Ask: high to low" },
  { key: "ask-asc", label: "Ask: low to high" },
] as const;
