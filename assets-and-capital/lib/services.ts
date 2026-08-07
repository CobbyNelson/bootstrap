/**
 * The service pages, in one place.
 *
 * This record used to live inside app/[locale]/(site)/services/[slug]/page.tsx,
 * which meant the only way to know what services exist was to render one of
 * them. There was no index page at /services as a direct result — and the site
 * linked to it anyway, so the assistant handed visitors a 404.
 *
 * Both the index and the detail page now read from here, so a service added
 * once appears in both, and `generateStaticParams` and the index listing can
 * never disagree about which slugs exist.
 */
export type ServiceContent = {
  title: string;
  subtitle: string;
  audience: "investor" | "business";
  intro: string;
  features: string[];
  cta: { label: string; href: string };
};

export const SERVICES: Record<string, ServiceContent> = {
  roadshows: {
    title: "Specialised roadshows",
    subtitle: "Meet several pre-screened opportunities, or reach targeted investors, in one session.",
    audience: "investor",
    intro:
      "Our roadshows put the right people in the same room. For investors, we assemble a slate of pre-screened, mandate-matched opportunities. For businesses, we secure meetings with investors whose mandate fits your raise — organised end to end by our team.",
    features: ["Pre-screened, mandate-matched participants", "Agendas built around your stated criteria", "In-person and virtual formats", "Full logistics handled by our team", "Follow-up and introductions after the event"],
    cta: { label: "Request a roadshow", href: "/contact" },
  },
  "market-access": {
    title: "Market access support",
    subtitle: "Connect with suppliers, buyers, and partners to grow beyond the initial investment.",
    audience: "investor",
    intro:
      "The work continues after the money lands. Our team in-market makes the introductions a new investment needs early: suppliers, buyers, distribution partners and the advisers who know the terrain.",
    features: ["Local partner introductions", "Supplier and buyer connections", "Market-entry guidance", "Regulatory and operational context", "Ongoing relationship support"],
    cta: { label: "Talk to our team", href: "/contact" },
  },
  "business-plan": {
    title: "Business plan writing",
    subtitle: "Plans built around what investors read first.",
    audience: "business",
    intro:
      "A plan earns the meeting when it answers the obvious questions before they are asked. We write yours to set out the market, substantiate the ask, and address what diligence will raise.",
    features: ["Market and competitive analysis", "Clear articulation of the ask and use of funds", "Growth strategy and milestones", "Risk assessment and mitigation", "Investor-ready formatting and design"],
    cta: { label: "Get started", href: "/register/business" },
  },
  "financial-modelling": {
    title: "Financial modelling",
    subtitle: "Models where every assumption is stated and sourced.",
    audience: "business",
    intro:
      "Investors will pull your model apart, so it should be built to survive that. We write three-statement models where each assumption is visible, sourced and easy to test against a different view.",
    features: ["Three-statement financial models", "Scenario and sensitivity analysis", "Valuation support", "Unit economics and cohort analysis", "Clear, auditable assumptions"],
    cta: { label: "Get started", href: "/register/business" },
  },
  teaser: {
    title: "Teaser & pitch preparation",
    subtitle: "A teaser and deck written to earn the second meeting.",
    audience: "business",
    intro:
      "Most investors decide whether to read on within a page. We prepare a teaser that states the opportunity plainly, and a deck that holds up when it gets forwarded round the table.",
    features: ["Concise, high-impact teaser", "Full investor pitch deck", "Narrative and design handled together", "Key metrics presented clearly", "Aligned to what investors read first"],
    cta: { label: "Get started", href: "/register/business" },
  },
};
