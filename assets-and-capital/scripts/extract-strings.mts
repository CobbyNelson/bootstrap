import fs from "node:fs";
import { LEGAL_DOCS } from "../lib/legal-docs";
import * as C from "../lib/content";

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
  !/\n\s{2,}\w+:/.test(s) &&
  // aria-roledescription values and other single lowercase tokens are API
  // vocabulary the browser interprets, not words a reader sees.
  !/^[a-z][a-z-]*$/.test(s) &&
  // Form field ids and state keys — companyName, fd_categories, ac_session.
  // The const-array sweep picks these up because they sit beside real copy in
  // the same objects, but they are addresses the code uses, not words anyone
  // reads. 29 of them reached the translators, who correctly returned each
  // one unchanged.
  !/^(fd_|ac_)[a-z_]+$/.test(s) &&
  !/^[a-z]+[A-Z][A-Za-z]*$/.test(s);                          // captured source

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

// ---- inline JSX copy from pages AND components
//
// components/** was missed on the first pass, which is why the site showed
// French data inside English section headings: everything that lived in
// lib/content.ts translated, and everything written directly in JSX did not.
// A visitor cannot tell the difference between the two, so neither should this.
const PAGES: Record<string, string> = {
  about: "About page", pricing: "Pricing page", faq: "FAQ page",
  businesses: "For businesses page", investors: "For investors page",
  contact: "Contact page", events: "Events page", marketplace: "Marketplace",
  register: "Registration", "register/business": "Registration", "register/investor": "Registration",
};

function scanFile(file: string, context: string) {
  const src = fs.readFileSync(file, "utf8");
  // JSX text nodes.
  for (const m of src.matchAll(/>\s*([A-Z][^<>{}\n]{6,400}?)\s*</g)) add(m[1].replace(/\s+/g, " "), context);
  // Copy passed as props.
  for (const m of src.matchAll(/(?:title|subtitle|label|description|placeholder|heading|eyebrow|cta)=\{?"([^"]{4,400})"/g)) add(m[1], context);
  // Already-wired strings.
  //
  // This is the authoritative pattern, not a fallback: wrapping a literal in
  // tl() is an explicit declaration that it is translatable, whereas the JSX
  // and prop patterns above are inference. Without this, wiring a string
  // REMOVES it from the registry — `title="X"` stops matching the moment it
  // becomes `title={t.tl("X")}` — so doing the right thing would silently
  // delete the translation the next time the registry regenerated.
  // Copy held in const arrays rather than JSX — `{ label: "Logistics", any:
  // "Any sector" }`. These are rendered through tl() at the call site, so they
  // ARE translatable, but neither the JSX nor the prop pattern sees them: they
  // are object properties, not attributes. Nine strings reached production
  // untranslated this way, wired correctly and never extracted.
  for (const m of src.matchAll(/(?:^|[\s{,])(?:label|any|title|name|blurb|description|heading)\s*:\s*"([^"]{3,300})"/gm)) {
    add(m[1], context);
  }
  for (const m of src.matchAll(/\bt?\.?tl\(\s*"((?:[^"\\]|\\.)+)"\s*\)/g)) {
    add(m[1].replace(/\\"/g, '"'), context);
  }
}

for (const [route, context] of Object.entries(PAGES)) {
  const f = `app/[locale]/(site)/${route}/page.tsx`;
  if (fs.existsSync(f)) scanFile(f, context);
}

// Every component that renders public copy. Admin and dashboard are excluded:
// they are staff tools, English-only, and translating them would triple the
// editor's length for strings no visitor ever sees.
function walkDir(dir: string, out: string[] = []): string[] {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = `${dir}/${e.name}`;
    if (e.isDirectory()) {
      if (["admin", "dashboard"].includes(e.name)) continue;
      walkDir(full, out);
    } else if (e.name.endsWith(".tsx")) out.push(full);
  }
  return out;
}

const AREA: Record<string, string> = {
  home: "Home page", layout: "Navigation & footer", marketplace: "Marketplace",
  ui: "Shared interface", search: "Search", chat: "Chat", register: "Registration",
  insights: "Insights", payments: "Checkout", i18n: "Shared interface", seo: "Shared interface",
  providers: "Shared interface", analytics: "Shared interface",
};
for (const f of walkDir("components")) {
  const area = f.split("/")[1];
  scanFile(f, AREA[area] ?? "Shared interface");
}

out.sort((a, b) => a.context.localeCompare(b.context) || a.source.localeCompare(b.source));
fs.writeFileSync("/tmp/strings.json", JSON.stringify(out, null, 2));

const byCtx: Record<string, number> = {};
for (const e of out) byCtx[e.context] = (byCtx[e.context] || 0) + 1;
fs.writeFileSync("/tmp/confirms.json", JSON.stringify(confirms, null, 2));
console.log("  EXCLUDED (draft, [CONFIRM] pending counsel):", confirms.length);
console.log("  strings:", out.length, "| words:", out.reduce((a, e) => a + e.source.split(/\s+/).length, 0));
for (const [k, v] of Object.entries(byCtx).sort((a, b) => b[1] - a[1])) console.log(`    ${String(v).padStart(4)}  ${k}`);
