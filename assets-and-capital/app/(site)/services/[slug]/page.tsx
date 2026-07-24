import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Check, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";

type ServiceContent = {
  eyebrow: string;
  title: string;
  subtitle: string;
  audience: "investor" | "business";
  intro: string;
  features: string[];
  cta: { label: string; href: string };
};

const SERVICES: Record<string, ServiceContent> = {
  roadshows: {
    eyebrow: "Investor & business service",
    title: "Specialised roadshows",
    subtitle: "Meet multiple pre-screened opportunities — or reach targeted investors — in curated sessions.",
    audience: "investor",
    intro:
      "Our roadshows put the right people in the same room. For investors, we assemble a slate of pre-screened, mandate-matched opportunities. For businesses, we secure meetings with investors whose mandate fits your raise — organised end to end by our team.",
    features: ["Pre-screened, mandate-matched participants", "Curated agendas built around your criteria", "In-person and virtual formats", "Full logistics handled by our team", "Follow-up and introductions after the event"],
    cta: { label: "Request a roadshow", href: "/contact" },
  },
  "market-access": {
    eyebrow: "Investor service",
    title: "Market access support",
    subtitle: "Connect with suppliers, buyers, and partners to grow beyond the initial investment.",
    audience: "investor",
    intro:
      "Deploying capital is the beginning, not the end. Our on-the-ground team helps you build the local relationships — suppliers, buyers, distribution partners — that turn an investment into a thriving business.",
    features: ["Local partner introductions", "Supplier and buyer connections", "Market-entry guidance", "Regulatory and operational context", "Ongoing relationship support"],
    cta: { label: "Talk to our team", href: "/contact" },
  },
  "business-plan": {
    eyebrow: "Business service",
    title: "Business plan writing",
    subtitle: "Investor-ready plans that frame your opportunity with clarity and credibility.",
    audience: "business",
    intro:
      "The right narrative earns the meeting. Our team crafts a rigorous, investor-ready business plan that positions your opportunity, substantiates your ask, and anticipates the questions diligence will bring.",
    features: ["Market and competitive analysis", "Clear articulation of the ask and use of funds", "Growth strategy and milestones", "Risk assessment and mitigation", "Investor-ready formatting and design"],
    cta: { label: "Get started", href: "/register/business" },
  },
  "financial-modelling": {
    eyebrow: "Business service",
    title: "Financial modelling",
    subtitle: "Defensible, assumption-driven models and statements that stand up to diligence.",
    audience: "business",
    intro:
      "Numbers win trust. We build transparent, assumption-driven financial models and statements — the kind investors can interrogate and believe — so your raise rests on a credible foundation.",
    features: ["Three-statement financial models", "Scenario and sensitivity analysis", "Valuation support", "Unit economics and cohort analysis", "Clear, auditable assumptions"],
    cta: { label: "Get started", href: "/register/business" },
  },
  teaser: {
    eyebrow: "Business service",
    title: "Teaser & pitch preparation",
    subtitle: "A compelling teaser and pitch that earns a second meeting.",
    audience: "business",
    intro:
      "First impressions decide who reads on. We prepare a sharp, professional teaser and pitch deck that captures your opportunity at a glance and compels the right investors to lean in.",
    features: ["Concise, high-impact teaser", "Full investor pitch deck", "Compelling narrative and design", "Key metrics presented clearly", "Aligned to what investors read first"],
    cta: { label: "Get started", href: "/register/business" },
  },
};

export function generateStaticParams() {
  return Object.keys(SERVICES).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const s = SERVICES[slug];
  if (!s) return { title: "Service" };
  return { title: s.title, description: s.subtitle };
}

export default async function ServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const s = SERVICES[slug];
  if (!s) notFound();

  return (
    <>
      <PageHeader eyebrow={s.eyebrow} title={s.title} subtitle={s.subtitle}>
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
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-ink/40">What&apos;s included</p>
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
