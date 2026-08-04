import { PROCESS } from "@/lib/content";
import { SplitHeading } from "@/components/ui/section-heading";
import { Reveal } from "@/components/ui/reveal";
import { PillButton } from "@/components/ui/button";

/**
 * Process section built on the "Designed to Work at Scale" reference: a single
 * large rounded panel, a split header, and numbered steps set as 01/04.
 */
export function Process() {
  const total = String(PROCESS.length).padStart(2, "0");

  return (
    <section className="bg-paper-2/60 py-20 md:py-28">
      <div className="container-x">
        <div className="rounded-[2.5rem] bg-white p-8 shadow-[var(--shadow-soft)] md:p-14">
          <SplitHeading
            eyebrow="The investment process"
            title={<>Designed to<br className="hidden sm:block" /> work at scale</>}
            description="A disciplined pipeline that turns capital–opportunity fit into closed allocations, with expert support at every stage."
          />

          <div className="mt-14 grid gap-10 lg:grid-cols-[minmax(0,240px)_1fr] lg:gap-16">
            {/* leading step, called out large */}
            <div>
              <p className="flex items-baseline text-navy-700">
                <span className="text-[3.5rem] leading-none">01</span>
                <span className="text-xl text-ink/40">/{total}</span>
              </p>
              <p className="mt-4 max-w-[15rem] text-sm leading-relaxed text-ink/65">{PROCESS[0]?.body}</p>
            </div>

            {/* the remaining steps */}
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {PROCESS.slice(1).map((step, i) => (
                <Reveal key={step.title} delay={i * 0.08}>
                  <div className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-ink/[0.07] bg-paper-2/50 p-6 transition-all hover:-translate-y-1 hover:border-brand-200 hover:shadow-[var(--shadow-card)]">
                    <span className="inline-flex w-fit rounded-full bg-white px-3 py-1 label-cta text-[0.6rem] text-ink/70 ring-1 ring-ink/[0.06]">
                      {step.title}
                    </span>
                    <p className="mt-auto pt-10 text-[0.95rem] leading-relaxed text-ink/70">{step.body}</p>
                    <span className="mt-4 text-sm text-ink/35 tnum">
                      {String(i + 2).padStart(2, "0")}/{total}
                    </span>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>

          <div className="mt-14 flex flex-col items-start gap-5 border-t border-ink/[0.07] pt-8 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-xl text-navy-700">Specialised roadshows</h3>
              <p className="mt-1 text-sm text-ink/65">
                Meet several pre-screened opportunities in one session built around your mandate.
              </p>
            </div>
            <PillButton href="/services/roadshows" tone="brand" className="shrink-0">
              Request a roadshow
            </PillButton>
          </div>
        </div>
      </div>
    </section>
  );
}
