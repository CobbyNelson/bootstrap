import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { LOCALES } from "@/lib/i18n/config";

/**
 * Decide one item in the approvals queue.
 *
 * ADMIN only. Verifying an investor and publishing a listing to the network are
 * the two decisions here with real consequence, and reading the queue is a
 * reasonable thing for staff to do while deciding it is not.
 *
 * `kind` is required rather than inferred from the id. A KYC record is keyed by
 * user and a listing by its own id, and a route that guesses which table an
 * opaque string belongs to will eventually guess wrong on the one operation
 * where being wrong means verifying the wrong person.
 */
const ROLES = new Set(["ADMIN", "SUPER_ADMIN"]);

export async function POST(req: NextRequest) {
  const actor = await getCurrentUser();
  if (!actor || !ROLES.has(actor.role)) {
    return NextResponse.json({ error: "Admins only." }, { status: 403 });
  }

  let body: { kind?: string; id?: string; decision?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { kind, id, decision } = body;
  if (!id || (kind !== "kyc" && kind !== "listing")) {
    return NextResponse.json({ error: "Unknown item." }, { status: 400 });
  }
  if (decision !== "approve" && decision !== "reject") {
    return NextResponse.json({ error: "Decision must be approve or reject." }, { status: 400 });
  }

  const approved = decision === "approve";

  try {
    if (kind === "kyc") {
      await prisma.kycRecord.update({
        where: { userId: id },
        data: { status: approved ? "VERIFIED" : "REJECTED", reviewedAt: new Date() },
      });
    } else {
      // Rejecting returns a listing to DRAFT rather than deleting it — the
      // business can address what was wrong and resubmit, which is the whole
      // point of a review step.
      await prisma.listing.update({
        where: { id },
        data: { status: approved ? "LIVE" : "DRAFT" },
      });
      for (const locale of LOCALES) revalidatePath(`/${locale}/marketplace`, "page");
    }

    // The audit log is the record of who changed what. Written here rather than
    // in a wrapper so the entry cannot drift from the decision it describes.
    await prisma.auditLog
      .create({
        data: {
          actorId: actor.id,
          action: `${kind}.${decision}`,
          target: id,
        },
      })
      .catch(() => null);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "That item no longer exists." }, { status: 404 });
  }
}
