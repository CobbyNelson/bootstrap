import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, TrendingUp, Building2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { getTranslator } from "@/lib/i18n/store";
import { translateContent } from "@/lib/i18n/translate-content";
import type { Locale } from "@/lib/i18n/config";

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const t = await getTranslator((await params).locale);
  return {
    title: t.tl("Get Started"),
    description: t.tl("Join Assets & Capital as an investor or list your business seeking capital."),
  };
}

const PATHS = [
  {
    href: "/register/investor",
    icon: TrendingUp,
    title: "I'm an investor",
    body: "Build your investment mandate and receive opportunities scored against it, wherever they come from.",
    points: ["Free to register", "Mandate-based matching", "First-hand deal notifications"],
    cta: "Build my mandate",
  },
  {
    href: "/register/business",
    icon: Building2,
    title: "I'm raising capital",
    body: "List your business, add investor-ready services, and reach a global network of vetted investors.",
    points: ["Tiered listings", "Personalised roadshows", "Success-fee aligned"],
    cta: "List my business",
  },
];

export default async function RegisterPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const t = await getTranslator(locale);
  return (
    <>
      <PageHeader title={t.tl("Which side of the deal are you on?")} subtitle={t.tl("Choose your path \u2014 it takes just a few minutes to get set up.")} />
      <section className="py-12 md:py-16">
        <div className="container-x grid gap-6 md:grid-cols-2">
          {translateContent(PATHS, t).map((p) => (
            <Link
              key={p.href}
              href={p.href}
              className="group relative flex flex-col overflow-hidden rounded-3xl border border-ink/[0.07] bg-white p-8 transition-all hover:border-brand-600/30 hover:shadow-[var(--shadow-lift)]"
            >
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-600 ring-1 ring-brand-100 transition-colors group-hover:bg-brand-600 group-hover:text-white">
                <p.icon className="h-6 w-6" />
              </span>
              <h2 className="mt-6 font-display text-2xl font-semibold text-navy-700">{p.title}</h2>
              <p className="mt-2 text-ink/60">{p.body}</p>
              <ul className="mt-6 space-y-2">
                {p.points.map((pt) => (
                  <li key={pt} className="flex items-center gap-2 text-sm text-ink/70">
                    <span className="h-1.5 w-1.5 rounded-full bg-navy-500" /> {pt}
                  </li>
                ))}
              </ul>
              <span className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-brand-600">
                {p.cta} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
        <p className="container-x mt-8 text-center text-sm text-ink/65">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-brand-700 hover:text-brand-800">
            {t.tl("Sign in")}
          </Link>
        </p>
      </section>
    </>
  );
}
