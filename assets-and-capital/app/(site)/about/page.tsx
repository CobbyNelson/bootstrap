import type { Metadata } from "next";
import { Target, Eye, Users, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { SectionHeading } from "@/components/ui/section-heading";
import { STATS } from "@/lib/content";
import { Counter } from "@/components/ui/counter";
import { Reveal } from "@/components/ui/reveal";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "About",
  description:
    "Assets & Capital is a financing events company creating a trusted platform that connects investors with vetted business opportunities.",
};

const VALUES = [
  { icon: Target, title: "Transparency", body: "Clear, honest dealing on both sides — every opportunity is vetted, every process auditable." },
  { icon: Users, title: "Personalised service", body: "A global team acting with urgency and precision to deliver solutions tailored to your needs." },
  { icon: Eye, title: "Expert support", body: "From business plans to roadshows, we bring the expertise that turns interest into closed deals." },
];

export default function AboutPage() {
  return (
    <>
      <PageHeader
        eyebrow="About us"
        title="A trusted platform for deal-making"
        subtitle="Assets and Capital Limited is a financing events company. We serve as an alternative capital-raising and deal-making platform to traditional channels like the stock market and bank financing."
      />

      <section className="py-16 md:py-20">
        <div className="container-x grid gap-12 lg:grid-cols-2">
          <Reveal>
            <div>
              <h2 className="font-display text-2xl font-semibold text-navy-700">Our mission</h2>
              <p className="mt-4 leading-relaxed text-ink/60">
                To give growing businesses a credible route to capital outside the stock market and bank lending, and to
                give investors opportunities that have already been checked before they arrive.
              </p>
              <p className="mt-4 leading-relaxed text-ink/60">
                For investors, that means deals scored against your written mandate with the reasoning shown, not a feed
                to sort through. For businesses, it means your raise put in front of the investors whose criteria it
                actually meets.
              </p>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="grid grid-cols-2 gap-4">
              {STATS.map((s) => (
                <div key={s.label} className="rounded-3xl border border-ink/[0.07] bg-white p-6">
                  <div className="font-display text-3xl font-semibold text-navy-700">
                    <Counter value={s.value} decimals={s.decimals ?? 0} prefix={s.prefix} suffix={s.suffix} className="tnum" />
                  </div>
                  <p className="mt-1 text-sm text-ink/65">{s.label}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="bg-paper-2/60 py-16 md:py-20">
        <div className="container-x">
          <SectionHeading align="center" eyebrow="Our values" title="What we stand for" className="mx-auto" />
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {VALUES.map((v, i) => (
              <Reveal key={v.title} delay={i * 0.08}>
                <div className="h-full rounded-3xl border border-ink/[0.07] bg-white p-7">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
                    <v.icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-5 text-lg font-semibold text-ink">{v.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink/65">{v.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Button href="/contact" variant="primary" size="lg">
              Get in touch <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
