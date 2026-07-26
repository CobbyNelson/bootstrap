import { ArrowRight } from "lucide-react";
import { PROCESS } from "@/lib/content";
import { SectionHeading } from "@/components/ui/section-heading";
import { Reveal } from "@/components/ui/reveal";
import { Button } from "@/components/ui/button";

export function Process() {
  return (
    <section className="relative overflow-hidden bg-navy-800 py-20 text-white md:py-28">
      <div className="grid-noise pointer-events-none absolute inset-0 opacity-20" aria-hidden />
      <div
        className="pointer-events-none absolute right-[-5%] top-1/2 h-[400px] w-[400px] -translate-y-1/2 rounded-full opacity-40 blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(229,50,43,0.45), transparent 60%)" }}
        aria-hidden
      />
      <div className="container-x relative">
        <SectionHeading
          invert
          eyebrow="The investment process"
          title="Screen. Match. Engage. Close."
          subtitle={<span className="text-white/60">A disciplined pipeline that turns capital–opportunity fit into closed allocations, with expert support at every stage.</span>}
        />

        <div className="mt-16 grid gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/5 md:grid-cols-4">
          {PROCESS.map((step, i) => (
            <Reveal key={step.title} delay={i * 0.1}>
              <div className="group relative h-full bg-navy-900/40 p-8 transition-colors hover:bg-white/[0.04]">
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-full border border-brand-500/50 font-grotesk text-sm font-semibold text-brand-400">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {i < PROCESS.length - 1 && (
                    <ArrowRight className="h-4 w-4 text-white/20" aria-hidden />
                  )}
                </div>
                <h3 className="mt-5 text-lg font-semibold text-white">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/70">{step.body}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center gap-4 rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-center md:flex-row md:justify-between md:text-left">
          <div>
            <h3 className="text-xl font-semibold text-white">Specialised roadshows</h3>
            <p className="mt-1 text-sm text-white/70">
              Meet several pre-screened opportunities in one session built around your mandate.
            </p>
          </div>
          <Button href="/services/roadshows" variant="primary" size="lg" className="shrink-0">
            Request a roadshow <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}
