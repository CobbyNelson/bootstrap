import type { Metadata } from "next";
import Link from "next/link";
import { Plus, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Answers to common questions about investing and raising capital on Assets & Capital.",
};

const GROUPS = [
  {
    title: "For investors",
    items: [
      { q: "How does mandate matching work?", a: "You build an investment mandate — objectives, ticket size, sectors, geographies, risk and instrument preferences. Our engine scores every vetted opportunity against 15 weighted criteria and surfaces the strongest fits with an explainable match score." },
      { q: "Are opportunities screened before I see them?", a: "Yes. Every business is screened and verified — registration, financials, licensing and references — before it reaches the marketplace. Each listing carries a verification badge and a business readiness score." },
      { q: "Is there a fee to invest?", a: "Browsing and mandate matching are free for investors. Success and advisory fees apply on completed transactions and premium services, disclosed up front." },
      { q: "How do I run due diligence?", a: "Verified investors get access to secure, permissioned data rooms with document watermarking and a full activity audit trail, plus messaging and scheduled calls with the business." },
    ],
  },
  {
    title: "For businesses",
    items: [
      { q: "How do I list my business?", a: "Complete the guided intake — your business profile, financials, the raise and supporting documents. Our team reviews and verifies your listing, then it becomes discoverable to mandate-matched investors." },
      { q: "Who sees my information?", a: "Your teaser is visible to verified investors; sensitive materials sit behind an NDA-gated data room you control. You approve who gets access and can revoke it at any time." },
      { q: "What does a listing cost?", a: "Listings are tiered (Standard to Platinum) with a success-fee model on capital raised. See the pricing page for the full breakdown." },
      { q: "How long does a raise take?", a: "It varies by sector, stage and readiness, but a disciplined, verified listing with a complete data room typically moves through the pipeline far faster than an unstructured process." },
    ],
  },
  {
    title: "Security & compliance",
    items: [
      { q: "How is my data protected?", a: "Data is encrypted in transit and at rest, access is role-based, and every data-room action is logged. We run KYC/AML and sanctions screening on all parties." },
      { q: "Do you support digital signatures?", a: "Yes — NDAs, term sheets and agreements can be signed electronically with a tamper-evident certificate of completion and audit trail." },
    ],
  },
];

export default function FaqPage() {
  return (
    <>
      <PageHeader title="Questions, answered" subtitle="Everything you need to know about investing and raising capital on Assets & Capital." />
      <section className="py-16 md:py-20">
        <div className="container-x grid gap-12 lg:grid-cols-[1fr_320px]">
          <div className="space-y-10">
            {GROUPS.map((g) => (
              <div key={g.title}>
                <h2 className="font-display text-xl font-bold text-navy-700">{g.title}</h2>
                <div className="mt-4 divide-y divide-ink/[0.07] rounded-2xl border border-ink/[0.07] bg-white">
                  {g.items.map((item) => (
                    <details key={item.q} className="group px-5">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-left font-medium text-ink [&::-webkit-details-marker]:hidden">
                        {item.q}
                        <span className="grid h-7 w-7 flex-none place-items-center rounded-full border border-ink/12 text-ink/65 transition-transform group-open:rotate-45 group-open:border-brand-300 group-open:text-brand-600">
                          <Plus className="h-4 w-4" />
                        </span>
                      </summary>
                      <p className="pb-5 pr-10 text-sm leading-relaxed text-ink/60">{item.a}</p>
                    </details>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <aside className="lg:sticky lg:top-28 lg:self-start">
            <div className="rounded-3xl border border-ink/[0.07] bg-navy-800 p-7 text-white">
              <h3 className="font-display text-lg font-bold text-white">Still have questions?</h3>
              <p className="mt-2 text-sm text-white/70">Our team is happy to help you get set up, whether you&apos;re deploying capital or raising it.</p>
              <Link href="/contact" className="mt-5 inline-flex items-center gap-2 rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">
                Contact us <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
