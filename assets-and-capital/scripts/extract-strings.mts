import fs from "node:fs";
import { LEGAL_DOCS } from "../lib/legal-docs";
import * as C from "../lib/content";
import { SERVICES as SERVICE_PAGES } from "../lib/services";

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
  // Any short lowercase prefix_snake token: fd_, ac_, pe_, re_. Naming each
  // prefix meant a new form's fields leaked into the registry every time —
  // re_* reached the translators on the last pass for exactly that reason.
  !/^[a-z]{2,3}_[a-z_]+$/.test(s) &&
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
// The five service pages. Their `features` are a bare array of strings —
// no key, no JSX, no tl() — so not one of the source patterns could see them,
// and the bullets rendered in English on a page that was otherwise fully
// translated. Walking the real object is what the const-array patterns are an
// approximation of; where the object is importable, use it.
walk(SERVICE_PAGES, "Services");

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
  for (const m of src.matchAll(/>\s*([A-Z][^<>{}]{6,400}?)\s*</g)) add(m[1].replace(/\s+/g, " ").trim(), context);
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
  // `desc` was absent from this list AND from the prop list, in two different
  // scanners — so the investor wizard's three branch descriptions were wired
  // correctly, reported clean, and had no registry entry to translate against.
  // The two lists are meant to agree; they now do.
  // Copy held in const arrays rather than JSX — `{ label: "Logistics", any:
  // "Any sector" }`. These are rendered through tl() at the call site, so they
  // ARE translatable, but neither the JSX nor the prop pattern sees them: they
  // are object properties, not attributes. Nine strings reached production
  // untranslated this way, wired correctly and never extracted.
  for (const m of src.matchAll(/(?:^|[\s{,])(?:label|any|title|name|blurb|body|text|copy|answer|question|q|a|description|desc|subtitle|heading|caption|summary|intro|tag|cta|note|hint|v|k)\s*:\s*"([^"]{3,300})"/gm)) {
    add(m[1], context);
  }
  // The trailing comma is not cosmetic tolerance: a formatter breaks any long
  // string onto its own line and leaves `,\n)` behind, and the old pattern
  // required `)` immediately after the quote. The one interpolated sentence on
  // the marketplace page was long enough to be formatted that way, so it was
  // wrapped correctly, checked clean, and silently absent from the registry.
  // Arrays of bare strings under a copy key — `features: ["Concise teaser",
  // "Full deck"]`. No key sits in front of each item, so the pattern above
  // cannot see them, and the pricing plans' feature lists went the same way the
  // service features did: rendered, translated at runtime by translateContent,
  // and with no registry row for a translator to fill.
  for (const m of src.matchAll(/(?:features|items|points|bullets|list|includes)\s*:\s*\[([^\]]*)\]/g)) {
    for (const q of m[1].matchAll(/"((?:[^"\\]|\\.){3,300})"/g)) add(q[1], context);
  }
  for (const m of src.matchAll(/\bt?\.?tl\(\s*"((?:[^"\\]|\\.)+)"\s*,?\s*\)/g)) {
    // Decode the source-level escapes so the registry holds what the RUNTIME
    // passes, not what the file spells. `t.tl("a \\u2014 b")` receives a literal
    // em dash; a registry entry containing the six characters of the escape
    // would key against nothing, and the string would look untranslated for
    // ever while its row sat in the database.
    const decoded = m[1]
      .replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
      .replace(/\\n/g, "\n")
      .replace(/\\t/g, "\t")
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, "\\");
    add(decoded, context);
  }
}

/**
 * Every page under the locale segment, not the routes someone remembered.
 *
 * PAGES names twelve routes and is used only to give them a nicer heading in
 * the editor. It was ALSO the list of files scanned, which meant dynamic routes
 * were invisible: `marketplace/[slug]/page.tsx` is where a listing's metadata
 * and its tier badge live, and neither has ever been extracted. A hardcoded
 * list of routes drifts the moment anyone adds a page — walking the directory
 * cannot.
 */
function walkPages(dir: string, out: string[] = []): string[] {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = `${dir}/${e.name}`;
    if (e.isDirectory()) walkPages(full, out);
    else if (e.name === "page.tsx" || e.name === "layout.tsx") out.push(full);
  }
  return out;
}
for (const f of walkPages("app/[locale]")) {
  const route = f.replace("app/[locale]/(site)/", "").replace(/\/(page|layout)\.tsx$/, "");
  scanFile(f, PAGES[route] ?? PAGES[route.split("/")[0]] ?? "Shared interface");
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

/**
 * Write the registry the header claims this script generates.
 *
 * It previously stopped at the temp file above and someone regenerated
 * lib/i18n/translatable.ts by hand, which is the same as not regenerating it:
 * the file drifted 45 strings behind the extractor, and every one of those was
 * a string wired correctly in a component, invisible in the admin editor, and
 * therefore impossible for a translator to ever fix. The gap was silent because
 * both halves looked healthy on their own.
 */
const REGISTRY = "lib/i18n/translatable.ts";
const header = fs.readFileSync(REGISTRY, "utf8").split("export const TRANSLATABLE")[0];
fs.writeFileSync(
  REGISTRY,
  header +
    "export const TRANSLATABLE: { source: string; context: string }[] = [\n" +
    out.map((e) => `  { source: ${JSON.stringify(e.source)}, context: ${JSON.stringify(e.context)} },`).join("\n") +
    "\n];\n",
);
console.log(`  registry written: ${REGISTRY} (${out.length} entries)`);

const byCtx: Record<string, number> = {};
for (const e of out) byCtx[e.context] = (byCtx[e.context] || 0) + 1;
fs.writeFileSync("/tmp/confirms.json", JSON.stringify(confirms, null, 2));
console.log("  EXCLUDED (draft, [CONFIRM] pending counsel):", confirms.length);
console.log("  strings:", out.length, "| words:", out.reduce((a, e) => a + e.source.split(/\s+/).length, 0));
for (const [k, v] of Object.entries(byCtx).sort((a, b) => b[1] - a[1])) console.log(`    ${String(v).padStart(4)}  ${k}`);
