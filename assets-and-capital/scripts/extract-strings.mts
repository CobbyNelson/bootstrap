import fs from "node:fs";
import { LEGAL_DOCS } from "./lib/legal-docs";
import * as C from "./lib/content";

/**
 * Walk the real objects instead of regexing the source.
 *
 * The first attempt regexed TypeScript and pulled in dates, IRR figures, import
 * paths and — through an unbalanced backtick match — a slab of raw source. The
 * data is already structured; reading it is both simpler and exact.
 */

type Entry = { source: string; context: string };
const out: Entry[] = [];
const seen = new Set<string>();
const confirms: Entry[] = [];

// Keys whose values are identifiers, codes or figures, never prose.
const SKIP_KEYS = new Set([
  "href", "icon", "slug", "id", "key", "image", "src", "count", "value",
  "price", "cadence", "ask", "targetReturn", "match", "tier", "date", "updated",
  "readTime", "author", "authorRole", "type", "status",
  // Proper nouns. A business is called Atlas Logistics in every language, and
  // "translating" it would invent a company that does not exist.
  "name", "company", "country",
  // Already translated as a closed vocabulary in the dictionaries.
  "sector", "stage", "instrument", "region",
]);

const looksLikeCopy = (s: string) =>
  s.length >= 2 &&
  /[A-Za-z]/.test(s) &&
  !/^@\//.test(s) &&
  !/^https?:/.test(s) &&
  !/^\//.test(s) &&
  !/^\d{1,2} [A-Z][a-z]{2} \d{4}$/.test(s) &&      // 02 Oct 2026
  !/^[\d.]+%?\s*(IRR|MOIC|x)?$/.test(s) &&          // 15% IRR
  !/^[A-Z]{2,5}$/.test(s) &&                        // ISO-ish codes
  !/\n\s{2,}\w+:/.test(s);                          // captured source

function add(source: unknown, context: string) {
  if (typeof source !== "string") return;
  const s = source.trim();
  if (!s || seen.has(s) || !looksLikeCopy(s)) return;
  // Draft legal text pending counsel. Translating a placeholder would carry an
  // unanswered question into three more languages and make it four times as
  // easy to miss.
  if (s.includes("[CONFIRM")) { confirms.push({ source: s, context }); return; }
  seen.add(s);
  out.push({ source: s, context });
}

function walk(node: unknown, context: string) {
  if (typeof node === "string") return add(node, context);
  if (Array.isArray(node)) return node.forEach((n) => walk(n, context));
  if (node && typeof node === "object") {
    for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
      if (SKIP_KEYS.has(k)) continue;
      walk(v, context);
    }
  }
}

// ---- legal, one context per document so the editor groups usefully
for (const [slug, doc] of Object.entries(LEGAL_DOCS)) {
  walk(doc, `Legal — ${doc.title || slug}`);
}

// ---- site content, grouped by the export it came from
const GROUPS: Record<string, string> = {
  STATS: "Home — statistics", INDUSTRIES: "Industries", HOW_INVESTOR: "How it works — investors",
  HOW_BUSINESS: "How it works — businesses", PROCESS: "Investment process",
  LISTING_TIERS: "Pricing — listing tiers", SERVICES: "Services", WHY: "Why us",
  TESTIMONIALS: "Testimonials", EVENTS: "Events", INSIGHTS: "Insights", NAV: "Navigation",
  FEATURED_OPPORTUNITIES: "Featured opportunities",
};
for (const [name, context] of Object.entries(GROUPS)) {
  const v = (C as Record<string, unknown>)[name];
  if (v) walk(v, context);
}
add(C.SITE.tagline, "Brand");
add(C.SITE.description, "Brand");

// ---- inline JSX copy from the page components
const PAGES: Record<string, string> = {
  about: "About page", pricing: "Pricing page", faq: "FAQ page",
  businesses: "For businesses page", investors: "For investors page",
  contact: "Contact page", events: "Events page", marketplace: "Marketplace",
  register: "Registration", "register/business": "Registration", "register/investor": "Registration",
};
for (const [route, context] of Object.entries(PAGES)) {
  const f = `app/[locale]/(site)/${route}/page.tsx`;
  if (!fs.existsSync(f)) continue;
  const src = fs.readFileSync(f, "utf8");
  for (const m of src.matchAll(/>\s*([A-Z][^<>{}\n]{12,400}?)\s*</g)) add(m[1].replace(/\s+/g, " "), context);
  for (const m of src.matchAll(/(?:title|subtitle|label|description|placeholder)=\{?"([^"]{6,400})"/g)) add(m[1], context);
}

out.sort((a, b) => a.context.localeCompare(b.context) || a.source.localeCompare(b.source));
fs.writeFileSync("/tmp/strings.json", JSON.stringify(out, null, 2));

const byCtx: Record<string, number> = {};
for (const e of out) byCtx[e.context] = (byCtx[e.context] || 0) + 1;
fs.writeFileSync("/tmp/confirms.json", JSON.stringify(confirms, null, 2));
console.log("  EXCLUDED (draft, [CONFIRM] pending counsel):", confirms.length);
console.log("  strings:", out.length, "| words:", out.reduce((a, e) => a + e.source.split(/\s+/).length, 0));
for (const [k, v] of Object.entries(byCtx).sort((a, b) => b[1] - a[1])) console.log(`    ${String(v).padStart(4)}  ${k}`);
