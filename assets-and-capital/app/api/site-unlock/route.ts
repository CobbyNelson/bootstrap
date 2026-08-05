import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { PREVIEW_COOKIE, PREVIEW_MAX_AGE, codeMatches, isLockEnabled, signPreviewToken } from "@/lib/site-lock";
import { rateLimit } from "@/lib/rate-limit";

/**
 * Exchange the bypass code for a signed preview cookie.
 *
 * This route is reachable while the site is locked (see isAllowedWhileLocked),
 * so it is the one publicly exposed surface during pre-launch and is rate
 * limited accordingly: 8 attempts per 10 minutes per IP. A short code with no
 * limit is guessable at HTTP speed.
 */
export async function POST(req: NextRequest) {
  if (!isLockEnabled()) {
    return NextResponse.json({ error: "The site is already public." }, { status: 400 });
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";

  const limit = rateLimit(`site-unlock:${ip}`, 8, 10 * 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many attempts. Try again shortly." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } },
    );
  }

  let code = "";
  try {
    const body = await req.json();
    code = typeof body?.code === "string" ? body.code : "";
  } catch {
    return NextResponse.json({ error: "That code was not recognised." }, { status: 400 });
  }

  if (!codeMatches(code)) {
    // Same wording as a malformed body: nothing here should help an attacker
    // distinguish "wrong code" from "wrong shape".
    return NextResponse.json({ error: "That code was not recognised." }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(PREVIEW_COOKIE, await signPreviewToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: PREVIEW_MAX_AGE,
  });
  return res;
}
