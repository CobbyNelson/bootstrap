import "server-only";
import { SITE, LISTING_TIERS, SERVICES } from "@/lib/content";
import { MARKETPLACE } from "@/lib/marketplace-data";
import { slugify } from "@/lib/matching";

/**
 * Kwaku — the site's assistant.
 *
 * Deliberately NOT a language model. Every answer below is assembled from the
 * same data the pages render, so Kwaku cannot invent a fee, a return or a
 * business that does not exist. On a marketplace where the copy is effectively
 * a financial representation, a confidently wrong answer is worse than an
 * honest handover to a person.
 *
 * The trade is that he understands intent by matching vocabulary rather than
 * reading meaning. Each topic therefore carries the words people actually use
 * — including indirect phrasings ("what's the catch", "how do you make money")
 * — and anything that does not clear the confidence bar escalates instead of
 * guessing.
 */

export type KwakuReply = {
  answer: string;
  /** False when nothing matched well enough — the caller should escalate. */
  confident: boolean;
  /** Deep links offered alongside the answer. */
  links?: { label: string; href: string }[];
};

type Topic = {
  id: string;
  /** Words and phrases that signal this topic, including oblique ones. */
  cues: string[];
  answer: () => string;
  links?: { label: string; href: string }[];
};

const money = (s: string) => s.replace(/\s+/g, " ").trim();

const TOPICS: Topic[] = [
  {
    id: "what-is",
    cues: [
      "what is", "who are you", "what do you do", "about", "explain", "purpose",
      "what is this site", "what does the platform do", "tell me about",
    ],
    answer: () => SITE.description,
    links: [{ label: "About us", href: "/about" }],
  },
  {
    id: "listing-fees",
    cues: [
      "listing fee", "how much to list", "cost to list", "price to list", "tiers",
      "pricing", "how much does it cost", "what do i pay", "fees", "charges",
      "expensive", "cheapest", "budget",
    ],
    answer: () =>
      `Listing tiers run ${LISTING_TIERS.map((t) => `${t.name} at ${t.price} ${t.cadence}`).join(", ")}. ` +
      `Businesses also pay a success fee on capital actually raised through the platform — nothing extra if a raise does not close.`,
    links: [{ label: "See pricing", href: "/pricing" }],
  },
  {
    id: "how-you-earn",
    cues: [
      "how do you make money", "what's the catch", "whats the catch", "commission",
      "success fee", "do you take a cut", "your cut", "revenue model", "hidden cost",
    ],
    answer: () =>
      "Two ways, both stated up front: a listing fee for businesses, and a success fee on capital raised through the platform. " +
      "If a raise does not close there is no success fee. Investors register free and pay only for roadshows or partnerships they ask us to arrange.",
    links: [{ label: "See pricing", href: "/pricing" }],
  },
  {
    id: "investor-cost",
    cues: [
      "free for investors", "investor cost", "do investors pay", "cost for investors",
      "subscription", "investor plan", "as an investor what do i pay",
    ],
    answer: () =>
      "Registering and browsing core details is free for investors. A subscription unlocks full business details across the marketplace, " +
      "and expressing interest in a business opens its data room, AI profile and your personalised match rate.",
    links: [{ label: "Investor plans", href: "/pricing" }],
  },
  {
    id: "vetting",
    cues: [
      "vetted", "screening", "screened", "due diligence", "verify", "verified",
      "how do i know", "trust", "is it safe", "legit", "scam", "checks",
    ],
    answer: () =>
      "Financials, ownership and documents are checked before a business goes live — listings that fail that check never reach the marketplace. " +
      "Every opportunity is then scored against your written mandate on fifteen weighted criteria, and each score shows the reasoning behind it.",
    links: [{ label: "How we work", href: "/about" }],
  },
  {
    id: "matching",
    cues: [
      "match", "mandate", "score", "scoring", "how are deals matched", "relevant",
      "criteria", "fit", "recommend",
    ],
    answer: () =>
      "You write a mandate — sector, region, stage, instrument, ticket size. Every opportunity is scored against it on fifteen weighted criteria, " +
      "and the match rate shows on each listing once you are subscribed and have expressed interest.",
    links: [{ label: "Build your mandate", href: "/register/investor" }],
  },
  {
    id: "how-to-list",
    cues: [
      "how do i list", "raise capital", "list my business", "get funding", "seeking investment",
      "i need money", "raise money", "apply", "submit my company", "register my business",
    ],
    answer: () =>
      "Register your business, complete the intake with your financials and ownership, and choose a listing tier. " +
      "We screen it before it goes live, then match it to investors whose written mandates fit.",
    links: [
      { label: "List your business", href: "/register/business" },
      { label: "See pricing", href: "/pricing" },
    ],
  },
  {
    id: "services",
    cues: [
      "services", "business plan", "financial model", "roadshow", "pitch deck",
      "teaser", "help me prepare", "advisory", "support",
    ],
    answer: () =>
      `Alongside listings we offer ${SERVICES.slice(0, 5).map((s) => s.title.toLowerCase()).join(", ")}. ` +
      `These are priced separately and requested as you need them.`,
    links: [{ label: "All services", href: "/services" }],
  },
  {
    id: "sectors",
    cues: ["sectors", "industries", "what kind of businesses", "types of business", "categories"],
    answer: () => {
      const sectors = [...new Set(MARKETPLACE.map((o) => o.sector))];
      return `Live listings currently span ${sectors.slice(0, 8).join(", ")}${sectors.length > 8 ? " and more" : ""}.`;
    },
    links: [{ label: "Browse the marketplace", href: "/marketplace" }],
  },
  {
    id: "regions",
    cues: ["region", "country", "where", "africa", "geography", "located", "markets"],
    answer: () => {
      const regions = [...new Set(MARKETPLACE.map((o) => o.region))];
      return `Businesses on the platform are based across ${regions.join(", ")}. Investors join from anywhere.`;
    },
    links: [{ label: "Browse the marketplace", href: "/marketplace" }],
  },
  {
    id: "contact",
    cues: ["contact", "speak to someone", "phone", "email", "talk to a human", "call you", "reach you"],
    answer: () => `You can reach the team at ${SITE.email} or ${SITE.phone}. I can also put you through to someone here.`,
    links: [{ label: "Contact us", href: "/contact" }],
  },
  {
    id: "data-room",
    cues: ["data room", "documents", "financials", "nda", "confidential", "see the numbers"],
    answer: () =>
      "Data room documents open once you are subscribed and have signed the NDA on that business. " +
      "That is per-business, not a blanket unlock, and every document access is logged.",
    links: [{ label: "Browse the marketplace", href: "/marketplace" }],
  },
  {
    id: "privacy",
    cues: ["privacy", "my data", "gdpr", "delete my account", "cookies", "personal data"],
    answer: () =>
      "You can download everything we hold about you, change your cookie choices, or close your account from Settings. " +
      "Records we must keep by law are retained in anonymised form — the privacy policy says exactly which.",
    links: [{ label: "Privacy policy", href: "/legal/privacy" }],
  },
];

/** Normalise for matching: lowercase, strip punctuation, collapse whitespace. */
function norm(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

/** A listing lookup — "tell me about Sahara Solar Grid". */
function matchListing(q: string): KwakuReply | null {
  const n = norm(q);
  const hit = MARKETPLACE.find((o) => n.includes(norm(o.name)));
  if (!hit) return null;
  return {
    confident: true,
    answer: money(
      `${hit.name} is a ${hit.sector.toLowerCase()} business in ${hit.country} (${hit.region}), ` +
        `at ${hit.stage.toLowerCase()} stage, seeking ${hit.ask} in ${hit.instrument.toLowerCase()}. ${hit.blurb}`,
    ),
    links: [{ label: `Open ${hit.name}`, href: `/marketplace/${slugify(hit.name)}` }],
  };
}

/**
 * Score a topic against the question. Longer cues are worth more — matching
 * "success fee" should beat incidentally matching "fee".
 */
function score(topic: Topic, n: string): number {
  let s = 0;
  for (const cue of topic.cues) {
    const c = norm(cue);
    if (!c) continue;
    if (n.includes(c)) s += c.includes(" ") ? c.split(" ").length * 2 : 1;
  }
  return s;
}

export function askKwaku(question: string): KwakuReply {
  const n = norm(question);
  if (!n) {
    return { confident: false, answer: "" };
  }

  const listing = matchListing(question);
  if (listing) return listing;

  let best: Topic | null = null;
  let bestScore = 0;
  for (const t of TOPICS) {
    const s = score(t, n);
    if (s > bestScore) {
      best = t;
      bestScore = s;
    }
  }

  // Two-word phrase matches (score >= 4) are strong. A single generic word is
  // not enough to answer on — that is the case that should reach a person.
  if (best && bestScore >= 2) {
    return { confident: true, answer: best.answer(), links: best.links };
  }

  return {
    confident: false,
    answer:
      "That one is outside what I can answer from the site. Let me get a person for you — " +
      "they can pick this up directly.",
  };
}

/** Kwaku's opener. */
export const KWAKU_GREETING =
  `Hello, I'm Kwaku. I can answer questions about ${SITE.name} — how listing and matching work, ` +
  `fees, what is on the marketplace, or a specific business. What would you like to know?`;
