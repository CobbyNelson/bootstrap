import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { rateLimit } from "@/lib/rate-limit";

/**
 * Right of access + data portability (GDPR Art. 15 and Art. 20).
 *
 * Returns everything held about the signed-in user as machine-readable JSON,
 * served as a download. Self-service rather than an email workflow because the
 * one-month statutory deadline is easy to miss when a request lands in a shared
 * inbox — and because a user who can see their own data tends to trust it more.
 *
 * Scope is derived from the session ONLY. There is no user id parameter, so
 * there is no way to ask for someone else's export.
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  // Exports are expensive and reveal everything at once; a compromised session
  // should not be able to pull them on a loop.
  const limit = rateLimit(`export:${user.id}`, 3, 60 * 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Export already requested recently. Try again later." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } },
    );
  }

  const record = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      emailVerified: true,
      twoFactorOn: true,
      createdAt: true,
      updatedAt: true,
      // passwordHash is deliberately NOT selected. It is our security material,
      // not the user's personal data, and exporting it would be a liability.
      organization: {
        select: { id: true, type: true, legalName: true, country: true, region: true },
      },
      // KYC: status and metadata only. Identity-document contents and sanctions
      // screening internals stay out — they are our compliance records, and
      // re-emitting scanned ID through a download link would create exactly the
      // exposure the KYC process exists to prevent.
      kyc: {
        select: {
          id: true,
          status: true,
          accredited: true,
          legalName: true,
          country: true,
          createdAt: true,
          updatedAt: true,
        },
      },
      subscription: true,
      interests: { select: { id: true, slug: true, createdAt: true } },
      savedListings: { select: { id: true, slug: true, createdAt: true } },
      ndaSignatures: { select: { id: true, slug: true, createdAt: true } },
      commitments: true,
      paymentIntents: {
        select: {
          id: true,
          reference: true,
          provider: true,
          plan: true,
          amountLabel: true,
          status: true,
          testMode: true,
          createdAt: true,
        },
      },
      messages: { select: { id: true, body: true, createdAt: true } },
      notifications: { select: { id: true, title: true, body: true, createdAt: true } },
      uploads: {
        select: { id: true, storageKey: true, alt: true, bytes: true, createdAt: true },
      },
      articles: { select: { id: true, title: true, slug: true, status: true, createdAt: true } },
    },
  });

  if (!record) return NextResponse.json({ error: "Account not found." }, { status: 404 });

  const payload = {
    exportedAt: new Date().toISOString(),
    notice:
      "This file contains the personal data Assets & Capital Ltd holds about your account. " +
      "It excludes our own security material (such as password hashes) and records we must " +
      "retain for legal or anti-money-laundering purposes beyond your control.",
    account: record,
  };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="assets-and-capital-data-${user.id}.json"`,
      // An export must never sit in a shared cache.
      "Cache-Control": "no-store, private",
    },
  });
}
