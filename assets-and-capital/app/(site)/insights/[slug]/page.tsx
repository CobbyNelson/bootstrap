import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock, ArrowLeft, ArrowUpRight } from "lucide-react";
import { getArticleBySlug, allArticleSlugs, ARTICLES } from "@/lib/insights-data";
import { SITE } from "@/lib/content";
import { cn } from "@/lib/utils";

const GRADIENT: Record<string, string> = {
  "Market Intelligence": "from-brand-600 to-brand-900",
  "Country Report": "from-ink to-ink-2",
  "Investment Guide": "from-navy-500 to-navy-700",
  "White Paper": "from-brand-700 to-ink",
  "Case Study": "from-emerald-600 to-emerald-800",
  Interview: "from-navy-600 to-brand-800",
  ESG: "from-emerald-500 to-emerald-700",
};

export function generateStaticParams() {
  return allArticleSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const a = getArticleBySlug(slug);
  if (!a) return { title: "Insight" };
  return {
    title: a.title,
    description: a.excerpt,
    openGraph: { type: "article", title: a.title, description: a.excerpt, authors: [a.author], publishedTime: a.date },
    twitter: { card: "summary_large_image", title: a.title, description: a.excerpt },
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const a = getArticleBySlug(slug);
  if (!a) notFound();

  const related = ARTICLES.filter((x) => x.slug !== a.slug && x.type === a.type).slice(0, 3);
  const more = (related.length ? related : ARTICLES.filter((x) => x.slug !== a.slug)).slice(0, 3);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: a.title,
    description: a.excerpt,
    datePublished: a.date,
    author: { "@type": "Person", name: a.author },
    publisher: { "@type": "Organization", name: SITE.legalName },
    articleSection: a.category,
    mainEntityOfPage: `https://${SITE.domain}/insights/${a.slug}`,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* hero */}
      <section className={cn("relative overflow-hidden bg-gradient-to-br pt-32 pb-14 text-white md:pt-40 md:pb-20", GRADIENT[a.type] ?? "from-brand-600 to-brand-900")}>
        <div className="grid-noise pointer-events-none absolute inset-0 opacity-25" aria-hidden />
        <div className="container-x relative max-w-3xl">
          <Link href="/insights" className="inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Market insights
          </Link>
          <span className="mt-6 inline-block rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">{a.type} · {a.category}</span>
          <h1 className="mt-4 font-display text-3xl font-semibold leading-tight sm:text-4xl md:text-[2.7rem]">{a.title}</h1>
          <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/70">
            <span className="font-medium text-white">{a.author}</span>
            <span className="text-white/40">·</span>
            <span>{a.authorRole}</span>
            <span className="text-white/40">·</span>
            <span className="inline-flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {a.readTime}</span>
            <span className="text-white/40">·</span>
            <span>{a.date}</span>
          </div>
        </div>
      </section>

      {/* body */}
      <section className="py-14 md:py-16">
        <article className="container-x max-w-3xl">
          <p className="text-xl leading-relaxed text-ink/80">{a.body[0].p}</p>
          <div className="mt-8 space-y-8">
            {a.body.slice(1).map((s, i) => (
              <div key={i}>
                {s.h && <h2 className="font-display text-xl font-semibold text-ink md:text-2xl">{s.h}</h2>}
                <p className="mt-3 leading-relaxed text-ink/70">{s.p}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 flex items-center gap-4 rounded-3xl border border-ink/[0.07] bg-paper-2/50 p-6">
            <span className="grid h-12 w-12 flex-none place-items-center rounded-full bg-gradient-to-br from-ink to-ink-2 text-sm font-semibold text-white">
              {a.author.split(" ").slice(0, 2).map((w) => w[0]).join("")}
            </span>
            <div>
              <p className="font-medium text-ink">{a.author}</p>
              <p className="text-sm text-ink/55">{a.authorRole}, Assets &amp; Capital</p>
            </div>
          </div>
        </article>
      </section>

      {/* related */}
      <section className="border-t border-ink/[0.06] py-14 md:py-16">
        <div className="container-x">
          <h2 className="mb-8 font-display text-2xl font-semibold text-ink">More insights</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {more.map((r) => (
              <Link key={r.slug} href={`/insights/${r.slug}`} className="group flex h-full flex-col overflow-hidden rounded-3xl border border-ink/[0.07] bg-white transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-card)]">
                <div className={cn("relative aspect-[16/10] bg-gradient-to-br", GRADIENT[r.type] ?? "from-brand-600 to-brand-900")}>
                  <div className="grid-noise absolute inset-0 opacity-30" aria-hidden />
                  <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-ink backdrop-blur">{r.type}</span>
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <h3 className="text-lg font-semibold leading-snug text-ink transition-colors group-hover:text-brand-700">{r.title}</h3>
                  <div className="mt-auto flex items-center justify-between pt-6 text-xs text-ink/50">
                    <span className="inline-flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {r.readTime}</span>
                    <ArrowUpRight className="h-4 w-4 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-brand-600" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

export const dynamicParams = false;
