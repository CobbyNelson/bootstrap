import "server-only";
import { unstable_cache, revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getDictionary } from "./dictionaries";
import { DEFAULT_LOCALE, type Locale } from "./config";
import { TRANSLATABLE } from "./translatable";

/**
 * Resolved translations for a locale.
 *
 * Three layers, each falling through to the next:
 *
 *   1. Translation rows   — what a human edited. Wins.
 *   2. File dictionaries  — what shipped with the code. The seed.
 *   3. The English source — so a missing string renders as English rather
 *                           than as a key, and the page still reads.
 *
 * Layer 1 is why this exists: a wording mistake in French can be fixed by
 * someone who speaks French, in the admin, without a deploy. Layer 2 is why
 * adding a string does not require touching the database.
 */

const TAG = "translations";

/** One tag for all locales: an edit is rare and a full reload is cheap. */
export function invalidateTranslations() {
  // Next 16 wants an explicit cache profile alongside the tag.
  revalidateTag(TAG, "max");
}

const loadRows = unstable_cache(
  async (locale: string) => {
    try {
      const rows = await prisma.translation.findMany({
        where: { locale },
        select: { source: true, value: true },
      });
      return rows;
    } catch {
      // The site must render if the database is unreachable. Falling back to
      // the file dictionaries means a degraded page, not a failed one.
      return [];
    }
  },
  ["i18n-translations"],
  { tags: [TAG] },
);

export type Translator = {
  /** Translate a literal English string. */
  tl: (text: string) => string;
  /** Translate a dotted dictionary path, e.g. "nav.pricing". */
  t: (path: string) => string;
  locale: Locale;
};

export async function getTranslator(locale: Locale): Promise<Translator> {
  const dict = getDictionary(locale);

  // English needs no lookup at all — it IS the source. Skipping the query
  // keeps the default locale's pages free of a database round trip.
  if (locale === DEFAULT_LOCALE) {
    return {
      locale,
      tl: (text) => text,
      t: (path) => {
        const [g, k] = path.split(".");
        return (dict as unknown as Record<string, Record<string, string>>)[g]?.[k] ?? path;
      },
    };
  }

  const rows = await loadRows(locale);
  const overrides = new Map(rows.map((r) => [r.source, r.value]));

  const tl = (text: string) => overrides.get(text) ?? dict.labels[text] ?? text;

  const t = (path: string) => {
    const [g, k] = path.split(".");
    const groups = dict as unknown as Record<string, Record<string, string>>;
    const english = getDictionary(DEFAULT_LOCALE) as unknown as Record<string, Record<string, string>>;
    const source = english[g]?.[k];
    // A dotted path is looked up by its ENGLISH TEXT too, so the editor only
    // ever deals in sentences — one vocabulary for translators, not two.
    if (source && overrides.has(source)) return overrides.get(source)!;
    return groups[g]?.[k] ?? source ?? path;
  };

  return { locale, tl, t };
}

/**
 * Every string the site can translate, with where it appears.
 *
 * Derived from the English dictionary rather than maintained by hand, so a
 * developer adding a string makes it appear in the editor automatically —
 * a separate list would drift the first time someone forgot to update it.
 */
export function translatableStrings(): { source: string; context: string }[] {
  const out: { source: string; context: string }[] = [];
  const seen = new Set<string>();

  // The generated registry: page copy, legal documents, site content.
  for (const e of TRANSLATABLE) {
    if (seen.has(e.source)) continue;
    seen.add(e.source);
    out.push(e);
  }

  // Plus the hand-written dictionary strings — navigation, buttons and the
  // shared interface furniture, which live in code rather than in content.
  const en = getDictionary(DEFAULT_LOCALE) as unknown as Record<string, Record<string, string>>;
  const CONTEXTS: Record<string, string> = {
    nav: "Navigation",
    cta: "Buttons & calls to action",
    home: "Home page",
    footer: "Footer",
    common: "Shared interface",
  };
  for (const [group, entries] of Object.entries(en)) {
    for (const value of Object.values(entries)) {
      if (!value || seen.has(value)) continue;
      seen.add(value);
      out.push({ source: value, context: CONTEXTS[group] ?? group });
    }
  }
  // The taxonomy lives only in the non-English dictionaries (English needs no
  // lookup), so read its keys from one that has them.
  for (const source of Object.keys(getDictionary("fr").labels)) {
    if (seen.has(source)) continue;
    seen.add(source);
    out.push({ source, context: "Listings & navigation" });
  }

  return out.sort((a, b) => a.context.localeCompare(b.context) || a.source.localeCompare(b.source));
}

/** The edited rows as a plain object, for handing to client components. */
export async function getOverrides(locale: Locale): Promise<Record<string, string>> {
  if (locale === DEFAULT_LOCALE) return {};
  const rows = await loadRows(locale);
  return Object.fromEntries(rows.map((r) => [r.source, r.value]));
}
