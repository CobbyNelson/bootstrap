import { Hero } from "@/components/home/hero";
import { FeaturedCarousel } from "@/components/home/featured-carousel";
import { WhyUs } from "@/components/home/why-us";
import { Process } from "@/components/home/process";
import { Featured } from "@/components/home/featured";
import { Insights } from "@/components/home/insights";
import { FinalCTA } from "@/components/home/cta";

/**
 * Home page — deliberately short.
 *
 * HowItWorks and Process covered the same pipeline, so only Process remains
 * (it carries the numbered-step treatment). Industries, Services and Events
 * live on their own pages and were cut from here rather than duplicated.
 */
export default function HomePage() {
  return (
    <>
      <Hero />
      <FeaturedCarousel />
      <WhyUs />
      <Process />
      <Featured />
      <Insights />
      <FinalCTA />
    </>
  );
}
