import { INDUSTRIES } from "@/lib/content";
import { SectionHeading } from "@/components/ui/section-heading";
import { Reveal } from "@/components/ui/reveal";
import { getLocale } from "@/lib/i18n/server";
import { getTranslator } from "@/lib/i18n/store";
import { translateContent } from "@/lib/i18n/translate-content";

export async function Industries() {
  const t = await getTranslator(await getLocale());
  const industries = translateContent(INDUSTRIES, t);
  return (
    <section className="bg-paper-2/60 py-20 md:py-28">
      <div className="container-x">
        <SectionHeading
          align="center"
          title="Depth across every major sector"
          subtitle="From technology and healthcare to energy, real estate and agriculture — opportunities spanning fourteen industry groups."
          className="mx-auto"
        />
        <div className="mt-14 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {industries.map((ind, i) => (
            <Reveal key={ind.name} delay={(i % 4) * 0.05}>
              <div className="group flex h-full items-start gap-4 rounded-2xl border border-ink/[0.06] bg-white p-5 transition-all hover:border-brand-100 hover:shadow-[var(--shadow-soft)]">
                <span className="grid h-11 w-11 flex-none place-items-center rounded-xl bg-paper-2 text-ink/70 ring-1 ring-ink/[0.06] transition-colors group-hover:bg-brand-600 group-hover:text-white group-hover:ring-brand-600">
                  <ind.icon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-[0.95rem] font-semibold text-ink">{ind.name}</h3>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-ink/65">{ind.blurb}</p>
                  <p className="mt-2 text-xs font-medium text-brand-600 tnum">{ind.count} opportunities</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
