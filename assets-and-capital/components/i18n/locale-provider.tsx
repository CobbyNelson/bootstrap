"use client";

import { createContext, useContext } from "react";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/config";
import { translate, translateLabel } from "@/lib/i18n/dictionaries";

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
type Ctx = { locale: Locale; overrides: Record<string, string> };

/**
 * Overrides are the edited Translation rows, handed down from the server
 * layout. Without them a client component would resolve from the shipped
 * dictionary while the server used the edited value — the same string rendering
 * two different ways on one page, and a hydration mismatch to go with it.
 */
const LocaleContext = createContext<Ctx>({ locale: DEFAULT_LOCALE, overrides: {} });

export function LocaleProvider({
  locale,
  overrides = {},
  children,
}: {
  locale: Locale;
  overrides?: Record<string, string>;
  children: React.ReactNode;
}) {
  return <LocaleContext.Provider value={{ locale, overrides }}>{children}</LocaleContext.Provider>;
}

export function useLocale(): Locale {
  return useContext(LocaleContext).locale;
}

/** Bound translator: `t("nav.pricing")`, falling back to English. */
export function useT() {
  const { locale, overrides } = useContext(LocaleContext);
  return (path: string) => {
    const english = translate("en", path);
    return overrides[english] ?? translate(locale, path);
  };
}

/** Translate an English literal from lib/content.ts, falling back to itself. */
export function useTl() {
  const { locale, overrides } = useContext(LocaleContext);
  return (text: string) => overrides[text] ?? translateLabel(locale, text);
}
