"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { notify } from "@/lib/notify";

export type KycResult = { ok: boolean; error?: string; status?: string };

/**
 * Investor compliance. Submitting starts verification; the outcome is set by
 * the provider callback (live) or by an admin (manual review) — never by the
 * investor. Screening seams:
 *   identity/KYC  → Sumsub / Onfido / Persona (webhook sets status)
 *   sanctions/PEP → ComplyAdvantage / Dow Jones watchlist screening
 */
export async function submitKyc(input: {
  legalName: string;
  country: string;
  accreditedClaim: boolean;
}): Promise<KycResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please sign in to continue." };
  if (!input.legalName?.trim()) return { ok: false, error: "Enter your full legal name." };
  if (!input.country?.trim()) return { ok: false, error: "Select your country." };

  try {
    const record = await prisma.kycRecord.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        legalName: input.legalName.trim(),
        country: input.country.trim(),
        status: "PENDING",
        // The investor's accreditation claim is recorded but NOT trusted —
        // it is confirmed during review before it grants anything.
        accredited: false,
        provider: process.env.KYC_PROVIDER || null,
      },
      update: {
        legalName: input.legalName.trim(),
        country: input.country.trim(),
        status: "PENDING",
      },
    });
    revalidatePath("/dashboard");
    return { ok: true, status: record.status };
  } catch (e) {
    console.error("submitKyc failed", e);
    return { ok: false, error: "We couldn't submit your verification." };
  }
}

const ADMIN_ROLES = new Set(["ADMIN", "SUPER_ADMIN", "STAFF"]);

/** Admin/compliance decision. */
export async function decideKyc(
  userId: string,
  decision: { status: "VERIFIED" | "REJECTED"; accredited?: boolean; sanctionsClear?: boolean; pepMatch?: boolean }
): Promise<KycResult> {
  const actor = await getCurrentUser();
  if (!actor || !ADMIN_ROLES.has(actor.role)) return { ok: false, error: "Not authorised." };
  try {
    await prisma.kycRecord.update({
      where: { userId },
      data: {
        status: decision.status,
        accredited: decision.accredited ?? false,
        sanctionsClear: decision.sanctionsClear ?? false,
        pepMatch: decision.pepMatch ?? false,
        reviewedAt: new Date(),
      },
    });
    await prisma.auditLog.create({
      data: {
        actorId: actor.id,
        action: `kyc.${decision.status.toLowerCase()}`,
        target: userId,
        metadata: decision,
      },
    });
    // The investor learns the outcome from their own portal rather than from
    // silence. Verification is the gate on committing capital, so a decision
    // nobody is told about strands the account it was meant to unblock.
    await notify(
      userId,
      "kyc",
      decision.status === "VERIFIED" ? "Verification approved" : "Verification declined",
      decision.status === "VERIFIED"
        ? "Your identity checks have cleared. You can now commit capital."
        : "We could not complete your checks. Our compliance team will be in touch.",
    );
    revalidatePath("/admin");
    revalidatePath("/dashboard/verification");
    return { ok: true, status: decision.status };
  } catch (e) {
    console.error("decideKyc failed", e);
    return { ok: false, error: "We couldn't record the decision." };
  }
}
