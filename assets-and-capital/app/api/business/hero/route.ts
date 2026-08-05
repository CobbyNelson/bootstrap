import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { getOrCreateBusinessListing } from "@/lib/business-listing";
import { put, makeStorageKey, mediaUrl } from "@/lib/media-store";
import {
  processImage,
  processThumb,
  probe,
  ACCEPTED_MIME,
  MAX_UPLOAD_BYTES,
  ImageTooComplex,
} from "@/lib/media-pipeline";

/**
 * A business's own featured image.
 *
 * Separate from the staff media endpoint on purpose: this one derives the
 * TARGET from the session (the caller's own listing, created lazily on first
 * upload) rather than accepting an id, so a business can never point an upload
 * at someone else's profile. Same pipeline, same 100KB WebP guarantee.
 *
 * Self-authenticating — middleware.ts does not match /api.
 */

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  if (user.role !== "BUSINESS") {
    return NextResponse.json(
      { error: "Only business accounts can set a listing image." },
      { status: 403 }
    );
  }

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
    console.error("[business/hero] processing failed:", err);
    return NextResponse.json({ error: "That image could not be processed." }, { status: 500 });
  }

  // `title` is only honoured when the listing does not exist yet — the intake
  // wizard passes the company name so a first upload during registration
  // creates the listing under the right name.
  const title = String(form.get("title") ?? "").trim();
  const listing = await getOrCreateBusinessListing(user, { title });

  const key = makeStorageKey(file.name);
  const thumbKey = key.replace(/\.webp$/, "-thumb.webp");
  await put(key, processed.data);
  try {
    await put(thumbKey, await processThumb(input));
  } catch {
    /* grid falls back to the full image */
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
      alt: `${listing.title} featured image`,
      folder: "listings",
      listingId: listing.id,
      orgId,
      uploadedById: user.id,
    },
  });

  // The previous hero stays in the library rather than being deleted: it may
  // be referenced elsewhere, and "put the old one back" should stay possible.
  await prisma.listing.update({
    where: { id: listing.id },
    data: { heroId: asset.id },
  });

  return NextResponse.json({
    ok: true,
    hero: { src: mediaUrl(asset.storageKey), alt: asset.alt },
    bytes: processed.bytes,
    savedPercent: Math.round((1 - processed.bytes / file.size) * 100),
  });
}

/** Remove the custom hero — the card reverts to sector imagery. */
export async function DELETE() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  if (user.role !== "BUSINESS") {
    return NextResponse.json({ error: "Not permitted." }, { status: 403 });
  }

  const listing = await prisma.user
    .findUnique({
      where: { id: user.id },
      select: {
        organization: {
          select: { business: { select: { listings: { select: { id: true }, take: 1 } } } },
        },
      },
    })
    .then((u) => u?.organization?.business?.listings[0]);

  if (listing) {
    await prisma.listing.update({ where: { id: listing.id }, data: { heroId: null } });
  }
  return NextResponse.json({ ok: true });
}
