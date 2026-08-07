"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { notify, notifyListingOwner } from "@/lib/notify";

export type ActionResult = { ok: boolean; error?: string; value?: boolean };

const NEEDS_AUTH = "Please sign in to continue.";

/**
 * NOTE: there is deliberately no client-callable "activate subscription" action.
 * Subscriptions are only activated by lib/payments-server after it verifies a
 * PaymentIntent it created (test mode) or a signed provider webhook (live).
 */

export async function cancelSubscription(): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: NEEDS_AUTH };
  try {
    await prisma.investorSubscription.updateMany({
      where: { userId: user.id },
      data: { active: false },
    });
    revalidatePath("/", "layout");
    return { ok: true, value: false };
  } catch (e) {
    console.error("cancelSubscription failed", e);
    return { ok: false, error: "We couldn't update your subscription." };
  }
}

/** Express interest in a business — requires an active subscription. */
export async function expressInterest(slug: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: NEEDS_AUTH };
  try {
    const sub = await prisma.investorSubscription.findUnique({ where: { userId: user.id } });
    if (!sub?.active) return { ok: false, error: "An investor subscription is required to express interest." };

    const existing = await prisma.listingInterest.findUnique({
      where: { userId_slug: { userId: user.id, slug } },
    });
    if (existing) {
      await prisma.listingInterest.delete({ where: { id: existing.id } });
      revalidatePath(`/marketplace/${slug}`);
      return { ok: true, value: false };
    }
    await prisma.listingInterest.create({ data: { userId: user.id, slug } });
    // The business hears about its own inbound. Awaited but never able to
    // throw, so a failed courtesy cannot undo a recorded expression of
    // interest — see lib/notify.ts.
    await notifyListingOwner(
      slug,
      "interest",
      "New investor interest",
      `${user.name || user.email} expressed interest in your listing.`,
    );
    revalidatePath(`/marketplace/${slug}`);
    return { ok: true, value: true };
  } catch (e) {
    console.error("expressInterest failed", e);
    return { ok: false, error: "We couldn't record your interest." };
  }
}

/** Sign the NDA for a business — unlocks its data room. */
export async function signNda(slug: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: NEEDS_AUTH };
  try {
    const before = await prisma.ndaSignature.findUnique({
      where: { userId_slug: { userId: user.id, slug } },
      select: { id: true },
    });
    await prisma.ndaSignature.upsert({
      where: { userId_slug: { userId: user.id, slug } },
      create: { userId: user.id, slug },
      update: {},
    });
    // Only on the first signature. The upsert is idempotent by design, so
    // without this check a re-submit would notify both parties again for
    // something that did not happen twice.
    if (!before) {
      await Promise.all([
        notify(user.id, "nda", "NDA signed", `Your data room access for ${slug.replace(/-/g, " ")} is open.`),
        notifyListingOwner(
          slug,
          "nda",
          "NDA signed",
          `${user.name || user.email} signed your NDA and can now open the data room.`,
        ),
      ]);
    }
    revalidatePath(`/marketplace/${slug}`);
    return { ok: true, value: true };
  } catch (e) {
    console.error("signNda failed", e);
    return { ok: false, error: "We couldn't record your signature." };
  }
}

/** Toggle a saved/shortlisted business. */
export async function toggleSaved(slug: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: NEEDS_AUTH };
  try {
    const existing = await prisma.savedListing.findUnique({
      where: { userId_slug: { userId: user.id, slug } },
    });
    if (existing) {
      await prisma.savedListing.delete({ where: { id: existing.id } });
      revalidatePath("/dashboard/saved");
      return { ok: true, value: false };
    }
    await prisma.savedListing.create({ data: { userId: user.id, slug } });
    revalidatePath("/dashboard/saved");
    return { ok: true, value: true };
  } catch (e) {
    console.error("toggleSaved failed", e);
    return { ok: false, error: "We couldn't update your saved list." };
  }
}
