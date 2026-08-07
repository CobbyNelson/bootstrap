"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { notify, notifyListingOwner } from "@/lib/notify";
import { getAccess } from "@/lib/entitlements-server";

export type CommitResult = { ok: boolean; error?: string };

/**
 * The investment transaction. A commitment can only be made by an investor who
 * is subscribed, has expressed interest and has signed the NDA — and who has
 * cleared KYC/accreditation. Every gate is enforced here, server-side.
 *
 * Allocation, countersignature and funds movement are operated by the platform
 * (admin) — an investor can only soft-commit or withdraw.
 */
export async function softCommit(slug: string, amountUsd: number, note?: string): Promise<CommitResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please sign in to continue." };

  if (!Number.isFinite(amountUsd) || amountUsd <= 0) {
    return { ok: false, error: "Enter a valid commitment amount." };
  }

  try {
    const access = await getAccess(slug);
    if (!access.subscribed) return { ok: false, error: "An investor subscription is required." };
    if (!access.interested) return { ok: false, error: "Express interest in this business first." };
    if (!access.ndaSigned) return { ok: false, error: "Sign the NDA before committing." };

    const kyc = await prisma.kycRecord.findUnique({ where: { userId: user.id } });
    if (kyc?.status !== "VERIFIED") {
      return { ok: false, error: "Complete identity verification (KYC) before committing capital." };
    }
    if (!kyc.accredited) {
      return { ok: false, error: "This opportunity is restricted to accredited investors." };
    }
    if (!kyc.sanctionsClear || kyc.pepMatch) {
      return { ok: false, error: "Your account is under compliance review. Our team will be in touch." };
    }

    await prisma.commitment.upsert({
      where: { userId_slug: { userId: user.id, slug } },
      create: { userId: user.id, slug, amountUsd: Math.round(amountUsd), note: note || null },
      update: { amountUsd: Math.round(amountUsd), note: note || null, status: "SOFT_COMMITTED" },
    });
    const usd = `$${Math.round(amountUsd).toLocaleString("en-US")}`;
    await Promise.all([
      notify(user.id, "commitment", "Commitment recorded", `${usd} soft-committed. Our team will confirm allocation.`),
      notifyListingOwner(slug, "commitment", "New commitment", `${user.name || user.email} soft-committed ${usd}.`),
    ]);
    revalidatePath(`/marketplace/${slug}`);
    return { ok: true };
  } catch (e) {
    console.error("softCommit failed", e);
    return { ok: false, error: "We couldn't record your commitment." };
  }
}

export async function withdrawCommitment(slug: string): Promise<CommitResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please sign in to continue." };
  try {
    await prisma.commitment.updateMany({
      where: { userId: user.id, slug },
      data: { status: "WITHDRAWN" },
    });
    revalidatePath(`/marketplace/${slug}`);
    return { ok: true };
  } catch (e) {
    console.error("withdrawCommitment failed", e);
    return { ok: false, error: "We couldn't withdraw your commitment." };
  }
}

const ADMIN_ROLES = new Set(["ADMIN", "SUPER_ADMIN", "STAFF"]);

/** Admin: move a commitment through allocation → agreement → signed → funded. */
export async function advanceCommitment(
  commitmentId: string,
  status: "ALLOCATED" | "AGREEMENT_SENT" | "SIGNED" | "FUNDED",
  allocatedUsd?: number
): Promise<CommitResult> {
  const user = await getCurrentUser();
  if (!user || !ADMIN_ROLES.has(user.role)) return { ok: false, error: "Not authorised." };
  try {
    const updated = await prisma.commitment.update({
      where: { id: commitmentId },
      data: {
        status,
        ...(allocatedUsd !== undefined ? { allocatedUsd: Math.round(allocatedUsd) } : {}),
        ...(status === "SIGNED" ? { signedAt: new Date() } : {}),
        ...(status === "FUNDED" ? { fundedAt: new Date() } : {}),
      },
      select: { userId: true, slug: true, amountUsd: true },
    });

    // The investor is told when the platform moves their money along. Every
    // stage after SOFT_COMMITTED is operated by staff, so without this the
    // investor's own commitment changes state with nothing to tell them.
    const STAGE: Record<string, string> = {
      ALLOCATED: "Your commitment has been allocated.",
      AGREEMENT_SENT: "Your agreement is ready to sign.",
      SIGNED: "Your agreement is countersigned.",
      FUNDED: "Your funds have been received. Thank you.",
    };
    await notify(updated.userId, "commitment", "Commitment update", STAGE[status]);
    if (status === "FUNDED") {
      await notifyListingOwner(
        updated.slug,
        "commitment",
        "Commitment funded",
        `$${updated.amountUsd.toLocaleString("en-US")} has been funded against your listing.`,
      );
    }
    revalidatePath("/admin");
    revalidatePath("/dashboard/pipeline");
    return { ok: true };
  } catch (e) {
    console.error("advanceCommitment failed", e);
    return { ok: false, error: "We couldn't update the commitment." };
  }
}
