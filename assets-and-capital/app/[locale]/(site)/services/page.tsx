import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Reveal } from "@/components/ui/reveal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getTranslator } from "@/lib/i18n/store";
import { translateContent } from "@/lib/i18n/translate-content";
import type { Locale } from "@/lib/i18n/config";
import { SERVICES } from "@/lib/services";

/**
 * The index for /services.
 *
 * It did not exist. The nav linked to individual services, the assistant
 * offered "All services" and sent people to a 404, and anyone who trimmed a URL
 * back to /services got the same. The five detail pages were reachable only if
 * you already knew their slugs.
 *
 * Built from lib/services.ts rather than a second hand-written list, so a
 * service added once appears here, on its own page, and in generateStaticParams
 * — there is no arrangement in which this page can list something that has no
 * page behind it.
 */

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const t = await getTranslator((await params).locale);
  return {
    title: t.tl("Services"),
    description: t.tl(
      "Business plans, financial models, teaser and pitch preparation, specialised roadshows and market access support — priced separately and requested as you need them.",
    ),
  };
}

export default async function ServicesPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const t = await getTranslator(locale);

  // Object.entries keeps the slug beside the content, so the link target comes
  // from the same record as the copy rather than being spelled out again here.
  const services = Object.entries(SERVICES).map(([slug, s]) => ({ slug, ...translateContent(s, t) }));

  return (
    <>
      <PageHeader
        title={t.tl("Services that get a deal to the table")}
        subtitle={t.tl(
          "Alongside the marketplace, our team prepares the documents investors read first and puts the right people in the same room. Each is priced separately and requested as you need it.",
        )}
      >
        <Button href="/contact" variant="primary" size="lg">
          {t.tl("Talk to our team")} <ArrowRight className="h-4 w-4" />
        </Button>
      </PageHeader>

      <section className="py-16 md:py-20">
        <div className="container-x grid gap-5 md:grid-cols-2">
          {services.map((s, i) => (
            <Reveal key={s.slug} delay={(i % 2) * 0.08}>
              <Link
                href={`/services/${s.slug}`}
                className="group flex h-full flex-col rounded-3xl border border-ink/[0.07] bg-white p-7 transition-all hover:shadow-[var(--shadow-card)]"
              >
                {/* Which side of the deal a service is for is the first thing a
                    visitor is trying to work out, so it leads rather than
                    sitting in the body copy. */}
                <Badge variant={s.audience === "investor" ? "brand" : "gold"} size="sm">
                  {s.audience === "investor" ? t.tl("For investors") : t.tl("For businesses")}
                </Badge>

                <h2 className="mt-5 font-display text-xl font-semibold leading-snug text-navy-700 group-hover:text-brand-700">
                  {s.title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-ink/65">{s.subtitle}</p>

                {/* Three of the five, not all: the card is a way in, and the
                    detail page is where the full list belongs. */}
                <ul className="mt-5 space-y-2">
                  {s.features.slice(0, 3).map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-ink/70">
                      <Check className="mt-0.5 h-4 w-4 flex-none text-brand-600" />
                      {f}
                    </li>
                  ))}
                </ul>

                <span className="mt-auto inline-flex items-center gap-1.5 pt-6 text-sm font-medium text-brand-700">
                  {t.tl("Read more")}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}
