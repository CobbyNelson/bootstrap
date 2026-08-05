import { prisma } from "./prisma";
import { mediaUrl } from "./media-store";
import { ARTICLE_COVERS } from "./imagery";

/**
 * Published-article reads for the public site.
 *
 * Server-only: everything here touches Prisma. The insights portal is a client
 * component, so pages fetch through these and pass plain DTOs down as props
 * rather than importing the query into the browser bundle.
 *
 * Cover resolution has one rule, applied here so no template has to repeat it:
 * an article's own cover wins; otherwise the image mapped to its type; and if
 * that type has no mapping, null and the card keeps its gradient.
 */

export interface PublicArticle {
  slug: string;
  title: string;
  category: string;
  type: string;
  excerpt: string;
  bodyHtml: string;
  readTime: string;
  author: string;
  authorRole: string;
  featured: boolean;
  /** Display string, e.g. "Jul 2026". */
  date: string;
  publishedAt: string | null;
  cover: { src: string; alt: string } | null;
}

type Row = {
  slug: string; title: string; category: string; type: string; excerpt: string;
  bodyHtml: string; readTime: string; author: string; authorRole: string;
  featured: boolean; publishedAt: Date | null;
  cover: { storageKey: string; alt: string } | null;
};

function toPublic(a: Row): PublicArticle {
  return {
    slug: a.slug,
    title: a.title,
    category: a.category,
    type: a.type,
    excerpt: a.excerpt,
    bodyHtml: a.bodyHtml,
    readTime: a.readTime,
    author: a.author,
    authorRole: a.authorRole,
    featured: a.featured,
    date: a.publishedAt
      ? a.publishedAt.toLocaleDateString("en-GB", { month: "short", year: "numeric" })
      : "",
    publishedAt: a.publishedAt?.toISOString() ?? null,
    cover: a.cover
      ? { src: mediaUrl(a.cover.storageKey), alt: a.cover.alt || a.title }
      : ARTICLE_COVERS[a.type] ?? null,
  };
}

const SELECT = {
  slug: true, title: true, category: true, type: true, excerpt: true,
  bodyHtml: true, readTime: true, author: true, authorRole: true,
  featured: true, publishedAt: true,
  cover: { select: { storageKey: true, alt: true } },
} as const;

/** Newest first. Drafts are never returned. */
export async function listPublishedArticles(limit = 100): Promise<PublicArticle[]> {
  const rows = await prisma.article.findMany({
    where: { status: "PUBLISHED" },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    take: limit,
    select: SELECT,
  });
  return rows.map(toPublic);
}

export async function getPublishedArticle(slug: string): Promise<PublicArticle | null> {
  const row = await prisma.article.findFirst({
    where: { slug, status: "PUBLISHED" },
    select: SELECT,
  });
  return row ? toPublic(row) : null;
}

/** Slugs for generateStaticParams. */
export async function publishedSlugs(): Promise<string[]> {
  const rows = await prisma.article.findMany({
    where: { status: "PUBLISHED" },
    select: { slug: true },
  });
  return rows.map((r) => r.slug);
}

/**
 * The home-page teasers.
 *
 * Previously a separate hand-maintained list in lib/content.ts that did not
 * match the articles, used different category labels, and linked every card to
 * the index instead of the piece. Deriving them from the same table removes all
 * three problems at once.
 */
export async function listTeasers(limit = 3): Promise<PublicArticle[]> {
  return listPublishedArticles(limit);
}
