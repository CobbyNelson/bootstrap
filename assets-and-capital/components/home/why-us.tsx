import { WHY } from "@/lib/content";
import { SectionHeading } from "@/components/ui/section-heading";
import { Reveal } from "@/components/ui/reveal";

export function WhyUs() {
  return (
    <section className="bg-paper-2/60 py-20 md:py-28">
      <div className="container-x">
        <SectionHeading
          align="center"
          eyebrow="Why choose us"
          title="What we do beyond listing a business"
          subtitle="We combine modern technology with a global, on-the-ground team to deliver quality — for both sides of the deal."
          className="mx-auto"
        />
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {WHY.map((item, i) => (
            <Reveal key={item.title} delay={i * 0.08}>
              <div className="group h-full rounded-3xl border border-ink/[0.07] bg-white p-7 transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-card)]">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-600 ring-1 ring-brand-100 transition-colors group-hover:bg-brand-600 group-hover:text-white">
                  <item.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-5 text-lg font-semibold text-ink">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink/65">{item.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
