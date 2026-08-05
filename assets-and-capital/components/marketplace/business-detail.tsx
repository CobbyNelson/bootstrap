"use client";

import { Check, TriangleAlert, ShieldCheck, Star, Lock, FileText } from "lucide-react";
import { SaveButton } from "@/components/ui/save-button";
import { ListingGallery } from "@/components/marketplace/listing-gallery";
import { Money } from "@/components/ui/money";
import { Badge } from "@/components/ui/badge";
import type { Access } from "@/lib/entitlements-server";
import { LockPanel, ExpressInterestButton } from "./access";
import { SignNdaButton } from "./sign-nda";
import { cn } from "@/lib/utils";

type Dim = { key: string; label: string; weight: number; f: number };
type Metric = { key: string; label: string; value: number; higherIsBetter: boolean; recommendations: string[] };
type DealData = {
  score: number;
  stars: number;
  tier: string;
  matched: string[];
  watchouts: string[];
  dimensions: Dim[];
  scorecard: Metric[];
};
type FullData = {
  targetReturn: string;
  revenueM: number;
  ebitdaMargin: number;
  employees: number;
  riskLevel: string;
};
type Biz = {
  name: string;
  sector: string;
  ask: string;
  instrument: string;
  stage: string;
  tier: string;
  blurb: string;
  region: string;
};

function starColor(stars: number): string {
  if (stars >= 5) return "#047857";
  if (stars >= 4) return "var(--color-brand-600)";
  return "var(--color-navy-600)";
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
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (value / 100) * c}
        />
      </svg>
      <div className="absolute text-center">
        <span className="block font-display text-4xl font-semibold text-navy-700 tnum">{value}</span>
        <span className="block text-[0.62rem] uppercase tracking-widest text-ink/60">% match</span>
      </div>
    </div>
  );
}

const card = "rounded-3xl border border-ink/[0.07] bg-white p-7";

export function BusinessDetail({
  o,
  slug,
  access,
  full,
  deal,
  documents,
  mandateName,
  images,
}: {
  o: Biz;
  slug: string;
  access: Access;
  full: FullData | null;
  deal: DealData | null;
  documents: string[] | null;
  mandateName: string;
  /** The business's own uploads when it has them, otherwise sector imagery. */
  images: { src: string; alt: string }[];
}) {
  const { signedIn, subscribed, ndaSigned } = access;

  const coreSnapshot = [
    { k: "Ask", v: <Money usd={o.ask} /> },
    { k: "Instrument", v: o.instrument },
    { k: "Stage", v: o.stage },
    { k: "Listing tier", v: o.tier },
  ];

  const compliance = [
    { k: "Accreditation gate", v: "Cleared", ok: true },
    { k: "Sanctions / PEP screen", v: "Clean", ok: true },
    { k: "Business verification", v: "Verified", ok: true },
    { k: "NDA status", v: ndaSigned ? "Signed" : "Required", ok: ndaSigned },
    { k: "Data room", v: documents ? "Open" : "Locked", ok: !!documents },
  ];

  const subscribeHref = signedIn ? "/pricing#investor" : `/login?next=/marketplace/${slug}`;
  const subscribeCta = signedIn ? "See investor plans" : "Sign in to subscribe";

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
      {/* left */}
      <div className="space-y-6">
        {/* Imagery sits in the left column, aligned with the copy it belongs to,
            rather than spanning the page. More than one frame becomes a slider;
            a single frame stays a plain figure — a carousel with one slide is
            just a picture with extra controls. */}
        {images.length > 1 ? (
          <ListingGallery images={images} />
        ) : images.length === 1 ? (
          <div className="relative aspect-[16/9] overflow-hidden rounded-3xl border border-ink/[0.07]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={images[0].src}
              alt={images[0].alt}
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
        ) : null}

        {/* Overview — core, always visible */}
        <div className={card}>
          <h2 className="font-display text-xl font-semibold text-navy-700">Overview</h2>
          <p className="mt-3 leading-relaxed text-ink/65">{o.blurb}</p>
          <p className="mt-3 leading-relaxed text-ink/65">
            {o.name} is seeking {o.ask} in {o.instrument.toLowerCase()} to accelerate growth across {o.region}. The
            opportunity has been screened and verified by the Assets &amp; Capital team.
          </p>
        </div>

        {/* Core snapshot — always visible */}
        <div className={card}>
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold text-navy-700">Snapshot</h2>
            {!subscribed && <span className="text-xs font-medium text-ink/50">Core details · free</span>}
          </div>
          <dl className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {coreSnapshot.map((m) => (
              <div key={m.k} className="rounded-2xl bg-paper-2/60 p-4">
                <dt className="text-[0.65rem] uppercase tracking-wide text-ink/60">{m.k}</dt>
                <dd className="mt-1 font-semibold text-ink tnum">{m.v}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Full financials + compliance — subscription gated (server-resolved) */}
        {full ? (
          <>
            <div className={card}>
              <h2 className="font-display text-xl font-semibold text-navy-700">Full financials &amp; metrics</h2>
              <dl className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
                {[
                  { k: "Target return", v: full.targetReturn },
                  { k: "Est. revenue", v: <Money usd={`$${full.revenueM}M`} /> },
                  { k: "Est. EBITDA margin", v: `${full.ebitdaMargin}%` },
                  { k: "Est. headcount", v: `${full.employees}` },
                  { k: "Risk level", v: full.riskLevel },
                ].map((m) => (
                  <div key={m.k} className="rounded-2xl bg-paper-2/60 p-4">
                    <dt className="text-[0.65rem] uppercase tracking-wide text-ink/60">{m.k}</dt>
                    <dd className="mt-1 font-semibold text-ink tnum">{m.v}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className={card}>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-brand-600" />
                <h2 className="font-display text-xl font-semibold text-navy-700">Compliance readiness</h2>
              </div>
              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                {compliance.map((c) => (
                  <div
                    key={c.k}
                    className="flex items-center justify-between rounded-xl border border-ink/[0.06] px-4 py-3 text-sm"
                  >
                    <span className="text-ink/60">{c.k}</span>
                    <Badge variant={c.ok ? "success" : "gold"} size="sm">
                      {c.v}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <LockPanel
            variant="subscribe"
            title="Full business details are an investor subscription feature"
            desc="Subscribe to see full financials, target returns, estimated revenue & EBITDA, risk level and compliance readiness for every listing."
            cta={subscribeCta}
            href={subscribeHref}
          />
        )}

        {/* Deal layer: AI fit + scorecard — interest gated (server-resolved) */}
        {deal ? (
          <>
            <div className={card}>
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl font-semibold text-navy-700">AI fit breakdown</h2>
                <span className="text-xs text-ink/60">{deal.dimensions.length} weighted criteria</span>
              </div>
              <div className="mt-5 grid gap-x-8 gap-y-3 sm:grid-cols-2">
                {deal.dimensions.map((dim) => (
                  <div key={dim.key}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="text-ink/70">
                        {dim.label} <span className="text-ink/30">· {dim.weight}%</span>
                      </span>
                      <span className="font-medium text-ink tnum">{Math.round(dim.f * 100)}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-ink/[0.06]">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          dim.f >= 0.85 ? "bg-emerald-500" : dim.f >= 0.6 ? "bg-brand-600" : "bg-navy-500"
                        )}
                        style={{ width: `${Math.round(dim.f * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={card}>
              <h2 className="font-display text-xl font-semibold text-navy-700">Business scorecard</h2>
              <p className="mt-1 text-sm text-ink/65">AI-generated quality signals for this business.</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {deal.scorecard.map((b) => {
                  const good = b.higherIsBetter ? b.value >= 70 : b.value <= 45;
                  const mid = b.higherIsBetter ? b.value >= 55 : b.value <= 60;
                  const tone = good ? "text-emerald-700" : mid ? "text-navy-600" : "text-brand-600";
                  return (
                    <div key={b.key} className="rounded-2xl border border-ink/[0.06] p-4">
                      <p className="text-xs text-ink/65">{b.label}</p>
                      <p className={cn("mt-1 font-display text-2xl font-semibold tnum", tone)}>{b.value}</p>
                      <p className="mt-1 text-[0.7rem] leading-snug text-ink/60">{b.recommendations[0]}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className={card}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-brand-600" />
                  <h2 className="font-display text-xl font-semibold text-navy-700">Data room</h2>
                </div>
                {documents && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                    <Check className="h-3.5 w-3.5" /> NDA signed
                  </span>
                )}
              </div>
              {documents ? (
                <>
                  <div className="mt-5 grid gap-2 sm:grid-cols-2">
                    {documents.map((doc) => (
                      <a
                        key={doc}
                        href="#"
                        className="flex items-center justify-between rounded-xl border border-ink/[0.06] px-4 py-3 text-sm text-ink/70 transition-colors hover:border-brand-200 hover:text-ink"
                      >
                        <span className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-ink/40" /> {doc}
                        </span>
                        <span className="text-xs font-medium text-brand-700">Open</span>
                      </a>
                    ))}
                  </div>
                  <p className="mt-4 text-xs text-ink/60">
                    Match scores are neutral, criteria-based signals against your mandate — not investment advice.
                  </p>
                </>
              ) : (
                <div className="mt-5 rounded-2xl border border-dashed border-ink/15 bg-paper-2/40 p-6 text-center">
                  <div className="mx-auto grid h-11 w-11 place-items-center rounded-2xl bg-white text-brand-600 shadow-sm ring-1 ring-ink/[0.06]">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <p className="mt-3 font-medium text-ink">Sign the mutual NDA to open the data room</p>
                  <p className="mx-auto mt-1 max-w-sm text-sm text-ink/60">
                    Documents are released once you&apos;ve signed the non-disclosure agreement for {o.name}.
                  </p>
                  <SignNdaButton slug={slug} businessName={o.name} signed={ndaSigned} primary className="mt-4" />
                </div>
              )}
            </div>
          </>
        ) : (
          <LockPanel
            variant="interest"
            title="Unlock the AI profile, documents & your match rate"
            desc={
              subscribed
                ? "Express interest to open this business's data room, AI scorecard and the breakdown of how it fits your mandate."
                : "Subscribe, then express interest, to open the data room, AI scorecard and your personalised match rate."
            }
            action={subscribed ? <ExpressInterestButton slug={slug} subscribed={subscribed} interested={access.interested} className="mx-auto max-w-xs" /> : undefined}
            cta={subscribed ? undefined : subscribeCta}
            href={subscribed ? undefined : subscribeHref}
          />
        )}
      </div>

      {/* right — match panel */}
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="space-y-4 rounded-3xl border border-ink/[0.07] bg-white p-7 shadow-[var(--shadow-soft)]">
          {deal ? (
            <>
              <div className="flex flex-col items-center text-center">
                <ScoreRing value={deal.score} color={starColor(deal.stars)} />
                <div className="mt-3 flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      className="h-4 w-4"
                      style={{
                        color: starColor(deal.stars),
                        fill: i <= deal.stars ? starColor(deal.stars) : "transparent",
                      }}
                      strokeWidth={1.5}
                    />
                  ))}
                </div>
                <span className="mt-1.5 text-sm font-semibold" style={{ color: starColor(deal.stars) }}>
                  {deal.tier}
                </span>
                <p className="mt-1 text-xs text-ink/60">vs. mandate: {mandateName}</p>
              </div>

              <div className="space-y-2 border-t border-ink/[0.06] pt-5">
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-ink/60">Why this match</p>
                {deal.matched.map((r) => (
                  <p key={r} className="flex items-start gap-2 text-sm text-ink/70">
                    <Check className="mt-0.5 h-4 w-4 flex-none text-emerald-700" /> {r}
                  </p>
                ))}
                {deal.watchouts.map((r) => (
                  <p key={r} className="flex items-start gap-2 text-sm text-ink/70">
                    <TriangleAlert className="mt-0.5 h-4 w-4 flex-none text-navy-600" /> {r}
                  </p>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center px-2 py-4 text-center">
              <div className="grid h-16 w-16 place-items-center rounded-[var(--radius-button)] bg-paper-2 text-ink/40">
                <Lock className="h-6 w-6" />
              </div>
              <p className="mt-4 font-display text-lg font-semibold text-navy-700">Your match rate is locked</p>
              <p className="mt-1.5 text-sm leading-relaxed text-ink/60">
                {subscribed
                  ? "Express interest to reveal your personalised match score, the AI breakdown and this business's documents."
                  : "Subscribe and express interest to reveal your personalised match score and AI profile for this business."}
              </p>
            </div>
          )}

          <div className="flex flex-col gap-2 border-t border-ink/[0.06] pt-5">
            <ExpressInterestButton slug={slug} subscribed={subscribed} interested={access.interested} signedIn={signedIn} />
            <div className="grid grid-cols-2 gap-2">
              <SaveButton slug={slug} variant="detail" />
              <SignNdaButton slug={slug} businessName={o.name} signed={ndaSigned} className="w-full" />
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
