import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin } from "lucide-react";
import { getOpportunityBySlug, allOpportunitySlugs, scoreOpportunity, DEMO_MANDATE, derive } from "@/lib/matching";
import { scoreBusiness } from "@/lib/business-scoring";
import { Badge } from "@/components/ui/badge";
import { BusinessDetail } from "@/components/marketplace/business-detail";

export function generateStaticParams() {
  return allOpportunitySlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const o = getOpportunityBySlug(slug);
  if (!o) return { title: "Opportunity" };
  return { title: `${o.name} — ${o.sector}`, description: o.blurb };
}

export default async function OpportunityPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const o = getOpportunityBySlug(slug);
  if (!o) notFound();

  const match = scoreOpportunity(DEMO_MANDATE, o);
  const d = derive(o);
  const biz = scoreBusiness(o);

  return (
    <>
      {/* header — core, always visible */}
      <section className="relative overflow-hidden border-b border-ink/[0.06] pt-32 pb-10 md:pt-40 md:pb-14">
        <div className="grid-noise pointer-events-none absolute inset-0 opacity-50" aria-hidden />
        <div className="container-x relative">
          <div className="flex items-center gap-2 text-sm text-ink/60">
            <Link href="/marketplace" className="hover:text-ink">
              Marketplace
            </Link>
            <span>/</span>
            <span className="text-ink/70">{o.name}</span>
          </div>
          <div className="mt-4 flex flex-wrap items-start justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="grid h-14 w-14 flex-none place-items-center rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 text-lg font-bold text-white">
                {o.name.split(" ").slice(0, 2).map((w) => w[0]).join("")}
              </div>
              <div>
                <h1 className="font-display text-3xl font-semibold text-navy-700 sm:text-4xl">{o.name}</h1>
                <p className="mt-1.5 flex items-center gap-2 text-ink/65">
                  <MapPin className="h-4 w-4" /> {o.country} · {o.region}
                  <span className="text-ink/25">|</span> {o.sector}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant={o.tier === "Platinum" ? "brand" : o.tier === "Gold" ? "gold" : "neutral"}>
                {o.tier} listing
              </Badge>
              <Badge variant="success">Verified</Badge>
            </div>
          </div>
        </div>
      </section>

      {/* body — tiered access (core / subscription / expressed-interest) */}
      <section className="py-12 md:py-16">
        <div className="container-x">
          <BusinessDetail o={o} slug={slug} match={match} d={d} biz={biz} mandateName={DEMO_MANDATE.name} />
        </div>
      </section>
    </>
  );
}

export const dynamicParams = false;
