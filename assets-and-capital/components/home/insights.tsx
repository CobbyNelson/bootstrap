import Link from "next/link";
import { LibraryImage } from "@/components/ui/library-image";

import { Clock } from "lucide-react";
import type { PublicArticle } from "@/lib/articles";
import { SectionHeading, CircleArrow } from "@/components/ui/section-heading";
import { Reveal } from "@/components/ui/reveal";
import { Button } from "@/components/ui/button";

const GRADIENTS = [
  "from-brand-600 to-brand-900",
  "from-navy-500 to-navy-700",
  "from-ink to-ink-2",
];

export function Insights({ articles }: { articles: PublicArticle[] }) {
  if (!articles.length) return null;

  return (
    <section className="py-14 md:py-20">
      <div className="container-x">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <SectionHeading
            title="Intelligence for capital and opportunity"
            subtitle="Research, market views, and practical guides from our team."
          />
          <Button href="/insights" variant="primary" size="md" className="shrink-0">
            Read the journal
          </Button>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {articles.map((post, i) => (
            <Reveal key={post.slug} delay={i * 0.08}>
              <Link
                href={`/insights/${post.slug}`}
                className="group flex h-full flex-col overflow-hidden rounded-3xl border border-ink/[0.07] bg-white transition-all hover:shadow-[var(--shadow-card)]"
              >
                <div className={`relative aspect-[16/10] overflow-hidden bg-gradient-to-br ${GRADIENTS[i % 3]}`}>
                  {post.cover && (
                    <>
                      <LibraryImage image={post.cover}
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      />
                      <div
                        className="absolute inset-0 bg-gradient-to-br from-ink/55 via-ink/20 to-transparent"
                        aria-hidden
                      />
                    </>
                  )}
                  <div className="grid-noise absolute inset-0 opacity-30" aria-hidden />
                  <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-[0.68rem] kicker text-ink backdrop-blur">
                    {post.type}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <h3 className="text-lg font-semibold leading-snug text-ink transition-colors group-hover:text-brand-700">
                    {post.title}
                  </h3>
                  <div className="mt-auto flex items-center justify-between pt-6">
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-600">
                      <Clock className="h-3.5 w-3.5" /> {post.readTime} · {post.date}
                    </span>
                    <CircleArrow tone="brand" size="sm" />
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
