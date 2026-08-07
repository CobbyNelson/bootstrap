import "server-only";
import { prisma } from "@/lib/prisma";
import { slugify, getOpportunityBySlug } from "@/lib/matching";
import { getCurrentUser } from "@/lib/session";
import type { SessionUser } from "@/lib/session";

/**
 * What the investor and business portals actually know about you.
 *
 * Every page under /dashboard was a picture of a working product. The investor
 * home greeted "Aurora" to whoever signed in, over KPIs of 9 / 12 / 34 / 2 that
 * were literals in the markup; the business home showed "Accra FinPay", 1,284
 * views and a $9.6M raise to every business account, with four named investors
 * politely queued in a table. Fourteen routes, zero database references.
 *
 * These read what is really there. Six models have genuine write paths and are
 * wired here — saved listings, expressions of interest, commitments, KYC
 * records, NDA signatures and payment intents. Everything they return is
 * scoped to the caller by session, never by a client-supplied id, because a
 * portal is exactly where one account reading another's numbers would matter.
 *
 * Most of them return zero today. That is the point: a raise progress bar that
 * says nothing is soft-circled when nothing is soft-circled is telling the
 * truth, and the first real commitment will appear without a deploy.
 *
 * Every query degrades to an empty result rather than throwing, matching the
 * public pages and the admin: a portal should render with a missing panel
 * instead of returning a 500 to somebody who is signed in.
 */

async function safe<T>(run: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await run();
  } catch {
    return fallback;
  }
}

/* --------------------------------------------------------------- identity */

export type PortalIdentity = {
  id: string;
  name: string;
  email: string;
  /**
   * The workspace this account belongs in.
   *
   * The shell used to derive this from the URL — `isBusiness` was
   * `pathname.startsWith("/dashboard/business")` — which meant the workspace
   * you saw was decided by the address you typed rather than the account you
   * signed in with. An investor visiting a business URL got the business
   * sidebar and the business identity card.
   */
  kind: "investor" | "business";
  /**
   * The account's actual role, spelled out.
   *
   * Distinct from `kind`, which only says which workspace to render. Staff read
   * the portal as investors, so a Super admin was being labelled "Investor
   * account" in the header chip — the one place whose job is to say who you are.
   */
  roleLabel: string;
  orgName: string | null;
  initials: string;
};

export function initialsOf(name: string | null, email: string): string {
  return (
    (name || email)
      .split(/[\s@.]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

const ROLE_LABEL: Record<string, string> = {
  INVESTOR: "Investor",
  BUSINESS: "Business",
  ADMIN: "Admin",
  SUPER_ADMIN: "Super admin",
  STAFF: "Staff",
};

/** Staff opening a portal page read it as investors — they have no mandate. */
function kindOf(role: string): "investor" | "business" {
  return role === "BUSINESS" ? "business" : "investor";
}

export async function getPortalIdentity(): Promise<PortalIdentity | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const org = await safe(
    () =>
      prisma.user
        .findUnique({ where: { id: user.id }, select: { organization: { select: { legalName: true } } } })
        .then((u) => u?.organization?.legalName ?? null),
    null,
  );

  return {
    id: user.id,
    name: user.name || user.email,
    email: user.email,
    kind: kindOf(user.role),
    roleLabel: ROLE_LABEL[user.role] ?? user.role,
    orgName: org,
    initials: initialsOf(user.name, user.email),
  };
}

/* ------------------------------------------------------- investor portal */

export type SavedRow = { slug: string; name: string; sector: string; ask: string; match: number };

/**
 * Saved opportunities, from the database rather than this browser.
 *
 * The saved page read `localStorage` through `useSaved()`, so a list built on a
 * laptop was invisible on a phone and one cleared cache erased it. The rows are
 * written by `toggleSaved` in lib/actions/entitlements.ts and have been all
 * along — nothing was reading them back.
 */
export async function getSavedListings(user: SessionUser): Promise<SavedRow[]> {
  const rows = await safe(
    () =>
      prisma.savedListing.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        select: { slug: true },
      }),
    [] as { slug: string }[],
  );

  return rows.flatMap((r) => {
    const o = getOpportunityBySlug(r.slug);
    return o ? [{ slug: r.slug, name: o.name, sector: o.sector, ask: o.ask, match: o.match }] : [];
  });
}

export type CommitmentRow = {
  id: string;
  slug: string;
  name: string;
  amountUsd: number;
  status: string;
  createdAt: Date;
};

export async function getCommitments(user: SessionUser): Promise<CommitmentRow[]> {
  const rows = await safe(
    () =>
      prisma.commitment.findMany({
        where: { userId: user.id, status: { not: "WITHDRAWN" } },
        orderBy: { createdAt: "desc" },
        select: { id: true, slug: true, amountUsd: true, status: true, createdAt: true },
      }),
    [] as { id: string; slug: string; amountUsd: number; status: string; createdAt: Date }[],
  );

  return rows.map((r) => ({
    ...r,
    name: getOpportunityBySlug(r.slug)?.name ?? r.slug,
  }));
}

export type InvestorHome = {
  saved: SavedRow[];
  savedCount: number;
  interestCount: number;
  commitments: CommitmentRow[];
  committedUsd: number;
  ndaCount: number;
  kycStatus: string;
};

export async function getInvestorHome(user: SessionUser): Promise<InvestorHome> {
  const [saved, interestCount, commitments, ndaCount, kyc] = await Promise.all([
    getSavedListings(user),
    safe(() => prisma.listingInterest.count({ where: { userId: user.id } }), 0),
    getCommitments(user),
    safe(() => prisma.ndaSignature.count({ where: { userId: user.id } }), 0),
    safe(
      () => prisma.kycRecord.findUnique({ where: { userId: user.id }, select: { status: true } }),
      null as { status: string } | null,
    ),
  ]);

  return {
    saved,
    savedCount: saved.length,
    interestCount,
    commitments,
    // Soft commitments are intent, not money. They are summed separately from
    // the admin's "capital facilitated", which counts FUNDED only — an investor
    // should see what they have pledged, the platform should count what landed.
    committedUsd: commitments.reduce((n, c) => n + c.amountUsd, 0),
    ndaCount,
    kycStatus: kyc?.status ?? "NOT_STARTED",
  };
}

/* ------------------------------------------------------- business portal */

export type InterestRow = { name: string; email: string; kind: string; at: Date };

export type BusinessHome = {
  listingTitle: string | null;
  /** The marketplace slug this listing joins on: slugify(title). */
  slug: string | null;
  tier: string | null;
  status: string | null;
  views: number;
  askUsd: number | null;
  savedCount: number;
  interest: InterestRow[];
  ndaCount: number;
  commitments: CommitmentRow[];
  committedUsd: number;
  kycStatus: string;
};

const EMPTY_BUSINESS: BusinessHome = {
  listingTitle: null,
  slug: null,
  tier: null,
  status: null,
  views: 0,
  askUsd: null,
  savedCount: 0,
  interest: [],
  ndaCount: 0,
  commitments: [],
  committedUsd: 0,
  kycStatus: "NOT_STARTED",
};

/**
 * A business account's own listing and the real traffic against it.
 *
 * The join is `Listing.title → slugify(title) → marketplace slug`, the same
 * bridge lib/business-listing.ts already uses, because interest, saves, NDAs
 * and commitments are all recorded against the marketplace slug while the
 * listing itself lives in the database.
 *
 * Everything returned is about THIS account's listing. The interest table
 * names the investors who asked — which is the account's own inbound, not a
 * directory of platform investors, and is why it is scoped through the org
 * rather than queried across the table.
 */
export async function getBusinessHome(user: SessionUser): Promise<BusinessHome> {
  const listing = await safe(
    () =>
      prisma.user
        .findUnique({
          where: { id: user.id },
          select: {
            organization: {
              select: {
                business: {
                  select: {
                    listings: {
                      take: 1,
                      orderBy: { createdAt: "asc" },
                      select: { title: true, tier: true, status: true, views: true, askAmount: true },
                    },
                  },
                },
              },
            },
          },
        })
        .then((u) => u?.organization?.business?.listings[0] ?? null),
    null,
  );

  const kycStatus = await safe(
    () =>
      prisma.kycRecord
        .findUnique({ where: { userId: user.id }, select: { status: true } })
        .then((k) => k?.status ?? "NOT_STARTED"),
    "NOT_STARTED",
  );

  if (!listing) return { ...EMPTY_BUSINESS, kycStatus };

  const slug = slugify(listing.title);

  const [savedCount, interestRows, ndaCount, commitRows] = await Promise.all([
    safe(() => prisma.savedListing.count({ where: { slug } }), 0),
    safe(
      () =>
        prisma.listingInterest.findMany({
          where: { slug },
          orderBy: { createdAt: "desc" },
          take: 25,
          select: { createdAt: true, user: { select: { name: true, email: true, role: true } } },
        }),
      [] as { createdAt: Date; user: { name: string | null; email: string; role: string } }[],
    ),
    safe(() => prisma.ndaSignature.count({ where: { slug } }), 0),
    safe(
      () =>
        prisma.commitment.findMany({
          where: { slug, status: { not: "WITHDRAWN" } },
          orderBy: { createdAt: "desc" },
          select: { id: true, slug: true, amountUsd: true, status: true, createdAt: true },
        }),
      [] as { id: string; slug: string; amountUsd: number; status: string; createdAt: Date }[],
    ),
  ]);

  const commitments = commitRows.map((c) => ({ ...c, name: getOpportunityBySlug(c.slug)?.name ?? c.slug }));

  return {
    listingTitle: listing.title,
    slug,
    tier: listing.tier,
    status: listing.status,
    views: listing.views,
    askUsd: listing.askAmount,
    savedCount,
    interest: interestRows.map((r) => ({
      name: r.user.name || r.user.email,
      email: r.user.email,
      kind: r.user.role === "BUSINESS" ? "Business" : "Investor",
      at: r.createdAt,
    })),
    ndaCount,
    commitments,
    committedUsd: commitments.reduce((n, c) => n + c.amountUsd, 0),
    kycStatus,
  };
}

/* --------------------------------------------------------------- shared */

export type VerificationState = {
  status: string;
  legalName: string | null;
  country: string | null;
  accredited: boolean;
  sanctionsClear: boolean;
  reviewedAt: Date | null;
  updatedAt: Date | null;
};

export async function getVerification(user: SessionUser): Promise<VerificationState> {
  const k = await safe(
    () =>
      prisma.kycRecord.findUnique({
        where: { userId: user.id },
        select: {
          status: true,
          legalName: true,
          country: true,
          accredited: true,
          sanctionsClear: true,
          reviewedAt: true,
          updatedAt: true,
        },
      }),
    null,
  );

  return {
    status: k?.status ?? "NOT_STARTED",
    legalName: k?.legalName ?? null,
    country: k?.country ?? null,
    accredited: k?.accredited ?? false,
    sanctionsClear: k?.sanctionsClear ?? false,
    reviewedAt: k?.reviewedAt ?? null,
    updatedAt: k?.updatedAt ?? null,
  };
}

export type BillingState = {
  tier: string | null;
  active: boolean;
  renewsAt: Date | null;
  intents: { reference: string; plan: string; amountLabel: string; status: string; provider: string; testMode: boolean; createdAt: Date }[];
};

/**
 * What this account has actually been charged.
 *
 * The billing page listed three invoices — INV-2041, INV-2088, INV-2131 — to
 * every business that opened it, one of them helpfully marked "Due". Real
 * charges live in PaymentIntent, written by lib/payments-server.ts when a
 * checkout starts, and the org's plan lives in Subscription.
 *
 * `testMode` is surfaced rather than hidden: while no provider keys are set
 * every intent is a simulation, and a billing page that cannot say so is the
 * same lie in a smaller font.
 */
export async function getBilling(user: SessionUser): Promise<BillingState> {
  const [sub, intents] = await Promise.all([
    safe(
      () =>
        prisma.user
          .findUnique({
            where: { id: user.id },
            select: {
              organization: {
                select: { subscription: { select: { tier: true, active: true, renewsAt: true } } },
              },
            },
          })
          .then((u) => u?.organization?.subscription ?? null),
      null,
    ),
    safe(
      () =>
        prisma.paymentIntent.findMany({
          where: { userId: user.id },
          orderBy: { createdAt: "desc" },
          take: 25,
          select: {
            reference: true,
            plan: true,
            amountLabel: true,
            status: true,
            provider: true,
            testMode: true,
            createdAt: true,
          },
        }),
      [] as BillingState["intents"],
    ),
  ]);

  return {
    tier: sub?.tier ?? null,
    active: sub?.active ?? false,
    renewsAt: sub?.renewsAt ?? null,
    intents,
  };
}

/* ------------------------------------------------------------- messages */

export type ThreadMessage = { id: string; from: "you" | "team"; body: string; at: Date };

/**
 * The account's real conversation with the A&C team.
 *
 * The Messages page rendered three invented threads from a `CONVOS` constant.
 * The obvious model to wire it to — `Message` — has `threadId`, `senderId` and
 * a body, but no recipient, so there is no way to ask which threads belong to
 * you; nothing has ever written a row to it either.
 *
 * The messages that DO exist are the account's chat with the deal team, which
 * staff answer from the admin desk. That is the real channel — A&C brokers
 * introductions rather than putting investors and businesses in a DM — so the
 * inbox reads from there rather than from a table that would be empty forever.
 */
export async function getThread(user: SessionUser): Promise<ThreadMessage[]> {
  const convo = await safe(
    () =>
      prisma.chatConversation.findFirst({
        where: { userId: user.id },
        orderBy: { updatedAt: "desc" },
        select: {
          messages: {
            orderBy: { createdAt: "asc" },
            take: 200,
            select: { id: true, role: true, body: true, createdAt: true },
          },
        },
      }),
    null,
  );

  return (convo?.messages ?? []).map((m) => ({
    id: m.id,
    from: m.role === "VISITOR" ? ("you" as const) : ("team" as const),
    body: m.body,
    at: m.createdAt,
  }));
}

/* ------------------------------------------------------------ data room */

export type DataRoomEntry = { slug: string; name: string; signedAt: Date; docs: number };

/**
 * The data rooms this account has unlocked.
 *
 * Access is the NDA signature, which is real and written by `signNda`. The
 * documents inside are not: nothing in the codebase uploads a Document or a
 * DataRoomDocument, so the count is honestly zero until a business uploads
 * one — rather than the three named PDFs the page used to list for everybody.
 */
export async function getDataRooms(user: SessionUser): Promise<DataRoomEntry[]> {
  const signed = await safe(
    () =>
      prisma.ndaSignature.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        select: { slug: true, createdAt: true },
      }),
    [] as { slug: string; createdAt: Date }[],
  );
  if (signed.length === 0) return [];

  const counts = await safe(
    () => prisma.dataRoomDocument.groupBy({ by: ["slug"], _count: { _all: true } }),
    [] as { slug: string; _count: { _all: number } }[],
  );
  const byslug = new Map(counts.map((c) => [c.slug, c._count._all]));

  return signed.map((s) => ({
    slug: s.slug,
    name: getOpportunityBySlug(s.slug)?.name ?? s.slug,
    signedAt: s.createdAt,
    docs: byslug.get(s.slug) ?? 0,
  }));
}

/* -------------------------------------------------------------- settings */

export type TeamMember = { id: string; name: string; email: string; role: string; you: boolean };

export type AccountSettingsData = {
  name: string;
  email: string;
  roleLabel: string;
  orgName: string | null;
  memberSince: Date | null;
  emailVerified: boolean;
  team: TeamMember[];
};

/**
 * The account, and who else is on it.
 *
 * The settings page invented three active devices with IP addresses and cities,
 * a login history that included "Blocked sign-in attempt · Unknown · TOR exit",
 * and a four-person team at a firm that does not exist — with Change, Revoke,
 * Invite member and "Sign out all others" all inert.
 *
 * Fabricating a blocked intrusion attempt is worse than an empty page: somebody
 * reading that would reasonably change their password, or call us.
 *
 * Sessions and login history are dropped rather than wired — the platform holds
 * one signed cookie and keeps no session or sign-in table, so there is nothing
 * truthful to show. The team list is real: it is the other users on the same
 * organisation.
 */
export async function getAccountSettings(user: SessionUser): Promise<AccountSettingsData> {
  const row = await safe(
    () =>
      prisma.user.findUnique({
        where: { id: user.id },
        select: {
          name: true,
          email: true,
          role: true,
          createdAt: true,
          emailVerified: true,
          organization: {
            select: {
              legalName: true,
              users: {
                select: { id: true, name: true, email: true, role: true },
                orderBy: { createdAt: "asc" },
                take: 20,
              },
            },
          },
        },
      }),
    null,
  );

  return {
    name: row?.name || user.name || user.email,
    email: row?.email ?? user.email,
    roleLabel: ROLE_LABEL[row?.role ?? user.role] ?? (row?.role ?? user.role),
    orgName: row?.organization?.legalName ?? null,
    memberSince: row?.createdAt ?? null,
    emailVerified: Boolean(row?.emailVerified),
    team: (row?.organization?.users ?? []).map((u) => ({
      id: u.id,
      name: u.name || u.email,
      email: u.email,
      role: ROLE_LABEL[u.role] ?? u.role,
      you: u.id === user.id,
    })),
  };
}
