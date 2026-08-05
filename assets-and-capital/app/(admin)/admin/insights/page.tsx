import type { Metadata } from "next";
import Link from "next/link";
import { Plus, FileText } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { mediaUrl } from "@/lib/media-store";

export const metadata: Metadata = { title: "Insights" };
export const dynamic = "force-dynamic";

export default async function AdminInsightsPage() {
  const articles = await prisma.article.findMany({
    orderBy: [{ status: "asc" }, { publishedAt: "desc" }, { updatedAt: "desc" }],
    select: {
      id: true, slug: true, title: true, type: true, status: true, featured: true,
      author: true, publishedAt: true, updatedAt: true,
      cover: { select: { thumbKey: true, storageKey: true } },
    },
  });

  const drafts = articles.filter((a) => a.status === "DRAFT").length;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-navy-700">Insights</h1>
          <p className="mt-1 text-sm text-ink/60">
            {articles.length} article{articles.length === 1 ? "" : "s"}
            {drafts > 0 && ` · ${drafts} in draft`}
          </p>
        </div>
        <Link
          href="/admin/insights/new"
          className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" /> New article
        </Link>
      </div>

      {articles.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-ink/15 py-16 text-center">
          <FileText className="mx-auto h-8 w-8 text-ink/20" />
          <p className="mt-3 text-sm text-ink/60">No articles yet.</p>
        </div>
      ) : (
        <ul className="mt-6 divide-y divide-ink/[0.07] overflow-hidden rounded-xl border border-ink/[0.08] bg-white">
          {articles.map((a) => (
            <li key={a.id}>
              <Link href={`/admin/insights/${a.id}`} className="flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-paper-2/60">
                <div className="h-12 w-16 shrink-0 overflow-hidden rounded-md bg-paper-2">
                  {a.cover && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={mediaUrl(a.cover.thumbKey ?? a.cover.storageKey)}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-semibold text-ink">{a.title}</span>
                    {a.featured && (
                      <span className="shrink-0 rounded-full bg-brand-50 px-2 py-0.5 text-[0.62rem] font-semibold text-brand-700">
                        Featured
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 truncate text-xs text-ink/50">
                    {a.type} · {a.author}
                    {a.publishedAt && ` · ${new Date(a.publishedAt).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}`}
                  </p>
                </div>

                <span
                  className={
                    a.status === "PUBLISHED"
                      ? "shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-[0.65rem] font-semibold text-emerald-700"
                      : "shrink-0 rounded-full bg-amber-50 px-2.5 py-1 text-[0.65rem] font-semibold text-amber-700"
                  }
                >
                  {a.status === "PUBLISHED" ? "Live" : "Draft"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
