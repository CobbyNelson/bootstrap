import { notFound } from "next/navigation";
import { LOCALES, isLocale, type Locale } from "@/lib/i18n/config";
import { LocaleProvider } from "@/components/i18n/locale-provider";

/**
 * The locale segment.
 *
 * This replaced a middleware rewrite that carried the locale in a request
 * header. The header never reached the layout — `/ar` rendered 200 with
 * `lang="en"` and English copy — and even if it had, a rewrite collapses every
 * language onto one cache entry keyed by the stripped path, so the four
 * languages could never be prerendered separately.
 *
 * As a real segment, `/fr/pricing` matches this route natively: the locale
 * arrives as a param, needs no header to survive, and each language is its own
 * route with its own cache entry. English is the only one that still rewrites,
 * and its failure mode is benign — the default is `en` anyway.
 */
export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  // A segment matches any string, so anything that is not a known locale is a
  // 404 rather than a page rendered in a language that does not exist.
  if (!isLocale(locale)) notFound();

  return <LocaleProvider locale={locale as Locale}>{children}</LocaleProvider>;
}
