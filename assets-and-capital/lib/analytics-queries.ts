import "server-only";
import { prisma } from "@/lib/prisma";

/**
 * Read side of analytics.
 *
 * Every figure here is a GROUP BY over PageView. There is no rollup table yet
 * and deliberately so: at this site's volume the aggregate is milliseconds, and
 * a rollup is a second source of truth that can drift from the rows it claims
 * to summarise. Add one when a query gets slow, not before.
 *
 * "Visitors" counts distinct visitorDay, which is unique-per-day by
 * construction — so a visitor across two days is two. That is the honest
 * reading of a metric built to forget people overnight, and the dashboard says
 * so rather than implying otherwise.
 */

export type Range = 7 | 30 | 90;

export type Point = { date: string; visitors: number; views: number };
export type Row = { label: string; value: number };

export type Summary = {
  visitors: number;
  views: number;
  visits: number;
  viewsPerVisit: number;
  /** Share of visits that were a single page, as a percentage. */
  bounceRate: number;
};

function since(days: Range): Date {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - (days - 1));
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export async function getSummary(days: Range): Promise<Summary> {
  const from = since(days);

  const [views, visitorRows, visits, singlePageVisits] = await Promise.all([
    prisma.pageView.count({ where: { createdAt: { gte: from } } }),
    prisma.pageView.findMany({
      where: { createdAt: { gte: from } },
      distinct: ["visitorDay"],
      select: { visitorDay: true },
    }),
    prisma.pageView.count({ where: { createdAt: { gte: from }, entry: true } }),
    // A bounce is a session with exactly one view. Counting it here rather
    // than storing it keeps the raw rows free of derived state.
    prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*)::bigint AS count FROM (
        SELECT "sessionKey" FROM "PageView"
        WHERE "createdAt" >= ${from}
        GROUP BY "sessionKey" HAVING COUNT(*) = 1
      ) s
    `,
  ]);

  const bounces = Number(singlePageVisits[0]?.count ?? 0);
  return {
    visitors: visitorRows.length,
    views,
    visits,
    viewsPerVisit: visits ? Math.round((views / visits) * 10) / 10 : 0,
    bounceRate: visits ? Math.round((bounces / visits) * 100) : 0,
  };
}

/** Daily series, with empty days filled in so the chart has no gaps. */
export async function getSeries(days: Range): Promise<Point[]> {
  const from = since(days);

  const rows = await prisma.$queryRaw<{ day: Date; visitors: bigint; views: bigint }[]>`
    SELECT date_trunc('day', "createdAt") AS day,
           COUNT(DISTINCT "visitorDay")::bigint AS visitors,
           COUNT(*)::bigint AS views
    FROM "PageView"
    WHERE "createdAt" >= ${from}
    GROUP BY 1
    ORDER BY 1
  `;

  const byDay = new Map(
    rows.map((r) => [r.day.toISOString().slice(0, 10), { v: Number(r.visitors), w: Number(r.views) }]),
  );

  // A day with no traffic is a real zero, not a missing point. Without this the
  // line would join across the gap and imply activity that never happened.
  const out: Point[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(from);
    d.setUTCDate(d.getUTCDate() + i);
    const key = d.toISOString().slice(0, 10);
    const hit = byDay.get(key);
    out.push({ date: key, visitors: hit?.v ?? 0, views: hit?.w ?? 0 });
  }
  return out;
}

async function topBy(
  column: "path" | "country" | "city" | "region" | "device" | "browser" | "os" | "referrerHost",
  days: Range,
  limit = 8,
): Promise<Row[]> {
  const from = since(days);
  const rows = await prisma.pageView.groupBy({
    by: [column],
    where: { createdAt: { gte: from }, ...(column !== "path" ? { [column]: { not: null } } : {}) },
    _count: { _all: true },
    orderBy: { _count: { [column]: "desc" } },
    take: limit,
  });
  return rows
    .map((r) => ({
      label: String((r as Record<string, unknown>)[column] ?? "Unknown"),
      value: r._count._all,
    }))
    .filter((r) => r.label !== "null");
}

export async function getBreakdowns(days: Range) {
  const [pages, countries, cities, devices, browsers, referrers] = await Promise.all([
    topBy("path", days, 10),
    topBy("country", days, 8),
    topBy("city", days, 8),
    topBy("device", days, 3),
    topBy("browser", days, 6),
    topBy("referrerHost", days, 8),
  ]);
  return { pages, countries, cities, devices, browsers, referrers };
}

/** Rows older than this are deleted by the retention job. */
export const RETENTION_DAYS = 400;
