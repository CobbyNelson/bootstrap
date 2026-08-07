import {
  Cpu, HeartPulse, Landmark, ShoppingBag, Zap, Factory, Mountain, Building2,
  Radio, TrafficCone, Wheat, Plane, GraduationCap, Leaf,
  Search, FileText, Presentation, LineChart, ShieldCheck, Users,
  type LucideIcon,
} from "lucide-react";
import { SITE_HOST } from "@/lib/site-url";

/* ---------------------------------------------------------------- Site */

export const SITE = {
  name: "Assets & Capital",
  legalName: "Assets and Capital Limited",
  short: "A&C",
  domain: SITE_HOST,
  email: "hello@assetsandcapitalltd.com",
  phone: "+971 52 680 1658",
  tagline: "Where quality assets meet ready capital.",
  description:
    "Assets & Capital is a digital investment marketplace connecting vetted businesses seeking capital with a global network of ready investors — for capital raising, partnerships, and market expansion.",
} as const;

/* ---------------------------------------------------------------- Navigation */

export type NavLink = { label: string; href: string; description?: string; icon?: LucideIcon };
export type NavGroup = { label: string; href?: string; columns?: { title: string; links: NavLink[] }[] };

export const NAV: NavGroup[] = [
  {
    label: "Invest",
    columns: [
      {
        title: "For Investors",
        links: [
          { label: "Why invest with us", href: "/investors", description: "Deals scored against your mandate", icon: ShieldCheck },
          { label: "Browse the marketplace", href: "/marketplace", description: "Screened and verified listings", icon: Search },
          { label: "Build your mandate", href: "/register/investor", description: "Get matched automatically", icon: LineChart },
        ],
      },
      {
        title: "Investor Services",
        links: [
          { label: "Specialised roadshows", href: "/services/roadshows", description: "Meet pre-screened opportunities" },
          { label: "Local events access", href: "/events", description: "On-the-ground market insight" },
          { label: "Market access support", href: "/services/market-access", description: "Suppliers, buyers, partners" },
        ],
      },
    ],
  },
  {
    label: "Raise Capital",
    columns: [
      {
        title: "For Businesses",
        links: [
          { label: "How it works", href: "/businesses", description: "Reach the right investors", icon: Users },
          { label: "List your business", href: "/register/business", description: "Standard & premium tiers", icon: Building2 },
          { label: "Success-fee model", href: "/pricing", description: "Aligned incentives", icon: LineChart },
        ],
      },
      {
        title: "Business Services",
        links: [
          { label: "Business plan writing", href: "/services/business-plan", description: "Investor-ready narrative", icon: FileText },
          { label: "Financial modelling", href: "/services/financial-modelling", description: "Defensible projections", icon: LineChart },
          { label: "Teaser & pitch prep", href: "/services/teaser", description: "Make a strong first impression", icon: Presentation },
        ],
      },
    ],
  },
  { label: "Marketplace", href: "/marketplace" },
  { label: "Pricing", href: "/pricing" },
  {
    label: "Company",
    columns: [
      {
        title: "Company",
        links: [
          { label: "About us", href: "/about", description: "Our mission and team" },
          { label: "Insights", href: "/insights", description: "Market intelligence & research" },
          { label: "Events", href: "/events", description: "Roadshows and forums" },
          { label: "Contact", href: "/contact", description: "Talk to our team" },
        ],
      },
    ],
  },
];

/* ---------------------------------------------------------------- Stats */

export type Stat = { value: number; prefix?: string; suffix?: string; label: string; decimals?: number };

/**
 * Facts about how the platform works — verifiable from the product itself.
 * Traction figures (capital raised, investor counts) belong here only once
 * they are real and can be substantiated.
 */
export const STATS: Stat[] = [
  { value: 15, label: "Weighted match criteria" },
  { value: 14, label: "Sectors covered" },
  { value: 5, label: "Business score signals" },
  { value: 4, label: "Listing tiers" },
];

/* ---------------------------------------------------------------- Industries (from questionnaire taxonomy) */

/**
 * `short` is the display name for tight spaces — the sector strip on the home
 * page. It is DATA rather than `name.split(" & ")[0]`, which is how that strip
 * used to build it: splitting produced strings like "Information Technology"
 * that appear in no source file, so the extractor could not see them and no
 * translator could ever reach them. Seven of the eight rendered in English on
 * the Arabic page; the eighth translated only because "Healthcare" happens to
 * also be a sector value elsewhere.
 */
export type Industry = { name: string; short: string; icon: LucideIcon; blurb: string; count: number };

export const INDUSTRIES: Industry[] = [
  { name: "Information Technology & Digital", short: "Information Technology", icon: Cpu, blurb: "SaaS, cloud, AI/ML, fintech, cybersecurity, e-commerce", count: 214 },
  { name: "Healthcare & Life Sciences", short: "Healthcare", icon: HeartPulse, blurb: "Providers, pharma & biotech, devices, digital health", count: 138 },
  { name: "Financial Services", short: "Financial Services", icon: Landmark, blurb: "Banking, insurance, wealth management, payments", count: 121 },
  { name: "Consumer & Retail", short: "Consumer", icon: ShoppingBag, blurb: "FMCG, retail chains, luxury, food & beverage", count: 96 },
  { name: "Energy & Utilities", short: "Energy", icon: Zap, blurb: "Oil & gas, renewables, energy infrastructure, utilities", count: 88 },
  { name: "Industrials & Manufacturing", short: "Industrials", icon: Factory, blurb: "Logistics, machinery, aerospace, automotive, supply chain", count: 74 },
  { name: "Materials & Natural Resources", short: "Materials", icon: Mountain, blurb: "Mining & metals, chemicals, construction materials", count: 61 },
  { name: "Real Estate & Property", short: "Real Estate", icon: Building2, blurb: "Residential, commercial, logistics, hospitality, REITs", count: 152 },
  { name: "Communications & Media", short: "Communications", icon: Radio, blurb: "Telecom, broadcasting & streaming, digital media", count: 43 },
  { name: "Infrastructure", short: "Infrastructure", icon: TrafficCone, blurb: "Transport, utilities & digital/telecom infrastructure", count: 57 },
  { name: "Agriculture & Food Systems", short: "Agriculture", icon: Wheat, blurb: "Farming, agri-tech, food processing & distribution", count: 69 },
  { name: "Hospitality, Travel & Leisure", short: "Hospitality", icon: Plane, blurb: "Hotels, resorts, airlines, travel services", count: 38 },
  { name: "Education & Workforce", short: "Education", icon: GraduationCap, blurb: "EdTech, training services, corporate learning", count: 31 },
  { name: "ESG & Sustainability", short: "ESG", icon: Leaf, blurb: "Clean energy, green infrastructure, water & waste", count: 84 },
];

/* ---------------------------------------------------------------- How it works */

export type Step = { title: string; body: string };

export const HOW_INVESTOR: Step[] = [
  { title: "Register your mandate", body: "Set out your objectives, strategy, geographies, sectors and ticket size. The guided form turns that into a structured mandate in a few minutes." },
  { title: "Get matched", body: "New opportunities are scored against that mandate as they arrive. You see the ones that fit, along with why each one scored the way it did." },
  { title: "Diligence & connect", body: "Open data rooms once the NDA is signed, request a roadshow, and message businesses directly. Every document opened is logged." },
  { title: "Deploy capital", body: "Commit, receive your allocation and sign the subscription agreement, with our team in-market throughout." },
];

export const HOW_BUSINESS: Step[] = [
  { title: "List your opportunity", body: "Build a verified profile covering your ask, instrument and financials, then choose a listing tier from Standard to Platinum." },
  { title: "Get investor-ready", body: "Business plan writing, financial modelling and teaser preparation are available separately if your materials need work first." },
  { title: "Reach the right investors", body: "We route your listing to investors whose mandate matches it, and arrange roadshows where the room justifies one." },
  { title: "Close the raise", body: "Work through diligence and negotiation to signed terms. The success fee applies only if the raise closes." },
];

/* ---------------------------------------------------------------- Investment process */

export const PROCESS: Step[] = [
  { title: "Screen", body: "Financials, ownership and documents are verified before a listing goes live." },
  { title: "Match", body: "Each opportunity is scored against your written mandate before it reaches you." },
  { title: "Engage", body: "Data rooms open once the NDA is signed. Messaging and roadshows run in one place." },
  { title: "Close", body: "Term sheets, agreements and allocation are tracked through to funding." },
];

/* ---------------------------------------------------------------- Listing tiers */

export type Tier = {
  name: string;
  price: string;
  cadence: string;
  tagline: string;
  featured?: boolean;
  features: string[];
};

export const LISTING_TIERS: Tier[] = [
  {
    name: "Standard",
    price: "$490",
    cadence: "listing",
    tagline: "Be visible to investors searching the marketplace.",
    features: ["Verified business listing", "Appears in marketplace search", "Basic performance analytics", "Secure messaging with investors", "90-day listing window"],
  },
  {
    name: "Silver",
    price: "$1,200",
    cadence: "listing",
    tagline: "Higher placement, plus a data room for your documents.",
    features: ["Everything in Standard", "Priority search placement", "Featured-opportunity badge", "Data room (up to 25 documents)", "Extended 180-day window"],
  },
  {
    name: "Gold",
    price: "$3,500",
    cadence: "listing",
    tagline: "Actively promoted to matched investors.",
    featured: true,
    features: ["Everything in Silver", "Homepage & newsletter features", "Direct mandate-matched outreach", "One personalised roadshow", "Dedicated deal manager"],
  },
  {
    name: "Platinum",
    price: "Custom",
    cadence: "scoped per engagement",
    tagline: "A managed raise, run by our team end to end.",
    features: ["Everything in Gold", "Multiple targeted roadshows", "Business plan & financial modelling", "Shadow investor search", "Priority success-fee terms"],
  },
];

/* ---------------------------------------------------------------- Services */

export type Service = { title: string; body: string; icon: LucideIcon; audience: "investor" | "business" };

export const SERVICES: Service[] = [
  { title: "Specialised roadshows", body: "Sessions built around your mandate, with every business screened against it before the invitation goes out.", icon: Presentation, audience: "investor" },
  { title: "Local events access", body: "Events in the markets you are targeting, hosted alongside operators and advisers who work there.", icon: Users, audience: "investor" },
  { title: "Market access support", body: "Introductions to suppliers, buyers and partners once the investment is made.", icon: Search, audience: "investor" },
  { title: "Business plan writing", body: "Plans built around what investors read first: the market, the model, the numbers and the team.", icon: FileText, audience: "business" },
  { title: "Financial modelling", body: "Models where every assumption is stated and can be traced back to its source.", icon: LineChart, audience: "business" },
  { title: "Teaser & pitch preparation", body: "A teaser and deck written to earn the second meeting.", icon: Presentation, audience: "business" },
];

/* ---------------------------------------------------------------- Featured opportunities (illustrative) */

export type Opportunity = {
  name: string;
  sector: string;
  country: string;
  region: string;
  stage: string;
  instrument: string;
  ask: string;
  targetReturn: string;
  match: number;
  tier: "Standard" | "Silver" | "Gold" | "Platinum";
  blurb: string;
  /**
   * The business's own image, once it supplies one. Takes priority over the
   * sector imagery in lib/imagery.ts — a real photograph of a real asset
   * should always beat a category stand-in.
   */
  image?: string;
};

export const FEATURED_OPPORTUNITIES: Opportunity[] = [
  { name: "Sahara Solar Grid", sector: "Renewable Energy", country: "Kenya", region: "East Africa", stage: "Growth", instrument: "Equity", ask: "$18M", targetReturn: "22% IRR", match: 94, tier: "Platinum", blurb: "Utility-scale solar & storage platform expanding across three East African markets." },
  { name: "Lagos HealthTech", sector: "Digital Health", country: "Nigeria", region: "West Africa", stage: "Series A", instrument: "Equity", ask: "$8M", targetReturn: "3.1× MOIC", match: 89, tier: "Gold", blurb: "Telehealth and diagnostics network serving 2M+ patients with 140% YoY growth." },
  { name: "Atlas Logistics", sector: "Transport & Logistics", country: "Morocco", region: "North Africa", stage: "Buyout", instrument: "Equity + Debt", ask: "$32M", targetReturn: "19% IRR", match: 86, tier: "Gold", blurb: "Cross-border freight operator with a buy-and-build consolidation thesis." },
  { name: "Cape Wine Estates", sector: "Food & Beverage", country: "South Africa", region: "Southern Africa", stage: "Mature", instrument: "Preferred Equity", ask: "$12M", targetReturn: "15% IRR", match: 82, tier: "Silver", blurb: "Premium export-focused winemaker with an established distribution footprint." },
  { name: "Accra FinPay", sector: "FinTech", country: "Ghana", region: "West Africa", stage: "Growth", instrument: "Equity", ask: "$15M", targetReturn: "4.0× MOIC", match: 80, tier: "Gold", blurb: "Merchant payments and embedded lending rails processing $400M annually." },
  { name: "Rift Valley AgriTech", sector: "Agriculture", country: "Tanzania", region: "East Africa", stage: "Series A", instrument: "Equity", ask: "$6M", targetReturn: "3.4× MOIC", match: 77, tier: "Silver", blurb: "Precision-farming platform lifting smallholder yields with satellite data." },
];

/* ---------------------------------------------------------------- Testimonials */

export type Testimonial = { quote: string; name: string; role: string };

/**
 * Client quotes must be real and attributed with permission — invented
 * endorsements are a compliance risk for a regulated financial business, so
 * this stays empty until we have consented quotes to publish. The Testimonials
 * section renders nothing while it is empty.
 */
export const TESTIMONIALS: Testimonial[] = [];

/* ---------------------------------------------------------------- Insights */

export type Insight = { title: string; category: string; readTime: string; date: string };

export const INSIGHTS: Insight[] = [
  { title: "Why Africa's mid-market is the decade's most mispriced opportunity", category: "Market Intelligence", readTime: "6 min", date: "Jul 2026" },
  { title: "The anatomy of a fundable pitch: what investors actually read first", category: "For Businesses", readTime: "5 min", date: "Jun 2026" },
  { title: "Private credit vs. equity: structuring the right instrument for growth", category: "Deal Structuring", readTime: "8 min", date: "Jun 2026" },
];

/* ---------------------------------------------------------------- Events */

export type EventItem = { title: string; type: string; location: string; date: string; month: string; day: string };

export const EVENTS: EventItem[] = [
  { title: "East Africa Capital Roadshow", type: "Roadshow", location: "Nairobi, Kenya", date: "18 Sep 2026", month: "SEP", day: "18" },
  { title: "Global Investor Forum", type: "Forum", location: "London, UK", date: "02 Oct 2026", month: "OCT", day: "02" },
  { title: "West Africa Deal Day", type: "Networking", location: "Lagos, Nigeria", date: "21 Oct 2026", month: "OCT", day: "21" },
];

/* ---------------------------------------------------------------- Why choose us */

export const WHY: { title: string; body: string; icon: LucideIcon }[] = [
  { title: "Screened before listed", body: "Financials, ownership and documents are checked before a business goes live. Listings that fail that check never reach the marketplace.", icon: ShieldCheck },
  { title: "Scored against your mandate", body: "Every opportunity is scored on fifteen weighted criteria drawn from your written mandate, and each score shows the reasoning behind it.", icon: LineChart },
  { title: "People in the market", body: "Our team meets business owners where they operate, so what reaches you is informed by more than a data room.", icon: Users },
  { title: "Paid on outcomes", body: "Businesses pay a success fee when a raise closes. If it doesn't close, there's no fee to collect.", icon: Landmark },
];
