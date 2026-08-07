import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Scale, Star } from "lucide-react";
import { getOpportunityBySlug, scoreOpportunity, DEMO_MANDATE, derive, slugify } from "@/lib/matching";
import { scoreBusiness, overallReadiness } from "@/lib/business-scoring";
import { Money } from "@/components/ui/money";
import { cn } from "@/lib/utils";
import { getTranslator, type Translator } from "@/lib/i18n/store";
import { translateContent } from "@/lib/i18n/translate-content";
import type { Locale } from "@/lib/i18n/config";
import { getWeights } from "@/lib/matching-weights";

export const metadata: Metadata = { title: "Compare opportunities" };

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("");
}

export default async function ComparePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ ids?: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslator(locale);
  const weights = await getWeights();
  const { ids } = await searchParams;
  const slugs = (ids ?? "").split(",").map((s) => s.trim()).filter(Boolean).slice(0, 3);
  const opps = slugs.map((s) => getOpportunityBySlug(s)).filter(Boolean) as NonNullable<ReturnType<typeof getOpportunityBySlug>>[];

  return (
    <div className="pt-32 pb-20 md:pt-40">
      <div className="container-x">
        <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
          <span className="text-navy-700">{t.tl("Compare")} </span>
          <span className="text-brand-600">{t.tl("opportunities.")}</span>
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-ink/60">{t.tl("Weigh mandate fit, terms and fundamentals side by side.")}</p>

        {opps.length < 2 ? (
          <div className="mt-10 grid place-items-center rounded-3xl border border-dashed border-ink/15 bg-white/50 px-6 py-16 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
              <Scale className="h-6 w-6" />
            </span>
            <h3 className="mt-5 font-display text-lg font-bold text-navy-700">{t.tl("Pick at least two to compare")}</h3>
            <p className="mt-1.5 max-w-sm text-sm text-ink/65">{t.tl("Save opportunities from the marketplace, then compare your shortlist here.")}</p>
            <Link href="/marketplace" className="mt-6 inline-flex items-center gap-2 rounded-[var(--radius-button)] bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">
              {t.tl("Browse the marketplace")} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <ComparisonTable opps={opps} t={t} weights={weights} />
        )}
      </div>
    </div>
  );
}

// The translator arrives as a prop rather than being fetched here: this is a
// synchronous component, and awaiting getTranslator inside it would mean making
// it async for one string while the page above already holds the same
// translator for the same request.
function ComparisonTable({
  opps,
  t,
  weights,
}: {
  opps: NonNullable<ReturnType<typeof getOpportunityBySlug>>[];
  t: Translator;
  /** Same reason as the translator: this component is synchronous. */
  weights: Awaited<ReturnType<typeof getWeights>>;
}) {
  const cols = opps.map((o) => {
    const match = scoreOpportunity(DEMO_MANDATE, o, weights);
    const d = derive(o);
    const biz = overallReadiness(scoreBusiness(o));
    return { o, match, d, biz };
  });

  const rows: { label: string; render: (c: (typeof cols)[number]) => React.ReactNode }[] = [
    { label: "Mandate match", render: (c) => (
      <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-700">
        <span className="tnum">{c.match.score}</span>
        <span className="flex">{Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className={cn("h-3.5 w-3.5", i < c.match.stars ? "fill-navy-500 text-navy-500" : "text-ink/15")} />
        ))}</span>
      </span>
    ) },
    { label: "Listing tier", render: (c) => c.o.tier },
    { label: "Sector", render: (c) => c.o.sector },
    { label: "Location", render: (c) => `${c.o.country} · ${c.o.region}` },
    { label: "Stage", render: (c) => c.o.stage },
    { label: "Instrument", render: (c) => c.o.instrument },
    { label: "Ask", render: (c) => <span className="font-bold text-ink"><Money usd={c.o.ask} /></span> },
    { label: "Target return", render: (c) => c.o.targetReturn },
    { label: "Est. revenue", render: (c) => <Money usd={`$${c.d.revenueM}M`} /> },
    { label: "Est. EBITDA margin", render: (c) => `${c.d.ebitdaMargin}%` },
    { label: "Risk level", render: (c) => c.d.riskLevel },
    { label: "Investment readiness", render: (c) => <span className="font-semibold text-navy-700">{c.biz}/100</span> },
  ];

  return (
    <div className="mt-10 overflow-x-auto">
      <div className="min-w-[640px]">
        {/* header row */}
        <div className="grid" style={{ gridTemplateColumns: `180px repeat(${cols.length}, minmax(0, 1fr))` }}>
          <div />
          {cols.map((c) => (
            <div key={c.o.name} className="px-3">
              <div className="overflow-hidden rounded-2xl border border-ink/[0.07] bg-white">
                <div className="grid h-24 place-items-center bg-navy-700">
                  <span className="font-display text-2xl font-extrabold text-white/90">{initials(c.o.name)}</span>
                </div>
                <div className="p-3">
                  <p className="font-display text-sm font-bold leading-tight text-brand-600">{c.o.name}</p>
                  <Link href={`/marketplace/${slugify(c.o.name)}`} className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-navy-700 hover:text-brand-600">
                    {t.tl("View")} <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* attribute rows */}
        <dl className="mt-4 divide-y divide-ink/[0.06] rounded-2xl border border-ink/[0.07] bg-white">
          {rows.map((row) => (
            <div key={row.label} className="grid items-center" style={{ gridTemplateColumns: `180px repeat(${cols.length}, minmax(0, 1fr))` }}>
              <dt className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-ink/60">{row.label}</dt>
              {cols.map((c) => (
                <dd key={c.o.name} className="px-4 py-3 text-sm text-ink/75">{row.render(c)}</dd>
              ))}
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
