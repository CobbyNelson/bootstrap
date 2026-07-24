import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, ArrowRight, Bookmark, FileSignature, Check, TriangleAlert, ShieldCheck, Star } from "lucide-react";
import { getOpportunityBySlug, allOpportunitySlugs, scoreOpportunity, DEMO_MANDATE, derive } from "@/lib/matching";
import { scoreBusiness } from "@/lib/business-scoring";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function generateStaticParams() {
  return allOpportunitySlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const o = getOpportunityBySlug(slug);
  if (!o) return { title: "Opportunity" };
  return { title: `${o.name} — ${o.sector}`, description: o.blurb };
}

function starColor(stars: number): string {
  if (stars >= 5) return "#059669";
  if (stars >= 4) return "var(--color-brand-600)";
  return "var(--color-gold-600)";
}

function ScoreRing({ value, color }: { value: number; color: string }) {
  const size = 132;
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(12,13,16,0.07)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c - (value / 100) * c} />
      </svg>
      <div className="absolute text-center">
        <span className="block font-display text-4xl font-semibold text-ink tnum">{value}</span>
        <span className="block text-[0.62rem] uppercase tracking-widest text-ink/40">% match</span>
      </div>
    </div>
  );
}

export default async function OpportunityPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const o = getOpportunityBySlug(slug);
  if (!o) notFound();

  const match = scoreOpportunity(DEMO_MANDATE, o);
  const d = derive(o);
  const biz = scoreBusiness(o);
  const color = starColor(match.stars);

  const metrics = [
    { k: "Ask", v: o.ask },
    { k: "Instrument", v: o.instrument },
    { k: "Target return", v: o.targetReturn },
    { k: "Est. revenue", v: `$${d.revenueM}M` },
    { k: "Est. EBITDA margin", v: `${d.ebitdaMargin}%` },
    { k: "Est. headcount", v: `${d.employees}` },
    { k: "Stage", v: o.stage },
    { k: "Risk", v: d.riskLevel },
    { k: "Listing tier", v: o.tier },
  ];
  const compliance = [
    { k: "Accreditation gate", v: "Cleared", ok: true },
    { k: "Sanctions / PEP screen", v: "Clean", ok: true },
    { k: "Business verification", v: "Verified", ok: true },
    { k: "NDA status", v: "Required", ok: false },
    { k: "Data room", v: "Locked", ok: false },
  ];

  return (
    <>
      {/* header */}
      <section className="relative overflow-hidden border-b border-ink/[0.06] pt-32 pb-10 md:pt-40 md:pb-14">
        <div className="grid-noise pointer-events-none absolute inset-0 opacity-50" aria-hidden />
        <div className="container-x relative">
          <div className="flex items-center gap-2 text-sm text-ink/45">
            <Link href="/marketplace" className="hover:text-ink">Marketplace</Link>
            <span>/</span>
            <span className="text-ink/70">{o.name}</span>
          </div>
          <div className="mt-4 flex flex-wrap items-start justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="grid h-14 w-14 flex-none place-items-center rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 text-lg font-bold text-white">
                {o.name.split(" ").slice(0, 2).map((w) => w[0]).join("")}
              </div>
              <div>
                <h1 className="font-display text-3xl font-semibold text-ink sm:text-4xl">{o.name}</h1>
                <p className="mt-1.5 flex items-center gap-2 text-ink/55">
                  <MapPin className="h-4 w-4" /> {o.country} · {o.region}
                  <span className="text-ink/25">|</span> {o.sector}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant={o.tier === "Platinum" ? "brand" : o.tier === "Gold" ? "gold" : "neutral"}>{o.tier} listing</Badge>
              <Badge variant="success">Verified</Badge>
            </div>
          </div>
        </div>
      </section>

      {/* body */}
      <section className="py-12 md:py-16">
        <div className="container-x grid gap-8 lg:grid-cols-[1fr_380px]">
          {/* left */}
          <div className="space-y-6">
            <div className="rounded-3xl border border-ink/[0.07] bg-white p-7">
              <h2 className="font-display text-xl font-semibold text-ink">Overview</h2>
              <p className="mt-3 leading-relaxed text-ink/65">{o.blurb}</p>
              <p className="mt-3 leading-relaxed text-ink/65">
                {o.name} is seeking {o.ask} in {o.instrument.toLowerCase()} to accelerate growth across {o.region}. The
                opportunity has been screened and verified by the Assets &amp; Capital team and is presented with an
                explainable AI match score against your active mandate.
              </p>
            </div>

            <div className="rounded-3xl border border-ink/[0.07] bg-white p-7">
              <h2 className="font-display text-xl font-semibold text-ink">Key metrics</h2>
              <dl className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
                {metrics.map((m) => (
                  <div key={m.k} className="rounded-2xl bg-paper-2/60 p-4">
                    <dt className="text-[0.65rem] uppercase tracking-wide text-ink/45">{m.k}</dt>
                    <dd className="mt-1 font-semibold text-ink tnum">{m.v}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* fit breakdown — full 15 criteria */}
            <div className="rounded-3xl border border-ink/[0.07] bg-white p-7">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl font-semibold text-ink">AI fit breakdown</h2>
                <span className="text-xs text-ink/45">15 weighted criteria</span>
              </div>
              <div className="mt-5 grid gap-x-8 gap-y-3 sm:grid-cols-2">
                {match.dimensions.map((dim) => (
                  <div key={dim.key}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="text-ink/70">{dim.label} <span className="text-ink/30">· {dim.weight}%</span></span>
                      <span className="font-medium text-ink tnum">{Math.round(dim.f * 100)}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-ink/[0.06]">
                      <div className={cn("h-full rounded-full", dim.f >= 0.85 ? "bg-emerald-500" : dim.f >= 0.6 ? "bg-brand-600" : "bg-gold-500")} style={{ width: `${Math.round(dim.f * 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* business scorecard */}
            <div className="rounded-3xl border border-ink/[0.07] bg-white p-7">
              <h2 className="font-display text-xl font-semibold text-ink">Business scorecard</h2>
              <p className="mt-1 text-sm text-ink/55">AI-generated quality signals for this business.</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {biz.map((b) => {
                  const good = b.higherIsBetter ? b.value >= 70 : b.value <= 45;
                  const mid = b.higherIsBetter ? b.value >= 55 : b.value <= 60;
                  const tone = good ? "text-emerald-600" : mid ? "text-gold-600" : "text-brand-600";
                  return (
                    <div key={b.key} className="rounded-2xl border border-ink/[0.06] p-4">
                      <p className="text-xs text-ink/50">{b.label}</p>
                      <p className={cn("mt-1 font-display text-2xl font-semibold tnum", tone)}>{b.value}</p>
                      <p className="mt-1 text-[0.7rem] leading-snug text-ink/45">{b.recommendations[0]}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-3xl border border-ink/[0.07] bg-white p-7">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-brand-600" />
                <h2 className="font-display text-xl font-semibold text-ink">Compliance readiness</h2>
              </div>
              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                {compliance.map((c) => (
                  <div key={c.k} className="flex items-center justify-between rounded-xl border border-ink/[0.06] px-4 py-3 text-sm">
                    <span className="text-ink/60">{c.k}</span>
                    <Badge variant={c.ok ? "success" : "gold"} size="sm">{c.v}</Badge>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs text-ink/40">Match scores are neutral, criteria-based signals against your mandate — not investment advice.</p>
            </div>
          </div>

          {/* right — match panel */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="space-y-4 rounded-3xl border border-ink/[0.07] bg-white p-7 shadow-[var(--shadow-soft)]">
              <div className="flex flex-col items-center text-center">
                <ScoreRing value={match.score} color={color} />
                <div className="mt-3 flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="h-4 w-4" style={{ color, fill: i <= match.stars ? color : "transparent" }} strokeWidth={1.5} />
                  ))}
                </div>
                <span className="mt-1.5 text-sm font-semibold" style={{ color }}>{match.tier}</span>
                <p className="mt-1 text-xs text-ink/45">vs. mandate: {DEMO_MANDATE.name}</p>
              </div>

              <div className="space-y-2 border-t border-ink/[0.06] pt-5">
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-ink/40">Why this match</p>
                {match.matched.map((r) => (
                  <p key={r} className="flex items-start gap-2 text-sm text-ink/70">
                    <Check className="mt-0.5 h-4 w-4 flex-none text-emerald-600" /> {r}
                  </p>
                ))}
                {match.watchouts.map((r) => (
                  <p key={r} className="flex items-start gap-2 text-sm text-ink/70">
                    <TriangleAlert className="mt-0.5 h-4 w-4 flex-none text-gold-600" /> {r}
                  </p>
                ))}
              </div>

              <div className="flex flex-col gap-2 border-t border-ink/[0.06] pt-5">
                <Button href="/register/investor" variant="primary" size="md" className="w-full">
                  Express interest <ArrowRight className="h-4 w-4" />
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <button className="inline-flex items-center justify-center gap-1.5 rounded-full border border-ink/12 py-2.5 text-sm font-medium text-ink/70 hover:border-ink/25">
                    <Bookmark className="h-4 w-4" /> Save
                  </button>
                  <button className="inline-flex items-center justify-center gap-1.5 rounded-full border border-ink/12 py-2.5 text-sm font-medium text-ink/70 hover:border-ink/25">
                    <FileSignature className="h-4 w-4" /> Sign NDA
                  </button>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}

export const dynamicParams = false;
