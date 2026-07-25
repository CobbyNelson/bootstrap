import type { Metadata } from "next";
import { ShieldCheck, Sparkles, Globe } from "lucide-react";
import { MarketplaceView } from "@/components/marketplace/marketplace-view";

export const metadata: Metadata = {
  title: "Marketplace",
  description:
    "Browse vetted investment opportunities across sectors and geographies, ranked by fit to your mandate.",
};

const TRUST = [
  { icon: ShieldCheck, label: "Screened & verified" },
  { icon: Sparkles, label: "Mandate-matched scoring" },
  { icon: Globe, label: "Global coverage" },
];

export default function MarketplacePage() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-ink/[0.06] pt-32 pb-12 md:pt-40 md:pb-16">
        <div className="grid-noise pointer-events-none absolute inset-0 opacity-50" aria-hidden />
        <div
          className="pointer-events-none absolute -top-32 right-[-8%] h-[420px] w-[420px] rounded-full opacity-40 blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(229,50,43,0.16), transparent 65%)" }}
          aria-hidden
        />
        <div className="container-x relative">
          <span className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-white/70 px-3 py-1 text-[0.7rem] kicker text-brand-700 backdrop-blur">
            <span className="flex items-center gap-0.5" aria-hidden>
              <span className="h-1.5 w-1.5 rounded-full bg-navy-600" />
              <span className="h-1.5 w-1.5 rounded-full bg-brand-600" />
            </span>
            Marketplace
          </span>

          <h1 className="mt-5 max-w-3xl font-display text-4xl font-extrabold leading-[1.02] tracking-tight sm:text-5xl md:text-[3.6rem]">
            <span className="text-navy-700">Explore top </span>
            <span className="text-brand-600">businesses.</span>
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink/60">
            Bridging the gap — one opportunity at a time. Every listing is screened, verified, and scored
            against your mandate.
          </p>

          <div className="mt-7 flex flex-wrap gap-2.5">
            {TRUST.map((t) => (
              <span
                key={t.label}
                className="inline-flex items-center gap-1.5 rounded-full border border-ink/10 bg-white px-3.5 py-1.5 text-sm font-medium text-ink/70"
              >
                <t.icon className="h-4 w-4 text-brand-600" /> {t.label}
              </span>
            ))}
          </div>
        </div>
      </section>
      <MarketplaceView />
    </>
  );
}
