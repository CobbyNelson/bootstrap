import { Hero } from "@/components/home/hero";
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
 * The root layout's template appends "· Assets & Capital" to every title; the
 * homepage says the whole thing itself, so `absolute` stops it doubling up.
 */
export const metadata: Metadata = {
  title: { absolute: `${SITE.name} — ${SITE.tagline}` },
  description: SITE.description,
  openGraph: {
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
    url: `https://${SITE.domain}`,
    type: "website",
  },
};

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
      <Featured />
      <Insights articles={teasers} />
      <FinalCTA />
    </>
  );
}
