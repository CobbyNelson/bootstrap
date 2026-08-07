import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { destroySession } from "@/lib/session";
import { rateLimit } from "@/lib/rate-limit";

/**
 * Right to erasure (GDPR Art. 17).
 *
 * Not a raw DELETE. Art. 17(3)(b) preserves records we are legally required to
 * keep — anti-money-laundering rules oblige a financial intermediary to retain
 * KYC and transaction records for years after a relationship ends, and honouring
 * a deletion request by destroying them would breach a different law. So this
 * ANONYMISES: identifying fields are replaced, the login is destroyed, and the
 * rows that must survive survive with no way back to a person.
 *
 * The distinction is stated to the user rather than hidden, because "we deleted
 * everything" would be a lie and the one thing a regulator checks is whether
 * the privacy notice matches what the system actually does.
 */

/** Staff cannot self-delete: it would orphan audit trails and authored content. */
const UNDELETABLE_ROLES = new Set(["ADMIN", "SUPER_ADMIN", "STAFF"]);

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const limit = rateLimit(`account-delete:${user.id}`, 5, 60 * 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many attempts. Try again later." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } },
    );
  }

  if (UNDELETABLE_ROLES.has(user.role)) {
    return NextResponse.json(
      {
        error:
          "Staff accounts cannot be closed from here. Contact the platform administrator.",
      },
      { status: 403 },
    );
  }

  // Re-authenticate. Erasure is irreversible, so a hijacked session or an
  // unattended laptop must not be enough to trigger it.
  let password = "";
  try {
    const body = await req.json();
    password = typeof body?.password === "string" ? body.password : "";
  } catch {
    return NextResponse.json({ error: "Password required." }, { status: 400 });
  }

  const record = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, passwordHash: true },
  });
  if (!record?.passwordHash || !(await bcrypt.compare(password, record.passwordHash))) {
    return NextResponse.json({ error: "That password is not correct." }, { status: 401 });
  }

  const anonEmail = `deleted-${record.id}@deleted.invalid`;

  await prisma.$transaction(async (tx) => {
    // Content and preferences: no legal basis to keep, so genuinely deleted.
    await tx.notification.deleteMany({ where: { userId: record.id } });
    await tx.savedListing.deleteMany({ where: { userId: record.id } });
    await tx.listingInterest.deleteMany({ where: { userId: record.id } });
    await tx.message.updateMany({
      where: { senderId: record.id },
      // Threads stay coherent for the other participant; the words are gone.
      data: { body: "[message removed at the sender's request]" },
    });

    // KYC: status retained under AML obligations, identifying details cleared.
    await tx.kycRecord.updateMany({
      where: { userId: record.id },
      data: { legalName: null, reference: null },
    });

    // The account itself: identity removed, row retained so financial records
    // that reference it stay referentially intact.
    await tx.user.update({
      where: { id: record.id },
      data: {
        email: anonEmail,
        name: "Deleted user",
        passwordHash: null,
        twoFactorOn: false,
        emailVerified: null,
        // Inside the same transaction as the anonymisation, so a closed
        // account cannot still be signed in somewhere else. destroySession
        // below only clears the cookie in THIS browser; the token is
        // self-contained and would otherwise keep working elsewhere for the
        // rest of its seven days — on an account whose owner has just asked to
        // be erased.
        tokenVersion: { increment: 1 },
      },
    });

    // A deletion is itself something we must be able to evidence.
    await tx.auditLog.create({
      data: {
        actorId: null, // deliberately not linked back to the erased person
        action: "account.erased",
        target: record.id,
        metadata: { at: new Date().toISOString(), method: "self-service" },
      },
    });
  });

  await destroySession();

  return NextResponse.json({
    ok: true,
    message:
      "Your account has been closed and your personal details removed. " +
      "Transaction and compliance records are retained in anonymised form where " +
      "law requires it.",
  });
}
