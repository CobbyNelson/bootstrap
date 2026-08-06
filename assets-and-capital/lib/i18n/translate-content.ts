import "server-only";
import type { Translator } from "./store";

/**
 * Translate a content object in place of translating the components that render it.
 *
 * The alternative was calling tl() on every literal at every render site, which
 * would mean touching dozens of components and would leave the next person to
 * add a field wondering why their string never translates. Translating the DATA
 * means a component keeps receiving exactly the shape it already expects, in
 * whatever language the request is in, and nothing downstream has to know.
 *
 * Keys are skipped for the same reasons the extractor skips them, and the two
 * lists must agree: a key extracted but not translated shows English on a
 * translated page, and a key translated but not extracted can never be edited.
 * They are kept adjacent deliberately — see scripts/extract-strings.mts.
 */
const SKIP_KEYS = new Set([
  // Identifiers and routing.
  "href", "icon", "slug", "id", "key", "image", "src", "type", "status",
  // Figures and codes — rendering "15% IRR" in French must not become "15% TRI"
  // unless a translator decided that, and they cannot, because this is data.
  "count", "value", "price", "cadence", "ask", "targetReturn", "match", "tier",
  "date", "updated", "readTime",
  // Proper nouns.
  "name", "company", "country", "author", "authorRole",
  // Closed vocabulary, translated through the dictionaries instead.
  "sector", "stage", "instrument", "region",
]);

type Json = string | number | boolean | null | undefined | Json[] | { [k: string]: Json };

function walk<T>(node: T, tl: (s: string) => string, key?: string): T {
  if (typeof node === "string") {
    return (key && SKIP_KEYS.has(key) ? node : tl(node)) as unknown as T;
  }
  if (Array.isArray(node)) {
    return node.map((n) => walk(n, tl, key)) as unknown as T;
  }
  if (node && typeof node === "object") {
    // Anything that is not a plain object — a React element, a Lucide icon
    // component, a Date — is returned untouched. Walking one would rebuild it
    // as a plain object and it would stop rendering.
    const proto = Object.getPrototypeOf(node);
    if (proto !== Object.prototype && proto !== null) return node;

    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
      out[k] = SKIP_KEYS.has(k) ? v : walk(v, tl, k);
    }
    return out as unknown as T;
  }
  return node;
}

/**
 * Returns a translated copy. English short-circuits to the original object, so
 * the default locale pays nothing — no walk, no allocation, same references.
 */
export function translateContent<T>(content: T, t: Translator): T {
  if (t.locale === "en") return content;
  return walk(content, t.tl);
}
