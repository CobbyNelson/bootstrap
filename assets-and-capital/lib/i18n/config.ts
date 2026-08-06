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

/**
 * Split "/fr/pricing" into its locale and the path beneath it.
 *
 * `prefixed` is what the caller acts on, not the locale: every locale is
 * prefixed now, including English, so "which locale is this" and "does this URL
 * already carry one" are different questions. Conflating them is what produced
 * /en/en/en — English was resolved as the default, read as unprefixed, and
 * redirected again on every pass.
 */
export function splitLocale(pathname: string): { locale: Locale; path: string; prefixed: boolean } {
  const [, first, ...rest] = pathname.split("/");
  if (first && isLocale(first)) {
    return { locale: first, path: `/${rest.join("/")}` === "/" ? "/" : `/${rest.join("/")}`, prefixed: true };
  }
  return { locale: DEFAULT_LOCALE, path: pathname, prefixed: false };
}

/** The URL for `path` in `locale`. Inverse of splitLocale. */
export function localePath(path: string, locale: Locale): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return clean === "/" ? `/${locale}` : `/${locale}${clean}`;
}
