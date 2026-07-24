import {
  Cpu, HeartPulse, Landmark, ShoppingBag, Zap, Factory, Mountain, Building2,
  Radio, TrafficCone, Wheat, Plane, GraduationCap, Leaf,
  Search, FileText, Presentation, LineChart, ShieldCheck, Users,
  type LucideIcon,
} from "lucide-react";

/* ---------------------------------------------------------------- Site */

export const SITE = {
  name: "Assets & Capital",
  legalName: "Assets and Capital Limited",
  short: "A&C",
  domain: "assetsandcapitalltd.com",
  email: "hello@assetsandcapitalltd.com",
  phone: "+44 20 3900 0000",
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
          { label: "Why invest with us", href: "/investors", description: "Curated, mandate-matched deal flow", icon: ShieldCheck },
          { label: "Browse the marketplace", href: "/marketplace", description: "1,200+ vetted opportunities", icon: Search },
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

export const STATS: Stat[] = [
  { value: 2.4, prefix: "$", suffix: "B", label: "Capital connected", decimals: 1 },
  { value: 1200, suffix: "+", label: "Vetted opportunities" },
  { value: 480, suffix: "+", label: "Active investors" },
  { value: 46, label: "Countries covered" },
];

/* ---------------------------------------------------------------- Industries (from questionnaire taxonomy) */

export type Industry = { name: string; icon: LucideIcon; blurb: string; count: number };

export const INDUSTRIES: Industry[] = [
  { name: "Information Technology & Digital", icon: Cpu, blurb: "SaaS, cloud, AI/ML, fintech, cybersecurity, e-commerce", count: 214 },
  { name: "Healthcare & Life Sciences", icon: HeartPulse, blurb: "Providers, pharma & biotech, devices, digital health", count: 138 },
  { name: "Financial Services", icon: Landmark, blurb: "Banking, insurance, wealth management, payments", count: 121 },
  { name: "Consumer & Retail", icon: ShoppingBag, blurb: "FMCG, retail chains, luxury, food & beverage", count: 96 },
  { name: "Energy & Utilities", icon: Zap, blurb: "Oil & gas, renewables, energy infrastructure, utilities", count: 88 },
  { name: "Industrials & Manufacturing", icon: Factory, blurb: "Logistics, machinery, aerospace, automotive, supply chain", count: 74 },
  { name: "Materials & Natural Resources", icon: Mountain, blurb: "Mining & metals, chemicals, construction materials", count: 61 },
  { name: "Real Estate & Property", icon: Building2, blurb: "Residential, commercial, logistics, hospitality, REITs", count: 152 },
  { name: "Communications & Media", icon: Radio, blurb: "Telecom, broadcasting & streaming, digital media", count: 43 },
  { name: "Infrastructure", icon: TrafficCone, blurb: "Transport, utilities & digital/telecom infrastructure", count: 57 },
  { name: "Agriculture & Food Systems", icon: Wheat, blurb: "Farming, agri-tech, food processing & distribution", count: 69 },
  { name: "Hospitality, Travel & Leisure", icon: Plane, blurb: "Hotels, resorts, airlines, travel services", count: 38 },
  { name: "Education & Workforce", icon: GraduationCap, blurb: "EdTech, training services, corporate learning", count: 31 },
  { name: "ESG & Sustainability", icon: Leaf, blurb: "Clean energy, green infrastructure, water & waste", count: 84 },
];

/* ---------------------------------------------------------------- How it works */

export type Step = { title: string; body: string };

export const HOW_INVESTOR: Step[] = [
  { title: "Register your mandate", body: "Tell us your objectives, strategy, geographies, sectors and ticket size. Our guided form builds a structured investment mandate in minutes." },
  { title: "Get matched", body: "Our matching engine screens every incoming opportunity against your mandate and surfaces only mandate-fit deals — with an explainable match score." },
  { title: "Diligence & connect", body: "Access data rooms, request roadshows to pre-screened opportunities, and connect with businesses through a secure, audited workflow." },
  { title: "Deploy capital", body: "Move from introduction to allocation with document workflows and on-the-ground support from our global team." },
];

export const HOW_BUSINESS: Step[] = [
  { title: "List your opportunity", body: "Create a verified profile with your ask, instrument, and financials. Choose a listing tier from Standard to Platinum." },
  { title: "Get investor-ready", body: "Optional services — business plan writing, financial modelling, and teaser preparation — sharpen your materials before investors see them." },
  { title: "Reach the right investors", body: "We actively route your opportunity to investors whose mandate fits, backed by personalised roadshows and outreach." },
  { title: "Close the raise", body: "Progress through diligence and negotiation to a closed deal. We charge a success fee only when you succeed." },
];

/* ---------------------------------------------------------------- Investment process */

export const PROCESS: Step[] = [
  { title: "Screen", body: "Every business is vetted and verified before it reaches an investor." },
  { title: "Match", body: "Mandate-aware matching connects capital to opportunity, not noise." },
  { title: "Engage", body: "Secure data rooms, messaging, and curated roadshows move deals forward." },
  { title: "Close", body: "Document workflows and expert support carry a match to a closed allocation." },
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
    cadence: "per listing",
    tagline: "Get discovered by our investor network.",
    features: ["Verified business listing", "Appears in marketplace search", "Basic performance analytics", "Secure messaging with investors", "90-day listing window"],
  },
  {
    name: "Silver",
    price: "$1,200",
    cadence: "per listing",
    tagline: "Stand out with enhanced visibility.",
    features: ["Everything in Standard", "Priority search placement", "Featured-opportunity badge", "Data room (up to 25 documents)", "Extended 180-day window"],
  },
  {
    name: "Gold",
    price: "$3,500",
    cadence: "per listing",
    tagline: "Actively promoted to matched investors.",
    featured: true,
    features: ["Everything in Silver", "Homepage & newsletter features", "Direct mandate-matched outreach", "One personalised roadshow", "Dedicated deal manager"],
  },
  {
    name: "Platinum",
    price: "Custom",
    cadence: "engagement",
    tagline: "White-glove capital raising, end to end.",
    features: ["Everything in Gold", "Multiple targeted roadshows", "Business plan & financial modelling", "Shadow investor search", "Priority success-fee terms"],
  },
];

/* ---------------------------------------------------------------- Services */

export type Service = { title: string; body: string; icon: LucideIcon; audience: "investor" | "business" };

export const SERVICES: Service[] = [
  { title: "Specialised roadshows", body: "Meet multiple pre-screened opportunities in curated sessions built around your mandate.", icon: Presentation, audience: "investor" },
  { title: "Local events access", body: "On-the-ground events that deliver real market insight in the geographies you target.", icon: Users, audience: "investor" },
  { title: "Market access support", body: "Connect with suppliers, buyers, and partners to grow beyond the initial investment.", icon: Search, audience: "investor" },
  { title: "Business plan writing", body: "Investor-ready plans that frame your opportunity with clarity and credibility.", icon: FileText, audience: "business" },
  { title: "Financial modelling", body: "Defensible, assumption-driven models and financial statements that stand up to diligence.", icon: LineChart, audience: "business" },
  { title: "Teaser & pitch preparation", body: "A compelling teaser and pitch that earns a second meeting.", icon: Presentation, audience: "business" },
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

export const TESTIMONIALS: Testimonial[] = [
  { quote: "Assets & Capital brought us three mandate-fit opportunities in a month that our own network hadn't surfaced in a year. The roadshow was flawless.", name: "Aisha Bello", role: "CIO, Family Office · Dubai" },
  { quote: "We raised our Series A in eleven weeks. Their team didn't just list us — they put us in front of the exact investors who understood our market.", name: "David Mensah", role: "Founder & CEO · Accra FinPay" },
  { quote: "The mandate matching is genuinely intelligent. It filters out the noise and lets my team spend diligence hours where they count.", name: "Marcus Lindqvist", role: "Partner, Growth Equity · London" },
];

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
  { title: "Vetted, not listed", body: "Every opportunity is screened and verified before an investor ever sees it. Quality over volume, always.", icon: ShieldCheck },
  { title: "Mandate-aware matching", body: "We match capital to opportunity on written mandate fit — with explainable scores, not guesswork.", icon: LineChart },
  { title: "On-the-ground partner", body: "A global team that engages business owners in-market and delivers real, local intelligence.", icon: Users },
  { title: "Aligned incentives", body: "Success fees mean we win when you do. Our interests are pointed the same direction as yours.", icon: Landmark },
];
