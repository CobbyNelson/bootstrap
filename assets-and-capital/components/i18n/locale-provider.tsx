"use client";

import { createContext, useContext } from "react";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/config";
import { translate } from "@/lib/i18n/dictionaries";

/**
 * Makes the locale available to client components.
 *
 * Server components take it from the route param. Client components — the
 * navbar, the switcher, the mobile drawer — cannot read params from a layout
 * several levels up, and threading it through every prop would touch a lot of
 * files to move one value. A context set once at the locale boundary is the
 * smaller change.
 *
 * Defaults to English rather than throwing when used outside the provider, so
 * a component rendered under /admin or the pre-launch gate — neither of which
 * is localised — still works.
 */
const LocaleContext = createContext<Locale>(DEFAULT_LOCALE);

export function LocaleProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}

export function useLocale(): Locale {
  return useContext(LocaleContext);
}

/** Bound translator: `t("nav.pricing")`, falling back to English. */
export function useT() {
  const locale = useLocale();
  return (path: string) => translate(locale, path);
}
