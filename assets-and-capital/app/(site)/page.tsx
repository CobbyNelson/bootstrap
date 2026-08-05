import { Hero } from "@/components/home/hero";
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
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const teasers = await listTeasers(3);
  const heroes = await getListingHeroes();
  return (
    <>
      <Hero />
      <FeaturedCarousel heroes={heroes} />
      <Process />
      <WhyUs />
      <Featured />
      <Insights articles={teasers} />
      <FinalCTA />
    </>
  );
}
