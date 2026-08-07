import "server-only";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/matching";

/**
 * The numbers behind the admin overview.
 *
 * Every panel on that page used to be a display constant — "$248M capital
 * facilitated", "482 active listings", "1,204 active investors", a hardcoded
 * approvals queue of three invented companies. It read as a working dashboard
 * and was a picture of one.
 *
 * These read the real tables. Most of them return zero today, and that is the
 * point: a dashboard that says 0 listings when there are 0 listings is telling
 * the truth, and the first real one will appear without anybody deploying.
 *
 * Every query degrades to an empty result if the database cannot answer, for
 * the same reason the public pages do — the admin should render with missing
 * panels rather than not render.
 */

async function safe<T>(run: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await run();
  } catch {
    return fallback;
  }
}

export type Kpis = {
  capitalFacilitatedUsd: number;
  activeListings: number;
  activeInvestors: number;
  pendingApprovals: number;
};

/**
 * Capital facilitated counts FUNDED commitments only.
 *
 * A soft commitment is an expression of intent that can evaporate, and putting
 * it in the headline number is how a platform ends up quoting a figure it
 * cannot substantiate. Money that actually moved is the only defensible
 * definition on a page someone will screenshot.
 */
export async function getKpis(): Promise<Kpis> {
  const [funded, listings, investors, kyc, review] = await Promise.all([
    safe(() => prisma.commitment.aggregate({ _sum: { amountUsd: true }, where: { status: "FUNDED" } }), {
      _sum: { amountUsd: null },
    }),
    safe(() => prisma.listing.count({ where: { status: "LIVE" } }), 0),
    safe(() => prisma.user.count({ where: { role: "INVESTOR" } }), 0),
    safe(() => prisma.kycRecord.count({ where: { status: "PENDING" } }), 0),
    safe(() => prisma.listing.count({ where: { status: "IN_REVIEW" } }), 0),
  ]);

  return {
    capitalFacilitatedUsd: funded._sum.amountUsd ?? 0,
    activeListings: listings,
    activeInvestors: investors,
    pendingApprovals: kyc + review,
  };
}

export type ApprovalItem = {
  kind: "kyc" | "listing";
  id: string;
  name: string;
  detail: string;
  createdAt: Date;
};

/**
 * The approvals queue, from the two things that can actually be approved.
 *
 * `kind` travels with the row because the two are decided by different actions
 * against different tables — deciding a listing as if it were a KYC record is
 * exactly the kind of mistake a single "id" column invites.
 */
export async function getApprovals(limit = 8): Promise<ApprovalItem[]> {
  const [kyc, listings] = await Promise.all([
    safe(
      () =>
        prisma.kycRecord.findMany({
          where: { status: "PENDING" },
          include: { user: { select: { name: true, email: true } } },
          orderBy: { createdAt: "desc" },
          take: limit,
        }),
      [],
    ),
    safe(
      () =>
        prisma.listing.findMany({
          where: { status: "IN_REVIEW" },
          include: { business: { select: { organization: { select: { legalName: true } } } } },
          orderBy: { createdAt: "desc" },
          take: limit,
        }),
      [],
    ),
  ]);

  const items: ApprovalItem[] = [
    ...kyc.map((k) => ({
      kind: "kyc" as const,
      id: k.userId,
      name: k.legalName || k.user?.name || k.user?.email || "Unnamed investor",
      detail: [k.country, k.accredited ? "accreditation claimed" : null].filter(Boolean).join(" · ") || "Identity verification",
      createdAt: k.createdAt,
    })),
    ...listings.map((l) => ({
      kind: "listing" as const,
      id: l.id,
      name: l.business?.organization?.legalName || l.title,
      detail: [l.region, l.askAmount ? `$${(l.askAmount / 1_000_000).toFixed(1)}M ask` : null]
        .filter(Boolean)
        .join(" · ") || "Business listing",
      createdAt: l.createdAt,
    })),
  ];

  return items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, limit);
}

export type ActivityRow = {
  id: string;
  name: string;
  sector: string;
  interest: number;
  tier: string;
  status: string;
  askUsd: number | null;
};

export async function getRecentListings(limit = 5): Promise<ActivityRow[]> {
  const rows = await safe(
    () =>
      prisma.listing.findMany({
        include: {
          business: { select: { organization: { select: { legalName: true } } } },
          industry: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
    [],
  );

  /*
   * Interest is keyed by SLUG, not by listing id.
   *
   * ListingInterest was built against the marketplace's static file, where a
   * slug is the identity — expressInterest(slug) is called from a URL. The
   * Listing table is the store those entries will eventually live in, and the
   * two are not joined today. Matching on the slugified title is the bridge
   * that works for both: it is what the public route already uses, so a listing
   * moved into the database keeps the interest expressed against it.
   */
  const interest = await safe(
    () => prisma.listingInterest.groupBy({ by: ["slug"], _count: { _all: true } }),
    [] as { slug: string; _count: { _all: number } }[],
  );
  const bySlug = new Map(interest.map((i) => [i.slug, i._count._all]));

  return rows.map((l) => ({
    id: l.id,
    name: l.business?.organization?.legalName || l.title,
    sector: l.industry?.name ?? "—",
    interest: bySlug.get(slugify(l.title)) ?? 0,
    tier: l.tier,
    status: l.status,
    askUsd: l.askAmount,
  }));
}

/** Commitments per month for the last 12 months, closed versus in pipeline. */
export async function getDealVolume(): Promise<{ month: string; closed: number; pipeline: number }[]> {
  const from = new Date();
  from.setMonth(from.getMonth() - 11);
  from.setDate(1);
  from.setHours(0, 0, 0, 0);

  const rows = await safe(
    () => prisma.commitment.findMany({ where: { createdAt: { gte: from } }, select: { createdAt: true, status: true } }),
    [],
  );

  const buckets = new Map<string, { closed: number; pipeline: number }>();
  for (let i = 0; i < 12; i++) {
    const d = new Date(from);
    d.setMonth(from.getMonth() + i);
    buckets.set(`${d.getFullYear()}-${d.getMonth()}`, { closed: 0, pipeline: 0 });
  }
  for (const r of rows) {
    const key = `${r.createdAt.getFullYear()}-${r.createdAt.getMonth()}`;
    const b = buckets.get(key);
    if (!b) continue;
    if (r.status === "FUNDED" || r.status === "SIGNED") b.closed++;
    else b.pipeline++;
  }

  return [...buckets.entries()].map(([key, v]) => {
    const [y, m] = key.split("-").map(Number);
    return { month: new Date(y, m, 1).toLocaleDateString("en", { month: "narrow" }), ...v };
  });
}

export type PaymentRow = { id: string; description: string; amountCents: number; currency: string; status: string; createdAt: Date };

export async function getRecentPayments(limit = 5): Promise<PaymentRow[]> {
  return safe(
    () =>
      prisma.payment.findMany({
        select: { id: true, description: true, amountCents: true, currency: true, status: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
    [],
  );
}

export type AuditRow = { id: string; action: string; target: string | null; actor: string; createdAt: Date };

export async function getAuditLog(limit = 8): Promise<AuditRow[]> {
  const rows = await safe(
    () =>
      prisma.auditLog.findMany({
        include: { actor: { select: { name: true, email: true } } },
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
    [],
  );
  return rows.map((r) => ({
    id: r.id,
    action: r.action,
    target: r.target,
    actor: r.actor?.name || r.actor?.email || "system",
    createdAt: r.createdAt,
  }));
}

/** Live listings by tier, for the donut. */
export async function getTierMix(): Promise<{ tier: string; count: number }[]> {
  const rows = await safe(
    () => prisma.listing.groupBy({ by: ["tier"], where: { status: "LIVE" }, _count: { _all: true } }),
    [] as { tier: string; _count: { _all: number } }[],
  );
  return rows.map((r) => ({ tier: String(r.tier), count: r._count._all }));
}
