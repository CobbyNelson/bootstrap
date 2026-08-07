import { Quote } from "lucide-react";
import { TESTIMONIALS } from "@/lib/content";
import { SectionHeading } from "@/components/ui/section-heading";
import { Reveal } from "@/components/ui/reveal";
import { getTranslator } from "@/lib/i18n/store";
import type { Locale } from "@/lib/i18n/config";

export async function Testimonials({ locale }: { locale: Locale }) {
  const t = await getTranslator(locale);
  // Nothing to show until real, attributed quotes exist.
  if (TESTIMONIALS.length === 0) return null;

  return (
    <section className="bg-paper-2/60 py-20 md:py-28">
      <div className="container-x">
        <SectionHeading
          align="center"
          title={t.tl("Trusted by investors and founders")}
          className="mx-auto"
        />
        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <Reveal key={t.name} delay={i * 0.1}>
              <figure className="flex h-full flex-col rounded-3xl border border-ink/[0.07] bg-white p-7">
                <Quote className="h-8 w-8 text-brand-600/25" aria-hidden />
                <blockquote className="mt-4 flex-1 text-[1.05rem] leading-relaxed text-ink/80">
                  “{t.quote}”
                </blockquote>
                <figcaption className="mt-6 flex items-center gap-3 border-t border-ink/[0.06] pt-5">
                  <span className="grid h-11 w-11 place-items-center rounded-[var(--radius-button)] bg-ink text-sm font-semibold text-white">
                    {t.name.split(" ").slice(0, 2).map((w) => w[0]).join("")}
                  </span>
                  <span>
                    <span className="block font-medium text-ink">{t.name}</span>
                    <span className="block text-sm text-ink/65">{t.role}</span>
                  </span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
