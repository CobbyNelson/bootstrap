import type { Metadata } from "next";
import { Check, ArrowRight, Sparkles } from "lucide-react";
import { LISTING_TIERS, SERVICES } from "@/lib/content";
import { PageHeader } from "@/components/layout/page-header";
import { SectionHeading } from "@/components/ui/section-heading";
import { Reveal } from "@/components/ui/reveal";
import { Button } from "@/components/ui/button";
import { InvestorPlans } from "@/components/pricing/investor-plans";
import { getAccess } from "@/lib/entitlements-server";
import { cn } from "@/lib/utils";
import { getTranslator } from "@/lib/i18n/store";
import { translateContent } from "@/lib/i18n/translate-content";
import type { Locale } from "@/lib/i18n/config";

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const t = await getTranslator((await params).locale);
  return {
    title: t.tl("Pricing & Listing Tiers"),
    description: t.tl("Transparent listing tiers from Standard to Platinum, à la carte services, and a success-fee model aligned to your outcome."),
  };
}

const FAQ = [
  { q: "How does the success fee work?", a: "For businesses raising capital, the success fee is charged only when a deal closes through the platform. If the raise does not complete, there is no fee." },
  { q: "Can I upgrade my listing later?", a: "Yes. You can upgrade from Standard to Silver, Gold, or Platinum at any time and only pay the difference for the remainder of your listing window." },
  { q: "Do investors pay to join?", a: "Registering and browsing core listing details is free. An investor subscription (Pro or Elite) unlocks full business details across the marketplace, and expressing interest in a business opens its data room, AI profile and your personalised match rate. Roadshows and partnerships created at your request are billed separately." },
  { q: "What's included in a roadshow?", a: "A specialised roadshow puts your opportunity in front of several pre-screened investors whose mandates match it, organised end to end by our team." },
];

export default async function PricingPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const t = await getTranslator(locale);
  const access = await getAccess();
  return (
    <>
      <PageHeader
        title={t.tl("Simple tiers. Aligned incentives.")}
        subtitle={t.tl("List your business to reach our global investor network, add expert services as you need them, and pay a success fee only when a deal closes.")}
      />

      {/* tiers */}
      <section className="py-12 md:py-16">
        <div className="container-x grid gap-6 lg:grid-cols-4">
          {translateContent(LISTING_TIERS, t).map((tier, i) => (
            <Reveal key={tier.name} delay={i * 0.06}>
              <div
                className={cn(
                  "relative flex h-full flex-col rounded-3xl border p-7 transition-all",
                  tier.featured
                    ? "border-brand-600/30 bg-white shadow-[var(--shadow-lift)] ring-1 ring-brand-600/20"
                    : "border-ink/[0.07] bg-white hover:shadow-[var(--shadow-card)]"
                )}
              >
                {tier.featured && (
                  <span className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-brand-600 px-3 py-1 text-xs font-semibold text-white">
                    <Sparkles className="h-3 w-3" /> {t.tl("Most popular")}
                  </span>
                )}
                <p className="font-display text-xl font-semibold text-navy-700">{tier.name}</p>
                <p className="mt-1 text-sm text-ink/65">{tier.tagline}</p>
                {/* flex-wrap + nowrap on the cadence: when the pair does not fit
                    the card, the cadence moves down as a whole phrase instead of
                    breaking after the slash ("Custom /" ⏎ "engagement").
                    The slash is dropped for a non-numeric price, where it reads
                    as a division sign rather than "per". */}
                <div className="mt-5 flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
                  <span className="font-display text-4xl font-semibold text-navy-700 tnum">{tier.price}</span>
                  <span className="whitespace-nowrap text-sm text-ink/65">
                    {/* cadence is on translateContent's skip list, correctly — it holds
                        figures elsewhere. Here it is the word "listing", so it goes
                        through the translator on its own rather than by widening a
                        rule that exists to stop a price being "translated". */}
                    {/\d/.test(tier.price)
                      ? t.tl("/ {cadence}").replace("{cadence}", t.tl(tier.cadence))
                      : t.tl(tier.cadence)}
                  </span>
                </div>
                <Button
                  href="/register/business"
                  variant={tier.featured ? "primary" : "outline"}
                  size="md"
                  className="mt-6 w-full"
                >
                  {t.tl("Choose {tier}").replace("{tier}", tier.name)}
                </Button>
                <ul className="mt-7 space-y-3">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-ink/70">
                      <Check className={cn("mt-0.5 h-4 w-4 flex-none", tier.featured ? "text-brand-600" : "text-navy-600")} />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* investor membership */}
      <section id="investor" className="scroll-mt-28 border-t border-ink/[0.06] py-14 md:py-20">
        <div className="container-x">
          <SectionHeading
            align="center"
            title={t.tl("Free to join. Subscribe to go deep.")}
            subtitle={t.tl("Registering and browsing core details is always free. An investor subscription unlocks full business details across the marketplace — then expressing interest opens each business's data room, AI profile and your personalised match rate.")}
            className="mx-auto"
          />
          <div className="mt-12">
            <InvestorPlans signedIn={access.signedIn} active={access.subscribed} plan={access.plan} />
          </div>
        </div>
      </section>

      {/* success fee */}
      <section className="py-12">
        <div className="container-x">
          <Reveal>
            <div className="relative overflow-hidden rounded-[2rem] bg-ink px-8 py-12 text-white md:px-14 md:py-16">
              <div className="grid-noise pointer-events-none absolute inset-0 opacity-20" aria-hidden />
              <div className="relative grid items-center gap-8 md:grid-cols-[1.4fr_1fr]">
                <div>
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[0.7rem] kicker text-white">
                    {t.tl("Aligned incentives")}
                  </span>
                  <h2 className="mt-4 font-display text-3xl font-semibold md:text-4xl">{t.tl("Pay a success fee only when you close")}</h2>
                  <p className="mt-4 max-w-xl text-white/75">
                    {t.tl("Beyond the listing fee, businesses pay a success fee on capital successfully raised through the platform. Investors pay only for roadshows and partnerships they ask us to arrange.")}
                  </p>
                  <Button href="/contact" variant="inverse" size="md" className="mt-7">
                    {t.tl("Talk to our team")} <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid gap-3">
                  {[
                    { k: "Listing fee", v: "From $490" },
                    { k: "Success fee", v: "On closed deals only" },
                    { k: "Investor sign-up", v: "Free" },
                  ].map((row) => (
                    <div key={row.k} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4">
                      <span className="text-sm text-white/70">{row.k}</span>
                      <span className="font-semibold">{row.v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* services */}
      <section className="py-12 md:py-16">
        <div className="container-x">
          <SectionHeading align="center" title={t.tl("Add expert support as you need it")} className="mx-auto" />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {translateContent(SERVICES, t).map((s, i) => (
              <Reveal key={s.title} delay={(i % 3) * 0.06}>
                <div className="h-full rounded-3xl border border-ink/[0.07] bg-white p-6">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
                    <s.icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 font-semibold text-ink">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink/65">{s.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-12 md:py-20">
        <div className="container-x max-w-3xl">
          <SectionHeading align="center" title={t.tl("Questions, answered")} className="mx-auto" />
          <div className="mt-10 divide-y divide-ink/[0.08] rounded-3xl border border-ink/[0.07] bg-white px-6">
            {translateContent(FAQ, t).map((item) => (
              <details key={item.q} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium text-ink">
                  {item.q}
                  <span className="grid h-6 w-6 flex-none place-items-center rounded-[var(--radius-button)] border border-ink/15 text-ink/65 transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-ink/60">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
