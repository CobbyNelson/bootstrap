import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { isLocale, DEFAULT_LOCALE } from "@/lib/i18n/config";
import { invalidateTranslations } from "@/lib/i18n/store";

/** Editing site copy is an admin action, not a staff one. */
const ROLES = new Set(["ADMIN", "SUPER_ADMIN"]);

/**
 * Save translations.
 *
 * Takes a batch rather than one string at a time: a translator works down a
 * page and expects one Save, and a request per field would make a slow
 * connection feel like the form was fighting back.
 *
 * An empty value DELETES the row rather than storing "". That is what makes
 * "revert to the shipped translation" possible without a second control — the
 * fallback chain already handles an absent row.
 */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !ROLES.has(user.role)) {
    return NextResponse.json({ error: "Admins only." }, { status: 403 });
  }

  let body: { locale?: string; entries?: { source: string; value: string; context?: string }[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  const locale = String(body.locale ?? "");
  if (!isLocale(locale) || locale === DEFAULT_LOCALE) {
    // English is the source. Editing it here would silently orphan every
    // translation keyed to it, so it is refused rather than handled.
    return NextResponse.json(
      { error: "Pick a language other than English — English is the source text." },
      { status: 400 },
    );
  }

  const entries = Array.isArray(body.entries) ? body.entries.slice(0, 500) : [];
  let saved = 0;
  let cleared = 0;

  for (const e of entries) {
    const source = String(e.source ?? "").trim();
    if (!source) continue;
    const value = String(e.value ?? "").trim();

    if (!value) {
      const res = await prisma.translation.deleteMany({ where: { locale, source } });
      cleared += res.count;
      continue;
    }

    await prisma.translation.upsert({
      where: { locale_source: { locale, source } },
      // A human touched it, so it is no longer provisional.
      create: { locale, source, value, context: e.context ?? null, machine: false, updatedBy: user.id },
      update: { value, context: e.context ?? null, machine: false, updatedBy: user.id },
    });
    saved++;
  }

  // Pages are prerendered, so an edit is invisible until the cache is dropped.
  invalidateTranslations();

  return NextResponse.json({ ok: true, saved, cleared });
}
