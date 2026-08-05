/**
 * Locales, and how a request is routed to one.
 *
 * URL prefix rather than a cookie: /fr/pricing is a distinct, linkable,
 * crawlable page, and hreflang needs a real URL per language to point at. A
 * cookie-switched site serves four languages from one URL, which search
 * engines index as one page in whichever language they happened to see.
 *
 * English is unprefixed. Adding /en would move every existing URL, discarding
 * whatever equity they have and breaking every link already shared.
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

/** Split "/fr/pricing" into its locale and the path the app should render. */
export function splitLocale(pathname: string): { locale: Locale; path: string } {
  const [, first, ...rest] = pathname.split("/");
  if (first && isLocale(first) && first !== DEFAULT_LOCALE) {
    return { locale: first, path: `/${rest.join("/")}` || "/" };
  }
  return { locale: DEFAULT_LOCALE, path: pathname };
}

/** The URL for `path` in `locale`. Inverse of splitLocale. */
export function localePath(path: string, locale: Locale): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  if (locale === DEFAULT_LOCALE) return clean;
  return clean === "/" ? `/${locale}` : `/${locale}${clean}`;
}
