import type { Metadata } from "next";
import { TrendingUp, ArrowRight } from "lucide-react";
import { INDICATORS } from "@/lib/insights-data";
import { PageHeader } from "@/components/layout/page-header";
import { InsightsPortal } from "@/components/insights/insights-portal";
import { listPublishedArticles } from "@/lib/articles";
import { Reveal } from "@/components/ui/reveal";
import { Button } from "@/components/ui/button";
import { getTranslator } from "@/lib/i18n/store";
import { translateContent } from "@/lib/i18n/translate-content";
import type { Locale } from "@/lib/i18n/config";

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const t = await getTranslator((await params).locale);
  return {
    title: t.tl("Market Insights"),
    description: t.tl("Research, country reports, investment guides, white papers, case studies, and interviews on African and emerging-market private capital."),
  };
}

export const dynamic = "force-dynamic";

export default async function InsightsPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const t = await getTranslator(locale);
  const articles = await listPublishedArticles();
  return (
    <>
      <PageHeader
        title={t.tl("Intelligence for capital and opportunity")}
        subtitle={t.tl("Research, country reports, investment guides, and case studies from the Assets & Capital team — built for allocators and founders operating in Africa and emerging markets.")}
      />

      {/* economic indicators */}
      <section className="border-b border-ink/[0.06] py-8">
        <div className="container-x grid grid-cols-2 gap-4 lg:grid-cols-4">
          {INDICATORS.map((ind) => (
            <div key={ind.label} className="rounded-2xl border border-ink/[0.06] bg-white p-5">
              <p className="text-xs text-ink/65">{ind.label}</p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="font-display text-2xl font-semibold text-navy-700 tnum">{ind.value}</span>
                <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${ind.up ? "text-emerald-700" : "text-brand-600"}`}>
                  <TrendingUp className="h-3 w-3" /> {ind.delta}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="py-14 md:py-16">
        <div className="container-x">
          <InsightsPortal articles={articles} />
        </div>
      </section>

      {/* newsletter */}
      <section className="pb-20">
        <div className="container-x">
          <Reveal>
            <div className="relative overflow-hidden rounded-[2rem] bg-brand-600 px-8 py-12 text-center text-white md:px-16 md:py-14">
              <div className="grid-noise-light pointer-events-none absolute inset-0" aria-hidden />
              <div className="relative mx-auto max-w-xl">
                <h2 className="font-display text-2xl font-semibold md:text-3xl">{t.tl("The Assets &amp; Capital briefing")}</h2>
                <p className="mt-3 text-white">{t.tl("Benchmarks drawn from real transactions, plus new opportunities, once a month.")}</p>
                <Button href="/register/investor" variant="inverse" size="md" className="mt-7">
                  {t.tl("Subscribe")} <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
