import { FEATURED_OPPORTUNITIES } from "@/lib/content";
import { SectionHeading } from "@/components/ui/section-heading";
import { Reveal } from "@/components/ui/reveal";
import { OpportunityCard } from "@/components/ui/opportunity-card";
import { Button } from "@/components/ui/button";

export function Featured() {
  return (
    <section className="py-20 md:py-28">
      <div className="container-x">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <SectionHeading
            eyebrow="Featured opportunities"
            title="Opportunities on the marketplace now"
            subtitle="Every opportunity is screened and verified. Match scores are illustrative of how mandate-aware ranking surfaces the right deals."
          />
          <Button href="/marketplace" variant="outline" size="md" className="shrink-0">
            Explore all opportunities
          </Button>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {FEATURED_OPPORTUNITIES.map((o, i) => (
            <Reveal key={o.name} delay={(i % 3) * 0.08}>
              <OpportunityCard o={o} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
