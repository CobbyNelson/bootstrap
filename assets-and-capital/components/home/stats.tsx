import { STATS } from "@/lib/content";
import { Counter } from "@/components/ui/counter";
import { Reveal } from "@/components/ui/reveal";

export function StatsBand() {
  return (
    <section className="relative overflow-hidden bg-navy-800 py-16 text-white md:py-20">
      <div className="grid-noise pointer-events-none absolute inset-0 opacity-20" aria-hidden />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent, rgba(229,50,43,0.6), transparent)" }}
        aria-hidden
      />
      <div className="container-x relative">
        <Reveal>
          <p className="kicker text-center text-[0.8rem] text-brand-400">
            Trusted worldwide to make the connection
          </p>
        </Reveal>
        <div className="mt-10 grid grid-cols-2 gap-y-10 md:grid-cols-4">
          {STATS.map((s, i) => (
            <Reveal key={s.label} delay={i * 0.08} className="text-center">
              <div className="font-display text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                <Counter
                  value={s.value}
                  decimals={s.decimals ?? 0}
                  prefix={s.prefix}
                  suffix={s.suffix}
                  className="tnum"
                />
              </div>
              <p className="mt-2 text-sm text-white/70">{s.label}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
