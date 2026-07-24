import { Hero } from "@/components/home/hero";
import { StatsBand } from "@/components/home/stats";
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
import { Marquee } from "@/components/ui/marquee";

const SERVICES_TICKER = [
  "Capital Raising",
  "Deal Origination",
  "Investor Matching",
  "Due Diligence",
  "Roadshows",
  "Market Access",
  "M&A Advisory",
];

const SECTORS_TICKER = [
  "Private Equity",
  "Venture Capital",
  "Growth Capital",
  "Renewable Energy",
  "FinTech",
  "Infrastructure",
  "Real Estate",
  "Agriculture",
];

export default function HomePage() {
  return (
    <>
      <Hero />
      <StatsBand />
      <Marquee items={SERVICES_TICKER} tone="navy" />
      <HowItWorks />
      <WhyUs />
      <Featured />
      <Marquee items={SECTORS_TICKER} tone="brand" speed="slow" />
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
