/**
 * One-time import of the hardcoded ARTICLES array into the database.
 *
 * Idempotent on slug, so it is safe to re-run: an article already imported is
 * skipped rather than duplicated or silently overwritten (overwriting would
 * discard edits made in the admin editor since the last run).
 *
 *   npx tsx --env-file=.env scripts/import-articles.ts
 */
import { PrismaClient } from "@prisma/client";
import { ARTICLES } from "../lib/insights-data";
import { sanitizeArticleHtml, estimateReadTime } from "../lib/sanitize";

const prisma = new PrismaClient();

/** `{ h?, p }[]` → HTML the editor can round-trip. */
function blocksToHtml(body: { h?: string; p: string }[]): string {
  return body
    .map((b) => (b.h ? `<h2>${escapeHtml(b.h)}</h2><p>${escapeHtml(b.p)}</p>` : `<p>${escapeHtml(b.p)}</p>`))
    .join("\n");
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** "Jul 2026" → a Date, so the index can order by something real. */
function parseDisplayDate(s: string): Date {
  const parsed = new Date(`1 ${s}`);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

async function main() {
  let created = 0;
  let skipped = 0;

  for (const a of ARTICLES) {
    const exists = await prisma.article.findUnique({ where: { slug: a.slug } });
    if (exists) {
      skipped++;
      continue;
    }

    const bodyHtml = sanitizeArticleHtml(blocksToHtml(a.body));

    await prisma.article.create({
      data: {
        slug: a.slug,
        title: a.title,
        category: a.category ?? "",
        type: a.type,
        excerpt: a.excerpt,
        bodyHtml,
        readTime: a.readTime || estimateReadTime(bodyHtml),
        author: a.author,
        authorRole: a.authorRole ?? "",
        featured: Boolean(a.featured),
        status: "PUBLISHED",
        publishedAt: parseDisplayDate(a.date),
      },
    });
    created++;
  }

  console.log(`imported ${created}, already present ${skipped}`);

  const featured = await prisma.article.count({ where: { featured: true } });
  if (featured > 1) {
    console.warn(`⚠ ${featured} articles are flagged featured — the portal shows only the first.`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
