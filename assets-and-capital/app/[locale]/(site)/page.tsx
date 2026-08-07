import { Hero } from "@/components/home/hero";
import { getTranslator } from "@/lib/i18n/store";
import type { Locale } from "@/lib/i18n/config";
import type { Metadata } from "next";
import { SITE } from "@/lib/content";
import { FeaturedCarousel } from "@/components/home/featured-carousel";
import { WhyUs } from "@/components/home/why-us";
import { Process } from "@/components/home/process";
import { Featured } from "@/components/home/featured";
import { Insights } from "@/components/home/insights";
import { FinalCTA } from "@/components/home/cta";
import { listTeasers } from "@/lib/articles";
import { getListingHeroes } from "@/lib/listing-heroes";

/**
 * Home page — deliberately short.
 *
 * HowItWorks and Process covered the same pipeline, so only Process remains
 * (it carries the numbered-step treatment). Industries, Services and Events
 * live on their own pages and were cut from here rather than duplicated.
 */
/**
 * Prerendered and revalidated rather than rendered per request.
 *
 * Nothing here is per-visitor: the page awaits only global data, and the navbar
 * that varies by session is a client component that resolves itself in the
 * browser. force-dynamic was therefore costing a full server render — and a
 * no-store header — on every single visit, to produce the same bytes each time.
 *
 * Five minutes is the floor on staleness; it is not how long a change waits.
 * The gallery route revalidates these paths on write, so a business replacing
 * its hero still sees it immediately.
 */
export const revalidate = 300;

/**
 * Translated per locale.
 *
 * This was a static `metadata` export, and a page-level export WINS over the
 * layout's generateMetadata — so translating the layout's title did nothing
 * while this sat here in English. The tab on /ar read "Where quality assets
 * meet ready capital" over an Arabic page.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslator(locale);
  const tagline = t.tl(SITE.tagline);
  return {
    title: { absolute: `${SITE.name} — ${tagline}` },
    description: t.tl(SITE.description),
    openGraph: {
      title: `${SITE.name} — ${tagline}`,
      description: t.tl(SITE.description),
      url: `https://${SITE.domain}`,
      type: "website",
    },
  };
}

export default async function HomePage({ params }: { params: Promise<{ locale: Locale }> }) {
  // From the route param, NOT from headers(). Reading a header here would make
  // this page dynamic and take the prerender with it — which is exactly what
  // happened when the content components resolved the locale themselves.
  const { locale } = await params;
  const teasers = await listTeasers(3);
  const heroes = await getListingHeroes();
  return (
    <>
      <Hero />
      <FeaturedCarousel heroes={heroes} />
      <Process locale={locale} />
      <WhyUs locale={locale} />
      <Featured locale={locale} />
      <Insights articles={teasers} locale={locale} />
      <FinalCTA locale={locale} />
    </>
  );
}
