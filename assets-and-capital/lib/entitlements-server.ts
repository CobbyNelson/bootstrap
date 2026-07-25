import "server-only";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

/**
 * Server-side source of truth for investor access.
 *
 *   core  → anyone (free)
 *   full  → active subscription        (full financials, compliance)
 *   deal  → subscription + interest    (AI profile, match rate)
 *   docs  → deal + signed NDA          (data room documents)
 *
 * Gated payloads must be resolved through this — never sent to the client and
 * hidden there. Degrades to the free tier if there's no session or the DB is
 * unreachable, so the marketplace always renders.
 */
export type Access = {
  signedIn: boolean;
  subscribed: boolean;
  plan: string | null;
  interested: boolean;
  ndaSigned: boolean;
  full: boolean;
  deal: boolean;
  docs: boolean;
};

const FREE: Access = {
  signedIn: false,
  subscribed: false,
  plan: null,
  interested: false,
  ndaSigned: false,
  full: false,
  deal: false,
  docs: false,
};

export async function getAccess(slug?: string): Promise<Access> {
  const user = await getCurrentUser();
  if (!user) return FREE;

  try {
    const [sub, interest, nda] = await Promise.all([
      prisma.investorSubscription.findUnique({ where: { userId: user.id } }),
      slug ? prisma.listingInterest.findUnique({ where: { userId_slug: { userId: user.id, slug } } }) : null,
      slug ? prisma.ndaSignature.findUnique({ where: { userId_slug: { userId: user.id, slug } } }) : null,
    ]);

    const subscribed = !!sub?.active;
    const interested = !!interest;
    const ndaSigned = !!nda;
    const deal = subscribed && interested;

    return {
      signedIn: true,
      subscribed,
      plan: sub?.plan ?? null,
      interested,
      ndaSigned,
      full: subscribed,
      deal,
      docs: deal && ndaSigned,
    };
  } catch (e) {
    console.error("getAccess failed", e);
    return { ...FREE, signedIn: true };
  }
}
