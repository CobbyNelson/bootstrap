import { prisma } from "./prisma";
import { mediaUrl } from "./media-store";

/**
 * The bridge between a signed-in business user and "their listing".
 *
 * The marketplace still renders from the in-repo sample data, keyed by
 * slugified name, while uploads and heroes live in the database. The join is
 * therefore Listing.title → slugify(title) → sample slug. When the sample data
 * is eventually migrated into the Listing table, this file is where the
 * indirection collapses.
 *
 * Rows are created LAZILY, on the first action that needs them (a hero upload).
 * Nothing today creates Organization/BusinessProfile/Listing rows at signup, so
 * requiring them to pre-exist would make the feature dead on arrival.
 */

/**
 * The demo business account maps to Accra FinPay because
 * app/(app)/dashboard/business/page.tsx hard-codes exactly that persona.
 * A real signup passes its own company name from the intake and never
 * touches this constant.
 */
const DEMO_LISTING_TITLE = "Accra FinPay";

export interface BusinessListing {
  id: string;
  title: string;
  heroId: string | null;
  hero: { src: string; alt: string } | null;
}

type SessionUser = { id: string; email: string; name: string | null; role: string };

function toDto(l: {
  id: string;
  title: string;
  heroId: string | null;
  hero: { storageKey: string; alt: string } | null;
}): BusinessListing {
  return {
    id: l.id,
    title: l.title,
    heroId: l.heroId,
    hero: l.hero
      ? { src: mediaUrl(l.hero.storageKey), alt: l.hero.alt || `${l.title} featured image` }
      : null,
  };
}

const LISTING_SELECT = {
  id: true,
  title: true,
  heroId: true,
  hero: { select: { storageKey: true, alt: true } },
} as const;

/** The listing this user owns, or null — never creates anything. */
export async function getBusinessListing(user: SessionUser): Promise<BusinessListing | null> {
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      organization: {
        select: { business: { select: { listings: { select: LISTING_SELECT, take: 1 } } } },
      },
    },
  });
  const listing = dbUser?.organization?.business?.listings[0];
  return listing ? toDto(listing) : null;
}

/**
 * The listing this user owns, created on first use.
 *
 * `title` matters only at creation time (the intake passes the company name);
 * an existing listing keeps its title so a retried request cannot rename it.
 */
export async function getOrCreateBusinessListing(
  user: SessionUser,
  opts: { title?: string } = {}
): Promise<BusinessListing> {
  const existing = await getBusinessListing(user);
  if (existing) return existing;

  const title = (opts.title ?? "").trim().slice(0, 120) || DEMO_LISTING_TITLE;

  // One transaction: a half-created chain (org without profile, profile
  // without listing) would strand the account in a state no UI can see or fix.
  const listing = await prisma.$transaction(async (tx) => {
    let orgId = (
      await tx.user.findUnique({ where: { id: user.id }, select: { orgId: true } })
    )?.orgId;

    if (!orgId) {
      const org = await tx.organization.create({
        data: { type: "BUSINESS", legalName: title },
        select: { id: true },
      });
      orgId = org.id;
      await tx.user.update({ where: { id: user.id }, data: { orgId } });
    }

    let profile = await tx.businessProfile.findUnique({
      where: { orgId },
      select: { id: true, listings: { select: LISTING_SELECT, take: 1 } },
    });
    if (!profile) {
      profile = {
        id: (await tx.businessProfile.create({ data: { orgId }, select: { id: true } })).id,
        listings: [],
      };
    }
    if (profile.listings[0]) return profile.listings[0];

    return tx.listing.create({
      data: { businessId: profile.id, title, status: "LIVE" },
      select: LISTING_SELECT,
    });
  });

  return toDto(listing);
}

/* ─────────────────────────── gallery ────────────────────────────────────── */

export interface GalleryImage {
  id: string;
  src: string;
  thumb: string;
  alt: string;
  featured: boolean;
}

/**
 * The signed-in business's own gallery, featured image first — it is slide one
 * wherever the gallery is shown, which is the product rule the ordering
 * encodes. Used by the dashboard manager; the public equivalent (keyed by
 * marketplace slug) lives in lib/listing-heroes.ts.
 */
export async function getBusinessGallery(user: SessionUser): Promise<GalleryImage[]> {
  const listing = await getBusinessListing(user);
  if (!listing) return [];

  const assets = await prisma.mediaAsset.findMany({
    where: { listingId: listing.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, storageKey: true, thumbKey: true, alt: true },
  });

  return assets
    .map((a) => ({
      id: a.id,
      src: mediaUrl(a.storageKey),
      thumb: mediaUrl(a.thumbKey ?? a.storageKey),
      alt: a.alt,
      featured: a.id === listing.heroId,
    }))
    .sort((a, b) => Number(b.featured) - Number(a.featured));
}
