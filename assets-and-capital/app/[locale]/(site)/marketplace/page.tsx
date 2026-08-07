import type { Metadata } from "next";
import { Suspense } from "react";
import { ShieldCheck, Sparkles, Globe } from "lucide-react";
import { MarketplaceView } from "@/components/marketplace/marketplace-view";
import { getUnlockedSlugs } from "@/lib/entitlements-server";
import { getListingHeroes } from "@/lib/listing-heroes";
import { getTranslator } from "@/lib/i18n/store";
import { translateContent } from "@/lib/i18n/translate-content";
import type { Locale } from "@/lib/i18n/config";
import { JsonLd } from "@/components/seo/json-ld";
import { itemListSchema } from "@/lib/seo";
import { MARKETPLACE } from "@/lib/marketplace-data";
import { slugify } from "@/lib/matching";

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const t = await getTranslator((await params).locale);
  return {
    title: t.tl("Marketplace"),
    description: t.tl("Browse vetted investment opportunities across sectors and geographies, ranked by fit to your mandate."),
  };
}

const TRUST = [
  { icon: ShieldCheck, label: "Screened & verified" },
  { icon: Sparkles, label: "Mandate-matched scoring" },
  { icon: Globe, label: "Global coverage" },
];

/**
 * Suspense fallback for the listing area only.
 *
 * Deliberately not the route-level loading.tsx: that one carries the hero's own
 * pt-32, which would stack on top of the hero already rendered above and drop
 * the grid half a screen down for a frame.
 */
function MarketplaceLoading() {
  return (
    <div className="container-x py-12">
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-2xl border border-ink/[0.07] bg-white">
            <div className="skeleton aspect-[16/9] rounded-none" />
            <div className="space-y-3 p-5">
              <div className="skeleton h-5 w-2/3 rounded" />
              <div className="skeleton h-4 w-full rounded" />
              <div className="skeleton h-4 w-1/2 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function MarketplacePage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const t = await getTranslator(locale);
  const unlockedSlugs = await getUnlockedSlugs();
  const heroes = await getListingHeroes();
  return (
    <>
    {/* Tells a crawler this is an ordered set of distinct things with their
        own URLs, rather than one page of prose that happens to name sixteen
        companies. Names are untranslated on purpose — a company name is a
        proper noun, not copy. */}
    <JsonLd
      data={itemListSchema(
        "Investment opportunities",
        MARKETPLACE.map((o) => ({ name: o.name, path: `/marketplace/${slugify(o.name)}` })),
      )}
    />
      <section className="relative overflow-hidden border-b border-ink/[0.06] pt-32 pb-12 md:pt-40 md:pb-16">
        <div className="grid-noise pointer-events-none absolute inset-0 opacity-50" aria-hidden />
        <div
          className="pointer-events-none absolute -top-32 right-[-8%] h-[420px] w-[420px] rounded-[var(--radius-button)] opacity-40 blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(229,50,43,0.16), transparent 65%)" }}
          aria-hidden
        />
        <div className="container-x relative">
          <h1 className="max-w-3xl font-display text-4xl font-extrabold leading-[1.02] tracking-tight sm:text-5xl md:text-[3.6rem]">
            <span className="text-navy-700">{t.tl("Explore top")} </span>
            <span className="text-brand-600">businesses.</span>
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink/60">
            {t.tl("Bridging the gap — one opportunity at a time. Every listing is screened, verified, and scored against your mandate.")}
          </p>

          <div className="mt-7 flex flex-wrap gap-2.5">
            {translateContent(TRUST, t).map((t) => (
              <span
                key={t.label}
                className="inline-flex items-center gap-1.5 rounded-[var(--radius-button)] border border-ink/10 bg-white px-3.5 py-1.5 text-sm font-medium text-ink/70"
              >
                <t.icon className="h-4 w-4 text-brand-600" /> {t.label}
              </span>
            ))}
          </div>
        </div>
      </section>
      {/* MarketplaceView reads the hero search's query string via
          useSearchParams, which forces this subtree out of the static prerender.
          Without the boundary `next build` fails outright — dev never surfaces
          it, so the fallback is not optional decoration. */}
      <Suspense fallback={<MarketplaceLoading />}>
        <MarketplaceView unlockedSlugs={unlockedSlugs} heroes={heroes} />
      </Suspense>
    </>
  );
}
