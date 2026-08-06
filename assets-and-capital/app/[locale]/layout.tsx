import { notFound } from "next/navigation";
import { LOCALES, isLocale, isRtl, type Locale } from "@/lib/i18n/config";
import { LocaleProvider } from "@/components/i18n/locale-provider";
import { getOverrides } from "@/lib/i18n/store";

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

  // Loaded once here and handed to every client component below, so server
  // and client resolve identically.
  const overrides = await getOverrides(locale as Locale);

  return (
    <LocaleProvider locale={locale as Locale} overrides={overrides}>
      {/* The server-rendered language and direction.
          <html> carries static defaults so the root layout can stay
          prerenderable; this wrapper is where the real values are, present in
          the HTML itself rather than applied by script. Tailwind's logical
          properties resolve against the nearest dir, so this is what actually
          mirrors the layout. */}
      <div lang={locale} dir={isRtl(locale as Locale) ? "rtl" : "ltr"}>
        {children}
      </div>
    </LocaleProvider>
  );
}
