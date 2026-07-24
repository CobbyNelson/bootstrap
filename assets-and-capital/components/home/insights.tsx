import Link from "next/link";
import { ArrowUpRight, Clock } from "lucide-react";
import { INSIGHTS } from "@/lib/content";
import { SectionHeading } from "@/components/ui/section-heading";
import { Reveal } from "@/components/ui/reveal";
import { Button } from "@/components/ui/button";

const GRADIENTS = [
  "from-brand-600 to-brand-900",
  "from-gold-500 to-gold-700",
  "from-ink to-ink-2",
];

export function Insights() {
  return (
    <section className="py-20 md:py-28">
      <div className="container-x">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <SectionHeading
            eyebrow="Latest insights"
            title="Intelligence for capital and opportunity"
            subtitle="Research, market views, and practical guides from our team."
          />
          <Button href="/insights" variant="outline" size="md" className="shrink-0">
            Read the journal
          </Button>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {INSIGHTS.map((post, i) => (
            <Reveal key={post.title} delay={i * 0.08}>
              <Link
                href="/insights"
                className="group flex h-full flex-col overflow-hidden rounded-3xl border border-ink/[0.07] bg-white transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-card)]"
              >
                <div className={`relative aspect-[16/10] bg-gradient-to-br ${GRADIENTS[i % 3]}`}>
                  <div className="grid-noise absolute inset-0 opacity-30" aria-hidden />
                  <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-ink backdrop-blur">
                    {post.category}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <h3 className="text-lg font-semibold leading-snug text-ink transition-colors group-hover:text-brand-700">
                    {post.title}
                  </h3>
                  <div className="mt-auto flex items-center justify-between pt-6 text-xs text-ink/50">
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" /> {post.readTime} · {post.date}
                    </span>
                    <ArrowUpRight className="h-4 w-4 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-brand-600" />
                  </div>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
