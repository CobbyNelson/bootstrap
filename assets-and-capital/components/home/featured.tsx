import { FEATURED_OPPORTUNITIES, INDUSTRIES } from "@/lib/content";
import { SplitHeading } from "@/components/ui/section-heading";
import { Reveal } from "@/components/ui/reveal";
import { OpportunityCard } from "@/components/ui/opportunity-card";
import { PillButton } from "@/components/ui/button";
import { getListingHeroes } from "@/lib/listing-heroes";
import { slugify } from "@/lib/matching";
import { getTranslator } from "@/lib/i18n/store";
import type { Locale } from "@/lib/i18n/config";

/**
 * Marketplace preview. Alongside the cards sit two small panels borrowed from
 * the reference: a filled stat tile and a tag cloud — here the sectors covered,
 * which stands in for the sector list cut from the home page.
 */
export async function Featured({ locale }: { locale: Locale }) {
  const t = await getTranslator(locale);
  const heroes = await getListingHeroes();
  const sectors = INDUSTRIES.slice(0, 8).map((i) => t.tl(i.short));

  return (
    <section className="py-14 md:py-20">
      <div className="container-x">
        <SplitHeading
          title={t.tl("Opportunities on the marketplace now")}
          description={t.tl("Every listing is screened and verified before it appears. Match scores show how mandate-aware ranking surfaces the right deals.")}
        />

        <div className="mt-14 grid gap-6 lg:grid-cols-[1fr_300px]">
          <div className="grid gap-6 sm:grid-cols-2">
            {FEATURED_OPPORTUNITIES.slice(0, 4).map((o, i) => (
              <Reveal key={o.name} delay={(i % 2) * 0.08}>
                <OpportunityCard o={o} hero={heroes[slugify(o.name)] ?? null} />
              </Reveal>
            ))}
          </div>

          <div className="flex flex-col gap-5">
            {/* filled stat tile */}
            <Reveal>
              <div className="rounded-3xl bg-brand-600 p-6 text-white">
                <span className="grid h-10 w-10 place-items-center rounded-[var(--radius-button)] bg-white/20" aria-hidden>
                  <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M3 8.5l3.2 3.2L13 5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <p className="mt-5 text-[2.4rem] leading-none tnum">{INDUSTRIES.length}</p>
                <p className="mt-2 text-sm text-white">{t.tl("Sectors covered across the marketplace")}</p>
              </div>
            </Reveal>

            {/* tag cloud */}
            <Reveal delay={0.08}>
              <div className="rounded-3xl border border-ink/[0.07] bg-white p-6">
                <p className="kicker text-ink/55">{t.tl("Sectors")}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {sectors.map((s) => (
                    <span
                      key={s}
                      className="rounded-full bg-paper-2 px-3 py-1.5 text-[0.72rem] font-medium text-ink/75"
                    >
                      {s}
                    </span>
                  ))}
                </div>
                <PillButton href="/marketplace" tone="light" className="mt-6 w-full justify-between">
                  {t.tl("Explore all")}
                </PillButton>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
