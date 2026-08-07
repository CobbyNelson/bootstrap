import "server-only";
import { prisma } from "@/lib/prisma";

/**
 * Writing the notifications the bell was already claiming to have.
 *
 * The Notification model has existed since the first migration and nothing in
 * the codebase ever created a row. The admin header lit a red dot over it
 * permanently and the investor notification centre rendered nine invented
 * items from a `SEED` constant, so the table's emptiness was never visible.
 *
 * Wiring the READ alone would have swapped nine fake notifications for a page
 * that is empty forever, which is honest and useless. So notifications are
 * emitted here at the points where something genuinely happens to an account:
 * a commitment recorded, an NDA signed, verification decided, a payment
 * started or settled.
 *
 * Nothing here throws. A notification is a courtesy attached to an action that
 * already succeeded — a failed insert must never turn a recorded commitment
 * into an error the investor sees.
 */

export type NotifyKind =
  | "commitment"
  | "nda"
  | "interest"
  | "kyc"
  | "payment"
  | "approval"
  | "announcement";

export async function notify(
  userId: string,
  kind: NotifyKind,
  title: string,
  body?: string,
): Promise<void> {
  try {
    await prisma.notification.create({ data: { userId, type: kind, title, body: body ?? null } });
  } catch (e) {
    console.error("notify failed", kind, e);
  }
}

/**
 * Tell the business that somebody moved on their listing.
 *
 * Interest, NDAs and commitments are recorded against the marketplace slug,
 * while the business account is reached through Listing.title → slugify. That
 * join is done here so the callers — which are investor-side actions — do not
 * each have to know how a slug finds its owner.
 *
 * Silent when the slug belongs to sample marketplace content with no account
 * behind it, which today is most of them.
 */
export async function notifyListingOwner(
  slug: string,
  kind: NotifyKind,
  title: string,
  body?: string,
): Promise<void> {
  try {
    const { slugify } = await import("@/lib/matching");
    const listings = await prisma.listing.findMany({
      select: { title: true, business: { select: { organization: { select: { users: { select: { id: true } } } } } } },
    });

    const owner = listings.find((l) => slugify(l.title) === slug);
    if (!owner) return;

    const userIds = owner.business.organization.users.map((u) => u.id);
    if (userIds.length === 0) return;

    await prisma.notification.createMany({
      data: userIds.map((userId) => ({ userId, type: kind, title, body: body ?? null })),
    });
  } catch (e) {
    console.error("notifyListingOwner failed", kind, e);
  }
}
