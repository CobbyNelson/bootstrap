import type { Metadata } from "next";
import { TrendingUp, ArrowRight } from "lucide-react";
import { INDICATORS } from "@/lib/insights-data";
import { PageHeader } from "@/components/layout/page-header";
import { InsightsPortal } from "@/components/insights/insights-portal";
import { Reveal } from "@/components/ui/reveal";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Market Insights",
  description:
    "Research, country reports, investment guides, white papers, case studies, and interviews on African and emerging-market private capital.",
};

export default function InsightsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Market insights"
        title="Intelligence for capital and opportunity"
        subtitle="Research, country reports, investment guides, and case studies from the Assets & Capital team — built for allocators and founders operating in Africa and emerging markets."
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
          <InsightsPortal />
        </div>
      </section>

      {/* newsletter */}
      <section className="pb-20">
        <div className="container-x">
          <Reveal>
            <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-ink to-ink-2 px-8 py-12 text-center text-white md:px-16 md:py-14">
              <div className="grid-noise pointer-events-none absolute inset-0 opacity-20" aria-hidden />
              <div className="relative mx-auto max-w-xl">
                <h2 className="font-display text-2xl font-semibold md:text-3xl">The Assets &amp; Capital briefing</h2>
                <p className="mt-3 text-white/65">Benchmarks drawn from real transactions, plus new opportunities, once a month.</p>
                <Button href="/register/investor" variant="gold" size="lg" className="mt-7">
                  Subscribe <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
