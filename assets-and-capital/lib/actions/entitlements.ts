"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export type ActionResult = { ok: boolean; error?: string; value?: boolean };

const NEEDS_AUTH = "Please sign in to continue.";

/** Activate a subscription. Called after a confirmed payment. */
export async function activateSubscription(plan: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: NEEDS_AUTH };
  try {
    await prisma.investorSubscription.upsert({
      where: { userId: user.id },
      create: { userId: user.id, plan, active: true },
      update: { plan, active: true },
    });
    revalidatePath("/", "layout");
    return { ok: true, value: true };
  } catch (e) {
    console.error("activateSubscription failed", e);
    return { ok: false, error: "We couldn't activate your subscription." };
  }
}

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
    await prisma.ndaSignature.upsert({
      where: { userId_slug: { userId: user.id, slug } },
      create: { userId: user.id, slug },
      update: {},
    });
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
