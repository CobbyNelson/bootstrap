import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { isLocale, DEFAULT_LOCALE } from "@/lib/i18n/config";
import { invalidateTranslations, translatableStrings } from "@/lib/i18n/store";
import { machineTranslate, machineTranslationAvailable } from "@/lib/i18n/machine-translate";

/** Same gate as editing copy by hand: writing site text is an admin action. */
const ROLES = new Set(["ADMIN", "SUPER_ADMIN"]);

/**
 * Draft the missing translations for a locale.
 *
 * Only strings with NO row are touched. A human edit is never overwritten and
 * neither is an existing machine draft — re-running is therefore safe, and the
 * button can be pressed after every deploy without a translator losing work.
 *
 * Everything written is marked `machine: true`, which is what the editor's
 * "unreviewed" state reads. The point is not to finish the job: it is that a
 * string added today does not sit in English on the French site until someone
 * has time, and that the ones needing a human are listed rather than hidden
 * among the ones that do not.
 */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !ROLES.has(user.role)) {
    return NextResponse.json({ error: "Admins only." }, { status: 403 });
  }

  if (!machineTranslationAvailable()) {
    return NextResponse.json(
      {
        error:
          "Machine translation is not configured. Set ANTHROPIC_API_KEY on the server and restart, " +
          "or translate the missing entries by hand below.",
      },
      { status: 503 },
    );
  }

  let body: { locale?: string; limit?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const locale = body.locale;
  if (!locale || !isLocale(locale) || locale === DEFAULT_LOCALE) {
    return NextResponse.json({ error: "Pick a language to translate into." }, { status: 400 });
  }

  const registry = translatableStrings();
  const existing = await prisma.translation.findMany({
    where: { locale },
    select: { source: true },
  });
  const have = new Set(existing.map((r) => r.source));
  const contextOf = new Map(registry.map((r) => [r.source, r.context]));

  // Bounded per request so a click cannot run for minutes. The response says
  // how many remain, and the button can simply be pressed again.
  const limit = Math.min(Math.max(body.limit ?? 60, 1), 120);
  const missing = registry.map((r) => r.source).filter((s) => !have.has(s));
  const batch = missing.slice(0, limit);

  if (!batch.length) {
    return NextResponse.json({ translated: 0, rejected: 0, remaining: 0 });
  }

  let results;
  try {
    results = await machineTranslate(batch, locale);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Translation failed." },
      { status: 502 },
    );
  }

  for (const { source, value } of results) {
    await prisma.translation.upsert({
      where: { locale_source: { locale, source } },
      create: { locale, source, value, context: contextOf.get(source) ?? null, machine: true },
      // Guarded by the missing-only filter above, so this branch only runs if a
      // row appeared between the read and the write.
      update: {},
    });
  }

  invalidateTranslations();

  return NextResponse.json({
    translated: results.length,
    // Reported rather than swallowed: a rejected string is one whose
    // placeholders came back wrong, and a translator should know the machine
    // could not do those rather than assume they are done.
    rejected: batch.length - results.length,
    remaining: Math.max(0, missing.length - results.length),
  });
}
