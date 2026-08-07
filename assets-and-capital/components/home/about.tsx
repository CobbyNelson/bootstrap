import { STATS } from "@/lib/content";
import { Reveal } from "@/components/ui/reveal";
import { Counter } from "@/components/ui/counter";
import { getTranslator } from "@/lib/i18n/store";
import type { Locale } from "@/lib/i18n/config";
import { translateContent } from "@/lib/i18n/translate-content";

/**
 * About + figures.
 *
 * Two columns rather than a heading band above a stat row: the copy explains
 * what the platform is, the figures qualify it, and side by side they are read
 * together instead of as two separate claims.
 *
 * The figures are the ones in lib/content.ts, which are deliberately structural
 * — match criteria, sectors, score signals, listing tiers. They are properties
 * of the product and can be pointed at. Deal volumes and AUM would be more
 * impressive and would be invented, so they are not here.
 */
export async function About({ locale }: { locale: Locale }) {
  const t = await getTranslator(locale);
  const stats = translateContent(STATS, t);
  return (
    <section className="border-b border-ink/[0.06] py-20 md:py-24">
      <div className="container-x grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
        <Reveal>
          <div>
            <h2 className="font-display text-3xl leading-tight text-navy-700 sm:text-4xl">
              {t.tl("About Assets & Capital")}
            </h2>
            <p className="mt-6 max-w-lg text-base leading-relaxed text-ink/65">
              {t.tl("We are a private-capital marketplace connecting vetted businesses raising capital with a global network of investors. Every listing is screened before it goes live, and every opportunity is scored against an investor's written mandate rather than pushed to the whole list.")}
            </p>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-ink/65">
              {t.tl("Our team meets business owners where they operate, so what reaches an investor is informed by more than a data room — and businesses pay only when a raise actually closes.")}
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          {/* A 2×2 grid, not a single row: four figures across a wide column
              leaves each one too small to carry the weight the number is doing. */}
          <dl className="grid grid-cols-1 gap-x-10 gap-y-10 sm:grid-cols-2">
            {stats.map((s) => (
              <div key={s.label}>
                <dt className="sr-only">{s.label}</dt>
                <dd>
                  <span className="font-display text-4xl leading-none text-navy-700 tnum sm:text-5xl">
                    <Counter value={s.value} />
                    <span className="text-brand-600">+</span>
                  </span>
                  <span className="mt-3 block max-w-[16rem] text-sm leading-relaxed text-ink/60">
                    {s.label}
                  </span>
                </dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </div>
    </section>
  );
}
