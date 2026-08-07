/**
 * Locales, and how a request is routed to one.
 *
 * URL prefix rather than a cookie: /fr/pricing is a distinct, linkable,
 * crawlable page, and hreflang needs a real URL per language to point at. A
 * cookie-switched site serves four languages from one URL, which search
 * engines index as one page in whichever language they happened to see.
 *
 * English is unprefixed: the home page is `/`, not `/en`, and `/pricing` is the
 * English pricing page rather than a redirect to one. The prefixed form is kept
 * working — it 308s to the bare path — so nothing that was ever linked breaks.
 */
export const LOCALES = ["en", "fr", "es", "ar"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

/** Locales that are written right-to-left. Drives dir on <html>. */
export const RTL_LOCALES: readonly Locale[] = ["ar"];

export const LOCALE_META: Record<Locale, { label: string; english: string; hreflang: string }> = {
  // `label` is the language's own name — someone who cannot read the current
  // language still has to be able to find theirs in the list.
  en: { label: "English", english: "English", hreflang: "en" },
  fr: { label: "Français", english: "French", hreflang: "fr" },
  es: { label: "Español", english: "Spanish", hreflang: "es" },
  ar: { label: "العربية", english: "Arabic", hreflang: "ar" },
};

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

export function isRtl(locale: Locale): boolean {
  return RTL_LOCALES.includes(locale);
}

/**
 * Split "/fr/pricing" into its locale and the path beneath it.
 *
 * `prefixed` is what the caller acts on, not the locale. English resolves to
 * `en` whether or not the URL says so, so "which locale is this" and "does this
 * URL already carry one" are different questions — and conflating them is what
 * produced /en/en/en, where English was resolved as the default, read as
 * unprefixed, and redirected again on every pass.
 *
 * Middleware needs the distinction for the opposite reason now: `/en/pricing`
 * is prefixed English, which is the one combination that redirects.
 */
export function splitLocale(pathname: string): { locale: Locale; path: string; prefixed: boolean } {
  const [, first, ...rest] = pathname.split("/");
  if (first && isLocale(first)) {
    return { locale: first, path: `/${rest.join("/")}` === "/" ? "/" : `/${rest.join("/")}`, prefixed: true };
  }
  return { locale: DEFAULT_LOCALE, path: pathname, prefixed: false };
}

/**
 * The URL for `path` in `locale`. Inverse of splitLocale.
 *
 * English is returned unprefixed, because English is the bare domain: the home
 * page is `/`, not `/en`. Every nav item, footer link, hero button and language
 * option is built through here, so a prefix added at this one line would put
 * every English link on the site one 308 away from where it is going.
 */
export function localePath(path: string, locale: Locale): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  if (locale === DEFAULT_LOCALE) return clean;
  return clean === "/" ? `/${locale}` : `/${locale}${clean}`;
}
