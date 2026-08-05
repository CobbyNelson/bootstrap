import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { put, makeStorageKey, remove, mediaUrl } from "@/lib/media-store";
import {
  processImage,
  processThumb,
  probe,
  ACCEPTED_MIME,
  MAX_UPLOAD_BYTES,
  ImageTooComplex,
} from "@/lib/media-pipeline";

/**
 * Media library API.
 *
 * These endpoints authenticate themselves. middleware.ts only matches /admin
 * and /dashboard — /api is NOT in its matcher, so an API route that assumed the
 * middleware had already run would be wide open.
 *
 * Uploading is allowed for staff (library management) and for a business owner
 * attaching their own imagery. Deleting is staff-only: a business removing an
 * asset another page still references is a support ticket, not a feature.
 */

const STAFF = new Set(["ADMIN", "SUPER_ADMIN", "STAFF"]);

async function requireUser() {
  const user = await getCurrentUser();
  if (!user) return null;
  return user;
}

/* ------------------------------------------------------------------ list */

export async function GET(request: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  const folder = url.searchParams.get("folder")?.trim() ?? "";
  const take = Math.min(Number(url.searchParams.get("take") ?? 60), 200);

  // A business only ever sees its own uploads; staff see everything.
  const scope = STAFF.has(user.role)
    ? {}
    : { uploadedById: user.id };

  const assets = await prisma.mediaAsset.findMany({
    where: {
      ...scope,
      ...(folder ? { folder } : {}),
      ...(q
        ? {
            OR: [
              { originalName: { contains: q, mode: "insensitive" as const } },
              { alt: { contains: q, mode: "insensitive" as const } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take,
    select: {
      id: true, storageKey: true, thumbKey: true, originalName: true,
      alt: true, width: true, height: true, bytes: true, folder: true, createdAt: true,
    },
  });

  // Same scope as the assets themselves — an investor or business must not
  // learn the shape of the whole library from its folder names.
  const folders = await prisma.mediaAsset.findMany({
    where: { ...scope, folder: { not: null } },
    distinct: ["folder"],
    select: { folder: true },
    orderBy: { folder: "asc" },
  });

  return NextResponse.json({
    assets: assets.map((a) => ({
      ...a,
      url: mediaUrl(a.storageKey),
      thumbUrl: a.thumbKey ? mediaUrl(a.thumbKey) : mediaUrl(a.storageKey),
    })),
    folders: folders.map((f) => f.folder).filter(Boolean),
  });
}

/* ---------------------------------------------------------------- upload */

export async function POST(request: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Expected a file upload." }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file received." }, { status: 400 });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json(
      { error: `That file is over ${Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)}MB.` },
      { status: 413 }
    );
  }
  if (file.type && !ACCEPTED_MIME.includes(file.type)) {
    return NextResponse.json(
      { error: "Upload a JPEG, PNG, WebP, AVIF, HEIC or GIF." },
      { status: 415 }
    );
  }

  const input = Buffer.from(await file.arrayBuffer());

  // Trust the bytes, not the declared type — a mislabelled file otherwise
  // fails deep inside the encoder with an unhelpful message.
  const meta = await probe(input);
  if (!meta) {
    return NextResponse.json({ error: "That file is not a readable image." }, { status: 415 });
  }

  let processed;
  try {
    processed = await processImage(input);
  } catch (err) {
    if (err instanceof ImageTooComplex) {
      return NextResponse.json(
        { error: "That image can't be compressed under 100KB without ruining it. Try a smaller crop." },
        { status: 422 }
      );
    }
    console.error("[media] processing failed:", err);
    return NextResponse.json({ error: "That image could not be processed." }, { status: 500 });
  }

  const key = makeStorageKey(file.name);
  const thumbKey = key.replace(/\.webp$/, "-thumb.webp");

  await put(key, processed.data);
  try {
    await put(thumbKey, await processThumb(input));
  } catch {
    // A missing thumbnail degrades to using the full image in the grid; it is
    // not worth failing the upload over.
  }

  const alt = String(form.get("alt") ?? "").trim().slice(0, 300);
  const folder = String(form.get("folder") ?? "").trim().slice(0, 60) || null;
  // Only staff may attach an upload to an arbitrary listing — otherwise any
  // signed-in account could plant imagery on someone else's profile. A
  // business's own listing images go through /api/business/*, which derives
  // the listing from the session instead of trusting the form.
  const listingId = STAFF.has(user.role)
    ? String(form.get("listingId") ?? "").trim() || null
    : null;

  const asset = await prisma.mediaAsset.create({
    data: {
      storageKey: key,
      thumbKey,
      originalName: file.name.slice(0, 200),
      originalBytes: file.size,
      bytes: processed.bytes,
      width: processed.width,
      height: processed.height,
      quality: processed.quality,
      alt,
      folder,
      listingId,
      uploadedById: user.id,
    },
  });

  return NextResponse.json({
    ok: true,
    asset: {
      ...asset,
      url: mediaUrl(asset.storageKey),
      thumbUrl: mediaUrl(asset.thumbKey ?? asset.storageKey),
    },
    savedPercent: Math.round((1 - processed.bytes / file.size) * 100),
  });
}

/* ---------------------------------------------------------------- delete */

export async function DELETE(request: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  if (!STAFF.has(user.role)) {
    return NextResponse.json({ error: "Not permitted." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });

  const asset = await prisma.mediaAsset.findUnique({
    where: { id },
    include: { _count: { select: { articleCovers: true, listingHeroes: true } } },
  });
  if (!asset) return NextResponse.json({ error: "No such asset." }, { status: 404 });

  // Refuse while something still points at it. Deleting would leave an article
  // or listing rendering a broken image with no clue where it went.
  const uses = asset._count.articleCovers + asset._count.listingHeroes;
  if (uses > 0) {
    return NextResponse.json(
      { error: `Still used by ${uses} item${uses === 1 ? "" : "s"}. Replace it there first.` },
      { status: 409 }
    );
  }

  await prisma.mediaAsset.delete({ where: { id } });
  await remove(asset.storageKey);
  if (asset.thumbKey) await remove(asset.thumbKey);

  return NextResponse.json({ ok: true });
}
