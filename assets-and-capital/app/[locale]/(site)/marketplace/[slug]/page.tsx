import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin } from "lucide-react";
import { getOpportunityBySlug, allOpportunitySlugs, scoreOpportunity, DEMO_MANDATE, derive } from "@/lib/matching";
import { scoreBusiness } from "@/lib/business-scoring";
import { getAccess } from "@/lib/entitlements-server";
import { Badge } from "@/components/ui/badge";
import { listingImage, listingImages } from "@/lib/imagery";
import { getListingHeroes, getListingGallery } from "@/lib/listing-heroes";
import { ListingGallery } from "@/components/marketplace/listing-gallery";
import { BusinessDetail } from "@/components/marketplace/business-detail";
import { getTranslator } from "@/lib/i18n/store";
import { translateContent } from "@/lib/i18n/translate-content";
import type { Locale } from "@/lib/i18n/config";
import { getWeights } from "@/lib/matching-weights";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; locale: Locale }>;
}): Promise<Metadata> {
  const { slug, locale } = await params;
  const o = getOpportunityBySlug(slug);
  const t = await getTranslator(locale);
  if (!o) return { title: t.tl("Opportunity") };
  // The description is what a search engine shows and what a link preview
  // renders, so an untranslated one is the first thing a French or Arabic
  // visitor reads — before the page they are about to translate correctly.
  return { title: `${o.name} — ${t.tl(o.sector)}`, description: t.tl(o.blurb) };
}

export function generateStaticParams() {
  return allOpportunitySlugs().map((slug) => ({ slug }));
}

export default async function OpportunityPage({ params }: { params: Promise<{ slug: string; locale: Locale }> }) {
  const { locale, slug } = await params;
  const t = await getTranslator(locale);
  const o = getOpportunityBySlug(slug);
  if (!o) notFound();

  // Business-uploaded hero first; the sector stand-in only when they have not
  // supplied one. Same order as the cards, so the page matches its card.
  const heroes = await getListingHeroes();
  const cover = heroes[slug] ?? listingImage(o);
  const gallery = await getListingGallery(slug);
  // A business's own uploads replace the stand-in outright — never a mix, so a
  // real photograph is never shown beside generic sector imagery as if both
  // depicted the same company.
  const images = gallery.length > 0 ? gallery : listingImages(o);

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

  const weights = await getWeights();
  const deal = access.deal
    ? (() => {
        const m = scoreOpportunity(DEMO_MANDATE, o, weights);
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
        <div className="grid-noise pointer-events-none absolute inset-0 opacity-50" aria-hidden />
        <div className="container-x relative">
          <div className="flex items-center gap-2 text-sm text-ink/60">
            <Link href="/marketplace" className="hover:text-ink">
              {t.tl("Marketplace")}
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
                  <MapPin className="h-4 w-4" /> {t.tl(o.country)} · {t.tl(o.region)}
                  <span className="text-ink/25">|</span> {t.tl(o.sector)}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant={o.tier === "Platinum" ? "brand" : o.tier === "Gold" ? "gold" : "neutral"}>
                {t.tl("{tier} listing").replace("{tier}", o.tier)}
              </Badge>
              <Badge variant="success">{t.tl("Verified")}</Badge>
            </div>
          </div>
        </div>
      </section>

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
            images={images}
          />
        </div>
      </section>
    </>
  );
}

// Access varies per viewer, so this page renders per request.
export const dynamic = "force-dynamic";
