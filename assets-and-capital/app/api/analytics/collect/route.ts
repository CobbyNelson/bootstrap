import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp, lookupGeo } from "@/lib/geo";
import {
  looksLikeBot,
  normalisePath,
  parseUserAgent,
  referrerHost,
  visitorKeys,
} from "@/lib/analytics-server";
import { SITE } from "@/lib/content";
import { CONSENT_COOKIE, parseConsent } from "@/lib/consent";

/**
 * First-party page-view collection.
 *
 * Answers with 204 in every case, including when it records nothing. The
 * browser has no business knowing whether a view was counted, and a beacon
 * that reports failure invites retries for something nobody should retry.
 *
 * Refuses to record when:
 *   - the visitor sent Do Not Track or Global Privacy Control
 *   - analytics consent has been declined
 *   - the user agent looks automated
 *   - the path is not a real page path
 *
 * The IP never lands in the database. It resolves a country and is discarded
 * inside this request.
 */

const NO_CONTENT = new NextResponse(null, { status: 204 });

export async function POST(req: NextRequest) {
  // Honour the browser-level signals before anything else, including consent:
  // a visitor who has expressed a preference in their browser should not have
  // to express it again in a banner.
  if (req.headers.get("dnt") === "1" || req.headers.get("sec-gpc") === "1") {
    return NO_CONTENT;
  }

  // Consent gate. The site's own banner has an "analytics" category; this is
  // the only thing that reads it, and a missing decision counts as no.
  const consent = parseConsent(req.cookies.get(CONSENT_COOKIE)?.value);
  if (!consent?.analytics) return NO_CONTENT;

  const ua = req.headers.get("user-agent") ?? "";
  if (looksLikeBot(ua)) return NO_CONTENT;

  const ip = clientIp(req.headers);

  // Generous, because a real visitor legitimately fires one of these per page.
  // It exists to stop a script writing rows all day, not to police browsing.
  if (!rateLimit(`av:${ip}`, 120, 60_000).ok) return NO_CONTENT;

  let body: { path?: string; referrer?: string | null; entry?: boolean };
  try {
    body = await req.json();
  } catch {
    return NO_CONTENT;
  }

  const path = normalisePath(String(body.path ?? ""));
  if (!path) return NO_CONTENT;

  // Never count the pre-launch gate or the admin area. The gate is not a page
  // anyone chose to visit, and staff traffic would drown real numbers.
  if (path === "/coming-soon" || path.startsWith("/admin") || path.startsWith("/api")) {
    return NO_CONTENT;
  }

  const { device, os, browser } = parseUserAgent(ua);
  const geo = lookupGeo(ip);
  const { visitorDay, sessionKey } = visitorKeys(ip, ua);

  try {
    // `entry` is claimed by the client but verified here: the first row for a
    // session wins, so a client that lies cannot inflate the visit count.
    const alreadySeen =
      (await prisma.pageView.count({ where: { sessionKey }, take: 1 })) > 0;

    await prisma.pageView.create({
      data: {
        path,
        referrerHost: referrerHost(body.referrer ?? null, SITE.domain),
        country: geo.country,
        region: geo.region,
        city: geo.city,
        device,
        os,
        browser,
        visitorDay,
        sessionKey,
        entry: !alreadySeen,
      },
    });
  } catch {
    // Analytics must never break a page. A failed write is a lost row.
  }

  return NO_CONTENT;
}
