import type { Metadata } from "next";
import { Presentation, Users, Search, ShieldCheck, LineChart, Landmark, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { SectionHeading } from "@/components/ui/section-heading";
import { Reveal } from "@/components/ui/reveal";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "For Investors",
  description:
    "Access curated, mandate-matched investment opportunities. Assets & Capital is your trusted local partner for identifying the right deals worldwide.",
};

const SERVICES = [
  { icon: Users, title: "Local events access", body: "Gain valuable, on-the-ground market insight in the geographies you target." },
  { icon: Presentation, title: "Specialised roadshows", body: "Meet multiple pre-screened investment opportunities in curated sessions." },
  { icon: Search, title: "Market access support", body: "Connect with suppliers, buyers, and partners to grow your investments." },
];

const WHY = [
  { icon: ShieldCheck, title: "Vetted prospects", body: "Our global team actively engages business owners and screens opportunities to deliver the best options to our investor network." },
  { icon: LineChart, title: "Mandate matching", body: "Using advanced technology, we match you with opportunities that fit your mandate — tailored, innovative solutions for your needs." },
  { icon: Landmark, title: "Trusted local partner", body: "With a large platform of vetted prospects, you're more likely to find opportunities that align with your investment mandate." },
];

export default function InvestorsPage() {
  return (
    <>
      <PageHeader
        eyebrow="For investors"
        title="Find opportunities that fit your mandate"
        subtitle="Our global team engages business owners and screens opportunities to deliver the best options to our investor network — matched to you with advanced technology."
      >
        <Button href="/register/investor" variant="primary" size="lg">
          Register with us <ArrowRight className="h-4 w-4" />
        </Button>
      </PageHeader>

      <section className="py-16 md:py-20">
        <div className="container-x">
          <SectionHeading eyebrow="Our services" title="Everything you need to deploy with an edge" />
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {SERVICES.map((s, i) => (
              <Reveal key={s.title} delay={i * 0.08}>
                <div className="h-full rounded-3xl border border-ink/[0.07] bg-white p-7">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
                    <s.icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-5 text-lg font-semibold text-ink">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink/55">{s.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-paper-2/60 py-16 md:py-20">
        <div className="container-x">
          <SectionHeading align="center" eyebrow="Why invest with us" title="Your trusted local partner, worldwide" className="mx-auto" />
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {WHY.map((w, i) => (
              <Reveal key={w.title} delay={i * 0.08}>
                <div className="h-full rounded-3xl border border-ink/[0.07] bg-white p-7">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-navy-100 text-navy-700 ring-1 ring-navy-200">
                    <w.icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-5 text-lg font-semibold text-ink">{w.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink/55">{w.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Button href="/register/investor" variant="dark" size="lg">
              Build your mandate <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
