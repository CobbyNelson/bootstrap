import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { mediaUrl } from "@/lib/media-store";
import { ArticleForm, type ArticleDraft } from "@/components/admin/article-form";

export const metadata: Metadata = { title: "Edit article" };
export const dynamic = "force-dynamic";

const BLANK: ArticleDraft = {
  title: "",
  category: "",
  type: "Market Intelligence",
  excerpt: "",
  bodyHtml: "",
  author: "",
  authorRole: "",
  featured: false,
  status: "DRAFT",
  coverId: null,
  coverUrl: null,
};

/**
 * The editor route. `/admin/insights/new` shares this page rather than having
 * its own — the form is identical, and the only difference is whether the first
 * save POSTs or PATCHes, which the form already decides from `id`.
 */
export default async function EditArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (id === "new") return <ArticleForm initial={BLANK} />;

  const article = await prisma.article.findUnique({
    where: { id },
    include: { cover: { select: { id: true, storageKey: true } } },
  });
  if (!article) notFound();

  return (
    <ArticleForm
      initial={{
        id: article.id,
        slug: article.slug,
        title: article.title,
        category: article.category,
        type: article.type,
        excerpt: article.excerpt,
        bodyHtml: article.bodyHtml,
        author: article.author,
        authorRole: article.authorRole,
        featured: article.featured,
        status: article.status,
        coverId: article.cover?.id ?? null,
        coverUrl: article.cover ? mediaUrl(article.cover.storageKey) : null,
      }}
    />
  );
}
