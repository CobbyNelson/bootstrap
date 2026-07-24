import type { Metadata } from "next";
import Link from "next/link";
import { Clock, ArrowUpRight } from "lucide-react";
import { INSIGHTS } from "@/lib/content";
import { PageHeader } from "@/components/layout/page-header";
import { Reveal } from "@/components/ui/reveal";

export const metadata: Metadata = {
  title: "Insights",
  description: "Research, market views, and practical guides for capital and opportunity.",
};

const ALL = [
  ...INSIGHTS,
  { title: "Structuring co-investments for the mid-market", category: "Deal Structuring", readTime: "7 min", date: "May 2026" },
  { title: "What LPs look for in a first-time fund", category: "Market Intelligence", readTime: "6 min", date: "May 2026" },
  { title: "ESG in emerging markets: signal, not checkbox", category: "ESG", readTime: "9 min", date: "Apr 2026" },
];

const GRADIENTS = ["from-brand-600 to-brand-900", "from-gold-500 to-gold-700", "from-ink to-ink-2"];

export default function InsightsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Insights"
        title="Intelligence for capital and opportunity"
        subtitle="Research, market views, and practical guides from the Assets & Capital team."
      />

      <section className="py-16 md:py-20">
        <div className="container-x grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {ALL.map((post, i) => (
            <Reveal key={post.title} delay={(i % 3) * 0.08}>
              <Link href="#" className="group flex h-full flex-col overflow-hidden rounded-3xl border border-ink/[0.07] bg-white transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-card)]">
                <div className={`relative aspect-[16/10] bg-gradient-to-br ${GRADIENTS[i % 3]}`}>
                  <div className="grid-noise absolute inset-0 opacity-30" aria-hidden />
                  <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-ink backdrop-blur">{post.category}</span>
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <h3 className="text-lg font-semibold leading-snug text-ink transition-colors group-hover:text-brand-700">{post.title}</h3>
                  <div className="mt-auto flex items-center justify-between pt-6 text-xs text-ink/50">
                    <span className="inline-flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {post.readTime} · {post.date}</span>
                    <ArrowUpRight className="h-4 w-4 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-brand-600" />
                  </div>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}
