import type { Metadata } from "next";
import { FileText, Presentation, LineChart, Users, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { SectionHeading } from "@/components/ui/section-heading";
import { HOW_BUSINESS } from "@/lib/content";
import { Reveal } from "@/components/ui/reveal";
import { Button } from "@/components/ui/button";
import { getTranslator } from "@/lib/i18n/store";
import { translateContent } from "@/lib/i18n/translate-content";
import type { Locale } from "@/lib/i18n/config";

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const t = await getTranslator((await params).locale);
  return {
    title: t.tl("For Businesses"),
    description: t.tl("List your business with Assets & Capital and reach a global portfolio of investors ready to deploy capital into the right opportunities."),
  };
}

const SERVICES = [
  { icon: Presentation, title: "Listing services", body: "Standard and premium tiers that get your opportunity seen by the right investors." },
  { icon: Users, title: "Personalised roadshows", body: "We put your business in front of targeted, pre-screened investors — in person." },
  { icon: LineChart, title: "Market insights", body: "Understand what investors want and position your raise to win." },
  { icon: FileText, title: "Collateral preparation", body: "Business plans, financial statements, and teasers that stand up to diligence." },
];

export default async function BusinessesPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const t = await getTranslator(locale);
  return (
    <>
      <PageHeader
        title={t.tl("We don't just list your business \u2014 we get it in front of the right investors")}
        subtitle={t.tl("We represent one of the largest portfolios of global investors ready to deploy capital. When you work with us, our team acts with urgency and precision to deliver tailored solutions.")}
      >
        <Button href="/register/business" variant="primary" size="lg">
          {t.tl("Register with us")} <ArrowRight className="h-4 w-4" />
        </Button>
      </PageHeader>

      <section className="py-16 md:py-20">
        <div className="container-x">
          <SectionHeading title={t.tl("From listing to closed raise")} />
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {translateContent(HOW_BUSINESS, t).map((step, i) => (
              <Reveal key={step.title} delay={i * 0.08}>
                <div className="h-full rounded-3xl border border-ink/[0.07] bg-white p-6">
                  <span className="font-display text-4xl font-semibold text-brand-600/20">{String(i + 1).padStart(2, "0")}</span>
                  <h3 className="mt-3 text-lg font-semibold text-ink">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink/65">{step.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-paper-2/60 py-16 md:py-20">
        <div className="container-x">
          <SectionHeading align="center" title={t.tl("Everything you need to raise with confidence")} className="mx-auto" />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {translateContent(SERVICES, t).map((s, i) => (
              <Reveal key={s.title} delay={(i % 4) * 0.08}>
                <div className="h-full rounded-3xl border border-ink/[0.07] bg-white p-7">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
                    <s.icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-5 text-lg font-semibold text-ink">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink/65">{s.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Button href="/pricing" variant="dark" size="lg">
              {t.tl("See listing tiers")} <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
