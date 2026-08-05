import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { slugify } from "@/lib/matching";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { getBusinessListing, getOrCreateBusinessListing } from "@/lib/business-listing";
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
 * A business's image gallery — the set behind the mini slider on its public
 * profile, one of which is the featured (hero) image.
 *
 * Every operation derives the listing from the SESSION and checks the asset
 * belongs to that listing before touching it. Nothing here accepts a listing
 * id from the client, which is what confines a business to its own images —
 * the scoping rule this endpoint exists to enforce.
 */

async function requireBusiness() {
  const user = await getCurrentUser();
  if (!user) return { error: NextResponse.json({ error: "Sign in first." }, { status: 401 }) };
  if (user.role !== "BUSINESS") {
    return { error: NextResponse.json({ error: "Only business accounts manage a gallery." }, { status: 403 }) };
  }
  return { user };
}

type GalleryImage = {
  id: string;
  src: string;
  thumb: string;
  alt: string;
  featured: boolean;
};

async function galleryFor(listingId: string, heroId: string | null): Promise<GalleryImage[]> {
  const assets = await prisma.mediaAsset.findMany({
    where: { listingId },
    orderBy: { createdAt: "desc" },
    select: { id: true, storageKey: true, thumbKey: true, alt: true },
  });
  // Featured first — it is slide one of the slider, per the product rule.
  return assets
    .map((a) => ({
      id: a.id,
      src: mediaUrl(a.storageKey),
      thumb: mediaUrl(a.thumbKey ?? a.storageKey),
      alt: a.alt,
      featured: a.id === heroId,
    }))
    .sort((a, b) => Number(b.featured) - Number(a.featured));
}

/* ------------------------------------------------------------------ list */

/**
 * The pages that render listing heroes are cached, so a gallery change has to
 * say so or a business would upload a new hero and keep seeing the old one
 * until the window expired — looking, from their side, like the upload failed.
 */
function revalidateHeroPages(title?: string) {
  revalidatePath("/");
  revalidatePath("/marketplace");
  if (title) revalidatePath(`/marketplace/${slugify(title)}`);
}

export async function GET() {
  const { user, error } = await requireBusiness();
  if (error) return error;

  const listing = await getBusinessListing(user);
  if (!listing) return NextResponse.json({ images: [] });

  return NextResponse.json({ images: await galleryFor(listing.id, listing.heroId) });
}

/* ---------------------------------------------------------------- upload */

export async function POST(request: Request) {
  const { user, error } = await requireBusiness();
  if (error) return error;

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
  if (!(await probe(input))) {
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
    console.error("[business/gallery] processing failed:", err);
    return NextResponse.json({ error: "That image could not be processed." }, { status: 500 });
  }

  const listing = await getOrCreateBusinessListing(user, {
    title: String(form.get("title") ?? "").trim(),
  });

  const key = makeStorageKey(file.name);
  const thumbKey = key.replace(/\.webp$/, "-thumb.webp");
  await put(key, processed.data);
  try {
    await put(thumbKey, await processThumb(input));
  } catch {
    /* slider falls back to the full image */
  }

  const orgId = (
    await prisma.user.findUnique({ where: { id: user.id }, select: { orgId: true } })
  )?.orgId;

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
      alt: `${listing.title} gallery image`,
      folder: "listings",
      listingId: listing.id,
      orgId,
      uploadedById: user.id,
    },
  });

  // First image of an empty gallery becomes the featured one automatically —
  // a gallery with images but no featured slide is a state the slider and the
  // marketplace card would both have to special-case.
  const feature = String(form.get("feature") ?? "") === "1" || !listing.heroId;
  if (feature) {
    await prisma.listing.update({ where: { id: listing.id }, data: { heroId: asset.id } });
  }

  revalidateHeroPages(listing?.title);

  return NextResponse.json({
    ok: true,
    savedPercent: Math.round((1 - processed.bytes / file.size) * 100),
    images: await galleryFor(listing.id, feature ? asset.id : listing.heroId),
  });
}

/* ----------------------------------------------------------- set featured */

export async function PATCH(request: Request) {
  const { user, error } = await requireBusiness();
  if (error) return error;

  const body = await request.json().catch(() => null);
  const assetId = body?.assetId ? String(body.assetId) : "";
  if (!assetId) return NextResponse.json({ error: "Missing image." }, { status: 400 });

  const listing = await getBusinessListing(user);
  if (!listing) return NextResponse.json({ error: "No listing yet." }, { status: 404 });

  // Ownership check: the asset must already belong to THIS listing.
  const asset = await prisma.mediaAsset.findUnique({
    where: { id: assetId },
    select: { listingId: true },
  });
  if (!asset || asset.listingId !== listing.id) {
    return NextResponse.json({ error: "That image is not in your gallery." }, { status: 404 });
  }

  await prisma.listing.update({ where: { id: listing.id }, data: { heroId: assetId } });
  revalidateHeroPages(listing?.title);
  return NextResponse.json({ ok: true, images: await galleryFor(listing.id, assetId) });
}

/* ---------------------------------------------------------------- remove */

export async function DELETE(request: Request) {
  const { user, error } = await requireBusiness();
  if (error) return error;

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing image." }, { status: 400 });

  const listing = await getBusinessListing(user);
  if (!listing) return NextResponse.json({ error: "No listing yet." }, { status: 404 });

  const asset = await prisma.mediaAsset.findUnique({
    where: { id },
    select: { id: true, listingId: true, storageKey: true, thumbKey: true },
  });
  if (!asset || asset.listingId !== listing.id) {
    return NextResponse.json({ error: "That image is not in your gallery." }, { status: 404 });
  }

  // Deleting the featured image promotes the newest remaining one rather than
  // leaving the profile suddenly bare — reverting to the sector stand-in only
  // when the gallery is genuinely empty.
  let nextHeroId: string | null = listing.heroId;
  if (listing.heroId === asset.id) {
    const next = await prisma.mediaAsset.findFirst({
      where: { listingId: listing.id, NOT: { id: asset.id } },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    });
    nextHeroId = next?.id ?? null;
    await prisma.listing.update({ where: { id: listing.id }, data: { heroId: nextHeroId } });
  }

  await prisma.mediaAsset.delete({ where: { id: asset.id } });
  await remove(asset.storageKey);
  if (asset.thumbKey) await remove(asset.thumbKey);

  revalidateHeroPages(listing?.title);

  return NextResponse.json({ ok: true, images: await galleryFor(listing.id, nextHeroId) });
}
