import { Hero } from "@/components/home/hero";
import { FeaturedCarousel } from "@/components/home/featured-carousel";
import { HowItWorks } from "@/components/home/how-it-works";
import { WhyUs } from "@/components/home/why-us";
import { Featured } from "@/components/home/featured";
import { Industries } from "@/components/home/industries";
import { Process } from "@/components/home/process";
import { Services } from "@/components/home/services";
import { Testimonials } from "@/components/home/testimonials";
import { Insights } from "@/components/home/insights";
import { Events } from "@/components/home/events";
import { FinalCTA } from "@/components/home/cta";

export default function HomePage() {
  return (
    <>
      <Hero />
      <FeaturedCarousel />
      <HowItWorks />
      <WhyUs />
      <Featured />
      <Industries />
      <Process />
      <Services />
      <Testimonials />
      <Insights />
      <Events />
      <FinalCTA />
    </>
  );
}
