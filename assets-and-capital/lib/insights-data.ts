/* ============================================================
   Market Insights — publication data for the insights portal.
   In production this is a CMS collection; the shape stays the same.
   ============================================================ */

export type Article = {
  slug: string;
  title: string;
  category: string;
  type: "Market Intelligence" | "Country Report" | "Investment Guide" | "White Paper" | "Case Study" | "Interview" | "ESG";
  excerpt: string;
  readTime: string;
  date: string;
  author: string;
  authorRole: string;
  featured?: boolean;
  body: { h?: string; p: string }[];
};

export const CATEGORIES = ["All", "Market Intelligence", "Country Report", "Investment Guide", "White Paper", "Case Study", "Interview", "ESG"] as const;

export const INDICATORS = [
  { label: "Africa private capital raised (2025)", value: "$6.2B", delta: "+9%", up: true },
  { label: "Median growth-equity ticket", value: "$14M", delta: "+4%", up: true },
  { label: "Avg. time to close (platform)", value: "5.8 wks", delta: "−31%", up: true },
  { label: "Renewables share of deal flow", value: "22%", delta: "+6pt", up: true },
];

export const ARTICLES: Article[] = [
  {
    slug: "africa-mid-market-mispriced-opportunity",
    title: "Why Africa's mid-market is the decade's most mispriced opportunity",
    category: "Private Equity",
    type: "Market Intelligence",
    excerpt: "Structural demand, a thin intermediation layer, and improving exits are converging. The mid-market is where the mispricing lives.",
    readTime: "6 min",
    date: "Jul 2026",
    author: "Aisha Bello",
    authorRole: "Head of Research",
    featured: true,
    body: [
      { p: "For a decade, the story told about African private markets was one of promise deferred. That framing is now out of date. Beneath the headline volatility sits a mid-market — companies raising $5M to $50M — that combines structural demand growth with an intermediation layer too thin to price it efficiently." },
      { h: "The demand base is structural, not cyclical", p: "Urbanisation, financial inclusion, and energy access are secular trends that compound regardless of the global rate cycle. Businesses serving these needs are growing revenue at 30–50% annually while trading at entry multiples a fraction of comparable emerging-market peers." },
      { h: "Intermediation is the bottleneck — and the edge", p: "The gap is not capital; it is connection. Deal flow arrives through fragmented networks, and the cost of diligence on a misfit opportunity is high. Platforms that screen, verify, and match on written mandate compress that cost — turning a relationship-bound market into an addressable one." },
      { h: "Exits are quietly improving", p: "Strategic buyers and a maturing secondaries market are widening the exit aperture. As realised DPI accumulates, the asset class re-rates. Allocators who build relationships now, before the re-rating is consensus, capture the mispricing." },
    ],
  },
  {
    slug: "kenya-country-report-2026",
    title: "Kenya country report: fintech, energy, and the SME credit gap",
    category: "East Africa",
    type: "Country Report",
    excerpt: "A data-led view of Kenya's investable sectors, regulatory posture, and the $19B SME financing gap driving demand.",
    readTime: "9 min",
    date: "Jun 2026",
    author: "David Mensah",
    authorRole: "Regional Analyst",
    body: [
      { p: "Kenya remains East Africa's deepest private-capital market, anchored by a fintech sector that has become an export in its own right and an energy transition moving faster than most OECD peers on a per-capita basis." },
      { h: "Fintech: from payments to embedded credit", p: "Mobile money laid rails that a second generation of companies is now monetising through lending, insurance, and merchant services. The most fundable businesses show contracted revenue and disciplined unit economics rather than user-growth vanity metrics." },
      { h: "Energy: utility-scale meets distributed", p: "Solar-and-storage platforms are reaching bankability with signed power-purchase agreements, while distributed players extend the grid's edge. Both are drawing infrastructure and growth-equity capital, often side by side." },
      { h: "The SME credit gap", p: "An estimated $19B SME financing gap underpins durable demand for private credit and growth equity. For allocators, the constraint is not opportunity count but the vetting and structuring capacity to convert it into closed allocations." },
    ],
  },
  {
    slug: "anatomy-of-a-fundable-pitch",
    title: "The anatomy of a fundable pitch: what investors read first",
    category: "For Businesses",
    type: "Investment Guide",
    excerpt: "A practical guide to the six things institutional investors evaluate before they take a second meeting.",
    readTime: "5 min",
    date: "Jun 2026",
    author: "Marcus Lindqvist",
    authorRole: "Advisory Partner",
    body: [
      { p: "Investors do not read pitch decks front to back. They triage. Understanding the order of that triage is the difference between a second meeting and a polite pass." },
      { h: "1. The ask, stated plainly", p: "Amount, instrument, and use of funds in the first minute. Ambiguity here reads as a lack of preparation." },
      { h: "2. Market fit and timing", p: "Why this, why now. A credible, specific market thesis beats a large but generic TAM." },
      { h: "3. Evidence over narrative", p: "Contracted revenue, cohort retention, and defensible margins carry more weight than adjectives. Show the data room is ready." },
      { h: "4. The team's right to win", p: "Continuity, domain depth, and a repeatable go-to-market motion. Investors back operators who have done the hard part before." },
    ],
  },
  {
    slug: "private-credit-vs-equity-structuring",
    title: "Private credit vs. equity: structuring the right instrument for growth",
    category: "Deal Structuring",
    type: "White Paper",
    excerpt: "When to reach for debt, preferred equity, or common — and how instrument choice shapes alignment and returns.",
    readTime: "8 min",
    date: "Jun 2026",
    author: "Aisha Bello",
    authorRole: "Head of Research",
    body: [
      { p: "Instrument choice is not a financing detail; it is the alignment mechanism between capital and operator. The right structure protects downside without starving the upside that made the deal attractive." },
      { h: "Debt where cash flows are visible", p: "For businesses with contracted, predictable cash flows, senior secured debt offers capital preservation and yield with covenant protection — well suited to preservation-first mandates." },
      { h: "Preferred equity for asymmetric bets", p: "Preferred structures with a liquidation preference and participation blend downside protection with equity-like upside — a fit for growth businesses that are not yet consistently profitable." },
      { h: "Common where conviction is highest", p: "Common equity is the purest expression of conviction and, structured with sensible governance, the strongest alignment. It belongs where the thesis, team, and terms all clear a high bar." },
    ],
  },
  {
    slug: "accra-finpay-case-study",
    title: "Case study: how Accra FinPay closed a Series A in eleven weeks",
    category: "West Africa",
    type: "Case Study",
    excerpt: "A fintech's path from listing to term sheet — and the three decisions that compressed the timeline.",
    readTime: "7 min",
    date: "May 2026",
    author: "David Mensah",
    authorRole: "Regional Analyst",
    body: [
      { p: "Accra FinPay reached a signed term sheet eleven weeks after listing. The speed was not luck; it was the product of three decisions made before the first investor conversation." },
      { h: "Decision one: get investor-ready first", p: "Before matching, the team completed a professional financial model and a permissioned data room. When investors arrived, diligence flowed instead of stalling." },
      { h: "Decision two: match on mandate, not volume", p: "Rather than broadcast to hundreds, the company was routed to the eleven investors whose mandate actually matched the raise. Three took a first meeting." },
      { h: "Decision three: run a real process", p: "A structured pipeline with enforced stages kept momentum and created healthy competitive tension, which surfaced in the final terms." },
    ],
  },
  {
    slug: "esg-emerging-markets-signal",
    title: "ESG in emerging markets: signal, not checkbox",
    category: "ESG",
    type: "ESG",
    excerpt: "Why credible ESG in frontier markets is an underwriting signal of management quality — and how to assess it.",
    readTime: "9 min",
    date: "Apr 2026",
    author: "Marcus Lindqvist",
    authorRole: "Advisory Partner",
    body: [
      { p: "In frontier markets, ESG is too often treated as a compliance overlay. The allocators who do best treat it as an underwriting signal — a lens on management quality and durability." },
      { h: "Governance predicts execution", p: "Businesses with real board discipline, clean cap tables, and transparent reporting tend to execute better. ESG diligence surfaces these traits before the numbers do." },
      { h: "Environmental exposure is financial exposure", p: "Water, energy, and climate resilience are not abstractions in these markets; they are line items. Pricing them explicitly is simply good risk management." },
      { h: "Social license sustains growth", p: "Businesses embedded in their communities compound advantages — talent, trust, and regulatory goodwill — that show up in retention and resilience." },
    ],
  },
  {
    slug: "interview-family-office-cio",
    title: "Interview: a family-office CIO on building African exposure",
    category: "Interview",
    type: "Interview",
    excerpt: "A candid conversation on mandate design, on-the-ground partners, and avoiding the tourist trap.",
    readTime: "10 min",
    date: "Apr 2026",
    author: "Aisha Bello",
    authorRole: "Head of Research",
    body: [
      { p: "We sat down with the CIO of a single-family office that has built meaningful African exposure over five years. The conversation is edited for length." },
      { h: "On mandate design", p: "“The mistake is a mandate so broad it matches everything and means nothing. We wrote ours to be specific — sectors, ticket band, geographies — so the platform could actually filter for us.”" },
      { h: "On on-the-ground partners", p: "“You cannot underwrite what you cannot see. A trusted local partner who engages the business owner directly is worth more than any database.”" },
      { h: "On avoiding the tourist trap", p: "“Show up consistently. The best allocations go to investors who have relationships, not the ones who parachute in for one deal and disappear.”" },
    ],
  },
  {
    slug: "north-africa-infrastructure-outlook",
    title: "North Africa infrastructure: the capital-stack opportunity",
    category: "North Africa",
    type: "Market Intelligence",
    excerpt: "Logistics, digital, and energy infrastructure across the Maghreb — and where blended capital structures fit.",
    readTime: "8 min",
    date: "Mar 2026",
    author: "David Mensah",
    authorRole: "Regional Analyst",
    body: [
      { p: "North African infrastructure sits at the intersection of European nearshoring, a young workforce, and an energy transition with real export potential. The opportunity is as much about capital structure as sector selection." },
      { h: "Logistics follows nearshoring", p: "As supply chains shorten, bonded warehousing and cold-chain assets near major ports are drawing preferred-equity and debt capital with visible, contracted demand." },
      { h: "Digital infrastructure compounds", p: "Fibre and data-centre capacity underpin every other sector's growth, offering annuity-like cash flows attractive to preservation-oriented mandates." },
      { h: "Blended structures unlock scale", p: "The most bankable deals blend concessional, commercial, and equity capital — a structuring challenge where platform-level coordination adds real value." },
    ],
  },
];

export function allArticleSlugs(): string[] {
  return ARTICLES.map((a) => a.slug);
}
export function getArticleBySlug(slug: string): Article | undefined {
  return ARTICLES.find((a) => a.slug === slug);
}
