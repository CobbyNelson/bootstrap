"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Clock, ArrowUpRight, ArrowRight } from "lucide-react";
import { CATEGORIES } from "@/lib/insights-data";
import type { PublicArticle } from "@/lib/articles";
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

function Cover({
  type,
  cover,
  className,
}: {
  type: string;
  cover: PublicArticle["cover"];
  className?: string;
}) {
  return (
    <div className={cn("relative overflow-hidden bg-gradient-to-br", GRADIENT[type] ?? "from-brand-600 to-brand-900", className)}>
      {/* The gradient stays underneath rather than being replaced: it is what
          shows for a type with no cover, and it is what the eye sees while the
          image is still decoding. */}
      {cover && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={cover.src}
            alt={cover.alt}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover"
          />
          {/* Holds the category chip legible over whatever the photo does in
              that corner. */}
          <div
            className="absolute inset-0 bg-gradient-to-br from-ink/55 via-ink/20 to-transparent"
            aria-hidden
          />
        </>
      )}
      <div className="grid-noise absolute inset-0 opacity-30" aria-hidden />
      <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-ink backdrop-blur">{type}</span>
    </div>
  );
}

export function InsightsPortal({ articles }: { articles: PublicArticle[] }) {
  const [cat, setCat] = useState<(typeof CATEGORIES)[number]>("All");

  const featured = articles.find((a) => a.featured) ?? articles[0];

  const list = useMemo(() => {
    if (!featured) return [];
    const rest = articles.filter((a) => a.slug !== featured.slug);
    return cat === "All" ? rest : rest.filter((a) => a.type === cat);
  }, [cat, articles, featured]);

  // Nothing published yet — every article is a draft, or the table is empty.
  // The portal used to assume ARTICLES[0] existed, which is fine for a constant
  // and a crash for a database.
  if (!featured) {
    return (
      <p className="rounded-2xl border border-dashed border-ink/15 py-16 text-center text-sm text-ink/55">
        No insights published yet.
      </p>
    );
  }

  return (
    <div className="space-y-10">
      {/* featured */}
      <Link
        href={`/insights/${featured.slug}`}
        className="group grid overflow-hidden rounded-3xl border border-ink/[0.07] bg-white transition-all hover:shadow-[var(--shadow-card)] lg:grid-cols-2"
      >
        <Cover type={featured.type} cover={featured.cover} className="aspect-[16/10] lg:aspect-auto" />
        <div className="flex flex-col justify-center p-8 md:p-10">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-700">Featured · {featured.category}</span>
          <h2 className="mt-3 font-display text-2xl font-semibold leading-tight text-navy-700 group-hover:text-brand-700 md:text-3xl">{featured.title}</h2>
          <p className="mt-3 leading-relaxed text-ink/60">{featured.excerpt}</p>
          <div className="mt-6 flex items-center gap-3 text-sm text-ink/65">
            <span className="font-medium text-ink/70">{featured.author}</span>
            <span>·</span>
            <span className="inline-flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {featured.readTime}</span>
            <span>·</span>
            <span>{featured.date}</span>
          </div>
          <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600">
            Read article <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </span>
        </div>
      </Link>

      {/* filter */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={cn(
              "rounded-[var(--radius-button)] border px-3.5 py-1.5 text-sm font-medium transition-colors",
              cat === c ? "border-brand-600 bg-brand-50 text-brand-700" : "border-ink/12 text-ink/60 hover:border-ink/25"
            )}
          >
            {c}
          </button>
        ))}
      </div>

      {/* grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {list.map((a) => (
          <Link
            key={a.slug}
            href={`/insights/${a.slug}`}
            className="group flex h-full flex-col overflow-hidden rounded-3xl border border-ink/[0.07] bg-white transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-card)]"
          >
            <Cover type={a.type} cover={a.cover} className="aspect-[16/10]" />
            <div className="flex flex-1 flex-col p-6">
              <h3 className="text-lg font-semibold leading-snug text-ink transition-colors group-hover:text-brand-700">{a.title}</h3>
              <p className="mt-2 line-clamp-2 text-sm text-ink/65">{a.excerpt}</p>
              <div className="mt-auto flex items-center justify-between pt-6 text-xs text-ink/65">
                <span className="inline-flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {a.readTime} · {a.date}</span>
                <ArrowUpRight className="h-4 w-4 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-brand-600" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
