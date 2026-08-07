import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { sanitizeArticleHtml, htmlToText, estimateReadTime } from "@/lib/sanitize";

/**
 * Article CRUD for the admin editor.
 *
 * Self-authenticating: middleware.ts matches /admin and /dashboard but NOT
 * /api, so an endpoint that assumed it had already run would be open to anyone.
 *
 * Every write funnels its body through sanitizeArticleHtml, so the column can
 * never hold markup the allowlist would have rejected.
 */

const STAFF = new Set(["ADMIN", "SUPER_ADMIN", "STAFF"]);
const TYPES = [
  "Market Intelligence", "Country Report", "Investment Guide",
  "White Paper", "Case Study", "Interview", "ESG",
];

async function requireStaff() {
  const user = await getCurrentUser();
  if (!user || !STAFF.has(user.role)) return null;
  return user;
}

function slugify(s: string) {
  return s.toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/**
 * Publishing an article has to reach the sitemap.
 *
 * /sitemap.xml is statically prerendered — it appears as `○` in the build — so
 * without this it is a snapshot of whatever the Article table held at deploy
 * time. An article published from the admin would be live at its own URL and
 * absent from the sitemap until somebody happened to deploy, which is the same
 * disagreement between the sitemap and reality that made it advertise eight
 * 404s in the first place, just pointing the other way.
 *
 * /insights is dynamically rendered and needs no help, but it is revalidated
 * too so the two cannot drift if that ever changes.
 */
function revalidatePublicInsights() {
  revalidatePath("/sitemap.xml");
  revalidatePath("/insights");
}

export async function GET() {
  const user = await requireStaff();
  if (!user) return NextResponse.json({ error: "Not permitted." }, { status: 403 });

  const articles = await prisma.article.findMany({
    orderBy: [{ status: "asc" }, { publishedAt: "desc" }, { updatedAt: "desc" }],
    select: {
      id: true, slug: true, title: true, type: true, status: true,
      featured: true, publishedAt: true, updatedAt: true, author: true,
      cover: { select: { storageKey: true, thumbKey: true } },
    },
  });

  return NextResponse.json({ articles });
}

export async function POST(request: Request) {
  const user = await requireStaff();
  if (!user) return NextResponse.json({ error: "Not permitted." }, { status: 403 });

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Malformed request." }, { status: 400 });

  const title = String(body.title ?? "").trim().slice(0, 200);
  if (!title) return NextResponse.json({ error: "A title is required." }, { status: 400 });

  const type = String(body.type ?? "");
  if (!TYPES.includes(type)) {
    return NextResponse.json({ error: "Choose a valid article type." }, { status: 400 });
  }

  // Uniqueness by suffix rather than rejection — a writer creating "Kenya
  // report" twice should get a second draft, not an error they cannot act on.
  const base = slugify(body.slug ? String(body.slug) : title) || "article";
  let slug = base;
  for (let n = 2; await prisma.article.findUnique({ where: { slug } }); n++) {
    slug = `${base}-${n}`;
  }

  const bodyHtml = sanitizeArticleHtml(String(body.bodyHtml ?? ""));

  const article = await prisma.article.create({
    data: {
      slug,
      title,
      type,
      category: String(body.category ?? "").slice(0, 60),
      excerpt: String(body.excerpt ?? "").slice(0, 400) || htmlToText(bodyHtml).slice(0, 200),
      bodyHtml,
      readTime: estimateReadTime(bodyHtml),
      author: String(body.author ?? user.name ?? "Research Desk").slice(0, 80),
      authorRole: String(body.authorRole ?? "").slice(0, 80),
      featured: Boolean(body.featured),
      status: body.status === "PUBLISHED" ? "PUBLISHED" : "DRAFT",
      publishedAt: body.status === "PUBLISHED" ? new Date() : null,
      coverId: body.coverId ? String(body.coverId) : null,
      createdById: user.id,
    },
  });

  revalidatePublicInsights();
  return NextResponse.json({ ok: true, article });
}

export async function PATCH(request: Request) {
  const user = await requireStaff();
  if (!user) return NextResponse.json({ error: "Not permitted." }, { status: 403 });

  const body = await request.json().catch(() => null);
  const id = body?.id ? String(body.id) : "";
  if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });

  const existing = await prisma.article.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "No such article." }, { status: 404 });

  if (body.type !== undefined && !TYPES.includes(String(body.type))) {
    return NextResponse.json({ error: "Choose a valid article type." }, { status: 400 });
  }

  const bodyHtml =
    body.bodyHtml !== undefined ? sanitizeArticleHtml(String(body.bodyHtml)) : undefined;

  // Only one article can be the featured one; clear the rest when this is set.
  if (body.featured === true) {
    await prisma.article.updateMany({
      where: { featured: true, NOT: { id } },
      data: { featured: false },
    });
  }

  const publishing = body.status === "PUBLISHED" && existing.status !== "PUBLISHED";

  const article = await prisma.article.update({
    where: { id },
    data: {
      ...(body.title !== undefined ? { title: String(body.title).slice(0, 200) } : {}),
      ...(body.slug !== undefined ? { slug: slugify(String(body.slug)) } : {}),
      ...(body.type !== undefined ? { type: String(body.type) } : {}),
      ...(body.category !== undefined ? { category: String(body.category).slice(0, 60) } : {}),
      ...(body.excerpt !== undefined ? { excerpt: String(body.excerpt).slice(0, 400) } : {}),
      ...(bodyHtml !== undefined ? { bodyHtml, readTime: estimateReadTime(bodyHtml) } : {}),
      ...(body.author !== undefined ? { author: String(body.author).slice(0, 80) } : {}),
      ...(body.authorRole !== undefined ? { authorRole: String(body.authorRole).slice(0, 80) } : {}),
      ...(body.featured !== undefined ? { featured: Boolean(body.featured) } : {}),
      ...(body.coverId !== undefined ? { coverId: body.coverId ? String(body.coverId) : null } : {}),
      ...(body.status !== undefined
        ? {
            status: body.status === "PUBLISHED" ? "PUBLISHED" : "DRAFT",
            // Stamp publishedAt on the FIRST publish only — re-publishing an
            // edit should not reorder the index or change the displayed date.
            ...(publishing ? { publishedAt: new Date() } : {}),
          }
        : {}),
    },
  });

  revalidatePublicInsights();
  return NextResponse.json({ ok: true, article });
}

export async function DELETE(request: Request) {
  const user = await requireStaff();
  if (!user) return NextResponse.json({ error: "Not permitted." }, { status: 403 });

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });

  await prisma.article.delete({ where: { id } }).catch(() => null);
  revalidatePublicInsights();
  return NextResponse.json({ ok: true });
}
