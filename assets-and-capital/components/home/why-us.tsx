import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { WHY } from "@/lib/content";
import { Reveal } from "@/components/ui/reveal";

/**
 * The four operating commitments, set as an editorial list on a dark band.
 *
 * This replaced a four-up card grid of icon-square + heading + body + pill.
 * Three things were wrong with it:
 *
 *  1. Four equally-weighted cards with a rounded icon tile above each heading is
 *     the template arrangement; it made four distinct claims look interchangeable.
 *  2. The "Explore more" pill was a <span> with no href — a hover state and an
 *     arrow on something that could not be clicked. A fake affordance is worse
 *     than no affordance, so the section now has ONE real link.
 *  3. Cards are the right shape for things you open (listings, articles), and
 *     this page uses them for exactly that elsewhere. Spending them on prose too
 *     drained the meaning from the ones that are clickable.
 *
 * The dark band is also load-bearing for page rhythm: Process → this → Featured
 * → Insights was an unbroken light stretch between the hero and the closing CTA.
 */
export function WhyUs() {
  return (
    <section className="relative overflow-hidden bg-navy-900 py-20 md:py-28">
      <div className="grid-noise pointer-events-none absolute inset-0 opacity-[0.07]" aria-hidden />

      <div className="container-x relative">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr] lg:items-end lg:gap-16">
          <Reveal>
            <h2 className="text-balance text-[2rem] leading-[1.08] text-white sm:text-4xl md:text-[2.85rem]">
              What we do beyond listing a business
            </h2>
          </Reveal>
          <Reveal delay={0.06}>
            <p className="max-w-md text-[0.95rem] leading-relaxed text-white/70 lg:pb-2">
              Modern tooling paired with a team in-market, so both sides of a deal get
              the same standard of scrutiny.
            </p>
          </Reveal>
        </div>

        <div className="mt-14 md:mt-20">
          {WHY.map((item, i) => (
            <Reveal key={item.title} delay={i * 0.07}>
              {/* Hairline rules rather than card edges: the claims read as one
                  argument in four parts instead of four separate objects. */}
              <div className="grid gap-3 border-t border-white/12 py-7 md:grid-cols-[minmax(0,20rem)_1fr] md:gap-12 md:py-9">
                <h3 className="text-pretty text-xl font-medium leading-snug text-white md:text-[1.35rem]">
                  {item.title}
                </h3>
                <p className="max-w-[65ch] text-[0.95rem] leading-relaxed text-white/70">
                  {item.body}
                </p>
              </div>
            </Reveal>
          ))}
          <div className="border-t border-white/12" />
        </div>

        <Reveal delay={0.1}>
          <Link
            href="/about"
            className="btn-skew-right rounded-[var(--radius-button)] label-cta group mt-10 inline-flex h-11 items-center gap-2.5 bg-white pl-5 pr-9 text-[0.72rem] text-navy-900 transition-colors hover:bg-brand-600 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-900"
          >
            How we work with both sides
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
