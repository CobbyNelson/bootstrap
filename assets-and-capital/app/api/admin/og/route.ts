import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { ogSettingKey, OG_DEFAULT_KEY } from "@/lib/og";

/**
 * Which uploaded image a page shows when it is shared.
 *
 * The media library could already accept an upload; nothing could say "use that
 * one for /pricing". So the only images the site could ever share were the ones
 * a page happened to own — and for most pages, that was none at all.
 *
 * SUPER ADMIN ONLY, not staff. A share image is the first thing anyone sees of
 * a link before they click it, which makes it closer to the logo than to a page
 * edit.
 *
 * Writes revalidate the affected page, because metadata is baked at build time
 * for prerendered routes — the same trap the sitemap was in. Without this the
 * choice would take effect at the next deploy and appear to have done nothing.
 */
const SUPER = new Set(["SUPER_ADMIN"]);

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !SUPER.has(user.role)) {
    return NextResponse.json({ error: "Not permitted." }, { status: 403 });
  }
  const rows = await prisma.setting
    .findMany({ where: { key: { startsWith: "og:" } }, select: { key: true, value: true } })
    .catch(() => []);
  return NextResponse.json({ overrides: rows });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !SUPER.has(user.role)) {
    return NextResponse.json({ error: "Not permitted." }, { status: 403 });
  }

  let body: { path?: string; mediaId?: string | null } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  // A path, or the site-wide default when none is given.
  const path = body.path?.trim();
  if (path && !path.startsWith("/")) {
    return NextResponse.json({ error: "Path must start with a slash." }, { status: 400 });
  }
  const key = path ? ogSettingKey(path) : OG_DEFAULT_KEY;

  // Clearing is setting it to nothing, which is a real choice — it puts the
  // page back on the library photograph rather than leaving a dangling id.
  if (!body.mediaId) {
    await prisma.setting.deleteMany({ where: { key } });
  } else {
    const asset = await prisma.mediaAsset.findUnique({
      where: { id: body.mediaId },
      select: { id: true, width: true, height: true },
    });
    if (!asset) return NextResponse.json({ error: "That image no longer exists." }, { status: 400 });

    // Not a hard requirement — a small image still shares, just badly — so this
    // is reported rather than refused, and the caller decides.
    const tooSmall = asset.width < 600 || asset.height < 315;

    await prisma.setting.upsert({
      where: { key },
      create: { key, value: { mediaId: asset.id } },
      update: { value: { mediaId: asset.id } },
    });

    if (tooSmall) {
      revalidatePath(path ?? "/", "layout");
      return NextResponse.json({
        ok: true,
        warning: `That image is ${asset.width}x${asset.height}. Sharing cards are 1200x630, so it will be upscaled.`,
      });
    }
  }

  // "layout" so the whole subtree re-renders: the site layout carries the
  // default image, and a per-page override changes a page beneath it.
  revalidatePath(path ?? "/", "layout");
  return NextResponse.json({ ok: true });
}
