import { prisma } from "./prisma";
import { mediaUrl } from "./media-store";
import { slugify } from "./matching";

/**
 * Business-supplied hero images for the public marketplace, keyed by the same
 * slug the static sample data uses.
 *
 * The marketplace list/cards still come from lib/marketplace-data.ts; the
 * database contributes only the images businesses have uploaded for
 * themselves. Joining on slugify(Listing.title) is what lets a database row
 * override the card of its static counterpart without migrating the whole
 * catalogue in one go (see lib/business-listing.ts).
 *
 * Server-only — pages fetch this and pass the plain map into the client
 * components that render cards.
 */
export type HeroMap = Record<string, { src: string; alt: string }>;

/**
 * Every public read in this module degrades to empty when the database cannot
 * answer, rather than throwing.
 *
 * These run inside prerendered pages, and prerendering happens during
 * `next build` — where a database is not guaranteed. CI proved it the hard
 * way: the homepage awaited one of these with no POSTGRES_PRISMA_URL set and
 * the whole build died at "Generating static pages", on /en, after compiling
 * cleanly. The same property protects production: a database blip during ISR
 * revalidation now yields a page with the static content and without the
 * database-contributed extras, instead of no page.
 *
 * The empty fallbacks are honest renders, not lies: pages composed from these
 * treat absence as "nothing to show", which is also what a fresh database
 * contains.
 */
export async function getListingHeroes(): Promise<HeroMap> {
  try {
    const rows = await prisma.listing.findMany({
      where: { heroId: { not: null } },
      select: {
        title: true,
        hero: { select: { storageKey: true, alt: true } },
      },
    });

    const map: HeroMap = {};
    for (const row of rows) {
      if (!row.hero) continue;
      map[slugify(row.title)] = {
        src: mediaUrl(row.hero.storageKey),
        alt: row.hero.alt || `${row.title} featured image`,
      };
    }
    return map;
  } catch {
    return {};
  }
}

/**
 * The public gallery for one listing page, featured image first.
 *
 * Keyed by the marketplace slug through the same slugify(title) join as the
 * hero map above. Empty when no database listing matches — the detail page
 * then shows no slider, exactly as before galleries existed.
 */
export async function getListingGallery(
  slug: string
): Promise<{ src: string; alt: string }[]> {
  try {
    const listings = await prisma.listing.findMany({
      where: { media: { some: {} } },
      select: {
        title: true,
        heroId: true,
        media: {
          orderBy: { createdAt: "desc" },
          select: { id: true, storageKey: true, alt: true },
        },
      },
    });

    const listing = listings.find((l) => slugify(l.title) === slug);
    if (!listing) return [];

    return listing.media
      .map((m) => ({
        src: mediaUrl(m.storageKey),
        alt: m.alt,
        featured: m.id === listing.heroId,
      }))
      .sort((a, b) => Number(b.featured) - Number(a.featured))
      .map(({ src, alt }) => ({ src, alt }));
  } catch {
    return [];
  }
}
