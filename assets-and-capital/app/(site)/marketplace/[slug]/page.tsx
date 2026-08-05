import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin } from "lucide-react";
import { getOpportunityBySlug, allOpportunitySlugs, scoreOpportunity, DEMO_MANDATE, derive } from "@/lib/matching";
import { scoreBusiness } from "@/lib/business-scoring";
import { getAccess } from "@/lib/entitlements-server";
import { Badge } from "@/components/ui/badge";
import { listingImage } from "@/lib/imagery";
import { getListingHeroes, getListingGallery } from "@/lib/listing-heroes";
import { ListingGallery } from "@/components/marketplace/listing-gallery";
import { BusinessDetail } from "@/components/marketplace/business-detail";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const o = getOpportunityBySlug(slug);
  if (!o) return { title: "Opportunity" };
  return { title: `${o.name} — ${o.sector}`, description: o.blurb };
}

export function generateStaticParams() {
  return allOpportunitySlugs().map((slug) => ({ slug }));
}

export default async function OpportunityPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const o = getOpportunityBySlug(slug);
  if (!o) notFound();

  // Business-uploaded hero first; the sector stand-in only when they have not
  // supplied one. Same order as the cards, so the page matches its card.
  const heroes = await getListingHeroes();
  const cover = heroes[slug] ?? listingImage(o);
  const gallery = await getListingGallery(slug);

  // Access is resolved on the server; gated payloads are only computed and sent
  // when the viewer is entitled to them.
  const access = await getAccess(slug);

  const full = access.full
    ? (() => {
        const d = derive(o);
        return {
          targetReturn: o.targetReturn,
          revenueM: d.revenueM,
          ebitdaMargin: d.ebitdaMargin,
          employees: d.employees,
          riskLevel: d.riskLevel,
        };
      })()
    : null;

  const deal = access.deal
    ? (() => {
        const m = scoreOpportunity(DEMO_MANDATE, o);
        return {
          score: m.score,
          stars: m.stars,
          tier: m.tier,
          matched: m.matched,
          watchouts: m.watchouts,
          dimensions: m.dimensions.map((x) => ({ key: x.key, label: x.label, weight: x.weight, f: x.f })),
          scorecard: scoreBusiness(o),
        };
      })()
    : null;

  const documents = access.docs
    ? ["Information memorandum", "Financial model (3-year)", "Cap table", "Management deck", "Legal & KYC pack"]
    : null;

  return (
    <>
      {/* header — core, always visible */}
      <section className="relative overflow-hidden border-b border-ink/[0.06] pt-32 pb-10 md:pt-40 md:pb-14">
        {/* Featured image sits BEHIND the header rather than above it, so the
            breadcrumb, name and badges keep their position and the page has no
            extra vertical jump. Heavily scrimmed because navy-700 body text has
            to stay readable over whatever the photograph does. */}
        {cover && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={cover.src}
              alt={cover.alt}
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div
              className="absolute inset-0 bg-gradient-to-r from-paper via-paper/92 to-paper/70"
              aria-hidden
            />
          </>
        )}
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
              <div className="grid h-14 w-14 flex-none place-items-center rounded-2xl bg-brand-600 text-lg font-bold text-white">
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

      {/* Business-supplied imagery. Ungated on purpose: this is marketing
          material the business chose to publish, not data-room content —
          the same standing as the hero it already shows every visitor. */}
      {gallery.length > 0 && (
        <section className="pt-10 md:pt-12">
          <div className="container-x">
            <div className="max-w-3xl">
              <ListingGallery images={gallery} />
            </div>
          </div>
        </section>
      )}

      {/* body — tiered access enforced server-side */}
      <section className="py-12 md:py-16">
        <div className="container-x">
          <BusinessDetail
            o={{
              name: o.name,
              sector: o.sector,
              ask: o.ask,
              instrument: o.instrument,
              stage: o.stage,
              tier: o.tier,
              blurb: o.blurb,
              region: o.region,
            }}
            slug={slug}
            access={access}
            full={full}
            deal={deal}
            documents={documents}
            mandateName={DEMO_MANDATE.name}
          />
        </div>
      </section>
    </>
  );
}

// Access varies per viewer, so this page renders per request.
export const dynamic = "force-dynamic";
