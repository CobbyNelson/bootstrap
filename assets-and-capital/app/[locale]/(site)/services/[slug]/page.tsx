import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Check, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { getTranslator } from "@/lib/i18n/store";
import { translateContent } from "@/lib/i18n/translate-content";
import type { Locale } from "@/lib/i18n/config";
import { SERVICES } from "@/lib/services";

export function generateStaticParams() {
  return Object.keys(SERVICES).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const s = SERVICES[slug];
  if (!s) return { title: "Service" };
  return { title: s.title, description: s.subtitle };
}

export default async function ServicePage({ params }: { params: Promise<{ slug: string; locale: Locale }> }) {
  const { locale, slug } = await params;
  const t = await getTranslator(locale);
  const s = SERVICES[slug];
  if (!s) notFound();

  return (
    <>
      <PageHeader title={s.title} subtitle={s.subtitle}>
        <Button href={s.cta.href} variant="primary" size="lg">
          {s.cta.label} <ArrowRight className="h-4 w-4" />
        </Button>
      </PageHeader>

      <section className="py-16 md:py-20">
        <div className="container-x grid gap-12 lg:grid-cols-[1.3fr_1fr]">
          <div>
            <p className="text-lg leading-relaxed text-ink/70">{s.intro}</p>
          </div>
          <div className="rounded-3xl border border-ink/[0.07] bg-white p-7">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-ink/60">{t.tl("What's included")}</p>
            <ul className="mt-4 space-y-3">
              {s.features.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-ink/70">
                  <Check className="mt-0.5 h-4 w-4 flex-none text-brand-600" />
                  {f}
                </li>
              ))}
            </ul>
            <Button href={s.cta.href} variant="dark" size="md" className="mt-7 w-full">
              {s.cta.label}
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
