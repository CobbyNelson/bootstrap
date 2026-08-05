import "server-only";
import { headers } from "next/headers";
import { DEFAULT_LOCALE, isLocale, type Locale } from "./config";
import { getDictionary, translate } from "./dictionaries";

/**
 * The locale for the current request, as decided by middleware.
 *
 * Reading the header rather than a cookie or a param keeps one source of
 * truth: middleware already had to parse the prefix in order to route and to
 * apply the gate, so re-deriving it here could only ever disagree with it.
 */
export async function getLocale(): Promise<Locale> {
  const value = (await headers()).get("x-locale");
  return value && isLocale(value) ? value : DEFAULT_LOCALE;
}

/** Dictionary plus a bound `t()` for the current request. */
export async function getI18n() {
  const locale = await getLocale();
  return {
    locale,
    dict: getDictionary(locale),
    t: (path: string) => translate(locale, path),
  };
}
