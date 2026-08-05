import { WHY } from "@/lib/content";
import { SplitHeading } from "@/components/ui/section-heading";
import { Reveal } from "@/components/ui/reveal";
import { cn } from "@/lib/utils";

/**
 * Alternating-fill card row, following the consulting reference: a light card,
 * a filled accent card, and a dark card, each with a small pill link at the
 * bottom. Brand palette throughout.
 */
const FILLS = [
  { card: "bg-white border-ink/[0.07]", title: "text-navy-700", body: "text-ink/65", icon: "bg-paper-2 text-navy-700", pill: "bg-paper-2 text-ink group-hover:bg-navy-700 group-hover:text-white" },
  { card: "bg-brand-600 border-brand-600", title: "text-white", body: "text-white/80", icon: "bg-white/15 text-white", pill: "bg-white text-brand-700" },
  { card: "bg-navy-800 border-navy-800", title: "text-white", body: "text-white/70", icon: "bg-white/10 text-white", pill: "bg-white text-navy-800" },
  { card: "bg-white border-ink/[0.07]", title: "text-navy-700", body: "text-ink/65", icon: "bg-paper-2 text-navy-700", pill: "bg-paper-2 text-ink group-hover:bg-navy-700 group-hover:text-white" },
] as const;

export function WhyUs() {
  return (
    <section className="bg-paper-2/60 py-14 md:py-20">
      <div className="container-x">
        <SplitHeading
          eyebrow="Why choose us"
          title="What we do beyond listing a business"
          description="Modern tooling paired with a team in-market, so both sides of a deal get the same standard of scrutiny."
        />

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {WHY.map((item, i) => {
            const f = FILLS[i % FILLS.length];
            return (
              <Reveal key={item.title} delay={i * 0.08}>
                <div
                  className={cn(
                    "group flex h-full flex-col rounded-3xl border p-7 transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-card)]",
                    f.card
                  )}
                >
                  <span className={cn("grid h-12 w-12 place-items-center rounded-2xl", f.icon)}>
                    <item.icon className="h-5 w-5" />
                  </span>
                  <h3 className={cn("mt-5 text-lg", f.title)}>{item.title}</h3>
                  <p className={cn("mt-2 flex-1 text-sm leading-relaxed", f.body)}>{item.body}</p>
                  <span
                    className={cn(
                      "mt-6 inline-flex w-fit items-center gap-2 rounded-full px-3.5 py-1.5 label-cta text-[0.62rem] transition-colors",
                      f.pill
                    )}
                  >
                    Explore more
                    <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
                      <path d="M2 8h11M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
