import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/json-ld";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock, ArrowLeft, ArrowUpRight } from "lucide-react";
import { getPublishedArticle, publishedSlugs, listPublishedArticles } from "@/lib/articles";
import { SITE } from "@/lib/content";
import { cn } from "@/lib/utils";
import { getTranslator } from "@/lib/i18n/store";
import { translateContent } from "@/lib/i18n/translate-content";
import type { Locale } from "@/lib/i18n/config";
import { formatDateShort } from "@/lib/dates";
import { ogImageFor, ogUrl } from "@/lib/og";

const GRADIENT: Record<string, string> = {
 "Market Intelligence": "from-brand-600 to-brand-900",
 "Country Report": "from-ink to-ink-2",
 "Investment Guide": "from-navy-500 to-navy-700",
 "White Paper": "from-brand-700 to-ink",
 "Case Study": "from-emerald-600 to-emerald-800",
 Interview: "from-navy-600 to-brand-800",
 ESG: "from-emerald-500 to-emerald-700",
};

export async function generateStaticParams() {
 return (await publishedSlugs()).map((slug) => ({ slug }));
}

// Articles are editable from the admin at any time, so a page cached from build
// would keep serving yesterday's copy. Rendering on demand is what makes
// "publish" mean published.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
 const { slug } = await params;
 const a = await getPublishedArticle(slug);
 if (!a) return { title: "Insight" };
 return {
 title: a.title,
 description: a.excerpt,
 // The article's own cover when staff have uploaded one, so a shared link shows
 // the piece rather than the site's stock hero. ogImageFor falls back through
 // the admin override to a library photograph.
 openGraph: {
  type: "article",
  title: a.title,
  description: a.excerpt,
  authors: [a.author],
  publishedTime: a.date,
  url: ogUrl(`/insights/${slug}`),
  images: [await ogImageFor(`/insights/${slug}`, a.cover)],
 },
 twitter: {
  card: "summary_large_image",
  title: a.title,
  description: a.excerpt,
  images: [(await ogImageFor(`/insights/${slug}`, a.cover)).url],
 },
 };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string; locale: Locale }> }) {
 const { locale, slug } = await params;
  const t = await getTranslator(locale);
 const a = await getPublishedArticle(slug);
 if (!a) notFound();

 const all = await listPublishedArticles();
 const related = all.filter((x) => x.slug !== a.slug && x.type === a.type).slice(0, 3);
 const more = (related.length ? related : all.filter((x) => x.slug !== a.slug)).slice(0, 3);

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
 <JsonLd data={jsonLd} />
 {/* hero */}
 <section className={cn("relative overflow-hidden bg-gradient-to-br pt-32 pb-14 text-white md:pt-40 md:pb-20", GRADIENT[a.type] ?? "from-brand-600 to-brand-900")}>
 <div className="grid-noise pointer-events-none absolute inset-0 opacity-25" aria-hidden />
 <div className="container-x relative max-w-3xl">
 <Link href="/insights" className="inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-white">
 <ArrowLeft className="h-4 w-4" /> {t.tl("Market insights")}
 </Link>
 <span className="mt-6 inline-block rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">{a.type} · {a.category}</span>
 {/* text-white explicitly: the base layer in globals.css colours every
 h1–h6 navy-700, which beats the section's inherited white and left
 this heading at 2.92:1 on the crimson hero — under the 3:1 floor
 for large text. */}
 <h1 className="mt-4 font-display text-3xl font-semibold leading-tight text-white sm:text-4xl md:text-[2.7rem]">{a.title}</h1>
 <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/70">
 <span className="font-medium text-white">{a.author}</span>
 <span className="text-white/65">·</span>
 <span>{a.authorRole}</span>
 <span className="text-white/65">·</span>
 <span className="inline-flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {a.readTime}</span>
 <span className="text-white/65">·</span>
 <span>{formatDateShort(a.publishedAt ?? a.date, locale)}</span>
 </div>
 </div>
 </section>

 {/* body */}
 <section className="py-14 md:py-16">
 <article className="container-x max-w-3xl">
 <p className="text-xl leading-relaxed text-ink/80">{a.excerpt}</p>

 {/* The body is editor HTML that was run through the allowlist in
 lib/sanitize.ts BEFORE it was stored, so the column cannot hold
 anything the allowlist would reject. That is what makes rendering
 it directly acceptable — see the note there on sanitising at write
 time rather than at read time. */}
 <div
 className="article-body mt-8"
 dangerouslySetInnerHTML={{ __html: a.bodyHtml }}
 />

 <div className="mt-12 flex items-center gap-4 rounded-3xl border border-ink/[0.07] bg-paper-2/50 p-6">
 <span className="grid h-12 w-12 flex-none place-items-center rounded-[var(--radius-button)] bg-ink text-sm font-semibold text-white">
 {a.author.split(" ").slice(0, 2).map((w) => w[0]).join("")}
 </span>
 <div>
 <p className="font-medium text-ink">{a.author}</p>
 <p className="text-sm text-ink/65">{t.tl("{role}, Assets & Capital").replace("{role}", a.authorRole)}</p>
 </div>
 </div>
 </article>
 </section>

 {/* related */}
 <section className="border-t border-ink/[0.06] py-14 md:py-16">
 <div className="container-x">
 <h2 className="mb-8 font-display text-2xl font-semibold text-navy-700">{t.tl("More insights")}</h2>
 <div className="grid gap-6 md:grid-cols-3">
 {more.map((r) => (
 <Link key={r.slug} href={`/insights/${r.slug}`} className="group flex h-full flex-col overflow-hidden rounded-3xl border border-ink/[0.07] bg-white transition-all hover:shadow-[var(--shadow-card)]">
 <div className={cn("relative aspect-[16/10] overflow-hidden bg-gradient-to-br", GRADIENT[r.type] ?? "from-brand-600 to-brand-900")}>
 {r.cover && (
 <>
 {/* eslint-disable-next-line @next/next/no-img-element */}
 <img
 src={r.cover.src}
 alt={r.cover.alt}
 loading="lazy"
 className="absolute inset-0 h-full w-full object-cover"
 />
 <div className="absolute inset-0 bg-gradient-to-br from-ink/55 via-ink/20 to-transparent" aria-hidden />
 </>
 )}
 <div className="grid-noise absolute inset-0 opacity-30" aria-hidden />
 <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-ink backdrop-blur">{r.type}</span>
 </div>
 <div className="flex flex-1 flex-col p-6">
 <h3 className="text-lg font-semibold leading-snug text-ink transition-colors group-hover:text-brand-700">{r.title}</h3>
 <div className="mt-auto flex items-center justify-between pt-6 text-xs text-ink/65">
 <span className="inline-flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {r.readTime}</span>
 <ArrowUpRight className="h-4 w-4 transition-all group-hover:translate-x-0.5 group-hover:text-brand-600" />
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

// TRUE, deliberately. generateStaticParams only knows the slugs that existed at
// build time; with dynamicParams false, anything published from the admin
// afterwards would 404 until the next deploy — which defeats the point of an
// editor.
export const dynamicParams = true;
